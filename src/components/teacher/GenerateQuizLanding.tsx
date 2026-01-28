"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Clock, Trash2, Wand2, FileText, ArrowLeft, Brain, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QuestionCreator from './QuestionCreator';
import QuizCreator from './QuizCreator';
import CompetitiveMode from './CompetitiveMode';
import PdfQuizCreator from './PdfQuizCreator';

import { useSearchParams } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';

interface Poll {
    pollId: string;
    numberOfQuestions: number;
    mcqCount: number;
    createdAt: number;
    status: 'pending' | 'completed' | 'scheduled';
    draftQuestions?: any[];
    questionSetName?: string;
    scheduledAt?: number;
    passMarkPercentage?: number;
    requiredCorrectAnswers?: number;
}

const GenerateQuizLanding = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [polls, setPolls] = useState<Poll[]>([]);

    // Current view from URL, default to 'initial'
    // Support both 'step' and 'mode' for compatibility
    const urlStep = searchParams.get('step');
    const urlMode = searchParams.get('mode');

    // Map mode aliases to internal steps
    const modeMap: Record<string, string> = {
        'manual': 'manual',
        'ai': 'automated',
        'pdf': 'pdf-gen'
    };

    const view = urlStep || (urlMode ? modeMap[urlMode] : null) || 'initial';

    useEffect(() => {
        const storedPolls = localStorage.getItem('polls');
        if (storedPolls) {
            setPolls(JSON.parse(storedPolls));
        }
    }, [view]);

    const setView = (newStep: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('step', newStep);

        // Set child-specific params based on selected mode
        if (newStep === 'manual') {
            params.set('view', 'create-quiz'); // Stay in this view
            params.set('qSetup', 'true');
            params.set('qStep', '1');
            params.delete('quizStep');
        } else if (newStep === 'automated') {
            params.set('view', 'create-quiz');
            params.set('quizStep', '1');
            params.delete('qSetup');
            params.delete('qStep');
        } else {
            // Clear child params when in landing or selection
            params.delete('qSetup');
            params.delete('qStep');
            params.delete('quizStep');
        }

        setSearchParams(params);
    };

    const handleDeletePoll = (pollId: string) => {
        const updated = polls.filter(p => p.pollId !== pollId);
        setPolls(updated);
        localStorage.setItem('polls', JSON.stringify(updated));
        toast.error("Question set discarded.");
    };

    const handleBack = () => {
        const params = new URLSearchParams(searchParams);
        params.set('view', 'quizzes');
        params.delete('step');
        params.delete('mode');
        params.delete('qSetup');
        params.delete('qStep');
        params.delete('quizStep');
        setSearchParams(params);
    };

    const handleResumePoll = (poll: Poll) => {
        // For Manual polls, we need to set the QuestionCreator state
        // Since QuestionCreator loads from 'activeCreationSession' on mount,
        // we can seed that localStorage key before navigating.
        const sessionData = {
            numQuestions: poll.numberOfQuestions,
            numOptions: poll.mcqCount,
            draftQuestions: poll.draftQuestions || [],
            questionSetName: poll.questionSetName || '',
            step: 2, // Resume directly to the editor
            currentSetId: poll.pollId,
            passMarkPercentage: poll.passMarkPercentage,
            requiredCorrectAnswers: poll.requiredCorrectAnswers,
            totalQuestions: poll.numberOfQuestions
        };
        localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));

        // Navigate to manual mode
        const params = new URLSearchParams(searchParams);
        params.set('step', 'manual');
        params.delete('qSetup');
        params.set('qStep', '2');
        setSearchParams(params);
        toast.success("Resuming draft...");
    };

    if (view === 'pdf-gen') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <PdfQuizCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'manual') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <QuestionCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'automated') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <QuizCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'competitive') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                    <BackButton onClick={handleBack} className="bg-card shadow-lg shadow-black/5 border border-border/50 px-8 py-7 rounded-[24px] hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all duration-300" />
                    <div className="px-6 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Competitive Mode</div>
                </div>
                <CompetitiveMode />
            </div>
        );
    }

    // Default fallback: If no valid creation mode is selected, go back to quizzes
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing simulation environment...</p>
            <Button
                onClick={handleBack}
                variant="outline"
                className="mt-4 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl px-8"
            >
                Return to Quizzes
            </Button>
        </div>
    );
};

export default GenerateQuizLanding;
