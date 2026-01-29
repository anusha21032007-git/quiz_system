"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2, History, X, Settings2, Save, Send, CheckCircle2, Clock, Edit, GraduationCap, ArrowLeft, Calendar, Wand2 } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  scheduledEndTime?: string; // Added field
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

const QuestionCreator = ({ onBack }: { onBack: () => void }) => {
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
  const [maxAttempts, setMaxAttempts] = useState<number | ''>(1);
  const [showErrors, setShowErrors] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // History State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);

  // Scheduling State
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState(''); // New State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'schedule' | 'direct' | null>(null);

  // Load session and history from local storage on initial mount
  useEffect(() => {
    const session = localStorage.getItem('activeCreationSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.numQuestions !== undefined) setNumQuestions(parsed.numQuestions);
        if (parsed.numOptions !== undefined) setNumOptions(parsed.numOptions);
        if (parsed.draftQuestions !== undefined) setDraftQuestions(parsed.draftQuestions);
        if (parsed.questionSetName !== undefined) setQuestionSetName(parsed.questionSetName);
        if (parsed.courseName !== undefined) setCourseName(parsed.courseName);
        if (parsed.step !== undefined) setStep(parsed.step);
        if (parsed.currentSetId !== undefined) setCurrentSetId(parsed.currentSetId);
        if (parsed.passMarkPercentage !== undefined) setPassMarkPercentage(parsed.passMarkPercentage);
        // Removed: scheduledEndTime and other scheduling states - calendar should only show on explicit user action
      } catch (e) {
        console.error("Failed to restore creation session", e);
      }
    }

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
      // Removed: scheduledEndTime and other scheduling states - calendar should only show on explicit user action
      totalQuestions: numQuestions,
      requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
    };
    localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));
  }, [numQuestions, numOptions, draftQuestions, questionSetName, courseName, step, currentSetId, passMarkPercentage]);

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
    setCurrentQuestionIndex(0); // Reset index
    setQuestionSetName('');
    setCourseName('');
    setCurrentSetId(null);
    setPassMarkPercentage(0);

    const newParams = new URLSearchParams(searchParams);
    newParams.delete('qSetup');
    newParams.delete('qStep');
    setSearchParams(newParams);

    setShowErrors(false);
    setCreationStatus(null);
    setShowSchedule(false);
    setScheduledDate('');
    setScheduledTime('');
    setScheduledEndTime('');
  };

  // Background Worker for Scheduled Polls
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
                timeLimitMinutes: q.timeLimitMinutes as number,
                explanation: ''
              });
            });
            logQuestionAction(poll.pollId, poll.numberOfQuestions, 'Completed');
            toast.success(`Question set "${poll.questionSetName || poll.pollId}" posted automatically!`);
          }
        });

        setPolls(prev => prev.map(p => {
          if (p.status === 'scheduled' && p.scheduledAt && p.scheduledAt <= now) {
            return { ...p, status: 'completed' } as Poll;
          }
          return p;
        }).filter(p => p.status !== 'completed'));
      }
    }, 10000);

    return () => clearInterval(worker);
  }, [polls, addQuestion]);

  const isConfigValid =
    courseName.trim().length > 0 &&
    typeof numQuestions === 'number' && numQuestions > 0 &&
    typeof numOptions === 'number' && numOptions >= 2 && numOptions <= 6 &&
    typeof passMarkPercentage === 'number' && passMarkPercentage >= 0 && passMarkPercentage <= 100;

  const generateDraftBlocks = () => {
    const count = typeof numQuestions === 'number' ? numQuestions : 0;
    const optionsCount = typeof numOptions === 'number' ? numOptions : 0;

    const newDraft: DraftQuestion[] = Array(count).fill(null).map((_, i) => {
      if (draftQuestions[i]) {
        const existing = draftQuestions[i];
        let options = [...existing.options];
        if (options.length < optionsCount) {
          options = [...options, ...Array(optionsCount - options.length).fill('')];
        } else if (options.length > optionsCount) {
          options = options.slice(0, optionsCount);
        }
        return { ...existing, options };
      }

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
    toast.success("Question set marked as completed.");
  };

  const handleDeletePoll = (pollId: string) => {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
      logQuestionAction(pollId, poll.numberOfQuestions, 'Deleted');
    }
    const updated = polls.filter(p => p.pollId !== pollId);
    setPolls(updated);
    localStorage.setItem('polls', JSON.stringify(updated));
    toast.error("Question set deleted.");
  };

  const handleUpdateQuestion = (index: number, field: keyof DraftQuestion, value: any) => {
    setDraftQuestions(prev => {
      const updated = [...prev];
      if (field === 'marks') {
        updated[index] = { ...updated[index], [field]: value === '' ? '' : parseInt(value) };
      } else if (field === 'timeLimitMinutes') {
        updated[index] = { ...updated[index], [field]: value === '' ? '' : parseFloat(value) };
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

  const handleDeleteQuestionFromDraft = (index: number) => {
    setDraftQuestions(prev => prev.filter((_, i) => i !== index));
    setCreationStatus({ type: 'success', message: "Question removed from draft" });
    setTimeout(() => setCreationStatus(null), 2000);
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
          scheduledEndTime: scheduledEndTime // Preserve end time
        } : p);
        localStorage.setItem('polls', JSON.stringify(updated));
        return updated;
      });
    }
    setCreationStatus({ type: 'success', message: "Draft saved successfully" });
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
    setPassMarkPercentage(poll.passMarkPercentage || 0);
    setScheduledEndTime(poll.scheduledEndTime || '');

    // If the poll is already completed, we treat "Edit" as "Reuse/Cloning"
    // by resetting the currentSetId so it saves as a new unique poll.
    if (poll.status === 'completed') {
      setCurrentSetId(null);
      toast.info("Reusing previous quiz - will be saved as new.");
    } else {
      setCurrentSetId(poll.pollId);
    }

    if (poll.status === 'scheduled' && poll.scheduledAt) {
      const date = new Date(poll.scheduledAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');

      setScheduledDate(`${year}-${month}-${day}`);
      setScheduledTime(`${hours}:${mins}`);
      setShowSchedule(false);
    } else {
      setShowSchedule(false);
      setScheduledDate('');
      setScheduledTime('');
    }

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
      setCreationStatus({ type: 'error', message: "Please fill all fields for all questions." });
      toast.error("Please fill all fields for all questions.");
      return;
    }

    if (!scheduledDate || !scheduledTime || !scheduledEndTime) {
      setCreationStatus({ type: 'error', message: "Please select date, start time, and end time." });
      toast.error("Please select date, start time, and end time to schedule.");
      return;
    }

    /* 
       Note about validation: We allow scheduling for "now" or "future". 
       Strict future check might block users trying to schedule for a minute ago to test "Live" status.
       So we'll be lenient with "Date.now()" check or remove it. 
    */
    // const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    // if (scheduledDateTime <= Date.now()) { ... } 

    if (!courseName.trim() || !questionSetName.trim() || passMarkPercentage === '') {
      setPendingAction('schedule');
      setShowSetupModal(true);
      return;
    }

    const finalTitle = questionSetName.trim();
    const finalCourse = courseName.trim();

    const quizId = `qz-sched-${Date.now()}`;

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
      endTime: scheduledEndTime,
      negativeMarksValue: 0,
      difficulty: 'Medium',
      passPercentage: Number(passMarkPercentage),
      totalQuestions: draftQuestions.length,
      requiredCorrectAnswers: Math.ceil((draftQuestions.length * Number(passMarkPercentage)) / 100),
      createdAt: '',
      maxAttempts: maxAttempts === '' ? 1 : maxAttempts,
    };

    const questionsToAdd: Omit<Question, 'id'>[] = draftQuestions.map((q) => ({
      quizId: quizId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks) || 1,
      timeLimitMinutes: parseFloat(String(q.timeLimitMinutes)) || 1,
      explanation: ''
    }));

    addQuiz(quizToAdd, questionsToAdd);
    toast.success(`Quiz scheduled successfully for ${scheduledDate} at ${scheduledTime}!`);

    // Clean up if we were editing a draft
    if (currentSetId) {
      setPolls(prev => prev.filter(p => p.pollId !== currentSetId));
    }

    clearActiveSession();

    // Redirect after short delay
    setTimeout(() => {
      navigate('/teacher?view=quizzes');
    }, 1500);
  };

  const handleDirectCreateQuiz = () => {
    const invalid = draftQuestions.some(q =>
      !q.questionText.trim() || q.options.some(o => !o.trim()) || !q.correctAnswer.trim() || q.marks === '' || q.timeLimitMinutes === ''
    );
    if (invalid) {
      setCreationStatus({ type: 'error', message: "Please fill all fields for all questions." });
      toast.error("Please fill all fields for all questions.");
      return;
    }

    if (!courseName.trim() || !questionSetName.trim() || passMarkPercentage === '') {
      setPendingAction('direct');
      setShowSetupModal(true);
      return;
    }

    const finalTitle = questionSetName.trim();
    const finalCourse = courseName.trim();

    const quizId = `qz-direct-${Date.now()}`;

    const quizToAdd: Omit<Quiz, 'id' | 'status'> = {
      quizId: quizId,
      title: finalTitle,
      courseName: finalCourse,
      questions: [],
      timeLimitMinutes: draftQuestions.reduce((acc, q) => acc + (Number(q.timeLimitMinutes) || 0), 0),
      negativeMarking: false,
      competitionMode: false,
      scheduledDate: scheduledDate || new Date().toLocaleDateString('en-CA'),
      startTime: scheduledTime || "00:00",
      endTime: scheduledEndTime || "23:59",
      negativeMarksValue: 0,
      difficulty: 'Medium',
      passPercentage: Number(passMarkPercentage),
      totalQuestions: draftQuestions.length,
      requiredCorrectAnswers: Math.ceil((draftQuestions.length * Number(passMarkPercentage)) / 100),
      createdAt: '',
      maxAttempts: maxAttempts === '' ? 1 : maxAttempts,
    };

    const questionsToAdd: Omit<Question, 'id'>[] = draftQuestions.map((q) => ({
      quizId: quizId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks) || 1,
      timeLimitMinutes: parseFloat(String(q.timeLimitMinutes)) || 1,
      explanation: ''
    }));

    addQuiz(quizToAdd, questionsToAdd);
    toast.success("Quiz created successfully!");

    // Mark the source poll as completed if we started from an existing one
    if (currentSetId) {
      setPolls(prev => prev.map(p => p.pollId === currentSetId ? { ...p, status: 'completed' } : p));
    }

    logQuestionAction(currentSetId || quizId, draftQuestions.length, 'Completed');
    clearActiveSession();

    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
  };

  const handleFinalSubmit = () => {
    if (!courseName.trim() || !questionSetName.trim() || passMarkPercentage === '') {
      toast.error("Please fill all fields.");
      return;
    }
    setShowSetupModal(false);
    if (pendingAction === 'schedule') {
      handleAddToPool();
    } else if (pendingAction === 'direct') {
      handleDirectCreateQuiz();
    }
    setPendingAction(null);
  };

  return (
    <div className="space-y-8 font-inter pb-20 relative min-h-screen bg-slate-50/50">

      {/* Step 0: Quiz Configuration */}
      {!isSetupVisible && (
        <div className="max-w-3xl mx-auto pt-10 px-6 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Settings2 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Quiz Configuration</h3>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="courseName" className="text-sm font-medium text-slate-700">Course</Label>
                <Select value={courseName} onValueChange={setCourseName}>
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm font-normal border-slate-200 bg-white hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-md",
                      !courseName && "text-slate-400"
                    )}
                  >
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-md rounded-md">
                    {availableCourses.length > 0 ? (
                      availableCourses.map((course) => (
                        <SelectItem key={course} value={course} className="text-sm py-2">
                          {course}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-slate-500 italic">No courses found.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examName" className="text-sm font-medium text-slate-700">Quiz Title</Label>
                <Input
                  id="examName"
                  placeholder="e.g. Mid-Term Assessment"
                  value={questionSetName}
                  onChange={(e) => setQuestionSetName(e.target.value)}
                  className="h-10 text-sm font-normal border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-md placeholder:text-slate-400"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numQuestions" className="text-sm font-medium text-slate-700">Questions</Label>
                  <Input
                    id="numQuestions"
                    type="number"
                    min="1"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="h-10 text-sm font-normal border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-md text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numOptions" className="text-sm font-medium text-slate-700">Options</Label>
                  <Input
                    id="numOptions"
                    type="number"
                    min="2"
                    max="6"
                    value={numOptions}
                    onChange={(e) => setNumOptions(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="h-10 text-sm font-normal border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-md text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passMark" className="text-sm font-medium text-slate-700">Pass Mark (%)</Label>
                  <Input
                    id="passMark"
                    type="number"
                    min="0"
                    max="100"
                    value={passMarkPercentage}
                    onChange={(e) => setPassMarkPercentage(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="h-10 text-sm font-normal border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-md text-center"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => navigate('/teacher')} className="h-9 px-4 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white rounded-md">Cancel</Button>
              <Button onClick={handleProceed} className="h-9 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-md transition-all">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Quiz Dashboard (Drafts) */}
      {isSetupVisible && step === 1 && (
        <div className="max-w-4xl mx-auto pt-10 px-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 -ml-2 mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <PlusCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Quiz Dashboard</h3>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <Button onClick={handleStartNew} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 group">
                <PlusCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Create New Quiz
              </Button>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                  <History className="h-3 w-3 text-slate-400" />
                  Recent Drafts
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {polls.filter(p => p.status !== 'completed').map(poll => (
                    <div key={poll.pollId} className="group flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-lg shadow-sm transition-all hover:bg-blue-50/50">
                      <div className="w-1/3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Draft ID</span>
                          <span className="text-[10px] font-mono text-slate-400">#{poll.pollId.slice(0, 8)}</span>
                        </div>
                        <span className="font-medium text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{poll.questionSetName || `Untitled Draft`}</span>
                      </div>
                      <div className="w-1/3 text-center">
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          {poll.numberOfQuestions} Questions
                        </span>
                      </div>
                      <div className="w-1/3 flex justify-end items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditPoll(poll)} className="h-8 text-xs font-medium border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                          Resume
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeletePoll(poll.pollId)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {polls.filter(p => p.status !== 'completed').length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-slate-700 mb-1">No Drafts</h3>
                      <p className="text-slate-500 text-xs">You don't have any saved quiz drafts.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Question Editor */}
      {isSetupVisible && step === 2 && (
        <div className="max-w-6xl mx-auto pt-10 px-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

            {/* Sidebar / Question Index */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
              <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 -ml-2 mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions</h4>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{currentQuestionIndex + 1} / {draftQuestions.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-4 gap-2">
                  {draftQuestions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={cn(
                        "h-10 rounded-md text-sm font-medium transition-all border",
                        currentQuestionIndex === i
                          ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100 ring-offset-1"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200 space-y-3">
                <Button onClick={handleSaveDraft} variant="outline" className="w-full justify-start text-xs border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handleSaveAndExit} variant="outline" className="w-full justify-start text-xs border-slate-200 text-slate-600 hover:text-slate-900">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Save & Exit
                </Button>
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 p-8 md:p-10 bg-white relative">
              {draftQuestions[currentQuestionIndex] && (
                <div className="max-w-3xl mx-auto space-y-8">

                  {/* Question Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Question Text</Label>
                      {draftQuestions[currentQuestionIndex].questionText && (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={draftQuestions[currentQuestionIndex].questionText}
                      onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'questionText', e.target.value)}
                      className="min-h-[120px] text-base resize-y border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-lg p-4"
                      placeholder="Type your question here..."
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Marks</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={draftQuestions[currentQuestionIndex].marks}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'marks', e.target.value)}
                          className="pl-9 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-center font-medium"
                        />
                        <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Time Limit (Min)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="any"
                          value={draftQuestions[currentQuestionIndex].timeLimitMinutes}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'timeLimitMinutes', e.target.value)}
                          className="pl-9 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-center font-medium"
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium text-slate-700">Options & Correct Answer</Label>
                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-6 space-y-4">
                      <RadioGroup
                        value={draftQuestions[currentQuestionIndex].correctAnswer}
                        onValueChange={(val) => handleUpdateQuestion(currentQuestionIndex, 'correctAnswer', val)}
                        className="space-y-3"
                      >
                        {draftQuestions[currentQuestionIndex].options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-3 items-center group/opt">
                            <RadioGroupItem
                              value={opt}
                              id={`q-${currentQuestionIndex}-opt-${oIndex}`}
                              className="border-slate-300 text-blue-600 focus:ring-blue-500"
                              disabled={!opt.trim()}
                            />
                            <div className="flex-1 relative">
                              <Input
                                placeholder={`Option ${oIndex + 1}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(currentQuestionIndex, oIndex, e.target.value)}
                                className={cn(
                                  "h-10 text-sm border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all",
                                  opt.trim() === draftQuestions[currentQuestionIndex].correctAnswer && opt.trim() !== '' ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white"
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        Select the radio button to mark the correct answer.
                      </p>
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestionIndex === draftQuestions.length - 1 ? (
                      <Button onClick={handleDirectCreateQuiz} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-8">
                        Finish & Create
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(draftQuestions.length - 1, prev + 1))}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm"
                      >
                        Next
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </Button>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-xl rounded-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Confirm Creation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Review your quiz details before final submission.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Course</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 font-medium">
                {courseName || "Not Selected"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Quiz Title</Label>
              <Input
                value={questionSetName}
                onChange={(e) => setQuestionSetName(e.target.value)}
                className="h-10 text-sm border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Pass Mark (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={passMarkPercentage}
                  onChange={(e) => setPassMarkPercentage(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="h-10 text-sm border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Questions</Label>
                <div className="h-10 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
                  {draftQuestions.length}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button variant="outline" onClick={() => setShowSetupModal(false)} className="flex-1 border-slate-200 hover:bg-white hover:text-slate-800">
              Back
            </Button>
            <Button onClick={handleFinalSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionCreator;
