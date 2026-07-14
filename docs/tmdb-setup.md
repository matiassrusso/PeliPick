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

- [backend/app/tmdb_client.py](../backend/app/tmdb_client.py)
  pide candidatos a `/discover/movie` y a `/discover/tv` (populares,
  `vote_count.gte=200`, en inglés) y si el mood mapea a un género limpio en
  cada catálogo lo usa para sesgar la búsqueda (`funny`, `romance`, `action`,
  `psychological` para películas; solo `funny` y `action` tienen un género de
  TV limpio — TMDb no tiene géneros de TV para romance/thriller/horror).
- Cada resultado se convierte a tags de nuestro vocabulario (`psychological`,
  `dark`, `romantic`, etc.) combinando dos señales:
  - género → tags, con una tabla fija por tipo (`GENRE_ID_TAG_MAP` para
    películas, `TV_GENRE_ID_TAG_MAP` para series — los ids de género de TMDb
    son un set distinto para TV)
  - texto del overview escaneado con el mismo diccionario de hints que ya se
    usaba para leer las reviews del usuario
- Esto es heurístico y coarse a propósito — no hay nuance real de tono/ritmo
  todavía. Eso lo va a dar el agente de IA cuando haya key de un proveedor
  LLM.
- Hay caché en memoria por `kind + mood + page`, con TTL simple de 5 minutos
  y tope de 32 entradas. Si el mismo discover de películas o series se pide de
  nuevo antes de vencer, no repite la llamada HTTP; si expira o el proceso se
  reinicia, se vuelve a consultar TMDb.

## Si TMDb falla o no está configurada

`POST /recommend/csv` cae de vuelta al catálogo mock de 8 títulos
(`backend/app/catalog.py`) sin romper la respuesta al usuario. Pasa si:

- no hay `TMDB_API_KEY` seteada
- TMDb está caída, da timeout, o devuelve algo inesperado

## Tests

Los tests nunca pegan contra la API real, aunque haya una key válida en
`backend/.env` en la máquina: `backend/tests/conftest.py` limpia
`TMDB_API_KEY` del entorno en cada test por default. Los tests de
`tmdb_client` mockean la respuesta HTTP a mano y limpian el caché entre
casos para que el TTL no contamine la suite.
