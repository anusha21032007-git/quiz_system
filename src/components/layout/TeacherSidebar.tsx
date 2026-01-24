import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import {
  PanelLeft,
  LayoutDashboard,
  PlusCircle,
  Users,
  Trophy,
  History,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  activeView: string;
  isMobile: boolean;
}

const TeacherSidebar = ({ activeView, isMobile }: TeacherSidebarProps) => {
  const { signOut, user, teacherData } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/teacher?view=overview' },
    { id: 'create-quiz', label: 'Create Quiz', icon: PlusCircle, path: '/teacher?view=create-quiz' },
    { id: 'courses', label: 'Courses', icon: GraduationCap, path: '/teacher?view=courses' },
    { id: 'users', label: 'Users', icon: Users, path: '/teacher?view=users' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { id: 'history', label: 'History', icon: History, path: '/teacher/history' },
  ];

  const renderNav = () => (
    <div className="flex flex-col h-full bg-white text-slate-600">

      {/* ... (Header and Nav Items sections remain the same) */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
        </div>
        <span className="text-2xl font-bold text-indigo-950 tracking-tight">EduFlow</span>
      </div>

      <div className="px-6 py-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Core Management</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (item.id === 'overview' && activeView === 'create-quiz');
            return (
              <Link key={item.id} to={item.path} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-4 transition-all duration-200 rounded-xl font-medium",
                    activeView === item.id ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Teacher Account</p>
          <p className="text-xs font-semibold text-indigo-900 truncate">{teacherData?.full_name || user?.email}</p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 px-4 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    // ... (Mobile view implementation)
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="lg:hidden border-slate-200 rounded-xl">
            <PanelLeft className="h-5 w-5 text-slate-600" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-white border-r border-slate-100">
          {renderNav()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-slate-100 bg-white">
      {renderNav()}
    </div>
  );
};

export default TeacherSidebar;