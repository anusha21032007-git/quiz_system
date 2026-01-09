"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, CheckCircle, XCircle, FileText, History } from 'lucide-react';
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

        const headers = ["Quiz Title", "Date", "Score", "Total Questions", "Percentage", "Status", "Time Taken (s)"];
        const rows = attempts.map(attempt => {
            const date = new Date(attempt.timestamp).toLocaleDateString();
            const percentage = (attempt.score / attempt.totalQuestions) * 100;
            const status = percentage >= 50 ? 'Passed' : 'Failed';
            const title = getQuizTitle(attempt.quizId);

            return [
                `"${title}"`, // Quote title to handle commas
                date,
                attempt.score.toFixed(2),
                attempt.totalQuestions,
                percentage.toFixed(1) + '%',
                status,
                attempt.timeTakenSeconds,
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
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <History className="h-5 w-5 text-indigo-600" /> My Quiz History
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => downloadCsv(sortedAttempts, `all_quiz_history_${new Date().toISOString().split('T')[0]}.csv`)}
                    disabled={sortedAttempts.length === 0}
                >
                    <Download className="h-4 w-4" /> Download All Report
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {sortedAttempts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        You haven't completed any quizzes yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="font-semibold text-gray-600">Quiz Title</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Score</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAttempts.map((attempt) => {
                                const percentage = (attempt.score / attempt.totalQuestions) * 100;
                                const isPassed = percentage >= 50;

                                return (
                                    <TableRow key={attempt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">
                                            {getQuizTitle(attempt.quizId)}
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">
                                            {new Date(attempt.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md bg-gray-100",
                                                isPassed ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                                            )}>
                                                {attempt.score.toFixed(1)} / {attempt.totalQuestions}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "font-normal",
                                                isPassed
                                                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                                                    : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                                            )}>
                                                {isPassed ? (
                                                    <><CheckCircle className="h-3 w-3 mr-1" /> Pass</>
                                                ) : (
                                                    <><XCircle className="h-3 w-3 mr-1" /> Fail</>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
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
