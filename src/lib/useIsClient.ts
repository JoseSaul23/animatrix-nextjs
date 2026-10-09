import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * ============================================================================
 * HOOK: useIsClient (Next.js & React 19 Hydration Pattern)
 * ============================================================================
 * ¿Por qué es necesario este hook en Next.js?
 * En Next.js, los componentes se renderizan primero en el servidor (SSR)
 * produciendo HTML estático, y luego se "hidratan" en el navegador del usuario.
 *
 * El problema común (Hydration Mismatch):
 * Si renderizamos información que solo existe en el navegador (como `localStorage`
 * o `window`), el HTML generado en el servidor diferirá del cliente, causando un error.
 *
 * ¿Por qué NO usar `useEffect(() => setMounted(true), [])`?
 * En React 19 y Next.js moderno, llamar a `setState` síncronamente dentro de un
 * `useEffect` genera una penalización de rendimiento ("cascading render") y dispara
 * advertencias del compilador de React.
 *
 * La solución recomendada: `useSyncExternalStore`:
 * Retorna de forma síncrona `false` en el servidor (`getServerSnapshot`) y `true`
 * en el navegador (`getSnapshot`) sin requerir renders adicionales.
 *
 * @returns {boolean} `true` si el componente está montado en el navegador, `false` en SSR.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Snapshot en el cliente
    () => false  // Snapshot en el servidor (SSR)
  );
}
