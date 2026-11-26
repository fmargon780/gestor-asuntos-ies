# Reglas del negocio del Gestor de Asuntos

Decisiones de Francisco ya tomadas, para que ninguna conversación nueva las contradiga.
Cada una con su fecha y de dónde sale.

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
- (16-nov-2026, idea 680) **Por ahora, un documento no necesita hito ni tarea:** se puede guardar y añadir sin ellos, también en un asunto sin hitos; «Hay que registrarlo» se guarda sin hito; la tarea «Registrar» se marca con cualquier documento del hito cuando ninguna tiene el suyo. «Por ahora todas» (las cinco condiciones del listado), mientras Francisco depura el sistema nuevo. Sustituye en esto a lo de 5-nov (tema 516) y a las filas 661 y 667.

- (10-nov-2026, idea 576) Hitos y tareas se condicionan con **«Solo si» un campo de lista del asunto**, no con hitos-pregunta: «lo veo mucho más natural». Todos los hitos en una sola lista que se ordena con las flechas.
- (10-nov-2026, idea 576) Con el campo vacío salen todos en amarillo con «Falta: <campo>», como los textos condicionales; lo ya hecho no desaparece al cambiar el campo («me encaja mucho»).
- (10-nov-2026, idea 576) Las guías con preguntas las pasa la app sola: cada pregunta a campo de lista y sus hitos con «Solo si»; en los asuntos abiertos el campo queda con la respuesta elegida («me encaja»).

- (24-nov-2026, fila 737) **La guía se edita a toda la pantalla:** a la izquierda la lista entera, una línea por tarea, que se escribe con Intro y se ordena arrastrando; a la derecha la tarea elegida en grande («Me parece bien tu propuesta»; «Sí, es mucho más cómodo»). Sin botón de quitar en cada línea: se quita desde la derecha («Ok. Estupendo.»).
- (24-nov-2026, fila 737) En el editor de la guía, **«Ver la guía para»** tacha en gris las tareas que no saldrían en el caso elegido, para ver el mapa del proceso con sus «Solo si»; y bajo el papel sale **su recorrido** («lo veo bien»).

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
- (26-nov-2026, tema 759) **Un documento de «Por clasificar» con el número de un asunto**, en el nombre o en su texto, propone guardarse en ese asunto («El correo recibido dice el número de asunto, sin embargo la aplicación no propone guardarlo en el de mismo número»). Nunca se guarda sin pulsar.

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
- (16-nov-2026, idea 677) Un documento que se guarda en la carpeta de un asunto vivo, o que llega a «Por clasificar», tiene que salir en la app tan deprisa como antes del traslado a Drive: «Antes era casi inmediato.»

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

## Crear tareas e hitos (tema 650)

- (14-nov-2026, tema 650) Crear ante una situación nueva todo lo necesario, de manera fluida, es «fundamental para el futuro de la app», sobre todo en la atención en ventanilla; las plantillas con campos pueden llevar más tiempo.
- (14-nov-2026, tema 650) Hitos y tareas no se crean ni se buscan solo por el nombre: «puede ser muy arriesgado», «me temo que crearíamos muchos hitos para lo mismo». Se eligen por lo que hacen: la tarea, por su acción y sobre qué; el hito, por su fase.
- (14-nov-2026, tema 650) Las fases de los hitos son una lista fija del centro; las nuevas se crean solo en Ajustes, no al crear un asunto: «para frenar un poco a ese nivel».
- (14-nov-2026, tema 650) El tema va en cuatro partes y en este orden: acciones que faltan, repaso de una vez de la lista común, crear tareas e hitos en el asunto y bandeja con hito y tarea (eligió la opción 1, sabiendo que el tema crece).
- (14-nov-2026, fila 651) Las cinco acciones nuevas («En Séneca», «Entregar o recoger en mano», «Publicar», «Cobrar o pagar», «Comprobar») por ahora solo clasifican y se marcan a mano; que hagan algo propio queda como ideas 652 a 656 (eligió la opción 3). «Sin acción» pasa a llamarse «Otra cosa».
- (14-nov-2026) Claude lee `guias.json`, `tareas-comunes.json`, `hitos-comunes.json` y `tipos.json` de `_GESTOR` porque están compartidos, solo como lector, con el Gmail personal de Francisco. Nada con datos de personas se comparte fuera de la cuenta del centro.
- (14-nov-2026, fila 657) Las fases son once y dicen lo que hace quien usa la app, no el trámite jurídico: recibir, pedir, comprobar, elaborar el documento, poner a la firma, publicar, enviar o entregar, hacer en Séneca, cobrar o pagar, esperar, archivar. «Los administrativos no resolvemos, como mucho generamos la propuesta de resolución, el director la comprueba y la firma y nos la da para dar registro de salida y enviar»: no hay «resolver», «audiencia» ni «registrar» (el registro de entrada va en recibir y el de salida en enviar).
- (14-nov-2026, fila 657) Un hito común es una fase con su juego de tareas; puede haber varios por fase y se unen los que tienen la misma fase y las mismas tareas. En cada guía, los hitos seguidos de la misma fase van juntos en uno («Hagamos como tú propones»).
- (14-nov-2026, fila 657) «Tramitar» se queda, con la fase «recibir», en las guías que no tienen más que «Tramitar · Esperar respuesta», hasta que se llenen con el uso: es el hito donde nos toca (eligió la opción 2).
- (14-nov-2026, tema 650) El tema pasa a cinco partes: acciones que faltan (651), repaso de la lista común (657), el «dónde» y los nombres (659), crear hitos y tareas desde el asunto (660) y la bandeja.
- (14-nov-2026, fila 659) «Una cosa es qué hacer y otra dónde se hace»: cada tarea lleva «Dónde se hace», aparte de «Qué se hace». El fin es «un sistema de trabajo lo más completo posible y que sirva de guía incluso a personas no expertas».
- (14-nov-2026, fila 659) Nombres: «que no haya conceptos ambiguos y/o repetidos en las distintas zonas o elementos. Cada uno tiene que tener una nomenclatura clara». El qué va sin sitio ni vía; el sitio, solo en «Dónde se hace»; una palabra, un solo significado. «Generar documento» es el verbo de la acción y de la fase («Me convence»).
- (14-nov-2026, fila 659) No hay «Otro sitio»: los sitios se crean y cambian en una ventana que enseña antes «un buen mapa de lo existente». Las zonas de Séneca de partida las corrige Francisco en la app («empezamos así»).
- (14-nov-2026, fila 659) «Archivar» es para el papel (expediente del alumno o archivo del centro) y es una acción de «Qué se hace»; el asunto se «cierra» (idea 658). Los hitos «Archivar» vacíos se quitan de las guías: cerrar el asunto es el botón.
- (14-nov-2026, fila 659) La tarea de llamar lleva «A quién», y las de registrar, poner a la firma y añadir documento, «Qué documento» (eligió la opción 2 en los dos casos).
- (14-nov-2026, fila 660) Una sola marca dice si los cambios en hitos y tareas van también a la guía; añadir, cambiar, borrar, subir y bajar la obedecen. Se pierde «Pasar a la guía».
- (14-nov-2026, fila 660) Primero el hito y después la tarea. La ventana de añadir hito va paso a paso: enseñar todo a la vez «no te permite enfocarte y concentrarte en la acción del momento».
- (14-nov-2026, fila 660) Lo que se elige entre muchos (plantilla, sitio, qué se hace) va en casillas que se buscan escribiendo: un desplegable «puede dar problemas en el futuro, si hay muchas plantillas».
- (14-nov-2026, fila 660) La app avisa solo cuando lo nuevo es igual o parecido a algo que existe, también un hito que ya está en el asunto; a veces hace falta repetirlo y se deja.
- (14-nov-2026, fila 660) Un tipo sin guía nace sin ningún hito: «así obligamos a crear los correctos».
- (14-nov-2026, fila 661) El hilo de un correo no cuelga de ningún hito ni tarea: va al Registro del asunto. «El hilo puede tratar sobre distintos hitos y tareas a lo largo del asunto y lo normal es mantener el hilo»; «asociar ese correo a un hito o tarea por defecto es arriesgado».
- (14-nov-2026, fila 661) Un documento de la bandeja o un adjunto entra en un asunto diciendo de qué hito y de qué tarea es. La app solo los propone cuando una tarea espera justo ese tipo de documento; si no, se eligen a mano (eligió la opción 3). Que la app deduzca la tarea del contenido «sería mucho suponer».
- (14-nov-2026, fila 661) Si el asunto no tiene hitos, el hito se crea desde el mismo cuadro (eligió la opción 2); «+ Añadir hito» está siempre en ese cuadro (eligió la opción 1).
- (14-nov-2026, fila 661) El documento entra en el asunto al pulsar «Guardar»; si se deja a medias, sigue en la bandeja. En un correo, el adjunto que no se guarda se queda en la bandeja con el correo («Está bien»).
- (14-nov-2026, tema 650) Qué hacer con la casilla «Pendiente de registro», que se pisa con la tarea «Registrar», queda como idea aparte (662; eligió la opción 2).
- (14-nov-2026, tema 667) La casilla «Pendiente de registro» desaparece: lo que falta por registrar es siempre una tarea «Registrar» con su documento. En el cuadro donde se guarda un documento, «Hay que registrarlo» crea esa tarea (o usa la que ya lo espera) al guardar; «Está registrado en Séneca» se queda, y el número escrito a mano marca la tarea («Me parece bien tu plan»).
- (15-nov-2026, tema 665) «Grabar o cambiar datos», «Entregar», «Recoger», «Comprobar», «Publicar», «Cobrar o pagar» y «Archivar» no tienen casilla: se marcan con su botón, que pide los datos de la acción, o con «No aplica» (eligió la opción 2). Todos los datos son opcionales, para que no haya «situaciones de bloqueo en los que no se pueda seguir porque no se tenga el dato». Lo apuntado va a la tarea y al Registro; «Deshacer» en el menú ⋮.
- (15-nov-2026, tema 665) Cualquier tarea puede llevar «Cómo se hace» (pasos escritos); la ruta de Séneca va ahí. «Comprobar» tiene «Está bien» y «Falta algo»; con «Falta algo» la tarea sigue sin hacer, con la nota a la vista.
- (15-nov-2026, tema 665) «Archivar» entra en el tema (eligió la opción 1) y pide dónde queda el papel: una zona de «Sitios» más un detalle libre. Las zonas del archivo las pone el centro: «los distintos lugares del archivo documental los podremos poner a nuestro gusto».

## Cerrar un asunto

- (15-nov-2026, tema 666) En la app un asunto **se cierra**, no se archiva: «archivar» queda para el
  papel —el expediente del alumno y el archivo documental del centro—, que es la acción «Archivar» de
  una tarea (fila 659). El botón dice «Cerrar el asunto» y la pestaña «Archivo» pasa a llamarse
  **«Asuntos cerrados»** (eligió la opción 2).
- (15-nov-2026, tema 666) **La carpeta ARCHIVO del disco no cambia de nombre**, ni sus rutas ni su
  índice, y los textos que hablan de ella siguen diciendo archivo: lo que hace la app se cierra, el
  sitio donde queda sigue siendo el ARCHIVO. En Gmail, archivar sigue siendo de Gmail.
- (15-nov-2026, tema 666) El botón del asunto dice siempre **«Cerrar el asunto»**, nunca «Cerrar» a
  secas, para no confundirlo con los botones que cierran ventanas.
- (15-nov-2026, tema 666) Cerrar un asunto **no cambia de comportamiento**: sigue moviendo su carpeta
  de «Asuntos abiertos» al ARCHIVO, dentro de la del tercero, como hasta ahora.
- (15-nov-2026, idea 675) El **plazo de conservación** se queda como está y sigue contando desde que
  se cierra el asunto en la app; de qué fecha debe contar se decide aparte, porque la que vale es el
  fin real de la tramitación: «no creo que sea algo oficial el día en que un administrativo de un
  instituto quiera dar a un botón de cierre en una app que ha montado para él mismo y su compañero.
  Así que la fecha de fin de la tramitación debe ser otra.»

## Subir un documento

- (16-nov-2026, fila 678) Al subir un documento, la ventana de Windows para elegirlo se abre siempre. Si no puede abrirse en la carpeta del asunto, se abre en otro sitio y sale el aviso «No he podido abrir la carpeta del asunto; elige el archivo.» Si no puede abrirse de ninguna forma, sale un aviso rojo con el motivo: nunca se queda en silencio. Francisco aceptó el aviso: «1».
- (16-nov-2026, tema 683) «Añadir documento» abre directamente la ventana de Windows, sin preguntar de dónde viene y sin el aviso naranja; si no se abre de ninguna forma, sigue el aviso rojo. Sustituye en esto a la regla de la fila 678. Francisco: «Creo que lo correcto sería que al dar a añadir documento al asunto nos preguntara si queremos añadirlo de la carpeta del asunto, desde el explorador de Windows. También estaría bien hacer un drag and drop.» No habrá lista propia de la carpeta del asunto (fila 677).
- (16-nov-2026, tema 683) Se puede arrastrar y soltar un fichero en cualquier sitio del cuadro de Documentos y encima de cualquier tarea; entra siempre sin hito ni tarea y sin preguntar la tarea (eligió la opción 2, también encima de una tarea). Soltar ya no marca solo la tarea «Añadir documento». «Sí, escríbela» y «1» a la instrucción de la fila 686.

## Generar y enviar sin tarea

- (17-nov-2026, fila 695) Generar un documento y enviar un correo o un mensaje de Séneca no exigen crear ni elegir una tarea: hay dos botones siempre a la vista en la cabecera del asunto, y usarlos no marca nada solo. Las tareas siguen, pero no son la puerta obligada. Es un paso atrás a propósito sobre el tema 650, mientras el sistema se asienta. Francisco: «Eso de que le pide crear una tarea es lo que más le está molestando y que creo que es lo que más obstaculiza.» «Sí, por favor. Hagámoslo así.»
- (17-nov-2026, fila 697) «Generar documento ▾» nunca se queda sin salida: tras las plantillas del tipo ofrece siempre «Otra plantilla…» (todas las del centro) y «+ Nueva plantilla…». Dicho por Francisco: «si al mostrar todas las plantillas del centro y no hay ninguna que se adecúe a la que necesito, puedo crear una plantilla nueva?». Usar una plantilla de otro tipo no la asocia al tipo del asunto.

## Estructura del asunto: el molde nuevo (tema 692, acordado el 17-nov-2026; sin construir)

Detalle y pantalla aprobada: `docs/notas-diseno/692.md`, `docs/pantallas/692.html`. Instrucciones: `docs/698-…` a `docs/706-…`.

- (17-nov-2026, tema 692) «En las tareas se "hacen" cosas, en los hitos se informa de cosas.» El hito deja de ser una caja de tareas: pasa a ser un panel del asunto donde la app informa de por dónde va, mirando las tareas. La explicación de cómo se hace va en la tarea.
- (17-nov-2026, tema 692) **Un solo molde:** un asunto es una lista de tareas y un panel. Corto y largo son lo mismo, con o sin rótulos. Un tipo de asunto se marca «sin hitos» y solo cambian sus asuntos nuevos; lo demás sigue como hoy.
- (17-nov-2026, tema 692) En lo largo las tareas se agrupan con rótulos descriptivos, «para quitar la carga cognitiva de tener 30 tareas seguidas». El rótulo solo nombra: sin plazo, responsable ni marca de hecho. Si los lleva, vuelve a ser un hito: Claude tiene que decir que no.
- (17-nov-2026, tema 692) Lo que es de una tarea cuelga de la tarea; lo general, del asunto. Lo que comparten varias tareas sin ser de todas es del asunto.
- (17-nov-2026, tema 692) **Una guía por tipo de asunto, y nada más.** Las variantes, con «Solo si» en las tareas que cambian; si cambian más de la mitad, son dos tipos. Lo que hoy cuelga de los hitos no se muda: se escribe de nuevo, corto, cuando toque ese trámite («vamos a complicarnos»).
- (17-nov-2026, tema 692) **El plazo es del asunto**, no de la tarea: una sola fecha límite (eligió «1»).
- (17-nov-2026, tema 692) **Trabajar y diseñar, separados:** en un asunto sin hitos no hay casilla de llevar los cambios a la guía; lo que se añade o se cambia en el asunto se queda en el asunto («hemos dicho que se quitaría para no mezclar trabajo y diseño»). «Cambiar la guía…» va en el menú «⋯» de la cabecera (eligió «2»).
- (17-nov-2026, tema 692) **Qué es una tarea:** una frase, un estado (por hacer, esperando, hecha) y, solo si trata de uno, un papel («Me parece muy buena tu propuesta»). Sin papel se marca a mano. Desaparecen de la tarea las diecisiete acciones, «Dónde se hace», «A quién» y «Qué documento». «+ Añadir tarea» es una línea: una frase y, como mucho, un papel («Sí, me vale»).
- (17-nov-2026, tema 692) **La espera no es una tarea aparte:** es el estado de la tarea nuestra que la provoca, con a quién se espera y qué día volver a mirarlo. Ese día el asunto vuelve solo a «En Administración», y en Inicio dice «Reclamar a X · espera desde el …».
- (17-nov-2026, tema 692) **Aviso de Inicio «N esperas por reclamar»** (idea de Francisco): uno solo, con su cuenta, donde hoy sale «N listos para enviar»; al pulsarlo, Inicio enseña solo esos asuntos. Sin ventana que salte ni sonido.
- (17-nov-2026, tema 692) **El papel lleva su recorrido** y entra ya en el molde («Sinceramente pienso que debe ser la 2. Estoy dispuesto a hacer el trabajo en esa dirección que sea necesario»). El recorrido se escribe una vez, en el tipo de documento (Ajustes › El centro › Tipos de documento › ⋮ › «Recorrido»): lo hacemos o nos llega, quién firma, si se registra, y a quién y por dónde se envía («Lo veo completo»).
- (17-nov-2026, tema 692) Con papel, la tarea es el papel entero: una sola línea que enseña por dónde va (generado, firmado, registrado, enviado), avanza sola con cada prueba y ofrece el botón del paso siguiente. **«Marcar el paso a mano»** está en el ⋮ («Así no hay bloqueos»).
- (17-nov-2026, tema 692) El papel que llega: «Recibido › Registrado de entrada»; si el tipo no se registra, solo «Recibido» (eligió «1»).
- (17-nov-2026, tema 692) **Lo que solo se mira no es un papel:** una comprobación visual del DNI es una tarea sin papel, marcada a mano. Hay papel solo si algo se guarda en la carpeta.
- (17-nov-2026, tema 692) **El día de volver a mirar una firma lo propone la app:** un solo número para todo el centro, en Ajustes, que nace en 1, en días hábiles; en cada espera se puede cambiar el día. No hay un plazo por tipo de documento ni por quién firma.
- (17-nov-2026, tema 692) Registrar: mientras falta el PDF sellado, el asunto sigue en «En Administración» («Falta el sellado»); no pasa a «En espera».
- (17-nov-2026, tema 692) **Los tipos de documento se ponen de acuerdo** (eligió «1»): RESOLUCIÓN se une con RESOLUCION y CERTIFICACION con CERTIFICADO; ACUERDO, DILIGENCIA, CITACION, AUTORIZACION, RENUNCIA y FICHA ENTREGA LIBROS los añade la app sola a la lista del centro.
- (17-nov-2026, tema 692) **Si la plantilla de documento dice una firma distinta de la de su tipo, manda la plantilla de documento** (eligió «1»); si no dice nada, vale la del tipo. La plantilla de correo no entra en esto.
- (17-nov-2026, tema 692) **«Enviado» sin prueba:** por correo electrónico lo apunta la app sola. En mano, postal, tablón e iPasen, el botón dice «Marcar enviado»: apunta quién, el día de hoy y la vía del recorrido, sin ventana; el día y la vía se corrigen desde el ⋮; queda en el Registro (eligió «1»).
- (17-nov-2026, fila 701) **El «Solo si» del molde nuevo** se escribe solo en la guía, nunca desde el asunto. Mira un dato de lista del asunto o la clase del tercero (para cumplir «la clase de tercero no da otra guía»). Con el dato vacío salen en amarillo todas las tareas que dependen de él, y el dato se rellena pulsando el aviso «Falta: …», ahí mismo. Las tareas que no salen no cuentan. Una tarea suelta que sobra en un asunto se borra en ese asunto («Era esto. Es que no lo habíamos hablado. Me parecen bien tus propuestas»).
- (17-nov-2026, fila 707) **«Cómo se hace» va dentro de la tarea y entra en el molde** (eligió «2»): un texto libre, opcional, que se escribe en la guía bajo la frase; la ruta de Séneca y la norma van dentro. En el asunto sale plegado, tras una marca junto a la frase. Una tarea añadida en el asunto no lo lleva: para eso está «Anotar» («vale»).
- (17-nov-2026, plan) Mientras el molde no esté construido, no se añade nada a hitos, fases ni hitos comunes. Lo nuevo se añade, no sustituye: Diego tiene que poder seguir trabajando igual (`docs/PLAN-2026-11.md`).

## Pruebas antes de producción (tema 470, 19-nov-2026)

- (19-nov-2026, tema 470) **Las pruebas se hacen solo con datos inventados y casos inventados**, no con una copia de los datos reales con los nombres cambiados: «Yo no necesito que tú veas datos reales. ¿Podemos hacerlo todo con datos inventados y casos inventados?» Claude no ve nunca datos reales. Descarta la idea 496. La demostración crece (fila 711).
- (19-nov-2026, tema 470) **Se prueba antes de pasar a producción:** «Lo que sí creo que es interesante es probar antes de pasar a la versión de producción.» Cada fila grande se publica en una dirección de prueba y espera la mirada de Claude con la extensión de Chrome (eligió «1», solo las filas grandes); las pequeñas siguen como hoy (fila 710). Es un paso atrás sobre lo del 1-oct-2026 (nada espera a su visto bueno), a propósito y solo para las filas grandes.
- (19-nov-2026, tema 470) En la dirección de prueba la app **solo entra en demostración**: no ofrece señalar carpetas de verdad, para que una versión sin aprobar no pueda escribir en los datos reales.

## Coger de «Por clasificar» desde la tarea (fila 646, 20-nov-2026)

- (20-nov-2026, fila 646) En una tarea de añadir documento, además de soltar el PDF, se puede **coger un documento suelto de «Por clasificar»**: «Debería dejarme también coger el documento de la bandeja Por Clasificar.» (aviso de Francisco, 13-nov-2026). Entra en el asunto al pulsar «Guardar», como en la fila 661.

## Etiquetas para los tutores legales (tema 624, 20-nov-2026)

- (20-nov-2026, tema 624) En Etiquetas, «A quién» tiene una pestaña **«Tutores legales»** entre Alumnado y Personal: se elige al alumnado como siempre y la etiqueta va a sus tutores, **una por familia** (los hermanos con los mismos tutores y dirección, juntos), con los nombres de los dos tutores, «Tutores de…» y la dirección de casa del alumno. Origen: aviso de Diego del 11-nov-2026 («añadir en A quien los tutores o representantes legales del alumno o alumna»). Francisco: «Sí, está bien.»
- (20-nov-2026, fila 721) Salen siempre los dos tutores, tenga o no la custodia; sin tutores, la etiqueta sale con el aviso «Sin tutores»; no hay un sobre aparte para cada tutor. Francisco, a la instrucción: «Está bien».

## Documentos y correos para varias personas (tema 393, 20-nov-2026)

- (20-nov-2026, tema 393) Un asunto de grupo hace, para cada persona, **su documento (plantilla de documento) y su correo (plantilla de correo) con ese documento adjunto**, y vale para cualquier tipo de asunto, no solo para uno. Francisco: «no quisiera desarrollar algo concreto, útil solo para estos casos, si no algo general».
- (20-nov-2026, fila 722) **Un dato distinto para cada persona viene de las columnas de la lista que se pega para formar el grupo** (con cabecera en la primera línea); se guardan en el asunto y se usan como cualquier otro dato en el documento y en el correo. Francisco: «Es posible que esos datos estuvieran en algún listado relativo al asunto que podríamos incorporar»; eligió hacerlo en este tema («1»). «Un valor por dato y asunto» sigue valiendo; en un asunto de grupo se añade un valor por persona.

## Aula de convivencia (tema 581, 20-nov-2026)

- (20-nov-2026, tema 581) **La nota a la familia del aula de convivencia la prepara Administración con la app** (nota y compromiso en un Word); la firma el Jefe de Estudios, se registra de salida y se envía por correo a los tutores legales. La parte de abajo y el compromiso vuelven firmados a Jefatura de Estudios.
- (20-nov-2026, tema 581) **Cada alumno expulsado al aula de convivencia tiene su propio asunto** (no un asunto de grupo), creados todos de una vez pegando el aviso de la intranet. Los alumnos y las fechas salen del aviso de la intranet, no del correo que avisa.
- (20-nov-2026, tema 581) **Grabar la medida en Séneca** es una tarea de la guía, a mano; Francisco averiguará qué hay que grabar.

## Abrir la app desde la web de GitHub (tema 718, 20-nov-2026)

- (20-nov-2026, tema 718) **La app de verdad se abre también en `https://gestor-asuntos-ies.github.io`**, una dirección de GitHub que abre en la red del instituto (comprobado por Francisco el 20-nov-2026). Se publica a la vez en `asuntos.fmargon.com`; no se quita nada hasta que todos hayan pasado.
- (20-nov-2026, tema 718) **En cada ordenador hay que señalar las carpetas de nuevo** en la dirección nueva (el navegador guarda los permisos por dirección). La app lo guía, carpeta por carpeta y por su nombre, desde un botón «Pasar a la dirección nueva».
- (20-nov-2026, tema 718) **Orden de la mudanza:** un ordenador del instituto con Edge; después los demás; Diego el último. Al final `asuntos.fmargon.com` solo dice que la app se ha mudado. La copia sin internet se queda como plan B.
- (20-nov-2026, tema 718) **La dirección de prueba no cambia** y sigue en demostración: no comparte permisos con la de verdad.

## Campo «Una persona del asunto» (tema 745, 25-nov-2026)

- (25-nov-2026, tema 745) **Una plantilla puede preguntar «¿Quién?» entre las personas que ya están en el asunto** (tercero, quien lo pide, terceros relacionados y, si el tercero es alumno, sus tutores), sin reglas de edad, de padre o madre ni de tutor. Se elige a quien se quiera y se corrige con «Cambiar». Francisco: «¿No sería más completo que… te deje elegir una de las personas relacionadas en el asunto, sin entrar a ver si es mayor o menor de edad, padre o madre, tutor o lo que sea?»

- (26-nov-2026, tema 765) **La persona elegida sirve también por partes:** una plantilla que solo lleva `(nombre)`, `(DNI)`, `(teléfono)`, `(correo)` o `(en calidad de)` de una persona del asunto pregunta «¿Quién?» igual que con el campo entero.
- (26-nov-2026, tema 765) **«En calidad de» lo pone la app y se puede cambiar:** un tutor es «padre» o «madre» según su sexo en Séneca («Si es hombre convendremos que es el padre, si mujer, la madre. Existe la posibilidad de que no fuera (cambio de género o tutoría legal). Por este motivo, sería un valor por defecto que se debería poder cambiar»); quien lo pide, su relación; el resto, su clase. Se cambia en «Campos de este asunto».

## Descargar el Word de una plantilla (idea 748, 25-nov-2026)

- (25-nov-2026, idea 748) **Las plantillas de Word se pueden descargar** desde Herramientas → Plantillas («⋮» › «Descargar el Word»), para cambiarles el formato en Word y devolverlas con «Sustituir el fichero…». Francisco: «Lo que busco con esto es poder hacer cambios de formato en los documentos que no puedo hacer en la app.» Las plantillas de correo no se descargan: el correo es solo texto (idea 749 para darle formato).

## Compras de material de oficina (tema 583, 25-nov-2026)

- (25-nov-2026, tema 583) **Material de oficina dentro del Gestor:** catálogo por categorías con sus características, lista común de lo que falta, precios por proveedor, pedidos y cotejo de pedido, albarán y factura. Francisco: «es importante tener bien categorizado el material, ya que a veces lo que cambian son formatos, medidas, gramages». Sin existencias, inventario ni presupuesto por departamento.
- (25-nov-2026, tema 583) **Cada característica tiene su lista de valores** («+ Nuevo valor…»), para que lo mismo se escriba siempre igual.
- (25-nov-2026, tema 583) **Se pide a quien conviene, no siempre al más barato:** «a veces hay que hacer pedidos a proveedores para que los gastos de transporte sean gratis. O por diversificar y que nos puedan mantener descuentos.» Cada línea se asigna a un proveedor y una línea se puede partir entre dos.
- (25-nov-2026, tema 583) **Cada pedido es un asunto COMPRA nuevo** con su documento de pedido; un pedido ya enviado no se amplía. Una factura puede juntar varios pedidos del mismo proveedor.
- (25-nov-2026, tema 583) **Precios sin IVA; IVA al 21 %.** Tope del contrato menor de suministros que vigila la app: 15.000 € sin IVA por proveedor y año natural (aviso desde el 80 %).
- (25-nov-2026, tema 583) La factura se sigue metiendo en Séneca: la app no lo sustituye.

## La app desde un Chromebook (tema 757, 26-nov-2026)

- (26-nov-2026, tema 757) **Solo en un Chromebook,** «Ruta» copia solo el nombre de la carpeta o del documento, para pegarlo en la lupa de la ventana «Abrir archivo» (Francisco comprobó que esa lupa encuentra las carpetas de Drive por su número de asunto). En la ficha del asunto hay un botón nuevo, «Abrir en Drive», que busca la carpeta en otra pestaña con la cuenta común. En «Comprobación al entrar» no sale la línea «Ruta de la nube en este ordenador». En Windows no cambia nada. Francisco: «Está bien así».

## Correos con formato (tema 758, 26-nov-2026)

- (26-nov-2026, tema 758) **La plantilla de correo se escribe como un correo nuevo:** ventana a toda la pantalla, el correo a la izquierda en el orden en que se lee y «Así le llega» a la derecha. Francisco (aviso del 25-nov-2026): «Mejorar la usabilidad de esta pantalla de creación de plantillas de correo.» A la propuesta: «Me vale. Adelante.»
- (26-nov-2026, tema 758) **El texto del correo admite negrita, cursiva, subrayado, listas y tablas**, en la plantilla y al enviar; pegar desde Word conserva solo eso. Sustituye a «el correo es solo texto» de la idea 748; las plantillas de correo siguen sin descargarse. Francisco (idea 749): «poder dar formato (negrita, tablas) al cuerpo de los correos que manda la app».
- (26-nov-2026, tema 758) **Séneca sigue en texto sencillo:** la app quita el formato y cada fila de una tabla va en una línea. Saludo y firma, sin formato.
- (26-nov-2026, tema 758) **Sin el script de Gmail actualizado, el correo sale sin formato** y la app lo avisa en ámbar; el envío nunca falla por eso.

## Quitar lo que estorba (tema 691, 26-nov-2026)

- (26-nov-2026, tema 691) **Solo se limpia lo que se queda:** el asunto «lista de tareas» y lo que comparten los dos moldes. Lo que solo tienen los asuntos con hitos no se cambia de sitio: desaparecerá cuando lo largo pase al molde nuevo (Francisco: «Creo que este diseño habría que analizar como "casa" con el nuevo molde»; «Me parece bien»).
- (26-nov-2026, tema 691) **Un documento se «vincula» a una tarea**, no se «cuelga». En un asunto «lista de tareas», un papel entra en su tarea desde los botones de la tarea; no hay «Vincular a una tarea» en la carpeta.
- (26-nov-2026, tema 691) **Sin fecha límite, la cabecera del asunto no enseña nada;** el plazo se pone desde «⋯» › «Poner plazo…».
