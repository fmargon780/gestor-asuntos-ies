# 786 — «Añadir uno ya hecho…» en la tarea de un papel que hacemos

**Título llano:** Añadir a la tarea un papel que ya está hecho fuera de la app
**Para qué:** que en la tarea de un papel «que hacemos nosotros» se pueda añadir un documento que no sale de una plantilla de la app (el que se saca de Séneca, o el que escribe otra persona del centro), sin salir de la tarea.

## Lo que escribió Francisco
No lo pidió. Sale del repaso del tema 694 (`docs/notas-diseno/694-repaso.md`, punto 3), 27-nov-2026:
los informes y el historial del traslado salen de Séneca; el informe de valoración lo escribe el
equipo educativo; muchos certificados se firman en Séneca. Propuesta de Claude, pendiente de su «sí».

## Lo que entendió Claude (pendiente de acordar con Francisco)
- En un asunto de lista de tareas, la tarea de un papel que hacemos nosotros enseña «Generar documento ▾».
  En ese menú, detrás de las plantillas y de «Otra plantilla…», sale **«Añadir uno ya hecho…»**.
- Abre la misma ventana de añadir documento de siempre, con el tipo de la tarea ya puesto. El
  documento queda unido a la tarea, que pasa a «Generado» y sigue su recorrido (firma, registro, envío).
- Si el tipo solo tiene una plantilla, hoy el botón genera con ella directamente: pasa a ser también
  un menú, con esa plantilla la primera.
- Las tareas de un papel que nos llega no cambian (ya dicen «Añadir documento»).

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Cambiar el recorrido de ningún tipo de documento.

## Notas técnicas de Claude
- `js/tarea-papel-pintar.js` › `montarGenerar`: una opción más, que llama a
  `Documentos.abrir(a, { irDirectoAAnadir: true, tipoDocumento: g.papel })` y después a
  `TareaPapel.sincronizar(a, h, g.id)` (como hace ya el botón «Añadir documento» en `enganchar`).
  Con una sola plantilla, quitar el atajo de la línea `if (lista.length === 1)`.
- Pruebas: las de `tarea-papel`. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En la demostración, en un asunto de lista de tareas con una tarea de un papel que hacemos:
  «Generar documento ▾» › «Añadir uno ya hecho…» abre la ventana de añadir con el tipo puesto, y al
  guardar la tarea queda «Generado» con ese documento.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
