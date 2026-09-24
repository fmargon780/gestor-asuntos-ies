#!/usr/bin/env node
/* ============================================================
   hacer-plantillas.mjs — convierte cada `plantillas/*.md` en su
   `.docx` (fila 83, 20-sep-2026, docs/PLANTILLAS-DEL-CENTRO.md).

   Se ejecuta a mano (`node scripts/hacer-plantillas.mjs`) cuando el
   contenido de una plantilla cambie. NO se ejecuta en Vercel ni en
   las pruebas: los `.docx` que genera quedan en el repositorio, y
   `pruebas/plantillas-del-centro.mjs` solo comprueba que lo que hay
   escrito es coherente (huecos conocidos, frontmatter completo...),
   sin volver a generar nada.

   Cada `.md` de una plantilla de DOCUMENTO (lleva `tipoDocumento` en
   el frontmatter) se convierte en un `.docx` de verdad, montado a
   mano como un ZIP —igual que hace `js/docx.js` para leerlos, aquí
   para escribirlos de cero—, con lo mínimo que Word necesita:
   `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`,
   `word/styles.xml` y `word/_rels/document.xml.rels` (vacío de
   relaciones a propósito: `Docx.ponerImagen` crea la suya cuando la
   aplicación mete el membrete, la primera vez que se genera un
   documento con esa plantilla).

   Una plantilla de CORREO (sin `tipoDocumento`) no genera ningún
   fichero: su cuerpo, ya limpio de las marcas de Markdown pero con
   los huecos intactos, se escribe directamente dentro de
   `plantillas/indice.json`, que es lo que lee
   `js/cargar-plantillas-centro.js` al fusionar con `plantillas.json`.

   Marcas que entiende (docs/PLANTILLAS-DEL-CENTRO.md, parte 1): `# `
   título, `## ` subtítulo, línea vacía = párrafo, `- ` lista,
   `> ` bloque a la derecha (la fórmula de firma), `---` salto de
   línea grueso; desde la fila 123, `**negrita**` y `^^mayúsculas^^`
   dentro de una línea, y `| a | b |` para una tabla de firmas sin
   bordes; desde la fila 124, `~` solo en su bloque = un párrafo
   vacío. Nada más: no hace falta un conversor de Markdown
   completo para esto.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const CARPETA_PLANTILLAS = path.join(RAIZ, 'plantillas');

/* ---------- el frontmatter: "clave: valor", sin YAML de verdad ---------- */

function leerFrontmatter(texto) {
  const m = texto.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { datos: {}, cuerpo: texto };
  const datos = {};
  m[1].split('\n').forEach((linea) => {
    const i = linea.indexOf(':');
    if (i === -1) return;
    datos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  });
  return { datos, cuerpo: m[2] };
}

/* ---------- CRC-32 y el ZIP a mano, todo "almacenado" (método 0):
   igual de válido que comprimido, y mucho más simple sin depender de
   CompressionStream. ---------- */

const TABLA_CRC32 = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = TABLA_CRC32[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
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

function construirZip(entradas) {
  const partes = [], centrales = [];
  let offset = 0;
  for (const e of entradas) {
    const datos = typeof e.texto === 'string' ? new TextEncoder().encode(e.texto) : e.texto;
    const crc = crc32(datos);
    const nombreBytes = new TextEncoder().encode(e.nombre);

    const local = new Uint8Array(30 + nombreBytes.length);
    u32(local, 0, 0x04034b50);
    u16(local, 4, 20); u16(local, 6, 0); u16(local, 8, 0);
    u16(local, 10, 0); u16(local, 12, 0x21);
    u32(local, 14, crc); u32(local, 18, datos.length); u32(local, 22, datos.length);
    u16(local, 26, nombreBytes.length); u16(local, 28, 0);
    local.set(nombreBytes, 30);
    partes.push(local, datos);

    const central = new Uint8Array(46 + nombreBytes.length);
    u32(central, 0, 0x02014b50);
    u16(central, 4, 20); u16(central, 6, 20); u16(central, 8, 0); u16(central, 10, 0);
    u16(central, 12, 0); u16(central, 14, 0x21);
    u32(central, 16, crc); u32(central, 20, datos.length); u32(central, 24, datos.length);
    u16(central, 28, nombreBytes.length);
    u16(central, 30, 0); u16(central, 32, 0); u16(central, 34, 0); u16(central, 36, 0);
    u32(central, 38, 0); u32(central, 42, offset);
    central.set(nombreBytes, 46);
    centrales.push(central);

    offset += local.length + datos.length;
  }
  const inicioCD = offset;
  const cd = concat(centrales);
  const eocd = new Uint8Array(22);
  u32(eocd, 0, 0x06054b50);
  u16(eocd, 4, 0); u16(eocd, 6, 0);
  u16(eocd, 8, entradas.length); u16(eocd, 10, entradas.length);
  u32(eocd, 12, cd.length); u32(eocd, 16, inicioCD);
  u16(eocd, 20, 0);
  return concat([...partes, cd, eocd]);
}

/* ---------- el cuerpo: de Markdown mínimo a párrafos de word/document.xml ---------- */

function escaparXml(t) {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Varias líneas dentro de un mismo párrafo se separan con <w:br/>, no
   se funden en una: así una plantilla puede escribir el pie de firma
   en varias líneas dentro del mismo bloque "> ". */
function runConSaltos(lineas, negrita, tamano) {
  const rPr = (negrita || tamano)
    ? '<w:rPr>' + (negrita ? '<w:b/>' : '') + (tamano ? '<w:sz w:val="' + tamano + '"/>' : '') + '</w:rPr>'
    : '';
  return '<w:r>' + rPr + lineas.map((l) => '<w:t xml:space="preserve">' + escaparXml(l) + '</w:t>')
    .join('<w:br/>') + '</w:r>';
}

/* Marcas dentro de una línea (24-sep-2026, fila 123,
   docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md): `**texto**` en negrita y
   `^^texto^^` en versalitas de Word (todo en mayúsculas, también lo que
   traiga un hueco). Cada trozo es su propio run; un hueco o una forma
   doble («Profesor/a:firmante») no deben partirse entre dos marcas. */
const RE_MARCAS = /(\*\*[^*]+\*\*|\^\^[^^]+\^\^)/;
function tieneMarcas(lineas) { return lineas.some((l) => RE_MARCAS.test(l)); }

function runsConMarcas(lineas, negrita, tamano) {
  return lineas.map((linea) => linea.split(RE_MARCAS).filter((t) => t !== '').map((trozo) => {
    let b = negrita, caps = false, t = trozo;
    if (/^\*\*[^*]+\*\*$/.test(t)) { b = true; t = t.slice(2, -2); }
    else if (/^\^\^[^^]+\^\^$/.test(t)) { caps = true; t = t.slice(2, -2); }
    const rPr = (b || caps || tamano)
      ? '<w:rPr>' + (b ? '<w:b/>' : '') + (caps ? '<w:caps/>' : '') + (tamano ? '<w:sz w:val="' + tamano + '"/>' : '') + '</w:rPr>'
      : '';
    return '<w:r>' + rPr + '<w:t xml:space="preserve">' + escaparXml(t) + '</w:t></w:r>';
  }).join('')).join('<w:r><w:br/></w:r>');
}

function parrafo(lineas, opciones) {
  const o = opciones || {};
  const jc = o.derecha ? 'right' : (o.centro ? 'center' : (o.justificado ? 'both' : ''));
  const pPr = jc ? '<w:pPr><w:jc w:val="' + jc + '"/></w:pPr>' : '';
  const runs = tieneMarcas(lineas) ? runsConMarcas(lineas, o.negrita, o.tamano) : runConSaltos(lineas, o.negrita, o.tamano);
  return '<w:p>' + pPr + runs + '</w:p>';
}

/* Un bloque de líneas `| izquierda | derecha |` (fila 123): una tabla sin
   bordes de una sola fila, con una celda por columna y cada línea del
   bloque como una línea más dentro de su celda, centrada. Para las firmas
   en dos columnas. */
function tablaSinBordes(lineas) {
  const filas = lineas.map((l) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()));
  const n = Math.max(...filas.map((f) => f.length));
  const ancho = Math.floor(9000 / n);
  const celdas = [];
  for (let c = 0; c < n; c++) {
    const lineasCelda = filas.map((f) => f[c] || '').filter((t) => t !== '');
    celdas.push('<w:tc><w:tcPr><w:tcW w:w="' + ancho + '" w:type="dxa"/></w:tcPr>' +
      lineasCelda.map((t) => parrafo([t], { centro: true })).join('') + (lineasCelda.length ? '' : '<w:p/>') + '</w:tc>');
  }
  return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>' +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((b) => '<w:' + b + ' w:val="nil"/>').join('') +
    '</w:tblBorders></w:tblPr><w:tblGrid>' + celdas.map(() => '<w:gridCol w:w="' + ancho + '"/>').join('') +
    '</w:tblGrid><w:tr>' + celdas.join('') + '</w:tr></w:tbl><w:p/>';
}

function parrafoLineaGruesa() {
  return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="24" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>';
}

/* Un bloque es lo que hay entre dos líneas vacías. Su primera línea
   decide el tipo; una lista puede llevar varias líneas "- ", cada una
   su propio párrafo. */
function parrafosDeBloque(bloque) {
  if (bloque.trim() === '---') return parrafoLineaGruesa();
  /* Fila 124: un bloque que solo lleva `~` es un párrafo vacío, para
     dejar aire entre dos apartados sin tocar el estilo de las demás. */
  if (bloque.trim() === '~') return '<w:p/>';
  const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lineas.length) return '';

  if (lineas[0].startsWith('# ')) {
    return parrafo([lineas[0].replace(/^#\s+/, '')].concat(lineas.slice(1)), { negrita: true, tamano: 32 });
  }
  if (lineas[0].startsWith('## ')) {
    return parrafo([lineas[0].replace(/^##\s+/, '')].concat(lineas.slice(1)), { negrita: true, tamano: 26 });
  }
  if (lineas.every((l) => l.startsWith('- '))) {
    return lineas.map((l) => parrafo(['•  ' + l.replace(/^-\s+/, '')])).join('');
  }
  if (lineas.every((l) => l.startsWith('|'))) return tablaSinBordes(lineas);
  if (lineas[0].startsWith('> ')) {
    return parrafo(lineas.map((l) => l.replace(/^>\s?/, '')), { derecha: true });
  }
  return parrafo(lineas);
}

function documentoXmlDe(cuerpoMd) {
  const bloques = cuerpoMd.replace(/\r\n/g, '\n').split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  const parrafos = bloques.map(parrafosDeBloque).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + parrafos + '<w:sectPr/></w:body></w:document>';
}

/* El cuerpo de una plantilla de CORREO: mismas marcas, pero a texto
   plano (el campo de Ajustes es un <textarea>, sin XML). */
function textoPlanoDe(cuerpoMd) {
  const bloques = cuerpoMd.replace(/\r\n/g, '\n').split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  return bloques.map((bloque) => {
    if (bloque.trim() === '---' || bloque.trim() === '~') return '';
    return bloque.split('\n').map((l) => l.trim())
      .map((l) => l.replace(/^#{1,2}\s+/, '').replace(/^-\s+/, '• ').replace(/^>\s?/, '').replace(/\*\*|\^\^/g, ''))
      .filter(Boolean).join('\n');
  }).filter(Boolean).join('\n\n');
}

const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';

const RELS_PAQUETE = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
  '</w:styles>';

/* Vacío de relaciones a propósito: `Docx.ponerImagen` (fila 81) crea
   la que haga falta la primera vez que un documento con esta
   plantilla se genera con membrete. */
const RELS_DOCUMENTO_VACIO = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

function construirDocx(cuerpoMd) {
  return construirZip([
    { nombre: '[Content_Types].xml', texto: CONTENT_TYPES },
    { nombre: '_rels/.rels', texto: RELS_PAQUETE },
    { nombre: 'word/document.xml', texto: documentoXmlDe(cuerpoMd) },
    { nombre: 'word/styles.xml', texto: STYLES_XML },
    { nombre: 'word/_rels/document.xml.rels', texto: RELS_DOCUMENTO_VACIO }
  ]);
}

/* ---------- recorrer plantillas/*.md y montar el índice ---------- */

function ficherosMd() {
  return fs.readdirSync(CARPETA_PLANTILLAS)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

const CAMPOS_OBLIGATORIOS = ['nombre', 'tipo', 'categoria'];

async function main() {
  const indice = [];
  const errores = [];

  for (const fichero of ficherosMd()) {
    const ruta = path.join(CARPETA_PLANTILLAS, fichero);
    const texto = fs.readFileSync(ruta, 'utf8');
    const { datos, cuerpo } = leerFrontmatter(texto);

    const faltan = CAMPOS_OBLIGATORIOS.filter((c) => !datos[c]);
    if (faltan.length) {
      errores.push(fichero + ': falta ' + faltan.join(', ') + ' en el frontmatter.');
      continue;
    }

    const esDocumento = !!datos.tipoDocumento;
    const entrada = {
      nombre: datos.nombre, categoria: datos.categoria, tipo: datos.tipo,
      clase: esDocumento ? 'documento' : 'correo'
    };

    if (esDocumento) {
      const nombreDocx = fichero.replace(/\.md$/, '.docx');
      const zip = construirDocx(cuerpo);
      fs.writeFileSync(path.join(CARPETA_PLANTILLAS, nombreDocx), zip);
      /* Fila 124: un `id` fijo en el frontmatter viaja al índice, para que
         un paso de la biblioteca del centro pueda citar la plantilla
         (`plantillasDocumento`) antes de que exista en plantillas.json. */
      if (datos.id) entrada.id = datos.id;
      entrada.fichero = nombreDocx;
      entrada.tipoDocumento = datos.tipoDocumento;
      entrada.texto = datos.texto || '';
      entrada.firmante = datos.firmante || '';
      entrada.vistoBueno = datos.vistoBueno || '';
      console.log('escrito  ' + nombreDocx);
    } else {
      entrada.cuerpo = textoPlanoDe(cuerpo);
    }

    indice.push(entrada);
  }

  if (errores.length) {
    console.error('\nErrores, nada se ha escrito para esas plantillas:');
    errores.forEach((e) => console.error('  ' + e));
  }

  indice.sort((a, b) => (a.tipo + a.nombre).localeCompare(b.tipo + b.nombre));
  fs.writeFileSync(
    path.join(CARPETA_PLANTILLAS, 'indice.json'),
    JSON.stringify(indice, null, 2) + '\n'
  );
  console.log('\nescrito  plantillas/indice.json (' + indice.length + ' plantillas, ' +
    indice.filter((e) => e.clase === 'documento').length + ' de documento, ' +
    indice.filter((e) => e.clase === 'correo').length + ' de correo)');

  if (errores.length) process.exitCode = 1;
}

main();
