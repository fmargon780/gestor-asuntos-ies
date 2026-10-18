/* Fila 367 (18-oct-2026, docs/INICIO-ORDENAR-POR-COLUMNA.md): ordenar la lista de Inicio pulsando el
   título de una columna. Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1).

   1. Ya no está el desplegable «Ordenar».
   2. «Tercero»: A→Z con flecha ▲; otra vez, Z→A con ▼; otra columna, ascendente por esa.
   3. «Inicio»: el más antiguo arriba; otra vez, el más reciente.
   4. Al cambiar de pestaña, la nueva sale sin flecha y con su orden de siempre; también al pulsar «Inicio» en el menú.
   5. «Por liquidar» también ordena (Tercero, Por liquidar desde).
   6. «Exportar» saca el orden que se ve (las filas de la tabla son las que se exportan). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const filas = () => pagina.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')].map((t) => t.dataset.asunto));
/* Espera a que la lista de filas deje de cambiar (dos lecturas seguidas iguales). */
async function estable() {
  let antes = JSON.stringify(await filas());
  for (let i = 0; i < 50; i++) {
    await pagina.waitForTimeout(200);
    const ahora = JSON.stringify(await filas());
    if (ahora === antes) return;
    antes = ahora;
  }
}
/* El texto que se compara a ojo: el tercero (sin candado ni lápiz) o el nombre del tipo (sin su número). */
const texto = (col) => pagina.evaluate((c) => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')]
  .map((t) => (t.querySelector(c === 'tercero' ? '.tarjeta-nombre b' : '.marca-tipo') || { textContent: '' }).textContent.trim()), col);
const flechas = () => pagina.evaluate(() => [...document.querySelectorAll('thead:not(.oculto) th .orden-flecha')].map((f) => f.parentElement.dataset.col + f.textContent.trim()));
const alfa = (v) => [...v].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
async function pulsar(sel) { await pagina.click(sel); await estable(); }
async function irAPestana(p) {
  await pagina.click('.inicio-pestana[data-pestana="' + p + '"]');
  await pagina.waitForSelector('.inicio-pestana.activa[data-pestana="' + p + '"]', { timeout: 10000 });
  await estable();
}
const TH = '#inicio-thead-normal th[data-col="';

/* ===== 1. Sin desplegable ===== */
await comprobar('1. ya no está el desplegable «Ordenar»', pagina.locator('#orden-abiertos').count(), 0);
await comprobar('1. al principio no hay flecha en ningún título', flechas(), []);
const antiguosArriba = async () => { const f = (await filas()).map((n) => n.slice(0, 6)); return JSON.stringify(f) === JSON.stringify([...f].sort()); };

/* ===== 2. Tercero ===== */
await pulsar(TH + 'tercero"]');
const asc = await texto('tercero');
await comprobar('2. «Tercero» una vez: de la A a la Z', asc, alfa(asc));
await comprobar('2. con la flecha ▲', flechas(), ['tercero▲']);
await pulsar(TH + 'tercero"]');
const desc = await texto('tercero');
await comprobar('2. «Tercero» otra vez: de la Z a la A', desc, alfa(desc).reverse());
await comprobar('2. con la flecha ▼', flechas(), ['tercero▼']);
await pulsar(TH + 'tipo"]');
const tipos = await texto('tipo');
await comprobar('2. otra columna («Tipo»): ascendente por esa', tipos, alfa(tipos));
await comprobar('2. y la flecha pasa a «Tipo»', flechas(), ['tipo▲']);

/* ===== 3. Inicio ===== */
await pulsar(TH + 'inicio"]');
await comprobar('3. «Inicio» una vez: el más antiguo arriba', antiguosArriba(), true);
await pulsar(TH + 'inicio"]');
const filasDesc = await filas();
const fechas = filasDesc.map((n) => n.slice(0, 6));
await comprobar('3. «Inicio» descendente: las fechas bajan', fechas, [...fechas].sort().reverse());

/* ===== 4. Cambiar de pestaña vuelve al orden de siempre ===== */
await irAPestana('adm');
await comprobar('4. al cambiar de pestaña no hay flecha', flechas(), []);
await pulsar(TH + 'tercero"]');
await comprobar('4. se puede ordenar también en «En Administración»', flechas(), ['tercero▲']);
await irAPestana('todos');
await comprobar('4. y al volver a «Todos los abiertos» no hay flecha', flechas(), []);
await comprobar('4. con el orden de siempre (los más antiguos arriba)', antiguosArriba(), true);
await pulsar(TH + 'tipo"]');
await pagina.click('.pestana[data-pantalla="herramientas"]');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await estable();
await comprobar('4. pulsar «Inicio» en el menú quita el orden', flechas(), []);
await comprobar('4. y deja el orden de siempre', antiguosArriba(), true);

/* ===== 5. Por liquidar ===== */
if (await pagina.locator('.inicio-pestana[data-pestana="liq"]:not(.oculto)').count()) {
  await irAPestana('liq');
  await comprobar('5. «Por liquidar» empieza sin flecha', flechas(), []);
  await pulsar('#inicio-thead-liquidar th[data-col="tercero"]');
  const t1 = await texto('tercero');
  await comprobar('5. «Tercero» ordena de la A a la Z', t1, alfa(t1));
  await comprobar('5. con flecha', flechas(), ['tercero▲']);
  await pulsar('#inicio-thead-liquidar th[data-col="tercero"]');
  const t2 = await texto('tercero');
  await comprobar('5. y otra vez, de la Z a la A', t2, alfa(t2).reverse());
  await comprobar('5. la casilla de la cabecera no ordena', pagina.locator('#inicio-thead-liquidar th.liq-casilla.th-ordenable').count(), 0);
  await irAPestana('todos');
}

/* ===== 6. Exportar saca el orden que se ve ===== */
await pulsar(TH + 'tercero"]');
const vistas = await filas();
await comprobar('6. las filas que se ven (las que sale «Exportar») están en orden de «Tercero»',
  texto('tercero').then((t) => JSON.stringify(t) === JSON.stringify(alfa(t))), true);
await comprobar('6. hay filas', vistas.length > 0, true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
