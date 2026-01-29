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
import { cn } from '@/lib/utils';

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

    const CreationModes = [
        {
            id: 'manual',
            title: 'Manual Creation',
            description: 'Craft every question with precision using our advanced editor.',
            icon: PlusCircle,
            color: '#6C8BFF',
            gradient: 'from-[#6C8BFF]/20 to-[#E38AD6]/20',
            glow: 'bg-[#6C8BFF]/10'
        },
        {
            id: 'automated',
            title: 'AI Generation',
            description: 'Leverage hyper-intelligent AI to generate comprehensive assessments.',
            icon: Brain,
            color: '#E38AD6',
            gradient: 'from-[#E38AD6]/20 to-[#FFB86C]/20',
            glow: 'bg-[#E38AD6]/10'
        },
        {
            id: 'pdf-gen',
            title: 'Document Parser',
            description: 'Extract academic inquiries directly from PDF or image sources.',
            icon: FileText,
            color: '#4EE3B2',
            gradient: 'from-[#4EE3B2]/20 to-[#6C8BFF]/20',
            glow: 'bg-[#4EE3B2]/10'
        }
    ];

    if (view === 'pdf-gen') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 font-poppins">
                <PdfQuizCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'manual') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 font-poppins">
                <QuestionCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'automated') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 font-poppins">
                <QuizCreator onBack={handleBack} />
            </div>
        );
    }

    if (view === 'competitive') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-poppins">
                <div className="flex items-center justify-between">
                    <BackButton onClick={handleBack} className="glass-card shadow-lg border-white/60 px-8 py-7 hover:bg-white/40 text-[#1E2455] transition-all duration-500 rounded-[32px]" />
                    <div className="px-8 py-3 bg-gradient-to-r from-[#FF6B8A] to-[#E38AD6] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[#FF6B8A]/20">Competitive Mode</div>
                </div>
                <CompetitiveMode />
            </div>
        );
    }

    // Default fallback: Selection Hub
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 font-poppins relative">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#6C8BFF]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#E38AD6]/5 rounded-full blur-[100px] -z-10" />

            {/* Header */}
            <div className="glass-card p-12 border-white/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                    <div className="flex items-center gap-10">
                        <div className="w-28 h-28 bg-white/50 border border-white/60 rounded-[40px] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 p-7">
                            <Wand2 className="h-full w-full text-[#6C8BFF]" />
                        </div>
                        <div>
                            <h2 className="text-5xl lg:text-7xl font-black text-[#1E2455] tracking-tighter uppercase leading-none mb-4">
                                Generate Quiz Hub
                            </h2>
                            <p className="text-[#3A3F6B] font-bold italic opacity-70 tracking-tight text-xl max-w-2xl">Initialize new simulation environments using our multi-modal generation engine.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {CreationModes.map((mode) => (
                    <div
                        key={mode.id}
                        onClick={() => setView(mode.id)}
                        className="group relative cursor-pointer"
                    >
                        <div className="glass-card h-full p-12 border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 flex flex-col items-center text-center">
                            <div className={cn("w-28 h-28 mb-10 rounded-[40px] flex items-center justify-center transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 p-8 shadow-xl bg-white/60 border border-white/40", mode.glow)}>
                                <mode.icon className="h-full w-full" style={{ color: mode.color }} />
                            </div>
                            <h3 className="text-4xl font-black text-[#1E2455] uppercase tracking-tighter mb-5 group-hover:text-[#6C8BFF] transition-colors">{mode.title}</h3>
                            <p className="text-[#7A80B8] font-bold italic opacity-70 mb-12 leading-relaxed text-lg">{mode.description}</p>

                            <Button
                                className="w-full h-16 rounded-full bg-white/40 border-white/60 text-[11px] font-black uppercase tracking-[0.3em] text-[#7A80B8] group-hover:bg-gradient-to-br group-hover:from-[#6C8BFF] group-hover:to-[#E38AD6] group-hover:text-white group-hover:border-transparent transition-all duration-700 shadow-xl"
                                variant="outline"
                            >
                                INITIALIZE MODE
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Drafts */}
            {polls.length > 0 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-5 px-4">
                        <History className="h-7 w-7 text-[#6C8BFF]" />
                        <h3 className="text-sm font-black text-[#1E2455] uppercase tracking-[0.4em]">Temporal Fragments <span className="text-[#7A80B8] opacity-50 italic">/ Recent Drafts</span></h3>
                    </div>

                    <div className="flex flex-col gap-5">
                        {polls.slice(0, 5).map((poll) => (
                            <div key={poll.pollId} className="group glass-card p-8 border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover transition-all duration-700 flex flex-wrap items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

                                <div className="flex items-center gap-10 relative z-10">
                                    <div className="w-20 h-20 bg-white/40 border border-white/60 rounded-[30px] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 p-6 shadow-sm">
                                        <Clock className="h-full w-full text-[#6C8BFF]" />
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black text-[#1E2455] uppercase tracking-tighter leading-none mb-3">{poll.questionSetName || 'Untitled Sequence'}</h4>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="text-[10px] font-black text-[#7A80B8]/60 uppercase tracking-widest bg-white/40 px-4 py-1.5 rounded-lg border border-white/60 flex items-center gap-2">
                                                <span className="opacity-50">QUERIES:</span>
                                                <span className="text-[#1E2455]">{poll.numberOfQuestions}</span>
                                            </div>
                                            <div className="text-[10px] font-black text-[#7A80B8]/60 uppercase tracking-widest bg-white/40 px-4 py-1.5 rounded-lg border border-white/60 flex items-center gap-2">
                                                <span className="opacity-50">SYNTHESIZED:</span>
                                                <span className="text-[#1E2455]">{new Date(poll.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 relative z-10">
                                    <Button
                                        onClick={() => handleResumePoll(poll)}
                                        className="h-14 px-10 text-[10px] tracking-[0.2em] pastel-button-primary"
                                    >
                                        RESUME CREATION
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeletePoll(poll.pollId)}
                                        className="h-16 w-16 rounded-[22px] text-[#7A80B8] hover:text-[#FF6B8A] hover:bg-[#FF6B8A]/10 border border-white/60 hover:border-[#FF6B8A]/30 transition-all duration-500 shadow-xl"
                                    >
                                        <Trash2 className="h-7 w-7" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Back to Repository */}
            <div className="flex justify-center pt-10">
                <Button
                    onClick={handleBack}
                    variant="ghost"
                    className="h-20 px-16 border-white/60 hover:bg-[#6C8BFF]/5 text-[#7A80B8] font-black uppercase tracking-[0.3em] text-[11px] rounded-[32px] border transition-all duration-700 flex items-center gap-5 group"
                >
                    <ArrowLeft className="h-6 w-6 group-hover:-translate-x-2 transition-transform duration-500" />
                    Return to Repository
                </Button>
            </div>
        </div>
    );
};

export default GenerateQuizLanding;
