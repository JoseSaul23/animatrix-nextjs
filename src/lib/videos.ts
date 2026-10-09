import rawVideos from "@/data/videos.json";
import { Video } from "@/types/video";

/**
 * Catálogo inmutable de cortometrajes en memoria.
 * Evita peticiones HTTP innecesarias en cliente hacia `/api/videos`.
 */
export const allVideos: Video[] = rawVideos as Video[];

/**
 * Obtiene el catálogo completo de cortometrajes.
 * @returns {Video[]} Lista de videos del catálogo.
 */
export function getAllVideos(): Video[] {
  return allVideos;
}

/**
 * Busca un cortometraje por su identificador único de YouTube.
 * @param {string} id - ID del video de YouTube.
 * @returns {Video | undefined} Video encontrado o undefined.
 */
export function getVideoById(id: string): Video | undefined {
  return allVideos.find((video) => video.id === id);
}

/**
 * Obtiene cortometrajes que pertenecen a un género específico.
 * @param {string} genre - Nombre del género en español o inglés.
 * @returns {Video[]} Lista filtrada de videos.
 */
export function getVideosByGenre(genre: string): Video[] {
  const normalized = genre.toLowerCase();
  return allVideos.filter((v) =>
    v.genres.some((g) => g.toLowerCase() === normalized)
  );
}
