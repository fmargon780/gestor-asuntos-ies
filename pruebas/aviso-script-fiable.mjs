/* Fila 471 (docs/AVISO-SCRIPT-CORREO-FIABLE.md): el aviso «El envío de correo está anticuado» solo sale
   cuando es verdad, porque la app pregunta la versión al script sin enviar nada.

   A. (vm) la consulta: contesta la versión actual → no está anticuado; sin JSON, clave mala o red caída → no toca lo
      guardado; nunca cambia la dirección guardada; es un GET.
   B. (vm) apps-script/gestor-correos.gs: `doGet` con clave buena devuelve versión y no envía; con clave mala, no.
   C. (Chromium, ?demo=1&auto=1) la tarjeta con sus tres botones y cuatro pasos; con `gestor-demo-script-al-dia`
      desaparece sola y sin avisos de correo de prueba; «Copiar el enlace del código» copia y no abre pestaña;
      «Abrir mis proyectos de Google» abre script.google.com/home?authuser=; el cuadro de la recogida copia el mismo enlace. */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ENLACE = 'https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs';

/* ---------- A. la consulta ---------- */
console.log('--- A. la consulta de la versión ---');
function mundo() {
  const almacen = new Map(); const peticiones = []; let respuesta = null;
  const ctx = {
    console, document: { getElementById: () => null, readyState: 'complete', addEventListener() {} },
    localStorage: { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); } },
    App: { E: {} }, setTimeout, clearTimeout,
    fetch: async (url, op) => {
      peticiones.push({ url, op });
      if (respuesta.rechazar) throw new TypeError('Failed to fetch');
      return { ok: respuesta.status < 300, status: respuesta.status, text: async () => respuesta.texto };
    }
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(leer('js/util.js'), ctx);
  vm.runInContext(leer('js/correo-enviar.js'), ctx);
  vm.runInContext(leer('js/correo-version.js'), ctx);
  return { ctx, peticiones, responder: (r) => { respuesta = r; }, almacen };
}
const ejecutar = (c, e) => vm.runInContext('(async () => (' + e + '))()', c.ctx);
const URL_GUARDADA = 'https://script.google.com/macros/s/X/exec?k=abc';
{
  const c = mundo();
  await ejecutar(c, 'CorreoEnviar.guardarUrl("' + URL_GUARDADA + '")');
  await ejecutar(c, 'CorreoEnviar._registrarVersionScript("23-oct-2026 · fila 441")');
  comprobar('1. con la versión vieja guardada, está anticuado', await ejecutar(c, 'CorreoEnviar.scriptDesactualizado()'), true);
  c.responder({ status: 200, texto: JSON.stringify({ ok: true, soloVersion: true, version: '28-oct-2026 · fila 480', cuenta: 'admin@x.es' }) });
  await ejecutar(c, 'CorreoVersion.preguntar(true)');
  comprobar('1. la consulta que contesta la versión actual lo quita', await ejecutar(c, 'CorreoEnviar.scriptDesactualizado()'), false);
  comprobar('1. es un GET a la dirección guardada, tal cual', [c.peticiones[0].url, c.peticiones[0].op.method, c.peticiones[0].op.body], [URL_GUARDADA, 'GET', undefined]);
  comprobar('1. la cuenta se renueva', await ejecutar(c, 'CorreoEnviar.cuentaConocida()'), 'admin@x.es');
}
for (const [nombre, r] of [
  ['una página que no es JSON (script viejo, sin doGet)', { status: 200, texto: '<html>Error</html>' }],
  ['clave mala (ok:false sin version)', { status: 200, texto: JSON.stringify({ ok: false, motivo: 'La clave no es correcta.' }) }],
  ['un error de Google', { status: 404, texto: '{}' }],
  ['la red caída', { rechazar: true }]
]) {
  const c = mundo();
  await ejecutar(c, 'CorreoEnviar.guardarUrl("' + URL_GUARDADA + '")');
  await ejecutar(c, 'CorreoEnviar._registrarVersionScript("23-oct-2026 · fila 441")');
  c.responder(r);
  await ejecutar(c, 'CorreoVersion.preguntar(true)');
  comprobar('1. ' + nombre + ': no toca lo guardado', [await ejecutar(c, 'CorreoEnviar.versionConocida()'), await ejecutar(c, 'CorreoEnviar.leerUrl()'), c.almacen.has('gestor-envio-general-no-vale')], ['23-oct-2026 · fila 441', URL_GUARDADA, false]);
}
{
  const c = mundo();
  c.responder({ status: 200, texto: '{}' });
  await ejecutar(c, 'CorreoVersion.preguntar(true)');
  comprobar('1. sin dirección guardada no pregunta a nadie', c.peticiones.length, 0);
}

/* ---------- B. el script ---------- */
console.log('--- B. doGet del script ---');
{
  const gs = leer('apps-script/gestor-correos.gs');
  const llamadas = [];
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'secreta' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'admin@x.es' }), getEffectiveUser: () => ({ getEmail: () => 'admin@x.es' }) },
    GmailApp: new Proxy({}, { get: (_, n) => () => { llamadas.push(n); return null; } }),
    MailApp: new Proxy({}, { get: (_, n) => () => { llamadas.push(n); return null; } }),
    console
  };
  vm.createContext(ctx); vm.runInContext(gs, ctx);
  const buena = JSON.parse(vm.runInContext('doGet({ parameter: { k: "secreta" } }).t', ctx));
  const mala = JSON.parse(vm.runInContext('doGet({ parameter: { k: "otra" } }).t', ctx));
  const sin = JSON.parse(vm.runInContext('doGet({}).t', ctx));
  const esperada = (leer('js/correo-enviar.js').match(/var SCRIPT_ESPERADO = '([^']*)'/) || [])[1];
  comprobar('5. clave buena: ok, soloVersion y la versión esperada', [buena.ok, buena.soloVersion, buena.version], [true, true, esperada]);
  comprobar('5. clave mala o ausente: sin version', [mala.ok, 'version' in mala, sin.ok, 'version' in sin], [false, false, false, false]);
  comprobar('5. no ha llamado a ninguna función de envío', llamadas.filter((n) => /send|draft|create/i.test(n)), []);
}

/* ---------- C. la pantalla ---------- */
console.log('--- C. la tarjeta, en la demostración ---');
const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function abrir(extra) {
  const contexto = await navegador.newContext({ viewport: { width: 1500, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor.inicio.plegados', '{\"avisos\":false,\"tablon\":false}'); " + (extra || '') + " } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  await pagina.waitForFunction(() => window.Problemas && Problemas.ids().includes('configurar'), null, { timeout: 30000 });
  return { contexto, pagina, errores };
}
const hayTarjeta = (p) => p.evaluate(() => Problemas.ids().includes('script'));
{
  const { contexto, pagina, errores } = await abrir();
  await pagina.waitForFunction(() => Problemas.ids().includes('script'), null, { timeout: 15000 });
  await pagina.evaluate(() => { window.__abiertas = []; window.open = function (u) { window.__abiertas.push(u); return null; }; });
  await pagina.click('.pestana[data-pantalla="ajustes"]');
  await pagina.click('[data-ajustes-pestana="problemas"]');
  await pagina.waitForSelector('#problema-script-codigo', { state: 'visible' });
  const tarjeta = await pagina.evaluate(() => {
    const b = ['problema-script-codigo', 'problema-script-proyectos', 'problema-script-ver'].map((id) => document.getElementById(id));
    return { botones: b.map((x) => x && x.textContent), ordenOk: b.every(Boolean) && b[0].compareDocumentPosition(b[1]) & 4 && b[1].compareDocumentPosition(b[2]) & 4,
      pasos: Array.from(b[0].closest('section.problema').querySelectorAll('ol li')).map((l) => l.textContent) };
  });
  comprobar('2. tres botones en orden, el primero «(lo normal)»', tarjeta.botones, ['Copiar el enlace del código (lo normal)', 'Abrir mis proyectos de Google', 'Ver «Enviar correo»']);
  comprobar('2. orden en el documento', !!tarjeta.ordenOk, true);
  comprobar('2. cuatro pasos y la dirección escrita en el primero', [tarjeta.pasos.length, tarjeta.pasos[0].indexOf(ENLACE) !== -1], [4, true]);
  const pestanasAntes = contexto.pages().length;
  await pagina.click('#problema-script-codigo');
  await pagina.waitForFunction(() => /Enlace copiado/.test(document.body.innerText), null, { timeout: 5000 });
  comprobar('4. copia la dirección exacta', await pagina.evaluate(() => navigator.clipboard.readText()), ENLACE);
  comprobar('4. aviso «Enlace copiado…» y ninguna pestaña nueva', [await pagina.evaluate(() => /Enlace copiado\. Pégalo en el Chrome de tu cuenta personal\./.test(document.body.innerText)), contexto.pages().length, await pagina.evaluate(() => window.__abiertas.length)], [true, pestanasAntes, 0]);
  await pagina.click('#problema-script-proyectos');
  const abiertas = await pagina.evaluate(() => window.__abiertas);
  comprobar('4. abre los proyectos de Google con la cuenta de Administración', [abiertas.length, /^https:\/\/script\.google\.com\/home\?authuser=.+/.test(abiertas[0] || '')], [1, true]);
  comprobar('2. sin errores', errores, []);
  await contexto.close();
}
{
  const { contexto, pagina, errores } = await abrir("localStorage.setItem('gestor-demo-script-al-dia', '1');");
  await pagina.waitForFunction(() => !Problemas.ids().includes('script'), null, { timeout: 15000 });
  comprobar('3. con el script al día, la tarjeta no está (se quita sola)', await hayTarjeta(pagina), false);
  comprobar('3. sin avisos de correo de prueba', await pagina.evaluate(() => /prueba enviad|correo de prueba/i.test(document.body.innerText)), false);
  comprobar('3. sin errores', errores, []);
  await contexto.close();
}
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
