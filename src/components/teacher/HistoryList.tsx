"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    History as HistoryIcon,
    Trash2,
    Send,
    Clock,
    CheckCircle2,
    Trophy,
    FileText,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

interface Poll {
    pollId: string;
    numberOfQuestions: number;
    mcqCount: number;
    createdAt: number;
    status: 'pending' | 'completed' | 'scheduled';
    draftQuestions?: any[];
    questionSetName?: string;
    scheduledAt?: number;
}

interface ActionHistory {
    questionSetId: string;
    paperName: string;
    totalQuestions: number;
    action: 'Published' | 'Deleted' | 'Completed';
    timestamp: number;
}

const HistoryList = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const storedPolls = localStorage.getItem('polls');
        if (storedPolls) setPolls(JSON.parse(storedPolls));

        const storedHistory = localStorage.getItem('questionActionHistory');
        if (storedHistory) setActionHistory(JSON.parse(storedHistory));
    }, []);

    const handleDeletePoll = (pollId: string) => {
        const updated = polls.filter(p => p.pollId !== pollId);
        setPolls(updated);
        localStorage.setItem('polls', JSON.stringify(updated));
        toast.error("Draft discarded.");
    };

    const handleResumePoll = (poll: Poll) => {
        const sessionData = {
            numQuestions: poll.numberOfQuestions,
            numOptions: poll.mcqCount,
            draftQuestions: poll.draftQuestions || [],
            questionSetName: poll.questionSetName || '',
            step: 2,
            currentSetId: poll.pollId,
            totalQuestions: poll.numberOfQuestions
        };
        localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));

        const params = new URLSearchParams();
        params.set('view', 'create-quiz');
        params.set('step', 'manual');
        params.set('qStep', '2');
        setSearchParams(params);
        toast.success("Resuming draft...");
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <HistoryIcon className="h-8 w-8 text-indigo-600" />
                        LMS History
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium italic">"Trace assessment records, published quizzes, and active drafts."</p>
                </div>
            </div>

            {/* Published Assessments Log */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
                    <Trophy className="h-5 w-5 text-emerald-500" />
                    Published Assessment Log
                </h3>
                <div className="flex flex-col gap-3">
                    {actionHistory.length > 0 ? (
                        actionHistory.map((item, idx) => (
                            <div key={idx} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                        item.action === 'Published' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                    )}>
                                        {item.action === 'Published' ? <CheckCircle2 className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <h4 className="text-lg font-bold text-slate-900">{item.paperName || 'Assessment'}</h4>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                item.action === 'Published' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>{item.action}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(item.timestamp).toLocaleString()}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>{item.totalQuestions} Questions</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
                            No published quiz records yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Active Drafts Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Active Drafts & Polls
                </h3>
                <div className="flex flex-col gap-3">
                    {polls.length > 0 ? (
                        polls.map((poll, idx) => (
                            <div key={poll.pollId} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Clock className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900">{poll.questionSetName || 'Untitled Draft'}</h4>
                                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 mt-0.5">
                                            <span>{poll.numberOfQuestions} Questions</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-amber-600 uppercase text-[10px] tracking-widest">{poll.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" onClick={() => handleDeletePoll(poll.pollId)} className="h-9 px-3 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest">Discard</Button>
                                    <Button onClick={() => handleResumePoll(poll)} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest">Resume</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
                            No active drafts found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryList;