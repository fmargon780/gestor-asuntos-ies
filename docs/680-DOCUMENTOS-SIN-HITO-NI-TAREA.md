# 680 — Documentos sin hito ni tarea: lo obligatorio pasa a opcional, por ahora

## Lo que escribió Francisco
Idea apuntada desde el Centro de mando el 16-nov-2026:

> En los últimos días hemos hecho un cambio profundo en la estructura y condiciones de los hitos, tareas y documentos. Normalmente, establecí condiciones obligatorias, como que un documento tenía que estar asociado a un hito y a una tarea. Esto está siendo un problema para mi compañero. Necesito que me hagas un listado de esas condiciones obligatorias con el fin de decirte cuáles tornar en opcionales mientras depuro yo personalmente el nuevo sistema. Es urgente.

Claude le dio el listado de cinco condiciones y Francisco contestó: «Por ahora todas».

## Lo que entendió Claude (acordado con Francisco el 16-nov-2026)
Las cinco condiciones pasan a opcional. «Por ahora»: es mientras Francisco depura el sistema nuevo. Qué verá y hará quien use la app:

- **Bandeja «Por clasificar».** El cuadro del nombre sigue con el bloque «¿De qué tarea es?» y con su propuesta de siempre. Se puede pulsar «Guardar» sin hito o sin tarea: el documento entra en el asunto y queda sin tarea (sale la marca «sin tarea» de siempre). Ya no sale «Elige el hito y la tarea de los que cuelga el documento.», «Elige la tarea de la que cuelga el documento.» ni «Añade antes el hito del que cuelga el documento.».
- **«+ Añadir documento» dentro del asunto.** La ventana «¿De qué tarea es?» sigue saliendo. La lista de tareas lleva una primera opción, «Sin tarea»: con ella se añade el documento sin colgarlo de nada. «Cancelar» sigue sin añadir nada.
- **Asunto sin hitos.** «Añadir documento» no pregunta nada y el documento se añade sin tarea. Ya no sale «Para añadir un documento, crea antes el hito.».
- **«Hay que registrarlo» sin hito.** Se guarda igual. Si no hay hito elegido, el documento queda apuntado como «Sin registrar» (la marca de antes de la fila 667) y pasa solo a tarea «Registrar» cuando el asunto tenga un hito, como ya hace la app. Con hito elegido, todo sigue como hoy. Ya no sale «Elige el hito en el que hay que registrar el documento.».
- **Tarea «Registrar».** Se marca con el documento de la tarea, como hoy. Si el documento que se registra no es el de ninguna tarea, se marca la primera «Registrar» sin hacer del hito (como antes de la fila 522), en vez de no marcar ninguna.
- Todo lo demás de las filas 522, 661 y 667 sigue igual: la propuesta de tarea, el documento colgado de cada tarea, las versiones, los avisos «Sin registrar» al marcar el hito, cerrar o enviar (que solo avisan).
- Cuando el documento queda sin tarea, no hay aviso rojo ni ámbar: es una opción permitida.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Un interruptor en Ajustes para volver a hacerlas obligatorias con un clic: Francisco lo dejó aparte (idea 682).
- No se tocan los avisos que no impiden nada (marcar el hito, cerrar el asunto, enviar).
- La fila 681 (cómo se añade un documento al asunto: elegir de dónde viene, arrastrar y soltar) sigue por separado. Si se programa después de esta, parte de lo que deja esta fila.

## Notas técnicas de Claude
- Leído en `main` el 16-nov-2026 (c966695). Sitios donde está la obligación:
  1. `js/documento-tarea-bloque.js`, `destino()` (líneas ~172-178): hoy devuelve `{ aviso }` sin hito, sin tarea o sin hitos. Pasa a devolver `{ hitoId: '', tareaId: null, sinTarea: true }` en esos casos y solo `{ hitoId, tareaId }` con las dos cosas. En `js/documentos-guardar.js` (~línea 130-136, `opciones.desdeBandeja`) ya no se corta con el aviso: sin destino se guarda como un documento sin tarea. Mirar qué hace el resto de `guardar` con `destino` vacío (línea del Registro, `hitoDelRegistro`) para que no use un hito vacío.
  2. `js/documento-a-tarea.js`, `preguntar()` (línea ~70): con `lista` vacía devuelve `null` y avisa; pasa a devolver `{ sinTarea: true }` sin ventana. Con hitos, la primera opción de tareas es «Sin tarea»; al pulsarla, devuelve `{ sinTarea: true }`. Cancelar sigue devolviendo `null`. En `js/documentos-guardar.js` (~línea 134-136) hoy `if (!destino) return;` cancela: distinguir `null` (cancelar) de `{ sinTarea: true }` (seguir sin tarea). Mirar también `colgar` y `colgarDeCarpeta`, que llaman a `preguntar` con `colgar: true`: «Colgar de una tarea» no tiene sentido sin tarea; ahí «Sin tarea» no se ofrece.
  3. `js/documentos-guardar.js`, `hitoRegistrar` (~línea 140-144): sin hito ya no se corta. Con la casilla marcada y sin hito, se apunta `App.anotarLista(a.nombre, 'pendientesRegistro', …)` con el nombre del documento (la lista antigua que `HayQueRegistrarlo.migrar` ya pasa a tareas cuando hay hito; ver `js/hay-que-registrarlo.js` línea ~148-169). **Comprobar antes** que `pendientesRegistro` se sigue pintando como «Sin registrar» en la mesa y en la ficha (la fila 667 dice que sí, para los asuntos sin hitos). Si no se pintara, avisar a Francisco en la nota de la fila y guardar con un aviso ámbar «Guardado sin tarea «Registrar»: no hay hito.» (único texto nuevo permitido).
  4. `js/tareas-con-documento.js`, `elegirPaso` (~línea 82-87): hoy, con documento que no es de ninguna tarea, solo devuelve una sin documento. Pasa a devolver `candidatos[0]` si no hay ninguna con su documento ni ninguna sin documento. `Hitos.marcarGuionPorAccion` (`js/hitos-guion-marcar.js`) ya llama a `elegirPaso`.
  5. `js/documentos-formulario.js` (~línea 176, `pideHito`) y `js/hay-que-registrarlo.js` (`hitoElegido`): el desplegable «Hito» de «Hay que registrarlo» sigue; «Elige el hito…» vacío es ahora una respuesta válida.
- Textos: quitar de los ficheros los avisos citados arriba; el resto de textos de las filas 661 y 667 no se toca. Palabras según `docs/VOCABULARIO.md`.
- Pruebas: buscar con `npm test -- <palabra>` las que comprueban los avisos retirados (`documentos-tarea`, `bandeja`, `hay-que-registrarlo`, `tareas-con-documento`) y cambiarlas a lo nuevo; no borrarlas. Prueba nueva: `pruebas/documentos-sin-tarea.mjs` (bandeja sin hito ni tarea guarda y sale «sin tarea»; «Añadir documento» con «Sin tarea»; asunto sin hitos; «Hay que registrarlo» sin hito apunta la marca antigua; `elegirPaso` con el documento de otro).
- Línea en `js/novedades.js` (fila 248): «Ya se pueden guardar documentos sin elegir hito ni tarea.»
- Dejar la fila 680 como la última de su orden; es urgente: Francisco quiere que su compañero la tenga hoy. Publicar una sola vez, como siempre.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Abre un asunto con hitos, ve a «Por clasificar» y guarda un documento sin elegir hito ni tarea. Debe quedar en el asunto con la marca «sin tarea».
- En el mismo asunto, «Añadir documento» y elige «Sin tarea». Debe añadirse sin avisos.
- Abre un asunto sin hitos y pulsa «Añadir documento». Debe añadirse sin preguntar nada.
- Guarda un documento con «Hay que registrarlo» marcado y sin hito. Debe guardarse sin aviso rojo.

## Revisión y respuestas durante el trabajo
- (16-nov-2026, Claude Code, tarea pequeña: sin segundo revisor; comparado con la instrucción)
- coincide: bandeja «Por clasificar» sin hito o sin tarea guarda y el documento sale «sin tarea»; ya no salen los tres avisos (prueba nueva `documentos-sin-tarea`).
- coincide: «+ Añadir documento» con hitos ofrece «Sin tarea» como primera opción; «Cancelar» sigue sin añadir nada; al colgar de una tarea, «Sin tarea» no se ofrece.
- coincide: asunto sin hitos: «Añadir documento» no pregunta y se añade sin tarea; el botón ya no sale apagado ni con la línea «crea antes el hito» (hay que decirlo: esa línea era del botón de la ficha, no de otro sitio).
- coincide: «Hay que registrarlo» sin hito guarda y deja la marca «Sin registrar» (`pendientesRegistro`, la de antes de la fila 667); con hito, igual que hoy.
- coincide: `elegirPaso` devuelve la primera «Registrar» sin hacer cuando el documento no es de ninguna tarea.
- no lo he podido ver: con un navegador real y el instituto (solo con la copia de pruebas); que la marca «Sin registrar» se pinte en un asunto con hitos y la pasada de `migrar` al crear el primero.
