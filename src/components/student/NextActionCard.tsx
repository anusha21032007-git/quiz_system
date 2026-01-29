"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';
import { useQuiz, Quiz } from '@/context/QuizContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // FIX: Import cn

interface NextActionCardProps {
  studentName: string;
  averageScore: number;
  quizzes: Quiz[]; // Using Quiz type from context
}

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(dateStr + 'T' + timeStr + ':00');
};

const NextActionCard = ({ studentName, averageScore, quizzes: propQuizzes }: NextActionCardProps) => {
  const { quizAttempts, hasNewQuizzes } = useQuiz();
  const now = new Date();

  // Filter out interviews and non-ACTIVE quizzes from the next action card
  const quizzes = useMemo(() =>
    propQuizzes.filter(q => !q.isCompetitive && q.status === 'ACTIVE'),
    [propQuizzes]);

  const recommendation = useMemo(() => {
    // Rule 1: No quiz attempted yet
    if (quizAttempts.length === 0) {
      return {
        title: "Simulation Required",
        message: "No operational data detected. Initialize your first simulation to begin analysis.",
        icon: BookOpen,
        color: "border-primary/30",
        accent: "text-primary",
        bg: "bg-primary/5",
        action: <Link to="/student?view=quizzes" className="block"><Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20">Access Library</Button></Link>
      };
    }

    // Find the next live quiz
    const liveQuiz = quizzes.find(quiz => {
      const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
      const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);

      // Strict Completion Check: Normalize names to avoid case/space issues
      const isCompleted = quizAttempts.some(
        (attempt) => attempt.quizId === quiz.id &&
          attempt.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()
      );

      // Also check if max attempts reached (if not fully completed logic, but usually 1 attempt = done for this alert)
      const attemptsCount = quizAttempts.filter(
        (a) => a.quizId === quiz.id &&
          a.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()
      ).length;
      const maxAttempts = quiz.maxAttempts || 1;

      return now >= startTime && now <= endTime && !isCompleted && attemptsCount < maxAttempts;
    });

    // Rule 2: Quiz is scheduled today and is live
    if (liveQuiz) {
      return {
        title: "Assessment Operative",
        message: `DECRYPTED: ${liveQuiz.title} is active until ${liveQuiz.endTime}. Urgent action required.`,
        icon: AlertTriangle,
        color: "border-success/30",
        accent: "text-success",
        bg: "bg-success/5",
        action: <Link to={`/quiz/${liveQuiz.id}`} className="block"><Button className="w-full h-12 bg-success hover:bg-success/90 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-success/20 animate-pulse">Initiate Simulation</Button></Link>
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
        title: "Scheduled Operation",
        message: `${upcomingQuiz.title} sequence begins today at ${startTime}. Stand by.`,
        icon: Clock,
        color: "border-primary/20",
        accent: "text-primary",
        bg: "bg-primary/5",
        action: <Link to="/student?view=quizzes" className="block"><Button className="w-full h-12 bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 font-black uppercase tracking-widest text-xs rounded-xl shadow-white/5">View Protocol</Button></Link>
      };
    }

    // Rule 4: Average score is low (below 60%)
    if (averageScore < 60 && quizAttempts.length > 0) {
      return {
        title: "Performance Warning",
        message: "Internal analysis suggests immediate revision. Average accuracy is below historical standards.",
        icon: TrendingUp,
        color: "border-danger/30",
        accent: "text-danger",
        bg: "bg-danger/5",
        action: <Link to="/student?view=my-results" className="block"><Button className="w-full h-12 bg-danger hover:bg-danger/90 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-danger/20">Review Archives</Button></Link>
      };
    }

    // Default: All caught up
    return {
      title: "All Sequences Nominal",
      message: "No immediate actions required. Your standing in the simulation is stable.",
      icon: CheckCircle,
      color: "border-slate-800",
      accent: "text-success",
      bg: "bg-slate-900/50",
      action: <Link to="/student?view=my-courses" className="block"><Button className="w-full h-12 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 font-black uppercase tracking-widest text-xs rounded-xl">Continue Study</Button></Link>
    };

  }, [quizzes, quizAttempts, studentName, averageScore]);

  return (
    <Card className={cn("glass-card border-white/50 shadow-2xl relative overflow-hidden group hover:translate-y-[-5px] bg-white/40", recommendation.color === "border-primary/30" ? "border-[#6C8BFF]/40" : recommendation.color === "border-success/30" ? "border-[#4EE3B2]/40" : recommendation.color === "border-danger/30" ? "border-[#FF6B8A]/40" : "border-white/40")}>
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-all group-hover:bg-white/20" />

      <CardHeader className="p-10 pb-6 relative z-10">
        <CardTitle className="flex items-center gap-6 text-3xl font-black uppercase tracking-tighter text-[#1E2455] relative">
          <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center border shadow-xl bg-white/60", recommendation.accent === "text-primary" ? "text-[#6C8BFF] border-[#6C8BFF]/30" : recommendation.accent === "text-success" ? "text-[#4EE3B2] border-[#4EE3B2]/30" : recommendation.accent === "text-danger" ? "text-[#FF6B8A] border-[#FF6B8A]/30" : "text-[#7A80B8] border-white/60")}>
            <recommendation.icon className="h-8 w-8" />
          </div>
          <span className="flex-grow">{recommendation.title}</span>
          {hasNewQuizzes && (
            <span className="absolute -top-1 -right-2 flex h-5 w-5 rounded-full bg-[#FF6B8A] shadow-lg ring-4 ring-white animate-bounce" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-10 pt-0 space-y-8 relative z-10">
        <p className="text-2xl font-black text-[#3A3F6B] opacity-70 italic tracking-tight leading-snug">{recommendation.message}</p>
        <div className="pt-4">
          {recommendation.action}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextActionCard;