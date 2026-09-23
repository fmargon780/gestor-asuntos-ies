/* Fila 92 (docs/NADA-SE-GUARDA-REINTENTAR.md), sin navegador.

   1. Todo fichero js/*.js del repositorio aparece en un <script> de
      index.html, y todo <script src="js/..."> de index.html existe en
      el disco. Un módulo nuevo que no se carga es lo que dejó a
      Francisco con «Reintentar is not defined» y sin poder guardar.
      La copia sin internet (scripts/copia-local.mjs) copia `js/` y
      `index.html` enteros, sin lista propia: con esto basta para las
      dos.
   2. Sin js/reintentar-escritura.js cargado, Carpetas.escribirTexto y
      Carpetas.escribirBytes siguen escribiendo (sin reintento, pero
      escriben): nunca un ReferenceError. */
import fs from 'node:fs';
import vm from 'node:vm';

const RAIZ = new URL('..', import.meta.url);
let fallos = 0;
function comprobar(titulo, ok, detalle) {
  if (ok) console.log('bien   ' + titulo);
  else { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
}

/* ---------- 1. index.html carga todos los js/*.js ---------- */
const html = fs.readFileSync(new URL('index.html', RAIZ), 'utf8');
const cargados = new Set([...html.matchAll(/<script[^>]*\ssrc="(js\/[^"?]+)/g)].map((m) => m[1]));
const enDisco = fs.readdirSync(new URL('js/', RAIZ)).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f);
const sinCargar = enDisco.filter((f) => !cargados.has(f));
const sinFichero = [...cargados].filter((f) => !fs.existsSync(new URL(f, RAIZ)));
comprobar('todo js/*.js se carga en index.html', sinCargar.length === 0, 'sin <script>: ' + sinCargar.join(', '));
comprobar('todo <script src="js/..."> existe en el disco', sinFichero.length === 0, 'no existen: ' + sinFichero.join(', '));
comprobar('reintentar-escritura.js va antes que carpetas.js',
  html.indexOf('src="js/reintentar-escritura.js"') > -1 && html.indexOf('src="js/reintentar-escritura.js"') < html.indexOf('src="js/carpetas.js"'));

/* ---------- 2. carpetas.js escribe aunque falte Reintentar ---------- */
function discoDeMentira() {
  const escritos = {};
  return {
    escritos,
    async getFileHandle(nombre) {
      return {
        async createWritable() {
          const trozos = [];
          return {
            async write(b) { trozos.push(b); },
            async close() { escritos[nombre] = trozos; }
          };
        }
      };
    }
  };
}

async function cargarCarpetas(conReintentar) {
  const ctx = { console, TextDecoder, TextEncoder, Blob, setTimeout, clearTimeout };
  ctx.window = ctx;
  vm.createContext(ctx);
  if (conReintentar) vm.runInContext(fs.readFileSync(new URL('js/reintentar-escritura.js', RAIZ), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(new URL('js/carpetas.js', RAIZ), 'utf8') + '\nwindow.Carpetas = Carpetas;', ctx);
  return ctx;
}

for (const conReintentar of [false, true]) {
  const ctx = await cargarCarpetas(conReintentar);
  const d = discoDeMentira();
  const etiqueta = conReintentar ? 'con Reintentar' : 'sin Reintentar';
  let error = null;
  try {
    await ctx.Carpetas.escribirTexto(d, 'a.json', '{}');
    await ctx.Carpetas.escribirBytes(d, 'b.pdf', new Uint8Array([1, 2, 3]), 'application/pdf');
  } catch (e) { error = e; }
  comprobar(etiqueta + ': escribirTexto y escribirBytes no fallan', !error, error && String(error));
  comprobar(etiqueta + ': los dos ficheros quedan escritos', !!(d.escritos['a.json'] && d.escritos['b.pdf']));
  if (conReintentar) comprobar('reintentar-escritura.js se expone en window.Reintentar', !!(ctx.window.Reintentar && ctx.window.Reintentar.escritura));
}

console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
