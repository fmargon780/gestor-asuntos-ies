# 692 — Lo visto en la parte de los documentos (17-nov-2026, tercera conversación)

Acompaña a `docs/notas-diseno/692.md`. Es el punto 1 de su «Qué falta». Nada programado.
Código leído en `main`, commit `31cf71b`.

## Leído entero

`docs/contexto/DOCUMENTOS.md`, `js/plantillas-documento.js`, `js/hacer-este-hito.js`,
`js/hacer-este-hito-sello.js`, `js/tarea-firmar.js`, `js/tareas-con-documento.js`,
`js/documento-a-tarea.js`, `js/ficha-firmas.js`, `js/documentos-tipo-nuevo.js`.

**Sin leer** (hay que leerlo antes de la instrucción): el envío (`js/correo-enviar.js`,
`js/correo-rastro.js`, `js/correo-enviado-pdf.js`, `js/seneca-*.js`, `js/sitios.js`,
`js/hitos-comunicar.js`), `js/registro-sellado.js`, `js/ruta-copia.js`,
`js/documentos-firmados.js`, `js/documentos-datos.js`, `js/membrete.js` (firmantes). No sé todavía
si el envío de un documento queda apuntado en el propio documento.

## Lo que ya existe y sirve para el papel con recorrido

- **El documento ya tiene ficha propia.** `ficha.documentos[<número D26-…>]` guarda tipo, fecha,
  `registros` (código, fecha, fuente «sello» o «listado»), `firmas`, campos, texto e hito
  (`DocumentosDatos.anotar`). Los documentos de antes de la fila 239, sin número, no la tienen.
- **Dos de las cuatro pruebas ya se leen solas.** Firmado: se cuentan las firmas del PDF
  (`DocumentosFirmados`, fila 515). Registrado: se lee el sello del PDF y manda el listado de
  Séneca (`RegistroSellado`, `FechaDeRegistro`, fila 573). Generado: lo hace la app. Enviado: sin
  mirar.
- **El recorrido existe, pero colgado del hito.** «Hacer este hito» (`js/hacer-este-hito.js`)
  encadena generar → firmar → registrar → enviar. Dónde está parado se guarda en `h.cadena`
  (`esperando-firma`, `esperando-sello`, `listo-para-enviar`): uno solo por hito. La llegada del
  firmado o del sellado lo hace avanzar (`TareaFirmar.alLlegar`, `HacerEsteHitoSello.resolver`).
- **Cada tarea señala su documento:** `h.guionDocumento[<tarea>] = { doc, version }`
  (`TareasConDocumento`), también dentro del hito.
- **La plantilla ya dice de qué tipo de documento es y quién firma:** `tipoDocumento`, `firmante`
  y `vistoBueno` (visto en `plantillas.json`). Al generar, el documento recibe su número.
- **La plantilla de correo ya dice a quién va y qué adjunta:** `para` (familia, interesado, tutor,
  quien lo pide, relacionados, un grupo), `copia`, `oculta` y `adjuntar` (un tipo de documento).

## Lo que no existe

- **Un sitio donde escribir el recorrido de un tipo de documento.** `tipos-documento.json` es una
  lista de nombres. Lo demás del tipo está repartido: campos y texto por defecto en `campos.json`
  (`porTipoDocumento`, `textoPorTipoDocumento`), extracto en `plantillas.json` (`extractosPorTipo`).
- Hoy el recorrido está escrito a trozos, en tres sitios: en la plantilla de documento (quién
  firma), en la plantilla de correo (a quién va, qué adjunta) y en cada tarea de cada guía
  (cuántas firmas `receta.firmas`, entrada o salida `receta.sentido`, a quién y por dónde
  `receta.a`, `receta.via`, `receta.plantilla`, `donde`).
- **El estado del papel como una sola cosa.** Se deduce de varias tareas y de `h.cadena`.
- La pasada de fondo del sello solo decide sola con **un** hito esperando y **un** papel sellado en
  la carpeta. Con dos papeles en marcha a la vez en un asunto, hoy pregunta.

## Lo visto en los datos reales (cuenta común, 17-nov-2026)

Leídos enteros `tareas-comunes.json`, `tipos.json`, `tipos-documento.json`, `campos.json` y
`plantillas.json`. Los tres últimos los compartió Claude ese día con la cuenta personal de
Francisco, solo como lector, a petición suya. La carpeta `_GESTOR` entera no se compartió: lleva
los asuntos con nombres de alumnado y de personal.

- **Tipos de documento: unos sesenta.** La mayoría son papeles que **entran** y no llevan
  recorrido propio (DNI, LIBRO FAMILIA, SENTENCIA, FACTURA, PRESUPUESTO, PARTE INICIAL…). Los que
  **produce** el centro son pocos: CERTIFICADO, RESOLUCION, OFICIO, COMUNICACION, NOTIFICACION,
  CONVOCATORIA, JUSTIFICANTE, REQUERIMIENTO, ESCRITO DE RESPUESTA, CREDENCIAL IPASEN, PEDIDO.
- **Quién firma, según las 52 plantillas de documento** (contadas a ojo):
  - Secretaría con el visto bueno de Dirección: los certificados (la gran mayoría).
  - Dirección sola: resoluciones, oficios, diligencias, autorizaciones, informes.
  - Jefatura de Estudios: citaciones y la comunicación de una reclamación.
  - Secretaría sola: pedido, requerimiento, petición de historial.
  - Administración: justificante de entrega. Nadie: ficha de libros, anexo I.
  Es decir, cuatro o cinco recorridos de firma distintos, no uno por tipo.
- **Tipos escritos en las plantillas que no están en la lista del centro:** ACUERDO, CERTIFICACION,
  DILIGENCIA, CITACION, AUTORIZACION, RENUNCIA, FICHA ENTREGA LIBROS y RESOLUCIÓN con tilde (la
  lista dice RESOLUCION). Hay que ponerlos de acuerdo antes de colgar el recorrido del tipo.
- **El mismo tipo no siempre firma igual:** JUSTIFICANTE lo firma Dirección en una plantilla y
  Administración en otra; CERTIFICADO, Secretaría con visto bueno casi siempre y Dirección sola en
  una. El recorrido del tipo tiene que ser el de siempre, y la plantilla poder decir otra cosa.
- **Nadie ha usado lo que ya se puede escribir por tipo de documento:** `extractosPorTipo` está
  vacío y solo JUSTIFICANTE tiene un campo propio.
- Recorridos que salen en las tareas escritas por Francisco y Diego (`tareas-comunes.json`):
  - Sale del centro: generar → poner a la firma digital → descargar el firmado → registrar de
    salida («si se remite») → enviar por iPasen o correo, o entregar en mano.
  - Entra en el centro: recibir → comprobar → añadir → registrar de entrada.
  - Papel con sello de tinta: sello redondo, escanear, ajustar tamaño, copia para el interesado.
- `tipos.json`: más de la mitad de los tipos de asunto están desactivados.

## Qué significa para el tamaño

- No se parte de cero: las pruebas de firma y de sello, la ficha del documento, el encadenado y
  quién firma ya están. El trabajo es **cambiar de dueño**: el recorrido pasa de las tareas y las
  plantillas al tipo de documento, y la parada pasa del hito (`h.cadena`) al documento.
- Sobre las cinco o seis filas de `692.md`, el papel con recorrido añade, a ojo, tres: (a) el
  recorrido escrito en el tipo de documento, con los tipos de las plantillas puestos de acuerdo;
  (b) la tarea de papel en una línea, con su estado sacado de la ficha del documento; (c) la espera
  con varios papeles a la vez.
- Estimación sin haber leído el envío. Se afina al leerlo.
