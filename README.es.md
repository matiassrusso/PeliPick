# Butaca

*[Read in English](README.md)*

Motor de recomendaciones de pelis y series basado en tu gusto real, no en promedios genéricos. Importás tu export completo de [Letterboxd](https://letterboxd.com) (o puntuás un puñado de películas a mano si no usás Letterboxd), y te recomienda picks con un "por qué" explicado por película, scoreados contra tu historial real de ratings.

**En vivo:** [butaca.xyz](https://butaca.xyz)

## Por qué

La mayoría de los motores de recomendación optimizan a nivel población ("a la gente que le gustó X también le gustó Y"). Butaca en cambio arma un perfil de gusto a partir de los ratings, reviews, likes, rewatches y favoritos reales de una sola persona, y scorea candidatos directo contra ese perfil, con un agente de IA que explica cada pick en lenguaje simple en vez de un porcentaje caja negra.

## Qué hace

1. Te registrás y después importás tu gusto: subís el `.zip` completo del export de Letterboxd, importás por username (historial reciente vía RSS), o te salteás Letterboxd directamente y puntuás un puñado de películas a mano / buscás títulos fuera del catálogo
2. Elegís un mood — perfil completo, lo último que viste, o géneros específicos — y si querés películas, series o ambas
3. El backend combina tus ratings, reviews, likes, rewatches y favoritos en un perfil de gusto, trae candidatos reales de TMDb y los scorea
4. Un agente de IA (NVIDIA NIM) refina el orden y las razones sobre una base heurística, así tenés resultados al instante y mejores explicaciones un momento después
5. Te devuelve hasta 6 picks con póster, % de match y una razón específica atada a tu propio historial, no una plantilla
6. Das feedback por pick (me interesa / no me interesa / ya la vi) para mejorar el scoring futuro, o lo sumás a tu watchlist

Otras cosas que maneja: auth real con recuperación de contraseña y verificación de email por mail, historial de recomendaciones revisitable, "dónde verla" por pick, y borrado de cuenta.

## Stack

- **Backend:** FastAPI, SQLite (local) / PostgreSQL (producción, Neon), API de TMDb para el catálogo, NVIDIA NIM para el agente de IA, Resend para mail transaccional
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Deploy:** Vercel (frontend), Render (backend)

## Correrlo local

### Backend

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```

Necesita `TMDB_API_KEY` y `NVIDIA_API_KEY` (ambas con free tier) en `backend/.env` — ver [tmdb-setup.md](docs/tmdb-setup.md) y [nvidia-setup.md](docs/nvidia-setup.md). `RESEND_API_KEY` es opcional; sin ella, los tokens de reset/verificación solo salen en la respuesta de la API con `BUTACA_DEBUG=1`.

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

## Docs

- [Producto y MVP](docs/product-mvp.md)
- [Arquitectura](docs/architecture.md)
- [Formato del zip de Letterboxd](docs/letterboxd-zip-format.md)
- [Referencia de API](docs/api.md)
- [Estado del MVP / build log](docs/mvp-status.md)
- [Entrypoint backend](backend/app/main.py) · [Entrypoint frontend](frontend/src/App.tsx)

## Estado

Activo, deployeado, con suite de tests real (180+ tests de backend). Proyecto solo, hecho de punta a punta (definición de producto, backend, frontend, deploy) como parte de un portfolio de data science / desarrollo.
