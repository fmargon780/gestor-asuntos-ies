# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`). Minutos por fila entera: programar, pruebas, publicar y comprobar. La página
«Estado de la cola» de Francisco lee esta tabla desde `main`.

Última puesta al día: 28-sep-2026 09:00

| Nº | Minutos | Motivo |
|---|---|---|
| 203 | 45 | `docs/PAPELERA-SE-VACIA-SOLA.md`: borrado automático a los 90 días con aviso a los 7, fichero nuevo de constancia (`papelera-borrados.json`) y cuidado de que dos ordenadores no se pisen |
| 204 | 70 | `docs/COMPROBACION-AL-ENTRAR.md`: siete comprobaciones distintas, un panel nuevo, marca en la cabecera, «Arreglarlo» que lleva a cada sitio exacto y `localStorage` de lo omitido; la fila más grande de las que quedan |
| 205 | 50 | `docs/RESPONSABLE-UNA-ADMINISTRACION.md`: una Administración como responsable de un hito, en cinco sitios distintos donde hoy sale la lista de responsables (mesa, ficha, guía, biblioteca, «Qué me toca») |
| 206 | 70 | `docs/HITOS-DESDE-EL-ASUNTO.md`: crear/cambiar/borrar hitos desde la mesa de un asunto, con «Colocar después de», la definición de «hito vacío» y la propagación opcional a la guía del tipo |
| 210 | 30 | `docs/HILO-SIN-REPETIR.md`: solo `apps-script/gestor-correos.gs` (fuera de la app JS), tres arreglos contenidos (orden, quitar citas repetidas, adjuntos sin duplicar) |
| 213 | 60 | `docs/BOTON-DE-SOPORTE.md`: botón y ventana nuevos con captura pegada, campo en Ajustes, script de Google nuevo (`apps-script/soporte.gs`) que escribe en Drive y en la cola de GitHub, guía de puesta en marcha y pruebas de los dos lados |
| 214 | 25 | `docs/HA-LLEGADO-A-LA-VISTA.md`: arreglo pequeño en `App.irVista` y `css/inicio.css` (esconder la tabla mientras se ve «Ver todo» y subir la pantalla), más su prueba con una tabla larga |
| 215 | 35 | `docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md`: ajustes en el formulario de Nuevo asunto ya hecho (filtro de tipos por la pastilla, 8 más usados + «Ver todos», botón siempre visible con lo que falta) y poner al día sus pruebas |
| 216 | 35 | `docs/FILTROS-EN-TODAS-LAS-PESTANAS.md`: una función común de filtros para `js/asuntos-lista-pintar.js` y `js/inicio-tabla.js`, cuenta de «Filtros (N)» en `js/vista.js` y una prueba nueva que recorre cuatro pestañas por cinco filtros |
| 217 | 30 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md`: solo `js/correo-enviar.js` (aviso nuevo y un segundo intento con la forma general de la dirección) y sus pruebas en `pruebas/correo-enviar.mjs` |
