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

  // Determine student name: prioritize state passed via navigation, then auth data
  const { studentName: navigationStudentName } = (location.state || {}) as { studentName?: string };
  const initialStudentName = navigationStudentName || studentData?.name || user?.email || 'Guest';

  const [questions, setQuestions] = useState<LocalQuestionType[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(initialStudentName);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update quizStudentName if studentData loads later
  useEffect(() => {
    if (studentData?.name && (!quizStudentName || quizStudentName === 'Guest' || quizStudentName === user?.email)) {
      setQuizStudentName(studentData.name);
    }
  }, [studentData, user?.email, quizStudentName]);

  // Check for existing attempts and max attempts reached
  const studentAttempts = useMemo(() => {
    if (!quizStudentName || quizStudentName === 'Guest') return [];
    return quizAttempts
      .filter(a => a.quizId === quizId && a.studentName === quizStudentName)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [quizAttempts, quizId, quizStudentName]);

  const attemptsCount = studentAttempts.length;
  const maxAttempts = quiz?.maxAttempts || 1;
  const isMaxAttemptsReached = attemptsCount >= maxAttempts;

  // Determine which attempt to show results for, if any.
  const attemptToShow = useMemo(() => {
    const submittedAttempt = studentAttempts.find(a => a.status === 'SUBMITTED');
    if (submittedAttempt) return submittedAttempt;
    if (isMaxAttemptsReached && studentAttempts.length > 0) {
      return studentAttempts[0];
    }
    return undefined;
  }, [studentAttempts, isMaxAttemptsReached]);

  // Unified question fetching (handles local and cloud)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!quizId) return;

      // If results should be shown (submitted or max reached), stop loading questions
      if (attemptToShow || isMaxAttemptsReached) {
        setIsQuestionsLoading(false);
        setShowResults(true);
        return;
      }

      setIsQuestionsLoading(true);
      try {
        const allQuestions = await getQuestionsForQuiz(quizId);
        const requiredCount = quiz?.totalQuestions || allQuestions.length;
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, Math.min(requiredCount, allQuestions.length));

        setQuestions(selectedQuestions);
        if (selectedQuestions.length > 0) {
          setTimeLeft(selectedQuestions[0].timeLimitMinutes * 60);
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

  // Per-Question Timer Logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (showResults || questions.length === 0 || isMaxAttemptsReached || attemptToShow) return;

    const currentQ = questions[currentQuestionIndex];
    if (currentQ) {
      setTimeLeft(Math.floor(currentQ.timeLimitMinutes * 60));
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (currentQuestionIndex < questions.length - 1) {
            handleNextQuestion(true);
            return 0;
          } else {
            handleSubmitQuiz(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, questions.length, showResults, isMaxAttemptsReached, attemptToShow]);

  const currentQuestionId = questions[currentQuestionIndex]?.id;

  // Load previously selected answer for current question
  useEffect(() => {
    if (currentQuestionId) {
      const existingAnswer = answers.find(
        (ans) => ans.questionId === currentQuestionId
      );
      setSelectedAnswer(existingAnswer ? existingAnswer.selectedAnswer : null);
    }
  }, [currentQuestionId, answers]);

  const calculateMarksForQuestion = (question: LocalQuestionType, isCorrect: boolean) => {
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

  const handleSubmitQuiz = (isAutoSubmit: boolean = false) => {
    if (!quizStudentName || quizStudentName.trim() === '' || quizStudentName === 'Guest') {
      toast.error("Please enter your name to submit your results.");
      return;
    }

    let finalAnswers = [...answers];
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer !== null && currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const marksObtained = calculateMarksForQuestion(currentQuestion, isCorrect);
      const existingAnswerIndex = finalAnswers.findIndex(
        (ans) => ans.questionId === currentQuestion.id
      );

      if (existingAnswerIndex > -1) {
        finalAnswers[existingAnswerIndex] = {
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect,
          marksObtained,
        };
      } else {
        finalAnswers.push({
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect,
          marksObtained,
        });
      }
    }

    const totalScore = (finalAnswers || []).reduce((sum, ans) => sum + ans.marksObtained, 0);
    const correctAnswersCount = (finalAnswers || []).filter(ans => ans.isCorrect).length;

    submitQuizAttempt({
      quizId: quiz!.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      correctAnswersCount,
      answers: finalAnswers,
      timeTakenSeconds: 0,
      status: 'SUBMITTED',
      violationCount: 0,
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShowResults(true);
    if (isAutoSubmit) {
      toast.info("Time's up! Your quiz has been automatically submitted.");
    } else {
      toast.success("Quiz submitted successfully!");
    }
  };

  const handleNextQuestion = (isAutoAdvance: boolean = false) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer === null && !isAutoAdvance) {
      toast.error("Please select an answer before proceeding.");
      return;
    }

    const isCorrect = currentQuestion && selectedAnswer === currentQuestion.correctAnswer;
    const marksObtained = currentQuestion ? calculateMarksForQuestion(currentQuestion, isCorrect) : 0;

    if (currentQuestion) {
      setAnswers((prev) => {
        const existingAnswerIndex = prev.findIndex(
          (ans) => ans.questionId === currentQuestion.id
        );
        if (existingAnswerIndex > -1) {
          const newAnswers = [...prev];
          newAnswers[existingAnswerIndex] = {
            questionId: currentQuestion.id,
            selectedAnswer: selectedAnswer || '',
            isCorrect,
            marksObtained,
          };
          return newAnswers;
        }
        return [
          ...prev,
          { questionId: currentQuestion.id, selectedAnswer: selectedAnswer || '', isCorrect, marksObtained },
        ];
      });
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleBack = () => {
    if (!showResults && !isMaxAttemptsReached) {
      const confirmed = window.confirm("Are you sure you want to leave the quiz? Your progress will be lost.");
      if (confirmed) {
        navigate('/student');
      }
    } else {
      navigate('/student');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

    const topPerformers = [...attemptsForQuiz]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const handleTryAgain = () => {
      navigate(0);
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className={cn("text-4xl font-bold", isPassed ? "text-green-700" : "text-red-700")}>
              Quiz {isPassed ? "Completed" : "Attempted"}!
            </CardTitle>
            {isMaxAttemptsReached && !attemptToShow && (
              <p className="text-orange-600 font-semibold">You have reached the maximum number of attempts.</p>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Hi, <span className="font-semibold">{quizStudentName}</span>!</p>

            <div className="py-6 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-lg text-gray-600 font-medium">YOUR RESULT</p>
              <div className={cn(
                "text-6xl font-black mb-2",
                isPassed ? "text-green-600" : "text-red-600"
              )}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">Score: {finalScore.toFixed(2)} / {totalPossibleMarks}</p>
              <p className="text-sm text-gray-500">
                Criteria: Minimum {quiz?.passPercentage}% marks required to pass.
              </p>
            </div>

            <div className="flex justify-center items-center gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Current Rank</p>
                <p className="text-4xl font-bold text-indigo-600">#{rank || '-'}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Participants</p>
                <p className="text-4xl font-bold text-gray-700">{totalParticipants}</p>
              </div>
            </div>

            <div className="py-4 px-6 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" /> TOP PERFORMERS
              </h3>
              <div className="space-y-2">
                {topPerformers.map((perf, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold",
                        idx === 0 ? "bg-yellow-400 text-yellow-950" :
                          idx === 1 ? "bg-gray-300 text-gray-900" :
                            "bg-orange-300 text-orange-950"
                      )}>
                        {idx + 1}
                      </span>
                      <span className={cn(
                        "font-medium",
                        perf.studentName === quizStudentName && "text-indigo-600 font-bold"
                      )}>
                        {perf.studentName} {perf.studentName === quizStudentName && "(You)"}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">{perf.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Review Your Answers:</h3>
              <div className="space-y-6 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50">
                {(attempt.answers || []).map((ans: any, index: number) => {
                  const q = questions.find(question => question.id === ans.questionId);
                  if (!q) return null;
                  const isCorrect = ans.isCorrect;
                  const marksObtained = ans.marksObtained || 0;

                  return (
                    <div key={ans.questionId} className="p-4 rounded-md bg-white shadow-sm text-left">
                      <div className="flex items-start space-x-3 mb-3">
                        {isCorrect ? <CheckCircle className="text-green-600 mt-1" /> : <XCircle className="text-red-600 mt-1" />}
                        <div className="flex-grow">
                          <p className="font-medium text-gray-800 text-lg">{index + 1}. {q.questionText} ({q.marks} marks)</p>
                          <p className="text-sm text-gray-700">Marks: <span className="font-semibold">{marksObtained.toFixed(2)}</span></p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => {
                          const isSelected = ans.selectedAnswer === option;
                          const isCorrectOption = q.correctAnswer === option;

                          return (
                            <div
                              key={optIndex}
                              className={cn(
                                "p-2 border rounded-md",
                                isCorrectOption && "bg-green-100 border-green-400",
                                isSelected && !isCorrectOption && "bg-red-100 border-red-400",
                                isSelected && isCorrectOption && "bg-green-100 border-green-400",
                                !isSelected && !isCorrectOption && "bg-gray-50 border-gray-200"
                              )}
                            >
                              <span className="font-medium">{option}</span>
                              {isSelected && (
                                isCorrectOption ? (
                                  <span className="ml-2 text-green-700">(Your Answer - Correct)</span>
                                ) : (
                                  <span className="ml-2 text-red-700">(Your Answer - Incorrect)</span>
                                )
                              )}
                              {!isSelected && isCorrectOption && (
                                <span className="ml-2 text-green-700">(Correct Answer)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700">
              Back to Dashboard
            </Button>
            {!isPassed && (quiz?.maxAttempts === undefined || quiz.maxAttempts > attemptsCount) && (
              <Button onClick={handleTryAgain} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            )}
            <Button onClick={() => navigate('/leaderboard')} variant="outline">
              View Leaderboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (!quizId || !quiz || isQuestionsLoading || (user && !studentData && user.email && user.email.includes('@student.eduflow.com'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Alert className="max-w-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading Quiz...</AlertTitle>
          <AlertDescription>
            Please wait while the quiz loads.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showResults || isMaxAttemptsReached || attemptToShow) {
    const finalAttempt = attemptToShow || {
      score: (answers || []).reduce((sum, a) => sum + (a.marksObtained || 0), 0),
      answers: answers,
      studentName: quizStudentName,
      status: 'SUBMITTED',
      id: 'current'
    };
    return renderResults(finalAttempt);
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Quiz Empty</AlertTitle>
          <AlertDescription>
            Quiz "{quiz.title}" has no questions yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <QuizHeader
        quizTitle={quiz.title}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        isMobile={isMobile}
        onBack={handleBack}
      />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!initialStudentName && (
              <div className="mb-4">
                <Label htmlFor="quizStudentName" className="text-lg font-semibold">Your Name</Label>
                <Input
                  id="quizStudentName"
                  placeholder="Enter your name"
                  value={quizStudentName}
                  onChange={(e) => setQuizStudentName(e.target.value)}
                  className="mt-2 p-3 text-lg"
                />
              </div>
            )}
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentQuestionIndex + 1}. {currentQuestion.questionText} ({currentQuestion.marks} marks)
            </h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAnswer(option)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 text-left group",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.01]"
                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white group-hover:border-gray-400"
                    )}>
                      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />}
                    </div>
                    <span className={cn(
                      "text-lg flex-grow",
                      isSelected ? "font-medium text-indigo-900" : "font-normal text-gray-700"
                    )}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between mt-6">
            <Button
              disabled={true}
              variant="outline"
              className="text-lg px-6 py-3 opacity-50 cursor-not-allowed"
            >
              Previous
            </Button>
            <Button
              onClick={() => handleNextQuestion(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default QuizPage;