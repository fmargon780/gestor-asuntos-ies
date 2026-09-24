/* Prueba de lógica (sin navegador) del catálogo de formularios
   oficiales (20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md).

   Solo la lógica pura (`buscar`, `etiquetaDeVia`), sin `fetch` ni DOM:
   ese es el motivo de que estén separadas de todo lo demás en
   `js/formularios.js`, que sí necesita `document`/`window` para el
   resto (el editor, la pantalla, la ficha).

   Comprueba:
   1. `buscar` por nombre, con tildes y sin ellas.
   2. `buscar` por norma.
   3. Texto vacío: da el catálogo entero.
   4. `etiquetaDeVia` con las cuatro vías conocidas.
   5. `etiquetaDeVia` con una vía desconocida: no revienta, y no se
      pinta como botón de descarga (mismo tratamiento que "protocolo").
   6. Un formulario sin `u`: no se puede ofrecer enlace (lo comprueba
      quien pinta, mirando si `f.u` existe; aquí solo que el catálogo
      de prueba trae una entrada así, sin que nada la rompa). */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Un contexto mínimo, sin document/window: basta con U.normalizar y
   U.escapar para `buscar`/`etiquetaDeVia`, que son las dos funciones
   puras que prueba este fichero. El resto de js/formularios.js
   (fetch, DOM) no se ejecuta al cargarlo (todo dentro de funciones o
   de un `if (document...)` que aquí sale false), salvo la llamada de
   fondo `cargar()` del final: sin `fetch` definido, su `catch` la deja
   en `{}`, sin romper nada. */
/* Un `document` de mentira mínimo: basta con que las comprobaciones
   de "¿hay pantalla/contenedor?" salgan `null` (nada que construir) y
   con que `readyState`/`addEventListener` no revienten al enganchar
   el bloque de Ajustes → Mantenimiento. Nada de esto se ejecuta de
   verdad en esta prueba: solo hace falta que cargar el fichero no
   lance ninguna excepción. */
const documentoFalso = {
  readyState: 'complete',
  addEventListener: function () {},
  querySelector: function () { return null; },
  getElementById: function () { return null; },
  createElement: function () { return { classList: { add: function () {} } }; }
};
const contexto = { window: {}, document: documentoFalso, App: { E: {}, PANTALLAS: [] } };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(RAIZ + 'util.js', 'utf8'), contexto);
for (const f of ['util-parecidos.js', 'util-pantalla.js']) vm.runInContext(fs.readFileSync(RAIZ + f, 'utf8'), contexto);
contexto.window.U = contexto.U;
contexto.window.App = contexto.App;
vm.runInContext(fs.readFileSync(RAIZ + 'formularios.js', 'utf8'), contexto);
const { Formularios } = contexto;

const CATALOGO = {
  'O:III': { n: 'Anexo III · Solicitud de admisión', norma: 'Orden de 20 de febrero de 2020', via: 'descarga', u: 'https://ejemplo/anexo3.pdf' },
  'O11:VI': { n: 'Anexo VI · Modelo de compromiso de convivencia', norma: 'Orden de 20 de junio de 2011', via: 'centro', u: 'https://ejemplo/boja' },
  'O11:I': { n: 'Anexo I · Protocolo de actuación en supuestos de acoso escolar', norma: 'Orden de 20 de junio de 2011', via: 'protocolo', u: 'https://ejemplo/boja' },
  'OESO:IX': { n: 'Anexo IX · Modelos de los documentos de evaluación (ESO)', norma: 'Orden de 30 de mayo de 2023, de ESO', via: 'seneca' }
};

/* ================= 1 · buscar por nombre, con y sin tildes ================= */
console.log('--- 1. buscar por nombre ---');
comprobar('con tilde, encuentra "admisión"', Formularios.buscar(CATALOGO, 'admisión'), ['O:III']);
comprobar('sin tilde, encuentra lo mismo', Formularios.buscar(CATALOGO, 'admision'), ['O:III']);
comprobar('en mayúsculas, igual', Formularios.buscar(CATALOGO, 'ADMISIÓN'), ['O:III']);

/* ================= 2 · buscar por norma ================= */
console.log('--- 2. buscar por norma ---');
comprobar('"2011" encuentra las dos de esa orden',
  Formularios.buscar(CATALOGO, '2011').sort(), ['O11:I', 'O11:VI'].sort());

/* ================= 3 · texto vacío: catálogo entero ================= */
console.log('--- 3. texto vacío ---');
comprobar('sin texto, salen las cuatro', Formularios.buscar(CATALOGO, '').sort(), Object.keys(CATALOGO).sort());
comprobar('sin argumento, igual', Formularios.buscar(CATALOGO).sort(), Object.keys(CATALOGO).sort());

/* ================= 4 · etiquetaDeVia, las cuatro conocidas ================= */
console.log('--- 4. etiquetaDeVia ---');
comprobar('descarga', Formularios.etiquetaDeVia('descarga'), { texto: 'Se descarga', clase: 'via-descarga' });
comprobar('centro', Formularios.etiquetaDeVia('centro'), { texto: 'Lo emite el centro', clase: 'via-centro' });
comprobar('protocolo', Formularios.etiquetaDeVia('protocolo'), { texto: 'Protocolo, sin impreso', clase: 'via-protocolo' });
comprobar('seneca', Formularios.etiquetaDeVia('seneca'), { texto: 'Se genera en Séneca', clase: 'via-seneca' });

/* ================= 5 · una vía desconocida ================= */
console.log('--- 5. vía desconocida ---');
comprobar('no revienta, y sale como si fuera protocolo (no un botón de descarga)',
  Formularios.etiquetaDeVia('rara'), { texto: 'rara', clase: 'via-protocolo' });
comprobar('sin vía en absoluto', Formularios.etiquetaDeVia(''), { texto: '(sin vía)', clase: 'via-protocolo' });

/* ================= 6 · una entrada sin `u` no rompe nada ================= */
console.log('--- 6. una entrada sin enlace ---');
comprobar('sigue encontrándose por su nombre',
  Formularios.buscar(CATALOGO, 'documentos de evaluación'), ['OESO:IX']);
comprobar('y no tiene `u`', CATALOGO['OESO:IX'].u, undefined);

console.log(fallos ? '\n' + fallos + ' fallo(s) en formularios.mjs' : '\nTodo bien en formularios.mjs');
if (fallos) process.exit(1);
