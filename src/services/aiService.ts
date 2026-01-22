import { Question } from '@/context/QuizContext';
import { supabase } from '@/integrations/supabase/client';

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
        optionsCount: number;
    }): Promise<AIRootResponse | null> => {
        try {
            const { data, error } = await supabase.functions.invoke('generate-quiz-questions', {
                body: params,
            });

            if (error) {
                console.error("AI Generation failed:", error);
                return null;
            }

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
