<<<<<<< HEAD
"use client";

import React, { useState } from 'react';
import { useQuiz } from '@/context/QuizContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import QuestionCreator from '@/components/teacher/QuestionCreator';
import QuizCreator from '@/components/teacher/QuizCreator';
import AvailableQuizzesList from '@/components/teacher/AvailableQuizzesList';
import InterviewMode from '@/components/teacher/InterviewMode';
import UsersList from '@/components/teacher/UsersList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

const TeacherDashboard = () => {
  const { quizzes } = useQuiz();
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
      <div className={cn(activeView === 'available-quizzes' ? 'block' : 'hidden')}>
        <AvailableQuizzesList quizzes={quizzes} />
      </div>
      <div className={cn(activeView === 'interview-mode' ? 'block' : 'hidden')}>
        <InterviewMode />
      </div>
      <div className={cn(activeView === 'users' ? 'block' : 'hidden')}>
        <UsersList />
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

=======
"use client";

import { useLocation } from 'react-router-dom';
import TeacherLayout from '@/components/layout/TeacherLayout';
import QuestionCreator from '@/components/teacher/QuestionCreator';
import QuizCreator from '@/components/teacher/QuizCreator';
import InterviewMode from '@/components/teacher/InterviewMode';
import UsersList from '@/components/teacher/UsersList';

const TeacherDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'create-question';

  const renderMainContent = () => {
    switch (activeView) {
      case 'create-question':
        return <QuestionCreator />;
      case 'create-quiz':
        return <QuizCreator />;
      case 'interview-mode':
        return <InterviewMode />;
      case 'users':
        return <UsersList />;
      default:
        return <QuestionCreator />;
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'create-question':
        return 'Question Bank';
      case 'create-quiz':
        return 'Quiz Generator';
      case 'interview-mode':
        return 'Interview Session';
      case 'users':
        return 'Users';
      default:
        return 'Teacher Dashboard';
    }
  };

  return (
    <TeacherLayout activeView={activeView} title={getPageTitle()}>
      {renderMainContent()}
    </TeacherLayout>
  );
};

>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
export default TeacherDashboard;