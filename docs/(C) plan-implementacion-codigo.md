# (C) Plan de implementación — tareas de código

> **Progreso (2026-07-20):** Olas 1, 2 y 3 ✅ ejecutadas y verificadas.
> Después se sumaron el fix de `/health` (405 a monitores de uptime) y el
> **rebrand a Butaca** — backend **180 tests en verde**, build limpio.
> Ver `docs/build-log.md`.
>
> ⚠️ **Nada de esto está commiteado ni deployado todavía** — todo vive junto
> en el working tree. Ver la sección `Pending` de `TASKS.md` antes de seguir.
>
> **Pendiente:** Ola 4 — H (onboarding), I (verificación email + borrar cuenta),
> J (README: hoy quedó solo renombrado a Butaca; falta decidir si se reescribe
> en inglés para recruiters o se actualiza el contenido en español, que está
> desactualizado — habla del tema "cinematic" y de "5 picks").
>
> Nota: los nombres de env var en las tareas de abajo se escribieron como
> `PELIPICK_*`; tras el rebrand son **`BUTACA_*`**.

> Creado: 2026-07-20. Compañero de `(C) plan-maestro-release.md`: ese doc dice
> *qué* y *por qué*; este dice *cómo*, archivo por archivo, para ejecutar en
> sesiones futuras. Ninguna tarea de acá depende de las tareas de infra de
> Matías (Neon, dominio, Resend, UptimeRobot) — todo es implementable ya.
>
> Convenciones que aplican a TODAS las tareas: tests de backend en verde antes
> de cerrar (160 hoy), entrada en `docs/build-log.md` al terminar, coordinación
> por `TASKS.md` si hay agentes en paralelo (worktrees separados), no mergear a
> `main` sin avisar.

---

## Mapa de olas (paralelización)

| Ola | Tareas | Por qué juntas |
|-----|--------|----------------|
| 1 | A (warm-up) ∥ B+G (rate limit + stats) ∥ C (feedback loop) | A es frontend-only; B y G comparten `main.py`/`db.py` así que van en UN solo agente; C vive mayormente en `recommender.py`. Roce chico entre B+G y C en `main.py` → mergear B+G primero, C rebasea. |
| 2 | D (watchlist) ∥ E (dónde verla) | D toca zip parser + db + modo nuevo; E toca `tmdb_client.py` + modal. Casi sin intersección. |
| 3 | F (render progresivo) | Solo, porque toca fuerte `main.py` y `Recommend.tsx` — mejor con las olas 1-2 ya mergeadas. |
| 4 | H (onboarding) ∥ I (verificación email + borrar cuenta) ∥ J (README) | H es frontend+endpoint nuevo, I es auth/mailer, J es solo docs. Independientes. |

---

## Ola 1

### Tarea A — Warm-up del backend desde el frontend (plan maestro 0.2)

**Qué:** despertar el dyno de Render apenas carga la SPA, para que el cold
start transcurra mientras el usuario mira la landing o tipea el password.

- `frontend/src/hooks/useAuth.tsx`: en `AuthProvider`, un `useEffect(..., [])`
  con `fetch(\`${API_BASE_URL}/health\`).catch(() => {})` fire-and-forget.
  Nota: si hay token guardado, `/auth/me` ya despierta el backend — el ping
  igual es inofensivo y cubre al usuario deslogueado, que es el caso que importa
  (visitante nuevo / recruiter).
- Sin tests (trivial). Verificar `npm run build`.

### Tarea B — Rate limiting de `/recommend/*` por usuario (plan maestro 1.2)

**Qué:** tope diario de recomendaciones por usuario para proteger cuotas de
TMDb/NIM antes de abrir al público.

- **Diseño (el camino lazy):** sin tabla nueva ni estado en memoria — contar
  las `recommendation_sessions` del día actual del usuario. `created_at` ya es
  `"YYYY-MM-DD HH:MM:SS"` UTC en ambos backends, así que
  `WHERE user_id = ? AND created_at >= ?` con el `"YYYY-MM-DD 00:00:00"` de hoy
  funciona igual en SQLite y Postgres. Sobrevive restarts y multi-proceso gratis.
- `backend/app/db.py`: `count_sessions_since(user_id, since: str) -> int`.
- `backend/app/main.py`: al inicio de `_finish_recommend`, si el conteo ≥ límite
  → `HTTPException(429, "Llegaste al límite de recomendaciones de hoy...")`.
  Límite por env `BUTACA_RECOMMEND_DAILY_LIMIT`, default 20, `0` = sin límite
  (y setear `0` en `conftest.py` NO — mejor default alto no: los tests existentes
  crean pocas sesiones por usuario, 20 no los rompe; verificar y solo tocar si
  alguno itera más de 20).
- Tests (`test_main.py`): con límite bajo vía env (monkeypatch a 2), la tercera
  request da 429; usuario distinto no comparte el contador.

### Tarea G — Endpoint de métricas (plan maestro 1.1) — mismo agente que B

**Qué:** leer por fin las métricas definidas en `product-mvp.md`.

- `backend/app/main.py`: `GET /admin/stats`, gateado por header
  `X-Admin-Token` == env `BUTACA_ADMIN_TOKEN` (si la env no está seteada →
  404 siempre, para que en prod sin configurar no exista). Devuelve JSON:
  usuarios totales, sesiones de recomendación totales y últimos 7/30 días,
  feedback por status (interested / not_interested / seen) y su % sobre picks
  servidos, picks servidos totales.
- `backend/app/db.py`: una función `get_admin_stats() -> dict` con los COUNTs
  (cuidado: solo SQL portable SQLite/Postgres — nada de `datetime()`, usar
  comparación de string sobre `created_at` como en la tarea B).
- Sin dashboard, sin frontend. Se consulta con curl.
- Tests: 404 sin env, 401/403 con token malo, shape correcto con datos.

### Tarea C — Feedback loop en el scoring (plan maestro 2.1)

**Qué:** que "no me interesa" y "ya la vi" afecten las próximas recomendaciones.
Hoy `feedback` se escribe y jamás se lee.

- `backend/app/db.py`: `get_feedback_signals(user_id) -> dict` con JOIN
  `feedback` × `recommendations_served`:
  `{"seen_titles": [...], "not_interested": [{"title": ..., "tags": [...]}]}`
  (los `tags` vienen del JSON de `recommendations_served.tags`). Tomar el
  feedback más reciente por recommendation_id si hay repetidos.
- `backend/app/main.py` (`_finish_recommend`):
  - `seen_titles` y los títulos `not_interested` se suman a `extra_seen`
    **antes** de armar `also_seen` — y a diferencia de la exclusión
    "ya recomendado", esta NO se relaja en el retry del pool agotado: lo
    rechazado explícitamente no vuelve nunca.
  - Armar `Counter` de tags de los picks rechazados y pasarlo a `recommend()`.
- `backend/app/recommender.py`: parámetro nuevo
  `rejected_tags: Counter | None = None`. En el scoring, penalización
  proporcional al estilo de las señales existentes:
  `points -= 15 * len(tags & effective_rejected) / tag_count`, donde
  `effective_rejected` = tags rechazados **2+ veces** (un solo rechazo no puede
  fundir un género entero del perfil — el umbral es la protección contra
  sobre-reacción). El "why" no necesita mencionar la penalización.
- Tests (`test_recommender.py`, `test_main.py`): tag rechazado 2+ veces baja el
  score / cambia el orden; 1 sola vez no penaliza; título con feedback `seen` o
  `not_interested` no reaparece ni siquiera en el retry sin exclusión;
  usuario sin feedback → cero cambios (regresión).

**Orden de merge de la ola 1:** B+G primero, C rebasea sobre eso (ambos tocan
`_finish_recommend`). A entra cuando sea, no choca.

---

## Ola 2

### Tarea D — Watchlist (plan maestro 2.2)

**Qué:** cuarto modo "de mi watchlist": elegime algo de lo que YA dije que
quiero ver.

- `backend/app/letterboxd_zip.py`: parsear `watchlist.csv` del zip (mismas
  columnas Name/Year que los otros CSVs — reusar `csv_ingest`). El return de
  `parse_letterboxd_zip` pasa a incluir `watchlist_titles: list[str]`
  (actualizar los 3 call sites y tests).
- `backend/app/db.py`: tabla nueva `watchlist_items (user_id, title)` en ambos
  schemas (CREATE TABLE IF NOT EXISTS cubre instalaciones existentes, sin
  migración manual) + `save_watchlist_items` (reemplazo total por import:
  DELETE + INSERT — la watchlist nueva ES el estado) + `get_watchlist_items`.
- `backend/app/main.py`: `VALID_MODES` += `"watchlist"`. En `/recommend/zip`,
  persistir watchlist si vino en el zip. En `_finish_recommend`, si
  `mode == "watchlist"`: candidatos = matchear los títulos de la watchlist
  contra TMDb vía `search_title` (paralelo con `ThreadPoolExecutor`, mismo
  patrón que `_enrich_loved_ratings_with_genre_tags`, cap ~60) en vez del
  discover; esos títulos NO entran en `seen_titles`/exclusiones. Si la
  watchlist está vacía → 400 con mensaje claro ("Importá tu zip primero — el
  import por username no trae watchlist").
- `frontend/src/pages/Recommend.tsx`: opción de modo nueva; deshabilitada con
  tooltip/nota cuando la fuente es username.
- `search_title` hoy no devuelve poster/overview → extender el mapeo de
  `_search_one` para incluir `poster_path`/`backdrop_path`/`overview`/
  `vote_average` (ya vienen en la respuesta de search de TMDb, es solo mapear;
  verificar que los tests de shape existentes toleren claves nuevas).
- Tests: parser con/sin `watchlist.csv`, persistencia, modo watchlist punta a
  punta con TMDb mockeado, watchlist vacía → 400.

### Tarea E — "Dónde verla" (plan maestro 2.3)

**Qué:** en el modal de detalle, en qué plataforma está el pick en Argentina.

- `backend/app/tmdb_client.py`: `fetch_watch_providers(tmdb_id, kind) -> dict`
  contra `/{movie|tv}/{id}/watch/providers`. Región por env
  `BUTACA_WATCH_REGION`, default `"AR"`. Devolver
  `{"link": <url JustWatch>, "flatrate": [{"name", "logo_path"}], "rent": [...], "buy": [...]}`
  (logo vía `_image_url(..., "w92")`). Caché 24h, mismo idioma OrderedDict
  TTL+LRU que `_SEARCH_CACHE` (incluida la nota de `.pop(..., None)`).
- `backend/app/models.py`: `MovieDetails` suma `providers: dict | None = None`.
- `backend/app/main.py` (`/movies/{id}/details`): agregar providers; si el
  fetch falla, `providers = None` y el resto del detalle sigue (mismo degrade
  que el resto del modal).
- `frontend/src/pages/Recommend.tsx` (MovieModal): sección "Dónde verla" con
  logos + nombre, link al deep link. **Atribución JustWatch obligatoria**
  (requisito de TMDb): un "datos de JustWatch" chiquito en la sección.
  Si `providers` viene null/vacío: "No está en streaming en Argentina ahora".
- Tests: `test_tmdb_client.py` (mapeo, región, caché), `test_main.py` (details
  con y sin providers, degrade en falla).

---

## Ola 3

### Tarea F — Render progresivo (plan maestro 2.4)

**Qué:** mostrar los picks heurísticos al instante y pisar los "why" cuando el
LLM termine, en vez de un spinner de 5-15s.

- **Diseño:** dos requests, sin streaming (SSE es complejidad al pedo acá).
  1. `/recommend/zip` y `/recommend/letterboxd` aceptan form field nuevo
     `refine` (default `"1"` — comportamiento actual intacto, tests intactos).
     Con `refine=0`: se saltea el bloque `llm_client.refine_recommendations`
     y responde el heurístico ya persistido. La respuesta ya incluye
     `session_id` → agregarlo a `RecommendResponse` (models.py) si no viaja hoy.
  2. Endpoint nuevo `POST /recommend/sessions/{session_id}/refine` (auth,
     valida ownership): reconstruye `ratings` desde `rated_items` del usuario,
     rearma un `RecommendResponse` desde las recomendaciones guardadas de esa
     sesión, corre `llm_client.refine_recommendations`, actualiza `why` y
     `taste_summary` en DB (`db.update_session_refinement(...)` nueva) y
     devuelve la respuesta refinada. Si el LLM falla → 200 con el contenido
     sin refinar y un flag `refined: false` (el frontend simplemente no pisa
     nada).
- `frontend/src/pages/Recommend.tsx`: submit con `refine=0`, render inmediato,
  luego fire del refine; cuando llega, actualizar `taste_summary` y los `why`
  (transición suave, ej. fade). Indicador discreto mientras refina ("puliendo
  las razones…" en mono, estilo del tema). Si el refine falla, no pasa nada
  visible.
- El caché de refine existente (`_REFINE_CACHE`) sigue aplicando — regenerar
  con los mismos candidatos no re-paga el LLM.
- Tests: `refine=0` no llama al LLM (mock), endpoint refine actualiza DB y
  responde refinado, ownership (sesión ajena → 404), LLM caído → `refined:
  false` sin 500.

---

## Ola 4

### Tarea H — Onboarding sin Letterboxd (plan maestro 3.1)

**Qué:** que alguien sin Letterboxd pueda usar el producto: puntúa 10-15
películas conocidas y ya tiene perfil.

- `backend/app/main.py`: `GET /onboarding/titles` (auth): ~40 películas
  reconocibles y variadas en género/década para puntuar. Fuente lazy: una
  lista curada hardcodeada de `tmdb_id`s en un módulo nuevo
  `backend/app/onboarding_titles.py` (constantes públicas estables, mismo
  criterio que los genre IDs hardcodeados) — título/año/poster se resuelven
  contra TMDb con `search_title`/discover cacheado, con fallback al mock si
  no hay key.
- `POST /recommend/manual` (auth): body JSON
  `{"ratings": [{"title", "rating"}], "mood", "mode", "kind_filter", "genres"}`
  → construye `RatedItem`s y delega en `_finish_recommend` (que ya hace todo:
  enriquecimiento de tags por TMDb, perfil, candidatos, persistencia). El
  modo `recent` sin `watched_date` real: usar orden de llegada como proxy.
- `frontend`: página/paso nuevo `Onboarding.tsx` — grilla de posters, rating
  0.5-5 (o botones "me encantó / bien / no me gustó / no la vi", mapeados a
  4.5/3.5/1.5/skip — decidir en diseño, la opción de botones es más rápida de
  usar), CTA al terminar ≥10 → dispara `/recommend/manual` y aterriza en los
  picks. Entrada: link desde `Recommend.tsx` ("¿No tenés Letterboxd?") y
  post-registro.
- Tests: endpoint titles (con TMDb mockeado y sin key), `/recommend/manual`
  punta a punta, validación (menos de N ratings → 400).

### Tarea I — Verificación de email + borrar cuenta (plan maestro 3.2)

**Qué:** higiene mínima para usuarios desconocidos.

- **Verificación de email** (calcada del flujo de reset existente, mismo
  patrón token-hasheado + TTL):
  - `db.py`: columna `email_verified INTEGER NOT NULL DEFAULT 0` en `users`
    (via `_run_migrations` + ambos schemas); tabla
    `email_verification_tokens` espejo de `password_reset_tokens`.
  - `mailer.py`: `send_verification_email(email, token)` — mismo esqueleto
    que el mail de reset.
  - `main.py`: al registrarse, generar token y mandar mail (mismo degrade:
    sin Resend, token solo visible con `BUTACA_DEBUG=1`);
    `POST /auth/verify-email` confirma con el token. `GET /auth/me` suma
    `email_verified` para que el frontend pueda mostrar un aviso no bloqueante.
    **No bloquear ninguna feature por email sin verificar** (el producto debe
    seguir siendo usable; es señal anti-abuso y confirmación de contacto, no
    un muro).
  - `frontend`: página `VerifyEmail.tsx` (consume el link del mail, calcada de
    `ResetPassword.tsx`) + banner discreto si `email_verified` es false.
- **Borrar cuenta:**
  - `db.py`: `delete_user_completely(user_id)` — DELETE en orden hijo→padre:
    `feedback` → `recommendations_served` → `recommendation_sessions` →
    `rated_items` → `taste_profiles` → `watchlist_items` (si ola 2 mergeada) →
    `email_verification_tokens` → `password_reset_tokens` → `sessions` →
    `login_attempts` (por username) → `users`. Todo dentro de UNA conexión/
    transacción (`get_connection` ya commitea al salir).
  - `main.py`: `DELETE /auth/account` con password en el body (re-confirmación
    — no alcanza el token de sesión solo).
  - `frontend/src/pages/Profile.tsx`: zona "danger" al pie, con confirm de dos
    pasos (tipear el username, estilo GitHub).
- Tests: flujo completo de verificación (registro → token → confirm →
  `email_verified`), token expirado/inválido, delete con password mala → 401,
  delete exitoso → login posterior falla y no quedan filas huérfanas.

### Tarea J — README en inglés (plan maestro 3.3)

**Qué:** la cara del repo para recruiters. Hoy no hay README en la raíz.

- `README.md` en la raíz del repo, en inglés: qué es (taste engine, no otro
  ranking genérico), screenshots (placeholder hasta que Matías los saque),
  features, stack, arquitectura en 5 líneas, números de perf **reales** del
  build-log (login 8s→2.85s, import 100s→11.6s), cómo correrlo local, links a
  deploy. Tono honesto — sin inflar (regla de autopresentación).
- Es un archivo nuevo → no necesita permiso de edición. Sin tests.

---

## Notas para el ejecutor

- **Regla de merge:** una ola no arranca hasta que la anterior esté en `main`
  con tests verdes (excepción: J puede ir cuando sea).
- **Dispatch:** tareas de una misma ola en paralelo — Codex y/o subagentes
  Claude vía task board (`TaskCreate` + owner + in_progress/completed),
  worktrees separados, según el workflow de `AGENTS.md`.
- Ninguna tarea depende de la infra de Matías. Cuando él termine lo suyo, lo
  único a tocar en código es nada: `RESEND_API_KEY` y el `DATABASE_URL` nuevo
  son solo env vars en Render.
- Después de cada tarea: suite completa de backend, build de frontend, entrada
  en `build-log.md`, actualizar el "Current Status" de `CLAUDE.md` al cierre
  de cada ola (pedir permiso: no tiene prefijo `(C)`).
