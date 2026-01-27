"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks, CheckCircle, TrendingUp, Award, DollarSign } from 'lucide-react'; // Added DollarSign icon

interface OverviewCardsProps {
  totalQuizzesAttempted: number;
  quizzesPassed: number;
  averageScore: number;
  currentRank: string | number;
}

const OverviewCards = ({ totalQuizzesAttempted, quizzesPassed, averageScore, currentRank }: OverviewCardsProps) => {
  const cards = [
    {
      title: "Quizzes Attempted",
      value: totalQuizzesAttempted,
      icon: ListChecks,
      description: "Total quizzes taken so far.",
    },
    {
      title: "Quizzes Passed",
      value: quizzesPassed,
      icon: CheckCircle,
      description: "Quizzes with score > 50%.",
    },
    {
      title: "Average Score (%)",
      value: `${averageScore.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Your overall performance.",
    },
    {
      title: "Current Rank",
      value: currentRank,
      icon: Award,
      description: "Your position in results.",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card border-slate-800 shadow-xl shadow-primary/5 hover:border-slate-700 hover:bg-slate-900/40 transition-all group rounded-[24px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-6">
            <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{card.title}</CardTitle>
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
              <card.icon className="h-5 w-5 text-slate-500 group-hover:text-primary transition-all" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-black text-slate-50 tracking-tighter group-hover:scale-105 transition-transform origin-left">{card.value}</div>
            <p className="text-[10px] text-slate-500 font-bold italic tracking-tight mt-2 opacity-70 group-hover:opacity-100 transition-all">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;