"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, List } from 'lucide-react';
import { QuizAttempt } from '@/context/QuizContext';

interface RecentActivityProps {
  recentAttempts: QuizAttempt[];
}

const RecentActivity = ({ recentAttempts }: RecentActivityProps) => {
  const sortedAttempts = [...recentAttempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5); // Last 5 attempts

  const formatTimeTaken = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <List className="h-6 w-6 text-gray-600" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAttempts.length === 0 ? (
          <p className="text-gray-500">No recent quiz attempts recorded.</p>
        ) : (
          <div className="space-y-3">
            {sortedAttempts.map((attempt) => {
              // Calculate score percentage based on total questions (proxy for max score)
              const scorePercentage = (attempt.score / attempt.totalQuestions) * 100;
              const isPassed = scorePercentage >= 50;

              return (
                <div key={attempt.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    {isPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">Quiz Attempt: {attempt.quizId}</p> {/* Placeholder for quiz title */}
                      <p className="text-sm text-gray-600">
                        Score: <span className="font-semibold">{attempt.score.toFixed(2)} / {attempt.totalQuestions}</span>
                        <span className="ml-3 flex items-center gap-1 text-xs"><Clock className="h-3 w-3" /> {formatTimeTaken(attempt.timeTakenSeconds)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(attempt.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;