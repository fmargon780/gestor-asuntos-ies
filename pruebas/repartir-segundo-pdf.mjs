/* Prueba de la fila 339 (13-oct-2026, docs/REPARTIR-SEGUNDO-PDF.md): repartir un segundo PDF del mismo asunto.

   - Un asunto con 4 relacionados y dos PDF con texto, de 4 trozos de una página: el primero con el nombre de los
     4 alumnos; el segundo, con el de 3 (en otro orden) y una página sin nombre.
   - Repartir el primero: como siempre (se lee en cada trozo).
   - El segundo se abre sin heredar el reparto: 3 trozos con su alumno leído, el cuarto «Sin asignar»; el resumen
     no avisa de «se ha quedado sin trozo» de quien ya recibió el suyo en el primero.
   - Un PDF de 12 trozos: al elegir el alumno de un trozo, la lista baja al siguiente sin asignar y no vuelve
     arriba; +1 página deja la lista donde estaba. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function esperar(fn, arg, veces) {
  for (let i = 0; i < (veces || 150); i++) { if (await pagina.evaluate(fn, arg)) return true; await pagina.waitForTimeout(100); }
  return false;
}

const ORIGEN = '260915 ENVIO DE COLEGIO Colegio San José';
const P1 = '260915 26EM0123 PRIMERO.pdf', P2 = '260915 26EM0124 SEGUNDO.pdf', P3 = '260915 26EM0125 LARGO.pdf';
const PERSONAS = ['Pérez López, Ana 1111111', 'Gómez Ruiz, Luis 2222222', 'Sanz Mora, Eva 3333333', 'Torres Gil, Pablo 4444444'];

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async ([origen, p1, p2, p3, personas]) => {
  await App.crearTipo({ nombre: 'ENVIO DE COLEGIO', categoria: 'OTROS' });
  await App.crearTipo({ nombre: 'CUESTIONARIO ALTAS CAPACIDADES', categoria: 'ALUMNADO' });
  ['OFICIO', 'CUESTIONARIO'].forEach(t => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.guardarTiposDocumento();
  const tipo = App.E.tipos.filter(t => t.tipo === 'ENVIO DE COLEGIO')[0];
  tipo.repartirTipo = 'CUESTIONARIO ALTAS CAPACIDADES'; tipo.repartirTipoDocumento = 'CUESTIONARIO';
  await App.guardarTipos();
  const c = await window.__disco.abiertos.getDirectoryHandle(origen, { create: true });
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  async function pdf(nombre, textos) {
    const d = await PDFLib.PDFDocument.create();
    const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
    textos.forEach(t => { const p = d.addPage([300, 400]); p.drawText(t, { x: 20, y: 350, size: 12, font: f }); });
    const h = await c.getFileHandle(nombre, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([await d.save()])); await w.close();
  }
  await pdf(p1, ['Cuestionario de Ana Pérez López', 'Cuestionario de Luis Gómez Ruiz', 'Cuestionario de Eva Sanz Mora', 'Cuestionario de Pablo Torres Gil']);
  await pdf(p2, ['Cuestionario de Pablo Torres Gil', 'Cuestionario de Ana Pérez López', 'Hoja sin nombre alguno', 'Cuestionario de Luis Gómez Ruiz']);
  const largo = []; for (let i = 0; i < 12; i++) largo.push('Hoja ' + (i + 1) + ' sin nombre');
  await pdf(p3, largo);
  await App.anotar(origen, { estado: 'abierto', tipo: 'ENVIO DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio San José',
    relacionados: personas.map(n => ({ categoria: 'ALUMNADO', nombre: n })) });
  await App.verAbiertos();
}, [ORIGEN, P1, P2, P3, PERSONAS]);

const abrirCuadro = (pdf) => pagina.evaluate(async ([origen, pdf]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  const h = await a.handle.getFileHandle(pdf);
  Repartir.abrir({ asunto: a, handle: h, nombre: pdf, dir: a.handle, alTerminar() {} });
}, [ORIGEN, pdf]);
const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => f.querySelector('.repartir-tercero').value));

console.log('--- el primero, como siempre ---');
await abrirCuadro(P1);
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
comprobar('1. el primero se lee en cada trozo', await filas(), ['Pérez López, Ana 1111111', 'Gómez Ruiz, Luis 2222222', 'Sanz Mora, Eva 3333333', 'Torres Gil, Pablo 4444444']);
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 400);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

console.log('--- el segundo no hereda el reparto ---');
await abrirCuadro(P2);
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
comprobar('2. cada trozo con el alumno leído; el que no se reconoce, sin asignar', await filas(),
  ['Torres Gil, Pablo 4444444', 'Pérez López, Ana 1111111', '', 'Gómez Ruiz, Luis 2222222']);
comprobar('2. el trozo sin asignar sale en ámbar', await pagina.evaluate(() => document.querySelectorAll('.repartir-trozo')[2].classList.contains('repartir-ambar')), true);
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
const resumen = await pagina.locator('#cuadro-cuerpo').textContent();
comprobar('3. el resumen no avisa de nadie «sin trozo» (Eva ya recibió el suyo en el primero)', resumen.indexOf('se ha quedado sin trozo') === -1, true);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

console.log('--- la lista baja al siguiente trozo ---');
await abrirCuadro(P3);
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await pagina.fill('#repartir-por', '1');
await pagina.dispatchEvent('#repartir-por', 'change');
await pagina.waitForFunction(() => document.querySelectorAll('.repartir-trozo').length === 12);
comprobar('1. el PDF largo sale sin asignar (no hay lectura y ya hubo reparto)', await pagina.evaluate(() => Array.prototype.every.call(document.querySelectorAll('.repartir-tercero'), s => s.value === '')), true);
const top = () => pagina.evaluate(() => document.querySelector('.repartir-lista').scrollTop);
const visible = (i) => pagina.evaluate((i) => {
  const l = document.querySelector('.repartir-lista'), f = l.querySelectorAll('.repartir-trozo')[i];
  const a = l.getBoundingClientRect(), b = f.getBoundingClientRect();
  return b.top >= a.top - 1 && b.bottom <= a.bottom + 1;
}, i);
comprobar('1. con 12 trozos la lista se desplaza', await pagina.evaluate(() => { const l = document.querySelector('.repartir-lista'); return l.scrollHeight > l.clientHeight; }), true);
/* elegir alumno en los trozos de uno en uno: tras cada elección, el siguiente sin asignar queda a la vista */
for (let i = 0; i < 4; i++) {
  await pagina.evaluate((i) => {
    const s = document.querySelectorAll('.repartir-tercero')[i];
    s.value = s.options[1 + i].value; s.dispatchEvent(new Event('change'));
  }, i);
  await pagina.waitForTimeout(150);
}
comprobar('1. tras elegir los 4 primeros, el trozo 5 (siguiente sin asignar) queda a la vista', await visible(4), true);
const t0 = await top();
comprobar('1. y la lista no ha vuelto arriba del todo', t0 > 0, true);
await pagina.evaluate(() => document.querySelectorAll('.repartir-trozo')[6].querySelector('.repartir-mas').click());
await pagina.waitForTimeout(200);
comprobar('3. «+1 página» deja la lista donde estaba', await top(), t0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
