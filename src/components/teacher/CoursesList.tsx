"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CoursesList = () => {
    // This is a placeholder component for the Courses view.
    // In a real application, this would fetch and display data from an API or context.

    const mockCourses = [
        { id: 1, name: 'Computer Science 101', code: 'CS101', students: 45 },
        { id: 2, name: 'Advanced Mathematics', code: 'MATH302', students: 30 },
        { id: 3, name: 'World History', code: 'HIST110', students: 55 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Courses Management</h2>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add New Course
                </Button>
            </div>

            <Card className="shadow-lg border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        Active Courses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Students Enrolled</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mockCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{course.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded text-gray-600">
                                                {course.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {course.students}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium">
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CoursesList;
