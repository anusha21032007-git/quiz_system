"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuiz, Quiz, QuizAttempt } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ListChecks, CheckCircle, XCircle, AlertTriangle, Loader2, TrendingUp, MinusCircle, RefreshCw, Brain } from 'lucide-react';
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
        return <Link to="/leaderboard"><Button className="w-full sm:w-auto h-12 bg-white/40 hover:bg-white/60 text-[#1E2455] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white/60 shadow-lg"><CheckCircle className="h-4 w-4 mr-2 text-[#4EE3B2]" /> Result Available</Button></Link>;
      }
      return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#FFB86C] font-black uppercase tracking-[0.2em] text-[10px] border border-[#FFB86C]/30 rounded-2xl opacity-80 cursor-not-allowed">Single Attempt Only</Button>;
    }

    if (status === 'Completed') {
      return <Link to="/leaderboard"><Button className="w-full sm:w-auto h-12 bg-white/40 hover:bg-white/60 text-[#1E2455] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white/60 shadow-lg"><CheckCircle className="h-4 w-4 mr-2 text-[#4EE3B2]" /> Result Available</Button></Link>;
    }

    if (status === 'Not Completed') {
      if (isMaxAttemptsReached) {
        return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#FF6B8A] font-black uppercase tracking-[0.2em] text-[10px] border border-[#FF6B8A]/30 rounded-2xl opacity-80 cursor-not-allowed"><XCircle className="h-4 w-4 mr-2" /> Max Attempts Reached</Button>;
      }
      if (quiz.status === 'Live') {
        return <Button onClick={() => handleStartQuiz(quiz)} className="w-full sm:w-auto h-12 bg-gradient-to-r from-[#FFB86C] to-[#FF6B8A] text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>;
      }
      return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] border border-[#7A80B8]/30 rounded-2xl opacity-60 cursor-not-allowed"><XCircle className="h-4 w-4 mr-2" /> Expired</Button>;
    }

    switch (status) {
      case 'Live':
        if (isMaxAttemptsReached) return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#FFB86C] font-black uppercase tracking-[0.2em] text-[10px] border border-[#FFB86C]/30 rounded-2xl opacity-80 cursor-not-allowed">Max Attempts Reached</Button>;
        return <Button onClick={() => handleStartQuiz(quiz)} className="pastel-button-primary w-full sm:w-auto h-12 px-8 text-[11px] tracking-[0.2em] shadow-lg animate-pulse"><ListChecks className="h-4 w-4 mr-2" /> Start Simulation</Button>;
      case 'Upcoming':
        return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] border border-[#7A80B8]/30 rounded-2xl opacity-80 cursor-not-allowed"><Clock className="h-4 w-4 mr-2" /> Starts at {formattedStartTime}</Button>;
      case 'Expired':
        return <Button disabled className="w-full sm:w-auto h-12 bg-transparent text-[#FF6B8A] font-black uppercase tracking-[0.2em] text-[10px] border border-[#FF6B8A]/30 rounded-2xl opacity-60 cursor-not-allowed"><XCircle className="h-4 w-4 mr-2" /> Missed</Button>;
      default: return null;
    }
  };

  const getBadge = () => {
    if (status === 'Completed') {
      return <Badge className="bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 font-black uppercase tracking-wider text-[9px] px-3 py-1 rounded-lg border">Completed</Badge>;
    }
    if (status === 'Not Completed') {
      return <Badge className="bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20 font-black uppercase tracking-wider text-[9px] px-3 py-1 rounded-lg border">Failed</Badge>;
    }
    if (status === 'Live') {
      return <Badge className="bg-[#6C8BFF]/10 text-[#6C8BFF] border-[#6C8BFF]/20 font-black uppercase tracking-wider text-[9px] px-3 py-1 rounded-lg border animate-pulse">Live Now</Badge>;
    }
    if (status === 'Upcoming') {
      return <Badge variant="outline" className="text-[#FFB86C] border-[#FFB86C]/30 font-black uppercase tracking-wider text-[9px] px-3 py-1 rounded-lg">Scheduled</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-500 font-black uppercase tracking-wider text-[9px] px-3 py-1 rounded-lg">{status}</Badge>;
  };

  return (
    <div className={cn(
      "flex flex-col lg:flex-row justify-between items-start lg:items-center p-8 rounded-[32px] glass-card border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] group relative overflow-hidden",
      quiz.status === 'Live' && "border-[#6C8BFF]/50 shadow-[#6C8BFF]/10",
      status === 'Not Completed' && "border-[#FF6B8A]/30 opacity-90"
    )}>
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex-1 space-y-3 mb-6 lg:mb-0 relative z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="font-black text-xl text-[#1E2455] uppercase tracking-tighter group-hover:text-[#6C8BFF] transition-colors">{quiz.title}</h3>
          {getBadge()}
        </div>
        <p className="text-xs text-[#7A80B8] font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E38AD6]" />
          Course: {quiz.courseName}
        </p>
        <div className="flex flex-wrap items-center gap-6 text-[10px] text-[#3A3F6B] pt-2 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-lg border border-white/40">
            <Calendar className="h-3 w-3 text-[#6C8BFF]" /> {new Date(quiz.scheduledDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-lg border border-white/40">
            <Clock className="h-3 w-3 text-[#E38AD6]" /> {formattedStartTime} - {formattedEndTime}
          </span>
          {attemptsCount > 0 && (
            <span className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
              isMaxAttemptsReached ? "bg-[#FF6B8A]/10 border-[#FF6B8A]/20 text-[#FF6B8A]" : "bg-[#FFB86C]/10 border-[#FFB86C]/20 text-[#FFB86C]"
            )}>
              Attempts: {attemptsCount}/{maxAttempts}
            </span>
          )}
          <span className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-lg border border-white/40">
            <Brain className="h-3 w-3 text-[#4EE3B2]" /> <QuestionCountDisplay quizId={quiz.id} />
          </span>
        </div>
      </div>
      <div className="w-full lg:w-auto relative z-10">{getButton()}</div>
    </div>
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
    <div className="space-y-8">
      <div className="flex gap-4 bg-white/30 backdrop-blur-xl p-2 rounded-2xl w-fit overflow-x-auto max-w-full border border-white/50 shadow-xl">
        {(['Live', 'Scheduled', 'Completed', 'Expired'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-8 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all whitespace-nowrap uppercase", activeTab === tab ? "bg-white text-[#6C8BFF] shadow-lg scale-105" : "text-[#7A80B8] hover:text-[#1E2455] hover:bg-white/20")}>
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