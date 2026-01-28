"use client";

import React, { useState, useEffect } from 'react';
import TeacherLayout from '@/components/layout/TeacherLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, PlusCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Course {
    id: string;
    name: string;
    createdDate: string;
}

const CoursesPage = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourseName, setNewCourseName] = useState('');
    const [error, setError] = useState('');

    // Load courses from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('teacher_courses');
        if (stored) {
            try {
                setCourses(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored courses", e);
            }
        } else {
            // Pre-fill with sample courses if none exist
            const samples: Course[] = [
                { id: 'c1', name: 'Python', createdDate: new Date().toLocaleDateString() },
                { id: 'c2', name: 'Programming in C', createdDate: new Date().toLocaleDateString() },
                { id: 'c3', name: 'Network Essentials', createdDate: new Date().toLocaleDateString() },
                { id: 'c4', name: 'Fundamentals of Cyber Security', createdDate: new Date().toLocaleDateString() },
            ];
            setCourses(samples);
            localStorage.setItem('teacher_courses', JSON.stringify(samples));
        }
    }, []);

    // Save to localStorage whenever courses change
    useEffect(() => {
        if (courses.length > 0) {
            localStorage.setItem('teacher_courses', JSON.stringify(courses));
        }
    }, [courses]);

    const handleAddCourse = () => {
        if (!newCourseName.trim()) {
            setError('Please enter a course name');
            return;
        }

        const newCourse: Course = {
            id: `course-${Date.now()}`,
            name: newCourseName.trim(),
            createdDate: new Date().toLocaleDateString(),
        };

        setCourses(prev => [newCourse, ...prev]);
        setNewCourseName('');
        setError('');
        toast.success(`Course "${newCourse.name}" added successfully!`);
    };

    return (
        <TeacherLayout activeView="courses" title="Courses Management">
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Add Course Section */}
                <Card className="shadow-2xl border-slate-800 bg-card overflow-hidden rounded-[32px]">
                    <CardHeader className="bg-slate-950/20 px-8 py-6 border-b border-slate-800">
                        <CardTitle className="text-xl font-black text-slate-100 flex items-center gap-3 uppercase tracking-tight">
                            <PlusCircle className="h-6 w-6 text-primary" />
                            Add Course
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="courseName" className="text-xs font-black text-slate-300 uppercase tracking-widest pl-1">Course Name</Label>
                            <div className="flex gap-4">
                                <Input
                                    id="courseName"
                                    placeholder="e.g., Data Structures and Algorithms"
                                    value={newCourseName}
                                    onChange={(e) => {
                                        setNewCourseName(e.target.value);
                                        if (e.target.value.trim()) setError('');
                                    }}
                                    className={cn("flex-1 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all", error && "border-danger focus-visible:ring-danger/20")}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                                />
                                <Button onClick={handleAddCourse} className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                                    Add Course
                                </Button>
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Courses List Section */}
                <Card className="shadow-2xl border-slate-800 bg-card overflow-hidden rounded-[32px]">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-950/20 px-8 py-6 border-b border-slate-800">
                        <CardTitle className="text-xl font-black text-slate-100 flex items-center gap-3 uppercase tracking-tight">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Course List
                        </CardTitle>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                            {courses.length} Courses Total
                        </span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-900/50 hover:bg-slate-900/50 border-slate-800">
                                        <TableHead className="font-bold py-4 text-slate-400 uppercase tracking-widest text-[10px] pl-8">Course Name</TableHead>
                                        <TableHead className="font-bold py-4 w-[200px] text-slate-400 uppercase tracking-widest text-[10px] pr-8">Created Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.length > 0 ? (
                                        courses.map((course) => (
                                            <TableRow key={course.id} className="hover:bg-slate-900/30 transition-colors border-slate-800/50 group">
                                                <TableCell className="font-bold text-slate-100 py-5 pl-8">{course.name}</TableCell>
                                                <TableCell className="text-slate-400 py-5 font-mono text-xs pr-8">{course.createdDate}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                                No courses found. Add your first course above.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TeacherLayout>
    );
};

export default CoursesPage;
