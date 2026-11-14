# 660 — Crear hitos y tareas desde el asunto, con la marca de la guía

Cuarta de las cinco partes del tema 650 («Crear tareas e hitos con fluidez»). Va detrás de la 659 («Dónde se hace» y nombres). Después va la bandeja. De dónde se parte: `docs/notas-diseno/650.md`.

## Lo que escribió Francisco

14-nov-2026:

> No termino de ver el proceso. Y he tenido problemas creando un asunto justo en esta parte. […] Me hice un poco de lío al crear la tarea y los hitos. Esto es fundamental para el futuro de la app. Si no soy capaz de ante una situación nueva crear de manera fluida todo lo que me sea necesario (a excepción de confeccionar plantillas con campos personalizables que eso pudiera llevar más tiempo) tendré problemas. Me refiero sobre todo al trabajo de atención en ventanilla.

> Mi idea es que si tenemos Hitos comunes a distintos tipos de asunto bien configurados con sus tareas, acciones y plantillas nos ahorraría mucho tiempo. […] crear y/o buscar hitos y/o tareas basándonos exclusivamente en el nombre que vamos escribiendo en el buscador puede ser muy arriesgado.

> ¿Lo correcto sería la 1, pero con la posibilidad de crear nuevas fases pero no desde el proceso de creación del asunto, si no en Ajustes? Para frenar un poco a ese nivel?

Idea 635 (13-nov-2026): «Y si cambiamos el texto "Solo para este asunto" por una marca que si está "encendida" sepamos que todo cambio en hitos y tareas se está actualizando en la guía y si la desactivamos no?»

Idea 636 (13-nov-2026): «En el futuro cuando vayan aumentando las acciones a realizar veremos de estructurar la lista y poner un buscador».

Sobre la ventana de añadir hito, enseñar todo a la vez «no te permite enfocarte y concentrarte en la acción del momento». Sobre el hito repetido: «he añadido dos veces el mismo hito y me ha dejado».

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

**La marca de la guía.**
- Una sola marca encima de los hitos del asunto: «Los cambios en hitos y tareas van también a la guía», con el tipo al lado.
- Debajo dice qué pasa: encendida, lo que se añade o cambia lo tendrán también los próximos asuntos de ese tipo; apagada, se queda solo en este asunto.
- Nace encendida si la guía del tipo está vacía o solo tiene «Tramitar · Esperar respuesta»; apagada en los demás. Después, cada asunto recuerda cómo la dejó quien lo usa.
- Obedecen a la marca: añadir hito, añadir tarea, «Cambiar» y «Borrar» del hito («Hito ▾») y de la tarea («⋮»), y subir y bajar tareas. Cada ventana dice al pie dónde irá el cambio.
- Los demás asuntos abiertos de ese tipo no cambian.
- «Cambiar la guía…» del menú «Hito ▾» se queda.

**Primero el hito, después la tarea.**

**«+ Añadir hito», paso a paso.**
1. Solo las fases, en botones.
2. Elegida una, queda en una línea («Fase: … · Cambiar») y salen solo los hitos comunes de esa fase, cada uno con sus tareas a la vista y «Añadir este».
3. «+ Hito nuevo de esta fase» deja solo el formulario: el nombre (propone el de la fase) y su primera tarea, con «Ver los hitos de esta fase (n)» para volver.
- El hito nuevo nace con su primera tarea.
- Si el hito ya está en este asunto, sale «Ya está en este asunto» y «¿Lo añades otra vez?», con «Añadirlo otra vez» y «Cancelar».
- Si el hito nuevo es igual o parecido a uno común de esa fase (mismo nombre o mismas tareas), avisa, con «Usar ese».
- «Va detrás de» sigue como hoy.

**«+ Añadir tarea».**
- «Qué se hace» es una casilla que se busca escribiendo, también por el sitio: al escribir «correo» sale «Enviar · Correo electrónico», y al elegirlo se rellenan el qué y el dónde.
- Al buscar salen las parejas de acción y sitio que ya usan las tareas del centro, más cada acción con el sitio que propone.
- Después, «sobre qué» según la acción (plantilla, «Qué documento» o «A quién», de la fila 659) y «Dónde se hace».
- Salen las tareas comunes que hacen lo mismo (misma acción, sobre lo mismo y en el mismo sitio), se llamen como se llamen, con «Añadir esta».
- La app propone el nombre; se puede cambiar.
- Si la nueva es igual o parecida a una que existe, avisa, con «Usar esa» y «Crear la mía igualmente». En «Otra cosa» y en las acciones sin «sobre qué», se compara por el nombre y el sitio.
- «Generar documento» sin plantilla que sirva: «Sin plantilla por ahora (se marca a mano)». La tarea se crea y se marca a mano.
- «Cambiar…» de la tarea enseña lo mismo: qué se hace, sobre qué, dónde y nombre.

**Las fases nuevas, solo en Ajustes.** Ajustes → El centro → «Fases»: la lista y «+ Fase nueva», que avisa si se parece a una que existe. Al añadir un hito no se crean fases.

**Lo que desaparece:**
- «Elegir de la lista común de tareas» y su ventana.
- La ventana «Elegir un hito».
- «Solo para este asunto».
- «Pasar a la guía» (se pierde llevar después a la guía una tarea creada con la marca apagada).
- La franja que sale al subir o bajar una tarea.
- La lista «Qué se hace» en desplegable.

## Pantalla de prueba

- Aprobada el 14-nov-2026: `docs/pantallas/650.html` · https://claude.ai/artifact/EQ7UXQK4J5NDc6e2y6Zy2d. Manda en todo lo de esta tarea. Los nombres de acciones, sitios, plantillas y tareas que salen en ella son inventados; en la app salen los del centro.

## Qué NO se hace en esta tarea

- «Dónde se hace», los datos nuevos, los nombres y la ventana «Sitios»: fila 659.
- La bandeja con hito y tarea: quinta parte del tema 650.
- Plantillas con campos desde el asunto: fuera del tema, por decisión de Francisco.

## Notas técnicas de Claude

- Va detrás de la 659: necesita `donde`, `documento`, `aQuien` y los sitios.
- Hoy: añadir tarea en `js/hito-mesa-guion.js`, `js/hito-mesa-nueva-tarea.js` y `js/comunes-asunto.js`; ventanas de la lista común en `js/comunes-ventana.js` y `js/comunes-ventana-nuevo.js`; añadir hito en `js/hitos-anadir.js`; «Solo para este asunto», «Pasar a la guía» y la propagación en `js/hitos-desde-el-asunto*.js`, `js/hito-mesa-tarea-menu.js` y `js/hitos-guion-marcar.js`; subir y bajar en `js/hitos-guion-orden.js`. Quitar lo que desaparece, sin dejar código muerto ni textos que lo nombren.
- La marca se guarda en la ficha del asunto (por ejemplo `marcaGuia: true|false`); si no la tiene, se calcula con la regla de arriba. Con la marca encendida, los cambios van a la guía y a la lista común por el mismo camino que hoy usa «Cambiar la guía…».
- «Hito común» = el de la lista común con `fase` (fila 657). Fases: `Comunes.FASES` más las del centro, en `_GESTOR` (por ejemplo `fases.json`, por `ColaGuardado`); las fijas no se borran.
- «Hace lo mismo»: igual `accion`, igual `donde` y, si la acción tiene «sobre qué», igual plantilla, `documento` o `aQuien`. «Parecido»: nombre normalizado igual o casi igual (mismo criterio que el aviso de «Sitios» de la 659).
- La búsqueda de «Qué se hace» sale de las tareas comunes del centro (parejas acción y sitio sin repetir) más una entrada por acción con su sitio propuesto.
- Fichero nuevo por debajo de 400 líneas, apuntado en su lista `js/cargar-piezas-N.js`.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- La marca: nace encendida en un tipo con la guía vacía o solo «Tramitar · Esperar respuesta», y apagada en uno con guía; el texto de debajo cambia al pulsarla; al volver a abrir el asunto sigue como se dejó.
- Con la marca encendida, añadir un hito y una tarea, cambiar, borrar y subir una tarea: cambia el asunto y la guía del tipo. Apagada: solo el asunto. Otro asunto abierto del mismo tipo no cambia.
- «+ Añadir hito»: primero solo las fases; luego solo los hitos de la fase con sus tareas; luego solo el formulario, con «Ver los hitos de esta fase (n)». Se puede volver a cambiar la fase.
- Añadir un hito que ya está en el asunto: sale «¿Lo añades otra vez?»; «Cancelar» no lo añade; «Añadirlo otra vez» sí.
- Un hito nuevo con el mismo nombre o las mismas tareas que uno común de la fase: sale el aviso con «Usar ese».
- «+ Añadir tarea»: escribir «correo» trae «Enviar · Correo electrónico»; al elegirlo se rellenan qué y dónde; salen las tareas comunes que hacen lo mismo; la app propone el nombre.
- Una tarea igual a una común: sale el aviso con «Usar esa» y «Crear la mía igualmente».
- «Generar documento» con «Sin plantilla por ahora»: la tarea se crea sin botón y se marca a mano.
- Ajustes → «Fases»: «+ Fase nueva» avisa si se parece; la fase nueva sale al añadir un hito. Al añadir un hito no hay forma de crear una fase.
- No quedan en ninguna pantalla: «Elegir de la lista común de tareas», «Elegir un hito», «Solo para este asunto», «Pasar a la guía», ni la franja al subir o bajar.
- Comparar con la pantalla de prueba aprobada, ventana por ventana.

## Qué mirar al terminar

- Crea un asunto de un tipo nuevo: mira que la marca está encendida.
- «+ Añadir hito»: elige una fase y añade un hito nuevo con su tarea.
- «+ Añadir tarea»: escribe «correo» y añade una tarea de enviar.
- Crea otro asunto de ese tipo: mira que trae lo que añadiste.
- En un asunto de CERT. MATRICULA, apaga la marca, borra una tarea y mira que la guía no cambia.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
