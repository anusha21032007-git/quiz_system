"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Clock, Trash2, Wand2, FileText, ArrowLeft, Brain, Send } from 'lucide-react';
import { toast } from 'sonner';
import QuestionCreator from './QuestionCreator';
import QuizCreator from './QuizCreator';
import InterviewMode from './InterviewMode';

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
    const view = searchParams.get('step') || 'initial';

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
        if (view === 'selection') {
            setView('initial');
        } else if (view === 'manual' || view === 'automated' || view === 'interview') {
            setView('selection');
        } else {
            // Default dashboard back behavior
            window.history.back();
        }
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



    if (view === 'manual') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                    <BackButton onClick={handleBack} className="bg-white shadow-xl shadow-gray-100/50 border border-gray-100 px-8 py-7 rounded-[24px] hover:bg-black hover:text-white transition-all duration-300" />
                    <div className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Manual Mode</div>
                </div>
                <QuestionCreator />
            </div>
        );
    }

    if (view === 'automated') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                    <BackButton onClick={handleBack} className="bg-white shadow-xl shadow-gray-100/50 border border-gray-100 px-8 py-7 rounded-[24px] hover:bg-black hover:text-white transition-all duration-300" />
                    <div className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">AI Generator</div>
                </div>
                <QuizCreator />
            </div>
        );
    }

    if (view === 'interview') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                    <BackButton onClick={handleBack} className="bg-white shadow-xl shadow-gray-100/50 border border-gray-100 px-8 py-7 rounded-[24px] hover:bg-black hover:text-white transition-all duration-300" />
                    <div className="px-6 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Interview Mode</div>
                </div>
                <InterviewMode />
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-in fade-in duration-700 pb-32">
            <div className="flex items-center">
                <BackButton onClick={handleBack} className="bg-white shadow-xl shadow-gray-100/50 border border-gray-100 px-8 py-7 rounded-[24px] hover:bg-black hover:text-white transition-all duration-300" />
            </div>

            {view === 'initial' && (
                <div className="space-y-24">
                    <div className="relative group max-w-4xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[50px] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                        <Card
                            onClick={() => setView('selection')}
                            className="relative cursor-pointer w-full h-72 rounded-[48px] bg-white border border-slate-100 group-hover:border-indigo-600 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-8 shadow-sm hover:shadow-xl active:scale-95"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                <PlusCircle className="h-48 w-48 text-indigo-900 -rotate-12" />
                            </div>

                            <div className="h-24 w-24 bg-indigo-600 rounded-[32px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-2xl relative">
                                <div className="absolute inset-0 bg-white/20 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <PlusCircle className="h-12 w-12 text-white" />
                            </div>

                            <div className="text-center space-y-3 relative z-10">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Create Question</h2>
                                <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[11px] bg-indigo-50 px-4 py-1.5 rounded-full inline-block">New Generation Flow</p>
                            </div>
                        </Card>
                    </div>

                </div>
            )}

            {view === 'selection' && (
                <div className="space-y-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                        <Card
                            className="group cursor-pointer border-2 border-gray-100 hover:border-black transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-[48px] overflow-hidden bg-white active:scale-[0.98] relative"
                            onClick={() => setView('manual')}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 group-hover:bg-black transition-colors" />
                            <CardContent className="p-10 flex flex-col items-center text-center gap-8">
                                <div className="h-20 w-20 bg-gray-50 rounded-[28px] flex items-center justify-center group-hover:bg-black transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:rotate-6">
                                    <FileText className="h-10 w-10 text-black group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Manual</h3>
                                    <p className="text-gray-500 font-bold leading-relaxed px-2 text-base">Detailed control over every question and option.</p>
                                </div>
                                <Button variant="outline" className="w-full h-14 rounded-[24px] border-2 border-gray-100 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
                                    Initialize Manual
                                </Button>
                            </CardContent>
                        </Card>

                        <Card
                            className="group cursor-pointer border-2 border-gray-100 hover:border-indigo-600 transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(79,70,229,0.2)] rounded-[48px] overflow-hidden bg-white active:scale-[0.98] relative"
                            onClick={() => setView('automated')}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-50 group-hover:bg-indigo-600 transition-colors" />
                            <CardContent className="p-10 flex flex-col items-center text-center gap-8">
                                <div className="h-20 w-20 bg-indigo-50 rounded-[28px] flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:-rotate-6">
                                    <Wand2 className="h-10 w-10 text-indigo-600 group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">AI Engine</h3>
                                    <p className="text-gray-500 font-bold leading-relaxed px-2 text-base">Generate high-quality question banks from topics instantly.</p>
                                </div>
                                <Button className="w-full h-14 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] border-transparent">
                                    Access AI Engine
                                </Button>
                            </CardContent>
                        </Card>

                        <Card
                            className="group cursor-pointer border-2 border-gray-100 hover:border-rose-600 transition-all duration-700 hover:shadow-[0_40px_100px_-20px_rgba(225,29,72,0.2)] rounded-[48px] overflow-hidden bg-white active:scale-[0.98] relative"
                            onClick={() => setView('interview')}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-rose-50 group-hover:bg-rose-600 transition-colors" />
                            <CardContent className="p-10 flex flex-col items-center text-center gap-8">
                                <div className="h-20 w-20 bg-rose-50 rounded-[28px] flex items-center justify-center group-hover:bg-rose-600 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:rotate-12">
                                    <Brain className="h-10 w-10 text-rose-600 group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Interview</h3>
                                    <p className="text-gray-500 font-bold leading-relaxed px-2 text-base">Interactive challenge mode with real-time feedback.</p>
                                </div>
                                <Button className="w-full h-14 rounded-[24px] bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(225,29,72,0.3)] border-transparent">
                                    Start Interview
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}
        </div>
    );
};

export default GenerateQuizLanding;
