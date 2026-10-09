"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n";

interface CinemaShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CinemaShortcutsModal({ isOpen, onClose }: CinemaShortcutsModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Ajuste de ciclo de vida durante el renderizado (patrón oficial de React para props cambiantes)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setIsExiting(true);
    } else {
      setIsExiting(false);
    }
  }

  const isRendered = isOpen || isExiting;
  const isAnimatingIn = isOpen && !isExiting;

  // Temporizador ultrarrápido para la animación de salida (120ms) antes de desmontar del DOM
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isExiting]);

  // Bloqueo de desplazamiento del fondo y foco mientras el modal está activo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      modalContainerRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cierre inmediato con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const { t, locale } = useLanguage();

  if (!isRendered) return null;

  const shortcuts = [
    {
      keys: [locale === "es" ? "Espacio" : "Space", "K"],
      action: t("shortcuts.playPause"),
      desc: t("shortcuts.playPauseDesc"),
    },
    {
      keys: ["J", "←"],
      action: t("shortcuts.rewind"),
      desc: t("shortcuts.rewindDesc"),
    },
    {
      keys: ["L", "→"],
      action: t("shortcuts.forward"),
      desc: t("shortcuts.forwardDesc"),
    },
    {
      keys: ["M"],
      action: t("shortcuts.mute"),
      desc: t("shortcuts.muteDesc"),
    },
    {
      keys: ["F"],
      action: t("shortcuts.fullscreen"),
      desc: t("shortcuts.fullscreenDesc"),
    },
    {
      keys: ["P"],
      action: t("shortcuts.pip"),
      desc: t("shortcuts.pipDesc"),
    },
    {
      keys: ["?"],
      action: t("shortcuts.guide"),
      desc: t("shortcuts.guideDesc"),
    },
    {
      keys: ["Esc"],
      action: t("shortcuts.close"),
      desc: t("shortcuts.closeDesc"),
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-150 ${
        isAnimatingIn ? "animate-modal-backdrop-in" : "animate-modal-backdrop-out"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        className={`relative w-full max-w-xl bg-cinema-card border border-cinema-border-emerald rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(30,215,96,0.2)] text-white overflow-hidden outline-none ${
          isAnimatingIn ? "animate-modal-content-in" : "animate-modal-content-out"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grano de celuloide y resplandor sutil */}
        <div className="film-grain absolute inset-0 pointer-events-none opacity-[0.03]" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cinema-emerald/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-6 border-b border-white/10 pb-4">
          <div>
            <div className="gala-badge mb-2">
              <span className="gala-badge-dot" />
              <span className="gala-badge-text">{t("shortcuts.badge")}</span>
            </div>
            <h2
              id="shortcuts-modal-title"
              className="text-2xl md:text-3xl font-editorial font-bold text-white tracking-tight flex items-center gap-2"
            >
              {t("shortcuts.title")}
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1 font-light">
              {t("shortcuts.desc")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t("shortcuts.close")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de Atajos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-cinema-border-emerald transition-colors"
            >
              <div className="flex-1 pr-3">
                <span className="text-sm font-medium text-white block">
                  {sc.action}
                </span>
                <span className="text-[11px] text-gray-400 font-light block leading-tight">
                  {sc.desc}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-none">
                {sc.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-cinema-black border border-cinema-emerald/40 text-cinema-emerald font-mono text-xs font-semibold shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pie con botón de confirmación */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            {t("shortcuts.pressToExit")}
          </span>
          <button
            onClick={onClose}
            className="btn-cinema-primary px-5 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            {t("shortcuts.understood")}
          </button>
        </div>
      </div>
    </div>
  );
}
