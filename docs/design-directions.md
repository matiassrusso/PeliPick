# Direcciones visuales

> **Nota (2026-07-17):** este doc es la propuesta original de Fase 0. Ninguna de
> las 4 opciones de abajo terminó siendo el tema realmente implementado en ningún
> momento — el frontend pasó por un tema "cinematic" dark-first no documentado acá,
> y hoy corre el sistema "Hybrid critic notebook" (papel/tinta/terracota + dark
> mode real, tipografía `Inter Black` + `Playfair Display Italic` + `JetBrains
> Mono`) portado desde una iteración en Lovable — ver `DESIGN.md` y
> `docs/mvp-status.md` para el estado vigente. Se deja este doc como referencia
> histórica de la primera exploración de dirección visual.

No iría por "app de streaming genérica". Tiene que sentirse más curada, más cinéfila y más personal.

## Opción 1 - Cineclub Editorial

- Paleta: `#F4EFE6`, `#1C1A1A`, `#B55233`, `#7A8E76`
- Tipografía: `Fraunces` + `Manrope`
- Idea: mezcla de revista cultural y cuaderno de crítica

Sirve si querés que la app se sienta reflexiva, selectiva y con criterio.

## Opción 2 - Archivo Nocturno

- Paleta: `#111111`, `#E8E0D0`, `#C46A2D`, `#506D84`
- Tipografía: `Cormorant Garamond` + `Sora`
- Idea: posters gastados, sala oscura, catálogo de videoteca

Sirve si querés una identidad más cinéfila, intensa y memoriosa.

## Opción 3 - Crítico Moderno

- Paleta: `#FAF7F0`, `#20242B`, `#E85D3F`, `#5C7C66`
- Tipografía: `Instrument Serif` + `IBM Plex Sans`
- Idea: crítica contemporánea, limpia pero con personalidad

Es la más equilibrada para un MVP: se siente actual sin caer en SaaS genérico.

## Opción 4 - Bitácora Pop

- Paleta: `#FFF4D6`, `#222222`, `#FF6B35`, `#2E8B57`
- Tipografía: `Bricolage Grotesque` + `Source Sans 3`
- Idea: más accesible, más lúdica, menos solemne

Sirve si querés abrir el producto a gente menos cinéfila sin volverlo banal.

## Mi recomendación

Para el MVP elegiría `Opción 3 - Crítico Moderno`.

Por qué:

- no parece clon de Letterboxd
- no parece dashboard de startup
- deja convivir análisis, posters y recomendaciones explicadas
- escala bien a web app

## Componentes clave del look

- hero con claim fuerte y una recomendación ejemplo
- cards con poster grande y razón corta, no grillas frías
- perfil de gusto como "mapa de afinidades", no como formulario técnico
- microcopy con tono humano y criterio, no "AI insights"

## Anti-patrones a evitar

- fondo violeta con blur genérico
- tipografía default de SaaS
- exceso de badges
- layout tipo dashboard desde la home
- chat ocupando toda la experiencia desde el día 1
