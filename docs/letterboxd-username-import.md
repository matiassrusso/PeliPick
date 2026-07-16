# Import por username de Letterboxd (scraping)

## Qué soporta hoy

Alternativa a subir el `.zip` de Letterboxd: `POST /recommend/letterboxd`
recibe un `username` público y scrapea su diario
(`https://letterboxd.com/<username>/diary/films/page/N/`), paginando hasta
20 páginas (~2000 entradas) o hasta encontrar una página vacía.

Por cada entrada de diario extrae: título, fecha real de visto, y rating (si
lo tiene). Un mismo título repetido en el diario (rewatch) suma +0.5 al
rating existente (mismo bonus que el `Rewatch=Yes` del zip), tope 5.0.
Títulos vistos pero nunca puntuados se excluyen de las recomendaciones sin
sumar señal de gusto (equivalente a `watched.csv`).

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
