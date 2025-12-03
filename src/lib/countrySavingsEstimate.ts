// Country-specific savings estimation based on local repair costs
// These are average scam overcharges avoided per diagnostic

export interface CountrySavingsData {
  currency: string;
  symbol: string;
  averageSavingsPerScamAlert: number;
  locale: string;
}

// Country-specific average savings when avoiding a scam
// Based on typical overcharge amounts in local currency
export const COUNTRY_SAVINGS: Record<string, CountrySavingsData> = {
  // West Africa
  NG: { currency: "NGN", symbol: "₦", averageSavingsPerScamAlert: 25000, locale: "en-NG" },
  GH: { currency: "GHS", symbol: "₵", averageSavingsPerScamAlert: 450, locale: "en-GH" },
  SN: { currency: "XOF", symbol: "CFA", averageSavingsPerScamAlert: 40000, locale: "fr-SN" },
  CI: { currency: "XOF", symbol: "CFA", averageSavingsPerScamAlert: 45000, locale: "fr-CI" },

  // East Africa
  KE: { currency: "KES", symbol: "KSh", averageSavingsPerScamAlert: 12000, locale: "en-KE" },
  TZ: { currency: "TZS", symbol: "TSh", averageSavingsPerScamAlert: 300000, locale: "sw-TZ" },
  UG: { currency: "UGX", symbol: "USh", averageSavingsPerScamAlert: 400000, locale: "en-UG" },
  RW: { currency: "RWF", symbol: "FRw", averageSavingsPerScamAlert: 80000, locale: "rw-RW" },
  ET: { currency: "ETB", symbol: "Br", averageSavingsPerScamAlert: 6000, locale: "am-ET" },

  // Southern Africa
  ZA: { currency: "ZAR", symbol: "R", averageSavingsPerScamAlert: 1500, locale: "en-ZA" },
  BW: { currency: "BWP", symbol: "P", averageSavingsPerScamAlert: 1200, locale: "en-BW" },
  ZM: { currency: "ZMW", symbol: "ZK", averageSavingsPerScamAlert: 2500, locale: "en-ZM" },

  // North Africa
  EG: { currency: "EGP", symbol: "£", averageSavingsPerScamAlert: 3000, locale: "ar-EG" },
  MA: { currency: "MAD", symbol: "د.م.", averageSavingsPerScamAlert: 800, locale: "ar-MA" },

  // North America
  US: { currency: "USD", symbol: "$", averageSavingsPerScamAlert: 200, locale: "en-US" },
  CA: { currency: "CAD", symbol: "C$", averageSavingsPerScamAlert: 250, locale: "en-CA" },
  MX: { currency: "MXN", symbol: "$", averageSavingsPerScamAlert: 2500, locale: "es-MX" },

  // Europe
  GB: { currency: "GBP", symbol: "£", averageSavingsPerScamAlert: 150, locale: "en-GB" },
  DE: { currency: "EUR", symbol: "€", averageSavingsPerScamAlert: 180, locale: "de-DE" },
  FR: { currency: "EUR", symbol: "€", averageSavingsPerScamAlert: 180, locale: "fr-FR" },
  IT: { currency: "EUR", symbol: "€", averageSavingsPerScamAlert: 170, locale: "it-IT" },
  ES: { currency: "EUR", symbol: "€", averageSavingsPerScamAlert: 160, locale: "es-ES" },
  NL: { currency: "EUR", symbol: "€", averageSavingsPerScamAlert: 175, locale: "nl-NL" },
  PL: { currency: "PLN", symbol: "zł", averageSavingsPerScamAlert: 600, locale: "pl-PL" },

  // Asia
  IN: { currency: "INR", symbol: "₹", averageSavingsPerScamAlert: 4000, locale: "en-IN" },
  PK: { currency: "PKR", symbol: "Rs", averageSavingsPerScamAlert: 10000, locale: "ur-PK" },
  BD: { currency: "BDT", symbol: "৳", averageSavingsPerScamAlert: 5000, locale: "bn-BD" },
  AE: { currency: "AED", symbol: "د.إ", averageSavingsPerScamAlert: 500, locale: "ar-AE" },
  SG: { currency: "SGD", symbol: "S$", averageSavingsPerScamAlert: 200, locale: "en-SG" },
  MY: { currency: "MYR", symbol: "RM", averageSavingsPerScamAlert: 500, locale: "ms-MY" },
  TH: { currency: "THB", symbol: "฿", averageSavingsPerScamAlert: 4000, locale: "th-TH" },
  PH: { currency: "PHP", symbol: "₱", averageSavingsPerScamAlert: 5000, locale: "fil-PH" },
  ID: { currency: "IDR", symbol: "Rp", averageSavingsPerScamAlert: 1000000, locale: "id-ID" },
  VN: { currency: "VND", symbol: "₫", averageSavingsPerScamAlert: 2000000, locale: "vi-VN" },
};

// Default fallback for unknown countries
const DEFAULT_SAVINGS: CountrySavingsData = {
  currency: "USD",
  symbol: "$",
  averageSavingsPerScamAlert: 200,
  locale: "en-US",
};

export const getCountrySavings = (countryCode: string): CountrySavingsData => {
  return COUNTRY_SAVINGS[countryCode?.toUpperCase()] || DEFAULT_SAVINGS;
};

export const calculateEstimatedSavings = (
  scamAlertsTriggered: number,
  countryCode: string
): { amount: number; formatted: string; currency: string; symbol: string } => {
  const countryData = getCountrySavings(countryCode);
  const totalSavings = scamAlertsTriggered * countryData.averageSavingsPerScamAlert;

  const formatted = new Intl.NumberFormat(countryData.locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalSavings);

  return {
    amount: totalSavings,
    formatted: `${countryData.symbol}${formatted}`,
    currency: countryData.currency,
    symbol: countryData.symbol,
  };
};
