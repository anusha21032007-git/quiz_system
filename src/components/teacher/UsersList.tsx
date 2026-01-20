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
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <UsersIcon className="h-8 w-8 text-indigo-600" />
                        Student Directory
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Register and manage student credentials.</p>
                </div>
                {!showAddForm && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
                    >
                        <UserPlus className="h-5 w-5 mr-2" /> Add Student
                    </Button>
                )}
            </div>

            {showAddForm && (
                <Card className="border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 rounded-[32px] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-indigo-50 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                <UserPlus className="h-5 w-5 text-indigo-600" />
                                Register Student Account
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleAddUser} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> Full Name</label>
                                    <Input placeholder="e.g. Alex Johnson" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Register Number</label>
                                    <Input placeholder="e.g. 2024-001" value={formData.registerNumber} onChange={e => setFormData({ ...formData, registerNumber: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Department</label>
                                    <Input placeholder="e.g. Computer Science" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Year / Semester</label>
                                    <Input placeholder="e.g. 3rd Year / 5th Sem" value={formData.yearSemester} onChange={e => setFormData({ ...formData, yearSemester: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><UsersIcon className="h-3.5 w-3.5" /> Batch</label>
                                    <Input placeholder="e.g. 2021-2025" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Default Password</label>
                                    <Input type="password" placeholder="Set temporary password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />} Complete Registration
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-lg border-slate-100 rounded-[32px] overflow-hidden">
                <CardContent className="p-0">
                    {fetching ? (
                        <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                    ) : (
                        <div className="flex flex-col">
                            {students.length > 0 ? (
                                students.map((student, idx) => (
                                    <div key={student.id} className="group p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 font-bold text-xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">{idx + 1}</div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                                                    <span>Reg: {student.register_number}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span>{student.department}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${student.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-24 text-center">
                                    <UsersIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900">No Students Registered</h3>
                                    <p className="text-slate-500">Start by adding your first student using the button above.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersList;