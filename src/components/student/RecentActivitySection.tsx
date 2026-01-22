"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Clock, List, ArrowRight, CheckCircle } from 'lucide-react';
import { QuizAttempt, useQuiz } from '@/context/QuizContext';

interface RecentActivitySectionProps {
  studentAttempts: QuizAttempt[];
}

const RecentActivitySection = ({ studentAttempts }: RecentActivitySectionProps) => {
  const { quizzes } = useQuiz();
  
  // Find the most recent attempt
  const mostRecentAttempt = studentAttempts
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (!mostRecentAttempt) {
    return (
      <Card className="shadow-lg border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <List className="h-6 w-6 text-blue-500" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No recent quiz attempts recorded. Start a quiz to see your activity here!</p>
        </CardContent>
      </Card>
    );
  }

  const quiz = quizzes.find(q => q.id === mostRecentAttempt.quizId);
  const quizTitle = quiz?.title || 'Unknown Quiz';
  const courseName = quiz?.courseName || 'General Course';
  const scorePercentage = (mostRecentAttempt.score / mostRecentAttempt.totalQuestions) * 100;
  const isPassed = scorePercentage >= 50;

  const formatTimeTaken = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="shadow-lg border-l-4 border-blue-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <List className="h-6 w-6 text-blue-600" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600 font-medium">Last Quiz Attempt</p>
          <h3 className="text-xl font-bold text-gray-800 mt-1">{quizTitle}</h3>
          <p className="text-sm text-gray-700 mb-3">Course: {courseName}</p>
          
          <div className="flex justify-between items-center text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Time Taken: {formatTimeTaken(mostRecentAttempt.timeTakenSeconds)}
            </span>
            <span className="font-semibold text-lg">
              Score: {mostRecentAttempt.score.toFixed(1)} / {mostRecentAttempt.totalQuestions}
            </span>
          </div>
        </div>

        <Link to="/leaderboard">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            <CheckCircle className="h-4 w-4 mr-2" /> Review Results
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RecentActivitySection;