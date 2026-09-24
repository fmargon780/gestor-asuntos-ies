/* Prueba de lógica, sin navegador (fila 113, 24-sep-2026,
   docs/MAPA-DE-LA-GUIA.md): `GuiasMapa.html`, la función pura que
   dibuja el mapa de la guía, y `GuiasNiveles.caminoHasta`.

   Se carga js/guias-mapa.js y js/guias-niveles.js en un contexto de
   `vm` y se lee el HTML que devuelve con jsdom.

   Con una guía de dos niveles de preguntas (ramas, respuestas y pasos
   comunes después):
   1. Sin hitos: los pasos en orden, las ramas una al lado de otra con
      su respuesta encima, la pregunta marcada, los pasos comunes
      detrás, el paso «solo informativo» en gris y todo pulsable.
   2. Con hitos: el camino elegido resaltado con el estado de cada
      hito; la rama no elegida y la pregunta sin responder, en gris y
      sin pulsar; un hito añadido a mano, en «Fuera de la guía».
   3. `caminoHasta`: el nivel de un paso de dentro de dos preguntas. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {}, document: {} };
vm.createContext(contexto);
for (const f of ['guias-niveles.js', 'guias-mapa.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const { GuiasMapa, GuiasNiveles } = contexto.window;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const GUIA = [
  { id: 'a', titulo: 'Recoger la solicitud', responsable: 'yo', plazo: { dias: 5, desde: '' }, opciones: [] },
  { id: 'q1', titulo: '¿Qué supuesto es?', opciones: [
    { id: 'o1', titulo: 'Ordinario', pasos: [
      { id: 'b', titulo: 'Grabar en Séneca', opciones: [] },
      { id: 'q2', titulo: '¿Hay informe?', opciones: [
        { id: 'o21', titulo: 'Sí', pasos: [{ id: 'c', titulo: 'Adjuntar el informe', opciones: [] }] },
        { id: 'o22', titulo: 'No', pasos: [{ id: 'd', titulo: 'Pedir el informe', opciones: [] }] }
      ] }
    ] },
    { id: 'o2', titulo: 'Extraordinario', pasos: [{ id: 'e', titulo: 'Pedir informe a la Delegación', opciones: [] }] }
  ] },
  { id: 'f', titulo: 'Avisar a la familia', soloInformativo: true, opciones: [] },
  { id: 'g', titulo: 'Archivar el expediente', opciones: [] }
];

function leer(html) { return new JSDOM('<body>' + html + '</body>').window.document; }
const texto = (el) => el.querySelector('.mapa-titulo').textContent;

/* ---------- 1 ---------- */
const d1 = leer(GuiasMapa.html(GUIA, { responsable: (id) => (id === 'yo' ? 'Francisco' : '') }));
const arriba = d1.querySelector('.mapa-lienzo > .mapa-columna');
comprobar('1. los pasos de arriba, en orden',
  [...arriba.querySelectorAll(':scope > .mapa-nodo > .mapa-caja')].map(texto),
  ['Recoger la solicitud', '¿Qué supuesto es?', 'Avisar a la familia', 'Archivar el expediente']);
comprobar('1. la línea pequeña: responsable y plazo',
  d1.querySelector('.mapa-caja[data-id="a"] .mapa-meta').textContent, 'Francisco · 5 días');
const q1 = d1.querySelector('.mapa-caja[data-id="q1"]');
comprobar('1. la pregunta, marcada', [q1.classList.contains('mapa-pregunta'), q1.querySelector('.mapa-marca').textContent], [true, 'pregunta']);
const ramas1 = q1.parentNode.querySelectorAll(':scope > .mapa-ramas > .mapa-rama');
comprobar('1. sus dos ramas, con la respuesta encima',
  [...ramas1].map((r) => r.querySelector(':scope > .mapa-respuesta').textContent), ['Ordinario', 'Extraordinario']);
comprobar('1. la pregunta de dentro se abre igual, a otro nivel',
  [...d1.querySelector('.mapa-caja[data-id="q2"]').parentNode.querySelectorAll(':scope > .mapa-ramas > .mapa-rama')]
    .map((r) => [r.querySelector('.mapa-respuesta').textContent, texto(r.querySelector('.mapa-caja'))]),
  [['Sí', 'Adjuntar el informe'], ['No', 'Pedir el informe']]);
comprobar('1. «solo informativo», en gris', d1.querySelector('.mapa-caja[data-id="f"]').classList.contains('mapa-informativo'), true);
comprobar('1. sin hitos, todas las cajas se pueden pulsar',
  d1.querySelectorAll('.mapa-caja').length === d1.querySelectorAll('.mapa-caja.mapa-pulsable').length, true);
comprobar('1. sin «Fuera de la guía»', d1.querySelector('.mapa-fuera'), null);

/* ---------- 2 ---------- */
const HITOS = [
  { id: 'a', titulo: 'Recoger la solicitud', estado: 'hecho', opciones: [] },
  { id: 'q1', titulo: '¿Qué supuesto es?', clase: 'decision', estado: 'hecho', elegida: 'o1', opciones: [
    { id: 'o1', hitos: [
      { id: 'b', estado: 'encurso', opciones: [] },
      { id: 'q2', clase: 'decision', estado: 'pendiente', elegida: null, opciones: [
        { id: 'o21', hitos: [{ id: 'c', estado: 'pendiente', opciones: [] }] },
        { id: 'o22', hitos: [{ id: 'd', estado: 'pendiente', opciones: [] }] }] }] },
    { id: 'o2', hitos: [{ id: 'e', estado: 'noaplica', opciones: [] }] }] },
  { id: 'f', estado: 'pendiente', opciones: [] },
  { id: 'g', estado: 'pendiente', opciones: [] },
  { id: 'x9', titulo: 'Llamar a la inspección', estado: 'pendiente', opciones: [] }
];
const d2 = leer(GuiasMapa.html(GUIA, { hitos: HITOS }));
const caja = (id) => d2.querySelector('.mapa-lienzo .mapa-caja[data-id="' + id + '"]');
comprobar('2. el camino elegido, resaltado y pulsable',
  ['a', 'q1', 'b', 'q2', 'f', 'g'].map((id) => caja(id).classList.contains('mapa-en-camino') && caja(id).classList.contains('mapa-pulsable')),
  [true, true, true, true, true, true]);
comprobar('2. cada caja del camino, con el estado de su hito',
  ['a', 'b', 'f'].map((id) => caja(id).querySelector('.mapa-estado').textContent), ['Hecho', 'En curso', 'Pendiente']);
comprobar('2. la rama no elegida, en gris y sin pulsar',
  [caja('e').classList.contains('mapa-gris'), caja('e').classList.contains('mapa-pulsable'),
   caja('e').closest('.mapa-rama').classList.contains('mapa-rama-gris')], [true, false, true]);
comprobar('2. la pregunta sin responder: sus dos ramas, en gris',
  ['c', 'd'].map((id) => caja(id).classList.contains('mapa-gris') && !caja(id).classList.contains('mapa-pulsable')), [true, true]);
comprobar('2. la respuesta elegida, marcada',
  [...d2.querySelectorAll('.mapa-rama-elegida > .mapa-respuesta')].map((r) => r.textContent), ['Ordinario']);
comprobar('2. el hito añadido a mano, «Fuera de la guía»',
  [...d2.querySelectorAll('.mapa-fuera .mapa-caja')].map((c) => [c.dataset.id, texto(c), c.classList.contains('mapa-pulsable')]),
  [['x9', 'Llamar a la inspección', true]]);

/* ---------- 3 ---------- */
comprobar('3. caminoHasta: dentro de dos preguntas',
  GuiasNiveles.caminoHasta(GUIA, 'd').map((t) => [t.pregunta, t.opcion]),
  [['¿Qué supuesto es?', 'Ordinario'], ['¿Hay informe?', 'No']]);
comprobar('3. caminoHasta: arriba, y un id que no está',
  [GuiasNiveles.caminoHasta(GUIA, 'g'), GuiasNiveles.caminoHasta(GUIA, 'zz')], [[], null]);

if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
