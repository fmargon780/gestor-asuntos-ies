/* Prueba de la fila 416 (docs/HITOS-UN-SOLO-SITIO.md, parte A), sin navegador, con `vm` (mismo patrón que
   pruebas/orden-de-la-guia-llega-a-los-asuntos.mjs): lo que se cambia o se quita en la guía llega a los hitos
   «sin empezar» de los asuntos abiertos; los empezados no se tocan. */
import fs from 'node:fs';
import vm from 'node:vm';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const leerFuente = (r) => fs.readFileSync(new URL('../js/' + r, import.meta.url), 'utf8');

function nuevoContexto(opciones) {
  opciones = opciones || {};
  const disco = { hitos: opciones.hitosJson || null, escrituras: 0 };
  const ctx = {
    console, setTimeout, clearTimeout,
    document: { getElementById: () => null, readyState: 'complete', addEventListener: () => {} },
    App: {
      E: { usuario: 'Francisco', listaAbiertos: opciones.abiertos || [] },
      anotar: async () => {},
      tipoDeAsunto: (a) => a.leido.tipo
    },
    Gestor: {
      carpetaGestor: () => ({ nombre: '_GESTOR' }),
      asuntos: () => (opciones.abiertos || []).slice()
    },
    Guias: {
      esPregunta: (p) => !!(p && p.opciones && p.opciones.length),
      normalizarNormativa: (n) => (Array.isArray(n) ? n : [])
    },
    Carpetas: { leerJson: async () => (disco.hitos ? JSON.parse(JSON.stringify(disco.hitos)) : null) },
    Copias: { guardar: async (g, nombre, datos) => { disco.escrituras++; disco.hitos = JSON.parse(JSON.stringify(datos)); } }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(leerFuente('util.js'), ctx, { filename: 'util.js' });
  for (const f of ['util-parecidos.js', 'util-pantalla.js']) vm.runInContext(leerFuente(f), ctx, { filename: f });
  for (const f of ['plazos.js', 'hitos.js', 'hitos-sincronizar.js', 'hitos-desde-el-asunto.js']) vm.runInContext(leerFuente(f), ctx, { filename: f });
  return { ctx, disco, Hitos: ctx.Hitos, D: ctx.HitosDesdeElAsunto };
}

const paso = (id, extra) => Object.assign({ id, titulo: 'Paso ' + id, cuerpo: '', opciones: [] }, extra || {});
const guia = (...xs) => xs.map((x) => paso(x));
const ABC = guia('a', 'b', 'c');
const abierto = (nombre, tipo, extra) => Object.assign({ nombre, leido: { tipo } }, extra || {});
const copia = (x) => JSON.parse(JSON.stringify(x));
const por = (lista, id) => lista.filter((h) => h.origenGuia === id)[0];

function lista(Hitos, pasos, est) {
  const h = pasos.map(Hitos.pasoAHito);
  (est || []).forEach((e, i) => { if (e) h[i].estado = e; });
  return h;
}
function cambiarTitulo(pasos, id, titulo) { const g = copia(pasos); g.filter((p) => p.id === id)[0].titulo = titulo; return g; }

console.log('--- 1. «empezado» según estaVacio ---');
{
  const { Hitos, D } = nuevoContexto();
  const base = () => lista(Hitos, ABC)[0];
  comprobar('1. limpio', D.estaVacio(base(), 'X'), true);
  const casos = {
    'tarea marcada': (h) => { h.guionHecho = { t1: { hecho: true } }; },
    'tarea propia': (h) => { h.guionPropio = [{ id: 'p', texto: 'x' }]; },
    'responsable cambiado aquí': (h) => { h.cambioAqui = true; },
    'tarea de la guía escondida': (h) => { h.guionOcultos = ['t1']; },
    'pregunta cambiada aquí': (h) => { h.guionTextos = { q: 'otro texto' }; },
    'varios documentos cambiado aquí': (h) => { h.variosPropio = true; },
    'fecha a mano': (h) => { h.fechaManual = true; },
    'hecho': (h) => { h.estado = 'hecho'; }
  };
  for (const [nombre, f] of Object.entries(casos)) {
    const h = base(); f(h);
    comprobar('1. empezado: ' + nombre, D.estaVacio(h, 'X'), false);
  }
  const h = base(); h.estado = 'encurso';
  comprobar('1. «en curso» solo no cuenta', D.estaVacio(h, 'X'), true);
  const c = base(); c.cambioAqui = true;
  comprobar('1. cambiado aquí: se puede borrar (sin trabajo)', D.sinTrabajo(c, 'X'), true);
}

console.log('--- 2. un hito cambiado en la guía: llega al que no ha empezado, no al empezado ---');
{
  const { Hitos, D } = nuevoContexto();
  const sin = lista(Hitos, ABC);
  const con = lista(Hitos, ABC); con[1].guionHecho = { t: { hecho: true } };
  const aqui = lista(Hitos, ABC); aqui[1].cambioAqui = true; aqui[1].titulo = 'Mío';
  const ahora = cambiarTitulo(ABC, 'b', 'Nuevo título');
  ahora[1].responsable = 'secretaria';
  ahora[1].plazo = { dias: 5, desde: '', cuenta: 'habiles' };
  ahora[1].soloInformativo = true;
  const k1 = Hitos.cambiosDeLaGuia(sin, ABC, ahora, (h) => D.estaVacio(h, 'X'));
  comprobar('2. sin empezar: título', por(k1.hitos, 'b').titulo, 'Nuevo título');
  comprobar('2. sin empezar: responsable', por(k1.hitos, 'b').responsable, 'secretaria');
  comprobar('2. sin empezar: plazo', por(k1.hitos, 'b').plazo.dias, 5);
  comprobar('2. «solo informativo» no se copia', por(k1.hitos, 'b').soloInformativo, false);
  comprobar('2. los demás, igual', por(k1.hitos, 'a').titulo, 'Paso a');
  comprobar('2. cuenta', [k1.cambiados, k1.quitados, k1.saltados], [1, 0, 0]);
  const k2 = Hitos.cambiosDeLaGuia(con, ABC, ahora, (h) => D.estaVacio(h, 'X'));
  comprobar('2. empezado: se queda', por(k2.hitos, 'b').titulo, 'Paso b');
  comprobar('2. empezado: cuenta', [k2.cambiados, k2.quitados, k2.saltados], [0, 0, 1]);
  const k3 = Hitos.cambiosDeLaGuia(aqui, ABC, ahora, (h) => D.estaVacio(h, 'X'));
  comprobar('2. cambiado a mano aquí: se queda', por(k3.hitos, 'b').titulo, 'Mío');
  comprobar('2. la lista de entrada no cambia', sin.map((h) => h.titulo), ['Paso a', 'Paso b', 'Paso c']);
  const k4 = Hitos.cambiosDeLaGuia(sin, ABC, ABC, (h) => D.estaVacio(h, 'X'));
  comprobar('2. sin cambios en la guía: nada', [k4.cambiados, k4.quitados, k4.saltados], [0, 0, 0]);
}

console.log('--- 3. un hito quitado de la guía: se va del que no ha empezado, se queda (con sus tareas) en el empezado ---');
{
  const { Hitos, D } = nuevoContexto();
  const guiaConTareas = copia(ABC);
  guiaConTareas[1].guion = [
    { id: 't1', texto: 'Avisar', explicacion: 'e', accion: '' },
    { id: 't2', texto: 'Firmar', explicacion: '', accion: '' }
  ];
  const sin = lista(Hitos, guiaConTareas, [null, 'encurso']);
  const con = lista(Hitos, guiaConTareas); con[1].guionHecho = { t1: { hecho: true, quien: 'F' } };
  const ahora = guiaConTareas.filter((p) => p.id !== 'b');
  const k1 = Hitos.cambiosDeLaGuia(sin, guiaConTareas, ahora, (h) => D.estaVacio(h, 'X'));
  comprobar('3. sin empezar: se va', k1.hitos.map((h) => h.origenGuia), ['a', 'c']);
  comprobar('3. cuenta', [k1.cambiados, k1.quitados, k1.saltados], [0, 1, 0]);
  const k2 = Hitos.cambiosDeLaGuia(con, guiaConTareas, ahora, (h) => D.estaVacio(h, 'X'));
  comprobar('3. empezado: se queda', k2.hitos.map((h) => h.origenGuia), ['a', 'b', 'c']);
  const b = por(k2.hitos, 'b');
  comprobar('3. sus tareas pasan a «solo aquí» con los mismos ids', b.guionPropio.map((g) => g.id), ['t1', 't2']);
  comprobar('3. con su texto', b.guionPropio.map((g) => g.texto), ['Avisar', 'Firmar']);
  comprobar('3. lo marcado se conserva', b.guionHecho.t1.hecho, true);
  comprobar('3. cuenta del empezado', [k2.quitados, k2.saltados, k2.tareasCopiadas], [0, 1, 1]);
}

console.log('--- 4. dentro de una pregunta, a cualquier profundidad ---');
{
  const { Hitos, D } = nuevoContexto();
  const pregunta = () => ({ id: 'q', titulo: '¿Cómo?', cuerpo: '', opciones: [
    { id: 'o1', titulo: 'Uno', pasos: [paso('x'), paso('y')] },
    { id: 'o2', titulo: 'Dos', pasos: [paso('z')] }
  ] });
  const antes = [paso('a'), pregunta()];
  const ahora = copia(antes);
  ahora[1].opciones[0].pasos[0].titulo = 'X cambiado';
  ahora[1].opciones[0].pasos = ahora[1].opciones[0].pasos.filter((p) => p.id !== 'y');
  ahora[1].opciones[1].titulo = 'Dos bis';
  const h = lista(Hitos, antes);
  h[1].elegida = 'o1';   /* la pregunta está respondida: empezada */
  const k = Hitos.cambiosDeLaGuia(h, antes, ahora, (x) => D.estaVacio(x, 'X'));
  const q = por(k.hitos, 'q');
  comprobar('4. la pregunta respondida se queda', q.elegida, 'o1');
  comprobar('4. el hito de dentro (sin empezar) cambia', q.opciones[0].hitos[0].titulo, 'X cambiado');
  comprobar('4. el quitado de dentro se va', q.opciones[0].hitos.map((x) => x.origenGuia), ['x']);
  comprobar('4. la pregunta respondida no cambia el texto de las respuestas', q.opciones[1].texto, 'Dos');
  const sinResponder = lista(Hitos, antes);
  const k5 = Hitos.cambiosDeLaGuia(sinResponder, antes, ahora, (x) => D.estaVacio(x, 'X'));
  comprobar('4. sin responder, el texto de la respuesta llega', por(k5.hitos, 'q').opciones[1].texto, 'Dos bis');
}

console.log('--- 5. llevarGuiaAAbiertos: solo los abiertos sin empezar, y las cuentas ---');
{
  const c0 = nuevoContexto();
  const mk = () => lista(c0.Hitos, ABC, ['hecho', 'encurso']);
  const conTrabajo = mk(); conTrabajo[1].guionPropio = [{ id: 'p', texto: 'algo' }]; conTrabajo[2].guionPropio = [{ id: 'p', texto: 'algo' }];
  const { Hitos, disco, ctx } = nuevoContexto({
    abiertos: [abierto('M1', 'MAT'), abierto('M2', 'MAT'), abierto('B1', 'BECA'), abierto('ACTUAL', 'MAT')],
    hitosJson: { ajustes: {}, porAsunto: {
      M1: { creados: '', hitos: mk() }, M2: { creados: '', hitos: conTrabajo },
      B1: { creados: '', hitos: mk() }, ACTUAL: { creados: '', hitos: mk() }, ARCHIVADO: { creados: '', hitos: mk() }
    } }
  });
  const ahora = cambiarTitulo(ABC, 'c', 'C nuevo');
  const r = await Hitos.llevarGuiaAAbiertos('MAT', ahora, ABC, 'ACTUAL');
  comprobar('5. cambiados', r.cambiados, 2);
  comprobar('5. saltados (M2 tiene trabajo)', r.saltados, 1);
  comprobar('5. tocados y otros (sin el actual)', [r.tocados, r.otros], [2, 1]);
  comprobar('5. M1 cambia', por(disco.hitos.porAsunto.M1.hitos, 'c').titulo, 'C nuevo');
  comprobar('5. M2 no', por(disco.hitos.porAsunto.M2.hitos, 'c').titulo, 'Paso c');
  comprobar('5. otro tipo no', por(disco.hitos.porAsunto.B1.hitos, 'c').titulo, 'Paso c');
  comprobar('5. archivo no', por(disco.hitos.porAsunto.ARCHIVADO.hitos, 'c').titulo, 'Paso c');
  comprobar('5. una sola escritura', disco.escrituras, 1);
  comprobar('5. el frase verde', ctx.Hitos.textoDelReparto(r),
    'Los cambios han llegado a 2 asuntos abiertos. En 1 no se ha tocado porque ya tenía trabajo.');

  /* Quitar el hito en curso: el siguiente pasa a estar en curso, y el id no vuelve. */
  const r2 = await Hitos.llevarGuiaAAbiertos('MAT', guia('a', 'c').map((p, i) => (i === 1 ? Object.assign(p, { titulo: 'C nuevo' }) : p)), ahora, 'ACTUAL');
  comprobar('5. quitado', [r2.quitados, r2.saltados], [2, 1]);
  const m1 = disco.hitos.porAsunto.M1;
  comprobar('5. M1 sin el hito', m1.hitos.map((h) => h.origenGuia), ['a', 'c']);
  comprobar('5. el siguiente pasa a en curso', m1.hitos.map((h) => h.estado), ['hecho', 'encurso']);
  comprobar('5. el id sigue en pasosConocidos', m1.pasosConocidos.indexOf('b') !== -1, true);
  comprobar('5. M2 (con trabajo) lo conserva', disco.hitos.porAsunto.M2.hitos.map((h) => h.origenGuia), ['a', 'b', 'c']);
  const r3 = await Hitos.llevarGuiaAAbiertos('MAT', guia('a', 'c'), guia('a', 'c'), 'ACTUAL');
  comprobar('5. otra vez lo mismo: nada', [r3.cambiados, r3.quitados, r3.tocados], [0, 0, 0]);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
