/* Prueba en navegador de verdad de la fila 463, parte A
   (docs/EDITOR-DE-LA-GUIA-CLARO.md): el editor de la guía a todo lo ancho,
   en dos columnas.

   1. La ventana ocupa todo el ancho: hitos a la izquierda, el elegido a la derecha.
   2. Pulsar otro hito de la izquierda cambia la derecha sin bajar la página
      y sin perder lo escrito en el anterior.
   3. Las tareas del hito se ven sin desplegar nada.
   4. Cada desplegable del hito tiene su rótulo y el «desde» se lee entero.
   5. Prueba de oro: abrir y guardar sin tocar nada deja la guía igual, byte a byte.
   6. «Ver mapa» enseña el mapa en la columna derecha y elegir un hito lo elige.
   7. El camino de una pregunta de dentro: «Entrar» y «← Volver».
   8. Los hitos de dentro de una respuesta, con el aspecto nuevo.
   9. Desde `GuiasDelCentro.escribir` (Ajustes, plantillas, ficha) se abre este editor,
      con el hito pedido elegido.

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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const GUIA = [
  { id: 'p1', titulo: 'Recibir el parte de baja', responsable: 'r1', cuerpo: 'Se mira <b>con cuidado</b>.',
    normativa: [{ id: 'nm1', cita: 'Decreto 1/2020, art. 3', bloque: '', clave: '', url: '' }],
    guion: [{ id: 'g1', texto: 'Acusar recibo del parte', accion: 'comunicar', receta: { a: 'tutor', via: 'correo', plantilla: '' } },
            { id: 'g2', texto: 'Sellar el parte' }, { id: 'g3', texto: 'Archivar el parte' }] },
  { id: 'q1', titulo: '¿Cómo ha llegado?', opciones: [
    { id: 'a', titulo: 'En mano', pasos: [
      { id: 'a1', titulo: 'Poner el sello', guion: [{ id: 'ga', texto: 'Estampar' }] },
      { id: 'q2', titulo: '¿Viene completa?', opciones: [
        { id: 's', titulo: 'Sí', pasos: [{ id: 's1', titulo: 'Archivar copia' }] },
        { id: 'n', titulo: 'No', pasos: [{ id: 'n1', titulo: 'Pedir lo que falta' }] } ] }
    ] },
    { id: 'b', titulo: 'Por correo', pasos: [{ id: 'b1', titulo: 'Guardar el correo' }] }
  ] },
  { id: 'p3', titulo: 'Esperar el parte de alta con un título bastante largo para leerlo entero', soloInformativo: true,
    plazo: { dias: 5, desde: 'p1', cuenta: 'habiles' } },
  { id: 'p4', titulo: 'Archivar' }
];
const RESP = [{ id: 'r1', nombre: 'Secretaría' }];

const elegidos = () => pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos > .paso-editor'))
    .filter(el => !el.classList.contains('paso-plegado'))
    .map(el => el.querySelector(':scope > .paso-cabecera .paso-titulo').value));
const enLista = (pos) => pagina.click('#guia-lista .guia-lista-item:nth-child(' + (pos + 1) + ')');
const D = (pos) => '#guia-pasos > .paso-editor[data-pos="' + pos + '"]';
async function abrir(opciones) {
  await pagina.evaluate(([GUIA, RESP, opciones]) => {
    window.__guardada = Guias.editar('FACTURA', JSON.parse(JSON.stringify(GUIA)), RESP, [], opciones);
  }, [GUIA, RESP, opciones || null]);
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}

/* ================= 1 ================= */
console.log('--- 1. todo el ancho, dos columnas ---');
await abrir();
await comprobar('la ventana es la del editor a todo lo ancho',
  pagina.evaluate(() => {
    const c = document.querySelector('#capa .cuadro');
    const r = c.getBoundingClientRect();
    return [c.classList.contains('cuadro-guia'), Math.round(r.width) >= window.innerWidth - 60];
  }), [true, true]);
await comprobar('arriba: «Guía de FACTURA» y, a la derecha, «Ver mapa» y «+ Traer un hito de otro tipo»',
  pagina.evaluate(() => {
    const t = document.querySelector('.guia-cab-titulo').getBoundingClientRect();
    const bs = Array.from(document.querySelectorAll('.guia-cab-herr .boton'));
    return [document.querySelector('.guia-cab-titulo').textContent, bs.map(b => b.textContent),
            bs.every(b => b.getBoundingClientRect().left > t.right)];
  }), ['Guía de FACTURA', ['Ver mapa', '+ Traer un hito de otro tipo'], true]);
await comprobar('abajo: «Cancelar» y «Guardar»',
  pagina.evaluate(() => [document.getElementById('cuadro-cancelar').textContent, document.getElementById('cuadro-aceptar').textContent]),
  ['Cancelar', 'Guardar']);
await comprobar('la lista de la izquierda, un recuadro por hito: número, título y línea gris',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-lista .guia-lista-item')).map(r =>
    [r.querySelector('.paso-numero').textContent, r.querySelector('.guia-lista-titulo').textContent, r.querySelector('.guia-lista-gris').textContent])),
  [['1', 'Recibir el parte de baja', 'Secretaría · 3 tareas · Normativa (1)'], ['2', '¿Cómo ha llegado?', 'Pregunta'],
   ['3', 'Esperar el parte de alta con un título bastante largo para leerlo entero', 'Solo informativo'], ['4', 'Archivar', '']]);
await comprobar('«+ Añadir un hito» al final de la lista',
  pagina.evaluate(() => { const b = document.getElementById('guia-anadir'); return [b.textContent, b.closest('#guia-col-izq') !== null]; }),
  ['+ Añadir un hito', true]);
await comprobar('el primer hito, elegido; el hito, a la derecha de la lista',
  pagina.evaluate(() => {
    const l = document.querySelector('#guia-lista').getBoundingClientRect();
    const d = document.querySelector('#guia-pasos > .paso-editor:not(.paso-plegado)').getBoundingClientRect();
    return [d.left >= l.right, document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo').textContent];
  }), [true, 'Recibir el parte de baja']);
await comprobar('cada columna se desplaza por su cuenta; la ventana, no',
  pagina.evaluate(() => {
    const o = (s) => getComputedStyle(document.querySelector(s)).overflowY;
    return [o('#guia-col-izq'), o('#guia-col-der'), o('#cuadro-cuerpo')];
  }), ['auto', 'auto', 'hidden']);

/* ================= 2 ================= */
console.log('--- 2. cambiar de hito sin perder lo escrito ---');
await pagina.fill(D(0) + ' .paso-titulo', 'Recibir el parte médico');
await pagina.locator(D(0) + ' .paso-responsable').selectOption('');
await pagina.evaluate(() => { document.getElementById('guia-col-der').scrollTop = 200; });
await enLista(2);
await comprobar('pulsar otro hito cambia la derecha', elegidos(), ['Esperar el parte de alta con un título bastante largo para leerlo entero']);
await comprobar('sin bajar la página (la ventana y su cuerpo siguen arriba)',
  pagina.evaluate(() => [document.getElementById('cuadro-cuerpo').scrollTop, document.getElementById('guia-col-der').scrollTop, window.scrollY]), [0, 0, 0]);
await enLista(0);
await comprobar('lo escrito en el hito anterior sigue ahí',
  pagina.evaluate(() => [document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] .paso-titulo').value,
    document.querySelector('#guia-lista .guia-lista-item:nth-child(1) .guia-lista-titulo').textContent]),
  ['Recibir el parte médico', 'Recibir el parte médico']);
await enLista(3);
await pagina.fill(D(3) + ' .paso-titulo', 'Archivar el expediente');
await enLista(0);   /* pulsar la lista justo tras escribir en un campo no se pierde */
await comprobar('pulsar la lista justo después de escribir cambia de hito', elegidos(), ['Recibir el parte médico']);

/* ================= 3 ================= */
console.log('--- 3. las tareas, a la vista ---');
await comprobar('«Tareas de este hito (3)», con sus tres tareas visibles, sin desplegar nada',
  pagina.evaluate(() => {
    const g = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-guion');
    const filas = Array.from(g.querySelectorAll('.guion-fila'));
    return [g.querySelector('summary').textContent, filas.length, filas.every(f => f.offsetParent !== null)];
  }), ['Tareas de este hito (3)', 3, true]);
await enLista(1);
await comprobar('un hito pregunta no lleva «Tareas de este hito»',
  pagina.evaluate(() => !document.querySelector('#guia-pasos > .paso-editor[data-pos="1"] > .paso-guion')), true);
await enLista(0);

/* ================= 4 ================= */
console.log('--- 4. rótulos y «desde» legible ---');
await comprobar('«Datos del hito» y, en cada cosa, su rótulo',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]');
    return [d.querySelector(':scope > .paso-datos-titulo').textContent,
            Array.from(d.querySelectorAll(':scope > .paso-cabecera .etiqueta, :scope > .paso-extra .etiqueta')).map(e => e.textContent)];
  }), ['Datos del hito', ['Título del hito', 'Responsable', 'A quién le toca', 'Plazo (días)', 'Cómo se cuentan', 'Desde']]);
await comprobar('«A quién le toca» se ve siempre (sin abrir nada)',
  pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] .paso-toca').offsetParent !== null), true);
await comprobar('los desplegables y ↑, ↓ y «Quitar» en la zona de datos',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"]');
    const y = (s) => Math.round(d.querySelector(s).getBoundingClientRect().top);
    return [y('.paso-responsable') - y('.paso-titulo') < 40, Array.from(d.querySelectorAll('.paso-mandos .boton')).map(b => b.textContent).slice(0, 3)];
  }), [true, ['↑', '↓', 'Quitar']]);
await enLista(2);
await comprobar('el «desde» enseña entero el título del hito elegido',
  pagina.evaluate(() => {
    const s = document.querySelector('#guia-pasos > .paso-editor[data-pos="2"] .paso-plazo-desde');
    const medida = document.createElement('span');
    medida.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + getComputedStyle(s).font;
    medida.textContent = s.options[s.selectedIndex].textContent;
    document.body.appendChild(medida);
    const cabe = medida.getBoundingClientRect().width <= s.clientWidth - 30;
    medida.remove();
    return [s.options[s.selectedIndex].textContent, cabe];
  }), ['Recibir el parte de baja', true]);
await comprobar('«Cómo se cuentan» ofrece días hábiles, lectivos, naturales o meses',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-pasos > .paso-editor[data-pos="2"] .paso-plazo-cuenta option')).map(o => o.textContent)),
  ['Días hábiles', 'Días lectivos', 'Días naturales', 'Meses']);

/* ================= 5 ================= */
console.log('--- 5. prueba de oro: abrir y guardar sin tocar nada ---');
await pagina.click('#cuadro-cancelar');
await abrir();
await pagina.click('#cuadro-aceptar');
await comprobar('sin tocar nada, la guía sale igual que entró, byte a byte',
  pagina.evaluate(async (GUIA) => JSON.stringify(await window.__guardada) === JSON.stringify(Guias.normalizar(JSON.parse(JSON.stringify(GUIA)))), GUIA), true);
await abrir();
for (const pos of [1, 2, 3, 0]) await enLista(pos);
for (const ap of ['explicacion', 'aviso', 'documentos', 'normativa', 'otros']) await pagina.click(D(0) + ' > .paso-apartado-cab[data-ap="' + ap + '"]');
await pagina.click('#cuadro-aceptar');
await comprobar('y tras recorrer los hitos y abrir los apartados, igual',
  pagina.evaluate(async (GUIA) => JSON.stringify(await window.__guardada) === JSON.stringify(Guias.normalizar(JSON.parse(JSON.stringify(GUIA)))), GUIA), true);
await abrir();
await pagina.evaluate(() => { document.querySelector('#guia-pasos > .paso-editor[data-pos="3"] .paso-titulo').value = 'Cerrar'; });   /* el hito 4 está escondido: se escribe sin elegirlo */
await pagina.click('#cuadro-aceptar');
await comprobar('lo escrito en un hito escondido también se guarda, y el resto no cambia',
  pagina.evaluate(async (GUIA) => {
    const s = await window.__guardada;
    const e = Guias.normalizar(JSON.parse(JSON.stringify(GUIA)));
    e[3].titulo = 'Cerrar';
    return JSON.stringify(s) === JSON.stringify(e);
  }, GUIA), true);

console.log('--- 5b. «Normativa e impresos» abierto enseña su contenido ---');
await abrir();
await pagina.click(D(0) + ' > .paso-apartado-cab[data-ap="normativa"]');
await comprobar('se ve «+ Añadir referencia» y la referencia escrita',
  pagina.evaluate(() => { const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-normativa');
    return [d.querySelector('.normativa-anadir').offsetParent !== null, d.querySelector('.normativa-fila') !== null && d.querySelector('.normativa-fila').offsetParent !== null]; }), [true, true]);
await pagina.click('#cuadro-cancelar');

/* ================= 6 ================= */
console.log('--- 6. «Ver mapa» ---');
await abrir();
await enLista(2);
await pagina.click('#guia-ver-mapa');
await pagina.waitForSelector('#guia-mapa-panel:not(.oculto)');
await comprobar('el mapa sale en la columna derecha, en lugar del hito, con «← Volver al hito»',
  pagina.evaluate(() => {
    const p = document.getElementById('guia-mapa-panel');
    return [p.offsetParent !== null, document.getElementById('guia-pasos').offsetParent === null,
            p.closest('#guia-col-der') !== null, document.getElementById('guia-mapa-cerrar').textContent];
  }), [true, true, true, '← Volver al hito']);
await pagina.click('#guia-mapa-cerrar');
await comprobar('«← Volver al hito» vuelve al hito', pagina.evaluate(() => document.getElementById('guia-pasos').offsetParent !== null), true);
await elegidos().then(e => comprobar('y sigue el mismo', Promise.resolve(e), ['Esperar el parte de alta con un título bastante largo para leerlo entero']));
await pagina.click('#guia-ver-mapa');
await pagina.waitForSelector('#guia-mapa-panel:not(.oculto)');
await pagina.click('#guia-mapa-panel .mapa-caja[data-id="p4"]');
await comprobar('pulsar un hito del mapa lo elige y vuelve a enseñarlo', elegidos(), ['Archivar']);
await comprobar('(el mapa, cerrado)', pagina.evaluate(() => document.getElementById('guia-mapa-panel').classList.contains('oculto')), true);
await pagina.click('#guia-ver-mapa');
await pagina.waitForSelector('#guia-mapa-panel:not(.oculto)');
await pagina.click('#guia-mapa-panel .mapa-caja[data-id="s1"]');
await comprobar('uno de dentro de una respuesta: se entra en su nivel y queda elegido', elegidos(), ['Archivar copia']);
await pagina.click('#cuadro-cancelar');

/* ================= 7 ================= */
console.log('--- 7. una pregunta: respuestas, «Entrar» y «← Volver» ---');
await abrir();
await enLista(1);
await comprobar('sus respuestas salen en la columna derecha, debajo de «Datos del hito»',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos > .paso-editor[data-pos="1"]');
    const k = Array.from(d.children);
    return [d.querySelectorAll('.opcion-editor').length, k.indexOf(d.querySelector(':scope > .paso-opciones')) > k.indexOf(d.querySelector(':scope > .paso-extra')),
            d.closest('#guia-col-der') !== null];
  }), [2, true, true]);
await pagina.locator('.subpaso-entrar').first().click();
await comprobar('«Entrar»: la izquierda enseña los hitos de ese nivel y, encima, el camino',
  pagina.evaluate(() => [document.getElementById('guia-camino').innerText.replace(/\s+/g, ' ').trim(),
    document.getElementById('guia-col-izq').firstElementChild.id,
    Array.from(document.querySelectorAll('#guia-lista .guia-lista-titulo')).map(x => x.textContent)]),
  ['← Volver Guía de FACTURA › ¿Cómo ha llegado? › En mano', 'guia-camino', ['Poner el sello', '¿Viene completa?']]);
await pagina.click('#guia-volver');
await comprobar('«← Volver» sube un nivel', pagina.evaluate(() => [document.getElementById('guia-camino').classList.contains('oculto'),
  Array.from(document.querySelectorAll('#guia-lista .guia-lista-titulo')).length]), [true, 4]);

/* ================= 8 ================= */
console.log('--- 8. los hitos de dentro de una respuesta ---');
await enLista(1);
await comprobar('«Título del hito», «Tareas de este hito» y los apartados con título que les tocan, sin «Más ajustes»',
  pagina.evaluate(() => {
    const sc = document.querySelector('#guia-pasos .subpaso-editor[data-id="a1"]');
    return [sc.querySelector(':scope > .paso-cabecera .etiqueta').textContent,
            sc.querySelector(':scope > .paso-guion > summary').textContent,
            Array.from(sc.querySelectorAll(':scope > .paso-apartado-cab .ap-titulo')).map(x => x.textContent),
            !!sc.querySelector('.paso-mas-ajustes-boton')];
  }), ['Título del hito', 'Tareas de este hito (1)', ['Explicación del hito', 'Otros'], false]);
await pagina.click('#guia-pasos .subpaso-editor[data-id="a1"] > .paso-apartado-cab[data-ap="otros"]');
await comprobar('«Otros»: la casilla de pregunta, con su nueva frase',
  pagina.evaluate(() => document.querySelector('#guia-pasos .subpaso-editor[data-id="a1"] > .paso-es-pregunta-fila span').textContent),
  'Este hito es una pregunta: el trámite sigue por un camino o por otro');

/* ================= 9 ================= */
console.log('--- 9. desde Ajustes, la ficha y las plantillas se abre este editor ---');
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(async (GUIA) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const f = await g.getFileHandle('guias.json', { create: true });
  const w = await f.createWritable();
  await w.write(JSON.stringify({ FACTURA: GUIA }));
  await w.close();
}, GUIA);
await pagina.evaluate(() => { window.__escrita = GuiasDelCentro.escribir('FACTURA', { irA: 'p3' }); });
await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
await comprobar('GuiasDelCentro.escribir abre el editor nuevo con el hito pedido elegido',
  pagina.evaluate(() => [document.querySelector('#capa .cuadro').classList.contains('cuadro-guia'),
    document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo').textContent]),
  [true, 'Esperar el parte de alta con un título bastante largo para leerlo entero']);
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => { window.__escrita = GuiasDelCentro.escribir('FACTURA'); });
await pagina.waitForFunction(() => { const e = document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo'); return e && e.textContent === 'Recibir el parte de baja'; });
await comprobar('sin hito pedido (ficha, mesa), el primero, elegido',
  pagina.evaluate(() => document.querySelector('#guia-lista .guia-lista-item.elegido .guia-lista-titulo').textContent), 'Recibir el parte de baja');
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => { window.__escrita = GuiasDelCentro.escribir('TIPO NUEVO'); });
await pagina.waitForFunction(() => document.querySelectorAll('#guia-pasos .paso-editor').length === 0 && !document.getElementById('capa').classList.contains('oculto'));
await comprobar('una guía vacía: la derecha dice «Añade el primer hito» y no enseña nada más',
  pagina.evaluate(() => [document.getElementById('guia-vacio-der').textContent, document.getElementById('guia-vacio-der').offsetParent !== null,
    document.querySelectorAll('#guia-pasos .paso-editor').length]), ['Añade el primer hito', true, 0]);
await pagina.click('#guia-anadir');
await comprobar('«+ Añadir un hito» lo deja elegido, con el cursor en su título',
  pagina.evaluate(() => [document.getElementById('guia-vacio-der').classList.contains('oculto'),
    document.activeElement === document.querySelector('#guia-pasos > .paso-editor:not(.paso-plegado) .paso-titulo')]), [true, true]);
await pagina.click('#cuadro-cancelar');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
