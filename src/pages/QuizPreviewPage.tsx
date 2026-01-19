"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import QuizHeader from '@/components/quiz/QuizHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import BackButton from '@/components/ui/BackButton';

// Define types for the quiz data loaded from session storage
interface PreviewQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface PreviewQuiz {
  id: string;
  title: string;
  questionIds: string[];
  timeLimitMinutes: number;
  negativeMarking: boolean;
  _questionsData: PreviewQuestion[];
}

const QuizPreviewPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [quiz, setQuiz] = useState<PreviewQuiz | null>(null);
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Time in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!quizId) {
      toast.error("No quiz ID provided for preview.");
      navigate('/teacher');
      return;
    }

    try {
      const storedQuizString = sessionStorage.getItem('preview_quiz_data');
      if (storedQuizString) {
        const loadedQuiz: PreviewQuiz = JSON.parse(storedQuizString);
        if (loadedQuiz.id === quizId) {
          setQuiz(loadedQuiz);
          setQuestions(loadedQuiz._questionsData);
          setTimeLeft(loadedQuiz.timeLimitMinutes * 60); // Initialize timer for preview
          toast.info(`Previewing quiz: ${loadedQuiz.title}`);
        } else {
          toast.error("Preview quiz not found or ID mismatch.");
          navigate('/teacher');
        }
      } else {
        toast.error("No quiz data found in session storage for preview.");
        navigate('/teacher');
      }
    } catch (error) {
      console.error("Error loading quiz from session storage:", error);
      toast.error("Failed to load quiz preview data.");
      navigate('/teacher');
    }

    // Clear preview data from session storage when component unmounts or user leaves
    return () => {
      sessionStorage.removeItem('preview_quiz_data');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId, navigate]);

  // Timer logic for preview (does not auto-submit)
  useEffect(() => {
    if (quiz && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && quiz) {
      toast.info("Preview time has run out. This quiz would normally auto-submit.");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, quiz]);


  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Loading Quiz Preview...</AlertTitle>
          <AlertDescription>
            Please wait while the quiz preview loads, or navigate back to the teacher dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null); // Reset selected answer for next question
    } else {
      toast.info("End of quiz preview. This quiz would normally be submitted.");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedAnswer(null); // Reset selected answer for previous question
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <QuizHeader
        quizTitle={`${quiz.title} (Preview)`}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        isMobile={isMobile}
      />
      <div className="absolute top-20 left-4 z-50">
        <BackButton className="bg-white border rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all" />
      </div>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">
              {quiz.title} <span className="text-blue-500">(Preview Mode)</span>
            </CardTitle>
            <p className="text-center text-gray-600">This is a preview. No answers will be saved.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">{currentQuestion.questionText} ({currentQuestion.marks} marks)</h2>
            <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer || ''} className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-100 cursor-pointer">
                  <RadioGroupItem value={option} id={`option-${index}`} disabled /> {/* Disable selection in preview */}
                  <Label htmlFor={`option-${index}`} className="text-lg font-normal flex-grow cursor-pointer">
                    {option}
                  </Label>
                  {option === currentQuestion.correctAnswer && (
                    <span className="text-green-600 font-semibold text-sm">(Correct Answer)</span>
                  )}
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
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'End Preview'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default QuizPreviewPage;