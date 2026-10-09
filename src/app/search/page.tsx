"use client";

import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import VideoCard from "@/components/VideoCard";
import { Suspense, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setQuery,
  setDurationFilter,
  setSortBy,
  resetFilters,
  DurationFilter,
  SortOption,
} from "@/store/slices/searchSlice";
import { Video } from "@/types/video";
import { parseDurationToSeconds } from "@/lib/utils";
import { allVideos } from "@/lib/videos";
import { useLanguage } from "@/i18n";

/**
 * ============================================================================
 * BUSCADOR Y FILTRADO AVANZADO (Next.js App Router)
 * ============================================================================
 * Conceptos clave:
 * 1. `useSearchParams()` y `<Suspense>`:
 *    En Next.js App Router, cualquier componente cliente que lea `useSearchParams()`
 *    debe estar envuelto en un `<Suspense>` boundary.
 * 2. Búsqueda Difusa en Memoria (`fuse.js`):
 *    El índice de Fuse opera directamente sobre el catálogo en memoria con 0 ms de latencia.
 */
function SearchContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const reduxQuery = useAppSelector((state) => state.search.query);
  const durationFilter = useAppSelector((state) => state.search.durationFilter);
  const sortBy = useAppSelector((state) => state.search.sortBy);

  const urlQuery = searchParams.get("q") || "";

  // Sincronizar parámetro de URL a Redux si se accede directamente por link
  useEffect(() => {
    if (!reduxQuery && urlQuery) {
      dispatch(setQuery(urlQuery));
    }
  }, [urlQuery, reduxQuery, dispatch]);

  const query = reduxQuery || urlQuery;
  const videosData = allVideos;

  // Índice Fuse memoizado: catálogo instantáneo sin waterfall
  const fuse = useMemo(() => {
    return new Fuse(videosData, {
      keys: ["title", "genres", "description"],
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: true,
    });
  }, [videosData]);

  // Búsqueda, filtrado y ordenamiento computados de forma eficiente con useMemo
  const filteredVideos = useMemo(() => {
    if (!videosData) return [];

    let list: Video[] = [];

    if (query.trim() !== "" && fuse) {
      const terms = query.split(" ").filter((t) => t.trim().length > 0);
      const extendedQuery = terms.map((term) => `'${term}`).join(" ");

      const results = fuse.search(extendedQuery.length > 0 ? extendedQuery : query);

      if (results.length > 0) {
        list = results.map((result) => result.item);
      } else {
        const fallbackResults = fuse.search(query);
        list = fallbackResults.map((result) => result.item);
      }
    } else {
      list = [...videosData];
    }

    // 1. Filtrar por Duración
    if (durationFilter !== "all") {
      list = list.filter((video) => {
        const sec = parseDurationToSeconds(video.duration);
        if (durationFilter === "short") return sec > 0 && sec < 300; // < 5 min
        if (durationFilter === "medium") return sec >= 300 && sec <= 900; // 5 a 15 min
        if (durationFilter === "long") return sec > 900; // > 15 min
        return true;
      });
    }

    // 2. Ordenar de forma inmutable
    const sorted = [...list];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === "shortest") {
      sorted.sort((a, b) => parseDurationToSeconds(a.duration) - parseDurationToSeconds(b.duration));
    } else if (sortBy === "longest") {
      sorted.sort((a, b) => parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration));
    } else if (sortBy === "title_asc") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [videosData, fuse, query, durationFilter, sortBy]);

  const isFiltered = durationFilter !== "all" || sortBy !== "relevance";

  return (
    <main className="min-h-screen bg-cinema-black pt-navbar pb-24">
      <div className="px-4 md:px-12 pt-8 pb-4">
        <div className="gala-badge mb-2">
          <span className="gala-badge-dot" />
          <span className="gala-badge-text">
            {locale === "es" ? "Búsqueda de Catálogo" : "Catalog Search"}
          </span>
        </div>
        <h1 className="text-white text-3xl md:text-5xl font-editorial font-bold tracking-tight mb-2">
          {query.trim() === ""
            ? (locale === "es" ? "Explorar Catálogo de Estrenos" : "Explore Premieres Catalog")
            : (locale === "es" ? `Resultados para "${query}"` : `Results for "${query}"`)}
        </h1>
        <p className="text-gray-400 text-sm mb-6 font-light">
          {t("search.resultsCount", { count: filteredVideos.length })}
        </p>

        {/* Filtros Interactivos Neo-Clásicos */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
          {/* Filtro de Duración */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-cinema tracking-wider text-cinema-emerald mr-1">
              {locale === "es" ? "Duración:" : "Duration:"}
            </span>
            {(
              [
                { id: "all", label: t("search.allDurations") },
                { id: "short", label: t("search.short") },
                { id: "medium", label: t("search.medium") },
                { id: "long", label: t("search.long") },
              ] as { id: DurationFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => dispatch(setDurationFilter(opt.id))}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  durationFilter === opt.id
                    ? "bg-cinema-emerald text-black font-semibold shadow-md shadow-cinema-emerald/20"
                    : "bg-cinema-card text-gray-300 hover:bg-neutral-800 hover:text-white border border-neutral-800 hover:border-cinema-border-emerald"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filtro de Ordenamiento */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinema tracking-wider text-cinema-emerald">
              {t("search.sortBy")}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value as SortOption))}
              className="bg-cinema-card text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-neutral-700/80 focus:outline-none focus:border-cinema-emerald cursor-pointer"
            >
              <option value="relevance">{t("search.relevance")}</option>
              <option value="newest">{t("search.recent")}</option>
              <option value="shortest">{t("search.durationAsc")}</option>
              <option value="longest">{t("search.durationDesc")}</option>
              <option value="title_asc">{locale === "es" ? "Título (A-Z)" : "Title (A-Z)"}</option>
            </select>

            {isFiltered && (
              <button
                onClick={() => dispatch(resetFilters())}
                className="text-xs text-gray-400 hover:text-cinema-emerald underline ml-2 transition-colors font-medium"
              >
                {locale === "es" ? "Restablecer" : "Reset"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-12 pt-4">
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400 text-center">
            <div className="w-16 h-16 rounded-full bg-cinema-card border border-cinema-border-emerald flex items-center justify-center mb-4 shadow-[0_0_25px_var(--color-cinema-glow-emerald)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-cinema-emerald"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-editorial font-bold text-white mb-2">{t("search.noResultsTitle")}</h2>
            <p className="text-center max-w-sm text-sm font-light leading-relaxed">
              {t("search.noResultsDesc")}
            </p>
            {isFiltered && (
              <button
                onClick={() => dispatch(resetFilters())}
                className="btn-cinema-primary mt-5 px-5 py-2 text-xs"
              >
                {t("search.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-black pt-navbar"></div>}>
      <SearchContent />
    </Suspense>
  );
}
