# El correo de un hito, al tutor o tutora del grupo (fila 299 de la cola)

Diseño cerrado con Francisco el 7-oct-2026, en Cowork. Sale de un aviso de usuario (Diego Herrera,
el compañero de Francisco, 7-oct-2026 10:25, versión 06-oct-2026 · 20:14, pantalla «Ficha de un
asunto»):

> Dentro de las tareas con el ALUMNADO, en el asunto SANCIÓN, el hito «Notificar al tutor/a» debe
> llamarse «Informar al tutor/a». Hay que generar plantilla de comunicación vía Gmail para el
> tutor/a, con el siguiente texto: «Buenas. Jefatura de estudios entregará al alumno la
> notificación escrita para la familia. Esta comunicación solo efectos informativos para el
> tutor/a. Un saludo». Adjuntando el documento de NOTIFICACIÓN.

«Tutor/a» aquí es el **profesor tutor del grupo del alumno**, no el padre ni la madre.

## Qué pasa hoy

- En la guía, una tarea con la acción «Comunicar» lleva «Detalles: a quién · vía · plantilla»
  (`receta`, `js/guias-guion.js`). «A quién» ya ofrece «La tutoría» (valor `tutoria`), pero la app
  no sabe quién es: `HitoMesaRecetas.elegidosPara` devuelve una lista vacía y el cuadro de Correo
  sale sin dirección y con el nombre «la tutoría» (`js/hito-mesa-recetas.js`,
  `js/hacer-este-hito.js`).
- La app sí sabe quién es el tutor de cada unidad: la tabla TUTORIAS (`TablasDatos`, filas
  `{ curso, grupo, nombre, dni, desde, hasta, clave }`, `docs/contexto/TABLAS-DE-DATOS.md`).
- El saludo de un correo de un asunto de ALUMNADO es siempre «Estimados tutores legales de …:»
  (`saludoDe`, `js/correo.js`). Para un profesor no vale.
- Una plantilla de correo no puede decir qué documento se adjunta.

Decidido con Francisco: **vale para cualquier hito de cualquier tipo de asunto**, no solo para
SANCIÓN. Y los cambios que pide Diego los hace la app sola, sin que él toque nada.

## 1. Lo que ve el usuario

### 1.1 «Tutor/a del grupo» en la guía

En «Detalles» de una tarea de comunicar, la opción «La tutoría» pasa a llamarse **«Tutor/a del
grupo»**. El valor guardado sigue siendo `tutoria`: no hay nada que migrar.

### 1.2 Quién es el tutor o tutora del grupo

Regla única, en un módulo nuevo (`js/tutor-del-grupo.js`, `TutorDelGrupo`), con la parte de decidir
escrita como función pura:

1. El tercero del asunto tiene que ser de ALUMNADO y estar en su fichero (la misma búsqueda de
   siempre, `HitosComunicar.buscarPersonaDelAsunto`). Su unidad es el mismo dato que enseña la
   ficha como «Unidad» (el de `js/datos-favoritos.js`; no se escribe otra manera de leerlo).
2. De la tabla TUTORIAS, las filas del curso académico de hoy, del bloque de tutorías de unidades
   (no el de Pedagogía Terapéutica), cuya unidad es la del alumno y que están en vigor **hoy**
   (`desde` ≤ hoy ≤ `hasta`; sin `hasta`, en vigor).
3. La unidad se compara sin mayúsculas, tildes, espacios, puntos, guiones ni «º/ª»: «1º ESO A»,
   «1ºESO-A» y «1 E.S.O. A» son la misma; «1º ESO A» y «1º ESO B», no.
4. Si hay dos en vigor (cotutoría, sustitución), van los dos.
5. El correo de cada uno sale de su ficha de PERSONAL (`Datos.cargar(…, 'PERSONAL')`), unida por el
   documento (`clave`, como hacen ya las tablas de datos), con `Destinatarios.direccionesDe`. Si su
   ficha no trae ninguno, el que se haya recordado (apartado 1.4).
6. No se sabe quién es (y todo sigue como hoy, sin dirección y con el nombre «la tutoría») cuando:
   el tercero no es de ALUMNADO, el asunto es de grupo (`AsuntoDeGrupo.esGrupo`), el alumno no
   tiene unidad, no hay tabla TUTORIAS de este curso o ninguna fila está en vigor para su unidad.
   En los tres últimos casos el cuadro de Correo lleva arriba una línea ámbar: «No sé quién es el
   tutor o tutora de <unidad>. Sube la relación de tutorías de Séneca en Herramientas → Tablas de
   datos.» (sin unidad: «Este alumno no tiene unidad este curso.»). Nunca impide abrir el cuadro.

### 1.3 Dónde se nota

- **Mesa del hito, «Comunicar ▾»**: entre las casillas de destinatarios sale una más por cada
  tutor en vigor: «<Nombre> (tutor/a de <unidad>)». No va marcada de entrada (las marcadas de
  entrada no cambian), salvo lo de abajo.
- **Tarea de comunicar con «Tutor/a del grupo»** (desde «Comunicar ▾» y desde «Hacer este hito»):
  el cuadro de Correo se abre con el correo del tutor ya puesto, su nombre en vez de «la tutoría»,
  y la constancia dice «Comunicado a <nombre> por correo…». `elegidosPara` y `pasoComunicar` dejan
  de tratar `tutoria` como caso aparte: una sola regla para los dos sitios.
- **El saludo**: cuando el correo va solo a tutores del grupo, el saludo es **«Buenas:»** en vez de
  «Estimados tutores legales de …:». La firma, la de siempre. Ojo: «Guardar como plantilla nueva»
  (fila 270, `js/plantilla-de-lo-escrito.js`) quita el saludo sabiéndolo tal cual; tiene que
  conocer también este.
- **Por Séneca**: como hoy (el cuadro de Séneca no deja marcar a nadie desde aquí); solo cambia el
  nombre de la constancia.

### 1.4 Si la app no tiene el correo de ese profesor

- El cuadro de Correo se abre con «Otro correo» vacío y, debajo, una línea: «No tengo el correo de
  <Nombre>. Escríbelo aquí y lo recordaré.»
- Al enviar el correo (el mismo momento en que se deja la constancia, `js/correo-rastro.js`), la
  dirección escrita se guarda para ese profesor. Solo si falta el correo de **un** tutor y en «Otro
  correo» hay **una** dirección: con dos y dos no se adivina cuál es de quién, y no se guarda nada.
- La siguiente vez sale ya puesta, con la línea «Correo de <Nombre>, escrito a mano el dd/mm/aaaa ·
  Cambiar». «Cambiar» vacía la caja para escribir otra, que sustituye a la anterior al enviar.
- Dónde se guarda: mira antes en `docs/contexto/PERSONAS.md` si ya hay un sitio para un dato
  escrito a mano de una persona que viene de un listado de Séneca. Si lo hay, ahí. Si no, fichero
  nuevo `_GESTOR/correos-a-mano.json` (`{ porClave: { <clave de la persona>: { correo, nombre,
  quien, cuando } } }`), con `_esquema`, por `ColaGuardado`, fundido por clave y dentro de las
  copias diarias. En esta fila solo lo usa el tutor del grupo.

### 1.5 Una plantilla de correo puede adjuntar sola un documento

- En el editor de una plantilla de correo (Ajustes → tipo de asunto → plantillas de correo,
  `js/plantillas-ajustes.js`), desplegable nuevo **«Adjuntar solo»**: «Nada» y los tipos de
  documento del centro. Se guarda en la plantilla como `adjuntar` (el nombre del tipo de documento).
- Al abrirse el cuadro de Correo con esa plantilla, o al elegirla en el desplegable, en «Documentos
  de este asunto» queda marcado el documento más reciente de ese tipo, además de los que ya vinieran
  marcados (sin repetir). «Más reciente»: la fecha de su nombre y, a igualdad, el número mayor. Si
  hay Word y PDF del mismo documento, el PDF. El tipo se saca del nombre con las funciones que ya
  leen nombres de documento (los de antes y los de la fila 239), no con una expresión nueva.
- Si en el asunto no hay ninguno, línea ámbar en ese bloque: «Esta plantilla adjunta el documento
  <TIPO>, y en este asunto todavía no hay ninguno.» No impide enviar.
- Al cambiar de plantilla, la app desmarca el que marcó ella sola (si el usuario no lo ha tocado) y
  marca el de la plantilla nueva. Lo que marcó el usuario no se toca.
- En el cuadro de Séneca no hay adjuntos: ese documento se señala como el que hay que adjuntar a
  mano (`documentoSeneca`, ya existe), si no venía ya otro señalado.

### 1.6 Los cambios de Diego, hechos por la app sola

Una pasada, una vez por centro, con el modelo de `js/plazos-del-centro.js` (enganchada por
`Gestor.alRefrescar`, marca guardada en el fichero que cambia, nunca con un guardado en marcha, y
saltándose si `SoloConsulta.activo()`). Módulo nuevo `js/informar-al-tutor.js`. También corre en la
copia de demostración.

1. **El tipo**: el de nombre corto `SANCION` (sin tildes ni mayúsculas) o nombre largo «Medida
   disciplinaria por conducta gravemente perjudicial». Si no está, la pasada no hace los puntos 2 a
   5, pero sí el 6.
2. **El hito**: en su guía, a cualquier profundidad, el paso cuyo título, sin mayúsculas ni tildes,
   es «notificar al tutor/a», «notificar al tutor» o «notificar al tutor o tutora». Pasa a llamarse
   **«Informar al tutor/a»**. Si viene de la biblioteca, su modelo no se toca.
3. **La plantilla de correo**, para ese tipo, si no hay ya una con ese nombre:
   - Nombre: «Informar al tutor/a de la sanción».
   - Texto (el saludo «Buenas:» y la firma «Un saludo…» los pone la app, no van en el texto):

     > Jefatura de Estudios entregará al alumno la notificación escrita para la familia.
     >
     > Esta comunicación es solo a efectos informativos para el tutor/a.

     Si los huecos de las plantillas de correo ofrecen la forma «el/la» según el sexo de la persona
     (como las de Word), «al alumno» se escribe con ella. Si no, «al alumno o alumna».
   - `adjuntar`: el tipo de documento del centro que, sin tildes ni mayúsculas, se llama
     `NOTIFICACION`. Si el centro no lo tiene, se deja escrito igual: valdrá cuando exista.
4. **La tarea de comunicar de ese hito**: la primera tarea con acción «Comunicar» pasa a tener
   «Tutor/a del grupo», vía correo y esa plantilla. Si el hito no tiene ninguna, se le añade al
   final «Enviar el correo al tutor/a», con esos detalles.
5. **Los asuntos abiertos de ese tipo**: sus hitos nacidos de ese paso (`origenGuia`) pasan a
   llamarse igual. Por la misma puerta que usa «Hito ▾» → «Cambiar» con «A la guía de <tipo>»
   (`js/hitos-desde-el-asunto.js`); no se escribe otra. El ARCHIVO no se toca.
6. **De paso, en todo el centro**: en los modelos de la biblioteca y en todas las guías, una tarea
   con acción «Comunicar» y sin «a quién» puesto, cuyo texto habla de la tutoría («tutoría», «tutor/a»,
   «tutor o tutora»), recibe «Tutor/a del grupo» (solo eso: ni vía ni plantilla). No se toca si el
   texto dice también «familia», «tutores legales», «tutor legal» o «dos tutorías». El mismo cambio
   va al modelo y a los pasos que vienen de él, para no crear diferencias nuevas entre guía y
   biblioteca. No sube la `revision` de ningún modelo ni enciende el aviso «ha cambiado en la
   biblioteca».
7. La pasada no avisa de nada en pantalla. Lo que cambia se cuenta en «Qué hay de nuevo».

Lo mismo del punto 6 se deja escrito en `datos-biblioteca/biblioteca-centro.json`, para quien
cargue la biblioteca desde cero.

## 2. Cómo hacerlo

- `TutorDelGrupo.deAsunto(a)` → `{ unidad, tutores: [{ nombre, clave, correos, aMano }], motivo }`.
  La usan `HitoMesaComunicar.candidatos` (casillas con id `tutoria0`, `tutoria1`…) y, a través de
  ellas, `HitoMesaRecetas.elegidosPara` y `HacerEsteHito`. Ningún otro sitio decide por su cuenta.
- El saludo y las dos líneas nuevas del cuadro llegan por `extra` de `CorreoNucleo.abrirCuadro`
  (como ya llegan `correoPreferente`, `plantilla` y `adjuntosMarcados`), puestos por
  `HitosComunicar.comunicar`. `js/correo.js` y `js/correo-cuadro.js` no buscan al tutor.
- La tabla TUTORIAS se lee por `TablasDatos` (tiene caché); no se abre el PDF otra vez.
- Un módulo nuevo no envuelve: se engancha por un punto previsto. Ningún fichero de `js/` pasa de
  600 líneas (`js/correo-cuadro.js` y `js/hacer-este-hito.js`: míralo antes de añadir).
- Textos de pantalla con `docs/VOCABULARIO.md`. Añade ahí la fila «tutor/a del grupo» (el profesor
  tutor de la unidad del alumno), para que no se confunda con «familia» (los tutores legales).
- Cambios quirúrgicos. Mientras se trabaja, solo las pruebas de lo tocado
  (`node pruebas/ejecutar.mjs receta comunicar tutor plantilla`); la pasada completa, una vez al
  final.

## 3. Datos de demostración (`js/demo/`)

- Una tabla TUTORIAS de este curso con: una unidad con un tutor que tiene correo en PERSONAL, otra
  con un tutor sin correo, otra con dos tutores en vigor y otra sin tutor.
- El tipo SANCION con una guía que tenga el hito «Notificar al tutor/a», con una tarea de comunicar
  sin detalles. Tres asuntos abiertos de ese tipo, uno por cada una de las tres primeras unidades;
  el primero con un PDF de tipo NOTIFICACION en su carpeta, el segundo sin él.
- Un asunto de otro tipo cuyo hito tenga la tarea «Avisar a la tutoría», sin detalles.

## 4. Ficheros que se tocan

- Nuevos: `js/tutor-del-grupo.js`, `js/informar-al-tutor.js` (y sus `<script>` en `index.html`, y
  en la lista de la copia sin internet si la hay)
- `js/hito-mesa-comunicar.js`, `js/hito-mesa-recetas.js`, `js/hacer-este-hito.js`,
  `js/hitos-comunicar.js`
- `js/correo.js`, `js/correo-cuadro.js`, `js/correo-adjuntos.js`, `js/correo-rastro.js`,
  `js/plantilla-de-lo-escrito.js`
- `js/guias-guion.js` (el rótulo), `js/plantillas.js` y `js/plantillas-ajustes.js` (`adjuntar`)
- `datos-biblioteca/biblioteca-centro.json`, `js/demo/`
- `js/novedades.js`: «El correo de un hito puede ir al tutor o tutora del grupo del alumno: la
  aplicación lo busca sola. Y una plantilla de correo puede adjuntar sola un documento.»
- Pruebas nuevas (apartado 5) y las de hoy que lean «La tutoría» o el nombre «la tutoría»
  (`pruebas/hitos-recetas.mjs`, `pruebas/comunicar-desde-hito.mjs`,
  `pruebas/mesa-comunicar-del-paso-y-guion.mjs`, `pruebas/hacer-este-hito.mjs`)
- `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/TABLAS-DE-DATOS.md`, `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo),
  `docs/VOCABULARIO.md`, `docs/HISTORIA.md`

## 5. Pruebas

`pruebas/tutor-del-grupo.mjs` (la regla, pura):

1. Unidad con un tutor en vigor: devuelve ese, con su correo de PERSONAL.
2. Las tres maneras de escribir la misma unidad casan; «A» y «B» no.
3. Un tutor que cesó ayer no sale; uno que empieza mañana, tampoco; sin `hasta`, sale.
4. Dos en vigor: salen los dos.
5. Filas de otro curso o del bloque de Pedagogía Terapéutica: no cuentan.
6. Tercero que no es de ALUMNADO, asunto de grupo, alumno sin unidad, sin tabla: lista vacía y su
   motivo.
7. Tutor sin correo en PERSONAL y con uno recordado: sale el recordado, marcado como escrito a mano.

`pruebas/correo-al-tutor.mjs` (en el navegador, con la demostración):

8. La tarea con «Tutor/a del grupo» abre el cuadro con el correo del tutor, el saludo «Buenas:» y
   su nombre en la constancia; lo mismo desde «Hacer este hito».
9. Sin correo: sale la línea, se escribe uno, se envía, y al abrir otra vez viene puesto; con
   «Cambiar» y otro envío, queda el nuevo.
10. Dos tutores sin correo y dos direcciones escritas: no se guarda ninguna.
11. Unidad sin tutor: línea ámbar y el cuadro se abre.
12. Plantilla con «Adjuntar solo»: marca el PDF más reciente de ese tipo; sin ninguno, línea ámbar;
    al cambiar de plantilla se desmarca el que marcó la app y no el que marcó el usuario.

`pruebas/informar-al-tutor.mjs` (la pasada):

13. Cambia el título del paso y el de los hitos de los asuntos abiertos, crea la plantilla y deja
    la tarea con sus tres detalles.
14. Segunda vez: no cambia nada (ni duplica la plantilla ni la tarea).
15. Sin el tipo o sin el hito: no falla y hace el punto 6.
16. Punto 6: «Avisar a la tutoría» recibe el detalle; «Avisar a las dos tutorías», «Enviarla a la
    familia» y una tarea que ya tenía «a quién» no cambian; ninguna `revision` sube.
17. Con «solo consultar» puesto, la pasada no escribe nada.

## Cómo sabemos que está bien

1. Abrir, en la copia de demostración, el primer asunto de SANCION: su hito se llama «Informar al
   tutor/a», no «Notificar al tutor/a».
2. Abrir ese hito y pulsar «Comunicar ▾»: entre los destinatarios sale una casilla con el nombre de
   un profesor y «(tutor/a de <unidad>)».
3. Pulsar ahí la tarea pendiente de comunicar: se abre el cuadro de Correo con la dirección de ese
   profesor, el saludo «Buenas:», el texto «Jefatura de Estudios entregará…» y el documento
   NOTIFICACION marcado entre los documentos del asunto.
4. Hacer lo mismo en el segundo asunto de SANCION: no hay dirección puesta, sale «No tengo el correo
   de <Nombre>. Escríbelo aquí y lo recordaré.» y, en los documentos, el aviso de que todavía no hay
   ninguna NOTIFICACION.
5. Escribir ahí una dirección, enviar, y volver a abrir el cuadro: la dirección viene puesta, con
   «escrito a mano» y «Cambiar».
6. Abrir el tercer asunto de SANCION y la misma tarea: salen las direcciones de los dos tutores.
7. Abrir un asunto de un alumno de la unidad sin tutor y preparar el correo al tutor del grupo: el
   cuadro se abre, con la línea «No sé quién es el tutor o tutora de <unidad>…».
8. Abrir Ajustes → el tipo SANCION → Guía → el hito «Informar al tutor/a»: en los detalles de su
   tarea de comunicar se lee «Tutor/a del grupo» y la plantilla «Informar al tutor/a de la sanción».
9. Abrir esa plantilla de correo en Ajustes: «Adjuntar solo» dice NOTIFICACION.
10. Abrir el asunto del otro tipo, su hito, «Comunicar ▾» y la tarea «Avisar a la tutoría»: el
    cuadro se abre con la dirección del tutor del grupo de ese alumno.
11. Pulsar el número de versión de la barra lateral: «Qué hay de nuevo» trae la línea del tutor del
    grupo.
12. **[SOLO FRANCISCO]** En el centro, abrir un asunto de SANCIÓN de verdad: el hito se llama
    «Informar al tutor/a» y, al preparar su correo, sale el tutor o tutora real del grupo de ese
    alumno (si no sale, mirar cómo escribe Séneca la unidad en la relación de tutorías y en el
    fichero de alumnado).

## Decisiones de la sesión (7-oct-2026)

- La plantilla dice «para el tutor o la tutora» y no «tutor/a»: con la barra, `Genero` cambiaría la palabra por el sexo del alumno. «Al alumno» se escribe «al/a la alumno/a» (forma doble que `Genero` resuelve; en la demostración los cuatro alumnos de SANCION llevan su sexo).
- La pasada solo crea la plantilla cuando encuentra el hito «Notificar al tutor/a» en la guía del tipo; sin él, solo hace el punto 6.
- Los asuntos abiertos se renombran con `HitosDesdeElAsunto.propagarCambio` y su nueva marca `soloTitulo` (solo el nombre, también en los que ya tienen trabajo); un hito anidado dentro de una respuesta se renombra en la guía pero no en los asuntos abiertos.
- Sin correo del tutor, las direcciones de la familia del alumno no salen marcadas de entrada (el aviso es para el profesor, no para la familia).
- Con el correo al tutor, el saludo es «Buenas:» también cuando no se sabe quién es.
- La demostración trae cuatro asuntos de SANCION (el cuarto, de Klein Soto, Ana, 1º C, para el caso «unidad sin tutor») y uno de INCIDENCIA DE AULA (también de Jimenez Rubio, Mateo, 4º A) con «Avisar a la tutoría». El tipo SANCION de la demostración es distinto del «Medida disciplinaria…» de la fila 297 (sin el hito «Notificar al tutor/a»).
