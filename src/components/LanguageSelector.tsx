"use client";

import React from "react";
import { useLanguage, Locale } from "@/i18n";

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Icono de Globo terráqueo */}
      <div className="absolute left-2.5 pointer-events-none text-gray-400 group-hover:text-cinema-emerald">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.7}
          stroke="currentColor"
          className="w-3.5 h-3.5 md:w-4 md:h-4 text-cinema-emerald/80"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      </div>

      {/* Select estilizado */}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("nav.language")}
        className="appearance-none bg-neutral-900/80 hover:bg-neutral-800 text-gray-200 text-xs md:text-xs font-semibold uppercase tracking-wider border border-neutral-700/70 hover:border-cinema-border-emerald focus:border-cinema-emerald rounded-full pl-7 md:pl-8 pr-6 md:pr-7 py-1.5 focus:outline-none transition-all shadow-inner cursor-pointer"
      >
        <option value="es" className="bg-cinema-card text-white">
          ES
        </option>
        <option value="en" className="bg-cinema-card text-white">
          EN
        </option>
      </select>

      {/* Flecha hacia abajo personalizada */}
      <div className="absolute right-2.5 pointer-events-none text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-2.5 h-2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
}
