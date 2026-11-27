# 694 — Primera tanda: cinco tipos con guía de hitos, pasados al molde nuevo (borrador)

Borrador de Claude, 27-nov-2026, sacado de `guias.json` de la cuenta común (26-nov-2026). Sin
aprobar. Cada hito pasa a ser una tarea; lo que explicaba el hito va a «Cómo se hace»; generar,
firmar, registrar y enviar el mismo papel son **una sola tarea de papel**, que sigue el recorrido
del tipo de documento. «Papel:» es el tipo de documento de la tarea.

## MATRICULA (8 hitos → 8 tareas)

1. Recibir la matrícula · Papel: MATRICULA · Cómo se hace: en un traslado de matrícula viva, durante el curso, tiene que traer el certificado de entrega de libros.
2. Pasar la matrícula a Jefatura para asignar unidad y optativas · se queda «Esperando a Jefatura».
3. Comprobar en Séneca la unidad y las optativas · Cómo se hace: si Jefatura no las ha grabado, grabarlas.
4. Preparar la ficha de entrega de libros · Papel: FICHA ENTREGA LIBROS
5. Comunicar la incorporación al equipo educativo · Papel: COMUNICACION · Cómo se hace: con su plantilla, por correo.
6. Entregar el horario de su unidad
7. Comprobar la foto en Séneca · Cómo se hace: si no la tiene, hacerla y subirla a su ficha.
8. Guardar la matrícula en el expediente

## ANULACIÓN MATRÍCULA (7 hitos → 6 tareas)

1. Recibir la solicitud · Papel: SOLICITUD-RESOLUCIÓN (se registra de entrada)
2. Firma del director, registro de salida y envío · sin papel, se marca a mano · Cómo se hace: es el mismo documento de la tarea 1, ya resuelto. (Acordado con Francisco el 27-nov-2026: la solicitud y la resolución son un solo papel, que se registra de entrada y de salida en dos momentos. Mientras el recorrido no sepa hacerlo, idea 777, la segunda parte va a mano.)
3. Anular la matrícula en Séneca y quitarle la unidad
4. Avisar a Jefatura y a la tutoría del grupo · con el correo «Comunicación baja matrícula»
5. Certificado de entrega de libros · Papel: CERTIFICADO · Solo si: enseñanza ESO · Cómo se hace: se envía por iPasen o por correo. (Junta «Certificado entrega de libros» y «Enviar el certificado».)
6. Guardar el expediente en el archivo histórico

## TRANSPORTE (6 hitos → 5 tareas)

1. Recibir la solicitud · Papel: SOLICITUD
2. Ajuste de planificación a la Delegación · Papel: AJUSTE PLANIFICACIÓN · Cómo se hace: a partir del 1 de octubre; por el correo corporativo del centro. (Junta «Ajuste Planificación» y «Enviar a D.T.».)
3. Recibir la resolución · Papel: RESOLUCION
4. Grabar en Séneca la solicitud con su resultado
5. Hacer el carné de transporte

## ALUMNADO ABSENTISTA (5 hitos → 2 tareas)

1. Revisar y escanear los protocolos
2. Oficio a Servicios Sociales con la relación de alumnado absentista · Papel: OFICIO · Cómo se hace: firma la secretaria con el visto bueno del director; se envía por el correo corporativo. (Junta «Generar Oficio», «Poner a la firma», «Registrar en Séneca» y «Enviar por Correo Centro».)

## TRAS. MATR. VIVA (6 hitos → 5 tareas) · corregido tras repasar el código (27-nov-2026)

1. Informe personal por traslado · Papel: INFORME PERSONAL TRASLADO
2. Historial académico · Papel: HISTORIAL ACADÉMICO
3. Confirmar el traslado en Séneca y quitarle la unidad
4. Avisar a Jefatura
5. Certificado de entrega de libros · Papel: CERTIFICADO · Solo si: enseñanza ESO · Cómo se hace: a la familia, por iPasen o por correo; también va al centro de destino.

Recorrido de INFORME PERSONAL TRASLADO e HISTORIAL ACADÉMICO: lo hacemos · firma Dirección · se registra de salida · se envía al centro de destino por Ventanilla Electrónica. Cómo funciona con lo que ya hay:
- «Poner a la firma» es subirlo a la Ventanilla y pasarlo a la firma del director: la tarea queda esperando a Dirección, con su día.
- Cuando el PDF que devuelve la Ventanilla llega a la carpeta, la app lee su sello de Séneca (también la serie automática, «A») y pregunta de qué documento es; al elegirlo, apunta el registro y cuenta la firma: «Firmado» y «Registrado» se marcan solos y la espera termina (`js/registro-lector.js`, `js/ficha-sellos.js`, `js/tarea-papel.js`).
- La comunicación que genera la Ventanilla entra con «Es un documento nuevo», tipo VENTANILLA ELECTRÓNICA, con el mismo registro.
- Lo que falta (tarea pequeña de este tema): «Ventanilla Electrónica» como vía y «Otro centro u organismo» como destinatario del recorrido (hoy solo hay correo, iPasen, postal, en mano y tablón, y familia, interesado, quien lo pide, tutoría y personas relacionadas), y que por esa vía «Enviado» se marque solo al llegar el registro de salida, porque la Ventanilla envía al firmar. Sin eso, «Marcar enviado» con un clic.
- Desaparece la tarea 6 del primer borrador (el envío a mano).

## Plantillas (mirado en `plantillas.json`, 27-nov-2026)

- Las plantillas de documento y de correo cuelgan del tipo de asunto, no de los hitos: el paso al molde no las toca.
- De estos cinco tipos solo hay una: el correo «Comunicación baja matrícula» (ANULACIÓN, para la tutoría). Va con la tarea 4 de ANULACIÓN, que hoy no la usa.
- Ninguno de los cinco tiene plantilla de Word: los papeles que «hacemos» (oficio, resolución, certificado, comunicación) se generan hoy fuera de la app o con «Otra plantilla…».

## Dudas de Claude (las dice Francisco al repasar)

- ~~ANULACIÓN: el orden de registrar y enviar al director~~ Resuelta el 27-nov-2026 (arriba, tarea 1 y 2).
- ~~ANULACIÓN: el certificado solo en ESO~~ Resuelta el 27-nov-2026: «Solo si» mirará también la enseñanza del alumno, sacada sola de su unidad (Centro de datos), igual que mira la clase del tercero; sin unidad, la tarea sale y se marca «No aplica». Es una tarea pequeña de este tema, antes de aplicar las guías (Francisco: «Sí»).
- ~~ABSENTISTA: quién firma el oficio~~ Resuelta el 27-nov-2026: el tipo OFICIO lleva «Secretaría, con visto bueno de Dirección»; elegir quién firma en cada caso es la idea 778 («Vale»).
- ~~TRAS. MATR. VIVA: el envío por Ventanilla Electrónica~~ Resuelta el 27-nov-2026 (arriba; «Ok. Adelante»).
- Comprobado en el código: el oficio con «Secretaría, con visto bueno de Dirección» pide dos firmas y se marca firmado al llegar el PDF con las dos.
- Por mirar: si el «certificado de entrega de libros» es la ficha de entrega de libros que ya genera la app (fila 501, tipo FICHA ENTREGA LIBROS).
- El recorrido de cada tipo de documento (quién firma, si se registra, cómo se envía) no lo he podido mirar: ese dato no está entre los ficheros compartidos.
