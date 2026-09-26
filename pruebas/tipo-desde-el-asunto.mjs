/* Prueba en navegador de verdad de "+ Crear tipo nuevo" en Nuevo
   asunto (fila 128, docs/TIPO-DESDE-EL-ASUNTO.md). Reutiliza el disco
   de mentira de pruebas/navegador.mjs, igual que pruebas/tipos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
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

async function tiposEnDisco(nombre) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('tipos.json');
    const t = JSON.parse(await (await h.getFile()).text());
    return t.filter(x => x.tipo === n);
  }, nombre);
}

/* --- entrar, sin RegAlum ni personal: esta prueba no busca terceros de verdad --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- categoría ALUMNADO, sin texto: el botón discreto al final de la parrilla ---');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#tipos-lista .tipo-boton');
await comprobar('salen los 14 tipos de partida de ALUMNADO',
  pagina.locator('#tipos-lista .tipo-boton').count(), 14);
await comprobar('el botón "+ Crear tipo nuevo" está, discreto, dentro de la parrilla',
  pagina.locator('#tipos-lista #btn-crear-tipo-al-vuelo').count(), 1);
await comprobar('discreto: sin la clase de botón destacado',
  pagina.locator('#btn-crear-tipo-al-vuelo').evaluate(b => b.className), 'enlace');

console.log('--- se escribe en el buscador: el botón pasa a destacado, debajo de la caja ---');
await pagina.fill('#buscar-tipo', 'evacuacion');
await comprobar('ya no está dentro de la parrilla',
  pagina.locator('#tipos-lista #btn-crear-tipo-al-vuelo').count(), 0);
await comprobar('está justo después del buscador',
  pagina.evaluate(() => {
    const caja = document.querySelector('.buscador-tipos');
    return caja.nextElementSibling && caja.nextElementSibling.contains(document.getElementById('btn-crear-tipo-al-vuelo'));
  }), true);
await comprobar('destacado: con la clase de botón de verdad',
  pagina.locator('#btn-crear-tipo-al-vuelo').evaluate(b => b.className), 'boton');

console.log('--- crear el tipo: nombre relleno en mayúsculas, categoría puesta ---');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await comprobar('el nombre viene de lo escrito en el buscador, en mayúsculas',
  pagina.locator('#tipo-al-vuelo-nombre').inputValue(), 'EVACUACION');
await comprobar('la categoría es la elegida',
  pagina.locator('#tipo-al-vuelo-categoria').inputValue(), 'ALUMNADO');
await pagina.fill('#tipo-al-vuelo-corto', 'evac');
await pagina.click('#tipo-al-vuelo-crear');
await pagina.waitForSelector('#tipo-al-vuelo-panel.oculto', { state: 'attached' });

await comprobar('el tipo se ha guardado, con su nombre corto',
  tiposEnDisco('EVACUACION'), [{ tipo: 'EVACUACION', categoria: 'ALUMNADO', nombreCorto: 'EVAC' }]);
await comprobar('queda elegido en Nuevo asunto',
  pagina.evaluate(() => App.E.nuevo.tipo), 'EVACUACION');
await comprobar('su botón sale marcado en la parrilla',
  pagina.locator('#tipos-lista .tipo-boton.elegido').textContent(), 'EVACUACION');
await comprobar('se pasa solo al bloque de elegir tercero',
  pagina.locator('#bloque-tercero').isHidden(), false);
await comprobar('aviso verde de que se ha creado',
  pagina.locator('#mensajes .mensaje').last().textContent()
    .then(t => t.indexOf('Tipo creado') !== -1), true);

console.log('--- un nombre repetido no se duplica: ofrece usar el que ya hay ---');
await pagina.fill('#buscar-tipo', 'matricula');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await comprobar('avisa de que ya existe',
  pagina.locator('#tipo-al-vuelo-aviso').textContent().then(t => t.indexOf('Ya existe: MATRICULA') !== -1), true);
await comprobar('"Crear" queda apagado',
  pagina.locator('#tipo-al-vuelo-crear').isDisabled(), true);
await pagina.click('#tipo-al-vuelo-usar-existente');
await pagina.waitForSelector('#tipo-al-vuelo-panel.oculto', { state: 'attached' });
await comprobar('no se ha duplicado', tiposEnDisco('MATRICULA').then(l => l.length), 1);
await comprobar('queda elegido el que ya había',
  pagina.evaluate(() => App.E.nuevo.tipo), 'MATRICULA');

console.log('--- no se pierde lo escrito al crear un tipo distinto ya con tercero y texto ---');
/* Se simula un tercero ya elegido y una descripción ya escrita, sin
   pasar por el buscador de terceros (ya probado en otras pruebas):
   lo que aquí se comprueba es que App.marcarTipoElegido, a diferencia
   de App.elegirTipo, no los toca. */
await pagina.evaluate(() => {
  App.E.nuevo.tercero = { nombre: 'Aguilar Ponce, Marina', categoria: 'ALUMNADO', campos: {} };
  document.getElementById('bloque-tercero').classList.remove('oculto');
  document.getElementById('bloque-detalles').classList.remove('oculto');
  document.getElementById('campo-descripcion').value = 'Cambio de optativa';
});
await pagina.fill('#buscar-tipo', 'mudanza de expediente');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await pagina.click('#tipo-al-vuelo-crear');
await pagina.waitForSelector('#tipo-al-vuelo-panel.oculto', { state: 'attached' });
await comprobar('el tipo nuevo queda elegido', pagina.evaluate(() => App.E.nuevo.tipo), 'MUDANZA DE EXPEDIENTE');
await comprobar('el tercero sigue siendo el mismo',
  pagina.evaluate(() => App.E.nuevo.tercero && App.E.nuevo.tercero.nombre), 'Aguilar Ponce, Marina');
await comprobar('la descripción escrita sigue ahí',
  pagina.locator('#campo-descripcion').inputValue(), 'Cambio de optativa');
await comprobar('el bloque de detalles sigue a la vista',
  pagina.locator('#bloque-detalles').isHidden(), false);

console.log('--- Escape cierra el panel, no la pantalla de Nuevo asunto ---');
await pagina.fill('#buscar-tipo', 'algo que no existe todavia');
await pagina.click('#btn-crear-tipo-al-vuelo');
await pagina.waitForSelector('#tipo-al-vuelo-panel:not(.oculto)');
await pagina.keyboard.press('Escape');
await comprobar('el panel se cierra', pagina.locator('#tipo-al-vuelo-panel').isHidden(), true);
await comprobar('sigue en Nuevo asunto', pagina.locator('#pantalla-nuevo').isHidden(), false);
await comprobar('la descripción de antes no se ha perdido (Escape no salió de la pantalla)',
  pagina.locator('#campo-descripcion').inputValue(), 'Cambio de optativa');
await comprobar('no se ha creado ningún tipo con ese texto',
  tiposEnDisco('ALGO QUE NO EXISTE TODAVIA').then(l => l.length), 0);

console.log('--- aparece en Ajustes ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => App.cambiarPestanaAjustes('tipos'));
await pagina.fill('#buscar-tipos', 'evacuacion');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
await comprobar('EVACUACION sale en Ajustes',
  pagina.locator('#tabla-tipos .tarjeta-tipo[data-tipo="EVACUACION"]').count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
