/* Fila 480 (docs/CORREO-SE-QUEDA-EN-RECIBIDOS.md): el correo se queda en recibidos y Gmail refleja lo que pasa en la app.

   A. (vm) js/correo-gmail.js con un script de mentira: las órdenes por hilo (leído una vez puesto no se quita; la última
      bandeja gana), el reintento con el script sin contestar (fichero por ordenador, dos órdenes del mismo hilo dejan la
      última, sale al volver el script), más de un día sin salir = tarjeta, y la puesta al día única (una sola vez, con dos
      ordenadores solo uno, solo asuntos abiertos y fichas sin decidir).
   B. (Chromium, ?demo=1&auto=1) los enganches de la pantalla: meter un correo en un asunto manda «leído»; «Descartar»
      manda «leído + archivar» y su cuadro dice el texto nuevo; archivar un asunto con dos hilos manda «archivar» de los
      dos, el cuadro lleva la línea nueva (y no la lleva sin hilos); reabrir manda «recibidos» de todos. */
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

/* ---------- A. el módulo ---------- */
console.log('--- A. js/correo-gmail.js ---');
function mundo(opciones) {
  opciones = opciones || {};
  const ficheros = opciones.ficheros || new Map();          /* "carpeta/nombre" -> texto, compartido entre ordenadores */
  const enviadas = [];
  const estado = { contesta: true, version: '28-oct-2026 · fila 480', hecho: opciones.hecho || (() => 'hecho') };
  const dir = (nombre) => ({ nombre, removeEntry: async (n) => { ficheros.delete(nombre + '/' + n); } });
  const ctx = {
    console, setTimeout, clearTimeout, setInterval: () => 0, Date, JSON, Math, Object, Array, Promise,
    document: undefined,
    __sinReintentosDeGmail: true,
    U: { ordenador: () => opciones.ordenador || 'aaaaaa' },
    App: { E: { gestor: dir('_GESTOR'), registro: { asuntos: opciones.asuntos || {} } }, cargarRegistro: async () => {} },
    Carpetas: {
      bajar: async (d, ruta) => dir(d.nombre + '/' + ruta.join('/')),
      leerJson: async (d, n) => { const t = ficheros.get(d.nombre + '/' + n); return t === undefined ? null : JSON.parse(t); },
      escribirTexto: async (d, n, t) => { ficheros.set(d.nombre + '/' + n, t); }
    },
    BandejaNucleo: { correos: () => opciones.bandeja || [] },
    CorreoEnviar: {
      tieneConexion: () => opciones.sinConexion !== true,
      versionConocida: () => estado.version,
      enviar: async (cuerpo) => {
        enviadas.push(JSON.parse(JSON.stringify(cuerpo)));
        if (!estado.contesta) return { ok: false, motivo: 'sin red' };
        const resultados = {};
        (cuerpo.ordenes || []).forEach((o) => { resultados[o.id] = estado.hecho(o); });
        return { ok: true, resultados, ponerAlDia: 0, version: estado.version };
      }
    },
    Problemas: { calculador() {}, registrar() {}, recalcular() {} },
    ProblemasTextos: { gmailPendiente: (n) => ({ n }) }
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(leer('js/correo-gmail.js'), ctx);
  return { ctx, ficheros, enviadas, estado };
}
const ejecutar = (m, e) => vm.runInContext('(async () => (' + e + '))()', m.ctx);
const pendientes = async (m) => JSON.parse(JSON.stringify(await ejecutar(m, 'CorreoGmail.pendientes()')));

{
  const m = mundo();
  await ejecutar(m, "CorreoGmail.ordenar([{ id: 'H1', matriculas: ['a@x'] }], { leido: true })");
  await ejecutar(m, 'CorreoGmail.vaciar()');
  const o = m.enviadas[0];
  comprobar('2. «leído» llega al script como orden de ese hilo, sin bandeja', [o.accion, o.ordenes], ['gmail', [{ id: 'H1', matriculas: ['a@x'], leido: true }]]);
  comprobar('2. y al hacerse sale de pendientes', await pendientes(m), {});
}
{
  const m = mundo();
  m.estado.contesta = false;
  await ejecutar(m, "CorreoGmail.descartado({ id: 'H2', matriculas: [] })");
  await ejecutar(m, "CorreoGmail.asuntoReabierto([{ id: 'H2', matriculas: [] }])");   /* gana la última bandeja; leído se queda */
  const p = await pendientes(m);
  comprobar('8. el script sin contestar: queda UNA orden del hilo, leído y la última bandeja', [Object.keys(p), p.H2.leido, p.H2.bandeja], [['H2'], true, 'recibidos']);
  comprobar('8. en el fichero propio de este ordenador', Array.from(m.ficheros.keys()), ['_GESTOR/gmail-pendiente/aaaaaa.json']);
  const antes = m.enviadas.length;
  m.estado.contesta = true;
  await ejecutar(m, 'CorreoGmail.tick()');
  comprobar('8. al volver el script, sale y desaparece de la lista', [m.enviadas.length > antes, await pendientes(m)], [true, {}]);
  comprobar('8. y el fichero queda sin órdenes', JSON.parse(m.ficheros.get('_GESTOR/gmail-pendiente/aaaaaa.json')), { ordenes: {} });
}
{
  const m = mundo({ sinConexion: true });
  await ejecutar(m, "CorreoGmail.asuntoArchivado([{ id: 'H3' }, { id: 'H4' }])");
  comprobar('4. archivar un asunto con dos hilos apunta «archivar» de los dos (sin conexión se queda)', Object.keys(await pendientes(m)).sort(), ['H3', 'H4']);
  comprobar('4. y sin conexión no se llama a nadie', m.enviadas.length, 0);
}
{
  const m = mundo();
  m.estado.contesta = false;
  await ejecutar(m, "CorreoGmail.asuntoArchivado([{ id: 'H5' }])");
  const antes = vm.runInContext('CorreoGmail._atascadas', m.ctx);
  const ahora = Date.now();
  comprobar('8. con menos de un día no es problema', antes(await pendientes(m), ahora), []);
  comprobar('8. con más de un día sin salir, sí', antes(await pendientes(m), ahora + 25 * 3600 * 1000), ['H5']);
}
{
  const m = mundo();
  m.estado.version = '27-oct-2026 · fila 471';
  await ejecutar(m, "CorreoGmail.descartado({ id: 'H6' })");
  comprobar('8. con un script anterior a esta fila no se manda nada, se guarda', [m.enviadas.length, Object.keys(await pendientes(m))], [0, ['H6']]);
}
{
  const m = mundo({ hecho: (o) => (o.id === 'X' ? 'noEsta' : o.id === 'Y' ? 'error' : 'hecho') });
  await ejecutar(m, "CorreoGmail.ordenar([{ id: 'X' }, { id: 'Y' }, { id: 'Z' }], { leido: true })");
  await ejecutar(m, 'CorreoGmail.vaciar()');
  comprobar('8. «noEsta» se da por hecho; un error se reintenta', Object.keys(await pendientes(m)), ['Y']);
}
{
  const hilos = [];
  for (let i = 0; i < 60; i++) hilos.push({ id: 'T' + i });
  const m = mundo();
  await ejecutar(m, 'CorreoGmail.ordenar(' + JSON.stringify(hilos) + ', { leido: true })');
  await ejecutar(m, 'CorreoGmail.vaciar()');
  comprobar('8. 60 órdenes salen por tandas de 25 y quedan vacías', [m.enviadas.every((e) => e.ordenes.length <= 25), await pendientes(m)], [true, {}]);
}

/* La puesta al día */
const ASUNTOS = {
  'A-abierto': { estado: 'abierto', hilos: [{ id: 'P1', matriculas: ['p1@x'] }, { id: 'P2' }] },
  'A-otro': { estado: 'abierto', hilos: [{ id: 'P2' }, { id: 'P3' }] },
  'A-cerrado': { estado: 'cerrado', hilos: [{ id: 'P9' }] },
  'A-sin': { estado: 'abierto' }
};
const BANDEJA = [{ datos: { id: 'B1', matriculas: ['b1@x'] } }, { datos: { id: 'P1' } }];
function alDia(m) { return m.enviadas.filter((e) => e.ponerAlDia); }
{
  const m = mundo({ asuntos: ASUNTOS, bandeja: BANDEJA });
  const r = await ejecutar(m, 'CorreoGmail.ponerAlDia()');
  const ids = [].concat(...alDia(m).map((e) => e.ponerAlDia.map((h) => h.id))).sort();
  comprobar('6. la puesta al día lleva los hilos de asuntos abiertos y de fichas sin decidir, sin repetir ni cerrados', [r.ok, ids], [true, ['B1', 'P1', 'P2', 'P3']]);
  comprobar('6. la última tanda lleva «ultima»', alDia(m).pop().ultima, true);
  comprobar('6. deja la marca de hecha en _GESTOR', JSON.parse(m.ficheros.get('_GESTOR/gmail-puesta-al-dia.json')).estado, 'hecha');
  const antes = m.enviadas.length;
  const otra = await ejecutar(m, 'CorreoGmail.ponerAlDia()');
  comprobar('6. una sola vez: la segunda no manda nada', [otra.yaHecha, m.enviadas.length], [true, antes]);
}
{
  const ficheros = new Map();
  const a = mundo({ asuntos: ASUNTOS, bandeja: BANDEJA, ficheros, ordenador: 'aaaaaa' });
  const b = mundo({ asuntos: ASUNTOS, bandeja: BANDEJA, ficheros, ordenador: 'bbbbbb' });
  const [ra, rb] = await Promise.all([ejecutar(a, 'CorreoGmail.ponerAlDia()'), ejecutar(b, 'CorreoGmail.ponerAlDia()')]);
  comprobar('6. con dos ordenadores a la vez, solo uno la hace', [ra.ok, rb.ok, alDia(a).length > 0, alDia(b).length > 0].sort(), [false, false, true, true].sort());
  comprobar('6. exactamente uno de los dos llamó al script', (alDia(a).length > 0) !== (alDia(b).length > 0), true);
}
{
  const m = mundo({ asuntos: ASUNTOS });
  m.estado.version = '27-oct-2026 · fila 471';
  const r = await ejecutar(m, 'CorreoGmail.ponerAlDia()');
  comprobar('6. con un script viejo no se hace ni se marca', [r.ok, m.ficheros.has('_GESTOR/gmail-puesta-al-dia.json'), m.enviadas.length], [false, false, 0]);
}
{
  const m = mundo({ asuntos: ASUNTOS });
  m.estado.contesta = false;
  const r = await ejecutar(m, 'CorreoGmail.ponerAlDia()');
  comprobar('6. si el script no contesta, no queda marcada como hecha', [r.ok, m.ficheros.has('_GESTOR/gmail-puesta-al-dia.json')], [false, false]);
}

/* ---------- B. la pantalla ---------- */
console.log('--- B. los enganches de la pantalla (demostración) ---');
const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&latido=ok';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 1000 } });
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForFunction(() => window.CorreoGmail && window.BandejaNucleo && BandejaNucleo.correos().length >= 2 && App.E && App.E.abiertos, null, { timeout: 30000 });
/* Las cuatro puertas de CorreoGmail apuntan lo que se les pide, sin llamar a Gmail. */
await pagina.evaluate(() => {
  window.__gmail = [];
  ['metidoEnUnAsunto', 'descartado'].forEach((q) => { CorreoGmail[q] = (d) => { window.__gmail.push([q, d && d.id]); }; });
  ['asuntoArchivado', 'asuntoReabierto'].forEach((q) => { CorreoGmail[q] = (h) => { window.__gmail.push([q, (h || []).map((x) => x.id)]); }; });
});
await pagina.evaluate(() => { if (window.NotasDirectivos) NotasDirectivos.antesDeArchivar = async () => true; });
const gmail = () => pagina.evaluate(() => { const v = window.__gmail.slice(); window.__gmail.length = 0; return v; });

/* 3. descartar */
const correo = await pagina.evaluate(() => { const c = BandejaNucleo.correos()[0]; return { id: c.datos.id, asunto: c.datos.asunto }; });
pagina.evaluate((c) => { window.__descartado = Bandeja.descartar ? Bandeja.descartar(BandejaNucleo.correos().find((x) => x.datos.id === c.id)) : null; }, correo);
await pagina.waitForSelector('#capa .cuadro', { timeout: 10000 }).catch(() => {});
const textoDescartar = await pagina.evaluate(() => { const c = document.querySelector('#capa .cuadro'); return c ? c.innerText : ''; });
comprobar('3. el cuadro de «Descartar» lleva el texto nuevo',
  [/Se quita de la bandeja sin crear ningún asunto\./.test(textoDescartar), textoDescartar.indexOf(correo.asunto) !== -1,
   /En Gmail se marca como leído y se archiva\. Si contestan en esta conversación, o si le pones la etiqueta GESTOR, volverá a la bandeja\./.test(textoDescartar)],
  [true, true, true]);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__gmail.length > 0, null, { timeout: 10000 });
comprobar('3. descartar manda «leído + archivar» de ese hilo', await gmail(), [['descartado', correo.id]]);

/* 4 y 5. archivar y reabrir un asunto con dos hilos, y otro sin hilos */
const nombres = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos || {}).filter((n) => App.E.registro.asuntos[n].estado !== 'cerrado'));
comprobar('4. la demostración trae asuntos abiertos', nombres.length >= 2, true);
async function archivar(nombre, hilos) {
  const prom = pagina.evaluate(async ([n, h]) => {
    const ficha = Object.assign({}, App.E.registro.asuntos[n], { hilos: h });
    const a = { nombre: n, ficha: ficha, leido: { categoria: ficha.categoria } };
    window.__a = a; (window.__fichas = window.__fichas || {})[n] = JSON.parse(JSON.stringify(ficha));
    await App.cerrarAsunto(a);
  }, [nombre, hilos]);
  await pagina.waitForSelector('#capa .cuadro', { timeout: 15000 });
  const texto = await pagina.evaluate(() => document.querySelector('#capa .cuadro').innerText);
  return { texto, prom };
}
{
  const { texto, prom } = await archivar(nombres[0], [{ id: 'HA', matriculas: [] }, { id: 'HB', matriculas: ['b@x'] }]);
  comprobar('4. el cuadro «Archivar el asunto» lleva «Sus correos también se archivan en Gmail.»', /Sus correos también se archivan en Gmail\./.test(texto), true);
  comprobar('4. y va debajo de la carpeta de destino', texto.indexOf('Sus correos también') > texto.indexOf(' / '), true);
  await pagina.click('#cuadro-aceptar');
  await prom.catch(() => {});
  await pagina.waitForFunction(() => window.__gmail.length > 0, null, { timeout: 30000 });
  comprobar('4. al acabar el archivado manda «archivar» de los dos hilos', await gmail(), [['asuntoArchivado', ['HA', 'HB']]]);
}
{
  const { texto, prom } = await archivar(nombres[1], []);
  comprobar('4. sin hilos de correo, el cuadro no lleva esa línea', /Gmail/.test(texto), false);
  await pagina.click('#cuadro-aceptar');
  await prom.catch(() => {});
  await pagina.waitForTimeout(1500);
  comprobar('4. y no manda nada', await gmail(), []);
}
{
  /* reabrir el primero: sus hilos están en la ficha archivada */
  const prom = pagina.evaluate(async (n) => {
    const ficha = Object.assign({}, window.__fichas[n], { hilos: [{ id: 'HA' }, { id: 'HB' }] });
    await App.reabrirAsunto({ nombre: n, ficha: ficha });
  }, nombres[0]).catch(() => {});
  await pagina.waitForSelector('#capa .cuadro', { timeout: 15000 });
  await pagina.click('#cuadro-aceptar');
  await prom;
  await pagina.waitForTimeout(1000);
  const reabierto = await gmail();
  comprobar('5. reabrir manda «recibidos» de todos los hilos', reabierto, [['asuntoReabierto', ['HA', 'HB']]]);
}

/* 2. los otros dos sitios que meten un correo en un asunto están enganchados */
const guardar = leer('js/bandeja-guardar.js');
comprobar('2. guardar en un asunto, anotarlo si ya estaba y crear el asunto con el correo mandan «leído»', (guardar.match(/enGmail\('metidoEnUnAsunto', d\)/g) || []).length, 3);
comprobar('7. los textos de la app no dicen ya que el correo se archive al recogerlo', /Descartar/.test(guardar) && !/El correo sigue en Gmail\. /.test(guardar), true);
comprobar('sin errores en la consola', errores, []);
await contexto.close();
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
