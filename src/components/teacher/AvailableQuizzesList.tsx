import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, MinusCircle, Users, Loader2, Trash } from 'lucide-react';
import { Quiz, useQuiz } from '@/context/QuizContext';

interface AvailableQuizzesListProps {
  quizzes: Quiz[];
}

const AvailableQuizzesList = ({ quizzes }: AvailableQuizzesListProps) => {
  const { isQuizzesLoading, deleteQuiz } = useQuiz();

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteQuiz(id);
    }
  };

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-indigo-600" />
              Available Quizzes
            </h2>
            <p className="text-slate-500 mt-1 font-medium italic">"Review and manage your published assessments across all courses."</p>
          </div>
          <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Live Quizzes: {quizzes.length}
            </span>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex flex-col gap-3">
        {quizzes.length === 0 ? (
          <div className="py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Quizzes Created</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Your published quizzes will appear here once they are generated and assigned to a course.
            </p>
          </div>
        ) : (
          quizzes.map((quiz, idx) => (
            <div key={quiz.id} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                {/* Sequential Number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 font-bold text-xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                  {idx + 1}
                </div>

                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trophy className="h-6 w-6 text-indigo-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                      {quiz.id.slice(-6).toUpperCase()}
                    </span>
                    <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[8px] font-black uppercase tracking-wider">
                      Published
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 truncate">
                    {quiz.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                      <Clock className="h-3.5 w-3.5" />
                      {quiz.timeLimitMinutes} min
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="font-bold text-slate-500">Course: {quiz.courseName}</span>
                    {quiz.negativeMarking && (
                      <>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-rose-500 flex items-center gap-1">
                          <MinusCircle className="h-3.5 w-3.5" />
                          Negative Marking
                        </span>
                      </>
                    )}
                    {quiz.competitionMode && (
                      <>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-violet-600 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Competition
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 px-4 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  <Link to={`/quiz-preview/${quiz.id}`}>
                    Preview
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  className="h-9 px-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableQuizzesList;