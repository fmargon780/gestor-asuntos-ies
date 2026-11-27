# 779 — El certificado de devolución de libros, para anulación y traslado

**Título llano:** El certificado de devolución de libros, para anulación y traslado
**Para qué:** que la anulación de matrícula y el traslado de matrícula viva tengan ya su certificado de que el alumno ha devuelto los libros, con un texto que valga para los dos.

## Lo que escribió Francisco
Tema 694 (pasar los tipos al molde nuevo), 27-nov-2026. Al repasar la primera tanda
(`docs/notas-diseno/694-tanda-1.md`), las tareas «Certificado de entrega de libros» de ANULACIÓN
MATRÍCULA y de TRAS. MATR. VIVA. Claude miró el código: ese certificado no es la ficha de entrega de
libros (fila 501), y ya hay una plantilla parecida colgada del tipo TRASLADO. Francisco eligió «1»:
una sola plantilla para los dos tipos, con un texto que valga para los dos.

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)
- La plantilla «Devolución de libros de gratuidad por traslado» pasa a llamarse «Devolución de
  libros de gratuidad».
- Su texto deja de decir «que causa baja en este centro por traslado» y dice «que causa baja en
  este centro». Todo lo demás se queda igual (CERTIFICADO, firma Secretaría con V.º B.º de
  Dirección, dato «Estado de los libros»).
- Al pulsar «Cargar las plantillas del centro», esa plantilla queda colgada de ANULACIÓN MATRÍCULA y
  de TRAS. MATR. VIVA (el alumno que se va), sin duplicar nada de lo que ya hay.
- **Se quita de TRASLADO** (alias de TRASLADO DE EXPEDIENTE ACADÉMICO SOLICITADO AL CENTRO DE ORIGEN:
  el alumno que llega). Ese certificado lo da el centro del que se va el alumno, no el que lo recibe
  (Francisco, 27-nov-2026: «1»). La plantilla «Petición del historial al centro de procedencia» sigue
  en TRASLADO.
- El dato «Estado de los libros» de los dos tipos y la tarea del certificado de cada guía no los
  pone esta fila: los pondrá la herramienta que pase esos tipos al molde nuevo (tema 694).

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Pasar ANULACIÓN MATRÍCULA y TRAS. MATR. VIVA al molde nuevo, con sus tareas y el dato «Estado de
  los libros»: lo hará la herramienta del tema 694.
- «Solo si» por enseñanza del alumno (solo ESO): tarea pequeña aparte del tema 694.
- La ficha de entrega de libros (fila 501): no cambia.

## Notas técnicas de Claude
- `plantillas/devolucion-libros.md`: quitar « por traslado» de la frase de baja y cambiar `nombre`.
  Volver a generar su `.docx` con `node scripts/hacer-plantillas.mjs` (solo debe cambiar ese).
- `plantillas/indice.json`: la entrada de `TRASLADO` deja de estar colgada de `TRASLADO`; la
  plantilla queda colgada de `ANULACIÓN MATRÍCULA` y de `TRAS. MATR. VIVA` (nombres con que están en
  `guias.json` real y en `pruebas/apoyo/datos-657/tipos.json`), mismo `fichero`.
- En el centro real la plantilla ya está cargada en `TRASLADO` (`_GESTOR/plantillas.json`, leído el
  27-nov-2026). «Cargar las plantillas del centro» no quita nada por sí sola: la que hay en
  `TRASLADO` tiene que acabar en uno de los dos tipos nuevos (por ejemplo, con el paso de tipo de la
  fila 126, misma plantilla y mismo fichero), no quedarse en `TRASLADO` ni repetirse.
- Ojo con `js/plantillas-centro.js`: una entrada con el mismo `nombre` y el mismo `fichero` que una
  plantilla ya cargada en otro tipo **no se añade, se pasa de tipo** (fila 126). Con tres entradas
  iguales, la plantilla saltaría de un tipo a otro y quedaría en uno solo. Hay que conseguir que
  quede en los tres sin cambiar esa regla para las demás plantillas: por ejemplo, un nombre distinto
  por tipo («Devolución de libros de gratuidad · anulación», «… · traslado»), o un campo nuevo del
  índice que permita varios tipos. Elegir lo más pequeño y decirlo en la nota de la fila.
- Pasar `pruebas/plantillas-del-centro.mjs` y la pasada completa. Sumar el caso a
  `docs/CASOS-DE-PRUEBA.md`.
- Novedad visible en `js/novedades.js` (fila 248).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En la copia de pruebas, «Cargar las plantillas del centro»: la plantilla sale en ANULACIÓN
  MATRÍCULA y en TRAS. MATR. VIVA, una sola vez en cada uno, y ya no en TRASLADO, y una segunda pulsación no
  añade nada.
- En un asunto de ANULACIÓN MATRÍCULA, «Generar documento ▾» ofrece la plantilla y el Word dice
  «que causa baja en este centro», sin «por traslado».

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
