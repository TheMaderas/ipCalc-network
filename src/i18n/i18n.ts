import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationPT from './locales/pt.json';
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';

// Translation resources
const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  },
  de: {
    translation: translationDE
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // not needed for React
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // Make sure language codes are consistent
    load: 'languageOnly', // Will load 'pt' instead of 'pt-BR'
    lowerCaseLng: true,   // Will use 'pt' instead of 'PT'
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged', // Só precisamos deste evento
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'], // Which HTML elements to keep
    }
  });

// Export both as named export and default export for compatibility
export { i18n };
export default i18n;
