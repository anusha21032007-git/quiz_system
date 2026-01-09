"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, Trophy, PlusCircle, FileText, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const InterviewMode = () => {
    /* Interview Mode State */
    const [interviewMode, setInterviewMode] = useState<boolean>(false);
    const [creationMode, setCreationMode] = useState<'selection' | 'manual' | 'pdf'>('selection');
    const [pdfSubMode, setPdfSubMode] = useState<'selection' | 'ai' | 'extract'>('selection');
    const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
    const [currentInterviewIndex, setCurrentInterviewIndex] = useState<number>(0);
    const [showInterviewAnswer, setShowInterviewAnswer] = useState<boolean>(false);
    const [interviewTimerEnabled, setInterviewTimerEnabled] = useState<boolean>(false);
    const [interviewTimerSeconds, setInterviewTimerSeconds] = useState<number>(30);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [answersRevealedCount, setAnswersRevealedCount] = useState<number>(0);

    const [manualStep, setManualStep] = useState<'setup' | 'input'>('setup');

    /* Manual Setup Criteria */
    const [setupNumQuestions, setSetupNumQuestions] = useState<number>(5);
    const [setupNumOptions, setSetupNumOptions] = useState<number>(4);
    const [setupTimePerQuestion, setSetupTimePerQuestion] = useState<number>(30);
    const [setupMarksPerQuestion, setSetupMarksPerQuestion] = useState<number>(1);

    /* Manual Question Form State */
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
        const loadToast = toast.loading(pdfSubMode === 'ai' ? "AI is thinking..." : "Extracting questions...");

        // Simulate mock generation after a short delay
        setTimeout(() => {
            let mockGenerated = [];
            if (pdfSubMode === 'ai') {
                mockGenerated = [
                    {
                        questionText: `Based on '${selectedFile.name}', can you explain the primary architectural patterns used in this system?`,
                        correctAnswer: "The document highlights a Microservices architecture for scalability.",
                        options: ["Monolithic", "Microservices", "MVC", "Serverless"]
                    },
                    {
                        questionText: "What are the three main security protocols outlined in the introduction section of the PDF?",
                        correctAnswer: "TLS 1.3, OAuth 2.0, and JWT authentication.",
                        options: ["HTTP, FTP, SMTP", "TLS 1.3, OAuth 2.0, JWT", "WPA2, WEP, TKIP", "MD5, SHA1, SHA256"]
                    }
                ];
            } else {
                mockGenerated = [
                    {
                        questionText: "Q1. What is the capital of France?",
                        correctAnswer: "Paris",
                        options: ["London", "Berlin", "Paris", "Madrid"]
                    },
                    {
                        questionText: "Q2. Which planet is known as the Red Planet?",
                        correctAnswer: "Mars",
                        options: ["Venus", "Mars", "Jupiter", "Saturn"]
                    }
                ];
            }

            setPdfQuestions(mockGenerated);
            setIsGenerating(false);
            toast.dismiss(loadToast);
            toast.success(pdfSubMode === 'ai' ? "AI Questions Generated!" : "Questions Extracted!");
        }, 2000);
    };

    const handleManualSetupSubmit = () => {
        const questions = Array.from({ length: setupNumQuestions }).map(() => ({
            questionText: '',
            options: Array.from({ length: setupNumOptions }).map(() => ''),
            correctAnswer: '',
            marks: setupMarksPerQuestion,
            timeLimit: setupTimePerQuestion
        }));
        setManualQuestions(questions);
        setManualStep('input');
        toast.success("Setup complete! Please enter your questions.");
    };

    const handleManualQuestionChange = (qIdx: number, field: string, value: any, optIdx?: number) => {
        const updatedQuestions = [...manualQuestions];
        if (field === 'questionText') {
            updatedQuestions[qIdx].questionText = value;
        } else if (field === 'option' && optIdx !== undefined) {
            updatedQuestions[qIdx].options[optIdx] = value;
        } else if (field === 'correctAnswer') {
            updatedQuestions[qIdx].correctAnswer = value;
        }
        setManualQuestions(updatedQuestions);
    };

    const handleStartManualInterview = () => {
        const isValid = manualQuestions.every(q =>
            q.questionText.trim() !== '' &&
            q.correctAnswer !== '' &&
            q.options.every(opt => opt.trim() !== '')
        );

        if (!isValid) {
            toast.error("Please fill in all questions, options, and select correct answers.");
            return;
        }

        setInterviewQuestions(manualQuestions);
        startSession(setupTimePerQuestion);
        toast.success("Manual Interview Started!");
    };

    const handleStartInterview = () => {
        if (creationMode === 'manual') {
            handleStartManualInterview();
            return;
        }

        const questionsToUse = creationMode === 'pdf' ? pdfQuestions : [];
        if (questionsToUse.length === 0) {
            toast.error("No questions available to start the interview.");
            return;
        }

        setInterviewQuestions(questionsToUse);
        startSession(interviewTimerSeconds);
        toast.success(`Interview Session Started!`);
    };

    const startSession = (timeLimit: number) => {
        setCurrentInterviewIndex(0);
        setShowInterviewAnswer(false);
        setInterviewMode(true);
        setIsFinished(false);
        setAnswersRevealedCount(0);
        setInterviewTimerEnabled(true);
        setRemainingTime(timeLimit);
    };

    const handleNextInterviewQuestion = () => {
        if (currentInterviewIndex < interviewQuestions.length - 1) {
            setCurrentInterviewIndex(prev => prev + 1);
            setShowInterviewAnswer(false);
            if (interviewTimerEnabled) {
                setRemainingTime(remainingTime !== null ? interviewTimerSeconds : null);
                // Actually reset to the initial per-question time
                const q = interviewQuestions[currentInterviewIndex + 1];
                setRemainingTime(q.timeLimit || interviewTimerSeconds);
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
                                {interviewQuestions[currentInterviewIndex]?.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                        {interviewQuestions[currentInterviewIndex].options.map((opt: string, i: number) => (
                                            <div key={i} className="p-3 bg-gray-50 border rounded-lg text-sm">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
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
                                    <p className="text-sm text-gray-500">Add questions and MCQ options manually.</p>
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
                                    <p className="text-sm text-gray-500">AI generation or PDF extraction options.</p>
                                </div>
                            </Card>
                        </div>
                    ) : creationMode === 'manual' ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (manualStep === 'input') setManualStep('setup');
                                        else setCreationMode('selection');
                                    }}
                                    className="gap-2 text-gray-600"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {manualStep === 'input' ? "Back to Setup" : "Back to Options"}
                                </Button>
                            </div>

                            {manualStep === 'setup' ? (
                                <Card className="border-purple-100">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-gray-800">Manual Interview Setup</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                                <Input
                                                    id="numQuestions"
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    value={setupNumQuestions}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setSetupNumQuestions('' as any); // Allow transient empty state
                                                            return;
                                                        }
                                                        const num = parseInt(val);
                                                        if (num < 1 || num > 20) {
                                                            toast.error("Number of questions must be between 1 and 20.");
                                                            return;
                                                        }
                                                        setSetupNumQuestions(num);
                                                    }}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="numOptions">Number of MCQ Options</Label>
                                                <Input
                                                    id="numOptions"
                                                    type="number"
                                                    min={2}
                                                    max={6}
                                                    value={setupNumOptions}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setSetupNumOptions('' as any);
                                                            return;
                                                        }
                                                        const num = parseInt(val);
                                                        if (num < 2 || num > 6) {
                                                            toast.error("MCQ Options must be between 2 and 6.");
                                                            return;
                                                        }
                                                        setSetupNumOptions(num);
                                                    }}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="timePerQ">Time per Question (seconds)</Label>
                                                <Input
                                                    id="timePerQ"
                                                    type="number"
                                                    min={10}
                                                    max={300}
                                                    step={10}
                                                    value={setupTimePerQuestion}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setSetupTimePerQuestion('' as any);
                                                            return;
                                                        }
                                                        const num = parseInt(val);
                                                        if (num < 10 || num > 300) {
                                                            toast.error("Time must be between 10 and 300 seconds.");
                                                            return;
                                                        }
                                                        setSetupTimePerQuestion(num);
                                                    }}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="marksPerQ">Marks per Question</Label>
                                                <Input
                                                    id="marksPerQ"
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={setupMarksPerQuestion}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setSetupMarksPerQuestion('' as any);
                                                            return;
                                                        }
                                                        const num = parseInt(val);
                                                        if (num < 1 || num > 10) {
                                                            toast.error("Marks must be between 1 and 10.");
                                                            return;
                                                        }
                                                        setSetupMarksPerQuestion(num);
                                                    }}
                                                    onKeyDown={(e) => e.preventDefault()}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleManualSetupSubmit}
                                            className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
                                        >
                                            Next: Enter Questions
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-8 pb-10">
                                    {manualQuestions.map((q, qIdx) => (
                                        <Card key={qIdx} className="overflow-hidden border-purple-100 shadow-md">
                                            <div className="bg-purple-600 px-4 py-2 text-white font-bold text-sm">
                                                Question {qIdx + 1}
                                            </div>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-purple-700 font-bold">Question Text</Label>
                                                    <Textarea
                                                        placeholder={`Enter Question ${qIdx + 1}...`}
                                                        value={q.questionText}
                                                        onChange={(e) => handleManualQuestionChange(qIdx, 'questionText', e.target.value)}
                                                        className="min-h-[80px] border-purple-200 focus:border-purple-400"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-purple-700 font-bold">Options & Correct Answer</Label>
                                                    <RadioGroup
                                                        value={q.correctAnswer}
                                                        onValueChange={(val) => handleManualQuestionChange(qIdx, 'correctAnswer', val)}
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {q.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                    <RadioGroupItem value={optIdx.toString()} id={`q${qIdx}-opt${optIdx}`} />
                                                                    <Input
                                                                        placeholder={`Option ${optIdx + 1}`}
                                                                        value={opt}
                                                                        onChange={(e) => handleManualQuestionChange(qIdx, 'option', e.target.value, optIdx)}
                                                                        className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 shadow-none text-sm"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </RadioGroup>
                                                    <p className="text-[10px] text-gray-500 italic">* Correct answer selection is mandatory</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Button
                                        onClick={handleStartManualInterview}
                                        className="w-full bg-purple-700 hover:bg-purple-800 py-7 text-xl font-bold rounded-xl shadow-lg shadow-purple-200"
                                    >
                                        Start Interview Session
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : creationMode === 'pdf' ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (pdfSubMode !== 'selection') setPdfSubMode('selection');
                                    else setCreationMode('selection');
                                }}
                                className="gap-2 text-gray-600 mb-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {pdfSubMode !== 'selection' ? "Back to PDF Options" : "Back to Selection"}
                            </Button>

                            {pdfSubMode === 'selection' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <Card
                                        className="group hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-300 p-8 flex flex-col items-center gap-4 text-center border-2 border-dashed border-gray-200"
                                        onClick={() => setPdfSubMode('ai')}
                                    >
                                        <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                            <Brain className="h-10 w-10 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Generate with AI</h3>
                                            <p className="text-sm text-gray-500">Upload PDF and let AI create study questions for you.</p>
                                        </div>
                                    </Card>

                                    <Card
                                        className="group hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all duration-300 p-8 flex flex-col items-center gap-4 text-center border-2 border-dashed border-gray-200"
                                        onClick={() => setPdfSubMode('extract')}
                                    >
                                        <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                            <FileText className="h-10 w-10 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Question PDF</h3>
                                            <p className="text-sm text-gray-500">Upload a PDF containing questions to extract and display them.</p>
                                        </div>
                                    </Card>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
                                    <div className={`mx-auto w-16 h-16 ${pdfSubMode === 'ai' ? 'bg-blue-50' : 'bg-green-50'} rounded-full flex items-center justify-center`}>
                                        {pdfSubMode === 'ai' ? <Brain className="h-8 w-8 text-blue-600" /> : <FileText className="h-8 w-8 text-green-600" />}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-gray-800">
                                            {pdfSubMode === 'ai' ? "AI Interview Generation" : "Question Extraction"}
                                        </h3>
                                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                            {pdfSubMode === 'ai'
                                                ? "Upload your study material to generate AI questions."
                                                : "Upload a PDF with numbered questions to display them."}
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
                                                <p className="text-xs text-blue-600 font-medium truncate">
                                                    Selected: {selectedFile.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedFile && (
                                        <Button
                                            onClick={handleGenerateFromPDF}
                                            disabled={isGenerating}
                                            className={`w-full ${pdfSubMode === 'ai' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} py-6 text-lg`}
                                        >
                                            {isGenerating ? "Processing..." : (pdfSubMode === 'ai' ? "Generate with AI" : "Extract Questions")}
                                        </Button>
                                    )}

                                    {pdfQuestions.length > 0 && !isGenerating && (
                                        <div className="mt-8 pt-6 border-t space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-800">Preview ({pdfQuestions.length} Questions)</h4>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-left">
                                                {pdfQuestions.map((q, idx) => (
                                                    <div key={idx} className="p-3 bg-gray-50 border rounded-md text-sm">
                                                        <p className="font-medium text-gray-900">{idx + 1}. {q.questionText}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                onClick={handleStartInterview}
                                                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-bold"
                                            >
                                                Start Session
                                            </Button>
                                        </div>
                                    )}
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
