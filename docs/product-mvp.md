# PeliPick - producto y MVP

## Qué problema resuelve

Hoy descubrir qué ver tiene dos problemas:

1. Los catálogos te muestran "popular" o "parecido a esto", no "parecido a vos".
2. Tus gustos ya están escritos en tus ratings, reviews y listas, pero nadie los interpreta bien.

La hipótesis del producto es esta:

> si entendemos qué te gusta y qué odiás a partir de tus señales reales, podemos recomendarte mejor que un ranking genérico.

## Crítica a la idea base

La idea es buena como punto de partida, pero si la dejamos así queda floja en dos lados:

1. `Letterboxd` no es una base sólida para series como fuente principal del MVP.
2. Si el MVP depende de scraping complejo desde el día 1, nos podemos trabar en ingestión antes de validar si la recomendación sirve.

Conclusión:

- el producto no tiene que ser "un cliente de Letterboxd"
- tiene que ser "un taste engine"
- Letterboxd puede ser la primera fuente de señal, no la identidad completa del sistema

## Usuario objetivo del MVP

Usuario cinéfilo o semi-cinéfilo que:

- ya puntúa o reseña en Letterboxd
- siente que los algoritmos comunes recomiendan cosas obvias
- quiere una sugerencia más pensada y más explicada

No apuntaría en el MVP al usuario casual que nunca puntuó nada. Ese onboarding requiere otro producto.

## Propuesta de valor

`Decime tu usuario de Letterboxd o subí tus datos, y te recomiendo qué ver según tus gustos reales, con razones basadas en tu propio historial.`

## Qué sería una recomendación "buena"

No alcanza con tirar títulos similares.

Una buena recomendación tiene que:

- estar alineada con patrones reales de gusto
- evitar cosas que el usuario suele rechazar
- adaptarse al contexto actual ("quiero algo liviano", "quiero sci-fi rara", etc.)
- explicar por qué apareció esa sugerencia

## MVP recomendado

### Objetivo

Demostrar que podemos generar recomendaciones personalizadas que el usuario sienta como:

- "sí, esto me representa"
- "sí, esto tiene sentido para mí"
- "sí, me ahorró decidir"

### Inputs del MVP

Arrancaría con estas 3 entradas, en este orden:

1. `username de Letterboxd` si logramos una ingestión estable
2. `upload manual` de export o CSV si no
3. `texto libre` opcional: "quiero ver algo como X pero menos solemne"

### Output del MVP

Una pantalla con:

- 5 recomendaciones rankeadas
- razón breve por cada una
- etiquetas de afinidad: tono, ritmo, temas, década, riesgo
- CTA claro: `ver hoy`, `guardar`, `descartar`

### Flujo del usuario

1. Entra.
2. Conecta o carga su historial.
3. El sistema genera su perfil de gusto.
4. El usuario pide una recomendación general o contextual.
5. Recibe picks explicados.
6. Da feedback simple.

## Qué features sí entran al MVP

- Ingesta básica del historial del usuario
- Perfil de gusto resumido
- Recomendación de películas
- Recomendación de series solo si la fuente de catálogo lo soporta bien
- Prompt contextual corto: estado de ánimo, género, duración, intensidad
- Feedback explícito: me interesa / no me interesa / ya la vi
- Explicación grounded en señales del usuario

## Qué NO entra al MVP

- red social
- chat agente largo tipo companion
- scraping masivo de amigos/following
- recomendaciones colaborativas complejas
- extensión de navegador
- app mobile nativa
- notificaciones
- ranking por embeddings sofisticados si una heurística + rerank ya alcanza

## Primer recorte técnico inteligente

La versión más corta que prueba valor es:

- importar historial
- sintetizar gustos con LLM
- traer candidatos desde una fuente de catálogo estable
- rankear candidatos con reglas simples + reranking
- mostrar 5 picks con explicación

Eso ya alcanza para testear si la idea vive o muere.

## Arquitectura mínima

### Frontend

- `React + TypeScript + Vite`
- una landing/onboarding
- una vista de perfil
- una vista de recomendación

### Backend

- `FastAPI`
- endpoint de ingesta
- endpoint de generación de perfil
- endpoint de recomendación
- endpoint de feedback

### Base de datos

- `SQLite` para arrancar

Guardar:

- usuario
- items vistos/rateados
- perfil sintetizado
- recomendaciones servidas
- feedback

### IA

Usar LLM para dos cosas nada más:

1. sintetizar patrones de gusto desde ratings/reviews
2. explicar o rerankear picks finales

No usar un agente libre para todo. Sería más caro, más lento y menos controlable.

### Catálogo

Para metadata y discovery, la base razonable hoy es `TMDb`, que documenta API para movie y TV y explica autenticación y rate limiting en su documentación oficial. Fuentes:

- [TMDb Getting Started](https://developer.themoviedb.org/docs/getting-started)
- [TMDb Rate Limiting](https://developer.themoviedb.org/docs/rate-limiting)

Nota:

- no conviene acoplar el MVP a una integración frágil de Letterboxd si todavía no validamos el valor central

## Cómo recomendar sin sobre-ingeniería

Primera versión del ranking:

1. extraer preferencias del usuario
2. filtrar candidatos por hard constraints
3. scorear por coincidencia con señales de gusto
4. rerankear top N con LLM
5. devolver top 5 con explicación

Hard constraints posibles:

- idioma
- duración
- género rechazado
- cosas ya vistas
- popularidad mínima o máxima

Señales blandas:

- directores que ama u odia
- décadas favoritas
- tono
- densidad narrativa
- afinidad con cine mainstream vs autoral
- tolerancia a rareza/lentitud/oscuridad

## Riesgos reales

### Riesgo 1 - ingestión desde Letterboxd

Puede ser el cuello de botella del proyecto.

Plan:

- arrancar con una opción manual de carga
- si después encontramos una integración robusta, la agregamos

### Riesgo 2 - series desalineadas con la fuente

Si el input viene de Letterboxd y el output incluye series, la señal histórica puede quedar sesgada a cine.

Plan:

- MVP centrado en pelis
- series como fase 2 o beta explícita

### Riesgo 3 - explicaciones humo

Si el sistema explica demasiado lindo pero recomienda mal, el producto muere.

Plan:

- primero medir calidad percibida del pick
- después pulir tono/explanations

## Métricas del MVP

Las más útiles al principio:

- porcentaje de recomendaciones guardadas
- porcentaje de recomendaciones descartadas
- porcentaje de "ya la vi"
- tiempo hasta elegir algo
- feedback subjetivo: "me entendió" sí/no

## Roadmap corto

### Fase 0 - definición

- cerrar alcance MVP
- elegir primera fuente de ingestión
- elegir primera dirección visual

### Fase 1 - vertical slice

- onboarding mínimo
- carga de historial
- perfil de gusto
- una recomendación funcional end-to-end

### Fase 2 - MVP usable

- ranking mejorado
- 5 picks
- feedback
- persistencia
- deploy

### Fase 3 - post-MVP

- series
- sync mejor
- listas
- recomendaciones por momento
- modo agente conversacional

## Mi recomendación concreta

Si querés ir rápido y bien:

1. MVP solo de `películas`
2. input principal por `carga manual/export`
3. `TMDb` como catálogo
4. `FastAPI + React + SQLite`
5. recomendación con pipeline clásico + LLM acotado

Eso evita la trampa de pasarnos dos semanas peleando contra integraciones antes de saber si el producto aporta valor.

## Primera vertical slice a construir

La primera demo útil debería hacer esto:

1. subir un CSV o dataset simple de películas rateadas
2. generar un perfil textual de gusto
3. pedir "quiero ver algo hoy"
4. devolver 3 picks con razones

Si esa demo se siente buena, el proyecto merece seguir.
