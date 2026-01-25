import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Save, Brain, ArrowLeft, Loader2, FileCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DraftQuestion {
    questionText: string;
    options: string[];
    correctAnswer: string;
    marks?: number;
    timeLimit?: number;
    hints?: string;
}

const PdfQuizCreator = () => {
    const { addQuiz } = useQuiz();
    const navigate = useNavigate();

    // Config
    const [courseName, setCourseName] = useState<string>('');
    const [numQuestions, setNumQuestions] = useState<number>(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [extractionProgress, setExtractionProgress] = useState<number>(0);

    const [previewQuestions, setPreviewQuestions] = useState<DraftQuestion[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validation
            if (file.type !== 'application/pdf') {
                toast.error("Invalid file format. Please upload a PDF.");
                return;
            }
            if (file.size > 20 * 1024 * 1024) { // 20MB
                toast.error("File is too large. Max limit is 20MB.");
                return;
            }

            setSelectedFile(file);
            setExtractedText('');
            setPreviewQuestions([]);
            await extractFormat(file);
        }
    };

    const extractFormat = async (file: File) => {
        setIsExtracting(true);
        setExtractionProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');

                // Basic cleanup
                fullText += pageText + '\n';

                // Update progress
                setExtractionProgress(Math.round((i / totalPages) * 100));
            }

            // Remove excessive whitespace/headers
            const cleaned = fullText.replace(/\s+/g, ' ').trim();
            setExtractedText(cleaned);
            toast.success(`Extracted ${cleaned.length} characters from ${totalPages} pages.`);

        } catch (error: any) {
            console.error("PDF Extraction Error:", error);
            toast.error("Failed to parse PDF. Ensure it is text-based (not scanned images).");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerate = async () => {
        if (!extractedText) {
            toast.error("No text content found.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("AI is analyzing text and generating questions...");

        try {
            const response = await fetch('http://localhost:5000/api/ai/generate-from-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textContent: extractedText,
                    count: numQuestions,
                    difficulty: difficulty,
                    optionsCount: 4
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server error");
            }

            const data = await response.json();

            // Map to DraftQuestion format
            const generated: DraftQuestion[] = data.questions.map((q: any) => ({
                questionText: q.question,
                options: q.options,
                correctAnswer: q.options[q.correctIndex || 0],
                marks: 1,
                timeLimit: 60,
                hints: q.explanation // Storing explanation as hints
            }));

            setPreviewQuestions(generated);
            toast.success(`Generated ${generated.length} questions successfully!`);

        } catch (error: any) {
            console.error(error);
            toast.error(`Generation Failed: ${error.message}`);
        } finally {
            toast.dismiss(toastId);
            setIsGenerating(false);
        }
    };

    const handleProceedToEditor = () => {
        if (previewQuestions.length === 0) return;

        // Save to active session for QuestionCreator
        // Note: Using 'activeCreationSession' key to pre-load data into QuestionCreator
        const sessionData = {
            numQuestions: previewQuestions.length,
            numOptions: 4,
            draftQuestions: previewQuestions.map(q => ({
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                marks: 1,
                timeLimitMinutes: 1, // Defaulting to 1 min
            })),
            questionSetName: selectedFile?.name?.replace('.pdf', '') + ' (AI)',
            courseName: courseName || 'General',
            step: 2, // Jump to editor (Step 2 of QuestionCreator)
            currentSetId: null,
            passMarkPercentage: 50,
            requiredCorrectAnswers: Math.ceil(previewQuestions.length * 0.5)
        };

        localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));

        // Navigate to 'manual' view which renders QuestionCreator
        // Ensure query params match what QuestionCreator expects
        navigate('/teacher/create-quiz?step=manual&qSetup=true&qStep=2');
        toast.success("Questions transferred to editor!");
    };

    return (
        <div className="space-y-8 pb-20">
            <Card className="shadow-xl bg-white rounded-3xl overflow-hidden border-0">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <h2 className="text-3xl font-black flex items-center gap-3">
                        <FileText className="h-8 w-8" />
                        Document to Quiz
                    </h2>
                    <p className="opacity-80 mt-2 font-medium">Extract content from PDFs and generate exams instantly.</p>
                </div>

                <CardContent className="p-8 space-y-8">
                    {/* 1. UPLOAD & EXTRACT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-lg font-bold text-gray-700">1. Upload Document</Label>
                                <div className="border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-2xl p-8 text-center hover:bg-blue-50 transition-colors relative group">
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isExtracting}
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {isExtracting ? (
                                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                            ) : selectedFile ? (
                                                <FileCheck className="h-8 w-8 text-green-600" />
                                            ) : (
                                                <FileText className="h-8 w-8 text-blue-300" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-gray-700 text-lg">
                                                {selectedFile ? selectedFile.name : "Click to Upload PDF"}
                                            </p>
                                            <p className="text-sm text-gray-400 font-medium">Max 20MB • Text-based PDFs only</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isExtracting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-600">
                                        <span>Extracting Text...</span>
                                        <span>{extractionProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CONFIGURATION */}
                        <div className="space-y-6">
                            <Label className="text-lg font-bold text-gray-700">2. Configuration</Label>
                            <div className="bg-gray-50 rounded-2xl p-6 space-y-6 border border-gray-100">
                                <div className="space-y-2">
                                    <Label>Course / Subject Name</Label>
                                    <Input
                                        placeholder="e.g. History 101"
                                        value={courseName}
                                        onChange={e => setCourseName(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Question Count</Label>
                                        <Input
                                            type="number"
                                            min={1} max={20}
                                            value={numQuestions}
                                            onChange={e => setNumQuestions(Number(e.target.value))}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Difficulty</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value as any)}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!extractedText || isGenerating || isExtracting}
                                className="w-full h-14 bg-black hover:bg-gray-800 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin h-5 w-5" /> Generating...
                                    </span>
                                ) : !extractedText ? (
                                    <span className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" /> Waiting for Content...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" /> Generate from Content
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* 2. PREVIEW TEXT (Collapsible/Scrollable) */}
                    {extractedText && (
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Extracted Context Preview</Label>
                            <div className="bg-slate-50 p-4 rounded-xl border text-xs text-gray-600 font-mono h-32 overflow-y-auto leading-relaxed">
                                {extractedText.substring(0, 2000)}...
                            </div>
                        </div>
                    )}

                    {/* 3. GENERATED RESULTS */}
                    {previewQuestions.length > 0 && (
                        <div className="space-y-6 pt-8 border-t-2 border-dashed">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-gray-800">Generated Preview</h3>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setPreviewQuestions([])}>Discard</Button>
                                    <Button onClick={handleProceedToEditor} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                                        Edit & Publish <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {previewQuestions.map((q, idx) => (
                                    <div key={idx} className="p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-colors group">
                                        <div className="flex gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center">{idx + 1}</span>
                                            <div className="space-y-3 flex-1">
                                                <p className="font-bold text-lg text-gray-800">{q.questionText}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className={`p-3 rounded-lg text-sm font-medium border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                                            {opt}
                                                            {opt === q.correctAnswer && <span className="ml-2 text-green-600">✓</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.hints && (
                                                    <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded inline-block font-medium">
                                                        ℹ️ {q.hints}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PdfQuizCreator;
