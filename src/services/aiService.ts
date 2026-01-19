import { Question } from '@/context/QuizContext';

export interface AIQuestionResponse {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
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
        marksPerQuestion: number;
        timePerQuestionSeconds: number;
    }) => {
        return `You are an expert question paper setter and evaluator.

TASK:
Generate EXACTLY ${params.totalQuestions} high-quality MCQ questions for the subject: "${params.subjectName}".

RULES (VERY STRICT):
1. Each question MUST be 100% relevant to "${params.subjectName}" only.
2. Do NOT generate unrelated options (example: time complexity options for Java OOP).
3. Each question MUST be clear, correct, and exam-level.
4. Each question must have EXACTLY ${params.mcqOptions} options.
5. Only ONE option must be correct.
6. Options must be realistic and confusing but valid.
7. Avoid vague questions like "Analyze..." unless it is actually MCQ.
8. Difficulty should be: Medium to Hard.
9. Do not repeat questions.
10. If the topic is "OOPS", include: Class, Object, Inheritance, Polymorphism, Abstraction, Encapsulation, Interface vs Abstract class, Method Overloading/Overriding, Constructor, this/super, Access modifiers.
11. Every question must include a short explanation for why the answer is correct.

OUTPUT FORMAT:
Return ONLY valid JSON (no extra text, no markdown).
JSON schema:

{
  "subject": "${params.subjectName}",
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

FINAL CHECK BEFORE OUTPUT:
- Verify every question and all options belong to "${params.subjectName}"
- Verify correctIndex matches the correct option
- Verify JSON is valid`;
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
            const hasExplanation = q.explanation && q.explanation.trim().length > 10;

            if (matchesTopic && hasCorrectIndex && allOptionsFilled && noDuplicateOptions && hasExplanation) {
                valid.push(q);
            } else {
                invalid.push(q);
            }
        });

        return { valid, invalid };
    },

    /**
     * Maps the AI response format to the application's Question interface.
     */
    mapResponseToQuestions: (aiData: AIQuestionResponse[], quizId: string, marks: number, timeLimit: number): Question[] => {
        return aiData.map((item, index) => {
            return {
                id: `ai-q-${Date.now()}-${index}`,
                quizId: quizId,
                questionText: item.question,
                options: item.options,
                correctAnswer: item.options[item.correctIndex],
                marks: marks,
                timeLimitMinutes: timeLimit / 60,
                explanation: item.explanation
            };
        });
    }
};
