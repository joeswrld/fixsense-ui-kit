// ============================================================
// lib/countryPricing.ts
// Country-Native Repair Cost Estimation System
// 
// CORE PRINCIPLE: All prices are defined in local currency
// based on actual market rates. NO exchange rate conversions.
// ============================================================

export const REPAIR_COMPLEXITY = {
    MINOR: 'minor',
    MODERATE: 'moderate',
    MAJOR: 'major'
  } as const;
  
  export type RepairComplexity = typeof REPAIR_COMPLEXITY[keyof typeof REPAIR_COMPLEXITY];
  
  // ============================================================
  // COUNTRY-NATIVE PRICING DATA
  // Each country defines repair costs in LOCAL currency based on
  // actual market rates charged by technicians in that country.
  // ============================================================
  
  interface RepairPricing {
    minor: { min: number; max: number };
    moderate: { min: number; max: number };
    major: { min: number; max: number };
  }
  
  export interface CountryData {
    name: string;
    currency: string;
    symbol: string;
    locale: string;
    pricing: RepairPricing;
  }
  
  export const COUNTRY_PRICING: Record<string, CountryData> = {
    // ============================================================
    // WEST AFRICA
    // ============================================================
    NG: {
      name: 'Nigeria',
      currency: 'NGN',
      symbol: '₦',
      locale: 'en-NG',
      pricing: {
        minor: { min: 5000, max: 15000 },
        moderate: { min: 18000, max: 45000 },
        major: { min: 60000, max: 150000 }
      }
    },
    GH: {
      name: 'Ghana',
      currency: 'GHS',
      symbol: '₵',
      locale: 'en-GH',
      pricing: {
        minor: { min: 120, max: 300 },
        moderate: { min: 350, max: 900 },
        major: { min: 1200, max: 3000 }
      }
    },
    SN: {
      name: 'Senegal',
      currency: 'XOF',
      symbol: 'CFA',
      locale: 'fr-SN',
      pricing: {
        minor: { min: 8000, max: 20000 },
        moderate: { min: 25000, max: 60000 },
        major: { min: 80000, max: 200000 }
      }
    },
    CI: {
      name: "Côte d'Ivoire",
      currency: 'XOF',
      symbol: 'CFA',
      locale: 'fr-CI',
      pricing: {
        minor: { min: 10000, max: 25000 },
        moderate: { min: 30000, max: 70000 },
        major: { min: 90000, max: 220000 }
      }
    },
  
    // ============================================================
    // EAST AFRICA
    // ============================================================
    KE: {
      name: 'Kenya',
      currency: 'KES',
      symbol: 'KSh',
      locale: 'en-KE',
      pricing: {
        minor: { min: 2000, max: 6000 },
        moderate: { min: 7000, max: 18000 },
        major: { min: 25000, max: 60000 }
      }
    },
    TZ: {
      name: 'Tanzania',
      currency: 'TZS',
      symbol: 'TSh',
      locale: 'sw-TZ',
      pricing: {
        minor: { min: 50000, max: 150000 },
        moderate: { min: 180000, max: 450000 },
        major: { min: 600000, max: 1500000 }
      }
    },
    UG: {
      name: 'Uganda',
      currency: 'UGX',
      symbol: 'USh',
      locale: 'en-UG',
      pricing: {
        minor: { min: 80000, max: 200000 },
        moderate: { min: 250000, max: 600000 },
        major: { min: 800000, max: 2000000 }
      }
    },
    RW: {
      name: 'Rwanda',
      currency: 'RWF',
      symbol: 'FRw',
      locale: 'rw-RW',
      pricing: {
        minor: { min: 15000, max: 40000 },
        moderate: { min: 50000, max: 120000 },
        major: { min: 150000, max: 400000 }
      }
    },
    ET: {
      name: 'Ethiopia',
      currency: 'ETB',
      symbol: 'Br',
      locale: 'am-ET',
      pricing: {
        minor: { min: 1000, max: 3000 },
        moderate: { min: 3500, max: 9000 },
        major: { min: 12000, max: 30000 }
      }
    },
  
    // ============================================================
    // SOUTHERN AFRICA
    // ============================================================
    ZA: {
      name: 'South Africa',
      currency: 'ZAR',
      symbol: 'R',
      locale: 'en-ZA',
      pricing: {
        minor: { min: 400, max: 1000 },
        moderate: { min: 1200, max: 3000 },
        major: { min: 4000, max: 10000 }
      }
    },
    BW: {
      name: 'Botswana',
      currency: 'BWP',
      symbol: 'P',
      locale: 'en-BW',
      pricing: {
        minor: { min: 300, max: 800 },
        moderate: { min: 900, max: 2200 },
        major: { min: 3000, max: 7500 }
      }
    },
    ZM: {
      name: 'Zambia',
      currency: 'ZMW',
      symbol: 'ZK',
      locale: 'en-ZM',
      pricing: {
        minor: { min: 500, max: 1200 },
        moderate: { min: 1500, max: 3500 },
        major: { min: 4500, max: 11000 }
      }
    },
  
    // ============================================================
    // NORTH AFRICA
    // ============================================================
    EG: {
      name: 'Egypt',
      currency: 'EGP',
      symbol: '£',
      locale: 'ar-EG',
      pricing: {
        minor: { min: 500, max: 1500 },
        moderate: { min: 1800, max: 4500 },
        major: { min: 6000, max: 15000 }
      }
    },
    MA: {
      name: 'Morocco',
      currency: 'MAD',
      symbol: 'د.م.',
      locale: 'ar-MA',
      pricing: {
        minor: { min: 200, max: 500 },
        moderate: { min: 600, max: 1400 },
        major: { min: 1800, max: 4500 }
      }
    },
    DZ: {
      name: 'Algeria',
      currency: 'DZD',
      symbol: 'د.ج',
      locale: 'ar-DZ',
      pricing: {
        minor: { min: 3000, max: 8000 },
        moderate: { min: 10000, max: 25000 },
        major: { min: 32000, max: 80000 }
      }
    },
  
    // ============================================================
    // NORTH AMERICA
    // ============================================================
    US: {
      name: 'United States',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 90, max: 180 },
        moderate: { min: 250, max: 600 },
        major: { min: 700, max: 1500 }
      }
    },
    CA: {
      name: 'Canada',
      currency: 'CAD',
      symbol: 'C$',
      locale: 'en-CA',
      pricing: {
        minor: { min: 110, max: 220 },
        moderate: { min: 300, max: 700 },
        major: { min: 850, max: 1800 }
      }
    },
    MX: {
      name: 'Mexico',
      currency: 'MXN',
      symbol: '$',
      locale: 'es-MX',
      pricing: {
        minor: { min: 400, max: 1000 },
        moderate: { min: 1200, max: 3000 },
        major: { min: 4000, max: 10000 }
      }
    },
  
    // ============================================================
    // SOUTH AMERICA
    // ============================================================
    BR: {
      name: 'Brazil',
      currency: 'BRL',
      symbol: 'R$',
      locale: 'pt-BR',
      pricing: {
        minor: { min: 150, max: 350 },
        moderate: { min: 400, max: 1000 },
        major: { min: 1300, max: 3000 }
      }
    },
    AR: {
      name: 'Argentina',
      currency: 'ARS',
      symbol: '$',
      locale: 'es-AR',
      pricing: {
        minor: { min: 8000, max: 20000 },
        moderate: { min: 25000, max: 60000 },
        major: { min: 80000, max: 200000 }
      }
    },
    CL: {
      name: 'Chile',
      currency: 'CLP',
      symbol: '$',
      locale: 'es-CL',
      pricing: {
        minor: { min: 30000, max: 70000 },
        moderate: { min: 85000, max: 200000 },
        major: { min: 250000, max: 600000 }
      }
    },
    CO: {
      name: 'Colombia',
      currency: 'COP',
      symbol: '$',
      locale: 'es-CO',
      pricing: {
        minor: { min: 100000, max: 250000 },
        moderate: { min: 300000, max: 700000 },
        major: { min: 900000, max: 2200000 }
      }
    },
  
    // ============================================================
    // EUROPE
    // ============================================================
    GB: {
      name: 'United Kingdom',
      currency: 'GBP',
      symbol: '£',
      locale: 'en-GB',
      pricing: {
        minor: { min: 60, max: 120 },
        moderate: { min: 150, max: 350 },
        major: { min: 400, max: 900 }
      }
    },
    DE: {
      name: 'Germany',
      currency: 'EUR',
      symbol: '€',
      locale: 'de-DE',
      pricing: {
        minor: { min: 70, max: 140 },
        moderate: { min: 170, max: 400 },
        major: { min: 500, max: 1100 }
      }
    },
    FR: {
      name: 'France',
      currency: 'EUR',
      symbol: '€',
      locale: 'fr-FR',
      pricing: {
        minor: { min: 75, max: 150 },
        moderate: { min: 180, max: 420 },
        major: { min: 520, max: 1200 }
      }
    },
    IT: {
      name: 'Italy',
      currency: 'EUR',
      symbol: '€',
      locale: 'it-IT',
      pricing: {
        minor: { min: 65, max: 135 },
        moderate: { min: 160, max: 380 },
        major: { min: 480, max: 1050 }
      }
    },
    ES: {
      name: 'Spain',
      currency: 'EUR',
      symbol: '€',
      locale: 'es-ES',
      pricing: {
        minor: { min: 60, max: 130 },
        moderate: { min: 150, max: 360 },
        major: { min: 450, max: 1000 }
      }
    },
    NL: {
      name: 'Netherlands',
      currency: 'EUR',
      symbol: '€',
      locale: 'nl-NL',
      pricing: {
        minor: { min: 75, max: 145 },
        moderate: { min: 175, max: 410 },
        major: { min: 510, max: 1150 }
      }
    },
    PL: {
      name: 'Poland',
      currency: 'PLN',
      symbol: 'zł',
      locale: 'pl-PL',
      pricing: {
        minor: { min: 150, max: 350 },
        moderate: { min: 400, max: 1000 },
        major: { min: 1300, max: 3000 }
      }
    },
  
    // ============================================================
    // ASIA
    // ============================================================
    IN: {
      name: 'India',
      currency: 'INR',
      symbol: '₹',
      locale: 'en-IN',
      pricing: {
        minor: { min: 800, max: 2000 },
        moderate: { min: 2500, max: 6000 },
        major: { min: 8000, max: 18000 }
      }
    },
    CN: {
      name: 'China',
      currency: 'CNY',
      symbol: '¥',
      locale: 'zh-CN',
      pricing: {
        minor: { min: 150, max: 350 },
        moderate: { min: 400, max: 1000 },
        major: { min: 1300, max: 3000 }
      }
    },
    JP: {
      name: 'Japan',
      currency: 'JPY',
      symbol: '¥',
      locale: 'ja-JP',
      pricing: {
        minor: { min: 8000, max: 18000 },
        moderate: { min: 22000, max: 50000 },
        major: { min: 65000, max: 150000 }
      }
    },
    KR: {
      name: 'South Korea',
      currency: 'KRW',
      symbol: '₩',
      locale: 'ko-KR',
      pricing: {
        minor: { min: 80000, max: 180000 },
        moderate: { min: 220000, max: 500000 },
        major: { min: 650000, max: 1500000 }
      }
    },
    SG: {
      name: 'Singapore',
      currency: 'SGD',
      symbol: 'S$',
      locale: 'en-SG',
      pricing: {
        minor: { min: 100, max: 200 },
        moderate: { min: 250, max: 600 },
        major: { min: 750, max: 1600 }
      }
    },
    MY: {
      name: 'Malaysia',
      currency: 'MYR',
      symbol: 'RM',
      locale: 'ms-MY',
      pricing: {
        minor: { min: 150, max: 350 },
        moderate: { min: 400, max: 1000 },
        major: { min: 1300, max: 3000 }
      }
    },
    TH: {
      name: 'Thailand',
      currency: 'THB',
      symbol: '฿',
      locale: 'th-TH',
      pricing: {
        minor: { min: 1000, max: 2500 },
        moderate: { min: 3000, max: 7000 },
        major: { min: 9000, max: 20000 }
      }
    },
    PH: {
      name: 'Philippines',
      currency: 'PHP',
      symbol: '₱',
      locale: 'fil-PH',
      pricing: {
        minor: { min: 1500, max: 3500 },
        moderate: { min: 4000, max: 10000 },
        major: { min: 13000, max: 30000 }
      }
    },
    ID: {
      name: 'Indonesia',
      currency: 'IDR',
      symbol: 'Rp',
      locale: 'id-ID',
      pricing: {
        minor: { min: 300000, max: 700000 },
        moderate: { min: 850000, max: 2000000 },
        major: { min: 2500000, max: 6000000 }
      }
    },
    VN: {
      name: 'Vietnam',
      currency: 'VND',
      symbol: '₫',
      locale: 'vi-VN',
      pricing: {
        minor: { min: 500000, max: 1200000 },
        moderate: { min: 1500000, max: 3500000 },
        major: { min: 4500000, max: 10000000 }
      }
    },
    PK: {
      name: 'Pakistan',
      currency: 'PKR',
      symbol: '₨',
      locale: 'ur-PK',
      pricing: {
        minor: { min: 3000, max: 7000 },
        moderate: { min: 8500, max: 20000 },
        major: { min: 25000, max: 60000 }
      }
    },
    BD: {
      name: 'Bangladesh',
      currency: 'BDT',
      symbol: '৳',
      locale: 'bn-BD',
      pricing: {
        minor: { min: 2000, max: 5000 },
        moderate: { min: 6000, max: 15000 },
        major: { min: 20000, max: 45000 }
      }
    },
  
    // ============================================================
    // MIDDLE EAST
    // ============================================================
    AE: {
      name: 'United Arab Emirates',
      currency: 'AED',
      symbol: 'د.إ',
      locale: 'ar-AE',
      pricing: {
        minor: { min: 250, max: 500 },
        moderate: { min: 600, max: 1500 },
        major: { min: 2000, max: 4500 }
      }
    },
    SA: {
      name: 'Saudi Arabia',
      currency: 'SAR',
      symbol: 'ر.س',
      locale: 'ar-SA',
      pricing: {
        minor: { min: 300, max: 600 },
        moderate: { min: 700, max: 1700 },
        major: { min: 2200, max: 5000 }
      }
    },
    QA: {
      name: 'Qatar',
      currency: 'QAR',
      symbol: 'ر.ق',
      locale: 'ar-QA',
      pricing: {
        minor: { min: 300, max: 650 },
        moderate: { min: 750, max: 1800 },
        major: { min: 2300, max: 5200 }
      }
    },
    IL: {
      name: 'Israel',
      currency: 'ILS',
      symbol: '₪',
      locale: 'he-IL',
      pricing: {
        minor: { min: 250, max: 550 },
        moderate: { min: 650, max: 1500 },
        major: { min: 1900, max: 4300 }
      }
    },
  
    // ============================================================
    // AUSTRALIA & OCEANIA
    // ============================================================
    AU: {
      name: 'Australia',
      currency: 'AUD',
      symbol: 'A$',
      locale: 'en-AU',
      pricing: {
        minor: { min: 120, max: 240 },
        moderate: { min: 300, max: 700 },
        major: { min: 900, max: 2000 }
      }
    },
    NZ: {
      name: 'New Zealand',
      currency: 'NZD',
      symbol: 'NZ$',
      locale: 'en-NZ',
      pricing: {
        minor: { min: 130, max: 260 },
        moderate: { min: 320, max: 750 },
        major: { min: 950, max: 2100 }
      }
    }
  };
  
  // ============================================================
  // REGIONAL FALLBACK PRICING
  // Used when specific country is not in database
  // ============================================================
  
  export const REGIONAL_PRICING: Record<string, CountryData> = {
    'West Africa': {
      name: 'West Africa (Regional Average)',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 15, max: 35 },
        moderate: { min: 40, max: 90 },
        major: { min: 120, max: 280 }
      }
    },
    'East Africa': {
      name: 'East Africa (Regional Average)',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 12, max: 30 },
        moderate: { min: 35, max: 80 },
        major: { min: 100, max: 250 }
      }
    },
    'Southern Africa': {
      name: 'Southern Africa (Regional Average)',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 20, max: 45 },
        moderate: { min: 50, max: 120 },
        major: { min: 150, max: 350 }
      }
    },
    'Europe': {
      name: 'Europe (Regional Average)',
      currency: 'EUR',
      symbol: '€',
      locale: 'en-EU',
      pricing: {
        minor: { min: 70, max: 140 },
        moderate: { min: 170, max: 400 },
        major: { min: 500, max: 1100 }
      }
    },
    'Asia': {
      name: 'Asia (Regional Average)',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 18, max: 40 },
        moderate: { min: 45, max: 110 },
        major: { min: 140, max: 320 }
      }
    },
    'Middle East': {
      name: 'Middle East (Regional Average)',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 65, max: 130 },
        moderate: { min: 150, max: 350 },
        major: { min: 450, max: 1000 }
      }
    },
    'Global': {
      name: 'Global Average',
      currency: 'USD',
      symbol: '$',
      locale: 'en-US',
      pricing: {
        minor: { min: 50, max: 100 },
        moderate: { min: 120, max: 300 },
        major: { min: 400, max: 900 }
      }
    }
  };
  
  // ============================================================
  // PRICING CALCULATION FUNCTIONS
  // ============================================================
  
  export interface RepairCostEstimate {
    min: number;
    max: number;
    currency: string;
    symbol: string;
    countryName: string;
    isRegionalFallback: boolean;
    complexity: RepairComplexity;
  }
  
  /**
   * Get country pricing data (with fallback to regional/global)
   */
  export const getCountryData = (countryCode: string): CountryData => {
    return COUNTRY_PRICING[countryCode] || REGIONAL_PRICING['Global'];
  };
  
  /**
   * Format price with locale-specific formatting
   */
  export const formatCurrency = (value: number, countryCode: string): string => {
    const pricing = getCountryData(countryCode);
    
    try {
      return new Intl.NumberFormat(pricing.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
      }).format(value);
    } catch {
      // Fallback if locale formatting fails
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
  };
  
  /**
   * Calculate repair cost based on complexity and country
   * Uses NATIVE pricing - NO exchange rate conversions
   */
  export const calculateRepairCost = (
    complexity: RepairComplexity,
    countryCode: string
  ): Omit<RepairCostEstimate, 'complexity'> => {
    const countryData = getCountryData(countryCode);
    const range = countryData.pricing[complexity];
  
    return {
      min: range.min,
      max: range.max,
      currency: countryData.currency,
      symbol: countryData.symbol,
      countryName: countryData.name,
      isRegionalFallback: !COUNTRY_PRICING[countryCode]
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
      'unplug', 'replug', 'simple', 'quick', 'straightforward',
      'basic', 'easy', 'minor'
    ];
  
    // Keywords indicating major repairs
    const majorKeywords = [
      'replace', 'replacement', 'component', 'motor', 'compressor',
      'circuit', 'board', 'electrical', 'mechanical', 'wiring',
      'professional', 'technician', 'specialist', 'complex',
      'expensive', 'major', 'significant', 'extensive', 'overhaul',
      'rebuild', 'install', 'installation'
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
        border: 'border-green-200',
        description: 'Simple maintenance or adjustment'
      },
      [REPAIR_COMPLEXITY.MODERATE]: {
        label: 'Moderate Repair',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        description: 'Parts replacement or standard service'
      },
      [REPAIR_COMPLEXITY.MAJOR]: {
        label: 'Major Repair',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        description: 'Component replacement or complex fix'
      }
    };
  
    return complexityLabels[complexity];
  };
  
  /**
   * Get list of all available countries
   */
  export const getAvailableCountries = () => {
    return Object.entries(COUNTRY_PRICING)
      .map(([code, data]) => ({
        code,
        name: data.name,
        currency: data.currency,
        symbol: data.symbol
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  /**
   * Validate country code
   */
  export const isValidCountryCode = (code: string): boolean => {
    return code in COUNTRY_PRICING;
  };
  
  /**
   * Get pricing for a specific complexity level
   */
  export const getPricingByComplexity = (
    countryCode: string,
    complexity: RepairComplexity
  ) => {
    const countryData = getCountryData(countryCode);
    return countryData.pricing[complexity];
  };