# Build Log

## 2026-07-11 (series en el catálogo)

### `/discover/tv` sumado al catálogo real

- `backend/app/tmdb_client.py`: agrega `DISCOVER_TV_URL` + `TV_GENRE_ID_TAG_MAP`
  (los ids de género de TV de TMDb son un set distinto al de películas — sin
  Romance/Thriller/Horror standalone) + `MOOD_TV_GENRE_ID_MAP` (solo `funny` y
  `action` tienen género de TV limpio)
- `_map_result` ahora recibe `kind` y `genre_tag_map`, y lee `name`/
  `first_air_date` para series en vez de `title`/`release_date`
- `fetch_candidates` pega a `/discover/movie` y `/discover/tv` y devuelve
  ambos catálogos concatenados

### Bug encontrado y arreglado: empates de score enmascaraban a las series

- al probar el flujo real con series de por medio, nunca aparecían en el
  top 5 pese a llegar bien taggeadas como candidatas
- causa raíz: `recommend()` ordenaba por `match_score`, que ya viene
  clampeado a 99 — muchos candidatos empatan ahí, y con orden estable el
  empate siempre caía del lado de las películas (listadas primero en el
  catálogo combinado), agravado por la penalización de -8 a series
- fix: ordenar por el score crudo (sin clamp) y clampear solo para mostrar;
  este bug ya afectaba la calidad del ranking en general (no solo series),
  simplemente era invisible con el catálogo mock de 8 títulos
- test de regresión: dos candidatos que empatan en `match_score` (99) pero
  difieren en score crudo deben ordenarse por el crudo, no por posición en
  el catálogo
- badge "Serie" agregado en el frontend (`Recommend.tsx`) — el campo `kind`
  ya viajaba pero nunca se renderizaba, y ahora que aparecen series reales
  hacía falta distinguirlas visualmente de las películas
- 3 tests nuevos (32 → 35)
- verificado end-to-end contra TMDb real: series aparecen en el top 5 y se
  ven con el badge correcto en la UI

## 2026-07-11 (agente de IA)

### Gemini conectado

- se evaluó pagar $5 de créditos en OpenAI; se optó por arrancar gratis con
  Gemini (`gemini-2.0-flash`, free tier de Google AI Studio, sin tarjeta) y
  reevaluar OpenAI solo si la calidad no alcanza o se pega el límite
- `backend/app/llm_client.py`: cliente stdlib `urllib` (mismo patrón que
  `tmdb_client.py`, sin sumar SDK), pide `responseSchema` para JSON
  estructurado
- el agente recibe los candidatos ya filtrados por el heurístico + TMDb,
  elige y ordena como máximo 5 y reescribe resumen/razones — nunca inventa
  títulos ni metadata (se descarta cualquier pick que no matchee por título
  exacto contra la lista)
- fallback al resultado heurístico si Gemini falla, no está configurada, o
  devuelve picks fuera de la lista de candidatos — mismo patrón que TMDb
- 7 tests nuevos (25 → 32), mockeando la llamada HTTP a mano
- doc nueva: [gemini-setup.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\gemini-setup.md)
- se probó contra la API real con la key del usuario: `gemini-2.0-flash`
  devolvía cuota 0 en el free tier para esa key puntual, se cambió a
  `gemini-flash-latest` y ahí sí respondió — verificado end-to-end
  (reordena picks, reescribe resumen y razones en base al historial real)

## 2026-07-11

### Persistencia, login y feedback

- SQLite (stdlib `sqlite3`, sin ORM), tokens de sesión opacos, passwords con
  PBKDF2 — cero dependencias nuevas
- feedback explícito por pick (me interesa / no me interesa / ya la vi)

### Catálogo real con TMDb

- `/discover/movie` mapeado a nuestro vocabulario de tags (género + overview)
- fallback al catálogo mock si TMDb falla o no hay key configurada

### UI/UX generada externamente, adaptada a mano

- el usuario generó un frontend completo con otra IA (plataforma "Manus"):
  Node/tRPC/Drizzle/MySQL en el server, React/Tailwind/Radix con tema
  "cinematic" en el cliente
- se investigó el zip con agentes antes de tocar nada: el diseño asumía un
  backend más rico que el nuestro (perfil de gusto con gráficos, sesiones
  revisitables, cast/tráiler, explicaciones por LLM)
- decisión: nos quedamos solo con la UI/tema, tiramos el server entero, y
  reconectamos las páginas a nuestro FastAPI existente — sin construir las
  features que ese backend hubiera necesitado
- se verificó código real (no solo lo "disponible") antes de portar
  dependencias: ninguna página usaba los componentes shadcn/ui/Radix del zip,
  así que no se portaron
- póster/backdrop/overview/rating de TMDb ahora viajan hasta el frontend
  (ya venían gratis en la respuesta que se pedía)
- quedó afuera, documentado: perfil de gusto con gráficos, historial de
  sesiones, cast/tráiler en el modal

## 2026-07-10

### Base del producto

- se definió el MVP en [product-mvp.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\product-mvp.md)
- se eligió la dirección visual `Crítico Moderno` en [design-directions.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\design-directions.md)

### Vertical slice técnica

- se armó `FastAPI` para health y recomendación
- se armó `React + Vite` para onboarding y results
- se agregó recomendador heurístico con catálogo mock
- se validó backend con tests y frontend con build

### Ingesta manual

- se reemplazó el historial hardcodeado por carga manual de `CSV`
- se agregó parser backend para columnas tipo `Name`, `Rating`, `Review`
- se agregó endpoint `POST /recommend/csv`

### Iteración web

- se mejoró la home para que explique mejor qué hace el producto
- se agregó una sección de workflow y una de señales de gusto
- se buscó que la app se sienta menos "formulario técnico" y más producto editorial

### Documentación técnica mínima

- se agregó una doc de arquitectura actual
- se agregó una doc del formato CSV soportado
- se agregó una doc mínima de endpoints
- se agregó una doc de estado del MVP

### Siguiente foco

- endurecer parser contra export real de Letterboxd
- persistir feedback del usuario
- conectar catálogo real
