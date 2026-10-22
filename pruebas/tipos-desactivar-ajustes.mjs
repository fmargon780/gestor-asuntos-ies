/* Prueba en navegador de verdad de «Desactivar un tipo» (fila 422, docs/DESACTIVAR-UN-TIPO.md):
   el botón «Desactivar» de la pantalla del tipo (con su pregunta), la tarjeta en gris al final de su
   categoría con «Desactivado», el tipo que ya no sale en Nuevo asunto, el aviso de «ya existe y está
   desactivado» con «Activarlo», y «Activar» (la tarjeta vuelve a su sitio y el tipo vuelve a salir).
   Datos de demostración (disco de mentira de pruebas/navegador.mjs). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
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

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Fila 175: con la ventana ancha la barra nace abierta; se llega
   directo a la pestaña Ajustes. */
await pagina.click('.pestana[data-pantalla="ajustes"]');

/* Los once bloques, abiertos de una vez: no se vuelven a cerrar en el
   resto de la prueba (igual que en pruebas/navegador.mjs). Hay que
   abrirlos antes de que nada dentro pueda ser "visible". */
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');

const nombresVisibles = () => pagina.locator('#tabla-tipos .tarjeta-tipo-nombre').allTextContents();


const zona = pagina.locator('#crear-tipo-zona');
const botonCrear = pagina.locator('#crear-tipo-zona [data-bc="crear"]');


const tarjetas = () => pagina.locator('#tabla-tipos .tarjeta-tipo-nombre').allTextContents();
await pagina.click('.pestana-categoria:has-text("ALUMNADO")');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
const antes = await tarjetas();
await comprobar('MATRICULA sale entre los tipos de ALUMNADO, activo', pagina.evaluate(() => !App.E.tipos.find(t => t.tipo === 'MATRICULA').desactivado), antes.includes('MATRICULA'));
const cuentaAntes = await pagina.locator('.pestana-categoria:has-text("ALUMNADO") .pestana-cuenta').textContent();

console.log('--- 1. Desactivar desde la pantalla del tipo, con pregunta ---');
await pagina.locator('#tabla-tipos .tarjeta-tipo[data-tipo="MATRICULA"]').click({ position: { x: 20, y: 10 } });
await pagina.waitForSelector('#pantalla-tipo-asunto .boton-tipo-desactivar', { state: 'attached' });
await pagina.evaluate(() => { document.querySelectorAll('#pantalla-tipo-asunto details').forEach((d) => { d.open = true; }); });
await comprobar('el botón dice «Desactivar»', pagina.locator('#pantalla-tipo-asunto .boton-tipo-desactivar').textContent(), 'Desactivar');
await pagina.click('#pantalla-tipo-asunto .boton-tipo-desactivar');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('la pregunta dice que seguirán igual y que dejará de salir al crear asuntos nuevos',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => /Seguirán igual|No hay ningún asunto abierto/.test(t) && t.includes('dejará de salir al crear asuntos nuevos')), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => App.E.tipos.find(t => t.tipo === 'MATRICULA').desactivado === true);
await pagina.evaluate(() => { document.querySelectorAll('#pantalla-tipo-asunto details').forEach((d) => { d.open = true; }); });
await pagina.waitForFunction(() => { const b = document.querySelector('#pantalla-tipo-asunto .boton-tipo-desactivar'); return b && b.textContent === 'Activar'; });
await comprobar('el botón pasa a decir «Activar»', pagina.locator('#pantalla-tipo-asunto .boton-tipo-desactivar').textContent(), 'Activar');
await pagina.evaluate(() => App.cerrarTipoDeAsunto());
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');

console.log('--- 2. la tarjeta, en gris y al final ---');
const despues = await tarjetas();
await comprobar('MATRICULA es la última de su categoría', despues[despues.length - 1], 'MATRICULA');
await comprobar('lleva la palabra «Desactivado» y va en gris',
  pagina.locator('#tabla-tipos .tarjeta-tipo[data-tipo="MATRICULA"]').evaluate(t => [t.textContent.includes('Desactivado'), t.classList.contains('tarjeta-tipo-desactivado')]), [true, true]);
await comprobar('el contador de la categoría sigue contando todos',
  pagina.locator('.pestana-categoria:has-text("ALUMNADO") .pestana-cuenta').textContent(), cuentaAntes);

console.log('--- 3. ya no sale al crear un asunto, y el aviso ofrece Activarlo ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await pagina.click('#btn-ver-tipos').catch(() => {});
await comprobar('MATRICULA no está en la parrilla',
  pagina.locator('#tipos-lista .tipo-boton[data-tipo="MATRICULA"]').count(), 0);
await comprobar('y los demás de ALUMNADO siguen: 13', pagina.locator('#tipos-lista .tipo-boton[data-categoria="ALUMNADO"]').count(), 13);
await pagina.fill('#buscar-tipo', 'matricula');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await comprobar('crear MATRICULA avisa de que ya existe y está desactivado',
  pagina.locator('#tipo-al-vuelo-aviso').textContent().then(t => t.includes('Ya existe y está desactivado: MATRICULA')), true);
await comprobar('«Crear» queda apagado y hay «Activarlo»',
  [await pagina.locator('#tipo-al-vuelo-crear').isDisabled(), await pagina.locator('#tipo-al-vuelo-activar').count()], [true, 1]);

console.log('--- 4. Activar vuelve a dejarlo todo como estaba ---');
await pagina.click('#tipo-al-vuelo-activar');
await pagina.waitForFunction(() => !App.E.tipos.find(t => t.tipo === 'MATRICULA').desactivado);
await pagina.waitForFunction(() => App.E.nuevo.tipo === 'MATRICULA');
await comprobar('MATRICULA vuelve a estar elegido en Nuevo asunto', pagina.evaluate(() => App.E.nuevo.tipo), 'MATRICULA');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('.pestana-categoria:has-text("ALUMNADO")');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
const final = await tarjetas();
await comprobar('en Ajustes vuelve a su sitio de antes y sin gris',
  [final.slice().sort(), await pagina.locator('#tabla-tipos .tarjeta-tipo[data-tipo="MATRICULA"]').evaluate(t => t.classList.contains('tarjeta-tipo-desactivado'))], [antes.slice().sort(), false]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
