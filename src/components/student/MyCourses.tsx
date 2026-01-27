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
    <Card className="bg-card border border-slate-800 shadow-2xl shadow-primary/5 rounded-[40px] overflow-hidden">
      <CardHeader className="bg-slate-950/20 px-10 py-8 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <CardTitle className="flex items-center gap-4 text-2xl font-black text-slate-50 uppercase tracking-tighter">
                <BookOpen className="h-7 w-7 text-primary" /> Active Disciplinary Tracks
            </CardTitle>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Filter curriculum..."
                    className="pl-10 h-10 bg-slate-900/50 border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:border-primary transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-10">

        {filteredCourses.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <BookOpen className="h-10 w-10 text-slate-700" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">
              {searchTerm ? `No simulation tracks matching "${searchTerm}".` : "No active disciplines indexed yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {filteredCourses.map((course) => {
              const status = course.progress === 100 ? 'QUALIFIED' : 'ACTIVE';
              const isExpanded = expandedCourseName === course.name;

              // Find quizzes for this course
              const courseQuizzes = quizzes.filter(q => q.courseName === course.name);

              return (
                <Card key={course.id} className={cn(
                    "p-0 border shadow-xl transition-all duration-300 overflow-hidden rounded-[24px] bg-slate-950/30", 
                    isExpanded ? "border-primary bg-primary/[0.02] shadow-primary/10" : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                )}>
                  <div className="flex flex-col">
                    <div className="flex cursor-pointer transition-all" onClick={() => toggleExpand(course.name)}>
                      {/* Course Identity Placeholder */}
                      <div className={cn(
                          "w-24 flex items-center justify-center flex-shrink-0 border-r transition-all",
                          isExpanded ? "bg-primary border-primary/20" : "bg-slate-900 border-slate-800 group-hover:bg-slate-800"
                      )}>
                        <Image className={cn("h-10 w-10 transition-colors", isExpanded ? "text-white" : "text-slate-700")} />
                      </div>

                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className={cn("font-black text-xl uppercase tracking-tighter truncate leading-none", isExpanded ? "text-slate-50" : "text-slate-200")}>{course.name}</h4>
                          <Badge className={cn(
                              "font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border",
                              course.progress === 100 
                                ? "bg-success/10 text-success border-success/20 shadow-sm" 
                                : "bg-primary/10 text-primary border-primary/20 shadow-sm"
                          )}>
                            {status}
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-slate-500">Track Progress</span>
                            <span className={cn(course.progress === 100 ? 'text-success' : 'text-primary')}>
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                            <div 
                                className={cn("h-full transition-all duration-1000", course.progress === 100 ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]')} 
                                style={{ width: `${course.progress}%` }} 
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          <span className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            {courseQuizzes.length} Simulation Unit{courseQuizzes.length !== 1 && 's'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Quiz List */}
                    {isExpanded && (
                      <div className="bg-slate-950/50 border-t border-primary/20 p-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <h5 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" /> Core Simulation Units
                        </h5>
                        {courseQuizzes.length === 0 ? (
                          <p className="text-[11px] text-slate-600 italic font-bold uppercase tracking-widest text-center py-4 bg-slate-900/50 rounded-xl border border-slate-800">No active units deployed.</p>
                        ) : (
                          <div className="space-y-3">
                            {courseQuizzes.map(quiz => (
                              <div key={quiz.id} className="flex items-center justify-between bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-primary/30 hover:bg-slate-800 transition-all group/unit shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 group-hover/unit:border-primary/20 shadow-inner">
                                        <FileText className="h-4 w-4 text-slate-600 group-hover/unit:text-primary transition-colors" />
                                    </div>
                                    <span className="font-bold text-sm text-slate-100 uppercase tracking-tight">{quiz.title}</span>
                                </div>
                                <Link to={`/quiz/${quiz.id}`}>
                                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                    Initiate <PlayCircle className="h-3 w-3 ml-2" />
                                  </Button>
                                </Link>
                              </div>
                            ))}
                          </div>
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