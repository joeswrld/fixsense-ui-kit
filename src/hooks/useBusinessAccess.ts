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
        .eq("id", user.id)  // THIS IS THE KEY FIX - was user_id before
        .single();

      if (error) {
        console.error("Error fetching business access:", error);
        throw error;
      }

      console.log("Business Access Profile Data:", data); // Debug log
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Set up real-time subscription to profile changes
  useEffect(() => {
    let channel: any;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Profile updated via realtime:", payload);
            refetch();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refetch]);

  // Check if user has business access
  const isBusinessUser = 
    profile?.user_type === "business" || 
    (profile?.subscription_tier === "business" && profile?.subscription_status === "active");

  console.log("Business Access Check:", {
    isBusinessUser,
    user_type: profile?.user_type,
    subscription_tier: profile?.subscription_tier,
    subscription_status: profile?.subscription_status
  }); // Debug log

  return {
    isBusinessUser,
    isLoading,
    userType: profile?.user_type,
    subscriptionTier: profile?.subscription_tier,
    subscriptionStatus: profile?.subscription_status,
  };
};
