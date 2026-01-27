"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question as LocalQuestionType } from '@/context/QuizContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Loader2, Trophy, RefreshCw } from 'lucide-react';
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
    // ... same logic for results ...
    // To save space in this replacement, I'll copy the minimal needed structure or re-use key parts.
    // Since I'm replacing the whole file, I need to include the full renderResults logic again.

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-success/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

        <Card className="w-full max-w-2xl border border-slate-800 shadow-2xl shadow-primary/5 bg-card overflow-hidden rounded-[40px] relative z-10">
          <CardHeader className="text-center pb-10 pt-12">
            <CardTitle className={cn("text-5xl font-black uppercase tracking-tighter mb-2", isPassed ? "text-success" : "text-danger")}>
              Quiz {isPassed ? "Completed" : "Attempted"}!
            </CardTitle>
            <div className="h-1.5 w-24 bg-slate-800 rounded-full mx-auto" />
          </CardHeader>
          <CardContent className="text-center space-y-10 px-10 pb-12">
            <p className="text-2xl text-slate-300 font-medium">Excellent effort, Professor <span className="font-bold text-slate-50">{quizStudentName}</span>!</p>

            <div className="py-12 px-8 rounded-[32px] bg-slate-900/50 border border-slate-800 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/20 transition-all" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Achievement</p>
              <div className={cn("text-7xl font-black mb-4 tracking-tighter", isPassed ? "text-success" : "text-danger")}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-yellow shadow-yellow/20" />
                <p className="text-3xl font-black text-slate-50">Score: {finalScore.toFixed(2)} / {totalPossibleMarks}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-800/50">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Class Rank</p>
                <p className="text-5xl font-black text-primary tracking-tighter">#{rank || '-'}</p>
              </div>
              <div className="text-center border-l border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Total Participants</p>
                <p className="text-5xl font-black text-slate-200 tracking-tighter">{totalParticipants}</p>
              </div>
            </div>

            <div className="mt-8 text-left">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> Performance Review
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 CustomScrollbar">
                {(attempt.answers || []).map((ans: any, index: number) => {
                  const q = questions.find(question => question.id === ans.questionId);
                  if (!q) return null;
                  return (
                    <div key={ans.questionId} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm transition-all hover:border-slate-700">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <p className="font-bold text-slate-100 leading-relaxed text-lg">{index + 1}. {q.questionText}</p>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 border",
                          ans.isCorrect ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                        )}>
                          {ans.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      <div className="grid gap-2 mb-4">
                        {q.options.map((opt, i) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                          const isSelected = opt === ans.selectedAnswer;

                          return (
                            <div key={i} className={cn(
                              "text-sm p-3 rounded-xl border transition-all",
                              isCorrect
                                ? "bg-success/10 border-success/30 text-success font-bold"
                                : isSelected
                                  ? "bg-danger/10 border-danger/30 text-danger"
                                  : "bg-slate-950/50 border-slate-800 text-slate-500"
                            )}>
                              {opt}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 text-xs font-medium italic text-primary/80 bg-primary/5 p-4 rounded-xl border border-primary/10 leading-relaxed">
                          <span className="not-italic font-black text-primary uppercase tracking-widest mr-2">Rationale:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 py-8 border-t border-slate-800 bg-slate-950/20">
            <Button onClick={() => navigate('/student')} className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              Dashboard
            </Button>
            {!isPassed && (quiz?.maxAttempts === undefined || quiz.maxAttempts > attemptsCount) && (
              <Button onClick={() => navigate(0)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 px-8 rounded-xl font-black uppercase tracking-widest transition-all">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (!quizId || !quiz || isQuestionsLoading || (user && !studentData && user.email && user.email.includes('@student.eduflow.com'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Environment</p>
        </div>
      </div>
    );
  }

  if (showResults || isMaxAttemptsReached || attemptToShow) {
    return renderResults(attemptToShow || { score: 0, answers, studentName: quizStudentName, status: 'SUBMITTED', id: 'current' });
  }

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-slate-500 font-black uppercase tracking-widest">No questions available.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <QuizHeader quizTitle={quiz.title} currentQuestionIndex={currentQuestionIndex} totalQuestions={questions.length} timeLeft={timeLeft} isMobile={isMobile} onBack={handleBack} />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border border-slate-800 shadow-2xl shadow-primary/5 bg-card overflow-hidden rounded-[32px]">
          <CardHeader className="bg-slate-950/20 px-8 py-6 border-b border-slate-800">
            <CardTitle className="text-xl font-black text-slate-100 uppercase tracking-tight text-center">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {!initialStudentName && (
              <div className="space-y-2 mb-8">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Identify Yourself</Label>
                <Input
                  placeholder="Enter your full name"
                  value={quizStudentName}
                  onChange={e => setQuizStudentName(e.target.value)}
                  className="h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-primary rounded-xl transition-all"
                />
              </div>
            )}

            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-2">
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Phase {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-3 py-1 rounded-full border border-slate-800 uppercase tracking-widest">
                Valuation: {currentQuestion.marks} Marks
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-tight text-slate-50 tracking-tight">{currentQuestion.questionText}</h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentSelectedOption === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={cn(
                      "w-full p-5 border border-slate-800 rounded-2xl text-left transition-all duration-300 relative group overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]"
                        : "bg-slate-950/20 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black transition-all",
                        isSelected
                          ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                          : "border-slate-800 bg-slate-900 text-slate-500 group-hover:border-slate-600 group-hover:text-slate-400"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={cn("font-bold text-lg transition-colors", isSelected ? "text-slate-50" : "text-slate-400 group-hover:text-slate-300")}>{option}</span>
                    </div>
                    {isSelected && <div className="absolute top-0 right-0 w-24 h-full bg-primary/10 translate-x-8 blur-2xl" />}
                  </button>
                );
              })}
            </div>

            {/* Warning if skipping without answer? optional. */}
          </CardContent>
          <CardFooter className="flex justify-between p-8 border-t border-slate-800 bg-slate-950/20">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="w-32 h-11 font-black uppercase tracking-widest text-xs border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all"
            >
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => handleSubmitQuiz(false)}
                className="w-48 h-11 font-black bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 uppercase tracking-widest text-xs rounded-xl"
              >
                Finalize & Submit
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="w-32 h-11 font-black bg-slate-50 text-slate-900 hover:bg-white uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                Forward
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};
export default QuizPage;