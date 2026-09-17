/* Prueba en navegador de verdad de la fila 36 (docs/FILAS-QUE-NO-SE-ESTRUJAN.md):
   las filas con texto y botones no se estrujan en pantalla estrecha, el
   menú de tres puntos funciona, y la barra se pliega sola al abrir un
   documento.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
/* Una ventana normal de portátil: el fallo del encargo no hacía falta
   una pantalla estrecha para verse, bastaba con abrir el panel de la
   derecha (visor o lector), que le quita a la zona de trabajo casi la
   mitad del ancho. */
const pagina = await navegador.newPage({ viewport: { width: 1100, height: 850 } });
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
async function comprobarCierto(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba de Filas Estrechas SL 12345678A';
const DOCUMENTO = '260911 26EM1234 SOLICITUD DE CERTIFICADO ACADEMICO OFICIAL COMPLETO PARA TRASLADO DE EXPEDIENTE.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- 4. con la barra plegada (nace así), sin tope de ancho ---');
await comprobar('4. .aplicacion nace con la barra plegada',
  pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), true);
await comprobar('4. .contenido no tiene tope de ancho',
  pagina.evaluate(() => getComputedStyle(document.querySelector('.contenido')).maxWidth), 'none');

await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.doc, window.__disco.fich(datos.doc, '%PDF-1.4 de mentira'));
}, { asunto: NOMBRE_ASUNTO, doc: DOCUMENTO });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');
/* Deja que js/copiar.js termine de meter su botón en el menú, para que
   no cambie nada de tamaño mientras se mide. */
await pagina.waitForSelector('.ficha-documento[data-con-copiar]');

console.log('--- 2. el menú de tres puntos ---');
await pagina.click('#ficha-documentos .menu-acciones .boton-menu');
await pagina.waitForSelector('#ficha-documentos .menu-acciones-lista:not(.oculto)');
await comprobarCierto('2. el menú ofrece Separar, Unir, Sacar páginas, Copiar y Borrar',
  pagina.evaluate(() => {
    const textos = Array.from(document.querySelectorAll('#ficha-documentos .menu-acciones-lista button'))
      .map((b) => b.textContent.trim());
    return ['Copiar', 'Separar', 'Unir', 'Sacar páginas', 'Borrar'].every((t) => textos.indexOf(t) !== -1);
  }));
await pagina.locator('#ficha-documentos').getByRole('button', { name: 'Borrar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('2. Borrar, dentro del menú, llama a lo mismo que antes (el cuadro de la papelera)',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent), '¿Mandar a la papelera?');
await comprobarCierto('2. el menú se ha cerrado solo al elegir Borrar',
  pagina.evaluate(() => document.querySelector('#ficha-documentos .menu-acciones-lista').classList.contains('oculto')));
await pagina.click('#cuadro-cancelar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- 3. la barra se pliega sola al abrir el visor ---');
await pagina.click('#btn-barra');
await comprobar('3. la barra queda abierta', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), false);
await pagina.click('#ficha-documentos .ficha-documento');
await pagina.waitForSelector('body.con-visor');
await comprobar('3. al abrir el visor, la barra se pliega sola', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), true);

console.log('--- 1. la fila envuelve, con el panel de la derecha abierto ---');
const medidas = await pagina.evaluate(() => {
  const fila = document.querySelector('#ficha-documentos .ficha-documento-fila');
  const boton = fila.querySelector('.ficha-documento');
  return { anchoBoton: boton.getBoundingClientRect().width, altoFila: fila.getBoundingClientRect().height };
});
await comprobarCierto('1. el botón del nombre mide más de 200px de ancho', medidas.anchoBoton > 200);
await comprobarCierto('1. la fila no pasa de dos líneas de alto (menos de 180px)', medidas.altoFila < 180);

await pagina.evaluate(() => window.Visor.cerrar());
await pagina.waitForFunction(() => !document.body.classList.contains('con-visor'));
await comprobar('3. al cerrarlo, la barra vuelve a abrirse', pagina.evaluate(() => document.getElementById('aplicacion').classList.contains('barra-plegada')), false);

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
