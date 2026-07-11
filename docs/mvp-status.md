# Estado del MVP

## Ya hecho

- definición de producto base
- recorte de MVP
- dirección visual inicial
- backend local con FastAPI
- frontend local con React + Vite
- recomendador heurístico simple
- ingesta manual por CSV, endurecido contra CSVs mal formados (rating fuera de
  rango, BOM, headers con espacios)
- login/registro real con passwords hasheadas (PBKDF2, stdlib) y sesiones por
  token opaco
- persistencia en SQLite: usuarios, ratings importados, recomendaciones
  servidas y feedback
- feedback explícito por pick (me interesa / no me interesa / ya la vi)
- catálogo real con `TMDb` (`/discover/movie`, mapeo género + overview a tags
  propios, fallback al mock si falla o no hay key), con póster/backdrop/
  overview/rating viajando hasta el frontend
- agente de IA con `Gemini` (free tier, sin pagar OpenAI de entrada): refina
  el resumen de gusto y el orden/razones de los picks ya filtrados por el
  heurístico, con fallback al resultado heurístico si falla o no hay key
- tests de backend (32, incluyendo auth, feedback, TMDb y Gemini mockeados)
- pasada de UX/UI: tema "cinematic" (paleta ámbar/dorada, `Instrument Serif` +
  `IBM Plex Sans`), animaciones con Framer Motion, páginas Home / Login /
  Recommend (CSV + mood + resultados con feedback) / NotFound
- build verificado de frontend

## Hecho pero verde

- parser CSV
  - funciona para casos simples y para `ratings.csv`/`reviews.csv` reales de
    Letterboxd
  - falta cubrir más variantes de columnas y reportar filas descartadas

- recomendación
  - ya scorea contra películas reales de TMDb, no solo el mock
  - el mapeo género/overview → tags es heurístico y coarse, sin nuance real
    de tono/ritmo
  - solo películas, no series
  - el agente de Gemini reordena y reescribe texto sobre esos candidatos,
    pero no rescorea ni trae candidatos propios — sigue acotado a lo que
    ya filtró el heurístico

- UX web
  - diseño generado con otra IA (plataforma "Manus"), adaptado a mano: nos
    quedamos con la UI/tema y descartamos enteros el server Node/tRPC/
    Drizzle/MySQL, el auth OAuth y el LLM de esa plataforma
  - páginas de perfil de gusto (gráficos) e historial de sesiones quedaron
    afuera de esta pasada — el diseño original las asumía, pero necesitan
    backend nuevo (ver abajo)
  - el modal de detalle de película no tiene cast ni tráiler (pediría un
    fetch extra por película a TMDb)

## Falta para un MVP más serio

- perfil de gusto visual (radar de géneros, heatmap de décadas, directores/
  actores favoritos) — necesita matchear cada título del CSV del usuario
  contra TMDb, no es trivial con exports grandes
- historial de sesiones de recomendación revisitables
- cast y tráiler en el detalle de cada película
- series en el catálogo real (`/discover/tv`)
- caché de resultados de TMDb si el uso crece
- import de historial por username de Letterboxd (scraping), como alternativa
  al CSV manual — evaluado, pendiente por ser la parte más frágil técnicamente
- parser endurecido para más variantes de export real
- excluir mejor títulos ya vistos cuando haya ids reales de catálogo
- observabilidad mínima
- recuperación de contraseña, rate limiting de login

## No entra todavía

- scraping complejo
- app mobile
- social features
- chat agente largo

## Riesgos abiertos

- que el export real de Letterboxd no coincida con el supuesto actual
- que el ranking mock dé una falsa sensación de calidad
- que el producto se vea prometedor visualmente antes de validar la calidad del pick

## Regla práctica para seguir

Cada iteración debería mover una de estas dos cosas:

- calidad real de recomendación
- claridad real del flujo de uso

Si no mejora una de esas dos, probablemente estamos metiendo complejidad al pedo.
