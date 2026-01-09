"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, PlusCircle, Trash2, Eye, Save, Brain } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuiz, Quiz, Question } from '@/context/QuizContext'; // Import Quiz and Question types

// Define a type for questions in local draft state
interface LocalQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null; // Index of the correct option, or null if none selected
  marks: number | '';
  timeLimitMinutes: number | ''; // Allow timeLimitMinutes to be an empty string
}

// Define a type for the entire quiz data managed locally
interface LocalQuizData {
  quizTitle: string;
  courseName: string; // ADDED
  totalQuestions: number | ''; // Allow empty string for input flexibility
  optionsPerQuestion: number;
  questions: LocalQuestion[];
  // NEW SCHEDULING FIELDS
  scheduledDate: string; // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
}

// Define the structure for a quiz stored in session storage (compatible with QuizContext types for preview)
interface StoredQuiz {
  id: string;
  title: string;
  courseName: string; // ADDED
  questionIds: string[];
  timeLimitMinutes: number;
  negativeMarking: boolean;
  negativeMarksValue: number; // Updated field name for consistency
  competitionMode: boolean;
  scheduledDate: string; // ADDED
  startTime: string;     // ADDED
  endTime: string;       // ADDED
  difficulty: 'Easy' | 'Medium' | 'Hard'; // ADDED DIFFICULTY

  _questionsData: {
    id: string;
    quizId: string;
    questionText: string;
    options: string[];
    correctAnswer: string; // Converted from index
    marks: number;
    timeLimitMinutes: number; // Added timeLimitMinutes for stored questions
  }[];
}

const QuizCreator = () => {
  const navigate = useNavigate();
  const { generateAIQuestions, addQuiz, addCourse } = useQuiz(); // Removed addQuestion

  // Consolidated quiz data state
  const [quizData, setQuizData] = useState<LocalQuizData>({
    quizTitle: '',
    courseName: '', // Initialize courseName
    totalQuestions: 0, // Start with 0 as requested
    optionsPerQuestion: 4, // Default to 4 options as requested
    questions: [], // Start with empty list if 0 questions
    scheduledDate: '',
    startTime: '',
    endTime: '',
  });

  // Other quiz details not explicitly part of the 'Quiz' structure provided by user, but still needed
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [negativeMarksValue, setNegativeMarksValue] = useState<string | number>(''); // State for negative marks value
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);

  const [defaultTimePerQuestion, setDefaultTimePerQuestion] = useState<number | null>(null); // New state for optional default time
  const [enableTimePerQuestion, setEnableTimePerQuestion] = useState<boolean>(false); // Toggle for time per question
  const [totalCalculatedQuizTime, setTotalCalculatedQuizTime] = useState<number>(0); // New state for total quiz time
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium'); // NEW: Quiz Difficulty

  // AI Question Generation State (now local to QuizCreator)
  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  /* New state for wizard step */
  const [step, setStep] = useState<number>(1);

  // Effect to synchronize quizData.questions with totalQuestions and optionsPerQuestion
  useEffect(() => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      const targetCount = prev.totalQuestions === '' ? 0 : prev.totalQuestions;

      // Adjust number of questions
      while (newQuestions.length < targetCount) {
        newQuestions.push({
          questionText: '',
          options: Array(prev.optionsPerQuestion).fill(''),
          correctAnswerIndex: null,
          marks: 0,
          timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1,
        });
      }
      const slicedQuestions = newQuestions.slice(0, targetCount);

      // Adjust options count for all questions
      const updatedQuestions = slicedQuestions.map(q => {
        const newOptions = [...q.options];
        while (newOptions.length < prev.optionsPerQuestion) {
          newOptions.push('');
        }
        const adjustedOptions = newOptions.slice(0, prev.optionsPerQuestion);

        let newCorrectAnswerIndex = q.correctAnswerIndex;
        // If the correct answer index is now out of bounds or the option at that index is empty, reset it
        if (newCorrectAnswerIndex !== null && (newCorrectAnswerIndex >= adjustedOptions.length || !adjustedOptions[newCorrectAnswerIndex])) {
          newCorrectAnswerIndex = null;
        }

        return {
          ...q,
          options: adjustedOptions,
          correctAnswerIndex: newCorrectAnswerIndex,
        };
      });

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  }, [quizData.totalQuestions, quizData.optionsPerQuestion, defaultTimePerQuestion]);

  // Effect to calculate total quiz time whenever questions change
  useEffect(() => {
    const sumOfTimes = quizData.questions.reduce((sum, q) => {
      // Only sum if timeLimitMinutes is a valid number
      return sum + (typeof q.timeLimitMinutes === 'number' && q.timeLimitMinutes > 0 ? q.timeLimitMinutes : 0);
    }, 0);
    setTotalCalculatedQuizTime(sumOfTimes);
  }, [quizData.questions]);

  // Calculate total marks dynamically
  const totalQuizMarks = quizData.questions.reduce((sum, q) => sum + (typeof q.marks === 'number' ? q.marks : 0), 0);

  // Helper validation function
  const validateQuizDraft = (): boolean => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please provide a quiz title.");
      return false;
    }
    if (!quizData.courseName.trim()) {
      toast.error("Please provide a course name.");
      return false;
    }
    if (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime) {
      toast.error("Please set the scheduled date, start time, and end time.");
      return false;
    }
    if (new Date(`${quizData.scheduledDate}T${quizData.startTime}`) >= new Date(`${quizData.scheduledDate}T${quizData.endTime}`)) {
      toast.error("Start time must be before end time.");
      return false;
    }
    if (enableTimePerQuestion && totalCalculatedQuizTime <= 0) {
      toast.error("Total quiz time must be at least 1 minute. Please ensure all questions have a valid time limit.");
      return false;
    }
    if (quizData.questions.length === 0) {
      toast.error("Please add at least one question to the quiz.");
      return false;
    }
    // Check global negative marks setting
    if (negativeMarking && (negativeMarksValue === '' || Number(negativeMarksValue) < 0)) {
      toast.error("Please enter a valid value for negative marks.");
      return false;
    }

    for (const [index, q] of quizData.questions.entries()) {
      if (!q.questionText.trim()) {
        toast.error(`Question ${index + 1}: Question text cannot be empty.`);
        return false;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${index + 1}: All options must be filled.`);
        return false;
      }
      if (q.correctAnswerIndex === null || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        toast.error(`Question ${index + 1}: Please select the correct answer`);
        return false;
      }
      if (q.marks === '' || q.marks < 1 || q.marks > 10) {
        toast.error(`Question ${index + 1}: Please enter marks (1 to 10)`);
        return false;
      }
      // New validation for individual question time: check for empty string OR non-positive number
      if (enableTimePerQuestion && (q.timeLimitMinutes === '' || (typeof q.timeLimitMinutes === 'number' && q.timeLimitMinutes <= 0))) {
        toast.error(`Question ${index + 1}: Please enter time per question`);
        return false;
      }
    }
    return true;
  };

  const handleDeleteQuestionFromDraft = (questionIndex: number) => {
    setQuizData((prev) => {
      const filteredQuestions = prev.questions.filter((_, idx) => idx !== questionIndex);
      return {
        ...prev,
        questions: filteredQuestions, // Update the questions array directly
        totalQuestions: filteredQuestions.length, // Update totalQuestions to match the new array length
      };
    });
    toast.info("Question removed from draft.");
  };

  const handleUpdateQuizDetails = (field: keyof LocalQuizData, value: string | number) => {
    setQuizData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateCorrectAnswerIndex = (questionIndex: number, selectedOptionValue: string) => {
    setQuizData((prev) => {
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


  const handleUpdateDraftQuestion = (
    questionIndex: number,
    field: 'questionText' | 'marks' | 'timeLimitMinutes', // Added timeLimitMinutes
    value: string | number
  ) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      if (field === 'marks' || field === 'timeLimitMinutes') {
        // If value is empty string, store as empty string. Otherwise, parse to int.
        const parsedValue = value === '' ? '' : parseInt(value as string);
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: parsedValue };
      } else {
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value as string };
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const handleGenerateAIQuestions = () => {
    if (!aiCoursePaperName.trim()) {
      toast.error("Please enter a course/paper name for AI generation.");
      return;
    }

    const generatedQuestions = generateAIQuestions(
      aiCoursePaperName,
      aiDifficulty,
      quizData.totalQuestions === '' ? 0 : quizData.totalQuestions, // Use totalQuestions from quiz setup
      quizData.optionsPerQuestion // Use optionsPerQuestion from quiz setup
    );

    // Map generated questions to LocalQuestion format
    const newDraftQuestions: LocalQuestion[] = generatedQuestions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.options.indexOf(q.correctAnswer), // Find index of correct answer
      marks: 0, // Default marks 0, as per requirement
      timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1, // Use default or 1
    }));

    setQuizData((prev) => ({
      ...prev,
      questions: newDraftQuestions,
      totalQuestions: newDraftQuestions.length, // Update totalQuestions to match generated count
      courseName: prev.courseName || aiCoursePaperName, // Optionally set course name if empty
    }));
    toast.success("AI generated questions loaded into draft. Please review and set marks.");
  };

  // Helper to prepare quiz data for storage/logging/context
  const prepareQuizForOutput = (isForPreview: boolean = false): StoredQuiz | null => {
    if (!validateQuizDraft()) {
      return null;
    }

    const quizId = `qz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const questionsForOutput = quizData.questions.map((q, qIndex) => {
      const questionId = `q-${Date.now()}-${qIndex}-${Math.random().toString(36).substr(2, 4)}`;
      return {
        id: questionId,
        quizId: quizId, // Assign the quizId to questions
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : '',
        marks: typeof q.marks === 'number' ? q.marks : 1,
        timeLimitMinutes: typeof q.timeLimitMinutes === 'number' ? q.timeLimitMinutes : 1, // Ensure it's a number for output
      };
    });

    return {
      id: quizId,
      title: quizData.quizTitle,
      courseName: quizData.courseName,
      questionIds: questionsForOutput.map(q => q.id),
      timeLimitMinutes: totalCalculatedQuizTime,
      negativeMarking: negativeMarking,
      negativeMarksValue: negativeMarking ? Number(negativeMarksValue) : 0, // Use negativeMarksValue
      competitionMode: competitionMode,
      scheduledDate: quizData.scheduledDate,
      startTime: quizData.startTime,
      endTime: quizData.endTime,
      difficulty: quizDifficulty, // Include difficulty

      _questionsData: questionsForOutput, // Include full question data for easy retrieval
    };
  };

  const handleCreateQuiz = () => {
    const finalQuizData = prepareQuizForOutput();
    if (finalQuizData) {

      // 1. Prepare data for QuizContext's addQuiz (which handles Supabase insertion)
      const quizToAdd: Omit<Quiz, 'id' | 'status'> = {
        title: finalQuizData.title,
        courseName: finalQuizData.courseName,
        timeLimitMinutes: finalQuizData.timeLimitMinutes,
        negativeMarking: finalQuizData.negativeMarking,
        competitionMode: finalQuizData.competitionMode,
        scheduledDate: finalQuizData.scheduledDate,
        startTime: finalQuizData.startTime,
        endTime: finalQuizData.endTime,
        negativeMarksValue: finalQuizData.negativeMarksValue,
        difficulty: finalQuizData.difficulty, // Pass difficulty
      };

      // 2. Prepare questions data (Omit<Question, 'id'>)
      const questionsToAdd: Omit<Question, 'id'>[] = finalQuizData._questionsData.map(q => ({
        quizId: q.quizId, // Placeholder, will be overwritten by mutation
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        timeLimitMinutes: q.timeLimitMinutes,
      }));

      // 3. Add the quiz to the global pool (triggers Supabase mutation)
      addQuiz(quizToAdd, questionsToAdd);

      // Reset form regardless of immediate success (mutation handles success/error toast)
      resetForm();
    }
  };

  const handlePreviewQuiz = () => {
    const quizToPreview = prepareQuizForOutput(true);
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

    // Add course only when proceeding
    if (quizData.courseName.trim()) {
      addCourse(quizData.courseName.trim());
    }

    setStep(2);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6" /> Generate New Quiz
          {step === 2 && <span className="text-sm font-normal text-muted-foreground ml-2">(Step 2: Manage Questions)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quizTitle">Course / Paper Name</Label>
          <Input
            id="quizTitle"
            placeholder="e.g., 'Introduction to Quantum Physics'"
            value={quizData.quizTitle}
            disabled={step === 2} // Lock
            onChange={(e) => {
              handleUpdateQuizDetails('quizTitle', e.target.value);
              setAiCoursePaperName(e.target.value);
            }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="courseName">Course Name (for Student Dashboard)</Label>
          <Input
            id="courseName"
            placeholder="e.g., 'CS 101: Introduction to Programming'"
            value={quizData.courseName}
            disabled={step === 2} // Lock
            onChange={(e) => {
              const val = e.target.value;
              handleUpdateQuizDetails('courseName', val);
            }}
            className="mt-1"
          />
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
                value={quizData.scheduledDate}
                disabled={step === 2}
                onChange={(e) => {
                  const dateValue = e.target.value;

                  // If empty, allow it (for clearing the field)
                  if (!dateValue) {
                    handleUpdateQuizDetails('scheduledDate', dateValue);
                    return;
                  }

                  // Validate date format and value
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                  if (!dateRegex.test(dateValue)) {
                    toast.error("Invalid date format. Please use the date picker.");
                    return;
                  }

                  // Parse the date components
                  const [year, month, day] = dateValue.split('-').map(Number);

                  // Validate month (1-12)
                  if (month < 1 || month > 12) {
                    toast.error(`Invalid month: ${month}. Month must be between 1 and 12.`);
                    return;
                  }

                  // Validate day for the given month and year
                  const daysInMonth = new Date(year, month, 0).getDate();
                  if (day < 1 || day > daysInMonth) {
                    toast.error(`Invalid day: ${day}. This month has only ${daysInMonth} days.`);
                    return;
                  }

                  // Create a date object and verify it matches the input
                  const dateObj = new Date(dateValue);
                  if (isNaN(dateObj.getTime())) {
                    toast.error("Invalid date. Please select a valid date.");
                    return;
                  }

                  // Verify the date components match (prevents auto-correction)
                  if (dateObj.getFullYear() !== year ||
                    dateObj.getMonth() + 1 !== month ||
                    dateObj.getDate() !== day) {
                    toast.error("Invalid date. Please select a valid date.");
                    return;
                  }

                  // All validations passed, update the value
                  handleUpdateQuizDetails('scheduledDate', dateValue);
                }}
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
                onChange={(e) => {
                  const timeValue = e.target.value;

                  // If empty, allow it (for clearing the field)
                  if (!timeValue) {
                    handleUpdateQuizDetails('startTime', timeValue);
                    return;
                  }

                  // Validate time format (HH:MM)
                  const timeRegex = /^\d{2}:\d{2}$/;
                  if (!timeRegex.test(timeValue)) {
                    toast.error("Invalid time format. Please use the time picker.");
                    return;
                  }

                  // Parse hours and minutes
                  const [hours, minutes] = timeValue.split(':').map(Number);

                  // Validate hours (0-23)
                  if (hours < 0 || hours > 23) {
                    toast.error(`Invalid hour: ${hours}. Hours must be between 0 and 23.`);
                    return;
                  }

                  // Validate minutes (0-59)
                  if (minutes < 0 || minutes > 59) {
                    toast.error(`Invalid minutes: ${minutes}. Minutes must be between 0 and 59.`);
                    return;
                  }

                  // All validations passed, update the value
                  handleUpdateQuizDetails('startTime', timeValue);
                }}
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
                onChange={(e) => {
                  const timeValue = e.target.value;

                  // If empty, allow it (for clearing the field)
                  if (!timeValue) {
                    handleUpdateQuizDetails('endTime', timeValue);
                    return;
                  }

                  // Validate time format (HH:MM)
                  const timeRegex = /^\d{2}:\d{2}$/;
                  if (!timeRegex.test(timeValue)) {
                    toast.error("Invalid time format. Please use the time picker.");
                    return;
                  }

                  // Parse hours and minutes
                  const [hours, minutes] = timeValue.split(':').map(Number);

                  // Validate hours (0-23)
                  if (hours < 0 || hours > 23) {
                    toast.error(`Invalid hour: ${hours}. Hours must be between 0 and 23.`);
                    return;
                  }

                  // Validate minutes (0-59)
                  if (minutes < 0 || minutes > 59) {
                    toast.error(`Invalid minutes: ${minutes}. Minutes must be between 0 and 59.`);
                    return;
                  }

                  // All validations passed, update the value
                  handleUpdateQuizDetails('endTime', timeValue);
                }}
                className="mt-1"
              />
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
          <div>
            <Label htmlFor="optionsPerQuestion">Options per Question (MCQ)</Label>
            <Input
              id="optionsPerQuestion"
              type="number"
              min="0"
              max="6"
              value={quizData.optionsPerQuestion}
              disabled={step === 2} // Lock
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val >= 0 && val <= 6) {
                  handleUpdateQuizDetails('optionsPerQuestion', val);
                }
              }}
              className="mt-1"
            />
          </div>
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
                <span>Total Questions: {quizData.questions.length}</span>
                <span>Total Marks: {totalQuizMarks}</span>
                <span>Total Quiz Time: {totalCalculatedQuizTime} minutes</span>
              </div>

              {/* AI Question Generation Section */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Generate Questions with AI (Mock)
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
                <Button onClick={handleGenerateAIQuestions} className="w-full bg-purple-600 hover:bg-purple-700">
                  Generate Questions with AI
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  AI will generate {quizData.totalQuestions} questions with {quizData.optionsPerQuestion} options each.
                  You will still need to manually set marks and time for each question.
                </p>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto p-3 border rounded-md bg-gray-50 mt-4">
                {quizData.questions.length === 0 ? (
                  <p className="text-gray-500 text-center">No questions added yet. Click "Generate Questions with AI" to begin.</p>
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
                          <div className="p-3 bg-gray-50 border rounded-md min-h-[60px] text-sm mt-1">
                            {q.questionText || <span className="text-gray-400 italic">Example Question Text from AI</span>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-2 border rounded-md bg-white text-sm">
                              <span className="font-semibold text-gray-500 w-6">{String.fromCharCode(65 + optIndex)}.</span>
                              <span>{option || <span className="text-gray-400 italic">Option Text</span>}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <Label>Select the correct option</Label>
                          <RadioGroup
                            onValueChange={(value) => handleUpdateCorrectAnswerIndex(index, value)}
                            value={q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : ''}
                            className="flex flex-col space-y-2 mt-2"
                          >
                            {q.options.map((option, optIndex) => (
                              option && (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`q-correct-${index}-${optIndex}`} />
                                  <Label htmlFor={`q-correct-${index}-${optIndex}`} className="font-normal cursor-pointer">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </Label>
                                </div>
                              )
                            ))}
                          </RadioGroup>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  handleUpdateDraftQuestion(index, 'marks', val);
                                }
                              }}
                              onKeyDown={(e) => e.preventDefault()}
                              className="mt-1"
                            />
                          </div>
                          {enableTimePerQuestion && (
                            <div>
                              <Label htmlFor={`q-time-${index}`}>Time (minutes)</Label>
                              <Input
                                id={`q-time-${index}`}
                                type="number"
                                min="1"
                                value={q.timeLimitMinutes}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                  if (val === '' || val > 0) {
                                    handleUpdateDraftQuestion(index, 'timeLimitMinutes', val);
                                  }
                                }}
                                onKeyDown={(e) => e.preventDefault()}
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
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
    </Card >
  );
};

export default QuizCreator;