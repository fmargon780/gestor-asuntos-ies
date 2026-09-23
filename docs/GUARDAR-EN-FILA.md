# Fila 99 — Guardar en fila y sin trabajo de más

Acordado con Francisco el 23-sep-2026. Es la primera de tres (99, 100 y 101) que salen de una
revisión a fondo de cómo guarda y repinta la aplicación.

## El problema, con sus palabras

> Al llevar a cabo las acciones comunes, al "grabar" nos suelen salir un mensaje de error o se
> queda la vista como congelada. Al salir y entrar normalmente ha hecho lo que le decíamos, pero
> ya tenemos la inseguridad. Está siendo el gran problema.

Los datos llegan al disco. Esta fila hace que cada guardado sea **más corto, de uno en uno y sin
estorbos**. Las filas 100 (avisos) y 101 (repintado) van después: no las mezcles aquí.

## Reglas de trabajo

- Sube directamente a `main`, sin abrir ninguna pull request.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- No leas el repositorio entero: solo los ficheros de la lista de abajo y lo que ellos llamen.
- Si un fichero que toques a fondo pasa de unas 400 líneas, pártelo en dos.
- Una sola prueba al final (`npm test` más la prueba nueva), no una después de cada cambio.

## Qué hay que hacer

### 1. La copia del día se hace en cada guardado (error)

`js/copias.js:129` comprueba si ya existe la copia de hoy con `Carpetas.existe`, que busca una
**carpeta** (`js/carpetas.js:92`). Con un fichero siempre devuelve «no existe». Resultado: cada
guardado relee el fichero, reescribe la copia y lista `_GESTOR/copias` entera (`podar`).
Usa `Carpetas.existeFichero`. Además, la «copia de hoy» debe ser la del **primer** guardado del
día (lo de antes de tocar), no la penúltima versión.

### 2. Una fila de espera por fichero

No hay nada que ponga los guardados en orden (`js/nucleo.js:449-453`, `js/hitos.js:177-184`).
Dos guardados a la vez leen el disco antes de que escriba el otro, y gana el último: se pierde
una nota o un estado. Caso real: escribir una nota (`onblur` en `js/notas.js:398`) y pulsar
enseguida el desplegable de estado.

- Una cola en memoria **por fichero** (una cadena de promesas), en un único sitio que usen
  `App.guardarRegistroFresco`, `Hitos.cambiar` y cualquier otro «leer-cambiar-escribir» de
  `_GESTOR` (presencia aparte, que es su propio fichero).
- Cada guardado muta una copia leída en una variable local, y solo al terminar la escritura se
  pone en `App.E.registro`.
- `js/conflictos.js` (fusión de copias en conflicto, enganchada a `alRefrescar`,
  `conflictos.js:335-345`) también pasa por esa cola, y no cambia `App.E.registro` a mitad de
  otra acción.

### 3. Reintentar también al leer

`js/carpetas.js:411-427` (`leerTexto`) no reintenta nunca. Un `NotReadableError` (Dropbox está
tocando el fichero recién escrito) tumba el segundo paso de las acciones encadenadas. Pasa las
lecturas por `Reintentar` (`js/reintentar-escritura.js`) y añade a los errores pasajeros
`NotReadableError` y `AbortError`, en lectura y escritura.

### 4. Parar las tareas de segundo plano mientras se guarda

- Presencia: lee cada 10 s y escribe cada 30 s (`js/presencia.js:168, 267`), sin evitar que
  se solapen sus propias pasadas.
- Vistazo a la carpeta: cada 20 s y al volver a la ventana (`js/documentos-sueltos.js:392-394`).
  Durante un archivado ve desaparecer la carpeta antes de que se marque `recienArchivados`
  (`js/asuntos-archivar.js:150`), pinta en rojo «ya no está en Asuntos abiertos» y saca de la
  ficha (`js/ficha-asunto.js:156-160`).

Un contador global «hay un guardado en marcha» (lo lleva la cola del punto 2 y los traslados de
carpeta). Mientras sea mayor que cero, las tareas de fondo se saltan su pasada. Y
`recienArchivados` se marca **antes** de mover la carpeta.

### 5. Tres riesgos de perder datos

1. **Registro vacío por una lectura fallida.** `leerTexto` devuelve «no hay nada» ante un
   `NotFoundError` (`carpetas.js:424`); `cargarRegistro` se queda con `{asuntos:{}}`
   (`nucleo.js:437`) y el siguiente `anotar` escribe un registro con un solo asunto. Igual con
   `Hitos.leer`. Si la lectura llega vacía y en memoria había datos, **no se escribe**: se
   reintenta y, si sigue vacía, error claro sin tocar el disco.
2. **Las copias en conflicto de Dropbox se pierden al archivar o renombrar.** El filtro de
   `js/carpetas.js:88` y `:145` no copia los ficheros «(conflicted copy)», pero el borrado del
   original sí se los lleva. Ese filtro es solo para carpetas temporales, no para ficheros.
3. **La fusión de conflictos borra lo que no es `asuntos`.** `conflictos.fusionarAsuntos`
   monta el fichero solo con `asuntos` (`conflictos.js:93`) y pierde `ajustesAvisos` y
   cualquier otro dato de primer nivel. Partir de una copia entera del fichero real.

### 6. Escribir más ligero

`js/carpetas.js:482` guarda con sangría (`JSON.stringify(..., null, 2)`). Guarda sin sangría
los ficheros grandes (`asuntos.json`, `hitos.json`). La lectura no cambia.

## Ficheros que hay que tocar

`js/copias.js`, `js/carpetas.js`, `js/reintentar-escritura.js`, `js/nucleo.js`, `js/hitos.js`,
`js/conflictos.js`, `js/presencia.js`, `js/documentos-sueltos.js`, `js/asuntos-archivar.js`.
Una prueba nueva en `pruebas/` (por ejemplo `pruebas/guardar-en-fila.mjs`).

## Cómo se comprueba

Una sola prueba que cubra, con el disco simulado de las demás pruebas:

- Diez guardados del mismo día escriben **una** copia en `copias/`, con el contenido de antes
  del primero.
- Dos `App.anotar` lanzados a la vez sobre campos distintos dejan **los dos** cambios.
- Una lectura que falla una vez con `NotReadableError` sale bien al reintentar.
- Una lectura vacía con registro en memoria no escribe nada.
- Archivar una carpeta con un fichero «(conflicted copy)» lo conserva en el destino.

## Al terminar

- Regla nueva en `docs/CONTEXTO-CORTO.md`, sección 6, sustituyendo la de `App.anotar`: todo
  guardado de `_GESTOR` pasa por la cola por fichero; ninguna tarea de fondo escribe mientras
  hay un guardado en marcha.
- El cómo, en el hijo de `docs/contexto/` que toque. La causa, en `docs/HISTORIA.md`.
