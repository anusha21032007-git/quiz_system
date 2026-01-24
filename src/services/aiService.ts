import { Question } from '@/context/QuizContext';

export interface AIQuestionResponse {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    timeLimitSeconds: number;
    explanation?: string;
}

export interface AIRootResponse {
    topic: string;
    questions: AIQuestionResponse[];
}

const BACKEND_URL = 'http://localhost:5000/api/ai/generate-questions';

/**
 * AI Service to handle high-quality MCQ generation via backend.
 * Now configured to use local Ollama backend.
 */
export const aiService = {
    /**
     * Calls the local backend API to generate questions.
     */
    generateQuestions: async (params: {
        topic: string;
        count: number;
        difficulty: 'easy' | 'medium' | 'hard';
        marks: number;
        timeLimitSeconds: number;
        optionsCount: number;
    }): Promise<AIRootResponse | null> => {
        try {
            console.log(`Requesting MCQ generation for: ${params.topic}...`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("AI Generation API failed:", errorData);
                return null;
            }

            const data = await response.json();
            return data as AIRootResponse;
        } catch (error) {
            console.error("Error calling AI backend:", error);
            return null;
        }
    },

    /**
     * Maps the AI response format to the application's Question interface.
     */
    mapResponseToQuestions: (aiData: AIQuestionResponse[], quizId: string): Question[] => {
        return aiData.map((item, index) => {
            return {
                id: `ai-q-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                quizId: quizId,
                questionText: item.question,
                options: item.options,
                correctAnswer: item.options[item.correctIndex],
                marks: item.marks,
                timeLimitMinutes: item.timeLimitSeconds / 60,
                explanation: item.explanation || ""
            };
        });
    }
};
