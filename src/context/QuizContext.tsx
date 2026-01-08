"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useQuizzes, 
  useQuestionsByQuizId, 
  useCreateQuiz, 
  SupabaseQuiz, 
  SupabaseQuestion 
} from '@/integrations/supabase/quizzes';
import { supabase } from '@/integrations/supabase/client';

// --- Type Definitions (Simplified for Context) ---

// Map Supabase types to local context types
export interface Question extends Omit<SupabaseQuestion, 'teacher_id' | 'created_at' | 'question_text' | 'correct_answer' | 'quiz_id'> {
  questionText: string;
  correctAnswer: string;
  quizId: string;
}

<<<<<<< HEAD
export interface Quiz extends Omit<SupabaseQuiz, 'teacher_id' | 'created_at' | 'course_name' | 'time_limit_minutes' | 'scheduled_date' | 'start_time' | 'end_time' | 'negative_marks_value' | 'status' | 'difficulty'> {
  courseName: string;
  timeLimitMinutes: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  negativeMarksValue: number; 
  status: 'draft' | 'published'; 
  difficulty: 'Easy' | 'Medium' | 'Hard'; // NEW FIELD
  // Note: questionIds is derived from fetching questions separately now, not stored on the quiz object itself.
=======
export interface Quiz {
  id: string;
  title: string;
  questionIds: string[]; // IDs of questions belonging to this quiz
  timeLimitMinutes: number; // New field for quiz time limit
  negativeMarking: boolean; // New field for negative marking
  negativeMarks?: string | number; // Added negative marks field
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
  timestamp: number;
  timeTakenSeconds: number;
}

interface QuizContextType {
  // Data accessors
  quizzes: Quiz[];
  questions: Question[]; // All questions fetched across all quizzes (for simplicity in context)
  quizAttempts: QuizAttempt[];
  isQuizzesLoading: boolean;
  isQuestionsLoading: boolean;

  // Mutations/Actions
  addQuestion: (question: Omit<Question, 'id'>) => string; // Kept for QuestionCreator draft flow
  addQuiz: (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => void; // Updated signature to omit status
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
  getQuestionsForQuiz: (quizId: string) => Question[];
  getQuizById: (quizId: string) => Quiz | undefined;
  generateAIQuestions: (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number, numOptions: number) => Question[];
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

interface QuizProviderProps {
  children: ReactNode;
}

// Helper to map Supabase data structure to local context structure
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
  difficulty: sQuiz.difficulty, // Mapped new field
});

const mapSupabaseQuestionToLocal = (sQuestion: SupabaseQuestion): Question => ({
  id: sQuestion.id,
  quizId: sQuestion.quiz_id,
  questionText: sQuestion.question_text,
  options: sQuestion.options,
  correctAnswer: sQuestion.correct_answer,
  marks: sQuestion.marks,
  timeLimitMinutes: sQuestion.time_limit_minutes,
});

export const QuizProvider = ({ children }: QuizProviderProps) => {
  const queryClient = useQueryClient();
  
  // Fetch Quizzes using Supabase hook
  const { data: supabaseQuizzes = [], isLoading: isQuizzesLoading } = useQuizzes();
  const quizzes = supabaseQuizzes.map(mapSupabaseQuizToLocal);

  const [localQuestionPool, setLocalQuestionPool] = useState<Question[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    // Load attempts from localStorage (keeping this local for now)
    try {
      const storedAttempts = localStorage.getItem('quiz_attempts');
      return storedAttempts ? JSON.parse(storedAttempts) : [];
    } catch (error) {
      console.error("Failed to load quiz attempts from localStorage", error);
      return [];
    }
  });

  // Save attempts to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  const createQuizMutation = useCreateQuiz();

  // This function is now only used by QuestionCreator for its local pool (not synced to Supabase)
  const addQuestion = (question: Omit<Question, 'id'>): string => {
    const newQuestion: Question = { ...question, id: `q-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setLocalQuestionPool((prev) => [...prev, newQuestion]);
    toast.success("Question added to local pool!");
    return newQuestion.id;
  };

  // This function handles inserting the quiz and its questions into Supabase
  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => {
    // Note: We omit 'status' here because the mutation hook sets it to 'published' automatically.
    const quizInsertData = {
      title: quiz.title,
      course_name: quiz.courseName,
      time_limit_minutes: quiz.timeLimitMinutes,
      negative_marking: quiz.negativeMarking,
      competition_mode: quiz.competitionMode,
      scheduled_date: quiz.scheduledDate,
      start_time: quiz.startTime,
      end_time: quiz.endTime,
      negative_marks_value: quiz.negativeMarksValue,
      difficulty: quiz.difficulty, // Pass difficulty
    };

    const questionsInsertData = questionsData.map(q => ({
      quiz_id: 'placeholder', // Will be replaced by mutation function
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      marks: q.marks,
      time_limit_minutes: q.timeLimitMinutes,
    }));

    createQuizMutation.mutate({ quizData: quizInsertData, questionsData: questionsInsertData });
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = { ...attempt, id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
    setQuizAttempts((prev) => [...prev, newAttempt]);
    toast.success("Quiz submitted successfully!");
  };

  const getQuestionsForQuiz = (quizId: string): Question[] => {
    return []; 
  };

  const getQuizById = (quizId: string): Quiz | undefined => {
    return quizzes.find(q => q.id === quizId);
  };

  // Mock AI Question Generation (remains local)
  const generateAIQuestions = (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number, numOptions: number): Question[] => {
    const generated: Question[] = [];
    const baseMarks = 1; 
    const baseTimeLimit = 1; 

    for (let i = 0; i < numQuestions; i++) {
      const questionId = `ai-q-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      let questionText = '';
      let options: string[] = [];
      let correctAnswer = '';

      let baseOptions: string[] = [];
      switch (difficulty) {
        case 'Easy':
          questionText = `What is the capital of ${coursePaperName.split(' ')[0] || 'France'}?`;
          baseOptions = ['Paris', 'London', 'Berlin', 'Rome', 'Madrid', 'Tokyo']; 
          correctAnswer = 'Paris';
          break;
        case 'Medium':
          questionText = `In ${coursePaperName}, which concept describes the interaction between supply and demand?`;
          baseOptions = ['Equilibrium', 'Elasticity', 'Utility', 'Scarcity', 'Inflation', 'Deflation'];
          correctAnswer = 'Equilibrium';
          break;
        case 'Hard':
          questionText = `Explain the implications of Heisenberg's Uncertainty Principle in the context of ${coursePaperName}.`;
          baseOptions = [
            "It states that one cannot simultaneously know the exact position and momentum of a particle.",
            "It describes the behavior of particles at relativistic speeds.",
            "It quantifies the energy levels of electrons in an atom.",
            "It relates to the wave-particle duality of light.",
            "It is a fundamental principle of classical mechanics.",
            "It applies only to macroscopic objects."
          ];
          correctAnswer = "It states that one cannot simultaneously know the exact position and momentum of a particle.";
          break;
        default:
          questionText = `[${difficulty}] According to "${coursePaperName}", what is the key concept related to topic ${i + 1}?`;
          baseOptions = [`Option A for ${i + 1}`, `Option B for ${i + 1}`, `Option C for ${i + 1}`, `Option D for ${i + 1}`, `Option E for ${i + 1}`, `Option F for ${i + 1}`];
          correctAnswer = `Option A for ${i + 1}`;
      }

      const shuffledBaseOptions = baseOptions.filter(opt => opt !== correctAnswer);
      const finalOptions = [correctAnswer, ...shuffledBaseOptions.sort(() => 0.5 - Math.random()).slice(0, numOptions - 1)].sort(() => 0.5 - Math.random());

      while (finalOptions.length < numOptions) {
        finalOptions.push(`Generic Option ${finalOptions.length + 1}`);
      }
      options = finalOptions.slice(0, numOptions);

      if (!options.includes(correctAnswer)) {
        correctAnswer = options[0];
      }

      generated.push({
        id: questionId,
        quizId: 'ai-generated', 
        questionText: questionText.replace(coursePaperName.split(' ')[0] || 'France', coursePaperName),
        options,
        correctAnswer,
        marks: baseMarks, 
        timeLimitMinutes: baseTimeLimit, 
      });
    }
    toast.info(`Mock AI generated ${numQuestions} questions for "${coursePaperName}" (${difficulty}).`);
    return generated;
  };

  return (
    <QuizContext.Provider
      value={{
        questions: localQuestionPool, // Expose local pool for QuestionCreator
        quizzes,
        quizAttempts,
        isQuizzesLoading,
        isQuestionsLoading: false, // We handle question loading locally in QuizPage now
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