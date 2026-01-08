"use client";

import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, PlusCircle, ListChecks, Brain, Users, BookOpen, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  activeView?: string; // Optional if using route
  setActiveView?: (view: string) => void; // Optional if using route
  isMobile: boolean;
}

const TeacherSidebar = ({ activeView, setActiveView, isMobile }: TeacherSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'create-question', label: 'Create Question', icon: PlusCircle, path: '/teacher' },
    { id: 'create-quiz', label: 'Generate Quiz', icon: ListChecks, path: '/teacher?view=create-quiz' },
    { id: 'interview-mode', label: 'Interview Mode', icon: Brain, path: '/teacher?view=interview-mode' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/teacher/courses' },
    { id: 'users', label: 'Users', icon: Users, path: '/teacher?view=users' },
    { id: 'history', label: 'History', icon: History, path: '/teacher/history' },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'courses') {
      return location.pathname === '/teacher/courses';
    }
    if (item.id === 'history') {
      return location.pathname === '/teacher/history';
    }
    if (location.pathname === '/teacher') {
      const searchParams = new URLSearchParams(location.search);
      const view = searchParams.get('view') || 'create-question';
      return view === item.id;
    }
    return activeView === item.id;
  };

  const renderNav = () => (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={isActive(item) ? 'secondary' : 'ghost'}
          className={cn(
            "justify-start gap-3",
            isActive(item) && "bg-accent text-accent-foreground"
          )}
          asChild
        >
          <Link to={item.path}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link to="/" className="block text-blue-600 hover:underline mb-2 px-4 py-2 text-sm">Return Home</Link>
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