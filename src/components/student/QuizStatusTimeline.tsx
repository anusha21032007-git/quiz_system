"use client";

import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuiz, Quiz, QuizAttempt } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ListChecks, CheckCircle, XCircle, AlertTriangle, Loader2, TrendingUp, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuestionCount } from '@/integrations/supabase/quizzes';

interface QuizTimelineItem extends Quiz {
  status: 'Upcoming' | 'Live' | 'Expired' | 'Completed';
  statusColor: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  isCompleted: boolean;
  startTime: Date;
  endTime: Date;
  missedReason?: 'Time Over' | 'Not Attempted';
  latestAttempt?: QuizAttempt;
}

interface QuizStatusTimelineProps {
  studentName: string;
}

// Mock Course Data (Must match the names used in StudentDashboardContent)
const MOCK_STUDENT_COURSES = [
  'CS 101: Introduction to Programming',
  'Math 202: Calculus II',
  'Physics 101: Mechanics',
  'General Studies'
];

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
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

// Helper to get difficulty badge styling
const getDifficultyBadge = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
  let colorClasses = '';
  switch (difficulty) {
    case 'Easy':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'Medium':
      colorClasses = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      break;
    case 'Hard':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
  }
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs uppercase", colorClasses)}>
      <TrendingUp className="h-3 w-3 mr-1" /> {difficulty}
    </Badge>
  );
};

const QuizItem = ({ quiz, studentName, handleStartQuiz }: { quiz: QuizTimelineItem, studentName: string, handleStartQuiz: (quiz: Quiz) => void }) => {
  const getButton = () => {
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
        const scoreDisplay = quiz.latestAttempt ? `${quiz.latestAttempt.score.toFixed(1)}/${quiz.latestAttempt.totalQuestions}` : 'N/A';
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

  const getStatusBadge = () => {
    const baseClasses = "font-semibold text-xs uppercase";
    let colorClasses = '';
    let Icon = AlertTriangle;
    let label = quiz.status;

    switch (quiz.status) {
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
        label = quiz.missedReason ? `Missed (${quiz.missedReason})` : 'Expired';
        break;
      case 'Completed':
        colorClasses = 'bg-purple-100 text-purple-800 border-purple-400';
        Icon = CheckCircle;
        break;
    }

    return (
      <Badge variant="outline" className={cn(baseClasses, colorClasses)}>
        <Icon className="h-3 w-3 mr-1" /> {label}
      </Badge>
    );
  };

  return (
    <li className={cn(
      "flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow",
      quiz.status === 'Live' && "border-green-500 ring-2 ring-green-200" // Highlight Live quiz
    )}>
      <div className="flex-1 space-y-1 mb-3 lg:mb-0">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl text-gray-800">{quiz.title}</h3>
          {getStatusBadge()}
          {getDifficultyBadge(quiz.difficulty)}
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
          {quiz.negativeMarking && (
            <span className="flex items-center gap-1 text-red-500">
              <MinusCircle className="h-4 w-4" /> Negative Marking
            </span>
          )}
        </div>
      </div>
      <div className="w-full lg:w-auto flex justify-end">
        {getButton()}
      </div>
    </li>
  );
};

const QuizStatusTimeline = ({ studentName }: QuizStatusTimelineProps) => {
  const { quizzes, quizAttempts, isQuizzesLoading } = useQuiz();
  const navigate = useNavigate();

  const processedQuizzes = useMemo(() => {
    if (isQuizzesLoading) return [];
    const now = new Date();

    return quizzes
      .filter(quiz => MOCK_STUDENT_COURSES.includes(quiz.courseName)) // Course Filtering
      .map((quiz) => {
        const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
        const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);
        
        const latestAttempt = quizAttempts
          .filter(a => a.quizId === quiz.id && a.studentName === studentName)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        const isCompleted = !!latestAttempt;

        let status: QuizTimelineItem['status'];
        let statusColor: QuizTimelineItem['statusColor'];
        let missedReason: QuizTimelineItem['missedReason'] | undefined;

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
          // Expired/Missed logic
          status = 'Expired';
          statusColor = 'destructive';
          
          // Rule 3: Missed Reason Display
          // Since we don't track if a student *started* but didn't finish (which would result in an attempt),
          // we simplify: if it's expired and no attempt exists, it was 'Not Attempted'.
          missedReason = 'Not Attempted'; 
        }

        return {
          ...quiz,
          startTime,
          endTime,
          status,
          statusColor,
          isCompleted,
          missedReason,
          latestAttempt,
        } as QuizTimelineItem;
      });
  }, [quizzes, quizAttempts, studentName, isQuizzesLoading]);

  const groupedQuizzes = useMemo(() => {
    const groups: Record<string, QuizTimelineItem[]> = {
      Live: [],
      Upcoming: [],
      Completed: [],
      Expired: [],
    };

    processedQuizzes.forEach(quiz => {
      groups[quiz.status].push(quiz);
    });

    // Sort Upcoming by start time ascending
    groups.Upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    // Sort Completed and Expired by end time descending (most recent first)
    groups.Completed.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    groups.Expired.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

    return groups;
  }, [processedQuizzes]);

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

  const renderGroup = (status: keyof typeof groupedQuizzes, title: string, Icon: React.ElementType, color: string) => {
    const quizzes = groupedQuizzes[status];
    const isEmpty = quizzes.length === 0;

    // Rule 6: Meaningful Empty State Messages
    const emptyMessage = status === 'Upcoming' 
      ? "No upcoming quizzes scheduled. You're all caught up!"
      : status === 'Live'
      ? "No quizzes are currently live. Check back soon."
      : status === 'Completed'
      ? "You haven't completed any quizzes yet. Start your first one!"
      : "No recent missed quizzes.";

    return (
      <div className="relative pl-8 pb-8">
        {/* Vertical Line */}
        {status !== 'Expired' && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        )}
        
        {/* Icon Marker */}
        <div className={cn(
          "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-gray-900 z-10",
          color
        )}>
          <Icon className="h-4 w-4 text-white" />
        </div>

        <h3 className="text-2xl font-bold text-gray-800 mb-4 pt-1 flex items-center gap-2">
          {title} ({quizzes.length})
        </h3>

        {isEmpty ? (
          <Card className="p-6 shadow-sm border-dashed border-gray-300 bg-gray-50">
            <p className="text-gray-500">{emptyMessage}</p>
          </Card>
        ) : (
          <ul className="space-y-4">
            {quizzes.map(quiz => (
              <QuizItem key={quiz.id} quiz={quiz} studentName={studentName} handleStartQuiz={handleStartQuiz} />
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (isQuizzesLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-gray-500">Fetching scheduled quizzes from the server...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ListChecks className="h-7 w-7 text-indigo-600" /> Quiz Status Timeline
      </h2>
      <div className="space-y-6">
        {renderGroup('Live', 'Live Quizzes', Clock, 'bg-green-600')}
        {renderGroup('Upcoming', 'Upcoming Quizzes', Calendar, 'bg-blue-600')}
        {renderGroup('Completed', 'Completed Quizzes', CheckCircle, 'bg-purple-600')}
        {renderGroup('Expired', 'Missed/Expired Quizzes', XCircle, 'bg-red-600')}
      </div>
    </Card>
  );
};

export default QuizStatusTimeline;