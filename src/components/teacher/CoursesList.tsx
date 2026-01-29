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
import { Label } from '@/components/ui/label';

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-poppins">
            {/* Header Section */}
            <div className="glass-card p-10 relative overflow-hidden group border-white/60">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-[#6C8BFF]/10 border border-[#6C8BFF]/20 rounded-[32px] flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-700 p-6">
                            <GraduationCap className="h-full w-full text-[#6C8BFF]" />
                        </div>
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] tracking-tighter uppercase leading-none mb-3">
                                Curriculum Repository
                            </h2>
                            <p className="text-[#3A3F6B] font-bold italic opacity-70 tracking-tight text-base">Register and manage academic disciplines within the simulation environment.</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="pastel-button-primary h-18 px-12 text-[11px] tracking-[0.2em] group">
                                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                                <span className="pt-0.5">INDEX DISCIPLINE</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl animate-in zoom-in-95 duration-300 sm:max-w-md p-10 rounded-[48px]">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black text-[#1E2455] uppercase tracking-tighter flex items-center gap-4">
                                    <div className="p-2 bg-[#6C8BFF]/10 rounded-xl">
                                        <PlusCircle className="h-7 w-7 text-[#6C8BFF]" />
                                    </div>
                                    New Discipline
                                </DialogTitle>
                                <DialogDescription className="text-[#3A3F6B] font-bold italic pt-4 text-base opacity-70">
                                    Register a new academic domain for simulation training.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-10">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A80B8] pl-2 block mb-3">DISCIPLINARY DESIGNATION</Label>
                                <Input
                                    placeholder="e.g. Theoretical Physics v.4"
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    className="glass-input h-16 text-2xl font-black text-[#1E2455] placeholder-[#7A80B8]/40"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter className="gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-14 px-8 hover:bg-[#6C8BFF]/5 text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddCourse}
                                    className="pastel-button-primary h-14 px-10 text-[10px] tracking-[0.2em]"
                                >
                                    REGISTER ENTRY
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-6">
                    <h3 className="text-sm font-black text-[#1E2455] uppercase tracking-[0.4em] flex items-center gap-5">
                        <Layers className="h-6 w-6 text-[#6C8BFF]" />
                        Disciplines
                        <Badge className="bg-[#6C8BFF]/10 border-[#6C8BFF]/20 text-[#6C8BFF] font-black py-2 px-5 rounded-xl text-[10px] tracking-widest shadow-sm">
                            {availableCourses.length} REGISTERED
                        </Badge>
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A80B8] transition-colors group-focus-within:text-[#6C8BFF]" />
                        <Input
                            placeholder="Filter library repository..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-input pl-14 h-14 text-sm font-black text-[#1E2455] placeholder-[#7A80B8]/60 focus:bg-white/50"
                        />
                    </div>
                </div>
            </div>

            {/* Records List */}
            <div className="flex flex-col gap-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, idx) => {
                        const isEditing = editingCourse === course;
                        const status = getCourseStatus(course);

                        return (
                            <div key={idx} className={cn(
                                "group glass-card border-white/40 shadow-sm transition-all duration-700 relative overflow-hidden",
                                isEditing ? "p-12 border-[#6C8BFF]/60 bg-white/60 shadow-glass-hover" : "p-10 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover hover:-translate-y-1"
                            )}>
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

                                {isEditing ? (
                                    <div className="flex flex-col gap-10 animate-in zoom-in-95 duration-500 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-[#6C8BFF]/10 border border-[#6C8BFF]/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                                                <Edit2 className="h-8 w-8 text-[#6C8BFF]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#1E2455] uppercase tracking-[0.3em] text-[10px]">Modify Disciplinary Title</h4>
                                                <p className="text-[#7A80B8] text-[10px] font-black italic tracking-[0.3em] uppercase mt-1.5 opacity-60">Simulation Record: #{idx + 1}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="glass-input h-18 text-3xl font-black text-[#1E2455] focus:bg-white px-10 flex-1"
                                                autoFocus
                                            />
                                            <div className="flex gap-4 shrink-0">
                                                <Button
                                                    onClick={handleSaveEdit}
                                                    className="pastel-button-primary h-18 px-12 text-[10px] tracking-[0.2em]"
                                                >
                                                    <Check className="h-6 w-6 mr-3" /> COMMIT CHANGES
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setEditingCourse(null)}
                                                    className="h-18 px-10 hover:bg-[#FF6B8A]/5 text-[#7A80B8] hover:text-[#FF6B8A] rounded-[24px] font-black uppercase tracking-[0.25em] text-[10px] border border-transparent hover:border-[#FF6B8A]/20 transition-all shadow-sm"
                                                >
                                                    <X className="h-6 w-6 mr-3" /> ABORT
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-between relative z-10 gap-10">
                                        <div className="flex flex-wrap items-center gap-10 flex-1 min-w-0">
                                            <div className="flex items-center justify-center w-14 h-14 rounded-[20px] bg-white/60 text-[#7A80B8] font-black text-xs border border-white shadow-inner group-hover:bg-gradient-to-br group-hover:from-[#6C8BFF] group-hover:to-[#E38AD6] group-hover:text-white group-hover:border-transparent transition-all duration-700 shrink-0 tracking-widest">
                                                ID-{String(idx + 1).padStart(2, '0')}
                                            </div>

                                            <div className="w-24 h-24 bg-white/40 border border-white/60 rounded-[32px] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-white/60 transition-all duration-1000 group-hover:rotate-6 p-6 shadow-sm">
                                                <BookOpen className="h-full w-full text-[#6C8BFF]" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-5 mb-4">
                                                    <h4 className="text-4xl font-black text-[#1E2455] group-hover:text-[#6C8BFF] transition-colors tracking-tighter uppercase leading-none truncate font-poppins">
                                                        {course}
                                                    </h4>
                                                    <Badge className={cn(
                                                        "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm",
                                                        status === 'Operational' ? "bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20 shadow-[#4EE3B2]/5" : "bg-white/40 text-[#7A80B8] border-white/60"
                                                    )}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-8">
                                                    <div className="flex -space-x-4">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-10 h-10 bg-white/80 border-2 border-white rounded-[14px] flex items-center justify-center text-[10px] font-black text-[#7A80B8] shadow-sm group-hover:border-[#6C8BFF]/30 group-hover:scale-110 transition-all duration-500">
                                                                {String.fromCharCode(64 + i)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.4em] group-hover:text-[#1E2455] transition-colors bg-white/40 px-5 py-2 rounded-xl border border-white/60 italic opacity-80">
                                                        ACCESS: <span className="text-[#1E2455] not-italic font-black">AUTHORIZED FACULTY</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-16 w-16 rounded-2xl text-[#7A80B8] hover:text-[#1E2455] hover:bg-white/60 border border-white shadow-sm transition-all duration-500 flex items-center justify-center p-0">
                                                        <MoreVertical className="h-7 w-7" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-72 p-3 glass-card bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl animate-in zoom-in-95 duration-300 rounded-[32px] side-bottom-4">
                                                    <DropdownMenuItem
                                                        onClick={() => handleStartEdit(course)}
                                                        className="gap-5 font-black text-[#7A80B8] hover:text-[#6C8BFF] text-[10px] uppercase tracking-[0.3em] p-5 rounded-2xl focus:bg-[#6C8BFF]/10 focus:text-[#6C8BFF] mb-2 cursor-pointer transition-all"
                                                    >
                                                        <Edit2 className="h-5 w-5" /> Edit Metadata
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteCourse(course)}
                                                        className="gap-5 font-black text-[#FF6B8A]/70 text-[10px] uppercase tracking-[0.3em] p-5 rounded-2xl focus:bg-[#FF6B8A]/10 focus:text-[#FF6B8A] cursor-pointer transition-all"
                                                    >
                                                        <Trash2 className="h-5 w-5" /> Purge Entry
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
                    <div className="py-48 glass-card rounded-[56px] border-white/50 text-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,139,255,0.05)_0%,transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="w-32 h-32 bg-white/40 border border-white/60 rounded-[40px] flex items-center justify-center mx-auto mb-12 shadow-glass group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 p-8">
                            <GraduationCap className="h-full w-full text-[#7A80B8] group-hover:text-[#6C8BFF] transition-all duration-500" />
                        </div>
                        <h3 className="text-4xl font-black text-[#1E2455] mb-6 uppercase tracking-tighter relative z-10">
                            {searchQuery ? "Search Nullified" : "Archive Vacant"}
                        </h3>
                        <p className="text-[#3A3F6B] max-w-md mx-auto font-bold italic opacity-60 tracking-tight relative z-10 text-xl px-10">
                            {searchQuery ? "The system could not locate any matching disciplinary dossiers in the current index." : "No academic domains have been indexed into the central curriculum repository system."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;

