# Arreglos del hito en la pestaña «Trabajo» (tema 432)

Diseñado con Francisco el 23-oct-2026. Junta las ideas 427, 428, 429 y 430, fallos vistos al
simular el tema 397 (pestaña «Trabajo», filas 425 y 426). Fila de la cola: 434. Una sola sesión.

Antes de tocar nada, reproduce cada fallo en la demostración (`?demo=1`) sobre `main` de hoy.
Si alguno ya no pasa tras las filas 425 y 426, no lo toques y dilo en la nota de la fila.

## 1. Sin ventana al completar el hito (idea 430)

Hoy, cuando un hito pasa a tener todas sus tareas hechas por una acción del usuario, sale la ventana
«Este hito ya está completo» («¿Lo damos por hecho?», `preguntarGuionCompleto` en
`js/hito-mesa.js`, fila 173 punto 6). Sale al marcar la última tarea y también al traer un
documento que marca una tarea.

- Esa ventana desaparece. No vuelve a salir por ningún camino (marcar una tarea, traer o generar
  un documento, registrar, comunicar, «Hacer este hito»).
- **No se añade ningún botón nuevo.** El botón que ya existe en la cabecera, «Marcar como hecho»,
  se queda como está y resaltado mientras todas las tareas estén hechas (como hoy). La persona lo
  pulsa cuando quiere cerrar el hito. El hito nunca se cierra solo al completar las tareas.
- Siguen igual, porque los pide la persona: la ventana «¿Lo das por hecho igualmente?» al pulsar
  «Marcar como hecho» con algo obligatorio pendiente (`js/hitos-panel-lista.js`), y la casilla
  «Es lo que se esperaba. Termina la espera de…» al guardar un documento que entra.

## 2. Correo del tutor que falta, sin salir del asunto (idea 428, primera parte)

Hoy, en «Comunicar» del hito, si falta el correo del tutor sale el aviso ámbar
«… · Completarlo en Tablas de datos» (`js/correo-tutor-botones.js`), y el enlace saca del asunto.

- Fuera el enlace «Completarlo en Tablas de datos».
- El aviso trae, por cada tutor sin correo, una casilla para escribirlo allí mismo, con «Guardar».
  La línea que ya sale hoy debajo de «Otro correo» («No tengo el correo de <Nombre>. Escríbelo
  aquí y lo recordaré.», `js/correo-tutor.js`) se funde con esta: una sola casilla por tutor, no
  dos.
- «Guardar» apunta el correo **al momento** en `_GESTOR/correos-a-mano.json` (mismo formato y
  mismo guardado que hoy), sin esperar al envío. El aviso de ese tutor desaparece, el tutor queda
  elegido como destinatario («Para») y la persona sigue en el mismo sitio del asunto.
- No cambia el orden de búsqueda: primero el correo del listado del personal que llega del Centro
  de datos; solo si ahí no está, el escrito a mano.

## 3. Plantilla equivocada en el hito 2 de matrícula (idea 428, segunda parte)

En la simulación, el hito 2 de la matrícula de Pablo Aguilar Ponce proponía la plantilla final
(«Confirmación de matrícula», que en la demostración es una plantilla de correo). Mira dónde la
proponía y por qué. Si es un fallo de cómo la app elige la plantilla de un hito, arréglalo; si es
solo de los datos de la demostración (`js/demo/datos.js`), arregla los datos. Escribe en la nota de
la fila cuál de los dos era.

## 4. «Generar documento» ofrece las plantillas del tipo (idea 429)

En un hito sin plantilla propia, «Generar documento» debe ofrecer las plantillas de documento del
tipo de asunto, como hace el camino de `js/hitos-generar.js`. En un hito con plantilla propia,
primero la suya y debajo las del tipo.

Si el tipo MATRICULA de la demostración no tiene ninguna plantilla de documento, añádele una a los
datos de la demostración para poder comprobarlo.

## 5. Fuera el botón «Registrar» de la cabecera del hito (idea 427)

La idea 427 decía que «Registrar» del hito no veía los documentos sin registrar. Francisco ha
decidido quitar ese botón: no lo usa. El camino real es otro: se sube o se pone en la carpeta el
PDF sellado de Séneca, la app pregunta de qué documento del asunto es (`js/registro-sellado.js`),
se elige, y la app toma los datos del sello, aparta el original a versiones previas y se queda con
el sellado.

- Quita el botón «Registrar» de la cabecera del hito (`mesa-registrar` en `js/hito-mesa.js`).
- Cuando la app une un PDF sellado a un documento, por cualquier camino (desde el hito, desde la
  ficha o al detectarlo en la carpeta), si ese documento es de un hito y ese hito tiene tareas
  pendientes de registrar, se marca sola la primera de ellas.
- No se tocan: «Registrar» del menú ⋯ de cada documento, el de la lista de documentos de la ficha
  (escribir el registro a mano), ni el paso de registrar de «Hacer este hito».

## Ejemplo con datos reales

Cualquier asunto de **Expulsión** abierto: tiene un hito de comunicación a los padres y al tutor.
En la demostración, usar un asunto equivalente (de sanción o expulsión) y la matrícula de Pablo
Aguilar Ponce para los puntos 3 y 4.

## Cómo sabré que está bien

Acordado con Francisco. En un asunto de Expulsión (en la demostración, uno equivalente):

1. Al marcar la última tarea de un hito no sale ninguna ventana. «Marcar como hecho» queda
   resaltado, y el hito solo se cierra al pulsarlo.
2. Al traer un documento al hito tampoco sale la ventana «Este hito ya está completo».
3. En el hito de comunicación, si falta el correo del tutor, el aviso trae una casilla. Lo escribes,
   guardas y sigues en el asunto con el correo ya puesto.
4. El hito ya no tiene botón «Registrar». Subes el PDF sellado, dices de qué documento es, y la
   tarea de registrar del hito queda marcada.
5. «Generar documento» en un hito sin plantilla propia ofrece las plantillas del tipo de asunto. Y
   en matrícula, el hito 2 ya no propone «Confirmación de matrícula».

[SOLO FRANCISCO] Lo mismo en un asunto real de Expulsión.
