import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { toast } from "sonner";

// --- Type Definitions for Supabase Data ---

export interface SupabaseQuestion {
  id: string;
  quiz_id: string;
  teacher_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  time_limit_minutes: number;
  created_at: string;
}

export interface SupabaseQuiz {
  id: string;
  teacher_id: string;
  title: string;
  course_name: string;
  time_limit_minutes: number;
  negative_marking: boolean;
  competition_mode: boolean;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  negative_marks_value: number;
  status: 'draft' | 'published';
  difficulty: 'Easy' | 'Medium' | 'Hard'; // NEW FIELD
  created_at: string;
}

// --- Fetching Hooks ---

// Fetch all quizzes (used by Student Dashboard)
export const useQuizzes = () => {
  return useQuery<SupabaseQuiz[], Error>({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("status", "published") // FILTER: Only fetch published quizzes
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching quizzes:", error);
        throw new Error(error.message);
      }
      return data;
    },
  });
};

// Fetch questions for a specific quiz (used by QuizPage)
export const useQuestionsByQuizId = (quizId: string) => {
  return useQuery<SupabaseQuestion[], Error>({
    queryKey: ["questions", quizId],
    queryFn: async () => {
      // Double check inside fn to be safe, though enabled should handle it
      if (quizId.startsWith('qz-')) return [];

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching questions for quiz " + quizId + ":", error);
        throw new Error(error.message);
      }
      return data;
    },
    // Only run query for valid database UUIDs (local IDs start with 'qz-')
    enabled: !!quizId && !quizId.startsWith('qz-'),
  });
};

// Fetch question count for a specific quiz
export const useQuestionCount = (quizId: string) => {
  return useQuery<number, Error>({
    queryKey: ["questionCount", quizId],
    queryFn: async () => {
      // Local IDs return 0 here, but usually component should handle it or context
      if (quizId.startsWith('qz-')) return 0;

      const { count, error } = await supabase
        .from("questions")
        .select("id", { count: 'exact', head: true })
        .eq("quiz_id", quizId);

      if (error) {
        console.error("Error fetching question count for quiz " + quizId + ":", error);
        throw new Error(error.message);
      }
      return count || 0;
    },
    // Only run query for valid database UUIDs (local IDs start with 'qz-')
    enabled: !!quizId && !quizId.startsWith('qz-'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// --- Mutation Hooks (Teacher Actions) ---

interface QuizInsertData extends Omit<SupabaseQuiz, 'id' | 'teacher_id' | 'created_at' | 'status'> { }
interface QuestionInsertData extends Omit<SupabaseQuestion, 'id' | 'teacher_id' | 'created_at'> { }

export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation<SupabaseQuiz, Error, { quizData: QuizInsertData, questionsData: QuestionInsertData[] }>({
    mutationFn: async ({ quizData, questionsData }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated.");

      // 1. Insert Quiz (Always set status to 'published' when created via QuizCreator)
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({ ...quizData, teacher_id: user.id, status: 'published' }) // Set status to published
        .select()
        .single();

      if (quizError) {
        console.error("Error inserting quiz:", quizError);
        throw new Error(quizError.message);
      }

      // 2. Prepare Questions for Batch Insert
      const questionsToInsert = questionsData.map(q => ({
        ...q,
        quiz_id: quiz.id,
        teacher_id: user.id,
      }));

      // 3. Insert Questions
      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) {
        // Note: In a real app, we might want to roll back the quiz insertion here.
        console.error("Error inserting questions:", questionsError);
        throw new Error(questionsError.message);
      }

      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Quiz created and scheduled successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create quiz: " + error.message);
    },
  });
};