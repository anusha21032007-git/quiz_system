"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardWelcomeProps {
  studentName: string;
  registerNumber: string;
}

const DashboardWelcome = ({ studentName, registerNumber }: DashboardWelcomeProps) => {
  return (
    <Card className="glass-card p-10 relative overflow-hidden group border-white/60 shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />
      <CardContent className="p-0 relative z-10">
        <h2 className="text-3xl sm:text-5xl font-black text-[#1E2455] tracking-tighter uppercase leading-none mb-4">Welcome back, {studentName}!</h2>
        <p className="text-lg sm:text-2xl font-black text-[#7A80B8] opacity-70 tracking-tight hidden sm:block">Register Number: {registerNumber}</p>
        <p className="text-base mt-2 text-[#3A3F6B] font-bold italic opacity-60">Track your progress and continue learning.</p>
      </CardContent>
    </Card>
  );
};

export default DashboardWelcome;