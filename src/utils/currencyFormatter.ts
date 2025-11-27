// src/utils/currencyFormatter.ts

interface CurrencyConfig {
    symbol: string;
    code: string;
    locale: string;
  }
  
  const currencyConfigs: Record<string, CurrencyConfig> = {
    USD: { symbol: '$', code: 'USD', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', locale: 'en-EU' },
    GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
    JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP' },
    CAD: { symbol: 'C$', code: 'CAD', locale: 'en-CA' },
    AUD: { symbol: 'A$', code: 'AUD', locale: 'en-AU' },
    CHF: { symbol: 'CHF', code: 'CHF', locale: 'de-CH' },
    CNY: { symbol: '¥', code: 'CNY', locale: 'zh-CN' },
    INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
    NGN: { symbol: '₦', code: 'NGN', locale: 'en-NG' },
    ZAR: { symbol: 'R', code: 'ZAR', locale: 'en-ZA' }, // South African Rand
  EGP: { symbol: 'E£', code: 'EGP', locale: 'ar-EG' }, // Egyptian Pound
  KES: { symbol: 'KSh', code: 'KES', locale: 'en-KE' }, // Kenyan Shilling
  GHS: { symbol: '₵', code: 'GHS', locale: 'en-GH' }, // Ghanaian Cedi
  TZS: { symbol: 'TSh', code: 'TZS', locale: 'sw-TZ' }, // Tanzanian Shilling
  UGX: { symbol: 'USh', code: 'UGX', locale: 'en-UG' }, // Ugandan Shilling
  MAD: { symbol: 'DH', code: 'MAD', locale: 'ar-MA' }, // Moroccan Dirham
  ETB: { symbol: 'Br', code: 'ETB', locale: 'am-ET' }, // Ethiopian Birr
  XOF: { symbol: 'CFA', code: 'XOF', locale: 'fr-SN' }, // West African CFA Franc
  XAF: { symbol: 'FCFA', code: 'XAF', locale: 'fr-CM' }, // Central African CFA Franc
  BWP: { symbol: 'P', code: 'BWP', locale: 'en-BW' }, // Botswana Pula
  MUR: { symbol: '₨', code: 'MUR', locale: 'en-MU' }, // Mauritian Rupee
  ZMW: { symbol: 'ZK', code: 'ZMW', locale: 'en-ZM' }, // Zambian Kwacha
  AOA: { symbol: 'Kz', code: 'AOA', locale: 'pt-AO' }, // Angolan Kwanza
  RWF: { symbol: 'FRw', code: 'RWF', locale: 'rw-RW' }, // Rwandan Franc
    
  };
  
  export const formatCurrency = (
    amount: number,
    currencyCode: string = 'USD',
    showSymbol: boolean = true
  ): string => {
    const config = currencyConfigs[currencyCode] || currencyConfigs.USD;
    
    try {
      const formatted = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      
      return formatted;
    } catch (error) {
      // Fallback formatting
      return `${showSymbol ? config.symbol : ''}${amount.toFixed(2)}`;
    }
  };
  
  export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
    const config = currencyConfigs[currencyCode] || currencyConfigs.USD;
    return config.symbol;
  };