"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, PlusCircle, ListChecks, Trophy, Brain, Users, BookOpen, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobile: boolean;
}

const TeacherSidebar = ({ activeView, setActiveView, isMobile }: TeacherSidebarProps) => {

  const navItems = [
    { id: 'create-question', label: 'Create Question', icon: PlusCircle, path: '/teacher?view=create-question' },
    { id: 'create-quiz', label: 'Generate Quiz', icon: ListChecks, path: '/teacher?view=create-quiz' },
    { id: 'courses', label: 'Available Courses', icon: BookOpen, path: '/teacher/courses' },
    { id: 'competitive-mode', label: 'Interview Mode', icon: Brain, path: '/teacher?view=competitive-mode' },
    { id: 'users', label: 'Users', icon: Users, path: '/teacher?view=users' },
    { id: 'history', label: 'History', icon: History, path: '/teacher/history' },
  ];

  const renderNav = () => (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link
          key={item.id}
          to={item.path}
          onClick={() => {
            if (setActiveView) setActiveView(item.id);
          }}
          className="block w-full"
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 transition-all duration-200 border-2 rounded-lg",
              activeView === item.id
                ? "bg-black text-white border-black shadow-none hover:bg-gray-800 hover:text-white"
                : "bg-white text-gray-700 border-transparent hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <item.icon className={cn("h-5 w-5", activeView === item.id ? "text-white" : "text-gray-500")} />
            {item.label}
          </Button>
        </Link>
      ))}

      <div className="mt-auto pt-4 border-t-2 border-gray-100 space-y-2">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200">
          Home
        </Link>
        <Link to="/leaderboard" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200">
          Leaderboard
        </Link>
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
    <div className="flex flex-col h-full border-r-2 border-gray-200 bg-white text-gray-900">
      {renderNav()}
    </div>
  );
};

export default TeacherSidebar;