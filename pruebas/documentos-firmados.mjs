/* Prueba en navegador de verdad de la fila 515 de docs/COLA.md (docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md, tema 392):
   la app reconoce los PDF con firma digital y cuenta las firmas. Firmado guardado encima tras «Ruta» (SIN FIRMAR, aviso,
   nota, marca «Firmado»), más firmas (CON 1 FIRMA), registrado después, la pregunta cuando llega algo sin firma encima de
   un firmado (los dos botones, y que sobrevive a recargar) y el firmado que llega con otro nombre (las tres salidas).
   Reutiliza el disco de mentira de pruebas/navegador.mjs; «guardar encima» es escribir en el fichero del disco. */
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


function firmado(texto, n) {
  let p = pdfConTexto(texto);
  for (let i = 0; i < n; i++) p += '\n% firma ' + (i + 1) + ': << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 100 200 300] >>';
  return p;
}

const ASUNTO = '261019 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const D1 = '261019 FACTURA D26-00301.pdf';
const D2 = '261019 INFORME D26-00302.pdf';
const D3 = '261019 ESCRITO D26-00303.pdf';
const ANTIGUO = '260911 SOLICITUD Antiguo.pdf';
const SELLO = pdfConTexto('2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02');

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([asunto, docs, pdf]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const escribir = async (n, t) => { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(t); await w.close(); };
  await escribir('rutas.json', JSON.stringify({ abiertos: 'IES/ASUNTOS ABIERTOS', archivo: 'ARCHIVO' }));
  localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\francisco\\Dropbox');
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  for (const d of docs) c._hijos.set(d, window.__disco.fich(d, pdf, 'application/pdf'));
}, [ASUNTO, [D1, D2, D3, ANTIGUO], pdfConTexto('original sin firma')]);
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

const dentro = (ruta) => pagina.evaluate(async ([asunto, ruta]) => {
  let d = await window.__disco.abiertos.getDirectoryHandle(asunto);
  for (const trozo of ruta) { try { d = await d.getDirectoryHandle(trozo); } catch (e) { return null; } }
  return Array.from(d._hijos.keys()).sort();
}, [ASUNTO, ruta]);
const escribirEncima = (nombre, texto) => pagina.evaluate(async ([asunto, nombre, texto]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const w = await (await c.getFileHandle(nombre)).createWritable(); await w.write(texto); await w.close();
}, [ASUNTO, nombre, texto]);
const ponerFichero = (nombre, texto) => pagina.evaluate(async ([asunto, nombre, texto]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  c._hijos.set(nombre, window.__disco.fich(nombre, texto, 'application/pdf'));
}, [ASUNTO, nombre, texto]);
const pulsarRuta = (doc) => pagina.evaluate(async ([a, doc]) => {
  const asunto = App.E.listaAbiertos.filter((x) => x.nombre === a)[0];
  await RutaCopia.alCopiarRuta(asunto, 'abierto', { nombre: doc, subcarpeta: '' });
}, [ASUNTO, doc]);
const mirar = async () => {
  await pagina.waitForFunction(() => !ColaGuardado.hayGuardado());
  await pagina.evaluate(() => window.dispatchEvent(new Event('focus')));
  await pagina.waitForTimeout(1500);
};
const avisos = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#mensajes .mensaje')).map((m) => m.className.replace('mensaje', '').trim() + '|' + m.textContent));
const hoy = await pagina.evaluate(() => DocumentosFirmados.fechaDeHoy());
const notas = (patron) => pagina.evaluate(([a, p]) => (App.E.registro.asuntos[a].notas || []).filter((n) => new RegExp(p).test(n.texto)).map((n) => n.texto), [ASUNTO, patron]);
const totalNotas = () => pagina.evaluate((a) => (App.E.registro.asuntos[a].notas || []).length, ASUNTO);
const linea = (doc) => pagina.evaluate(([a, d]) => DocumentosDatos.linea(App.E.listaAbiertos.filter((x) => x.nombre === a)[0], d), [ASUNTO, doc]);
const lista = () => pagina.evaluate(async () => {
  try { return ((await Carpetas.leerJson(App.E.gestor, 'copias-ruta.json')) || { items: [] }).items.map((i) => i.doc + (i.duda ? '?' + i.duda.firmas : '')); } catch (e) { return 'error'; }
});
const contenido = (doc) => pagina.evaluate(async ([a, d]) => (await (await (await window.__disco.abiertos.getDirectoryHandle(a)).getFileHandle(d)).getFile()).text(), [ASUNTO, doc]);
const previas = () => dentro(['_Previas']).then((l) => l || []);
const cajaFirmas = () => pagina.evaluate(() => (document.getElementById('ficha-firmas') || {}).innerText || '');
const ficha = () => pagina.evaluate((a) => { const x = App.E.listaAbiertos.filter((y) => y.nombre === a)[0]; return FichaNucleo.pintarFirmas(x); }, ASUNTO);

console.log('--- 0. contar firmas ---');
await comprobar('0. 0, 1 y 3 firmas', pagina.evaluate(() => [PdfMargenes.contarFirmas(new TextEncoder().encode('%PDF-1.4 nada')),
  PdfMargenes.contarFirmas(new TextEncoder().encode('<< /Type /Sig >>')),
  PdfMargenes.contarFirmas(new TextEncoder().encode('/ByteRange [0 1 2 3] /ByteRange [0 1 2 3] /ByteRange [4 5 6 7] /Type /Sig'))]), [0, 1, 3]);

console.log('--- 1. firmado guardado encima tras «Ruta» ---');
await pulsarRuta(D1);
const notas0 = await totalNotas();
await escribirEncima(D1, firmado('factura firmada', 1));
await mirar();
await comprobar('1. aviso verde sin ventanas',
  avisos().then((l) => l.filter((x) => /Documento firmado\./.test(x))),
  ['bueno|Documento firmado. El original sin firmar se conserva en «_Previas».']);
await comprobar('1. el original va a previas como «SIN FIRMAR»', previas().then((l) => l.filter((n) => / SIN FIRMAR\.pdf$/.test(n))), ['261019 FACTURA D26-00301 SIN FIRMAR.pdf']);
await comprobar('1. la copia no queda y lo llegado es el documento', Promise.all([dentro([]).then((l) => l.indexOf('_copia-ruta')), contenido(D1).then((t) => t.indexOf('ByteRange') !== -1)]), [-1, true]);
await comprobar('1. nota «Firmado el <fecha> · documento», una sola', notas('^Firmado'), ['Firmado el ' + hoy + ' · ' + D1]);
await mirar();
await comprobar('1. repetir la mirada no añade otra nota', totalNotas(), notas0 + 1);

console.log('--- 2. la marca ---');
await comprobar('2. la línea del documento dice «Firmado»', linea(D1), 'Firmado');
await pagina.evaluate((a) => FichaNucleo.pintarDocumentos(App.E.listaAbiertos.filter((x) => x.nombre === a)[0]), ASUNTO);
await pagina.waitForFunction((d) => Array.from(document.querySelectorAll('.ficha-documento-fila')).some((f) => f.dataset.doc === d && f.querySelector('.doc-datos')), D1, { timeout: 5000 }).catch(() => {});
await comprobar('2. se ve en la fila de la ficha', pagina.evaluate((d) => Array.from(document.querySelectorAll('.ficha-documento-fila')).filter((f) => f.dataset.doc === d).map((f) => (f.querySelector('.doc-datos') || {}).textContent)[0], D1), 'Firmado');
await comprobar('2. la mesa del hito la pone entre la fecha y el registro', pagina.evaluate(([a, d]) => DocumentosDatos.marcaDe(App.E.listaAbiertos.filter((x) => x.nombre === a)[0], d), [ASUNTO, D1]), 'Firmado');

console.log('--- 3. una firma más ---');
await pulsarRuta(D1);
await escribirEncima(D1, firmado('factura firmada dos veces', 2));
await mirar();
await comprobar('3. aviso verde',
  avisos().then((l) => l.filter((x) => /Documento con 2 firmas/.test(x))),
  ['bueno|Documento con 2 firmas. El anterior se conserva en «_Previas».']);
await comprobar('3. el anterior va a previas como «CON 1 FIRMA»', previas().then((l) => l.filter((n) => / CON 1 FIRMA\.pdf$/.test(n))), ['261019 FACTURA D26-00301 CON 1 FIRMA.pdf']);
await comprobar('3. nota con las dos firmas', notas('^Firmado \\(2'), ['Firmado (2 firmas) el ' + hoy + ' · ' + D1]);
await comprobar('3. la marca dice «Firmado (2)»', linea(D1), 'Firmado (2)');

console.log('--- 5. el firmado que luego se registra ---');
await pulsarRuta(D1);
await escribirEncima(D1, SELLO);
await mirar();
await comprobar('5. «Firmado (2) · Registro 26EM0368»', linea(D1), 'Firmado (2) · Registro 26EM0368 · 10/09/2026');
await comprobar('5. el original va a previas como «SIN SELLAR»', previas().then((l) => l.filter((n) => / SIN SELLAR/.test(n)).length), 1);

console.log('--- sello y firma a la vez: entra por el sello y se anota la firma ---');
await pulsarRuta(D2);
await escribirEncima(D2, SELLO + '\n% /ByteRange [0 1 2 3]');
await mirar();
await comprobar('sello+firma. registrado y firmado', linea(D2), 'Firmado · Registro 26EM0368 · 10/09/2026');

console.log('--- 6. sin firma ni sello encima de un documento sin firmar ---');
await pulsarRuta(D3);
await escribirEncima(D3, pdfConTexto('otro texto'));
await mirar();
await comprobar('6. aviso ámbar con el texto nuevo',
  avisos().then((l) => l.filter((x) => /no trae firma ni sello/.test(x))),
  ['ambar|Lo que has guardado encima de ' + D3 + ' no trae firma ni sello de registro. Lo he dejado; el anterior se conserva en «_Previas».']);
await comprobar('6. «ANTERIOR» en previas', previas().then((l) => l.filter((n) => /D26-00303 ANTERIOR\.pdf$/.test(n)).length), 1);

console.log('--- 7. sin firma encima de un firmado: la pregunta ---');
await pulsarRuta(D3);
await escribirEncima(D3, firmado('escrito firmado', 1));
await mirar();
await comprobar('7. antes: D3 firmado', linea(D3), 'Firmado');
await pulsarRuta(D3);
const notas7 = await totalNotas();
await escribirEncima(D3, pdfConTexto('versión sin firma'));
await mirar();
await ficha();
await comprobar('7. sale la pregunta en la ficha',
  cajaFirmas().then((t) => t.replace(/\s+/g, ' ')),
  'Lo que has guardado encima de ' + D3 + ' no trae firma, y el documento anterior estaba firmado. El firmado se conserva. ¿Con cuál te quedas? Quedarme con el firmado Usar el nuevo');
await comprobar('7. hasta contestar: sin marca, la copia sigue y la duda está en la lista', Promise.all([linea(D3), dentro(['_copia-ruta']), lista()]), ['', [D3], [D3 + '?1']]);
await comprobar('7. sin ventanas ni avisos verdes', avisos().then((l) => l.filter((x) => /^bueno\|(He vuelto|Se queda)/.test(x)).length), 0);
await mirar();
await comprobar('7. otra mirada no la resuelve', Promise.all([dentro(['_copia-ruta']), previas().then((l) => l.filter((n) => /D26-00303 (DESCARTADO|ANTERIOR)/.test(n)).length)]), [[D3], 1]);
/* «Recargar»: la pregunta no está en memoria, se vuelve a leer de la lista compartida. */
await pagina.evaluate(() => { document.getElementById('ficha-firmas').innerHTML = ''; });
await ficha();
await comprobar('7. tras recargar la pregunta sigue en la ficha, en la lista y sin marca', Promise.all([pagina.locator('.aviso-duda-firma').count(), lista(), linea(D3)]), [1, [D3 + '?1'], '']);

console.log('--- 7a. «Quedarme con el firmado» ---');
await pagina.waitForSelector('.duda-firmado');
await pagina.click('.duda-firmado');
await pagina.waitForFunction(() => !document.querySelector('.duda-firmado'));
await pagina.waitForTimeout(600);
await comprobar('7a. vuelve el firmado, con su marca', Promise.all([contenido(D3).then((t) => t.indexOf('ByteRange') !== -1), linea(D3)]), [true, 'Firmado']);
await comprobar('7a. lo guardado encima, en previas como «DESCARTADO»', previas().then((l) => l.filter((n) => /D26-00303 DESCARTADO\.pdf$/.test(n)).length), 1);
await comprobar('7a. aviso verde', avisos().then((l) => l.filter((x) => /He vuelto/.test(x))),
  ['bueno|He vuelto a poner el firmado. Lo que guardaste encima se conserva en «_Previas».']);
await comprobar('7a. sin nota nueva, sin copia y lista vacía', Promise.all([totalNotas(), dentro([]).then((l) => l.indexOf('_copia-ruta')), lista()]), [notas7, -1, []]);

console.log('--- 7b. «Usar el nuevo» ---');
await pulsarRuta(D3);
await escribirEncima(D3, pdfConTexto('versión sin firma otra vez'));
await mirar();
await ficha();
await pagina.waitForSelector('.duda-nuevo');
await pagina.click('.duda-nuevo');
await pagina.waitForFunction(() => !document.querySelector('.duda-nuevo'));
await pagina.waitForTimeout(600);
await comprobar('7b. se queda lo nuevo, sin marca', Promise.all([contenido(D3).then((t) => t.indexOf('versión sin firma otra vez') !== -1), linea(D3)]), [true, '']);
await comprobar('7b. el firmado, en previas como «ANTERIOR»', previas().then((l) => l.filter((n) => /D26-00303 ANTERIOR/.test(n)).length), 2);
await comprobar('7b. aviso verde', avisos().then((l) => l.filter((x) => /Se queda el nuevo/.test(x))),
  ['bueno|Se queda el nuevo, sin firma. El firmado se conserva en «_Previas».']);
await comprobar('7b. nota de sustitución', notas('^Sustituido el firmado'), ['Sustituido el firmado por una versión sin firma el ' + hoy + ' · ' + D3]);

console.log('--- 4. un firmado que llega con otro nombre ---');
const SUELTO = 'descarga firmada.pdf', OTRO = 'otra descarga.pdf';
await ponerFichero(SUELTO, firmado('suelto firmado', 1));
await ponerFichero(OTRO, firmado('otro suelto firmado', 1));
await ficha();
await comprobar('4. salen los dos avisos con las tres salidas',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.aviso-firma')).map((d) => [d.querySelector('strong').textContent, d.querySelectorAll('button').length, !!d.querySelector('select')])),
  [['Este papel lleva firma digital.', 2, true], ['Este papel lleva firma digital.', 2, true]]);
console.log('4a. «No es de este asunto»');
await pagina.evaluate(() => document.querySelectorAll('.aviso-firma')[1].querySelector('.firma-no-es').click());
await pagina.waitForFunction(() => document.querySelectorAll('.aviso-firma').length === 1);
await ficha();
await comprobar('4a. el aviso no vuelve y el fichero se queda', Promise.all([pagina.locator('.aviso-firma').count(), dentro([]).then((l) => l.indexOf(OTRO) !== -1)]), [1, true]);
console.log('4b. «Elige un documento…»');
await pagina.selectOption('.aviso-firma .firma-elegir', D2);
await pagina.waitForFunction(() => !document.querySelector('.aviso-firma'));
await pagina.waitForTimeout(500);
await comprobar('4b. ocupa el nombre del documento', Promise.all([contenido(D2).then((t) => t.indexOf('suelto firmado') !== -1), dentro([]).then((l) => l.indexOf(SUELTO))]), [true, -1]);
await comprobar('4b. el anterior, en previas (ya estaba registrado y firmado: «CON 1 FIRMA»)', previas().then((l) => l.filter((n) => /D26-00302 CON 1 FIRMA/.test(n)).length), 1);
console.log('4c. «Es un documento nuevo»');
const NUEVO = 'tercera descarga.pdf';
await ponerFichero(NUEVO, firmado('nuevo firmado', 1));
await ficha();
await pagina.click('.aviso-firma .firma-nuevo');
await pagina.waitForSelector('#capa:not(.oculto) #doc-guardar');
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForTimeout(900);
const nuevo = await dentro([]).then((l) => l.filter((n) => /^\d{6} .*D26-\d{5}\.pdf$/.test(n) && [D1, D2, D3].indexOf(n) === -1));
await comprobar('4c. queda `AAMMDD TIPO D26-xxxxx.pdf` y el suelto ya no está', Promise.all([nuevo.length, dentro([]).then((l) => l.indexOf(NUEVO))]), [1, -1]);
await comprobar('4c. con su marca y su nota', Promise.all([linea(nuevo[0]).then((t) => t.split(' · ')[0]), notas('^Firmado el .* · ' + nuevo[0].replace(/\./g, '\\.')).then((l) => l.length)]), ['Firmado', 1]);

console.log('--- 8. documento antiguo sin número: nota, no marca ---');
await pulsarRuta(ANTIGUO);
await escribirEncima(ANTIGUO, firmado('antiguo firmado', 1));
await mirar();
await comprobar('8. nota sí, marca no', Promise.all([notas('^Firmado el .* · ' + ANTIGUO).then((l) => l.length), linea(ANTIGUO)]), [1, '']);

await comprobar('sin errores de consola', Promise.resolve(errores.filter((e) => !/Failed to load resource/.test(e))), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
