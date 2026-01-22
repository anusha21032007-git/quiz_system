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
import ScheduledQuizAlert from './ScheduledQuizAlert';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { User, BookOpen, BarChart, Trophy, ListChecks, Brain, MessageSquare, Briefcase, PlayCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentCompetitiveSession from './StudentCompetitiveSession';

interface StudentDashboardContentProps {
  activeView: string;
  studentName: string;
  registerNumber: string;
}



// Derive courses from available quizzes
import { Course } from './MyCourses';

const StudentDashboardContent = ({ activeView, studentName, registerNumber }: StudentDashboardContentProps) => {
  const { quizzes: contextQuizzes, quizAttempts, markQuizzesAsSeen } = useQuiz();

  // Use quizzes from context and filter ACTIVE status
  const allQuizzes = React.useMemo(() => {
    return contextQuizzes.filter((q: any) => q.status === 'ACTIVE').map((q: any) => ({
      ...q,
      courseName: String(q.courseName || 'Unknown Course')
    }));
  }, [contextQuizzes]);

  // Filter quizzes to only show ACTIVE ones to students
  // Note: allQuizzes is already filtered for ACTIVE, so this is just a pass-through or re-memoization
  const quizzes = useMemo(() => allQuizzes, [allQuizzes]);

  const [selectedCompetitive, setSelectedCompetitive] = React.useState<Quiz | null>(null);

  // Clear new quiz notification/flag when viewing quizzes page
  React.useEffect(() => {
    if (activeView === 'quizzes') {
      markQuizzesAsSeen();
    }
  }, [activeView, markQuizzesAsSeen]);

  // Derive courses from available quizzes
  const dynamicCourses: Course[] = useMemo(() => {
    // ... (existing code)
    const uniqueCourseNames = Array.from(new Set(quizzes.map((q: { courseName: string }) => q.courseName)));
    // ... (existing code continues below, just ensuring context)
    return uniqueCourseNames.map((name, index) => {
      // ...
      const attemptsForCourse = quizAttempts.filter(a => {
        const quiz = quizzes.find((q: { id: string }) => q.id === a.quizId);
        // @ts-ignore
        return quiz?.courseName === name;
      });
      // @ts-ignore
      const quizzesForCourse = quizzes.filter((q: { courseName: string }) => q.courseName === name);

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

  const { hasNewQuizzes } = useQuiz();

  const studentAttempts = useMemo(() => {
    return quizAttempts.filter(attempt => attempt.studentName === studentName);
  }, [quizAttempts, studentName]);

  const totalQuizzesAttempted = studentAttempts.length;
  const quizzesPassed = studentAttempts.filter(a => a.passed).length;

  const averageScore = useMemo(() => {
    if (totalQuizzesAttempted === 0) return 0;
    const totalScore = studentAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return Math.round(totalScore / totalQuizzesAttempted);
  }, [studentAttempts, totalQuizzesAttempted]);

  const currentRank = useMemo(() => {
    return totalQuizzesAttempted > 0 ? "Top 10%" : "N/A";
  }, [totalQuizzesAttempted]);

  const renderDashboard = () => (
    <div className="space-y-8">
      <DashboardWelcome studentName={studentName} registerNumber={registerNumber} />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 relative">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Start Your Assessment Journey
          {hasNewQuizzes && (
            <span className="flex h-3 w-3 rounded-full bg-red-600 animate-pulse ring-2 ring-white absolute -right-4 top-1" />
          )}
        </h2>
        {/* Top Row: Next Action Card (Full Width) */}
        <div className="grid gap-6 grid-cols-1">
          <NextActionCard studentName={studentName} averageScore={averageScore} quizzes={quizzes} />
        </div>

        {/* Display Active Quizzes List */}
        <div className="pt-2">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-indigo-500" />
            Available Quizzes
          </h3>
          <QuizStatusTimeline studentName={studentName} quizzes={quizzes} />
        </div>
      </div>

      <OverviewCards
        totalQuizzesAttempted={totalQuizzesAttempted}
        quizzesPassed={quizzesPassed}
        averageScore={averageScore}
        currentRank={currentRank}
      />

      {/* Main Content Grid */}
      <div className="space-y-8">
        <MyCourses courses={dynamicCourses} quizzes={quizzes} />
      </div>
    </div>
  );

  const renderMyCourses = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="h-7 w-7 text-green-600" /> My Courses</h2>
      <MyCourses courses={dynamicCourses} quizzes={quizzes} />
    </div>
  );

  const renderQuizzes = () => (
    <div className="space-y-8">
      <QuizStatusTimeline studentName={studentName} quizzes={quizzes} />
    </div>
  );

  const renderCompetitiveMode = () => {
    if (selectedCompetitive) {
      return (
        <StudentCompetitiveSession
          quiz={selectedCompetitive}
          studentName={studentName}
          onExit={() => setSelectedCompetitive(null)}
        />
      );
    }

    const competitiveSessions = quizzes.filter(q => q.isCompetitive);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Competitive Prep Sessions
          </h2>
          <p className="text-gray-500 max-w-2xl">
            Join self-paced competitive practice sessions published by your instructors. These focus on concept clarity and open-ended responses.
          </p>
        </div>

        {competitiveSessions.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 bg-gray-50/50">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-full shadow-sm border">
                <MessageSquare className="h-10 w-10 text-gray-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-700">No active sessions</h3>
                <p className="text-gray-500">Check back later for new competitive practice sessions.</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitiveSessions.map((session) => {
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
                      {session.title.replace('CMP: ', '').replace('INT: ', '')}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      Practical competitive preparation for {session.courseName}.
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
                      onClick={() => setSelectedCompetitive(session)}
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
    case 'competitive-mode':
      return renderCompetitiveMode();
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