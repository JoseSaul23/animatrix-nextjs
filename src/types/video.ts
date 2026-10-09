/**
 * ============================================================================
 * MODELO DE DATOS: Video
 * ============================================================================
 * Representa un cortometraje en el catálogo de Animatrix.
 * Sirve como contrato de datos único entre los Route Handlers de Next.js (`/api/videos`)
 * y los componentes visuales de la aplicación.
 */
export interface Video {
  /** Identificador único del video (ID de YouTube) */
  id: string;
  /** Enlace canónico de visualización en YouTube */
  url: string;
  /** Título de la obra cinematográfica */
  title: string;
  /** Sinopsis o descripción argumental (Español) */
  description: string;
  /** Sinopsis o descripción argumental en inglés */
  description_en?: string;
  /** Duración en formato "mm:ss" (ej. "10:34") */
  duration: string;
  /** Lista de géneros o salas temáticas a las que pertenece (Español) */
  genres: string[];
  /** Lista de géneros o salas temáticas en inglés */
  genres_en?: string[];
  /** URL del póster o miniatura en alta resolución */
  thumbnail: string;
  /** Fecha ISO de lanzamiento o incorporación al catálogo (opcional) */
  createdAt?: string;
}
