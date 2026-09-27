/* Prueba en navegador de verdad de la franja única de avisos de
   Inicio (27-sep-2026, fila 193, docs/AVISOS-MENU-Y-VOLVER.md,
   apartado 1).

   Con un asunto vencido (avisos.js, el "vencidos" de siempre, no el de
   los hitos) y un recurrente pendiente (recurrentes.js):
     - sale una sola franja, debajo de la cabecera de Inicio, con (al
       menos) esos dos trozos y el texto que toca;
     - es roja, porque hay algo vencido;
     - pulsar el trozo de "vencidos" hace lo que hacía su botón de
       antes: filtra la tabla de abajo a solo los vencidos;
     - "Ocultar por hoy" la quita entera;
     - un aviso nuevo que no estaba oculto la hace volver, aunque sea
       el mismo día.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, igual que
   pruebas/inicio.mjs. */
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

const NOMBRE_VENCIDO = '260901 FACTURA Proveedor Vencido, SL B10000001';
const FECHA_AYER = isoHaceDias(1);
const FECHA_RECURRENTE = isoHaceDias(40);

console.log('--- un asunto vencido y un recurrente pendiente ---');
await pagina.evaluate(async ({ NOMBRE_VENCIDO, FECHA_AYER, FECHA_RECURRENTE }) => {
  await window.__disco.abiertos.getDirectoryHandle(NOMBRE_VENCIDO, { create: true });
  await App.anotar(NOMBRE_VENCIDO, {
    estado: 'abierto', tipo: 'FACTURA', categoria: 'EMPRESAS',
    tercero: 'Proveedor Vencido, SL B10000001', abiertoPor: 'Francisco',
    limite: FECHA_AYER
  });

  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('recurrentes.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify([
    /* `ultima` hace 40 días: un mes después de esa fecha (mismo día 1)
       ya ha pasado, así que toca crearlo sea cual sea hoy el día del
       mes en que se ejecute la prueba (mismo patrón que
       pruebas/recurrentes.mjs). */
    { id: 'r1', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Proveedor Recurrente, SL', periodo: 'mensual', dia: 1, ultima: FECHA_RECURRENTE, parado: false }
  ]));
  await w.close();

  await App.verAbiertos();
  await Recurrentes._cargar();
}, { NOMBRE_VENCIDO, FECHA_AYER, FECHA_RECURRENTE });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#avisos-linea:not(.oculto)');

/* ================= 1. UNA SOLA FRANJA, LOS TROZOS QUE TOCAN ================= */

console.log('--- 1. una sola franja, con los trozos que tocan ---');
await comprobar('la franja se ve', pagina.locator('#avisos-linea').isVisible(), true);
await comprobar('hay al menos dos trozos', pagina.locator('.avisos-linea-trozo').count().then((n) => n >= 2), true);
await comprobar('el trozo de vencidos dice "1 vencido"',
  pagina.locator('[data-aviso="vencidos"]').textContent(), '1 vencido');
await comprobar('el trozo de recurrentes dice lo que toca crear',
  pagina.locator('[data-aviso="recurrentes"]').textContent(), '1 asunto que se repite toca crearlo');
await comprobar('la franja es roja: hay algo vencido',
  pagina.locator('#avisos-linea').getAttribute('class').then((c) => c.indexOf('aviso-rojo') !== -1), true);

/* ================= 2. PULSAR "VENCIDOS" FILTRA, COMO SU BOTÓN DE ANTES ================= */

console.log('--- 2. pulsar "vencidos" filtra la tabla, como hacía su botón de antes ---');
await pagina.click('[data-aviso="vencidos"]');
await pagina.waitForTimeout(300);
await comprobar('el filtro de plazo pasa a "vencidos"', pagina.locator('#filtro-plazo').inputValue(), 'vencidos');
await comprobar('la tabla solo enseña un asunto',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 1);
await comprobar('y es el asunto vencido',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().textContent()
    .then((t) => t.indexOf('Proveedor Vencido') !== -1), true);

await pagina.evaluate(() => { document.getElementById('filtro-plazo').value = ''; App.pintarAbiertos(); });
await pagina.waitForTimeout(200);

/* ================= 3. "OCULTAR POR HOY" LA QUITA ================= */

console.log('--- 3. "Ocultar por hoy" quita la franja entera ---');
await pagina.click('#avisos-linea-ocultar');
await pagina.waitForTimeout(200);
await comprobar('la franja desaparece', pagina.locator('#avisos-linea').isHidden(), true);

/* ================= 4. UN AVISO NUEVO LA HACE VOLVER, AUNQUE SEA HOY ================= */

console.log('--- 4. un aviso nuevo que no estaba oculto la hace volver ---');
await pagina.evaluate(() => {
  AvisosLinea.registrar('huerfanas', '1 ficha sin carpeta', false, function () {});
});
await pagina.waitForTimeout(200);
await comprobar('la franja vuelve a salir, aunque sea el mismo día',
  pagina.locator('#avisos-linea').isVisible(), true);
await comprobar('con el trozo nuevo',
  pagina.locator('[data-aviso="huerfanas"]').textContent(), '1 ficha sin carpeta');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
