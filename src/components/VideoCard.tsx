"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleWatchlist } from "@/store/slices/watchlistSlice";
import { useIsClient } from "@/lib/useIsClient";
import { useLanguage } from "@/i18n";

import { Video } from "@/types/video";

/**
 * Tarjeta interactiva de película con soporte visual de progreso, watchlist e i18n.
 * Toda la superficie es accesible y navega a `/watch/[id]`.
 */
export default function VideoCard({ video }: { video: Video }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const watchlist = useAppSelector((state) => state.watchlist.items);
  const watchHistory = useAppSelector((state) => state.watchHistory.items);
  const mounted = useIsClient();
  const { t, translateGenre } = useLanguage();

  const isSaved = mounted ? watchlist.includes(video.id) : false;

  // Progreso de reproducción si existe en historial
  const historyItem = mounted ? watchHistory.find((item) => item.id === video.id) : null;
  const progressPercent =
    historyItem && historyItem.durationSec > 0
      ? Math.min(100, Math.round((historyItem.currentTime / historyItem.durationSec) * 100))
      : 0;

  // Calculamos si el video fue agregado hace menos de 30 días
  let isNew = false;
  if (video.createdAt) {
    const videoDate = new Date(video.createdAt).getTime();
    const now = new Date().getTime();
    const diffInDays = (now - videoDate) / (1000 * 60 * 60 * 24);
    isNew = diffInDays >= 0 && diffInDays <= 30;
  }

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWatchlist(video.id));
  };

  const hasProgress = historyItem && historyItem.currentTime > 5 && (historyItem.durationSec === 0 || historyItem.currentTime < historyItem.durationSec - 5);
  const targetUrl = hasProgress ? `/watch/${video.id}?t=${Math.floor(historyItem.currentTime)}` : `/watch/${video.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Si se hizo clic con botones especiales (Ctrl/Cmd o clic central), el Link nativo lo gestiona
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    router.push(targetUrl);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative w-[250px] md:w-[300px] h-[140px] md:h-[170px] flex-none transition-all duration-300 hover:scale-105 hover:z-20 rounded-lg overflow-hidden cinema-border bg-cinema-card cursor-pointer select-none"
    >
      {/* 1. Stretched Link a pantalla completa: cubre 100% de la tarjeta (z-10) */}
      <Link
        href={targetUrl}
        prefetch={true}
        className="absolute inset-0 z-10 block"
        aria-label={t("videoCard.watchAria", { title: video.title })}
        tabIndex={-1}
      />

      {/* 2. Miniatura de fondo con viñeta cinematográfica (z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 250px, 300px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </div>

      {/* 3. Overlay editorial al pasar el cursor (z-20 pointer-events-none) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Botón de reproducción visual (pointer-events-none) */}
            <div
              className="bg-gradient-to-tr from-cinema-emerald to-cinema-emerald-light text-black p-2 rounded-full group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(30,215,96,0.4)] flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Único botón interactivo: Agregar a Mi Lista (pointer-events-auto z-30) */}
            <button
              type="button"
              onClick={handleToggleWatchlist}
              title={isSaved ? t("videoCard.removeFromWatchlist") : t("videoCard.addToWatchlist")}
              className={`p-2 rounded-full border transition flex items-center justify-center cursor-pointer pointer-events-auto relative z-30 ${
                isSaved
                  ? "bg-cinema-emerald text-black border-cinema-emerald hover:scale-110"
                  : "border-neutral-500 text-white hover:border-cinema-emerald hover:text-cinema-emerald hover:bg-neutral-800/80 hover:scale-110"
              }`}
            >
              {isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </div>
          
          {isSaved && (
            <span className="text-[10px] text-cinema-emerald font-cinema tracking-widest uppercase bg-cinema-emerald/10 px-2 py-0.5 rounded border border-cinema-emerald/30 pointer-events-none">
              {t("videoCard.saved")}
            </span>
          )}
        </div>

        {/* Título */}
        <div className="block pointer-events-none">
          <span className="text-white font-editorial font-bold text-base line-clamp-1 mb-1 tracking-tight group-hover:text-cinema-emerald transition-colors">
            {video.title}
          </span>
        </div>

        {/* Metadatos */}
        <div className="flex items-center gap-2 mb-1.5 pointer-events-none">
          {isNew && (
            <span className="text-cinema-emerald font-cinema text-[10px] uppercase tracking-wider font-semibold">
              {t("videoCard.newRelease")}
            </span>
          )}
          <span className="ticket-badge text-[10px] py-0 px-1.5">
            ⏱ {video.duration} {t("videoCard.durationMinutes")}
          </span>
          {progressPercent > 0 && progressPercent < 98 && (
            <span className="text-[10px] text-cinema-emerald font-cinema uppercase font-medium">
              {progressPercent}%
            </span>
          )}
        </div>

        {/* Géneros */}
        <div className="flex flex-wrap gap-1 pointer-events-none">
          {video.genres.map((genre, idx) => (
            <span key={genre} className="text-[10px] text-gray-300 font-light">
              {translateGenre(genre)} {idx < video.genres.length - 1 && <span className="text-cinema-emerald/60 mx-1">•</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Barra de progreso sutil visible permanentemente (pointer-events-none) */}
      {progressPercent > 0 && progressPercent < 98 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-cinema-emerald to-cinema-emerald-light transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
