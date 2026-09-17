Dónde se engancha: grupo **"Lo pide (opcional)"** en `#bloque-detalles` de `js/asuntos-nuevo.js`
(se repinta al cambiar de tercero con `App.fijarTercero`; `App.datosDelFormulario()` añade
`loPide` solo si hay nombre). Fila **"Lo pide"** (debajo de "Vía de comunicación") y marca
`.marca-lopide` en la cabecera de `js/ficha-asunto.js`, más un botón **"Lo pide"** en
`pintarAcciones` (solo en asuntos abiertos, con "Quitar el dato" dentro del cuadro cuando ya hay
uno; apagado en modo consulta, como el resto de controles que modifican, pero **no** en la lista
`esControlDeSoloLectura`). En `js/correo.js`: si se conoce el correo de quien lo pide y está entre
los de la lista, se marca esa casilla sola; si no está, va a "Otro correo" y ninguna casilla queda
marcada; encima de "Para" sale una línea gris "Lo pidió Fulano (relación), el día tal."; `aQuien`
(Séneca) devuelve su nombre en vez del de siempre. Cuatro huecos nuevos en `js/plantillas.js`
(`{quienlopide}`, `{quienlopiderelacion}`, `{quienlopidevia}`, `{quienlopidefecha}`), vacíos como
cualquier otro hueco cuando el asunto no tiene el dato.

No toca `js/conflictos.js` (fusiona `loPide` como un campo más que gana el lado elegido, igual que
hoy), `js/asuntos-editar.js`, `js/papelera.js`, `js/asuntos-lista.js` ni el script de Apps Script.
Se comprueba con `pruebas/lo-pide.mjs`, sin navegador (jsdom).

### Mandar los documentos de un asunto por correo

Gmail no deja que una página web le enganche ficheros. Bloque **"Documentos de este asunto"**
(`js/correo-adjuntos.js`, `window.CorreoAdjuntos`), solo en el cuadro de Correo (nunca en el de
Séneca): la lista de ficheros del asunto con una casilla cada uno (desmarcadas de partida) y el
botón **"Preparar borrador con los documentos"**.

- Al pulsar, se copian los documentos marcados a `GESTOR-BANDEJA` con el nombre `<id> -
  <nombre original>` y, **el último**, el encargo `<id>.envio.json` (`para`, `asunto`, `cuerpo`,
  `adjuntos`, `hilo` —de `hilos` en la ficha del asunto si lo tiene, si no cadena vacía— y
  `asuntoCarpeta`). Si lo marcado suma más de **20 MB**, no se prepara nada y sale un aviso.
- Se apunta también en `_GESTOR/envios.json` (una lista, no un objeto como los demás ficheros de
  `_GESTOR`), para que la tarjeta **"Borrador en camino — \<asunto\>"** se vea aunque se cierre
  el cuadro. Se relee antes de escribir, con `Copias.guardar`.
- **La vigilancia y la tarjeta viven en `js/bandeja-correos.js`** (no en `js/correo-adjuntos.js`):
  cada 15 segundos, y solo mientras haya algún encargo vivo, mira si ha aparecido `<id>.listo.json`
  (pasa a botón "Abrir el borrador en Gmail") o `<id>.error.json` (aviso rojo con el motivo y
  botón "Entendido"); pasados 3 minutos sin respuesta, aviso ámbar y botón "Dejarlo" (borra el
  `.envio.json` y sus copias de la bandeja, y el encargo de `envios.json`). `window.Bandeja`
  expone `carpeta()` (la misma carpeta de los correos recogidos) y `avisarEnvioNuevo()`, para que
  la tarjeta no espere a la próxima vuelta de 15 segundos.
- `js/bandeja-correos.js` **no lee un `.envio.json`, `.listo.json` ni `.error.json` como si fuera
  un correo recogido**: se descartan antes de mirar el `.id` de dentro.
- El rastro reutiliza `apuntarElRastro` de `js/correo.js`: si se ha preparado un borrador con
  documentos en este cuadro, la nota añade "· con N documentos: …".
- **Siempre borrador, nunca envío automático.** El script de Apps Script
  (`apps-script/gestor-correos.gs`, `mandarBorradores()`) lo monta con `GmailApp.createDraft` o,
  si el encargo trae `hilo`, con `createDraftReply`, y pasa a revisar cada **minuto** (antes,
  cinco). El enlace que deja en `.listo.json` es siempre la lista de borradores
  (`#drafts`), nunca uno construido con el identificador del borrador.

Se comprueba con `pruebas/envios.mjs`.

### Plantillas de correo y de mensaje de Séneca

Una plantilla es **solo el cuerpo del medio**: el saludo y la despedida los sigue poniendo
`js/correo.js`, solos. La misma plantilla sirve para el correo y para el mensaje de Séneca; se
crean en Ajustes, pegadas a un tipo de asunto, y se guardan en `_GESTOR/plantillas.json`
(`js/plantillas.js`, `window.Plantillas`), compartido con el compañero.

- **El fichero**: `{ firma, centro, lista: [{ id, tipo, categoria, nombre, texto }] }`. `firma` y
  `centro` sustituyen a lo que hasta el 16-sep-2026 estaba escrito a mano en `js/correo.js` (la
  constante `CENTRO` y el `'Un saludo.'` de `cuerpoDelCorreo`); si el fichero no existe, sale eso
  mismo de partida y se crea de verdad al primer guardado. **Se relee cada vez que se abre el
  cuadro de Correo, sin caché entre aperturas**: es un fichero compartido, y releerlo una vez por
  cuadro no cuesta nada.
- **Los huecos**, entre llaves: `{nombre}` (el tercero sin su número ni su NIF), `{grupo}`,
  `{curso}`, `{tipo}`, `{hoy}`, `{limite}`, `{usuario}` (`App.E.usuario`), `{centro}`, y
  `{campo:LO QUE SEA}` para un campo propio del tipo (por su nombre, buscado con `Campos.
  nombreDeCampo` sobre `App.E.campos.porTipo`). `Plantillas.rellenar(texto, valores)` los
  sustituye: uno sin valor se deja **vacío** (nunca se escribe `{grupo}` en lo que le llega al
  tercero) y se apunta en la lista de "faltan"; uno que no se reconozca se deja tal cual, también
  apuntado, para que un hueco mal escrito no rompa nada. Las llaves se comparan con
  `U.normalizar` (sin mayúsculas ni acentos), nunca al sustituir.
- **En el cuadro de Correo y en el de Séneca** (los dos, `js/correo.js`): un desplegable
  "Plantilla" encima del cuerpo, dentro de `camposComunes`/`interiorDeComunes`, en su propio
  `#correo-comunes` para poder repintarse solo sin tocar el "Para" ni los documentos. Con una
  plantilla, sale puesta; con varias, sale la primera; sin ninguna, el desplegable no se pinta y
  el cuerpo sale como siempre. Encima del cuerpo, si falta algún dato, un aviso ámbar "Faltan
  datos: …". **Cambiar de plantilla con algo escrito a mano pregunta antes de pisarlo — en línea,
  dentro del propio cuadro (`#correo-plantilla-confirmar`), nunca con un segundo `U.preguntar`**:
  solo hay un cuadro de diálogo en toda la aplicación, y este ya está ocupado por el de Correo.
  En Séneca, al copiar el texto (paso 2 de `engancharSeneca`) se recorta a **4.000 letras** si
  hace falta, avisando en una línea.
- **En Ajustes**, bloque propio "Plantillas de correo" (vive entero en `js/plantillas.js`, no
  toca `js/ajustes.js`, que ya pasa de 47 KB: se engancha solo con `window.Gestor.alRefrescar`,
  igual que `js/bandeja-correos.js` y `js/unir-asuntos.js`). Lista con buscador cruzado, alta y
  edición en un `U.preguntar` con botones para insertar cada hueco en el cursor y una vista previa
  en vivo (con el primer asunto abierto de ese tipo, o datos de muestra si no hay ninguno).
  Bloque aparte para la firma y el centro. **El borrado pasa por `Papelera.mandarDato` para dejar
  rastro, pero `js/papelera.js` no sabe devolver la clase `'plantilla'`** (no estaba en la lista
  de ficheros del encargo): cae en su "No sé devolver esto." Si hace falta devolver una borrada,
  hay que copiarla a mano desde el bloque Papelera de Ajustes.

Se comprueba con `pruebas/plantillas.mjs`. El bloque de pantalla vive en `js/plantillas-ajustes.js`
(se sacó de `js/plantillas.js` el 16-sep-2026, al crecer con el motor de las plantillas de
documento, para no pasar de 450 líneas): usa la API pública de `Plantillas` (`cargar`, `guardar`,
`deTipo`, `idNuevo`, `rellenar`, `HUECOS`...), no toca nada privado.

### Plantillas de documento de Word

El gemelo en papel de las de correo (16-sep-2026, `docs/PLANTILLAS-DE-DOCUMENTO.md`, fila 17 de
`docs/COLA.md`): un botón **Generar documento** en la ficha de un asunto saca una copia de un
`.docx` con los huecos rellenos, ya guardada en la carpeta del asunto, sin preguntar nada.

- **El fichero**: mismo `_GESTOR/plantillas.json` que las de correo, con la clave de raíz nueva
  `documentos`: `[{ id, categoria, tipo, nombre, fichero, tipoDocumento, texto }]`. Una misma
  plantilla puede colgar de varios tipos, cada uno con su propia fila. `limpio()` la normaliza
  como la `lista` de correo: un fichero viejo sin esa clave sigue cargando con `documentos: []`.
  Junto a `firma` y `centro` se guardan cuatro claves de raíz más, editables en el mismo bloque de
  Ajustes de "Plantillas de correo": `localidad`, `direccion`, `codigo`, `cargo` (del centro).
- **Los `.docx` viven en `_GESTOR/PLANTILLAS`**, sin subcarpetas, dentro de la carpeta de asuntos
  abiertos (`Carpetas.crear(App.E.gestor, 'PLANTILLAS')`, que la crea si no existe). Francisco los
  sube a mano a esa carpeta de Dropbox; la aplicación nunca escribe ahí, solo lee y cuelga el
  nombre del fichero de un tipo en Ajustes. No es ninguno de los trece ficheros compartidos: no
  lleva copia de seguridad ni detección de fichero roto.
- **`Plantillas.valoresDeAsunto(asunto)`** (`js/plantillas.js`), pública desde el 16-sep-2026:
  hasta entonces era `valoresDePlantilla()`, privada de `js/correo.js`, y solo traía lo que hacía
  falta para el correo. Ahora es async (el DNI, los tutores y el registro salen de ficheros) y
  monta, con un solo argumento, todos los huecos del catálogo (`Plantillas.HUECOS`, ampliado):
  `nombre`, `nombreNatural` (en orden normal, sin el código pegado), `grupo`, `curso`, `tipo`,
  `referencia` (Nº escolar en alumnado, cuatro cifras del documento en personal, NIF en empresas,
  el campo "Referencia" en otros), `dni` (solo alumnado, con `window.Dni.de`), `telefono`,
  `correo`, `tutor1`/`tutor1telefono`/`tutor1correo`, `tutor2`/... (solo alumnado, buscando por el
  título de la columna como `js/dni.js`, nunca por su posición ni desde `persona.campos` para
  saber si existe), `descripcion`, `estado`, `registro` (el código `26EM1234` del documento más
  reciente de la carpeta que ya lo lleve en el nombre, sin depender de `js/documentos.js`), `hoy`,
  `hoyLargo` ("16 de septiembre de 2026"), `lugarYFecha` ("En Alhaurín el Grande, a..."), `limite`,
  `usuario`, `centro`, `localidad`, `direccionCentro`, `codigoCentro`, `cargo` y `firma` (el texto
  de la firma del centro, ya relleno con el resto de estos mismos valores). `js/correo.js`
  (`abrirCuadro`) la llama una vez por apertura del cuadro, junto a `Plantillas.cargar`, y guarda
  el resultado en `valoresActuales`; `cuerpoDelMedio` y `textoDeLaFirma` lo usan en vez de tener
  su propia función de valores (`valoresDePlantilla`/`camposDelAsunto`, que ya no existen).
- **`js/docx.js`** (`window.Docx`, sin librerías ni CDN): un `.docx` es un ZIP, leído y escrito a
  mano. `Docx.rellenar(bufferDocx, valores)` -> `{ blob, faltan }` (acepta `ArrayBuffer` o
  `Uint8Array`). Lee el directorio central (buscado desde el final del fichero, que es el único
  sitio fiable) y, por cada entrada: si no es `word/document.xml` ni `word/header*.xml` /
  `word/footer*.xml`, la copia tal cual (cabecera local + bytes, sin descomprimir), y en el
  directorio central copia también su entrada, solo parcheando el offset. Las que sí tocan se
  descomprimen con `DecompressionStream('deflate-raw')` si hace falta (método 8; si ya vienen
  "almacenadas", método 0, no hace falta), se reparan y sustituyen, y se escriben **sin comprimir**
  (método 0): mismo tamaño comprimido que sin comprimir, y CRC-32 calculado a mano (tabla con el
  polinomio `0xEDB88320`). No hace falta `CompressionStream` para nada.
  - **La reparación de huecos partidos**: por cada `<w:p>...</w:p>`, se localizan sus `<w:t>` en
    orden y, si un hueco (`{...}`) cruza de uno al siguiente, se mueven solo los caracteres que
    forman el hueco hasta dejarlo entero en uno de ellos — nunca se funden todos los `<w:t>` del
    párrafo en uno, que perdería la negrita o el subrayado de las palabras que no son parte de
    ningún hueco. Hecho esto, cada `<w:t>` (toque o no un hueco) se decodifica de entidades XML, se
    pasa por `Plantillas.rellenar`, y se vuelve a escapar (`&`, `<`, `>`; las comillas de un texto
    normal no hace falta escaparlas). Un salto de línea en el valor sustituido se escribe
    `</w:t><w:br/><w:t xml:space="preserve">`.
  - Simplificación consciente: no contempla los "data descriptors" del ZIP (banderas con el
    tamaño después de los datos, típico de escritores en flujo): un `.docx` de verdad, escrito por
    Word, LibreOffice o cualquier librería que genere ficheros, siempre lleva el tamaño y el CRC
    en la propia cabecera local.
  - `Docx.leerEntradaDeTexto(bufferDocx, nombre)` (solo para depurar y para las pruebas): lee y
    descomprime una entrada de texto ya generada, reutilizando el mismo lector.
- **`js/plantillas-documento.js`**: el botón **Generar documento**, puesto en `#ficha-acciones`
  con el mismo patrón que `js/correo.js` (se envuelve `App.abrirFicha` y se vigila la pantalla con
  un `MutationObserver`). No sale si el tipo no tiene ninguna plantilla de documento; con una sola,
  un clic y a generar; con varias, un cuadro para elegir (como `Relacionados.elegirTercero`: se
  pinta dentro de `#capa`, sin `U.preguntar`, porque aquí se elige pulsando una de la lista, no
  aceptando). Comprobar si el tipo tiene plantillas es async (hay que leer `plantillas.json`), así
  que el botón puede salir un instante después que el resto de la ficha.
  - **Al generar**: lee el `.docx` de `_GESTOR/PLANTILLAS` (si no está, avisa con su nombre y
    para); `Plantillas.valoresDeAsunto(asunto)` + `Docx.rellenar`; monta el nombre con
    `Nombres.montarDocumento` (`tipoDocumento` y `texto` de la plantilla, fecha de hoy, extensión
    `.docx`; se vigila `App.LARGO_MAXIMO_NOMBRE`); si ya hay un fichero con ese nombre en la
    carpeta, avisa y no lo pisa; si no, lo guarda (`getFileHandle`/`createWritable`, como
    `Carpetas.escribirTexto` pero con un `Blob`) y deja una nota en el asunto con `Notas.anadir`
    ("Generado &lt;nombre&gt;"); avisa de los huecos sin datos, sin impedir nada; y vuelve a
    abrir la ficha para refrescar la lista de documentos.
  - **En Ajustes**, bloque hermano **"Plantillas de documento"**: buscador, tarjetas por tipo,
    alta/edición/borrado con `Papelera.botonBorrar` (clase `'plantilla-documento'`, que
    `js/papelera.js` tampoco sabe devolver, igual que `'plantilla'`). En el alta se elige el
    `.docx` de un desplegable con los que ya haya en `_GESTOR/PLANTILLAS` (Francisco los sube a
    mano; el cuadro nunca escribe ahí), y se escriben el nombre visible, el tipo de documento y el
    texto adicional. Debajo, la lista de `Plantillas.HUECOS` con un botón de copiar en cada uno.

Se comprueba con `pruebas/plantillas-documento.mjs` (jsdom, sin navegador: construye un `.docx` de
mentira a mano, con su propio escritor de ZIP, independiente del de `js/docx.js`).

### Registrar un documento en un paso

Botón **Registrar**, en cada documento que aún no lleve las cuatro piezas del registro en su
nombre (en "Gestionar documentos" y en la ficha del asunto). Al pulsarlo se elige la copia
sellada, y solo se pide el número de registro: el resto del nombre (fecha, tipo, texto
adicional) se lee del documento original (`Documentos.leerNombre`). El nombre se monta con
`Nombres.montarDocumento`, la copia se guarda con `Carpetas.copiarFicheroEn`, el original se
queda como está, y se anota una nota en el asunto con `Notas.sustituir` ("Registrado 26EM1234 ·
<documento>"; ver más abajo). Si ya hay un fichero con ese nombre, avisa y no lo sobrescribe.

Casilla "Pendiente de registro" en el cuadro de nombrar un documento (solo si aún no lleva
registro); lo marcado se guarda en `pendientesRegistro`, en la ficha del asunto. Un pendiente
lleva marca ámbar "Sin registrar" y su botón Registrar sale destacado; al registrarlo se quita
solo de la lista, y al renombrarlo desde "Gestionar documentos" se actualiza con él.

**La tarjeta del asunto no lleva nada de esto** (ver `BOTONES_DE_LA_TARJETA`). Vive en
`js/registro.js`: "Gestionar documentos" ya tiene su `U.preguntar` abierto y pinta dentro
(`Registro.pintarEnContenedor`); la ficha del asunto no tiene cuadro abierto y abre uno nuevo
(`Registro.abrirCuadro`). **Solo hay un cuadro de diálogo en toda la aplicación**: abrir un
segundo `U.preguntar` mientras el primero espera le roba los botones al de fuera, que se queda
colgado. `Registro.proponer({ anio, tipo, serie, numero })` rellena las cuatro piezas (`tipo` es
E/S, `serie` es M/A). El explorador de "Abrir archivo" (`Carpetas.elegirFichero`, más abajo) se
abre ya en la carpeta del asunto.

### Un papel que ya trae el sello, sin duplicarlo (17-sep-2026, fila 20)

`docs/REGISTRO-SIN-DUPLICAR.md`. Antes había que pulsar Registrar y buscar a mano el PDF sellado
que ya estaba en la carpeta del asunto (bajado de Séneca), y al final quedaban dos ficheros del
mismo papel con dos nombres. Ahora `js/registro-sellado.js` (`window.RegistroSellado`) le da la
vuelta: mira la carpeta él solo y pregunta de qué documento es.

- **Qué se mira**: al pintar la ficha (`pintarSellos`, en `js/ficha-asunto.js`), los PDF de la
  carpeta cuyo nombre **no** lo ha puesto la aplicación (`Documentos.pareceDeLaAplicacion(nombre)`,
  que mira si empieza por `AAMMDD `: es lo que Séneca nunca escribe). Cada uno se lee una sola vez
  por ordenador: `RegistroSellado` guarda en `js/almacen.js` (de este ordenador, no en los
  ficheros compartidos), por asunto, el nombre y el tamaño de cada PDF ya mirado y si tenía sello
  o no (`pendientesDeLeer`/`pendientesDeResolver`, funciones sin efectos, probadas sueltas).
- **El aviso**: si algún PDF trae sello sin resolver, sale arriba en la ficha (`#ficha-sellos`) un
  aviso ámbar por cada uno, con el código y la fecha del sello, un desplegable con los documentos
  ya nombrados del asunto (el más reciente primero) y un botón **No es un registro** (marca el
  PDF como mirado, sin tocar nada; `RegistroSellado.marcarIgnorado`).
- **Al elegir un documento** (`RegistroSellado.asociar`): el PDF sellado **se renombra**
  (`Carpetas.renombrarFichero`) con el nombre que le toca —el mismo que calcula hoy el paso de
  Registrar (`RegistroSellado.nombreParaSello`, misma fórmula que `registro.js`)—, el documento
  viejo (el que se subió sin sellar) se manda a la papelera (`Papelera.mandarDocumentoDeAsunto`,
  que además apunta su propia nota de "mandó a la papelera"), y se apunta la nota de registro con
  `Notas.sustituir`. No se crea ningún fichero nuevo. Si el nombre nuevo ya existe en la carpeta,
  avisa y no toca nada (`RegistroSellado.hayColision`).
- **`Notas.sustituir(asunto, texto, campoClave, valorClave, extra)`** (nueva, `js/notas.js`): como
  `Notas.anadir`, pero si ya hay una nota con ese mismo `campoClave`/`valorClave` la sustituye en
  su sitio en vez de añadir otra debajo. El registro de un documento (aquí y en `js/registro.js`,
  que también se ha pasado a esto) usa `campoClave: 'registroDeDocumento'`, `valorClave` el nombre
  del documento original: registrar dos veces el mismo documento deja una sola nota, no dos.
- **La ficha, mientras se resuelve**: `sel.onchange`/`noEs.onclick` usan `U.mientrasGuarda` (apaga
  el control mientras dura) y repintan documentos, notas y el propio aviso al terminar.

Se comprueba con `pruebas/registro-sin-duplicar.mjs` (sin PDF ni navegador, `vm` de Node como
`pruebas/verificacion.mjs`: normalización del sello, sin sello, nombre ya puesto, ya mirado,
nombre igual al de Registrar, colisión) y `pruebas/registro-sellado.mjs` (navegador de verdad:
detecta solo, asocia y renombra, "No es un registro" no vuelve a preguntar).

**Lectura del número del sello de Séneca, dentro del PDF.** El sello va como texto en el PDF,
aunque el documento sea un escaneado, con este formato tal cual:

    2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02

`AÑO / CÓDIGO DEL CENTRO / SERIE + número con ceros por delante`, pegado a `ENTRADA`/`SALIDA`,
pegado a `Fecha: dd/mm/aaaa hh:mm:ss`.

- `js/registro-lector.js` lee con **pdf.js** (Mozilla) **hasta 10 páginas**, parando en cuanto
  aparece el sello (antes solo la página 1: era la causa de que se detectara unas veces sí y otras
  no, según en qué página cayera). `buscarEnTexto(texto)` (sin efectos, probada suelta) prueba
  primero con el texto normalizado (todo espacio, tabulador o salto de línea, en uno solo) y, si
  así no aparece, otra vez sin ningún espacio: el sello a veces viene pegado del todo. Usa
  `(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)`. Si el número tiene más de
  cuatro cifras se deja entero y se avisa; si no, se rellena con ceros por delante hasta cuatro.
- Si se encuentra el sello, el cuadro de Registrar sale relleno, con una línea verde "Leído del
  sello de Séneca", y el foco va directo al botón de aceptar. Si no, el cuadro sale vacío, con el
  foco en los cuatro dígitos.
- **Ojo con el foco**: `js/usabilidad.js` vigila la apertura del cuadro (`#capa`) y pone el
  cursor en su primer campo con un `MutationObserver`, que se dispara después del código que
  abre el cuadro y pisaría cualquier `.focus()` puesto ahí mismo. El foco de Registrar se pone
  con `setTimeout(fn, 0)`.
- La fecha del sello no cambia la fecha `AAMMDD` del nombre (la del propio documento); se guarda
  en la nota ("Registrado 26EM0368 el 10/09/2026 · <documento>").
- **pdf.js va copiado en el repositorio**, en `js/lib/pdf.min.js` y `js/lib/pdf.worker.min.js`
  (versión 3.11.174, del `build/` de `pdfjs-dist`, no de `legacy/`). No se carga de ninguna
  dirección externa, y solo se trae la primera vez que hace falta.

Se comprueba con `pruebas/registro.mjs` (con un PDF mínimo montado por la propia prueba, con el
texto del sello dentro: el PDF real con datos personales no está en el repositorio).

### El explorador de ficheros, ya en la carpeta que toca (17-sep-2026, fila 20)

`window.showOpenFilePicker` admite `startIn` con el manejador de una carpeta. `Carpetas.elegirFichero(carpetaInicio)`
lo admite como argumento opcional; sin él, se abre donde el navegador quiera, como siempre.
Lo pasan sus llamadores cuando conocen la carpeta: `js/documentos.js` y `js/registro.js` (la del
asunto abierto) y `js/traer-datos.js` (la de `_GESTOR/datos`, aunque los CSV vengan de fuera: es
la única carpeta de la aplicación que ese botón tiene a mano).

### El código de verificación del pie de un documento

(17-sep-2026, fila 19, docs/CSV-DEL-DOCUMENTO.md). Los documentos electrónicos de la
administración llevan en el pie un código de verificación (CSV, CVE...) y la dirección donde se
teclea para comprobar el documento. Aquí solo se lee, para no teclearlo a mano: **nunca se
descarga nada de esa página** (cada administración tiene la suya, y su formulario no se abre con
una dirección que lleve el código dentro) y **nada se guarda** en ningún fichero compartido.

- `js/verificacion.js` (`window.Verificacion`), nuevo: `leerDelTexto(texto)` y
  `leerDelFichero(fichero)`. Reutiliza `RegistroLector.textoDePrimeraPagina`, sacada de
  `js/registro-lector.js` para esto (no se carga pdf.js dos veces ni se duplica cómo se saca el
  texto de una página).
- **El código**: se busca una etiqueta ("Código Seguro de Verificación (CSV)", "Código de
  verificación", "CSV", "CVE"...), sin distinguir mayúsculas ni tildes, y se coge lo que venga
  detrás —dos puntos, un guion o nada— hasta el primer carácter que no sea letra, número, o
  `+ / = - _ .`, con ocho de esos caracteres como mínimo. El espacio no entra en ese conjunto, así
  que el propio patrón para solo donde toca: no hace falta adivinar dónde acaba el código.
- **La dirección**: cualquier `http(s)://` del texto cuya dirección contenga `verifica`, `csv`,
  `cve`, `valida`, `cotejo` o `sede`; se coge la primera, recortando los puntos, comas, paréntesis
  y comillas que suelan quedar pegados al final por venir dentro de una frase.
