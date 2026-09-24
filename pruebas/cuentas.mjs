/* Prueba de la fila 74 (docs/CUENTAS-DE-FIN-DE-CURSO.md): las cuentas
   de fin de curso, sin navegador. La lógica de verdad vive en
   js/cuentas.js (pura, sin DOM: `_entradaAbierta`, `_entradaArchivada`,
   `_porTipo`, `_porMes`, `_porQuienLoPide`, `_tiempoDeTramite`,
   `_textoParaCopiar`). Lo que hace falta el navegador (la pantalla
   pintada, el aviso de "índice no hecho", el botón "Copiar la tabla"
   de verdad) se comprueba a mano, como el trocito de nota de la fila
   73: aquí solo la cuenta. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = {
  console,
  App: { PANTALLAS: [], E: {} }
};
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'cuentas.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Cuentas } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const TIPOS = [
  { tipo: 'MATRICULA', categoria: 'ALUMNADO' },
  { tipo: 'COMPRA', categoria: 'EMPRESAS' }
];

/* ================================================================
   LOS DATOS DE PRUEBA: tres asuntos abiertos, tres archivados.
   ================================================================ */

const abiertos = [
  { nombre: '260910 MATRICULA 26-27 3ºA Pérez, Ana 1234',
    ficha: { abiertoEl: '2026-09-10T08:00:00.000Z',
             loPide: { nombre: 'María', categoria: 'ALUMNADO', relacion: 'Tutor legal 1' } } },
  { nombre: '260915 COMPRA Papelería SL B12345678',
    ficha: { abiertoEl: '2026-09-15T08:00:00.000Z' } },
  /* "RARO" no está en TIPOS: cae en "Sin clasificar". */
  { nombre: '260920 RARO Algo raro Nadie',
    ficha: { abiertoEl: '2026-09-20T08:00:00.000Z' } }
];

const archivados = [
  /* Curso 25-26 (enero de 2026), 10 días de trámite, lo pidió alguien del centro. */
  { fecha: '260110', tipo: 'MATRICULA', categoria: 'ALUMNADO', reconocido: true,
    loPideNombre: 'Juan', loPideCategoria: 'PERSONAL', loPideRelacion: '',
    abiertoEl: '2026-01-10T00:00:00.000Z', cerradoEl: '2026-01-20T00:00:00.000Z' },
  /* Curso 26-27 (octubre de 2026), 10 días de trámite, sin "quién lo pide" apuntado. */
  { fecha: '261005', tipo: 'COMPRA', categoria: 'EMPRESAS', reconocido: true,
    loPideNombre: '', loPideCategoria: '', loPideRelacion: '',
    abiertoEl: '2026-10-05T00:00:00.000Z', cerradoEl: '2026-10-15T00:00:00.000Z' },
  /* Curso 25-26 (febrero de 2026), tipo no reconocible, 4 días, lo pidió una empresa. */
  { fecha: '260201', tipo: 'X', categoria: 'ALUMNADO', reconocido: false,
    loPideNombre: 'ACME S.L.', loPideCategoria: 'EMPRESAS', loPideRelacion: '',
    abiertoEl: '2026-02-01T00:00:00.000Z', cerradoEl: '2026-02-05T00:00:00.000Z' }
];

const entradas = abiertos.map((a) => Cuentas._entradaAbierta(a, TIPOS))
  .concat(archivados.map((e) => Cuentas._entradaArchivada(e)));

console.log('--- 2. el desplegable de curso solo enseña los cursos que de verdad hay ---');
comprobar('dos cursos, el más nuevo primero', Cuentas._cursosDeEntradas(entradas), ['26-27', '25-26']);

console.log('--- 1 y 3. cuentas por tipo, exactas, y "Sin clasificar" aparte sin perder nada ---');
const filasCurso = Cuentas._porTipo(entradas, '26-27');
comprobar('tres filas: MATRICULA, COMPRA y Sin clasificar', filasCurso, [
  { categoria: 'ALUMNADO', tipo: 'MATRICULA', cuantos: 1, abiertos: 1, archivados: 0 },
  { categoria: 'EMPRESAS', tipo: 'COMPRA', cuantos: 2, abiertos: 1, archivados: 1 },
  { categoria: 'Sin clasificar', tipo: '—', cuantos: 1, abiertos: 1, archivados: 0 }
]);
const sumaCurso = filasCurso.reduce((a, f) => a + f.cuantos, 0);
comprobar('la suma de la tabla da el total del curso (4 asuntos)', sumaCurso, 4);

console.log('--- sin elegir curso, también sale todo, sin perder ninguno ---');
const filasTodas = Cuentas._porTipo(entradas, '');
const sumaTodas = filasTodas.reduce((a, f) => a + f.cuantos, 0);
comprobar('la suma sin filtrar da el total (6 asuntos)', sumaTodas, 6);

console.log('--- por mes, dentro de un curso ---');
comprobar('los tres abiertos de 26-27 caen en sep-2026, y el archivado de COMPRA en oct-2026',
  Cuentas._porMes(entradas, '26-27'), [{ mes: '2609', cuantos: 3 }, { mes: '2610', cuantos: 1 }]);

console.log('--- por quién lo pidió ---');
comprobar('familia, alumnado, centro, empresa y "sin apuntar", cada uno lo suyo',
  Cuentas._porQuienLoPide(entradas, ''), [
    { grupo: 'Sin apuntar', cuantos: 3 },
    { grupo: 'Familia', cuantos: 1 },
    { grupo: 'Centro', cuantos: 1 },
    { grupo: 'Empresa', cuantos: 1 }
  ]);

console.log('--- cuánto se tarda (solo archivados, con las dos fechas) ---');
comprobar('curso 26-27: uno solo, 10 días', Cuentas._tiempoDeTramite(entradas, '26-27'),
  { cuantos: 1, media: 10, maximo: 10 });
comprobar('curso 25-26: dos, media 7, el que más tardó 10', Cuentas._tiempoDeTramite(entradas, '25-26'),
  { cuantos: 2, media: 7, maximo: 10 });
comprobar('sin abiertos ni cerrados, no se inventa nada', Cuentas._tiempoDeTramite([], ''),
  { cuantos: 0, media: 0, maximo: 0 });

console.log('--- 5. "Copiar la tabla" deja tantas líneas como filas (más la cabecera) ---');
const texto = Cuentas._textoParaCopiar(
  ['Categoría', 'Tipo de asunto', 'Cuántos', 'Abiertos', 'Archivados'],
  filasCurso.map((f) => [f.categoria, f.tipo, f.cuantos, f.abiertos, f.archivados])
);
comprobar('cabecera + tres filas = cuatro líneas', texto.split('\n').length, 4);
comprobar('las columnas van separadas por tabuladores', texto.split('\n')[0], 'Categoría\tTipo de asunto\tCuántos\tAbiertos\tArchivados');

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
