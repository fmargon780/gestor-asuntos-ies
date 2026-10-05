# Centro de mando: cinco mejoras (diseño del 5-oct-2026)

Diseño cerrado con Francisco el 5-oct-2026, en Cowork, una mejora cada vez y con su «sí» a cada
una. Este documento es la referencia común de las cinco. El trabajo se reparte en tres:

1. **El vigilante**: un programa dentro del buzón de soporte que mira los proyectos y manda
   correos. Fila 268 de esta cola, `docs/VIGILANTE-Y-CORREOS.md`. Lo hace Claude Code.
2. **El botón de soporte manda el correo de quien avisa**: fila 269 de esta cola
   (`docs/SOPORTE-MANDA-EL-CORREO.md`) y una fila igual en las colas de BD Alumnado, Ausencias y
   Guardias y Focus Lingo. Lo hace Claude Code, en cada repositorio.
3. **La página del Centro de mando** (https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E). No
   tiene repositorio: se programa desde una conversación de Cowork, con la sección 7 de este
   documento. **No es trabajo de Claude Code.**

Francisco aceptó expresamente dos excepciones a sus reglas: que el Centro de mando ponga una
tarea en la cola del Gestor (el buzón vive aquí) y que la página se programe desde Cowork.

## 1. Que el Centro de mando le avise a él

Hoy solo se entera de algo si tiene la página abierta. Decidido:

- **Solo se avisa de lo que le obliga a hacer algo.** Cuatro casos: Claude Code se ha parado a
  esperar su respuesta; una tarea se ha quedado a medias; una publicación ha fallado; un usuario
  ha enviado un aviso desde el botón de soporte. Con la mejora 2 se añade un quinto: una app
  caída. De lo que termina bien no se avisa.
- **Por correo**, a su Gmail personal. No por notificación de la app de Claude (cada comprobación
  gastaría cuota y solo podría mirar una vez por hora).
- **Un correo por cada cosa, sin repetirlo.** Vigila todos los proyectos que tienen cola, sin que
  él configure nada.
- **De 23:00 a 7:00 (hora de Madrid) calla.** A las 7:00, un solo correo con lo que pasó de noche
  y sigue sin resolver.

## 2. Vigilar que las apps funcionan

Hoy la página solo comprueba la publicación de las apps de Vercel. De las de Google no sabe nada.
Decidido:

- **Se vigila que la app abre**, nada más: cada pocos minutos se entra en la dirección de la app
  buena de cada proyecto (no en las copias de pruebas). No se toca ninguna app.
- **Dos fallos seguidos = caída.** El proyecto sale en rojo en el Centro de mando, con la hora
  desde la que está caída, y llega un correo.
- **Cuando vuelve a funcionar, un correo corto** que lo dice.
- De noche, la misma regla de la mejora 1.
- En el proyecto caído, un botón que abre Claude Code con la frase escrita para arreglarlo.
- Los proyectos sin dirección escrita salen como «sin vigilar».
- Descartado por ahora: que cada app avise sola de los errores de dentro (haría falta una tarea
  en cada app).

## 3. Memoria más allá de hoy: la vista «Semanas»

- Vista nueva junto a «Hoy» y «Panel general». Un proyecto por fila y una semana por columna, las
  ocho últimas.
- Cada casilla: **tareas terminadas y horas de trabajo de Claude Code**, separadas en dos: para
  la app y de herramientas. «Herramientas» son las tareas que no cambian lo que ve quien usa la
  app: la cola, el revisor automático, las pruebas, el propio Centro de mando.
- Arriba, el total de cada semana con el reparto entre app y herramientas.
- Al pulsar una casilla, la lista de tareas de esa semana en ese proyecto.

## 4. Contestar a quien envió un aviso

- **Por correo**, a quien avisó. Para eso el botón de soporte de cada app manda su correo (fila
  269 y sus hermanas).
- **Un único correo, cuando su aviso queda resuelto y publicado.** No hay correo de «recibido».
  Si Francisco descarta el aviso, no se envía nada.
- **Texto fijo, sin revisión de Francisco.** Nombra el día y la pantalla del aviso y dice que
  vuelva a pulsar el botón si sigue fallando.
- Sale desde la cuenta de Google del buzón; si la persona responde, le llega a Francisco.
- En el Centro de mando, cada aviso muestra «contestado el día X» o «sin contestar: no trae
  correo». Los avisos antiguos sin correo se quedan sin contestar.

## 5. Buscador

- Una caja de búsqueda arriba, siempre a la vista.
- Busca en las colas de todos los proyectos: tareas e ideas en cualquier estado.
- Resultados agrupados por proyecto, con número y estado. Al pulsar uno, se abre en su proyecto.
- No busca dentro de los documentos de instrucciones ni en el texto de los avisos de usuarios.

## 6. El fichero de estado: lo que el vigilante le cuenta a la página

El vigilante escribe, en cada pasada, un fichero de texto con JSON en el Drive del buzón:
carpeta `SOPORTE-AVISOS`, nombre exacto **`ESTADO-VIGILANTE.json`**, siempre el mismo fichero
(se cambia su contenido, no se crea otro). La página lo busca por su nombre con el conector de
Google Drive y lo lee. **No lleva nombres, correos ni texto de ningún aviso.**

```json
{
  "version": "texto de VERSION_SCRIPT",
  "actualizado": "2026-10-06T07:10:00Z",
  "cadaMinutos": 10,
  "repos": {
    "fmargon780/gestor-asuntos-ies": {
      "app": {
        "url": "https://asuntos.fmargon.com",
        "estado": "bien",
        "alcance": "entera",
        "desde": null,
        "comprobado": "2026-10-06T07:10:00Z"
      }
    }
  },
  "avisos": {
    "fmargon780/gestor-asuntos-ies#263": { "estado": "contestado", "fecha": "2026-10-06" }
  }
}
```

- `repos`: una entrada por cada repositorio que el vigilante alcanza y tiene cola.
- `app.estado`: `bien`, `caida` o `sin-vigilar` (no hay dirección escrita). `desde`: desde cuándo
  está caída. `alcance`: `entera` si se llega a la app, `entrada` si solo se llega a la pantalla
  de entrada de Google.
- `avisos`: clave `repositorio#fila`. `estado`: `esperando` (trae correo y aún no está resuelto),
  `contestado`, `sin-correo`, `descartado`, `propio` (lo envió el propio Francisco: no se le
  contesta) o `no-encontrada` (la fila ya no está en la cola ni en la historia).

Si hay que cambiar esta forma, se cambia aquí y en la página a la vez.

## 7. Lo que se programa en la página (conversación de Cowork)

Respeta las reglas de pantalla de Francisco: todo el ancho, páginas densas, lenguaje llano.

**Lectura del fichero de estado.** Con el conector de Google Drive: buscar por nombre exacto,
leer, y volver a leer cada minuto y medio como el resto. Si el fichero no existe, o su
`actualizado` tiene más de 30 minutos, aviso ámbar arriba: «El vigilante no responde desde las
HH:MM: no se están mandando correos». Si un proyecto con cola no está en `repos`: en su ficha,
«El vigilante no llega a este proyecto: añade su repositorio al permiso de GitHub «Soporte del
Gestor»».

**Mejora 2.** En cada proyecto, junto al estado de la web: «App: funciona», «App caída desde las
HH:MM» (rojo), «App sin vigilar» o «App: solo se comprueba la entrada». Una app caída pone el
proyecto en rojo en el lateral, en «Hoy › Necesita atención» y en el «Panel general». En el
proyecto caído, botón «Abrir Claude Code para arreglarla», que abre una conversación nueva con
esta frase: «Repositorio fmargon780/<repo>. Lee su CLAUDE.md y cúmplelo. La app publicada en
<url> no abre desde las HH:MM del D-mes. Antes de nada, comprueba la última publicación y
arréglala; no empieces ninguna fila de la cola.»

**Mejora 4.** En cada idea que viene del botón de soporte, una línea: «Contestado el D/M», «Se le
contestará cuando esté resuelto», «Sin contestar: el aviso no trae correo», «Descartado: no se
le escribe» o «Lo enviaste tú: no se contesta».

**Mejora 3, vista «Semanas».** Entrada nueva en el lateral, debajo de «Panel general».

- Las colas se recortan (en el Gestor, las filas HECHA salen a los dos días), así que la historia
  se saca de los cambios subidos a `main` de las últimas ocho semanas: la marca «fila N EN CURSO»
  es el principio y la marca «fila N HECHA» el final. Solo se leen al abrir la vista, y se
  guardan en el navegador seis horas.
- Título de cada tarea: el de la cola si la fila sigue en ella; si no, el del cambio subido que
  la nombra («Fila 266: …»); si no, «Fila N».
- Horas de una tarea: del principio al final, con un tope de seis horas. Sin marca de principio,
  cuenta como tarea y no suma horas.
- App o herramientas: por palabras del título. Son herramientas las que hablan de la cola, el
  revisor, las pruebas, el Centro de mando, el buzón o el vigilante, las estimaciones, `CLAUDE.md`,
  el contexto, el ahorro de cuota, la copia de pruebas o el método de trabajo. El resto, app.
- Semanas de lunes a domingo, hora de Madrid; la semana en curso, la primera columna tras el
  nombre. Cada casilla: «3 · 4 h app» y debajo «1 · 1 h herr.». Fila de totales arriba, con el
  reparto en tanto por ciento. Una nota fija: «Horas y reparto aproximados. No cuenta la cuota
  gastada ni el trabajo hecho en Cowork».
- Al pulsar una casilla, debajo de la tabla, la lista de esas tareas: número, título, horas y si
  cuenta como app o como herramientas.

**Mejora 5, buscador.** Una caja en la cabecera, a la izquierda de «Actualizar ahora». Busca,
sin distinguir mayúsculas ni tildes, en el número, el título, la instrucción y las notas de todas
las filas de todas las colas ya leídas, en cualquier estado. Desde dos letras. Resultados en la
parte derecha, agrupados por proyecto, cada uno con su número, su estado y su título; al pulsar
uno se abre su proyecto en la pestaña y el filtro donde está esa fila. Con la caja vacía, o con
Esc, vuelve a lo que había. Al pie: «No busca dentro de los documentos de instrucciones ni en el
texto de los avisos de usuarios».

## 8. Límites que Francisco ya conoce

- Mejora 2: en las apps que piden entrar con cuenta de Google se comprueba hasta la entrada. Al
  montarlo se le dirá en cuáles pasa.
- Mejora 3: horas y reparto aproximados; las tareas antiguas sin hora de inicio cuentan sin
  horas; no salen la cuota gastada ni el trabajo hecho en Cowork.
- Mejora 5: si una cola se ha recortado, las tareas que ya no están en ella no salen.
- Al poner en marcha el vigilante, Google puede pedirle un permiso, una sola vez.
