"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question as LocalQuestionType } from '@/context/QuizContext';
import { useAuth } from '@/context/AuthContext';
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
  const { studentData, user } = useAuth();

  // Determine student name: use state if passed via navigation, else logged-in student data, else Guest
  const { studentName: navigationStudentName } = (location.state || {}) as { studentName?: string };
  const initialStudentName = navigationStudentName || studentData?.name || user?.email || '';

  const { getQuizById, submitQuizAttempt, getQuestionsForQuiz, quizAttempts } = useQuiz();
  const quiz = quizId ? getQuizById(quizId) : undefined;

  const [questions, setQuestions] = useState<LocalQuestionType[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(initialStudentName);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();

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
    
    // If a submitted attempt exists, show it.
    if (submittedAttempt) return submittedAttempt;
    
    // If max attempts reached, show the latest attempt (even if corrupted/zero score)
    if (isMaxAttemptsReached && studentAttempts.length > 0) {
        return studentAttempts[0];
    }
    return undefined;
  }, [studentAttempts, isMaxAttemptsReached]);

  // Unified question fetching (handles local and cloud)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!quizId) return;

      // If max attempts reached, we don't need to fetch questions for a new attempt
      if (isMaxAttemptsReached && existingAttempt) {
        setIsQuestionsLoading(false);
        setShowResults(true);
        return;
      }

      setIsQuestionsLoading(true);
      try {
        const allQuestions = await getQuestionsForQuiz(quizId);

        // --- RANDOM SHUFFLING LOGIC ---
        const requiredCount = quiz?.totalQuestions || allQuestions.length;
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, Math.min(requiredCount, allQuestions.length));

        setQuestions(selectedQuestions);

        // Initialize timer for the first question
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
  }, [quizId, getQuestionsForQuiz, quiz?.totalQuestions, isMaxAttemptsReached, existingAttempt]);

  // Per-Question Timer Logic
  useEffect(() => {
    // Clear any existing timer when question changes or results are shown
    if (timerRef.current) clearInterval(timerRef.current);

    if (showResults || questions.length === 0 || isMaxAttemptsReached) return;

    // Reset timer for new question
    const currentQ = questions[currentQuestionIndex];
    if (currentQ) {
      setTimeLeft(Math.floor(currentQ.timeLimitMinutes * 60));
    }

<<<<<<< HEAD
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time is up for this question
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
=======
    // Show results if max attempts reached OR a submitted attempt exists.
    if (isMaxAttemptsReached || attemptToShow) {
        setShowResults(true);
        return;
    }

    if (questions && questions.length > 0) {
      // Calculate total time limit based on individual question times
      const totalDuration = (questions || []).reduce((sum, q) => sum + q.timeLimitMinutes, 0) * 60; // Convert minutes to seconds
      setInitialTime(totalDuration);
      setTimeLeft(totalDuration);
    }
  }, [quizId, quiz, questions.length, navigate, isMaxAttemptsReached, attemptToShow]);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !showResults && questions.length > 0 && !isMaxAttemptsReached) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResults && questions.length > 0 && !isMaxAttemptsReached) {
      // Auto-submit when time runs out
      handleSubmitQuiz(true);
    }
>>>>>>> 6d2981f29ce79208baa4348fb9d60f04fbed3927

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, questions.length, showResults, isMaxAttemptsReached]);

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
    if (!quizStudentName.trim()) {
      toast.error("Please enter your name to submit your results.");
      return;
    }

    // Ensure the current question's answer is recorded before final submission
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
    const totalPossibleMarks = (questions || []).reduce((sum, q) => sum + q.marks, 0);
    const correctAnswersCount = (finalAnswers || []).filter(ans => ans.isCorrect).length;

    submitQuizAttempt({
      quizId: quiz!.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      correctAnswersCount,
      answers: finalAnswers,
      timeTakenSeconds: 0, // Simplified for per-question timing
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

  if (showResults || isMaxAttemptsReached) {
    const attempt = showResults ? {
      score: (answers || []).reduce((sum, ans) => sum + ans.marksObtained, 0),
      totalQuestions: questions.length,
      correctAnswersCount: answers.filter(ans => ans.isCorrect).length,
      answers: answers
    } : existingAttempt;

    if (!attempt) return null;

    const totalPossibleMarks = showResults
      ? (questions || []).reduce((sum, q) => sum + q.marks, 0)
      : (attempt as any).totalMarksPossible || attempt.totalQuestions;

    const finalScore = attempt.score;
    const totalCorrectAnswers = attempt.correctAnswersCount;
    const totalWrongAnswers = attempt.totalQuestions - totalCorrectAnswers;

    // Rank calculation
    const attemptsForQuiz = quizAttempts.filter(a => a.quizId === quiz.id);
    const sortedScores = [...attemptsForQuiz].sort((a, b) => b.score - a.score);
    const rank = sortedScores.findIndex(s => s.score === finalScore) + 1;
    const totalParticipants = attemptsForQuiz.length;

    const topPerformers = [...attemptsForQuiz]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-green-700">Quiz Completed!</CardTitle>
            {isMaxAttemptsReached && !showResults && (
              <p className="text-orange-600 font-semibold">You have already completed this quiz. Max attempts reached.</p>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Hi, <span className="font-semibold">{quizStudentName}</span>!</p>

            <div className="py-6 px-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-lg text-gray-600 font-medium">YOUR RESULT</p>
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
                <span className="font-semibold">Correct:</span> {totalCorrectAnswers}
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="h-8 w-8 text-red-500 mb-1" />
                <span className="font-semibold">Incorrectly Answered:</span> {totalWrongAnswers}
              </div>
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
              <h3 className="text-xl font-semibold mb-3">Review Answers:</h3>
              <div className="space-y-6 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50">
                {/* Review details can be more complex, but simplified here for flow */}
                <p className="text-gray-600">Review section is available for completed attempts.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/student')} className="bg-blue-600 hover:bg-blue-700">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
<<<<<<< HEAD
=======
  };

  if (showResults || isMaxAttemptsReached) {
    // If max attempts reached, we must have an attempt to show (even if corrupted/zero score)
    const attemptToShowFinal = attemptToShow || { 
        score: 0, 
        totalMarksPossible: 0, 
        timeTakenSeconds: 0, 
        correctAnswersCount: 0, 
        scorePercentage: 0, 
        passed: false, 
        answers: [], 
        id: 'temp' 
    };
    return renderResults(attemptToShowFinal);
>>>>>>> 6d2981f29ce79208baa4348fb9d60f04fbed3927
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
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
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
              disabled={true} // Per-question timer means no going back
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