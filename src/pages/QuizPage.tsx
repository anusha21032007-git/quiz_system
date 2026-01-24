"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question as LocalQuestionType } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuizHeader from '@/components/quiz/QuizHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input'; // Ensure Input is imported

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
  const { studentName } = (location.state || {}) as { studentName?: string };

  const { getQuizById, submitQuizAttempt, getQuestionsForQuiz, quizAttempts } = useQuiz();
  const quiz = quizId ? getQuizById(quizId) : undefined;

  const [questions, setQuestions] = useState<LocalQuestionType[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);

  // Unified question fetching (handles local and cloud)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!quizId) return;
      setIsQuestionsLoading(true);
      try {
        const allQuestions = await getQuestionsForQuiz(quizId);

        // --- RANDOM SHUFFLING LOGIC ---
        // The quiz might have a large pool. We need to select `quiz.totalQuestions` items randomly.
        const requiredCount = quiz?.totalQuestions || allQuestions.length;

        // Shuffle the full pool
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

        // Select the subset (ensure we don't try to slice more than we have)
        const selectedQuestions = shuffled.slice(0, Math.min(requiredCount, allQuestions.length));

        setQuestions(selectedQuestions);
        // Initialize timer for the first question
        if (selectedQuestions.length > 0) {
          setTimeLeft(selectedQuestions[0].timeLimitMinutes * 60);
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
        toast.error("Failed to load quiz questions.");
        setQuestions([]); // Ensure state is reset on error
      } finally {
        setIsQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, [quizId, getQuestionsForQuiz, quiz?.totalQuestions]); // Added quiz?.totalQuestions dependency

  const isMobile = useIsMobile();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(studentName || '');
  const [initialTime, setInitialTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz state initialization
  useEffect(() => {
    if (!quizId || !quiz) {
      return;
    }
  }, [quizId, quiz, navigate]);

  // Per-Question Timer Logic
  useEffect(() => {
    // Clear any existing timer when question changes or results are shown
    if (timerRef.current) clearInterval(timerRef.current);

    if (showResults || questions.length === 0) return;

    // Reset timer for new question
    const currentQ = questions[currentQuestionIndex];
    if (currentQ) {
      setTimeLeft(Math.floor(currentQ.timeLimitMinutes * 60));
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time is up for this question
          clearInterval(timerRef.current!);

          if (currentQuestionIndex < questions.length - 1) {
            // Move to next question automatically
            // Direct call to avoid double ticks and ensure speed
            handleNextQuestion(true);
            return 0;
          } else {
            // Auto-submit quiz
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
  }, [currentQuestionIndex, questions.length, showResults]);

  const currentQuestionId = questions[currentQuestionIndex]?.id;

  // Load previously selected answer for current question
  // DEPEND ON ID, NOT ARRAY REFERENCE
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
    const totalPossibleMarks = (questions || []).reduce((sum, q) => sum + q.marks, 0);
    const correctAnswersCount = (finalAnswers || []).filter(ans => ans.isCorrect).length;
    const timeTaken = 0; // Per-question timing makes total time calculation distinct, optional to sum up actuals if tracked
    const passed = (totalScore / totalPossibleMarks) * 100 >= (quiz.passPercentage || 0);

    submitQuizAttempt({
      quizId: quiz.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      correctAnswersCount,
      passed,
      answers: finalAnswers,
      timeTakenSeconds: timeTaken,
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
    if (selectedAnswer === null && !isAutoAdvance) {
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
      // Timer useEffect will trigger reset
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
    if (!showResults) {
      const confirmed = window.confirm("Are you sure you want to leave the quiz? Your progress will be lost.");
      if (confirmed) {
        navigate('/student');
      }
    } else {
      navigate('/student');
    }
  };

  if (showResults) {
    const finalScore = (answers || []).reduce((sum, ans) => sum + ans.marksObtained, 0);
    const totalPossibleMarks = (questions || []).reduce((sum, q) => sum + q.marks, 0);
    const timeTaken = initialTime - timeLeft;
    const totalCorrectAnswers = answers.filter(ans => ans.isCorrect).length;
    const totalWrongAnswers = answers.filter(ans => !ans.isCorrect && ans.selectedAnswer !== null).length;

    // Rank calculation
    const attemptsForQuiz = quizAttempts.filter(a => a.quizId === quiz.id);
    const sortedScores = [...attemptsForQuiz].sort((a, b) => b.score - a.score);
    const rank = sortedScores.findIndex(s => s.score === finalScore) + 1;
    const totalParticipants = attemptsForQuiz.length;

    // Calculate total time taken correctly if needed, or just show N/A for now since structure changed
    // For now, let's just display "Completed" or similar, or sum up answer times if we tracked them.
    // Since we didn't add detailed tracking, we'll omit detailed total time or show estimated.

    // Top performers for leaderboard
    const topPerformers = [...attemptsForQuiz]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);


    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-green-700">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Congratulations, <span className="font-semibold">{quizStudentName}</span>!</p>

            <div className="py-6 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-lg text-gray-600 font-medium">YOUR FINAL RESULT</p>
              <div className={cn(
                "text-6xl font-black mb-2",
                (finalScore / totalPossibleMarks) * 100 >= (quiz.passPercentage || 0) ? "text-green-600" : "text-red-600"
              )}>
                {(finalScore / totalPossibleMarks) * 100 >= (quiz.passPercentage || 0) ? "PASSED" : "FAILED"}
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">Score: {finalScore.toFixed(2)} / {totalPossibleMarks}</p>
              <p className="text-sm text-gray-500">
                Criteria: Minimum {quiz.passPercentage}% marks required to pass.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mb-1" />
                <span className="font-semibold">Correct Answers:</span> {totalCorrectAnswers}
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="h-8 w-8 text-red-500 mb-1" />
                <span className="font-semibold">Wrong Answers:</span> {totalWrongAnswers}
              </div>
            </div>
            {/* <p className="text-xl text-gray-700">Time Taken: <span className="font-semibold">{formatTime(timeTaken)}</span></p> */ /* Removed Global Time Display */}

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

            {/* Mini Leaderboard Section */}
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
                {questions.map((q, index) => {
                  const studentAnswer = answers.find(ans => ans.questionId === q.id);
                  const isCorrect = studentAnswer?.isCorrect;
                  const marksObtained = studentAnswer?.marksObtained || 0;

                  return (
                    <div key={q.id} className="p-4 rounded-md bg-white shadow-sm">
                      <div className="flex items-start space-x-3 mb-3">
                        {isCorrect ? <CheckCircle className="text-green-600 mt-1" /> : <XCircle className="text-red-600 mt-1" />}
                        <div className="text-left flex-grow">
                          <p className="font-medium text-gray-800 text-lg">{index + 1}. {q.questionText} ({q.marks} marks)</p>
                          <p className="text-sm text-gray-700">Marks: <span className="font-semibold">{marksObtained.toFixed(2)}</span></p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => {
                          const isSelected = studentAnswer?.selectedAnswer === option;
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
            <Button onClick={() => navigate('/leaderboard')} variant="outline">
              View Leaderboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
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
            {!studentName && (
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
              disabled={true} // Strict per-question timer means no going back
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