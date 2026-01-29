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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#8EA2FF] to-[#B39DDB] text-white">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-black text-white tracking-tighter leading-tight font-poppins">QUIZ MASTER</span>
      </div>

      <div className="px-4 py-6">
        <p className="px-4 text-[10px] font-bold text-white/70 uppercase tracking-widest mb-6">Management Portal</p>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (item.id === 'quizzes' && activeView === 'create-quiz');
            return (
              <Link key={item.id} to={item.path} className="block px-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-12 px-4 transition-all duration-300 rounded-[16px] font-bold",
                    isActive
                      ? "bg-white/30 text-white shadow-glass border border-white/40"
                      : "text-white/80 hover:bg-white/20 hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/70")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-white/20 backdrop-blur-lg rounded-[24px] p-5 border border-white/30 mb-4 shadow-sm">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Academic Profile</p>
          <p className="text-xs font-black text-white truncate">{teacherData?.full_name || user?.email}</p>
        </div>

        <button
          className="w-full flex items-center gap-3 h-12 px-6 text-white/80 hover:bg-white/20 hover:text-white rounded-[16px] transition-all duration-300 font-bold"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold">Log out</span>
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