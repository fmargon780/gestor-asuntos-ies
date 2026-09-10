/* Prueba en navegador de verdad de cuándo se ve el tablón de notas.

   La regla, dicha por él: al entrar y al volver a Asuntos abiertos
   tiene que estar desplegado. Si no se ve, no se mira. Solo se quita
   cuando hay algo abierto en el panel de la derecha y no cabe.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch();
/* El ancho del monitor del trabajo. Importa: en una pantalla más
   estrecha el panel de la derecha ya deja la zona de trabajo por debajo
   de 900 y el tablón se quita solo por CSS, así que el fallo de verdad
   —que el visor de documentos no contaba— no se vería. */
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

await comprobar('al entrar, el tablón está desplegado', seVeElTablon(), true);

console.log('--- eligiendo una de las tres tarjetas ---');
await pagina.click('.panel[data-vista="espera"]');
await pagina.waitForTimeout(300);
await comprobar('sigue desplegado', seVeElTablon(), true);
await pagina.click('.panel[data-vista="departamento"]');
await pagina.waitForTimeout(300);

console.log('--- buscando ---');
await pagina.fill('#buscar-abiertos', 'perez');
await pagina.waitForTimeout(300);
await comprobar('buscando, sigue desplegado', seVeElTablon(), true);
await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(300);

console.log('--- escondiéndolo a mano ---');
await pagina.getByRole('button', { name: 'Ocultar el tablón' }).click();
await pagina.waitForTimeout(300);
await comprobar('se esconde', seVeElTablon(), false);
await comprobar('y no se vuelve a abrir solo', seVeElTablon(), false);

console.log('--- yendo a Ajustes y volviendo ---');
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(300);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(400);
await comprobar('al volver, vuelve a estar desplegado', seVeElTablon(), true);

console.log('--- con un correo abierto al lado ---');
await pagina.evaluate(() => document.body.classList.add('con-lector'));
await pagina.waitForTimeout(300);
await comprobar('se quita, que no cabe', seVeElTablon(), false);
await pagina.evaluate(() => document.body.classList.remove('con-lector'));
await pagina.waitForTimeout(300);
await comprobar('al cerrar el correo, vuelve', seVeElTablon(), true);

console.log('--- abriendo un documento sin clasificar ---');
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForTimeout(400);
await comprobar('en Por clasificar el tablón se ve', seVeElTablon(), true);
await pagina.getByRole('button', { name: 'Abrir', exact: true }).click();
await pagina.waitForTimeout(600);
await comprobar('con el documento al lado, se quita', seVeElTablon(), false);
await pagina.click('#visor-cerrar').catch(() => {});
await pagina.waitForTimeout(500);
await comprobar('al cerrar el documento, vuelve', seVeElTablon(), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
