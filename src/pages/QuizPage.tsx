"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question as LocalQuestionType } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Loader2, Trophy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuizHeader from '@/components/quiz/QuizHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input'; 

// Map SupabaseQuestion to LocalQuestionType for internal use
const mapSupabaseQuestionToLocal = (sQuestion: any): LocalQuestionType => ({
  id: sQuestion.id,
  quizId: sQuestion.quiz_id,
  questionText: sQuestion.question_text,
  options: sQuestion.options,
  correctAnswer: sQuestion.correct_answer,
  marks: sQuestion.marks,
  timeLimitMinutes: sQuestion.time_limit_minutes,
  explanation: sQuestion.explanation || '',
});


const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { studentData } = (location.state || {}) as { studentData?: any };
  const studentNameFromState = studentData?.name || 'Guest';

  const { getQuizById, submitQuizAttempt, getQuestionsForQuiz, quizAttempts } = useQuiz();
  const quiz = quizId ? getQuizById(quizId) : undefined;

  const [questions, setQuestions] = useState<LocalQuestionType[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(studentNameFromState);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isMobile = useIsMobile();

  // Check for existing attempt
  const existingAttempt = useMemo(() => {
    // Find the latest attempt by the current student for this quiz
    return quizAttempts
      .filter(a => a.quizId === quizId && a.studentName === quizStudentName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [quizAttempts, quizId, quizStudentName]);

  // Unified question fetching (handles local and cloud)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!quizId || existingAttempt) return; // Skip if already attempted
      setIsQuestionsLoading(true);
      try {
        const allQuestions = await getQuestionsForQuiz(quizId);

        const requiredCount = quiz?.totalQuestions || allQuestions.length;

        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

        const selectedQuestions = shuffled.slice(0, Math.min(requiredCount, allQuestions.length));

        setQuestions(selectedQuestions);
      } catch (error) {
        console.error("Failed to load questions:", error);
        toast.error("Failed to load quiz questions.");
        setQuestions([]); 
      } finally {
        setIsQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, [quizId, getQuestionsForQuiz, quiz?.totalQuestions, existingAttempt]); 

  // Initialize quiz state and handle missing quiz/questions
  useEffect(() => {
    if (!quizId || !quiz) {
      return;
    }

    if (existingAttempt) {
        setShowResults(true);
        return;
    }

    if (questions && questions.length > 0) {
      // Calculate total time limit based on individual question times
      const totalDuration = (questions || []).reduce((sum, q) => sum + q.timeLimitMinutes, 0) * 60; // Convert minutes to seconds
      setInitialTime(totalDuration);
      setTimeLeft(totalDuration);
    }
  }, [quizId, quiz, questions.length, navigate, existingAttempt]);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !showResults && questions.length > 0 && !existingAttempt) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResults && questions.length > 0 && !existingAttempt) {
      // Auto-submit when time runs out
      handleSubmitQuiz(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, showResults, questions.length, existingAttempt]);

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

  if (!quizId || !quiz || isQuestionsLoading) {
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

  if (questions.length === 0 && !existingAttempt) {
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateMarksForQuestion = (question: LocalQuestionType, isCorrect: boolean) => {
    if (isCorrect) {
      return question.marks;
    } else if (quiz?.negativeMarking) {
      // Use negativeMarksValue from the quiz object
      const deduction = quiz.negativeMarksValue > 0
        ? quiz.negativeMarksValue
        : 0.25 * question.marks;
      return -deduction;
    }
    return 0;
  };

  const handleSubmitQuiz = (isAutoSubmit: boolean = false) => {
    if (!quizStudentName.trim()) {
      toast.error("Please enter your name to submit your results.");
      return;
    }

    // Ensure the current question's answer is recorded before final submission
    let finalAnswers = [...answers];
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
    const timeTaken = initialTime - timeLeft;
    
    // Pass/Fail calculation is now handled inside submitQuizAttempt in QuizContext
    
    submitQuizAttempt({
      quizId: quiz.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      correctAnswersCount,
      answers: finalAnswers,
      timeTakenSeconds: timeTaken,
      status: 'SUBMITTED',
      violationCount: 0, // Assuming no competitive mode integrity checks here
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

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer before proceeding.");
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const marksObtained = calculateMarksForQuestion(currentQuestion, isCorrect);

    setAnswers((prev) => {
      const existingAnswerIndex = prev.findIndex(
        (ans) => ans.questionId === currentQuestion.id
      );
      if (existingAnswerIndex > -1) {
        const newAnswers = [...prev];
        newAnswers[existingAnswerIndex] = {
          questionId: currentQuestion.id,
          selectedAnswer,
          isCorrect,
          marksObtained,
        };
        return newAnswers;
      }
      return [
        ...prev,
        { questionId: currentQuestion.id, selectedAnswer, isCorrect, marksObtained },
      ];
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // End of quiz, submit
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleBack = () => {
    if (!showResults && !existingAttempt) {
      const confirmed = window.confirm("Are you sure you want to leave the quiz? Your progress will be lost.");
      if (confirmed) {
        navigate('/student');
      }
    } else {
      navigate('/student');
    }
  };

  const renderResults = (attempt: any) => {
    const finalScore = attempt.score;
    const totalPossibleMarks = attempt.totalMarksPossible;
    const timeTaken = attempt.timeTakenSeconds;
    const totalCorrectAnswers = attempt.correctAnswersCount;
    const totalWrongAnswers = attempt.answers.filter((ans: any) => !ans.isCorrect && ans.selectedAnswer !== null).length;
    const scorePercentage = attempt.scorePercentage;
    const isPassed = attempt.passed;

    // Rank calculation (simplified for display)
    const attemptsForQuiz = quizAttempts.filter(a => a.quizId === quiz.id);
    const sortedScores = [...attemptsForQuiz].sort((a, b) => b.score - a.score);
    const rank = sortedScores.findIndex(s => s.id === attempt.id) + 1;
    const totalParticipants = attemptsForQuiz.length;

    // Top performers for leaderboard
    const topPerformers = attemptsForQuiz
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const handleTryAgain = () => {
        // Reset state and navigate to start the quiz again
        setShowResults(false);
        setQuestions([]);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setInitialTime(0);
        setTimeLeft(0);
        navigate(0); // Reload component to re-fetch questions and restart timer
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className={cn("text-4xl font-bold", isPassed ? "text-green-700" : "text-red-700")}>
                Quiz {isPassed ? "Completed" : "Attempted"}!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Result for <span className="font-semibold">{quizStudentName}</span></p>

            <div className="py-6 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-lg text-gray-600 font-medium">FINAL STATUS</p>
              <div className={cn(
                "text-6xl font-black mb-2",
                isPassed ? "text-green-600" : "text-red-600"
              )}>
                {isPassed ? "PASSED" : "FAILED"}
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">Score: {finalScore.toFixed(2)} / {totalPossibleMarks.toFixed(2)}</p>
              <p className="text-xl font-bold text-indigo-600">Percentage: {scorePercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">
                Pass Mark: {quiz.passPercentage}%
              </p>
            </div>
            <p className="text-xl text-gray-700">Time Taken: <span className="font-semibold">{formatTime(timeTaken)}</span></p>

            <div className="flex justify-center items-center gap-6 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Current Rank</p>
                <p className="text-4xl font-bold text-indigo-600">#{rank}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Participants</p>
                <p className="text-4xl font-bold text-gray-700">{totalParticipants}</p>
              </div>
            </div>

            {/* Review Answers Section */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Review Your Answers:</h3>
              <div className="space-y-6 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50">
                {attempt.answers.map((ans: any, index: number) => {
                  const q = questions.find(q => q.id === ans.questionId) || { questionText: 'Unknown Question', options: [], correctAnswer: '', marks: 0 };
                  const isCorrect = ans.isCorrect;
                  const marksObtained = ans.marksObtained || 0;

                  return (
                    <div key={ans.questionId} className="p-4 rounded-md bg-white shadow-sm">
                      <div className="flex items-start space-x-3 mb-3">
                        {isCorrect ? <CheckCircle className="text-green-600 mt-1" /> : <XCircle className="text-red-600 mt-1" />}
                        <div className="text-left flex-grow">
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
                                "p-2 border rounded-md text-left",
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
              Back to Student Dashboard
            </Button>
            {!isPassed && (quiz.maxAttempts === undefined || quiz.maxAttempts > attemptsForQuiz.length) && (
                <Button onClick={handleTryAgain} variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                </Button>
            )}
            <Button onClick={() => navigate('/leaderboard')} variant="outline">
              View Global Leaderboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  if (showResults || existingAttempt) {
    return renderResults(existingAttempt || { 
        score: 0, 
        totalMarksPossible: 0, 
        timeTakenSeconds: 0, 
        correctAnswersCount: 0, 
        scorePercentage: 0, 
        passed: false, 
        answers: [], 
        id: 'temp' 
    });
  }

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
            {!studentData && (
              <div className="mb-4">
                <Label htmlFor="quizStudentName" className="text-lg font-semibold">Your Name</Label>
                <Input
                  id="quizStudentName"
                  placeholder="Enter your name"
                  value={quizStudentName}
                  onChange={(e) => setQuizStudentName(e.target.value)}
                  className="mt-2 p-3 text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">This name will be used for the leaderboard.</p>
              </div>
            )}
            <h2 className="text-2xl font-semibold text-gray-900">{currentQuestion.questionText} ({currentQuestion.marks} marks)</h2>
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
                    {/* Custom Radio Circle */}
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
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
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="text-lg px-6 py-3"
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
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