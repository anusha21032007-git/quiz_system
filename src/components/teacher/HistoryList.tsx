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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-50 tracking-tight flex items-center gap-3 uppercase">
                        <HistoryIcon className="h-8 w-8 text-primary" />
                        LMS History
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium italic">"Trace assessment records, published quizzes, and active drafts."</p>
                </div>
            </div>

            {/* Published Assessments Log */}
            <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 px-2 uppercase tracking-tight">
                    <Trophy className="h-5 w-5 text-success" />
                    Published Assessment Log
                </h3>
                <div className="flex flex-col gap-3">
                    {actionHistory.length > 0 ? (
                        actionHistory.map((item, idx) => (
                            <div key={idx} className="group bg-card p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between transition-all hover:border-primary/30">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                                        item.action === 'Published' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                                    )}>
                                        {item.action === 'Published' ? <CheckCircle2 className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <h4 className="text-lg font-bold text-slate-50">{item.paperName || 'Assessment'}</h4>
                                            <span className={cn(
                                                "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                item.action === 'Published' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                                            )}>{item.action}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(item.timestamp).toLocaleString()}</span>
                                            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                            <span>{item.totalQuestions} Questions</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-800 group-hover:text-primary transition-colors" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                            No published quiz records yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Active Drafts Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2 px-2 uppercase tracking-tight">
                    <FileText className="h-5 w-5 text-warning" />
                    Active Drafts & Polls
                </h3>
                <div className="flex flex-col gap-3">
                    {polls.length > 0 ? (
                        polls.map((poll, idx) => {
                            const isScheduled = poll.status === 'scheduled';
                            const isLiveOrExpired = isScheduled && (poll.scheduledAt || 0) <= Date.now();
                            const canEdit = !isLiveOrExpired && poll.status !== 'completed';

                            return (
                                <div key={poll.pollId} className="group bg-card p-4 rounded-2xl border border-slate-800 shadow-sm hover:shadow-lg transition-all flex items-center justify-between hover:border-warning/30">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center shrink-0">
                                            <Clock className="h-6 w-6 text-warning" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-50">{poll.questionSetName || 'Untitled Draft'}</h4>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-0.5">
                                                <span>{poll.numberOfQuestions} Questions</span>
                                                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                                                <span className="text-warning uppercase text-[10px] tracking-widest">{poll.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDeletePoll(poll.pollId)}
                                            className="h-9 px-3 text-slate-500 hover:text-danger hover:bg-danger/5 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                                            disabled={isLiveOrExpired}
                                        >
                                            Discard
                                        </Button>
                                        <Button
                                            onClick={() => handleResumePoll(poll)}
                                            className={cn("h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", canEdit ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/15" : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700")}
                                            disabled={!canEdit}
                                        >
                                            {isScheduled ? 'View Details' : 'Resume'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                            No active drafts found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryList;