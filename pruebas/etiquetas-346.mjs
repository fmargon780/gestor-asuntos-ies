/* Prueba de la fila 346 (15-oct-2026, docs/ETIQUETAS-TAMANO-CAMBIAR-ALINEAR.md): Etiquetas con tamaño de hoja,
   «Cambiar» en hoja y diseño, y alineación a la derecha.
   1. Modelo propio A3 de 2 × 4: la hoja de la vista previa guarda la proporción 297 × 420 y el PDF mide 297 × 420 mm.
   2. Modelo propio «Otro» 100 × 150 mm: lo mismo con esas medidas; medidas absurdas se avisan y no se guardan.
   3. Un modelo guardado sin `hoja` sale en A4.
   4. «Cambiar» un modelo propio conserva su id; «Cambiar» uno Avery crea uno propio y el Avery sigue igual.
   5. «Cambiar» el diseño «Sobre» lo guarda como copia; el «Sobre» sigue igual.
   6. «Alinear todo» a la derecha, cambiar uno a centrado, y en el PDF el texto a la derecha acaba a 2,5 mm del borde. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const poner = (id, v) => pagina.selectOption('#' + id, v);
async function esperarVista() { await pagina.waitForSelector('.et-hoja'); await pagina.waitForTimeout(200); }
const guardado = () => pagina.evaluate(async () => await Carpetas.leerJson(App.E.gestor, 'etiquetas.json'));
const proporcion = () => pagina.evaluate(() => { const r = document.querySelector('.et-hoja[data-hoja="0"]').getBoundingClientRect(); return Math.round(r.width / r.height * 1000) / 1000; });
async function pdf() {
  const [d] = await Promise.all([pagina.waitForEvent('download'), pagina.click('#et-guardar-pdf')]);
  return fs.readFileSync(await d.path()).toString('base64');
}
const tamanoPdf = (b64) => pagina.evaluate(async (b) => {
  const L = await PdfHerramientas.cargarPdfLib();
  const d = await L.PDFDocument.load(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
  const s = d.getPage(0).getSize();
  return [Math.round(s.width * 10) / 10, Math.round(s.height * 10) / 10];
}, b64);

await pagina.evaluate(() => App.ir('herramientas'));
await pagina.waitForSelector('#bloque-etiquetas');
await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
await pagina.click('#etiquetas-abrir');
await esperarVista();

console.log('--- 1. A3 de 2 × 4 ---');
await pagina.click('#et-modelo-nuevo');
await pagina.fill('#em-nombre', 'Grande');
await pagina.fill('#em-filas', '4');
await pagina.fill('#em-columnas', '2');
await poner('em-hoja', 'A3');
await pagina.click('#em-guardar');
await pagina.waitForSelector('#et-modelo');
await pagina.waitForTimeout(300);
await comprobar('1. la vista previa guarda la proporción de 297 × 420', proporcion(), Math.round(297 / 420 * 1000) / 1000);
await comprobar('1. el texto de la medida dice el tamaño de hoja', pagina.locator('#et-medida-modelo').textContent(), '2 × 4 · 148,5 × 105 mm · A3');
await comprobar('1. el PDF mide 297 × 420 mm', tamanoPdf(await pdf()), [841.9, 1190.6]);

console.log('--- 2. «Otro» 100 × 150 ---');
await pagina.click('#et-modelo-nuevo');
await pagina.fill('#em-nombre', 'Mía');
await pagina.fill('#em-filas', '1');
await pagina.fill('#em-columnas', '1');
await poner('em-hoja', 'Otro');
await pagina.fill('#em-hoja-ancho', '20');
await pagina.fill('#em-hoja-alto', '150');
await comprobar('2. una hoja de 20 mm se avisa', pagina.locator('#em-problema').textContent(), 'La hoja tiene que medir entre 50 y 1.000 mm de ancho y de alto.');
await pagina.click('#em-guardar');
await comprobar('2. y no se guarda (sigue el formulario)', pagina.evaluate(() => !!document.getElementById('em-guardar')), true);
await pagina.fill('#em-hoja-ancho', '100');
await pagina.click('#em-guardar');
await pagina.waitForSelector('#et-modelo');
await pagina.waitForTimeout(300);
await comprobar('2. la vista previa guarda la proporción 100 × 150', proporcion(), Math.round(100 / 150 * 1000) / 1000);
await comprobar('2. el PDF mide 100 × 150 mm', tamanoPdf(await pdf()), [283.5, 425.2]);

console.log('--- 3. un modelo guardado sin hoja sale en A4 ---');
await pagina.evaluate(async () => {
  const d = await Carpetas.leerJson(App.E.gestor, 'etiquetas.json');
  d.modelos.push({ id: 'viejo', nombre: 'Viejo', filas: 2, columnas: 2, sup: 0, inf: 0, izq: 0, der: 0, sepH: 0, sepV: 0 });
  await Carpetas.guardarJson(App.E.gestor, 'etiquetas.json', d);
});
await pagina.click('#et-volver');
await pagina.click('#etiquetas-abrir');
await esperarVista();
await poner('et-modelo', 'viejo');
await pagina.waitForTimeout(300);
await comprobar('3. A4', [await proporcion(), await pagina.locator('#et-medida-modelo').textContent()], [Math.round(210 / 297 * 1000) / 1000, '2 × 2 · 105 × 148,5 mm · A4']);

console.log('--- 4. «Cambiar» un modelo ---');
await pagina.click('#et-modelo-cambiar');
await pagina.fill('#em-filas', '3');
await pagina.click('#em-guardar');
await pagina.waitForSelector('#et-modelo');
await pagina.waitForTimeout(300);
const g4 = await guardado();
await comprobar('4. el propio cambia sus filas y conserva su id', g4.modelos.filter((m) => m.id === 'viejo').map((m) => [m.nombre, m.filas]), [['Viejo', 3]]);
await comprobar('4. y no se ha creado otro', g4.modelos.length, 3);
await poner('et-modelo', 'avery-L7160');
await pagina.waitForTimeout(200);
await pagina.click('#et-modelo-cambiar');
await comprobar('4. el de la app avisa de que se guarda como copia', pagina.evaluate(() => [document.querySelector('.et-aviso-copia').textContent, document.getElementById('em-nombre').value]),
  ['Es un modelo de la app: se guardará como copia con otro nombre.', 'Copia de L7160']);
await pagina.fill('#em-filas', '6');
await pagina.click('#em-guardar');
await pagina.waitForSelector('#et-modelo');
await pagina.waitForTimeout(300);
const g4b = await guardado();
await comprobar('4. se crea uno propio nuevo y queda elegido; el Avery sigue igual', pagina.evaluate((n) => {
  const s = document.getElementById('et-modelo'); const avery = Array.prototype.some.call(s.options, (o) => o.value === 'avery-L7160');
  return [n, s.options[s.selectedIndex].textContent.indexOf('Copia de L7160'), avery, EtiquetasModelos.todos().filter((m) => m.id === 'avery-L7160')[0].filas];
}, g4b.modelos.length), [4, 0, true, 7]);

console.log('--- 5. «Cambiar» el diseño Sobre ---');
await poner('et-diseno', 'sobre');
await pagina.waitForTimeout(200);
await pagina.click('#et-diseno-editar');
await comprobar('5. aviso de copia y nombre «Copia de Sobre»', pagina.evaluate(() => [document.querySelector('.et-aviso-copia').textContent, document.getElementById('ed-nombre').value]),
  ['Es un diseño de la app: se guardará como copia con otro nombre.', 'Copia de Sobre']);
await pagina.click('[data-quita="3"]');
await pagina.click('#ed-guardar');
await pagina.waitForSelector('#et-diseno');
await pagina.waitForTimeout(300);
const g5 = await guardado();
await comprobar('5. se guarda una copia de tres renglones', g5.disenos.map((d) => [d.nombre, d.renglones.length]), [['Copia de Sobre', 3]]);
await comprobar('5. el Sobre de la app sigue con cuatro', pagina.evaluate(() => EtiquetasDisenos.integrados().filter((d) => d.id === 'sobre')[0].renglones.length), 4);

console.log('--- 6. alinear a la derecha ---');
await poner('et-modelo', 'avery-L7159');
await poner('et-diseno', 'alumno');
await pagina.waitForTimeout(200);
await pagina.click('#et-diseno-editar');
await pagina.click('[data-alinea-todo="der"]');
await comprobar('6. «Alinear todo» pone la derecha en todos', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('[data-r="alinea"]'), (s) => s.value)), ['der', 'der', 'der']);
await pagina.selectOption('.et-renglon[data-i="1"] [data-r="alinea"]', 'centro');
await comprobar('6. cambiar uno suelto deja los demás', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('[data-r="alinea"]'), (s) => s.value)), ['der', 'centro', 'der']);
await comprobar('6. la vista previa ya lo enseña', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-hoja[data-hoja="0"] .et-casilla:not(.et-libre)')[0].querySelectorAll('.et-linea'), (l) => l.style.textAlign)), ['right', 'center', 'right']);
await pagina.click('#ed-guardar');
await pagina.waitForSelector('#et-diseno');
await pagina.waitForTimeout(300);
await comprobar('6. la lista de renglones lo dice', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-renglones-ver li'), (l) => l.textContent)),
  ['Apellidos, nombre · negrita · a la derecha', 'Unidad · centrado', 'Nº de identificación escolar · a la derecha']);
await pagina.evaluate(async () => {
  const L = await PdfHerramientas.cargarPdfLib();
  window.__dibujos = [];
  const original = L.PDFPage.prototype.drawText;
  L.PDFPage.prototype.drawText = function (t, o) { window.__dibujos.push({ t: t, x: o.x, size: o.size }); return original.apply(this, arguments); };
});
await pdf();
const dib = await pagina.evaluate(async () => {
  const L = await PdfHerramientas.cargarPdfLib();
  const f = await L.PDFDocument.create();
  const fu = await f.embedFont(L.StandardFonts.Helvetica), fb = await f.embedFont(L.StandardFonts.HelveticaBold);
  const g = EtiquetasModelos.geometria(EtiquetasModelos.todos().filter((m) => m.id === 'avery-L7159')[0]);
  const MM = 72 / 25.4, d = window.__dibujos[0], d2 = window.__dibujos[1];
  const w = fb.widthOfTextAtSize(d.t, d.size);
  const w2 = fu.widthOfTextAtSize(d2.t, d2.size);
  const finDer = (d.x + w) / MM, casillaFin = g.x0 + g.ancho;
  return [Math.round((casillaFin - finDer) * 100) / 100, Math.round((d2.x + w2 / 2) / MM * 100) / 100 === Math.round((g.x0 + g.ancho / 2) * 100) / 100];
});
await comprobar('6. en el PDF el texto a la derecha acaba a 2,5 mm del borde y el centrado va al medio', dib, [2.5, true]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
