/* Prueba en navegador de verdad de las tarjetas por tipo de asunto.
   Reutiliza el disco de mentira de pruebas/navegador.mjs.

   Nació de un fallo que jsdom no podía cazar: `App.elegirTipo` ya
   existía en js/asuntos-nuevo.js, que se carga después, así que la
   función de las tarjetas se perdía y al pulsarlas no pasaba nada.
   Con la aplicación entera cargada, sale a la primera. */
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

/* Cuatro asuntos de tres tipos, puestos directamente en el disco. */
await pagina.evaluate(async () => {
  const nombres = [
    '260901 MATRICULA 26-27 Aguilar Ponce, Marina 1140233',
    '260902 MATRICULA 26-27 Bermúdez Ortiz, Álvaro 1140501',
    '260903 COMPRA Papelería SL B12345678',
    '260904 SANCION 26-27 Trujillo Sanz, Hugo 1120044'
  ];
  for (const n of nombres) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
});
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(600);

await pagina.click('.panel[data-vista="departamento"]');
await pagina.waitForTimeout(300);

await comprobar('los cuatro asuntos salen', pagina.locator('#lista-abiertos .tarjeta').count(), 4);
await comprobar('la fila de tipos se ve', pagina.locator('#grupos-tipo').isVisible(), true);
await comprobar('hay cuatro tarjetas (Todos + tres tipos)',
  pagina.locator('#grupos-tipo .grupo').count(), 4);
await comprobar('los rótulos',
  pagina.locator('#grupos-tipo .grupo-nombre').allTextContents(),
  ['Todos', 'MATRICULA', 'COMPRA', 'SANCION']);

console.log('--- pulsando MATRICULA ---');
await pagina.click('#grupos-tipo .grupo[data-tipo="MATRICULA"]');
await pagina.waitForTimeout(300);
await comprobar('la lista se queda con dos', pagina.locator('#lista-abiertos .tarjeta').count(), 2);
await comprobar('la tarjeta queda marcada',
  pagina.locator('#grupos-tipo .grupo[data-tipo="MATRICULA"]').getAttribute('class'), 'grupo activo');

console.log('--- volviendo a pulsarla ---');
await pagina.click('#grupos-tipo .grupo[data-tipo="MATRICULA"]');
await pagina.waitForTimeout(300);
await comprobar('vuelven los cuatro', pagina.locator('#lista-abiertos .tarjeta').count(), 4);

console.log('--- pulsando COMPRA ---');
await pagina.click('#grupos-tipo .grupo[data-tipo="COMPRA"]');
await pagina.waitForTimeout(300);
await comprobar('la lista se queda con uno', pagina.locator('#lista-abiertos .tarjeta').count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
