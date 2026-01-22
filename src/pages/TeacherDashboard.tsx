"use client";

import React, { useMemo } from 'react';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import GenerateQuizLanding from '@/components/teacher/GenerateQuizLanding';
import UsersList from '@/components/teacher/UsersList';
import HistoryList from '@/components/teacher/HistoryList';
import CoursesList from '@/components/teacher/CoursesList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  Search,
  Bell,
  User,
  Users as UsersIcon,
  BookOpen,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudentCount } from '@/integrations/supabase/users'; // Import the new hook

const StatCard = ({ title, value, trend, icon: Icon, color, isLoading }: any) => (
  <div className={cn("bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm transition-all hover:shadow-md", color)}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-600" /> : value}
        </p>
      </div>
      <div className={cn("p-2 rounded-xl", color.replace('bg-', 'bg-').replace('border-', 'bg-').split(' ')[0] + "/10")}>
        <Icon className={cn("h-5 w-5", color.replace('bg-', 'text-').split(' ')[1])} />
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
      <TrendingUp className="h-3 w-3" />
      <span>{trend}</span>
      <span className="text-slate-400 font-normal ml-1">from last month</span>
    </div>
  </div>
);

const ActivityItem = ({ user, action, target, time, score, initials, color }: any) => (
  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold", color)}>
        {initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {user} <span className="font-normal text-slate-500">{action}</span> <span className="text-indigo-600">"{target}"</span>
        </p>
        <p className="text-xs text-slate-400">{time}</p>
      </div>
    </div>
    <div className="text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
      {score}%
    </div>
  </div>
);

const DeadlineItem = ({ title, time, status, color }: any) => (
  <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl hover:bg-slate-800 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm font-bold text-white">{title}</p>
      <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", color)}>
        {status}
      </div>
    </div>
    <p className="text-xs text-slate-400">{time}</p>
  </div>
);

// Helper function to get initials
const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Helper function to format time ago
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};


const TeacherDashboard = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'overview';

  const { data: studentCount, isLoading: isStudentCountLoading } = useStudentCount();
  const { quizzes, isQuizzesLoading, quizAttempts } = useQuiz();

  const activeQuizzesCount = useMemo(() => {
    if (isQuizzesLoading) return 0;
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    return quizzes.filter(quiz => {
      const isToday = quiz.scheduledDate === todayDate;
      if (!isToday) return false;

      const startTime = new Date(`${quiz.scheduledDate}T${quiz.startTime}`);
      const endTime = new Date(`${quiz.scheduledDate}T${quiz.endTime}`);

      return now >= startTime && now <= endTime && quiz.status === 'ACTIVE';
    }).length;
  }, [quizzes, isQuizzesLoading]);

  const upcomingDeadlines = useMemo(() => {
    if (isQuizzesLoading) return [];
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return quizzes
      .filter(quiz => {
        const quizDeadline = new Date(`${quiz.scheduledDate}T${quiz.endTime}`);
        return (
          quiz.status === 'ACTIVE' &&
          quizDeadline > now &&
          quizDeadline <= twentyFourHoursFromNow
        );
      })
      .sort((a, b) => {
        const deadlineA = new Date(`${a.scheduledDate}T${a.endTime}`).getTime();
        const deadlineB = new Date(`${b.scheduledDate}T${b.endTime}`).getTime();
        return deadlineA - deadlineB;
      })
      .map(quiz => {
        const deadline = new Date(`${quiz.scheduledDate}T${quiz.endTime}`);
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let status = 'Pending';
        let color = 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';

        if (diffHours < 3) {
          status = 'Urgent';
          color = 'bg-red-500/10 text-red-500 border border-red-500/20';
        } else if (diffHours < 12) {
          status = 'Active';
          color = 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
        }

        return {
          title: quiz.title,
          time: `Ends in ${diffHours}h ${diffMinutes}m`,
          status,
          color,
        };
      });
  }, [quizzes, isQuizzesLoading]);

  const recentActivity = useMemo(() => {
    if (isQuizzesLoading) return []; // Depend on quizzes loading for quiz titles
    return quizAttempts
      .filter(attempt => attempt.status === 'SUBMITTED') // Only show successfully submitted quizzes
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent
      .slice(0, 5) // Get top 5 recent activities
      .map((attempt: QuizAttempt) => {
        const quiz = quizzes.find(q => q.id === attempt.quizId);
        const quizTitle = quiz?.title || 'Unknown Quiz';
        const scorePercentage = (attempt.score / attempt.totalQuestions) * 100;

        return {
          user: attempt.studentName,
          action: "completed",
          target: quizTitle,
          time: formatTimeAgo(attempt.timestamp),
          score: scorePercentage.toFixed(0),
          initials: getInitials(attempt.studentName),
          color: "bg-indigo-100 text-indigo-600" // Consistent color for activity items
        };
      });
  }, [quizAttempts, quizzes, isQuizzesLoading]);


  const overviewContent = (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Professor</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Here's a professional overview of your classes today.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Status: Academic Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={studentCount}
          trend="+12%"
          icon={UsersIcon}
          color="border-indigo-100"
          isLoading={isStudentCountLoading}
        />
        <StatCard
          title="Active Quizzes"
          value={activeQuizzesCount}
          trend="+12%"
          icon={BookOpen}
          color="border-indigo-100"
          isLoading={isQuizzesLoading}
        />
        <StatCard
          title="Avg. Attendance"
          value="82%"
          trend="+12%"
          icon={TrendingUp}
          color="border-emerald-100"
        />
        <StatCard
          title="Hours Taught"
          value="156"
          trend="+12%"
          icon={Clock}
          color="border-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <ActivityItem
                  key={index}
                  user={item.user}
                  action={item.action}
                  target={item.target}
                  time={item.time}
                  score={item.score}
                  initials={item.initials}
                  color={item.color}
                />
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                No recent quiz submissions.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            Upcoming Deadlines
          </h3>
          <div className="space-y-4 flex-1">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((item, index) => (
                <DeadlineItem key={index} title={item.title} time={item.time} status={item.status} color={item.color} />
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                No upcoming deadlines in the next 24 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return overviewContent;
      case 'create-quiz': return <GenerateQuizLanding />;
      case 'courses': return <CoursesList />;
      case 'users': return <UsersList />;
      case 'history': return <HistoryList />;
      default: return overviewContent;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="w-72 fixed h-screen bg-white">
          <TeacherSidebar activeView={activeView} isMobile={false} />
        </aside>
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-h-screen", !isMobile && "ml-72")}>
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {isMobile && <TeacherSidebar activeView={activeView} isMobile={true} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students, quizzes..."
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl w-full focus-visible:ring-indigo-500/20 focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pl-6 border-l border-slate-100 ml-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Dr. Sarah Smith</p>
                <p className="text-[10px] text-slate-500 font-medium">Science Department</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;