/* Prueba en navegador de verdad de la fila 236 de docs/COLA.md
   (docs/CORREO-ENVIADO-EN-PDF.md): al enviar un correo desde la app se
   guarda en la carpeta del asunto un PDF `AAMMDD CORREO <asunto>.pdf`.

   1. Enviar con un documento adjunto: en la carpeta aparece el CORREO, sin
      copia nueva del documento adjuntado, y sale en la tarjeta de
      documentos de la ficha sin recargar.
   2. El PDF trae a quién se envió, la fecha, el asunto, el texto y, al
      final, «Adjuntos:» con el nombre del documento.
   3. Otro correo sin adjuntos: segundo CORREO (con otro nombre), sin la
      línea de adjuntos, y el primero sigue igual.
   4. Si el script contesta `yaEnviado`, solo se guarda si no estaba.
   5. Si el PDF no se puede escribir, aviso ámbar y el cuadro se cierra igual.
   6. Con la respuesta de error del script, no se guarda ningún CORREO.
   Reutiliza el disco de mentira de pruebas/navegador.mjs y el envío con
   `page.route`, como pruebas/envios.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
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
async function comprobarQue(titulo, promesa, detalle) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const ASUNTO = '260910 CONTRATO 26-27 Empresa Test SL';
const URL_ENVIO = 'https://script.google.test/macros/s/FAKE/exec?k=clave-de-prueba';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (asunto) => {
  const abiertos = window.__disco.abiertos;
  const registro = { asuntos: { [asunto]: { estado: 'abierto', tipo: 'CONTRATO', categoria: 'EMPRESAS', tercero: 'Empresa Test SL' } } };
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('asuntos.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(registro)); await w.close();
  const c = await abiertos.getDirectoryHandle(asunto, { create: true });
  c._hijos.set('260901 docA.pdf', window.__disco.fich('260901 docA.pdf', 'el documento A'));
}, ASUNTO);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate((u) => { try { window.localStorage.setItem('gestor-envio-correo', u); } catch (e) {} }, URL_ENVIO);

let llamadas = [];
let respuesta = { ok: true, hilo: 'hilo-nuevo-001' };
await pagina.route(URL_ENVIO.split('?')[0] + '**', async (route) => {
  let cuerpo = {};
  try { cuerpo = JSON.parse(route.request().postData() || '{}'); } catch (e) { cuerpo = {}; }
  llamadas.push(cuerpo);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respuesta) });
});

const ficherosDe = () => pagina.evaluate(async (asunto) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  return Array.from(c._hijos.keys()).sort();
}, ASUNTO);
const textoDelPdf = (nombre) => pagina.evaluate(async ([asunto, n]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const f = await (await c.getFileHandle(n)).getFile();
  const bytes = new Uint8Array(await f.arrayBuffer());
  const pdfjs = await App.cargarPdfJs();
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  let t = '';
  for (let p = 1; p <= doc.numPages; p++) t += (await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join('\n') + '\n';
  return t;
}, [ASUNTO, nombre]);

async function abrirCorreo() {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ASUNTO + '"] .nombre-pulsable').click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#adjuntos-lista .correo-fila');
}
async function enviar(para, asunto, cuerpo, conAdjunto) {
  await abrirCorreo();
  await pagina.fill('#correo-otro', para);
  await pagina.fill('#correo-asunto', asunto);
  await pagina.fill('#correo-cuerpo-texto', cuerpo);
  if (conAdjunto) await pagina.check('.adjunto-marca >> nth=0');
  await pagina.click('#correo-enviar');
  await pagina.waitForSelector('#correo-resumen:not(.oculto)');
  await pagina.click('#correo-confirmar-envio');
  await pagina.waitForSelector('.mensaje.bueno:has-text("Correo enviado a")');
  await pagina.waitForTimeout(500);
}
async function cerrar() { await pagina.click('#cuadro-aceptar'); await pagina.waitForSelector('#capa', { state: 'hidden' }); }

/* 1 y 2. Con un adjunto. */
const hoy = await pagina.evaluate(() => U.aAaMmDd(U.hoyIso()));
const NOMBRE1 = hoy + ' CORREO Contrato firmado.pdf';
await enviar('proveedor@correo.es', 'Contrato firmado', 'Le adjunto el contrato.\n\nUn saludo.', true);
await comprobar('1. en la carpeta aparece el CORREO, y ninguna copia nueva del adjunto',
  ficherosDe(), ['260901 docA.pdf', NOMBRE1]);
await comprobarQue('1. sale en la tarjeta de documentos sin recargar (en «Llegados por correo»)',
  pagina.evaluate(() => /CORREO/.test(document.getElementById('ficha-documentos').textContent)));
const t1 = await textoDelPdf(NOMBRE1);
await comprobar('2. el PDF trae a quién, el asunto, el texto y los adjuntos',
  Promise.resolve(['proveedor@correo.es', 'Contrato firmado', 'Le adjunto el contrato.', 'Adjuntos:', '260901 docA.pdf', 'Para:', 'Fecha:', 'Asunto:'].map((x) => t1.indexOf(x) !== -1)),
  [true, true, true, true, true, true, true, true]);
await comprobarQue('2. la fecha del envío es la de hoy', Promise.resolve(t1.indexOf(String(new Date().getFullYear())) !== -1));
await cerrar();

/* 3. Sin adjuntos: otro CORREO con el mismo asunto → nombre libre; el primero sigue. */
llamadas = [];
await enviar('proveedor@correo.es', 'Contrato firmado', 'Solo una duda.', false);
const NOMBRE2 = hoy + ' CORREO Contrato firmado (2).pdf';
await comprobar('3. segundo CORREO con otro nombre, y el primero sigue', ficherosDe(), ['260901 docA.pdf', NOMBRE2, NOMBRE1]);   /* en orden alfabético */
const t2 = await textoDelPdf(NOMBRE2);
await comprobar('3. sin la línea de adjuntos', Promise.resolve([t2.indexOf('Adjuntos:') === -1, t2.indexOf('Solo una duda.') !== -1]), [true, true]);
await comprobar('3. el primero sigue igual', textoDelPdf(NOMBRE1).then((t) => t === t1), true);
await cerrar();

/* 4. yaEnviado: solo si no estaba. */
respuesta = { ok: true, yaEnviado: true };
await enviar('proveedor@correo.es', 'Contrato firmado', 'Solo una duda.', false);
await comprobar('4. yaEnviado con el CORREO ya en la carpeta: no se duplica',
  ficherosDe().then((f) => f.filter((n) => /CORREO/.test(n)).length), 2);
await cerrar();
await enviar('proveedor@correo.es', 'Otro asunto distinto', 'Texto nuevo.', false);
await comprobar('4. yaEnviado sin el PDF en la carpeta: se guarda',
  ficherosDe().then((f) => f.filter((n) => /CORREO Otro asunto distinto/.test(n)).length), 1);
await cerrar();

/* 5. El PDF no se puede escribir: ámbar y el cuadro se cierra igual. */
respuesta = { ok: true };
await pagina.evaluate(() => { window.__escribirBytes = Carpetas.escribirBytes; Carpetas.escribirBytes = async () => { throw new Error('disco lleno de mentira'); }; });
await abrirCorreo();
await pagina.fill('#correo-otro', 'proveedor@correo.es');
await pagina.fill('#correo-asunto', 'Se rompe el PDF');
await pagina.fill('#correo-cuerpo-texto', 'Texto.');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('.mensaje.bueno:has-text("Correo enviado a")');
await pagina.waitForTimeout(400);
await comprobar('5. aviso ámbar «El correo ha salido, pero no he podido guardar su PDF…»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#mensajes .mensaje.ambar')).some((m) => m.textContent.indexOf('El correo ha salido, pero no he podido guardar su PDF en el asunto') === 0)), true);
await comprobar('5. nada en rojo y el cuadro se puede cerrar',
  pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje.malo').length), 0);
await cerrar();
await pagina.evaluate(() => { Carpetas.escribirBytes = window.__escribirBytes; });

/* 6. El script contesta con error: ningún CORREO. */
const antes = (await ficherosDe()).length;
respuesta = { ok: false, motivo: 'La cuenta no ha podido mandarlo.' };
await abrirCorreo();
await pagina.fill('#correo-otro', 'proveedor@correo.es');
await pagina.fill('#correo-asunto', 'No sale');
await pagina.fill('#correo-cuerpo-texto', 'Texto.');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('#correo-resumen-aviso .aviso-rojo');
await comprobar('6. con error del script no se guarda ningún CORREO', ficherosDe().then((f) => f.length), antes);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
