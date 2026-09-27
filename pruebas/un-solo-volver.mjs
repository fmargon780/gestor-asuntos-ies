/* Prueba en navegador de verdad de "un solo Volver" (27-sep-2026, fila
   194, docs/AVISOS-MENU-Y-VOLVER.md, apartados 3 y 4):

     - todas las pantallas usan el mismo mecanismo que ya usa la ficha
       (js/navegacion.js): «← Volver» (y Escape) vuelve a la pantalla
       de la que se vino, no siempre a "Asuntos abiertos". Se prueba
       yendo del Archivo a Cuentas: «Volver» tiene que volver al
       Archivo, no a Inicio;
     - Inicio no lleva botón «← Volver»;
     - la mesa del hito tiene su propio «← Volver a los hitos», que
       hace lo mismo que el primer Escape ahí (cierra la mesa, deja la
       tarjeta Hitos en grande).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= 1. INICIO NO LLEVA "VOLVER" ================= */
console.log('--- 1. Inicio no lleva botón "Volver" ---');

await comprobar('sin "← Volver" dentro de la cabecera de Inicio',
  pagina.locator('#pantalla-abiertos .cabecera .boton-volver').count(), 0);

/* ================= 2. DEL ARCHIVO A CUENTAS, Y VUELTA AL ARCHIVO ================= */
console.log('--- 2. de Cuentas se vuelve al Archivo, no siempre a Inicio ---');

await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.waitForSelector('#pantalla-archivo:not(.oculto)');

await pagina.click('#pestana-cuentas');
await pagina.waitForSelector('#pantalla-cuentas:not(.oculto)');
await comprobar('Cuentas lleva su "← Volver"',
  pagina.locator('#cuentas-volver').textContent(), '← Volver');

await pagina.click('#cuentas-volver');
await pagina.waitForSelector('#pantalla-archivo:not(.oculto)');
await comprobar('ha vuelto al Archivo, no a Inicio',
  pagina.locator('#pantalla-abiertos').evaluate((el) => el.classList.contains('oculto')), true);

/* Desde Inicio, Cuentas y Volver sí lleva a Inicio (el origen de verdad). */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.click('#pestana-cuentas');
await pagina.waitForSelector('#pantalla-cuentas:not(.oculto)');
await pagina.click('#cuentas-volver');
await comprobar('desde Inicio, Cuentas vuelve a Inicio',
  pagina.locator('#pantalla-abiertos:not(.oculto)').count(), 1);

/* ================= 3. LA MESA DEL HITO TIENE SU "VOLVER A LOS HITOS" ================= */
console.log('--- 3. la mesa del hito tiene "← Volver a los hitos" ---');

const CLAVE = '260901 TRASLADO 26-27 Uno Reves, Ana 1111';

await pagina.evaluate(async ({ CLAVE }) => {
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
    asuntos: { [CLAVE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Reves, Ana 1111' } }
  });
  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: { [CLAVE]: { creados: '2026-09-01', hitos: [
      { id: 'h1', titulo: 'Pedir papeles', estado: 'pendiente', responsable: 'administracion' }
    ] } }
  });
  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr');
await pagina.locator('.tarjeta-nombre', { hasText: 'Uno Reves' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);

await pagina.locator('#ficha-guia .hito[data-id="h1"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="h1"]');

await comprobar('la mesa lleva "← Volver a los hitos"',
  pagina.locator('.hito-en-mesa .mesa-volver').textContent(), '← Volver a los hitos');

await pagina.click('.hito-en-mesa .mesa-volver');
await comprobar('la mesa se cierra',
  pagina.locator('#ficha-guia.con-mesa').count(), 0);
await comprobar('la tarjeta Hitos se queda en grande',
  pagina.evaluate(() => FichaTarjetas.abierta()), 'hitos');

/* ================= FIN ================= */

if (errores.length) { fallos++; console.log('FALLA  errores de consola:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
