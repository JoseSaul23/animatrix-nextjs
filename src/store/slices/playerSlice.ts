import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * ============================================================================
 * PLAYER SLICE — Fuente única de la verdad del reproductor
 * ============================================================================
 * Este slice describe *qué* está pasando con el reproductor, no *cómo* se
 * controla. El control imperativo (la instancia de `YT.Player`, timers, el
 * iframe) vive en `PlayerProvider`, que es el único autorizado a escribir
 * aquí a partir de los eventos reales de la API de YouTube.
 *
 * Flujo de datos (unidireccional):
 *
 *   acción del usuario ─▶ PlayerController ─▶ YT.Player ─▶ onStateChange
 *                                                              │
 *   UI (Watch / FloatingPlayer / atajos) ◀── Redux ◀───────────┘
 *
 * Por eso aquí NO hay reducers tipo `setPaused(true)` llamados desde la UI:
 * el estado `status` solo cambia cuando YouTube confirma la transición.
 * Escribir "pausado" de forma optimista fue la causa de la desincronización
 * entre el botón, el atajo de teclado y el video real.
 */

export interface ActiveVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  genres: string[];
}

/** Estado real del reproductor, espejo de `YT.PlayerState`. */
export type PlayerStatus = "UNSTARTED" | "BUFFERING" | "PLAYING" | "PAUSED" | "ENDED";

interface PlayerState {
  /** Video de la sesión de reproducción actual (null = no hay sesión). */
  activeVideo: ActiveVideo | null;
  /** Estado real reportado por la IFrame API (nunca escrito por la UI). */
  status: PlayerStatus;
  /** Segundo exacto de `activeVideo` (espejo con throttle de ~1s + en cada evento). */
  currentTime: number;
  isMuted: boolean;
  /** Ruta actual, alimentada por el listener de navegación de `PlayerProvider`. */
  pathname: string;
  /**
   * true cuando hay sesión y el usuario NO está en `/watch/[id]` de ese video:
   * el reproductor se muestra como mini-ventana. Derivado en el reducer para
   * que exista una sola definición.
   */
  isFloatingActive: boolean;
  /** Último segundo conocido por video: { [videoId]: segundos }. */
  savedTimes: Record<string, number>;
}

const initialState: PlayerState = {
  activeVideo: null,
  status: "UNSTARTED",
  currentTime: 0,
  isMuted: false,
  pathname: "/",
  isFloatingActive: false,
  savedTimes: {},
};

/** ¿`pathname` es la sala de proyección de `videoId`? (`/watch/ID` o `/watch/ID/...`) */
export function isWatchPathOf(pathname: string, videoId: string): boolean {
  const base = `/watch/${videoId}`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Única definición de "flotante activo": hay sesión y no estamos en su sala. */
function computeFloating(state: PlayerState): boolean {
  return state.activeVideo !== null && !isWatchPathOf(state.pathname, state.activeVideo.id);
}

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    /** Inicia (o reemplaza) la sesión de reproducción. */
    sessionStarted: (state, action: PayloadAction<{ video: ActiveVideo; startSeconds: number }>) => {
      const { video, startSeconds } = action.payload;
      const start = Math.max(0, Math.floor(startSeconds));
      state.activeVideo = video;
      state.status = "UNSTARTED";
      state.currentTime = start;
      state.savedTimes[video.id] = start;
      state.isFloatingActive = computeFloating(state);
    },
    /** Cierra la sesión: el iframe se destruye al desmontarse la superficie. */
    sessionClosed: (state) => {
      state.activeVideo = null;
      state.status = "UNSTARTED";
      state.currentTime = 0;
      state.isFloatingActive = false;
    },
    /** Estado real confirmado por `onStateChange`. */
    statusChanged: (state, action: PayloadAction<PlayerStatus>) => {
      state.status = action.payload;
    },
    /** Posición del video. Se guarda siempre en `savedTimes`; el espejo solo si es el activo. */
    timeUpdated: (state, action: PayloadAction<{ videoId: string; time: number }>) => {
      const time = Math.max(0, Math.floor(action.payload.time));
      state.savedTimes[action.payload.videoId] = time;
      if (state.activeVideo?.id === action.payload.videoId) {
        state.currentTime = time;
      }
    },
    muteChanged: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    /** Listener de navegación: se despacha en cada cambio de ruta. */
    routeChanged: (state, action: PayloadAction<string>) => {
      state.pathname = action.payload;
      state.isFloatingActive = computeFloating(state);
    },
  },
});

export const {
  sessionStarted,
  sessionClosed,
  statusChanged,
  timeUpdated,
  muteChanged,
  routeChanged,
} = playerSlice.actions;

export default playerSlice.reducer;
