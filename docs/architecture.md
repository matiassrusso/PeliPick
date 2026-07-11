# Arquitectura actual

## Resumen

Hoy `PeliPick` es una vertical slice local con dos partes:

- `frontend` en `React + TypeScript + Vite`
- `backend` en `FastAPI`

Ya hay base de datos (`SQLite`), login y catálogo real (`TMDb`, con fallback a
mock). No hay integración real con Letterboxd todavía (solo CSV export).

## Flujo actual

1. El usuario se registra o entra con usuario/contraseña.
2. El usuario pega o sube un `CSV` desde la web.
3. El frontend manda el contenido crudo al backend con su token de sesión.
4. El backend parsea filas válidas.
5. El backend resume el gusto del usuario.
6. El backend trae candidatos de `TMDb` (o cae al catálogo mock si no hay key
   configurada o TMDb falla) y los scorea.
7. El backend persiste los ratings importados y las recomendaciones servidas.
8. El backend devuelve hasta 5 recomendaciones explicadas.
9. El frontend renderiza el resumen y los picks, con botones de feedback por pick.
10. El feedback (me interesa / no me interesa / ya la vi) se guarda asociado al usuario y a la recomendación.

## Frontend

Archivo principal:

- [frontend/src/App.tsx](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\frontend\src\App.tsx)

Responsabilidades actuales:

- mostrar propuesta de valor
- recibir `username`, `mood` y `CSV`
- dejar pegar texto o subir archivo
- llamar `POST /recommend/csv`
- renderizar recomendaciones

Estilo principal:

- [frontend/src/styles.css](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\frontend\src\styles.css)

## Backend

Entrada principal:

- [backend/app/main.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\main.py)

Piezas actuales:

- [backend/app/models.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\models.py): contratos de request/response
- [backend/app/csv_ingest.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\csv_ingest.py): parser de CSV
- [backend/app/recommender.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\recommender.py): resumen y ranking heurístico
- [backend/app/catalog.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\catalog.py): catálogo mock
- [backend/app/db.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\db.py): SQLite (stdlib `sqlite3`, sin ORM), schema e inserts/queries
- [backend/app/auth.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\auth.py): hashing de password (PBKDF2, stdlib) y dependencia de sesión
- [backend/app/tmdb_client.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\tmdb_client.py): cliente TMDb (stdlib `urllib`), mapea género + overview a tags propios

## Decisiones deliberadas

- `CSV` antes que scraping: más simple para validar producto
- heurística simple antes que embeddings/agente libre: más control y menos humo
- `SQLite` vía stdlib en vez de un ORM: el esquema es chico (4 tablas), no
  justifica sumar `SQLAlchemy` todavía
- tokens de sesión opacos en vez de `JWT`: logout trivial (borrar la fila), sin
  sumar una librería de firma
- `TMDb` vía `urllib` stdlib, sin sumar `httpx`/`requests` al runtime del
  backend (solo se usan como dependencia de test)
- IDs de género de TMDb hardcodeados (son constantes públicas estables) en vez
  de fetchear y cachear `/genre/movie/list`
- si TMDb falla o no está configurada, cae al catálogo mock en vez de romper
  la respuesta — ver `docs/tmdb-setup.md`

## Limitaciones actuales

- catálogo real de `TMDb`, pero el mapeo género/overview → tags es heurístico
  y coarse (no hay nuance real de tono/ritmo todavía)
- solo películas del catálogo real, no series (`/discover/tv` queda pendiente)
- sin caché de resultados de TMDb
- no hay agente de IA conectado (sin API key de LLM todavía)
- no hay scraping de Letterboxd por username, solo CSV export manual
- no parsea todavía todas las variantes de export de Letterboxd
- sin recuperación de contraseña, sin rate limiting de login

## Próxima arquitectura probable

- series en el catálogo real (`/discover/tv`)
- agente de IA (LLM) para sintetizar gusto y rerankear picks, una vez haya
  API key
- scraping o import automático desde el username de Letterboxd, como
  alternativa al CSV manual
