"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks, Trophy, Clock, MinusCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AvailableQuizzesSectionProps {
  studentName: string;
}

const AvailableQuizzesSection = ({ studentName }: AvailableQuizzesSectionProps) => {
  const { quizzes, getQuestionsForQuiz, quizAttempts } = useQuiz();

  const handleStartQuiz = (quizId: string) => {
    if (!studentName.trim()) {
      toast.error("Please ensure your name is entered in the Profile/Dashboard section before starting a quiz.");
      return false;
    }
    return true;
  };

  const getQuizStatus = (quizId: string) => {
    // Check if the student has completed this quiz
    const completed = quizAttempts.some(attempt => attempt.quizId === quizId && attempt.studentName === studentName);
    if (completed) return 'Completed';
    
    // We don't track 'In Progress' easily without complex state management, so we'll stick to Not Started/Completed for now.
    return 'Not Started';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6 text-blue-600" /> Available / Upcoming Quizzes
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
              const status = getQuizStatus(quiz.id);

              return (
                <li key={quiz.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-md bg-white shadow-sm">
                  <div>
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <p className="text-sm text-gray-700 mb-1">Course: {quiz.courseName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 flex-wrap">
                      <ListChecks className="h-4 w-4 inline-block" /> {quiz.questionIds.length} questions
                      <Clock className="h-4 w-4 inline-block ml-2" /> {quiz.timeLimitMinutes} min
                      <Trophy className="h-4 w-4 inline-block ml-2" /> {totalMarks} marks
                      {quiz.negativeMarking && <MinusCircle className="h-4 w-4 inline-block text-red-500 ml-2" />}
                      {quiz.negativeMarking && <span className="text-red-500 text-xs">Negative Marking</span>}
                      {quiz.competitionMode && <Users className="h-4 w-4 inline-block text-purple-600 ml-2" />}
                      {quiz.competitionMode && <span className="text-purple-600 text-xs">Competition Mode</span>}
                    </p>
                    <span className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${
                        status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        Status: {status}
                    </span>
                  </div>
                  <Link to={`/quiz/${quiz.id}`} state={{ studentName }}>
                    <Button
                      onClick={() => handleStartQuiz(quiz.id)}
                      disabled={!studentName.trim() || status === 'Completed'}
                      className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {status === 'Completed' ? 'View Results' : 'Start Quiz'}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailableQuizzesSection;