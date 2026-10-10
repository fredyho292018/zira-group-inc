# ZIRA-CONTACT-01 — Professional contact & estimate form

Fecha: 2026-10-10. Base visual: Light Premium V1 aprobado. Implementación local, sin activar recepción de solicitudes.

Actualización solicitada por el usuario: campos editables para prueba local. El botón de preview es type=button y solo muestra «Sending is disabled. Nothing has been sent.»; también se bloquea el evento submit antes de cualquier validación o petición de red. No se carga Turnstile. Consentimiento permanece deshabilitado hasta configurar la política y recepción reales. El build y Astro check posteriores al ajuste pasaron; las capturas originales de esta fase muestran el estado previo, totalmente bloqueado. Captura actual: Generated/ZiraContact01/editable-preview.png. Las referencias al fieldset bloqueado más abajo corresponden a la validación inicial; actualmente los seis campos se pueden editar, manteniendo cerrados ambos gates de envío.

ZIRA_CONTACT_01=READY_FOR_INTEGRATION

UI_STATUS=PASS

VALIDATION_STATUS=PASS

TURNSTILE_STATUS=PREPARED_NOT_CONFIGURED — render explícito y verificación server-side, hostname y action; pruebas con respuestas simuladas. Ningún widget real creado, ninguna clave real configurada.

API_STATUS=IMPLEMENTED_LOCALLY_NOT_DEPLOYED — contrato POST /api/contact y Worker preparado; integración de ruta y runtime Cloudflare pendientes.

EMAIL_PROVIDER_STATUS=PENDING_SELECTION_AND_CONFIGURATION — adaptador candidato Resend preparado, gate bloqueado con EMAIL_PROVIDER=unselected; destinatario y remitente reales sin definir.

TESTS=PASS — 28 pruebas automatizadas, 0 fallos; escenarios del cliente comprobados en navegador local con mocks.

RESPONSIVE=PASS — desktop, tablet y dos tamaños móviles sin overflow horizontal.

SECURITY_CONTRACT=DEFINED

REAL_EMAIL_DELIVERY=PENDING_CONFIGURATION

PRODUCTION_DEPLOY=NOT_AUTHORIZED

BASE_SHA=df866b8517dcdce2802341c418a419980268e30b

FINAL_SHA=df866b8517dcdce2802341c418a419980268e30b — HEAD intacto, trabajo local sin commit. Los cambios visuales de ZIRA-WEB-02 ya estaban presentes y se conservaron.

## Interfaz y estados

Componente: web/src/components/ContactEstimateForm.astro. Mantiene navy, gold, white y light background del tema, sin rediseñar las demás secciones. Se añade después de ServiceAreas; los CTA existentes siguen apuntando a #contact y el panel previo enlaza al formulario.

Campos obligatorios: Full Name, Email Address, Phone Number, Service Needed, Project City y Project Description. Incluye los seis servicios solicitados y Other, consentimiento explícito y vínculo de privacidad condicionado a una URL real configurada. No se publica un vínculo de ejemplo ni una política ficticia.

Actualmente todo el fieldset está deshabilitado, con un aviso que pide no introducir datos personales. No se carga Turnstile ni se llama al endpoint en la vista normal. La política real y la integración deben configurarse y autorizarse antes de activar los gates de cliente y servidor. El formulario tiene method=post y action=/api/contact para evitar que un fallo de JavaScript convierta datos personales en parámetros GET; el endpoint requiere JSON y verificación server-side.

IDLE, VALIDATING, SUBMITTING, SUCCESS y ERROR están implementados. Errores vinculados a los campos, aria-invalid, foco en el primer error, estado anunciado mediante live region, aria-busy y controles deshabilitados durante el envío. El cliente exige HTTP 200, ok=true y el requestId correspondiente antes de mostrar SUCCESS. Mensajes de respuesta o datos del usuario nunca se insertan como HTML.

Validadores compartidos en web/src/lib/contact.ts; interacción en contact-client.ts. El servidor aplica validación independientemente del navegador.

## Seguridad y contrato

Contrato y configuración completos: [contact-worker/README.md](../contact-worker/README.md).

- Validación de campos, tipos y consentimiento; normalización Unicode, límites de longitud y rechazo de caracteres de control/inyección de cabeceras.
- Tamaño real del JSON limitado a 16 KiB; descripción de 20 a 3,000 caracteres.
- Origen HTTPS exacto y contenido JSON obligatorios; sin CORS abierto ni secretos en el frontend.
- Verificación Turnstile server-side, con host/action esperados y timeout.
- Límite persistente de cinco intentos estructuralmente válidos por IP protegida con HMAC cada diez minutos; desafío inválido cuenta como intento.
- Durable Object SQLite con transacciones para coordinación y protección contra duplicados concurrentes. Recibos por UUID/fingerprint, retención de 24 horas y limpieza mediante alarmas.
- El remitente es configurado y verificado; Reply-To usa el correo validado del cliente. Notificación de texto con los seis datos, consentimiento y fecha/hora UTC.
- Sin logs de datos personales; storage contiene hashes con clave, estados, contadores y expiraciones, sin cuerpo del mensaje ni datos de contacto. Observabilidad del Worker desactivada en configuración propuesta.
- Gate del servidor exige configuración completa y habilitación explícita. Sin llamadas reales de correo durante las pruebas.

La aceptación del proveedor no prueba llegada al buzón. Fallos ambiguos y solicitudes pendientes después de un crash requieren reconciliación; no hay reenvío automático. La deduplicación es por clave y dura 24 horas; refrescar el navegador o cambiar datos puede generar una nueva clave. Runtime Durable Objects, cuotas, WAF y políticas de registros de la cuenta deben verificarse en staging antes de activar.

## Evidencia de validación

ASTRO_CHECK=PASS — 15 archivos, 0 errores, 0 advertencias, 0 hints.

WORKER_TYPES=PASS — TypeScript strict, sin errores.

ASTRO_BUILD=PASS — sitio estático e imágenes existentes conservadas.

DOCKER_BUILD=PASS — imagen local zira-web:contact01-review, Dockerfile existente sin modificaciones. Digest sha256:f493630e31c07e17dd229fb78b4b4532ffd112edd9a8010643a166ed3e52994a. No se inició ni desplegó esta imagen.

INFRA_VALIDATION=PASS — invariantes de aislamiento y sintaxis YAML. Compose config PASS usando únicamente un valor de imagen SHA para la interpolación; no se ejecutó up/down.

Pruebas automatizadas cubren: obligatoriedad, email/teléfono inválidos, mensaje largo/corto, consentimiento ausente o mal tipado, servicio desconocido, normalización Unicode, inyección de cabeceras, Turnstile inválido/host/action incorrectos, rate limiting, éxito simulado, duplicados secuenciales y concurrentes, conflicto de clave, rechazo del proveedor, timeout ambiguo, respuesta sin recibo, gate deshabilitado, origen/tipo de contenido, tamaño real, JSON inválido y limpieza de registros expirados. Las llamadas externas se sustituyen por mocks; las direcciones de prueba usan example.test.

Pruebas del cliente en una página QA separada, solo loopback: siete errores al enviar vacío y foco en fullName; email y teléfono con errores específicos; fallo del proveedor mantiene ERROR; 200 sin confirmación mantiene ERROR; envío diferido muestra SUBMITTING y deshabilita el botón; recibo simulado correcto muestra SUCCESS y mantiene envío deshabilitado. [Registro](Generated/ZiraContact01/browser-tests.json). La página QA se cerró y su servidor se detuvo al terminar. No se expone esa simulación en la vista normal.

Windows bloqueó inicialmente procesos de pruebas y el lock de Docker en el sandbox; los reintentos autorizados pasaron. Compose requirió ZIRA_IMAGE para interpolar su configuración, luego pasó. No quedan fallos de build o pruebas.

| Viewport | Ancho visible / contenido | Columnas de campos | Etiquetas ausentes |
| --- | --- | --- | --- |
| 1440 × 900 | 1425 / 1425 | 2 | 0 |
| 768 × 1024 | 753 / 753 | 2 | 0 |
| 393 × 852 | 378 / 378 | 1 | 0 |
| 430 × 932 | 415 / 415 | 1 | 0 |

Capturas de la vista normal deshabilitada: [desktop](Generated/ZiraContact01/desktop.png) y [mobile](Generated/ZiraContact01/mobile.png). La captura móvil muestra la sección completa recortada de una captura de página completa. [Métricas](Generated/ZiraContact01/responsive-metrics.json). Se verificaron etiquetas y descripciones, teclado, live region, foco y contraste usando los tokens aprobados; no es una certificación WCAG completa.

Preview normal: http://127.0.0.1:4322/#contact

## Cambios de esta fase

Nuevos: ContactEstimateForm.astro; contact.ts; contact-client.ts; web/contact-config.example.env; contact-worker/src/worker.ts; contact-worker/tsconfig.json; contact-worker/wrangler.jsonc; contact-worker/README.md; Validation/contact.test.mjs; Validation/contact-browser-fixture.mjs; capturas y métricas en Validation/Generated/ZiraContact01; este informe.

Actualizados para integrar el contacto: web/src/pages/index.astro, web/src/components/ServiceAreas.astro, web/src/styles/global.css y Validation/site.test.mjs. Se mantiene el resto del trabajo visual anterior. No se añadieron dependencias ni se cambió el lockfile.

Infra, Docker, Caddy, Compose, GitHub Actions, AGENTS.md y dependencias: sin cambios. Cloudflare Tunnel, DNS, MX/SPF, servidores, contenedores existentes y bases de datos: no tocados. Ningún commit, push, despliegue ni envío real de correo.

BLOCKERS=Política de privacidad real revisada/publicada; elección del proveedor; destinatario confirmado; remitente verificado; secretos del Worker; widget Turnstile; validación de Wrangler/runtime y staging; ruta API autorizada; mecanismo de variables públicas para el build y autorización independiente de despliegue/activación. No bloquean la revisión local de la interfaz y contrato.

NEXT=Revisar UI y contrato, aportar/configurar los datos pendientes y validar en staging con autorización. Mantener envíos reales desactivados hasta entonces.
