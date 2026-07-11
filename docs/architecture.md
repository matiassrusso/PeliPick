# Arquitectura actual

## Resumen

Hoy `PeliPick` es una vertical slice local con dos partes:

- `frontend` en `React + TypeScript + Vite`
- `backend` en `FastAPI`

Ya hay base de datos (`SQLite`) y login. No hay catálogo real todavía. No hay integración real con Letterboxd todavía.

## Flujo actual

1. El usuario se registra o entra con usuario/contraseña.
2. El usuario pega o sube un `CSV` desde la web.
3. El frontend manda el contenido crudo al backend con su token de sesión.
4. El backend parsea filas válidas.
5. El backend resume el gusto del usuario.
6. El backend scorea un catálogo mock.
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

## Decisiones deliberadas

- `CSV` antes que scraping: más simple para validar producto
- catálogo mock antes que `TMDb`: más simple para validar UX y ranking
- heurística simple antes que embeddings/agente libre: más control y menos humo
- `SQLite` vía stdlib en vez de un ORM: el esquema es chico (4 tablas), no
  justifica sumar `SQLAlchemy` todavía
- tokens de sesión opacos en vez de `JWT`: logout trivial (borrar la fila), sin
  sumar una librería de firma

## Limitaciones actuales

- no hay recomendaciones basadas en catálogo real (sigue siendo mock)
- no hay agente de IA conectado (sin API key de LLM todavía)
- no hay integración real con `TMDb` (sin API key todavía, guía en `docs/tmdb-setup.md`)
- no hay scraping de Letterboxd por username, solo CSV export manual
- no parsea todavía todas las variantes de export de Letterboxd
- sin recuperación de contraseña, sin rate limiting de login

## Próxima arquitectura probable

- cliente real para `TMDb`
- agente de IA (LLM) para sintetizar gusto y rerankear picks, una vez haya
  API key
- scraping o import automático desde el username de Letterboxd, como
  alternativa al CSV manual
