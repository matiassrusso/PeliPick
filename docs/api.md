# API actual

Base local esperada:

- `http://127.0.0.1:8001`

## `GET /health`

Chequeo básico del backend.

### Response

```json
{
  "status": "ok"
}
```

## Auth

Todo lo que toca datos de usuario (`/recommend/csv`, `/feedback`) requiere
sesión. La sesión es un token opaco, no JWT: se guarda en la tabla `sessions`
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

Mismo body que `register`. Devuelve `200` con el mismo shape, o `401` si el
usuario no existe o la contraseña es incorrecta.

## `POST /auth/logout`

Requiere `Authorization: Bearer <token>`. Borra la sesión. `204` siempre
(idempotente).

## `POST /recommend`

Endpoint viejo para mandar ratings ya parseados. No requiere auth, no
persiste nada — quedó igual que antes, sin uso desde el frontend.

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

## `POST /recommend/csv`

Endpoint usado por la web. **Requiere auth.**

### Headers

```
Authorization: Bearer <token>
```

### Body

```json
{
  "mood": "psychological",
  "csv_content": "Name,Rating,Review\nEnemy,4.5,psychological and weird in a good way"
}
```

### Response

```json
{
  "taste_summary": "Tu historial tira más a cine de autor...",
  "recommendations": [
    {
      "id": 1,
      "title": "Perfect Blue",
      "year": 1997,
      "kind": "movie",
      "why": "coincide con patrones que venís premiando.",
      "match_score": 99,
      "tags": ["psychological", "dark", "stylized", "thriller"]
    }
  ]
}
```

`400` si el CSV no se puede parsear o no tiene filas válidas.

Cada rating importado y cada recomendación servida quedan persistidos en
SQLite, asociados al usuario autenticado.

## `POST /feedback`

Requiere auth. Guarda feedback explícito sobre un pick ya servido.

### Body

```json
{
  "recommendation_id": 1,
  "status": "interested"
}
```

`status` es uno de `interested`, `not_interested`, `seen`.

`201` si se guardó. `404` si la `recommendation_id` no existe o no es del
usuario autenticado (no distinguimos "no existe" de "es de otro usuario" para
no filtrar esa info).

## Notas

- persistencia en SQLite (`backend/pelipick.db`, path configurable con
  `PELIPICK_DB_PATH`)
- passwords con PBKDF2-HMAC-SHA256 + salt, sin librerías extra
- no hay versionado de API todavía

Código relacionado:

- [backend/app/main.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\main.py)
- [backend/app/models.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\models.py)
- [backend/app/db.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\db.py)
- [backend/app/auth.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\auth.py)
