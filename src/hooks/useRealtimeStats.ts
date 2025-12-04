import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface RealtimeStats {
  userCount: number;
  transactionCount: number;
}

export const useRealtimeStats = () => {
  const [stats, setStats] = useState<RealtimeStats>({ userCount: 0, transactionCount: 0 });
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial fetch
    const fetchInitialStats = async () => {
      const [usersRes, transactionsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        userCount: usersRes.count || 0,
        transactionCount: transactionsRes.count || 0,
      });
    };

    fetchInitialStats();

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel("realtime-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          // Refetch user count
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .then(({ count }) => {
              setStats((prev) => ({ ...prev, userCount: count || 0 }));
              queryClient.invalidateQueries({ queryKey: ["admin-users"] });
              queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            });
        }
      )
      .subscribe();

    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel("realtime-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          // Refetch transaction count
          supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .then(({ count }) => {
              setStats((prev) => ({ ...prev, transactionCount: count || 0 }));
              queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
              queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [queryClient]);

  return stats;
};
