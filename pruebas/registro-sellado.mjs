/* Prueba en navegador de verdad de docs/REGISTRO-SIN-DUPLICAR.md (fila
   20, 17-sep-2026): un PDF con el sello de Séneca que YA está en la
   carpeta, con un nombre que no ha puesto la aplicación, se detecta
   solo y sale la línea de arriba preguntando de qué documento es.

   Lo que tiene que pasar:
     - si hay un PDF así, sale el aviso con el sello leído y un
       desplegable con los documentos del asunto;
     - al elegir uno, el PDF sellado se renombra con el nombre que le
       toca (el mismo que generaría el botón Registrar de siempre), el
       documento viejo se manda a la papelera, se apunta la nota del
       registro, y el aviso desaparece;
     - "No es un registro" hace desaparecer el aviso sin tocar nada, y
       no vuelve a preguntar por ese mismo PDF.

   Reutiliza el disco de mentira y el PDF de mentira de
   pruebas/registro.mjs (mismo pdfConTexto, copiado aquí para no atar
   los dos ficheros de prueba entre sí). */
import { chromium } from 'playwright';
import fs from 'fs';

function pdfConTexto(texto) {
  const escapado = String(texto).replace(/([()\\])/g, '\\$1');
  const stream = 'BT /F1 8 Tf 20 750 Td (' + escapado + ') Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objetos.length; i++) {
    offsets.push(pdf.length);
    pdf += (i + 1) + ' 0 obj\n' + objetos[i] + '\nendobj\n';
  }
  const inicioXref = pdf.length;
  let xref = 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += xref;
  pdf += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\n' +
         'startxref\n' + inicioXref + '\n%%EOF';
  return pdf;
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'documentos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const NOMBRE_ASUNTO = '260911 SOLICITUD Prueba del sello 12345678A';
const ORIGINAL = '260911 SOLICITUD Prueba del sello.pdf';
const SELLADO = '29700692 - Fuente Lucena.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* El asunto con el documento ya nombrado, y el PDF sellado suelto al
   lado, tal como llegaría de descargarlo de Séneca. */
await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.original, window.__disco.fich(datos.original, 'el original, sin sello'));
  carpeta._hijos.set(datos.sellado, window.__disco.fich(datos.sellado, datos.pdf, 'application/pdf'));
}, {
  asunto: NOMBRE_ASUNTO, original: ORIGINAL, sellado: SELLADO,
  pdf: pdfConTexto('2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02')
});

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

console.log('--- se detecta solo, sin pulsar Registrar ---');
await pagina.waitForSelector('.aviso-sello');
await comprobar('el aviso dice el código y la fecha del sello',
  pagina.locator('.aviso-sello strong').textContent(),
  'Este papel trae el sello de registro 26EM0368 (ENTRADA, 10/09/2026).');
await comprobar('el desplegable ofrece el documento ya nombrado',
  pagina.locator('.sello-elegir option').allTextContents(),
  ['Elige un documento…', ORIGINAL]);

console.log('--- se elige el documento del que es el registro ---');
await pagina.selectOption('.sello-elegir', ORIGINAL);
await pagina.waitForTimeout(500);

/* Desde la fila 58 (18-sep-2026, docs/AJUSTES-DE-USO-2026-09-18.md, 4)
   el original ya no va a la papelera: se queda en la carpeta,
   renombrado con "SIN SELLAR" al final. */
const SIN_SELLAR = '260911 SOLICITUD Prueba del sello SIN SELLAR.pdf';
/* Fila 160 (docs/VERSIONES-PREVIAS.md): el SIN SELLAR, en la subcarpeta «Versiones previas». */
await comprobar('el PDF sellado se ha renombrado, y el original se conserva como SIN SELLAR en «Versiones previas»',
  pagina.evaluate(async (asunto) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
    const nombres = [];
    for await (const p of carpeta.entries()) nombres.push(p[0]);
    const previas = [];
    for await (const p of (await carpeta.getDirectoryHandle('Versiones previas')).entries()) previas.push(p[0]);
    return [nombres.sort(), previas];
  }, NOMBRE_ASUNTO),
  [['260911 26EM0368 SOLICITUD Prueba del sello.pdf', 'Versiones previas'], [SIN_SELLAR]]);

await comprobar('el aviso ha desaparecido', pagina.locator('.aviso-sello').count(), 0);

await comprobar('se apunta la nota del registro, sin ninguna de mandarlo a la papelera',
  pagina.evaluate(async (asunto) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    const notas = (j.asuntos[asunto] && j.asuntos[asunto].notas) || [];
    return notas.map(n => n.texto).sort();
  }, NOMBRE_ASUNTO),
  ['Registrado 26EM0368 el 10/09/2026 · ' + ORIGINAL + '. Se conserva el original sin sellar.'].sort());

await comprobar('el documento SIN SELLAR sale plegado en «1 versión previa · ver»',
  pagina.locator('.ficha-previas summary').textContent(), '1 versión previa · ver');

console.log('--- "No es un registro" descarta el aviso y no vuelve a preguntar ---');
const OTRO_SELLADO = '29700777 - Otro papel.pdf';
await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
  carpeta._hijos.set(datos.nombre, window.__disco.fich(datos.nombre, datos.pdf, 'application/pdf'));
}, {
  asunto: NOMBRE_ASUNTO, nombre: OTRO_SELLADO,
  pdf: pdfConTexto('2026/29700692/A000000000099SALIDAFecha: 01/09/2026 09:00:00')
});
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#lista-abiertos .nombre-pulsable');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.aviso-sello');

await pagina.click('.sello-no-es');
await pagina.waitForTimeout(400);
await comprobar('el aviso desaparece al descartarlo', pagina.locator('.aviso-sello').count(), 0);
await comprobar('el PDF descartado sigue en la carpeta, tal cual',
  pagina.evaluate(async (datos) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
    const nombres = [];
    for await (const p of carpeta.entries()) nombres.push(p[0]);
    return nombres.indexOf(datos.nombre) !== -1;
  }, { asunto: NOMBRE_ASUNTO, nombre: OTRO_SELLADO }), true);

/* Se vuelve a abrir la ficha: al haberlo descartado, no debe volver a
   salir el aviso para el mismo fichero. */
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#lista-abiertos .nombre-pulsable');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(500);
await comprobar('al volver a entrar, no vuelve a preguntar por el mismo PDF',
  pagina.locator('.aviso-sello').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
