# Botón de la acción dentro de la propia tarea del hito (fila 410)

Aviso de usuario del 21-oct-2026, desde el botón de soporte (perfil Administración, versión
21-oct-2026 · 11:28, pantalla «Ficha de un asunto»): «Si configuro una tarea en la guía como que
tiene asociada una acción que es el envío de un correo con una plantilla determinada, ¿por qué
cuando llego a la tarea "no ocurre nada" ni nos pide hacer nada? ¿No debería activarse de algún
modo la ejecución de la acción definida?» Aviso completo y captura:
https://drive.google.com/file/d/1z88QShh6rXLKG_hqOILk5g7KBlAGceGE/view?usp=drivesdk

## Qué pasa hoy

Una tarea de la guía puede llevar una acción (`accion` + `receta`, `js/guias-guion.js`):
`comunicar` (correo o Séneca, con destinatarios y plantilla), `generar` (documento con plantilla)
o `registrar`. En la mesa del hito, esas acciones solo se lanzan desde la cabecera: «Hacer este
hito», «Comunicar ▾» y «Generar documento ▾» (fila 164, `js/hito-mesa-recetas.js`). La línea de la
tarea en «Tareas del hito» (`js/hito-mesa-guion.js`) no enseña nada: no se ve que esa tarea tiene
un correo o un documento que hacer.

## Qué quiere Francisco (decidido con él el 21-oct-2026)

1. Cada tarea **pendiente** (sin marcar y sin «No aplica») con acción `comunicar` lleva, en su
   propia línea, un botón **«Enviar correo»**, o **«Enviar por Séneca»** si el canal que se abrirá es
   Séneca. El canal se calcula igual que en `comunicarPaso`: `receta.via`, o si no lo hay, el
   primero de `HitosComunicar.canalesDe(a, h)`, o `'correo'`. Con acción `generar`, un botón **«Generar documento»**.
2. Sale en **todas** las tareas pendientes con acción, no solo en la resaltada (la siguiente que
   toca). Cuando la tarea queda hecha o «No aplica», su botón desaparece.
3. Las tareas con acción `registrar` **no** llevan botón. Tampoco las tareas sin acción ni las
   preguntas.
4. El botón hace exactamente lo mismo que elegir esa tarea en el menú de la cabecera:
   - Correo: abre el cuadro de Correo (o de Séneca) ya con los destinatarios y la plantilla de la
     receta, igual que `comunicarPaso` en `js/hito-mesa-recetas.js`. Antes de llamarla hay que sacar
     la lista de destinatarios posibles con `await HitoMesaComunicar.candidatos(a, h)` y pasársela
     (sin ella el cuadro sale sin destinatarios); mejor exportar desde `HitoMesaRecetas` una función
     que haga los dos pasos. Cuando el cuadro deja preparado el correo y apunta su nota en el hito
     (`apuntarElRastro`, `js/correo-rastro.js`), se marca **esa** tarea (por su `idPasoGuion`),
     con el nombre de quien lo hace y la fecha. Si la receta no tiene
     plantilla, el cuadro se abre para elegirla, como hoy desde «Comunicar ▾».
   - Documento: igual que `generarPaso`, pasándole la `fila` de la mesa (la misma que recibe
     `HitoMesaGuion.pintar`, para que encuentre el botón escondido `.hito-generar`) y como `boton`
     el de la tarea (para que enseñe «Guardando…»): con plantilla fija la genera y marca esa tarea; sin ella,
     abre el cuadro de elegir plantilla de siempre; con la plantilla fuera de uso, el aviso de la
     fila 321 y no genera nada.
   Reutilizar esas funciones; no escribir un camino nuevo.
5. **Nada más cambia**: la cabecera («Hacer este hito», «Generar documento ▾», «Comunicar ▾»,
   «Registrar») sigue igual, el «⋮» y el 💬 de la tarea siguen igual, y la casilla de marcar a mano
   también.
6. El botón sale en las mismas condiciones que las tareas de «Comunicar ▾» y «Generar documento ▾»
   de la cabecera: asunto no archivado, también en asuntos de grupo. En un ordenador de solo
   consulta sale desactivado, con el título «En este ordenador solo se puede consultar».
   También sale en las tareas pendientes de un hito ya marcado como hecho (decisión de Francisco):
   así se puede mandar el correo tarde sin reabrir el hito.

## Dónde mirar

- `js/hito-mesa-guion.js`: pinta y engancha las líneas de «Tareas del hito».
- `js/hito-mesa-recetas.js`: `pendientes`, `comunicarPaso`, `generarPaso` (hay que exportar las
  dos últimas, o una función que las llame, para usarlas desde la línea de la tarea).
- `js/hito-mesa-guion.js`, `pasoHTML`: pinta la línea. El botón nuevo va en la misma fila, delante
  del 💬 y del «⋮» (`HitoMesaTareaMenu.botonesHTML`), pegado a ellos, para que estos no se muevan
  cuando el botón aparece o desaparece. Cambiar el comentario de la fila 154 (líneas 73-75), que
  dice que las tareas no llevan botones de acción.
- Ningún fichero de `js/` pasa de 600 líneas; si `hito-mesa-guion.js` se pasa, sacar lo nuevo a un
  fichero propio.

## Pruebas y contexto

- Prueba nueva: en la demostración, un hito con una tarea `comunicar` y otra `generar` pendientes y
  una `registrar`: las dos primeras llevan su botón y la tercera no; pulsar «Enviar correo» abre el
  cuadro con la plantilla y los destinatarios de la receta; al enviarlo, esa tarea queda marcada y
  su botón desaparece; pulsar «Generar documento» genera el documento y marca la tarea.
- Datos de la demostración: usar el hito de `js/demo/datos-hacer-hito.js` (ya tiene una tarea
  `generar` con plantilla, una `registrar` y una `comunicar`) y ponerle a la tarea `comunicar`
  (`g-hacer-comunicar`) una plantilla de correo que exista (por ejemplo `pl-demo-baja`). No tocar
  `js/demo/datos.js`, que ya pasa de 600 líneas.
- Novedad visible en `js/novedades.js` (regla 21 de la cola).
- Al terminar: `docs/contexto/HITO-MESA.md`, `docs/CONTEXTO-CORTO.md` si cambia su línea de
  «Hitos», y `docs/HISTORIA.md`.

## Ejemplo con datos reales

- Correo: asunto **A26-0468**, hito «3. Envío de la Comunicación». La tarea «Se envía comunicación
  por mail al tutor de la unidad y a los tutores legales adjuntando copia del documento» tiene en
  la guía la acción de correo con plantilla. Hoy no enseña nada; después del arreglo lleva
  «Enviar correo».
- Documento: Francisco no tiene un caso real a mano; se prueba con la demostración.

## Cómo sabré que está bien

1. En el asunto A26-0468, hito «Envío de la Comunicación», la tarea «Se envía comunicación por
   mail…» lleva un botón «Enviar correo». **[SOLO FRANCISCO]** (datos reales; el revisor lo
   comprueba con el caso equivalente de la demostración).
2. Al pulsarlo, se abre el correo con la plantilla y los destinatarios que se pusieron en la guía.
3. Al preparar el correo desde ese cuadro, la tarea queda marcada con el nombre de quien envía y la fecha, y su botón
   desaparece.
4. Una tarea con «Generar documento» lleva su botón; al pulsarlo sale el documento y la tarea se
   marca.
5. Las tareas sin acción, y las de registrar, no llevan botón.
