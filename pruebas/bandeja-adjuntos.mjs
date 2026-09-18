/* Prueba en navegador de verdad de leer por dentro los adjuntos PDF de
   un correo de la bandeja (18-sep-2026, fila 49,
   docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md).

   Manda el correo: el PDF solo rellena el tercero o el tipo cuando el
   correo no los adivina, y aporta el registro/la fecha del propio
   documento, que el correo nunca trae. Si el correo ya encontró algo,
   el PDF no lo pisa, aunque traiga un dato distinto.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, el montaje
   de la bandeja de mentira de pruebas/correos.mjs, y el PDF de mentira
   de pruebas/dar-de-alta-desde-documento.mjs (copiado aquí para no
   atar los ficheros de prueba entre sí, mismo criterio que usa ese
   fichero con pruebas/registro.mjs). */
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

const ANA_DNI = '12345678Z';       /* misma que pruebas/dni.mjs: letra comprobada */
const BEA_DNI = '87654321X';
const BEA_CORREO = 'tutora-bea@example.com';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([anaDni, beaDni, beaCorreo]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify([
    { tipo: 'BAJA MEDICA', categoria: 'PERSONAL', palabrasClave: ['reposo', 'facultativo'] },
    { tipo: 'SOLICITUD', categoria: 'ALUMNADO', palabrasClave: ['plaza'] }
  ])));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;DNI/Pasaporte;Email tutor 1',
    'Con Dni, Ana;1000001;3º de E.S.O.;3º A;2026;Matriculada;10/05/2010;' + anaDni + ';',
    'Reconocida, Bea;1000002;3º de E.S.O.;3º A;2026;Matriculada;10/05/2010;' + beaDni + ';' + beaCorreo
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
}, [ANA_DNI, BEA_DNI, BEA_CORREO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La bandeja de correos: una carpeta de mentira, como en pruebas/correos.mjs */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});

function correoDeMentira(id, cambios) {
  return Object.assign({
    id: id,
    asunto: 'Un correo cualquiera',
    fecha: '2026-09-18T09:00:00.000Z',
    fechaUltimo: '2026-09-18T09:00:00.000Z',
    mensajes: 1,
    de: { nombre: 'Alguien', correo: id + '@fuera.es' },
    correos: [id + '@fuera.es'],
    adjuntos: []
  }, cambios || {});
}

async function dejarElCorreo(datos) {
  await pagina.evaluate((d) => {
    const b = window.__bandeja;
    b._hijos.set(d.id + '.json', window.__disco.fich(d.id + '.json', JSON.stringify(d)));
    (d.adjuntos || []).forEach(a => {
      const contenido = (d.__pdf && d.__pdf[a]) || 'un adjunto cualquiera';
      const tipo = /\.pdf$/i.test(a) ? 'application/pdf' : 'image/jpeg';
      b._hijos.set(a, window.__disco.fich(a, contenido, tipo));
    });
  }, datos);
}

/* Señalar la carpeta una vez, por Ajustes (igual que pruebas/correos.mjs):
   solo así window.Bandeja se queda con ella señalada de verdad, y no
   solo con window.__bandeja puesta a mano. */
async function senalarLaBandeja() {
  await pagina.evaluate(() => App.ir('ajustes'));
  await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
  await pagina.waitForSelector('#bloque-bandeja');
  await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
  await pagina.click('#botones-bandeja .boton');
  await pagina.waitForTimeout(600);
}

/* La bandeja solo mira cada 90s: forzar una mirada nueva y entrar en
   "Por clasificar" con la barra desplegada (fila 27, 17-sep-2026). */
async function mirarLaBandeja() {
  await pagina.evaluate(() => window.Bandeja.mirarDeNuevo());
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.click('.panel[data-vista="clasificar"]');
  await pagina.waitForTimeout(200);
  const boton = pagina.locator('#btn-correos-sin-clasificar');
  if ((await boton.getAttribute('aria-expanded')) !== 'true') await boton.click();
  await pagina.waitForTimeout(900);
}

await senalarLaBandeja();

/* La primera vez que hace falta pdf.js tarda en cargarse; en vez de un
   tiempo fijo (que podría no bastar, o sobrar de más), se espera a que
   la línea deje de decir "Leyendo…" o desaparezca del todo, con el
   mismo margen generoso que usa pruebas/dar-de-alta-desde-documento.mjs
   para lo mismo. */
async function esperarLinea(id) {
  await pagina.waitForFunction((id) => {
    const el = document.querySelector('[data-adjuntos-de="' + id + '"]');
    return !el || el.textContent !== 'Leyendo los documentos…';
  }, id, { timeout: 15000 });
}

/* App.E.nuevo no se limpia solo al volver a "Asuntos abiertos" (solo
   al crear un asunto de verdad): entre una prueba y la siguiente se
   deja como recién entrado, para no arrastrar lo que dejó la prueba
   anterior. */
async function limpiarNuevo() {
  await pagina.evaluate(() => {
    App.E.nuevo = { tipo: null, categoria: null, tercero: null, configCampos: [] };
  });
}

/* ============================================================
   1. SIN TERCERO EN EL CORREO, EL PDF TRAE EL DNI DE UN ALUMNO
   ============================================================ */
console.log('--- 1. sin tercero en el correo, el PDF trae un DNI conocido ---');
await dejarElCorreo(correoDeMentira('correo1', {
  adjuntos: ['correo1 - solicitud.pdf'],
  __pdf: { 'correo1 - solicitud.pdf': pdfConTexto(
    'El interesado, con DNI ' + ANA_DNI + ', solicita lo que corresponda.') }
}));
await mirarLaBandeja();
await esperarLinea('correo1');

await comprobar('1. la línea del documento trae el nombre de la alumna',
  pagina.locator('[data-adjuntos-de="correo1"]').textContent()
    .then(t => (t || '').indexOf('Con Dni, Ana') !== -1), true);

await limpiarNuevo();
await pagina.getByRole('button', { name: 'Crear el asunto' }).first().click();
await pagina.waitForTimeout(300);
await comprobar('1. la propuesta acaba con esa alumna',
  pagina.evaluate(() => App.E.nuevo.tercero && App.E.nuevo.tercero.nombre), 'Con Dni, Ana');
await comprobar('y con su categoría',
  pagina.evaluate(() => App.E.nuevo.categoria), 'ALUMNADO');

/* ============================================================
   2. EL CORREO YA RECONOCE A ALGUIEN: MANDA EL SUYO
   ============================================================ */
console.log('--- 2. el correo ya reconoce a alguien: no lo pisa el PDF ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo2', {
  de: { nombre: 'Bea', correo: BEA_CORREO },
  correos: [BEA_CORREO],
  adjuntos: ['correo2 - otro.pdf'],
  __pdf: { 'correo2 - otro.pdf': pdfConTexto(
    'Documento de otra persona, con DNI ' + ANA_DNI + ' dentro.') }
}));
await mirarLaBandeja();
await esperarLinea('correo2');

await comprobar('2. no aparece ninguna línea de documento: nada nuevo que enseñar',
  pagina.locator('[data-adjuntos-de="correo2"]').count(), 0);

const tarjeta2 = pagina.locator('#bandeja-correos .tarjeta-correo')
  .filter({ hasText: 'Un correo cualquiera' }).nth(1);
await limpiarNuevo();
await tarjeta2.getByRole('button', { name: 'Crear el asunto' }).click();
await pagina.waitForTimeout(300);
await comprobar('2. la propuesta manda con quien reconoció el correo',
  pagina.evaluate(() => App.E.nuevo.tercero && App.E.nuevo.tercero.nombre), 'Reconocida, Bea');

/* ============================================================
   3. SIN TIPO NI TERCERO EN EL CORREO, EL PDF TRAE EL TIPO
   ============================================================ */
console.log('--- 3. sin tipo en el correo, el PDF trae uno por sus palabras clave ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo3', {
  adjuntos: ['correo3 - parte.pdf'],
  __pdf: { 'correo3 - parte.pdf': pdfConTexto(
    'El interesado se encuentra de baja por reposo prescrito por su facultativo.') }
}));
await mirarLaBandeja();
await esperarLinea('correo3');

await comprobar('3. la línea del documento trae el tipo',
  pagina.locator('[data-adjuntos-de="correo3"]').textContent()
    .then(t => (t || '').indexOf('BAJA MEDICA') !== -1), true);

const tarjeta3 = pagina.locator('#bandeja-correos .tarjeta-correo')
  .filter({ hasText: 'Un correo cualquiera' }).nth(2);
await limpiarNuevo();
await tarjeta3.getByRole('button', { name: 'Crear el asunto' }).click();
await pagina.waitForTimeout(300);
await comprobar('3. sale ese tipo en la propuesta', pagina.evaluate(() => App.E.nuevo.tipo), 'BAJA MEDICA');

/* ============================================================
   4. EL CORREO YA TRAE TIPO: EL PDF APUNTA A OTRO, Y NO GANA
   ============================================================ */
console.log('--- 4. el correo ya trae tipo: no lo pisa el PDF ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo4', {
  asunto: 'Solicitud de plaza para el próximo curso',
  adjuntos: ['correo4 - otro-parte.pdf'],
  __pdf: { 'correo4 - otro-parte.pdf': pdfConTexto(
    'De baja por reposo, según prescripción de su facultativo.') }
}));
await mirarLaBandeja();
await esperarLinea('correo4');

await comprobar('4. no aparece ninguna línea de documento: nada nuevo que enseñar',
  pagina.locator('[data-adjuntos-de="correo4"]').count(), 0);

const tarjeta4 = pagina.locator('#bandeja-correos .tarjeta-correo')
  .filter({ hasText: 'Solicitud de plaza' });
await limpiarNuevo();
await tarjeta4.getByRole('button', { name: 'Crear el asunto' }).click();
await pagina.waitForTimeout(300);
await comprobar('4. sigue con el tipo que trajo el correo', pagina.evaluate(() => App.E.nuevo.tipo), 'SOLICITUD');

/* ============================================================
   5. SIN ADJUNTOS: NADA CAMBIA
   ============================================================ */
console.log('--- 5. correo sin adjuntos ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo5'));
await mirarLaBandeja();

await comprobar('5. no sale ninguna línea de documento', pagina.locator('[data-adjuntos-de="correo5"]').count(), 0);

/* ============================================================
   6. UN ADJUNTO QUE NO ES PDF: NI SE INTENTA LEER
   ============================================================ */
console.log('--- 6. un adjunto que no es PDF ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo6', { adjuntos: ['correo6 - foto.jpg'] }));
await mirarLaBandeja();
await esperarLinea('correo6');

await comprobar('6. no sale ninguna línea de documento', pagina.locator('[data-adjuntos-de="correo6"]').count(), 0);

/* ============================================================
   7. UN ADJUNTO ILEGIBLE: LA TARJETA QUEDA COMO HOY
   ============================================================ */
console.log('--- 7. un adjunto que no se puede leer ---');
await pagina.evaluate(() => App.ir('abiertos'));
await dejarElCorreo(correoDeMentira('correo7', { adjuntos: ['correo7 - roto.pdf'] }));
await pagina.evaluate(() => {
  const b = window.__bandeja;
  b._hijos.set('correo7 - roto.pdf', {
    kind: 'file', name: 'correo7 - roto.pdf',
    getFile: async () => { throw new Error('disco estropeado'); }
  });
});
await mirarLaBandeja();
await esperarLinea('correo7');

await comprobar('7. no sale ninguna línea de documento', pagina.locator('[data-adjuntos-de="correo7"]').count(), 0);
await comprobar('7. y el correo sigue en la bandeja, con su botón de siempre',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 7);
await pagina.locator('#bandeja-correos .tarjeta-correo').last()
  .getByRole('button', { name: 'Descartar' }).click();
await pagina.waitForSelector('#cuadro-titulo');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('y "Descartar" lo quita de la bandeja sin romper nada',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 6);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
