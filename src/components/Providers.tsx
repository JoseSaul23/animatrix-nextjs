"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { initializeWatchlist } from "@/store/slices/watchlistSlice";
import { initializeHistory, MAX_WATCH_HISTORY } from "@/store/slices/watchHistorySlice";
import GlobalShortcuts from "./GlobalShortcuts";
import { PlayerProvider } from "./PlayerProvider";
import { LanguageProvider } from "@/i18n";

/**
 * Componente que sincroniza el almacenamiento local (`localStorage`)
 * con el estado de Redux al montar la aplicación en el navegador.
 */
function StoreInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Cargar datos iniciales desde localStorage
    const loadInitialData = () => {
      try {
        const storedList = localStorage.getItem("animatrix_watchlist");
        if (storedList) {
          const parsed = JSON.parse(storedList);
          if (Array.isArray(parsed)) {
            dispatch(initializeWatchlist(parsed));
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al cargar favoritos desde localStorage", e);
        }
      }

      try {
        const storedHistory = localStorage.getItem("animatrix_watch_history");
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            dispatch(initializeHistory(parsed.slice(0, MAX_WATCH_HISTORY)));
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error al cargar historial desde localStorage", e);
        }
      }
    };

    loadInitialData();

    // 2. Sincronización en tiempo real entre múltiples pestañas mediante evento 'storage'
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "animatrix_watchlist" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            dispatch(initializeWatchlist(parsed));
          }
        } catch {}
      } else if (e.key === "animatrix_watch_history" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            dispatch(initializeHistory(parsed.slice(0, MAX_WATCH_HISTORY)));
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  return null;
}

/**
 * Envoltorio (wrapper) global de estado y contextos de cliente.
 * Eliminado QueryClientProvider: el catálogo estático no requiere capas de fetch cliente.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <StoreInitializer />
      <LanguageProvider>
        <PlayerProvider>
          <GlobalShortcuts />
          {children}
        </PlayerProvider>
      </LanguageProvider>
    </Provider>
  );
}
