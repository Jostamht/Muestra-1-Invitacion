const $ = (id) => document.getElementById(id);
const I = window.INVITE || {};

/* ---------- Datos de la invitación (invite.js) ---------- */
const eventDate = new Date(I.eventStart || '2026-12-31T17:00:00-04:00');
const eventEnd = new Date(eventDate.getTime() + (I.durationHours || 7) * 3600000);
// En qué momento está la boda: antes de empezar, durante, o ya pasó (después de la duración indicada en invite.js).
function weddingPhase() {
  const now = Date.now();
  return now < eventDate.getTime() ? 'before' : now < eventEnd.getTime() ? 'during' : 'after';
}

/* ---------- Secciones que se arman con los datos de invite.js ---------- */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') node.setAttribute(k, v); });
  children.forEach((c) => node.append(c));
  return node;
}
function lines(list) {
  const out = [];
  (list || []).forEach((text, i) => { if (i) out.push(el('br')); out.push(text); });
  return out;
}
function photoAt(path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), (I.photos || {}));
}
// Íconos de línea para el cronograma. Se eligen por palabras del texto (ceremonia, vals, cena, torta…)
// o con icon: 'nombre' en invite.js. Nombres: anillos, corazon, musica, cena, torta, brindis, foto, luna, brillo.
const ICON_PATHS = {
  anillos: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M12 3.5l1.6 2.2L12 8 10.4 5.7z"/>',
  corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  musica: '<circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="M9 18V6l10-2v12"/>',
  cena: '<path d="M5 3v6a2 2 0 0 0 4 0V3M7 3v18"/><path d="M17 21V3c-2 1.5-3 4-3 7 0 1.5 1 2.5 3 2.5"/>',
  torta: '<path d="M4 20h16M5 20v-7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v7"/><path d="M5 16c2 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3 1.5 4 0"/><path d="M12 12V9M12 7c-1-1-1-2 0-3 1 1 1 2 0 3z"/>',
  brindis: '<path d="M5 4h6l-.6 5.5a2.4 2.4 0 0 1-4.8 0zM8 12v7M5.5 19h5"/><path d="M13 4h6l-.6 5.5a2.4 2.4 0 0 1-4.8 0zM16 12v7M13.5 19h5"/>',
  foto: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3"/>',
  luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  brillo: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>'
};
const ICON_RULES = [
  [/ceremonia|iglesia|religios|civil|anillos/, 'anillos'],
  [/brindis/, 'brindis'],
  [/torta|pastel/, 'torta'],
  [/cena|comida|almuerzo|banquete|buffet|cocktel|coctel|aperitivo/, 'cena'],
  [/vals|baile|musica|fiesta|dj|banda|pista/, 'musica'],
  [/foto/, 'foto'],
  [/entrada|llegada|recepcion|bienvenida|novios/, 'corazon'],
  [/despedida|cierre|final|fin\b|salida/, 'luna']
];
const ICON_ORDER = ['corazon', 'musica', 'cena', 'torta', 'luna'];
function iconNode(item, i) {
  const node = el('i', { 'aria-hidden': 'true' });
  node.innerHTML = scheduleIcon(item, i); // SVG propio, sin datos externos
  return node;
}
function scheduleIcon(item, i) {
  const text = String(item.text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const name = ICON_PATHS[item.icon] ? item.icon
    : (ICON_RULES.find(([re]) => re.test(text)) || [])[1] || ICON_ORDER[i % ICON_ORDER.length];
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}
const FAMILY_ICONS = { bride: '\u265D', groom: '\u265C' };

function renderSections() {
  // Fotos: cada <img data-photo="..."> toma su ruta y descripción de I.photos
  document.querySelectorAll('img[data-photo]').forEach((img) => {
    const photo = photoAt(img.dataset.photo);
    if (!photo || !photo.src) return;
    img.src = photo.src;
    img.alt = photo.alt || '';
  });

  // Familias
  const familyGrid = $('familyGrid');
  if (familyGrid && I.families) {
    familyGrid.replaceChildren(...['bride', 'groom'].filter((k) => I.families[k]).map((k) => el('article', { class: 'reveal' },
      el('span', { class: 'family-icon', 'aria-hidden': 'true' }, FAMILY_ICONS[k]),
      el('h3', {}, I.families[k].title),
      el('p', {}, ...lines(I.families[k].lines)))));
  }

  // Ceremonia y recepción
  const eventList = $('eventList');
  if (eventList) {
    const events = [['ceremony', 'ceremonyTime'], ['reception', 'receptionTime']]
      .filter(([key]) => I[key] && I[key].show !== false);
    eventList.replaceChildren(...events.map(([key, timeKey]) => {
      const e = I[key];
      const photo = (I.photos || {})[key] || {};
      const mapAttrs = { href: e.mapUrl || 'https://maps.google.com', target: '_blank', rel: 'noreferrer' };
      const map = e.mapImage
        ? el('a', { class: 'event-map', ...mapAttrs }, el('img', { src: e.mapImage, alt: `Mapa de ${e.place}`, loading: 'lazy', style: 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover' }))
        : el('a', { class: 'event-map', ...mapAttrs }, el('span', {}, e.mapText || 'Ver en el mapa'));
      return el('article', { class: 'event reveal' },
        el('figure', { class: 'venue-photo' }, el('img', { loading: 'lazy', decoding: 'async', src: photo.src, alt: photo.alt || '' })),
        el('p', { class: 'event-time' }, I[timeKey] || ''),
        el('div', {}, el('h3', {}, e.title), el('p', {}, e.place, el('br'), e.address),
          el('a', mapAttrs, 'Abrir ubicación')),
        map);
    }));
    const day = document.getElementById('dia');
    if (day && !events.length) day.hidden = true;
  }

  // Cronograma
  const scheduleList = $('scheduleList');
  if (scheduleList && I.schedule) {
    scheduleList.replaceChildren(...I.schedule.map((item, i) => el('li', { class: 'reveal' },
      iconNode(item, i),
      el('span', {}, el('time', {}, item.time), ` ${item.text}`))));
    const section = scheduleList.closest('section');
    if (section && !I.schedule.length) section.hidden = true;
  }

  // Línea de crédito al final (JotaPG)
  const credit = $('creditLine');
  if (credit && I.credit && I.credit.show !== false) {
    credit.replaceChildren(`${I.credit.text || 'Invitación creada con JotaPG'} · `,
      el('a', { href: I.credit.url, target: '_blank', rel: 'noopener' }, (I.credit.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')));
    credit.hidden = false;
  }

  // Pista de demostración (solo en la invitación de ejemplo; ver sección DEMO de invite.js)
  const demoHint = $('demoHint');
  if (demoHint && I.demoHint) {
    const [title, ...rows] = I.demoHint.split('\n').map((line) => line.trim()).filter(Boolean);
    const heading = document.createElement('strong');
    heading.textContent = title;
    demoHint.replaceChildren(heading);
    if (rows.length) {
      const list = document.createElement('ul');
      rows.forEach((row) => {
        const [name, phone] = row.split(' · ');
        const item = document.createElement('li');
        const nameEl = document.createElement('span');
        nameEl.textContent = name;
        item.appendChild(nameEl);
        if (phone) {
          const phoneEl = document.createElement('b');
          phoneEl.textContent = phone;
          item.appendChild(phoneEl);
        }
        list.appendChild(item);
      });
      demoHint.appendChild(list);
    }
    demoHint.hidden = false;
  }

  // Regalo y Zoom
  const giftOn = !I.gift || I.gift.show !== false;
  const zoomOn = !I.zoom || I.zoom.show !== false;
  if (!giftOn) $('giftCard').hidden = true;
  if (!zoomOn) $('zoomCard').hidden = true;
  const details = document.querySelector('.details');
  if (details && (!giftOn || !zoomOn)) {
    if (!giftOn && !zoomOn) details.hidden = true;
    else details.classList.add('is-single');
  }
  const qr = $('giftQr');
  if (qr && I.gift && I.gift.qrImage) {
    qr.replaceChildren(el('img', { src: I.gift.qrImage, alt: 'Código QR', style: 'width:100%;height:100%;object-fit:contain' }));
    qr.style.background = '#fff';
    qr.setAttribute('aria-label', 'Código QR');
  }
}

function applyInvitation() {
  if (!window.INVITE) return;
  const tz = I.timeZone || 'America/La_Paz';
  const part = (options, type) => new Intl.DateTimeFormat('es', { timeZone: tz, ...options })
    .formatToParts(eventDate).find((p) => p.type === type).value;
  const weekday = part({ weekday: 'long' }, 'weekday');
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const monthName = part({ month: 'long' }, 'month');
  const dayNumber = part({ day: 'numeric' }, 'day');
  const day = part({ day: '2-digit' }, 'day');
  const month = part({ month: '2-digit' }, 'month');
  const year = part({ year: 'numeric' }, 'year');
  const dateDay = `${dayNumber} de ${monthName} de ${year}`;

  const data = {
    ...I,
    day, month, year,
    yearShort: year.slice(-2),
    dateDay,
    dateShort: `${day} · ${month} · ${year}`,
    dateLabel: `${weekdayCap} · ${dayNumber} de ${monthName} · ${year}`,
    dateLong: `${weekdayCap}, ${dateDay}`,
    coupleUpper: `${I.bride} & ${I.groom}`.toUpperCase(),
    footerNote: `Gracias por ser parte de nuestra historia · ${dateDay}`,
    dressTitle: (I.dress || {}).title,
    dressText: (I.dress || {}).text,
    dressWomen: (I.dress || {}).women,
    dressMen: (I.dress || {}).men,
    giftText: (I.gift || {}).text,
    zoomId: (I.zoom || {}).id,
    zoomPassword: (I.zoom || {}).password
  };

  document.querySelectorAll('[data-bind]').forEach((el) => {
    const value = data[el.dataset.bind];
    if (value !== undefined) el.textContent = value;
  });
  document.querySelectorAll('[data-bind-label]').forEach((el) => {
    el.setAttribute('aria-label', data[el.dataset.bindLabel]);
  });
  document.querySelectorAll('[data-couple]').forEach((el) => {
    const amp = document.createElement('em');
    amp.textContent = '&';
    el.replaceChildren(I.bride, ' ', amp, ' ', I.groom);
  });

  renderSections();

  document.title = `${I.bride} & ${I.groom} — ${day}.${month}.${year}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `Invitación de boda de ${I.bride} y ${I.groom} — ${dateDay}.`;

  const stamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = eventEnd;
  const calendarLink = $('calendarLink');
  if (calendarLink) {
    calendarLink.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + `&text=${encodeURIComponent(`Boda de ${I.bride} y ${I.groom}`)}`
      + `&dates=${stamp(eventDate)}/${stamp(end)}`
      + `&details=${encodeURIComponent('Celebramos nuestra boda.')}`
      + `&location=${encodeURIComponent(I.calendarLocation || '')}`;
  }
}
applyInvitation();

/* ---------- Nombres largos: reducir la letra si no caben en una línea ---------- */
function fitText(el, available) {
  el.style.fontSize = '';
  if (!available || available <= 0) return;
  const needed = el.scrollWidth;
  if (needed > available) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(size * (available / needed) * 0.97)}px`;
  }
}
function fitNames() {
  const heroTitle = document.querySelector('.hero-copy h1');
  if (heroTitle) fitText(heroTitle, heroTitle.parentElement.clientWidth);
  const footerName = document.querySelector('.footer-name');
  if (footerName) fitText(footerName, footerName.parentElement.clientWidth - footerName.offsetLeft * 2);
}
fitNames();
window.addEventListener('resize', fitNames);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

/* ---------- Cuenta regresiva ---------- */
const units = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 };

// Cuando llega el día, la cuenta regresiva se cambia por un mensaje; cuando pasa la boda, además se cierra la confirmación.
let shownPhase = 'before';
function applyPhase(phase) {
  shownPhase = phase;
  if (phase === 'before') return;
  $('countdownSection').classList.add('is-over');
  document.querySelector('#countdownSection .timer').hidden = true;
  if (phase === 'during') {
    $('countMeta').textContent = 'Hoy es el día';
    $('count-title').textContent = '¡Hoy es el gran día!';
    return;
  }
  $('countMeta').textContent = 'Gracias por tanto cariño';
  $('count-title').textContent = 'Ya fue nuestro gran día';
  $('rsvpMeta').textContent = 'Gracias por todo';
  $('rsvp-title').textContent = '¡Gracias!';
  $('rsvpIntro').textContent = 'Ya pasó el gran día y las confirmaciones están cerradas. Gracias por acompañarnos y por todo su cariño.';
  $('rsvpForm').hidden = true;
}

function updateCountdown() {
  const phase = weddingPhase();
  if (phase !== shownPhase) applyPhase(phase);
  if (phase !== 'before') return;
  let remaining = Math.max(0, eventDate.getTime() - Date.now());
  Object.entries(units).forEach(([name, size]) => {
    const value = Math.floor(remaining / size);
    remaining %= size;
    $(name).textContent = String(value).padStart(2, '0');
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- Sobre y música ---------- */
const envelope = $('envelope');
const invitation = $('invitation');
const weddingMusic = $('weddingMusic');
const musicToggle = $('musicToggle');

function setMusicUI(playing) {
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.textContent = playing ? 'Pausar música' : 'Reproducir música';
  musicToggle.title = musicToggle.textContent;
}
weddingMusic.addEventListener('play', () => setMusicUI(true));
weddingMusic.addEventListener('pause', () => setMusicUI(false));

$('openInvitation').addEventListener('click', () => {
  // play() va directo en el clic para que iPhone/Safari lo permita
  weddingMusic.play().catch(() => {});
  envelope.classList.add('is-open'); // el sobre crece y se desvanece (ver CSS)
  invitation.removeAttribute('inert');
  document.body.classList.remove('is-locked');
  fitNames();
});

musicToggle.addEventListener('click', () => {
  if (weddingMusic.paused) weddingMusic.play().catch(() => {});
  else weddingMusic.pause();
});

/* ---------- Animaciones al hacer scroll ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const timeline = document.querySelector('.schedule-list');
const timelineItems = [...timeline.querySelectorAll('li')];
function updateTimeline() {
  const rect = timeline.getBoundingClientRect();
  const viewportLine = window.innerHeight * 0.67;
  const progress = Math.max(0, Math.min(1, (viewportLine - rect.top) / rect.height));
  timeline.style.setProperty('--timeline-progress', progress);
  timelineItems.forEach((item) => {
    item.classList.toggle('is-lit', item.getBoundingClientRect().top < viewportLine);
  });
}

/* ---------- Confirmación de asistencia ---------- */
const rsvpForm = $('rsvpForm');
const guestName = $('guestName');
const guestPasses = $('guestPasses');
const guestPhone = $('guestPhone');
const guestHint = $('guestHint');
const guestNote = $('guestNote');
const feedback = $('formFeedback');
const nameField = guestName.closest('label');
const phoneField = guestPhone.closest('label');

// Mensaje debajo del formulario. kind: 'error' (rojo), 'warn' (dorado), 'success' (verde) o '' (neutro).
function showFeedback(text, kind = '') {
  feedback.textContent = text;
  feedback.className = 'form-feedback' + (kind && text ? ` is-${kind}` : '');
  feedback.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

// Marca (o desmarca) que el nombre ya se encontró: la línea se llena, aparece una palomita y el saludo sube.
function setFound(found) {
  nameField.classList.toggle('is-found', found);
  guestHint.classList.toggle('is-found', found);
}

const passesText = (n) => `${n} pase${n === 1 ? '' : 's'}`;

// Invitado encontrado en la lista (la lista vive en JotaPG, no en esta página).
let currentGuest = null;
let lookupTimer = null;
let lookupRun = 0;

function resetPasses() {
  guestPasses.replaceChildren(new Option('Primero escribe tu nombre', ''));
  guestPasses.disabled = true;
}

// Pregunta a JotaPG quién es, por nombre ({ name }) o por el código del link personal ({ code }).
// Devuelve { found, name, passes, ambiguous } o null si falló la conexión.
async function lookupGuest(query) {
  try {
    const res = await fetch(I.lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: I.inviteId, ...query })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

guestName.addEventListener('input', () => {
  showFeedback('');
  currentGuest = null;
  setFound(false);
  resetPasses();
  clearTimeout(lookupTimer);
  lookupRun += 1;

  const typed = guestName.value.trim();
  if (typed.split(/\s+/).filter(Boolean).length < 2) {
    guestHint.textContent = '';
    return;
  }

  // Espera a que termine de escribir para no preguntar en cada letra.
  const run = lookupRun;
  lookupTimer = setTimeout(async () => {
    const result = await lookupGuest({ name: typed });
    if (run !== lookupRun) return; // siguió escribiendo: esta respuesta ya no sirve
    if (!result) {
      guestHint.textContent = 'No pudimos buscar tu nombre. Revisa tu conexión e inténtalo de nuevo.';
    } else if (result.found) {
      currentGuest = { name: result.name, passes: result.passes };
      const options = [];
      for (let n = result.passes; n >= 1; n -= 1) options.push(new Option(passesText(n), String(n)));
      options.push(new Option('No podré asistir', '0'));
      guestPasses.replaceChildren(...options);
      guestPasses.disabled = false;
      guestHint.textContent = `Hola, ${result.name}. Tienes ${passesText(result.passes)} disponibles.`;
      setFound(true);
    } else {
      guestHint.textContent = result.ambiguous
        ? 'Hay más de un invitado con ese nombre. Escríbelo completo como aparece en tu invitación.'
        : 'No encontramos ese nombre. Escríbelo como aparece en tu invitación.';
    }
  }, 350);
});

guestPhone.addEventListener('input', () => {
  // Se aceptan espacios, guiones y el +; el servidor se queda solo con los dígitos.
  guestPhone.value = guestPhone.value.replace(/[^\d+\s()-]/g, '');
});

/* ---------- Link personal (?g=código) ----------
   Cada invitado puede recibir su propio link: la invitación lo saluda por su nombre, ya trae sus pases
   y no le pide nombre ni celular. El código viaja en la dirección y JotaPG lo reconoce. */
const guestCodePattern = /^[0-9a-f]{16}$/i;
let personalCode = ''; // código del link personal activo; '' = el invitado escribe nombre y celular
let onModeChange = () => {};
const introDefault = $('rsvpIntro').textContent;

function setPersonalLayout(on) {
  if (weddingPhase() !== 'after') $('rsvpIntro').textContent = on ? 'Confirma tus pases.' : introDefault;
  nameField.hidden = on;
  phoneField.hidden = on;
  // Los campos escondidos no deben bloquear el envío del formulario.
  guestName.required = !on;
  guestPhone.required = !on;
  guestName.disabled = on;
  guestPhone.disabled = on;
  onModeChange();
}

function fillPasses(passes) {
  const options = [];
  for (let n = passes; n >= 1; n -= 1) options.push(new Option(passesText(n), String(n)));
  options.push(new Option('No podré asistir', '0'));
  guestPasses.replaceChildren(...options);
  guestPasses.disabled = false;
}

async function enterPersonal(code) {
  personalCode = code;
  lookupRun += 1;
  const run = lookupRun;
  clearTimeout(lookupTimer);
  currentGuest = null;
  setFound(false);
  resetPasses();
  showFeedback('');
  guestHint.textContent = 'Abriendo tu invitación personal…';
  onModeChange();
  const result = await lookupGuest({ code });
  if (run !== lookupRun) return; // cambió de modo mientras tanto
  if (result && result.found) {
    currentGuest = { name: result.name, passes: result.passes };
    fillPasses(result.passes);
    setPersonalLayout(true);
    guestHint.textContent = `Hola, ${result.name}. Tienes ${passesText(result.passes)} disponibles.`;
    setFound(true);
  } else {
    personalCode = '';
    setPersonalLayout(false);
    guestHint.textContent = result
      ? 'Este link no es válido. Pídeles a los novios que te lo envíen de nuevo.'
      : 'No pudimos abrir tu invitación personal. Revisa tu conexión y recarga la página.';
  }
}

function exitPersonal() {
  personalCode = '';
  lookupRun += 1;
  clearTimeout(lookupTimer);
  currentGuest = null;
  setFound(false);
  resetPasses();
  guestName.value = '';
  guestPhone.value = '';
  guestHint.textContent = '';
  showFeedback('');
  setPersonalLayout(false);
}

// Interruptor de la invitación de ejemplo (solo existe si el bloque DEMO de invite.js trae demoPersonalCode):
// deja ver las dos formas en que puede confirmar un invitado.
const demoSwitch = $('demoSwitch');
const demoHintBox = $('demoHint');
if (demoSwitch && guestCodePattern.test(I.demoPersonalCode || '')) {
  const demoButtons = demoSwitch.querySelectorAll('button[data-demo-mode]');
  onModeChange = () => {
    demoButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String((button.dataset.demoMode === 'link') === (personalCode !== '')));
    });
    if (demoHintBox && I.demoHint) demoHintBox.hidden = personalCode !== '';
  };
  demoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const wantLink = button.dataset.demoMode === 'link';
      if (wantLink === (personalCode !== '')) return;
      try {
        history.replaceState(null, '', wantLink ? `?g=${I.demoPersonalCode}${location.hash}` : `${location.pathname}${location.hash}`);
      } catch { /* sin historial: el interruptor sigue funcionando */ }
      if (wantLink) enterPersonal(I.demoPersonalCode.toLowerCase()); else exitPersonal();
    });
  });
  demoSwitch.hidden = false;
  onModeChange();
}

{
  const fromLink = (new URLSearchParams(window.location.search).get('g') || '').trim();
  if (fromLink && weddingPhase() !== 'after') {
    if (guestCodePattern.test(fromLink)) {
      enterPersonal(fromLink.toLowerCase());
    } else {
      guestHint.textContent = 'Este link no es válido. Pídeles a los novios que te lo envíen de nuevo.';
    }
  }
}

/* ---------- Verificación anti-spam (Cloudflare Turnstile) ---------- */
// Aparece solo si Cloudflare duda de que sea una persona (appearance: interaction-only).
let turnstileId = null;
let turnstileToken = '';
let turnstileFailed = false; // Cloudflare avisó de un error (por ejemplo, esta dirección no está en su lista)
let turnstileStartedAt = 0;
function renderTurnstile() {
  if (!I.turnstileSiteKey || turnstileId !== null || !window.turnstile || weddingPhase() === 'after') return;
  turnstileStartedAt = Date.now();
  turnstileId = window.turnstile.render('#turnstileBox', {
    sitekey: I.turnstileSiteKey,
    appearance: 'interaction-only',
    callback: (token) => { turnstileToken = token; turnstileFailed = false; },
    'expired-callback': () => { turnstileToken = ''; },
    'error-callback': () => { turnstileToken = ''; turnstileFailed = true; }
  });
}
// ¿La verificación está atascada y no va a terminar sola? (error de Cloudflare, el script no cargó o pasaron 15 s)
function turnstileStuck() {
  return turnstileFailed || !window.turnstile || (turnstileStartedAt && Date.now() - turnstileStartedAt > 15000);
}
// El script de Cloudflare carga aparte (async): se intenta al cargar la página y al abrir el sobre.
window.addEventListener('load', renderTurnstile);
$('openInvitation').addEventListener('click', () => setTimeout(renderTurnstile, 0));

// Envía la respuesta a JotaPG. Devuelve { ok: true } o { ok: false, error }.
async function sendRsvp(guest, attending, phone, message) {
  // Con link personal se manda el código; si no, nombre y celular.
  const who = personalCode ? { guest_code: personalCode } : { guest_name: guest.name, phone };
  try {
    const res = await fetch(I.rsvpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_id: I.inviteId,
        ...who,
        attending: attending > 0,
        guests_count: attending,
        message,
        turnstile_token: turnstileToken
      })
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || 'error' };
  } catch {
    return { ok: false, error: 'network' };
  }
}

const rsvpErrors = {
  wrong_phone: 'Ese número de celular no coincide con el de tu invitación.',
  guest_not_found: 'Escribe tu nombre y apellido tal como aparece en tu invitación.',
  link_required: 'Esta invitación es personal: abre el link que te enviaron para confirmar.',
  invalid_guests_count: 'La cantidad de pases no es válida. Elige una de la lista.',
  turnstile_failed: 'No pudimos comprobar que eres una persona. Espera unos segundos e inténtalo de nuevo.',
  turnstile_not_configured: 'Por ahora esta invitación no puede recibir confirmaciones. Avísales a los novios, por favor.',
  too_many_attempts: 'Demasiados intentos con ese nombre. Espera unos minutos e inténtalo de nuevo.'
};

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (weddingPhase() === 'after') return; // ya pasó la boda: la confirmación está cerrada
  const guest = currentGuest;
  if (!guest) {
    showFeedback(
      personalCode
        ? 'Este link no es válido. Pídeles a los novios que te lo envíen de nuevo.'
        : 'Escribe tu nombre y apellido tal como aparece en tu invitación.',
      'error'
    );
    return;
  }
  if (!personalCode && guestPhone.value.replace(/\D/g, '').length < 7) {
    showFeedback('Escribe tu número de celular completo.', 'error');
    return;
  }
  const attending = Number(guestPasses.value);
  if (I.turnstileSiteKey && !turnstileToken) {
    if (turnstileStuck()) {
      showFeedback('No pudimos comprobar que eres una persona. Recarga la página e inténtalo de nuevo; si sigue igual, avísales a los novios.', 'error');
    } else {
      showFeedback('Estamos comprobando que eres una persona. Inténtalo de nuevo en unos segundos.', 'warn');
    }
    renderTurnstile();
    return;
  }

  const submitButton = rsvpForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showFeedback('Enviando tu respuesta…');
  const result = await sendRsvp(guest, attending, guestPhone.value, guestNote.value.trim());
  submitButton.disabled = false;
  // El token de Turnstile sirve una sola vez: se pide uno nuevo para el próximo intento.
  if (turnstileId !== null) { turnstileToken = ''; window.turnstile.reset(turnstileId); }
  if (!result.ok) {
    const text = personalCode && result.error === 'guest_not_found'
      ? 'Este link no es válido. Pídeles a los novios que te lo envíen de nuevo.'
      : rsvpErrors[result.error];
    showFeedback(text || 'No pudimos guardar tu respuesta. Inténtalo de nuevo en un momento.', 'error');
    return;
  }

  const reply = attending > 0
    ? `¡Gracias, ${guest.name}! Confirmaste ${passesText(attending)}.`
    : `Gracias por avisarnos, ${guest.name}. Lamentamos que no puedas acompañarnos.`;
  showFeedback(reply, 'success');
  if (personalCode) {
    // Con link personal el invitado sigue identificado: puede cambiar su respuesta si quiere.
    guestNote.value = '';
    return;
  }
  currentGuest = null;
  setFound(false);
  rsvpForm.reset();
  resetPasses();
  guestHint.textContent = '';
});

/* ---------- Galería ---------- */
const galleryModal = $('galleryModal');
const modalImage = galleryModal.querySelector('img');
document.querySelectorAll('.gallery .print img').forEach((image) => {
  image.closest('.print').addEventListener('click', () => {
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    galleryModal.classList.add('is-open');
    galleryModal.setAttribute('aria-hidden', 'false');
  });
});
galleryModal.addEventListener('click', (event) => {
  if (event.target === galleryModal || event.target.tagName === 'BUTTON') {
    galleryModal.classList.remove('is-open');
    galleryModal.setAttribute('aria-hidden', 'true');
  }
});

/* ---------- Barra de progreso ---------- */
const progress = document.querySelector('.progress span');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
  updateTimeline();
}, { passive: true });
updateTimeline();
