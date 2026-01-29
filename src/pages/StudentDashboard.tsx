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
      <div className="h-screen bg-transparent">
        <StudentDashboardContent activeView={activeView} studentName={studentName} registerNumber={registerNumber} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-transparent font-poppins">
      <header className="flex items-center justify-between p-4 border-b border-white/30 bg-white/20 backdrop-blur-md shadow-glass lg:hidden flex-shrink-0">
        <div className="flex items-center gap-2">
          <StudentSidebar activeView={activeView} setActiveView={handleViewChange} isMobile={isMobile} />
          <BackButton onClick={handleBack} className="lg:hidden text-[#1E2455]" />
        </div>
        <h1 className="text-xl font-black text-[#1E2455] flex items-center gap-2 tracking-tighter">
          <LayoutDashboard className="h-6 w-6 text-[#6C8BFF]" /> STUDENT PORTAL
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-72 flex-shrink-0 h-full border-r border-white/20 bg-transparent text-white z-40">
            <StudentSidebar activeView={activeView} setActiveView={handleViewChange} isMobile={isMobile} />
          </aside>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Main Background Overlay for content area */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] -z-10" />

          {!isMobile && (
            <header className="flex justify-between items-center px-12 py-6 border-b border-white/30 bg-white/20 backdrop-blur-md shadow-glass flex-shrink-0 z-30">
              <div className="space-y-1">
                <BackButton onClick={handleBack} className="text-[#7A80B8] hover:text-[#1E2455] transition-colors" />
                <h1 className="text-4xl font-black text-[#1E2455] tracking-tighter uppercase leading-tight mt-2">Student Portal</h1>
              </div>
              <StudentProfileHeader studentName={studentName} registerNumber={registerNumber} />
            </header>
          )}
          <main className="flex-1 overflow-y-auto p-10 lg:p-14 relative">
            <StudentDashboardContent activeView={activeView} studentName={studentName} registerNumber={registerNumber} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;