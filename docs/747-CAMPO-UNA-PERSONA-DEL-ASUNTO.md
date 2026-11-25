# 747 — Campo de plantilla «Una persona del asunto»

Sale del tema 745 y de la idea 744 (aviso de usuario en «Ficha de un asunto», 25-nov-2026).

**Título llano:** Un campo de plantilla que deja elegir una de las personas del asunto
**Para qué:** que en una plantilla se pueda poner un campo que pregunte «¿Quién?» y ofrezca las personas que ya están en el asunto, y que el documento lleve a la elegida; por ejemplo, quién recibe en el Recibí Genérico.

## Lo que escribió Francisco
Aviso 744 (no se pudo abrir su texto; lo entendido está en la nota de la fila 745): un campo de plantilla que ofrezca elegir entre personas, por ejemplo el alumno si es mayor de edad, el primer tutor o el segundo tutor, y que el documento lleve a la elegida. Ejemplo: quién recibe en el Recibí Genérico.

Después, al diseñar (25-nov-2026): «¿No sería más completo que si creas Una persona del asunto, te deje elegir una de las personas relacionadas en el asunto, sin entrar a ver si es mayor o menor de edad, padre o madre, tutor o lo que sea?»

## Lo que entendió Claude (acordado con Francisco el 25-nov-2026)
- En el editor de plantillas hay un tipo de campo nuevo, «Una persona del asunto». Se le pone el nombre que se quiera, por ejemplo «Quién recibe».
- Al generar el documento, la app pregunta «¿Quién?» con ese nombre. La lista son las personas que ya están en el asunto: el tercero, quien lo pide, los terceros relacionados y, si el tercero es un alumno, sus tutores.
- No hay reglas de edad, de padre o madre ni de tutor: se elige a quien se quiera. Una persona elegida por error se corrige con «Cambiar».
- Junto a cada tutor sale «Tutor legal 1» o «Tutor legal 2» y, si Séneca lo dice, «tiene la custodia». Es un dato que la app ya tiene; solo se enseña.
- La elección se guarda en el asunto y se cambia con el «Cambiar» de los datos del asunto (fila 738). Se pregunta una sola vez, aunque haya varias plantillas con ese campo.
- El documento lleva el nombre y el DNI de la persona elegida. Su teléfono y su correo quedan disponibles para otras plantillas.
- De una persona escrita a mano (como «otra persona» en «Quién lo pide»), la app no tiene el DNI: al generar el documento lo pide, como ya hace con otros datos que faltan, y lo guarda en el asunto.
- «Tutor con custodia» se queda como está. Nada desaparece de la app; las plantillas que hoy escriben el tutor a pelo se cambian después, a mano.

## Pantalla de prueba
No se pidió. Lo que verá la usuaria es lo de arriba.

## Qué NO se hace en esta tarea
- Reglas de edad («el alumno solo si tiene 18 años o más») ni de padre o madre.
- Cambiar las plantillas que ya existen: se hace aparte, una a una.
- Tocar «Tutor con custodia».

## Notas técnicas de Claude
- Puntos de partida que Claude NO ha leído entero (mirarlos antes de programar): `js/campo-elegir-en-asunto.js`, `js/campo-desde-el-asunto.js` y `js/campo-desde-el-asunto-escribir.js` (campos que se eligen en el asunto), `js/lo-pide.js` («Quién lo pide» y terceros relacionados), `js/datos-tutores.js` (tutores y custodia), `js/plantillas-valores.js` (valores de plantilla), `js/campos-manual-nuevo.js` y `js/campos-catalogo.js` (alta de un campo en el editor).
- Los terceros relacionados guardan solo categoría y nombre; el DNI de alumnos, tutores y personal sale de `Datos`. Para el resto, el valor falta y se pide al generar.
- Dato guardado con `DatosDelAsunto.guardar`; que el «Cambiar» de la fila 738 lo admita.
- Cambios quirúrgicos, ficheros nuevos por debajo de 400 líneas, una sola tanda de pruebas al final (`npm test -- <palabras>` más la prueba nueva). Añadir sus casos a la demostración grande (`js/demo/datos-grande-*.js`).
- Novedades visibles: línea al principio de `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En el editor de plantillas se puede crear «Una persona del asunto» con el nombre que se quiera.
- Al generar un documento con ese campo sale «¿Quién?» con el tercero, quien lo pide, los terceros relacionados y los tutores (solo si el tercero es alumno), con «Tutor legal 1/2» y «tiene la custodia» donde corresponda, y sin ninguna regla de edad.
- La elección se guarda en el asunto, no se vuelve a preguntar con otra plantilla y se cambia con «Cambiar».
- El documento lleva nombre y DNI de la elegida; con una persona escrita a mano, pide el DNI y lo guarda.
- «Tutor con custodia» sigue igual.

## Qué mirar al terminar
- Crear un campo «Quién recibe» en una plantilla de prueba y generar el documento en un asunto de alumno con dos tutores.
- Elegir un tutor, generar otra plantilla con el mismo campo (no pregunta de nuevo) y cambiar la elección con «Cambiar».
- Probar con una persona escrita a mano (sin DNI).
- Solo Francisco, con sus datos: el Recibí Genérico real `[solo en: la app real]`.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- (25-nov-2026, sesión de Claude Code) Código en la rama `fila-747` (también en `claude/amazing-dijkstra-c0qgwa`), sin fusionar en `main` ni publicar. Nuevo: `js/persona-del-asunto.js`, clase de dato `personaAsunto` en `js/campos-clases.js`, y enganches en `js/datos-del-asunto.js`, `js/plantillas-valores.js`, `js/plantillas.js`, `js/word-faltan.js`, `js/asuntos-editar.js`, `js/asuntos-nuevo-campos.js`. Prueba nueva `pruebas/persona-del-asunto.mjs` (11 comprobaciones); `campos-importe-numero-fecha` actualizada (seis clases). La pasada completa dio 423 de 425; los dos fallos son los de arriba (uno a solas pasó, el otro era la cuenta de clases).
- **Revisor 1: RECHAZADA.** Punto 3: «Cambiar el asunto» enseñaba el campo con el desplegable vacío y al guardar borraba la elección. Arreglado (el cuadro no enseña el campo y conserva la persona).
- **Revisor 2 (desde cero): RECHAZADA** — ATASCO PARA CLAUDE. Lo que dijo:
  - Punto 3 MAL: no encontró un «Cambiar» para la persona elegida (ni en la tarjeta «Campos de este asunto», ni en «Cambiar el asunto», ni en otra pantalla). Sí vio que no vuelve a preguntar y que «Guardar» en «Cambiar el asunto» ya no la borra. Duda mía: el «Cambiar» de la fila 738 vive en la lista de datos de la tarea/plantilla (`js/datos-del-asunto-vista.js`, solo si el dato ya está guardado); el revisor no llegó a esa pantalla. Habría que decidir con Francisco dónde se cambia la persona.
  - Punto 4 MAL: el nombre de relacionados y tutores sale mal en el Word: «Otero Campos, Marta 344A» (lleva el código de referencia pegado) y apellidos primero («Ponce, Rocío»), frente al tercero «Iván Esteban Roca». Pendiente: limpiar el código y decidir el orden del nombre (probable: usar `Plantillas.nombreNaturalDe`).
  - Punto 5 MAL «probable»: «Custodia · Persona» del selector no se rellena solo; el revisor no pudo compararlo con antes. No es de esta fila (probablemente ya era así).
  - Defectos menores: el relacionado sale sin rol; no se vio el caso «Otra persona…» ni «Tutor con custodia» con dos tutores sin custodia.
  - Duda del punto (c), sin relación con la fila: un asunto liquidado no aparece en «Asuntos cerrados» de la copia.
- Para retomar: arreglar el nombre (4), decidir dónde está el «Cambiar» (3, pregunta para Francisco si cambia lo que ve la usuaria) y volver a pasar un revisor nuevo.

