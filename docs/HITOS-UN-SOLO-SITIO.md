# Hitos en un solo sitio: la guía manda

Tema 413 de `docs/COLA.md` (junta las ideas 406 y 409 y el tema 407). Diseñado con Francisco el
22-oct-2026. Se hace en **tres filas**, cada una en su propia sesión y con sus propias
comprobaciones: **416 (parte A)**, **417 (parte B)** y **418 (parte C)**. Cada fila hace solo su
parte.

**Sube directamente a `main`, sin abrir ninguna petición de cambios** (salvo lo que dice
`CLAUDE.md` para cuando git rechaza la subida). Cambios quirúrgicos, no reescribas ficheros enteros.
No leas el repositorio entero: con `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md` y
`docs/contexto/HITO-MESA.md` tienes lo que hace falta.

---

## 1. El problema

Francisco siente que hitos, tareas, guías y biblioteca se han convertido en una maraña: no se sabe
bien dónde está cada cosa, y cualquier cambio obliga a pensar en la estructura.

La causa: un mismo hito vive hoy en **tres copias** (el modelo de la biblioteca, el paso de la guía
del tipo y el hito de cada asunto), y cada salto tiene sus propias reglas y su propia pregunta:

- Desde un asunto, todo cambio pregunta «¿Dónde se guarda?» (fila 235).
- En un hito traído de la biblioteca, guardar pregunta «¿solo aquí o también en la biblioteca?»
  (filas 79 y 297), y los demás tipos reciben un aviso «Ver el cambio».
- Lo que se cambia en la guía llega a los asuntos abiertos solo si es un hito **nuevo** o un cambio
  de **orden** (filas 118 y 300); un cambio en un hito que ya existía no llega (salvo desde la mesa,
  fila 235). No hay forma de adivinarlo.

## 2. Las tres reglas nuevas (decididas por Francisco; no se replantean)

1. **Un hito se escribe en un solo sitio: la guía de su tipo.** Lo demás lo sigue, no lo copia.
2. **Lo que no ha empezado sigue a la guía; lo que ya se ha tocado se queda como está.**
3. **La biblioteca deja de ser un almacén aparte.** Pasa a ser un buscador de los hitos de todas las
   guías. Copiar un hito de un tipo a otro es traerlo desde ese buscador.

### Qué es un hito «empezado»

Un hito de un asunto está **empezado** cuando **no** está vacío según la función que ya existe,
`HitosDesdeElAsunto.estaVacio` (`docs/contexto/HITO-MESA.md`, fila 235): hecho, alguna tarea
marcada o con valor, tareas propias, notas, documentos, rama elegida o fecha puesta a mano. «En
curso» sin nada más **no** cuenta como empezado.

**Además cuenta como empezado** (amplía `estaVacio` con esto, en un solo sitio, y úsala en todas las
partes) cualquier cambio hecho a mano **solo en ese asunto**: responsable cambiado desde la mesa,
plazo cambiado con `guardarCampos`, «Dejarlo solo informativo» / «Pedírmelo a mí», título o
explicación cambiados solo aquí, tareas de la guía escondidas aquí (`guionOcultos`) o preguntas del
guion cambiadas aquí (`guionTextos`). Así la guía nunca pisa algo que alguien decidió para ese
asunto.

`soloInformativo` sigue siendo una decisión de cada tipo: no se copia de la guía a un hito ya creado
(como hoy).

---

## 3. Parte A — fila 416: los cambios de la guía llegan a todos los asuntos sin empezar

### A.1 Desde la guía (Ajustes, «Cambiar la guía» desde la ficha o desde la mesa)

Vale para **todo guardado de la guía**, por el camino que sea: «Cambiar la guía» (`escribirGuia`),
`guardarPasos`, `cambiarPasos` y lo que llegue desde un asunto (A.2). Todos tienen que pasar los
pasos de antes para poder calcular qué ha cambiado o se ha quitado. La red de seguridad de la ficha
(`completarSiToca`) sigue solo añadiendo lo que falte, como hoy.

Al guardar la guía de un tipo, en cada asunto **abierto** de ese tipo:

- **Hito nuevo** en la guía: entra, como hoy (fila 118).
- **Hito cambiado** en la guía (título, explicación, responsable, a quién le toca, plazo, normativa
  y los demás campos que `Hitos.pasoAHito` copia al hito, salvo `soloInformativo`): si el hito del
  asunto **no está empezado**, se pone igual que el paso de la guía. Si está empezado, no se toca.
- **Las tareas** siguen como hoy: se leen en vivo de la guía (`Hitos.guionDe`), así que llegan a
  todos los asuntos, empezados o no. No las congeles. Lo que ya está marcado se conserva como hoy
  (`conservarHechas`).
- **Hito quitado** de la guía: si en el asunto **no está empezado**, se quita del asunto (y su id
  sigue en `pasosConocidos`, para que no vuelva). Si está empezado, se queda, y **antes de quitar el
  paso** sus tareas de la guía se copian dentro del hito de ese asunto como tareas «solo aquí», con
  los mismos ids y lo marcado, para que no se pierdan.
- **Orden**: como hoy (fila 300).
- Dentro de una pregunta (ramas), lo mismo, a cualquier profundidad, para todos los hitos que el
  asunto tenga, sea cual sea su rama. Si a una pregunta de la guía se le quita una opción y un asunto
  la tenía elegida, sus hitos siguen las reglas de arriba (los no empezados se van; los empezados se
  quedan) y la elección se queda como estaba.

El aviso verde de después dice a cuántos asuntos ha llegado y, si alguno se ha quedado sin tocar, en
cuántos no se ha tocado porque ya tenían trabajo (hoy esa segunda frase solo sale en los cambios
desde el asunto; ahora sale siempre). Sin «Deshacer» nuevo: el de la fila 235 se queda como está.

Los asuntos **archivados** nunca se tocan.

### A.2 Desde un asunto: se acaba la pregunta «¿Dónde se guarda?»

- **Crear, cambiar o borrar un hito** desde el asunto («+ Crear un hito», «Cambiar este hito»,
  «Borrar este hito», «Colocar después de»): se guarda **en la guía** del tipo y llega a los demás
  asuntos con las reglas de A.1. Sin pregunta. **En el propio asunto desde el que se cambia, el
  cambio se aplica siempre**, aunque su hito esté empezado (como hoy hace `propagarCambio` con
  `esActual`). Se queda el aviso verde con «Deshacer» de la fila 235.
- **Un hito solo para este asunto, a propósito:** «+ Crear un hito» lleva una casilla **«Solo para
  este asunto»**, **desmarcada** al abrirse. Si se marca, el hito se crea solo aquí, con la marca
  «solo aquí» visible (igual que las tareas sueltas), y no va a la guía. «Cambiar» o «Borrar» un hito
  «solo aquí» se queda en el asunto, sin pregunta. Su «Hito ▾» / «···» lleva «Pasar a la guía», que
  lo lleva entero con sus tareas (`llevarHitoEntero`, como hoy), sin pregunta.
- Un hito que ya existía sin paso en la guía (de antes de esta fila) se trata como «solo aquí».
- **Cambiar o borrar una tarea que viene de la guía** desde el asunto: igual, siempre a la guía, sin
  pregunta. Borrar una tarea de la guía sigue dejando «solo aquí», en los asuntos donde estaba hecha,
  esa tarea (`conservarHechas`, como hoy).
- **Escribir una tarea nueva** en la caja «Nueva tarea…» del asunto: se guarda **solo en este
  asunto**, sin pregunta, con su marca «solo aquí» visible. Su «⋮» sigue teniendo «Pasar a la guía»,
  que la lleva a la guía **sin pregunta**.
- **Las preguntas del guion** (las tareas que son pregunta, fila 405): «Cambiar» y «Borrar» van a la
  guía, sin pregunta, como cualquier tarea de la guía. Borrar una pregunta ya respondida en algún
  asunto sigue avisando antes, como hoy, de en cuántos estaba respondida.
- **Esconder una tarea de la guía solo en este asunto** (`ocultarGuionDeGuia`) deja de ofrecerse:
  borrarla la quita de la guía. Los escondidos que ya existan se respetan.
- **Asunto sin tipo**, o hito **dentro de una rama de una pregunta**: como hoy no se puede llevar a
  la guía, se guarda solo en el asunto, sin pregunta, y el aviso verde lo dice en una frase («Guardado
  solo en este asunto: dentro de una pregunta no se puede cambiar la guía desde aquí.»).
- El bloque `DondeSeGuarda` y su emergente dejan de salir. Quita su código si ya no lo llama nadie.

### A.3 Cómo sabré que está bien (parte A)

1. Cambias el título de un hito en la guía de un tipo. En un asunto abierto de ese tipo donde ese
   hito no está empezado, sale con el título nuevo. En otro donde ya tiene una tarea marcada, sigue
   con el título viejo.
2. Quitas un hito de la guía. Desaparece de los asuntos abiertos donde no estaba empezado y sigue en
   los que sí lo estaba.
3. Cambias un hito desde dentro de un asunto. No sale ninguna pregunta de dónde guardar, y el cambio
   aparece en la guía del tipo.
4. Escribes una tarea nueva en la caja «Nueva tarea…» de un asunto. Se ve marcada «solo aquí» y no
   aparece en la guía. Desde su «⋮», «Pasar a la guía» la lleva a la guía.
5. En «+ Crear un hito» marcas «Solo para este asunto». El hito sale con la marca «solo aquí» y no
   aparece en la guía.

**Ejemplo con datos reales [SOLO FRANCISCO]:** tipo «Elecc. Consejo Escolar», hito «Registrar de
salida en Séneca»: cambiarle el título en la guía y comprobar los puntos 1 y 2 en los asuntos
abiertos de ese tipo. Con datos de demostración, el revisor usa un tipo y un hito equivalentes.

---

## 4. Parte B — fila 417: traer un hito de otro tipo (la biblioteca pasa a ser un buscador)

Hace falta la parte A en `main` (fila 416 HECHA) antes de empezar.

### B.1 El buscador

- En el editor de la guía, el botón «+ Traer de la biblioteca» pasa a llamarse **«+ Traer un hito de
  otro tipo»**. Abre el mismo panel dentro del cuadro, ahora con un buscador.
- El panel lista **todos los hitos de todas las guías** de los demás tipos, **agrupados por tipo**
  (nombre del tipo como encabezado), con una caja de búsqueda que filtra por el título del hito
  mientras se escribe. Solo los hitos de arriba de cada guía, no los de dentro de las ramas de una
  pregunta; un hito-pregunta tampoco se ofrece (como hoy la biblioteca).
- Al final, un grupo **«Sin tipo»**: los modelos de `_GESTOR/hitos-biblioteca.json` que no usa ninguna
  guía (ningún paso con `origenBiblioteca.id` igual a su id). Cada uno lleva, además de elegirlo, un
  botón pequeño **«Quitar»** que lo borra de la biblioteca tras confirmar. No se pueden cambiar: para
  cambiar uno, se trae a una guía y se cambia allí.
- Elegir uno lo mete en la guía que se está escribiendo, con **todas sus tareas** y sus demás campos,
  como un hito nuevo con **id nuevo** y sin `origenBiblioteca`. Si su plazo cuenta «desde» otro hito
  de la guía de origen, ese «desde» se vacía (cuenta desde que empieza el hito) y se dice en una línea
  ámbar dentro del paso: «El plazo contaba desde un hito de otro tipo: revísalo.». Es una **copia suelta**: cambiarla después no afecta al tipo
  de donde vino, y cambiar el original no afecta a la copia. Sin aviso, sin pregunta.
- Lo mismo para «Usarlo» al escribir el título de un hito nuevo (fila 202): busca en el mismo sitio
  (todas las guías + «Sin tipo») y diría «En «<tipo>» hay "…" · Usarlo».

### B.2 Lo que desaparece

- La etiqueta de origen junto al título del paso («De la biblioteca», «De la biblioteca · cambiado
  aquí», «Propio de este tipo») y su panel.
- La pregunta al guardar «¿solo aquí o también en la biblioteca?» (filas 79 y 297).
- El botón «Guardar en la biblioteca» de cada paso.
- Los avisos «Ver el cambio» / «Traer el cambio» / «Dejarlo como está» en Ajustes de un tipo.
- El bloque de la biblioteca en Ajustes → El centro (`GuiasBiblioteca.pintarAjustes`).
- La búsqueda de textos parecidos para los documentos («Ese mismo texto ya lo tiene…», Ajustes → El
  centro) sigue funcionando, mirando en las guías de todos los tipos en vez de en la biblioteca.
- **No se borra** `_GESTOR/hitos-biblioteca.json` ni nada de lo guardado: los campos
  `origenBiblioteca` / `divergido` se quedan en los ficheros sin leerse. «Cargar la biblioteca del
  centro» (Mantenimiento, fila 80) se queda como está.
- Quita el código que ya no llame nadie.

### B.3 Cómo sabré que está bien (parte B)

1. En la guía de «Certificado», «+ Traer un hito de otro tipo», escribes «Registrar de salida» y sale
   agrupado bajo «Elecc. Consejo Escolar». Lo eliges y entra con sus tareas.
2. Cambias esa copia en «Certificado». El hito de «Elecc. Consejo Escolar» sigue igual.
3. Los hitos que solo estaban en la biblioteca salen en el apartado «Sin tipo». Ya no se ve la
   etiqueta «De la biblioteca» ni los avisos «Ver el cambio».

**Ejemplo con datos reales [SOLO FRANCISCO]:** copiar «Registrar de salida en Séneca» de «Elecc.
Consejo Escolar» a «Certificado». Si en los datos de demostración no existen esos dos tipos o ese
hito, el revisor usa dos tipos y un hito equivalentes de la demostración.

---

## 5. Parte C — fila 418: el hito de la guía, más limpio

Independiente de A y B. Solo cambia cómo se ve el editor de un paso de la guía; no cambia ningún
dato guardado.

- Al abrir un paso en el editor de la guía (acordeón, fila 122), a la vista solo: **título,
  responsable, plazo y tareas**.
- Todo lo demás (explicación, a quién le toca, normativa, solo informativo, avisar a quien lo pide y
  su plantilla, texto para los documentos, tipo de documento, campos del hito, recibe varios
  documentos, formularios y cualquier otro ajuste del paso) va dentro de un apartado plegado
  **«Más ajustes»**, cerrado al abrir el paso.
- Debajo del título del paso (también con el paso cerrado en el acordeón), una línea gris con lo que
  hay activado o relleno dentro de «Más ajustes», separado por « · », con esta lista cerrada y en este
  orden: «Solo informativo», «Avisa a quien lo pide», «Recibe varios documentos», «Normativa (N)»,
  «Documentos (N)», «Campos (N)», «Texto para documentos», «A quién le toca: …». **La explicación no
  cuenta.** Si no hay nada, no sale la línea.
- La línea del paso cerrado sigue llevando lo que hoy lleva (`GuiasPlegado.marcas`: Pregunta,
  responsable, «Guion (N)»…); lo de la lista de arriba que ya esté ahí no se repite en la línea gris.
- Vale igual para los pasos de dentro de una opción de una pregunta. Un paso-pregunta sigue como hoy
  (no lleva la mayoría de esos campos).

### C.1 Cómo sabré que está bien (parte C)

1. Al abrir un hito de la guía solo se ven título, responsable, plazo y tareas. Lo demás está
   plegado en «Más ajustes».
2. Si activas algo de dentro (por ejemplo, «Avisar a quien lo pide»), se lee en una línea debajo del
   título, también con el hito cerrado.

**Ejemplo con datos reales [SOLO FRANCISCO]:** el hito de recepción de candidaturas de la guía
«Elecc. Consejo Escolar», que tiene marcado «Recibe varios documentos»: la línea gris debe decirlo.

---

## 6. Para todas las partes

- Pon al día `docs/contexto/HITOS-Y-GUIAS.md` y `docs/contexto/HITO-MESA.md` con lo que cambia, y
  mueve a «superado» lo que deja de valer (filas 79, 202, 235, 297).
- La regla pendiente de `docs/PENDIENTES-DE-DISENAR.md` «Mover un hito desde la mesa, en los demás
  asuntos (fila 300)» queda resuelta por A.1: quítala de ahí.
- Pruebas nuevas por parte, y pon al día las que comprueban lo que desaparece
  (`pruebas/donde-se-guarda.mjs` y las de la biblioteca).
