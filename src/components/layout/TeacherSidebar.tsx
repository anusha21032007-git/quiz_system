"use client";

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
  LogOut,
  GraduationCap,
  BookOpen
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
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen, path: '/teacher?view=quizzes' },
    { id: 'courses', label: 'Courses', icon: GraduationCap, path: '/teacher?view=courses' },
    { id: 'users', label: 'Users', icon: Users, path: '/teacher?view=users' },
    { id: 'leaderboard', label: 'Global Leaderboard', icon: Trophy, path: '/leaderboard' },
  ];

  const renderNav = () => (
    <div className="flex flex-col h-full bg-sidebar text-slate-400">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <span className="text-xl font-bold text-slate-50 tracking-tight">QUIZ MANAGEMENT SYSTEM</span>
      </div>

      <div className="px-6 py-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Core Management</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (item.id === 'quizzes' && activeView === 'create-quiz');
            return (
              <Link key={item.id} to={item.path} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 px-4 transition-all duration-200 rounded-xl font-medium",
                    isActive ? "bg-sidebar-accent text-sidebar-primary shadow-sm" : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-primary" : "text-secondary")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800/50 mb-4">
          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Teacher Account</p>
          <p className="text-xs font-semibold text-slate-300 truncate">{teacherData?.full_name || user?.email}</p>
        </div>

        <button
          className="w-full flex items-center gap-3 h-11 px-4 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="lg:hidden border-slate-200 rounded-xl">
            <PanelLeft className="h-5 w-5 text-slate-600" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-slate-800">
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

export default TeacherSidebar;