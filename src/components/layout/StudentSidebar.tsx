"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, LayoutDashboard, BookOpen, ListChecks, Trophy, LogOut, BarChart, ArrowLeft, Brain, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuiz, Quiz } from '@/context/QuizContext';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';

interface StudentSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobile: boolean;
}

const StudentSidebar = ({ activeView, setActiveView, isMobile }: StudentSidebarProps) => {
  const { hasNewQuizzes, quizzes } = useQuiz();
  const { signOut } = useAuth();

  // Notice Logic: Get upcoming active quizzes
  const upcomingQuizzes = React.useMemo(() => {
    const now = new Date();
    return quizzes
      .filter(quiz => {
        const scheduledTime = new Date(`${quiz.scheduledDate}T${quiz.startTime}`);
        return quiz.status === 'ACTIVE' && scheduledTime > now;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.scheduledDate}T${a.startTime}`).getTime();
        const timeB = new Date(`${b.scheduledDate}T${b.startTime}`).getTime();
        return timeA - timeB;
      })
      .slice(0, 3); // Show top 3 upcoming
  }, [quizzes]);


  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
    { id: 'competitive-mode', label: 'Competitive Mode', icon: Brain },
    { id: 'my-results', label: 'My Results', icon: BarChart },
    { id: 'leaderboard', label: 'Global Leaderboard', icon: Trophy },
  ];

  const renderNav = () => (
    <nav className="flex flex-col h-full bg-gradient-to-b from-[#8EA2FF] to-[#B39DDB] text-white p-6 gap-3">
      <div className="p-8 border-b border-white/20 mb-6 mt-2 group">
        <div className="flex items-center gap-5 mb-10 transition-transform group-hover:translate-x-1 duration-500">
          <div className="w-[60px] h-[60px] bg-white/30 backdrop-blur-xl rounded-[22px] flex items-center justify-center border border-white/40 shadow-2xl rotate-3 group-hover:rotate-6 transition-all">
            <GraduationCap className="h-9 w-9 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-3xl font-black text-white tracking-tighter leading-none font-poppins drop-shadow-lg">STUDENT<br />CONSOLE</span>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[9px] h-10 px-4 transition-all active:scale-95">
            <ArrowLeft className="h-4 w-4 mr-2" /> EXIT TO HOME
          </Button>
        </Link>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 px-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "justify-start gap-4 h-14 w-full transition-all duration-300 rounded-full font-bold",
              activeView === item.id
                ? "bg-white/40 text-white shadow-xl border border-white/50"
                : "text-white/80 hover:bg-white/20 hover:text-white"
            )}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-white" : "text-white/70")} />
            <span className="flex-grow text-left">{item.label}</span>
            {item.id === 'quizzes' && hasNewQuizzes && (
              <span className="flex h-3 w-3 rounded-full bg-red-400 animate-pulse ring-2 ring-white/50" />
            )}
          </Button>
        ))}
      </div>

      {/* Notice Section */}
      <div className="mt-4 p-5 bg-white/20 backdrop-blur-lg rounded-[24px] border border-white/30 mx-1 shadow-sm">
        <h3 className="text-[10px] font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest pl-1">
          <Bell className="h-3 w-3" /> Upcoming
        </h3>
        <div className="space-y-4">
          {upcomingQuizzes.length > 0 ? (
            upcomingQuizzes.map((quiz) => (
              <div key={quiz.id} className="text-[11px] border-l-2 border-white/50 pl-3 group cursor-default">
                <p className="font-bold text-white leading-tight mb-1 group-hover:translate-x-1 transition-transform">{quiz.title}</p>
                <p className="text-white/70 font-medium">
                  {new Date(quiz.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {quiz.startTime}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-white/50 italic font-medium pl-1">No quizzes scheduled.</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/20 mt-4">
        <Button
          variant="ghost"
          className="justify-start gap-4 w-full h-14 text-white/80 hover:bg-white/20 hover:text-white rounded-full font-bold transition-all border border-transparent hover:border-white/20 active:scale-95"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="lg:hidden border-2 border-black">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0 bg-sidebar border-r border-slate-800 shadow-2xl">
          {renderNav()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-sidebar-border bg-sidebar">
      {renderNav()}
    </div>
  );
};

export default StudentSidebar;