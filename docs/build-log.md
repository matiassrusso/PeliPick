# Build Log

## 2026-07-11

### Persistencia, login y feedback

- SQLite (stdlib `sqlite3`, sin ORM), tokens de sesión opacos, passwords con
  PBKDF2 — cero dependencias nuevas
- feedback explícito por pick (me interesa / no me interesa / ya la vi)

### Catálogo real con TMDb

- `/discover/movie` mapeado a nuestro vocabulario de tags (género + overview)
- fallback al catálogo mock si TMDb falla o no hay key configurada

### UI/UX generada externamente, adaptada a mano

- el usuario generó un frontend completo con otra IA (plataforma "Manus"):
  Node/tRPC/Drizzle/MySQL en el server, React/Tailwind/Radix con tema
  "cinematic" en el cliente
- se investigó el zip con agentes antes de tocar nada: el diseño asumía un
  backend más rico que el nuestro (perfil de gusto con gráficos, sesiones
  revisitables, cast/tráiler, explicaciones por LLM)
- decisión: nos quedamos solo con la UI/tema, tiramos el server entero, y
  reconectamos las páginas a nuestro FastAPI existente — sin construir las
  features que ese backend hubiera necesitado
- se verificó código real (no solo lo "disponible") antes de portar
  dependencias: ninguna página usaba los componentes shadcn/ui/Radix del zip,
  así que no se portaron
- póster/backdrop/overview/rating de TMDb ahora viajan hasta el frontend
  (ya venían gratis en la respuesta que se pedía)
- quedó afuera, documentado: perfil de gusto con gráficos, historial de
  sesiones, cast/tráiler en el modal

## 2026-07-10

### Base del producto

- se definió el MVP en [product-mvp.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\product-mvp.md)
- se eligió la dirección visual `Crítico Moderno` en [design-directions.md](C:\Users\matia\OneDrive\Escritorio\Webs\projects\pelipick\docs\design-directions.md)

### Vertical slice técnica

- se armó `FastAPI` para health y recomendación
- se armó `React + Vite` para onboarding y results
- se agregó recomendador heurístico con catálogo mock
- se validó backend con tests y frontend con build

### Ingesta manual

- se reemplazó el historial hardcodeado por carga manual de `CSV`
- se agregó parser backend para columnas tipo `Name`, `Rating`, `Review`
- se agregó endpoint `POST /recommend/csv`

### Iteración web

- se mejoró la home para que explique mejor qué hace el producto
- se agregó una sección de workflow y una de señales de gusto
- se buscó que la app se sienta menos "formulario técnico" y más producto editorial

### Documentación técnica mínima

- se agregó una doc de arquitectura actual
- se agregó una doc del formato CSV soportado
- se agregó una doc mínima de endpoints
- se agregó una doc de estado del MVP

### Siguiente foco

- endurecer parser contra export real de Letterboxd
- persistir feedback del usuario
- conectar catálogo real
