/* Prueba en navegador de verdad de la fila 30 (docs/QUEDARSE-EN-EL-ASUNTO.md):
   guardar un documento dentro de un asunto no debe echar de la ficha a
   la lista de asuntos abiertos.

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

function pantallas() {
  return pagina.evaluate(() => ({
    asunto: !document.getElementById('pantalla-asunto').classList.contains('oculto'),
    abiertos: !document.getElementById('pantalla-abiertos').classList.contains('oculto')
  }));
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';
const FACTURA = '260911 FACTURA Referencia 123.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.factura, window.__disco.fich(datos.factura, 'la factura original'));
}, { asunto: NOMBRE_ASUNTO, factura: FACTURA });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento');

console.log('--- 1 y 2. guardar un documento dentro del asunto ---');
const NUEVO_DOC = '260911 26EM1234 FACTURA Referencia 123.pdf';
await pagina.evaluate(async (datos) => {
  /* Simula lo que hacen las siete acciones del encargo: un documento
     nuevo aparece en la carpeta y algo llama a App.verAbiertos para
     que la lista se entere (aquí, directamente, sin pasar por el
     cuadro de Registrar: eso ya lo comprueba pruebas/registro.mjs). */
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
  carpeta._hijos.set(datos.nuevo, window.__disco.fich(datos.nuevo, 'ya registrado'));
  await window.App.verAbiertos();
}, { asunto: NOMBRE_ASUNTO, nuevo: NUEVO_DOC });

await comprobar('1. la ficha sigue a la vista tras guardar', pantallas(), { asunto: true, abiertos: false });
await comprobar('2. el documento nuevo aparece en la ficha, sin recargar nada',
  pagina.evaluate((n) => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento'))
    .some((b) => b.textContent.indexOf(n) !== -1), NUEVO_DOC), true);

console.log('--- 3. el repaso automático de la carpeta, con la ficha abierta ---');
await pagina.evaluate(async () => {
  /* Cambia algo a nivel de "Asuntos abiertos" (llega un suelto), que
     es justo lo que dispara el barrido: App.mirarLaCarpeta compara
     con lo que había antes y, si algo cambia, relee entera la lista. */
  window.__disco.abiertos._hijos.set('nuevo-suelto.pdf', window.__disco.fich('nuevo-suelto.pdf', 'algo'));
  await window.App.mirarLaCarpeta();
});
await comprobar('3. sigue en la ficha después del barrido automático', pantallas(), { asunto: true, abiertos: false });
await comprobar('3. la ficha sigue enseñando el mismo asunto',
  pagina.evaluate(() => window.App.fichaAbierta()), NOMBRE_ASUNTO);

console.log('--- 4. Archivar sí devuelve a la lista ---');
/* El asunto se ha creado a mano, sin pasar por el formulario de Nuevo
   asunto: sin categoría/tercero en su ficha, Archivar preguntaría antes
   "¿Dónde va esta carpeta?" (comportamiento de siempre, ajeno a esta
   prueba). Se anota lo que haría falta para ir directo al cuadro de
   confirmar, que es lo que aquí importa. */
await pagina.evaluate(async (nombre) => {
  await window.App.anotar(nombre, { categoria: 'EMPRESAS', tercero: 'Proveedor de Prueba SL 12345678A' });
}, NOMBRE_ASUNTO);
await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('4. archivar devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

await comprobar('sin errores de consola', errores, []);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
