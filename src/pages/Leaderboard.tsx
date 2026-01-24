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

const Leaderboard = () => {
  const { quizAttempts, quizzes } = useQuiz();
  const { user, teacherData } = useAuth();
  const isStudent = !!user && !teacherData;
  const studentName = (user?.user_metadata?.full_name || user?.email?.split('@')[0]) || '';

  // Filter quizzes to include only AI-generated or manually created (non-competitive)
  const relevantQuizzes = useMemo(() => {
    const aiOrManualQuizzes = quizzes.filter(q =>
      (q.title.includes('(AI Generated)') || q.id.startsWith('qz-local-')) && !q.isCompetitive
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

      // Calculate total possible marks for this specific quiz attempt
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      if (quiz) {
        const quizMaxMarks = (quiz.questions || []).reduce((sum, q) => sum + q.marks, 0);
        studentPerf.totalMaxPossibleMarks += quizMaxMarks;
      }
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

  return (
    <div className="min-h-screen bg-white p-8">
      <header className="max-w-4xl mx-auto space-y-4 mb-10 text-center sm:text-left">
        <BackButton />
        <div className="pb-4 border-b-2 border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-4xl font-black text-black tracking-tight uppercase">Global Leader Board</h1>
          <div className="px-4 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-mono text-gray-500">
            AI & Manual Quizzes
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {studentOverallPerformance.length === 0 ? (
          <div className="py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Relevant Quiz Results Yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto italic">
              "Students will appear here once they complete AI-generated or manually created quizzes."
            </p>
          </div>
        ) : (
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                <Trophy className="h-5 w-5 text-yellow-600" /> Overall Rankings
              </CardTitle>
              <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border">
                {studentOverallPerformance.length} Students Ranked
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-600 w-[80px]">Rank</TableHead>
                    <TableHead className="font-semibold text-gray-600">Student Name</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-center">Total Score</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-center">Percentage</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-right">Time Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentOverallPerformance.map((student, index) => (
                    <TableRow key={student.studentName} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-bold text-lg text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full",
                          index === 0 ? "bg-yellow-400 text-white" :
                            index === 1 ? "bg-slate-300 text-white" :
                              index === 2 ? "bg-orange-300 text-white" :
                                "bg-gray-100 text-gray-600"
                        )}>
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{student.studentName}</TableCell>
                      <TableCell className="text-center font-bold text-indigo-600">
                        {student.totalScore.toFixed(0)} / {student.totalMaxPossibleMarks.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-emerald-600">
                        {student.averagePercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100">
                          <Clock className="h-3 w-3" /> {formatTime(student.totalTimeTakenSeconds)}
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
          <div className="pt-8 border-t-2 border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Clock className="h-6 w-6 text-indigo-500" />
                Your Personal Achievement History
              </h2>
              <p className="text-sm text-gray-500 mt-1 italic">"Track your individual progress and downloadable reports below."</p>
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
};

export default Leaderboard;