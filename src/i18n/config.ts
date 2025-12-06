import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

// Detect browser language and map to supported languages
const detectBrowserLanguage = (): string => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) return savedLanguage;

  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Map browser language to supported languages
  const supportedLanguages = ['en', 'es', 'fr', 'pt'];
  if (supportedLanguages.includes(langCode)) {
    return langCode;
  }

  // Fallback to English
  return 'en';
};

const detectedLanguage = detectBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      pt: { translation: pt },
    },
    lng: detectedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];
