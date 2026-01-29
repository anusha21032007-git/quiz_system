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
      title: "Assessments Attempted",
      value: totalQuizzesAttempted,
      icon: ListChecks,
      description: "Total simulations logged.",
      color: "#6C8BFF"
    },
    {
      title: "Success Rate (%)",
      value: `${quizzesPassed} Validated`,
      icon: CheckCircle,
      description: "Simulations above threshold.",
      color: "#4EE3B2"
    },
    {
      title: "Average Score",
      value: `${averageScore.toFixed(0)}%`,
      icon: TrendingUp,
      description: "Total performance index.",
      color: "#E38AD6"
    },
    {
      title: "Global Standing",
      value: currentRank,
      icon: Award,
      description: "Validated peer percentile.",
      color: "#FFB86C"
    },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {cards.map((card, index) => (
        <Card key={index} className="glass-card hover:translate-y-[-8px] group border-white/60 shadow-xl hover:shadow-glass-hover transition-all duration-700 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6C8BFF]/5 rounded-full blur-2xl group-hover:bg-[#6C8BFF]/10 transition-all duration-700" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8">
            <CardTitle className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] group-hover:text-[#1E2455] transition-colors leading-none">{card.title}</CardTitle>
            <div className="w-14 h-14 bg-white/40 border border-white/60 rounded-[22px] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 group-hover:bg-white/60 group-hover:shadow-md">
              <card.icon className="h-7 w-7 text-[#6C8BFF] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10 pt-0 relative z-10">
            <div className="text-5xl font-black text-[#1E2455] tracking-tighter group-hover:scale-[1.02] transition-transform origin-left font-poppins">{card.value}</div>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
              <p className="text-[11px] text-[#3A3F6B] font-bold italic tracking-tight opacity-60 group-hover:opacity-100 transition-all">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;