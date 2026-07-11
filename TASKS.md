# TASKS.md

CoordinaciÃ³n entre agentes trabajando en paralelo sobre este repo, cada uno
en su propio worktree/branch. Reglas:

- Antes de tocar cÃ³digo: marcÃ¡ tu tarea como `In Progress` acÃ¡, con tu
  nombre de agente como owner.
- Al terminar: movela a `Done`, resumÃ­ quÃ© archivos tocaste (para que los
  demÃ¡s sepan si hay conflicto potencial), y dejÃ¡ la rama lista â€” **no
  mergees a `main` vos solo**, avisale al dueÃ±o del repo.
- Si algo te bloquea o afecta una tarea de otro agente, anotalo en
  `Blocked` con el motivo en vez de improvisar una soluciÃ³n que lo pise.
- Regla general del proyecto: primero arreglamos lo que estÃ© roto, despuÃ©s
  avanzamos con features nuevas. No asumas nada sobre lo que hizo otro
  agente â€” leÃ© este archivo antes de cada acciÃ³n.

Nota: se armÃ³ un worktree `pelipick-gemini` (`gemini/cache-001`) pero
Gemini no terminÃ³ participando â€” quedÃ³ sin usar, `cache-001` se
reasignÃ³ a Codex en `pelipick-codex`.

## Pending

- [ ] [cast-001] Cast y trÃ¡iler en el modal de detalle de pelÃ­cula (nueva
      funciÃ³n en `tmdb_client.py` para `/movie/{id}/credits` y
      `/movie/{id}/videos`, expuesta en un endpoint, consumida por el modal
      del frontend) | owner: none | depende_de: cache-001 (mismo archivo
      `tmdb_client.py` â€” mergear cache-001 primero para evitar conflicto)
- [ ] [historial-001] Historial de sesiones de recomendaciÃ³n revisitables
      (nuevo endpoint de listado sobre `db.py`, nueva pÃ¡gina de frontend) |
      owner: none | depende_de: -
- [ ] [perfil-001] Perfil de gusto visual (radar de gÃ©neros, heatmap de
      dÃ©cadas, directores/actores favoritos) â€” scope grande, necesita
      matchear el historial del usuario contra TMDb y una pÃ¡gina nueva con
      grÃ¡ficos | owner: none | depende_de: -

## In Progress

- [ ] [cache-001] CachÃ© de resultados de TMDb (in-memory, TTL simple,
      stdlib, sin dependencias nuevas) â€” evita pegarle a `/discover/movie`
      y `/discover/tv` en cada request si el mood+pÃ¡gina ya se pidiÃ³ hace
      poco | owner: codex | depende_de: -

## Blocked

(vacÃ­o)

## Done

- [x] [auth-001] RecuperaciÃ³n de contraseÃ±a + rate limiting de login |
      owner: codex | rama: `codex/auth-001` | archivos:
      `backend/app/auth.py`, `backend/app/db.py`, `backend/app/main.py`,
      `backend/app/models.py`, `backend/tests/test_auth.py`, `docs/api.md`
- [x] [zip-001] Import del `.zip` completo de Letterboxd, reemplaza el CSV
      suelto pegado/subido. Combina `ratings.csv`/`reviews.csv` (base),
      boost de rewatch desde `diary.csv`, likes sin puntuar desde
      `likes/films.csv`, favoritos explÃ­citos desde `profile.csv`
      (resueltos cruzando URIs contra `watched.csv`), y exclusiÃ³n ampliada
      con todo `watched.csv` | owner: claude | rama: `claude/zip-upload` |
      archivos: `backend/app/letterboxd_zip.py` (nuevo),
      `backend/app/main.py`, `backend/app/models.py`,
      `backend/app/recommender.py`, `backend/requirements.txt`,
      `frontend/src/pages/Recommend.tsx`, `docs/api.md`,
      `docs/architecture.md`, `docs/mvp-status.md`, `docs/build-log.md`,
      `docs/letterboxd-zip-format.md` (renombrado de `csv-format.md`),
      tests de `letterboxd_zip`, `recommender`, `main`, `auth`
