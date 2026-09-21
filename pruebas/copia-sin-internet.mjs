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
   2. `js/actualizar-copia.js`, con un `version.json` viejo de mentira
      y un servidor HTTP local que hace de `raw.githubusercontent.com`:
      descarga solo lo que cambia y recarga; con el servidor apagado,
      arranca igual con el aviso discreto. */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
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
}

/* ============================================================
   PARTE 2: js/actualizar-copia.js, con un servidor de mentira
   ============================================================ */

function sha256Hex(texto) { return createHash('sha256').update(texto).digest('hex'); }

const FICHERO_VIEJO = 'console.log("viejo");\n';
const FICHERO_NUEVO = 'console.log("nuevo, de verdad");\n';
const VERSION_VIEJA = { version: 'vieja', ficheros: { 'js/algo.js': sha256Hex(FICHERO_VIEJO), 'index.html': sha256Hex('<html>viejo</html>') } };
const VERSION_NUEVA = { version: 'nueva', ficheros: { 'js/algo.js': sha256Hex(FICHERO_NUEVO), 'index.html': sha256Hex('<html>viejo</html>') } };

function arrancarServidorDeMentira() {
  const ficheros = { 'version.json': JSON.stringify(VERSION_NUEVA), 'js/algo.js': FICHERO_NUEVO, 'index.html': '<html>viejo</html>' };
  const servidor = createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.replace(/^\//, ''));
    /* Como raw.githubusercontent.com de verdad: CORS abierto, para que
       una página `file://` (origen "null") pueda leerlo con `fetch`. */
    if (Object.prototype.hasOwnProperty.call(ficheros, ruta)) {
      res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
      res.end(ficheros[ruta]);
    } else {
      res.writeHead(404, { 'access-control-allow-origin': '*' }); res.end('no está');
    }
  });
  return new Promise((resolver) => servidor.listen(0, '127.0.0.1', () => resolver(servidor)));
}

/* El disco de mentira vive en ESTE proceso Node (no dentro de la
   página): `js/actualizar-copia.js` hace `location.reload()` cuando
   actualiza, y una página nueva no se acuerda de nada que solo
   viviera en su propio `window` — un `addInitScript` normal, que se
   vuelve a ejecutar en cada navegación, recrearía el disco desde cero
   y "olvidaría" lo que se acaba de escribir. `page.exposeFunction`
   sí sobrevive a la recarga: por eso el `dir`/`fich` de mentira que ve
   la página solo llama a `window.__disco(...)`, y quien de verdad
   guarda los bytes es el `Map` de aquí abajo. */
function nuevoDiscoDeMentira(ficherosIniciales) {
  const contenidos = new Map(Object.entries(ficherosIniciales));   /* ruta -> texto */
  const carpetas = new Set(['']);   /* '' es la raíz; una ruta está en `carpetas` si es un directorio */
  for (const ruta of contenidos.keys()) {
    const partes = ruta.split('/');
    for (let i = 1; i < partes.length; i++) carpetas.add(partes.slice(0, i).join('/'));
  }
  async function operar(accion, ruta, datos) {
    if (accion === 'existeDir') return carpetas.has(ruta);
    if (accion === 'existeArchivo') return contenidos.has(ruta);
    if (accion === 'crearDir') { carpetas.add(ruta); return true; }
    if (accion === 'leer') return contenidos.has(ruta) ? contenidos.get(ruta) : null;
    if (accion === 'escribir') { contenidos.set(ruta, datos); return true; }
    if (accion === 'borrar') { contenidos.delete(ruta); return true; }
    throw new Error('acción de disco de mentira desconocida: ' + accion);
  }
  return { operar, contenidos };
}

/* El `dir`/`fich` que ve la página: delega todo en `window.__disco`
   (instalada con `page.exposeFunction`, ver más arriba). */
const SCRIPT_CARPETA_EXPUESTA = `
(function () {
  function dir(ruta) {
    return {
      kind: 'directory',
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; },
      async getDirectoryHandle(n, o) {
        const hijo = ruta ? ruta + '/' + n : n;
        if (!(await window.__disco('existeDir', hijo))) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          await window.__disco('crearDir', hijo);
        }
        return dir(hijo);
      },
      async getFileHandle(n, o) {
        const hijo = ruta ? ruta + '/' + n : n;
        if (!(await window.__disco('existeArchivo', hijo))) {
          if (!o || !o.create) { const e = new Error('no'); e.name = 'NotFoundError'; throw e; }
          await window.__disco('escribir', hijo, '');
        }
        return fich(hijo);
      },
      async removeEntry(n) { await window.__disco('borrar', ruta ? ruta + '/' + n : n); }
    };
  }
  function fich(ruta) {
    return {
      kind: 'file',
      async getFile() {
        const texto = await window.__disco('leer', ruta);
        return new Blob([texto == null ? '' : texto], { type: 'text/plain' });
      },
      async createWritable() {
        return {
          async write(c) {
            var texto;
            if (typeof c === 'string') texto = c;
            else if (c instanceof Uint8Array) texto = new TextDecoder().decode(c);
            else if (c && typeof c.arrayBuffer === 'function') texto = new TextDecoder().decode(await c.arrayBuffer());
            else texto = String(c);
            await window.__disco('escribir', ruta, texto);
          },
          async close() {}
        };
      }
    };
  }
  const guardado = new Map();
  guardado.set('copiaCarpeta', dir(''));
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
})();
`;

/* Un puerto que de verdad no escucha nadie: se abre y se cierra un
   servidor solo para que el sistema operativo suelte uno libre. */
async function puertoLibreYCerrado() {
  const s = await arrancarServidorDeMentira();
  const puerto = s.address().port;
  await new Promise((r) => s.close(r));
  return puerto;
}

{
  const servidor = await arrancarServidorDeMentira();
  const puerto = servidor.address().port;
  const base = 'http://127.0.0.1:' + puerto + '/';

  const disco = nuevoDiscoDeMentira({
    'version.json': JSON.stringify(VERSION_VIEJA),
    'index.html': '<html>viejo</html>',
    'js/algo.js': FICHERO_VIEJO
  });
  const pagina = await navegador.newPage();
  await pagina.exposeFunction('__disco', disco.operar);
  await pagina.addInitScript(`window.__COPIA_BASE_REMOTO__ = ${JSON.stringify(base)};`);
  await pagina.addInitScript(SCRIPT_CARPETA_EXPUESTA);
  const recargos = [];
  pagina.on('framenavigated', () => recargos.push(1));
  await pagina.goto('file://' + COPIA_LOCAL + 'index.html');
  await pagina.waitForTimeout(1500);   /* tiempo de sobra para comprobar, descargar y recargar */

  await comprobar('con servidor arriba: descarga solo lo cambiado', disco.contenidos.get('js/algo.js'), FICHERO_NUEVO);
  await comprobar('index.html no cambiado no se toca', disco.contenidos.get('index.html'), '<html>viejo</html>');
  await comprobar('version.json local queda con la versión nueva', JSON.parse(disco.contenidos.get('version.json')).version, 'nueva');
  await comprobar('la página se ha recargado sola', recargos.length > 1, true);

  await pagina.close();
  servidor.close();
}

/* ---------- con el servidor apagado: arranca igual, con el aviso ---------- */
{
  const puertoSinNadie = await puertoLibreYCerrado();
  const disco = nuevoDiscoDeMentira({
    'version.json': JSON.stringify(VERSION_VIEJA),
    'index.html': '<html>viejo</html>',
    'js/algo.js': FICHERO_VIEJO
  });
  const pagina = await navegador.newPage();
  await pagina.exposeFunction('__disco', disco.operar);
  await pagina.addInitScript(`window.__COPIA_BASE_REMOTO__ = ${JSON.stringify('http://127.0.0.1:' + puertoSinNadie + '/')};`);
  await pagina.addInitScript(SCRIPT_CARPETA_EXPUESTA);
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  await pagina.goto('file://' + COPIA_LOCAL + 'index.html');
  await pagina.waitForTimeout(1500);

  await comprobarAsync('sin servidor: la copia arranca igual (la pantalla de entrada sale)',
    pagina.locator('#paso-carpetas').isVisible(), true);
  await comprobar('sin servidor: version.json local no ha cambiado', JSON.parse(disco.contenidos.get('version.json')).version, 'vieja');
  await comprobarAsync('sin servidor: aviso discreto de "no se ha podido comprobar"', pagina.evaluate(() => {
    return Array.from(document.querySelectorAll('#mensajes .mensaje')).some((d) => d.textContent.toLowerCase().indexOf('no se ha podido comprobar') !== -1);
  }), true);
  await comprobarAsync('sin servidor: ninguna excepción sin capturar', Promise.resolve(errores), []);

  await pagina.close();
}

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de la copia sin internet pasan.');
process.exit(fallos ? 1 : 0);
