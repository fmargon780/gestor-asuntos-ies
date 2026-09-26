/* Prueba en navegador de verdad de la fila 119 (docs/TRAS-CADA-ACCION.md):
   adónde lleva la aplicación después de cada acción.

   1. Crear un asunto (formulario «Nuevo asunto») abre su ficha.
   2. «Volver» desde una ficha abierta en «Qué me toca» vuelve a «Qué me toca».
   3. La lista de abiertos conserva la altura tras abrir una ficha y volver.
   4. Reabrir un asunto desde su ficha del ARCHIVO abre su ficha de abierto.
   5. Meter un documento de «Por clasificar» en un asunto deja el aviso con
      «Ir al asunto», y el botón abre la ficha.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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

const visible = (p) => pagina.evaluate((p) => !document.getElementById('pantalla-' + p).classList.contains('oculto'), p);
const nombreDeLaFicha = () => pagina.evaluate(() => (document.querySelector('#pantalla-asunto .ficha-nombre') || {}).textContent || '');

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ============================================================
   1. Crear un asunto abre su ficha
   ============================================================ */
console.log('--- 1. crear un asunto abre su ficha ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Llegada');
await pagina.waitForTimeout(300);
await pagina.getByRole('button', { name: '+ Dar de alta un solicitante' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="Nombre"]', 'Llegada Prueba, Eva');
await pagina.fill('.alta-campo[data-campo="Nº Id. Escolar"]', '4441119');
await pagina.click('#cuadro-aceptar');
/* Fila 173, punto 3: dar de alta deja el tercero elegido, sin pulsar
   ningún resultado. */
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-10');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 10000 });
await comprobar('1. se ve la ficha, no la lista', visible('abiertos'), false);
await comprobar('1. es la ficha del recién creado', nombreDeLaFicha().then((t) => t.indexOf('Llegada Prueba, Eva') !== -1), true);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('1. «Volver» desde ahí lleva a Asuntos abiertos, no al formulario', visible('abiertos'), true);

/* ============================================================
   2. Volver a «Qué me toca»
   ============================================================ */
console.log('--- 2. volver a «Qué me toca» ---');
await pagina.evaluate(() => App.ir('que-me-toca'));
await pagina.evaluate(() => { App.abrirFicha(App.E.listaAbiertos[0], 'abierto'); });
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(150);
await comprobar('2. vuelve a «Qué me toca»', visible('que-me-toca'), true);
await comprobar('2. y no a la lista', visible('abiertos'), false);

/* ============================================================
   3. La lista conserva la altura
   ============================================================ */
console.log('--- 3. la lista conserva la altura ---');
await pagina.evaluate(async () => {
  for (let i = 10; i < 70; i++) {
    await window.__disco.abiertos.getDirectoryHandle('2609' + i + ' CONSULTA Relleno Número ' + i, { create: true });
  }
  App.ir('abiertos');
  await App.verAbiertos();
});
await pagina.waitForTimeout(200);
const alto = await pagina.evaluate(() => { window.scrollTo(0, 1200); return window.scrollY; });
await comprobar('3. la lista es lo bastante larga para bajar', alto > 600, true);
await pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre.indexOf('Número 40') !== -1)[0];
  App.abrirFicha(a, 'abierto');
});
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(150);
/* Unos pocos píxeles de margen: la cabecera fija se encoge o no según la altura. */
const cerca = (y) => Math.abs(y - alto) <= 12;
await comprobar('3. al volver, la misma altura', pagina.evaluate(() => window.scrollY).then(cerca), true);
await pagina.evaluate(() => App.pintarAbiertos());
await comprobar('3. y repintar la lista no la sube arriba', pagina.evaluate(() => window.scrollY).then(cerca), true);
await pagina.evaluate(() => window.scrollTo(0, 0));

/* ============================================================
   4. Reabrir abre la ficha abierta
   ============================================================ */
console.log('--- 4. reabrir abre la ficha de asunto abierto ---');
const ARCHIVADO = '260801 MATRICULA 26-27 Vuelta Prueba, Iván 3332221';
await pagina.evaluate(async (nombre) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle('Vuelta Prueba, Iván 3332221', { create: true });
  const handle = await ter.getDirectoryHandle(nombre, { create: true });
  App.abrirFicha({ nombre, handle, padre: ter, leido: Nombres.leer(nombre, App.E.tipos),
    ficha: { categoria: 'ALUMNADO', tercero: 'Vuelta Prueba, Iván 3332221', estado: 'cerrado' } }, 'archivado');
}, ARCHIVADO);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.getByRole('button', { name: 'Reabrir el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).waitFor({ timeout: 10000 });
await comprobar('4. sigue en la ficha', visible('asunto'), true);
await comprobar('4. es la del asunto reabierto', nombreDeLaFicha().then((t) => t.indexOf('Vuelta Prueba') !== -1), true);
await comprobar('4. no ha ido a la lista del ARCHIVO', visible('archivo'), false);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(150);
await comprobar('4. «Volver» lleva a Asuntos abiertos', visible('abiertos'), true);

/* ============================================================
   5. Meter un documento suelto: aviso con «Ir al asunto»
   ============================================================ */
console.log('--- 5. «Ir al asunto» tras meter un documento ---');
const DESTINO = await pagina.evaluate(() => App.E.listaAbiertos.filter((x) => x.nombre.indexOf('Llegada Prueba') !== -1)[0].nombre);
await pagina.evaluate(async () => {
  const h = await window.__disco.abiertos.getFileHandle('suelto de prueba.pdf', { create: true });
  const w = await h.createWritable(); await w.write('%PDF-1.4 prueba'); await w.close();
});
const metido = pagina.evaluate((destino) => App.llevarSueltoA({ nombre: 'suelto de prueba.pdf' }, destino, {}), DESTINO);
/* El cuadro de ponerle nombre se abre encima: se cierra sin cambiar nada. */
await pagina.waitForSelector('#capa:not(.oculto)', { timeout: 10000 });
await pagina.click('#cuadro-aceptar');
await metido;
await pagina.locator('.mensaje-boton', { hasText: 'Ir al asunto' }).waitFor({ timeout: 5000 });
await comprobar('5. el aviso lleva «Ir al asunto»', pagina.locator('.mensaje-boton').count().then((n) => n >= 1), true);
await comprobar('5. mientras tanto, se queda donde estaba', visible('asunto'), false);
await pagina.locator('.mensaje-boton', { hasText: 'Ir al asunto' }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('5. el botón abre la ficha de ese asunto', nombreDeLaFicha().then((t) => t.indexOf('Llegada Prueba, Eva') !== -1), true);
await comprobar('5. y el aviso se cierra', pagina.locator('.mensaje-boton').count(), 0);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
