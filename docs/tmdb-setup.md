# Setup de TMDb

Ya está conectado. Esta doc es cómo se configuró y cómo funciona hoy.

## Cómo sacar la API key

1. Creá una cuenta gratis en https://www.themoviedb.org/signup
2. Andá a tu perfil → `Settings` → `API` (o directo a
   https://www.themoviedb.org/settings/api).
3. Pedí una API key tipo `Developer`. Te van a pedir nombre de la app y un
   contacto — para uso personal/MVP alcanza con completar lo básico.
4. TMDb te da dos credenciales: una `API Key (v3 auth)` y un `API Read Access
   Token (v4 auth)`. Usamos la v3.

Fuentes oficiales:

- [TMDb Getting Started](https://developer.themoviedb.org/docs/getting-started)
- [TMDb Rate Limiting](https://developer.themoviedb.org/docs/rate-limiting)

## Dónde va

`backend/.env` (gitignored, nunca se commitea) con una línea:

```
TMDB_API_KEY=tu-key-acá
```

Hay un template en `backend/.env.example` (sin key real, ese sí se
commitea). El backend la carga una sola vez al levantar, vía un loader chico
de `.env` propio (stdlib, sin sumar `python-dotenv`).

## Cómo se usa

- [backend/app/tmdb_client.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\tmdb_client.py)
  pide candidatos a `/discover/movie` (populares, `vote_count.gte=200`, en
  inglés) y si el mood mapea a un género limpio (`funny`, `romance`,
  `action`, `psychological`) lo usa para sesgar la búsqueda.
- Cada resultado de TMDb se convierte a tags de nuestro vocabulario
  (`psychological`, `dark`, `romantic`, etc.) combinando dos señales:
  - género → tags, con una tabla fija (`GENRE_ID_TAG_MAP`)
  - texto del overview escaneado con el mismo diccionario de hints que ya se
    usaba para leer las reviews del usuario
- Esto es heurístico y coarse a propósito — no hay nuance real de tono/ritmo
  todavía. Eso lo va a dar el agente de IA cuando haya key de un proveedor
  LLM.
- Solo películas por ahora, no series (`/discover/tv` queda para una fase
  posterior).
- Sin caché de resultados — no hay volumen que lo justifique todavía.

## Si TMDb falla o no está configurada

`POST /recommend/csv` cae de vuelta al catálogo mock de 8 títulos
(`backend/app/catalog.py`) sin romper la respuesta al usuario. Pasa si:

- no hay `TMDB_API_KEY` seteada
- TMDb está caída, da timeout, o devuelve algo inesperado

## Tests

Los tests nunca pegan contra la API real, aunque haya una key válida en
`backend/.env` en la máquina: `backend/tests/conftest.py` limpia
`TMDB_API_KEY` del entorno en cada test por default. Los tests de
`tmdb_client` mockean la respuesta HTTP a mano.
