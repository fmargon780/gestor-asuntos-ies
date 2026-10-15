/* Prueba de la fila 344 (14-oct-2026, docs/ETIQUETAS.md): imprimir etiquetas.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1): alumnado con direcciones, dos hermanos
   (Aguilar Ponce), una alumna sin dirección (Gallardo Reyes), varias unidades y personal con especialidad.

   1. Herramientas → «Etiquetas» abre la pantalla a todo el ancho; filtro por una unidad: la cuenta coincide.
   2. Modelo 3×8 y diseño «Alumno»: 24 casillas por hoja, nombre, unidad y número escolar, por apellidos.
   3. Casillas gastadas: la primera etiqueta va en la sexta; «Hoja nueva» las desmarca.
   4. Diseño «Sobre»: dos hermanos, una sola etiqueta «Familia de …»; la familia sin dirección, con su aviso.
   5. «Copias por persona» = 3.
   6. «Nuevo modelo» 2×2: cada etiqueta, un cuarto del A4.
   7. Un diseño propio de dos renglones se guarda en _GESTOR/etiquetas.json y sale en la vista previa.
   8. «Guardar PDF»: A4 con las hojas que dice el pie, y la letra a tamaño real.
   9. Desde el asunto de grupo, «Imprimir etiquetas» abre la pantalla con sus personas.
   10. Pestaña Personal con el diseño «Profesor». */
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

/* Fila 350: los criterios del filtro y los del personal se eligen escribiendo; modelo y diseño siguen siendo listas. */
const poner = async (id, v) => {
  if ((await pagina.evaluate((i) => document.getElementById(i).tagName, id)) === 'SELECT') return pagina.selectOption('#' + id, v);
  await pagina.fill('#' + id, v);
  await pagina.press('#' + id, 'Enter');
};
const textos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-hoja[data-hoja="0"] .et-casilla'), (c) =>
  Array.prototype.map.call(c.querySelectorAll('.et-linea'), (l) => l.textContent)));
const pie = () => pagina.locator('#et-cuenta').textContent();
async function esperarVista() { await pagina.waitForSelector('.et-hoja'); await pagina.waitForTimeout(200); }

console.log('--- 1. abrir y filtrar ---');
await pagina.evaluate(() => App.ir('herramientas'));
await pagina.waitForSelector('#bloque-etiquetas');
await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
await pagina.click('#etiquetas-abrir');
await esperarVista();
await comprobar('1. la pantalla ocupa el ancho y la lista de bloques se esconde', pagina.evaluate(() => [
  document.getElementById('etiquetas-vista').getBoundingClientRect().width > 1000, document.getElementById('herramientas-lista').classList.contains('oculto')]), [true, true]);
await pagina.evaluate(() => { document.querySelector('.repartir-filtro').open = true; });
await poner('rf-unidad', '2º B');
await pagina.waitForSelector('.bd-grupo-cond');
await comprobar('1. con la unidad 2º B, la cuenta del filtro y la de abajo coinciden', pagina.evaluate(() => [
  document.querySelector('.repartir-filtro-resumen').textContent, document.getElementById('et-resumen').textContent]), ['6 alumnos en el filtro', '6 personas · 6 etiquetas']);

console.log('--- 2. modelo 3×8 y diseño Alumno ---');
await poner('et-modelo', 'avery-L7159');
await poner('et-diseno', 'alumno');
await pagina.waitForTimeout(200);
await comprobar('2. 24 casillas por hoja', pagina.evaluate(() => document.querySelectorAll('.et-hoja[data-hoja="0"] .et-casilla').length), 24);
const t2 = (await textos()).filter((x) => x.length);
await comprobar('2. nombre, unidad y número escolar, por apellidos', [t2.length, t2[0], t2[5]],
  [6, ['Castro Reina, Noa', '2º B', '2100004'], ['Pardo Luna, Nerea', '2º B', '2100016']]);
await comprobar('2. el pie', pie(), '1 hoja · 6 etiquetas');

console.log('--- 3. hoja empezada ---');
for (const i of [0, 1, 2, 3, 4]) await pagina.click('.et-hoja[data-hoja="0"] .et-casilla[data-casilla="' + i + '"]');
const t3 = await pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-hoja[data-hoja="0"] .et-casilla'), (c, i) => [i, c.classList.contains('et-gastada'), (c.querySelector('.et-linea') || {}).textContent || ''])
  .filter((x) => x[1] || x[2]));
await comprobar('3. cinco gastadas y la primera etiqueta en la sexta', [t3.slice(0, 5).map((x) => x[1]), t3[5]], [[true, true, true, true, true], [5, false, 'Castro Reina, Noa']]);
await pagina.click('#et-hoja-nueva');
await comprobar('3. «Hoja nueva» las desmarca', pagina.evaluate(() => document.querySelectorAll('.et-gastada').length), 0);

console.log('--- 4. Sobre y hermanos ---');
await pagina.click('.repartir-filtro-resumen ~ * >> nth=-1').catch(() => {});
await pagina.evaluate(() => { document.querySelector('[data-quitar="0"]').click(); });
await pagina.waitForTimeout(300);
await poner('et-diseno', 'sobre');
await pagina.waitForTimeout(300);
const alumnos = await pagina.evaluate(() => document.getElementById('et-resumen').textContent);
const sobres = (await textos()).filter((x) => x.length);
const aguilar = sobres.filter((x) => /Aguilar/.test(x[0]));
await comprobar('4. los hermanos Aguilar, una sola etiqueta con la dirección de casa', aguilar,
  [['Familia de Marina y Pablo Aguilar Ponce', 'Calle Mayor 4', '14900 Lucena', 'Córdoba']]);
const vera = sobres.filter((x) => /Vera/.test(x[0]));
await comprobar('4. la familia sin dirección sale con el aviso «Sin dirección» y se cuenta en el pie', pagina.evaluate(() => [
  document.querySelectorAll('.et-sin-direccion .et-aviso').length, /familia sin dirección/.test(document.querySelector('.et-pie').textContent)]), [1, true]);
await comprobar('4. y solo lleva el nombre', vera, [['Familia de Vera Gallardo Reyes']]);
await comprobar('4. una menos que personas (los hermanos se unen)', pagina.evaluate((a) => {
  const n = parseInt(a, 10); return document.querySelectorAll('.et-hoja .et-casilla:not(.et-libre):not(.et-gastada)').length === n - 1; }, alumnos), true);

console.log('--- 5. copias ---');
await poner('et-diseno', 'alumno');
await pagina.fill('#et-copias', '3');
await pagina.waitForTimeout(300);
const n5 = await pagina.evaluate(() => parseInt(document.getElementById('et-resumen').textContent, 10));
const c5 = (await textos()).filter((x) => x.length);
await comprobar('5. cada persona sale tres veces seguidas y la cuenta lo dice', [c5[0][0] === c5[1][0] && c5[1][0] === c5[2][0] && c5[3][0] !== c5[2][0],
  (await pagina.locator('#et-resumen').textContent()).replace(/^\d+ personas/, 'N personas').indexOf('N personas · ' + (n5 * 3) + ' etiquetas')], [true, 0]);
await pagina.fill('#et-copias', '1');

console.log('--- 6. nuevo modelo 2×2 ---');
await pagina.click('#et-modelo-nuevo');
await pagina.fill('#em-nombre', 'Cuatro');
await pagina.fill('#em-filas', '2');
await pagina.fill('#em-columnas', '2');
await comprobar('6. dice cuánto mide cada etiqueta', pagina.locator('#em-medida').textContent(), 'Cada etiqueta mide 105 × 148,5 mm');
await pagina.click('#em-guardar');
await pagina.waitForSelector('#et-modelo');
await pagina.waitForTimeout(300);
await comprobar('6. el modelo propio queda elegido y cada etiqueta mide un cuarto del A4', pagina.evaluate(() => {
  const m = document.getElementById('et-modelo'); const txt = m.options[m.selectedIndex].textContent;
  return [txt, document.querySelectorAll('.et-hoja[data-hoja="0"] .et-casilla').length, document.getElementById('et-medida-modelo').textContent];
}), ['Cuatro · 2 × 2 (propio)', 4, '2 × 2 · 105 × 148,5 mm · A4']);
await comprobar('6. guardado en _GESTOR/etiquetas.json', pagina.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'etiquetas.json')).modelos.map((m) => [m.nombre, m.filas, m.columnas])), [['Cuatro', 2, 2]]);

console.log('--- 7. diseño propio ---');
await pagina.click('#et-diseno-nuevo');
await pagina.fill('#ed-nombre', 'Examen');
await pagina.selectOption('.et-renglon[data-i="0"] [data-r="dato"]', 'apellidosNombre');
await pagina.check('.et-renglon[data-i="0"] [data-r="negrita"]');
await pagina.click('#ed-mas');
await pagina.selectOption('.et-renglon[data-i="1"] [data-r="dato"]', 'texto');
await pagina.fill('.et-renglon[data-i="1"] [data-r="texto"]', 'Examen');
await comprobar('7. mientras se edita, la vista previa ya lo enseña', pagina.evaluate(() => {
  const c = document.querySelector('.et-hoja[data-hoja="0"] .et-casilla:not(.et-libre)'); return Array.prototype.map.call(c.querySelectorAll('.et-linea'), (l) => l.textContent); }),
  ['Aguilar Ponce, Marina', 'Examen']);
await pagina.click('#ed-guardar');
await pagina.waitForSelector('#et-diseno');
await pagina.waitForTimeout(300);
await comprobar('7. guardado: dos renglones, el primero en negrita', pagina.evaluate(async () => {
  const d = (await Carpetas.leerJson(App.E.gestor, 'etiquetas.json')).disenos[0]; return [d.nombre, d.renglones.map((r) => [r.dato, r.texto || '', r.negrita])]; }),
  ['Examen', [['apellidosNombre', '', true], ['texto', 'Examen', false]]]);
await comprobar('7. sale en la vista previa y queda elegido', pagina.evaluate(() => {
  const s = document.getElementById('et-diseno'); const c = document.querySelector('.et-hoja[data-hoja="0"] .et-casilla:not(.et-libre)');
  return [s.options[s.selectedIndex].textContent, Array.prototype.map.call(c.querySelectorAll('.et-linea'), (l) => l.textContent + (l.style.fontWeight === '700' ? '*' : ''))]; }),
  ['Examen (propio)', ['Aguilar Ponce, Marina*', 'Examen']]);

console.log('--- 8. PDF ---');
await poner('et-modelo', 'avery-L7159');
await poner('et-diseno', 'alumno');
await pagina.waitForTimeout(300);
const cuenta8 = await pie();
const [descarga] = await Promise.all([pagina.waitForEvent('download'), pagina.click('#et-guardar-pdf')]);
const ruta = await descarga.path();
const bytes = fs.readFileSync(ruta);
const hoy = new Date();
const aammdd = String(hoy.getFullYear()).slice(2) + String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getDate()).padStart(2, '0');
await comprobar('8. se llama «AAMMDD ETIQUETAS <diseño>.pdf»', descarga.suggestedFilename(), aammdd + ' ETIQUETAS Alumno.pdf');
const info = await pagina.evaluate(async (b64) => {
  const L = await PdfHerramientas.cargarPdfLib();
  const d = await L.PDFDocument.load(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  const s = d.getPage(0).getSize();
  return [d.getPageCount(), Math.round(s.width * 100) / 100, Math.round(s.height * 100) / 100];
}, bytes.toString('base64'));
await comprobar('8. A4 y tantas hojas como dice el pie (' + cuenta8 + ')', info, [parseInt(cuenta8, 10), 595.28, 841.89]);
await comprobar('8. el texto está en el PDF', pagina.evaluate(async (b64) => {
  const L = await PdfHerramientas.cargarPdfLib();
  const d = await L.PDFDocument.load(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  return d.getPage(0).node.Contents() ? true : false;
}, bytes.toString('base64')), true);
await comprobar('8. aviso de impresión a tamaño real', pagina.locator('.et-pie-nota').textContent(), 'En el cuadro de impresión, elige tamaño real (100 %), no «Ajustar».');

console.log('--- 9. desde el asunto de grupo ---');
await pagina.evaluate(() => App.ir('abiertos'));
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-etiquetas', { state: 'visible', timeout: 20000 });
const miembros = await pagina.evaluate((n) => App.E.registro.asuntos[n].relacionados.filter((r) => r.categoria === 'ALUMNADO').length, demo);
await pagina.click('.pg-etiquetas');
await esperarVista();
await comprobar('9. la pantalla se abre con las personas del grupo', pagina.evaluate(() => [document.getElementById('et-resumen').textContent, document.querySelector('.repartir-filtro-resumen').textContent]),
  [miembros + ' personas · ' + miembros + ' etiquetas', 'Sin criterios: se ve todo como siempre.']);
await comprobar('9. y «Volver» lleva a la ficha del asunto', (async () => { await pagina.click('#et-volver'); await pagina.waitForSelector('#pantalla-asunto:not(.oculto)'); return true; })(), true);

console.log('--- 10. personal ---');
await pagina.evaluate(() => App.ir('herramientas'));
await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
await pagina.click('#etiquetas-abrir');
await esperarVista();
await pagina.click('[data-clase="personal"]');
await poner('et-diseno', 'profesor');
await pagina.waitForTimeout(300);
const prof = (await textos()).filter((x) => x.length);
await comprobar('10. el diseño Profesor lleva apellidos, nombre y departamento (o puesto)', prof.map((x) => x.join(' | ')).sort(),
  ['Cabello Ruiz, Esperanza | Inglés', 'Otero Campos, Marta | Matemáticas', 'Reyes Palma, Fernando | Lengua', 'Uceda Molina, Patricia | Jefatura de Estudios', 'Vidal Cano, Ramón | Ordenanza']);
await poner('et-pdepto', 'Matemáticas');
await comprobar('10. el filtro por departamento', pagina.locator('#et-resumen').textContent(), '1 persona · 1 etiqueta');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
