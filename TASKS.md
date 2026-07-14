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
