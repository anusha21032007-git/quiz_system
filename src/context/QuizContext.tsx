"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Type Definitions
export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number; // New field for question marks
}

export interface Quiz {
  id: string;
  title: string;
  questionIds: string[]; // IDs of questions belonging to this quiz
  timeLimitMinutes: number; // New field for quiz time limit
  negativeMarking: boolean; // New field for negative marking
  competitionMode: boolean; // New field for competition mode
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
  timestamp: number;
  timeTakenSeconds: number; // New field for time taken in seconds
}

interface QuizContextType {
  questions: Question[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  addQuestion: (question: Omit<Question, 'id'>) => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'questionIds'>, questionIds: string[]) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
  getQuestionsForQuiz: (quizId: string) => Question[];
  getQuizById: (quizId: string) => Quiz | undefined;
  generateAIQuestions: (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number) => Question[];
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

interface QuizProviderProps {
  children: ReactNode;
}

export const QuizProvider = ({ children }: QuizProviderProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedQuestions = localStorage.getItem('quiz_questions');
      if (storedQuestions) setQuestions(JSON.parse(storedQuestions));

      const storedQuizzes = localStorage.getItem('quiz_quizzes');
      if (storedQuizzes) setQuizzes(JSON.parse(storedQuizzes));

      const storedAttempts = localStorage.getItem('quiz_attempts');
      if (storedAttempts) setQuizAttempts(JSON.parse(storedAttempts));
    } catch (error) {
      console.error("Failed to load quiz data from localStorage", error);
      toast.error("Failed to load previous data.");
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quiz_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('quiz_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('quiz_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  const addQuestion = (question: Omit<Question, 'id'>) => {
    const newQuestion: Question = { ...question, id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setQuestions((prev) => [...prev, newQuestion]);
    toast.success("Question added successfully!");
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'questionIds'>, questionIds: string[]) => {
    const newQuiz: Quiz = { ...quiz, id: `qz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, questionIds };
    setQuizzes((prev) => [...prev, newQuiz]);
    toast.success("Quiz created successfully!");
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = { ...attempt, id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() };
    setQuizAttempts((prev) => [...prev, newAttempt]);
    toast.success("Quiz submitted successfully!");
  };

  const getQuestionsForQuiz = (quizId: string): Question[] => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return [];
    return questions.filter(q => quiz.questionIds.includes(q.id));
  };

  const getQuizById = (quizId: string): Quiz | undefined => {
    return quizzes.find(q => q.id === quizId);
  };

  // Mock AI Question Generation
  const generateAIQuestions = (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number): Question[] => {
    const generated: Question[] = [];
    const baseMarks = difficulty === 'Easy' ? 1 : (difficulty === 'Medium' ? 2 : 3);

    for (let i = 0; i < numQuestions; i++) {
      const questionId = `ai-q-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      let questionText = '';
      let options: string[] = [];
      let correctAnswer = '';

      switch (difficulty) {
        case 'Easy':
          questionText = `What is the capital of ${coursePaperName.split(' ')[0] || 'France'}?`;
          options = ['Paris', 'London', 'Berlin', 'Rome'];
          correctAnswer = 'Paris';
          break;
        case 'Medium':
          questionText = `In ${coursePaperName}, which concept describes the interaction between supply and demand?`;
          options = ['Equilibrium', 'Elasticity', 'Utility', 'Scarcity'];
          correctAnswer = 'Equilibrium';
          break;
        case 'Hard':
          questionText = `Explain the implications of Heisenberg's Uncertainty Principle in the context of ${coursePaperName}.`;
          options = [
            'It states that one cannot simultaneously know the exact position and momentum of a particle.',
            'It describes the behavior of particles at relativistic speeds.',
            'It quantifies the energy levels of electrons in an atom.',
            'It relates to the wave-particle duality of light.'
          ];
          correctAnswer = 'It states that one cannot simultaneously know the exact position and momentum of a particle.';
          break;
        default:
          questionText = `[${difficulty}] According to "${coursePaperName}", what is the key concept related to topic ${i + 1}?`;
          options = [`Option A for ${i + 1}`, `Option B for ${i + 1}`, `Option C for ${i + 1}`, `Option D for ${i + 1}`];
          correctAnswer = `Option A for ${i + 1}`;
      }

      generated.push({
        id: questionId,
        quizId: 'ai-generated', // A placeholder quizId for now
        questionText: questionText.replace(coursePaperName.split(' ')[0] || 'France', coursePaperName),
        options,
        correctAnswer,
        marks: baseMarks,
      });
    }
    toast.info(`Mock AI generated ${numQuestions} questions for "${coursePaperName}" (${difficulty}).`);
    return generated;
  };

  return (
    <QuizContext.Provider
      value={{
        questions,
        quizzes,
        quizAttempts,
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