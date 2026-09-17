/* Prueba en navegador de verdad del botón "Dar de alta" en la tarjeta de
   un documento suelto de "Por clasificar" (17-sep-2026, fila 42,
   docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md, sección 1).

   Reutiliza el disco de mentira de pruebas/navegador.mjs y el PDF de
   mentira de pruebas/registro.mjs (mismo pdfConTexto, copiado aquí para
   no atar los ficheros de prueba entre sí, igual que hace
   pruebas/registro-sellado.mjs).

   Lo que tiene que pasar: un PDF con un NIF que no está en ninguna lista
   trae, junto a la línea de la propuesta, el botón "Dar de alta: <razón
   social> — <NIF>"; al pulsarlo se abre el alta de EMPRESAS que ya
   existe, con la razón social y el NIF ya escritos; al guardar, la
   propuesta se actualiza sola con el tercero recién creado, sin volver
   a leer el PDF. */
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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const NIF_PDF = 'Presupuesto de mantenimiento.pdf';
const TEXTO = 'Se solicita presupuesto a Instalaciones Bermejo, S.L. con NIF B29123456 ' +
  'para el mantenimiento de la caldera de la calefacción.';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([nombre, contenido]) => {
  const raiz = window.__disco.abiertos._hijos;
  raiz.set(nombre, window.__disco.fich(nombre, contenido, 'application/pdf'));
}, [NIF_PDF, pdfConTexto(TEXTO)]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

console.log('--- el botón de alta sale con la razón social y el NIF ---');
await pagina.waitForSelector('.boton-dar-de-alta', { timeout: 15000 });
await comprobar('el botón dice la razón social y el NIF',
  pagina.locator('.boton-dar-de-alta').textContent(),
  'Dar de alta: Instalaciones Bermejo, S.L. — B29123456');
await comprobar('no sale "Aceptar": no hay tipo ni tercero claros todavía',
  pagina.locator('.tarjeta-propuesta .boton-principal').count(), 1);   /* solo el de alta */

console.log('--- lo pulsa: se abre el alta ya existente, con los datos escritos ---');
await pagina.click('.boton-dar-de-alta');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el título dice que es un alta de empresa',
  pagina.locator('#cuadro-titulo').textContent(), 'Dar de alta en EMPRESAS');
await comprobar('la razón social ya está escrita',
  pagina.locator('.alta-campo[data-campo="Razón social"]').inputValue(),
  'Instalaciones Bermejo, S.L.');
await comprobar('el NIF ya está escrito',
  pagina.locator('.alta-campo[data-campo="NIF"]').inputValue(), 'B29123456');

console.log('--- se guarda: la aplicación no ha dado de alta nada por su cuenta hasta aquí ---');
/* El lector ya ha creado un empresas.csv vacío al montar su contexto
   (lo mismo que hace cualquier pantalla que lo consulte, js/datos.js):
   lo que se comprueba es que la empresa todavía no está escrita dentro,
   antes de pulsar Guardar. */
await comprobar('la empresa todavía no está escrita', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const d = await g.getDirectoryHandle('datos');
  const h = await d.getFileHandle('empresas.csv');
  const texto = await (await h.getFile()).text();
  return texto.indexOf('Instalaciones Bermejo') !== -1;
}), false);

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('ahora sí está escrito en empresas.csv', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const d = await g.getDirectoryHandle('datos');
  const h = await d.getFileHandle('empresas.csv');
  const texto = await (await h.getFile()).text();
  return texto.indexOf('Instalaciones Bermejo, S.L.') !== -1 && texto.indexOf('B29123456') !== -1;
}), true);

console.log('--- la tarjeta se actualiza sola, sin volver a leer el PDF ---');
await comprobar('el botón de alta ya no sale', pagina.locator('.boton-dar-de-alta').count(), 0);
await comprobar('la línea de la propuesta ya trae el tercero',
  pagina.locator('.tarjeta-propuesta').first().textContent()
    .then(t => t.indexOf('Instalaciones Bermejo, S.L.') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
