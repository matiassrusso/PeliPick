# PeliPick — Design Brief (Crítico Moderno) — histórico, superado

> Generado con [Stitch](https://stitch.withgoogle.com/) a partir del repo y el sitio
> deployeado, 2026-07-17. Corregido a mano: el original mencionaba Next.js y Vercel AI
> SDK, que no son el stack real (ver abajo).
>
> **Superado (2026-07-17):** este brief describía "Crítico Moderno" (papel
> `#FAF7F0`, `Instrument Serif` + `IBM Plex Sans`) como si fuera el tema ya
> implementado — no lo era: el frontend real en ese momento era dark-first
> cinematográfico (ámbar/dorado sobre casi negro, `Instrument Serif` +
> `IBM Plex Sans`, sin toggle de tema). El sistema que terminó portándose al
> frontend real no es este, sino el que salió de iterar en Lovable
> ("Hybrid critic notebook": papel/tinta/terracota `#C2410C`, `Inter Black` +
> `Playfair Display Italic` + `JetBrains Mono`, `radius: 0`) — ver
> `frontend/src/index.css` para los tokens reales vigentes. Este archivo queda
> como referencia histórica de la primera pasada con Stitch.

## 1. Vision & Strategy

PeliPick is a personal movie discovery platform designed for cinephiles who are tired
of generic, algorithm-heavy streaming dashboards. It positions itself as a "Digital
Cineclub" — a curated, editorial-first experience that prioritizes human-like criteria
and aesthetic reflection over "content consumption."

- **Core Value Proposition:** Move from "What's popular" to "What matters to you,"
  delivered through a sophisticated, modern-editorial interface.
- **Target Audience:** Cinephiles, film students, and casual viewers looking for
  high-quality, curated recommendations without the "Netflix-style" noise.

## 2. Visual Identity (Crítico Moderno)

- **Concept:** Contemporary cultural review magazine. Clean, high-contrast, and
  personality-driven.
- **Palette:**
  - Primary Background: `#FAF7F0` (Bone/Paper)
  - Text/Primary Dark: `#20242B` (Off-black)
  - Accent/Call to Action: `#E85D3F` (Deep Orange/Terracotta)
  - Secondary Accent: `#5C7C66` (Sage Green)
- **Typography:**
  - Headings: `Instrument Serif` (Elegant, authoritative)
  - Body/UI: `IBM Plex Sans` (Technical, readable, modern)

(Coincide con `docs/design-directions.md` Opción 3, pero esa dirección **nunca se
construyó así** — el frontend real siguió con el tema dark cinematográfico hasta el
port de 2026-07-17. Ver la nota de "Superado" al principio de este archivo.)

## 3. Core Features (Fase 3 scope)

### 3.1 Editorial Discovery Feed

- Personalized Hero: a featured recommendation with a longer "Why this fits you"
  explanation than the current one-liner.
- Curated Cards: movie posters in a generous vertical list, avoiding tight grids.
- Human Microcopy: recommendation reasons in human-centric language (e.g., "For a
  rainy Tuesday" instead of "Drama / 120min").

### 3.2 Taste Affinity Map (reemplaza el radar + heatmap actual de `/profile`)

- Visual Profiling: en vez de un radar de géneros y un heatmap de décadas, un "mapa de
  afinidades" espacial — una representación 2D donde los géneros/directores/tags que
  el usuario más valora aparecen agrupados por afinidad (ej. clusters de "New Wave"
  cerca de "Minimalism").
- Dynamic Updating: el mapa se recalcula con cada nuevo import/rating.
- **Alcance decidido con Matías (2026-07-17): sí se construye**, en reemplazo del
  radar/heatmap SVG existentes en `frontend/src/pages/Profile.tsx` y del payload de
  `GET /profile/taste` (`backend/app/taste_profile.py`). Requiere definir cómo se
  computan las posiciones espaciales — ver plan de implementación aparte.

### 3.3 The "Cinephile Notebook" (fuera de alcance por ahora)

Watchlist como archivo + sistema de "Notes" en vez de rating por estrellas — **no
entra en esta fase** (decisión explícita: solo Affinity Map, no el sistema de Notes).

## 4. Technical Requirements (corregido contra el repo real)

- **Frontend:** React + Vite + TypeScript + Tailwind (no Next.js).
- **Data Source:** TMDb (no OMDb).
- **AI:** Gemini vía `backend/app/llm_client.py`, cliente `urllib` stdlib (no Vercel AI
  SDK).
- **Deployment:** Vercel (frontend, [pelipick.vercel.app](https://pelipick.vercel.app/))
  + Render (backend, Postgres/Neon en producción).

## 5. Anti-Patterns (What NOT to build)

- No infinite-scroll grids — calidad sobre cantidad.
- No neon/dark-mode-por-default — evitar el look genérico de "app de streaming oscura".
- No chatbots intrusivos — la IA es "ghost writer" detrás de la curación, no un
  chat-bubble.

## Next Steps

1. Definir la interacción del Affinity Map: cómo se mueve/explora el usuario por su
   mapa de gusto (ver plan de implementación).
2. Pulir la vista de detalle de película para que se sienta artículo de revista, no
   entrada de base de datos.
