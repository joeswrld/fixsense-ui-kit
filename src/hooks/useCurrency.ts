// src/hooks/useCurrency.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getCurrencySymbol } from "@/utils/currencyFormatter";

export const useCurrency = () => {
  const { data: currencyCode, isLoading } = useQuery({
    queryKey: ["user-currency"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "USD";

      const { data, error } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single();

      if (error || !data?.currency) return "USD";
      return data.currency;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const format = (amount: number, showSymbol: boolean = true) => {
    return formatCurrency(amount, currencyCode || "USD", showSymbol);
  };

  const symbol = getCurrencySymbol(currencyCode || "USD");

  return {
    currencyCode: currencyCode || "USD",
    format,
    symbol,
    isLoading,
  };
};