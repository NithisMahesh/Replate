import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PublicLanguage,
  AppUiStrings,
  APP_UI_STRINGS,
} from './publicDonateTranslations';

interface LanguageContextValue {
  language: PublicLanguage;
  setLanguage: (lang: PublicLanguage) => void;
  toggleLanguage: () => void;
  t: AppUiStrings;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<PublicLanguage>(() => {
    try {
      const saved = localStorage.getItem('replate_app_language');
      if (saved === 'ta' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: PublicLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('replate_app_language', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const t = APP_UI_STRINGS[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: APP_UI_STRINGS.en,
    };
  }
  return context;
}
