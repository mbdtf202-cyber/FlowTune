import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Force English language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Remove language detection, always use English
    // detection: {
    //   order: ['localStorage', 'navigator', 'htmlTag'],
    //   caches: ['localStorage'],
    // }
  });

export default i18n;