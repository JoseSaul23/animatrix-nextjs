"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { usePlayerController } from "./PlayerProvider";
import dynamic from "next/dynamic";
import { useLanguage } from "@/i18n";

const CinemaShortcutsModal = dynamic(() => import("./CinemaShortcutsModal"), {
  ssr: false,
});

export default function GlobalShortcuts() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const player = usePlayerController();

  // Hay una sesión de reproducción (visible como sala grande o como mini-ventana)
  const hasSession = useAppSelector((state) => state.player.activeVideo !== null);

  const toggleModal = useCallback(() => {
    setIsModalOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o elemento editable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Atajo '?' o 'Shift + /' para abrir/cerrar modal de atajos
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        toggleModal();
        return;
      }

      // Si la modal de atajos está abierta, gestionar escape y evitar disparar atajos de reproducción
      if (isModalOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setIsModalOpen(false);
        }
        return;
      }

      // Atajo 'Espacio' o 'K' para Play/Pausa.
      // Con sesión: el controlador decide y el estado real vuelve por los eventos de YouTube.
      // Sin sesión en /watch/: la página escucha este evento para iniciar la reproducción.
      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        if (hasSession) {
          e.preventDefault();
          player.togglePlay();
        } else if (pathname.startsWith("/watch/")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("animatrix:start-playback"));
        }
        return;
      }

      // Atajo 'J' o 'Flecha Izquierda' para retroceder 10s
      if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft") {
        if (hasSession) {
          e.preventDefault();
          player.seekBy(-10);
        }
        return;
      }

      // Atajo 'L' o 'Flecha Derecha' para avanzar 10s
      if (e.key === "l" || e.key === "L" || e.key === "ArrowRight") {
        if (hasSession) {
          e.preventDefault();
          player.seekBy(10);
        }
        return;
      }

      // Atajo 'M' para Silenciar / Desmutear
      if (e.key === "m" || e.key === "M") {
        if (hasSession) {
          e.preventDefault();
          player.toggleMute();
        }
        return;
      }

      // Atajo 'F' para Pantalla Completa
      if (e.key === "f" || e.key === "F") {
        if (hasSession) {
          e.preventDefault();
          player.toggleFullscreen();
        }
        return;
      }

      // Atajo 'P' para alternar entre sala grande y mini-reproductor
      if (e.key === "p" || e.key === "P") {
        if (hasSession) {
          e.preventDefault();
          player.toggleFloating();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleModal, hasSession, pathname, player, isModalOpen]);

  return (
    <>
      {isModalOpen && (
        <CinemaShortcutsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}

      {/* Botón flotante discreto de ayuda para abrir la guía de atajos */}
      <button
        onClick={toggleModal}
        className="fixed bottom-4 left-4 z-40 p-2 rounded-full bg-cinema-card/90 border border-cinema-border hover:border-cinema-border-emerald text-gray-400 hover:text-cinema-emerald transition-all duration-300 shadow-lg backdrop-blur-md group flex items-center gap-2 text-xs"
        title={t("globalShortcuts.tooltip")}
        aria-label={t("shortcuts.title")}
      >
        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-cinema-emerald text-[11px] group-hover:bg-cinema-emerald group-hover:text-black transition-colors">
          ?
        </span>
        <span className="hidden sm:inline-block pr-1 font-cinema text-[10px] uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">
          {t("globalShortcuts.controls")}
        </span>
      </button>
    </>
  );
}
