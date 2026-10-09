import { loadYouTubeAPI, YT_STATE, YouTubeNamespace, YouTubePlayerInstance } from "@/lib/youtube";
import type { ActiveVideo, PlayerStatus } from "@/store/slices/playerSlice";

/**
 * ============================================================================
 * PLAYER ENGINE — Control imperativo de UNA sola instancia de YT.Player
 * ============================================================================
 * Esta clase no conoce React ni Redux: recibe callbacks (`PlayerEngineEvents`)
 * y los emite. `PlayerProvider` la conecta con el store.
 *
 * ¿Por qué una instancia persistente en lugar de un iframe por ruta?
 * ------------------------------------------------------------------
 * Antes, `/watch` y `FloatingPlayer` creaban cada uno su propio iframe y se
 * pasaban el estado (tiempo + pausa) al desmontarse. Eso obliga a "adivinar"
 * el estado final justo en el cleanup y a reconstruirlo en el nuevo iframe,
 * con tres carreras posibles:
 *   1. `onReady` vs. la orden de play/pause.
 *   2. `pauseVideo()` antes del primer fotograma => recuadro negro.
 *   3. Eventos de estado tardíos de un iframe ya destruido.
 *
 * Aquí el iframe NUNCA se destruye al navegar: solo cambia dónde se pinta
 * (ver `FloatingPlayer`). El tiempo, la pausa y el fotograma son los reales
 * porque es literalmente el mismo reproductor. El código de abajo solo tiene
 * que resolver la carrera de la *primera* inicialización y los cambios de video.
 *
 * Modelo de "intención" (`Intent`)
 * --------------------------------
 * Los comandos (`load`, `play`, `pause`) primero actualizan la intención y
 * luego, si el reproductor ya está listo, la aplican. Si no lo está, `onReady`
 * aplica la intención MÁS RECIENTE. Así una orden emitida antes de `onReady`
 * (p. ej. el usuario pausa durante la carga) nunca se pierde ni se sobrescribe.
 */

/** Cadencia del sondeo de tiempo mientras se reproduce. */
const POLL_MS = 500;
/** Cada cuánto se refleja `currentTime` en Redux (evita re-renders a 2 Hz). */
const STORE_SYNC_MS = 1000;
/** Cada cuánto se persiste el progreso en el historial (localStorage). */
const HISTORY_SYNC_MS = 3500;
/**
 * Ventana tras un comando propio en la que NO se re-sincroniza la intención
 * desde los eventos de YouTube. Evita que un evento PAUSED tardío (consecuencia
 * de un `pause()` anterior) pise un `play()` emitido justo después.
 */
const COMMAND_GRACE_MS = 600;

export type Playback = "play" | "pause";

export interface LoadOptions {
  /** Segundo desde el que iniciar. Por defecto 0. */
  startSeconds?: number;
  /** false => cargar el fotograma de `startSeconds` y quedar PAUSADO. Por defecto true. */
  autoplay?: boolean;
}

export interface PlayerEngineEvents {
  onStatus: (status: PlayerStatus) => void;
  onTime: (videoId: string, seconds: number) => void;
  onMute: (muted: boolean) => void;
  /** Progreso para el historial "Continuar viendo". */
  onProgress: (video: ActiveVideo, seconds: number) => void;
  onError: (code: number) => void;
}

interface Intent {
  video: ActiveVideo;
  startSeconds: number;
  playback: Playback;
}

function toStatus(code: number): PlayerStatus {
  switch (code) {
    case YT_STATE.PLAYING:
      return "PLAYING";
    case YT_STATE.PAUSED:
      return "PAUSED";
    case YT_STATE.BUFFERING:
      return "BUFFERING";
    case YT_STATE.ENDED:
      return "ENDED";
    default:
      return "UNSTARTED"; // UNSTARTED (-1) y CUED (5)
  }
}

export class PlayerEngine {
  private surface: HTMLElement | null = null;
  private mountNode: HTMLElement | null = null;
  private player: YouTubePlayerInstance | null = null;

  private ready = false;
  private creating = false;
  /** Se incrementa en cada attach/detach para invalidar creaciones asíncronas obsoletas. */
  private generation = 0;

  private intent: Intent | null = null;
  /** Id del video que el iframe tiene cargado realmente. */
  private loadedVideoId: string | null = null;
  /**
   * true => al llegar el primer PLAYING hay que congelar el fotograma.
   * YouTube solo decodifica y pinta un fotograma al empezar a reproducir; si se
   * llama a `pauseVideo()` antes, queda un recuadro negro. Por eso para iniciar
   * "pausado" arrancamos silenciados y pausamos justo al primer PLAYING.
   */
  private freezeOnFirstPlay = false;
  /** Preferencia de silencio del USUARIO (los mute internos del freeze no cuentan). */
  private userMuted = false;
  private lastCommandAt = 0;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastStoreSync = 0;
  private lastHistorySync = 0;

  constructor(private readonly events: PlayerEngineEvents) {}

  // ---------------------------------------------------------------------------
  // Ciclo de vida de la superficie (el <div> donde vive el iframe)
  // ---------------------------------------------------------------------------

  /** Registra el contenedor y crea el reproductor si ya hay algo que reproducir. */
  attach(surface: HTMLElement): void {
    this.surface = surface;
    void this.create();
  }

  /** Persiste el progreso, destruye el iframe y vuelve al estado inicial. */
  detach(): void {
    this.flush();
    this.generation++; // invalida cualquier create() en vuelo
    this.stopPolling();
    if (this.player) {
      try {
        this.player.destroy();
      } catch {}
    }
    this.mountNode?.remove();
    this.player = null;
    this.mountNode = null;
    this.surface = null;
    this.ready = false;
    this.creating = false;
    this.loadedVideoId = null;
    this.freezeOnFirstPlay = false;
  }

  /** Cierra la sesión: guarda progreso y olvida la intención (el detach destruirá el iframe). */
  close(): void {
    this.flush();
    this.intent = null;
  }

  // ---------------------------------------------------------------------------
  // Comandos
  // ---------------------------------------------------------------------------

  /**
   * Carga (o reposiciona) un video.
   * - Reproductor aún no creado/listo: solo se guarda la intención.
   * - Mismo video: `seekTo` sin recargar el iframe.
   * - Otro video: `loadVideoById` sobre la MISMA instancia.
   */
  load(video: ActiveVideo, options: LoadOptions = {}): void {
    const startSeconds = Math.max(0, Math.floor(options.startSeconds ?? 0));
    const playback: Playback = options.autoplay === false ? "pause" : "play";
    this.lastCommandAt = Date.now();

    const previous = this.intent;
    this.intent = { video, startSeconds, playback };

    const player = this.player;
    if (!player || !this.ready) return; // create()/onReady consumirán la intención más reciente

    if (this.loadedVideoId === video.id) {
      player.seekTo(startSeconds, true);
      this.events.onTime(video.id, startSeconds);
      if (playback === "play") this.play();
      else this.pause();
      return;
    }

    // Antes de reemplazar la obra, guardamos dónde se quedó la anterior.
    if (previous) this.persistProgress(previous.video, this.readTime(player));
    this.startLoading(player, video.id, startSeconds, playback);
  }

  play(): void {
    if (!this.intent) return;
    this.lastCommandAt = Date.now();
    this.intent.playback = "play";
    this.freezeOnFirstPlay = false;
    const player = this.player;
    if (!player || !this.ready) return;
    try {
      if (!this.userMuted) player.unMute();
      player.playVideo();
    } catch {}
  }

  pause(): void {
    if (!this.intent) return;
    this.lastCommandAt = Date.now();
    this.intent.playback = "pause";
    const player = this.player;
    if (!player || !this.ready) return; // onReady aplicará la pausa
    try {
      const state = player.getPlayerState();
      if (state === YT_STATE.PLAYING || state === YT_STATE.BUFFERING) {
        player.pauseVideo();
      } else if (state === YT_STATE.UNSTARTED || state === YT_STATE.CUED) {
        // Aún no empezó a reproducir: congelar en cuanto pinte el primer fotograma.
        this.freezeOnFirstPlay = true;
      }
    } catch {}
  }

  /**
   * Alterna reproducción/pausa. Decide con la INTENCIÓN (no con `getPlayerState`)
   * para que pulsaciones rápidas, o antes de `onReady`, se encadenen bien.
   * @returns la nueva intención, o null si no hay sesión.
   */
  togglePlay(): Playback | null {
    if (!this.intent) return null;
    if (this.intent.playback === "play") this.pause();
    else this.play();
    return this.intent.playback;
  }

  /** Salta `delta` segundos respetando los límites. @returns el nuevo tiempo o null. */
  seekBy(delta: number): number | null {
    const player = this.player;
    const intent = this.intent;
    if (!player || !this.ready || !intent) return null;
    const current = this.readTime(player);
    if (current === null) return null;
    let duration = Infinity;
    try {
      const d = player.getDuration();
      if (d > 0) duration = d;
    } catch {}
    const next = Math.min(Math.max(0, current + delta), duration);
    try {
      player.seekTo(next, true);
    } catch {
      return null;
    }
    this.events.onTime(intent.video.id, next);
    return next;
  }

  /** @returns true si quedó silenciado, false si no, null si no hay reproductor. */
  toggleMute(): boolean | null {
    const player = this.player;
    if (!player || !this.ready) return null;
    try {
      const muted = !player.isMuted();
      if (muted) player.mute();
      else player.unMute();
      this.userMuted = muted;
      this.events.onMute(muted);
      return muted;
    } catch {
      return null;
    }
  }

  /** Lee el segundo real del iframe (null si no está disponible). */
  getCurrentTime(): number | null {
    return this.player && this.ready ? this.readTime(this.player) : null;
  }

  /** Emite tiempo + progreso actuales. Útil antes de navegar o cerrar la pestaña. */
  flush(): void {
    const intent = this.intent;
    if (!intent || !this.player || !this.ready || this.loadedVideoId !== intent.video.id) return;
    this.persistProgress(intent.video, this.readTime(this.player));
  }

  // ---------------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------------

  private async create(): Promise<void> {
    if (this.player || this.creating || !this.surface || !this.intent) return;
    this.creating = true;
    const generation = this.generation;

    let YT: YouTubeNamespace;
    try {
      YT = await loadYouTubeAPI();
    } catch (error) {
      if (generation === this.generation) this.creating = false;
      console.error("No se pudo cargar la IFrame API de YouTube:", error);
      return;
    }

    // Si hubo un detach (o un attach nuevo) mientras esperábamos, abortamos.
    if (generation !== this.generation || !this.surface || !this.intent) return;

    // React es dueño de `surface`; el iframe vive en un hijo que creamos nosotros
    // para que YT.Player no reemplace un nodo que React reconcilia.
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    this.surface.appendChild(mount);
    this.mountNode = mount;

    // Leemos la intención AHORA (no antes del await): puede haber cambiado.
    const { video, startSeconds, playback } = this.intent;
    this.loadedVideoId = video.id;
    this.freezeOnFirstPlay = playback === "pause";

    this.player = new YT.Player(mount, {
      width: "100%",
      height: "100%",
      videoId: video.id,
      playerVars: {
        autoplay: 1, // siempre 1: sin reproducir no hay fotograma (ver freezeOnFirstPlay)
        mute: playback === "pause" ? 1 : 0,
        start: startSeconds,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => this.handleReady(generation),
        onStateChange: (event) => this.handleStateChange(generation, event.data),
        onError: (event) => this.events.onError(event.data),
      },
    });
    this.creating = false;
  }

  private handleReady(generation: number): void {
    if (generation !== this.generation || !this.player || !this.intent) return;
    this.ready = true;
    this.startPolling();

    // Aplicar la intención más reciente (pudo cambiar durante la creación).
    const { video, startSeconds, playback } = this.intent;
    if (this.loadedVideoId !== video.id) {
      this.startLoading(this.player, video.id, startSeconds, playback);
    } else if (playback === "play") {
      this.play(); // refuerza el autoplay por si el navegador lo bloqueó
    }
    // playback === "pause": el freeze ya está armado desde create()/startLoading().
  }

  private handleStateChange(generation: number, code: number): void {
    const player = this.player;
    const intent = this.intent;
    if (generation !== this.generation || !player || !intent) return;

    // Primer fotograma ya pintado: congelar y devolver el audio al usuario.
    if (code === YT_STATE.PLAYING && this.freezeOnFirstPlay) {
      this.freezeOnFirstPlay = false;
      try {
        player.pauseVideo();
        if (!this.userMuted) player.unMute();
      } catch {}
      return; // no publicamos PLAYING: el PAUSED que sigue es el estado real
    }

    // Seguir los cambios hechos desde los controles del propio iframe, salvo que
    // acabemos de emitir un comando (ver COMMAND_GRACE_MS).
    const sinceCommand = Date.now() - this.lastCommandAt;
    if (sinceCommand > COMMAND_GRACE_MS) {
      if (code === YT_STATE.PLAYING) intent.playback = "play";
      else if (code === YT_STATE.PAUSED || code === YT_STATE.ENDED) intent.playback = "pause";
    }

    this.events.onStatus(toStatus(code));

    if (code === YT_STATE.PAUSED) {
      this.flush();
    } else if (code === YT_STATE.ENDED) {
      intent.playback = "pause";
      this.events.onTime(intent.video.id, 0);
      this.events.onProgress(intent.video, 0);
    }
  }

  /** Cambia el video del iframe existente. Siempre arranca reproduciendo; `pause` congela el primer fotograma. */
  private startLoading(
    player: YouTubePlayerInstance,
    videoId: string,
    startSeconds: number,
    playback: Playback
  ): void {
    this.loadedVideoId = videoId;
    this.freezeOnFirstPlay = playback === "pause";
    try {
      if (playback === "pause") player.mute();
      else if (!this.userMuted) player.unMute();
      player.loadVideoById({ videoId, startSeconds });
    } catch (error) {
      console.error("Error al cargar el video en el reproductor:", error);
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => this.poll(), POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  private poll(): void {
    const player = this.player;
    const intent = this.intent;
    if (!player || !this.ready || !intent || this.loadedVideoId !== intent.video.id) return;
    try {
      if (player.getPlayerState() !== YT_STATE.PLAYING) return;
    } catch {
      return;
    }
    const time = this.readTime(player);
    if (time === null) return;

    const now = Date.now();
    if (now - this.lastStoreSync >= STORE_SYNC_MS) {
      this.lastStoreSync = now;
      this.events.onTime(intent.video.id, time);
    }
    if (now - this.lastHistorySync >= HISTORY_SYNC_MS) {
      this.lastHistorySync = now;
      this.events.onProgress(intent.video, time);
    }
  }

  private persistProgress(video: ActiveVideo, time: number | null): void {
    // `time <= 0` suele significar "iframe ya desmontado": no pisar el progreso guardado.
    if (time === null || time <= 0) return;
    this.events.onTime(video.id, time);
    if (time > 2) this.events.onProgress(video, time);
  }

  private readTime(player: YouTubePlayerInstance): number | null {
    try {
      const time = player.getCurrentTime();
      return typeof time === "number" && Number.isFinite(time) ? time : null;
    } catch {
      return null;
    }
  }
}
