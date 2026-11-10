# 584 — Repasar las pruebas que fallan

## Lo que escribió Francisco
Tema: Repasar las pruebas que fallan. Junta la idea 568: repasar por familias los unos 50 fallos que quedan en la pasada completa de `npm test` (desfasadas, fallos reales de la app o del entorno) y decidir si los ficheros `pruebas/_rev_*.mjs` salen de la pasada. No cambia nada de lo que se ve en la app, pero hace fiable la comprobación de todas las tareas.

## Lo que entendió Claude (acordado con Francisco el 10-nov-2026)
- En la app no cambia nada de lo que se ve ni de lo que hace la usuaria.
- Se miran una a una las 20 pruebas que fallan hoy en la pasada completa y las 9 apartadas (`RETIRADAS`).
- Una prueba desfasada (la app cambió y la prueba no) se pone al día con cómo es hoy la app.
- Si una prueba destapa un fallo real de la app, no se arregla aquí: se apunta como IDEA nueva en la cola y la prueba queda apartada con el número de esa idea en el motivo.
- Los ficheros `pruebas/_rev_*.mjs` (restos de un revisor, no son pruebas) se borran.
- Al terminar, la pasada completa sale en verde: todas pasan o están apartadas por un fallo real con su idea en la cola.
- Desde esta fila, ninguna tarea se cierra con pruebas en rojo «porque ya fallaban antes»: una prueba que falla también en `main` abre la fila «Arreglar la prueba <nombre>…» delante de las demás (lo que ya dice `docs/METODO-COMUN.md` 5.1). Solo se aparta una prueba que destapa un fallo real de la app con su IDEA en la cola.

## Pantalla de prueba
- Sin pantalla: no cambia nada de lo que se ve.

## Qué NO se hace en esta tarea
- Arreglar los fallos reales de la app que salgan: cada uno va a la cola como IDEA.
- `cambiar-tipo-y-guia`: su fallo real ya está en la idea 569 (tema 502); solo se pone ese número en su motivo.
- Ningún cambio en `js/`, `index.html` ni `css/`.

## Notas técnicas de Claude
- Pasada completa en `main` del 10-nov-2026 (commit 3b282a7, sesión con 2 núcleos, 44 min): 370 pruebas, 345 bien, 25 fallos. Los unos 50 de la fila 563 eran en su mayoría de carga: pasan en el segundo intento.
- Las 20 que fallan también a solas, por familias (orientativo: se confirma cada una mirándola):
  - Buscan una carpeta de prueba que ya no existe (`page.evaluate: NotFoundError`, como `nuevo-asunto-categoria-guia` en la fila 563): `crear-asunto-desde-por-clasificar`, `crear-asunto-desde-todos-los-sitios`, `nuevo-asunto-persona-primero`, `persona-en-otra-lista`, `tercero-con-buscador-al-cambiar`, `tipo-en-linea-al-cambiar`. Seguramente un solo arreglo común.
  - Esperan la versión vieja del script de correo («versión de la fila 480»; hoy es la de la fila 555): `bandeja-latido`, `guardar-y-enviar-sin-sorpresas`.
  - Esperan en pantalla algo que ya no está igual (tiempo agotado esperando un elemento; filas recientes como la 553, 555, 571 o 573): `arreglos-del-hito-demo`, `campo-desde-el-asunto`, `convertir-en-plantilla-pdf-pantalla`, `donde-se-guarda`, `etiquetas`, `generar-para-relacionados`, `personas-del-grupo`, `plantillas-pantalla`.
  - Pueden ser fallos reales: `contadores-de-inicio` (las marcas y la suma de Inicio no cuadran) y `notas-de-directivos` («Vista» con un documento sin guardar no avisa; archivar con notas sin ver no pregunta).
  - Tiempos (repintado cada pocos segundos), fallan también a solas: `tablon-no-se-borra` y `refresco` (está en `EN_SOLITARIO`). Que esperen a una condición, no a una pausa fija.
- Las 9 de `RETIRADAS`: `ha-llegado-sustituye-la-vista`, `tutores-legales` (fallo real, sin idea en la cola: crearla), `hacer-este-hito`, `cambiar-tipo-y-guia` (idea 569), `tras-cada-accion`, `conflictos-que-cambia`, `actividades-aviso`, `campos`, `opciones`. Cada una vuelve a la pasada o se queda con su idea.
- Para decidir si es desfasada o real: mirar en `docs/HISTORIA.md` y en el documento de la fila que cambió esa parte qué se decidió. Si la app hace lo que decidió Francisco, la prueba está desfasada; si no, es fallo real.
- `pruebas/ejecutar.mjs`: la comprobación de la lista exige que el motivo de cada entrada de `RETIRADAS` nombre su idea («idea N»); sin ella, el ejecutor no arranca. `EN_SOLITARIO` no cambia salvo que `refresco` salga de ella al arreglarla.
- `CLAUDE.md`, apartado «Pruebas», punto 2, tercera viñeta: sustituir «Si falla igual en `main` sin tu cambio, va a `RETIRADAS`…» por lo acordado arriba (fila «Arreglar la prueba…» según `docs/METODO-COMUN.md` 5.1; a `RETIRADAS` solo con un fallo real y el número de su IDEA). Lo mismo en el texto copiado de `docs/PRUEBAS-RETIRADAS.md`, cuya tabla se pone al día.
- Apuntar la duración de esta pasada como pasada larga (`docs/METODO-COMUN.md` 5.1).
- No se toca la app: sin versión nueva, sin línea en `js/novedades.js`, sin publicación. HECHA con el commit en `main`.

## Cómo lo comprueba el segundo revisor
- `npm test` (pasada completa) termina con «Todas las pruebas pasan».
- No queda ningún `pruebas/_rev_*.mjs`.
- Cada una de las 29 pruebas de las notas técnicas: o pasa, o está en `RETIRADAS` con un motivo que nombra una IDEA que existe en `docs/COLA.md`.
- Para cada prueba puesta al día, lo que comprueba sigue siendo lo que decidió Francisco en su fila (no se ha quitado una comprobación para que pase).
- `CLAUDE.md` ya no permite apartar una prueba solo porque «falla igual en `main`».
- `git diff main --stat` no toca nada fuera de `pruebas/`, `docs/` y `CLAUDE.md`.

## Qué mirar al terminar
- En la nota de la fila 584: que la pasada completa terminó en verde y cuánto tardó.
- Las ideas nuevas que hayan salido por fallos reales, una línea cada una.

## Revisión y respuestas durante el trabajo
- Segundo revisor (10-nov-2026, sin ejecutar nada; la pasada la hizo la sesión):
  - Coincide: no se toca nada fuera de `pruebas/`, `docs/` y `CLAUDE.md`; no queda ningún `_rev_*.mjs`; `CLAUDE.md` ya no permite apartar una prueba solo porque «falla igual en main»; el ejecutor exige «idea N» en cada motivo de `RETIRADAS`.
  - Coincide: las 29 pruebas están puestas al día sin debilitarlas, o apartadas con su idea (593 etiquetas y plantillas desde otra pantalla; 594 control de registro; 595 notas de directivos; 569 cambiar de tipo; 596 menú bajo la barra lateral, citada en `donde-se-guarda`).
  - Pérdidas de cobertura aceptadas en `campo-desde-el-asunto` (la fila 530 quitó el panel de Ajustes): «Deshacer», el valor pedido en la ventana, crear un campo propio desde el panel y la maquetación a 1280 y 600 px. `opciones.mjs` se borra porque la fila 576 quitó los hitos-pregunta.
  - Matiz: `hito-mesa` pulsa «Cambiar la fecha» sin exigir el menú quieto; `donde-se-guarda` pulsa la parte visible del menú (idea 596).
  - No lo ha podido ver: si `tras-cada-accion`, `conflictos-que-cambia` y `actividades-aviso` pasan (lo confirma la pasada completa).
