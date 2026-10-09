import { NextResponse } from 'next/server';
import videosData from '@/data/videos.json';

/**
 * ============================================================================
 * ROUTE HANDLER: /api/videos (Next.js App Router)
 * ============================================================================
 * En Next.js App Router, los archivos `route.ts` actúan como funciones de API
 * basadas en el estándar Web Request/Response.
 *
 * Convenciones:
 * - Se exportan funciones nombradas con el verbo HTTP: `GET`, `POST`, `PATCH`, etc.
 * - `NextResponse.json(...)` serializa los datos con cabeceras `Content-Type: application/json`
 *   y código de estado HTTP 200 por defecto.
 *
 * @returns {Promise<NextResponse>} Colección completa de videos en formato JSON.
 */
export async function GET() {
  return NextResponse.json(videosData);
}
