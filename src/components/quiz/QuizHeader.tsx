"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface QuizHeaderProps {
  quizTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  isMobile: boolean;
  onBack?: () => void;
}

const QuizHeader = ({ quizTitle, currentQuestionIndex, totalQuestions, timeLeft, isMobile, onBack }: QuizHeaderProps) => {
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full bg-background p-4 border-b border-border sticky top-0 z-10">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between w-full">
          <BackButton onClick={onBack} />
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timeLeft <= 60 ? 'text-destructive border-destructive/20 bg-destructive/10' : 'text-info border-info/20 bg-info/10'}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{quizTitle}</h1>
          <div className="w-1/2 max-w-[200px]">
            <Progress value={progress} className="h-2 bg-muted transition-all" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;