"use client";

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchParams } from 'react-router-dom';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import StudentProfileHeader from '@/components/student/StudentProfileHeader';
import { LayoutDashboard } from 'lucide-react';

const DEFAULT_STUDENT_NAME = 'Mock Student';
const DEFAULT_REGISTER_NUMBER = '2024-001';

const StudentDashboard = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<string>(searchParams.get('view') || 'dashboard');

  // Sync state with URL search params
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [searchParams]);

  // Update URL whenever activeView changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSearchParams({ view });
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
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden flex-shrink-0">
        <StudentSidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          isMobile={isMobile}
          studentName={studentName}
          registerNumber={registerNumber}
        />
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" /> Student Academic Portal
        </h1>
      </header>

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
            <StudentSidebar
              activeView={activeView}
              setActiveView={handleViewChange}
              isMobile={isMobile}
              studentName={studentName}
              registerNumber={registerNumber}
            />
          </aside>
        )}

        {/* Main Content Wrapper (Header + Scrollable Content) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Desktop Header */}
          {!isMobile && (
            <header className="flex justify-between items-center px-8 py-4 border-b bg-white shadow-sm flex-shrink-0">
              <h1 className="text-4xl font-bold text-gray-800">Student Academic Portal</h1>
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