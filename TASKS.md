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

- [ ] [perfil-001] Perfil de gusto visual (radar de géneros, heatmap de
      décadas, directores/actores favoritos) — scope grande, necesita
      matchear el historial del usuario contra TMDb y una página nueva con
      gráficos | owner: none | depende_de: -

## In Progress

- [ ] [cast-001] Cast y tráiler en el modal de detalle de película. Ojo:
      hoy `Recommendation`/`recommendations_served` no guardan el `id` real
      de TMDb, solo título/año — antes de pedir `/movie/{id}/credits` hay
      que sumar ese campo desde `tmdb_client.py` hasta el modelo, la DB, y
      lo que ya viene del catálogo mock (que no tiene id real de TMDb, ojo
      con eso al armar el fallback) | owner: claude | rama: `claude/cast-001`

      **Progreso (por si se corta la sesión, retomar desde acá):**
      - [x] Paso 1 (commit `2c3d5c2`): `tmdb_id` sumado a
        `tmdb_client._map_result` (`raw.get("id")`), a `Recommendation`
        (models.py), pasado en `recommender.py`, columna nueva en
        `recommendations_served` con migración `ALTER TABLE` guardada en
        try/except (DBs viejas no tienen la columna), `save_recommendations`
        actualizado. Catálogo mock (`catalog.py`) no tiene `tmdb_id` — queda
        `None` ahí, hay que manejarlo en el endpoint/frontend (no pedir
        cast/tráiler si es `None`). 52/52 tests siguen en verde.
      - [x] Paso 2 (commit `5072117`): tests de que `tmdb_id` viaja de
        punta a punta (`test_tmdb_client.py`, `test_recommender.py`)
      - [x] Paso 3 (commit `82ced0e`): `tmdb_client.fetch_credits(tmdb_id,
        kind, limit=10)` y `fetch_trailer_key(tmdb_id, kind)` — cast
        ordenado por `order`, tráiler prefiere YouTube+oficial, `None` si
        no hay. Sin caché (no es hot path como discover). Con tests.
      - [x] Paso 4 (commit `56d470d`): **backend completo.**
        `GET /movies/{tmdb_id}/details?kind=movie` (`MovieDetails` en
        models.py: `cast: list[CastMember]`, `trailer_key: str | None`),
        requiere auth, `503` si no hay `TMDB_API_KEY`, `502` si TMDb falla.
        60/60 tests en verde. **El backend de cast-001 ya se puede probar
        de punta a punta sin el frontend** (curl/Postman/TestClient).
      - [x] Post-merge con `historial-001`: reconciliado en `db.py`
        (`save_recommendations` ahora lleva `session_id` + `tmdb_id`,
        `get_recommendation_history` también devuelve `tmdb_id` por
        recomendación, migraciones unificadas en `_run_migrations`)
      - [ ] Paso 5 (siguiente): frontend — el modal en `Recommend.tsx`
        (y ahora también `History.tsx`) pide
        `GET /movies/{rec.tmdb_id}/details?kind={rec.kind}` al abrirse,
        solo si `rec.tmdb_id` no es null (el catálogo mock no tiene id
        real). Mostrar cast (foto+nombre+personaje) y embed/link del
        tráiler de YouTube (`https://youtube.com/watch?v={key}`)
      - [ ] Paso 6: docs (`api.md`, `mvp-status.md`, `architecture.md`)
      - [ ] Paso 7: build de frontend + verificación en browser

## Blocked

(vacío)

## Done

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
