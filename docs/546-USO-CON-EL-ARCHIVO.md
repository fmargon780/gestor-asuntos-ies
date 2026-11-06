# 546 — «Tipos y su uso» cuenta también lo archivado

## Lo que escribió Francisco

Idea 544, el 6-nov-2026, al abrir la herramienta de la fila 543:

> He visto la herramienta y no me ha gustado lo que veo. Está marcando sin uso tipos de asuntos que yo sé que se han usado. una pista es que los tipos de asuntos que están escritos en Mayúsculas los hemos hecho nosotros, Diego y yo, y están en uso. Y los que están en minusculas vinieron de la biblioteca

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

- Causa: la herramienta busca los archivados en `App.E.registro.asuntos`, donde ya no están. Un tipo con asuntos solo en el ARCHIVO sale con 0 archivados y «Nunca». El fallo venía de la instrucción 543.
- La herramienta contará los archivados con el índice del ARCHIVO, de todos los cursos, como ya hace la app antes de dejar borrar un tipo.
- Las columnas «Archivados» y «Último uso» salen con sus cifras, los filtros y sus números cuadran con ellas, y de partida solo salen marcados los tipos que de verdad no se han usado.
- Mayúsculas y minúsculas no influyen en la cuenta. No se usan como regla para marcar.
- Lo que desaparece o se sustituye: nada. Pantalla, botones y textos siguen igual.

## Pantalla de prueba

Tarea pequeña: sin pantalla de prueba. Manda la de la fila 543 (`docs/pantallas/540.html`).

## Qué NO se hace en esta tarea

- Cambiar nada más de la herramienta ni del envío a Claude, salvo que las cifras enviadas salen ya bien.
- Rehacer o poner al día el índice del ARCHIVO. Si el índice no se puede leer, se cuenta lo que hay, como en `App.contarAsuntosConTipo`.
- Desactivar tipos o enviar las guías: es la idea 544, de Francisco y Claude.

## Notas técnicas de Claude

- `js/tipos-y-su-uso.js`, `recoger()` es síncrona y `pintar()` la llama muchas veces. Leer una sola vez `IndiceArchivo.leerDisco({ todos: true })` al abrir el bloque, en `alAbrir()`, antes de pintar, guardar `r.datos.asuntos` en `st` y que `recoger()` lo use. Dentro de `try`, como `App.contarAsuntosConTipo` (`js/ajustes.js`).
- La marca de partida (`st.iniciado`) no se puede calcular antes de leer el índice: hoy `bloque()` llama a `pintar()` nada más crear el bloque y `recoger()` da 0 archivados. Marcar solo tras leerlo. Lo mismo con «Enviar», que usa `recoger()`: debe esperar a esa lectura.
- Por cada entrada del índice que no esté abierta: tipo con `Nombres.leer(e.nombre, App.E.tipos).tipo`, para seguir los nombres cortos y los nombres viejos (`alias`); si no sale, `e.tipo`. Cada `nombre` cuenta una sola vez, también si está a la vez en `App.E.registro.asuntos`.
- Último uso con los seis dígitos del nombre, como hoy; si la entrada trae `cerradoEl` o `fecha`, la más reciente.
- Tocar también `pruebas/tipos-y-su-uso.mjs`: un tipo con asuntos solo en el índice sale usado, sin marcar y con su fecha.

## Cómo lo comprueba el segundo revisor

- Un tipo con asuntos solo en el ARCHIVO sale con sus archivados y su último uso, no con «Nunca».
- Ese tipo no sale marcado de partida y cuenta en «Usados», no en «Sin usar».
- Un tipo sin ningún asunto, abierto ni archivado, sí sale marcado y con «Nunca».
- Un asunto archivado con el nombre corto o un nombre viejo del tipo cuenta para ese tipo.
- Las marcas de partida no cambian al cerrar y abrir el bloque.
- El cuerpo enviado lleva los archivados y el último uso correctos, sin datos de asuntos ni de personas.
- La pantalla no cambia en nada más.
- [SOLO FRANCISCO] Con el ARCHIVO real, los tipos en mayúsculas ya no salen marcados como sin usar.

## Revisión y respuestas durante el trabajo

- Segundo revisor (6-nov-2026, commit 9500c9d), aprobada:
  - Archivados y último uso salen del ARCHIVO, no «Nunca»: coincide.
  - No sale marcado de partida y cuenta en «Usados»: coincide.
  - Tipo sin ningún asunto: marcado y «Nunca»: coincide.
  - Nombre corto o nombre viejo del tipo cuenta: coincide.
  - Marcas de partida iguales al cerrar y abrir: coincide.
  - Cuerpo enviado con archivados y último uso, sin datos de asuntos ni personas: coincide.
  - La pantalla no cambia en nada más; mayúsculas/minúsculas no influyen: coincide.
  - Con el ARCHIVO real, los tipos en mayúsculas ya no salen marcados: NO COMPROBADO (solo Francisco; copiado a `docs/COMPROBAR-A-MANO.md`).
  - No visto: que el índice falle (`ok:false`/excepción); el código cuenta lo que hay, como pide el texto.
