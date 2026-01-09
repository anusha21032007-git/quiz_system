"use client";

import React, { useState } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import QuestionCreator from '@/components/teacher/QuestionCreator';
import QuizCreator from '@/components/teacher/QuizCreator';
import InterviewMode from '@/components/teacher/InterviewMode';
import UsersList from '@/components/teacher/UsersList';
import CoursesList from '@/components/teacher/CoursesList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const TeacherDashboard = () => {
  const isMobile = useIsMobile();

  // State for active view in sidebar
  const [activeView, setActiveView] = useState<string>('create-question');

  const renderMainContent = () => (
    <>
      <div className={cn(activeView === 'create-question' ? 'block' : 'hidden')}>
        <QuestionCreator />
      </div>
      <div className={cn(activeView === 'create-quiz' ? 'block' : 'hidden')}>
        <QuizCreator />
      </div>
      <div className={cn(activeView === 'interview-mode' ? 'block' : 'hidden')}>
        <InterviewMode />
      </div>
      <div className={cn(activeView === 'users' ? 'block' : 'hidden')}>
        <UsersList />
      </div>
      <div className={cn(activeView === 'courses' ? 'block' : 'hidden')}>
        <CoursesList />
      </div>
      <div className={cn(activeView === 'history' ? 'block' : 'hidden')}>
        <div className="p-8 border rounded-lg bg-white shadow-sm flex items-center justify-center min-h-[400px]">
          <h2 className="text-xl text-gray-500 font-medium">History Feature Coming Soon</h2>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden">
        <TeacherSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} />
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
      </header>

      <div className="flex flex-1">
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
              <TeacherSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
              <main className="flex-1 p-8 overflow-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 hidden lg:block">Teacher Dashboard</h1>
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

export default TeacherDashboard;