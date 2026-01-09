"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';
import { useQuiz } from '@/context/QuizContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // FIX: Import cn

interface NextActionCardProps {
  studentName: string;
  averageScore: number;
}

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(dateStr + 'T' + timeStr + ':00');
};

const NextActionCard = ({ studentName, averageScore }: NextActionCardProps) => {
  const { quizzes: allQuizzes, quizAttempts } = useQuiz();
  const now = new Date();

  // Filter out interviews from the next action card
  const quizzes = useMemo(() => allQuizzes.filter(q => !q.isInterview), [allQuizzes]);

  const recommendation = useMemo(() => {
    // Rule 1: No quiz attempted yet
    if (quizAttempts.length === 0) {
      return {
        title: "Start Your Assessment Journey",
        message: "Welcome! Start your first quiz to begin tracking your performance.",
        icon: BookOpen,
        color: "bg-blue-500",
        action: <Link to="/student?view=quizzes"><Button className="w-full bg-blue-600 hover:bg-blue-700">View Quizzes</Button></Link>
      };
    }

    // Find the next live quiz
    const liveQuiz = quizzes.find(quiz => {
      const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
      const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);
      const isCompleted = quizAttempts.some(
        (attempt) => attempt.quizId === quiz.id && attempt.studentName === studentName
      );
      return now >= startTime && now <= endTime && !isCompleted;
    });

    // Rule 2: Quiz is scheduled today and is live
    if (liveQuiz) {
      return {
        title: "Quiz is LIVE Now!",
        message: `Hurry! ${liveQuiz.title} is active until ${liveQuiz.endTime}.`,
        icon: AlertTriangle,
        color: "bg-green-600",
        action: <Link to={`/quiz/${liveQuiz.id}`}><Button className="w-full bg-green-700 hover:bg-green-800 animate-pulse">Start Quiz Now</Button></Link>
      };
    }

    // Find the next upcoming quiz (not live, not completed)
    const upcomingQuiz = quizzes
      .filter(quiz => {
        const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
        const isCompleted = quizAttempts.some(
          (attempt) => attempt.quizId === quiz.id && attempt.studentName === studentName
        );
        return now < startTime && !isCompleted;
      })
      .sort((a, b) => createDateTime(a.scheduledDate, a.startTime).getTime() - createDateTime(b.scheduledDate, b.startTime).getTime())[0];

    // Rule 3: Quiz is scheduled today (upcoming)
    if (upcomingQuiz && upcomingQuiz.scheduledDate === now.toISOString().split('T')[0]) {
      const startTime = upcomingQuiz.startTime;
      return {
        title: "Today's Assessment",
        message: `${upcomingQuiz.title} starts today at ${startTime}. Be prepared.`,
        icon: Clock,
        color: "bg-indigo-600",
        action: <Link to="/student?view=quizzes"><Button className="w-full bg-indigo-700 hover:bg-indigo-800">View Schedule</Button></Link>
      };
    }

    // Rule 4: Average score is low (below 60%)
    if (averageScore < 60 && quizAttempts.length > 0) {
      return {
        title: "Focus on Revision",
        message: "Revise before the next quiz to improve your performance. Review your past results.",
        icon: TrendingUp,
        color: "bg-red-600",
        action: <Link to="/student?view=my-results"><Button className="w-full bg-red-700 hover:bg-red-800">Review Results</Button></Link>
      };
    }

    // Default: All caught up
    return {
      title: "All Caught Up!",
      message: "You have no immediate actions required. Keep up the great work!",
      icon: CheckCircle,
      color: "bg-green-600",
      action: <Link to="/student?view=my-courses"><Button className="w-full bg-green-700 hover:bg-green-800">Continue Learning</Button></Link>
    };

  }, [quizzes, quizAttempts, studentName, averageScore]);

  return (
    <Card className={cn("shadow-lg text-white", recommendation.color)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <recommendation.icon className="h-6 w-6" />
          {recommendation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg opacity-90">{recommendation.message}</p>
        {recommendation.action}
      </CardContent>
    </Card>
  );
};

export default NextActionCard;