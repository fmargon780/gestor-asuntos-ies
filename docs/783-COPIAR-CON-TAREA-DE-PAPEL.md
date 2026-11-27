# 783 — «Copiar a otra carpeta» también en los asuntos que son una lista de tareas

**Título llano:** Copiar a otra carpeta el papel registrado, también en los asuntos nuevos
**Para qué:** que en los asuntos del molde nuevo (lista de tareas) un papel registrado se siga copiando solo a otra carpeta, como hoy pasa con los permisos y las justificaciones de faltas, que se copian a la carpeta de Ausencias.

## Lo que escribió Francisco
Tema 694 (pasar los tipos al molde nuevo), 27-nov-2026, tercera tanda (`docs/notas-diseno/694-tanda-3.md`, duda 2): PERMISO y JUSTIFICACION FALTAS PAS copian hoy el documento registrado a la carpeta de Ausencias. Decidido: «tarea pequeña de este tema, antes de aplicar las guías: "Copiar a otra carpeta" salta también en el molde nuevo cuando el papel de la tarea queda registrado» («1»).

## Lo que entendió Claude (acordado con Francisco el 27-nov-2026)
- En la guía de un tipo «sin hitos» se puede poner la tarea común «Copiar a otra carpeta», con su carpeta y su nombre de fichero, como en las guías de hitos.
- Copia el documento de la **tarea de papel que tiene justo encima** en la lista. En la guía, la tarea lo dice: «Copia el papel de «<tarea de encima>»». Si encima no hay una tarea de papel, lo dice en ámbar y no copia.
- Salta sola cuando ese papel queda **registrado** (cuando llega su sello, o al marcar «Registrado» a mano). Copia, se marca hecha y dice «Copiado a <carpeta> como «<nombre>».», igual que hoy.
- Lo demás, igual que hoy: sin permiso sobre la carpeta queda pendiente con «Dar permiso»; nunca pisa un fichero («(2)», «(3)»…).

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba (es la misma tarea de la fila 552, en el otro molde).

## Qué NO se hace en esta tarea
- Poner la copia en las guías nuevas de PERMISO y JUSTIFICACION FALTAS PAS: lo hará la herramienta que pasa los tipos al molde nuevo (tema 694).

## Notas técnicas de Claude
- Hoy solo salta en el molde de hitos: `js/hitos-guion-marcar.js` › `TareaCopiar.alRegistrar(a, h, paso, documento)` al marcarse una tarea de registrar. La tarea de papel (`js/tarea-papel.js`) no la llama.
- Llamarla cuando una tarea de papel pasa a tener el paso `registrado` hecho (por el sello, en `sincronizar`/`ponerHechas`, o con `marcarAMano`), con el documento de esa tarea (`papelDoc.numero`/`nombre`), solo para la tarea `copiar` que la sigue en el guion. Sin envolver: un punto de enganche en `tarea-papel.js`.
- `documentoRegistrado` de `js/tarea-copiar.js` (para «Dar permiso») tiene que encontrar también el papel registrado de la tarea de encima.
- Comprobar que el editor de la guía «sin hitos» deja elegir la tarea común `copiar` (`js/anadir-tarea.js` la deja fuera de «+ Añadir tarea» a propósito: solo se crea en la lista común) y que enseña su receta y el aviso de la tarea de encima.
- Mira `SoloConsulta.activo()` antes de escribir, como hoy.
- Pruebas: las de `tarea-copiar` y `tarea-papel`, con un asunto «sin hitos» de PERMISO de la demostración.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En la demostración, en la guía de un tipo «sin hitos», se puede poner «Copiar a otra carpeta» detrás de una tarea de papel, y dice qué papel copia.
- En un asunto de ese tipo, al registrar el papel, el documento aparece copiado en la carpeta y la tarea queda hecha con su línea.
- Sin permiso sobre la carpeta, la tarea queda pendiente con «Dar permiso», y al darlo se copia.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
