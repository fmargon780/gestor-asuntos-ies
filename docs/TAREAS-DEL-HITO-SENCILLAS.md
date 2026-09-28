# Tareas del hito, sin texto de sobra (fila 224)

Diseñado con Francisco en Cowork el 28-sep-2026. Boceto aprobado: tarjeta «Tareas del hito» con una
sola casilla para escribir, un «⋮» por tarea y el menú del hito con tres palabras.

## Qué quiere Francisco

«Mira cuanto texto (3 frases largas) para añadir una tarea a un hito. Este tipo de cosas son las
que hacen inteligible una app. Es necesario simplificar y hacer intuitivo.» (quería decir: las que
hacen que no se entienda)

Hoy, en la mesa de un hito sin tareas, se lee: «Este hito todavía no tiene tareas. Añade la primera
tarea aquí abajo.», «+ Añadir una tarea solo para este asunto» y «✎ Cambiar las tareas de este hito
(para todos los asuntos de este tipo)», pegados y con letras de distinto tamaño. Y el menú «···»
mezcla hitos y tareas, repitiendo «hito» en cada opción.

La idea: **cada cosa se hace donde está, con una o dos palabras, y lo que se hace sin mirar nunca
toca otros asuntos.**

## 1. La tarjeta «Tareas del hito» (`js/hito-mesa-guion.js`)

- Se quita la frase «Este hito todavía no tiene tareas…». La barra y el «0 de 0» ya lo dicen.
- Se quitan los dos enlaces del pie («+ Añadir una tarea solo para este asunto» y «✎ Cambiar las
  tareas de este hito (para todos…)»).
- En su lugar, al pie de la lista, **una sola caja de texto** con el marcador «Nueva tarea… (escribe
  y pulsa Intro)», a todo el ancho de la tarjeta. Intro la añade **solo a este asunto** (lo mismo que
  hoy hace «+ Añadir una tarea solo para este asunto», `guionPropio`), vacía la caja y deja el foco
  en ella para escribir otra. Sin ventana ni pregunta. Caja vacía + Intro: no hace nada. Solo con el
  hito abierto (como hoy).
- **No hay casilla «También en la guía…»**: Francisco vio el riesgo de pulsar Intro sin fijarse. Lo
  seguro es que lo escrito sin mirar quede solo aquí; llevarlo a la guía es un paso aparte (punto 2).
- Cada tarea que existe solo en este asunto lleva una etiqueta pequeña y gris **«solo aquí»**. Las
  que vienen de la guía, ninguna.
- Respetar `U.conservandoLoEscrito`: si la tarjeta se repinta mientras se escribe en la caja, no se
  pierde lo escrito ni el foco.

## 2. El «⋮» de cada tarea

Cada tarea lleva a su derecha un «⋮» pequeño (con `FichaMenus.montar`, como los demás menús), visible
siempre (no solo al pasar el ratón: el Chromebook también se usa táctil). No debe mover ni tapar el
«No aplica» que ya existe. Solo con el hito abierto.

**Tarea que viene de la guía:** Anotar · Cambiar aquí · Cambiar en la guía · Borrar

**Tarea «solo aquí»:** Anotar · Cambiar · Pasar a la guía · Borrar

- **Anotar**: abre una línea para escribir justo debajo de la tarea (no una ventana). Intro guarda;
  Escape cierra sin guardar. La nota va a la **libreta única del asunto** (`NotasHito.anadirDesdeHito`,
  con `hito` e `hitoTitulo` como hoy) y además lleva la tarea (su id y su texto de entonces). El
  texto guardado empieza por el nombre de la tarea: «Revisar DNI o NIE: el DNI caduca en
  noviembre». Sale, por tanto, en la tarjeta «Notas» de la mesa y en la ficha como cualquier nota.
  La tarea con notas lleva un **💬** pequeño (con el número si hay más de una); pulsarlo despliega
  sus notas debajo de la tarea, y volver a pulsarlo las pliega. Las tareas no tienen notas ni
  documentos propios más allá de esto (decidido con Francisco: el hito ya lo reúne todo).
- **Cambiar aquí** (tarea de la guía): cambia el texto solo en este asunto; la guía y los demás
  asuntos no se tocan. Se edita en la propia línea (el texto pasa a caja, Intro guarda, Escape
  cancela). La tarea conserva su sitio, su marca de hecha y su receta; desde ese momento lleva
  «solo aquí». Cómo se guarde por dentro lo decide la sesión (p. ej. esconder la de la guía en este
  asunto y poner una propia en su sitio), siempre sin romper los asuntos que ya existen ni la cuenta
  «N de M».
- **Cambiar en la guía** (tarea de la guía): abre el editor de tareas de siempre (el que hoy abre
  «✎ Cambiar las tareas de este hito», `GuiasDelCentro.cambiarPasos`), con esa tarea ya a la vista y
  resaltada. Ahí sigue pudiéndose ordenar, explicar, poner receta, etc. El título de la ventana dice
  a qué afecta: «Cambiar en la guía de <tipo>».
- **Cambiar** (tarea «solo aquí»): igual que «Cambiar aquí», en la propia línea.
- **Pasar a la guía** (tarea «solo aquí»): la lleva al final de las tareas de este hito en la guía
  del tipo, sin preguntar nada más que una confirmación de una línea («¿Pasar "…" a la guía de
  <tipo>? Llegará a los asuntos abiertos de este tipo.»). En este asunto deja de ser «solo aquí» y
  conserva si estaba hecha. Llega a los demás asuntos abiertos del tipo con la regla de siempre (fila
  206: solo a los hitos vacíos, uno con trabajo no se toca). Sustituye a la opción del menú «+ Añadir
  una tarea a la guía del tipo», que desaparece.
- **Borrar**: quita la tarea **solo de este asunto** (una de la guía queda escondida aquí; una «solo
  aquí» se borra). Si está hecha o tiene notas, una confirmación de una línea. Para quitarla de la
  guía, «Cambiar en la guía».

## 3. El menú del hito (`js/hito-mesa.js`, el botón «···» de la cabecera de la mesa)

- El botón pasa a decir **«Hito ▾»**.
- Arriba, tres opciones, sin repetir la palabra: **Crear · Cambiar · Borrar** (hoy «+ Crear un
  hito», «Cambiar este hito», «Borrar este hito», fila 206; mismas funciones de
  `HitosDesdeElAsunto`, y «Borrar» sigue apagado con trabajo apuntado). Los títulos de las ventanas
  que abren pueden seguir diciendo «Crear un hito», etc.: ahí sí hace falta el contexto.
- Sale del menú «+ Añadir una tarea a la guía del tipo» (ahora es «Pasar a la guía» de cada tarea).
- Las demás opciones que hoy viven en «···» («Saltar a este hito…», «Dejarlo solo informativo» /
  «Pedírmelo a mí», «Cambiar la guía…», «Enviar estado») se quedan debajo de una raya, con su
  texto de siempre: esta fila no las mueve.
- **Crear**: la ventana empieza por **un solo campo**, «Título, o busca en la biblioteca». Mientras
  se escribe, debajo salen los hitos de la biblioteca que casan (por palabras sueltas, como los
  demás buscadores); pulsar uno lo usa (lo mismo que hoy «Usarlo»). Si no se elige ninguno, lo
  escrito es el título de un hito nuevo y la ventana sigue como hoy («Colocar después de», «También
  en la guía de <tipo>»). Así elegir de la biblioteca no es una opción aparte del menú.

## 4. Palabras

Todo con `docs/VOCABULARIO.md`: **hito**, **tarea**, **tareas del hito**, **hito de la biblioteca**,
**guía**. Nada de «guion» ni «paso» en pantalla. Añadir a `VOCABULARIO.md`, si no están: «solo aquí»
(tarea que existe solo en este asunto) y «Anotar» (nota escrita desde una tarea).

## 5. Pruebas y contexto

- Poner al día las pruebas que buscan los textos o botones que desaparecen (`guion-anadir-propio`,
  `guion-cambiar-guion`, `mesa-anadir-guia`, «+ Crear un hito», «Cambiar este hito», «Borrar este
  hito»…) y añadir una prueba nueva con: Intro añade solo aquí; «Pasar a la guía»; «Cambiar aquí» no
  toca la guía; «Anotar» deja la nota en la libreta con el nombre de la tarea y el 💬.
- Ningún fichero de `js/` pasa de 600 líneas: si `js/hito-mesa-guion.js` crece de más, el «⋮» y sus
  acciones van a un fichero nuevo (p. ej. `js/hito-mesa-tarea-menu.js`).
- Al terminar: `docs/contexto/HITO-MESA.md` (sustituir lo que describe el pie del guion y el menú
  «···»), `docs/CONTEXTO-CORTO.md` sección 5 (la línea de «Hitos») y `docs/HISTORIA.md`.

## Cómo sabemos que está bien

1. Abrir un asunto con datos de demostración, abrir la mesa de un hito sin tareas: bajo «Tareas del
   hito» no hay ninguna frase ni enlace, solo la caja «Nueva tarea… (escribe y pulsa Intro)».
2. Escribir «Revisar DNI o NIE» y pulsar Intro: la tarea aparece en la lista con la etiqueta «solo
   aquí», la caja queda vacía y se puede escribir otra sin volver a pulsar en ella. Abrir otro
   asunto del mismo tipo, en el mismo hito: esa tarea no está.
3. En esa tarea, pulsar «⋮» → «Pasar a la guía» y confirmar: pierde la etiqueta «solo aquí». Abrir
   otro asunto abierto del mismo tipo con ese hito vacío: la tarea ya aparece.
4. En una tarea de la guía, pulsar «⋮»: salen «Anotar», «Cambiar aquí», «Cambiar en la guía» y
   «Borrar». Pulsar «Cambiar aquí», cambiar el texto y pulsar Intro: cambia en este asunto, lleva
   «solo aquí», y en otro asunto del mismo tipo sigue con el texto de antes.
5. En una tarea, pulsar «⋮» → «Anotar», escribir «el DNI caduca en noviembre» e Intro: la tarea
   lleva un 💬; al pulsarlo se ve la nota; en la tarjeta «Notas» de la mesa aparece «Revisar DNI o
   NIE: el DNI caduca en noviembre».
6. Pulsar el botón «Hito ▾» de la cabecera de la mesa: arriba salen «Crear», «Cambiar» y «Borrar»;
   no sale ninguna opción de tareas. Pulsar «Crear» y escribir parte del título de un hito de la
   biblioteca: sale debajo para elegirlo.
