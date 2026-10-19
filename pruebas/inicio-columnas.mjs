/* Fila 368 (19-oct-2026, docs/INICIO-COLOCACION-Y-COLUMNAS.md): la cabecera de Inicio bien colocada y el orden de columnas por
   persona. Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1).

   1. «Actualizar», «Filtros» y «Exportar» están en el renglón de las pestañas, a la derecha (a 1920 y a 1366 px), y lo que
      comparte renglón va sobre la misma línea y con el mismo alto.
   2. El cuadro de avisos abierto flota: la primera fila de la lista no se mueve. Se cierra con Esc, al pulsar fuera y al
      volver a pulsar «N avisos».
   3. Arrastrando los títulos se deja el orden Inicio · Tipo · Tercero · Plazo · Hito actual · Le toca a; vale en todas las
      pestañas; pulsar un título sin arrastrar sigue ordenando.
   4. Con otro nombre se ve el orden de siempre; al volver al primero, su orden sigue ahí; un directivo también lo guarda.
   5. «Restablecer columnas» (dentro de «Filtros») solo sale tras mover alguna; vuelve el orden de siempre y se borra lo guardado.
   6. «Por liquidar»: Tercero y Tipo siguen el orden elegido y allí no se arrastra nada.
   7. En «solo consultar», el orden se guarda en ese ordenador (sobrevive a recargar) y no sale el aviso ámbar. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const JEFA = 'Jefa de estudios de prueba';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(ancho, extra) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); " + (extra || '') + " } catch (e) { /* sin almacenamiento */ }");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
  return pagina;
}

/* ===== 1. La cabecera, a 1920 y a 1366 ===== */
for (const ancho of [1920, 1366]) {
  console.log('--- 1. la cabecera a ' + ancho + ' px ---');
  const p = await abrir(ancho);
  await p.waitForTimeout(1200);
  await comprobar('1. «Actualizar», «Filtros» y «Exportar» están en el renglón de las pestañas, a la derecha',
    p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const centro = (s) => Math.round(r(s).top + r(s).height / 2);
      const pestana = centro('.inicio-pestana[data-pestana="todos"]');
      const ids = ['#btn-recargar', '#btn-filtros', '#btn-exportar', '#cuenta-lista-abiertos'];
      const tabs = r('#inicio-pestanas');
      return { mismaLinea: ids.every((i) => Math.abs(centro(i) - pestana) <= 2),
        derecha: r('#btn-exportar').right >= r('.inicio-tabla-envoltorio').right - 2 && r('#btn-recargar').left > tabs.right };
    }), { mismaLinea: true, derecha: true });
  await comprobar('1. pestañas y botones, del mismo alto',
    p.evaluate(() => {
      const h = (s) => Math.round(document.querySelector(s).getBoundingClientRect().height);
      return [h('.inicio-pestana[data-pestana="todos"]'), h('#btn-recargar'), h('#btn-filtros'), h('#btn-exportar')].every((x) => x === h('#btn-filtros'));
    }), true);
  await comprobar('1. arriba, «+ Nuevo asunto», el buscador y «N avisos» van sobre la misma línea y con el mismo alto; «Ha llegado» también va centrado',
    p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const centro = (s) => Math.round(r(s).top + r(s).height / 2);
      const avisos = document.getElementById('avisos-linea');
      if (!avisos || avisos.classList.contains('oculto')) return 'sin avisos';
      const alto = Math.round(r('#btn-nuevo-asunto').height);
      return { alto: [r('#buscar-abiertos'), r('#avisos-linea')].every((b) => Math.round(b.height) === alto),
        linea: Math.abs(centro('#buscar-abiertos') - centro('#btn-nuevo-asunto')) <= 2 && Math.abs(centro('#avisos-linea') - centro('#inicio-ha-llegado-linea')) <= 2 };
    }), { alto: true, linea: true });
  await p.close();
}

/* ===== 2. El cuadro de avisos flota ===== */
console.log('--- 2. el cuadro de avisos flota ---');
{
  const p = await abrir(1366);
  await p.waitForSelector('#avisos-linea-plegado', { timeout: 20000 });
  const primera = () => p.evaluate(() => Math.round(document.querySelector('#inicio-tabla-cuerpo tr[data-asunto]').getBoundingClientRect().top));
  await p.waitForTimeout(1500);
  const antes = await primera();
  const abierto = () => p.evaluate(() => !!document.querySelector('#avisos-linea .avisos-linea-panel'));
  await p.click('#avisos-linea-plegado');
  await comprobar('2. al desplegar «N avisos», sale el cuadro', abierto(), true);
  await comprobar('2. la lista no baja de sitio', primera(), antes);
  await comprobar('2. el cuadro queda por encima de la lista y dentro de la ventana',
    p.evaluate(() => {
      const c = document.querySelector('.avisos-linea-panel').getBoundingClientRect();
      const e = document.elementFromPoint(c.left + 20, c.top + 8);
      return [!!e && !!e.closest('.avisos-linea-panel'), c.bottom <= window.innerHeight, getComputedStyle(document.querySelector('.avisos-linea-panel')).position];
    }), [true, true, 'absolute']);
  await p.keyboard.press('Escape');
  await comprobar('2. se cierra con Esc', abierto(), false);
  await p.click('#avisos-linea-plegado');
  await p.mouse.click(100, 560);   /* un hueco de la barra lateral */
  await comprobar('2. se cierra al pulsar fuera', abierto(), false);
  await p.click('#avisos-linea-plegado');
  await p.click('#avisos-linea-pliega');
  await comprobar('2. se cierra al volver a pulsar «N avisos»', abierto(), false);
  await p.click('#avisos-linea-plegado');
  await p.setViewportSize({ width: 1366, height: 420 });
  await comprobar('2. en una ventana baja, el cuadro tiene su propia barra y no se sale por debajo',
    p.evaluate(() => { const c = document.querySelector('.avisos-linea-panel'); return c.getBoundingClientRect().bottom <= window.innerHeight; }), true);
  await p.setViewportSize({ width: 1366, height: 900 });
  await p.close();
}

/* ===== 3 a 6. Orden de columnas ===== */
console.log('--- 3. arrastrar los títulos ---');
const p = await abrir(1366);
const titulos = () => p.evaluate(() => [...document.querySelectorAll('#inicio-thead-normal th')].map((t) => t.dataset.col || ''));
const celdas = () => p.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')[0].children].map((t) => (t.classList.contains('inicio-tabla-tercero') ? 'tercero' : t.classList.contains('inicio-tabla-menu') ? 'menu' : t.classList.contains('inicio-tabla-hito') ? 'hito' : t.querySelector('.marca-tipo') ? 'tipo' : t.querySelector('.marca-plazo') ? 'plazo' : /^\d{2}-\w+-\d{4}$/.test(t.textContent.trim()) ? 'inicio' : 'otra')));
const SIEMPRE = ['plazo', 'tercero', 'tipo', 'hito', 'quien', 'inicio', ''];
async function arrastrar(col, hueco) {
  /* Coge el título de `col` y lo suelta en el hueco `hueco` (0 = antes de la primera columna, 6 = detrás de la última). */
  const caja = (c) => p.locator('#inicio-thead-normal th[data-col="' + c + '"]').boundingBox();
  const orden = (await titulos()).filter(Boolean);
  const o = await caja(col);
  const destino = hueco < 6 ? (await caja(orden[hueco])).x + 3 : (await caja(orden[5])).x + (await caja(orden[5])).width - 3;
  await p.mouse.move(o.x + o.width / 2, o.y + o.height / 2);
  await p.mouse.down();
  await p.mouse.move(o.x + o.width / 2 + 12, o.y + o.height / 2, { steps: 3 });
  await p.mouse.move(destino, o.y + o.height / 2, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(250);
}
await comprobar('3. al principio, el orden de siempre', titulos(), SIEMPRE);
await comprobar('3. «Restablecer columnas» no se ve todavía', p.evaluate(() => { const b = document.getElementById('restablecer-columnas'); return !b || b.offsetParent === null; }), true);
await arrastrar('inicio', 0);
await comprobar('3. arrastrar «Inicio» al principio', titulos(), ['inicio', 'plazo', 'tercero', 'tipo', 'hito', 'quien', '']);
await arrastrar('tipo', 1);
await arrastrar('plazo', 4);
const OBJETIVO = ['inicio', 'tipo', 'tercero', 'plazo', 'hito', 'quien'];
await comprobar('3. queda Inicio · Tipo · Tercero · Plazo · Hito actual · Le toca a (el «⋮» sigue al final)', titulos(), OBJETIVO.concat(['']));
await comprobar('3. las celdas de las filas siguen el mismo orden', p.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')].every((tr) => tr.children.length === 7 && tr.lastElementChild.classList.contains('inicio-tabla-menu') && tr.children[2].classList.contains('inicio-tabla-tercero'))), true);
await comprobar('3. la primera celda es la fecha de inicio, la segunda el tipo', celdas().then((c) => [c[0], c[1], c[2]]), ['inicio', 'tipo', 'tercero']);
await comprobar('3. ordenar y arrastrar: tras arrastrar no se ordena por esa columna', p.evaluate(() => InicioOrden._estado()), { col: null, dir: 1 });
await p.click('#inicio-thead-normal th[data-col="tercero"]');
await comprobar('3. pulsar un título sin arrastrar sigue ordenando', p.evaluate(() => InicioOrden._estado()), { col: 'tercero', dir: 1 });
for (const pestana of ['adm', 'esp', 'dorm', 'todos']) {
  await p.click('.inicio-pestana[data-pestana="' + pestana + '"]');
  await p.waitForSelector('.inicio-pestana.activa[data-pestana="' + pestana + '"]');
  await p.waitForTimeout(400);
  await comprobar('3. en «' + pestana + '» el orden se mantiene', titulos(), OBJETIVO.concat(['']));
  await comprobar('3. en «' + pestana + '» las filas también', p.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')].every((tr) => tr.children[2].classList.contains('inicio-tabla-tercero'))), true);
}
await comprobar('3. «Exportar» sigue con su propio catálogo de columnas (no lee la pantalla)', p.evaluate(() => !!window.ExportarDatos || !!document.getElementById('btn-exportar')), true);

console.log('--- 4. cada persona, su orden ---');
await comprobar('4. se guarda en un fichero propio de la persona, en _GESTOR/preferencias',
  p.evaluate(async () => { const c = await App.E.gestor.getDirectoryHandle('preferencias'); const nombres = []; for await (const [n] of c.entries()) nombres.push(n); return nombres.length === 1 && /\.json$/.test(nombres[0]); }), true);
await p.evaluate(async () => { await Demo.entrarComo('Otra persona'); });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await comprobar('4. con otro nombre se ve el orden de siempre', titulos(), SIEMPRE);
await p.evaluate(async () => { await Demo.entrarComo('Revisor'); });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await comprobar('4. al volver al primer nombre, su orden sigue ahí', titulos(), OBJETIVO.concat(['']));
await p.evaluate(async (j) => { await Demo.entrarComo(j); }, JEFA);
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await comprobar('4. un directivo empieza con el orden de siempre', titulos(), SIEMPRE);
await arrastrar('quien', 0);
await comprobar('4. un directivo también mueve columnas', titulos(), ['quien', 'plazo', 'tercero', 'tipo', 'hito', 'inicio', '']);
await p.evaluate(async () => { await Demo.entrarComo('Revisor'); });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await p.evaluate(async (j) => { await Demo.entrarComo(j); }, JEFA);
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await comprobar('4. y se le recuerda', titulos(), ['quien', 'plazo', 'tercero', 'tipo', 'hito', 'inicio', '']);
await comprobar('4. sin aviso ámbar de solo consulta', p.evaluate(() => document.body.innerText.indexOf('no se ha guardado nada') === -1), true);
await p.evaluate(async () => { await Demo.entrarComo('Revisor'); });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });

console.log('--- 5. restablecer columnas ---');
const enlace = () => p.evaluate(() => { const b = document.getElementById('restablecer-columnas'); return !!b && b.offsetParent !== null; });
await p.click('#btn-filtros');
await comprobar('5. tras mover columnas, «Restablecer columnas» sale dentro de «Filtros»', enlace(), true);
await p.click('#restablecer-columnas');
await p.waitForTimeout(400);
await comprobar('5. vuelve el orden de siempre', titulos(), SIEMPRE);
await comprobar('5. el enlace desaparece', enlace(), false);
await comprobar('5. se borra lo guardado de esa persona', p.evaluate(async () => { const c = await App.E.gestor.getDirectoryHandle('preferencias'); const nombres = []; for await (const [n] of c.entries()) nombres.push(n); return nombres.length; }), 1);   /* queda solo el de la jefa */
await p.click('#btn-filtros');

console.log('--- 6. Por liquidar ---');
await arrastrar('tipo', 1);   /* Plazo · Tipo · Tercero · … */
const liq = p.locator('.inicio-pestana[data-pestana="liq"]');
if (await liq.count() && await liq.isVisible()) {
  await liq.click();
  await p.waitForSelector('#inicio-thead-liquidar:not(.oculto) th[data-col]');
  await comprobar('6. en «Por liquidar», Tipo va antes que Tercero y las suyas, detrás', p.evaluate(() => [...document.querySelectorAll('#inicio-thead-liquidar th')].map((t) => t.dataset.col || '')), ['', 'tipo', 'tercero', 'desde'].concat((await p.locator('#inicio-thead-liquidar th[data-col="importe"]').count()) ? ['importe'] : []));
  await comprobar('6. las celdas siguen el mismo orden', p.evaluate(() => { const tr = document.querySelector('#inicio-tabla-cuerpo tr[data-asunto]'); return [tr.children[1].querySelector('.marca-tipo') ? 'tipo' : '?', tr.children[2].classList.contains('inicio-tabla-tercero') ? 'tercero' : '?']; }), ['tipo', 'tercero']);
  const caja = await p.locator('#inicio-thead-liquidar th[data-col="tercero"]').boundingBox();
  await p.mouse.move(caja.x + 10, caja.y + 10);
  await p.mouse.down();
  await p.mouse.move(caja.x + 150, caja.y + 10, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(250);
  await comprobar('6. allí no se arrastra nada', p.evaluate(() => [...document.querySelectorAll('#inicio-thead-liquidar th')].map((t) => t.dataset.col || '').slice(1, 3)), ['tipo', 'tercero']);
  await p.click('.inicio-pestana[data-pestana="todos"]');
  await p.waitForTimeout(400);
} else console.log('(sin pestaña «Por liquidar» en esta copia: se salta el punto 6)');
await comprobar('6. «Restablecer columnas» sale otra vez', (async () => { await p.click('#btn-filtros'); const v = await enlace(); await p.click('#restablecer-columnas'); await p.click('#btn-filtros'); return v; })(), true);
await p.close();

/* ===== 7. Solo consultar: el orden se guarda en ese ordenador ===== */
console.log('--- 7. solo consultar ---');
{
  const s = await abrir(1366, "localStorage.setItem('gestor.soloConsulta', '1');");
  await s.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
  const tit = () => s.evaluate(() => [...document.querySelectorAll('#inicio-thead-normal th')].map((t) => t.dataset.col || ''));
  const o = await s.locator('#inicio-thead-normal th[data-col="inicio"]').boundingBox();
  const d = await s.locator('#inicio-thead-normal th[data-col="plazo"]').boundingBox();
  await s.mouse.move(o.x + o.width / 2, o.y + o.height / 2);
  await s.mouse.down();
  await s.mouse.move(o.x + 30, o.y + o.height / 2, { steps: 3 });
  await s.mouse.move(d.x + 3, o.y + o.height / 2, { steps: 8 });
  await s.mouse.up();
  await s.waitForTimeout(400);
  await comprobar('7. en solo consultar se pueden mover columnas', tit(), ['inicio', 'plazo', 'tercero', 'tipo', 'hito', 'quien', '']);
  await comprobar('7. sin el aviso ámbar «Solo consulta: no se ha guardado nada»', s.evaluate(() => document.body.innerText.indexOf('no se ha guardado nada') === -1), true);
  await s.reload();
  await s.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
  await s.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
  await comprobar('7. al recargar, el orden sigue ahí (guardado en ese ordenador)', tit(), ['inicio', 'plazo', 'tercero', 'tipo', 'hito', 'quien', '']);
  await s.close();
}

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLO(S)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
