# 695 — Generar y enviar sin crear antes una tarea

## Lo que escribió Francisco
«Diego me está poniendo muchas pegas a los últimos cambios y no sé si hay una forma de revertirlos y dejar una estructura más sencilla y menos automática hasta poder ir asentando las cosas.»

«Eso de que le pide crear una tarea es lo que más le está molestando y que creo que es lo que más obstaculiza.»

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- Hoy, para generar un documento o enviar un correo o un mensaje de Séneca, hace falta una tarea que lo haga. Si ninguna sirve, hay que crearla antes. Eso deja de ser obligatorio.
- En la cabecera del asunto, a la derecha, junto al botón del teléfono, hay dos botones siempre a la vista, tenga el asunto hitos o no:
  - **«Generar documento ▾»**: ofrece las plantillas de documento del tipo de asunto. Al elegir una, se genera como siempre (lo que falta se pregunta antes, se ve en la app, «Guardar PDF»).
  - **«Enviar ▾»**: con «Correo» y «Séneca». Abre el cuadro de siempre, con la plantilla del tipo o «Sin plantilla».
- Funcionan sin crear, elegir ni preguntar ninguna tarea ni ningún hito. Lo generado queda en la carpeta del asunto; lo enviado queda en el Registro, con su PDF `CORREO` como siempre.
- No se marca sola ninguna tarea ni ningún hito por usar estos botones.
- Las tareas y sus botones siguen como están: quien quiera generar o enviar desde una tarea puede seguir haciéndolo.
- No desaparece nada, salvo un texto: en un asunto sin hitos ya no sale «Para generar, comunicar o añadir un documento, crea antes el hito y su tarea.»
- En «solo consultar» y para un directivo, los dos botones no salen.
- Es un paso atrás, a propósito, sobre lo diseñado el 14-nov-2026 (todo documento y toda comunicación salen de una tarea), mientras el sistema nuevo se asienta (`docs/PLAN-2026-11.md`).

## Pantalla de prueba
- No se pidió.

## Qué NO se hace en esta tarea
- Quitar la marca «sin tarea» y el botón «Colgar de una tarea» de los documentos: es del tema 691.
- Cambiar cómo se marcan las tareas: es del tema 693.
- Vincular solo lo generado o enviado a una tarea que lo esperase: es del tema 693.
- Volver a poner «Hacer este hito».

## Notas técnicas de Claude
- La cabecera del asunto se pinta en `js/ficha-tarjetas.js` (fila 637); el botón del teléfono, en `js/llamadas-vista.js`. Los dos botones nuevos van en un fichero nuevo, por debajo de 400 líneas, apuntado en su lista `js/cargar-piezas-N.js`.
- Para ofrecer plantillas, `Plantillas.documentosDeTipo` (regla de `docs/CONTEXTO-CORTO.md`, apartado 6). Generar: `PlantillasDocumento.generar(a, p, 'abierto', …)` sin `hito` ni `idPasoGuion`; comprobar que sin hito no falla y que el documento entra sin tarea, como los de la fila 680.
- Enviar: el cuadro de Correo y de Séneca de siempre, sin `idPasoGuion`, para que `js/correo-rastro.js` no marque ninguna tarea. Queda el código de los desplegables antiguos en `js/hito-mesa-comunicar.js`, `js/hito-mesa-recetas.js` y `js/hito-mesa-documentos.js`: se puede aprovechar, pero sin la parte de arriba que ofrecía las tareas pendientes.
- No salen con `SoloConsulta.activo()`.
- El texto del asunto sin hitos: buscar «crea antes el hito y su tarea» y repasar los demás textos que nombren esa regla. La idea 689 (en el tema 691) pedía cambiar ese mismo texto: decirlo en la nota de la fila.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En un asunto con hitos, la cabecera lleva «Generar documento ▾» y «Enviar ▾» junto al teléfono.
- En un asunto sin hitos, también, y no sale el texto «crea antes el hito y su tarea».
- «Generar documento ▾» ofrece las plantillas del tipo; al generar una, el documento queda en «Documentos de la carpeta» y no se ha creado ni marcado ninguna tarea ni ningún hito.
- «Enviar ▾» → «Correo» abre el cuadro de correo; al enviar, queda en el Registro y no se ha creado ni marcado ninguna tarea. Lo mismo con «Séneca».
- Una tarea «Generar documento» o «Enviar» del hito sigue teniendo su botón y sigue funcionando igual.
- Con «En este ordenador, solo consultar», los dos botones no salen.

## Qué mirar al terminar
- Abre un asunto cualquiera: arriba a la derecha, junto al teléfono, están «Generar documento ▾» y «Enviar ▾».
- Genera un documento desde ahí en un asunto cuyo hito no tenga tareas: sale sin pedirte ninguna tarea.
- Envía un correo desde ahí: sale el cuadro de siempre y, al enviar, queda en el Registro.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
