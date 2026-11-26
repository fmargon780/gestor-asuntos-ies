/* Prueba de la fila 754 (docs/583-COMPRAS-DE-MATERIAL.md, parte 5): el bloque «Pedido y factura» de un asunto COMPRA.
   Copia de pruebas (demo), Chromium real: nunca se tocan datos reales. */
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
const p = await navegador.newPage({ viewport: { width: 1700, height: 1100 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);
const limpio = (t) => t.replace(/\s+/g, ' ').trim();
const texto = (sel) => p.locator(sel).first().innerText().then(limpio);
/* Escribe en una casilla y sale de ella; espera a que el bloque se repinte con el valor guardado. */
async function poner(sel, valor) {
  const c = p.locator(sel).first();
  await c.fill(String(valor));
  await c.press('Tab');
  await p.waitForTimeout(700);
  await p.waitForSelector('#ficha-pedido .mf-tabla', { timeout: 10000 });
}
const estados = () => p.evaluate(() => [...document.querySelectorAll('#ficha-pedido .mf-tabla tbody tr:not(.mf-pedido)')].map((tr) => tr.lastElementChild.innerText.replace(/\s+/g, ' ').trim()));
const rojas = () => p.evaluate(() => document.querySelectorAll('#ficha-pedido .mf-dif').length);

console.log('--- 1. se llega desde «Pedidos» ---');
await p.click('#pestana-material');
await p.waitForSelector('#material-busca');
await p.click('[data-pestana=pedidos]');
await comprobar('1a. cada pedido lleva «Comprobar recibido y factura»', p.locator('[data-comprueba]').count(), 3);
const idxViejo = await p.evaluate(() => {
  const hs = [...document.querySelectorAll('.mp-pedido')];
  /* el más viejo de Dobla: el último de la lista que sea de Dobla */
  let k = -1; hs.forEach((h, i) => { if (/Dobla/.test(h.querySelector('h3').textContent)) k = i; });
  return k;
});
await p.locator('[data-comprueba]').nth(idxViejo).click();
await comprobar('1b. se abre el asunto con el bloque «Pedido y factura» abierto', p.waitForSelector('[data-tarjeta=pedido].abierto #ficha-pedido .mf-tabla', { timeout: 15000 }).then(() => true).catch(() => false), true);
await comprobar('1c. el título del bloque', texto('[data-tarjeta=pedido] .plegable-titulo'), 'Pedido y factura');
await comprobar('1d. sin factura, cada línea dice «falta la factura» y no hay veredicto', [await estados(), await texto('#ficha-pedido .mf-veredicto')], [['falta la factura', 'falta la factura'], '']);
await comprobar('1e. lo recibido es lo pedido', p.evaluate(() => [...document.querySelectorAll('#ficha-pedido [data-rec]')].map((c) => c.value)), ['20', '2']);

console.log('--- 2. recibido y factura ---');
await poner('#ficha-pedido [data-rec]', 19);
await comprobar('2a. recibido de menos: casilla en rojo y «Volver a pedir» con su número', [await rojas(), await texto('#mf-reponer')], [1, 'Volver a pedir lo no recibido (1)']);
await poner('#ficha-pedido [data-fc]', 19);
await poner('#ficha-pedido [data-fi]', '2.15');
await p.locator('#ficha-pedido [data-fc]').nth(1).fill('2'); await p.locator('#ficha-pedido [data-fc]').nth(1).press('Tab'); await p.waitForTimeout(700);
await p.locator('#ficha-pedido [data-fi]').nth(1).fill('18.5'); await p.locator('#ficha-pedido [data-fi]').nth(1).press('Tab'); await p.waitForTimeout(700);
await comprobar('2b. con todo facturado, la línea corta dice «recibido 19 de 20» y la otra «✓ cuadra»', await estados(), ['recibido 19 de 20', '✓ cuadra']);
await poner('#mf-num', 'F-2026-77');
await poner('#mf-base', '77.85');
await poner('#mf-iva', '16.35');
await poner('#mf-tot', '94.2');
await comprobar('2c. las tres comprobaciones salen bien, pero hay diferencias', [await texto('#ficha-pedido .mf-checks'), await texto('#ficha-pedido .mf-veredicto')],
  ['✓ Las líneas suman 77,85 €, igual que la base imponible. ✓ IVA al 21 %. ✓ Base más IVA da el total.', 'Con diferencias: revisa lo marcado en rojo.']);
await poner('#ficha-pedido [data-rec]', 20);
await poner('#ficha-pedido [data-fc]', 20);
await poner('#mf-base', '80'); await poner('#mf-iva', '16.8'); await poner('#mf-tot', '96.8');
await comprobar('2d. todo igual que el pedido: «✓ Factura conforme»', texto('#ficha-pedido .mf-veredicto'), '✓ Factura conforme con el pedido y lo recibido.');
await poner('#ficha-pedido [data-fi]', '2.25');
await comprobar('2e. un precio distinto da diferencias y lo dice', [await estados(), await texto('#ficha-pedido .mf-veredicto')], [['precio 2,25 € en vez de 2,15 €', '✓ cuadra'], 'Con diferencias: revisa lo marcado en rojo.']);
await poner('#ficha-pedido [data-fi]', '2.15');
await poner('#mf-iva', '10');
await comprobar('2f. un IVA que no es el 21 % dice cuál sería', texto('#ficha-pedido .mf-checks'), '✓ Las líneas suman 80,00 €, igual que la base imponible. El IVA no es el 21 % de la base (sería 16,80 €). Base más IVA da 90,00 €, no 96,80 €.');
await poner('#mf-iva', '16.8');

console.log('--- 3. una factura para varios pedidos ---');
await comprobar('3a. se ofrece el otro pedido del mismo proveedor, y solo ese', p.evaluate(() => [...document.querySelectorAll('#mf-juntar option')].length), 2);
await p.selectOption('#mf-juntar', { index: 1 });
await p.waitForSelector('[data-quitar-junto]', { timeout: 10000 });
await comprobar('3b. sus líneas salen debajo, sin factura aún, y ya no hay veredicto', [await p.locator('#ficha-pedido .mf-pedido').count(), await estados(), await texto('#ficha-pedido .mf-veredicto')],
  [2, ['✓ cuadra', '✓ cuadra', 'falta la factura', 'falta la factura'], '']);
await p.locator('#ficha-pedido [data-fc]').nth(2).fill('3'); await p.locator('#ficha-pedido [data-fc]').nth(2).press('Tab'); await p.waitForTimeout(700);
await p.locator('#ficha-pedido [data-fi]').nth(2).fill('4.6'); await p.locator('#ficha-pedido [data-fi]').nth(2).press('Tab'); await p.waitForTimeout(700);
await p.locator('#ficha-pedido [data-fc]').nth(3).fill('4'); await p.locator('#ficha-pedido [data-fc]').nth(3).press('Tab'); await p.waitForTimeout(700);
await p.locator('#ficha-pedido [data-fi]').nth(3).fill('9.2'); await p.locator('#ficha-pedido [data-fi]').nth(3).press('Tab'); await p.waitForTimeout(700);
await comprobar('3b2. con todo facturado, la suma junta los dos pedidos (130,60 €) y la base no cuadra', texto('#ficha-pedido .mf-checks').then((t) => t.indexOf('Las líneas suman 130,60 € y la base imponible es 80,00 €.') !== -1), true);
await comprobar('3c. aviso de cuántos pedidos junta', texto('#ficha-pedido .mf-juntar'), 'No hay otros pedidos abiertos de este proveedor para juntar en esta factura.'.replace('No hay otros pedidos abiertos de este proveedor para juntar en esta factura.', 'Esta factura junta 2 pedidos de este proveedor.'));
await p.click('[data-quitar-junto]');
await p.waitForFunction(() => !document.querySelector('[data-quitar-junto]'), null, { timeout: 10000 });
await comprobar('3d. quitarlo la deja como estaba', texto('#ficha-pedido .mf-veredicto'), '✓ Factura conforme con el pedido y lo recibido.');

console.log('--- 4. volver a pedir y pasar los precios al catálogo ---');
await poner('#ficha-pedido [data-rec]', 18);
await comprobar('4a. «Volver a pedir lo no recibido (1)» está disponible', p.locator('#mf-reponer').isDisabled(), false);
await p.click('#mf-reponer');
await p.waitForFunction(() => document.querySelector('#mf-reponer') && document.querySelector('#mf-reponer').disabled, null, { timeout: 10000 });
await comprobar('4b. solo una vez', p.locator('#mf-reponer').isDisabled(), true);
const falta = await p.evaluate(async () => { const f = await Material.leerFalta(); return f.lineas.filter((l) => l.a === 'a1' && l.para === 'Administración').map((l) => l.c); });
await comprobar('4c. lo no recibido (2) suma a la línea que ya había (20) en «Lo que falta»', falta, [22]);
await poner('#ficha-pedido [data-rec]', 20);
await comprobar('4d. sin fecha de factura no se pasan precios', p.locator('#mf-catalogo').isDisabled(), true);
const f = p.locator('#mf-f'); await f.fill('2026-11-26'); await f.press('Tab'); await p.waitForTimeout(900);
await comprobar('4e. con la factura completa y su fecha, se puede', p.locator('#mf-catalogo').isDisabled(), false);
await p.click('#mf-catalogo');
await p.waitForTimeout(900);
const precios = await p.evaluate(async () => { await Material.recargar(); return Material.estado.precios.precios.filter((x) => x.o === 'Factura F-2026-77').map((x) => [x.a, x.i, x.f]).sort(); });
await comprobar('4f. cada precio facturado entra en el catálogo con su fecha y «Factura <nº>»', precios, [['a1', 2.15, '2026-11-26'], ['a5', 18.5, '2026-11-26']]);

console.log('--- 5. «Proveedores» ---');
await p.click('#pestana-material');
await p.waitForSelector('#material-pestanas .material-pestana');
await p.click('[data-pestana=proveedores]');
const dobla = await p.evaluate(() => { const tr = [...document.querySelectorAll('.material-tabla tbody tr')].find((t) => /Dobla/.test(t.textContent)); return [...tr.querySelectorAll('td')].slice(3, 5).map((t) => t.textContent.trim()); });
await comprobar('5a. «Facturado en el año» suma la base y «Pedido sin facturar» deja de contar ese pedido', dobla, ['11.880,00 €', '1.250,60 €']);

await comprobar('6. consola sin errores', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
