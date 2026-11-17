# 701 — La guía de un tipo sin hitos: una lista de tareas

Parte del tema 692 (el molde nuevo). Va detrás de la fila 700.

## Lo que escribió Francisco
«Hemos dicho que se quitaría para no mezclar trabajo y diseño.» (la casilla de llevar los cambios a la guía)

Eligió «2»: «Cambiar la guía…» va en el menú «⋯» de la cabecera del asunto.

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- La guía de un tipo «sin hitos» es una lista de frases. Cada frase puede llevar **«Solo si»** un campo de lista del asunto, como hoy.
- Hay una guía por tipo de asunto y nada más. La clase de tercero no da otra guía.
- Se escribe en el editor de guías de siempre, que para estos tipos enseña solo la lista de tareas: sin hitos, fases, responsables, plazos, «Qué se hace», «Dónde se hace» ni «A quién».
- Un asunto nuevo de ese tipo nace con las tareas de su guía, en su orden.
- En el asunto, el menú **«⋯» de la cabecera** lleva **«Cambiar la guía…»**. Avisa: «Vale para todos los asuntos de <tipo>, no solo para este», y abre el editor de la guía.
- Las tareas que vienen de la guía no llevan marca; las añadidas en el asunto llevan «solo aquí».

**No se habló y no está en la pantalla de prueba; lo propone Claude y lo aprueba Francisco al leer esto:**
- Una tarea que se añade a la guía llega también a los asuntos abiertos de ese tipo; cambiar o borrar una tarea de la guía no los toca (regla del 6-nov-2026, «añadir no es cambiar»).
- Las tareas de la guía se ordenan con las flechas de subir y bajar, como hoy.
- Una tarea con «Solo si» y el campo vacío sale en amarillo con «Falta: <campo>», como hoy.
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

## Cómo lo comprueba el segundo revisor
- En un tipo «sin hitos», el editor de la guía enseña solo una lista de frases con su «Solo si».
- Un asunto nuevo nace con esas tareas en ese orden, sin marca «solo aquí».
- «⋯» › «Cambiar la guía…» avisa con ese texto y abre el editor de ese tipo.
- Añadir una tarea a la guía la hace salir en un asunto abierto del tipo; cambiar una frase en la guía no cambia el asunto abierto.
- Una tarea con «Solo si» sale o no según el campo, y en amarillo con el campo vacío.
- El editor de una guía con hitos es el de siempre.

## Qué mirar al terminar
- Escribir la guía de AULA DE CONVIVENCIA con sus tres tareas y crear un asunto.
- Desde ese asunto, «⋯» › «Cambiar la guía…».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
