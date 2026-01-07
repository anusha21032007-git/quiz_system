"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  progress: number; // 0 to 100
}

interface MyCoursesProps {
  courses: Course[];
}

const MyCourses = ({ courses }: MyCoursesProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BookOpen className="h-6 w-6 text-green-600" /> My Active Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-gray-500">No active courses assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-4 border shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg">{course.name}</h4>
                  <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2 mb-3" />
                <Button variant="outline" className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50">
                  Continue Learning <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyCourses;