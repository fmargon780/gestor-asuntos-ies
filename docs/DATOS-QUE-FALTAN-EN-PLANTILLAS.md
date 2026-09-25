# Datos que piden las plantillas y hoy no tiene la aplicación

Escrito el 25-sep-2026 junto con las plantillas de `docs/plantillas-nuevas/` (fila 170).
Sirve para que Francisco decida, con el uso, dónde vive cada dato. **No es una instrucción:
nada de aquí se programa hasta que Francisco lo decida.**

Hoy, cada dato de esta lista va en la plantilla como `{campo:Nombre}`. Si el tipo de asunto no
tiene ese campo, la aplicación lo **pregunta al generar**, y lo escrito vale solo para ese
documento. Es decir: todo funciona ya, pero se teclea cada vez.

Para cada dato hay cuatro destinos posibles:

- **Centro**: un dato fijo del instituto, en Ajustes › Datos del centro (un hueco nuevo).
- **Campo del tipo**: un campo propio del tipo de asunto; se rellena una vez al crear el asunto.
- **Base de datos**: sale del RegAlum, de la BD de alumnado o del personal.
- **Preguntar**: se deja como está; cambia en cada documento.

La columna «Propuesta» es la recomendación de Claude; la decisión es de Francisco.

## 1. Datos del centro (lo más rentable: se escriben una vez)

| Dato | Plantillas que lo usan | Propuesta |
|---|---|---|
| NIF del centro (S4111001F, el de la Junta) | NIF del centro | Centro: hueco `{{NIF CENTRO}}` |
| Horario de atención al público | Aviso de recogida del título | Centro: hueco `{{HORARIO ATENCION}}` |
| Horario lectivo (8:30 a 15:00) | Matrícula con horario | Centro: hueco `{{HORARIO LECTIVO}}` |
| Teléfono y correo del centro | Ninguna todavía; el pie de los documentos antiguos los llevaba | Centro: `{{TELEFONO CENTRO}}`, `{{CORREO CENTRO}}` |

## 2. Datos del alumnado que podrían salir de la base de datos

| Dato | Plantillas | Propuesta |
|---|---|---|
| Centro de procedencia | Petición del historial | Base de datos: existe en la BD de alumnado («Centro de procedencia»); la fila 170 lo cambia a `{{DATO ALUMNADO BD: Centro de procedencia}}` si la prueba lo admite |
| Nivel y enseñanza en letra («1.º de ESO») | Todas las de matrícula | Hoy se usa el grupo (`{{GRUPO}}`). Decidir si basta |
| Modalidad de Bachillerato | Matrícula de Honor | Base de datos, si la BD de alumnado la trae; si no, campo del tipo |
| Nota media (número y letra) | Nota media | Preguntar, o comprobar si Séneca da ya este certificado |
| Número de registro del título y fecha de la tasa | Título en trámite | Preguntar |
| Cursos académicos y niveles anteriores | Matrícula en cursos anteriores, nota media | Base de datos (historia de matrícula), si la BD lo trae |

## 3. Datos del personal

| Dato | Plantillas | Propuesta |
|---|---|---|
| Puesto (cuerpo o categoría) | Servicios prestados, cese, informe, autorización | Base de datos: el personal ya tiene «puesto» para `{{ESPECIALIDAD}}`; ver si sirve |
| Tipo de destino (definitivo, provisional, interino) y fecha de incorporación | Servicios prestados | Base de datos, si los RelPerCen de Séneca lo traen; si no, preguntar |
| Días de vacaciones pendientes, fecha de cese | Cese y vacaciones | Campo del tipo CESE |

## 4. Campos propuestos por tipo de asunto

Son los que tendría sentido rellenar al crear el asunto, porque sirven para el documento, para el
correo y para el mensaje de Séneca a la vez. **Hoy no existen: la aplicación los pregunta al
generar.** Crearlos es decisión de Francisco, tipo a tipo, cuando los use.

| Tipo | Campos |
|---|---|
| OTROS · ACTIVIDAD EXTRAESCOLAR | Actividad · Lugar · Fechas · Horas |
| ALUMNADO · CERTIFICADO (justificante de asistencia) | Fecha de la visita · Hora de llegada · Hora de salida · Motivo de la visita · Ante quién se presenta |
| ALUMNADO · ABSENTISMO | Día de la reunión · Hora de la reunión · Con quién es la reunión · Motivo de la reunión |
| ALUMNADO · RECLAMACION | Materia · Departamento didáctico · Decisión del departamento · Calificación final · Motivo de la decisión |
| ALUMNADO · CAMBIO DE GRUPO y CAMBIO OPTATIVA | Qué se solicita · Resolución (Conceder o Denegar) · Motivo de la resolución |
| ALUMNADO · TITULO | Título · Estudios · Número de registro del título · Fecha de pago de la tasa |
| OTROS · CONSEJO ESCOLAR | Órgano · Tipo de sesión · Fecha de la sesión · Votación · Acuerdo |
| OTROS · PROYECTO (oferta educativa, Anexos I y II) | Fecha del Claustro · Curso para el que se oferta · Materias o proyectos y cursos |
| PERSONAL · CERTIFICADO PERSONAL (autorización de la Dirección) | Para qué se autoriza · Organismo o entidad · Puesto |


## 5. Lo que no es un dato, sino algo que la aplicación no sabe hacer

- **Un cargo «Tutor/a del grupo».** El justificante de asistencia de la familia lo firma hoy la
  Dirección, porque no existe el cargo de tutor. Si Francisco quiere que lo firme el tutor, hace
  falta ese cargo, sacado del grupo del alumno.
- **Plantillas para todos los tipos de una categoría.** El justificante de entrega en
  Secretaría, la citación a la familia y el oficio de remisión sirven para casi cualquier asunto,
  pero una plantilla cuelga de un solo tipo. Hoy están en DOCUMENTACION, ABSENTISMO y
  CORRESPONDENCIA.
- **Tipos que quizá falten.** Para no crear nada sin Francisco, algunas plantillas van en el tipo
  existente más cercano: el justificante de asistencia de la familia en ALUMNADO · CERTIFICADO; la
  autorización de la Dirección en PERSONAL · CERTIFICADO PERSONAL; la oferta educativa en
  OTROS · PROYECTO; el NIF del centro y «no imparte» en OTROS · CORRESPONDENCIA. Si con el uso
  conviene un tipo propio, se crea y se mueve la plantilla.
- **Enlazar una plantilla a un hito concreto.** Hoy salen en todos los hitos de su tipo. Se puede
  afinar después, tipo a tipo, con su guía delante.
- **La lista de un grupo dentro del documento.** El certificado de viaje con la lista de alumnos
  y profesores necesita un hueco `{{TABLA RELACIONADOS}}` que no existe. Por eso no se ha escrito.
- **El saludo del correo para antiguos alumnos.** En ALUMNADO la aplicación saluda siempre a
  «tutores legales», también a un antiguo alumno mayor de edad que viene a por su título.
