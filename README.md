# 🎬 Animatrix | Cinema & Animation Streaming

> Plataforma de streaming cinematográfica de alta fidelidad dedicada a la exhibición y apreciación de cortometrajes y animación de autor independiente. Construida sobre **Next.js 16 (App Router)** y **React 19**.

---

## 🌟 Visión del Proyecto

**Animatrix** reimagina la experiencia del streaming web combinando una dirección de arte neo-cinematográfica oscura (paleta carbón con acentos esmeralda y tipografía editorial) con una ingeniería frontend de vanguardia. La aplicación garantiza transiciones fluidas a 60 FPS, reproducción persistente sin interrupciones y carga instantánea con 0 waterfalls de red.

---

## ✨ Características Principales

### 🎥 1. Reproductor Flotante Persistente (`FloatingPlayer`)
- **Arquitectura Singleton:** Un único elemento iframe global gestionado a través de la YouTube IFrame API que sobrevive a la navegación entre rutas sin reiniciar la reproducción ni perder el fotograma.
- **Acople Geométrico Fluido:** Al estar en la sala `/watch/[id]`, el reproductor se superpone y sincroniza milimétricamente sobre el escenario (*stage*) utilizando `ResizeObserver`. Al navegar a cualquier otra página, se minimiza suavemente a una ventana flotante (*Picture-in-Picture*) fija en la esquina inferior.
- **Sincronización de Estado Global:** Control de tiempo exacto (`currentTime`), volumen, silencio y estado (`PLAYING`, `PAUSED`, `BUFFERING`) centralizado en Redux Toolkit.

### 🌐 2. Internacionalización Nativa (i18n)
- **Bilingüe (Español / Inglés):** Soporte integral para todos los textos de interfaz, nombres de géneros y sinopsis de los cortometrajes.
- **Detección Automática:** Detecta la preferencia del navegador del usuario al primer acceso (español por defecto para navegadores hispanohablantes; inglés para el resto).
- **Sincronización React 19:** Estado gestionado con `useSyncExternalStore` conectado a `localStorage` y eventos del navegador, garantizando consistencia SSR y sincronización en tiempo real entre múltiples pestañas sin renders en cascada.

### 🔍 3. Búsqueda Difusa Inteligente (`Fuse.js`)
- **Búsqueda en Tiempo Real:** Indexación instantánea en memoria sin peticiones de red por cada pulsación de tecla.
- **Filtros Avanzados:** Filtrado por rangos de duración (cortos `< 5 min`, medios `5-15 min`, largos `> 15 min`).
- **Ordenamiento Multicriterio:** Por relevancia, fecha de estreno, duración ascendente/descendente y título alfabético.

### 🎟️ 4. Mi Lista & Historial Cinematográfico
- **Marcadores de Favoritos:** Agrega y remueve cortometrajes con un solo clic desde cualquier tarjeta o vista de sala.
- **Seguimiento de Progreso:** Barra de reproducción persistente que recuerda exactamente en qué segundo dejaste cada corto para reanudarlo cuando quieras.
- **Vista Dual:** Alterna libremente entre **Cuadrícula Clásica** y **Ficha Técnica Detallada**.
- **Portabilidad de Datos:** Exporta e importa tu lista de favoritos en formato `.json` para respaldar o transferir tu biblioteca.

### ⌨️ 5. Atajos de Teclado Profesionales
Modal interactiva accesible en cualquier momento presionando la tecla `?` o el botón de ayuda en pantalla:
- <kbd>Espacio</kbd> o <kbd>K</kbd>: Reproducir / Pausar
- <kbd>J</kbd> / <kbd>L</kbd>: Retroceder / Adelantar 10 segundos
- <kbd>M</kbd>: Silenciar / Activar sonido
- <kbd>F</kbd>: Pantalla completa
- <kbd>D</kbd>: Minimizar a reproductor flotante o maximizar a la sala
- <kbd>?</kbd>: Abrir / Cerrar guía de controles

---

## 🚀 Rendimiento y Core Web Vitals

La aplicación ha sido auditada y optimizada bajo estándares de alto rendimiento:

- **Next.js 16 + React 19 + Turbopack:** Compilación de producción ultrarrápida y optimizaciones automáticas mediante `reactCompiler: true`.
- **0 Waterfalls de Red:** Repositorio de datos en memoria (`src/lib/videos.ts`) para acceso síncrono O(1)/O(n) al catálogo, eliminando dependencias pesadas de cliente como React Query.
- **LCP Optimizado:** La cartelera Hero cuenta con póster de alta prioridad (`next/image` con `priority` y formatos AVIF/WebP) renderizado antes de que inicialice el iframe de fondo.
- **Code Splitting Dinámico:** Carga diferida (`next/dynamic` con `ssr: false`) de modales y herramientas secundarias.
- **Cero Errores:** 100% tipado estricto en TypeScript (`npx tsc --noEmit`) y ESLint sin advertencias.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Librería UI** | [React 19](https://react.dev/) |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Tokens Cinematográficos |
| **Gestión de Estado** | [Redux Toolkit](https://redux-toolkit.js.org/) + Listener Middleware |
| **Motor de Búsqueda** | [Fuse.js](https://fusejs.io/) |
| **Multimedia** | [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) |

---

## 📂 Estructura del Proyecto

```text
animatrix-nextjs/
├── src/
│   ├── app/                    # Rutas de Next.js App Router
│   │   ├── api/videos/         # Route Handler REST (/api/videos)
│   │   ├── genre/[name]/       # Sala de proyección por género
│   │   ├── genres/             # Mosaico de géneros cinematográficos
│   │   ├── my-list/            # Mi Lista & Historial con vista dual
│   │   ├── search/             # Buscador avanzado difuso
│   │   ├── shorts/             # Feed de cortometrajes
│   │   ├── watch/[id]/         # Sala principal de proyección
│   │   ├── globals.css         # Tokens de diseño, tipografía y utilidades
│   │   ├── layout.tsx          # Layout raíz con Providers y FloatingPlayer
│   │   └── page.tsx            # Portada principal (Hero + Carruseles)
│   ├── components/             # Componentes React modulares
│   │   ├── CinemaShortcutsModal.tsx
│   │   ├── FloatingPlayer.tsx  # Mini-reproductor y sincronizador de stage
│   │   ├── Footer.tsx          # React Server Component estático
│   │   ├── GlobalShortcuts.tsx # Listener global de eventos de teclado
│   │   ├── Hero.tsx            # Cartelera principal con LCP optimizado
│   │   ├── LanguageSelector.tsx# Selector bilingüe desplegable
│   │   ├── Navbar.tsx          # Navegación con búsqueda y selección aleatoria
│   │   ├── PlayerProvider.tsx  # Controlador central del reproductor
│   │   ├── Providers.tsx       # Envoltorio de Redux, i18n y Player
│   │   ├── VideoCard.tsx       # Tarjeta de película 100% interactiva
│   │   └── VideoCarousel.tsx   # Carrusel con desplazamiento horizontal suave
│   ├── data/                   # Datasets JSON (videos.json, genres.json)
│   ├── i18n/                   # Infraestructura de internacionalización (ES/EN)
│   ├── lib/                    # Helpers, reproductor YouTube y repositorio en memoria
│   ├── store/                  # Store de Redux, hooks y slices
│   └── types/                  # Contratos e interfaces de TypeScript
├── next.config.ts              # Configuración de compilador, imágenes y cabeceras
└── package.json
```

---

## 💻 Instalación y Uso Local

### Prerrequisitos
- **Node.js** 18.18.0 o superior (recomendado v20+)
- **npm**, **pnpm** o **yarn**

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JoseSaul23/animatrix-nextjs.git
   cd animatrix-nextjs
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run start
   ```

5. **Validar código:**
   ```bash
   # Verificación de tipos TypeScript
   npx tsc --noEmit

   # Verificación de linter
   npm run lint
   ```

---

## 📜 Licencia

Este proyecto es de código abierto y está desarrollado con fines educativos y de apreciación cinematográfica.
