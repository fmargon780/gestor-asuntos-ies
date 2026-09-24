/* Prueba de lógica, sin navegador (fila 116, 24-sep-2026,
   docs/PREGUNTAS-EN-EL-GUION.md): las preguntas dentro del guion de un
   hito. Se cargan js/guias-guion.js y js/hitos-guion.js en un contexto de
   `vm`, con un `Hitos` de mentira que guarda en memoria.

   1. `GuiasGuion.normalizar`: una pregunta con sus respuestas y líneas;
      un solo nivel (una línea de una respuesta pierde la marca), y la
      pregunta no lleva acción ni normativa.
   2. `Hitos.guionDe` sin responder: la pregunta y las líneas normales,
      sin las de ninguna respuesta; la cuenta «N de M».
   3. Responder: salen las líneas de esa respuesta, detrás de la
      pregunta; la pregunta cuenta como hecha.
   4. Cambiar de respuesta con una línea ya marcada: esa línea queda en
      `.plegadas`, no se pierde.
   5. El marcado automático busca dentro de la respuesta elegida, nunca
      en una no elegida. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

let n = 0;
const datos = { porAsunto: {} };
function buscar(lista, id) {
  for (const h of lista || []) {
    if (h.id === id) return h;
    for (const o of h.opciones || []) { const r = buscar(o.hitos, id); if (r) return r; }
  }
  return null;
}
const Hitos = {
  buscar,
  leer: async () => JSON.parse(JSON.stringify(datos)),
  cambiar: async (fn) => { const d = fn(datos); return JSON.parse(JSON.stringify(d || datos)); }
};
const U = { nuevoId: (p) => (p || 'x') + (++n), ahora: () => '2026-09-24T10:00:00', accesorio: () => {} };
const GUIA = [{ id: 'p1', titulo: 'Recibir solicitud', opciones: [], guion: [] }];
const GuiasDelCentro = { pasosDe: () => GUIA };
const App = { E: { usuario: 'Francisco', listaAbiertos: [] } };
const window = { Hitos, U, GuiasDelCentro, App };
const contexto = { console, window, Hitos, U, GuiasDelCentro, App };
vm.createContext(contexto);
for (const f of ['guias-guion.js', 'hitos-guion.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const GuiasGuion = window.GuiasGuion;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- 1 ---------- */
const crudo = [
  { id: 'g1', texto: 'Sellar la solicitud', accion: '' },
  { id: 'q1', texto: '¿Viene con toda la documentación?', pregunta: true, accion: 'generar', normativa: { cita: 'X' }, opciones: [
    { id: 'si', texto: 'Sí', lineas: [{ id: 'l1', texto: 'Registrarla', accion: 'registrar' }] },
    { id: 'no', texto: 'No', lineas: [
      { id: 'l2', texto: 'Pedir que la complete', accion: 'comunicar' },
      { id: 'l3', texto: 'Una pregunta dentro (no vale)', pregunta: true, opciones: [{ id: 'z', texto: 'z', lineas: [] }] }
    ] }
  ] },
  { id: 'g2', texto: 'Comprobar el pago', accion: 'comunicar' }
];
const guion = GuiasGuion.normalizar(crudo);
comprobar('1. la pregunta se queda con sus dos respuestas', [guion[1].pregunta, guion[1].opciones.map((o) => o.texto)], [true, ['Sí', 'No']]);
comprobar('1. la pregunta no lleva acción ni normativa', ['accion' in guion[1], 'normativa' in guion[1]], [false, false]);
comprobar('1. un solo nivel: la línea de dentro pierde la marca',
  [guion[1].opciones[1].lineas[1].pregunta, guion[1].opciones[1].lineas[1].opciones], [undefined, undefined]);
comprobar('1. las líneas normales no ganan la marca', guion[0].pregunta, undefined);

GUIA[0].guion = guion;
const A = { nombre: 'ASUNTO 1', leido: { tipo: 'MATRICULA' }, ficha: {} };
App.E.listaAbiertos = [A];
datos.porAsunto[A.nombre] = { hitos: [{ id: 'p1', origenGuia: 'p1', clase: 'paso', estado: 'encurso', opciones: [] }] };
const hito = () => buscar(datos.porAsunto[A.nombre].hitos, 'p1');
const vistas = () => Hitos.guionDe(A, hito()).map((g) => g.id);

/* ---------- 2 ---------- */
comprobar('2. sin responder: la pregunta y las líneas normales, nada de las respuestas', vistas(), ['g1', 'q1', 'g2']);
comprobar('2. la cuenta: la pregunta sin responder, pendiente', Hitos.cuentaGuion(Hitos.guionDe(A, hito())), { hechos: 0, total: 3 });

/* ---------- 3 ---------- */
await Hitos.elegirEnGuion(A.nombre, 'p1', 'q1', 'no');
comprobar('3. respondida «No»: sus líneas, detrás de la pregunta', vistas(), ['g1', 'q1', 'l2', 'l3', 'g2']);
comprobar('3. la pregunta respondida cuenta como hecha', Hitos.cuentaGuion(Hitos.guionDe(A, hito())), { hechos: 1, total: 5 });
comprobar('3. la pregunta sabe cuál está elegida', Hitos.guionDe(A, hito())[1].elegida, 'no');

/* ---------- 5 (antes de cambiar) ---------- */
const marcado = await Hitos.marcarGuionPorAccion(A, 'p1', 'comunicar');
comprobar('5. «comunicar» marca la línea de la respuesta elegida, que va antes que la de abajo', marcado && marcado.id, 'l2');
comprobar('5. y no una línea de una respuesta no elegida',
  await Hitos.marcarGuionPorAccion(A, 'p1', 'registrar'), null);

/* ---------- 4 ---------- */
await Hitos.elegirEnGuion(A.nombre, 'p1', 'q1', 'si');
const tras = Hitos.guionDe(A, hito());
comprobar('4. cambiada a «Sí»: salen sus líneas y no las de «No»', tras.map((g) => g.id), ['g1', 'q1', 'l1', 'g2']);
comprobar('4. lo marcado de «No» queda plegado, con su respuesta',
  tras.plegadas.map((g) => [g.id, g.hecho, g.deOpcion.respuesta]), [['l2', true, 'No']]);
comprobar('4. la cuenta, solo con lo que se ve', Hitos.cuentaGuion(tras), { hechos: 1, total: 4 });
comprobar('4. volver a «No» recupera lo marcado',
  (await Hitos.elegirEnGuion(A.nombre, 'p1', 'q1', 'no'), Hitos.guionDe(A, hito()).filter((g) => g.id === 'l2')[0].hecho), true);

if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
