/* Prueba en navegador de verdad de la fila 244 de docs/COLA.md
   (docs/CAMPOS-IMPORTE-NUMERO-FECHA.md): campos propios de clase Importe en
   euros, Número y Fecha, y cambiar la clase de un campo ya creado.

   0. Las funciones puras (js/campos-clases.js).
   1. El desplegable «Clase» trae las cinco clases.
   2. Un campo de importe: `1234,5` → `1.234,50 €` al salir de la caja; `-80`
      → `-80,00 €`; `hola` → ámbar con su aviso, y no se guarda. Número y Fecha.
   3. En la ficha se ve ya formateado; el valor se guarda como número/ISO.
   4. Un hueco de plantilla recibe el valor ya formateado.
   5. Cambiar de Texto libre a Importe: la pregunta dice cuántos valores se
      pasan y cuántos no se entienden; lo que no se entiende queda tal cual,
      en ámbar en la ficha; corregirlo quita el ámbar; volver a Texto libre
      no deja nada en ámbar ni pierde valores.
   6. Exportar: la clase declarada manda (importe con €, suma sin lo que está
      en ámbar; fecha como fecha). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const A1 = '260915 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const A2 = '260916 CONVALIDACION 26-27 Sola Dos, Ana 9990202';
const A3 = '260917 CONVALIDACION 26-27 Sola Tres, Rosa 9990203';
const CAMPOS = {
  propios: [{ id: 'pi', nombre: 'Cantidad', clase: 'texto', valores: [] }],
  porTipo: { CONVALIDACION: [{ origen: 'propio', id: 'pi', obligatorio: false, enNombre: false }] }
};

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([campos, nombres]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('campos.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(campos)); await w.close();
  for (const n of nombres) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [CAMPOS, [A1, A2, A3]]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2, a3]) => {
  const base = { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO', curso: '26-27', grupo: '', descripcion: '' };
  await App.anotar(a1, Object.assign({ tercero: 'Sola Uno, Eva 9990201', campos: { 'propio:pi': { valor: '125,5', enNombre: false } } }, base));
  await App.anotar(a2, Object.assign({ tercero: 'Sola Dos, Ana 9990202', campos: { 'propio:pi': { valor: '-80', enNombre: false } } }, base));
  await App.anotar(a3, Object.assign({ tercero: 'Sola Tres, Rosa 9990203', campos: { 'propio:pi': { valor: 'unos 30 euros', enNombre: false } } }, base));
  await App.verAbiertos();
}, [A1, A2, A3]);

/* 0. Puras. */
console.log('--- 0. las funciones puras ---');
await comprobar('0. importe: se entiende y se ve',
  pagina.evaluate(() => ['1234,5', '-80', '125.50 €', '1.200', '1.234,56', 'hola', ''].map((t) => [CamposClases.leer('importe', t).ok, CamposClases.mostrar('importe', t)])),
  [[true, '1.234,50 €'], [true, '-80,00 €'], [true, '125,50 €'], [true, '1.200,00 €'], [true, '1.234,56 €'], [false, 'hola'], [true, '']]);
await comprobar('0. número: sin ceros de sobra',
  pagina.evaluate(() => ['1234,5', '12', '0,5000', '-3,25'].map((t) => CamposClases.mostrar('numero', t))), ['1.234,5', '12', '0,5', '-3,25']);
await comprobar('0. fecha: se guarda AAAA-MM-DD y se ve dd/mm/aaaa',
  pagina.evaluate(() => [CamposClases.leer('fecha', '1/10/2026').valor, CamposClases.mostrar('fecha', '2026-10-01'), CamposClases.leer('fecha', '31/02/2026').ok]), ['2026-10-01', '01/10/2026', false]);
await comprobar('0. se guarda como número con dos decimales',
  pagina.evaluate(() => CamposClases.leer('importe', '1234,5').valor), '1234.50');
await comprobar('0. convertir: lo que se entiende pasa, lo que no se queda tal cual',
  pagina.evaluate(() => ['125,5', 'unos 30 euros', ''].map((t) => CamposClases.convertir('importe', t))),
  [{ valor: '125.50', entendido: true }, { valor: 'unos 30 euros', entendido: false }, { valor: '', entendido: true }]);

/* 2 (Nuevo asunto). El control de un campo de importe y su ámbar. */
console.log('--- 2. los controles ---');
const nuevo = await pagina.evaluate(() => {
  const mk = (clase, nombre) => App.filaCampoNuevo({ cfg: { origen: 'propio', clase: clase, valores: [], obligatorio: false, enNombre: false }, clave: 'propio:' + clase, nombre: nombre, valorInicial: '' });
  const cont = document.createElement('div'); cont.id = 'prueba-controles'; document.body.appendChild(cont);
  const filas = { importe: mk('importe', 'Importe'), numero: mk('numero', 'Número'), fecha: mk('fecha', 'Fecha') };
  Object.keys(filas).forEach((k) => cont.appendChild(filas[k].tagName ? filas[k] : filas[k]));
  return cont.querySelectorAll('input.campo').length;
});
await comprobar('2. tres controles', Promise.resolve(nuevo), 3);
await comprobar('2. importe y número con teclado numérico; fecha con calendario',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#prueba-controles input.campo')).map((e) => [e.type, e.getAttribute('inputmode')])),
  [['text', 'decimal'], ['text', 'decimal'], ['date', null]]);
const caja = pagina.locator('#prueba-controles input.campo').nth(0);
await caja.fill('1234,5'); await caja.blur();
await comprobar('2. `1234,5` se ve `1.234,50 €` al salir de la caja', caja.inputValue(), '1.234,50 €');
await caja.fill('-80'); await caja.blur();
await comprobar('2. `-80` se ve `-80,00 €`', caja.inputValue(), '-80,00 €');
await caja.fill('hola'); await caja.blur();
await comprobar('2. `hola`: la caja en ámbar con su aviso',
  pagina.evaluate(() => { const e = document.querySelectorAll('#prueba-controles input.campo')[0]; return [e.classList.contains('campo-ambar'), (e.nextElementSibling || {}).textContent]; }),
  [true, 'Escribe solo la cifra, por ejemplo 125,50']);
await comprobar('2. y no deja guardar ese valor',
  pagina.evaluate(() => {
    App.E.nuevo = App.E.nuevo || {};
    const e = document.querySelectorAll('#prueba-controles input.campo')[0];
    App.E.nuevo.configCampos = [{ cfg: { obligatorio: false }, clave: 'propio:x', nombre: 'Importe', clase: 'importe', entradaEl: e, casillaEl: null }];
    return [App.validarCamposObligatorios(), App.valoresCamposActuales()[0].ok, App.valoresCamposActuales()[0].valor];
  }), [false, false, '']);
await caja.fill('12,5'); await caja.blur();
await comprobar('2. corregido, se quita el ámbar y se puede guardar',
  pagina.evaluate(() => { const e = document.querySelectorAll('#prueba-controles input.campo')[0]; return [e.classList.contains('campo-ambar'), App.validarCamposObligatorios(), App.valoresCamposActuales()[0].valor, App.valoresCamposActuales()[0].texto]; }),
  [false, true, '12.50', '12,50 €']);
await pagina.evaluate(() => document.getElementById('prueba-controles').remove());

/* 3 y 5. En la ficha, y cambiar la clase. */
console.log('--- 5. cambiar la clase de «Cantidad» de Texto libre a Importe en euros ---');
async function abrirFicha(corto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre, .nombre-pulsable', { hasText: corto }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-campo-anadir', { state: 'attached' });
  await pagina.waitForTimeout(300);
}
const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#ficha-datos-tramite .ficha-dato:not(.oculto):not(.ficha-dato-anadir)'),
  (f) => ({ t: f.children[0].textContent.trim(), v: f.children[1].textContent.trim(), ambar: f.classList.contains('ficha-dato-ambar') })));
await abrirFicha('Sola Uno');
await comprobar('3. como Texto libre, el valor sale tal cual', filas(), [{ t: 'Cantidad', v: '125,5', ambar: false }]);
await pagina.click('#ficha-campo-anadir');
await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
await pagina.click('#campos-catalogo-pestanas [data-pestana="mios"]');
await pagina.waitForSelector('#campos-mios-lista .fila-tipo');
await pagina.locator('#campos-mios-lista .fila-tipo', { hasText: 'Cantidad' }).getByRole('button', { name: 'Cambiar' }).click();
await pagina.waitForSelector('#propio-clase');
await comprobar('1. el desplegable «Clase» trae las cinco clases',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#propio-clase option')).map((o) => o.textContent)),
  ['Texto libre', 'Lista cerrada', 'Importe en euros', 'Número', 'Fecha']);
await pagina.selectOption('#propio-clase', 'importe');
await pagina.click('#propio-crear');
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo p');
await comprobar('5. la pregunta dice cuántos se pasan y cuántos no se entienden',
  pagina.locator('#cuadro-cuerpo p').textContent(),
  'Vas a cambiar «Cantidad» a Importe en euros. 2 valores se pasarán solos; 1 no se entiende y quedará en ámbar para corregirlo a mano. ¿Seguimos?');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('5. la clase cambió y los valores entendidos pasaron a número',
  pagina.evaluate(() => [App.E.campos.propios[0].clase, ['', '2', '3'].map((x, i) => i), Object.values(App.E.registro.asuntos).map((f) => f.campos['propio:pi'].valor).sort()]),
  ['importe', [0, 1, 2], ['-80.00', '125.50', 'unos 30 euros']]);
await abrirFicha('Sola Uno');
await comprobar('3. en la ficha se ve `125,50 €`', filas(), [{ t: 'Cantidad', v: '125,50 €', ambar: false }]);
await abrirFicha('Sola Tres');
await comprobar('5. lo que no se entiende sale tal cual, en ámbar, con su ayuda',
  pagina.evaluate(() => { const f = document.querySelector('#ficha-datos-tramite .ficha-dato-ambar'); return f ? [f.children[1].textContent.trim(), f.children[1].title] : null; }),
  ['unos 30 euros', 'No es un importe: corrígelo']);

/* 4. El hueco de una plantilla. */
console.log('--- 4. el hueco de la plantilla ---');
await comprobar('4. {{Cantidad}} recibe el valor ya formateado',
  pagina.evaluate(async (n) => { const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0]; const v = await Plantillas.valoresDeAsunto(a); return v.campos['Cantidad']; }, A1),
  '125,50 €');

/* 6. Exportar. */
console.log('--- 6. exportar ---');
const t = await pagina.evaluate(() => {
  const regs = Object.keys(App.E.registro.asuntos).map((n) => ({ reservado: false, campos: { Cantidad: (App.E.registro.asuntos[n].campos['propio:pi'] || {}).valor } }));
  const tabla = ExportarAsuntos.tabla(regs, ExportarAsuntos.columnasDeCampos(regs, []));
  return { clase: tabla.columnas[0].clase, sufijo: tabla.columnas[0].sufijo, celdas: tabla.filas.map((f) => f[0]), suma: tabla.sumas[0] };
});
await comprobar('6. columna de importe: numero con €, el valor en ámbar como texto y fuera de la suma',
  Promise.resolve([t.clase, t.sufijo, t.suma, t.celdas.filter((c) => c.k === 'texto').map((c) => c.v)]), ['numero', ' €', 45.5, ['unos 30 euros']]);

/* 5 (vuelta). Corregir el ámbar y volver a Texto libre. */
console.log('--- 5. corregir el ámbar y volver a Texto libre ---');
await pagina.evaluate(async (n) => { await App.anotar(n, { campos: { 'propio:pi': { valor: CamposClases.leer('importe', '30').valor, enNombre: false } } }); }, A3);
await abrirFicha('Sola Tres');
await comprobar('5. corregido a `30`, se quita el ámbar', filas(), [{ t: 'Cantidad', v: '30,00 €', ambar: false }]);
await pagina.evaluate(async () => { await Campos.guardarPropios(App.E.gestor, (l) => { l[0].clase = 'texto'; return l; }); App.E.campos = await Campos.leer(App.E.gestor); });
await abrirFicha('Sola Tres');
await comprobar('5. vuelta a Texto libre: nada en ámbar y el valor sigue', filas(), [{ t: 'Cantidad', v: '30.00', ambar: false }]);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await pagina.close();
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
