/* Prueba de lógica (jsdom, sin navegador) de la fila 510 de docs/COLA.md (docs/510-PARRAFOS-SEGUN-EL-ASUNTO.md):
   los textos condicionales {si:Campo=Valor} de las plantillas de correo y de Word.
   1. Correo: con «Sí» sale solo el párrafo del «Sí», sin la marca y sin dejar líneas en blanco de más.
   2. Correo: campo vacío -> salen los dos párrafos con «[falta: Campo]» y el campo entra en `faltan`.
   3. Correo: un campo o un valor que el tipo no tiene -> «[falta: Campo]».
   4. Correo: lo escrito en «Faltan datos» (aMano) decide el párrafo.
   5. Una plantilla sin marcas sale igual que antes.
   6. Word: el párrafo que toca sale sin la marca (aunque venga partida en tres trozos) y el otro desaparece.
   7. Word: campo vacío -> los dos párrafos salen en amarillo con «[falta: Campo]» y el campo entra en `faltan`.
   8. Poner la marca en el párrafo del cursor (también en una línea en blanco) y cambiar la que hubiera.
   9. «Retocar»: la marca se pone al principio del párrafo, se cambia por otra y se quita al deshacer. */
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
for (const f of ['util.js', 'texto-condicional.js', 'plantillas.js', 'docx.js', 'genero.js', 'docx-sustituir.js', 'plantilla-retocar.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Docx, DocxSustituir, Plantillas, PlantillaRetocar, TextoCondicional } = win;

const PROT = 'Protocolo de absentismo iniciado';
const LISTAS = { [PROT]: ['Sí', 'No'] };
const valoresCon = (valor, extra) => Object.assign({ nombre: 'Ana', campos: valor ? { [PROT]: valor } : {}, camposLista: LISTAS }, extra || {});

const CORREO = 'Estimada familia:\n\nLes enviamos la resolución de {nombre}.\n\n' +
  '{si:' + PROT + '=Sí} Se inició el protocolo de absentismo.\n\n' +
  '{si:' + PROT + '=No} No se inició el protocolo.\n\nAtentamente,\nEl centro';

/* ---------- 1 ---------- */
console.log('--- 1. correo: el párrafo que toca ---');
let r = Plantillas.rellenar(CORREO, valoresCon('Sí'));
comprobar('1. con «Sí» sale solo el del «Sí», sin marca', r.texto,
  'Estimada familia:\n\nLes enviamos la resolución de Ana.\n\nSe inició el protocolo de absentismo.\n\nAtentamente,\nEl centro');
comprobar('1. y no falta nada', r.faltan, []);
r = Plantillas.rellenar(CORREO, valoresCon('no'));
comprobar('1. con «no» (sin mayúscula) sale el del «No»', r.texto.indexOf('No se inició el protocolo.') !== -1 && r.texto.indexOf('Se inició el protocolo de absentismo') === -1 && r.texto.indexOf('{si:') === -1, true);
r = Plantillas.rellenar('Hola.\n\n{si:' + PROT + '=No} Solo si no.', valoresCon('Sí'));
comprobar('1. si lo que se quita es el último párrafo, no queda la línea en blanco', r.texto, 'Hola.');

/* ---------- 2 ---------- */
console.log('--- 2. correo: campo vacío ---');
r = Plantillas.rellenar(CORREO, valoresCon(''));
comprobar('2. salen los dos con «[falta: …]» delante', [
  r.texto.indexOf('[falta: ' + PROT + '] Se inició el protocolo de absentismo.') !== -1,
  r.texto.indexOf('[falta: ' + PROT + '] No se inició el protocolo.') !== -1, r.texto.indexOf('{si:') === -1], [true, true, true]);
comprobar('2. el campo está en faltan', r.faltan.indexOf(PROT) !== -1, true);

/* ---------- 3 ---------- */
console.log('--- 3. correo: campo o valor que no existen ---');
r = Plantillas.rellenar('{si:Otro campo=Sí} Texto.', valoresCon('Sí'));
comprobar('3. un campo que el tipo no tiene sale con «[falta: …]»', [r.texto, r.faltan], ['[falta: Otro campo] Texto.', ['Otro campo']]);
r = Plantillas.rellenar('{si:' + PROT + '=Quizá} Texto.', valoresCon('Sí'));
comprobar('3. un valor que no está en la lista, también', r.texto, '[falta: ' + PROT + '] Texto.');

/* ---------- 4 ---------- */
console.log('--- 4. correo: lo escrito en «Faltan datos» ---');
r = Plantillas.rellenar(CORREO, valoresCon('', { aMano: { [PROT]: 'No' } }));
comprobar('4. decide el párrafo, sin nada en amarillo', [r.texto.indexOf('No se inició el protocolo.') !== -1, r.texto.indexOf('Se inició el protocolo de absentismo') === -1, r.texto.indexOf('[falta') === -1], [true, true, true]);
comprobar('4. las opciones para el desplegable', TextoCondicional.opcionesDeFalta(PROT), ['Sí', 'No']);

/* ---------- 5 ---------- */
console.log('--- 5. sin marcas ---');
r = Plantillas.rellenar('Hola {nombre}.\n\nAdiós.', valoresCon('Sí'));
comprobar('5. sale como siempre', r.texto, 'Hola Ana.\n\nAdiós.');

/* ---------- 6 y 7: Word ---------- */
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const p = (...runs) => '<w:p>' + runs.join('') + '</w:p>';
const rr = (t) => '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">' + t + '</w:t></w:r>';
const CUERPO = [
  p(rr('Tercero. Antecedentes de {nombre}.')),
  p(rr('{si:Protocolo '), rr('de absentismo iniciado='), rr('Sí} Se inició el protocolo.')),
  p(rr('{si:' + PROT + '=No} No se inició el protocolo.')),
  p(rr('Fin.'))
];
const documento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + CUERPO.join('') +
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>';
const original = await construirZipDePrueba([
  { nombre: '[Content_Types].xml', texto: '<Types/>', comprimir: false },
  { nombre: 'word/document.xml', texto: documento, comprimir: true },
  { nombre: 'word/styles.xml', texto: '<styles/>', comprimir: false }
]);
const generar = async (valores) => {
  const res = await Docx.rellenar(original, valores);
  const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
  return { xml, faltan: res.faltan, textos: DocxSustituir.textosDeParrafos(xml) };
};
console.log('--- 6. Word: el párrafo que toca ---');
let g = await generar(valoresCon('Sí'));
comprobar('6. sale el del «Sí» (la marca venía en tres trozos) y el del «No» desaparece', g.textos,
  ['Tercero. Antecedentes de Ana.', 'Se inició el protocolo.', 'Fin.']);
comprobar('6. sin amarillo ni faltas', [g.xml.indexOf('w:highlight'), g.faltan], [-1, []]);
g = await generar(valoresCon('No'));
comprobar('6. con «No» sale el otro', g.textos, ['Tercero. Antecedentes de Ana.', 'No se inició el protocolo.', 'Fin.']);
console.log('--- 7. Word: campo vacío ---');
g = await generar(valoresCon(''));
comprobar('7. salen los dos con «[falta: …]»', g.textos, ['Tercero. Antecedentes de Ana.',
  '[falta: ' + PROT + '] Se inició el protocolo.', '[falta: ' + PROT + '] No se inició el protocolo.', 'Fin.']);
comprobar('7. en amarillo (solo esos dos) y el campo está en faltan', [(g.xml.match(/w:highlight/g) || []).length, g.faltan], [4, [PROT]]);
g = await generar(valoresCon('', { aMano: { [PROT]: 'Sí' } }));
comprobar('7. lo escrito en «Faltan datos» decide', g.textos, ['Tercero. Antecedentes de Ana.', 'Se inició el protocolo.', 'Fin.']);

/* ---------- 8 ---------- */
console.log('--- 8. poner la marca en un texto ---');
const T = 'Uno.\n\nDos aquí.\n\nTres.';
let t = TextoCondicional.ponerEnTexto(T, 8, PROT, 'Sí');
comprobar('8. el cursor en el párrafo: la marca va al principio de ese', t.texto, 'Uno.\n\n{si:' + PROT + '=Sí} Dos aquí.\n\nTres.');
comprobar('8. y el cursor queda detrás de la marca', t.cursor, 6 + ('{si:' + PROT + '=Sí} ').length);
t = TextoCondicional.ponerEnTexto(T, 5, PROT, 'No');
comprobar('8. el cursor en la línea en blanco: cuenta el párrafo de encima', t.texto.split('\n\n')[0], '{si:' + PROT + '=No} Uno.');
t = TextoCondicional.ponerEnTexto(t.texto, 3, PROT, 'Sí');
comprobar('8. si ya tenía una marca, se cambia por la nueva', t.texto.split('\n\n')[0], '{si:' + PROT + '=Sí} Uno.');
comprobar('8. el aviso', TextoCondicional.avisoDeMarca('Campo', 'Sí'), 'Marca puesta: el párrafo solo saldrá si «Campo» es «Sí».');

/* ---------- 9 ---------- */
console.log('--- 9. «Retocar» ---');
const CUERPO2 = [p(rr('Primero.')), p(rr('No llegó a iniciarse el protocolo.')), p(rr('Fin.'))];
const doc2 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + CUERPO2.join('') +
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>';
const orig2 = await construirZipDePrueba([
  { nombre: '[Content_Types].xml', texto: '<Types/>', comprimir: false },
  { nombre: 'word/document.xml', texto: doc2, comprimir: true },
  { nombre: 'word/styles.xml', texto: '<styles/>', comprimir: false }
]);
const s = PlantillaRetocar.nueva(orig2);
await s.aplicar();
let res = await s.anadir({ tipo: 'condicion', indice: 1, resumen: 'No llegó…', campo: PROT, valor: 'No' });
let ts = (await DocxSustituir.leerParrafos(s.trabajo.bytes)).cuerpo;
comprobar('9. la marca va al principio del párrafo', ts[1], '{si:' + PROT + '=No} No llegó a iniciarse el protocolo.');
comprobar('9. cuenta una vez y la línea se describe', [s.veces(res.linea), PlantillaRetocar.descripcion(res.linea).antes],
  [1, 'Texto condicional: «No llegó…» solo sale si «' + PROT + '» es «No»']);
await s.anadir({ tipo: 'condicion', indice: 1, resumen: 'No llegó…', campo: PROT, valor: 'Sí' });
ts = (await DocxSustituir.leerParrafos(s.trabajo.bytes)).cuerpo;
comprobar('9. una marca nueva sustituye a la anterior (una sola línea)', [ts[1], s.lineas.length], ['{si:' + PROT + '=Sí} No llegó a iniciarse el protocolo.', 1]);
const gen = await Docx.rellenar(s.trabajo.bytes, valoresCon('No'));
comprobar('9. el Word retocado se genera: con «No» el párrafo desaparece', DocxSustituir.textosDeParrafos(await Docx.leerEntradaDeTexto(new Uint8Array(await gen.blob.arrayBuffer()), 'word/document.xml')), ['Primero.', 'Fin.']);
await s.quitar(s.lineas[0].id);
ts = (await DocxSustituir.leerParrafos(s.trabajo.bytes)).cuerpo;
comprobar('9. deshacer quita la marca', ts[1], 'No llegó a iniciarse el protocolo.');

console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
