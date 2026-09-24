/* Prueba de docs/GRUPOS-DE-PERSONAS.md (fila 21, 17-sep-2026), la
   parte que se puede probar sin datos reales ni navegador. Mismo
   estilo que pruebas/logica.mjs: los ficheros se cargan tal cual en
   un contexto de Node con `vm`.

   Lo que de verdad hace falta el navegador (señalar varios sin
   perderlo al cambiar de búsqueda, un miembro que ya no está en las
   listas) se prueba en pruebas/grupos-navegador.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
/* relacionados.js se engancha a App.cerrarAsunto/reabrirAsunto/verArchivo/
   verFicha nada más cargarse (el patrón "envolver" de toda la
   aplicación): hace falta un App de mentira con esas cuatro piezas
   para que cargue sin reventar, aunque aquí no se lleguen a usar. */
const contexto = {
  console, window: {}, document: { getElementById: () => null },
  App: {
    cerrarAsunto: async function (a) { return a; },
    reabrirAsunto: async function (a) { return a; },
    verArchivo: async function () {},
    verFicha: function () {}
  }
};
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'relacionados.js', 'relacionados-ficha.js', 'relacionados-archivar.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Nombres, Datos, Relacionados } = contexto;
// Desde la fila 132, la regla de los correos vive en js/destinatarios.js:
// se prueba la de verdad, no una copia.
vm.runInContext(fs.readFileSync(raiz + 'destinatarios.js', 'utf8'), contexto, { filename: 'destinatarios.js' });
const combinarCorreosDeGrupo = (m) => contexto.Destinatarios.delGrupo(m);

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- 1. Nombres.nivelYEnsenanza, con unidades reales ---------- */

comprobar('1a. E.S.O., con la etapa sin escribir',
  Nombres.nivelYEnsenanza('1º de E.S.O. A'), { nivel: '1º', ensenanza: 'E.S.O.' });
comprobar('1b. Bachillerato, con la etapa escrita',
  Nombres.nivelYEnsenanza('2º Bachillerato B'), { nivel: '2º', ensenanza: 'Bachillerato' });
comprobar('1c. un ciclo formativo (FP)',
  Nombres.nivelYEnsenanza('1º CFGM Sistemas A'), { nivel: '1º', ensenanza: 'Formación Profesional' });
comprobar('1d. sin nivel reconocible, los dos vacíos',
  Nombres.nivelYEnsenanza('Aula específica'), { nivel: '', ensenanza: '' });

/* ---------- datos de alumnado de mentira, para 2, 3 y 4 ---------- */

function alumno(nombre, unidad, matriculado) {
  return { nombre: nombre, matriculado: matriculado !== false, unidad: unidad, curso: '26-27', campos: {} };
}

const CLASE = [
  alumno('Alba García, Ana 1001', '1º de E.S.O. A'),
  alumno('Blanco López, Bea 1002', '1º de E.S.O. A'),
  alumno('Cortés Ruiz, Carla 1003', '1º de E.S.O. B'),
  alumno('Duque Sanz, Diego 1004', '2º de E.S.O. A'),
  alumno('Estévez Vidal, Elia 1005', '1º Bachillerato A'),
  alumno('Fuentes Moya, Fran 1006', '1º de E.S.O. A', false)   /* no matriculado este curso */
];

/* ---------- 2. un nivel junta las unidades de ese nivel, y ninguna más ---------- */

comprobar('2. "1º" junta 1ºESOA, 1ºESOB y 1ºBachA, pero no 2ºESOA ni al no matriculado',
  Relacionados.filtrarPorNivel(CLASE, '1º').map(function (a) { return a.nombre; }).sort(),
  ['Alba García, Ana 1001', 'Blanco López, Bea 1002', 'Cortés Ruiz, Carla 1003',
   'Estévez Vidal, Elia 1005'].sort());

/* ---------- 3. una enseñanza junta todos sus niveles ---------- */

comprobar('3. "E.S.O." junta 1ºA, 1ºB y 2ºA, pero no el de Bachillerato',
  Relacionados.filtrarPorEnsenanza(CLASE, 'E.S.O.').map(function (a) { return a.nombre; }).sort(),
  ['Alba García, Ana 1001', 'Blanco López, Bea 1002', 'Cortés Ruiz, Carla 1003',
   'Duque Sanz, Diego 1004'].sort());

/* ---------- 4. el no matriculado este curso no entra en ningún atajo ---------- */

comprobar('4a. no entra por unidad',
  Relacionados.filtrarPorUnidad(CLASE, '1º de E.S.O. A').some(function (a) { return a.nombre.indexOf('Fuentes') === 0; }),
  false);
comprobar('4b. no entra por nivel',
  Relacionados.filtrarPorNivel(CLASE, '1º').some(function (a) { return a.nombre.indexOf('Fuentes') === 0; }),
  false);
comprobar('4c. no entra por enseñanza',
  Relacionados.filtrarPorEnsenanza(CLASE, 'E.S.O.').some(function (a) { return a.nombre.indexOf('Fuentes') === 0; }),
  false);
comprobar('4d. Datos.unidadesDistintas tampoco lo cuenta',
  Datos.unidadesDistintas(CLASE).filter(function (u) { return u.unidad === '1º de E.S.O. A'; })[0].cuantos, 2);

/* ---------- 6. añadir un grupo no mete dos veces a quien ya estaba ---------- */

const ACTUALES = [
  { categoria: 'ALUMNADO', nombre: 'Alba García, Ana 1001' },
  { categoria: 'PERSONAL', nombre: 'Núñez Rey, Pilar 4321' }
];
const CANDIDATOS_GRUPO = [
  { categoria: 'ALUMNADO', nombre: 'Alba García, Ana 1001' },       /* ya estaba */
  { categoria: 'ALUMNADO', nombre: 'Blanco López, Bea 1002' },      /* nueva */
  { categoria: 'EMPRESAS', nombre: 'Suministros Ejemplo SL B12345678' }  /* nueva */
];
const RESULTADO_6 = Relacionados.combinarRelacionados(ACTUALES, 'ALUMNADO', 'Alba García, Ana 1001', CANDIDATOS_GRUPO);
comprobar('6a. no se duplica a quien ya estaba: solo 2 añadidos de los 3 candidatos',
  RESULTADO_6.anadidos, 2);
comprobar('6b. la lista final tiene 4, no 5: Ana no se repite',
  RESULTADO_6.finales.length, 4);
comprobar('6c. el propio tercero del asunto tampoco se cuenta como "añadido"',
  Relacionados.combinarRelacionados([], 'ALUMNADO', 'Alba García, Ana 1001',
    [{ categoria: 'ALUMNADO', nombre: 'Alba García, Ana 1001' }]).esPropio, 1);

/* ---------- 7. un miembro que ya no está en las listas se marca, no se borra ----------

   Esto lo garantiza App.pintarBuscadorDeTercero: `opciones.marcadosIniciales`
   se copia entero a `estado.marcados`, y nada lo quita salvo la × de la
   barra o el propio "Añadir". Aquí se prueba la parte que sí es lógica
   pura: un miembro guardado en el grupo que ya no aparece en la lista
   de hoy sigue siendo un miembro válido para `combinarCorreosDeGrupo`
   (llega con `persona: null`, y se cuenta como "sin correo", no se
   descarta). El resto (que la barra lo conserve visualmente) se prueba
   en pruebas/grupos-navegador.mjs. */
comprobar('7. un miembro sin persona resuelta (ya no está en las listas) cuenta como sin correo, no desaparece',
  combinarCorreosDeGrupo([{ nombre: 'Gómez Salas, Iván 9999', persona: null }]),
  { direcciones: [], sinCorreo: ['Gómez Salas, Iván 9999'] });

/* ---------- 8. los correos del grupo van en cco, sin repetidos ---------- */

const PERSONA_CON_DOS_CORREOS = {
  nombre: 'Alba García, Ana 1001', categoria: 'ALUMNADO',
  campos: { 'Correo madre': 'madre@example.com', 'Correo padre': 'PADRE@example.com' }
};
const PERSONA_SIN_CORREO = { nombre: 'Blanco López, Bea 1002', categoria: 'ALUMNADO', campos: {} };
const PERSONA_CORREO_REPETIDO = {
  nombre: 'Núñez Rey, Pilar 4321', categoria: 'PERSONAL',
  campos: { Correo: 'madre@example.com' }   /* mismo correo que la madre de Ana, en mayúsculas o no */
};

const RESULTADO_8 = combinarCorreosDeGrupo([
  { nombre: PERSONA_CON_DOS_CORREOS.nombre, persona: PERSONA_CON_DOS_CORREOS },
  { nombre: PERSONA_SIN_CORREO.nombre, persona: PERSONA_SIN_CORREO },
  { nombre: PERSONA_CORREO_REPETIDO.nombre, persona: PERSONA_CORREO_REPETIDO }
]);
comprobar('8a. entran los dos correos de Ana y el de Pilar no se repite (es el mismo, en mayúsculas)',
  RESULTADO_8.direcciones.slice().sort(),
  ['PADRE@example.com', 'madre@example.com'].sort());
comprobar('8b. Bea, sin correo, sale aparte para poder avisar',
  RESULTADO_8.sinCorreo, ['Blanco López, Bea 1002']);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
