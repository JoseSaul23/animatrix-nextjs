"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoCard from "@/components/VideoCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeWatchlist, removeFromWatchlist } from "@/store/slices/watchlistSlice";
import { initializeHistory } from "@/store/slices/watchHistorySlice";
import { parseDurationToSeconds } from "@/lib/utils";
import { allVideos } from "@/lib/videos";
import { useLanguage } from "@/i18n";

type SortOption = "recent" | "duration-asc" | "duration-desc" | "title-asc" | "title-desc";
type ViewMode = "grid" | "detailed";

export default function MyListPage() {
  const dispatch = useAppDispatch();
  const watchlist = useAppSelector((state) => state.watchlist.items);
  const watchHistory = useAppSelector((state) => state.watchHistory.items);
  const { t, translateGenre, getVideoDescription, locale } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de filtrado, ordenamiento y vista
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Estado para notificaciones Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const videosData = allVideos;

  // Videos guardados completos
  const savedVideos = useMemo(() => {
    return videosData.filter((v) => watchlist.includes(v.id));
  }, [videosData, watchlist]);

  // Lista de géneros disponibles entre las obras guardadas
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    savedVideos.forEach((v) => v.genres.forEach((g) => genresSet.add(g)));
    return Array.from(genresSet).sort();
  }, [savedVideos]);

  // Filtrado y ordenamiento de videos
  const processedVideos = useMemo(() => {
    let result = [...savedVideos];

    // 1. Filtrar por género
    if (selectedGenre !== "all") {
      result = result.filter((v) => v.genres.includes(selectedGenre));
    }

    // 2. Ordenar según la opción seleccionada
    result.sort((a, b) => {
      if (sortBy === "recent") {
        // Los agregados más recientemente aparecen primero
        return watchlist.indexOf(b.id) - watchlist.indexOf(a.id);
      }
      if (sortBy === "duration-asc") {
        return parseDurationToSeconds(a.duration) - parseDurationToSeconds(b.duration);
      }
      if (sortBy === "duration-desc") {
        return parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title, locale === "en" ? "en" : "es", { sensitivity: "base" });
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title, locale === "en" ? "en" : "es", { sensitivity: "base" });
      }
      return 0;
    });

    return result;
  }, [savedVideos, selectedGenre, sortBy, watchlist, locale]);

  // Exportar Colección a un archivo .json descargable
  const handleExportCollection = () => {
    try {
      const exportPayload = {
        app: "Animatrix",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        watchlist: watchlist,
        watchHistory: watchHistory,
        meta: {
          totalSaved: watchlist.length,
          totalHistory: watchHistory.length,
        },
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split("T")[0];
      const link = document.createElement("a");
      link.href = url;
      link.download = `animatrix-collection-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(t("myList.exportSuccess"));
    } catch (e) {
      console.error("Error al exportar", e);
      showToast(locale === "es" ? "Hubo un error al exportar tu colección" : "Error exporting your collection");
    }
  };

  // Importar Colección desde un archivo .json seleccionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedIds: string[] = [];

        // Validar formato flexible (con clave watchlist o arreglo directo)
        if (parsed && Array.isArray(parsed.watchlist)) {
          importedIds = parsed.watchlist.filter((id: unknown): id is string => typeof id === "string");
        } else if (Array.isArray(parsed)) {
          importedIds = parsed.filter((id: unknown): id is string => typeof id === "string");
        }

        if (importedIds.length === 0) {
          showToast(t("myList.importError"));
          return;
        }

        // Combinar con la lista actual sin duplicados
        const mergedWatchlist = Array.from(new Set([...watchlist, ...importedIds]));
        dispatch(initializeWatchlist(mergedWatchlist));

        // Importar historial si está presente en el archivo
        if (parsed && Array.isArray(parsed.watchHistory) && parsed.watchHistory.length > 0) {
          const mergedHistory = [...parsed.watchHistory, ...watchHistory]
            .filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
            .slice(0, 15);
          dispatch(initializeHistory(mergedHistory));
        }

        showToast(t("myList.importSuccess", { count: importedIds.length }));
      } catch (err) {
        console.error("Error al leer archivo JSON", err);
        showToast(t("myList.importError"));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };



  return (
    <main className="min-h-screen bg-cinema-black pt-navbar pb-24 text-white">
      {/* Toast Flotante de Notificación */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-cinema-card border border-cinema-border-emerald text-cinema-emerald font-cinema text-xs uppercase tracking-wider font-semibold shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(30,215,96,0.3)] flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cinema-emerald" />
          {toastMessage}
        </div>
      )}

      {/* Input de archivo invisible para importar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Encabezado y Acciones de Colección */}
      <div className="px-4 md:px-12 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="gala-badge mb-2">
              <span className="gala-badge-dot" />
              <span className="gala-badge-text">{locale === "es" ? "Colección Privada" : "Private Collection"}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-white text-3xl md:text-5xl font-editorial font-bold tracking-tight">
                {t("myList.title")}
              </h1>
              {savedVideos.length > 0 && (
                <span className="ticket-badge font-cinema text-xs px-2.5 py-1">
                  {savedVideos.length} {savedVideos.length === 1 ? (locale === "es" ? "OBRA" : "WORK") : (locale === "es" ? "OBRAS" : "WORKS")}
                </span>
              )}
            </div>
          </div>

          {/* Botones de Exportar e Importar Colección */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCollection}
              disabled={savedVideos.length === 0}
              className="btn-cinema-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              title={locale === "es" ? "Descargar copia de seguridad en JSON de tus obras guardadas" : "Download JSON backup of your saved works"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.5V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {t("myList.exportJson")}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-cinema-secondary text-xs"
              title={locale === "es" ? "Cargar un archivo .json de respaldo" : "Upload JSON backup file"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.5V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {t("myList.importJson")}
            </button>
          </div>
        </div>

        {/* Barra de Filtros, Ordenamiento y Modo de Vista (Solo si hay videos guardados) */}
        {savedVideos.length > 0 && (
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filtro por Género (Pills interactivas) */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setSelectedGenre("all")}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 shrink-0 font-medium ${
                  selectedGenre === "all"
                    ? "bg-cinema-emerald text-black font-semibold shadow-[0_0_15px_rgba(30,215,96,0.3)]"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {t("myList.allGenres")} ({savedVideos.length})
              </button>

              {availableGenres.map((genre) => {
                const count = savedVideos.filter((v) => v.genres.includes(genre)).length;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 shrink-0 font-medium flex items-center gap-1.5 ${
                      selectedGenre === genre
                        ? "bg-cinema-emerald text-black font-semibold shadow-[0_0_15px_rgba(30,215,96,0.3)]"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{translateGenre(genre)}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Selector de Orden y Alternador de Vista */}
            <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
              {/* Dropdown de Ordenamiento */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-cinema uppercase tracking-wider hidden sm:inline">
                  {t("myList.sortBy")}:
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-cinema-card border border-cinema-border-emerald text-white text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-cinema-emerald cursor-pointer appearance-none"
                  >
                    <option value="recent">{t("myList.sortRecent")}</option>
                    <option value="duration-asc">{t("myList.sortDurationAsc")}</option>
                    <option value="duration-desc">{t("myList.sortDurationDesc")}</option>
                    <option value="title-asc">{t("myList.sortTitleAsc")}</option>
                    <option value="title-desc">{t("myList.sortTitleDesc")}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cinema-emerald">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botones de Vista: Cuadrícula vs Ficha Técnica */}
              <div className="flex items-center rounded-lg bg-cinema-card border border-white/10 p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition ${
                    viewMode === "grid"
                      ? "bg-cinema-emerald text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Vista en Cuadrícula"
                  aria-label="Vista en cuadrícula"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`p-1.5 rounded transition ${
                    viewMode === "detailed"
                      ? "bg-cinema-emerald text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Vista de Ficha Técnica Detallada"
                  aria-label="Vista detallada"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor Principal de Videos */}
      <div className="px-4 md:px-12 pt-6">
        {savedVideos.length > 0 ? (
          processedVideos.length > 0 ? (
            viewMode === "grid" ? (
              /* Vista 1: Cuadrícula Clásica */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {processedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              /* Vista 2: Ficha Técnica Detallada Neo-Clásica */
              <div className="space-y-4 max-w-5xl">
                {processedVideos.map((video) => {
                  const historyItem = watchHistory.find((item) => item.id === video.id);
                  const progressPercent =
                    historyItem && historyItem.durationSec > 0
                      ? Math.min(100, Math.round((historyItem.currentTime / historyItem.durationSec) * 100))
                      : 0;
                  const watchUrl =
                    historyItem &&
                    historyItem.currentTime > 5 &&
                    (historyItem.durationSec === 0 || historyItem.currentTime < historyItem.durationSec - 5)
                      ? `/watch/${video.id}?t=${Math.floor(historyItem.currentTime)}`
                      : `/watch/${video.id}`;

                  return (
                    <div
                      key={video.id}
                      className="group flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-cinema-card border border-white/5 hover:border-cinema-border-emerald transition-all duration-300"
                    >
                      {/* Miniatura Poster */}
                      <Link
                        href={watchUrl}
                        className="relative w-full sm:w-56 aspect-[16/9] rounded-lg overflow-hidden shrink-0 cinema-border"
                      >
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 224px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full btn-cinema-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        {progressPercent > 0 && progressPercent < 98 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                            <div
                              className="h-full bg-cinema-emerald"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </Link>

                      {/* Información Editorial */}
                      <div className="flex-1 flex flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="ticket-badge font-cinema">⏱ {video.duration} MIN</span>
                            {progressPercent > 0 && progressPercent < 98 && (
                              <span className="text-[10px] text-cinema-emerald font-cinema uppercase font-semibold">
                                {progressPercent}% {locale === "es" ? "reproducido" : "played"}
                              </span>
                            )}
                          </div>
                          <Link href={watchUrl}>
                            <h3 className="text-xl font-editorial font-bold text-white group-hover:text-cinema-emerald transition-colors line-clamp-1">
                              {video.title}
                            </h3>
                          </Link>
                          <p className="text-gray-300 text-xs md:text-sm font-light mt-1.5 line-clamp-2 leading-relaxed">
                            {getVideoDescription(video)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {video.genres.map((g) => (
                              <span key={g} className="text-[10px] text-gray-400 font-light bg-white/5 px-2 py-0.5 rounded">
                                {translateGenre(g)}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={watchUrl}
                              className="btn-cinema-primary text-xs px-3.5 py-1.5"
                            >
                              {progressPercent > 0 && progressPercent < 98
                                ? (locale === "es" ? "Continuar" : "Resume")
                                : (locale === "es" ? "Ver Ahora" : "Watch Now")}
                            </Link>
                            <button
                              onClick={() => {
                                dispatch(removeFromWatchlist(video.id));
                                showToast(t("watch.removedFromList"));
                              }}
                              className="text-xs text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition"
                              title={t("videoCard.removeFromWatchlist")}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Estado vacío cuando el filtro por género no arroja resultados */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400 text-sm mb-4">
                {locale === "es"
                  ? <>No tienes ninguna obra guardada en el género <span className="text-cinema-emerald font-semibold">&ldquo;{translateGenre(selectedGenre)}&rdquo;</span>.</>
                  : <>You have no saved films in the genre <span className="text-cinema-emerald font-semibold">&ldquo;{translateGenre(selectedGenre)}&rdquo;</span>.</>}
              </p>
              <button
                onClick={() => setSelectedGenre("all")}
                className="btn-cinema-secondary text-xs"
              >
                {t("myList.resetFilters")}
              </button>
            </div>
          )
        ) : (
          /* Estado vacío general de la colección */
          <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-cinema-card border border-cinema-border-emerald flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(30,215,96,0.15)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-9 h-9 text-cinema-emerald">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-2xl font-editorial font-bold text-white mb-2">{t("myList.emptyTitle")}</h2>
            <p className="text-gray-400 max-w-md mb-8 text-sm font-light leading-relaxed">
              {t("myList.emptyDesc")}
            </p>
            <div className="flex items-center gap-3">
              <Link href="/" className="btn-cinema-primary px-7 py-3">
                {t("myList.exploreBillboard")}
              </Link>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-cinema-secondary px-5 py-3"
              >
                {t("myList.importJson")}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
