import Link from "next/link";

/**
 * Footer estático renderizado como React Server Component (RSC).
 * No contiene lógica interactiva de cliente, ahorrando peso en el bundle inicial.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-white/[0.08] bg-cinema-card/90 backdrop-blur-md relative z-10 text-white overflow-hidden">
      {/* Resplandor ambiental esmeralda muy tenue en el borde superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cinema-emerald/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
          {/* Marca / Identidad */}
          <div className="space-y-1">
            <Link href="/" className="inline-block">
              <h2 className="text-xl font-cinema font-bold tracking-[0.22em] text-white hover:text-cinema-emerald transition-colors">
                <span className="text-cinema-emerald">A</span>NIMATRIX
              </h2>
            </Link>
            <p className="text-xs text-gray-400 font-light max-w-sm">
              Plataforma y cineteca digital dedicada a la difusión y apreciación del cortometraje animado.
            </p>
          </div>

          {/* Crédito de Autoría */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-cinema-border-emerald">
              <span className="w-2 h-2 rounded-full bg-cinema-emerald animate-pulse" />
              <span className="text-xs text-gray-300 font-light">
                Creado por <strong className="text-cinema-emerald font-semibold tracking-wide">J.S Vega</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Nota legal sobre derechos de autor y alojamiento */}
        <div className="pt-6 space-y-3">
          <div className="text-[11px] md:text-xs text-gray-400 font-light leading-relaxed max-w-4xl space-y-1.5">
            <p className="text-gray-300 font-medium tracking-wide flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-cinema-emerald shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              Aviso de Derechos de Autor y Alojamiento
            </p>
            <p>
              Todos los derechos de propiedad intelectual, marcas, bandas sonoras y material audiovisual exhibido pertenecen exclusivamente a sus respectivos creadores, directores, estudios y productoras originales.
            </p>
            <p>
              Ninguno de los videos se encuentra alojado en servidores propios. Esta aplicación funciona exclusivamente como un catálogo e interfaz de reproducción que inserta contenido alojado y distribuido a través de la API oficial de YouTube, respetando sus términos de servicio con fines educativos y de apreciación cinematográfica.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>© {currentYear} Animatrix</span>
            <span className="text-[10px] text-gray-600 font-sans">Cine & Animación</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
