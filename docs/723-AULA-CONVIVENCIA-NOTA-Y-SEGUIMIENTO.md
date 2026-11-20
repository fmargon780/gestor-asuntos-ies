# 723 — Aula de convivencia: la nota a la familia y su seguimiento

**Título llano:** La nota a la familia cuando un alumno va al aula de convivencia, y su seguimiento
**Para qué:** que la nota que se manda a las familias se prepare, se firme, se registre, se envíe a los tutores legales y se siga hasta que la devuelvan firmada, sin que nada se olvide.
**Partes:** esta instrucción (la guía, los datos, los documentos y el correo) y «Crear varios asuntos desde el aviso de la intranet» (instrucción 724, detrás de esta).

## Lo que escribió Francisco

Aviso de usuario (idea 514, 5-nov-2026):

> Adjunto imagen de un tipo de asunto habitual en el centro. La expulsión al aula de convivencia.
> Me gustaría automatizar en la medida de lo posible todo lo que hacemos los administrativos en este procedimiento.
> Especial atención al tema de quién tiene la custodia del alumno.

Tema 581 (10-nov-2026): «que la guía de la expulsión al aula de convivencia lleve también la parte de Administración (aviso a la familia, firma, registro de salida, envío a los tutores legales y Séneca)».

20-nov-2026, hablando con Claude:

> «El correo que me pides es un aviso que no indica ni los alumnos ni el periodo de expulsión. No nos vale. Para saber esa información, una vez avisados, entramos en la intranet y miramos qué alumnos son los expulsados al aula de convivencia y sus fechas.»

> «No sabía que teníamos que grabar nada en Séneca, pero incluyelo. Así investigaré qué tenemos que hacer. Normalmente el aviso en la intranet incluye a varios alumnos. ¿Podríamos hacerlos en un asunto?»

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)

Visto en tres asuntos ya cerrados de este tipo (Drive de la cuenta común): la nota que se manda es la «Nota informativa a las familias sobre el aula de convivencia», con una segunda hoja, el «Compromiso de seguimiento del proceso educativo». La firma el Jefe de Estudios, en papel y con sello; se escanea, se registra de salida y la familia devuelve firmada la parte de abajo. Hoy no existe plantilla de ese papel en el centro, y los asuntos usan la guía genérica (Tramitar, Esperar respuesta, Archivar), sin datos. Francisco eligió que **Administración prepare la nota con la app** (Jefatura la sigue firmando).

- **Qué verá y hará quien use la app:**
  - El tipo de asunto «EXPULSIÓN AULA CONVICENCIA» (con esa errata; no se renombra aquí) pasa a ser «sin hitos» (fila 699). Solo cambian los asuntos nuevos; los abiertos siguen como están.
  - Cada asunto nuevo lleva dos datos del asunto: **«Primer día»** (fecha) y **«Días lectivos»** (número). Se piden al crear el asunto y salen en «Campos del asunto».
  - La guía del tipo es una lista de tres tareas, una por línea, sin rótulos:
    1. **«Nota a la familia»**: tarea de papel (fila 703). Se genera con la plantilla de abajo; firma Jefatura de Estudios; se registra de salida; se envía por correo a los tutores legales con el PDF registrado. El recorrido está en el tipo de documento **«NOTA AULA CONVIVENCIA»**: lo hacemos nosotros · se registra de salida · se envía por correo electrónico. La firma la dice la plantilla (regla ya aprobada: si la plantilla de documento dice una firma, manda sobre la del tipo): Jefatura de Estudios.
    2. **«Recibir la parte firmada y el compromiso»**: tarea de papel que llega (fila 703). Tipo de documento **«FIRMADO AULA CONVIVENCIA»**: nos llega · solo recibido (sin registro de entrada). Es una espera (fila 702): el día de volver a mirarlo lo propone la app (un día hábil desde que se envía la nota). Al llegar el día, el asunto vuelve a «En Administración» con «Reclamar a…».
    3. **«Grabar en Séneca la medida, con los días y las fechas»**: sin papel, una casilla que se marca a mano (quedan quién y qué día). Francisco investigará qué hay que grabar; la frase de la tarea se corregirá con lo que averigüe.
  - Dos plantillas nuevas, con los textos de `docs/723-TEXTOS-AULA-CONVIVENCIA.md`: el **Word** de la nota (dos páginas: nota y compromiso) y el **correo** a los tutores legales.
  - Quién tiene la custodia se ve junto a cada tutor en el correo (fila 578); el correo va a los tutores legales, a los dos si son dos.
- **Al entrar, la app añade sola todo esto al centro** (datos del tipo, guía, tipos de documento, plantillas), una vez, como hizo la fila 592. Si ya está, no lo toca.
- **Lo que desaparece:** en este tipo, la guía genérica de tres pasos (solo para asuntos nuevos; se guarda sin usarse, como manda la fila 699) y escribir a mano los días y las fechas dentro del documento.

## Pantalla de prueba

- Sin pantalla: lo nuevo es contenido (guía, datos, documentos y correo); lo que verá y hará quien use la app está escrito arriba y es lo que se aprueba (decidido por Francisco el 20-nov-2026).

## Qué NO se hace en esta tarea

- Crear varios asuntos a la vez desde el aviso de la intranet: instrucción 724.
- Reconocer el correo de la intranet: descartado, el correo no trae alumnos ni fechas.
- Arreglar la errata «CONVICENCIA» del nombre del tipo: va aparte, como IDEA.
- Dejar un asunto de grupo con varios alumnos: no sirve, porque «Recibir la parte firmada» y «Grabar en Séneca» serían una sola casilla para todos (decidido por Francisco el 20-nov-2026: un asunto por alumno).
- Controlar el compromiso firmado por separado de la parte de abajo: va junto en la tarea 2.
- Tocar BD Alumnado o el Centro de datos.

## No se habló y no está en la pantalla de prueba

Lo que Claude ha tenido que poner para que se pueda programar. No vale hasta que Francisco lo lea.

- Los dos tipos de documento nuevos se llaman «NOTA AULA CONVIVENCIA» y «FIRMADO AULA CONVIVENCIA». Los documentos de antes de este tipo se llamaban «COMUNICACION»; esos no cambian.
- «Recibir la parte firmada» se queda en «Recibido», sin registro de entrada. Si hay que registrarla de entrada, se cambia en el recorrido del tipo.
- El horario del aula en la nota es el de la nota de noviembre («de lunes a viernes, durante 5 horas diarias en horario de 9:30 a 15:00, incluyendo los recreos»); la de octubre decía «5 horas diarias además de los recreos».
- La parte de abajo de la nota nombra al **primer tutor legal** del alumno, como se hace hoy; con un solo tutor, a ese.
- Con 1 día, el texto sale «1 día lectivo» y el verbo concuerda («comenzará»).
- El texto del correo a los tutores es nuevo (está en `docs/723-TEXTOS-AULA-CONVIVENCIA.md`).

## Notas técnicas de Claude

- Mismo camino que la fila 592 (`docs/592-BAJA-MATRICULA.md`, «Notas técnicas»): datos del tipo, guía y plantillas viajan con la app (`datos-biblioteca/`, `plantillas/`) y una puesta al día de una sola vez, al entrar, los fusiona en `_GESTOR` con las reglas de `js/cargar-biblioteca.js` (fusiona, no pisa); respeta `SoloConsulta.activo()` y la cola de guardado. El tipo ya existe en el centro con el nombre «EXPULSIÓN AULA CONVICENCIA» (alias «EXPULSIÓN CASA»; en la biblioteca hay otro, «AULA CONVIVENCIA», desactivado: no tocarlo). Casar por ese nombre exacto, sin renombrar.
- Marcar el tipo «Sin hitos» y escribir su guía como lista de tareas: filas 699 y 701 (`js/asunto-sin-hitos.js`; `docs/699-ASUNTO-SIN-HITOS-PANTALLA.md`, `docs/701-GUIA-COMO-LISTA-DE-TAREAS.md`). Tarea de papel, espera y recorrido: filas 702 a 705 (`docs/692-documentos.md`, `docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md`). Si algo de lo acordado aquí no cabe en esos mecanismos tal como están, no inventes otro: apúntalo en la nota de la fila.
- «Cómo se hace» (fila 707): escribir una frase corta en cada tarea; la 3 puede decir «Francisco aún está averiguando qué se graba».
- Datos del asunto: por la lista única de campos (fila 528), grupo «Alumnado», origen manual, «se pide al crear» (fila 530, punto 8). «Primer día» de tipo fecha; «Días lectivos» de tipo número.
- Marcas de las plantillas: `{{MEMBRETE}}`, `{{NOMBRE}}`, `{{GRUPO}}` y `{{LUGAR Y FECHA}}` existen; el firmante por `{{FIRMANTE}}` / `{{CARGO FIRMANTE}}` con `firmante` de la plantilla igual a Jefatura de Estudios (mirar cómo se declara el cargo en `docs/contexto/DOCUMENTOS-PDF.md`, «Los cargos del centro»; si no existe el cargo «Jefe/a de Estudios», crearlo vacío: sin ocupante sale el hueco en amarillo como hoy). El primer tutor legal, con la marca que ya usan otras plantillas de alumnado. Crear las marcas que falten en la lista única de campos: «Primer día» con día de la semana («lunes 9 de noviembre»), y la duración («3 días lectivos» / «1 día lectivo», con el verbo que concuerde).
- El Word se construye con el aspecto de las demás plantillas de `plantillas/` (membrete, firma), no copiando el escaneo.
- Destinatarios del correo por papeles (tema 487): familia → tutores legales. Adjunto: el PDF registrado.
- Añadir el caso a la demostración (un asunto de este tipo, sin hitos, con la nota generada) y a `docs/CASOS-DE-PRUEBA.md`. Línea en `js/novedades.js`. Ficheros de código por debajo de 400 líneas, apuntados en su `js/cargar-piezas-N.js`.

## Cómo lo comprueba el segundo revisor

- En la demo, el tipo «EXPULSIÓN AULA CONVICENCIA» está marcado «Sin hitos» y un asunto viejo del tipo se sigue abriendo con sus hitos.
- «Nuevo asunto» con un alumno y ese tipo pide «Primer día» y «Días lectivos»; los dos salen luego en «Campos del asunto».
- El asunto nuevo enseña las tres tareas, en ese orden y sin rótulos.
- Con los dos datos vacíos, «Nota a la familia» sale en amarillo con «Falta: Primer día» y «Falta: Días lectivos».
- La nota generada lleva todos los textos de `docs/723-TEXTOS-AULA-CONVIVENCIA.md`, sin `{{` ni `{si:` sueltos, con el nombre, el grupo, la duración, el primer día con su día de la semana y el primer tutor legal.
- Con «Días lectivos» = 1, el texto dice «1 día lectivo» y «comenzará».
- La segunda hoja de la nota es el compromiso, con el nombre del alumno.
- El correo propone a los tutores legales (los dos, si hay dos) con el PDF adjunto.
- «Recibir la parte firmada» pasa a esperando al enviar la nota, con un día de volver a mirarlo.
- «Grabar en Séneca» se marca a mano y deja quién y qué día.
- Al entrar dos veces, no se duplica nada (datos, tareas, tipos de documento ni plantillas).

## Qué mirar al terminar

- Crea un asunto de «EXPULSIÓN AULA CONVICENCIA» con un alumno: mira que pide el primer día y los días.
- Genera la nota y léela entera, las dos hojas.
- Cambia los días a 1 y vuelve a generarla: mira que dice «1 día lectivo».
- Pásala al correo: mira que propone a los tutores legales.
- Abre un asunto viejo del tipo: mira que sigue igual.

## Revisión y respuestas durante el trabajo

- Segundo revisor (20-nov-2026, agente nuevo, navegador en local, `?demo=1&auto=1&aula=1`): APROBADA a la primera.
  - Tipo con su lista de tres tareas y asunto viejo con sus hitos: coincide (Ajustes dice «Guía (3 tareas)», no el rótulo «Sin hitos»).
  - «Nuevo asunto» pide «Primer día» y «Días lectivos», y salen en «Datos»: coincide.
  - Tres tareas en su orden, sin rótulos: coincide. Nota completa con las dos hojas, sin marcas sueltas, «3 días lectivos», «lunes 23 de noviembre», «1 día lectivo» y «comenzará»: coincide.
  - Correo a los tutores legales con la plantilla y el documento adjunto: coincide, con reservas: no pudo ver dos tutores (la demo trae un correo) y lo adjunto es el Word, no un PDF (en la demo no hay PDF sellado).
  - Tras enviar, «Recibir la parte firmada» queda «Esperando a Familia · volver a mirarlo el 23-nov»: coincide. «Grabar en Séneca» a mano con quién y día: coincide. Consola sin errores: coincide.
- **No se hace (no cabe en los mecanismos actuales):** la tarea «Nota a la familia» en amarillo con «Falta: Primer día» y «Falta: Días lectivos». Hoy esos datos salen en «Faltan datos» al generar la nota. Hacerlo pide un mecanismo nuevo (datos de fecha y número rellenables desde la tarea): idea aparte.
- **Para Claude, lo que hizo la app sin pedirlo el texto:** la espera de «Recibir…» al enviar la nota usa un flag `esperaAlEnviar` en la tarea de la guía (`js/papel-espera-recibir.js`), sin pantalla para ponerlo: solo lo lleva esta guía. El generador de `.docx` admite `===` (salto de página) y las plantillas de correo `adjuntar`.
- Observaciones del revisor: el compromiso lleva «Alhaurín el Grande» fijo (como en el escaneo; la primera hoja usa el lugar del centro); «Poner a la firma» dice «jefatura-estudios» en la demo porque no hay cargo puesto (con el cargo de verdad sale su nombre); «Registrar» y el envío real quedan para el instituto (`docs/COMPROBAR-A-MANO.md`). Con un tutor sin nombre en los datos, «D./Dña. ___» queda en blanco y la app avisa.
- Pasada completa: 417 de 417. `plantillas/indice.json` se editó a mano (solo las dos entradas nuevas): regenerarlo con `scripts/hacer-plantillas.mjs` cambiaría `CERTIFICADO`→`CERTIFICACION` en una plantilla vieja (de la fila 698), pendiente de revisar.
