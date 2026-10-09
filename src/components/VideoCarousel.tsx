"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import VideoCard from "./VideoCard";
import { useLanguage } from "@/i18n";

import { Video } from "@/types/video";

export default function VideoCarousel({ title, videos, genreId }: { title: string; videos: Video[]; genreId?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);
  const { t } = useLanguage();

  const handleClick = (direction: "left" | "right") => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <div className="space-y-1 md:space-y-2 px-4 md:px-12 py-3 group/carousel">
      {title && (
        genreId ? (
          <Link href={`/genre/${genreId}`}>
            <div className="inline-flex items-center gap-3 cursor-pointer group/title mb-1">
              <h2 className="text-white text-xl md:text-2xl font-editorial font-bold tracking-tight transition group-hover/title:text-cinema-emerald flex items-center gap-2.5">
                <span className="cinema-accent-bar" />
                {title}
              </h2>
              <span className="text-xs font-cinema tracking-widest uppercase font-semibold text-cinema-emerald opacity-0 group-hover/title:opacity-100 transition-all duration-300 flex items-center gap-1">
                {t("genres.exploreHall")}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </span>
            </div>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2.5 mb-1">
            <span className="cinema-accent-bar" />
            <h2 className="text-white text-xl md:text-2xl font-editorial font-bold tracking-tight">
              {title}
            </h2>
          </div>
        )
      )}

      <div className="relative group">
        <button
          onClick={() => handleClick("left")}
          aria-label="Desplazar a la izquierda"
          className={`absolute top-0 bottom-0 left-0 z-40 m-auto h-12 w-12 rounded-r-lg bg-black/60 hover:bg-black/90 backdrop-blur-md border-r border-y border-white/10 flex items-center justify-center cursor-pointer text-white opacity-0 transition-all duration-300 group-hover/carousel:opacity-100 ${!isMoved && "hidden"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-6 w-6 text-cinema-emerald hover:scale-125 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="flex items-center gap-3 md:gap-4 overflow-x-scroll hide-scrollbar py-3 px-1"
        >
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        <button
          onClick={() => handleClick("right")}
          aria-label="Desplazar a la derecha"
          className="absolute top-0 bottom-0 right-0 z-40 m-auto h-12 w-12 rounded-l-lg bg-black/60 hover:bg-black/90 backdrop-blur-md border-l border-y border-white/10 flex items-center justify-center cursor-pointer text-white opacity-0 transition-all duration-300 group-hover/carousel:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-6 w-6 text-cinema-emerald hover:scale-125 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
