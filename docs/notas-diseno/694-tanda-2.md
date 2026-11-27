# 694 — Segunda tanda: cinco tipos con guía de hitos, pasados al molde nuevo (borrador, 27-nov-2026)

Borrador de Claude (Opus), 27-nov-2026. Datos leídos ese día de `_GESTOR` de la cuenta común:
`guias.json` y `tipos.json` (26-nov-2026), `campos.json`, `tipos-documento.json`,
`recorridos-tipos.json` y `plantillas.json`. Sin aprobar. Misma forma que la primera tanda
(`694-tanda-1.md`): cada hito pasa a ser una tarea; lo que explicaba, a «Cómo se hace»; «Papel:» es
el tipo de documento de la tarea, que sigue su recorrido.

Tanda elegida por tema: la entrada del alumnado y su identificación (admisión, documentos de
identidad, iPasen del tutor y el expediente que llega de otro centro).

## ADMISION (4 hitos → 3 tareas)

Hoy: «Tramitar · Esperar respuesta» (el relleno de siempre) más «Requerimiento Subsanación» y
«Notificación matrícula» (con plazo de 2 días hábiles). Ningún hito tiene explicación ni dato.

1. Recibir la solicitud de admisión · Papel: SOLICITUD (recorrido aprobado: nos llega, se registra de entrada)
2. Requerir que subsane · Papel: REQUERIMIENTO · Solo si: «¿Hay que subsanar?» = Sí (dato nuevo de lista, Sí / No) · al enviarlo, queda «Esperando a la familia».
3. Avisar a la familia de que ha sido admitido y tiene que formalizar la matrícula · plazo: 2 días hábiles · sin papel, se marca a mano · Cómo se hace: con «Enviar ▾», por correo o iPasen. (Francisco, 27-nov-2026: «1».)

## IDENTIFICACION ALUMNO (2 hitos → 2 tareas)

1. Guardar el documento de identidad · Papel: DNI · Cómo se hace: si es pasaporte o NIE, se guarda igual.
2. Anotar el documento en Séneca

(El hito «Anotar en Séneca» estaba puesto como «espera al tercero»; es trabajo nuestro: pasa a tarea normal.)

## IDENTIFICACION TUTOR LEGAL (3 hitos → 2 tareas)

Las mismas dos tareas que IDENTIFICACION ALUMNO. Se quita el hito «Registro de entrada»: su
explicación («En caso de traslado de matrícula viva… certificado de entrega de libros») es la de
MATRICULA, copiada aquí por error.

## IPASEN TUTOR LEGAL (3 hitos → misma guía que IPASEN ALUMNADO)

IPASEN ALUMNADO ya está en el molde nuevo (grupo A) y ya contempla que lo pida un tutor legal
(dato «¿Quién hace la solicitud?»). Propuesta: IPASEN TUTOR LEGAL copia su guía y el dato «Cómo
llega la petición», sin el dato «¿Quién hace la solicitud?» (aquí siempre es el propio tutor):

1. Comprobar la identidad en persona · Solo si: «Cómo llega la petición» = En persona
2. Comprobar que el destino consta en Séneca · Solo si: Teléfono, Correo electrónico o iPasen / Séneca
3. Guardar aquí la credencial generada en Séneca · Papel: CREDENCIAL IPASEN
4. Entregar o enviar la credencial

## TRASLADO DE EXPEDIENTE ACADÉMICO SOLICITADO AL CENTRO DE ORIGEN (8 hitos → 6 tareas)

Hoy: dato «¿El Expediente Académico del Alumno está en Séneca?» (Sí / No) y ocho hitos, cinco con
«Solo si». Es el alumno que **llega** de otro centro (alias TRASLADO).

1. Pedir al centro de origen el informe personal y el historial · Papel: OFICIO (plantilla «Petición del historial al centro de procedencia», ya colgada) · Solo si: expediente en Séneca = No · al enviarlo, queda «Esperando al centro de origen».
2. Recibir la documentación del centro de origen · Papel: EXPEDIENTE DE TRASLADO (tipo nuevo) · Solo si: No · Cómo se hace: llega por correo postal o por la Bandeja del registro de entrada (el otro centro lo manda por la Ventanilla Electrónica); trae el informe personal y el historial.
3. Anotar en Séneca las asignaturas pendientes · Cómo se hace: si las tiene, anotarlas como pendientes en su matrícula. (Junta «Revisar si tiene asignaturas pendientes» y «Añadir a la matrícula materias pendientes».) Siempre.
4. Pedir al centro de origen el expediente en papel · Papel: OFICIO (la misma plantilla de petición) · siempre · al enviarlo, queda «Esperando al centro de origen».
5. Recibir el expediente en papel · Papel: EXPEDIENTE DE TRASLADO · siempre.
6. Guardar la documentación en el expediente del alumno · siempre.

(Francisco, 27-nov-2026: el expediente en papel se pide siempre, esté o no en Séneca; «2».)

Desaparece «No es necesario pedir nada» (con «Sí» solo sale la tarea 3).

## Recorridos que faltan

| Tipo de documento | Propuesta |
|---|---|
| EXPEDIENTE DE TRASLADO (nuevo) | Nos llega · se registra de entrada (aprobado el 27-nov-2026: «1») |
| DNI | Nos llega · no se registra |
| REQUERIMIENTO | Lo hacemos · Secretaría · se registra de salida · a la familia por iPasen |
| CREDENCIAL IPASEN | Lo hacemos · sin firma · no se registra · no se envía (la envía la tarea siguiente) |

## Dudas de Claude (las dice Francisco al repasar)

1. ~~El expediente que llega~~ Resuelta el 27-nov-2026. Francisco: unas veces llega por correo postal y otras por la Bandeja del registro de entrada (el centro de origen lo manda por la Ventanilla Electrónica). Se crea el tipo de documento EXPEDIENTE DE TRASLADO, «nos llega · se registra de entrada», para cualquier vía; INFORME PERSONAL TRASLADO e HISTORIAL ACADÉMICO se quedan para el alumno que se va («1»).
2. ~~Traslado: los dos hitos sin «Solo si»~~ Resuelta el 27-nov-2026: son el expediente en papel, que se pide siempre (tareas 4 y 5; la 6 pasa a «siempre»).
3. ~~Admisión: «Notificación matrícula»~~ Resuelta el 27-nov-2026: es avisar a la familia de que ha sido admitido y tiene que formalizar la matrícula, en 2 días hábiles (tarea 3).
4. IPASEN TUTOR LEGAL: ¿se queda como tipo propio, o se desactiva y se usa IPASEN ALUMNADO, que ya
   tiene «Tutor/a legal»?
5. La plantilla «Devolución de libros de gratuidad por traslado» cuelga hoy de TRASLADO, que es
   alias de este tipo (el alumno que llega). Ese certificado lo da el centro del que se va, no
   este. Propuesta: quitarla de aquí en la fila 779 (que aún no se ha programado).
