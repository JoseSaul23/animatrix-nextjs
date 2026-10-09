"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import VideoCard from "@/components/VideoCard";
import genresList from "@/data/genres.json";
import { allVideos } from "@/lib/videos";
import { useLanguage } from "@/i18n";

export default function GenrePage() {
  const params = useParams();
  const rawGenre = params.name as string;
  const decodedGenreId = decodeURIComponent(rawGenre || "");
  const { t, translateGenre } = useLanguage();

  const videosData = allVideos;

  if (videosData.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cinema-black text-white">
        {t("genres.loadError")}
      </div>
    );
  }

  const genreData = genresList.find((g) => g.id === decodedGenreId.toLowerCase());
  const genreRawName = genreData ? genreData.name : decodedGenreId;
  const genreDisplayName = translateGenre(genreRawName);
  const genreImage = genreData?.image || (videosData[0]?.thumbnail ?? "");

  // Filtrar videos según el género seleccionado
  let genreVideos = videosData.filter((v) =>
    v.genres.some((g) => g.toLowerCase() === genreRawName.toLowerCase())
  );

  if (genreVideos.length === 0) {
    genreVideos = videosData;
  }

  return (
    <main className="min-h-screen bg-cinema-black pb-24 relative pt-navbar">
      {/* Banner de la imagen del género con next/image optimizado */}
      <div className="relative h-[45vh] md:h-[58vh] w-full text-white overflow-hidden">
        {genreImage ? (
          <Image
            src={genreImage}
            alt={genreDisplayName}
            fill
            priority
            sizes="100vw"
            className="object-cover scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cinema-black/50 to-cinema-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/80 via-transparent to-transparent" />
      </div>

      {/* Sección con el nombre del género y la cuadrícula de videos */}
      <div className="relative z-20 -mt-16 md:-mt-24 px-4 md:px-12 space-y-5">
        <div>
          <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-editorial font-bold tracking-tight">
            {genreDisplayName}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
          {genreVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </main>
  );
}
