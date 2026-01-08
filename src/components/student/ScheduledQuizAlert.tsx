"use client";

import React, { useMemo } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledQuizAlertProps {
  studentName: string;
}

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(\`\${dateStr}T\${timeStr}:00\`);
};

const ScheduledQuizAlert = ({ studentName }: ScheduledQuizAlertProps) => {
  const { quizzes, quizAttempts, isQuizzesLoading } = useQuiz();

  const todayAlert = useMemo(() => {
    if (isQuizzesLoading) {
        return { status: 'loading', title: "Loading Quizzes...", description: "Fetching schedule from server.", icon: Loader2, color: 'text-gray-500', isLive: false };
    }
    
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find quizzes scheduled for today that the student hasn't completed
    const todayQuizzes = quizzes.filter(quiz => {
      const isToday = quiz.scheduledDate === todayDate;
      const isCompleted = quizAttempts.some(
        (attempt) => attempt.quizId === quiz.id && attempt.studentName === studentName
      );
      return isToday && !isCompleted;
    }).sort((a, b) => {
        // Sort by start time
        const startA = createDateTime(a.scheduledDate, a.startTime).getTime();
        const startB = createDateTime(b.scheduledDate, b.startTime).getTime();
        return startA - startB;
    });

    if (todayQuizzes.length === 0) {
      return {
        status: 'none',
        title: "No quizzes scheduled for today",
        description: "Enjoy your day!",
        icon: Calendar,
        color: 'text-gray-500',
        isLive: false,
      };
    }

    // Focus on the next upcoming or currently live quiz
    const quiz = todayQuizzes[0];
    const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
    const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);

    let status: 'Upcoming' | 'Live' | 'Expired' = 'Upcoming';
    let color = 'text-blue-600';
    let description = \`Time: \${quiz.startTime} - \${quiz.endTime}\`;
    let Icon = Clock;
    let isLive = false;

    if (now >= startTime && now <= endTime) {
      status = 'Live';
      color = 'text-green-600';
      description = "Hurry up! The quiz is live now.";
      Icon = AlertTriangle;
      isLive = true;
    } else if (now > endTime) {
        status = 'Expired';
        color = 'text-red-600';
        description = "This quiz has expired.";
        Icon = XCircle;
    }

    return {
      status: status,
      title: quiz.title,
      description: description,
      icon: Icon,
      color: color,
      isLive: isLive,
      quiz,
    };
  }, [quizzes, quizAttempts, studentName, isQuizzesLoading]);

  const { status, title, description, icon: Icon, color, isLive } = todayAlert;

  if (status === 'none') {
    return (
      <Alert className="p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Icon className={cn("h-4 w-4", color)} />
        <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
        <AlertDescription className="text-xs text-gray-600 dark:text-gray-400">
          {description}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status === 'loading') {
      return (
        <Alert className="p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Icon className={cn("h-4 w-4 animate-spin", color)} />
            <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
            <AlertDescription className="text-xs text-gray-600 dark:text-gray-400">
              {description}
            </AlertDescription>
        </Alert>
      );
  }


  return (
    <Alert className={cn(
        "p-3 transition-all duration-300",
        isLive ? "bg-green-100 border-green-400 dark:bg-green-950 dark:border-green-700 animate-pulse" : "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700"
    )}>
      <Icon className={cn("h-4 w-4", color)} />
      <AlertTitle className="text-sm font-bold flex items-center justify-between">
        Today's Scheduled Quiz
        <Badge variant={isLive ? 'success' : 'outline'} className={cn("ml-2 text-xs", isLive ? "bg-green-600 text-white" : "bg-blue-200 text-blue-800")}>
            {status}
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-xs space-y-1">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        <p className={cn("text-gray-700 dark:text-gray-300", isLive && "font-bold")}>{description}</p>
      </AlertDescription>
    </Alert>
  );
};

export default ScheduledQuizAlert;