# Biblioteca de hitos — PERSONAL

Contenido de la fila 80. La notación está en `docs/CARGAR-BIBLIOTECA.md`, apartado 2.

Bloque del sistema de normativa usado aquí: `personal`.

---

## La regla que manda en toda la categoría

En un instituto no hay "el personal": hay **tres colectivos con normas distintas**.

- **Personal docente.** Funcionarios de carrera e interinos de los cuerpos docentes.
- **Personal funcionario de administración general.** Administrativos y auxiliares. Es el puesto
  de Francisco.
- **Personal laboral.** Ordenanzas, limpieza, cocina, monitores, técnicos de integración social.

Por eso **todos los tipos de esta categoría llevan un campo propio obligatorio, `Colectivo`**, de
lista cerrada con esas tres opciones. Es el campo que decide qué norma se cita.

Qué norma manda en cada casilla:

| Materia | Docente | Funcionario de administración general | Laboral |
|---|---|---|---|
| Permisos | TREBEP + Circular de 11 de junio de 2021 | TREBEP + Ley 5/2023 + Instrucción 3/2019 | TREBEP + VI Convenio, arts. 33 y 36 |
| Ausencias | Manual de jornada, apartados 8 y 9 | Manual de jornada + Instrucción 3/2019 | Manual de jornada + VI Convenio |
| Incapacidad temporal | MUFACE si es funcionario de carrera adscrito | Régimen General | Régimen General |
| Sustituciones | Orden de 8 de septiembre de 2010, por Séneca | Escrito a la Delegación | Escrito a la Delegación |

Común a los tres: 35 horas semanales de promedio en cómputo anual; días adicionales de asuntos
particulares por trienios; el estadillo mensual hasta el día 5; el 100 % de las retribuciones
fijas desde el primer día de baja; y que no puede sustituirse a quien está ausente sin justificar.

---

## Los tipos

### PERMISO — Solicitud de permiso
Encarga: Secretaría
Campos: Colectivo

1. Recoger la solicitud · Secretaría · reunir: solicitud firmada; documentación que justifique el permiso · comprobar antes el colectivo, porque de él depende el catálogo
2. Comprobar la documentación · Secretaría · lo que se exige cambia con cada permiso
3. [i] Resolver o remitir a quien firma · Dirección o Delegación Territorial, según el permiso
4. Comunicar la resolución · Secretaría
5. Grabar en Séneca · Secretaría
6. Archivar · Secretaría

### LICENCIA — Solicitud de licencia
Encarga: Secretaría
Campos: Colectivo

1. Recoger la solicitud · Secretaría · reunir: solicitud firmada; documentación acreditativa
2. [i] Informe de la dirección · Dirección
3. Remitir a la Delegación Territorial · Secretaría · la licencia la concede la Delegación, no el centro
4. Recibir y comunicar la resolución · Secretaría
5. Grabar en Séneca · Secretaría

### BAJA MEDICA — Incapacidad temporal
Encarga: Secretaría
Campos: Colectivo

1. Aviso de la persona · el mismo día · comunica: Dirección y Secretaría
2. Recibir el parte de baja · Secretaría · reunir: parte de baja · si es funcionario docente de carrera va por MUFACE; si es interino, laboral o funcionario no adscrito, por el Régimen General
3. Remitir el parte a la Delegación Territorial · Secretaría
4. Partes de confirmación · Secretaría · mientras dure la baja
5. Parte de alta · Secretaría · remitir igual que los anteriores
6. [i] Concesión de la licencia · Delegación Territorial · la incapacidad temporal no es una ausencia: es una licencia que concede la Delegación
7. Pedir sustitución, si procede · Dirección · se abre como asunto aparte
8. Grabar en Séneca · Secretaría

Nota del tipo: se cobra el 100 % de las retribuciones fijas desde el primer día, en los tres colectivos. Y la Circular de 11 de junio de 2021 es anterior al Real Decreto 1060/2022, que cambió quién entrega los partes: antes de aplicar una instrucción de la Circular en esta materia, comprobarla.

### AUSENCIA — Justificación de una ausencia
Encarga: Secretaría
Campos: Colectivo
NUEVO

1. Ausencia prevista · la persona avisa antes y presenta el justificante · reunir: solicitud o aviso previo; justificante
2. Ausencia imprevista · aviso inmediato y justificante después · reunir: justificante
3. Comprobar el justificante · Secretaría · no todo vale como justificante
4. Registro diario · Secretaría · módulo de control de presencia de Séneca
5. Requerimiento si no se justifica · Dirección · por escrito y con constancia · comunica: la persona interesada
6. [i] Consecuencia si sigue sin justificarse · deducción de haberes y, en su caso, efecto disciplinario, previo paso por la Comisión Provincial de Valoración de Faltas de Asistencia

Nota del tipo: sustituye a JUSTIFICACION FALTAS PAS, que solo cubría al personal de administración y servicios. El cauce es el mismo para los tres colectivos.

### ESTADILLO — Estadillo mensual de ausencias
Encarga: Secretaría
NUEVO

1. Cerrar el mes en Séneca · Secretaría
2. Generar el estadillo mensual · Secretaría · hasta el día 5 del mes siguiente; vale para los tres colectivos
3. Firma de la dirección · Dirección
4. Publicar o remitir según proceda · Secretaría

Nota del tipo: debe nacer como asunto recurrente mensual, con fecha límite el día 5.

### SUSTITUCION — Petición de sustitución
Encarga: Dirección
Campos: Colectivo
NUEVO

1. Comprobar el presupuesto de jornadas · Secretaría · el centro tiene un cupo anual
2. [i] Decidir si procede pedirla · Dirección · no puede sustituirse a quien está ausente sin justificar
3. Pedirla por Séneca · Secretaría · entra en la convocatoria telemática, que es semanal · norma: Orden de 8 de septiembre de 2010, de sustituciones
4. [i] Atender el grupo mientras no llega · Jefatura de Estudios
5. Toma de posesión de la persona sustituta · Secretaría · se abre como asunto aparte

Nota del tipo: el personal no docente va por otra vía, con escrito por la ventanilla electrónica al servicio de personal de la Delegación Territorial.

### TOMA POSESION — Toma de posesión
Encarga: Secretaría
Campos: Colectivo

1. Recibir la credencial o el nombramiento · Secretaría · reunir: credencial o nombramiento
2. Firmar la toma de posesión · Secretaría · con la fecha exacta, que es la que cuenta para la nómina · reunir: diligencia firmada por la persona y por la dirección
3. Grabar en Séneca · Secretaría
4. Alta de datos · Secretaría · reunir: cuenta corriente; datos de IRPF; situación familiar; correo del centro
5. [i] Entregar horario y documentación del centro · Jefatura de Estudios

### CESE — Cese
Encarga: Secretaría
Campos: Colectivo

1. [i] Documento de cese con su fecha · Dirección
2. Grabar en Séneca · Secretaría
3. Comunicar a la Delegación Territorial · Secretaría
4. Cerrar lo pendiente · Secretaría · reunir: llaves; material; claves; correo del centro
5. Certificado de servicios, si lo pide · Secretaría

### DATOS PERSONAL INTERINO — Alta y actualización de datos
Encarga: Secretaría

1. Recoger los datos · Secretaría · reunir: documento de identidad; cuenta corriente; datos de IRPF; situación familiar
2. Grabar en Séneca · Secretaría
3. Comprobar que la nómina los recoge · Secretaría
4. Archivar · Secretaría

### CERTIFICADO PERSONAL — Certificado a petición del personal
Encarga: Secretaría
Campos: Colectivo

1. Recoger la solicitud · Secretaría
2. Comprobar los datos en Séneca · Secretaría
3. Expedir el certificado · Secretaría · firma la secretaría, visa la dirección
4. Entregar y dejar constancia · Secretaría

### NOMINA — Incidencias de nómina
Encarga: Secretaría

1. Recoger las incidencias del mes · Secretaría
2. Comprobar altas, bajas y variaciones · Secretaría
3. Grabar y remitir antes del cierre · Secretaría
4. Comprobar la nómina publicada · Secretaría

Nota del tipo: conviene que nazca como asunto recurrente mensual, con la fecha de cierre de nómina como fecha límite.

### COM. PRODUCTIVIDAD — Complemento de productividad
Encarga: Dirección

1. [i] Propuesta · Dirección
2. Comprobar los datos · Secretaría
3. Remitir a la Delegación Territorial · Secretaría
4. Comunicar la resolución a la persona interesada · Secretaría

### FLEXIBILIDAD — Flexibilidad horaria
Encarga: Secretaría
Campos: Colectivo

1. Recoger la solicitud · Secretaría · reunir: solicitud; documentación acreditativa
2. [i] Informe de la dirección · Dirección
3. Resolver o remitir, según el supuesto · Dirección
4. Comunicar y grabar el horario · Secretaría

### FORMACION — Formación y perfeccionamiento
Encarga: Secretaría
Campos: Colectivo

1. Recoger la solicitud · Secretaría
2. Tramitar el permiso, si hace falta · Secretaría · se enlaza con PERMISO
3. Comunicar la resolución · Secretaría
4. Recoger el certificado al terminar · Secretaría · reunir: certificado de aprovechamiento
5. Archivar en el expediente · Secretaría

### DESEMPEÑO FUNCIONES — Desempeño de funciones
Encarga: Dirección
Campos: Colectivo

1. [i] Designación · Dirección
2. Comunicar a la persona interesada · Secretaría · reunir: escrito de designación firmado
3. Grabar en Séneca · Secretaría
4. Archivar · Secretaría

### INSUFICIENCIA HORARIA — Insuficiencia de horario y reubicación
Encarga: Secretaría
NUEVO

1. [i] Plantilla de funcionamiento en Séneca · Dirección · disponible a partir de finales de junio · norma: Instrucción 8/2026
2. Convocar la reunión · Secretaría · con 48 horas de antelación como mínimo · norma: Instrucción 8/2026
3. Celebrar la reunión · Secretaría · asisten la dirección, la jefatura de estudios y la secretaría, además del personal afectado
4. Grabar datos, generar el acta y dejarla firmada · Secretaría · en 24 horas, firmando primero la dirección · norma: Instrucción 8/2026
5. [i] Visado del Servicio de Inspección · las actas se cargan solas en SIRhUS

Nota del tipo: si el horario reducido es inferior a 6 horas lectivas en la especialidad, se puede optar por el desplazamiento fuera del centro. Si no se ejerce ninguna de las dos opciones, hay reducción proporcional de retribuciones. Asunto recurrente anual, en junio.
