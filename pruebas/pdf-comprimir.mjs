/* Prueba de docs/PDF-COMPRIMIR-Y-PASAR-A-A4.md (fila 349, 15-oct-2026), sin navegador:
   js/pdf-comprimir.js y las cuentas de tamaño de js/pdf-margenes.js solo saben de bytes.
   Mismo montaje que pruebas/margenes-pdf.mjs. La recodificación de imágenes (que en el
   navegador usa un lienzo) se sustituye aquí por una función falsa. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JPEG_BASE64 } from './apoyo/jpeg-de-prueba.mjs';

const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console, Buffer, Blob };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['lib/pdf-lib.min.js', 'pdf-herramientas.js', 'pdf-margenes.js', 'pdf-comprimir.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), ctx, { filename: f });
}
ctx.JPEG_BASE64 = JPEG_BASE64;

function ejecutar(cuerpoAsync) {
  return vm.runInContext('(async () => {\n' + cuerpoAsync + '\n})()', ctx);
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarCierto(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

/* Utilidades dentro del contexto: un PDF con `n` hojas de tamaño [w, h] puntos, cada una con
   el JPEG de prueba estirado a toda la hoja. */
await ejecutar(`
  globalThis.jpeg = Uint8Array.from(Buffer.from(JPEG_BASE64, 'base64'));
  globalThis.hacerPdf = async function (hojas, conImagen, giro) {
    const doc = await PDFLib.PDFDocument.create();
    const img = conImagen ? await doc.embedJpg(jpeg) : null;
    for (const [w, h] of hojas) {
      const p = doc.addPage([w, h]);
      if (giro) p.setRotation(PDFLib.degrees(giro));
      if (img) p.drawImage(img, { x: 0, y: 0, width: w, height: h });
      else p.drawText('hola', { x: 20, y: 20 });
    }
    return doc.save();
  };
  globalThis.tamanos = async function (bytes) {
    const d = await PDFLib.PDFDocument.load(bytes);
    return d.getPages().map(function (p) { const s = p.getSize(); return [Math.round(s.width * 10) / 10, Math.round(s.height * 10) / 10, p.getRotation().angle]; });
  };
`);

const MM = 72 / 25.4;
const A4 = [Math.round(210 * MM * 10) / 10, Math.round(297 * MM * 10) / 10];
const A4apaisado = [A4[1], A4[0]];

/* ---------- 1. Detectar hojas grandes ---------- */
comprobar('1a. un A4 no es grande', await ejecutar('return PdfMargenes.esHojaGrande(595.3, 841.9);'), false);
comprobar('1b. una Carta no es grande', await ejecutar('return PdfMargenes.esHojaGrande(612, 792);'), false);
comprobar('1c. un A3 es grande', await ejecutar('return PdfMargenes.esHojaGrande(841.9, 1190.6);'), true);
comprobar('1d. un A3 apaisado es grande', await ejecutar('return PdfMargenes.esHojaGrande(1190.6, 841.9);'), true);
comprobar('1e. un A4 con un 9 % de más no es grande', await ejecutar('return PdfMargenes.esHojaGrande(595.3 * 1.09, 841.9 * 1.09);'), false);
comprobar('1f. un A4 con un 12 % de más es grande', await ejecutar('return PdfMargenes.esHojaGrande(595.3 * 1.12, 841.9);'), true);
comprobar('1g. hojasGrandes de un PDF A2', (await ejecutar('const b = await hacerPdf([[1190.6, 1683.8]], false); return PdfMargenes.hojasGrandes(b);')).grandes, true);
comprobar('1h. hojasGrandes de un PDF A4', (await ejecutar('const b = await hacerPdf([[595.3, 841.9]], false); return PdfMargenes.hojasGrandes(b);')).grandes, false);

/* ---------- 2. Pasar a A4 ---------- */
const t2 = await ejecutar('const b = await hacerPdf([[1190.6, 1683.8], [1683.8, 1190.6]], true); const n = await PdfMargenes.pasarATamano(b, "A4"); return tamanos(n);');
comprobar('2a. un A2 vertical y otro apaisado quedan en A4 vertical y A4 apaisado',
  t2.map(function (t) { return [Math.round(t[0]), Math.round(t[1])]; }), [[Math.round(A4[0]), Math.round(A4[1])], [Math.round(A4apaisado[0]), Math.round(A4apaisado[1])]]);
const t2b = await ejecutar('const b = await hacerPdf([[1190.6, 1683.8]], false); const n = await PdfMargenes.pasarATamano(b, "A3"); return tamanos(n);');
comprobar('2b. eligiendo A3, el A2 queda en A3', [Math.round(t2b[0][0]), Math.round(t2b[0][1])], [842, 1191]);
const t2c = await ejecutar('const b = await hacerPdf([[400, 500], [1190.6, 1683.8]], false); const n = await PdfMargenes.pasarATamano(b, "A4"); return tamanos(n);');
comprobar('2c. una hoja menor que un A4 no se agranda', [Math.round(t2c[0][0]), Math.round(t2c[0][1])], [400, 500]);
comprobar('2d. la otra hoja del mismo PDF sí pasa a A4', [Math.round(t2c[1][0]), Math.round(t2c[1][1])], [Math.round(A4[0]), Math.round(A4[1])]);

/* El contenido queda entero y centrado: se dibuja con la escala y la posición esperadas. */
const contenido = await ejecutar(`
  try {
    const b = await hacerPdf([[1190.6, 1683.8]], true);
    const n = await PdfMargenes.pasarATamano(b, 'A4');
    const d = await PDFLib.PDFDocument.load(n);
    const c = d.getPages()[0].node.Contents();
    const lista = c instanceof PDFLib.PDFArray ? c.asArray().map(function (r) { return d.context.lookup(r); }) : [c];
    return lista.map(function (st) {
      const crudo = st.contents;
      const sin = st.dict.get(PDFLib.PDFName.of('Filter')) ? PDFLib.decodePDFRawStream(st).decode() : crudo;
      return Buffer.from(sin).toString('latin1');
    }).join('\\n');
  } catch (e) { return 'ERROR ' + String(e && e.message).slice(0, 200); }
`);
const escalas = [...contenido.matchAll(/([\d.\-]+) 0 0 ([\d.\-]+) ([\d.\-]+) ([\d.\-]+) cm/g)].map(function (m) { return Number(m[1]); });
comprobarCierto('2e. la hoja dibuja el contenido con una escala 0,5 (A2 -> A4)', escalas.some(function (e) { return Math.abs(e - 0.5) < 0.01; }), contenido.slice(0, 300));

/* Posición con giro: la hoja vieja y la nueva, para los cuatro giros, deben dejar el contenido
   en el mismo sitio visible (centrado y a escala 0,5 si cabe justo). Se comprueba con las
   cuentas: el rectángulo del contenido, pasado de coordenadas crudas a visibles. */
for (const giro of [0, 90, 180, 270]) {
  const r = await ejecutar(`
    const cw = 1190.6, ch = 1683.8;               // hoja cruda
    const visAncho = ${giro} % 180 ? ch : cw, visAlto = ${giro} % 180 ? cw : ch;
    const destAncho = ${giro} % 180 ? 841.9 : 595.3, destAlto = ${giro} % 180 ? 595.3 : 841.9;
    const crudoNuevoAncho = ${giro} % 180 ? destAlto : destAncho, crudoNuevoAlto = ${giro} % 180 ? destAncho : destAlto;
    const s = Math.min(destAncho / visAncho, destAlto / visAlto);
    const enc = { escala: s, x: (destAncho - visAncho * s) / 2, y: (destAlto - visAlto * s) / 2 };
    const pos = PdfMargenes.posicionCruda(${giro}, crudoNuevoAncho, crudoNuevoAlto, enc, cw, ch);
    // esquinas del contenido en coordenadas crudas de la hoja nueva
    const esquinas = [[pos.x, pos.y], [pos.x + cw * s, pos.y + ch * s]];
    const aVisible = function (p) {
      const x = p[0], y = p[1];
      if (${giro} === 90) return [y, crudoNuevoAncho - x];
      if (${giro} === 270) return [crudoNuevoAlto - y, x];
      if (${giro} === 180) return [crudoNuevoAncho - x, crudoNuevoAlto - y];
      return [x, y];
    };
    const v = esquinas.map(aVisible);
    const xs = [v[0][0], v[1][0]].sort(function (a, b) { return a - b; });
    const ys = [v[0][1], v[1][1]].sort(function (a, b) { return a - b; });
    return [xs[0], ys[0], xs[1], ys[1], enc.x, enc.y, visAncho * s, visAlto * s];
  `);
  const bien = Math.abs(r[0] - r[4]) < 0.01 && Math.abs(r[1] - r[5]) < 0.01 &&
    Math.abs((r[2] - r[0]) - r[6]) < 0.01 && Math.abs((r[3] - r[1]) - r[7]) < 0.01;
  comprobarCierto('2f. con la hoja girada ' + giro + '° el contenido queda donde toca', bien, JSON.stringify(r));
}
/* Y el PDF girado se guarda y se vuelve a abrir. */
const girado = await ejecutar('const b = await hacerPdf([[1190.6, 1683.8]], true, 90); const n = await PdfMargenes.pasarATamano(b, "A4"); return tamanos(n);');
comprobar('2g. una hoja A2 girada 90° queda en A4 (apaisada a la vista) conservando su giro', [Math.round(girado[0][0]), Math.round(girado[0][1]), girado[0][2]], [595, 842, 90]);

/* ---------- 3. Comprimir ---------- */
/* Falso recodificador: devuelve la mitad de bytes, y apunta lo que le piden. */
await ejecutar(`
  globalThis.llamadas = [];
  globalThis.recodificarFalso = async function (bytes, ancho, alto, calidad) {
    llamadas.push([ancho, alto, calidad]);
    return { bytes: bytes.slice(0, Math.max(10, Math.floor(bytes.length / 2))), ancho: ancho, alto: alto };
  };
`);
const pequeno = await ejecutar('const b = await hacerPdf([[595, 842]], true); const r = await PdfComprimir.comprimir(b, { recodificar: recodificarFalso }); return { igual: r.bytes === b, comprimido: r.comprimido, motivo: r.motivo, llamadas: llamadas.length };');
comprobar('3a. un PDF de menos de 5 MB no se toca (mismos bytes, sin llamadas)', pequeno, { igual: true, comprimido: false, motivo: 'pequeno', llamadas: 0 });

const grande = await ejecutar(`
  llamadas.length = 0;
  const b = await hacerPdf([[595, 842], [595, 842]], true);
  const tope = b.length - 100;                   // "5 MB" de mentira: un poco menos de lo que pesa
  const r = await PdfComprimir.comprimir(b, { recodificar: recodificarFalso, umbral: tope });
  const d = await PDFLib.PDFDocument.load(r.bytes);
  return { comprimido: r.comprimido, menor: r.despues < r.antes, cabe: r.despues <= tope, paginas: d.getPageCount(), llamadas: llamadas.length };
`);
comprobar('3b. con un tope más bajo que el PDF, se comprime, cabe y sigue teniendo sus hojas', grande, { comprimido: true, menor: true, cabe: true, paginas: 2, llamadas: 1 });

const nunca = await ejecutar(`
  llamadas.length = 0;
  const b = await hacerPdf([[595, 842]], true);
  const sinEfecto = async function (bytes, ancho, alto, calidad) { llamadas.push([ancho, alto, calidad]); return { bytes: bytes, ancho: ancho, alto: alto }; };
  const r = await PdfComprimir.comprimir(b, { recodificar: sinEfecto, umbral: 100 });
  return { comprimido: r.comprimido, motivo: r.motivo, igual: r.bytes === b, despues: r.despues === b.length, intentos: llamadas.length,
           calidadMinima: Math.min.apply(null, llamadas.map(function (l) { return l[2]; })),
           pppMinimo: Math.min.apply(null, llamadas.map(function (l) { return l[0]; })) };
`);
comprobar('3c. si no baja del tope, se queda igual y avisa "no-baja"', { c: nunca.comprimido, m: nunca.motivo, i: nunca.igual, d: nunca.despues }, { c: false, m: 'no-baja', i: true, d: true });
comprobarCierto('3d. prueba los cinco intentos de la escalera y nunca baja de calidad 0,6', nunca.intentos === 5 && nunca.calidadMinima >= 0.6, JSON.stringify(nunca));
/* 595 puntos de ancho = 8,26 pulgadas: a 150 ppp son 1240 px; la imagen de prueba mide 32 px y no se agranda. */
comprobarCierto('3e. nunca se agranda una imagen (con 32 px de origen, ningún intento pide más)', nunca.pppMinimo <= 32, JSON.stringify(nunca));

const pixeles = await ejecutar(`
  const doc = await PDFLib.PDFDocument.create();
  const img = await doc.embedJpg(jpeg);
  const p = doc.addPage([595, 842]);
  p.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
  const b = await doc.save();
  // imagen "grande" falsa: se anuncia 3000 px de ancho para ver a qué tamaño se pide
  const d = await PDFLib.PDFDocument.load(b);
  d.context.enumerateIndirectObjects().forEach(function (par) {
    if (par[1] instanceof PDFLib.PDFRawStream && par[1].dict.get(PDFLib.PDFName.of('Subtype')) === PDFLib.PDFName.of('Image')) {
      par[1].dict.set(PDFLib.PDFName.of('Width'), PDFLib.PDFNumber.of(3000));
      par[1].dict.set(PDFLib.PDFName.of('Height'), PDFLib.PDFNumber.of(4000));
    }
  });
  const b2 = await d.save();
  llamadas.length = 0;
  await PdfComprimir.comprimir(b2, { recodificar: recodificarFalso, umbral: 100 });
  return llamadas.map(function (l) { return l[0]; });
`);
/* 595 pt = 8,264 in. A 300 ppp -> 2479 px; 250 -> 2066; 200 -> 1653; 150 -> 1240. */
comprobar('3f. pide las anchuras de cada intento según los ppp (300, 250, 200, 200, 150)', pixeles, [2479, 2066, 1653, 1653, 1240]);

const resultado = await ejecutar(`
  llamadas.length = 0;
  const b = await hacerPdf([[595, 842]], true);
  const r = await PdfComprimir.comprimir(b, { recodificar: recodificarFalso, umbral: b.length - 100 });
  const d = await PDFLib.PDFDocument.load(r.bytes);
  let cs = '', bpc = 0, filtro = '';
  d.context.enumerateIndirectObjects().forEach(function (par) {
    const o = par[1];
    if (o instanceof PDFLib.PDFRawStream && o.dict.get(PDFLib.PDFName.of('Subtype')) === PDFLib.PDFName.of('Image')) {
      cs = o.dict.get(PDFLib.PDFName.of('ColorSpace')).toString();
      bpc = o.dict.get(PDFLib.PDFName.of('BitsPerComponent')).asNumber();
      filtro = o.dict.get(PDFLib.PDFName.of('Filter')).toString();
    }
  });
  return { cs: cs, bpc: bpc, filtro: filtro };
`);
comprobar('3g. la imagen nueva sigue siendo un JPEG de 8 bits en color', resultado, { cs: '/DeviceRGB', bpc: 8, filtro: '/DCTDecode' });

/* ---------- 4. Firma electrónica ---------- */
const firmado = await ejecutar(`
  const b = await hacerPdf([[595, 842]], false);
  const marca = Uint8Array.from(Buffer.from('\\n% /ByteRange [0 10 20 30]\\n', 'latin1'));
  const f = new Uint8Array(b.length + marca.length);
  f.set(b, 0); f.set(marca, b.length);
  return [PdfMargenes.pareceFirmado(f), PdfMargenes.pareceFirmado(b)];
`);
comprobar('4. un PDF con /ByteRange se reconoce como firmado y uno normal no', firmado, [true, false]);

/* ---------- 5. Peso legible ---------- */
comprobar('5. «12,3 MB»', await ejecutar('return PdfComprimir.pesoLegible(12.3 * 1024 * 1024);'), '12,3 MB');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
