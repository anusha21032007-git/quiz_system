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
    <div className="space-y-8">
      <DashboardWelcome studentName={studentName} registerNumber={registerNumber} />

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-4 uppercase tracking-[0.2em]">
                <BookOpen className="h-6 w-6 text-primary" />
                Assessment Terminal
                {hasNewQuizzes && (
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary ring-2 ring-slate-950"></span>
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
          <div className="flex items-center gap-4 mb-6 px-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Simulation Queue
            </h3>
            <div className="flex-1 h-px bg-slate-800/50" />
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-50 flex items-center gap-4 uppercase tracking-tighter">
            <BookOpen className="h-8 w-8 text-primary" /> 
            Study Curriculum
        </h2>
        <p className="text-slate-500 font-bold italic tracking-tight">Review your indexed disciplines and simulation progress.</p>
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
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-slate-50 flex items-center gap-4 uppercase tracking-tighter">
            <Brain className="h-8 w-8 text-primary shadow-xl shadow-primary/20" />
            Concept Mastery Sessions
          </h2>
          <p className="text-slate-500 font-bold italic tracking-tight">
            Initiate self-paced concept evaluations to refine your theoretical understanding.
          </p>
        </div>

        {competitiveSessions.length === 0 ? (
          <Card className="p-20 text-center bg-card border border-slate-800 border-dashed rounded-[40px] shadow-inner">
            <div className="flex flex-col items-center gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-xl group hover:border-primary/30 transition-all">
                <MessageSquare className="h-12 w-12 text-slate-700 group-hover:text-primary/50 transition-all" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">No Active Protocols</h3>
                <p className="text-slate-500 font-bold italic tracking-tight">Check the archive later for new conceptual assessments.</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Card key={session.id} className="group hover:scale-[1.02] hover:bg-slate-900/40 transition-all duration-300 border-slate-800 bg-card overflow-hidden rounded-[24px] flex flex-col shadow-2xl shadow-primary/5">
                  <div className={cn("h-1.5 w-full", isLive ? "bg-success" : isUpcoming ? "bg-yellow" : "bg-slate-800")} />
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-inner">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      {isCompleted ? (
                        <Badge className="bg-success/10 text-success border-success/20 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                          <CheckCircle className="h-3 w-3 mr-2" /> Verified
                        </Badge>
                      ) : isLive ? (
                        <Badge className="bg-primary hover:bg-primary/90 font-black text-[9px] uppercase tracking-widest animate-pulse px-3 py-1">CORE LINK</Badge>
                      ) : isUpcoming ? (
                        <Badge className="bg-slate-900 text-slate-400 border-slate-800 font-black text-[9px] uppercase tracking-widest px-3 py-1">Upcoming</Badge>
                      ) : (
                        <Badge className="bg-danger/10 text-danger border-danger/20 font-black text-[9px] uppercase tracking-widest px-3 py-1">Expired</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-black text-slate-50 group-hover:text-primary transition-colors tracking-tighter uppercase leading-none">
                      {session.title.replace('CMP: ', '').replace('INT: ', '')}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                      {isUpcoming
                        ? `Begins: ${startDateTime.toLocaleDateString()} at ${session.startTime}`
                        : `Phase: ${session.courseName} conceptual analysis`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-4 flex-grow">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Aptitude Verification
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-4 bg-slate-950/20 border-t border-slate-800">
                    <Button
                      onClick={() => setSelectedCompetitive(session)}
                      disabled={!isLive && !isCompleted}
                      className={cn(
                        "w-full h-11 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3",
                        !isLive && !isCompleted ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" : "",
                        isCompleted ? "bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                      )}
                    >
                      {isCompleted
                        ? <> <PlayCircle className="h-4 w-4" /> Review Archive </>
                        : isUpcoming
                          ? `Scheduled: ${session.startTime}`
                          : isExpired
                            ? "Access Denied: Expired"
                            : <> <PlayCircle className="h-4 w-4" /> Initiate Session </>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-50 flex items-center gap-4 uppercase tracking-tighter">
            <BarChart className="h-8 w-8 text-primary" /> 
            Simulation Archives
        </h2>
        <p className="text-slate-500 font-bold italic tracking-tight">Access your historical performance data and valuation records.</p>
      </div>
      <div className="space-y-6">
        <StudentResultsList studentAttempts={studentAttempts} quizzes={quizzes} />
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-50 flex items-center gap-4 uppercase tracking-tighter">
            <Trophy className="h-8 w-8 text-primary shadow-xl shadow-primary/20" /> 
            Global Merit Ranking
        </h2>
        <p className="text-slate-500 font-bold italic tracking-tight">The ultimate repository of top-tier simulation performers.</p>
      </div>
      <Card className="p-10 bg-card border border-slate-800 shadow-2xl shadow-primary/5 rounded-[40px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-[32px] flex items-center justify-center shadow-inner group-hover:border-primary/30 transition-all">
                <Trophy className="h-16 w-16 text-slate-700 group-hover:text-primary transition-all" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-50 uppercase tracking-tighter mb-2">Authorized Access Required</h3>
                <p className="text-slate-500 font-bold italic tracking-tight mb-8">Synchronize with the global leaderboard to verify your standing among elite scholars.</p>
                <Link to="/leaderboard">
                    <Button className="px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                        Access Merit Registry
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