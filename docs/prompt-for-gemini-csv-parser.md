# Prompt para Gemini — endurecer el parser de CSV

Pegá esto tal cual en Gemini, junto con `docs/pending-changes-2026-07-11.md`.

---

## Contexto

Estás trabajando sobre **PeliPick**, un motor de recomendaciones de pelis y
series. Partí del último commit de `main` en GitHub tal cual está ahora.

La vez pasada se te pidió trabajar sobre una versión anterior de este mismo
repo, y el resultado divergió por completo: migraste todo el backend de
Python/FastAPI a Node/Express/TypeScript, reemplazaste SQLite por un archivo
JSON plano, y construiste un componente (`MovieCard` con auto-fetch de
metadata) que nadie pidió. Ese trabajo **no se usó** — el repo actual en
GitHub sigue siendo FastAPI + SQLite + React/Vite, con el agente de Gemini y
el catálogo de series ya integrados por otro agente (Claude) en los commits
más recientes. No repitas esa migración.

**Restricción no negociable: no toques la arquitectura.** El stack de este
proyecto es fijo:

- Backend: **FastAPI (Python)**, SQLite vía stdlib `sqlite3` (sin ORM)
- Frontend: **React + TypeScript + Vite + Tailwind**
- Deploy real: backend en Railway, frontend en Vercel (dos servicios
  separados, no un contenedor de un solo puerto)

Esto está documentado en `AGENTS.md` (raíz del repo) — leelo antes de
escribir una sola línea. Si en algún momento pensás que hay que cambiar de
stack, de base de datos, o de arquitectura para resolver la tarea de abajo,
parate y decilo en texto en vez de hacerlo. La tarea de abajo se resuelve
100% dentro del stack actual.

## Estado actual del repo

Ya están hechos y no hay que tocarlos: login/registro real, catálogo real de
TMDb (películas y series), agente de IA con Gemini que refina el resumen de
gusto y los picks (con fallback si falla), persistencia en SQLite, feedback
por pick. Detalle completo en `docs/mvp-status.md` y `docs/architecture.md`.

## La tarea

Endurecer el parser de CSV para que soporte más variantes reales del export
de Letterboxd, y reportar qué filas se descartan en vez de solo ignorarlas
en silencio. Es el ítem "Hecho pero verde → parser CSV" de
`docs/mvp-status.md`.

Archivos relevantes (leelos primero, en este orden):

1. `docs/csv-format.md` — qué soporta hoy el parser y qué no
2. `backend/app/csv_ingest.py` — la implementación actual
3. `backend/tests/test_csv_ingest.py` — los tests actuales
4. `backend/app/models.py` — el modelo `RatedItem`
5. `backend/app/main.py` — dónde se llama `parse_ratings_csv` (endpoint
   `POST /recommend/csv`)

### Qué falta cubrir

- Más variantes de columnas de las que ya soporta (`Name`/`Title`/`Film`
  para título, `Rating`/`Watched Rating`/`Letterboxd Rating` para rating,
  `Review`/`Review Text`/`Comments` para review) — revisá si el export real
  de Letterboxd (`ratings.csv`, `reviews.csv`, `diary.csv`) tiene columnas
  que hoy no se contemplan (fechas, `Rewatch`, `Tags`, etc.) y decidí cuáles
  vale la pena soportar sin inventar alcance de más.
- Reportar filas descartadas: hoy una fila sin título o rating parseable se
  descarta en silencio. Necesitamos saber cuántas se descartaron y por qué,
  para mostrarlo eventualmente en el frontend (no hace falta tocar el
  frontend en esta tarea, solo dejar la info disponible en la respuesta del
  parser).

### Cómo entregarlo

- Cambios acotados a `backend/app/csv_ingest.py`, su test, y si hace falta
  ajustar el tipo de retorno, también `backend/app/models.py` y el único
  call site en `backend/app/main.py` (nada más).
- No agregues dependencias nuevas — el parser ya usa `csv.DictReader` de
  stdlib, seguí con eso.
- No toques el frontend, el agente de Gemini, TMDb, auth, ni la base de
  datos.
- Agregá tests para los casos nuevos (`backend/tests/test_csv_ingest.py`).
  Corré la suite completa (`py -m pytest backend/tests -q` desde la raíz del
  repo) y confirmá que sigue en verde antes de decir que terminaste.
- Actualizá `docs/csv-format.md` con lo que sumaste.
- No hagas nada de esto en silencio: si encontrás algo que valga la pena
  arreglar pero está fuera del alcance de esta tarea, decilo en texto, no lo
  implementes de una.

### Definición de terminado

- Tests nuevos y viejos pasan.
- El parser sigue devolviendo lo mismo que antes para los CSVs que ya
  soportaba (no rompiste nada existente).
- `docs/csv-format.md` refleja el comportamiento real actualizado.
- No hay ningún archivo fuera de la lista de arriba modificado.
