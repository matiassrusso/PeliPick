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
  propios, fallback al mock si falla o no hay key)
- tests de backend (21, incluyendo auth, feedback y TMDb mockeado)
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
  - sin agente de IA todavía (sintetizar gusto y rerankear con LLM)

- UX web
  - ya comunica el producto y tiene login + feedback
  - todavía sin pasada de diseño (esa es la próxima fase, después de esto)

## Falta para un MVP más serio

- agente de IA conectado (sintetizar gusto desde reviews, rerankear picks —
  necesita API key de un proveedor LLM)
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
