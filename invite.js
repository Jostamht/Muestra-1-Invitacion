/*
  Datos de esta invitación.

  TODO lo que cambia de una boda a otra está en este archivo: nombres, fecha,
  lugares, familias, cronograma, fotos, Zoom, y la conexión con JotaPG.
  Para crear otra invitación basta con copiar el proyecto y cambiar este archivo
  (y poner las fotos de la pareja en la carpeta "fotos/").

  Después de cambiarlo, corre:  node tools/sincronizar.mjs
  Eso actualiza la vista previa que sale al compartir el enlace (WhatsApp, etc.)
  y avisa si quedó algún dato de ejemplo sin cambiar.
*/
window.INVITE = {
  /* ---------- 1. Pareja y fecha ---------- */
  bride: 'Novia',
  groom: 'Novio',
  initials: 'N + N',

  // Fecha y hora de la ceremonia (con zona horaria) y duración total de la fiesta.
  // Pasadas esas horas la invitación cierra la confirmación y cambia la cuenta regresiva por un mensaje de gracias.
  eventStart: '2026-12-31T17:00:00-04:00',
  durationHours: 7,
  timeZone: 'America/La_Paz',

  city: 'La Paz · Bolivia',
  calendarLocation: 'La Paz, Bolivia',

  ceremonyTime: '17:00',
  receptionTime: '19:00',
  zoomTime: '17:00 · hora de Bolivia',

  /* ---------- 2. Textos de bienvenida ---------- */
  heroNote: 'Nos casamos. Nos encantará que seas parte de este día inolvidable.',
  introCopy: 'Hay días que merecen guardarse para siempre. Con la alegría de nuestras familias, queremos compartir contigo el comienzo de nuestra nueva historia.',
  dayMeta: 'Dos momentos muy especiales',

  /* ---------- 3. Familias ---------- */
  families: {
    bride: { title: 'Padres de la novia', lines: ['Padre de la novia', 'Madre de la novia'] },
    groom: { title: 'Padres del novio', lines: ['Padre del novio', 'Madre del novio'] }
  },

  /* ---------- 4. Lugares ----------
     show: false  -> oculta ese lugar (por ejemplo, si todo es en un solo sitio).
     mapUrl       -> enlace de Google Maps.
     mapImage     -> (opcional) imagen del mapa, por ejemplo 'fotos/mapa-ceremonia.jpg'. */
  ceremony: {
    show: true,
    title: 'Ceremonia religiosa',
    place: 'Iglesia de Ejemplo',
    address: 'Av. Ejemplo 123, La Paz',
    mapUrl: 'https://maps.google.com',
    mapText: 'Ver en el mapa',
    mapImage: ''
  },
  reception: {
    show: true,
    title: 'Recepción',
    place: 'Salón de Ejemplo',
    address: 'Calle Ejemplo 456, La Paz',
    mapUrl: 'https://maps.google.com',
    mapText: 'Ver en el mapa',
    mapImage: ''
  },

  /* ---------- 5. Vestimenta ---------- */
  dress: {
    title: 'Formal',
    text: 'Elige un atuendo con el que te sientas cómodo y elegante.',
    women: 'Vestido largo o de cóctel elegante.',
    men: 'Traje formal con camisa y corbata.'
  },

  /* ---------- 6. Cronograma ----------
     Una línea por momento, en orden. Los íconos se ponen solos
     (si quieres uno propio, agrega icon: '♥'). */
  schedule: [
    { time: '19:30', text: 'Entrada de los novios' },
    { time: '20:00', text: 'Vals' },
    { time: '20:30', text: 'Cena' },
    { time: '21:30', text: 'Corte de torta' },
    { time: '23:30', text: 'Despedida' }
  ],

  /* ---------- 7. Fotos ----------
     Rutas dentro del proyecto (por ejemplo 'fotos/portada.jpg') o enlaces.
     La galería usa exactamente 6 fotos. */
  photos: {
    hero: {
      src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1500&q=90&sat=-100',
      alt: 'Pareja de boda tomada de las manos'
    },
    intro: {
      src: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1000&q=85&sat=-100',
      alt: 'Ramo de flores blancas'
    },
    ceremony: {
      src: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1000&q=85&sat=-100',
      alt: 'Espacio reservado para fotografía de la ceremonia'
    },
    reception: {
      src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85&sat=-100',
      alt: 'Espacio reservado para fotografía de la recepción'
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Pareja abrazada durante su boda' },
      { src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Detalle de manos con anillos' },
      { src: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Manos de una pareja con flores' },
      { src: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Flores claras para la celebración' },
      { src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Mesa para una celebración' },
      { src: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=85&sat=-100', alt: 'Detalle de celebración nocturna' }
    ]
  },

  /* ---------- 8. Regalo y Zoom ----------
     show: false  -> oculta esa tarjeta.
     qrImage      -> (opcional) foto del código QR, por ejemplo 'fotos/qr.png'. */
  gift: {
    show: true,
    text: 'Si deseas hacernos llegar un detalle, aquí podrás encontrar un código QR para hacerlo.',
    qrImage: ''
  },
  zoom: {
    show: true,
    id: '123 456 7890',
    password: 'ejemplo'
  },

  /* ---------- 9. Vista previa al compartir el enlace ----------
     Lo lee tools/sincronizar.mjs para escribir las etiquetas del <head>
     (WhatsApp y otras apps leen esas etiquetas sin ejecutar la página).
     siteUrl: la dirección final de esta invitación, con https y una barra al final.
     image:   foto grande para la vista previa (ruta o enlace). */
  share: {
    siteUrl: 'https://muestra-1-invitacion.pages.dev/',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&h=630&q=85&sat=-100',
    imageAlt: 'Una pareja celebrando su boda en blanco y negro',
    description: 'Tu presencia hará este día inolvidable.'
  },

  /* ---------- 10. Crédito de JotaPG ----------
     Línea pequeña al final de la invitación. show: false la oculta. */
  credit: {
    show: true,
    text: 'Invitación creada con JotaPG',
    url: 'https://jotapg.pages.dev'
  },

  /* ---------- 11. Conexión con JotaPG ----------
     De dónde sale la lista de invitados, a dónde se envían las confirmaciones
     y a qué invitación pertenecen. La lista vive en JotaPG (no en este archivo),
     así nadie puede verla desde la página.
     Estas 3 líneas las entrega /admin al crear la boda. */
  lookupUrl: 'https://jotapg.pages.dev/api/guest-lookup',
  rsvpUrl: 'https://jotapg.pages.dev/api/rsvp',
  inviteId: 'muestra-3',

  // Protección contra spam (Cloudflare Turnstile). Es la clave PÚBLICA del widget; es la misma
  // para todas las invitaciones. No la borres: JotaPG siempre exige la verificación al confirmar,
  // así que sin ella nadie podría confirmar. Cada invitación nueva también hay que agregarla
  // (su dirección, sin https) a la lista de Turnstile en Cloudflare; /admin te la muestra.
  turnstileSiteKey: '0x4AAAAAAGK7zI2py3imlYle',

  /* ==========================================================================
     DEMO — SOLO PARA LA INVITACIÓN DE EJEMPLO.
     BORRAR ESTE BLOQUE COMPLETO (hasta la línea de cierre) AL HACER UNA
     INVITACIÓN REAL. Si queda, aparece una caja con esta pista encima del
     formulario de confirmación. tools/sincronizar.mjs avisa si sigue aquí.
     ========================================================================== */
  // Primera línea = título; cada línea siguiente = «Nombre · celular».
  demoHint: 'Invitación de ejemplo. Para probar la confirmación usa uno de estos invitados:\nInvitado 1 · 77717771\nInvitado 2 · 77727772\nInvitado 3 · 77737773',
  // Solo la muestra puede aparecer en Google. Al borrar este bloque (boda real), la invitación queda
  // oculta para los buscadores sin que tengas que hacer nada más (tools/sincronizar.mjs pone la etiqueta).
  demoIndexable: true,
  // Código del link personal de «Invitado 1» (los 16 caracteres que van después de ?g= en su link).
  // Con él aparece el interruptor «Ver cómo lo ve el invitado». Se copia desde el panel de JotaPG
  // (botón «Copiar link» de Invitado 1). Si queda vacío, el interruptor no aparece.
  demoPersonalCode: ''
  /* ===================== FIN DEL BLOQUE DEMO ===================== */
};
