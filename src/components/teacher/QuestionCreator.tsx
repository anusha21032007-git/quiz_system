"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2, History, X, Settings2, Save, Send, CheckCircle2, Clock, Edit, GraduationCap, ArrowLeft, Calendar } from 'lucide-react';
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
    <div className="space-y-8 font-poppins pb-20 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#6C8BFF]/5 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-[#E38AD6]/5 rounded-full blur-[80px] -z-10" />

      {isSetupVisible ? (
        <div className="glass-card p-12 space-y-10 animate-in slide-in-from-top-6 duration-700 max-w-5xl mx-auto border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />

          <div className="flex items-center gap-5 border-b border-white/40 pb-8 relative z-10">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 h-14 w-14 rounded-2xl hover:bg-white/40 border border-transparent hover:border-white/60 transition-all">
              <ArrowLeft className="h-7 w-7 text-[#7A80B8]" />
            </Button>
            <div className="p-3 bg-[#6C8BFF]/10 rounded-2xl">
              <Settings2 className="h-7 w-7 text-[#6C8BFF]" />
            </div>
            <h3 className="text-3xl font-black text-[#1E2455] uppercase tracking-tighter">Question Setup</h3>
          </div>

          <div className="grid gap-10 relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="courseName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">DISCIPLINARY DOMAIN</Label>
                <Select value={courseName} onValueChange={setCourseName}>
                  <SelectTrigger
                    className={cn(
                      "glass-input h-16 text-xl font-black text-[#1E2455]",
                      showErrors && !courseName ? "border-[#FF6B8A]/60 ring-[#FF6B8A]/10" : "border-white/60"
                    )}
                  >
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl rounded-[24px]">
                    {availableCourses.length > 0 ? (
                      availableCourses.map((course) => (
                        <SelectItem key={course} value={course} className="text-base py-4 px-6 rounded-xl focus:bg-[#6C8BFF]/10 focus:text-[#6C8BFF] cursor-pointer font-black uppercase tracking-tight">
                          {course}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-sm font-black text-[#7A80B8] uppercase tracking-widest italic opacity-60">No academic domains indexed.</p>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="examName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">SIMULATION DESIGNATION</Label>
                <Input
                  id="examName"
                  placeholder="e.g. Final Assessment"
                  value={questionSetName}
                  onChange={(e) => setQuestionSetName(e.target.value)}
                  className={cn(
                    "glass-input h-16 text-xl font-black text-[#1E2455] placeholder-[#7A80B8]/40",
                    showErrors && (!questionSetName || !questionSetName.trim()) ? 'border-[#FF6B8A]/60 ring-[#FF6B8A]/10' : 'border-white/60'
                  )}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Label htmlFor="numQuestions" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">QUERY COUNT</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="glass-input h-16 text-xl font-black text-[#1E2455]"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="numOptions" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">OPTION MULTIPLICITY</Label>
                <Input
                  id="numOptions"
                  type="number"
                  value={numOptions}
                  onChange={(e) => setNumOptions(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="glass-input h-16 text-xl font-black text-[#1E2455]"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="passMark" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">PROFICIENCY THRESHOLD (%)</Label>
                <Input
                  id="passMark"
                  type="number"
                  value={passMarkPercentage}
                  onChange={(e) => setPassMarkPercentage(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="glass-input h-16 text-xl font-black text-[#1E2455]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-white/40 gap-6 relative z-10">
            <Button variant="ghost" onClick={() => navigate('/teacher')} className="h-16 px-10 font-black text-[#7A80B8] uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-[#6C8BFF]/5">Cancel</Button>
            <Button onClick={handleProceed} className="pastel-button-primary h-16 px-12 text-[10px] tracking-[0.2em]">
              PROCEED TO SYNTHESIS
            </Button>
          </div>
        </div>
      ) : step === 1 ? (
        <div className="glass-card shadow-lg border-white/60 bg-white/40 backdrop-blur-xl rounded-[48px] overflow-hidden max-w-4xl mx-auto">
          <div className="border-b border-white/60 bg-white/40 px-10 py-8">
            <div className="flex items-center gap-5">
              <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 h-12 w-12 rounded-2xl hover:bg-white/60 border border-transparent hover:border-white/60 transition-all">
                <ArrowLeft className="h-6 w-6 text-[#7A80B8]" />
              </Button>
              <div className="p-3 bg-[#6C8BFF]/10 rounded-2xl">
                <PlusCircle className="h-7 w-7 text-[#6C8BFF]" />
              </div>
              <h3 className="text-3xl font-black text-[#1E2455] uppercase tracking-tighter">Manual Synthesis Hub</h3>
            </div>
          </div>
          <div className="p-10 space-y-10">
            <Button onClick={handleStartNew} className="pastel-button-primary w-full h-20 rounded-[28px] text-[12px] tracking-[0.3em] group shadow-xl hover:shadow-glass-hover">
              <div className="p-2 bg-white/20 rounded-xl mr-5 group-hover:rotate-90 transition-transform duration-500">
                <PlusCircle className="h-7 w-7" />
              </div>
              INITIALIZE NEW SEQUENCE
            </Button>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                <History className="h-5 w-5 text-[#6C8BFF]" />
                Temporal Fragments <span className="opacity-40 italic">/ Draft History</span>
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/60 scrollbar-track-transparent">
                {polls.filter(p => p.status !== 'completed').map(poll => (
                  <div key={poll.pollId} className="group flex items-center p-6 glass-card border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover transition-all duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

                    <div className="w-1/3 flex items-center gap-6 relative z-10">
                      <div className={cn("h-3 w-3 rounded-full animate-pulse shadow-sm", poll.status === 'pending' ? 'bg-[#6C8BFF]' : poll.status === 'scheduled' ? 'bg-[#FFB86C]' : 'bg-[#4EE3B2]')} />
                      <span className="font-black text-[#1E2455] uppercase tracking-tight truncate text-lg group-hover:text-[#6C8BFF] transition-colors">{poll.questionSetName || `ID: ${poll.pollId.slice(-6)}`}</span>
                    </div>
                    <div className="w-1/3 text-center relative z-10">
                      <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-widest bg-white/40 px-4 py-2 rounded-xl border border-white/60 group-hover:border-[#6C8BFF]/30 transition-all">
                        {poll.numberOfQuestions} QUERIES
                      </span>
                    </div>
                    <div className="w-1/3 flex justify-end items-center gap-6 relative z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPoll(poll)}
                        disabled={poll.status === 'scheduled' && (poll.scheduledAt || 0) <= Date.now()}
                        className={cn("h-10 px-5 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-white/60",
                          (poll.status === 'scheduled' && (poll.scheduledAt || 0) <= Date.now())
                            ? "text-[#7A80B8]/40 cursor-not-allowed"
                            : "text-[#6C8BFF] hover:bg-[#6C8BFF]/5"
                        )}
                      >
                        {poll.status === 'completed' ? 'CLONE' : 'RESUME'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePoll(poll.pollId)} className="h-10 w-10 text-[#FF6B8A] hover:bg-[#FF6B8A]/5 hover:text-[#FF6B8A] rounded-xl border border-transparent hover:border-[#FF6B8A]/20 transition-all">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-sm min-w-[100px] text-center",
                        poll.status === 'completed' ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border border-[#4EE3B2]/20" : "bg-[#6C8BFF]/10 text-[#6C8BFF] border border-[#6C8BFF]/20"
                      )}>{poll.status}</span>
                    </div>
                  </div>
                ))}
                {polls.filter(p => p.status !== 'completed').length === 0 && (
                  <div className="py-24 text-center glass-card border-dashed border-white/40 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,139,255,0.02)_0%,transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity" />
                    <History className="h-16 w-16 text-[#7A80B8] mx-auto mb-6 opacity-40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                    <h3 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter mb-4">Archive Vacant</h3>
                    <p className="text-[#3A3F6B] font-bold italic opacity-60 tracking-tight text-lg max-w-xs mx-auto">No draft fragments currently indexed in the temporal buffer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card shadow-2xl border-white/60 bg-white/40 backdrop-blur-xl rounded-[48px] overflow-hidden animate-in fade-in zoom-in-95 duration-700 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />

          <div className="border-b border-white/60 bg-white/40 px-10 py-10 relative z-10">
            <div className="flex items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="mr-2 h-14 w-14 rounded-2xl hover:bg-white/60 border border-transparent hover:border-white/60 transition-all">
                  <ArrowLeft className="h-7 w-7 text-[#7A80B8]" />
                </Button>
                <div>
                  <h3 className="text-4xl lg:text-5xl font-black text-[#1E2455] uppercase tracking-tighter leading-none mb-3">
                    Manual Synthesis Engine
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] opacity-60 italic">Fragment /</span>
                    <span className="text-[10px] font-black text-[#6C8BFF] uppercase tracking-[0.4em]">{questionSetName || 'UNTITLED SEQUENCE'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <Button onClick={handleSaveDraft} variant="ghost" className="h-16 px-10 flex items-center gap-4 text-[#7A80B8] hover:text-[#6C8BFF] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white hover:border-[#6C8BFF]/30 hover:bg-[#6C8BFF]/5 transition-all group">
                  <Save className="h-6 w-6 group-hover:scale-110 transition-all" />
                  BUFFER DRAFT
                </Button>
                <div className="h-16 px-8 bg-white/60 border border-white rounded-[24px] flex items-center gap-6 shadow-sm">
                  <div className="text-[10px] font-black text-[#7A80B8] uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#6C8BFF]" />
                    AUTO-SAVE: <span className="text-[#6C8BFF]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Question Selector Rail */}
              <div className="w-full lg:w-80 shrink-0 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em]">Query Index</h4>
                  <span className="text-[10px] font-black text-[#6C8BFF] bg-[#6C8BFF]/10 px-3 py-1 rounded-lg border border-[#6C8BFF]/20 italic">{currentQuestionIndex + 1} OF {draftQuestions.length}</span>
                </div>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-3">
                  {draftQuestions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={cn(
                        "h-14 lg:h-16 rounded-[18px] font-black text-lg transition-all duration-500 shadow-sm border",
                        currentQuestionIndex === i
                          ? "bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] text-white border-transparent scale-110 shadow-lg shadow-[#6C8BFF]/25 z-10"
                          : "bg-white/60 text-[#7A80B8] border-white/60 hover:bg-[#6C8BFF]/5 hover:text-[#6C8BFF] hover:border-[#6C8BFF]/30"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={handleSaveAndExit} className="w-full h-16 rounded-[22px] border-white/60 text-[#7A80B8] hover:text-[#1E2455] hover:bg-white/40 font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-700 mt-10 shadow-sm">
                  SAVE & EXIT ARCHIVE
                </Button>
              </div>

              {/* Editor Space */}
              <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-right-10 duration-700" key={currentQuestionIndex}>
                {draftQuestions[currentQuestionIndex] && (
                  <div className="space-y-10">
                    <div className="glass-card p-10 border-white/60 bg-white/40 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-[#6C8BFF]" />
                      <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-1">Primary Query Text</Label>
                          <div className="flex items-center gap-4 text-[#7A80B8] opacity-60">
                            <Edit className="h-4 w-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest italic pt-0.5">Edit Mode Active</span>
                          </div>
                        </div>
                        <Textarea
                          value={draftQuestions[currentQuestionIndex].questionText}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'questionText', e.target.value)}
                          className="min-h-[160px] glass-input text-2xl font-black text-[#1E2455] placeholder-[#7A80B8]/40 p-8 leading-relaxed focus:bg-white/80"
                          placeholder="Type your academic inquiry here..."
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="glass-card p-8 border-white/60 bg-white/40 shadow-sm space-y-6 group hover:bg-white/60 transition-all duration-700">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-[#6C8BFF]/10 rounded-xl group-hover:bg-[#6C8BFF]/20 transition-all border border-[#6C8BFF]/10 group-hover:rotate-12">
                            <GraduationCap className="h-6 w-6 text-[#6C8BFF]" />
                          </div>
                          <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em]">Valuation (Marks)</Label>
                        </div>
                        <Input
                          type="number"
                          value={draftQuestions[currentQuestionIndex].marks}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'marks', e.target.value)}
                          className="glass-input h-14 text-2xl font-black text-[#6C8BFF] focus:bg-white text-center"
                        />
                      </div>
                      <div className="glass-card p-8 border-white/60 bg-white/40 shadow-sm space-y-6 group hover:bg-white/60 transition-all duration-700">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-[#FFB86C]/10 rounded-xl group-hover:bg-[#FFB86C]/20 transition-all border border-[#FFB86C]/10 group-hover:rotate-[360deg] duration-1000">
                            <Clock className="h-6 w-6 text-[#FFB86C]" />
                          </div>
                          <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em]">Temporal Window (Mins)</Label>
                        </div>
                        <Input
                          type="number"
                          step="any"
                          value={draftQuestions[currentQuestionIndex].timeLimitMinutes}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'timeLimitMinutes', e.target.value)}
                          className="glass-input h-14 text-2xl font-black text-[#FFB86C] focus:bg-white text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.5em] pl-1 block">Option Multiplicity / Correct Validation</Label>
                      <div className="glass-card p-10 border-white/60 bg-white/40 shadow-sm relative overflow-hidden group">
                        <RadioGroup
                          value={draftQuestions[currentQuestionIndex].correctAnswer}
                          onValueChange={(val) => handleUpdateQuestion(currentQuestionIndex, 'correctAnswer', val)}
                          className="grid gap-6"
                        >
                          {draftQuestions[currentQuestionIndex].options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex gap-6 items-center group/opt">
                              <RadioGroupItem
                                value={opt}
                                id={`q-${currentQuestionIndex}-opt-${oIndex}`}
                                className="h-8 w-8 border-2 border-[#7A80B8]/40 text-[#6C8BFF] focus:ring-[#6C8BFF]/20"
                                disabled={!opt.trim()}
                              />
                              <div className="flex-1 relative">
                                <Input
                                  placeholder={`Input value for Option ${oIndex + 1}...`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(currentQuestionIndex, oIndex, e.target.value)}
                                  className={cn(
                                    "glass-input h-16 text-lg font-bold text-[#1E2455] px-8 transition-all hover:bg-white/60 focus:bg-white",
                                    opt.trim() === draftQuestions[currentQuestionIndex].correctAnswer && opt.trim() !== '' ? "border-[#4EE3B2]/60 ring-[#4EE3B2]/10 bg-[#4EE3B2]/5" : "border-white/60"
                                  )}
                                />
                                {opt.trim() === draftQuestions[currentQuestionIndex].correctAnswer && opt.trim() !== '' && (
                                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <div className="h-3 w-3 bg-[#4EE3B2] rounded-full animate-pulse shadow-sm shadow-[#4EE3B2]/50" />
                                    <span className="text-[9px] font-black uppercase text-[#4EE3B2] tracking-[0.2em] bg-[#4EE3B2]/10 px-4 py-2 rounded-xl border border-[#4EE3B2]/20 shadow-sm">
                                      Validated Answer
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <p className="text-[10px] font-black text-[#7A80B8] opacity-60 uppercase tracking-widest flex items-center gap-3 pl-2">
                        <CheckCircle2 className="h-4 w-4 text-[#4EE3B2]" />
                        Toggle the radio indicator to authenticate the correct inquiry response.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-10 border-t border-white/40">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="h-16 px-10 font-black text-[#7A80B8] uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-[#6C8BFF]/5 flex items-center gap-4 transition-all disabled:opacity-30 group"
                        type="button"
                      >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Retrogression
                      </Button>
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(draftQuestions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === draftQuestions.length - 1}
                        className="h-16 px-12 glass-card border-white/60 hover:border-[#6C8BFF]/60 hover:bg-[#6C8BFF]/5 text-[#6C8BFF] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center gap-4 group transition-all duration-500 disabled:opacity-30"
                        type="button"
                      >
                        Sequence Progression
                        <div className="p-1.5 bg-[#6C8BFF]/10 rounded-lg group-hover:bg-[#6C8BFF]/20 group-hover:translate-x-1 transition-all">
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-12 py-12 bg-[#1E2455]/5 border-t border-white/60 relative z-10 group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

            <div className="space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10 p-10 glass-card border-white shadow-xl hover:shadow-glass-hover transition-all duration-1000">
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
                <div className="glass-card p-10 border-[#6C8BFF]/20 bg-white shadow-2xl space-y-10 animate-in slide-in-from-top-6 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Synthesis Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "glass-input h-16 w-full justify-start text-left font-black text-lg px-6",
                              !scheduledDate && "text-[#7A80B8]/40"
                            )}
                          >
                            <Calendar className="mr-4 h-6 w-6 text-[#6C8BFF]" />
                            {scheduledDate ? format(new Date(scheduledDate), "PPP") : <span className="uppercase tracking-widest text-[10px]">Select Date...</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="glass-card p-0 border-white/60 shadow-2xl rounded-[32px] overflow-hidden" align="start">
                          <ShadcnCalendar
                            mode="single"
                            selected={scheduledDate ? new Date(scheduledDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setScheduledDate(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Initialization Time</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="glass-input h-16 text-xl font-black text-[#1E2455] px-6 appearance-none"
                        />
                        <Clock className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#6C8BFF] pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">Termination Time</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          value={scheduledEndTime}
                          onChange={(e) => setScheduledEndTime(e.target.value)}
                          className="glass-input h-16 text-xl font-black text-[#1E2455] px-6 appearance-none"
                        />
                        <Clock className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#FF6B8A] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddToPool} variant="outline" className="w-full h-20 rounded-[28px] border-[#6C8BFF]/40 text-[#6C8BFF] font-black uppercase tracking-[0.4em] text-[12px] flex items-center justify-center gap-6 hover:bg-[#6C8BFF]/5 hover:shadow-xl transition-all duration-700">
                    <Calendar className="h-7 w-7" /> COMMENCE SCHEDULED SYNTHESIS
                  </Button>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8 w-full pt-10">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-20 px-12 font-black text-[#7A80B8] uppercase tracking-[0.3em] text-[11px] rounded-[32px] hover:bg-[#6C8BFF]/5 border border-white/60 transition-all">Back to Hub</Button>
                <Button variant="outline" onClick={handleSaveAndExit} className="flex-1 h-20 rounded-[32px] border-white/60 bg-white/40 text-[#7A80B8] hover:text-[#1E2455] hover:bg-white/60 font-black uppercase tracking-[0.3em] text-[11px] shadow-sm transition-all duration-700">BUFFER TO DRAFT ARCHIVE</Button>
                <Button onClick={handleDirectCreateQuiz} className="pastel-button-primary flex-1 h-20 rounded-[32px] text-[12px] tracking-[0.3em] group shadow-xl hover:shadow-glass-hover">
                  <div className="p-2 bg-white/20 rounded-xl mr-5 group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  COMMIT SYNTHESIS NOW
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="glass-card sm:max-w-[600px] border-white/60 bg-white/40 backdrop-blur-3xl rounded-[48px] p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-10" />

          <DialogHeader className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#6C8BFF]/10 rounded-2xl border border-[#6C8BFF]/20">
                <Wand2 className="h-8 w-8 text-[#6C8BFF]" />
              </div>
              <DialogTitle className="text-4xl font-black text-[#1E2455] uppercase tracking-tighter leading-none">
                Synthesis Commitment
              </DialogTitle>
            </div>
            <DialogDescription className="text-lg font-bold text-[#3A3F6B] italic opacity-60 tracking-tight leading-relaxed">
              Verify the mandatory synthesis parameters before finalizing the simulation environment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-8 py-8">
            <div className="space-y-3">
              <Label htmlFor="modalCourseName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">DISCIPLINARY DOMAIN</Label>
              <Select value={courseName || ""} onValueChange={setCourseName}>
                <SelectTrigger id="modalCourseName" className="glass-input h-16 text-xl font-black text-[#1E2455] border-white/60">
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent className="glass-card bg-white/60 border-white/60 shadow-2xl rounded-[24px]">
                  {availableCourses.map((course) => (
                    <SelectItem key={course} value={course} className="text-base py-4 px-6 rounded-xl font-black uppercase tracking-tight">
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="modalExamName" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">SEQUENCE DESIGNATION</Label>
                <Input
                  id="modalExamName"
                  placeholder="e.g. Unit 1 Quiz"
                  value={questionSetName}
                  onChange={(e) => setQuestionSetName(e.target.value)}
                  className="glass-input h-16 text-xl font-black text-[#1E2455] border-white/60"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="modalPassMark" className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] pl-2 block">PROFICIENCY (%)</Label>
                <Input
                  id="modalPassMark"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 50"
                  value={passMarkPercentage}
                  onChange={(e) => setPassMarkPercentage(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="glass-input h-16 text-xl font-black text-[#1E2455] border-white/60"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-6 pt-5 border-t border-white/40">
            <Button variant="ghost" onClick={() => setShowSetupModal(false)} className="h-16 px-10 font-black text-[#7A80B8] uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-[#6C8BFF]/5 border border-white/60 transition-all flex-1">
              REVISE PARAMETERS
            </Button>
            <Button onClick={handleFinalSubmit} className="pastel-button-primary h-16 px-12 text-[10px] tracking-[0.3em] rounded-2xl flex-1 group shadow-xl">
              <div className="p-1.5 bg-white/20 rounded-lg mr-4 group-hover:scale-110 transition-all">
                <Send className="h-5 w-5 text-white" />
              </div>
              COMMIT ARCHIVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionCreator;
