"use client";

import {
    BookOpen,
    PlusCircle,
    Search,
    Layers,
    MoreVertical,
    GraduationCap,
    Edit2,
    Trash2,
    X,
    Check,
    Filter,
    Plus
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useQuiz } from '@/context/QuizContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import React, { useState, useMemo } from 'react';

const CoursesList = () => {
    const { availableCourses, addCourse, editCourse, deleteCourse, quizzes } = useQuiz();
    const [newCourseName, setNewCourseName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        setIsDialogOpen(false);
        toast.success("Disciplinary record indexed successfully");
    };

    const getCourseStatus = (course: string) => {
        const hasQuizzes = quizzes.some(q => q.courseName === course && q.status !== 'DELETED');
        if (hasQuizzes) return 'Operational';
        return 'Draft';
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
        toast.success("Record updated");
    };

    const handleDeleteCourse = (course: string) => {
        if (window.confirm(`Are you sure you want to purge "${course}"? This action is irreversible.`)) {
            deleteCourse(course);
            toast.error("Record purged from repository");
        }
    };

    const filteredCourses = useMemo(() => {
        return availableCourses.filter(course =>
            course.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableCourses, searchQuery]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="bg-card p-10 rounded-[40px] border border-slate-800 shadow-2xl shadow-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all duration-1000" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/5 group-hover:scale-105 transition-all duration-500">
                            <GraduationCap className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-50 tracking-tighter uppercase leading-none mb-2">
                                Curriculum Repository
                            </h2>
                            <p className="text-slate-500 font-bold italic tracking-tight text-sm">Register and manage academic disciplines within the simulation environment.</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center gap-3">
                                <Plus className="h-5 w-5" />
                                Index Course
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <PlusCircle className="h-6 w-6 text-primary" />
                                    New Discipline
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold italic pt-2">
                                    Register a new academic domain for simulation training.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6">
                                <Input
                                    placeholder="e.g. Theoretical Physics v.4"
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    className="h-14 bg-slate-950 border-slate-800 rounded-2xl text-lg font-bold placeholder-slate-700 focus:border-primary transition-all shadow-inner"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter className="gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-12 px-6 hover:bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddCourse}
                                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                >
                                    Register Entry
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-[0.3em] flex items-center gap-4">
                        <Layers className="h-5 w-5 text-primary" />
                        Disciplines
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black py-1 px-3 rounded-lg text-[10px]">
                            {availableCourses.length} TOTAL
                        </Badge>
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Filter library repository..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-slate-900/50 border-slate-800 rounded-2xl text-xs font-bold text-slate-300 placeholder-slate-700 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Records List */}
            <div className="flex flex-col gap-4">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, idx) => {
                        const isEditing = editingCourse === course;
                        const status = getCourseStatus(course);

                        return (
                            <div key={idx} className={cn(
                                "group bg-card rounded-[32px] border border-slate-800 shadow-sm transition-all duration-500 relative overflow-hidden",
                                isEditing ? "p-10 border-primary bg-primary/5 shadow-2xl shadow-primary/10" : "p-8 hover:border-slate-700 hover:bg-slate-900/40 hover:shadow-xl"
                            )}>
                                {isEditing ? (
                                    <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center shrink-0">
                                                <Edit2 className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-100 uppercase tracking-[0.2em] text-xs">Modify Disciplinary Title</h4>
                                                <p className="text-slate-500 text-[10px] font-bold italic tracking-widest uppercase mt-1 px-1">Simulation Record: #{idx + 1}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="h-16 bg-slate-950 border-slate-800 rounded-2xl text-2xl font-black text-slate-100 focus:border-primary transition-all shadow-inner px-8"
                                                autoFocus
                                            />
                                            <div className="flex gap-3 shrink-0">
                                                <Button
                                                    onClick={handleSaveEdit}
                                                    className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                                >
                                                    <Check className="h-5 w-5 mr-3" /> Commit Changes
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setEditingCourse(null)}
                                                    className="h-16 px-8 hover:bg-slate-800 text-slate-500 rounded-[20px] font-black uppercase tracking-widest text-xs"
                                                >
                                                    <X className="h-5 w-5 mr-3" /> Abort
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-10">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-slate-600 font-black text-xs border border-slate-800 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shadow-inner shrink-0 tracking-widest">
                                                ID: {String(idx + 1).padStart(2, '0')}
                                            </div>

                                            <div className="w-20 h-20 bg-primary/5 border border-primary/10 rounded-[24px] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 group-hover:rotate-6">
                                                <BookOpen className="h-10 w-10 text-primary shadow-2xl shadow-primary/20" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <h4 className="text-3xl font-black text-slate-50 group-hover:text-primary transition-colors tracking-tighter uppercase leading-none">
                                                        {course}
                                                    </h4>
                                                    <Badge className={cn(
                                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                        status === 'Operational' ? "bg-success/10 text-success border-success/20" : "bg-slate-800 text-slate-500 border-slate-700"
                                                    )}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex -space-x-3">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-8 h-8 bg-slate-900 border-2 border-slate-950 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 shadow-xl group-hover:border-primary/20 transition-all">
                                                                {String.fromCharCode(64 + i)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-slate-400 transition-colors">
                                                        Simulation Access: <span className="text-slate-200">Authorized Faculty</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-14 w-14 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-300">
                                                        <MoreVertical className="h-6 w-6" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-[24px] p-3 bg-slate-900 border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
                                                    <DropdownMenuItem
                                                        onClick={() => handleStartEdit(course)}
                                                        className="gap-4 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] p-4 rounded-xl focus:bg-primary/10 focus:text-primary mb-1 cursor-pointer transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Edit Metadata
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteCourse(course)}
                                                        className="gap-4 font-black text-danger/70 text-[10px] uppercase tracking-[0.2em] p-4 rounded-xl focus:bg-danger/10 focus:text-danger cursor-pointer transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> De-index Entry
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-40 bg-card rounded-[48px] border border-slate-800 shadow-2xl shadow-primary/5 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="w-28 h-28 bg-slate-900 border border-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-inner group-hover:border-primary/30 group-hover:rotate-12 transition-all duration-500">
                            <GraduationCap className="h-14 w-14 text-slate-700 group-hover:text-primary transition-all duration-500" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-100 mb-4 uppercase tracking-tighter relative z-10">
                            {searchQuery ? "Repository Search Null" : "Archive Vacant"}
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-bold italic tracking-tight relative z-10 text-lg">
                            {searchQuery ? "The system could not locate any matching disciplinary dossiers." : "No academic domains have been indexed into the central repository system."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;

