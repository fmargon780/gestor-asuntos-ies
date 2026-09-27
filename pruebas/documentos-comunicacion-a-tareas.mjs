/* Prueba de lógica (jsdom, sin navegador de verdad) de la conversión de
   "Documentos de este paso" y "Comunicación de este paso" a tareas del
   guion (27-sep-2026, fila 199 de docs/COLA.md,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md, apartado 4).

   Mismo patrón que pruebas/biblioteca-de-hitos.mjs: se cargan los
   ficheros de verdad en una página jsdom y se llama a la parte pura de
   la conversión (`Guias._convertirDocumentosYComunicacion`, colgada de
   `Guias` por js/guias-editor.js para las pruebas), sin E/S ninguna.

   Comprueba:
   1. Una plantilla de documento del paso se convierte en una tarea
      «Generar un documento → nombre», con la receta apuntando a su id,
      y el paso se queda sin `plantillasDocumento`.
   2. Un texto de comunicación (correo) se convierte en una tarea
      «Comunicar → título del hito» con `via:'correo'` (no `''`: con
      solo un canal, dejar `via` vacío haría que
      `js/hito-mesa-recetas.js` la disparase por el canal por defecto,
      que no tiene por qué ser el que de verdad tiene texto), con una
      plantilla NUEVA (con ese mismo texto) y el paso se queda sin
      `comunicacion`.
   3. Con texto de correo Y de Séneca DISTINTOS: una sola plantilla
      nueva con los dos (`texto` y `textoSeneca`), pero DOS tareas
      «Comunicar» (`via:'correo'` y `via:'seneca'`, decidido con
      Francisco el 27-sep-2026: "los dos, como dos avisos", nunca uno
      solo aunque compartan plantilla).
   4. Repetir la conversión sobre el resultado no crea nada más
      (idempotente): ni tareas nuevas ni plantillas nuevas.
   5. Un paso sin nada que convertir (sin plantillasDocumento ni
      comunicación) no cambia.
   6. La conversión entra también en los subpasos de una pregunta, a
      cualquier profundidad, y nunca en el propio paso-pregunta.
   7. Un paso con solo texto de Séneca (sin correo) también se
      convierte, usando ese texto como `texto` de la nueva plantilla,
      con `via:'seneca'` (no `'correo'` por defecto).
   8. Un asunto de correo escrito a mano (`comunicacion.correo.asunto`)
      pasa como primera línea del cuerpo de la plantilla nueva, en vez
      de perderse (decidido con Francisco el 27-sep-2026). Con los dos
      canales iguales (mismo asunto y cuerpo), una sola tarea con
      `via:''` (vale para cualquiera). */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.TextDecoder = TextDecoder;
win.Blob = Blob;

for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'guias.js', 'guias-guion.js', 'guias-editor.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Guias } = win;
const convertir = Guias._convertirDocumentosYComunicacion;

/* Un id de plantilla previsible, para que las comprobaciones no
   dependan del reloj ni de Math.random. */
function idsDePrueba() {
  let n = 0;
  return function () { n++; return 'pl-prueba-' + n; };
}

console.log('--- 1. una plantilla de documento se convierte en tarea ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h1', titulo: 'Registrar la solicitud', cuerpo: '',
    plantillasDocumento: ['pd-1'] }]);
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', { nombreDocumento: function (id) { return id === 'pd-1' ? 'Solicitud de matrícula' : id; } });
  comprobar('no crea ninguna plantilla de comunicación', nuevas, []);
  comprobar('el paso se queda sin plantillasDocumento', pasos[0].plantillasDocumento, []);
  comprobar('sale una tarea "Generar un documento" con el nombre de la plantilla',
    pasos[0].guion.map(function (g) { return g.texto; }),
    ['Generar un documento → Solicitud de matrícula']);
  comprobar('la tarea lleva accion "generar" y la receta con el id de la plantilla',
    [pasos[0].guion[0].accion, pasos[0].guion[0].receta],
    ['generar', { plantilla: 'pd-1' }]);
})();

console.log('--- 2. un texto de comunicación (correo) se convierte en tarea, con plantilla nueva ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h2', titulo: 'Avisar a la familia', cuerpo: '',
    comunicacion: { correo: { asunto: 'Aviso', cuerpo: 'Le informamos de que...' }, seneca: { asunto: '', cuerpo: '' } } }]);
  var idNuevo = idsDePrueba();
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idNuevo });
  comprobar('crea una sola plantilla nueva', nuevas.length, 1);
  comprobar('la plantilla nueva lleva el tipo, la categoría, el nombre del hito y el texto de correo, con el asunto delante',
    nuevas[0], { id: 'pl-prueba-1', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Avisar a la familia',
                 texto: 'Aviso\n\nLe informamos de que...' });
  comprobar('el paso se queda sin texto de comunicación',
    pasos[0].comunicacion, { correo: { asunto: '', cuerpo: '' }, seneca: { asunto: '', cuerpo: '' } });
  comprobar('sale una tarea "Comunicar" con el título del hito',
    pasos[0].guion.map(function (g) { return g.texto; }),
    ['Comunicar → Avisar a la familia']);
  comprobar('la tarea lleva accion "comunicar" y la receta con via "correo" (no vacío) y la plantilla nueva',
    [pasos[0].guion[0].accion, pasos[0].guion[0].receta],
    ['comunicar', { a: '', via: 'correo', plantilla: 'pl-prueba-1' }]);
})();

console.log('--- 3. con texto de correo y de Séneca distintos, los dos se guardan y salen dos tareas ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h3', titulo: 'Comunicar el cierre', cuerpo: '',
    comunicacion: { correo: { asunto: '', cuerpo: 'Texto de correo.' }, seneca: { asunto: '', cuerpo: 'Texto de Séneca, distinto.' } } }]);
  var nuevas = convertir(pasos, 'BAJA', 'PERSONAL', { idPlantilla: idsDePrueba() });
  comprobar('una sola plantilla nueva, con los dos textos', [nuevas.length, nuevas[0].texto, nuevas[0].textoSeneca],
    [1, 'Texto de correo.', 'Texto de Séneca, distinto.']);
  comprobar('salen DOS tareas "comunicar" (correo y Séneca), las dos con la misma plantilla',
    pasos[0].guion.map(function (g) { return [g.accion, g.receta.via, g.receta.plantilla]; }),
    [['comunicar', 'correo', nuevas[0].id], ['comunicar', 'seneca', nuevas[0].id]]);
})();

console.log('--- 4. repetir la conversión no duplica nada ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h4', titulo: 'Un hito con las dos cosas', cuerpo: '',
    plantillasDocumento: ['pd-9'],
    comunicacion: { correo: { asunto: '', cuerpo: 'Un texto cualquiera.' }, seneca: { asunto: '', cuerpo: '' } } }]);
  var primera = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba() });
  comprobar('la primera vez convierte las dos cosas', primera.length, 1);
  comprobar('quedan dos tareas (generar y comunicar)', pasos[0].guion.length, 2);
  var segunda = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba() });
  comprobar('la segunda vez no crea ninguna plantilla más', segunda, []);
  comprobar('y las tareas siguen siendo solo dos (no se duplican)', pasos[0].guion.length, 2);
})();

console.log('--- 5. un paso sin nada que convertir no cambia ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h5', titulo: 'Hito normal, sin documentos ni comunicación', cuerpo: '' }]);
  var antes = JSON.stringify(pasos);
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', {});
  comprobar('no crea ninguna plantilla', nuevas, []);
  comprobar('el paso no cambia', JSON.stringify(pasos), antes);
})();

console.log('--- 6. la conversión entra en los subpasos de una pregunta ---');
(function () {
  var pasos = Guias.normalizar([{
    id: 'hp', titulo: '¿Cómo se ha recibido?', cuerpo: '',
    opciones: [
      { id: 'o1', titulo: 'En mano', pasos: [{ id: 'sp1', titulo: 'Sellar en mano', cuerpo: '', plantillasDocumento: ['pd-2'] }] },
      { id: 'o2', titulo: 'Por correo', pasos: [{ id: 'sp2', titulo: 'Contestar por correo', cuerpo: '',
          comunicacion: { correo: { asunto: '', cuerpo: 'Recibido, gracias.' }, seneca: { asunto: '', cuerpo: '' } } }] }
    ]
  }]);
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba(), nombreDocumento: function (id) { return id; } });
  comprobar('el propio paso-pregunta no lleva guion ni plantillasDocumento',
    [pasos[0].guion, pasos[0].plantillasDocumento], [[], []]);
  var subpaso1 = pasos[0].opciones[0].pasos[0];
  var subpaso2 = pasos[0].opciones[1].pasos[0];
  comprobar('el primer subpaso convierte su documento en tarea', subpaso1.guion.map(function (g) { return g.accion; }), ['generar']);
  comprobar('el segundo subpaso convierte su comunicación en tarea', subpaso2.guion.map(function (g) { return g.accion; }), ['comunicar']);
  comprobar('se ha creado una sola plantilla nueva (la del segundo subpaso)', nuevas.length, 1);
})();

console.log('--- 7. solo texto de Séneca (sin correo) también se convierte ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h7', titulo: 'Solo aviso por Séneca', cuerpo: '',
    comunicacion: { correo: { asunto: '', cuerpo: '' }, seneca: { asunto: '', cuerpo: 'Texto solo de Séneca.' } } }]);
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba() });
  comprobar('la plantilla usa el texto de Séneca como texto principal, sin textoSeneca aparte',
    [nuevas[0].texto, nuevas[0].textoSeneca], ['Texto solo de Séneca.', undefined]);
  comprobar('la tarea lleva via "seneca" (no "correo" por defecto: se enviaría por el canal equivocado)',
    pasos[0].guion[0].receta.via, 'seneca');
})();

console.log('--- 8. un asunto escrito a mano no se pierde: primera línea del cuerpo nuevo ---');
(function () {
  var pasos = Guias.normalizar([{ id: 'h8', titulo: 'Con asunto propio', cuerpo: '',
    comunicacion: { correo: { asunto: 'Aviso importante', cuerpo: 'Cuerpo del correo.' }, seneca: { asunto: '', cuerpo: '' } } }]);
  var nuevas = convertir(pasos, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba() });
  comprobar('el asunto pasa como primera línea del cuerpo, con una línea en blanco detrás',
    nuevas[0].texto, 'Aviso importante\n\nCuerpo del correo.');

  var pasosIguales = Guias.normalizar([{ id: 'h9', titulo: 'Mismo asunto y cuerpo en los dos canales', cuerpo: '',
    comunicacion: { correo: { asunto: 'Aviso', cuerpo: 'Mismo texto.' }, seneca: { asunto: 'Aviso', cuerpo: 'Mismo texto.' } } }]);
  var nuevas2 = convertir(pasosIguales, 'MATRICULA', 'ALUMNADO', { idPlantilla: idsDePrueba() });
  comprobar('con los dos canales iguales (asunto y cuerpo), una sola tarea con via vacía',
    [pasosIguales[0].guion.length, pasosIguales[0].guion[0].receta.via, 'textoSeneca' in nuevas2[0]],
    [1, '', false]);
})();

console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
