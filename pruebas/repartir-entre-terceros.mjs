/* Prueba de la fila 141 (25-sep-2026, docs/REPARTIR-ENTRE-TERCEROS.md):
   repartir un PDF entre terceros.

   Sin navegador (vm), las cuentas de js/repartir-nucleo.js: trozos con
   2 páginas de oficio y 3 personas de 4; la división no exacta avisa;
   +1/−1 recoloca los de debajo; y la comparación de nombres.

   Con navegador y el disco de mentira: un asunto de un colegio con 3
   relacionados y un PDF de 14 páginas con texto (2 de oficio + 3 × 4, con
   un nombre en cada trozo, en otro orden que el de los relacionados); se
   reparte y se comprueba lo que queda en disco; repetirlo no crea nada. */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= sin navegador ================= */
console.log('--- las cuentas ---');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../js/repartir-nucleo.js', import.meta.url), 'utf8'), ctx);
const N = ctx.RepartirNucleo;
const paginas = (l) => l.map(t => [t.desde, t.hasta, !!t.quedarse]);
comprobar('propuesta: 12 páginas desde la 3 entre 3 personas, 4 cada una', N.porTrozoPropuesto(14, 3, 3), 4);
comprobar('trozos: el oficio (1–2) se queda, y tres de 4', paginas(N.proponer(14, 3, 4)),
  [[1, 2, true], [3, 6, false], [7, 10, false], [11, 14, false]]);
comprobar('sin división exacta, avisa', N.avisoDivision(120, 1, 29), '120 páginas no se reparten igual entre 29 personas: puede que falte o sobre un cuestionario');
comprobar('exacta, no avisa', N.avisoDivision(14, 3, 3), '');
const base = N.asignarPorOrden(N.proponer(14, 3, 4), ['A', 'B', 'C']);
comprobar('por orden: primer trozo, primer relacionado', base.map(t => t.tercero || (t.quedarse ? '·' : '')), ['·', 'A', 'B', 'C']);
const mas = N.moverCorte(base, 1, 1, 14);
comprobar('+1 al primero: los de debajo se recolocan, el último se encoge', mas.map(t => [t.desde, t.hasta, t.tercero || '']),
  [[1, 2, ''], [3, 7, 'A'], [8, 11, 'B'], [12, 14, 'C']]);
const menos = N.moverCorte(base, 1, -1, 14);
comprobar('−1 al primero: sobra una página, y sale un trozo más sin asignar', menos.map(t => [t.desde, t.hasta, t.tercero || '', !!t.extra]),
  [[1, 2, '', false], [3, 5, 'A', false], [6, 9, 'B', false], [10, 13, 'C', false], [14, 14, '', true]]);
comprobar('un trozo nunca se queda en cero páginas', N.moverCorte(N.proponer(4, 1, 1), 0, -1, 4).map(t => t.hasta - t.desde + 1), [1, 1, 1, 1]);
const ana = { tercero: 'Pérez López, Ana 1111111' };
comprobar('nombre en otro orden y sin tildes: verde', N.compararNombre('Alumna: ANA PEREZ LOPEZ', ana), 'verde');
comprobar('sin el segundo apellido: ámbar', N.compararNombre('Ana Pérez', ana), 'ambar');
comprobar('con el Nº escolar: verde', N.compararNombre('Nº de identificación 1111111', ana), 'verde');
comprobar('M.ª igual a María', N.compararNombre('M.ª Luisa Gil Sanz', { tercero: 'Gil Sanz, María Luisa 5555555' }), 'verde');
comprobar('dos posibles en el mismo trozo: ámbar', N.leerTrozo('Ana Pérez López y Luis Gómez Ruiz',
  [ana, { tercero: 'Gómez Ruiz, Luis 2222222' }]).marca, 'ambar');
comprobar('nadie: nada', N.leerTrozo('Informe sin nombres', [ana]), null);

/* ================= con navegador ================= */
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
const PDF = '260915 26EM0123 RELACION DE DOCUMENTOS.pdf';
const PERSONAS = ['Pérez López, Ana 1111111', 'Gómez Ruiz, Luis 2222222', 'Sanz Mora, Eva 3333333'];

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- el caso: el colegio, 3 relacionados, un PDF de 14 páginas ---');
await pagina.evaluate(async ([origen, pdf, personas]) => {
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
  const d = await PDFLib.PDFDocument.create();
  const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
  /* 2 de oficio; después, en otro orden que el de los relacionados: Luis, Eva (por su Nº) y Ana. */
  const textos = ['Oficio del colegio', 'Relacion de documentos',
    'Cuestionario de Luis Gómez Ruiz', 'pagina 2', 'pagina 3', 'pagina 4',
    'Cuestionario. Nº escolar 3333333', 'pagina 2', 'pagina 3', 'pagina 4',
    'Cuestionario de PÉREZ LÓPEZ, ANA', 'pagina 2', 'pagina 3', 'pagina 4'];
  textos.forEach(t => { const p = d.addPage([300, 400]); p.drawText(t, { x: 20, y: 350, size: 12, font: f }); });
  const bytes = await d.save();
  const h = await c.getFileHandle(pdf, { create: true });
  const w = await h.createWritable(); await w.write(new Blob([bytes])); await w.close();
  await App.anotar(origen, { estado: 'abierto', tipo: 'ENVIO DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio San José',
    relacionados: personas.map(n => ({ categoria: 'ALUMNADO', nombre: n })) });
  await App.verAbiertos();
}, [ORIGEN, PDF, PERSONAS]);

const abrirCuadro = () => pagina.evaluate(async ([origen, pdf]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  const h = await a.handle.getFileHandle(pdf);
  Repartir.abrir({ asunto: a, handle: h, nombre: pdf, dir: a.handle, alTerminar() {} });
}, [ORIGEN, PDF]);
await abrirCuadro();
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await comprobarP('14 páginas entre 3: no es exacto y lo avisa', pagina.locator('#cuadro-cuerpo .aviso-en-vivo-ambar').count(), 1);
await pagina.fill('#repartir-primera', '3');
await pagina.dispatchEvent('#repartir-primera', 'change');
await pagina.waitForFunction(() => document.querySelectorAll('.repartir-trozo').length === 4);
const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => [
  f.querySelector('strong').textContent, f.querySelector('.repartir-tercero').value,
  (f.querySelector('.repartir-marca') || {}).textContent || '']));
await comprobarP('el oficio se queda; cada trozo, con quien se lee en él', filas(), [
  ['Páginas 1–2', '__quedarse', ''],
  ['Páginas 3–6', 'Gómez Ruiz, Luis 2222222', 'Leído del documento'],
  ['Páginas 7–10', 'Sanz Mora, Eva 3333333', 'Leído del documento'],
  ['Páginas 11–14', 'Pérez López, Ana 1111111', 'Leído del documento']
]);
await comprobarP('el tipo y los tipos de documento vienen del tipo del colegio',
  pagina.evaluate(() => [document.querySelector('.repartir-tipo').value, document.querySelector('.repartir-tipodoc').value,
    document.querySelector('.repartir-tipodoc-origen').value]), ['CUESTIONARIO ALTAS CAPACIDADES', 'CUESTIONARIO', 'OFICIO']);

await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await comprobarP('el resumen, en el mismo cuadro', pagina.locator('#cuadro-cuerpo').textContent().then(t =>
  t.indexOf('Se van a crear 3 asuntos de tipo CUESTIONARIO ALTAS CAPACIDADES, ya archivados, y 1 documento se queda') !== -1), true);
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 400);
await comprobarP('termina sin fallos', pagina.locator('#repartir-progreso').textContent(), 'Hecho.');

console.log('--- lo que queda en disco ---');
const archivado = (tercero) => pagina.evaluate(async (tercero) => {
  const t = await (await window.__disco.archivo.getDirectoryHandle('ALUMNADO')).getDirectoryHandle(tercero);
  const out = [];
  for await (const [nombre, h] of t.entries()) {
    const docs = [];
    let ficha = null;
    for await (const [n2, h2] of h.entries()) {
      if (n2 === '_ficha.json') ficha = JSON.parse(await (await h2.getFile()).text());
      else docs.push(n2);
    }
    const pdfs = docs.filter(x => /\.pdf$/.test(x) && x.indexOf('ÍNDICE') === -1);
    let pags = null;
    if (pdfs.length) {
      const PDFLib = await PdfHerramientas.cargarPdfLib();
      pags = (await PDFLib.PDFDocument.load(new Uint8Array(await (await (await h.getFileHandle(pdfs[0])).getFile()).arrayBuffer()))).getPageCount();
    }
    out.push({ asunto: nombre, pdfs, pags, viene: !!(ficha && (ficha.notas || []).some(n => /^Viene de 260915 ENVIO DE COLEGIO/.test(n.texto))) });
  }
  return out;
}, tercero);
for (const [tercero, desde] of [['Gómez Ruiz, Luis 2222222', 3], ['Sanz Mora, Eva 3333333', 7], ['Pérez López, Ana 1111111', 11]]) {
  await comprobarP('archivado en la carpeta de ' + tercero.split(',')[0] + ', con su trozo de 4 páginas, el registro del original y «Viene de…»',
    archivado(tercero), [{ asunto: '260915 CUESTIONARIO ALTAS CAPACIDADES 26-27 ' + tercero,
      pdfs: ['260915 26EM0123 CUESTIONARIO.pdf'], pags: 4, viene: true }]);
}
const origen = () => pagina.evaluate(async ([origen]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(origen);
  const l = []; for await (const [k] of c.entries()) l.push(k);
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  const f = r.asuntos[origen];
  return { ficheros: l.sort(), repartos: f.repartos.map(x => [x.documento, x.trozos.map(t => (t.quedarse ? 'origen' : t.tercero.split(',')[0]) + ':' + t.ok).join(' ')]),
           nota: (f.notas || []).some(n => /^Reparto de /.test(n.texto) && /Páginas 3–6 → Gómez Ruiz, Luis 2222222 \(asunto /.test(n.texto)) };
}, [ORIGEN]);
await comprobarP('en el origen: el PDF completo sigue, el oficio es un documento propio; la nota y los repartos, en su ficha', origen(), {
  ficheros: ['260915 26EM0123 OFICIO.pdf', PDF],
  repartos: [[PDF, 'origen:true Gómez Ruiz:true Sanz Mora:true Pérez López:true']],
  nota: true
});

console.log('--- repetirlo no crea nada nuevo ---');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await abrirCuadro();
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await comprobarP('todo sale «Hecho»', pagina.evaluate(() => Array.prototype.every.call(document.querySelectorAll('.repartir-trozo'), f => f.classList.contains('repartir-hecho'))), true);
await pagina.click('#repartir-ir');
await comprobarP('y no hay nada que repartir', pagina.locator('#repartir-falta').textContent(), 'No hay nada que repartir: ningún trozo tiene persona.');
await comprobarP('sigue habiendo un asunto por persona', archivado('Pérez López, Ana 1111111').then(l => l.length), 1);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
