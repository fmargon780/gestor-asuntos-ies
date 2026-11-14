# 667 — «Hay que registrarlo» crea la tarea «Registrar»

## Lo que escribió Francisco
«tiene sentido tener las casillas Registro y pendiente de registro?» (idea 662, 14-nov-2026)

En el debate, sobre el análisis de Claude: «Ok. Me parece bien tu plan».

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)
- La casilla «Está registrado en Séneca» se queda como está, con año, entrada o salida, serie y número, y con el
  relleno solo desde el sello. Es el único sitio donde escribir el número cuando no hay sello que leer.
- La casilla «Pendiente de registro» desaparece. En su lugar, en el mismo sitio y con el mismo comportamiento
  (se oculta al marcar «Está registrado en Séneca»), sale la casilla **«Hay que registrarlo»**.
- «Hay que registrarlo» no hace nada hasta pulsar «Guardar». Al guardar con la casilla marcada:
  - si en el hito ya hay una tarea «Registrar» sin hacer con este documento, o que espera este tipo de documento
    («Qué documento»), el documento cuelga de esa tarea;
  - si no, se crea en ese hito la tarea «Registrar» con «Qué documento» = el tipo del documento, y el documento cuelga
    de ella, sin hacer.
- Qué hito: el del documento. En el cuadro de la bandeja, el elegido en «¿De qué tarea es?». Si el cuadro se abrió desde
  un hito, ese hito. Si no se sabe el hito, al marcar la casilla sale debajo un desplegable «Hito», con los hitos del
  asunto y «+ Añadir hito» (la ventana de la fila 660). Sin hito elegido no se guarda y se dice por qué.
- La casilla sale ya marcada cuando el documento ya cuelga de una tarea «Registrar» sin hacer.
- Sale en los tres cuadros donde se guarda un documento: añadir desde el ordenador, cambiar el nombre y guardar desde
  la bandeja.
- La marca «Sin registrar» de la mesa y de la ficha, y los avisos al marcar el hito, cerrar el asunto y enviar, salen
  solo de las tareas «Registrar» sin hacer con su documento.
- Escribir el número a mano en «Está registrado en Séneca» marca hecha la tarea «Registrar» de ese documento, igual que
  cuando la app lee el sello.
- Los documentos que hoy están marcados «Pendiente de registro» pasan solos a tareas «Registrar», sin preguntar:
  - si ya llevan registro, solo se quita la marca;
  - si no, la tarea «Registrar» va al hito del que cuelga el documento; si no cuelga de ninguno, al primer hito sin
    hacer del asunto; si el asunto no tiene hitos, el documento conserva su marca «Sin registrar» antigua hasta que se
    registre (no se pueden poner marcas nuevas así).
- Desaparecen la palabra «Pendiente de registro» de todas las pantallas y la lista antigua del asunto.

## Pantalla de prueba
- Sin pantalla: una casilla cambia de nombre en el mismo sitio y el desplegable de hito ya existe en el cuadro de la
  bandeja (lo decidió Francisco el 14-nov-2026).

## Qué NO se hace en esta tarea
- No cambia nada del registro de Séneca en sí: lectura del sello, «Guardar encima el registrado», extracto.
- No se cambia el bloque «¿De qué tarea es?» de la fila 661.

## Notas técnicas de Claude
- Cuadro: `js/documentos-formulario.js` (`doc-fila-pendiente`, `doc-pendiente-registro`, `pendienteInicial` de la línea
  ~168). Guardado: `js/documentos-guardar.js` (bloque de `pendientesRegistro`, ~90-110, y el aviso de la ~213).
- Para colgar o crear la tarea, reutilizar `DocumentoATarea.colgar` (tarea nueva con acción «Registrar», sin marcarla
  hecha) y la búsqueda de tarea de `TareasConDocumento`. La tarea nueva obedece a la marca de la guía (fila 660), igual
  que la «Tarea nueva» de la fila 661. El desplegable «Hito» reutiliza la lista de `DocumentoTareaBloque` /
  `DocumentoATarea.hitosElegibles`.
- Número a mano: al guardar con número desde el cuadro, llamar a `Hitos.marcarGuionPorAccion(a, hitoId, 'registrar',
  nombreNuevo)` como hace `js/registro-sellado.js` (~274), en el hito del documento.
- Quitar `ficha.pendientesRegistro` como fuente: `js/registro.js` (`pendiente`, `quitarDePendientes`),
  `js/avisos-de-lo-que-falta.js` (`pendiente` y su uso en `sinRegistrar` y en el alcance «asunto»),
  `js/ficha-documentos-fila.js` (~110), `js/documentos.js` (~154), `js/hito-mesa-documentos.js` (comentario de la fila
  524), `js/documento-renombrar.js`. `js/nucleo-registro.js`, `js/puente.js` y `js/conflictos.js` siguen sabiendo leer y
  fundir la lista mientras quede algún asunto sin hitos con marcas antiguas.
- Paso automático de las marcas antiguas: al abrir el asunto (una vez por asunto), con `App.anotarLista(…, { quitar })`
  para vaciar la lista de lo que ya ha pasado a tarea. Apuntarlo en el Registro del asunto en una línea.
- Ajustar los datos de demostración (`js/demo/`) y las pruebas que usan `doc-pendiente-registro` o `pendientesRegistro`.
- Novedades: línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En los tres cuadros (ordenador, cambiar el nombre, bandeja) ya no sale «Pendiente de registro» y sale «Hay que
  registrarlo» en su sitio; al marcar «Está registrado en Séneca» se oculta.
- Guardar desde un hito sin tarea «Registrar» con «Hay que registrarlo»: aparece en ese hito la tarea «Registrar» sin
  hacer, con el documento colgado, y el documento sale «Sin registrar».
- Guardar con la casilla en un hito que ya tiene una tarea «Registrar» que espera ese tipo: no se crea otra; el documento
  cuelga de la que había.
- Desde la bandeja, la tarea «Registrar» va al hito elegido en «¿De qué tarea es?».
- Cuadro abierto sin hito: al marcar la casilla sale «Hito» con «+ Añadir hito»; sin elegirlo no guarda y lo dice.
- Guardar un documento escribiendo el número a mano: la tarea «Registrar» de ese documento queda hecha.
- Un asunto de demostración con un documento marcado a la antigua: al abrirlo, ese documento tiene su tarea «Registrar»
  en su hito y sigue saliendo «Sin registrar»; uno marcado que ya llevaba registro pierde la marca sin tarea.
- Al marcar el hito o cerrar el asunto con esa tarea sin hacer sale el aviso de lo que falta por registrar, y se puede
  seguir.
- Ninguna pantalla dice «Pendiente de registro».

## Qué mirar al terminar
- Guarda un documento en un hito con «Hay que registrarlo» marcado y mira que aparece la tarea «Registrar» con él.
- Abre un asunto donde hubieras marcado algo «Pendiente de registro» y mira dónde ha quedado su tarea «Registrar».
- Guarda un documento escribiendo el número de registro a mano y mira que su tarea «Registrar» queda hecha.

## Revisión y respuestas durante el trabajo
- (14-nov-2026, segundo revisor, APROBADA, en Chromium real sobre la copia de pruebas)
  - Los tres cuadros dicen «Hay que registrarlo», nunca «Pendiente de registro»; se oculta al marcar «Está registrado en Séneca» — coincide (la bandeja la abrió desde la consola, no desde «Por clasificar»).
  - Guardar desde un hito sin tarea «Registrar»: aparece sin hacer, con el documento, y «Sin registrar» — coincide.
  - Hito con una «Registrar» que espera el tipo: no se crea otra — coincide.
  - Bandeja: la tarea va al hito elegido — coincide.
  - Sin hito: sale «Hito» con «+ Añadir hito» y sin elegirlo no guarda y lo dice — coincide (no llegó a crear un hito desde ahí: lo cubre la prueba de la fila 660).
  - Número a mano: la tarea «Registrar» queda hecha — coincide.
  - Marca antigua: pasa a tarea en su hito; la del documento ya registrado pierde la marca sin tarea — coincide.
  - Avisos al marcar el hito y al archivar salen de la tarea y se puede seguir — coincide; el aviso al enviar un correo con adjuntos no lo ha podido ver (lo cubre `pruebas/avisos-de-lo-que-falta.mjs`).
  - Consola sin errores, pantallas principales y crear/archivar un asunto — coincide.
  - Lo que hace la app sin pedirlo: desde una tarea «Añadir documento» la tarea de añadir también queda hecha, como siempre (es la fila 638). Lo demás que anotó no viene de este cambio.
  - Decisión técnica: desmarcar «Hay que registrarlo» en un documento que ya colgaba de una tarea «Registrar» no la borra (el texto no lo pide).
  - Registrar con el botón «Registrar» de la ficha (sello de Séneca) no marca esta tarea, como ya ocurría con cualquier tarea «Registrar»: no se cambia el registro de Séneca en sí.
- (las apunta Claude Code)
