# Setup de Gemini

Ya está conectado. Esta doc es cómo se configuró y cómo funciona hoy.

## Por qué Gemini y no OpenAI

Se evaluó pagar $5 de créditos en OpenAI. Se optó por arrancar gratis con
Gemini (Google AI Studio): free tier real, sin tarjeta, límites razonables
para un MVP. Si en algún momento
la calidad no alcanza o se pega el límite, ahí sí tiene sentido pagar.

## Cómo sacar la API key

1. Entrá a https://aistudio.google.com/apikey con tu cuenta de Google.
2. `Create API key` (no pide tarjeta para el free tier).

Fuente oficial: [Gemini API — Get an API key](https://ai.google.dev/gemini-api/docs/api-key)

## Dónde va

`backend/.env` (gitignored, nunca se commitea):

```
GEMINI_API_KEY=tu-key-acá
```

Template en `backend/.env.example` (sin key real). Se carga con el mismo
loader chico de `.env` que ya usaba `tmdb_client.py` (stdlib, sin sumar
`python-dotenv`).

## Cómo se usa

- [backend/app/llm_client.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\llm_client.py)
  pega contra `gemini-flash-latest:generateContent` (stdlib `urllib`, sin
  SDK) con `responseSchema` para forzar JSON estructurado. Se probó primero
  con `gemini-2.0-flash`, pero esa key tenía cuota free-tier en 0 para ese
  modelo puntual (proyecto de Cloud sin billing linkeado) — `gemini-flash-latest`
  sí tenía cuota disponible.
- Recibe el historial parseado del CSV, el mood y los candidatos que ya
  filtró el recomendador heurístico (`recommend()` en
  [recommender.py](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\backend\app\recommender.py)).
- Le pide al modelo que elija y ordene como máximo 5 de esos candidatos
  (nunca inventa títulos nuevos — se descarta cualquier pick que no matchee
  por título exacto contra la lista) y que escriba un `taste_summary` y un
  `why` por pick más personalizados que los heurísticos.
- El resto de cada recomendación (score, tags, póster, overview) viene sin
  tocar del heurístico — el LLM solo reordena y reescribe texto, no inventa
  metadata.

## Si Gemini falla o no está configurada

`POST /recommend/csv` devuelve la respuesta heurística sin romper, igual que
con TMDb. Pasa si:

- no hay `GEMINI_API_KEY` seteada
- Gemini está caída, da timeout, devuelve JSON con formato inesperado, o
  todos los picks que sugiere quedan afuera de la lista de candidatos

## Tests

Igual que con TMDb: `backend/tests/conftest.py` limpia `GEMINI_API_KEY` del
entorno en cada test por default, así que nunca pegan contra la API real.
Los tests de `llm_client` mockean `_call_gemini` a mano.
