/* Prueba en navegador de verdad de la fila 138 (25-sep-2026,
   docs/UNA-SOLA-LISTA-EN-EL-HITO.md): «lo que hay que reunir» pasa al
   guion.

   1. Un paso con dos requisitos da un guion con dos líneas más (con su
      marca de documento o dato y «obligatorio»); los requisitos viejos
      se quedan en el fichero.
   2. En el hito, el requisito hecho sale marcado, con su valor; uno que
      solo tenía ese asunto pasa a su guion propio.
   3. Hacer la migración dos veces no duplica nada.
   4. Añadir un documento al hito marca la línea de documento.
   5. La mesa pinta 📎, ✎ y «obligatorio», y escribir el dato lo marca.
   6. El editor de la guía guarda «Hay que reunirlo». */
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

const ANA = '260901 MATRICULA 26-27 Pérez, Ana 1234';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (n) => { await window.__disco.abiertos.getDirectoryHandle(n, { create: true }); }, ANA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Que pase antes la migración de arranque (sin nada que mover), y se
   prepara el caso a mano. */
for (let i = 0; i < 100; i++) {
  if (await pagina.evaluate(async () => Carpetas.existeFichero(App.E.gestor, ReunirMigracion.MARCA))) break;
  await pagina.waitForTimeout(100);
}
await pagina.evaluate(async (ana) => {
  const g = App.E.gestor;
  await Carpetas.guardarJson(g, 'guias.json', { MATRICULA: [
    { id: 'p1', titulo: 'Recoger los papeles', cuerpo: '', opciones: [],
      guion: [{ id: 'g1', texto: 'Revisar la solicitud', explicacion: '', accion: '', normativa: null }],
      requisitos: [{ id: 'r1', texto: 'Solicitud firmada', clase: 'documento', obligatorio: true },
                   { id: 'r2', texto: 'Teléfono de contacto', clase: 'dato', obligatorio: false }] }
  ] });
  await GuiasDelCentro.recargar();
  await Hitos.cambiar(function (d) {
    d.porAsunto[ana] = { creados: U.hoyIso(), hitos: [Hitos.normalizarHito({
      id: 'h1', titulo: 'Recoger los papeles', clase: 'paso', estado: 'encurso', origenGuia: 'p1',
      requisitos: [
        { id: 'r1', texto: 'Solicitud firmada', clase: 'documento', obligatorio: true, hecho: false },
        { id: 'r2', texto: 'Teléfono de contacto', clase: 'dato', obligatorio: false, hecho: true, valor: '600123123', quien: 'Francisco', cuando: '2026-09-01T10:00:00.000Z' },
        { id: 'r3', texto: 'Curso anterior', clase: 'dato', obligatorio: false, hecho: false }
      ] })] };
    return d;
  });
  const c = await g.getFileHandle(ReunirMigracion.MARCA);
  await g.removeEntry(ReunirMigracion.MARCA);
}, ANA);

const primera = await pagina.evaluate(() => ReunirMigracion.hacer());
/* En el hito cuentan 2: el valor de r2 y la línea propia de r3 (r1, sin
   hacer, ya sale del guion de su paso). */
await comprobar('la migración cuenta lo que ha movido', primera, { pasos: 2, modelos: 0, hitos: 2 });

console.log('--- 1. el paso de la guía ---');
const guionPaso = () => pagina.evaluate(() => GuiasDelCentro.pasosDe('MATRICULA')[0].guion.map(g => [g.id, g.reunir || '', !!g.obligatorio]));
await comprobar('dos líneas más al final del guion, con su marca',
  guionPaso(), [['g1', '', false], ['reunir-r1', 'documento', true], ['reunir-r2', 'dato', false]]);
await comprobar('los requisitos viejos siguen en guias.json', pagina.evaluate(async () =>
  (await Carpetas.leerJson(App.E.gestor, 'guias.json')).MATRICULA[0].requisitos.length), 2);

console.log('--- 2. el hito ---');
const lineas = () => pagina.evaluate(async (ana) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === ana)[0];
  const h = (await Hitos.leer()).porAsunto[ana].hitos[0];
  return Hitos.guionDe(a, h).map(g => [g.id, g.reunir, g.hecho, g.valor || g.documento || '', g.propio]);
}, ANA);
await comprobar('el hecho sale marcado con su valor; el que solo tenía el asunto, como línea propia', lineas(), [
  ['g1', '', false, '', false],
  ['reunir-r1', 'documento', false, '', false],
  ['reunir-r2', 'dato', true, '600123123', false],
  ['reunir-r3', 'dato', false, '', true]
]);
const faltan = () => pagina.evaluate(async (ana) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === ana)[0];
  const h = (await Hitos.leer()).porAsunto[ana].hitos[0];
  return Hitos.faltanObligatorios(h, a).map(g => g.texto);
}, ANA);
await comprobar('falta la obligatoria', faltan(), ['Solicitud firmada']);
await comprobar('«Pedir lo que falta» sale del guion', pagina.evaluate(async (ana) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === ana)[0];
  const h = (await Hitos.leer()).porAsunto[ana].hitos[0];
  return HitosRequisitos.textoLoQueFalta(h, a);
}, ANA), 'Falta por aportar:\n- Solicitud firmada\n- Curso anterior');

console.log('--- 3. dos veces no duplica ---');
await pagina.evaluate(async () => { await App.E.gestor.removeEntry(ReunirMigracion.MARCA); });
await comprobar('la segunda pasada no mueve nada', pagina.evaluate(() => ReunirMigracion.hacer()), { pasos: 0, modelos: 0, hitos: 0 });
await comprobar('el guion del paso sigue igual', guionPaso().then(l => l.length), 3);
await comprobar('y el del hito también', lineas().then(l => l.length), 4);
await comprobar('y con la marca puesta, ni lo intenta', pagina.evaluate(() => ReunirMigracion.hacer()), null);

console.log('--- 4. un documento añadido al hito marca su línea ---');
await pagina.evaluate((ana) => HitosRequisitos.marcarPorDocumento(ana, 'h1', '260901 SOLICITUD.pdf'), ANA);
await comprobar('la línea de documento, hecha y con su documento',
  lineas().then(l => l[1]), ['reunir-r1', 'documento', true, '260901 SOLICITUD.pdf', false]);
await comprobar('ya no falta ninguna obligatoria', faltan(), []);
await pagina.evaluate((ana) => HitosRequisitos.desmarcarPorDocumento(ana, 'h1', '260901 SOLICITUD.pdf'), ANA);
await comprobar('al quitarlo del hito, vuelve a faltar', lineas().then(l => l[1][2]), false);

console.log('--- 5. la mesa ---');
const mesa = () => pagina.evaluate(async (ana) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === ana)[0];
  const h = (await Hitos.leer()).porAsunto[ana].hitos[0];
  let fila = document.getElementById('prueba-mesa');
  if (!fila) { fila = document.createElement('div'); fila.id = 'prueba-mesa'; fila.innerHTML = '<div class="mesa-guion"></div>'; document.body.appendChild(fila); }
  HitoMesaGuion.pintar(fila, a, h, true);
  return Array.prototype.map.call(fila.querySelectorAll('.guion-paso'), p =>
    [(p.querySelector('.guion-reunir-marca') || {}).textContent || '', !!p.querySelector('.guion-obligatorio'),
     p.querySelector('.guion-dato') ? p.querySelector('.guion-dato').value : null]);
}, ANA);
await comprobar('📎 y «obligatorio» en la de documento; ✎ y su caja en las de dato', mesa(), [
  ['', false, null], ['📎', true, null], ['✎', false, '600123123'], ['✎', false, '']
]);
await pagina.evaluate(() => {
  const cajas = document.querySelectorAll('#prueba-mesa .guion-dato');
  const c = cajas[cajas.length - 1];
  c.value = '2025-26';
  c.dispatchEvent(new Event('change'));
});
for (let i = 0; i < 50; i++) {
  if ((await lineas())[3][2]) break;
  await pagina.waitForTimeout(100);
}
await comprobar('escribir el dato lo marca', lineas().then(l => l[3]), ['reunir-r3', 'dato', true, '2025-26', true]);

console.log('--- 6. el editor de la guía ---');
await comprobar('«Hay que reunirlo» se pinta y se lee de vuelta', pagina.evaluate(() => {
  const d = document.createElement('div');
  d.innerHTML = GuiasGuion.bloqueHTML(GuiasGuion.normalizar([
    { id: 'x1', texto: 'Normal' },
    { id: 'x2', texto: 'El DNI', reunir: 'documento', obligatorio: true },
    { id: 'x3', texto: 'El teléfono', reunir: 'dato' }
  ]));
  d.querySelectorAll('.guion-fila')[0].querySelector('.guion-reunir').checked = true;
  d.querySelectorAll('.guion-fila')[0].querySelector('.guion-reunir-clase').value = 'dato';
  return GuiasGuion.leer(d).map(g => [g.id, g.reunir || '', !!g.obligatorio]);
}), [['x1', 'dato', false], ['x2', 'documento', true], ['x3', 'dato', false]]);
await comprobar('y ya no hay sección «Lo que hay que reunir» en el editor', pagina.evaluate(() => {
  const d = document.createElement('div');
  GuiasPasoBloques.anadir(d, { id: 'p', titulo: 'x', guion: [], requisitos: [{ id: 'r', texto: 'y', clase: 'dato' }] }, 0, false,
    { restaurar() {}, recoger() {}, pintar() {}, nivel() { return [{ requisitos: [], guion: [] }]; } });
  return !!d.querySelector('.paso-requisitos');
}), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
