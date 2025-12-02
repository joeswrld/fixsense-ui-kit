import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "free" | "pro" | "business";

export const useUserRole = () => {
  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("role", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return "free" as AppRole;
      }

      return data?.role as AppRole || "free";
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const isAdmin = role === "admin";
  const isPaid = role === "pro" || role === "business";

  return {
    role,
    isAdmin,
    isPaid,
    isLoading,
  };
};
