import { supabase } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StudentRequest {
    id: string;
    name: string;
    year: string;
    department: string;
    message?: string;
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
                // If table doesn't exist yet, return empty array silently to avoid console noise
                if (error.code === '42P01' || error.code === 'PGRST205') {
                    console.warn("Table 'student_requests' missing. Returning empty list.");
                    return [];
                }
                console.error("Error fetching student requests:", error);
<<<<<<< HEAD
                // Safely return empty array on any error (like missing table) to prevent app crash
                return [];
=======
                throw new Error(error.message);
>>>>>>> b205ec2 (working)
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
