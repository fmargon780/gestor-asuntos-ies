/* Prueba en navegador de verdad de la fila 139 (25-sep-2026,
   docs/UNA-SOLA-LIBRETA-DE-NOTAS.md): una sola libreta de notas.

   1. Un hito con dos notas escritas y una automática: el asunto gana las
      dos, con la etiqueta del hito y en su orden por fecha; el hito se
      queda la automática.
   2. Migrar dos veces no duplica.
   3. En la ficha, las notas llevan la etiqueta; pulsarla abre la mesa.
   4. En la mesa: solo las notas de ese hito, y aparte la «Historia».
   5. Una nota escrita en la mesa sobrevive a un repintado, y al
      guardarla va a las del asunto con la etiqueta. */
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
const AUTO = 'Dado por hecho al situar el asunto (02-09-2026, Francisco)';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (n) => { await window.__disco.abiertos.getDirectoryHandle(n, { create: true }); }, ANA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Que pase antes la de arranque (sin nada), y se prepara el caso a mano. */
await esperar(async () => Carpetas.existeFichero(App.E.gestor, NotasHito.MARCA));
await pagina.evaluate(async ([ana, auto]) => {
  await App.anotar(ana, { tercero: 'Pérez, Ana 1234', categoria: 'ALUMNADO',
    notas: [{ texto: 'Nota del asunto', quien: 'Francisco', cuando: '2026-09-01T12:00:00.000Z' }] });
  await Hitos.cambiar(function (d) {
    d.porAsunto[ana] = { creados: U.hoyIso(), hitos: [
      Hitos.normalizarHito({ id: 'h1', titulo: 'Recoger los papeles', clase: 'paso', estado: 'encurso', notas: [
        { texto: 'Ha llamado la madre', quien: 'Francisco', cuando: '2026-09-01T09:00:00.000Z' },
        { texto: auto, quien: 'Francisco', cuando: '2026-09-02T09:00:00.000Z' },
        { texto: 'Trae la solicitud el lunes', quien: 'Compañero', cuando: '2026-09-03T09:00:00.000Z' }
      ] }),
      Hitos.normalizarHito({ id: 'h2', titulo: 'Tramitar', clase: 'paso', estado: 'pendiente' })
    ] };
    return d;
  });
  await App.E.gestor.removeEntry(NotasHito.MARCA);
  await App.verAbiertos();
}, [ANA, AUTO]);

console.log('--- 1. el paso de lo que ya había ---');
await comprobar('dos notas a mano pasan a un asunto', pagina.evaluate(() => NotasHito.hacer()), { asuntos: 1, notas: 2 });
const notasAsunto = () => pagina.evaluate(async (ana) => {
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  return r.asuntos[ana].notas.map(n => [n.texto, n.hito || '', n.hitoTitulo || '']);
}, ANA);
await comprobar('en el asunto, por fecha, las del hito con su etiqueta', notasAsunto(), [
  ['Ha llamado la madre', 'h1', 'Recoger los papeles'],
  ['Nota del asunto', '', ''],
  ['Trae la solicitud el lunes', 'h1', 'Recoger los papeles']
]);
const notasHito = () => pagina.evaluate(async (ana) => (await Hitos.leer()).porAsunto[ana].hitos[0].notas.map(n => n.texto), ANA);
await comprobar('el hito se queda solo con la automática', notasHito(), [AUTO]);

console.log('--- 2. dos veces no duplica ---');
await pagina.evaluate(async () => { await App.E.gestor.removeEntry(NotasHito.MARCA); });
await comprobar('la segunda pasada no mueve nada', pagina.evaluate(() => NotasHito.hacer()), { asuntos: 0, notas: 0 });
await comprobar('el asunto sigue con tres', notasAsunto().then(l => l.length), 3);
await comprobar('y el juntar no duplica aunque se lo pidan dos veces', pagina.evaluate(() => {
  const n = { texto: 'x', quien: 'y', cuando: '2026-01-01T00:00:00.000Z' };
  return NotasHito.juntar([n], [Object.assign({}, n)]).puestas;
}), 0);

console.log('--- 3. la ficha ---');
await pagina.click('#btn-barra');
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter(a => a.nombre === n)[0], 'abierto'), ANA);
await pagina.waitForSelector('#ficha-notas', { state: 'attached' });
await esperar(() => document.querySelectorAll('#ficha-notas .nota-hito').length === 2);
await comprobar('dos notas con la etiqueta del hito', pagina.evaluate(() =>
  Array.prototype.map.call(document.querySelectorAll('#ficha-notas .nota-hito'), b => b.textContent)), ['⚑ Recoger los papeles', '⚑ Recoger los papeles']);
await pagina.evaluate(() => document.querySelector('#ficha-notas .nota-hito').click());
await esperar(() => HitoMesa.estaAbierta && HitoMesa.estaAbierta());
await comprobar('pulsar la etiqueta abre la mesa de ese hito', pagina.evaluate(() => {
  const fila = document.querySelector('#ficha-guia .hito[data-id="h1"]');
  return !!(fila && fila.querySelector('.mesa-notas'));
}), true);

console.log('--- 4. la mesa ---');
const mesa = () => pagina.evaluate(() => {
  const b = document.querySelector('#ficha-guia .hito[data-id="h1"] .mesa-notas');
  return {
    notas: Array.prototype.map.call(b.querySelectorAll('.hito-notas:not(.hito-historia) .hito-nota'), x => x.textContent.split('\n').pop().replace(/^.*· \d{4}-\d{2}-\d{2}/, '')),
    /* Fila 145: «Historia» es su propio bloque, debajo de «Notas». */
    historia: Array.prototype.map.call(b.closest('.hito').querySelectorAll('.mesa-historia .hito-historia .hito-nota'), x => x.classList.contains('hito-nota-auto'))
  };
});
await comprobar('solo las notas de ese hito (la más nueva arriba), y la historia aparte', mesa(), {
  notas: ['Trae la solicitud el lunes', 'Ha llamado la madre'], historia: [true]
});

console.log('--- 5. escribir en la mesa ---');
const ta = '#ficha-guia .hito[data-id="h1"] .hito-nota-texto';
await pagina.fill(ta, 'Llamada a la familia');
await pagina.evaluate(() => HitosPanel.programarRepintado());
await pagina.waitForTimeout(800);
await comprobar('lo escrito sobrevive a un repintado', pagina.locator(ta).inputValue(), 'Llamada a la familia');
/* Fila 145: sin botón «Añadir nota»; Intro guarda. */
await pagina.press(ta, 'Enter');
await esperar(async (ana) => {
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  return r.asuntos[ana].notas.some(n => n.texto === 'Llamada a la familia');
}, ANA);
await comprobar('guardada en las del asunto, con la etiqueta', notasAsunto().then(l => l.filter(n => n[0] === 'Llamada a la familia')),
  [['Llamada a la familia', 'h1', 'Recoger los papeles']]);
await comprobar('y no en el hito', notasHito(), [AUTO]);
await pagina.waitForTimeout(800);
await comprobar('la caja se queda vacía tras guardar', pagina.locator(ta).inputValue(), '');
await comprobar('y sale en la mesa', mesa().then(m => m.notas[0]), 'Llamada a la familia');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
