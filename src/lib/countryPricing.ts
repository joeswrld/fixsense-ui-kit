// ============================================================
// lib/countryPricing.ts
// Country-Aware Repair Cost Estimation System
// ============================================================

export const REPAIR_COMPLEXITY = {
    MINOR: 'minor',
    MODERATE: 'moderate',
    MAJOR: 'major'
  } as const;
  
  export type RepairComplexity = typeof REPAIR_COMPLEXITY[keyof typeof REPAIR_COMPLEXITY];
  
  // Base repair costs in USD
  export const BASE_REPAIR_COSTS: Record<RepairComplexity, { min: number; max: number }> = {
    [REPAIR_COMPLEXITY.MINOR]: { min: 20, max: 50 },
    [REPAIR_COMPLEXITY.MODERATE]: { min: 60, max: 150 },
    [REPAIR_COMPLEXITY.MAJOR]: { min: 180, max: 400 }
  };
  
  export interface CountryData {
    multiplier: number;
    currency: string;
    name: string;
    exchangeRate: number;
    locale?: string;
  }
  
  // Country pricing multipliers and exchange rates
  // Exchange rates should be updated periodically via API or manual updates
  export const COUNTRY_MULTIPLIERS: Record<string, CountryData> = {
    // African Countries
    NG: { 
      multiplier: 0.35, 
      currency: '₦', 
      name: 'Nigeria', 
      exchangeRate: 1650,
      locale: 'en-NG'
    },
    GH: { 
      multiplier: 0.45, 
      currency: '₵', 
      name: 'Ghana', 
      exchangeRate: 15.5,
      locale: 'en-GH'
    },
    KE: { 
      multiplier: 0.45, 
      currency: 'KSh', 
      name: 'Kenya', 
      exchangeRate: 155,
      locale: 'en-KE'
    },
    ZA: { 
      multiplier: 0.65, 
      currency: 'R', 
      name: 'South Africa', 
      exchangeRate: 19,
      locale: 'en-ZA'
    },
    
    // European Countries
    GB: { 
      multiplier: 1.2, 
      currency: '£', 
      name: 'United Kingdom', 
      exchangeRate: 0.79,
      locale: 'en-GB'
    },
    DE: { 
      multiplier: 1.2, 
      currency: '€', 
      name: 'Germany', 
      exchangeRate: 0.92,
      locale: 'de-DE'
    },
    FR: { 
      multiplier: 1.2, 
      currency: '€', 
      name: 'France', 
      exchangeRate: 0.92,
      locale: 'fr-FR'
    },
    IT: { 
      multiplier: 1.15, 
      currency: '€', 
      name: 'Italy', 
      exchangeRate: 0.92,
      locale: 'it-IT'
    },
    ES: { 
      multiplier: 1.1, 
      currency: '€', 
      name: 'Spain', 
      exchangeRate: 0.92,
      locale: 'es-ES'
    },
    
    // North America
    US: { 
      multiplier: 1.4, 
      currency: '$', 
      name: 'United States', 
      exchangeRate: 1,
      locale: 'en-US'
    },
    CA: { 
      multiplier: 1.4, 
      currency: 'C$', 
      name: 'Canada', 
      exchangeRate: 1.35,
      locale: 'en-CA'
    },
    
    // Asia
    IN: { 
      multiplier: 0.4, 
      currency: '₹', 
      name: 'India', 
      exchangeRate: 83,
      locale: 'en-IN'
    },
    CN: { 
      multiplier: 0.55, 
      currency: '¥', 
      name: 'China', 
      exchangeRate: 7.2,
      locale: 'zh-CN'
    },
    JP: { 
      multiplier: 1.3, 
      currency: '¥', 
      name: 'Japan', 
      exchangeRate: 148,
      locale: 'ja-JP'
    },
    
    // Middle East
    AE: { 
      multiplier: 1.1, 
      currency: 'د.إ', 
      name: 'United Arab Emirates', 
      exchangeRate: 3.67,
      locale: 'ar-AE'
    },
    SA: { 
      multiplier: 1.05, 
      currency: '﷼', 
      name: 'Saudi Arabia', 
      exchangeRate: 3.75,
      locale: 'ar-SA'
    },
    
    // Australia & Oceania
    AU: { 
      multiplier: 1.35, 
      currency: 'A$', 
      name: 'Australia', 
      exchangeRate: 1.52,
      locale: 'en-AU'
    },
  };
  
  // Fallback for unknown countries
  export const DEFAULT_PRICING: CountryData = {
    multiplier: 1.0,
    currency: '$',
    name: 'Global Average',
    exchangeRate: 1,
    locale: 'en-US'
  };
  
  export interface RepairCostEstimate {
    min: number;
    max: number;
    currency: string;
    countryName: string;
    isDefaultPricing: boolean;
    complexity: RepairComplexity;
  }
  
  /**
   * Round prices to market-friendly figures based on currency value
   */
  export const roundToMarketPrice = (value: number, countryCode: string): number => {
    // High-value currencies (USD, EUR, GBP, CAD, AUD) - round to nearest 5 or 10
    if (['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'IT', 'ES'].includes(countryCode)) {
      if (value < 100) return Math.round(value / 5) * 5;
      return Math.round(value / 10) * 10;
    }
    
    // Medium-value currencies (ZAR, AED, SAR) - round to nearest 50
    if (['ZA', 'AE', 'SA'].includes(countryCode)) {
      return Math.round(value / 50) * 50;
    }
    
    // Low-value currencies (NGN, KES, GHS, INR, JPY, CNY) - round to nearest 100 or 1000
    if (value > 10000) return Math.round(value / 1000) * 1000;
    if (value > 1000) return Math.round(value / 100) * 100;
    return Math.round(value / 50) * 50;
  };
  
  /**
   * Format currency value with appropriate locale and separators
   */
  export const formatCurrency = (value: number, countryCode: string): string => {
    const countryData = COUNTRY_MULTIPLIERS[countryCode] || DEFAULT_PRICING;
    const locale = countryData.locale || 'en-US';
    
    return value.toLocaleString(locale, { 
      maximumFractionDigits: 0,
      useGrouping: true
    });
  };
  
  /**
   * Calculate repair cost based on complexity and country
   */
  export const calculateRepairCost = (
    complexity: RepairComplexity, 
    countryCode: string
  ): Omit<RepairCostEstimate, 'complexity'> => {
    const baseCost = BASE_REPAIR_COSTS[complexity] || BASE_REPAIR_COSTS[REPAIR_COMPLEXITY.MODERATE];
    const countryData = COUNTRY_MULTIPLIERS[countryCode] || DEFAULT_PRICING;
    
    // Apply country multiplier to base USD cost
    const adjustedMinUSD = baseCost.min * countryData.multiplier;
    const adjustedMaxUSD = baseCost.max * countryData.multiplier;
    
    // Convert to local currency
    const minLocal = adjustedMinUSD * countryData.exchangeRate;
    const maxLocal = adjustedMaxUSD * countryData.exchangeRate;
    
    return {
      min: roundToMarketPrice(minLocal, countryCode),
      max: roundToMarketPrice(maxLocal, countryCode),
      currency: countryData.currency,
      countryName: countryData.name,
      isDefaultPricing: !COUNTRY_MULTIPLIERS[countryCode]
    };
  };
  
  /**
   * Determine repair complexity from diagnostic data using keyword analysis
   */
  export const determineComplexity = (diagnostic: {
    diagnosis_summary?: string;
    probable_causes?: string[];
    fix_instructions?: string;
  }): RepairComplexity => {
    const summary = (diagnostic.diagnosis_summary || '').toLowerCase();
    const causes = (diagnostic.probable_causes || []).join(' ').toLowerCase();
    const instructions = (diagnostic.fix_instructions || '').toLowerCase();
    
    const allText = `${summary} ${causes} ${instructions}`;
    
    // Keywords indicating minor repairs
    const minorKeywords = [
      'clean', 'cleaning', 'reset', 'loose', 'tighten', 'adjust', 
      'reconnect', 'cable', 'filter', 'dust', 'debris', 'clog',
      'unplug', 'replug', 'simple', 'quick', 'straightforward'
    ];
    
    // Keywords indicating major repairs
    const majorKeywords = [
      'replace', 'replacement', 'component', 'motor', 'compressor', 
      'circuit', 'board', 'electrical', 'mechanical', 'wiring',
      'professional', 'technician', 'specialist', 'complex',
      'expensive', 'major', 'significant', 'extensive'
    ];
    
    const minorCount = minorKeywords.filter(kw => allText.includes(kw)).length;
    const majorCount = majorKeywords.filter(kw => allText.includes(kw)).length;
    
    // Decision logic
    if (majorCount >= 2) return REPAIR_COMPLEXITY.MAJOR;
    if (minorCount >= 2 && majorCount === 0) return REPAIR_COMPLEXITY.MINOR;
    return REPAIR_COMPLEXITY.MODERATE;
  };
  
  /**
   * Get full repair cost estimate with complexity determination
   */
  export const getRepairCostEstimate = (
    diagnostic: {
      diagnosis_summary?: string;
      probable_causes?: string[];
      fix_instructions?: string;
    },
    countryCode: string
  ): RepairCostEstimate => {
    const complexity = determineComplexity(diagnostic);
    const costData = calculateRepairCost(complexity, countryCode);
    
    return {
      ...costData,
      complexity
    };
  };
  
  /**
   * Get complexity label and styling info
   */
  export const getComplexityInfo = (complexity: RepairComplexity) => {
    const complexityLabels = {
      [REPAIR_COMPLEXITY.MINOR]: { 
        label: 'Minor Repair', 
        color: 'text-green-600', 
        bg: 'bg-green-50',
        description: 'Simple maintenance or adjustment'
      },
      [REPAIR_COMPLEXITY.MODERATE]: { 
        label: 'Moderate Repair', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50',
        description: 'Parts replacement or standard service'
      },
      [REPAIR_COMPLEXITY.MAJOR]: { 
        label: 'Major Repair', 
        color: 'text-red-600', 
        bg: 'bg-red-50',
        description: 'Component replacement or complex fix'
      }
    };
    
    return complexityLabels[complexity];
  };
  
  /**
   * Get available countries list
   */
  export const getAvailableCountries = () => {
    return Object.entries(COUNTRY_MULTIPLIERS).map(([code, data]) => ({
      code,
      name: data.name,
      currency: data.currency
    }));
  };
  
  /**
   * Validate country code
   */
  export const isValidCountryCode = (code: string): boolean => {
    return code in COUNTRY_MULTIPLIERS;
  };
  
  /**
   * Get country data by code
   */
  export const getCountryData = (code: string): CountryData => {
    return COUNTRY_MULTIPLIERS[code] || DEFAULT_PRICING;
  };