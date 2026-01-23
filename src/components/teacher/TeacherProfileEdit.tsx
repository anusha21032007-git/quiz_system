"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUpdateTeacherProfile } from '@/integrations/supabase/profiles';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon } from 'lucide-react';

interface TeacherProfileEditProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TeacherProfileEdit = ({ open, onOpenChange }: TeacherProfileEditProps) => {
    const { user, teacherData } = useAuth();
    const updateProfile = useUpdateTeacherProfile();

    const [fullName, setFullName] = useState(teacherData?.full_name || '');
    const [department, setDepartment] = useState(teacherData?.department || '');

    React.useEffect(() => {
        if (teacherData) {
            setFullName(teacherData.full_name || '');
            setDepartment(teacherData.department || '');
        }
    }, [teacherData]);

    const handleSave = async () => {
        if (!user?.id) return;

        if (!fullName.trim()) {
            return;
        }

        await updateProfile.mutateAsync({
            userId: user.id,
            full_name: fullName.trim(),
            department: department.trim() || undefined,
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your profile information. This will be displayed across the teacher dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-600">
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-semibold text-slate-600">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="Dr. Sarah Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-semibold text-slate-600">
                            Department
                        </Label>
                        <Input
                            id="department"
                            placeholder="Science Department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="h-11"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={updateProfile.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!fullName.trim() || updateProfile.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TeacherProfileEdit;
