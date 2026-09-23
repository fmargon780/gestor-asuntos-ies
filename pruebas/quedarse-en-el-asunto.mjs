/* Prueba en navegador de verdad de la fila 30 (docs/QUEDARSE-EN-EL-ASUNTO.md)
   y de la fila 93 (docs/QUEDARSE-EN-EL-ASUNTO-SIEMPRE.md): de la ficha de
   un asunto solo se sale en cuatro casos —Volver/Escape, Editar,
   Archivar/Reabrir y Borrar— y un quinto que no es una acción de
   Francisco: el asunto ha dejado de estar abierto desde el otro
   ordenador. Cualquier otra cosa —guardar un documento, el repaso
   automático de la carpeta, marcar un hito, asociar o apuntar un
   documento a un hito, comunicar, "Documentos ▾", o meter en este mismo
   asunto un documento suelto desde "Por clasificar"— deja la ficha
   donde estaba.

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
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

function pantallas() {
  return pagina.evaluate(() => ({
    asunto: !document.getElementById('pantalla-asunto').classList.contains('oculto'),
    abiertos: !document.getElementById('pantalla-abiertos').classList.contains('oculto')
  }));
}
async function elUltimoAviso() {
  return pagina.locator('#mensajes .mensaje').last().textContent();
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';
const FACTURA = '260911 FACTURA Referencia 123.pdf';
const TITULO_HITO = 'Revisar la factura';

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
  /* Un hito ya puesto, antes de entrar por primera vez en la ficha:
     así el panel de hitos lo pinta solo, sin tener que pedirle un
     repintado aparte desde fuera. */
  await window.Hitos.anadirHito(datos.asunto, datos.titulo);
  /* El asunto se ha creado a mano, sin pasar por el formulario de
     Nuevo asunto: sin esto, no tiene ninguna entrada en el registro
     (asuntos.json) y "Elegir el asunto" (paso 10) no lo encontraría al
     buscar. anotar con un objeto vacío solo lo da de alta, sin
     categoría ni tercero: eso lo pone el paso 11, justo antes de
     archivar. */
  await window.App.anotar(datos.asunto, {});
}, { asunto: NOMBRE_ASUNTO, factura: FACTURA, titulo: TITULO_HITO });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento');
await pagina.waitForSelector('#ficha-guia .hito');

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

console.log('--- 4. marcar un hito como hecho ---');
await pagina.locator('#ficha-guia .hito .hito-casilla').first().click();
await pagina.waitForSelector('#ficha-guia .hito.hito-hecho');
await comprobar('4. marcar un hito como hecho no saca de la ficha', pantallas(), { asunto: true, abiertos: false });

console.log('--- 5. asociar un documento a un hito, desde el propio documento ---');
const filaDelDoc = pagina.locator('.ficha-documento-fila', {
  has: pagina.locator('.ficha-documento', { hasText: NUEVO_DOC })
});
await filaDelDoc.locator('.ficha-documento-asociar').click();
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await pagina.getByRole('button', { name: TITULO_HITO, exact: true }).click();
await pagina.waitForSelector('.ficha-documento-hito');
await comprobar('5. asociar un documento a un hito no saca de la ficha', pantallas(), { asunto: true, abiertos: false });
await comprobar('5. el documento enseña ya el hito debajo de su nombre',
  filaDelDoc.locator('.ficha-documento-hito').textContent(), TITULO_HITO);

console.log('--- 6. apuntar un documento a un hito, desde el propio hito ---');
const laFilaDelHito = pagina.locator('#ficha-guia .hito').first();
await laFilaDelHito.locator('.hito-desplegar').click();
await pagina.waitForSelector('.hito-anadir-documento:not(.oculto)');
await laFilaDelHito.locator('.hito-anadir-documento').click();
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Uno que ya está en la carpeta' }).click();
await pagina.waitForSelector('#hitosdoc-lista');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('6. apuntar un documento a un hito no saca de la ficha', pantallas(), { asunto: true, abiertos: false });

console.log('--- 7. comunicar: abrir y cerrar el cuadro de correo ---');
await pagina.click('.boton-comunicar');
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await pagina.getByRole('button', { name: 'Correo electrónico', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro de correo se llama como toca',
  pagina.locator('#cuadro-titulo').textContent(), 'Correo de este asunto');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('7. comunicar no saca de la ficha', pantallas(), { asunto: true, abiertos: false });

console.log('--- 8. "Documentos ▾": abrir y cerrar el cuadro de la carpeta ---');
await pagina.click('.ficha-documentos-gestionar');
await pagina.waitForSelector('#doc-cuerpo');
await comprobar('el cuadro de documentos se llama como el asunto',
  pagina.locator('#cuadro-titulo').textContent(), NOMBRE_ASUNTO);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('8. "Documentos ▾" no saca de la ficha', pantallas(), { asunto: true, abiertos: false });

console.log('--- 9. Volver SÍ devuelve a la lista ---');
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('9. Volver devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

console.log('--- 10. "Meter en un asunto" hacia el mismo asunto que tenía la ficha, desde Por clasificar ---');
const SUELTO = 'Escrito para el proveedor de prueba.pdf';
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.evaluate((nombre) => {
  window.__disco.abiertos._hijos.set(nombre, window.__disco.fich(nombre, 'un escrito cualquiera'));
}, SUELTO);
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await pagina.locator('.tarjeta-suelto', { hasText: SUELTO })
  .getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#enlace-todos');
await pagina.fill('#enlace-buscar', 'Proveedor de Prueba');
await pagina.waitForTimeout(300);
await pagina.locator('.enlace-asunto', { hasText: 'Proveedor de Prueba' }).first().click();
await pagina.waitForSelector('#cuadro-titulo');
await comprobar('se abre el cuadro de documentos del asunto de destino',
  pagina.locator('#cuadro-titulo').textContent(), NOMBRE_ASUNTO);
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('10. "Meter en un asunto" no lleva de vuelta a la ficha de ese asunto',
  pantallas(), { asunto: false, abiertos: true });

console.log('--- 11. Archivar SÍ devuelve a la lista ---');
/* El asunto se ha creado a mano, sin pasar por el formulario de Nuevo
   asunto: sin categoría/tercero en su ficha, Archivar preguntaría antes
   "¿Dónde va esta carpeta?" (comportamiento de siempre, ajeno a esta
   prueba). Se anota lo que haría falta para ir directo al cuadro de
   confirmar, que es lo que aquí importa. */
await pagina.evaluate(async (nombre) => {
  await window.App.anotar(nombre, { categoria: 'EMPRESAS', tercero: 'Proveedor de Prueba SL 12345678A' });
}, NOMBRE_ASUNTO);
await pagina.click('.panel[data-vista="departamento"]');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('11. archivar devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

/* ============================================================
   Un segundo asunto, sin documentos, para Escape, Editar y Borrar:
   los tres necesitan que la ficha esté abierta de nuevo cada vez, y
   Borrar se lo lleva por delante del todo al final.
   ============================================================ */
const SEGUNDO_ASUNTO = '260913 PERMISO Persona De Prueba Segunda 998X';

await pagina.evaluate(async (nombre) => {
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
}, SEGUNDO_ASUNTO);
await pagina.click('#btn-recargar');
await pagina.locator('#lista-abiertos .tarjeta', { hasText: 'PERMISO' }).first().waitFor();

async function abrirSegundoAsunto() {
  await pagina.click('#btn-recargar');
  await pagina.locator('#lista-abiertos .tarjeta', { hasText: SEGUNDO_ASUNTO })
    .locator('.nombre-pulsable').click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
}

console.log('--- 12. Escape SÍ devuelve a la lista ---');
await abrirSegundoAsunto();
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('12. Escape devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

console.log('--- 13. Editar SÍ devuelve a la lista (aunque se cancele el cuadro) ---');
await abrirSegundoAsunto();
await pagina.click('.ficha-nombre-menu-boton');
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await pagina.getByRole('button', { name: 'Editar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro de editar se llama como toca',
  pagina.locator('#cuadro-titulo').textContent(), 'Editar el asunto');
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('13. Editar devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

console.log('--- 14. Borrar SÍ devuelve a la lista ---');
await abrirSegundoAsunto();
await pagina.click('.ficha-nombre-menu-boton');
await pagina.waitForSelector('.ficha-menu:not(.oculto)');
await pagina.getByRole('button', { name: 'Borrar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('14. Borrar devuelve a la lista de asuntos abiertos', pantallas(), { asunto: false, abiertos: true });

/* ============================================================
   Un tercer asunto, para el quinto caso: no es una acción de
   Francisco, es que el asunto ha dejado de estar abierto desde el
   otro ordenador.
   ============================================================ */
console.log('--- 15. el asunto deja de estar abierto desde el otro ordenador ---');
const TERCER_ASUNTO = '260914 CONSULTA Fantasma De Prueba';
await pagina.evaluate(async (nombre) => {
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
}, TERCER_ASUNTO);
await pagina.click('#btn-recargar');
await pagina.locator('#lista-abiertos .tarjeta', { hasText: TERCER_ASUNTO }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');

await pagina.evaluate(async (nombre) => {
  /* El otro ordenador lo ha archivado o borrado: la carpeta ya no
     está en Asuntos abiertos cuando se vuelve a leer la lista. */
  window.__disco.abiertos._hijos.delete(nombre);
  await window.App.verAbiertos();
}, TERCER_ASUNTO);
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('15. sin el asunto ya no está, se vuelve a la lista', pantallas(), { asunto: false, abiertos: true });
await comprobarQue('15. con un aviso de que ya no está',
  (await elUltimoAviso()).indexOf('ya no está en Asuntos abiertos') !== -1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
