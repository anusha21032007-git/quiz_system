import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Users as UsersIcon,
    UserPlus,
    X,
    GraduationCap,
    Hash,
    Calendar,
    Building2,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuiz } from '@/context/QuizContext';
import { cn } from '@/lib/utils';

const UsersList = () => {
    const { managedUsers, addManagedUser } = useQuiz();
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        registerNumber: '',
        year: '',
        department: ''
    });

    const demoUsers = useMemo(() =>
        Array.from({ length: 5 }, (_, i) => ({
            id: `demo-${i}`,
            username: `user${i + 1}`,
            password: `pass@${i + 1}`,
            name: `Demo Student ${i + 1}`,
            registerNumber: `REG${1000 + i}`,
            year: '2024',
            department: 'Computer Science',
            role: 'Student' as const
        })),
        []
    );

    // Merge managed users with demo users
    const allUsers = useMemo(() => [...managedUsers, ...demoUsers], [managedUsers, demoUsers]);

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.registerNumber || !formData.year || !formData.department) {
            return; // Sonner toast in context/custom validation can be added
        }
        addManagedUser(formData);
        setFormData({ name: '', registerNumber: '', year: '', department: '' });
        setShowAddForm(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <UsersIcon className="h-8 w-8 text-indigo-600" />
                        Student Directory
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Manage student participants and their credentials.</p>
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
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-indigo-600" />
                                </div>
                                Register New Student
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowAddForm(false)}
                                className="rounded-full hover:bg-white text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleAddUser} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <GraduationCap className="h-3.5 w-3.5" /> Full Name
                                    </label>
                                    <Input
                                        placeholder="e.g. Alex Johnson"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-slate-900 font-medium focus-visible:ring-indigo-500/20 focus-visible:ring-2"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5" /> Register Number
                                    </label>
                                    <Input
                                        placeholder="e.g. 21BCE0042"
                                        value={formData.registerNumber}
                                        onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-slate-900 font-medium focus-visible:ring-indigo-500/20 focus-visible:ring-2"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" /> Academic Year
                                    </label>
                                    <Input
                                        placeholder="e.g. 2024"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-slate-900 font-medium focus-visible:ring-indigo-500/20 focus-visible:ring-2"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5" /> Department
                                    </label>
                                    <Input
                                        placeholder="e.g. CSE"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="h-12 bg-slate-50 border-none rounded-xl text-slate-900 font-medium focus-visible:ring-indigo-500/20 focus-visible:ring-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowAddForm(false)}
                                    className="h-12 px-6 rounded-xl font-bold text-slate-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-indigo-100"
                                >
                                    <Check className="h-5 w-5 mr-2" /> Complete Registration
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-lg border-slate-100 rounded-[32px] overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
                        {allUsers.length > 0 ? (
                            allUsers.map((user, idx) => (
                                <div key={user.id} className="group p-6 border-b border-slate-50 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 font-bold text-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-colors">
                                            <UsersIcon className="h-7 w-7 text-indigo-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {(user as any).name || (user as any).username}
                                                </h4>
                                                {(user as any).registerNumber && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                        {(user as any).registerNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                                    <Building2 className="h-3 w-3" /> {(user as any).department || 'Computer Science'}
                                                </p>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" /> Year: {(user as any).year || '2024'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 leading-none">Username</p>
                                            <code className="text-sm font-bold text-slate-600 tracking-tight">{(user as any).username}</code>
                                        </div>
                                        <div className="h-10 w-px bg-slate-100" />
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 leading-none">Password</p>
                                            <code className="px-3 py-1 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm font-bold text-indigo-600 shadow-sm">
                                                {user.password}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                                    <UsersIcon className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Students Registered</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">Start building your roster by clicking the "Add Student" button above.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersList;