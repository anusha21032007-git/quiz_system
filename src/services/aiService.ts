import { Question } from '@/context/QuizContext';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIQuestionResponse {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    marks: number;
    rationale: string;
}

export interface AIRootResponse {
    subject: string;
    questions: AIQuestionResponse[];
}

/**
 * AI Service to handle high-quality MCQ generation.
 * This service implements the logic requested by the "Expert Question Setter".
 */
export const aiService = {
    /**
     * Constructs the prompt for the AI model.
     */
    generatePrompt: (params: {
        subjectName: string;
        totalQuestions: number;
        mcqOptions: number;
        difficulty: string;
        marksPerQuestion: number;
        timePerQuestionSeconds: number;
    }) => {
        return `You are an expert university-level question paper setter.

TASK:
Generate EXACTLY ${params.totalQuestions} high-quality MCQ questions for the subject: "${params.subjectName}".

STRICT RULES:
1) Questions must be strictly related to "${params.subjectName}" only.
2) Difficulty level: ${params.difficulty.toUpperCase()}.
   - EASY: Focus on basic definitions, direct concepts, and fundamental identification.
   - MEDIUM: Focus on application of concepts, scenario-based identification, and comparing related ideas.
   - HARD: Focus on deep analysis, complex scenarios, edge cases, and architectural/design implications.
3) Do not generate vague or generic questions like:
   "Assess the paradigm shifts", "Contemporary trends", "Unrecognized category", etc.
4) Each question must test real understanding (concept + application).
5) Each question must have exactly ${params.mcqOptions} options.
5) Only ONE option must be correct.
6) Wrong options must be realistic and closely related (not random words).
7) No repeated questions.
8) No spelling mistakes or grammar errors.
9) Do not include "All of the above" or "None of the above".
10) Option Quality Rules:
    - All 4 options must be same type (all statements or all terms).
    - Wrong options must be believable and not obviously wrong (strong distractors).
    - Keep options short and clean.
11) Output must be ONLY valid JSON (no markdown, no extra text).

SUBJECT FOCUS (If OOPS):
If topic is OOPS, focus on: Class, Object, Inheritance, Polymorphism, Encapsulation, Abstraction, Interface, Abstract class, Overloading, Overriding, Constructors, Access modifiers, this/super.
STRICT EXCLUSIONS: No DSA, time complexity, CI/CD, web, or databases unless explicitly part of the subject.

OUTPUT FORMAT (JSON ONLY):
{
  "subject": "${params.subjectName}",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "marks": ${params.marksPerQuestion},
      "rationale": "one short line why correct"
    }
  ]
}

FINAL VALIDATION BEFORE OUTPUT:
- Ensure every question is relevant to "${params.subjectName}"
- Ensure options match the question topic
- Ensure correctIndex points to the correct option
- If any question fails, regenerate it internally before returning final JSON.`;
    },

    /**
     * Constructs the validation prompt for the AI model to clean up and correct questions.
     */
    generateValidationPrompt: (questionsJson: string, subject: string, difficulty: string) => {
        return `You are a strict university-level MCQ validator.

I will give you MCQ questions in JSON.
Your job:
1) Difficulty Level: ${difficulty.toUpperCase()}. Ensure all questions match this level.
   - EASY: Basic concepts/definitions.
   - MEDIUM: Application/Scenario-based.
   - HARD: Deep analysis/Complex scenarios.
2) Remove irrelevant questions (not matching the subject: "${subject}").
3) Fix wrong answers if any.
4) Replace weak or unclear questions with better ones.
5) Ensure every question has exactly 4 options.
6) Ensure only ONE correct option.
7) Output must remain valid JSON only.
8) Ensure the "rationale" field is a short, logical explanation of the correct answer.
9) Option Consistency: Ensure all options for a question are of the same grammatical type and length.
10) Distractor Quality: Ensure wrong options are plausible academic misconceptions.

Return the corrected JSON in the SAME format provided.

INPUT JSON:
${questionsJson}`;
    },

    /**
     * Performs validation on generated questions to ensure they meet strict criteria.
     */
    validateQuestions: (questions: AIQuestionResponse[], subject: string): { valid: AIQuestionResponse[], invalid: AIQuestionResponse[] } => {
        const valid: AIQuestionResponse[] = [];
        const invalid: AIQuestionResponse[] = [];
        const subjectLower = subject.toLowerCase();

        questions.forEach(q => {
            // 1. Topic Match (Keyword check)
            const questionLower = q.question.toLowerCase();
            const optionsValues = q.options.map(o => o.toLowerCase());

            const matchesTopic = questionLower.includes(subjectLower) ||
                subjectLower.split(' ').some(word => word.length > 3 && questionLower.includes(word));

            // 2. Exact answers and non-empty options
            const hasCorrectIndex = q.correctIndex >= 0 && q.correctIndex < q.options.length;
            const allOptionsFilled = optionsValues.length > 0 && optionsValues.every(opt => opt.trim().length > 0);
            const noDuplicateOptions = new Set(optionsValues).size === optionsValues.length;

            // Note: Explanation is no longer required per new strict rules
            if (matchesTopic && hasCorrectIndex && allOptionsFilled && noDuplicateOptions) {
                valid.push(q);
            } else {
                invalid.push(q);
            }
        });

        return { valid, invalid };
    },

    /**
     * Internal method to call the Gemini API.
     */
    callGeminiAPI: async (prompt: string): Promise<AIRootResponse | null> => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Gemini API Key is missing in .env");
            return null;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up the response text - sometimes Gemini wraps JSON in markdown blocks
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(cleanText) as AIRootResponse;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return null;
        }
    },

    /**
     * Maps the AI response format to the application's Question interface.
     */
    mapResponseToQuestions: (aiData: AIQuestionResponse[], quizId: string, marks: number, timeLimit: number): Question[] => {
        return aiData.map((item, index) => {
            return {
                id: `ai-q-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                quizId: quizId,
                questionText: item.question,
                options: item.options,
                correctAnswer: item.options[item.correctIndex],
                marks: item.marks || marks,
                timeLimitMinutes: timeLimit / 60,
                explanation: item.rationale || ""
            };
        });
    }
};
