# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 29-sep-2026 22:10 (fila 203 HECHA)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 231 | 45 | `docs/CREAR-ASUNTO-DESDE-POR-CLASIFICAR.md`: reproducir con varios documentos sueltos, encontrar por qué «Nuevo asunto» sale sin buscador ni parrilla, arreglarlo en `js/documentos-sueltos.js` o `App.prepararNuevo`, y ampliar la prueba de la fila 220 |
| 226 | 90 | `docs/COLA-POR-DEBAJO-DE-40-KB.md`: sacar de la tabla lo HECHA/DESCARTADA/SUSTITUIDA (salvo lo de hoy/ayer) a `docs/HISTORIA.md`, resumir las notas largas de abajo, y dejar la norma de mantenerla por debajo de 40 KB; solo documentación, sin publicar |
| 213 | 70 | `docs/BOTON-DE-SOPORTE.md`: botón y ventana nuevos con captura pegada, campo en Ajustes, script de Google nuevo (`apps-script/soporte.gs`) que escribe en Drive y en la cola de GitHub, guía de puesta en marcha y pruebas de los dos lados |
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
