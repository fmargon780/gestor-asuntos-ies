/* Prueba en navegador de verdad de ordenar Inicio pulsando el título de una columna
   (fila 367, docs/INICIO-ORDENAR-POR-COLUMNA.md): dos pulsaciones por columna, la flecha, el orden
   natural al cambiar de pestaña y al pulsar «Inicio» del menú, «Actualizar» que lo conserva, «Por
   liquidar» y que «Exportar» saca el orden que se ve.

   Mismos asuntos que pruebas/inicio.mjs: A (Uno, vencido, plazo ayer), B (Dos, en espera),
   C (Tres, dormido), D (Cuatro, sin plazo); el orden de inicio es A, B, C, D. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CLAVE_A = '260901 TRASLADO 26-27 Uno Vencido, Ana 1111';
const CLAVE_B = '260902 TRASLADO 26-27 Dos Espera, Bea 2222';
const CLAVE_C = '260903 TRASLADO 26-27 Tres Dormido, Cris 3333';
const CLAVE_D = '260904 TRASLADO 26-27 Cuatro Sinplazo, Dani 4444';
const FECHA_AYER = isoHaceDias(1);
const DESDE_VEINTE = isoHaceDias(20);
const NOTA_VIEJA = new Date(Date.now() - 75 * 86400000).toISOString();

await pagina.evaluate(async ({ CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D, FECHA_AYER, DESDE_VEINTE, NOTA_VIEJA }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE_A, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_B, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_C, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_D, { create: true });
  /* Un papel suelto, de los de "Ha llegado". */
  abiertos._hijos.set('260926 escaneo del director.pdf',
    window.__disco.fich('260926 escaneo del director.pdf', 'un papel'));

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' }]);

  const fAsuntos = await g.getFileHandle('asuntos.json', { create: true });
  const jAsuntos = JSON.parse(await (await fAsuntos.getFile()).text() || '{"asuntos":{}}');
  jAsuntos.asuntos[CLAVE_A] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Vencido, Ana 1111', abiertoPor: 'Francisco', limite: FECHA_AYER };
  jAsuntos.asuntos[CLAVE_B] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Dos Espera, Bea 2222', abiertoPor: 'Francisco' };
  jAsuntos.asuntos[CLAVE_C] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Tres Dormido, Cris 3333', abiertoPor: 'Francisco', notaEl: NOTA_VIEJA };
  jAsuntos.asuntos[CLAVE_D] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Cuatro Sinplazo, Dani 4444', abiertoPor: 'Francisco' };
  await escribir('asuntos.json', jAsuntos);

  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: {
      [CLAVE_A]: { creados: '2026-09-01', hitos: [
        { id: 'a1', titulo: 'Revisar el expediente', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }
      ] },
      [CLAVE_B]: { creados: '2026-09-02', hitos: [
        { id: 'b1', titulo: 'Esperar respuesta de la familia', estado: 'encurso', responsable: 'tutor', desde: DESDE_VEINTE }
      ] },
      [CLAVE_D]: { creados: '2026-09-04', hitos: [
        { id: 'd1', titulo: 'Sin plazo todavía', estado: 'pendiente', responsable: 'administracion' }
      ] }
    }
  });

  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D, FECHA_AYER, DESDE_VEINTE, NOTA_VIEJA });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo');
await pagina.waitForSelector('#tablon');


const orden = () => pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').evaluateAll(f => f.map(x => x.dataset.asunto));
const flecha = () => pagina.locator('.inicio-tabla thead:not(.oculto) th').evaluateAll(h =>
  h.filter(x => x.querySelector('.orden-flecha')).map(x => x.dataset.col + x.querySelector('.orden-flecha').textContent.trim()));
const titulo = (col) => pagina.locator('.inicio-tabla thead:not(.oculto) th[data-col="' + col + '"]');
async function pulsar(col) { await titulo(col).click(); await pagina.waitForTimeout(250); }
async function pestana(p) { await pagina.click('.inicio-pestana[data-pestana="' + p + '"]'); await pagina.waitForTimeout(300); }

console.log('--- 1. «Todos los abiertos»: Tercero, dos pulsaciones ---');
await comprobar('de partida, orden natural (los más antiguos arriba) y sin flecha', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D], []]);
await comprobar('ya no existe el desplegable «Ordenar»', pagina.locator('#orden-abiertos').count(), 0);
await pulsar('tercero');
await comprobar('Tercero: de la A a la Z, con ▲', [await orden(), await flecha()],
  [[CLAVE_D, CLAVE_B, CLAVE_C, CLAVE_A], ['tercero▲']]);
await pulsar('tercero');
await comprobar('otra vez: de la Z a la A, con ▼', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_C, CLAVE_B, CLAVE_D], ['tercero▼']]);

console.log('--- 2. Inicio, Plazo y otra columna ---');
await pulsar('inicio');
await comprobar('Inicio: el más antiguo arriba, con ▲ (empieza otra vez en ascendente)', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D], ['inicio▲']]);
await pulsar('inicio');
await comprobar('Inicio otra vez: el más reciente arriba', await orden(), [CLAVE_D, CLAVE_C, CLAVE_B, CLAVE_A]);
await pulsar('plazo');
await comprobar('Plazo: el que tiene fecha límite arriba, los demás detrás por fecha de inicio', await orden(),
  [CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D]);
await pulsar('plazo');
await comprobar('Plazo al revés: lo que no tiene dato sigue al final, y el desempate no se da la vuelta', await orden(),
  [CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D]);
await pulsar('quien');
await comprobar('Le toca a: Administración antes que Familia, con ▲ en esa columna', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_C, CLAVE_D, CLAVE_B], ['quien▲']]);

console.log('--- 3. Se conserva al actualizar y al buscar; vuelve al cambiar de pestaña y con «Inicio» del menú ---');
await pulsar('tercero');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await comprobar('«Actualizar» conserva el orden', [await orden(), await flecha()],
  [[CLAVE_D, CLAVE_B, CLAVE_C, CLAVE_A], ['tercero▲']]);
await pagina.fill('#buscar-abiertos', 'TRASLADO');
await pagina.waitForTimeout(300);
await comprobar('buscar lo conserva', await orden(), [CLAVE_D, CLAVE_B, CLAVE_C, CLAVE_A]);
await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(300);
await comprobar('«Exportar» saca las filas en el orden que se ve',
  pagina.evaluate(() => ExportarAsuntos.abiertosDeLaVista().map(a => a.nombre)), [CLAVE_D, CLAVE_B, CLAVE_C, CLAVE_A]);
await pestana('adm');
await comprobar('al cambiar de pestaña: la nueva sale con su orden de siempre (el vencido primero), sin flecha',
  [await orden(), await flecha()], [[CLAVE_A, CLAVE_C, CLAVE_D], []]);   /* tras «Actualizar», C también tiene un hito de Administración */
await pulsar('tercero');
await comprobar('«En Administración»: Tercero de la A a la Z', [await orden(), await flecha()], [[CLAVE_D, CLAVE_C, CLAVE_A], ['tercero▲']]);
await pestana('todos');
await comprobar('y al volver a «Todos los abiertos» no queda el orden de antes', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D], []]);
await pulsar('tercero');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(400);
await comprobar('«Inicio» en el menú vuelve al orden de siempre', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D], []]);

console.log('--- 4. «En espera» y «Dormidos»: Plazo ordena por días ---');
await pestana('dorm');
await pulsar('plazo');
await comprobar('«Dormidos»: una fila, con su flecha en Plazo', [await orden(), await flecha()], [[CLAVE_C], ['plazo▲']]);
await pestana('esp');
await comprobar('«En espera»: una fila y sin flecha al cambiar', [await orden(), await flecha()], [[CLAVE_B], []]);

console.log('--- 5. «Por liquidar» ---');
const hayLiq = await pagina.evaluate(async ({ CLAVE_A, CLAVE_B, CLAVE_D }) => {
  /* Tres asuntos «por liquidar desde» fechas distintas, sin tocar el disco. */
  const mapa = { [CLAVE_A]: '2026-09-20', [CLAVE_B]: '2026-09-10', [CLAVE_D]: '2026-09-15' };
  App.E.listaAbiertos.forEach(a => { if (mapa[a.nombre]) a.ficha.porLiquidar = { desde: mapa[a.nombre] }; });
  const t = App.E.tipos.find(x => x.tipo === 'TRASLADO'); if (t) t.liquidar = true;
  return !!(window.PorLiquidar && PorLiquidar.hayTipos());
}, { CLAVE_A, CLAVE_B, CLAVE_D });
await comprobar('hay tipos que liquidar', hayLiq, true);
await pagina.evaluate(() => InicioTabla.pintar());
await pagina.waitForTimeout(400);
await pestana('liq');
await comprobar('«Por liquidar»: orden natural, por «desde»', await orden(), [CLAVE_B, CLAVE_D, CLAVE_A]);
await pulsar('tercero');
await comprobar('«Por liquidar» ordena por Tercero, con ▲', [await orden(), await flecha()],
  [[CLAVE_D, CLAVE_B, CLAVE_A], ['tercero▲']]);
await pulsar('desde');
await pulsar('desde');
await comprobar('«Por liquidar desde» al revés: la más reciente arriba', [await orden(), await flecha()],
  [[CLAVE_A, CLAVE_D, CLAVE_B], ['desde▼']]);
await comprobar('la columna de casillas no ordena',
  pagina.locator('#inicio-thead-liquidar th.liq-casilla').getAttribute('data-col'), null);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
