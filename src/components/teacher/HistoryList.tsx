"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    History as HistoryIcon,
    Trash2,
    Send,
    Clock,
    CheckCircle2,
    MoreVertical,
    FileText
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

const HistoryList = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const storedPolls = localStorage.getItem('polls');
        if (storedPolls) {
            setPolls(JSON.parse(storedPolls));
        }
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

        // Navigate to create-quiz view with manual step
        const params = new URLSearchParams();
        params.set('view', 'create-quiz');
        params.set('step', 'manual');
        params.set('qStep', '2');
        setSearchParams(params);
        toast.success("Resuming draft...");
    };

    const HistoryItem = ({ poll, index }: { poll: Poll; index: number }) => (
        <div className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-6 flex-1 min-w-0">
                {/* Sequential Number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 font-bold text-xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                    {index + 1}
                </div>

                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="h-6 w-6 text-indigo-600" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                            {poll.pollId.split('_')[1] || poll.pollId.slice(-6)}
                        </span>
                        <div className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                            poll.status === 'pending' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                poll.status === 'scheduled' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                            {poll.status}
                        </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 truncate">
                        {poll.questionSetName || 'Untitled Question Set'}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{poll.numberOfQuestions} Questions</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePoll(poll.pollId)}
                    className="h-9 px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Discard
                </Button>
                <Button
                    onClick={() => handleResumePoll(poll)}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                >
                    <Send className="h-3.5 w-3.5" />
                    Resume
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <HistoryIcon className="h-8 w-8 text-indigo-600" />
                        Creation History
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium italic">"Manage your drafts and scheduled quizzes professionally."</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                        Total Items: {polls.length}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {polls.length > 0 ? (
                    polls.map((poll, idx) => (
                        <HistoryItem key={poll.pollId} poll={poll} index={idx} />
                    ))
                ) : (
                    <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <HistoryIcon className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No History Found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            Start creating quizzes to see your generation history and drafts here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryList;

