# 704 — El papel: poner a la firma y registrar

Parte del tema 692 (el molde nuevo). Va detrás de la fila 703.

## Lo que escribió Francisco
(Lo vio en la pantalla de prueba y lo dio por bueno, parte a parte: el día de volver a mirar una firma lo propone la app; mientras falta el sellado, el asunto sigue en Administración.)

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- **«Poner a la firma»** es el botón del paso «Firmado». Al pulsarlo, la tarea queda esperando a quien firma (según el recorrido o la plantilla: «Secretaría y Dirección», «Dirección», «Jefatura»…), el paso dice «A la firma» y el asunto pasa a «En espera».
- **El día de volver a mirarlo lo propone la app:** hoy más un número de días hábiles. Ese número es **uno solo para todo el centro**, está en Ajustes y nace en 1. En cada espera se puede cambiar el día («Cambiar el día»). No hay un plazo por tipo de documento ni por quién firma.
- Cuando se guarda el PDF firmado en la carpeta, el paso se marca solo y la espera termina. Si llega el día sin el firmado, el asunto vuelve a «En Administración» con «Reclamar a <quién firma>» (fila 702).
- **«Registrar»** es el botón del paso «Registrado». Al pulsarlo se copia la ruta del documento para registrarlo en Séneca, y el paso dice **«Falta el sellado»**. El asunto **sigue en «En Administración»**: el panel dice «Falta guardar el PDF sellado.»
- Cuando se guarda el PDF sellado en la carpeta, la app lee el sello y marca el paso sola.
- En la espera de una firma no se puede cambiar a quién se espera, y no hay «Ya ha llegado»: llega con el PDF o con «Marcar el paso a mano».

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- El número está en Ajustes › El centro › «Calendario y responsables», con el texto «Días hábiles para volver a mirar un documento puesto a la firma».
- Un asunto puede tener dos papeles a la firma o esperando su sello a la vez: cada PDF que llega va a su documento. Si la app no puede saber de cuál es, pregunta, como hoy.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- Enviar: fila 705.
- Registrar desde la app: se sigue registrando en Séneca.
- Comprobar quién ha firmado o si la firma es válida: la app solo cuenta firmas.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Días hábiles: `Plazos.sumarDiasHabiles` (`js/plazos.js`) con los festivos y no lectivos de Ajustes; el número, en `datos.ajustes`, y su casilla en `js/hitos-ajustes.js` (bloque «Calendario y responsables»).
- La espera de la firma es la de la fila 702 (`js/tarea-espera.js`) con `paso: 'firmado'`; termina cuando la ficha del documento tiene las firmas (`DocumentosFirmados.anotarFirmas`).
- Registrar: la ruta, como el botón «Ruta» (`js/ruta-copia.js`); la marca «pide sello» se guarda en la tarea. El sello: `js/registro-sellado.js` y `FechaDeRegistro`.
- Varios papeles: la pasada de fondo del sello (`HacerEsteHitoSello.pasada`, `resolver`) solo decide sola con un hito esperando. Para asuntos `sinHitos`, casar cada PDF con su documento por el número `D26-…` del nombre; fichero nuevo `js/papel-llegadas.js`. De fondo, mirar antes `SoloConsulta.activo()`.

## Cómo lo comprueba el segundo revisor
- «Poner a la firma» deja la tarea esperando a quien firma, con el día propuesto a un día hábil (saltando fin de semana y festivos), y el asunto en «En espera».
- Cambiando el número en Ajustes, el día propuesto cambia.
- Al guardar el PDF firmado, «Firmado» se marca y la espera desaparece.
- «Registrar» copia la ruta, enseña «Falta el sellado» y el asunto sigue en «En Administración».
- Al guardar el PDF sellado, «Registrado» se marca solo.
- Con dos papeles a la firma en el mismo asunto, cada firmado marca el suyo.
- En la espera de una firma no hay «Ya ha llegado» ni se puede cambiar a quién.

## Qué mirar al terminar
- Generar una COMUNICACION, pulsar «Poner a la firma» y mirar el día propuesto e Inicio › «En espera».
- Ajustes › El centro › «Calendario y responsables»: ver el número de días.
- Guardar en la carpeta el PDF firmado y después el sellado.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
