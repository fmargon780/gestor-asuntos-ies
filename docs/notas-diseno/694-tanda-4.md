# 694 — Cuarta tanda: cuatro tipos de alumnado con guía de hitos, pasados al molde nuevo (borrador del 27-nov-2026)

Borrador de Claude (Sonnet), 27-nov-2026. Datos leídos ese día de `_GESTOR` de la cuenta común:
`guias.json` (26-nov-2026), `tipos.json`, `campos.json`, `tipos-documento.json`,
`recorridos-tipos.json` y `plantillas.json`. Sin aprobar. Misma forma que las tandas anteriores:
cada hito pasa a ser una tarea; lo que explicaba, a «Cómo se hace»; «Papel:» es el tipo de
documento de la tarea, que sigue su recorrido. Los hitos de relleno («Tramitar», «Esperar
respuesta», «Archivar») desaparecen.

Tanda elegida por tema: lo que pasa con la familia y el dinero o el equipo de orientación
(seguro escolar, ayuda de transporte, evaluación psicopedagógica e informe del equipo educativo).
Quedan cinco para la tanda 5: COMUNICACIÓN RECIBIDA, CONFORMIDAD, INFORME EDITORIAL,
PROGRAMA DE TRÁNSITO y REUNIÓN C.M. ABSENTISMO ESCOLAR.

## COBRO SEGURO ESCOLAR (1 hito → 1 tarea)

Hoy: un solo hito, «Cobro», con la explicación «importe 1,12 €, de 3.º de la ESO en adelante».

1. Anotar el cobro del seguro escolar · Cómo se hace: importe 1,12 €; se cobra de 3.º de la ESO en adelante.

Sin papel. Los datos que ya tiene el tipo (importe cobrado, obligatorio, y unidad) no cambian.

## PAGO AYUDA TRANSPORTE (4 hitos → 4 tareas)

Hoy: «Solicitar número de cuenta», «Esperar respuesta» (con la tarea «Descargar documentación y
enviar a Secretaría»), «Comunicar a la tutoría la transferencia realizada» y «Archivar». Tiene dos
correos (pedir la cuenta; avisar de la transferencia y citar a firmar el recibí) y la plantilla de
Word «AITE - RECIBÍ GENÉRICO». Datos: curso del abono, fecha de la transferencia, importe y
kilómetros reconocidos.

1. Pedir a la familia el número de cuenta · sin papel · con «Enviar ▾», correo «Abono ayuda transporte escolar» · al enviarlo, queda «Esperando a la familia».
2. Pasar la documentación recibida a Secretaría para que haga la transferencia · Cómo se hace: descargar lo que manda la familia y enviárselo a Secretaría.
3. Avisar a la familia de la transferencia y citarla a firmar el recibí en Secretaría · sin papel · con «Enviar ▾», correo «Ayuda Individualizada para el Transporte Escolar (AITE) – Firma de recibí».
4. Guardar el recibí firmado · Papel: AITE - RECIBÍ GENÉRICO (ver duda 2).

(«Archivar» desaparece.)

## Evaluación psicopedagógica y alumnado NEAE (3 hitos → 3 tareas)

Hoy: «Registrar la solicitud de la familia», «Enviar al Dpto. Orientación» (con el correo «Envío del
Registro de Entrada de Documentación por los padres», que adjunta el REGISTRO ENTREGA y va al grupo
de Orientación) y «Registrar el recibí» («Cuando llegue»).

1. Registrar la solicitud de la familia · Papel: SOLICITUD (recorrido ya aprobado: nos llega, se registra de entrada).
2. Enviar al Departamento de Orientación el registro de la documentación entregada · sin papel · con «Enviar ▾», el correo que ya existe · al enviarlo, queda «Esperando a Orientación».
3. Registrar el recibí de Orientación · Papel: RECEPCIÓN (ver duda 3) · Cómo se hace: cuando llegue, con su fecha exacta.

## INFORME VALORACIÓN EQUIPO EDUCATIVO (3 hitos → 3 tareas)

Hoy: «Solicitud» (registrar de entrada), «Emisión» (espera, sin tarea) y «Envío» (registrar de
salida «si se remite» y «dar al tutor para entregar a la familia»). Sin datos ni plantillas.

1. Recibir la solicitud del informe · Papel: SOLICITUD.
2. Recoger el informe del equipo educativo · Papel: INFORME · queda «Esperando al equipo educativo» hasta que llegue.
3. Entregar el informe · sin papel · Cómo se hace: si se manda fuera del centro, registrarlo de salida y enviarlo con «Enviar ▾»; si no, dárselo al tutor para que lo entregue a la familia. (Ver duda 4.)

## Recorridos que faltan

| Tipo de documento | Propuesta |
|---|---|
| SOLICITUD, INFORME | Ya tienen o no necesitan recorrido nuevo: SOLICITUD es «nos llega · se registra de entrada» (tanda 1); INFORME se queda sin recorrido (= nos llega · no se registra), porque lo usan también INFORME EDITORIAL y CERTIFICADO PERSONAL. |
| RECEPCIÓN | Nos llega · se registra de entrada (si Francisco confirma la duda 3) |
| AITE - RECIBÍ GENÉRICO | Pendiente de la duda 2 |

## Dudas de Claude (las dice Francisco al repasar)

1. Ayuda de transporte, tarea 3: el hito decía «comunicar a la tutoría», pero la frase y el correo hablan de avisar **a la familia**. Propuesta: el aviso va a la familia (el correo ya está hecho para los tutores legales). ¿Se avisa también a la tutoría?
2. Ayuda de transporte, tarea 4: ¿el recibí es un papel que generamos, imprimimos y firma la familia en Secretaría, y luego lo escaneamos? Si es así, se guarda como papel que nos llega firmado por la familia (sin registro). Mirado en el código (`js/recorrido-tipo.js`): las firmas posibles son Nadie, Administración, Secretaría, Secretaría con visto bueno de Dirección, Dirección y Jefatura de Estudios; la familia no es una firma. Por eso el recibí firmado entraría como «nos llega · no se registra».
3. NEAE, tarea 3: ¿el recibí de Orientación es un documento que ya conoces con otro nombre? Hoy hay «RECEPCIÓN» y «REGISTRO ENTREGA» entre los tipos de documento; propongo RECEPCIÓN.
4. Informe del equipo educativo: ¿quién lo pide y a quién va cuando sale del centro (por ejemplo, a un médico o a Servicios Sociales)? Con eso se decide si la tarea 3 se parte en dos según el caso.
5. Aparte, sin pedirlo: el correo «Abono ayuda transporte escolar» lleva escrito a mano «curso 2024/2025». Propongo que use el dato «Curso Abono AITE», como ya hace el otro correo. ¿En este tema o aparte?

## Por mirar en el código antes de aplicar (no se ha mirado todavía)

- Si existe «registrar de salida» sin papel (tarea 3 del informe). (Las firmas posibles ya están miradas, duda 2.)
- De dónde sale `{registro}` en el correo de COMUNICACIÓN RECIBIDA (tanda 5).
