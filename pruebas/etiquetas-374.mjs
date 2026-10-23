/* Prueba de la fila 374 (19-oct-2026, docs/HUECOS-EN-CUALQUIER-HOJA.md): huecos en cualquier hoja y marcarlos arrastrando.
   Primero sin pantalla (paginar y rectangulo), luego Chromium real con la copia de pruebas: todo el alumnado, 3 copias, L7160.

   1. paginar salta los huecos de cualquier hoja; una hoja toda gastada no pierde nombres ni se queda en bucle.
   2. rectangulo: fila entera, columna entera y 2×2 en un modelo de 3 columnas.
   3. Pulsar una etiqueta de la hoja 2 la raya y el nombre pasa a la siguiente libre.
   4. Arrastrar una fila entera, un 2×2 en la hoja 3, y arrastrar desde una rayada la libera.
   5. «Quitar todos los huecos» limpia todas las hojas. */
import { chromium } from 'playwright';
import { tarjetasSolas } from './apoyo/etiquetas-tarjetas.mjs';
import vm from 'node:vm';
import fs from 'node:fs';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

console.log('--- 1 y 2. sin pantalla ---');
const caja = { window: {}, U: { escapar: (t) => t } };
vm.createContext(caja);
vm.runInContext(fs.readFileSync(new URL('../js/etiquetas-hoja.js', import.meta.url), 'utf8') + '\nthis.EH = EtiquetasHoja;', caja);
const EH = caja.EH, M = { filas: 7, columnas: 3 };
const nombres = (p) => p.hojas.map((h) => h.map((c) => (c.gastada ? 'x' : (c.item ? c.item : '.'))).join(''));
const items = Array.from({ length: 25 }, (_, i) => String.fromCharCode(97 + i));
const p1 = EH.paginar(items, M, { '1:5': true });
await comprobar('1. un hueco en la hoja 2 (índice 1) queda rayado y el nombre pasa a la siguiente', [p1.hojas.length, p1.hojas[1][5].gastada, p1.hojas[1][5].item, p1.hojas[1][6].item], [2, true, null, items[21 + 5]]);
const todas = {}; for (let i = 0; i < 21; i++) todas['1:' + i] = true;
const p2 = EH.paginar(items, M, todas);
await comprobar('1. una hoja toda gastada se dibuja y no pierde nombres', [p2.hojas.length, p2.hojas[1].every((c) => c.gastada), p2.hojas.flat().filter((c) => c.item).length], [3, true, 25]);
await comprobar('1. los huecos de una hoja que ya no existe no la crean', EH.paginar(items.slice(0, 5), M, { '3:2': true }).hojas.length, 1);
await comprobar('2. fila entera', EH.rectangulo(M, 3, 5), [3, 4, 5]);
await comprobar('2. columna entera', EH.rectangulo(M, 19, 1), [1, 4, 7, 10, 13, 16, 19]);
await comprobar('2. 2×2 (en cualquier sentido)', EH.rectangulo(M, 8, 4), [4, 5, 7, 8]);

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
tarjetasSolas(pagina);
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

await pagina.evaluate(() => App.ir('herramientas'));
await pagina.waitForSelector('#bloque-etiquetas');
await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
await pagina.click('#etiquetas-abrir');
await pagina.waitForSelector('.et-hoja');
await pagina.selectOption('#et-modelo', 'avery-L7160');
/* Fila 450: sin nadie elegido la hoja sale vacía; se pega la lista de todo el alumnado. */
const todos = await pagina.evaluate(async () => (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista.filter((p) => p.matriculado).map((p) => p.nombre).join('\n'));
await pagina.evaluate(() => { document.querySelector('.et-pegar').open = true; });
await pagina.fill('#et-pegado', todos);
await pagina.click('#et-pegar-usar');
await pagina.fill('#et-copias', '3');
await pagina.waitForTimeout(400);

const casilla = (h, i) => '.et-hoja[data-hoja="' + h + '"] .et-casilla[data-casilla="' + i + '"]';
const rayadas = (h) => pagina.evaluate((hh) => Array.prototype.map.call(document.querySelectorAll('.et-hoja[data-hoja="' + hh + '"] .et-gastada'), (c) => Number(c.getAttribute('data-casilla'))), h);
const nombreEn = (h, i) => pagina.evaluate(([hh, ii]) => { const l = document.querySelector('.et-hoja[data-hoja="' + hh + '"] .et-casilla[data-casilla="' + ii + '"] .et-linea'); return l ? l.textContent : ''; }, [h, i]);
async function centro(sel) { await pagina.locator(sel).scrollIntoViewIfNeeded(); const b = await pagina.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; }
async function arrastrar(h, a, b) {
  const [x1, y1] = await centro(casilla(h, a)); await pagina.mouse.move(x1, y1); await pagina.mouse.down();
  const [x2, y2] = await centro(casilla(h, b)); await pagina.mouse.move(x2, y2, { steps: 5 });
  const marcando = await pagina.evaluate(() => document.querySelectorAll('.et-marcando').length);
  await pagina.mouse.up(); await pagina.waitForTimeout(150);
  return marcando;
}

console.log('--- 3. pulsar en la hoja 2 ---');
const hojas = await pagina.evaluate(() => document.querySelectorAll('.et-hoja').length);
await comprobar('0. hay al menos tres hojas', hojas >= 3, true);
const antes = await nombreEn(1, 5), siguiente = await nombreEn(1, 6);
await pagina.click(casilla(1, 5));
await comprobar('3. la etiqueta pulsada de la hoja 2 queda rayada, vacía, y su nombre pasa a la siguiente', [await rayadas(1), await nombreEn(1, 5), await nombreEn(1, 6) === antes, await nombreEn(1, 7) === siguiente], [[5], '', true, true]);

console.log('--- 4. arrastrar ---');
await pagina.click('#et-hoja-nueva');
const marc = await arrastrar(0, 3, 5);
await comprobar('4. mientras se arrastra, se ven resaltadas las 3 etiquetas', marc, 3);
await comprobar('4. la fila entera queda rayada', await rayadas(0), [3, 4, 5]);
await arrastrar(2, 4, 8);
await comprobar('4. un 2×2 en la hoja 3 raya esas cuatro y ninguna más', [await rayadas(2), await rayadas(0)], [[4, 5, 7, 8], [3, 4, 5]]);
await arrastrar(0, 3, 4);
await comprobar('4. empezar en una rayada libera el rectángulo', await rayadas(0), [5]);
await comprobar('4. nunca se tocan otras hojas', await rayadas(1), []);

console.log('--- 5. quitar todos los huecos ---');
await comprobar('5. el botón se llama «Quitar todos los huecos»', pagina.locator('#et-hoja-nueva').textContent(), 'Quitar todos los huecos');
await pagina.click('#et-hoja-nueva');
await comprobar('5. no queda ninguna rayada en ninguna hoja', pagina.evaluate(() => document.querySelectorAll('.et-gastada').length), 0);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos'); process.exit(1); }
console.log('\nTodo bien.');
