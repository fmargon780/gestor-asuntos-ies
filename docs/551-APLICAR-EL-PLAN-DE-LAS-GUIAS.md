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
- Segundo revisor: **a) Pantalla de Herramientas** — coincide: «Aplicar el plan de las guías» enseña «Se quita» (6 hitos), «Se une», «Pasa a las listas comunes», «Quedan separadas», «No encontrado» (NEAE, Elecciones y Situación familiar no existen en la demo y se dicen) y «Se salta» (el tipo desactivado), con el aviso «todavía no se ha cambiado nada»; al abrirlo no cambió nada.
- Segundo revisor: **b) Confirmar/cancelar y plan** — coincide: cancelar deja las guías idénticas y las listas vacías; al confirmar, CAMBIO DE GRUPO queda con 3 hitos (sin Valorar, Resolver, Archivar), CONVALIDACIÓN CURSO con 4 (sin Informe ni Archivar; «Pasar la solicitud al departamento…» al final de «Recoger la solicitud»), CERTIFICADO DEL PLAN con «Registro de entrada», «Preparar el certificado», «Poner a la firma» (responsable Dirección), «Enviar el certificado» (con «Enviar el documento al solicitante por la vía acordada» como comunicar) y sin Archivar. Listas: 58 tareas y 46 hitos. Sin errores de consola.
- Segundo revisor: **c) Igual nombre, distinta explicación** — coincide: «Registrar de entrada el documento» queda en una tarea común con las 4 explicaciones una debajo de otra; «Si se remite» pasa a la explicación de «Registrar de salida el documento». No había normativas en la demo: no lo he podido ver.
- Segundo revisor: **d) Igual nombre, distinta plantilla** — coincide: «Enviar correo de aviso» queda en dos tareas y la ventana «+ Añadir tarea» enseña al lado «Plantilla «Acuse de recibo del parte»» y «Plantilla «Envío del certificado de notas»» (hube de cambiar en memoria los ids inventados de la demo por plantillas reales, porque con los ids inventados no se ve nombre). Matiz: las dos «Enviar el documento al solicitante por la vía acordada» (una sin acción, otra «comunicar», sin plantilla) quedan separadas pero en la ventana se ven idénticas.
- Segundo revisor: **e) Tarea dentro de una pregunta** — coincide: «Registrar de entrada el documento» dentro de «Falta algo» queda enlazada a la tarea común (misma id). «Qué falta» (la pregunta) no pasa a la lista, como dice el texto.
- Segundo revisor: **f) Asuntos abiertos** — coincide con un matiz: los 34 asuntos abiertos conservan los mismos hitos y los mismos textos, explicaciones y estados. Dos cambios internos: las tareas llevan ahora una marca `comun` (14 asuntos), y en 3 asuntos «CERTIFICADO DE NOTAS» la tarea «Registrar la salida en Séneca» cambia de id y pasa a figurar como `propio:true` (la guía la renombró al nombre único); conserva texto y «hecho». No se ve cambio para la usuaria.
- Segundo revisor: **g) Lo que desaparece** — coincide: tras aplicar, el editor de guía solo ofrece «+ Añadir un hito de la lista» y «+ Añadir una tarea de la lista» (sin los de en blanco, sin «+ Traer un hito de otro tipo»); la ficha conserva «+ Añadir tarea» y «+ Añadir hito» y ya no tiene la caja «Nueva tarea…» (antes sí); «Tipos y su uso» y «Aplicar el plan» desaparecen de Herramientas. «Pasar las guías…» y «Cargar la biblioteca del centro» solo están ocultos (display none) y ya lo estaban antes de aplicar en la demo, así que no he podido ver que los quite el plan. No he comprobado los botones en blanco dentro de las opciones de una pregunta.
- Segundo revisor: **h) Activar un tipo desactivado** — coincide: «Alta y actualización de datos» se activa, pierde «Archivar», sus tareas/hitos pasan a las listas y avisa «…1 tarea ya estaba en la lista y 1 entra nueva; 0 hitos ya estaban y 2 entran nuevos.» Al repetirlo avisa «2 tareas ya estaban… 0 entran nuevas».
- Segundo revisor: **i) Otras cosas** — Una administrativa verá en cada guía la explicación unida de varias guías ajenas («Solo si llega en papel», «El que falte»…) en «Registrar de entrada el documento»; es lo pedido, pero puede confundir. El aviso final dice «20 guías cambiadas» aunque entre ellas hay guías que el plan no nombra (reciben los enlaces comunes y la regla de «Archivar»). No he comprobado que exista la copia que dice «en la carpeta de ajustes».
- Segundo revisor: **j) [SOLO FRANCISCO]** — no lo he podido ver: pulsar el botón en el instituto con las guías reales y leer «No encontrado».
- Segundo revisor: **Veredicto:** APRUEBO, sin nada que corregir de forma obligatoria (sugerencias: distinguir en la ventana las tareas homónimas sin plantilla; revisar que el texto de las explicaciones unidas no confunda). Lo que hace la app y el texto no pide: marca `comun` en tareas de asuntos abiertos y vuelve `propio` una tarea de 3 asuntos de CERTIFICADO DE NOTAS; salta y avisa de los tipos desactivados; el aviso de la guía activada cuenta tareas e hitos aparte; enlaza al plan a las guías no nombradas (reglas de unión/«Archivar» en todas las activas, según el apartado «Tareas e hitos que se unen»).
- Decisiones de la sesión de programación (6-nov-2026), lo que la instrucción no cubría:
  1. **El plan es un dato** (`datos-biblioteca/plan-guias.json`). Un nombre que acaba en «…» casa con todo lo que empieza así (así entran «…con su fecha», «…si se remite»); la condición pasa a la explicación de la tarea.
  2. **Una tarea es la misma** si coinciden nombre, lo que hace y toda su configuración (no solo la plantilla); si no, quedan separadas con el mismo nombre. Un hito es el mismo si coinciden nombre y tareas. Para poder cambiar una de dos tareas homónimas, «Cambiar» solo avisa de repetida si es igual en todo (`Comunes.existeIgual`).
  3. **Un hito con una pregunta dentro de sus tareas** no entra en la lista de hitos (no cabe); sus tareas sí pasan.
  4. **Lo viejo se oculta, no se borra el código** (la nota técnica lo permitía): clase `plan-guias-aplicado` en `<html>` con la marca `_GESTOR/plan-guias-aplicado.json`. «+ Añadir un hito a esta opción» (dentro de una pregunta) se queda, porque la instrucción no lo nombra.
  5. **Asuntos abiertos:** antes de escribir la guía, las tareas que cambian de texto/explicación o se quitan se les quedan como suyas (`ComunesGuardado.fijarEnAbiertos`). Las tareas nuevas (movidas o añadidas por el plan) llegan como llegan siempre las de la guía; la explicación unida de un hito se ve en vivo.
  6. «Desgcargar el pdf registrado en Ausencias» (era un hito) se queda como hito con el nombre «Copiar el documento registrado a la carpeta Ausencias». «Registrar el recibí» lleva la explicación «Cuando llegue.». «Enviar el documento al solicitante…» se pone en todo hito «Enviar el certificado» (si ya la había, pasa a comunicar).
  7. Los tipos desactivados se saltan al aplicar; al activarlos pasa toda su guía con el plan.
  8. Las pruebas `ajustes-cuatro-pestanas` y `tipos-y-su-uso` se adaptaron (un bloque más en Herramientas; la demo trae un tipo desactivado). Fallan igual en `main` limpio, sin relación: `cambiar-tipo-y-guia`, `editor-de-la-guia-tareas`, `hacer-este-hito`, `nuevo-asunto-categoria-guia`.
  9. Sugerencia del revisor, sin hacer (no la pide el texto): distinguir en la ventana dos tareas homónimas sin plantilla.
