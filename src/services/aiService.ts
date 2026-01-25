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
const HEALTH_CHECK_URL = 'http://localhost:5000/health';

/**
 * AI Service to handle high-quality MCQ generation via backend.
 * Now configured to use local Ollama backend.
 */
export const aiService = {
    /**
     * Check if the backend server is running and accessible.
     */
    checkServerHealth: async (): Promise<{ isHealthy: boolean; message: string }> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch(HEALTH_CHECK_URL, {
                signal: controller.signal,
                method: 'GET',
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { isHealthy: true, message: 'Server is running' };
            } else {
                return { isHealthy: false, message: 'Server returned an error' };
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                return {
                    isHealthy: false,
                    message: 'Backend server is not responding. Please start the server:\n\n1. Open a new terminal\n2. Navigate to the server folder\n3. Run: npm run dev'
                };
            }
            return {
                isHealthy: false,
                message: `Backend server is not running on port 5000. Please start it first.\n\nError: ${error.message}`
            };
        }
    },
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
        console.log("Mapping AI Response Data:", aiData);
        return aiData.map((item, index) => {
            // Safety check for options and correct index
            const safeOptions = Array.isArray(item.options) ? item.options : [];
            const safeCorrectIndex = (typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex < safeOptions.length)
                ? item.correctIndex
                : 0;

            return {
                id: `ai-q-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                quizId: quizId,
                questionText: item.question || "Generated Question",
                options: safeOptions.length > 0 ? safeOptions : ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctAnswer: safeOptions[safeCorrectIndex] || (safeOptions.length > 0 ? safeOptions[0] : ""),
                marks: item.marks || 1,
                timeLimitMinutes: (item.timeLimitSeconds || 60) / 60,
                explanation: item.explanation || ""
            };
        });
    }
};
