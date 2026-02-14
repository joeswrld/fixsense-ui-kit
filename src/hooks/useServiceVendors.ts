import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ServiceVendor {
  id: string;
  vendor_name: string;
  description: string | null;
  category: string;
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  whatsapp_link: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function useServiceVendors() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["service-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_vendors")
        .select("*")
        .order("is_verified", { ascending: false })
        .order("vendor_name", { ascending: true });

      if (error) throw error;
      return data as ServiceVendor[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("service-vendors-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_vendors" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["service-vendors"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
