/*
  Datos de esta invitación.
  Para crear otra invitación basta con cambiar este archivo
  (y las fotos / textos propios que haya en index.html).
*/
window.INVITE = {
  bride: 'Novia',
  groom: 'Novio',
  initials: 'N + N',

  // Fecha y hora de la ceremonia (con zona horaria) y duración total de la fiesta.
  eventStart: '2026-12-31T17:00:00-04:00',
  durationHours: 7,
  timeZone: 'America/La_Paz',

  city: 'La Paz · Bolivia',
  calendarLocation: 'La Paz, Bolivia',

  ceremonyTime: '17:00',
  receptionTime: '19:00',
  zoomTime: '17:00 · hora de Bolivia',

  // Número con código de país y sin "+", por ejemplo '59171234567'.
  // Si se deja vacío, la confirmación solo se muestra en pantalla.
  whatsapp: '',

  // Conexión con JotaPG: de dónde sale la lista de invitados, a dónde se envían
  // las confirmaciones y a qué invitación pertenecen. La lista de invitados vive
  // en JotaPG (no en este archivo), así nadie puede verla desde la página.
  lookupUrl: 'https://jotapg.pages.dev/api/guest-lookup',
  rsvpUrl: 'https://jotapg.pages.dev/api/rsvp',
  inviteId: 'muestra-3'
};
