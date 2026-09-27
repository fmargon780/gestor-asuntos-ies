/* Prueba en navegador de verdad de cuándo se ve el tablón de notas.

   La regla, desde la fila 191 (27-sep-2026, docs/INICIO-CUATRO-
   BLOQUES.md, decisión 4): el tablón NUNCA se esconde, ni a mano ni
   automáticamente. Vive en la cuarta columna de #inicio-rejilla, junto
   a "Ha llegado", "Me toca" y "Esperamos a otros", y sigue ahí se elija
   lo que se elija, se busque lo que se busque, y aunque se abra un
   correo o un documento al lado (la fila de arriba pasa a tres
   columnas y el tablón baja debajo de ellas, pero sin desaparecer).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
/* El ancho del monitor del trabajo. */
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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
const seVeElTablon = () => pagina.locator('#tablon').isVisible();

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez, Ana 1234', { create: true });
  /* y un papel suelto, de los de "Por clasificar" */
  window.__disco.abiertos._hijos.set('escaneo del director.pdf',
    window.__disco.fich('escaneo del director.pdf', 'un papel'));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(700);

await comprobar('al entrar, el tablón está a la vista', seVeElTablon(), true);

console.log('--- cambiando de vista de montón ---');
await pagina.evaluate(() => window.App.irVista('espera'));
await pagina.waitForTimeout(300);
await comprobar('sigue a la vista', seVeElTablon(), true);
await pagina.evaluate(() => window.App.irVista('departamento'));
await pagina.waitForTimeout(300);
await comprobar('y sigue a la vista', seVeElTablon(), true);

console.log('--- buscando ---');
await pagina.fill('#buscar-abiertos', 'perez');
await pagina.waitForTimeout(300);
await comprobar('buscando, sigue a la vista', seVeElTablon(), true);
await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(300);

console.log('--- ya no hay botón para esconderlo a mano (decisión 4 de la fila 191) ---');
await comprobar('no existe "Ocultar el tablón"',
  pagina.getByRole('button', { name: 'Ocultar el tablón' }).count(), 0);
await comprobar('ni "Tablón" a secas (ya no hace falta pedirlo)',
  pagina.getByRole('button', { name: 'Tablón', exact: true }).count(), 0);

console.log('--- yendo a Ajustes y volviendo ---');
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(300);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(400);
await comprobar('al volver, sigue a la vista', seVeElTablon(), true);

console.log('--- con un correo abierto al lado ---');
await pagina.evaluate(() => document.body.classList.add('con-lector'));
await pagina.waitForTimeout(300);
await comprobar('no se esconde: la rejilla pasa a tres columnas', seVeElTablon(), true);
await pagina.evaluate(() => document.body.classList.remove('con-lector'));
await pagina.waitForTimeout(300);
await comprobar('al cerrar el correo, sigue a la vista', seVeElTablon(), true);

console.log('--- abriendo un documento sin clasificar ---');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForTimeout(400);
await comprobar('en "Ver todo" el tablón se sigue viendo', seVeElTablon(), true);
/* "Abrir" vive detrás del menú de tres puntos (fila 36,
   docs/FILAS-QUE-NO-SE-ESTRUJAN.md, 17-sep-2026): hay que abrirlo. */
await pagina.click('#lista-sueltos .fila-menu-btn');
await pagina.locator('#lista-sueltos .fila-menu').getByRole('button', { name: 'Abrir', exact: true }).click();
await pagina.waitForTimeout(600);
await comprobar('con el documento al lado, sigue sin esconderse', seVeElTablon(), true);
await pagina.click('#visor-cerrar').catch(() => {});
await pagina.waitForTimeout(500);
await comprobar('al cerrar el documento, sigue a la vista', seVeElTablon(), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
