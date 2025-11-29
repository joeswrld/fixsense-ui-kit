import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBusinessAccess = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-business-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("user_type, subscription_tier, subscription_status")
        .eq("id", user.id)  // Changed from user_id to id
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

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