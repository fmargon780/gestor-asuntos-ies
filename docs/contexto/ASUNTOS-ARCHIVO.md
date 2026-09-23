# Papelera, archivar, atascos, índice del ARCHIVO y fichas huérfanas

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026),
partido a su vez de `docs/contexto/ASUNTOS.md` en la fila 78 (por pasar de los 40 KB). Actualízalo
al tocar la papelera, archivar/reabrir, el índice del ARCHIVO o las fichas sin carpeta. Crear,
editar, la ficha de un asunto abierto y los duplicados están en `docs/contexto/ASUNTOS.md`. El
índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el
propio `docs/CONTEXTO.md`.

---

### La papelera

Nada se borra de verdad a la primera: se manda a una papelera compartida, de la que se puede
devolver a su sitio.

- **Dónde hay botón Borrar, y dónde no**: documento dentro de un asunto (ficha y "Gestionar
  documentos"), documento suelto, un asunto **abierto** desde su ficha (nunca desde la tarjeta,
  ni en el ARCHIVO), tipo de asunto, estado, tipo de documento, campo propio, y persona o
  empresa dada de alta a mano (nunca la que viene de Séneca). Botón siempre "Borrar"
  (`.boton-peligro`), el último de su fila.
- **La papelera**: carpeta `_GESTOR/PAPELERA` + índice `_GESTOR/papelera.json` (la más nueva
  arriba). Un fichero o carpeta se mueve a su propia subcarpeta `AAMMDD-HHMM <nombre>`, con
  `Carpetas.trasladar` / `Carpetas.moverFichero` (si la copia no sale completa, no se borra
  nada). Lo que no es fichero (tipo, estado, persona, nota…) no tiene carpeta: su dato se guarda
  entero en la ficha del índice. `papelera.json` se relee antes de escribir y entra en las
  copias de seguridad.
- **Comprobaciones antes de borrar**: un tipo de asunto no se borra si hay asuntos con ese tipo
  (se dice cuántos), y si tiene guía se avisa de que se va con él (se guarda en la papelera para
  poder devolverla junto con el tipo). Un estado no se borra si algún asunto lo tiene puesto. Un
  campo propio no se borra si está asociado a algún tipo (se dice a cuáles). Un tipo de
  documento se borra siempre. Una persona o empresa no se borra si tiene asuntos (se mira con
  `Duplicados.delTercero`), y solo si se dio de alta a mano.
- **Confirmación**: un solo cuadro, "¿Mandar a la papelera?", con el nombre en negrita. Un
  asunto abierto con documentos lleva un segundo cuadro "¿Seguro?" después del primero (nunca
  los dos a la vez).
- **Bloque Papelera de Ajustes** (el último): qué era, nombre, de dónde salía, quién y cuándo
  ("hace N días"), y botones **Devolver a su sitio** / **Borrar del todo** (con su propia
  confirmación). Aviso ámbar si algo lleva más de 30 días, con botón para borrarlo todo de
  golpe. **La papelera no se vacía sola, nunca**: es una decisión de Francisco (fila 68,
  docs/AVISOS-QUE-FALTAN.md, 3), preguntada y todavía sin decidir; mientras tanto solo se ha
  hecho el aviso más insistente, nunca el borrado solo.
- **El mismo aviso, también en "Asuntos abiertos"** (19-sep-2026, fila 68, 3): antes solo se veía
  entrando a propósito en Ajustes. `js/avisos-que-faltan.js` pinta una línea junto a
  `#panel-avisos`/`#panel-frescura` con cuántas cosas son y cuánto ocupan de verdad en disco
  (`Papelera.tamanoDeViejas`, que solo se llama aquí, nunca al pintar la lista entera de la
  papelera). Sin botón para quitarlo sin decidir: lleva a Ajustes → Mantenimiento, al mismo
  bloque de siempre. Se repinta al envolver `App.verAbiertos` (no en cada tecla del buscador,
  que llama a `window.Gestor.alRefrescar` mucho más a menudo y esto cuesta disco).
- **Devolver a su sitio**: si el asunto de un documento ya no existe, se ofrece "Por
  clasificar". Si ya hay algo con ese nombre en el destino, no se pisa nada.
- **El rastro**: al mandar/devolver un documento desde un asunto, se anota una nota
  (`Notas.anadir`). Un asunto entero no tiene dónde apuntarlo: el rastro es la ficha de
  `papelera.json`.
- Vive en `js/papelera.js` (`window.Papelera`), cargado tras `js/dni.js` y antes de
  `js/inicio.js`. Documento suelto y persona dada de alta a mano lo llevan por envoltura
  (`App.tarjetaSuelto`, `App.verFicha`); donde el botón va dentro de una función privada, se ha
  tocado el fichero directamente.

Se comprueba con `pruebas/papelera.mjs`.

### Archivar cuando el destino ya existe

Fila 32 de `docs/COLA.md`, 17-sep-2026: le bloqueó un asunto real. `Carpetas.trasladar` crea la
carpeta de destino y copia dentro; si algo falla a mitad (Dropbox sincronizando, un fichero
bloqueado), **ahora limpia esa carpeta a medias** antes de lanzar el error (`try/catch` alrededor
de la creación, la copia y la comprobación de la cuenta) — antes se quedaba tal cual, y el
siguiente intento de archivar ese asunto encontraba "ya hay una carpeta con ese nombre" y no
podía salir de ahí nunca.

Si el destino ya existe **de verdad** (un archivado de antes de este arreglo, que se quedó a
medias), `Carpetas.fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino)` junta las dos
carpetas en vez de fallar: recorre el origen con sus subcarpetas, un fichero que no está en el
destino se copia, uno que está con el mismo tamaño se da por copiado, y uno con distinto tamaño
se copia al lado con `" (2)"`, `" (3)"`… antes de la extensión, sin pisar nunca nada. Solo si al
final cada fichero del origen aparece de verdad en el destino (con su nombre o con el sufijo, y
el mismo tamaño) se borra el origen, con `removeEntry` directo: no se envuelve en `js/papelera.js`
porque viviría en el sentido contrario (`Papelera` ya depende de `Carpetas`) y no hay ahí ninguna
función pública que valga (`mandarAsunto` es del registro de un asunto que se está borrando, no
de un origen ya fusionado). `Carpetas.trasladar`/`mover`/`renombrar` **no cambian**: si el destino
existe, siguen fallando; solo `App.cerrarAsunto` y `App.reabrirAsunto` (`js/asuntos-archivar.js`,
sacado el mismo día de `js/documentos-sueltos.js` por pasar de 400 líneas) miran primero si el
destino ya existe y, si es así, avisan en el propio cuadro de confirmación (mismo botón, sin
preguntar nada más) y usan `fusionarEn`. `js/asuntos-archivar.js` va cargado justo después de
`js/documentos-sueltos.js` y antes de `js/relacionados.js`/`js/hitos-archivo.js`, que envuelven
esas dos funciones.

**`Carpetas.existeFichero`/`Carpetas.nombreLibreConSufijo`** (usadas internamente por
`fusionarEn` desde siempre) se exportan también desde la fila 75
(docs/HUECOS-ENCONTRADOS-FILA-69.md, 1): `js/unir-asuntos.js` las reutiliza para el mismo
renombrado con sufijo cuando un documento choca de nombre al unir dos asuntos (ver "Que no se
dupliquen los asuntos", más arriba), en vez de tener su propia copia de la misma cuenta.

Se comprueba con `pruebas/archivar-fusion.mjs`, sin navegador.

### Los atascos al archivar: mensajes en castellano y carpetas movidas

Fila 45 de `docs/COLA.md`, 17-sep-2026: un asunto real seguía sin poder archivar después de la
fila 32, con "No se ha podido archivar: A requested file or directory could not be found..." — un
`NotFoundError` del navegador, en inglés, porque `App.cerrarAsunto` enseñaba `e.message` sin
traducirlo.

- **`U.mensajeDeError(e)`** (`js/util.js`), un solo sitio para traducir por `e.name`:
  `NotFoundError`, `NotAllowedError`, `NoModificationAllowedError`/`InvalidStateError`,
  `QuotaExceededError` y `AbortError` salen en castellano; cualquier otro (los nuestros) se
  devuelve tal cual. Lo usan `App.cerrarAsunto` y `App.reabrirAsunto` en su `catch`.
- **Los temporales de sincronización no cuentan ni se copian**: `Carpetas.contarFicheros`,
  `copiarDentro` y `fusionarDentro` (`js/carpetas.js`) se saltan todo lo que
  `esCarpetaTemporalDeSincronizacion` reconozca, para que la cuenta de origen y la de destino
  hablen de lo mismo (antes, un `.tmp` o un `desktop.ini` de Dropbox podía descuadrar la
  comprobación "llegados !== esperados" y deshacer un traslado sin motivo real).
- **Un fichero que se esfuma a mitad de copia** (`leerFicheroParaCopiar`, usada por `copiarDentro`
  y por la fusión): si `getFile()` lanza `NotFoundError`, se reintenta una vez tras esperar un
  segundo; si sigue sin estar, el error dice su nombre, en castellano, y no se borra nada.
- **La carpeta ya no está donde se esperaba**: `App.cerrarAsunto` mira primero, dentro del `try`,
  si la carpeta sigue en Asuntos abiertos (`Carpetas.existe`). Si no está, pero sí está en
  `ARCHIVO/categoría/tercero`, es que el archivado ya se hizo: no copia nada, pone la ficha al día
  (estado, categoría, tercero, `cerradoEl` solo si no lo tenía, y los ficheros contados en el
  destino) y avisa en verde. Si no está en ningún sitio, avisa en ámbar pidiendo pulsar Recargar
  (clase CSS nueva `.mensaje.ambar` en `css/estilos.css`, con `--ambar-linea`; antes `U.aviso` solo
  tenía `malo`/`bueno`). `App.reabrirAsunto` hace lo mismo con `a.padre` (el manejador de carpeta
  guardado al pintar ARCHIVO, o al montarlo a mano desde el correo o Por clasificar, que puede
  estar viejo): si `a.padre` no sirve, recalcula con
  `Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false)`; si tampoco aparece ahí
  pero ya está en Asuntos abiertos, se da por reabierto sin copiar nada; si no aparece por ningún
  lado, el mismo aviso ámbar.

Se comprueba con `pruebas/archivar-atascos.mjs`, en navegador de verdad (reutiliza el disco de
mentira de `pruebas/navegador.mjs`), con los seis escenarios del documento.

### Archivar desde la ficha, sin avisos de más (fila 90, 21-sep-2026)

`docs/ARCHIVAR-SIN-AVISOS-FALSOS.md`. Al archivar un asunto desde su propia ficha (no desde la
tarjeta de la lista) salían dos avisos rojos sobrantes, aunque el archivado en sí salía bien:

- **"Este asunto ya no está en Asuntos abiertos: puede que se haya archivado o borrado desde el
  otro ordenador."** `App.cerrarAsunto` llama a `App.verAbiertos()` al terminar, que reengancha la
  ficha abierta (`App.reengancharFicha`, `js/ficha-asunto.js`); como el asunto ya no está en la
  lista (lo acaba de archivar este mismo ordenador), confundía su propio archivado con uno ajeno.
  Arreglo: `App.E.recienArchivados` (`js/nucleo.js`), un conjunto en memoria donde
  `App.cerrarAsunto` apunta la clave justo antes de llamar a `App.verAbiertos()`;
  `App.reengancharFicha` lo consulta primero y, si está, vuelve a la lista sin avisar (y borra la
  marca: es de un solo uso).
- **"...pero no he podido guardar su ficha en la carpeta: An operation that depends on state
  cached..."**, en inglés. La envoltura de `App.cerrarAsunto` en `js/ficha-archivo.js` escribe
  `_ficha.json` justo después de mover la carpeta, y Dropbox a veces todavía está sincronizando esa
  misma carpeta en ese instante (`InvalidStateError`/`NoModificationAllowedError`). Dos arreglos:
  - **`Carpetas.escribirTexto`/`escribirBytes`** (`js/carpetas.js`) reintentan solas con
    `Reintentar.escritura` (`js/reintentar-escritura.js`, cargado justo antes): un intento normal
    más hasta tres reintentos, con 0,5 s/1 s/2 s de espera por delante de cada uno, pidiendo de
    nuevo el manejador del fichero en cada intento (nunca reutiliza uno viejo). Cualquier error que
    no sea de sincronización se lanza a la primera. Como `Copias.guardar`, `guardarJson` y
    `_ficha.json` pasan todos por ahí, esto arregla de una vez toda escritura de la aplicación.
    Desde la fila 92 lo llaman a través de `conReintento(intento)`: si `window.Reintentar` no
    está cargado, escriben sin reintento en vez de fallar con «Reintentar is not defined» (que
    dejaba la aplicación sin poder guardar nada). `pruebas/scripts-cargados.mjs` lo comprueba, y
    además que todo `js/*.js` tiene su `<script>` en `index.html`.
  - Si aun así los reintentos se agotan, la envoltura de `js/ficha-archivo.js` distingue ese caso
    (`Reintentar.esErrorDeSincronizacion(e)`) y avisa en **ámbar**, en castellano, diciendo que no
    se ha perdido nada (la clave sigue en `asuntos.json`: el borrado va después de escribir
    `_ficha.json`, así que si la escritura falla no llega a borrarse) y que "Poner en orden las
    fichas del ARCHIVO" (Ajustes → Mantenimiento) la recogerá sola. Cualquier otro error sigue en
    rojo, con `U.mensajeDeError(e)` en vez de `e.message` (también arreglado en la envoltura de
    `App.reabrirAsunto`, aunque ahí no hacía falta el aviso ámbar).

Se comprueba con `pruebas/archivar-sin-avisos-falsos.mjs`, en navegador de verdad: archivar desde
la ficha abierta sin el aviso de "otro ordenador"; Dropbox fallando dos veces y saliendo bien a la
tercera, sin ningún aviso de más; y Dropbox fallando todo el rato, con el aviso ámbar y la ficha
todavía en `asuntos.json`.

### El índice del ARCHIVO

Fila 44 de `docs/COLA.md`, 17-sep-2026, `docs/BUSCADOR-ARCHIVO-INDICE.md`. Antes, `App.verArchivo`
recorría el archivo entero (categoría → tercero → asunto) cada vez que se entraba, y buscaba con
`indexOf` sobre un solo texto. Ahora hay un índice guardado, `_GESTOR/indice-archivo.json` (ver la
tabla de ficheros), y la búsqueda es por palabras sueltas.

- **`js/archivo-indice.js`** (`window.IndiceArchivo`) es el módulo del índice: se lee y se escribe
  **directo con `Carpetas`, nunca con `Copias.guardar`**, igual que `js/presencia.js` — fuera de
  las copias de seguridad, la papelera y la fusión de conflictos, porque se puede rehacer entero en
  cualquier momento.
  - `construir(onProgreso)` recorre el archivo entero una vez y devuelve el índice sin guardarlo
    (`onProgreso(categoria, total)` por categoría, para la línea de estado). De paso detecta los
    asuntos **descolocados**: una carpeta justo debajo de la categoría cuyo nombre parece un asunto
    (`Nombres.leer` le saca fecha y tipo) entra con `tercero: ''` y `sueltoEn: 'bajo la categoría'`;
    una que no parece asunto se mira un nivel más adentro por si esconde uno (cuatro niveles o
    más), con `sueltoEn` a la ruta donde se encontró. No se mueve nada, solo se señala.
  - `guardar(indice)` relee el disco y fusiona por nombre de carpeta antes de escribir, como
    `Grupos.guardar`: lo que hubiera en disco y no esté en lo recién construido (el compañero
    archivó algo desde el otro ordenador mientras tanto) se suma.
  - `anadirEntrada(entrada)`/`quitarEntrada(nombre)` tocan una sola entrada sin reconstruir nada;
    silenciosas si el índice todavía no existe.
  - `recuentoActual()` es el recuento barato del punto 6.2: solo categorías y carpetas de tercero
    (un nivel), para comparar con el `recuento` guardado sin recorrer los asuntos.
  - `textoDeBusqueda(entrada, conNotas)` junta lo del índice (nombre, categoría, tercero, ruta,
    tipo, curso, grupo, documentos, registros de Séneca) con los pocos campos de la ficha que la
    propia entrada ya guarda desde la fila 64 (ver más abajo): situación, vía y su dato, quién lo
    pidió, relacionados y campos propios. Desde la fila 73 (`docs/BUSCAR-EN-LAS-NOTAS.md`,
    19-sep-2026) la entrada también guarda `notas` (el texto de las notas del asunto, recortado a
    2.000 caracteres por `Notas.textoParaBuscar`, ver "Notas" más abajo) y `textoDeBusqueda` lo
    incluye salvo que se llame con `conNotas` a `false` (así `App.pintarArchivo` puede calcular,
    aparte, un texto sin notas para saber si una coincidencia viene de una nota). Ese cambio subió
    `VERSION` de `IndiceArchivo` de 1 a 2, y la fila 74 (`docs/CUENTAS-DE-FIN-DE-CURSO.md`, ver
    "La pantalla Cuentas" en `docs/contexto/HITOS-Y-GUIAS.md`) la subió a 3 al añadir
    `reconocido`, `loPideCategoria`, `loPideRelacion`, `abiertoEl` y `cerradoEl` a cada entrada:
    cada subida de `VERSION` deja sin esos campos a un índice guardado con la versión vieja, que
    se reconstruye solo (mismo aviso "El índice no está hecho" de siempre). Normalizado una vez.
  - `resolverHandle(entrada)` calcula el manejador real de una carpeta a partir de lo que el índice
    sabe (categoría, tercero, ruta, `sueltoEn`): el índice no puede guardar manejadores en un JSON.
- **`App.verArchivo`** (`js/archivo-personas.js`) lee el índice; si no existe, está roto o es de
  otra versión, cae al mismo recorrido de disco de siempre (`IndiceArchivo.construir()`, sin
  guardarlo) y avisa "El índice no está hecho. Reconstruir el índice."; si el recuento barato no
  cuadra con el guardado, enseña el índice igual y avisa "El índice puede no estar al día." — nunca
  se reconstruye sola. El botón **"Reconstruir el índice"**, junto a "Actualizar", llama a
  `IndiceArchivo.construir()` + `guardar()`; si algo falla a mitad, no se escribe nada a medias.
- **`App.pintarArchivo`** ya no usa `indexOf`: normaliza lo escrito, lo parte en palabras, y un
  asunto sale si tiene TODAS en su `busca` (calculado una vez al cargar el índice, no en cada
  tecleo). Sin resultados: "Ningún asunto archivado tiene todas esas palabras." Desde la fila 73,
  `App.verArchivo` guarda también `buscaSinNotas` (con `textoDeBusqueda(entrada, false)`) y
  `notasTexto`; con eso, `App.pintarArchivo` calcula para cada resultado
  `a._fragmento = App.fragmentoDeNota(a, palabras)`, y `App.tarjetaAsunto` enseña ese trocito de la
  nota (con la palabra buscada resaltada) SOLO cuando la coincidencia venía de una nota y no del
  resto de campos — así se ve "por qué" ha salido ese asunto. Igual en Asuntos abiertos
  (`js/asuntos-lista.js`, `App.verAbiertos`/`App.pintarAbiertos`), que de paso pasó a buscar
  palabra a palabra en cualquier orden (antes comparaba la frase entera con `indexOf`, sin contar
  las notas). La lógica de qué trocito enseñar vive en `js/notas.js`: `textoParaBuscar(ficha)`
  junta y recorta a 2.000 caracteres el texto de las notas de un asunto; `fragmentoDeBusqueda`
  saca la ventana de palabras alrededor de la que coincide; `fragmentoSiSoloEnNota` decide si hace
  falta enseñar fragmento (compara `busca` contra `buscaSinNotas` palabra a palabra). Se comprueba
  sin navegador en `pruebas/buscar-en-notas.mjs`.
- **`js/asuntos-archivar.js`** da de alta y de baja el índice sin reconstruirlo entero:
  `App.cerrarAsunto` añade la entrada (con `actualizarIndiceAlArchivar`) justo después de que el
  traslado haya salido bien, en los dos sitios donde puede acabar archivado (el normal y el "ya
  estaba archivado"); `App.reabrirAsunto` la quita (`actualizarIndiceAlReabrir`) y **ya no llama a
  `App.verArchivo`**: con el índice al día, basta repintar `App.E.listaArchivo` en memoria.
- Las tarjetas del ARCHIVO no traen manejador de carpeta: `js/archivo-personas.js` envuelve
  `App.verDocumentos` para resolverlo con `IndiceArchivo.resolverHandle` justo antes de abrirlo.
  "Reabrir" no hace falta tocarlo: `App.reabrirAsunto` ya sabía recalcular la carpeta cuando
  `a.padre` faltaba o estaba viejo (fila 45, más arriba).

Se comprueba con `pruebas/archivo-indice.mjs`, en navegador de verdad con el disco de mentira de
`pruebas/navegador.mjs`, con los nueve escenarios del documento.

### La ficha de un asunto archivado, en su propia carpeta

Fila 64, 19-sep-2026, `docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md`. Antes, `asuntos.json` guardaba
también la ficha de los archivados y se reescribía entero 50-150 veces al día: a los cinco cursos,
más de 17 MB. Se copia el patrón de `js/hitos-archivo.js` con el historial de hitos.

- **`js/ficha-archivo.js`** (`window.FichaArchivo`) envuelve `App.cerrarAsunto`/`App.reabrirAsunto`
  por fuera de todo (después de `js/hitos-archivo.js`): al archivar, baja la ficha a `_ficha.json`
  dentro de la propia carpeta (el guion bajo, para que no cuente como documento) y borra la clave de
  `asuntos.json`; al reabrir, la lee de vuelta, la funde con lo que ponga `App.anotar` y borra el
  fichero. Un archivado de antes de esta fila, sin `_ficha.json`, se reabre con ficha vacía.
  `FichaArchivo.completar(a)` resuelve el manejador y sustituye `a.ficha` por la de verdad: lo usan
  `js/otros-del-tercero.js` y el clic de una tarjeta del ARCHIVO en `js/ficha-asunto.js`.
- El índice (`entradaDe`, arriba) guarda ya los pocos campos de ficha que hacen falta para pintar y
  buscar, sin `asuntos.json`. `js/fichas-huerfanas.js` ya no cuenta un archivado como "sin ficha".
  Renombrar un estado y contar asuntos de un tipo miran los abiertos en memoria más el índice.
- **"Poner en orden las fichas del ARCHIVO"** (Ajustes → Mantenimiento) mueve a su carpeta la ficha
  de cada archivado que siga en `asuntos.json`, de antes de esta fila. No se hace sola al arrancar.

Prueba: `pruebas/ficha-del-archivo.mjs`, sin navegador, con `js/asuntos-archivar.js` y
`js/ficha-archivo.js` de verdad en un `vm`.

### Fichas sin carpeta (huérfanas), y su aviso en la pantalla principal

19-sep-2026, fila 68, `docs/AVISOS-QUE-FALTAN.md`, 1. `window.FichasHuerfanas.calcular()`
ya no fuerza un recorrido entero del ARCHIVO cuando no se ha leído esta sesión
(`App.verArchivo()`, como hacía hasta esta fila): usa el índice guardado
(`IndiceArchivo.leerDisco()`) si existe, o el ARCHIVO si ya se ha leído por otro motivo; sin
ninguna de las dos cosas, un **cerrado** no se comprueba y no se acusa de huérfano por error (un
**abierto** sin carpeta sí, siempre). `js/avisos-que-faltan.js` pinta con este mismo cálculo una
línea junto a `#panel-avisos`/`#panel-frescura` en "Asuntos abiertos" que lleva al bloque de
siempre en Ajustes → Mantenimiento; antes solo se veía entrando a propósito ahí. Se repinta al
envolver `App.verAbiertos`, no en cada tecla del buscador.

**Se puede callar 7 días** (20-sep-2026, fila 86,
`docs/PULSAR-PARA-ABRIR-Y-AVISO-OCULTABLE.md`). A la derecha del botón "Verlas", una ✕ con
`title` "Ocultar este aviso durante 7 días". Al pulsarla se guarda en `localStorage` (nunca en
`_GESTOR`: es del ordenador, no del centro), clave `aviso-huerfanas-callado`, un JSON
`{hasta, n}` con el momento hasta el que calla y cuántas fichas había. La decisión de pintar o no
vive en una función sin pantalla, `sePintaHuerfanas(nAhora, guardado)`
(`window.AvisosQueFaltan._sePintaHuerfanas`, para las pruebas): sin nada guardado, o corrupto,
sale; si `nAhora` es mayor que lo guardado (han aparecido más fichas), sale igual aunque no hayan
pasado los 7 días; si no, sale solo cuando `Date.now()` ya ha pasado de `hasta`. Como cualquier
`localStorage` de esta aplicación, dentro de `try/catch`: si el navegador no deja, el aviso sale
siempre. **El aviso de la papelera vieja se queda sin ✕**: la única salida de ahí sigue siendo
decidir, porque son datos de menores. Prueba: `pruebas/avisos-que-faltan.mjs`.

---
