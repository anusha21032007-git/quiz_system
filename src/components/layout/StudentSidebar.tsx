"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, LayoutDashboard, BookOpen, ListChecks, Trophy, User, LogOut, BarChart, ArrowLeft, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Import Avatar components
// Removed import for ScheduledQuizAlert

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
    { id: 'interview-mode', label: 'Interview Mode', icon: Brain },
    { id: 'my-results', label: 'My Results', icon: BarChart },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    // Removed 'profile' item
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('student_name_mock');
    sessionStorage.removeItem('register_number_mock');
    // Navigate back to the student dashboard route, which now acts as the entry point
    window.location.href = '/student';
  };

  // NOTE: getInitials is no longer needed here but kept for completeness if AvatarFallback is used elsewhere in the sidebar logic.
  // const getInitials = (name: string) => {
  //   return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  // };

  const renderNav = () => (
    <nav className="flex flex-col h-full">

      {/* TOP SECTION: Home Button (Fixed) */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="justify-start text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go Home</span>
          </Button>
        </Link>
        {/* Profile display removed from here */}
      </div>

      {/* MIDDLE SECTION: Main Navigation (Scrollable) */}
      <div className="flex-grow overflow-y-auto p-4 space-y-1">
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

      {/* BOTTOM SECTION: Logout (Fixed) */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
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