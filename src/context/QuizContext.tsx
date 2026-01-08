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
  const quizzes = supabaseQuizzes.map(mapSupabaseQuizToLocal);

  const [localQuestionPool, setLocalQuestionPool] = useState<Question[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const storedAttempts = localStorage.getItem('quiz_attempts');
      return storedAttempts ? JSON.parse(storedAttempts) : [];
    } catch (error) {
      console.error("Failed to load quiz attempts", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  const createQuizMutation = useCreateQuiz();

  const addQuestion = (question: Omit<Question, 'id'>): string => {
    const newQuestion: Question = { ...question, id: `q-local-${Date.now()}` };
    setLocalQuestionPool((prev) => [...prev, newQuestion]);
    return newQuestion.id;
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => {
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
    });
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = { ...attempt, id: `att-${Date.now()}`, timestamp: Date.now() };
    setQuizAttempts((prev) => [...prev, newAttempt]);
    toast.success("Quiz submitted!");
  };

  const getQuestionsForQuiz = (quizId: string): Question[] => {
    return []; 
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