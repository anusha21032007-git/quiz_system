"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Brain, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz } from '@/context/QuizContext';

const InterviewMode = () => {
    const { generateAIQuestions } = useQuiz();

    /* Interview Mode State */
    const [interviewMode, setInterviewMode] = useState<boolean>(false);
    const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
    const [currentInterviewIndex, setCurrentInterviewIndex] = useState<number>(0);
    const [showInterviewAnswer, setShowInterviewAnswer] = useState<boolean>(false);
    const [interviewTimerEnabled, setInterviewTimerEnabled] = useState<boolean>(false);
    const [interviewTimerSeconds, setInterviewTimerSeconds] = useState<number>(30);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [courseName, setCourseName] = useState<string>('');
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [answersRevealedCount, setAnswersRevealedCount] = useState<number>(0);

    const handleStartInterview = () => {
        const questions = generateAIQuestions(courseName || 'General Interview', 'Medium', 5, 4);
        setInterviewQuestions(questions);
        setCurrentInterviewIndex(0);
        setShowInterviewAnswer(false);
        setInterviewMode(true);
        setIsFinished(false);
        setAnswersRevealedCount(0);
        if (interviewTimerEnabled) {
            setRemainingTime(interviewTimerSeconds);
        }
        toast.success(`Interview Session Started!`);
    };

    const handleNextInterviewQuestion = () => {
        if (currentInterviewIndex < interviewQuestions.length - 1) {
            setCurrentInterviewIndex(prev => prev + 1);
            setShowInterviewAnswer(false);
            if (interviewTimerEnabled) {
                setRemainingTime(interviewTimerSeconds);
            }
        } else {
            setIsFinished(true);
            setInterviewMode(false);
            setRemainingTime(null);
            toast.info("Interview Completed!");
        }
    };

    // Timer countdown effect
    useEffect(() => {
        if (interviewMode && interviewTimerEnabled && remainingTime !== null && remainingTime > 0) {
            const timer = setTimeout(() => {
                setRemainingTime(prev => prev ? prev - 1 : 0);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (remainingTime === 0) {
            handleNextInterviewQuestion();
        }
    }, [interviewMode, interviewTimerEnabled, remainingTime]);

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-purple-200 bg-purple-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-6 w-6 text-purple-600" />
                        Interview Mode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {interviewMode ? (
                        <div className="bg-white p-6 rounded-md shadow-sm border border-purple-100">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold text-purple-700">
                                        Question {currentInterviewIndex + 1} of {interviewQuestions.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {interviewTimerEnabled && remainingTime !== null && (
                                        <div className={`px-3 py-1 rounded-full font-bold text-lg ${remainingTime <= 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {remainingTime}s
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setInterviewMode(false)}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        Exit Interview
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                {interviewQuestions[currentInterviewIndex]?.questionText}
                            </h3>

                            {!showInterviewAnswer ? (
                                <Button
                                    onClick={() => {
                                        setShowInterviewAnswer(true);
                                        setAnswersRevealedCount(prev => prev + 1);
                                    }}
                                    className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700"
                                >
                                    Reveal Answer
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                                        <p className="text-sm text-green-800 font-semibold mb-1">Correct Answer:</p>
                                        <p className="text-lg text-green-900">
                                            {interviewQuestions[currentInterviewIndex]?.correctAnswer}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleNextInterviewQuestion}
                                        className="w-full py-4 bg-gray-900 hover:bg-gray-800"
                                    >
                                        {currentInterviewIndex < interviewQuestions.length - 1 ? "Next Question" : "Finish Interview"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : isFinished ? (
                        <div className="bg-white p-8 rounded-md shadow-sm border border-purple-100 text-center animate-in zoom-in-95">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                Interview Summary
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-sm text-purple-600 font-semibold mb-1 uppercase tracking-wider">Attempted</p>
                                    <p className="text-3xl font-bold text-purple-900">{interviewQuestions.length}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                    <p className="text-sm text-green-600 font-semibold mb-1 uppercase tracking-wider">Answers Shown</p>
                                    <p className="text-3xl font-bold text-green-900">{answersRevealedCount}</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-8">
                                The interview session has concluded.
                            </p>

                            <Button
                                onClick={() => {
                                    setInterviewMode(false);
                                    setIsFinished(false);
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700"
                            >
                                Back to Selection
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-4">
                                Interview Mode allows for real-time oral or chat-based assessments separate from standard quizzes.
                            </p>
                            <div className="space-y-4 mb-4">
                                <div>
                                    <Label htmlFor="courseName">Course / Topic Name (Optional)</Label>
                                    <Input
                                        id="courseName"
                                        type="text"
                                        placeholder="e.g., Mathematics, Physics"
                                        value={courseName}
                                        onChange={(e) => setCourseName(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white rounded-md border">
                                    <Label htmlFor="interviewTimer">Enable Timer per Question</Label>
                                    <Switch
                                        id="interviewTimer"
                                        checked={interviewTimerEnabled}
                                        onCheckedChange={setInterviewTimerEnabled}
                                    />
                                </div>
                                {interviewTimerEnabled && (
                                    <div>
                                        <Label htmlFor="timerSeconds">Time per Question (seconds)</Label>
                                        <Input
                                            id="timerSeconds"
                                            type="number"
                                            min="5"
                                            max="300"
                                            value={interviewTimerSeconds}
                                            onChange={(e) => setInterviewTimerSeconds(parseInt(e.target.value) || 30)}
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={handleStartInterview}
                                className="bg-purple-600 hover:bg-purple-700 w-full"
                            >
                                Start Interview Session
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InterviewMode;
