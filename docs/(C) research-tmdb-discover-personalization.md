# (C) Research — TMDb Discover API for `fetch_personalized_candidates`

> **Creado:** 2026-07-16 · **Autor:** Claude (research task, no code changes) · Alimenta `docs/(C) plan-de-trabajo.md` §4 paso 2.
> Método: docs oficiales de developer.themoviedb.org vía fetch + **verificación empírica en vivo** contra la API real con la `TMDB_API_KEY` del proyecto (mismo endpoint que va a usar el código), porque la redacción de TMDb sobre comma/pipe es fácil de leer al revés.

---

## 1. Hechos confirmados

### 1.1 `with_genres` — comma = AND, pipe = OR

Confirmado en docs y **empíricamente**:

- `with_genres=28,12` (comma) → 1022 resultados, y los primeros tienen **ambos** 28 y 12 en `genre_ids` → **AND**.
- `with_genres=28|12` (pipe) → 4282 resultados, con títulos que tienen **28 solo, o 12 solo** (ej. "Project Hail Mary" con `[878,12]`, "The Dark Knight" con `[28,80,53]`) → **OR**.

**Para el caso de uso (2-3 géneros top del perfil, cualquiera de ellos):** usar **pipe** — `with_genres=28|12|53`. Comma daría solo títulos que combinan todos los géneros a la vez, mucho más angosto de lo que queremos.

Mismo endpoint, mismo comportamiento en `/discover/movie` y `/discover/tv`.

### 1.2 `with_people` — mismo convenio, pero solo existe en `/discover/movie`

- Sintaxis idéntica a `with_genres`: comma = AND (debe aparecer con todos los IDs), pipe = OR (aparece con cualquiera).
- Verificado en vivo: `with_people=525` (Christopher Nolan) en `/discover/movie` → 22 resultados, todos films de Nolan (Dark Knight, Interstellar, Inception, Memento, Oppenheimer...).
- **`/discover/tv` NO soporta `with_people`** (ni `with_cast`/`with_crew`). Verificación empírica: `total_results` con y sin `with_people=525` en `/discover/tv` fue **idéntico (2492)** — el parámetro se ignora silenciosamente, no da error ni filtra. Esto también está listado en la doc de `/discover/tv`, cuyo set de parámetros `with_*` es: `with_companies`, `with_genres`, `with_keywords`, `with_networks`, `with_origin_country`, `with_original_language`, `with_runtime.gte/lte`, `with_status`, `with_watch_monetization_types`, `with_watch_providers`, `with_type` — sin gente.

**Implicancia para `fetch_personalized_candidates`:** el sesgo por director/actor solo puede aplicarse al pool de **películas**. Para series no hay forma de sesgar por persona vía discover — la única vía sería buscar títulos vía `/discover/tv` con género/década y, si se quisiera filtrar por persona en TV, habría que resolver los créditos título por título (costoso, no recomendado). Alcance realista: aplicar `with_people` solo cuando `kind_filter` incluye `movie`.

### 1.3 `/search/person` — endpoint correcto, shape confirmado en vivo

`GET https://api.themoviedb.org/3/search/person?api_key=...&query=<nombre>&language=en-US&include_adult=false&page=1`

Parámetros: `query` (requerido), `include_adult` (default false), `language` (default en-US), `page` (default 1). Mismo shape que `search/movie` ya usado en `search_title`.

Response confirmado en vivo — cada resultado trae:
```json
{
  "id": 525,
  "name": "Christopher Nolan",
  "known_for_department": "Directing",
  "popularity": 9.9371,
  "known_for": [ { "id": 157336, "title": "Interstellar", "genre_ids": [...], "media_type": "movie", ... }, ... ]
}
```

**Disambiguación:** TMDb ya devuelve los resultados **ordenados por popularidad descendente** por default (verificado con el nombre ambiguo "James Smith": el resultado con mayor `popularity` — 0.54, Acting — apareció primero, por delante de otros James Smith con popularity 0.03-0.13). Esto significa:
- **Tomar el primer resultado (`results[0]`) ya es una heurística razonable** — no hace falta lógica de desambiguación adicional para el caso común.
- Si se quiere afinar más: filtrar por `known_for_department` (`"Directing"` para directores del perfil, `"Acting"` para actores) antes de tomar el primero, para evitar el caso raro de que un homónimo de otra profesión tenga más popularidad. Esto es una mejora barata (un filtro en la lista ya traída, sin request extra) y vale la pena incluirla.
- No hace falta comparar contra `known_for` (cruzar títulos) — agrega complejidad para un caso borde que la heurística de popularidad + `known_for_department` ya cubre.

### 1.4 Filtro de década — confirmado

- Películas: `primary_release_date.gte` / `primary_release_date.lte`, formato `YYYY-MM-DD`.
- Series: `first_air_date.gte` / `first_air_date.lte`, mismo formato.
- Verificado en vivo en `/discover/tv` con `first_air_date.gte=1990-01-01&first_air_date.lte=1999-12-31` → 163 resultados, todos con `first_air_date` dentro del rango (One Piece 1999, The Sopranos 1999, Slam Dunk 1993...).
- Para una **década** completa: `.gte = "{decade}-01-01"`, `.lte = "{decade+9}-12-31"`.

### 1.5 Combinar todo en una sola request — confirmado que sí

Verificación empírica en `/discover/movie` con los tres filtros juntos en una sola URL:
```
with_genres=28|12&with_people=525|6193&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31&sort_by=vote_average.desc&vote_count.gte=200
```
→ 10 resultados, todos cumpliendo los tres filtros a la vez (género OR, persona OR, década AND con las otras dos condiciones). Confirma: **distintos parámetros `with_*`/fecha se combinan con AND entre sí; el pipe solo da OR *dentro* de un mismo parámetro.** No hace falta hacer requests separadas y mergear a mano — se puede resolver en **una sola query por endpoint** (una para movie, una para tv).

### 1.6 Rate limits — confirmado, más permisivo que la nota antigua de "~40-50 req/s"

Doc oficial de rate limiting: los límites duros de "40 requests per 10 seconds" (~4 req/s) que existían antes **se desactivaron el 16 de diciembre de 2019**. Hoy TMDb aplica límites mucho más altos, del orden de **"40 requests per second"** como tope superior para frenar scraping masivo, sin ventana estricta de 10s. Devuelve `429` si se excede, no hay contrato duro publicado de exceptions/burst.

**Para el volumen de este feature:** un puñado de `/search/person` (uno por director/actor top, cacheado 24h como `search_title`, así que solo paga el costo la primera vez que aparece ese nombre) + 1-2 queries de `/discover/movie` y 1 de `/discover/tv` por request de recomendación están muy por debajo de cualquier límite razonable, incluso sin caché.

---

## 2. Ambigüedades / cosas no resueltas

- TMDb no publica un número duro y contractual de rate limit (es una nota informal de "en el rango de 40 req/s", sujeta a cambio sin aviso) — no hay SLA. No es un problema práctico para este volumen, pero no hay que asumir que 40 req/s es una garantía.
- No se pudo confirmar por qué "Zack Snyder's Justice League" apareció en los resultados de `with_people=525` (Nolan) — Nolan no dirigió esa película. Probablemente aparece por crédito de producción/story (`with_people` matchea cualquier rol de crew, no solo dirección). Si se quiere filtrar estrictamente por "dirigió", habría que usar `with_crew` en vez de (o junto con) `with_people` — no se investigó `with_crew` en profundidad porque `with_people` alcanza para el objetivo de "sesgar hacia gente que le gusta", sea cual sea su rol en el título.
- No se investigó `with_keywords` ni `with_companies` en profundidad — existen y podrían ser útiles a futuro (ej. franquicias/sagas), pero no están en el scope de este perfil (genre/decade/director/actor).

---

## 3. Recomendación concreta para `fetch_personalized_candidates(profile, mood, kind_filter)`

**Máximo 3 requests de discover por llamada** (no más, para no escalar costo por recomendación):

1. **Query "perfil" — movies** (si `kind_filter` incluye movie):
   `GET /discover/movie` con:
   - `with_genres = "<id1>|<id2>|<id3>"` (2-3 géneros top del `genre_breakdown`, mapeados a ID vía los maps inversos ya existentes en `tmdb_client.py`)
   - `with_people = "<person_id1>|<person_id2>|..."` (top directores + actores resueltos vía `/search/person`, cacheados; omitir el parámetro si no hay ninguno resuelto, no mandar `with_people=""`)
   - `primary_release_date.gte/lte` sesgado a la década más pesada del `decade_breakdown` (rango amplio, ej. ±1 década, para no angostar demasiado — "soft bias" como pide el plan, no filtro duro)
   - mantener `sort_by=vote_average.desc` + `vote_count.gte=200` como piso de calidad, igual que hoy

2. **Query "perfil" — tv** (si `kind_filter` incluye series):
   `GET /discover/tv` con los mismos `with_genres` (usando el `TV_GENRE_ID` equivalente) y `first_air_date.gte/lte`, **sin `with_people`** (no soportado). Mismo piso de calidad.

3. **Query "exploración"** (una sola, movie o tv alternando, o ambos con `pages=1`): la query sin personalizar que ya existe hoy (`fetch_candidates`-style, con el genre del mood si aplica), para la mezcla de 1-2 "apuesta distinta" que pide el plan §4 paso 3. Reusar `fetch_candidates` tal cual para esto en vez de escribir una tercera query nueva — no hace falta duplicar lógica.

**Resolución de persona → `person_id`:** una función chica `_resolve_person_id(name, expected_department=None) -> int | None` que llama `/search/person`, cachea el resultado (mismo patrón `OrderedDict` + TTL 24h que `_SEARCH_CACHE`, misma key normalizada `name.strip().lower()`), toma `results[0]["id"]` si no hay filtro, o filtra por `known_for_department == expected_department` antes de tomar el primero si se quiere afinar. Nombres sin match devuelven `None` y se excluyen del `with_people` (no rompen la query).

**Por qué esto y no más:** 3 requests de discover + como mucho un puñado de `/search/person` (cacheados, así que en la práctica casi siempre 0 requests nuevos después del primer perfil) es un footprint de request minúsculo contra un límite de ~40 req/s. Separar en más queries (una por género, una por persona, una por década) multiplicaría requests sin necesidad — ya está confirmado que un solo request combina los tres filtros con AND entre parámetros y OR dentro de cada uno.

---

## 4. Código existente relevante (para quien implemente el paso 2)

- `backend/app/tmdb_client.py`: `GENRE_ID_TAG_MAP` / `TV_GENRE_ID_TAG_MAP` (id→tags) y `GENRE_ID_NAME_MAP` / `TV_GENRE_ID_NAME_MAP` (id→nombre display) — para ir de `genre_breakdown` (que trae nombres en español) a un ID de TMDb hace falta el mapeo inverso (nombre→id), que **no existe todavía** — hay que construirlo a partir de `GENRE_ID_NAME_MAP`/`TV_GENRE_ID_NAME_MAP` invertidos.
- `_DISCOVER_CACHE` (key: `(kind, mood, page)`) y `_SEARCH_CACHE` (key: título normalizado) — patrón OrderedDict + TTL a seguir para el nuevo cache de `person_id`. La cache key para `fetch_personalized_candidates` no puede ser solo `(kind, mood, page)` como hoy — tiene que incluir alguna huella del perfil (ej. hash de géneros+personas+década elegidos) para no servir candidatos de un perfil a otro usuario.
- `taste_profile.py`: `genre_breakdown` es lista de `{"genre": <nombre>, "weight": float}` ordenada desc; `decade_breakdown` lista de `{"decade": int, "count": int}`; `top_directors`/`top_actors` listas de `{"name": str, "count": int}` — todas ya ordenadas, tomar los primeros N directamente.
