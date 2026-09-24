/* Prueba de la copia sin internet (21-sep-2026, fila 89,
   docs/COPIA-SIN-INTERNET.md): la aplicación abierta con doble clic
   desde el disco (`file://`), y la actualización sola.

   Dos partes:
   1. Genera `copia-local/` (como `npm run copia-local`) y abre
      `copia-local/index.html` con Playwright por `file://`: arranca
      sin errores de consola, la biblioteca carga, el catálogo de
      formularios sale, un PDF de `formularios/` se abre con pdf.js
      (como hace el lector) y un `.docx` de `plantillas/` se lee.
      Se lee "copia sin internet" junto a la versión.
   2. `js/actualizar-copia.js` y `ABRIR EL GESTOR.html` (fila 91,
      docs/COPIA-SE-ACTUALIZA.md), sobre copias de verdad de
      `copia-local/` en una carpeta temporal y un servidor HTTP local
      que hace de `raw.githubusercontent.com` con una versión nueva:
      al día (ni franja ni permiso), con carpeta y permiso (sola), sin
      carpeta y sin permiso (la franja y «Actualizar ahora»), carpeta
      equivocada (sin bucle), servidor apagado (aviso discreto) y el
      instalador sobre una copia vieja (la rescata). */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const COPIA_LOCAL = RAIZ + 'copia-local/';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobarAsync(titulo, promesa, esperado) { await comprobar(titulo, await promesa, esperado); }

/* ---------- 0. generar copia-local/ ---------- */

console.log('--- generando copia-local/ ---');
const generacion = spawnSync(process.execPath, [RAIZ + 'scripts/copia-local.mjs'], { stdio: 'inherit' });
if (generacion.status !== 0) { console.log('FALLA  no se ha podido generar copia-local/'); process.exit(1); }
if (!existsSync(COPIA_LOCAL + 'index.html')) { console.log('FALLA  copia-local/index.html no existe tras generar'); process.exit(1); }

/* Un servidor HTTP que hace de raw.githubusercontent.com: CORS
   abierto, para que una página `file://` (origen "null") pueda leerlo
   con `fetch`. */
function arrancarServidor(ficheros) {
  const servidor = createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split('?')[0].replace(/^\//, ''));
    if (Object.prototype.hasOwnProperty.call(ficheros, ruta)) {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' });
      res.end(ficheros[ruta]);
    } else {
      res.writeHead(404, { 'access-control-allow-origin': '*' }); res.end('no está');
    }
  });
  return new Promise((resolver) => servidor.listen(0, '127.0.0.1', () => resolver(servidor)));
}
function baseDe(servidor) { return 'http://127.0.0.1:' + servidor.address().port + '/'; }

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

/* ---------- el disco de mentira, igual que pruebas/navegador.mjs ---------- */

function scriptDeDiscoDeMentira() {
  return `
(function () {
  const guardado = new Map();
  Object.defineProperty(window, 'indexedDB', { configurable: true, value: {
    open() {
      const p = {};
      setTimeout(() => {
        p.result = {
          objectStoreNames: { contains: () => true },
          createObjectStore() {},
          transaction() {
            const t = {};
            t.objectStore = () => ({
              put(v, k) { guardado.set(k, v); },
              get(k) { const r = {}; setTimeout(() => { r.result = guardado.get(k); r.onsuccess && r.onsuccess(); }, 0); return r; },
              delete(k) { guardado.delete(k); }
            });
            setTimeout(() => t.oncomplete && t.oncomplete(), 0);
            return t;
          }
        };
        p.onsuccess && p.onsuccess();
      }, 0);
      return p;
    }
  } });

  function dir(nombre) {
    const hijos = new Map();
    return {
      kind: 'directory', name: nombre, _hijos: hijos,
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; },
      async getDirectoryHandle(n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          hijos.set(n, dir(n));
        }
        return hijos.get(n);
      },
      async getFileHandle(n, o) {
        if (!hijos.has(n)) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          hijos.set(n, fich(n, ''));
        }
        return hijos.get(n);
      },
      async removeEntry(n) { hijos.delete(n); },
      async *entries() { for (const par of hijos) yield par; }
    };
  }
  function fich(nombre, texto) {
    const f = { kind: 'file', name: nombre, _texto: texto };
    f.getFile = async () => new Blob([f._texto], { type: 'text/plain' });
    f.createWritable = async () => ({
      async write(c) {
        if (typeof c === 'string') { f._texto = c; return; }
        if (c && typeof c.arrayBuffer === 'function') { f._texto = new Uint8Array(await c.arrayBuffer()); return; }
        f._texto = c;
      },
      async close() {}
    });
    return f;
  }

  window.__disco = { abiertos: dir('ASUNTOS ABIERTOS'), archivo: dir('ARCHIVO') };
  let toca = 'abiertos';
  window.showDirectoryPicker = async function () {
    const h = window.__disco[toca];
    toca = toca === 'abiertos' ? 'archivo' : 'abiertos';
    return h;
  };
})();
`;
}

/* ============================================================
   PARTE 1: la aplicación entera, abierta por file://
   ============================================================ */
{
  const pagina = await navegador.newPage();
  const errores = [];
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(scriptDeDiscoDeMentira());
  /* Un servidor que dice "estás al día": sin él, la copia saldría a
     internet a mirar la versión (fila 91: lo hace siempre, lo primero). */
  const servidorAlDia = await arrancarServidor({ 'version.json': readFileSync(COPIA_LOCAL + 'version.json', 'utf8') });
  await pagina.addInitScript(`window.__COPIA_BASE_REMOTO__ = ${JSON.stringify(baseDe(servidorAlDia))};`);
  await pagina.goto('file://' + COPIA_LOCAL + 'index.html');

  await comprobarAsync('el aviso de navegador no sale', pagina.locator('#aviso-navegador').isHidden(), true);
  await comprobarAsync('se lee "copia sin internet" antes de entrar',
    pagina.locator('#paso-carpetas .version').textContent().then((t) => t.indexOf('copia sin internet') !== -1), true);

  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await comprobarAsync('entra en la aplicación', pagina.locator('#lista-abiertos').isVisible(), true);
  await comprobarAsync('se lee "copia sin internet" ya dentro',
    pagina.locator('#usuario-pie').textContent().then((t) => t.indexOf('copia sin internet') !== -1), true);

  /* --- la biblioteca del centro carga (js/cargar-biblioteca.js, copia-datos) --- */
  await comprobarAsync('la biblioteca del centro carga desde copia-datos/', pagina.evaluate(async () => {
    const datos = await window.CargarBiblioteca._leerDatosEstaticos();
    return Array.isArray(datos.tipos) && datos.tipos.length > 0;
  }), true);

  /* --- el catálogo de formularios sale --- */
  await comprobarAsync('el catálogo de formularios carga', pagina.evaluate(async () => {
    const catalogo = await window.Formularios.cargar();
    return Object.keys(catalogo).length > 0;
  }), true);

  /* --- un PDF de formularios/ se abre con pdf.js, como el lector --- */
  await comprobarAsync('un PDF de formularios/ se lee y pdf.js lo abre', pagina.evaluate(async () => {
    const catalogo = await window.Formularios.cargar();
    const clave = Object.keys(catalogo).filter((c) => catalogo[c].f)[0];
    if (!clave) return 'sin ningún formulario con PDF en el catálogo';
    const nombreFichero = catalogo[clave].f;
    const bytes = await window.App.leerFicheroDeLaApp('formularios/' + nombreFichero, 'binario');
    const cabecera = new TextDecoder().decode(bytes.slice(0, 5));
    if (cabecera !== '%PDF-') return 'no empieza por %PDF-: ' + cabecera;
    const pdfjsLib = await window.App.cargarPdfJs();
    const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    const pagina1 = await doc.getPage(1);
    const contenido = await pagina1.getTextContent();
    return Array.isArray(contenido.items) ? true : 'sin items de texto';
  }), true);

  /* --- un .docx de plantillas/ se lee --- */
  await comprobarAsync('un .docx de plantillas/ se lee (ZIP válido, con word/document.xml)', pagina.evaluate(async () => {
    const indice = await window.App.leerFicheroDeLaApp('plantillas/indice.json', 'json');
    const entrada = indice.filter((e) => e.clase === 'documento')[0];
    if (!entrada) return 'sin ninguna plantilla de documento en el índice';
    const bytes = await window.App.leerFicheroDeLaApp('plantillas/' + entrada.fichero, 'binario');
    const xml = await window.Docx.leerEntradaDeTexto(bytes, 'word/document.xml');
    return typeof xml === 'string' && xml.indexOf('<w:document') !== -1;
  }), true);

  await comprobarAsync('sin errores de consola (parte 1)', Promise.resolve(errores), []);
  await pagina.close();
  servidorAlDia.close();
}

/* ============================================================
   PARTE 2: la copia se actualiza de verdad (fila 91)
   ============================================================ */

function sha256Hex(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

const VERSION_LOCAL = JSON.parse(readFileSync(COPIA_LOCAL + 'version.json', 'utf8'));
const VERSION_NUEVA_TEXTO = 'nueva-prueba';
const VERSION_JS_NUEVO = readFileSync(COPIA_LOCAL + 'js/version.js', 'utf8')
  .replace(/App\.VERSION\s*=\s*'[^']+'/, "App.VERSION = '" + VERSION_NUEVA_TEXTO + "'");
const VERSION_REMOTA = {
  version: VERSION_NUEVA_TEXTO,
  ficheros: Object.assign({}, VERSION_LOCAL.ficheros, { 'js/version.js': sha256Hex(VERSION_JS_NUEVO) })
};
const FICHEROS_REMOTOS = { 'version.json': JSON.stringify(VERSION_REMOTA), 'js/version.js': VERSION_JS_NUEVO };

/* Las carpetas de la prueba son carpetas de verdad, en una temporal:
   así, tras escribir y recargar, la página abre de verdad lo escrito. */
const TEMPORAL = mkdtempSync(join(tmpdir(), 'copia-prueba-'));
function nuevaCopia(nombre) { const d = join(TEMPORAL, nombre); cpSync(COPIA_LOCAL, d, { recursive: true }); return d; }
function carpetaVacia(nombre, ficheros) {
  const d = join(TEMPORAL, nombre); mkdirSync(d, { recursive: true });
  for (const f of ficheros || []) writeFileSync(join(d, f), 'x');
  return d;
}

/* La página no puede tocar el disco de verdad: su `dir`/`fich` de
   mentira llama a `window.__disco(...)` (con `page.exposeFunction`, que
   sobrevive a las recargas) y quien lee y escribe es este proceso Node.
   IndexedDB igual: `window.__idb(...)`, porque una carpeta guardada
   tiene que seguir ahí tras `location.reload()`. */
function nuevoEntorno({ guardada, permiso }) {
  const estado = {
    idb: new Map(guardada ? [['copiaCarpeta', { raiz: guardada }]] : []),
    permiso: permiso || 'granted',
    consultas: 0, peticiones: 0,
    escritos: [],
    elegir: []   /* lo que irá devolviendo el selector de carpetas, en orden */
  };
  function ruta(raiz, r) { return join(TEMPORAL, raiz, r || ''); }
  async function disco(raiz, accion, r, datos) {
    const abs = ruta(raiz, r);
    if (accion === 'permiso') { estado.consultas++; return estado.permiso; }
    if (accion === 'pedirPermiso') { estado.peticiones++; estado.permiso = 'granted'; return 'granted'; }
    if (accion === 'existeDir') return existsSync(abs) && statSync(abs).isDirectory();
    if (accion === 'existeArchivo') return existsSync(abs) && statSync(abs).isFile();
    if (accion === 'crearDir') { mkdirSync(abs, { recursive: true }); return true; }
    if (accion === 'leer') return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    if (accion === 'escribir') { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, Buffer.from(datos || [])); estado.escritos.push(raiz + '/' + r); return true; }
    if (accion === 'borrar') { rmSync(abs, { force: true }); return true; }
    if (accion === 'listar') return readdirSync(abs, { withFileTypes: true }).map((e) => [e.name, e.isDirectory() ? 'directory' : 'file']);
    throw new Error('acción desconocida: ' + accion);
  }
  async function idb(accion, clave, valor) {
    if (accion === 'get') return estado.idb.has(clave) ? estado.idb.get(clave) : null;
    if (accion === 'put') { estado.idb.set(clave, valor); return true; }
    if (accion === 'delete') { estado.idb.delete(clave); return true; }
    if (accion === 'elegir') return estado.elegir.length ? estado.elegir.shift() : null;
    throw new Error('acción desconocida: ' + accion);
  }
  return { estado, disco, idb };
}

const SCRIPT_PAGINA = `
(function () {
  function dir(raiz, ruta) {
    return {
      kind: 'directory', _raiz: raiz,
      name: ruta ? ruta.split('/').pop() : raiz,
      async queryPermission() { return await window.__disco(raiz, 'permiso', ''); },
      async requestPermission() { return await window.__disco(raiz, 'pedirPermiso', ''); },
      async getDirectoryHandle(n, o) {
        const hijo = ruta ? ruta + '/' + n : n;
        if (!(await window.__disco(raiz, 'existeDir', hijo))) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          await window.__disco(raiz, 'crearDir', hijo);
        }
        return dir(raiz, hijo);
      },
      async getFileHandle(n, o) {
        const hijo = ruta ? ruta + '/' + n : n;
        if (!(await window.__disco(raiz, 'existeArchivo', hijo))) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          await window.__disco(raiz, 'escribir', hijo, []);
        }
        return fich(raiz, hijo);
      },
      async removeEntry(n) { await window.__disco(raiz, 'borrar', ruta ? ruta + '/' + n : n); },
      async *entries() {
        const lista = await window.__disco(raiz, 'listar', ruta);
        for (const [n, tipo] of lista) yield [n, tipo === 'directory' ? dir(raiz, ruta ? ruta + '/' + n : n) : fich(raiz, ruta ? ruta + '/' + n : n)];
      }
    };
  }
  function fich(raiz, ruta) {
    return {
      kind: 'file', name: ruta.split('/').pop(),
      async getFile() {
        const texto = await window.__disco(raiz, 'leer', ruta);
        return new Blob([texto == null ? '' : texto], { type: 'text/plain' });
      },
      async createWritable() {
        return {
          async write(c) {
            let bytes;
            if (typeof c === 'string') bytes = new TextEncoder().encode(c);
            else if (c instanceof Uint8Array) bytes = c;
            else if (c && typeof c.arrayBuffer === 'function') bytes = new Uint8Array(await c.arrayBuffer());
            else bytes = new TextEncoder().encode(String(c));
            await window.__disco(raiz, 'escribir', ruta, Array.from(bytes));
          },
          async close() {}
        };
      }
    };
  }
  function empaquetar(v) { return (v && v._raiz) ? { raiz: v._raiz } : { valor: (v === undefined ? null : v) }; }
  function desempaquetar(v) { if (!v) return undefined; return v.raiz ? dir(v.raiz, '') : v.valor; }
  Object.defineProperty(window, 'indexedDB', { configurable: true, value: {
    open() {
      const p = {};
      setTimeout(() => {
        p.result = {
          objectStoreNames: { contains: () => true },
          createObjectStore() {},
          transaction() {
            const t = {};
            let pendiente = Promise.resolve();
            t.objectStore = () => ({
              put(v, k) { let e; try { e = JSON.parse(JSON.stringify(empaquetar(v))); } catch (x) { e = { valor: null }; } pendiente = window.__idb('put', k, e); },
              get(k) { const r = {}; window.__idb('get', k).then((v) => { r.result = desempaquetar(v); r.onsuccess && r.onsuccess(); }); return r; },
              delete(k) { pendiente = window.__idb('delete', k); }
            });
            setTimeout(() => pendiente.then(() => t.oncomplete && t.oncomplete()), 0);
            return t;
          }
        };
        p.onsuccess && p.onsuccess();
      }, 0);
      return p;
    }
  } });
  window.showDirectoryPicker = async function () {
    const raiz = await window.__idb('elegir');
    if (!raiz) { const e = new Error('cancelado'); e.name = 'AbortError'; throw e; }
    return dir(raiz, '');
  };
})();
`;

async function abrir(entorno, base, fichero) {
  const pagina = await navegador.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  let navegaciones = 0;
  pagina.on('framenavigated', (f) => { if (f === pagina.mainFrame()) navegaciones++; });
  await pagina.exposeFunction('__disco', entorno.disco);
  await pagina.exposeFunction('__idb', entorno.idb);
  await pagina.addInitScript(`window.__COPIA_BASE_REMOTO__ = ${JSON.stringify(base)};`);
  await pagina.addInitScript(SCRIPT_PAGINA);
  await pagina.goto('file://' + fichero);
  return { pagina, errores, navegaciones: () => navegaciones };
}
const versionDeLaPagina = (pagina) => pagina.evaluate(() => window.App && App.VERSION);
const hayFranja = (pagina) => pagina.locator('#franja-copia').isVisible().catch(() => false);
async function esperarVersionNueva(pagina) {
  try { await pagina.waitForFunction((v) => window.App && App.VERSION === v, VERSION_NUEVA_TEXTO, { timeout: 10000 }); } catch (e) { /* lo dirá la comprobación */ }
  await pagina.waitForTimeout(500);
}

const servidor = await arrancarServidor(FICHEROS_REMOTOS);
const BASE = baseDe(servidor);

/* ---------- al día: ni franja, ni permiso, ni disco ---------- */
{
  const servidorAlDia = await arrancarServidor({ 'version.json': JSON.stringify(VERSION_LOCAL) });
  const d = nuevaCopia('aldia');
  const entorno = nuevoEntorno({ guardada: 'aldia', permiso: 'prompt' });
  const { pagina, errores } = await abrir(entorno, baseDe(servidorAlDia), d + '/index.html');
  await pagina.waitForTimeout(1500);
  await comprobarAsync('al día: no sale la franja', hayFranja(pagina), false);
  await comprobar('al día: ni se mira ni se pide el permiso', [entorno.estado.consultas, entorno.estado.peticiones], [0, 0]);
  await comprobar('al día: no se escribe nada en el disco', entorno.estado.escritos, []);
  await comprobar('al día: ninguna excepción', errores, []);
  await pagina.close();
  servidorAlDia.close();
}

/* ---------- vieja, con carpeta y permiso: se actualiza sola ---------- */
{
  const d = nuevaCopia('sola');
  const entorno = nuevoEntorno({ guardada: 'sola', permiso: 'granted' });
  const { pagina, errores, navegaciones } = await abrir(entorno, BASE, d + '/index.html');
  await esperarVersionNueva(pagina);
  await comprobarAsync('con carpeta y permiso: tras recargar, la versión es la nueva', versionDeLaPagina(pagina), VERSION_NUEVA_TEXTO);
  await comprobar('con carpeta y permiso: solo se escriben js/version.js y version.json', entorno.estado.escritos.sort(), ['sola/js/version.js', 'sola/version.json']);
  await comprobar('con carpeta y permiso: una sola recarga', navegaciones(), 2);
  await comprobarAsync('con carpeta y permiso: no sale la franja', hayFranja(pagina), false);
  await comprobar('con carpeta y permiso: ninguna excepción', errores, []);
  await pagina.close();
}

/* ---------- vieja, sin carpeta guardada: franja, «Actualizar ahora» pide la carpeta ---------- */
{
  const d = nuevaCopia('sincarpeta');
  carpetaVacia('otracosa', ['foto.jpg']);
  const entorno = nuevoEntorno({ guardada: null });
  const { pagina, errores } = await abrir(entorno, BASE, d + '/index.html');
  await pagina.waitForSelector('#franja-copia', { timeout: 5000 }).catch(() => {});
  await comprobarAsync('sin carpeta: sale la franja', hayFranja(pagina), true);
  await comprobarAsync('sin carpeta: la franja dice las dos versiones', pagina.locator('#franja-copia').textContent().then((t) =>
    t.indexOf('Hay una versión nueva del Gestor (' + VERSION_NUEVA_TEXTO + ')') !== -1 && t.indexOf('Esta copia tiene la ' + VERSION_LOCAL.version) !== -1), true);

  entorno.estado.elegir.push('otracosa');
  await pagina.click('#franja-copia-actualizar');
  await pagina.waitForTimeout(500);
  await comprobarAsync('sin carpeta: una carpeta equivocada se dice y no se toca', pagina.locator('#franja-copia-detalle').textContent().then((t) => t.indexOf('Esa carpeta no tiene la copia') !== -1), true);
  await comprobar('sin carpeta: con la equivocada no se escribe nada', entorno.estado.escritos, []);

  entorno.estado.elegir.push('sincarpeta');
  await pagina.click('#franja-copia-actualizar');
  await esperarVersionNueva(pagina);
  await comprobarAsync('sin carpeta: tras «Actualizar ahora», la versión es la nueva', versionDeLaPagina(pagina), VERSION_NUEVA_TEXTO);
  await comprobarAsync('sin carpeta: después ya no hay franja', hayFranja(pagina), false);
  await comprobar('sin carpeta: la carpeta queda guardada para la próxima', entorno.estado.idb.get('copiaCarpeta'), { raiz: 'sincarpeta' });
  await comprobar('sin carpeta: ninguna excepción', errores, []);
  await pagina.close();
}

/* ---------- vieja, con carpeta y sin permiso: el botón pide el permiso ---------- */
{
  const d = nuevaCopia('sinpermiso');
  const entorno = nuevoEntorno({ guardada: 'sinpermiso', permiso: 'prompt' });
  const { pagina, errores } = await abrir(entorno, BASE, d + '/index.html');
  await pagina.waitForSelector('#franja-copia', { timeout: 5000 }).catch(() => {});
  await comprobarAsync('sin permiso: sale la franja', hayFranja(pagina), true);
  await comprobar('sin permiso: no se pide el permiso sin un clic', entorno.estado.peticiones, 0);
  await comprobarAsync('sin permiso: ya no sale el aviso de abajo de antes', pagina.locator('#aviso-copia-permiso').count(), 0);
  await pagina.click('#franja-copia-actualizar');
  await esperarVersionNueva(pagina);
  await comprobar('sin permiso: el botón pide el permiso', entorno.estado.peticiones, 1);
  await comprobarAsync('sin permiso: después, la versión es la nueva', versionDeLaPagina(pagina), VERSION_NUEVA_TEXTO);
  await comprobarAsync('sin permiso: después ya no hay franja', hayFranja(pagina), false);
  await comprobar('sin permiso: ninguna excepción', errores, []);
  await pagina.close();
}

/* ---------- la ✕ calla la franja ---------- */
{
  const d = nuevaCopia('cerrar');
  const entorno = nuevoEntorno({ guardada: null });
  const { pagina } = await abrir(entorno, BASE, d + '/index.html');
  await pagina.waitForSelector('#franja-copia', { timeout: 5000 }).catch(() => {});
  await pagina.click('#franja-copia-cerrar');
  await comprobarAsync('la ✕ quita la franja', hayFranja(pagina), false);
  await pagina.close();
}

/* ---------- carpeta equivocada: no recarga en bucle ---------- */
{
  const d = nuevaCopia('estaventana');
  nuevaCopia('otracopia');
  const entorno = nuevoEntorno({ guardada: 'otracopia', permiso: 'granted' });
  const { pagina, errores, navegaciones } = await abrir(entorno, BASE, d + '/index.html');
  await pagina.waitForTimeout(3000);
  await comprobar('carpeta equivocada: se recarga una vez y no más', navegaciones(), 2);
  await comprobarAsync('carpeta equivocada: la franja dice que esta ventana abre otra copia', pagina.locator('#franja-copia').textContent().then((t) =>
    t.indexOf('He actualizado la carpeta otracopia, pero esta ventana abre otra copia. Abre la aplicación desde la carpeta otracopia.') !== -1).catch(() => false), true);
  await comprobar('carpeta equivocada: se olvida la carpeta guardada', entorno.estado.idb.has('copiaCarpeta'), false);
  await comprobar('carpeta equivocada: ninguna excepción', errores, []);
  await pagina.close();
}

/* ---------- con el servidor apagado: arranca igual, con el aviso ---------- */
{
  const s = await arrancarServidor({});
  const puertoSinNadie = s.address().port;
  await new Promise((r) => s.close(r));
  const d = nuevaCopia('apagado');
  const entorno = nuevoEntorno({ guardada: 'apagado', permiso: 'granted' });
  const { pagina, errores } = await abrir(entorno, 'http://127.0.0.1:' + puertoSinNadie + '/', d + '/index.html');
  await pagina.waitForTimeout(1500);
  await comprobarAsync('sin servidor: la copia arranca igual (la pantalla de entrada sale)', pagina.locator('#paso-carpetas').isVisible(), true);
  await comprobar('sin servidor: no se escribe nada', entorno.estado.escritos, []);
  /* Fila 121 (docs/AVISO-DE-VERSION-SEGURO.md): la franja fija, no un aviso que se borra. */
  await comprobarAsync('sin servidor: sale la franja fija de «no he podido comprobar»', pagina.locator('#franja-copia').textContent().then((t) =>
    t.indexOf('No he podido comprobar si hay una versión nueva') !== -1), true);
  await comprobarAsync('sin servidor: dice qué versión tiene esta copia', pagina.locator('#franja-copia').textContent().then((t) =>
    t.indexOf(VERSION_LOCAL.version) !== -1), true);
  await comprobarAsync('sin servidor: los pasos a mano, plegados', pagina.locator('#franja-copia-pasos').isVisible(), false);
  await pagina.click('#franja-copia-a-mano');
  await comprobarAsync('sin servidor: «Cómo actualizar a mano» enseña los pasos', pagina.locator('#franja-copia-pasos').textContent().then((t) =>
    t.indexOf('ABRIR EL GESTOR.html') !== -1), true);
  await pagina.waitForTimeout(5500);
  await comprobarAsync('sin servidor: la franja sigue ahí pasados unos segundos', hayFranja(pagina), true);
  await pagina.click('#franja-copia-cerrar');
  await pagina.evaluate(() => window.ActualizarCopia.comprobar(true));
  await pagina.waitForTimeout(300);
  await comprobarAsync('sin servidor: cerrada, no vuelve a salir en esta ventana', hayFranja(pagina), false);
  await comprobar('sin servidor: ninguna excepción sin capturar', errores, []);
  await pagina.close();
}

/* ---------- fila 121: la vuelta de cada 30 minutos nunca recarga ---------- */
{
  const servidorAlDia = await arrancarServidor({ 'version.json': JSON.stringify(VERSION_LOCAL) });
  const d = nuevaCopia('enmarcha');
  const entorno = nuevoEntorno({ guardada: 'enmarcha', permiso: 'granted' });
  const { pagina, errores, navegaciones } = await abrir(entorno, baseDe(servidorAlDia), d + '/index.html');
  await pagina.waitForTimeout(1200);
  await comprobarAsync('en marcha: al entrar, al día, sin franja', hayFranja(pagina), false);
  /* Mientras está abierta, se publica una versión nueva. */
  await pagina.evaluate((base) => { window.ActualizarCopia._cambiarBase && window.ActualizarCopia._cambiarBase(base); }, BASE);
  await pagina.evaluate(() => window.ActualizarCopia.comprobar(true));
  await pagina.waitForTimeout(800);
  await comprobarAsync('en marcha: sale la franja con «Actualizar ahora»', pagina.locator('#franja-copia-actualizar').isVisible(), true);
  await comprobar('en marcha: no se recarga la página', navegaciones(), 1);
  await comprobar('en marcha: no escribe nada sola', entorno.estado.escritos, []);
  await comprobar('en marcha: ninguna excepción', errores, []);
  await pagina.close();
  servidorAlDia.close();
}

/* ---------- ABRIR EL GESTOR.html sobre una copia vieja ya instalada ---------- */
{
  const d = nuevaCopia('rescate');
  carpetaVacia('mala', ['foto.jpg']);
  const entorno = nuevoEntorno({ guardada: null });
  const { pagina, errores } = await abrir(entorno, BASE, d + '/ABRIR EL GESTOR.html');
  entorno.estado.elegir.push('mala');
  await pagina.click('#btn-empezar');
  await pagina.waitForTimeout(500);
  await comprobarAsync('instalador: una carpeta que no es la suya se dice', pagina.locator('#texto-carpeta-mala').textContent().then((t) => t.indexOf('Esa no parece la carpeta') !== -1), true);
  entorno.estado.elegir.push('rescate');
  await pagina.click('#btn-empezar');
  await esperarVersionNueva(pagina);
  await comprobarAsync('instalador: acaba en index.html', pagina.evaluate(() => decodeURIComponent(location.pathname).endsWith('/index.html')), true);
  await comprobarAsync('instalador: la copia vieja queda con la versión nueva', versionDeLaPagina(pagina), VERSION_NUEVA_TEXTO);
  await comprobar('instalador: solo descarga lo cambiado', entorno.estado.escritos.sort(), ['rescate/js/version.js', 'rescate/version.json']);
  await comprobar('instalador: guarda la carpeta también si ya estaba instalada', entorno.estado.idb.get('copiaCarpeta'), { raiz: 'rescate' });
  await comprobarAsync('instalador: sin franja al llegar', hayFranja(pagina), false);
  await comprobar('instalador: ninguna excepción', errores, []);
  await pagina.close();
}

servidor.close();
rmSync(TEMPORAL, { recursive: true, force: true });

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de la copia sin internet pasan.');
process.exit(fallos ? 1 : 0);
