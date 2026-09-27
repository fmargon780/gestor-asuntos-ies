/* Prueba en navegador de verdad de la línea única de avisos (27-sep-
   2026, fila 193, docs/AVISOS-MENU-Y-VOLVER.md, apartado 1):

     - con un asunto vencido y un recurrente pendiente, sale una sola
       franja (#avisos-linea) con dos trozos, separados por " · ";
     - pulsar el trozo de "vencidos" filtra la tabla de "Todos los
       asuntos abiertos" (#filtro-plazo pasa a "vencidos");
     - "Ocultar por hoy" la quita.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, con el
   mismo patrón de escritura directa en _GESTOR que pruebas/inicio.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

const CLAVE = '260901 TRASLADO 26-27 Uno Reves, Ana 1111';
const AYER = isoHaceDias(1);
const HACE_40 = isoHaceDias(40);

await pagina.evaluate(async ({ CLAVE, AYER, HACE_40 }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE, { create: true });
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO' }]);
  await escribir('asuntos.json', {
    asuntos: { [CLAVE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Reves, Ana 1111', limite: AYER } }
  });
  await escribir('recurrentes.json', [
    { id: 'r1', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Uno, SL',
      periodo: 'mensual', dia: 1, ultima: HACE_40, parado: false }
  ]);

  await App.cargarRegistro();
  await App.cargarTipos();
  await window.Recurrentes._cargar();
}, { CLAVE, AYER, HACE_40 });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#avisos-linea:not(.oculto)');
await pagina.waitForSelector('[data-aviso="plazo-vencidos"]');

/* ================= 1. UNA SOLA FRANJA, DOS TROZOS ================= */
console.log('--- 1. una sola franja, con los dos trozos ---');

await comprobar('la franja es roja (hay un vencido)',
  pagina.evaluate(() => document.getElementById('avisos-linea').className.indexOf('aviso-linea-rojo') !== -1),
  true);

await comprobar('sale el trozo de vencidos',
  pagina.locator('[data-aviso="plazo-vencidos"]').textContent(), '1 vencido');

await comprobar('sale el trozo de recurrentes',
  pagina.locator('[data-aviso="recurrentes"]').textContent(),
  '1 asunto que se repite toca crearlo');

await comprobar('hay un separador " · " entre los dos trozos',
  pagina.evaluate(() => document.getElementById('avisos-linea').textContent.indexOf(' · ') !== -1),
  true);

/* ================= 2. PULSAR "VENCIDOS" FILTRA LA TABLA ================= */
console.log('--- 2. pulsar el trozo de vencidos filtra la tabla ---');

await pagina.click('[data-aviso="plazo-vencidos"]');
await comprobar('el filtro de plazo pasa a "vencidos"',
  pagina.inputValue('#filtro-plazo'), 'vencidos');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr');
await comprobar('la tabla enseña el asunto vencido',
  pagina.locator('#inicio-tabla-cuerpo').textContent().then(t => t.indexOf('Ana') !== -1), true);

/* ================= 3. "OCULTAR POR HOY" LA QUITA ================= */
console.log('--- 3. "Ocultar por hoy" quita la franja ---');

await pagina.click('.aviso-linea-ocultar');
await comprobar('la franja desaparece', pagina.locator('#avisos-linea').isHidden(), true);

/* ================= FIN ================= */

if (errores.length) { fallos++; console.log('FALLA  errores de consola:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
