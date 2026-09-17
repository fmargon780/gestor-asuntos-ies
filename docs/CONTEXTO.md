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
- **En `js/lector.js`** (el panel de leer un correo, `con-lector`): al abrir un PDF
  (`Lector.abrir({ blob, ... })`) se lee el pie en paralelo, sin retrasar el panel; si aparecen
  código y dirección, salen debajo "Copiar el código" (con el código al lado, en gris) y "Abrir la
  verificación" (`target="_blank"`, `rel="noopener"`); solo código, solo el primer botón; nada,
  nada. Un número de generación descarta la lectura si se ha abierto otra cosa mientras tanto
  (mismo problema, mismo remedio, que el `repintando`/`actual !== a` de otros paneles que se
  repintan solos). **No toca `js/visor.js`**: por ahora, este atajo solo está donde se lee un
  correo antes de archivarlo, que es cuando de verdad hace falta no teclear nada a mano.

Se comprueba con `pruebas/verificacion.mjs`, sin PDF ni navegador (`leerDelTexto` no toca ninguno
de los dos): mismo patrón que `pruebas/logica.mjs`, cargando el fichero con `vm` de Node.

### Terceros relacionados con un asunto

Un asunto puede afectar a más de una persona o entidad, además de su tercero principal.

- Bloque "Personas y entidades relacionadas" en la ficha del asunto (`js/ficha-asunto.js`), al
  lado de "Otros asuntos de este tercero". Solo ahí (nada en la tarjeta de la lista).
- Se guarda en `asuntos.json`: `ficha.relacionados`, lista de `{ categoria, nombre }`. Una ficha
  sin `relacionados` simplemente no tiene ninguno.
- Para elegir o dar de alta el relacionado se reutiliza `App.textoTercero` (reglas de nombres de
  `CONTEXTO-CORTO.md`), `App.cuadroDeTercero` y `Datos.anadirALista`, con la guardia de
  duplicados de siempre. El buscador de "Nuevo asunto" está sacado a `App.pintarBuscadorDeTercero`
  (categoría + buscador + resultados + alta), en `js/asuntos-nuevo.js`, para reutilizarlo aquí.
- **Nunca se copia ningún documento del asunto.** Al archivar, si tiene relacionados, se
  pregunta a cuáles avisar (todos marcados por defecto) y, en la carpeta de cada uno dentro de
  ARCHIVO (se crea si no existe), se deja una carpeta `(RELACIONADO) <nombre del asunto>` con un
  único fichero `DONDE ESTA ESTE ASUNTO.txt`. Al reabrir, esa carpeta-nota se borra sola; si
  tiene algo más dentro, no se borra, y avisa.
- Esas carpetas-nota viven al mismo nivel que un asunto de verdad (`ARCHIVO / categoría /
  tercero / carpeta`): `App.verArchivo` y `Duplicados.delTercero` las filtran por su prefijo
  (`(RELACIONADO) `).
- La ficha de la persona (`App.verFicha`, en `js/archivo-personas.js`) enseña un bloque
  "Relacionado con este asunto" cuando aparece como relacionada de alguno, mirando
  `App.E.registro.asuntos` directamente.
- **Copiar el nombre en orden normal.** Cada relacionado lleva un botón "Copiar"
  (`Relacionados.nombreEnOrdenNormal`) que copia su nombre tal como se escribe a mano, no como se
  guarda: de alumnado y personal quita el código pegado al final (el Nº escolar o las cuatro
  cifras del documento — siempre en mayúsculas, nunca como lleva un nombre de pila) y da la
  vuelta a "Apellidos, Nombre"; en empresas copia la razón social tal cual, sin darle la vuelta.
- Vive en `js/relacionados.js`, cargado después de `js/duplicados.js` (envuelve
  `Duplicados.delTercero`) y de `js/archivo-personas.js` (envuelve `App.verFicha` y
  `App.verArchivo`).
- **"+ Añadir varios"** (17-sep-2026, fila 21): abre el mismo buscador en modo `multiple`, con los
  atajos de alumnado y "Meter un grupo entero" encima (ver la sección siguiente). Añade con
  `Relacionados.combinarRelacionados`, sin preguntar uno a uno.

Se comprueba con `pruebas/relacionados.mjs` (el modo de siempre) y con `pruebas/grupos.mjs` /
`pruebas/grupos-navegador.mjs` (el modo `multiple` y los grupos).

### Grupos de personas (17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md)

Señalar varios terceros a la vez, en vez de uno por vuelta al cuadro, y guardar listas con
nombre ("equipo directivo", "tutores de 1º…") que sirven tanto para relacionar de golpe con un
asunto como para poner los destinatarios de un correo.

**El modo `multiple` de `App.pintarBuscadorDeTercero`** (`js/asuntos-nuevo.js`), opcional y sin
tocar el modo de siempre:

- `App.pintarBuscadorDeTercero(contenedor, categoriaInicial, alElegir, { multiple: true,
  marcadosIniciales, alCambiarCategoria })`. Cada resultado lleva una casilla
  (`.resultado-marcable`) en vez de pulsarse; `estado.marcados` (un objeto, clave
  `categoria + '|' + nombre`, fuera de `buscar()`) sobrevive a cambiar de búsqueda y de
  categoría. Devuelve `{ marcar(lista), marcados() }` para que quien llama pueda señalar desde
  fuera (los atajos, un grupo entero); en el modo de siempre no devuelve nada.
- La barra fija (`#rel-marcados-barra` / `.marcados-barra`) enseña la cuenta, el botón "Añadir los
  N señalados" (llama a `alElegir` UNA VEZ, con la lista entera) y un chip por señalado con su ×
  para quitarlo sin tener que volver a buscarlo — es la única forma de quitar uno que no salga
  en ningún resultado (un miembro de un grupo que ya no está en las listas).
- **Miembros perdidos**: si `marcadosIniciales` trae uno sin `persona` (los de un grupo guardado,
  que solo llevan `{ categoria, nombre }`), se resuelve contra `Datos.cargar` de su categoría
  (`resolverPerdidos`, una lectura por categoría, no una por miembro); si no aparece, se marca
  `perdido: true` y el chip sale en gris (`.marcado-chip-perdido`) con su aviso, sin quitarse
  solo. Los que traen `persona` (los atajos, ya resueltos) no se comprueban.
- `App.textoTercero(p)` es el nombre canónico que se guarda (igual que el modo de siempre): un
  miembro se identifica por `categoria + nombre`, nunca por el objeto `persona`.

**Los atajos de alumnado** (`Nombres.nivelYEnsenanza(unidad)`, en `js/nombres.js`): reutiliza el
mismo análisis de texto que `grupoCompacto` (`etapaDe`, `sinPalabrasDeEtapa`, sacadas a función
para no duplicarlo), y devuelve `{ nivel: '1º', ensenanza: 'E.S.O.' }` (`Bachillerato`,
`Formación Profesional` o `PMAR` cuando la etapa se escribe). Los tres filtros —unidad, nivel,
enseñanza— viven en `js/relacionados.js` (`filtrarPorUnidad`, `filtrarPorNivel`,
`filtrarPorEnsenanza`; exportados y sin efectos), y los reutiliza también `js/correo.js`: solo
entra el alumnado `matriculado` de este curso (`Datos.unidadesDistintas` ya filtra por eso), y
elegir un atajo solo señala, no añade nada todavía.

**Grupos propios**, `js/grupos.js` (`window.Grupos`), decimotercer fichero compartido
(`_GESTOR/grupos.json`, ver la tabla de ficheros): `{ grupos: [{ id, nombre, miembros: [{
categoria, nombre }], creadoPor, creadoEl }] }`. `Grupos.guardar()` relee el disco y fusiona por
`id` antes de escribir (como `App.fusionarConDisco`, pero para el fichero envuelto en `{ grupos:
[...] }` en vez de una lista suelta). Bloque "Grupos de personas" en Ajustes (`js/ajustes.js`,
`App.pintarGruposPersonas`), mismo aire que tipos/estados/tipos de documento: crear, cambiar el
nombre, "Ver y cambiar los miembros" (abre el buscador en modo `multiple` con
`marcadosIniciales: g.miembros`, y al pulsar "Añadir" **sustituye entera** la lista de miembros,
no la suma: así también se puede QUITAR a alguien) y borrar por papelera
(`Papelera.mandarDato('grupo', ...)`, con `devolverGrupo` en `js/papelera.js` delegando en
`Grupos.devolver`).

**En Relacionados**: "+ Añadir varios" (arriba) abre el buscador `multiple` con, encima, los tres
atajos de alumnado (solo si la categoría elegida es ALUMNADO) y "Meter un grupo entero"
(desplegable con los grupos de `Grupos.lista()`); elegir uno de los dos solo señala.
`Relacionados.combinarRelacionados(actuales, categoriaPrincipal, terceroPrincipal, candidatos)`
(sin efectos) decide qué entra: nunca el propio tercero del asunto, nunca un duplicado exacto
(por `categoria` + nombre normalizado) de lo que ya había; sin preguntar uno a uno como
`validarYAgregar` (con veinte señalados serían veinte cuadros). Un aviso final resume añadidos,
ya-estaban y propio-tercero.

**En Correo** (`js/correo.js`): desplegable "Añadir un grupo" (grupos propios + los mismos
atajos de alumnado, con `<optgroup>`), solo en el cuadro de correo normal (no en el de Séneca).
Decisión de Francisco, 17-sep-2026: los destinatarios de un grupo van **siempre en copia oculta**,
nunca en Para, para que una familia no vea el correo de las demás.

- `combinarCorreosDeGrupo(miembrosConPersona)` (sin efectos): de cada miembro saca TODOS sus
  correos (`correosDe`, la misma máquina que ya usa "Para": busca la arroba en cualquier columna,
  no por título), sin repetidos (por dirección en minúsculas); quien no tenga ninguno va aparte,
  en `sinCorreo`.
- `resolverMiembros(miembros)` busca la ficha de cada uno que no la traiga ya puesta (los atajos
  sí, los de un grupo guardado no: solo llevan `{ categoria, nombre }`), una lectura de
  `Datos.cargar` por categoría, no una por miembro.
- La caja `#correo-cco-caja` pinta la cuenta, un chip por dirección (con su × — `js/correo.js`
  guarda el estado en `cco`, un objeto tipo `Set`) y la línea "N no tienen correo: …" si hace
  falta. `ccoDelCuadro()` es a `cco` lo que `paraDelCuadro()` es a "Para".
- `abrirGmail()`/`abrirDelOrdenador()` añaden `&bcc=...` cuando hay copia oculta. Si el borrador
  se prepara con documentos (`js/correo-adjuntos.js`, `.envio.json`), el campo nuevo `cco` viaja
  igual que `para` (`ccoActual()`, misma técnica que `paraActual()`: se lee del propio DOM, de
  los chips, para no exponer nada solo para esto).
- **Apps Script** (`apps-script/gestor-correos.gs`, `mandarUnBorrador`): `opciones.bcc =
  encargo.cco` cuando lo trae; si no hay nadie en "Para" pero sí hay `cco`, el destinatario es
  `Session.getActiveUser().getEmail()` (Gmail no admite un borrador sin nadie en Para). **Hay que
  volver a pegar el script en `script.google.com`.**

Fuera de esta fila, a falta de datos que la aplicación no tiene: departamentos, tutorías y
equipos educativos (`personal.csv` no guarda esa información).

Se comprueba con `pruebas/grupos.mjs` (sin navegador: `nivelYEnsenanza`, los tres filtros,
`combinarRelacionados`, `combinarCorreosDeGrupo`) y `pruebas/grupos-navegador.mjs` (navegador de
verdad: un miembro perdido se conserva y se ve distinto, señalar no se pierde al cambiar de
categoría ni de búsqueda, "Meter un grupo entero" en Relacionados, "Añadir un grupo" en Correo).

### Los campos de cada tipo de asunto

Cada tipo de asunto puede llevar sus propios campos: datos ya presentes en los ficheros (unidad,
modalidad, puesto, NIF...) o creados a mano, que salen solos y ya rellenos al crear el asunto.

- **Catálogo por categoría** (`js/campos.js`, `Campos.catalogoDeCategoria`):
  - **De fichero**: la cabecera del CSV de la categoría (no `p.campos`, que solo trae columnas
    con datos). `Datos.cargarLista` (`js/datos.js`) devuelve `.cabecera` para las cuatro
    categorías.
  - **Calculados**: por ahora uno, Curso (`Campos.calcularCurso`), la unidad sin su última letra
    ni el espacio que deja al quitarla (`1ºA`→`1º`, `1ºBachA`→`1ºBach`, `2ºFPB B`→`2ºFPB`),
    aplicado sobre la forma compacta del grupo (`Nombres.grupoCompacto`).
  - **Propios**: creados en Ajustes (texto libre o lista cerrada), válidos para cualquier
    categoría; pasan por la guardia de duplicados (quinta puerta).
- **Se guarda** en `_GESTOR/campos.json`: `propios` (con su clase y valores) y `porTipo`
  (indexado como `tipos.json`), que solo guarda `origen`, `columna` o `id`, `obligatorio` y
  `enNombre` — **no** copia clase ni valores de un campo propio: quien lo pinta
  (`js/asuntos-nuevo.js`, `js/asuntos-editar.js`) lo busca en `propios` con `Campos.propioDe`,
  así un cambio en los valores se ve en todos los tipos que lo usan.
- **Configurar los campos de un tipo**: en Ajustes, botón "Campos" por tipo
  (`App.abrirCamposDeTipo`), con los ya puestos arriba (flechas para ordenar, casillas
  Obligatorio y Añadir al nombre) y el catálogo abajo, con buscador. Un campo nuevo del catálogo
  nace con las dos casillas sin marcar. Bloque "Campos propios" para verlos y borrarlos todos
  juntos; al borrar uno en uso, avisa y dice en qué tipos está (`Campos.tiposQueUsanPropio`).
- **Al crear un asunto**: bloque "Datos del asunto" con los campos del tipo ya rellenos
  (`Campos.valorInicial`); un dato vacío no es un error, sale en blanco y se puede escribir a
  mano. Obligatorio bloquea hasta rellenar. La vista previa del nombre se actualiza al escribir.
- **Al editar** (`App.pintarCamposEditar`): mismos campos con lo guardado; si cambia algo que va
  al nombre, la carpeta se renombra. El cuadro lleva la clase `cuadro-alto` (scroll interno).
- **En la ficha del asunto**: los campos con valor salen entre la descripción y el estado.
- Un tipo sin campos configurados se comporta igual que antes de esto; los asuntos creados antes
  se quedan sin campos.
- La clave de un campo es `fichero:<columna>` o `<origen>:<id>` (`Campos.claveDeCampo`).

Se comprueba con `pruebas/campos.mjs` (ocho escenarios más la edición).

### Que no se dupliquen los asuntos

- **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto): si ya hay
  uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico (el grupo y el
  texto libre **no cuentan**), se para del todo: cuadro "Este asunto ya existe", con "Abrir el
  que ya existe" (a la ficha si está abierto, o a su carpeta del ARCHIVO si está archivado) o
  "Crear otro de todas formas". Si a alguno de los dos le falta el año académico, cuenta como
  coincidencia (`Duplicados.coincideCurso`).
  - Con varios candidatos abiertos, el de partida es el más reciente
    (`Duplicados.candidatoMasReciente`).
  - Todo envuelto en `try/catch`: **la comprobación nunca debe impedir crear un asunto**; si
    falla al mirar, se sigue como si no hubiera nada.
- **Unir dos que ya existen** (`js/unir-asuntos.js`), desde la pantalla propia "Duplicados" (ver
  más abajo): se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro
  se mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final),
  los pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra.
  Si algún fichero choca de nombre entre las dos carpetas, no se mueve ni se borra nada, y avisa
  de cuáles.
- Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir), cargado justo
  después de `js/asuntos-lista.js` (define `App.pintarAbiertos`).

Se comprueba con `pruebas/duplicados.mjs`.

### La pantalla propia "Duplicados"

- Aviso de una línea junto al botón Actualizar de Asuntos abiertos: `⚠ N posible(s)
  duplicado(s) — Revisar` (`#btn-duplicados`, oculto sin ninguno).
- Pantalla propia "Duplicados" (no está en la barra lateral), con botón Volver. Cada grupo en
  columnas: nombre de la carpeta (enlaza a su ficha), fecha de apertura / estado / vía / fecha
  límite, documentos (se abren con `Visor.abrir`) y las tres últimas notas ("y N más" si hay
  más).
- Botón Unir, igual que siempre.
- Botón "No son el mismo": descarta el grupo por la firma exacta de sus nombres (ordenados y
  unidos) en `_GESTOR/no-duplicados.json`. Si el grupo cambia de miembros, la firma deja de
  coincidir y el aviso vuelve a salir solo.
- Reversible en Ajustes: bloque "Duplicados descartados", con "Volver a avisar" por entrada.
- Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`), sin tocar
  `js/ajustes.js` ni la barra: la pantalla y el bloque de Ajustes los crea el propio módulo
  (`App.PANTALLAS.push`, enganchado con `window.Gestor.alRefrescar`).
- `no-duplicados.json` entra en las copias de seguridad de `js/copias.js`.

Se comprueba con `pruebas/duplicados.mjs`.

### Ajustes ágiles: tipos, estados y tipos de documento

**Bloque "Tipos de asunto"** (`js/ajustes.js`, `css/ajustes.css`):

- **Una sola categoría a la vez.** `#tabla-tipos` obedece al desplegable `#nueva-categoria`, se
  recuerda en `localStorage` (`gestor-ajustes-categoria`). Estado en `App.E.categoriaAjustes`,
  se cambia con `App.cambiarCategoriaAjustes(cat)` (sincroniza desplegable y pestañas).
- **Cuatro pestañas** (`App.pintarPestanasTipos`): ALUMNADO · PERSONAL · EMPRESAS · OTROS, con
  su cuenta; pestaña y desplegable van siempre de acuerdo.
- **Buscador cruzado** (`#buscar-tipos`): con dos letras o más, `App.pintarTiposAjustes` mira
  las cuatro categorías a la vez, cada resultado con su etiqueta (`.marca-categoria`). Mientras
  se busca, las pestañas se apagan (`.apagadas`) y sale "Buscando en todas las categorías · N
  resultados" (`#tipos-buscando-info`).
- **Aviso en vivo** al escribir un nombre nuevo (`App.pintarAvisoNuevoTipo`, `oninput` de
  `#nuevo-tipo`, sobre `U.parecidos`/`U.dejaCrear`): si ya existe, línea roja "Ya existe: X, en
  CATEGORIA", botón Añadir apagado y enlace "Verlo" (`App.verTipoEnAjustes`) que cambia de
  categoría y destella la tarjeta; si solo se parece, línea ámbar con los parecidos, sin apagar
  el botón. Igual, más simple, para estados (`#aviso-nuevo-estado`) y tipos de documento
  (`#aviso-nuevo-tipo-doc`), con `App.pintarAvisoSimple`.
- **Rejilla de tarjetas**, no filas: `#tabla-tipos`, `#tabla-estados` y `#tabla-tipos-documento`
  son `.rejilla-tipos` de tarjetas `.tarjeta-tipo` (`grid-template-columns:
  repeat(auto-fill,minmax(300px,1fr))`), cada una con un menú de tres puntos
  (`App.botonMenuTarjeta`): Campos / Cambiar el nombre / Quitar (tipos), Cambiar el nombre /
  Quitar (estados, que conservan sus flechas de orden fuera del menú), Quitar (tipos de
  documento). Quitar siempre pide confirmación.
- Ajustes sube su tope a 1600px (`#pantalla-ajustes`, `css/vista.css`); Nuevo asunto conserva
  940px. Los párrafos de explicación no pasan de 90 caracteres (`max-width: 90ch`).

**Llegar a Ajustes sin bajar la página**: la barra lateral queda fija (`position:fixed`, con su
propio `overflow-y:auto`); Ajustes va en la lista de pestañas, tras "Personas y empresas",
separado por `.separador-lateral`; con la barra plegada, el icono de rueda dentada
(`#btn-barra-ajustes`, `js/barra.js`) lleva directo a Ajustes.

Se comprueba con `pruebas/ajustes-agil.mjs`, a 1905 píxeles.

### El cuadro de elegir asunto, y "Por clasificar"

El cuadro para escoger un asunto a mano vive en **`js/elegir-asunto.js`** (`window.ElegirAsunto`)
y lo usan dos sitios: la bandeja de correos ("Elegir asunto") y "Por clasificar" ("Meter en un
asunto"). Se carga antes que `js/documentos-sueltos.js`, `js/bandeja-enlace.js` y
`js/papelera.js`.

- `elegir({titulo, cabecera, sugeridos})` monta el cuadro sobre `#capa`, con "Podrían encajar"
  arriba (solo si hay) y "Todos los asuntos" debajo, con buscador (`#enlace-buscar`,
  `#enlace-todos`), abiertos primero y archivados después con su etiqueta. Devuelve
  `{nombre, ficha}` o `null`. **La puntuación no se calcula aquí**: cada sitio mide su propio
  parecido y le pasa `sugeridos` ya hecho, porque de un correo se sabe mucho más que del nombre
  de un fichero.
- `preguntarSiReabrir(elAsunto, {explica, reabrir, sinReabrir})` es el cuadro de "Ese asunto
  está archivado", con los textos de cada sitio. Se abre cuando el otro ya está cerrado.
- Piezas comunes de puntuación: `trozosDelTercero`, `terceroDentroDe`, `puntosPorPalabras`,
  `puntosDeBase` (+15 abierto, +10 movido en 30 días), `mejores` (los que pasan de 40 puntos,
  como mucho cinco). Y `carpetaDelAsunto(nombre, ficha)`, que baja al ARCHIVO si está archivado.

**"Meter en un asunto"** (`App.meterSueltoEnAsunto`, en `js/documentos-sueltos.js`) es el tercer
botón de cada tarjeta de "Por clasificar", entre "Crear asunto con él" y "Borrar" (este último
se lo pone `js/papelera.js` por envoltura). Su puntuación solo tiene el nombre del fichero: +10
por cada palabra de cuatro letras o más (sin extensión, sin la fecha AAMMDD de delante y sin el
código de registro) que esté en el nombre del asunto, +40 si el nombre del tercero del asunto
sale en el nombre del fichero, +15 abierto y +10 movido hace poco.

El traslado (`App.llevarSueltoA`) usa `Carpetas.moverFichero`, que copia, comprueba que la copia
pesa lo mismo y solo entonces borra: en Dropbox el `move()` del navegador no vale. Si ya hay un
fichero con ese nombre en el destino **no se pisa**; si la ruta pasa de
`App.LARGO_MAXIMO_NOMBRE` (180) se avisa y se deja decidir; si el traslado falla, el documento
sigue en "Por clasificar" y se dice con una línea. Si sale bien, se abre el cuadro de ponerle
nombre (`App.verDocumentos`), igual que al crear un asunto con un documento. Si el asunto
elegido está archivado se ofrece "Reabrir y meterlo aquí" (`App.reabrirAsunto`) o "Meterlo sin
reabrir", y entonces el fichero va a la carpeta del asunto dentro del ARCHIVO.

Se comprueba con `pruebas/documentos-sueltos.mjs`.

### "Por clasificar": el documento a la vista, marcado en la lista

(17-sep-2026, fila 25). Al abrir un documento suelto en el panel de la derecha, su tarjeta en la
lista de la izquierda queda marcada (`.tarjeta-abierta`, fondo y borde), la lista se desplaza sola
hasta ella si hace falta, y la cabecera del panel enseña su nombre completo (cortado por el medio,
no por el final, si no cabe: así se ve la extensión). Debajo de la cabecera van los mismos botones
de la tarjeta —Crear asunto con él, Meter en un asunto, Borrar—, y al terminar una acción el panel
se cierra solo si el documento ya no está en "Por clasificar".

- **`js/visor.js` no sabe nada de "Por clasificar"**: solo lleva un `marcador` (un texto
  cualquiera que pone quien abre, aquí `'suelto:<nombre>'`) y avisa (`Visor.alCambiar(fn)`) cada
  vez que cambia, al abrir o al cerrar. `Visor.marcadorAbierto()` lo devuelve en cualquier
  momento. `Visor.abrir(handle, nombre, {marcador, acciones})` acepta los dos como opcionales: sin
  ellos se comporta exactamente como antes (así lo siguen usando `js/ficha-asunto.js` y
  `js/unir-asuntos.js`, sin marcador ni acciones). `acciones` es un elemento que se cuelga en un
  hueco nuevo bajo la cabecera (`#visor-acciones`, `css/visor.css`).
- **`js/documentos-sueltos.js` traduce el marcador a la tarjeta de verdad**: se engancha a
  `Visor.alCambiar` (esperando a `DOMContentLoaded`, porque `js/visor.js` se carga después) y, con
  cada aviso, quita `.tarjeta-abierta` de todas y la pone en la que tenga
  `dataset.suelto === nombre`, con `scrollIntoView({behavior:'smooth', block:'nearest'})`. Al
  repintar la lista entera (`App.pintarSueltos`), cada tarjeta nace ya con la clase puesta si le
  toca, sin esperar al aviso.
- **Las acciones del panel no duplican nada**: `App.accionesDeSuelto(s)` construye la tarjeta
  entera con `App.tarjetaSuelto` (que a esa altura ya lleva el botón "Borrar" que le cuelga
  `js/papelera.js` por envoltura), le quita el botón "Abrir" —huelga, ya se está viendo— y
  devuelve su `.acciones`. Un solo sitio con la lógica de los tres botones.
- **El cierre solo si ya no está**: `App.pintarSueltos` empieza siempre comprobando si el
  marcador abierto es un `'suelto:...'` que ya no aparece en `App.E.sueltos`, y si es así llama a
  `Visor.cerrar()`. Como `App.verAbiertos` (que releva `App.E.sueltos` y llama a
  `App.pintarSueltos`) ya se llama tras crear un asunto, meter el documento en uno o borrarlo, no
  hace falta tocar esas tres acciones para nada.
