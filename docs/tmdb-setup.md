# Setup de TMDb

Ya estÃ¡ conectado. Esta doc es cÃ³mo se configurÃ³ y cÃ³mo funciona hoy.

## CÃ³mo sacar la API key

1. CreÃ¡ una cuenta gratis en https://www.themoviedb.org/signup
2. AndÃ¡ a tu perfil â†’ `Settings` â†’ `API` (o directo a
   https://www.themoviedb.org/settings/api).
3. PedÃ­ una API key tipo `Developer`. Te van a pedir nombre de la app y un
   contacto â€” para uso personal/MVP alcanza con completar lo bÃ¡sico.
4. TMDb te da dos credenciales: una `API Key (v3 auth)` y un `API Read Access
   Token (v4 auth)`. Usamos la v3.

Fuentes oficiales:

- [TMDb Getting Started](https://developer.themoviedb.org/docs/getting-started)
- [TMDb Rate Limiting](https://developer.themoviedb.org/docs/rate-limiting)

## DÃ³nde va

`backend/.env` (gitignored, nunca se commitea) con una lÃ­nea:

```
TMDB_API_KEY=tu-key-acÃ¡
```

Hay un template en `backend/.env.example` (sin key real, ese sÃ­ se
commitea). El backend la carga una sola vez al levantar, vÃ­a un loader chico
de `.env` propio (stdlib, sin sumar `python-dotenv`).

## CÃ³mo se usa

- [backend/app/tmdb_client.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\tmdb_client.py)
  pide candidatos a `/discover/movie` y a `/discover/tv` (populares,
  `vote_count.gte=200`, en inglÃ©s) y si el mood mapea a un gÃ©nero limpio en
  cada catÃ¡logo lo usa para sesgar la bÃºsqueda (`funny`, `romance`, `action`,
  `psychological` para pelÃ­culas; solo `funny` y `action` tienen un gÃ©nero de
  TV limpio â€” TMDb no tiene gÃ©neros de TV para romance/thriller/horror).
- Cada resultado se convierte a tags de nuestro vocabulario (`psychological`,
  `dark`, `romantic`, etc.) combinando dos seÃ±ales:
  - gÃ©nero â†’ tags, con una tabla fija por tipo (`GENRE_ID_TAG_MAP` para
    pelÃ­culas, `TV_GENRE_ID_TAG_MAP` para series â€” los ids de gÃ©nero de TMDb
    son un set distinto para TV)
  - texto del overview escaneado con el mismo diccionario de hints que ya se
    usaba para leer las reviews del usuario
- Esto es heurÃ­stico y coarse a propÃ³sito â€” no hay nuance real de tono/ritmo
  todavÃ­a. Eso lo va a dar el agente de IA cuando haya key de un proveedor
  LLM.
- Hay cachÃ© en memoria por `kind + mood + page`, con TTL simple de 5 minutos
  y tope de 32 entradas. Si el mismo discover de pelÃ­culas o series se pide de
  nuevo antes de vencer, no repite la llamada HTTP; si expira o el proceso se
  reinicia, se vuelve a consultar TMDb.

## Si TMDb falla o no estÃ¡ configurada

`POST /recommend/csv` cae de vuelta al catÃ¡logo mock de 8 tÃ­tulos
(`backend/app/catalog.py`) sin romper la respuesta al usuario. Pasa si:

- no hay `TMDB_API_KEY` seteada
- TMDb estÃ¡ caÃ­da, da timeout, o devuelve algo inesperado

## Tests

Los tests nunca pegan contra la API real, aunque haya una key vÃ¡lida en
`backend/.env` en la mÃ¡quina: `backend/tests/conftest.py` limpia
`TMDB_API_KEY` del entorno en cada test por default. Los tests de
`tmdb_client` mockean la respuesta HTTP a mano y limpian el cachÃ© entre
casos para que el TTL no contamine la suite.
