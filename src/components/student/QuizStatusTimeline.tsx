"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuiz, Quiz, QuizAttempt } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ListChecks, CheckCircle, XCircle, AlertTriangle, Loader2, TrendingUp, MinusCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuestionCount } from '@/integrations/supabase/quizzes';

interface QuizTimelineItem extends Omit<Quiz, 'status' | 'startTime' | 'endTime'> {
  status: 'Upcoming' | 'Live' | 'Expired' | 'Completed' | 'Not Completed' | string;
  statusColor: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  isCompleted: boolean;
  startTime: Date;
  endTime: Date;
  missedReason?: 'Time Over' | 'Not Attempted' | string;
  latestAttempt?: QuizAttempt;
}

interface QuizStatusTimelineProps {
  studentName: string;
  quizzes?: Quiz[];
}

const createDateTime = (dateStr: string, timeStr: string): Date => {
  if (!dateStr || !timeStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  // Note: month is 0-indexed in Date constructor
  return new Date(year, month - 1, day, hours, minutes, 0);
};

const QuestionCountDisplay = ({ quizId }: { quizId: string }) => {
  const { data: count, isLoading } = useQuestionCount(quizId);
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />;
  return <span>{count || 0} Qs</span>;
};

const QuizItem = ({ quiz, studentName, handleStartQuiz }: { quiz: QuizTimelineItem, studentName: string, handleStartQuiz: (quiz: any) => void }) => {
  const { quizAttempts } = useQuiz();
  const attempts = useMemo(() => quizAttempts.filter(a => a.quizId === quiz.id && a.studentName === studentName), [quizAttempts, quiz.id, studentName]);
  const attemptsCount = attempts.length;
  const maxAttempts = quiz.maxAttempts || 1;
  const isMaxAttemptsReached = attemptsCount >= maxAttempts;
  const latestAttempt = attempts.sort((a, b) => b.timestamp - a.timestamp)[0];

  let status = quiz.status;
  let isSubmitted = false;

  if (latestAttempt) {
    isSubmitted = latestAttempt.status === 'SUBMITTED';
    if (isSubmitted) {
      status = latestAttempt.passed ? 'Completed' : 'Not Completed';
    } else if (latestAttempt.status === 'CORRUPTED') {
      if (isMaxAttemptsReached) {
        status = 'Not Completed';
      } else {
        status = quiz.status;
      }
    }
  }

  const formattedStartTime = quiz.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedEndTime = quiz.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getButton = () => {
    if (quiz.competitionMode && attemptsCount > 0) {
      if (latestAttempt?.passed) {
        return <Link to="/leaderboard"><Button variant="secondary" className="w-full sm:w-auto"><CheckCircle className="h-4 w-4 mr-2" /> Result Available</Button></Link>;
      }
      return <Button disabled variant="outline" className="w-full sm:w-auto text-orange-500 border-orange-200">Single Attempt Only</Button>;
    }

    if (status === 'Completed') {
      return <Link to="/leaderboard"><Button variant="secondary" className="w-full sm:w-auto"><CheckCircle className="h-4 w-4 mr-2" /> Result Available</Button></Link>;
    }

    if (status === 'Not Completed') {
      if (isMaxAttemptsReached) {
        return <Button disabled variant="destructive" className="w-full sm:w-auto opacity-70"><XCircle className="h-4 w-4 mr-2" /> Max Attempts Reached</Button>;
      }
      if (quiz.status === 'Live') {
        return <Button onClick={() => handleStartQuiz(quiz)} className={cn("w-full sm:w-auto", attemptsCount > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700")}><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>;
      }
      return <Button disabled variant="outline" className="w-full sm:w-auto opacity-70"><XCircle className="h-4 w-4 mr-2" /> Expired</Button>;
    }

    switch (status) {
      case 'Live':
        if (isMaxAttemptsReached) return <Button disabled variant="outline" className="w-full sm:w-auto text-warning border-warning/20 bg-warning/5">Max Attempts Reached</Button>;
        return <Button onClick={() => handleStartQuiz(quiz)} className="w-full sm:w-auto bg-info hover:bg-info/90 text-white animate-pulse"><ListChecks className="h-4 w-4 mr-2" /> Start Quiz</Button>;
      case 'Upcoming':
        return <Button disabled variant="outline" className="w-full sm:w-auto text-slate-400 border-slate-200"><Clock className="h-4 w-4 mr-2" /> Starts at {formattedStartTime}</Button>;
      case 'Expired':
        return <Button disabled variant="destructive" className="w-full sm:w-auto opacity-70"><XCircle className="h-4 w-4 mr-2" /> Missed</Button>;
      default: return null;
    }
  };

  const getBadge = () => {
    if (status === 'Completed') {
      return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
    }
    if (status === 'Not Completed') {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Not Completed</Badge>;
    }
    if (status === 'Live') {
      return <Badge className="bg-info/10 text-info border-info/20">Live</Badge>;
    }
    if (status === 'Upcoming') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Scheduled</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
  };

  return (
    <li className={cn("flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 border rounded-xl bg-card shadow-sm transition-all", quiz.status === 'Live' && "border-info ring-2 ring-info/10", status === 'Not Completed' && "border-destructive/30 ring-1 ring-destructive/5")}>
      <div className="flex-1 space-y-1 mb-3 lg:mb-0">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-gray-800">{quiz.title}</h3>
          {getBadge()}
        </div>
        <p className="text-xs text-gray-500 font-medium">Course: {quiz.courseName}</p>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 font-medium italic">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(quiz.scheduledDate).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formattedStartTime} - {formattedEndTime}</span>
          {attemptsCount > 0 && <span className="text-xs font-bold text-secondary">Attempts: {attemptsCount}/{maxAttempts}</span>}
        </div>
      </div>
      <div className="w-full lg:w-auto">{getButton()}</div>
    </li>
  );
};

const QuizStatusTimeline = ({ studentName, quizzes: propQuizzes }: QuizStatusTimelineProps) => {
  const { quizAttempts, quizzes: contextQuizzes, isQuizzesLoading } = useQuiz();
  const quizzes = propQuizzes || contextQuizzes;
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'Live' | 'Scheduled' | 'Completed' | 'Expired'>('Live');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const processedQuizzes = useMemo(() => {
    return quizzes
      .filter(q => !q.isInterview && q.status !== 'DELETED' && !q.isCompetitive)
      .map(quiz => {
        const start = createDateTime(quiz.scheduledDate, quiz.startTime);
        const end = createDateTime(quiz.scheduledDate, quiz.endTime);
        const attempts = quizAttempts.filter(a => a.quizId === quiz.id && a.studentName === studentName);

        const maxAttempts = quiz.maxAttempts || 1;
        const attemptsCount = attempts.length;
        const isMaxAttemptsReached = attemptsCount >= maxAttempts;

        const latestSubmittedAttempt = attempts.find(a => a.status === 'SUBMITTED');

        // Determine status based on attempts and schedule
        let status = 'Upcoming';
        if (latestSubmittedAttempt?.passed) {
          status = 'Completed';
        } else if (isMaxAttemptsReached) {
          status = 'Not Completed';
        } else if (now >= start && now <= end) {
          status = 'Live';
        } else if (now > end) {
          status = 'Expired';
        } else {
          status = 'Upcoming';
        }

        return { ...quiz, startTime: start, endTime: end, status, isCompleted: !!latestSubmittedAttempt?.passed };
      });
    // Removed filter that hid Upcoming quizzes
  }, [quizzes, quizAttempts, studentName, now]);

  const grouped = {
    Live: processedQuizzes.filter(q => q.status === 'Live'),
    Scheduled: processedQuizzes.filter(q => q.status === 'Upcoming'),
    Completed: processedQuizzes.filter(q => q.status === 'Completed' || q.status === 'Not Completed'),
    Expired: processedQuizzes.filter(q => q.status === 'Expired')
  };

  const handleStartQuiz = (quiz: any) => {
    navigate(`/quiz/${quiz.id}`, { state: { studentName } });
  };

  if (isQuizzesLoading) return <div className="p-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {(['Live', 'Scheduled', 'Completed', 'Expired'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap", activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800")}>
            {tab} ({grouped[tab].length})
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {grouped[activeTab as keyof typeof grouped] && grouped[activeTab as keyof typeof grouped].length > 0 ? (
          grouped[activeTab as keyof typeof grouped].map(quiz => <QuizItem key={quiz.id} quiz={quiz as any} studentName={studentName} handleStartQuiz={handleStartQuiz} />)
        ) : (
          <Card className="p-12 text-center border-dashed"><p className="text-slate-400 font-medium italic">No quizzes found in this category.</p></Card>
        )}
      </div>
    </div>
  );
};

export default QuizStatusTimeline;