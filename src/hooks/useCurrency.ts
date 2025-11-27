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
      return data.currency as string;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const format = (amount: number, showSymbol: boolean = true) => {
    const code = currencyCode || "USD";
    return formatCurrency(amount, code, showSymbol);
  };

  const getSymbol = () => {
    const code = currencyCode || "USD";
    return getCurrencySymbol(code);
  };

  return {
    currencyCode: currencyCode || "USD",
    format,
    symbol: getSymbol(),
    isLoading,
  };
};