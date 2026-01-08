<<<<<<< HEAD
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
=======
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, Trophy, PlusCircle, FileText, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const InterviewMode = () => {
    /* Interview Mode State */
    const [interviewMode, setInterviewMode] = useState<boolean>(false);
    const [creationMode, setCreationMode] = useState<'selection' | 'manual' | 'pdf'>('selection');
    const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
    const [currentInterviewIndex, setCurrentInterviewIndex] = useState<number>(0);
    const [showInterviewAnswer, setShowInterviewAnswer] = useState<boolean>(false);
    const [interviewTimerEnabled, setInterviewTimerEnabled] = useState<boolean>(false);
    const [interviewTimerSeconds, setInterviewTimerSeconds] = useState<number>(30);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [answersRevealedCount, setAnswersRevealedCount] = useState<number>(0);

    /* Manual Question Form State */
    const [manualQuestionText, setManualQuestionText] = useState<string>('');
    const [manualHints, setManualHints] = useState<string>('');
    const [manualQuestions, setManualQuestions] = useState<any[]>([]);

    /* PDF Upload State */
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pdfQuestions, setPdfQuestions] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error("Please upload a PDF file only.");
                return;
            }
            setSelectedFile(file);
            setPdfQuestions([]); // Reset questions on new file
            toast.success(`Selected: ${file.name}`);
        }
    };

    const handleGenerateFromPDF = () => {
        if (!selectedFile) {
            toast.error("Please select a PDF file first.");
            return;
        }

        setIsGenerating(true);
        toast.loading("Analyzing PDF and generating questions...", { duration: 2000 });

        // Simulate mock generation after a short delay
        setTimeout(() => {
            const mockGenerated = [
                {
                    questionText: `Based on '${selectedFile.name}', can you explain the primary architectural patterns used in this system?`,
                    hints: "Think about MVC, Microservices, or Monolithic structures mentioned in the doc.",
                    correctAnswer: "The document highlights a Microservices architecture for scalability."
                },
                {
                    questionText: "What are the three main security protocols outlined in the introduction section of the PDF?",
                    hints: "Look for mentions of TLS, OAuth, or JWT.",
                    correctAnswer: "TLS 1.3, OAuth 2.0, and JWT authentication."
                },
                {
                    questionText: "According to the conclusions of this document, what is the projected growth for 2026?",
                    hints: "Check the 'Future Outlook' or 'Conclusion' chapter.",
                    correctAnswer: "A 25% year-over-year growth is projected."
                },
                {
                    questionText: "Identify the critical dependency mentioned in the technical prerequisites section.",
                    hints: "It's usually related to the runtime or database.",
                    correctAnswer: "Node.js version 20.x or higher is required."
                }
            ];

            setPdfQuestions(mockGenerated);
            setIsGenerating(false);
            toast.success("Questions generated from PDF!");
        }, 2000);
    };

    const handleStartInterview = () => {
        if (creationMode === 'manual') {
            if (manualQuestions.length === 0) {
                toast.error("Please add at least one question first.");
                return;
            }
            setInterviewQuestions(manualQuestions);
        } else if (creationMode === 'pdf') {
            if (pdfQuestions.length === 0) {
                toast.error("Please generate questions from the PDF first.");
                return;
            }
            setInterviewQuestions(pdfQuestions);
        } else {
            // Fallback for selection mode start (though usually blocked by UI)
            setInterviewQuestions([
                {
                    questionText: "Tell me about yourself.",
                    hints: "Keep it professional and focus on your recent experiences.",
                    correctAnswer: "Candidate should provide a concise summary of their background and key skills."
                }
            ]);
        }

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

    const handleSaveManualQuestion = () => {
        if (!manualQuestionText.trim()) {
            toast.error("Please enter a question.");
            return;
        }
        const newQuestion = {
            questionText: manualQuestionText,
            hints: manualHints,
            correctAnswer: manualHints || "No answer/hint provided" // Using hints as a reference or answer for now
        };
        setManualQuestions([...manualQuestions, newQuestion]);
        setManualQuestionText('');
        setManualHints('');
        toast.success("Question saved!");
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
            <Card className="shadow-lg border-purple-200 bg-purple-50/30">
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

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {interviewQuestions[currentInterviewIndex]?.questionText}
                                </h3>
                                {interviewQuestions[currentInterviewIndex]?.hints && (
                                    <p className="text-sm text-gray-500 italic">
                                        Hint: {interviewQuestions[currentInterviewIndex].hints}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8">
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
                                            <p className="text-sm text-green-800 font-semibold mb-1">Answer Reference:</p>
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
                                    setCreationMode('selection');
                                    setManualQuestions([]);
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700"
                            >
                                Back to Selection
                            </Button>
                        </div>
                    ) : creationMode === 'selection' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <Card
                                id="manual-mode-card"
                                className="group hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all duration-300 p-8 flex flex-col items-center gap-4 text-center border-2 border-dashed border-gray-200"
                                onClick={() => setCreationMode('manual')}
                            >
                                <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                    <PlusCircle className="h-10 w-10 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Create Manual Questions</h3>
                                    <p className="text-sm text-gray-500">Add questions and hints manually for a customized session.</p>
                                </div>
                            </Card>

                            <Card
                                id="pdf-mode-card"
                                className="group hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-300 p-8 flex flex-col items-center gap-4 text-center border-2 border-dashed border-gray-200"
                                onClick={() => setCreationMode('pdf')}
                            >
                                <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                    <FileText className="h-10 w-10 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Generate by PDF</h3>
                                    <p className="text-sm text-gray-500">Upload a PDF to automatically extract questions (Coming Soon).</p>
                                </div>
                            </Card>
                        </div>
                    ) : creationMode === 'manual' ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={() => setCreationMode('selection')}
                                    className="gap-2 text-gray-600"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Options
                                </Button>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manualQuestion">Question Text</Label>
                                    <Textarea
                                        id="manualQuestion"
                                        placeholder="Enter the question you want to ask..."
                                        value={manualQuestionText}
                                        onChange={(e) => setManualQuestionText(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manualHints">Optional Hints / Answer Key</Label>
                                    <Textarea
                                        id="manualHints"
                                        placeholder="Enter hints or the expected answer for reference..."
                                        value={manualHints}
                                        onChange={(e) => setManualHints(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <Button
                                    id="save-manual-question"
                                    onClick={handleSaveManualQuestion}
                                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Save Question
                                </Button>
                            </div>

                            {manualQuestions.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-800">Added Questions ({manualQuestions.length})</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {manualQuestions.map((q, idx) => (
                                            <div key={idx} className="p-4 bg-white border rounded-md text-sm">
                                                <p className="font-medium text-gray-900 mb-1">Q{idx + 1}: {q.questionText}</p>
                                                {q.hints && <p className="text-gray-500 italic">Hint: {q.hints}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        id="start-manual-interview"
                                        onClick={handleStartInterview}
                                        className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
                                    >
                                        Start Interview with {manualQuestions.length} Questions
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : creationMode === 'pdf' ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setCreationMode('selection');
                                    setPdfQuestions([]);
                                    setSelectedFile(null);
                                }}
                                className="gap-2 text-gray-600 mb-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Options
                            </Button>

                            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-800">Generate by PDF</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        Upload your study material in PDF format to generate relevant interview questions automatically.
                                    </p>
                                </div>

                                <div className="max-w-xs mx-auto text-left">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="pdf-upload">Select PDF Document</Label>
                                        <Input
                                            id="pdf-upload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="cursor-pointer bg-gray-50 border-dashed border-2 hover:bg-gray-100 transition-colors"
                                        />
                                        {selectedFile && (
                                            <p className="text-xs text-blue-600 font-medium">
                                                Selected: {selectedFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedFile && pdfQuestions.length === 0 && (
                                    <Button
                                        onClick={handleGenerateFromPDF}
                                        disabled={isGenerating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                                    >
                                        {isGenerating ? "Generating..." : "Generate Questions from PDF"}
                                    </Button>
                                )}
                            </div>

                            {pdfQuestions.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-purple-600" />
                                            Generated Preview ({pdfQuestions.length} Questions)
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGenerateFromPDF}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            Regenerate
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {pdfQuestions.map((q, idx) => (
                                            <div key={idx} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-gray-900 leading-tight">{q.questionText}</p>
                                                        {q.hints && (
                                                            <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded mt-2 border-l-2 border-purple-200">
                                                                <span className="font-semibold not-italic">Ref:</span> {q.hints}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={handleStartInterview}
                                        className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg shadow-lg hover:shadow-purple-200 transition-all font-bold"
                                    >
                                        Start Interview Session
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Button
                                variant="outline"
                                onClick={() => setCreationMode('selection')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Return to Mode Selection
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InterviewMode;
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
