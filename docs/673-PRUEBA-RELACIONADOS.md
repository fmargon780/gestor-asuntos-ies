# 673 — Arreglar la prueba `relacionados`

## Lo que escribió Francisco
Nada: es un tropiezo de Claude Code (de la fila 671). Francisco dijo que sí a dejarla lista el 17-nov-2026.

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- La prueba `relacionados.mjs` falla también en `main` sin ningún cambio: la lista no vuelve a su sitio (sale 251, debía 214; «la fila de arriba vuelve al subir del todo»).
- Averiguar si falla la prueba o la app. Si es la prueba, se arregla la prueba. Si es la app (la lista no vuelve a la altura que tenía, que es lo que ya estaba previsto), se arregla para que haga lo previsto.
- No cambia nada más de lo que ve la usuaria.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Si arreglarlo pide cambiar lo que ve o hace la usuaria más allá de lo previsto, no se programa: la fila queda BLOQUEADA con la pregunta.

## Notas técnicas de Claude
- `pruebas/relacionados.mjs`; la altura de las listas, `Navegacion.ponerAltura`/`guardarAltura` (fila 256, `js/inicio.js`). Que espere a una condición, no a una pausa fija.
- Solo si se toca la app: línea en `js/novedades.js` y una publicación.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Nada: no cambia lo que se ve.

## Revisión y respuestas durante el trabajo
- (18-nov-2026, Claude Code) Tarea pequeña, comparada con la instrucción: coincide. Era la prueba (el cuadro de cerrar seguía tapando «Crear»); no se toca la app. 6 pasadas seguidas sin segundo intento.
