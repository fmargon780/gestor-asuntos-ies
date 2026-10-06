/* Prueba de lógica (jsdom, sin navegador) de la fila 281 de docs/COLA.md
   (docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md): del texto de un PDF a párrafos (js/pdf-a-parrafos.js)
   y de los párrafos a un .docx (js/docx-crear.js), con trozos de texto inventados.
   1. Renglones y párrafos: dos renglones seguidos son un párrafo, un salto mayor empieza otro,
      el guion de corte de palabra se une, lo centrado se reconoce.
   2. El título: el primer párrafo centrado; si no hay, el primero corto con letra mayor.
   3. Lo que se repite en todas las páginas sale una sola vez, marcado.
   4. Las comprobaciones: sin texto, con tabla (y que un párrafo normal no lo parece).
   5. El .docx creado se abre, tiene el aspecto de las plantillas y se rellena con Docx.rellenar.
   6. Lo que se propone quitar de un PDF: lo repetido y los sellos de firma y de registro. */
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
Object.assign(win, { DecompressionStream, CompressionStream, TextEncoder, TextDecoder, Blob, Response });
win.Carpetas = { leerJson: async () => null, crear: async () => ({}), ficheros: async () => [] };
win.App = { E: {}, LARGO_MAXIMO_NOMBRE: 180 };
for (const f of ['util.js', 'plantillas.js', 'docx.js', 'genero.js', 'docx-sustituir.js', 'plantilla-de-lo-escrito.js', 'convertir-en-plantilla-propuestas.js', 'docx-crear.js', 'pdf-a-parrafos.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Docx, DocxSustituir, DocxCrear, PdfAParrafos: P, ConvertirEnPlantillaPropuestas: Prop } = win;

/* Un trozo de texto: el ancho se calcula a media letra por carácter (suficiente para las posiciones). */
const t = (texto, x, y, alto = 11) => ({ texto, x, y, ancho: texto.length * alto * 0.5, alto });
const centrado = (texto, y, alto = 11) => { const ancho = texto.length * alto * 0.5; return { texto, x: (595 - ancho) / 2, y, ancho, alto }; };
const CABECERA = t('IES Fuente Lucena - Secretaría', 50, 800, 9);
const pagina1 = { ancho: 595, alto: 842, items: [
  CABECERA,
  centrado('JUSTIFICANTE DE MATRÍCULA', 740, 16),
  t('Se hace constar que Pablo Aguilar Ponce, con número de identificación escolar 2100002,', 50, 690),
  t('ha formalizado su matrícula en este cen-', 50, 675),
  t('tro, para el curso que empieza.', 50, 660),
  t('En Localidad de pruebas, a 4 de octubre de 2026', 50, 610)
] };
const pagina2 = { ancho: 595, alto: 842, items: [
  CABECERA,
  t('Este justificante no tiene validez sin el sello del centro.', 50, 740),
  t('Firmado digitalmente por Fernando Reyes Palma', 50, 100, 9),
  t('Página 2', 280, 40, 8)
] };
pagina1.items.push(t('Página 1', 280, 40, 8));

console.log('--- 1. renglones y párrafos ---');
const rs = P.renglones({ ancho: 595, alto: 842, items: [t('mundo', 120, 700), t('Hola', 50, 700.4), t('abajo', 50, 600)] });
comprobar('1. los trozos de la misma altura, de izquierda a derecha, y de arriba abajo', rs.map((r) => r.texto), ['Hola mundo', 'abajo']);
const ps = P.parrafos([pagina1, pagina2]);
comprobar('1. los párrafos de las dos páginas, en orden', ps.map((p) => p.texto), [
  'IES Fuente Lucena - Secretaría', 'JUSTIFICANTE DE MATRÍCULA',
  'Se hace constar que Pablo Aguilar Ponce, con número de identificación escolar 2100002, ha formalizado su matrícula en este centro, para el curso que empieza.',
  'En Localidad de pruebas, a 4 de octubre de 2026', 'Página 1',
  'Este justificante no tiene validez sin el sello del centro.', 'Firmado digitalmente por Fernando Reyes Palma']);
comprobar('1. tres renglones seguidos son un solo párrafo y el guion de corte se une («cen-» + «tro»)', ps[2].texto.indexOf('este centro,') !== -1, true);
comprobar('1. lo centrado se reconoce; el resto no', ps.map((p) => p.centrado), [false, true, false, false, true, false, false]);
comprobar('1. el tamaño de la letra de cada párrafo', ps.map((p) => Math.round(p.tamano)), [9, 16, 11, 11, 8, 11, 9]);

console.log('--- 2. el título ---');
comprobar('2. el título es el primer párrafo centrado que no se repite', ps.filter((p) => p.titulo).map((p) => p.texto), ['JUSTIFICANTE DE MATRÍCULA']);
const sinCentrado = P.parrafos([{ ancho: 595, alto: 842, items: [t('Informe de situación', 50, 780, 18), t('Texto normal del informe, en un párrafo corto que acaba aquí mismo.', 50, 730)] }]);
comprobar('2. sin ninguno centrado, el primero corto con letra mayor que la del cuerpo', sinCentrado.map((p) => [p.texto, p.titulo]), [['Informe de situación', true], ['Texto normal del informe, en un párrafo corto que acaba aquí mismo.', false]]);
comprobar('2. puede no haber título', P.parrafos([{ ancho: 595, alto: 842, items: [t('Solo un párrafo de texto, igual que los demás.', 50, 700)] }]).some((p) => p.titulo), false);

console.log('--- 3. lo que se repite ---');
comprobar('3. la cabecera sale una vez y marcada; «Página 1» y «Página 2» cuentan como el mismo pie', ps.filter((p) => p.repetido).map((p) => p.texto), ['IES Fuente Lucena - Secretaría', 'Página 1']);
comprobar('3. con una sola página, nada se marca como repetido', P.parrafos([pagina1]).some((p) => p.repetido), false);

console.log('--- 4. las comprobaciones ---');
comprobar('4. sin texto: una página sin trozos, o con menos de 40 caracteres', [P.sinTexto([{ ancho: 595, alto: 842, items: [] }]), P.sinTexto([{ ancho: 595, alto: 842, items: [t('1', 50, 50)] }]), P.sinTexto([pagina1])], [true, true, false]);
const tabla = { ancho: 595, alto: 842, items: [
  t('Alumna Marina Aguilar', 50, 700), t('Curso 1 de la ESO', 230, 700), t('Grupo 1 A', 420, 700),
  t('Alumno Pablo Aguilar', 50, 684), t('Curso 3 de la ESO', 230, 684), t('Grupo 3 A', 420, 684),
  t('Alumna Noa Castro', 50, 668), t('Curso 2 de la ESO', 230, 668), t('Grupo 2 B', 420, 668)] };
comprobar('4. tres renglones con tres columnas alineadas: parece una tabla', P.tieneTabla([tabla]), true);
comprobar('4. dos renglones no bastan', P.tieneTabla([{ ancho: 595, alto: 842, items: tabla.items.slice(0, 6) }]), false);
comprobar('4. un párrafo normal (todos los trozos pegados) no lo parece', P.tieneTabla([pagina1, pagina2]), false);
comprobar('4. tres renglones con huecos pero sin alinear no son una tabla', P.tieneTabla([{ ancho: 595, alto: 842, items: [
  t('uno', 50, 700), t('dos', 200, 700), t('tres', 400, 700), t('uno', 60, 684), t('dos', 260, 684), t('tres', 330, 684), t('uno', 90, 668), t('dos', 140, 668), t('tres', 480, 668)] }]), false);

console.log('--- 5. el .docx ---');
const parrafos = [{ texto: 'JUSTIFICANTE DE MATRÍCULA', titulo: true, centrado: true }, { texto: 'Se hace constar que {nombre} ha formalizado su matrícula & más.', centrado: false }, { texto: 'En {localidad}', centrado: true }];
const bytes = DocxCrear.crear(parrafos);
const xml = await Docx.leerEntradaDeTexto(bytes, 'word/document.xml');
comprobar('5. se abre y trae los tres párrafos, en orden', DocxSustituir.textosDeParrafos(xml), ['JUSTIFICANTE DE MATRÍCULA', 'Se hace constar que {nombre} ha formalizado su matrícula & más.', 'En {localidad}']);
comprobar('5. el título, centrado, en negrita y a 16; los demás, justificados o centrados', [
  /<w:jc w:val="center"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:sz w:val="32"\/><\/w:rPr><w:t xml:space="preserve">JUSTIFICANTE/.test(xml),
  /<w:jc w:val="both"\/><\/w:pPr><w:r><w:t xml:space="preserve">Se hace constar/.test(xml), /<w:jc w:val="center"\/><\/w:pPr><w:r><w:t xml:space="preserve">En \{localidad\}/.test(xml)], [true, true, true]);
comprobar('5. con las mismas letras que las plantillas del centro (Calibri a 11)', /w:ascii="Calibri"[^>]*\/><w:sz w:val="22"\/>/.test(await Docx.leerEntradaDeTexto(bytes, 'word/styles.xml')), true);
const lleno = await Docx.rellenar(bytes, { nombre: 'Pablo Aguilar Ponce', localidad: 'Localidad de pruebas' });
comprobar('5. se rellena con Docx.rellenar', DocxSustituir.textosDeParrafos(await Docx.leerEntradaDeTexto(new Uint8Array(await lleno.blob.arrayBuffer()), 'word/document.xml')),
  ['JUSTIFICANTE DE MATRÍCULA', 'Se hace constar que Pablo Aguilar Ponce ha formalizado su matrícula & más.', 'En Localidad de pruebas']);
comprobar('5. y lo de convertir en plantilla puede cambiar su texto (DocxSustituir)', DocxSustituir.textosDeParrafos(await Docx.leerEntradaDeTexto(
  (await DocxSustituir.aplicar(bytes, { cambios: [{ id: 'x', buscar: '{nombre}', poner: '{nombreNatural}' }] })).bytes, 'word/document.xml'))[1].indexOf('{nombreNatural}') !== -1, true);

console.log('--- 6. lo que se propone quitar ---');
const cuerpo = ps.map((p) => ({ texto: p.texto, imagen: false }));
const quitar = Prop.lineasDeQuitarPdf(cuerpo, ps.map((p) => !!p.repetido));
comprobar('6. lo repetido y los sellos, cada uno en su línea con su índice', quitar.map((l) => [l.indice, l.buscar, l.nota]), [
  [0, 'IES Fuente Lucena - Secretaría', '(se repite en todas las páginas)'], [4, 'Página 1', '(se repite en todas las páginas)'],
  [6, 'Firmado digitalmente por Fernando Reyes Palma', '(sello de firma o de registro)']]);
for (const sello of ['Firmado por Ana', 'Código seguro de verificación (CSV): ABC123', 'Huella: 12:34:56', 'Registro 26EM1234 de entrada', 'Verificación en sede.']) {
  comprobar('6. sello: «' + sello + '»', Prop.lineasDeQuitarPdf([{ texto: sello }], [false]).length, 1);
}
comprobar('6. un párrafo normal no se propone', Prop.lineasDeQuitarPdf([{ texto: 'Se hace constar que ha formalizado su matrícula.' }], [false]).length, 0);
const completa = Prop.proponer({ cuerpo, pies: [], valores: { nombre: 'Aguilar Ponce, Pablo', nombreNatural: 'Pablo Aguilar Ponce', referencia: '2100002', centro: 'IES Fuente Lucena', campos: {}, sexos: {} },
  cargos: [], centro: { nombre: 'IES Fuente Lucena' }, tieneMembrete: false, desdePdf: true, repetidos: ps.map((p) => !!p.repetido) });
comprobar('6. juntas con lo de la cabecera de la fila 280, sin repetir ninguna', completa.quitar.map((l) => l.indice), [0, 4, 6]);

console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
