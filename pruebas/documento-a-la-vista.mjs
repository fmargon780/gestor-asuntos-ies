/* Prueba en navegador de verdad de "Por clasificar": el documento que
   se ve en el panel de la derecha queda marcado en la lista de la
   izquierda (17-sep-2026, fila 25 de la cola,
   docs/POR-CLASIFICAR-DOCUMENTO-A-LA-VISTA.md). Reutiliza el disco de
   mentira de pruebas/navegador.mjs. */
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* Tres documentos sueltos, puestos directamente en el disco. */
await pagina.evaluate(async () => {
  const nombres = ['260901 uno.pdf', '260902 dos.pdf', '260903 tres.pdf'];
  for (const n of nombres) {
    const h = window.__disco.fich(n, 'contenido de ' + n, 'application/pdf');
    window.__disco.abiertos._hijos.set(n, h);
  }
});
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForTimeout(200);
await comprobar('los tres documentos salen en Por clasificar',
  pagina.locator('#lista-sueltos .tarjeta').count(), 3);

function tarjetaDe(nombre) {
  return pagina.locator('#lista-sueltos .tarjeta').filter({ hasText: nombre });
}

console.log('--- abrir el primero ---');
await tarjetaDe('260901 uno.pdf').getByRole('button', { name: 'Abrir' }).click();
await pagina.waitForSelector('#visor-lateral:not(.oculto)');
await comprobar('el visor dice el nombre completo',
  pagina.locator('#visor-nombre').getAttribute('title'), '260901 uno.pdf');
await comprobar('solo su tarjeta queda marcada',
  pagina.locator('#lista-sueltos .tarjeta-abierta').count(), 1);
await comprobar('es la del primero',
  pagina.locator('#lista-sueltos .tarjeta-abierta').getAttribute('data-suelto'), '260901 uno.pdf');
await comprobar('las acciones del panel están: Crear asunto con él',
  pagina.locator('#visor-acciones').getByRole('button', { name: 'Crear asunto con él' }).count(), 1);
await comprobar('y Meter en un asunto',
  pagina.locator('#visor-acciones').getByRole('button', { name: 'Meter en un asunto' }).count(), 1);
await comprobar('y Borrar',
  pagina.locator('#visor-acciones').getByRole('button', { name: 'Borrar' }).count(), 1);
await comprobar('pero no "Abrir" (ya se está viendo)',
  pagina.locator('#visor-acciones').getByRole('button', { name: 'Abrir', exact: true }).count(), 0);

console.log('--- abrir el segundo: la marca se mueve, no se acumula ---');
await tarjetaDe('260902 dos.pdf').getByRole('button', { name: 'Abrir' }).click();
await pagina.waitForTimeout(200);
await comprobar('sigue habiendo solo una tarjeta marcada',
  pagina.locator('#lista-sueltos .tarjeta-abierta').count(), 1);
await comprobar('ahora es la del segundo',
  pagina.locator('#lista-sueltos .tarjeta-abierta').getAttribute('data-suelto'), '260902 dos.pdf');

console.log('--- cerrar el visor: no queda ninguna marcada ---');
await pagina.click('#visor-cerrar');
await pagina.waitForTimeout(100);
await comprobar('el visor se esconde', pagina.locator('#visor-lateral').isHidden(), true);
await comprobar('ninguna tarjeta queda marcada',
  pagina.locator('#lista-sueltos .tarjeta-abierta').count(), 0);

console.log('--- borrar el que se está viendo, desde el propio panel ---');
await tarjetaDe('260903 tres.pdf').getByRole('button', { name: 'Abrir' }).click();
await pagina.waitForSelector('#visor-lateral:not(.oculto)');
await pagina.locator('#visor-acciones').getByRole('button', { name: 'Borrar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('ha desaparecido de la lista, sin recargar',
  pagina.locator('#lista-sueltos .tarjeta').count(), 2);
await comprobar('y el visor se ha cerrado solo, porque ya no está en Por clasificar',
  pagina.locator('#visor-lateral').isHidden(), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
