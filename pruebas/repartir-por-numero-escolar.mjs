/* Prueba de la fila 343 (13-oct-2026, docs/REPARTIR-POR-NUMERO-ESCOLAR.md): repartir un PDF cortando donde cambia el alumno.

   Sin navegador (`vm`): número escolar y nombre de una página, trozos por alumno, la regla del 80 %.
   Con navegador y el disco de mentira: un PDF con la forma del real (2 páginas de oficio y 6 informes: cuatro de
   6 páginas, uno de ellos de una persona que no está en el alumnado, y dos de 4 páginas seguidos de la misma
   alumna), un asunto SIN relacionados: 7 trozos, asignados por número escolar, 6 asuntos archivados y todos los
   alumnos relacionados con el origen. Y un PDF sin números ni nombres se corta por tamaño fijo. */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

console.log('--- las cuentas, sin navegador ---');
const ctxVm = { window: {}, console };
vm.createContext(ctxVm);
vm.runInContext(fs.readFileSync(new URL('../js/repartir-nucleo.js', import.meta.url), 'utf8') + '\nthis.N = RepartirNucleo;', ctxVm);
const N = ctxVm.N;
const personas = [{ tercero: 'Pérez Gil, Ana 1234567', id: '1234567' }, { tercero: 'Ruiz Sanz, Luis 7654321', id: '7654321' }];
const ctx = { personas, porId: { '1234567': personas[0], '7654321': personas[1] } };
const hoja1 = 'INFORME APELLIDOS Y NOMBRE: Pérez Gil, Ana Nº EXPTE.: Nº I.ESCOLAR: 555555 1234567 Tlf 600123456 DNI 12345678Z CP 14900';
comprobar('la primera hoja: solo cuenta el número escolar (no el expediente, ni teléfonos, ni DNI)', N.identificarPagina(hoja1, ctx).clave, 'id:1234567');
comprobar('sin alumnado: el número que va tras la etiqueta, saltando el del expediente', N.numeroEtiquetado('Nº EXPTE.: Nº I.ESCOLAR: 555555 9199999 Tlf 600123456'), '9199999');
const otra = 'APELLIDOS: Ruiz Sanz NOMBRE: Luis Nº I. ESCOLAR: 7654321 Hoja 2';
comprobar('las demás hojas, en una línea', N.identificarPagina(otra, ctx).clave, 'id:7654321');
comprobar('alumno que no está en el alumnado: nombre y número del informe', N.identificarPagina('APELLIDOS: Zapata Luna NOMBRE: Zoe Nº I. ESCOLAR: 9199999', ctx).tercero, 'Zapata Luna, Zoe 9199999');
comprobar('sin número, por el nombre', N.identificarPagina('Informe de Ana Pérez Gil', ctx).clave, 'nom:Pérez Gil, Ana 1234567');
const pag = (t, i) => { const id = N.identificarPagina(t, ctx); return { ident: id, huella: N.huella(t, id), i }; };
const A1 = 'INFORME FINAL APELLIDOS Y NOMBRE: Pérez Gil, Ana Nº I.ESCOLAR: 1234567';
const A2 = 'APELLIDOS: Pérez Gil NOMBRE: Ana Nº I. ESCOLAR: 1234567 datos de la evaluación';
const dosInformes = [A1, A2, A2, A1, A2].map(pag);
const r2 = N.proponerPorAlumno(dosInformes);
comprobar('dos informes seguidos del mismo alumno: dos trozos, el segundo con su aviso',
  r2.trozos.map(t => [t.desde, t.hasta, t.lectura.marca]), [[1, 3, 'verde'], [4, 5, 'mismo']]);
const L1 = 'INFORME APELLIDOS Y NOMBRE: Ruiz Sanz, Luis Nº I.ESCOLAR: 7654321';
const mezcla = [A1, 'portada sin nadie', A2, 'otra hoja sin nadie', 'y otra'].map(pag);
comprobar('menos del 80 % de páginas con alumno: tamaño fijo (null)', N.proponerPorAlumno(mezcla), null);
const delante = N.proponerPorAlumno(['oficio', A1, A2, L1, otra].map(pag));
comprobar('delante, las páginas sin alumno se quedan en el asunto', delante.trozos.map(t => [t.desde, t.hasta, !!t.quedarse]), [[1, 1, true], [2, 3, false], [4, 5, false]]);
comprobar('y la línea dice por qué se cortó', [delante.por, delante.cuantos], ['número escolar', 2]);


const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
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

const ALUMNOS = [
  ['Aranda Bel, Ana', '9100001', '4º de E.P.', '4º A'],
  ['Blanco Cid, Berta', '9100002', '4º de E.P.', '4º A'],
  ['Campos Díaz, Carlos', '9100003', '4º de E.P.', '4º A'],
  ['Duran Eco, Daniel', '9100004', '4º de E.P.', '4º B'],
  ['Egea Fon, Elena', '9100005', '4º de E.P.', '4º B']
];
const FUERA = { ap: 'Zapata Luna', nom: 'Zoe', id: '9199999' };

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (alumnos) => {
  const csv = ['Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento']
    .concat(alumnos.map(a => [a[0], a[1], a[2], a[3], '2026', 'Matriculado', '04/03/2013'].join(';'))).join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
}, ALUMNOS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2200);

const ORIGEN = '261013 INFORMES DE COLEGIO Colegio Jorge Guillén';
const PDF = '261013 26EM0300 INFORME FINAL.pdf';
const ORIGEN2 = '261013 INFORMES DE COLEGIO Colegio Segundo';
const PDF2 = 'sin nadie.pdf';

/* Las páginas del PDF, con la forma del real: la primera hoja con el bloque (nombre; «Nº EXPTE.: Nº I.ESCOLAR:» y los
   números debajo; teléfono y DNI), las demás con una línea, y la última con «LUGAR, FECHA Y FIRMA». */
await pagina.evaluate(async ([origen, origen2, pdf, pdf2, alumnos, fuera]) => {
  await App.crearTipo({ nombre: 'INFORMES DE COLEGIO', categoria: 'OTROS' });
  await App.crearTipo({ nombre: 'INFORME FINAL DE ETAPA', categoria: 'ALUMNADO' });
  ['OFICIO', 'INFORME'].forEach(t => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.guardarTiposDocumento();
  const tipo = App.E.tipos.filter(t => t.tipo === 'INFORMES DE COLEGIO')[0];
  tipo.repartirTipo = 'INFORME FINAL DE ETAPA';
  tipo.repartirTipoDocumento = 'INFORME';
  await App.guardarTipos();
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  async function pdfEn(c, nombre, paginas) {
    const d = await PDFLib.PDFDocument.create();
    const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
    paginas.forEach(lineas => { const p = d.addPage([400, 500]); lineas.forEach((t, k) => p.drawText(t, { x: 20, y: 460 - k * 18, size: 10, font: f })); });
    const h = await c.getFileHandle(nombre, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([await d.save()])); await w.close();
  }
  const por = n => alumnos[n];
  /* Un informe: ap, nom, id, páginas. */
  function informe(ap, nom, id, n) {
    const l = [['INFORME FINAL DE ETAPA DE EDUCACION PRIMARIA', 'APELLIDOS Y NOMBRE: ' + ap + ', ' + nom, 'Nº EXPTE.: Nº I.ESCOLAR:',
      '77001 ' + id, 'Tlf 600123456 DNI 12345678Z CP 14900']];
    for (let i = 2; i < n; i++) l.push(['APELLIDOS: ' + ap + ' NOMBRE: ' + nom + ' Nº I. ESCOLAR: ' + id, 'Area de lengua, resultados de la evaluacion, hoja ' + i]);
    l.push(['APELLIDOS: ' + ap + ' NOMBRE: ' + nom + ' Nº I. ESCOLAR: ' + id, 'LUGAR, FECHA Y FIRMA']);
    return l;
  }
  const doc = [['Oficio del colegio'], ['Relacion de informes que se envian']]
    .concat(informe('Aranda Bel', 'Ana', '9100001', 6), informe('Blanco Cid', 'Berta', '9100002', 6),
             informe('Campos Díaz', 'Carlos', '9100003', 6), informe(fuera.ap, fuera.nom, fuera.id, 6),
             informe('Egea Fon', 'Elena', '9100005', 4), informe('Egea Fon', 'Elena', '9100005', 4));
  const c = await window.__disco.abiertos.getDirectoryHandle(origen, { create: true });
  await pdfEn(c, pdf, doc);
  await App.anotar(origen, { estado: 'abierto', tipo: 'INFORMES DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio Jorge Guillén', relacionados: [] });
  const c2 = await window.__disco.abiertos.getDirectoryHandle(origen2, { create: true });
  await pdfEn(c2, pdf2, [['Pagina uno de un oficio'], ['Pagina dos de un oficio'], ['Pagina tres'], ['Pagina cuatro'], ['Pagina cinco'], ['Pagina seis']]);
  await App.anotar(origen2, { estado: 'abierto', tipo: 'INFORMES DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio Segundo', relacionados: [] });
  await App.verAbiertos();
}, [ORIGEN, ORIGEN2, PDF, PDF2, ALUMNOS, FUERA]);

const abrirCuadro = (origen, pdf) => pagina.evaluate(async ([origen, pdf]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  const h = await a.handle.getFileHandle(pdf);
  Repartir.abrir({ asunto: a, handle: h, nombre: pdf, dir: a.handle, alTerminar() {} });
}, [origen, pdf]);

console.log('--- el cuadro, con un asunto sin relacionados ---');
await abrirCuadro(ORIGEN, PDF);
await pagina.waitForSelector('.repartir-lista .repartir-trozo', { timeout: 30000 });
const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => [
  f.querySelector('strong').textContent, f.querySelector('.repartir-tercero').value,
  (f.querySelector('.repartir-marca') || {}).textContent || '']));
const nombre = (n) => { const a = ALUMNOS.filter(x => x[0] === n)[0]; return n + ' ' + a[1]; };
const ZOE = FUERA.ap + ', ' + FUERA.nom + ' ' + FUERA.id;
const VERDE = 'Leído del documento', MISMO = 'Mismo alumno que el trozo anterior: dos documentos';
const NUEVA = 'No está en el alumnado: se crea con los datos del informe';
await comprobarP('1. la línea gris dice cómo se cortó', pagina.locator('.repartir-corte').textContent(), 'Cortado donde cambia el número escolar: 6 trozos');
await comprobarP('1, 2, 3, 4 y 5. el oficio y 6 trozos del tamaño de cada informe, asignados sin estar relacionados', filas(), [
  ['Páginas 1–2', '__quedarse', ''],
  ['Páginas 3–8', nombre('Aranda Bel, Ana'), VERDE],
  ['Páginas 9–14', nombre('Blanco Cid, Berta'), VERDE],
  ['Páginas 15–20', nombre('Campos Díaz, Carlos'), VERDE],
  ['Páginas 21–26', ZOE, NUEVA],
  ['Páginas 27–30', nombre('Egea Fon, Elena'), VERDE],
  ['Páginas 31–34', nombre('Egea Fon, Elena'), MISMO]]);
await comprobarP('2. no sale el aviso de «no tiene terceros relacionados»', pagina.locator('#cuadro-cuerpo .aviso-ambar').count(), 0);

console.log('--- repartir ---');
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await comprobarP('6. el resumen: 6 asuntos y el oficio que se queda', pagina.locator('#cuadro-cuerpo').textContent().then(t =>
  t.indexOf('Se van a crear 6 asuntos de tipo INFORME FINAL DE ETAPA, ya archivados, y 1 documento se queda') !== -1), true);
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 600);
await comprobarP('6. termina sin fallos', pagina.locator('#repartir-progreso').textContent(), 'Hecho.');
const archivados = () => pagina.evaluate(async () => {
  const salida = [];
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  for await (const [tercero, th] of cat.entries()) {
    for await (const [asunto, ah] of th.entries()) {
      let pags = null;
      for await (const [n, h] of ah.entries()) {
        if (/\.pdf$/.test(n) && n.indexOf('ÍNDICE') === -1) {
          const PDFLib = await PdfHerramientas.cargarPdfLib();
          pags = (await PDFLib.PDFDocument.load(new Uint8Array(await (await h.getFile()).arrayBuffer()))).getPageCount();
        }
      }
      salida.push([tercero, pags]);
    }
  }
  return salida.sort((a, b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : a[1] - b[1]));
});
await comprobarP('6. seis asuntos archivados, cada uno con su trozo del tamaño del informe (dos de Elena)', archivados(), [
  [nombre('Aranda Bel, Ana'), 6], [nombre('Blanco Cid, Berta'), 6], [nombre('Campos Díaz, Carlos'), 6],
  [nombre('Egea Fon, Elena'), 4], [nombre('Egea Fon, Elena'), 4], [ZOE, 6]].sort((a, b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : a[1] - b[1])));
const origen = (o) => pagina.evaluate(async (o) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(o);
  const l = []; for await (const [k] of c.entries()) l.push(k);
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  return { ficheros: l.filter(x => /\.pdf$/.test(x) && x.indexOf('INFORME FINAL') !== -1), relacionados: ((r.asuntos[o] || {}).relacionados || []).map(x => x.nombre).sort() };
}, o);
await comprobarP('6. el PDF entero sigue en el origen y los 5 alumnos, el de fuera incluido, quedan relacionados', origen(ORIGEN), {
  ficheros: [PDF], relacionados: [nombre('Aranda Bel, Ana'), nombre('Blanco Cid, Berta'), nombre('Campos Díaz, Carlos'), nombre('Egea Fon, Elena'), ZOE].sort() });
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

console.log('--- un PDF sin números ni nombres ---');
await abrirCuadro(ORIGEN2, PDF2);
await pagina.waitForSelector('.repartir-lista .repartir-trozo', { timeout: 30000 });
await comprobarP('7. se corta por tamaño fijo, como antes (sin relacionados, un solo trozo), y no sale la línea gris', pagina.evaluate(() => [
  document.querySelectorAll('.repartir-trozo').length, document.querySelectorAll('.repartir-corte').length,
  !!document.getElementById('repartir-primera')]), [1, 0, true]);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
