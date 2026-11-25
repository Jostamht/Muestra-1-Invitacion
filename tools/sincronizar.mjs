// Uso:  node tools/sincronizar.mjs
// 1) Revisa que la fecha, la zona horaria y la dirección de la invitación sean válidas. Si no lo son, se
//    detiene con un ERROR y no toca index.html (con esos datos la página se rompería o mostraría otra fecha).
// 2) Escribe en index.html las etiquetas de vista previa (título, descripción, WhatsApp/Facebook/X)
//    a partir de invite.js. Esas etiquetas las leen las apps sin ejecutar la página.
//    También pone la etiqueta «noindex» (que Google no la muestre en sus resultados) en toda invitación
//    que no sea la muestra: una boda real lleva direcciones y la clave de Zoom.
// 3) Avisa si en invite.js quedó algún dato de ejemplo o algo que haría fallar la invitación:
//    textos de ejemplo, Zoom de ejemplo, fecha sin zona horaria, fotos que faltan o no existen en fotos/,
//    galería que no tiene exactamente 6 fotos, dirección sin https o sin la barra final, clave de Turnstile vacía.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('invite.js', root), 'utf8'), ctx);
const I = ctx.window.INVITE;
if (!I) { console.error('invite.js no define window.INVITE'); process.exit(1); }

const share = I.share || {};
const tz = I.timeZone || 'America/La_Paz'; // igual que app.js

// ---------- Errores: con estos datos la página se rompería, así que no se sigue ----------
const errores = [];
const inicio = typeof I.eventStart === 'string' ? I.eventStart.trim() : '';
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;
const partes = inicio.match(ISO);
if (!inicio) {
  errores.push('Falta eventStart (fecha y hora de la ceremonia, entre comillas). Sin él la página mostraría la fecha de la muestra.');
} else {
  let real = false;
  if (partes) {
    const [y, mo, d] = [+partes[1], +partes[2], +partes[3]];
    const t = new Date(Date.UTC(y, mo - 1, d)); // 30 de febrero → el navegador lo pasa a marzo sin avisar
    real = t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
      && +partes[4] <= 23 && +partes[5] <= 59 && !Number.isNaN(new Date(inicio).getTime());
  }
  if (!real) errores.push(`eventStart ("${inicio}") no es una fecha y hora válidas. Formato: 2026-12-31T17:00:00-04:00 (un día real del calendario, hora de 00:00 a 23:59 y la zona al final con dos puntos).`);
}
try { new Intl.DateTimeFormat('es', { timeZone: tz }); }
catch { errores.push(`timeZone ("${tz}") no es una zona horaria válida. Por ejemplo: America/La_Paz.`); }
const siteUrl = typeof share.siteUrl === 'string' ? share.siteUrl.trim() : '';
let siteUrlOk = false;
try { siteUrlOk = /^https?:$/.test(new URL(siteUrl).protocol); } catch { /* queda en falso */ }
if (!siteUrlOk) errores.push('share.siteUrl falta o no es una dirección completa (por ejemplo https://juancarla.pages.dev/). Se usa para la vista previa al compartir el enlace.');
if (errores.length) {
  errores.forEach((e) => console.error(`ERROR: ${e}`));
  console.error('No se cambió index.html. Corrige invite.js y vuelve a correr el programa.');
  process.exit(1);
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const date = new Date(inicio);
const fmt = (o) => new Intl.DateTimeFormat('es', { timeZone: tz, ...o }).format(date);
const dateLong = `${fmt({ day: 'numeric' })} de ${fmt({ month: 'long' })} de ${fmt({ year: 'numeric' })}`;
const dateShort = `${fmt({ day: '2-digit' })}.${fmt({ month: '2-digit' })}.${fmt({ year: 'numeric' })}`;
const names = `${I.bride} & ${I.groom}`;
const abs = (u) => (/^https?:/.test(u || '') ? u : new URL(u || '', share.siteUrl).href);
const image = abs(share.image);

// Oculta para los buscadores salvo que sea la muestra (demoIndexable: true, dentro del bloque DEMO).
const oculta = I.demoIndexable !== true;
const robots = oculta ? `    <meta name="robots" content="noindex, nofollow" />\n` : '';

const head = `    <!-- JP:HEAD (lo escribe tools/sincronizar.mjs; no editar a mano) -->
${robots}    <meta name="description" content="${esc(`Invitación de boda de ${I.bride} y ${I.groom} — ${dateLong}.`)}" />
    <title>${esc(`${names} — ${dateShort}`)}</title>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(`${names} — Nuestra boda`)}" />
    <meta property="og:description" content="${esc(`Celebra con nosotros el ${dateLong}. ${share.description || ''}`.trim())}" />
    <meta property="og:url" content="${esc(share.siteUrl || '')}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(share.imageAlt || '')}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(`${names} — Nuestra boda`)}" />
    <meta name="twitter:description" content="${esc(`Celebra con nosotros el ${dateLong}.`)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <!-- /JP:HEAD -->`;

const file = new URL('index.html', root);
let html = readFileSync(file, 'utf8');
const re = /[ \t]*<!-- JP:HEAD[\s\S]*?<!-- \/JP:HEAD -->/;
if (!re.test(html)) { console.error('Falta el bloque JP:HEAD en index.html'); process.exit(1); }
writeFileSync(file, html.replace(re, head));
console.log('Vista previa actualizada:', `${names} — ${dateLong}`);
console.log(oculta
  ? 'Oculta para Google y otros buscadores (noindex).'
  : 'Visible para los buscadores (solo la muestra: demoIndexable).');

// ---------- Avisos ----------
const avisos = [];

// Lo que está apagado con show: false no se ve en la invitación, así que sus datos no cuentan.
const apagado = (k) => I[k] && I[k].show === false;
const visible = { ...I };
for (const k of ['ceremony', 'reception', 'gift', 'zoom']) if (apagado(k)) delete visible[k];
visible.photos = { ...(I.photos || {}) };
for (const k of ['ceremony', 'reception']) if (apagado(k)) delete visible.photos[k];

// Datos de ejemplo que no deberían quedar en una boda real.
const text = JSON.stringify(visible);
const sospechosos = [
  [/Insertar/g, 'texto "Insertar ..." (dirección, ID de Zoom o contraseña)'],
  [/"Novia"|"Novio"|N \+ N/g, 'nombres o iniciales de ejemplo'],
  [/Lugar de la|Padre de la|Madre de la|Padre del|Madre del/g, 'lugares o familiares de ejemplo'],
  [/unsplash\.com/g, 'fotos de ejemplo (Unsplash)'],
  [/"inviteId":"muestra-3"/g, 'inviteId de la muestra'],
  [/muestra-1-invitacion\.pages\.dev/g, 'dirección de la muestra (muestra-1-invitacion.pages.dev): poner la de esta boda'],
  [/maps\.google\.com"/g, 'enlace de mapa genérico'],
  [/"demoHint"/g, 'bloque DEMO (demoHint): borrarlo de invite.js en una boda real'],
  [/(?<!por )ejemplo/gi, 'textos "ejemplo" (lugares, direcciones, contraseña de Zoom o invitados de muestra)']
];
for (const [pattern, label] of sospechosos) {
  const n = (text.match(pattern) || []).length;
  if (n) avisos.push(`${n} × ${label}`);
}

// Zoom de ejemplo (solo si la tarjeta de Zoom se ve).
if (!apagado('zoom') && I.zoom && String(I.zoom.id || '').replace(/\D/g, '') === '1234567890') {
  avisos.push('el ID de Zoom es el de ejemplo (123 456 7890)');
}

// Fecha: sin zona horaria cada celular la interpretaría con su propia hora.
if (!partes[6]) {
  avisos.push(`eventStart ("${inicio}") no lleva zona horaria al final (por ejemplo -04:00); cada celular lo leería con su propia hora`);
} else if (partes[6] !== 'Z') {
  // Que la hora escrita coincida con la hora real en timeZone (si no, la fecha de la página se corre).
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).formatToParts(date).map((x) => [x.type, x.value]));
  const escrita = `${partes[1]}-${partes[2]}-${partes[3]} ${partes[4]}:${partes[5]}`;
  const real = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
  if (escrita !== real) {
    avisos.push(`eventStart dice ${escrita} (${partes[6]}), pero en ${tz} esa hora es ${real}: la zona de eventStart y timeZone no coinciden`);
  }
}

// Fotos: las que faltan y los archivos de fotos/ que no existen.
// (Linux distingue mayúsculas: «Foto1.JPG» y «foto1.jpg» son archivos distintos, igual que en Cloudflare.)
const ph = I.photos || {};
const gallery = Array.isArray(ph.gallery) ? ph.gallery : [];
const fotos = [
  ['portada (photos.hero)', (ph.hero || {}).src, true],
  ['bienvenida (photos.intro)', (ph.intro || {}).src, true]
];
if (!apagado('ceremony')) fotos.push(['ceremonia (photos.ceremony)', (ph.ceremony || {}).src, true], ['mapa de la ceremonia (ceremony.mapImage)', (I.ceremony || {}).mapImage, false]);
if (!apagado('reception')) fotos.push(['recepción (photos.reception)', (ph.reception || {}).src, true], ['mapa de la recepción (reception.mapImage)', (I.reception || {}).mapImage, false]);
// Si la galería tiene menos de 6, ya se avisó arriba; aquí solo se revisan las que sí están escritas.
for (let i = 0; i < gallery.length; i += 1) fotos.push([`galería, foto ${i + 1}`, (gallery[i] || {}).src, true]);
fotos.push(['vista previa al compartir (share.image)', share.image, true]);
if (!apagado('gift')) fotos.push(['código QR (gift.qrImage)', (I.gift || {}).qrImage, false]);

if (gallery.length !== 6) avisos.push(`la galería tiene ${gallery.length} fotos y debe tener exactamente 6`);
for (const [label, src, obligatoria] of fotos) {
  const s = typeof src === 'string' ? src.trim() : '';
  if (!s) { if (obligatoria) avisos.push(`falta la foto: ${label}`); continue; }
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(s)) continue; // enlace externo: no se puede comprobar aquí
  let ruta = s.replace(/[?#].*$/, '').replace(/^\//, '');
  try { ruta = decodeURIComponent(ruta); } catch { /* se deja como está */ }
  if (!existsSync(new URL(ruta, root))) avisos.push(`no existe el archivo "${ruta}" (${label})`);
}

// Dirección de la invitación: https y barra final.
if (!siteUrl.startsWith('https://')) avisos.push(`share.siteUrl ("${siteUrl}") debe empezar con https://`);
if (!siteUrl.endsWith('/')) avisos.push(`share.siteUrl ("${siteUrl}") debe terminar con una barra /`);

// Turnstile: sin la clave, nadie podría confirmar (JotaPG siempre exige la verificación).
if (!String(I.turnstileSiteKey || '').trim()) {
  avisos.push('turnstileSiteKey está vacía: nadie podría confirmar asistencia (poner la clave pública del widget, ver la sección 11 de invite.js)');
}

avisos.forEach((a) => console.warn(`AVISO: ${a}`));
if (!avisos.length) console.log('Sin avisos: todo en orden.');
