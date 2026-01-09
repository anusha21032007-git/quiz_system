"use client";

import React, { useState, useEffect } from 'react';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, ChevronRight, Eye, CheckCircle2, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface StudentInterviewSessionProps {
    quiz: Quiz;
    studentName: string;
    onExit: () => void;
}

const StudentInterviewSession = ({ quiz, studentName, onExit }: StudentInterviewSessionProps) => {
    const { getQuestionsForQuiz, submitQuizAttempt } = useQuiz();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [revealedCount, setRevealedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            const q = await getQuestionsForQuiz(quiz.id);
            setQuestions(q);
            setIsLoading(false);
        };
        fetchQuestions();
    }, [quiz.id, getQuestionsForQuiz]);

    const handleFinish = () => {
        setIsFinished(true);
        // Persist completion record
        submitQuizAttempt({
            quizId: quiz.id,
            studentName: studentName,
            score: questions.length, // For practice sessions, we just use total questions as score
            totalQuestions: questions.length,
            timeTakenSeconds: 0, // Manual sessions don't track time strictly yet
            answers: [], // We don't track individual MCQ-style answers for interviews
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        } else {
            handleFinish();
        }
    };

    const handleReveal = () => {
        if (!showAnswer) {
            setShowAnswer(true);
            setRevealedCount(prev => prev + 1);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <Card className="text-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <MessageSquare className="h-12 w-12 text-gray-300" />
                    <h3 className="text-xl font-bold">No questions found</h3>
                    <p className="text-gray-500">This interview session doesn't seem to have any questions.</p>
                    <Button onClick={onExit} variant="outline" className="mt-4">Back to List</Button>
                </div>
            </Card>
        );
    }

    if (isFinished) {
        return (
            <Card className="shadow-2xl border-purple-100 animate-in zoom-in-95 duration-500 overflow-hidden">
                <div className="bg-purple-600 p-8 text-white text-center">
                    <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="h-10 w-10 text-yellow-300" />
                    </div>
                    <h2 className="text-3xl font-bold">Interview Completed!</h2>
                    <p className="text-purple-100 mt-2">Great job completing this self-paced interview session.</p>
                </div>
                <CardContent className="p-8">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                            <p className="text-sm text-purple-600 font-semibold uppercase tracking-wider mb-2">Total Questions</p>
                            <p className="text-4xl font-extrabold text-purple-900">{questions.length}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                            <p className="text-sm text-green-600 font-semibold uppercase tracking-wider mb-2">Ref. Shown</p>
                            <p className="text-4xl font-extrabold text-green-900">{revealedCount}</p>
                        </div>
                    </div>
                    <Button onClick={onExit} className="w-full py-6 text-lg bg-gray-900 hover:bg-gray-800 transition-all rounded-xl shadow-lg">
                        Exit to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onExit} className="text-gray-500 hover:text-purple-600">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Exit Session
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                </div>
            </div>

            <Card className="shadow-xl border-t-4 border-t-purple-600">
                <CardContent className="p-8">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider">
                                <Brain className="h-3 w-3" /> Interview Question
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                                {currentQuestion.questionText}
                            </h3>
                        </div>

                        <div className="min-h-[200px] flex flex-col justify-center">
                            {!showAnswer ? (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                                    <p className="text-gray-400 mb-6 italic">Think about your answer, then reveal the reference below.</p>
                                    <Button
                                        onClick={handleReveal}
                                        className="bg-purple-600 hover:bg-purple-700 h-16 w-full max-w-sm text-lg shadow-lg hover:shadow-purple-200 transition-all rounded-xl gap-2"
                                    >
                                        <Eye className="h-5 w-5" /> Reveal Reference Answer
                                    </Button>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-green-50 border border-green-100 rounded-2xl p-8">
                                    <div className="flex items-center gap-2 text-green-700 font-bold mb-4 uppercase text-xs tracking-widest">
                                        <CheckCircle2 className="h-4 w-4" /> Recommended Answer / Key Points
                                    </div>
                                    <p className="text-xl text-green-900 font-medium">
                                        {currentQuestion.correctAnswer}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleNext}
                                className="h-14 px-8 bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl transition-all gap-2 font-bold"
                            >
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border rounded-xl flex items-center gap-4 text-sm text-gray-500">
                    <div className="bg-blue-50 p-2 rounded-lg"><Brain className="h-5 w-5 text-blue-500" /></div>
                    <span>Self-paced mode helps you practice and self-evaluate.</span>
                </div>
                <div className="p-4 bg-white border rounded-xl flex items-center gap-4 text-sm text-gray-500">
                    <div className="bg-yellow-50 p-2 rounded-lg"><Trophy className="h-5 w-5 text-yellow-500" /></div>
                    <span>Compare your thoughts with the reference provided.</span>
                </div>
            </div>
        </div>
    );
};

export default StudentInterviewSession;
