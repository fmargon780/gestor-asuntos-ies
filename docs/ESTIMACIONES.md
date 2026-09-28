# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 28-sep-2026 (fila 222, HECHA)

| Nº | Minutos | Motivo |
|---|---|---|
| 214 | 20 | `docs/HA-LLEGADO-SUSTITUYE-LA-VISTA.md`: una clase en `#pantalla-abiertos` que esconde la tabla al entrar en «clasificar», guardar y devolver el desplazamiento en `App.irVista`, texto del botón de volver y una prueba nueva |
| 203 | 45 | `docs/PAPELERA-SE-VACIA-SOLA.md`: borrado automático a los 90 días con aviso a los 7, fichero nuevo de constancia (`papelera-borrados.json`) y cuidado de que dos ordenadores no se pisen |
| 213 | 60 | `docs/BOTON-DE-SOPORTE.md`: botón y ventana nuevos con captura pegada, campo en Ajustes, script de Google nuevo (`apps-script/soporte.gs`) que escribe en Drive y en la cola de GitHub, guía de puesta en marcha y pruebas de los dos lados |
| 204 | 70 | `docs/COMPROBACION-AL-ENTRAR.md`: siete comprobaciones distintas, un panel nuevo, marca en la cabecera, «Arreglarlo» que lleva a cada sitio exacto y `localStorage` de lo omitido; la fila más grande de las que quedan |
| 217 | 30 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 223 | 40 | `docs/REVISOR-ANTES-DE-PUBLICAR.md`: solo documentos y `.claude/settings.json`; guion del revisor nuevo y cambios quirúrgicos en `CLAUDE.md`, reglas de la cola, reparto, contexto corto y ahorro |
