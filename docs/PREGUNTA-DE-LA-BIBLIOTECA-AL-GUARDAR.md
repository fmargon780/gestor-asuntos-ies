# La pregunta de la biblioteca al guardar una guía (fila 297 de la cola)

Diseño cerrado con Francisco el 7-oct-2026, en Cowork. Sale de un aviso de usuario (Diego Herrera,
el compañero de Francisco, 7-oct-2026 09:56, versión 06-oct-2026 · 20:14, copia sin internet).

## Qué pasó

Diego abrió «Cambiar la guía» desde un asunto de «Medida disciplinaria por conducta gravemente
perjudicial», cambió el nombre de un hito y pulsó Guardar. Le salió esta ventana:

> ¿Este cambio es solo para Medida disciplinaria por conducta gravemente perjudicial, o también
> para la biblioteca? (lo usan 1 tipo más)
>
> | | Este tipo | La biblioteca |
> |---|---|---|
> | Responsable | (vacío) | Secretaría |
> | Plantilla del aviso | Aviso de avance | (vacío) |
>
> [Solo aquí] [También en la biblioteca]

Su aviso: «contesto solo aquí o también en la biblioteca, pero no se sale de la ventana de diálogo
para continuar con la modificación».

## La causa más probable (compruébala antes de tocar nada)

`GuiasBiblioteca.revisarAlGuardar` (`js/guias-biblioteca.js`, sección 3), que `js/guias-editor.js`
llama al guardar la guía, hace una pregunta **por cada hito de la guía que viene de la biblioteca
y es distinto de su modelo**, lo haya tocado el usuario o no. Las preguntas salen una detrás de
otra, con el mismo título, sin decir de qué hito hablan. Esa guía tiene catorce hitos, casi todos
de la biblioteca. Al contestar una, sale la siguiente, igual a la vista: parece que la ventana no
se cierra. Encaja con la captura: la tabla hablaba de «Responsable» y de «Plantilla del aviso»,
que Diego no había tocado, y no del título, que es lo que cambió.

Primer paso de la fila: reprodúcelo en la copia de demostración, con una guía que tenga varios
hitos de la biblioteca ya distintos de su modelo (añádelos a `js/demo/datos.js` si no los hay).
Si la causa es esta, sigue con lo de abajo. **Si es otra, arregla además la que sea** y cuéntalo
en `docs/HISTORIA.md`. Apunta también en `docs/HISTORIA.md`, en una línea, de dónde salen esas
diferencias que nadie ha escrito a mano (por ejemplo, una pasada automática o la carga de las guías
del instituto). No las corrijas en esta fila.

## 1. Lo que ve el usuario

1. **Solo se pregunta por los hitos que el usuario ha cambiado esta vez.** «Esta vez» es entre
   abrir «Cambiar la guía» y pulsar Guardar. Un hito de la biblioteca que ya era distinto de su
   modelo al abrir, y que no se ha tocado, no pregunta nada y se queda como estaba (no se le toca
   `origenBiblioteca`). Cambiar solo el orden de los hitos tampoco pregunta.
2. **La pregunta dice de qué hito habla.** Título: «Has cambiado el hito «<título que tenía al
   abrir>». ¿Es solo para <tipo>, o también para la biblioteca? (lo usan N tipos más)». La coletilla
   del paréntesis, como hoy.
3. **Si hay más de un hito cambiado**, el título empieza por «(1 de 3)», «(2 de 3)»…
4. **La tabla enseña solo lo que se ha cambiado esta vez**, con dos columnas: «Antes» y «Ahora».
   Si para alguno de esos renglones la biblioteca tiene un valor distinto del de «Antes», se añade
   una tercera columna, «En la biblioteca», con ese valor (vacía en los demás renglones). Sin
   ningún renglón así, la tercera columna no sale.
5. **Tres botones**, en este orden: «Cancelar» · «Solo aquí» · «También en la biblioteca» (el
   principal, como hoy).
   - «Solo aquí»: como hoy (el hito queda «De la biblioteca · cambiado aquí»).
   - «También en la biblioteca»: sube a la biblioteca **solo los campos cambiados esta vez**, no
     el hito entero. Lo que ya era distinto antes y no se ha tocado sigue distinto, en los dos
     lados. La `revision` del modelo sube como hoy, y los demás tipos reciben su aviso de siempre.
   - «Cancelar»: vuelve a «Cambiar la guía» con todo lo escrito tal como estaba, sin guardar nada.
     Desde ahí el usuario sigue, o cancela la guía. Cerrar la ventana con Esc, si hoy se puede,
     hace lo mismo que «Cancelar», nunca «Solo aquí».
6. **Nada se escribe hasta contestar la última pregunta.** Las respuestas se guardan en memoria y
   se aplican juntas al final (biblioteca y guía). «Cancelar» en cualquiera de ellas olvida las
   respuestas anteriores.
7. Un hito que no existía al abrir y se ha traído de la biblioteca en esta misma edición se
   compara con su modelo, como hoy: si el usuario lo ha cambiado después de traerlo, pregunta.

No cambia: el botón «Guardar en la biblioteca» de dentro de cada hito (`engancharBoton`), el aviso
a los demás tipos («ha cambiado en la biblioteca», `abrirComparacion`) ni las etiquetas de origen.

Los textos, con las palabras de `docs/VOCABULARIO.md`.

## 2. Cómo hacerlo

- La foto de los hitos «al abrir» se toma **después** de las conversiones automáticas que el editor
  hace al abrirse (documentos y comunicación a tareas, fila 199), para que no cuenten como cambios
  del usuario. Se compara por `id` de hito.
- La comparación entre el hito de antes y el de ahora usa la misma lista de campos y los mismos
  textos legibles que `HitosBiblioteca.diferencias` (`CAMPOS_COMPARABLES`, `textoLegibleDe`); no se
  escribe otra lista a mano.
- Función nueva en `js/hitos-biblioteca.js` para subir a un modelo solo unos campos de un hito
  (por la misma puerta, `cambiar`, que `actualizarDesdePaso`).
- `revisarAlGuardar` devuelve si se ha cancelado. `js/guias-editor.js` tiene 576 líneas y el tope
  es 600: la lógica nueva va en `js/guias-biblioteca.js`; en el editor, solo tomar la foto, pasar
  el resultado y volver a abrir el cuadro si se canceló. Si aun así pasa de 600, se parte por la
  regla de siempre.
- El cuadro de tres botones: mira antes si ya hay uno que sirva (`js/donde-se-guarda.js`). Un solo
  cuadro a la vez, como siempre; al salir, «Cancelar» de `#cuadro-cancelar` queda con su texto.
- `GuiasBiblioteca.preguntaCambioSoloAqui` la usa también `engancharBoton`: el título del hito y
  el contador entran como parámetros opcionales, sin cambiar lo que ve ese otro sitio.

## 3. El aviso decía «Pantalla: Inicio»

La captura es de dentro de un asunto, pero el aviso llegó con «Pantalla: Inicio». Puede ser cierto
(la captura es de las 9:52 y el aviso de las 9:56). Comprueba `nombrePantalla` de `js/soporte.js`
con la ficha de un asunto abierta, con un hito a pantalla completa y con un cuadro abierto encima.
Si en alguno dice una pantalla que no es, arréglalo. Si acierta en los tres, no se toca nada y se
dice en `docs/HISTORIA.md`. El aviso sigue llevando solo el nombre de la pantalla, nunca el título
de un cuadro (puede llevar el nombre de una persona).

## 4. Ficheros que se tocan

- `js/guias-biblioteca.js` (sección 3, `revisarAlGuardar`, y la tabla de comparación)
- `js/guias-biblioteca-guardias.js` (`preguntaCambioSoloAqui`)
- `js/hitos-biblioteca.js` (subir solo unos campos; comparar dos hitos)
- `js/guias-editor.js` (la foto al abrir y volver al cuadro si se cancela)
- `js/soporte.js` (solo si el apartado 3 lo pide)
- `js/demo/datos.js` (una guía con hitos de la biblioteca ya distintos de su modelo)
- `js/novedades.js` (una línea: «Al guardar una guía, la pregunta de la biblioteca sale solo por
  los hitos que has cambiado, dice de cuál habla y se puede cancelar.»)
- `css/` solo lo que pida el tercer botón y la tercera columna
- `pruebas/pregunta-de-la-biblioteca.mjs` (nueva) y las pruebas de hoy que pulsen esa pregunta
- `docs/contexto/HITOS-Y-GUIAS.md`, `docs/CONTEXTO-CORTO.md` (sustituyendo la frase «al guardar uno
  cambiado, una sola pregunta…»), `docs/HISTORIA.md`

Cambios quirúrgicos: no se reescribe ningún módulo. Mientras se trabaja, solo las pruebas de lo
tocado (`node pruebas/ejecutar.mjs biblioteca`, `guia`); la pasada completa, una vez al final.

## 5. Pruebas

En `pruebas/pregunta-de-la-biblioteca.mjs`, con una guía de seis hitos de la biblioteca, cuatro de
ellos ya distintos de su modelo:

1. Abrir «Cambiar la guía» y Guardar sin tocar nada: no sale ninguna pregunta y la guía se guarda.
2. Cambiar el título de un hito y Guardar: sale **una** pregunta, con el título de antes en el
   título de la ventana, y la tabla tiene un solo renglón, «Título», con «Antes» y «Ahora».
3. «Solo aquí»: la ventana se cierra, la guía queda guardada con el título nuevo, el modelo no
   cambia, y el hito queda marcado como cambiado aquí.
4. «También en la biblioteca»: la ventana se cierra, el modelo tiene el título nuevo y su
   `revision` ha subido, y **los campos que ya eran distintos siguen distintos** en el modelo.
5. «Cancelar»: vuelve «Cambiar la guía» con el título nuevo todavía escrito; ni `guias.json` ni
   `hitos-biblioteca.json` han cambiado. Guardar otra vez vuelve a preguntar.
6. Cambiar dos hitos: «(1 de 2)» y «(2 de 2)». «También en la biblioteca» en la primera y
   «Cancelar» en la segunda: la biblioteca no ha cambiado.
7. Un campo cambiado cuyo valor de antes era distinto del de la biblioteca: sale la tercera
   columna, con el valor de la biblioteca.
8. Cambiar solo el orden de dos hitos: no pregunta.
9. Las conversiones automáticas al abrir no cuentan: una guía con una plantilla de documento que
   el editor convierte en tarea al abrirse no pregunta al guardar sin tocar nada.

## Cómo sabemos que está bien

1. En la copia de demostración, abrir un asunto del tipo preparado, «Cambiar la guía», cambiar el
   nombre de un hito de la biblioteca y Guardar: sale una sola ventana, que nombra ese hito y
   enseña solo «Título».
2. Con cualquiera de los tres botones la ventana se cierra a la primera.
3. Con «Cancelar» se vuelve a la guía, con lo escrito.
4. Abrir y guardar esa guía sin tocar nada no pregunta.
