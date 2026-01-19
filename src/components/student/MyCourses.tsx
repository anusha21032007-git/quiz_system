"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ArrowRight, Search, Image, ChevronDown, ChevronUp, FileText, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Course {
  id: string;
  name: string;
  progress: number; // 0 to 100
}

interface MyCoursesProps {
  courses: Course[];
  quizzes: any[]; // Receive full quiz list
}

const MyCourses = ({ courses, quizzes }: MyCoursesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourseName, setExpandedCourseName] = useState<string | null>(null);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (courseName: string) => {
    if (expandedCourseName === courseName) {
      setExpandedCourseName(null);
    } else {
      setExpandedCourseName(courseName);
    }
  };

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
              const isExpanded = expandedCourseName === course.name;

              // Find quizzes for this course
              const courseQuizzes = quizzes.filter(q => q.courseName === course.name);

              return (
                <Card key={course.id} className={cn("p-0 border shadow-sm transition-all overflow-hidden", isExpanded && "ring-2 ring-blue-100")}>
                  <div className="flex flex-col">
                    <div className="flex cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(course.name)}>
                      {/* Course Image Placeholder */}
                      <div className="w-20 bg-gray-100 flex items-center justify-center flex-shrink-0">
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

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{courseQuizzes.length} Exam Paper{courseQuizzes.length !== 1 && 's'}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Quiz List */}
                    {isExpanded && (
                      <div className="bg-gray-50/50 border-t p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <h5 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                          <FileText className="h-4 w-4" /> Exam Papers
                        </h5>
                        {courseQuizzes.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No exams available yet.</p>
                        ) : (
                          courseQuizzes.map(quiz => (
                            <div key={quiz.id} className="flex items-center justify-between bg-white p-3 rounded-md border text-sm hover:shadow-sm">
                              <span className="font-medium text-gray-800">{quiz.title}</span>
                              <Link to={`/quiz/${quiz.id}`}>
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                                  Start <PlayCircle className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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