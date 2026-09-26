# Generar el documento de Word, separar/unir un PDF y ajustar su tamaño para el sello y la firma

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar las plantillas de Word, o separar/unir/ajustar tamaño de un PDF. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Plantillas de documento de Word

El gemelo en papel de las de correo (16-sep-2026, `docs/PLANTILLAS-DE-DOCUMENTO.md`, fila 17 de
`docs/COLA.md`): un botón **Generar documento** en la ficha de un asunto saca una copia de un
`.docx` con los huecos rellenos, ya guardada en la carpeta del asunto, sin preguntar nada.

**Las del centro, en `plantillas/`** (filas 83 y 170): 44 de documento, 34 de ellas sacadas de los
documentos del compañero (`docs/PLANTILLAS-DEL-COMPANERO.md`), cada una colgada de un tipo que ya
existe; los datos que piden con `{campo:…}` y el tipo no tiene se preguntan al generar. Llegan a
`_GESTOR/PLANTILLAS` con «Cargar las plantillas del centro» (Mantenimiento). `participacion-
actividad.md` (OTROS · ACTIVIDAD EXTRAESCOLAR) se genera con «… para cada relacionado» de la mesa
(fila 171, `docs/contexto/HITO-MESA.md`: uno por profesor, con `Plantillas.valoresDePersona`); `peticion-historial.md` saca el centro de procedencia de la BD del alumnado
(`{{DATO ALUMNADO BD: Centro de procedencia}}`).

- **El fichero**: mismo `_GESTOR/plantillas.json` que las de correo, con la clave de raíz nueva
  `documentos`: `[{ id, categoria, tipo, nombre, fichero, tipoDocumento, texto }]`. Una misma
  plantilla puede colgar de varios tipos, cada uno con su propia fila. `limpio()` la normaliza
  como la `lista` de correo: un fichero viejo sin esa clave sigue cargando con `documentos: []`.
  Junto a `firma` y `centro` se guardan cuatro claves de raíz más, editables en el mismo bloque de
  Ajustes de "Plantillas de correo": `localidad`, `direccion`, `codigo`, `cargo` (del centro).
- **Los `.docx` viven en `_GESTOR/PLANTILLAS`**, sin subcarpetas, dentro de la carpeta de asuntos
  abiertos (`Carpetas.crear(App.E.gestor, 'PLANTILLAS')`, que la crea si no existe). Francisco los
  sube a mano a esa carpeta de Dropbox; la aplicación nunca escribe ahí, solo lee y cuelga el
  nombre del fichero de un tipo en Ajustes. No es ninguno de los diecisiete ficheros compartidos: no
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

### El masculino o el femenino, solo (24-sep-2026, fila 111, `docs/GENERO-EN-PLANTILLAS.md`)

Las plantillas (Word, correo, Séneca) se escriben con las formas dobles de siempre: «el/la
alumno/a», «D./Dña.», «interesado/a». Al rellenar queda solo la que toca. Un solo sitio,
`js/genero.js` (`Genero.resolver(texto, sexos)`, pura), llamado desde `Plantillas.rellenar` **antes**
de sustituir los huecos (así no toca los datos que entran) y solo si `valores.sexos` existe (la vista
previa de Ajustes no lo trae y no cambia nada).

- **Qué reconoce**: pares conocidos (el/la, los/las, del/de la, al/a la, un/una, D./Dña., Don/Doña,
  Sr./Sra., padre/madre, él/ella, este/esta, hijo/hija…) y palabras terminadas en «/a» o «/as»
  (alumno/a, profesor/a, jefe/a, alumnos/as, profesores/as). Mayúscula inicial respetada. **No
  toca**: fechas, «y/o», fracciones, registros, direcciones web, correos, rutas ni lo que está entre
  llaves.
- **De quién**: por defecto, del tercero. Para otra persona, la marca pegada detrás: `:tutor1`,
  `:tutor2`, `:firmante`, `:vistobueno` («hijo/a:tutor1»). Un cargo con barra («Director/a»,
  «Secretario/a», «Jefe/a»…) y el artículo justo delante son de quien firma sin marcar nada. El
  `{{TRATAMIENTO FIRMANTE}}` con barra se resuelve en `valoresDeAsunto` con el sexo del ocupante.
- **Sin el dato**: la forma se queda tal cual, con su barra (nunca una por defecto), y entra en
  `faltan` diciendo dónde ponerlo (`Genero.dondePonerlo`): sale en el aviso ámbar de siempre.
- **De dónde sale el sexo** (`Genero.sexosDeAsunto`): alumno y tutores, la columna «Sexo» del
  RegAlum (`Datos.tutoresDe`); los demás, la casilla «Sexo, para las plantillas» de «Datos y
  contacto» (no sale si el fichero ya lo trae, ni para empresas), guardada en `_GESTOR/sexos.json`
  por documento o nombre; cargos, el campo `sexo` de cada ocupante (`cargos.json`, desplegable en
  «Cargos del centro») o, si no, lo que diga el tratamiento («La Directora» → mujer).
- **En el Word**, `repararHuecosPartidos` junta también las formas dobles partidas en varios trozos.

Se comprueba con `pruebas/genero.mjs`.

### Los cargos del centro, quién firma y el membrete (20-sep-2026, fila 81, `docs/FIRMANTES-Y-MEMBRETE.md`)

Un documento generado sale ahora con la firma de quien ocupaba el cargo **en la fecha del
documento** (no quien lo ocupe hoy) y con membrete, sin que la imagen tenga que llevar el nombre
de la Consejería escrito dentro.

- **`_GESTOR/cargos.json`** (decimoséptimo fichero compartido, ver `js/copias.js`):
  `{ cargos: [{ id, nombre, orden, tratamiento, ocupantes: [{ id, persona, desde, hasta }] }] }`.
  `js/cargos.js` (`window.Cargos`): `enFecha(idCargo, fecha)`/`vigente(idCargo)` (texto
  `AAAA-MM-DD`, sin objetos `Date`), `solapes(cargo)` (aviso, nunca impide guardar), y el alta,
  edición y borrado de cargos y de sus ocupantes. Sin fichero, nace con seis cargos de fábrica sin
  ningún ocupante (Dirección, Vicedirección, Jefatura de Estudios, Secretaría, Administración,
  Orientación). El borrado de un cargo pasa por `Papelera.botonBorrar` (clase `'cargo'`, que
  `js/papelera.js` tampoco sabe devolver, como `'plantilla'`). La pantalla, bloque **Ajustes → El
  centro → Cargos del centro**, vive en el mismo fichero (`Cargos.pintarEnAjustes`, mismo criterio
  que `js/recurrentes.js`: el modelo y su pantalla juntos, sin un "-ajustes.js" aparte).
- **Cada plantilla de documento** (`documentos[]` de `plantillas.json`) gana `firmante` y
  `vistoBueno`: el `id` de un cargo, o vacío. Se eligen en dos desplegables nuevos del alta/edición,
  en Ajustes → Plantillas de documento.
- **Huecos nuevos** en `Plantillas.HUECOS`, con doble llave (como `{{LO QUE FALTA}}`, resueltos
  aparte de los de una sola llave, antes de que `Plantillas.rellenar` los vea, para que un nombre
  con espacio como "CARGO FIRMANTE" no deje llaves sueltas en el papel): `{{FIRMANTE}}`,
  `{{CARGO FIRMANTE}}`, `{{TRATAMIENTO FIRMANTE}}`, `{{VISTO BUENO}}`, `{{CARGO VISTO BUENO}}`,
  `{{TRATAMIENTO VISTO BUENO}}`, `{{CONSEJERIA}}`. `Plantillas.valoresDeAsunto(asunto, opciones)`
  gana un segundo argumento opcional `{ fecha, plantilla }`: sin él, como hasta ahora (sin
  firmante). `js/plantillas-documento.js` pasa `{ fecha: hoy, plantilla: plantillaDoc }` al generar,
  y resuelve el firmante/visto bueno con `Cargos.enFecha` en esa fecha; sin ocupante en esa fecha,
  el hueco se queda vacío y sale en "faltan", como cualquier otro dato que no haya.
- **El membrete** (desde la fila 149, 25-sep-2026, `docs/MEMBRETE-LETRA-DEL-MANUAL.md`): lo dibuja
  entero la aplicación con el manual de la Junta; ya no se sube ninguna imagen de base
  (`membrete.png`, si queda, no se usa ni se borra; `membreteCaja` se ignora). Lienzo PNG de
  2480 × 400, todo en proporción a S = 270 (la altura del símbolo): el símbolo
  (`img/junta-andalucia-simbolo.svg`) a 60 px del borde; los textos 0,20·S a su derecha: «Junta de
  Andalucía» (Noto Sans HK 700, `#221E1B`, 0,244·S, base a 0,465·S), la Consejería (`consejeria` de
  `plantillas.json`; vacía, «Consejería de Educación»; 400, `#221E1B`, 0,144·S, base a 0,735·S) y el
  centro (el mismo `centro` de «Datos del centro y firma», en MAYÚSCULAS; 400, `#017836`, 0,111·S,
  base en la base del símbolo). Un texto que no cabe antes del 72 % del ancho va en dos líneas
  (0,20·S entre ellas) y el bloque sube; si ni así, letra más pequeña. El logo del centro
  (`_GESTOR/PLANTILLAS/logo-centro.png`, opcional; se sube y se quita —a la papelera— en Ajustes →
  El centro → Membrete) a la derecha, alto S + 20 (o 25 % del ancho si es muy ancho). Cada plantilla
  de documento lleva «Con el logo del centro» (`conLogoCentro`; sin la clave, sí); sin marcar, la
  derecha en blanco y el mismo lienzo. `js/membrete.js` (`window.Membrete`):
  - `componer({ consejeria, centro, logo: { ancho, alto }, conLogo, medir })`, SIN EFECTOS: dónde va
    cada cosa (`lienzo`, `simbolo`, `textos`, `logo`); sin `medir`, estima 0,56 × tamaño por carácter.
  - `dibujar({ consejeria, centro, logo, conLogo })` pinta en un `<canvas>` (la vista previa en vivo
    de Ajustes la usa con lo aún no guardado) y `montar({ conLogoCentro })` lee Ajustes y el logo;
    los dos devuelven `{ bytes, ancho, alto, conNoto, plan }`. La letra
    (`fonts/NotoSansHK-latin-400/700.woff2`, recortada a latín, licencia en `fonts/OFL.txt`) y el
    símbolo se leen con `App.leerFicheroDeLaApp` (valen en la copia sin internet) y se cargan una
    sola vez (`FontFace`); si la letra falla, Arial; si el símbolo falla, `montar` da `null` y el
    documento sale sin membrete.
  - **`Docx.ponerImagen(bufferDocx, nombreHueco, bytesPng, anchoPx, altoPx)`** (`js/docx.js`), antes
    de `rellenar`: busca el párrafo `{{MEMBRETE}}` en `word/document.xml` y en cada
    `word/headerN.xml` (reparando huecos partidos entre varios `<w:t>` igual que `rellenar`) y lo
    sustituye por un párrafo con un `<w:drawing>` en línea, a 17 cm de ancho (el ancho útil de un A4
    con márgenes normales) y el alto en proporción. Añade `word/media/membrete.png` al ZIP, la
    relación que le toque (creando el `.rels` de cero si el `.docx` no traía ninguno, con un `Id`
    libre `rIdMembreteN`) y `<Default Extension="png".../>` a `[Content_Types].xml` si falta. Si el
    hueco no está en ningún sitio, no toca nada. `js/plantillas-documento.js`, al generar: monta el
    membrete y lo mete con `Docx.ponerImagen` antes de rellenar los huecos de texto.

Se comprueba con `pruebas/cargos.mjs` (sin navegador, fechas contadas desde hoy: un ocupante único,
dos en cadena, una fecha anterior a todos, un hueco entre dos, un solape, un cargo vacío),
`pruebas/membrete.mjs` (fila 149: `componer` sin navegador —medidas, Consejería larga, logo— y,
con navegador, el dibujo, el logo, `conLogoCentro` al generar y la letra que no carga) y un escenario nuevo de `pruebas/plantillas-documento.mjs` (`{{MEMBRETE}}`
dentro del ZIP con su relación creada de cero, y `{{FIRMANTE}}`/`{{TRATAMIENTO FIRMANTE}}` resueltos
con el ocupante de la fecha).

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
  Registrar (`RegistroSellado.nombreParaSello`, misma fórmula que `registro.js`)—, y se apunta la
  nota de registro con `Notas.sustituir`. No se crea ningún fichero nuevo. Si el nombre nuevo ya
  existe en la carpeta, avisa y no toca nada (`RegistroSellado.hayColision`). **El documento
  original ya no va a la papelera** (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 4:
  antes de eso, si el registro salía mal había que volver a escanear): se queda en la misma
  carpeta, también renombrado, con "SIN SELLAR" al final del nombre, antes de la extensión
  (`RegistroSellado.nombreSinSellar`); si ese nombre ya existiera, se numera "(2)", "(3)"…
  (`RegistroSellado.nombreLibreEntre`, sobre la lista ya leída, sin volver a tocar el disco). En
  la lista de documentos de la ficha (`js/ficha-documentos.js`) el que lleva "SIN SELLAR" sale en
  gris claro (`.ficha-documento-sinsellar`), para no confundirlo con el sellado.
- **`Notas.sustituir(asunto, texto, campoClave, valorClave, extra)`** (nueva, `js/notas.js`): como
  `Notas.anadir`, pero si ya hay una nota con ese mismo `campoClave`/`valorClave` la sustituye en
  su sitio en vez de añadir otra debajo. El registro de un documento (aquí y en `js/registro.js`,
  que también se ha pasado a esto) usa `campoClave: 'registroDeDocumento'`, `valorClave` el nombre
  del documento original: registrar dos veces el mismo documento deja una sola nota, no dos.
- **El botón "Registrar" a mano hace lo mismo con el original** (26-sep-2026, fila 174,
  docs/POR-CLASIFICAR-USA-LO-LEIDO.md, punto 6): `js/registro.js` (`guardar`) llama a las mismas
  `RegistroSellado.nombreSinSellar`/`nombreLibreEntre` y a `VersionesPrevias.mover`, solo si el
  fichero elegido en el selector es distinto del original (si se elige el mismo que ya estaba en
  la carpeta, no se toca nada más). Es accesorio: si falla, el registro de arriba ya está hecho.
- **"Datos y contacto" y la caja de notas (fila 37, 17-sep-2026,
  `docs/FICHA-DEL-ASUNTO-NUEVA.md`)**: la ficha queda izquierda Hitos y Documentos, derecha "Datos
  y contacto" (primero), Otros asuntos, Relacionados, Datos del asunto y Notas (última);
  `body.con-visor`/`body.con-lector`, o por debajo de 1000px, una sola columna en ese orden del
  DOM. `Datos.tutoresDe(alumno)` (`js/datos.js`) agrupa los tutores legales de Séneca —hoy vienen
  columna a columna y mezclados, tal como los vuelca `Datos.destacadosAlumno`— leyendo el título
  de cada columna que case con `/tutor|padre|madre|responsable|familia/`: el número de tutor sale
  de un dígito o de "primer"/"segund" en cualquier parte del título, y la clase de dato de la otra
  mitad (nombre, teléfonos, correos, documento, relación; lo que no case va a `otros` de esa
  tarjeta). Una columna de familia sin número reconocible no se pierde: cuelga de `.otros` del
  propio array que devuelve (una propiedad más, aparte de sus índices), para "Otros datos de la
  familia". `Datos.resumenDeTercero(persona, categoria)` monta los datos de la línea (nombre,
  grupo o etiqueta de estado, edad, un solo teléfono etiquetado y documento); para un alumno menor
  el teléfono es el del primer tutor ("Tutor legal 1", mismo texto que ya usa `js/lo-pide.js`
  mientras Séneca no dé el parentesco de verdad), para un mayor de edad o para personal/empresas es
  el propio. El aviso de DNI que falta lo sigue decidiendo `js/dni.js`, sin duplicar esa cuenta.
  Todo esto se pinta desde `js/ficha-tercero.js` (`window.FichaTercero.pintarLinea(caja, a)`), que
  no toca `js/copiar.js` (es privado a sus propias pantallas) y rehace en pequeño su mismo botón de
  copiar. La caja de notas (`Notas.pintarEnFicha`, `js/notas.js`) lleva botón **Guardar**: hasta la
  fila 58 (18-sep-2026, docs/AJUSTES-DE-USO-2026-09-18.md, 3) se guardaba sola con un retardo de un
  segundo desde la última tecla, y Francisco veía la nota guardada antes de terminar la frase. Ahora
  **no** se guarda mientras se escribe: solo al pulsar Guardar, o al perder el foco el recuadro si
  hay algo escrito (`guardarBorrador`, encadenada por promesa —no un simple booleano— para que dos
  disparos casi a la vez, por ejemplo perder el foco justo al abrirse el aviso de abajo, no se
  pisen ni se salten uno al otro sin esperar). Sigue metiendo el texto en la MISMA nota mientras la
  ficha se repinta sola por debajo (`sustituirNota` con una clave de sesión, `borradorAbierto`;
  `App.abrirFicha` llama a `Notas.olvidarBorrador()` para que la próxima ficha que se abra empiece
  una nota nueva). Si se intenta salir de la ficha (botón "← Volver" o Escape) con texto sin
  guardar, `Notas.confirmarSalirDeFicha()` avisa antes: "Tienes una nota sin guardar", con
  *Guardar y salir* (espera al guardado, después vuelve) / *Salir sin guardar* (se pierde lo
  escrito). No hay botón "Escribirle" en las tarjetas de tutor: `js/correo.js` no expone ninguna
  función pública para abrir su cuadro con un destinatario puesto (su `abrirCuadro` es privado a su
  propio IIFE), y tocar ese fichero se salía de esta fila.
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
- **pdf.js va copiado en el repositorio**, en `js/lib/pdf.min.mjs` y `js/lib/pdf.worker.min.mjs`
  (versión 4.10.38 desde la fila 132, antes 4.2.67, del `build/` de `pdfjs-dist`, no de `legacy/`; sube desde la 3.11.174 en la fila
  72, docs/DETALLES-DE-MANTENIMIENTO.md, punto 5, que tenía el CVE-2024-4367). No se carga de
  ninguna dirección externa, y solo se trae la primera vez que hace falta. Desde la 4.x pdf.js solo
  se distribuye como módulo, así que los tres sitios que lo cargan (`js/registro-lector.js`,
  `js/pdf-separar-unir.js`, `js/preparar-documento.js`) usan `import()` en vez de una etiqueta
  `<script>`.

Se comprueba con `pruebas/registro.mjs` (con un PDF mínimo montado por la propia prueba, con el
texto del sello dentro: el PDF real con datos personales no está en el repositorio).

### Separar, unir y sacar páginas de un PDF (17-sep-2026, fila 22, docs/SEPARAR-Y-UNIR-PDF.md)

Tres acciones nuevas en el menú de cada PDF, tanto en la carpeta de un asunto
(`js/ficha-asunto.js`) como en Por clasificar (`js/documentos-sueltos.js`, `App.tarjetaSuelto`):
la misma máquina en los dos sitios, con botones sueltos (no un desplegable) para no romper el
estilo de cada fila.

- **`js/lib/pdf-lib.min.js`** (versión 1.17.1, build UMD del `dist/` de npm): la estructura
  interna de un PDF no se puede tocar a mano como el `.docx` de la fila 17. Copiada en el
  repositorio igual que pdf.js, cargada solo la primera vez que hace falta
  (`PdfHerramientas.cargarPdfLib`, mismo truco que `js/registro-lector.js`), y expone
  `window.PDFLib` como variable global (build UMD sin módulos).
- **`js/pdf-herramientas.js`** (`window.PdfHerramientas`): solo sabe de bytes (`Uint8Array` dentro
  y fuera), nunca toca el disco ni el DOM — así se prueba entero sin navegador. Las páginas se
  copian tal cual (`copyPages`), sin volver a dibujarlas.
  - `cortesATrozos(cortes, total)`: `cortes` son números de página (1 = la primera) después de
    los cuales se corta; sin efectos, ya hace la cuenta de qué páginas (0-indexadas) va en cada
    trozo. Sin ningún corte, da un solo trozo con el documento entero: quien llama lo trata como
    "no hay nada que partir".
  - `separar(bytes, cortes)`, `unir(listaDeBytes)`, `sacarPaginas(bytes, indices)`: usan
    `PDFDocument.create/load/copyPages`. Un PDF protegido o roto lanza `PdfIlegible`, con un
    mensaje en palabras llanas, no la excepción técnica de pdf-lib.
  - `esPdf(nombre, tipo)` y `hayColision(nombresExistentes, nombreNuevo)`: los mismos guardias
    de siempre (ver `Documentos.pareceDeLaAplicacion` y `RegistroSellado.hayColision`, filas 20 y
    21), sueltos aquí para no acoplar este módulo a los otros.
- **`js/pdf-separar-unir.js`** (`window.PdfSepararUnir`): la parte de pantalla. Un `contexto`
  describe dónde está el fichero — `{ modo: 'asunto'|'suelto', dir, nombre, handle, asunto?,
  alTerminar }` —, y las tres funciones (`separar`, `unir`, `sacarPaginas`) lo reciben.
  - **Miniaturas con pdf.js**: `IntersectionObserver` por cada `<canvas>` de la rejilla
    (`.pdf-rejilla`), para no pintar de golpe un PDF de cientos de páginas ("a medida que se
    ven", como pide el documento).
  - **Separar**: rejilla con una tijera (`.pdf-tijera`) entre cada dos páginas; el resumen de
    arriba ("Van a salir N documentos: páginas...") se recalcula en cada clic con
    `cortesATrozos`. Un PDF de una sola página avisa que no hay dónde cortar, en vez de ofrecer
    una rejilla vacía de sentido.
  - **Unir**: se parte del PDF pulsado (siempre el primero); lista de los demás PDF del mismo
    sitio, con casilla, cuenta de páginas (`contarPaginas`, una lectura por candidato al abrir el
    cuadro) y flechas para ordenar los señalados.
  - **Sacar páginas**: la misma rejilla, con casillas en vez de tijeras. El original nunca se
    toca ni se manda a la papelera.
  - **El cuadro de poner nombre** (`abrirCuadroDeNombre`, compartido por las tres): los mismos
    campos que "Añadir documento" (fecha, texto adicional, tipo, `Nombres.montarDocumento`), con
    la miniatura de la primera página como referencia. El botón de cancelar se relabela
    "Dejarlo" mientras dura (se restaura a "Cancelar" al salir). En un asunto, Separar lo abre una
    vez por trozo, en secuencia: si se pulsa "Dejarlo" a mitad, lo ya guardado se queda y el
    resto no se crea, con un aviso de cuántos han quedado a medias.
  - **En Por clasificar** no se pregunta nada: Separar numera cada trozo (`nombre (i de N).pdf`),
    Unir añade `(unido)` al nombre del primero, Sacar páginas añade `(paginas sacadas)`.
  - **Nunca se pisa un fichero**: `hayColision` se comprueba antes de escribir, en el asunto y en
    Por clasificar; si el nombre ya existe, se avisa en una línea y no se toca nada.
  - **La papelera**: Separar y Unir mandan los originales (`Papelera.mandarDocumentoDeAsunto` o
    `Papelera.mandarSuelto`, según el `contexto.modo`); Sacar páginas no manda nada, porque el
    original no se toca.
- **`Carpetas.escribirBytes(dir, nombre, bytes, tipo)`** (nueva, `js/carpetas.js`): como
  `escribirTexto`, pero para bytes cualquiera. La usa este módulo para guardar el PDF resultante.
- **Alcance de esta fila**: los tres botones solo salen en la ficha del asunto (no dentro del
  cuadro "Gestionar documentos", que ya tiene bastantes botones por fila) y en las tarjetas de
  Por clasificar. Un PDF de una sola página sí ofrece Unir y Sacar páginas (solo Separar avisa de
  que no hay dónde cortar, y lo hace al abrir el cuadro, no escondiendo el botón: pintar el menú
  de cada tarjeta ya sabiendo el número de páginas de cada PDF obligaría a abrirlos todos de
  antemano).

Se comprueba sin navegador con `pruebas/separar-unir.mjs` (con un PDF de prueba montado con la
propia pdf-lib dentro del mismo contexto de `vm`, para no arrastrar problemas de `Array`/
`Uint8Array` entre realms distintos) y con navegador de verdad con
`pruebas/separar-unir-navegador.mjs` (miniaturas, tijeras, el cuadro de nombre en secuencia,
Unir con dos sueltos, colisión de nombres). De paso, se ha corregido un fallo del disco de
mentira compartido (`pruebas/navegador.mjs`): su `createWritable().write(...)` leía cualquier
`Blob`/`File` con `.text()`, que decodifica como UTF-8 y cambia de tamaño un contenido binario de
verdad (un PDF); ahora usa `.arrayBuffer()`, como hace el navegador de verdad. No cambia nada
para el texto plano que ya usaban el resto de pruebas.

### Repartir un PDF entre terceros (25-sep-2026, fila 141, `docs/REPARTIR-ENTRE-TERCEROS.md`)

En el menú de cada PDF de la ficha de un asunto ABIERTO (`js/ficha-documentos.js`), «Repartir entre
terceros»: parte un PDF que junta papeles de varias personas (los cuestionarios de altas capacidades
de un colegio, informes de tránsito…) y deja cada trozo en su propio asunto, ya archivado.

- `js/repartir-nucleo.js` (`RepartirNucleo`, sin disco ni pantalla): proponer los trozos (las
  páginas antes de la primera, «Se queda en este asunto»; páginas por trozo propuestas = las que
  quedan entre los relacionados, con aviso ámbar si no es exacto), +1/−1 (los de debajo se
  recolocan; lo que sobra, un trozo más sin asignar; ninguno en cero páginas), asignar por orden y
  comparar nombres (sin tildes, en cualquier orden, «M.ª» = María; verde con el Nº escolar, el DNI o
  nombre y dos apellidos; ámbar con nombre y primer apellido o dos posibles).
- `js/repartir-pantalla.js` (`Repartir`): el cuadro (`U.preguntar` ancho, con «Cerrar»), miniaturas
  perezosas con pdf.js, el desplegable de cada trozo (los relacionados, tachados si ya tienen trozo,
  y «Se queda en este asunto»; debajo, un buscador de todo el alumnado que, si se usa, añade a esa
  persona a los relacionados), el texto de cada página con pdf.js (si no hay, línea gris
  «escaneado»), los tipos y el resumen en el mismo cuadro. Y el dato del tipo en Ajustes
  (`repartirTipo`, `repartirTipoDocumento`; renombrar un tipo se los lleva, `js/tipos-nombre.js`).
- `js/repartir-crear.js` (`RepartirCrear`): por persona, crea el asunto (fecha y registro del PDF
  original, año académico de esa fecha, sin grupo), guarda su trozo (`PdfHerramientas.sacarPaginas`,
  `Nombres.montarDocumento`), apunta «Viene de …» y lo archiva con `App.cerrarAsunto` sin su pregunta
  (`App.E.archivarSinPreguntar`). En el origen: el PDF completo se queda; los trozos que se quedan,
  como documentos propios; una nota con el reparto; y `repartos` en su ficha. Repetirlo sobre el
  mismo PDF enseña lo hecho como «Hecho» y solo reintenta lo que falló.

### Hueco para el sello de Séneca y la firma del director (18-sep-2026, fila 57,
docs/HUECO-PARA-SELLO-Y-FIRMA.md)

Séneca pinta su sello de registro en una banda estrecha arriba de cada página (a la derecha si es
entrada, a la izquierda si es salida), y la firma digital del director deja una banda al pie. Si el
documento tiene texto ahí, queda pisado. Botón **Ajustar tamaño** (llamado "Preparar el
documento" hasta la fila 58, 18-sep-2026, docs/AJUSTES-DE-USO-2026-09-18.md, 2: solo cambió el
texto que se ve, ni el fichero ni la función), junto a Separar, Unir y Sacar páginas (en la ficha
de un asunto y en Por clasificar): encoge el contenido de todas las páginas y lo recoloca para
dejar libres las dos bandas, de lado a lado de la hoja (vale igual para entrada que para salida,
sin tener que elegir). **El orden importa**: ajustar el tamaño, luego firmar, luego registrar en
Séneca; un PDF ya firmado no se debe tocar sin invalidar la firma.

- **`js/pdf-margenes.js`** (`window.PdfMargenes`): solo bytes, sin disco ni DOM, igual que
  `js/pdf-herramientas.js` (usa `PdfHerramientas.cargarPdfLib`, sin tocar ese fichero).
  - `calcularEncaje(ancho, alto, huecoArriba, huecoAbajo)` (todo en puntos PDF, 1 cm = 28,3465 pt,
    `PdfMargenes.CM_EN_PT`): la escala nunca pasa de 1 (nunca agranda) ni es negativa; `cabe` es
    falso cuando los dos huecos juntos pasan de la mitad del alto de la página.
  - `conHueco(bytes, huecoArribaCm, huecoAbajoCm)`: primero calcula el encaje de TODAS las páginas
    y, si alguna no cabe, no escribe nada (ni las que sí cabían) y lanza un error `HuecoNoCabe`. No
    cambia el tamaño de ninguna hoja, ni siquiera si son de tamaños distintos en el mismo PDF.
  - **Páginas giradas**: la escala y el hueco se calculan sobre el tamaño VISIBLE de la página
    (`getSize()` de pdf-lib no tiene en cuenta el `/Rotate`, así que se calcula a mano,
    `anguloDePagina`/`tamanoVisible`), pero el contenido se dibuja en el sistema de coordenadas
    CRUDO de la página, sin deshacerle el giro: la hoja nueva se crea con el mismo tamaño crudo y
    el mismo `/Rotate` que la original (`embedPage` no tiene en cuenta el giro: su `width`/`height`
    son los del `MediaBox` crudo), y solo cambia dónde y a qué escala se dibuja el contenido dentro
    de ese sistema. `posicionCruda(angulo, anchoCrudo, altoCrudo, encaje)` trae, para cada uno de
    los cuatro giros, la esquina cruda que corresponde a la esquina visible ya calculada (la cuenta
    completa, deducida a mano y comprobada con dos métodos distintos, está en el comentario de
    cabecera del fichero). Así no hace falta averiguar cómo compone `drawPage` su propio parámetro
    `rotate`.
  - `pareceFirmado(bytes)`: busca en los propios bytes `/ByteRange` o `/Type /Sig` (con o sin
    espacio), sin interpretar la estructura entera del PDF. Con cualquiera de las dos, ya cuenta.
  - **Aviso conocido**: `embedPage` (pdf-lib) no arrastra los enlaces ni las anotaciones de la
    página original. Para los documentos que se registran esto no importa (son papeles para
    sellar).
- **`js/preparar-documento.js`** (`window.PrepararDocumento.abrir(contexto)`): mismo `contexto` que
  `PdfSepararUnir.separar/unir/sacarPaginas` (`{ modo, dir, nombre, handle, asunto?, alTerminar }`).
  - **Si el PDF ya trae firma digital** (`PdfMargenes.pareceFirmado`): pregunta con el texto exacto
    del encargo antes de seguir; si Francisco dice que no, no se toca nada.
  - **Saber si ya hay sitio**: con pdf.js (cargado en caliente, mismo truco que
    `js/pdf-separar-unir.js`), cada página se pinta en un `<canvas>` desechado (nunca se cuelga de
    la pantalla) a 700 px de ancho — pdf.js ya aplica el giro de la página al pintar, así que aquí
    no hace falta pensar en `/Rotate`. Un píxel cuenta como "hay algo" si su luminosidad baja de
    200 (sobre 255); una banda está ocupada si más del 0,3 % de sus píxeles cuentan. Basta con que
    una sola página tenga una banda ocupada para que haga falta preparar el documento entero. Si
    las dos bandas están libres en todas las páginas, no se abre ningún cuadro: se avisa en verde
    ("Este documento ya tiene sitio...") y no se escribe nada.
  - **El cuadro** (un solo `U.preguntar`, `cuadro-ancho`): la primera página pintada con pdf.js, con
    las dos bandas marcadas encima (`.preparar-banda-arriba`/`abajo`, semitransparentes,
    `css/pdf-separar-unir.css`); una línea de texto con el porcentaje de encogido y los centímetros
    libres; dos casillas ("Hueco para el sello de registro", "Hueco para la firma"), marcadas de
    partida según lo que diga el tipo del asunto (`tipo.llevaSello`/`llevaFirma`; sin tipo —en Por
    clasificar—, sello sí y firma no); al cambiar una casilla se recalculan solas la vista y la
    línea de texto, sin volver a pintar el PDF.
  - **Al aceptar**: `PdfMargenes.conHueco`; si alguna página no tiene sitio, se avisa con el mismo
    mensaje del encargo y no se toca nada. Si todo va bien, el original va primero a la papelera
    (`Papelera.mandarDocumentoDeAsunto`/`mandarSuelto`, según `contexto.modo`) y luego se escribe el
    nuevo con el mismo nombre (`Carpetas.escribirBytes`), en ese orden para que no choquen dos
    ficheros iguales en la carpeta.
- **Lo configurable**:
  - **Ajustes → El centro** (`js/ajustes-centro.js`, bloque "Sello y firma en el papel", campos
    estáticos `#margen-sello`/`#margen-firma` en `index.html`): las dos medidas, en centímetros con
    un decimal, entre 0 y 6 cm cada una (por defecto 1,5 y 2,5). Se guardan en
    `_GESTOR/margenes-pdf.json` (`App.margenesPdfLeer`/el guardado del propio fichero); son solo
    dos números, así que no hace falta fusionar con el disco, igual que "Datos del centro y firma".
  - **La pantalla de un tipo de asunto** (`js/ajustes-tipo.js`, sección "Datos del tipo"): dos
    interruptores, `tipo.llevaSello` (por defecto sí) y `tipo.llevaFirma` (por defecto no), guardados
    directamente en `tipos.json` con `App.guardarTipos()`. Un tipo sin esos campos se comporta con
    los valores por defecto: nada que migrar. El ayudante compartido,
    `App.construirInterruptorDeTipo(tipo, campo, porDefecto, texto, ayuda)`, vive en `js/ajustes.js`,
    junto a `App.construirCasillaPlazo`.

Se comprueba sin navegador con `pruebas/margenes-pdf.mjs` (mismo montaje con `vm` que
`pruebas/separar-unir.mjs`): `calcularEncaje` en varios casos (A4 con huecos normales, sin huecos,
huecos absurdos, página pequeña), `conHueco` conservando páginas y tamaños —con dos hojas de
tamaño distinto y una tercera girada 90°, comprobando que su tamaño crudo y su giro sobreviven—,
que una página sin sitio no escribe nada, y `pareceFirmado`. La parte de pantalla
(`js/preparar-documento.js`) no tiene prueba de navegador propia todavía.

### El impreso, con los datos del centro ya puestos (20-sep-2026, fila 84,
docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md)

La regla que manda: **solo se rellenan los datos del centro y el año académico. Nunca los de la
persona** (nombre, documento, domicilio, teléfono, tutores…), aunque la aplicación los tenga:
a propósito, decisión de Francisco, para que al recibir el impreso de vuelta se vea si algún dato
suyo ha cambiado. Un impreso ya relleno del todo no sirve para comprobar nada. Rellenar también los de la persona
está descartado a propósito (`docs/CONTEXTO-CORTO.md`, sección 7).

- **Los PDF en blanco**: carpeta `formularios/` del repositorio (no `_GESTOR`), uno por cada
  entrada del catálogo de la fila 82 cuya vía sea `descarga` o `centro`. El nombre es la clave del
  catálogo con los dos puntos cambiados por un guion (`O:III` -> `O-III.pdf`). `datos/formularios.json`
  gana en esas entradas una clave `f` con ese nombre; las de vía `protocolo`/`seneca` no llevan
  ninguna. **Esta sesión no tenía salida a internet** para bajarlos de la Junta de Andalucía: el
  campo `f` está puesto en las once entradas que hacen falta, pero `formularios/` se queda vacía.
  El mecanismo entero funciona igual en cuanto se copien los PDF, uno a uno, sin tocar código: la
  lista de los que faltan queda en `docs/COLA.md`.
- **Los siete huecos permitidos, y ninguno más**: `{{CENTRO}}`, `{{CODIGO CENTRO}}`,
  `{{DIRECCION CENTRO}}`, `{{LOCALIDAD}}`, `{{PROVINCIA}}` (clave nueva de `plantillas.json`, con
  su campo en Ajustes → El centro → Datos del centro y firma), `{{CURSO}}` (el mismo `curso` de
  `Plantillas.valoresDeAsunto`) y `{{HOY}}`. Ningún dato de persona entra aquí: el desplegable de
  la pantalla de configuración solo ofrece estos siete.
- **`_GESTOR/formularios-campos.json`** (el decimoctavo fichero compartido): `{ "<clave del
  catálogo>": { "<nombre de la casilla>": "{{HUECO}}" } }`. Una casilla que no esté en el mapa se
  queda en blanco.
- **`js/formularios-rellenar.js`** (`window.FormulariosRellenar`), con pdf-lib (`js/pdf-herramientas.js`,
  `PdfHerramientas.cargarPdfLib`):
  - `proponerMapa(nombresDeCasillas)`, **sin efectos** (es lo que se prueba sin navegador): mira el
    nombre **propio** de cada casilla (su último tramo, desde la fila 146: el camino entero hacía
    proponer el centro para «Rellenable» o «Botones»), sin mayúsculas ni tildes, con siete reglas en orden (`codigo` antes que
    `centro`, para no confundir "código del centro" con el nombre del centro; "domicilio/dirección
    junto a centro" antes que `centro` a secas; luego `localidad`/`municipio`, `provincia`,
    `curso` + `escolar`/`academico` o "año académico", y por último `fecha`). Una casilla que no
    case con ninguna regla no entra en el mapa propuesto. Desde la fila 146, tampoco una casilla de la
    persona (`FormulariosCasillas.esDePersona`: la fecha de nacimiento no es `{{HOY}}`) ni una
    numerada del 2 en adelante («Centro 2», «Código 3»: los otros centros que pide la familia).
  - `rellenarPdf(bytesPdf, mapa, valores)`: con `PDFDocument.load` + `getForm().getFields()`,
    rellena (`campo.setText`) **solo** las casillas del mapa que tengan valor, las deja en solo
    lectura (`campo.enableReadOnly()`) y no toca las demás; **nunca aplana el formulario**
    (`flatten()`). Si el PDF no trae formulario, o `getFields()` sale vacío, devuelve
    `rellenable: false` y los bytes tal cual, sin inventarse nada. Quita la parte `/XFA` del
    `AcroForm` (fila 146) para que todos los visores enseñen lo rellenado; pdf-lib ya la quita él
    solo al leer el formulario (comprobado con los impresos de `formularios/`: siguen con todas sus
    casillas).
  - **Ajustes → El centro → "Impresos oficiales"** (desde la fila 146, 25-sep-2026,
    `docs/IMPRESOS-CASILLAS-LEGIBLES.md`, en `js/formularios-ajustes.js`): un bloque plegado por
    impreso con PDF (`f`). Su resumen: «N casillas del centro puestas», «Sin casillas del centro» (leído
    en esta sesión, sin ninguna) o «Sin leer todavía». Dentro, el botón **"Leer las casillas del PDF"**
    (a propósito no se lee solo al desplegar: varias pruebas de navegador despliegan TODOS los
    `<details>` de Ajustes). Leídas: arriba, abiertas, **las del centro**; debajo, plegados, «Otras
    casillas (N)» y «Datos de la persona (N) — no se rellenan nunca» (con su desplegable, por si alguna
    estuviera mal clasificada). Sin ninguna del centro: «Este impreso no tiene casillas del centro:
    saldrá en blanco». Cada fila con su **nombre legible** («Página 2 · Primer apellido»; el interno en
    el `title`), las repetidas en una sola («Primer apellido (en 3 páginas)», un desplegable que guarda
    el mismo hueco para todas) y una **miniatura** de su página con la casilla recuadrada (pdf.js; se
    pinta al pasar por encima o al desplegar su grupo; pulsarla la agranda ahí mismo). **Si el impreso
    no tenía nada guardado, la propuesta se guarda sola** (una escritura, por `ColaGuardado`) y avisa
    en verde «He puesto N casillas del centro. Revísalas si quieres». Un PDF que no se encuentra (o sin
    casillas) se avisa en gris.
  - **`js/formularios-casillas.js`** (`FormulariosCasillas`, fila 146), sin efectos salvo las dos
    últimas: `nombreLegible(nombre)` → `{ pagina, texto }` (página de `Página_N`/`PageN`; el último
    tramo sin `[n]`, partido por `_`, guiones, puntos, mayúsculas y cifras; sin sufijos de maquetación
    —`encab`, `enca`, `enc`, `cab`, `txt`, `campo`, `field`, `datos`—; `apellido 1` → «Primer
    apellido», `dni` → «DNI», `num` → «Número»…), `esDePersona`, `clasificarCasilla(nombre,
    guardado)` → `'centro'` (con hueco guardado o propuesto) / `'persona'` / `'otra'`, `agrupar`,
    `posicionesDe(bytes)` (el rectángulo del primer widget y su página, con pdf-lib) y
    `pintarMiniatura`. Es de persona: apellido, nombre, DNI/NIF/NIE, pasaporte, domicilio o dirección,
    teléfono, móvil, correo, firma, nacimiento (y `nac`), sexo, nacionalidad, tutor, padre, madre,
    progenitor, alumno, solicitante, representante, hermano, guardador, parentesco o código postal,
    en su nombre o en el bloque que la contiene (solicitante, alumno, domicilio…); nunca si el nombre
    entero habla del centro, salvo «centro actual/de procedencia/de origen» (el de la persona).
  - **El botón "Preparar para el tercero"**: cuelga de `data-clave-formulario`, un atributo que
    `js/formularios.js` ya deja en la lista de solo lectura de un hito y en la línea "Formularios"
    de la ficha (fila 82) para no tener que envolver nada de ese fichero. Al pulsarlo: lee el PDF,
    lo rellena con los siete valores del asunto (`Plantillas.valoresDeAsunto` + `provincia` de
    `plantillas.json`), lo guarda en la carpeta con el nombre de siempre
    (`Nombres.montarDocumento`, tipo de documento `IMPRESO`, sin pisar si ya existe), deja una nota
    con `Notas.anadir` y refresca la ficha. Un PDF sin casillas rellenables se guarda igual, en
    blanco, con un aviso.
  - Sabe qué asunto está abierto envolviendo `App.abrirFicha` (`js/envolturas-esperadas.js`),
    como `js/formularios.js`/`js/correo.js`, y vigila la ficha con un `MutationObserver`.

Se comprueba también con `pruebas/impresos-casillas-legibles.mjs` (navegador, con el Anexo III de
verdad, en blanco) y, desde la fila 146, `pruebas/formularios-rellenar.mjs` suma `nombreLegible`,
`clasificarCasilla`, las repetidas y la parte XFA.

Se comprueba con `pruebas/formularios-rellenar.mjs` (sin navegador, con `vm`, como
`pruebas/separar-unir.mjs`: los objetos de pdf-lib no cruzan bien entre "realms" distintos, así que
cada PDF de prueba se monta y se resuelve entero dentro del propio contexto): las siete reglas de
`proponerMapa` (con variantes de mayúsculas y tildes) y que una casilla sin regla no propone nada;
que `rellenarPdf` solo cambia las casillas del mapa, con sus valores, y deja las demás
escribiéndose; que las rellenadas quedan en solo lectura; y que un PDF sin formulario no rompe
nada y devuelve el aviso.

