import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useBusinessAccess = () => {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["user-profile-business-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("user_type, subscription_tier, subscription_status")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Set up real-time subscription to profile changes
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${data.user.id}`,
          },
          () => {
            // Refetch data immediately when profile is updated
            refetch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [refetch]);

  // Check if user has business access either through:
  // 1. user_type being set to 'business'
  // 2. subscription_tier being 'business' with active status
  const isBusinessUser = 
    profile?.user_type === "business" || 
    (profile?.subscription_tier === "business" && profile?.subscription_status === "active");

  return {
    isBusinessUser,
    isLoading,
    userType: profile?.user_type,
    subscriptionTier: profile?.subscription_tier,
    subscriptionStatus: profile?.subscription_status,
  };
};