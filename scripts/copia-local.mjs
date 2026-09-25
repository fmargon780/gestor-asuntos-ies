/* ============================================================
   copia-local.mjs — genera `copia-local/`, una copia utilizable de la
   aplicación que se abre desde el disco, sin internet salvo para
   actualizarse (21-sep-2026, fila 89, docs/COPIA-SIN-INTERNET.md,
   apartado 2).

   Se ejecuta con Node (`npm run copia-local`), sin navegador y sin
   bundlers, salvo esbuild para pdf.js (el único paquete que hace
   falta traer de internet, ya en devDependencies).

   Genera:
     - `index.html`, `css/`, `js/` (con los ficheros nuevos de la fila
       89 ya dentro, porque copia todo `js/` tal cual) y `favicon.svg`,
       copiados sin tocar.
     - `js/lib/pdf.iife.js` y `js/lib/pdf.worker.iife.js`: versiones
       clásicas (IIFE) de `js/lib/pdf.min.mjs` y
       `js/lib/pdf.worker.min.mjs`, con esbuild, para que `file://`
       las cargue con `<script>` (no puede hacer `import()`). Ver el
       contrato completo en `js/cargar-fichero.js` (`App.cargarPdfJs`).
     - `copia-datos/<ruta>.js`: uno por cada JSON de `datos-biblioteca/`,
       `datos/formularios.json`, `plantillas/indice.json`, cada PDF de
       `formularios/` y cada `.docx` de `plantillas/`. El nombre y el
       contenido siguen el contrato de `App.leerFicheroDeLaApp`
       (js/cargar-fichero.js): la ruta con cada `/` cambiado por `~`, y
       dentro, `window.__COPIA__['<ruta>'] = <dato>` (el JSON tal
       cual, o una cadena en base64 para un binario).
     - `ABRIR EL GESTOR.html`: copiado tal cual de
       `scripts/plantillas-copia/`, el instalador y actualizador
       (js/actualizar-copia.js documenta el resto del mecanismo).
     - `version.json`: `{ version, ficheros: { "<ruta>": "<sha256>" } }`
       de todos los ficheros generados (todos menos el propio
       `version.json`), con `App.VERSION` SIN la coletilla
       "· copia sin internet" (esa la añade `js/nucleo.js` al pintarla,
       mirando `location.protocol`).

   NO copia `docs/`, `pruebas/`, `herramientas/`, `scripts/` ni
   `apps-script/`: no hacen falta para que la aplicación funcione, y
   los tres primeros llevan notas internas del centro.
   ============================================================ */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SALIDA = join(RAIZ, 'copia-local');

function rutaRaiz(...partes) { return join(RAIZ, ...partes); }
function rutaSalida(...partes) { return join(SALIDA, ...partes); }

/* ---------- utilidades de disco ---------- */

function crearCarpeta(ruta) { mkdirSync(ruta, { recursive: true }); }

function copiarFichero(origenAbs, destinoAbs) {
  crearCarpeta(dirname(destinoAbs));
  writeFileSync(destinoAbs, readFileSync(origenAbs));
}

/* Copia un directorio entero, recursivamente, tal cual. */
function copiarDirectorio(origenAbs, destinoAbs) {
  crearCarpeta(destinoAbs);
  for (const entrada of readdirSync(origenAbs, { withFileTypes: true })) {
    const o = join(origenAbs, entrada.name);
    const d = join(destinoAbs, entrada.name);
    if (entrada.isDirectory()) copiarDirectorio(o, d);
    else copiarFichero(o, d);
  }
}

function listarFicheros(dirAbs, filtro) {
  if (!existsSync(dirAbs)) return [];
  return readdirSync(dirAbs, { withFileTypes: true })
    .filter((e) => e.isFile() && (!filtro || filtro(e.name)))
    .map((e) => e.name)
    .sort();
}

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/* ---------- copia-datos/ ---------- */

const NOMBRES_YA_USADOS = new Set();

function nombreDeCopiaDatos(ruta) {
  const nombre = ruta.replace(/\//g, '~') + '.js';
  if (NOMBRES_YA_USADOS.has(nombre)) throw new Error('nombre de copia-datos repetido: ' + nombre);
  NOMBRES_YA_USADOS.add(nombre);
  return nombre;
}

/* Un JSON, tal cual (ya es una sintaxis de objeto/array válida en
   JavaScript). U+2028/U+2029 dentro de una cadena rompen un script
   clásico en motores viejos: se escapan por si acaso, aunque Chrome
   (el único navegador que vale para esta aplicación) ya los admite. */
function literalDeJson(texto) {
  JSON.parse(texto);   /* solo para comprobar que es JSON de verdad */
  return texto.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function literalDeBinario(bytes) {
  return JSON.stringify(Buffer.from(bytes).toString('base64'));
}

const ficherosGenerados = [];   /* { rutaAbs, rutaRelativa } de todo lo que entra en version.json */

function escribirGenerado(rutaRelativaEnSalida, contenido) {
  const abs = rutaSalida(rutaRelativaEnSalida);
  crearCarpeta(dirname(abs));
  writeFileSync(abs, contenido);
  ficherosGenerados.push(abs);
}

function escribirCopiaDatos(ruta, tipo, literal) {
  const nombreFichero = nombreDeCopiaDatos(ruta);
  const contenido =
    "window.__COPIA__ = window.__COPIA__ || {};\n" +
    "window.__COPIA__[" + JSON.stringify(ruta) + "] = " + literal + ";\n";
  escribirGenerado(join('copia-datos', nombreFichero), contenido);
}

function generarCopiaDatosDeJson(ruta) {
  const texto = readFileSync(rutaRaiz(ruta), 'utf8');
  escribirCopiaDatos(ruta, 'json', literalDeJson(texto));
}

function generarCopiaDatosDeBinario(ruta) {
  const bytes = readFileSync(rutaRaiz(ruta));
  escribirCopiaDatos(ruta, 'binario', literalDeBinario(bytes));
}

/* ---------- el conjunto ---------- */

async function main() {
  if (existsSync(SALIDA)) rmSync(SALIDA, { recursive: true, force: true });
  crearCarpeta(SALIDA);

  /* 1. La aplicación tal cual: index.html, css/, js/, favicon.svg. */
  copiarFichero(rutaRaiz('index.html'), rutaSalida('index.html'));
  copiarFichero(rutaRaiz('favicon.svg'), rutaSalida('favicon.svg'));
  copiarDirectorio(rutaRaiz('css'), rutaSalida('css'));
  copiarDirectorio(rutaRaiz('js'), rutaSalida('js'));

  /* 2. El instalador y actualizador, autónomo. */
  copiarFichero(rutaRaiz('scripts', 'plantillas-copia', 'ABRIR EL GESTOR.html'), rutaSalida('ABRIR EL GESTOR.html'));

  /* 3. pdf.js en versión clásica (IIFE), con esbuild: en `file://` no
        se puede hacer `import()` de un módulo. El worker primero: al
        cargarse se autoasigna `globalThis.pdfjsWorker` (ver
        js/cargar-fichero.js). Sin `bundle`: los dos ficheros de
        origen ya son un único bundle de webpack, sin imports
        estáticos que resolver.

        `js/lib/pdf.min.mjs` trae, en su propio código (no puesto por
        nosotros), un único `await` de nivel superior:
        `globalThis.pdfjsLib = await (globalThis.pdfjsLibPromise = ...)`
        — esbuild no genera un IIFE con `await` de nivel superior (solo
        lo admite en formato `esm`). Comprobado a mano el 21-sep-2026:
        `__webpack_require__(228)` (lo que hay a la derecha) es de
        verdad una promesa ahí dentro, así que quitar el `await` sin
        más dejaría `globalThis.pdfjsLib` con la promesa sin resolver
        (con `.getDocument` vacío). La solución: se dejan las DOS
        variantes con el `await` quitado del origen (para que esbuild
        pueda envolverlas), y es `App.cargarPdfJs()` quien, ya en el
        navegador, espera esa promesa si hace falta
        (`if (typeof lib.then === 'function') lib = await lib`) antes
        de dar la librería por cargada. Sin `globalName`: el
        `export {}` del final del fichero se pierde (no hace falta,
        nadie lo usa), pero así esbuild no envuelve el resultado en un
        `var pdfjsLib = (()=>{...})()` que pisaría, al final, la
        asignación de verdad que hace el propio código. */
  const ORIGEN_AWAIT = /=await \(globalThis\.pdfjsLibPromise=/;
  const fuentePdfLib = readFileSync(rutaRaiz('js', 'lib', 'pdf.min.mjs'), 'utf8');
  /* pdf.js 4.10 (fila 132) ya no trae ese `await`: pone
     `globalThis.pdfjsLib = {}` directamente, y el fichero se usa tal
     cual. El parche solo se aplica si el `await` sigue ahí (4.2). */
  const fuentePdfLibSinAwait = ORIGEN_AWAIT.test(fuentePdfLib)
    ? fuentePdfLib.replace(ORIGEN_AWAIT, '=(globalThis.pdfjsLibPromise=')
    : fuentePdfLib;

  await esbuild.build({
    entryPoints: [rutaRaiz('js', 'lib', 'pdf.worker.min.mjs')],
    outfile: rutaSalida('js', 'lib', 'pdf.worker.iife.js'),
    format: 'iife',
    bundle: false,
    logLevel: 'warning'
  });
  await esbuild.build({
    stdin: {
      contents: fuentePdfLibSinAwait,
      loader: 'js',
      resolveDir: rutaRaiz('js', 'lib')
    },
    outfile: rutaSalida('js', 'lib', 'pdf.iife.js'),
    format: 'iife',
    bundle: false,
    logLevel: 'warning'
  });
  ficherosGenerados.push(rutaSalida('js', 'lib', 'pdf.worker.iife.js'), rutaSalida('js', 'lib', 'pdf.iife.js'));

  /* 4. copia-datos/: un fichero por cada dato estático que la
        aplicación pide con `App.leerFicheroDeLaApp`. */
  generarCopiaDatosDeJson('datos-biblioteca/biblioteca-centro.json');
  generarCopiaDatosDeJson('datos/formularios.json');
  generarCopiaDatosDeJson('plantillas/indice.json');
  /* Fila 149: la letra y el símbolo del membrete (js/membrete.js). */
  generarCopiaDatosDeBinario('img/junta-andalucia-simbolo.svg');
  generarCopiaDatosDeBinario('fonts/NotoSansHK-latin-400.woff2');
  generarCopiaDatosDeBinario('fonts/NotoSansHK-latin-700.woff2');

  for (const nombre of listarFicheros(rutaRaiz('formularios'), (n) => n.toLowerCase().endsWith('.pdf'))) {
    generarCopiaDatosDeBinario('formularios/' + nombre);
  }
  for (const nombre of listarFicheros(rutaRaiz('plantillas'), (n) => n.toLowerCase().endsWith('.docx'))) {
    generarCopiaDatosDeBinario('plantillas/' + nombre);
  }

  /* 5. version.json: la versión sin la coletilla de "copia sin
        internet" (la añade js/nucleo.js al pintarla, mirando
        location.protocol), y el sha256 de todo lo generado. */
  const version = readFileSync(rutaSalida('js', 'version.js'), 'utf8').match(/App\.VERSION\s*=\s*'([^']+)'/);
  if (!version) throw new Error('no encuentro App.VERSION en js/version.js');

  const ficheros = {};
  for (const abs of ficherosGenerados) {
    ficheros[relative(SALIDA, abs).split('\\').join('/')] = sha256Hex(readFileSync(abs));
  }
  /* Recorre también lo copiado en el paso 1 y 2 (index.html, css/,
     js/, favicon.svg, ABRIR EL GESTOR.html), que no pasó por
     escribirGenerado(). */
  function recorrerParaSha(dirAbs) {
    for (const entrada of readdirSync(dirAbs, { withFileTypes: true })) {
      const abs = join(dirAbs, entrada.name);
      if (entrada.isDirectory()) { recorrerParaSha(abs); continue; }
      const rel = relative(SALIDA, abs).split('\\').join('/');
      if (rel === 'version.json') continue;
      if (ficheros[rel] !== undefined) continue;   /* ya contado arriba */
      ficheros[rel] = sha256Hex(readFileSync(abs));
    }
  }
  recorrerParaSha(SALIDA);

  writeFileSync(rutaSalida('version.json'), JSON.stringify({ version: version[1], ficheros }, null, 2));

  console.log('copia-local/ generada: ' + Object.keys(ficheros).length + ' ficheros, versión ' + version[1] + '.');
}

main().catch((e) => { console.error(e); process.exit(1); });
