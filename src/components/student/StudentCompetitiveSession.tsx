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
        // Strict check: if document becomes hidden, it is ALWAYS a violation in competitive mode
        if (document.hidden && !isFinished && !isCorrupted) {
            recordViolation();
        }
    };

    const handleWindowBlur = () => {
        // Strict check: losing focus is a violation
        if (!isFinished && !isCorrupted && !showTabWarning) {
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
                handleCorruption("Auto-submitted due to window/tab switching violation.");
            }
            return nextCount;
        });
    };

    // Advanced Integrity: Block Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isFinished || isCorrupted) return;

            // Block common cheating keys
            if (
                e.key === 'Alt' ||
                e.key === 'Tab' ||
                e.key === 'Meta' ||
                e.key === 'PrintScreen' ||
                e.key === 'F12' ||
                (e.ctrlKey && e.key === 'c') || // Copy
                (e.ctrlKey && e.key === 'v') || // Paste
                (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) // DevTools
            ) {
                e.preventDefault();
                toast.warning("Keyboard shortcut blocked for exam integrity.");
                // Record violation if they persist? Maybe too strict for accidental press.
                // But preventing default is key.
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished, isCorrupted]);

    const handleCorruption = (reason: string) => {
        setIsCorrupted(true);
        setIsFinished(true);
        setExamStatus('CORRUPTED');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
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
            // 'passed' is calculated by backend/context
            violationCount: violationCount + 1,
            status: 'CORRUPTED'
        });
        toast.error(`Exam corrupted: ${reason}`);
    };

    const handleFinish = (isTimeOver = false) => {
        if (isTimeOver) {
            toast.error("Time over. Exam submitted.");
        }

        // Calculate final score with robust string comparison
        let finalScore = 0;
        questions.forEach((q, idx) => {
            const studentAns = selectedAnswers[idx] || "";
            const correctAns = q.correctAnswer || "";

            // Trim and normalize for comparison
            if (studentAns.trim() === correctAns.trim()) {
                finalScore += 1;
            }
        });
        setScore(finalScore);

        setIsFinished(true);
        setExamStatus('SUBMITTED');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
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
                isCorrect: (selectedAnswers[idx] || "").trim() === (q.correctAnswer || "").trim(),
                marksObtained: ((selectedAnswers[idx] || "").trim() === (q.correctAnswer || "").trim()) ? q.marks : 0
            })),
            correctAnswersCount: finalScore,
            // 'passed' is calculated by backend/context
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

    const currentQuestion = questions[currentIndex];
    const currentAnswer = selectedAnswers[currentIndex] || null;

    // --- RENDER LOGIC ---

    // We wrap EVERYTHING in the containerRef to ensure requestFullscreen works
    // regardless of which "view" state we are in.
    return (
        <div ref={containerRef} className="min-h-screen flex flex-col overflow-hidden selection:bg-[#6C8BFF]/30 selection:text-[#1E2455] relative bg-transparent font-poppins">
            <div className="absolute inset-0 bg-[#F8FAFF] -z-20" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[160px] opacity-60 -z-10" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#E38AD6]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[160px] opacity-60 -z-10" />

            {/* 1. LOADING STATE */}
            {isLoading && (
                <div className="flex items-center justify-center flex-1 h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            )}

            {/* 2. CORRUPTED STATE */}
            {!isLoading && isCorrupted && (
                <div className="flex-1 flex items-center justify-center p-8 backdrop-blur-[2px]">
                    <Card className="glass-card shadow-2xl border-white/50 overflow-hidden max-w-2xl w-full bg-white/60 animate-in zoom-in-95 duration-1000">
                        <div className="bg-[#FF6B8A] p-16 text-white text-center shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                            <ShieldAlert className="h-32 w-32 mx-auto mb-8 animate-bounce" />
                            <h2 className="text-5xl font-black tracking-tighter uppercase font-poppins">EXAM CORRUPTED</h2>
                            <div className="mt-6 inline-block px-6 py-2 bg-black/20 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-inner backdrop-blur-md">INTEGRITY BREACH DETECTED</div>
                        </div>
                        <CardContent className="p-16 text-center space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-[#1E2455] uppercase tracking-tight">Session invalidated by protocol.</h3>
                                <p className="text-[#3A3F6B] font-bold italic leading-relaxed opacity-70">This instance has been automatically flagged and terminated as per the strict merit preservation policy.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-8 bg-white/60 rounded-[32px] border border-white/60 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] mb-2">Outcome</span>
                                    <span className="font-black text-[#FF6B8A] text-lg tracking-tighter">DISQUALIFIED</span>
                                </div>
                                <div className="p-8 bg-white/60 rounded-[32px] border border-white/60 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] mb-2">Violations</span>
                                    <span className="font-black text-[#1E2455] text-lg tracking-tighter">{violationCount} INDEXED</span>
                                </div>
                            </div>
                            <Button onClick={onExit} className="pastel-button-primary w-full h-20 text-xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                                EXIT TO CONSOLE
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 3. FINISHED STATE */}
            {!isLoading && !isCorrupted && isFinished && (
                <div className="flex-1 flex items-center justify-center p-8 backdrop-blur-[2px]">
                    <Card className="glass-card shadow-2xl border-white/50 overflow-hidden max-w-3xl w-full bg-white/60 animate-in zoom-in-95 duration-1000">
                        <div className="bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] p-16 text-white text-center relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                <div className="absolute translate-x-[-50%] translate-y-[-50%] top-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute translate-x-[50%] translate-y-[50%] bottom-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                            </div>
                            <Trophy className="h-28 w-28 mx-auto mb-8 text-[#FFB86C] relative z-10 animate-pulse" />
                            <h2 className="text-6xl font-black tracking-tighter relative z-10 uppercase font-poppins">SESSION COMPLETE</h2>
                            <div className="mt-6 inline-block px-6 py-2 bg-black/20 rounded-full text-[11px] font-black uppercase tracking-[0.4em] relative z-10 shadow-inner backdrop-blur-md">STATUS: SUBMITTED</div>
                        </div>
                        <CardContent className="p-16 space-y-16">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="bg-[#6C8BFF]/5 p-8 rounded-[40px] border border-[#6C8BFF]/20 text-center space-y-2 group hover:bg-[#6C8BFF]/10 transition-all duration-500">
                                    <p className="text-[11px] text-[#6C8BFF] font-black uppercase tracking-[0.3em]">SCORE</p>
                                    <p className="text-5xl font-black text-[#1E2455] tracking-tighter group-hover:scale-110 transition-transform">{score}/{questions.length}</p>
                                </div>
                                <div className="bg-[#4EE3B2]/5 p-8 rounded-[40px] border border-[#4EE3B2]/20 text-center space-y-2 group hover:bg-[#4EE3B2]/10 transition-all duration-500">
                                    <p className="text-[11px] text-[#4EE3B2] font-black uppercase tracking-[0.3em]">CORRECT</p>
                                    <p className="text-5xl font-black text-[#1E2455] tracking-tighter group-hover:scale-110 transition-transform">{(questions.filter((q, i) => (selectedAnswers[i] || "").trim() === (q.correctAnswer || "").trim()).length)}</p>
                                </div>
                                <div className="bg-[#FF6B8A]/5 p-8 rounded-[40px] border border-[#FF6B8A]/20 text-center space-y-2 group hover:bg-[#FF6B8A]/10 transition-all duration-500">
                                    <p className="text-[11px] text-[#FF6B8A] font-black uppercase tracking-[0.3em]">WRONG</p>
                                    <p className="text-5xl font-black text-[#1E2455] tracking-tighter group-hover:scale-110 transition-transform">{Math.max(0, questions.length - (questions.filter((q, i) => (selectedAnswers[i] || "").trim() === (q.correctAnswer || "").trim()).length))}</p>
                                </div>
                                <div className="bg-[#7A80B8]/5 p-8 rounded-[40px] border border-[#7A80B8]/20 text-center space-y-2 group hover:bg-[#7A80B8]/10 transition-all duration-500">
                                    <p className="text-[11px] text-[#7A80B8] font-black uppercase tracking-[0.3em]">ELAPSED</p>
                                    <p className="text-4xl font-black text-[#1E2455] tracking-tighter group-hover:scale-110 transition-transform">{formatTime(timeTaken)}</p>
                                </div>
                            </div>

                            <Button onClick={onExit} className="pastel-button-primary w-full h-24 text-2xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                                RETURN TO CONSOLE
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 4. LANDING / START SCREEN */}
            {!isLoading && !isCorrupted && !isFinished && !isFullscreen && fullscreenGracePeriod === 0 && (
                <div className="flex-1 flex items-center justify-center p-8 backdrop-blur-[2px]">
                    <Card className="max-w-3xl w-full p-20 text-center space-y-12 glass-card border-white/50 bg-white/60 shadow-2xl animate-in zoom-in-95 duration-1000 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-60" />
                        <div className="w-32 h-32 bg-gradient-to-br from-[#1E2455] to-[#3A3F6B] rounded-[40px] flex items-center justify-center mx-auto shadow-2xl rotate-6 group-hover:rotate-12 transition-transform duration-700">
                            <Brain className="h-16 w-16 text-white" />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-6xl font-black text-[#1E2455] tracking-tighter uppercase font-poppins">COMPETITIVE MODE</h2>
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-[#FF6B8A] font-black uppercase text-[11px] tracking-[0.4em] bg-[#FF6B8A]/10 px-6 py-2.5 rounded-full border border-[#FF6B8A]/20 shadow-sm">STRICT ENVIRONMENT ENABLED</p>
                                <p className="text-[#3A3F6B] font-bold italic max-w-sm mt-4 leading-relaxed opacity-70">"This evaluation protocols require full sensory focus. Departing the interface or switching channels will invalidate your results."</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="p-8 bg-white/60 rounded-[32px] border border-white/60 space-y-2 shadow-sm">
                                <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-[#7A80B8]">TEMPORAL BOUNDARY</h4>
                                <p className="font-black text-2xl text-[#1E2455] tracking-tight">{quiz.timeLimitMinutes} MINUTES</p>
                            </div>
                            <div className="p-8 bg-white/60 rounded-[32px] border border-white/60 space-y-2 shadow-sm">
                                <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-[#7A80B8]">MODULE VOLUME</h4>
                                <p className="font-black text-2xl text-[#1E2455] tracking-tight">{questions.length} SIMULATION UNITS</p>
                            </div>
                        </div>

                        <Button onClick={enterFullscreen} className="pastel-button-primary w-full h-24 text-2xl font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                            INITIALIZE PROTOCOL
                        </Button>
                    </Card>
                </div>
            )}

            {/* 5. ACTIVE QUIZ UI */}
            {!isLoading && !isCorrupted && !isFinished && (isFullscreen || fullscreenGracePeriod > 0) && (
                <>
                    {/* Fullscreen Grace Warning */}
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

                    {/* Tab Switch Warning */}
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

                    {/* QUIZ HEADER */}
                    <div className="p-10 md:px-20 flex items-center justify-between border-b border-white/40 bg-white/40 backdrop-blur-3xl z-50 shadow-xl">
                        <div className="flex items-center gap-8">
                            <div className="bg-gradient-to-br from-[#1E2455] to-[#3A3F6B] p-4 rounded-2xl shadow-2xl border border-white/20">
                                <Brain className="h-7 w-7 text-white" />
                            </div>
                            <div className="hidden md:block">
                                <h2 className="font-black text-3xl tracking-tighter text-[#1E2455] uppercase font-poppins">{quiz.title}</h2>
                                <p className="text-[11px] font-black text-[#7A80B8] tracking-[0.4em] uppercase opacity-70">{studentName} • VALIDATED CONSOLE</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-white/60 border border-white/60 rounded-2xl shadow-sm">
                                <div className={cn("w-2.5 h-2.5 rounded-full", isFullscreen ? "bg-[#4EE3B2] shadow-[0_0_10px_rgba(78,227,178,0.5)] animate-pulse" : "bg-[#FF6B8A] shadow-[0_0_10px_rgba(255,107,138,0.5)]")} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A80B8]">
                                    SECURE MODE: {isFullscreen ? "OPTIMAL" : "BREACHED"}
                                </span>
                            </div>
                            <div className={cn(
                                "flex items-center gap-4 px-8 py-4 rounded-2xl border-2 font-black text-2xl tracking-tighter transition-all shadow-xl backdrop-blur-md",
                                timeLeft < 60 ? "bg-[#FF6B8A]/10 border-[#FF6B8A] text-[#FF6B8A] animate-pulse shadow-[#FF6B8A]/10" : "bg-white/60 border-white/60 text-[#1E2455]"
                            )}>
                                <Timer className="h-6 w-6" />
                                {formatTime(timeLeft)}
                            </div>
                            {violationCount > 0 && (
                                <div className="bg-[#FF6B8A]/10 text-[#FF6B8A] border-2 border-[#FF6B8A]/20 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hidden sm:block shadow-sm">
                                    STRIKES: {violationCount}/2
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="w-full h-2.5 bg-white/30 relative">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] transition-all duration-1000 ease-out shadow-lg"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 overflow-y-auto px-10 py-20 md:px-20 scroll-smooth relative">
                        <div className="max-w-4xl mx-auto space-y-16">
                            {questions.length === 0 ? (
                                <div className="text-center py-32 glass-card rounded-[40px] border-dashed border-2 border-white/40">
                                    <h3 className="text-3xl font-black text-[#1E2455] uppercase tracking-tighter">NO MODULE DATA INDEXED</h3>
                                    <p className="text-[#7A80B8] font-bold italic mt-4">Please contact judicial oversight.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-8">
                                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/60 border border-white/60 text-[11px] font-black uppercase tracking-[0.4em] text-[#6C8BFF] shadow-sm">
                                            SIMULATION UNIT {currentIndex + 1} OF {questions.length}
                                        </div>
                                        <h3 className="text-4xl md:text-6xl font-black text-[#1E2455] leading-[1.05] tracking-tighter font-poppins">
                                            {currentQuestion?.questionText}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {currentQuestion?.options && currentQuestion.options.filter(o => o.trim() !== "").length > 0 ? (
                                            currentQuestion.options.map((option, idx) => {
                                                const isSelected = currentAnswer === option;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleOptionSelect(option)}
                                                        className={cn(
                                                            "w-full flex items-center gap-8 p-10 border border-white/60 transition-all duration-500 rounded-[40px] text-left group relative overflow-hidden shadow-sm",
                                                            isSelected
                                                                ? "bg-white/80 border-[#6C8BFF]/50 shadow-2xl scale-[1.02] -translate-y-1"
                                                                : "bg-white/40 border-white/40 hover:border-white/80 text-[#3A3F6B] hover:scale-[1.01] hover:bg-white/50"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-0 right-0 p-8 text-[#6C8BFF] opacity-10">
                                                                <CheckCircle2 className="h-24 w-24" />
                                                            </div>
                                                        )}
                                                        <span className={cn(
                                                            "flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all duration-500",
                                                            isSelected ? "bg-[#6C8BFF] text-white border-[#6C8BFF] shadow-lg shadow-[#6C8BFF]/20 rotate-3" : "border-white/80 bg-white/80 text-[#7A80B8] group-hover:border-[#6C8BFF]/40 group-hover:text-[#6C8BFF]"
                                                        )}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </span>
                                                        <span className={cn("text-2xl md:text-3xl font-bold tracking-tight transition-all duration-500", isSelected ? "text-[#1E2455]" : "text-[#3A3F6B]/70 group-hover:text-[#1E2455]")}>{option}</span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="p-10 bg-white/60 rounded-[40px] border border-white/60 flex gap-6 shadow-sm">
                                                    <MessageSquare className="h-8 w-8 text-[#6C8BFF] flex-shrink-0 mt-1" />
                                                    <div className="space-y-2">
                                                        <h4 className="font-black text-[#1E2455] uppercase text-[11px] tracking-[0.4em]">QUALITATIVE REFLECTION</h4>
                                                        <p className="text-[#3A3F6B] font-bold italic text-lg leading-relaxed opacity-70">"This unit requires intensive self-curated analysis. Reify your findings below."</p>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    placeholder="Synthesize your comprehensive response here..."
                                                    className="min-h-[300px] rounded-[40px] border border-white/60 bg-white/40 p-10 text-xl font-bold italic text-[#1E2455] focus:bg-white/80 transition-all shadow-inner placeholder-[#7A80B8]/40"
                                                    value={currentAnswer || ""}
                                                    onChange={(e) => handleOptionSelect(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </main>

                    {/* FOOTER */}
                    <footer className="p-10 md:px-20 border-t border-white/40 bg-white/40 backdrop-blur-3xl">
                        <div className="max-w-4xl mx-auto flex items-center justify-between gap-10">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                className="h-20 px-10 bg-white/60 border border-white/60 rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/80 hover:border-[#6C8BFF]/40 text-[#7A80B8] hover:text-[#1E2455] active:translate-y-1 transition-all flex items-center gap-4 disabled:opacity-0 shadow-sm"
                            >
                                <ChevronLeft className="h-6 w-6" /> RETROGRADE
                            </Button>

                            <div className="flex-1 flex justify-center">
                                {currentIndex === questions.length - 1 ? (
                                    <Button
                                        onClick={() => handleFinish()}
                                        className="h-24 px-20 bg-gradient-to-r from-[#4EE3B2] to-[#3AC79C] hover:scale-105 text-white font-black rounded-[40px] text-2xl shadow-2xl shadow-[#4EE3B2]/20 transition-all active:scale-95 flex items-center gap-4 active:translate-y-1"
                                    >
                                        <Send className="h-7 w-7" /> FINAL SUBMISSION
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => setCurrentIndex(prev => prev + 1)}
                                        className="h-24 px-20 bg-gradient-to-r from-[#1E2455] to-[#3A3F6B] text-white font-black rounded-[40px] text-2xl shadow-2xl shadow-black/20 transition-all active:scale-105 flex items-center gap-4 active:translate-y-1"
                                    >
                                        NEXT UNIT <ChevronRight className="h-7 w-7" />
                                    </Button>
                                )}
                            </div>

                            <div className="w-[150px] text-right hidden lg:block">
                                <span className="text-[11px] font-black text-[#6C8BFF] uppercase tracking-[0.4em] animate-pulse">SYNCING...</span>
                            </div>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
};

export default StudentCompetitiveSession;
