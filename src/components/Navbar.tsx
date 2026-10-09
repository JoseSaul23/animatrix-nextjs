"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import videosData from "@/data/videos.json";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setQuery } from "@/store/slices/searchSlice";
import { useIsClient } from "@/lib/useIsClient";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/i18n";

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.search.query);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isInicio = pathname === "/";
  const isShorts = pathname === "/shorts";
  const isGenres = pathname === "/genres";
  const isMyList = pathname === "/my-list";
  const watchlistCount = useAppSelector((state) => state.watchlist.items.length);
  const mounted = useIsClient();

  // Cerrar menú móvil al navegar de forma síncrona sin disparar render en cascada
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Si se entra por primera vez a /search con parámetro ?q= en la URL, sincronizar a Redux
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (pathname === "/search" && urlQuery && !query) {
      dispatch(setQuery(urlQuery));
    } else if (pathname !== "/search" && query) {
      dispatch(setQuery(""));
    }
  }, [pathname, searchParams, dispatch, query]);

  const handleRandomVideo = () => {
    if (!videosData || videosData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * videosData.length);
    const randomVideo = videosData[randomIndex];
    setIsMobileMenuOpen(false);
    router.push(`/watch/${randomVideo.id}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setQuery(value));

    if (value.trim()) {
      if (pathname !== "/search") {
        router.push("/search");
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
      }
    } else {
      if (pathname === "/search") {
        router.push("/");
      }
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled || isMobileMenuOpen ? "bg-cinema-black/95 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-gradient-to-b from-black/90 to-transparent"
    }`}>
      <div className="px-4 md:px-12 w-full h-[var(--navbar-height-scrolled)] flex items-center justify-between">
        <div className="flex items-center gap-6 lg:gap-10">
          {/* Botón Hamburguesa en Móviles */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-300 hover:text-cinema-emerald transition-colors"
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          <Link href="/">
            <span className="text-white text-xl md:text-2xl font-cinema font-bold tracking-[0.22em] cursor-pointer flex items-center gap-1 hover:text-cinema-emerald transition-colors select-none">
              <span className="text-cinema-emerald">A</span>NIMATRIX
            </span>
          </Link>

          {/* Menú de Escritorio con estructura semántica ul > li > a */}
          <ul className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-medium tracking-wide">
            <li>
              <Link
                href="/"
                className={`cursor-pointer transition-colors duration-200 py-1 flex items-center gap-1.5 ${
                  isInicio ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                {isInicio && <span className="w-1 h-1 rounded-full bg-cinema-emerald" />}
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link
                href="/shorts"
                className={`cursor-pointer transition-colors duration-200 py-1 flex items-center gap-1.5 ${
                  isShorts ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                {isShorts && <span className="w-1 h-1 rounded-full bg-cinema-emerald" />}
                {t("nav.shorts")}
              </Link>
            </li>
            <li>
              <Link
                href="/genres"
                className={`cursor-pointer transition-colors duration-200 py-1 flex items-center gap-1.5 ${
                  isGenres ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                {isGenres && <span className="w-1 h-1 rounded-full bg-cinema-emerald" />}
                {t("nav.genres")}
              </Link>
            </li>
            <li>
              <Link
                href="/my-list"
                className={`flex items-center gap-2 cursor-pointer transition-colors duration-200 py-1 ${
                  isMyList ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                {isMyList && <span className="w-1 h-1 rounded-full bg-cinema-emerald" />}
                <span>{t("nav.myList")}</span>
                {mounted && watchlistCount > 0 && (
                  <span className="bg-cinema-emerald text-black text-[10px] font-cinema font-bold px-1.5 py-0.2 rounded-full leading-tight">
                    {watchlistCount}
                  </span>
                )}
              </Link>
            </li>
            <li className="flex items-center">
              <button
                onClick={handleRandomVideo}
                title={t("nav.randomTooltip")}
                aria-label={t("nav.randomAria")}
                className="p-1.5 hover:bg-cinema-emerald/10 text-gray-300 hover:text-cinema-emerald rounded-full transition flex items-center justify-center border border-transparent hover:border-cinema-emerald/30 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 hover:rotate-12 transition-transform"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                  <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
                  <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
                  <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 sm:gap-3.5 text-white">
          {/* Selector de idioma a la izquierda del input de búsqueda */}
          <LanguageSelector />

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={t("nav.searchPlaceholder")}
              className="bg-neutral-900/80 text-white text-xs md:text-sm border border-neutral-700/70 focus:border-cinema-emerald rounded-full px-3.5 sm:px-4 py-1.5 pr-8 sm:pr-9 w-32 sm:w-56 md:w-64 lg:w-72 focus:outline-none placeholder:text-neutral-400 transition shadow-inner"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-cinema-card/95 backdrop-blur-xl border-b border-cinema-border-emerald px-6 py-4 space-y-3">
          <ul className="flex flex-col gap-3 text-sm font-medium">
            <li>
              <Link
                href="/"
                className={`flex items-center justify-between py-1 transition-colors ${
                  isInicio ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                <span>{t("nav.home")}</span>
                {isInicio && <span className="w-1.5 h-1.5 rounded-full bg-cinema-emerald" />}
              </Link>
            </li>
            <li>
              <Link
                href="/shorts"
                className={`flex items-center justify-between py-1 transition-colors ${
                  isShorts ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                <span>{t("nav.shorts")}</span>
                {isShorts && <span className="w-1.5 h-1.5 rounded-full bg-cinema-emerald" />}
              </Link>
            </li>
            <li>
              <Link
                href="/genres"
                className={`flex items-center justify-between py-1 transition-colors ${
                  isGenres ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                <span>{t("nav.genres")}</span>
                {isGenres && <span className="w-1.5 h-1.5 rounded-full bg-cinema-emerald" />}
              </Link>
            </li>
            <li>
              <Link
                href="/my-list"
                className={`flex items-center justify-between py-1 transition-colors ${
                  isMyList ? "text-cinema-emerald font-bold" : "text-gray-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{t("nav.myList")}</span>
                  {mounted && watchlistCount > 0 && (
                    <span className="bg-cinema-emerald text-black text-[10px] font-cinema font-bold px-1.5 py-0.2 rounded-full leading-tight">
                      {watchlistCount}
                    </span>
                  )}
                </div>
                {isMyList && <span className="w-1.5 h-1.5 rounded-full bg-cinema-emerald" />}
              </Link>
            </li>
            <li className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleRandomVideo}
                className="flex items-center gap-2 text-cinema-emerald text-xs font-semibold py-1 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                  <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
                  <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
                  <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
                </svg>
                <span>{t("nav.randomTooltip")}</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="fixed top-0 w-full z-50 bg-cinema-black h-[var(--navbar-height-scrolled)] flex items-center border-b border-white/5">
          <div className="px-4 md:px-12 w-full flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/">
                <span className="text-white text-xl md:text-2xl font-cinema font-bold tracking-[0.22em] cursor-pointer">
                  <span className="text-cinema-emerald">A</span>NIMATRIX
                </span>
              </Link>
            </div>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}

