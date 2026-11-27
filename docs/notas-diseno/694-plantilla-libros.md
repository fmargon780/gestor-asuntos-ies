# 694 — Tarea pequeña: certificado de devolución de libros para anulación y traslado de matrícula viva

Borrador de Claude, 27-nov-2026. Sin aprobar. Decidido por Francisco el 27-nov-2026: una sola
plantilla para los dos tipos (ver `694.md`, «Decidido»).

## Qué verá Francisco

- En ANULACIÓN MATRÍCULA (tarea «Certificado de entrega de libros») y en TRAS. MATR. VIVA (tarea
  «Certificado de entrega de libros»), la tarea ofrece la plantilla «Devolución de libros de
  gratuidad», sin tener que elegir «Otra plantilla…».
- El texto del certificado ya no dice «que causa baja en este centro por traslado»: dice «que causa
  baja en este centro», para que valga también en una anulación.
- Los dos tipos tienen el dato «Estado de los libros» (texto libre), que la plantilla ya pide.

## Mirado en el código (27-nov-2026)

- La plantilla existe: `plantillas/devolucion-libros.md` y `.docx`; en `plantillas/indice.json` va
  colgada del tipo `TRASLADO` (no de ANULACIÓN MATRÍCULA ni de TRAS. MATR. VIVA). Es CERTIFICADO,
  firma Secretaría con V.º B.º de Dirección (coincide con el recorrido de CERTIFICADO aprobado).
- Cada entrada del índice lleva un solo `tipo` (`js/plantillas-centro.js`). Si «Cargar las
  plantillas del centro» ve otra entrada con el mismo `nombre` y el mismo `fichero` en otro tipo, no
  la duplica: la pasa al tipo nuevo. Por eso las entradas de los dos tipos llevan **nombres
  distintos** (o se hace una sola cosa distinta, ver abajo).
- «Estado de los libros» no está definido en el código: solo lo cita la plantilla (`{campo:…}`). Los
  campos de un tipo son datos de `tipos.json`, no código.
- No se ha podido mirar si el tipo `TRASLADO` existe en los datos reales de Francisco: `tipos.json`
  real no se ha vuelto a leer en esta parte.

## Qué hará Claude Code (para cuando se apruebe)

1. Cambiar el texto de `plantillas/devolucion-libros.md` y su `.docx` (quitar «por traslado»), y el
   nombre del índice a «Devolución de libros de gratuidad».
2. En `plantillas/indice.json`, entradas colgadas de `ANULACIÓN MATRÍCULA` y de `TRAS. MATR. VIVA`
   (los nombres con que están hoy en los datos; mirar `tipos.json` real o el dato de prueba), con
   nombres distintos entre sí para que «Cargar las plantillas del centro» no las junte. La de
   `TRASLADO`, si ese tipo existe, se queda.
3. Que la tarea del certificado de cada tipo salga ya con esa plantilla y con «Estado de los
   libros». Mirar antes si el dato se pone en el tipo al cargar la plantilla o hay que añadirlo en
   `Campos del asunto` de los dos tipos; si no hay camino en el código, decirlo en la nota de la
   fila, no inventarlo.
4. Pasar `pruebas/` que toquen plantillas del centro, y sumar el caso a `docs/CASOS-DE-PRUEBA.md`
   (anulación y traslado de matrícula viva con certificado).
5. Novedad visible en `js/novedades.js` (fila 248).

## Qué mirar al terminar (para Claude, y Francisco solo si Claude no puede)

- «Cargar las plantillas del centro» trae la plantilla a los dos tipos y no pisa nada.
- En un asunto de ANULACIÓN MATRÍCULA de un alumno de ESO, la tarea del certificado genera el Word con
  «causa baja en este centro» y el estado de los libros.
- Lo mismo en un TRAS. MATR. VIVA.
- [SOLO FRANCISCO] El texto del certificado le parece bien para los dos casos.
