# 🎬 Animatrix

Plataforma de streaming diseñada para descubrir y disfrutar de cortometrajes y animación independiente con una experiencia visual de cine.

Creada con **Next.js 16 (App Router)**, **React 19** y **Tailwind CSS**.

---

## 💡 ¿De qué va Animatrix?

La animación independiente tiene historias increíbles, pero a menudo están dispersas por internet sin un espacio que les haga justicia visual.

**Animatrix** nace para ofrecer esa experiencia: una interfaz oscura inspirada en salas de cine, transiciones suaves, sonido inmersivo y una navegación ágil para ver cortometrajes sin interrupciones.

---

## ✨ Características Principales

- 🎥 **Reproductor flotante continuo:** Empieza a ver un corto en su sala y sigue navegando por la app; el video se minimiza a una esquina automáticamente sin pausarse ni reiniciar el tiempo.
- 🌐 **Soporte bilingüe (Español / Inglés):** Detecta el idioma de tu navegador por defecto y te permite cambiar entre español e inglés al instante desde la barra superior.
- 🔍 **Buscador en tiempo real:** Encuentra cortos o géneros al instante con búsqueda inteligente (Fuse.js) y filtros prácticos por duración.
- 🎟️ **Mi Lista e Historial:** Guarda tus favoritos, consulta en qué segundo te quedaste en cada video y exporta o importa tu biblioteca en un clic (formato JSON).
- ⌨️ **Atajos de teclado:** Controla la reproducción como en un reproductor profesional usando `Espacio`/`K` (pausa), `J`/`L` (±10s), `M` (mute), `F` (pantalla completa) o presiona `?` para ver la guía.

---

## ⚡ Rendimiento y Buenas Prácticas

- **Carga instantánea (0 ms lag):** Catálogo en memoria optimizado para navegar entre páginas sin pantallas de carga ni parpadeos.
- **Imágenes modernas (AVIF / WebP):** Miniaturas ligeras y fluidas mediante `next/image` con tamaños responsivos y sin saltos de diseño (0 CLS).
- **Código limpio y tipado:** 100% TypeScript estricto, React Compiler activado y cero errores o advertencias en ESLint.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js 16 (App Router & Turbopack)
- **UI:** React 19 & Tailwind CSS v4
- **Estado Global:** Redux Toolkit
- **Búsqueda:** Fuse.js
- **Reproductor:** YouTube IFrame Player API

---

## 📂 Estructura del Proyecto

```text
animatrix-nextjs/
├── src/
│   ├── app/                    # Rutas y páginas (Home, Watch, Shorts, Genres, My List, Search)
│   ├── components/             # Componentes reutilizables (Navbar, Hero, VideoCard, FloatingPlayer...)
│   ├── data/                   # Catálogo de videos y géneros en JSON
│   ├── i18n/                   # Sistema y diccionarios de idiomas (es / en)
│   ├── lib/                    # Lógica del reproductor, helpers y repositorio en memoria
│   ├── store/                  # Configuración y slices de Redux Toolkit
│   └── types/                  # Tipos e interfaces de TypeScript
├── next.config.ts              # Configuración de imágenes y compilador
└── package.json
```

---

## 💻 Cómo probarlo localmente

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/JoseSaul23/animatrix-nextjs.git
   cd animatrix-nextjs
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 Licencia

Proyecto de código abierto creado con fines de aprendizaje y apreciación del cine independiente.
