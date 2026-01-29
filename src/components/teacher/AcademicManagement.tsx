
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Calendar,
    Plus,
    Trash2,
    Settings,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const AcademicManagement = () => {
    const { user } = useAuth();
    const userId = user?.id || 'global';
    const [departments, setDepartments] = useState<string[]>([]);
    const [years, setYears] = useState<string[]>([]);
    const [newDept, setNewDept] = useState('');
    const [newYear, setNewYear] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial load from local storage or mock
    useEffect(() => {
        const savedDepts = localStorage.getItem(`academic_departments_${userId}`);
        const savedYears = localStorage.getItem(`academic_years_${userId}`);

        if (savedDepts) setDepartments(JSON.parse(savedDepts));
        else setDepartments(['Computer Science', 'Information Technology', 'Mechanical Engineering']);

        if (savedYears) setYears(JSON.parse(savedYears));
        else setYears(['I Year', 'II Year', 'III Year', 'IV Year']);
    }, [userId]);

    const saveToStorage = (depts: string[], yrList: string[]) => {
        localStorage.setItem(`academic_departments_${userId}`, JSON.stringify(depts));
        localStorage.setItem(`academic_years_${userId}`, JSON.stringify(yrList));
    };

    const addDepartment = () => {
        if (!newDept.trim()) return;
        if (departments.includes(newDept)) {
            toast.error("Department already exists");
            return;
        }
        const updated = [...departments, newDept.trim()];
        setDepartments(updated);
        saveToStorage(updated, years);
        setNewDept('');
        toast.success("Department added");
    };

    const removeDepartment = (dept: string) => {
        const updated = departments.filter(d => d !== dept);
        setDepartments(updated);
        saveToStorage(updated, years);
        toast.info("Department removed");
    };

    const addYear = () => {
        if (!newYear.trim()) return;
        if (years.includes(newYear)) {
            toast.error("Year entry already exists");
            return;
        }
        const updated = [...years, newYear.trim()];
        setYears(updated);
        saveToStorage(departments, updated);
        setNewYear('');
        toast.success("Academic year added");
    };

    const removeYear = (year: string) => {
        const updated = years.filter(y => y !== year);
        setYears(updated);
        saveToStorage(departments, updated);
        toast.info("Year entry removed");
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-poppins pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] tracking-tighter flex items-center gap-5 uppercase">
                        <div className="p-3 bg-[#6C8BFF]/10 rounded-[20px]">
                            <Settings className="h-10 w-10 text-[#6C8BFF]" />
                        </div>
                        Academic Infrastructure
                    </h2>
                    <p className="text-[#3A3F6B] mt-3 font-bold italic opacity-70 text-lg">Define and organize the modular hierarchy of the institution.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Department Management */}
                <Card className="glass-card border-white/60 shadow-2xl rounded-[40px] overflow-hidden">
                    <CardHeader className="bg-white/40 border-b border-white/60 p-8">
                        <CardTitle className="flex items-center gap-4 text-2xl font-black text-[#1E2455] uppercase tracking-tighter">
                            <Building2 className="h-7 w-7 text-[#6C8BFF]" />
                            Department Modules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex gap-4">
                            <Input
                                placeholder="New Department (e.g. Civil Engineering)"
                                className="glass-input h-14 font-bold text-[#1E2455]"
                                value={newDept}
                                onChange={(e) => setNewDept(e.target.value)}
                            />
                            <Button onClick={addDepartment} className="pastel-button-primary h-14 px-8 shrink-0">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {departments.map((dept) => (
                                <div key={dept} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/60 transition-all group">
                                    <span className="font-bold text-[#1E2455]">{dept}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDepartment(dept)}
                                        className="text-[#7A80B8] hover:text-[#FF6B8A] opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Year Management */}
                <Card className="glass-card border-white/60 shadow-2xl rounded-[40px] overflow-hidden">
                    <CardHeader className="bg-white/40 border-b border-white/60 p-8">
                        <CardTitle className="flex items-center gap-4 text-2xl font-black text-[#1E2455] uppercase tracking-tighter">
                            <Calendar className="h-7 w-7 text-[#E38AD6]" />
                            Academic Years
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex gap-4">
                            <Input
                                placeholder="New Year (e.g. V Year)"
                                className="glass-input h-14 font-bold text-[#1E2455]"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                            />
                            <Button onClick={addYear} className="pastel-button-primary h-14 px-8 shrink-0 bg-[#E38AD6] hover:bg-[#D479C7]">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {years.map((year) => (
                                <div key={year} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/60 transition-all group">
                                    <span className="font-bold text-[#1E2455]">{year}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeYear(year)}
                                        className="text-[#7A80B8] hover:text-[#FF6B8A] opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pt-8">
                <div className="bg-white/40 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/50 flex items-center gap-4 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-[#4EE3B2]" />
                    <span className="text-xs font-black text-[#1E2455] uppercase tracking-widest">Isolated Academic Registry Synchronized</span>
                </div>
            </div>
        </div>
    );
};

export default AcademicManagement;
