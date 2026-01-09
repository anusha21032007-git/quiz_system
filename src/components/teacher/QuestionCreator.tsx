"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2, History, X, Settings2, Save, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz } from '@/context/QuizContext';

interface Poll {
  pollId: string;
  numberOfQuestions: number;
  mcqCount: number;
  createdAt: number;
  status: 'pending' | 'completed';
  draftQuestions?: DraftQuestion[];
  questionSetName?: string;
}

interface DraftQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number | '';
  timeLimitMinutes: number | '';
}

const QuestionCreator = () => {
  const { addQuestion } = useQuiz();

  // Configuration State
  const [numQuestions, setNumQuestions] = useState<number | ''>(0);
  const [numOptions, setNumOptions] = useState<number | ''>(0);

  // Drafting State
  const [step, setStep] = useState<1 | 2>(1);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [questionSetName, setQuestionSetName] = useState('');
  const [isSetupVisible, setIsSetupVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // History State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);

  // NEW: Session Persistence State (Current active work)
  // Load session and history from local storage on initial mount
  useEffect(() => {
    // Load session
    const session = localStorage.getItem('activeCreationSession');
    if (session) {
      try {
        const { numQuestions: sq, numOptions: so, draftQuestions: sd, step: ss, questionSetName: sn } = JSON.parse(session);
        if (sq !== undefined) setNumQuestions(sq);
        if (so !== undefined) setNumOptions(so);
        if (sd !== undefined) setDraftQuestions(sd);
        if (sn !== undefined) setQuestionSetName(sn);
        if (ss !== undefined) setStep(ss);
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
      step
    };
    localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));
  }, [numQuestions, numOptions, draftQuestions, questionSetName, step]);

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
    setCurrentSetId(null);
    setStep(1);
    setIsSetupVisible(false);
    setShowErrors(false);
    setCreationStatus(null);
  };

  // Validation for Step 1
  const isConfigValid =
    typeof numQuestions === 'number' && numQuestions > 0 &&
    typeof numOptions === 'number' && numOptions >= 1 && numOptions <= 6;

  // Generate Questions based on Config
  const generateDraftBlocks = () => {
    const count = typeof numQuestions === 'number' ? numQuestions : 0;
    const optionsCount = typeof numOptions === 'number' ? numOptions : 0;

    const newDraft: DraftQuestion[] = Array(count).fill(null).map(() => ({
      questionText: '',
      options: Array(optionsCount).fill(''),
      correctAnswer: '',
      marks: 1,
      timeLimitMinutes: 1,
    }));

    setDraftQuestions(newDraft);
    return newDraft;
  };

  const handleProceed = () => {
    if (isConfigValid) {
      const generatedDraft = generateDraftBlocks();

      // Save poll data to localStorage history
      const pollId = `poll_${Date.now()}`;
      const newPoll: Poll = {
        pollId,
        numberOfQuestions: numQuestions as number,
        mcqCount: numOptions as number,
        createdAt: Date.now(),
        status: 'pending',
        draftQuestions: generatedDraft,
        questionSetName: ''
      };
      setPolls(prev => {
        const updated = [newPoll, ...prev];
        localStorage.setItem('polls', JSON.stringify(updated));
        return updated;
      });
      setCurrentSetId(pollId); // Use pollId as sessionId

      setIsSetupVisible(false);
      setStep(2);
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
    const updated = polls.map(p => p.pollId === pollId ? { ...p, status: 'completed' as const } : p);
    setPolls(updated);
    localStorage.setItem('polls', JSON.stringify(updated));
  };

  const handleDeletePoll = (pollId: string) => {
    const poll = polls.find(p => p.pollId === pollId);
    if (poll) {
      logQuestionAction(pollId, poll.numberOfQuestions, 'Deleted');
    }
    const updated = polls.filter(p => p.pollId !== pollId);
    setPolls(updated);
    localStorage.setItem('polls', JSON.stringify(updated));
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
          draftQuestions
        } : p);
        localStorage.setItem('polls', JSON.stringify(updated));
        return updated;
      });
    }
    setCreationStatus({ type: 'success', message: "Draft saved successfully" });
    // Remove status message after some time
    setTimeout(() => setCreationStatus(null), 3000);
  };

  const handleResumePoll = (poll: Poll) => {
    setNumQuestions(poll.numberOfQuestions);
    setNumOptions(poll.mcqCount);
    setDraftQuestions(poll.draftQuestions || []);
    setQuestionSetName(poll.questionSetName || '');
    setCurrentSetId(poll.pollId);
    setStep(2);
    setIsSetupVisible(false);
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

    draftQuestions.forEach(q => {
      addQuestion({
        quizId: 'unassigned',
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks as number,
        timeLimitMinutes: q.timeLimitMinutes as number
      });
    });

    clearActiveSession();
    setCreationStatus({ type: 'success', message: `${draftQuestions.length} question(s) added to the pool!` });
    setTimeout(() => setCreationStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      {isSetupVisible ? (
        /* Question Setup Section */
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 space-y-8 animate-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 border-b border-blue-50 pb-4">
            <Settings2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800">Question Setup</h3>
          </div>

          <div className="grid gap-8">
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
                onKeyDown={(e) => e.preventDefault()}
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
                min="0"
                max="6"
                value={numOptions}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setNumOptions('');
                    return;
                  }
                  const numVal = parseInt(val);
                  if (numVal < 0 || numVal > 6) {
                    toast.error("Options per question must be between 1 and 6.");
                    return;
                  }
                  setNumOptions(numVal);
                  if (showErrors) setShowErrors(false);
                }}
                onKeyDown={(e) => e.preventDefault()}
                className={`h-14 text-xl bg-gray-50/50 focus:bg-white transition-all shadow-sm ${showErrors && (numOptions === '' || numOptions < 1 || numOptions > 6) ? 'border-red-500 ring-red-50' : 'border-blue-100 focus:border-blue-500'}`}
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-sm text-gray-400 font-medium">Range: 1 to 6 options</p>
                {showErrors && (numOptions === '' || numOptions < 1 || numOptions > 6) && (
                  <p className="text-sm text-red-500 font-bold">Invalid range!</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-blue-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => { setIsSetupVisible(false); setStep(1); }}
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
                {polls.filter(p => p.status === 'pending').length > 0 ? (
                  polls.filter(p => p.status === 'pending').map(poll => (
                    <div key={poll.pollId} className="group flex items-center p-4 bg-gray-50 rounded-xl border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all text-sm">
                      <div className="w-1/3 flex items-center gap-3">
                        <div className={`h-1.5 w-1.5 rounded-full ${poll.status === 'pending' ? 'bg-violet-400' : 'bg-green-500'}`} />
                        <span className="font-mono font-bold text-gray-500">ID: {poll.pollId.split('_')[1]}</span>
                      </div>
                      <div className="w-1/3 text-center font-bold text-gray-600">
                        {poll.numberOfQuestions} Questions
                      </div>
                      <div className="w-1/3 flex justify-end items-center gap-4">
                        {poll.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResumePoll(poll)}
                              className="h-7 px-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Resume
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompletePoll(poll.pollId)}
                              className="h-7 px-2 text-[11px] font-bold text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Complete
                            </Button>
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
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${poll.status === 'pending' ? 'text-violet-600' : 'text-green-600'
                          }`}>
                          {poll.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No pending question sets available.</p>
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
                          onKeyDown={(e) => e.preventDefault()}
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
                          onKeyDown={(e) => e.preventDefault()}
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
            <div className="w-full space-y-2">
              <Label className="text-sm font-bold text-gray-600">Question Set Name</Label>
              <Input
                placeholder="e.g., Biology Final Exam - Section A"
                value={questionSetName}
                onChange={(e) => {
                  setQuestionSetName(e.target.value);
                  if (creationStatus) setCreationStatus(null);
                }}
                className={`bg-white h-12 text-lg font-bold ${creationStatus?.type === 'error' && !questionSetName.trim() ? 'border-red-500 ring-red-100' : 'border-gray-300'}`}
              />
            </div>

            {creationStatus && (
              <div className={`w-full p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${creationStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                {creationStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
                <p className="font-bold">{creationStatus.message}</p>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <Button
                variant="outline"
                onClick={() => { setStep(1); setIsSetupVisible(true); setCreationStatus(null); }}
                className="px-8 h-12 font-bold border-gray-300"
              >
                Back to Config
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                className="flex-1 h-12 font-bold flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={handleAddToPool}
                className="flex-1 h-12 font-bold bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Add Questions to Pool
              </Button>
              <Button
                onClick={() => {
                  const invalid = draftQuestions.some(q =>
                    !q.questionText.trim() || q.options.some(o => !o.trim()) || !q.correctAnswer.trim() || q.marks === '' || q.timeLimitMinutes === ''
                  );
                  if (invalid) {
                    setCreationStatus({ type: 'error', message: "Please fill all fields before creating a quiz." });
                    return;
                  }

                  sessionStorage.setItem('draft_quiz_params', JSON.stringify({
                    questions: draftQuestions,
                    source: 'question_creator'
                  }));
                  // Force a hard navigation or ensure the parent re-renders if using query params in the same component tree
                  window.location.href = '/teacher?view=create-quiz';
                }}
                className="flex-1 h-12 font-bold bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-white shadow-indigo-200 shadow-lg"
              >
                <Settings2 className="h-4 w-4" />
                Create Quiz Now
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