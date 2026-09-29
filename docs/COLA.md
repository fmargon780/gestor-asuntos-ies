# Cola de instrucciones para Claude Code

Estados: PENDIENTE / EN CURSO / HECHA / BLOQUEADA / DEVUELTA / IDEA / EN DISEÑO. IDEA: apuntada por
Francisco, sin diseñar. EN DISEÑO: se está diseñando en una conversación de Cowork; lleva el
enlace. DEVUELTA: el revisor la rechazó dos veces (`docs/REVISOR-ANTES-DE-PUBLICAR.md`); el
siguiente lanzamiento la retoma antes que cualquier PENDIENTE. Claude Code no toca IDEA ni EN
DISEÑO.

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

> **Este documento se compacta cuando crece.** Se hizo el 18-sep-2026 (había llegado a 90 KB), el
> 20-sep-2026 (45 KB), el 25-sep-2026 (50 KB) y el 29-sep-2026, fila 226 (110 KB, con la norma
> nueva de la regla 20: por debajo de 40 KB siempre). La tabla guarda solo número, documento y
> estado; **las notas largas van a `docs/HISTORIA.md`, no aquí**. El detalle de cada fila HECHA
> está en `docs/HISTORIA.md`, en el documento de la propia fila y en el historial de git.

## Reglas para Claude Code

0. **Una sola sesión, una sola fila, una conversación nueva por fila** (norma del 27-sep-2026,
   `docs/REPARTO-DE-LA-COLA-2026-09-27.md`; ampliada el 28-sep-2026 por
   `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223). Nunca trabajan dos sesiones de Claude Code a la
   vez en este repositorio, y no hay ninguna tarea programada que lance la cola: la lanza
   Francisco. Cada lanzamiento hace, en una conversación de Claude Code nueva, **solo la primera
   fila DEVUELTA** (si la hay) **o, si no hay ninguna, la primera fila PENDIENTE**: la trabaja en
   la rama `pruebas`, la pasa por el revisor y solo con su APROBADA la publica en `main` (detalle
   en `docs/REVISOR-ANTES-DE-PUBLICAR.md`), comprueba la publicación y **para**. Si una fila queda
   DEVUELTA o BLOQUEADA, la conversación también acaba ahí. Si al empezar hay una fila EN CURSO
   **con conversación enlazada de menos de 90 minutos**, no se coge otra: esa conversación sigue
   con ella. Una fila EN CURSO sin enlace, o con uno de más de 90 minutos, se considera abandonada:
   el siguiente lanzamiento la retoma, en conversación nueva, mirando qué quedó en `pruebas` (no en
   `main`). Las cláusulas comunes de las filas 188 en adelante (como mucho tres subidas, nada se
   sube con `npm test` en rojo) están en `docs/REPARTO-DE-LA-COLA-2026-09-27.md`. **«Comprueba la
   publicación» no es lo mismo que «espera a que Vercel publique»** (28-sep-2026,
   `docs/PUBLICAR-SIN-PARAR.md`): si Vercel no publica por una causa ajena a este repositorio (tope
   diario de despliegues, publicación que no arranca, cola de más de 20 minutos), la fila se deja
   **SIN PUBLICACIÓN COMPROBADA** y la sesión para con normalidad, sin quedarse esperando; el
   siguiente lanzamiento sigue con la fila siguiente. Solo una publicación **rota por el código de
   esta fila** (la construcción falla, la web da error, falta un fichero) sigue obligando a
   arreglarla antes de seguir.
1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **DEVUELTA**, y si no hay ninguna, la primera con estado
   **PENDIENTE**, leyendo la tabla **de arriba abajo** (saltando IDEA y EN DISEÑO). Ojo: desde el
   18-sep-2026 la tabla está en orden de trabajo, no de número, así que la primera PENDIENTE no
   tiene por qué ser la del número más bajo. Si es una PENDIENTE de antes de la fila 223 y no lleva
   sección «Cómo sabemos que está bien», escríbela a partir del propio documento
   (`docs/REVISOR-ANTES-DE-PUBLICAR.md`, sección 1) en esta misma subida. Cámbiala a **EN CURSO
   (fecha hora) · conversación: <enlace de esta sesión, o «sin enlace» si no lo tienes, nunca
   inventado>** (formato de la sección 5 bis de `docs/REVISOR-ANTES-DE-PUBLICAR.md`) y sube ese
   cambio, a `main` (no publica nada), en el primer commit del trabajo. Así, si otra sesión abre
   esta cola, sabe que ya hay alguien con ella y no la repite.
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
13. **El reparto de las subidas, con el revisor de por medio** (28-sep-2026,
    `docs/REVISOR-ANTES-DE-PUBLICAR.md`, sustituye el reparto de abajo). Cada push que llega a
    GitHub le cuesta una publicación a Vercel, y el plan gratuito solo da 100 al día: el
    17-sep-2026 se agotaron y la web se quedó sin actualizar hasta el día siguiente. Como mucho
    tres publicaciones por fila: una subida a `main` para marcar **EN CURSO** (regla 2, no
    publica nada); una subida a `pruebas` con el código, las pruebas y su documentación juntos
    (dos si hace falta corregir tras una RECHAZADA del revisor); y, con la aprobación, una subida
    de `pruebas` a `main` con la marca **HECHA**, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` y
    `docs/HISTORIA.md`. Nada de un commit por fichero, ni de "completa el commit anterior": se
    prepara todo y se sube una vez por destino. Ver `docs/NO-GASTAR-PUBLICACIONES.md`.

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
19. **Desde la fila 223, el `curl` se hace dos veces**: la copia de pruebas
    (`pruebas.fmargon.com` o su dirección automática) antes de llamar al revisor, y producción
    (`main`) después de que apruebe (`docs/REVISOR-ANTES-DE-PUBLICAR.md`, sección 2). **Tras
    fusionar o subir, comprueba con `curl` que lo publicado coincide con lo subido** (por
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

20. **`docs/COLA.md` por debajo de 40 KB, siempre** (fila 226, `docs/COLA-POR-DEBAJO-DE-40-KB.md`).
    Las filas **HECHA** (salvo las de hoy y las de ayer, que se quedan hasta el día siguiente para
    el «Terminado hoy» del Centro de mando), **DESCARTADA** y **SUSTITUIDA** salen de la tabla; su
    texto completo va a `docs/HISTORIA.md` (o a `docs/COLA-CERRADAS.md` si aquel se hace
    inmanejable). Las notas largas de debajo de la tabla, igual: lo ya resuelto a
    `docs/HISTORIA.md`, lo que sigue abierto, resumido en una o dos líneas aquí o en un documento
    propio de `docs/` enlazado desde aquí. **Toda sesión que deje este documento por encima de
    40 KB (`wc -c`) lo reduce en esa misma subida**, con estos mismos criterios; es una subida solo
    de `docs/`, va directa a `main` (no publica nada).

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
| 199 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, apartado 4: documentos y comunicaciones como tareas (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 199) | HECHA (28-sep-2026 01:59). Detalle en `docs/HISTORIA.md` |
| 200 | `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, apartados 6 y 7: El centro y la pestaña «Herramientas» (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 200) | HECHA (28-sep-2026 04:04). Detalle en `docs/HISTORIA.md` |
| 201 | `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, apartados 1 y 4: el nombre sale propuesto (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 201) | HECHA (28-sep-2026 04:04). Detalle en `docs/HISTORIA.md` |
| 211 | `docs/PUBLICAR-SIN-PARAR.md` (el tope diario de Vercel no para la cola; investigar qué gastó las 100 publicaciones del 28-sep-2026 y cortar lo que sobre) | HECHA (28-sep-2026 04:09). Detalle en `docs/HISTORIA.md` |
| 202 | `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, apartados 2 y 3: de dónde viene cada hito, y la biblioteca se ofrece sola (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 202) | HECHA (28-sep-2026 06:00). Detalle en `docs/HISTORIA.md` |
| 212 | `docs/INICIO-A-TODO-EL-ANCHO.md` (Inicio, tercera versión, sobre la fila 209: fuera la columna izquierda; una fila con «Ha llegado: N correos · N documentos por clasificar» —cada trozo abre «Ver todo» solo con eso— y los avisos en un cuadro ámbar pequeño con ✕; el tablón compacto arriba a la derecha, en la cabecera; filtros plegados al entrar) | HECHA (28-sep-2026 07:22). Detalle en `docs/HISTORIA.md` |
| 205 | `docs/RESPONSABLE-UNA-ADMINISTRACION.md` (responsable de un hito: «Una Administración…», para elegir un organismo dado de alta, como la Delegación Territorial; el asunto pasa a «Esperando a…» ese organismo) | HECHA (28-sep-2026 09:36). Detalle en `docs/HISTORIA.md` |
| 215 | `docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md` (Nuevo asunto: la pastilla de categoría también filtra los tipos y pone el cursor en el buscador de personas; tipos cortos, 8 más usados + «Ver todos»; «Crear el asunto» siempre visible, en gris diciendo qué falta) | HECHA (28-sep-2026 11:22). Detalle en `docs/HISTORIA.md` |
| 220 | `docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md` (todas las entradas a «Nuevo asunto» con el mismo formulario de la fila 215, preparado desde cero cada vez; causa de «unas veces sí y otras no» y del bloqueo, arreglada y probada desde cada entrada) | HECHA (28-sep-2026 13:33). Detalle en `docs/HISTORIA.md` |
| 206 | `docs/HITOS-DESDE-EL-ASUNTO.md` (crear, cambiar y borrar hitos desde la mesa de un asunto, con «Colocar después de»; cada cambio pregunta si va también a la guía, ya marcado, y llega a los asuntos abiertos del tipo donde el hito esté vacío; solo se borran hitos vacíos) | HECHA (28-sep-2026 14:26). Detalle en `docs/HISTORIA.md` |
| 221 | `docs/TUTORIAS-TEXTO-DEL-MARGEN.md` (el texto vertical «Ref.Doc.: RelFunTut» del margen del PDF de tutorías cae a la altura de una fila y la hace descartar entera: se quitan los pies trozo a trozo; caso real, 2013-2014 de Pareja de Vicente) | HECHA (28-sep-2026 14:43). Detalle en `docs/HISTORIA.md` |
| 216 | `docs/FILTROS-EN-TODAS-LAS-PESTANAS.md` (los cinco filtros de Inicio —Responsable, Situación, Plazo, Lo encarga y Tipo de asunto— valen en las cuatro pestañas, y el número de cada pestaña cuenta lo filtrado) | HECHA (28-sep-2026 16:06). Detalle en `docs/HISTORIA.md` |
| 222 | `docs/COPIA-DE-PRUEBAS.md` (la copia de pruebas: rama `pruebas` publicada en pruebas.fmargon.com, con «Entrar con datos de demostración» —datos inventados, nada se guarda— para que el revisor y Francisco prueben sin tocar producción) | HECHA (28-sep-2026 18:49). Detalle en `docs/HISTORIA.md` |
| 210 | `docs/HILO-SIN-REPETIR.md` (el PDF del HILO de correos: lo último arriba, sin citas repetidas, y adjuntos sin repetir) | HECHA (28-sep-2026 18:14). Detalle en `docs/HISTORIA.md` |
| 223 | `docs/REVISOR-ANTES-DE-PUBLICAR.md` (el método nuevo: cada tarea lleva su lista «Cómo sabemos que está bien», se trabaja en `pruebas`, un revisor sin ver el código la pasa en la copia de pruebas y solo con su APROBADA se publica en `main`; RECHAZADA dos veces = DEVUELTA; permisos concedidos de una vez en `.claude/settings.json` para que nada se pare a preguntar; necesita la 222) | HECHA (28-sep-2026 19:59). Detalle en `docs/HISTORIA.md` |
| 214 | `docs/HA-LLEGADO-SUSTITUYE-LA-VISTA.md` (los enlaces «N correos · N documentos por clasificar» de Inicio sustituyen la tabla por esa lista, arriba, en vez de dejarla abajo del todo; «← Volver a Inicio» devuelve la misma pestaña, filtros y punto de la página) | HECHA (28-sep-2026 22:01). Detalle en `docs/HISTORIA.md` |
| 225 | `docs/AVISO-ESPERANDO-PERMISO.md` (aviso «esperando tu respuesta» para el Centro de mando: script `scripts/aviso-esperando.sh` que deja una marca en la rama `avisos` cuando Claude Code se para a pedir permiso o a preguntar, para que el Centro de mando no la dé por parada) | HECHA (29-sep-2026 03:10). Detalle en `docs/HISTORIA.md` |
| 224 | `docs/TAREAS-DEL-HITO-SENCILLAS.md` (tareas del hito sin texto de sobra: una caja «Nueva tarea…» que añade solo a este asunto, «⋮» por tarea con Anotar/Cambiar/Pasar a la guía/Borrar, y el menú «Hito ▾» con Crear · Cambiar · Borrar) | HECHA (29-sep-2026 06:23). Detalle en `docs/HISTORIA.md` |
| 227 | `docs/RUTA-NORMAL-DE-WINDOWS.md` (el botón «Ruta» copia la ruta normal de Windows, `C:\Users\…\carpeta`, en vez de `file:///` con `%C3%93`, que el explorador y la ventana de adjuntar no entienden; el aviso verde enseña lo copiado) | HECHA (29-sep-2026 06:23). Detalle en `docs/HISTORIA.md` |
| 219 | `docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md` (en «Cambiar el asunto», el tercero se elige con el buscador de «Nuevo asunto», en todas las categorías, con alta desde ahí; sin texto libre; aviso ámbar sin bloquear si el tipo no encaja con la categoría) | SIN PUBLICACIÓN COMPROBADA (29-sep-2026 07:52) · conversación: https://claude.ai/code/session_018J7kDfWtuu4KAgmdkjRtpQ. Programada, probada y revisada entera: `npm test` completo (187 ficheros) en verde salvo `tras-cada-accion.mjs` (fallo previo ya conocido y sin relación, `EN_SOLITARIO`). El revisor (agente aparte, contexto limpio) no pudo entrar en `pruebas.fmargon.com` (403 del proxy de salida de esta sesión) ni en la *preview* de la rama (Vercel no llegó a publicarla: automático sin disparar, y `create_deployment` a mano respondió 402, tope diario agotado — comprobado que otro proyecto de Francisco, `normativa-escolarizacion`, publicó unas 10 veces en la última hora, así que el tope es suyo, no de este repositorio); entró en su lugar contra un servidor local con el código exacto de `pruebas` (mismo commit, `?demo=1&auto=1`). Informe: **APROBADA** (6 puntos, 0 solo Francisco). El punto 6 (selector de departamento con un organismo de Administraciones) salió NO COMPROBADO porque los datos de demostración no traen ningún organismo dado de alta — no es un `[SOLO FRANCISCO]`: comprobado en su lugar, de forma independiente, con datos reales dentro de esta misma sesión (`pruebas/tercero-con-buscador-al-cambiar.mjs`, sección 6, en verde). Fusionado en `main` (`fb82a2b`, tras fusionar de paso dos ideas nuevas de Francisco —228 y 229— sin tocarlas). Por la misma causa (tope diario de toda la cuenta), Vercel no ha lanzado todavía ningún despliegue para los commits de `main` de esta fila: comprobado por `curl` (`App.VERSION` sigue en la de la fila 227) y con `list_deployments` (nada nuevo tras `fb82a2b`). El siguiente lanzamiento comprueba de nuevo antes de coger otra fila (regla 19). |
| 226 | \docs/COLA-POR-DEBAJO-DE-40-KB.md` (la lista de tareas por debajo de 40 KB: las terminadas pasan al historial y se reduce sola cuando crece) | HECHA (29-sep-2026 08:21). De 110 KB a 25 KB. Detalle en `docs/HISTORIA.md` |
| 204 | `docs/COMPROBACION-AL-ENTRAR.md`, entero, con `js/cabecera-fija.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 204) | PENDIENTE (27-sep-2026) |
| 203 | `docs/PAPELERA-SE-VACIA-SOLA.md`, entero, con `js/copias.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 203) | PENDIENTE (27-sep-2026) |
| 213 | `docs/BOTON-DE-SOPORTE.md` (botón «Soporte» en una esquina: error o mejora, texto y captura opcional; buzón en un script de Google que guarda el aviso en Drive y apunta una IDEA sin datos en la cola; más `docs/PONER-EN-MARCHA-SOPORTE.md` para Francisco) | PENDIENTE (28-sep-2026) |
| 217 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md` (enviar correo con otra cuenta de Google abierta en el navegador: aviso claro en vez de «Failed to fetch» y, si Google lo deja, que el envío funcione igual usando la forma general de la dirección del script) | PENDIENTE (28-sep-2026) |
| 228 | El botón Cambiar del menú Hito no modifica se previamente se ha escrito en su descripción. [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · 770511d544b41e6484d15e64fc5e042b] | IDEA (29-sep-2026): apuntada por Francisco desde el Centro de mando |
| 229 | Ventajas e inconvenientes de convertir la zona de tareas de un hito en un registro de lo que ocurre, en vez de una lista que nos recuerde que hay que tener en cuenta. O un modelo global para todo esto [recorte: https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E · 2201e4cccd4d17ffe9428499544f420e] | IDEA (29-sep-2026): apuntada por Francisco desde el Centro de mando |
| 230 | `docs/SALIR-DE-ELEGIR-ASUNTO.md` (en «Guardar en un asunto», de documentos sueltos y de correos: ✕ arriba y «Cancelar» siempre a la vista, Escape que cierra de verdad —buscar la causa— y botón «No está: crear un asunto nuevo con él») | PENDIENTE (29-sep-2026) |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- Fila 223: `.claude/settings.json` sigue sin poder crearlo ninguna sesión de Claude Code (lo
  deniega el propio clasificador, «Self-Modification»); hace falta que Francisco lo cree a mano,
  con el contenido de la sección 5 de `docs/REVISOR-ANTES-DE-PUBLICAR.md`.
- Fila 214: `pruebas.fmargon.com` puede dar 403 de red, o pedir «Vercel Authentication», según la
  sesión; decisión pendiente (dar de alta el dominio en la política de red de las sesiones, o
  revisar `ssoProtection` del proyecto).
- Fila 214: el hook `~/.claude/stop-hook-git-check.sh` de alguna sesión puede forzar una subida a
  `pruebas` de más de las tres previstas por fila; decisión pendiente sobre si el hook debe conocer
  el método del revisor.
- `docs/CONTEXTO-CORTO.md` sigue por encima de los 14.000 caracteres; hace falta una sesión aparte
  que lo compacte de verdad.
- Vercel: el tope diario de despliegues es de toda la cuenta, no solo de este proyecto; Francisco
  decide si separa cuentas, cambia de plan, o coordina cuándo se trabaja cada cola.
- Del 21-sep-2026: buscador de normativa por texto para rellenar solo la clave de un paso — sigue
  sin diseñarse con Francisco.
- Del 27-sep-2026 (fila 190): falta que Francisco pueda dar de alta un impreso propio del centro
  (sin anexo del BOJA), con un campo nuevo en el catálogo que diga de quién es cada impreso.
- Prueba `pruebas/tras-cada-accion.mjs`: dos pasos («al volver, la misma altura» y «repintar la
  lista no la sube arriba») fallan también en solitario desde antes de la fila 205; sin arreglar
  todavía.
- 29-sep-2026: `docs/VISTO-BUENO-DE-FRANCISCO.md` se escribió como «fila 230» y tiene estimación, pero
  no tiene fila en esta tabla (el número 230 lo lleva `docs/SALIR-DE-ELEGIR-ASUNTO.md`); falta
  confirmar con Francisco si se apunta con número nuevo.
- `docs/HISTORIA.md` podría seguir sin la entrada de las filas 53-56 (18-sep-2026: cuadro de
  Séneca en dos columnas, el ayudante fiable, el asunto sin elección, los campos calculados);
  comprobar y pegarla si falta.

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.
