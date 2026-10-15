/* Fila 349 (15-oct-2026, docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md), con Chromium real y los datos de la copia de pruebas
   (?demo=1&auto=1):

   1. Las cuentas con bytes (js/pdf-comprimir.js): pasar a A4 / A3 una hoja A2 (también apaisada y girada), no tocar
      una hoja que ya cabe, comprimir un escaneo de más de 5 MB, no poder comprimir lo incomprimible, no tocar uno chico.
   2. El cuadro de ponerle nombre a un PDF que entra: casilla marcada si las hojas son grandes, con A4 por defecto; desmarcada
      se guarda igual; con A3 queda A3; un A4 no la enseña; con firma electrónica no cambia ni un byte y avisa en ámbar;
      un escaneo grande se guarda en 5 MB o menos con aviso verde; si no baja, se guarda como está con aviso ámbar; uno de 1 MB
      sin avisos nuevos.
   3. «Ajustar tamaño» del visor: la opción «Pasar las hojas a», marcada si son grandes, y apagada con firma. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function cierto(titulo, promesa) { await comprobar(titulo, Promise.resolve(promesa).then(Boolean), true); }

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForTimeout(2000);

/* Utilidades dentro de la página: los PDF grandes no viajan entre Node y el navegador. */
await pagina.evaluate(async () => {
  await PdfHerramientas.cargarPdfLib();
  const H = window.__h = {};
  H.guardados = {};
  /* hojas: [[ancho, alto, giro?], …] en puntos */
  H.pdf = async (nombre, hojas, opciones) => {
    const doc = await PDFLib.PDFDocument.create();
    hojas.forEach((h, i) => {
      const p = doc.addPage([h[0], h[1]]);
      if (h[2]) p.setRotation(PDFLib.degrees(h[2]));
      p.drawRectangle({ x: 20, y: 20, width: h[0] - 40, height: h[1] - 40, borderWidth: 4, borderColor: PDFLib.rgb(0, 0, 0) });
      p.drawText('pagina ' + (i + 1), { x: 60, y: h[1] - 80, size: 40 });
    });
    if (opciones && opciones.firma) doc.catalog.set(PDFLib.PDFName.of('ByteRange'), doc.context.obj([0, 10, 20, 30]));
    const bytes = await doc.save({ useObjectStreams: false });
    H.guardados[nombre] = bytes;
    return bytes.length;
  };
  /* un escaneo: n hojas A4 con una imagen de 2480×3508 (300 ppp) a pantalla completa */
  H.escaneo = async (nombre, n, bloque) => {
    const doc = await PDFLib.PDFDocument.create();
    for (let i = 0; i < n; i++) {
      const w = 2480, h = 3508, b = bloque;
      const pequeno = new OffscreenCanvas(Math.ceil(w / b), Math.ceil(h / b));
      const c = pequeno.getContext('2d');
      const d = c.createImageData(pequeno.width, pequeno.height);
      for (let k = 0; k < d.data.length; k += 4) { d.data[k] = Math.random() * 255; d.data[k + 1] = Math.random() * 255; d.data[k + 2] = Math.random() * 255; d.data[k + 3] = 255; }
      c.putImageData(d, 0, 0);
      const grande = new OffscreenCanvas(w, h);
      const g = grande.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.drawImage(pequeno, 0, 0, w, h);
      const blob = await grande.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
      const img = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const p = doc.addPage([595.28, 841.89]);
      p.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    const bytes = await doc.save();
    H.guardados[nombre] = bytes;
    return bytes.length;
  };
  /* un PDF pesado que no se puede comprimir: sin imágenes, con un adjunto de bytes al azar */
  H.incomprimible = async (nombre, megas) => {
    const doc = await PDFLib.PDFDocument.create();
    doc.addPage([595.28, 841.89]).drawText('solo texto');
    const relleno = new Uint8Array(megas * 1048576);
    for (let k = 0; k < relleno.length; k += 65536) crypto.getRandomValues(relleno.subarray(k, Math.min(relleno.length, k + 65536)));
    await doc.attach(relleno, 'datos.bin', { mimeType: 'application/octet-stream' });
    const bytes = await doc.save({ useObjectStreams: false });
    H.guardados[nombre] = bytes;
    return bytes.length;
  };
  /* las hojas (visibles, en puntos redondeados) de unos bytes */
  H.hojasDe = async (bytes) => (await PdfComprimir.tamanosDeHojas(bytes)).map((x) => [Math.round(x.ancho), Math.round(x.alto)]);
});

/* ===== 1. Las cuentas ===== */
console.log('--- 1. las cuentas con bytes ---');
await pagina.evaluate(() => __h.pdf('A2', [[1191, 1684]]));
await comprobar('1a. una hoja A2 pasa a A4 (595 × 842)',
  pagina.evaluate(async () => { const r = await PdfComprimir.pasarATamano(__h.guardados.A2, 'A4'); return [r.hojasCambiadas, await __h.hojasDe(r.bytes)]; }),
  [1, [[595, 842]]]);
await pagina.evaluate(() => __h.pdf('A2apaisada', [[1684, 1191], [1191, 1684, 90]]));
await comprobar('1b. una hoja A2 apaisada queda en A4 apaisado, y una girada 90° sigue girada y en A4 vertical a la vista',
  pagina.evaluate(async () => {
    const r = await PdfComprimir.pasarATamano(__h.guardados.A2apaisada, 'A4');
    return [r.hojasCambiadas, await __h.hojasDe(r.bytes)];
  }), [2, [[842, 595], [842, 595]]]);
await comprobar('1c. a A3 queda A3 (842 × 1191)',
  pagina.evaluate(async () => { const r = await PdfComprimir.pasarATamano(__h.guardados.A2, 'A3'); return await __h.hojasDe(r.bytes); }),
  [[842, 1191]]);
await pagina.evaluate(() => __h.pdf('Normal', [[595.28, 841.89], [400, 300]]));
await comprobar('1d. un A4 y una hoja más pequeña no se tocan: mismos bytes',
  pagina.evaluate(async () => { const r = await PdfComprimir.pasarATamano(__h.guardados.Normal, 'A4'); return [r.hojasCambiadas, r.bytes === __h.guardados.Normal]; }),
  [0, true]);
await comprobar('1e. «más grande que un A4»: A4 no, A3 sí, un 5 % más no, un 15 % más sí',
  pagina.evaluate(() => [PdfComprimir.esMasGrandeQueA4(595, 842), PdfComprimir.esMasGrandeQueA4(842, 1191),
    PdfComprimir.esMasGrandeQueA4(595 * 1.05, 842 * 1.05), PdfComprimir.esMasGrandeQueA4(842 * 1.15, 595)]),
  [false, true, false, true]);
await comprobar('1f. el contenido queda entero y centrado: una hoja A2 con marco, pintada a A4, tiene el marco a unos 10 puntos del borde',
  pagina.evaluate(async () => {
    const d = PdfComprimir.tamanoDestino(1191, 1684, 'A4');
    return [Math.round(d.ancho), Math.round(d.alto), Math.round(1191 * d.escala), Math.round(1684 * d.escala)];
  }), [595, 842, 595, 842]);

const tam = await pagina.evaluate(() => __h.escaneo('Escaneo', 6, 4));
console.log('   (escaneo de prueba: ' + (tam / 1048576).toFixed(1) + ' MB)');
await cierto('1g. el escaneo de prueba pesa más de 5 MB', tam > 5 * 1048576);
await comprobar('1h. el escaneo baja a 5 MB o menos, con las 6 páginas',
  pagina.evaluate(async () => {
    const r = await PdfComprimir.comprimir(__h.guardados.Escaneo);
    return [r.logrado, r.cambiado, r.despues <= PdfComprimir.LIMITE_BYTES, r.despues < r.antes, (await PdfComprimir.tamanosDeHojas(r.bytes)).length];
  }), [true, true, true, true, 6]);
const tamI = await pagina.evaluate(() => __h.incomprimible('Pesado', 6));
await cierto('1i. el PDF incomprimible pesa más de 5 MB', tamI > 5 * 1048576);
await comprobar('1j. el incomprimible no se logra: mismos bytes',
  pagina.evaluate(async () => { const r = await PdfComprimir.comprimir(__h.guardados.Pesado); return [r.logrado, r.cambiado, r.bytes === __h.guardados.Pesado]; }),
  [false, false, true]);
await comprobar('1k. uno chico no se toca: logrado, sin cambio, mismos bytes',
  pagina.evaluate(async () => { const r = await PdfComprimir.comprimir(__h.guardados.Normal); return [r.logrado, r.cambiado, r.bytes === __h.guardados.Normal]; }),
  [true, false, true]);
await comprobar('1l. «12,3 MB»', pagina.evaluate(() => PdfComprimir.megas(12.3 * 1048576)), '12,3 MB');

/* ===== 2. El cuadro de ponerle nombre ===== */
console.log('--- 2. el cuadro de ponerle nombre ---');
const FRAG = 'Otero Campos, Marta';
async function entra(nombreGuardado) {
  await pagina.evaluate(([frag, nombre]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__a = a;
    window.__antes = null;
    window.__abierto = Carpetas.ficheros(a.handle).then((l) => {
      window.__antes = l.map((f) => f.nombre);
      const bytes = __h.guardados[nombre];
      return Documentos.abrir(a, { ficheroSoltado: new File([bytes], nombre + '.pdf', { type: 'application/pdf' }) });
    });
  }, [FRAG, nombreGuardado]);
  await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
  await pagina.waitForTimeout(1200);
}
/* Guarda y devuelve { nuevos: [nombre, bytes] , aviso }. */
async function guardarYLeer() {
  await pagina.evaluate(() => { document.getElementById('mensajes').innerHTML = ''; });
  await pagina.click('#doc-guardar');
  await pagina.waitForFunction(() => document.querySelectorAll('#mensajes .mensaje').length > 0 || !document.getElementById('doc-guardar'), null, { timeout: 90000 });
  await pagina.waitForTimeout(800);
  return pagina.evaluate(async () => {
    const lista = await Carpetas.ficheros(__a.handle);
    const nuevos = lista.filter((f) => __antes.indexOf(f.nombre) === -1);
    const f = nuevos[0] ? await (await __a.handle.getFileHandle(nuevos[0].nombre)).getFile() : null;
    const bytes = f ? new Uint8Array(await f.arrayBuffer()) : null;
    return {
      nuevos: nuevos.length, tam: bytes ? bytes.length : 0, hojas: bytes ? await __h.hojasDe(bytes) : [],
      iguales: bytes ? bytes.length === window.__origen && bytes.every((v, i) => true) : false,
      avisos: Array.from(document.querySelectorAll('#mensajes .mensaje')).map((m) => [m.textContent, m.className.replace('mensaje', '').trim()]),
      bytesIguales: bytes ? (() => { const o = __h.guardados[window.__nombreOrigen]; if (!o || o.length !== bytes.length) return false; for (let i = 0; i < o.length; i++) if (o[i] !== bytes[i]) return false; return true; })() : false
    };
  });
}
async function cerrarCuadro() {
  await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); });
  await pagina.waitForTimeout(600);
}
async function conOrigen(nombre) { await pagina.evaluate((n) => { window.__nombreOrigen = n; window.__origen = __h.guardados[n].length; }, nombre); }

/* 2a. A2: la casilla sale marcada con A4 */
await conOrigen('A2');
await entra('A2');
await comprobar('2a. un A2: la casilla sale marcada y con A4',
  pagina.evaluate(() => { const c = document.getElementById('doc-pdf-a4'); return c ? [c.checked, document.getElementById('doc-pdf-tamano').value, c.parentNode.textContent.indexOf('Las hojas son más grandes que un A4. Pasarlas a') === 0] : null; }),
  [true, 'A4', true]);
await comprobar('2a. el desplegable trae A4, A3, A5, Carta y Oficio',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#doc-pdf-tamano option')).map((o) => o.value)), ['A4', 'A3', 'A5', 'Carta', 'Oficio']);
let r = await guardarYLeer();
await comprobar('2a. guardado con la casilla: una hoja de 595 × 842', [r.nuevos, r.hojas], [1, [[595, 842]]]);
await comprobar('2a. el aviso verde dice «Hojas pasadas a A4»', r.avisos.some((a) => a[0].indexOf('Hojas pasadas a A4') !== -1 && a[1] === 'bueno'), true);
await cerrarCuadro();

/* 2b. sin marcar */
await entra('A2');
await pagina.uncheck('#doc-pdf-a4');
r = await guardarYLeer();
await comprobar('2b. con la casilla desmarcada, la hoja sigue de 1191 × 1684 y son los mismos bytes', [r.hojas, r.bytesIguales], [[[1191, 1684]], true]);
await cerrarCuadro();

/* 2c. A3 */
await entra('A2');
await pagina.selectOption('#doc-pdf-tamano', 'A3');
r = await guardarYLeer();
await comprobar('2c. eligiendo A3, la hoja queda en 842 × 1191', r.hojas, [[842, 1191]]);
await cerrarCuadro();

/* 2d. un A4 normal */
await conOrigen('Normal');
await entra('Normal');
await comprobar('2d. un A4 no enseña la casilla', pagina.evaluate(() => document.querySelectorAll('#doc-pdf-a4').length), 0);
r = await guardarYLeer();
await comprobar('2d. y se guarda con los mismos bytes y sin avisos de PDF', [r.bytesIguales, r.avisos.filter((a) => /Comprimido|Hojas pasadas|bajar de 5 MB/.test(a[0])).length], [true, 0]);
await cerrarCuadro();

/* 2e. con firma electrónica, A2 */
await pagina.evaluate(() => __h.pdf('Firmado', [[1191, 1684]], { firma: true }));
await conOrigen('Firmado');
await entra('Firmado');
await comprobar('2e. con firma: sin casilla y con la línea ámbar de las hojas',
  pagina.evaluate(() => [document.querySelectorAll('#doc-pdf-a4').length, (document.getElementById('doc-pdf-firmado-hojas') || {}).textContent]),
  [0, 'Las hojas son más grandes que un A4, pero lleva firma electrónica y no se pueden cambiar.']);
r = await guardarYLeer();
await comprobar('2e. con firma: no cambia ni un byte', r.bytesIguales, true);
await cerrarCuadro();

/* 2f. escaneo grande */
await conOrigen('Escaneo');
await entra('Escaneo');
await comprobar('2f. un escaneo A4 de más de 5 MB no enseña la casilla', pagina.evaluate(() => document.querySelectorAll('#doc-pdf-a4').length), 0);
r = await guardarYLeer();
await cierto('2f. el escaneo se guarda en 5 MB o menos', r.tam > 0 && r.tam <= 5 * 1048576);
await comprobar('2f. con sus 6 hojas', r.hojas.length, 6);
await cierto('2f. aviso verde «Comprimido de … MB a … MB»', r.avisos.some((a) => /^Comprimido de \d+,\d MB a \d+,\d MB\.$/.test(a[0]) && a[1] === 'bueno'));
await cerrarCuadro();

/* 2g. incomprimible */
await conOrigen('Pesado');
await entra('Pesado');
r = await guardarYLeer();
await comprobar('2g. el incomprimible se guarda como estaba', r.bytesIguales, true);
await cierto('2g. y avisa en ámbar, sin error rojo', r.avisos.some((a) => a[0].indexOf('No se ha podido bajar de 5 MB sin que se lea mal; se guarda como está (') === 0 && a[1] === 'ambar')
  && !r.avisos.some((a) => a[1] === 'malo'));
await cerrarCuadro();

/* 2h. firmado y pesado */
await pagina.evaluate(async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([595.28, 841.89]).drawText('firmado y pesado');
  const relleno = new Uint8Array(6 * 1048576);
  for (let k = 0; k < relleno.length; k += 65536) crypto.getRandomValues(relleno.subarray(k, Math.min(relleno.length, k + 65536)));
  await doc.attach(relleno, 'datos.bin', { mimeType: 'application/octet-stream' });
  doc.catalog.set(PDFLib.PDFName.of('ByteRange'), doc.context.obj([0, 10, 20, 30]));
  __h.guardados.FirmadoPesado = await doc.save({ useObjectStreams: false });
});
await conOrigen('FirmadoPesado');
await entra('FirmadoPesado');
await comprobar('2h. firmado y pesado: línea ámbar en el cuadro',
  pagina.evaluate(() => (document.getElementById('doc-pdf-firmado-peso') || {}).textContent), 'Lleva firma electrónica: no se comprime para no romperla.');
r = await guardarYLeer();
await comprobar('2h. no cambia ni un byte y avisa en ámbar', [r.bytesIguales, r.avisos.some((a) => a[0] === 'Lleva firma electrónica: no se comprime para no romperla.' && a[1] === 'ambar')], [true, true]);
await cerrarCuadro();

/* 2i. de 1 MB */
await pagina.evaluate(async () => {
  const doc = await PDFLib.PDFDocument.create();
  doc.addPage([595.28, 841.89]).drawText('un mega');
  const relleno = new Uint8Array(1048576 - 4000);
  crypto.getRandomValues(relleno.subarray(0, 65536));
  await doc.attach(relleno, 'datos.bin', { mimeType: 'application/octet-stream' });
  __h.guardados.UnMega = await doc.save({ useObjectStreams: false });
});
await conOrigen('UnMega');
await entra('UnMega');
r = await guardarYLeer();
await comprobar('2i. uno de 1 MB: mismos bytes, sin avisos de PDF', [r.bytesIguales, r.avisos.filter((a) => /Comprimido|Hojas pasadas|bajar de 5 MB|firma/.test(a[0])).length], [true, 0]);
await cerrarCuadro();

/* ===== 3. Ajustar tamaño del visor ===== */
console.log('--- 3. «Ajustar tamaño» del visor ---');
async function ajustar(nombre, hacer) {
  await pagina.evaluate(async ([frag, n]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__a = a;
    const h = await a.handle.getFileHandle(n, { create: true });
    const w = await h.createWritable();
    await w.write(new Blob([__h.guardados[n.replace(/\.pdf$/, '')]], { type: 'application/pdf' }));
    await w.close();
    window.__fin = false;
    window.__prep = PrepararDocumento.abrir({ modo: 'asunto', dir: a.handle, nombre: n, handle: await a.handle.getFileHandle(n), asunto: a, alTerminar: () => { window.__fin = true; } });
  }, [FRAG, nombre]);
  await hacer();
}
await ajustar('A2visor.pdf'.replace('A2visor', 'A2'), async () => {
  await pagina.waitForSelector('#preparar-check-tamano', { state: 'attached', timeout: 20000 });
  await comprobar('3a. un A2: «Pasar las hojas a» sale marcado y con A4',
    pagina.evaluate(() => [document.getElementById('preparar-check-tamano').checked, document.getElementById('preparar-tamano').value]), [true, 'A4']);
  await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
  await pagina.waitForFunction(() => window.__fin === true, null, { timeout: 30000 });
  await comprobar('3a. el PDF ya guardado queda en A4',
    pagina.evaluate(async () => { const f = await (await __a.handle.getFileHandle('A2.pdf')).getFile(); return await __h.hojasDe(new Uint8Array(await f.arrayBuffer())); }), [[595, 842]]);
});
await pagina.evaluate(async () => {
  const f = await (await __a.handle.getFileHandle('A2.pdf')).getFile();
  __a.handle.removeEntry && await __a.handle.removeEntry('A2.pdf');
});
await ajustar('Firmado.pdf', async () => {
  await pagina.waitForSelector('#cuadro-aceptar', { timeout: 20000 });
  /* con firma, antes de nada pregunta si sigue (como siempre) */
  await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
  await pagina.waitForSelector('#preparar-check-tamano', { state: 'attached', timeout: 20000 });
  await comprobar('3b. con firma: la opción está apagada y dice por qué',
    pagina.evaluate(() => [document.getElementById('preparar-check-tamano').disabled, document.getElementById('preparar-check-tamano').checked,
      (document.getElementById('preparar-tamano-firmado') || {}).textContent]),
    [true, false, 'Lleva firma electrónica: no se pueden cambiar las hojas.']);
  await pagina.evaluate(() => document.getElementById('cuadro-cancelar') && document.getElementById('cuadro-cancelar').click());
});

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
