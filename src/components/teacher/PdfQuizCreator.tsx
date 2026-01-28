import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Save, Brain, ArrowLeft, Loader2, FileCheck, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';

// IMPORTANT: Set worker source using Vite's URL import for reliability
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface DraftQuestion {
    questionText: string;
    options: string[];
    correctAnswer: string;
    marks?: number;
    timeLimit?: number;
    hints?: string;
}

const PdfQuizCreator = ({ onBack }: { onBack: () => void }) => {
    const { addQuiz } = useQuiz();
    const navigate = useNavigate();

    // Config
    const [courseName, setCourseName] = useState<string>('');
    const [numQuestions, setNumQuestions] = useState<number>(5); // Total to Generate (Pool)
    const [numAttend, setNumAttend] = useState<number>(5); // To Attend
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [useVisionMode, setUseVisionMode] = useState<boolean>(false);
    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [extractedText, setExtractedText] = useState<string>('');
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [extractionProgress, setExtractionProgress] = useState<number>(0);

    const [previewQuestions, setPreviewQuestions] = useState<DraftQuestion[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRemoveFile = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedFile(null);
        setExtractedText('');
        setExtractedImages([]);
        setPreviewQuestions([]);
        setExtractionProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.info("File removed");
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error("Invalid file format. Please upload a PDF.");
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                toast.error("File is too large. Max limit is 20MB.");
                return;
            }

            setSelectedFile(file);
            setExtractedText('');
            setExtractedImages([]);
            setPreviewQuestions([]);
            await extractFormat(file, useVisionMode);
        }
    };

    // Reload extraction if mode changes
    useEffect(() => {
        if (selectedFile) {
            extractFormat(selectedFile, useVisionMode);
        }
    }, [useVisionMode]);

    const extractFormat = async (file: File, visionMode: boolean) => {
        setIsExtracting(true);
        setExtractionProgress(0);
        setExtractedText('');
        setExtractedImages([]);

        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const totalPages = pdf.numPages;

            if (visionMode) {
                // IMAGE EXTRACTION (Vision Mode)
                const images: string[] = [];
                const maxPages = Math.min(totalPages, 5); // Limit to 5 pages for API safety

                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 }); // Good quality for text reading
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({
                            canvasContext: context,
                            viewport: viewport,
                            canvas: canvas
                        }).promise;

                        // Convert to base64 JPEG
                        images.push(canvas.toDataURL('image/jpeg', 0.8));
                    }
                    setExtractionProgress(Math.round((i / maxPages) * 100));
                }

                setExtractedImages(images);
                toast.success(`Captured ${images.length} pages as images for Vision AI.`);

            } else {
                // TEXT EXTRACTION (Standard Mode)
                let fullText = '';
                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n';
                    setExtractionProgress(Math.round((i / totalPages) * 100));
                }

                const cleaned = fullText.replace(/\s+/g, ' ').trim();
                const watermarkRegex = /scanned with camscanner/gi;
                const textWithoutWatermarks = cleaned.replace(watermarkRegex, '').trim();

                if (textWithoutWatermarks.length < 50 && cleaned.length > 0) {
                    toast.warning("Low text content detected. Switching to Handwriting/Vision Mode recommended.", {
                        action: {
                            label: "Switch Mode",
                            onClick: () => setUseVisionMode(true)
                        }
                    });
                }

                setExtractedText(cleaned);
            }

        } catch (error: any) {
            console.error("PDF Extraction Error:", error);
            toast.error("Failed to process PDF.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerate = async () => {
        if (!useVisionMode && !extractedText) {
            toast.error("No text content found.");
            return;
        }
        if (useVisionMode && extractedImages.length === 0) {
            toast.error("No images extracted.");
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(useVisionMode ? "Analyzing visual content with Gemini..." : "Analyzing text content...");

        try {
            const response = await fetch('http://localhost:5000/api/ai/generate-from-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textContent: useVisionMode ? undefined : extractedText,
                    images: useVisionMode ? extractedImages : undefined,
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
            const generated: DraftQuestion[] = data.questions.map((q: any) => ({
                questionText: q.question,
                options: q.options,
                correctAnswer: q.options[q.correctIndex || 0],
                marks: 1,
                timeLimit: 60,
                hints: q.explanation || ''
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
        const sessionData = {
            numQuestions: numAttend, // How many student attends
            numOptions: 4,
            draftQuestions: previewQuestions.map(q => ({
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                marks: 1,
                timeLimitMinutes: 1,
            })),
            questionSetName: selectedFile?.name?.replace('.pdf', '') + ' (AI Pool)',
            courseName: courseName || 'General',
            step: 2,
            currentSetId: null,
            passMarkPercentage: 50,
            requiredCorrectAnswers: Math.ceil(previewQuestions.length * 0.5),
            aiPoolSize: previewQuestions.length, // The full pool generated
            totalQuestions: numAttend // Sync with attend count
        };

        localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));

        // Navigate to 'manual' view which renders QuestionCreator
        // Ensure query params match what QuestionCreator expects
        navigate('/teacher/create-quiz?step=manual&qSetup=true&qStep=2');
        toast.success("Questions transferred to editor!");
    };

    return (
        <div className="space-y-8 pb-20">
            <Card className="shadow-xl bg-card rounded-3xl overflow-hidden border-border">
                <div className="bg-gradient-to-r from-primary/80 to-secondary/80 p-8 text-primary-foreground">
                    <h2 className="text-3xl font-black flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 mr-1 text-primary-foreground/80 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="h-8 w-8" />
                        </Button>
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
                                <Label className="text-lg font-bold text-foreground">1. Upload Document</Label>
                                <div className="border-2 border-dashed border-border bg-muted/20 rounded-2xl p-8 text-center hover:bg-muted/30 transition-colors relative group">
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isExtracting}
                                    />
                                    {selectedFile && !isExtracting && (
                                        <button
                                            onClick={handleRemoveFile}
                                            className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-full shadow-sm transition-all border border-gray-100"
                                            title="Remove File"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-16 w-16 bg-card rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {isExtracting ? (
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                            ) : selectedFile ? (
                                                <FileCheck className="h-8 w-8 text-success" />
                                            ) : (
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground text-lg">
                                                {selectedFile ? selectedFile.name : "Click to Upload PDF"}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium">Max 20MB • (Digital Text Only - No Handwriting/Images)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isExtracting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary">
                                        <span>Extracting Text...</span>
                                        <span>{extractionProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${extractionProgress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CONFIGURATION */}
                        <div className="space-y-6">
                            <Label className="text-lg font-bold text-foreground">2. Configuration</Label>

                            {/* Mode Toggle */}
                            <div className="bg-muted/10 p-4 rounded-xl border border-border flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="font-bold flex items-center gap-2">
                                        Enable Handwriting/Vision Mode
                                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">BETA</span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Use for scanned docs, handwritten notes, or images.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="vision-mode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {useVisionMode ? "ON" : "OFF"}
                                    </Label>
                                    <input
                                        id="vision-mode"
                                        type="checkbox"
                                        checked={useVisionMode}
                                        onChange={(e) => setUseVisionMode(e.target.checked)}
                                        className="h-5 w-5 accent-primary cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="bg-muted/10 rounded-2xl p-6 space-y-6 border border-border">
                                <div className="space-y-2">
                                    <Label>Course / Subject Name</Label>
                                    <Input
                                        placeholder="e.g. History 101"
                                        value={courseName}
                                        onChange={e => setCourseName(e.target.value)}
                                        className="bg-background border-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Total Questions to Generate</Label>
                                        <Input
                                            type="number"
                                            min={1} max={50}
                                            value={numQuestions}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                setNumQuestions(val);
                                                // Sync attend count if it was equal
                                                if (numAttend === numQuestions) setNumAttend(val);
                                            }}
                                            className="bg-background font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Questions to Attend</Label>
                                        <Input
                                            type="number"
                                            min={1} max={numQuestions}
                                            value={numAttend}
                                            onChange={e => setNumAttend(Number(e.target.value))}
                                            className="bg-background font-bold text-primary"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Difficulty</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                disabled={(!extractedText && extractedImages.length === 0) || isGenerating || isExtracting}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin h-5 w-5" /> Generating...
                                    </span>
                                ) : (!extractedText && extractedImages.length === 0) ? (
                                    <span className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" /> Waiting for Content...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" /> Generate from {useVisionMode ? "Images" : "Text"}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* 2. PREVIEW TEXT (Collapsible/Scrollable) */}
                    {(extractedText || extractedImages.length > 0) && (
                        <div className="space-y-3 pt-4 border-t border-dashed border-border">
                            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                {useVisionMode ? `Captured ${extractedImages.length} Pages (Visual Context)` : "Extracted Context Preview"}
                            </Label>

                            {useVisionMode ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {extractedImages.map((img, idx) => (
                                        <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                                            <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-muted/10 p-4 rounded-xl border border-border text-xs text-muted-foreground font-mono h-32 overflow-y-auto leading-relaxed">
                                    {extractedText.substring(0, 2000)}...
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. GENERATED RESULTS */}
                    {previewQuestions.length > 0 && (
                        <div className="space-y-6 pt-8 border-t-2 border-dashed border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-foreground">Generated Preview</h3>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setPreviewQuestions([])}>Discard</Button>
                                    <Button onClick={handleProceedToEditor} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                                        Edit & Publish <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {previewQuestions.map((q, idx) => (
                                    <div key={idx} className="p-6 bg-card border-2 border-border rounded-2xl hover:border-primary/30 transition-colors group">
                                        <div className="flex gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center">{idx + 1}</span>
                                            <div className="space-y-3 flex-1">
                                                <p className="font-bold text-lg text-foreground">{q.questionText}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className={`p-3 rounded-lg text-sm font-medium border ${opt === q.correctAnswer ? 'bg-success/10 border-success/30 text-success' : 'bg-muted/10 border-border text-muted-foreground'}`}>
                                                            {opt}
                                                            {opt === q.correctAnswer && <span className="ml-2 text-success">✓</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.hints && (
                                                    <div className="text-xs text-info bg-info/10 p-2 rounded inline-block font-medium">
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
