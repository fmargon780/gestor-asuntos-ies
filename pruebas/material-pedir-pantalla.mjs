/* Prueba de la fila 752 (docs/583-COMPRAS-DE-MATERIAL.md, parte 3): «Pedir lo marcado», el cuadro «Pedir N artículos»
   y la pestaña «Pedidos». Copia de pruebas (demo), Chromium real: nunca se tocan datos reales. */
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
const p = await navegador.newPage({ viewport: { width: 1700, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);
const limpio = (t) => t.replace(/\s+/g, ' ').trim();
const cuadroAbierto = () => p.waitForSelector('#capa:not(.oculto) #mp-raiz table', { timeout: 10000 });
const cuadroCerrado = () => p.waitForSelector('#capa.oculto', { state: 'attached', timeout: 15000 });
/* Por fila del cuadro: el proveedor elegido (columna con ✓), o '—'. */
const elegidos = () => p.evaluate(() => {
  const cab = [...document.querySelectorAll('.mp-tabla thead th.mp-prov')].map((t) => t.textContent.trim());
  return [...document.querySelectorAll('.mp-tabla tbody tr:not(.mp-fila-pie)')].map((tr) => {
    const celdas = [...tr.querySelectorAll('td.mp-casilla')];
    const i = celdas.findIndex((c) => c.classList.contains('mp-elegida'));
    return i === -1 ? '—' : cab[i];
  });
});
const pie = () => p.evaluate(() => [...document.querySelectorAll('.mp-fila-pie td.mp-pie')].map((t) => t.innerText.replace(/\s+/g, ' ').trim()));

await p.click('#pestana-material');
await p.waitForSelector('#material-busca');

console.log('--- 1. «Pedir lo marcado» ---');
await comprobar('1a. sin nada marcado, el botón no se puede pulsar', p.locator('[data-accion=pedir]').isDisabled(), true);
await p.check('#material-todas');
await comprobar('1b. con cuatro marcadas dice «Pedir lo marcado (4)…»', p.locator('[data-accion=pedir]').innerText(), 'Pedir lo marcado (4)…');
await p.click('[data-accion=pedir]');
await cuadroAbierto();
await comprobar('1c. el cuadro se titula «Pedir 4 artículos»', p.locator('#cuadro-titulo').innerText(), 'Pedir 4 artículos');
await comprobar('1d. una columna por proveedor con algún precio de esos artículos',
  p.locator('.mp-tabla thead th.mp-prov').allInnerTexts(), ['Copistería Central', 'Papelería La Esquina, S.L.', 'Suministros Escolares Dobla, S.L.']);
await comprobar('1e. cada línea va al más barato reciente', elegidos(), ['Suministros Escolares Dobla, S.L.', 'Suministros Escolares Dobla, S.L.', 'Papelería La Esquina, S.L.', 'Suministros Escolares Dobla, S.L.']);
await comprobar('1f. el botón dice «Hacer 2 pedidos»', p.locator('#cuadro-aceptar').innerText(), 'Hacer 2 pedidos');
await comprobar('1g. la casilla más barata de la primera línea va en verde y la de hace más de seis meses en gris', p.evaluate(() => {
  const celdas = [...document.querySelectorAll('.mp-tabla tbody tr')[0].querySelectorAll('td.mp-casilla')];
  return celdas.map((c) => c.className.replace('mp-casilla', '').replace('mp-elegida', '').trim());
}), ['mp-viejo', '', 'mp-mejor']);
await comprobar('1h. una casilla sin precio lo dice', p.evaluate(() => [...document.querySelectorAll('.mp-casilla.mp-sin')].length > 0 && document.querySelector('.mp-casilla.mp-sin').textContent.trim()), 'sin precio');

console.log('--- 2. pie de cada proveedor ---');
const pies = await pie();
await comprobar('2a. Dobla: lo asignado sin IVA (20 × 2,15 + 2 × 18,50 + 3 × 4,60 = 93,80) y con IVA', pies[2].includes('93,80 €') && pies[2].includes('113,50 €'), true);
await comprobar('2b. Dobla: «te faltan 56,20 €» para los 150 € de portes gratis', pies[2].includes('te faltan 56,20 €'), true);
await comprobar('2c. Dobla: «este año» suma lo facturado, lo pedido sin facturar y este pedido, y avisa «cerca del tope»', pies[2].includes('este año: 13.093,80 € de 15.000,00 €') && pies[2].includes('cerca del tope'), true);
await comprobar('2d. sin portes apuntados, lo dice', pies[1].includes('sin apuntar'), true);

console.log('--- 3. cambiar de proveedor ---');
await p.locator('.mp-tabla tbody tr').nth(0).locator('td.mp-casilla').nth(1).click();
await comprobar('3a. pulsar otra casilla de la fila cambia el proveedor', elegidos().then((l) => l[0]), 'Papelería La Esquina, S.L.');
await comprobar('3b. los totales cambian (Esquina: 20 × 2,35 + 1 × 14,90 = 61,90)', pie().then((l) => l[1].includes('61,90 €')), true);
await p.locator('.mp-tabla tbody tr').nth(0).locator('td.mp-casilla').nth(2).click();

console.log('--- 4. partir una línea ---');
await p.fill('[data-cantf]', '12');
await p.locator('[data-cantf]').first().dispatchEvent('change');
await p.waitForFunction(() => document.querySelectorAll('.mp-tabla tbody tr:not(.mp-fila-pie)').length === 5);
await comprobar('4a. bajar de 20 a 12 crea otra fila debajo, sin asignar', elegidos(), ['Suministros Escolares Dobla, S.L.', '—', 'Suministros Escolares Dobla, S.L.', 'Papelería La Esquina, S.L.', 'Suministros Escolares Dobla, S.L.']);
await comprobar('4b. la fila partida dice que se queda en «Lo que falta»', p.locator('.mp-sin-asignar').first().innerText(), 'sin asignar: se queda en «Lo que falta»');
await comprobar('4c. la cantidad de la fila de debajo es 8', p.locator('[data-cantf]').nth(1).inputValue(), '8');

console.log('--- 5. una casilla sin precio pide el precio ---');
const filaA5 = p.locator('.mp-tabla tbody tr', { hasText: 'Sobres' }).first();
await filaA5.locator('td.mp-casilla[data-prov="Papelería La Esquina, S.L."]').click();
await p.waitForSelector('#capa:not(.oculto) #material-pi');
await comprobar('5a. se abre «Añadir precio» con el proveedor ya puesto y sin poder cambiarlo', p.evaluate(() => [document.querySelector('#cuadro-titulo').textContent, document.querySelector('#material-pp').disabled, document.querySelector('#material-pp').value]), ['Añadir precio', true, 'Papelería La Esquina, S.L.']);
await p.fill('#material-pi', '19,5');
await p.click('#cuadro-aceptar');
await cuadroAbierto();
await comprobar('5b. al guardar vuelve el cuadro «Pedir» y la línea queda asignada a ese proveedor', elegidos().then((l) => l[2]), 'Papelería La Esquina, S.L.');
await comprobar('5c. la casilla muestra el precio nuevo y «Cambiar precio»', filaA5.locator('td.mp-elegida').innerText().then(limpio), '✓ 39,00 € 19,50 € · ' + await filaA5.locator('td.mp-elegida .suave').innerText().then((t) => t.split('· ')[1]) + ' Cambiar precio');

console.log('--- 6. + Otro proveedor ---');
const antes = await p.locator('.mp-tabla thead th.mp-prov').count();
const opciones = await p.locator('#mp-otro-sel option').count();
await comprobar('6a. el desplegable ofrece empresas que aún no tienen columna', opciones > 1, true);
await p.selectOption('#mp-otro-sel', { index: 1 });
await comprobar('6b. aparece una columna nueva, sin precios', p.locator('.mp-tabla thead th.mp-prov').count().then((n) => n === antes + 1), true);

console.log('--- 7. hacer los pedidos ---');
await p.locator('.mp-tabla tbody tr').nth(0).locator('td.mp-casilla[data-prov="Papelería La Esquina, S.L."]').click();   /* la 1.ª línea a Esquina */
await comprobar('7a. el botón cuenta los proveedores con líneas', p.locator('#cuadro-aceptar').innerText(), 'Hacer 2 pedidos');
await p.click('#cuadro-aceptar');
await cuadroCerrado();
await p.waitForSelector('.mp-pedido', { timeout: 15000 });
await comprobar('7b. se pasa a «Pedidos», con un recuadro por proveedor', p.locator('.mp-pedido').count(), 2);
await comprobar('7c. cada recuadro lleva su asunto COMPRA con número y su documento de pedido', p.evaluate(() => [...document.querySelectorAll('.mp-pedido h3')].map((h) => /A26-\d+ · /.test(h.textContent) && /PEDIDO D26-/.test(h.textContent))), [true, true]);
await comprobar('7d. la pestaña «Pedidos» cuenta 2', p.locator('[data-pestana=pedidos]').innerText(), 'Pedidos (2)');
const totales = await p.evaluate(() => [...document.querySelectorAll('.mp-pedido tbody tr:last-child td:last-child')].map((t) => t.textContent.trim()));
await comprobar('7e. cada recuadro termina en «total sin IVA · con IVA»', totales.every((t) => /^\d[\d.]*,\d\d € · \d[\d.]*,\d\d €$/.test(t)), true);
await p.click('[data-pestana=falta]');
await p.waitForSelector('#material-busca');
await comprobar('7f. en «Lo que falta» se queda lo no asignado: 8 del papel A4 80 g que se partió', p.evaluate(() => [...document.querySelectorAll('#material-cuerpo table tbody tr')].map((r) => [r.children[1].textContent.trim(), r.querySelector('[data-cant]').value])), [['Papel A4 80 g Blanco', '8']]);
await comprobar('7g. «Pedidos» sigue en la pestaña con sus 2 recuadros al volver', (async () => { await p.click('[data-pestana=pedidos]'); return p.locator('.mp-pedido').count(); })(), 2);
await comprobar('7h. «Proveedores» ya cuenta el pedido sin facturar de este año', (async () => {
  await p.click('[data-pestana=proveedores]');
  return p.evaluate(() => [...document.querySelectorAll('#material-cuerpo tbody tr')].map((r) => r.children[4].textContent.trim()).some((t) => t !== '0,00 €' && t !== '1.200,00 €'));
})(), true);

console.log('--- 8. abrir un pedido ---');
await p.click('[data-pestana=pedidos]');
await p.locator('[data-abre]').first().click();
await comprobar('8a. el número de un pedido abre la ficha de su asunto', p.waitForSelector('#ficha-volver', { timeout: 10000 }).then(() => true).catch(() => false), true);

await comprobar('9. consola sin errores', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
