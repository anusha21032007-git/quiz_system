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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className={cn("text-4xl font-bold", isPassed ? "text-green-700" : "text-red-700")}>
              Quiz {isPassed ? "Completed" : "Attempted"}!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Hi, <span className="font-semibold">{quizStudentName}</span>!</p>

            <div className="py-6 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-lg text-gray-600 font-medium">YOUR RESULT</p>
              <div className={cn("text-6xl font-black mb-2", isPassed ? "text-green-600" : "text-red-600")}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">Score: {finalScore.toFixed(2)} / {totalPossibleMarks}</p>
            </div>

            <div className="flex justify-center items-center gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Rank</p>
                <p className="text-4xl font-bold text-indigo-600">#{rank || '-'}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-4xl font-bold text-gray-700">{totalParticipants}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3 text-left">Review:</h3>
              <div className="space-y-6 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50">
                {(attempt.answers || []).map((ans: any, index: number) => {
                  const q = questions.find(question => question.id === ans.questionId);
                  if (!q) return null;
                  return (
                    <div key={ans.questionId} className="p-4 rounded-md bg-white shadow-sm text-left">
                      <p className="font-medium text-gray-800">{index + 1}. {q.questionText}</p>
                      <p className={cn("text-sm font-bold mt-1", ans.isCorrect ? "text-green-600" : "text-red-600")}>
                        {ans.isCorrect ? "Correct" : "Incorrect"} - {ans.marksObtained.toFixed(2)} marks
                      </p>
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                          <div key={i} className={cn("text-sm p-1 rounded", opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? "bg-green-50 text-green-700 font-bold" : (opt === ans.selectedAnswer ? "bg-red-50 text-red-700" : ""))}>
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-2 text-xs italic text-blue-700 bg-blue-50 p-2 rounded">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700">Student Dashboard</Button>
            {!isPassed && (quiz?.maxAttempts === undefined || quiz.maxAttempts > attemptsCount) && (
              <Button onClick={() => navigate(0)} variant="destructive"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (!quizId || !quiz || isQuestionsLoading || (user && !studentData && user.email && user.email.includes('@student.eduflow.com'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showResults || isMaxAttemptsReached || attemptToShow) {
    return renderResults(attemptToShow || { score: 0, answers, studentName: quizStudentName, status: 'SUBMITTED', id: 'current' });
  }

  if (questions.length === 0) {
    return <div className="p-10 text-center">No questions found.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <QuizHeader quizTitle={quiz.title} currentQuestionIndex={currentQuestionIndex} totalQuestions={questions.length} timeLeft={timeLeft} isMobile={isMobile} onBack={handleBack} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!initialStudentName && (
              <Input placeholder="Your Name" value={quizStudentName} onChange={e => setQuizStudentName(e.target.value)} className="mb-4" />
            )}

            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
              <span className="text-sm font-bold text-blue-800">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-xs text-blue-600 font-medium bg-white px-2 py-1 rounded border border-blue-200">
                Marks: {currentQuestion.marks}
              </span>
            </div>

            <h2 className="text-xl font-semibold leading-relaxed">{currentQuestion.questionText}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentSelectedOption === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={cn(
                      "w-full p-4 border-2 rounded-xl text-left transition-all duration-200 relative group",
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-md transform scale-[1.01]"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-400 group-hover:border-blue-400"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={cn("font-medium", isSelected ? "text-blue-900" : "text-gray-700")}>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Warning if skipping without answer? optional. */}
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t bg-gray-50/50 rounded-b-xl px-6 py-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="w-32 font-bold border-gray-300 hover:bg-white hover:text-gray-900"
            >
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => handleSubmitQuiz(false)}
                className="w-40 font-black bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 text-white"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="w-32 font-bold bg-gray-900 text-white hover:bg-black"
              >
                Next
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};
export default QuizPage;