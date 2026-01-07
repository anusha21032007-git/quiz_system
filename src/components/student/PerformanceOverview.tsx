"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';
import { QuizAttempt } from '@/context/QuizContext';

interface PerformanceOverviewProps {
  recentAttempts: QuizAttempt[];
}

const PerformanceOverview = ({ recentAttempts }: PerformanceOverviewProps) => {
  // 1. Score Trend Data (Last 5 attempts)
  const scoreTrendData = recentAttempts
    .slice(-5) // Get last 5 attempts
    .map((attempt, index) => ({
      name: `Quiz ${recentAttempts.length - 4 + index}`,
      score: parseFloat(attempt.score.toFixed(1)),
      maxScore: attempt.totalQuestions,
    }))
    .reverse(); // Show most recent last

  // 2. Accuracy by Course (Mocked grouping based on quizId prefix for visualization)
  const courseAccuracyMap = recentAttempts.reduce((acc, attempt) => {
    // Mocking course grouping based on a simple hash of quizId
    const courseKey = attempt.quizId.length % 3;
    let courseName = 'General Studies';
    if (courseKey === 0) courseName = 'Math 101';
    if (courseKey === 1) courseName = 'Physics 202';
    if (courseKey === 2) courseName = 'CS Fundamentals';
    
    if (!acc[courseName]) {
      acc[courseName] = { totalScore: 0, totalMaxScore: 0, count: 0 };
    }
    acc[courseName].totalScore += attempt.score;
    acc[courseName].totalMaxScore += attempt.totalQuestions;
    acc[courseName].count += 1;
    return acc;
  }, {} as Record<string, { totalScore: number, totalMaxScore: number, count: number }>);

  const accuracyByCourseData = Object.keys(courseAccuracyMap).map(courseName => {
    const data = courseAccuracyMap[courseName];
    // Use totalScore / totalQuestions as a proxy for accuracy percentage
    const accuracy = (data.totalScore / data.totalMaxScore) * 100;
    return {
      course: courseName,
      accuracy: parseFloat(accuracy.toFixed(1)),
    };
  }).filter(data => !isNaN(data.accuracy));


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-blue-500" /> Score Trend (Last 5 Quizzes)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {scoreTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#333" />
                <YAxis domain={[0, 'dataMax']} stroke="#333" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Score Achieved" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 pt-10">No recent attempts to display trend.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-green-500" /> Accuracy by Course
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {accuracyByCourseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyByCourseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="course" stroke="#333" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#333" />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="#10b981" radius={[4, 4, 0, 0]} name="Accuracy (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 pt-10">No course data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;