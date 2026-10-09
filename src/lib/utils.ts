/**
 * Utilidades compartidas para formateo de tiempos y operaciones comunes.
 */

/**
 * Convierte una cadena de tiempo con formato "mm:ss" o "hh:mm:ss" a segundos numéricos.
 *
 * @example
 * parseDurationToSeconds("10:34") // Retorna: 634
 * parseDurationToSeconds("1:14:05") // Retorna: 4445
 *
 * @param {string} duration - Cadena de texto con el tiempo.
 * @returns {number} Tiempo equivalente en segundos.
 */
export function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(duration) || 0;
}

/**
 * Formatea un número de segundos a una representación textual legible ("m:ss" o "h:mm:ss").
 *
 * @example
 * formatSecondsToTime(634) // Retorna: "10:34"
 * formatSecondsToTime(4445) // Retorna: "1:14:05"
 *
 * @param {number} seconds - Cantidad de segundos a formatear.
 * @returns {string} Cadena formateada para la interfaz de reproducción.
 */
export function formatSecondsToTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
