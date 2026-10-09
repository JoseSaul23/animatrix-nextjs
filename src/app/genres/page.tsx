"use client";

import Link from "next/link";
import Image from "next/image";
import genresList from "@/data/genres.json";
import { useLanguage } from "@/i18n";

export default function GenresPage() {
  const { t, translateGenre } = useLanguage();

  return (
    <main className="min-h-screen bg-cinema-black pt-navbar pb-16">
      <div className="px-4 md:px-12 pt-8 pb-4">
        <h1 className="text-white text-3xl md:text-5xl font-editorial font-bold tracking-tight">
          {t("genres.title")}
        </h1>
      </div>

      <div className="px-4 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
          {genresList.map((genre) => (
            <Link key={genre.id} href={`/genre/${genre.id}`}>
              <div className="group cursor-pointer space-y-2.5">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-cinema-card cinema-border transition-all duration-300 group-hover:scale-105 shadow-xl">
                  {genre.image ? (
                    <Image
                      src={genre.image}
                      alt={translateGenre(genre.name)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-cinema text-cinema-emerald tracking-widest uppercase">
                      {t("genres.specialRoom")}
                    </span>
                    <span className="text-xs text-white/70 group-hover:text-cinema-emerald transition-colors">
                      {t("genres.enter")}
                    </span>
                  </div>
                </div>
                <h3 className="text-white text-lg font-editorial font-bold group-hover:text-cinema-emerald transition-colors tracking-tight">
                  {translateGenre(genre.name)}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
