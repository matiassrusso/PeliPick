# PeliPick

Motor de recomendaciones de pelis y series basado en el gusto real de una persona, no en promedios genéricos.

## Estado actual

- `backend` con FastAPI: DB en SQLite, login real, catálogo de TMDb (con
  fallback a mock), feedback explícito por pick
- `frontend` con React + Vite + Tailwind: tema "cinematic", páginas Home /
  Login / Recommend (CSV + mood + resultados) / NotFound

Todavía no hay agente de IA (falta key de LLM) ni scraping de Letterboxd
(solo CSV export). Ver [mvp-status.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\mvp-status.md) para el detalle.

## Estructura

- [Producto y MVP](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\product-mvp.md)
- [Direcciones visuales](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\design-directions.md)
- [Arquitectura actual](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\architecture.md)
- [Formato CSV soportado](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\csv-format.md)
- [Setup de TMDb](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\tmdb-setup.md)
- [API actual](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\api.md)
- [Estado del MVP](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\mvp-status.md)
- [Build log](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\build-log.md)
- [API principal](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\main.py)
- [Frontend principal](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\frontend\src\App.tsx)

## Cómo correrlo

### Backend

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

## Qué hace hoy

1. te registrás o entrás con usuario/contraseña
2. pegás o subís un CSV (export de Letterboxd) y elegís un mood
3. el backend parsea, resume tu gusto, trae candidatos de TMDb (o cae al
   catálogo mock) y scorea
4. te devuelve hasta 5 picks con póster, razón y % de match
5. das feedback por pick (me interesa / no me interesa / ya la vi)

Nota:

- uso `8001` por default porque en esta máquina `8000` ya estaba ocupado por otro backend
- para el catálogo real necesitás `TMDB_API_KEY` en `backend/.env` — ver [tmdb-setup.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\tmdb-setup.md)
- hoy soporta CSV simple y `ratings.csv`/`reviews.csv` reales de Letterboxd; no todo export todavía

## Próximo paso lógico

- agente de IA (sintetizar gusto, rerankear picks) cuando haya key de LLM
- perfil de gusto visual e historial de sesiones
- scraping o import automático desde el username de Letterboxd
