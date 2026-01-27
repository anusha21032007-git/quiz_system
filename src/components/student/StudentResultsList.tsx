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
        <Card className="shadow-2xl border-slate-800 bg-card overflow-hidden rounded-[32px]">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-950/20 px-8">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100 font-black uppercase tracking-tight">
                    <History className="h-5 w-5 text-primary" /> My Quiz History
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 font-bold uppercase text-[10px] tracking-widest px-6 rounded-xl transition-all"
                    onClick={() => downloadCsv(sortedAttempts, `all_quiz_history_${new Date().toISOString().split('T')[0]}.csv`)}
                    disabled={sortedAttempts.length === 0}
                >
                    <Download className="h-4 w-4" /> Download All Report
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {sortedAttempts.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-medium uppercase tracking-widest text-xs">
                        You haven't completed any quizzes yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-900/50 hover:bg-slate-900/50 border-slate-800">
                                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] pl-8">Quiz Title</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Date</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Score (%)</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right pr-8">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAttempts.map((attempt) => {
                                const isPassed = attempt.passed;
                                const percentage = (attempt as any).scorePercentage !== undefined
                                    ? (attempt as any).scorePercentage
                                    : (attempt.totalQuestions > 0 ? (attempt.correctAnswersCount / attempt.totalQuestions) * 100 : 0);

                                return (
                                    <TableRow key={attempt.id} className="hover:bg-slate-900/30 transition-colors border-slate-800/50">
                                        <TableCell className="font-bold text-slate-100 pl-8">
                                            {getQuizTitle(attempt.quizId)}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-400 font-medium font-mono text-xs">
                                            {new Date(attempt.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-center font-black">
                                            <span className={cn(
                                                "px-3 py-1 rounded-xl border font-mono text-xs",
                                                isPassed ? "text-success bg-success/10 border-success/20" : "text-danger bg-danger/10 border-danger/20"
                                            )}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "font-black uppercase tracking-tight text-[9px] px-3 py-1 rounded-full border",
                                                attempt.status === 'CORRUPTED'
                                                    ? "bg-danger text-white border-danger"
                                                    : isPassed
                                                        ? "bg-success/10 text-success border-success/20"
                                                        : "bg-danger/10 text-danger border-danger/20"
                                            )}>
                                                {attempt.status === 'CORRUPTED' ? (
                                                    <><ShieldAlert className="h-2.5 w-2.5 mr-1" /> Corrupted</>
                                                ) : isPassed ? (
                                                    <><CheckCircle className="h-2.5 w-2.5 mr-1" /> Pass</>
                                                ) : (
                                                    <><XCircle className="h-2.5 w-2.5 mr-1" /> Fail</>
                                                )}
                                            </Badge>
                                            {attempt.violationCount > 0 && (
                                                <div className="text-[9px] text-warning font-black mt-1.5 uppercase tracking-widest bg-warning/10 px-2 py-0.5 rounded-full border border-warning/10 inline-block">
                                                    {attempt.violationCount} {attempt.violationCount === 1 ? 'Violation' : 'Violations'}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Download Result"
                                                onClick={() => downloadCsv([attempt], `quiz_result_${attempt.quizId}_${new Date().toISOString().split('T')[0]}.csv`)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default StudentResultsList;
