
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { toast } from "sonner";
import { QuizAttempt } from "@/context/QuizContext";

// --- Types ---
export interface SupabaseQuizAttempt {
    id: string;
    quiz_id: string;
    student_id: string;
    student_name: string;
    score: number;
    total_questions: number;
    time_taken_seconds: number;
    passed: boolean;
    answers: any; // Using any for JSONB for simplicity, can be typed stricter
    violation_count: number;
    status: 'SUBMITTED' | 'CORRUPTED' | 'PENDING';
    created_at: string;
}

// --- Hooks ---

// Submit a new attempt
export const useSubmitAttempt = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attempt: Omit<SupabaseQuizAttempt, 'id' | 'created_at' | 'student_id'>) => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) throw new Error("User not authenticated");

            const payload = {
                ...attempt,
                student_id: userData.user.id
            };
            console.log("Submitting attempt payload to Supabase:", payload);

            const { data, error } = await supabase
                .from('quiz_attempts')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
            toast.success("Result synced to cloud!");
        },
        onError: (error: any) => {
            console.error("Failed to sync attempt to Supabase:", error);
            if (error.details) console.error("Error details:", error.details);
            if (error.hint) console.error("Error hint:", error.hint);
            if (error.message) console.error("Error message:", error.message);
            // Don't show toast error here to avoid panicking student, local storage fallback will handle display
        }
    });
};

// Fetch attempts for the current student
export const useStudentAttempts = (studentId: string | undefined) => {
    return useQuery({
        queryKey: ['student-attempts', studentId],
        queryFn: async () => {
            if (!studentId) return [];

            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching student attempts:", error);
                return [];
            }
            return data as SupabaseQuizAttempt[];
        },
        enabled: !!studentId
    });
};

// Fetch ALL attempts for a specific quiz (for Teacher)
export const useQuizAttemptsForTeacher = (quizId: string) => {
    return useQuery({
        queryKey: ['quiz-attempts-teacher', quizId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*')
                .eq('quiz_id', quizId)
                .order('score', { ascending: false });

            if (error) {
                console.error("Error fetching quiz attempts:", error);
                return [];
            }
            return data as SupabaseQuizAttempt[];
        },
        enabled: !!quizId
    });
};

// Fetch ALL attempts (for global context/admin view)
export const useAllAttempts = () => {
    return useQuery({
        queryKey: ['all-attempts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return [];
            return data as SupabaseQuizAttempt[];
        }
    });
};
