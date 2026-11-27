# Plantilla de invitación de boda

Invitación web de boda con sobre animado, música, cuenta regresiva, cronograma y confirmación de
asistencia en línea. Es la plantilla base de JotaPG: cada boda nueva es una copia de este proyecto
con otros datos.

La confirmación de asistencia y la lista de invitados viven en [JotaPG](https://github.com/Jostamht/JotaPG),
no aquí. La invitación solo le pregunta a JotaPG quién es el invitado y le envía su respuesta.

## Todo lo que cambia está en `invite.js`

Nombres, fecha, lugares, familias, cronograma, vestimenta, fotos, regalo, Zoom, vista previa al
compartir y la conexión con JotaPG. `index.html` y `app.js` no se tocan para una boda nueva.

```
invite.js              Los datos de la boda (lo único que se cambia)
index.html             La estructura de la página (igual para todas las bodas)
app.js                 Arma la página con los datos de invite.js
styles.css             Diseño
fotos/                 Fotos de la pareja (en la plantilla se usan fotos de ejemplo de Unsplash)
audio/wedding.mp3      Música de fondo
fonts/                 Tipografías
tools/sincronizar.mjs  Actualiza la vista previa al compartir y avisa de lo que falta o quedó de ejemplo
```

## Hacer una invitación nueva

1. **Crear la boda en JotaPG.** Entrar a `jotapg.pages.dev/login` con la clave de administrador y, en
   `/admin`, usar **Nueva boda**: nombres de la pareja, dirección que tendrá su invitación
   (por ejemplo `https://juancarla.pages.dev`) y, si ya se sabe, fecha y hora. Salen tres líneas
   (`lookupUrl`, `rsvpUrl`, `inviteId`) y el mensaje para la pareja con su código.
2. **Copiar este proyecto** a un repositorio nuevo con el nombre de la pareja.
3. **Cambiar `invite.js`:** los datos de la boda y las 3 líneas de JotaPG (sección 11).
   La dirección de `share.siteUrl` debe ser la misma que se puso en `/admin`.
   **Borrar el bloque DEMO** del final de `invite.js` (la pista «Invitación de ejemplo. Prueba con…»).
   La línea «Invitación creada con JotaPG» (sección 10) puede quedarse o apagarse con `show: false`.
4. **Fotos:** subir las de la pareja a `fotos/` y ponerlas en la sección `photos` de `invite.js`
   (portada, bienvenida, ceremonia, recepción y exactamente 6 para la galería).
   Si hay código QR para regalos o imagen de mapa, también van en `fotos/`.
5. **Música:** si la pareja tiene su canción, reemplazar `audio/wedding.mp3` (mismo nombre).
6. **Correr** `node tools/sincronizar.mjs`. Actualiza la vista previa que sale al compartir el enlace
   en WhatsApp y lista lo que todavía tiene datos de ejemplo o algo que haría fallar la invitación:
   el ID de Zoom de ejemplo, una fecha sin zona horaria, una galería que no tiene exactamente 6 fotos,
   archivos de `fotos/` que no existen (ojo con mayúsculas y minúsculas), una dirección `siteUrl` sin `https://`
   o sin la barra final, y la clave de Turnstile vacía. No debe quedar ningún aviso.
   Si la fecha (`eventStart`) falta o no es una fecha real (por ejemplo 30 de febrero), sale un ERROR, el programa
   se detiene y no cambia nada: se corrige `invite.js` y se vuelve a correr.
   También pone la etiqueta `noindex` para que Google no muestre la invitación en sus resultados (lleva
   direcciones y la clave de Zoom). Solo la muestra sale en Google, y eso lo decide `demoIndexable` dentro del
   bloque DEMO: al borrar el bloque, la invitación queda oculta sola. Esto no es una contraseña: quien tenga
   el enlace sí puede abrirla.
7. **Probar** abriendo `index.html` desde un servidor local (`python3 -m http.server`), tocando el sello
   y revisando todas las secciones, en computadora y en celular.
8. **Publicar:** conectar el repositorio nuevo a Cloudflare Pages (sin comando de build, carpeta de salida
   la raíz `/`). Revisar en **Deployments** que aparezca el commit nuevo.
   Después, agregar la dirección de la invitación (sin `https://`) a la lista de Turnstile en Cloudflare
   (Turnstile → el widget → Hostname Management); `/admin` de JotaPG la muestra lista para copiar. Sin esto
   nadie puede confirmar.
9. **Probar la confirmación:** en `/admin` agregar un invitado de prueba, confirmar desde la invitación
   con su nombre y celular completo, y ver la respuesta en el panel. Borrar el invitado de prueba.
10. **Entregar:** en `/admin`, **Copiar mensaje para la pareja** y enviarlo por privado.

## Qué dejar fuera o apagar

- La pista de demostración: borrar el bloque `DEMO` de `invite.js` (o dejar `demoHint` vacío).
- El crédito de JotaPG al final: `credit.show: false`.
- Un lugar que no existe (por ejemplo, ceremonia y recepción en el mismo sitio): `show: false` en `ceremony`
  o `reception`.
- Sin Zoom o sin regalo: `show: false` en `zoom` o `gift`.
- Sin cronograma: `schedule: []` oculta la sección.

## Cosas a tener en cuenta

- La invitación está bloqueada (`inert`) hasta que el invitado toca el sello; las pruebas automáticas
  deben abrirla primero.
- Cloudflare Pages: después de subir un cambio, revisar que Deployments muestre el commit NUEVO.
  «Retry deployment» vuelve a construir el commit viejo.
- La vista previa al compartir (título, descripción, foto) la leen las apps sin ejecutar la página,
  por eso la escribe `tools/sincronizar.mjs` dentro de `index.html`. Si se cambia algo de `invite.js`,
  se vuelve a correr.
- Las fotos de ejemplo son de Unsplash. En una boda real se reemplazan todas.
- El día de la boda la cuenta regresiva se cambia por «¡Hoy es el gran día!», y cuando pasan las horas de
  `durationHours` desde `eventStart` se cierra la confirmación y aparece un mensaje de gracias. Por eso la
  fecha y la duración de `invite.js` tienen que ser las reales. La invitación de ejemplo también se cierra
  después de su fecha: hay que correrla a una fecha futura antes de que llegue.
- **Link personal.** Si en `/admin` la boda se configura para confirmar con link personal (o «las dos formas»),
  cada invitado recibe un link como `https://tu-invitacion.pages.dev/?g=0123456789abcdef`. Al abrirlo, la
  invitación lo saluda por su nombre, ya trae sus pases y no le pide nombre ni celular. Justo después de la
  portada de los novios aparece un recibimiento con su nombre bien grande («Esta invitación es para…»), cuántos pases
  tiene y un botón que lleva a confirmar; al final de la invitación responde si irá o no y con cuántos pases. No hay que tocar
  `invite.js` para esto: el código del link lo reconoce JotaPG. Si el link está mal escrito, la invitación avisa
  que no es válido. Sin `?g=` todo funciona como antes (el invitado escribe su nombre y celular).

## La invitación de ejemplo

Esta copia es la invitación de ejemplo (`muestra-3` en JotaPG). Para que quien la vea pueda probar la
confirmación, en `/admin` la boda `muestra-3` tiene invitados de muestra: `Invitado 1` (77717771),
`Invitado 2` (77727772) e `Invitado 3` (77737773). La pista que los muestra es el bloque DEMO
de `invite.js`; si cambias los invitados en `/admin`, cambia también esa pista.

La invitación de ejemplo también tiene el interruptor «Ver cómo lo ve el invitado» (escribe nombre y celular /
con link personal) para mostrar las dos formas. Aparece cuando en el bloque DEMO de `invite.js` se pega el
código de `Invitado 1` en `demoPersonalCode` (los 16 caracteres que van después de `?g=` en su link, que se
copia desde el panel de JotaPG). Para que funcione, en `/admin` la boda `muestra-3` debe estar en «Las dos
formas». Como todo el bloque DEMO se borra en una boda real, el interruptor tampoco aparece ahí.
