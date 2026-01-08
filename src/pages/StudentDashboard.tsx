"use client";

import React, { useState } from 'react';
<<<<<<< HEAD
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

=======
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState('');

>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header (remains fixed at the top of the screen) */}
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden flex-shrink-0">
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

<<<<<<< HEAD
      {/* Desktop Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar (Desktop) */}
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
              <h1 className="text-4xl font-bold text-gray-800">Student Academic Portal</h1>
              <StudentProfileHeader studentName={studentName} registerNumber={registerNumber} />
            </header>
          )}

          {/* Scrollable Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8">
            {renderMainContent()}
          </main>
        </div>
=======
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Label htmlFor="studentName" className="text-xl font-semibold">Your Name</Label>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              id="studentName"
              placeholder="Enter your name (e.g., John Doe)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-2 p-3 text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">This name will be used for the leaderboard.</p>
          </CardContent>
        </Card>
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
      </div>
    </div>
  );
};

export default StudentDashboard;