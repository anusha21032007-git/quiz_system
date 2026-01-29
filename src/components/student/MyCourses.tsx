"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ArrowRight, Search, Image, ChevronDown, ChevronUp, FileText, PlayCircle, Brain } from 'lucide-react';
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
    <Card className="glass-card border-white/60 shadow-2xl overflow-hidden mb-12 relative font-poppins">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6C8BFF]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <CardHeader className="bg-white/40 px-10 py-12 border-b border-white/60 backdrop-blur-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <CardTitle className="flex items-center gap-6 text-4xl font-black text-[#1E2455] uppercase tracking-tighter leading-none">
            <div className="w-20 h-20 bg-white/60 border border-white rounded-[28px] flex items-center justify-center shadow-xl group hover:scale-105 transition-all duration-700">
              <BookOpen className="h-10 w-10 text-[#6C8BFF]" />
            </div>
            Academic Disciplinary Tracks
          </CardTitle>
          <div className="relative w-full md:w-[450px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A80B8] transition-colors group-focus-within:text-[#6C8BFF]" />
            <Input
              placeholder="Filter curriculum repository..."
              className="glass-input pl-16 h-16 text-base font-black text-[#1E2455] placeholder-[#7A80B8]/40 focus:bg-white/80 transition-all border-white/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-10">

        {filteredCourses.length === 0 ? (
          <div className="py-32 text-center relative">
            <div className="w-32 h-32 bg-white/40 border border-white/60 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-glass animate-float">
              <BookOpen className="h-12 w-12 text-[#7A80B8]/40" />
            </div>
            <p className="text-[#3A3F6B] font-black uppercase tracking-[0.4em] text-[10px] italic opacity-60">
              {searchTerm ? `No simulation tracks matching indexed query.` : "No academic disciplines currently indexed."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
            {filteredCourses.map((course, idx) => {
              const status = course.progress === 100 ? 'QUALIFIED' : 'ACTIVE';
              const isExpanded = expandedCourseName === course.name;

              // Find quizzes for this course
              const courseQuizzes = quizzes.filter(q => q.courseName === course.name);

              return (
                <Card key={course.id} className={cn(
                  "p-0 border shadow-xl transition-all duration-700 overflow-hidden rounded-[40px] glass-card group/card relative",
                  isExpanded ? "border-[#6C8BFF]/60 bg-white/80 shadow-glass-hover -translate-y-1" : "border-white/40 hover:border-white/70 hover:bg-white/40 hover:-translate-y-1"
                )}>
                  {/* Progress Glow Accent */}
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] transition-all duration-1000 blur-[2px] opacity-0 group-hover/card:opacity-100"
                    style={{ width: `${course.progress}%` }}
                  />

                  <div className="flex flex-col">
                    <div className="flex cursor-pointer transition-all" onClick={() => toggleExpand(course.name)}>

                      <div className={cn(
                        "w-28 flex items-center justify-center flex-shrink-0 border-r border-white/40 transition-all duration-700 p-6",
                        isExpanded ? "bg-[#6C8BFF]/5" : "bg-white/20 group-hover/card:bg-white/40"
                      )}>
                        <div className="w-full h-full bg-white/50 border border-white/80 rounded-3xl flex items-center justify-center shadow-sm group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-700 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF]/10 to-[#E38AD6]/10 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          <Image className={cn("h-10 w-10 relative z-10 transition-colors duration-700", isExpanded ? "text-[#6C8BFF]" : "text-[#7A80B8]")} />
                        </div>
                      </div>

                      <div className="p-8 flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                          <h4 className="font-black text-2xl text-[#1E2455] uppercase tracking-tighter truncate leading-none group-hover/card:text-[#6C8BFF] transition-colors">{course.name}</h4>
                          <Badge className={cn(
                            "font-black text-[9px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border shadow-sm",
                            course.progress === 100
                              ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 shadow-[#4EE3B2]/5"
                              : "bg-[#6C8BFF]/10 text-[#6C8BFF] border-[#6C8BFF]/20 shadow-[#6C8BFF]/5"
                          )}>
                            {status}
                          </Badge>
                        </div>

                        <div className="mb-0">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                            <span className="text-[#7A80B8]/60">Discipline Progress</span>
                            <span className={cn("transition-colors", course.progress === 100 ? 'text-[#4EE3B2]' : 'text-[#6C8BFF]')}>
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/40 rounded-full border border-white/60 overflow-hidden shadow-inner flex items-center px-0.5">
                            <div
                              className={cn(
                                "h-1 rounded-full transition-all duration-1000 shadow-sm",
                                course.progress === 100 ? 'bg-[#4EE3B2]' : 'bg-[#6C8BFF]'
                              )}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-[#7A80B8] mt-6 bg-white/20 px-4 py-2 rounded-xl border border-white/60">
                          <span className="flex items-center gap-3">
                            <FileText className="h-3.5 w-3.5 text-[#6C8BFF]" />
                            {courseQuizzes.length} Simulation units
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-[#6C8BFF] animate-bounce" /> : <ChevronDown className="h-4 w-4 group-hover/card:translate-y-0.5 transition-transform" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Quiz List */}
                    {isExpanded && (
                      <div className="bg-white/40 border-t border-white/60 p-10 space-y-6 animate-in slide-in-from-top-6 duration-500 rounded-b-[40px]">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-2 h-2 bg-[#6C8BFF] rounded-full" />
                          <h5 className="font-black text-[10px] uppercase tracking-[0.5em] text-[#7A80B8] opacity-80">
                            Active Simulation Sequence
                          </h5>
                        </div>
                        {courseQuizzes.length === 0 ? (
                          <div className="text-[11px] text-[#7A80B8] font-black uppercase tracking-[0.3em] text-center py-10 bg-white/40 border border-dashed border-white/60 rounded-[28px] italic">
                            No active units deployed.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {courseQuizzes.map(quiz => (
                              <div key={quiz.id} className="flex items-center justify-between bg-white/60 p-6 rounded-[28px] border border-white/60 hover:border-[#6C8BFF]/40 hover:bg-white/80 hover:shadow-glass-hover transition-all duration-500 group/unit">
                                <div className="flex items-center gap-6">
                                  <div className="w-12 h-12 rounded-[18px] bg-white/80 flex items-center justify-center border border-white shadow-sm group-hover/unit:scale-110 transition-all duration-500">
                                    <FileText className="h-5 w-5 text-[#7A80B8]/60 group-hover/unit:text-[#6C8BFF] transition-colors" />
                                  </div>
                                  <span className="font-black text-lg text-[#1E2455] uppercase tracking-tighter truncate leading-none group-hover/unit:text-[#6C8BFF] transition-colors">{quiz.title}</span>
                                </div>
                                <Link to={`/quiz/${quiz.id}`}>
                                  <Button className="pastel-button-primary h-12 px-8 text-[10px] tracking-[0.2em] shadow-lg">
                                    INITIATE <PlayCircle className="h-4 w-4 ml-3" />
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