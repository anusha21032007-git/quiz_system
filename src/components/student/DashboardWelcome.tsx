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
      <CardContent className="p-6">
        <h2 className="text-3xl font-bold">Welcome back, {studentName}!</h2>
        <p className="text-lg font-medium mt-1 opacity-90">Register Number: {registerNumber}</p>
        <p className="text-sm mt-3 opacity-80">Track your progress and continue learning.</p>
      </CardContent>
    </Card>
  );
};

export default DashboardWelcome;