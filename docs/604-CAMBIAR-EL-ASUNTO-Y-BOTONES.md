# 604 — «Cambiar el asunto» y botones de los cuadros

## Lo que escribió Francisco
Tema: «Cambiar el asunto» y botones de los cuadros. Junta las ideas 494, 569 y 595: que el aviso ámbar de tercero de otra clase no salga cuando la clase del tercero es una de las permitidas del tipo; que, al cambiar el tipo de un asunto, la pregunta de después diga «Dejar los hitos como están» en vez de «Cancelar»; y que los cuadros «Vista con documentos sin guardar» y «archivar con notas sin ver» de las notas de directivos digan «Guardarlos ahora» y «Verlas», que hoy salen como «Cancelar» por la misma causa. Las tres parecen tareas pequeñas.

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)
- En «Cambiar el asunto», el aviso ámbar «Este tipo es de …; … es de … Cambia el tipo si no encaja.» solo sale cuando la clase del tercero elegido no es ninguna de las clases de tercero del tipo. Si el tipo admite varias clases y el tercero es de una de ellas, no sale.
- Al cambiar el tipo de un asunto con hitos, el cuadro «El tipo ha cambiado» tiene dos botones: «Traer la guía nueva» y «Dejar los hitos como están» (hoy sale «Cancelar»).
- Notas de directivos, al pulsar «Vista» con documentos sin guardar: los botones son «Marcar como vista de todos modos» y «Guardarlos ahora» (hoy sale «Cancelar»).
- Notas de directivos, al archivar con notas sin ver: los botones son «Archivar de todos modos» y «Verlas» (hoy sale «Cancelar»).
- Lo que hace cada botón no cambia; solo su texto.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Nada apartado.

## Notas técnicas de Claude
- Aviso ámbar: `refrescarAvisoCategoria` (`js/asuntos-editar.js`, hacia la línea 278) compara con `Nombres.categoriaDeTipo` (una sola clase). Usar `Nombres.categoriasDeTipo(App.E.tipos, tipo)` y ocultar el aviso si incluye `elegido.categoria`; si sale, nombrar en el texto las clases del tipo (como ya hace `Nombres.textoCategoria`, unidas con « · »).
- Botones: `U.preguntar` (`js/util.js`, línea 267, fila 524) pone `textoCancelar || 'Cancelar'` y pisa el texto puesto a mano antes de llamarlo. En `js/hitos-cambio-de-tipo.js` (hacia la línea 90) y `js/notas-directivos.js` (líneas 246 y 338) pasar el texto por el quinto parámetro `textoCancelar` y quitar el cambio a mano del botón (y su vuelta a «Cancelar» o al texto anterior).
- Sacar `cambiar-tipo-y-guia.mjs` y `notas-de-directivos.mjs` de `RETIRADAS` en `pruebas/ejecutar.mjs` y que pasen. Si no hay prueba del aviso ámbar con un tipo de varias clases, añadirla.
- Cambia algo visible: línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En «Cambiar el asunto» de un asunto cuyo tipo admite varias clases, elige un tercero de la segunda clase: no sale el aviso ámbar.
- Elige un tercero de una clase que el tipo no admite: sale el aviso.
- Cambia el tipo de un asunto con hitos: el cuadro dice «Dejar los hitos como están».
- En una nota de directivo con documentos sin guardar, pulsa «Vista»: el cuadro dice «Guardarlos ahora».
- Archiva un asunto con notas de directivos sin ver: el cuadro dice «Verlas».

## Revisión y respuestas durante el trabajo
- Revisión (10-nov-2026, tarea pequeña, sin segundo revisor; comprobada contra la instrucción):
  - Coincide: aviso ámbar solo si la clase del tercero no es ninguna del tipo (y nombra las clases del tipo unidas con « · »); «Dejar los hitos como están», «Guardarlos ahora» y «Verlas» salen como texto del botón de cancelar; lo que hace cada botón no cambia.
  - Pruebas: `cambiar-tipo-y-guia` y `notas-de-directivos` salen de RETIRADAS y pasan; prueba nueva del aviso con un tipo de varias clases. Se cambió en `cambiar-tipo-y-guia` la comprobación «el texto de Cancelar vuelve a ser el de siempre» (era de la solución a mano antigua) por «el siguiente cuadro normal dice Cancelar».
  - No se ha podido ver: la pantalla real en el navegador de la usuaria; solo las pruebas automáticas.
  - `candidaturas.mjs` falla igual en main: fila 608.
