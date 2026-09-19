/* Prueba de la fila 73 (docs/BUSCAR-EN-LAS-NOTAS.md): buscar dentro de
   las notas, en asuntos abiertos y archivados. Sin navegador: la
   lógica de verdad vive en js/notas.js (pura, sin DOM) y en
   js/archivo-indice.js (textoDeBusqueda). Lo que hace falta el
   navegador (la tarjeta pintada, con el trocito debajo) se comprueba
   con las pruebas ya existentes de asuntos abiertos y del ARCHIVO, que
   pasan por App.tarjetaAsunto de verdad. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = {
  console, document: { getElementById: () => null },
  App: { E: {} }
};
contexto.window = contexto;
vm.createContext(contexto);
for (const f of ['util.js', 'notas.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Notas } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarCierto(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

/* ================================================================
   Asuntos abiertos: mismo montaje que App.verAbiertos/pintarAbiertos
   (js/asuntos-lista.js), reproducido aquí sin DOM.
   ================================================================ */
function asuntoAbierto(nombre, notas) {
  const ficha = { notas: (notas || []).map((texto) => ({ texto })) };
  const notasTexto = Notas.textoParaBuscar(ficha);
  return {
    nombre, ficha,
    buscaSinNotas: U.normalizar(nombre),
    notasTexto,
    busca: U.normalizar(nombre + ' ' + notasTexto)
  };
}
function buscaAbiertos(lista, texto) {
  const palabras = U.normalizar(texto).split(' ').filter(Boolean);
  return lista.filter((a) => palabras.every((p) => a.busca.indexOf(p) !== -1))
    .map((a) => Object.assign({}, a, { _fragmento: Notas.fragmentoSiSoloEnNota(a.busca, a.buscaSinNotas, a.notasTexto, palabras) }));
}

console.log('--- 1. una nota con "empadronamiento" sale al buscarla ---');
const perez = asuntoAbierto('260919 SOLICITUD Pérez, Ana', ['la madre dijo que trae el certificado de empadronamiento la semana que viene']);
const gomez = asuntoAbierto('260919 BAJA Gómez, Luis', ['sin novedades']);
comprobar('sale solo Pérez', buscaAbiertos([perez, gomez], 'empadronamiento').map((a) => a.nombre), [perez.nombre]);

console.log('--- 2. dos palabras sueltas, en cualquier orden (una del nombre, otra de una nota) ---');
comprobar('"empadronamiento perez" también sale',
  buscaAbiertos([perez, gomez], 'empadronamiento perez').map((a) => a.nombre), [perez.nombre]);
comprobar('en el orden contrario también', buscaAbiertos([perez, gomez], 'perez empadronamiento').map((a) => a.nombre), [perez.nombre]);
comprobar('si falta una de las dos, no sale', buscaAbiertos([perez, gomez], 'empadronamiento gomez').map((a) => a.nombre), []);

console.log('--- 3. con tildes y sin tildes da igual ---');
const conAcento = asuntoAbierto('260919 SOLICITUD Ruiz, Marta', ['pidió información sobre matrícula']);
comprobar('buscar sin tilde encuentra la nota con tilde', buscaAbiertos([conAcento], 'informacion').map((a) => a.nombre), [conAcento.nombre]);
comprobar('buscar con tilde también', buscaAbiertos([conAcento], 'información').map((a) => a.nombre), [conAcento.nombre]);

console.log('--- por qué ha salido: solo por el nombre, no se enseña ninguna nota ---');
comprobar('buscando solo "perez", no hay fragmento (ya se explica por el nombre)',
  buscaAbiertos([perez], 'perez')[0]._fragmento, null);

console.log('--- por qué ha salido: por la nota, se enseña el trocito con la palabra ---');
const fragmento = buscaAbiertos([perez], 'empadronamiento')[0]._fragmento;
comprobarCierto('hay fragmento', !!fragmento, JSON.stringify(fragmento));
comprobar('la palabra marcada es la buscada', fragmento && U.normalizar(fragmento.palabra), 'empadronamiento');

console.log('--- 6. una nota de 50.000 caracteres no revienta nada: se recorta ---');
const notaLarga = 'palabra '.repeat(10000) + 'unica-al-final';
const conNotaLarga = asuntoAbierto('260919 SOLICITUD Torres, Iván', [notaLarga]);
comprobarCierto('el texto de búsqueda se recorta a 2.000 caracteres', conNotaLarga.notasTexto.length <= 2000,
  'largo: ' + conNotaLarga.notasTexto.length);
comprobar('la palabra del final (fuera del recorte) ya no se encuentra',
  buscaAbiertos([conNotaLarga], 'unica-al-final').map((a) => a.nombre), []);
comprobar('pero la del principio sí', buscaAbiertos([conNotaLarga], 'palabra').map((a) => a.nombre), [conNotaLarga.nombre]);

/* ================================================================
   El índice del ARCHIVO: textoDeBusqueda con y sin notas.
   ================================================================ */
console.log('--- el índice del archivo lleva las notas, y también se pueden dejar fuera ---');
const ctxIndice = { console, App: { E: {} } };
ctxIndice.window = ctxIndice;
vm.createContext(ctxIndice);
for (const f of ['util.js', 'archivo-indice.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), ctxIndice, { filename: f });
}
const { IndiceArchivo } = ctxIndice;

comprobarCierto('la versión del índice ha subido a la 2 (fila 73)', IndiceArchivo.VERSION === 2,
  'VERSION: ' + IndiceArchivo.VERSION);

const entradaConNota = { nombre: '260919 SOLICITUD Ruiz, Marta', categoria: 'ALUMNADO', tercero: 'Ruiz, Marta',
  notas: 'pidio informacion sobre matricula' };
comprobarCierto('con notas, el texto de búsqueda incluye la palabra de la nota',
  IndiceArchivo.textoDeBusqueda(entradaConNota).indexOf('matricula') !== -1);
comprobarCierto('sin notas (conNotas=false), esa palabra no está',
  IndiceArchivo.textoDeBusqueda(entradaConNota, false).indexOf('matricula') === -1);
comprobarCierto('sin notas, el nombre sigue estando',
  IndiceArchivo.textoDeBusqueda(entradaConNota, false).indexOf('ruiz') !== -1);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
