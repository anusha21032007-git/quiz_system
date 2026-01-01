"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuiz, Question } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Clock } from 'lucide-react';
import { toast } from 'sonner';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { studentName } = (location.state || {}) as { studentName?: string };

  const { getQuizById, getQuestionsForQuiz, submitQuizAttempt } = useQuiz();
  const quiz = quizId ? getQuizById(quizId) : undefined;
  const questions = quizId ? getQuestionsForQuiz(quizId) : [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStudentName, setQuizStudentName] = useState(studentName || '');
  const [timeLeft, setTimeLeft] = useState<number>(quiz?.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : 0); // Time in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize quiz state and handle missing quiz/questions
  useEffect(() => {
    if (!quizId || !quiz) {
      toast.error("Quiz not found.");
      navigate('/student');
      return;
    }
    if (questions.length === 0) {
      toast.info(`Quiz "${quiz.title}" has no questions yet.`);
      navigate('/student');
      return;
    }
    setTimeLeft(quiz.timeLimitMinutes * 60); // Set initial time
  }, [quizId, quiz, questions.length, navigate]);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResults) {
      // Auto-submit when time runs out
      handleSubmitQuiz(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, showResults]);

  // Load previously selected answer for current question
  useEffect(() => {
    if (currentQuestionIndex < questions.length) {
      const existingAnswer = answers.find(
        (ans) => ans.questionId === questions[currentQuestionIndex].id
      );
      setSelectedAnswer(existingAnswer ? existingAnswer.selectedAnswer : null);
    }
  }, [currentQuestionIndex, questions, answers]);

  if (!quizId || !quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Loading Quiz...</AlertTitle>
          <AlertDescription>
            Please wait while the quiz loads, or navigate back to the student dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateMarksForQuestion = (question: Question, isCorrect: boolean) => {
    if (isCorrect) {
      return question.marks;
    } else if (quiz?.negativeMarking) {
      return -0.25 * question.marks; // Deduct 25% for wrong answers
    }
    return 0; // No marks for incorrect, no negative marking
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

    const totalScore = finalAnswers.reduce((sum, ans) => sum + ans.marksObtained, 0);

    submitQuizAttempt({
      quizId: quiz.id,
      studentName: quizStudentName,
      score: totalScore,
      totalQuestions: questions.length,
      answers: finalAnswers,
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
      setSelectedAnswer(null); // Reset selected answer for next question
    } else {
      // End of quiz, submit
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      // The selectedAnswer state will be updated by the useEffect hook
    }
  };

  if (showResults) {
    const finalScore = answers.reduce((sum, ans) => sum + ans.marksObtained, 0);
    const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-green-700">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-2xl text-gray-800">Congratulations, <span className="font-semibold">{quizStudentName}</span>!</p>
            <p className="text-5xl font-extrabold text-blue-600">Your Score: {finalScore.toFixed(2)} / {totalPossibleMarks}</p>
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Review Your Answers:</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto p-4 border rounded-md bg-gray-50">
                {questions.map((q, index) => {
                  const studentAnswer = answers.find(ans => ans.questionId === q.id);
                  const isCorrect = studentAnswer?.isCorrect;
                  const marksObtained = studentAnswer?.marksObtained || 0;

                  return (
                    <div key={q.id} className={`p-3 rounded-md ${isCorrect ? 'bg-green-100' : 'bg-red-100'} flex items-start space-x-3`}>
                      {isCorrect ? <CheckCircle className="text-green-600 mt-1" /> : <XCircle className="text-red-600 mt-1" />}
                      <div className="text-left flex-grow">
                        <p className="font-medium text-gray-800">{index + 1}. {q.questionText} ({q.marks} marks)</p>
                        <p className="text-sm text-gray-700">Your Answer: <span className="font-semibold">{studentAnswer?.selectedAnswer || 'Not Answered'}</span></p>
                        {!isCorrect && (
                          <p className="text-sm text-gray-700">Correct Answer: <span className="font-semibold">{q.correctAnswer}</span></p>
                        )}
                        <p className="text-sm text-gray-700">Marks: <span className="font-semibold">{marksObtained.toFixed(2)}</span></p>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800 text-center">{quiz.title}</CardTitle>
          <div className="flex justify-between items-center mt-2">
            <div className="text-center text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className={`flex items-center gap-1 font-semibold ${timeLeft <= 60 ? 'text-red-500' : 'text-gray-700'}`}>
              <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
            </div>
          </div>
          <Progress value={progress} className="w-full mt-4" />
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
          <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer || ''} className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-100 cursor-pointer">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-lg font-normal flex-grow cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
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
    </div>
  );
};

export default QuizPage;