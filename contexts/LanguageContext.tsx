import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

type Translations = { [key: string]: any };
type Language = 'en' | 'fr';

// Helper to get nested properties from a string path
const getNestedTranslation = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: { [key: string]: string | number | HTMLElement }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'fr' ? 'fr' : 'en';
  });
  
  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enResponse, frResponse] = await Promise.all([
          fetch('/locales/en.json'),
          fetch('/locales/fr.json')
        ]);
        if (!enResponse.ok || !frResponse.ok) {
            throw new Error('Failed to fetch translation files');
        }
        const enData = await enResponse.json();
        const frData = await frResponse.json();
        setTranslations({ en: enData, fr: frData });
      } catch (error) {
        console.error("Failed to load translation files:", error);
      }
    };

    fetchTranslations();
  }, []);


  const t = useCallback((key: string, params?: { [key: string]: string | number }): string => {
    if (!translations) {
        // Return key or a loading indicator while translations are loading
        return key;
    }
    
    const langFile = translations[language];
    let translation = getNestedTranslation(langFile, key);

    if (translation === undefined) {
      console.warn(`Translation key "${key}" not found for language "${language}".`);
      // Fallback to English if key not found in current language
      const fallbackLangFile = translations['en'];
      translation = getNestedTranslation(fallbackLangFile, key);
      if(translation === undefined) {
        return key; // Return key if not found in English either
      }
    }

    if (params) {
      Object.keys(params).forEach(pKey => {
        const value = params[pKey];
        // The dangerouslySetInnerHTML replacement logic is handled where it's used,
        // this function will just replace placeholders with string values.
        translation = translation!.replace(`{${pKey}}`, String(value));
      });
    }

    return translation;
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
