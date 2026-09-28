# Cola de instrucciones para Claude Code

Estados: PENDIENTE / EN CURSO / HECHA / BLOQUEADA / IDEA / EN DISEÑO. IDEA: apuntada por Francisco, sin diseñar. EN DISEÑO: se está diseñando en una conversación de Cowork; lleva el enlace. Claude Code no toca ninguna de las dos.

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB) y
> otra vez el 20-sep-2026 (45 KB) y el 25-sep-2026 (50 KB). La tabla guarda solo número, documento y estado; **las notas
> largas van a `docs/HISTORIA.md`, no aquí**. El detalle de cada fila HECHA está en
> `docs/HISTORIA.md`, en el documento de la propia fila y en el historial de git.

## Reglas para Claude Code

0. **Una sola sesión y una sola fila** (norma del 27-sep-2026, `docs/REPARTO-DE-LA-COLA-2026-09-27.md`).
   Nunca trabajan dos sesiones de Claude Code a la vez en este repositorio, y no hay ninguna tarea
   programada que lance la cola: la lanza Francisco. Cada lanzamiento hace **solo la primera fila
   PENDIENTE**, la publica, comprueba la publicación y **para**. Si al empezar hay una fila EN
   CURSO, no se coge otra: se mira qué quedó en `main` y se termina esa. Las cláusulas comunes de
   las filas 188 en adelante (a `main` sin pull request, como mucho tres subidas, nada se sube con
   `npm test` en rojo) están en ese mismo documento. **«Comprueba la publicación» no es lo mismo que
   «espera a que Vercel publique»** (28-sep-2026, `docs/PUBLICAR-SIN-PARAR.md`): si Vercel no
   publica por una causa ajena a este repositorio (tope diario de despliegues, publicación que no
   arranca, cola de más de 20 minutos), la fila se deja **SIN PUBLICACIÓN COMPROBADA** y la sesión
   para con normalidad, sin quedarse esperando; el siguiente lanzamiento sigue con la fila
   siguiente. Solo una publicación **rota por el código de esta fila** (la construcción falla, la
   web da error, falta un fichero) sigue obligando a arreglarla antes de seguir.
1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**, leyendo la tabla **de arriba abajo**. Ojo:
   desde el 18-sep-2026 la tabla está en orden de trabajo, no de número, así que la primera
   PENDIENTE no tiene por qué ser la del número más bajo. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha, y **para** (regla 0): no cojas la siguiente. **La hora de `App.VERSION` sale del reloj de verdad**
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
    con la fila 63 (`216bff3a`, ~40 min sin publicarse), y el 28-sep-2026 con el tope diario de
    despliegues agotado (`docs/PUBLICAR-SIN-PARAR.md`, fila 211: el tope es de toda la cuenta de
    Vercel, no solo de este proyecto, y otro proyecto de Francisco puede agotarlo él solo). Si
    tienes acceso a la herramienta MCP de Vercel, `list_deployments` con el `sha` del commit lo
    confirma. **Como mucho un `create_deployment` a mano por sesión** (con `deploymentId` de la
    última publicación buena y `withLatestCommit: true`, `target: production`, para forzar una
    publicación desde el commit actual de `main` sin tocar el repositorio): si responde 402
    «Resource is limited», no se reintenta, se apunta el motivo y la fila queda **SIN PUBLICACIÓN
    COMPROBADA** (regla 0) en vez de bloquear la cola. Si no tienes esa herramienta, déjalo anotado
    aquí igualmente. Al empezar la siguiente fila, comprueba primero las filas SIN PUBLICACIÓN
    COMPROBADA que hubiera: si la web ya sirve una `App.VERSION` igual o posterior a la suya, pásalas
    a HECHA en la misma subida que marca la nueva fila EN CURSO.

## Reglas para Francisco

- **Una sola conversación de Claude Code a la vez.** Mientras está trabajando, no se lanza otra.
  Las instrucciones nuevas se apuntan aquí y esperan.
- Cada lanzamiento hace **una sola fila**. Cuando Claude Code termina y la publica, se vuelve a
  pegar la misma línea para la siguiente. Si no queda nada pendiente, Claude Code lo dice y no toca
  nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz solo la primera fila PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada, y para. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

Las filas 1 a 142 y de la 144 a la 146 están **HECHAS**. **Desde el 27-sep-2026 se hace una sola fila por lanzamiento** (regla 0). Sus documentos siguen en `docs/`, y el detalle de cada una en
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
| 165 | Editar el Word dentro de la aplicación («Guardar cambios» de `docs/WORD-DENTRO-DE-LA-APP.md`, parte B) | DESCARTADA (25-sep-2026, con Francisco): se sigue con plantillas de Word; para corregir, se cambia la plantilla o el dato y se vuelve a generar. Ni SuperDoc (AGPL) ni plantillas en Google Docs |
| 157 | `docs/COPIA-ACTUALIZAR-SIN-CARRERA.md` (en la copia sin internet, «Actualizar ahora» vuelve a leer la lista de ficheros al pulsar y reintenta una vez si un fichero no coincide; error en lenguaje llano, sin «sha256») | HECHA (25-sep-2026) |
| 158 | `docs/INSERTAR-HUECO-EN-EL-PASO.md` (el botón «Insertar hueco» de «Comunicación de este paso», en el editor del guion, no hace nada: se engancha antes de que el paso esté en la página) | HECHA (25-sep-2026). Ningún otro sitio tenía el mismo fallo |
| 159 | `docs/RESPONSABLE-ADMINISTRACION.md` (responsable fijo «Administración» en lugar de los nombres de las personas en el responsable por defecto de las guías, con migración; en un asunto concreto siguen las personas; «Qué me toca» los reparte a los dos; y en la biblioteca de hitos, «Firma de Secretaría» y «Visto bueno de Dirección»; después de la 154) | HECHA (25-sep-2026). Los dos hitos de firma entran solos en la biblioteca (sin pulsar nada) |
| 160 | `docs/VERSIONES-PREVIAS.md` (subcarpeta «Versiones previas» en cada asunto: allí van el «SIN SELLAR» al registrar y el Word cuando ya tiene su PDF; en la ficha y en la mesa, plegadas en «N versiones previas · ver»; fuera del índice del expediente; botón en Mantenimiento para ordenar lo que ya existe; después de la 155) | HECHA (25-sep-2026). El índice del expediente guarda su marca «original sin sellar» para los asuntos aún sin ordenar |
| 163 | `docs/AVISO-DE-PARECIDOS-AL-CREAR.md` (en Nuevo asunto, al elegir el tercero, recuadro con sus asuntos abiertos —los del mismo tipo en rojo y arriba— y los archivados del mismo tipo abiertos a 15 días o menos de la fecha del nuevo; sustituye el aviso ámbar; la parada al pulsar «Crear» no cambia) | HECHA (25-sep-2026). Pulsar un asunto del recuadro lleva a su ficha; al volver a «Nuevo asunto», lo escrito sigue ahí |
| 166 | `docs/TUTORES-LEGALES-COMO-TERCERO.md` (categoría nueva de tercero `TUTORES LEGALES`: sale sola del RegAlum, carpeta `Apellidos, Nombre` + 4 últimos del DNI, ficha con sus hijos, «Asuntos de sus tutores» en la ficha del alumno, y no desaparece si el hijo deja el centro; antes, todas las listas de categorías leen `Nombres.CATEGORIAS`) | HECHA (25-sep-2026). Las categorías nuevas van al final de la lista (los botones se reconocen por su sitio); detalle en `docs/contexto/TUTORES-Y-ADMINISTRACIONES.md` |
| 167 | `docs/ADMINISTRACIONES-COMO-TERCERO.md` (categoría nueva de tercero `ADMINISTRACIONES`: organismos agrupados por «Depende de» y centros educativos; carpeta con nombre corto estable —código de centro en los centros, nunca DIR3 ni Consejería—; árbol de departamentos con contacto, departamento opcional en el asunto, nombres anteriores buscables, y botón en Mantenimiento para traer lo que hoy está en OTROS y EMPRESAS; después de la 166) | HECHA (25-sep-2026). El correo del departamento va en «Otro correo» del cuadro, detrás del del hito y de «Lo pide»; «Pasar a Administraciones» renombra también las carpetas archivadas y rehace el índice |
| 168 | `docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md` (las opciones de cada documento en su fila: «+ Añadir documento» junto al título, ⧉ detrás del nombre para copiarlo sin extensión, «Poner nombre» siempre visible, ⋮ solo con «Pasar a versiones previas» y «Borrar»; las herramientas de PDF pasan a una barra encima del documento en el visor; fuera el botón «Documentos ▾» de la ficha) | HECHA (25-sep-2026). Las herramientas de PDF usan la barra de acciones que el visor ya tenía para «Por clasificar» |
| 170 | `docs/PLANTILLAS-DEL-COMPANERO.md` (50 plantillas ya escritas —34 de documento y 16 de correo— sacadas de los documentos del compañero, las escribe `docs/plantillas-nuevas/generar.py` en `plantillas/`; texto propio para Séneca en los correos; quitar el saludo repetido de los correos de antes; tipos y campos nuevos en la biblioteca; la Consejería por defecto) | HECHA (25-sep-2026), según su documento corregido: sin tipos ni campos nuevos y sin tocar la Consejería. Las 64 plantillas encuentran su tipo |
| 171 | `docs/DOCUMENTO-PARA-CADA-RELACIONADO.md` (en la mesa del hito, «… para cada relacionado»: un documento por relacionado y un correo a cada uno con el suyo; para los certificados de actividad extraescolar; después de la 170) | HECHA (25-sep-2026). Lo que falta de una persona va al resumen; lo del asunto se pregunta una vez. Nunca dos veces: `idEnvio` fijo y `ficha.enviosPorPersona` |
| 172 | `docs/PAPELERA-BUSCADOR.md` (caja de búsqueda en Ajustes › Papelera: filtra mientras se escribe, por palabras sueltas sin tildes, en nombre, qué era, de dónde salía, quién y fecha; contador «N de M») | HECHA (26-sep-2026). `pruebas/papelera-buscador.mjs` nueva; batería completa en verde |
| 173 | `docs/NUEVO-ASUNTO-SIN-REPETIR.md` (tanda 1 de usabilidad, parte 1: `App.nuevoAsuntoCon` con tercero que espera al tipo; cambiar de tipo no borra el tercero; el tercero recién dado de alta queda elegido; una sola pregunta de vía, dentro de «Quién lo pide y por qué vía»; «Marcar como hecho» lleva al hito siguiente; guion completo pregunta si se da por hecho; «Guardar PDF» cierra el visor de Word) | HECHA (26-sep-2026). `pruebas/nuevo-asunto-sin-repetir.mjs` nueva |
| 174 | `docs/POR-CLASIFICAR-USA-LO-LEIDO.md` (tanda 1, parte 2: el cuadro de «Poner nombre» nace con la fecha y el registro leídos y se abre directo tras meter o crear; guardar lo cierra; un solo botón «Crear asunto con él» que usa lo leído; los adjuntos de correo pasan por el cuadro de nombre; «Registrar» deja el original «SIN SELLAR» en «Versiones previas»; después de la 173) | HECHA (26-sep-2026). `pruebas/por-clasificar-usa-lo-leido.mjs` nueva |
| 175 | `docs/PERSONAS-ARCHIVO-Y-MENU.md` (tanda 1, parte 3: la ficha de una persona enseña sus asuntos pulsables y «+ Nuevo asunto para esta persona»; el Archivo carga solo; el menú nace abierto en pantalla ancha; el buscador de Asuntos abiertos busca en todos los montones; cinco textos que despistan; el plazo de un paso sin «desde» ya no se pierde; después de la 173) | HECHA (26-sep-2026). `pruebas/personas-archivo-y-menu.mjs` nueva; `npm test` completo (170 ficheros) y el CI de GitHub, en verde |
| 176 | `docs/DATOS-ENTRE-ORDENADORES.md` (tanda de estabilidad, parte 1: las listas de la ficha —hilos, relacionados, pendientes de registro, notas— se funden elemento a elemento con `App.anotarLista`; lápida para los asuntos archivados, borrados o unidos, que respetan `anotar`, `fusionarConDisco` y la fusión de conflictos; el vistazo de 20 s relee `asuntos.json` e `hitos.json` si cambiaron; la guía relee antes de escribir; presencia en un fichero por usuario y conflictos que hoy nadie recoge) | HECHA (26-sep-2026). `pruebas/datos-entre-ordenadores.mjs` nueva; `js/conflictos.js` partido en `js/conflictos-datos.js` (pasaba de 600 líneas); `npm test` completo en verde |
| 177 | `docs/ARCHIVO-POR-CURSO-Y-RUTAS.md` (tanda de estabilidad, parte 2: índice del ARCHIVO en un fichero por curso académico con resumen en la raíz, migración sola, selector «Curso» en Archivo; los topes de largo cuentan la ruta completa dentro de Dropbox y avisan de lo que ya se pasa; después de la 176) | HECHA (27-sep-2026, cerrada por la fila 188). Todo el trabajo ya estaba en `main`; solo faltaban dos líneas de `docs/CONTEXTO-CORTO.md` (índice por curso, tope por ruta) |
| 178 | `docs/CORREO-VERSIONES-Y-LIMPIEZA.md` (tanda de estabilidad, parte 3: el script recuerda los envíos 60 días y la app comprueba su versión; `_esquema` en los ficheros compartidos; aviso de versión nueva también en la web; la copia de seguridad se verifica antes de sobrescribir; `script-src` en las cabeceras; datos de prueba inventados; hitos que no quedan huérfanos al archivar; después de la 177) | HECHA (26-sep-2026). Publicado y comprobado con `curl` de forma independiente: `App.VERSION` `26-sep-2026 · 21:11`, cabecera `content-security-policy` con `script-src 'self' blob:`, y `SCRIPT_ESPERADO` de la fila 178 en `js/correo-enviar.js` publicado. `npm test` completo en verde antes de subir. Detalle en la nota de más abajo |
| 179 | `docs/VOCABULARIO-EN-PANTALLA.md` (tanda 2 de usabilidad, parte 1: una sola palabra para cada cosa en todos los textos de pantalla —guía, hito, tarea, tercero, familia, plantilla, impreso oficial, registrar, guardar en el asunto, cambiar, quitar/borrar—; solo rótulos, ningún dato; después de la 178) | SUSTITUIDA (27-sep-2026) por las filas 189 y 190. Los textos cambiados en unos 43 ficheros se quedan; las pruebas que buscaban las palabras viejas, puestas al día por la fila 188 |
| 180 | `docs/INICIO-CUATRO-BLOQUES.md` (tanda 2, parte 2: la pantalla de Inicio con cuatro bloques —Ha llegado, Me toca hoy, Esperamos a otros, Todos los asuntos abiertos—, según `docs/boceto-inicio.html`; «Qué me toca» deja de ser pantalla aparte; después de la 179) | SUSTITUIDA (27-sep-2026) por las filas 191 y 192 |
| 181 | `docs/AVISOS-MENU-Y-VOLVER.md` (tanda 2, parte 3: los avisos de arriba en una sola línea con un solo botón para callarla; el menú lateral; un solo «Volver» que siempre vuelve a la pantalla anterior, también en la mesa del hito; después de la 180) | SUSTITUIDA (27-sep-2026) por las filas 193 y 194 |
| 182 | `docs/AVISOS-A-QUIEN-LO-PIDE.md` (camino 1: casilla por hito y por tipo «avisar a quien lo pide», siempre con confirmación en el cuadro de Correo; plantillas «Aviso de avance» y «Aviso de cierre»; botón «Enviar estado» en ficha y mesa; «Preparar informe para dirección» en Cuentas; después de la 181) | SUSTITUIDA (27-sep-2026) por las filas 195 y 196 |
| 183 | `docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md` (tanda 3 de usabilidad, parte 1: buscador único de terceros en todas las categorías, la parrilla de tipos limitada a la categoría de la persona, resumen de la guía al pulsar el tipo, un solo bloque de detalles, «Crear» abre la mesa del primer hito; el camino tipo-primero sigue; después de la 182) | SUSTITUIDA (27-sep-2026) por la fila 197 |
| 184 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md` (tanda 3, parte 2: lista de comprobación arriba de la pantalla del tipo, todo se guarda al cambiar, plazo y campos en un solo sitio, «Documentos de este paso» y «Comunicación de este paso» pasan a tareas, copias y días de aviso juntos en El centro, pestaña «Herramientas» encima de Ajustes con Papelera, Traer el alumnado, Tablas de datos y Restaurar copia; después de la 183) | SUSTITUIDA (27-sep-2026) por las filas 198, 199 y 200 |
| 185 | `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md` (texto del nombre de documento en el hito de la biblioteca —heredado—, en el hito propio o en el tipo de documento, y el cuadro sale relleno; cada hito de una guía lleva etiqueta «De la biblioteca / cambiado aquí / Propio», la biblioteca se ofrece al teclear el título, pregunta clara al guardar; después de la 184) | SUSTITUIDA (27-sep-2026) por las filas 201 y 202 |
| 186 | `docs/PAPELERA-SE-VACIA-SOLA.md` (la papelera se vacía sola a los 90 días, aviso 7 días antes en la línea de avisos, constancia de cada borrado en `papelera-borrados.json` con su lista en Herramientas › Papelera; después de la 185) | SUSTITUIDA (27-sep-2026) por la fila 203 |
| 187 | `docs/COMPROBACION-AL-ENTRAR.md` (al entrar, se revisan siete cosas de la configuración de cada ordenador —carpetas de Dropbox, carpeta de la BD de alumnado, bandeja de Gmail, script de envío, ruta de Dropbox, datos del centro, copia sin internet—; todo bien: marca verde en la cabecera, sin panel; si falta algo o no se pudo comprobar: panel con «Arreglarlo» en cada fila; después de la 186) | SUSTITUIDA (27-sep-2026) por la fila 204 |
| 188 | `docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 188: poner en orden lo que quedó a medias (cerrar la 177, que ya está subida; y poner al día las pruebas que la 179 dejó en rojo) | HECHA (27-sep-2026). `npm test` (166 ficheros) en verde; 23 pruebas puestas al día con las palabras nuevas de `docs/VOCABULARIO.md`; PR #130 fusionado en `main` (`e3f8dab3`). Esta sesión no pudo comprobarlo por `curl` ni por el conector de Vercel (sin acceso al proyecto), pero Francisco confirmó `App.VERSION` `27-sep-2026 · 04:03` en la web publicada, posterior a la subida. Publicación comprobada por Francisco |
| 189 | `docs/VOCABULARIO-EN-PANTALLA.md`, puntos 1 y 4, en los ficheros que faltan (ver `docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 189) | HECHA (27-sep-2026 05:11). `npm test` completo (173 ficheros) en verde con Chromium real |
| 208 | `docs/PRUEBAS-MAS-RAPIDAS.md` (`npm test` lanza varias pruebas a la vez; mientras se trabaja una fila, solo las pruebas de lo tocado, y la pasada completa una sola vez al final; la app no cambia) | HECHA (27-sep-2026 10:55). `npm test` completo (165 ficheros) en verde tres veces seguidas en paralelo (277.0 / 274.9 / 273.7 s). Antes (una tras otra, como iba hasta ahora): más de 20 minutos (se cortó a los 11 minutos, por la mitad de los ficheros, para no perder más tiempo con la medición). Dos pruebas de tiempos finos (`documentos-sueltos.mjs`, `repintar-solo-lo-que-cambia.mjs`) fallaban solo con la máquina a tope de CPU: van en `EN_SOLITARIO`, en serie al final. De paso, dos arreglos en la pantalla de Inicio (fila 191) vistos por Francisco en una captura real: "Me toca"/"Esperamos a otros" ya avisan cuando están vacíos, y el botón "Ver todo" ya no se queda con el marco del foco tras un clic. PR #135 fusionado (`b757509`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 10:55` y `css/inicio.css` ya trae `.inicio-lista-vacia` en la web publicada |
| 207 | `docs/UNIR-DOS-TIPOS.md` (en Ajustes, «Unir con otro tipo»: el tipo que desaparece pasa sus asuntos abiertos al que se queda, con la carpeta renombrada y sus hitos intactos; vale la guía del que se queda; plantillas, campos y recurrentes se suman; su nombre queda como alias; el ARCHIVO no se toca) | HECHA (27-sep-2026 12:08). `npm test` completo (166 ficheros) en verde con Chromium real, comprobado de forma independiente; botón y cuadro comprobados a ojo con Playwright (buscador, resumen, "Unir" que se enciende). PR #137 fusionado (`a09d4fd`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 12:08` y `js/tipos-unir.js` ya en la web publicada |
| 190 | `docs/VOCABULARIO-EN-PANTALLA.md`, puntos 2, 3 y 5, y la prueba de palabras prohibidas (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 190) | HECHA (27-sep-2026 06:10). `npm test` completo (174 ficheros) en verde con Chromium real |
| 191 | `docs/INICIO-CUATRO-BLOQUES.md`, apartados 1, 2, 3, 4 y 7: los bloques de Inicio y fuera «Qué me toca» (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 191) | HECHA (27-sep-2026 09:35). `npm test` completo (174 ficheros) en verde con Chromium real, comprobado dos veces de forma independiente |
| 192 | `docs/INICIO-CUATRO-BLOQUES.md`, apartados 5 y 6: la tabla de todos los abiertos (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 192) | HECHA (27-sep-2026 13:35). `npm test` completo (166 ficheros) en verde con Chromium real, comprobado de forma independiente; tabla y plegados comprobados a ojo con Playwright. Una prueba (`hito-desde-por-clasificar.mjs`) sumada a `EN_SOLITARIO` (mismo problema de CPU que la fila 208, no una regresión). Aviso de privacidad encontrado y anotado en «Lo que queda por hablar con Francisco», no arreglado (fuera del encargo). PR #139 fusionado (`4bc7a0a`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 13:35` y `js/inicio-plegados.js` ya en la web publicada |
| 193 | `docs/AVISOS-MENU-Y-VOLVER.md`, apartados 1 y 2: avisos en una línea y menú (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 193) | HECHA (27-sep-2026 16:52). `npm test` completo (167 ficheros) en verde con Chromium real, comprobado de forma independiente; franja de avisos y menú comprobados a ojo con Playwright. La CI de GitHub Actions falló primero por contención de CPU en dos pruebas ajenas a esta fila (`ajustes-por-tipo.mjs`, `mesa-comunicar-del-paso-y-guion.mjs`, sumadas a `EN_SOLITARIO`), arreglado y vuelto a pasar en verde. PR #141 fusionado (`9ef8aab`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 16:52` y `js/avisos-linea.js` ya en la web publicada (una primera lectura mostró una versión vieja por caché transitoria del despliegue, repetida un instante después salió correcta) |
| 209 | `docs/INICIO-EN-PESTANAS.md` (Inicio, segunda versión, boceto `docs/boceto-inicio-2.html`: «Ha llegado» y tablón a la izquierda; a la derecha pestañas «En Administración» —con o sin fecha—, «En espera», «Todos los abiertos», «Dormidos» sobre una sola tabla con Tercero y fecha de Inicio en vez del nombre de la carpeta; Responsable dentro de «Filtros»; los avisos filtran la tabla. Manda sobre `docs/INICIO-CUATRO-BLOQUES.md`) | HECHA y publicada (27-sep-2026 19:06). `npm test` completo (167 ficheros) en verde con Chromium real, comprobado de forma independiente; cuatro pestañas y filtrado por aviso comprobados a ojo con Playwright, sin errores de consola (confirma que no hay cascada de repintado). Arreglado de paso el aviso de privacidad pendiente de la fila 192 («Le toca a» con un reservado). La CI de GitHub Actions falló dos veces en `pruebas/inicio.mjs`, siempre con el mismo resultado erróneo (pestaña «Dormidos» enseñando otro asunto): no era contención de CPU sino una carrera real en la propia prueba (esperaba «alguna fila», no la fila en concreto, a diferencia de los demás pasos); arreglado esperando la fila por su `data-asunto`. De paso, `tras-cada-accion.mjs` sumada a `EN_SOLITARIO` (mismo problema de tiempos finos que las demás de esa lista). PR #145 fusionado (`070b2b6`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 19:06` y `js/inicio-tabla.js` ya en la web publicada. **Nota**: esta fila fue añadida a la tabla dos veces, por dos sesiones distintas a la vez (ver aviso más abajo en "Lo que queda por hablar con Francisco") |
| 194 | `docs/AVISOS-MENU-Y-VOLVER.md`, apartados 3 y 4: un solo «Volver» (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 194) | HECHA y publicada (27-sep-2026 20:00). `npm test` completo (167 ficheros) en verde con Chromium real, comprobado dos veces de forma independiente (la segunda tras corregir la colocación del botón de la mesa del hito, que rompía `pruebas/cabecera-compacta.mjs`: pasó de una fila propia a ir dentro de la tira de hitos, sin estirar). Comprobado a ojo con Playwright: Cuentas/Archivo/Personas/Ajustes con su «← Volver» (Inicio sin él), y «← Hitos» en la tira de la mesa. PR #148 fusionado (`9a05954`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 20:00` y `js/hito-mesa.js`/`js/usabilidad.js` ya en la web publicada (una primera lectura mostró contenido viejo por caché transitoria del despliegue, repetida un instante después salió correcta) |
| 195 | `docs/AVISOS-A-QUIEN-LO-PIDE.md`, apartados 1, 2 y 3: avisar a quien lo pide y «Enviar estado» (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 195) | HECHA y publicada (27-sep-2026 20:53). Módulo nuevo `js/avisos-lo-pide.js`; casilla por hito y por tipo, con plantilla; al marcar hecho o archivar se abre el cuadro de Correo relleno, con «Esta vez no»; «Enviar estado» en «El encargo» y en «···» de la mesa. Las dos plantillas se crean solas, válidas para cualquier tipo. Trabajo original de otra sesión (PR cerrado #147), revisado, adaptado al `main` de después de las filas 193/194 y comprobado por esta sesión antes de fusionar: detalle en `docs/HISTORIA.md`. Al integrarla se encontró y arregló un fallo real de concurrencia en `Hitos.leer()` (ver fila 197) |
| 196 | `docs/AVISOS-A-QUIEN-LO-PIDE.md`, apartado 4: informe para dirección (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 196) | HECHA y publicada (27-sep-2026 20:53). Módulo nuevo `js/cuentas-informe.js`; botón en Cuentas abre el cuadro de Correo sin destinatario, con los cinco apartados; `_GESTOR/informes.json` solo se pone al día si se envía de verdad. Trabajo original de otra sesión (PR cerrado #147), revisado y comprobado por esta sesión antes de fusionar: detalle en `docs/HISTORIA.md` |
| 197 | `docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md`, entero, con los ficheros que faltaban (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 197) | HECHA y publicada (27-sep-2026 20:53). Buscador único en las seis categorías, parrilla de tipos limitada a la categoría de la persona (o todos con etiqueta, sin ella), resumen de la guía en una línea, y «Crear» abre la mesa del primer hito. Prueba nueva `pruebas/nuevo-asunto-persona-primero.mjs`; varias pruebas viejas puestas al día. Trabajo original de otra sesión (PR cerrado #147), revisado, adaptado al `main` de después de las filas 193-196 y comprobado por esta sesión antes de fusionar: detalle en `docs/HISTORIA.md`. `npm test` completo (170 ficheros) en verde, comprobado dos veces de forma independiente. PR #150 fusionado (`86b47a6`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 20:53`, `js/avisos-lo-pide.js` y `js/cuentas-informe.js` ya en la web publicada. **Nota**: el despliegue automático de Vercel no arrancó solo para este commit (más de 20 minutos sin ninguna publicación en marcha, ni cancelada ni en cola, algo que no había pasado en ninguna fila anterior de esta sesión); se lanzó a mano con la herramienta de Vercel (`create_deployment`) apuntando al commit fusionado, y desde ahí terminó con normalidad. Conviene que Francisco lo tenga en cuenta por si vuelve a pasar |
| 198 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, apartados 1, 2, 3, 5 y 8: la pantalla del tipo (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 198) | HECHA y publicada (27-sep-2026 22:12). Lista de comprobación nueva arriba de la pantalla del tipo (`js/ajustes-tipo-comprobacion.js`); todo se guarda al cambiar, sin botones «Guardar campos»/«Guardar palabras clave»; el plazo se edita solo en «Datos del tipo» (tarjeta de la rejilla de solo lectura); los campos propios se crean y borran solo desde dentro de cada tipo; texto desfasado del editor de la guía actualizado. Implementado por un agente siguiendo un plan detallado, revisado por esta sesión: se encontró y arregló un bloqueo real (cola de `campos.json` anidada dentro de otra cola del mismo fichero, en `js/tipos-nombre.js` al renombrar un tipo), detectado porque `pruebas/tipos-nombre.mjs` se quedaba colgada 15 s de forma repetible (3/3, no CPU). `npm test` completo (171 ficheros) en verde, comprobado dos veces de forma independiente, más una prueba de estrés de escrituras concurrentes en `campos.json`. PR #152 fusionado (`8ca0fa7`). Publicación comprobada por `curl`: `App.VERSION` `27-sep-2026 · 22:12` y `js/ajustes-tipo-comprobacion.js` ya en la web publicada |
| 199 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, apartado 4: documentos y comunicaciones como tareas (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 199) | HECHA y publicada (28-sep-2026 01:59). Implementada por otra sesión (`0dc4e71`) en paralelo a esta (regla 0 saltada sin que ninguna lo supiera); esta sesión, al descubrirlo, revisó lo ya publicado y corrigió dos cosas que no cumplían decisiones ya dadas por Francisco (el asunto de correo escrito a mano se perdía; con correo y Séneca con texto distinto solo salía un aviso, no dos) y un tercer fallo real (un solo canal con texto se disparaba por el canal equivocado), más la limpieza del editor que se había quedado a medias (subpasos, `js/guias-comunicacion.js` borrado, `js/guias-documentos.js` recortado). PR #154, fusionado (`218248b`). Detalle completo en `docs/HISTORIA.md`. `npm test` completo (171 ficheros) en verde, comprobado dos veces de forma independiente (`CHROMIUM_PATH=/opt/pw-browsers/chromium`, necesario en el entorno de esta sesión). Publicación comprobada por `curl`: `App.VERSION` `28-sep-2026 · 01:59`, `js/guias-editor.js` con `textoDelCanal`/`tareaComunicar` (la corrección) ya en la web publicada, y `js/guias-comunicacion.js` da 404 (borrado de verdad); confirmado también con la herramienta de Vercel (`list_deployments`, commit `218248b`, `READY`, producción; la publicación automática no se disparó sola —tardanza ya vista otras veces— y se lanzó a mano con `create_deployment`) |
| 200 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, apartados 6 y 7: El centro y la pestaña «Herramientas» (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 200) | HECHA y publicada (28-sep-2026 04:04). Quedó SIN PUBLICACIÓN COMPROBADA por el tope diario de Vercel (402, `docs/PUBLICAR-SIN-PARAR.md`); Vercel volvió a publicar solo, sin que hiciera falta ningún despliegue a mano. Comprobado por `curl`: `App.VERSION` `28-sep-2026 · 04:04`, `js/herramientas.js` ya responde 200 (antes 404). PR #156 (commit `8d4efc8`), fusionado en el despliegue `dpl_AUvDC2B97z8EKHKZZHmrafAy5Tgs` (commit `176649a`, `READY`, producción, confirmado con `list_deployments`) |
| 201 | `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, apartados 1 y 4: el nombre sale propuesto (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 201) | HECHA y publicada (28-sep-2026 04:04). Igual que la 200: quedó sin comprobar por el tope diario de Vercel, que se recuperó solo. Comprobado por `curl`: `App.VERSION` `28-sep-2026 · 04:04` y `js/documentos-formulario.js` ya trae `propuestaDesdeHito`. PR #159 fusionado en `176649a`, publicado en `dpl_AUvDC2B97z8EKHKZZHmrafAy5Tgs` (`READY`, producción) |
| 211 | `docs/PUBLICAR-SIN-PARAR.md` (el tope diario de Vercel no para la cola; investigar qué gastó las 100 publicaciones del 28-sep-2026 y cortar lo que sobre) | HECHA (28-sep-2026 04:09). Reglas 0 y 19 de esta cola puestas al día con el mismo texto que `CLAUDE.md`. Investigado con `list_deployments`: el tope es de toda la cuenta de Vercel; el mismo día, el proyecto `partituras-de-caja-clara` (otra sesión) gastó tantos despliegues como este. Este repositorio ya tenía el `ignoreCommand`/`git.deploymentEnabled` que pide `docs/NO-GASTAR-PUBLICACIONES.md`: nada que cortar por este lado. Detalle y lo que queda por decidir con Francisco (separar cuentas, plan, coordinación) en `docs/HISTORIA.md` y en «Lo que queda por hablar con Francisco». Solo documentación: sin código que publicar en Vercel |
| 202 | `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, apartados 2 y 3: de dónde viene cada hito, y la biblioteca se ofrece sola (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 202) | HECHA (28-sep-2026 06:00). Vercel publicó solo, sin despliegue a mano: comprobado por `curl`, `App.VERSION` `28-sep-2026 · 05:48` y `js/guias-biblioteca-guardias.js` responde 200 con el contenido nuevo (antes 404); confirmado también con `list_deployments` (commit `7e73954`, `READY`, producción). Cierra el AVISO de la sesión anterior. |
| 212 | `docs/INICIO-A-TODO-EL-ANCHO.md` (Inicio, tercera versión, sobre la fila 209: fuera la columna izquierda; una fila con «Ha llegado: N correos · N documentos por clasificar» —cada trozo abre «Ver todo» solo con eso— y los avisos en un cuadro ámbar pequeño con ✕; el tablón compacto arriba a la derecha, en la cabecera; filtros plegados al entrar) | HECHA (28-sep-2026 07:22). `npm test` completo (178 ficheros) en verde con Chromium real (una prueba nueva, `hito-mesa.mjs` sumada a `EN_SOLITARIO`: fallaba a la segunda pasada por contención de CPU, sola pasa). Sin `git push` de verdad: subido con la herramienta MCP de GitHub, fichero a fichero, cada uno comprobado con `git hash-object` contra lo subido (regla 11/12; `docs/contexto/PANTALLA.md` necesitó una segunda subida por un salto de línea final que faltaba en la primera, detectado así antes de publicarse). `js/tablon.js` se partió en dos (`js/tablon.js`, solo datos, y `js/tablon-compacto.js`, la pantalla) para no pasar de 600 líneas. Publicación comprobada por `curl`: `App.VERSION` `28-sep-2026 · 07:09`, `js/tablon-compacto.js` responde 200, `index.html` sin `#inicio-lado` y con `#inicio-tablon-hueco`, `js/nucleo.js`/`js/vista.js` con `Vista.cerrarFiltros`. Detalle completo (para pegar en `docs/HISTORIA.md`) en la nota al final de este documento. |
| 205 | `docs/RESPONSABLE-UNA-ADMINISTRACION.md` (responsable de un hito: «Una Administración…», para elegir un organismo dado de alta, como la Delegación Territorial; el asunto pasa a «Esperando a…» ese organismo) | SIN PUBLICACIÓN COMPROBADA (28-sep-2026 08:30). Programada y probada: `npm test` completo (178 ficheros) en verde salvo `tras-cada-accion.mjs`, que falla igual en solitario sobre el `main` de antes de esta fila (no es de esta fila; aviso más abajo). Módulo nuevo `js/responsable-organismo.js` y prueba `pruebas/responsable-organismo.mjs`; «Una Administración…» sale al final de la lista de la mesa del hito y del «Responsable por defecto» del editor de guías (buscador en línea, sin cerrar el editor); el filtro «Responsable» de Inicio ofrece los organismos con hitos abiertos. Subido con la herramienta MCP de GitHub (sin `git push`), tres commits de código comprobados uno a uno por hash. **Motivo**: Vercel publicó las partes 1 y 2 (`5ae53c7`, `READY`) pero no arrancó sola la del último commit (`c60c4af`, con `index.html`, que es el que carga el módulo): la web sigue en `App.VERSION` `28-sep-2026 · 08:09` y sin la línea nueva en `index.html`, así que Francisco aún no ve el cambio. El `create_deployment` a mano fue denegado por el sistema de permisos; hace falta que Francisco lo lance (o que otra sesión lo compruebe) |
| 203 | `docs/PAPELERA-SE-VACIA-SOLA.md`, entero, con `js/copias.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 203) | PENDIENTE (27-sep-2026) |
| 206 | `docs/HITOS-DESDE-EL-ASUNTO.md` (crear, cambiar y borrar hitos desde la mesa de un asunto, con «Colocar después de»; cada cambio pregunta si va también a la guía, ya marcado, y llega a los asuntos abiertos del tipo donde el hito esté vacío; solo se borran hitos vacíos) | PENDIENTE (27-sep-2026) |
| 210 | `docs/HILO-SIN-REPETIR.md` (el PDF del HILO de correos: lo último arriba, sin citas repetidas, y adjuntos sin repetir) | PENDIENTE (27-sep-2026) |
| 213 | `docs/BOTON-DE-SOPORTE.md` (botón «Soporte» en una esquina: error o mejora, texto y captura opcional; buzón en un script de Google que guarda el aviso en Drive y apunta una IDEA sin datos en la cola; más `docs/PONER-EN-MARCHA-SOPORTE.md` para Francisco) | PENDIENTE (28-sep-2026) |
| 204 | `docs/COMPROBACION-AL-ENTRAR.md`, entero, con `js/cabecera-fija.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 204) | PENDIENTE (27-sep-2026) |
| 214 | El botón para levantar la vista de los documentos por clasificar no funciona. | IDEA (28-sep-2026): apuntada por Francisco desde el Centro de mando |
| 215 | La nueva forma de crear un asunto no funciona. No hay botón de aceptar la selección (Tipo de tercero + Tipo de asunto). La lista de tipo de asuntos no filtra por el tipo de tercero elegido. La lista de tipo de asuntos es enorme. Elegido el tipo de tercero no me ofrece buscar el tercero. | IDEA (28-sep-2026): apuntada por Francisco desde el Centro de mando |

**Compactado el 25-sep-2026.** Las notas largas de las filas HECHAS (63, 76 y de la 104 a la 146)
salieron de aquí: están todas en `docs/HISTORIA.md` y en el historial de git. Lo que quedaba
abierto en ellas:

- Fila 76: **comprobado publicando de verdad, 25-sep-2026.** `App.VERSION` en la web sigue la hora
  real de cada publicación (`Europe/Madrid`), generada sola por el `buildCommand`, sin ningún
  commit nuevo al repositorio. Cerrado, nada pendiente.
- Filas 147, 148 y 149: **comprobado publicando de verdad, 26-sep-2026** (`curl`, versión
  publicada `26-sep-2026 · 11:34`). Se sirven `js/hito-mesa-tarjetas.js` (200) y
  `fonts/NotoSansHK-latin-400.woff2` (200). Cerrado, nada pendiente.
- Filas 154 a 164 (25-sep-2026): **publicadas, comprobado por Francisco**: la web dice
  `25-sep-2026 · 15:16`. Justo mientras se publicaba vio «44 envolturas no se han aplicado» (el
  navegador mezcló ficheros de antes y de después); al volver a cargar, bien.
- Filas 166 y 167: **comprobado publicando de verdad, 26-sep-2026** (`curl`). Se sirven
  `js/tutores-legales.js` (200) y `js/administraciones.js` (200). Cerrado, nada pendiente.
- Filas 168, 170 y 171: **comprobado publicando de verdad, 26-sep-2026** (`curl`). Se sirve
  `js/generar-para-relacionados.js` (200) y la plantilla del certificado de actividad
  extraescolar está en `plantillas/indice.json`. Cerrado, nada pendiente.
- Fila 132: **comprobado con `curl -I`, 26-sep-2026.** Salen `content-security-policy`,
  `strict-transport-security` y `x-content-type-options` en la web publicada. Cerrado, nada
  pendiente.
- Fila 63: comprobar que `docs/COLA.md` da error en la web publicada.
- Numeración: `docs/PLANTILLAS-Y-FORMULARIOS-DESDE-EL-HITO.md` se presenta como «fila 146» y
  `docs/VENTANAS-QUE-CABEN.md` como «fila 142», pero ninguna de las dos está en la tabla.

## Lo que queda por hablar con Francisco (no son filas de la cola)

- **El tope diario de despliegues de Vercel es de toda la cuenta, no de este proyecto** (28-sep-2026,
  fila 211, `docs/PUBLICAR-SIN-PARAR.md`). Comprobado con `list_deployments`: el 28-sep-2026, en la
  misma franja horaria, `gestor-de-asuntos` tuvo 28 despliegues y el proyecto `partituras-de-caja-clara`
  (otra app de Francisco, sesión de Claude Code aparte) tuvo también 28, varios de ellos anotando
  «límite diario agotado» por su cuenta, dos veces en el mismo día. Este repositorio ya tenía puesto
  lo que pide `docs/NO-GASTAR-PUBLICACIONES.md` (`vercel.json`: `ignoreCommand` que salta la
  publicación si el commit solo toca `docs/`/`pruebas/`/`.github/`/`*.md`, y
  `git.deploymentEnabled.claude/**: false` para no publicar previews de las ramas de trabajo), así
  que no hay más que cortar por este lado. Lo que sí decide Francisco: si quiere separar los dos
  proyectos en cuentas de Vercel distintas, subir de plan, o coordinar de alguna forma cuándo
  trabaja cada cola, para que una no le quite el cupo a la otra un día muy activo en las dos a la
  vez.
- ~~Aviso importante (27-sep-2026, ~16:56): dos sesiones de Claude Code han trabajado en este
  repositorio a la vez, saltándose la regla 0 de esta cola.~~ **Resuelto (27-sep-2026, ~17:08),
  hablado con Francisco.** Fueron tres sesiones a la vez, no dos: además de la que subió
  directamente a `main` el cambio de `docs/COLA.md` (commit `5e688cc`, sin pull request,
  `Claude-Session: https://claude.ai/code/session_01DD2HGPqEfkgTHMpP4VgcjA`), una tercera sesión
  (`session_013zp9KwnnPK5vGJE6xqx9Wy`) abrió el PR #144 con la fila 193 duplicada (ya hecha y
  fusionada en el PR #141) y las filas 194-196 sin empezar todavía. Con permiso de Francisco, el
  PR #144 se ha cerrado sin fusionar (el código de la fila 193 que traía no hacía falta; las
  filas 194-196 siguen pendientes y se implementan de nuevo desde este `main`, una a una). No hay
  indicios de que ninguna de esas dos sesiones siga activa.
- **Aviso importante, sigue abierto (27-sep-2026, ~17:47): la sesión `session_013zp9KwnnPK5vGJE6xqx9Wy`
  (la del PR #144 cerrado más arriba) no se paró: ha seguido trabajando la cola por su cuenta, en
  paralelo a esta sesión, sin que ninguna de las dos lo supiera.** Ha abierto el PR #147 (rama
  `claude/wonderful-cray-lv9gwh`, reutilizada), con las filas 193 a 197 rehechas enteras —
  incluida la 194, que esta sesión acaba de terminar y fusionar por separado (PR #148, `9a05954`)
  — y dice en su propia descripción que la fila 198 «está en marcha». Esta sesión **no coge
  ninguna fila nueva de la cola (195 en adelante) hasta que Francisco diga qué hacer con el
  PR #147**: cerrarlo, revisarlo, o dejar que esa sesión lo termine. Si esa sesión sigue activa,
  más filas de las que aquí figuran como PENDIENTE podrían estar ya hechas por duplicado en esa
  rama: conviene mirar el PR #147 antes de repartir trabajo nuevo.
- ~~Aviso, encontrado en la fila 192: un asunto reservado puede enseñar el nombre del tercero
  donde no debería («Le toca a»/«Esperando a…»).~~ **Arreglado en la fila 209** (27-sep-2026):
  `App.textoLeTocaA` (`js/asuntos-lista-pintar.js`) pone el nombre genérico del papel
  («Familia», «Tercero», «Relacionado») en vez del nombre real, si el asunto está tapado.
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
- **Del informe del 18-sep-2026: la papelera, ¿se vacía sola?** Decidido con Francisco el
  26-sep-2026: sí, a los 90 días, con aviso 7 días antes y constancia de cada borrado. Es la fila 186.
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
- **Del 27-sep-2026 (fila 190): impresos «de la Junta» o «del centro».** El catálogo
  (`datos/formularios.json`, leído por `js/formularios.js`) no distingue quién hace el impreso:
  solo trae `via` (`descarga`, `centro`, `protocolo`, `seneca`), que dice cómo se consigue o se usa,
  no quién lo diseñó. Hoy todo el catálogo sale de anexos de una Orden de la Consejería (BOJA), así
  que no hay ningún impreso «del centro» de verdad todavía. Para la etiqueta que pide
  `docs/VOCABULARIO-EN-PANTALLA.md` hace falta que Francisco pueda dar de alta un impreso propio del
  centro (sin anexo del BOJA) y un campo nuevo en el catálogo que diga de quién es cada uno.

- **Prueba `pruebas/tras-cada-accion.mjs` en rojo** (28-sep-2026, fila 205): los pasos «3. al volver, la misma altura» y «3. y repintar la lista no la sube arriba» fallan también en solitario y también sobre el `main` de antes de la fila 205 (`53bb4fc`); viene de la fila 212 (Inicio a todo el ancho) o de antes. Sin arreglar por no ser de esta fila.
- **Fila 205, entrada de `docs/HISTORIA.md` pendiente** (regla 17, sin `git push`): 28-sep-2026, una Administración (organismo o centro dado de alta) como responsable de un hito: `adm:<id>[:<dep>]` + `responsableNombre` solo en el hito; nunca de Administración; filtro de Inicio; `docs/FICHEROS-DEL-REPOSITORIO.md` sin la fila de `js/responsable-organismo.js`. Lo que costó: un primer intento guardaba `responsableNombre: ''` en todo hito y rompía `renombrar-asunto.mjs` (los hitos se comparan enteros): ahora el campo solo existe si el responsable es un organismo.

## Descartado, no proponer otra vez (del informe del 18-sep-2026)

- **Editar el Word dentro de la aplicación, o plantillas en Google Docs** (25-sep-2026, fila 165,
  decidido con Francisco). El editor que respeta el Word es AGPL (obligaría a enseñar el código o a
  pagar licencia). Las plantillas en Google Docs harían pasar cada documento con datos del alumnado
  por Google, pedirían internet siempre (la copia sin internet no podría generar) y obligarían a
  rehacer la generación y todas las plantillas. Se sigue con Word: se ve, se guarda en PDF y se
  imprime dentro; para corregir, se cambia la plantilla o el dato y se vuelve a generar.

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

## Nota del 26-sep-2026, tarde (conversación de Cowork): fila 177 la trabaja otra sesión

Esta conversación marcó la fila 177 EN CURSO a las 14:13 sin haber empezado nada de verdad, y
Francisco avisó de que otra sesión, lanzada a las 15:04, ya la estaba trabajando desde antes. Se
vuelve la fila 177 a PENDIENTE (por si la otra sesión termina o se corta sin marcarla ella misma) y
esta conversación pasa a la fila 178 en su lugar, para no pisarse. Si al leer esto la fila 177 ya
está EN CURSO o HECHA otra vez, ignora esta nota: alguien la retomó bien.

**Actualización (26-sep-2026, 19:08):** la fila 178 seguía EN CURSO de otra sesión (no la había
empezado esta conversación), así que por la regla 6 no se toca. La fila 177, en cambio, llevaba
horas en `main` sin ningún fichero nuevo suyo (ni `js/nombres-topes.js` ni
`js/archivo-indice-construir.js`): nadie la había empezado de verdad todavía, pase lo que pasara en
otra conversación. Esta sesión la retoma con el trabajo ya hecho y probado en local (código,
pruebas y documentación), y la marca EN CURSO otra vez.

## Nota del 26-sep-2026 (sesión programada, Cowork): fila 178 cerrada y publicación comprobada

Esta sesión retomó la fila 178, que llevaba desde las 14:50 EN CURSO sin ningún commit de código
(la sesión anterior se cortó tras marcarla, sin empezar de verdad: por eso se retomó, pasados los
90 minutos sin commits nuevos de la regla de la tarea programada). El trabajo de los 8 puntos de
`docs/CORREO-VERSIONES-Y-LIMPIEZA.md` se hizo con una sesión auxiliar, en 9 subidas entre las
19:04 y las 19:32 (commits `1bca688d` a `833e11da`) en vez de las 2-3 que pide la regla 13: cada
prueba y cada punto de documentación subió por separado. **Para que no se repita:** de esas 9
subidas, solo 3 dispararon una publicación real de Vercel (`1bca688d`, `fe0097b6`, `15250de2` —
las de código; las 6 restantes, de pruebas sueltas o de documentación, Vercel las ignora sola por
el «ignored build step», así que no gastaron publicaciones del plan gratuito de verdad, pero si el
código se hubiera repartido igual de suelto sí las habría gastado). La próxima vez que se delegue
una fila en una sesión auxiliar, hay que decirle explícitamente que agrupe todo el código y las
pruebas en una sola subida final, como pide la regla 13, no una por fichero ni una por prueba.

Mientras esta fila estaba en marcha, otra sesión (no esta) trabajaba en paralelo la fila 177 (commits
sin `Claude-Session`, de las 17:31 a las 19:28) y tuvo que restaurar `docs/HISTORIA.md` varias veces
por subidas cortadas a la mitad (`Restaurar docs/HISTORIA.md parte 1/6` a `4/7`). Los ficheros de
esta fila 178 no coinciden con los suyos salvo `docs/CONTEXTO.md` y `docs/CONTEXTO-CORTO.md`, que
esta sesión volvió a bajar justo antes de subir (regla 10): no debería haber pisado nada de la fila
177, pero conviene que quien lea esto compruebe que ambas partes siguen presentes en esos dos
ficheros.

`docs/HISTORIA.md` no se ha tocado desde esta sesión: no hay línea de la fila 178 todavía. Con el
fichero tan grande y tan reciente de reconstruir (ver la nota de la fila 177, arriba), se deja
pendiente para una sesión con `git push` de verdad en vez de arriesgarse a truncarlo otra vez. La
entrada, cuando se añada: fila 178, 26-sep-2026, seis arreglos de estabilidad (envíos que no se
repiten, versión del script y de la web comprobadas, `_esquema` en `_GESTOR`, copia verificada,
CSP con `script-src`, hitos sin huérfanos al archivar); lo que costó de verdad fue el reparto en
9 subidas en vez de 2-3, ya anotado arriba.

Recuerda pegar el script de Gmail una vez (`docs/ENVIO-CUENTA-DEL-SCRIPT.md`): con esta fila
publicada, la app avisará en Ajustes › Enviar correo mientras el script pegado sea el de antes de
la fila 178.

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
compara con `git show 9da4f45:docs/COLA.md`.

## Nota del 26-sep-2026: docs/HISTORIA.md de la fila 172, ya pegado

Resuelto: una sesión con `git push` de verdad pegó la entrada en `docs/HISTORIA.md`. Nada
pendiente de la fila 172.

## Nota del 28-sep-2026 (sesión Cowork, fila 202): sin `git push`, entrada de docs/HISTORIA.md lista para pegar

Esta sesión no tiene `git push` de verdad: el proxy de git deniega el repositorio («not in
this session's authorized repository set»), así que todo el trabajo de la fila 202 se subió con
la herramienta MCP de GitHub, fichero a fichero (`push_files`/`create_or_update_file`),
comprobando cada uno con `git hash-object` contra lo subido antes de seguir (regla 11/12): una
vez hizo falta corregir una línea mal transcrita en `js/ajustes-centro.js` (detectada así, sin
llegar a publicarse). `docs/HISTORIA.md` (más de 200 KB) no se ha tocado, por la regla 17: la
entrada, para que una sesión con `git push` de verdad la pegue, es esta:

---

## Fila 202 (28-sep-2026): de dónde viene cada hito, y la biblioteca se ofrece sola

`docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, apartados 2 y 3 (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`,
fila 202). Cada hito de una guía lleva ahora una etiqueta fija junto al título («De la
biblioteca», «De la biblioteca · cambiado aquí», «Propio de este tipo»), pulsable si viene de la
biblioteca para ver el modelo y «Ver en la biblioteca». Al escribir el título de un hito nuevo,
si se parece a uno de la biblioteca (`U.parecidos`), se ofrece «Usarlo». Al guardar un hito
cambiado, la pregunta se reescribe en una sola frase con «Solo aquí»/«También en la biblioteca» y
cuántos tipos más lo usan. «Guardar en la biblioteca» avisa si ya hay un modelo parecido por el
título. El texto para los documentos (de un hito o de un tipo de documento) pasa por una guardia
de parecidos que avisa si otro sitio ya tiene el mismo texto y ofrece copiarlo tal cual.

Ficheros nuevos: `js/guias-biblioteca-guardias.js`, `js/guias-biblioteca-ajustes.js`
(`js/guias-biblioteca.js` volvía a pasar de 400 líneas, se partió en tres, los tres extienden el
mismo `GuiasBiblioteca`). Modificados: `js/guias-paso-bloques.js`, `js/guias-editor.js` (pasa
`nombreTipo` a `revisarAlGuardar`), `js/ajustes-centro.js` (guardia de parecidos en el «Texto por
defecto»), `css/guias.css`, `index.html` (los dos scripts nuevos), `pruebas/ejecutar.mjs`
(`refresco.mjs` a `EN_SOLITARIO`: fallaba solo por contención de CPU junto a otras, sola pasa 1/1).
Pruebas nuevas: `pruebas/guardia-parecidos-documentos.mjs` (jsdom, sin navegador),
`pruebas/guia-origen-biblioteca.mjs` (navegador de verdad). `npm test` completo (177 ficheros) en
verde con Chromium real.

Lo que costó de verdad: sin `git push`, cada fichero se subió y se comprobó por separado con la
herramienta MCP de GitHub; una vez hizo falta corregir una línea mal transcrita en
`js/ajustes-centro.js` (se detectó comparando el hash antes de seguir, sin llegar a publicarse
rota). El despliegue automático de Vercel no arrancó para ninguno de los commits de esta fila
(ni `READY` ni `CANCELED`: no aparecen en `list_deployments`), y el `create_deployment` a mano
(uno por sesión) respondió 402 «Resource is limited» por el tope diario de toda la cuenta de
Vercel (agotado también por otro proyecto, `docs/PUBLICAR-SIN-PARAR.md`): la fila queda **SIN
PUBLICACIÓN COMPROBADA**, pendiente de que la próxima sesión compruebe si Vercel ha publicado
sola.

---

## Nota del 28-sep-2026 (sesión Cowork, fila 212): sin `git push`, entrada de docs/HISTORIA.md lista para pegar

Como la fila 202: esta sesión tampoco tiene `git push` de verdad (mismo motivo: el proxy de git
deniega el repositorio). Todo el trabajo se subió con la herramienta MCP de GitHub, fichero a
fichero, cada uno comprobado con `git hash-object` contra lo subido antes de seguir (regla 11/12).
`docs/HISTORIA.md` no se ha tocado, por la regla 17: la entrada, para que una sesión con `git push`
de verdad la pegue, es esta:

---

## Fila 212 (28-sep-2026): Inicio, tercera versión: los asuntos a todo el ancho

`docs/INICIO-A-TODO-EL-ANCHO.md`, sobre la fila 209 (`docs/INICIO-EN-PESTANAS.md`). Fuera la
columna izquierda de Inicio y el botón grande «Ver todo (N)»: las pestañas y la tabla única
ocupan todo el ancho. Justo debajo de la cabecera, una sola fila: a la izquierda «Ha llegado: N
correos · N documentos por clasificar» (`js/inicio.js`), cada trozo un enlace que abre «Ver todo»
enseñando solo esa mitad (`App.irVista('clasificar', 'correos'|'documentos')`, nuevo segundo
parámetro en `js/asuntos-lista-montones.js`; `App.pintarSoloQueClasificar` pone las clases
`solo-correos`/`solo-documentos` en `#zona-clasificar` y el enlace «Ver también…» para volver a
las dos juntas); el número de documentos se resalta si hay alguno nuevo. A la derecha, el cuadro
de avisos de la fila 193 (`js/avisos-linea.js`), que deja de ocupar todo el ancho y cambia su
botón «Ocultar por hoy» por una ✕ pequeña.

El tablón (`js/tablon.js`) deja de ser una columna: cuelga de `#inicio-tablon-hueco`, dentro de la
propia cabecera de Inicio, entre «+ Nuevo asunto» y el buscador. Compacto: el campo de la nota
nueva nace de una línea y se abre con el resto de opciones al pulsarlo o si ya hay algo escrito;
las notas pendientes se ven en fila, cortadas con «…», como mucho tres; con más, o con alguna
hecha, «y N más»/«Ver las hechas» despliegan la lista entera (con el «papel» de siempre, editable)
por encima de la página (`.tablon-overlay`, `position: absolute`), que se cierra con su ✕, con
Escape o pulsando fuera. Al pasar de 600 líneas, `js/tablon.js` se partió en dos: él mismo se
queda solo con los datos (leer, `cambiar()`, quién soy, qué notas veo; expone `window.Tablon`) y
el fichero nuevo `js/tablon-compacto.js` (cargado justo detrás) se queda con toda la pantalla
(expone `window.TablonVista`, con `pintar()` y `ocupado()`, esta última la consulta `js/tablon.js`
antes de releer en cada vuelta de `window.Gestor.alRefrescar` para no repintar mientras se escribe
o se edita).

Los filtros de Inicio («Filtros», `js/vista.js`) empiezan siempre cerrados al entrar (antes se
recordaban abiertos de una vez para la siguiente, en `localStorage`: eso desaparece; `Vista.
cerrarFiltros()`, llamado desde `App.ir` en `js/nucleo.js` cada vez que se entra en Inicio) y el
botón dice «Filtros (N)» con alguno puesto.

Se conserva, invisible a ojo pero pulsable (`css/inicio.css`, `.panel-legado-oculto`, `position:
fixed` en una esquina), el botón `.panel[data-vista="clasificar"]` de siempre: varias pruebas de
`pruebas/` lo pulsan para abrir «Ver todo» con las dos mitades juntas, comportamiento que se
mantiene sin cambiarlas.

Ficheros nuevos: `js/tablon-compacto.js`, `pruebas/inicio-a-todo-el-ancho.mjs` (la prueba nueva
que pide el encargo). Modificados: `index.html`, `js/inicio.js`, `js/asuntos-lista-montones.js`,
`js/avisos-linea.js`, `js/bandeja-pantalla.js` (`BandejaPantalla.desplegar`, para «solo correos»),
`js/tablon.js`, `js/vista.js`, `js/nucleo.js`, `css/inicio.css`, `css/tablon.css`,
`pruebas/inicio.mjs` (puesta al día contra la columna izquierda que desaparece),
`pruebas/ejecutar.mjs` (`hito-mesa.mjs` a `EN_SOLITARIO`). `npm test` completo (178 ficheros) en
verde con Chromium real.

Lo que costó de verdad: sin `git push`, dieciocho ficheros subidos y comprobados uno a uno con la
herramienta MCP de GitHub (delegado en un agente auxiliar con la lista exacta de rutas y sha
antiguos, y la misma comprobación por hash); `docs/contexto/PANTALLA.md` necesitó una segunda
subida por un salto de línea final que faltaba en la primera, detectado por el hash antes de
llegar a publicarse mal. A media subida, otra conversación (de diseño, no de la cola) pasó la fila
213 de IDEA a PENDIENTE y añadió su fila a `docs/ESTIMACIONES.md`: no hubo choque porque tocaba
filas distintas de la tabla; se fusionó solo al volver a bajar `main`. El botón «Ver todo» grande
desaparece de la pantalla pero se conserva invisible para las pruebas antiguas
(`.panel-legado-oculto`): un primer intento con `position: absolute` sin `top`/`left` (para que
quedara "en su sitio de siempre") lo dejaba a veces debajo de otro elemento, que le robaba el
click a Playwright; con `position: fixed` en una esquina de la pantalla, sin ese problema.

---
