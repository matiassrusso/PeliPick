# Build Log

## 2026-07-11 (flujo multi-agente: TASKS.md, Codex, review, merge)

### Qué se armó

Se decidió sumar Codex (y evaluar Gemini) trabajando en paralelo sobre el
mismo repo, dividiendo tareas en vez de duplicar trabajo. Setup:

- `TASKS.md` en la raíz: tablero de coordinación (Pending/In
  Progress/Blocked/Done, owner, archivos tocados, dependencias).
- Un worktree de git por agente (`pelipick-codex`, `pelipick-gemini`),
  cada uno en su propia rama, arrancando desde `claude/zip-upload` para no
  repetir ese trabajo.
- Gemini no terminó participando — `pelipick-gemini` quedó sin usar.
- A Codex se le asignaron `cache-001` (caché de TMDb) y `auth-001` (rate
  limiting de login + recuperación de contraseña), con un prompt que
  incluía las restricciones de stack de `AGENTS.md` explícitas (para no
  repetir el problema de la sesión de Gemini, que había reescrito todo el
  backend a Node sin que se lo pidieran).

### Lo que entregó Codex

`auth-001`: rate limiting por username con backoff exponencial (tope 15
min), recuperación de contraseña con token de un solo uso hasheado en
SQLite, expira a la hora, invalida sesiones viejas al usarse. `cache-001`:
caché en memoria de `/discover/movie` y `/discover/tv` (TTL 5 min, tope 32
entradas, LRU). 51 tests, todo documentado.

### Revisión de Claude antes de mergear — 2 problemas reales encontrados

1. **Encoding roto**: el editor de Codex metió BOM + mojibake (bytes UTF-8
   reinterpretados como cp1252 y reencodeados, ej. "ó" → "Ã³") en los 10
   archivos que tocó. Se detectó comparando el diff, se revirtió con el
   mecanismo inverso (encode cp1252 → decode UTF-8), verificado a nivel de
   codepoint. Commit `a5b4a4e`, sin cambios de comportamiento.
2. **Crítico de seguridad**: `POST /auth/forgot-password` devolvía el
   `reset_token` en la respuesta HTTP a cualquiera que supiera un
   username — combinado con que `/auth/register` ya confirma con `409` si
   un username existe, esto permitía tomar cualquier cuenta en 3 requests
   sin tocar el email de nadie. Estaba documentado como limitación
   temporal (sin proveedor de mail), pero exponerlo así igual era
   inseguro. Fix: `reset_token` ahora solo viaja en la respuesta si
   `PELIPICK_DEBUG=1` está seteado a mano — nunca por default, nunca en
   producción. Verificado en vivo (con y sin la env var) y con test
   negativo nuevo. Commit `4b7f80e`.

También se sincronizaron `mvp-status.md`/`architecture.md`, que habían
quedado desactualizadas (seguían listando cache/rate-limiting/recuperación
de contraseña como pendientes).

### Merge y push

`codex/auth-001` (que ya traía `claude/zip-upload` en su base) se
fast-forward-mergeó a `main` sin conflictos y se pusheó a GitHub —
`bf855e0`. 52/52 tests, build de frontend limpio (con `node_modules`
recién instalado en el worktree de Codex, no venía).

### Siguiente ronda

`TASKS.md` actualizado: `cast-001` (cast y tráiler, yo/Claude, rama
`claude/cast-001`) e `historial-001` (historial de sesiones, Codex, rama
`codex/historial-001`), ambas arrancando desde el `main` ya actualizado.
`perfil-001` queda pendiente para después.

**Nota para quien retome esto**: antes de pedir cast/tráiler hace falta
guardar el `id` real de TMDb en el pipeline — hoy `Recommendation` y
`recommendations_served` solo tienen título/año, no id. Ver la entrada de
`cast-001` en `TASKS.md` para el detalle de qué archivos hay que tocar.

## 2026-07-11 (import del .zip completo de Letterboxd)

### Por qué

Se miró un export real de Letterboxd de un usuario (`letterboxd-*.zip`,
~20KB, 227 pelis vistas): trae `watched.csv`, `ratings.csv`, `diary.csv`
(con `Rewatch`/`Tags`), `reviews.csv`, `watchlist.csv`, `profile.csv` (con
`Favorite Films`), `likes/films.csv`, y más — mucha señal de gusto real que
un solo CSV pegado a mano no tiene. Se decidió que el usuario suba el
`.zip` completo en vez de pegar/subir un CSV suelto.

### Backend

- nuevo `backend/app/letterboxd_zip.py`: abre el zip en memoria
  (`zipfile`+`io` stdlib) y combina señales:
  - base: `reviews.csv` (preferido, trae texto) o `ratings.csv`
  - `diary.csv` → boost de +0.5 al rating si `Rewatch` es `Yes`
  - `likes/films.csv` → rating sintético 4.5 para lo que tiene ❤️ y no
    estaba puntuado
  - `profile.csv` → `Favorite Films` (URIs `boxd.it/xxxx`) resueltas
    cruzando contra `Letterboxd URI` de `watched.csv` — sin pegarle a
    ningún servicio externo, todo sale del mismo zip — y agregadas como
    rating sintético 5.0
  - `watched.csv` → set de exclusión ampliado (antes solo se excluía lo
    puntuado, ahora todo lo visto)
- `recommender.py`: `recommend()` suma un parámetro `also_seen` para la
  exclusión ampliada
- `main.py`: se reemplazó `POST /recommend/csv` (JSON con `csv_content`)
  por `POST /recommend/zip` (`multipart/form-data`, campo `file` + `mood`)
  — un zip es binario, no tiene sentido meterlo en JSON. Se sacó
  `CsvRecommendRequest` de `models.py`, ya no se usa.
- nueva dependencia real (antes transitiva): `python-multipart`, la pide
  FastAPI para parsear `multipart/form-data`
- límite de 20MB por zip (los reales pesan decenas de KB, es solo un techo
  de seguridad)

### Frontend

- `Recommend.tsx`: se sacó el textarea de "pegar CSV" (no tiene sentido
  pegar un zip como texto) y el file input ahora solo acepta `.zip`. El
  POST se arma con `FormData`, no JSON.

### Verificado

- 45 tests de backend (35 → 45: 10 nuevos entre `letterboxd_zip` y
  `recommender`, más migración de los viejos tests de `/recommend/csv` a
  `/recommend/zip`)
- build de frontend limpio
- probado end-to-end contra el zip real: 209 ratings base + 5 likes sin
  puntuar previamente + favoritos resueltos correctamente vía cruce de
  URIs = 214 ratings finales, 226 títulos en la exclusión ampliada por
  `watched.csv`

### Limpieza

- se borró `docs/prompt-for-gemini-csv-parser.md`: quedó obsoleto, ya no
  tiene sentido endurecer un parser de CSV pegado a mano cuando ahora se
  lee el zip con formato fijo de Letterboxd directamente
- `docs/csv-format.md` renombrado a `docs/letterboxd-zip-format.md`

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
- doc nueva: [gemini-setup.md](gemini-setup.md)
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

- se definió el MVP en [product-mvp.md](product-mvp.md)
- se eligió la dirección visual `Crítico Moderno` en [design-directions.md](design-directions.md)

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
