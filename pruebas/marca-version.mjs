/* Fila 325 (docs/VERSION-NUEVA-SIN-FRANJA.md): la marca «hay versión nueva» junto al número de versión,
   en lugar de la franja amarilla. Con Chromium real y la copia de pruebas (`versionnueva=1`). */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(parametros, ancho) {
  const pagina = await navegador.newPage({ viewport: { width: ancho || 1400, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  /* Las novedades ya vistas: si no, «Qué hay de nuevo» se abre solo al entrar. */
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(BASE + '?demo=1&auto=1' + parametros);
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  return pagina;
}
const franja = (p) => p.locator('#franja-copia').count();
const marca = (p) => p.locator('#marca-version').count();

console.log('--- 1 a 6 ---');
let p = await abrir('&versionnueva=1');
await p.waitForSelector('#marca-version', { timeout: 15000 });
await comprobar('1. ninguna franja amarilla', franja(p), 0);
await comprobar('2. junto al número de versión se lee «hay versión nueva»', p.locator('#usuario-pie #marca-version').textContent(), 'hay versión nueva');
await comprobar('2. la marca es un elemento aparte del número de versión', p.evaluate(() => {
  const m = document.getElementById('marca-version'), v = document.querySelector('#usuario-pie .version-pulsable');
  return !!v && !v.contains(m) && !m.contains(v) && m.title.indexOf('31-dic-2099') !== -1;
}), true);
await p.click('#usuario-pie .version-pulsable');
await comprobar('3. el número de versión abre «Qué hay de nuevo»', p.locator('#cuadro-titulo').textContent().then((t) => /nuevo/i.test(t)), true);
await p.click('#cuadro-aceptar');
await p.click('#marca-version');
await comprobar('4. la marca abre «Actualizar el Gestor»', p.locator('#cuadro-titulo').textContent(), 'Actualizar el Gestor');
await comprobar('4. dice que se recarga y que lo escrito se pierde', p.locator('#cuadro-cuerpo').textContent().then((t) => /se recarga/.test(t) && /a medio escribir se pierde/.test(t) && /31-dic-2099/.test(t)), true);
await comprobar('4. botones «Actualizar ahora» y «Cancelar»', [await p.locator('#cuadro-aceptar').textContent(), await p.locator('#cuadro-cancelar').textContent()], ['Actualizar ahora', 'Cancelar']);
let recargas = 0;
p.on('framenavigated', (f) => { if (f === p.mainFrame()) recargas++; });
await p.click('#cuadro-cancelar');
await comprobar('5. «Cancelar» cierra el cuadro', p.locator('#capa').evaluate((e) => e.classList.contains('oculto')), true);
await comprobar('5. la marca sigue', marca(p), 1);
await comprobar('5. la página no se recarga', recargas, 0);

await p.fill('#buscar-abiertos', 'texto a medio escribir');
await p.waitForTimeout(15000);
await comprobar('6. un minuto después no se ha recargado y lo escrito sigue', [recargas, await p.inputValue('#buscar-abiertos')], [0, 'texto a medio escribir']);

console.log('--- varias comprobaciones seguidas ---');
await p.evaluate(async () => { await Promise.all([AvisoVersionWeb.comprobar(), AvisoVersionWeb.comprobar(), AvisoVersionWeb.comprobar()]); });
await comprobar('no pintan dos marcas', marca(p), 1);
await comprobar('y no recargan', recargas, 0);

console.log('--- 7. «Actualizar ahora» ---');
await p.click('#marca-version');
await Promise.all([p.waitForEvent('framenavigated', { predicate: (f) => f === p.mainFrame() }), p.click('#cuadro-aceptar')]);
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(800);
await comprobar('7. se recarga y vuelve a estar dentro de la aplicación', p.locator('#aplicacion').isVisible(), true);
await comprobar('7. la marca ya no sale', [await marca(p), await franja(p)], [0, 0]);
await p.close();

console.log('--- 8. sin el parámetro ---');
p = await abrir('');
await p.waitForTimeout(2500);
await comprobar('8. ni franja ni marca', [await franja(p), await marca(p)], [0, 0]);
await p.click('#usuario-pie .version-pulsable');
await comprobar('8. el número de versión abre «Qué hay de nuevo»', p.locator('#cuadro-titulo').textContent().then((t) => /nuevo/i.test(t)), true);
await p.close();

console.log('--- 9. Comprobación al entrar ---');
p = await abrir('&versionnueva=1');
await p.waitForSelector('#marca-version', { timeout: 15000 });
await p.evaluate(() => { ComprobacionEntrada.abrirPanel(); });
await p.waitForSelector('#capa:not(.oculto) .comprobacion-fila');
await comprobar('9. en la web esta fila no sale, y ninguna manda a una franja', p.locator('#cuadro-cuerpo').textContent().then((t) => !/franja/i.test(t)), true);
await p.close();

console.log('--- 10. ventana estrecha ---');
p = await abrir('&versionnueva=1', 1000);
await p.waitForSelector('#marca-version', { state: 'attached', timeout: 15000 });
await comprobar('10. la marca no se monta encima del número de versión (o se esconde con él si la barra se pliega)', p.evaluate(() => {
  const m = document.getElementById('marca-version').getBoundingClientRect(), v = document.querySelector('#usuario-pie .version-pulsable').getBoundingClientRect();
  if (!v.width) return !m.width;
  return m.right <= v.left + 1 || m.left >= v.right - 1 || m.top >= v.bottom - 1 || m.bottom <= v.top + 1;
}), true);
await p.close();

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de la marca de versión pasan.');
process.exit(fallos ? 1 : 0);
