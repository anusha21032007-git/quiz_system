"use client";

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, Clock } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import StudentResultsList from '@/components/student/StudentResultsList';
import TeacherLayout from '@/components/layout/TeacherLayout';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const GlobalLeaderboard = () => {
  const { quizAttempts, quizzes } = useQuiz();
  const { user, teacherData } = useAuth();
  const isMobile = useIsMobile();
  const isStudent = !!user && !teacherData;
  const studentName = (user?.user_metadata?.full_name || user?.email?.split('@')[0]) || '';

  // Filter quizzes to include only AI-generated or manually created (non-competitive)
  const relevantQuizzes = useMemo(() => {
    const aiOrManualQuizzes = quizzes.filter(q =>
      (q.title.includes('(AI Generated)') || q.id.startsWith('qz-local-')) && !q.competitionMode
    );
    return new Set(aiOrManualQuizzes.map(q => q.id));
  }, [quizzes]);

  // Filter attempts to only include those from relevant quizzes
  const filteredAttempts = useMemo(() => {
    return quizAttempts.filter(attempt => relevantQuizzes.has(attempt.quizId));
  }, [quizAttempts, relevantQuizzes]);

  // Aggregate scores and times for each student across all relevant quizzes
  const studentOverallPerformance = useMemo(() => {
    const performanceMap: {
      [studentName: string]: {
        totalScore: number;
        totalMaxPossibleMarks: number;
        totalTimeTakenSeconds: number;
        lastAttemptTimestamp: number;
      };
    } = {};

    filteredAttempts.forEach(attempt => {
      const studentName = attempt.studentName;
      if (!performanceMap[studentName]) {
        performanceMap[studentName] = {
          totalScore: 0,
          totalMaxPossibleMarks: 0,
          totalTimeTakenSeconds: 0,
          lastAttemptTimestamp: 0,
        };
      }

      const studentPerf = performanceMap[studentName];
      studentPerf.totalScore += attempt.score;
      studentPerf.totalTimeTakenSeconds += attempt.timeTakenSeconds;
      studentPerf.lastAttemptTimestamp = Math.max(studentPerf.lastAttemptTimestamp, attempt.timestamp);

      // Use the calculated total marks possible from the attempt object
      studentPerf.totalMaxPossibleMarks += attempt.totalMarksPossible || 0;
    });

    // Convert map to array and sort
    const sortedStudents = Object.entries(performanceMap)
      .map(([studentName, data]) => ({
        studentName,
        totalScore: data.totalScore,
        totalMaxPossibleMarks: data.totalMaxPossibleMarks,
        totalTimeTakenSeconds: data.totalTimeTakenSeconds,
        averagePercentage: data.totalMaxPossibleMarks > 0 ? (data.totalScore / data.totalMaxPossibleMarks) * 100 : 0,
      }))
      .sort((a, b) => {
        // Primary sort: totalScore (descending)
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // Secondary sort: totalTimeTakenSeconds (ascending - lower is better)
        return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
      });

    return sortedStudents;
  }, [filteredAttempts, quizzes]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const leaderboardContent = (
    <div className="space-y-12">
      <header className="max-w-4xl mx-auto space-y-4 mb-10 text-center sm:text-left">
        {!teacherData && <BackButton className="text-slate-400 hover:text-slate-100" />}
        <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-4xl font-black text-slate-50 tracking-tight uppercase">Global Leader Board</h1>
          <div className="px-4 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-500 uppercase tracking-widest">
            AI & Manual Quizzes
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {studentOverallPerformance.length === 0 ? (
          <div className="py-24 bg-card rounded-[40px] border border-slate-800 text-center shadow-xl">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
              <Trophy className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-2">No Relevant Quiz Results Yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto italic">
              "Students will appear here once they complete AI-generated or manually created quizzes."
            </p>
          </div>
        ) : (
          <Card className="shadow-2xl border-slate-800 bg-card overflow-hidden rounded-[32px]">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-950/20 px-8">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-100 font-black uppercase tracking-tight">
                <Trophy className="h-5 w-5 text-yellow" /> Overall Rankings
              </CardTitle>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                {studentOverallPerformance.length} Students Ranked
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900/50 hover:bg-slate-900/50 border-slate-800">
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] w-[80px] pl-8">Rank</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Student Name</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Total Score</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Percentage</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right pr-8">Time Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentOverallPerformance.map((student, index) => (
                    <TableRow key={student.studentName} className="hover:bg-slate-900/30 transition-colors border-slate-800/50">
                      <TableCell className="font-bold text-lg text-center pl-8">
                        <span className={cn(
                          "inline-flex items-center justify-center w-9 h-9 rounded-xl font-black shadow-lg",
                          index === 0 ? "bg-yellow text-slate-900 shadow-yellow/20" :
                            index === 1 ? "bg-slate-300 text-slate-900 shadow-slate-300/20" :
                              index === 2 ? "bg-orange text-white shadow-orange/20" :
                                "bg-slate-800 text-slate-400"
                        )}>
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-100">{student.studentName}</TableCell>
                      <TableCell className="text-center font-black text-primary">
                        {student.totalScore.toFixed(2)} / {student.totalMaxPossibleMarks.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center font-black text-success">
                        {student.averagePercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-slate-400 pr-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                          <Clock className="h-3 w-3 text-primary" /> {formatTime(student.totalTimeTakenSeconds)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {isStudent && (
          <div className="pt-12 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3 uppercase tracking-tight">
                <Clock className="h-6 w-6 text-primary" />
                Your Achievement History
              </h2>
              <p className="text-sm text-slate-500 mt-1 italic font-medium">"Track your individual progress and downloadable reports below."</p>
            </div>
            <StudentResultsList
              studentAttempts={quizAttempts.filter(a => a.studentName === studentName)}
              quizzes={quizzes}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (teacherData) {
    return (
      <TeacherLayout activeView="leaderboard" title="Global Leaderboard">
        {leaderboardContent}
      </TeacherLayout>
    );
  }

  if (isStudent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-card shadow-lg lg:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <StudentSidebar activeView="leaderboard" setActiveView={() => { }} isMobile={isMobile} />
            <BackButton className="lg:hidden" />
          </div>
          <h1 className="text-xl font-black text-slate-50 uppercase tracking-tight">Leaderboard</h1>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {!isMobile && (
            <aside className="w-64 flex-shrink-0 h-full border-r bg-sidebar text-sidebar-foreground">
              <StudentSidebar activeView="leaderboard" setActiveView={() => { }} isMobile={isMobile} />
            </aside>
          )}
          <main className="flex-1 overflow-y-auto p-8 lg:p-12 CustomScrollbar">
            {leaderboardContent}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12">
      {leaderboardContent}
    </div>
  );
};

export default GlobalLeaderboard;