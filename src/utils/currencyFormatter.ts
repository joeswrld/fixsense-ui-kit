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