# Huecos encontrados al escribir las pruebas de la fila 69

`docs/PRUEBAS-QUE-FALTAN.md` (fila 69) pide escribir pruebas para `js/unir-asuntos.js` y
`js/recurrentes.js` sin tocar el código de producción, salvo si el fallo es de una línea y
evidente. Al escribir esas pruebas (`pruebas/unir-asuntos.mjs`, `pruebas/recurrentes.mjs`)
aparecieron dos diferencias entre lo que describía el propio encargo y lo que hace de verdad el
código. Ninguna de las dos es de una línea, así que se dejan sin tocar y se apuntan aquí.

## 1. Unir dos asuntos con un documento del mismo nombre

`docs/PRUEBAS-QUE-FALTAN.md` (2.2) decía: "un documento con el mismo nombre en las dos no se
pisa: entra con ' (2)'". Lo que hace de verdad `js/unir-asuntos.js` (`nombresQueChocan` +
`unirAsuntos`): si hay **cualquier** nombre repetido entre las carpetas que se van a unir, se para
la unión entera antes de mover nada, con un aviso pidiendo renombrar a mano. No se mueve ni un
solo documento, ni el que no choca.

Añadir el renombrado automático con " (2)" sería una mejora real, no una corrección de una línea:
tocaría decidir con qué criterio numerar (¿" (2)", " (3)"…?), y qué pasa si el destino también
tiene ya un " (2)". Se deja para quien decida si merece la pena, como fila nueva de la cola.

## 2. "Ocultar por hoy" en el aviso de los asuntos recurrentes

`docs/PRUEBAS-QUE-FALTAN.md` (2.3) pedía comprobar que "Ocultar por hoy" hace lo que dice, en el
aviso de los asuntos recurrentes. `js/recurrentes.js` (`pintarPanel`) no tiene ningún botón así:
solo "Crear el asunto/los N" y "Ver la lista en Ajustes". El botón "Ocultar por hoy" que sí existe
es el de `js/avisos.js` (los plazos que vencen), un aviso distinto.

Si se quiere, se puede copiar el mismo patrón de `js/avisos.js` (`localStorage`, una clave con la
fecha de hoy, comprobada antes de pintar el panel): un rato pequeño de trabajo, pero no una línea
evidente dentro de esta fila. Se deja apuntado como posible fila nueva.

## Qué se ha hecho mientras tanto

Las pruebas nuevas comprueban el comportamiento **de verdad** de cada fichero, no el que describía
el papel: `pruebas/unir-asuntos.mjs` comprueba que un choque de nombres para la unión entera sin
mover nada, y `pruebas/recurrentes.mjs` no incluye ningún escenario de "Ocultar por hoy".
