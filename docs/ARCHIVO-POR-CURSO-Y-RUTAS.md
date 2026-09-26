# El índice del archivo, por curso; y el largo de la ruta completa (fila 177)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Segunda parte de la «tanda de estabilidad»
(`claude/Analisis-estabilidad-crecimiento-2026-09-26.md`, en el proyecto de Claude). **Va después de
la fila 176.**

Idea de fondo: hoy hay unos 50 asuntos abiertos y más de 200 archivados en cuatro días. Los abiertos
se quedan pocos; **lo que crece es el archivo**, a un ritmo de varios miles por curso. El índice del
archivo (`_GESTOR/indice-archivo.json`) se lee entero al entrar en Archivo y se reescribe entero
cada vez que se archiva algo: con 5.000 asuntos pesará unos 10 MB. Hay que partirlo por curso antes
de que pese. Y los topes de largo de nombre miran solo el nombre, no la ruta: en Windows, una ruta
de más de 260 caracteres deja de sincronizarse sin aviso.

## Ficheros que se tocan

- `js/archivo-indice.js` (punto 1; tiene 435 líneas: se parte en dos antes de tocarlo, por ejemplo
  `archivo-indice.js` —leer, guardar, añadir, quitar— y `archivo-indice-construir.js` —recorrer el
  disco y reconstruir—)
- `js/archivo-personas.js` (punto 1: selector de curso en la pantalla Archivo)
- Los que leen o escriben el índice **solo a través de `IndiceArchivo`** (no cambian de API salvo
  el parámetro nuevo de `leerDisco`): `js/ficha-archivo.js`, `js/papelera.js`, `js/papelera-devolver.js`,
  `js/indice-expediente.js`, `js/fichas-huerfanas.js`, `js/documentos-sueltos-sugerencias.js`,
  `js/cuentas.js`, `js/repartir-crear.js`, `js/relacionados-archivar.js`, `js/asuntos-archivar.js`
- `js/nombres.js` (punto 2; 517 líneas: se parte antes, sacando el cálculo de topes a
  `js/nombres-topes.js`)
- Los que llaman a los topes: `grep -n "TOPE_ASUNTO\|TOPE_DOCUMENTO\|recortar" js/*.js`
- `js/copiar-ruta.js` (punto 2: de ahí sale dónde están las carpetas dentro de Dropbox)
- `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/contexto/DOCUMENTOS.md`, `docs/CONTEXTO.md` (tabla de
  `_GESTOR`)
- Una prueba nueva en `pruebas/` (sin navegador)

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Un índice por curso académico

- El índice pasa a vivir en la subcarpeta `_GESTOR/indice-archivo/`, **un fichero por curso**:
  `2025-26.json`, `2026-27.json`… con la misma estructura de hoy (`version`, `hechoEl`,
  `hechoPor`, `recuento`, `asuntos`). El curso de un asunto sale de la fecha de su carpeta
  (`AAMMDD`): del 1 de septiembre al 31 de agosto. Sin fecha reconocible, al curso actual.
- `indice-archivo.json` (el de la raíz) se queda como **resumen pequeño**: `{ version, hechoEl,
  cursos: ['2026-27', '2025-26', …], recuento }`. Es lo único que se lee al entrar.
- `IndiceArchivo.leerDisco()` sin parámetros devuelve **solo el curso actual**;
  `leerDisco({ curso: '2025-26' })` uno concreto; `leerDisco({ todos: true })` los une todos (para
  Cuentas, fichas huérfanas, las sugerencias de «Por clasificar» y los duplicados, que necesitan
  verlo todo; que cada uno de esos llamadores pida `todos: true` a propósito).
- `anadirEntrada` y `quitarEntrada` escriben **solo el fichero del curso** que toca (y actualizan
  el recuento del resumen). Archivar deja de reescribir miles de entradas.
- «Reconstruir el índice» reconstruye todos los cursos, un fichero por curso, y el resumen.
- **Migración sin manos**: al entrar, si existe el `indice-archivo.json` antiguo con `asuntos`
  dentro, se parte en cursos, se escribe la nueva estructura y el viejo se aparta a `_GESTOR/copias/`
  como `indice-archivo-antiguo-AAMMDD.json`. Si el otro ordenador aún lleva la app vieja y vuelve a
  escribir el formato antiguo, la próxima entrada lo vuelve a partir: no se pierde nada porque el
  índice siempre se puede reconstruir.
- Pantalla Archivo (`js/archivo-personas.js`): un desplegable **«Curso: 2026-27 ▾»** junto al
  buscador, con los cursos del resumen y una última opción «Todos los cursos». Por defecto, el
  curso actual. El buscador busca en el curso elegido; con «Todos», carga los demás al momento
  (con el «Leyendo el archivo…» de siempre mientras tanto). La ficha de una persona («Sus asuntos»,
  fila 175) sigue enseñando **todos** sus archivados: ahí se pide `todos: true`.
- El índice sigue **fuera de los dieciocho** (sin copia de seguridad, papelera ni fusión de
  conflictos), por la misma razón de hoy: se reconstruye entero cuando haga falta. La subcarpeta
  `indice-archivo/` se salta en `Conflictos.revisar` igual que se salta el fichero de hoy.

### 2. El tope de largo cuenta la ruta completa

Hoy `TOPE_ASUNTO = 150` y `TOPE_DOCUMENTO = 120` (`js/nombres.js`) miran solo el nombre. La ruta
real de un documento archivado es
`<Dropbox>/<ruta de ARCHIVO>/<CATEGORÍA>/<tercero>/<asunto>/Versiones previas/<documento>.pdf`,
y puede pasar de 260.

- Nueva función `Nombres.topes()` (en `js/nombres-topes.js`) que calcula cuánto hueco queda para
  el nombre del asunto y para el del documento a partir de: la parte de dentro de Dropbox de las
  dos carpetas (`_GESTOR/rutas.json`, `js/copiar-ruta.js`; la de **ARCHIVO** es la que manda,
  porque es la más larga), la categoría más larga (`Nombres.CATEGORIAS`), el nombre del tercero
  (se pasa como parámetro; si no se conoce aún, el más largo de la lista de esa categoría), la
  subcarpeta `Versiones previas/` y una raíz de Dropbox de **45 caracteres** por defecto
  (`C:\Users\<nombre>\Dropbox\` con un nombre de usuario de Windows largo); si `localStorage`
  `gestor-ruta-dropbox` de este ordenador es más largo, se usa ese. Tope total: **240**, para dejar
  margen.
- Los topes resultantes sustituyen a los fijos en los sitios que hoy usan `TOPE_ASUNTO` y
  `TOPE_DOCUMENTO` (crear asunto, editar asunto, poner nombre a un documento, aspirante que gana
  su número escolar). Sin `rutas.json` (aún no señalado), se usan los fijos de hoy.
- **Qué se recorta y en qué orden**, igual que hoy pero con el tope nuevo: primero el texto libre,
  después los campos del tipo, nunca la fecha, el tipo ni el tercero. Si aun así no cabe, se avisa
  en rojo antes de crear («El nombre no cabe en la ruta de Dropbox: acorta el texto») y no se crea.
- Un aviso ámbar en Ajustes › Mantenimiento, bajo «Poner en orden las fichas del ARCHIVO»: **«N
  carpetas o documentos del archivo pasan del tope de ruta»**, calculado con el índice (que ya
  tiene `ruta` y `documentos`). Solo avisa; no renombra nada solo.

## Lo que no se hace

- No se cambia la estructura de carpetas del ARCHIVO ni el nombre de ninguna carpeta existente.
- No se pagina la lista de Archivo (ya corta a 300) ni la de abiertos.
- No se toca `asuntos.json` ni `hitos.json`.

## Prueba

Una prueba nueva sin navegador:

1. Un `indice-archivo.json` antiguo con asuntos de dos cursos se parte en `indice-archivo/2025-26.json`
   y `2026-27.json` y un resumen; el viejo queda en `copias/`. `leerDisco()` devuelve solo el curso
   actual; `leerDisco({ todos: true })`, los dos.
2. `anadirEntrada` de un asunto de septiembre de 2026 solo reescribe `2026-27.json`.
3. `Nombres.topes()` con una ruta de ARCHIVO larga y un tercero largo devuelve topes menores que los
   fijos, y el nombre de asunto propuesto los respeta recortando el texto libre.

`npm test` completo al final, una sola vez.

## Al terminar

Actualizar `docs/CONTEXTO.md` (tabla de `_GESTOR`: `indice-archivo/` y el resumen),
`docs/contexto/ASUNTOS-ARCHIVO.md` (índice por curso, selector), `docs/contexto/DOCUMENTOS.md`
(topes por ruta) y `docs/CONTEXTO-CORTO.md` (sección 5: «índice del ARCHIVO por curso»; sección 4:
el tope cuenta la ruta). Una línea en `docs/HISTORIA.md`. Sube directamente a `main`, sin pull
request, en como mucho dos subidas.
