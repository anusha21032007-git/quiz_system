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
    <div className="space-y-12 pb-20">
      <header className="max-w-4xl mx-auto space-y-4 mb-10 text-center sm:text-left">
        {!teacherData && <BackButton className="text-[#7A80B8] hover:text-[#1E2455] transition-colors" />}
        <div className="pb-6 border-b border-[#7A80B8]/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl font-black text-[#1E2455] tracking-tighter uppercase font-poppins">Global Merit Registry</h1>
          <div className="px-5 py-2 bg-white/40 border border-white/60 rounded-full text-[10px] font-black text-[#6C8BFF] uppercase tracking-[0.2em] shadow-sm">
            AI & Manual Valuations
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-16">
        {studentOverallPerformance.length === 0 ? (
          <div className="py-24 glass-card text-center shadow-xl border-dashed border-2 border-white/40">
            <div className="w-24 h-24 bg-white/40 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/60 shadow-sm group hover:scale-110 transition-transform duration-500">
              <Trophy className="h-12 w-12 text-[#7A80B8]/40" />
            </div>
            <h3 className="text-2xl font-black text-[#1E2455] mb-3 font-poppins uppercase">NO RANKINGS INDEXED</h3>
            <p className="text-[#7A80B8] max-w-xs mx-auto italic font-bold">
              "Students will appear here once they complete verified academic simulations."
            </p>
          </div>
        ) : (
          <Card className="glass-card overflow-hidden border-white/50 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-8 border-b border-white/30 bg-white/20 px-10">
              <CardTitle className="flex items-center gap-4 text-2xl text-[#1E2455] font-black uppercase tracking-tighter font-poppins">
                <div className="p-2 bg-[#FFB86C]/10 rounded-xl">
                  <Trophy className="h-6 w-6 text-[#FFB86C]" />
                </div>
                Elite Performers
              </CardTitle>
              <div className="text-[10px] text-[#6C8BFF] font-black uppercase tracking-widest bg-[#6C8BFF]/10 px-5 py-2 rounded-full border border-[#6C8BFF]/20 shadow-sm">
                {studentOverallPerformance.length} Scholars Indexed
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/10 hover:bg-white/10 border-white/20">
                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-widest text-[10px] w-[100px] pl-10 py-5 font-poppins text-center">Rank</TableHead>
                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-widest text-[10px] py-5 font-poppins">Candidate Identifier</TableHead>
                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-widest text-[10px] text-center py-5 font-poppins">Cumulative Score</TableHead>
                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-widest text-[10px] text-center py-5 font-poppins">Aptitude</TableHead>
                    <TableHead className="font-black text-[#7A80B8] uppercase tracking-widest text-[10px] text-right pr-10 py-5 font-poppins">Temporal Metric</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentOverallPerformance.map((student, index) => (
                    <TableRow key={student.studentName} className="hover:bg-white/40 transition-all duration-300 border-white/20 group">
                      <TableCell className="pl-10 py-6 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center w-11 h-11 rounded-2xl font-black shadow-md border-2",
                          index === 0 ? "bg-gradient-to-br from-[#FFD700] to-[#FFB86C] text-white border-white/40 shadow-yellow-500/20 scale-110" :
                            index === 1 ? "bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] text-[#475569] border-white/40 shadow-slate-400/20" :
                              index === 2 ? "bg-gradient-to-br from-[#FDBA74] to-[#EA580C] text-white border-white/40 shadow-orange-500/20" :
                                "bg-white/40 text-[#7A80B8] border-white/60"
                        )}>
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-[#1E2455] text-base group-hover:translate-x-1 transition-transform">{student.studentName}</TableCell>
                      <TableCell className="text-center font-black text-[#6C8BFF]">
                        <span className="text-[#1E2455]/80 text-xs mr-1 opacity-60">VAL:</span> {student.totalScore.toFixed(0)} / {student.totalMaxPossibleMarks.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#4EE3B2]/10 border border-[#4EE3B2]/20 font-black text-[#4EE3B2] text-xs">
                          {student.averagePercentage.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 font-black text-[10px] text-[#3A3F6B] shadow-sm">
                          <Clock className="h-3.5 w-3.5 text-[#6C8BFF]" /> {formatTime(student.totalTimeTakenSeconds)}
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
          <div className="pt-20 border-t border-[#7A80B8]/10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="mb-10 flex flex-col items-center sm:items-start">
              <div className="p-3 bg-[#6C8BFF]/10 rounded-2xl mb-4">
                <Clock className="h-8 w-8 text-[#6C8BFF]" />
              </div>
              <h2 className="text-3xl font-black text-[#1E2455] tracking-tighter uppercase font-poppins">
                Your Achievement History
              </h2>
              <p className="text-sm text-[#7A80B8] mt-2 italic font-bold">Comprehensive record of your modular academic simulations and verified reports.</p>
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
      <div className="min-h-screen flex flex-col bg-transparent font-poppins">
        <header className="flex items-center justify-between p-4 border-b border-white/30 bg-white/20 backdrop-blur-md shadow-glass lg:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <StudentSidebar activeView="leaderboard" setActiveView={() => { }} isMobile={isMobile} />
            <BackButton className="lg:hidden text-[#1E2455]" />
          </div>
          <h1 className="text-xl font-black text-[#1E2455] uppercase tracking-tighter">LEADERBOARD</h1>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {!isMobile && (
            <aside className="w-72 flex-shrink-0 h-full border-r border-white/20 bg-transparent text-white z-40">
              <StudentSidebar activeView="leaderboard" setActiveView={() => { }} isMobile={isMobile} />
            </aside>
          )}
          <main className="flex-1 overflow-y-auto p-10 lg:p-14 relative">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] -z-10" />
            {leaderboardContent}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-10 lg:p-14 font-poppins">
      {leaderboardContent}
    </div>
  );
};

export default GlobalLeaderboard;