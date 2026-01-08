"use client";

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TeacherLayout from '@/components/layout/TeacherLayout';
import QuestionCreator from '@/components/teacher/QuestionCreator';
import QuizCreator from '@/components/teacher/QuizCreator';
import InterviewMode from '@/components/teacher/InterviewMode';
import UsersList from '@/components/teacher/UsersList';
import AvailableQuizzesList from '@/components/teacher/AvailableQuizzesList';
import { useQuiz } from '@/context/QuizContext';

const TeacherDashboard = () => {
  const { quizzes } = useQuiz();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'create-question';

  const renderMainContent = () => {
    switch (activeView) {
      case 'create-question':
        return <QuestionCreator />;
      case 'create-quiz':
        return <QuizCreator />;
      case 'available-quizzes':
        return <AvailableQuizzesList quizzes={quizzes} />;
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
      case 'available-quizzes':
        return 'Available Quizzes';
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

export default TeacherDashboard;