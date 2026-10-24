/* Prueba de la fila 385 (docs/CREAR-DESDE-POR-CLASIFICAR-CON-TIPO.md):
   un documento suelto cuyo tipo adivinado (EMPRESAS) y cuya persona
   adivinada (ALUMNADO) son de categorías distintas NO crea ningún asunto
   con «Crear asunto con él»: abre Nuevo asunto con la persona como
   sugerencia, con el botón de crear desactivado hasta elegir tipo. Y
   App.crearAsuntoDelFormulario, sin tipo, no crea carpeta. */
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
    { tipo: 'SOLICITUD', categoria: 'EMPRESAS', palabrasClave: ['plaza'] },
    { tipo: 'BECA', categoria: 'ALUMNADO' }
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

console.log('--- tipo y persona de categorías distintas: no se crea nada ---');
await pagina.waitForSelector('#lista-sueltos [data-accion-suelto="crear"][data-ayuda-clave]', { timeout: 15000 });
await comprobar('el título es el de «tercero sin tipo»',
  pagina.locator('#lista-sueltos [data-accion-suelto="crear"]').evaluate((b) => AyudaRaton.ayuda(b).ayuda),
  'Deja elegido el tercero y espera a que elijas el tipo de asunto.');
await comprobar('la línea de lo leído no enseña el tipo',
  pagina.locator('#lista-sueltos .tarjeta-propuesta').first().textContent().then(t => t.indexOf('SOLICITUD') === -1 && t.indexOf('26EM0368') !== -1 && t.indexOf('Con Dni, Ana') !== -1), true);
const carpetas = () => pagina.evaluate(async () => {
  const n = [];
  for await (const [k, v] of window.__disco.abiertos.entries()) if (v.kind === 'directory' && k !== '_GESTOR') n.push(k);
  return n.length;
});
const antes = await carpetas();
await pagina.click('#lista-sueltos [data-accion-suelto="crear"]');
await pagina.waitForSelector('#aviso-pendiente:not(.oculto)');
await comprobar('avisa de que el asunto se crea con un documento',
  pagina.locator('#aviso-pendiente').textContent().then(t => t.indexOf('Este asunto se crea con un documento') !== -1), true);
await comprobar('el botón de crear está desactivado y dice qué falta (texto de siempre)',
  pagina.evaluate(() => ({ off: document.getElementById('btn-crear').disabled, t: document.getElementById('btn-crear').textContent.trim() })),
  { off: true, t: 'Falta elegir la persona y el tipo de asunto' });
await comprobar('la persona sale como sugerencia',
  pagina.locator('#nuevo-sugerencia, #pantalla-nuevo').first().textContent().then(t => t.indexOf('Con Dni, Ana') !== -1 && t.indexOf('Elige el tipo de asunto') !== -1), true);
await comprobar('no se ha creado ninguna carpeta', carpetas().then(n => n === antes), true);

console.log('--- sin tipo, el botón Crear no crea nada ---');
await pagina.evaluate(() => { App.E.nuevo.tipo = null; return App.crearAsuntoDelFormulario(); });
await comprobar('sigue sin carpeta nueva', carpetas().then(n => n === antes), true);

console.log('--- al elegir tipo y crear, el asunto lleva su tipo ---');
await pagina.getByRole('button', { name: 'BECA', exact: true }).click();
await comprobar('el botón se activa', pagina.locator('#btn-crear').isEnabled(), true);
await pagina.click('#btn-crear');
await pagina.waitForFunction(() => Object.keys(App.E.registro.asuntos).length === 1, null, { timeout: 15000 });
await comprobar('el asunto nuevo tiene tipo BECA',
  pagina.evaluate(() => { const a = App.E.registro.asuntos; return a[Object.keys(a)[0]].tipo; }), 'BECA');

console.log('--- App.nuevoAsuntoCon con tipo y persona que no encajan: vuelve la parrilla ---');
await pagina.evaluate(() => App.nuevoAsuntoCon({ tipo: 'SOLICITUD', tercero: App.E.registro && null || { categoria: 'ALUMNADO', nombre: 'Con Dni, Ana' } }));
await comprobar('sin tipo elegido y sin la línea «Tipo de asunto: X · Cambiar»',
  pagina.evaluate(() => ({ tipo: App.E.nuevo.tipo, enLinea: App.E.nuevo.tipoEnLinea })), { tipo: null, enLinea: false });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
