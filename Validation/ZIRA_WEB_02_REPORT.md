# ZIRA-WEB-02 — Light premium theme

Fecha de validación: 2026-10-10. Alcance: implementación y revisión local; sin operaciones remotas.

ZIRA_WEB_02=READY_FOR_VISUAL_APPROVAL
LIGHT_PREMIUM_THEME=IMPLEMENTED
REFERENCE_COMPOSITION=PRESERVED
RESPONSIVE=PASS
BUILD=PASS
PRODUCTION=UNCHANGED

## Estado y referencia

BASE_SHA=df866b8517dcdce2802341c418a419980268e30b

FINAL_SHA=df866b8517dcdce2802341c418a419980268e30b (HEAD sin cambios; implementación pendiente de commit, no autorizado)

REFERENCE_IMAGE=Validation/References/ZIRA_LIGHT_PREMIUM_V1.png

La referencia proporcionada por el usuario se conserva únicamente para comparación. La página usa componentes Astro, HTML, SVG y estilos reales; no emplea la captura como contenido o fondo. Se reutiliza la arquitectura existente, sin cambios de dependencias.

## Implementación

DESIGN_TOKENS=Variables centralizadas en web/src/styles/global.css

| Token | Valor |
| --- | --- |
| PRIMARY_NAVY | #102B46 |
| DEEP_NAVY | #071E33 |
| GOLD | #D8AB56 |
| GOLD_HOVER | #C49438 |
| WHITE | #FFFFFF |
| LIGHT_BACKGROUND | #F7F8FA |
| SKY_BLUE | #BFDDF2 |
| TEXT_PRIMARY | #102B46 |
| TEXT_SECONDARY | #526174 |

Tokens complementarios: dorado para texto pequeño #916618; panel azul #204565. Garantizan contraste del texto normal sobre blanco y azul. Tipografía local Georgia para títulos y Arial/sans-serif para cuerpo, sin dependencias de fuentes externas.

IMPLEMENTED_COMPONENTS=Header, Hero, Services, About, Projects, ServiceAreas, Footer, Icon y BaseLayout

- Header navy, símbolo dorado provisional, navegación y CTA; menú móvil con aria-expanded, cierre al seleccionar enlace y Escape, y foco visible.
- Hero luminoso con residencia/piscina, degradado claro, título aprobado, dos botones y contenido verificable.
- Seis servicios con fotografía, icono SVG, descripción y control Learn More mediante details/summary; información adicional y enlace a contacto.
- About con texto blanco sobre navy e imagen arquitectónica a la derecha.
- Galería de cuatro ejemplos identificados como ilustrativos, sin atribuirlos a trabajos realizados por Zira.
- Ciudades suministradas, mapa esquemático y contacto sin teléfono, dirección, correo o formulario inventados. Los CTA llevan a la sección que informa que los canales reales están pendientes.

IMAGE_ASSETS=web/src/assets/images/{hero,kitchen,windows,roof,outdoor}.webp

Son cinco imágenes generadas de propiedades ficticias. Fuentes, condiciones de uso, rutas y prompts finales están documentados en [ZIRA_WEB_02_ASSETS.md](ZIRA_WEB_02_ASSETS.md). Se reutilizan imágenes entre servicios y galería. Astro produce 27 variantes optimizadas con srcset; hero con carga prioritaria y restantes imágenes con lazy loading. No se copiaron fotografías de otros sitios.

## Validación local

Preview: http://127.0.0.1:4322/

DESKTOP_VALIDATION=PASS

MOBILE_VALIDATION=PASS

| Pantalla solicitada | Ancho visible / contenido | Columnas de servicios | Overflow horizontal |
| --- | --- | --- | --- |
| Desktop 1440 × 900 | 1425 / 1425 px | 6 | No |
| Tablet 768 × 1024 | 753 / 753 px | 3 | No |
| Mobile 393 × 852 | 378 / 378 px | 1 | No |
| Mobile 430 × 932 | 415 / 415 px | 1 | No |

El ancho visible excluye la barra vertical del navegador. Capturas de página completa en PNG:

- [Desktop](Generated/ZiraWeb02/desktop.png)
- [Tablet](Generated/ZiraWeb02/tablet.png)
- [Mobile 393](Generated/ZiraWeb02/mobile.png)
- [Mobile 430](Generated/ZiraWeb02/mobile-430.png)
- [Comparación con referencia](Generated/ZiraWeb02/comparison.png)

Evidencia DOM: [responsive-metrics.json](Generated/ZiraWeb02/responsive-metrics.json). En las cuatro pantallas: un h1, ningún enlace interno roto, ninguna imagen sin alt y ningún formulario ficticio. Menú móvil comprobado por apertura, selección, Enter y Escape; Learn More abre y cierra mediante teclado. Sin errores de consola observados. Imágenes adaptables, controles táctiles y estados de foco visibles; estilos contemplan reduced motion.

Contraste calculado para las combinaciones sólidas principales: dorado de texto/blanco 5.10:1; navy profundo/dorado 7.95:1; navy profundo/dorado hover 6.15:1; blanco/navy 14.42:1; blanco/panel azul 10.00:1; dorado/panel azul 4.70:1; texto secundario/blanco 6.32:1. [Datos](Generated/ZiraWeb02/contrast-metrics.json). Todos superan 4.5:1. La legibilidad sobre fotografía se inspeccionó visualmente con el overlay claro; estas comprobaciones básicas no constituyen una auditoría WCAG completa.

ASTRO_CHECK=PASS — 12 archivos, 0 errores, 0 advertencias, 0 hints.

TESTS=PASS — 4 pruebas de contacto, navegación, declaración de imágenes ilustrativas y recursos de crawler/health.

ASTRO_BUILD=PASS — sitio estático, sitemap e imágenes optimizadas.

DOCKER_BUILD=PASS — Dockerfile existente; imagen local zira-web:web02-review.

Digest del build: sha256:4464d76b20990f9c28440c7ee0f36a5b362fc05643d33ec3e74a7ae2ebf776cd.

git diff --check=PASS. Las pruebas requirieron ejecución fuera del sandbox tras un error local de permisos de creación de procesos; el reintento pasó. La generación de la comparación produjo un aviso de caché de fuentes no escribible, pero generó el PNG correctamente y se inspeccionó visualmente.

No se midieron Core Web Vitals ni puntuaciones Lighthouse. Las mejoras verificadas son build estático, imágenes responsive optimizadas, carga diferida y ausencia de peticiones externas de imágenes/fuentes.

## Comparación visual y límites

VISUAL_DIFFERENCES=Composición general preservada; diferencias documentadas para aprobación humana.

- Fotografías ilustrativas propias en lugar de las imágenes exactas de la referencia; encuadres y alturas varían.
- Marca tipográfica y símbolo de vivienda provisionales; pendiente un logotipo oficial.
- Beneficios neutros en lugar de experiencia, clientes o premios sin verificar.
- Galería titulada Imagine the Possibilities y etiquetada como inspiración; no se atribuyen proyectos a ciudades ni a la empresa.
- Panel final con mapa esquemático y fondo azul sólido, sin reproducir la fotografía de skyline. El mapa se identifica como esquemático y no a escala.
- Contacto pendiente claramente indicado en lugar de los datos de ejemplo de la captura.
- En móvil se apilan contenido e imagen, y las tarjetas quedan en una columna para conservar legibilidad.

Se corrigieron únicamente defectos observados: overflow del header móvil, salto excesivo del título desktop y contraste del dorado sobre azul/fondo móvil. No se realizaron iteraciones de rediseño posteriores.

## Archivos y protección del alcance

MODIFIED_FILES=

- Validation/site.test.mjs
- web/src/components/Header.astro
- web/src/components/Services.astro
- web/src/components/Footer.astro
- web/src/layouts/BaseLayout.astro
- web/src/pages/index.astro
- web/src/styles/global.css

NEW_FILES=

- web/src/components/{Hero,About,Projects,ServiceAreas,Icon}.astro
- web/src/assets/images/{hero,kitchen,windows,roof,outdoor}.webp
- Validation/References/ZIRA_LIGHT_PREMIUM_V1.png
- Validation/Generated/ZiraWeb02/{desktop,tablet,mobile,mobile-430,comparison}.png
- Validation/Generated/ZiraWeb02/{responsive-metrics,contrast-metrics}.json
- Validation/ZIRA_WEB_02_ASSETS.md
- Validation/ZIRA_WEB_02_REPORT.md

Docker, Compose, Caddy, Cloudflare, DNS, GitHub Actions, AGENTS.md, package.json y package-lock.json: sin cambios. No se ejecutaron commits, pushes, despliegues ni comandos remotos. El contenedor existente en 127.0.0.1:38081 se dejó intacto; el preview de esta propuesta usa un puerto independiente. TeamFHO, Cuban Domino Club y bases de datos no se tocaron.

BLOCKERS=Ninguno para revisión visual local. Pendientes para una publicación completa: aprobación visual, logotipo oficial, canales de contacto reales y fotografías de proyectos verificadas. La recepción de estimaciones permanece sin habilitar.

NEXT=Revisar las capturas y aprobar o indicar ajustes concretos. Cualquier commit, push o despliegue requiere autorización explícita posterior.
