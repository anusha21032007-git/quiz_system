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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;