// Uso:  node tools/sincronizar.mjs
// 1) Escribe en index.html las etiquetas de vista previa (título, descripción, WhatsApp/Facebook/X)
//    a partir de invite.js. Esas etiquetas las leen las apps sin ejecutar la página.
//    También pone la etiqueta «noindex» (que Google no la muestre en sus resultados) en toda invitación
//    que no sea la muestra: una boda real lleva direcciones y la clave de Zoom.
// 2) Avisa si en invite.js quedó algún dato de ejemplo sin cambiar.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('invite.js', root), 'utf8'), ctx);
const I = ctx.window.INVITE;
if (!I) { console.error('invite.js no define window.INVITE'); process.exit(1); }

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const date = new Date(I.eventStart);
const fmt = (o) => new Intl.DateTimeFormat('es', { timeZone: I.timeZone, ...o }).format(date);
const dateLong = `${fmt({ day: 'numeric' })} de ${fmt({ month: 'long' })} de ${fmt({ year: 'numeric' })}`;
const dateShort = `${fmt({ day: '2-digit' })}.${fmt({ month: '2-digit' })}.${fmt({ year: 'numeric' })}`;
const names = `${I.bride} & ${I.groom}`;
const share = I.share || {};
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

// Avisos: datos de ejemplo que no deberían quedar en una boda real.
const text = JSON.stringify(I);
const sospechosos = [
  [/Insertar/g, 'texto "Insertar ..." (dirección, ID de Zoom o contraseña)'],
  [/"Novia"|"Novio"|N \+ N/g, 'nombres o iniciales de ejemplo'],
  [/Lugar de la|Padre de la|Madre de la|Padre del|Madre del/g, 'lugares o familiares de ejemplo'],
  [/unsplash\.com/g, 'fotos de ejemplo (Unsplash)'],
  [/"inviteId":"muestra-3"/g, 'inviteId de la muestra'],
  [/maps\.google\.com"/g, 'enlace de mapa genérico'],
  [/"demoHint"/g, 'bloque DEMO (demoHint): borrarlo de invite.js en una boda real'],
  [/Ejemplo/g, 'textos "Ejemplo" (lugares, direcciones o invitados de muestra)']
];
let avisos = 0;
for (const [pattern, label] of sospechosos) {
  const n = (text.match(pattern) || []).length;
  if (n) { avisos += 1; console.warn(`AVISO: ${n} × ${label}`); }
}
if (!avisos) console.log('Sin datos de ejemplo pendientes.');
