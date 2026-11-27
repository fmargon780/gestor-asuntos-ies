# 694 — Tercera tanda: cinco tipos del personal, pasados al molde nuevo (borrador, 27-nov-2026)

Borrador de Claude (Opus), 27-nov-2026, con los mismos datos de `_GESTOR` que la segunda tanda.
Sin aprobar. Misma forma que las anteriores.

Tanda elegida por tema: los trámites del personal (certificados, ausencias, permisos y prácticas).

## Mirado en el código antes de proponer (27-nov-2026)

- **El recorrido es uno por tipo de documento, también a quién y por dónde se envía**
  (`js/recorrido-tipo.js`, `js/papel-enviado.js`). El de CERTIFICADO aprobado en la primera tanda
  dice «a la familia por iPasen»: en un certificado del personal, la tarea propondría enviarlo a la
  familia. Ver duda 1.
- **«Copiar a otra carpeta» (fila 552) no salta con una tarea de papel.** Solo se dispara al
  marcarse una tarea de registrar del molde de hitos (`js/hitos-guion-marcar.js`,
  `TareaCopiar.alRegistrar`); la tarea de papel del molde nuevo (`js/tarea-papel.js`) no la llama.
  PERMISO y JUSTIFICACION FALTAS PAS la necesitan (copia a la carpeta de Ausencias). Ver duda 2.
- **Hay dos tipos para el certificado de función tutorial:** «Certificado de desempeño de la
  función tutorial» (este grupo, nombre corto FUNCIÓN TUTORIAL, con el dato «Cursos que pide» y una
  plantilla de correo) y «FUNCIÓN TUTORIAL» (grupo D2, alias DESEMPEÑO FUNCIÓN TUTORIAL, con la
  plantilla de Word del certificado). La app ya sabe unir dos tipos (`js/tipos-unir.js`, fila 207):
  suma los campos, mueve plantillas y asuntos abiertos, y no toca el ARCHIVO.

## CERTIFICADO PERSONAL (4 hitos → 1 tarea)

1. Hacer el certificado · Papel: CERTIFICADO · Cómo se hace: elige la plantilla según lo que pide (servicios prestados, asistencia de septiembre, funciones y horario, actividad extraescolar, texto libre…).

(Juntan «Generar», «Poner a la firma», «Registro de salida» y «Enviar»: son los pasos del recorrido.
La explicación del envío decía «certificado de entrega de libros», copiada por error.)

## Certificado de desempeño de la función tutorial (4 hitos → se une con FUNCIÓN TUTORIAL)

Propuesta: unirlo con FUNCIÓN TUTORIAL (que se queda, porque tiene la plantilla del certificado), con
la unión que ya tiene la app. El dato «Cursos que pide» pasa a FUNCIÓN TUTORIAL. Su guía se hace con
la de FUNCIÓN TUTORIAL, en el grupo D2.

## JUSTIFICACION FALTAS PAS (3 hitos → 3 tareas)

1. Recibir la justificación · Papel: JUSTIFICACION
2. Copiar el justificante registrado a la carpeta de Ausencias · nombre: fecha de la ausencia + tipo (Falta, Baja o Alta) + nombre del empleado · datos nuevos: «Fecha de la ausencia» (fecha) y «Tipo de ausencia» (lista: Falta, Baja, Alta).
3. Entregar el original a Jefatura de Estudios Adjunta

(El hito «Registro de entrada» llevaba la explicación de los libros de MATRICULA, copiada por error.)

## PERMISO (2 hitos → 2 tareas)

1. Recibir la solicitud de permiso · Papel: SOLICITUD PERMISOS
2. Copiar la solicitud registrada a la carpeta de Ausencias · nombre: con el nombre del empleado.

(Hay una plantilla de correo «Comunicación de la resolución del permiso» que ningún hito usa.)

## PROY. PRÁCTICAS (4 hitos → 3 tareas)

1. Recibir el proyecto de prácticas · Papel: PROY. PRÁCTICAS
2. Enviarlo por correo al profesor · sin papel, con «Enviar ▾», se marca a mano.
3. Enviárselo a Dirección para que lo sepa · sin papel, con «Enviar ▾», se marca a mano; con eso termina.

## Recorridos que faltan

| Tipo de documento | Propuesta |
|---|---|
| JUSTIFICACION | Nos llega · se registra de entrada |
| SOLICITUD PERMISOS | Nos llega · se registra de entrada |
| PROY. PRÁCTICAS | Nos llega · se registra de entrada |

## Dudas de Claude (las dice Francisco al repasar)

1. ~~El envío de CERTIFICADO~~ Resuelta el 27-nov-2026: el recorrido pasa a «a quien lo pide por correo electrónico», para alumnado y personal; lo que se mande por iPasen se marca con «Marcar enviado» («1»). Cambiado también en la tabla de `694-tanda-1.md`.
2. ~~Copiar a la carpeta de Ausencias~~ Resuelta el 27-nov-2026: tarea pequeña de este tema, antes de aplicar las guías: «Copiar a otra carpeta» salta también en el molde nuevo cuando el papel de la tarea queda registrado («1»).
3. ~~Permiso: comunicar la resolución~~ Resuelta el 27-nov-2026: no se comunica, «al menos, de momento» («2»). No hay tarea; la plantilla no se borra.
4. ~~Prácticas: qué hace Dirección~~ Resuelta el 27-nov-2026: solo tiene que saberlo; la tarea es enviárselo («2»).
5. Función tutorial: unir los dos tipos.
