/* Fila 531 (docs/531-TAREAS-E-HITOS-COMUNES.md): la lógica de las listas comunes de tareas y de hitos (js/comunes.js),
   sin navegador, con `vm`, como pruebas/campos-pasos.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
/* Sin navegador: un `document` y un `DOMParser` de mentira (limpiar() de js/guias.js deja el texto de las explicaciones vacío). */
const nodo = () => ({ innerHTML: '', textContent: '', childNodes: [], querySelector: () => null, appendChild() {}, setAttribute() {} });
const contexto = { console, window: {}, document: { createElement: nodo }, DOMParser: class { parseFromString() { return { getElementById: () => nodo() }; } } };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'plazos.js', 'guias-guion.js', 'guias.js', 'comunes.js']) {
  if (!fs.existsSync(raiz + f)) continue;
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
contexto.window.GuiasGuion = contexto.GuiasGuion;
contexto.window.Guias = contexto.Guias;
contexto.window.U = contexto.U;
const { Comunes, GuiasGuion, Guias } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

console.log('--- 1. la lista fija de lo que hace una tarea ---');
comprobar('nueve clases, la última «Otra cosa»', Comunes.HACE.map((h) => h.texto),
  ['Generar documento', 'Firmar', 'Registrar', 'Comunicar', 'Añadir documento', 'Pedir datos', 'Copiar a otra carpeta', 'Llamar por teléfono', 'Otra cosa']);
comprobar('una acción desconocida es «Otra cosa»', Comunes.normalizarTarea({ nombre: 'X', accion: 'inventada' }).accion, '');
comprobar('una tarea de generar guarda su plantilla', Comunes.normalizarTarea({ nombre: 'G', accion: 'generar', receta: { plantilla: 'p1', basura: 1 } }).receta, { plantilla: 'p1' });
comprobar('una tarea sin nombre se descarta del fichero', Comunes.normalizarFichero('tareas', { tareas: [{ nombre: ' ' }, { nombre: 'Vale' }] }).tareas.map((t) => t.nombre), ['Vale']);
comprobar('un fichero que no existe sale vacío', Comunes.normalizarFichero('hitos', null), { version: 1, hitos: [] });
comprobar('un hito repite una tarea una sola vez', Comunes.normalizarHito({ nombre: 'H', tareas: ['a', 'a', 'b', 7] }).tareas, ['a', 'b']);

console.log('--- 2. nombres parecidos ---');
const lista = [{ id: '1', nombre: 'Generar la resolución de baja' }, { id: '2', nombre: 'Firmar por la Dirección' }, { id: '3', nombre: 'Anotar en Séneca' }];
comprobar('«resolución» se parece a la primera', Comunes.parecidas('La resolución', lista).map((x) => x.id), ['1']);
comprobar('el mismo nombre con otras mayúsculas y tildes', Comunes.parecidas('FIRMAR POR LA DIRECCION', lista).map((x) => x.id), ['2']);
comprobar('nada parecido', Comunes.parecidas('Pedir cita', lista), []);
comprobar('existeNombre ignora tildes y mayúsculas, y a sí mismo', [Comunes.existeNombre(lista, 'anotar en seneca'), Comunes.existeNombre(lista, 'anotar en seneca', '3')], [true, false]);

console.log('--- 3. de la lista a la guía ---');
const tc = Comunes.normalizarTarea({ id: 'tc1', nombre: 'Generar la resolución', accion: 'generar', receta: { plantilla: 'p1' } });
const linea = Comunes.lineaDeTarea(tc);
comprobar('la línea lleva su marca y su retrato', [linea.comun, linea.texto, linea.accion, linea.receta], ['tc1', 'Generar la resolución', 'generar', { plantilla: 'p1' }]);
comprobar('la marca sobrevive a normalizar el guion de la guía', GuiasGuion.normalizar([linea])[0].comun, 'tc1');
comprobar('una línea sin marca no la inventa', 'comun' in GuiasGuion.normalizar([{ texto: 'Suelta' }])[0], false);
const hc = Comunes.normalizarHito({ id: 'hc1', nombre: 'Elaborar la resolución', explicacion: 'Se preparan los documentos.', tareas: ['tc1', 'tcX'] });
const paso = Comunes.pasoDeHito(hc, [tc]);
comprobar('el hito común trae sus tareas (las que existen) y sin plazo', [paso.comun, paso.titulo, paso.guion.length, paso.guion[0].comun, paso.plazo], ['hc1', 'Elaborar la resolución', 1, 'tc1', null]);
comprobar('la marca del hito sobrevive a normalizar la guía', Guias.normalizar([paso])[0].comun, 'hc1');
comprobar('un hito pregunta no lleva marca', 'comun' in Guias.normalizar([{ titulo: 'P', comun: 'x', opciones: [{ id: 'o1', texto: 'Sí', pasos: [{ titulo: 'Dentro' }] }] }])[0], false);

console.log('--- 4. dónde se usa ---');
const guias = {
  A: Guias.normalizar([paso, { titulo: 'Otro', cuerpo: '' }]),
  B: Guias.normalizar([Comunes.pasoDeHito(hc, [tc])]),
  C: Guias.normalizar([{ titulo: 'Con tarea', guion: [Comunes.lineaDeTarea(tc)] }])
};
const uso = Comunes.usos(guias);
comprobar('la tarea está en A, B y C', uso.tareas.tc1, ['A', 'B', 'C']);
comprobar('el hito está en A y B', uso.hitos.hc1, ['A', 'B']);
comprobar('texto de usos', [Comunes.textoUsos(['A']), Comunes.textoUsos(['A', 'B']), Comunes.textoUsos([])], ['se usa en 1 tipo', 'se usa en 2 tipos', 'todavía no se usa en ningún tipo']);

console.log('--- 5. cambiar la tarea y el hito ---');
const nueva = Object.assign({}, tc, { nombre: 'Generar la resolución de baja', receta: { plantilla: 'p2' } });
const antesJson = JSON.stringify(guias);
const r = Comunes.cambiarTareaEnGuias(guias, nueva);
comprobar('cambia en las guías de esos tipos', r.tipos.sort(), ['A', 'B', 'C']);
comprobar('cada línea trae el retrato nuevo', [r.guias.A[0].guion[0].texto, r.guias.A[0].guion[0].receta, r.guias.C[0].guion[0].texto], ['Generar la resolución de baja', { plantilla: 'p2' }, 'Generar la resolución de baja']);
comprobar('guarda cómo eran las líneas, para dejar los otros asuntos como estaban', r.antes.A[0].linea.texto, 'Generar la resolución');
comprobar('no toca las guías de entrada', JSON.stringify(guias), antesJson);
comprobar('lo que no lleva la marca no cambia', r.guias.A[1], guias.A[1]);
const rh = Comunes.cambiarHitoEnGuias(guias, Object.assign({}, hc, { nombre: 'Preparar la resolución', explicacion: 'Nueva explicación.' }));
comprobar('cambia el hito en A y B, con sus tareas como estaban', [rh.tipos.sort(), rh.guias.A[0].titulo, rh.guias.B[0].titulo, rh.guias.A[0].guion.length, rh.guias.A[1].titulo], [['A', 'B'], 'Preparar la resolución', 'Preparar la resolución', 1, 'Otro']);

console.log('--- 6. la propuesta de pasar las guías de hoy ---');
const de = (tipo, titulo, lineas) => ({ tipo, paso: { titulo, cuerpo: 'Explicación de ' + titulo, guion: lineas } });
const g = (texto, accion, plantilla) => ({ id: texto + accion + (plantilla || ''), texto, accion: accion || '', receta: plantilla ? { plantilla } : undefined });
const antiguas = {
  BAJA: Guias.normalizar([{ titulo: 'Firma', cuerpo: 'Dirección firma', guion: [g('Firmar por la Dirección', 'firmar'), g('Generar la resolución', 'generar', 'p1')] },
    { titulo: 'Comunicar', cuerpo: '', guion: [g('Enviar el correo', 'comunicar', 'c1')] }]),
  ACTIVIDAD: Guias.normalizar([{ titulo: 'Firma', cuerpo: 'Dirección firma', guion: [g('Firmar por la Dirección', 'firmar'), g('Generar la resolución', 'generar', 'p1')] },
    { titulo: 'Comunicar', cuerpo: '', guion: [g('Enviar el correo', 'comunicar', 'c2')] }]),
  PREGUNTAS: Guias.normalizar([{ titulo: 'Decide', cuerpo: '', opciones: [{ id: 'o1', texto: 'Sí', pasos: [{ titulo: 'Dentro', guion: [g('Algo', '')] }] }] },
    { titulo: 'Con pregunta', guion: [{ id: 'q', texto: '¿Viene completo?', pregunta: true, opciones: [{ id: 'q1', texto: 'Sí', lineas: [g('Seguir', '')] }] }, g('Firmar por la Dirección', 'firmar')] }])
};
const pr = Comunes.propuesta(antiguas);
comprobar('las tareas iguales se unen en una', pr.tareas.filter((t) => t.nombre === 'Firmar por la Dirección').map((t) => t.usos.length), [3]);
comprobar('el mismo nombre con otra plantilla queda separado y se dice', pr.distintas.filter((x) => x.nombre === 'Enviar el correo').map((x) => x.maneras), [2]);
comprobar('el hito igual en dos guías se une', pr.hitos.filter((h) => h.nombre === 'Firma').map((h) => h.usos), [['BAJA', 'ACTIVIDAD']]);
comprobar('los hitos con ramas y las preguntas se quedan como están', pr.seQuedan, { preguntas: 1, hitosConRamas: 1 });
comprobar('nada se pierde', pr.sinPerdidas, true);
comprobar('hay una tarea por cada nombre con acción y plantilla distintas', pr.tareas.length, 4);
comprobar('la propuesta no cambia las guías', JSON.stringify(antiguas), JSON.stringify(antiguas));

console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
