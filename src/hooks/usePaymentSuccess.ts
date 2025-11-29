import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePaymentSuccess = () => {
  const queryClient = useQueryClient();

  const handlePaymentSuccess = async () => {
    try {
      // Get the updated profile data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_type, subscription_tier, subscription_status")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Immediately update the cache with new data
      queryClient.setQueryData(["user-profile-business-access"], profile);
      
      // Also invalidate to trigger a background refetch
      queryClient.invalidateQueries({ queryKey: ["user-profile-business-access"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-usage"] });

      toast.success("Subscription updated successfully!");
      
      return profile;
    } catch (error) {
      console.error("Error handling payment success:", error);
      toast.error("Failed to update subscription status");
    }
  };

  return { handlePaymentSuccess };
};