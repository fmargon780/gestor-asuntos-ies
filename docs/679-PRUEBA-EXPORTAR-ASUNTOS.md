# 679 — Que la prueba `exportar-asuntos` no dependa del día

## Lo que escribió Francisco
Nada: es un tropiezo de Claude Code (de la fila 678). Francisco dijo que sí a dejarla lista el 17-nov-2026.

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- La prueba `exportar-asuntos` falla a veces también en `main` («con Desde y Hasta solo salen los asuntos iniciados entre esos días»: sale 19 y debía 9; 1 de 3 pasadas). Depende de las fechas de la copia de pruebas.
- Se arregla la prueba para que dé lo mismo el día en que se pase. No cambia nada de la app.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Tocar la app. Si el fallo resulta ser de la app, la fila queda BLOQUEADA con «ATASCO PARA CLAUDE».

## Notas técnicas de Claude
- `pruebas/exportar-asuntos.mjs` y las fechas de `js/demo/`. Solo prueba: no se publica.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Nada: no cambia lo que se ve.

## Revisión y respuestas durante el trabajo
- (18-nov-2026, Claude Code) Ya arreglada por la fila 696 (la prueba espera al número esperado de filas). Comprobado: 4 pasadas seguidas sin fallo. Fila DESCARTADA como duplicada; no se toca nada.
