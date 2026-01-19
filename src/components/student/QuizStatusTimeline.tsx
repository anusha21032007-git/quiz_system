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

interface QuizTimelineItem extends Omit<Quiz, 'status' | 'startTime' | 'endTime'> {
  status: 'Upcoming' | 'Live' | 'Expired' | 'Completed' | string;
  statusColor: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  isCompleted: boolean;
  startTime: Date;
  endTime: Date;
  missedReason?: 'Time Over' | 'Not Attempted' | string;
  latestAttempt?: QuizAttempt;
}

interface QuizStatusTimelineProps {
  studentName: string;
  quizzes?: Quiz[]; // Optional to maintain backward compatibility during incremental refactor or if accessed directly
}

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

interface QuizTimelineItem extends Omit<Quiz, 'status' | 'startTime' | 'endTime'> {
  status: 'Upcoming' | 'Live' | 'Expired' | 'Completed' | string;
  statusColor: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  isCompleted: boolean;
  startTime: Date;
  endTime: Date;
  missedReason?: 'Time Over' | 'Not Attempted' | string;
  latestAttempt?: QuizAttempt;
}

const QuizItem = ({ quiz, studentName, handleStartQuiz }: { quiz: QuizTimelineItem, studentName: string, handleStartQuiz: (quiz: any) => void }) => {
  const { quizAttempts } = useQuiz();

  const attemptsCount = useMemo(() => {
    return quizAttempts.filter(a => a.quizId === quiz.id && a.studentName === studentName).length;
  }, [quizAttempts, quiz.id, studentName]);

  const maxAttempts = quiz.maxAttempts || 1; // Default to 1
  const attemptsLeft = maxAttempts - attemptsCount;
  const isMaxAttemptsReached = attemptsLeft <= 0;

  const getButton = () => {
    switch (quiz.status) {
      case 'Upcoming':
        return (
          <Button disabled variant="outline" className="w-full sm:w-auto text-blue-500 border-blue-200">
            <Clock className="h-4 w-4 mr-2" /> Not Started Yet
          </Button>
        );
      case 'Live':
        if (isMaxAttemptsReached) {
          return (
            <Button disabled variant="outline" className="w-full sm:w-auto text-orange-500 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 mr-2" /> Max Attempts Reached
            </Button>
          );
        }
        return (
          <Button onClick={() => handleStartQuiz(quiz)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 animate-pulse">
            <ListChecks className="h-4 w-4 mr-2" /> Start Quiz
            {maxAttempts > 1 && <span className="ml-1 text-xs opacity-80">({attemptsLeft} left)</span>}
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
        // Differentiate Passed vs Failed
        const attempt = quiz.latestAttempt;
        const passMark = quiz.passPercentage || 40; // Default 40% if not set
        const totalQuestions = quiz.totalQuestions || attempt?.totalQuestions || 1;

        let isPassed = false;
        if (attempt) {
          // Calculate if passed if 'passed' property is missing or unreliable
          const percentage = (attempt.score / totalQuestions) * 100;
          isPassed = percentage >= passMark;
        }

        if (isPassed) {
          colorClasses = 'bg-green-100 text-green-800 border-green-400';
          Icon = CheckCircle;
          label = 'PASSED';
        } else {
          colorClasses = 'bg-red-100 text-red-800 border-red-400';
          Icon = XCircle;
          label = 'FAILED';
        }
        break;
    }

    return (
      <div className="flex gap-2">
        <Badge variant="outline" className={cn(baseClasses, colorClasses)}>
          <Icon className="h-3 w-3 mr-1" /> {label}
        </Badge>
        {quiz.status === 'Live' && (
          <Badge variant="outline" className={cn(baseClasses, "bg-indigo-50 text-indigo-700 border-indigo-200")}>
            Attempts: {attemptsCount}/{maxAttempts}
          </Badge>
        )}
      </div>
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
            {quiz.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {quiz.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

const QuizStatusTimeline = ({ studentName, quizzes: propQuizzes }: QuizStatusTimelineProps) => {
  const { quizAttempts, isQuizzesLoading: contextLoading } = useQuiz();
  // If quizzes are passed via props (from local storage), we don't need to wait for context loading
  const quizzes = propQuizzes || [];
  const isQuizzesLoading = propQuizzes ? false : contextLoading;

  const navigate = useNavigate();
  // Upcoming tab removed as quizzes should only appear at scheduled time
  const [activeTab, setActiveTab] = React.useState<'Live' | 'Completed' | 'Expired'>('Live');

  // Real-time update for scheduled quizzes
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    // Update 'now' every 10 seconds to check for start times
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const processedQuizzes = useMemo(() => {
    if (isQuizzesLoading) return [];

    return quizzes
      .filter(q => !q.isInterview) // FILTER: Only show standard quizzes (ACTIVE or DELETED)
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
        } else if (quiz.status === 'DELETED') {
          // DELETED quizzes are treated as Expired/Missed if not taken
          status = 'Expired';
          statusColor = 'destructive';
          missedReason = 'Cancelled by Teacher';
        } else if (now < startTime) {
          status = 'Upcoming';
          statusColor = 'outline';
        } else if (now >= startTime && now <= endTime) {
          // Live check: Ensure NOT completed and attempts left
          // (isCompleted is already checked above, but good to be explicit in logic flow)
          const attemptsCount = quizAttempts.filter(a => a.quizId === quiz.id && a.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()).length;
          const maxAttempts = quiz.maxAttempts || 1;

          if (attemptsCount >= maxAttempts) {
            // If max attempts reached, treating as Completed/Done for visibility? 
            // User asked: "if completed... should go from there (live)"
            // So we push to Completed? Or separate? 
            // Let's treat it as Completed for the timeline grouping to hide from Live.
            status = 'Completed';
            statusColor = 'secondary';
          } else {
            status = 'Live';
            statusColor = 'success';
          }
        } else {
          status = 'Expired';
          statusColor = 'destructive';
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
      })
      .filter(q => q.status !== 'Upcoming'); // STRICT VISIBILITY: Hide upcoming quizzes
  }, [quizzes, quizAttempts, studentName, isQuizzesLoading, now]);

  const groupedQuizzes = useMemo(() => {
    const groups: Record<string, QuizTimelineItem[]> = {
      Live: [],
      Completed: [],
      Expired: [],
    };

    processedQuizzes.forEach(quiz => {
      if (groups[quiz.status]) {
        groups[quiz.status].push(quiz);
      }
    });

    groups.Completed.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    groups.Expired.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

    return groups;
  }, [processedQuizzes]);

  // Set initial tab logic updated (no upcoming)
  React.useEffect(() => {
    // If on Live tab and it's empty, but we have completed/expired, staying on Live is fine (shows "No live quizzes")
    // Unless we want to auto-switch? Standard behavior is usually default to Live.
  }, [isQuizzesLoading, groupedQuizzes]);


  const handleStartQuiz = (quiz: any) => {
    if (!studentName.trim()) {
      toast.error("Please ensure your name is entered in the Profile/Dashboard section before starting a quiz.");
      return;
    }

    // Check Max Attempts
    const attemptsCount = quizAttempts.filter(a => a.quizId === quiz.id && a.studentName === studentName).length;
    const maxAttempts = quiz.maxAttempts || 1;
    if (attemptsCount >= maxAttempts) {
      toast.error(`You have reached the maximum number of attempts (${maxAttempts}) for this quiz.`);
      return;
    }

    const currentNow = new Date();
    const start = createDateTime(quiz.scheduledDate, quiz.startTime);
    const end = createDateTime(quiz.scheduledDate, quiz.endTime);

    if (currentNow < start) {
      toast.warning("This quiz is not live yet. Please wait for the scheduled start time.");
      return;
    }
    if (currentNow > end) {
      toast.error("This quiz has expired and cannot be started.");
      return;
    }

    navigate(`/quiz/${quiz.id}`, { state: { studentName } });
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

  const renderContent = () => {
    const quizzes = groupedQuizzes[activeTab];
    const isEmpty = quizzes?.length === 0 || !quizzes;

    const emptyMessage = activeTab === 'Live'
      ? "No quizzes are currently live. Check back at your scheduled time."
      : activeTab === 'Completed'
        ? "No completed quizzes yet."
        : "No missed quizzes.";

    if (isEmpty) {
      return (
        <Card className="p-12 shadow-sm border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {activeTab === 'Live' && <Clock className="h-6 w-6 text-gray-400" />}
            {activeTab === 'Completed' && <CheckCircle className="h-6 w-6 text-gray-400" />}
            {activeTab === 'Expired' && <XCircle className="h-6 w-6 text-gray-400" />}
          </div>
          <p className="text-gray-500 font-medium">{emptyMessage}</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {quizzes.map(quiz => (
          <QuizItem key={quiz.id} quiz={quiz} studentName={studentName} handleStartQuiz={handleStartQuiz} />
        ))}
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon, colorClass }: { id: typeof activeTab, label: string, icon: any, colorClass: string }) => {
    const isActive = activeTab === id;
    const count = groupedQuizzes[id]?.length || 0;

    return (
      <button
        onClick={() => setActiveTab(id)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-md transition-all font-medium text-sm relative",
          isActive
            ? `bg-indigo-600 text-white shadow-md`
            : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
        )}
      >
        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-500")} />
        {label}
        {count > 0 && (
          <span className={cn(
            "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          )}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 pb-2">
        <TabButton id="Live" label="Live Quizzes" icon={Clock} colorClass="bg-green-600" />
        {/* Upcoming tab removed */}
        <TabButton id="Completed" label="Completed" icon={CheckCircle} colorClass="bg-purple-600" />
        <TabButton id="Expired" label="Missed" icon={XCircle} colorClass="bg-red-600" />
      </div>

      <div className="min-h-[300px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default QuizStatusTimeline;