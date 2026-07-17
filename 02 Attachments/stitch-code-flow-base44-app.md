I

## El Protocolo de Diseño

### Diséñalo primero en Stitch

Entra en [stitch.withgoogle.com](https://stitch.withgoogle.com/) (gratuito con una cuenta de Google: 350 generaciones al mes). Describe tu aplicación en lenguaje llano: para qué sirve, las pantallas que necesitas y la sensación que buscas.

Después, añade imágenes de referencia. Coge dos o tres capturas de Dribbble o Pinterest de aplicaciones cuyo aspecto te guste, y Stitch imitará ese estilo. Este es el paso que de verdad importa: sin referencias, recurre a un aspecto genérico; con ellas, construye hacia algo que has elegido a propósito. Obtendrás pantallas, composiciones, colores y tipografía como un único sistema.

![Macrofotografía clínica de un teclado mecánico de aluminio retroiluminado en la oscuridad, con sombras profundas y controladas que transmiten la precisión técnica de la herramienta](https://media.base44.com/images/public/6a45960b7f65df26e6ce1c40/124cc2bc4_generated_396f5993.png)FIG. 01 — La precisión de la herramienta.

> Describe la aplicación. Enséñale la esencia. Deja que genere el sistema.

II

## La Transferencia de Datos

### Entrégaselo a Claude Code

Esta es la parte que lo cambia todo. En lugar de que Claude adivine cómo debe ser la interfaz, le entregas el diseño real.

■ La vía rápida

En Stitch, exporta tu diseño como un archivo `DESIGN.md`: markdown puro con tus colores, tipografías, espaciados y componentes exactos. Déjalo en la carpeta raíz de tu proyecto de Claude Code. Claude lo lee por su cuenta y construye cada pantalla a partir de esos valores exactos en vez de inventarse los suyos.

■ La vía en directo

Configura el servidor MCP de Stitch para que Claude Code extraiga tus pantallas directamente. Es mejor para aplicaciones multipantalla en las que quieres cada pantalla asignada a una ruta, pero requiere iniciar sesión en Google Cloud, así que exige más configuración.

Seguramente te preguntes cuál de las dos necesitas. Para una página de aterrizaje o tu primera aplicación, el archivo `DESIGN.md` es más rápido y cumple la misma función. Reserva la vía del MCP para cuando tengas una aplicación multipantalla de verdad.

> Un archivo de diseño en la raíz del proyecto vale más que un párrafo describiendo lo que quieres.

III

## La Fase de Ejecución

### Dile que remate el trabajo

Esto es lo que nadie te advierte: Stitch te da pantallas _estáticas_. Tienen un aspecto estupendo, pero todavía no funciona nada: sin animaciones, sin maquetación móvil, botones que no llevan a ninguna parte. Es lo normal. Es un primer borrador, no una aplicación terminada.

Así que lo rematas en Claude Code con una instrucción cada vez, no con un único prompt gigante: conecta las pantallas para que la navegación funcione, añade las animaciones y los estados hover, hazlo adaptable para móvil y, por último, pule los espaciados.

(No quedará perfecto al píxel: las tipografías y los espaciados se desvían un poco porque la generación de código no es exacta. Pon la vista previa de Stitch junto al resultado y ajusta lo que esté descuadrado.)

![Macrofotografía industrial de planos de arquitectura y herramientas de dibujo de precisión sobre una superficie negra mate, con iluminación cenital dura que evoca el rigor del documento técnico](https://media.base44.com/images/public/6a45960b7f65df26e6ce1c40/ebaf82dca_generated_cd1b04d6.png)

> Stitch te entrega el aspecto. Claude lo hace funcionar.

FIG. 02 — Del plano a la estructura.

IV

## El Índice de Ejecución

### Haz esto en los próximos 10 minutos

■ 01

Abre stitch.withgoogle.com, describe tu aplicación en una o dos frases y añade dos o tres capturas de referencia de Dribbble o Pinterest.

■ 02

Exporta el diseño como un archivo DESIGN.md y guárdalo en la carpeta raíz de tu proyecto de Claude Code.

■ 03

En Claude Code, dile «construye las pantallas a partir de DESIGN.md y luego hazlas adaptables», y compara el resultado con la vista previa de Stitch.

Así es como la aplicación construida con IA deja de parecer construida con IA.