"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/i18n";
import { Video } from "@/types/video";

/**
 * Componente Hero principal para la cartelera destacada.
 * Utiliza un poster optimizado con prioridad LCP y reproduce en background el corto.
 */
export default function Hero({ video }: { video: Video }) {
  const { t, translateGenre, getVideoDescription } = useLanguage();
  if (!video) return null;

  // Calcular la mitad del video en segundos según su duración (ej. "10:34")
  const getMiddleInSeconds = (durationStr: string) => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    let totalSeconds = 0;
    if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return Math.floor(totalSeconds / 2);
  };

  const startSeconds = getMiddleInSeconds(video.duration);

  return (
    <div className="relative h-[82vh] md:h-[86vh] w-full text-white overflow-hidden bg-cinema-black">
      {/* Fondo de video con poster LCP prioritario y viñeta cinematográfica */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 filter brightness-75"
        />
        <iframe
          className="w-full h-full scale-125 md:scale-110 pointer-events-none opacity-85 relative z-0"
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${video.id}&start=${startSeconds}&enablejsapi=1&playsinline=1`}
          title={video.title}
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/30 to-transparent z-10" />
      </div>

      {/* Contenido Editorial */}
      <div className="absolute top-[28%] md:top-[26%] left-4 md:left-14 max-w-2xl z-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-editorial font-bold mb-3 tracking-tight drop-shadow-2xl leading-[1.05]">
          {video.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="ticket-badge font-cinema">
            ⏱ {video.duration} {t("hero.minutes")}
          </span>
          {video.genres.map((genre) => (
            <span key={genre} className="ticket-badge">
              {translateGenre(genre)}
            </span>
          ))}
        </div>

        <p className="text-base md:text-lg mb-7 line-clamp-3 text-gray-200 font-light leading-relaxed max-w-xl drop-shadow">
          {getVideoDescription(video)}
        </p>

        <div className="flex items-center gap-4">
          <Link
            href={`/watch/${video.id}`}
            prefetch={true}
            className="btn-cinema-primary px-7 py-3 md:px-9 md:py-3.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
            <span>{t("hero.watchShort")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
