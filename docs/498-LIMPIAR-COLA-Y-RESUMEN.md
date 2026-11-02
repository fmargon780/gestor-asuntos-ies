# 498 — Limpiar la cola y el resumen

## Lo que escribió Francisco (manda)
Cambio del método del 1-nov-2026, en el proyecto «Método de desarrollo de apps». Francisco eligió
tratar la cola y el resumen juntos («1») y dijo que se hiciera («Adelante»).

## Lo que entendió Claude (aprobado por Francisco el 1-nov-2026)
- Hoy la cola (`docs/COLA.md`) ocupa 40.607 bytes y tiene que bajar de 40.000; el resumen (`docs/CONTEXTO-CORTO.md`) tiene 327 líneas y tiene que bajar de 160.
- Se aplica `docs/METODO-COMUN.md`, apartado 5, regla 5: las filas HECHA, SUSTITUIDA y DESCARTADA
  pasan enteras a `docs/HISTORIA.md`; las HECHA de hoy y de ayer se quedan un día más.
- Lo pasado del resumen va a `docs/HISTORIA.md`; el detalle que sigue vigente, a `docs/CONTEXTO.md`.
- No se pierde ningún texto. La app no cambia.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- No se toca el código de la app ni se publica.
- No se cambia el formato de la cola: el Centro de mando la lee tal cual.
- No se reescribe el texto de las filas que siguen vivas, salvo dejar en una línea sus notas largas
  (el detalle va a la instrucción de cada fila).

## Notas técnicas de Claude
- Los mismos criterios que `docs/METODO-COMUN.md` 5.5. Si `docs/HISTORIA.md` o `docs/CONTEXTO.md`
  no existen, se crean.
- Si las reglas propias que hay al principio de `docs/COLA.md` repiten lo que ya dice
  `docs/METODO-COMUN.md`, pueden resumirse en una línea que remita a él, sin perder ninguna norma
  propia de la app.
- Si no se puede bajar del límite sin quitar algo vigente, se dice en la nota de la fila.

## Cómo lo comprueba el segundo revisor
- `wc -c docs/COLA.md` da menos de 40.000.
- Todas las filas que no eran HECHA, SUSTITUIDA ni DESCARTADA siguen en la cola, con el mismo texto y en el mismo orden.
- Las HECHA de hoy y de ayer siguen en la cola.
- Cada fila que salió está entera en `docs/HISTORIA.md` (comprobado con un script que busca cada número).
- El formato de la cola no ha cambiado (mismas columnas, estados al principio).
- `wc -l docs/CONTEXTO-CORTO.md` da 160 o menos.
- Lo que se quitó del resumen está en `docs/HISTORIA.md` o en `docs/CONTEXTO.md`, y el resumen remite a él.
- Solo cambian ficheros de `docs/`: no se toca el código ni se publica la app.

## Revisión y respuestas durante el trabajo
- Segundo revisor (2-nov-2026, ayudante sin haber visto el trabajo): coincide todo: cola 26.696 bytes (<40.000); resumen 158 líneas (<=160); las 19 filas cerradas y las 2 notas largas (478 y 480) están idénticas en HISTORIA.md; ninguna fila viva cambia ni cambia el orden; la 499 (HECHA de hoy) se queda; lo quitado del resumen está en QUE-ESTA-HECHO.md (sección 5 entera, pasada tal cual) y el resumen remite a él; solo cambia docs/. No coincide: nada. No pudo ver: el reparto exacto entre los tres ficheros destino, ni ejecutar el lector del Centro de mando (el formato de la cola no cambia).
- Decisión de Claude: las reglas propias del principio de la cola no se resumieron (no hacía falta para bajar del límite).
