# Butaca — brief completo para rediseño (input para Lovable)

> Generado por Claude, 2026-07-17. Pensado para pegar en Lovable (o cualquier
> herramienta de generación de UI) como contexto completo: qué es el producto, qué
> tiene hecho, qué le falta, qué estilo tiene hoy y qué estilo podría tener.

---

## 1. Qué es Butaca

Motor de recomendaciones de películas y series basado en el **gusto real** de una
persona (import completo del historial de Letterboxd: ratings, reviews, likes,
rewatches, favoritos, tags propios), no en un ranking genérico de "populares" o
"tendencias". Se posiciona como un cineclub digital: prioriza criterio editorial
humano sobre "consumo de contenido" algorítmico tipo Netflix.

**Propuesta de valor:** pasar de "qué es popular" a "qué te importa a vos", con
razones concretas ancladas en tu propio historial, no explicaciones genéricas.

**Usuario objetivo:** cinéfilo o semi-cinéfilo que ya puntúa/reseña en Letterboxd y
siente que los algoritmos comunes le recomiendan cosas obvias.

## 2. Stack y arquitectura actual

- **Backend:** FastAPI (Python), SQLite en dev/tests, Postgres (Neon, free tier) en
  producción. Auth propia (PBKDF2 + sesiones por token opaco, sin OAuth). Catálogo
  real vía TMDb (`/discover/movie`, `/discover/tv`, `/search/person`), con fallback a
  catálogo mock si no hay API key. Agente de IA con Gemini (cadena de fallback entre 4
  modelos por cupo gratuito) para refinar resumen y razones de los picks.
- **Frontend:** React + TypeScript + Vite + Tailwind. Router `wouter`. Animaciones con
  Framer Motion.
- **Deploy:** frontend en Vercel ([pelipick.vercel.app](https://pelipick.vercel.app/)),
  backend en Render ([pelipick-backend.onrender.com](https://pelipick-backend.onrender.com)).
- **Tests:** 150 tests de backend, suite completa en verde.
- **Repo:** [github.com/matiassrusso/Butaca](https://github.com/matiassrusso/Butaca)
  (público).

## 3. Pantallas que existen hoy

| Pantalla | Qué hace |
|---|---|
| **Home** | Landing: claim, ejemplos de picks, cómo funciona (3 pasos), stats (catálogo, % personalizado) |
| **Login/Registro** | Auth propia, username + password |
| **Recommend** | Núcleo del producto: subir `.zip` de Letterboxd o pegar username (scraping del diario público), elegir modo (perfil completo / últimas vistas / selección de géneros), split Películas/Series/Ambas, resultados con cards (póster, razón, % match), modal de detalle (cast, tráiler), feedback por pick (me interesa/no me interesa/ya la vi) |
| **History** | Dos pestañas: "Vistas" (historial importado, deduplicado, fecha real) y "Recomendadas" (sesiones de recomendación pasadas, revisitables sin resubir el zip) |
| **Profile** | Perfil de gusto visual: radar SVG de géneros (pesado por rating), heatmap de décadas, listas de directores/actores top — matcheado contra TMDb |

## 4. Motor de recomendación (lo que lo diferencia)

No es un ranking global reordenado. El pool de candidatos sale del **perfil real del
usuario**: géneros/directores/actores/década top (persistidos por usuario, no
recalculados en cada request), sesgando `/discover` de TMDb por esas señales +
resolviendo directores/actores a `person_id` de TMDb. Se mezcla con una porción sin
personalizar ("apuesta distinta") para no encerrar al usuario en su propia burbuja. El
"why" de cada pick cita el patrón concreto (director, década, tag) que motivó el
match, no una frase genérica. Gemini reordena/reescribe sobre ese pool ya filtrado,
nunca inventa candidatos.

## 5. Qué falta / bugs conocidos (para tener en cuenta en el rediseño)

**Funcional (no visual), reportado en uso real:**
- A veces trae muy pocas recomendaciones — falta garantizar un número fijo de picks.
- "Nuevos picks" con la misma categoría a veces devuelve los mismos títulos — falta
  variedad/no-repetición entre regeneraciones.
- El texto del "why" generado por la IA no respeta mayúsculas correctamente.
- El slider/carousel dentro de la tarjeta de detalle arrastra el scroll de toda la
  página cuando el cursor sale de la tarjeta (bug de UX, no solo visual).

**Producto, no bloqueante:**
- Envío real de mail para recuperación de contraseña (hoy el token de reset no sale
  de la respuesta salvo con una env var de debug — no hay proveedor de mail).
- Observabilidad mínima (hoy solo hay logs sueltos, sin dashboard/alertas).
- Reportar filas descartadas del CSV/zip de Letterboxd al usuario (hoy se descartan
  en silencio si no matchean el formato esperado).

**Explícitamente fuera de alcance por ahora:** guardar el zip por perfil en la nube,
sistema de "Notes" en vez de rating por estrellas, pan/zoom en visualizaciones.

## 6. Identidad visual — dónde está hoy

> **Corrección (2026-07-17):** esta sección decía que el tema vigente era "Crítico
> Moderno" (papel claro). Eso era incorrecto — `frontend/src/index.css` en ese
> momento tenía un tema **dark-first cinematográfico** (fondo casi negro, ámbar/dorado
> de acento, `Instrument Serif` + `IBM Plex Sans`, sin toggle de tema). "Crítico
> Moderno" quedó solo documentado en `docs/design-directions.md`, nunca se construyó.

**Tema vigente ahora: "Hybrid critic notebook"** — portado desde una iteración en
Lovable (repo `matiassrusso/pixel-perfect-clone-61381`) al frontend real:

- Paleta: `#FAF7F0` (papel), `#1A1918`/`#20242B` (tinta), `#C2410C` (acento terracota) —
  con dark mode real vía toggle (obsidian/ember)
- Tipografía: `Inter` (hasta 900, uppercase para headlines) + `Playfair Display Italic`
  (acento en el "why" de cada pick) + `JetBrains Mono` (labels, callouts, metadata)
- `radius: 0`, bordes gruesos negros como separadores editoriales
- Tono: igual — revista cultural / cuaderno de crítica de cine, no dashboard ni clon
  de Letterboxd
- Anti-patrones que ya se evitaron a propósito: fondo violeta con blur genérico,
  tipografía default de SaaS, exceso de badges, layout tipo dashboard desde la home

**Origen:** el frontend base (componentes, estructura) vino de una plataforma externa
de generación de UI ("Manus") y se adaptó a mano — se descartó el server
Node/tRPC/Drizzle/MySQL/OAuth que traía y se reconectó solo la capa visual al backend
real. El objetivo de esta ronda de rediseño es que deje de sentirse "generado por
otra IA" y tenga identidad propia — pulido sobre lo que ya existe, no una reescritura
completa desde cero.

## 7. Inspiración visual — análisis de las 3 referencias pasadas

Extraído inspeccionando cada sitio en vivo (fuente, tamaños, colores reales, no
capturas):

### [elvalabs.ai](https://elvalabs.ai/)
- Fondo casi negro (`rgb(19,19,19)`), texto blanco
- Una sola familia tipográfica (`Neue Haas Grotesk Display Pro`) para todo —
  headings y body, sin mezclar serif/sans
- Headlines enormes (hasta ~90px) en peso regular (400), no bold — la escala hace el
  trabajo, no el peso
- Botones pill (`border-radius: 16px`), fondos translúcidos sutiles
  (`rgba(255,255,255,0.05)`) en vez de sólidos
- Video full-bleed como hero, copy corto y poético ("Slow Moments", "Unspoken
  Feelings", "Almost Forgotten")

### [sui.io](https://www.sui.io/)
- Fondo negro puro (`#000`), texto blanco
- Tipografía licenciada (`TWK Everett`) — grotesco geométrico
- H1 gigante (156px) con tracking negativo agresivo (`-5.85px`) — muy apretado, look
  "premium tech"
- Bordes sin redondear (`border-radius: 0`) en todos lados — estética afilada,
  técnica, sin calidez
- Un solo acento de color, azul eléctrico (`rgb(41,141,255)`), usado solo en CTAs
- Nav/footer densos en información (muchos links de producto con descripción corta)

### [openai.com/supply/co-lab/work-louder](https://openai.com/supply/co-lab/work-louder/)
- Fondo negro, tipografía propia (`OpenAI Sans`)
- H1 grande (137px) pero en bold (700), no regular — más asertivo que Elva
- Detalle notable: los callouts numerados (`[01]`, `[02]`, `[03]`) usan **monospace**
  (`SF Mono`) mientras el resto usa la sans — mezcla deliberada display+técnico
- Layout tipo catálogo de producto premium: fotos grandes, specs en tabla al final

### Lectura en conjunto

Las 3 referencias comparten un lenguaje: **fondo oscuro/negro, tipografía enorme como
protagonista visual, paleta casi monocromática con un solo acento, cero decoración
sobrante.** Es una estética de "startup de infraestructura/hardware premium" — fría,
técnica, nocturna.

**Esto es una dirección distinta a la actual de Butaca** (fondo papel cálido,
paleta ámbar/terracota, serif elegante, tono "revista de cine de tarde"). No es
necesariamente contradictorio — Butaca podría tomar prestado el recurso de
"tipografía enorme como protagonista" y el minimalismo de las 3 referencias sin
necesariamente pasarse a fondo negro — pero es una decisión real de dirección, no un
detalle menor. Ver la sección de preguntas abiertas al final.

## 8. Componentes y patrones a preservar si se rediseña

- Cards de recomendación con póster grande + razón corta (no grilla fría tipo
  catálogo)
- El "why" personalizado por película y usuario — es el corazón del producto, tiene
  que seguir siendo legible y prominente, no un tooltip escondido
- El perfil de gusto (`/profile`) como "mapa" de afinidades, no como formulario
  técnico de configuración
- Microcopy con tono humano y criterio — nunca "AI insights" ni jerga de dashboard

## 9. Preguntas abiertas para quien haga el rediseño

1. **¿Mantener el fondo cálido (papel/ámbar) o migrar a dark-mode** como las 3
   referencias? Son direcciones de identidad distintas, no un ajuste menor.
2. **¿La tipografía enorme como protagonista** (recurso común a las 3 referencias)
   encaja con el tono "cuaderno de crítica" actual, o se siente demasiado
   "startup tech" para un producto de cine?
3. ¿Se resuelve primero el pulido visual, o también los bugs funcionales de la
   sección 5 (número fijo de picks, variedad, capitalización, slider) en la misma
   pasada?
