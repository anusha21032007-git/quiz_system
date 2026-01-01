"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, PlusCircle, ListChecks, Trophy } from 'lucide-react'; // Removed Brain icon
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobile: boolean;
}

const TeacherSidebar = ({ activeView, setActiveView, isMobile }: TeacherSidebarProps) => {
  const navItems = [
    { id: 'create-question', label: 'Create Question', icon: PlusCircle },
    // Removed AI Generator from here
    { id: 'create-quiz', label: 'Generate Quiz', icon: ListChecks },
    { id: 'available-quizzes', label: 'Available Quizzes', icon: Trophy },
  ];

  const renderNav = () => (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={activeView === item.id ? 'secondary' : 'ghost'}
          className={cn(
            "justify-start gap-3",
            activeView === item.id && "bg-accent text-accent-foreground"
          )}
          onClick={() => setActiveView(item.id)}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Button>
      ))}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link to="/" className="block text-blue-600 hover:underline mb-2">Home</Link>
        <Link to="/leaderboard" className="block text-blue-600 hover:underline">Leaderboard</Link>
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

export default TeacherSidebar;