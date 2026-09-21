# Copia de la aplicación que funciona sin internet

Decidido con Francisco el 21-sep-2026. Diseño cerrado por él.

## Por qué

El filtro de la red del instituto (Junta de Andalucía) corta la conexión a asuntos.fmargon.com
(`ERR_CONNECTION_RESET`). Antes cortaba `vercel.app` y dejaba pasar `fmargon.com`; ahora corta
también el dominio. Los servidores son los mismos (Vercel), así que el filtro bloquea **por
nombre**: cambiar de alojamiento con el mismo nombre no lo arregla. Compartir datos del móvil por
USB no funciona en ese ordenador.

La aplicación no necesita internet para trabajar: todo lo hace sobre las carpetas de Dropbox, que
ya están en el disco. Solo necesita internet para **descargarse**. Así que se deja una copia de la
aplicación dentro del Dropbox del centro y se abre desde el disco (`file://`), con doble clic.

## Lo que ve Francisco al final

- En el Dropbox del centro aparece una carpeta `Aplicaciones/Gestor de Asuntos/` (o
  `Apps/Gestor de Asuntos/`) con un fichero **`ABRIR EL GESTOR.html`**.
- Doble clic → se abre en Chrome la aplicación de siempre, sin pasar por internet.
- La primera vez en cada ordenador hay que volver a señalar las carpetas (es otra "dirección" para
  Chrome). Después, igual que siempre.
- En la cabecera, junto a la versión, se lee **«copia sin internet»**, para saber cuál está usando.
- Cada vez que se publica una mejora en `main`, la copia de Dropbox se actualiza sola en unos
  minutos.
- La versión web (asuntos.fmargon.com) sigue igual. Las dos trabajan sobre los mismos datos.
- Los correos no cambian: el script de Gmail corre en Google y deja los correos en su carpeta; la
  copia la lee igual. Los enlaces a `mail.google.com` funcionan (Gmail no está bloqueado).

## Qué hay que hacer

### 1. Que la aplicación funcione abierta desde el disco

En `file://` Chrome **no deja** hacer `fetch()` de ficheros ni `import()` de módulos. Sí deja
cargar `<script src>` clásicos, `showDirectoryPicker`, IndexedDB y localStorage (comprobado el
21-sep-2026 con Chromium: `isSecureContext` true, `showDirectoryPicker` existe, IndexedDB y
localStorage funcionan).

Puntos de la aplicación que hoy se rompen en `file://` (lista completa, sacada con
`grep -rn "fetch(\|import(" js --include=*.js | grep -v js/lib`):

| Fichero | Qué carga |
|---|---|
| `js/cargar-biblioteca.js` (línea ~38) | `datos-biblioteca/biblioteca-centro.json` |
| `js/formularios.js` (~44) | `datos/formularios.json` |
| `js/formularios-rellenar.js` (~106) | PDF de `formularios/` (binarios, 6,4 MB en total) |
| `js/plantillas-documento.js` (~534 y ~553) | índice de `plantillas/` y los `.docx` |
| `js/registro-lector.js` (~57), `js/preparar-documento.js` (~31), `js/pdf-separar-unir.js` (~37) | `import('./lib/pdf.min.mjs')` y su worker |

Cómo resolverlo, **sin cambiar el comportamiento de la versión web**:

- Nuevo módulo pequeño `js/cargar-fichero.js` con una sola función, p. ej.
  `App.leerFicheroDeLaApp(ruta, tipo)` (`tipo`: `'json'` o `'binario'`). En `http(s)` hace el
  `fetch` de siempre. En `file:` inyecta una etiqueta `<script src="copia-datos/<ruta>.js">` que
  define `window.__COPIA__['<ruta>']` (JSON tal cual, o base64 para binarios) y devuelve lo mismo
  que devolvería el `fetch` (el objeto JSON o un `ArrayBuffer`). Carga perezosa: cada fichero se
  pide solo cuando hace falta, como ahora.
- Cambiar los cinco `fetch` de la tabla para que llamen a esa función. Cambio quirúrgico: una
  línea cada uno.
- pdf.js: en `file:` no se usa `import()`. El paso de preparación (punto 2) genera versiones
  clásicas (IIFE) de `pdf.min.mjs` y `pdf.worker.min.mjs` con esbuild. En `file:` se cargan con
  `<script>` en este orden: primero el worker (deja `globalThis.pdfjsWorker`, y pdf.js lo usa en el
  hilo principal sin crear un Worker), luego pdf.js. Juntar la carga en una función compartida
  por los tres ficheros que hoy repiten el `import()`, así no hay tres copias.

### 2. El paso que genera la copia

Nuevo `scripts/copia-local.mjs` (se ejecuta con `node`, sin navegador). Genera la carpeta
`copia-local/` (en `.gitignore`, no se sube al repositorio) con:

- `index.html`, `css/`, `js/`, `favicon.svg` y lo que `index.html` cargue, copiados tal cual.
- `copia-local/copia-datos/…js`: un fichero por cada JSON, PDF de `formularios/` y `.docx` de
  `plantillas/` (y `plantilla/` si algo lo carga), con el formato del punto 1.
- `js/lib/pdf.iife.js` y `js/lib/pdf.worker.iife.js` (esbuild, `format: 'iife'`). Añadir
  `esbuild` a `devDependencies` de `package.json`.
- `ABRIR EL GESTOR.html`: una página mínima que redirige a `index.html` (con `location.replace`)
  y un texto de una línea por si no redirige.
- Que no se copie `docs/`, `pruebas/`, `herramientas/`, `scripts/` ni `apps-script/`.

La etiqueta **«copia sin internet»** junto a la versión la pone `js/version.js` (o donde se pinte
`App.VERSION`) cuando `location.protocol === 'file:'`.

Enlace a `normativa-escolarizacion.vercel.app`: se queda como está. En el instituto no abrirá, y
eso no se arregla aquí.

### 3. Subirla a Dropbox sola

Nuevo `.github/workflows/copia-dropbox.yml`:

- Se dispara en cada `push` a `main` que toque algo fuera de `docs/`, y a mano
  (`workflow_dispatch`).
- `npm ci`, `node scripts/copia-local.mjs`, y sube `copia-local/` a Dropbox con la API
  (`/2/files/upload`, modo `overwrite`; borrar en Dropbox lo que ya no esté en la copia). Sin
  acciones de terceros: un script `scripts/subir-dropbox.mjs` con `fetch` de Node.
- Credenciales en secretos del repositorio: `DROPBOX_APP_KEY` y `DROPBOX_REFRESH_TOKEN`
  (flujo PKCE, sin secreto de aplicación). El script pide el token de acceso con el refresh
  token en cada ejecución.
- La aplicación de Dropbox se crea con acceso **«App folder»**: solo ve su propia carpeta, no el
  resto del Dropbox del centro.
- Si los secretos no existen, el paso termina en verde con un aviso («falta conectar Dropbox»),
  sin romper nada.

Esto no gasta publicaciones de Vercel (es GitHub Actions, no Vercel).

**Si la sesión no puede subir ficheros a `.github/workflows/`** (en ERP-Nutricion dio 403 desde
una sesión en la nube): sube todo lo demás, deja el `.yml` escrito en
`docs/copia-dropbox.yml.txt`, marca la fila BLOQUEADA con esa razón, y Francisco lo sube una vez
desde una sesión de Claude Code en su ordenador.

### 4. Los pasos de Francisco, una sola vez

Escribir `docs/CONECTAR-DROPBOX.md` con los pasos para conectar, **en castellano llano, un paso
por línea, como mucho ocho pasos**, sin jerga. Para que él no tenga que manejar códigos a mano,
hacer una página de ayuda `herramientas/conectar-dropbox.html` (se publica en la web) que:

1. le pide la App key (la copia de la página de Dropbox),
2. le manda a Dropbox a dar el permiso (PKCE, `token_access_type=offline`),
3. a la vuelta le enseña el refresh token con un botón **Copiar**,
4. y le dice exactamente dónde pegarlo en GitHub (enlace directo a
   `https://github.com/fmargon780/gestor-asuntos-ies/settings/secrets/actions/new`).

Esa página se usa desde casa (en el instituto la web está bloqueada). Añadir su dirección de
vuelta en las instrucciones de creación de la aplicación de Dropbox (Redirect URI:
`https://asuntos.fmargon.com/herramientas/conectar-dropbox.html`). Si `herramientas/` no se
publica en Vercel, poner la página en otra ruta que sí se publique.

## Ficheros a tocar

Nuevos: `js/cargar-fichero.js`, `scripts/copia-local.mjs`, `scripts/subir-dropbox.mjs`,
`.github/workflows/copia-dropbox.yml`, `herramientas/conectar-dropbox.html` (o la ruta publicada),
`docs/CONECTAR-DROPBOX.md`, una prueba en `pruebas/`.

Cambios de una o pocas líneas: `js/cargar-biblioteca.js`, `js/formularios.js`,
`js/formularios-rellenar.js`, `js/plantillas-documento.js`, `js/registro-lector.js`,
`js/preparar-documento.js`, `js/pdf-separar-unir.js`, `js/version.js` (o donde se pinte la
versión), `index.html` (añadir `js/cargar-fichero.js` antes de quien lo use), `package.json`,
`.gitignore`.

## Cómo trabajar

- **No leas el repositorio entero.** Solo los ficheros de la lista y `docs/CONTEXTO.md`.
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- Sube a `main` según las reglas de `docs/COLA.md` (como máximo dos o tres subidas en la fila).
- **Una sola tanda de pruebas al final:**
  - `npm test` en verde.
  - Generar la copia y abrir `copia-local/index.html` con Playwright por `file://`: la
    aplicación arranca sin errores en consola, la biblioteca carga, la lista de formularios sale,
    un PDF de `formularios/` se abre en el lector y un `.docx` de `plantillas/` se lee. Se lee
    «copia sin internet» junto a la versión.
  - La versión web (`http://`) sigue cargando todo igual.
- Al terminar: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (sustituyendo, no
  añadiendo) y una entrada en `docs/HISTORIA.md`.
- Mensaje final a Francisco: dos o tres frases, y el enlace a `docs/CONECTAR-DROPBOX.md`.
