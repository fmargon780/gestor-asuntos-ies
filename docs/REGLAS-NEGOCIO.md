# Reglas del negocio del Gestor de Asuntos

Decisiones de Francisco ya tomadas, para que ninguna conversación nueva las contradiga
(`docs/METODO-FICHA.md`, «Reglas del negocio»). Cada una con su fecha y de dónde sale.

## Guías

- (25-oct-2026, tema 448) Hay **un solo editor de la guía** en toda la app: también «Abrir en la
  guía» desde un asunto lleva a él, con la tarea abierta.
- (25-oct-2026, tema 448) Hay **un solo editor de plantillas**: desde la guía se abre ese mismo
  («Ver y cambiar el texto»), no uno propio.
- (25-oct-2026, tema 448) Se quedan **las dos maneras de mandar un correo** desde una guía: la tarea
  «Comunicar» (a quien se elija, durante el hito) y el aviso «Al terminar este hito, avisar a quien
  lo pide» (a quien encargó el asunto, al marcar el hito hecho). No se juntan.
- (25-oct-2026, tema 448) Los hitos y tareas que dividen el trámite en caminos según una respuesta se
  siguen llamando **«pregunta»**. Cambiar el nombre sería una idea aparte.

- (5-nov-2026, tema 516) Cada tarea de generar, firmar o registrar lleva **colgado su documento** («poder ver colgado de la tarea del hito el documento involucrado»), y solo se marca sola con él. El documento es del asunto, no de la guía.
- (5-nov-2026, tema 516) Una tarea hecha muestra **la versión con la que quedó** el documento, porque «ya no es igual al de la tarea anterior».
- (5-nov-2026, tema 516) Una tarea creada en el hito se configura **igual que en la guía** («Qué se hace»): «es fundamental poder crear desde un asunto concreto la guía de ese tipo de asuntos para el futuro, así como modificarlo».
- (5-nov-2026, tema 516) **Se avisa, no se impide:** al marcar el hito, archivar o enviar, sale lo que falta por firmar o registrar y se puede seguir. Solo cuenta lo que hay que firmar o registrar.
- (5-nov-2026, tema 516) **El hito no se cierra solo:** con todo hecho se resalta «Marcar como hecho».
- (5-nov-2026, tema 516) Una tarea de firmar puede pedir **varias firmas**, y se marca al llegar a ese número.

- (10-nov-2026, idea 576) Hitos y tareas se condicionan con **«Solo si» un campo de lista del asunto**, no con hitos-pregunta: «lo veo mucho más natural». Todos los hitos en una sola lista que se ordena con las flechas.
- (10-nov-2026, idea 576) Con el campo vacío salen todos en amarillo con «Falta: <campo>», como los textos condicionales; lo ya hecho no desaparece al cambiar el campo («me encaja mucho»).
- (10-nov-2026, idea 576) Las guías con preguntas las pasa la app sola: cada pregunta a campo de lista y sus hitos con «Solo si»; en los asuntos abiertos el campo queda con la respuesta elegida («me encaja»).

## Plantillas

- (4-nov-2026, fila 510) Las variantes de un documento se resuelven con **textos condicionales**
  (párrafos que salen o no según un campo de lista del asunto), no con campos cuyas opciones son
  frases enteras. Valen para Word y para correo.
- (4-nov-2026, fila 510) Con el campo vacío salen **todos** los textos condicionales que dependen
  de él, en amarillo, para que nadie firme sin elegir.
- (4-nov-2026, fila 510) Nombres en toda la app («cuida la coherencia en la nomenclatura»):
  **campo variable** (antes «hueco»), **texto condicional** y **campo del asunto**. Los botones van
  en un recuadro **«Insertar»** con «Campo variable» y «Texto condicional».

## Campos, tareas e hitos

- (5-nov-2026, tema 518) Hay **una sola lista de campos** para todo: «un sistema para manejar todos los campos posibles [...] y usarlos allá donde nos haga falta».
- (5-nov-2026, tema 518) De cada campo se ve **su tabla y su columna de origen**: «es fundamental saber la tabla de origen del dato».
- (5-nov-2026, tema 518) **El grupo dice de qué trata el dato; el origen, cómo llega.** No hay grupos de calculados ni de manuales.
- (5-nov-2026, tema 518) **Cuándo se pide un dato no se decide en el campo:** se decide «en ese momento y lugar donde tenemos la necesidad del campo», desde el asunto, para este asunto o para los siguientes.
- (5-nov-2026, tema 518) **Un asunto es un solo hecho:** «Se hace un asunto por cada expulsión. Y esta es la norma general». Cada dato tiene un valor por asunto; lo escrito al generar se guarda en el asunto.
- (5-nov-2026, idea 525) **El campo Grupo sale de la unidad del alumno** si el asunto no trae grupo propio; de baja, su última unidad. Aceptado por Francisco: «Adelante».
- (5-nov-2026, tema 518) Un campo de la parte general para los siguientes asuntos **se elige si se pide al crear** o no (opción 2).
- (5-nov-2026, tema 518) Las **tareas** salen de una lista común, o se crean ahí mismo con su plantilla. Una tarea es **una sola y cada guía la usa**: si se cambia, cambia en todas («1, claramente»), avisando antes.
- (5-nov-2026, tema 518) Los **hitos** se comparten **enteros**, con sus tareas (opción 1). El plazo y el lugar en la guía son de cada guía. Los otros asuntos abiertos no cambian.
- (5-nov-2026, tema 518) Lo que hace una tarea sale de una lista fija; un comportamiento nuevo es trabajo de programación.
- (5-nov-2026, tema 518) Las guías actuales se pasan **con Claude**: «preferiría hacer esto ayudado por tí».
- (6-nov-2026, idea 538) **Al pasar las guías (fila 532) se quita también la caja «Nueva tarea…» del asunto**: queda solo «+ Añadir tarea». Hasta entonces conviven.
- (6-nov-2026, idea 538) **«Cambiar la tarea» va en el ⋮** de la tarea, no como botón visible, aunque la pantalla aprobada lo traía visible.
- (6-nov-2026, idea 538) **Añadir no es cambiar:** un hito nuevo en la guía llega también a los asuntos abiertos de ese tipo; cambiar una tarea o un hito no les llega.
- (6-nov-2026, idea 538) **Lo creado «solo este asunto» no entra en la lista común** («Lo cambiamos así», fila 539).
- (6-nov-2026, tema 540) **Las guías generales no sirven a Administración:** «casi todas esas guías no nos están sirviendo para nada más que confundirnos». Los tipos sin usar se desactivan con su guía, y solo se pasan a las listas las guías que quedan.
- (6-nov-2026, tema 540) **La pantalla «Tipos y su uso» es temporal:** «Esto es solo para el proceso de "limpieza"». Se quita al terminar.
- (6-nov-2026, tema 540) Al desactivar un tipo que se repite solo, **la app solo avisa** («Me parece bien»).
- (6-nov-2026, tema 550) **Al unir tareas no se pierde nada:** las explicaciones y normativas distintas se juntan; las de plantilla distinta quedan separadas. Las tareas de las preguntas y la guía de un tipo que se active después pasan a las listas con las mismas reglas («Adelante según tus propuestas»).
- (6-nov-2026, tema 550) **La carpeta de destino es una tarea, no un ajuste del tipo:** «Copiar a otra carpeta» copia sola el registrado, con nombre de campos; sin permiso, avisa y pide permiso; nunca pisa un fichero, añade « (2)».

- (6-nov-2026, idea 553) Las tareas de un asunto se pueden **subir y bajar**, «con la opción de guardar ese cambio en la guía». Guardarlo en la guía no cambia los asuntos abiertos.
- (6-nov-2026, idea 553) «Cambiar la tarea» deja cambiar también **«Qué se hace»**, en todas las guías que la usan; los asuntos abiertos siguen como estaban.
- (6-nov-2026, idea 553) **Los hitos se añaden desde la tira de hitos**, no desde las tareas, y la ventana pregunta dónde situarlo, «con al final por defecto». «Hito ▾» ya no tiene «Crear».
- (13-nov-2026, tema 630; sustituye a la del 6-nov-2026, idea 553, de los cuatro recuadros) El hito ya no lleva los recuadros Tareas, Campos, Documentos y Registro: queda solo con sus tareas. Ver «Vista del asunto».

- (11-nov-2026, tema 582) En los desplegables de hitos y tareas que son listas del centro (Responsable, «Esperamos a…», Tipo de documento, «Cuándo se hace» y Plantilla), **lo que falta se crea ahí mismo con «+ Nuevo…»** y queda en su lista para todos: «Debería poder crear ese valor desde el mismo proceso de trabajo». La plantilla nueva también («1»).
- (11-nov-2026, tema 582) **«Sus profesores» es un responsable fijo**, como «El tutor del alumnado», en vez de escribir «Equipo educativo» como un nombre más («1»).
- (11-nov-2026, tema 582) Al crear con «+ Nuevo…», **el aviso de parecidos solo mira la lista de ese desplegable**; que busque en todo lo que la app conoce queda como idea 616 («No lo termino de ver claro»; eligió la 1).

## Correo

- (27-oct-2026, tema 469) La actualización del script de Gmail la hace **solo Francisco**: los
  avisos sobre el script pueden ser cortos.
- (27-oct-2026, tema 469) El enlace al código del script en GitHub **se copia, no se abre**: la app
  se usa con cuentas g.educaand.es y el repositorio es de su cuenta personal de gmail.com; él lo
  pega en el Chrome de esa cuenta.
- (27-oct-2026, tema 469) El enlace al proyecto de Google es la **lista de proyectos** de
  script.google.com (con la cuenta de Administración); no se guarda en Ajustes la dirección exacta
  del proyecto.

- (28-oct-2026, idea 480) Gmail refleja lo que pasa en la app: el correo que llega se queda en
  recibidos **sin leer** y sale en «Ha llegado»; al meterlo en un asunto se marca **leído** y sigue en
  recibidos; al **archivar el asunto** se archivan en Gmail sus correos. Vale para correos nuevos y
  respuestas.
- (28-oct-2026, idea 480) Las respuestas a un correo que ya está en un asunto también pasan por
  «Ha llegado» hasta que alguien las mete en su asunto.
- (28-oct-2026, idea 480) Descartar un correo lo marca **leído y lo archiva** en Gmail.
- (28-oct-2026, idea 480) Meter una respuesta en un asunto archivado **lo reabre**, y sus correos
  vuelven a recibidos.
- (28-oct-2026, idea 480) La etiqueta de Gmail de lo recogido se llama **«En la app»** (antes
  `GESTOR/Hecho`).

- (6-nov-2026, tema 487) **Un correo solo va a gente ligada al asunto:** el interesado, sus tutores legales, su tutor de grupo, sus profesores, quien lo pide, los relacionados y las listas del personal. «Si necesitara enviar la comunicación a Servicios Sociales, tendría que relacionar a ese tercero con el asunto, si no no debería dejarme.»
- (9-nov-2026, idea 562) Sigue sin poderse escribir a una dirección suelta: cuando no se encuentra a nadie, el aviso lleva el botón para **relacionarlo con el asunto** (y darlo de alta si hace falta) sin salir del correo.
- (9-nov-2026, tema 564) **«Sus profesores» son solo los de las materias del alumno**, no todos los del grupo; en un asunto de grupo salen todos los del grupo (opción 1, «en esta idea»). El papel de la plantilla se llama «Sus profesores».
- (10-nov-2026, fila 578) **Los correos van a los tutores legales**, no solo a quien tiene la custodia: «el envío debe enviarse a los tutores con la patria potestad».
- (10-nov-2026, fila 578) **Quién tiene la custodia se ve junto al tutor** en toda la app, sacado de la columna «Custodia» del listado de Séneca: «al ver o elegir un tutor legal de un alumno se pudiera ver quien tiene la custodia». La ven también los directivos («No es necesario no mostrar a los directivos quien tiene la custodia»). Elegirla a mano en el asunto queda solo para cuando Séneca no la dice.
- (6-nov-2026, tema 487) **Los destinatarios se buscan escribiendo** en Para, Copia y Copia oculta, no en una lista a la vista: «prefiero un sistema en el que el usuario toma la iniciativa de buscar lo que necesita».
- (6-nov-2026, tema 487) Los dos tutores legales salen siempre, con **«tiene la custodia»** junto al que la tiene; quien escribe elige uno o los dos.
- (6-nov-2026, tema 487) Se puede escribir **otro correo de una persona solo para un envío** (opción 2); el guardado no cambia.
- (6-nov-2026, tema 487) **Los destinatarios propuestos van en la plantilla** (Para, Copia y Copia oculta, por papeles); la tarea de la guía solo elige plantilla (opción 1). Se pueden cambiar en cada envío.
- (6-nov-2026, tema 487) Las listas del personal (Ajustes › Grupos) **pueden ir en Para, Copia o Copia oculta**, cada una por separado. Salen solo las que tienen solo personal del centro.
- (6-nov-2026, tema 487) **En un asunto de grupo, las familias van siempre a Copia oculta** (opción 1).
- (6-nov-2026, tema 487) La plantilla de correo lleva **su saludo y su firma**; vacíos, salen el de siempre y la firma de Ajustes.
- (6-nov-2026, tema 487) Las plantillas viejas **se pasan solas**, sin lista de revisión (opción 1). «Comunicar ▾» del hito **pierde las casillas** de destinatarios (opción 1).
- (12-nov-2026, idea 618) Cuando no llegan correos, el aviso manda **primero a comprobar la carpeta de correos** de ese ordenador y después al script: «El arreglo está hecho y ha funcionado. Ese era el problema» (Drive había cambiado de sitio y la app miraba la carpeta de antes).

- (12-nov-2026, tema 623) **El asunto de correos y mensajes de Séneca lo compone la app**, ya no es el nombre de la carpeta (sustituye a la fila 55): hay un asunto general del centro y cada plantilla puede llevar el suyo («Me parece buena idea tener un asunto general que pueda ser personalizable para las plantillas de correo y de Séneca»). Se sigue pudiendo retocar antes de enviar.
- (12-nov-2026, tema 623) **El número del asunto va siempre** en el asunto y en el extracto; si el modelo no lo lleva, la app lo añade al final (elegido «al final en los dos», sabiendo que en un asunto largo puede quedar cortado a la vista). Los asuntos de antes, sin número, siguen con el nombre de la carpeta.

## Registro de Séneca

- (27-oct-2026, tema 477) El registrado se guarda **con el «Ruta» de siempre** del documento, sin
  botón nuevo: la copia del original se hace por dentro al pulsarlo.
- (27-oct-2026, tema 477) Cuando llega el registrado encima, la app **lo resuelve sola y avisa**, sin
  preguntar.
- (27-oct-2026, tema 477) Si lo que llega encima **no trae sello, se deja** y el original pasa a
  versiones previas: la app nunca deshace lo que se guardó (por ejemplo, un firmado).
- (27-oct-2026, tema 477) Lo que llega **ya registrado por la bandeja electrónica** sigue entrando
  por la carpeta y «Es un documento nuevo».
- (12-nov-2026, tema 623) **El extracto del registro lo compone la app** y es distinto del asunto: puede tener varias líneas y hay uno general y **uno por tipo de documento** («El extracto de una factura de proveedor no puede ser el mismo que el de un certificado de matrícula»). No se personaliza por plantilla. Se copia con el botón «Extracto» de cada documento y se pega en Séneca a mano.

## Documentos firmados

- (5-nov-2026, tema 392) La app **reconoce la firma y cuenta las firmas**, sin comprobar si es válida ni quién firma. Un documento con dos pone «Firmado (2)» (Francisco eligió tratarlo en esta idea).
- (5-nov-2026, tema 392) Un firmado guardado encima se reconoce **solo y avisa**, igual que un registrado; un firmado con otro nombre pregunta de qué documento es.
- (5-nov-2026, tema 392) Si llega algo sin firma encima de un firmado, **la app pregunta** con qué se queda («No me convence este comportamiento»; eligió la opción 2): nunca se cambia un firmado sin que alguien lo diga.
- (5-nov-2026, tema 392) Se hace en dos partes: primero reconocer la firma; la tarea «firmar» en las guías va aparte (idea 513).

## Nuevo asunto y altas de personas

- (29-oct-2026, tema 486) En «Nuevo asunto», al elegir un tipo o una persona, el cursor salta solo al
  **siguiente hueco que falte** (persona, tipo, datos del asunto, «Crear el asunto»), en los dos
  caminos, y ese hueco se ilumina un instante. Nunca se mueve mientras se escribe.
- (29-oct-2026, tema 486) Las personas de **Alumnado y Personal** se dan de alta y se cambian con dos
  casillas, **«Apellidos» y «Nombre»**; la app pone la coma. Lo guardado sigue siendo
  «Apellidos, Nombre» en una sola línea. Empresas, Otros y Administraciones siguen con su casilla.
- (12-nov-2026, tema 602) En «Nuevo asunto» quedan **fijos solo la fecha de inicio, el tipo y el tercero**. Año académico, descripción corta, fecha límite, quién lo pide y por qué vía son campos de la lista única, y cada tipo elige si los pide al crear. **El día del cambio no los pide ningún tipo** (eligió «1», sabiendo que los asuntos nacen sin plazo ni «quién lo pide» hasta marcarlo tipo a tipo).
- (12-nov-2026, tema 602) Disposición de «Nuevo asunto»: fecha, tipo y tercero **en una sola fila**, cada uno en su recuadro, la fecha estrecha a la izquierda («Yo pondría la fecha arriba a la izquierda»; «pondría alguna línea para separar o un relieve»; de la fila de tres: «Así me convence más»). Las clases de tercero, en botones pequeños («En esta idea»).
- (12-nov-2026, tema 602) En «Nuevo asunto» los tipos salen **sin rótulos de departamento** y **sin desplegable de unidad**: «Quitalos. También la unidad»; «Lo de la unidad de antes no hace falta porque ya tenemos la opción de que es para un grupo de personas».
- (12-nov-2026, tema 602) **La vista del asunto se rehace en su propio diseño** (idea 622), no quitando repeticiones: «Tremendamente recargado. No invita a pensar y veo difícil encontrar nada si no te conoces el asunto de memoria. Tampoco veo un flujo de trabajo claro». Lo ya decidido para ese diseño, en `docs/notas-diseno/622.md`.

## Tipos de asunto y clases de tercero

- (30-oct-2026, tema 492) Un tipo de asunto admite **una o varias clases de tercero**, marcadas en
  sus Ajustes («Yo prefiero la 2»: no se duplica el tipo por clase). Al crear un asunto, el tercero
  se elige **solo entre las clases permitidas** del tipo.
- (30-oct-2026, tema 492) En «Nuevo asunto» **no hay pastilla «Todas»**: sin ninguna pulsada salen
  las clases permitidas; una pastilla se fija pulsándola y se suelta pulsándola otra vez.
- (10-nov-2026, tema 502) En «Cambiar el asunto», el aviso ámbar de tercero de otra clase sale
  solo si la clase del tercero no es **ninguna** de las clases permitidas del tipo («Estoy de acuerdo»).
- (10-nov-2026, tema 490) Al cambiar el nombre de un tipo de asunto que tiene nombre corto, el mismo cuadro deja cambiar o vaciar el nombre corto, y las carpetas abiertas de ese tipo pasan a llevar el que le toque; si no tiene nombre corto, no se le ofrece ponerle uno ahí («Ok. Me parece bien»). El arreglo de las carpetas que se recortaban mal va en la misma tarea (elegido por Francisco).

## Libros de texto

- (4-nov-2026, tema 363) La ficha de entrega lleva **las asignaturas de la matrícula de cada alumno**, cruzadas con el listado de libros, no una lista fija por nivel.
- (4-nov-2026, tema 363) **Ningún tutor sale impreso** en la ficha: «no sabemos quien de los dos tutores va a firmarlo». Lleva una tabla en blanco de dos líneas y «Basta con la firma de uno de ellos.»
- (4-nov-2026, tema 363) Si se pierde la ficha se genera un **duplicado por extravío**: dice la fecha de la entrega original y se firma con la de hoy.
- (4-nov-2026, tema 363) Si una asignatura de la matrícula no está en el listado, la ficha de ese alumno **no se genera** («Debería impedirlo»). En un grupo salen las demás.
- (4-nov-2026, tema 363) **En Bachillerato no hay ficha:** «el centro no entrega los libros, los compra el alumnado directamente».
- (4-nov-2026, tema 363) La entrega de septiembre va en asuntos de grupo, por unidad o por nivel, según se elija cada vez.

## Centro de mando

- (4-nov-2026, tema 504) Las filas DEVUELTA cuentan en «En cola». Llegan arriba, pero llevan flechas: Francisco decide el orden completo y puede poner una PENDIENTE delante («siempre podemos cambiar el orden de las filas en la cola con los botones»).
- (4-nov-2026, tema 504) En la tabla de entrada, el número de devueltas va «en rojo y entre paréntesis» junto al de «En cola», con una leyenda abajo que lo explica.

## Tamaño de los ficheros

- (5-nov-2026, tema 534) No se parten todos los ficheros largos a la vez: se parten los 10 de más de 600 líneas y `js/hitos-guion.js`, en dos tareas; los demás de más de 400, cuando se toquen («Hagámoslo como tú propones»). Si al empezar la 536 hay otro de más de 600, se parte también («Añádela»).

## Registro de documentos

- (9-nov-2026, fila 566) Tras registrar, el documento registrado se queda siempre en la carpeta del asunto, con su «Ruta»; a versiones previas solo va el original sin sellar, si es otro fichero («Estoy de acuerdo»).

- (9-nov-2026, tema 517) Cada documento registrado guarda **su fecha de registro**, aparte de la suya: del sello al registrar o, sin sello, del listado de Séneca; si no coinciden, manda el listado. **Nunca se escribe a mano** («Vale, de acuerdo. Juntamos las dos»).
- (9-nov-2026, tema 517) La fecha de registro va en las plantillas (marca «fecha de registro») y los plazos de la guía eligen «desde que se hace» o «desde su registro»; las guías de antes siguen «desde que se hace» (eligió tratarlo en esta idea, opción 1; «Me parecen bien tus propuesta»).

## Elecciones al Consejo Escolar

- (9-nov-2026, tema 570) Las papeletas salen de la tarjeta «Candidaturas» del asunto de las elecciones, no de la pantalla de Etiquetas, con las candidaturas admitidas de los cuatro sectores («1»: también madres y padres y PAS).
- (9-nov-2026, tema 570) Un PDF por sector; hasta 8 candidatos, 10 papeletas por hoja, y con más, 8, sin poder cambiarlo («Prefiero la 1, el problema del corte se soluciona sacando un pdf por cada sector y cortandolos por grupo»).
- (9-nov-2026, tema 570) Las cruces las pone la app por la norma, tantas como puestos a cubrir, y una casilla dice si la AMPA ha designado representante («Si podemos evitar que el usuario tenga que contestar a esa pregunta, pues mejor»; «Hazlo así»).
- (9-nov-2026, tema 570) La candidatura presentada por la AMPA lleva su nombre al lado en la papeleta, sin cruz puesta (Orden de 7-oct-2010, art. 9.1.c); el representante designado por la AMPA no sale en la papeleta.
- (10-nov-2026, fila 575) Este año la persona designada por la AMPA sale en la papeleta de madres y padres con la cruz ya puesta y «Marca hasta N cruces más», como en años anteriores, aunque la norma no lo pide («Yo este año soy un recién aterrizado y no quiero cambiar demasiadas cosas. Elijo la opción 1. Dentro de dos años […] propondré hacerlo conforme al estricto cumplimiento de la norma»). Sustituye, solo para la persona designada, a la regla anterior de la candidatura de la AMPA sin cruz.

## Bajas del alumnado

- (10-nov-2026, tema 519) El tipo «BAJA» pasa a llamarse **BAJA MATRICULA**, para no confundirlo con otras bajas; es distinto de la anulación de matrícula, que tiene su tipo («Pues me parece bien tu idea si en vez de Baja lo llamamos BAJA MATRICULA»).
- (10-nov-2026, tema 519) Un solo tipo para todas las bajas de matrícula, con el dato «Motivo de la baja» y los pasos de cada motivo con «Solo si»; el primero, «Traslado al extranjero» (ESO). Los demás supuestos en que un alumno deja el centro durante el curso se diseñan uno a uno (filas 586 a 591) («debemos diseñar todos los supuestos en los que un alumno deja de ser alumno del centro durante el curso»).
- (10-nov-2026, tema 519) La guía cubre solo la parte de Administración: recibir el encargo de Dirección, preparar la resolución, firma de Dirección, registro de salida, baja en Séneca y comunicar (familia y, si se inició el protocolo de absentismo, Servicios Sociales) («Solo nuestra parte»).
- (10-nov-2026, tema 519) Los anexos I y II son plantillas del tipo para sacarlas cuando Dirección las pida, no pasos de la guía; lo que rellena la familia va como líneas en blanco.

## Carpetas en Google Drive

- (11-nov-2026, tema 607) **Todo el Gestor pasa a Google Drive** (asuntos vivos, ARCHIVO, `_GESTOR` y la copia sin internet), nada se queda repartido: «no veo bien tener unas cosas en un lugar y otras en otro». No se comprime el ARCHIVO (ahorraría un 13 %).
- (11-nov-2026, tema 607) En los ordenadores del instituto, Drive va en **«Replicar archivos» con la carpeta en `C:\Google Drive`**, la misma en los dos, para tener un solo marcador. El modo «Ver archivos sin descargarlos» se descartó: más lento.
- (11-nov-2026, tema 607) **Cuando falte espacio** en la cuenta común (50 GB), que lo amplíe la Junta o, si no, el centro.

## Vista del asunto

- (13-nov-2026, tema 630) La vista del asunto se rehace entera: estaba «tremendamente recargado. No invita a pensar y veo difícil encontrar nada si no te conoces el asunto de memoria. Tampoco veo un flujo de trabajo claro».
- (13-nov-2026, tema 630) **Todo documento y toda comunicación salen de una tarea**; en el hito no quedan botones sueltos («el hito pasaría a ser una mera estructura a la que colgar tareas»; «tarea y acción son casi sinónimos»). También desaparece «Hacer este hito».
- (13-nov-2026, tema 630) El documento se ve colgado de su tarea: «en la tarea es necesario para poder usarlos en las acciones que esas tareas conlleven».
- (13-nov-2026, tema 630) Al añadir una tarea, queda en la lista y no se abre ninguna ventana; después se pulsa su botón (cuesta una pulsación más).
- (13-nov-2026, tema 630) El responsable no se enseña en la vista del asunto cuando el hito es de Administración, ni se distingue entre Francisco y Diego; si es de otro, «Le toca a: …». En el resto de la app sigue.
- (13-nov-2026, tema 630) Del menú del hito se quitan «Dejarlo solo informativo» (sigue en la guía) y «Enviar estado»: «No recuerdo haberlos usado nunca».
- (13-nov-2026, tema 630) Cabecera de una línea con tipo, número y tercero; el nombre de la carpeta deja de ser el título. Fuera las seis pestañas: cinco bloques plegados a la derecha. «Datos» (nombre elegido por Francisco) junta datos y contacto, campos del asunto y «El encargo»; «Quién lo pide» y «Por qué vía» salen con los campos, solo si están rellenos o el tipo los pide.
- (13-nov-2026, tema 630) **Para añadir un documento hace falta hito y tarea**: «Yo obligaría a crear el hito y la tarea también para poder añadir un documento al asunto». La app pregunta «¿De qué tarea es?» y ofrece crear una tarea nueva con el nombre del tipo de documento.
- (13-nov-2026, tema 630) Los ficheros que llegan solos a la carpeta y los documentos de antes salen «sin tarea», con «Colgar de una tarea»; nadie está obligado a colgarlos. Francisco sabe que así la regla anterior no se cumple del todo («Ahora lo entiendo. Me parece bien tu idea»).
- (13-nov-2026, tema 630) Una tarea nueva nunca toma el nombre de un fichero: «Crear una tarea nueva, sí. Que le ponga ese nombre, no». Un fichero sin tipo pasa antes por «Cambiar el nombre».
- (13-nov-2026, tema 630) Aparte, como ideas: elegir hito y tarea al clasificar desde la bandeja (634), una marca única para llevar o no los cambios a la guía (635) y ordenar con buscador la lista de acciones (636).

## Llamadas de teléfono

- (13-nov-2026, tema 565) «Llamar por teléfono» es una tarea más de «Qué se hace», con sus llamadas apuntadas debajo (intentos, si se habló y comentario). Se marca sola con la primera llamada hablada y se puede desmarcar («Tus ideas me parecen bien»).
- (13-nov-2026, tema 565) También se apuntan llamadas que no salen de una tarea, «emitidas, y sobre todo, recibidas, no ligadas a una tarea», siempre dentro de un asunto. Apuntarlas sin asunto, desde Inicio, queda como idea 640 (eligió la 2 y dejarla aparte).
- (13-nov-2026, tema 565) El botón de apuntar es un icono de teléfono a la vista, en la cabecera del asunto y en la tarea, no dentro del Registro: «Hay que acordarse de que está ahí. Creo más útil que esté fuera, como otro botón con un símbolo».
- (13-nov-2026, tema 565) Desde la cabecera la app pregunta si la llamada es de una tarea, y vale cualquier tarea, no solo las de llamar: «me llaman para preguntarme por ella o para aportarme alguna información que necesito para esa tarea». Solo las de llamar se marcan solas.
- (13-nov-2026, tema 565) Para elegir la tarea salen primero los hitos, y al pulsar uno, sus tareas: «aparecen los hitos en negrita, sin mostrar sus tareas».
- (13-nov-2026, tema 565) Las llamadas de una tarea salen plegadas en una línea con su cuenta: «puede salir plegada por defecto y no ocuparía tanto espacio».
- (13-nov-2026, tema 565) El día y la hora de la llamada se pueden cambiar al apuntarla («estaría bien poder cambiarla»); quién la apunta, no.
- (13-nov-2026, tema 565) Una llamada apuntada se puede corregir, «quedando registrada la modificación»: el Registro guarda cómo estaba antes. No se borra.

## Nombre de las carpetas de asunto

- (13-nov-2026, tema 631) La carpeta de un asunto con número **pierde el nombre de la persona solo al archivar**, cuando entra en la carpeta de esa persona, y lo recupera al reabrir. Abierta se llama como siempre, porque en Asuntos abiertos no hay carpeta de persona y el nombre es lo único que dice de quién es («Adelante con tu forma mejor»; él había pedido quitarlo de todas para acortar las rutas).
- (13-nov-2026, tema 631) **Las carpetas ya archivadas con número se acortan** con un botón de Herramientas, que se pulsa con la otra persona fuera de la app (eligió «2», sabiendo que Drive sincroniza de nuevo cada carpeta en los dos ordenadores). Para ellas deja de valer «lo que ya existe no se renombra» (fila 239). Las carpetas sin número no se tocan.
