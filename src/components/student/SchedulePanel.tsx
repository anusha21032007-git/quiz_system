"use client";

import React, { useState, useMemo } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { useQuiz, Quiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, ListChecks, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface SchedulePanelProps {
  studentName: string;
}

// Utility function to combine date and time strings into a Date object
const createDateTime = (dateStr: string, timeStr: string): Date => {
  // Assumes dateStr is YYYY-MM-DD and timeStr is HH:MM
  return new Date(`${dateStr}T${timeStr}:00`);
};

const SchedulePanel = ({ studentName }: SchedulePanelProps) => {
  const { quizzes, quizAttempts } = useQuiz();
  const [currentDate, setCurrentDate] = useState(new Date());

  const formattedDate = format(currentDate, 'EEEE, MMM d');

  const handlePreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const scheduledItems = useMemo(() => {
    const targetDateStr = format(currentDate, 'yyyy-MM-dd');
    const now = new Date();

    return quizzes
      .filter(quiz => quiz.scheduledDate === targetDateStr)
      .map((quiz) => {
        const startTime = createDateTime(quiz.scheduledDate, quiz.startTime);
        const endTime = createDateTime(quiz.scheduledDate, quiz.endTime);

        // Check Completion Status
        const isCompleted = quizAttempts.some(
          (attempt) => attempt.quizId === quiz.id && attempt.studentName === studentName
        );

        let status: 'Upcoming' | 'Live' | 'Completed' | 'Expired';
        let statusColor: string;
        let Icon: React.ElementType;

        if (isCompleted) {
          status = 'Completed';
          statusColor = 'bg-purple-500';
          Icon = CheckCircle;
        } else if (isSameDay(currentDate, now)) {
            if (now >= startTime && now <= endTime) {
                status = 'Live';
                statusColor = 'bg-green-500 animate-pulse';
                Icon = AlertTriangle;
            } else if (now < startTime) {
                status = 'Upcoming';
                statusColor = 'bg-blue-500';
                Icon = Clock;
            } else {
                status = 'Expired';
                statusColor = 'bg-gray-500';
                Icon = XCircle;
            }
        } else if (currentDate < now) {
            status = 'Expired';
            statusColor = 'bg-gray-500';
            Icon = XCircle;
        } else {
            status = 'Upcoming';
            statusColor = 'bg-blue-500';
            Icon = Clock;
        }


        return {
          ...quiz,
          startTime,
          endTime,
          status,
          statusColor,
          Icon,
          isCompleted,
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [quizzes, quizAttempts, studentName, currentDate]);

  return (
    <div className="p-6 h-full flex flex-col">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-indigo-600" /> Schedule
        </CardTitle>
      </CardHeader>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4 p-2 border rounded-lg bg-gray-50">
        <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center flex-1">
          <p className="text-sm font-medium text-gray-600">
            {isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM d')}
          </p>
          <p className="text-lg font-bold text-gray-800">{formattedDate}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {!isSameDay(currentDate, new Date()) && (
        <Button variant="outline" size="sm" onClick={handleToday} className="mb-4 w-full">
            Go to Today
        </Button>
      )}

      {/* Scheduled Items List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {scheduledItems.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            <ListChecks className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No quizzes scheduled for this date.</p>
          </div>
        ) : (
          scheduledItems.map((item) => (
            <Card 
              key={item.id} 
              className={cn(
                "p-3 shadow-md transition-all duration-300",
                item.status === 'Live' && "border-2 border-green-500 ring-2 ring-green-200"
              )}
            >
              <CardContent className="p-0 space-y-1">
                <div className="flex justify-between items-center">
                    <Badge className={cn("text-xs font-semibold", item.statusColor)}>
                        <item.Icon className="h-3 w-3 mr-1" /> {item.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{item.timeLimitMinutes} min</span>
                </div>
                <h4 className="font-semibold text-base truncate">{item.title}</h4>
                <p className="text-xs text-gray-600">Course: {item.courseName}</p>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {format(item.startTime, 'h:mm a')} - {format(item.endTime, 'h:mm a')}
                </p>
                
                {item.status === 'Live' && (
                    <Link to={`/quiz/${item.id}`} className="block mt-2">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                            Start Now
                        </Button>
                    </Link>
                )}
                {item.status === 'Upcoming' && (
                    <Button size="sm" variant="outline" disabled className="w-full mt-2">
                        Starts Soon
                    </Button>
                )}
                {item.status === 'Completed' && (
                    <Link to="/leaderboard" className="block mt-2">
                        <Button size="sm" variant="secondary" className="w-full">
                            View Result
                        </Button>
                    </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulePanel;