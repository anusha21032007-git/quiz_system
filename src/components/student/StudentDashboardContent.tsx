"use client";

import React, { useMemo } from 'react';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import DashboardWelcome from './DashboardWelcome';
import OverviewCards from './OverviewCards';
import MyCourses from './MyCourses';
import PerformanceOverview from './PerformanceOverview';
import RecentActivity from './RecentActivity';
import ScheduledQuizzesSection from './ScheduledQuizzesSection'; // Import the new component
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, BookOpen, BarChart, Trophy, ListChecks } from 'lucide-react';

interface StudentDashboardContentProps {
  activeView: string;
  studentName: string;
  registerNumber: string;
}

// Mock Course Data (since we don't have a dedicated course context)
const MOCK_COURSES = [
  { id: 'c1', name: 'CS 101: Introduction to Programming', progress: 75 },
  { id: 'c2', name: 'Math 202: Calculus II', progress: 40 },
  { id: 'c3', name: 'Physics 101: Mechanics', progress: 90 },
];

const StudentDashboardContent = ({ activeView, studentName, registerNumber }: StudentDashboardContentProps) => {
  const { quizAttempts } = useQuiz();

  // Filter attempts relevant to the current student
  const studentAttempts = useMemo(() => {
    return quizAttempts.filter(attempt => attempt.studentName === studentName);
  }, [quizAttempts, studentName]);

  // Calculate Overview Stats
  const { totalQuizzesAttempted, quizzesPassed, averageScore, currentRank } = useMemo(() => {
    const totalQuizzesAttempted = studentAttempts.length;
    
    if (totalQuizzesAttempted === 0) {
      return { totalQuizzesAttempted: 0, quizzesPassed: 0, averageScore: 0, currentRank: 0 };
    }

    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;
    let quizzesPassed = 0;

    studentAttempts.forEach(attempt => {
      totalScoreSum += attempt.score;
      totalMaxScoreSum += attempt.totalQuestions; 

      // Calculate passing based on 50% score ratio
      const scorePercentage = (attempt.score / attempt.totalQuestions) * 100;
      if (scorePercentage >= 50) {
        quizzesPassed++;
      }
    });

    const overallAverageScore = totalMaxScoreSum > 0 ? (totalScoreSum / totalMaxScoreSum) * 100 : 0;

    // Mock Rank Calculation (Highly simplified: based on overall average score compared to all attempts)
    // This is a placeholder for a real ranking system.
    const mockRank = Math.max(1, Math.floor(100 - overallAverageScore) % 20); 

    return {
      totalQuizzesAttempted,
      quizzesPassed,
      averageScore: overallAverageScore,
      currentRank: mockRank,
    };
  }, [studentAttempts]);


  const renderDashboard = () => (
    <div className="space-y-8">
      <DashboardWelcome studentName={studentName} registerNumber={registerNumber} />
      <OverviewCards
        totalQuizzesAttempted={totalQuizzesAttempted}
        quizzesPassed={quizzesPassed}
        averageScore={averageScore}
        currentRank={currentRank}
      />
      
      {/* Main Content Grid: Left column (2/3) and Right column (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width on large screens) - Main content flow */}
        <div className="lg:col-span-2 space-y-8">
          <MyCourses courses={MOCK_COURSES} />
          <PerformanceOverview recentAttempts={studentAttempts} />
          <RecentActivity recentAttempts={studentAttempts} />
        </div>
        
        {/* Right Column (1/3 width on large screens) - Scheduled Quizzes at the top right */}
        <div className="lg:col-span-1 space-y-8">
          <ScheduledQuizzesSection studentName={studentName} />
        </div>
      </div>
    </div>
  );

  const renderMyCourses = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="h-7 w-7 text-green-600" /> My Courses</h2>
      <MyCourses courses={MOCK_COURSES} />
    </div>
  );

  const renderQuizzes = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><ListChecks className="h-7 w-7 text-blue-600" /> Scheduled Quizzes</h2>
      <ScheduledQuizzesSection studentName={studentName} /> {/* Replaced AvailableQuizzesSection */}
    </div>
  );

  const renderMyResults = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BarChart className="h-7 w-7 text-purple-600" /> My Results & Performance</h2>
      <PerformanceOverview recentAttempts={studentAttempts} />
      <RecentActivity recentAttempts={studentAttempts} />
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Trophy className="h-7 w-7 text-yellow-600" /> Leaderboard</h2>
      <Card className="p-6 shadow-lg">
        <p className="text-gray-600 mb-4">View overall rankings across all quizzes and compare your performance with peers.</p>
        <Link to="/leaderboard">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Go to Global Leaderboard</Button>
        </Link>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <Card className="shadow-lg max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl"><User className="h-6 w-6" /> Student Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Name</p>
          <p className="text-xl font-semibold">{studentName}</p>
        </div>
        <div className="p-4 border rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Register Number</p>
          <p className="text-xl font-semibold">{registerNumber}</p>
        </div>
        <p className="text-sm text-gray-500">Note: Profile details are managed by the Admin.</p>
      </CardContent>
    </Card>
  );

  switch (activeView) {
    case 'dashboard':
      return renderDashboard();
    case 'my-courses':
      return renderMyCourses();
    case 'quizzes':
      return renderQuizzes();
    case 'my-results':
      return renderMyResults();
    case 'leaderboard':
      return renderLeaderboard();
    case 'profile':
      return renderProfile();
    default:
      return renderDashboard();
  }
};

export default StudentDashboardContent;