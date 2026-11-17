# 707 — «Cómo se hace» dentro de la tarea

Parte del tema 692 (el molde nuevo). Va detrás de la fila 701.

## Lo que escribió Francisco
«Entiendo que la explicación de cómo hacer una tarea debe ser parte de la tarea.» (17-nov-2026, al analizar el hito)

Preguntado si iba en el molde o aparte, eligió «2»: en el molde. A la propuesta de Claude contestó: «vale».

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- En la guía de un tipo «sin hitos», cada tarea puede llevar debajo de su frase un texto libre, **«Cómo se hace»**, de las líneas que hagan falta. Es opcional.
- La ruta de Séneca o la norma van dentro de ese texto, sin casillas aparte: explicación, pasos y normativa son una sola cosa.
- En el asunto, la tarea que lo tiene lleva una marca pequeña al lado de la frase. Al pulsarla, el texto se despliega debajo de la tarea; al pulsarla otra vez, se pliega. Sale plegado.
- La tarea que no lo tiene no enseña nada.
- Vale igual para las tareas con papel y sin papel.
- Una tarea añadida en el asunto con «+ Añadir tarea» no lleva «Cómo se hace»: es una sola línea. Para apuntar algo en ella está «Anotar».

## Pantalla de prueba
- No se pidió. Lo de arriba es lo que se aprobó.

## Qué NO se hace en esta tarea
- Traer las explicaciones, los pasos o la normativa de las guías con hitos o de la lista común de tareas: se escriben de nuevo cuando toque cada trámite.
- Escribir o cambiar «Cómo se hace» desde el asunto.
- Enlaces, negritas o imágenes en el texto.
- Cambiar «Cómo se hace» en los asuntos con hitos.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md`. Lo nuevo se añade, no sustituye: un asunto con hitos no cambia en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí. Una sola tanda de pruebas al final.
- En la guía: `js/guia-sin-hitos.js` (fila 701), un cuadro de texto de varias líneas bajo la frase de cada tarea. El texto se guarda con la tarea de la guía.
- En el asunto: `js/asunto-sin-hitos.js` (fila 699) y `js/tarea-papel-pintar.js` (fila 703). El texto se lee de la guía al pintar, no se copia al asunto: si se corrige en la guía, lo ven también los asuntos abiertos.
- Hoy existe «Cómo se hace» en las tareas con hitos (`js/donde-campo.js`, `js/sitios.js`, pasos uno por línea): no se reutiliza ese dato ni se toca.
- El texto se pinta escapado (`U.escapar`), respetando los saltos de línea. La marca, con texto alternativo «Cómo se hace».
- Añadir la línea a `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En la guía de un tipo «sin hitos», cada tarea deja escribir «Cómo se hace» en varias líneas, y es opcional.
- En un asunto, la tarea con texto lleva una marca junto a la frase; la que no lo tiene, ninguna.
- Al pulsar la marca el texto sale debajo de la tarea, con sus saltos de línea; al pulsar otra vez se pliega. Al abrir el asunto, todos están plegados.
- Funciona en una tarea con papel y en una sin papel.
- «+ Añadir tarea» sigue siendo una línea y la tarea añadida no tiene marca.
- Corrigiendo el texto en la guía, un asunto ya abierto enseña el texto corregido.
- Qué hace la app que este texto no pide.

## Qué mirar al terminar
- En la guía de AULA DE CONVIVENCIA, escribir «Cómo se hace» en una tarea.
- Abrir un asunto de ese tipo y pulsar la marca de esa tarea.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
