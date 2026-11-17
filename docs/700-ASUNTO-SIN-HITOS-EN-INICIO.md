# 700 — El asunto sin hitos en Inicio, y los textos que dicen «hito»

Parte del tema 692 (el molde nuevo). Va detrás de la fila 699.

## Lo que escribió Francisco
«Me parece muy buena tu propuesta.» (de la propuesta de Claude: un asunto abierto está siempre en una de tres situaciones: hay algo que toca, se espera a alguien con un día para reclamar, o está listo para cerrar)

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- En Inicio, un asunto sin hitos sale en la misma tabla, con las mismas columnas (Plazo, Tercero, Tipo, Por dónde va, Le toca a).
- «Por dónde va» dice **«Tarea N de M · <la frase de la primera tarea sin hacer>»**, o **«Listo para cerrar»** si están todas hechas.
- Va en la pestaña «En Administración» y «Le toca a» dice «Administración».
- El filtro «Situación», «Qué me toca», la marca de la tarjeta y la de la cabecera leen ese mismo estado.
- La columna Plazo y el número rojo de vencidos usan el plazo del asunto.
- **Ningún texto dice «hito» en un asunto sin hitos.** Se repasan todos: «Hito N de M» y «Sin hitos» (Inicio y filtro «Situación»), «Hito N» en los documentos de la carpeta, las líneas del Registro, el cuadro de guardar desde la bandeja, «Este asunto no tiene hitos todavía» y «N de M hitos hechos».

**No se habló y no está en la pantalla de prueba; lo propone Claude y lo aprueba Francisco al leer esto:**
- Un asunto sin ninguna tarea dice «Sin tareas» y va en «En Administración».
- En el cuadro de guardar un documento desde la bandeja, para un asunto sin hitos no se pregunta hito ni tarea.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- La espera y «En espera»: fila 702.
- Cambiar nada de Inicio para los asuntos con hitos.

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- Un solo cálculo decide: `Hitos.aQuienLeToca` (`js/hitos-a-quien.js`); de él beben `InicioTabla.calcular`, `App.ladoDe`, `QueMeToca` y `EstadoHito.marcaHTML`. Para un asunto `sinHitos`, devolver el mismo objeto `{ lado, quien, hito, desde, titulo, n, m, esperando, listo, sinHitos, texto }` sacado de las tareas (fichero nuevo `js/sin-hitos-estado.js`); así Inicio no se toca.
- Vencidos: `QueMeToca.vencidos` sale hoy de `hito.fecha`; para estos asuntos, `App.plazoDe`.
- Textos: `js/inicio-tabla.js`, `js/asuntos-lista-montones.js`, `js/estado-hito.js`, `FichaDocumentos.marcarHito`, el Registro y el cuadro de la bandeja (fila 661). Buscar `[Hh]ito` en `js/` y dejar apuntado en esta instrucción cada texto mirado.
- Poner al día `docs/contexto/ESTADO-DEL-ASUNTO.md`.

## Cómo lo comprueba el segundo revisor
- Un asunto sin hitos con tareas sin hacer sale en «En Administración» con «Tarea N de M · frase».
- Con todas hechas dice «Listo para cerrar»; sin tareas, «Sin tareas».
- El filtro «Situación» y «Qué me toca» lo tratan igual que la tabla.
- Con el plazo del asunto pasado, cuenta en el número rojo de vencidos.
- En ese asunto no se lee «hito» en ninguna parte: Inicio, ficha, documentos, Registro, bandeja.
- Los asuntos con hitos salen en Inicio como antes.

## Qué mirar al terminar
- Inicio: buscar el asunto sin hitos y leer «Por dónde va».
- Marcar todas sus tareas y volver a Inicio: «Listo para cerrar».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
