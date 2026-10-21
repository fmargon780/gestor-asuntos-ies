/* Prueba en navegador de verdad de la fila 398
   (docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md, parte 2): archivar sin
   esperar. Disco de mentira de pruebas/navegador.mjs, con el traslado de
   carpetas más lento (1 s) para poder mirar lo que pasa mientras dura.

   1. Dos asuntos seguidos, sin esperar: los dos salen de la lista al
      momento, sale «Archivando…» (con los dos números), y al acabar los dos
      están en el ARCHIVO, sin marca y sin aviso.
   2. El traslado falla: el asunto vuelve a la lista, aviso rojo con botón de
      cerrar y el número real, sin marca; al repetir, se archiva.
   3. Otro ordenador lo está archivando: tarjeta apagada con «Archivándose en
      otro ordenador…»; si la marca tiene más de una hora, normal.
   4. Este ordenador dejó uno a medias (cerró la pestaña): al volver, lo
      termina solo.
   5. Quien llama a App.cerrarAsunto directamente sigue esperando a que acabe. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const N = (i) => `A26-039${i} MATRICULA 26-27 Fondo ${i}, Ana 398000${i}`;
const T = (i) => `Fondo ${i}, Ana 398000${i}`;

await pagina.evaluate(async ([nombres, terceros]) => {
  for (let i = 0; i < nombres.length; i++) {
    const h = await window.__disco.abiertos.getDirectoryHandle(nombres[i], { create: true });
    h._hijos.set('papel.txt', window.__disco.fich('papel.txt', 'contenido ' + i));
    const actual = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json') || { asuntos: {} };
    actual.asuntos[nombres[i]] = { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: terceros[i], estado: 'abierto', notas: [] };
    await window.Carpetas.guardarJson(window.App.E.gestor, 'asuntos.json', actual);
  }
  await window.App.cargarRegistro();
  await window.App.verAbiertos();
  window.__avisos = [];
  const aviso = window.U.aviso;
  window.U.aviso = function (t, ...r) { window.__avisos.push(String(t)); return aviso.call(this, t, ...r); };
  /* El traslado tarda 1 s (o falla si __fallaMover). */
  const mover = window.Carpetas.mover.bind(window.Carpetas);
  window.__fallaMover = false;
  window.Carpetas.mover = async function (...args) {
    await new Promise((r) => setTimeout(r, 1000));
    if (window.__fallaMover) { const e = new Error('Dropbox tiene un fichero abierto'); e.name = 'InvalidStateError'; throw e; }
    return mover(...args);
  };
}, [[1, 2, 3, 4, 5].map(N), [1, 2, 3, 4, 5].map(T)]);

const pulsar = (i) => pagina.evaluate(async (n) => {
  const a = window.App.E.listaAbiertos.find((x) => x.nombre === n);
  window['__fin' + n] = 'esperando';
  window.ArchivarFondo.archivar(a).then(() => { window['__fin' + n] = 'liberado'; }, (e) => { window['__fin' + n] = 'error:' + e.message; });
}, N(i));
const aceptar = async () => { await pagina.waitForSelector('#capa:not(.oculto)'); await pagina.click('#cuadro-aceptar'); };
const enLista = (i) => pagina.evaluate((n) => window.App.E.listaAbiertos.some((x) => x.nombre === n), N(i));
const enArchivo = (i) => pagina.evaluate(async ([n, t]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(t, { create: true });
  return ter._hijos.has(n);
}, [N(i), T(i)]);
const marca = (i) => pagina.evaluate((n) => { const f = window.App.E.registro.asuntos[n]; return !!(f && f.archivandose); }, N(i));

console.log('--- 1. dos asuntos seguidos, sin esperar ---');
await pulsar(1);
await aceptar();
await pagina.waitForFunction((n) => window['__fin' + n] === 'liberado', N(1), { timeout: 5000 });
await pulsar(2);
await aceptar();
await pagina.waitForFunction((n) => window['__fin' + n] === 'liberado', N(2), { timeout: 5000 });
await comprobar('1. los dos han salido de la lista al momento', Promise.all([enLista(1), enLista(2)]), [false, false]);
await comprobar('1. los demás siguen en la lista', Promise.all([enLista(3), enLista(4)]), [true, true]);
await comprobar('1. sale «Archivando…» con los dos números', pagina.locator('#archivando-fondo').innerText(), 'Archivando A26-0391, A26-0392…');
await comprobar('1. la carpeta todavía no se ha movido', enArchivo(1), false);
await pagina.waitForSelector('#archivando-fondo', { state: 'detached', timeout: 20000 });
await comprobar('1. los dos están en el ARCHIVO', Promise.all([enArchivo(1), enArchivo(2)]), [true, true]);
await comprobar('1. ya no están en Asuntos abiertos', pagina.evaluate((ns) => ns.map((n) => window.__disco.abiertos._hijos.has(n)), [N(1), N(2)]), [false, false]);
await comprobar('1. sin marca «archivándose» (la ficha bajó a su carpeta)', Promise.all([marca(1), marca(2)]), [false, false]);
await comprobar('1. el aviso verde de siempre', pagina.evaluate(() => window.__avisos.filter((t) => t === 'Asunto archivado.').length), 2);
await comprobar('1. no sale ningún aviso rojo', pagina.locator('.mensaje.malo').count(), 0);

console.log('--- 2. el traslado falla ---');
await pagina.evaluate(() => { window.__fallaMover = true; });
await pulsar(3);
await aceptar();
await pagina.waitForFunction((n) => window['__fin' + n] === 'liberado', N(3), { timeout: 5000 });
await comprobar('2. sale de la lista al momento', enLista(3), false);
await pagina.waitForSelector('.guardado-pendiente-cerrable', { timeout: 20000 });
await comprobar('2. aviso rojo con el número real y sin mover nada',
  pagina.locator('.guardado-pendiente-cerrable > span').first().evaluate((e) => e.firstChild.textContent),
  'No se ha podido archivar el asunto A26-0393. No se ha movido nada. Vuelve a pulsar Archivar.');
await comprobar('2. el aviso lleva botón de cerrar', pagina.locator('.guardado-pendiente-cerrable button').count(), 1);
await comprobar('2. el asunto vuelve a la lista', enLista(3), true);
await comprobar('2. sigue en Asuntos abiertos y no en el archivo', Promise.all([
  pagina.evaluate((n) => window.__disco.abiertos._hijos.has(n), N(3)), enArchivo(3)]), [true, false]);
await comprobar('2. sin marca', marca(3), false);
await comprobar('2. ya no sale «Archivando…»', pagina.locator('#archivando-fondo').count(), 0);
await pagina.click('.guardado-pendiente-cerrable button');
await pagina.evaluate(() => { window.__fallaMover = false; });
await pulsar(3);
await aceptar();
await pagina.waitForSelector('#archivando-fondo', { state: 'detached', timeout: 20000 });
await comprobar('2. al repetir, se archiva', enArchivo(3), true);

console.log('--- 3. otro ordenador lo está archivando ---');
await pagina.evaluate(async ([n4, n5]) => {
  const ahora = new Date();
  await window.App.anotar(n4, { archivandose: { equipo: 'otro-equipo', por: 'Ana', desde: ahora.toISOString(), categoria: 'ALUMNADO', tercero: 'x' } });
  await window.App.anotar(n5, { archivandose: { equipo: 'otro-equipo', por: 'Ana', desde: new Date(ahora - 2 * 3600 * 1000).toISOString(), categoria: 'ALUMNADO', tercero: 'x' } });
  await window.App.verAbiertos();
}, [N(4), N(5)]);
await comprobar('3. la tarjeta dice «Archivándose en otro ordenador…»', pagina.locator('.archivandose-otro').count(), 1);
await comprobar('3. y sus botones están apagados', pagina.evaluate((n) => {
  const t = [...document.querySelectorAll('.tarjeta-ocupada, .inicio-tabla-fila-ocupada')];
  return t.length >= 1 && t.every((x) => [...x.querySelectorAll('button')].every((b) => b.disabled));
}, N(4)), true);
await comprobar('3. con la marca de hace dos horas, no (se da por abandonada)',
  pagina.evaluate((n) => window.ArchivarFondo.enOtroOrdenador(window.App.E.registro.asuntos[n]), N(5)), false);

console.log('--- 4. este ordenador lo dejó a medias ---');
await pagina.evaluate(async ([n4]) => {
  await window.App.anotar(n4, { archivandose: { equipo: window.ArchivarFondo._miEquipo(), por: 'Francisco', desde: new Date().toISOString(), categoria: 'ALUMNADO', tercero: 'Fondo 4, Ana 3980004' } });
  window.ArchivarFondo._retomarOtraVez();
  await window.App.verAbiertos();
}, [N(4)]);
await pagina.waitForSelector('#archivando-fondo', { timeout: 5000 });
await pagina.waitForSelector('#archivando-fondo', { state: 'detached', timeout: 20000 });
await comprobar('4. lo termina solo: está en el ARCHIVO', enArchivo(4), true);

console.log('--- 5. quien llama a App.cerrarAsunto directamente espera ---');
await pagina.evaluate(async (n5) => {
  const a = window.App.E.listaAbiertos.find((x) => x.nombre === n5);
  window.__directo = window.App.cerrarAsunto(a).then(() => 'acabado');
}, N(5));
await aceptar();
await comprobar('5. al volver, la carpeta ya está en el ARCHIVO', pagina.evaluate(() => window.__directo).then(() => enArchivo(5)), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
