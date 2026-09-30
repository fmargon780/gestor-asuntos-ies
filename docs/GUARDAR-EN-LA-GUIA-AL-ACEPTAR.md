# Guardar en la guía al aceptar (fila 235)

Diseñado con Francisco en Cowork el 30-sep-2026, a partir de su aviso de soporte del mismo día
(«Ficha de un asunto», versión 30-sep-2026 · 04:10).

## Qué quiere Francisco

Su aviso: «Al crear un nuevo hito dentro de un tipo de asunto que ya tenía una guía, y querer
cambiar la guía, no me carga el mapa previo. Al crear tareas de ese hito, consecuentemente no me
deja añadirlos a la guía. Al crear un hito en cualquier asunto debería ofrecerme la opción de
añadirlo a la guía y que actualice la guía previa.»

Y en la conversación: «El botón también en la guía creo que está, pero no lo ofrece, hay que ir a
él. Si creo o modifico un asunto, antes de aceptar el cambio debe ofrecerme la posibilidad de
traspasar ese cambio a la guía.» Pidió además **la misma mecánica para hitos y para tareas**.

La idea: **todo cambio de hitos o de tareas hecho desde un asunto pregunta, antes de guardarse,
dónde se guarda. La pregunta es siempre la misma y no hay que ir a buscarla.**

Esto cambia a propósito dos decisiones anteriores:

- Fila 206: la casilla «También en la guía de <tipo>» desaparece (había que ir a ella).
- Fila 224: Intro en «Nueva tarea…» ya no guarda «solo aquí» sin preguntar. Francisco conoce el
  riesgo de mandar algo a la guía por costumbre; por eso el bloque dice a cuántos asuntos llega y
  el aviso de después lleva «Deshacer».

## Antes de empezar

- Lee `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md` y la parte de «Los hitos de un asunto» de
  `docs/contexto/HITOS-Y-GUIAS.md`. Como referencia, `docs/HITOS-DESDE-EL-ASUNTO.md` (fila 206) y
  `docs/TAREAS-DEL-HITO-SENCILLAS.md` (fila 224). **No leas el repositorio entero.**
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (guía, hito, tarea). Nada de
  «paso» ni «guion» en pantalla.
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (`docs/CONTEXTO-CORTO.md`, §6).
- Método de la fila 223: se trabaja en `pruebas`, revisor, y solo con su APROBADA a `main`. Sin
  pull request salvo que la sesión no tenga `git push`.

## 1. El bloque «¿Dónde se guarda?»

Una sola pieza, usada en todos los casos de abajo. Dos opciones, de las que se elige una:

- **«A la guía de <tipo corto>»** — marcada siempre al abrirse (no se recuerda la última
  elección). Debajo, en letra pequeña, la consecuencia:
  - «Llegará a N asuntos abiertos de este tipo.» (N = los demás abiertos del tipo, sin contar
    este.)
  - Si N es 0: «No hay más asuntos abiertos de este tipo. Valdrá para los próximos.»
  - Al cambiar o borrar, si en M de ellos el hito ya tiene trabajo: «En M no se tocará, porque
    ya tienen trabajo.»
  - Si el hito todavía no está en la guía (caso del punto 4): «El hito "<título>" todavía no
    está en la guía: irá con sus N tareas.»
- **«Solo en este asunto»**.

Teclado: flechas arriba y abajo cambian la opción, Intro acepta la marcada, Escape cancela **sin
guardar nada**. El foco entra en la opción marcada.

Cuándo no sale la opción de la guía: si el asunto no tiene tipo, no se pregunta y se guarda solo
en el asunto, como hoy. Si el hito está dentro de la respuesta de una pregunta (hoy eso solo se
cambia en Ajustes), la opción «A la guía» sale apagada, con el motivo a la vista: «Este hito está
dentro de una pregunta: en la guía se cambia desde Ajustes», y queda marcada «Solo en este
asunto». En modo consulta y en el ARCHIVO, nada de esto sale (como hoy).

## 2. Hitos: Crear, Cambiar y Borrar (menú «Hito ▾» y «+ Añadir un hito»)

- En los tres cuadros de `js/hitos-desde-el-asunto.js`, la casilla «También en la guía de <tipo>»
  se quita. En su sitio, al pie del cuadro y justo encima de los botones, va el bloque del punto
  1. No es una segunda ventana: el cuadro del hito ya es el emergente (`U.preguntar` solo admite
  un cuadro a la vez).
- El botón de aceptar del cuadro dice «Guardar» («Borrar» en el de borrar). Intro acepta con la
  opción marcada.
- Lo que hace cada opción al guardar es lo mismo que hoy hacía la casilla marcada o desmarcada
  (fila 206): una sola escritura de la guía, llega a los asuntos abiertos del tipo solo donde el
  hito esté vacío, nunca se toca el ARCHIVO ni la biblioteca.
- **Novedad**: «Cambiar» un hito propio del asunto (sin origen en la guía) también ofrece «A la
  guía». Si se elige, el hito entra en la guía como en el punto 4 (con sus tareas) y después se le
  aplica el cambio.

## 3. Tareas del hito (tarjeta «Tareas del hito» de la mesa)

La misma pregunta, en un emergente pequeño que se abre al aceptar lo escrito:

- **Nueva tarea**: escribir en «Nueva tarea…» y pulsar Intro abre el emergente «¿Dónde se
  guarda?», con el texto de la tarea arriba y el bloque del punto 1. Intro otra vez la guarda
  donde esté marcado; Escape cierra y **deja lo escrito en la caja**, sin guardar. Al guardar, la
  caja se vacía y conserva el foco para escribir otra (como hoy). La que va a la guía se añade al
  final de las tareas de ese hito en la guía; la que se queda, lleva «solo aquí» (como hoy).
- **Cambiar**: el «⋮» de una tarea de la guía deja de tener «Cambiar aquí» y «Cambiar en la
  guía»: tiene un solo **«Cambiar»**. Se edita en la propia línea, y al pulsar Intro sale el
  emergente. «A la guía» cambia el texto de la tarea en la guía y en los asuntos abiertos con la
  regla de siempre; «Solo en este asunto» hace lo que hoy hace «Cambiar aquí». Una tarea «solo
  aquí» se cambia igual: «A la guía» equivale a cambiarla y pasarla a la guía.
- **Borrar**: en una tarea de la guía, sale el emergente antes de borrar. «A la guía» la quita
  de la guía y de los asuntos abiertos donde no esté hecha; «Solo en este asunto», lo de hoy (se
  esconde aquí). En una tarea «solo aquí» no hay nada que preguntar: se borra como hoy.
- **«Pasar a la guía»** sigue en el «⋮» de las tareas «solo aquí» (para las que ya existen). Su
  confirmación pasa a ser el mismo emergente, con «A la guía» marcada.
- Para no perder el editor completo de las tareas de la guía (ordenar, explicar, receta), el «⋮»
  de una tarea de la guía lleva al final **«Abrir en la guía»**, que abre el editor de siempre
  con esa tarea resaltada (lo que hacía «Cambiar en la guía»).
- Menús que quedan. Tarea de la guía: Anotar · Cambiar · Borrar · Abrir en la guía. Tarea «solo
  aquí»: Anotar · Cambiar · Pasar a la guía · Borrar.

## 4. Un hito que no está en la guía se lleva entero

Hoy, una tarea de un hito propio del asunto no puede pasar a la guía (no hay hito de la guía donde
ponerla): es la segunda queja del aviso. Desde ahora, cuando algo de un hito propio va «A la
guía» (una tarea nueva, cambiada o pasada, o el propio hito al cambiarlo):

- El hito entra en la guía del tipo con su título, plazo, responsable y **todas sus tareas**
  (las «solo aquí» dejan de serlo, conservando si estaban hechas en este asunto).
- Se coloca en la guía donde le toca por su sitio en el asunto: detrás del hito anterior que venga
  de la guía; si no hay ninguno, al principio (la misma regla de «Crear» de la fila 206).
- **La guía conserva todo lo que ya tenía.** Solo se añade.
- En este asunto el hito queda enlazado con la guía. A los demás abiertos del tipo llega por el
  camino de siempre (fila 118).
- El bloque lo avisa antes (punto 1: «… todavía no está en la guía: irá con sus N tareas»).

## 5. El aviso de después, con «Deshacer»

- Verde, una línea, diciendo dónde se ha guardado: «Guardado en la guía de <tipo> y en N asuntos
  abiertos.» (con «en M no se ha tocado porque ya tenían trabajo» si toca), o «Guardado solo en
  este asunto.»
- Cuando ha ido a la guía, el aviso lleva un botón **«Deshacer»** y se queda a la vista unos 8
  segundos (más que un aviso normal). Pulsarlo deja la guía y los demás asuntos como estaban antes
  de ese guardado, y **en este asunto el cambio se queda** como «solo en este asunto». Después:
  «Deshecho: se queda solo en este asunto.»
- Deshacer un borrado de la guía devuelve a la guía (y a los asuntos de los que se quitó) lo
  borrado; en este asunto sigue borrado.
- Para deshacer, guardar en memoria lo que había antes de escribir (la guía del tipo y los hitos
  tocados de los otros asuntos); si al deshacer algo ya ha cambiado por otro lado, no pisarlo:
  avisar en ámbar de que no se ha podido deshacer del todo.
- Principal y accesorio por separado, como en la fila 206 (`U.fallo` / `U.accesorio`).

## 6. El fallo de «no me carga el mapa previo»

Reproducir con datos de demostración: en un asunto de un tipo que ya tiene guía, crear un hito
desde «Hito ▾» → «Crear», y después abrir «Cambiar la guía…» (del mismo menú) y el mapa de la
guía. Según Francisco, la guía previa no se carga. Buscar la causa y arreglarla: deben verse
siempre todos los hitos que la guía ya tenía, más el nuevo si fue a la guía. Si no se consigue
reproducir, probar también con el hito nuevo creado «solo en este asunto» y abriendo esas
pantallas desde la mesa de ese hito; dejar escrito en la nota de la fila qué se encontró.

## Ficheros

- Nuevo `js/donde-se-guarda.js` (o el nombre que encaje): el bloque del punto 1 (pintarlo, leer la
  elección, el teclado, contar N y M con funciones puras) y el emergente pequeño de las tareas.
- `js/hitos-desde-el-asunto.js` (542 líneas): quitar la casilla, usar el bloque, y llevar un hito
  propio a la guía con sus tareas. **Está cerca de las 600**: lo nuevo de «llevar el hito entero» y
  de «Deshacer» va a un fichero aparte (por ejemplo `js/hitos-desde-el-asunto-guia.js`).
- `js/hito-mesa-guion.js` (la caja «Nueva tarea…») y `js/hito-mesa-tarea-menu.js` (el «⋮»).
- `js/hito-mesa.js` o donde viva «Cambiar la guía…» y el mapa: solo lo que pida el punto 6.
- `js/util.js` solo si el aviso con botón «Deshacer» no se puede hacer sin tocarlo.
- `index.html` y la lista de ficheros de la copia sin internet: los `<script>` nuevos.
- Pruebas: poner al día `pruebas/hitos-desde-el-asunto.mjs` y `pruebas/tareas-del-hito-sencillas.mjs`
  (buscan la casilla, «Cambiar aquí», «Cambiar en la guía» y el Intro que guarda sin preguntar) y
  añadir `pruebas/donde-se-guarda.mjs`: Intro-Intro manda la tarea a la guía y llega a otro
  abierto; elegir «Solo en este asunto»; Escape no guarda y conserva lo escrito; tarea de un hito
  propio se lleva el hito con sus tareas sin perder nada de la guía; «Deshacer»; el punto 6.
- Datos de demostración: que haya al menos dos asuntos abiertos del mismo tipo con guía, para
  que el revisor pueda ver «Llegará a N asuntos abiertos».
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, línea de Hitos, sustituyendo),
  `docs/contexto/HITO-MESA.md`, `docs/contexto/HITOS-Y-GUIAS.md`, `docs/VOCABULARIO.md` si hace
  falta, `docs/HISTORIA.md` y `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

Al crear, cambiar o borrar un hito o una tarea desde un asunto, antes de guardar se elige «A la
guía de <tipo>» (marcada) o «Solo en este asunto», y el aviso verde lleva «Deshacer».

## Cómo sabemos que está bien

1. Abrir un asunto de un tipo con guía, abrir la mesa de un hito, escribir «Pedir el libro de
   familia» en «Nueva tarea…» y pulsar Intro: sale «¿Dónde se guarda?» con «A la guía de …»
   marcada y debajo «Llegará a N asuntos abiertos de este tipo». Pulsar Intro otra vez: aviso
   verde «Guardado en la guía…» con «Deshacer». Abrir otro asunto abierto del mismo tipo con ese
   hito sin trabajo: la tarea está.
2. Escribir otra tarea, pulsar Intro, bajar con la flecha a «Solo en este asunto» e Intro: la
   tarea sale con «solo aquí» y en el otro asunto del mismo tipo no está.
3. Escribir otra tarea, pulsar Intro y después Escape: no se guarda nada y lo escrito sigue en la
   caja.
4. Guardar una tarea «A la guía» y pulsar «Deshacer» en el aviso verde: en este asunto la tarea
   sigue, ahora con «solo aquí»; en el otro asunto del mismo tipo ya no está.
5. Pulsar «Hito ▾» → «Crear», poner un título y elegir «Solo en este asunto». En ese hito nuevo,
   escribir una tarea e Intro: el emergente dice que el hito todavía no está en la guía y que irá
   con sus tareas. Aceptar «A la guía». Abrir Ajustes → la guía de ese tipo: están todos los hitos
   que ya tenía, más el nuevo con su tarea, en su sitio.
6. Pulsar «Hito ▾» → «Cambiar» y «Hito ▾» → «Borrar»: ninguno lleva ya la casilla «También en la
   guía de…»; los dos llevan las dos opciones con «A la guía de …» marcada y la línea de a cuántos
   asuntos llega.
7. En una tarea que viene de la guía, pulsar «⋮»: salen «Anotar», «Cambiar», «Borrar» y «Abrir en
   la guía». Pulsar «Cambiar», cambiar el texto e Intro: sale la misma pregunta.
8. Después de crear un hito en un asunto de un tipo con guía, pulsar «Hito ▾» → «Cambiar la
   guía…» y abrir el mapa de la guía: se ven todos los hitos que la guía ya tenía.
