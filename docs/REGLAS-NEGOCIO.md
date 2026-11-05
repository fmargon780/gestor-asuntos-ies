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

## Registro de Séneca

- (27-oct-2026, tema 477) El registrado se guarda **con el «Ruta» de siempre** del documento, sin
  botón nuevo: la copia del original se hace por dentro al pulsarlo.
- (27-oct-2026, tema 477) Cuando llega el registrado encima, la app **lo resuelve sola y avisa**, sin
  preguntar.
- (27-oct-2026, tema 477) Si lo que llega encima **no trae sello, se deja** y el original pasa a
  versiones previas: la app nunca deshace lo que se guardó (por ejemplo, un firmado).
- (27-oct-2026, tema 477) Lo que llega **ya registrado por la bandeja electrónica** sigue entrando
  por la carpeta y «Es un documento nuevo».

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

## Tipos de asunto y clases de tercero

- (30-oct-2026, tema 492) Un tipo de asunto admite **una o varias clases de tercero**, marcadas en
  sus Ajustes («Yo prefiero la 2»: no se duplica el tipo por clase). Al crear un asunto, el tercero
  se elige **solo entre las clases permitidas** del tipo.
- (30-oct-2026, tema 492) En «Nuevo asunto» **no hay pastilla «Todas»**: sin ninguna pulsada salen
  las clases permitidas; una pastilla se fija pulsándola y se suelta pulsándola otra vez.

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
