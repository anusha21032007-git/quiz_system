import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, FolderOpen, PlusCircle } from 'lucide-react';
import { useQuiz } from '@/context/QuizContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CoursesList = () => {
    const { availableCourses, addCourse } = useQuiz();
    const [newCourseName, setNewCourseName] = useState('');
    const [error, setError] = useState('');

    const handleAddCourse = () => {
        setError('');
        const trimmedName = newCourseName.trim();

        if (!trimmedName) {
            setError("Course name cannot be empty");
            return;
        }

        // Check for duplicate (case-insensitive)
        const isDuplicate = availableCourses.some(
            course => course.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            setError("Course already exists");
            return;
        }

        // Context handles duplicate checks too, but we did it above for the error message
        addCourse(trimmedName);
        setNewCourseName('');
        toast.success("Course added successfully");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Courses Management</h2>
            </div>

            {/* Add New Course Section */}
            <Card className="shadow-sm border-blue-100 bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                        <PlusCircle className="h-5 w-5 text-blue-600" />
                        Add New Course
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2 max-w-2xl">
                        <div className="flex gap-4 items-center">
                            <Input
                                placeholder="Enter course name (e.g. Physics 101)"
                                value={newCourseName}
                                onChange={(e) => {
                                    setNewCourseName(e.target.value);
                                    if (error) setError('');
                                }}
                                className={`h-11 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                            />
                            <Button
                                onClick={handleAddCourse}
                                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-bold"
                            >
                                Add Course
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {availableCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <FolderOpen className="h-10 w-10 text-gray-300" />
                                                <p>No courses added yet.</p>
                                                <p className="text-sm">Create a quiz to add a new course.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    availableCourses.map((course, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-base font-semibold text-gray-900">{course}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default CoursesList;
