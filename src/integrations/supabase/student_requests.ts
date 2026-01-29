import { supabase } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StudentRequest {
    id: string;
    name: string;
    year: string;
    department: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export const useStudentRequests = () => {
    return useQuery<StudentRequest[], Error>({
        queryKey: ["studentRequests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("student_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching student requests:", error);
                // If table doesn't exist yet, return empty array to avoid crash
                if (error.code === '42P01') return [];
                throw new Error(error.message);
            }
            return data || [];
        },
    });
};

export const useCreateStudentRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (request: Omit<StudentRequest, 'id' | 'created_at' | 'status'>) => {
            const { data, error } = await supabase
                .from("student_requests")
                .insert([{ ...request, status: 'pending' }])
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["studentRequests"] });
        },
    });
};
