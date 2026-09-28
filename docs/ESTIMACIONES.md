# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 28-sep-2026 (fila 206, HECHA)

| Nº | Minutos | Motivo |
|---|---|---|
| 203 | 45 | `docs/PAPELERA-SE-VACIA-SOLA.md`: borrado automático a los 90 días con aviso a los 7, fichero nuevo de constancia (`papelera-borrados.json`) y cuidado de que dos ordenadores no se pisen |
| 210 | 30 | `docs/HILO-SIN-REPETIR.md`: solo `apps-script/gestor-correos.gs` (fuera de la app JS), tres arreglos contenidos (orden, quitar citas repetidas, adjuntos sin duplicar) |
| 213 | 60 | `docs/BOTON-DE-SOPORTE.md`: botón y ventana nuevos con captura pegada, campo en Ajustes, script de Google nuevo (`apps-script/soporte.gs`) que escribe en Drive y en la cola de GitHub, guía de puesta en marcha y pruebas de los dos lados |
| 204 | 70 | `docs/COMPROBACION-AL-ENTRAR.md`: siete comprobaciones distintas, un panel nuevo, marca en la cabecera, «Arreglarlo» que lleva a cada sitio exacto y `localStorage` de lo omitido; la fila más grande de las que quedan |
| 216 | 35 | `docs/FILTROS-EN-TODAS-LAS-PESTANAS.md`: una función común de filtros para `js/asuntos-lista-pintar.js` y `js/inicio-tabla.js`, cuenta de «Filtros (N)» en `js/vista.js` y una prueba nueva que recorre cuatro pestañas por cinco filtros |
| 217 | 30 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
| 221 | 20 | `docs/TUTORIAS-TEXTO-DEL-MARGEN.md`: causa ya localizada; cambio de pocas líneas en `js/tablas-datos-leer.js` y un caso nuevo en `pruebas/tablas-datos.mjs` |
