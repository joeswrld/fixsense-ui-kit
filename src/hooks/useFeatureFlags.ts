import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeatureFlags = () => {
  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("flag_key, enabled");

      if (error) throw error;

      const flagMap: Record<string, boolean> = {};
      data?.forEach((f) => {
        flagMap[f.flag_key] = f.enabled;
      });
      return flagMap;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isEnabled = (key: string): boolean => {
    if (!flags) return true; // default to enabled if not loaded
    return flags[key] !== false; // default to enabled if flag doesn't exist
  };

  return { flags, isLoading, isEnabled };
};
