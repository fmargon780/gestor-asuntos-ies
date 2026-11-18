# 701 — La guía de un tipo sin hitos: una lista de tareas

Parte del tema 692 (el molde nuevo). Va detrás de la fila 700.

## Lo que escribió Francisco
«Hemos dicho que se quitaría para no mezclar trabajo y diseño.» (la casilla de llevar los cambios a la guía)

Eligió «2»: «Cambiar la guía…» va en el menú «⋯» de la cabecera del asunto.

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- La guía de un tipo «sin hitos» es una lista de frases. Cada frase puede llevar un **«Solo si»**.
- **El «Solo si»** (hablado y aprobado por Francisco el 17-nov-2026: «Me parecen bien tus propuestas»):
  - Se escribe solo en la guía, nunca desde el asunto. Dice «Solo si» un dato de lista del asunto vale tal cosa («Solo si Motivo de la baja = Traslado al extranjero»), **o «Solo si» el tercero es de tal clase** («Solo si el tercero es Personal»). Lo de la clase de tercero es nuevo.
  - En el asunto, la tarea sale si coincide y no sale si no coincide. Las que no salen no cuentan en «N de M tareas hechas» ni en «Tarea N de M».
  - Con el dato vacío salen todas las que dependen de él, en amarillo, con «Falta: <dato>». **Al pulsar ese aviso se rellena el dato ahí mismo**, sin ir a «Datos». Esto es nuevo.
  - Si en un asunto concreto sobra una tarea suelta, se borra en ese asunto con «Borrar»; no hace falta «Solo si».
- Hay una guía por tipo de asunto y nada más. La clase de tercero no da otra guía.
- Se escribe en el editor de guías de siempre, que para estos tipos enseña solo la lista de tareas: sin hitos, fases, responsables, plazos, «Qué se hace», «Dónde se hace» ni «A quién».
- Un asunto nuevo de ese tipo nace con las tareas de su guía, en su orden.
- En el asunto, el menú **«⋯» de la cabecera** lleva **«Cambiar la guía…»**. Avisa: «Vale para todos los asuntos de <tipo>, no solo para este», y abre el editor de la guía.
- Las tareas que vienen de la guía no llevan marca; las añadidas en el asunto llevan «solo aquí».

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- Una tarea que se añade a la guía llega también a los asuntos abiertos de ese tipo; cambiar o borrar una tarea de la guía no los toca (regla del 6-nov-2026, «añadir no es cambiar»).
- Las tareas de la guía se ordenan con las flechas de subir y bajar, como hoy.
- La lista común de tareas no se usa en estas guías: la frase se escribe.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- El papel de la tarea en la guía: fila 703.
- Los rótulos: fila 706.
- Pasar las guías de hoy al molde nuevo: no se mudan; cada una se escribe de nuevo cuando toque su trámite.
- Repasar las diferencias entre asuntos y guía en un sitio aparte: tema 694.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Editor: `js/guias-editor.js` y la pieza suelta de la lista de tareas (`GuiasGuion.bloqueHTML`, `leer`, `enganchar`, en `js/guias-guion-editor.js`). Para un tipo `sinHitos`, pintar solo esa pieza, con frase y «Solo si» (`js/solo-si.js`), en un fichero nuevo `js/guia-sin-hitos.js`.
- Dónde se guarda en `guias.json`: decide la sesión, sin romper la guía con hitos guardada del tipo (fila 699).
- Nacimiento: lo de la fila 699 copia ahora las tareas. Llegada de lo añadido a los abiertos: como `Hitos.llevarGuiaAAbiertos` y `completarAsuntoConGuia` (`js/hitos-sincronizar.js`).
- Menú «⋯» de la cabecera: `js/ficha-menus.js`.
- «Solo si»: `js/solo-si.js`. Hoy `SoloSi.valoresDe` solo mira campos de lista del asunto; añadir la clase del tercero del asunto como un dato más que se puede elegir (las clases, las permitidas del tipo, `js/ajustes-tipo-clases.js`). Rellenar el dato desde el aviso «Falta: …»: el mismo desplegable que usa «Datos» para un campo de lista (`js/campo-desde-el-asunto.js`), guardando por el camino de siempre. No cambiar el «Solo si» de los asuntos con hitos.

## Cómo lo comprueba el segundo revisor
- En un tipo «sin hitos», el editor de la guía enseña solo una lista de frases con su «Solo si».
- Un asunto nuevo nace con esas tareas en ese orden, sin marca «solo aquí».
- «⋯» › «Cambiar la guía…» avisa con ese texto y abre el editor de ese tipo.
- Añadir una tarea a la guía la hace salir en un asunto abierto del tipo; cambiar una frase en la guía no cambia el asunto abierto.
- Una tarea con «Solo si» sale o no según el campo, y en amarillo con el campo vacío.
- En la guía se puede elegir «Solo si» por un dato de lista o por la clase del tercero; con un tercero de otra clase, la tarea no sale.
- Pulsando «Falta: <dato>» en una tarea amarilla se elige el valor ahí mismo; la lista se queda con las tareas que tocan y el dato queda guardado en «Datos».
- Las tareas que no salen no cuentan en «N de M tareas hechas».
- El editor de una guía con hitos es el de siempre.

## Qué mirar al terminar
- Escribir la guía de AULA DE CONVIVENCIA con sus tres tareas y crear un asunto.
- Desde ese asunto, «⋯» › «Cambiar la guía…».

## Revisión y respuestas durante el trabajo
- (18-nov-2026) Código en la rama `claude/cola-fila-701-ybp5rp` (no en `main`). Prueba nueva `guia-como-lista-de-tareas`; pasada completa 405/407 (fallaban `palabras-prohibidas`, ya arreglada, y `titulos-de-la-tabla-fijos`, que a solas pasa).
- Revisor 1: puntos 1 a 9 coinciden; RECHAZADA por «3 hitos» en Ajustes › Guía y en «Nuevo asunto». Arreglado.
- Revisor 2 (nuevo): puntos 1 a 9 coinciden; RECHAZADA por el punto 10: en Ajustes › Guía de un tipo sin hitos sale «1 hito», la tarjeta «1 · Tareas», el texto «con sus preguntas y bifurcaciones» y, al marcar la casilla en un tipo con guía de hitos, el hito antiguo con «Ver mapa» hasta volver a entrar; «Nuevo asunto» de un tipo sin guía dice «Sin guía: el asunto se crea sin hitos»; la nota de «Solo si el tercero es…» habla de «campo».
- Pendiente para retomarla: pintar en Ajustes › Guía las tareas (no la tarjeta «Tareas») con su etiqueta «N tareas» y repintar al marcar la casilla; cambiar esos dos textos y la nota; decidir con Francisco qué pasa con los hitos antiguos de un tipo al marcar «Sin hitos» (hoy se quedan guardados, sin usar ni enseñarse).
- (18-nov-2026, conversación de diseño, atasco resuelto por Claude) Arreglado lo del revisor 2: Ajustes › Guía de un tipo sin hitos enseña «N tareas» y sus frases con su «Solo si» (sin la tarjeta «Tareas», sin «hito» ni «bifurcaciones» en su texto y su resumen) y se repinta al marcar o desmarcar la casilla; «Nuevo asunto» sin guía dice «Sin guía: el asunto se crea con la lista de tareas vacía.»; la nota de «Solo si el tercero es…» habla del tercero. Decidido por Claude (no cambia lo que se ve): los hitos antiguos de un tipo al marcar «Sin hitos» se quedan guardados sin usarse y vuelven al desmarcar, como ya dice la ayuda de la casilla.
- Revisor 3 (nuevo): puntos 1 a 7, 9 y 10 coinciden; MAL el 8: Inicio decía «Tarea 2 de 4» contando las que no salen (y «se quedó en» al cerrar); al desmarcar la casilla, la lista de tareas guardada salía como un hito 7 «Tareas»; faltaba el «de» en «Vale para todos los asuntos de …» de la ficha y la mesa del hito. Arreglado los tres: Inicio y «se quedó en» cuentan solo las que salen; un tipo con hitos no ve ni pierde su lista de tareas guardada. Punto 8 escrito entero en la lista del revisor («ni en Tarea N de M»), como ya decía lo acordado.
- Revisor 4 (nuevo): puntos 1 a 9 coinciden; MAL el 10: en «Campos» de un tipo sin hitos cada campo seguía con «Elige en qué hito se rellena este campo» y los hitos de la guía antigua. Arreglado: un tipo sin hitos no elige hito en «Campos», y la sección se repinta al marcar la casilla. La prueba `pasar-a-drive` espera ahora a que el acuerdo de los tipos de documento termine al arrancar (con esta fila tardaba más y `tipos-documento.json` cambiaba a mitad del traslado).
- Revisor 5 (nuevo): APROBADA, puntos 1 a 10 y las tres fijas bien. Pasada completa 407 de 407. Aviso menor del revisor, fuera de esta fila: el hueco «+ Añadir tarea» del asunto dice «escribe qué hay que hacer».
