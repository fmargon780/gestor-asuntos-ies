# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB) y
> otra vez el 20-sep-2026 (45 KB) y el 25-sep-2026 (50 KB). La tabla guarda solo número, documento y estado; **las notas
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
17. **Sin `git push` ni acceso a `api.github.com`** (algunas sesiones, por la política de red de su
    entorno): todo pasa por la herramienta MCP de GitHub, fichero a fichero. `docs/HISTORIA.md` (más
    de 120 KB) ya no se puede reconstruir con fiabilidad en una sola sesión así: en vez de
    arriesgarse a truncarlo (regla 12), esa sesión deja el texto de la entrada ya escrito, listo
    para pegar, en una nota al final de este documento, para que una sesión con `git push` de
    verdad lo incorpore. Pasó con la fila 93 (23-sep-2026).
18. **Nunca pases el mensaje del commit como contenido del fichero.** El 23-sep-2026, al marcar la
    fila 103 EN CURSO, una llamada a `create_or_update_file` dejó por error el texto del mensaje
    de commit en el parámetro `content`, y `docs/COLA.md` se quedó en 83 bytes. Antes de cada
    llamada, comprueba que `content` es el documento entero y `message` es la frase del commit:
    son dos parámetros distintos, nunca el mismo texto.
19. **Tras fusionar o subir, comprueba con `curl` que lo publicado coincide con `main`** (por
    ejemplo `js/version.js?v=<algo distinto>`). Si `App.VERSION` publicada se queda atrás varios
    minutos, puede que Vercel no haya llegado a lanzar la publicación de los últimos commits (sin
    error visible: sencillamente no hay ninguna `deployment` para esos SHA). Pasó el 24-sep-2026
    con la fila 63 (`216bff3a`, ~40 min sin publicarse). Si tienes acceso a la herramienta MCP de
    Vercel, `list_deployments` con el `sha` del commit lo confirma, y un `create_deployment` con
    `deploymentId` de la última publicación buena y `withLatestCommit: true` (`target: production`)
    fuerza una nueva publicación desde el commit actual de `main` sin tocar el repositorio. Si no
    tienes esa herramienta, déjalo anotado aquí para que otra sesión lo compruebe: no reintentes
    subidas del mismo fichero pensando que el problema está en el contenido.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

Las filas 1 a 142 y de la 144 a la 146 están **HECHAS**. Sus documentos siguen en `docs/`, y el detalle de cada una en
`docs/HISTORIA.md`. Aquí queda solo lo que no está cerrado:

| Nº | Instrucción | Estado |
|---|---|---|
| 147 | `docs/MESA-TARJETAS-QUE-SE-ABREN.md` (la mesa del hito en tarjetas: una en grande, las otras dos de resumen a la derecha; pulsar una la abre en grande) | HECHA (25-sep-2026) |
| 148 | `docs/PRUEBAS-EN-VERDE.md` (las pruebas de GitHub en verde otra vez, y que un cambio solo de `docs/` no las lance) | HECHA (25-sep-2026). Fallaba `indice-del-expediente.mjs` desde la fila 138: esperaba el «Asunto archivado.» del asunto anterior, aún a la vista, y miraba el ARCHIVO antes de terminar |
| 149 | `docs/MEMBRETE-LETRA-DEL-MANUAL.md` (el nombre de la Consejería del membrete, con la letra Noto Sans HK del manual de la Junta, y la caja por defecto del membrete nuevo) | HECHA (25-sep-2026). La app dibuja el membrete entero; letra recortada con la API de Google Fonts (`text=`), porque esta sesión no llega a GitHub |
| 150 | `docs/MESA-COMUNICAR-DEL-PASO-Y-GUION.md` (el botón «Comunicar» de cada paso del guion, que no hace nada; y un enlace en la mesa para cambiar el guion del hito para todos los asuntos del tipo) | HECHA (25-sep-2026). El botón montaba su menú dentro de `.mesa-ocultos` (escondido): ahora llama en línea recta y marca el paso pulsado, no «el primero pendiente» |
| 151 | `docs/PLANTILLA-DESDE-EL-CUADRO.md` (crear o editar la plantilla desde el propio cuadro de Séneca y de Correo; al guardar, el mensaje se rellena con ella) | HECHA (25-sep-2026). Editor en línea (sin segundo cuadro), reutilizando el de Ajustes |
| 156 | `docs/REPARAR-DOCS-DE-LA-151.md` (devolver su contenido a `docs/CONTEXTO-CORTO.md` y `docs/contexto/CORREO-Y-SENECA.md`, que el cierre de la 151 dejó con la palabra `__READ__`) | HECHA (25-sep-2026). Los dos ficheros restaurados con `create_or_update_file`, tamaño comprobado tras subir contra el de local (13.982 y 36.814 bytes) |
| 152 | `docs/RUTA-QUE-NO-VA-A-BING.md` (el botón «Ruta» copia en formato `file:///` para que el navegador no busque en Bing, pide la ruta si falta, y sale también en los cuadros de Correo y de Séneca) | HECHA (25-sep-2026). Sin ruta apuntada ya no copia el nombre suelto: la pide (en línea si está dentro de un cuadro, con `U.preguntar` desde la ficha) |
| 153 | `docs/ENVIAR-DOCUMENTO-POR-SENECA.md` (el «Enviar» de cada documento del hito pasa a «Enviar ▾»: por correo o por Séneca, con ese documento ya elegido; después de la 150) | HECHA (25-sep-2026). Por correo, igual que antes (ya adjunto); por Séneca, señalado en una línea propia del cuadro con «Copiar el nombre» (no se pueden adjuntar ficheros allí). Al terminar por Séneca se marca el paso del guion, igual que la fila 150 |
| 161 | `docs/RUTA-SIN-PREGUNTAR.md` (**PRIORITARIA**: el botón «Ruta» deduce dónde está Dropbox en cada ordenador —en la copia sin internet, de su propia dirección— y guarda una vez para todo el centro la parte de dentro de Dropbox en `_GESTOR/rutas.json`; si tiene que preguntar, dice qué carpeta pide) | HECHA (25-sep-2026). Una ruta pegada que no acaba en la carpeta pedida no se guarda (aviso rojo) |
| 154 | `docs/HITOS-ACCIONES-EN-EL-HITO.md` (hitos más sencillos: las acciones solo en el hito; los pasos, lista para marcar con «receta» opcional que rellena el cuadro; todos los documentos del asunto a la vista en cada hito; y que «Paso N de M», «Hitos N/M» y la barra digan lo mismo; después de la 150 y la 153) | HECHA (25-sep-2026), partida como pide el propio documento: puntos 1, 2 y 5 aquí; 3 y 4, fila 164. El «Comunicar» de un paso (fila 150) se va hasta que lleguen las recetas |
| 164 | `docs/HITOS-ACCIONES-EN-EL-HITO.md`, puntos 3 y 4 (la «receta» opcional de un paso: comunicar, generar o registrar, que sale arriba en el menú del hito y deja el cuadro relleno, con los botones de hoy convertidos solos; y todos los documentos del asunto a la vista en la mesa de cada hito, «De otros hitos» con su etiqueta) | HECHA (25-sep-2026). La receta de registrar se enseña como título del menú «Registrar» (el sentido aún no rellena el cuadro de registro) |
| 162 | `docs/ESTADO-SIGUE-A-LOS-HITOS.md` (el estado es siempre el primer hito sin terminar, sin la regla de «gana Administración»; se recalcula con cualquier cambio; «Esperando a…» sale solo con el responsable del paso y lo puesto a mano dura hasta que cambia el paso; «Estamos en este paso» pasa a «Saltar a este paso» y el actual lleva «Paso actual»; después de la 154) | HECHA (25-sep-2026). La espera a mano vieja se limpia dentro de cada escritura de `hitos.json` |
| 155 | `docs/WORD-DENTRO-DE-LA-APP.md` (avisar de los datos que faltan antes de generar un Word; y el Word se abre dentro de la app, editable, con «Guardar PDF» en la carpeta del asunto, «Imprimir» y «Guardar cambios», sin pasar por Descargas) | HECHA (25-sep-2026) salvo «Guardar cambios» (editar el Word), que pasa a la fila 165. El Word se ve con docx-preview; el PDF, imagen a 200 ppp |
| 165 | Editar el Word dentro de la aplicación («Guardar cambios» de `docs/WORD-DENTRO-DE-LA-APP.md`, parte B) | BLOQUEADA (25-sep-2026): el editor de .docx en el navegador que respeta el Word (SuperDoc) es AGPL-3.0, y con la web publicada eso obliga a dar el código a quien la use; las libres (docx-preview) solo enseñan. Decidirlo con Francisco |
| 157 | `docs/COPIA-ACTUALIZAR-SIN-CARRERA.md` (en la copia sin internet, «Actualizar ahora» vuelve a leer la lista de ficheros al pulsar y reintenta una vez si un fichero no coincide; error en lenguaje llano, sin «sha256») | EN CURSO (25-sep-2026) |
| 158 | `docs/INSERTAR-HUECO-EN-EL-PASO.md` (el botón «Insertar hueco» de «Comunicación de este paso», en el editor del guion, no hace nada: se engancha antes de que el paso esté en la página) | PENDIENTE |
| 159 | `docs/RESPONSABLE-ADMINISTRACION.md` (responsable fijo «Administración» en lugar de los nombres de las personas en el responsable por defecto de las guías, con migración; en un asunto concreto siguen las personas; «Qué me toca» los reparte a los dos; y en la biblioteca de hitos, «Firma de Secretaría» y «Visto bueno de Dirección»; después de la 154) | PENDIENTE |
| 160 | `docs/VERSIONES-PREVIAS.md` (subcarpeta «Versiones previas» en cada asunto: allí van el «SIN SELLAR» al registrar y el Word cuando ya tiene su PDF; en la ficha y en la mesa, plegadas en «N versiones previas · ver»; fuera del índice del expediente; botón en Mantenimiento para ordenar lo que ya existe; después de la 155) | PENDIENTE |
| 163 | `docs/AVISO-DE-PARECIDOS-AL-CREAR.md` (en Nuevo asunto, al elegir el tercero, recuadro con sus asuntos abiertos —los del mismo tipo en rojo y arriba— y los archivados del mismo tipo abiertos a 15 días o menos de la fecha del nuevo; sustituye el aviso ámbar; la parada al pulsar «Crear» no cambia) | PENDIENTE |

**Compactado el 25-sep-2026.** Las notas largas de las filas HECHAS (63, 76 y de la 104 a la 146)
salieron de aquí: están todas en `docs/HISTORIA.md` y en el historial de git. Lo que quedaba
abierto en ellas:

- Fila 76: **comprobado publicando de verdad, 25-sep-2026.** `App.VERSION` en la web sigue la hora
  real de cada publicación (`Europe/Madrid`), generada sola por el `buildCommand`, sin ningún
  commit nuevo al repositorio. Cerrado, nada pendiente.
- Filas 147, 148 y 149 (25-sep-2026): fusionadas en `main` (`4fa0e65` y `d998333`, pruebas de
  GitHub en verde), pero la sesión no pudo comprobar lo publicado: su red bloquea `vercel.app` y el
  conector de Vercel da 403. Comprobar con `curl` que se sirven `js/hito-mesa-tarjetas.js` y
  `fonts/NotoSansHK-latin-400.woff2`, y que `App.VERSION` es de después de las 07:18 del 25-sep-2026.
- Fila 132: comprobar con `curl -I` que salen las cabeceras de seguridad nuevas.
- Fila 63: comprobar que `docs/COLA.md` da error en la web publicada.
- Numeración: `docs/PLANTILLAS-Y-FORMULARIOS-DESDE-EL-HITO.md` se presenta como «fila 146» y
  `docs/VENTANAS-QUE-CABEN.md` como «fila 142», pero ninguna de las dos está en la tabla.

## Lo que queda por hablar con Francisco (no son filas de la cola)

- De la fila 146 (25-sep-2026): en el Anexo III (solicitud de admisión) la propuesta pone el centro,
  su código y su localidad en «Centro prioritario» y en «Centro 1» (los que pide la familia), no en
  «Centro 2, 3, 4». Si «Centro 1» no debe ser el nuestro, se cambia a mano en Ajustes › Impresos
  oficiales. Los recuadros de fecha partidos (Día, Mes, Año) no se proponen: `{{HOY}}` es la fecha
  entera y no cabe en tres casillas.
- De la fila 144 (25-sep-2026): el archivo de la base de datos de alumnado puede traer alumnos que
  no están en el RegAlum (antiguos con historia). Como el RegAlum sigue siendo la base y el código no
  puede usar datos con nombre propio (ni el nombre del alumno), esos no aparecen como personas ni se
  pueden añadir a un asunto: «Por datos del alumnado» los cuenta aparte («y N sin ficha en el
  RegAlum»). Si se quieren, el acuerdo tendría que decir qué campos son el nombre y los apellidos.
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
- De la fila 104 (23-sep-2026): con el uso, un aviso que devuelva el asunto a "Pendiente de
  Administración" cuando vence el plazo de un hito de terceros, para reclamarlo.
- **Del informe del 18-sep-2026: la papelera, ¿se vacía sola?** Hoy avisa a los 30 días pero no
  borra nada sin que alguien pulse. Para datos de menores, un borrado que nunca ocurre no es lo
  ideal. **Hay que preguntarselo a Francisco**, y apuntar lo que decida. Es la parte que quedó sin
  hacer de la fila 68.
- **Del informe del 18-sep-2026: la ficha del asunto.** Se ha rehecho tres veces en cuatro días
  (filas 51, 52 y 58). La cuarta pasada la adelantó Francisco el 24-sep-2026: es la fila 107.
- **Del 21-sep-2026: quitar el tecleo de la clave de normativa.** En el apartado "Normativa" de un
  paso, un buscador que encuentre el artículo por su texto ("consejo escolar") y rellene la clave
  solo. Necesita que el sistema de normativa publique un índice ligero de claves y títulos. **Se
  diseña con Francisco a partir del miércoles 23-sep-2026 a las 14:00**, no antes.
- **Del 23-sep-2026: revisión de usabilidad.** Francisco ve pantallas con demasiadas cosas. Ajustes
  va en la fila 105 y la ficha del asunto en la 107. Queda por hablar Asuntos abiertos (qué plegar),
  con la misma regla: plegado, resumen en el título, y se recuerda lo abierto.
- **Del 25-sep-2026: hitos y pasos más fluidos.** Cerrado con Francisco: es la fila 154. Cuando
  esté publicada, ver con él si con eso basta o queda algo (por ejemplo, las palabras «hito»,
  «paso» y «guion»).

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

24-sep-2026: dos sesiones a la vez en la fila 115 (una programada, sin `git push`; otra con `git
push` real) no llegaron a pisarse — la segunda la completó entera antes de que la primera subiera
nada más que la marca EN CURSO. Pero si una sesión sin `git push` intenta escribir de un tirón un
fichero grande (por ejemplo, pasarle a un subagente el contenido entero de un fichero de más de
~50 KB dentro del propio mensaje), puede agotar su propio límite de respuesta antes de llegar a
subir nada: no es un fallo del repositorio, es la sesión quedándose sin aire a mitad de frase. Si
pasa, no ha tocado nada todavía (compruébalo con `docs/COLA.md` y el historial de commits antes de
seguir) — desházte de esa sesión y, si hace falta ayuda, repártela en trozos más pequeños.

25-sep-2026: esta misma tarde, varias sesiones distintas trabajaron la cola a la vez (filas
150-153, 155, 157, 158) y `docs/COLA.md` cambió de mano muchas veces en minutos: una subida rota
con `__READ__` (fila 151, corregida en la fila 156) y varias filas nuevas coladas entre medias.
Ninguna se perdió: cada sesión volvió a bajar `main` justo antes de subir, como pide la regla 10.

## Nota para la próxima sesión: docs/CONTEXTO.md y docs/HISTORIA.md de las filas 53-56

El código, las pruebas y `docs/CONTEXTO-CORTO.md` de las filas 53-56 están en `main` y comprobados
en producción, pero la sesión del 18-sep-2026 (mañana) **no pudo subir** las secciones
correspondientes de `docs/CONTEXTO.md` ni de `docs/HISTORIA.md` (225 y 217 KB: demasiado para
retipear de un tirón sin `git push`). Puede que falten todavía.

- A `docs/CONTEXTO.md`: el cuadro de Séneca en dos columnas (fila 53), el ayudante fiable (54), el
  asunto sin elección (55), el panel de campos de tres pestañas y los campos calculados (56), y
  las filas correspondientes de "Ficheros del repositorio" (`js/seneca-cuadro.js`,
  `css/seneca.css`, `js/campos-calculo.js`, `js/campos-catalogo.js`,
  `js/campos-calculados-editor.js`, `js/ajustes-tipo.js`).
- A `docs/HISTORIA.md`: la entrada del 18-sep-2026 de esas cuatro filas, con su "Lo que costó de
  verdad" (los bugs que las propias pruebas cazaron antes de producción).

Compruébalo contra lo que de verdad dice `main` antes de sustituir nada. Si la sesión tiene
`git push` de verdad (terminal u ordenador de Francisco), es mucho más simple que ir fichero a
fichero con la API.

## docs/HISTORIA.md, otra vez entero

24-sep-2026, fila 129: `docs/HISTORIA.md`, que se había cortado en la fila 82 al cerrar la fila
128, se ha recompuesto con el historial de git (lo de la fila 82 hacia atrás, sacado tal cual del
commit `86d22d4`) y se ha subido con `git push` de verdad. Nada pendiente.

## Nota del 25-sep-2026 (conversación, fila 151)

Al apuntar la fila 151, esta conversación subió `docs/COLA.md` por error con la palabra
`PLACEHOLDER` (commit `e018732`) y lo restauró en el commit siguiente, retipeado desde la versión
`f3ae4b7`. Si algo de este documento no cuadra, compáralo con `git show f3ae4b7` (el blob anterior)
o con el commit padre de `e018732`: la única diferencia buscada es la fila 151 y esta nota.

## Nota del 25-sep-2026 (conversación, fila 159)

Al apuntar la fila 159, la conversación volvió a subir `docs/COLA.md` roto (commit `0ce55fe`, con
el texto `__SEE_BELOW__`) y lo restauró en el commit siguiente, retipeado desde el blob `fdb042d`
(commit `9da4f45`). La única diferencia buscada es la fila 159 y esta nota. Si algo no cuadra,
compáralo con `git show 9da4f45:docs/COLA.md`.
