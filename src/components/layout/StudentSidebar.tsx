"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, LayoutDashboard, BookOpen, ListChecks, Trophy, User, LogOut, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobile: boolean;
  studentName: string;
  registerNumber: string;
}

const StudentSidebar = ({ activeView, setActiveView, isMobile, studentName, registerNumber }: StudentSidebarProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: ListChecks },
    { id: 'my-results', label: 'My Results', icon: BarChart },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('student_name_mock');
    sessionStorage.removeItem('register_number_mock');
    // Force reload to trigger login screen in StudentDashboard.tsx
    window.location.href = '/student';
  };

  const renderNav = () => (
    <nav className="flex flex-col gap-2 p-4 h-full">
      <div className="mb-4 p-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold truncate">{studentName || 'Student'}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Reg No: {registerNumber || 'N/A'}</p>
      </div>
      <div className="flex-grow space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className={cn(
              "justify-start gap-3 w-full",
              activeView === item.id && "bg-accent text-accent-foreground"
            )}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="ghost" 
          className="justify-start gap-3 w-full text-red-500 hover:text-red-600"
          onClick={handleLogout}
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
          <Button size="icon" variant="outline" className="lg:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          {renderNav()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col h-full border-r bg-sidebar text-sidebar-foreground">
      {renderNav()}
    </div>
  );
};

export default StudentSidebar;