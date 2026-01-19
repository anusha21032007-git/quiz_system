"use client";

import React, { useState } from 'react';
import {
    BookOpen,
    PlusCircle,
    Search,
    Layers,
    MoreVertical,
    GraduationCap
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Edit2,
    Trash2,
    X,
    Check
} from 'lucide-react';
import { useQuiz } from '@/context/QuizContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CoursesList = () => {
    const { availableCourses, addCourse, editCourse, deleteCourse } = useQuiz();
    const [newCourseName, setNewCourseName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingCourse, setEditingCourse] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAddCourse = () => {
        const trimmedName = newCourseName.trim();
        if (!trimmedName) {
            toast.error("Course name cannot be empty");
            return;
        }

        const isDuplicate = availableCourses.some(
            course => course.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            toast.error("Course already exists");
            return;
        }

        addCourse(trimmedName);
        setNewCourseName('');
        toast.success("Course added successfully");
    };

    const handleStartEdit = (course: string) => {
        setEditingCourse(course);
        setEditingName(course);
    };

    const handleSaveEdit = () => {
        const trimmed = editingName.trim();
        if (!trimmed) {
            toast.error("Course name cannot be empty");
            return;
        }
        if (trimmed === editingCourse) {
            setEditingCourse(null);
            return;
        }
        if (availableCourses.includes(trimmed) && trimmed !== editingCourse) {
            toast.error("A course with this name already exists");
            return;
        }

        editCourse(editingCourse!, trimmed);
        setEditingCourse(null);
    };

    const handleDeleteCourse = (course: string) => {
        if (window.confirm(`Are you sure you want to delete "${course}"? This will remove it from future quiz assignments.`)) {
            deleteCourse(course);
        }
    };

    const filteredCourses = availableCourses.filter(course =>
        course.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header section with Add Course */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Course Management
                        </h2>
                        <p className="text-slate-500 mt-1 font-medium">Add and manage your academic courses efficiently.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
                    <div className="relative flex-1">
                        <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                        <Input
                            placeholder="Enter new course name (e.g. Advanced Cybersecurity)"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                            className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-lg focus-visible:ring-indigo-500/20 focus-visible:ring-2"
                        />
                    </div>
                    <Button
                        onClick={handleAddCourse}
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
                    >
                        Add Course
                    </Button>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <Layers className="h-6 w-6 text-indigo-500" />
                        Available Courses
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                            {availableCourses.length}
                        </span>
                    </h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Filter courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course, idx) => (
                            <div key={idx} className={cn(
                                "group bg-white rounded-2xl border border-slate-100 shadow-sm transition-all relative overflow-hidden",
                                editingCourse === course ? "p-6 ring-2 ring-indigo-500 shadow-xl shadow-indigo-100" : "p-4 hover:shadow-md"
                            )}>
                                {editingCourse === course ? (
                                    <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Edit2 className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-700">Edit Course Name</h4>
                                        </div>
                                        <div className="flex gap-3">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="h-12 bg-slate-50 border-none rounded-xl text-lg font-bold text-slate-900"
                                                autoFocus
                                            />
                                            <Button
                                                onClick={handleSaveEdit}
                                                className="h-12 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                                            >
                                                <Check className="h-5 w-5 mr-1" /> Save
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setEditingCourse(null)}
                                                className="h-12 px-4 hover:bg-slate-100 rounded-xl text-slate-500"
                                            >
                                                <X className="h-5 w-5 mr-1" /> Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 font-bold text-xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <BookOpen className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {course}
                                                    </h4>
                                                    <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                                                        Active
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-1.5">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-5 h-5 bg-slate-100 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-slate-400">
                                                                {String.fromCharCode(64 + i)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-400">3 instructors assigned</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600 transition-colors">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-xl border-slate-100">
                                                    <DropdownMenuItem
                                                        onClick={() => handleStartEdit(course)}
                                                        className="gap-2 font-bold text-slate-600 text-xs uppercase tracking-widest focus:bg-indigo-50 focus:text-indigo-600"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteCourse(course)}
                                                        className="gap-2 font-bold text-rose-500 text-xs uppercase tracking-widest focus:bg-rose-50 focus:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <GraduationCap className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {searchQuery ? "No matching courses found" : "No courses available"}
                            </h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {searchQuery ? "Try adjusting your search terms." : "Add your first course to start managing your academic curriculum."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursesList;

