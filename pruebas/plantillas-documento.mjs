/* Prueba de lógica (jsdom, sin navegador de verdad) de las plantillas
   de documento de Word (docs/PLANTILLAS-DE-DOCUMENTO.md, 16-sep-2026,
   fila 17 de docs/COLA.md).

   No hace falta Playwright ni Chromium para esto: `js/docx.js` no usa
   más que ZIP y XML a mano, y Node 22 trae `DecompressionStream` y
   `CompressionStream` como globales, igual que el navegador. Aquí se
   construye un .docx de mentira a mano, con su propio escritor de ZIP
   (independiente del de js/docx.js, para no probarse a sí mismo), se
   rellena con `Docx.rellenar` y se comprueba el resultado.

   Los ocho escenarios (docs/PLANTILLAS-DE-DOCUMENTO.md, 8):
     1. Hueco partido en tres <w:t>: se rellena bien y la negrita de
        una palabra vecina que no es parte del hueco se conserva.
     2. Huecos de las cuatro clases (asunto, tercero, {campo:...} y
        centro), con sus valores.
     3. Hueco sin dato: se queda vacío y sale en "faltan".
     4. Hueco desconocido: se queda escrito y sale en "faltan".
     5. Valor con & y con <: el XML sigue siendo válido.
     6. El ZIP de salida se vuelve a abrir y trae el texto relleno
        (documento y una entrada no tocada, verbatim).
     7. El nombre del documento generado sale de Nombres.montarDocumento.
     8. Un plantillas.json viejo, sin `documentos` ni los campos nuevos
        del centro, sigue cargando.
     9. (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md) `{{MEMBRETE}}`
        y `{{FIRMANTE}}`/`{{TRATAMIENTO FIRMANTE}}`: `Docx.ponerImagen`
        deja la imagen dentro del ZIP (con su relación y su entrada en
        Content Types, creadas de cero, sin `.rels` de partida) y quita
        el hueco del membrete; `Plantillas.valoresDeAsunto` resuelve el
        firmante con el ocupante del cargo en la fecha del documento. */
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

for (const f of ['util.js', 'nombres.js', 'plantillas.js', 'docx.js', 'docx-imagen.js', 'docx-tabla.js', 'plantillas-documento.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Plantillas, Docx, Nombres, PlantillasDocumento } = win;

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

function documentoXml(cuerpoParrafos) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + cuerpoParrafos + '<w:sectPr/></w:body></w:document>';
}

/* ============================================================
   Escenario 1: la llave partida en tres <w:r>/<w:t>, con negrita en
   el trozo del medio, y una palabra vecina (no parte de ningún hueco)
   también en negrita, que tiene que seguir estándolo.
   ============================================================ */
{
  const parrafo =
    '<w:p>' +
      '<w:r><w:t>Estimado {</w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>nombre}</w:t></w:r>' +
      '<w:r><w:t xml:space="preserve">, le escribimos para informarle de la </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>matrícula</w:t></w:r>' +
      '<w:r><w:t>.</w:t></w:r>' +
    '</w:p>';
  const zip = await construirZipDePrueba([
    { nombre: '[Content_Types].xml', texto: CONTENT_TYPES, comprimir: false },
    { nombre: 'word/document.xml', texto: documentoXml(parrafo), comprimir: true }
  ]);

  const r = await Docx.rellenar(zip, { nombre: 'Pérez López, Ana' });
  const salida = await r.blob.arrayBuffer();
  const xmlFinal = await Docx.leerEntradaDeTexto(salida, 'word/document.xml');

  comprobarQue('1. el hueco partido se sustituye entero',
    xmlFinal.includes('Pérez López, Ana') && !xmlFinal.includes('{nombre}') && !xmlFinal.includes('{'),
    xmlFinal);
  comprobarQue('1. la negrita de la palabra vecina se conserva',
    xmlFinal.includes('<w:rPr><w:b/></w:rPr><w:t xml:space="preserve">matrícula</w:t>'),
    xmlFinal);
  comprobar('1. no faltan datos', r.faltan, []);
}

/* ============================================================
   Escenarios 2 a 5, en un mismo documento: cuatro huecos de clases
   distintas, uno sin dato, uno desconocido, y un valor con & y con <.
   ============================================================ */
{
  const parrafoClases =
    '<w:p><w:r><w:t>Asunto: {tipo}. Tercero: {referencia}. ' +
    'Campo: {campo:Trimestre}. Centro: {centro}.</w:t></w:r></w:p>';
  const parrafoSinDato = '<w:p><w:r><w:t>Límite: {limite}.</w:t></w:r></w:p>';
  const parrafoDesconocido = '<w:p><w:r><w:t>Dato: {cosaRara}.</w:t></w:r></w:p>';
  const parrafoEspecial = '<w:p><w:r><w:t>Nombre: {nombre}.</w:t></w:r></w:p>';

  const zip = await construirZipDePrueba([
    { nombre: '[Content_Types].xml', texto: CONTENT_TYPES, comprimir: false },
    { nombre: 'word/document.xml',
      texto: documentoXml(parrafoClases + parrafoSinDato + parrafoDesconocido + parrafoEspecial),
      comprimir: true }
  ]);

  const valores = {
    tipo: 'SANCION',
    referencia: '1234567',
    centro: 'IES Fuente Lucena',
    limite: '',
    nombre: 'Pérez & <Hijos>',
    campos: { 'Trimestre': '2º' }
  };
  const r = await Docx.rellenar(zip, valores);
  const salida = await r.blob.arrayBuffer();
  const xmlFinal = await Docx.leerEntradaDeTexto(salida, 'word/document.xml');

  /* 2. las cuatro clases */
  comprobarQue('2. hueco del asunto ({tipo})', xmlFinal.includes('Asunto: SANCION.'), xmlFinal);
  comprobarQue('2. hueco del tercero ({referencia})', xmlFinal.includes('Tercero: 1234567.'), xmlFinal);
  comprobarQue('2. hueco de campo propio ({campo:...})', xmlFinal.includes('Campo: 2º.'), xmlFinal);
  comprobarQue('2. hueco del centro ({centro})', xmlFinal.includes('Centro: IES Fuente Lucena.'), xmlFinal);

  /* 3. hueco sin dato: vacío, y en faltan */
  comprobarQue('3. el hueco sin dato se queda vacío', xmlFinal.includes('Límite: .'), xmlFinal);
  comprobarQue('3. "Fecha límite" sale en faltan', r.faltan.includes('Fecha límite'), JSON.stringify(r.faltan));

  /* 4. hueco desconocido: se deja escrito, y en faltan */
  comprobarQue('4. el hueco desconocido se deja escrito', xmlFinal.includes('Dato: {cosaRara}.'), xmlFinal);
  comprobarQue('4. "cosaRara" sale en faltan', r.faltan.includes('cosaRara'), JSON.stringify(r.faltan));

  /* 5. & y < siguen siendo XML válido */
  comprobarQue('5. el & del valor sale escapado',
    xmlFinal.includes('Nombre: Pérez &amp; &lt;Hijos&gt;.'), xmlFinal);
  comprobarQue('5. no queda ningún & ni < sin escapar en el texto',
    !/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xmlFinal.replace(/<[^>]*>/g, ' ')),
    xmlFinal);

  /* 6 (primera mitad): el ZIP de salida se reabre y trae el texto relleno */
  comprobarQue('6. el documento se reabre y trae el texto relleno',
    typeof xmlFinal === 'string' && xmlFinal.includes('SANCION'), xmlFinal);

  /* 6 (segunda mitad): una entrada NO tocada se copia verbatim */
  const contentTypesFinal = await Docx.leerEntradaDeTexto(salida, '[Content_Types].xml');
  comprobar('6. una entrada no tocada llega verbatim', contentTypesFinal, CONTENT_TYPES);

  /* Comprobación externa del formato ZIP: se guarda en una carpeta
     temporal del sistema y se puede abrir con `unzip`/`zipinfo`
     (herramienta de línea de comandos), no solo con el propio lector
     de js/docx.js. Ver el informe final. */
  const rutaDePrueba = path.join(os.tmpdir(), 'plantilla-de-prueba.docx');
  fs.writeFileSync(rutaDePrueba, Buffer.from(salida));
  console.log('   (fichero de prueba guardado en ' + rutaDePrueba + ')');
}

/* ============================================================
   7. El nombre del documento generado sale de Nombres.montarDocumento.
   ============================================================ */
{
  const plantillaDoc = { tipoDocumento: 'NOTIFICACIÓN', texto: 'Expediente 3' };
  const fechaIso = '2026-09-16';
  const esperado = Nombres.montarDocumento({
    fecha: fechaIso, tipo: 'NOTIFICACIÓN', curso: 'Expediente 3', extension: 'docx'
  });
  comprobar('7. el nombre generado usa Nombres.montarDocumento',
    PlantillasDocumento.nombreDelDocumentoGenerado(plantillaDoc, fechaIso), esperado);
  comprobarQue('7. el nombre trae la fecha, el tipo y el texto adicional',
    esperado.indexOf('260916') === 0 && esperado.indexOf('NOTIFICACIÓN') !== -1 &&
    esperado.indexOf('Expediente 3') !== -1 && esperado.endsWith('.docx'),
    esperado);
}

/* ============================================================
   8. Un plantillas.json viejo (sin `documentos` ni los campos nuevos
   del centro) sigue cargando, con los valores por defecto.
   ============================================================ */
{
  const gestorFalso = { contenido: { firma: 'Un saludo.\n{usuario}', centro: 'IES de antes', lista: [] } };
  const datos = await Plantillas.cargar(gestorFalso);
  comprobar('8. un fichero viejo trae documentos vacío', datos.documentos, []);
  comprobar('8. localidad por defecto', datos.localidad, '');
  comprobar('8. dirección por defecto', datos.direccion, '');
  comprobar('8. código por defecto', datos.codigo, '');
  comprobar('8. cargo por defecto', datos.cargo, '');
  comprobar('8. lo que ya traía sigue como estaba', datos.centro, 'IES de antes');
}

/* ============================================================
   9. {{MEMBRETE}} y {{FIRMANTE}}/{{TRATAMIENTO FIRMANTE}}.
   ============================================================ */
{
  /* Cargos.enFecha real no hace falta aquí (ya tiene su propia prueba,
     pruebas/cargos.mjs): se sustituye por un doble que devuelve el
     mismo ocupante para cualquier fecha, solo para comprobar el
     enganche entre Plantillas.valoresDeAsunto y Docx. */
  win.Cargos = { enFecha: async (id) => id === 'direccion' ? { persona: 'Ana Ana', tratamiento: 'El Director', nombre: 'Dirección' } : null };

  const parrafoMembrete = '<w:p><w:r><w:t>{{MEMBRETE}}</w:t></w:r></w:p>';
  const parrafoFirma = '<w:p><w:r><w:t>Fdo.: {{FIRMANTE}} ({{TRATAMIENTO FIRMANTE}})</w:t></w:r></w:p>';
  const zipOriginal = await construirZipDePrueba([
    { nombre: '[Content_Types].xml', texto: CONTENT_TYPES, comprimir: false },
    { nombre: 'word/document.xml', texto: documentoXml(parrafoMembrete + parrafoFirma), comprimir: true }
  ]);

  const pngDeMentira = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const conImagen = await Docx.ponerImagen(zipOriginal, 'MEMBRETE', pngDeMentira, 400, 100);

  const nombresTrasImagen = Docx.leerDirectorioCentral(conImagen).map((e) => e.nombre);
  comprobarQue('9. la imagen queda dentro del ZIP', nombresTrasImagen.includes('word/media/membrete.png'), nombresTrasImagen.join(', '));
  comprobarQue('9. su relación queda creada de cero', nombresTrasImagen.includes('word/_rels/document.xml.rels'), nombresTrasImagen.join(', '));

  const xmlConImagen = await Docx.leerEntradaDeTexto(conImagen, 'word/document.xml');
  comprobarQue('9. el hueco {{MEMBRETE}} se sustituye por un dibujo', !xmlConImagen.includes('MEMBRETE') && xmlConImagen.includes('<w:drawing>'), xmlConImagen);

  const contentTypesConImagen = await Docx.leerEntradaDeTexto(conImagen, '[Content_Types].xml');
  comprobarQue('9. Content Types gana el png', contentTypesConImagen.includes('Extension="png"'), contentTypesConImagen);

  const relsConImagen = await Docx.leerEntradaDeTexto(conImagen, 'word/_rels/document.xml.rels');
  comprobarQue('9. la relación apunta a media/membrete.png', relsConImagen.includes('Target="media/membrete.png"'), relsConImagen);

  const valores = await Plantillas.valoresDeAsunto({}, { plantilla: { firmante: 'direccion' }, fecha: '2026-09-20' });
  comprobar('9. el firmante sale del cargo, en la fecha del documento', valores.firmante, 'Ana Ana');
  comprobar('9. el tratamiento del firmante también', valores['tratamiento firmante'], 'El Director');

  const rFinal = await Docx.rellenar(conImagen, valores);
  const xmlFinal9 = await Docx.leerEntradaDeTexto(await rFinal.blob.arrayBuffer(), 'word/document.xml');
  comprobarQue('9. la firma sale rellena, sin llaves sueltas',
    xmlFinal9.includes('Fdo.: Ana Ana (El Director)') && !xmlFinal9.includes('{'), xmlFinal9);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
