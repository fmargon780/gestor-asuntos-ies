/* Prueba de la fila 753 (docs/583-COMPRAS-DE-MATERIAL.md, parte 4): «Pedir precios de lo marcado…» en «Lo que falta».
   Copia de pruebas (demo), Chromium real: el envío de la demostración no manda nada y nunca se tocan datos reales. */
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
const botonPrecios = () => p.locator('[data-accion=pedir-precios]');

await p.click('#pestana-material');
await p.waitForSelector('#material-busca');
/* Anota lo que «envía» la app, sin cambiar nada de cómo envía. */
await p.evaluate(() => {
  window.__correos = [];
  const real = CorreoEnviar.enviar;
  CorreoEnviar.enviar = function (c, l) { window.__correos.push({ para: c.para, asunto: c.asunto, cuerpo: c.cuerpo, adjuntos: (c.adjuntos || []).length }); return real.call(CorreoEnviar, c, l); };
});
const marcar = (n) => p.locator('#material-cuerpo [data-marca]').nth(n).check();
const notas = () => p.evaluate(() => [...document.querySelectorAll('#material-cuerpo table tbody tr')].map((r) => (r.querySelector('.material-pedidos-precios') || { textContent: '' }).textContent));

console.log('--- 1. el botón ---');
await comprobar('1a. sin nada marcado, «Pedir precios de lo marcado…» está apagado', botonPrecios().isDisabled(), true);
await comprobar('1b. con dos líneas marcadas, se enciende y las cuenta', (async () => { await marcar(0); await marcar(1); return texto('[data-accion=pedir-precios]'); })(), 'Pedir precios de lo marcado (2)…');
await comprobar('1c. de entrada, ninguna línea dice «precios pedidos»', notas(), ['', '', '', '']);

console.log('--- 2. el cuadro «Pedir precios» ---');
await botonPrecios().click();
await p.waitForSelector('.material-peticion');
await comprobar('2a. el título', texto('#cuadro-titulo'), 'Pedir precios');
await comprobar('2b. los proveedores, cada uno con su correo; el que no tiene no se puede marcar y lo dice',
  p.evaluate(() => [...document.querySelectorAll('.material-peticion-prov')].map((l) => [l.innerText.replace(/\s+/g, ' ').trim(), l.querySelector('input').disabled])),
  [['Copistería Central info@copicentral-demo.es', false], ['Papelería La Esquina, S.L. esquina@papeleria-demo.es', false],
   ['Suministros Dobla Norte, S.L. sin correo: añádelo en Personas y empresas', true], ['Suministros Escolares Dobla, S.L. pedidos@dobla-demo.es', false]]);
await comprobar('2c. sin marcar ninguno, el botón dice «Enviar» y está apagado', p.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-aceptar').disabled]), ['Enviar', true]);
const correo = await texto('.material-peticion-correo');
await comprobar('2d. a la derecha, el correo tal como saldrá', correo.indexOf('Asunto: Petición de precios · ') === 0 && correo.indexOf('Buenos días: Les rogamos nos indiquen precio sin IVA y plazo de entrega de:') > 0 && /Un saludo\. Administración$/.test(correo), true);
await comprobar('2e. la lista lleva las dos líneas marcadas con su cantidad y unidad', p.evaluate(() => [...document.querySelectorAll('.material-peticion-correo li')].map((l) => l.textContent)),
  ['Papel A4 80 g Blanco: 20 × paquete de 500 hojas', 'Sobres DL 110×220 Con ventana: 2 × caja de 500']);
await p.locator('[data-prov="0"]').check();
await comprobar('2f. con uno marcado: «Enviar 1 correo»', texto('#cuadro-aceptar'), 'Enviar 1 correo');
await p.locator('[data-prov="3"]').check();
await comprobar('2g. con dos marcados: «Enviar 2 correos»', texto('#cuadro-aceptar'), 'Enviar 2 correos');
await p.screenshot({ path: process.env.CAPTURA || '/tmp/material-pedir-precios.png' });

console.log('--- 3. enviar ---');
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => /precios pedidos/.test(document.querySelector('#material-cuerpo table').textContent));
await comprobar('3a. salen dos correos, uno a cada proveedor marcado, sin adjuntos', p.evaluate(() => window.__correos.map((c) => [c.para, c.adjuntos])), [['info@copicentral-demo.es', 0], ['pedidos@dobla-demo.es', 0]]);
await comprobar('3b. el asunto y el cuerpo son los del cuadro', p.evaluate(() => [window.__correos[0].asunto.indexOf('Petición de precios · ') === 0, window.__correos[0].cuerpo]),
  [true, 'Buenos días:\n\nLes rogamos nos indiquen precio sin IVA y plazo de entrega de:\n\n- Papel A4 80 g Blanco: 20 × paquete de 500 hojas\n- Sobres DL 110×220 Con ventana: 2 × caja de 500\n\nUn saludo.\nAdministración']);
await comprobar('3c. el aviso dice cuántos y que en la prueba no sale ninguno', p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje')].map((m) => m.textContent).filter((t) => /petición de precios/.test(t))), ['2 correos de petición de precios (en la prueba no sale ninguno).']);
await comprobar('3d. solo las dos líneas pedidas enseñan «precios pedidos el … a 2 proveedores»',
  notas().then((n) => n.map((x) => x.replace(/\d+-\w{3}-\d{4}/, 'FECHA'))), ['precios pedidos el FECHA a 2 proveedores', 'precios pedidos el FECHA a 2 proveedores', '', '']);
await comprobar('3e. las líneas siguen en «Lo que falta»', texto('[data-pestana=falta]'), 'Lo que falta (4)');

console.log('--- 4. sigue ahí tras recargar los datos, y otro envío cuenta aparte ---');
await p.evaluate(() => Material.recargar());
await p.waitForTimeout(500);
await comprobar('4a. lo pedido se guardó en el centro', notas().then((n) => n.filter(Boolean).length), 2);
await p.locator('#material-cuerpo [data-marca]').nth(0).uncheck();
await marcar(2);
await botonPrecios().click();
await p.waitForSelector('.material-peticion');
await p.locator('[data-prov="1"]').check();
await p.click('#cuadro-aceptar');
await esperarCuadroCerrado();
await p.waitForFunction(() => /a 1 proveedor/.test(document.querySelector('#material-cuerpo table').innerText));
await comprobar('4b. la línea pedida otra vez enseña el último envío (a 1 proveedor)', notas().then((n) => n.map((x) => x.replace(/\d+-\w{3}-\d{4}/, 'FECHA'))),
  ['precios pedidos el FECHA a 2 proveedores', 'precios pedidos el FECHA a 1 proveedor', 'precios pedidos el FECHA a 1 proveedor', '']);

console.log('--- 5. cancelar no manda nada ---');
const antes = await p.evaluate(() => window.__correos.length);
await botonPrecios().click();
await p.waitForSelector('.material-peticion');
await p.locator('[data-prov="0"]').check();
await p.click('#cuadro-cancelar');
await esperarCuadroCerrado();
await comprobar('5a. no sale ningún correo más', p.evaluate(() => window.__correos.length), antes);

console.log('--- 6. consola ---');
await comprobar('6. ningún error en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
