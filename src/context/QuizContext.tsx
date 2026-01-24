"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useQuizzes,
  useQuestionsByQuizId,
  useCreateQuiz,
  SupabaseQuiz,
  SupabaseQuestion
} from '@/integrations/supabase/quizzes';
import { useSubmitAttempt, useAllAttempts, SupabaseQuizAttempt } from '@/integrations/supabase/attempts';
import { supabase } from '@/integrations/supabase/client';
import { aiService, AIQuestionResponse } from '@/services/aiService';

// --- Type Definitions ---

export interface Question extends Omit<SupabaseQuestion, 'teacher_id' | 'created_at' | 'question_text' | 'correct_answer' | 'quiz_id' | 'time_limit_minutes' | 'marks'> {
  questionText: string;
  options: string[];
  correctAnswer: string;
  quizId: string;
  marks: number;
  timeLimitMinutes: number;
  explanation: string;
}

export interface Quiz extends Omit<SupabaseQuiz, 'teacher_id' | 'created_at' | 'course_name' | 'time_limit_minutes' | 'scheduled_date' | 'start_time' | 'end_time' | 'negative_marks_value' | 'status' | 'difficulty' | 'negative_marking' | 'competition_mode' | 'pass_mark_percentage' | 'total_questions' | 'required_correct_answers'> {
  quizId: string;
  courseName: string;
  questions: Question[];
  totalQuestions: number;
  passPercentage: number;
  requiredCorrectAnswers: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'published' | 'ACTIVE' | 'DELETED';
  createdAt: string;
  timeLimitMinutes: number;
  negativeMarking: boolean;
  competitionMode: boolean;
  scheduledDate: string;
  negativeMarksValue: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isCompetitive?: boolean;
  isInterview?: boolean;
  maxAttempts?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  score: number; // Total marks scored
  scorePercentage: number; // Calculated percentage
  totalMarksPossible: number; // Total marks possible
  totalQuestions: number;
  correctAnswersCount: number;
  passed: boolean;
  status: 'SUBMITTED' | 'CORRUPTED';
  violationCount: number;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[];
  timestamp: number;
  timeTakenSeconds: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  registerNumber: string;
  year: string;
  department: string;
  username: string;
  password: string;
  role: 'Student';
}

interface QuizContextType {
  quizzes: Quiz[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  isQuizzesLoading: boolean;
  isQuestionsLoading: boolean;
  availableCourses: string[];
  managedUsers: ManagedUser[];
  hasNewQuizzes: boolean;
  markQuizzesAsSeen: () => void;
  addQuestion: (question: Omit<Question, 'id'>) => string;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => void;
  addCourse: (courseName: string) => void;
  addManagedUser: (user: Omit<ManagedUser, 'id' | 'username' | 'password' | 'role'>) => void;
  editCourse: (oldName: string, newName: string) => void;
  deleteCourse: (courseName: string) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp' | 'scorePercentage' | 'totalMarksPossible' | 'passed'>) => void;
  getQuestionsForQuiz: (quizId: string) => Promise<Question[]>;
  getQuizById: (quizId: string) => Quiz | undefined;
  getQuizById: (quizId: string) => Quiz | undefined;
  generateAIQuestions: (params: {
    coursePaperName: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    numQuestions: number;
    numOptions: number;
    marksPerQuestion: number;
    timePerQuestionSeconds: number;
    onBatchComplete?: (questions: Question[]) => void;
  }) => Promise<Question[]>;
  deleteQuiz: (quizId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const mapSupabaseQuizToLocal = (sQuiz: SupabaseQuiz): Quiz => ({
  id: sQuiz.id,
  quizId: sQuiz.id,
  title: sQuiz.title,
  courseName: sQuiz.course_name,
  questions: [],
  timeLimitMinutes: sQuiz.time_limit_minutes,
  negativeMarking: sQuiz.negative_marking,
  competitionMode: sQuiz.competition_mode,
  scheduledDate: sQuiz.scheduled_date,
  startTime: sQuiz.start_time,
  endTime: sQuiz.end_time,
  negativeMarksValue: sQuiz.negative_marks_value,
  status: sQuiz.status === 'published' ? 'ACTIVE' : sQuiz.status as Quiz['status'],
  difficulty: sQuiz.difficulty,
  passPercentage: sQuiz.pass_mark_percentage || 0,
  totalQuestions: sQuiz.total_questions || 0,
  requiredCorrectAnswers: sQuiz.required_correct_answers || 0,
  createdAt: sQuiz.created_at,
  isCompetitive: sQuiz.competition_mode || sQuiz.title.startsWith('CMP:') || sQuiz.course_name.includes('Competitive'),
  isInterview: sQuiz.title.startsWith('INT:') || sQuiz.course_name.includes('Interview'),
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: supabaseQuizzes = [], isLoading: isQuizzesLoading } = useQuizzes();
  const createQuizMutation = useCreateQuiz();

  // Cloud Sync: Fetch all attempts
  const { data: supabaseAttempts = [] } = useAllAttempts();
  const submitAttemptMutation = useSubmitAttempt();

  const [localData, setLocalData] = useState<{
    quizzes: Quiz[];
    questions: Question[];
    attempts: QuizAttempt[];
    courses: string[];
    users: ManagedUser[];
  }>(() => {
    try {
      const stored = localStorage.getItem('ALL_QUIZZES');
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitizedQuizzes = (parsed.quizzes || []).map((q: any) => ({
          ...q,
          questions: q.questions || []
        }));
        return {
          quizzes: sanitizedQuizzes,
          questions: parsed.questions || [],
          attempts: parsed.attempts || [], // Keep loading local attempts for now as fallback
          courses: parsed.courses || [],
          users: parsed.users || [],
        };
      }
      return { quizzes: [], questions: [], attempts: [], courses: [], users: [] };
    } catch (error) {
      console.error("Failed to load global quiz data", error);
      return { quizzes: [], questions: [], attempts: [], courses: [], users: [] };
    }
  });

  const { quizzes: localQuizzes, questions: localQuestionPool, attempts: localQuizAttempts, courses: manualCourses, users: managedUsers } = localData;

  const setLocalQuizzes = (updater: Quiz[] | ((prev: Quiz[]) => Quiz[])) => {
    setLocalData(prev => ({
      ...prev,
      quizzes: typeof updater === 'function' ? updater(prev.quizzes) : updater
    }));
  };

  const setLocalQuestionPool = (updater: Question[] | ((prev: Question[]) => Question[])) => {
    setLocalData(prev => ({
      ...prev,
      questions: typeof updater === 'function' ? updater(prev.questions) : updater
    }));
  };

  const setQuizAttempts = (updater: QuizAttempt[] | ((prev: QuizAttempt[]) => QuizAttempt[])) => {
    setLocalData(prev => ({
      ...prev,
      attempts: typeof updater === 'function' ? updater(prev.attempts) : updater
    }));
  };

  const setManualCourses = (updater: string[] | ((prev: string[]) => string[])) => {
    setLocalData(prev => ({
      ...prev,
      courses: typeof updater === 'function' ? updater(prev.courses) : updater
    }));
  };

  const setManagedUsers = (updater: ManagedUser[] | ((prev: ManagedUser[]) => ManagedUser[])) => {
    setLocalData(prev => ({
      ...prev,
      users: typeof updater === 'function' ? updater(prev.users) : updater
    }));
  };

  // Merge local and cloud attempts
  const cloudAttemptsMapped: QuizAttempt[] = supabaseAttempts.map(sa => {
    // Cloud attempts might not have scorePercentage and totalMarksPossible yet
    // We can't easily calculate them here without the full quiz data for each attempt
    // For now we'll set them to default or calculated values if possible later
    return {
      id: sa.id,
      quizId: sa.quiz_id,
      studentName: sa.student_name,
      score: sa.score,
      totalQuestions: sa.total_questions,
      timeTakenSeconds: sa.time_taken_seconds,
      passed: sa.passed,
      status: sa.status as 'SUBMITTED' | 'CORRUPTED',
      violationCount: sa.violation_count,
      answers: sa.answers,
      timestamp: new Date(sa.created_at).getTime(),
      correctAnswersCount: sa.score, // Fallback
      scorePercentage: (sa as any).score_percentage || 0, // Assume potential future fields
      totalMarksPossible: (sa as any).total_marks_possible || sa.total_questions, // Fallback
    };
  });

  const quizAttempts = useMemo(() => {
    const combined = [...cloudAttemptsMapped];
    localData.attempts.forEach(local => {
      if (local.id.startsWith('att-cloud-')) return;
      const isAlreadyInCloud = cloudAttemptsMapped.some(cloud =>
        cloud.quizId === local.quizId &&
        cloud.studentName === local.studentName &&
        Math.abs(cloud.score - local.score) < 0.01 &&
        Math.abs(cloud.timestamp - local.timestamp) < 300000
      );
      if (!isAlreadyInCloud) {
        combined.push(local);
      }
    });
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [cloudAttemptsMapped, localData.attempts]);

  const quizzes = useMemo(() => [...supabaseQuizzes.map(mapSupabaseQuizToLocal), ...localQuizzes], [supabaseQuizzes, localQuizzes]);

  const [hasNewQuizzes, setHasNewQuizzes] = useState<boolean>(() => {
    return localStorage.getItem('NEW_QUIZ_AVAILABLE') === 'true';
  });

  const markQuizzesAsSeen = useCallback(() => {
    setHasNewQuizzes(false);
    localStorage.setItem('NEW_QUIZ_AVAILABLE', 'false');
  }, []);

  const availableCourses = manualCourses;

  useEffect(() => {
    const dataToSave = {
      quizzes: localQuizzes,
      questions: localQuestionPool,
      attempts: localQuizAttempts,
      courses: manualCourses,
      users: managedUsers,
    };
    localStorage.setItem('ALL_QUIZZES', JSON.stringify(dataToSave));
  }, [localQuizzes, localQuestionPool, localQuizAttempts, manualCourses, managedUsers]);

  const logToHistory = (quiz: Quiz, action: 'Published' | 'Deleted') => {
    const historyJson = localStorage.getItem('questionActionHistory');
    const history = historyJson ? JSON.parse(historyJson) : [];
    const newEntry = {
      questionSetId: quiz.quizId,
      paperName: quiz.title,
      totalQuestions: quiz.totalQuestions,
      action: action,
      timestamp: Date.now()
    };
    localStorage.setItem('questionActionHistory', JSON.stringify([newEntry, ...history]));
  };

  const addQuestion = (question: Omit<Question, 'id'>) => {
    const newId = `q-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newQuestion = { ...question, id: newId };
    setLocalQuestionPool((prev) => [...prev, newQuestion]);
    return newId;
  };

  const addCourse = (courseName: string) => {
    if (!manualCourses.includes(courseName)) {
      setManualCourses((prev) => [...prev, courseName]);
    }
  };

  const addManagedUser = (userData: Omit<ManagedUser, 'id' | 'username' | 'password' | 'role'>) => {
    const id = `user-${Date.now()}`;
    const newUser: ManagedUser = {
      ...userData,
      id,
      username: `student_${userData.registerNumber || Date.now()}`,
      password: `pass${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'Student'
    };
    setManagedUsers(prev => [newUser, ...prev]);
    toast.success("User added successfully!");
  };

  const editCourse = (oldName: string, newName: string) => {
    if (manualCourses.includes(oldName)) {
      setManualCourses(prev => prev.map(c => c === oldName ? newName : c));
      setLocalQuizzes(prev => prev.map(q => q.courseName === oldName ? { ...q, courseName: newName } : q));
      toast.success(`Course renamed to "${newName}"`);
    }
  };

  const deleteCourse = (courseName: string) => {
    setManualCourses(prev => prev.filter(c => c !== courseName));
    toast.success("Course deleted successfully.");
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => {
    const localId = `qz-local-${Date.now()}`;
    const newLocalQuestions = questionsData.map((q, index) => ({
      ...q,
      id: `q-local-${localId}-${index}`,
      quizId: localId,
      explanation: q.explanation || '',
    })) as Question[];

    const newLocalQuiz: Quiz = {
      ...quiz,
      id: localId,
      quizId: localId,
      questions: newLocalQuestions,
      passPercentage: quiz.passPercentage || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      maxAttempts: quiz.maxAttempts || 1,
    };

    setLocalQuizzes(prev => [...prev, newLocalQuiz]);
    setLocalQuestionPool(prev => [...prev, ...newLocalQuestions]);
    addCourse(quiz.courseName);
    logToHistory(newLocalQuiz, 'Published');

    localStorage.setItem('NEW_QUIZ_AVAILABLE', 'true');
    setHasNewQuizzes(true);

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'NEW_QUIZ_AVAILABLE',
      newValue: 'true'
    }));

    toast.success("Quiz created and logged to history!");

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
        pass_mark_percentage: quiz.passPercentage,
        total_questions: quiz.totalQuestions,
        required_correct_answers: quiz.requiredCorrectAnswers,
      },
      questionsData: questionsData.map(q => ({
        quiz_id: 'temp',
        question_text: q.questionText,
        options: q.options,
        correct_answer: q.correctAnswer,
        marks: q.marks,
        time_limit_minutes: q.timeLimitMinutes,
        explanation: q.explanation || '',
      }))
    });
  };

  const deleteQuiz = async (quizId: string) => {
    setLocalQuizzes(prev => {
      const quiz = prev.find(q => q.id === quizId);
      if (quiz) {
        logToHistory(quiz, 'Deleted');
        return prev.map(q => q.id === quizId ? { ...q, status: 'DELETED' } : q);
      }
      return prev;
    });

    if (!quizId.startsWith('qz-')) {
      try {
        const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (error) throw error;
        toast.success("Quiz deleted from cloud.");
        queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      } catch (error) {
        console.error("Failed to delete from cloud:", error);
      }
    } else {
      toast.success("Quiz deleted from active view.");
    }
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp' | 'scorePercentage' | 'totalMarksPossible' | 'passed'>) => {
    const quiz = quizzes.find(q => q.id === attempt.quizId);
    if (!quiz) return;

    // 1. Calculate metrics
    // We need questions to calculate totalMarksPossible if not provided
    // Since we are in the context, we can try to find them
    const quizQuestions = quiz.questions.length > 0 ? quiz.questions : localQuestionPool.filter(q => q.quizId === quiz.id);
    const totalMarksPossible = quizQuestions.reduce((sum, q) => sum + q.marks, 0) || attempt.totalQuestions;
    const scorePercentage = totalMarksPossible > 0 ? (attempt.score / totalMarksPossible) * 100 : 0;
    const passed = scorePercentage >= quiz.passPercentage;

    // 2. Save locally immediately for optimistic UI
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `att-local-${Date.now()}`,
      timestamp: Date.now(),
      scorePercentage,
      totalMarksPossible,
      passed
    };
    setQuizAttempts((prev) => [...prev, newAttempt]);

    // 3. Sync to Cloud
    submitAttemptMutation.mutate({
      quiz_id: attempt.quizId,
      student_name: attempt.studentName,
      score: attempt.score,
      total_questions: attempt.totalQuestions,
      time_taken_seconds: attempt.timeTakenSeconds,
      passed: passed,
      answers: attempt.answers,
      violation_count: attempt.violationCount,
      status: attempt.status,
    });

    toast.success("Quiz submitted!");
  };

  const getQuestionsForQuiz = useCallback(async (quizId: string): Promise<Question[]> => {
    const localQuestions = localQuestionPool.filter(q => q.quizId === quizId);
    if (localQuestions.length > 0) return localQuestions;

    try {
      const stored = localStorage.getItem('ALL_QUIZZES');
      if (stored) {
        const parsed = JSON.parse(stored);
        const questions = parsed.questions || [];
        const found = questions.filter((q: Question) => q.quizId === quizId);
        if (found.length > 0) return found;
      }
    } catch (e) { }

    if (quizId.startsWith('qz-local-')) return [];

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(sQ => ({
        id: sQ.id,
        quizId: sQ.quiz_id,
        questionText: sQ.question_text,
        options: sQ.options,
        correctAnswer: sQ.correct_answer,
        marks: sQ.marks,
        timeLimitMinutes: sQ.time_limit_minutes,
        explanation: sQ.explanation || '',
      }));
    } catch (error) {
      console.error("Error fetching questions:", quizId, error);
      return [];
    }
  }, [localQuestionPool]);

  const getQuizById = (quizId: string): Quiz | undefined => {
    return quizzes.find(q => q.id === quizId);
  };

  const generateAIQuestions = async ({
    coursePaperName,
    difficulty,
    numQuestions,
    numOptions,
    marksPerQuestion,
    timePerQuestionSeconds,
    onBatchComplete
  }: {
    coursePaperName: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    numQuestions: number;
    numOptions: number;
    marksPerQuestion: number;
    timePerQuestionSeconds: number;
    onBatchComplete?: (questions: Question[]) => void;
  }): Promise<Question[]> => {
    try {
      const allGeneratedQuestions: Question[] = [];
      const BATCH_SIZE = 2;
      const totalBatches = Math.ceil(numQuestions / BATCH_SIZE);

      console.log(`🚀 Starting batch generation: ${numQuestions} questions in ${totalBatches} batches.`);

      for (let i = 0; i < totalBatches; i++) {
        const remaining = numQuestions - allGeneratedQuestions.length;
        const currentBatchCount = Math.min(BATCH_SIZE, remaining);

        console.log(`📦 Generating batch ${i + 1}/${totalBatches} (${currentBatchCount} questions)...`);

        const response = await aiService.generateQuestions({
          topic: coursePaperName,
          count: currentBatchCount,
          difficulty: difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
          marks: marksPerQuestion,
          timeLimitSeconds: timePerQuestionSeconds,
          optionsCount: numOptions
        });

        if (response && response.questions && response.questions.length > 0) {
          const mapped = aiService.mapResponseToQuestions(
            response.questions,
            'ai-generated'
          );

          allGeneratedQuestions.push(...mapped);

          if (onBatchComplete) {
            onBatchComplete(mapped);
          }

          console.log(`✅ Batch ${i + 1} complete. Total so far: ${allGeneratedQuestions.length}`);
        } else {
          console.warn(`⚠️ Batch ${i + 1} produced no questions.`);
          // Optional: add a small retry delay or just continue. 
          // We'll continue to avoid infinite loops.
        }
      }

      if (allGeneratedQuestions.length > 0) {
        return allGeneratedQuestions;
      }
    } catch (error) {
      console.error("AI Batch Generation failed:", error);
      toast.error("AI Generation failed. Please try again.");
    }
    return [];
  };

  return (
    <QuizContext.Provider
      value={{
        questions: localQuestionPool,
        quizzes,
        quizAttempts,
        isQuizzesLoading,
        isQuestionsLoading: false,
        availableCourses,
        managedUsers,
        hasNewQuizzes,
        markQuizzesAsSeen,
        addQuestion,
        addQuiz,
        addCourse,
        addManagedUser,
        editCourse,
        deleteCourse,
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