/* Prueba de lógica (jsdom) del teléfono y el correo del centro (fila 375,
   docs/TELEFONO-Y-CORREO-DEL-CENTRO.md): los dos huecos nuevos y el pie común
   que `Docx.ponerPie` pone en los Word con {{MEMBRETE}}. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

/* ============================================================
   1. Montar la página: jsdom con document, y los globales de Node 22
   (DecompressionStream, CompressionStream...) puestos en su window,
   "tal cual, sin importar nada" (son las mismas clases del proceso).
   ============================================================ */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.DecompressionStream = DecompressionStream;
win.CompressionStream = CompressionStream;
win.TextEncoder = TextEncoder;
win.TextDecoder = TextDecoder;
win.Blob = Blob;
win.Response = Response;

/* Un disco de mentira mínimo, solo para Plantillas.cargar (escenario 8):
   aquí no hace falta nada más de js/carpetas.js. */
win.Carpetas = {
  leerJson: async (gestor) => (gestor && gestor.contenido) || null,
  crear: async () => ({}),
  ficheros: async () => []
};
/* App mínimo: para que js/plantillas-documento.js pueda cargar sin
   petar (envuelve App.abrirFicha, que aquí no existe, y se queda sin
   hacer nada) y para poder llamar a PlantillasDocumento.nombreDelDocumentoGenerado. */
win.App = { E: {}, LARGO_MAXIMO_NOMBRE: 180 };

for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'plantillas.js', 'plantillas-valores.js', 'docx.js', 'docx-imagen.js', 'docx-pie.js', 'docx-tabla.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Plantillas, Docx } = win;

/* ============================================================
   2. Un escritor de ZIP independiente, solo para las pruebas: no
   comparte código con js/docx.js, para no acabar comprobándose a sí
   mismo. Las entradas de texto se comprimen de verdad con
   CompressionStream (método 8, deflate), como haría Word.
   ============================================================ */

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32DePrueba(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = TABLA_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function deflateRaw(bytes) {
  const flujo = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

function u16(buf, off, v) { buf[off] = v & 0xFF; buf[off + 1] = (v >>> 8) & 0xFF; }
function u32(buf, off, v) {
  buf[off] = v & 0xFF; buf[off + 1] = (v >>> 8) & 0xFF;
  buf[off + 2] = (v >>> 16) & 0xFF; buf[off + 3] = (v >>> 24) & 0xFF;
}
function concat(lista) {
  const total = lista.reduce((n, b) => n + b.length, 0);
  const salida = new Uint8Array(total);
  let pos = 0;
  for (const b of lista) { salida.set(b, pos); pos += b.length; }
  return salida;
}

/* `entradas`: [{ nombre, texto, comprimir }]. `comprimir` true -> se
   guarda con deflate (método 8, como Word); false -> almacenado
   (método 0), para tener también una entrada "no tocada" de verdad. */
async function construirZipDePrueba(entradas) {
  const partes = [];
  const centrales = [];
  let offset = 0;

  for (const e of entradas) {
    const datos = new TextEncoder().encode(e.texto);
    const comprimidos = e.comprimir ? await deflateRaw(datos) : datos;
    const metodo = e.comprimir ? 8 : 0;
    const crc = crc32DePrueba(datos);
    const nombreBytes = new TextEncoder().encode(e.nombre);

    const local = new Uint8Array(30 + nombreBytes.length);
    u32(local, 0, 0x04034b50);
    u16(local, 4, 20); u16(local, 6, 0); u16(local, 8, metodo);
    u16(local, 10, 0); u16(local, 12, 0x21);   /* una fecha DOS cualquiera, válida */
    u32(local, 14, crc);
    u32(local, 18, comprimidos.length);
    u32(local, 22, datos.length);
    u16(local, 26, nombreBytes.length);
    u16(local, 28, 0);
    local.set(nombreBytes, 30);

    partes.push(local, comprimidos);

    const central = new Uint8Array(46 + nombreBytes.length);
    u32(central, 0, 0x02014b50);
    u16(central, 4, 20); u16(central, 6, 20); u16(central, 8, 0); u16(central, 10, metodo);
    u16(central, 12, 0); u16(central, 14, 0x21);
    u32(central, 16, crc);
    u32(central, 20, comprimidos.length);
    u32(central, 24, datos.length);
    u16(central, 28, nombreBytes.length);
    u16(central, 30, 0); u16(central, 32, 0); u16(central, 34, 0); u16(central, 36, 0);
    u32(central, 38, 0);
    u32(central, 42, offset);
    central.set(nombreBytes, 46);
    centrales.push(central);

    offset += local.length + comprimidos.length;
  }

  const inicioCD = offset;
  const cd = concat(centrales);
  const eocd = new Uint8Array(22);
  u32(eocd, 0, 0x06054b50);
  u16(eocd, 4, 0); u16(eocd, 6, 0);
  u16(eocd, 8, entradas.length); u16(eocd, 10, entradas.length);
  u32(eocd, 12, cd.length);
  u32(eocd, 16, inicioCD);
  u16(eocd, 20, 0);

  return concat([...partes, cd, eocd]);
}

const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="xml" ContentType="application/xml"/></Types>';


function documentoXml(cuerpo, sect) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + cuerpo + (sect === undefined ? '<w:sectPr/>' : sect) + '</w:body></w:document>';
}
const MEMBRETE = '<w:p><w:r><w:t>{{MEMBRETE}}</w:t></w:r></w:p>';
const TEXTO = '<w:p><w:r><w:t>Certifico que {nombre}.</w:t></w:r></w:p>';
const STYLES = '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="24"/></w:rPr></w:style></w:styles>';
const RELS_BASE = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="x" Target="styles.xml"/></Relationships>';

async function zip(entradas) {
  return construirZipDePrueba([{ nombre: '[Content_Types].xml', texto: CONTENT_TYPES, comprimir: false }].concat(entradas));
}
async function entrada(bytes, nombre) { return Docx.leerEntradaDeTexto(bytes, nombre); }
function nombres(bytes) { return Docx.leerDirectorioCentral(new Uint8Array(bytes)).map((e) => e.nombre); }
async function textoDePies(bytes) {
  const lista = nombres(bytes).filter((n) => /^word\/footer.*\.xml$/.test(n));
  const textos = [];
  for (const n of lista) textos.push((await entrada(bytes, n)).replace(/<[^>]+>/g, '').trim());
  return textos;
}

/* 1 y 4. Los dos huecos: en Word con doble llave y en correos con una, con los datos del Centro de datos. */
{
  win.CentroDeDatos = { leerApuntes: async () => ({ configuracion: { telefono: '958 123 456', direccionDelCentro: 'secretaria@centro.es' } }) };
  const v = await Plantillas.valoresDeAsunto({}, {});
  comprobar('1. valores: teléfono del centro', v['telefono del centro'], '958 123 456');
  comprobar('1. valores: correo del centro', v['correo del centro'], 'secretaria@centro.es');
  const correo = Plantillas.rellenar('Llame al {teléfono del centro} o escriba a {correo del centro}. Suyo: {telefono}.', v);
  comprobar('4. el correo preparado los lleva rellenos (y {telefono} sigue siendo el de la persona)', correo.texto, 'Llame al 958 123 456 o escriba a secretaria@centro.es. Suyo: .');
  comprobarQue('4. aparecen en el catálogo de huecos, con «del centro» en la etiqueta',
    ['telefono del centro', 'correo del centro'].every((k) => Plantillas.HUECOS.some((h) => h.clave === k && /del centro/.test(h.etiqueta))));
  const zipW = await zip([{ nombre: 'word/document.xml', texto: documentoXml('<w:p><w:r><w:t>{{TELÉFONO DEL CENTRO}} · {{CORREO DEL CENTRO}}</w:t></w:r></w:p>'), comprimir: true }]);
  const r = await Docx.rellenar(zipW, v);
  const xml = await entrada(await r.blob.arrayBuffer(), 'word/document.xml');
  comprobarQue('1. en Word, con doble llave y mayúsculas', xml.includes('958 123 456 · secretaria@centro.es'), xml);

  win.CentroDeDatos = { leerApuntes: async () => ({ configuracion: null }) };
  const v2 = await Plantillas.valoresDeAsunto({}, {});
  const r2 = Plantillas.rellenar('T {teléfono del centro} C {correo del centro}', v2);
  comprobar('1. sin dato, en blanco y sin preguntar', [r2.texto, r2.faltan], ['T  C ', []]);
}

/* 2. Un documento con membrete recibe el pie, sin tocar su plantilla (sin pie previo). */
{
  const original = await zip([
    { nombre: 'word/document.xml', texto: documentoXml(MEMBRETE + TEXTO), comprimir: true },
    { nombre: 'word/_rels/document.xml.rels', texto: RELS_BASE, comprimir: true },
    { nombre: 'word/styles.xml', texto: STYLES, comprimir: false }
  ]);
  const con = await Docx.ponerPie(original, { telefono: '958 123 456', correo: 'secretaria@centro.es' });
  comprobar('2. el pie lleva teléfono y correo', await textoDePies(con), ['Teléfono 958 123 456 · Correo secretaria@centro.es']);
  const pie = await entrada(con, nombres(con).find((n) => /footer/.test(n)));
  comprobarQue('2. centrado, 2 puntos menos que el Normal (12 pt → 10 pt) y gris', /w:jc w:val="center"/.test(pie) && /w:sz w:val="20"/.test(pie) && /w:color w:val="404040"/.test(pie), pie);
  const doc = await entrada(con, 'word/document.xml');
  const rels = await entrada(con, 'word/_rels/document.xml.rels');
  const tipos = await entrada(con, '[Content_Types].xml');
  comprobarQue('2. enganchado en la sección, en las relaciones y en los tipos de contenido',
    /<w:sectPr><w:footerReference [^>]*w:type="default"/.test(doc) && /relationships\/footer/.test(rels) && /footer\+xml/.test(tipos), doc + rels + tipos);
  comprobarQue('2. rellenar sigue funcionando sobre el resultado', (await Docx.rellenar(con, { nombre: 'Virginia' })).blob.size > 0);
  const lleno = await Docx.rellenar(con, { nombre: 'Virginia' });
  comprobarQue('2. y el pie no pierde su texto al rellenar', (await textoDePies(await lleno.blob.arrayBuffer()))[0].includes('Teléfono 958'));
}

/* 3. Sin membrete: exactamente como hoy. */
{
  const original = await zip([{ nombre: 'word/document.xml', texto: documentoXml(TEXTO), comprimir: true }]);
  const sin = await Docx.ponerPie(original, { telefono: '958 123 456', correo: 'a@b.es' });
  comprobar('3. sin {{MEMBRETE}}, ni una entrada nueva', nombres(sin), nombres(original));
}

/* 5. Faltan datos. */
{
  const original = await zip([{ nombre: 'word/document.xml', texto: documentoXml(MEMBRETE + TEXTO), comprimir: true }]);
  comprobar('5. sin teléfono, solo el correo',
    await textoDePies(await Docx.ponerPie(original, { telefono: '', correo: 'a@b.es' })), ['Correo a@b.es']);
  comprobar('5. sin correo, solo el teléfono',
    await textoDePies(await Docx.ponerPie(original, { telefono: '958 1', correo: '' })), ['Teléfono 958 1']);
  comprobar('5. sin ninguno, no hay pie', nombres(await Docx.ponerPie(original, {})), nombres(original));
}

/* Pies que ya existen. */
{
  const conPie = (texto) => zip([
    { nombre: 'word/document.xml', texto: documentoXml(MEMBRETE + TEXTO, '<w:sectPr><w:footerReference w:type="default" r:id="rId9" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></w:sectPr>'), comprimir: true },
    { nombre: 'word/_rels/document.xml.rels', texto: RELS_BASE.replace('</Relationships>', '<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'), comprimir: true },
    { nombre: 'word/footer1.xml', texto: '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p>' + texto + '</w:p></w:ftr>', comprimir: true }
  ]);
  const datos = { telefono: '958 1', correo: 'a@b.es' };
  const conTexto = await conPie('<w:r><w:t>Pie del instituto</w:t></w:r>');
  comprobar('un pie con texto se deja tal cual', await textoDePies(await Docx.ponerPie(conTexto, datos)), ['Pie del instituto']);
  const conNumero = await conPie('<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r>');
  const trasNumero = await Docx.ponerPie(conNumero, datos);
  comprobar('un pie con solo el número de página se deja tal cual', nombres(trasNumero), nombres(conNumero));
  const vacio = await Docx.ponerPie(await conPie(''), datos);
  comprobar('un pie vacío se rellena con el nuestro, sin crear otro', [await textoDePies(vacio), nombres(vacio).filter((n) => /footer/.test(n)).length], [['Teléfono 958 1 · Correo a@b.es'], 1]);
  comprobarQue('sin styles.xml, 11 pt por defecto → 9 pt', /w:sz w:val="18"/.test(await entrada(vacio, 'word/footer1.xml')));
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
