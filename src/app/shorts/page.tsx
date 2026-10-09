"use client";

import VideoCarousel from "@/components/VideoCarousel";
import { useLanguage } from "@/i18n";
import { allVideos } from "@/lib/videos";
import { Video } from "@/types/video";
import genresList from "@/data/genres.json";

export default function ShortsPage() {
  const { t, translateGenre } = useLanguage();
  const videosData = allVideos;

  if (videosData.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cinema-black text-white">
        {t("shorts.error")}
      </div>
    );
  }

  // Agrupar los videos por género
  const genresMap: Record<string, Video[]> = {};

  videosData.forEach((video) => {
    video.genres.forEach((genre) => {
      if (!genresMap[genre]) {
        genresMap[genre] = [];
      }
      genresMap[genre].push(video);
    });
  });

  const categories = Object.entries(genresMap).sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="min-h-screen bg-cinema-black text-white pb-24 relative pt-navbar">
      <div className="px-4 md:px-12 pt-8 pb-2">
        <h1 className="text-white text-3xl md:text-5xl font-editorial font-bold tracking-tight">
          {t("shorts.title")}
        </h1>
      </div>

      <div className="space-y-4 md:space-y-8 pt-4">
        {categories.map(([genre, videos]) => {
          const genreData = genresList.find((g) => g.name.toLowerCase() === genre.toLowerCase());
          const genreId = genreData ? genreData.id : encodeURIComponent(genre);
          const rawName = genreData ? genreData.name : genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
          const formattedTitle = translateGenre(rawName);
          return (
            <VideoCarousel key={genre} title={formattedTitle} videos={videos} genreId={genreId} />
          );
        })}
      </div>
    </main>
  );
}
