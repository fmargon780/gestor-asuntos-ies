/* Prueba de la fila 411 (21-oct-2026, docs/CORREO-DESDE-LA-CUENTA-COMUN.md): el correo sale y se recoge
   desde la cuenta común de Administración. Sin navegador, con `vm`.

   Script (apps-script/gestor-correos.gs):
     1. Con `nombreRemitente`, el correo (nuevo o dentro de un hilo) sale con la opción `name`.
     2. Sin `nombreRemitente` (app vieja), sale como siempre: sin `name`.
     3. Cada respuesta dice con qué cuenta trabaja el script (`cuenta`) y la versión de la fila 411.
     4. Un hilo guardado desde otro buzón (no existe por id) se busca por `rfc822msgid:` con las
        `matriculas`, de la última a la primera, y se responde dentro de él.
     5. Si tampoco se encuentra, o no hay matrículas, correo nuevo, sin ruido.
   App (js/correo-enviar.js):
     6. Cada envío lleva el nombre del remitente del centro (el de Ajustes, o el de siempre).
     7. La cuenta que dice el script se guarda; la línea de Ajustes sale bien o en ámbar según coincida
        con la de Administración, sin distinguir mayúsculas; sin saber nada, no es ámbar. */
import fs from 'node:fs';
import vm from 'node:vm';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, cond, detalle) {
  if (!cond) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const ADMIN = '29700692.administracion@g.educaand.es';
const REMITENTE = 'Administración · IES Fuente Lucena';

/* ---------- el script ---------- */
const gs = fs.readFileSync(new URL('../apps-script/gestor-correos.gs', import.meta.url), 'utf8');

function contextoScript(opciones) {
  const propiedades = {};
  const enviados = [];
  const busquedas = [];
  const hilos = opciones.hilos || {};   /* id -> [{ de, para }] */
  function hiloFalso(id, mensajes) {
    return {
      getId: () => id,
      getMessages: () => mensajes.map((m) => ({ getFrom: () => m.de || '', getTo: () => m.para || '', getCc: () => '' })),
      createDraftReply: (texto, o) => ({ send: () => {
        enviados.push({ tipo: 'respuesta', hilo: id, opciones: o });
        return { getThread: () => ({ getId: () => id }), getHeader: () => 'm-resp' };
      } })
    };
  }
  const ctx = {
    console, Logger: { log: () => {} },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in propiedades ? propiedades[k] : null),
      setProperty: (k, v) => { propiedades[k] = v; } }) },
    Utilities: { base64Decode: (s) => Buffer.from(String(s), 'base64'), newBlob: () => ({}), formatDate: () => '2026-10-21T09:00:00', getUuid: () => 'u' + Math.random() },
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: (t) => ({ _t: t, setMimeType: function () { return this; }, getContent: function () { return this._t; } }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Session: { getActiveUser: () => ({ getEmail: () => '' }), getEffectiveUser: () => ({ getEmail: () => ADMIN }), getScriptTimeZone: () => 'Europe/Madrid' },
    ScriptApp: { getService: () => ({ getUrl: () => '' }) },
    DriveApp: {},
    GmailApp: {
      getThreadById: (id) => (hilos[id] ? hiloFalso(id, hilos[id]) : null),
      createDraft: (para, asunto, cuerpo, o) => ({ send: () => {
        enviados.push({ tipo: 'nuevo', para: para, opciones: o });
        return { getThread: () => ({ getId: () => 'hilo-nuevo' }), getHeader: () => 'm-nuevo' };
      } }),
      search: (q) => {
        busquedas.push(q);
        const m = /^rfc822msgid:(.*)$/.exec(q);
        const id = m && opciones.porMatricula && opciones.porMatricula[m[1]];
        return id ? [hiloFalso(id, opciones.porMatriculaMensajes || [{ de: 'x', para: 'ana@correo.es' }])] : [];
      }
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(gs, ctx, { filename: 'gestor-correos.gs' });
  vm.runInContext('prepararEnvio()', ctx);
  return { ctx, propiedades, enviados, busquedas };
}

function enviar(c, cuerpo) {
  c.ctx.__e = { postData: { contents: JSON.stringify(Object.assign({ clave: c.propiedades['clave-envio'] }, cuerpo)) } };
  return JSON.parse(vm.runInContext('doPost(__e).getContent()', c.ctx));
}

console.log('--- 1-3. nombre del remitente y cuenta ---');
{
  const c = contextoScript({});
  const r = enviar(c, { para: 'ana@correo.es', asunto: 'Hola', cuerpo: 'x', nombreRemitente: REMITENTE });
  comprobar('1. correo nuevo con el nombre del remitente', [r.ok, c.enviados[0].opciones.name], [true, REMITENTE]);
  comprobar('3. la respuesta dice la cuenta del script', r.cuenta, ADMIN);
  comprobar('3. y la versión de la fila 411', r.version, '21-oct-2026 · fila 411');
  const r2 = enviar(c, { para: 'ana@correo.es', asunto: 'Hola', cuerpo: 'x' });
  comprobar('2. sin nombre (app vieja): sin opción name', [r2.ok, 'name' in c.enviados[1].opciones], [true, false]);
  const r3 = enviar(c, { prueba: true, nombreRemitente: REMITENTE });
  comprobar('1. «Probar» también lleva el nombre', [r3.ok, c.enviados[2].opciones.name, r3.cuenta], [true, REMITENTE, ADMIN]);
}
{
  const c = contextoScript({ hilos: { h1: [{ de: 'x', para: 'ana@correo.es' }] } });
  const r = enviar(c, { para: 'ana@correo.es', asunto: 'Re', cuerpo: 'x', hilo: 'h1', nombreRemitente: REMITENTE });
  comprobar('1. la respuesta dentro de un hilo también lleva el nombre', [r.hilo, c.enviados[0].tipo, c.enviados[0].opciones.name], ['h1', 'respuesta', REMITENTE]);
}

console.log('--- 4-5. hilos de otro buzón ---');
{
  const c = contextoScript({ porMatricula: { 'abc@mail.gmail.com': 'hilo-comun' } });
  const r = enviar(c, { para: 'ana@correo.es', asunto: 'Re', cuerpo: 'x', hilo: 'hilo-del-buzon-de-francisco', matriculas: ['vieja@x', 'abc@mail.gmail.com'], nombreRemitente: REMITENTE });
  comprobar('4. busca por matrícula y responde dentro del hilo de la cuenta común', [r.ok, r.hilo, c.enviados[0].tipo], [true, 'hilo-comun', 'respuesta']);
  comprobar('4. de la última a la primera', c.busquedas, ['rfc822msgid:abc@mail.gmail.com']);
}
{
  const c = contextoScript({ porMatricula: { 'abc@x': 'hilo-comun' }, porMatriculaMensajes: [{ de: 'x', para: 'otra@correo.es' }] });
  const r = enviar(c, { para: 'ana@correo.es', asunto: 'Re', cuerpo: 'x', hilo: 'ajeno', matriculas: ['abc@x'] });
  comprobar('4. si el destinatario no estaba en ese hilo, correo nuevo', [r.ok, c.enviados[0].tipo], [true, 'nuevo']);
}
{
  const c = contextoScript({});
  const r = enviar(c, { para: 'ana@correo.es', asunto: 'Re', cuerpo: 'x', hilo: 'ajeno', matriculas: ['no@esta'] });
  comprobar('5. matrícula que no aparece: correo nuevo, sin ruido', [r.ok, c.enviados[0].tipo], [true, 'nuevo']);
  const d = contextoScript({});
  const r2 = enviar(d, { para: 'ana@correo.es', asunto: 'Re', cuerpo: 'x', hilo: 'ajeno' });
  comprobar('5. sin matrículas: correo nuevo y ninguna búsqueda', [r2.ok, d.enviados[0].tipo, d.busquedas.length], [true, 'nuevo', 0]);
}

/* ---------- la app ---------- */
const fuente = fs.readFileSync(new URL('../js/correo-enviar.js', import.meta.url), 'utf8');
const uFuente = fs.readFileSync(new URL('../js/util.js', import.meta.url), 'utf8');

function contextoApp(datosCentro) {
  const almacen = new Map();
  const peticiones = [];
  let respuesta = { ok: true, version: '21-oct-2026 · fila 411', cuenta: ADMIN };
  const ctx = {
    console,
    document: { getElementById: () => null, readyState: 'complete', addEventListener: () => {} },
    localStorage: { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); } },
    App: { E: {}, ir: () => {}, cambiarPestanaAjustes: () => {} },
    Plantillas: datosCentro === undefined ? undefined : {
      POR_DEFECTO_REMITENTE: REMITENTE, POR_DEFECTO_CUENTA_ADMIN: ADMIN,
      enMemoria: () => datosCentro
    },
    fetch: async (url, o) => {
      peticiones.push(JSON.parse(o.body));
      return { ok: true, status: 200, text: async () => JSON.stringify(respuesta) };
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(uFuente, ctx, { filename: 'util.js' });
  vm.runInContext(fuente, ctx, { filename: 'correo-enviar.js' });
  return { ctx, peticiones, responder: (r) => { respuesta = r; } };
}
const ejecutar = (ctx, e) => vm.runInContext('(async () => (' + e + '))()', ctx);
const URL_EXEC = 'https://script.google.com/macros/s/X/exec?k=abc';

console.log('--- 6. el envío lleva el nombre del remitente ---');
{
  const c = contextoApp({ remitente: 'Secretaría · IES X', cuentaAdministracion: ADMIN });
  await ejecutar(c.ctx, `CorreoEnviar.guardarUrl("${URL_EXEC}")`);
  await ejecutar(c.ctx, 'CorreoEnviar.enviar({ para: "a@b.es" })');
  comprobar('6. el de Ajustes', c.peticiones[0].nombreRemitente, 'Secretaría · IES X');
  await ejecutar(c.ctx, 'CorreoEnviar.enviar({ para: "a@b.es", nombreRemitente: "Otro" })');
  comprobar('6. si ya lo traía, no se pisa', c.peticiones[1].nombreRemitente, 'Otro');
  await ejecutar(c.ctx, 'CorreoEnviar.probar()');
  comprobar('6. «Probar» también', c.peticiones[2].nombreRemitente, 'Secretaría · IES X');
}
{
  const c = contextoApp({ cuentaAdministracion: ADMIN });
  await ejecutar(c.ctx, `CorreoEnviar.guardarUrl("${URL_EXEC}")`);
  await ejecutar(c.ctx, 'CorreoEnviar.enviar({ para: "a@b.es" })');
  comprobar('6. sin nombre guardado, el de siempre (Administración · IES Fuente Lucena)', c.peticiones[0].nombreRemitente, REMITENTE);
}
{
  const c = contextoApp(undefined);
  await ejecutar(c.ctx, `CorreoEnviar.guardarUrl("${URL_EXEC}")`);
  await ejecutar(c.ctx, 'CorreoEnviar.enviar({ para: "a@b.es" })');
  comprobar('6. sin módulo de plantillas, sale sin nombre y no revienta', 'nombreRemitente' in c.peticiones[0], false);
}

console.log('--- 7. la cuenta de cada ordenador ---');
{
  const c = contextoApp({ remitente: REMITENTE, cuentaAdministracion: ADMIN });
  comprobar('7. antes de saber nada: no es ámbar', await ejecutar(c.ctx, 'CorreoEnviar.estadoDeCuenta()'),
    { texto: 'Este ordenador envía y recoge con: todavía no se sabe. Pulsa «Probar».', ambar: false });
  await ejecutar(c.ctx, `CorreoEnviar.guardarUrl("${URL_EXEC}")`);
  await ejecutar(c.ctx, 'CorreoEnviar.probar()');
  comprobar('7. se guarda la cuenta que dice el script', await ejecutar(c.ctx, 'CorreoEnviar.cuentaConocida()'), ADMIN);
  comprobar('7. y coincide: línea normal', await ejecutar(c.ctx, 'CorreoEnviar.estadoDeCuenta()'),
    { texto: 'Este ordenador envía con: ' + ADMIN, ambar: false });
  c.responder({ ok: true, version: '21-oct-2026 · fila 411', cuenta: 'fmargon780@g.educaand.es' });
  await ejecutar(c.ctx, 'CorreoEnviar.probar()');
  const e = await ejecutar(c.ctx, 'CorreoEnviar.estadoDeCuenta()');
  comprobarQue('7. otra cuenta: ámbar con el aviso y la cuenta a conectar',
    e.ambar === true && e.texto.indexOf('Este ordenador no usa la cuenta de Administración. Conecta el script de ' + ADMIN + '.') !== -1, JSON.stringify(e));
  c.responder({ ok: true, version: '21-oct-2026 · fila 411', cuenta: ADMIN.toUpperCase() });
  await ejecutar(c.ctx, 'CorreoEnviar.probar()');
  comprobar('7. sin distinguir mayúsculas', (await ejecutar(c.ctx, 'CorreoEnviar.estadoDeCuenta()')).ambar, false);
}
{
  const c = contextoApp({ cuentaAdministracion: ADMIN });
  const l = (a, b, d) => c.ctx.CorreoEnviar.lineaDeCuenta(a, b, d);
  comprobar('7. envía y recoge con la misma', l(ADMIN, ADMIN, ADMIN), { texto: 'Este ordenador envía y recoge con: ' + ADMIN, ambar: false });
  const dis = l(ADMIN, 'otra@x.es', ADMIN);
  comprobarQue('7. recoge con otra: ámbar', dis.ambar === true && dis.texto.indexOf('recoge con: otra@x.es') !== -1, JSON.stringify(dis));
  const sol = l('', ADMIN, ADMIN);
  comprobarQue('7. solo recoge: lo dice y no es ámbar', sol.ambar === false && sol.texto.indexOf('Este ordenador recoge con: ' + ADMIN) === 0, JSON.stringify(sol));
}

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
