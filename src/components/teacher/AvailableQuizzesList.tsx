"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Clock, MinusCircle, Users, Loader2 } from 'lucide-react';
import { Quiz, useQuiz } from '@/context/QuizContext'; // Import useQuiz

interface AvailableQuizzesListProps {
  quizzes: Quiz[];
}

const AvailableQuizzesList = ({ quizzes }: AvailableQuizzesListProps) => {
  const { isQuizzesLoading } = useQuiz();

  if (isQuizzesLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading Quizzes...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Fetching scheduled quizzes from the database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trophy className="h-6 w-6" /> Available Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <p className="text-gray-500">No quizzes created yet.</p>
        ) : (
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex justify-between items-center p-3 border rounded-md bg-white shadow-sm">
                <div>
                  {/* Note: We cannot easily display question count here without an extra query per quiz. */}
                  <span className="font-medium">{quiz.title} (Questions: N/A)</span> 
                  <p className="text-sm text-gray-700 mb-1">Course: {quiz.courseName}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="h-4 w-4 inline-block" /> {quiz.timeLimitMinutes} min
                    {quiz.negativeMarking && <MinusCircle className="h-4 w-4 inline-block text-red-500 ml-2" />}
                    {quiz.negativeMarking && <span className="text-red-500 text-xs">Negative Marking</span>}
                    {quiz.competitionMode && <Users className="h-4 w-4 inline-block text-purple-600 ml-2" />}
                    {quiz.competitionMode && <span className="text-purple-600 text-xs">Competition Mode</span>}
                  </p>
                </div>
                <Link to={`/quiz-preview/${quiz.id}`} className="text-sm text-blue-600 hover:underline">
                  Preview Quiz
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailableQuizzesList;