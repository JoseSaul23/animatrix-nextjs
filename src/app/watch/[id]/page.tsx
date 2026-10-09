"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import VideoCarousel from "@/components/VideoCarousel";
import { usePlayerController } from "@/components/PlayerProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleWatchlist } from "@/store/slices/watchlistSlice";
import { useIsClient } from "@/lib/useIsClient";
import { formatSecondsToTime } from "@/lib/utils";
import { allVideos, getVideoById } from "@/lib/videos";
import { useLanguage } from "@/i18n";

/**
 * ============================================================================
 * SALA DE PROYECCIÓN / REPRODUCTOR PRINCIPAL
 * Ruta Dinámica: /watch/[id]
 * ============================================================================
 * Conceptos clave de Next.js App Router utilizados:
 * 1. Rutas Dinámicas (`[id]`): La carpeta entre corchetes indica que el segmento
 *    es dinámico (ej. `/watch/aqz-KE-bpKQ`).
 * 2. `useParams()`: Hook de Next.js para leer los parámetros de la URL (`id`).
 * 3. `useSearchParams()`: Hook de Next.js para leer query strings (ej. `?t=45` para
 *    reanudar en un segundo específico).
 * 4. Estado global compartido: el reproductor NO vive en esta página. Es un único
 *    iframe persistente (ver `PlayerProvider` y `FloatingPlayer`) que se superpone
 *    sobre el hueco de esta sala. Por eso minimizar/maximizar solo cambia de ruta.
 */
export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const dispatch = useAppDispatch();
  const { load, toggleFloating, registerStage } = usePlayerController();
  const { t, translateGenre, getVideoDescription } = useLanguage();

  const watchlist = useAppSelector((state) => state.watchlist.items);
  const activeVideo = useAppSelector((state) => state.player.activeVideo);
  const savedTimes = useAppSelector((state) => state.player.savedTimes);
  const watchHistory = useAppSelector((state) => state.watchHistory.items);

  // Tiempo desde el que ofrecer "Continuar en mm:ss" cuando la obra aún NO está en reproducción.
  // Prioridad:
  // 1. Parámetro en URL ?t=
  // 2. savedTimes en playerSlice (sesión actual)
  // 3. watchHistory en Redux
  // 4. localStorage directo
  const queryTime = searchParams?.get("t");
  const resolvedSavedTime = useMemo(() => {
    if (queryTime && !isNaN(Number(queryTime)) && Number(queryTime) > 0) {
      return Math.floor(Number(queryTime));
    }
    if (savedTimes[id] && savedTimes[id] > 0) {
      return savedTimes[id];
    }
    const fromHistory = watchHistory.find((item) => item.id === id);
    if (fromHistory && fromHistory.currentTime > 0) {
      return fromHistory.currentTime;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("animatrix_watch_history");
        if (stored) {
          const parsed = JSON.parse(stored);
          const found = Array.isArray(parsed)
            ? parsed.find((p: { id?: string; currentTime?: number }) => p?.id === id)
            : undefined;
          if (found && found.currentTime && found.currentTime > 0) {
            return found.currentTime;
          }
        }
      } catch {}
    }
    return 0;
  }, [id, queryTime, savedTimes, watchHistory]);

  /**
   * ¿La sesión de reproducción activa es de ESTA obra?
   * Si es así, el reproductor global ya existe (reproduciendo o en pausa) y se
   * "aterriza" sobre el hueco de esta página (`registerStage`). La página no crea
   * ni controla ningún iframe: el tiempo, la pausa y el fotograma ya son los reales.
   * Un `?t=` en la URL se ignora a propósito: la posición viva manda sobre la guardada.
   */
  const isSessionHere = activeVideo?.id === id;

  const mounted = useIsClient();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const videosData = allVideos;
  const video = getVideoById(id);
  const isSaved = mounted && video ? watchlist.includes(video.id) : false;

  /** Inicia la proyección desde el segundo guardado (o desde el inicio con `restart`). */
  const handlePlay = useCallback(
    (restart: boolean = false) => {
      if (!video) return;
      load(
        {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          duration: video.duration,
          genres: video.genres,
        },
        { startSeconds: restart ? 0 : resolvedSavedTime }
      );
    },
    [video, resolvedSavedTime, load]
  );

  // Espacio/K sin sesión activa: GlobalShortcuts nos avisa para iniciar la reproducción.
  useEffect(() => {
    const handleStart = () => {
      if (!isSessionHere) handlePlay(false);
    };
    window.addEventListener("animatrix:start-playback", handleStart);
    return () => window.removeEventListener("animatrix:start-playback", handleStart);
  }, [isSessionHere, handlePlay]);

  const handleToggleWatchlist = () => {
    if (!video) return;
    dispatch(toggleWatchlist(video.id));
    setToastMsg(isSaved ? t("watch.removedFromList") : t("watch.addedToList"));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleShare = async () => {
    if (!video) return;
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: t("watch.shareText", { title: video.title }),
          url: url,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setToastMsg(t("watch.linkCopied"));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {
      setToastMsg(t("watch.linkCopyError"));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  // Videos similares estables (Hooks incondicionales)
  const similarVideos = useMemo(() => {
    if (!videosData || !video) return [];
    return videosData.filter(
      (v) => v.id !== video.id && v.genres.some((g) => video.genres.includes(g))
    );
  }, [videosData, video]);

  const randomSimilarVideos = useMemo(() => {
    return similarVideos.slice(0, 10);
  }, [similarVideos]);

  if (!video) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-cinema-black text-white pt-navbar">
        <h1 className="text-3xl md:text-4xl font-editorial font-bold mb-4">{t("watch.notFound")}</h1>
        <Link href="/" className="btn-cinema-primary px-6 py-2.5 text-sm">
          {t("watch.backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cinema-black animate-theater-dim text-white pb-24 relative pt-navbar">
      {/* Toast Flotante de Notificación */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-cinema-emerald text-black font-semibold text-xs md:text-sm px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
          </svg>
          {toastMsg}
        </div>
      )}

      {/* Top Section: Metadata con Estilo Editorial Neo-Clásico */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-9 px-4 md:px-14 py-4 md:py-6 relative z-10">
        {/* Left: Thumbnail (Poster de Festival) */}
        <div className="w-32 md:w-40 lg:w-44 shrink-0 mx-auto md:mx-0 stagger-1">
          <div className="relative aspect-[3/4] w-full rounded-lg shadow-2xl overflow-hidden cinema-border bg-cinema-card">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 768px) 130px, 180px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right: Info Editorial */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left stagger-2">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-editorial font-bold tracking-tight text-white mb-2 leading-tight">
            {video.title}
          </h1>

          {/* Fila de Badges estilo Boleto de Cine */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            <span className="ticket-badge font-cinema">
              ⏱ {video.duration} {t("hero.minutes")}
            </span>
            {video.genres.map((g) => (
              <span key={g} className="ticket-badge">
                {translateGenre(g)}
              </span>
            ))}
          </div>

          <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed max-w-3xl mx-auto md:mx-0 mb-4">
            {getVideoDescription(video)}
          </p>

          {/* Botones de Acción Neo-Clásicos */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 stagger-3">
            <button
              onClick={handleToggleWatchlist}
              className={
                isSaved
                  ? "flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full bg-cinema-emerald text-black border border-cinema-emerald hover:bg-cinema-emerald-light transition shadow-md"
                  : "btn-cinema-secondary"
              }
            >
              {isSaved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  {t("watch.inMyList")}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t("watch.addToMyList")}
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              title={t("watch.share")}
              className="btn-cinema-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              {t("watch.share")}
            </button>

            {/* Minimizar: solo tiene sentido si esta obra está en reproducción. No hay que copiar
                tiempo ni estado: al navegar, el mismo reproductor pasa a modo flotante. */}
            {isSessionHere && (
              <button
                onClick={toggleFloating}
                title={t("watch.minimizeTooltip")}
                className="btn-cinema-secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
                </svg>
                {t("watch.minimizePip")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Video Player con Apertura de Cortina y Resplandor de Proyector */}
      <div className="relative w-full px-0 md:px-8 mt-4">
        {/* Haz de luz de proyector sutil */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cinema-emerald/10 via-emerald-500/15 to-cinema-emerald/10 blur-2xl opacity-45 animate-projector-glow pointer-events-none" />

        {/* Hueco ("stage"): el reproductor global se superpone exactamente aquí cuando esta obra
            está en reproducción. Sin sesión, mostramos el póster con el botón de iniciar. */}
        <div
          ref={registerStage}
          className="w-full h-[45vh] md:h-[65vh] bg-black relative flex items-center justify-center rounded-none md:rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-y md:border border-white/5 animate-curtain-reveal"
        >
          {!isSessionHere && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black group transition-all relative overflow-hidden">
              {/* Imagen de fondo desenfocada sutil */}
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover opacity-20 blur-sm scale-105 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

              <button
                onClick={() => handlePlay(false)}
                className="relative z-10 flex flex-col items-center justify-center cursor-pointer group/btn"
                aria-label={t("videoCard.play")}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 btn-cinema-primary group-hover/btn:scale-110 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-10 h-10 md:w-12 md:h-12 ml-1.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="mt-3 text-xs md:text-sm tracking-widest text-cinema-emerald font-cinema uppercase font-semibold group-hover/btn:text-cinema-emerald-light transition-colors">
                  {resolvedSavedTime > 5
                    ? t("watch.resumeAt", { time: formatSecondsToTime(resolvedSavedTime) })
                    : t("watch.startPlayback")}
                </span>
              </button>

              {resolvedSavedTime > 5 && (
                <button
                  type="button"
                  onClick={() => handlePlay(true)}
                  className="relative z-10 mt-3 text-xs text-gray-400 hover:text-white underline font-light transition-colors cursor-pointer"
                >
                  {t("watch.playFromBeginning")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Similar Titles */}
      {randomSimilarVideos.length > 0 && (
        <div className="mt-14 md:mt-20 stagger-4">
          <div className="px-4 md:px-14 mb-4">
            <h2 className="text-xl md:text-2xl font-editorial font-bold tracking-tight text-white flex items-center gap-2">
              <span className="cinema-accent-bar" />
              {t("watch.similarTitles")}
            </h2>
          </div>
          <VideoCarousel title="" videos={randomSimilarVideos} />
        </div>
      )}
    </main>
  );
}
