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
        if (parsed.scheduledEndTime !== undefined) setScheduledEndTime(parsed.scheduledEndTime);
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
      scheduledEndTime,
      totalQuestions: numQuestions,
      requiredCorrectAnswers: Math.ceil((Number(numQuestions) * (Number(passMarkPercentage) || 0)) / 100)
    };
    localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));
  }, [numQuestions, numOptions, draftQuestions, questionSetName, courseName, step, currentSetId, scheduledEndTime]);

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
      setShowSchedule(true);
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

    const finalTitle = questionSetName.trim() || courseName.trim();
    const finalCourse = courseName.trim();

    if (!finalTitle || !finalCourse || passMarkPercentage === '') {
      setCreationStatus({ type: 'error', message: "Exam Paper / Course Name is mandatory." });
      toast.error("Exam Paper / Course Name is mandatory.");
      return;
    }

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

    const finalTitle = questionSetName.trim() || courseName.trim();
    const finalCourse = courseName.trim();

    if (!finalTitle || !finalCourse || passMarkPercentage === '') {
      setCreationStatus({ type: 'error', message: "Exam Paper / Course Name is mandatory." });
      toast.error("Exam Paper / Course Name is mandatory.");
      return;
    }

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

  return (
    <div className="space-y-6">
      {isSetupVisible ? (
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
            <Settings2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Question Setup</h3>
          </div>

          <div className="grid gap-8">
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
                        <SelectItem key={course} value={course} className="text-lg py-3 rounded-lg focus:bg-indigo-50">
                          {course}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm font-medium text-slate-500">No courses added yet.</p>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="examName" className="text-lg font-bold text-gray-700">Exam Name</Label>
                <Input
                  id="examName"
                  placeholder="e.g. Final Exam"
                  value={questionSetName}
                  onChange={(e) => setQuestionSetName(e.target.value)}
                  className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (!questionSetName || !questionSetName.trim()) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="numQuestions" className="text-lg font-bold text-gray-700">Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm border-blue-100 focus:border-blue-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="numOptions" className="text-lg font-bold text-gray-700">Options</Label>
                <Input
                  id="numOptions"
                  type="number"
                  value={numOptions}
                  onChange={(e) => setNumOptions(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm border-blue-100 focus:border-blue-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="passMark" className="text-lg font-bold text-gray-700">Pass %</Label>
                <Input
                  id="passMark"
                  type="number"
                  value={passMarkPercentage}
                  onChange={(e) => setPassMarkPercentage(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm border-blue-100 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-blue-50 gap-4">
            <Button variant="ghost" onClick={() => navigate('/teacher')} className="px-6 h-12 font-bold text-gray-400">Cancel</Button>
            <Button onClick={handleProceed} className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-xl font-black text-lg">Proceed to Draft</Button>
          </div>
        </div>
      ) : step === 1 ? (
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b bg-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <PlusCircle className="h-6 w-6 text-blue-600" />
              Question Creator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <Button onClick={handleStartNew} className="w-full bg-green-600 hover:bg-green-700 text-white h-16 rounded-xl shadow-md flex items-center justify-center gap-3 text-xl font-bold">
              <PlusCircle className="h-6 w-6" /> + New Question
            </Button>

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700"><History className="h-5 w-5" /> Question History</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {polls.map(poll => (
                  <div key={poll.pollId} className="group flex items-center p-4 bg-gray-50 rounded-xl border border-transparent hover:border-blue-200 hover:bg-white transition-all text-sm">
                    <div className="w-1/3 flex items-center gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full ${poll.status === 'pending' ? 'bg-violet-400' : poll.status === 'scheduled' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <span className="font-bold text-gray-800 truncate">{poll.questionSetName || `ID: ${poll.pollId.slice(-6)}`}</span>
                    </div>
                    <div className="w-1/3 text-center font-bold text-gray-600">{poll.numberOfQuestions} Questions</div>
                    <div className="w-1/3 flex justify-end items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPoll(poll)}
                        disabled={poll.status === 'scheduled' && (poll.scheduledAt || 0) <= Date.now()}
                        className={cn("h-8 px-2 font-bold",
                          (poll.status === 'scheduled' && (poll.scheduledAt || 0) <= Date.now())
                            ? "text-gray-300 cursor-not-allowed"
                            : poll.status === 'completed' ? "text-emerald-600 hover:text-emerald-700" : "text-blue-600"
                        )}
                      >
                        {poll.status === 'completed' ? 'Reuse' : 'Edit'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePoll(poll.pollId)} className="h-7 px-2 text-red-600">Delete</Button>
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-wider",
                        poll.status === 'completed' ? "text-emerald-500" : "text-violet-600"
                      )}>{poll.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-none overflow-hidden">
          <CardHeader className="border-b bg-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <PlusCircle className="h-6 w-6 text-blue-600" />
                Drafting: {questionSetName || 'Untitled Quiz'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {currentQuestionIndex + 1}
                </div>
                <div>
                  <h4 className="font-bold text-gray-700">Question {currentQuestionIndex + 1} of {draftQuestions.length}</h4>
                  <p className="text-xs text-gray-500 font-medium">Fill in the details for this question.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="h-9 px-4 font-bold border-gray-200"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(draftQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === draftQuestions.length - 1}
                  className="h-9 px-6 bg-slate-900 text-white hover:bg-black font-bold"
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 p-1">
              {draftQuestions[currentQuestionIndex] && (
                <Card className="relative overflow-hidden border-2 border-gray-100 hover:border-blue-100 transition-colors shadow-sm animate-in fade-in slide-in-from-right-4 duration-300" key={currentQuestionIndex}>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-600">Question Text</Label>
                      <Textarea
                        value={draftQuestions[currentQuestionIndex].questionText}
                        onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'questionText', e.target.value)}
                        className="min-h-[100px] border-gray-200 text-lg focus:ring-blue-500/20"
                        placeholder="Type your question here..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-600">Marks</Label>
                        <Input
                          type="number"
                          value={draftQuestions[currentQuestionIndex].marks}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'marks', e.target.value)}
                          className="font-bold text-blue-600 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-600">Time (mins)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={draftQuestions[currentQuestionIndex].timeLimitMinutes}
                          onChange={(e) => handleUpdateQuestion(currentQuestionIndex, 'timeLimitMinutes', e.target.value)}
                          className="font-bold text-blue-600 h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-gray-600">Options & Correct Answer</Label>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <RadioGroup
                          value={draftQuestions[currentQuestionIndex].correctAnswer}
                          onValueChange={(val) => handleUpdateQuestion(currentQuestionIndex, 'correctAnswer', val)}
                          className="grid gap-3"
                        >
                          {draftQuestions[currentQuestionIndex].options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex gap-3 items-center group">
                              <RadioGroupItem
                                value={opt}
                                id={`q-${currentQuestionIndex}-opt-${oIndex}`}
                                className="border-2 border-slate-300 text-blue-600"
                                disabled={!opt.trim()}
                              />
                              <div className="flex-1 relative">
                                <Input
                                  placeholder={`Option ${oIndex + 1}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(currentQuestionIndex, oIndex, e.target.value)}
                                  className="flex-1 bg-white border-slate-200 focus:border-blue-500 h-11"
                                />
                                {opt.trim() === draftQuestions[currentQuestionIndex].correctAnswer && opt.trim() !== '' && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-wider">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        * Select the radio button next to an option to mark it as the correct answer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 p-6 bg-gray-50/80 border-t rounded-b-lg">
            <div className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-gray-700">Scheduling Options (Optional)</span>
              </div>
              <Button variant={showSchedule ? "default" : "outline"} size="sm" onClick={() => setShowSchedule(!showSchedule)}>
                {showSchedule ? "Hide Schedule" : "Set Schedule"}
              </Button>
            </div>

            {showSchedule && (
              <div className="w-full p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Calendar className="h-4 w-4" /> Date</Label>
                    <Input type="date" min={new Date().toISOString().split('T')[0]} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-10 border-blue-100 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Clock className="h-4 w-4" /> Start Time</Label>
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-10 border-blue-100 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-600 flex items-center gap-2"><Clock className="h-4 w-4" /> End Time</Label>
                    <Input type="time" value={scheduledEndTime} onChange={(e) => setScheduledEndTime(e.target.value)} className="h-10 border-blue-100 bg-white" />
                  </div>
                </div>
                <Button onClick={handleAddToPool} variant="outline" className="w-full border-blue-200 text-blue-700 font-bold h-10 flex items-center justify-center gap-2 hover:bg-blue-50">
                  <Calendar className="h-4 w-4" /> Schedule Quiz
                </Button>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <Button variant="outline" onClick={() => setStep(1)} className="px-8 h-12 font-bold">Back</Button>
              <Button variant="outline" onClick={handleSaveAndExit} className="flex-1 h-12 font-bold border-blue-200 text-blue-600">Save Draft</Button>
              <Button onClick={handleDirectCreateQuiz} className="flex-1 h-12 font-black bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg">
                <CheckCircle2 className="h-5 w-5 mr-2" /> Create Quiz Now
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default QuestionCreator;