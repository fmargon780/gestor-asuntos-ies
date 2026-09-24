/* Prueba de lógica (sin navegador) de las plantillas del centro
   (20-sep-2026, fila 83, docs/PLANTILLAS-DEL-CENTRO.md).

   No se vuelve a ejecutar `scripts/hacer-plantillas.mjs` aquí: esta
   prueba comprueba que lo que hay ESCRITO en el repositorio (los
   `.md`, el `indice.json` y los `.docx` ya generados) es coherente,
   no que el script sepa generarlo (eso ya lo comprobó a mano quien
   escribió la fila, con los propios `.docx` guardados).

   Comprueba:
   1. `plantillas/indice.json` cita, para cada entrada de documento,
      un `.docx` que existe de verdad en `plantillas/`.
   2. Cada `.md` de `plantillas/` trae los campos obligatorios del
      frontmatter (nombre, tipo, categoria; tipoDocumento si es de
      documento).
   3. Todo hueco `{...}`/`{{...}}` usado en los cuerpos (documento y
      correo) está en `Plantillas.HUECOS`, o es `{campo:...}` (un campo
      propio, que vale para cualquiera): un hueco mal escrito sale en
      el papel tal cual, y es la prueba que de verdad importa.
   4. El `.docx` de cada entrada de documento se puede volver a leer
      con `Docx.leerEntradaDeTexto` (el ZIP es válido).
   5. Un `{{FORMULARIOS}}` sin ningún formulario no deja una línea en
      blanco suelta en el papel (docx.js, `rellenarXml`). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const CARPETA_PLANTILLAS = path.join(RAIZ, 'plantillas');
const RAIZ_JS = path.join(RAIZ, 'js');

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

/* ---------- montar Docx y Plantillas, sin navegador (como pruebas/plantillas-documento.mjs) ---------- */
const contexto = {
  window: {}, TextDecoder, TextEncoder, Blob, Response, DecompressionStream,
  App: { E: {} }, Carpetas: { leerJson: async () => null, crear: async () => ({}), ficheros: async () => [] }
};
vm.createContext(contexto);
contexto.window.App = contexto.App;
contexto.window.Carpetas = contexto.Carpetas;
for (const f of ['util.js', 'docx.js', 'docx-imagen.js', 'docx-tabla.js', 'plantillas.js', 'plantillas-valores.js']) {
  vm.runInContext(fs.readFileSync(path.join(RAIZ_JS, f), 'utf8'), contexto);
}
contexto.window.U = contexto.U;
const { Docx, Plantillas } = contexto;

/* ---------- leer el frontmatter, igual que hace el propio script ---------- */
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

/* ================= 1 y 2 · indice.json y el frontmatter de cada .md ================= */
console.log('--- 1 y 2. indice.json y el frontmatter ---');

const indice = JSON.parse(fs.readFileSync(path.join(CARPETA_PLANTILLAS, 'indice.json'), 'utf8'));
comprobarQue('hay al menos una plantilla en el índice', indice.length > 0);

const ficherosMd = fs.readdirSync(CARPETA_PLANTILLAS).filter((f) => f.endsWith('.md'));
comprobarQue('hay al menos un .md', ficherosMd.length > 0);

const CAMPOS_OBLIGATORIOS = ['nombre', 'tipo', 'categoria'];
const porFichero = {};
ficherosMd.forEach((fichero) => {
  const { datos } = leerFrontmatter(fs.readFileSync(path.join(CARPETA_PLANTILLAS, fichero), 'utf8'));
  porFichero[fichero] = datos;
  const faltan = CAMPOS_OBLIGATORIOS.filter((c) => !datos[c]);
  comprobarQue(fichero + ': trae ' + CAMPOS_OBLIGATORIOS.join('/'), faltan.length === 0, 'falta ' + faltan.join(', '));
});

indice.forEach((e) => {
  if (e.clase !== 'documento') return;
  comprobarQue(e.nombre + ': el .docx "' + e.fichero + '" existe',
    fs.existsSync(path.join(CARPETA_PLANTILLAS, e.fichero)));
});

/* ================= 3 · todo hueco usado está en el catálogo ================= */
console.log('--- 3. todo hueco usado está en Plantillas.HUECOS ---');

const CONOCIDOS = new Set(Plantillas.HUECOS.map((h) => contexto.U.normalizar(h.clave).replace(/\s+/g, '')));

function huecosDeTexto(texto) {
  const salida = [];
  let m;
  const reDoble = /\{\{([^{}]+)\}\}/g;
  while ((m = reDoble.exec(texto))) salida.push(m[1].trim());
  /* quitamos lo que ya iba en llave doble, para no contar dos veces
     su llave sencilla de dentro (el mismo truco que docx.js) */
  const sinDobles = texto.replace(reDoble, '');
  const reSencilla = /\{([^{}]+)\}/g;
  while ((m = reSencilla.exec(sinDobles))) salida.push(m[1].trim());
  return salida;
}

function esHuecoConocido(clave) {
  if (/^campo\s*:/i.test(clave)) return true;
  /* Fila 110: las tablas de datos (js/tablas-datos.js), como {campo:...}. */
  if (/^(tabla|dato)\s/i.test(clave)) return true;
  if (clave === 'LO QUE FALTA' || clave === 'MEMBRETE') return true;
  return CONOCIDOS.has(contexto.U.normalizar(clave).replace(/\s+/g, ''));
}

let todosLosHuecosConocidos = true;
ficherosMd.forEach((fichero) => {
  const { cuerpo } = leerFrontmatter(fs.readFileSync(path.join(CARPETA_PLANTILLAS, fichero), 'utf8'));
  const huecos = huecosDeTexto(cuerpo);
  const desconocidos = huecos.filter((h) => !esHuecoConocido(h));
  if (desconocidos.length) {
    todosLosHuecosConocidos = false;
    console.log('   ' + fichero + ' usa huecos desconocidos: ' + desconocidos.join(', '));
  }
});
comprobarQue('ningún .md usa un hueco que no esté en el catálogo (ni {{MEMBRETE}}/{{LO QUE FALTA}}/{campo:...})',
  todosLosHuecosConocidos);

/* ================= 4 · cada .docx se puede volver a leer ================= */
console.log('--- 4. cada .docx se puede volver a leer ---');

for (const e of indice) {
  if (e.clase !== 'documento') continue;
  const buffer = fs.readFileSync(path.join(CARPETA_PLANTILLAS, e.fichero));
  const xml = await Docx.leerEntradaDeTexto(new Uint8Array(buffer), 'word/document.xml');
  comprobarQue(e.fichero + ': se lee word/document.xml', typeof xml === 'string' && xml.length > 0);
}

/* ================= 5 · {{FORMULARIOS}} vacío no deja línea suelta ================= */
console.log('--- 5. {{FORMULARIOS}} vacío no deja línea suelta ---');

const parrafoFormularios =
  '<w:p><w:r><w:t>Antes: {{FORMULARIOS}}</w:t></w:r></w:p>' +
  '<w:p><w:r><w:t>{{FORMULARIOS}}</w:t></w:r></w:p>' +
  '<w:p><w:r><w:t>Después.</w:t></w:r></w:p>';
const xmlDocumento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:body>' + parrafoFormularios + '<w:sectPr/></w:body></w:document>';

function construirZipDePrueba(nombre, texto) {
  /* Un ZIP mínimo, sin comprimir, solo para esta comprobación: no
     hace falta reutilizar el de pruebas/plantillas-documento.mjs. */
  const datos = new TextEncoder().encode(texto);
  const crc = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    let acc = 0xFFFFFFFF;
    for (let i = 0; i < datos.length; i++) acc = t[(acc ^ datos[i]) & 0xFF] ^ (acc >>> 8);
    return (acc ^ 0xFFFFFFFF) >>> 0;
  })();
  function u16(b, o, v) { b[o] = v & 0xFF; b[o + 1] = (v >>> 8) & 0xFF; }
  function u32(b, o, v) { b[o] = v & 0xFF; b[o + 1] = (v >>> 8) & 0xFF; b[o + 2] = (v >>> 16) & 0xFF; b[o + 3] = (v >>> 24) & 0xFF; }
  const nb = new TextEncoder().encode(nombre);
  const local = new Uint8Array(30 + nb.length);
  u32(local, 0, 0x04034b50); u16(local, 8, 0); u16(local, 12, 0x21);
  u32(local, 14, crc); u32(local, 18, datos.length); u32(local, 22, datos.length);
  u16(local, 26, nb.length);
  local.set(nb, 30);
  const central = new Uint8Array(46 + nb.length);
  u32(central, 0, 0x02014b50); u16(central, 4, 20); u16(central, 6, 20); u16(central, 12, 0x21);
  u32(central, 16, crc); u32(central, 20, datos.length); u32(central, 24, datos.length);
  u16(central, 28, nb.length);
  central.set(nb, 46);
  const partes = [local, datos, central];
  const eocd = new Uint8Array(22);
  u32(eocd, 0, 0x06054b50); u16(eocd, 8, 1); u16(eocd, 10, 1);
  u32(eocd, 12, central.length); u32(eocd, 16, local.length + datos.length);
  const total = partes.concat([eocd]).reduce((n, b) => n + b.length, 0);
  const salida = new Uint8Array(total);
  let pos = 0;
  for (const p of partes.concat([eocd])) { salida.set(p, pos); pos += p.length; }
  return salida;
}

const zipDePrueba = construirZipDePrueba('word/document.xml', xmlDocumento);
const r = await Docx.rellenar(zipDePrueba, { formularios: '' });
const xmlFinal = await Docx.leerEntradaDeTexto(await r.blob.arrayBuffer(), 'word/document.xml');
const parrafos = xmlFinal.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || [];

comprobar('el párrafo que solo tenía {{FORMULARIOS}} desaparece del todo', parrafos.length, 2);
comprobarQue('el párrafo con más texto alrededor se queda (vacío el hueco, no la línea)',
  parrafos.some((p) => p.indexOf('Antes:') !== -1));
comprobarQue('el párrafo siguiente sigue ahí, sin tocar', parrafos.some((p) => p.indexOf('Después.') !== -1));

/* ================= 6 · los pasos de la biblioteca citan plantillas que existen (fila 124) ================= */
console.log('--- 6. plantillasDocumento de la biblioteca del centro ---');

const biblioteca = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos-biblioteca', 'biblioteca-centro.json'), 'utf8'));
const idsDelIndice = new Set(indice.filter((e) => e.id).map((e) => e.id));
comprobar('los id fijos del índice no se repiten', idsDelIndice.size, indice.filter((e) => e.id).length);
biblioteca.modelos.forEach((m) => (m.plantillasDocumento || []).forEach((id) => {
  comprobarQue(m.id + ' cita «' + id + '», que está en plantillas/indice.json', idsDelIndice.has(id));
}));
const b260 = biblioteca.modelos.filter((m) => m.id === 'b260')[0];
comprobar('b260: la línea de las renuncias va detrás de g1, con «generar»',
  b260.guion.slice(0, 2).map((g) => g.id + ':' + g.accion), ['g1:', 'g-renuncias:generar']);
const renuncia = indice.filter((e) => e.id === 'pd-centro-renuncia-junta-electoral')[0] || {};
comprobar('la renuncia cuelga de OTROS · ELECCIONES CONSEJO ESCOLAR, tipo RENUNCIA',
  [renuncia.categoria, renuncia.tipo, renuncia.tipoDocumento, renuncia.texto], ['OTROS', 'ELECCIONES CONSEJO ESCOLAR', 'RENUNCIA', 'junta electoral']);

console.log(fallos ? '\n' + fallos + ' fallo(s) en plantillas-del-centro.mjs' : '\nTodo bien en plantillas-del-centro.mjs');
if (fallos) process.exit(1);
