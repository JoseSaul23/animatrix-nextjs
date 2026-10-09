// Helper para cargar la API oficial de Iframe de YouTube de forma segura y singleton en el cliente

/**
 * Códigos que `onStateChange` / `getPlayerState()` devuelven según la documentación
 * oficial de la IFrame Player API.
 */
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

export interface YouTubePlayerOptions {
  width?: string | number;
  height?: string | number;
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YouTubePlayerInstance }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
    onError?: (event: { data: number }) => void;
  };
}

export interface YouTubeNamespace {
  Player: new (elementId: string | HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeAPI(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API cannot be loaded on server"));
  }

  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }

  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    // Timeout de 10s para evitar intervalos infinitos en caso de AdBlockers o pérdida de conexión
    const timeout = setTimeout(() => {
      clearInterval(checkTimer);
      apiPromise = null;
      reject(new Error("Timeout al cargar YouTube IFrame API"));
    }, 10000);

    // Intervalo de seguridad para detectar si el script ya terminó o cargó antes
    const checkTimer = setInterval(() => {
      if (window.YT && typeof window.YT.Player === "function") {
        clearInterval(checkTimer);
        clearTimeout(timeout);
        resolve(window.YT);
      }
    }, 50);

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearInterval(checkTimer);
      clearTimeout(timeout);
      if (typeof prevCallback === "function") {
        try {
          prevCallback();
        } catch {}
      }
      if (window.YT) {
        resolve(window.YT);
      } else {
        apiPromise = null;
        reject(new Error("YouTube API ready but YT namespace missing"));
      }
    };

    let tag = document.getElementById("yt-iframe-api-script") as HTMLScriptElement | null;
    if (!tag) {
      tag = document.createElement("script");
      tag.id = "yt-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        clearInterval(checkTimer);
        clearTimeout(timeout);
        apiPromise = null;
        reject(new Error("Error al descargar script de YouTube IFrame API"));
      };
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

