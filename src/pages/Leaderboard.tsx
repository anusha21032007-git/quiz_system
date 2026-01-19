"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuiz, QuizAttempt } from '@/context/QuizContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-white p-8">
      <header className="max-w-4xl mx-auto space-y-4 mb-10">
        <BackButton />
        <div className="pb-4 border-b-2 border-gray-100 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-black tracking-tight">Leaderboard</h1>
          <div className="px-4 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-mono text-gray-500">
            Live Ranking
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {Object.keys(groupedAttempts).length === 0 ? (
          <div className="py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Quiz Results Yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto italic">
              "Competitive rankings will manifest here as students complete their assessments."
            </p>
          </div>
        ) : (
          Object.keys(groupedAttempts).map(quizId => {
            const quiz = quizzes.find(q => q.id === quizId);
            if (!quiz) return null;

            return (
              <div key={quizId} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Trophy className="h-7 w-7 text-yellow-500" />
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {groupedAttempts[quizId].length} Participants
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {groupedAttempts[quizId].map((attempt, index) => (
                    <div key={attempt.id} className={cn(
                      "group p-4 rounded-2xl border transition-all flex items-center justify-between relative overflow-hidden",
                      index === 0 ? "bg-amber-50/50 border-amber-200 shadow-amber-100 shadow-md" :
                        index === 1 ? "bg-slate-50/50 border-slate-200" :
                          index === 2 ? "bg-orange-50/10 border-orange-100" : "bg-white border-slate-100 shadow-sm hover:shadow-md"
                    )}>
                      <div className="flex items-center gap-6">
                        {/* Rank Indicator */}
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full font-black text-sm border-2 transition-all shrink-0",
                          index === 0 ? "bg-yellow-400 border-yellow-500 text-white shadow-lg shadow-yellow-100 rotate-3 scale-110" :
                            index === 1 ? "bg-slate-300 border-slate-400 text-white rotate-2" :
                              index === 2 ? "bg-orange-300 border-orange-400 text-white -rotate-2" :
                                "bg-slate-50 border-slate-100 text-slate-400"
                        )}>
                          {index + 1}
                        </div>

                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                          <Users className="h-6 w-6 text-indigo-500" />
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {attempt.studentName}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(attempt.timeTakenSeconds)}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span>{new Date(attempt.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                          {attempt.score.toFixed(0)}
                          <span className="text-xs text-slate-300 ml-1">/ {attempt.totalQuestions}</span>
                        </div>
                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Final Grade
                        </div>
                      </div>

                      {index === 0 && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-400 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                          Top Performer
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;