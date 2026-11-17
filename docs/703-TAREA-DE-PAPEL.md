# 703 — La tarea de papel: una línea que sigue al documento

Parte del tema 692 (el molde nuevo). Va detrás de la fila 702.

## Lo que escribió Francisco
«Me parece muy buena tu propuesta.» (con papel, la tarea es el papel entero: una sola línea que enseña por dónde va y avanza sola con cada prueba)

De «Marcar el paso a mano»: «Así no hay bloqueos.»

Eligió «1»: si la plantilla de documento dice una firma distinta de la de su tipo, manda la plantilla de documento.

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- Una tarea puede llevar **un papel**: un tipo de documento. En «+ Añadir tarea» y en la guía, junto a la frase, hay un desplegable «Sin papel» / «Papel: <tipo>».
- La tarea de papel no tiene casilla. Lleva el icono 📄, el tipo y **los pasos de su recorrido en una línea** (fila 698): «Generado › Firmado › Registrado › Enviado», o «Recibido › Registrado de entrada». Los pasos hechos salen con ✓; el que toca, resaltado.
- **Cada paso se marca solo con su prueba:** generado, cuando el documento existe en el asunto; recibido, cuando se añade; firmado, cuando el PDF trae las firmas; registrado, cuando trae el sello o sale en el listado de Séneca. Con todos los pasos hechos, la tarea queda hecha.
- A la derecha, **el botón del paso que toca**. En esta fila: «Generar documento» (abre la plantilla de ese tipo ya rellena) y «Añadir documento» (abre la ventana de Windows). Los botones de firmar, registrar y enviar llegan en las filas 704 y 705.
- El panel dice «Ahora toca: <tarea>. Siguiente paso: <botón>.»
- En el ⋮ de la tarea de papel, **«Marcar el paso a mano»** marca el paso que toca, con quién y qué día.
- **Si la plantilla de documento dice una firma distinta de la de su tipo, manda la plantilla.** Si no dice nada, vale la del tipo.
- Lo que solo se mira no es un papel: «Comprobar el DNI de quien firma» es una tarea sin papel, con casilla. Hay papel solo si algo se guarda en la carpeta.

**No se habló y no está en la pantalla de prueba; lo propone Claude y lo aprueba Francisco al leer esto:**
- «Generar documento»: si el tipo de asunto tiene una sola plantilla de ese tipo de documento, la abre; si tiene varias, deja elegir; si no tiene ninguna, ofrece «Otra plantilla…» y «+ Nueva plantilla…», como el botón de la cabecera.
- Un documento de ese tipo que llega al asunto por otro camino (la cabecera, la bandeja, la carpeta) se une solo a la tarea de papel si hay una sola de ese tipo sin documento; si hay varias, se queda sin tarea.
- Cuántas firmas hacen falta: una, o dos con «Secretaría, con visto bueno de Dirección».
- En el ⋮, «Quitar el documento» suelta el documento de la tarea, sin borrarlo.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- «Poner a la firma», «Registrar» y varios papeles a la vez: fila 704.
- «Enviar» y «Marcar enviado»: fila 705.
- Que la plantilla cambie el registro o el envío del tipo: no está aprobado.
- Leer el contenido de los papeles.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- El estado del papel sale de la ficha del documento, `ficha.documentos[<número D26-…>]` (`js/documentos-datos.js`: `firmas`, `registros`), no de marcas. La tarea guarda solo qué documento es el suyo y los pasos marcados a mano. Ficheros nuevos `js/tarea-papel.js` (pasos, estado, botón) y `js/tarea-papel-pintar.js`.
- Recorrido: `RecorridoTipo.de` y `.pasos` (fila 698). Firma de la plantilla: `firmante` y `vistoBueno` de `plantillas.json` (`js/plantillas-documento.js`).
- Generar: `Plantillas.documentosDeTipo`, filtrando por `tipoDocumento`; lo de «Otra plantilla…», de `js/generar-enviar-cabecera.js`. Unir el documento generado: como `TareasConDocumento.alGenerar`.
- Llegada de un firmado o un sellado: hoy avisan a `TareaFirmar.alLlegar` y `HacerEsteHitoSello` (cuelgan del hito, `h.cadena`). En un asunto `sinHitos` basta repintar: el estado se recalcula de la ficha del documento. No usar `h.cadena`.
- Los documentos de antes de la fila 239, sin número, no tienen ficha: no se pueden unir a una tarea de papel.

## Cómo lo comprueba el segundo revisor
- «+ Añadir tarea» y la guía dejan elegir «Sin papel» o un tipo de documento.
- La tarea de papel enseña el icono, el tipo y los pasos del recorrido de ese tipo, sin casilla.
- «Generar documento» abre la plantilla y, al guardar, «Generado» sale con ✓.
- «Añadir documento» en un papel que nos llega marca «Recibido».
- Guardando en la carpeta un PDF firmado de ese documento, «Firmado» se marca solo; con un PDF sellado, «Registrado».
- «Marcar el paso a mano» marca solo el paso que toca.
- Con una plantilla que dice otra firma, la tarea pide las firmas de la plantilla.
- Con todos los pasos hechos la tarea queda hecha y el panel pasa a la siguiente.
- Las tareas sin papel siguen con su casilla.

## Qué mirar al terminar
- En un asunto sin hitos, añadir la tarea «Comunicar la medida a la familia» con papel COMUNICACION y pulsar «Generar documento».
- Probar «Marcar el paso a mano» en el ⋮.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
