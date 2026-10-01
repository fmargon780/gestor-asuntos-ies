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

0. **Una sola sesión a la vez, una fila tras otra** (norma del 27-sep-2026, cambiada el 1-oct-2026,
   `docs/REPARTO-DE-LA-COLA-2026-09-27.md`; ampliada el 28-sep-2026 por
   `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223). Nunca trabajan dos sesiones de Claude Code a la
   vez en este repositorio, y no hay ninguna tarea programada que lance la cola: la lanza
   Francisco. Por defecto, cada lanzamiento hace, en una conversación de Claude Code nueva, **solo la
   primera fila DEVUELTA** (si la hay) **o, si no hay ninguna, la primera fila PENDIENTE**. Si la
   frase de lanzamiento pide varias («las N primeras filas PENDIENTE» o «todas»), la misma
   conversación las hace **de una en una**, en el orden de la cola, cada una completa (EN CURSO,
   revisor, publicación comprobada, HECHA) antes de empezar la siguiente; y **antes de empezar cada
   fila nueva** mira `docs/PARAR.md` en `main`: si dice PARAR, lo cambia a SEGUIR, lo sube y para.
   Cada fila la trabaja en
   su rama `fila-<nº>`, la pasa por el revisor (en local, fila 242) y solo con su APROBADA la publica en `main` (detalle
   en `docs/REVISOR-ANTES-DE-PUBLICAR.md`), comprueba la publicación y **para**. Si una fila queda
   DEVUELTA o BLOQUEADA, la conversación también acaba ahí. Si al empezar hay una fila EN CURSO
   **con conversación enlazada de menos de 90 minutos**, no se coge otra: esa conversación sigue
   con ella. Una fila EN CURSO sin enlace, o con uno de más de 90 minutos, se considera abandonada:
   el siguiente lanzamiento la retoma, en conversación nueva, mirando qué quedó en su rama `fila-<nº>` (no en
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
4. Al terminar una, márcala **HECHA** con la fecha y **para**, salvo que el lanzamiento pida varias filas (regla 0). **La hora de `App.VERSION` sale del reloj de verdad**
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
13. **El reparto de las subidas** (30-sep-2026, fila 242, `docs/REVISOR-EN-LOCAL.md`). Cada push a
    `main` con código le cuesta una publicación a Vercel, y el plan gratuito solo da 100 al día,
    de toda la cuenta. **Una sola publicación de código por fila**: la fusión de su rama
    `fila-<nº>` en `main` tras la APROBADA del revisor (más la de `pruebas` al nivelarla después).
    Las subidas de solo `docs/` (marca EN CURSO, estimaciones, HECHA) van directas a `main` y no
    publican nada. Nada de un commit por fichero. Ver `docs/NO-GASTAR-PUBLICACIONES.md`.

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
19. **Una fila solo es HECHA con las dos cosas** (fila 242, `docs/REVISOR-EN-LOCAL.md`, sección 2):
    (1) su commit está en `main` (`git merge-base --is-ancestor <sha-de-la-fila> origin/main`, o
    que aparezca en el historial de `main`); sin esto, nunca HECHA, lo diga la web o no; y (2)
    Vercel lo ha publicado, por el primer camino que funcione: a) `curl` a
    `https://asuntos.fmargon.com/js/version.js?v=<algo>` o a
    `https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo>`: `App.VERSION` igual o posterior
    a la de la fila; b) el estado «Vercel» del commit en GitHub (`success`); c) `list_deployments`
    con el `sha`. Si ninguno funciona, la fila queda **SIN PUBLICACIÓN COMPROBADA** con el SHA de
    `main` en la nota, y la sesión para con normalidad. **Como mucho un `create_deployment` a mano
    por sesión**; si responde 402, no se reintenta (el tope es de toda la cuenta de Vercel,
    `docs/PUBLICAR-SIN-PARAR.md`). Al empezar cada sesión se revisan las filas SIN PUBLICACIÓN
    COMPROBADA con estas mismas dos condiciones: **«la web sirve una versión posterior» solo vale
    si además el commit de la fila está en `main`.**

20. **`docs/COLA.md` por debajo de 40 KB, siempre** (fila 226, `docs/COLA-POR-DEBAJO-DE-40-KB.md`).
    Las filas **HECHA** (salvo las de hoy y las de ayer, que se quedan hasta el día siguiente para
    el «Terminado hoy» del Centro de mando), **DESCARTADA** y **SUSTITUIDA** salen de la tabla; su
    texto completo va a `docs/HISTORIA.md` (o a `docs/COLA-CERRADAS.md` si aquel se hace
    inmanejable). Las notas largas de debajo de la tabla, igual: lo ya resuelto a
    `docs/HISTORIA.md`, lo que sigue abierto, resumido en una o dos líneas aquí o en un documento
    propio de `docs/` enlazado desde aquí. **Toda sesión que deje este documento por encima de
    40 KB (`wc -c`) lo reduce en esa misma subida**, con estos mismos criterios; es una subida solo
    de `docs/`, va directa a `main` (no publica nada).

21. **Novedades visibles** (fila 248, `docs/NOVEDADES-AL-RECARGAR.md`). Al terminar una fila que
    cambia algo que se ve en pantalla, añade su línea al principio de `js/novedades.js` en el mismo
    commit del código (no aparte: cada subida de código es una publicación). Si la fila no cambia
    nada visible, no se añade.

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
| 219 | `docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md` (en «Cambiar el asunto», el tercero se elige con el buscador de «Nuevo asunto», en todas las categorías, con alta desde ahí; sin texto libre; aviso ámbar sin bloquear si el tipo no encaja con la categoría) | HECHA (29-sep-2026 07:52; publicación comprobada el 30-sep-2026: la web sirve una versión posterior) · conversación: https://claude.ai/code/session_018J7kDfWtuu4KAgmdkjRtpQ. Programada, probada y revisada entera: `npm test` completo (187 ficheros) en verde salvo `tras-cada-accion.mjs` (fallo previo ya conocido y sin relación, `EN_SOLITARIO`). El revisor (agente aparte, contexto limpio) no pudo entrar en `pruebas.fmargon.com` (403 del proxy de salida de esta sesión) ni en la *preview* de la rama (Vercel no llegó a publicarla: automático sin disparar, y `create_deployment` a mano respondió 402, tope diario agotado — comprobado que otro proyecto de Francisco, `normativa-escolarizacion`, publicó unas 10 veces en la última hora, así que el tope es suyo, no de este repositorio); entró en su lugar contra un servidor local con el código exacto de `pruebas` (mismo commit, `?demo=1&auto=1`). Informe: **APROBADA** (6 puntos, 0 solo Francisco). El punto 6 (selector de departamento con un organismo de Administraciones) salió NO COMPROBADO porque los datos de demostración no traen ningún organismo dado de alta — no es un `[SOLO FRANCISCO]`: comprobado en su lugar, de forma independiente, con datos reales dentro de esta misma sesión (`pruebas/tercero-con-buscador-al-cambiar.mjs`, sección 6, en verde). Fusionado en `main` (`fb82a2b`, tras fusionar de paso dos ideas nuevas de Francisco —228 y 229— sin tocarlas). Por la misma causa (tope diario de toda la cuenta), Vercel no ha lanzado todavía ningún despliegue para los commits de `main` de esta fila: comprobado por `curl` (`App.VERSION` sigue en la de la fila 227) y con `list_deployments` (nada nuevo tras `fb82a2b`). El siguiente lanzamiento comprueba de nuevo antes de coger otra fila (regla 19). |
| 226 | \docs/COLA-POR-DEBAJO-DE-40-KB.md` (la lista de tareas por debajo de 40 KB: las terminadas pasan al historial y se reduce sola cuando crece) | HECHA (29-sep-2026 08:21). De 110 KB a 25 KB. Detalle en `docs/HISTORIA.md` |
| 230 | `docs/SALIR-DE-ELEGIR-ASUNTO.md` (en «Guardar en un asunto», de documentos sueltos y de correos: ✕ arriba y «Cancelar» siempre a la vista, Escape que cierra de verdad —buscar la causa— y botón «No está: crear un asunto nuevo con él») | HECHA (29-sep-2026 10:32). Aprobada por Francisco a mano en la copia de pruebas (sin revisor automático). Detalle en `docs/contexto/DOCUMENTOS.md` |
| 204 | `docs/COMPROBACION-AL-ENTRAR.md`, entero, con `js/cabecera-fija.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 204) | HECHA (29-sep-2026 13:22; publicación comprobada el 30-sep-2026: la web sirve una versión posterior) · conversación: https://claude.ai/code/session_01GNtC3HC3kYpKqfymmKJuTX. Arreglado «Arreglarlo» de festivos (el bloque Hitos se replegaba solo tras cargar; `llevarA` lo reabre hasta que asienta; prueba nueva que fallaba antes y pasa ahora). Revisor 3 (contexto limpio, contra servidor local con `?demo=1&auto=1`): APROBADA; puntos 6 y 7 SOLO FRANCISCO, en `docs/COMPROBAR-A-MANO.md`. Subido a `main` (commit 8762f47). No he podido comprobar la publicación: asuntos.fmargon.com da 403 de red desde la sesión y Vercel no lista proyectos. Pasa a HECHA cuando la web sirva `App.VERSION` posterior a 29-sep-2026 13:22. |
| 203 | `docs/PAPELERA-SE-VACIA-SOLA.md`, entero, con `js/copias.js` (`docs/REPARTO-DE-LA-COLA-2026-09-27.md`, fila 203) | HECHA (29-sep-2026 22:10) · conversación: https://claude.ai/code/session_01B4NoHyUUC2AAP2xp6vEeD2. Revisor: APROBADA a la segunda (6 puntos, 1 solo Francisco; la primera rechazó el aviso de Inicio, que no salía). Publicada en `main` (commit 3710463). Detalle en `docs/HISTORIA.md` |
| 213 | `docs/BOTON-DE-SOPORTE.md` (botón «Soporte» en una esquina: error o mejora, texto y captura opcional; buzón en un script de Google que guarda el aviso en Drive y apunta una IDEA sin datos en la cola; más `docs/PONER-EN-MARCHA-SOPORTE.md` para Francisco) | HECHA (30-sep-2026 04:33) · conversación: https://claude.ai/code/session_019Nv6KhPdNkfsWuifmtR7j6. Revisor: APROBADA (6 puntos, 3 solo Francisco; contra servidor local con el código exacto de `pruebas`, `?demo=1&auto=1`, porque desde la sesión no se llega a `pruebas.fmargon.com` ni la *preview* deja entrar). `npm test` completo: 188 de 192; `tras-cada-accion` (conocida), `ha-llegado-sustituye-la-vista` y `mesa-comunicar-del-paso-y-guion` pasan en solitario, y `hitos-no-huerfanos-al-archivar` dependía de que el aviso ámbar del punto 1 ya se hubiera ido (4,5 s): la prueba ahora lo quita antes del punto 2. Falta la puesta en marcha de Francisco: `docs/PONER-EN-MARCHA-SOPORTE.md`. Detalle en `docs/HISTORIA.md` |
| 242 | `docs/REVISOR-EN-LOCAL.md` (el revisor prueba siempre en local; cada fila trabaja en su rama `fila-<nº>`, nada espera a Vercel antes del revisor; HECHA solo con el commit en `main` y publicado; rescate de las filas 235, 229 y 231) | HECHA (30-sep-2026 22:38) · conversación: https://claude.ai/code/session_01LiVig4TNYmadfjYvyM5nGb. Solo documentación, directa a `main` (00f2671); no publica nada. Las filas 235, 229 y 231 quedan PENDIENTE con su SHA de rescate (los cuatro SHA responden en GitHub; `pruebas` sigue en `341a22b`). Detalle en `docs/HISTORIA.md` |
| 239 | `docs/NOMBRES-FIJOS-CON-NUMERO.md` (nombres de estructura fija: carpeta `AAMMDD A26-0137 TIPO Tercero` y documento `AAMMDD TIPO D26-01234.ext`, con número único anual de asunto y de documento; fuera del nombre año, grupo, campos, texto libre y registros; «_Previas»; nombre corto de tipos hasta 25 con lista para acortar; medidor de margen de ruta en Ajustes; lo existente no se toca) | HECHA (01-oct-2026 00:40) · conversación: https://claude.ai/code/session_01RY65rLGzZTW3N2iBo9VmVF. Revisor en local: RECHAZADA la primera (aviso suave de duplicado y vocabulario; lista del punto 2 aclarada), APROBADA la segunda; punto 9 SOLO FRANCISCO en `docs/COMPROBAR-A-MANO.md`. `npm test` completo 193/193. En `main` (7e72458, fusión 7fa911b); `vercel.app` sirve `01-oct-2026 · 00:32`. Detalle en `docs/HISTORIA.md` |
| 235 | `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md` (al crear, cambiar o borrar un hito o una tarea desde un asunto, antes de guardar se elige «A la guía de <tipo>» —marcada— o «Solo en este asunto», con a cuántos asuntos abiertos llega y «Deshacer» después; una tarea de un hito que no está en la guía se lleva el hito entero; arreglar que «Cambiar la guía…» no cargue la guía previa) | HECHA (01-oct-2026 02:26) · conversación: https://claude.ai/code/session_015wvJXUxVm9KgmrWt65KM5v. Código rescatado de `pruebas` (`341a22b`) sobre `main`. Revisor en local: APROBADA a la primera (8 puntos + 3 fijos, ninguno solo Francisco). `npm test` completo 192/194: fallan `recurrentes.mjs` (depende de la fecha) y `ha-llegado-sustituye-la-vista.mjs` (altura de pantalla), los dos también en `main` sin esta fila. En `main` (b25ef4d); `vercel.app` sirve `01-oct-2026 · 02:26`. Detalle en `docs/HISTORIA.md` |
| 229 | `docs/REGISTRO-DEL-ASUNTO.md` (el registro del asunto: una sola lista por fechas con lo que ha pasado —lo que anota la aplicación sola y lo que se escribe a mano—, entera en la ficha y solo lo suyo en la mesa de cada hito; caja «Anotar algo que ha pasado…»; las líneas a mano se cambian o se borran, las automáticas no; la lista de tareas no cambia) | HECHA (1-oct-2026 02:58) · conversación: https://claude.ai/code/session_01EZfviosb532962PvHLeuUy. Rescatada de `84def1e` a `main` (PR 165); revisor en local: APROBADA, punto 10 NO COMPROBADO (solo Francisco, en `docs/COMPROBAR-A-MANO.md`). Publicación comprobada: `js/registro-asunto.js` se sirve en gestor-de-asuntos.vercel.app |
| 231 | `docs/CREAR-ASUNTO-DESDE-POR-CLASIFICAR.md` (crear un asunto desde un documento de «Por clasificar»: el formulario sale siempre completo —categoría, buscador de personas y tipos—, con lo reconocido ya elegido y cambiable; buscar por qué unas veces sale sin ellos) | HECHA (1-oct-2026 03:25) · conversación: https://claude.ai/code/session_01TxSijV33jjBQxeKEGjbvNS. Rescate de `8d9deba` sobre `main` (fusionado, commit 5b2caf9, versión 01-oct-2026 03:18 publicada). Revisor local: APROBADA. Detalle en `docs/HISTORIA.md`. |
| 241 | `docs/EXPORTAR-ASUNTOS.md` (filtro «Fechas» en Inicio; «Exportar ▾» a hoja de cálculo o informe en PDF de lo que se ve, con columnas a elegir —campos propios incluidos—, archivados opcionales con los mismos filtros, hitos, número de asuntos y sumas; reservados sin el tercero) | HECHA (1-oct-2026 04:33) · conversación: https://claude.ai/code/session_015Bor1neiT316vSma1Xu1N6. Revisor: APROBADA a la primera (6 puntos bien, 1 [SOLO FRANCISCO] en `docs/COMPROBAR-A-MANO.md`). Fusionada en `main` por la petición de cambios 167 (`ae620db`; `4c584af` está en `main`). Vercel no había publicado a los 20 minutos (`vercel.app` sin `js/exportar-datos.js`, versión 03:43; `create_deployment` da 403, sin permiso). Publicación comprobada el 1-oct-2026 04:33: `vercel.app` sirve `js/exportar-datos.js` y la versión 01-oct-2026 · 04:31 |
| 236 | `docs/CORREO-ENVIADO-EN-PDF.md` (aviso de usuario: al enviar un correo desde la app, se guarda en la carpeta del asunto un PDF «CORREO» con destinatarios, fecha, asunto, texto y lista de adjuntos; el HILO sigue llegando con la respuesta, como hasta ahora) | HECHA (1-oct-2026 07:33) · versión 01-oct-2026 · 07:32 en `vercel.app`. Fusionada por la petición de cambios 173; revisor APROBADA a la primera (punto 6 en `docs/COMPROBAR-A-MANO.md`) |
| 237 | Aviso de usuario: error en «Ficha de un asunto» | DESCARTADA (30-sep-2026): descartada por Francisco desde el Centro de mando |
| 245 | `docs/CAMPO-DESDE-EL-ASUNTO.md` (añadir un campo desde un asunto abierto: «+ Añadir campo» en la ficha con el mismo panel de Ajustes, su valor en el mismo paso, y «¿Dónde se guarda?» —«En el tipo» marcada o «Solo en este asunto»— con «Deshacer»; los «solo aquí» con «⋮» Pasar al tipo / Quitar) | HECHA (1-oct-2026 06:02) · publicada y comprobada (`vercel.app` sirve `js/campo-desde-el-asunto.js`, versión 05:23 o posterior). Fusionada por la petición de cambios 168; revisor APROBADA a la primera |
| 238 | `docs/CERTIFICADO-CONSEJO-ESCOLAR.md` (tipo de asunto «Certificado miembro Consejo Escolar»: tabla nueva con los CSV del Consejo que da Séneca, botón para subirlos, y un certificado con todos los periodos de la persona, firmado por Secretaría con V.º B.º de Dirección) | HECHA (1-oct-2026 06:02) · versión 01-oct-2026 · 06:02 en `vercel.app`. Fusionada por la petición de cambios 169; revisor APROBADA a la primera (punto 8 en `docs/COMPROBAR-A-MANO.md`) |
| 217 | `docs/CORREO-OTRA-CUENTA-ABIERTA.md` (enviar correo con otra cuenta de Google abierta en el navegador: aviso claro en vez de «Failed to fetch» y, si Google lo deja, que el envío funcione igual usando la forma general de la dirección del script) | HECHA (1-oct-2026 06:18) · versión 01-oct-2026 · 06:17 en `vercel.app`. Fusionada por la petición de cambios 170; revisor APROBADA a la primera (el envío real, en `docs/COMPROBAR-A-MANO.md`) |
| 232 | `docs/ENLACE-A-NORMATIVA-CORRECTO.md` (los enlaces a la normativa abren siempre el artículo, `normativa.fmargon.com/norma#r=<clave>`; cambiar la dirección por defecto de `vercel.app`) | HECHA (1-oct-2026 06:40) · versión 01-oct-2026 · 06:39 en `vercel.app`. Fusionada por la petición de cambios 171; revisor APROBADA a la primera |
| 243 | `docs/TITULOS-DE-LA-TABLA-FIJOS.md` (aviso de usuario: en Inicio, al bajar, las cuatro pestañas y la fila de títulos de la tabla se quedan fijas bajo la cabecera encogida; lo mismo en la lista del Archivo si tiene títulos) | HECHA (1-oct-2026 07:55) · versión 01-oct-2026 · 07:54 en `vercel.app`. Fusionada por la petición de cambios 174; revisor APROBADA a la segunda (la primera: la tabla no cabía a 1280 px; se estrechó y solo se fijan las pestañas y los títulos) |
| 244 | `docs/CAMPOS-IMPORTE-NUMERO-FECHA.md` (aviso de usuario: campos propios de clase Importe en euros, Número y Fecha; se puede cambiar la clase de un campo ya creado y lo que no se entienda queda en ámbar en la ficha; al exportar, importes y números suman y las fechas ordenan; después de la 245) | HECHA (1-oct-2026 08:27) · versión 01-oct-2026 · 08:26 en `vercel.app`. Fusionada por la petición de cambios 175; revisor APROBADA a la primera |
| 240 | `docs/SOPORTE-TEXTO-SIN-LIMITE.md` (botón de soporte: texto sin límite de tamaño, cuadro grande que crece al escribir y guion gris con apartados sugeridos; Francisco tendrá que pegar `soporte.gs` una vez) | HECHA (1-oct-2026 06:59) · versión 01-oct-2026 · 06:58 en `vercel.app`. Fusionada por la petición de cambios 172; revisor APROBADA a la primera. Francisco tiene que volver a pegar `apps-script/soporte.gs` (`docs/COMPROBAR-A-MANO.md`) |
| 246 | Solo documentos (decisión de Francisco, 1-oct-2026): anular `docs/VISTO-BUENO-DE-FRANCISCO.md` (con la APROBADA del revisor se publica en `main` sin esperar a Francisco) y cambiar la regla 0 para poder hacer varias filas seguidas en una conversación, mirando `docs/PARAR.md` entre fila y fila | HECHA (1-oct-2026 04:02) · conversación: https://claude.ai/code/session_01P1CEMANePuqUD1BvqQcrRL. Solo documentación, directa a `main`; no publica nada. |
| 233 | `docs/SELLO-DOCUMENTO-NUEVO.md` (aviso de un papel con sello: tercer botón «Es un documento nuevo», que abre el cuadro de poner nombre con el registro y su fecha leídos del sello, tipo propuesto, asociado al hito en curso, nombre de la fila 239 con el registro en la ficha, y la tarea de registro/descarga del hito marcada sola) | HECHA (1-oct-2026 09:50) · conversación: https://claude.ai/code/session_01JFB5xBMJ1FgrFMvaJLS4nq. Revisor: APROBADA a la primera. Fusionada en `main` por la petición de cambios 176 (`cc1d65d`). Vercel no ha creado ninguna publicación para ese commit tras más de 20 minutos (`list_deployments` con el sha vacío; `vercel.app` sigue en la versión 08:26 sin `esDocumentoNuevo` en `js/ficha-sellos.js`). Publicación comprobada: `vercel.app` sirve la versión 09:16 con `esDocumentoNuevo` en `js/ficha-sellos.js` |
| 247 | `docs/NOMBRES-DE-PILA-LARGOS.md` (aviso de usuario: en carpetas y ficheros, el nombre de una persona de más de 40 caracteres deja el primer nombre de pila entero y los demás en inicial; alumnado, personal y tutores; el nombre completo sigue en fichas y documentos; quien ya tiene carpeta con el nombre largo sigue usando esa carpeta) | HECHA (1-oct-2026 10:10) · conversación: https://claude.ai/code/session_01JFB5xBMJ1FgrFMvaJLS4nq. Revisor: APROBADA a la primera. Petición de cambios 177 (`5a36fce`); publicación comprobada (`vercel.app` sirve `acortarNombrePila`). Aparte: `recurrentes.mjs` y `ha-llegado-sustituye-la-vista.mjs` fallan también en `main` sin este cambio (pendiente hablar con Francisco) |
| 234 | `docs/RESPONSABLE-SECRETARIA-CON-VB.md` (aviso de usuario: responsable fijo nuevo «Secretaría con V.º B.º de Dirección» en todos los desplegables de responsable de un hito; «Esperando a…» con ese nombre; en los filtros cuenta para Secretaría y para Dirección) | HECHA (1-oct-2026 10:10) · conversación: https://claude.ai/code/session_01JFB5xBMJ1FgrFMvaJLS4nq. Revisor: APROBADA a la primera. Petición de cambios 178 (`49855a5`); publicación comprobada (`vercel.app` sirve `ID_VB` en `js/hitos-administracion.js`) |
| 248 | `docs/NOVEDADES-AL-RECARGAR.md` (aviso de usuario: al entrar con una versión nueva sale «Qué hay de nuevo», una línea por cambio visible desde la última vez en ese ordenador, con «Entendido»; se vuelve a ver pulsando la versión de la barra lateral; regla 21 nueva para que cada fila deje su línea) | HECHA (1-oct-2026 10:40) · conversación: https://claude.ai/code/session_01JFB5xBMJ1FgrFMvaJLS4nq. Revisor: APROBADA a la primera. Petición de cambios 179 (`0684f49`); publicación comprobada (`vercel.app` sirve `js/novedades-ventana.js`). Punto a mano en `docs/COMPROBAR-A-MANO.md` |
| 228 | `docs/EXPLICACION-DEL-HITO-AL-CAMBIAR.md` (idea de Francisco: «Hito ▾» → «Cambiar» trae la explicación del hito, con sus viñetas, para corregirla; «Crear» lleva el mismo cuadro, vacío o con la de la biblioteca; se guarda con «¿Dónde se guarda?» como el título) | HECHA (1-oct-2026 12:18) · conversación: https://claude.ai/code/session_01LiW8ZpXUMkxeCR47Nm8JiL. Revisor en local: APROBADA a la primera. Petición de cambios 180 (`98fce8c`); publicación comprobada (`vercel.app` sirve `hda-cuerpo`, versión 12:16). «Deshacer» deja aquí el cambio, como el título. `recurrentes.mjs` falla también en `main` (conocida). Aparte: al guardar desde «Cambiar», un responsable «Yo» pasa a «Sin responsable» (la lista no lo trae; ya era así) |
| 249 | `docs/POR-LIQUIDAR.md` (aviso de usuario: casilla por tipo «Hay que liquidarlo antes de archivar»; al terminar, el asunto pasa a la pestaña nueva «Por liquidar» de Inicio en vez de archivarse; allí se marcan varios, con la suma de importes, y «Liquidar» genera el PDF LIQUIDACIÓN con las dos firmas en cada asunto y los archiva) | EN CURSO (1-oct-2026 12:18) · conversación: https://claude.ai/code/session_01LiW8ZpXUMkxeCR47Nm8JiL |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (1-oct-2026) En `main`, sin tocar nada, fallan `recurrentes.mjs` (dos asuntos tocan en vez de uno) y `ha-llegado-sustituye-la-vista.mjs` (punto de la página): dependen de la fecha o del tamaño de pantalla; no son de ninguna fila.

- Fila 241 (1-oct-2026): en la pasada completa fallan `recurrentes.mjs` y `tras-cada-accion.mjs`; fallan igual en `main` sin el cambio de la fila 241 (no es suyo), conviene mirarlas en una fila aparte.

- Pruebas que fallan también en `main` (1-oct-2026): `recurrentes.mjs` (depende de la fecha del día) y `ha-llegado-sustituye-la-vista.mjs` (punto 2, altura de pantalla).

- Fila 213 (botón de soporte): hasta que Francisco siga `docs/PONER-EN-MARCHA-SOPORTE.md` (permiso de GitHub, script de Google, dirección en Ajustes → El centro), el botón se ve pero avisa de que el buzón no está configurado (30-sep-2026).

- `pruebas/tras-cada-accion.mjs` falla en la sesión de Claude Code (punto 3, «al volver, la misma altura»), también sin los cambios de la fila 230: parece depender de la altura de pantalla del entorno (29-sep-2026).

- Fila 223: `.claude/settings.json` sigue sin poder crearlo ninguna sesión de Claude Code (lo
  deniega el propio clasificador, «Self-Modification»); hace falta que Francisco lo cree a mano,
  con el contenido de la sección 5 de `docs/REVISOR-ANTES-DE-PUBLICAR.md`.
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
- `docs/HISTORIA.md` podría seguir sin la entrada de las filas 53-56 (18-sep-2026: cuadro de
  Séneca en dos columnas, el ayudante fiable, el asunto sin elección, los campos calculados);
  comprobar y pegarla si falta.

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.
