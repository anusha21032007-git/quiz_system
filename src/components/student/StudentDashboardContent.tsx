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
    const uniqueCourseNames = Array.from(new Set(quizzes.map((q: { courseName: string }) => q.courseName)));
    return uniqueCourseNames.map((name, index) => {
      const attemptsForCourse = quizAttempts.filter(a => {
        const quiz = quizzes.find((q: { id: string }) => q.id === a.quizId);
        return quiz?.courseName === name;
      });
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
    // Calculate average score based on percentage
    const totalPercentage = studentAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0);
    return Math.round(totalPercentage / totalQuizzesAttempted);
  }, [studentAttempts, totalQuizzesAttempted]);

  const currentRank = useMemo(() => {
    return totalQuizzesAttempted > 0 ? "Top 10%" : "N/A";
  }, [totalQuizzesAttempted]);

  const renderDashboard = () => (
    <div className="space-y-10">
      <DashboardWelcome studentName={studentName} registerNumber={registerNumber} />

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-[#1E2455] flex items-center gap-4 tracking-tighter font-poppins uppercase">
            <div className="p-2 bg-[#6C8BFF]/10 rounded-xl">
              <BookOpen className="h-6 w-6 text-[#6C8BFF]" />
            </div>
            Academic Terminal
            {hasNewQuizzes && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C8BFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#6C8BFF] ring-2 ring-white"></span>
              </span>
            )}
          </h2>
        </div>
        {/* Top Row: Next Action Card (Full Width) */}
        <div className="grid gap-6 grid-cols-1">
          <NextActionCard studentName={studentName} averageScore={averageScore} quizzes={quizzes} />
        </div>

        {/* Display Active Quizzes List */}
        <div className="pt-8">
          <div className="flex items-center gap-4 mb-6 px-4">
            <div className="p-1.5 bg-[#FFB86C]/10 rounded-lg">
              <ListChecks className="h-5 w-5 text-[#FFB86C]" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A80B8]">
              Simulation Queue
            </h3>
            <div className="flex-1 h-px bg-[#7A80B8]/10" />
          </div>
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-black text-[#1E2455] flex items-center gap-4 tracking-tighter font-poppins uppercase">
          <div className="p-2.5 bg-[#6C8BFF]/10 rounded-2xl shadow-sm">
            <BookOpen className="h-8 w-8 text-[#6C8BFF]" />
          </div>
          Academic Disciplines
        </h2>
        <p className="text-[#3A3F6B] font-bold opacity-70 ml-2">Review your indexed courses and modular simulation progress.</p>
      </div>
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

    const competitiveSessions = quizzes.filter(q => q.competitionMode);

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-black text-[#1E2455] flex items-center gap-4 tracking-tighter font-poppins uppercase">
            <div className="p-2.5 bg-[#E38AD6]/10 rounded-2xl shadow-sm">
              <Brain className="h-8 w-8 text-[#E38AD6]" />
            </div>
            Cognitive Analysis
          </h2>
          <p className="text-[#3A3F6B] font-bold opacity-70 ml-2">
            Initiate high-precision assessments to validate your theoretical mastery.
          </p>
        </div>

        {competitiveSessions.length === 0 ? (
          <Card className="glass-card p-24 text-center border-dashed border-2 border-white/40">
            <div className="flex flex-col items-center gap-8">
              <div className="bg-white/40 border border-white/50 p-7 rounded-[32px] shadow-sm group hover:scale-110 transition-all duration-500">
                <MessageSquare className="h-14 w-14 text-[#7A80B8]/40 group-hover:text-[#6C8BFF]/50 transition-all" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-[#1E2455] tracking-tight font-poppins">NO ACTIVE PROTOCOLS</h3>
                <p className="text-[#7A80B8] font-bold italic">Check the central archive later for new conceptual audits.</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competitiveSessions.map((session) => {
              const isCompleted = quizAttempts.some(a => a.quizId === session.id && a.studentName === studentName);

              // Schedule validation
              const now = new Date();
              const scheduledDate = new Date(session.scheduledDate);

              // Parse start/end times
              const [startHour, startMinute] = session.startTime.split(':').map(Number);
              const [endHour, endMinute] = session.endTime.split(':').map(Number);

              const startDateTime = new Date(scheduledDate);
              startDateTime.setHours(startHour, startMinute, 0);

              const endDateTime = new Date(scheduledDate);
              endDateTime.setHours(endHour, endMinute, 0);

              const isLive = now >= startDateTime && now <= endDateTime;
              const isUpcoming = now < startDateTime;
              const isExpired = now > endDateTime;

              return (
                <Card key={session.id} className="glass-card group hover:translate-y-[-8px] transition-all duration-500 overflow-hidden border-white/50 flex flex-col shadow-lg hover:shadow-glass-hover">
                  <div className={cn("h-1.5 w-full", isLive ? "bg-[#4EE3B2] shadow-[0_0_10px_rgba(78,227,178,0.5)]" : isUpcoming ? "bg-[#FFB86C]" : "bg-[#7A80B8]/20")} />
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-white/40 border border-white/60 rounded-[18px] flex items-center justify-center shadow-sm group-hover:bg-[#6C8BFF]/10 group-hover:border-[#6C8BFF]/30 transition-all duration-500">
                        <Briefcase className="h-7 w-7 text-[#6C8BFF]" />
                      </div>
                      {isCompleted ? (
                        <Badge className="bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                          <CheckCircle className="h-3 w-3 mr-2" /> Verified
                        </Badge>
                      ) : isLive ? (
                        <Badge className="bg-gradient-to-r from-[#6C8BFF] to-[#8EA2FF] text-white font-black text-[9px] uppercase tracking-widest animate-pulse px-3 py-1.5 rounded-full shadow-md border-white/40">CORE LINK</Badge>
                      ) : isUpcoming ? (
                        <Badge className="bg-white/40 text-[#7A80B8] border-white/60 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">Upcoming</Badge>
                      ) : (
                        <Badge className="bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">Expired</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-black text-[#1E2455] group-hover:text-[#6C8BFF] transition-colors tracking-tighter uppercase leading-tight font-poppins">
                      {session.title.replace('CMP: ', '').replace('INT: ', '')}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-bold text-[#7A80B8] uppercase tracking-widest mt-3 flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#6C8BFF] rounded-full" />
                      {isUpcoming
                        ? `T-Minus: ${session.startTime}`
                        : `${session.courseName} Audit`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-6 flex-grow">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#3A3F6B] opacity-60">
                      <ListChecks className="h-4 w-4 text-[#6C8BFF]" />
                      Professional Aptitude
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-6 bg-white/20 border-t border-white/30 mt-auto">
                    <Button
                      onClick={() => setSelectedCompetitive(session)}
                      disabled={!isLive && !isCompleted}
                      className={cn(
                        "pastel-button-primary w-full h-12 text-[10px] tracking-widest",
                        !isLive && !isCompleted ? "grayscale opacity-50 cursor-not-allowed" : "",
                        isCompleted ? "from-white/60 to-white/40 !text-[#6C8BFF] border border-[#6C8BFF]/30 shadow-sm" : ""
                      )}
                    >
                      {isCompleted
                        ? <> <PlayCircle className="h-4 w-4" /> Review Submission </>
                        : isUpcoming
                          ? `Access Restricted: ${session.startTime}`
                          : isExpired
                            ? "Session Closed"
                            : <> <PlayCircle className="h-4 w-4" /> Initialize Core Link </>
                      }
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-black text-[#1E2455] flex items-center gap-4 tracking-tighter font-poppins uppercase">
          <div className="p-2.5 bg-[#6C8BFF]/10 rounded-2xl shadow-sm">
            <BarChart className="h-8 w-8 text-[#6C8BFF]" />
          </div>
          Performance Archives
        </h2>
        <p className="text-[#3A3F6B] font-bold opacity-70 ml-2">Access your historical performance metrics and verified valuation records.</p>
      </div>
      <div className="space-y-6">
        <StudentResultsList studentAttempts={studentAttempts} quizzes={quizzes} />
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-black text-[#1E2455] flex items-center gap-4 tracking-tighter font-poppins uppercase">
          <div className="p-2.5 bg-[#FFB86C]/10 rounded-2xl shadow-md">
            <Trophy className="h-8 w-8 text-[#FFB86C]" />
          </div>
          Distinction Registry
        </h2>
        <p className="text-[#3A3F6B] font-bold opacity-70 ml-2">The verified repository of high-tier academic simulation achievers.</p>
      </div>
      <Card className="glass-card p-12 relative overflow-hidden group shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF]/5 to-[#E38AD6]/5 opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="w-40 h-40 bg-white/40 border border-white/60 rounded-[40px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-700">
            <Trophy className="h-20 w-20 text-[#FFB86C] drop-shadow-md" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <h3 className="text-3xl font-black text-[#1E2455] tracking-tight font-poppins uppercase">AUTHENTICATION REQUIRED</h3>
            <p className="text-[#7A80B8] font-bold italic tracking-tight mb-8 max-w-lg">Synchronize with the global distinction network to verify your competitive standing among the institution's elite scholars.</p>
            <Link to="/leaderboard" className="block w-fit">
              <Button className="pastel-button-primary px-12 h-14 text-xs tracking-widest">
                ACCESS REGISTRY
              </Button>
            </Link>
          </div>
        </div>
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