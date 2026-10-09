"use client";

import { useMemo } from "react";
import Hero from "@/components/Hero";
import VideoCarousel from "@/components/VideoCarousel";
import { useAppSelector } from "@/store/hooks";
import genresList from "@/data/genres.json";
import { allVideos } from "@/lib/videos";
import { useIsClient } from "@/lib/useIsClient";
import { useLanguage } from "@/i18n";
import { Video } from "@/types/video";

export default function Home() {
  const { t, translateGenre } = useLanguage();
  const videosData = allVideos;
  const watchHistory = useAppSelector((state) => state.watchHistory.items);
  const mounted = useIsClient();

  // Obra principal de cabecera
  const heroVideo = useMemo(() => {
    return videosData.length > 0 ? videosData[0] : null;
  }, [videosData]);

  // Últimos estrenos ordenados por fecha de incorporación
  const latestVideos = useMemo(() => {
    return [...videosData]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 20);
  }, [videosData]);

  // Agrupamiento indexado por género
  const categories = useMemo(() => {
    const genresMap: Record<string, Video[]> = {};
    videosData.forEach((video) => {
      video.genres.forEach((genre) => {
        if (!genresMap[genre]) {
          genresMap[genre] = [];
        }
        genresMap[genre].push(video);
      });
    });
    return Object.entries(genresMap).sort((a, b) => b[1].length - a[1].length);
  }, [videosData]);

  if (!heroVideo) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cinema-black text-white">
        {t("home.empty")}
      </div>
    );
  }

  // Videos en curso (progreso > 5s y no finalizados)
  const continueWatchingVideos: Video[] = mounted
    ? watchHistory
        .filter((item) => item.currentTime > 5 && (item.durationSec === 0 || item.currentTime < item.durationSec - 5))
        .map((item) => {
          const found = videosData.find((v) => v.id === item.id);
          return (
            found || {
              id: item.id,
              title: item.title,
              thumbnail: item.thumbnail,
              duration: item.duration,
              genres: item.genres,
              url: `https://www.youtube.com/watch?v=${item.id}`,
              description: "",
            }
          );
        })
    : [];

  return (
    <main className="min-h-screen pb-20 relative pt-navbar bg-cinema-black">
      <Hero video={heroVideo} />
      
      <div className="relative z-20 -mt-24 md:-mt-32 space-y-8">
        {continueWatchingVideos.length > 0 && (
          <VideoCarousel title={t("home.continueWatching")} videos={continueWatchingVideos} />
        )}

        <VideoCarousel title={t("home.latestReleases")} videos={latestVideos} />
        {categories.map(([genre, videos]) => {
          const genreData = genresList.find((g) => g.name === genre);
          const genreId = genreData ? genreData.id : encodeURIComponent(genre);
          return (
            <VideoCarousel key={genre} title={translateGenre(genre)} videos={videos} genreId={genreId} />
          );
        })}
      </div>
    </main>
  );
}
