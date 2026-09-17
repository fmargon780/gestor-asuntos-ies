/* Prueba en navegador de verdad del botón "Insertar hueco" del editor
   de plantillas (docs/HUECOS-INSERTAR.md, 17-sep-2026, fila 35 de
   docs/COLA.md).

   Antes, encima del cuadro de texto de una plantilla se pintaba un
   botón por cada hueco del catálogo: más de treinta, en un muro que
   tapaba el nombre de la plantilla y el tipo de asunto. Ahora hay un
   solo botón que abre un cuadro pequeño con buscador.

   Lo que tiene que pasar:
     1. El formulario de plantilla ya no pinta el muro de botones
        (#pl-huecos), y sí pinta el botón "Insertar hueco".
     2. El botón abre el cuadro, y el buscador filtra: con "tutor"
        quedan los huecos de los tutores y se va "Grupo". La búsqueda
        ignora mayúsculas y tildes ("telefono" encuentra "Teléfono").
     3. Con el cursor en medio del texto, el hueco entra en esa
        posición exacta, no al final. Y la vista previa se entera.
     4. Con el foco puesto antes en otro campo (el "asunto" del
        encargo: el buscador admite varios campos y recuerda el último
        que tuvo el foco), el hueco entra en ese campo y no en el
        texto.
     5. Escape cierra el cuadro sin insertar nada, y NO cierra el
        cuadro de la plantilla que hay debajo.

   Sin el cambio falla desde la primera comprobación: #pl-huecos
   existe, #pl-insertar-hueco no, y window.HuecosBuscador tampoco.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
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

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* --- Ajustes: desde el 17-sep-2026 (fila 39, docs/AJUSTES-POR-TIPO.md)
   las plantillas de correo de un tipo viven en su propia pantalla, no
   en un bloque suelto de Ajustes: se abre un tipo y se pulsa su
   "+ Nueva plantilla". --- */
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
await pagina.locator('#tabla-tipos .tarjeta-tipo').first().locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#tipo-plantillas-nueva');

/* ========================================================
   1 · el muro ya no está; el botón sí
   ======================================================== */
console.log('--- 1. el muro de botones se ha ido ---');
await pagina.click('#tipo-plantillas-nueva');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#pl-texto');

await comprobar('el formulario ya no pinta el muro de huecos',
  pagina.locator('#pl-huecos').count(), 0);
await comprobar('y sí pinta un solo botón "Insertar hueco"',
  pagina.locator('#pl-insertar-hueco').count(), 1);
await comprobar('el texto del botón es el acordado',
  pagina.locator('#pl-insertar-hueco').textContent(), 'Insertar hueco');
await comprobar('el cuadro de huecos nace cerrado',
  pagina.locator('#huecos-cuadro').count(), 0);

/* ========================================================
   2 · se abre y el buscador filtra
   ======================================================== */
console.log('--- 2. el buscador ---');
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('#huecos-cuadro');

await comprobar('al abrirlo salen todos los huecos del catálogo',
  pagina.evaluate(() => document.querySelectorAll('#huecos-cuadro .huecos-opcion').length ===
    window.Plantillas.HUECOS.length), true);
await comprobar('el cursor arranca dentro del buscador',
  pagina.evaluate(() => document.activeElement && document.activeElement.id), 'huecos-buscar');
await comprobar('cada hueco enseña su nombre en claro y su código',
  pagina.locator('#huecos-cuadro .huecos-opcion').first().textContent()
    .then(t => t.indexOf('Nombre del tercero') !== -1 && t.indexOf('{nombre}') !== -1), true);

await pagina.fill('#huecos-buscar', 'tutor');
await comprobar('buscando "tutor" quedan solo los huecos de los tutores',
  pagina.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#huecos-cuadro .huecos-opcion'),
    (b) => b.getAttribute('data-clave')).join(',')),
  'tutor1,tutor1telefono,tutor1correo,tutor2,tutor2telefono,tutor2correo');
await comprobar('y "Grupo" se queda fuera',
  pagina.locator('#huecos-cuadro .huecos-opcion[data-clave="grupo"]').count(), 0);

await pagina.fill('#huecos-buscar', 'TELEFONO');
await comprobar('la búsqueda ignora mayúsculas y tildes',
  pagina.evaluate(() => Array.prototype.slice.call(
    document.querySelectorAll('#huecos-cuadro .huecos-opcion'))
    .some((b) => b.getAttribute('data-clave') === 'tutor1telefono')), true);

await pagina.fill('#huecos-buscar', 'zzz');
await comprobar('sin resultados lo dice, y no deja ninguno puesto',
  pagina.locator('#huecos-cuadro .huecos-vacio').count(), 1);

/* ========================================================
   5 · Escape cierra el cuadro de huecos y solo ese
   ======================================================== */
console.log('--- 5. Escape ---');
await pagina.fill('#pl-texto', 'Buenos días.');
await pagina.press('#pl-insertar-hueco', 'Escape').catch(() => {});
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.press('#huecos-buscar', 'Escape');
await pagina.waitForTimeout(150);
await comprobar('Escape cierra el cuadro de huecos',
  pagina.locator('#huecos-cuadro').count(), 0);
await comprobar('y el cuadro de la plantilla sigue abierto',
  pagina.locator('#capa').evaluate(e => e.classList.contains('oculto')), false);
await comprobar('y no ha insertado nada',
  pagina.locator('#pl-texto').inputValue(), 'Buenos días.');

/* ========================================================
   3 · el hueco entra donde está el cursor, no al final
   ======================================================== */
console.log('--- 3. donde está el cursor ---');
await pagina.fill('#pl-texto', 'Hola , buenos días.');
/* El cursor, justo detrás de "Hola " (posición 5). */
await pagina.evaluate(() => {
  const c = document.getElementById('pl-texto');
  c.focus();
  c.selectionStart = c.selectionEnd = 5;
  c.dispatchEvent(new Event('keyup', { bubbles: true }));
});
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.fill('#huecos-buscar', 'nombre del tercero');
await pagina.click('#huecos-cuadro .huecos-opcion[data-clave="nombre"]');
await pagina.waitForTimeout(150);

await comprobar('el hueco entra donde estaba el cursor',
  pagina.locator('#pl-texto').inputValue(), 'Hola {nombre}, buenos días.');
await comprobar('el cuadro se cierra al elegir',
  pagina.locator('#huecos-cuadro').count(), 0);
await comprobar('el cursor vuelve al texto, detrás de lo insertado',
  pagina.evaluate(() => {
    const c = document.getElementById('pl-texto');
    return [document.activeElement === c, c.selectionStart];
  }), [true, 13]);
await comprobar('la vista previa se ha enterado',
  pagina.locator('#pl-previa').textContent().then(t => t.indexOf('Hola ') === 0 &&
    t.indexOf('{nombre}') === -1), true);

/* con texto seleccionado, el hueco lo sustituye */
await pagina.evaluate(() => {
  const c = document.getElementById('pl-texto');
  c.value = 'Hola AQUI, buenos días.';
  c.focus();
  c.selectionStart = 5; c.selectionEnd = 9;
  c.dispatchEvent(new Event('keyup', { bubbles: true }));
});
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.fill('#huecos-buscar', 'grupo');
await pagina.press('#huecos-buscar', 'Enter');
await pagina.waitForTimeout(150);
await comprobar('con texto seleccionado, el hueco lo sustituye',
  pagina.locator('#pl-texto').inputValue(), 'Hola {grupo}, buenos días.');

/* las flechas eligen otro de la lista */
await pagina.evaluate(() => {
  const c = document.getElementById('pl-texto');
  c.value = ''; c.focus();
  c.selectionStart = c.selectionEnd = 0;
  c.dispatchEvent(new Event('keyup', { bubbles: true }));
});
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.fill('#huecos-buscar', 'tutor');
await pagina.press('#huecos-buscar', 'ArrowDown');
await pagina.press('#huecos-buscar', 'Enter');
await pagina.waitForTimeout(150);
await comprobar('las flechas bajan por la lista y Enter elige',
  pagina.locator('#pl-texto').inputValue(), '{tutor1telefono}');

/* ========================================================
   4 · con dos campos, el hueco entra en el que tuvo el foco
   ========================================================

   El formulario de la plantilla de correo tiene hoy un solo campo con
   huecos (el texto). La regla de "el último que tuvo el foco" vive en
   la función compartida, que admite varios campos: así, el día que la
   plantilla tenga también su propio asunto, no hay que tocar nada.
   Aquí se monta con dos campos de verdad, en la misma página. */
console.log('--- 4. el campo que tuvo el foco ---');

/* Antes, cerrar el cuadro de la plantilla sin guardar: su capa tapa
   toda la pantalla y no dejaría pulsar nada de lo de abajo. */
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

await pagina.evaluate(() => {
  const caja = document.createElement('div');
  caja.id = 'prueba-dos-campos';
  /* Encima de todo, para que se pueda pulsar de verdad con el ratón:
     la barra lateral de la aplicación tapa media pantalla. */
  caja.setAttribute('style',
    'position:fixed; top:20px; left:420px; z-index:200; background:#fff; padding:10px;');
  caja.innerHTML =
    '<input id="prueba-asunto" class="campo">' +
    '<button type="button" id="prueba-boton">Insertar hueco</button>' +
    '<textarea id="prueba-texto" class="campo"></textarea>';
  document.body.appendChild(caja);
  window.HuecosBuscador.montar({
    boton: document.getElementById('prueba-boton'),
    campos: [document.getElementById('prueba-asunto'), document.getElementById('prueba-texto')]
  });
});

/* sin haber tocado ninguno: al final del último, el cuadro de texto */
await pagina.evaluate(() => { document.getElementById('prueba-texto').value = 'Ya escrito.'; });
await pagina.click('#prueba-boton');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.fill('#huecos-buscar', 'grupo');
await pagina.press('#huecos-buscar', 'Enter');
await pagina.waitForTimeout(150);
await comprobar('sin foco previo, el hueco va al final del cuadro de texto',
  pagina.evaluate(() => [document.getElementById('prueba-asunto').value,
                         document.getElementById('prueba-texto').value]),
  ['', 'Ya escrito.{grupo}']);

/* con el foco puesto antes en el asunto: entra en el asunto */
await pagina.evaluate(() => {
  const a = document.getElementById('prueba-asunto');
  a.value = 'Sobre ';
  a.focus();
  a.selectionStart = a.selectionEnd = 6;
  a.dispatchEvent(new Event('keyup', { bubbles: true }));
});
await pagina.click('#prueba-boton');
await pagina.waitForSelector('#huecos-cuadro');
await pagina.fill('#huecos-buscar', 'tipo de asunto');
await pagina.press('#huecos-buscar', 'Enter');
await pagina.waitForTimeout(150);
await comprobar('con el foco puesto antes en el asunto, el hueco entra en el asunto',
  pagina.evaluate(() => [document.getElementById('prueba-asunto').value,
                         document.getElementById('prueba-texto').value]),
  ['Sobre {tipo}', 'Ya escrito.{grupo}']);

await pagina.evaluate(() => { document.getElementById('prueba-dos-campos').remove(); });

/* ---------- final ---------- */
if (errores.length) {
  fallos++;
  console.log('FALLA  la consola del navegador está limpia\n   ' + errores.join('\n   '));
} else {
  console.log('bien   la consola del navegador está limpia');
}

await navegador.close();
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
