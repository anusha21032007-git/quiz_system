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

        const params = new URLSearchParams(searchParams);
        params.set('view', 'create-quiz');
        params.set('step', 'manual');
        params.set('qStep', '2');
        setSearchParams(params);
        toast.success("Resuming draft...");
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 font-poppins relative">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#6C8BFF]/5 rounded-full blur-[120px] -z-10 animate-pulse" />

            {/* Page Header */}
            <div className="glass-card p-10 relative overflow-hidden group border-white/60">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 bg-white/50 border border-white/60 rounded-[32px] flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-700 p-6">
                            <HistoryIcon className="h-full w-full text-[#6C8BFF]" />
                        </div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] tracking-tighter uppercase leading-none mb-3">
                                LMS Activity Index
                            </h2>
                            <p className="text-[#3A3F6B] font-bold italic opacity-70 tracking-tight text-lg">Trace assessment records, published quizzes, and active simulation drafts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Published Assessments Log */}
            <div className="space-y-8">
                <div className="flex items-center gap-5 px-4">
                    <Trophy className="h-7 w-7 text-[#4EE3B2]" />
                    <h3 className="text-sm font-black text-[#1E2455] uppercase tracking-[0.4em]">Published Assessment Log</h3>
                </div>
                <div className="flex flex-col gap-5">
                    {actionHistory.length > 0 ? (
                        actionHistory.map((item, idx) => (
                            <div key={idx} className="group glass-card p-8 border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-700 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 border shadow-sm transition-all duration-500 group-hover:scale-110",
                                        item.action === 'Published' ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20" : "bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20"
                                    )}>
                                        {item.action === 'Published' ? <CheckCircle2 className="h-8 w-8" /> : <Trash2 className="h-8 w-8" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-5 mb-2.5">
                                            <h4 className="text-2xl font-black text-[#1E2455] tracking-tight uppercase">{item.paperName || 'Assessment'}</h4>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                item.action === 'Published' ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 shadow-[#4EE3B2]/5" : "bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20 shadow-[#FF6B8A]/5"
                                            )}>{item.action}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-5 text-[10px] font-black text-[#7A80B8] uppercase tracking-widest">
                                            <span className="flex items-center gap-2.5 bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 shadow-sm">
                                                <Calendar className="h-3.5 w-3.5 text-[#6C8BFF]" />
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                            <span className="w-1.5 h-1.5 bg-[#7A80B8]/20 rounded-full" />
                                            <span className="italic opacity-80">{item.totalQuestions} Questions Synthesized</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/40 border border-white flex items-center justify-center text-[#7A80B8] group-hover:text-[#6C8BFF] group-hover:scale-110 transition-all shadow-sm">
                                    <ChevronRight className="h-7 w-7" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 glass-card border-white/40 border-dashed text-center">
                            <p className="text-[#7A80B8] font-black text-[10px] uppercase tracking-[0.4em] opacity-60">No published records indexed in the temporal stream.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Drafts Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-5 px-4">
                    <FileText className="h-7 w-7 text-[#FFB86C]" />
                    <h3 className="text-sm font-black text-[#1E2455] uppercase tracking-[0.4em]">Active Drafts & Polls</h3>
                </div>
                <div className="flex flex-col gap-5">
                    {polls.length > 0 ? (
                        polls.map((poll) => {
                            const isScheduled = poll.status === 'scheduled';
                            const isLiveOrExpired = isScheduled && (poll.scheduledAt || 0) <= Date.now();
                            const canEdit = !isLiveOrExpired && poll.status !== 'completed';

                            return (
                                <div key={poll.pollId} className="group glass-card p-8 border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover transition-all duration-700 flex flex-wrap items-center justify-between relative overflow-hidden gap-8">
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="w-16 h-16 bg-[#FFB86C]/10 border border-[#FFB86C]/20 rounded-[22px] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                            <Clock className="h-8 w-8 text-[#FFB86C]" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-[#1E2455] uppercase tracking-tighter leading-none mb-3">{poll.questionSetName || 'Untitled Sequence'}</h4>
                                            <div className="flex items-center gap-5 text-[10px] font-black text-[#7A80B8] uppercase tracking-widest">
                                                <span className="bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 shadow-sm">{poll.numberOfQuestions} Global Queries</span>
                                                <span className="w-1.5 h-1.5 bg-[#7A80B8]/20 rounded-full" />
                                                <span className="text-[#FFB86C] italic opacity-80 decoration-dotted underline underline-offset-4">{poll.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 relative z-10">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDeletePoll(poll.pollId)}
                                            className="h-14 px-8 text-[#7A80B8] hover:text-[#FF6B8A] hover:bg-[#FF6B8A]/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all border border-transparent hover:border-[#FF6B8A]/20"
                                            disabled={isLiveOrExpired}
                                        >
                                            DISCARD
                                        </Button>
                                        <Button
                                            onClick={() => handleResumePoll(poll)}
                                            className={cn(
                                                "h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl",
                                                canEdit ? "pastel-button-primary" : "bg-white/20 text-[#7A80B8]/40 border border-white/30 cursor-not-allowed"
                                            )}
                                            disabled={!canEdit}
                                        >
                                            {isScheduled ? 'VIEW SPECS' : 'RESUME SYNC'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-24 glass-card border-white/40 border-dashed text-center">
                            <p className="text-[#7A80B8] font-black text-[10px] uppercase tracking-[0.4em] opacity-60">No active fragments located in the draft repository.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryList;