"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, LayoutDashboard, BookOpen, ListChecks, Trophy, LogOut, BarChart, ArrowLeft, Brain } from 'lucide-react';
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
    <nav className="flex flex-col h-full bg-white text-black p-4 gap-2">
      <div className="pb-4 border-b-2 border-gray-100 mb-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "justify-start gap-3 w-full transition-all duration-200 border-2 rounded-lg",
              activeView === item.id
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-transparent hover:bg-gray-50"
            )}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-white" : "text-gray-500")} />
            <span className="flex-grow text-left">{item.label}</span>
            {item.id === 'quizzes' && hasNewQuizzes && (
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse ring-2 ring-white" />
            )}
          </Button>
        ))}
      </div>

      {/* Notice Section */}
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 mx-1">
        <h3 className="text-[10px] font-bold text-indigo-900 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <Bell className="h-3 w-3" /> Notices
        </h3>
        <div className="space-y-3">
          {upcomingQuizzes.length > 0 ? (
            upcomingQuizzes.map((quiz) => (
              <div key={quiz.id} className="text-[11px] border-l-2 border-indigo-200 pl-2">
                <p className="font-bold text-indigo-700 leading-tight mb-0.5">{quiz.title}</p>
                <p className="text-indigo-500/80 font-medium">
                  {new Date(quiz.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {quiz.startTime}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-indigo-400 italic font-medium">No upcoming quizzes scheduled.</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t-2 border-gray-100">
        <Button
          variant="outline"
          className="justify-start gap-3 w-full border-2 border-gray-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50"
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
        <SheetContent side="left" className="sm:max-w-xs p-0 bg-white">
          {renderNav()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col h-full border-r-2 border-gray-200 bg-white">
      {renderNav()}
    </div>
  );
};

export default StudentSidebar;