/* Prueba de la fila 450 (23-oct-2026, docs/ETIQUETAS-RECUERDA-TU-TRABAJO.md): Etiquetas recuerda el trabajo a medias,
   orden de las etiquetas y tres tarjetas encima de la hoja. Chromium real con la copia de pruebas.

   1. Marco 2º B (filtro), quito a dos, hoja Avery L7163, diseño Sobre, orden por apellidos; salgo y vuelvo: todo sigue.
   2. Encima de la hoja hay tres tarjetas (Hoja, Diseño, Orden) con lo último elegido; una sola abierta a la vez.
   3. «En el orden en que los marco»: las añadidas una a una van detrás, en el orden en que se marcan; igual en el PDF.
   4. «Empezar de cero»: nadie elegido, hoja vacía con su línea gris; conserva hoja, diseño y orden.
   5. Otro ordenador (almacenamiento vacío): pantalla limpia, nadie elegido, hoja y diseño por defecto.
   6. Cada pestaña guarda lo suyo; sin almacenamiento no hay errores. */
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
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
async function nuevaPagina(c) {
  const pagina = await c.newPage();
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
  await pagina.waitForTimeout(3000);
  return pagina;
}
let pagina = await nuevaPagina(contexto);

async function abrirEtiquetas() {
  await pagina.evaluate(() => App.ir('herramientas'));
  await pagina.waitForSelector('#bloque-etiquetas');
  await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
  await pagina.click('#etiquetas-abrir');
  await pagina.waitForSelector('.et-hoja');
  await pagina.waitForTimeout(300);
}
async function salir() { await pagina.click('#et-volver'); await pagina.waitForSelector('#bloque-etiquetas'); }
const tarjetas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-tarjeta'), (t) => [t.getAttribute('data-tarjeta'), t.querySelector('.et-tarjeta-valor').textContent, t.getAttribute('aria-expanded')]));
const resumen = () => pagina.locator('#et-resumen').textContent();
const nombres = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.et-hoja .et-casilla:not(.et-libre):not(.et-gastada)'), (c) => (c.querySelector('.et-linea') || {}).textContent || ''));
const abrirTarjeta = async (t) => { if ((await pagina.getAttribute('[data-tarjeta="' + t + '"]', 'aria-expanded')) !== 'true') await pagina.click('[data-tarjeta="' + t + '"]'); };
async function poner(id, v) { await pagina.fill('#' + id, v); await pagina.press('#' + id, 'Enter'); }
async function filtrarUnidad(u) {
  await pagina.evaluate(() => { document.querySelector('.repartir-filtro').open = true; });
  await poner('rf-unidad', u);
  await pagina.waitForSelector('.bd-grupo-cond');
}

console.log('--- 5a. primera vez: nadie elegido ---');
await abrirEtiquetas();
await comprobar('5. sin nada guardado: nadie elegido, hoja vacía y su línea gris', [await resumen(), await pagina.locator('.et-vacio').textContent(), await pagina.locator('.et-hoja[data-hoja="0"] .et-casilla:not(.et-libre)').count()],
  ['0 personas · 0 etiquetas', 'Elige un grupo, busca personas o pega una lista.', 0]);
await comprobar('2. tres tarjetas encima de la hoja, plegadas, con la hoja y el diseño por defecto', tarjetas(),
  [['hoja', 'Avery L7160 · 3 × 7', 'false'], ['diseno', 'Alumno', 'false'], ['orden', 'Por grupo y apellidos', 'false']]);
await comprobar('2. las tarjetas están sobre la hoja y el panel de la izquierda ya no lleva hoja ni diseño', pagina.evaluate(() => {
  const t = document.querySelector('.et-tarjeta').getBoundingClientRect(), h = document.getElementById('et-vista-hojas').getBoundingClientRect();
  return [t.bottom <= h.top, !document.querySelector('#et-panel #et-modelo'), !document.querySelector('#et-panel #et-diseno')]; }), [true, true, true]);

console.log('--- 1. el ejemplo de 2º ESO B ---');
await filtrarUnidad('2º B');
await abrirTarjeta('hoja');
await comprobar('2. al pulsar Hoja se despliega debajo y las otras siguen plegadas', pagina.evaluate(() => [!!document.querySelector('#et-despliegue #et-modelo'), document.querySelectorAll('.et-despliegue').length]), [true, 1]);
await pagina.fill('#et-buscar-modelo', '7163');
await pagina.selectOption('#et-modelo', 'avery-L7163');
await abrirTarjeta('diseno');
await comprobar('2. pulsar Diseño pliega Hoja (solo una abierta)', pagina.evaluate(() => [!!document.querySelector('#et-despliegue #et-diseno'), !document.querySelector('#et-modelo')]), [true, true]);
await pagina.selectOption('#et-diseno', 'sobre');
await comprobar('2. Diseño se queda abierta al elegir', pagina.evaluate(() => !!document.querySelector('#et-despliegue #et-diseno')), true);
await abrirTarjeta('orden');
await pagina.click('[data-orden="apellidos"]');
await comprobar('2. Orden se pliega al elegir y la tarjeta lo dice', [(await tarjetas())[2], await pagina.locator('.et-despliegue').count()], [['orden', 'Por apellidos', 'false'], 0]);
await pagina.uncheck('#et-lista .cc-lista input >> nth=0');
await pagina.uncheck('#et-lista .cc-lista input >> nth=1');
const n2b = await resumen();
await comprobar('1. quito a dos y quedan 4 personas', n2b, '4 personas · 4 etiquetas');
const antes = await nombres();
await salir();
await abrirEtiquetas();
await comprobar('1. al volver, las tarjetas dicen lo último elegido', (await tarjetas()).map((t) => t[1]), ['Avery L7163 · 2 × 7', 'Sobre', 'Por apellidos']);
await comprobar('1. al volver, siguen las mismas personas, sin las dos que quité, y en el mismo orden', [await resumen(), await nombres()], [n2b, antes]);
await comprobar('1. el filtro de 2º B sigue puesto y las dos desmarcadas siguen sin marca', pagina.evaluate(() => [document.querySelectorAll('.bd-grupo-cond').length, document.querySelectorAll('#et-lista .cc-lista input:checked').length, document.querySelectorAll('#et-lista .cc-lista input').length]), [1, 4, 6]);
await comprobar('1. el PDF no borra el trabajo', (async () => {
  const [d] = await Promise.all([pagina.waitForEvent('download'), pagina.click('#et-guardar-pdf')]);
  fs.readFileSync(await d.path());
  return resumen();
})(), n2b);

console.log('--- 3. en el orden en que los marco ---');
await abrirTarjeta('diseno');
await pagina.selectOption('#et-diseno', 'alumno');
await abrirTarjeta('orden');
await pagina.click('[data-orden="marcado"]');
await comprobar('3. la tarjeta dice el orden', (await tarjetas())[2][1], 'En el orden en que los marco');
const apellidos = (t) => t.replace(/,.*/, '');
const base = await nombres();
await comprobar('3. las que entraron de golpe salen por grupo y apellidos', base.length, 4);
/* Dos personas de otras unidades, buscadas una a una: Vera (Bachillerato) primero, Marina Aguilar después. */
await pagina.fill('#et-buscar-persona', 'Gallardo');
await pagina.press('#et-buscar-persona', 'Enter');
await pagina.fill('#et-buscar-persona', 'Aguilar Ponce, Mar');
await pagina.press('#et-buscar-persona', 'Enter');
await pagina.waitForTimeout(300);
const orden3 = await nombres();
await comprobar('3. las de golpe quedan juntas y delante; las buscadas, detrás, en el orden en que se buscaron',
  [orden3.slice(0, 4), orden3.slice(4).map(apellidos)], [base, ['Gallardo Reyes', 'Aguilar Ponce']]);
/* Volver a marcar a una de las de golpe la pasa al final. */
const elegida = await pagina.evaluate(() => {
  const li = Array.prototype.filter.call(document.querySelectorAll('#et-lista .cc-lista li'), (l) => !l.querySelector('.cc-marca') && l.querySelector('input').checked)[0];
  return [li.querySelector('input').getAttribute('data-cc-clave'), li.querySelector('span').textContent.replace(/ · .*/, '')];
});
const primera = elegida[1];
for (let i = 0; i < 2; i++) {
  await pagina.evaluate((k) => document.querySelector('#et-lista [data-cc-clave="' + k + '"]').click(), elegida[0]);
  await pagina.waitForTimeout(250);
}
const orden3b = await nombres();
await comprobar('3. volver a marcar a una en la lista la pasa al final', orden3b.slice(-1)[0], primera);
await comprobar('3. y las demás siguen como estaban', orden3b.slice(0, -1), orden3.filter((n) => n !== primera));
await comprobar('3. el PDF sale con una hoja y las mismas etiquetas', (async () => {
  const [dl] = await Promise.all([pagina.waitForEvent('download'), pagina.click('#et-guardar-pdf')]);
  const b64 = fs.readFileSync(await dl.path()).toString('base64');
  return pagina.evaluate(async (b) => {
    const L = await PdfHerramientas.cargarPdfLib();
    const d = await L.PDFDocument.load(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
    return [d.getPageCount(), document.getElementById('et-cuenta').textContent];
  }, b64);
})(), [1, '1 hoja · 6 etiquetas']);

console.log('--- 3b. las otras maneras de ordenar ---');
await pagina.click('#et-empezar');
await pagina.evaluate(() => { document.querySelector('.et-pegar').open = true; });
await pagina.fill('#et-pegado', 'Vera Gallardo Reyes\nMarina Aguilar Ponce\nCastro Reina, Noa');
await pagina.click('#et-pegar-usar');
await pagina.waitForTimeout(300);
await abrirTarjeta('orden');
await pagina.click('[data-orden="marcado"]');
await comprobar('3. con lista pegada, las etiquetas siguen el orden de la lista', (await nombres()).map(apellidos).slice(0, 3), ['Gallardo Reyes', 'Aguilar Ponce', 'Castro Reina']);
await abrirTarjeta('orden');
await pagina.click('[data-orden="nombre"]');
await comprobar('3. por nombre: Marina, Noa, Vera', (await nombres()).map((t) => t.replace(/^.*?, /, '')), ['Marina', 'Noa', 'Vera']);
await abrirTarjeta('orden');
await pagina.click('[data-orden="apellidos"]');
await comprobar('3. por apellidos', (await nombres()).map(apellidos), ['Aguilar Ponce', 'Castro Reina', 'Gallardo Reyes']);
await abrirTarjeta('orden');
await pagina.click('[data-orden="grupo"]');
await comprobar('3. por grupo y apellidos (1º A, 1º Bach A, 2º B)', (await nombres()).map(apellidos), ['Aguilar Ponce', 'Gallardo Reyes', 'Castro Reina']);

console.log('--- 4. empezar de cero ---');
await filtrarUnidad('2º B');
await pagina.fill('#et-copias', '3');
await pagina.click('.et-hoja[data-hoja="0"] .et-casilla[data-casilla="0"]');
await pagina.click('#et-empezar');
await pagina.waitForTimeout(300);
await comprobar('4. nadie elegido, hoja vacía, su línea gris', [await resumen(), await pagina.locator('.et-vacio').textContent()], ['0 personas · 0 etiquetas', 'Elige un grupo, busca personas o pega una lista.']);
await comprobar('4. conserva hoja, diseño y orden', (await tarjetas()).map((t) => t[1]), ['Avery L7163 · 2 × 7', 'Alumno', 'Por grupo y apellidos']);
await comprobar('4. quita el filtro, las copias y los huecos', pagina.evaluate(() => [document.querySelectorAll('.bd-grupo-cond').length, document.getElementById('et-copias').value, document.querySelectorAll('.et-gastada').length]), [0, '1', 0]);

console.log('--- 6. cada pestaña guarda lo suyo ---');
await filtrarUnidad('2º B');
await pagina.click('[data-clase="personal"]');
await comprobar('6. la pestaña Personal empieza vacía', resumen(), '0 personas · 0 etiquetas');
await poner('et-pdepto', 'Matemáticas');
await comprobar('6. un departamento', resumen(), '1 persona · 1 etiqueta');
await pagina.click('[data-clase="alumnado"]');
await comprobar('6. al volver a Alumnado sigue lo preparado (2º B)', resumen(), '6 personas · 6 etiquetas');
await pagina.click('.et-hoja[data-hoja="0"] .et-casilla[data-casilla="0"]');
await salir();
await abrirEtiquetas();
await comprobar('6. tras cerrar y volver: Alumnado con 2º B y un hueco', pagina.evaluate(() => [document.getElementById('et-resumen').textContent, document.querySelectorAll('.et-gastada').length]), ['6 personas · 6 etiquetas', 1]);
await pagina.click('[data-clase="personal"]');
await comprobar('6. y Personal con su departamento', resumen(), '1 persona · 1 etiqueta');
await pagina.click('[data-clase="alumnado"]');

console.log('--- 5b. otro ordenador (almacenamiento vacío) ---');
const otro = await navegador.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
pagina = await nuevaPagina(otro);
await abrirEtiquetas();
await comprobar('5. otro ordenador: nada de lo que dejé, hoja y diseño por defecto', [await resumen(), (await tarjetas()).map((t) => t[1])],
  ['0 personas · 0 etiquetas', ['Avery L7160 · 3 × 7', 'Alumno', 'Por grupo y apellidos']]);

console.log('--- 6b. sin almacenamiento ---');
await pagina.evaluate(() => { Storage.prototype.setItem = function () { throw new Error('sin almacenamiento'); }; Storage.prototype.getItem = function () { throw new Error('sin almacenamiento'); }; });
await filtrarUnidad('2º B');
await comprobar('6. sin almacenamiento la pantalla funciona igual', resumen(), '6 personas · 6 etiquetas');

await comprobar('sin errores en la consola', errores.filter((e) => e.indexOf('sin almacenamiento') === -1), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
