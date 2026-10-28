/* Prueba en navegador de verdad de la fila 478 de docs/COLA.md (docs/REGISTRADO-DESDE-LA-RUTA-DEL-DOCUMENTO.md):
   al pulsar el «Ruta» pequeño de un PDF la app guarda por dentro una copia (`_copia-ruta`); si luego se guarda
   encima el registrado de Séneca, lo reconoce sola (original a previas como «SIN SELLAR», nota, tarea «Registrar»);
   si llega sin sello, lo deja y guarda el anterior como «ANTERIOR». Reutiliza el disco de mentira de
   pruebas/navegador.mjs; «guardar encima» es escribir en el fichero del disco y lanzar la mirada. */
import { chromium } from 'playwright';
import fs from 'fs';

function pdfConTexto(texto) {
  const escapado = String(texto).replace(/([()\\])/g, '\\$1');
  const stream = 'BT /F1 8 Tf 20 750 Td (' + escapado + ') Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objetos.length; i++) { offsets.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + objetos[i] + '\nendobj\n'; }
  const inicioXref = pdf.length;
  let xref = 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += xref + 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + inicioXref + '\n%%EOF';
  return pdf;
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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

const ASUNTO = '260911 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const DOC = '260911 SOLICITUD Prueba del sello.pdf';
const DOC2 = '260912 SOLICITUD Otro escrito.pdf';
const DOC3 = '260913 SOLICITUD Tercer escrito.pdf';
const GUIAS = { CONVALIDACION: [
  { id: 'c1', titulo: 'Registrar', cuerpo: '', opciones: [],
    guion: [{ id: 'g1', texto: 'Descargar el documento registrado a la carpeta del asunto y anotar registro', explicacion: '', accion: 'registrar' }] },
  { id: 'c2', titulo: 'Archivar', cuerpo: '', opciones: [] }
] };
const SELLO = pdfConTexto('2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02');

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([asunto, guias, doc, pdf]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const escribir = async (n, t) => { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(t); await w.close(); };
  await escribir('guias.json', JSON.stringify(guias));
  await escribir('rutas.json', JSON.stringify({ abiertos: 'IES/ASUNTOS ABIERTOS', archivo: 'ARCHIVO' }));
  localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\francisco\\Dropbox');
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  c._hijos.set(doc, window.__disco.fich(doc, pdf, 'application/pdf'));
}, [ASUNTO, GUIAS, DOC, pdfConTexto('Solicitud de convalidación, sin sello')]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (asunto) => {
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Sola Uno, Eva 9990201', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.click('#inicio-tabla-cuerpo .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.evaluate(() => FichaTarjetas.abrir('documentos'));
await pagina.waitForSelector('.ficha-documento-fila');
/* El documento del hito, para que se marque la tarea «Registrar». */
await pagina.evaluate(async ([a, doc]) => {
  const hs = await Hitos.hitosDe(a);
  await Hitos.anadirDocumento(a, hs[0].id, doc);
}, [ASUNTO, DOC]);

const dentro = (ruta) => pagina.evaluate(async ([asunto, ruta]) => {
  let d = await window.__disco.abiertos.getDirectoryHandle(asunto);
  for (const trozo of ruta) { try { d = await d.getDirectoryHandle(trozo); } catch (e) { return null; } }
  return Array.from(d._hijos.keys()).sort();
}, [ASUNTO, ruta]);
const escribirEncima = (nombre, texto) => pagina.evaluate(async ([asunto, nombre, texto]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const w = await (await c.getFileHandle(nombre)).createWritable(); await w.write(texto); await w.close();
}, [ASUNTO, nombre, texto]);
const mirar = async () => {
  await pagina.waitForFunction(() => !ColaGuardado.hayGuardado());
  await pagina.evaluate(() => window.dispatchEvent(new Event('focus')));
  await pagina.waitForTimeout(1500);
};
const avisos = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#mensajes .mensaje')).map((m) => m.className.replace('mensaje', '').trim() + '|' + m.textContent));
const lista = () => pagina.evaluate(async () => {
  try { return (await Carpetas.leerJson(App.E.gestor, 'copias-ruta.json') || { items: [] }).items.map((i) => i.doc); } catch (e) { return 'error'; }
});

console.log('--- 1. «Ruta» copia la misma ruta y guarda la copia ---');
await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
await pagina.click('.ficha-documento-fila .ruta-documento');
await pagina.waitForFunction(() => navigator.clipboard.readText().then((t) => t !== '(nada)'));
await comprobar('1. la ruta copiada es la de siempre',
  pagina.evaluate(() => navigator.clipboard.readText()),
  'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\' + ASUNTO + '\\' + DOC);
await pagina.waitForFunction((a) => window.__disco.abiertos.getDirectoryHandle(a).then((d) => d._hijos.has('_copia-ruta')).catch(() => false), ASUNTO);
await comprobar('1. hay `_copia-ruta/<documento>`', dentro(['_copia-ruta']), [DOC]);
await comprobar('1. la copia está apuntada en la lista de _GESTOR', lista(), [DOC]);
await comprobar('1. la ficha no enseña esa subcarpeta en ningún sitio',
  pagina.evaluate(() => document.body.innerText.indexOf('_copia-ruta') === -1), true);
await comprobar('1. el aviso verde de la ruta sale como siempre',
  avisos().then((l) => l.filter((x) => x.indexOf('Ruta copiada: ') !== -1).length > 0), true);

console.log('--- 1b. mirar sin cambios no deja rastro ---');
await mirar();
await comprobar('1b. el documento y la copia siguen donde estaban', Promise.all([dentro([]), dentro(['_copia-ruta'])]),
  [[DOC, '_copia-ruta'].sort(), [DOC]]);
await comprobar('1b. y no hay ningún aviso de registro', avisos().then((l) => l.filter((x) => /Documento registrado|no trae sello/.test(x)).length), 0);

console.log('--- 2 a 4. guardar encima el registrado ---');
const notasAntes = await pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO);
await escribirEncima(DOC, SELLO);
await mirar();
await comprobar('2. aviso verde con el código y sin ventanas',
  avisos().then((l) => l.filter((x) => x.indexOf('Documento registrado (26EM0368).') !== -1)),
  ['bueno|Documento registrado (26EM0368). El original sin sellar se conserva en «_Previas».']);
const ficheros = await dentro([]);
await comprobar('3. `_copia-ruta` ya no existe y el registrado ocupa el sitio del documento',
  ficheros.filter((n) => /^260911 .*\.pdf$/.test(n) && n.indexOf('_copia') === -1).length, 1);
await comprobar('3. no queda la copia ni el nombre provisional', ficheros.filter((n) => n === '_copia-ruta' || /llegado/.test(n)), []);
await comprobar('3. «_Previas» tiene el original «SIN SELLAR»', dentro(['_Previas']).then((l) => l.filter((n) => / SIN SELLAR/.test(n)).length), 1);
await comprobar('3. el contenido de «SIN SELLAR» es el original',
  pagina.evaluate(async (a) => {
    const p = await (await window.__disco.abiertos.getDirectoryHandle(a)).getDirectoryHandle('_Previas');
    const n = Array.from(p._hijos.keys())[0]; return (await (await p.getFileHandle(n)).getFile()).text().then((t) => t.indexOf('sin sello') !== -1);
  }, ASUNTO), true);
await comprobar('3. la lista de copias queda vacía', lista(), []);
await comprobar('4. la nota «Registrado …» está en las notas, una sola vez',
  pagina.evaluate(([a, antes]) => (App.E.registro.asuntos[a].notas || []).filter((n) => /^Registrado 26EM0368 el 10\/09\/2026 · /.test(n.texto)).length, [ASUNTO, notasAntes]), 1);
await comprobar('4. la tarea «Registrar» del hito queda marcada',
  pagina.evaluate(async (a) => {
    const h = (await Hitos.hitosDe(a))[0];
    const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
    return !!Hitos.guionDe(asunto, h)[0].hecho;
  }, ASUNTO), true);
const notasDespues = await pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO);
await mirar();
await comprobar('4. repetir la mirada no añade otra nota', pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO), notasDespues);

console.log('--- 5. guardar encima algo sin sello ---');
await pagina.evaluate(async ([a, doc, pdf]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  c._hijos.set(doc, window.__disco.fich(doc, pdf, 'application/pdf'));
  const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
  await RutaCopia.alCopiarRuta(asunto, 'abierto', { nombre: doc, subcarpeta: '' });
}, [ASUNTO, DOC2, pdfConTexto('escrito original sin sello')]);
await comprobar('5. antes, la copia está hecha', dentro(['_copia-ruta']), [DOC2]);
const notasAntes5 = await pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO);
await escribirEncima(DOC2, pdfConTexto('firmado con AutoFirma, sin sello de registro'));
await mirar();
await comprobar('5. el aviso ámbar',
  avisos().then((l) => l.filter((x) => x.indexOf('no trae sello de registro') !== -1)),
  ['ambar|Lo que has guardado encima de ' + DOC2 + ' no trae sello de registro. Lo he dejado; el anterior se conserva en «_Previas».']);
await comprobar('5. el documento conserva lo llegado',
  pagina.evaluate(async ([a, n]) => (await (await (await window.__disco.abiertos.getDirectoryHandle(a)).getFileHandle(n)).getFile()).text().then((t) => t.indexOf('AutoFirma') !== -1), [ASUNTO, DOC2]), true);
await comprobar('5. el original está en previas con « ANTERIOR»', dentro(['_Previas']).then((l) => l.filter((n) => / ANTERIOR\.pdf$/.test(n))), ['260912 SOLICITUD Otro escrito ANTERIOR.pdf']);
await comprobar('5. no hay `_copia-ruta`, ni nota nueva', Promise.all([dentro([]).then((l) => l.indexOf('_copia-ruta')), pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO)]),
  [-1, notasAntes5]);

console.log('--- 5b. documento con número, y nombre que no permite anotar ---');
const NUM = '261019 FACTURA D26-00259.pdf';
const RARO = 'Escrito suelto.pdf';
await pagina.evaluate(async ([a, docs, pdf]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
  for (const d of docs) {
    c._hijos.set(d, window.__disco.fich(d, pdf, 'application/pdf'));
    await RutaCopia.alCopiarRuta(asunto, 'abierto', { nombre: d, subcarpeta: '' });
  }
}, [ASUNTO, [NUM, RARO], pdfConTexto('original')]);
await escribirEncima(NUM, SELLO);
await escribirEncima(RARO, SELLO);
await mirar();
await comprobar('5b. con número de documento: se queda con su nombre y el original va a «SIN SELLAR»',
  Promise.all([dentro([]).then((l) => l.indexOf(NUM) !== -1), dentro(['_Previas']).then((l) => l.filter((n) => /^261019 FACTURA D26-00259 SIN SELLAR/.test(n)).length)]), [true, 1]);
await comprobar('5b. sin fecha ni tipo en el nombre: no se anota, se deja y el anterior va a previas',
  Promise.all([dentro([]).then((l) => l.indexOf(RARO) !== -1), dentro(['_Previas']).then((l) => l.indexOf('Escrito suelto ANTERIOR.pdf') !== -1),
    avisos().then((l) => l.filter((x) => x.indexOf('el nombre del documento no permite anotarlo') !== -1).length)]), [true, true, 1]);
await comprobar('5b. no queda ninguna copia ni apunte', Promise.all([dentro([]).then((l) => l.indexOf('_copia-ruta')), lista()]), [-1, []]);

console.log('--- 6. lo que borra la copia o la deja fuera ---');
await pagina.evaluate(async ([a, doc, pdf]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  c._hijos.set(doc, window.__disco.fich(doc, pdf, 'application/pdf'));
  const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
  await RutaCopia.alCopiarRuta(asunto, 'abierto', { nombre: doc, subcarpeta: '' });
}, [ASUNTO, DOC3, pdfConTexto('tercero')]);
await comprobar('6. copia hecha de un PDF nuevo', dentro(['_copia-ruta']), [DOC3]);
await comprobar('6. un PDF dentro de «_Previas» no guarda copia',
  pagina.evaluate(async ([a]) => {
    const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
    await RutaCopia.alCopiarRuta(asunto, 'abierto', { nombre: 'x.pdf', subcarpeta: '_Previas' });
    return (await window.__disco.abiertos.getDirectoryHandle(a).then((d) => d.getDirectoryHandle('_copia-ruta'))).kind && (await lista());
  }, [ASUNTO]).catch(() => 'x').then(() => dentro(['_copia-ruta'])), [DOC3]);
await comprobar('6. un archivo Word no guarda copia',
  pagina.evaluate(async (a) => RutaCopia.toca(App.E.listaAbiertos.filter((x) => x.nombre === a)[0], 'abierto', { nombre: 'x.docx', subcarpeta: '' }), ASUNTO), false);
await comprobar('6. un asunto archivado no guarda copia',
  pagina.evaluate(async (a) => RutaCopia.toca(App.E.listaAbiertos.filter((x) => x.nombre === a)[0], 'archivado', { nombre: 'x.pdf', subcarpeta: '' }), ASUNTO), false);
await comprobar('6. `_copia-ruta` la ignora lo que recorre carpetas',
  pagina.evaluate(() => Carpetas.esCarpetaTemporalDeSincronizacion('_copia-ruta')), true);
await comprobar('6. al archivar (trasladar) la copia no viaja',
  pagina.evaluate(async ([a]) => {
    await Carpetas.trasladar(App.E.abiertos, a, App.E.archivo, 'TRASLADADO');
    const d = await window.__disco.archivo.getDirectoryHandle('TRASLADADO');
    return Array.from(d._hijos.keys()).indexOf('_copia-ruta');
  }, [ASUNTO]), -1);
await mirar();
await comprobar('6. la lista de copias se vacía sola cuando el asunto ya no está abierto', lista(), []);

console.log('--- 7. la propia app escribe sobre el PDF ---');
await pagina.evaluate(async (a) => {
  const c = await window.__disco.abiertos.getDirectoryHandle('ASUNTO DOS', { create: true });
  c._hijos.set('uno.pdf', window.__disco.fich('uno.pdf', 'x', 'application/pdf'));
  const sub = await c.getDirectoryHandle('_copia-ruta', { create: true });
  sub._hijos.set('uno.pdf', window.__disco.fich('uno.pdf', 'x', 'application/pdf'));
  await Carpetas.renombrarFichero(c, 'uno.pdf', 'dos.pdf');
}, ASUNTO);
await comprobar('7. renombrarlo borra su copia (y la carpeta vacía)',
  pagina.evaluate(async () => Array.from((await window.__disco.abiertos.getDirectoryHandle('ASUNTO DOS'))._hijos.keys())), ['dos.pdf']);

await comprobar('sin errores de consola', Promise.resolve(errores.filter((e) => !/Failed to load resource/.test(e))), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
