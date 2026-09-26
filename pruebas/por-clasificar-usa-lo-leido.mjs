/* Prueba en navegador de verdad de "Por clasificar usa lo que ya se ha
   leído" (fila 174, docs/POR-CLASIFICAR-USA-LO-LEIDO.md).

   Un PDF suelto con sello de Séneca (26EM0368) y fecha (10-09-2026) de
   un alumno conocido, con un tipo que se reconoce por sus palabras
   clave: "Crear asunto con él" crea el asunto de un tirón (tipo y
   tercero claros) y el cuadro de "Poner nombre" sale directo, con la
   fecha y el registro ya rellenos y marcados; "Guardar" cierra el
   cuadro sin más.

   Sin el arreglo, esta prueba falla desde el principio: el botón sigue
   sin título («Crea el asunto con lo leído…») y, tras crear, el cuadro
   de nombre sale en blanco (sin la fecha del documento ni el registro),
   y "Guardar" vuelve a la lista de documentos en vez de cerrar. */
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

const ANA_DNI = '12345678Z';   /* letra comprobada, misma que pruebas/dni.mjs */
const NOMBRE_PDF = 'solicitud suelta.pdf';
const TEXTO = 'Se solicita plaza para Con Dni, Ana con DNI ' + ANA_DNI + '. ' +
  '2026/1/M0368 ENTRADA. Fecha: 10/09/2026.';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([texto, nombrePdf, dni]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify([
    { tipo: 'SOLICITUD', categoria: 'ALUMNADO', palabrasClave: ['plaza'] }
  ])));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;DNI/Pasaporte',
    'Con Dni, Ana;1000001;3º de E.S.O.;3º A;2026;Matriculada;10/05/2010;' + dni
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
  window.__disco.abiertos._hijos.set(nombrePdf, window.__disco.fich(nombrePdf, texto, 'application/pdf'));
}, [pdfConTexto(TEXTO), NOMBRE_PDF, ANA_DNI]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

console.log('--- lo leído deja el botón listo para crear de un tirón ---');
await pagina.waitForSelector('[data-accion-suelto="crear"][title]', { timeout: 15000 });
await comprobar('el título dice que crea con lo leído',
  pagina.locator('[data-accion-suelto="crear"]').getAttribute('title'),
  'Crea el asunto con lo leído y mete el documento dentro');
await comprobar('sigue siendo el botón principal (sin sugerencias)',
  pagina.locator('[data-accion-suelto="crear"]').evaluate((b) => b.classList.contains('boton-principal')), true);

console.log('--- "Crear asunto con él": crea de un tirón y abre el nombre directo ---');
await pagina.click('[data-accion-suelto="crear"]');
await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
await comprobar('la fecha leída va a la fecha del documento',
  pagina.locator('#doc-fecha').inputValue(), '2026-09-10');
await comprobar('«Está registrado en Séneca» sale marcado',
  pagina.locator('#doc-hay-registro').isChecked(), true);
await comprobar('avisa de que viene del sello',
  pagina.locator('#doc-registro-leido').textContent(), 'Leído del sello de Séneca.');
await comprobar('el año, la serie y el número, ya rellenos',
  pagina.evaluate(() => ({
    ano: document.getElementById('doc-ano').value,
    modo: document.querySelector('input[name="doc-modo"]:checked').value,
    sentido: document.querySelector('input[name="doc-sentido"]:checked').value,
    numero: document.getElementById('doc-numero').value
  })), { ano: '26', modo: 'M', sentido: 'E', numero: '0368' });

console.log('--- «Guardar» cierra el cuadro, sin volver a la lista ---');
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await comprobar('el documento ha quedado en la carpeta del asunto, ya con el registro leído',
  pagina.evaluate(async () => {
    const nombre = Object.keys(App.E.registro.asuntos).filter((n) => n.indexOf('Con Dni, Ana') !== -1)[0];
    const c = await window.__disco.abiertos.getDirectoryHandle(nombre);
    const ficheros = [];
    for await (const [k] of c.entries()) ficheros.push(k);
    return ficheros;
  }), ['260910 26EM0368 SOLICITUD.pdf']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
