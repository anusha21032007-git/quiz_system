"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StudentDashboard = () => {
  const [studentName, setStudentName] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/leaderboard" className="text-blue-600 hover:underline">Leaderboard</Link>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Label htmlFor="studentName" className="text-xl font-semibold">Your Name</Label>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              id="studentName"
              placeholder="Enter your name (e.g., John Doe)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-2 p-3 text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">This name will be used for the leaderboard.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;