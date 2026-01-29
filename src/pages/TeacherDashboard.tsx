"use client";

import React, { useMemo, useState } from 'react';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import GenerateQuizLanding from '@/components/teacher/GenerateQuizLanding';
import UsersList from '@/components/teacher/UsersList';
import AvailableQuizzesList from '@/components/teacher/AvailableQuizzesList';
import HistoryList from '@/components/teacher/HistoryList';
import CoursesList from '@/components/teacher/CoursesList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import TeacherProfileEdit from '@/components/teacher/TeacherProfileEdit';
import { useAuth } from '@/context/AuthContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  Search,
  Bell,
  User,
  UserCircle,
  Users as UsersIcon,
  BookOpen,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  Loader2,
  Trophy,
  Edit,
  LogOut,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudentCount } from '@/integrations/supabase/users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StatCard = ({ title, value, trend, icon: Icon, color, isLoading }: any) => (
  <div className="glass-card p-7 hover:translate-y-[-4px] hover:shadow-glass-hover transition-all duration-300 border-white/50">
    <div className="flex justify-between items-start mb-5">
      <div>
        <p className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.15em] mb-1">{title}</p>
        <p className="text-4xl font-black text-[#1E2455] tracking-tight">
          {isLoading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : value}
        </p>
      </div>
      <div className={cn("p-3 rounded-[18px] bg-white/40 shadow-sm border border-white/50", color)}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4EE3B2]">
      <div className="bg-[#4EE3B2]/10 p-1 rounded-full">
        <TrendingUp className="h-3 w-3" />
      </div>
      <span>{trend}</span>
      <span className="text-[#7A80B8] font-bold opacity-60 ml-0.5">from last month</span>
    </div>
  </div>
);

const ActivityItem = ({ user, action, target, time, score, initials, color }: any) => (
  <div className="flex items-center justify-between p-5 hover:bg-white/40 transition-all rounded-[22px] group border border-transparent hover:border-white/40 hover:shadow-sm">
    <div className="flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-black shadow-sm border border-white/30", color)}>
        {initials}
      </div>
      <div>
        <p className="text-sm font-bold text-[#1E2455]">
          {user} <span className="font-semibold text-[#7A80B8]">{action}</span> <span className="text-[#6C8BFF]">"{target}"</span>
        </p>
        <p className="text-[11px] font-bold text-[#7A80B8]/60 mt-0.5 tracking-wide">{time}</p>
      </div>
    </div>
    {score !== null && (
      <div className="text-[#4EE3B2] font-black text-sm bg-white/60 px-4 py-1.5 rounded-full shadow-sm border border-[#4EE3B2]/20 group-hover:scale-110 transition-transform">
        {score}%
      </div>
    )}
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


import { useStudentRequests } from '@/integrations/supabase/student_requests';

const TeacherDashboard = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'overview';
  const { teacherData, user, signOut } = useAuth();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const { data: studentCount, isLoading: isStudentCountLoading } = useStudentCount();
  const { quizzes, isQuizzesLoading, quizAttempts } = useQuiz();
  const { data: studentRequests = [] } = useStudentRequests();

  const pendingRequests = useMemo(() =>
    studentRequests.filter(req => req.status === 'pending'),
    [studentRequests]);

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

  const [teacherActions, setTeacherActions] = useState<any[]>([]);

  React.useEffect(() => {
    const updateHistory = () => {
      const storedHistory = localStorage.getItem('questionActionHistory');
      if (storedHistory) {
        setTeacherActions(JSON.parse(storedHistory));
      }
    };

    updateHistory();
    window.addEventListener('storage', updateHistory);
    return () => window.removeEventListener('storage', updateHistory);
  }, []);


  const recentActivity = useMemo(() => {
    if (isQuizzesLoading) return [];

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // 1. Map Student Attempts
    const studentActs = quizAttempts
      .filter(attempt => attempt.status === 'SUBMITTED' && attempt.timestamp > oneDayAgo)
      .map((attempt: QuizAttempt) => {
        const quiz = quizzes.find(q => q.id === attempt.quizId);
        const quizTitle = quiz?.title || 'Unknown Quiz';

        // Use scorePercentage from attempt object
        const scorePercentage = attempt.scorePercentage || 0;

        return {
          user: attempt.studentName,
          action: "completed",
          target: quizTitle,
          time: formatTimeAgo(attempt.timestamp),
          timestamp: attempt.timestamp,
          score: scorePercentage.toFixed(0),
          initials: getInitials(attempt.studentName),
          color: "bg-indigo-100 text-indigo-600"
        };
      });

    // 2. Map Teacher Actions
    const teacherActs = teacherActions
      .filter(action => action.timestamp > oneDayAgo)
      .map(action => ({
        user: "You",
        action: action.action.toLowerCase(),
        target: action.paperName,
        time: formatTimeAgo(action.timestamp),
        timestamp: action.timestamp,
        score: null,
        initials: "ME",
        color: action.action === 'Published' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
      }));

    // 3. Combine and sort
    return [...studentActs, ...teacherActs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [quizAttempts, quizzes, isQuizzesLoading, teacherActions]);

  // Logic for Top Ranks card
  const topRanksData = useMemo(() => {
    const relevantQuizzes = quizzes.filter(q =>
      (q.title.includes('(AI Generated)') || q.id.startsWith('qz-local-')) && !q.competitionMode
    );
    const relevantQuizIds = new Set(relevantQuizzes.map(q => q.id));

    const filteredAttempts = quizAttempts.filter(attempt => relevantQuizIds.has(attempt.quizId));

    const performanceMap: {
      [studentName: string]: {
        totalScore: number;
        totalMaxPossibleMarks: number;
        totalTimeTakenSeconds: number;
      };
    } = {};

    filteredAttempts.forEach(attempt => {
      const studentName = attempt.studentName;
      if (!performanceMap[studentName]) {
        performanceMap[studentName] = {
          totalScore: 0,
          totalMaxPossibleMarks: 0,
          totalTimeTakenSeconds: 0,
        };
      }

      const studentPerf = performanceMap[studentName];
      studentPerf.totalScore += attempt.score;
      studentPerf.totalTimeTakenSeconds += attempt.timeTakenSeconds;

      // Use totalMarksPossible from attempt object
      studentPerf.totalMaxPossibleMarks += attempt.totalMarksPossible || 0;
    });

    const sortedStudents = Object.entries(performanceMap)
      .map(([studentName, data]) => ({
        studentName,
        totalScore: data.totalScore,
        totalMaxPossibleMarks: data.totalMaxPossibleMarks,
        totalTimeTakenSeconds: data.totalTimeTakenSeconds,
      }))
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
      });

    const top3 = sortedStudents.slice(0, 3);
    if (top3.length === 0) {
      return "N/A";
    } else if (top3.length === 1) {
      return top3[0].studentName;
    } else if (top3.length === 2) {
      return `${top3[0].studentName}, ${top3[1].studentName}`;
    } else {
      return `${top3[0].studentName}, ${top3[1].studentName}, ${top3[2].studentName}`;
    }
  }, [quizAttempts, quizzes]);


  const overviewContent = (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#1E2455] tracking-tighter leading-tight font-poppins">
            Welcome back, <span className="text-[#6C8BFF] bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] bg-clip-text text-transparent">{teacherData?.full_name || user?.email?.split('@')[0] || 'Professor'}</span>
          </h2>
          <p className="text-[#3A3F6B] mt-2 font-bold opacity-70">Monitor and manage your academic excellence dashboard.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/50 shadow-sm">
          <div className="w-2.5 h-2.5 bg-[#4EE3B2] rounded-full animate-pulse shadow-[0_0_10px_rgba(78,227,178,0.5)]" />
          <span className="text-[10px] font-black text-[#3A3F6B] uppercase tracking-[0.15em]">Live: Academic Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard
          title="Active Quizzes"
          value={activeQuizzesCount}
          trend="+12%"
          icon={BookOpen}
          color="text-[#6C8BFF]"
          isLoading={isQuizzesLoading}
        />
        <StatCard
          title="Top Performance"
          value={topRanksData}
          trend="+8%"
          icon={Trophy}
          color="text-[#FFB86C]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-3 glass-card p-10">
          <h3 className="text-xl font-black text-[#1E2455] mb-8 flex items-center gap-3 font-poppins">
            <div className="p-2 bg-[#6C8BFF]/10 rounded-xl">
              <Clock className="h-5 w-5 text-[#6C8BFF]" />
            </div>
            Recent Performance Logs
          </h3>
          <div className="space-y-3">
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
              <div className="text-center py-16 text-[#7A80B8] font-bold italic opacity-60">
                No recent activity logs available.
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
      case 'quizzes': return <AvailableQuizzesList quizzes={quizzes} />;
      case 'courses': return <CoursesList />;
      case 'users': return <UsersList />;
      default: return overviewContent;
    }
  };

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="w-72 fixed h-screen bg-card text-card-foreground z-40">
          <TeacherSidebar activeView={activeView} isMobile={false} />
        </aside>
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-h-screen", !isMobile && "ml-72")}>
        {/* Top Header */}
        <header className="h-24 bg-white/20 backdrop-blur-md border-b border-white/30 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            {isMobile && <TeacherSidebar activeView={activeView} isMobile={true} />}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A80B8] transition-colors group-focus-within:text-[#6C8BFF]" />
              <Input
                placeholder="Search database..."
                className="glass-input pl-11 h-12 text-[#1E2455] placeholder-[#7A80B8]/60 focus:bg-white/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-8 pl-8 border-l border-white/30 ml-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-3 text-[#7A80B8] hover:text-[#1E2455] bg-white/40 border border-white/50 rounded-2xl transition-all hover:shadow-sm">
                  <Bell className="h-5 w-5" />
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B8A] text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 glass-card p-0 shadow-2xl border-white/50 overflow-hidden" sideOffset={12}>
                <div className="bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] p-5">
                  <p className="font-black text-sm text-white flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Notifications
                  </p>
                </div>
                <div className="max-h-[450px] overflow-y-auto">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="p-5 border-b border-white/20 hover:bg-[#6C8BFF]/5 transition-all cursor-default">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#6C8BFF]/10 flex items-center justify-center text-[#6C8BFF] border border-[#6C8BFF]/20">
                            <UserCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1E2455]">{req.name}</p>
                            <p className="text-xs text-[#3A3F6B] font-bold opacity-70 mt-0.5">Access for {req.year} Year • {req.department}</p>
                            <p className="text-[10px] text-[#7A80B8] font-bold mt-2 uppercase tracking-widest">{formatTimeAgo(new Date(req.created_at).getTime())}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-[#7A80B8]/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#7A80B8]/20">
                        <Bell className="h-8 w-8 text-[#7A80B8]/40" />
                      </div>
                      <p className="text-sm text-[#7A80B8] font-bold italic">No pending requests today</p>
                    </div>
                  )}
                </div>
                {pendingRequests.length > 0 && (
                  <div className="p-4 bg-white/40 text-center border-t border-white/20">
                    <button className="text-xs font-black text-[#6C8BFF] hover:underline uppercase tracking-widest">View system logs</button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer p-2.5 pr-4 bg-white/40 hover:bg-white/60 border border-white/50 rounded-2xl transition-all group">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[14px] flex items-center justify-center shadow-md border border-white/30 group-hover:scale-105 transition-transform">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-black text-[#1E2455] leading-none mb-1">{teacherData?.full_name || user?.email?.split('@')[0] || 'Teacher'}</p>
                    <p className="text-[10px] text-[#7A80B8] font-black uppercase tracking-widest leading-none">{teacherData?.department || 'Faculty'}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 glass-card p-2 border-white/50 shadow-2xl" sideOffset={12}>
                <div className="p-4 border-b border-[#7A80B8]/10 mb-2">
                  <p className="text-xs font-black text-[#7A80B8] uppercase tracking-widest mb-3">Your Account</p>
                  <p className="text-sm font-black text-[#1E2455] truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => setIsProfileEditOpen(true)} className="cursor-pointer font-bold text-[#3A3F6B] focus:bg-[#6C8BFF]/10 focus:text-[#6C8BFF] rounded-xl py-3 px-4">
                  <Edit className="mr-3 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <div className="h-px bg-[#7A80B8]/10 my-1 mx-2" />
                <DropdownMenuItem onClick={() => signOut()} className="text-[#FF6B8A] cursor-pointer font-black focus:bg-[#FF6B8A]/10 focus:text-[#FF6B8A] rounded-xl py-3 px-4">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out of system</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Profile Edit Dialog */}
        <TeacherProfileEdit open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen} />

        {/* Content Area */}
        <main className="flex-1 pt-6 px-10 pb-10 lg:pt-8 lg:px-16 lg:pb-16 max-w-[1700px] mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;