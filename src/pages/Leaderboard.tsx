"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, Clock } from 'lucide-react'; // Added Users and Clock icons

const Leaderboard = () => {
  const { quizAttempts, quizzes } = useQuiz();

  // Group attempts by quiz
  const groupedAttempts: { [quizId: string]: QuizAttempt[] } = {};
  quizAttempts.forEach(attempt => {
    if (!groupedAttempts[attempt.quizId]) {
      groupedAttempts[attempt.quizId] = [];
    }
    groupedAttempts[attempt.quizId].push(attempt);
  });

  // Sort attempts by score (desc), then time taken (asc)
  Object.keys(groupedAttempts).forEach(quizId => {
    groupedAttempts[quizId].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeTakenSeconds - b.timeTakenSeconds; // Tie-breaker: faster time wins
    });
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Leaderboard</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/student" className="text-blue-600 hover:underline">Student Dashboard</Link>
          <Link to="/teacher" className="text-blue-600 hover:underline">Teacher Dashboard</Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {Object.keys(groupedAttempts).length === 0 ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6" /> No Quiz Results Yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Students need to complete quizzes for results to appear here.</p>
            </CardContent>
          </Card>
        ) : (
          Object.keys(groupedAttempts).map(quizId => {
            const quiz = quizzes.find(q => q.id === quizId);
            if (!quiz) return null; // Should not happen if data is consistent

            return (
              <Card key={quizId} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Trophy className="h-6 w-6 text-yellow-500" /> Leaderboard for: {quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Time Taken</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedAttempts[quizId].map((attempt, index) => {
                        let rowClasses = '';
                        if (index === 0) rowClasses = 'bg-yellow-100 font-bold'; // Gold for 1st
                        else if (index === 1) rowClasses = 'bg-gray-200 font-semibold'; // Silver for 2nd
                        else if (index === 2) rowClasses = 'bg-orange-100 font-medium'; // Bronze for 3rd

                        return (
                          <TableRow key={attempt.id} className={rowClasses}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{attempt.studentName}</TableCell>
                            <TableCell className="text-right">{attempt.score.toFixed(2)} / {attempt.totalQuestions}</TableCell>
                            <TableCell className="text-right">{formatTime(attempt.timeTakenSeconds)}</TableCell>
                            <TableCell className="text-right">{new Date(attempt.timestamp).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;