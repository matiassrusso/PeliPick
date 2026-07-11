# Cambios pendientes de push (2026-07-11)

Todo lo que hay en este repo local que **no** está en GitHub todavía. Si en
este momento hicieras `git pull` en otra máquina, no verías nada de esto —
esta doc es exactamente la diferencia entre `origin/main` (`72d2b48`) y el
estado actual del working tree.

Son dos tandas de trabajo:

1. Un commit ya hecho localmente (`426ce2e`), sin pushear.
2. Cambios sueltos en el working tree, todavía sin commitear.

## 1. Commit local sin pushear — `426ce2e`

**"Connect Gemini free-tier agent to refine taste summary and picks"**

Se evaluó pagar $5 de créditos en OpenAI para el agente de IA pendiente
desde el MVP. Se optó por arrancar gratis con Gemini (Google AI Studio, free
tier, sin tarjeta) y reevaluar OpenAI solo si la calidad no alcanza o se
pega el límite de cuota.

### Qué hace

- Nuevo [`backend/app/llm_client.py`](../backend/app/llm_client.py): cliente
  Gemini vía `urllib` stdlib (mismo patrón que `tmdb_client.py`, sin sumar
  SDK), pide `responseSchema` a la API para forzar JSON estructurado.
- El agente recibe los candidatos ya filtrados por el heurístico + TMDb,
  elige y ordena como máximo 5, y reescribe el resumen de gusto y la razón
  de cada pick — **nunca inventa títulos ni metadata**: cualquier pick que
  no matchee por título exacto contra la lista de candidatos se descarta.
- Wireado en `POST /recommend/csv` ([`main.py`](../backend/app/main.py))
  con el mismo patrón de fallback que ya existía para TMDb: si Gemini falla,
  no está configurada, o devuelve picks fuera de la lista, la respuesta cae
  de vuelta al resultado heurístico sin romper nada.

### Detalle técnico encontrado en el camino

Se probó primero con el modelo `gemini-2.0-flash`, pero la key del usuario
tenía cuota free-tier en **0** para ese modelo puntual (típico cuando el
proyecto de Google Cloud detrás de la key no tiene billing linkeado). Se
cambió a `gemini-flash-latest`, que sí tenía cuota disponible. Documentado
en [`docs/gemini-setup.md`](gemini-setup.md).

### Verificación

- 7 tests nuevos (25 → 32), mockeando la llamada HTTP a mano.
- Probado contra la API real del usuario end-to-end: con un historial
  marcado hacia cine de autor/psicológico y mood "funny", el agente
  reordenó los picks priorizando comedias con toque de personajes en vez
  del orden heurístico plano, y reescribió el resumen conectándolo con
  reviews reales del CSV.

### Archivos

- Nuevos: `backend/app/llm_client.py`, `backend/tests/test_llm_client.py`,
  `docs/gemini-setup.md`
- Modificados: `.claude/launch.json` (agrega config para levantar el
  backend desde el harness), `README.md`, `backend/.env.example`,
  `backend/app/main.py`, `backend/tests/conftest.py`,
  `backend/tests/test_main.py`, `docs/architecture.md`,
  `docs/build-log.md`, `docs/mvp-status.md`

## 2. Working tree sin commitear — series en el catálogo real

Se agregó `/discover/tv` de TMDb al lado de `/discover/movie`, para que el
catálogo real incluya series y no solo películas (quedaba pendiente desde
el MVP original).

### Qué hace

- [`backend/app/tmdb_client.py`](../backend/app/tmdb_client.py): agrega
  `DISCOVER_TV_URL`, `TV_GENRE_ID_TAG_MAP` (los ids de género de TV de TMDb
  son un set distinto al de películas — sin Romance/Thriller/Horror
  standalone) y `MOOD_TV_GENRE_ID_MAP` (solo `funny` y `action` tienen un
  género de TV limpio). `_map_result` ahora recibe `kind` y `genre_tag_map`
  como parámetros, y lee `name`/`first_air_date` para series en vez de
  `title`/`release_date`. `fetch_candidates` pega a ambos endpoints y
  devuelve el catálogo combinado.
- [`frontend/src/pages/Recommend.tsx`](../frontend/src/pages/Recommend.tsx):
  badge "Serie" agregado a la card y al modal de detalle. El campo `kind`
  ya viajaba desde el backend pero nunca se renderizaba en ningún lado.

### Bug real encontrado y arreglado de paso

Al probar el flujo con series de por medio, nunca aparecían en el top 5
pese a llegar bien taggeadas como candidatas (40 series reales, con tags
correctos, verificado por script).

**Causa raíz:** [`backend/app/recommender.py`](../backend/app/recommender.py)
ordenaba el ranking por `match_score`, que ya viene clampeado a un máximo de
99. Muchos candidatos empatan justo en ese techo, y como Python usa sort
estable, el empate siempre caía del lado de las películas — porque en el
catálogo combinado (`movies + series`) las películas están listadas
primero. Esto se agravaba con la penalización deliberada de `-8` que ya
existía para el `kind == "series"`.

Este bug ya afectaba la calidad general del ranking, no solo a las series —
simplemente era invisible con el catálogo mock de 8 títulos, donde casi
nunca había tantos empates.

**Fix:** ordenar por el score crudo (sin clamp) y clampear solo para
mostrar el `match_score` final.

### Verificación

- Test de regresión nuevo: dos candidatos que empatan en `match_score` (99)
  pero difieren en score crudo deben ordenarse por el crudo, no por
  posición en el catálogo.
- 3 tests nuevos en total (32 → 35).
- Build de frontend limpio (`tsc -b && vite build`).
- Verificado end-to-end contra TMDb real: una serie (`The Mentalist`)
  apareció en el puesto 4 del top 5 con el badge "Serie" visible en la UI
  real.

### Archivos (sin commitear)

- Modificados: `backend/app/recommender.py`, `backend/app/tmdb_client.py`,
  `backend/tests/test_recommender.py`, `backend/tests/test_tmdb_client.py`,
  `docs/architecture.md`, `docs/build-log.md`, `docs/mvp-status.md`,
  `docs/tmdb-setup.md`, `frontend/src/pages/Recommend.tsx`

## Resumen total del diff (`origin/main` → working tree actual)

```
18 files changed, 633 insertions(+), 67 deletions(-)
```

## Qué falta para que esto quede en GitHub

1. Commitear los cambios de la sección 2 (series en el catálogo).
2. `git push origin main` — sube el commit de Gemini (`426ce2e`) y el nuevo
   commit de series juntos.
