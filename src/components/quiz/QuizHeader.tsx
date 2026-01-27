"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { cn } from '@/lib/utils';

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
    <header className="w-full bg-card/80 backdrop-blur-xl p-6 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between w-full">
          <BackButton onClick={onBack} className="text-slate-400 hover:text-primary transition-colors" />
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Phase {currentQuestionIndex + 1} <span className="text-slate-800 mx-1">/</span> {totalQuestions}
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold shadow-inner transition-all",
              timeLeft <= 60
                ? 'text-danger border-danger/20 bg-danger/5 shadow-danger/5 animate-pulse'
                : 'text-primary border-primary/20 bg-primary/5 shadow-primary/5'
            )}>
              <Clock className="h-4 w-4" />
              <span className="text-lg tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-8">
          <h1 className="text-xl font-black text-slate-100 tracking-tighter uppercase truncate max-w-md">{quizTitle}</h1>
          <div className="flex-1 max-w-[300px] h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden shadow-inner">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;