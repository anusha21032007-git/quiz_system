"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain, Trophy, PlusCircle, FileText, ArrowLeft, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const InterviewMode = () => {
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
    const [setupNumQuestions, setSetupNumQuestions] = useState<number>(0);
    const [setupNumOptions, setSetupNumOptions] = useState<number>(0);
    const [setupTimePerQuestion, setSetupTimePerQuestion] = useState<number>(30);
    const [setupMarksPerQuestion, setSetupMarksPerQuestion] = useState<number>(0);
    const [setupNegativeMarks, setSetupNegativeMarks] = useState<number>(0);

    /* Manual Question Form State */
    const [manualQuestionText, setManualQuestionText] = useState<string>('');
    const [manualHints, setManualHints] = useState<string>('');
    const [manualQuestions, setManualQuestions] = useState<any[]>([]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pdfQuestions, setPdfQuestions] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Persistence logic for InterviewMode
    useEffect(() => {
        const saved = localStorage.getItem('interviewModeState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.creationMode) setCreationMode(parsed.creationMode);
                if (parsed.pdfSubMode) setPdfSubMode(parsed.pdfSubMode);
                if (parsed.manualStep) setManualStep(parsed.manualStep);
                if (parsed.setupNumQuestions) setSetupNumQuestions(parsed.setupNumQuestions);
                if (parsed.setupNumOptions) setSetupNumOptions(parsed.setupNumOptions);
                if (parsed.setupTimePerQuestion) setSetupTimePerQuestion(parsed.setupTimePerQuestion);
                if (parsed.setupMarksPerQuestion) setSetupMarksPerQuestion(parsed.setupMarksPerQuestion);
                if (parsed.setupNegativeMarks) setSetupNegativeMarks(parsed.setupNegativeMarks);
                if (parsed.manualQuestions) setManualQuestions(parsed.manualQuestions);
                if (parsed.pdfQuestions) setPdfQuestions(parsed.pdfQuestions);
            } catch (e) {
                console.error("Failed to restore InterviewMode session", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = {
            creationMode,
            pdfSubMode,
            manualStep,
            setupNumQuestions,
            setupNumOptions,
            setupTimePerQuestion,
            setupMarksPerQuestion,
            setupNegativeMarks,
            manualQuestions,
            pdfQuestions
        };
        localStorage.setItem('interviewModeState', JSON.stringify(stateToSave));
    }, [
        creationMode, pdfSubMode, manualStep, setupNumQuestions, setupNumOptions,
        setupTimePerQuestion, setupMarksPerQuestion, setupNegativeMarks,
        manualQuestions, pdfQuestions
    ]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error("Please upload a PDF file only.");
                return;
            }
            setSelectedFile(file);
            setPdfQuestions([]);
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
            toast.dismiss(loadToast);
            toast.success(pdfSubMode === 'ai' ? "AI Questions Generated!" : "Questions Extracted!");
        }, 2000);
    };

    const handleManualSetupSubmit = () => {
        if (setupNumQuestions <= 0) {
            toast.error("Number of questions must be greater than 0.");
            return;
        }
        if (setupNumOptions < 2) {
            toast.error("Options per question must be at least 2.");
            return;
        }
        if (setupMarksPerQuestion <= 0) {
            toast.error("Marks per question must be greater than 0.");
            return;
        }

        const questions = Array.from({ length: setupNumQuestions }).map(() => ({
            questionText: '',
            options: Array.from({ length: setupNumOptions }).map(() => ''),
            correctAnswer: '',
            marks: setupMarksPerQuestion,
            negativeMarks: setupNegativeMarks,
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
            // If the modified option was the selected answer, update it? 
            // Better to match by value if we store value strings. 
            // But if we change the text of the selected option, we should update the correct answer too?
            // For simplicity, let's assume user selects radio AFTER typing.
            // If they change text of selected answer, we might need to re-select.
            if (updatedQuestions[qIdx].correctAnswer === manualQuestions[qIdx].options[optIdx]) {
                updatedQuestions[qIdx].correctAnswer = value;
            }
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
        toast.success("Manual Competitive Session Started!");
    };

    // Helper to start session logic extracted and reused
    const startSession = (timeLimit: number) => {
        setCurrentInterviewIndex(0);
        setShowInterviewAnswer(false);
        setInterviewMode(true);
        setIsFinished(false);
        setAnswersRevealedCount(0);
        setInterviewTimerEnabled(true);
        setInterviewTimerSeconds(timeLimit);
        setRemainingTime(timeLimit);
    };

    const handleStartInterview = () => {
        if (creationMode === 'manual') {
            if (manualQuestions.length === 0) {
                toast.error("Please add at least one question first.");
                return;
            }
            setInterviewQuestions(manualQuestions);
            startSession(setupTimePerQuestion); // Use setup time for manual
            toast.success(`Manual Competitive Session Started!`);
            return; // Early return as we started manually above logic might duplicate or differ
        } else if (creationMode === 'pdf') {
            if (pdfQuestions.length === 0) {
                toast.error("Please generate questions from the PDF first.");
                return;
            }
            setInterviewQuestions(pdfQuestions);
            startSession(30); // Default for PDF
            toast.success(`Competitive Session Started!`);
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
                setRemainingTime(remainingTime !== null ? interviewTimerSeconds : null);
                // Actually reset to the initial per-question time
                const q = interviewQuestions[currentInterviewIndex + 1];
                setRemainingTime(q.timeLimit || interviewTimerSeconds);
            }
        } else {
            setIsFinished(true);
            setInterviewMode(false);
            setRemainingTime(null);
            localStorage.removeItem('interviewModeState');
            toast.info("Competitive Session Completed!");
        }
    };

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
            <Card className="shadow-none border-2 border-black bg-white rounded-xl">
                <CardHeader className="border-b-2 border-gray-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-black">
                        <Brain className="h-6 w-6 text-black" />
                        Competitive Mode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {interviewMode ? (
                        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    Question {currentInterviewIndex + 1} of {interviewQuestions.length}
                                </span>
                                <div className="flex items-center gap-3">
                                    {interviewTimerEnabled && remainingTime !== null && (
                                        <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-lg border-2 ${remainingTime <= 5 ? 'border-red-500 text-red-600 bg-red-50' : 'border-black text-black bg-white'}`}>
                                            {remainingTime}s
                                        </div>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => { setInterviewMode(false); localStorage.removeItem('interviewModeState'); }} className="text-gray-500 hover:text-red-500">
                                        Exit Session
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

                            <div className="mt-8 border-t-2 border-gray-100 pt-6">
                                {!showInterviewAnswer ? (
                                    <Button onClick={() => { setShowInterviewAnswer(true); setAnswersRevealedCount(prev => prev + 1); }} className="w-full py-6 text-lg font-bold bg-black text-white hover:bg-gray-800 border-2 border-transparent hover:border-black rounded-lg transition-all">
                                        Reveal Answer
                                    </Button>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-xl">
                                            <p className="text-xs text-gray-500 font-bold uppercase mb-2 tracking-wide">Correct Answer</p>
                                            <p className="text-lg text-gray-900 font-medium leading-relaxed">
                                                {interviewQuestions[currentInterviewIndex]?.correctAnswer}
                                            </p>
                                        </div>
                                        <Button onClick={handleNextInterviewQuestion} className="w-full py-6 text-lg font-bold border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all rounded-lg">
                                            {currentInterviewIndex < interviewQuestions.length - 1 ? "Next Question" : "Finish Interview"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : isFinished ? (
                        <div className="bg-white p-8 rounded-xl border-2 border-gray-200 text-center animate-in zoom-in-95">
                            <h3 className="text-2xl font-bold text-black mb-8 flex items-center justify-center gap-3">
                                <Trophy className="h-8 w-8 text-black" />
                                Session Completed
                            </h3>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-black transition-colors">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Total Questions</p>
                                    <p className="text-4xl font-bold text-black">{interviewQuestions.length}</p>
                                </div>
                                <div className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-black transition-colors">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Answers Revealed</p>
                                    <p className="text-4xl font-bold text-black">{answersRevealedCount}</p>
                                </div>
                            </div>
                            <Button onClick={() => {
                                setInterviewMode(false);
                                setIsFinished(false);
                                setCreationMode('selection');
                                setManualQuestions([]);
                                localStorage.removeItem('interviewModeState');
                            }} className="min-w-[200px] py-6 font-bold bg-black text-white hover:bg-gray-800 rounded-lg">
                                Return to Menu
                            </Button>
                        </div>
                    ) : creationMode === 'selection' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <Card className="group cursor-pointer p-8 flex flex-col items-center gap-6 text-center border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 rounded-xl" onClick={() => setCreationMode('manual')}>
                                <div className="p-5 bg-white border-2 border-gray-200 rounded-full group-hover:border-black transition-colors shadow-sm">
                                    <PlusCircle className="h-10 w-10 text-gray-700 group-hover:text-black" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-2">Manual Entry</h3>
                                    <p className="text-sm text-gray-500 font-medium">Create custom questions one by one.</p>
                                </div>
                            </Card>
                            <Card className="group cursor-pointer p-8 flex flex-col items-center gap-6 text-center border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all duration-300 rounded-xl" onClick={() => setCreationMode('pdf')}>
                                <div className="p-5 bg-white border-2 border-gray-200 rounded-full group-hover:border-black transition-colors shadow-sm">
                                    <FileText className="h-10 w-10 text-gray-700 group-hover:text-black" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-2">PDF Generation</h3>
                                    <p className="text-sm text-gray-500 font-medium">Auto-generate questions from documents.</p>
                                </div>
                            </Card>
                        </div>
                    ) : creationMode === 'manual' ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setCreationMode('selection');
                                        setManualStep('setup');
                                        setManualQuestions([]);
                                    }}
                                    className="gap-2 text-gray-600"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Options
                                </Button>
                                {manualStep === 'input' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setManualStep('setup')}
                                        className="gap-2"
                                    >
                                        Adjust Setup
                                    </Button>
                                )}
                            </div>

                            {manualStep === 'setup' ? (
                                <Card className="border-2 border-gray-200 shadow-none rounded-xl">
                                    <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                                        <CardTitle className="text-lg font-bold text-black">Step 1: Configuration</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Number of Questions</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={50}
                                                    value={setupNumQuestions}
                                                    onChange={(e) => setSetupNumQuestions(parseInt(e.target.value) || 0)}
                                                    className={cn(setupNumQuestions === 0 ? "border-red-300 focus:border-red-500" : "")}
                                                />
                                                {setupNumQuestions === 0 && <p className="text-xs text-red-500">At least 1 question is required.</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Options per Question</Label>
                                                <Input
                                                    type="number"
                                                    min={2}
                                                    max={6}
                                                    value={setupNumOptions}
                                                    onChange={(e) => setSetupNumOptions(parseInt(e.target.value) || 0)}
                                                    className={cn(setupNumOptions < 2 ? "border-red-300 focus:border-red-500" : "")}
                                                />
                                                {setupNumOptions < 2 && <p className="text-xs text-red-500">Minimum 2 options required.</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Time per Question (seconds)</Label>
                                                <Input
                                                    type="number"
                                                    min={5}
                                                    value={setupTimePerQuestion}
                                                    onChange={(e) => setSetupTimePerQuestion(parseInt(e.target.value) || 30)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Marks per Question</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={setupMarksPerQuestion}
                                                    onChange={(e) => setSetupMarksPerQuestion(parseInt(e.target.value) || 0)}
                                                    className={cn(setupMarksPerQuestion === 0 ? "border-red-300 focus:border-red-500" : "")}
                                                />
                                                {setupMarksPerQuestion === 0 && <p className="text-xs text-red-500">Marks must be greater than 0.</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Negative Marks (Optional)</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={setupNegativeMarks}
                                                    onChange={(e) => setSetupNegativeMarks(parseFloat(e.target.value) || 0)}
                                                    step="0.25"
                                                    placeholder="e.g. 0.25 (Default: 0)"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleManualSetupSubmit}
                                            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-6 text-lg mt-4 rounded-lg shadow-none"
                                            disabled={setupNumQuestions <= 0 || setupNumOptions < 2 || setupMarksPerQuestion <= 0}
                                        >
                                            Proceed to Question Entry
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-8">
                                    <div className="bg-white p-6 rounded-xl border-2 border-black flex flex-col sm:flex-row justify-between items-center sticky top-0 z-10 shadow-sm gap-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-black">Step 2: Enter Questions</h3>
                                            <p className="text-sm text-gray-500 font-medium">
                                                {setupNumQuestions} Questions • {setupNumOptions} Options Each • {setupTimePerQuestion}s Limit
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleStartManualInterview}
                                            className="bg-black hover:bg-gray-800 text-white font-bold py-6 px-8 rounded-lg"
                                        >
                                            Start Session
                                        </Button>
                                    </div>

                                    <div className="space-y-6">
                                        {manualQuestions.map((q, qIdx) => (
                                            <Card key={qIdx} className="overflow-hidden border-2 border-gray-100 hover:border-purple-200 transition-colors">
                                                <CardHeader className="bg-gray-50/50 py-3 border-b border-gray-100">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-500">Question {qIdx + 1}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 space-y-6">
                                                    <div className="space-y-2">
                                                        <Label>Question Text <span className="text-red-500">*</span></Label>
                                                        <Textarea
                                                            value={q.questionText}
                                                            onChange={(e) => handleManualQuestionChange(qIdx, 'questionText', e.target.value)}
                                                            placeholder={`Enter question ${qIdx + 1}...`}
                                                            className="resize-none"
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label>Options & Correct Answer <span className="text-red-500">*</span></Label>
                                                        <RadioGroup
                                                            value={q.correctAnswer}
                                                            onValueChange={(val) => handleManualQuestionChange(qIdx, 'correctAnswer', val)}
                                                        >
                                                            {q.options.map((opt: string, optIdx: number) => (
                                                                <div key={optIdx} className="flex items-center gap-3">
                                                                    <div className="flex items-center h-10 w-10 justify-center">
                                                                        <RadioGroupItem value={opt || `idx-${optIdx}`} id={`q${qIdx}-opt${optIdx}`} disabled={!opt} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <Input
                                                                            value={opt}
                                                                            onChange={(e) => handleManualQuestionChange(qIdx, 'option', e.target.value, optIdx)}
                                                                            placeholder={`Option ${optIdx + 1}`}
                                                                            className={cn(
                                                                                q.correctAnswer === opt && opt !== '' ? "border-green-500 bg-green-50" : ""
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                        <p className="text-xs text-gray-500 ml-12">
                                                            * Type an option first, then select the radio button to mark it as correct.
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="flex justify-center pt-8 pb-12">
                                        <Button
                                            onClick={handleStartManualInterview}
                                            className="w-full max-w-md bg-green-600 hover:bg-green-700 py-6 text-xl font-bold shadow-lg hover:shadow-green-200 hover:-translate-y-1 transition-all"
                                        >
                                            Start Create Competitive Session
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
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
                                {pdfSubMode !== 'selection' ? "Back to PDF Options" : "Back to Selection"}
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
                                        Start Competitive Session
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default InterviewMode;

