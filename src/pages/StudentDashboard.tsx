"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import StudentProfileHeader from '@/components/student/StudentProfileHeader';
import { LayoutDashboard } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const isMobile = useIsMobile();
  const { studentData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<string>(searchParams.get('view') || 'dashboard');

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [searchParams]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSearchParams({ view });
  };

  const handleBack = () => {
    const canGoBack = window.history.state?.idx > 0;
    if (canGoBack) window.history.back();
    else toast.info("At home view of the Student Portal.");
  };

  const studentName = studentData?.name || 'Loading...';
  const registerNumber = studentData?.register_number || 'N/A';

  const isCompetitiveMode = activeView === 'competitive-mode';

  if (isCompetitiveMode) {
    return (
      <div className="h-screen bg-background">
        <StudentDashboardContent activeView={activeView} studentName={studentName} registerNumber={registerNumber} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-card shadow-lg lg:hidden flex-shrink-0">
        <div className="flex items-center gap-2">
          <StudentSidebar activeView={activeView} setActiveView={handleViewChange} isMobile={isMobile} />
          <BackButton onClick={handleBack} className="lg:hidden" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" /> Student Portal
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
            <StudentSidebar activeView={activeView} setActiveView={handleViewChange} isMobile={isMobile} />
          </aside>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {!isMobile && (
            <header className="flex justify-between items-center px-8 py-4 border-b border-slate-800 bg-card shadow-md flex-shrink-0">
              <div className="space-y-2">
                <BackButton onClick={handleBack} />
                <h1 className="text-4xl font-bold text-slate-100">Student Portal</h1>
              </div>
              <StudentProfileHeader studentName={studentName} registerNumber={registerNumber} />
            </header>
          )}
          <main className="flex-1 overflow-y-auto p-8">
            <StudentDashboardContent activeView={activeView} studentName={studentName} registerNumber={registerNumber} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;