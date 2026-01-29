"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Eye, Save, Brain, ListChecks, Info, Wand2, Clock, ArrowLeft, Calendar, Settings2, Send, CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { Target, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocalQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null;
  marks: number | '';
  timeLimitMinutes: number | '';
  explanation: string;
}

interface LocalQuizData {
  quizTitle: string;
  courseName: string;
  totalQuestions: number | '';
  optionsPerQuestion: number;
  questions: LocalQuestion[];
  scheduledDate: string;
  startTime: string;
  endTime: string;
  passMarkPercentage: number | '';
}

interface StoredQuiz {
  id: string;
  quizId: string;
  title: string;
  courseName: string;
  questionIds: string[];
  timeLimitMinutes: number;
  negativeMarking: boolean;
  negativeMarksValue: number;
  competitionMode: boolean;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passPercentage: number;
  passMarkPercentage: number;
  totalQuestions: number;
  requiredCorrectAnswers: number;
  _questionsData: {
    id: string;
    quizId: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    timeLimitMinutes: number;
    explanation: string;
  }[];
}

const QuizCreator = ({ onBack }: { onBack?: () => void }) => {
  const navigate = useNavigate();
  const { generateAIQuestions, addQuiz, availableCourses } = useQuiz(); // Removed addQuestion

  const [quizData, setQuizData] = useState<LocalQuizData>({
    quizTitle: '',
    courseName: '',
    totalQuestions: 0,
    optionsPerQuestion: 4, // Default to 4 as standard MCQ
    questions: [],
    scheduledDate: '',
    startTime: '',
    endTime: '',
    passMarkPercentage: 0,
  });

  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [negativeMarksValue, setNegativeMarksValue] = useState<string | number>(''); // State for negative marks value
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);
  const [defaultTimePerQuestion, setDefaultTimePerQuestion] = useState<number | null>(null); // New state for optional default time
  const [enableTimePerQuestion, setEnableTimePerQuestion] = useState<boolean>(false); // Toggle for time per question
  const [totalCalculatedQuizTime, setTotalCalculatedQuizTime] = useState<number>(0); // New state for total quiz time
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium'); // NEW: Quiz Difficulty

  const [searchParams, setSearchParams] = useSearchParams();

  // Manage steps via search params
  const step = parseInt(searchParams.get('quizStep') || '1');
  const setStep = (newStep: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('quizStep', newStep.toString());
    setSearchParams(newParams);
  };

  // AI Question Generation State (now local to QuizCreator)
  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [aiMarksPerQuestion, setAiMarksPerQuestion] = useState<number>(1);
  const [aiTimePerQuestionSeconds, setAiTimePerQuestionSeconds] = useState<number>(60);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Track if AI generation has been triggered for this session
  const hasTriggeredAIRef = React.useRef(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // New: Explicit Pool Size for AI
  const [aiPoolSize, setAiPoolSize] = useState<number | ''>('');

  // Scheduling Toggle
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Persistence logic for QuizCreator
  useEffect(() => {
    const saved = localStorage.getItem('quizCreatorState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.quizData) setQuizData(parsed.quizData);
        if (parsed.negativeMarking !== undefined) setNegativeMarking(parsed.negativeMarking);
        if (parsed.negativeMarksValue !== undefined) setNegativeMarksValue(parsed.negativeMarksValue);
        if (parsed.competitionMode !== undefined) setCompetitionMode(parsed.competitionMode);
        if (parsed.quizDifficulty) setQuizDifficulty(parsed.quizDifficulty);
        if (parsed.aiMarksPerQuestion) setAiMarksPerQuestion(parsed.aiMarksPerQuestion);
        if (parsed.aiTimePerQuestionSeconds) setAiTimePerQuestionSeconds(parsed.aiTimePerQuestionSeconds);
        if (parsed.aiPoolSize) setAiPoolSize(parsed.aiPoolSize);
        if (parsed.step) setStep(parsed.step);
        // Removed: showSchedule restoration - calendar should only show on explicit user action
      } catch (e) {
        console.error("Failed to restore QuizCreator session", e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      quizData,
      negativeMarking,
      negativeMarksValue,
      competitionMode,
      quizDifficulty,
      aiMarksPerQuestion,
      aiTimePerQuestionSeconds,
      aiPoolSize,
      step
      // Removed: showSchedule - calendar should only show on explicit user action
    };
    localStorage.setItem('quizCreatorState', JSON.stringify(stateToSave));
  }, [quizData, negativeMarking, negativeMarksValue, competitionMode, quizDifficulty, aiPoolSize, step]);

  useEffect(() => {
    const draftData = sessionStorage.getItem('draft_quiz_params');
    if (draftData) {
      try {
        const { questions, source, passMarkPercentage } = JSON.parse(draftData);
        if (questions && Array.isArray(questions)) {
          const mappedQuestions: LocalQuestion[] = questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.options.indexOf(q.correctAnswer),
            marks: typeof q.marks === 'number' ? q.marks : 1,
            timeLimitMinutes: typeof q.timeLimitMinutes === 'number' ? q.timeLimitMinutes : 1,
            explanation: q.explanation || ''
          }));

          setQuizData(prev => ({
            ...prev,
            questions: mappedQuestions,
            totalQuestions: mappedQuestions.length,
            // optional: infer options count
            optionsPerQuestion: mappedQuestions[0]?.options?.length || 4,
            passMarkPercentage: typeof passMarkPercentage === 'number' ? passMarkPercentage : prev.passMarkPercentage
          }));

          toast.success("Loaded questions from Question Bank!");
          // Clean up
          sessionStorage.removeItem('draft_quiz_params');
        }
      } catch (e) {
        console.error("Failed to load draft quiz", e);
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    // SKIP auto-fill if AI is generating to prevent overwriting/race conditions
    if (isGeneratingAI) return;

    setQuizData((prev) => {
      // If we have questions loaded from draft (length > 0) and totalMatches, don't wipe them out.
      // Only regenerate if the lengths mismatch significantly or if it's a fresh init.
      // Logic: If user manually changes 'totalQuestions', we adjust. 

      const currentCount = prev.questions.length;
      const targetCount = prev.totalQuestions === '' ? 0 : Number(prev.totalQuestions);

      if (currentCount === targetCount && currentCount > 0) return prev; // Stability check

      const newQuestions = [...prev.questions];

      while (newQuestions.length < targetCount) {
        newQuestions.push({
          questionText: '',
          options: Array(prev.optionsPerQuestion).fill(''),
          correctAnswerIndex: null,
          marks: 1,
          timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1,
          explanation: '',
        });
      }

      // If reducing count
      // In Pool mode (AI), we keep questions up to the pool size or total questions, whichever is relevant.
      // For simplicity, we sync to the maximum of the two to ensure we don't lose pool data.
      const syncCount = Math.max(targetCount, Number(aiPoolSize) || 0);

      const updatedQuestions = newQuestions.slice(0, syncCount).map(q => {
        // Ensure options count matches config
        const newOptions = [...q.options];
        while (newOptions.length < prev.optionsPerQuestion) {
          newOptions.push('');
        }
        return {
          ...q,
          options: newOptions.slice(0, prev.optionsPerQuestion),
        };
      });

      return { ...prev, questions: updatedQuestions };
    });
  }, [quizData.totalQuestions, quizData.optionsPerQuestion, defaultTimePerQuestion, isGeneratingAI]);

  // Auto-trigger AI Generation when entering Step 2
  useEffect(() => {
    if (step === 2 && !hasTriggeredAIRef.current && !isGeneratingAI) {
      // Force optionsPerQuestion to 4 for AI mode (standard MCQ)
      setQuizData(prev => ({ ...prev, optionsPerQuestion: 4 }));

      // If we don't have any questions, OR if all existing questions are completely empty
      const isEmptyPool = quizData.questions.length === 0 || quizData.questions.every(q => !q.questionText.trim() && q.options.every(opt => !opt.trim()));

      if (isEmptyPool) {
        console.log("Auto-triggering AI generation for Step 2");
        hasTriggeredAIRef.current = true; // Mark as triggered
        handleGenerateAIQuestions();
      }
    }

    // Reset trigger when going back to step 1
    if (step === 1) {
      hasTriggeredAIRef.current = false;
    }
  }, [step]); // Only depend on step, not on quizData to avoid infinite loops

  // Sync aiCoursePaperName whenever quizTitle changes (in step 1)
  useEffect(() => {
    if (step === 1) {
      setAiCoursePaperName(quizData.quizTitle);
    }
  }, [quizData.quizTitle, step]);

  useEffect(() => {
    const sumOfTimes = (quizData.questions || []).reduce((sum, q) => {
      return sum + (typeof q.timeLimitMinutes === 'number' && q.timeLimitMinutes > 0 ? q.timeLimitMinutes : 0);
    }, 0);
    setTotalCalculatedQuizTime(sumOfTimes);
  }, [quizData.questions]);

  const totalQuizMarks = (quizData.questions || []).reduce((sum, q) => sum + (typeof q.marks === 'number' ? q.marks : 0), 0);

  const validateQuizDraft = (): boolean => {
    if (!quizData.quizTitle.trim()) { toast.error("Please provide a quiz title."); return false; }
    if (!quizData.courseName.trim()) { toast.error("Please provide a course name."); return false; }
    if (quizData.passMarkPercentage === '') { toast.error("Please provide a pass mark percentage."); return false; }
    if (showSchedule && (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime)) { toast.error("Please set the full schedule."); return false; }

    // Past Date Validation - Only if scheduled
    if (showSchedule) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      const selectedDate = new Date(quizData.scheduledDate);
      const selectedDateTime = selectedDate.getTime();

      if (selectedDateTime < todayTime) {
        toast.error("You can only schedule quizzes for upcoming days, not in the past.");
        return false;
      }
    }

    return true;
  };

  const handleUpdateQuizDetails = (field: keyof LocalQuizData, value: string | number) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateCorrectAnswerIndex = (questionIndex: number, selectedOptionValue: string) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const question = newQuestions[questionIndex];
      const newIndex = question.options.findIndex(opt => opt === selectedOptionValue);

      newQuestions[questionIndex] = {
        ...question,
        correctAnswerIndex: newIndex !== -1 ? newIndex : null
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteQuestionFromDraft = (index: number) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions.splice(index, 1);
      return {
        ...prev,
        questions: newQuestions,
        totalQuestions: (typeof prev.totalQuestions === 'number' ? prev.totalQuestions : 0) - 1,
      };
    });
  };

  const handleUpdateDraftQuestion = (questionIndex: number, field: keyof LocalQuestion, value: any) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleGenerateAIQuestions = async () => {
    const topicToUse = aiCoursePaperName.trim() || quizData.quizTitle.trim();
    if (!topicToUse) {
      toast.error("Please provide a Paper Name in Step 1 or Enter a Topic.");
      return;
    }

    if (!aiCoursePaperName) setAiCoursePaperName(topicToUse);

    // Check if backend server is running
    setIsGeneratingAI(true);
    toast.info("Checking backend server...");

    try {
      const { aiService } = await import('@/services/aiService');
      const healthCheck = await aiService.checkServerHealth();

      if (!healthCheck.isHealthy) {
        toast.error(healthCheck.message, { duration: 8000 });
        setIsGeneratingAI(false);
        return;
      }

      toast.success("Backend server connected!");
    } catch (error) {
      toast.error("Could not connect to AI Backend.", {
        description: "Please stop your current server and run 'npm run dev:all' to start both frontend and AI server.",
        duration: 10000
      });
      setIsGeneratingAI(false);
      return;
    }

    // Don't clear questions immediately to prevent UI jump
    // setQuizData(prev => ({ ...prev, questions: [], totalQuestions: Number(prev.totalQuestions) || 5 }));

    try {
      const targetCount = Number(quizData.totalQuestions) || 5;

      // Use explicit pool size if set, otherwise default to targetCount (no multiplier if not specified, or user must specify)
      // User request: remove multiplier logic.
      const countToGenerate = aiPoolSize ? Number(aiPoolSize) : targetCount;

      if (countToGenerate < targetCount) {
        toast.error(`Pool size (${countToGenerate}) cannot be less than Questions to Attend (${targetCount}).`);
        setIsGeneratingAI(false);
        return;
      }

      let isFirstBatch = true;
      toast.info(`Generating a pool of ${countToGenerate} questions...`);

      await generateAIQuestions({
        coursePaperName: topicToUse,
        difficulty: aiDifficulty,
        numQuestions: countToGenerate,
        numOptions: quizData.optionsPerQuestion,
        marksPerQuestion: aiMarksPerQuestion,
        timePerQuestionSeconds: aiTimePerQuestionSeconds,
        onBatchComplete: (newQuestions) => {
          setQuizData(prev => {
            // Upon first batch, clear the old empty placeholders if they exist
            const currentQuestions = isFirstBatch ? [] : prev.questions;
            isFirstBatch = false;

            return {
              ...prev,
              questions: [...currentQuestions, ...newQuestions.map(q => ({
                questionText: q.questionText,
                options: q.options,
                correctAnswerIndex: q.options.indexOf(q.correctAnswer),
                marks: q.marks,
                timeLimitMinutes: q.timeLimitMinutes,
                explanation: q.explanation || ''
              }))]
            };
          });
          toast.success(`Received ${newQuestions.length} questions...`);
        }
      });

      setQuizData(prev => ({
        ...prev,
        quizTitle: prev.quizTitle.includes('(AI Generated)') ? prev.quizTitle : `${prev.quizTitle} (AI Generated)`,
        // DO NOT overwrite totalQuestions with the pool size.
        // The student view will handle pool randomization based on the original totalQuestions.
      }));

      toast.success(`Success! Final question pool ready.`);
    } catch (error) {
      console.error("AI Generation failed:", error);
      toast.error("Something went wrong during AI generation. Check console for details.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const prepareQuizForOutput = (): StoredQuiz | null => {
    if (!validateQuizDraft()) return null;

    // Safety check: ensure we aren't saving a placeholder empty quiz
    const actualQuestions = quizData.questions.filter(q => q.questionText.trim() !== '');
    if (actualQuestions.length === 0) {
      toast.error("Error: All questions are empty. Please generate or enter questions before saving.");
      return null;
    }

    const quizId = `qz-${Date.now()}`;
    const questionsForOutput = quizData.questions.map((q, index) => ({
      id: `q-${quizId}-${index}`,
      quizId: quizId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : '',
      marks: typeof q.marks === 'number' ? q.marks : 1,
      timeLimitMinutes: typeof q.timeLimitMinutes === 'number' ? q.timeLimitMinutes : 1,
      explanation: q.explanation || '',
    }));

    return {
      id: quizId,
      title: quizData.quizTitle,
      courseName: quizData.courseName,
      questionIds: [],
      timeLimitMinutes: totalCalculatedQuizTime,
      negativeMarking: negativeMarking,
      negativeMarksValue: negativeMarking ? Number(negativeMarksValue) : 0, // Use negativeMarksValue
      competitionMode: competitionMode,
      scheduledDate: showSchedule ? quizData.scheduledDate : new Date().toLocaleDateString('en-CA'),
      startTime: showSchedule ? quizData.startTime : "00:00",
      endTime: showSchedule ? quizData.endTime : "23:59",
      difficulty: quizDifficulty, // Include difficulty
      passPercentage: Number(quizData.passMarkPercentage) || 0,
      passMarkPercentage: Number(quizData.passMarkPercentage) || 0,
      totalQuestions: Number(quizData.totalQuestions) || 0,
      requiredCorrectAnswers: Math.ceil((Number(quizData.totalQuestions) * (Number(quizData.passMarkPercentage) || 0)) / 100),
      _questionsData: questionsForOutput, // Include full question data for easy retrieval
      quizId: quizId,
    };
  };

  const handleCreateQuiz = () => {
    if (!quizData.quizTitle.trim() || !quizData.courseName.trim() || quizData.passMarkPercentage === '') {
      setShowSetupModal(true);
      return;
    }
    const finalQuizData = prepareQuizForOutput();
    if (finalQuizData) {

      // 1. Prepare questions data (Omit<Question, 'id'>) - questions will be embedded by addQuiz
      const questionsToAdd: Omit<Question, 'id'>[] = finalQuizData._questionsData.map(q => ({
        quizId: q.quizId, // Placeholder, will be overwritten by addQuiz
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        timeLimitMinutes: q.timeLimitMinutes,
        explanation: q.explanation || '',
      }));

      // 2. Prepare data for QuizContext's addQuiz (which handles embedding questions and Supabase insertion)
      const quizToAdd: Omit<Quiz, 'id' | 'status'> = {
        quizId: finalQuizData.quizId,
        title: finalQuizData.title,
        courseName: finalQuizData.courseName,
        questions: [], // Will be populated by addQuiz with full question objects
        timeLimitMinutes: finalQuizData.timeLimitMinutes,
        negativeMarking: finalQuizData.negativeMarking,
        competitionMode: finalQuizData.competitionMode,
        scheduledDate: finalQuizData.scheduledDate,
        startTime: finalQuizData.startTime,
        endTime: finalQuizData.endTime,
        negativeMarksValue: finalQuizData.negativeMarksValue,
        difficulty: finalQuizData.difficulty,
        passPercentage: finalQuizData.passPercentage,
        totalQuestions: finalQuizData.totalQuestions,
        requiredCorrectAnswers: finalQuizData.requiredCorrectAnswers,
        createdAt: '', // Will be set by addQuiz
      };

      // 3. Add the quiz to the global pool (triggers Supabase mutation)
      // addQuiz will embed questions array and set status to 'ACTIVE'
      addQuiz(quizToAdd, questionsToAdd);

      // Reset form regardless of immediate success (mutation handles success/error toast)
      resetForm();
    }
  };

  const handleFinalSubmit = () => {
    if (!quizData.quizTitle.trim() || !quizData.courseName.trim() || quizData.passMarkPercentage === '') {
      toast.error("Please fill all fields.");
      return;
    }
    setShowSetupModal(false);
    handleCreateQuiz();
  };

  const handlePreviewQuiz = () => {
    const quizToPreview = prepareQuizForOutput();
    if (quizToPreview) {
      try {
        // We use the StoredQuiz structure for preview, which includes question data
        sessionStorage.setItem('preview_quiz_data', JSON.stringify(quizToPreview));
        toast.info("Loading quiz preview...");
        navigate(`/quiz-preview/${quizToPreview.id}`);
      } catch (error) {
        console.error("Failed to save quiz for preview:", error);
        toast.error("Failed to generate preview. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setQuizData({
      quizTitle: '',
      courseName: '',
      totalQuestions: 0,
      optionsPerQuestion: 4,
      questions: [],
      scheduledDate: '',
      startTime: '',
      endTime: '',
      passMarkPercentage: 0,
    });
    setNegativeMarking(false);
    setNegativeMarksValue('');
    setCompetitionMode(false);
    setDefaultTimePerQuestion(null);
    setTotalCalculatedQuizTime(0);
    setAiCoursePaperName('');
    setAiDifficulty('Easy');
    setQuizDifficulty('Medium'); // Reset difficulty
    setAiPoolSize(''); // Reset pool size
    setStep(1); // Reset step to 1
    setShowSchedule(false);
    setCurrentQuestionIndex(0);

    // Clear quizStep from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('quizStep');
    setSearchParams(newParams);

    localStorage.removeItem('quizCreatorState');
  };

  const handleProceed = () => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please enter Course / Paper Name");
      return;
    }
    if (!quizData.totalQuestions || quizData.totalQuestions <= 0) {
      toast.error("Please enter number of questions");
      return;
    }
    if (quizData.optionsPerQuestion === 0) {
      toast.error("Please select MCQ options (1 to 6)");
      return;
    }
    if (showSchedule && (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime)) {
      toast.error("Please set the scheduled date, start time, and end time.");
      return;
    }
    if (quizData.passMarkPercentage === '' || quizData.passMarkPercentage < 0 || quizData.passMarkPercentage > 100) {
      toast.error("Please enter a valid pass mark percentage (0-100).");
      localStorage.removeItem('quizCreatorState');
      return;
    }
    setStep(2);
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] p-4 lg:p-10 font-poppins">
      {/* Background Decorations */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-[#6C8BFF]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[#E38AD6]/5 rounded-full blur-[150px] -z-10 animate-pulse delay-1000" />

      <Card className="glass-card border-white/60 bg-white/40 shadow-2xl relative overflow-hidden backdrop-blur-xl rounded-[48px]">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6C8BFF] via-[#E38AD6] to-[#6C8BFF] animate-gradient-x" />

        <CardHeader className="p-10 md:p-16 border-b border-white/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBack ? onBack() : navigate(-1)}
                className="h-14 w-14 rounded-2xl bg-white/40 border border-white hover:bg-white/60 hover:scale-110 active:scale-95 transition-all group"
              >
                <ArrowLeft className="h-6 w-6 text-[#1E2455] group-hover:-translate-x-1 transition-transform" />
              </Button>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#6C8BFF]/10 rounded-xl border border-[#6C8BFF]/20">
                    <Brain className="h-8 w-8 text-[#6C8BFF]" />
                  </div>
                  <CardTitle className="text-4xl lg:text-5xl font-black text-[#1E2455] uppercase tracking-tighter">
                    {step === 1 ? 'Neural Synthesis' : 'Sequence Refinement'}
                  </CardTitle>
                </div>
                <p className="text-[10px] lg:text-xs font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-16">
                  {step === 1 ? 'Configuring AI-Generated Academic Material' : 'Management of Algorithmic Query Clusters'}
                </p>
              </div>
            </div>
            {step === 1 && (
              <div className="flex items-center gap-2 bg-[#6C8BFF]/10 px-6 py-3 rounded-2xl border border-[#6C8BFF]/20">
                <div className="h-2 w-2 bg-[#6C8BFF] rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-[#6C8BFF] uppercase tracking-widest italic">Phase 01: Parameter Definition</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-10 md:p-16 space-y-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="quizTitle" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-1">Synthesis Designation</Label>
                {step === 2 && (
                  <span className="text-[9px] font-black text-[#6C8BFF] uppercase tracking-widest italic bg-[#6C8BFF]/10 px-3 py-1 rounded-lg">Immutable in Phase 2</span>
                )}
              </div>
              <Input
                id="quizTitle"
                placeholder="Enter Paper Name / Topic Designation..."
                value={quizData.quizTitle}
                disabled={step === 2}
                onChange={(e) => {
                  handleUpdateQuizDetails('quizTitle', e.target.value);
                  setAiCoursePaperName(e.target.value);
                }}
                className="glass-input h-18 text-xl font-black text-[#1E2455] placeholder-[#7A80B8]/40 border-white/60 focus:bg-white"
              />
            </div>

            <div className="space-y-6">
              <Label htmlFor="courseName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-1">Disciplinary Domain</Label>
              <Select
                value={quizData.courseName}
                onValueChange={(value) => handleUpdateQuizDetails('courseName', value)}
                disabled={step === 2}
              >
                <SelectTrigger className="glass-input h-18 text-xl font-black text-[#1E2455] border-white/60 focus:bg-white">
                  <SelectValue placeholder="Select Academic Discipline..." />
                </SelectTrigger>
                <SelectContent className="glass-card bg-white/60 border-white/60 shadow-2xl rounded-[32px] overflow-hidden">
                  {availableCourses.length > 0 ? (
                    availableCourses.map((course) => (
                      <SelectItem key={course} value={course} className="py-4 px-6 text-base font-black uppercase tracking-tight focus:bg-[#6C8BFF]/5 focus:text-[#6C8BFF] cursor-pointer">
                        {course}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-[#7A80B8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-[#7A80B8]" />
                      </div>
                      <p className="text-sm font-bold text-[#7A80B8] italic">No disciplinary domains detected in the archive.</p>
                      <Button
                        variant="ghost"
                        className="text-[#6C8BFF] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#6C8BFF]/5 rounded-xl border border-[#6C8BFF]/20"
                        onClick={() => navigate('/teacher?view=courses')}
                      >
                        Initialize Management Archive
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-10 p-10 glass-card border-white/60 bg-white/40 shadow-xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-[#6C8BFF]/10 border border-[#6C8BFF]/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Calendar className="h-8 w-8 text-[#6C8BFF]" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter mb-2">Temporal Orchestration</h4>
                  <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] italic">Optional / Future Synthesis Scheduling</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className={cn(
                  "h-16 px-10 font-black uppercase tracking-[0.2em] text-[10px] rounded-[24px] border transition-all duration-700",
                  showSchedule ? "bg-[#6C8BFF] text-white border-transparent shadow-lg shadow-[#6C8BFF]/30" : "bg-white/40 border-white text-[#7A80B8] hover:text-[#6C8BFF] hover:bg-[#6C8BFF]/5 hover:border-[#6C8BFF]/30"
                )}
                onClick={() => setShowSchedule(!showSchedule)}
              >
                {showSchedule ? "DEACTIVATE MODULE" : "ACTIVATE SCHEDULER"}
              </Button>
            </div>

            {showSchedule && (
              <div className="grid gap-10 md:grid-cols-3 animate-in slide-in-from-top-6 duration-700 pt-6">
                <div className="space-y-4">
                  <Label htmlFor="scheduledDate" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Synthesis Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "glass-input h-16 w-full justify-start text-left font-black text-lg px-6",
                          !quizData.scheduledDate && "text-[#7A80B8]/40"
                        )}
                        disabled={step === 2}
                      >
                        <Calendar className="mr-4 h-6 w-6 text-[#6C8BFF]" />
                        {quizData.scheduledDate ? format(new Date(quizData.scheduledDate), "PPP") : <span className="uppercase tracking-widest text-[10px]">Select Date...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="glass-card p-0 border-white/60 shadow-2xl rounded-[32px] overflow-hidden" align="start">
                      <ShadcnCalendar
                        mode="single"
                        selected={quizData.scheduledDate ? new Date(quizData.scheduledDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleUpdateQuizDetails('scheduledDate', format(date, "yyyy-MM-dd"));
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="startTime" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Initialization Time</Label>
                  <div className="relative">
                    <Input
                      id="startTime"
                      type="time"
                      value={quizData.startTime}
                      disabled={step === 2}
                      onChange={(e) => handleUpdateQuizDetails('startTime', e.target.value)}
                      className="glass-input h-16 text-xl font-black text-[#1E2455] px-6 appearance-none"
                    />
                    <Clock className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#6C8BFF] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="endTime" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Termination Time</Label>
                  <div className="relative">
                    <Input
                      id="endTime"
                      type="time"
                      value={quizData.endTime}
                      disabled={step === 2}
                      onChange={(e) => handleUpdateQuizDetails('endTime', e.target.value)}
                      className="glass-input h-16 text-xl font-black text-[#1E2455] px-6 appearance-none"
                    />
                    <Clock className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#FF6B8A] pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-10 p-10 glass-card border-white/60 bg-white/40 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-6 mb-4">
              <div className="p-3 bg-[#4EE3B2]/10 rounded-xl border border-[#4EE3B2]/20">
                <Target className="h-7 w-7 text-[#4EE3B2]" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter mb-1">Assessment Metrics</h4>
                <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] italic">Synthesis Validation Parameters</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="space-y-6 lg:border-r border-white/40 pr-8">
                <Label htmlFor="passMark" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Proficiency Threshold (%)</Label>
                <div className="relative">
                  <Input
                    id="passMark"
                    type="number"
                    min="0"
                    max="100"
                    value={quizData.passMarkPercentage}
                    disabled={step === 2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') { handleUpdateQuizDetails('passMarkPercentage', ''); return; }
                      const numVal = parseInt(val);
                      if (numVal >= 0 && numVal <= 100) handleUpdateQuizDetails('passMarkPercentage', numVal);
                    }}
                    className="glass-input h-20 text-4xl font-black text-[#4EE3B2] text-center focus:bg-white"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#4EE3B2]/40">%</div>
                </div>
                <div className="flex items-center gap-4 bg-[#4EE3B2]/5 p-5 rounded-2xl border border-[#4EE3B2]/10">
                  <div className="h-3 w-3 bg-[#4EE3B2] rounded-full animate-ping" />
                  <p className="text-[10px] font-black text-[#1E2455] uppercase tracking-tight">
                    {quizData.totalQuestions && quizData.passMarkPercentage !== '' ? (
                      <>
                        Target: <span className="text-[#4EE3B2]">{Math.ceil((Number(quizData.totalQuestions) * Number(quizData.passMarkPercentage)) / 100)}</span> / {quizData.totalQuestions} Queries
                      </>
                    ) : (
                      "Pending metric definition..."
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-6 lg:border-r border-white/40 pr-8">
                <Label htmlFor="totalQuestions" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Evaluation Span</Label>
                <Input
                  id="totalQuestions"
                  type="number"
                  min="1"
                  value={quizData.totalQuestions}
                  disabled={step === 2}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateQuizDetails('totalQuestions', val === '' ? '' : parseInt(val));
                  }}
                  className="glass-input h-20 text-4xl font-black text-[#1E2455] text-center focus:bg-white"
                  placeholder="10"
                />
                <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-widest text-center px-4">Number of inquiries allocated per candidate.</p>
              </div>

              <div className="space-y-6">
                <Label htmlFor="aiPoolSize" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Algorithmic Pool</Label>
                <Input
                  id="aiPoolSize"
                  type="number"
                  min="1"
                  value={aiPoolSize}
                  disabled={step === 2}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAiPoolSize(val === '' ? '' : parseInt(val));
                  }}
                  className="glass-input h-20 text-4xl font-black text-[#6C8BFF] text-center focus:bg-white"
                  placeholder="50"
                />
                <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-widest text-center px-4">Total neural constructs available for randomization.</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/40">
              <Label htmlFor="quizDifficulty" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 mb-4 block">Cognitive Complexity Level</Label>
              <div className="grid grid-cols-3 gap-6">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    disabled={step === 2}
                    onClick={() => setQuizDifficulty(diff as 'Easy' | 'Medium' | 'Hard')}
                    className={cn(
                      "h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 border relative overflow-hidden group/diff",
                      quizDifficulty === diff
                        ? "bg-[#1E2455] text-white border-transparent shadow-xl"
                        : "bg-white/40 border-white text-[#7A80B8] hover:border-[#6C8BFF]/40 hover:bg-white/60"
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r opacity-0 group-hover/diff:opacity-20 transition-opacity duration-700",
                      diff === 'Easy' ? "from-[#4EE3B2] to-emerald-400" : diff === 'Medium' ? "from-[#FFB86C] to-orange-400" : "from-[#FF6B8A] to-rose-500"
                    )} />
                    {diff} LEVEL
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-10 p-10 glass-card border-white/60 bg-white/40 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-6 mb-4">
              <div className="p-3 bg-[#FFB86C]/10 rounded-xl border border-[#FFB86C]/20">
                <Settings2 className="h-7 w-7 text-[#FFB86C]" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter mb-1">Operational Parameters</h4>
                <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] italic">Fine-tuning the Synthesis Logic</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center justify-between p-8 rounded-[24px] bg-white/30 border border-white/40 hover:bg-white/50 transition-all group/setting">
                <div className="space-y-2">
                  <Label htmlFor="enableTimePerQuestion" className="text-[11px] font-black text-[#1E2455] uppercase tracking-[0.2em]">Temporal Constraints per Query</Label>
                  <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-widest italic opacity-60">Enable individual query windows.</p>
                </div>
                <Switch
                  id="enableTimePerQuestion"
                  checked={enableTimePerQuestion}
                  onCheckedChange={setEnableTimePerQuestion}
                  disabled={step === 2}
                />
              </div>

              {enableTimePerQuestion && (
                <div className="p-10 rounded-[32px] bg-white/40 border border-white/60 space-y-8 animate-in slide-in-from-top-4 duration-700">
                  <div className="space-y-4">
                    <Label htmlFor="defaultTimePerQuestion" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Standard Temporal Window (Minutes)</Label>
                    <Input
                      id="defaultTimePerQuestion"
                      type="number"
                      min="1"
                      placeholder="e.g., 1"
                      value={defaultTimePerQuestion === null ? '' : defaultTimePerQuestion}
                      disabled={step === 2}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDefaultTimePerQuestion(value === '' ? null : parseInt(value) || 1);
                      }}
                      className="glass-input h-18 text-2xl font-black text-[#FFB86C] text-center focus:bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-4 bg-[#FFB86C]/5 p-5 rounded-2xl border border-[#FFB86C]/10">
                    <Info className="h-5 w-5 text-[#FFB86C]" />
                    <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-wider leading-relaxed">This acts as the default initialization parameter for new queries. Manual overrides are available in Phase 2.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-8 rounded-[24px] bg-white/30 border border-white/40 hover:bg-white/50 transition-all group/setting">
                <div className="space-y-2">
                  <Label htmlFor="negativeMarking" className="text-[11px] font-black text-[#1E2455] uppercase tracking-[0.2em]">Deductive Valuation (Negative Marking)</Label>
                  <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-widest italic opacity-60">Penalize inaccurate academic responses.</p>
                </div>
                <Switch
                  id="negativeMarking"
                  checked={negativeMarking}
                  onCheckedChange={setNegativeMarking}
                  disabled={step === 2}
                />
              </div>

              {negativeMarking && (
                <div className="p-10 rounded-[32px] bg-[#FF6B8A]/5 border border-[#FF6B8A]/20 space-y-8 animate-in slide-in-from-top-4 duration-700">
                  <div className="space-y-4">
                    <Label htmlFor="negativeMarksValue" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Deduction Coefficient</Label>
                    <Input
                      id="negativeMarksValue"
                      type="number"
                      placeholder="e.g. 0.25"
                      value={negativeMarksValue}
                      disabled={step === 2}
                      onChange={(e) => setNegativeMarksValue(e.target.value)}
                      className="glass-input h-18 text-2xl font-black text-[#FF6B8A] text-center focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="space-y-10 p-10 glass-card border-white/60 bg-white/40 shadow-xl relative overflow-hidden group">
                <div className="flex items-center gap-6 mb-8">
                  <div className="p-3 bg-[#6C8BFF]/10 rounded-xl border border-[#6C8BFF]/20 group-hover:rotate-12 transition-all">
                    <Wand2 className="h-8 w-8 text-[#6C8BFF]" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter mb-1">Algorithmic Refinement</h4>
                    <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] italic">AI-Driven Academic Synthesis</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                  <div className="space-y-4">
                    <Label htmlFor="aiDifficulty" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Cognitive Tension</Label>
                    <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setAiDifficulty(value)} value={aiDifficulty}>
                      <SelectTrigger className="glass-input h-16 text-lg font-black text-[#1E2455] border-white/60 focus:bg-white">
                        <SelectValue placeholder="Tension Level" />
                      </SelectTrigger>
                      <SelectContent className="glass-card bg-white/60 border-white/60 shadow-2xl rounded-[24px]">
                        {['Easy', 'Medium', 'Hard'].map(d => (
                          <SelectItem key={d} value={d} className="py-3 px-6 text-sm font-black uppercase tracking-tight">{d} STAGE</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="aiMarks" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Valuation Scale</Label>
                    <Input
                      id="aiMarks"
                      type="number"
                      min="1"
                      value={aiMarksPerQuestion}
                      onChange={(e) => setAiMarksPerQuestion(parseInt(e.target.value) || 1)}
                      className="glass-input h-16 text-xl font-black text-[#6C8BFF] text-center focus:bg-white"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="aiTime" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Temporal Window (Seconds)</Label>
                    <Input
                      id="aiTime"
                      type="number"
                      min="5"
                      value={aiTimePerQuestionSeconds}
                      onChange={(e) => setAiTimePerQuestionSeconds(parseInt(e.target.value) || 60)}
                      className="glass-input h-16 text-xl font-black text-[#FFB86C] text-center focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleGenerateAIQuestions}
                    disabled={isGeneratingAI}
                    className="pastel-button-primary w-full h-20 rounded-[32px] text-[12px] tracking-[0.3em] group shadow-xl hover:shadow-glass-hover"
                  >
                    {isGeneratingAI ? (
                      <div className="flex items-center gap-6">
                        <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        NEURAL SYNTHESIS IN PROGRESS...
                      </div>
                    ) : (
                      <div className="flex items-center gap-6">
                        <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        INITIALIZE {aiPoolSize || quizData.totalQuestions} NEURAL CONSTRUCTS
                      </div>
                    )}
                  </Button>
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="ghost"
                      className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] hover:text-[#6C8BFF] hover:bg-[#6C8BFF]/5 rounded-xl transition-all"
                      onClick={() => {
                        toast.info("Expert Rules: realistic distractors, clear conceptual focus, and no unrelated options.", {
                          icon: <Info className="h-4 w-4 text-[#6C8BFF]" />
                        });
                      }}
                    >
                      <Info className="h-4 w-4 mr-3" /> Synthesis Protocols
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                {quizData.questions.length === 0 ? (
                  <div className="p-20 glass-card border-white/60 bg-white/20 text-center space-y-8 rounded-[40px]">
                    <div className="w-24 h-24 bg-[#6C8BFF]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Brain className="h-12 w-12 text-[#6C8BFF]" />
                    </div>
                    <p className="text-xl font-bold text-[#7A80B8] italic">
                      {isGeneratingAI ? "NEURAL SYNTHESIS IN PROGRESS..." : "Algorithmic pool is currently void. Initialize constructs to begin."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Wizard Navigation Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 glass-card border-white shadow-xl rounded-[32px] bg-white/60">
                      <div className="flex items-center gap-8">
                        <div className="h-16 w-16 rounded-2xl bg-[#1E2455] text-white flex items-center justify-center font-black text-2xl shadow-2xl rotate-3">
                          {currentQuestionIndex + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-[#1E2455] uppercase tracking-tighter">Neural Construct {currentQuestionIndex + 1}</h4>
                          <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-widest italic opacity-60">Synchronizing {quizData.questions.length} Total Constructs</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="h-14 px-8 font-black text-[#7A80B8] uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-[#6C8BFF]/5 border border-white/60 transition-all disabled:opacity-30"
                        >
                          Retrograde
                        </Button>
                        <Button
                          onClick={() => setCurrentQuestionIndex(prev => Math.min(quizData.questions.length - 1, prev + 1))}
                          disabled={currentQuestionIndex === quizData.questions.length - 1}
                          className="h-14 px-10 glass-card border-[#6C8BFF]/40 hover:border-[#6C8BFF]/60 hover:bg-[#6C8BFF]/5 text-[#6C8BFF] font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center gap-4 group transition-all duration-500 disabled:opacity-30"
                        >
                          Sequence Proceed
                        </Button>
                      </div>
                    </div>

                    {quizData.questions[currentQuestionIndex] && (
                      <div className="glass-card p-10 md:p-14 border-white/80 bg-white/40 shadow-2xl rounded-[48px] relative animate-in zoom-in-95 fade-in duration-700" key={currentQuestionIndex}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all group"
                          onClick={() => {
                            handleDeleteQuestionFromDraft(currentQuestionIndex);
                            if (currentQuestionIndex >= quizData.questions.length - 1) {
                              setCurrentQuestionIndex(Math.max(0, quizData.questions.length - 2));
                            }
                          }}
                        >
                          <Trash2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </Button>

                        <div className="space-y-12">
                          <div className="space-y-6">
                            <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-2 block">Construct Inquiry</Label>
                            <Textarea
                              value={quizData.questions[currentQuestionIndex].questionText}
                              onChange={(e) => handleUpdateDraftQuestion(currentQuestionIndex, 'questionText', e.target.value)}
                              placeholder="Refine neural query..."
                              className="glass-input min-h-[140px] text-xl font-bold text-[#1E2455] p-8 leading-relaxed focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {quizData.questions[currentQuestionIndex].options.map((option, optIndex) => (
                              <div key={optIndex} className="space-y-4">
                                <Label className="text-[9px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-4 block">Option {String.fromCharCode(65 + optIndex)}</Label>
                                <div className="relative group/opt">
                                  <Input
                                    value={option}
                                    onChange={(e) => handleUpdateOption(currentQuestionIndex, optIndex, e.target.value)}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="glass-input h-16 text-lg font-bold text-[#1E2455] px-12 focus:bg-white"
                                  />
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#7A80B8]/40 group-focus-within/opt:text-[#6C8BFF] transition-colors">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-8 p-10 rounded-[40px] bg-[#4EE3B2]/5 border border-[#4EE3B2]/20">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] font-black text-[#4EE3B2] uppercase tracking-[0.4em] pl-2 flex items-center gap-4">
                                <CheckCircle2 className="h-5 w-5" /> Validated Response
                              </Label>
                              <span className="text-[9px] font-black text-[#1E2455]/40 uppercase tracking-widest italic">Phase 2 Lock Active</span>
                            </div>
                            <RadioGroup
                              onValueChange={(value) => handleUpdateCorrectAnswerIndex(currentQuestionIndex, value)}
                              value={quizData.questions[currentQuestionIndex].correctAnswerIndex !== null ?
                                quizData.questions[currentQuestionIndex].options[quizData.questions[currentQuestionIndex].correctAnswerIndex!] : ''}
                              className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                              {quizData.questions[currentQuestionIndex].options.map((option, optIndex) => (
                                option && (
                                  <div key={optIndex} className={cn(
                                    "flex items-center space-x-6 p-6 rounded-2xl border transition-all cursor-pointer group/radio",
                                    quizData.questions[currentQuestionIndex].correctAnswerIndex === optIndex
                                      ? "bg-white border-[#4EE3B2] shadow-lg shadow-[#4EE3B2]/20"
                                      : "bg-white/40 border-white hover:border-[#4EE3B2]/40 hover:bg-white/60"
                                  )}>
                                    <RadioGroupItem value={option} id={`q-correct-${currentQuestionIndex}-${optIndex}`} className="h-6 w-6 border-2 border-[#4EE3B2]/40 text-[#4EE3B2] focus:ring-[#4EE3B2]/20" />
                                    <Label htmlFor={`q-correct-${currentQuestionIndex}-${optIndex}`} className="font-bold text-[#1E2455] cursor-pointer w-full uppercase tracking-tight text-sm">
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                    </Label>
                                  </div>
                                )
                              ))}
                            </RadioGroup>
                          </div>

                          <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <Label htmlFor={`q-marks-${currentQuestionIndex}`} className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Construct Valuation</Label>
                              <Input
                                id={`q-marks-${currentQuestionIndex}`}
                                type="number"
                                min="0"
                                max="10"
                                value={quizData.questions[currentQuestionIndex].marks}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                  if (val === '' || (val >= 0 && val <= 10)) {
                                    handleUpdateDraftQuestion(currentQuestionIndex, 'marks', val === '' ? '' : val);
                                  }
                                }}
                                className="glass-input h-16 text-xl font-black text-[#4EE3B2] text-center focus:bg-white"
                              />
                            </div>
                            {enableTimePerQuestion && (
                              <div className="space-y-4">
                                <Label htmlFor={`q-time-${currentQuestionIndex}`} className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Temporal Allocation (Mins)</Label>
                                <Input
                                  id={`q-time-${currentQuestionIndex}`}
                                  type="number"
                                  min="1"
                                  value={quizData.questions[currentQuestionIndex].timeLimitMinutes}
                                  onChange={(e) => handleUpdateDraftQuestion(currentQuestionIndex, 'timeLimitMinutes', e.target.value)}
                                  className="glass-input h-16 text-xl font-black text-[#FFB86C] text-center focus:bg-white"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-10 md:p-16 border-t border-white/40 bg-white/10 flex flex-col sm:flex-row justify-end gap-6">
          {step === 1 ? (
            <Button onClick={handleProceed} className="pastel-button-primary h-20 px-16 rounded-[32px] text-[12px] tracking-[0.4em] group shadow-xl">
              INITIALIZE SYNTHESIS PHASE 02
              <ArrowLeft className="h-6 w-6 ml-6 rotate-180 group-hover:translate-x-2 transition-transform" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="h-20 px-12 font-black text-[#7A80B8] uppercase tracking-[0.3em] text-[11px] rounded-[32px] hover:bg-[#6C8BFF]/5 border border-white/60 transition-all"
              >
                Retrograde
              </Button>
              <Button
                variant="outline"
                onClick={handlePreviewQuiz}
                className="h-20 px-12 rounded-[32px] border-white/60 bg-white/40 text-[#7A80B8] hover:text-[#1E2455] hover:bg-white/60 font-black uppercase tracking-[0.3em] text-[11px] shadow-sm transition-all flex items-center gap-6"
              >
                <Eye className="h-6 w-6" /> PREVIEW SYNTHESIS
              </Button>
              <Button
                onClick={handleCreateQuiz}
                className="pastel-button-primary h-20 px-16 rounded-[32px] text-[12px] tracking-[0.3em] group shadow-xl hover:shadow-glass-hover flex items-center gap-6"
              >
                {showSchedule ? (
                  <>
                    <Calendar className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    ORCHESTRATE SCHEDULED COMMIT
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    COMMIT SYNTHESIS NOW
                  </>
                )}
              </Button>
            </>
          )}
        </CardFooter>
      </Card >

      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="glass-card sm:max-w-[600px] border-white/60 bg-white/40 backdrop-blur-3xl rounded-[48px] p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-10" />

          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-[#6C8BFF]/10 rounded-xl border border-[#6C8BFF]/20">
                <Wand2 className="h-8 w-8 text-[#6C8BFF]" />
              </div>
              <DialogTitle className="text-4xl font-black text-[#1E2455] uppercase tracking-tighter">
                Synthesis Commitment
              </DialogTitle>
            </div>
            <DialogDescription className="text-lg font-bold text-[#3A3F6B] italic opacity-60 tracking-tight pl-14">
              Finalize algorithmic parameters before archival commitment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-10 py-10">
            <div className="space-y-4">
              <Label htmlFor="modalCourseName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Disciplinary Domain</Label>
              <Select value={quizData.courseName || ""} onValueChange={(val) => handleUpdateQuizDetails('courseName', val)}>
                <SelectTrigger id="modalCourseName" className="glass-input h-16 text-xl font-black text-[#1E2455] border-white/60">
                  <SelectValue placeholder="Select Discipline..." />
                </SelectTrigger>
                <SelectContent className="glass-card bg-white/60 border-white/60 shadow-2xl rounded-[24px]">
                  {availableCourses.map((course) => (
                    <SelectItem key={course} value={course} className="text-base font-black px-6 py-4 cursor-pointer">{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="modalExamName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Paper Designation</Label>
              <Input
                id="modalExamName"
                placeholder="e.g. Unit 1 Quiz"
                value={quizData.quizTitle}
                onChange={(e) => handleUpdateQuizDetails('quizTitle', e.target.value)}
                className="glass-input h-16 text-xl font-black text-[#1E2455] border-white/60"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="modalPassMark" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Proficiency Threshold (%)</Label>
              <Input
                id="modalPassMark"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 50"
                value={quizData.passMarkPercentage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') { handleUpdateQuizDetails('passMarkPercentage', ''); return; }
                  const numVal = parseInt(val);
                  if (numVal >= 0 && numVal <= 100) handleUpdateQuizDetails('passMarkPercentage', numVal);
                }}
                className="glass-input h-16 text-xl font-black text-[#4EE3B2] text-center border-white/60"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-6 pt-5 border-t border-white/40">
            <Button
              variant="ghost"
              onClick={() => setShowSetupModal(false)}
              className="h-16 px-10 font-black text-[#7A80B8] uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-[#6C8BFF]/5 border border-white/60 transition-all flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              className="pastel-button-primary h-16 px-12 text-[10px] tracking-[0.3em] rounded-2xl flex-1 group shadow-xl"
            >
              SAVE & FINALIZE SYNTHESIS
              <Send className="h-5 w-5 ml-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default QuizCreator;
