"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Users as UsersIcon,
    UserPlus,
    X,
    GraduationCap,
    Hash,
    Calendar,
    Building2,
    Check,
    Loader2,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const UsersList = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        registerNumber: '',
        yearSemester: '',
        department: '',
        batch: '',
        password: ''
    });

    const fetchStudents = async () => {
        setFetching(true);
        const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (data) setStudents(data);
        setFetching(false);
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Call the Edge Function to create the student account securely
            const response = await fetch('https://gapytkueymkmuadnfihc.supabase.co/functions/v1/create-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Failed to create student');

            toast.success("Student account created successfully!");
            setShowAddForm(false);
            setFormData({ name: '', registerNumber: '', yearSemester: '', department: '', batch: '', password: '' });
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-poppins">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                <div>
                    <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] tracking-tighter flex items-center gap-5 uppercase">
                        <div className="p-3 bg-[#6C8BFF]/10 rounded-[20px]">
                            <UsersIcon className="h-10 w-10 text-[#6C8BFF]" />
                        </div>
                        Student Directory
                    </h2>
                    <p className="text-[#3A3F6B] mt-3 font-bold italic opacity-70 text-lg">Register and manage simulated academic credentials.</p>
                </div>
                {!showAddForm && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="pastel-button-primary h-18 px-12 text-[11px] tracking-[0.2em] group"
                    >
                        <UserPlus className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-500" />
                        <span className="pt-0.5">ENROLL CANDIDATE</span>
                    </Button>
                )}
            </div>

            {showAddForm && (
                <Card className="glass-card border-white/60 shadow-2xl rounded-[48px] overflow-hidden animate-in slide-in-from-top-4 duration-500 relative z-20">
                    <CardHeader className="bg-white/40 border-b border-white/60 px-10 py-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-4 text-2xl font-black text-[#1E2455] uppercase tracking-tighter">
                                <div className="p-2 bg-[#6C8BFF]/10 rounded-xl">
                                    <UserPlus className="h-7 w-7 text-[#6C8BFF]" />
                                </div>
                                Register Student Account
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-2xl hover:bg-[#FF6B8A]/5 hover:text-[#FF6B8A] transition-all h-12 w-12 border border-transparent hover:border-[#FF6B8A]/20">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleAddUser} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><GraduationCap className="h-4 w-4" /> Candidate Identity</label>
                                    <Input placeholder="e.g. Alex Johnson" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><Hash className="h-4 w-4" /> Registration Index</label>
                                    <Input placeholder="e.g. 2024-001" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.registerNumber} onChange={e => setFormData({ ...formData, registerNumber: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><Building2 className="h-4 w-4" /> Disciplinary Domain</label>
                                    <Input placeholder="e.g. Computer Science" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><Calendar className="h-4 w-4" /> Academic Phase</label>
                                    <Input placeholder="e.g. 3rd Year / 5th Sem" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.yearSemester} onChange={e => setFormData({ ...formData, yearSemester: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><UsersIcon className="h-4 w-4" /> Cohort Designation</label>
                                    <Input placeholder="e.g. 2021-2025" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] flex items-center gap-2.5 pl-2"><Lock className="h-4 w-4" /> Access Key</label>
                                    <Input type="password" placeholder="Set secure access key" className="glass-input h-16 font-black text-[#1E2455] placeholder-[#7A80B8]/40" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-5 pt-6 border-t border-white/40">
                                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="h-16 px-10 hover:bg-[#7A80B8]/5 text-[#7A80B8] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all">Cancel</Button>
                                <Button type="submit" className="pastel-button-primary h-16 px-12 text-[10px] tracking-[0.2em]" disabled={loading}>
                                    {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Check className="h-6 w-6 mr-3" />} COMPLETE ENROLLMENT
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-6">
                {fetching ? (
                    <div className="py-48 glass-card border-white/40 text-center flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#6C8BFF]/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <Loader2 className="h-16 w-16 animate-spin text-[#6C8BFF] relative z-10" />
                        </div>
                        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-[#7A80B8] animate-pulse">Syncing Identity Directory...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {students.length > 0 ? (
                            students.map((student, idx) => (
                                <div key={student.id} className="group glass-card p-8 border-white/40 hover:border-white/70 hover:bg-white/40 hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-700 flex flex-wrap items-center justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

                                    <div className="flex items-center gap-10 relative z-10">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-[22px] bg-white/60 text-[#7A80B8] font-black text-xs border border-white shadow-inner group-hover:bg-gradient-to-br group-hover:from-[#6C8BFF] group-hover:to-[#E38AD6] group-hover:text-white group-hover:border-transparent transition-all duration-700 shrink-0 tracking-widest p-1">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="w-20 h-20 bg-gradient-to-br from-[#6C8BFF]/10 to-[#E38AD6]/10 border border-white/60 rounded-[28px] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 p-5 shadow-sm">
                                                <GraduationCap className="h-full w-full text-[#6C8BFF]" />
                                            </div>
                                            <div>
                                                <h4 className="text-3xl font-black text-[#1E2455] group-hover:text-[#6C8BFF] transition-colors uppercase tracking-tighter leading-none mb-3">{student.name}</h4>
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-[#7A80B8]/60 uppercase tracking-widest bg-white/40 px-4 py-1.5 rounded-lg border border-white/60">
                                                        <span className="text-[#1E2455]/40 opacity-50">REG:</span>
                                                        <span className="text-[#1E2455] opacity-80">{student.register_number}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-[#7A80B8]/60 uppercase tracking-widest bg-white/40 px-4 py-1.5 rounded-lg border border-white/60">
                                                        <span className="text-[#1E2455]/40 opacity-50">DOMAIN:</span>
                                                        <span className="text-[#1E2455] opacity-80">{student.department}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 relative z-10">
                                        <span className={cn(
                                            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm flex items-center gap-3",
                                            student.is_active
                                                ? 'bg-[#4EE3B2]/10 text-[#4EE3B2] border-[#4EE3B2]/20'
                                                : 'bg-[#FF6B8A]/10 text-[#FF6B8A] border-[#FF6B8A]/20'
                                        )}>
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", student.is_active ? "bg-[#4EE3B2]" : "bg-[#FF6B8A]")} />
                                            {student.is_active ? 'Authorized' : 'Suspended'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-48 glass-card rounded-[56px] border-white/50 text-center relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,139,255,0.05)_0%,transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="w-32 h-32 bg-white/40 border border-white/60 rounded-[40px] flex items-center justify-center mx-auto mb-12 shadow-glass group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 p-8">
                                    <UsersIcon className="h-full w-full text-[#7A80B8] group-hover:text-[#6C8BFF] transition-all duration-500" />
                                </div>
                                <h3 className="text-4xl font-black text-[#1E2455] mb-6 uppercase tracking-tighter relative z-10">
                                    Directory Depleted
                                </h3>
                                <p className="text-[#3A3F6B] max-w-md mx-auto font-bold italic opacity-60 tracking-tight relative z-10 text-xl px-10">
                                    No candidates have been indexed into the central identity repository system. Start by enrolling your first candidate.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersList;