# 551 — Aplicar el plan de las guías

## Lo que escribió Francisco

Tema 550 (6-nov-2026), parte que viene de la idea 545, tal cual:

> Pasar las guías a las listas comunes según el plan de la fila 544 (tema 540): botón de aplicar en el instituto, con copia antes, y quitar las tareas libres, «+ Traer un hito de otro tipo», la caja «Nueva tarea…» y la pantalla «Tipos y su uso». Al diseñarla, resolver: las tareas con igual nombre y distinta explicación, normativa o configuración, para no perder ninguna; añadir tareas dentro de las preguntas; el botón de cargar la biblioteca del centro, que mete tareas fuera de las listas; y la guía de un tipo que se active después.

En el diseño, el 6-nov-2026: «Adelante según tus propuestas».

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

Si algo cambia el texto de arriba, manda esto.

1. **Botón «Aplicar el plan de las guías»** en Herramientas. Antes de aplicar enseña qué va a
   cambiar (lo que se une, lo que se quita, lo que no encuentra), sin cambiar nada. Al pulsar
   «Aplicar» pide confirmación, guarda una copia de las guías y aplica el plan de
   `docs/544-PLAN-GUIAS.md`, tal cual. Se pulsa en el instituto (fila de Francisco, abajo).
2. **Lo que el plan no encuentra** (porque la guía cambió después) se salta y se dice; no se
   inventa nada.
3. **Igual nombre, distinta explicación o normativa:** se unen y la tarea común queda con todas las
   explicaciones y normativas juntas. No se pierde ninguna.
4. **Igual nombre, distinta plantilla:** no se unen. En la lista salen como tareas distintas, cada
   una con su plantilla al lado (por ejemplo, «Enviar el documento al solicitante por la vía
   acordada», una por plantilla).
5. **Las tareas de dentro de las preguntas** (cada camino) pasan también a las listas, con las
   mismas reglas.
6. **Un tipo que se active después:** al activarlo, su guía pasa a las listas con las mismas reglas
   (lo igual se une con lo que ya está; lo nuevo entra nuevo), y se avisa de cuántas tareas ya
   estaban y cuántas entran.
7. **Desaparece al aplicar el plan:** escribir tareas e hitos libres en la guía (solo se añaden de
   la lista); «+ Traer un hito de otro tipo»; la caja «Nueva tarea…» del asunto (queda
   «+ Añadir tarea»); y en Herramientas, «Tipos y su uso», «Pasar las guías a las listas comunes»,
   «Cargar la biblioteca del centro» y el propio «Aplicar el plan de las guías».

## Pantalla de prueba

- Sin pantalla: lo que cambia ya se decidió en la fila 544 (`docs/544-PLAN-GUIAS.md`) y en la idea
  538, y lo que desaparece está en el punto 7. Acordado con Francisco el 6-nov-2026.

## Qué NO se hace en esta tarea

- La tarea «Copiar a otra carpeta» (fila 552). Hasta entonces, «Copiar el documento registrado a
  la carpeta Ausencias» queda en la lista como «Otra cosa».
- Cambiar nada de lo que el plan no nombra.

## Notas técnicas de Claude

- El plan se pasa a un fichero de datos que viaja con la app (como
  `datos-biblioteca/biblioteca-centro.json`): por cada guía, qué hitos y tareas se renombran, se
  unen o se quitan, con los nombres exactos de `docs/544-PLAN-GUIAS.md`. Se busca por nombre exacto
  (sin distinguir mayúsculas ni espacios dobles); lo que no aparece va a «No encontrado».
- Aplicar escribe las dos listas comunes y las guías por `ColaGuardado`, con la copia de
  `Copias.guardar` antes (fila 531, decisión 9). La guía guarda `comun` más el retrato, como ya
  hace la 531. Los asuntos abiertos no cambian (`origenGuia`, `js/hitos-sincronizar.js`).
- Se apunta en `_GESTOR` que el plan está aplicado; con esa marca desaparece lo del punto 7.
  Sin la marca, todo sigue como hoy.
- Explicaciones juntas: una debajo de otra, sin repetir las iguales. Normativas: si el campo
  admite una sola, las demás citas van al final de la explicación.
- Las preguntas: lo que hoy deja fuera `Comunes.propuesta` (decisión 10 de la 531) entra ahora.
- Quitar `js/tipos-y-su-uso*.js`, `js/comunes-propuesta.js` y `js/cargar-biblioteca.js` (con su
  bloque y sus pruebas) una vez aplicado el plan; si quitar el código entero rompe algo, basta con
  no enseñarlos.
- La demostración no trae las guías reales: añadir a sus datos dos o tres guías con nombres del
  plan para que se pueda aplicar con la demo.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Herramientas enseña «Aplicar el plan de las guías» con lo que se une, lo que se quita y lo que no
  encuentra, sin cambiar nada al abrirlo.
- «Aplicar» pide confirmación; al confirmar, las guías de la demo quedan como dice el plan y las
  listas comunes se llenan.
- Dos tareas con igual nombre y distinta explicación quedan en una, con las dos explicaciones.
- Dos tareas con igual nombre y distinta plantilla quedan separadas, cada una con su plantilla.
- Una tarea dentro de una pregunta pasa a la lista.
- Un asunto abierto antes de aplicar no cambia.
- Después de aplicar no están: añadir hito o tarea en blanco en la guía, «+ Traer un hito de otro
  tipo», la caja «Nueva tarea…», «Tipos y su uso», «Pasar las guías…», «Cargar la biblioteca del
  centro» ni «Aplicar el plan».
- Activar un tipo desactivado pasa su guía a las listas y lo avisa.
- [SOLO FRANCISCO] Pulsar «Aplicar el plan de las guías» en el instituto, con las guías reales, y
  mirar lo que dice «No encontrado».

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
