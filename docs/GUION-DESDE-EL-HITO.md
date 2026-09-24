# Escribir el guion de la guía desde el hito (fila 120)

Cerrado con Francisco el 24-sep-2026.

## Lo que quiere Francisco

Hoy, para escribir el guion de un paso hay que ir a Ajustes → tipo → guía → «Guion de este paso».
Quiere poder escribirlo **desde la mesa del hito**, mientras tramita un asunto real. Así las guías
se completan con el uso, sin salir del asunto. Debe seguir existiendo el paso solo para ese asunto.

## Lo que se ve

Debajo del guion de la mesa del hito (`js/hito-mesa-guion.js`), dos enlaces:

1. **«+ Añadir un paso a la guía del tipo»** (nuevo, el primero). Abre el mismo campo de texto que
   el paso propio. Al guardar, la línea se añade al final del `guion` **del paso de la guía** del que
   sale el hito (`origenGuia`), no al hito.
2. **«+ Añadir un paso solo para este asunto»**: igual que hoy (`guionPropio`).

El aviso «Este hito todavía no tiene guion. Se escribe en la guía del tipo (Ajustes), en «Guion de
este paso».» pasa a: «Este hito todavía no tiene guion. Añade el primer paso aquí abajo.»

Decisión de Francisco: el paso nuevo de la guía sale **en todos los asuntos de ese tipo, abiertos y
nuevos**. Como `Hitos.guionDe(a, h)` ya lee el guion del paso de la guía en vivo por `origenGuia`,
esto sale solo; basta comprobarlo.

Casos:

- Hito sin `origenGuia` (añadido a mano, o su paso ya no está en la guía): el enlace nuevo no sale;
  solo el de «solo para este asunto».
- Paso-pregunta de la guía (no lleva guion): el enlace nuevo no sale.
- Si el guion del paso tiene una pregunta con respuestas, la línea nueva va al final del guion, fuera
  de las respuestas. Escribir dentro de una respuesta sigue siendo cosa de Ajustes.
- La línea nueva va con `accion: ''` y sin normativa ni explicación; eso se completa en Ajustes.
- Solo se toca la guía del tipo, **no** la biblioteca de hitos del centro. La biblioteca ya enseña la
  diferencia («Guion») como hoy.
- En modo consulta (el compañero tiene el mando) no sale ninguno de los dos enlaces, como hoy.
- Tras guardar, la mesa se queda abierta en el mismo hito y la línea nueva aparece sin marcar. Aviso
  verde corto: «Añadido a la guía de <nombre corto del tipo>».

## Cómo guardarlo

- Leer los pasos del tipo como hace `js/ajustes-tipo.js` y guardar con
  `GuiasDelCentro.guardarPasos(tipo, pasos)` (el mismo camino que el editor de la guía y
  `js/cargar-biblioteca.js`), con el id de línea que genera `GuiasGuion` y pasando por
  `GuiasGuion.normalizar`. Nada de `Copias.guardar` directo.
- Principal y accesorio: si falla el guardado, rojo con `U.fallo` y `U.mensajeDeError`, y no se
  pierde lo escrito.
- Un solo cuadro a la vez (`U.preguntar`); el repintado, con `U.conservandoLoEscrito`.

## Ficheros que tocar

- `js/hito-mesa-guion.js` (enlace nuevo, aviso, guardado). Si pasa de unas 400 líneas, sacar el
  guardado a `js/hito-mesa-guion-guia.js`.
- Si hace falta una función de apoyo: `js/guias-guion.js`.
- `pruebas/hito-mesa.mjs`: una prueba que añada un paso a la guía desde un asunto y compruebe que
  sale también en **otro asunto abierto** del mismo tipo, y que el paso propio sigue sin tocar la guía.
- `docs/contexto/HITO-MESA.md` (apartado «El guion»), `docs/CONTEXTO-CORTO.md` (línea de Hitos),
  `docs/HISTORIA.md`, `docs/COLA.md`.

## Cómo trabajar

- No leas el repositorio entero: `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md` y los ficheros de
  arriba bastan.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión no puede, las reglas de
  `docs/COLA.md`).
- Una sola tanda de pruebas al final.
