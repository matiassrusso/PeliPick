# TASKS.md

> Nota: esto es un artefacto de proceso interno (coordinación entre agentes
> de IA trabajando en paralelo), no documentación de producto. Para
> entender qué es Butaca y cómo correrlo, ver [README.md](README.md); para
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

> Estado al 2026-07-21: dominio propio comprado y en producción. Frontend en
> [butaca.xyz](https://butaca.xyz) (Vercel), backend en
> [api.butaca.xyz](https://api.butaca.xyz) (Render). `pelipick.vercel.app` /
> `pelipick-backend.onrender.com` siguen andando en paralelo (mismos
> proyectos, no se borró nada). Ver Done de hoy (`domain-001`) para el
> detalle completo.

- [ ] 🔴 **Setear `NVIDIA_API_KEY` en Render** — **el agente de IA nunca corrió
      en producción.** Al migrar de Gemini a NVIDIA NIM se cambió el nombre de
      la variable en el código (`llm_client.py` lee `NVIDIA_API_KEY`) pero en
      Render quedó la vieja `GEMINI_API_KEY`. Los dos call sites hacían
      fallback mudo al heurístico, así que no se notó: todos los "why" de
      producción vienen del heurístico, no del modelo. El logging ya está
      arreglado (`c477d5c`); falta la key. La `GEMINI_API_KEY` vieja ya se
      borró de Render.
- [ ] 🔴 **Rotar credenciales** — el 2026-07-21 se pegó el export completo de
      env vars de Render en un chat con un agente de IA. Rotar al menos:
      password de Neon (`DATABASE_URL`), `RESEND_API_KEY`, `TMDB_API_KEY`.
- [ ] **Borrar el usuario de prueba `test-resend-qa`** (creado hoy vía API
      para probar el mail real, con el mail de Matías). No hay endpoint de
      borrar cuenta todavía — sale con la Ola 4 (tarea I) o a mano por SQL
      contra Neon.
- [ ] **Despausar el monitor de UptimeRobot** — está pausado a propósito;
      solo tiene sentido reactivarlo una vez confirmado el fix de `/health`
      en producción (si no, vuelve a alertar 405 cada 5 min).
- [ ] **Activar auto-renew de `butaca.xyz`** en Namecheap antes de que venza
      (21 de julio de 2027) — hoy está apagado a propósito para no llevarse
      un cargo sorpresa, pero eso también significa que se pierde el dominio
      si nadie lo renueva a mano.
- [ ] **Ola 4 del plan de implementación** (`docs/(C) plan-implementacion-codigo.md`):
      H (onboarding sin Letterboxd), I (verificación de email + borrar
      cuenta), J (README — decidir si se reescribe en inglés o se actualiza
      en español; hoy quedó actualizado solo el nombre).
- [ ] **Renombrar la carpeta del proyecto** (`03 Projects/PeliPick/` →
      `03 Projects/Butaca/`) y la lista de proyectos del `CLAUDE.md` raíz del
      vault (fuera de este repo) — pendiente, requiere permiso explícito
      porque toca archivos fuera de este repo.
- [ ] **Borrar el proyecto viejo de Neon** (São Paulo) una vez confirmado
      que el nuevo (Oregon) anda sin sobresaltos unos días.

## In Progress

## Blocked

(vacío)

## Done

- [x] [resend-001] **Resend activado end-to-end** | owner: claude + Matías |
      Dominio `butaca.xyz` verificado en Resend (región `us-east-1`, la misma
      costa que Render, mismo criterio que la migración de Neon). DNS en
      Namecheap: `TXT resend._domainkey` (DKIM), `TXT send` (SPF) y
      `MX send` → `feedback-smtp.us-east-1.amazonses.com`. El SPF de Resend
      va en el subdominio `send`, así que no chocó con el SPF de email
      forwarding que Namecheap tenía en `@` — igual ese se borró solo al
      pasar Mail Settings a **Custom MX** (necesario para poder cargar el MX).
      **Bug real encontrado y arreglado (`42a9a3f`):** la API de Resend está
      detrás de Cloudflare, que rechazaba el `User-Agent` default de urllib
      (`Python-urllib/3.x`) con `403 error code: 1010` — no era la key ni el
      dominio. Con cualquier UA propio pasa; **no** hizo falta `curl_cffi`
      como en `letterboxd_scrape.py` (ahí el bloqueo era por fingerprint TLS,
      acá es solo el header). Verificado contra la API real con una key falsa:
      sin UA da 1010, con UA da el 401 de auth esperado. Test de regresión
      agregado (180 → 182 tests).
      **Dos fallbacks mudos arreglados en el camino** (`e224297`, `c477d5c`),
      que eran la razón de que nada de esto se viera: `/auth/forgot-password`
      no logueaba nada si `RESEND_API_KEY` faltaba, y el `MailError` se comía
      el body de la respuesta HTTP (que es donde Resend explica el motivo);
      el refine del LLM devolvía el heurístico sin loguear si faltaba la key.
      Ese segundo caso destapó el bug de `NVIDIA_API_KEY` (ver `Pending`).

- [x] [render-dup-001] **Servicio duplicado en Render, borrado** | owner:
      claude | Al pushear el `render.yaml` actualizado, el Blueprint "PeliPick"
      buscó un servicio llamado `pelipick-backend` (el nombre que dice el
      yaml), no lo encontró porque Matías había renombrado el servicio real a
      `butaca-backend` en el dashboard, y **creó uno nuevo desde cero**
      (`srv-d9fs564ab06s73fr8620`, url `pelipick-backend-k36q.onrender.com`).
      Nacía roto: solo tomaba las 2 env vars que el yaml define con `value:`,
      sin `DATABASE_URL` ni API keys (las `sync: false` quedan vacías), y
      consumía horas del free tier — que según el plan maestro alcanza para
      exactamente un servicio. Es el riesgo exacto que se había documentado en
      `rebrand-externo-001` y que motivó no tocar el campo `name:` del yaml.
      Borrado el servicio duplicado **y el Blueprint** (el servicio real sigue
      auto-deployando desde GitHub igual; `render.yaml` queda en el repo solo
      como documentación de qué variables hacen falta). También se borraron
      del servicio real dos env vars muertas: `GEMINI_API_KEY` y
      `PELIPICK_ALLOWED_ORIGINS` (ninguna se lee en el código, verificado).
      Nota de proceso: esto se hizo vía la **API REST de Render**, con la key
      en una env var de usuario de Windows (`RENDER_API_KEY`, leída del
      registro en cada llamada) para no exponerla en el chat.

- [x] [domain-001] Comprado `butaca.xyz` (Namecheap, $1,58 el año 1 + $0,20
      ICANN fee, sin auto-renew) y configurado de punta a punta como dominio
      real de producción | owner: claude + Matías (compra y checkout manual,
      resto vía CLI/DNS) | DNS en Namecheap (Advanced DNS de `butaca.xyz`):
      - `A` `@` → `76.76.21.21` (Vercel)
      - `CNAME` `www` → `cname.vercel-dns.com.` (Vercel)
      - `CNAME` `api` → `pelipick-backend.onrender.com.` (Render)
      Se borró el CNAME `www → parkingpage.namecheap.com` que Namecheap
      arma solo por default (competía con el registro de Vercel) y el
      "Redirect Domain" automático (`butaca.xyz → www.butaca.xyz` vía el
      servicio de forwarding de Namecheap, también hubiera competido con el
      A record). `api.butaca.xyz` agregado como Custom Domain en Render
      (verificado, certificado emitido). `butaca.xyz`/`www.butaca.xyz`
      agregados al proyecto de Vercel vía `vercel domains add`, verificados
      (`vercel domains verify`), redeploy manual disparado para que tomen el
      alias nuevo. Código actualizado: `render.yaml`
      (`BUTACA_ALLOWED_ORIGINS` → `https://butaca.xyz,https://www.butaca.xyz,
      https://pelipick.vercel.app`, sin tocar el campo `name` por el riesgo
      ya documentado en `rebrand-externo-001`), `backend/app/main.py`
      (`_DEFAULT_ALLOWED_ORIGINS`), `backend/app/mailer.py`
      (`DEFAULT_RESET_URL`), env var `VITE_API_BASE_URL` en Vercel (borrada y
      recreada apuntando a `https://api.butaca.xyz`, requirió redeploy manual
      porque Vite la hornea en build time, no runtime). Docs actualizados a
      las URLs nuevas donde reflejaban estado actual (no logs fechados):
      `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `docs/mvp-status.md`. 180 tests
      de backend siguen en verde (ninguno dependía de las URLs viejas).
      Verificado en vivo: `curl https://api.butaca.xyz/health` → 200;
      `curl http://butaca.xyz` sirve el HTML real de la app (HTTPS del
      apex/www tardó unos minutos más en terminar de emitir el certificado,
      normal en Vercel tras verificar un dominio nuevo).

- [x] [rebrand-externo-001] Commit + push de lo acumulado del 2026-07-20
      (`c698ad3`, 180 tests en verde) y rebrand externo parcial | owner:
      claude | GitHub: `gh repo rename` de `matiassrusso/PeliPick` →
      `matiassrusso/Butaca` (remote local actualizado automáticamente, sin
      downtime — GitHub deja redirect). Vercel: `vercel project rename
      pelipick butaca` (mismo project ID, sin recrear nada). **Hallazgo
      importante:** ninguna de las dos URLs públicas cambió, y no van a
      cambiar sin comprar un dominio propio:
      - `butaca.vercel.app` ya pertenece a un proyecto de terceros ajeno
        (namespace `*.vercel.app` es global entre todos los usuarios de
        Vercel, no solo la cuenta) — confirmado comparando `<title>` de
        `pelipick.vercel.app` (nuestro, "Butaca") contra `butaca.vercel.app`
        ("Butaca: Peliculas, libros y videojuegos", de otro dueño).
        `pelipick.vercel.app` sigue siendo nuestra producción real.
      - Render: el nombre del servicio es solo un label de dashboard, la URL
        `.onrender.com` queda fija desde la creación del servicio y no se
        puede cambiar sin recrearlo — Matías lo renombró a `butaca-backend`
        en el dashboard, la URL siguió siendo `pelipick-backend.onrender.com`.
        Recrear el servicio para forzar la URL nueva perdería las env vars
        `sync: false` (`TMDB_API_KEY`, `NVIDIA_API_KEY`, `RESEND_API_KEY`,
        `DATABASE_URL`) — **no se intentó**, demasiado riesgo para cero
        beneficio real.
      - **No se tocó `render.yaml`** (ni el `name:` ni `BUTACA_ALLOWED_ORIGINS`)
        porque cambiar el campo `name` de un servicio ya existente en un
        Blueprint sync puede hacer que Render lo interprete como un servicio
        nuevo en vez de un rename — mismo riesgo de perder las env vars
        `sync: false` de arriba.
      Conclusión: el único camino real para URLs `butaca.*` es comprar el
      dominio (ya en `Pending`) y setearlo como custom domain en ambos.

- [x] [rebrand-butaca] Rebrand completo **PeliPick → Butaca** | owner: claude |
      Script de reemplazos ordenados (no sed global, que habría roto las URLs
      de deploy): `PELIPICK_`→`BUTACA_`, `PeliPick`→`Butaca`,
      `pelipick-frontend`/`pelipick_token`/`pelipick-theme`/`pelipick.db` →
      equivalentes con `butaca`. 35 archivos + `.claude/launch.json` +
      renombrado el archivo físico `backend/pelipick.db` → `butaca.db`.
      **NO renombrado a propósito:** `pelipick.vercel.app`,
      `pelipick-backend.onrender.com`, `name: pelipick-backend` de
      `render.yaml` (identidad real del deploy) y los worktrees históricos.
      Disponibilidad de dominio chequeada por RDAP: libres `butaca.io/.co/
      .me/.film`, tomados `.com/.app/.tv/.ar/.com.ar`. 180 tests en verde,
      build limpio. Detalle en `docs/build-log.md`.

- [x] [health-head-405] Fix de `/health`: devolvía 405 a los monitores de
      uptime (UptimeRobot prueba con `HEAD`, el endpoint era GET-only) —
      falso positivo, no una caída. `@app.api_route("/health", methods=["GET",
      "HEAD"])` + test de regresión | owner: claude | archivos:
      `backend/app/main.py`, `backend/tests/test_main.py`. 179 → 180 tests.

- [x] [neon-oregon] Migración de la base de Neon `sa-east-1` (São Paulo) a
      `us-west-2` (Oregon), misma región que el backend en Render — cada
      query cruzaba de continente | owner: claude | copiado con script
      `psycopg2` ad-hoc reusando `db.get_connection()` para el schema,
      verificado por conteo de filas en las 9 tablas con datos. Medido contra
      producción: login de ~2.85s (baseline São Paulo) a **0.59s**. Proyecto
      viejo sin borrar como colchón. Detalle en `docs/build-log.md`.

- [x] [release-ola1/2/3] Ejecución de las primeras 3 olas del plan de
      implementación (`docs/(C) plan-implementacion-codigo.md`). Owner: claude
      (secuencial, una sesión, sin subagentes). 160 → 179 tests de backend en
      verde, build de frontend limpio. Detalle completo en
      `docs/build-log.md` (entrada 2026-07-20 "olas 1-3"). Resumen:
      - **Ola 1:** warm-up de `/health` (`useAuth.tsx`); rate limiting de
        `/recommend/*` por usuario + `GET /admin/stats` (`main.py`, `db.py`);
        feedback loop en el scoring (`recommender.py`, `main.py`, `db.py` —
        exclusión dura de seen/not_interested + penalización de tags
        rechazados 2+ veces).
      - **Ola 2:** modo watchlist (`letterboxd_zip.py::parse_watchlist_titles`,
        tabla `watchlist_items`, `main.py`, `Recommend.tsx`); "dónde verla"
        vía `fetch_watch_providers` (`tmdb_client.py`, `models.py`, `main.py`,
        modal en `Recommend.tsx`); `_search_one` extendido con
        poster/overview/vote.
      - **Ola 3:** render progresivo — `refine` form field + endpoint
        `POST /recommend/sessions/{id}/refine` (`main.py`, `db.py`,
        `models.py`) + dos fases en `Recommend.tsx`.
      - Archivos de test tocados: `test_main.py`, `test_recommender.py`,
        `test_tmdb_client.py`, `test_letterboxd_zip.py` (+19 tests).
      - **Pendiente (Ola 4, no ejecutado):** onboarding sin Letterboxd (H),
        verificación email + borrar cuenta (I), README en inglés (J, bloqueado:
        ya hay `README.md` en español sin prefijo `(C)`).

- [x] [motor-fase1-003/004/005] Cierre de la Fase 1 del motor
      (`docs/(C) plan-de-trabajo.md` §4): los candidatos ahora salen del
      gusto real del usuario, no del top global de TMDb. Implementado en una
      sola sesión (sin subagentes ni worktrees — secuencial, con
      dependencias reales entre los 3 pasos):
      - **#3 `fetch_personalized_candidates`** | archivos:
        `backend/app/tmdb_client.py` (`GENRE_NAME_ID_MAP`/
        `TV_GENRE_NAME_ID_MAP` inversos, `_resolve_person_id` vía
        `/search/person` cacheado 24h, `_fetch_personalized_discover`
        cacheado 5 min por huella de perfil, `fetch_personalized_candidates`
        combina géneros OR + personas OR + década ±1 en una sola query por
        kind — `with_people` solo aplica a `/discover/movie`, confirmado en
        `docs/(C) research-tmdb-discover-personalization.md` que
        `/discover/tv` lo ignora en silencio — más una porción de
        exploración sin personalizar vía `fetch_candidates` reusado tal
        cual, todo deduplicado por `(kind, título)`). Enriquece hasta 20
        candidatos de película con director/cast (`fetch_taste_credits`,
        mismo caché que ya usaba `taste_profile.py`) para que el scoring
        (#5) tenga con qué comparar.
      - **`backend/app/main.py`** (`_finish_recommend`): corregida la
        secuencia que había quedado pendiente de #2 — `save_rated_items` y
        el cómputo del perfil ahora ocurren *antes* de traer candidatos (no
        después), así que incluso la primera recomendación de un usuario
        nuevo ya sale personalizada, no solo las siguientes. Cae a
        `fetch_candidates` sin personalizar cuando el perfil no tiene
        `genre_breakdown` (usuario sin match a TMDb, o error de red —
        guardado con el mismo `try/except Exception` amplio que ya traía #2).
      - **#4 mezcla con exploración** | archivo: `backend/app/recommender.py`
        (`_pick_with_exploration`, reserva 1 slot de los 5 para el
        mejor-puntuado con `_source: "exploration"`, así el pool
        personalizado no se cierra del todo sobre el mismo gusto).
      - **#5 scoring por director/actor/década** | mismo archivo
        (`_profile_signals` extrae directores/actores/década pesada del
        perfil persistido; +18 puntos por director match, +9 por actor,
        +6 por década — mismo orden de magnitud que los bonus de tags
        existentes; el "why" nombra la persona/década concreta cuando fue
        el motivo real, no un genérico).
      - **Bug encontrado y arreglado en el camino** (no relacionado a la
        feature en sí): `_tag_phrases` tiraba `IndexError` si un candidato
        no tenía ningún tag — nunca se disparaba porque
        `tmdb_client._map_result` ya filtra esos casos del pipeline real,
        pero es alcanzable por cualquier catalog dict sin tags (ej. mock
        catalog a mano) y lo expusieron los tests nuevos. Arreglado en el
        fallback de `recommend()`, no en `_tag_phrases` (los demás call
        sites ya vienen guardados con `if matched_xxx:`).
      Tests: 134 → 148 (14 nuevos: 8 en `test_tmdb_client.py`, 6 en
      `test_recommender.py`, 1 test existente en `test_main.py` corregido
      para no depender de que la red real falle rápido). Owner: claude,
      pedido explícito del usuario de hacerlas todas en una sola sesión en
      vez de repartir con Codex/subagentes esta vez.

- [x] [motor-fase1-001/002/006] Primera ronda de la Fase 1 del motor
      (`docs/(C) plan-de-trabajo.md` §4): tres tasks independientes
      despachadas en paralelo, cada una en su worktree, ya mergeadas a `main`
      (fast-forward + merge commit, sin conflictos):
      - **#1 research** (sin código): confirmado en vivo contra la API real
        de TMDb que `with_genres`/`with_people` usan pipe para OR (no comma,
        que es AND), que `with_people` **no existe en `/discover/tv`**
        (silenciosamente ignorado, confirmado con `total_results` idéntico
        con/sin el parámetro — el sesgo por director/actor solo puede
        aplicarse al pool de películas), que los tres filtros (género +
        persona + década) se combinan en una sola request con AND entre
        parámetros, y que el rate limit viejo de TMDb (~40 req/10s) se
        desactivó en 2019 (hoy ~40 req/s). Doc completo:
        `docs/(C) research-tmdb-discover-personalization.md`. Sin cambios de
        código.
      - **#2 persistir perfil de gusto** | archivos:
        `backend/app/db.py` (tabla `taste_profiles`, upsert vía
        `save_taste_profile`/`get_taste_profile`), `backend/app/main.py`
        (`_finish_recommend` persiste el perfil tras guardar los ratings
        importados; `taste_profile_endpoint` lee el persistido primero, cae
        al recompute on-demand solo si no hay nada guardado — usuarios
        pre-feature o antes del primer import), `backend/tests/test_main.py`
        (2 tests nuevos). Evita recomputar ~200 requests a TMDb en cada carga
        de `/profile/taste`. 128→130 tests. Reviewed y verificado en verde
        por Claude antes de mergear.
      - **#6 cachear Gemini refine** | archivos: `backend/app/llm_client.py`
        (`_REFINE_CACHE`, mismo patrón OrderedDict TTL+LRU que
        `_DISCOVER_CACHE` de `tmdb_client.py`; TTL 15 min, key = mood +
        tupla de `tmdb_id`s de los candidatos del heurístico; cachea el dict
        crudo de Gemini, revalida contra los candidatos de cada call — un
        cache hit no se salta la validación "solo títulos de la lista"),
        `backend/tests/test_llm_client.py` (4 tests nuevos). 128→132 tests.
        Reviewed y verificado en verde por Claude antes de mergear.
      Tests combinados en `main` tras mergear ambas: 134 en verde
      (128 base + 2 + 4). Owner: claude (3 subagentes, worktrees separados,
      despachados en paralelo desde una sesión orquestadora que revisó cada
      diff antes de mergear — Codex no participó en esta ronda, corrección
      del usuario pendiente de aplicar en la próxima).

- [x] [rec-quality-001] 3 bugs de calidad de recomendación reportados en uso
      real (probando el import por username recién agregado): el "why" era
      siempre casi el mismo texto ("humor y tono liviano"), no estaba claro
      si el import por username realmente leía el perfil, y las
      recomendaciones eran casi siempre estrenos/taquilla. Causas: (1)
      `_collect_preference_tags` (`backend/app/recommender.py`) sumaba
      ciegamente `funny/light/character/intimate` a cualquier título
      puntuado ≥4.5 sin mirar su contenido — con la mayoría de la gente
      puntuando varias cosas alto, ese ruido dominaba toda la señal real
      (texto de review, Tags propios); (2) el import por username no trae
      texto de review, así que sin ese bug la señal de gusto quedaba
      directamente en cero para esa vía; (3) `tmdb_client.fetch_candidates`
      pedía `sort_by=popularity.desc` a discover — eso es qué está sonando
      ahora, no qué es bueno, y sesgaba el pool de candidatos a estrenos.
      Fixes: se sacó el bonus ciego; se agregó
      `_enrich_loved_ratings_with_genre_tags` (`backend/app/main.py`) que
      completa el género real de TMDb (vía `tmdb_client.search_title`,
      extendido para devolver también `tags` del vocabulario interno, mismo
      request cacheado 24h que ya usaba `taste_profile.py`) para los
      títulos puntuados ≥4, capado a 30 por request (`TASTE_TAG_LOOKUP_CAP`)
      y gateado a "amado" para no colar señal falsa desde títulos odiados;
      se cambió `sort_by` a `vote_average.desc` | owner: claude | archivos:
      `backend/app/recommender.py`, `backend/app/tmdb_client.py`,
      `backend/app/main.py`, tests actualizados/nuevos en
      `test_recommender.py`, `test_tmdb_client.py`, `test_main.py`. 126
      tests de backend en verde (121→126).
      Al verificar en vivo apareció una 4ta causa, más de infraestructura que
      de lógica: el agente Gemini nunca estaba corriendo realmente. Dos bugs
      reales en `llm_client.py`: (a) la ruta IPv6 de esta red hacia
      `generativelanguage.googleapis.com` está rota — Python intenta la
      IPv6 primero, cuelga sin error hasta el timeout; forzar IPv4 (nuevo
      `_force_ipv4_dns()`, scopeado solo a esa llamada) lo evita; (b)
      `gemini-flash-latest` "piensa" antes de responder (`thoughtSignature`
      en la respuesta) y tarda ~19-20s incluso en un prompt trivial —
      `REQUEST_TIMEOUT=15` descartaba silenciosamente cada llamada real;
      subido a 30. Con ambos fixes, una llamada real terminó en 20.3s. Un
      tercer factor detectado (no arreglable en código): el rate limit
      gratuito de Gemini (`429`) se agotó en medio de tanto test seguido —
      cuando eso pasa cae al heurístico igual que un timeout. El fallback
      a heurístico era 100% silencioso en ambos casos (`except ...: pass`
      sin loggear nada) — se agregó `logger.warning(...)` en los dos
      catches de `_finish_recommend` (TMDb y Gemini) para que la próxima
      vez que "el why se vea igual" se pueda confirmar por qué en los logs
      del server en vez de tener que re-investigar todo de cero.
      El cupo gratis de Gemini resultó ser por modelo concreto, no por el
      alias `-latest`: el dashboard de Google AI Studio mostró
      `gemini-flash-latest` resolviendo hoy a "Gemini 3.5 Flash" con
      22/20 RPD (agotado), mientras `gemini-2.5-flash` y `gemini-3-flash`
      seguían casi sin usar (cupos separados). A pedido explícito del
      usuario, `_call_gemini` ahora prueba una cadena de modelos en orden
      (`GEMINI_MODELS` en `llm_client.py`: `gemini-flash-latest` →
      `gemini-2.5-flash` → `gemini-3-flash` → `gemini-3.1-flash-lite`,
      este último con 500 RPD de colchón) y cae al siguiente ante
      cualquier `LlmError` del anterior, en vez de ir directo al
      heurístico apenas falla el primero. Confirmado en vivo: cayó a
      `gemini-2.5-flash` y respondió en 3.5s con un "why" real citando
      "GoodFellas" del historial | archivos adicionales:
      `backend/app/llm_client.py`, 2 tests nuevos en `test_llm_client.py`
      (128 tests de backend en verde, 126→128). Sin commitear todavía.
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
      intento con worktree adentro de `Butaca/.claude/worktrees/` sí pudo
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
      `BUTACA_DEBUG=1`, nunca por default. También se arregló encoding
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
