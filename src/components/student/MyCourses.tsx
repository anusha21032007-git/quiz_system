"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ArrowRight, Search, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  name: string;
  progress: number; // 0 to 100
}

interface MyCoursesProps {
  courses: Course[];
}

const MyCourses = ({ courses }: MyCoursesProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BookOpen className="h-6 w-6 text-green-600" /> My Active Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <p className="text-gray-500 text-center p-4">
            {searchTerm ? `No courses found matching "${searchTerm}".` : "No active courses assigned yet."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {filteredCourses.map((course) => {
              const status = course.progress === 100 ? 'Completed' : 'In Progress';
              const statusVariant = course.progress === 100 ? 'default' : 'secondary';

              return (
                <Card key={course.id} className="p-0 border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex">
                    {/* Course Image Placeholder */}
                    <div className="w-20 h-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                    
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg truncate">{course.name}</h4>
                        <Badge variant={statusVariant} className="ml-2 flex-shrink-0">{status}</Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className={cn(course.progress === 100 ? 'text-green-600' : 'text-blue-600', 'font-medium')}>
                            {course.progress}%
                          </span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <Button variant="outline" className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50">
                        Continue Learning <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyCourses;