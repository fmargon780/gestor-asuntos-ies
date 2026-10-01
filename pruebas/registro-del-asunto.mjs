/* Prueba en navegador de verdad de la fila 229 (30-sep-2026,
   docs/REGISTRO-DEL-ASUNTO.md): el registro del asunto.

   1. La ficha: tarjeta «Registro» con las notas y lo automático de todos los
      hitos, mezclado por fecha, lo más nuevo arriba, con la etiqueta del hito.
   2. La mesa de un hito: «Registro», solo sus líneas, en una sola lista.
   3. Anotar desde la mesa (con hito) y desde la ficha (sin hito, Intro guarda).
   4. Lo automático (marcar una tarea, dar el hito por hecho, reabrirlo) sale
      en gris y sin «⋮».
   5. «⋮» en lo escrito a mano: Cambiar y Borrar.
   6. La etiqueta abre la mesa del hito.
   7. Una línea automática sin hito va a la libreta con `auto`.
   8. El historial del archivo lleva el registro. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
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
async function esperar(fn, arg) {
  for (let i = 0; i < 100; i++) {
    if (await pagina.evaluate(fn, arg)) return true;
    await pagina.waitForTimeout(100);
  }
  return false;
}

const ANA = '260901 MATRICULA 26-27 Pérez, Ana 1234';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (n) => { await window.__disco.abiertos.getDirectoryHandle(n, { create: true }); }, ANA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await esperar(async () => Carpetas.existeFichero(App.E.gestor, NotasHito.MARCA));

await pagina.evaluate(async (ana) => {
  await App.anotar(ana, { tercero: 'Pérez, Ana 1234', categoria: 'ALUMNADO',
    notas: [
      { texto: 'Llamada de la madre', quien: 'Francisco', cuando: '2026-09-01T10:00:00.000Z', hito: 'h1', hitoTitulo: 'Recoger los papeles' },
      { texto: 'Dice la directora que se admite', quien: 'Compañero', cuando: '2026-09-03T10:00:00.000Z', hito: 'h2', hitoTitulo: 'Tramitar' },
      { texto: 'Sin hito, a mano', quien: 'Francisco', cuando: '2026-09-04T10:00:00.000Z' },
      { texto: 'Asunto creado', quien: 'Francisco', cuando: '2026-08-31T10:00:00.000Z', auto: true }
    ] });
  await Hitos.cambiar(function (d) {
    d.porAsunto[ana] = { creados: U.hoyIso(), hitos: [
      Hitos.normalizarHito({ id: 'h1', titulo: 'Recoger los papeles', clase: 'paso', estado: 'encurso',
        guionPropio: [{ id: 't1', texto: 'Comprobar el DNI', explicacion: '', accion: '' }],
        notas: [{ texto: 'Generado «Justificante»', quien: 'Francisco', cuando: '2026-09-02T10:00:00.000Z' }] }),
      Hitos.normalizarHito({ id: 'h2', titulo: 'Tramitar', clase: 'paso', estado: 'pendiente',
        notas: [{ texto: 'Correo enviado a la familia', quien: 'Francisco', cuando: '2026-09-05T10:00:00.000Z' }] })
    ] };
    return d;
  });
  await App.verAbiertos();
}, ANA);

console.log('--- 1. la ficha ---');
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter(a => a.nombre === n)[0], 'abierto'), ANA);
await pagina.waitForSelector('#ficha-notas-lista', { state: 'attached' });
const ficha = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#ficha-notas-lista .registro-linea'), x => ({
  t: x.querySelector('.nota-texto').textContent, hito: (x.querySelector('.nota-hito') || {}).textContent || '',
  auto: x.classList.contains('registro-auto'), mas: !!x.querySelector('.registro-mas') })));
await comprobar('todas las líneas, de todos los hitos, por fecha, la más nueva arriba', ficha().then(l => l.map(x => x.t)), [
  'Correo enviado a la familia', 'Sin hito, a mano', 'Dice la directora que se admite', 'Generado «Justificante»', 'Llamada de la madre', 'Asunto creado']);
await comprobar('la etiqueta del hito y lo automático en gris', ficha().then(l => l.map(x => [x.hito, x.auto])), [
  ['⚑ Tramitar', true], ['', false], ['⚑ Tramitar', false], ['⚑ Recoger los papeles', true], ['⚑ Recoger los papeles', false], ['', true]]);
await comprobar('solo lo escrito a mano lleva «⋮»', ficha().then(l => l.map(x => x.mas)), [false, true, true, false, true, false]);
await comprobar('la tarjeta se llama «Registro»', pagina.evaluate(() => document.body.textContent.indexOf('Registro') !== -1 && !!document.querySelector('[data-cuenta-tarjeta="notas"]').parentNode.textContent.match(/Registro/)), true);

console.log('--- 6. la etiqueta abre la mesa ---');
await pagina.evaluate(() => Array.prototype.filter.call(document.querySelectorAll('#ficha-notas-lista .nota-hito'), b => b.textContent.indexOf('Recoger') !== -1)[0].click());
await esperar(() => HitoMesa.estaAbierta && HitoMesa.estaAbierta());
await comprobar('mesa de «Recoger los papeles»', pagina.evaluate(() => !!document.querySelector('#ficha-guia .hito[data-id="h1"] .mesa-notas')), true);

console.log('--- 2. la mesa ---');
await pagina.evaluate(() => HitoMesa.abrirTarjeta('notas'));
const mesa = () => pagina.evaluate(() => Array.prototype.map.call(
  document.querySelectorAll('#ficha-guia .hito[data-id="h1"] .mesa-notas .hito-notas .registro-linea'), x => [x.querySelector('.nota-texto').textContent, x.classList.contains('registro-auto')]));
await comprobar('solo las líneas de ese hito, una sola lista', mesa(), [['Generado «Justificante»', true], ['Llamada de la madre', false]]);

console.log('--- 3. anotar desde la mesa ---');
const ta = '#ficha-guia .hito[data-id="h1"] .hito-nota-texto';
await pagina.fill(ta, 'Se ha visitado al tutor');
await pagina.press(ta, 'Enter');
await esperar(() => Array.prototype.some.call(document.querySelectorAll('#ficha-notas-lista .nota-texto'), x => x.textContent === 'Se ha visitado al tutor'));
await comprobar('sale arriba en la mesa', mesa().then(l => l[0]), ['Se ha visitado al tutor', false]);
await comprobar('y en la ficha, con la etiqueta de ese hito', pagina.evaluate(() => {
  const f = Array.prototype.filter.call(document.querySelectorAll('#ficha-notas-lista .registro-linea'), x => x.querySelector('.nota-texto').textContent === 'Se ha visitado al tutor')[0];
  return f && f.querySelector('.nota-hito').textContent;
}), '⚑ Recoger los papeles');

console.log('--- 4. lo automático ---');
await pagina.evaluate(() => HitoMesa.abrirTarjeta('guion'));
await pagina.waitForSelector('#ficha-guia .hito[data-id="h1"] .guion-casilla');
await pagina.click('#ficha-guia .hito[data-id="h1"] .guion-casilla');
/* Con la única tarea hecha, la mesa pregunta si se da el hito por hecho: que no. */
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(800);
await pagina.evaluate(() => HitoMesa.abrirTarjeta('notas'));
await comprobar('marcar una tarea deja su línea en gris', mesa().then(l => l.filter(x => x[0].indexOf('Tarea hecha') === 0)), [['Tarea hecha: Comprobar el DNI', true]]);
await comprobar('la línea de dar por hecho y de reabrir', pagina.evaluate(() =>
  [RegistroAsunto.notaDeEstado('encurso', 'hecho'), RegistroAsunto.notaDeEstado('hecho', 'encurso'), RegistroAsunto.notaDeEstado('encurso', 'pendiente')]), ['Dado por hecho', 'Reabierto', '']);
await pagina.evaluate(async () => { await Hitos.marcar(FichaNucleo.actual.nombre, 'h1', 'hecho', RegistroAsunto.notaDeEstado('encurso', 'hecho')); });
await pagina.evaluate(async () => { await Hitos.marcar(FichaNucleo.actual.nombre, 'h1', 'encurso', RegistroAsunto.notaDeEstado('hecho', 'encurso')); });
await pagina.waitForTimeout(500);
await comprobar('dar el hito por hecho y reabrirlo dejan sus líneas', pagina.evaluate(async () =>
  (await Hitos.leer()).porAsunto[FichaNucleo.actual.nombre].hitos[0].notas.map(n => n.texto).filter(t => t === 'Dado por hecho' || t === 'Reabierto')), ['Dado por hecho', 'Reabierto']);
await pagina.evaluate(async () => { await RegistroAsunto.auto(FichaNucleo.actual, 'Documento guardado «a.pdf»'); });
await comprobar('sin hito, va a la libreta con `auto`', pagina.evaluate(async () => {
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  const n = r.asuntos[FichaNucleo.actual.nombre].notas.filter(x => x.texto === 'Documento guardado «a.pdf»')[0];
  return [n.auto, n.hito || ''];
}), [true, '']);

console.log('--- 3b. anotar desde la ficha ---');
await pagina.evaluate(() => HitoMesa.cerrar && HitoMesa.cerrar());
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
const caja = '#ficha-nota-texto';
await pagina.fill(caja, 'Nota rápida');
await pagina.press(caja, 'Enter');
await esperar(() => Array.prototype.some.call(document.querySelectorAll('#ficha-notas-lista .nota-texto'), x => x.textContent === 'Nota rápida'));
await comprobar('arriba, sin etiqueta de hito', ficha().then(l => [l[0].t, l[0].hito]), ['Nota rápida', '']);
await comprobar('y la caja queda vacía (Intro guarda)', pagina.inputValue(caja), '');

console.log('--- 5. cambiar y borrar ---');
const fila = (t) => '#ficha-notas-lista .registro-linea:has(.nota-texto:text-is("' + t + '"))';
await pagina.click(fila('Sin hito, a mano') + ' .registro-mas');
await pagina.click(fila('Sin hito, a mano') + ' .registro-cambiar');
await pagina.fill('#ficha-notas-lista .registro-edicion', 'Sin hito, corregida');
await pagina.click('#ficha-notas-lista .registro-guardar');
await esperar(() => Array.prototype.some.call(document.querySelectorAll('#ficha-notas-lista .nota-texto'), x => x.textContent === 'Sin hito, corregida'));
await comprobar('«Cambiar» deja el texto nuevo', ficha().then(l => l.map(x => x.t).filter(t => t.indexOf('Sin hito') === 0)), ['Sin hito, corregida']);
await pagina.click(fila('Sin hito, corregida') + ' .registro-mas');
await pagina.click(fila('Sin hito, corregida') + ' .registro-borrar');
await pagina.click('#cuadro-aceptar');
await esperar(() => !Array.prototype.some.call(document.querySelectorAll('#ficha-notas-lista .nota-texto'), x => x.textContent === 'Sin hito, corregida'));
await comprobar('«Borrar», confirmado, la quita', ficha().then(l => l.map(x => x.t).filter(t => t.indexOf('Sin hito') === 0)), []);
await comprobar('y también del disco', pagina.evaluate(async () => {
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  return r.asuntos[FichaNucleo.actual.nombre].notas.filter(x => x.texto.indexOf('Sin hito') === 0).length;
}), 0);

console.log('--- 8. el historial del archivo ---');
await comprobar('lleva el registro del asunto', pagina.evaluate(async (ana) => {
  const hitos = await Hitos.hitosDe(ana);
  return Hitos._textoHistorial(ana, hitos, U.hoyIso()).indexOf('REGISTRO DEL ASUNTO') !== -1;
}, ANA), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
