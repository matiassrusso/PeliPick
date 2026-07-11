# Import del .zip de Letterboxd

## Qué soporta hoy

El usuario sube el `.zip` completo que exporta Letterboxd — no un CSV
suelto. El backend lo abre en memoria (`zipfile` + `io`, stdlib, sin sumar
dependencias) y lee estos archivos si están presentes:

| Archivo | Para qué se usa |
|---|---|
| `reviews.csv` (o `ratings.csv` si no hay reviews) | base: título + rating + review de cada peli puntuada |
| `diary.csv` | boost de +0.5 al rating de un título si `Rewatch` es `Yes` — rever algo es señal más fuerte que puntuarlo alto una vez |
| `likes/films.csv` | agrega como rating sintético 4.5 cualquier título con ❤️ que no esté ya puntuado |
| `watched.csv` | excluye de las recomendaciones todo lo ya visto, tenga rating o no (hoy solo excluíamos lo puntuado) |
| `profile.csv` | resuelve `Favorite Films` (URIs tipo `boxd.it/xxxx`) cruzando contra `Letterboxd URI` de `watched.csv`, y las agrega como rating sintético 5.0 |

Solo `reviews.csv`/`ratings.csv` es obligatorio — el resto es opcional, si
falta simplemente no aporta esa señal.

## Por qué zip y no un CSV pegado/subido

Antes se pedía pegar o subir un solo CSV (`ratings.csv` o `reviews.csv`) a
mano. El zip completo trae mucha más señal real de gusto (likes, rewatches,
favoritos explícitos, historial completo de visto) que un solo archivo no
tiene — ver el análisis en
[pending-changes-2026-07-11.md](pending-changes-2026-07-11.md). Como
además las columnas del export de Letterboxd son fijas (no hay variantes
que adivinar, a diferencia de un CSV pegado a mano), no hace falta la
lógica flexible de detección de columnas para estos archivos — igual se
sigue usando internamente (`backend/app/csv_ingest.py`) para parsear
`ratings.csv`/`reviews.csv`, por si Letterboxd cambia el formato o agrega
columnas nuevas.

## Formatos de rating aceptados

- decimal: `4.5`
- estrellas: `★★★★½`

Si una fila de `reviews.csv`/`ratings.csv` no tiene título o rating
parseable, se descarta (mismo comportamiento que antes).

## Cómo exportar tu zip de Letterboxd

1. Entrá a Letterboxd logueado y andá a `Settings` → pestaña `Data`.
2. Click en `Export your data`. Te genera un `.zip` y lo descarga.
3. Subilo tal cual, sin descomprimir — el drag-and-drop de la web solo
   acepta `.zip`.

## Qué NO soporta todavía

- `Tags` propios que el usuario le pone a cada film en `diary.csv`/
  `reviews.csv` (en la práctica casi nadie los usa, pero cuando existen son
  señal de gusto directa — pendiente)
- `comments.csv`, `likes/reviews.csv`, `likes/lists.csv` — evaluados,
  descartados por ser señal social y no de gusto propio
- reportar qué filas se descartaron del CSV base
- límite de tamaño: 20MB (los exports reales pesan decenas de KB, esto es
  solo un techo de seguridad contra abuso)

## Comportamiento actual

- el frontend manda el `.zip` como `multipart/form-data` (no JSON — un zip
  es binario) a `POST /recommend/zip`, junto al `mood` como campo de form
- el backend valida que el nombre termine en `.zip`, lee los bytes, y llama
  a `letterboxd_zip.parse_letterboxd_zip()`
- devuelve `400` si no es un zip válido, si no tiene `ratings.csv` ni
  `reviews.csv`, o si algún CSV interno viene mal formado

Código relacionado:

- [backend/app/letterboxd_zip.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\letterboxd_zip.py)
- [backend/app/csv_ingest.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\csv_ingest.py) (reusado para parsear `ratings.csv`/`reviews.csv`)
- [backend/tests/test_letterboxd_zip.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\tests\test_letterboxd_zip.py)

## Próximo endurecimiento

- soportar `Tags` de usuario cuando estén presentes
- reportar filas descartadas del CSV base
