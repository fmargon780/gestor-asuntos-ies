/* Prueba de lógica (jsdom, sin navegador) de la fila 322 de docs/COLA.md (docs/RETOCAR-UNA-PLANTILLA.md):
   la lógica de «Retocar» (js/plantilla-retocar.js) sobre un .docx hecho aquí.
   1. Cambiar un texto por otro: el nuevo está, el viejo no, y el resultado se puede releer.
   2. Un texto que aparece dos veces: cambian las dos.
   3. Cambiar por un dato: queda el hueco y se rellena.
   4. Quitar un trozo y quitar un párrafo entero por su posición, con otro cambio a la vez más abajo.
   5. Deshacer el primero de tres cambios: los otros dos siguen y el texto del primero vuelve.
   6. Dos cambios, uno dentro del otro: no se pisan (el más largo, primero).
   7. Un texto nuevo con un hueco escrito a mano.
   8. Qué párrafo del original es el que se ve (también cuando hay dos iguales).
   9. Cambiar algo ya cambiado corrige ese cambio; un trozo que no existe avisa. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { construirZipDePrueba } from './apoyo/zip-de-prueba.mjs';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
Object.assign(win, { DecompressionStream, CompressionStream, TextEncoder, TextDecoder, Blob, Response });
win.Carpetas = { leerJson: async () => null, crear: async () => ({}), ficheros: async () => [] };
win.App = { E: {}, LARGO_MAXIMO_NOMBRE: 180 };
for (const f of ['util.js', 'plantillas.js', 'docx.js', 'genero.js', 'docx-sustituir.js', 'plantilla-retocar.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Docx, DocxSustituir, Plantillas, PlantillaRetocar } = win;

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const p = (...runs) => '<w:p>' + runs.join('') + '</w:p>';
const r = (t, negrita) => '<w:r>' + (negrita ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + t + '</w:t></w:r>';
const CUERPO = [
  p(r('AVISO DE REVISIÓN', true)),
  p(r('Se informa de que el alunmo '), r('Carla', true), r(' Espejo debe presentar su documentación antes del 30 de junio de 2025.')),
  p(r('Este aviso vale para el curso 2025 y no sustituye a ningún otro.')),
  p(r('En caso de no presentar los documentos, se archivará el expediente.')),
  p(r('Gracias.')),
  p(r('Gracias.')),
  p(r('En Localidad de pruebas, a 3 de octubre de 2026'))
];
const documento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + CUERPO.join('') +
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>';
const original = await construirZipDePrueba([
  { nombre: '[Content_Types].xml', texto: '<Types/>', comprimir: false },
  { nombre: 'word/document.xml', texto: documento, comprimir: true },
  { nombre: 'word/styles.xml', texto: '<styles/>', comprimir: false }
]);
const textos = async (bytes) => (await DocxSustituir.leerParrafos(bytes)).cuerpo;
const todo = async (bytes) => (await textos(bytes)).join('\n');

/* ---------- 1 ---------- */
console.log('--- 1. cambiar un texto por otro ---');
let s = PlantillaRetocar.nueva(original);
await s.aplicar();
comprobar('1. sin cambios, sale igual', (await textos(s.trabajo.bytes)).length, CUERPO.length);
let res = await s.anadir({ tipo: 'texto', buscar: 'el alunmo', poner: 'el alumno' });
comprobar('1. se acepta y cuenta una vez', [!!res.linea, s.veces(res.linea)], [true, 1]);
let t1 = await todo(s.trabajo.bytes);
comprobar('1. el nuevo está y el viejo no', [t1.indexOf('el alumno Carla Espejo') !== -1, t1.indexOf('alunmo') === -1], [true, true]);
comprobar('1. se puede releer como Word', (await Docx.leerDirectorioCentral(s.trabajo.bytes)).some((e) => e.nombre === 'word/document.xml'), true);
comprobar('1. el original no se toca', (await todo(original)).indexOf('alunmo') !== -1, true);

/* ---------- 2 ---------- */
console.log('--- 2. un texto que aparece dos veces ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
res = await s.anadir({ tipo: 'texto', buscar: '2025', poner: '2026' });
comprobar('2. cuenta dos veces', s.veces(res.linea), 2);
t1 = await todo(s.trabajo.bytes);
comprobar('2. cambian las dos', [t1.indexOf('2025') === -1, (t1.match(/2026/g) || []).length], [true, 3]);

/* ---------- 3 ---------- */
console.log('--- 3. cambiar por un dato ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
await s.anadir({ tipo: 'dato', buscar: 'Carla Espejo', poner: '{nombreNatural}' });
t1 = await todo(s.trabajo.bytes);
comprobar('3. queda el hueco', t1.indexOf('el alunmo {nombreNatural} debe') !== -1, true);
const relleno = await Docx.rellenar(s.trabajo.bytes, { nombreNatural: 'Ana Gil' });
comprobar('3. y se rellena', (await todo(new Uint8Array(await relleno.blob.arrayBuffer()))).indexOf('el alunmo Ana Gil debe') !== -1, true);

/* ---------- 4 ---------- */
console.log('--- 4. quitar un trozo y quitar un párrafo ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
await s.anadir({ tipo: 'quitar', buscar: 'y no sustituye a ningún otro', poner: '' });
res = await s.anadir({ tipo: 'parrafo', indice: 3, resumen: 'En caso de no presentar…' });
await s.anadir({ tipo: 'texto', buscar: 'Localidad de pruebas', poner: 'Cabra' });
const t4 = await textos(s.trabajo.bytes);
comprobar('4. el trozo se quita', t4[2], 'Este aviso vale para el curso 2025 .');
comprobar('4. el párrafo se quita entero', t4.some((x) => x.indexOf('En caso de no presentar') !== -1), false);
comprobar('4. y el cambio de más abajo sale bien', t4[t4.length - 1], 'En Cabra, a 3 de octubre de 2026');
comprobar('4. quedan 6 párrafos y se sabe cuáles', [t4.length, s.trabajo.sobrevivientes], [6, [0, 1, 2, 4, 5, 6]]);
comprobar('4. el mismo párrafo dos veces avisa', !!(await s.anadir({ tipo: 'parrafo', indice: 3, resumen: 'x' })).aviso, true);
comprobar('4. la línea del párrafo se describe', PlantillaRetocar.descripcion(res.linea), { antes: 'Quitar el párrafo: «En caso de no presentar…»', despues: '' });

/* ---------- 5 ---------- */
console.log('--- 5. deshacer el primero de tres ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
const l1 = (await s.anadir({ tipo: 'texto', buscar: 'el alunmo', poner: 'el alumno' })).linea;
await s.anadir({ tipo: 'texto', buscar: '2025', poner: '2026' });
await s.anadir({ tipo: 'texto', buscar: 'Gracias', poner: 'Saludos' });
await s.quitar(l1.id);
t1 = await todo(s.trabajo.bytes);
comprobar('5. vuelve el texto del primero', t1.indexOf('el alunmo') !== -1, true);
comprobar('5. los otros dos siguen', [t1.indexOf('2025') === -1, t1.indexOf('Saludos') !== -1, s.lineas.length], [true, true, 2]);

/* ---------- 6 ---------- */
console.log('--- 6. uno dentro de otro ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
const corta = (await s.anadir({ tipo: 'texto', buscar: '2025', poner: 'XX' })).linea;
const larga = (await s.anadir({ tipo: 'texto', buscar: 'curso 2025', poner: 'curso 2026' })).linea;
t1 = await textos(s.trabajo.bytes);
comprobar('6. el largo gana donde coinciden y el corto cambia el otro', [t1[2].indexOf('curso 2026') !== -1, t1[1].indexOf('de XX.') !== -1], [true, true]);
comprobar('6. cuentas: 1 y 1', [s.veces(larga), s.veces(corta)], [1, 1]);

/* ---------- 7 ---------- */
console.log('--- 7. un hueco escrito a mano ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
await s.anadir({ tipo: 'texto', buscar: 'Carla Espejo', poner: '{nombreNatural} ({referencia})' });
const rell = await Docx.rellenar(s.trabajo.bytes, { nombreNatural: 'Ana Gil', referencia: '2100006' });
comprobar('7. se respeta y se rellena', (await todo(new Uint8Array(await rell.blob.arrayBuffer()))).indexOf('Ana Gil (2100006) debe') !== -1, true);

/* ---------- 8 ---------- */
console.log('--- 8. qué párrafo es el que se ve ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
await s.anadir({ tipo: 'parrafo', indice: 3, resumen: 'x' });
const visibles = s.trabajo.textos;   /* lo que pinta la pantalla: los mismos párrafos */
comprobar('8. mismo número de párrafos: vale la posición', s.parrafoOriginal(visibles, 2), 2);
comprobar('8. tras quitar uno, el de después sigue siendo el suyo', s.parrafoOriginal(visibles, 6 - 1), 6);
comprobar('8. dos «Gracias» en la misma posición se distinguen', [s.parrafoOriginal(visibles, 3), s.parrafoOriginal(visibles, 4)], [4, 5]);
const sinUno = visibles.filter((x, i) => i !== 0);   /* la pantalla no enseña el primero: no se puede alinear */
comprobar('8. si no cuadra y hay dos iguales, no se sabe', s.parrafoOriginal(sinUno, 2), null);
comprobar('8. si no cuadra pero es único, se sabe', s.parrafoOriginal(sinUno, 1), 2);
comprobar('8. un párrafo vacío no se puede quitar así', s.parrafoOriginal(['', 'a'], 0), null);

/* ---------- 9 ---------- */
console.log('--- 9. cambiar algo ya cambiado ---');
s = PlantillaRetocar.nueva(original);
await s.aplicar();
await s.anadir({ tipo: 'texto', buscar: 'el alunmo', poner: 'el alumno' });
res = await s.anadir({ tipo: 'texto', buscar: 'el alumno', poner: 'la alumna' });
comprobar('9. se corrige el cambio de antes, sin línea nueva', [res.corregida, s.lineas.length, s.lineas[0].buscar, s.lineas[0].poner], [true, 1, 'el alunmo', 'la alumna']);
comprobar('9. y el documento lo enseña', (await todo(s.trabajo.bytes)).indexOf('la alumna Carla') !== -1, true);
res = await s.anadir({ tipo: 'texto', buscar: 'no existe esto', poner: 'x' });
comprobar('9. un trozo que no está avisa y no añade nada', [!!res.aviso, s.lineas.length], [true, 1]);

console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
