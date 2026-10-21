# Los tres puntitos «⋮» también en las tareas que son pregunta (fila 405)

Aviso de usuario del 21-oct-2026, desde el botón de soporte (perfil Administración, versión
21-oct-2026 · 11:28): «Cuando configura la tarea de un hito como una pregunta, desaparece los 3
puntitos para poder modificarla.» Aviso completo y captura:
https://drive.google.com/file/d/1BXrQ_UT99PQZZ_gw-9qcyV-gMROjue1Z/view?usp=drivesdk

Ojo: se trata de las **preguntas dentro de las tareas del hito** (fila 116,
`docs/PREGUNTAS-EN-EL-GUION.md`: «¿…?» con un botón por respuesta). El hito-pregunta «¿Qué supuesto
es?» no se toca.

## Qué quiere Francisco

Una pregunta de las tareas lleva su «⋮» como cualquier otra tarea de la guía (fila 224,
`docs/TAREAS-DEL-HITO-SENCILLAS.md`; fila 235, `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`), con las
mismas opciones: **Anotar · Cambiar · Borrar · Abrir en la guía**.

Hoy una pregunta solo puede venir de la guía (no hay preguntas «solo aquí»), así que no lleva
«Pasar a la guía». No se añade ninguna opción nueva. Las respuestas de la pregunta no se cambian
desde el «⋮»: para eso sigue «Abrir en la guía».

## Por qué pasa

En `js/hito-mesa-guion.js`, el bucle que engancha cada tarea (`HitoMesaTareaMenu.engancharFila`)
recorre solo `.guion-paso:not(.guion-pregunta)…`, y `preguntaGuionHTML` no tiene la envoltura
`.guion-paso-fila` donde van el «⋮» y el 💬 (`HitoMesaTareaMenu.botonesHTML` / `debajoHTML`), ni
recibe el asunto `a`. Las preguntas se quedaron fuera porque ese bucle también engancha la casilla
de hecha, que una pregunta no tiene.

## Qué hay que hacer

1. **Pintar.** `preguntaGuionHTML` pinta el «⋮» y el 💬 igual que una tarea normal, en el mismo
   sitio de la línea, solo con el hito abierto. Una pregunta sigue sin casilla.
2. **Enganchar.** El «⋮» de las preguntas se engancha con `HitoMesaTareaMenu.engancharFila`, sin
   tocar lo que hace la casilla de las tareas normales. El menú de una pregunta no ofrece «Pasar a
   la guía».
3. **Anotar.** Ya funciona tal cual: la nota lleva delante el texto de la pregunta.
4. **Cambiar.** Cambia solo el texto de la pregunta, en la propia línea; Intro abre el emergente
   «¿Dónde se guarda?» como siempre.
   - «A la guía»: cambia el texto de la pregunta en la guía del tipo, como el editor de siempre.
   - «Solo en este asunto»: **no** usar `Hitos.cambiarGuionAqui` (crearía una sustituta sin
     respuestas, y `unir()` en `js/hitos-guion.js` no mira ni `guionOcultos` ni sustitutas en las
     preguntas). En su lugar, guardar en el hito un texto alternativo por id de pregunta (por
     ejemplo `guionTextos[idPregunta]`) y que `unir()` lo use al pintar la pregunta. Así las
     respuestas y la respuesta elegida (`guionElegido`) no se tocan.
5. **Borrar.** Siempre con el emergente «¿Dónde se guarda?».
   - «Solo en este asunto»: `ocultarGuionDeGuia` como hoy, y `unir()` tiene que respetar
     `guionOcultos` en las preguntas: si la pregunta está oculta, no se pintan ni ella ni las
     líneas de ninguna de sus respuestas (tampoco van a `plegadas`). Lo ya marcado se queda
     guardado sin estorbar.
   - «A la guía»: se quita de la guía del tipo. Para una pregunta, no llamar a `conservarHechas`
     (copiaría la pregunta como tarea normal, sin respuestas). Contar como «con trabajo» los
     asuntos que tienen `guionElegido[idPregunta]`, no `guionHecho`. **Decisión de Francisco:** en
     esos asuntos la pregunta y las tareas de su respuesta dejan de verse; se acepta, pero el
     emergente lo avisa antes de aceptar con la frase «En N asuntos ya está respondida; allí
     dejará de verse.» (sin la frase si N es 0).
6. Revisar `js/hito-mesa-tarea-menu.js` y `js/donde-se-guarda-tareas.js` por si alguna otra acción
   da por hecho que la tarea no es pregunta.

## Pruebas y contexto

- Prueba nueva: una pregunta de la guía muestra el «⋮» con Anotar, Cambiar, Borrar y Abrir en la
  guía (sin «Pasar a la guía»); «Cambiar» solo aquí cambia su texto en este asunto, conserva la
  respuesta elegida y no cambia otros asuntos; «Borrar» solo aquí la quita junto con las tareas de
  su respuesta; «Borrar» a la guía avisa «En N asuntos ya está respondida…» cuando la hay
  respondida en otro asunto.
- Ningún fichero de `js/` pasa de 600 líneas.
- Al terminar: `docs/contexto/HITO-MESA.md`, `docs/CONTEXTO-CORTO.md` si cambia algo de su línea
  de «Hitos», y `docs/HISTORIA.md`.

## Ejemplo con datos reales

Asunto «Registro de Salida A26-0465», hito «2. Registro de Salida». En «Tareas del hito», la tarea
«Escanear comunicación» se convirtió en la pregunta «¿La parte superior derecha del documento está
ocupada?» (respuestas Sí / No; elegida «No»). Hoy no lleva «⋮»; después del arreglo, sí.

## Cómo sabré que está bien

1. En una tarea convertida en pregunta se ven los tres puntitos, igual que en las demás tareas.
2. Al pulsarlos salen las mismas opciones que en una tarea normal (por ejemplo, «Cambiar» y
   «Borrar»).
3. «Cambiar» deja cambiar el texto de la pregunta, y el cambio se ve al momento.
4. «Borrar» quita la pregunta de ese asunto, y también las tareas que colgaban de su respuesta.
