# Import por username de Letterboxd (feed RSS)

> **Historia:** hasta el 2026-07-21 esto scrapeaba el HTML del diario con
> `curl_cffi`. Funcionaba en dev local pero **siempre daba 403 en
> producción**: Cloudflare le sirve un challenge de JavaScript
> ("Just a moment...") a las IPs de datacenter como la de Render, y sin un
> browser no se puede resolver. No era el fingerprint TLS — `curl_cffi` ya
> pasaba esa parte — sino la reputación de IP. Confirmado en logs de prod:
> `cf_ray=...-PDX, server=cloudflare`, sin código numérico de error.
>
> Se reemplazó por el **feed RSS público** que Letterboxd ofrece por perfil,
> que es un canal oficial (lo recomiendan ellos mismos en la página de la
> API), sale con `urllib` pelado y no pasa por el challenge. De paso se pudo
> **borrar la dependencia `curl_cffi`**, que existía solo para este scraping.

## Qué soporta hoy

Alternativa a subir el `.zip` de Letterboxd: `POST /recommend/letterboxd`
recibe un `username` público y lee `https://letterboxd.com/<username>/rss/`.

Por cada entrada de película extrae: título, rating del miembro, fecha real
de visto, y si le puso like. Un mismo título repetido en el feed (rewatch)
suma +0.5 al rating existente (mismo bonus que el `Rewatch=Yes` del zip),
tope 5.0. Un título con like pero sin puntuar entra con rating sintético
4.5, igual que `likes/films.csv` en el zip. Títulos vistos sin puntuar ni
likear se excluyen de las recomendaciones sin sumar señal de gusto
(equivalente a `watched.csv`).

Los items que no son de película (listas publicadas) vienen sin `filmTitle`
y se descartan.

## Límite real: solo actividad reciente

El feed expone alrededor de 50 entradas, no el historial completo. Medido
contra el perfil público de `scorsese` el 2026-07-21:

| | Scraper viejo (en local) | RSS |
|---|---|---|
| Entradas leídas | ~2000 (20 páginas) | 56 |
| Con rating | 254 | 19 (10 puntuadas + 9 likes) |
| Likes | no accesibles | sí |
| Id de TMDb | no | sí (`tmdb:movieId`) |

O sea: el RSS es más rico **por entrada** pero mucho más corto. Para un
perfil de gusto completo el `.zip` sigue siendo el camino recomendado; el
username es un atajo ("no tengo el zip a mano ahora").

> Nota: el feed trae `tmdb:movieId` ya resuelto por entrada, que hoy **no se
> está usando** — el flujo sigue matcheando por título contra TMDb como con
> el zip. Aprovecharlo ahorraría requests y evitaría errores de matcheo, pero
> pedía tocar el pipeline compartido, así que quedó afuera de este cambio.

## Por qué solo el diario

Las grillas `/films/` y `/films/ratings/` de Letterboxd muestran el rating
vía un componente React que hidrata client-side — el HTML que devuelve el
server no trae esa info, así que no se puede leer sin ejecutar JS. El
diario (`/diary/`) es la única vista pública que sigue siendo
server-rendered con el rating ya en el HTML. Esto significa:

- si el usuario puntuó una peli sin loguearla nunca en el diario, esa señal
  no se puede leer por este camino (sí está en el zip)
- likes, favoritos del perfil y tags propios tampoco están disponibles acá
  (tampoco están en el diario) — para esa señal completa, el zip sigue
  siendo la opción más rica

Este import es un atajo rápido ("no tengo el zip a mano ahora"), no un
reemplazo funcional del zip.

## Por qué no alcanza con `urllib`/`requests`

Letterboxd está detrás de Cloudflare, que bloquea con `403` según el
fingerprint TLS del handshake (JA3), no según el header `User-Agent`. El
stack `ssl`/`urllib`/`requests` de Python tiene una firma TLS reconocible
como no-browser aunque mandes un `User-Agent` de Chrome real — headers no
alcanzan para evitarlo. `curl_cffi` (dependencia agregada en
`backend/requirements.txt`) resuelve esto imitando el fingerprint TLS real
de Chrome vía `libcurl`.

## Comportamiento actual

- `400` si `username` viene vacío
- `400` si no existe un usuario de Letterboxd con ese nombre (`404` en la
  primera página del diario)
- `400` si el diario no tiene ninguna entrada pública (perfil privado o
  diario vacío)
- `400` si Letterboxd no responde o devuelve un error de red
- comparte el resto del flujo (candidatos de TMDb, exclusión, scoring,
  refinamiento de Gemini, persistencia) con `/recommend/zip` — ver
  `_finish_recommend` en `backend/app/main.py`

Código relacionado:

- [backend/app/letterboxd_scrape.py](../backend/app/letterboxd_scrape.py)
- [backend/tests/test_letterboxd_scrape.py](../backend/tests/test_letterboxd_scrape.py)

## Riesgo conocido

Este parser depende de la estructura HTML actual del diario de Letterboxd
(clases CSS, atributos `data-*`). Si Letterboxd cambia ese markup, el
parser deja de matchear filas silenciosamente (no hay tests contra HTML en
vivo, solo contra fixtures armados a mano) — si empieza a fallar en
producción, lo primero a revisar es si cambió la estructura de
`diary-entry-row`.
