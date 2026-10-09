"use client";

import { useLayoutEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import type { PlayerStatus } from "@/store/slices/playerSlice";
import { usePlayerController, usePlayerUi } from "@/components/PlayerProvider";
import { useLanguage } from "@/i18n";

/**
 * ============================================================================
 * FLOATING PLAYER — Superficie única y persistente del reproductor
 * ============================================================================
 * Este componente se monta UNA vez en `app/layout.tsx` y contiene el único
 * iframe de la app. No crea reproductores: solo decide DÓNDE se ve.
 *
 *  ┌ modo "floating" ┐  hay sesión y el usuario está en otra ruta
 *  │  mini-ventana fija abajo a la derecha, con cabecera (maximizar/cerrar)
 *  ├ modo "stage"    ┤  el usuario está en /watch/[id] de la sesión activa
 *  │  se superpone exactamente sobre el hueco que la página reserva
 *  │  (`registerStage`) y sigue sus cambios de tamaño/posición
 *  └ oculto          ┘  estamos en /watch/[id] pero el hueco aún no existe
 *                       (la página está cargando): el audio no se corta
 *
 * Como el elemento del iframe es el mismo en los tres modos (solo cambian clases
 * y estilos), el navegador NO lo recarga: el tiempo, la pausa y el fotograma
 * se conservan de forma natural al minimizar o maximizar.
 *
 * Nota de React: `attachSurface` entrega el <div> al engine, que inserta el
 * iframe como hijo imperativo. Ese <div> no tiene hijos de React a propósito.
 */

export default function FloatingPlayer() {
  const { t, locale } = useLanguage();
  const activeVideo = useAppSelector((state) => state.player.activeVideo);
  const isFloatingActive = useAppSelector((state) => state.player.isFloatingActive);
  const status = useAppSelector((state) => state.player.status);

  const { attachSurface, toggleFloating, close } = usePlayerController();
  const { stageElement, feedback } = usePlayerUi();

  const hostRef = useRef<HTMLDivElement>(null);

  const hasSession = activeVideo !== null;
  const isStage = !isFloatingActive && stageElement !== null;
  const isHidden = !isFloatingActive && !isStage;

  // Modo "stage": copiar posición y tamaño del hueco de /watch al host.
  // useLayoutEffect => se aplica antes de pintar, sin un frame en posición incorrecta.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!isStage || !stageElement) {
      // Volvemos a las clases (fixed/absolute) sin estilos en línea residuales.
      host.style.top = host.style.left = host.style.width = host.style.height = "";
      return;
    }

    const sync = () => {
      const rect = stageElement.getBoundingClientRect();
      // El host es `absolute`: se coloca en coordenadas del documento, así el scroll
      // lo mueve el propio navegador sin lag ni re-renders.
      const parent = host.offsetParent as HTMLElement | null;
      const origin = parent
        ? parent.getBoundingClientRect()
        : { left: -window.scrollX, top: -window.scrollY };
      host.style.top = `${rect.top - origin.top}px`;
      host.style.left = `${rect.left - origin.left}px`;
      host.style.width = `${rect.width}px`;
      host.style.height = `${rect.height}px`;
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(stageElement);
    observer.observe(document.body); // cambios de layout que desplazan el hueco
    window.addEventListener("resize", sync);
    // Red de seguridad para desplazamientos que ningún observer detecta (p. ej. imágenes tardías).
    const safetyTimer = setInterval(sync, 500);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      clearInterval(safetyTimer);
    };
  }, [isStage, stageElement, hasSession]);

  if (!activeVideo) return null;

  const statusLabels: Record<PlayerStatus, { text: string; dot: string; textColor: string }> = {
    PLAYING: {
      text: t("floatingPlayer.playing"),
      dot: "bg-cinema-emerald animate-pulse",
      textColor: "text-cinema-emerald",
    },
    BUFFERING: {
      text: locale === "es" ? "Cargando" : "Buffering",
      dot: "bg-amber-400 animate-pulse",
      textColor: "text-amber-300",
    },
    PAUSED: {
      text: t("floatingPlayer.paused"),
      dot: "bg-amber-400",
      textColor: "text-gray-400",
    },
    ENDED: {
      text: locale === "es" ? "Finalizado" : "Ended",
      dot: "bg-gray-500",
      textColor: "text-gray-400",
    },
    UNSTARTED: {
      text: locale === "es" ? "Preparando" : "Preparing",
      dot: "bg-gray-500 animate-pulse",
      textColor: "text-gray-400",
    },
  };

  const label = statusLabels[status];

  const hostClass = isStage
    ? "absolute z-30 rounded-none md:rounded-xl overflow-hidden border-y md:border border-white/5 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
    : `fixed bottom-5 right-5 z-50 w-72 sm:w-80 md:w-96 rounded-xl overflow-hidden border border-cinema-border-emerald bg-cinema-black/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_var(--color-cinema-glow-emerald)] ${
        isHidden ? "invisible pointer-events-none" : ""
      }`;

  return (
    <div
      ref={hostRef}
      id="player-host"
      data-player-mode={isStage ? "stage" : isHidden ? "hidden" : "floating"}
      aria-hidden={isHidden}
      className={hostClass}
    >
      {/* Cabecera: solo en modo flotante (el árbol de React mantiene la posición del hijo siguiente) */}
      {isFloatingActive && (
        <div className="flex items-center justify-between px-3 py-2 bg-cinema-card/95 border-b border-white/5">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${label.dot}`} />
            <p className="text-white text-xs font-editorial font-bold truncate select-none tracking-tight">
              {activeVideo.title}{" "}
              <span className={`${label.textColor} font-cinema text-[10px] tracking-wider uppercase font-normal`}>
                ({label.text})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleFloating}
              title={t("floatingPlayer.maximize")}
              className="p-1 hover:bg-cinema-emerald/10 text-gray-300 hover:text-cinema-emerald rounded transition"
              aria-label={t("floatingPlayer.maximize")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>
            <button
              onClick={close}
              title={t("floatingPlayer.close")}
              className="p-1 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded transition"
              aria-label={t("floatingPlayer.close")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Contenedor de pantalla completa. El póster evita un parpadeo negro mientras el iframe carga. */}
      <div
        className={`relative bg-black bg-cover bg-center ${isStage ? "w-full h-full" : "aspect-video w-full"}`}
        style={activeVideo.thumbnail ? { backgroundImage: `url("${activeVideo.thumbnail}")` } : undefined}
      >
        {/* Superficie imperativa: aquí el engine inserta el único iframe de YouTube */}
        <div ref={attachSurface} className="absolute inset-0" />

        {/* Feedback de atajos (+10s, Pausa...) */}
        {feedback && (
          <div className="absolute top-4 right-4 z-30 pointer-events-none px-3 py-1.5 rounded-full bg-black/85 border border-cinema-border-emerald backdrop-blur-md text-cinema-emerald font-mono text-xs md:text-sm font-bold shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cinema-emerald animate-ping" />
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
