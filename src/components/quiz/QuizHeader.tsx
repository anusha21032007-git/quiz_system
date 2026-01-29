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
    <header className="w-full bg-white/30 backdrop-blur-2xl p-8 border-b border-white/40 sticky top-0 z-50 shadow-xl">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between w-full">
          <BackButton onClick={onBack} className="text-[#7A80B8] hover:text-[#1E2455] transition-colors" />
          <div className="flex items-center gap-8">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7A80B8] opacity-60">
              PHASE {currentQuestionIndex + 1} <span className="text-[#6C8BFF] mx-1">/</span> {totalQuestions}
            </div>
            <div className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl border font-black shadow-xl transition-all backdrop-blur-md",
              timeLeft <= 60
                ? 'text-[#FF6B8A] border-[#FF6B8A]/30 bg-white/60 animate-pulse'
                : 'text-[#6C8BFF] border-white/60 bg-white/60'
            )}>
              <Clock className="h-5 w-5" />
              <span className="text-xl tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-12">
          <h1 className="text-2xl font-black text-[#1E2455] tracking-tighter uppercase truncate max-w-md font-poppins">{quizTitle}</h1>
          <div className="flex-1 max-w-[400px] h-3 bg-white/40 rounded-full border border-white/60 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;