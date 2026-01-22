import { Question } from '@/context/QuizContext';

export interface AIQuestionResponse {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    timeLimitSeconds: number;
}

export interface AIRootResponse {
    topic: string;
    questions: AIQuestionResponse[];
}

/**
 * AI Service to handle high-quality MCQ generation via backend.
 */
export const aiService = {
    /**
     * Calls the backend API to generate questions.
     */
    generateQuestions: async (params: {
        topic: string;
        count: number;
        difficulty: 'easy' | 'medium' | 'hard';
        marks: number;
        timeLimitSeconds: number;
    }): Promise<AIRootResponse | null> => {
        try {
            const response = await fetch('http://localhost:5000/api/ai/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("AI Generation failed:", errorData.error);
                return null;
            }

            return await response.json() as AIRootResponse;
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
                explanation: "" // Explanation is not in the new enforced format but can be added if needed
            };
        });
    }
};
