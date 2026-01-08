"use client";

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import SchedulePanel from '@/components/student/SchedulePanel'; // New component for the right panel
import { LayoutDashboard } from 'lucide-react';

// Define mock defaults since login is bypassed
const DEFAULT_STUDENT_NAME = 'Mock Student';
const DEFAULT_REGISTER_NUMBER = '2024-001';

const StudentDashboard = () => {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<string>('dashboard');
  
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden">
        <StudentSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isMobile={isMobile}
          studentName={studentName}
          registerNumber={registerNumber}
        />
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" /> Dashboard
        </h1>
      </header>

      {/* Desktop 3-Column Layout */}
      <div className="flex flex-1 h-screen overflow-hidden">
        
        {/* 1. Left Panel (Sidebar) - Fixed Width */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
            <StudentSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} studentName={studentName} registerNumber={registerNumber} />
          </aside>
        )}
        
        {/* 2. Center Panel (Main Content) - Flexible Width */}
        <main className="flex-1 overflow-y-auto p-8">
          {!isMobile && (
            <h1 className="text-4xl font-bold text-gray-800 mb-8 hidden lg:block">Student Dashboard</h1>
          )}
          {renderMainContent()}
        </main>

        {/* 3. Right Panel (Schedule) - Fixed Width, only visible on desktop and when viewing dashboard */}
        {!isMobile && activeView === 'dashboard' && (
          <aside className="w-80 flex-shrink-0 h-full border-l bg-white overflow-y-auto">
            <SchedulePanel studentName={studentName} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;