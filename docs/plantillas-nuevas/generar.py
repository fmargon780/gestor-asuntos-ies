import os
# Escribe en plantillas/ los 50 .md de la fila 170 (34 de documento y 16 de correo).
# Uso, desde la raíz del repositorio: python3 docs/plantillas-nuevas/generar.py
D='plantillas/'
SEC="{{FIRMANTE}}, Profesor/a:firmante de {{ESPECIALIDAD FIRMANTE}} y Secretario/a:firmante del {{CENTRO}}, de {{LOCALIDAD}} ({{PROVINCIA}}),"
DIR="{{FIRMANTE}}, Director/a:firmante del {{CENTRO}}, de {{LOCALIDAD}} ({{PROVINCIA}}),"
CIERRE_SEC="Y para que conste y surta los efectos oportunos, {pet}expido la presente con el V.º B.º del/de la:vistobueno Director/a:vistobueno, en {{LOCALIDAD}}, a {{HOY LARGO}}."
FIRMA_VB="""| V.º B.º | ^^{{TRATAMIENTO FIRMANTE}}^^ |
| ^^{{TRATAMIENTO VISTO BUENO}}^^ | Firma digital |
| Firma digital | {{FIRMANTE}} |
| {{VISTO BUENO}} | |"""
FIRMA_SOLO="""> {{LUGAR Y FECHA}}
>
> ^^{{TRATAMIENTO FIRMANTE}}^^
>
> Firma digital
>
> {{FIRMANTE}}"""
LOPD="""---

Responsable del tratamiento: {{CENTRO}}. Finalidad: {fin}. Puede ejercer sus derechos de acceso, rectificación y supresión ante la dirección del centro, conforme al Reglamento General de Protección de Datos."""
PET="a petición de la persona interesada, "
def doc(slug,nombre,cat,tipo,td,texto,firm,vb,cuerpo):
    fm=f"---\nnombre: {nombre}\ntipo: {tipo}\ncategoria: {cat}\ntipoDocumento: {td}\ntexto: {texto}\nfirmante: {firm}\nvistoBueno: {vb}\n---\n\n{{{{MEMBRETE}}}}\n\n"
    open(D+slug+'.md','w').write(fm+cuerpo.strip()+"\n")
def correo(slug,nombre,cat,tipo,cuerpo,seneca):
    fm=f"---\nnombre: {nombre}\ntipo: {tipo}\ncategoria: {cat}\n---\n\n"
    open(D+'correo-'+slug+'.md','w').write(fm+cuerpo.strip()+"\n\n=== SÉNECA ===\n\n"+seneca.strip()+"\n")
def cert_sec(que,pet=PET,fin="la expedición de este certificado"):
    return f"{SEC}\n\n**C E R T I F I C A:**\n\n{que}\n\n{CIERRE_SEC.replace('{pet}',pet)}\n\n{FIRMA_VB}\n\n{LOPD.replace('{fin}',fin)}"
def verbo_dir(verbo,que,fin="la tramitación de este asunto",cierre=True):
    c=f"{DIR}\n\n**{verbo}:**\n\n{que}\n\n"
    if cierre: c+="Y para que conste y surta los efectos oportunos, firmo el presente documento.\n\n"
    return c+FIRMA_SOLO+"\n\n"+LOPD.replace('{fin}',fin)

# ---------------- PERSONAL / OTROS actividad
ACT="Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, profesor/a de {{ESPECIALIDAD}}, ha participado como profesor/a acompañante en la actividad extraescolar «{campo:Actividad}», incluida en el Plan de Centro del curso {{CURSO}}, celebrada en {campo:Lugar} {campo:Fechas}, con una dedicación de {campo:Horas} horas."
doc('participacion-actividad','Participación del profesorado en actividad extraescolar','OTROS','ACTIVIDAD EXTRAESCOLAR','CERTIFICADO','participacion','secretaria','direccion',cert_sec(ACT,pet=""))
doc('participacion-actividad-a-peticion','Participación en actividad extraescolar (a petición)','PERSONAL','CERTIFICADO PERSONAL','CERTIFICADO','actividad extraescolar','secretaria','direccion',cert_sec(ACT))
doc('asistencia-septiembre','Asistencia del profesorado en septiembre','PERSONAL','CERTIFICADO PERSONAL','CERTIFICADO','asistencia septiembre','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, profesor/a de {{ESPECIALIDAD}}, ha asistido a este centro los días {campo:Días de asistencia} para {campo:Tareas realizadas}, según el calendario del curso {{CURSO}}."))
doc('servicios-prestados','Servicios prestados en el centro','PERSONAL','CERTIFICADO PERSONAL','CERTIFICADO','servicios prestados','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, presta servicios en este centro como {campo:Puesto}, con destino {campo:Tipo de destino}, desde el {campo:Fecha de incorporación al centro}."))
doc('certificado-libre-personal','Certificado a petición del personal (texto libre)','PERSONAL','CERTIFICADO PERSONAL','CERTIFICADO','a peticion','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, {campo:Lo que se certifica}."))
doc('cese-y-vacaciones','Cese y vacaciones pendientes','PERSONAL','CESE','CERTIFICADO','cese y vacaciones','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha prestado servicios en este centro como {campo:Puesto} hasta el {campo:Fecha de cese}, fecha de su cese.\n\nQue, a esa fecha, le quedan por disfrutar {campo:Días de vacaciones pendientes} días de vacaciones."))
doc('informe-desempeno','Informe de la Dirección sobre el desempeño','PERSONAL','CERTIFICADO PERSONAL','INFORME','desempeño','direccion','',
 verbo_dir("I N F O R M A","Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha desempeñado en este centro el puesto de {campo:Puesto} {campo:Periodo}.\n\nQue ha cumplido sus funciones con responsabilidad y eficacia, por lo que su desempeño merece una valoración favorable de esta Dirección.",fin="la emisión de este informe"))
doc('autorizacion-direccion','Autorización de la Dirección','PERSONAL','CERTIFICADO PERSONAL','AUTORIZACION','autorizacion','direccion','',
 verbo_dir("A U T O R I Z A","A **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, {campo:Puesto} de este centro, a {campo:Para qué se autoriza}, en nombre del {{CENTRO}}, ante {campo:Organismo o entidad}.",fin="la gestión de esta autorización"))

# ---------------- ALUMNADO
MATR="Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, está matriculado/a en este centro en el grupo {{GRUPO}} durante el curso {{CURSO}}"
doc('matricula-sin-comedor','Matrícula sin servicio de comedor','ALUMNADO','CERT. MATRICULA','CERTIFICADO','sin comedor','secretaria','direccion',cert_sec(MATR+", y que el centro no dispone de servicio de comedor escolar."))
doc('matricula-seguro-escolar','Matrícula con seguro escolar abonado','ALUMNADO','CERT. MATRICULA','CERTIFICADO','seguro escolar','secretaria','direccion',cert_sec(MATR+", y que tiene abonada la cuota del seguro escolar obligatorio de este curso."))
doc('matricula-asistencia','Matrícula con asistencia regular','ALUMNADO','CERT. MATRICULA','CERTIFICADO','asistencia','secretaria','direccion',cert_sec(MATR+", y que asiste a clase con regularidad."))
doc('matricula-horario','Matrícula con horario','ALUMNADO','CERT. MATRICULA','CERTIFICADO','horario','secretaria','direccion',cert_sec(MATR+", con horario lectivo de {campo:Horario lectivo}."))
doc('matricula-cursos-anteriores','Matrícula en cursos anteriores','ALUMNADO','CERT. MATRICULA','CERTIFICADO','cursos anteriores','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha estado matriculado/a en este centro en los cursos siguientes: {campo:Cursos académicos y niveles}."))
doc('convivencia','Sin conductas contrarias a la convivencia','ALUMNADO','CERTIFICADO','CERTIFICADO','convivencia','secretaria','direccion',
 cert_sec(MATR+", y que en su expediente no consta ninguna conducta contraria ni gravemente perjudicial para la convivencia."))
doc('matricula-de-honor','Matrícula de Honor en Bachillerato','ALUMNADO','CERTIFICADO','CERTIFICADO','matricula de honor','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha cursado 2.º de Bachillerato, modalidad de {campo:Modalidad de Bachillerato}, en este centro durante el curso {{CURSO}}, y ha obtenido Matrícula de Honor."))
doc('nota-media','Nota media de unos estudios','ALUMNADO','CERTIFICADO','CERTIFICADO','nota media','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha cursado en este centro {campo:Estudios} en los cursos {campo:Cursos académicos}, con una nota media de {campo:Nota media en letra} ({campo:Nota media})."))
doc('titulo-en-tramite','Título en trámite de expedición','ALUMNADO','TITULO','CERTIFICADO','titulo','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, ha terminado en este centro {campo:Estudios} y reúne los requisitos para obtener el título de {campo:Título}.\n\nQue el título está en trámite de expedición, con número de registro {campo:Número de registro del título}, y que la tasa se abonó el {campo:Fecha de pago de la tasa}."))
doc('actividad-alumno','Participación del alumno en una actividad o viaje','ALUMNADO','CERTIFICADO','CERTIFICADO','actividad','secretaria','direccion',
 cert_sec(MATR+", y que va a participar en la actividad «{campo:Actividad}», en {campo:Lugar}, {campo:Fechas}, aprobada por el Consejo Escolar e incluida en el Plan de Centro."))
doc('justificante-asistencia-familia','Justificante de asistencia de la familia al centro','ALUMNADO','CERTIFICADO','JUSTIFICANTE','asistencia','direccion','',
 verbo_dir("H A C E   C O N S T A R","Que {{QUIENLOPIDE}}, {{QUIENLOPIDERELACION}} del alumno/a {{NOMBRE NATURAL}}, del grupo {{GRUPO}}, ha estado en este centro el {campo:Fecha de la visita}, de {campo:Hora de llegada} a {campo:Hora de salida}, para {campo:Motivo de la visita}.\n\nY para que conste ante {campo:Ante quién se presenta}, firmo el presente justificante.",fin="la emisión de este justificante",cierre=False))
doc('requerimiento-documentacion','Requerimiento de documentación','ALUMNADO','DOCUMENTACION','REQUERIMIENTO','documentacion','secretaria','',
 "# Requerimiento de documentación\n\nA la atención de {{TUTOR1}}, como persona que ejerce la tutela legal de {{NOMBRE NATURAL}}, del grupo {{GRUPO}}.\n\nPara completar la tramitación de su solicitud es necesario que aporte la documentación siguiente:\n\n{{LO QUE FALTA}}\n\nConforme al artículo 68.1 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas, dispone de diez días hábiles, hasta el {{LIMITE}}, para entregarla en la Secretaría del centro. Si no lo hace, se le tendrá por desistido/a:tutor1 de su petición.\n\n"+FIRMA_SOLO+"\n\n"+LOPD.replace('{fin}','la tramitación de su solicitud'))
doc('justificante-entrega','Justificante de entrega en Secretaría','ALUMNADO','DOCUMENTACION','JUSTIFICANTE','entrega','administracion','',
 "# Justificante de entrega de documentación\n\nSe hace constar que {{QUIENLOPIDE}} ha entregado hoy, {{HOY LARGO}}, en la Secretaría de este centro la documentación siguiente, relativa a {{NOMBRE NATURAL}}, del grupo {{GRUPO}}:\n\n{campo:Documentación entregada}\n\nNúmero de registro de entrada en Séneca: {{REGISTRO}}.\n\n"+FIRMA_SOLO+"\n\n"+LOPD.replace('{fin}','la tramitación de su solicitud'))
RES="Vista la solicitud presentada por {{QUIENLOPIDE}} el {{QUIENLOPIDEFECHA}}, relativa a {{NOMBRE NATURAL}}, del grupo {{GRUPO}}, en la que pide {campo:Qué se solicita},\n\n**R E S U E L V O:**\n\n{campo:Resolución (Conceder o Denegar)} lo solicitado, por el motivo siguiente: {campo:Motivo de la resolución}.\n\nContra esta resolución, que no pone fin a la vía administrativa, puede interponer recurso de alzada ante la persona titular de la Delegación Territorial de la {{CONSEJERIA}} en {{PROVINCIA}}, en el plazo de un mes desde el día siguiente a su notificación, conforme a los artículos 121 y 122 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas."
for tipo,slug,nom in [('CAMBIO DE GRUPO','resolucion-cambio-grupo','Resolución de cambio de grupo'),('CAMBIO OPTATIVA','resolucion-cambio-optativa','Resolución de cambio de optativa')]:
    doc(slug,nom,'ALUMNADO',tipo,'RESOLUCION','resolucion','direccion','',f"{DIR}\n\n{RES}\n\n{FIRMA_SOLO}\n\n"+LOPD.replace('{fin}','la tramitación de su solicitud'))
doc('citacion-familia','Citación a la familia','ALUMNADO','ABSENTISMO','CITACION','reunion','jefatura-estudios','',
 "# Citación\n\nSe cita a {{TUTOR1}}, como persona que ejerce la tutela legal de {{NOMBRE NATURAL}}, del grupo {{GRUPO}}, a una reunión en el centro el día {campo:Día de la reunión}, a las {campo:Hora de la reunión}, con {campo:Con quién es la reunión}.\n\nMotivo de la reunión: {campo:Motivo de la reunión}.\n\nSi no pudiera asistir, le rogamos que lo comunique al centro para acordar otra fecha.\n\n"+FIRMA_SOLO+"\n\n"+LOPD.replace('{fin}','la tramitación de este asunto'))
doc('comunicacion-reclamacion','Comunicación de la decisión sobre una reclamación de calificación','ALUMNADO','RECLAMACION','COMUNICACION','reclamacion','jefatura-estudios','',
 "# Comunicación de la decisión sobre la reclamación\n\nA la atención de {{TUTOR1}}, como persona que ejerce la tutela legal de {{NOMBRE NATURAL}}, del grupo {{GRUPO}}.\n\nEn relación con la reclamación presentada el {{QUIENLOPIDEFECHA}} sobre la calificación final de {campo:Materia}, le comunicamos que el departamento de {campo:Departamento didáctico} ha decidido {campo:Decisión del departamento (mantener o modificar)} la calificación. La calificación final es {campo:Calificación final}.\n\nMotivo: {campo:Motivo de la decisión}.\n\nSi no está de acuerdo, puede pedir por escrito a la Dirección del centro, en el plazo que marca la normativa de evaluación, que eleve su reclamación a la Delegación Territorial.\n\n"+FIRMA_SOLO+"\n\n"+LOPD.replace('{fin}','la tramitación de la reclamación'))
doc('peticion-historial','Petición del historial al centro de procedencia','ALUMNADO','TRASLADO','OFICIO','peticion historial','secretaria','',
 "# Petición de historial académico\n\nAl centro {campo:Centro de procedencia}.\n\nLe comunicamos que {{NOMBRE NATURAL}} se ha matriculado en este centro en el curso {{CURSO}}, en el grupo {{GRUPO}}.\n\nLe rogamos que nos remita su historial académico y el resto de la documentación de su expediente.\n\n"+FIRMA_SOLO)
doc('devolucion-libros','Devolución de libros de gratuidad por traslado','ALUMNADO','TRASLADO','CERTIFICADO','libros','secretaria','direccion',
 cert_sec("Que **D./Dña. {{NOMBRE NATURAL}}**, del grupo {{GRUPO}}, que causa baja en este centro por traslado, ha devuelto los libros de texto del Programa de Gratuidad de Libros de Texto. Estado de los libros: {campo:Estado de los libros}."))

# ---------------- OTROS
doc('acuerdo-organo-colegiado','Acuerdo del Consejo Escolar o del Claustro','OTROS','CONSEJO ESCOLAR','CERTIFICADO','acuerdo','secretaria','direccion',
 cert_sec("Que en la sesión {campo:Tipo de sesión (ordinaria o extraordinaria)} del {campo:Órgano (Consejo Escolar o Claustro)}, celebrada el {campo:Fecha de la sesión}, se adoptó {campo:Votación (por unanimidad o por mayoría)} el acuerdo siguiente:\n\n{campo:Acuerdo}",pet="ante {{NOMBRE NATURAL}}, "))
doc('oferta-anexo-i','Oferta educativa: conformidad del Claustro (Anexo I)','OTROS','PROYECTO','CERTIFICADO','anexo I','secretaria','direccion',
 cert_sec("Que el Claustro de Profesorado, en sesión celebrada el {campo:Fecha del Claustro}, ha dado su conformidad a la oferta de las materias de diseño propio y proyectos interdisciplinares siguientes para el curso {campo:Curso para el que se oferta}:\n\n{campo:Materias o proyectos y cursos}",pet=""))
doc('oferta-anexo-ii','Oferta educativa: medios propios (Anexo II)','OTROS','PROYECTO','CERTIFICADO','anexo II','direccion','',
 verbo_dir("H A C E   C O N S T A R","Que las materias de diseño propio y proyectos interdisciplinares siguientes, para el curso {campo:Curso para el que se oferta}, se impartirán con los medios propios del centro, sin aumento de la plantilla de profesorado:\n\n{campo:Materias o proyectos y cursos}",fin="la tramitación de la oferta educativa"))
doc('actividad-entidad','Actividad realizada en el centro por una entidad','OTROS','PROYECTO','CERTIFICADO','actividad realizada','secretaria','direccion',
 cert_sec("Que {{NOMBRE NATURAL}} ha realizado en este centro {campo:Actividad realizada}, dirigida a {campo:Alumnado destinatario}, {campo:Fechas}.",pet="a petición de la entidad interesada, "))
doc('cif-centro','NIF del centro','OTROS','CORRESPONDENCIA','CERTIFICADO','NIF','secretaria','direccion',
 cert_sec("Que el {{CENTRO}}, con código {{CODIGO CENTRO}}, es un centro docente público dependiente de la {{CONSEJERIA}} de la Junta de Andalucía, y que su número de identificación fiscal es el de la Junta de Andalucía: {campo:NIF del centro}.",pet=""))
doc('no-imparte','El centro no imparte unas enseñanzas','OTROS','CORRESPONDENCIA','CERTIFICADO','no imparte','secretaria','direccion',
 cert_sec("Que en el {{CENTRO}} no se imparten durante el curso {{CURSO}} las enseñanzas de {campo:Enseñanza que no se imparte}.",pet="a petición de {{NOMBRE NATURAL}}, "))
doc('oficio-remision','Oficio de remisión de documentación','OTROS','CORRESPONDENCIA','OFICIO','remision','direccion','',
 "# Oficio de remisión\n\nDestinatario: {{NOMBRE NATURAL}}.\n\nAdjunto le remito la documentación siguiente:\n\n{campo:Documentación que se remite}\n\nMotivo del envío: {campo:Motivo del envío}.\n\n"+FIRMA_SOLO)

# ---------------- CORREOS (sin saludo ni firma: los pone la app)
correo('certificado-personal','Envío de un certificado al personal','PERSONAL','CERTIFICADO PERSONAL',
 "Le enviamos adjunto el certificado que nos pidió, ya firmado digitalmente.\n\nSi necesita algún cambio, responda a este correo.",
 "Le hemos enviado por correo electrónico el certificado que nos pidió, ya firmado digitalmente. Si no lo ha recibido, puede recogerlo en la Secretaría del centro.")
correo('funciones','Envío del certificado de funciones y horario','PERSONAL','DESEMPEÑO FUNCIONES',
 "Le enviamos adjunto el certificado de funciones y horario que nos pidió, ya firmado digitalmente.\n\nSi necesita algún cambio, responda a este correo.",
 "Le hemos enviado por correo electrónico el certificado de funciones y horario que nos pidió. Si no lo ha recibido, puede recogerlo en la Secretaría del centro.")
correo('tutoria','Envío del certificado de función tutorial','PERSONAL','DESEMPEÑO FUNCIÓN TUTORIAL',
 "Le enviamos adjunto el certificado de función tutorial que nos pidió, ya firmado digitalmente.\n\nSi falta algún curso o hay que cambiar algo, responda a este correo.",
 "Le hemos enviado por correo electrónico el certificado de función tutorial que nos pidió. Si no lo ha recibido, puede recogerlo en la Secretaría del centro.")
correo('autorizacion','Envío de una autorización de la Dirección','PERSONAL','CERTIFICADO PERSONAL',
 "Le enviamos adjunta la autorización de la Dirección para {campo:Para qué se autoriza}.\n\nLlévela consigo, en papel o en el móvil, cuando haga la gestión.",
 "Le hemos enviado por correo electrónico la autorización de la Dirección para {campo:Para qué se autoriza}. Si no la ha recibido, puede recogerla en la Secretaría del centro.")
correo('actividad','Envío del certificado de participación en una actividad','OTROS','ACTIVIDAD EXTRAESCOLAR',
 "Le enviamos adjunto el certificado de su participación en la actividad «{campo:Actividad}» ({campo:Fechas}), con {campo:Horas} horas reconocidas.\n\nGracias por acompañar al alumnado.",
 "Le hemos enviado por correo electrónico el certificado de su participación en la actividad «{campo:Actividad}», con {campo:Horas} horas reconocidas.")
correo('cert-matricula','Envío de un certificado de matrícula','ALUMNADO','CERT. MATRICULA',
 "Les enviamos adjunto el certificado de matrícula de {{NOMBRE NATURAL}} que nos pidieron, ya firmado digitalmente.\n\nSi necesitan algún cambio, respondan a este correo.",
 "Les hemos enviado por correo electrónico el certificado de matrícula de {{NOMBRE NATURAL}} que nos pidieron. Si no lo han recibido, pueden recogerlo en la Secretaría del centro.")
correo('certificado-alumnado','Envío de un certificado del alumnado','ALUMNADO','CERTIFICADO',
 "Les enviamos adjunto el certificado de {{NOMBRE NATURAL}} que nos pidieron, ya firmado digitalmente.\n\nSi necesitan algún cambio, respondan a este correo.",
 "Les hemos enviado por correo electrónico el certificado de {{NOMBRE NATURAL}} que nos pidieron. Si no lo han recibido, pueden recogerlo en la Secretaría del centro.")
correo('titulo','Aviso de recogida del título','ALUMNADO','TITULO',
 "El título de {campo:Título} de {{NOMBRE NATURAL}} ya ha llegado al centro.\n\nPuede recogerlo en la Secretaría, en horario de {campo:Horario de atención al público}, la persona titular con su DNI. Si lo recoge otra persona, debe traer una autorización firmada por la persona titular y una copia de su DNI.",
 "El título de {campo:Título} de {{NOMBRE NATURAL}} ya ha llegado al centro. Puede recogerlo en la Secretaría, en horario de {campo:Horario de atención al público}, con el DNI de la persona titular.")
correo('documentacion','Requerimiento de documentación','ALUMNADO','DOCUMENTACION',
 "Para completar el trámite de {{NOMBRE NATURAL}} nos falta la documentación siguiente:\n\n{{LO QUE FALTA}}\n\nPueden entregarla en la Secretaría o enviarla escaneada respondiendo a este correo, antes del {{LIMITE}}. Les adjuntamos el requerimiento.",
 "Para completar el trámite de {{NOMBRE NATURAL}} nos falta la documentación siguiente: {{LO QUE FALTA}}. Pueden entregarla en la Secretaría o enviarla por correo electrónico antes del {{LIMITE}}.")
correo('justificante-asistencia','Envío del justificante de asistencia al centro','ALUMNADO','CERTIFICADO',
 "Les enviamos adjunto el justificante de su visita al centro del {campo:Fecha de la visita}, ya firmado digitalmente.",
 "Les hemos enviado por correo electrónico el justificante de su visita al centro del {campo:Fecha de la visita}.")
for tipo,slug in [('CAMBIO DE GRUPO','cambio-grupo'),('CAMBIO OPTATIVA','cambio-optativa')]:
    correo(slug,'Envío de la resolución de la solicitud','ALUMNADO',tipo,
     "Les enviamos adjunta la resolución de la Dirección sobre su solicitud relativa a {{NOMBRE NATURAL}}.\n\nEn el propio documento se indica qué pueden hacer si no están de acuerdo.",
     "Su solicitud relativa a {{NOMBRE NATURAL}} ya está resuelta. Les hemos enviado la resolución por correo electrónico; también pueden recogerla en la Secretaría del centro.")
correo('absentismo','Citación a la familia por la asistencia a clase','ALUMNADO','ABSENTISMO',
 "Les citamos a una reunión en el centro el {campo:Día de la reunión}, a las {campo:Hora de la reunión}, para hablar de la asistencia a clase de {{NOMBRE NATURAL}}. Les adjuntamos la citación.\n\nSi no pueden venir, respondan a este correo y buscamos otra fecha.",
 "Les citamos a una reunión en el centro el {campo:Día de la reunión}, a las {campo:Hora de la reunión}, para hablar de la asistencia a clase de {{NOMBRE NATURAL}}. Si no pueden venir, avísennos para buscar otra fecha.")
correo('reclamacion','Envío de la decisión sobre la reclamación','ALUMNADO','RECLAMACION',
 "Les enviamos adjunta la decisión del departamento sobre la reclamación de la calificación de {campo:Materia} de {{NOMBRE NATURAL}}.\n\nEn el documento se indica qué pueden hacer si no están de acuerdo.",
 "El departamento ya ha decidido sobre la reclamación de la calificación de {campo:Materia} de {{NOMBRE NATURAL}}. Les hemos enviado la comunicación por correo electrónico; también pueden recogerla en la Secretaría del centro.")
correo('consejo-escolar','Envío del certificado de un acuerdo','OTROS','CONSEJO ESCOLAR',
 "Les enviamos adjunto el certificado del acuerdo adoptado por el {campo:Órgano (Consejo Escolar o Claustro)} del centro en su sesión del {campo:Fecha de la sesión}.",
 "Les enviamos el certificado del acuerdo adoptado por el {campo:Órgano (Consejo Escolar o Claustro)} del centro en su sesión del {campo:Fecha de la sesión}.")
correo('correspondencia','Envío de documentación con oficio','OTROS','CORRESPONDENCIA',
 "Les remitimos la documentación que se detalla en el oficio adjunto.\n\nLes agradeceremos que nos confirmen la recepción respondiendo a este correo.",
 "Les remitimos la documentación que se detalla en el oficio que les hemos enviado por correo electrónico.")
