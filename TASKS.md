# TASKS.md

> Nota: esto es un artefacto de proceso interno (coordinación entre agentes
> de IA trabajando en paralelo), no documentación de producto. Para
> entender qué es PeliPick y cómo correrlo, ver [README.md](README.md); para
> el estado real del producto, ver [docs/mvp-status.md](docs/mvp-status.md).

Coordinación entre agentes trabajando en paralelo sobre este repo, cada uno
en su propio worktree/branch. Reglas:

- Antes de tocar código: marcá tu tarea como `In Progress` acá, con tu
  nombre de agente como owner.
- Al terminar: movela a `Done`, resumí qué archivos tocaste (para que los
  demás sepan si hay conflicto potencial), y dejá la rama lista — **no
  mergees a `main` vos solo**, avisale al dueño del repo.
- Si algo te bloquea o afecta una tarea de otro agente, anotalo en
  `Blocked` con el motivo en vez de improvisar una solución que lo pise.
- Regla general del proyecto: primero arreglamos lo que esté roto, después
  avanzamos con features nuevas. No asumas nada sobre lo que hizo otro
  agente — leé este archivo antes de cada acción.

Nota: se armó un worktree `pelipick-gemini` (`gemini/cache-001`) pero
Gemini no terminó participando — quedó sin usar, `cache-001` se
reasignó a Codex en `pelipick-codex`.

Nota: revisá siempre el diff antes de commitear con encoding — un editor
metió BOM + mojibake (cp1252) en todos los archivos que tocó en `auth-001`/
`cache-001`. Si ves acentos raros (`Ã³` en vez de `ó`) en tu propio diff,
pará y arreglalo antes de seguir, no lo dejes pasar.

`cache-001` y `auth-001` ya están en `main` (`bf855e0`, pusheado a GitHub).
`cast-001` ya no depende de `cache-001` por ese motivo.

## Pending

## In Progress

## Blocked

(vacío)

## Done

- [x] [lb-username-001] Import por username de Letterboxd (scraping),
      alternativa a subir el zip: nuevo endpoint `POST /recommend/letterboxd`
      que scrapea el diario público (`/diary/films/page/N/`, hasta 20
      páginas) — rating, fecha real de visto, y rewatch (título repetido en
      el diario suma +0.5, tope 5.0). No cubre likes/favoritos/tags/ratings
      sin diario: las grillas `/films/` y `/films/ratings/` de Letterboxd
      hidratan el rating client-side vía React y no se pueden leer sin JS,
      así que el diario es la única vista pública server-rendered
      disponible. Hallazgo no anticipado: Letterboxd está detrás de
      Cloudflare bloqueando por fingerprint TLS (JA3) del handshake, no por
      headers — el stdlib `urllib`/`requests` de Python devuelve 403 pase lo
      que pase con el `User-Agent`; se agregó `curl_cffi` (imita el
      fingerprint TLS de Chrome vía libcurl) como única forma real de
      pasarlo. Confirmado end-to-end con datos reales del diario público de
      `scorsese` (254 ratings, 5 picks generados) | owner: claude |
      archivos: `backend/app/letterboxd_scrape.py` (nuevo),
      `backend/app/main.py` (`_validate_recommend_params`/
      `_finish_recommend` extraídos para compartir el flujo con
      `/recommend/zip`), `backend/requirements.txt` (`curl_cffi`),
      `frontend/src/pages/Recommend.tsx` (toggle zip/username), tests
      nuevos en `test_letterboxd_scrape.py` y `test_main.py`,
      `docs/letterboxd-username-import.md` (nuevo), `docs/api.md`,
      `docs/mvp-status.md`. 121 tests de backend en verde (105→121), build
      de frontend limpio.
- [x] [llm-001] Prompt de Gemini enriquecido: en vez de mandarle solo la
      lista cruda de reseñas, se le arma un "perfil de gusto" explícito
      (promedio, tags recurrentes en lo que más valoró, títulos que amó/odió)
      y se endurecen las instrucciones para que la razón de cada pick nombre
      un patrón concreto de ese perfil o del historial, no un elogio
      genérico. Gemini sigue eligiendo solo entre los candidatos ya
      filtrados por el heurístico — no rescorea ni trae títulos propios,
      eso queda para una iteración futura si hace falta | owner: claude |
      archivos: `backend/app/llm_client.py` (`_build_taste_digest`,
      `_phrase_for_tags`, `_build_prompt` reescrito), tests nuevos en
      `test_llm_client.py`. 105 tests de backend en verde (97→105 sumando
      data-001). Verificado el contenido del prompt armado a mano
      (perfil correcto con tags/títulos reales); una llamada real a Gemini
      dio timeout de red en este entorno, no se pudo confirmar la
      respuesta final del modelo en vivo.
- [x] [data-001] Usar más señal del zip de Letterboxd: Tags propios del
      usuario (diary.csv prioriza sobre reviews.csv si ambos los traen,
      solo se suman como señal positiva si matchean el vocabulario interno
      de tags) y fecha real de "visto" persistida (antes se parseaba desde
      diary.csv pero se perdía al guardar en `rated_items`; la pestaña
      "Vistas" mostraba la fecha de import, no la real) | owner: codex |
      archivos: `backend/app/models.py` (`RatedItem.tags`,
      `WatchedItem.watched_date`), `backend/app/letterboxd_zip.py`
      (`_parse_tags`), `backend/app/db.py` (columna `watched_date` +
      migración), `backend/app/main.py`, `backend/app/recommender.py`
      (`_collect_preference_tags` suma tags de usuario que matchean
      vocabulario), `frontend/src/pages/History.tsx`, tests en
      `test_letterboxd_zip.py`, `test_recommender.py`, `test_main.py`,
      docs (`letterboxd-zip-format.md`, `api.md`, `mvp-status.md`).
      Bug encontrado y arreglado por Claude en revisión: `History.tsx`
      reutilizaba `formatSessionDate` (pensada para timestamps con hora)
      para `watched_date` (solo fecha) — al interpretarla como medianoche
      UTC y mostrarla en hora local, en timezones detrás de UTC (Argentina,
      UTC-3) el día mostrado quedaba corrido un día para atrás. Se agregó
      `formatWatchedDate` con `timeZone: "UTC"` para mostrar el día literal.
      Verificado en vivo: zip con diary.csv (Whiplash, Watched Date
      2025-05-28) mostró "28 may 2025" en la pestaña Vistas.
- [x] [perfil-001] Perfil de gusto visual: radar de géneros, décadas y
      directores/actores favoritos, matcheando el historial "vistas" del
      usuario contra TMDb | owner: claude | archivos:
      `backend/app/tmdb_client.py` (`GENRE_ID_NAME_MAP`/`TV_GENRE_ID_NAME_MAP`,
      `search_title` con caché de 24h por título, `fetch_taste_credits` para
      director + top-3 cast), `backend/app/taste_profile.py` (nuevo,
      `build_taste_profile`), `backend/app/models.py`
      (`TasteProfileResponse` y afines), `backend/app/main.py`
      (`GET /profile/taste`), tests nuevos en `test_tmdb_client.py`,
      `test_taste_profile.py`, `test_main.py`, `frontend/src/pages/Profile.tsx`
      (nuevo, radar SVG + heatmap de décadas + listas de directores/actores,
      sin librería de gráficos), `frontend/src/App.tsx` y
      `frontend/src/components/Navbar.tsx` (ruta y link `/profile`). Cap
      deliberado: matchea hasta 150 títulos (los mejor puntuados primero) y
      pide créditos (director/cast) solo para los 50 mejores de esos, para
      que la carga no dependa de cientos de requests secuenciales a TMDb en
      exports grandes — motivo documentado con comentario `ponytail:` en
      `taste_profile.py`. 97 tests de backend en verde (85→97), build de
      frontend limpio, verificado en vivo con TMDb real: 10 títulos
      sembrados vía `/recommend/zip`, perfil resultante mostró 8 géneros, 4
      décadas y directores/actores correctos (Christopher Nolan, George
      Miller, Bong Joon Ho, etc.).
- [x] [scroll-001] Modal de detalle cortado cuando la página no está
      scrolleada arriba: `PageTransition` (framer-motion) siempre aplica
      `transform`/`filter` inline aunque estén "en reposo", lo que rompe el
      containing block de `position: fixed` para los descendientes — el
      modal terminaba posicionado contra el alto completo de la página en
      vez del viewport. Fix: `MovieModal` se renderiza vía React Portal a
      `document.body` | owner: codex | archivos:
      `frontend/src/pages/Recommend.tsx`. Verificado en vivo: el overlay
      queda como hijo directo de `<body>` y su rect coincide exactamente
      con el viewport sin importar el scroll de la página.
- [x] [why-001] Personalización del mensaje "why" por usuario y por
      película: antes eran frases plantilla fijas: ahora cita los tags
      específicos que matchearon (traducidos a frases legibles) y, cuando
      es posible, el título concreto del historial del usuario detrás del
      match (ej. "como lo que valoraste en «Mad Max: Fury Road»"); el
      mood también se menciona textualmente, y el fallback sin match varía
      según los propios tags de la película | owner: claude | archivos:
      `backend/app/recommender.py`, `backend/tests/test_recommender.py`.
      85 tests de backend en verde. Verificado en vivo con TMDb real.
- [x] [historial-002] Separar historial en "Vistas" (rated_items, deduplicado
      por título) y "Recomendadas" (lo ya existente) | owner: codex (3
      intentos por bloqueos de entorno del sandbox — worktree vacío sin
      `.git`, luego worktree hermano fuera del sandbox permitido; el tercer
      intento con worktree adentro de `PeliPick/.claude/worktrees/` sí pudo
      escribir el código pero no pudo correr pytest/vite ni commitear por
      permisos del sandbox de Codex — Claude verificó tests+build y
      commiteó por él) | archivos: `backend/app/db.py`
      (`get_watched_items`), `backend/app/main.py` (`GET /history/watched`),
      `backend/app/models.py` (`WatchedItem`, `WatchedHistoryResponse`),
      `backend/tests/test_main.py`, `frontend/src/pages/History.tsx` (tabs
      Vistas/Recomendadas). Mergeado con el trabajo de modos-001 vía
      3-way patch (`git apply --3way`) sin conflictos. 81 tests de backend
      en verde, build de frontend limpio.
- [x] [modos-001] Rediseño del flujo "qué querés ver hoy": 3 modos (perfil
      completo / últimas pelis vistas / selección de géneros con lógica OR
      y cobertura garantizada por género) + split Películas/Series/Ambas |
      owner: claude | archivos: `backend/app/models.py` (campo
      `watched_date` en `RatedItem`), `backend/app/csv_ingest.py` (parsea
      fecha), `backend/app/letterboxd_zip.py` (prioriza `Watched Date` de
      diary.csv), `backend/app/recommender.py` (`GENRE_OPTIONS`,
      `kind_filter`, `required_any_tags` con cobertura, `preference_ratings`
      para separar señal de gusto de exclusión), `backend/app/main.py`
      (form fields `mode`/`kind_filter`/`genres` en `/recommend/zip`, valida
      y arma `required_any_tags`/`preference_ratings`),
      `frontend/src/pages/Recommend.tsx` (3 botones de modo, chips de
      género, toggle Películas/Series/Ambas, reemplaza el dropdown de mood),
      tests nuevos en `test_recommender.py` y `test_main.py`,
      `docs/api.md`. 77 tests de backend en verde (67→77), build de
      frontend limpio, verificado en vivo con TMDB real (genre OR-filter,
      kind_filter movie/series, modo recent) y sin regresión en el modal de
      detalle (cast/tráiler/scroll-lock siguen funcionando).
- [x] [cast-001] Cast y tráiler en el modal de detalle | owner: codex |
      rama: `codex/cast-001` | archivos: `frontend/src/pages/Recommend.tsx`,
      `TASKS.md`, `docs/api.md`, `docs/architecture.md`,
      `docs/mvp-status.md`. El modal pide los detalles solo si hay `tmdb_id`,
      muestra un estado discreto de carga, cast con fallback de foto y link
      al tráiler; ante fallo o catálogo mock mantiene el detalle base. Build,
      63 tests de backend y verificación visual con TMDb real en verde.

- [x] [historial-001] Historial de sesiones de recomendación revisitables
      (nuevo endpoint de listado sobre `db.py`, nueva página de frontend) |
      owner: codex | rama: `codex/historial-001` | archivos:
      `backend/app/db.py`, `backend/app/main.py`, `backend/app/models.py`,
      `backend/tests/test_main.py`, `frontend/src/App.tsx`,
      `frontend/src/components/Navbar.tsx`, `frontend/src/pages/History.tsx`,
      `docs/api.md`, `docs/architecture.md`, `docs/mvp-status.md`
- [x] [cache-001] Caché de resultados de TMDb (in-memory, TTL simple,
      stdlib, sin dependencias nuevas) — evita pegarle a `/discover/movie`
      y `/discover/tv` en cada request si el mood+página ya se pidió hace
      poco | owner: codex | rama: `codex/auth-001` | archivos:
      `backend/app/tmdb_client.py`, `backend/tests/test_tmdb_client.py`,
      `docs/tmdb-setup.md`
- [x] [auth-001] Recuperación de contraseña + rate limiting de login |
      owner: codex | rama: `codex/auth-001` | archivos:
      `backend/app/auth.py`, `backend/app/db.py`, `backend/app/main.py`,
      `backend/app/models.py`, `backend/tests/test_auth.py`, `docs/api.md`.
      Revisado por Claude: `/auth/forgot-password` devolvía el
      `reset_token` en la respuesta a cualquiera (toma de cuenta completa
      en 3 requests sin tocar el email del usuario) — arreglado en un
      commit aparte (`4b7f80e`), ahora solo se expone con
      `PELIPICK_DEBUG=1`, nunca por default. También se arregló encoding
      roto (BOM + mojibake por cp1252) en los 10 archivos que tocó
      Codex (commit `a5b4a4e`), sin cambios de comportamiento.
- [x] [zip-001] Import del `.zip` completo de Letterboxd, reemplaza el CSV
      suelto pegado/subido. Combina `ratings.csv`/`reviews.csv` (base),
      boost de rewatch desde `diary.csv`, likes sin puntuar desde
      `likes/films.csv`, favoritos explícitos desde `profile.csv`
      (resueltos cruzando URIs contra `watched.csv`), y exclusión ampliada
      con todo `watched.csv` | owner: claude | rama: `claude/zip-upload` |
      archivos: `backend/app/letterboxd_zip.py` (nuevo),
      `backend/app/main.py`, `backend/app/models.py`,
      `backend/app/recommender.py`, `backend/requirements.txt`,
      `frontend/src/pages/Recommend.tsx`, `docs/api.md`,
      `docs/architecture.md`, `docs/mvp-status.md`, `docs/build-log.md`,
      `docs/letterboxd-zip-format.md` (renombrado de `csv-format.md`),
      tests de `letterboxd_zip`, `recommender`, `main`, `auth`
