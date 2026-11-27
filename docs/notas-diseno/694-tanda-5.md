# 694 — Quinta tanda: los cinco últimos tipos de D1, pasados al molde nuevo (en repaso con Francisco desde el 27-nov-2026)

Borrador de Claude, 27-nov-2026. Datos leídos ese día de `_GESTOR` de la cuenta común:
`guias.json` (26-nov-2026), `tipos.json`, `campos.json`, `tipos-documento.json`,
`recorridos-tipos.json` (27-nov-2026) y `plantillas.json`. Sin aprobar. Misma forma que las tandas
anteriores: cada hito pasa a ser una tarea; lo que explicaba, a «Cómo se hace»; «Papel:» es el tipo
de documento de la tarea, que sigue su recorrido. Los hitos de relleno («Tramitar», «Esperar
respuesta», «Archivar») desaparecen. Con esta tanda quedan repasados los 24 de D1.

## COMUNICACIÓN RECIBIDA (2 hitos → 2 tareas)

Hoy: «Descargar el documento» (tipo de documento COMUNICACION, con el dato «Asunto Comunicado») y
«Enviar por mail al Destinatario» («en el cuerpo: remitente, registro y lo que ponga en
observaciones en el Registro de Entrada»). Correo «Comunicaciones recibidas por Bandeja
Electrónica»: «Remite: {nombre} / Registro: {registro} / Asunto: », sin destinatario ni adjunto.

1. Descargar la comunicación de la Bandeja Electrónica y guardarla · Papel: COMUNICACION · Cómo se hace: apuntar su asunto en el dato «Asunto Comunicado».
2. Reenviarla a quien va dirigida · sin papel · con «Enviar ▾», correo «Comunicaciones recibidas por Bandeja Electrónica» · se marca a mano · Cómo se hace: añadir lo que ponga en observaciones del registro de entrada.

Cambios del correo (los hace la herramienta de aplicar): «Asunto: {campo:Asunto Comunicado}» y
adjuntar la COMUNICACION.

## CONFORMIDAD (4 hitos → por decidir)

Hoy: «Tramitar», «Imprimir, firma y sello», «Registro de salida» y «Enviar C.C. IES Fuente Lucena».
Sin datos, plantillas ni tipo de documento. Tercero: empresa.

Pendiente de la duda 1.

## INFORME EDITORIAL (3 hitos → 2 tareas)

Hoy: «Solicitud», «Generación del Informe» («Ir a BD Alumnado», «Generar el Informe Editorial») y
«Envío del Informe» («Enviar el informe por mail»). Correo «Informe Editoriales»: adjunta el
INFORME y va a quien lo pide.

1. Sacar el informe en BD Alumnado y guardarlo · Papel: INFORME · Cómo se hace: en BD Alumnado, «Informe Editorial».
2. Enviar el informe a la editorial · sin papel · con «Enviar ▾», correo «Informe Editoriales» · se marca a mano.

(«Solicitud» desaparece: la petición es el correo que abre el asunto.)

## PROGRAMA DE TRÁNSITO (3 hitos → 2 tareas)

Hoy: «CALENDARIO» («Recibir calendario de coordinación», «Enviar calendario de coordinación a los
colegios adscritos»), «Esperar respuesta» y «Archivar». Dato: «Próximo Año Académico». Correo
«Envío del calendario de coordinación del Programa de Tránsito»: adjunta el CALENDARIO
COORDINACIÓN, va a las personas relacionadas (los colegios) con copia a un grupo.

1. Recibir de Jefatura de Estudios el calendario de coordinación · Papel: CALENDARIO COORDINACIÓN.
2. Enviarlo a los colegios adscritos · sin papel · con «Enviar ▾», el correo que ya existe · se marca a mano.

Cambios que hace la herramienta de aplicar:
- El correo dice «el {hito} de coordinación»: sin hitos sale vacío; pasa a «el calendario de coordinación».
- Hay dos tipos de documento iguales, CALENDARIO COORDINACIÓN y CALENDARIO DE COORDINACIÓN: se unen en el primero, que es el que adjunta el correo.

## REUNIÓN C.M. ABSENTISMO ESCOLAR (2 hitos → 2 tareas)

Hoy: «Registro de entrada» (su explicación habla de libros por traslado: es un resto copiado de
otro tipo y se quita) y «Enviar al Director» («Resolución del Director», con «Comunicar a
Directiva» por correo). Sin datos ni plantillas.

1. Registrar la convocatoria de la Comisión Municipal de Absentismo · Papel: CONVOCATORIA.
2. Enviársela a Dirección · sin papel · con «Enviar ▾» · se marca a mano.

## Recorridos que faltan

| Tipo de documento | Propuesta |
|---|---|
| COMUNICACION | Sin recorrido (decidido en la tanda 1: se usa en muchos trámites); sale «Nos llega · no se registra» |
| INFORME | Sin recorrido por ahora (lo de cada clase de informe es la idea 780); sale «Nos llega · no se registra» |
| CALENDARIO COORDINACIÓN | Nos llega · no se registra |
| CONVOCATORIA | Nos llega · se registra de entrada |

## Dudas de Claude (las dice Francisco al repasar)

1. CONFORMIDAD: qué papel es, quién lo pide y qué quiere decir «Enviar C.C. IES Fuente Lucena». Lo que deduce Claude, sin confirmar: un escrito nuestro de conformidad para una empresa, firmado y sellado, registrado de salida y enviado por correo a la empresa con copia al correo del centro.
2. COMUNICACIÓN RECIBIDA: ¿la comunicación de la Bandeja Electrónica la registramos de entrada nosotros? El correo pone su registro, y la app solo lo sabe si el documento del asunto lo tiene (sello o listado de Séneca). COMUNICACION no puede llevar recorrido propio.
3. REUNIÓN C.M. ABSENTISMO: «Resolución del Director», ¿quiere decir que Dirección decide quién va a la reunión, o hay un papel que vuelve? Propuesta: solo se le envía, y con eso termina.
4. INFORME EDITORIAL: la petición de la editorial, ¿se registra de entrada? Propuesta: no (es un correo comercial).

## Mirado en el código (27-nov-2026)

- `{registro}` del correo de COMUNICACIÓN RECIBIDA (`js/plantillas-valores.js`, filas 573 y 239): el registro del documento más reciente del asunto que lo tenga, por su nombre antiguo o por la ficha. Si ningún documento está registrado, sale vacío.
- `{hito}` en un correo sale del hito desde el que se envía; en un asunto sin hitos, vacío.
- Un papel que nos llega no puede llevar envío en su recorrido (`js/recorrido-tipo.js`): por eso los reenvíos de esta tanda son tareas sin papel.
