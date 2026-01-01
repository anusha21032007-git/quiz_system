"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListChecks, Trophy, Clock, MinusCircle, Users } from 'lucide-react'; // Added Users icon
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { quizzes, questions, getQuestionsForQuiz } = useQuiz();
  const [studentName, setStudentName] = useState('');

  const handleStartQuiz = (quizId: string) => {
    if (!studentName.trim()) {
      toast.error("Please enter your name to start the quiz.");
      return;
    }
    // Navigation is handled by the Link component, but this check ensures name is entered.
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/leaderboard" className="text-blue-600 hover:underline">Leaderboard</Link>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Label htmlFor="studentName" className="text-xl font-semibold">Your Name</Label>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              id="studentName"
              placeholder="Enter your name (e.g., John Doe)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-2 p-3 text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">This name will be used for the leaderboard.</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ListChecks className="h-6 w-6" /> Available Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes available yet. Please check back later!</p>
            ) : (
              <ul className="space-y-4">
                {quizzes.map((quiz) => {
                  const quizQuestions = getQuestionsForQuiz(quiz.id);
                  const totalMarks = quizQuestions.reduce((sum, q) => sum + q.marks, 0);

                  return (
                    <li key={quiz.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-md bg-white shadow-sm">
                      <div>
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <ListChecks className="h-4 w-4 inline-block" /> {quiz.questionIds.length} questions
                          <Clock className="h-4 w-4 inline-block ml-2" /> {quiz.timeLimitMinutes} min
                          <Trophy className="h-4 w-4 inline-block ml-2" /> {totalMarks} marks
                          {quiz.negativeMarking && <MinusCircle className="h-4 w-4 inline-block text-red-500 ml-2" />}
                          {quiz.negativeMarking && <span className="text-red-500 text-xs">Negative Marking</span>}
                          {quiz.competitionMode && <Users className="h-4 w-4 inline-block text-purple-600 ml-2" />}
                          {quiz.competitionMode && <span className="text-purple-600 text-xs">Competition Mode</span>}
                        </p>
                      </div>
                      <Link to={`/quiz/${quiz.id}`} state={{ studentName }}>
                        <Button
                          onClick={() => handleStartQuiz(quiz.id)}
                          disabled={!studentName.trim()}
                          className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start Quiz
                        </Button>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;