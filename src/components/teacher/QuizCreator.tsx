"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Eye, Save, Brain, ListChecks, Info, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { Target } from 'lucide-react';

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

const QuizCreator = () => {
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
        if (parsed.step) setStep(parsed.step);
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
      step
    };
    localStorage.setItem('quizCreatorState', JSON.stringify(stateToSave));
  }, [quizData, negativeMarking, negativeMarksValue, competitionMode, quizDifficulty, step]);

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

      // IMPORTANT: If we have MORE questions than target (e.g. AI pool), do NOT slice them off automatically.
      // Only add questions if we have FEWER than target.
      if (currentCount >= targetCount && targetCount > 0) return prev;

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
      // const slicedQuestions = newQuestions.slice(0, targetCount); // DISABLED for AI Pool support
      const updatedQuestions = newQuestions.map(q => {
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
    if (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime) { toast.error("Please set the full schedule."); return false; }

    // Past Date Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(quizData.scheduledDate);
    if (selectedDate < today) {
      toast.error("You can only schedule quizzes for upcoming days, not in the past.");
      return false;
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
      toast.error("Failed to connect to backend server. Please ensure it's running on port 5000.");
      setIsGeneratingAI(false);
      return;
    }

    // Don't clear questions immediately to prevent UI jump
    // setQuizData(prev => ({ ...prev, questions: [], totalQuestions: Number(prev.totalQuestions) || 5 }));

    try {
      const targetCount = Number(quizData.totalQuestions) || 5;
      const countToGenerate = targetCount * 5; // 5x pool multiplier
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
      scheduledDate: quizData.scheduledDate,
      startTime: quizData.startTime,
      endTime: quizData.endTime,
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
    setStep(1); // Reset step to 1

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
    if (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime) {
      toast.error("Please set the scheduled date, start time, and end time.");
      return;
    }
    if (quizData.passMarkPercentage === '' || quizData.passMarkPercentage < 0 || quizData.passMarkPercentage > 100) {
      toast.error("Please enter a valid pass mark percentage (0-100).");
      return;
    }
    setStep(2);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6" /> {step === 1 ? 'Configure Quiz' : 'Manage Questions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quizTitle">Paper Name</Label>
          <Input
            id="quizTitle"
            placeholder="Enter Paper Name / Topic"
            value={quizData.quizTitle}
            disabled={step === 2} // Lock
            onChange={(e) => {
              handleUpdateQuizDetails('quizTitle', e.target.value);
              setAiCoursePaperName(e.target.value);
            }}
            className="mt-1"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="courseName">Course Name (for Student Dashboard)</Label>
          <Select
            value={quizData.courseName}
            onValueChange={(value) => handleUpdateQuizDetails('courseName', value)}
            disabled={step === 2}
          >
            <SelectTrigger className="w-full mt-1 h-12 rounded-xl border-slate-200">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {availableCourses.length > 0 ? (
                availableCourses.map((course) => (
                  <SelectItem key={course} value={course} className="py-3 focus:bg-indigo-50">
                    {course}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-500">No courses added yet.</p>
                  <Button
                    variant="link"
                    className="text-indigo-600 font-bold p-0"
                    onClick={() => navigate('/teacher?view=courses')}
                  >
                    Add Courses in Management
                  </Button>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Scheduling Inputs */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Quiz Scheduling</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={quizData.scheduledDate}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('scheduledDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={quizData.startTime}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('startTime', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={quizData.endTime}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('endTime', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Pass Mark Configuration */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Pass Criteria</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="passMark">Pass Mark Percentage (%)</Label>
              <Input
                id="passMark"
                type="number"
                min="0"
                max="100"
                value={quizData.passMarkPercentage}
                disabled={step === 2}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    handleUpdateQuizDetails('passMarkPercentage', '');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal >= 0 && numVal <= 100) {
                    handleUpdateQuizDetails('passMarkPercentage', numVal);
                  }
                }}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col justify-end pb-2">
              <p className="text-sm font-medium text-gray-600">
                {quizData.totalQuestions && quizData.passMarkPercentage !== '' ? (
                  <>
                    Minimum Correct Answers Required: <span className="text-blue-600 font-bold">
                      {Math.ceil((Number(quizData.totalQuestions) * Number(quizData.passMarkPercentage)) / 100)}
                    </span> / {quizData.totalQuestions}
                  </>
                ) : (
                  "Enter total questions and pass percentage"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Question Count and Options */}
        <div className="grid gap-4 md:grid-cols-2 border-t pt-4 mt-4">
          <div>
            <Label htmlFor="totalQuestions">Total Questions in Quiz</Label>
            <Input
              id="totalQuestions"
              type="number"
              min="0"
              value={quizData.totalQuestions}
              disabled={step === 2} // Lock
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateQuizDetails('totalQuestions', val === '' ? '' : parseInt(val));
              }}
              className="mt-1"
            />
          </div>
          {/* optionsPerQuestion hidden as AI handles this automatically now */}
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Additional Quiz Settings</h3>

          {/* NEW: Difficulty Selection */}
          <div className="mb-4">
            <Label htmlFor="quizDifficulty">Quiz Difficulty Level</Label>
            <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setQuizDifficulty(value)} value={quizDifficulty} disabled={step === 2}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Label htmlFor="enableTimePerQuestion">Enable Time per Question</Label>
            <Switch
              id="enableTimePerQuestion"
              checked={enableTimePerQuestion}
              onCheckedChange={setEnableTimePerQuestion}
              disabled={step === 2} // Lock
            />
          </div>
          {enableTimePerQuestion && (
            <div className="mt-3">
              <Label htmlFor="defaultTimePerQuestion">Default Time per Question (minutes, optional)</Label>
              <Input
                id="defaultTimePerQuestion"
                type="number"
                min="1"
                placeholder="e.g., 1 (will be overridden by question-specific time)"
                value={defaultTimePerQuestion === null ? '' : defaultTimePerQuestion}
                disabled={step === 2} // Lock
                onChange={(e) => {
                  const value = e.target.value;
                  setDefaultTimePerQuestion(value === '' ? null : parseInt(value) || 1);
                }}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                This sets a default for new questions. Individual questions can override this.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
            <Switch
              id="negativeMarking"
              checked={negativeMarking}
              onCheckedChange={setNegativeMarking}
              disabled={step === 2} // Lock
            />
          </div>
          {negativeMarking && (
            <div className="mt-2 pl-2 border-l-2 border-red-200">
              <Label htmlFor="negativeMarksValue">Negative marks for wrong answer</Label>
              <Input
                id="negativeMarksValue"
                type="number"
                placeholder="e.g. 0.25"
                value={negativeMarksValue}
                disabled={step === 2}
                onChange={(e) => setNegativeMarksValue(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Step 2 Content */}
        {
          step === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-2">Questions for "{quizData.quizTitle || 'New Quiz'}"</h3>
              <div className="flex justify-between items-center mb-4 p-3 border rounded-md bg-blue-50 text-blue-800 font-semibold">
                <span>Pool Size: {quizData.questions.length} / Attempt: {quizData.totalQuestions}</span>
                <span>Total Marks: {totalQuizMarks}</span>
                <span>Total Quiz Time: {totalCalculatedQuizTime} minutes</span>
              </div>

              {/* AI Question Generation Section */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Expert Academic Question Generator
                </h3>
                <div>
                  <Label htmlFor="aiDifficulty">Difficulty</Label>
                  <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setAiDifficulty(value)} value={aiDifficulty}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aiMarks">Marks per Question</Label>
                    <Input
                      id="aiMarks"
                      type="number"
                      min="1"
                      value={aiMarksPerQuestion}
                      onChange={(e) => setAiMarksPerQuestion(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aiTime">Time per Question (seconds)</Label>
                    <Input
                      id="aiTime"
                      type="number"
                      min="5"
                      value={aiTimePerQuestionSeconds}
                      onChange={(e) => setAiTimePerQuestionSeconds(parseInt(e.target.value) || 60)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleGenerateAIQuestions}
                    disabled={isGeneratingAI}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold shadow-lg shadow-indigo-100 disabled:bg-indigo-400"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="h-5 w-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        {quizData.questions.length > 0 ? 'Regenerate' : 'Generate'} {quizData.totalQuestions} Expert Questions for "{aiCoursePaperName || quizData.quizTitle || 'Topic'}"
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-indigo-600 text-[10px] uppercase tracking-widest font-black"
                    onClick={() => {
                      toast.info("Expert Rules: realistic distractors, clear conceptual focus, and no unrelated options.", {
                        duration: 5000,
                        icon: <Info className="h-4 w-4" />
                      });
                    }}
                  >
                    <Info className="h-3 w-3 mr-1.5" /> Review AI Rules & Strict Guidelines
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  AI will generate {quizData.totalQuestions} questions with <strong className="text-indigo-600">4 options</strong> each (standard MCQ format),
                  setting each to {aiMarksPerQuestion} marks and {aiTimePerQuestionSeconds} seconds.
                </p>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto p-3 border rounded-md bg-gray-50 mt-4 relative">
                {/* Overlay removed for real-time visibility */}
                {quizData.questions.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">
                    {isGeneratingAI ? "" : "No questions added yet. Click \"Generate Questions with AI\" to begin."}
                  </p>
                ) : (
                  quizData.questions.map((q, index) => (
                    <Card key={index} className="p-4 border rounded-md bg-white shadow-sm relative">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleDeleteQuestionFromDraft(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="space-y-3">
                        <div>
                          <Label>Question {index + 1}</Label>
                          <div className="mt-1">
                            <Textarea
                              value={q.questionText}
                              onChange={(e) => handleUpdateDraftQuestion(index, 'questionText', e.target.value)}
                              placeholder="Enter question text..."
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-2 border rounded-md bg-white text-sm">
                              <span className="font-semibold text-gray-500 w-6">{String.fromCharCode(65 + optIndex)}.</span>
                              <Input
                                value={option}
                                onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                        <Label className="text-xs text-indigo-600 font-bold flex items-center gap-1 mb-1">
                          <Save className="h-3 w-3" /> Correct Answer (AI Selected)
                        </Label>
                        <RadioGroup
                          onValueChange={(value) => handleUpdateCorrectAnswerIndex(index, value)}
                          value={q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : ''}
                          className="flex flex-col space-y-2 mt-2"
                          disabled={true} // AI questions have locked correct answers
                        >
                          {q.options.map((option, optIndex) => (
                            option && (
                              <div key={optIndex} className="flex items-center space-x-2 bg-indigo-50/30 p-2 rounded-md border border-transparent hover:border-indigo-100">
                                <RadioGroupItem value={option} id={`q-correct-${index}-${optIndex}`} />
                                <Label htmlFor={`q-correct-${index}-${optIndex}`} className="font-medium cursor-pointer text-gray-700">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </Label>
                              </div>
                            )
                          ))}
                        </RadioGroup>
                        <div>
                          <Label htmlFor={`q-marks-${index}`}>Marks (1-10)</Label>
                          <Input
                            id={`q-marks-${index}`}
                            type="number"
                            min="0"
                            max="10"
                            value={q.marks}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value);
                              if (val === '' || (val >= 0 && val <= 10)) {
                                handleUpdateDraftQuestion(index, 'marks', val === '' ? '' : val);
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
                        {enableTimePerQuestion && (
                          <div>
                            <Label htmlFor={`q-time-${index}`}>Time for this Question (minutes)</Label>
                            <Input
                              id={`q-time-${index}`}
                              type="number"
                              min="1"
                              value={q.timeLimitMinutes}
                              onChange={(e) => handleUpdateDraftQuestion(index, 'timeLimitMinutes', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        )}
                        {/* Explanation/Rationale field removed as per user request */}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )
        }
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
        {step === 1 ? (
          <Button onClick={handleProceed} className="w-full bg-blue-600 hover:bg-blue-700">
            Proceed
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setStep(1)} className="w-[100px]">
              Back
            </Button>
            <Button onClick={handlePreviewQuiz} variant="outline" className="w-full sm:w-auto">
              <Eye className="h-4 w-4 mr-2" /> Preview Quiz
            </Button>
            <Button onClick={handleCreateQuiz} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> Create & Schedule Quiz
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizCreator;