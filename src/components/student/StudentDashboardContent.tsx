"use client";

import React, { useMemo } from 'react';
import { useQuiz, QuizAttempt, Quiz } from '@/context/QuizContext';
import DashboardWelcome from './DashboardWelcome';
import OverviewCards from './OverviewCards';
import MyCourses from './MyCourses';
import PerformanceOverview from './PerformanceOverview';
import StudentResultsList from './StudentResultsList';
import QuizStatusTimeline from './QuizStatusTimeline';
import NextActionCard from './NextActionCard';
import InstructorNoticeCard from './InstructorNoticeCard';
import ScheduledQuizAlert from './ScheduledQuizAlert';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { User, BookOpen, BarChart, Trophy, ListChecks, Brain, MessageSquare, Briefcase, PlayCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentInterviewSession from './StudentInterviewSession';

interface StudentDashboardContentProps {
  activeView: string;
  studentName: string;
  registerNumber: string;
}



const StudentDashboardContent = ({ activeView, studentName, registerNumber }: StudentDashboardContentProps) => {
  const { quizAttempts, quizzes } = useQuiz();
  const [selectedInterview, setSelectedInterview] = React.useState<Quiz | null>(null);

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

  const renderInterviewMode = () => {
    if (selectedInterview) {
      return (
        <StudentInterviewSession
          quiz={selectedInterview}
          studentName={studentName}
          onExit={() => setSelectedInterview(null)}
        />
      );
    }

    const interviewSessions = quizzes.filter(q => q.isInterview);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Interview Prep Sessions
          </h2>
          <p className="text-gray-500 max-w-2xl">
            Join self-paced interview practice sessions published by your instructors. These focus on concept clarity and open-ended responses.
          </p>
        </div>

        {interviewSessions.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 bg-gray-50/50">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-full shadow-sm border">
                <MessageSquare className="h-10 w-10 text-gray-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-700">No active sessions</h3>
                <p className="text-gray-500">Check back later for new interview practice sessions.</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviewSessions.map((session) => {
              const isCompleted = quizAttempts.some(a => a.quizId === session.id && a.studentName === studentName);

              return (
                <Card key={session.id} className="group hover:shadow-xl transition-all duration-300 border-purple-100 overflow-hidden flex flex-col">
                  <div className="h-2 bg-purple-600 w-full" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                      </div>
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl line-clamp-1 group-hover:text-purple-700 transition-colors">
                      {session.title.replace('INT: ', '')}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      Practical interview preparation for {session.courseName}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <ListChecks className="h-4 w-4" />
                        Self-Evaluation
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t bg-gray-50/50">
                    <Button
                      onClick={() => setSelectedInterview(session)}
                      className={cn(
                        "w-full shadow-md group-hover:scale-[1.02] transition-transform gap-2",
                        isCompleted ? "bg-gray-800 hover:bg-gray-900" : "bg-purple-600 hover:bg-purple-700"
                      )}
                    >
                      {isCompleted ? <PlayCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                      {isCompleted ? "Re-Practice Session" : "Start Practice Session"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
    case 'interview-mode':
      return renderInterviewMode();
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