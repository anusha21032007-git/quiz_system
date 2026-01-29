"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, CheckCircle, XCircle, FileText, History, ShieldAlert } from 'lucide-react';
import { QuizAttempt, Quiz } from '@/context/QuizContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StudentResultsListProps {
    studentAttempts: QuizAttempt[];
    quizzes: Quiz[];
}

const StudentResultsList = ({ studentAttempts, quizzes }: StudentResultsListProps) => {

    const getQuizTitle = (quizId: string) => {
        const quiz = quizzes.find(q => q.id === quizId);
        return quiz ? quiz.title : 'Unknown Quiz';
    };

    const generateCsv = (attempts: QuizAttempt[]) => {
        if (attempts.length === 0) return '';

        const headers = ["Course", "Quiz Title", "Date", "Marks Obtained", "Total Marks", "Percentage", "Pass/Fail Status", "Time Taken (s)", "Violations"];
        const rows = attempts.map(attempt => {
            const quiz = quizzes.find(q => q.id === attempt.quizId);
            const title = quiz ? quiz.title : 'Unknown Quiz';
            const course = quiz ? quiz.courseName : 'N/A';
            const totalMarksPossible = (attempt as any).totalMarksPossible || (quiz ? (quiz.questions || []).reduce((sum, q) => sum + q.marks, 0) : attempt.totalQuestions);

            const date = new Date(attempt.timestamp).toLocaleDateString();
            const status = attempt.passed ? 'PASSED' : 'FAILED';
            const percentage = (attempt as any).scorePercentage !== undefined
                ? (attempt as any).scorePercentage
                : (totalMarksPossible > 0 ? (attempt.score / totalMarksPossible) * 100 : 0);

            return [
                `"${course}"`,
                `"${title}"`,
                date,
                attempt.score.toFixed(2),
                totalMarksPossible.toFixed(2),
                percentage.toFixed(1) + '%',
                status,
                attempt.timeTakenSeconds,
                attempt.violationCount
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCsv = (attempts: QuizAttempt[], filename: string) => {
        if (attempts.length === 0) {
            toast.error("No data to download.");
            return;
        }
        const csvContent = generateCsv(attempts);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Download started.");
    };

    const sortedAttempts = [...studentAttempts].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <Card className="glass-card border-white/60 shadow-2xl overflow-hidden mb-12 relative group/main font-poppins">
            {/* Gradient Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C8BFF]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/60 bg-white/40 px-10 backdrop-blur-3xl relative z-10">
                <CardTitle className="flex items-center gap-6 text-3xl text-[#1E2455] font-black uppercase tracking-tighter leading-none">
                    <div className="w-16 h-16 bg-white/60 border border-white rounded-2xl flex items-center justify-center shadow-lg group-hover/main:scale-105 transition-all duration-700">
                        <History className="h-8 w-8 text-[#6C8BFF]" />
                    </div>
                    Performance Archives
                </CardTitle>
                <Button
                    className="pastel-button-primary h-14 px-10 text-[11px] tracking-[0.2em] shadow-xl"
                    onClick={() => downloadCsv(sortedAttempts, `performance_report_${new Date().toISOString().split('T')[0]}.csv`)}
                    disabled={sortedAttempts.length === 0}
                >
                    <Download className="h-4 w-4 mr-3" /> EXPORT GLOBAL DATA
                </Button>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
                {sortedAttempts.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-white/40 border border-white/60 rounded-full flex items-center justify-center mx-auto mb-8 shadow-glass animate-float">
                            <History className="h-10 w-10 text-[#7A80B8]/40" />
                        </div>
                        <p className="text-[#3A3F6B] font-black uppercase tracking-[0.4em] text-[10px] italic opacity-60">
                            Performance repository is currently empty.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white/20 hover:bg-white/20 border-white/40">
                                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-[0.4em] text-[10px] pl-10 h-20">Simulation ID</TableHead>
                                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-[0.4em] text-[10px] text-center h-20">Temporal Marker</TableHead>
                                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-[0.4em] text-[10px] text-center h-20">Precision Index</TableHead>
                                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-[0.4em] text-[10px] text-center h-20">Auth Status</TableHead>
                                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-[0.4em] text-[10px] text-right pr-10 h-20">Telemetry</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAttempts.map((attempt) => {
                                    const isPassed = attempt.passed;
                                    const percentage = (attempt as any).scorePercentage !== undefined
                                        ? (attempt as any).scorePercentage
                                        : (attempt.totalQuestions > 0 ? (attempt.correctAnswersCount / attempt.totalQuestions) * 100 : 0);

                                    return (
                                        <TableRow key={attempt.id} className="hover:bg-white/60 transition-all duration-500 border-white/30 group/row">
                                            <TableCell className="font-black text-[#1E2455] pl-10 h-24 text-lg tracking-tighter uppercase">
                                                <div className="flex flex-col">
                                                    <span className="group-hover/row:text-[#6C8BFF] transition-colors">{getQuizTitle(attempt.quizId)}</span>
                                                    <span className="text-[9px] font-black text-[#7A80B8] opacity-60 tracking-widest mt-1">REF: {attempt.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-[#3A3F6B] opacity-60 text-xs tracking-tighter">
                                                {new Date(attempt.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={cn(
                                                    "inline-flex items-center justify-center w-20 h-10 rounded-2xl border font-black text-xs shadow-sm transition-all duration-500 group-hover/row:scale-110",
                                                    isPassed
                                                        ? "text-[#4EE3B2] bg-[#4EE3B2]/10 border-[#4EE3B2]/20 shadow-[#4EE3B2]/5"
                                                        : "text-[#FF6B8A] bg-[#FF6B8A]/10 border-[#FF6B8A]/20 shadow-[#FF6B8A]/5"
                                                )}>
                                                    {percentage.toFixed(0)}%
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Badge className={cn(
                                                        "font-black uppercase tracking-[0.2em] text-[9px] px-4 py-2 rounded-full border shadow-sm transition-all duration-500",
                                                        attempt.status === 'CORRUPTED'
                                                            ? "bg-[#FF6B8A] text-white border-[#FF6B8A] shadow-[#FF6B8A]/20 scale-105 animate-pulse"
                                                            : isPassed
                                                                ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20"
                                                                : "bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20"
                                                    )}>
                                                        {attempt.status === 'CORRUPTED' ? (
                                                            <><ShieldAlert className="h-3 w-3 mr-2" /> Breach</>
                                                        ) : isPassed ? (
                                                            <><CheckCircle className="h-3 w-3 mr-2" /> Valid</>
                                                        ) : (
                                                            <><XCircle className="h-3 w-3 mr-2" /> Inval</>
                                                        )}
                                                    </Badge>
                                                    {attempt.violationCount > 0 && (
                                                        <span className="text-[10px] text-[#FFB86C] font-black uppercase tracking-[0.2em] bg-[#FFB86C]/10 px-3 py-1 rounded-lg border border-[#FFB86C]/20">
                                                            STRIKES: {attempt.violationCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <Button
                                                    size="icon"
                                                    className="h-14 w-14 rounded-2xl bg-white/40 border border-white/80 text-[#7A80B8] hover:text-[#6C8BFF] hover:bg-white/80 hover:shadow-glass-hover hover:border-[#6C8BFF]/30 transition-all duration-500 shadow-sm"
                                                    title="Download Registry Export"
                                                    onClick={() => downloadCsv([attempt], `valuation_${attempt.quizId}_${new Date().toISOString().split('T')[0]}.csv`)}
                                                >
                                                    <Download className="h-6 w-6" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StudentResultsList;
