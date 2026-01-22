"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardWelcomeProps {
  studentName: string;
  registerNumber: string;
}

const DashboardWelcome = ({ studentName, registerNumber }: DashboardWelcomeProps) => {
  return (
    <Card className="shadow-lg bg-blue-600 text-white border-blue-700">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Welcome back, {studentName}!</h2>
        <p className="text-base sm:text-lg font-medium mt-1 opacity-90 hidden sm:block">Register Number: {registerNumber}</p>
        <p className="text-sm mt-2 opacity-80">Track your progress and continue learning.</p>
      </CardContent>
    </Card>
  );
};

export default DashboardWelcome;