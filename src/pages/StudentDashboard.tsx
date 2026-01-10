"use client";

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import StudentProfileHeader from '@/components/student/StudentProfileHeader';
import { LayoutDashboard } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { toast } from 'sonner';

const DEFAULT_STUDENT_NAME = 'Mock Student';
const DEFAULT_REGISTER_NUMBER = '2024-001';

const StudentDashboard = () => {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<string>('dashboard');

  const handleBack = () => {
    const canGoBack = typeof window !== 'undefined' && window.history.state?.idx > 0;
    if (canGoBack) {
      window.history.back();
    } else {
      toast.info("You are at the home view of the Student Portal.");
    }
  };

  // Use default values directly, bypassing login state management
  const studentName = DEFAULT_STUDENT_NAME;
  const registerNumber = DEFAULT_REGISTER_NUMBER;

  const renderMainContent = () => (
    <StudentDashboardContent
      activeView={activeView}
      studentName={studentName}
      registerNumber={registerNumber}
    />
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden flex-shrink-0">
        <div className="flex items-center gap-2">
          <StudentSidebar
            activeView={activeView}
            setActiveView={setActiveView}
            isMobile={isMobile}
            studentName={studentName}
            registerNumber={registerNumber}
          />
          <BackButton onClick={handleBack} className="lg:hidden" />
        </div>
        <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" /> Portal
        </h1>
      </header>

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
            <StudentSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} studentName={studentName} registerNumber={registerNumber} />
          </aside>
        )}

        {/* Main Content Wrapper (Header + Scrollable Content) */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Fixed Desktop Header */}
          {!isMobile && (
            <header className="flex justify-between items-center px-8 py-4 border-b bg-white shadow-sm flex-shrink-0">
              <div className="space-y-2">
                <BackButton onClick={handleBack} />
                <h1 className="text-4xl font-bold text-gray-800">Student Academic Portal</h1>
              </div>
              <StudentProfileHeader studentName={studentName} registerNumber={registerNumber} />
            </header>
          )}

          <main className="flex-1 overflow-y-auto p-8">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;