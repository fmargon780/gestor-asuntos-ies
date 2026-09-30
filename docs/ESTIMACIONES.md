# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 30-sep-2026 04:33 (fila 213 HECHA)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 231 | 45 | `docs/CREAR-ASUNTO-DESDE-POR-CLASIFICAR.md`: reproducir con varios documentos sueltos, encontrar por qué «Nuevo asunto» sale sin buscador ni parrilla, arreglarlo en `js/documentos-sueltos.js` o `App.prepararNuevo`, y ampliar la prueba de la fila 220 |
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
