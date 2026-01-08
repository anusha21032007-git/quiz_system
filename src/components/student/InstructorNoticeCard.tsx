"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Megaphone, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // FIX: Import cn

// Mock data for the latest notice
const MOCK_NOTICE = {
  id: 1,
  date: '2024-10-27',
  message: 'Attention: The time limit for the upcoming Math 202 quiz has been extended by 10 minutes. Please check the updated schedule.',
  type: 'update', // 'alert', 'info', 'update'
};

const InstructorNoticeCard = () => {
  let icon = Megaphone;
  let color = 'border-blue-400 bg-blue-50 text-blue-800';

  if (MOCK_NOTICE.type === 'alert') {
    icon = AlertTriangle;
    color = 'border-red-400 bg-red-50 text-red-800';
  } else if (MOCK_NOTICE.type === 'update') {
    icon = Clock;
    color = 'border-yellow-400 bg-yellow-50 text-yellow-800';
  }

  const IconComponent = icon;

  return (
    <Card className={cn("shadow-md border-l-4", color)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <IconComponent className="h-5 w-5" />
          Instructor Notice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{MOCK_NOTICE.message}</p>
        <p className="text-xs mt-2 opacity-70">Posted: {new Date(MOCK_NOTICE.date).toLocaleDateString()}</p>
      </CardContent>
    </Card>
  );
};

export default InstructorNoticeCard;