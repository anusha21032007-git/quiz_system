"use client";

import React, { useMemo } from 'react';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import DashboardWelcome from './DashboardWelcome';
import OverviewCards from './OverviewCards';
import MyCourses from './MyCourses';
import PerformanceOverview from './PerformanceOverview';
import StudentResultsList from './StudentResultsList';
import QuizStatusTimeline from './QuizStatusTimeline';
import NextActionCard from './NextActionCard';
import InstructorNoticeCard from './InstructorNoticeCard';
import ScheduledQuizAlert from './ScheduledQuizAlert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, BookOpen, BarChart, Trophy, ListChecks } from 'lucide-react';

interface StudentDashboardContentProps {
  activeView: string;
  studentName: string;
  registerNumber: string;
}



const StudentDashboardContent = ({ activeView, studentName, registerNumber }: StudentDashboardContentProps) => {
  const { quizAttempts, quizzes } = useQuiz();

  // Derive courses from available quizzes
  const dynamicCourses = useMemo(() => {
    const uniqueCourseNames = Array.from(new Set(quizzes.map(q => q.courseName)));

    return uniqueCourseNames.map((name, index) => {
      // Calculate simple progress based on attempts for this course
      const attemptsForCourse = quizAttempts.filter(a => {
        const quiz = quizzes.find(q => q.id === a.quizId);
        return quiz?.courseName === name;
      });
      const quizzesForCourse = quizzes.filter(q => q.courseName === name);

      const progress = quizzesForCourse.length > 0
        ? Math.round((attemptsForCourse.length / quizzesForCourse.length) * 100)
        : 0;

      return {
        id: `course-${index}`,
        name: name,
        progress: Math.min(progress, 100)
      };
    });
  }, [quizzes, quizAttempts]);

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

      {/* Top Row: Next Action & Notice Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NextActionCard studentName={studentName} averageScore={averageScore} />
        </div>
        <InstructorNoticeCard />
      </div>

      <OverviewCards
        totalQuizzesAttempted={totalQuizzesAttempted}
        quizzesPassed={quizzesPassed}
        averageScore={averageScore}
        currentRank={currentRank}
      />

      {/* Main Content Grid */}
      <div className="space-y-8">
        <MyCourses courses={dynamicCourses} />
      </div>
    </div>
  );

  const renderMyCourses = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="h-7 w-7 text-green-600" /> My Courses</h2>
      <MyCourses courses={dynamicCourses} />
    </div>
  );

  const renderQuizzes = () => (
    <div className="space-y-8">
      <QuizStatusTimeline studentName={studentName} />
    </div>
  );

  const renderMyResults = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BarChart className="h-7 w-7 text-purple-600" /> My Quiz History</h2>
      <div className="space-y-6">
        <StudentResultsList studentAttempts={studentAttempts} quizzes={quizzes} />
      </div>
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

  const renderProfile = () => {
    return (
      <Card className="shadow-lg max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><User className="h-6 w-6" /> Student Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Your profile details are available by clicking your name in the top right corner.</p>
        </CardContent>
      </Card>
    );
  };


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
      // Fallback for 'profile' view, although removed from navigation
      return renderProfile();
    default:
      return renderDashboard();
  }
};

export default StudentDashboardContent;