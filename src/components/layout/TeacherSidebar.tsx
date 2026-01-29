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
  BookOpen,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  activeView: string;
  isMobile: boolean;
}

const TeacherSidebar = ({ activeView, isMobile }: TeacherSidebarProps) => {
  const { signOut, user, teacherData } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/teacher/dashboard?view=overview' },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen, path: '/teacher/dashboard?view=quizzes' },
    { id: 'courses', label: 'Courses', icon: GraduationCap, path: '/teacher/dashboard?view=courses' },
    { id: 'users', label: 'Student Directory', icon: Users, path: '/teacher/dashboard?view=users' },
    { id: 'management', label: 'Academic Mgmt', icon: PlusCircle, path: '/teacher/dashboard?view=management' },
    { id: 'leaderboard', label: 'Global Leaderboard', icon: Trophy, path: '/leaderboard' },
  ];

  const renderNav = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#8EA2FF] to-[#B39DDB] text-white p-6 gap-3">
      <div className="p-8 border-b border-white/20 mb-6 mt-2 group">
        <div className="flex items-center gap-5 mb-10 transition-transform group-hover:translate-x-1 duration-500">
          <div className="w-[60px] h-[60px] bg-white/30 backdrop-blur-xl rounded-[22px] flex items-center justify-center border border-white/40 shadow-2xl rotate-3 group-hover:rotate-6 transition-all">
            <GraduationCap className="h-9 w-9 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-3xl font-black text-white tracking-tighter leading-none font-poppins drop-shadow-lg">TEACHER<br />CONSOLE</span>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[9px] h-10 px-4 transition-all active:scale-95">
            <LogOut className="h-4 w-4 mr-2 -rotate-180" /> EXIT TO HOME
          </Button>
        </Link>
      </div>

      <div className="flex-1 px-2 py-4">
        <p className="px-6 text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-8">MANAGEMENT UNIT</p>
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (item.id === 'quizzes' && activeView === 'create-quiz');
            return (
              <Link key={item.id} to={item.path} className="block px-3">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-5 h-14 px-6 transition-all duration-500 rounded-3xl font-black uppercase tracking-widest text-[10px]",
                    isActive
                      ? "bg-white/40 text-white shadow-2xl border border-white/60 scale-[1.02] -translate-y-0.5"
                      : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform duration-500", isActive ? "text-white scale-110" : "text-white/60 group-hover:scale-110")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 space-y-4">
        <div className="bg-white/20 backdrop-blur-xl rounded-[32px] p-6 border border-white/30 shadow-2xl group transition-all hover:bg-white/30">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mb-3">FACULTY RECORD</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate group-hover:translate-x-0.5 transition-transform">{teacherData?.full_name || user?.email?.split('@')[0]}</p>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{teacherData?.department || 'Academic Dept.'}</p>
            </div>
          </div>
        </div>

        <button
          className="w-full flex items-center gap-4 h-16 px-10 text-white/60 hover:bg-white/10 hover:text-white rounded-[28px] transition-all duration-500 font-black uppercase tracking-[0.3em] text-[10px] active:scale-95 group"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>TERMINATE SESSION</span>
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