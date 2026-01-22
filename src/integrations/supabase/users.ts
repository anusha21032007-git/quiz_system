import { useQuery } from "@tanstack/react-query";
import { supabase } from "./client";

// Fetch total student count
export const useStudentCount = () => {
  return useQuery<number, Error>({
    queryKey: ["studentCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("id", { count: 'exact', head: true });

      if (error) {
        console.error("Error fetching student count:", error);
        throw new Error(error.message);
      }
      return count || 0;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};