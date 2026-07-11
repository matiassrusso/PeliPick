# PeliPick

Motor de recomendaciones de pelis y series basado en el gusto real de una persona, no en promedios genéricos.

## Estado actual

Ya hay una primera vertical slice:

- `backend` con FastAPI
- `frontend` con React + Vite
- recomendador heurístico simple con catálogo mock
- carga manual de CSV -> picks

Todavía no hay integración real con Letterboxd ni TMDb. Esta etapa es para validar producto y UX, no ingestión final.

## Estructura

- [Producto y MVP](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\product-mvp.md)
- [Direcciones visuales](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\design-directions.md)
- [Arquitectura actual](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\architecture.md)
- [Formato CSV soportado](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\csv-format.md)
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

El frontend manda el contenido de un CSV al backend. El backend:

1. parsea filas compatibles con `Name/Title`, `Rating` y `Review`
2. resume el gusto
3. filtra títulos ya vistos
4. scorea candidatos por tags y mood
5. devuelve hasta 5 picks explicados

Nota:

- uso `8001` por default porque en esta máquina `8000` ya estaba ocupado por otro backend
- hoy soporta CSV simple y variantes chicas de nombres de columna; no todo export de Letterboxd todavía

## Próximo paso lógico

- conectar catálogo real
- persistir usuarios y feedback
- endurecer parser para export real de Letterboxd
