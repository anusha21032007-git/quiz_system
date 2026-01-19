"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2, History, X, Settings2, Save, Send, CheckCircle2, Calendar, Clock, Edit, GraduationCap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Poll {
  pollId: string;
  numberOfQuestions: number;
  mcqCount: number;
  createdAt: number;
  status: 'pending' | 'completed' | 'scheduled';
  draftQuestions?: DraftQuestion[];
  questionSetName?: string;
  courseName?: string;
  scheduledAt?: number;
  passMarkPercentage?: number;
  requiredCorrectAnswers?: number;
}

interface DraftQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number | '';
  timeLimitMinutes: number | '';
}

const QuestionCreator = () => {
  const { addQuestion, addQuiz, availableCourses } = useQuiz();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  // Configuration State
  const [numQuestions, setNumQuestions] = useState<number | ''>(0);
  const [numOptions, setNumOptions] = useState<number | ''>(0);

  // Manage steps and setup visibility via search params
  const isSetupVisible = searchParams.get('qSetup') === 'true';
  const step = parseInt(searchParams.get('qStep') || '1') as 1 | 2;

  const setIsSetupVisible = (visible: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (visible) {
      newParams.set('qSetup', 'true');
    } else {
      newParams.delete('qSetup');
    }
    setSearchParams(newParams);
  };

  const setStep = (newStep: 1 | 2) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('qStep', newStep.toString());
    setSearchParams(newParams);
  };

  // Drafting State
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [questionSetName, setQuestionSetName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [passMarkPercentage, setPassMarkPercentage] = useState<number | ''>(0);
  const [maxAttempts, setMaxAttempts] = useState<number | ''>(1); // New State
  const [showErrors, setShowErrors] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // History State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);

  // Scheduling State
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // NEW: Session Persistence State (Current active work)
  // Load session and history from local storage on initial mount
  useEffect(() => {
    // Load session
    const session = localStorage.getItem('activeCreationSession');
    if (session) {
      try {
        const { numQuestions: sq, numOptions: so, draftQuestions: sd, step: ss, questionSetName: sn, courseName: sc, currentSetId: si, passMarkPercentage: sp, totalQuestions: st, requiredCorrectAnswers: src } = JSON.parse(session);
        if (sq !== undefined) setNumQuestions(sq);
        if (so !== undefined) setNumOptions(so);
        if (sd !== undefined) setDraftQuestions(sd);
        if (sn !== undefined) setQuestionSetName(sn);
        if (sc !== undefined) setCourseName(sc);
        if (ss !== undefined) setStep(ss);
        if (si !== undefined) setCurrentSetId(si);
        if (sp !== undefined) setPassMarkPercentage(sp);
      } catch (e) {
        console.error("Failed to restore creation session", e);
      }
    }

    // Load Polls History
    const storedPolls = localStorage.getItem('polls');
    if (storedPolls) setPolls(JSON.parse(storedPolls));
  }, []);

  // Save session to local storage whenever active state changes
  useEffect(() => {
    const sessionData = {
      numQuestions,
      numOptions,
      draftQuestions,
      questionSetName,
      courseName,
      step,
      currentSetId,
      passMarkPercentage,
      totalQuestions: numQuestions,
      requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
    };
    localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));
  }, [numQuestions, numOptions, draftQuestions, questionSetName, courseName, step, currentSetId]);

  // Sync Polls
  useEffect(() => {
    localStorage.setItem('polls', JSON.stringify(polls));
  }, [polls]);

  // Clear session helper
  const clearActiveSession = () => {
    localStorage.removeItem('activeCreationSession');
    setNumQuestions(0);
    setNumOptions(0);
    setDraftQuestions([]);
    setQuestionSetName('');
    setCourseName('');
    setCurrentSetId(null);
    setPassMarkPercentage(0);

    // Reset URL params related to question creation
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('qSetup');
    newParams.delete('qStep');
    setSearchParams(newParams);

    setShowErrors(false);
    setCreationStatus(null);
    setShowSchedule(false);
    setScheduledDate('');
    setScheduledTime('');
  };

  // Background Worker: Process Scheduled Polls
  useEffect(() => {
    const worker = setInterval(() => {
      const now = Date.now();
      const scheduledPolls = polls.filter(p => p.status === 'scheduled' && p.scheduledAt && p.scheduledAt <= now);

      if (scheduledPolls.length > 0) {
        scheduledPolls.forEach(poll => {
          if (poll.draftQuestions) {
            poll.draftQuestions.forEach(q => {
              addQuestion({
                quizId: 'unassigned',
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                marks: q.marks as number,
                timeLimitMinutes: q.timeLimitMinutes as number
              });
            });
            logQuestionAction(poll.pollId, poll.numberOfQuestions, 'Completed');
            toast.success(`Question set "${poll.questionSetName || poll.pollId}" posted automatically!`);
          }
        });

        // Mark them as completed and remove from active list if needed, or just update status
        setPolls(prev => prev.map(p => {
          if (p.status === 'scheduled' && p.scheduledAt && p.scheduledAt <= now) {
            return { ...p, status: 'completed' } as Poll;
          }
          return p;
        }).filter(p => p.status !== 'completed')); // Filter out completed for the main history view if desired
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(worker);
  }, [polls, addQuestion]);

  // Validation for Step 1
  const isConfigValid =
    courseName.trim().length > 0 && // Ensure Exam Paper is entered
    typeof numQuestions === 'number' && numQuestions > 0 &&
    typeof numOptions === 'number' && numOptions >= 2 && numOptions <= 6 &&
    typeof passMarkPercentage === 'number' && passMarkPercentage >= 0 && passMarkPercentage <= 100;

  // Generate Questions based on Config
  const generateDraftBlocks = () => {
    const count = typeof numQuestions === 'number' ? numQuestions : 0;
    const optionsCount = typeof numOptions === 'number' ? numOptions : 0;

    const newDraft: DraftQuestion[] = Array(count).fill(null).map((_, i) => {
      // PRESERVE: If we have existing data for this index, keep it
      if (draftQuestions[i]) {
        const existing = draftQuestions[i];
        let options = [...existing.options];
        // Adjust options count if it changed
        if (options.length < optionsCount) {
          options = [...options, ...Array(optionsCount - options.length).fill('')];
        } else if (options.length > optionsCount) {
          options = options.slice(0, optionsCount);
        }
        return { ...existing, options };
      }

      // Default for new blocks
      return {
        questionText: '',
        options: Array(optionsCount).fill(''),
        correctAnswer: '',
        marks: 1,
        timeLimitMinutes: 1,
      };
    });

    setDraftQuestions(newDraft);
    return newDraft;
  };

  const handleProceed = () => {
    if (isConfigValid) {
      const generatedDraft = generateDraftBlocks();

      if (currentSetId) {
        // UPDATE: If editing, update the existing entry in history
        setPolls(prev => {
          const updated = prev.map(p => p.pollId === currentSetId ? {
            ...p,
            numberOfQuestions: numQuestions as number,
            mcqCount: numOptions as number,
            draftQuestions: generatedDraft,
            passMarkPercentage: passMarkPercentage as number,
            requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
          } : p);
          return updated;
        });
      } else {
        // CREATE: If new, create a fresh entry in history
        const pollId = `poll_${Date.now()}`;
        const newPoll: Poll = {
          pollId,
          numberOfQuestions: numQuestions as number,
          mcqCount: numOptions as number,
          createdAt: Date.now(),
          status: 'pending',
          draftQuestions: generatedDraft,
          questionSetName: '',
          passMarkPercentage: passMarkPercentage as number,
          requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
        };
        setPolls(prev => [newPoll, ...prev]);
        setCurrentSetId(pollId);
      }

      // Update both params in a single call to avoid stale state issues
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('qSetup');
      newParams.set('qStep', '2');
      setSearchParams(newParams);

      setShowErrors(false);
    } else {
      setShowErrors(true);
    }
  };

  const logQuestionAction = (questionSetId: string, totalQuestions: number, action: 'Completed' | 'Deleted') => {
    const historyJson = localStorage.getItem('questionActionHistory');
    const history = historyJson ? JSON.parse(historyJson) : [];
    const newEntry = {
      questionSetId,
      totalQuestions,
      action,
      timestamp: Date.now()
    };
    localStorage.setItem('questionActionHistory', JSON.stringify([newEntry, ...history]));
  };

  const handleCompletePoll = (pollId: string) => {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
      logQuestionAction(pollId, poll.numberOfQuestions, 'Completed');
    }
    const updated = polls.filter(p => p.pollId !== pollId);
    setPolls(updated);
    localStorage.setItem('polls', JSON.stringify(updated));
    toast.success("Question set marked as completed and moved to History.");
  };

  const handleDeletePoll = (pollId: string) => {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
      logQuestionAction(pollId, poll.numberOfQuestions, 'Deleted');
    }
    const updated = polls.filter(p => p.pollId !== pollId);
    setPolls(updated);
    localStorage.setItem('polls', JSON.stringify(updated));
    toast.error("Question set deleted and moved to History.");
  };

  const handleUpdateQuestion = (index: number, field: keyof DraftQuestion, value: any) => {
    setDraftQuestions(prev => {
      const updated = [...prev];
      if (field === 'marks' || field === 'timeLimitMinutes') {
        updated[index] = { ...updated[index], [field]: value === '' ? '' : parseInt(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, val: string) => {
    setDraftQuestions(prev => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[oIndex] = val;
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const handleSaveDraft = () => {
    if (currentSetId) {
      setPolls(prev => {
        const updated = prev.map(p => p.pollId === currentSetId ? {
          ...p,
          questionSetName,
          draftQuestions,
          numberOfQuestions: numQuestions as number,
          mcqCount: numOptions as number,
          passMarkPercentage: passMarkPercentage as number,
          requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100),
        } : p);
        localStorage.setItem('polls', JSON.stringify(updated));
        return updated;
      });
    } else {
      // CREATE: If somehow currentSetId is lost but we have draft work
      const pollId = `poll_${Date.now()}`;
      const newPoll: Poll = {
        pollId,
        numberOfQuestions: numQuestions as number,
        mcqCount: numOptions as number,
        createdAt: Date.now(),
        status: 'pending',
        draftQuestions,
        questionSetName,
        passMarkPercentage: passMarkPercentage as number,
        requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100),
      };
      setPolls(prev => [newPoll, ...prev]);
      setCurrentSetId(pollId);
    }
    setCreationStatus({ type: 'success', message: "Draft saved successfully" });
    // Remove status message after some time
    setTimeout(() => setCreationStatus(null), 3000);
  };

  const handleSaveAndExit = () => {
    handleSaveDraft();
    setTimeout(() => {
      clearActiveSession();
    }, 500);
  };

  const handleEditPoll = (poll: Poll) => {
    setNumQuestions(poll.numberOfQuestions);
    setNumOptions(poll.mcqCount);
    setDraftQuestions(poll.draftQuestions || []);
    setQuestionSetName(poll.questionSetName || '');
    setCourseName(poll.courseName || '');
    setCurrentSetId(poll.pollId);
    setPassMarkPercentage(poll.passMarkPercentage || 0);

    // Restore scheduling state if applicable
    if (poll.status === 'scheduled' && poll.scheduledAt) {
      const date = new Date(poll.scheduledAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');

      setScheduledDate(`${year}-${month}-${day}`);
      setScheduledTime(`${hours}:${mins}`);
      setShowSchedule(true);
    } else {
      setShowSchedule(false);
      setScheduledDate('');
      setScheduledTime('');
    }

    // Update both params in a single call to avoid stale state issues
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('qSetup');
    newParams.set('qStep', '2');
    setSearchParams(newParams);

    setCreationStatus(null);
  };

  const handleStartNew = () => {
    clearActiveSession();
    setIsSetupVisible(true);
  };

  const handleAddToPool = () => {
    const invalid = draftQuestions.some(q =>
      !q.questionText.trim() || q.options.some(o => !o.trim()) || !q.correctAnswer.trim() || q.marks === '' || q.timeLimitMinutes === ''
    );

    if (invalid) {
      setCreationStatus({ type: 'error', message: "Please fill all fields for all questions before adding to pool." });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setCreationStatus({ type: 'error', message: "Please select both date and time for scheduling." });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    if (scheduledDateTime <= Date.now()) {
      setCreationStatus({ type: 'error', message: "Scheduled time must be in the future." });
      return;
    }

    // Save as scheduled poll
    if (currentSetId) {
      setPolls(prev => {
        const updated = prev.map(p => p.pollId === currentSetId ? {
          ...p,
          passMarkPercentage: passMarkPercentage as number,
          status: 'scheduled',
          scheduledAt: scheduledDateTime
        } as Poll : p);
        return updated;
      });
    } else {
      const pollId = `poll_${Date.now()}`;
      const newPoll: Poll = {
        pollId,
        numberOfQuestions: numQuestions as number,
        mcqCount: numOptions as number,
        createdAt: Date.now(),
        status: 'scheduled',
        draftQuestions,
        questionSetName,
        scheduledAt: scheduledDateTime,
        passMarkPercentage: passMarkPercentage as number,
        requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
      };
      setPolls(prev => [newPoll, ...prev]);
    }

    clearActiveSession();
    setCreationStatus({ type: 'success', message: `Question set scheduled for ${scheduledDate} ${scheduledTime}` });
    setTimeout(() => setCreationStatus(null), 3000);
  };

  const handleDirectCreateQuiz = () => {
    // 1. Validation
    const invalid = draftQuestions.some(q =>
      !q.questionText.trim() || q.options.some(o => !o.trim()) || !q.correctAnswer.trim() || q.marks === '' || q.timeLimitMinutes === ''
    );
    if (invalid) {
      setCreationStatus({ type: 'error', message: "Please fill all fields for all questions." });
      toast.error("Please fill all fields for all questions.");
      return;
    }

    // Use correct source for Title and Course
    const finalTitle = questionSetName.trim() || courseName.trim();
    const finalCourse = courseName.trim();

    if (!finalTitle || !finalCourse || passMarkPercentage === '') {
      setCreationStatus({ type: 'error', message: "Exam Paper / Course Name is mandatory." });
      toast.error("Exam Paper / Course Name is mandatory.");
      return;
    }

    // 2. Prepare Quiz Data
    const quizId = `qz-direct-${Date.now()}`;
    const startTimeStr = "00:00";
    const endTimeStr = "23:59";
    const scheduledDateStr = new Date().toISOString().split('T')[0];

    const quizToAdd: Omit<Quiz, 'id' | 'status'> = {
      quizId: quizId,
      title: finalTitle,
      courseName: finalCourse,
      questions: [],
      timeLimitMinutes: draftQuestions.reduce((acc, q) => acc + (Number(q.timeLimitMinutes) || 0), 0),
      negativeMarking: false,
      competitionMode: false,
      scheduledDate: scheduledDate,
      startTime: scheduledTime,
      endTime: scheduledTime,
      negativeMarksValue: 0,
      difficulty: 'Medium',
      passPercentage: Number(passMarkPercentage),
      totalQuestions: draftQuestions.length,
      requiredCorrectAnswers: Math.ceil((draftQuestions.length * Number(passMarkPercentage)) / 100),
      createdAt: '', // Will be set by addQuiz
      maxAttempts: maxAttempts === '' ? 1 : maxAttempts, // Set max attempts
    };

    // If no schedule provided, use 'now'
    if (!scheduledDate || !scheduledTime) {
      quizToAdd.scheduledDate = scheduledDateStr;
      quizToAdd.startTime = startTimeStr;
      quizToAdd.endTime = endTimeStr;
    }

    // 3. Prepare Questions
    const questionsToAdd: Omit<Question, 'id'>[] = draftQuestions.map((q, idx) => ({
      quizId: quizId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks) || 1,
      timeLimitMinutes: Number(q.timeLimitMinutes) || 1,
    }));

    // 4. Save and Redirect
    addQuiz(quizToAdd, questionsToAdd);
    toast.success("Quiz created successfully! Redirecting...");

    // Log action
    logQuestionAction(currentSetId || quizId, draftQuestions.length, 'Completed');

    // Clear session
    clearActiveSession();

    // Redirect to student module
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {isSetupVisible ? (
        /* Question Setup Section */
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
            <Settings2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Question Setup</h3>
          </div>

          <div className="grid gap-8">
            {/* Split Inputs: Course Name & Exam Name */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="courseName" className="text-lg font-bold text-gray-700">Course Name</Label>
                <Select value={courseName} onValueChange={setCourseName}>
                  <SelectTrigger
                    className={cn(
                      "h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm rounded-xl border-blue-100 focus:border-blue-500",
                      showErrors && !courseName ? "border-red-500 ring-red-50" : ""
                    )}
                  >
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-blue-50 shadow-xl">
                    {availableCourses.length > 0 ? (
                      availableCourses.map((course) => (
                        <SelectItem key={course} value={course} className="text-lg py-3 rounded-lg focus:bg-indigo-50 focus:text-indigo-600">
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
                {showErrors && !courseName.trim() && (
                  <p className="text-sm text-red-500 font-bold flex items-center gap-1">
                    <X className="h-4 w-4" /> Course Name required.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="examName" className="text-lg font-bold text-gray-700">Exam Name</Label>
                <Input
                  id="examName"
                  placeholder="e.g. Final Exam, Quiz 1"
                  value={questionSetName}
                  onChange={(e) => setQuestionSetName(e.target.value)}
                  className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (!questionSetName || !questionSetName.trim()) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
                />
                {showErrors && (!questionSetName || !questionSetName.trim()) && (
                  <p className="text-sm text-red-500 font-bold flex items-center gap-1">
                    <X className="h-4 w-4" /> Exam Name required.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="numQuestions" className="text-lg font-bold text-gray-700">Number of Questions</Label>
              <Input
                id="numQuestions"
                type="number"
                min="0"
                value={numQuestions}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty for clearing
                  if (val === '') {
                    setNumQuestions('');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal <= 0) {
                    toast.error("Number of questions must be at least 1.");
                    return;
                  }
                  setNumQuestions(numVal);
                  if (showErrors) setShowErrors(false);
                }}
                className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (numQuestions === '' || numQuestions <= 0) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
              />
              {showErrors && (numQuestions === '' || numQuestions <= 0) && (
                <p className="text-sm text-red-500 font-bold flex items-center gap-1">
                  <X className="h-4 w-4" /> Please enter at least 1 question.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="numOptions" className="text-lg font-bold text-gray-700">Number of MCQ Options</Label>
              <Input
                id="numOptions"
                type="number"
                min="2"
                max="6"
                value={numOptions}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setNumOptions('');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal < 2 || numVal > 6) {
                    toast.error("Options per question must be between 2 and 6.");
                    return;
                  }
                  setNumOptions(numVal);
                  if (showErrors) setShowErrors(false);
                }}
                className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (numOptions === '' || numOptions < 2 || numOptions > 6) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-sm text-gray-400 font-medium">Range: 2 to 6 options</p>
                {showErrors && (numOptions === '' || numOptions < 2 || numOptions > 6) && (
                  <p className="text-sm text-red-500 font-bold">Invalid range!</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="passMark" className="text-lg font-bold text-gray-700">Pass Mark Percentage (%)</Label>
              <Input
                id="passMark"
                type="number"
                min="0"
                max="100"
                value={passMarkPercentage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setPassMarkPercentage('');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal < 0 || numVal > 100) {
                    toast.error("Pass percentage must be between 0 and 100.");
                    return;
                  }
                  setPassMarkPercentage(numVal);
                  if (showErrors) setShowErrors(false);
                }}
                className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (passMarkPercentage === '' || passMarkPercentage < 0 || passMarkPercentage > 100) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-sm text-gray-400 font-medium">
                  {typeof numQuestions === 'number' && typeof passMarkPercentage === 'number' ?
                    `Minimum Correct Answers Required: ${Math.ceil((numQuestions * passMarkPercentage) / 100)} / ${numQuestions}` :
                    'Enter a percentage to see required answers'}
                </p>
                {showErrors && (passMarkPercentage === '' || passMarkPercentage < 0 || passMarkPercentage > 100) && (
                  <p className="text-sm text-red-500 font-bold">Mandatory field!</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="maxAttempts" className="text-lg font-bold text-gray-700">Max Attempts (Optional)</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                placeholder="Default: 1"
                value={maxAttempts}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setMaxAttempts('');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal < 1) {
                    toast.error("Max attempts must be at least 1.");
                    return;
                  }
                  setMaxAttempts(numVal);
                }}
                className="h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm border-blue-100 focus:border-blue-500"
              />
              <p className="text-sm text-gray-400 font-medium px-1">
                Number of times a student can take this quiz. Leave empty for 1 attempt.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-blue-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('qSetup');
                newParams.set('qStep', '1');
                setSearchParams(newParams);
              }}
              className="px-6 h-12 font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-xl font-black text-lg shadow-blue-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Proceed to Draft
            </Button>
          </div>
        </div>
      ) : step === 1 ? (
        /* Initial View: + New Question Button and History */
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b bg-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <PlusCircle className="h-6 w-6 text-blue-600" />
              Question Creator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <Button
              onClick={handleStartNew}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-16 rounded-xl shadow-md flex items-center justify-center gap-3 text-xl font-bold transition-all"
            >
              <PlusCircle className="h-6 w-6" />
              + New Question
            </Button>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
                  <History className="h-5 w-5" />
                  Question History
                </h3>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {polls.filter(p => p.status === 'pending' || p.status === 'scheduled').length > 0 ? (
                  polls.filter(p => p.status === 'pending' || p.status === 'scheduled').map(poll => (
                    <div key={poll.pollId} className="group flex items-center p-4 bg-gray-50 rounded-xl border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all text-sm">
                      <div className="w-1/3 flex items-center gap-3">
                        <div className={`h-1.5 w-1.5 rounded-full ${poll.status === 'pending' ? 'bg-violet-400' : poll.status === 'scheduled' ? 'bg-amber-400' : 'bg-green-500'}`} />
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-gray-500 text-[10px]">ID: {poll.pollId.split('_')[1]}</span>
                          {poll.questionSetName && <span className="font-bold text-gray-800 truncate max-w-[150px]">{poll.questionSetName}</span>}
                        </div>
                      </div>
                      <div className="w-1/3 text-center flex flex-col">
                        <span className="font-bold text-gray-600">{poll.numberOfQuestions} Questions</span>
                        {poll.status === 'scheduled' && poll.scheduledAt && (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(poll.scheduledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="w-1/3 flex justify-end items-center gap-4">
                        {(poll.status === 'pending' || poll.status === 'scheduled') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPoll(poll);
                              }}
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {poll.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompletePoll(poll.pollId)}
                                className="h-7 px-2 text-[11px] font-bold text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePoll(poll.pollId)}
                          className="h-7 px-2 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${poll.status === 'pending' ? 'text-violet-600' : poll.status === 'scheduled' ? 'text-amber-600' : 'text-green-600'
                          }`}>
                          {poll.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No pending or scheduled question sets.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Question Creator (Drafting) View */
        <Card className="shadow-lg border-none overflow-hidden">
          <CardHeader className="border-b bg-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <PlusCircle className="h-6 w-6 text-blue-600" />
                Question Creator
                {currentSetId && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] uppercase font-black rounded tracking-widest animate-pulse">
                    Editing Question Set
                  </span>
                )}
              </CardTitle>
              <div className="text-sm font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                {draftQuestions.length} Blocks
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar p-1">
              {draftQuestions.map((q, qIndex) => (
                <Card key={qIndex} className="relative overflow-hidden border-2 border-gray-100 hover:border-blue-100 transition-colors shadow-sm">
                  <div className="bg-gray-50/50 p-4 border-b flex items-center justify-between">
                    <h4 className="font-black text-gray-700 uppercase tracking-tighter">Question {qIndex + 1}</h4>
                    {draftQuestions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          const updated = draftQuestions.filter((_, i) => i !== qIndex);
                          setDraftQuestions(updated);
                          setNumQuestions(updated.length);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-600">Question Text</Label>
                      <Textarea
                        placeholder="What would you like to ask?"
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'questionText', e.target.value)}
                        className="min-h-[100px] text-lg font-medium resize-none focus:ring-blue-500 border-gray-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-600">Marks</Label>
                        <Input
                          type="number"
                          min="1"
                          value={q.marks}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseInt(val) < 0) {
                              toast.error("Marks cannot be negative.");
                              return;
                            }
                            handleUpdateQuestion(qIndex, 'marks', val);
                          }}
                          className="font-bold text-blue-600 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-600">Time Limit (mins)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={q.timeLimitMinutes}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && parseInt(val) <= 0) {
                              toast.error("Time limit must be at least 1 minute.");
                              return;
                            }
                            handleUpdateQuestion(qIndex, 'timeLimitMinutes', val);
                          }}
                          className="font-bold text-blue-600 border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-gray-600">MCQ Options</Label>
                      <div className="grid gap-3">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-3 items-center">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-500 text-sm">
                              {String.fromCharCode(65 + oIndex)}
                            </div>
                            <Input
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              className="flex-1 font-medium border-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <Label className="text-sm font-black text-blue-700 uppercase tracking-widest">Select Correct Answer</Label>
                      <RadioGroup
                        value={q.correctAnswer}
                        onValueChange={(val) => handleUpdateQuestion(qIndex, 'correctAnswer', val)}
                        className="grid grid-cols-2 gap-4"
                      >
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${q.correctAnswer === opt && opt.trim() ? 'bg-white border-blue-500 shadow-sm' : 'bg-transparent border-transparent'
                            }`}>
                            <RadioGroupItem value={opt} id={`q-${qIndex}-opt-${oIndex}`} disabled={!opt.trim()} />
                            <Label
                              htmlFor={`q-${qIndex}-opt-${oIndex}`}
                              className={`text-sm font-bold truncate ${!opt.trim() ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {opt.trim() || `(Empty Option ${oIndex + 1})`}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 p-6 bg-gray-50/80 border-t rounded-b-lg">
            <div className="w-full space-y-2 hidden">
              {/* Question Set Name input removed from interface but kept in state logic if needed internally */}
            </div>

            {creationStatus && (
              <div className={`w-full p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${creationStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                {creationStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
                <p className="font-bold">{creationStatus.message}</p>
              </div>
            )}

            <div className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-gray-700">Scheduling Options (Optional)</span>
              </div>
              <Button
                variant={showSchedule ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSchedule(!showSchedule)}
                className={`transition-all ${showSchedule ? 'bg-blue-600' : 'text-blue-600 border-blue-200'}`}
              >
                {showSchedule ? "Hide Schedule" : "Set Schedule"}
              </Button>
            </div>

            {showSchedule && (
              <div className="w-full p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date
                    </Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="h-10 border-blue-100 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Time
                    </Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="h-10 border-blue-100 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddToPool}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold h-10 flex items-center justify-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Save as Draft / Add to Pool
                </Button>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <Button
                variant="outline"
                onClick={() => { setStep(1); setIsSetupVisible(true); setCreationStatus(null); }}
                className="px-8 h-12 font-bold border-gray-300"
              >
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
                className="flex-1 h-12 font-bold border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={handleDirectCreateQuiz}
                className={`flex-1 h-12 font-black flex items-center justify-center gap-2 text-white shadow-lg text-lg rounded-2xl transition-all hover:scale-105 active:scale-95 ${scheduledDate && scheduledTime ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
              >
                {scheduledDate && scheduledTime ? <Calendar className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                {scheduledDate && scheduledTime ? "Schedule Quiz" : "Create Quiz Now"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )
      }
    </div >
  );
};

export default QuestionCreator;