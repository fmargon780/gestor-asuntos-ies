# Crear, cambiar y borrar hitos desde el asunto (fila 206)

Cerrado con Francisco el 27-sep-2026, en conversación. Lo que busca: **escribir y corregir la guía
de un tipo desde un asunto concreto, sin salir a Ajustes.** Hoy desde la mesa ya se cambian las
tareas de un hito («✎ Cambiar las tareas»); esto lo amplía a los hitos enteros.

## Antes de empezar

- Lee `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md` y la parte de «Los hitos de un asunto» de
  `docs/contexto/HITOS-Y-GUIAS.md` (sobre todo «Los pasos nuevos de la guía llegan a los asuntos
  abiertos», fila 118). **No leas el repositorio entero.**
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (guía, hito, tarea).
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (regla de `docs/CONTEXTO-CORTO.md`, §6).

## Qué ve Francisco

En la mesa de un hito, menú «···» de la cabecera, tres opciones (en lugar de lo que hay hoy, ver
«Qué sustituye»):

1. **«+ Crear un hito»**. Cuadro con:
   - Título (obligatorio).
   - Plazo y responsable (opcionales; los mismos controles que ya usa la guía).
   - Desplegable **«Colocar después de»** con los hitos visibles del asunto, en su orden. Viene
     elegido el hito de la mesa abierta. Primera opción: «Al principio».
   - Casilla **«También en la guía de <tipo corto>»**, marcada por defecto.
2. **«Cambiar este hito»**. El mismo cuadro, relleno con lo del hito: título, plazo, responsable y
   «Colocar después de» (sirve también para moverlo de sitio). Misma casilla, marcada.
3. **«Borrar este hito»**. Solo si el hito está **vacío** (definición abajo). Si no lo está, la
   opción sale apagada con el motivo en su `title`: «Tiene trabajo: no se puede borrar». Pide
   confirmación con la misma casilla, marcada.

La casilla solo sale si tiene sentido: al crear, si el tipo tiene guía (o se va a estrenar con
este hito); al cambiar o borrar, si el hito viene de un paso que sigue en la guía (`origenGuia`).
Un hito propio del asunto (sin `origenGuia`) se cambia o se borra solo en el asunto, sin casilla.

No sale nada de esto en modo consulta, en el ARCHIVO, ni en un hito-pregunta (clase `decision`):
las preguntas se siguen escribiendo en Ajustes.

## Qué es un hito vacío

Estado distinto de «hecho», sin ninguna tarea marcada (`guionHecho` sin `hecho` ni valor), sin
tareas propias (`guionPropio`), sin notas del hito, sin documentos apuntados, sin rama elegida y
sin cambios hechos a mano en plazo o responsable. «En curso» solo no cuenta como trabajo (igual que
en `js/hitos-cambio-de-tipo.js`). Una función pura, `HitosDesdeElAsunto.estaVacio(h, a)`, usada en
los tres casos.

## Qué pasa al guardar

### Solo en este asunto (casilla desmarcada, o hito propio)

- Crear: hito nuevo sin `origenGuia`, en el sitio elegido (hoy `Hitos.anadirHito` lo pone al
  final: hace falta poder indicar la posición).
- Cambiar: se cambia este hito. Mover: se reordena en el asunto.
- Borrar: `Hitos.quitarHito`, como hoy.

### También en la guía (casilla marcada)

Una sola escritura de `guias.json` con `GuiasDelCentro.cambiarPasos(tipo, fn)` (relee antes de
escribir) y una sola de `hitos.json` con `Hitos.cambiar` para todos los asuntos abiertos del tipo.

- **Crear**: paso nuevo en la guía, detrás del paso de origen del hito elegido en «Colocar
  después de». Si ese hito es propio, detrás del hito anterior que sí venga de la guía; si no hay
  ninguno, al principio. Si el hito elegido está dentro de una respuesta de una pregunta, el paso
  nuevo va dentro de esa misma respuesta. En este asunto, el hito nuevo nace con `origenGuia` del
  paso nuevo y en el sitio exacto elegido. En los demás abiertos entra solo, por el camino de la
  fila 118 (`Hitos.llevarGuiaAAbiertos`), que ya lo coloca detrás del hito del paso anterior.
- **Cambiar**: se cambia el paso de la guía (título, plazo, responsable, posición). En este
  asunto, se cambia el hito. En cada otro asunto abierto del tipo, el hito con ese `origenGuia` se
  pone igual **solo si está vacío**. Si tiene trabajo, no se toca. La posición, igual: se mueve solo
  donde esté vacío.
- **Borrar**: se quita el paso de la guía. En este asunto, se quita el hito. En cada otro asunto
  abierto del tipo, se quita **solo si está vacío**; si tiene trabajo, se queda. El id queda en
  `pasosConocidos` (ya lo hace `Hitos.leer`), para que la fila 118 no lo devuelva.
- **Aviso antes de borrar de la guía**: si el paso es el único de una respuesta de una pregunta,
  el cuadro de confirmar lo dice en una línea: «La respuesta "<texto>" de la pregunta "<título>" se
  quedará sin hitos.» No bloquea.
- **Nunca se toca**: el ARCHIVO, la biblioteca de hitos del centro (`hitos-biblioteca.json`), ni un
  hito hecho o con trabajo en otro asunto.
- `recomputeEnCurso` en cada asunto tocado, solo si se quedó sin hito en curso.
- «Hito N de M» y el estado se ajustan solos (ya salen de los hitos).

### El aviso de después

Verde, una línea: «Hecho también en la guía y en N asuntos abiertos.» Si alguno se ha quedado sin
tocar por tener trabajo: «… N asuntos abiertos; en M no se ha tocado porque ya tenían trabajo.»
Principal y accesorio por separado (`U.fallo` / `U.accesorio`): la guía y este asunto son lo
principal; los demás asuntos, lo accesorio.

## Qué sustituye

- «+ Añadir un hito a la guía del tipo» del «···» (fila 120) en realidad añade una **tarea**: pasa
  a llamarse «+ Añadir una tarea a la guía del tipo», sin más cambios.
- «Quitar este hito» del «···» pasa a ser «Borrar este hito», con las reglas de aquí. El botón
  oculto `.hito-quitar` de `js/hitos-panel-lista.js` sigue sirviendo para quitar solo del asunto.
- «+ Añadir un hito» de la lista de hitos (`HitosPanel.pedirYAnadirHito`) abre el mismo cuadro de
  «Crear un hito», con «Colocar después de» en el último.

## Ficheros

- Nuevo `js/hitos-desde-el-asunto.js`: los tres cuadros, `estaVacio` y el reparto a la guía y a
  los asuntos abiertos (funciones puras separadas de la escritura, para probarlas). Si pasa de 600
  líneas, se parte (por ejemplo `js/hitos-desde-el-asunto-guia.js` para lo de la guía).
- `js/hito-mesa.js`: las opciones del «···».
- `js/hitos-panel.js`: `pedirYAnadirHito` llama al cuadro nuevo.
- `js/hitos.js` **no crece** (está en 600 líneas): lo que haga falta, en el fichero nuevo o en
  `js/hitos-sincronizar.js`.
- `index.html`: el `<script>` nuevo, detrás de `js/hito-mesa.js`. Si hay lista de ficheros de la
  copia sin internet, que entre también.
- Nueva `pruebas/hitos-desde-el-asunto.mjs`: crear en un sitio elegido (en el asunto, en la guía y
  llegando a otro abierto); cambiar título y moverlo (se cambia en el vacío, no en el que tiene
  trabajo); borrar (apagado con trabajo; con la casilla, se va de la guía y del abierto vacío, se
  queda en el que tiene trabajo); el aviso de respuesta sin hitos; el ARCHIVO intacto.
- Documentación: `docs/CONTEXTO-CORTO.md` (§5, línea de Hitos, sustituyendo), `docs/contexto/HITO-MESA.md`,
  `docs/contexto/HITOS-Y-GUIAS.md`, `docs/HISTORIA.md` y `docs/COLA.md`.

## Cómo subir

- Directamente a `main`, **sin pull request** (si la sesión lo tiene forzado, PR y fusión según la
  nota de `docs/COLA.md`).
- Como mucho tres subidas: marcar EN CURSO, código y pruebas juntos, documentación.
- Una sola vez `npm test` al final; nada se sube en rojo.
- Comprobar lo publicado con `curl` (que se sirve `js/hitos-desde-el-asunto.js`).

## Qué dirá Claude Code a Francisco al terminar

En la mesa de un hito, en «···»: «Crear un hito», «Cambiar este hito» y «Borrar este hito». Cada
uno pregunta si va también a la guía, ya marcado.
