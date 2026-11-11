// LanguageContext.tsx
"use client";
import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  createContext,
  ReactNode,
  useCallback,
} from "react";
import { getTitleFromValue } from "./Languages";

// Translation files
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import odi from "./locales/odi.json";
import tel from "./locales/tel.json";
import kan from "./locales/kan.json";
import tam from "./locales/tam.json";
import guj from "./locales/guj.json";

// Define translations object
const translations: Record<string, Record<string, string>> = {
  // @ts-ignore
  en,
  // @ts-ignore
  hi,
  // @ts-ignore
  mr,
  // @ts-ignore
  odi,
  // @ts-ignore
  tel,
  // @ts-ignore
  kan,
  // @ts-ignore
  tam,
  // @ts-ignore
  guj,
};

// Define RTL languages
const rtlLanguages = ["ur"];

// Define context type
export type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: { [key: string]: any; defaultValue?: string }) => string;
  rtlLanguages: string[];
};

// Create context
export const LanguageContext = createContext<LanguageContextType | null>(null);

// Props type for provider
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<string>("en");

  // Load saved language preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("lang");
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      } else {
        const browserLanguage = navigator.language;
        const title = getTitleFromValue(browserLanguage);
        if (title) {
          localStorage.setItem("lang", title);
          setLanguageState(title);
        } else {
          localStorage.setItem("lang", "en");
          setLanguageState("en");
        }
      }
    }
  }, []);

  // Translate function
  const t = useMemo(() => {
    return (key: string, options?: { [key: string]: any; defaultValue?: string }): string => {
      const getNestedValue = (lang: string) => {
        const keys = key?.split(".");
        let result: any = translations[lang];
        if (keys) {
          for (const k of keys) {
            if (result?.[k] === undefined) {
              return undefined;
            }
            result = result[k];
          }
        }
        return typeof result === "string" ? result : undefined;
      };

      // Try the current language first
      const currentLangValue = getNestedValue(language);
      let translated = currentLangValue;

      // Fallback to English if not found
      if (translated === undefined) {
        translated = getNestedValue("en");
      }

      if (translated === undefined) {
        return options?.defaultValue ?? key;
      }

      // Handle interpolation {{key}}
      if (options) {
        Object.keys(options).forEach((optKey) => {
          if (optKey !== 'defaultValue') {
            const regex = new RegExp(`{{${optKey}}}`, 'g');
            translated = (translated as string).replace(regex, options[optKey]);
          }
        });
      }

      return translated as string;
    };
  }, [language]);

  // Handle language switch (simple version — no confirmation)
  const handleLanguageChange = useCallback((newLanguage: string) => {
    if (!translations[newLanguage]) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLanguage);
    }
    setLanguageState(newLanguage);
  }, []);

  // Memoized context value
  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage: handleLanguageChange,
      t,
      rtlLanguages,
    }),
    [language, handleLanguageChange, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook
export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);

  if (!context) {
    const stack = new Error().stack;
    throw new Error(
      `useTranslation must be used within a LanguageProvider.\nCall stack:\n${stack}`
    );
  }
  return context;
};
