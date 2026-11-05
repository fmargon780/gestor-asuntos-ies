# 531 — Tareas e hitos comunes

## Lo que escribió Francisco

Idea 512 (tema 518), tal cual:

> Tema: cómo se meten en un asunto los campos que luego usan las plantillas (campos variables y los datos de los textos condicionales) para que se rellenen; Francisco quiere profundizar en ello. Sale del diseño de la fila 510.

En el diseño, el 5-nov-2026:

> Creo que lo que yo pretendía cuando escribí esta idea y que posiblemente no estuve muy lúcido, era que diseñaramos un sistema que nos permita elegir los campos (de nuestra base de datos, calculados, manuales o de otro tipo), que nos van a servir después en las plantillas de documentos y correos o de otras herramientas que tengamos que pudieramos configurar. En definitiva un sistema para manejar todos los campos posibles que podamos tener y necesitar y usarlos allá donde nos haga falta de la forma más sistemática, ágil y ordenada.

> Ten en cuenta que no valdrá solo un buscador normal para elegir los campos a insertar

> La creación de campos a partir de campos anteriores también debe ser muy potente

> Tengo experiencia en este campo y sé que es fundamental saber la tabla de origen del dato. [...] si el Número de Identificación Escolar me viene del archivo RegAlum a través de centro de datos esa es un información muy útil

> Imaginate siempre en la situación de que estamos trabajando en un asunto concreto y nos damos cuenta de que queremos generar un documento, correo, tener una información disponible para consulta en el mismo, o usarlo para una herramienta (Listados, cálculos, etc). [...] En ese momento y lugar donde tenemos la necesidad del campo es cuando tenemos que decidir dónde nos tiene que pedir el proceso el dato. Muchos de esos datos ya nos vendrán puestos.

> Entonces la idea es que si quiero una nueva tarea, en vez de dejarme escribir cualquier nombre y asignarle una acción, me dejará elegir de entre las tareas que ya existan en nuestro sistema y además si no hay la que yo quiero, crear una nueva y la configuro aquí mismo, incluyendo sus plantillas? Y lo mismo con los hitos?

> Si hay dos expulsiones al Aula de convivencia generos dos asuntos distintos del mismo tipo para el mismo alumno. Los asuntos no son contenedores en el tiempo [...] Se hace un asunto por cada expulsión. Y esta es la norma general.

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

Cuarta parte del tema 518. Necesita la 530 HECHA. Si algo cambia el texto de arriba, manda esto.

1. **Lista común de tareas.** Cada tarea tiene nombre, lo que hace y su plantilla si la lleva. Lo que hace sale de una lista fija: Generar documento, Firmar, Registrar, Comunicar, Añadir documento, Pedir datos, Otra cosa.
2. **Una sola tarea y cada guía la usa.** Si se cambia, cambia en todas (Francisco: «1, claramente»).
3. **Lista común de hitos.** Un hito se comparte **entero**: nombre, explicación y tareas. El plazo y el lugar en la guía son de cada guía.
4. **Añadir:** «+ Añadir tarea» y «+ Añadir hito», en el asunto y en la guía, abren una ventana con la lista, buscador y, en tareas, agrupada por lo que hacen. Cada línea dice en cuántos tipos se usa.
5. **Crear ahí mismo:** con nombre y lo que hace; si genera o comunica, su plantilla, que puede ser nueva con el editor de plantillas de siempre. Un hito nuevo se monta con tareas de la lista. Al escribir el nombre salen las parecidas para no duplicar.
6. **«Para»:** este asunto y los siguientes (en la guía), o solo este asunto.
7. **Cambiar:** «Cambiar la tarea» y «Cambiar el hito» avisan antes de guardar de en qué tipos se usa. Cambia en todas las guías. **Los otros asuntos abiertos siguen como están.**
8. **Algo distinto en un trámite:** una tarea «solo este asunto», o crear otro hito o tarea.
9. **Pasar las guías actuales:** Francisco no lo hace solo (5-nov-2026: «preferiría hacer esto ayudado por tí»). La app prepara una propuesta en pantalla (Mantenimiento): qué tareas e hitos pasarían a las listas y cuáles se unirían, sin cambiar nada. La revisa con Claude en una conversación, y solo al confirmarla se aplica. Nada se pierde. Esa conversación es la fila 532, no esta.

**Lo que desaparece o se sustituye:** escribir tareas libres en las guías (queda «Otra cosa» dentro de la lista); «Traer un hito de otro tipo» como copia independiente (fila 417) se sustituye por la lista común.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/518.html` · https://claude.ai/artifact/EW1cjJnK9PrLBJ97wMAvBy
- Es la misma pantalla para las filas 528, 529, 530 y 531. Esta fila programa solo lo de arriba: las ventanas de tareas e hitos comunes y «Cambiar».
- Sus datos son inventados: tablas como «Calificaciones» y «Faltas de asistencia» y algunas columnas de tutores no existen. Salen las tablas y columnas que traiga de verdad el Centro de datos.

## Qué NO se hace en esta tarea

- Comportamientos nuevos de tarea además de «Pedir datos», que trae la 530.
- Los temas 519 y 520: conviene diseñarlos después de esta fila.

## Notas técnicas de Claude

- Hoy: `_GESTOR/hitos-biblioteca.json`, `js/hitos-biblioteca.js`, `js/guias-biblioteca.js`, copia suelta `HitosBiblioteca.copiaSuelta`; tareas en `js/guias-guion.js` y `js/guias-guion-editor.js`, en el asunto `js/hitos-guion.js` y `js/hito-mesa-guion.js`.
- Dos ficheros compartidos nuevos en `_GESTOR` por `ColaGuardado`. La guía guarda referencias más plazo y lugar.
- Los asuntos abiertos guardan su propia copia de lo que tenían al crearse o al pasar (`origenGuia` no debe romperse; `js/hitos-sincronizar.js`).
- Es la parte con más riesgo: antes de aplicar, copia de `_GESTOR`. La propuesta se puede leer en pantalla como texto, y aplicarla es otra acción aparte; nunca se hace sola. Las guías viven en el Dropbox del centro, que Claude no alcanza desde su espacio de trabajo: lee la propuesta en la app, con Claude in Chrome.
- Si se ve que es más del doble de lo previsto, parar y preguntar.
- Las guías con preguntas y ramas siguen funcionando igual. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Añadir una tarea de la lista: sale con su plantilla.
- Crear una tarea con plantilla nueva desde la ventana.
- Escribir un nombre parecido enseña las parecidas.
- Cambiar una tarea avisa de sus tipos y cambia en las guías de esos tipos.
- Un asunto abierto de otro tipo no cambia.
- Añadir un hito trae sus tareas; el plazo sigue siendo de cada guía.
- «Solo este asunto» no toca la guía.
- Una guía con preguntas sigue igual tras pasar.
- La propuesta de pasar las guías une las iguales, no pierde ninguna tarea y no cambia nada hasta aplicarla.
- Aplicarla con la demostración deja las guías como proponía.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code) Decisiones de la sesión de programación (5-nov-2026), lo que la instrucción no cubría:
  1. **Las guías de hoy no se tocan.** «+ Añadir un hito» y «+ Añadir una tarea» en blanco de la guía se quedan, y junto a ellos salen «+ Añadir un hito de la lista» y «+ Añadir una tarea de la lista». Que desaparezca escribir tareas libres lo hará la fila 532 al pasar las guías; quitarlo ahora rompía las guías de antes y 8 pruebas.
  2. **La guía guarda `comun` más el retrato** (no solo la referencia): así asuntos, editor y sincronizar no cambian. El plazo y el lugar siguen siendo del hito de la guía.
  3. **«Traer un hito de otro tipo»** (fila 417) sigue como estaba; el botón de la lista común va al lado. Quitarlo es cosa de la fila 532.
  4. **En el asunto**, «+ Añadir tarea», «+ Añadir hito» y «Cambiar el hito» salen debajo de las tareas del hito abierto (no en la tira de hitos de la pantalla, cuyo fichero pasa de 400 líneas); «Cambiar la tarea» es una opción del ⋮ de la tarea común (sustituye a «Cambiar», que solo cambiaba la línea de una guía).
  5. **Una tarea «solo este asunto» es una copia suelta** (sin la marca de común): «Cambiar la tarea» no la toca. Lo mismo un hito «solo este asunto».
  6. **Cambiar el texto o la plantilla de una tarea común a mano en el editor de la guía** la suelta de la lista (pierde la marca); lo dice la propia línea.
  7. **«Los otros asuntos abiertos siguen como están»** se hace con la «solo aquí» que ya existía (`cambiarGuionAqui`): su línea vieja se les queda como tarea suya, con lo marcado. Solo para tareas de hitos de primer nivel de la guía; no para las de dentro de una pregunta. Al cambiar un hito, los otros asuntos abiertos conservan su nombre de antes (el título del hito es copia del asunto).
  8. **Plantilla nueva desde la ventana:** se abre el editor de plantillas de siempre; la ventana se cierra mientras tanto y vuelve con lo escrito y la plantilla ya elegida. Si se cancela el editor, la ventana no vuelve (hay que abrirla otra vez).
  9. **La copia de `_GESTOR`** es la de `Copias.guardar` (copia del día antes del primer guardado de cada fichero); los dos ficheros nuevos están en `Copias.FICHEROS`. La propuesta (punto 9) no escribe nada.
  10. **Propuesta:** solo mira los hitos de primer nivel que no son pregunta; las preguntas dentro de las tareas y los hitos con ramas «se quedan como están» (se cuentan). Se pueden copiar como texto.
  11. **Pendiente para la 532:** aplicar la propuesta, quitar las tareas libres y «Traer un hito de otro tipo», y pasar las tareas de dentro de las ramas. El segundo revisor (con Playwright) aún no ha pasado esta fila.
  - **Segundo revisor (5-nov-2026, Chromium real con disco falso y la demo; no he tocado código).** Pruebas: `comunes`, `comunes-ventanas`, `scripts-cargados`, `ajustes-cuatro-pestanas` en verde. Por palabras (hito, guia, biblioteca, copias, medidas) solo fallan `cambiar-tipo-y-guia`, `editor-de-la-guia-tareas`, `hacer-este-hito` y `nuevo-asunto-categoria-guia`, y fallan igual en una copia de `origin/main`. Ningún `js/` nuevo o tocado pasa de 400 líneas (el mayor, `guias-editor.js`, 393). Sin errores de consola en ningún recorrido. Además de las pruebas de la sesión, pasé a mano (clics reales) estos recorridos.
  - Segundo revisor: **Añadir una tarea de la lista sale con su plantilla** — coincide. La ventana es la de 518 (buscador, grupos por lo que hacen con «Otra cosa» al final, «se usa en N tipos», «Para»). La tarea con plantilla sale con «Enviar correo» y «Plantilla «…». Ya están todos los datos».
  - Segundo revisor: **Crear una tarea con plantilla nueva desde la ventana** — coincide con una salvedad. Se abre el editor de plantillas de siempre y la ventana vuelve con nombre, «Comunicar» y la plantilla nueva elegida; «Crear y añadir» la deja en el hito. Salvedad (decisión 8): al cancelar el editor la ventana no vuelve.
  - Segundo revisor: **Un nombre parecido enseña las parecidas** — coincide («¿Es alguna de estas?» con la existente).
  - Segundo revisor: **Cambiar una tarea avisa de sus tipos y cambia en las guías** — coincide en el efecto: aviso «Esta tarea se usa en 1 tipo: CERTIFICADO. Cambiará en todos. Los otros asuntos abiertos siguen como están.», cambia en la lista y en la guía y en el asunto desde el que se cambia. **No coincide en la forma con 518** (decisión 4): en 518 «Cambiar la tarea» es un botón visible en la tarjeta de la tarea; aquí está dentro del ⋮. Es una decisión de Francisco, no un fallo.
  - Segundo revisor: **Un asunto abierto de otro tipo no cambia** y **los otros asuntos abiertos siguen como están** — coincide. Con dos asuntos abiertos del mismo tipo (B y C): al cambiar el nombre desde B, C conserva el nombre de antes, como tarea suya («(propio)»). No he podido ver con el disco falso un asunto de otro tipo con la misma tarea común en un clic real; lo cubre `comunes-ventanas` (6d) y no lo he repetido a mano.
  - Segundo revisor: **Añadir un hito trae sus tareas; el plazo sigue siendo de cada guía** — coincide. El hito sale con sus dos tareas en el asunto y en la guía; el plazo del paso queda vacío y es de cada guía. No he cambiado el plazo en dos guías distintas con el editor para verlo, solo que el hito no lo trae.
  - Segundo revisor: **«Solo este asunto» no toca la guía** — coincide (tarea y hito): la guía queda idéntica y la tarea queda como «(propio)», sin marca de común.
  - Segundo revisor: **Una guía con preguntas sigue igual** — coincide (comparada la lista de preguntas de todas las guías antes y después; las tareas dentro de las ramas no se pasan, decisión 10).
  - Segundo revisor: **La propuesta** — coincide. Ajustes › Herramientas (Mantenimiento) «Pasar las guías a las listas comunes», solo texto y «Copiar la propuesta como texto», sin botón de aplicar. Con la demo: 58 tareas escritas → 51 (6 se unen, 7 menos) y 40 hitos → 36 (3 se unen, 4 menos), y las cuentas cuadran; guías y listas idénticas antes y después. Aviso de uso: el bloque solo se crea si se abre Ajustes antes que Herramientas; si Francisco va directo a Herramientas tras entrar, no lo ve hasta pasar por Ajustes (sale al refrescar con Ajustes a la vista). Es un fallo pequeño, a mirar.
  - Segundo revisor: **Aplicarla con la demostración** — no lo he podido ver: la propuesta no se aplica en esta fila (decisión 10 y fila 532); lo pide la lista de comprobación pero el texto de «Qué NO se hace» lo deja a la 532.
  - Segundo revisor: **Los 9 puntos de «Lo que entendió Claude»** — 1 coincide (nombre, lo que hace, plantilla; la lista fija es la pedida). 2 coincide. 3 coincide (hito compartido entero, plazo y lugar de cada guía), pero «Cambiar el hito» solo cambia nombre y explicación, no la lista de tareas del hito. 4 coincide en el asunto y en el editor de la guía («+ Añadir un hito/una tarea de la lista»); no coincide en que «+ Añadir tarea/hito» no sustituye a los de escribir (decisión 1). 5 coincide. 6 coincide. 7 coincide. 8 coincide. 9 coincide (propuesta sin aplicar).
  - Segundo revisor: **No coincide, para decidir por Francisco:** (a) «Lo que desaparece»: siguen las tareas libres en las guías («+ Añadir un hito/una tarea» en blanco) y «+ Traer un hito de otro tipo» (decisiones 1 y 3); y **además en el asunto sigue la caja «Nueva tarea… (escribe y pulsa Intro)» con «Qué se hace» y «Añadir», justo encima de «+ Añadir tarea»**, que la decisión 3 no menciona. En 518 solo está «+ Añadir tarea». Dejarlo se justifica por la fila 532, pero la usuaria verá dos formas de añadir una tarea. (b) «Cambiar la tarea» dentro del ⋮ y no como botón (decisión 4). (c) Con la demo las listas están vacías hasta pasar las guías (fila 532): «+ Añadir tarea» enseña «No hay ninguna tarea así»; es lo esperado, pero hasta entonces solo se puede crear. (d) Al añadir un hito a la guía con «Este asunto y los siguientes», llega también a otros asuntos abiertos del mismo tipo (como siempre llega lo de la guía), cosa que parece coherente con «los siguientes» pero Francisco debería confirmarla frente a «los otros asuntos abiertos siguen como están». (e) Crear una tarea con «Solo este asunto» también la deja en la lista común.
  - Segundo revisor: **Qué hace la app que el texto no pide:** los botones «+ Añadir tarea/hito» quedan apretados bajo el selector «Qué se hace» (se ve en la captura de la mesa, solo de aspecto); la copia de `_GESTOR` ampliada con los dos ficheros nuevos; nada más que haya visto.
  - Segundo revisor: **Veredicto: APRUEBO**, sin fallos que bloqueen. A corregir (menor): el bloque de la propuesta debería aparecer también si se entra directo en Herramientas. A decidir por Francisco: puntos (a) a (e) de arriba.
