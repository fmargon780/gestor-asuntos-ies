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
`js/documentos-firmados.js`, `js/documentos-datos.js`. No sé todavía si el envío de un documento
queda apuntado en el propio documento.

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
- **La plantilla ya dice de qué tipo de documento es** (`plantillaDoc.tipoDocumento`), y al generar
  el documento recibe su número.

## Lo que no existe

- **Un sitio donde escribir el recorrido de un tipo de documento.** `tipos-documento.json` es una
  lista de nombres. Lo demás del tipo está repartido: campos y texto por defecto en `campos.json`
  (`porTipoDocumento`, `textoPorTipoDocumento`), extracto en `plantillas.json` (`extractosPorTipo`).
- Hoy el recorrido está escrito a trozos en cada tarea de cada guía: cuántas firmas
  (`receta.firmas`), entrada o salida (`receta.sentido`), a quién, por dónde y con qué plantilla
  (`receta.a`, `receta.via`, `receta.plantilla`, `donde`).
- **El estado del papel como una sola cosa.** Se deduce de varias tareas y de `h.cadena`.
- La pasada de fondo del sello solo decide sola con **un** hito esperando y **un** papel sellado en
  la carpeta. Con dos papeles en marcha a la vez en un asunto, hoy pregunta.

## Lo visto en los datos reales

- `tareas-comunes.json` de la cuenta común (17-nov-2026, 13:31), leído entero. Los recorridos que
  salen en las tareas escritas por Francisco y Diego:
  - Sale del centro: generar → poner a la firma digital → descargar el firmado → registrar de
    salida («si se remite») → enviar por iPasen o correo, o entregar en mano.
  - Entra en el centro: recibir → comprobar → añadir → registrar de entrada.
  - Papel con sello de tinta: sello redondo, escanear, ajustar tamaño, copia para el interesado.
  - Acciones usadas: comunicar, añadir, registrar, generar, firmar, pedir, entregar.
- `tipos.json` de la cuenta común (17-nov-2026, 13:10), leído entero: más de la mitad de los tipos
  de asunto están desactivados.
- **Los tipos de documento reales del centro no los he podido ver.** La cuenta común solo comparte
  `guias.json`, `tareas-comunes.json`, `tipos.json` e `hitos-comunes.json`. Lo único encontrado es
  una copia del 9-sep-2026 en la cuenta de Francisco, con quince nombres (SOLICITUD, FACTURA,
  CERTIFICADO, MATRICULA, RESOLUCION, NOTIFICACION, INFORME, ACTA, COMUNICACION, JUSTIFICANTE,
  PRESUPUESTO, ALBARAN, CONTRATO, RECURSO, ANEXO). Faltan por compartir: `tipos-documento.json`,
  `campos.json` y `plantillas.json`.

## Qué significa para el tamaño

- No se parte de cero: las pruebas de firma y de sello, la ficha del documento y el encadenado ya
  están. El trabajo es **cambiar de dueño**: el recorrido pasa de las tareas al tipo de documento,
  y la parada pasa del hito (`h.cadena`) al documento.
- Sobre las cinco o seis filas de `692.md`, el papel con recorrido añade, a ojo, tres: (a) el
  recorrido escrito en el tipo de documento; (b) la tarea de papel en una línea, con su estado
  sacado de la ficha del documento; (c) la espera con varios papeles a la vez.
- Estimación sin haber leído el envío. Se afina al leerlo.
