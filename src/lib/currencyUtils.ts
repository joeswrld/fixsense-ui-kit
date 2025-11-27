// src/lib/currencyUtils.ts

export interface CurrencyConfig {
    code: string;
    symbol: string;
    locale: string;
  }
  
  export interface UserCurrency {
    currency: string | null;
  }
  
  const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
    NGN: { code: "NGN", symbol: "₦", locale: "en-NG" },
    USD: { code: "USD", symbol: "$", locale: "en-US" },
    GBP: { code: "GBP", symbol: "£", locale: "en-GB" },
    EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
    CAD: { code: "CAD", symbol: "C$", locale: "en-CA" },
    AUD: { code: "AUD", symbol: "A$", locale: "en-AU" },
    ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA" },
    KES: { code: "KES", symbol: "KSh", locale: "en-KE" },
    GHS: { code: "GHS", symbol: "₵", locale: "en-GH" },
    INR: { code: "INR", symbol: "₹", locale: "en-IN" },
    AED: { code: "AED", symbol: "د.إ", locale: "ar-AE" },
  };
  
  const DEFAULT_CURRENCY = "NGN";
  
  /**
   * Format a price value according to the specified currency
   * @param amount - The numeric amount to format
   * @param currencyCode - The currency code (e.g., "NGN", "USD")
   * @returns Formatted price string with currency symbol
   */
  export const formatPrice = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode || DEFAULT_CURRENCY;
    const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS[DEFAULT_CURRENCY];
  
    try {
      // Format with thousands separators, no decimals for whole numbers
      const formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
  
      return `${config.symbol}${formatted}`;
    } catch (error) {
      // Fallback to simple formatting
      console.error("Error formatting price:", error);
      return `${config.symbol}${amount.toLocaleString()}`;
    }
  };
  
  /**
   * Format a price range (min - max)
   * @param min - Minimum price
   * @param max - Maximum price
   * @param currencyCode - The currency code
   * @returns Formatted price range string
   */
  export const formatPriceRange = (
    min: number,
    max: number,
    currencyCode?: string
  ): string => {
    return `${formatPrice(min, currencyCode)} - ${formatPrice(max, currencyCode)}`;
  };
  
  /**
   * Get the currency symbol for a given currency code
   * @param currencyCode - The currency code
   * @returns Currency symbol
   */
  export const getCurrencySymbol = (currencyCode?: string): string => {
    const currency = currencyCode || DEFAULT_CURRENCY;
    return CURRENCY_CONFIGS[currency]?.symbol || CURRENCY_CONFIGS[DEFAULT_CURRENCY].symbol;
  };