# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 29-sep-2026 07:52 (fila 219, revisada y fusionada; SIN PUBLICACIÓN COMPROBADA)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por `pruebas` y el
revisor: los minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 226 | 90 | `docs/COLA-POR-DEBAJO-DE-40-KB.md`: sacar de la tabla lo HECHA/DESCARTADA/SUSTITUIDA (salvo lo de hoy/ayer) a `docs/HISTORIA.md`, resumir las notas largas de abajo, y dejar la norma de mantenerla por debajo de 40 KB; solo documentación, sin publicar |
| 203 | 55 | `docs/PAPELERA-SE-VACIA-SOLA.md`: borrado automático a los 90 días con aviso a los 7, fichero nuevo de constancia (`papelera-borrados.json`) y cuidado de que dos ordenadores no se pisen |
| 213 | 70 | `docs/BOTON-DE-SOPORTE.md`: botón y ventana nuevos con captura pegada, campo en Ajustes, script de Google nuevo (`apps-script/soporte.gs`) que escribe en Drive y en la cola de GitHub, guía de puesta en marcha y pruebas de los dos lados |
| 204 | 80 | `docs/COMPROBACION-AL-ENTRAR.md`: siete comprobaciones distintas, un panel nuevo, marca en la cabecera, «Arreglarlo» que lleva a cada sitio exacto y `localStorage` de lo omitido; la fila más grande de las que quedan |
| 217 | 35 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 230 | 45 | `docs/SALIR-DE-ELEGIR-ASUNTO.md`: `js/elegir-asunto.js` (✕, pie fijo, opción de crear), encontrar por qué Escape no cierra (`js/usabilidad.js` y lo que se adelanta), dos llamadas (`js/documentos-sueltos.js`, `js/bandeja-enlace.js`) y una prueba Playwright nueva |
