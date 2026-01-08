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
                <Card className="shadow-lg border-blue-100 bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <PlusCircle className="h-6 w-6 text-blue-600" />
                            Add Course
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="courseName" className="text-sm font-semibold text-gray-700">Course Name</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="courseName"
                                    placeholder="e.g., Data Structures and Algorithms"
                                    value={newCourseName}
                                    onChange={(e) => {
                                        setNewCourseName(e.target.value);
                                        if (e.target.value.trim()) setError('');
                                    }}
                                    className={cn("flex-1", error && "border-red-500 focus-visible:ring-red-500")}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                                />
                                <Button onClick={handleAddCourse} className="bg-blue-600 hover:bg-blue-700">
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
                <Card className="shadow-lg border-gray-100 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                            Course List
                        </CardTitle>
                        <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border">
                            {courses.length} Courses Total
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="font-bold py-4 text-gray-700">Course Name</TableHead>
                                        <TableHead className="font-bold py-4 w-[200px] text-gray-700">Created Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.length > 0 ? (
                                        courses.map((course) => (
                                            <TableRow key={course.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <TableCell className="font-medium text-gray-900 py-4">{course.name}</TableCell>
                                                <TableCell className="text-gray-500 py-4">{course.createdDate}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-12 text-gray-400">
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
