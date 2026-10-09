import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toggleWatchlist, removeFromWatchlist, initializeWatchlist } from "../slices/watchlistSlice";
import { recordProgress, removeFromHistory, clearHistory, initializeHistory } from "../slices/watchHistorySlice";
import type { RootState } from "../index";

/**
 * ============================================================================
 * REDUX TOOLKIT LISTENER MIDDLEWARE (Persistencia Limpia)
 * ============================================================================
 * Regla de Oro de Redux: Los Reducers DEBEN ser funciones puras.
 * Un reducer no debe ejecutar operaciones de I/O, timers ni acceder a `localStorage`.
 * Colocar `localStorage.setItem` dentro de un reducer rompe el Time-Travel Debugging,
 * genera efectos secundarios impredecibles y falla en entornos SSR de Next.js.
 *
 * Solución con `createListenerMiddleware`:
 * Intercepta acciones específicas DESPUÉS de que el reducer ha actualizado el estado,
 * permitiendo sincronizar con `localStorage` de forma segura y aislada.
 */
export const persistenceListenerMiddleware = createListenerMiddleware();

// Listener para la lista de favoritos (Watchlist)
persistenceListenerMiddleware.startListening({
  matcher: isAnyOf(toggleWatchlist, removeFromWatchlist, initializeWatchlist),
  effect: (_action, listenerApi) => {
    if (typeof window === "undefined") return;
    const state = listenerApi.getState() as RootState;
    try {
      localStorage.setItem("animatrix_watchlist", JSON.stringify(state.watchlist.items));
    } catch (e) {
      console.error("Error al persistir favoritos en localStorage", e);
    }
  },
});

persistenceListenerMiddleware.startListening({
  matcher: isAnyOf(recordProgress, removeFromHistory, clearHistory, initializeHistory),
  effect: (_action, listenerApi) => {
    if (typeof window === "undefined") return;
    const state = listenerApi.getState() as RootState;
    try {
      localStorage.setItem("animatrix_watch_history", JSON.stringify(state.watchHistory.items));
    } catch (e) {
      console.error("Error al persistir historial en localStorage", e);
    }
  },
});
