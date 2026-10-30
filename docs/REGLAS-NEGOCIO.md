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
