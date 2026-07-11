# Setup de TMDb (para conectar más adelante)

Todavía no está conectado. Esta doc es la guía para cuando se implemente el
catálogo real, en una fase posterior a esta (ver `docs/mvp-status.md`).

## Cómo sacar la API key

1. Creá una cuenta gratis en https://www.themoviedb.org/signup
2. Andá a tu perfil → `Settings` → `API` (o directo a
   https://www.themoviedb.org/settings/api).
3. Pedí una API key tipo `Developer`. Te van a pedir nombre de la app y un
   contacto — para uso personal/MVP alcanza con completar lo básico.
4. TMDb te da dos credenciales: una `API Key (v3 auth)` y un `API Read Access
   Token (v4 auth)`. Cualquiera de las dos sirve para lo que necesitamos.

Fuentes oficiales:

- [TMDb Getting Started](https://developer.themoviedb.org/docs/getting-started)
- [TMDb Rate Limiting](https://developer.themoviedb.org/docs/rate-limiting)

## Dónde va

Cuando se conecte, la key va como variable de entorno `TMDB_API_KEY` (no
hardcodeada, no versionada). El backend la va a leer desde ahí para armar el
cliente HTTP contra la API de TMDb.

## Por qué todavía no está conectado

Esta fase (`docs/mvp-status.md`) priorizó persistencia, login y feedback antes
que reemplazar el catálogo mock. TMDb entra en la próxima fase.
