"use client";

import React, { createContext, useContext, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { Locale, Translations } from "./types";
import { es } from "./locales/es";
import { en } from "./locales/en";

import genresList from "@/data/genres.json";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Translations;
  t: (path: string, params?: Record<string, string | number>) => string;
  translateGenre: (genre: string) => string;
  getVideoDescription: (video: { description: string; description_en?: string }) => string;
  getVideoGenres: (video: { genres: string[]; genres_en?: string[] }) => string[];
  isInitialized: boolean;
}

const dictionaries: Record<Locale, Translations> = {
  es,
  en,
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "animatrix_language";
const LOCALE_EVENT = "animatrix_locale_change";

/**
 * Determina el idioma por defecto:
 * 1. Preferencia guardada en localStorage
 * 2. Idioma del navegador: si empieza con 'es' (ej. es, es-ES, es-MX) -> 'es'
 * 3. En cualquier otro caso (inglés u otro idioma) -> 'en' por defecto
 */
function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") {
      return saved;
    }

    const browserLang = (navigator.language || (navigator as { userLanguage?: string }).userLanguage || "").toLowerCase();
    if (browserLang.startsWith("es")) {
      return "es";
    }
    return "en";
  } catch {
    return "en";
  }
}

function subscribeLocale(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getLocaleSnapshot(): Locale {
  return detectBrowserLocale();
}

function getServerLocaleSnapshot(): Locale {
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      window.dispatchEvent(new Event(LOCALE_EVENT));
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const translations = useMemo(() => dictionaries[locale] || dictionaries.en, [locale]);

  /**
   * Resuelve claves anidadas con sintaxis de punto (ej. "nav.home") e interpolación ({count})
   */
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split(".");
      let current: unknown = translations;

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          // Fallback a inglés si la clave no existe en el idioma activo
          let fallback: unknown = dictionaries.en;
          for (const fk of keys) {
            if (fallback && typeof fallback === "object" && fk in fallback) {
              fallback = (fallback as Record<string, unknown>)[fk];
            } else {
              fallback = path;
            }
          }
          current = fallback;
          break;
        }
      }

      if (typeof current !== "string") {
        return path;
      }

      if (!params) {
        return current;
      }

      return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      }, current);
    },
    [translations]
  );

  /**
   * Traduce el nombre de un género cinematográfico conectando directamente con genres.json
   */
  const translateGenre = useCallback(
    (genreName: string): string => {
      if (!genreName) return "";

      const normalized = genreName.trim().toLowerCase();
      const matchedGenre = genresList.find(
        (g) =>
          g.name.toLowerCase() === normalized ||
          g.id.toLowerCase() === normalized ||
          (g.name_en && g.name_en.toLowerCase() === normalized)
      );

      if (matchedGenre) {
        return locale === "en" ? (matchedGenre.name_en || matchedGenre.name) : matchedGenre.name;
      }

      return translations.genresMap[genreName] || genreName;
    },
    [locale, translations]
  );

  /**
   * Obtiene la descripción del video según el idioma activo (description_en vs description)
   */
  const getVideoDescription = useCallback(
    (video: { description: string; description_en?: string }): string => {
      if (!video) return "";
      if (locale === "en" && video.description_en) {
        return video.description_en;
      }
      return video.description || "";
    },
    [locale]
  );

  /**
   * Obtiene los géneros del video según el idioma activo (genres_en vs genres)
   */
  const getVideoGenres = useCallback(
    (video: { genres: string[]; genres_en?: string[] }): string[] => {
      if (!video) return [];
      if (locale === "en" && video.genres_en && video.genres_en.length > 0) {
        return video.genres_en;
      }
      return video.genres || [];
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      translations,
      t,
      translateGenre,
      getVideoDescription,
      getVideoGenres,
      isInitialized: true,
    }),
    [locale, setLocale, translations, t, translateGenre, getVideoDescription, getVideoGenres]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export function useLanguage() {
  return useTranslation();
}
