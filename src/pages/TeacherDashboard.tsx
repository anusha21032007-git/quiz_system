"use client";

import React from 'react';
import { useQuiz } from '@/context/QuizContext';
import QuestionCreator from '@/components/teacher/QuestionCreator';
import QuizCreator from '@/components/teacher/QuizCreator';
import AvailableQuizzesList from '@/components/teacher/AvailableQuizzesList';
import InterviewMode from '@/components/teacher/InterviewMode';
import UsersList from '@/components/teacher/UsersList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/BackButton';
import { useSearchParams } from 'react-router-dom';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const TeacherDashboard = () => {
  const { quizzes } = useQuiz();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Manage active view via URL search params for history support
  const activeView = searchParams.get('view') || 'create-question';
  const setActiveView = (view: string) => setSearchParams({ view });

  const renderMainContent = () => (
    <>
      <div className={cn(activeView === 'create-question' ? 'block' : 'hidden')}>
        <QuestionCreator />
      </div>
      <div className={cn(activeView === 'create-quiz' ? 'block' : 'hidden')}>
        <QuizCreator />
      </div>
      <div className={cn(activeView === 'available-quizzes' ? 'block' : 'hidden')}>
        <AvailableQuizzesList quizzes={quizzes} />
      </div>
      <div className={cn(activeView === 'competitive-mode' || activeView === 'interview-mode' ? 'block' : 'hidden')}>
        <InterviewMode />
      </div>
      <div className={cn(activeView === 'users' ? 'block' : 'hidden')}>
        <UsersList />
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between p-4 border-b-2 border-gray-100 bg-white lg:hidden">
        <div className="flex items-center gap-2">
          <TeacherSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} />
          <BackButton />
        </div>
        <h1 className="text-xl font-bold text-black">Teacher Dashboard</h1>
      </header>

      <div className="flex flex-1">
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="border-r-0">
              <TeacherSidebar activeView={activeView} setActiveView={setActiveView} isMobile={isMobile} />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-gray-200 w-[2px]" />
            <ResizablePanel defaultSize={80}>
              <main className="flex-1 p-8 overflow-auto bg-white">
                <div className="space-y-4 mb-8">
                  <BackButton />
                  <div className="pb-4 border-b-2 border-gray-100 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-black tracking-tight">Teacher Dashboard</h1>
                    <div className="px-4 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-mono text-gray-500">
                      v2.0 Minimal
                    </div>
                  </div>
                </div>
                {renderMainContent()}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {isMobile && (
          <main className="flex-1 p-4 overflow-auto bg-white">
            {renderMainContent()}
          </main>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;