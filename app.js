const $ = (id) => document.getElementById(id);
const I = window.INVITE || {};

/* ---------- Datos de la invitación (invite.js) ---------- */
const eventDate = new Date(I.eventStart || '2026-12-31T17:00:00-04:00');

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
const SCHEDULE_ICONS = ['\u2661', '\u266B', '\u2726', '\u2321', '\u263D'];
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
      el('i', { 'aria-hidden': 'true' }, item.icon || SCHEDULE_ICONS[i % SCHEDULE_ICONS.length]),
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
  const end = new Date(eventDate.getTime() + (I.durationHours || 7) * 3600000);
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

function updateCountdown() {
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
  if (envelope.classList.contains('is-opening')) return; // ya se está abriendo
  envelope.classList.add('is-opening'); // 1) se rompe el sello, se abre la solapa y sale la carta
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    envelope.classList.add('is-open'); // 2) el sobre se desvanece y aparece la invitación
    invitation.removeAttribute('inert');
    document.body.classList.remove('is-locked');
    fitNames();
  }, reduceMotion ? 0 : 1900);
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

// Pregunta a JotaPG quién es. Devuelve { found, name, passes, ambiguous } o null si falló la conexión.
async function lookupGuest(name) {
  try {
    const res = await fetch(I.lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: I.inviteId, name })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

guestName.addEventListener('input', () => {
  feedback.textContent = '';
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
    const result = await lookupGuest(typed);
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

// Envía la respuesta a JotaPG. Devuelve { ok: true } o { ok: false, error }.
async function sendRsvp(guest, attending, phone, message) {
  try {
    const res = await fetch(I.rsvpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_id: I.inviteId,
        guest_name: guest.name,
        phone,
        attending: attending > 0,
        guests_count: attending,
        message
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
  invalid_guests_count: 'La cantidad de pases no es válida. Elige una de la lista.'
};

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const guest = currentGuest;
  if (!guest) {
    feedback.textContent = 'Escribe tu nombre y apellido tal como aparece en tu invitación.';
    return;
  }
  if (guestPhone.value.replace(/\D/g, '').length < 7) {
    feedback.textContent = 'Escribe tu número de celular completo.';
    return;
  }
  const attending = Number(guestPasses.value);

  const submitButton = rsvpForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  feedback.textContent = 'Enviando tu respuesta…';
  const result = await sendRsvp(guest, attending, guestPhone.value, guestNote.value.trim());
  submitButton.disabled = false;
  if (!result.ok) {
    feedback.textContent =
      rsvpErrors[result.error] || 'No pudimos guardar tu respuesta. Inténtalo de nuevo en un momento.';
    return;
  }

  const reply = attending > 0
    ? `¡Gracias, ${guest.name}! Confirmaste ${passesText(attending)}.`
    : `Gracias por avisarnos, ${guest.name}. Lamentamos que no puedas acompañarnos.`;
  if (I.whatsapp) {
    const text = attending > 0
      ? `Hola, soy ${guest.name}. Confirmo mi asistencia con ${passesText(attending)}.`
      : `Hola, soy ${guest.name}. Lamentablemente no podré asistir.`;
    window.open(`https://wa.me/${I.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    feedback.textContent = `${reply} Se abrió WhatsApp para enviar tu respuesta.`;
  } else {
    feedback.textContent = reply;
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
