/* Prueba en navegador de verdad de «Buscar o crear» en Ajustes (fila 250,
   docs/BUSCAR-O-CREAR-EN-AJUSTES.md): una sola caja, sin «TIPO NUEVO»
   ni «Añadir»; el botón de crear sale al final de la lista, solo con
   texto; con parecidos pregunta una vez más; con el nombre idéntico no
   deja y ofrece «Verlo»; la categoría se elige al crear. Lo mismo en
   Tipos de documento, sin categoría.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

console.log('--- 1. una sola caja ---');
await comprobar('no hay caja «TIPO NUEVO»', pagina.locator('#nuevo-tipo').count(), 0);
await comprobar('no hay botón «Añadir»', pagina.locator('#btn-anadir-tipo').count(), 0);
await comprobar('no hay desplegable de categoría suelto', pagina.locator('#nueva-categoria').count(), 0);
await comprobar('hay una sola caja «Buscar o crear»',
  pagina.locator('#buscar-tipos').getAttribute('placeholder').then(t => t.indexOf('Buscar o crear') === 0), true);

console.log('--- 2. botón de crear solo con texto, al final de la lista ---');
await comprobar('con la caja vacía no hay botón', zona.textContent(), '');
await pagina.fill('#buscar-tipos', 'zzqx inventado');
await pagina.waitForTimeout(150);
await comprobar('con texto sale «Ninguno es el que busco»', botonCrear.textContent(),
  'Ninguno es el que busco: crear «ZZQX INVENTADO»');
await comprobar('el botón está después de la rejilla',
  pagina.evaluate(() => !!(document.getElementById('tabla-tipos').compareDocumentPosition(
    document.getElementById('crear-tipo-zona')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
await pagina.fill('#buscar-tipos', 'matricula');
await pagina.waitForTimeout(150);
await comprobar('se ve MATRICULA y, de otra categoría, no TOMA POSESION',
  nombresVisibles().then(n => n.indexOf('MATRICULA') !== -1 && n.indexOf('TOMA POSESION') === -1), true);

console.log('--- 3. parecido con otras tildes, mayúsculas u orden: pregunta otra vez ---');
await pagina.fill('#buscar-tipos', 'Posesión Toma');
await pagina.waitForTimeout(150);
await comprobar('sale TOMA POSESION en la lista (otro orden y tilde)',
  nombresVisibles().then(n => n.indexOf('TOMA POSESION') !== -1), true);
await pagina.fill('#buscar-tipos', 'matriculas');
await pagina.waitForTimeout(150);
await comprobar('«matriculas» sale como ya existente (mismo nombre, plural)',
  zona.textContent().then(t => t.indexOf('Ya existe') !== -1), true);
await pagina.fill('#buscar-tipos', 'Posesión Toma');
await botonCrear.click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('otro orden de palabras también pregunta «¿Es otro tipo de verdad?»',
  pagina.locator('#cuadro-cuerpo li:has-text("TOMA POSESION") button').count(), 1);
await pagina.click('#cuadro-cancelar');
await pagina.fill('#buscar-tipos', 'MATRICLUA');
await pagina.waitForTimeout(150);
await botonCrear.click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('sale «¿Es otro tipo de verdad?»',
  pagina.locator('#cuadro-titulo').textContent(), '¿Es otro tipo de verdad?');
await comprobar('con MATRICULA en la lista del cuadro',
  pagina.locator('#cuadro-cuerpo li:has-text("MATRICULA") button').count(), 1);
await comprobar('y el botón dice «Crear de todas formas»', pagina.locator('#cuadro-aceptar').textContent(), 'Crear de todas formas');
await pagina.click('#cuadro-cuerpo li:has-text("MATRICULA") button');
await pagina.waitForSelector('#capa.oculto', { state: 'attached' });
await comprobar('pulsar uno lleva a ese tipo (se ve MATRICULA)',
  nombresVisibles().then(n => n.indexOf('MATRICULA') !== -1), true);
await comprobar('y no se ha creado MATRICLUA',
  pagina.evaluate(() => App.E.tipos.filter(t => t.tipo === 'MATRICLUA').length), 0);

await pagina.fill('#buscar-tipos', 'MATRICLUA');
await botonCrear.click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#bc-categoria');
await pagina.click('#cuadro-cancelar');
await comprobar('cancelar la categoría no crea nada',
  pagina.evaluate(() => App.E.tipos.filter(t => t.tipo === 'MATRICLUA').length), 0);

console.log('--- 4. nombre exacto: no hay botón, sale «Ya existe» con «Verlo» ---');
await pagina.fill('#buscar-tipos', 'Matrícula');
await pagina.waitForTimeout(150);
await comprobar('no hay botón de crear', botonCrear.count(), 0);
await comprobar('dice dónde está',
  zona.textContent().then(t => t.indexOf('Ya existe: MATRICULA, en ALUMNADO') !== -1), true);
await pagina.locator('#pestanas-tipos .pestana-categoria').filter({ hasText: 'EMPRESAS' }).dispatchEvent('click');
await pagina.fill('#buscar-tipos', 'matricula');
await pagina.click('#crear-tipo-zona [data-bc="ver"]');
await pagina.waitForTimeout(200);
await comprobar('«Verlo» cambia a la pestaña ALUMNADO',
  pagina.locator('.pestana-categoria.activa').textContent().then(t => t.indexOf('ALUMNADO') !== -1), true);

console.log('--- 5. crear sin parecidos: la categoría de la pestaña, cambiable ---');
await pagina.locator('#pestanas-tipos .pestana-categoria').filter({ hasText: 'PERSONAL' }).dispatchEvent('click');
await pagina.fill('#buscar-tipos', 'zzqx inventado');
await botonCrear.click();
await pagina.waitForSelector('#bc-categoria');
await comprobar('sin parecidos no hay pregunta intermedia: sale la categoría', pagina.locator('#cuadro-titulo').textContent(), '¿En qué categoría?');
await comprobar('trae PERSONAL marcada', pagina.locator('#bc-categoria').inputValue(), 'PERSONAL');
await pagina.selectOption('#bc-categoria', 'OTROS');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('el tipo existe en OTROS',
  pagina.evaluate(() => App.E.tipos.filter(t => t.tipo === 'ZZQX INVENTADO')[0].categoria), 'OTROS');
await comprobar('la caja queda vacía', pagina.locator('#buscar-tipos').inputValue(), '');
await comprobar('aparece en su pestaña (OTROS)',
  nombresVisibles().then(n => n.indexOf('ZZQX INVENTADO') !== -1), true);
await comprobar('aviso verde «Tipo añadido.»',
  pagina.locator('#mensajes .mensaje.bueno').first().textContent().then(t => t.indexOf('Tipo añadido') !== -1), true);

console.log('--- 6. Tipos de documento: lo mismo, sin categoría ---');
await pagina.click('[data-ajustes-pestana="dia"]');   /* fila 288: los tipos de documento están en «Lo de cada día» */
await pagina.evaluate(() => { document.querySelectorAll('#ajustes-tab-dia details').forEach(d => { d.open = true; }); });
await comprobar('no hay «TIPO NUEVO» ni «Añadir»',
  pagina.locator('#nuevo-tipo-doc, #btn-anadir-tipo-doc').count(), 0);
const docs = await pagina.evaluate(() => App.E.tiposDocumento.slice());
const existente = docs[0];
await comprobar('con la caja vacía no hay botón', pagina.locator('#crear-tipo-doc-zona').textContent(), '');
await pagina.fill('#buscar-tipos-doc', existente.toLowerCase());
await pagina.waitForTimeout(150);
await comprobar('nombre exacto: «Ya existe» y sin botón',
  pagina.locator('#crear-tipo-doc-zona').textContent().then(t => t.indexOf('Ya existe: ' + existente) !== -1), true);
await pagina.fill('#buscar-tipos-doc', 'ZZQX DOC INVENTADO');
await pagina.waitForTimeout(150);
await comprobar('texto nuevo: botón al final',
  pagina.locator('#crear-tipo-doc-zona [data-bc="crear"]').textContent(), 'Ninguno es el que busco: crear «ZZQX DOC INVENTADO»');
await pagina.click('#crear-tipo-doc-zona [data-bc="crear"]');
await pagina.waitForTimeout(300);
await comprobar('se crea directamente, sin categoría',
  pagina.evaluate(() => App.E.tiposDocumento.indexOf('ZZQX DOC INVENTADO') !== -1), true);
await comprobar('la caja queda vacía', pagina.locator('#buscar-tipos-doc').inputValue(), '');
await comprobar('aparece en la rejilla',
  pagina.locator('#tabla-tipos-documento .tarjeta-tipo-nombre').allTextContents().then(n => n.indexOf('ZZQX DOC INVENTADO') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLO(S)' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
