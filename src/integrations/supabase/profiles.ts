import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import { toast } from 'sonner';

export interface TeacherProfile {
    id: string;
    role: 'teacher' | 'student';
    full_name?: string;
    department?: string;
}

export const useTeacherProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['teacher-profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as TeacherProfile;
        },
        enabled: !!userId,
    });
};

export const useUpdateTeacherProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, full_name, department }: { userId: string; full_name: string; department?: string }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ full_name, department })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['teacher-profile', data.id] });
            toast.success('Profile updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
};
