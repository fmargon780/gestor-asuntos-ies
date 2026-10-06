/* Prueba de lógica (jsdom, sin navegador) de la fila 280 de docs/COLA.md
   (docs/CONVERTIR-EN-PLANTILLA.md): cambiar texto dentro de un .docx (js/docx-sustituir.js) y las
   propuestas de «Convertir en plantilla» (js/convertir-en-plantilla-propuestas.js).
   1. Un texto partido en varios trozos se cambia, y el formato del primer trozo se conserva.
   2. Siempre se parte del original: aplicar dos veces da lo mismo; sin cambios, nada cambia.
   3. Quitar un párrafo por su posición, quitar la cabecera, poner {{MEMBRETE}} (sin duplicarlo).
   4. Las propuestas de los cuatro grupos con un asunto inventado.
   5. Un hueco «se pregunta cada vez» ({campo:…}) acaba en «Faltan datos» al rellenar.
   6. Ida y vuelta: con todo aplicado, rellenar con el mismo asunto devuelve el texto original. */
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
for (const f of ['util.js', 'plantillas.js', 'docx.js', 'genero.js', 'docx-sustituir.js', 'plantilla-de-lo-escrito.js', 'convertir-en-plantilla-propuestas.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Docx, DocxSustituir, Plantillas, ConvertirEnPlantillaPropuestas: Prop, Genero } = win;

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const p = (...runs) => '<w:p>' + runs.join('') + '</w:p>';
const r = (t, negrita) => '<w:r>' + (negrita ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + t + '</w:t></w:r>';
const IMAGEN = '<w:p><w:r><w:drawing><wp:inline xmlns:wp="x"/></w:drawing></w:r></w:p>';
const CUERPO = [
  IMAGEN,
  p(r('JUNTA DE ANDALUCÍA - Consejería de Educación')),
  p(r('CERTIFICADO DE MATRÍCULA', true)),
  p(r('D. Fernando Reyes Palma, Secretario del centro,')),
  p(r('CERTIFICA: Que la alumna '), r('Carla', true), r(' Espejo Montes, con número de identificación escolar 2100006, está matriculada en este centro en el curso actual.')),
  p(r('Y para que conste, y para presentarlo en la solicitud de beca, firmo el presente certificado.')),
  p(r('En Localidad de pruebas, a 3 de octubre de 2026')),
  p(r('Fdo.: Fernando Reyes Palma'))
];
const documento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + '><w:body>' + CUERPO.join('') +
  '<w:sectPr><w:headerReference w:type="default" r:id="rId9" xmlns:r="x"/><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>';
const pie = '<?xml version="1.0" encoding="UTF-8"?><w:ftr ' + W + '>' + p(r('Expediente de Carla Espejo Montes')) + '</w:ftr>';
const cabecera = '<?xml version="1.0" encoding="UTF-8"?><w:hdr ' + W + '>' + p(r('Cabecera antigua')) + '</w:hdr>';
const original = await construirZipDePrueba([
  { nombre: '[Content_Types].xml', texto: '<Types/>', comprimir: false },
  { nombre: 'word/document.xml', texto: documento, comprimir: true },
  { nombre: 'word/header1.xml', texto: cabecera, comprimir: true },
  { nombre: 'word/footer1.xml', texto: pie, comprimir: true },
  { nombre: 'word/styles.xml', texto: '<styles/>', comprimir: false }
]);
const xmlDe = async (bytes, n) => Docx.leerEntradaDeTexto(bytes, n);
const plano = (xml) => DocxSustituir.textosDeParrafos(xml);

/* ---------- 1. un texto partido en varios trozos ---------- */
console.log('--- 1. cambiar un texto partido ---');
const r1 = await DocxSustituir.aplicar(original, { cambios: [{ id: 'n', buscar: 'Carla Espejo Montes', poner: '{nombreNatural}' }] });
const doc1 = await xmlDe(r1.bytes, 'word/document.xml');
comprobar('1. el hueco está en su sitio, en su frase', plano(doc1)[4], 'CERTIFICA: Que la alumna {nombreNatural}, con número de identificación escolar 2100006, está matriculada en este centro en el curso actual.');
comprobar('1. cuenta 1 vez en el cuerpo y 1 en el pie', r1.veces.n, 2);
comprobar('1. el pie también cambia', plano(await xmlDe(r1.bytes, 'word/footer1.xml')), ['Expediente de {nombreNatural}']);
comprobar('1. el formato del primer trozo se conserva (negrita en el hueco)', /<w:r><w:rPr><w:b\/><\/w:rPr><w:t xml:space="preserve">\{nombreNatural\}<\/w:t><\/w:r>/.test(doc1), true);
comprobar('1. lo de fuera del tramo no se toca (estilos, cabecera)', [await xmlDe(r1.bytes, 'word/styles.xml'), await xmlDe(r1.bytes, 'word/header1.xml') === cabecera], ['<styles/>', true]);
comprobar('1. sin tildes ni mayúsculas', (await DocxSustituir.aplicar(original, { cambios: [{ id: 'x', buscar: 'junta de andalucia', poner: 'X' }] })).veces.x, 1);
comprobar('1. palabra entera (no «carlas»)', DocxSustituir.contar('Carlas y Carla', 'carla'), 1);
comprobar('1. un valor con & y < sigue siendo xml válido', (await xmlDe((await DocxSustituir.aplicar(original, { cambios: [{ id: 'q', buscar: 'Carla Espejo Montes', poner: 'A & B <c>' }] })).bytes, 'word/document.xml')).indexOf('A &amp; B &lt;c&gt;') !== -1, true);

/* ---------- 2. siempre desde el original ---------- */
console.log('--- 2. siempre desde el original ---');
const cambiosDos = [{ id: 'n', buscar: 'Carla Espejo Montes', poner: '{nombreNatural}' }, { id: 'd', buscar: '2100006', poner: '{referencia}' }];
const a = await DocxSustituir.aplicar(original, { cambios: cambiosDos });
const b = await DocxSustituir.aplicar(original, { cambios: cambiosDos });
comprobar('2. dos veces lo mismo, dos resultados iguales', Buffer.from(a.bytes).equals(Buffer.from(b.bytes)), true);
const sin = await DocxSustituir.aplicar(original, { cambios: [] });
comprobar('2. sin cambios, el mismo texto', plano(await xmlDe(sin.bytes, 'word/document.xml')), plano(documento));
comprobar('2. un hueco recién puesto no se vuelve a cambiar', plano(await xmlDe((await DocxSustituir.aplicar(original, { cambios: [
  { id: 'n', buscar: 'Carla Espejo Montes', poner: '{nombreNatural}' }, { id: 'm', buscar: 'nombreNatural', poner: 'ZZ' }] })).bytes, 'word/document.xml'))[4].indexOf('{nombreNatural}') !== -1, true);

/* ---------- 3. quitar, cabecera, membrete ---------- */
console.log('--- 3. quitar párrafos, cabecera y membrete ---');
const r3 = await DocxSustituir.aplicar(original, { quitarParrafos: [0, 1], sinCabecera: true, membrete: true });
const doc3 = await xmlDe(r3.bytes, 'word/document.xml');
comprobar('3. el párrafo de la imagen y el rótulo ya no están; el primero es el membrete', plano(doc3).slice(0, 2), ['{{MEMBRETE}}', 'CERTIFICADO DE MATRÍCULA']);
comprobar('3. sin <w:drawing> y sin referencia a la cabecera', [doc3.indexOf('<w:drawing') === -1, doc3.indexOf('headerReference') === -1], [true, true]);
comprobar('3. no se duplica el membrete', plano(await xmlDe((await DocxSustituir.aplicar(r3.bytes, { membrete: true })).bytes, 'word/document.xml')).filter((t) => t === '{{MEMBRETE}}').length, 1);
comprobar('3. quitar un texto que vacía el párrafo quita el párrafo', plano(await xmlDe((await DocxSustituir.aplicar(original, { cambios: [{ id: 'z', buscar: 'Fdo.: Fernando Reyes Palma', poner: '' }] })).bytes, 'word/document.xml')).length, CUERPO.length - 1);

/* ---------- 4. las propuestas ---------- */
console.log('--- 4. las propuestas de los cuatro grupos ---');
const valores = { nombre: 'Espejo Montes, Carla', nombreNatural: 'Carla Espejo Montes', referencia: '2100006', hoyLargo: '3 de octubre de 2026',
  lugarYFecha: 'En Localidad de pruebas, a 3 de octubre de 2026', hoy: '03/10/2026', centro: 'IES Fuente Lucena', campos: {},
  sexos: { tercero: 'M', firmante: 'H', tutor1: '', tutor2: '', vistobueno: '' } };
const cargos = [{ id: 'secretaria', nombre: 'Secretaría', persona: 'Reyes Palma, Fernando', sexo: 'H', tratamiento: 'El Secretario' },
                { id: 'direccion', nombre: 'Dirección', persona: 'Prieto Gil, Ana', sexo: 'M', tratamiento: 'La Directora' }];
const leidos = await DocxSustituir.leerParrafos(original);
const cuerpoConImagen = DocxSustituir.parrafosConImagen(documento);
const prop = Prop.proponer({ cuerpo: cuerpoConImagen, pies: leidos.pies, valores, cargos, centro: { nombre: 'IES Fuente Lucena', codigo: '29700692' },
  firmanteSexo: 'H', hayCabecera: leidos.hayCabecera, tieneMembrete: false });
const resumen = (l) => [l.buscar, l.poner, l.veces];
comprobar('4. datos: nombre (2 veces: cuerpo y pie), número y lugar y fecha', prop.datos.map(resumen),
  [['Carla Espejo Montes', '{nombreNatural}', 2], ['2100006', '{referencia}', 1], ['En Localidad de pruebas, a 3 de octubre de 2026', '{lugarYFecha}', 1]]);
comprobar('4. firma: el primero que sale firma y se cuentan sus 2 veces', prop.firma.map(resumen), [['Fernando Reyes Palma', '{{FIRMANTE}}', 2]]);
comprobar('4. género: «la alumna», «matriculada» y los «D.» pegados', prop.genero.map((l) => [l.mostrar, l.mostrarPoner, l.tambien || '']),
  [['D.', 'D./Dña.:firmante', 'firma0'], ['la alumna', 'el/la alumno/a', ''], ['matriculada', 'matriculado/a', '']]);
comprobar('4. quitar: la imagen y el rótulo de la cabecera antigua, no el título', prop.quitar.map((l) => [l.indice, l.buscar]),
  [[0, '(imagen)'], [1, 'JUNTA DE ANDALUCÍA - Consejería de Educación']]);
comprobar('4. un nombre en MAYÚSCULAS se avisa', Prop.lineasDeDatos('CARLA ESPEJO MONTES', valores)[0].nota, '(estaba en mayúsculas)');
comprobar('4. «solicitud de beca» y «Secretario» no se proponen', prop.lineas.some((l) => /beca|Secretario/.test(l.buscar)), false);
comprobar('4. con sexo desconocido no se propone ninguna forma doble', Prop.proponer({ cuerpo: cuerpoConImagen, pies: [], valores: Object.assign({}, valores, { sexos: { tercero: '' } }), cargos: [], centro: {}, hayCabecera: false }).genero.length, 0);
comprobar('4. cada forma doble devuelve el texto de partida con su sexo', prop.genero.filter((l) => !l.tambien).every((l) => Genero.resolver(l.poner, { tercero: 'M' }).texto === l.buscar), true);
comprobar('4. y con el otro sexo da la otra forma', Genero.resolver('el/la alumno/a', { tercero: 'H' }).texto, 'el alumno');

/* ---------- 5. «se pregunta cada vez» ---------- */
console.log('--- 5. el hueco de «se pregunta cada vez» ---');
const falta = Plantillas.rellenar('Para qué: {campo:Para qué se presenta}.', { campos: {} });
comprobar('5. sin dato, queda en «faltan» con su nombre', falta.faltan, ['Para qué se presenta']);
comprobar('5. con lo escrito a mano (valores.aMano), se rellena', Plantillas.rellenar('{campo:Para qué se presenta}', { campos: {}, aMano: { 'Para qué se presenta': 'una beca' } }).texto, 'una beca');

/* ---------- 6. ida y vuelta ---------- */
console.log('--- 6. ida y vuelta: rellenar con el mismo asunto devuelve el original ---');
const ordenados = prop.lineas.filter((l) => l.grupo !== 'quitar');
const aplicables = ordenados.filter((l) => !l.tambien || ordenados.some((x) => x.id === l.tambien)).map((l) => ({ id: l.id, buscar: l.buscar, poner: l.poner, tambien: l.tambien }));
aplicables.sort((x, y) => y.buscar.length - x.buscar.length);
const ida = await DocxSustituir.aplicar(original, { cambios: aplicables, quitarParrafos: [], sinCabecera: false });
const vuelta = await Docx.rellenar(ida.bytes, Object.assign({}, valores, { firmante: 'Fernando Reyes Palma', 'tratamiento firmante': 'El Secretario' }));
comprobar('6. el texto del cuerpo vuelve a ser el original', plano(await xmlDe(new Uint8Array(await vuelta.blob.arrayBuffer()), 'word/document.xml')), plano(documento));
comprobar('6. y no faltó ningún dato', vuelta.faltan, []);

console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
