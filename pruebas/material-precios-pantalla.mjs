/* Prueba de la fila 751 (docs/583-COMPRAS-DE-MATERIAL.md, parte 2): la tabla de precios del catálogo, «+ Añadir precio»,
   la columna «Mejor precio» y la pestaña «Proveedores». Copia de pruebas (demo), Chromium real: nunca se tocan datos reales. */
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
const texto = (sel) => p.locator(sel).innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const filasPrecios = () => p.evaluate(() => [...document.querySelectorAll('.material-precios-tabla tbody tr')].map((r) => [r.className.replace('material-precio-abre', '').trim(), ...[...r.children].map((c) => c.textContent.trim())]));

await p.click('#pestana-material');
await p.waitForSelector('#material-busca');

console.log('--- 1. «Mejor precio» en «Lo que falta» ---');
await comprobar('1a. cada línea dice precio · proveedor (fecha) o «Sin precio reciente»', p.evaluate(() => [...document.querySelectorAll('#material-cuerpo table tbody tr')].map((r) => r.children[5].textContent.trim().replace(/\d+-\w{3}-\d{4}/, 'FECHA'))),
  ['2,15 € · Suministros Escolares Dobla, S.L. (FECHA)', '18,50 € · Suministros Escolares Dobla, S.L. (FECHA)', '14,90 € · Papelería La Esquina, S.L. (FECHA)', '4,60 € · Suministros Escolares Dobla, S.L. (FECHA)']);

console.log('--- 2. la tabla de precios de un artículo ---');
await p.click('[data-pestana=catalogo]');
await p.waitForSelector('.material-catalogo');
await p.locator('.material-fila', { hasText: 'A4' }).filter({ hasText: '80 g' }).filter({ hasText: 'Blanco' }).first().click();
await p.waitForSelector('.material-precios-tabla');
const f1 = await filasPrecios();
await comprobar('2a. un renglón por proveedor, de barato a caro', f1.map((f) => f[1]), ['Copistería Central', 'Suministros Escolares Dobla, S.L.', 'Papelería La Esquina, S.L.']);
await comprobar('2b. el más barato reciente en verde; el de hace más de seis meses, en gris', f1.map((f) => f[0]), ['material-precio-viejo', 'material-precio-mejor', '']);
await comprobar('2c. el precio sale con coma y €', f1.map((f) => f[2]), ['1,90 €', '2,15 €', '2,35 €']);
await comprobar('2d. la columna «Mejor precio» del catálogo ignora el de hace más de seis meses', p.locator('.material-fila.elegida td').last().innerText(), '2,15 € · Suministros Escolares Dobla, S.L. (' + (f1[1][3]) + ')');

console.log('--- 3. añadir un precio ---');
await p.click('#material-precio-nuevo');
await p.waitForSelector('#material-pp');
await p.click('#cuadro-aceptar');
await comprobar('3a. sin proveedor no se guarda y lo dice', [await p.locator('#capa.oculto').count(), await p.locator('#material-pp').count()], [0, 1]);
await p.selectOption('#material-pp', 'Papelería La Esquina, S.L.');
await p.fill('#material-pi', '1,95');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => document.querySelector('.material-precios-tabla tbody tr'));
const f2 = await filasPrecios();
await comprobar('3b. el precio de hoy sustituye al anterior de ese proveedor y es el nuevo mejor', f2.map((f) => [f[0], f[1], f[2]]), [['material-precio-viejo', 'Copistería Central', '1,90 €'], ['material-precio-mejor', 'Papelería La Esquina, S.L.', '1,95 €'], ['', 'Suministros Escolares Dobla, S.L.', '2,15 €']]);
await p.click('#material-precio-nuevo');
await p.waitForSelector('#material-pp');
await p.selectOption('#material-pp', 'Papelería La Esquina, S.L.');
await p.fill('#material-pi', '1,80');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => /1,80/.test(document.querySelector('.material-precios-tabla').textContent));
await comprobar('3c. el mismo proveedor y día sustituye (sigue un solo renglón suyo)', (await filasPrecios()).filter((f) => f[1].indexOf('Esquina') !== -1).map((f) => f[2]), ['1,80 €']);
await p.click('#material-precio-nuevo');
await p.waitForSelector('#material-pp');
await p.selectOption('#material-po', 'Presupuesto');
await comprobar('3d. «Presupuesto» enseña el documento', p.locator('#material-pd').isVisible(), true);
await p.selectOption('#material-pp', 'Copistería Central');
await p.fill('#material-pi', '1,70');
await p.click('#cuadro-aceptar');
await comprobar('3e. un presupuesto sin documento no se guarda', p.locator('#material-pp').count(), 1);
await p.click('#cuadro-cancelar');
await esperarCuadroCerrado();

await p.click('#material-precio-nuevo');
await p.waitForSelector('#material-pp');
await comprobar('3e2. la última opción del proveedor es «+ Nueva empresa…» y abre el alta de siempre', (async () => {
  const ult = await p.locator('#material-pp option').last().innerText();
  await p.selectOption('#material-pp', '__nueva');
  await p.waitForSelector('#cuadro-titulo:has-text("Dar de alta")', { timeout: 5000 });
  const titulo = await p.locator('#cuadro-titulo').innerText();
  await p.click('#cuadro-cancelar');
  await p.waitForSelector('#material-pp', { timeout: 5000 });    /* tras cancelar el alta, vuelve el cuadro de precio */
  await p.click('#cuadro-cancelar');
  await esperarCuadroCerrado();
  return [ult, titulo];
})(), ['+ Nueva empresa…', 'Dar de alta en EMPRESAS']);

console.log('--- 3bis. un precio de presupuesto con su documento ---');
await p.click('#material-precio-nuevo');
await p.waitForSelector('#material-pp');
await p.selectOption('#material-pp', 'Copistería Central');
await p.fill('#material-pi', '1,70');
await p.selectOption('#material-po', 'Presupuesto');
await p.click('#material-pdoc');
await p.waitForSelector('#enlace-todos > *');
/* Los asuntos sin documentos avisan y vuelven a la lista: se prueba con los siguientes hasta dar con uno que los tenga. */
let docElegido = '';
for (let i = 0; i < 25 && !docElegido; i++) {
  await p.locator('#enlace-todos > *').nth(i).click();
  const salida = await Promise.race([p.waitForSelector('#material-pdoc-sel', { timeout: 2500 }).then(() => 'doc'), p.waitForSelector('#enlace-todos > *', { timeout: 2500 }).then(() => 'otra')]).catch(() => 'nada');
  if (salida === 'doc') docElegido = await p.locator('#material-pdoc-sel').inputValue();
  else await p.waitForTimeout(300);
}
await comprobar('3f0. un asunto sin documentos avisa y deja elegir otro; con documentos, enseña el cuadro del documento', docElegido !== '', true);
await p.click('#cuadro-aceptar');
await p.waitForSelector('#material-pp');
await comprobar('3f. al volver, el cuadro conserva lo escrito y enseña el documento', [await p.locator('#material-pp').inputValue(), await p.locator('#material-pi').inputValue(), await p.locator('#material-po').inputValue(), (await texto('#material-pd')).indexOf(docElegido) !== -1], ['Copistería Central', '1,70', 'Presupuesto', true]);
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForSelector('.material-precio-abre');
await comprobar('3g. el renglón del presupuesto dice el documento y se puede abrir', [await p.locator('.material-precio-abre').count(), (await p.locator('.material-precio-abre').first().innerText()).indexOf('Presupuesto · ' + docElegido) !== -1], [1, true]);
await p.locator('.material-precio-abre').first().click();
await p.waitForTimeout(1500);
await comprobar('3h. se abre el documento', p.evaluate(() => !!document.querySelector('.lector, #lector, [id*=lector]:not(.oculto)')), true);
await p.keyboard.press('Escape');
await p.waitForTimeout(300);

console.log('--- 4. la pestaña «Proveedores» ---');
await p.click('[data-pestana=proveedores]');
await p.waitForSelector('.material-barra');
await comprobar('4a. un proveedor por cada uno con precio, con su correo', p.evaluate(() => [...document.querySelectorAll('#material-cuerpo tbody tr')].map((r) => [r.children[0].textContent, r.children[1].textContent])),
  [['Copistería Central', 'info@copicentral-demo.es'], ['Papelería La Esquina, S.L.', 'esquina@papeleria-demo.es'], ['Suministros Dobla Norte, S.L.', 'sin correo'], ['Suministros Escolares Dobla, S.L.', 'pedidos@dobla-demo.es']]);
await comprobar('4b. barra verde, roja al pasar y ámbar desde el 80 %', p.evaluate(() => [...document.querySelectorAll('.material-barra')].map((b) => b.className.replace('material-barra material-barra-', ''))), ['bien', 'pasado', 'bien', 'cerca']);
await comprobar('4c. la barra dice «N € · N %» y la etiqueta', p.evaluate(() => [...document.querySelectorAll('.material-barra-texto')].map((b) => b.textContent.replace(/\s+/g, ' '))),
  ['900,00 € · 6 %', '15.600,00 € · 104 % · pasado del tope', '0,00 € · 0 %', '13.000,00 € · 87 % · cerca del tope']);
await comprobar('4d. portes: «sin apuntar» o el importe', p.evaluate(() => [...document.querySelectorAll('[data-portes]')].map((b) => b.textContent)), ['sin apuntar', 'sin apuntar', 'sin apuntar', '150,00 €']);
await p.locator('[data-portes="Copistería Central"]').click();
await p.waitForSelector('#material-portes');
await p.fill('#material-portes', '60');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => document.querySelector('[data-portes="Copistería Central"]').textContent === '60,00 €');
await comprobar('4e. cambiar los portes se guarda y se ve', p.locator('[data-portes="Copistería Central"]').innerText(), '60,00 €');
await p.screenshot({ path: process.env.CAPTURA || '/tmp/material-proveedores.png' });
await p.locator('[data-portes="Copistería Central"]').click();
await p.fill('#material-portes', '');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => document.querySelector('[data-portes="Copistería Central"]').textContent === 'sin apuntar');
await comprobar('4f. vaciarlo lo deja «sin apuntar»', p.locator('[data-portes="Copistería Central"]').innerText(), 'sin apuntar');
await comprobar('4g. el número de la pestaña', p.locator('[data-pestana=proveedores]').innerText(), 'Proveedores (4)');
await comprobar('5. ningún error en la consola', errores, []);

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
