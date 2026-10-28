/* Prueba de TODO EL CORREO ENTRA (fila 440, docs/TODO-EL-CORREO-ENTRA.md):
   el recolector de Apps Script (`recogerCorreos`, `recogerLoQueLlega`)
   recoge sin etiquetas todo lo que recibe la cuenta común desde la fecha
   de arranque, y los textos de la app ya no dicen que haga falta GESTOR.

   Mismo patrón que pruebas/hilo-sin-repetir.mjs: `vm` con GmailApp,
   PropertiesService y Session de mentira (Apps Script no corre fuera de
   Google); `guardarHilo`, `carpetaBandeja`, `etiqueta` y `escribirLatido`
   se sustituyen por versiones que solo apuntan lo que se les pide.

   Lo que tiene que pasar:
     1. La primera vuelta apunta la fecha de arranque y no recoge nada anterior.
     2. Un correo recibido después entra sin etiqueta, con «En la app», SIN archivar (fila 480).
     3. Lo que envía la propia cuenta no entra (ni la prueba de «Probar» ni
        un envío a un grupo en copia oculta).
     4. Un hilo que ya está en un asunto (por identificador o por matrícula)
        no entra en «Ha llegado».
     5. Un hilo ya recogido no vuelve a entrar si no hay nada más nuevo.
     6. Una respuesta a un hilo ya recogido vuelve a entrar.
     7. Un hilo con GESTOR, aunque sea anterior al arranque, entra y queda con «En la app», sin archivar.
     8. La búsqueda deja fuera el spam y la papelera, y una segunda vuelta
        no cambia la fecha de arranque.
     9. Se respeta el tope por vuelta.
    10. Los textos de la app ya no piden la etiqueta GESTOR para que llegue un correo. */
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

const fuente = fs.readFileSync(new URL('../apps-script/gestor-correos.gs', import.meta.url), 'utf8');
const CUENTA = '29700692.administracion@g.educaand.es';
const HORA = 3600 * 1000;
const T0 = new Date('2026-10-23T10:00:00Z').getTime();   /* el momento del arranque */

function mensaje(de, fecha, id, extra) {
  return Object.assign({
    getFrom: () => de,
    getDate: () => new Date(fecha),
    getHeader: (h) => (h === 'Message-ID' ? '<' + id + '>' : ''),
    isDraft: () => false
  }, extra || {});
}

function hilo(id, mensajes) {
  const etiquetas = new Set();
  const h = {
    id, etiquetas, archivado: false, mensajes,
    getId: () => id,
    getMessages: () => h.mensajes,
    getFirstMessageSubject: () => 'Asunto ' + id,
    addLabel: (e) => { etiquetas.add(e.nombre); },
    removeLabel: (e) => { etiquetas.delete(e.nombre); },
    moveToArchive: () => { h.archivado = true; },
    moveToInbox: () => { h.archivado = false; },
    markRead: () => { h.leido = true; },
    getLabels: () => Array.from(etiquetas).map((n) => ({ getName: () => n }))
  };
  return h;
}

function nuevoMundo(hilos, seguidos) {
  const propiedades = {};
  const consultas = [];
  const guardados = [];
  const etiquetaGestor = { nombre: 'GESTOR', hilos: [], getThreads: () => etiquetaGestor.hilos.slice() };
  const etiquetaHecho = { nombre: 'En la app' };
  const etiquetaVieja = { nombre: 'GESTOR/Hecho', hilos: [], borrada: false,
    getThreads: (a, n) => etiquetaVieja.hilos.slice(a, a + n), deleteLabel: () => { etiquetaVieja.borrada = true; } };
  let ahoraMs = T0;
  const RealDate = Date;
  class FechaFalsa extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(ahoraMs); }
    static now() { return ahoraMs; }
  }
  const ctx = {
    console, Math, JSON, parseInt, String, Object, Array, Set, Date: FechaFalsa,
    Logger: { log: () => {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(propiedades, k) ? propiedades[k] : null),
        setProperty: (k, v) => { propiedades[k] = v; },
        getKeys: () => Object.keys(propiedades),
        getProperties: () => Object.assign({}, propiedades),
        deleteProperty: (k) => { delete propiedades[k]; }
      })
    },
    Utilities: { formatDate: () => '261023' },
    Session: {
      getScriptTimeZone: () => 'Europe/Madrid',
      getEffectiveUser: () => ({ getEmail: () => CUENTA }),
      getActiveUser: () => ({ getEmail: () => CUENTA })
    },
    GmailApp: {
      search: (q) => { consultas.push(q); return hilos.filter((h) => !h.spam && !h.papelera); },
      getUserLabelByName: (n) => (n === 'GESTOR/Hecho' && !etiquetaVieja.borrada && etiquetaVieja.hilos.length ? etiquetaVieja : null),
      getThreadById: (id) => hilos.find((h) => h.id === id) || null
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fuente, ctx, { filename: 'gestor-correos.gs' });
  ctx.__mundo = {
    guardados, seguidos: seguidos || [],
    etiquetaGestor, etiquetaHecho, etiquetaVieja,
    guardar: (h) => guardados.push(h.id)
  };
  vm.runInContext(`
    guardarHilo = function (h) { __mundo.guardar(h); };
    carpetaBandeja = function () { return {}; };
    etiqueta = function (n) { return n === 'GESTOR' ? __mundo.etiquetaGestor : __mundo.etiquetaHecho; };
    escribirLatido = function () {};
    limpiarEnviosViejos = function () {};
    leerSeguidos = function () { return __mundo.seguidos; };
  `, ctx);
  return {
    ctx, propiedades, consultas, guardados, etiquetaGestor, etiquetaVieja,
    vuelta() { guardados.length = 0; vm.runInContext('recogerCorreos()', ctx); return guardados.slice(); },
    pasar(ms) { ahoraMs += ms; }
  };
}

/* ---------- 1 y 8. arranque ---------- */
console.log('--- 1 y 8. el arranque ---');
{
  const antiguo = hilo('H-antiguo', [mensaje('Ana <ana@correo.es>', T0 - 5 * HORA, 'm-antiguo')]);
  const m = nuevoMundo([antiguo]);
  comprobar('1. la primera vuelta no recoge lo anterior al arranque', m.vuelta(), []);
  comprobar('1. apunta la fecha de arranque', m.propiedades['arranque-bandeja'], String(T0));
  m.pasar(HORA);
  m.vuelta();
  comprobar('8. y no la cambia en la vuelta siguiente', m.propiedades['arranque-bandeja'], String(T0));
  comprobarQue('8. la búsqueda de la bandeja deja fuera spam y papelera',
    m.consultas.some((q) => /-in:spam/.test(q) && /-in:trash/.test(q)), JSON.stringify(m.consultas));
  comprobarQue('8. y mira también la bandeja de entrada', m.consultas.some((q) => /^in:inbox /.test(q)), JSON.stringify(m.consultas));
}

/* ---------- 2. entra sin etiqueta ---------- */
console.log('--- 2. entra sin etiqueta ---');
{
  const nuevo = hilo('H-nuevo', [mensaje('Luis <luis@correo.es>', T0 + HORA, 'm-nuevo')]);
  const cola = [];
  const m = nuevoMundo(cola);
  m.vuelta();            /* arranque */
  cola.push(nuevo);      /* el correo llega después */
  m.pasar(2 * HORA);
  comprobar('2. entra', m.vuelta(), ['H-nuevo']);
  comprobar('2. lleva «En la app»', Array.from(nuevo.etiquetas), ['En la app']);
  comprobar('2. NO se archiva (fila 480, punto 1)', nuevo.archivado, false);
  comprobar('2. y no cambia su estado de leído', nuevo.leido, undefined);
  comprobar('5. otra vuelta sin nada nuevo no lo repite', m.vuelta(), []);
  /* 6. contestan */
  nuevo.mensajes.push(mensaje('Luis <luis@correo.es>', T0 + 3 * HORA, 'm-nuevo-2'));
  m.pasar(HORA);
  comprobar('6. una respuesta vuelve a entrar', m.vuelta(), ['H-nuevo']);
  comprobar('6. y sigue sin archivarse', nuevo.archivado, false);
  comprobar('6. sin repetirse en la vuelta siguiente', m.vuelta(), []);
}

/* ---------- 3. lo que envía la propia cuenta ---------- */
console.log('--- 3. lo que envía la propia cuenta ---');
{
  const prueba = hilo('H-prueba', [mensaje('Gestor <' + CUENTA + '>', T0 + HORA, 'm-prueba')]);
  const grupo = hilo('H-grupo', [mensaje('Administración <' + CUENTA.toUpperCase() + '>', T0 + HORA, 'm-grupo')]);
  const borrador = hilo('H-borrador', [mensaje('Luis <luis@correo.es>', T0 + HORA, 'm-borrador', { isDraft: () => true })]);
  const cola = [];
  const m = nuevoMundo(cola);
  m.vuelta();
  cola.push(prueba, grupo, borrador);
  m.pasar(2 * HORA);
  comprobar('3. ni «Probar», ni un envío a un grupo, ni un borrador', m.vuelta(), []);
  /* y si en el hilo que envió la cuenta contestan, sí entra */
  prueba.mensajes.push(mensaje('Luis <luis@correo.es>', T0 + 3 * HORA, 'm-contestan'));
  m.pasar(HORA);
  comprobar('3. pero la respuesta de un tercero a ese hilo sí', m.vuelta(), ['H-prueba']);
}

/* ---------- 4. hilos de un asunto ---------- */
console.log('--- 4. hilos de un asunto ---');
{
  const porId = hilo('H-id', [mensaje('Ana <ana@correo.es>', T0 + HORA, 'm-id')]);
  const porMatricula = hilo('H-otro-buzon', [mensaje('Ana <ana@correo.es>', T0 + HORA, 'abc123@mail.gmail.com')]);
  const libre = hilo('H-libre', [mensaje('Ana <ana@correo.es>', T0 + HORA, 'm-libre')]);
  const cola = [];
  const m = nuevoMundo(cola, [
    { id: 'H-id', visto: 1, asunto: 'Uno' },
    { id: 'H-no-existe-aqui', visto: 1, asunto: 'Dos', matriculas: ['<ABC123@mail.gmail.com>'] }
  ]);
  m.vuelta();
  cola.push(porId, porMatricula, libre);
  m.pasar(2 * HORA);
  /* seguirHilosConocidos de verdad no corre aquí (GmailApp.getThreadById no existe): se anula */
  vm.runInContext('seguirHilosConocidos = function () {};', m.ctx);
  comprobar('4. solo entra el que no está en un asunto', m.vuelta(), ['H-libre']);
}

/* ---------- 7. GESTOR sigue trayendo lo antiguo ---------- */
console.log('--- 7. GESTOR trae un correo antiguo ---');
{
  const viejo = hilo('H-viejo', [mensaje('Ana <ana@correo.es>', T0 - 30 * 24 * HORA, 'm-viejo')]);
  const m = nuevoMundo([viejo]);
  m.etiquetaGestor.hilos = [viejo];
  viejo.etiquetas.add('GESTOR');
  comprobar('7. entra por la etiqueta', m.vuelta(), ['H-viejo']);
  comprobar('7. pierde GESTOR, gana «En la app» y no se archiva', [Array.from(viejo.etiquetas), viejo.archivado], [['En la app'], false]);
  m.etiquetaGestor.hilos = [];
  m.pasar(HORA);
  comprobar('7. no vuelve a entrar solo', m.vuelta(), []);
}

/* ---------- fila 480: consulta por última vuelta, 90 días, etiqueta vieja, órdenes ---------- */
console.log('--- fila 480. consulta por la última vuelta buena ---');
{
  const cola = [];
  const m = nuevoMundo(cola);
  m.vuelta();   /* arranque en T0 y primera vuelta buena */
  m.pasar(10 * HORA);
  m.vuelta();
  const bandeja = m.consultas.filter((q) => /^in:inbox /.test(q)).pop();
  const desde = parseInt((bandeja.match(/after:(\d+)/) || [])[1], 10);
  comprobar('9. recibidos mira desde la última vuelta buena menos una hora, no desde el arranque',
    desde, Math.floor((T0 + 0) / 1000));
  m.pasar(10 * HORA);
  m.vuelta();
  const bandeja2 = m.consultas.filter((q) => /^in:inbox /.test(q)).pop();
  comprobar('9. y con la vuelta siguiente ya avanza', parseInt((bandeja2.match(/after:(\d+)/) || [])[1], 10), Math.floor((T0 + 10 * HORA) / 1000) - 3600);
  comprobarQue('9. apunta cuándo terminó la última vuelta buena', m.propiedades['ultima-vuelta-buena'] === String(T0 + 20 * HORA), m.propiedades['ultima-vuelta-buena']);
  const segunda = m.consultas.filter((q) => /^-in:inbox /.test(q)).pop();
  comprobarQue('7. la consulta de fuera de recibidos excluye «En la app»', /-label:En-la-app/.test(segunda), segunda);
}
{
  /* Un hilo que ya está en recibidos, ya recogido, no se lee otra vez; la consulta lo deja fuera por la fecha. */
  const viejo = hilo('H-ya', [mensaje('Ana <ana@correo.es>', T0 + HORA, 'm-ya')]);
  const cola = [];
  const m = nuevoMundo(cola);
  m.vuelta();
  cola.push(viejo);
  m.pasar(2 * HORA);
  comprobar('9. se recoge', m.vuelta(), ['H-ya']);
  /* se le borra recogido:<id> (el olvido, a los 90 días) y la consulta lo vuelve a encontrar */
  delete m.propiedades['recogido:H-ya'];
  delete m.propiedades['ultima-vuelta-buena'];
  m.pasar(100 * 24 * HORA);
  comprobar('9. sin recogido:<id> y sin mensaje nuevo, no vuelve a «Ha llegado»', m.vuelta(), []);
  /* con un mensaje recibido nuevo, sí */
  viejo.mensajes.push(mensaje('Ana <ana@correo.es>', T0 + 101 * 24 * HORA, 'm-ya-2'));
  m.pasar(HORA);
  comprobar('9. con un mensaje recibido nuevo, entra', m.vuelta(), ['H-ya']);
}
console.log('--- fila 480. la etiqueta vieja ---');
{
  const h1 = hilo('V1', [mensaje('Ana <ana@correo.es>', T0 - HORA, 'v1')]);
  const h2 = hilo('V2', [mensaje('Ana <ana@correo.es>', T0 - HORA, 'v2')]);
  h1.etiquetas.add('GESTOR/Hecho'); h2.etiquetas.add('GESTOR/Hecho');
  const m = nuevoMundo([h1, h2]);
  m.etiquetaVieja.hilos = [h1, h2];
  m.vuelta();
  comprobar('7. sin la puesta al día de la app no se migra todavía', [Array.from(h1.etiquetas), m.etiquetaVieja.borrada], [['GESTOR/Hecho'], false]);
  m.propiedades['puesta-al-dia-hecha'] = '1';
  m.pasar(HORA);
  m.vuelta();
  comprobar('7. con la puesta al día hecha, los hilos llevan «En la app» y no la vieja', [Array.from(h1.etiquetas), Array.from(h2.etiquetas)], [['En la app'], ['En la app']]);
  comprobar('7. y GESTOR/Hecho se borra', m.etiquetaVieja.borrada, true);
}
{
  const h1 = hilo('V1', [mensaje('Ana <ana@correo.es>', T0 - HORA, 'v1')]);
  h1.etiquetas.add('GESTOR/Hecho');
  const m = nuevoMundo([h1]);
  m.etiquetaVieja.hilos = [h1];
  m.vuelta();
  m.pasar(8 * 24 * HORA);
  m.vuelta();
  comprobar('7. a los 7 días sin puesta al día, se migra igual', [Array.from(h1.etiquetas), m.etiquetaVieja.borrada], [['En la app'], true]);
}
console.log('--- fila 480. órdenes de la app (doPost, accion: gmail) ---');
{
  const a = hilo('O-a', [mensaje('Ana <ana@correo.es>', T0 + HORA, 'o-a')]);
  const soloEnviados = hilo('O-env', [mensaje('Gestor <' + CUENTA + '>', T0 + HORA, 'o-env')]);
  const vieja1 = hilo('O-vieja', [mensaje('Ana <ana@correo.es>', T0 - HORA, 'o-vieja')]);
  const sinEtiqueta = hilo('O-sin', [mensaje('Ana <ana@correo.es>', T0 - HORA, 'o-sin')]);
  vieja1.etiquetas.add('GESTOR/Hecho'); vieja1.archivado = true; sinEtiqueta.archivado = true; soloEnviados.archivado = true;
  const m = nuevoMundo([a, soloEnviados, vieja1, sinEtiqueta]);
  m.propiedades['clave-envio'] = 'K';
  vm.runInContext('ContentService = { createTextOutput: (t) => ({ t, setMimeType() { return this; } }), MimeType: { JSON: 1 } };', m.ctx);
  const llamar = (cuerpo) => JSON.parse(vm.runInContext('doPost', m.ctx)({ postData: { contents: JSON.stringify(Object.assign({ clave: 'K' }, cuerpo)) } }).t);
  let r = llamar({ accion: 'gmail', ordenes: [{ id: 'O-a', leido: true }] });
  comprobar('2. leído: el hilo queda leído y en recibidos', [r.ok, r.resultados['O-a'], a.leido, a.archivado], [true, 'hecho', true, false]);
  r = llamar({ accion: 'gmail', ordenes: [{ id: 'O-a', leido: true, bandeja: 'archivar' }] });
  comprobar('3. descartar: leído y archivado', [a.leido, a.archivado], [true, true]);
  r = llamar({ accion: 'gmail', ordenes: [{ id: 'O-a', bandeja: 'recibidos' }, { id: 'O-env', bandeja: 'recibidos' }, { id: 'O-env2', bandeja: 'archivar' }] });
  comprobar('5. recibidos devuelve el hilo a recibidos', a.archivado, false);
  comprobar('10. un hilo solo de enviados no se mete en recibidos', [soloEnviados.archivado, r.resultados['O-env']], [true, 'hecho']);
  comprobar('8. un hilo que no existe se contesta noEsta', r.resultados['O-env2'], 'noEsta');
  r = llamar({ accion: 'gmail', ponerAlDia: [{ id: 'O-vieja' }, { id: 'O-sin' }], ultima: true });
  comprobar('10. la puesta al día mueve a recibidos solo el que lleva GESTOR/Hecho', [vieja1.archivado, sinEtiqueta.archivado, r.ponerAlDia], [false, true, 1]);
  comprobar('6. y apunta que está hecha', m.propiedades['puesta-al-dia-hecha'] !== undefined, true);
  r = llamar({ accion: 'gmail', clave: 'mala', ordenes: [{ id: 'O-a', bandeja: 'archivar' }] });
  comprobar('8. con la clave mala no se toca nada', [r.ok, a.archivado], [false, false]);
  comprobarQue('8. el script dice su versión de la fila 480', /fila 480/.test(llamar({ accion: 'gmail', ordenes: [] }).version || ''));
}

/* ---------- 9. el tope ---------- */
console.log('--- 9. el tope por vuelta ---');
{
  const muchos = [];
  for (let i = 0; i < 30; i++) muchos.push(hilo('H-' + i, [mensaje('Ana <ana@correo.es>', T0 + HORA + i, 'm-' + i)]));
  const cola = [];
  const m = nuevoMundo(cola);
  m.vuelta();
  cola.push(...muchos);
  m.pasar(2 * HORA);
  const primera = m.vuelta();
  comprobar('9. como mucho 20 por vuelta', primera.length, 20);
  comprobar('9. la siguiente trae el resto, sin repetir', m.vuelta().length, 10);
  comprobar('9. y luego nada', m.vuelta(), []);
}

/* ---------- 10. los textos de la app ---------- */
console.log('--- 10. los textos de la app ---');
{
  const leer = (f) => fs.readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
  const ajustes = leer('bandeja-ajustes.js');
  comprobarQue('10. Ajustes dice que entra todo lo que llega', /todo lo que llega|todo correo|todos los correos/i.test(ajustes) && /traer un correo antiguo/.test(ajustes));
  comprobarQue('10. Ajustes ya no dice que se ponga GESTOR para que llegue', !/le pones a un correo la etiqueta/.test(ajustes));
  comprobarQue('10. «Descartar» dice lo nuevo', /Si contestan en esta conversación, o si le pones la etiqueta GESTOR, volverá a la bandeja\./.test(leer('bandeja-guardar.js')));
  comprobarQue('10. el problema «no llegan correos» ya no culpa a la etiqueta', !/llevan la etiqueta GESTOR/.test(leer('problemas-textos.js')));
  comprobarQue('10. el latido ya no dice «con la etiqueta GESTOR no llegan»', !/con la etiqueta GESTOR no llegan/.test(leer('bandeja-latido.js')));
  comprobarQue('10. «Qué hay de nuevo» lo cuenta', /id: '440'/.test(leer('novedades.js')));
}

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
