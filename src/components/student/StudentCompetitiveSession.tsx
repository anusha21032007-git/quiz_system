"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Trophy, ChevronRight, Eye, CheckCircle2, MessageSquare, ArrowLeft, Maximize, AlertCircle, ShieldAlert, Timer, ChevronLeft, Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StudentCompetitiveSessionProps {
    quiz: Quiz;
    studentName: string;
    onExit: () => void;
}

const StudentCompetitiveSession = ({ quiz, studentName, onExit }: StudentCompetitiveSessionProps) => {
    const { getQuestionsForQuiz, submitQuizAttempt } = useQuiz();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [timeTaken, setTimeTaken] = useState(0);

    // Integrity State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenGracePeriod, setFullscreenGracePeriod] = useState(0);
    const [isCorrupted, setIsCorrupted] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [examStatus, setExamStatus] = useState<'RUNNING' | 'PAUSED' | 'CORRUPTED' | 'SUBMITTED'>('RUNNING');

    const containerRef = useRef<HTMLDivElement>(null);
    const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const examTimerRef = useRef<NodeJS.Timeout | null>(null);

    const SESSION_KEY = `competitive_session_${quiz.id}_${studentName}`;

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const q = await getQuestionsForQuiz(quiz.id);
            setQuestions(q);

            // Restore session
            const saved = localStorage.getItem(SESSION_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.isCorrupted || parsed.examStatus === 'CORRUPTED') {
                    setIsCorrupted(true);
                    setIsFinished(true);
                    setExamStatus('CORRUPTED');
                } else {
                    setCurrentIndex(parsed.currentIndex || 0);
                    setSelectedAnswers(parsed.selectedAnswers || {});
                    setViolationCount(parsed.violationCount || 0);
                    setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : (quiz.timeLimitMinutes * 60));
                    setTimeTaken(parsed.timeTaken || 0);
                    setExamStatus(parsed.examStatus || 'RUNNING');
                }
            } else {
                setTimeLeft(quiz.timeLimitMinutes * 60);
                setExamStatus('RUNNING');
            }
            setIsLoading(false);
        };
        init();

        const handlePopState = (e: PopStateEvent) => {
            if (!isFinished && !isCorrupted) {
                window.history.pushState(null, "", window.location.href);
                recordViolation();
                toast.error("Navigation is restricted during exam.");
            }
        };

        window.history.pushState(null, "", window.location.href);
        window.addEventListener('popstate', handlePopState);

        // Add integrity listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleRestrictedAction);
        document.addEventListener('paste', handleRestrictedAction);
        document.addEventListener('selectstart', handleRestrictedAction);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleRestrictedAction);
            document.removeEventListener('paste', handleRestrictedAction);
            document.removeEventListener('selectstart', handleRestrictedAction);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            if (graceTimerRef.current) clearInterval(graceTimerRef.current);
            if (examTimerRef.current) clearInterval(examTimerRef.current);
        };
    }, [quiz.id, studentName, getQuestionsForQuiz, isFinished, isCorrupted]);

    // Save session continuously
    useEffect(() => {
        if (!isLoading && !isFinished) {
            const sessionData = {
                currentIndex,
                selectedAnswers,
                violationCount,
                timeLeft,
                isCorrupted,
                timeTaken,
                examStatus
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        }
    }, [currentIndex, selectedAnswers, violationCount, timeLeft, isCorrupted, timeTaken, isLoading, isFinished, examStatus]);

    useEffect(() => {
        if (!isLoading && !isFinished && isFullscreen && !isCorrupted && examStatus === 'RUNNING') {
            examTimerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (examTimerRef.current) clearInterval(examTimerRef.current);
                        handleFinish(true); // Time over
                        return 0;
                    }
                    return prev - 1;
                });
                setTimeTaken(prev => prev + 1);
            }, 1000);
        } else {
            if (examTimerRef.current) clearInterval(examTimerRef.current);
        }
        return () => { if (examTimerRef.current) clearInterval(examTimerRef.current); };
    }, [isLoading, isFinished, isFullscreen, isCorrupted, examStatus]);

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleRestrictedAction = (e: any) => {
        e.preventDefault();
        toast.error("Copy/Paste disabled in Competitive Mode.");
    };

    const enterFullscreen = async () => {
        try {
            if (containerRef.current) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
                setExamStatus('RUNNING');
                if (graceTimerRef.current) {
                    clearInterval(graceTimerRef.current);
                    graceTimerRef.current = null;
                    setFullscreenGracePeriod(0);
                }
            }
        } catch (err) {
            console.error("Fullscreen request failed", err);
            toast.error("Please allow fullscreen to continue.");
        }
    };

    const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
            setExamStatus('PAUSED');
            if (!isFinished && !isCorrupted) {
                startGracePeriod();
            }
        } else {
            setIsFullscreen(true);
            if (!showTabWarning) setExamStatus('RUNNING');
        }
    };

    const startGracePeriod = () => {
        setFullscreenGracePeriod(10);
        setExamStatus('PAUSED');
        if (graceTimerRef.current) clearInterval(graceTimerRef.current);

        graceTimerRef.current = setInterval(() => {
            setFullscreenGracePeriod(prev => {
                if (prev <= 1) {
                    if (graceTimerRef.current) clearInterval(graceTimerRef.current);
                    handleCorruption("Auto-submitted due to fullscreen exit.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleVisibilityChange = () => {
        if (document.hidden && !isFinished && !isCorrupted && isFullscreen) {
            recordViolation();
        }
    };

    const handleWindowBlur = () => {
        if (!isFinished && !isCorrupted && isFullscreen) {
            setExamStatus('PAUSED');
            recordViolation();
        }
    };

    const handleWindowFocus = () => {
        if (!isFinished && !isCorrupted && isFullscreen && !showTabWarning) {
            setExamStatus('RUNNING');
        }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (!isFinished && !isCorrupted) {
            e.preventDefault();
            e.returnValue = "Leaving will corrupt your exam.";
            return e.returnValue;
        }
    };

    const recordViolation = () => {
        setViolationCount(prev => {
            const nextCount = prev + 1;
            if (nextCount === 1) {
                setShowTabWarning(true);
                setExamStatus('PAUSED');
            } else if (nextCount >= 2) {
                handleCorruption("Auto-submitted due to window/tab switching.");
            }
            return nextCount;
        });
    };

    const handleCorruption = (reason: string) => {
        setIsCorrupted(true);
        setIsFinished(true);
        setExamStatus('CORRUPTED');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // Final save for corrupted state
        const sessionData = { isCorrupted: true, examStatus: 'CORRUPTED' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

        submitQuizAttempt({
            quizId: quiz.id,
            studentName: studentName,
            score: 0,
            totalQuestions: questions.length,
            timeTakenSeconds: timeTaken,
            answers: [],
            correctAnswersCount: 0,
            passed: false,
            violationCount: violationCount + 1,
            status: 'CORRUPTED'
        });
        toast.error(`Exam corrupted: ${reason}`);
    };

    const handleFinish = (isTimeOver = false) => {
        if (isTimeOver) {
            toast.error("Time over. Exam submitted.");
        }

        // Calculate final score
        let finalScore = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctAnswer) {
                finalScore += 1;
            }
        });
        setScore(finalScore);

        setIsFinished(true);
        setExamStatus('SUBMITTED');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        localStorage.removeItem(SESSION_KEY); // Clean up on successful finish

        submitQuizAttempt({
            quizId: quiz.id,
            studentName: studentName,
            score: finalScore,
            totalQuestions: questions.length,
            timeTakenSeconds: timeTaken,
            answers: questions.map((q, idx) => ({
                questionId: q.id,
                selectedAnswer: selectedAnswers[idx] || '',
                isCorrect: selectedAnswers[idx] === q.correctAnswer,
                marksObtained: (selectedAnswers[idx] === q.correctAnswer) ? q.marks : 0
            })),
            correctAnswersCount: finalScore,
            passed: finalScore >= (quiz.requiredCorrectAnswers || 0),
            violationCount: violationCount,
            status: 'SUBMITTED'
        });

        if (!isTimeOver) toast.success("Competitive session submitted!");
    };

    const handleOptionSelect = (option: string) => {
        if (isFinished || isCorrupted) return;
        setSelectedAnswers(prev => ({ ...prev, [currentIndex]: option }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (isCorrupted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <Card className="shadow-2xl border-0 overflow-hidden max-w-2xl w-full bg-white animate-in zoom-in-95">
                    <div className="bg-red-600 p-12 text-white text-center">
                        <ShieldAlert className="h-24 w-24 mx-auto mb-6 animate-bounce" />
                        <h2 className="text-4xl font-extrabold tracking-tight">EXAM CORRUPTED</h2>
                        <div className="mt-4 inline-block px-4 py-1 bg-red-800/50 rounded-full text-xs font-black uppercase tracking-[0.2em]">Rule Violation Detected</div>
                    </div>
                    <CardContent className="p-12 text-center space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-900">Exam invalid due to rule violation.</h3>
                            <p className="text-gray-500 leading-relaxed">This session has been automatically flagged and terminated. Any progress has been discarded as per the integrity policy.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                                <span className="font-bold text-red-600">DISQUALIFIED</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Violations</span>
                                <span className="font-bold text-gray-900">{violationCount} Recorded</span>
                            </div>
                        </div>
                        <Button onClick={onExit} className="w-full py-8 text-xl font-black bg-gray-900 hover:bg-gray-800 rounded-3xl transition-all">
                            Exit to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isFinished) {
        const correctAnswers = score;
        const wrongAnswers = Object.keys(selectedAnswers).length - score;
        const skipped = questions.length - Object.keys(selectedAnswers).length;

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="shadow-2xl border-0 overflow-hidden max-w-3xl w-full bg-white animate-in zoom-in-95 duration-700">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <div className="absolute translate-x-[-50%] translate-y-[-50%] top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                            <div className="absolute translate-x-[50%] translate-y-[50%] bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        </div>
                        <Trophy className="h-20 w-20 mx-auto mb-6 text-yellow-300 relative z-10" />
                        <h2 className="text-4xl font-black tracking-tight relative z-10 uppercase">Session Complete</h2>
                        <div className="mt-4 inline-block px-4 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Status: SUBMITTED</div>
                    </div>
                    <CardContent className="p-12 space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100/50 text-center space-y-1">
                                <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">Score</p>
                                <p className="text-4xl font-black text-purple-900">{score}/{questions.length}</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-[32px] border border-green-100/50 text-center space-y-1">
                                <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Correct</p>
                                <p className="text-4xl font-black text-green-900">{correctAnswers}</p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-[32px] border border-red-100/50 text-center space-y-1">
                                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Wrong</p>
                                <p className="text-4xl font-black text-red-900">{Math.max(0, wrongAnswers)}</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100/50 text-center space-y-1">
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Time</p>
                                <p className="text-3xl font-black text-blue-900">{formatTime(timeTaken)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button onClick={onExit} className="w-full py-8 text-xl font-black bg-gray-900 hover:bg-gray-800 rounded-3xl shadow-xl transition-all active:scale-95">
                                Return to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isFullscreen && fullscreenGracePeriod === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full p-16 text-center space-y-10 rounded-[48px] border-2 border-black/5 bg-white shadow-xl animate-in zoom-in-95">
                    <div className="bg-black w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl rotate-12">
                        <Brain className="h-12 w-12 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Competitive Mode</h2>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-red-600 font-black uppercase text-xs tracking-widest bg-red-50 px-4 py-2 rounded-full border border-red-100">Strict Environment Enabled</p>
                            <p className="text-gray-500 font-bold max-w-sm mt-2">This exam requires Full Screen. Leaving the screen or switching tabs will corrupt your exam.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-black/5 space-y-2">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Time Limit</h4>
                            <p className="font-bold text-gray-900">{quiz.timeLimitMinutes} Minutes</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-black/5 space-y-2">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Total Questions</h4>
                            <p className="font-bold text-gray-900">{questions.length} Items</p>
                        </div>
                    </div>

                    <Button onClick={enterFullscreen} className="w-full py-10 text-2xl font-black bg-black hover:bg-gray-800 text-white rounded-[32px] shadow-2xl hover:shadow-black/20 transition-all active:scale-95">
                        Enter Full Screen & Start
                    </Button>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswer = selectedAnswers[currentIndex] || null;

    if (questions.length === 0 && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-12 text-center space-y-6 rounded-[48px] bg-white shadow-xl">
                    <MessageSquare className="h-16 w-16 text-slate-300 mx-auto" />
                    <h3 className="text-2xl font-black text-gray-900">No Questions Found</h3>
                    <p className="text-gray-500 font-bold">This competitive session doesn't have any questions yet.</p>
                    <Button onClick={onExit} className="w-full py-6 bg-black text-white font-black rounded-2xl">Return to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-white min-h-screen flex flex-col overflow-hidden selection:bg-black selection:text-white">
            {/* Fullscreen Grace Period Modal */}
            {fullscreenGracePeriod > 0 && !isFullscreen && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-12 text-center space-y-8 rounded-[48px] bg-white animate-in zoom-in-95">
                        <XCircle className="h-24 w-24 text-red-600 mx-auto animate-pulse" />
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-gray-900 tracking-tight">ESC NOT ALLOWED</h3>
                            <p className="text-gray-500 font-bold leading-relaxed">Competitive sessions must remain in full-screen. Disqualification in <span className="text-red-600 text-2xl font-black">{fullscreenGracePeriod}s</span>.</p>
                        </div>
                        <Button onClick={enterFullscreen} className="w-full py-8 bg-red-600 hover:bg-red-700 text-white font-black text-xl rounded-3xl">
                            Resume Session
                        </Button>
                    </Card>
                </div>
            )}

            {/* Tab Switching Warning */}
            {showTabWarning && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-12 text-center space-y-10 rounded-[48px] bg-white animate-in slide-in-from-top-12 duration-500">
                        <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="h-12 w-12 text-orange-600" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black tracking-tight text-gray-900">WINDOW SWITCHED!</h3>
                            <p className="text-gray-500 font-bold">First warning: Do not leave the exam screen. One more violation will result in immediate disqualification.</p>
                        </div>
                        <div className="space-y-4">
                            <Button onClick={() => { setShowTabWarning(false); setExamStatus('RUNNING'); }} className="w-full py-8 bg-black text-white font-black text-xl rounded-3xl transition-all active:scale-95 shadow-xl">
                                Re-enter Exam
                            </Button>
                            <Button onClick={() => handleFinish()} variant="ghost" className="w-full text-slate-400 font-black uppercase tracking-tighter text-sm hover:text-red-600">
                                Submit and Exit Now
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Header / Nav Area (Internal only) */}
            <div className="p-8 md:px-16 flex items-center justify-between border-b-2 border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-6">
                    <div className="bg-black p-3 rounded-2xl shadow-lg">
                        <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="hidden md:block">
                        <h2 className="font-black text-2xl tracking-tighter text-black uppercase">{quiz.title}</h2>
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">{studentName} • Competitive Mode</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 border-2 border-black/5 rounded-2xl">
                        <div className={cn("w-2 h-2 rounded-full", isFullscreen ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Full Screen: {isFullscreen ? "ON" : "OFF"}
                        </span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 border-2 border-black/5 rounded-2xl">
                        <div className={cn("w-2 h-2 rounded-full", isCorrupted ? "bg-red-500" : "bg-green-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Integrity: {isCorrupted ? "CORRUPTED" : "OK"}
                        </span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-black text-xl tracking-tight transition-all",
                        timeLeft < 60 ? "bg-red-50 border-red-600 text-red-600 animate-pulse" : "bg-slate-50 border-black/5 text-slate-900"
                    )}>
                        <Timer className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                    {violationCount > 0 && (
                        <div className="bg-orange-50 text-orange-600 border-2 border-orange-100 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hidden sm:block">
                            Strikes: {violationCount}/2
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-50 relative">
                <div
                    className="absolute top-0 left-0 h-full bg-black transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <main className="flex-1 overflow-y-auto px-6 py-12 md:px-16 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Question {currentIndex + 1} of {questions.length}
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black text-black leading-[1.1] tracking-tight">
                            {currentQuestion?.questionText}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQuestion?.options && currentQuestion.options.filter(o => o.trim() !== "").length > 0 ? (
                            currentQuestion.options.map((option, idx) => {
                                const isSelected = currentAnswer === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        className={cn(
                                            "w-full flex items-center gap-6 p-8 border-4 transition-all duration-300 rounded-[32px] text-left group relative overflow-hidden",
                                            isSelected
                                                ? "bg-black border-black text-white shadow-2xl scale-[1.02]"
                                                : "bg-white border-black/5 hover:border-black/20 text-slate-600 hover:scale-[1.01]"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                                <CheckCircle2 className="h-12 w-12" />
                                            </div>
                                        )}
                                        <span className={cn(
                                            "flex-shrink-0 w-12 h-12 rounded-2xl border-4 flex items-center justify-center text-xl font-black transition-colors",
                                            isSelected ? "bg-white text-black border-white" : "border-black/5 group-hover:border-black/10 group-hover:bg-black/5"
                                        )}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-xl md:text-2xl font-bold tracking-tight">{option}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="space-y-6">
                                <div className="p-8 bg-purple-50 rounded-[32px] border-2 border-purple-100 flex gap-4">
                                    <MessageSquare className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                                    <div className="space-y-2">
                                        <h4 className="font-black text-purple-900 uppercase text-xs tracking-widest">Self-Evaluation / Note</h4>
                                        <p className="text-purple-700 font-medium">This is an open-ended question. Reflect on your answer then proceed.</p>
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Type your response here for self-reflection..."
                                    className="min-h-[200px] rounded-[32px] border-4 border-slate-50 p-8 text-xl font-medium focus:border-black transition-all"
                                    value={currentAnswer || ""}
                                    onChange={(e) => handleOptionSelect(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="p-8 md:px-16 border-t-2 border-slate-50 bg-white">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="h-16 px-8 bg-white border-4 border-black/5 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 hover:border-black active:translate-y-1 transition-all flex items-center gap-3 disabled:opacity-0"
                    >
                        <ChevronLeft className="h-5 w-5" /> Previous
                    </Button>

                    <div className="flex-1 flex justify-center">
                        {currentIndex === questions.length - 1 ? (
                            <Button
                                onClick={() => handleFinish()}
                                className="h-20 px-16 bg-green-600 hover:bg-green-700 text-white font-black rounded-[32px] text-xl shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center gap-3 active:translate-y-1"
                            >
                                <Send className="h-6 w-6" /> Submit Exam
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentIndex(prev => prev + 1)}
                                className="h-20 px-16 bg-black hover:bg-slate-800 text-white font-black rounded-[32px] text-xl shadow-2xl transition-all active:scale-95 flex items-center gap-3 active:translate-y-1"
                            >
                                Next Question <ChevronRight className="h-6 w-6" />
                            </Button>
                        )}
                    </div>

                    <div className="w-[120px] text-right hidden md:block">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Saving...</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StudentCompetitiveSession;
