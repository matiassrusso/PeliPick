# (C) Plan maestro — de MVP a release público

> Creado: 2026-07-20. Objetivo: la mejor versión publicable de Butaca — rápida,
> con calidad de pick medible y mejorando, usable por gente sin Letterboxd,
> lista para mostrar a recruiters y para uso real. Costo total: ~US$10-12/año.

## Estrategia de orden (el porqué)

1. **Velocidad primero.** Nada de lo que sigue se puede evaluar ni mostrar con
   un login de ~3s y un cold start de ~1 min. Son además las horas mejor pagas
   de todo el plan (dos fixes de infra, cero código de producto).
2. **Medición antes que features.** Si lanzamos sin instrumentar, el launch no
   enseña nada. Las métricas ya están definidas en `product-mvp.md` desde el
   día 1 — falta solo leerlas.
3. **Calidad del pick antes de audiencia.** Traer gente a un motor que todavía
   ignora su propio feedback quema la primera impresión, y primera impresión
   hay una sola.
4. **Audiencia al final.** Launch recién cuando la app es rápida, mide, y
   recomienda bien.
5. **Monetización: no ahora.** Bloqueada legalmente (API de TMDb free es
   no-comercial, NVIDIA NIM free no es para producción comercial, scraping de
   Letterboxd va contra sus ToS). Se reevalúa solo con tracción real.

---

## Fase 0 — Velocidad y fundaciones (~1 finde)

> **Estado al 2026-07-20:** 0.1, 0.2 y 0.5 ✅. 0.3 hecho pero **pausado**
> (espera deploy). 0.4 pendiente (dominio sin comprar).

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 0.1 | Neon a la misma región que Render | ✅ | Migrado de `sa-east-1` (São Paulo) a `us-west-2` (Oregon) — cruzaba de continente, no solo de región. Login **2.85s → 0.59s** medido contra prod. |
| 0.2 | Warm-up del backend desde el frontend | ✅ | `fetch("/health")` fire-and-forget al montar (`useAuth.tsx`). Sin deployar todavía. |
| 0.3 | Keep-alive | ⏸️ | Monitor de UptimeRobot creado (5 min), pero **pausado**: prueba con `HEAD` y `/health` era GET-only → 405 falsos. Fix hecho en código; despausar recién al deployar. |
| 0.4 | Dominio propio (~US$10-12/año) + Resend | ⬜ | Libres: `butaca.io`, `butaca.co`, `butaca.me`, `butaca.film`. Tomados: `.com`, `.app`, `.tv`, `.ar`, `.com.ar`. Resend bloqueado hasta tener dominio. |
| 0.5 | Medir antes/después con curl | ✅ | Anotado en `docs/build-log.md`. |

**Criterio de salida:** primera visita sin cold start perceptible; login < 1s;
mail de recuperación llegando a una casilla de terceros.

## Fase 1 — Medir y proteger (~2-3 días)

| # | Tarea | Detalle |
|---|-------|---------|
| 1.1 | Instrumentar las métricas de `product-mvp.md` | % interested / not_interested / seen por sesión. La tabla `feedback` ya existe y el log INFO por recommend ya está — falta solo agregarlas: un script SQL contra Neon o un endpoint `/admin/stats` mínimo. Sin dashboard. |
| 1.2 | Rate limiting global en `/recommend/*` | Por usuario (ej. 20/día). Protege la cuota de TMDb y NIM antes de abrir la puerta a desconocidos. Mismo patrón stdlib que el rate limiting de login. |

## Fase 2 — Calidad del pick (~1-2 semanas)

| # | Tarea | Detalle |
|---|-------|---------|
| 2.1 | **Cerrar el loop de feedback** | La mejora más barata disponible: usar `feedback` en el scoring — penalizar tags/directores de lo marcado `not_interested`, excluir lo marcado `seen`. `recommender.py` ya scorea por señales; es una señal más. |
| 2.2 | Watchlist | Parsear `watchlist.csv` (ya viene en el zip, hoy se ignora) + cuarto modo "de mi watchlist". Probablemente el caso de uso más frecuente de un cinéfilo real. |
| 2.3 | "Dónde verla" | TMDb `/watch/providers` (datos JustWatch), región AR, en el modal de detalle. Resuelve el paso que sigue a la recomendación. |
| 2.4 | Render progresivo | Mostrar los picks heurísticos al toque y pisar los "why" cuando llegue el refine del LLM (~5-15s). No acelera nada; se *siente* 10s más rápido. |

**Criterio de salida:** en uso propio + 3-5 amigos, el % "me interesa" sube
respecto de la línea base de Fase 1; el flujo se siente instantáneo.

## Fase 3 — Listo para desconocidos (~1 semana)

| # | Tarea | Detalle |
|---|-------|---------|
| 3.1 | Onboarding sin Letterboxd | Grilla de posters conocidos para puntuar 10-15 películas al registrarse → genera un perfil inicial. Amplía el público de "gente con export de Letterboxd" a todos. |
| 3.2 | Higiene de cuenta | Verificación de email (el mailer ya existe), borrar cuenta, página breve de privacidad (qué se guarda, cómo se borra). |
| 3.3 | README en inglés | Para el repo público: screenshots, arquitectura, números de performance medidos. Es la cara del proyecto ante recruiters. |

## Fase 4 — Launch (continuo)

1. **Soft launch:** amigos + compañeros de la UBA. Iterar con lo que duela.
2. **Público:** post en LinkedIn (tono honesto, sin inflar), r/Letterboxd.
   El gancho a mostrar: el "why" personalizado citando el historial propio.
3. **Ritual semanal:** mirar las métricas de 1.1 y decidir Fase 5 con datos,
   no con ganas.

## Fase 5 — Condicional, según datos

| Señal observada | Respuesta |
|-----------------|-----------|
| Retención (gente vuelve) | Sync incremental por username (re-scrape periódico, perfil siempre vivo) |
| Calidad estancada | Embeddings/keywords de TMDb en vez del mapeo coarse género→tags |
| Uso compartido ("¿qué vemos?") | Modo "ver con alguien": mergear dos perfiles |
| Tracción real sostenida | Recién ahí evaluar monetización: licencia comercial de TMDb, LLM pago, retirar scraping. Y Render Starter (US$7/mes) cuando el ping no alcance. |

## Qué NO hacer (deliberadamente)

- App nativa, red social, chat agente largo — no mueven ni calidad de pick ni
  claridad de flujo (regla práctica del proyecto).
- Pagar infra hoy — sin usuarios no se justifica; el keep-alive gratis cubre.
- Monetizar antes de resolver licencias — riesgo legal, no "agregar Stripe".

## Riesgos

- **TMDb rate limit (~50 req/s compartido):** varios imports simultáneos con
  10 workers cada uno pueden rozarlo → mitigado por caches existentes + rate
  limit por usuario (1.2).
- **Scraping de Letterboxd frágil:** el zip sigue siendo el camino robusto;
  el onboarding manual (3.1) agrega una tercera vía.
- **Migración de Neon:** hacer dump antes, ventana corta; si algo sale mal,
  el `DATABASE_URL` viejo sigue funcionando.
- **750h/mes de Render con keep-alive:** alcanza para exactamente un servicio;
  no sumar un segundo servicio free en la misma cuenta.

## Timeline estimado

Fases 0-3 ≈ **4-6 semanas** a ritmo de side project. Fase 4 en adelante,
continuo. Cada fase cierra con tests en verde y entrada en `build-log.md`.
