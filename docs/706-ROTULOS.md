# 706 — Rótulos para agrupar las tareas de un trámite largo

Parte del tema 692 (el molde nuevo). Va detrás de la fila 705.

## Lo que escribió Francisco
«Para quitar la carga cognitiva de tener 30 tareas seguidas.»

«Los rótulos ahora están bien.»

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- En la guía de un tipo «sin hitos» se pueden poner **rótulos** entre las tareas: una línea de texto que nombra el grupo de tareas que tiene debajo («Recibir la petición», «Resolver», «Avisar y cerrar»).
- En el asunto, el rótulo sale en una banda de color con una raya a la izquierda, y las tareas de debajo van metidas un poco a la derecha. En un trámite sin rótulos, las tareas no se desplazan.
- **El rótulo solo nombra.** No tiene casilla, plazo, responsable, espera ni marca de hecho, y no cuenta en «N de M tareas hechas».
- Corto y largo son el mismo molde, con o sin rótulos.

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- En el editor de la guía, «+ Añadir rótulo» está junto a «+ Añadir tarea», y el rótulo se sube y se baja con las flechas, como una tarea.
- Los rótulos se ponen solo en la guía, no desde el asunto. Una tarea añadida en el asunto va al final.
- Un rótulo sin ninguna tarea a la vista debajo (por «Solo si») tampoco sale.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- Una línea de explicación común al grupo, bajo el rótulo: no está en la pantalla aprobada.
- Plegar un grupo de tareas.
- Cualquier cosa que convierta el rótulo en un hito (plazo, responsable, marca de hecho).

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- En la guía (`js/guia-sin-hitos.js`, fila 701), el rótulo es una línea más de la lista, con `rotulo: true`; al nacer el asunto se copia con las tareas.
- En el asunto (`js/asunto-sin-hitos.js`, fila 699) se pinta como `.rotulo`, y las tareas siguientes con `.bajo-rotulo`, como en `docs/pantallas/692.html` (trámite largo). El estado (`js/sin-hitos-estado.js`) salta los rótulos.

## Cómo lo comprueba el segundo revisor
- El editor de la guía de un tipo «sin hitos» deja añadir un rótulo, cambiarle el texto, moverlo y borrarlo.
- Un asunto nuevo enseña los rótulos en banda de color y las tareas de debajo desplazadas.
- En un asunto sin rótulos, las tareas no están desplazadas.
- El rótulo no tiene casilla ni ⋮ y no cuenta en «N de M tareas hechas» ni en «Tarea N de M» de Inicio.
- Desde el asunto no se puede añadir un rótulo.

## Qué mirar al terminar
- En la guía de un tipo de prueba, poner tres rótulos y crear un asunto.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
