/* Prueba de la fila 337 (13-oct-2026, docs/REPARTIR-VARIOS-FICHEROS.md): repartir varios ficheros
   sueltos entre terceros, uno por alumno.

   Sin navegador (vm): proponer el tercero de un fichero por su nombre.
   Con navegador y el disco de mentira: un asunto de colegio con 3 relacionados, un oficio y 4 ficheros
   sueltos (2 con el nombre del alumno en el nombre, 1 PDF con el Nº escolar solo dentro, 1 que no encaja
   con nadie); se marcan los 4, se reparte y se comprueba lo que queda en disco; repetir no crea nada;
   y el visor grande de los dos cuadros (ficheros y trozos de la fila 141). */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

console.log('--- el nombre del fichero ---');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../js/repartir-nucleo.js', import.meta.url), 'utf8'), ctx);
const N = ctx.RepartirNucleo;
const ana = { tercero: 'Pérez López, Ana 1111111' };
const luis = { tercero: 'Gómez Ruiz, Luis 2222222' };
comprobar('nombre en otro orden y sin tildes: verde', N.proponerPorNombre('CUESTIONARIO perez lopez ana.pdf', [ana, luis]), { tercero: ana.tercero, marca: 'verde' });
comprobar('solo nombre y primer apellido: ámbar', N.proponerPorNombre('Luis Gómez.docx', [ana, luis]), { tercero: luis.tercero, marca: 'ambar' });
comprobar('con el Nº escolar: verde', N.proponerPorNombre('cuestionario 2222222.pdf', [ana, luis]), { tercero: luis.tercero, marca: 'verde' });
comprobar('nadie: nada', N.proponerPorNombre('escaneo raro.pdf', [ana, luis]), null);
comprobar('la extensión no cuenta como palabra', N.proponerPorNombre('Ana.pdf', [{ tercero: 'Pdf Ana, Pdf 3000000' }]), null);

console.log('--- con navegador ---');
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
async function comprobarP(titulo, promesa, esperado) { comprobar(titulo, await promesa, esperado); }
async function esperar(fn, arg, veces) {
  for (let i = 0; i < (veces || 150); i++) {
    if (await pagina.evaluate(fn, arg)) return true;
    await pagina.waitForTimeout(100);
  }
  return false;
}


const ORIGEN = '260915 ENVIO DE COLEGIO Colegio San José';
const OFICIO = '260915 26EM0123 OFICIO.pdf';
const SUELTOS = ['Cuestionario Pérez López Ana.pdf', 'GOMEZ RUIZ LUIS cuestionario.pdf', 'cuestionario 3.pdf', 'escaneo raro.pdf'];
const PERSONAS = ['Pérez López, Ana 1111111', 'Gómez Ruiz, Luis 2222222', 'Sanz Mora, Eva 3333333'];

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async ([origen, oficio, sueltos, personas]) => {
  await App.crearTipo({ nombre: 'ENVIO DE COLEGIO', categoria: 'OTROS' });
  await App.crearTipo({ nombre: 'CUESTIONARIO ALTAS CAPACIDADES', categoria: 'ALUMNADO' });
  ['OFICIO', 'CUESTIONARIO'].forEach(t => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.guardarTiposDocumento();
  const tipo = App.E.tipos.filter(t => t.tipo === 'ENVIO DE COLEGIO')[0];
  tipo.repartirTipo = 'CUESTIONARIO ALTAS CAPACIDADES';
  tipo.repartirTipoDocumento = 'CUESTIONARIO';
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
  await pdf(oficio, ['Oficio del colegio']);
  await pdf(sueltos[0], ['Cuestionario', 'pagina 2']);
  await pdf(sueltos[1], ['Cuestionario']);
  await pdf(sueltos[2], ['Cuestionario. Nº escolar 3333333']);
  await pdf(sueltos[3], ['Sin nombre ninguno']);
  await App.anotar(origen, { estado: 'abierto', tipo: 'ENVIO DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio San José',
    relacionados: personas.map(n => ({ categoria: 'ALUMNADO', nombre: n })) });
  await App.verAbiertos();
}, [ORIGEN, OFICIO, SUELTOS, PERSONAS]);

console.log('--- el botón y la lista de ficheros ---');
await pagina.evaluate(async (origen) => { const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0]; await App.abrirFicha(a); }, ORIGEN);
await pagina.waitForSelector('.ficha-documentos-repartir', { timeout: 15000 });
await comprobarP('1. la tarjeta «Documentos» enseña el botón', pagina.locator('.ficha-documentos-repartir').textContent(), 'Repartir ficheros entre terceros');
await pagina.click('.ficha-documentos-repartir');
await pagina.waitForSelector('.repartir-elegir');
await comprobarP('2. la lista de documentos, con casillas sin marcar',
  pagina.evaluate(() => [document.querySelectorAll('.repartir-elegir input').length, document.querySelectorAll('.repartir-elegir input:checked').length, document.getElementById('repartir-seguir').disabled]), [5, 0, true]);
await pagina.evaluate((sueltos) => {
  Array.prototype.forEach.call(document.querySelectorAll('.repartir-elegir-fila'), l => {
    if (sueltos.some(s => l.textContent.indexOf(s) !== -1)) { const c = l.querySelector('input'); c.checked = true; c.dispatchEvent(new Event('change')); }
  });
}, SUELTOS);
await pagina.click('#repartir-seguir');
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => [
  f.querySelector('strong').textContent, f.querySelector('.repartir-tercero').value, (f.querySelector('.repartir-marca') || {}).textContent || '']));
const ordenadas = async () => (await filas()).sort((x, y) => x[0] < y[0] ? -1 : 1);
await comprobarP('3. cada fichero con su persona; el que no encaja, sin asignar y en ámbar', ordenadas(), [
  ['Cuestionario Pérez López Ana.pdf', 'Pérez López, Ana 1111111', 'Leído del documento'],
  ['GOMEZ RUIZ LUIS cuestionario.pdf', 'Gómez Ruiz, Luis 2222222', 'Leído del documento'],
  ['cuestionario 3.pdf', 'Sanz Mora, Eva 3333333', 'Leído del documento'],
  ['escaneo raro.pdf', '', 'Revísalo']
].sort((x, y) => x[0] < y[0] ? -1 : 1));

console.log('--- el visor grande ---');
await pagina.evaluate(() => Array.prototype.filter.call(document.querySelectorAll('.repartir-trozo'), f => f.querySelector('strong').textContent === 'escaneo raro.pdf')[0].querySelector('strong').click());
await pagina.waitForSelector('#repartir-visor canvas.repartir-visor-pagina', { timeout: 15000 });
await comprobarP('9. al pulsar un fichero se ve grande a la derecha', pagina.evaluate(() => {
  const v = document.getElementById('repartir-visor'); const c = v.querySelector('canvas');
  return [v.querySelectorAll('canvas').length, v.getBoundingClientRect().left > document.querySelector('.repartir-izq').getBoundingClientRect().left, c.width > 200];
}), [1, true, true]);
/* elegir su alumno: el visor pasa solo al siguiente sin asignar (no hay: se queda en el mismo) */
await pagina.evaluate(() => {
  const f = Array.prototype.filter.call(document.querySelectorAll('.repartir-trozo'), x => x.querySelector('strong').textContent === 'escaneo raro.pdf')[0];
  const s = f.querySelector('.repartir-tercero'); s.value = ''; s.dispatchEvent(new Event('change'));
});

await pagina.selectOption('.repartir-tipo', '');
await pagina.dispatchEvent('.repartir-tipo', 'change');
await pagina.click('#repartir-ir');
await comprobarP('4. sin tipo, avisa', pagina.locator('#repartir-falta').textContent().then(t => t.length > 0), true);
await pagina.selectOption('.repartir-tipo', 'CUESTIONARIO ALTAS CAPACIDADES');
await pagina.dispatchEvent('.repartir-tipo', 'change');
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await comprobarP('4. el resumen: 3 asuntos y 1 fichero sin asignar, en ámbar', pagina.locator('#cuadro-cuerpo').textContent().then(t =>
  t.indexOf('Se van a crear 3 asuntos de tipo CUESTIONARIO ALTAS CAPACIDADES, ya archivados.') !== -1 && t.indexOf('1 fichero se queda sin asignar') !== -1 && t.indexOf('escaneo raro.pdf') !== -1), true);
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 400);
await comprobarP('5. termina sin fallos', pagina.locator('#repartir-progreso').textContent(), 'Hecho.');

console.log('--- lo que queda en disco ---');
const archivado = (tercero) => pagina.evaluate(async (tercero) => {
  const t = await (await window.__disco.archivo.getDirectoryHandle('ALUMNADO')).getDirectoryHandle(tercero);
  const out = [];
  for await (const [nombre, h] of t.entries()) {
    const docs = []; let ficha = null;
    for await (const [n2, h2] of h.entries()) {
      if (n2 === '_ficha.json') ficha = JSON.parse(await (await h2.getFile()).text()); else docs.push(n2);
    }
    const pdfs = docs.filter(x => /\.pdf$/.test(x) && x.indexOf('ÍNDICE') === -1);
    out.push({ pdfs: pdfs.length, formato: pdfs.every(x => /^\d{6} CUESTIONARIO D\d{2}-\d{5}\.pdf$/.test(x)), viene: !!(ficha && (ficha.notas || []).some(n => /^Viene de 260915 ENVIO DE COLEGIO Colegio San José, fichero /.test(n.texto))) });
  }
  return out;
}, tercero);
for (const t of PERSONAS) await comprobarP('5. archivado en la carpeta de ' + t.split(',')[0] + ', con su fichero y «Viene de…»', archivado(t), [{ pdfs: 1, formato: true, viene: true }]);
const origen = () => pagina.evaluate(async (origen) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(origen);
  const l = []; for await (const [k] of c.entries()) l.push(k);
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  const f = r.asuntos[origen];
  const pap = (await Papelera.leer()).map(x => x.nombre).sort();
  return { ficheros: l.sort(), papelera: pap, repartos: (f.repartos || []).map(x => x.ficheros.map(y => y.tercero.split(',')[0] + ':' + y.ok).sort()),
           nota: (f.notas || []).some(n => /^Reparto de ficheros:/.test(n.texto) && /Cuestionario Pérez López Ana\.pdf → Pérez López, Ana 1111111 \(asunto /.test(n.texto)) };
}, ORIGEN);
await comprobarP('6 y 7. en el origen quedan el oficio y el sin asignar; los tres repartidos, en la Papelera; la nota y los repartos', origen(), {
  ficheros: [OFICIO, 'escaneo raro.pdf'].sort(),
  papelera: ['Cuestionario Pérez López Ana.pdf', 'GOMEZ RUIZ LUIS cuestionario.pdf', 'cuestionario 3.pdf'].sort(),
  repartos: [['Gómez Ruiz:true', 'Pérez López:true', 'Sanz Mora:true']],
  nota: true
});
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await comprobarP('repetirlo: sigue habiendo un asunto por persona', archivado('Pérez López, Ana 1111111').then(l => l.length), 1);

console.log('--- el botón de la fila 141 y su visor ---');
await pagina.evaluate(async ([origen]) => { const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0]; await App.abrirFicha(a); }, [ORIGEN]);
await comprobarP('con dos documentos, el botón de ficheros sigue saliendo', pagina.locator('.ficha-documentos-repartir').count(), 1);
await pagina.evaluate(async ([origen, oficio]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const d = await PDFLib.PDFDocument.create();
  const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
  ['Cuestionario de Luis Gómez Ruiz', 'pagina 2', 'Cuestionario de Eva Sanz Mora', 'pagina 2'].forEach(t => { const p = d.addPage([300, 400]); p.drawText(t, { x: 20, y: 350, size: 12, font: f }); });
  const h = await a.handle.getFileHandle('260915 TROZOS.pdf', { create: true });
  const w = await h.createWritable(); await w.write(new Blob([await d.save()])); await w.close();
  Repartir.abrir({ asunto: a, handle: h, nombre: '260915 TROZOS.pdf', dir: a.handle, alTerminar() {} });
}, [ORIGEN, OFICIO]);
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await pagina.evaluate(() => document.querySelectorAll('.repartir-trozo')[0].querySelector('.repartir-datos strong').click());
await pagina.waitForSelector('#repartir-visor canvas.repartir-visor-pagina', { timeout: 15000 });
await comprobarP('10. al pulsar un trozo, sus páginas se ven grandes a la derecha', pagina.evaluate(() => document.querySelectorAll('#repartir-visor canvas').length), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
