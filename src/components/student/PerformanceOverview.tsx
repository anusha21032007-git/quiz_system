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
      <Card className="bg-card border-slate-800 shadow-2xl shadow-primary/5 rounded-[32px] overflow-hidden">
        <CardHeader className="bg-slate-950/20 px-8 py-6 border-b border-slate-800">
          <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-100 uppercase tracking-tight">
            <TrendingUp className="h-5 w-5 text-primary" /> Performance Log <span className="text-[10px] text-slate-500 font-bold ml-1">(LATEST 5)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-8 overflow-hidden">
          {scoreTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  fontSize={10}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 'dataMax']}
                  stroke="#475569"
                  fontSize={10}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#f8fafc', fontWeight: 'bold' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={4}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#020617' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Score Achieved"
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] pt-20 italic">Insufficient simulation data.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-slate-800 shadow-2xl shadow-primary/5 rounded-[32px] overflow-hidden">
        <CardHeader className="bg-slate-950/20 px-8 py-6 border-b border-slate-800">
          <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-100 uppercase tracking-tight">
            <Target className="h-5 w-5 text-success" /> Disciplinary Accuracy <span className="text-[10px] text-slate-500 font-bold ml-1">(PER COURSE)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-8 overflow-hidden">
          {accuracyByCourseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyByCourseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="course"
                  stroke="#475569"
                  fontSize={10}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke="#475569"
                  fontSize={10}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="accuracy"
                  fill="#22c55e"
                  radius={[10, 10, 0, 0]}
                  name="Accuracy (%)"
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] pt-20 italic">No course aptitude data detected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;