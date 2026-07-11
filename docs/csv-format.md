# Formato CSV soportado

## Qué soporta hoy

El backend acepta un CSV con header y busca estas columnas:

### Título

- `Name`
- `Title`
- `Film`

### Rating

- `Rating`
- `Watched Rating`
- `Letterboxd Rating`

### Review

- `Review`
- `Review Text`
- `Comments`

## Formatos de rating aceptados

- decimal: `4.5`
- estrellas: `★★★★½`

Si una fila no tiene título o rating parseable, se descarta.

## Ejemplo mínimo

```csv
Name,Rating,Review
Perfect Blue,4.5,psychological and dark
Before Sunrise,★★★★½,"romantic, warm"
```

## Cómo exportar tu CSV real de Letterboxd

Letterboxd no tiene API pública para terceros, así que la vía oficial para sacar
tus datos es su export propio:

1. Entrá a Letterboxd logueado y andá a `Settings` → pestaña `Data`.
2. Click en `Export your data`. Te genera un `.zip` y lo descarga.
3. Descomprimí el `.zip`. Adentro vas a encontrar varios CSV, entre otros:
   - `ratings.csv` — título, año y tu rating (0.5 a 5, sin reviews).
   - `reviews.csv` — igual que ratings pero con el texto de tu review.
   - `diary.csv` — tu diario de vistas, con rewatches.
4. Para PeliPick usá `ratings.csv` o `reviews.csv` (`reviews.csv` da mejores
   recomendaciones porque el parser lee texto de reviews para inferir tono).
   Abrilo y pegá el contenido tal cual, o subilo directo con el selector de
   archivo — las columnas `Name` y `Rating` ya calzan con lo que soporta hoy.

Nota: cargar el CSV a mano es más trabajo que solo tipear tu username, pero es
la única vía sancionada por Letterboxd hoy. Traer el historial solo con el
username (scraping del perfil público) es una opción que evaluamos para más
adelante — ver `docs/mvp-status.md`.

## Qué NO soporta todavía

- múltiples archivos exportados que haya que combinar
- columnas completamente distintas a las listadas
- formatos raros de rating no decimal ni estrellas
- validaciones finas por año, director o id externo
- detección automática del archivo correcto dentro de un zip

## Comportamiento actual

- el frontend manda el `CSV` como texto
- el backend parsea con `csv.DictReader`
- cada fila válida se transforma en `RatedItem`

Código relacionado:

- [backend/app/csv_ingest.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\csv_ingest.py)
- [backend/tests/test_csv_ingest.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\tests\test_csv_ingest.py)

## Próximo endurecimiento

Lo siguiente a agregar acá es:

- compatibilidad con export real de Letterboxd
- mejor reporting de filas descartadas
- preview de filas parseadas en frontend
