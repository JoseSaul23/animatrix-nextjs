import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./slices/searchSlice";
import watchlistReducer from "./slices/watchlistSlice";
import playerReducer from "./slices/playerSlice";
import watchHistoryReducer from "./slices/watchHistorySlice";
import { persistenceListenerMiddleware } from "./middleware/persistence";

/**
 * ============================================================================
 * REDUX STORE CONFIGURATION (Next.js App Router Architecture)
 * ============================================================================
 * ¿Por qué `makeStore` es una función factory en lugar de un objeto singleton?
 * En una SPA tradicional (ej. Create React App o Vite), se suele exportar `const store = configureStore(...)`.
 * Sin embargo, en Next.js (con SSR y Server Components), un singleton global causaría
 * que múltiples peticiones HTTP concurrentes compartan la misma instancia en memoria,
 * produciendo fugas de datos entre usuarios.
 *
 * `makeStore()` garantiza que cada sesión de usuario obtenga su propia instancia limpia.
 *
 * @returns {AppStore} Instancia configurada del Store de Redux con middleware de persistencia.
 */
export const makeStore = () => {
  return configureStore({
    reducer: {
      search: searchReducer,
      watchlist: watchlistReducer,
      player: playerReducer,
      watchHistory: watchHistoryReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(persistenceListenerMiddleware.middleware),
  });
};

// Inferencia de tipos estricta de TypeScript recomendada por Redux Toolkit
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

