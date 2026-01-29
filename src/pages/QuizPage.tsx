"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question as LocalQuestionType } from '@/context/QuizContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Loader2, Trophy, RefreshCw, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuizHeader from '@/components/quiz/QuizHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { studentData, user } = useAuth();
  const { getQuizById, submitQuizAttempt, getQuestionsForQuiz, quizAttempts } = useQuiz();

  const quiz = quizId ? getQuizById(quizId) : undefined;
  const isMobile = useIsMobile();

  const { studentName: navigationStudentName } = (location.state || {}) as { studentName?: string };
  const initialStudentName = navigationStudentName || studentData?.name || user?.email || 'Guest';

  const [questions, setQuestions] = useState<LocalQuestionType[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Removed separate selectedAnswer state, deriving it from answers array instead
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; }[]>([]);

  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(initialStudentName);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed properties
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswerEntry = currentQuestion ? answers.find(a => a.questionId === currentQuestion.id) : null;
  const currentSelectedOption = currentAnswerEntry?.selectedAnswer || null;

  useEffect(() => {
    if (studentData?.name && (!quizStudentName || quizStudentName === 'Guest' || quizStudentName === user?.email)) {
      setQuizStudentName(studentData.name);
    }
  }, [studentData, user?.email, quizStudentName]);

  const studentAttempts = useMemo(() => {
    if (!quizStudentName || quizStudentName === 'Guest') return [];
    return quizAttempts
      .filter(a => a.quizId === quizId && a.studentName === quizStudentName)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [quizAttempts, quizId, quizStudentName]);

  const attemptsCount = studentAttempts.length;
  const maxAttempts = quiz?.maxAttempts || 1;
  const isMaxAttemptsReached = attemptsCount >= maxAttempts;

  const attemptToShow = useMemo(() => {
    const submittedAttempt = studentAttempts.find(a => a.status === 'SUBMITTED');
    if (submittedAttempt) return submittedAttempt;
    if (isMaxAttemptsReached && studentAttempts.length > 0) {
      return studentAttempts[0];
    }
    return undefined;
  }, [studentAttempts, isMaxAttemptsReached]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!quizId) return;

      if (attemptToShow || isMaxAttemptsReached) {
        setIsQuestionsLoading(false);
        setShowResults(true);
        return;
      }

      setIsQuestionsLoading(true);
      try {
        const allQuestions = await getQuestionsForQuiz(quizId);
        const targetCount = quiz?.totalQuestions || 5;
        // Use a consistent seed or storage to prevent re-shuffling on reload if possible,
        // but for now, we just load them. Ideally, we should check if there's an active incomplete attempt.
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, Math.min(targetCount, allQuestions.length));

        setQuestions(selectedQuestions);
        if (selectedQuestions.length > 0) {
          // Calculate total efficiency? Or just sum of limits?
          // Actually quiz object has timeLimitMinutes which is global for the quiz usually, but here we see per-question limits being summed or used.
          // Let's use the quiz global limit if available, else sum of questions.
          const totalTime = quiz?.timeLimitMinutes || selectedQuestions.reduce((acc, q) => acc + q.timeLimitMinutes, 0);
          setTimeLeft(Math.floor(totalTime * 60));
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
        toast.error("Failed to load quiz questions.");
        setQuestions([]);
      } finally {
        setIsQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, [quizId, getQuestionsForQuiz, quiz?.totalQuestions, isMaxAttemptsReached, attemptToShow]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (showResults || questions.length === 0 || isMaxAttemptsReached || attemptToShow) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length, showResults, isMaxAttemptsReached, attemptToShow]);

  const calculateMarksForQuestion = (question: LocalQuestionType, selected: string) => {
    const isCorrect = selected.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      return question.marks;
    } else if (quiz?.negativeMarking) {
      const deduction = quiz.negativeMarksValue > 0
        ? quiz.negativeMarksValue
        : 0.25 * question.marks;
      return -deduction;
    }
    return 0;
  };

  const handleSelectAnswer = (option: string) => {
    if (showResults) return;

    setAnswers((prev) => {
      const existingIdx = prev.findIndex(a => a.questionId === currentQuestion.id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], selectedAnswer: option };
        return updated;
      }
      return [...prev, { questionId: currentQuestion.id, selectedAnswer: option }];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = (isAutoSubmit: boolean = false) => {
    if (!quizStudentName || quizStudentName.trim() === '' || quizStudentName === 'Guest') {
      toast.error("Please enter your name to submit your results.");
      return;
    }

    // Process answers for scoring
    const processedAnswers = questions.map(q => {
      const answerEntry = answers.find(a => a.questionId === q.id);
      const selected = answerEntry?.selectedAnswer || '';
      const isCorrect = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      const marksObtained = selected ? calculateMarksForQuestion(q, selected) : 0;

      return {
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect: isCorrect,
        marksObtained: marksObtained
      };
    });

    const totalScore = processedAnswers.reduce((sum, ans) => sum + ans.marksObtained, 0);
    const correctAnswersCount = processedAnswers.filter(ans => ans.isCorrect).length;

    submitQuizAttempt({
      quizId: quiz!.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      correctAnswersCount,
      answers: processedAnswers,
      timeTakenSeconds: (quiz?.timeLimitMinutes || 0) * 60 - timeLeft, // Approx time taken
      status: 'SUBMITTED',
      violationCount: 0,
    });

    if (timerRef.current) clearInterval(timerRef.current);

    setShowResults(true);
    if (isAutoSubmit) {
      toast.info("Time's up! Your quiz has been automatically submitted.");
    } else {
      toast.success("Quiz submitted successfully!");
    }
  };

  const handleBack = () => {
    if (!showResults && !isMaxAttemptsReached) {
      const confirmed = window.confirm("Are you sure you want to leave? Your progress will be lost.");
      if (confirmed) {
        navigate('/student');
      }
    } else {
      navigate('/student');
    }
  };

  // Reuse renderResults from original code or simplified version
  const renderResults = (attempt: any) => {
    const finalScore = attempt.score;
    const totalPossibleMarks = (questions.length > 0 ? questions : (attempt.answers || []))
      .reduce((sum: number, q: any) => sum + (q.marks || 0), 0) || attempt.totalMarksPossible || 0;
    const scorePercentage = totalPossibleMarks > 0 ? (finalScore / totalPossibleMarks) * 100 : 0;
    const isPassed = attempt.passed ?? (scorePercentage >= (quiz?.passPercentage || 0));

    const attemptsForQuiz = quizAttempts.filter(a => a.quizId === quiz?.id);
    const sortedScores = [...attemptsForQuiz].sort((a, b) => b.score - a.score);
    const rank = sortedScores.findIndex(s => s.id === attempt.id) + 1;
    const totalParticipants = attemptsForQuiz.length;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-6 font-poppins relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[140px] opacity-40 -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E38AD6]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[140px] opacity-40 -z-10" />

        <Card className="glass-card w-full max-w-2xl border-white/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
          <CardHeader className="text-center pb-8 pt-12 border-b border-white/30 bg-white/20">
            <CardTitle className={cn("text-5xl font-black uppercase tracking-tighter mb-2", isPassed ? "text-[#4EE3B2]" : "text-[#FF6B8A]")}>
              {isPassed ? "SIMULATION COMPLETE" : "ATTEMPT EVALUATED"}
            </CardTitle>
            <div className="h-1.5 w-32 bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] rounded-full mx-auto mt-4" />
          </CardHeader>
          <CardContent className="text-center space-y-12 px-10 pb-12 pt-10">
            <p className="text-xl text-[#3A3F6B] font-bold italic opacity-80">Distinguished Scholars, <span className="text-[#1E2455] not-italic font-black uppercase tracking-tight">{quizStudentName}</span> achievements indexed.</p>

            <div className="py-14 px-10 rounded-[40px] bg-white/40 border-2 border-white/60 shadow-glass relative overflow-hidden group hover:shadow-glass-hover transition-all duration-700 transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#6C8BFF]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/20 transition-all duration-1000" />
              <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] mb-6">VALIDATED OUTCOME</p>
              <div className={cn("text-8xl font-black mb-6 tracking-tighter", isPassed ? "text-[#4EE3B2]" : "text-[#FF6B8A]")}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-[#FFB86C]/10 rounded-xl shadow-sm">
                  <Trophy className="h-8 w-8 text-[#FFB86C]" />
                </div>
                <p className="text-4xl font-black text-[#1E2455] tracking-tighter">SCORE: {finalScore.toFixed(0)} <span className="text-[#7A80B8] text-2xl font-bold">/ {totalPossibleMarks}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 py-10 border-y border-[#7A80B8]/10">
              <div className="text-center group">
                <p className="text-[10px] text-[#7A80B8] font-black uppercase tracking-[0.2em] mb-3">GLOBAL RANKING</p>
                <p className="text-6xl font-black text-[#6C8BFF] tracking-tighter transform group-hover:scale-110 transition-transform">#{rank || '-'}</p>
              </div>
              <div className="text-center border-l border-[#7A80B8]/10 group">
                <p className="text-[10px] text-[#7A80B8] font-black uppercase tracking-[0.2em] mb-3">INDEXED CANDIDATES</p>
                <p className="text-6xl font-black text-[#1E2455] tracking-tighter transform group-hover:scale-110 transition-transform">{totalParticipants}</p>
              </div>
            </div>

            <div className="mt-12 text-left">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A80B8] mb-10 flex items-center gap-3 pl-2">
                <div className="w-2 h-2 bg-[#4EE3B2] rounded-full animate-pulse" /> PERFORMANCE ANALYTICS
              </h3>
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 CustomScrollbar">
                {(attempt.answers || []).map((ans: any, index: number) => {
                  const q = questions.find(question => question.id === ans.questionId);
                  if (!q) return null;
                  return (
                    <div key={ans.questionId} className="p-8 rounded-[32px] bg-white/40 border border-white/60 shadow-sm transition-all duration-300 hover:border-[#6C8BFF]/40 hover:-translate-x-1">
                      <div className="flex justify-between items-start gap-6 mb-6">
                        <p className="font-black text-[#1E2455] leading-tight text-xl tracking-tight"><span className="text-[#6C8BFF] opacity-50 mr-2">Q{index + 1}.</span> {q.questionText}</p>
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shrink-0 border shadow-sm",
                          ans.isCorrect ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 shadow-[#4EE3B2]/5" : "bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20 shadow-[#FF6B8A]/5"
                        )}>
                          {ans.isCorrect ? "VALIDATED" : "INACCURATE"}
                        </span>
                      </div>

                      <div className="grid gap-3 mb-6">
                        {q.options.map((opt, i) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                          const isSelected = opt === ans.selectedAnswer;

                          return (
                            <div key={i} className={cn(
                              "text-sm p-4 rounded-2xl border transition-all font-bold",
                              isCorrect
                                ? "bg-[#4EE3B2]/10 border-[#4EE3B2]/30 text-[#4EE3B2] shadow-sm"
                                : isSelected
                                  ? "bg-[#FF6B8A]/10 border-[#FF6B8A]/30 text-[#FF6B8A] shadow-sm"
                                  : "bg-white/40 border-white/60 text-[#7A80B8] opacity-60"
                            )}>
                              <span className="text-[10px] opacity-40 mr-2 font-black">{String.fromCharCode(65 + i)}</span> {opt}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-6 text-sm font-bold italic text-[#3A3F6B] bg-white/60 p-5 rounded-2xl border border-white/70 leading-relaxed shadow-inner">
                          <span className="not-italic font-black text-[#6C8BFF] uppercase tracking-[0.2em] text-[10px] block mb-2">SYNTHETIC RATIONALE:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-6 py-10 border-t border-white/30 bg-white/20">
            <Button onClick={() => navigate('/student')} className="pastel-button-primary h-14 px-10 text-[10px] tracking-[0.2em] shadow-lg">
              SYNC DASHBOARD
            </Button>
            {!isPassed && (quiz?.maxAttempts === undefined || quiz.maxAttempts > attemptsCount) && (
              <Button onClick={() => navigate(0)} variant="outline" className="h-14 px-10 rounded-2xl border-white/60 bg-white/40 backdrop-blur-md hover:bg-white/60 text-[#1E2455] text-[10px] font-black tracking-[0.2em] transition-all shadow-md">
                <RefreshCw className="h-4 w-4 mr-3 text-[#6C8BFF]" /> RE-INITIALIZE
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (!quizId || !quiz || isQuestionsLoading || (user && !studentData && user.email && user.email.includes('@student.eduflow.com'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent font-poppins">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-[#6C8BFF] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-full animate-pulse shadow-md" />
            </div>
          </div>
          <p className="text-[#7A80B8] font-black uppercase tracking-[0.5em] text-[9px] animate-pulse">Initializing Neural Environment</p>
        </div>
      </div>
    );
  }

  if (showResults || isMaxAttemptsReached || attemptToShow) {
    return renderResults(attemptToShow || { score: 0, answers, studentName: quizStudentName, status: 'SUBMITTED', id: 'current' });
  }

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-transparent text-[#7A80B8] font-black uppercase tracking-[0.4em] text-xs">NO MODULE DATA INDEXED</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-poppins relative">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] -z-10" />
      <QuizHeader quizTitle={quiz.title} currentQuestionIndex={currentQuestionIndex} totalQuestions={questions.length} timeLeft={timeLeft} isMobile={isMobile} onBack={handleBack} />

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C8BFF]/5 rounded-full blur-[120px] -z-10 animate-pulse" />

        <Card className="glass-card w-full max-w-2xl border-white/50 shadow-2xl overflow-hidden transform hover:translate-y-[-2px] transition-all duration-700">
          <CardHeader className="bg-white/30 px-10 py-8 border-b border-white/40 flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-full bg-white/40 border border-white/60 text-[#6C8BFF] text-[9px] font-black tracking-[0.3em] uppercase mb-4 shadow-sm backdrop-blur-md">
              SIMULATION CORE
            </div>
            <CardTitle className="text-2xl lg:text-3xl font-black text-[#1E2455] uppercase tracking-tighter text-center leading-tight">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10 p-10">
            {!initialStudentName && (
              <div className="space-y-3 mb-10">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A80B8] pl-2 block">IDENTIFY CANDIDATE</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                  <Input
                    placeholder="Enter full judicial designation"
                    value={quizStudentName}
                    onChange={e => setQuizStudentName(e.target.value)}
                    className="glass-input pl-12 h-12 text-[#1E2455] font-black"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-white/40 p-5 rounded-[24px] border border-white/60 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#7A80B8] uppercase tracking-[0.3em] mb-1 opacity-60">MODULE PHASE</span>
                <span className="text-xl font-black text-[#6C8BFF] tracking-tight">{currentQuestionIndex + 1} <span className="text-[#3A3F6B]/30 text-sm">/ {questions.length}</span></span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-[#7A80B8] font-black uppercase tracking-[0.3em] mb-1 block opacity-60">APTITUDE VALUATION</span>
                <div className="px-5 py-1.5 rounded-2xl bg-gradient-to-r from-[#FFB86C] to-[#E38AD6] text-white font-black text-xs shadow-md tracking-widest">
                  {currentQuestion.marks} PTS
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl lg:text-3xl font-black leading-tight text-[#1E2455] tracking-tighter transition-all duration-500">{currentQuestion.questionText}</h2>
              <div className="h-1.5 w-16 bg-[#6C8BFF]/20 rounded-full" />
            </div>

            <div className="grid gap-5">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentSelectedOption === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={cn(
                      "w-full p-6 border rounded-[28px] text-left transition-all duration-500 relative group overflow-hidden shadow-sm",
                      isSelected
                        ? "border-[#6C8BFF] bg-white/60 shadow-glass-hover translate-x-3 scale-[1.02]"
                        : "bg-white/40 border-white/70 hover:border-[#6C8BFF]/40 hover:bg-white/60 hover:translate-x-1"
                    )}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-[18px] border-2 flex items-center justify-center text-sm font-black transition-all duration-500",
                        isSelected
                          ? "border-[#6C8BFF] bg-gradient-to-br from-[#6C8BFF] to-[#8EA2FF] text-white shadow-lg shadow-[#6C8BFF]/20 rotate-3"
                          : "border-white/80 bg-white/80 text-[#7A80B8] group-hover:border-[#6C8BFF]/40 group-hover:text-[#6C8BFF] font-black"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={cn("font-bold text-lg lg:text-xl transition-all duration-500", isSelected ? "text-[#1E2455] tracking-tight" : "text-[#3A3F6B]/80 group-hover:text-[#1E2455]")}>{option}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#6C8BFF]/5 to-transparent pointer-events-none" />
                    )}
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                  </button>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-10 border-t border-white/40 bg-white/20 items-center">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="w-40 h-12 font-black uppercase tracking-[0.2em] text-[10px] border-white/60 bg-white/40 text-[#7A80B8] hover:bg-white/60 hover:text-[#1E2455] rounded-2xl transition-all shadow-sm disabled:opacity-30"
            >
              RETROGRADE
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => handleSubmitQuiz(false)}
                className="pastel-button-primary w-56 h-14 text-[10px] tracking-[0.2em]"
              >
                FINAL SUBMISSION
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="w-40 h-12 font-black bg-[#1E2455] text-white hover:bg-[#1E2455]/90 uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all shadow-xl hover:shadow-[#1E2455]/20 active:scale-95 flex items-center justify-center gap-2"
              >
                ADVANCE <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};
export default QuizPage;