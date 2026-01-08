"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import { QuizAttempt } from '@/context/QuizContext';

interface QuizHistoryDownloadProps {
  studentAttempts: QuizAttempt[];
}

const QuizHistoryDownload = ({ studentAttempts }: QuizHistoryDownloadProps) => {
  
  const generateCsv = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return '';

    const headers = ["Quiz Title", "Date", "Score", "Total Questions", "Status", "Time Taken (s)"];
    const rows = attempts.map(attempt => {
      const date = new Date(attempt.timestamp).toLocaleDateString();
      const status = attempt.score > (attempt.totalQuestions / 2) ? 'Passed' : 'Failed';
      
      return [
        attempt.quizId, // Using quizId as a placeholder for title, ideally we'd fetch the title
        date,
        attempt.score.toFixed(2),
        attempt.totalQuestions,
        status,
        attempt.timeTakenSeconds,
      ].map(String).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownload = () => {
    if (studentAttempts.length === 0) {
      alert("No quiz history to download.");
      return;
    }

    const csvContent = generateCsv(studentAttempts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-lg border-l-4 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-purple-600" /> Download History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Download a summary of your {studentAttempts.length} completed quiz attempts for your records.
        </p>
        <Button 
          onClick={handleDownload} 
          disabled={studentAttempts.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Download className="h-4 w-4 mr-2" /> Download CSV Summary
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizHistoryDownload;