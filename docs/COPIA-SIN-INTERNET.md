# Copia de la aplicación que funciona sin internet

Decidido con Francisco el 21-sep-2026. Diseño cerrado por él (segunda versión, sin Dropbox API
ni contraseñas: la primera pedía la contraseña del Dropbox del centro y se descartó).

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

- **La primera vez**, en un ordenador del instituto, guarda un único fichero,
  **`ABRIR EL GESTOR.html`**, en una carpeta del Dropbox del centro (por ejemplo
  `Gestor de Asuntos - aplicación`), y lo abre con doble clic. Ese fichero le pide señalar esa
  misma carpeta, descarga el resto de la aplicación desde GitHub, lo guarda allí y arranca.
  Después señala las carpetas de trabajo como siempre (es otra "dirección" para Chrome).
- **Cada vez que la abre**, la copia mira si hay versión nueva. Si la hay, se descarga, se guarda
  en su carpeta y se recarga sola. Si no hay internet o falla la descarga, arranca con la que tiene.
- **El otro ordenador** recibe la actualización por Dropbox, sin hacer nada.
- En la cabecera, junto a la versión, se lee **«copia sin internet»**, para saber cuál está usando.
- La versión web (asuntos.fmargon.com) sigue igual. Las dos trabajan sobre los mismos datos.
- Los correos no cambian: el script de Gmail corre en Google y deja los correos en su carpeta; la
  copia la lee igual. Los enlaces a `mail.google.com` funcionan (Gmail no está bloqueado).
- **Nadie de dirección interviene y no hace falta ninguna contraseña de Dropbox.** Es una
  condición de Francisco: no se puede pedir la contraseña del Dropbox del centro.

Comprobado por Francisco el 21-sep-2026 desde el ordenador del instituto: `github.com` y
`raw.githubusercontent.com` se abren.

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
- `ABRIR EL GESTOR.html`: el instalador y actualizador del punto 4, que al final abre
  `index.html`.
- `version.json` con la versión y el sha256 de cada fichero (punto 3).
- Que no se copie `docs/`, `pruebas/`, `herramientas/`, `scripts/` ni `apps-script/`.

La etiqueta **«copia sin internet»** junto a la versión la pone `js/version.js` (o donde se pinte
`App.VERSION`) cuando `location.protocol === 'file:'`.

Enlace a `normativa-escolarizacion.vercel.app`: se queda como está. En el instituto no abrirá, y
eso no se arregla aquí.

### 3. Publicar la copia en un repositorio público

La copia se descarga desde `raw.githubusercontent.com`, que responde con CORS abierto (se puede
leer con `fetch` desde una página `file://`). El repositorio `gestor-asuntos-ies` es privado y así
se queda (en `docs/` hay notas internas). Se crea **otro repositorio, público**,
`fmargon780/gestor-asuntos-copia`, que solo contiene la salida de `scripts/copia-local.mjs`, más:

- `version.json`: `{ "version": "<App.VERSION>", "ficheros": { "<ruta>": "<sha256>", … } }`.
- Un `README.md` de dos líneas: qué es y que no contiene datos.

**Antes de publicar nada, comprobar que la copia no lleva datos personales** (ni DNI, ni nombres
de alumnado o personal, ni direcciones de correo reales salvo las del centro). El 21-sep-2026 se
revisó el repositorio y no los hay: `datos/`, `datos-biblioteca/`, `plantillas/` y `formularios/`
son impresos y catálogos. La firma del correo con el nombre de Francisco y del centro sí va: se
acepta.

Cómo llega la copia al repositorio público, en este orden de preferencia:

1. **Una acción de GitHub** (`.github/workflows/copia-publica.yml`) en el repositorio privado: en
   cada `push` a `main` que toque algo fuera de `docs/`, ejecuta `npm ci`,
   `node scripts/copia-local.mjs` y sube el resultado al público (un solo commit, solo si algo
   cambió). Necesita un token con permiso de escritura **solo** en `gestor-asuntos-copia`
   (token de grano fino), guardado como secreto `COPIA_TOKEN`. Si el secreto no existe, termina
   en verde con el aviso «falta la clave de la copia pública». No gasta publicaciones de Vercel.
2. Si la sesión no puede crear el repositorio público o subir a `.github/workflows/` (en
   ERP-Nutricion dio 403 desde una sesión en la nube): dejarlo todo preparado, el `.yml` escrito
   en `docs/copia-publica.yml.txt`, y marcar la fila BLOQUEADA con el motivo en una línea.

**Los pasos de Francisco para el token**: escribir `docs/CLAVE-COPIA-PUBLICA.md`, en castellano
llano, un paso por línea, como mucho seis pasos, con los enlaces directos
(`https://github.com/settings/personal-access-tokens/new` y
`https://github.com/fmargon780/gestor-asuntos-ies/settings/secrets/actions/new`). Se puede hacer
desde el ordenador del instituto: GitHub se abre allí. Si la sesión de Claude Code puede subir al
repositorio público por sí misma y dejar la acción funcionando sin token, mejor: entonces este
documento no hace falta y se dice en el mensaje final.

### 4. La copia se instala y se actualiza sola

Todo en `ABRIR EL GESTOR.html` (autónomo, sin depender de otros ficheros de la copia) más un
módulo pequeño `js/actualizar-copia.js` que solo actúa si `location.protocol === 'file:'`:

- **Instalar** (la carpeta de la aplicación está vacía o no tiene `index.html`): pide con
  `showDirectoryPicker({ mode: 'readwrite' })` la carpeta **donde está el propio fichero**
  (explicarlo en una línea en pantalla), guarda el identificador en IndexedDB, descarga
  `version.json` y todos los ficheros de `raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/…`
  (con `cache: 'no-store'`), los guarda y abre `index.html`. Barra de progreso sencilla (son
  unos 10 MB por los formularios).
- **Actualizar** (al abrir): compara `version.json` remoto con el local. Si cambió, descarga
  **solo los ficheros cuyo sha256 sea distinto**, comprueba cada sha256, y solo si todos están
  bien los escribe; `version.json` se escribe el último, así un corte a medias se reintenta la
  siguiente vez. Luego `location.reload()`. Borra los ficheros que ya no estén en la lista.
- Si Chrome pide otra vez el permiso de la carpeta, un aviso ámbar con un botón, como ya se hace
  con las carpetas de trabajo. Si el usuario no lo da, se arranca con la versión que hay.
- Sin internet, con `raw.githubusercontent.com` caído o con cualquier error: arranca con la
  versión que hay, y un aviso discreto de una línea «no se ha podido comprobar si hay versión
  nueva». Nunca deja la aplicación sin arrancar.
- Dos ordenadores a la vez: si otro ya actualizó (el `version.json` local, que llega por Dropbox,
  ya es el nuevo), no se descarga nada. No hace falta nada más fino.
- Para la primera vez, `docs/INSTALAR-COPIA.md`: tres o cuatro pasos para guardar
  `ABRIR EL GESTOR.html` en la carpeta (desde su dirección en `raw.githubusercontent.com`, con
  clic derecho → Guardar como) y abrirlo.

## Ficheros a tocar

Nuevos: `js/cargar-fichero.js`, `js/actualizar-copia.js`, `scripts/copia-local.mjs`,
`.github/workflows/copia-publica.yml`, `docs/CLAVE-COPIA-PUBLICA.md`, `docs/INSTALAR-COPIA.md`,
una prueba en `pruebas/`. Y el repositorio público `fmargon780/gestor-asuntos-copia`.

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
  - La actualización: con un `version.json` local viejo y un servidor de pruebas local que imite
    a `raw.githubusercontent.com`, la copia descarga solo lo cambiado y se recarga; con el
    servidor apagado, arranca igual con el aviso.
  - La versión web (`http://`) sigue cargando todo igual.
- Al terminar: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (sustituyendo, no
  añadiendo) y una entrada en `docs/HISTORIA.md`.
- Mensaje final a Francisco: dos o tres frases, y los enlaces a `docs/INSTALAR-COPIA.md` y, si
  hace falta, a `docs/CLAVE-COPIA-PUBLICA.md`.
