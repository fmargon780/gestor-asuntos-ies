# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB) y
> otra vez el 20-sep-2026 (45 KB). La tabla guarda solo número, documento y estado; **las notas
> largas van a `docs/HISTORIA.md`, no aquí**. El detalle de cada fila HECHA está en
> `docs/HISTORIA.md`, en el documento de la propia fila y en el historial de git.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**, leyendo la tabla **de arriba abajo**. Ojo:
   desde el 18-sep-2026 la tabla está en orden de trabajo, no de número, así que la primera
   PENDIENTE no tiene por qué ser la del número más bajo. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha, y sigue con la siguiente PENDIENTE. No pares
   hasta que no quede ninguna. **La hora de `App.VERSION` sale del reloj de verdad**
   (`TZ='Europe/Madrid' date`, receta exacta en `js/version.js`), nunca a ojo: el 17-sep-2026
   salieron versiones con horas por delante de la real.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   sigue con la siguiente. Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   sáltala y coge la siguiente PENDIENTE.
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (o
   el hijo de `docs/contexto/` que toque) **sustituyendo la línea vieja, no añadiendo una debajo**.
   Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 14.000 caracteres.
10. **Antes de subir nada, vuelve a bajar `main`.** Marcar la fila EN CURSO no basta: otra sesión
    puede haber fusionado su trabajo mientras tanto, y subir ficheros enteros sin releer pisa lo
    suyo. Pasó el 16-sep-2026 con las filas 13 y 14, y el 17-sep-2026 con la fila 38 y con
    `vercel.json` en la fila 48. **Vuelve a bajar `main` justo antes de cada llamada que suba un
    fichero, no una sola vez al empezar el cierre.**
11. **Nunca subas un fichero con un texto de relleno en vez de su contenido.** Si no tienes el
    contenido entero delante, no lo subas: bájalo antes. El 17-sep-2026 `docs/CONTEXTO.md` se
    quedó en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada más, y hubo que recuperarlo
    del historial de git. Después de subir, vuelve a bajar lo subido y compruébalo.
12. **Algunas sesiones no pueden subir un fichero de más de unos 45-50 KB de una sola vez**: la
    llamada que sube el contenido se corta sola sin avisar de ningún error, y el fichero queda en
    `main` con solo el primer trozo. Pasó el 17-sep-2026 con `docs/HISTORIA.md`. **Antes de subir
    un fichero grande** (`docs/CONTEXTO.md`, `docs/HISTORIA.md`), compruébalo después de subirlo
    (`get_file_contents` o `git show origin/main:<ruta>`) y compara el tamaño con el de antes: si
    ha quedado más corto de lo esperado, esa sesión no puede con ese fichero de una vez, y hay que
    dejarlo apuntado aquí en vez de reintentarlo mil veces.
13. **Como máximo dos subidas por fila.** Cada push que llega a GitHub le cuesta una publicación
    a Vercel, y el plan gratuito solo da 100 al día: el 17-sep-2026 se agotaron y la web se quedó
    sin actualizar hasta el día siguiente. Una subida para marcar la fila **EN CURSO** (regla 2) y
    una sola al terminar, con el código, las pruebas, `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`,
    `docs/CONTEXTO.md` y `docs/HISTORIA.md` en el mismo commit. Nada de un commit por fichero, ni
    de "completa el commit anterior": se prepara todo y se sube una vez. Ver
    `docs/NO-GASTAR-PUBLICACIONES.md`. (Desde la fila 65, la documentación puede ir en una subida
    aparte: tres por fila en vez de dos.)
14. **Nunca uses `$(cat fichero)` ni ninguna sustitución de shell como valor de `content` al
    subir un fichero: el servidor no lo ejecuta, lo sube tal cual, como texto literal.** El
    17-sep-2026 esto dejó `docs/COLA.md` en 35 bytes con el comando sin ejecutar. El contenido
    tiene que ir escrito entero, de verdad, en el propio parámetro.
15. **`push_files` con muchos ficheros grandes en una sola llamada es donde más falla el volcado
    del contenido.** El 20-sep-2026, en la fila 77, una llamada de doce ficheros dejó seis con la
    palabra `PLACEHOLDER` en vez del contenido, y `js/nucleo.js` con `PLACEHOLDER` es la
    aplicación entera sin arrancar, publicada. Para una fila con más de cuatro o cinco ficheros de
    código, súbelos con `create_or_update_file` uno a uno (o en dos o tres llamadas de
    `push_files` más pequeñas), comprobando el tamaño de cada uno nada más subirlo.
16. **Si delegas una fila de documentación en una sesión auxiliar**, pídele explícitamente que lea
    el fichero entero de origen y lo copie tal cual, o que lo suba en trozos verificados. El
    19-sep-2026 una sesión auxiliar retipeó tres ficheros de memoria e introdujo erratas en los
    tres (`docs/COLA.md`, `docs/contexto/ASUNTOS.md`, `docs/HISTORIA.md`).

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

Las filas 1 a 62, 64 a 75, 77 a 84, 85, 86 y 87 están **HECHAS**. Sus documentos siguen en
`docs/`, y el detalle de cada una en `docs/HISTORIA.md`. Aquí queda solo lo que no está cerrado:

| Nº | Instrucción | Estado |
|---|---|---|
| 88 | `docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md` | PENDIENTE (21-sep-2026) |
| 63 | `docs/PUBLICAR-SOLO-LA-APP.md` | BLOQUEADA (19-sep-2026): sin salida a internet desde esa sesión. Vercel publica el repositorio entero, `docs/` incluida; primero comprobarlo con `curl` y, si se confirma, un `.vercelignore` |
| 76 | `docs/DETALLES-DE-MANTENIMIENTO.md`, punto 1 (la versión, sacada del reloj) | BLOQUEADA (20-sep-2026): riesgo real de bucle de commits o de publicaciones de Vercel duplicadas si el paso automático falla, y no hay forma de probarlo a fondo sin que Francisco mire el panel de Vercel. Ya lo avisaba el propio documento cuando se separó de la fila 72: mejor dejarlo pendiente que arriesgar la cuota o la publicación entera sin nadie delante |

**La 88 está PENDIENTE.** La 63 y la 76 siguen BLOQUEADAS y no se retoman sin que Francisco
lo diga. La tabla está en orden de trabajo, no de número: coge siempre la primera PENDIENTE
**de arriba abajo**.

**Ninguna fila se sube junto con otra.** Cada una, su subida.

## Lo que queda por hablar con Francisco (no son filas de la cola)

- De la fila 21: departamentos del personal, tutorías y equipos educativos. `personal.csv` no
  guarda nada de eso; hay que ver qué se puede sacar de Séneca antes de diseñar nada.
- De la fila 28: el parentesco de verdad (padre, madre, abuela). El RegAlum no trae esa columna,
  así que se enseña "Tutor legal 1" y "Tutor legal 2".
- De la fila 34, a sabiendas: si la ficha entera se repinta de verdad (llega un documento a la
  carpeta) mientras se escribe una nota **de hito**, esa nota se pierde. La nota del asunto sí
  sobrevive. Arreglarlo pedía memoria propia del panel de hitos, con riesgo de resucitar texto de
  otro asunto, y el caso es raro desde que la ficha casi no se repinta.
- Guardado por si se replantea (17-sep-2026): una base de datos pequeña en internet para que el
  aviso de la fila 24 sea instantáneo en vez de esperar a Dropbox. Descartada ahora. Si se hace,
  solo viajarían el identificador del asunto y el nombre de quien lo abre, nunca el nombre de la
  carpeta ni dato alguno de alumnado o personal, y con servidor en la Unión Europea.
- Cuando los hitos (fila 15) estén en uso: si el estado del asunto desaparece y lo sustituye el
  hito en curso. Lo de que un hito apunte a su plantilla de correo lo resuelve la fila 60; queda
  pendiente lo mismo con la plantilla de documento (fila 17).
- Los nueve asuntos de `docs/PROXIMOS-ASUNTOS.md` (14-sep-2026) están todos metidos en la cola:
  esa lista queda cerrada.
- De la fila 54 (18-sep-2026): para un grupo de destinatarios que se repite todos los meses, lo
  suyo es crearlo una vez en el gestor de contactos del propio Séneca. El ayudante es para listas
  de un día. Si algún día se ve que casi todas las listas son fijas, habrá que replantear si el
  ayudante merece seguir existiendo.
- De la fila 57 (18-sep-2026): hay que comprobar con un documento de verdad qué pasa cuando Séneca
  sella un PDF que ya viene firmado digitalmente. Es posible que el visor avise de que el documento
  se modificó después de firmarse. Eso no depende de la aplicación. Si ocurre, habrá que decidir el
  orden bueno (firmar después de registrar) y dejarlo escrito en la guía del tipo.
- De la fila 57: las medidas de 1,5 cm y 2,5 cm son una estimación. Francisco no tenía la medida
  real de las bandas de Séneca ni de la de AutoFirma. Cuando pruebe el botón con un documento
  registrado de verdad, ajustará las dos medidas en Ajustes → El centro.
- De la fila 59 (18-sep-2026): con el uso se verá si conviene que "Qué me toca" cuente también lo
  que falta por reunir, y si la casilla de un dato debería poder rellenarse sola desde la ficha
  del tercero.
- De la fila 60 (18-sep-2026): con el uso se verá si el historial de comunicaciones conviene verlo
  junto, en un sitio solo del asunto, en vez de repartido hito por hito.
- De las filas 79 y 80 (20-sep-2026): el contenido de la biblioteca ya está escrito y cerrado con
  Francisco. Lo que queda para más adelante, y no es fila: (a) que la vigilancia diaria del BOJA
  del repositorio `fmargon780/normativa-escolarizacion` deje sola una instrucción en esta cola
  cuando cambie un artículo citado por un hito; (b) las plantillas de correo y de Séneca de cada
  tipo, que se escribirán con el uso, no de golpe; y (c) revisar el contenido tipo por tipo
  conforme Francisco los vaya trabajando de verdad, que es cuando verá si algo sobra o falta.
- **Del informe del 18-sep-2026: los tres botones de comunicar.** En la misma ficha hay
  "Comunicar" en la cabecera (plantilla del tipo), "Comunicar" en un hito (texto de ese paso) y
  "Pedir lo que falta" en un hito. Por dentro están bien: los tres abren el mismo cuadro y no hay
  código duplicado. Desde la pantalla, tres botones parecidos van a confundir. **No se toca hasta
  que Francisco haya usado los hitos un mes**: entonces se decide si "Pedir lo que falta" pasa a ser
  una opción dentro de "Comunicar". Por eso no es una fila de la cola.
- **Del informe del 18-sep-2026: la papelera, ¿se vacía sola?** Hoy avisa a los 30 días pero no
  borra nada sin que alguien pulse. Para datos de menores, un borrado que nunca ocurre no es lo
  ideal. **Hay que preguntárselo a Francisco**, y apuntar lo que decida. Es la parte que quedó sin
  hacer de la fila 68.
- **Del informe del 18-sep-2026: la ficha del asunto.** Se ha rehecho tres veces en cuatro días
  (filas 51, 52 y 58). Va a necesitar una cuarta pasada cuando los hitos lleven un mes en uso. No se
  adelanta nada: se espera al uso real.
- **Del 21-sep-2026: quitar el tecleo de la clave de normativa.** En el apartado "Normativa" de un
  paso, un buscador que encuentre el artículo por su texto ("consejo escolar") y rellene la clave
  solo. Necesita que el sistema de normativa publique un índice ligero de claves y títulos. **Se
  diseña con Francisco a partir del miércoles 23-sep-2026 a las 14:00**, no antes.

## Descartado, no proponer otra vez (del informe del 18-sep-2026)

- **Un servidor.** Ni en internet ni dentro del centro, mientras sean dos o tres personas. En
  internet rompería el límite de no sacar datos personales. Dentro del centro lo respetaría, pero
  cambia "un fichero que crece" por "una máquina que nadie administra en agosto". Además, las cuatro
  cosas que un servidor resolvería —aviso instantáneo, cierre de verdad, buscar sin cargar nada
  entero, copias automáticas— o no son problema hoy, o ya están resueltas (el índice del ARCHIVO,
  las copias diarias), o las arregló la fila 64. **Se replantea solo si algún día entran cinco o
  seis personas de varios departamentos a la vez; y entonces, una máquina en el centro, nunca en la
  nube.**
- **Una base de datos del navegador** en vez de los ficheros del Dropbox. Rompería el modelo: los
  datos vivirían dentro de un ordenador, el compañero no los vería, un borrado de datos del
  navegador se lo llevaría todo, y se perdería lo mejor del diseño de hoy, que es poder abrir la
  carpeta y ver el trabajo sin la aplicación.
- **Guardar los cambios uno detrás de otro** (un registro de apuntes en vez de reescribir el
  fichero). Es la solución correcta para diez personas escribiendo a la vez. Con dos, dos semanas de
  trabajo y fallos que tardan meses en aparecer. La fila 64 dio casi el mismo beneficio por mucho
  menos.
- **Un fichero por asunto abierto.** La pantalla de abiertos tendría que abrir cien ficheros
  pequeños en una carpeta de Dropbox, que puede ser más lento que lo de hoy, no menos.

## Nota sobre "sube directamente a main"

Muchas instrucciones piden subir a `main` sin pull request. La sesión de Claude Code "en la nube"
(disparada desde GitHub) tiene forzado lo contrario: rama propia y pull request, sin permiso para
tocar `main`. Mientras se lance así, las filas se suben con pull request. Para volver a "directo a
main", hay que lanzar la cola desde una sesión de Claude Code normal (terminal u ordenador).

**Permiso permanente de Francisco (16-sep-2026): fusionar el pull request lo hace Claude Code
solo**, sin esperar a que Francisco lo haga a mano. Antes de fusionar: `npm test` en verde, el PR
sin conflictos con `main` (`mergeable_state: clean`) y sin ningún comentario de revisión pendiente
de responder. Fusionado eso, Vercel publica solo: comprobar lo publicado con `curl` sigue haciendo
falta después, no antes.

## Cuidado con varias sesiones a la vez

17-sep-2026: con tres sesiones en paralelo tocando esta cola, más de una subida pisó el arreglo de
otra (una fila volvió a PENDIENTE varias veces). Mientras la cola esté muy activa, conviene lanzar
las sesiones de una en una. El detalle de aquel día, y de los ficheros que se rompieron y se
recuperaron (`docs/CONTEXTO.md` con un `PLACEHOLDER`, `docs/HISTORIA.md` truncado a la mitad),
está en `docs/HISTORIA.md`; de ahí salieron las reglas 10, 11, 12 y 14.

## Nota para la próxima sesión: docs/CONTEXTO.md y docs/HISTORIA.md de las filas 53-56

El código, las pruebas y `docs/CONTEXTO-CORTO.md` de las filas 53-56 están en `main` y comprobados
en producción, pero la sesión del 18-sep-2026 (mañana) **no pudo subir** las secciones
correspondientes de `docs/CONTEXTO.md` ni de `docs/HISTORIA.md` (225 y 217 KB: demasiado para
retipear de un tirón sin `git push`). Puede que falten todavía.

- A `docs/CONTEXTO.md`: el cuadro de Séneca en dos columnas (fila 53), el ayudante fiable (54), el
  asunto sin elección (55), el panel de campos de tres pestañas y los campos calculados (56), y
  las filas correspondientes de "Ficheros del repositorio" (`js/seneca-cuadro.js`,
  `css/seneca.css`, `js/campos-calculo.js`, `js/campos-calculados-editor.js`, `js/ajustes-tipo.js`).
- A `docs/HISTORIA.md`: la entrada del 18-sep-2026 de esas cuatro filas, con su "Lo que costó de
  verdad" (los bugs que las propias pruebas cazaron antes de producción).

Compruébalo contra lo que de verdad dice `main` antes de sustituir nada. Si la sesión tiene
`git push` de verdad (terminal u ordenador de Francisco), es mucho más simple que ir fichero a
fichero con la API.
