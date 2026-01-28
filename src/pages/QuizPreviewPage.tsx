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
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Alert className="max-w-md bg-card border-slate-800 text-slate-300">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-slate-100 font-black uppercase tracking-widest text-xs">Loading Quiz Preview...</AlertTitle>
          <AlertDescription className="text-slate-500 italic mt-2">
            Preparing the simulation environment. Please wait...
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
    <div className="min-h-screen flex flex-col bg-background">
      <QuizHeader
        quizTitle={`${quiz.title} (Preview)`}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        isMobile={isMobile}
      />
      <div className="absolute top-24 left-8 z-20">
        <BackButton className="bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl px-5 py-2.5 shadow-xl transition-all" />
      </div>
      <main className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_100%)]">
        <Card className="w-full max-w-2xl border border-slate-800 shadow-2xl shadow-primary/5 bg-card overflow-hidden rounded-[32px]">
          <CardHeader className="bg-slate-950/20 px-8 py-8 border-b border-slate-800 text-center">
            <CardTitle className="text-2xl font-black text-slate-100 uppercase tracking-tight">
              {quiz.title} <span className="text-primary ml-2">(PREVIEW)</span>
            </CardTitle>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Simulation Mode: Responses are not recorded</p>
          </CardHeader>
          <CardContent className="space-y-8 p-10">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-2">
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Phase {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-950 px-3 py-1 rounded-full border border-slate-800 uppercase tracking-widest">
                Valuation: {currentQuestion.marks} Marks
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-50 leading-tight tracking-tight">{currentQuestion.questionText}</h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = option === currentQuestion.correctAnswer;
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-full p-5 border rounded-2xl relative group overflow-hidden transition-all duration-300",
                      isCorrect
                        ? "border-success/30 bg-success/5 shadow-[0_0_20px_-5px_rgba(34,197,94,0.1)]"
                        : "border-slate-800 bg-slate-950/20"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black transition-all",
                        isCorrect
                          ? "border-success bg-success text-white shadow-lg shadow-success/20"
                          : "border-slate-800 bg-slate-900 text-slate-500"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={cn("font-bold text-lg", isCorrect ? "text-slate-50" : "text-slate-400")}>{option}</span>
                      {isCorrect && (
                        <span className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
                          Solution
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-8 border-t border-slate-800 bg-slate-950/20">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="w-32 h-11 font-black uppercase tracking-widest text-xs border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all"
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              className="w-48 h-11 font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 uppercase tracking-widest text-xs rounded-xl"
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