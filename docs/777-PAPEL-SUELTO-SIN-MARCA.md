# 777 — El papel suelto, sin marca

**Título llano:** El papel que no es de ninguna tarea se queda en la carpeta, sin marca
**Para qué:** que un papel suelto se vea igual en todos los asuntos, con hitos o sin ellos, y que la app no pida unirlo a una tarea.

## Lo que escribió Francisco

Tema 693, tal como quedó en la cola el 17-nov-2026:

> Hecho, una sola regla. Para qué: que una tarea se dé por hecha de una sola manera: lo que se hace con la app se marca solo, lo que la app no ve, con un botón; el hito se cierra solo, con «Deshacer»; y el papel que entra se vincula solo o se queda sin marca. Revisa lo decidido el 16-nov-2026, que era marcar a mano.

Y el 27-nov-2026, sobre la propuesta de Claude de cambiarlo solo en los asuntos sin hitos:

> ¿Piensas que tener esto de una forma para los tipos de asuntos que permanecen con el molde de los hitos y otra para el molde sin hitos puede hacer muy confuso?

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)

- Casi todo el tema ya lo trajo el molde nuevo (filas 699 a 707): la tarea de papel avanza sola, lo que la app no ve se marca con la casilla o con «Marcar enviado», y un papel que llega se une solo a su tarea si hay una sola de ese tipo.
- Lo que queda es el papel suelto, el que no es de ninguna tarea. Se iguala en los dos moldes, solo quitando; a los hitos no se les añade nada (regla del plan, `docs/PLAN-2026-11.md`).
- Qué verá quien use la app:
  - En la lista de documentos de cualquier asunto desaparece la marca «sin tarea».
  - Desaparece el botón «Colgar de una tarea» que salía a la vista junto al documento.
  - En un asunto con hitos, «Colgar de una tarea» pasa al menú ⋮ del documento. Hace lo mismo que hoy. Sale solo cuando hoy saldría el botón, y encendido.
  - En un asunto «lista de tareas» no sale ni en el menú (hoy el botón salía apagado y hablaba de crear un hito).
- Lo demás no cambia: cerrar el hito sigue siendo a mano en los asuntos con hitos, hasta que se retiren (tema 694).

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- Que el hito se cierre solo con «Deshacer»: no se hace. Es algo nuevo sobre hitos, que se van a retirar.
- El interruptor para volver a hacer obligatorios el hito y la tarea de un documento (fila 682): se descarta, porque va contra esta regla.

## Notas técnicas de Claude

- `js/ficha-documentos-fila.js` (bloque «Fila 638», hacia la línea 59): quitar la marca `marca-sin-tarea` y el botón `ficha-documento-colgar` de la fila. En su lugar, si `I.sinTarea(f.nombre)`, `I.hayHitos()`, hay `DocumentoATarea` y la carpeta está en modo abierto, añadir a `enMenu` la entrada «Colgar de una tarea» (clase `ficha-documento-colgar`) que llama a `DocumentoATarea.colgarDeCarpeta(a, f.nombre)`, en el sitio de «Asociar a un hito». Sin `I.hayHitos()` (asunto «lista de tareas» o sin hitos) no se añade nada.
- Quitar lo que se queda sin uso: la ayuda `documento-sin-tarea` de `js/ayudas-textos.js` y las reglas `.marca-sin-tarea` y `.ficha-documento-colgar` de `css/hito-mesa-tareas.css`.
- `DocumentoATarea.sinTarea` se queda: lo usa la prueba `documentos-sin-tarea`.
- Repasar las pruebas que buscan la marca o el botón: `vista-del-asunto-hito-y-tareas` (puntos 13 y siguientes: el botón pasa al menú ⋮), `documentos-en-un-solo-sitio` y `ruta-de-un-documento` (sus saltos de la marca y del botón ya no hacen falta).
- Línea en `js/novedades.js`: «En los documentos ya no sale la marca «sin tarea». Para colgar un documento de una tarea, en un asunto con hitos, está en su menú ⋮.»

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar

- En la demostración, un asunto con hitos y un documento suelto: sin marca «sin tarea» ni botón a la vista; «Colgar de una tarea» en su ⋮, y funciona.
- Un asunto «lista de tareas» (aula de convivencia) con un documento suelto: sin marca, sin botón y sin la entrada en el ⋮.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
