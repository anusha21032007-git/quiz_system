"use client";

import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuiz, Quiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ListChecks, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuestionCount } from '@/integrations/supabase/quizzes';

interface ScheduledQuizzesSectionProps {
  studentName: string;
}

type QuizStatus = 'Upcoming' | 'Live' | 'Expired' | 'Completed';

// Mock Course Data (Must match the names used in QuizCreator)
const MOCK_STUDENT_COURSES = [
  'CS 101: Introduction to Programming',
  'Math 202: Calculus II',
  'Physics 101: Mechanics',
  'General Studies' // Include a general course name if used
];

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
  // Assumes dateStr is YYYY-MM-DD and timeStr is HH:MM
  // We use local time zone interpretation for simplicity in a mock environment
  return new Date(dateStr + 'T' + timeStr + ':00');
};

// Component to display question count asynchronously
const QuestionCountDisplay = ({ quizId }: { quizId: string }) => {
  const { data: count, isLoading } = useQuestionCount(quizId);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
  }
  if (count === undefined || count === null) {
    return <span>N/A</span>;
  }
  return <span>{count} Qs</span>;
};


const ScheduledQuizzesSection = ({ studentName }: ScheduledQuizzesSectionProps) => {
  const { quizzes, quizAttempts, isQuizzesLoading } = useQuiz();
  const navigate = useNavigate();

  const scheduledQuizzes = useMemo(() => {
    if (isQuizzesLoading) return [];
    const now = new Date();

    return quizzes
      .filter(quiz => MOCK_STUDENT_COURSES.includes(quiz.courseName)) // FILTER by student's mock courses
      .map((quiz) => {
        const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
        const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);
        
        // 1. Check Completion Status
        const isCompleted = quizAttempts.some(
          (attempt) => attempt.quizId === quiz.id && attempt.studentName === studentName
        );

        let status: QuizStatus;
        let statusColor: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' = 'default';

        if (isCompleted) {
          status = 'Completed';
          statusColor = 'secondary';
        } else if (now < startTime) {
          status = 'Upcoming';
          statusColor = 'outline';
        } else if (now >= startTime && now <= endTime) {
          status = 'Live';
          statusColor = 'success';
        } else {
          status = 'Expired';
          statusColor = 'destructive';
        }

        return {
          ...quiz,
          startTime,
          endTime,
          status,
          statusColor,
          isCompleted,
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()); // Sort by scheduled time
  }, [quizzes, quizAttempts, studentName, isQuizzesLoading]);

  const handleStartQuiz = (quiz: Quiz) => {
    if (!studentName.trim()) {
      toast.error("Please ensure your name is entered in the Profile/Dashboard section before starting a quiz.");
      return;
    }
    
    const now = new Date();
    const start = createDateTime(quiz.scheduledDate, quiz.startTime);
    const end = createDateTime(quiz.scheduledDate, quiz.endTime);

    if (now < start) {
      toast.warning("This quiz is not live yet. Please wait for the scheduled start time.");
      return;
    }
    if (now > end) {
      toast.error("This quiz has expired and cannot be started.");
      return;
    }

    // If live and not completed, navigate to quiz page
    navigate(`/quiz/${quiz.id}`, { state: { studentName } });
  };

  const getButton = (quiz: typeof scheduledQuizzes[0]) => {
    switch (quiz.status) {
      case 'Upcoming':
        return (
          <Button disabled variant="outline" className="w-full sm:w-auto text-blue-500 border-blue-200">
            <Clock className="h-4 w-4 mr-2" /> Not Started Yet
          </Button>
        );
      case 'Live':
        return (
          <Button onClick={() => handleStartQuiz(quiz)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 animate-pulse">
            <ListChecks className="h-4 w-4 mr-2" /> Start Quiz
          </Button>
        );
      case 'Expired':
        return (
          <Button disabled variant="destructive" className="w-full sm:w-auto opacity-70">
            <XCircle className="h-4 w-4 mr-2" /> Missed
          </Button>
        );
      case 'Completed':
        // Find the latest attempt score for display
        const latestAttempt = quizAttempts
          .filter(a => a.quizId === quiz.id && a.studentName === studentName)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        const scoreDisplay = latestAttempt ? `${latestAttempt.score.toFixed(1)}/${latestAttempt.totalQuestions}` : 'N/A';

        return (
          <Link to="/leaderboard">
            <Button variant="secondary" className="w-full sm:w-auto">
              <CheckCircle className="h-4 w-4 mr-2" /> View Result ({scoreDisplay})
            </Button>
          </Link>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: QuizStatus) => {
    const baseClasses = "font-semibold text-xs uppercase";
    let colorClasses = '';
    let Icon = AlertTriangle;

    switch (status) {
      case 'Live':
        colorClasses = 'bg-green-100 text-green-800 border-green-400';
        Icon = Clock;
        break;
      case 'Upcoming':
        colorClasses = 'bg-blue-100 text-blue-800 border-blue-400';
        Icon = Calendar;
        break;
      case 'Expired':
        colorClasses = 'bg-gray-100 text-gray-600 border-gray-400';
        Icon = XCircle;
        break;
      case 'Completed':
        colorClasses = 'bg-purple-100 text-purple-800 border-purple-400';
        Icon = CheckCircle;
        break;
    }

    return (
      <Badge variant="outline" className={cn(baseClasses, colorClasses)}>
        <Icon className="h-3 w-3 mr-1" /> {status}
      </Badge>
    );
  };

  if (isQuizzesLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" /> Loading Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Fetching scheduled quizzes from the server...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Calendar className="h-6 w-6 text-indigo-600" /> Scheduled Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledQuizzes.length === 0 ? (
          <div className="text-center p-8">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No quizzes are currently scheduled for your course.</p>
            <p className="text-sm text-gray-400 mt-1">Check back later or contact your instructor.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {scheduledQuizzes.map((quiz) => (
              <li key={quiz.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 space-y-1 mb-3 lg:mb-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl text-gray-800">{quiz.title}</h3>
                    {getStatusBadge(quiz.status)}
                  </div>
                  <p className="text-sm text-gray-700">Course: <span className="font-medium">{quiz.courseName}</span></p>
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      {new Date(quiz.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      {quiz.startTime} - {quiz.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-4 w-4 text-indigo-500" />
                      {quiz.timeLimitMinutes} min (<QuestionCountDisplay quizId={quiz.id} />)
                    </span>
                  </div>
                </div>
                <div className="w-full lg:w-auto flex justify-end">
                  {getButton(quiz)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledQuizzesSection;