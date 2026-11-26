/* Prueba de la fila 750 (docs/583-COMPRAS-DE-MATERIAL.md, parte 1): la pantalla «Material», su catálogo y «Lo que
   falta». Copia de pruebas (demo), Chromium real: el disco es falso, nunca se tocan datos reales. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

const esperarCuadroCerrado = () => p.waitForSelector('#capa.oculto', { state: 'attached', timeout: 10000 });
const filasFalta = () => p.locator('#material-cuerpo table tbody tr').count();

console.log('--- 1. la entrada del menú y las pestañas ---');
await comprobar('1a. «Material» está entre «Cuentas» y «Herramientas»',
  p.evaluate(() => { const t = [...document.querySelectorAll('.lateral .pestana')].map((b) => b.textContent.trim().replace(/\s*\d+$/, '')); const i = t.indexOf('Material'); return [t[i - 1], t[i], t[i + 1]]; }),
  ['Cuentas', 'Material', 'Herramientas']);
await p.click('#pestana-material');
await p.waitForSelector('#material-busca');
await comprobar('1b. solo salen las pestañas de las partes hechas, con su número', p.locator('#material-pestanas').innerText().then((t) => t.replace(/\s+/g, ' ')), 'Lo que falta (4) Catálogo (14) Proveedores (3)');
await comprobar('1c. se abre en «Lo que falta» con las líneas de la demostración', filasFalta(), 4);

console.log('--- 2. el catálogo ---');
await p.click('[data-pestana=catalogo]');
await p.waitForSelector('.material-catalogo');
await comprobar('2a. las categorías salen con su número de artículos', p.locator('.material-cat').first().innerText().then((t) => t.replace(/\s+/g, ' ')), 'Papel 4');
await p.locator('.material-cat', { hasText: 'Cartulina' }).click();
await comprobar('2b. la cartulina A3 azul satinado y la A4 azul mate son dos filas', p.locator('.material-fila').count(), 3);
await comprobar('2c. una columna por característica y «Se compra por»', p.locator('.material-catalogo > .material-caja:nth-child(2) .material-tabla th').allInnerTexts(), ['Formato', 'Color', 'Acabado', 'Gramaje', 'Se compra por', 'Mejor precio']);

console.log('--- 3. una categoría nueva y un artículo con valores en lista ---');
await p.click('#material-nueva-cat');
await p.fill('#material-cn', 'Etiquetas');
await p.fill('#material-cc', 'Medida, Color');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await comprobar('3a. la categoría nueva queda elegida', p.locator('.material-cat.activa').innerText().then((t) => t.replace(/\s+/g, ' ')), 'Etiquetas 0');
await p.click('#material-nuevo-art');
await p.selectOption('[data-i="0"]', '__nuevo');
await p.fill('[data-i="0"] + input', '70×37');
await p.selectOption('[data-i="1"]', '__nuevo');
await p.fill('[data-i="1"] + input', 'Blanco');
await p.selectOption('#material-au', '__nuevo');
await p.fill('#material-au + input', 'caja de 100 hojas');
await comprobar('3b. «Se llamará» enseña el nombre que se va formando', p.locator('#material-anom').innerText(), 'Etiquetas 70×37 Blanco');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await comprobar('3c. el artículo sale en la tabla', p.locator('.material-fila').count(), 1);
await p.click('#material-nuevo-art');
await p.selectOption('[data-i="1"]', '__nuevo');
await p.fill('[data-i="1"] + input', 'blanco');
await p.locator('[data-i="1"] + input').dispatchEvent('change');
await comprobar('3d. «blanco» con «Blanco» ya en la lista elige «Blanco» y lo dice', [await p.locator('[data-i="1"]').inputValue(), await p.locator('#mensajes .mensaje').last().innerText()], ['Blanco', 'Ya estaba en la lista: Blanco. Elegido.']);
await p.selectOption('[data-i="0"]', '70×37');
await p.selectOption('#material-au', 'caja de 100 hojas');
await p.click('#cuadro-aceptar');
await p.waitForTimeout(600);
await comprobar('3e. el artículo repetido no se guarda y el cuadro sigue abierto', [await p.locator('#capa.oculto').count(), await p.locator('#mensajes .mensaje').last().innerText()], [0, 'Ese artículo ya existe: Etiquetas 70×37 Blanco']);
await p.click('#cuadro-cancelar');
await esperarCuadroCerrado();

console.log('--- 4. cambiar las características conserva los datos ---');
await p.click('#material-cambiar-car');
await p.fill('#material-cc', 'Color, Medida');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await comprobar('4a. el orden nuevo reordena las columnas y los datos siguen', p.locator('.material-fila').first().innerText().then((t) => t.replace(/\s+/g, ' ').trim()), 'Blanco 70×37 caja de 100 hojas Sin precio reciente');

console.log('--- 5. apuntar lo que falta ---');
await p.click('[data-pestana=falta]');
await p.waitForSelector('#material-busca');
await p.fill('#material-busca', 'a4 80');
await p.waitForSelector('.material-sug-fila');
await comprobar('5a. el buscador sugiere por todas las palabras y acaba en «+ Nuevo artículo…»', p.locator('.material-sug-fila').allInnerTexts().then((t) => [t.length > 1, t[t.length - 1]]), [true, '+ Nuevo artículo…']);
await p.fill('#material-busca', 'a4 80 blanco');
await p.waitForSelector('.material-sug-fila');
await p.press('#material-busca', 'Enter');
await comprobar('5b. al elegir salta a la cantidad, seleccionada', p.evaluate(() => document.activeElement && document.activeElement.id), 'material-cant');
await p.selectOption('#material-para', 'Dirección');
await p.fill('#material-cant', '3');
await p.press('#material-cant', 'Enter');
await p.waitForFunction(() => document.querySelectorAll('#material-cuerpo table tbody tr').length === 5);
await comprobar('5c. Enter apunta la línea con «Apuntado por» y «Cuándo»', p.evaluate(() => {
  const f = [...document.querySelectorAll('#material-cuerpo table tbody tr')].find((r) => r.textContent.indexOf('Dirección') !== -1);
  const c = f.querySelectorAll('td'); return [c[6].textContent.trim() !== '', /\d-\w{3}-\d{4}/.test(c[7].textContent)];
}), [true, true]);
await p.fill('#material-busca', 'a4 80 blanco');
await p.waitForSelector('.material-sug-fila');
await p.press('#material-busca', 'Enter');
await p.selectOption('#material-para', 'Dirección');
await p.fill('#material-cant', '2');
await p.click('#material-apuntar');
await p.waitForTimeout(600);
await comprobar('5d. lo mismo para el mismo destino suma (y no crea otra línea)', [await filasFalta(), await p.locator('#mensajes .mensaje').last().innerText()], [5, 'Ya estaba apuntado para Dirección: ahora 5 × paquete de 500 hojas.']);
await p.fill('#material-busca', 'a4 80 blanco');
await p.waitForSelector('.material-sug-fila');
await p.press('#material-busca', 'Enter');
await p.selectOption('#material-para', 'Conserjería');
await p.press('#material-cant', 'Enter');
await p.waitForFunction(() => document.querySelectorAll('#material-cuerpo table tbody tr').length === 6);
await comprobar('5e. para otro destino es otra línea', filasFalta(), 6);

console.log('--- 6. «+ Nuevo artículo…» desde el buscador ---');
await p.fill('#material-busca', 'cinta de embalar');
await p.waitForSelector('.material-sug-nuevo');
await p.press('#material-busca', 'Enter');
await p.waitForSelector('#material-ac');
await comprobar('6a. el cuadro dice lo buscado y no hay categoría elegida', [await p.locator('#cuadro-cuerpo').innerText().then((t) => t.indexOf('Has buscado «cinta de embalar» y no está en el catálogo.') !== -1), await p.locator('#material-ac').inputValue()], [true, '']);
await p.click('#cuadro-cancelar');
await esperarCuadroCerrado();

console.log('--- 7. cambiar la cantidad y quitar ---');
await p.locator('[data-cant]').first().fill('9');
await p.locator('[data-cant]').first().dispatchEvent('change');
await p.waitForTimeout(600);
await comprobar('7a. la cantidad se cambia en la propia tabla', p.locator('[data-cant]').first().inputValue(), '9');
await p.locator('[data-marca]').nth(0).check();
await p.locator('[data-marca]').nth(1).check();
await comprobar('7b. «Quitar de la lista» se activa con lo marcado', p.locator('#material-quitar').isDisabled(), false);
await p.click('#material-quitar');
await p.waitForFunction(() => document.querySelectorAll('#material-cuerpo table tbody tr').length === 4);
await comprobar('7c. lo marcado se quita', filasFalta(), 4);
await comprobar('7d. la casilla de la cabecera marca todas', (async () => { await p.check('#material-todas'); return p.locator('[data-marca]:checked').count(); })(), 4);
await p.click('#material-quitar');
await p.waitForSelector('text=No falta nada.');
await comprobar('7e. sin líneas, «No falta nada.»', p.locator('#material-pestanas').innerText().then((t) => t.replace(/\s+/g, ' ')), 'Lo que falta (0) Catálogo (15) Proveedores (3)');

console.log('--- 8. un destino nuevo ---');
await p.selectOption('#material-para', '__nuevo');
await p.waitForSelector('#material-nd');
await p.fill('#material-nd', 'Dpto. de Música');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await comprobar('8a. el destino nuevo queda elegido', p.locator('#material-para').inputValue(), 'Dpto. de Música');

await comprobar('9. ningún error en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
