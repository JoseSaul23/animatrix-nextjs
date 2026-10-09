"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppStore } from "@/store/hooks";
import {
  muteChanged,
  routeChanged,
  sessionClosed,
  sessionStarted,
  statusChanged,
  timeUpdated,
  ActiveVideo,
} from "@/store/slices/playerSlice";
import { recordProgress } from "@/store/slices/watchHistorySlice";
import { LoadOptions, PlayerEngine } from "@/lib/playerEngine";

/**
 * ============================================================================
 * PLAYER PROVIDER — Puente entre React, Redux y el PlayerEngine
 * ============================================================================
 * Responsabilidades:
 *  1. Crear UNA sola instancia de `PlayerEngine` por sesión de navegador.
 *  2. Traducir los eventos del engine en acciones de Redux (única escritura
 *     del estado del reproductor).
 *  3. Exponer un `PlayerController` estable con los comandos que usan la
 *     página /watch, el FloatingPlayer y los atajos de teclado.
 *  4. Escuchar la navegación (`usePathname`) para mantener `isFloatingActive`.
 *
 * Conceptos de Next.js App Router:
 *  - Este componente se monta en `Providers` (dentro de `app/layout.tsx`).
 *    Los layouts NO se desmontan al navegar, así que el engine y su iframe
 *    sobreviven al paso de `/watch/[id]` a cualquier otra ruta.
 *
 * Se usan DOS contextos para no re-renderizar a todos los consumidores:
 *  - `PlayerControllerContext`: valor estable (comandos).
 *  - `PlayerUiContext`: valores que cambian (stage actual y feedback visual).
 */

export interface PlayerController {
  /** Inicia o reposiciona una sesión. Sin `autoplay: false`, reproduce. */
  load: (video: ActiveVideo, options?: LoadOptions) => void;
  togglePlay: () => void;
  seekBy: (deltaSeconds: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  /** Minimiza (en /watch) o maximiza (en flotante) navegando a la ruta correspondiente. */
  toggleFloating: () => void;
  close: () => void;
  /**
   * Ref callback del <div> que contendrá el iframe. Su identidad es ESTABLE a
   * propósito: si cambiara, React lo llamaría con null y se destruiría el reproductor.
   */
  attachSurface: (element: HTMLElement | null) => void;
  /** Ref callback del hueco de la página /watch donde el reproductor "aterriza". */
  registerStage: (element: HTMLElement | null) => void;
}

interface PlayerUi {
  /** Elemento de /watch sobre el que se superpone el reproductor (null si no hay). */
  stageElement: HTMLElement | null;
  /** Texto efímero de feedback ("+10s ⏩", "Pausa ⏸"...). */
  feedback: string | null;
}

const PlayerControllerContext = createContext<PlayerController | null>(null);
const PlayerUiContext = createContext<PlayerUi>({ stageElement: null, feedback: null });

const FEEDBACK_MS = 1200;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const [stageElement, setStageElement] = useState<HTMLElement | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; text: string } | null>(null);
  const fullscreenTargetRef = useRef<HTMLElement | null>(null);

  // El engine se crea una vez. Sus callbacks solo usan `dispatch`/setState (identidad estable).
  const [engine] = useState(
    () =>
      new PlayerEngine({
        onStatus: (status) => dispatch(statusChanged(status)),
        onTime: (videoId, time) => dispatch(timeUpdated({ videoId, time })),
        onMute: (muted) => dispatch(muteChanged(muted)),
        onProgress: (video, seconds) =>
          dispatch(
            recordProgress({
              id: video.id,
              title: video.title,
              thumbnail: video.thumbnail,
              duration: video.duration,
              currentTime: seconds,
              genres: video.genres,
            })
          ),
        onError: () =>
          setFeedback((prev) => ({
            id: (prev?.id ?? 0) + 1,
            text: "Este video no se puede reproducir ⚠",
          })),
      })
  );

  const showFeedback = useCallback((text: string) => {
    setFeedback((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
  }, []);

  // El feedback se autodestruye; al cambiar `feedback` el timer anterior se limpia.
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  // --- Listener de navegación -------------------------------------------------
  // En cada cambio de ruta: 1) persistimos el progreso del video actual y
  // 2) informamos al store para que recalcule `isFloatingActive`.
  useEffect(() => {
    engine.flush();
    dispatch(routeChanged(pathname));
  }, [pathname, engine, dispatch]);

  // Al cerrar/ocultar la pestaña guardamos el último segundo conocido.
  useEffect(() => {
    const flush = () => engine.flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [engine]);

  // --- Refs callback con identidad estable ------------------------------------
  const attachSurface = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        // El wrapper (padre) es el que se pone en pantalla completa: incluye el feedback.
        fullscreenTargetRef.current = element.parentElement;
        engine.attach(element);
      } else {
        fullscreenTargetRef.current = null;
        engine.detach();
      }
    },
    [engine]
  );

  const registerStage = useCallback((element: HTMLElement | null) => {
    setStageElement(element);
  }, []);

  // --- Comandos ---------------------------------------------------------------
  const controller = useMemo<PlayerController>(
    () => ({
      attachSurface,
      registerStage,

      load: (video, options) => {
        const current = store.getState().player.activeVideo;
        // Misma obra: solo reposicionamos; no reiniciamos el estado real del reproductor.
        if (current?.id !== video.id) {
          dispatch(sessionStarted({ video, startSeconds: options?.startSeconds ?? 0 }));
        }
        engine.load(video, options);
      },

      togglePlay: () => {
        const next = engine.togglePlay();
        if (next) showFeedback(next === "play" ? "Reproducir ▶" : "Pausa ⏸");
      },

      seekBy: (delta) => {
        if (engine.seekBy(delta) !== null) {
          showFeedback(delta > 0 ? `+${delta}s ⏩` : `${delta}s ⏪`);
        }
      },

      toggleMute: () => {
        const muted = engine.toggleMute();
        if (muted !== null) showFeedback(muted ? "Silenciado 🔇" : "Audio activado 🔊");
      },

      toggleFullscreen: () => {
        const target = fullscreenTargetRef.current;
        if (!target) return;
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => {});
        } else {
          target.requestFullscreen().catch(() => {});
        }
      },

      toggleFloating: () => {
        const { activeVideo, isFloatingActive } = store.getState().player;
        if (!activeVideo) return;
        // No hay que copiar tiempo ni estado: el reproductor es el mismo en ambas vistas.
        router.push(isFloatingActive ? `/watch/${activeVideo.id}` : "/");
      },

      close: () => {
        engine.close();
        dispatch(sessionClosed());
      },
    }),
    [attachSurface, registerStage, engine, dispatch, store, router, showFeedback]
  );

  const ui = useMemo<PlayerUi>(
    () => ({ stageElement, feedback: feedback?.text ?? null }),
    [stageElement, feedback]
  );

  return (
    <PlayerControllerContext.Provider value={controller}>
      <PlayerUiContext.Provider value={ui}>{children}</PlayerUiContext.Provider>
    </PlayerControllerContext.Provider>
  );
}

/** Comandos del reproductor global. Debe usarse dentro de `PlayerProvider`. */
export function usePlayerController(): PlayerController {
  const controller = useContext(PlayerControllerContext);
  if (!controller) throw new Error("usePlayerController debe usarse dentro de <PlayerProvider>");
  return controller;
}

/** Estado de UI del reproductor (stage + feedback). */
export function usePlayerUi(): PlayerUi {
  return useContext(PlayerUiContext);
}
