"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardContent from '@/components/student/StudentDashboardContent';
import { LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

const STUDENT_NAME_KEY = 'student_name_mock';
const REGISTER_NUMBER_KEY = 'register_number_mock';

const StudentDashboard = () => {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [studentName, setStudentName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load student identity from session storage on mount
  useEffect(() => {
    const storedName = sessionStorage.getItem(STUDENT_NAME_KEY);
    const storedRegNo = sessionStorage.getItem(REGISTER_NUMBER_KEY);
    if (storedName && storedRegNo) {
      setStudentName(storedName);
      setRegisterNumber(storedRegNo);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (studentName.trim() && registerNumber.trim()) {
      sessionStorage.setItem(STUDENT_NAME_KEY, studentName.trim());
      sessionStorage.setItem(REGISTER_NUMBER_KEY, registerNumber.trim());
      setIsLoggedIn(true);
      toast.success(`Welcome, ${studentName.trim()}!`);
    } else {
      toast.error("Please enter both Name and Register Number.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">Student Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studentName" className="text-lg font-semibold">Your Name</Label>
              <Input
                id="studentName"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="mt-2 p-3 text-lg"
              />
            </div>
            <div>
              <Label htmlFor="registerNumber" className="text-lg font-semibold">Register Number</Label>
              <Input
                id="registerNumber"
                placeholder="Enter your register number"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                className="mt-2 p-3 text-lg"
              />
            </div>
            <Button onClick={handleLogin} className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700">
              Enter Dashboard
            </Button>
            <Link to="/" className="block text-center text-sm text-gray-500 hover:underline mt-4">
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderMainContent = () => (
    <StudentDashboardContent
      activeView={activeView}
      studentName={studentName}
      registerNumber={registerNumber}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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

      <div className="flex flex-1">
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
              <StudentSidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isMobile={isMobile}
                studentName={studentName}
                registerNumber={registerNumber}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
              <main className="flex-1 p-8 overflow-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 hidden lg:block">Student Dashboard</h1>
                {renderMainContent()}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {isMobile && (
          <main className="flex-1 p-4 overflow-auto">
            {renderMainContent()}
          </main>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;