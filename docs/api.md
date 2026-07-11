# API actual

Base local esperada:

- `http://127.0.0.1:8001`

## `GET /health`

Chequeo bÃ¡sico del backend.

### Response

```json
{
  "status": "ok"
}
```

## Auth

Todo lo que toca datos de usuario (`/recommend/zip`, `/feedback`) requiere
sesiÃ³n. La sesiÃ³n es un token opaco, no JWT: se guarda en la tabla `sessions`
y se manda como header `Authorization: Bearer <token>`.

## `POST /auth/register`

### Body

```json
{
  "username": "mati",
  "password": "algo de 8+ caracteres"
}
```

### Response (201)

```json
{
  "token": "opaque-session-token",
  "username": "mati"
}
```

`409` si el username ya existe.

## `POST /auth/login`

Mismo body que `register`. Devuelve `200` con el mismo shape, `401` si el
usuario no existe o la contraseÃ±a es incorrecta, y `429` cuando ese username
acumula demasiados intentos fallidos seguidos.

Rate limiting actual:

- 1er y 2do fallo: `401`
- 3er fallo consecutivo: lock de 30s
- despuÃ©s escala con backoff exponencial, con tope de 15 minutos
- un login exitoso limpia el contador de fallos

## `POST /auth/forgot-password`

Inicia recuperaciÃ³n de contraseÃ±a.

### Body

```json
{
  "username": "mati"
}
```

### Response (200)

```json
{
  "status": "ok",
  "reset_token": "temporary-reset-token"
}
```

Si el usuario no existe, devuelve el mismo `200` con `reset_token: null`.

Nota: por ahora **no hay email configurado**. Entonces el backend genera y
valida el token, pero todavÃ­a lo devuelve en la response para poder probar el
flujo de punta a punta. Cuando haya proveedor de mail, ese token deberÃ­a dejar
de exponerse y enviarse por email con expiraciÃ³n corta.

## `POST /auth/reset-password`

Consume el token de recuperaciÃ³n y cambia la contraseÃ±a.

### Body

```json
{
  "token": "temporary-reset-token",
  "password": "nueva-clave-segura"
}
```

### Response

`204 No Content` si el cambio se aplicÃ³.

`400` si el token es invÃ¡lido o expirÃ³. Al resetear la contraseÃ±a, el backend
invalida todas las sesiones activas de ese usuario.

## `POST /auth/logout`

Requiere `Authorization: Bearer <token>`. Borra la sesiÃ³n. `204` siempre
(idempotente).

## `POST /recommend`

Endpoint viejo para mandar ratings ya parseados. No requiere auth, no
persiste nada â€” quedÃ³ igual que antes, sin uso desde el frontend.

### Body

```json
{
  "mood": "psychological",
  "ratings": [
    {
      "title": "Enemy",
      "rating": 4.5,
      "review": "psychological and weird in a good way"
    }
  ]
}
```

## `POST /recommend/zip`

Endpoint usado por la web. **Requiere auth.** Recibe el `.zip` completo que
exporta Letterboxd (no JSON â€” es `multipart/form-data`, porque un zip es
binario). Ver [letterboxd-zip-format.md](letterboxd-zip-format.md) para el
detalle de quÃ© archivos lee adentro del zip.

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Body (form fields)

```
mood: psychological
file: <el .zip como binario>
```

### Response

```json
{
  "taste_summary": "Tu historial tira mÃ¡s a cine de autor...",
  "recommendations": [
    {
      "id": 1,
      "title": "Perfect Blue",
      "year": 1997,
      "kind": "movie",
      "why": "coincide con patrones que venÃ­s premiando.",
      "match_score": 99,
      "tags": ["psychological", "dark", "stylized", "thriller"]
    }
  ]
}
```

`400` si el archivo no termina en `.zip`, si supera 20MB, si no es un zip
vÃ¡lido, si no tiene `ratings.csv` ni `reviews.csv` adentro, o si algÃºn CSV
interno viene mal formado.

Cada rating importado y cada recomendaciÃ³n servida quedan persistidos en
SQLite, asociados al usuario autenticado.

## `POST /feedback`

Requiere auth. Guarda feedback explÃ­cito sobre un pick ya servido.

### Body

```json
{
  "recommendation_id": 1,
  "status": "interested"
}
```

`status` es uno de `interested`, `not_interested`, `seen`.

`201` si se guardÃ³. `404` si la `recommendation_id` no existe o no es del
usuario autenticado (no distinguimos "no existe" de "es de otro usuario" para
no filtrar esa info).

## Notas

- persistencia en SQLite (`backend/pelipick.db`, path configurable con
  `PELIPICK_DB_PATH`)
- passwords con PBKDF2-HMAC-SHA256 + salt, sin librerÃ­as extra
- reset de contraseÃ±a con token efÃ­mero persistido en SQLite, todavÃ­a sin
  integraciÃ³n de email real
- no hay versionado de API todavÃ­a

CÃ³digo relacionado:

- [backend/app/main.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\main.py)
- [backend/app/models.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\models.py)
- [backend/app/db.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\db.py)
- [backend/app/auth.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\auth.py)
