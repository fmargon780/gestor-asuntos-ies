# 592 — Textos de las plantillas de BAJA MATRICULA

Textos acordados con Francisco. La resolución y los anexos salen de la plantilla Word que preparó con
Claude el 4-nov-2026 (conversación «Anulación de matrículas en Secundaria»), en su versión
simplificada: fundamentos sin citas literales y «Resuelve» con solo dos puntos. Ese Word no está en
el repositorio: estos textos son la fuente.

Convenciones:
- `{{…}}`: campo variable. Los nombres de campos que ya existen en la app (`{{MEMBRETE}}`,
  `{{NOMBRE NATURAL}}`, `{{CURSO}}`, `{{GRUPO}}`, `{{LUGAR Y FECHA}}`, `{{FIRMANTE}}`…) se usan
  tal cual; los nuevos son los datos del tipo (instrucción 592, «Datos del asunto»).
- `{si:Campo=Valor}` al principio de un párrafo: texto condicional (fila 510).
- `________`: línea en blanco que se rellena a mano. **No es un campo**: la app no la pide.

---

## 1. Resolución (Word)

Nombre de la plantilla: «Resolución de baja por traslado al extranjero».

{{MEMBRETE}}

**RESOLUCIÓN DE LA DIRECCIÓN POR LA QUE SE ACUERDA LA BAJA EN LA MATRÍCULA DE EDUCACIÓN SECUNDARIA
OBLIGATORIA POR TRASLADO DE RESIDENCIA AL EXTRANJERO**

Tabla de datos (dos columnas, etiqueta y valor):
- Alumno/a: {{NOMBRE}}
- N.º de identificación escolar: el NIE escolar del alumno
- Fecha de nacimiento: la del alumno
- Curso y grupo: {{CURSO}}, grupo {{GRUPO}} · Curso académico {{AÑO ACADÉMICO}}
- Representantes legales: los tutores legales del alumno
- País y fecha del traslado: {{PAÍS DE DESTINO}} · desde el {{FECHA DE EFECTOS DE LA BAJA}}

**ANTECEDENTES DE HECHO**

**Primero.** El alumno/a formalizó matrícula para el curso académico {{AÑO ACADÉMICO}} en {{CURSO}}
de Educación Secundaria Obligatoria en este instituto, y no ha asistido a clase desde el inicio del
curso.

**Segundo.** La Dirección del centro contactó con la familia, que comunicó su traslado de residencia
a {{PAÍS DE DESTINO}} con carácter definitivo.

{si:Protocolo de absentismo iniciado=Sí}**Tercero.** Ante las faltas de asistencia se inició el
protocolo de absentismo escolar y se informó a los Servicios Sociales Comunitarios.

{si:Protocolo de absentismo iniciado=No}**Tercero.** No llegó a iniciarse el protocolo de
absentismo escolar, porque la familia comunicó el traslado antes de que se dieran sus requisitos.

{si:Cómo se acredita el traslado=Declaración de la familia}**Cuarto.** La familia ha firmado una
declaración en la que comunica el traslado y solicita la baja (anexo I).

{si:Cómo se acredita el traslado=Diligencia de Dirección}**Cuarto.** La Dirección ha extendido
diligencia de la comunicación de la familia sobre el traslado (anexo II).

{si:Aporta matrícula del país de destino=Sí}La familia aporta además el certificado de matrícula en
un centro educativo del país de destino.

**FUNDAMENTOS DE DERECHO**

**Primero. Competencia.** Corresponde a la Dirección dirigir las actividades del instituto,
garantizar el cumplimiento de la normativa y visar sus documentos oficiales (artículo 72.1, letras
b), d) y l), del Decreto 327/2010, de 13 de julio, por el que se aprueba el Reglamento Orgánico de
los Institutos de Educación Secundaria).

**Segundo. Escolarización obligatoria.** La enseñanza básica es obligatoria entre los seis y los
dieciséis años (artículo 4.2 de la Ley Orgánica 2/2006, de 3 de mayo, de Educación). Esta
resolución no priva al alumno/a de ese derecho ni le exime de ese deber: al haber trasladado la
familia su residencia fuera de España, su escolarización debe hacerse efectiva en el sistema
educativo del país de residencia, y la matrícula en este centro queda sin objeto.

**Tercero. Absentismo escolar.** El absentismo es la falta de asistencia, sin motivo que lo
justifique, al centro donde el alumno/a está escolarizado (artículo 5.1 de la Orden de 19 de
septiembre de 2005, del Plan Integral de Absentismo Escolar). Las faltas registradas tienen su
causa en el traslado de residencia comunicado por la familia.

**Cuarto. Naturaleza de la baja.** No es una anulación de matrícula, figura reservada al
Bachillerato (disposición adicional cuarta de la Orden de 20 de febrero de 2020), ni una medida
disciplinaria, ni una consecuencia de las faltas. Es la constatación de un cambio de residencia
comunicado por quien ejerce la representación legal del alumno/a. Lo cursado hasta la fecha de la
baja queda en su expediente académico.

**Quinto. Derecho a la readmisión.** Si el alumno/a regresa a Andalucía, podrá ser escolarizado de
inmediato por el procedimiento extraordinario de admisión (artículo 51 del Decreto 21/2020, de 17
de febrero).

**Sexto. Motivación y notificación.** Esta resolución se motiva y se notifica conforme a los
artículos 35 y 40 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las
Administraciones Públicas.

Por todo lo anterior, esta Dirección

**R E S U E L V E**

**Primero.** Dar de baja en la matrícula de Educación Secundaria Obligatoria del curso académico
{{AÑO ACADÉMICO}} al alumno/a {{NOMBRE NATURAL}}, con efectos desde el {{FECHA DE EFECTOS DE LA
BAJA}}, por traslado de su residencia a {{PAÍS DE DESTINO}}.

**Segundo.** Grabar la baja en el sistema de información Séneca y anotarla en el expediente
académico del alumno/a, conservando en el centro la documentación que la justifica.

Contra esta resolución, que no pone fin a la vía administrativa, puede interponerse recurso de
alzada ante la persona titular de la Delegación Territorial de la Consejería competente en materia
de educación en {{PROVINCIA}}, en el plazo de un mes desde el día siguiente a su notificación,
conforme a los artículos 121 y 122 de la Ley 39/2015, de 1 de octubre.

{{LUGAR Y FECHA}}

EL DIRECTOR / LA DIRECTORA (como el resto de resoluciones del centro: {{TRATAMIENTO FIRMANTE}},
{{FIRMANTE}})

---

## 2. Anexo I (Word)

Nombre de la plantilla: «Anexo I · Declaración de traslado de residencia al extranjero».

{{MEMBRETE}}

**ANEXO I**
**DECLARACIÓN DE TRASLADO DE RESIDENCIA AL EXTRANJERO**

D./D.ª ________________________, con documento de identidad ____________, en calidad de
[padre / madre / tutor o tutora legal] (se tacha lo que no proceda) del alumno/a {{NOMBRE}},
matriculado/a en {{CURSO}} de ESO en el {{CENTRO}} durante el curso {{AÑO ACADÉMICO}},

**DECLARA:**

1. Que la familia ha trasladado su residencia a ________________, en ________________, desde el
   ____________.
2. Que no tiene previsto regresar a España durante el presente curso académico.
3. Que el alumno/a [está matriculado/a / será matriculado/a] (se tacha lo que no proceda) en el
   centro ________________________, donde cursará la enseñanza obligatoria conforme a la normativa
   del país de residencia.

**SOLICITA:**

Que se tramite la baja del alumno/a en este centro.

Datos de contacto: correo electrónico ________________ · teléfono ____________. Dirección en el país
de destino: ________________________________.

En ________________, a ____________

Firma del padre, madre o tutor/a legal

_Nota:_ Se puede enviar firmada y escaneada por correo electrónico. Si se dispone de ella, se
adjunta la matrícula o el certificado del centro de destino.

---

## 3. Anexo II (Word)

Nombre de la plantilla: «Anexo II · Diligencia de la Dirección».

{{MEMBRETE}}

**ANEXO II**
**DILIGENCIA DE LA DIRECCIÓN**
_(solo si la familia no aporta la declaración del anexo I)_

Para hacer constar que el ____________, a las ______, el/la director/a del centro mantuvo una
conversación [telefónica / por videollamada / por correo electrónico] (se tacha lo que no proceda)
con D./D.ª ________________________, que se identificó como [padre / madre / tutor o tutora legal]
del alumno/a {{NOMBRE}}, de {{CURSO}} de ESO, a través del teléfono o correo que consta en la
matrícula.

En dicha conversación manifestó que la familia ha trasladado su residencia a ________________
desde el ____________ y que no tiene previsto regresar. Otras manifestaciones:
________________________________________________.

Se le solicitó que remitiera la declaración del anexo I firmada. Resultado:
________________________________________________.

{{LUGAR Y FECHA}}

EL DIRECTOR / LA DIRECTORA

---

## 4. Correo a la familia

Nombre de la plantilla: «Resolución de baja · familia». Para: los tutores legales (por papeles,
regla del 6-nov-2026). Adjunto: la resolución registrada.

Asunto: Resolución de baja de matrícula · {{NOMBRE NATURAL}}

Les enviamos firmada la resolución de la Dirección por la que se da de baja la matrícula de
{{NOMBRE NATURAL}} en el {{CENTRO}}, con efectos desde el {{FECHA DE EFECTOS DE LA BAJA}}.

{si:Protocolo de absentismo iniciado=Sí}Como se había iniciado el protocolo de absentismo,
enviamos también copia a los Servicios Sociales Comunitarios para su cierre.

{si:Aporta matrícula del país de destino=No}Si disponen del certificado de matrícula en el nuevo
centro, les agradecemos que nos lo hagan llegar para completar el expediente.

(Saludo y firma: los de siempre de la plantilla de correo.)

---

## 5. Correo a Servicios Sociales

Nombre de la plantilla: «Resolución de baja · Servicios Sociales». Para: los relacionados del
asunto (Servicios Sociales tiene que estar relacionado; si no, el aviso del correo trae el botón
para relacionarlo, fila 562). Adjunto: la resolución registrada.

Asunto: Baja de matrícula por traslado al extranjero · {{NOMBRE NATURAL}}

Les comunicamos que la Dirección del {{CENTRO}} ha resuelto la baja de la matrícula de
{{NOMBRE NATURAL}}, de {{CURSO}}, con efectos desde el {{FECHA DE EFECTOS DE LA BAJA}}, por traslado
de residencia de la familia a {{PAÍS DE DESTINO}}. Adjuntamos la resolución, a efectos del cierre
del protocolo de absentismo.
