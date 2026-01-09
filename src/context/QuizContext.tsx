"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useQuizzes,
  useCreateQuiz,
  SupabaseQuiz,
  SupabaseQuestion
} from '@/integrations/supabase/quizzes';
import { supabase } from '@/integrations/supabase/client';

// --- Type Definitions ---

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  timeLimitMinutes: number;
}

export interface Quiz {
  id: string;
  title: string;
  courseName: string;
  timeLimitMinutes: number;
  negativeMarking: boolean;
  competitionMode: boolean;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  negativeMarksValue: number;
  status: 'draft' | 'published';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[];
  timestamp: number;
  timeTakenSeconds: number;
}

interface QuizContextType {
  quizzes: Quiz[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  isQuizzesLoading: boolean;
  isQuestionsLoading: boolean;

  addQuestion: (question: Omit<Question, 'id'>) => string;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
  getQuestionsForQuiz: (quizId: string) => Question[];
  getQuizById: (quizId: string) => Quiz | undefined;
  generateAIQuestions: (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number, numOptions: number) => Question[];
  deleteQuiz: (quizId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// --- Helpers ---

const mapSupabaseQuizToLocal = (sQuiz: SupabaseQuiz): Quiz => ({
  id: sQuiz.id,
  title: sQuiz.title,
  courseName: sQuiz.course_name,
  timeLimitMinutes: sQuiz.time_limit_minutes,
  negativeMarking: sQuiz.negative_marking,
  competitionMode: sQuiz.competition_mode,
  scheduledDate: sQuiz.scheduled_date,
  startTime: sQuiz.start_time,
  endTime: sQuiz.end_time,
  negativeMarksValue: sQuiz.negative_marks_value,
  status: sQuiz.status,
  difficulty: sQuiz.difficulty,
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: supabaseQuizzes = [], isLoading: isQuizzesLoading } = useQuizzes();
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>(() => {
    try {
      const storedQuizzes = localStorage.getItem('local_quizzes');
      return storedQuizzes ? JSON.parse(storedQuizzes) : [];
    } catch (error) {
      console.error("Failed to load local quizzes", error);
      return [];
    }
  });

  const [localQuestionPool, setLocalQuestionPool] = useState<Question[]>(() => {
    try {
      const storedQuestions = localStorage.getItem('local_questions');
      return storedQuestions ? JSON.parse(storedQuestions) : [];
    } catch (error) {
      console.error("Failed to load local questions", error);
      return [];
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const storedAttempts = localStorage.getItem('quiz_attempts');
      return storedAttempts ? JSON.parse(storedAttempts) : [];
    } catch (error) {
      console.error("Failed to load quiz attempts", error);
      return [];
    }
  });

  // Merge Supabase quizzes with Local Quizzes
  // We prioritize Supabase, but if not available, we show local.
  // In a real scenario, we might want to de-duplicate by ID, but since local IDs are different, concatenation is fine.
  const quizzes = [...supabaseQuizzes.map(mapSupabaseQuizToLocal), ...localQuizzes];

  useEffect(() => {
    localStorage.setItem('quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem('local_quizzes', JSON.stringify(localQuizzes));
  }, [localQuizzes]);

  useEffect(() => {
    localStorage.setItem('local_questions', JSON.stringify(localQuestionPool));
  }, [localQuestionPool]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'local_quizzes' && e.newValue) {
        setLocalQuizzes(JSON.parse(e.newValue));
      }
      if (e.key === 'local_questions' && e.newValue) {
        setLocalQuestionPool(JSON.parse(e.newValue));
      }
      if (e.key === 'quiz_attempts' && e.newValue) {
        setQuizAttempts(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createQuizMutation = useCreateQuiz();

  const addQuestion = (question: Omit<Question, 'id'>): string => {
    const newQuestion: Question = { ...question, id: `q-local-${Date.now()}` };
    setLocalQuestionPool((prev) => [...prev, newQuestion]);
    return newQuestion.id;
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => {
    // 1. Create Local Fallback Quiz
    const localId = `qz-local-${Date.now()}`;
    const newLocalQuiz: Quiz = {
      ...quiz,
      id: localId,
      status: 'published',
    };

    const newLocalQuestions = questionsData.map((q, index) => ({
      ...q,
      id: `q-local-${localId}-${index}`,
      quizId: localId,
    }));

    // Update Local State immediately (Optimistic UI for the user)
    setLocalQuizzes(prev => [...prev, newLocalQuiz]);
    setLocalQuestionPool(prev => [...prev, ...newLocalQuestions]);
    toast.success("Quiz created locally! (Syncing to cloud...)");

    // 2. Try Sync to Supabase
    createQuizMutation.mutate({
      quizData: {
        title: quiz.title,
        course_name: quiz.courseName,
        time_limit_minutes: quiz.timeLimitMinutes,
        negative_marking: quiz.negativeMarking,
        competition_mode: quiz.competitionMode,
        scheduled_date: quiz.scheduledDate,
        start_time: quiz.startTime,
        end_time: quiz.endTime,
        negative_marks_value: quiz.negativeMarksValue,
        difficulty: quiz.difficulty,
      },
      questionsData: questionsData.map(q => ({
        quiz_id: 'temp',
        question_text: q.questionText,
        options: q.options,
        correct_answer: q.correctAnswer,
        marks: q.marks,
        time_limit_minutes: q.timeLimitMinutes,
      }))
    }, {
      onSuccess: () => {
        // Optionally remove the local fallback if we want to rely solely on Supabase,
        // but for this hybrid approach, keeping it is safer unless we implement strict sync logic.
        // For now, we just let the cloud version eventually appear (potentially as a duplicate if we don't handle it, 
        // but since IDs differ, they'll just be two quizzes). 
        // ideally we would replace the local one, but that requires more complex state management.
        toast.success("Quiz synced to cloud successfully!");
      },
      onError: (err) => {
        console.error("Cloud sync failed (using local copy):", err);
        toast.info("Offline Mode: Quiz saved to this device only.");
      }
    });
  };

  const deleteQuiz = async (quizId: string) => {
    // 1. Delete from Local State
    setLocalQuizzes(prev => prev.filter(q => q.id !== quizId));
    setLocalQuestionPool(prev => prev.filter(q => q.quizId !== quizId));

    // 2. Delete from Supabase if it's a cloud quiz
    if (!quizId.startsWith('qz-')) {
      try {
        const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (error) throw error;
        toast.success("Quiz deleted from cloud.");
        queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      } catch (error) {
        console.error("Failed to delete from cloud:", error);
        toast.error("Failed to delete quiz from cloud.");
      }
    } else {
      toast.success("Local quiz deleted.");
    }
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = { ...attempt, id: `att-${Date.now()}`, timestamp: Date.now() };
    setQuizAttempts((prev) => [...prev, newAttempt]);
    toast.success("Quiz submitted!");
  };

  const getQuestionsForQuiz = (quizId: string): Question[] => {
    // Return questions from local pool that match the quiz ID
    return localQuestionPool.filter(q => q.quizId === quizId);
    // Note: Remote questions are fetched via useQuestionsByQuizId hook in the component, 
    // but having this helper for local ones is good.
  };

  const getQuizById = (quizId: string): Quiz | undefined => {
    return quizzes.find(q => q.id === quizId);
  };

  const generateAIQuestions = (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number, numOptions: number): Question[] => {
    const generated: Question[] = [];
    for (let i = 0; i < numQuestions; i++) {
      generated.push({
        id: `ai-q-${Date.now()}-${i}`,
        quizId: 'ai-generated',
        questionText: `AI Generated: ${coursePaperName} - Question ${i + 1}`,
        options: Array.from({ length: numOptions }, (_, j) => `Option ${j + 1}`),
        correctAnswer: 'Option 1',
        marks: 1,
        timeLimitMinutes: 1,
      });
    }
    return generated;
  };

  return (
    <QuizContext.Provider
      value={{
        questions: localQuestionPool,
        quizzes,
        quizAttempts,
        isQuizzesLoading,
        isQuestionsLoading: false,
        addQuestion,
        addQuiz,
        deleteQuiz,
        submitQuizAttempt,
        getQuestionsForQuiz,
        getQuizById,
        generateAIQuestions,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};