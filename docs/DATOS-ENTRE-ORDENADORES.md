# Los datos no se pisan entre ordenadores (fila 176)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Primera parte de la «tanda de estabilidad»
del análisis `claude/Analisis-estabilidad-crecimiento-2026-09-26.md` (proyecto de Claude; sus
hallazgos están resumidos aquí, no hace falta leerlo).

Idea de fondo: dos ordenadores escriben los mismos ficheros de `_GESTOR` a través de Dropbox. El
guardado en fila y el «releer antes de escribir» ya protegen casi todo. Quedan cuatro huecos por los
que se pierde un dato cuando los dos tocan lo mismo casi a la vez, y uno por el que un asunto
archivado vuelve a aparecer. **Nada de esto cambia lo que se ve en pantalla.**

## Ficheros que se tocan

- `js/nucleo.js` (puntos 1 y 2: `App.anotar`, `App.guardarRegistroFresco`, `App.fusionarConDisco`)
- `js/notas.js`, `js/correo-cuadro.js`, `js/bandeja-huella.js`, `js/relacionados.js`,
  `js/registro.js`, `js/documentos-guardar.js` (punto 1: los que hoy mandan una lista entera)
- `js/borrados-fusion.js`, `js/ficha-archivo.js`, `js/asunto-renombrar.js`, `js/papelera.js`,
  `js/unir-asuntos.js`, `js/asuntos-archivar.js` (punto 2: lápidas de asunto)
- `js/conflictos.js` (puntos 2 y 5)
- `js/documentos-sueltos.js` (punto 3: el vistazo de 20 segundos)
- `js/hitos.js` (punto 3: releer `hitos.json`)
- `js/guias-enganche.js` (punto 4)
- `js/presencia.js` (punto 5)
- `docs/contexto/ASUNTOS.md`, `docs/contexto/PANTALLA.md`, `docs/CONTEXTO.md` (tabla de `_GESTOR`)
- Una prueba nueva en `pruebas/` (sin navegador, con el disco de mentira)

No leas el repositorio entero. Cambios quirúrgicos. `js/nucleo.js` (529 líneas), `js/notas.js`
(486) y `js/conflictos.js` (593) pasan de 400: si hay que tocarlos más que unas líneas, se parten
por temas antes, según `docs/PARTIR-FICHEROS-GRANDES.md`.

## Qué hay que hacer

### 1. Las listas de la ficha se funden elemento a elemento, no se sustituyen

Hoy `App.anotar` hace `Object.assign(fichaDelDisco, datos)`: campo a campo. Si un campo es una
lista (`hilos`, `relacionados`, `pendientesRegistro`, `notas`), la lista que manda la memoria
**sustituye** a la del disco, y lo que el otro ordenador añadió en ese minuto desaparece.

- Nueva función en `js/nucleo.js`: `App.anotarLista(clave, campo, { anadir, quitar, identidad })`.
  Trabaja **dentro** de `guardarRegistroFresco` (en la cola, sobre la ficha releída del disco): a la
  lista del disco le suma `anadir` (sin repetir, según `identidad`) y le quita `quitar`. `identidad`
  es la función que dice cuándo dos elementos son el mismo; por defecto, para `notas`,
  `cuando + texto`; para `hilos`, el id del hilo; para `relacionados`, categoría + nombre; para
  `pendientesRegistro`, el nombre de fichero. Reutiliza la lógica de `fusionarFicha` de
  `js/conflictos.js` en vez de duplicarla: sácala a una función común si hace falta.
- Los seis ficheros que hoy mandan la lista entera pasan a llamar a `anotarLista` con solo lo que
  cambia (añadir uno, quitar uno). Búscalos con `grep -n "hilos\|relacionados\|pendientesRegistro"`
  en esos ficheros: `correo-cuadro.js` (~582), `bandeja-huella.js` (~175), `relacionados.js` (~138 y
  ~353), `registro.js` (~215), `documentos-guardar.js` (~71), `notas.js` (~154).
- `js/notas.js` relee la ficha (~132) **fuera** de la cola y luego escribe en la cola: la lectura
  pasa dentro (`anotarLista` ya lo hace).
- **Quitar sigue funcionando**: quitar un relacionado, desenganchar un hilo o marcar un documento
  como registrado (sale de `pendientesRegistro`) pasan por `quitar`, no por «mandar la lista sin
  él».

### 2. Lápidas de asunto: un archivado o borrado no resucita

Hoy, al archivar, la clave se borra de `asuntos.json`. Si el otro ordenador anota algo en ese
asunto antes de enterarse, `App.anotar` lo vuelve a crear vacío; y la fusión de copias en conflicto
(`js/conflictos.js`, `(a || b)`) conserva cualquier asunto que esté solo en un lado.

- `_GESTOR/borrados-listas.json` gana la lista `asuntos: [{ clave, borradoEl, motivo }]`, con
  `motivo` = `archivado`, `papelera` o `unido`. La escriben, **en la misma operación de la cola que
  borra la clave**, `ficha-archivo.js` (archivar), `papelera.js` (a la papelera), `unir-asuntos.js`
  (unir) y `asunto-renombrar.js` (la clave vieja al renombrar). Reabrir, devolver de la papelera o
  enlazar una ficha huérfana **quita** la lápida (un alta explícita gana, como con los tipos).
- `App.anotar` / `anotarLista` sobre una clave con lápida **no crea nada**: lanza un error con
  nombre (`AsuntoCerrado`) que el llamador enseña con `U.fallo('Este asunto ya está archivado en el
  otro ordenador. Recarga la lista.')`.
- La fusión de copias en conflicto de `asuntos.json` e `hitos.json` respeta las lápidas: una clave
  con lápida no entra en la fusión, esté en el lado que esté.
- `App.fusionarConDisco` también las respeta.
- Las lápidas caducan a los 90 días, con la misma limpieza de Mantenimiento que ya tienen las
  demás listas de `borrados-listas.json`.

### 3. El vistazo de 20 segundos relee lo que el otro ordenador ha cambiado

Hoy `App.E.registro` (la ficha de cada asunto) solo se relee al entrar y en cada guardado propio; el
vistazo de `App.mirarLaCarpeta` mira las carpetas, no los ficheros. En una sesión larga se ve un
estado viejo y se decide con él.

- En cada pasada de `mirarLaCarpeta`, mirar la fecha de modificación (`getFile().lastModified`) de
  `asuntos.json` y de `hitos.json`. Si alguna cambió desde la última lectura **y** no hay guardado en
  marcha (`ColaGuardado.hayGuardado()`), releer ese fichero (`App.cargarRegistro`, y el equivalente
  de `Hitos`), reenganchar las fichas a las tarjetas (`App.refrescarFichas`) y
  repintar **solo** lo que está a la vista, envuelto en `U.conservandoLoEscrito`. La regla de
  `LecturaVacia` sigue valiendo: un fichero vacío no sustituye a uno con datos.
- La fecha leída se guarda en memoria para comparar la próxima vez. Un guardado propio la actualiza
  (si no, se releería lo que uno mismo acaba de escribir).

### 4. La guía relee antes de escribir

`js/guias-enganche.js` (~45-49) escribe el objeto `guias` que cargó al **abrir** el editor. Es el
único fichero de Ajustes que no relee justo antes. Si los dos editan guías de tipos distintos en la
misma tarde, el segundo borra la del primero, sin conflicto de Dropbox de por medio.

- Al guardar: releer `guias.json`, sustituir **solo el tipo que se estaba editando**, escribir. En la
  cola (`ColaGuardado.poner('guias.json', …)`), como hace `campos.json`.

### 5. Presencia por usuario, y conflictos que nadie recogía

`presencia.json` lo escriben los dos ordenadores cada 30 segundos y no pasa por el buscador de
conflictos: Dropbox va dejando «presencia (copia en conflicto…)» que nadie limpia.

- La presencia pasa a **un fichero por usuario**: `_GESTOR/presencia/<nombre normalizado>.json`,
  con `{ <clave del asunto>: { ultima } }`. Cada ordenador solo escribe el suyo: se acaban sus
  conflictos. Leer la presencia es listar la subcarpeta y leer cada fichero (con la misma caché de
  10 segundos de hoy). El nombre normalizado sale de la misma reducción que usa `U.parecidos` (sin tildes,
  espacios ni mayúsculas). `presencia.json` viejo se borra al entrar si existe, junto con sus copias en
  conflicto.
- `Conflictos.revisar` recoge también las copias en conflicto de los ficheros que hoy ignora
  (`plantillas.json`, `envios.json`, `rutas.json`, `margenes-pdf.json`, y cualquiera de `_GESTOR`
  que no esté en `Copias.FICHEROS`): los trata como los no fusionables (bloque «Conflictos de
  Dropbox» de Ajustes, con los dos botones), guardando ambos en `_GESTOR/copias` antes. Las de
  `presencia/` se borran sin preguntar.

## Lo que no se hace

- No se cambia el formato de `asuntos.json` ni de `hitos.json` (solo se añade una lista a
  `borrados-listas.json` y una subcarpeta `presencia/`).
- No se toca nada de pantalla: ningún texto, botón ni pantalla cambia.
- No se paginan listas ni se empaquetan scripts (queda para cuando haga falta, ver el análisis).

## Prueba

Una prueba nueva sin navegador, con el disco de mentira de `pruebas/`, que compruebe al menos:

1. Dos `anotarLista` seguidos sobre `hilos` del mismo asunto, cada uno con una ficha en memoria
   distinta, dejan **los dos** hilos en el disco; y `quitar` quita solo el suyo.
2. Un asunto archivado (clave borrada + lápida) no reaparece ni con `anotar` (error `AsuntoCerrado`)
   ni al fusionar una copia en conflicto que aún lo tenía. Reabrir quita la lápida.
3. Un `asuntos.json` cambiado por fuera (fecha nueva) se relee en la siguiente pasada del vistazo y
   no se relee si hay un guardado en marcha.
4. Guardar la guía del tipo B no borra la del tipo A escrita por fuera entre abrir y guardar.
5. Con `presencia/ana.json` y `presencia/luis.json`, la ficha de Luis sale «en consulta» para Ana.

Ejecutar `npm test` completo al final, una sola vez.

## Al terminar

Actualizar `docs/CONTEXTO.md` (tabla de `_GESTOR`: `borrados-listas.json` con `asuntos`,
`presencia/` en vez de `presencia.json`), `docs/contexto/ASUNTOS.md` (`anotarLista`, lápidas),
`docs/contexto/PANTALLA.md` (presencia, vistazo) y `docs/CONTEXTO-CORTO.md` sección 6 (una línea:
las listas de la ficha se funden por elemento; un asunto cerrado lleva lápida). Una línea en
`docs/HISTORIA.md`. Sube directamente a `main`, sin pull request, en como mucho dos subidas.
