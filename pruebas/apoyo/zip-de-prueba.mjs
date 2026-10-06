/* Un escritor de ZIP independiente de js/docx.js, solo para las pruebas (no se prueba a sí mismo).
   `construirZipDePrueba([{ nombre, texto, comprimir }])` -> Uint8Array. No es una prueba: vive en
   una subcarpeta para que `npm test` no lo ejecute. */
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
  buf[off] = v & 0xFF; buf[off + 1] = (v >>> 8) & 0xFF; buf[off + 2] = (v >>> 16) & 0xFF; buf[off + 3] = (v >>> 24) & 0xFF;
}
function concat(lista) {
  const total = lista.reduce((n, b) => n + b.length, 0);
  const salida = new Uint8Array(total);
  let pos = 0;
  for (const b of lista) { salida.set(b, pos); pos += b.length; }
  return salida;
}
export async function construirZipDePrueba(entradas) {
  const partes = [], centrales = [];
  let offset = 0;
  for (const e of entradas) {
    const datos = new TextEncoder().encode(e.texto);
    const comprimidos = e.comprimir ? await deflateRaw(datos) : datos;
    const metodo = e.comprimir ? 8 : 0;
    const crc = crc32DePrueba(datos);
    const nombreBytes = new TextEncoder().encode(e.nombre);
    const local = new Uint8Array(30 + nombreBytes.length);
    u32(local, 0, 0x04034b50); u16(local, 4, 20); u16(local, 6, 0); u16(local, 8, metodo); u16(local, 10, 0); u16(local, 12, 0x21);
    u32(local, 14, crc); u32(local, 18, comprimidos.length); u32(local, 22, datos.length);
    u16(local, 26, nombreBytes.length); u16(local, 28, 0); local.set(nombreBytes, 30);
    partes.push(local, comprimidos);
    const central = new Uint8Array(46 + nombreBytes.length);
    u32(central, 0, 0x02014b50); u16(central, 4, 20); u16(central, 6, 20); u16(central, 8, 0); u16(central, 10, metodo);
    u16(central, 12, 0); u16(central, 14, 0x21); u32(central, 16, crc); u32(central, 20, comprimidos.length); u32(central, 24, datos.length);
    u16(central, 28, nombreBytes.length); u32(central, 42, offset); central.set(nombreBytes, 46);
    centrales.push(central);
    offset += local.length + comprimidos.length;
  }
  const cd = concat(centrales);
  const eocd = new Uint8Array(22);
  u32(eocd, 0, 0x06054b50); u16(eocd, 8, entradas.length); u16(eocd, 10, entradas.length); u32(eocd, 12, cd.length); u32(eocd, 16, offset);
  return concat([...partes, cd, eocd]);
}
