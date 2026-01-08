"use client";

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import StudentProfileHeader from '@/components/student/StudentProfileHeader'; // Import new component
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
    <div className="h-screen flex flex-col bg-gray-50"> {/* Changed min-h-screen to h-screen */}
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
          <LayoutDashboard className="h-6 w-6" /> Student Academic Portal
        </h1>
      </header>

      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden"> {/* flex-1 ensures it takes remaining height, overflow-hidden contains scrolling */}
        {/* Fixed Sidebar (Desktop) */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
            <StudentSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} studentName={studentName} registerNumber={registerNumber} />
          </aside>
        )}
        
        {/* Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-8">
          {!isMobile && (
            <div className="flex justify-between items-center pb-4 mb-8 border-b border-gray-200 hidden lg:flex">
              <h1 className="text-4xl font-bold text-gray-800">Student Academic Portal</h1>
              <StudentProfileHeader studentName={studentName} registerNumber={registerNumber} />
            </div>
          )}
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;