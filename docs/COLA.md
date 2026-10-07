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
| 268 | `docs/VIGILANTE-Y-CORREOS.md` (el vigilante del Centro de mando, dentro del buzón de soporte: cada diez minutos mira todos los proyectos con cola y manda un correo a Francisco cuando Claude Code espera su respuesta, una tarea se queda a medias, una publicación falla, llega un aviso de un usuario o una app no abre; de 23:00 a 7:00 calla y a las 7:00 manda un resumen; contesta por correo a quien envió un aviso cuando queda resuelto; solo el script, sus pruebas y sus documentos; diseño completo en `docs/CENTRO-DE-MANDO-CINCO-MEJORAS.md`; Francisco vuelve a pegar `soporte.gs` una vez) | HECHA (6-oct-2026 05:46) · conversación: https://claude.ai/code/session_01EktPioRvrYihQm5HzqSwdo · en `main` (fusión 3b3bfc3, PR 193), Vercel success; revisor APROBADA a la primera (puntos 8, 9 y 10 solo Francisco, en `docs/COMPROBAR-A-MANO.md`) |
| 269 | `docs/SOPORTE-MANDA-EL-CORREO.md` (el botón «Soporte» pide una vez el correo de quien avisa, lo recuerda en ese ordenador y lo manda con el aviso, para poder escribirle cuando quede resuelto; solo el botón del Gestor y su prueba; no depende de la fila 268) | HECHA (6-oct-2026 06:04) · conversación: https://claude.ai/code/session_01EktPioRvrYihQm5HzqSwdo · en `main` (fusión 8bcceb2, PR 194), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 06:04); revisor APROBADA a la primera |
| 275 | `docs/NUMERO-CAMBIADO-CREA-IGUAL.md` (aviso de usuario: «No se puede crear el asunto»; tras el aviso «Otro ordenador acaba de usar ese número», cada pulsación de «Crear el asunto» gastaba otro número y no creaba nada; ahora el asunto se crea directamente con el siguiente número libre y lo dice después, sin pulsar otra vez; lo mismo al guardar un documento) | HECHA (6-oct-2026 12:33) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión a0bb7c5, PR 196), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 12:32); revisor APROBADA a la primera · aviso completo: https://drive.google.com/file/d/1FRABeYhjwC1BnuphzkPHFiQ8598qpgTq/view?usp=drivesdk |
| 272 | `docs/DATOS-FAVORITOS-EN-LA-FICHA.md` (aviso de usuario: con los nombres cortos se dejó de ver información; en la ficha del asunto, a la derecha del nombre, hasta 3 datos de la persona o empresa, cada uno con su nombre delante; botón «Elegir datos» en la propia ficha, una elección por clase de tercero y para todo el centro; el alumnado empieza con «Unidad») | HECHA (6-oct-2026 13:05) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión b7fb59d, PR 197), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 13:05); revisor APROBADA a la primera (punto 18 solo Francisco, en `docs/COMPROBAR-A-MANO.md`; punto 15 no ofrecido en la demo, cubierto por la prueba) · aviso completo: https://drive.google.com/file/d/1-Fy34L5DT6gTrVkudFzoC7OITKa24wBj/view?usp=drivesdk |
| 271 | `docs/PLANTILLA-QUE-NO-VUELVE-SOLA.md` (aviso de usuario: «No me deja cambiar de plantilla en este hito»; en el cuadro de Correo y en el de Séneca, «Sin plantilla» se queda elegida en vez de volver sola a la primera; un tipo sin plantilla propia abre el cuadro en «Sin plantilla», y «Aviso de avance» y «Aviso de cierre» solo salen puestas cuando se piden; el nombre del hito sale relleno al comunicar desde un hito) | HECHA (6-oct-2026 11:56): publicada (versión 06-oct-2026 · 11:55), `fila-271` fusionada en `main` por la petición de cambios 195; revisor APROBADA a la tercera (los dos rechazos anteriores eran por la casilla «avisar al terminar», que no se conservaba al guardar la guía: arreglado en `js/guias.js`). Pruebas completas: fallan, también en `main` sin esta fila, `cabecera-compacta`, `control-registro` y `tutores-legales`. |
| 270 | `docs/PLANTILLA-NUEVA-DE-LO-ESCRITO.md` (aviso de usuario: crear una plantilla a partir de lo escrito; en el cuadro de Correo y en el de Séneca, botón «Guardar como plantilla nueva», que abre el editor con lo escrito, sin el saludo ni la firma y con los datos del asunto ya cambiados por su hueco, cada cambio con «Deshacer»; al guardar, la plantilla queda elegida y el mensaje sigue como estaba) | HECHA (6-oct-2026 13:43) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión 3e6c190, PR 198), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 13:43); revisor APROBADA a la primera · aviso completo: https://drive.google.com/file/d/1v3esLEkNWMlRXKpeOcqjdmdXWs81uZob/view?usp=drivesdk |
| 273 | `docs/GUIA-SIEMPRE-AL-DIA.md` (aviso de usuario: la guía de un tipo tenía 2 hitos tras cambiarla y un asunto nuevo salió con los 5 de antes; la ventana trabajaba con una copia vieja de la guía, que solo se lee al arrancar; antes de crear los hitos de un asunto, antes de añadirle hitos, al entrar en «Nuevo asunto» y al abrir Ajustes de un tipo se vuelve a leer la guía guardada; en pantalla no cambia nada) | HECHA (6-oct-2026 14:19) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión 6acc549, PR 199), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 14:18); revisor APROBADA a la primera (puntos 5 a 7 comprobados simulando la otra ventana) · aviso completo: https://drive.google.com/file/d/11Mpx41dWgbknjUr1EkR46D8HBIJHpc0U/view?usp=drivesdk |
| 274 | `docs/AL-TERMINAR-EL-ASUNTO.md` (aviso de usuario: en Ajustes de un tipo no encontraba la opción de «Por liquidar»; no se había perdido, estaba dentro de «Datos del tipo», plegado y con otro nombre; apartado nuevo «Al terminar el asunto», debajo de «Guía», que sin abrirlo dice «se archiva» o «pasa a Por liquidar»; a él se mudan esa casilla, con nombre nuevo, y la de avisar a quien lo pide; nada que migrar) | HECHA (6-oct-2026 14:40) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión e9c4559, PR 200), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 14:40); revisor APROBADA a la primera · aviso completo: https://drive.google.com/file/d/1Vz0NSaJ6ch9qkFehhkzMaot9mMO5DxwG/view?usp=drivesdk |
| 276 | `docs/RELLENAR-CAMPO-QUE-YA-ESTA.md` (aviso de usuario: «Quiero añadir un nuevo campo a un asunto y tras darle a añadir no hace nada»; el campo ya estaba en el tipo, vacío, y su botón estaba apagado sin que se notara; en «+ Añadir campo» de un asunto, un campo que el asunto ya tiene pero está vacío lleva «Rellenar» y pide el valor ahí mismo; con valor, botón en gris y «ya está en este asunto»; los botones apagados se ven en gris en toda la app) | HECHA (6-oct-2026 15:08) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión 2d9a52c, PR 201), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 15:08); revisor APROBADA a la primera (solo consultar no se ofrece en la demo; cubierto por la prueba) · aviso completo: https://drive.google.com/file/d/12SR_Dn82S4K6RRkc-HFRs-_VSvaHDNpb/view?usp=drivesdk |
| 277 | `docs/TIPOS-QUE-SON-EL-MISMO.md` (aviso de usuario: el tipo ANULACIÓN se cambió por ANULACIÓN DE MATRÍCULA y ahora salen los dos para elegir; si un tipo de asunto es el nombre antiguo de otro y no tiene nada propio, la app los une sola al entrar y lo dice en una línea verde; si dos tipos solo se parecen, aviso en el cuadro de avisos de Inicio con «Unir» y «No son el mismo», que no vuelve a preguntar por esa pareja; módulo nuevo `js/tipos-parecidos.js`) | HECHA (6-oct-2026 16:34) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión e29cd48, PR 202), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 16:33); revisor APROBADA a la segunda (la primera falló: en solo consulta con la copia de pruebas seguía saliendo el aviso; arreglado) · punto 17 solo Francisco, en `docs/COMPROBAR-A-MANO.md` · aviso completo: https://drive.google.com/file/d/1RFY_16AID4Vl5RPPUY1RcvqQ4aNV2emh/view?usp=drivesdk |
| 278 | `docs/INFORME-AGRUPADO.md` (aviso de usuario: agrupar el informe en PDF de «Exportar»; en su ventana, dos desplegables «Agrupar por» e «Y dentro, por», con las columnas marcadas; el informe sale en bloques con su título, su número de asuntos y la suma de sus importes; las fechas agrupan por meses y los asuntos sin dato van al final; las columnas agrupadas no se repiten en las tablas; la hoja de cálculo no cambia) | HECHA (6-oct-2026 17:05) · conversación: https://claude.ai/code/session_01LyeksWYEgjyL8XXfpVaxfR · en `main` (fusión 03595b0, PR 203), servida en gestor-de-asuntos.vercel.app (versión 06-oct-2026 · 17:04); revisor APROBADA a la primera · aviso completo: https://drive.google.com/file/d/1nphZ_1FGEoIKEkK3Zy1EqVx5KGrBCwmI/view?usp=drivesdk |
| 279 | `docs/AVISAR-ANTES-DE-CREAR-UN-TIPO-REPETIDO.md` (segunda mitad del diseño de la fila 277, va después de ella: al crear un tipo de asunto, en cualquier sitio, la app avisa si se parece a uno que hay o si ese era el nombre antiguo de otro, con «Usar este» o «Verlo» y «Crear de todas formas»; «Cambiar el nombre» a uno que ya existe ofrece «Unir con él»; cargar la biblioteca y devolver de la papelera también lo miran; prueba de que un nombre antiguo no vuelve solo desde el otro ordenador) | HECHA (6-oct-2026 17:42) · revisor APROBADA, en main (912472e), Vercel sirve la versión; el punto 5 (dos ventanas) ya pasaba, no se tocó `borrados-fusion.js` |
| 280 | `docs/CONVERTIR-EN-PLANTILLA.md` (idea de Francisco: agilizar el diseño de una plantilla a partir de un documento que ya se usa; en el menú ⋮ de un documento Word de un asunto, «Convertir en plantilla»: pantalla completa con el documento y la lista de cambios propuestos —datos del asunto por su hueco, quien firma, formas «el/la», membrete de la app—, lo que no detecte se marca con el ratón («Cambiar por un dato…», «Esto se pregunta cada vez», «Quitar»); tipo de asunto, tipo de documento e hito ya rellenos; antes de guardar se ve junto al original; el original no se toca; un PDF vale si su Word está en el asunto) | HECHA (6-oct-2026 19:25) · revisor APROBADA, en main, Vercel sirve la versión; dejó al día pruebas de la 279 que se habían quedado con textos viejos |
| 281 | `docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md` (segunda mitad del diseño de la fila 280, va después de ella: «Convertir en plantilla» vale también con un PDF que no tiene su Word; la app copia el texto, monta un Word con el membrete y propone quitar cabeceras repetidas y sellos de firma; un PDF escaneado o un impreso con casillas avisan y no se abren; con una tabla, avisa y deja seguir) | HECHA (6-oct-2026 20:03) · revisor APROBADA, en main, Vercel sirve la versión |
| 282 | `docs/QUITAR-UN-DOCUMENTO-DE-SU-HITO.md` (aviso de usuario: poder quitar un documento del hito al que está asociado; ya se podía, pero solo desde la mesa de su hito o con «Ninguno» en la ficha; ahora, en la mesa de cualquier hito, los documentos «De otros hitos» llevan «⋯» con «Traer a este hito» y «Quitar de su hito», y los «sin hito», «Traer a este hito»; en la ficha «Ninguno» pasa a «Quitar del hito»; la tarea que se marcó sola con el documento se queda marcada, con aviso verde y «Desmarcar», igual en todos los sitios; de paso, «Mover a otro hito» deja de poder dejar un documento en dos hitos; módulo nuevo `js/hitos-sacar-documento.js`) | HECHA (6-oct-2026 21:03) · revisor APROBADA, en main, Vercel sirve la versión · aviso completo: https://drive.google.com/file/d/1X48zXN9CfVkipXB9MfTLsiEpZ0hduPwK/view?usp=drivesdk |
| 283 | Aviso de usuario: mejora en «Ficha de un asunto» | DESCARTADA (6-oct-2026): descartada por Francisco desde el Centro de mando |
| 284 | `docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md` (de la auditoría de procedimiento del 6-oct-2026: la biblioteca de hitos trae los plazos legales ya puestos; un plazo se puede contar en meses; un hito de la biblioteca puede llevar plazo y, al llegar a una guía, cuenta desde el hito de arriba; seis hitos que ya estaban reciben su plazo en número y entran siete hitos comunes nuevos —requerir que completen la solicitud, audiencia, pedir informe, cada uno con su espera, y la espera del recurso de alzada—; llega solo al centro, una vez, al entrar, sin pisar ningún plazo ya puesto ni tocar los asuntos abiertos; módulo nuevo `js/plazos-del-centro.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main, Vercel sirve la versión (07-oct-2026 · 00:05, tras un retraso de Vercel de más de una hora) |
| 285 | `docs/HACER-ESTE-HITO.md` (de la auditoría del 6-oct-2026, automatizar: en la pantalla de un hito, un botón «Hacer este hito» que encadena sus tareas con acción: genera el documento y guarda el PDF solo; si hay registro en Séneca se para y sigue sola cuando el PDF sellado está en la carpeta, reconociéndolo sin preguntar; deja el correo preparado con el documento adjunto, con «Enviar» o «Todavía no»; al enviar da el hito por hecho y abre el siguiente; aviso «N listos para enviar» en Inicio; módulo nuevo `js/hacer-este-hito.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main, Vercel sirve la versión (07-oct-2026 · 00:05); punto 13 a mano en `docs/COMPROBAR-A-MANO.md` |
| 286 | `docs/ESPERAS-QUE-SE-CIERRAN.md` (segunda mitad del diseño de la fila 285, va después de ella: al guardar un documento en un asunto que está en espera, el cuadro de nombre lleva una casilla ya marcada «Es lo que se esperaba. Termina la espera», que da el hito por hecho sin cambiar de pantalla, con «Deshacer»; un hito de espera con el plazo vencido lleva el botón «No ha llegado nada», que lo anota y pasa al siguiente; módulo nuevo `js/esperas.js`) | HECHA (7-oct-2026 00:55): revisor APROBADA, en main (882cfa7), Vercel sirve la versión 07-oct-2026 · 00:53 |
| 287 | `docs/PERFIL-DIRECTIVO.md` (idea de Francisco: abrir la aplicación al equipo directivo para consultar y encargar, no para tramitar; primera de tres filas, 287, 289 y 290: en Ajustes → El centro, «Quién usa la aplicación» dice quién es de Dirección, Secretaría o Jefatura de Estudios; quien entra con ese nombre ve solo Inicio y Archivo con los asuntos de su órgano, sin poder cambiar nada; fichero nuevo `perfiles.json`, módulo nuevo `js/perfil.js`) | HECHA (7-oct-2026 04:25) · revisor APROBADA a la primera de este lanzamiento, en `main` (fusión 65c4a07, PR 211), servida en gestor-de-asuntos.vercel.app · conversación: https://claude.ai/code/session_01GT3D9xFzwkzDaLbGtfXf6d. Pruebas completas: fallan en solitario `cabecera-compacta`, `control-registro`, `tutores-legales` y `hacer-este-hito`, también en `main` sin el cambio (entorno de esta sesión) |
| 288 | `docs/AJUSTES-EN-CUATRO-PESTANAS.md` (idea de Francisco: «el módulo de ajustes es un caos»; primera de tres: Ajustes pasa a cuatro pestañas —Lo de cada día, El centro, Este ordenador y Problemas— con un buscador arriba que encuentra cualquier opción; cada sección en un solo sitio; las reparaciones que se usan de vez en cuando pasan a Herramientas; desaparece «Mantenimiento») | HECHA (7-oct-2026 06:20): revisor APROBADA, en `main` (fusión 8167360, PR 212), Vercel sirve la versión (07-oct-2026 · 05:27, tras 22 minutos de espera). Pruebas completas: fallan en solitario `cabecera-compacta`, `control-registro`, `tutores-legales` y `hacer-este-hito`, también en `main` sin el cambio (entorno de esta sesión) |
| 289 | `docs/ENCARGOS-DE-DIRECTIVOS.md` (segunda de tres, va después de la 287: el directivo tiene «Nuevo encargo» y «Mis encargos»; el encargo llega a «Ha llegado» de Inicio con «Crear asunto con él», «Guardar en un asunto que ya existe» y «No procede»; el asunto lo crea Administración, con tercero, fecha límite y quién lo pide ya puestos; fichero nuevo `encargos.json`, módulo nuevo `js/encargos.js`) | HECHA (7-oct-2026 06:22): revisor APROBADA, en `main` (fusión 5c3b801, PR 213), Vercel sirve la versión; pruebas completas: solo las 4 de entorno de arriba y `titulos-de-la-tabla-fijos` (de tiempos finos, a veces pasa y a veces no, también en `main`) |
| 290 | `docs/NOTAS-DE-DIRECTIVOS.md` (tercera de tres, va después de la 289: el directivo deja una nota con documentos en un asunto suyo; aviso «N notas de directivos» en Inicio; en la ficha, «Vista» y «Guardar en el asunto»; archivar con notas sin ver pregunta antes; módulo nuevo `js/notas-directivos.js`) | HECHA (7-oct-2026 07:15): revisor APROBADA a la primera, en `main` (fusión 50d8a2b, PR 214), Vercel sirve la versión; pruebas completas: solo las de entorno de siempre (`cabecera-compacta`, `control-registro`, `tutores-legales`, `hacer-este-hito`) e `inicio`, que sola pasa |
| 291 | `docs/PROBLEMAS-CON-SU-SOLUCION.md` (segunda de tres, va después de la 288: en Ajustes → Problemas, cada aviso es una tarjeta con «Qué pasa», «Por qué» y «Qué hacer», y cada botón dice qué ocurre al pulsarlo y si tiene vuelta atrás; Inicio y el menú avisan con «N problemas por resolver»; módulo nuevo `js/problemas.js`) | HECHA (7-oct-2026 09:20): revisor APROBADA a la segunda (la primera rechazó porque en la demostración no se podía quitar la tarjeta del alumnado; arreglado en la demostración), en `main` (fusión 2178834, PR 215), Vercel sirve la versión; el punto 13 a mano en `docs/COMPROBAR-A-MANO.md`; pruebas completas: solo las de entorno de siempre y `titulos-de-la-tabla-fijos` (tiempos finos) |
| 292 | `docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md` (tercera de tres, va después de la 291: los hitos de un asunto que cambió de nombre pueden volver a él; «Buscar su carpeta» propone la que más se parece; al elegir entre dos versiones guardadas a la vez se ve en qué se diferencian; los asuntos que se repiten preguntan antes de crearse) | SIN PUBLICACIÓN COMPROBADA (7-oct-2026 10:50): revisor APROBADA a la primera, en `main` (fusión 21e6a05, PR 216); Vercel no había publicado 47 minutos después (`js/parecido-de-carpetas.js` daba 404 en gestor-de-asuntos.vercel.app; sin permiso para listar despliegues). Pasa a HECHA cuando la web sirva `js/parecido-de-carpetas.js`; el punto 11 a mano en `docs/COMPROBAR-A-MANO.md`. Pruebas completas: solo las de entorno de siempre y `titulos-de-la-tabla-fijos` (tiempos finos) |
| 293 | `docs/TRABAJO-EN-BLOQUE.md` (idea de Francisco: tareas en bloque, como un certificado para toda una clase; primera de cuatro, 293 a 296: en «Nuevo asunto», «Es para un grupo de personas» crea un solo asunto para una unidad, un nivel o un grupo, con una sola carpeta; en su ficha, tarjeta «Personas del grupo» con una fila por persona y lo que se le ha generado, registrado y enviado, calculado de lo que ya se guarda; «Generar para todos» desde ahí; la ficha de cada persona dice en «Sus asuntos» qué se le hizo y cuándo; módulos nuevos `js/asunto-de-grupo.js` y `js/personas-del-grupo.js`) | PENDIENTE (7-oct-2026) |
| 294 | `docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md` (segunda de cuatro, va después de la 293: «Generar para todos» enseña antes uno de muestra y deja ya el PDF de cada persona, con su referencia «Ref. D26-…» al pie; al guardar en la carpeta los PDF sellados que se descargan de Séneca, la app reconoce de quién es cada uno por esa referencia y lo marca en la tabla; lo que no reconoce sale con «¿De quién es?»; módulos nuevos `js/grupo-generar.js` y `js/grupo-registro.js`) | PENDIENTE (7-oct-2026) |
| 295 | `docs/TRABAJO-EN-BLOQUE-ENVIAR-A-TODOS.md` (tercera de cuatro, va después de la 294: «Enviar…» en la tabla enseña un correo de muestra y a quién va, y con un botón manda un correo a cada persona con su PDF registrado; los fallos, con «Reintentar»; si Google corta por el tope del día, «Seguir enviando» al día siguiente sin repetir a nadie; «Enviar un aviso…» hace lo mismo sin documento; un solo PDF `CORREO` por tanda; módulos nuevos `js/grupo-enviar.js` y `js/grupo-avisos.js`) | PENDIENTE (7-oct-2026) |
| 296 | `docs/TRABAJO-EN-BLOQUE-LISTA-PEGADA.md` (cuarta de cuatro, va después de la 293: al formar un grupo, «Pegar una lista» de Séneca o de una hoja de cálculo, o elegir el fichero; la app reconoce a cada persona por su número, su DNI o su nombre, pregunta cuando hay dos iguales y dice a quién no encuentra; se puede guardar como grupo; módulo nuevo `js/lista-pegada.js`) | PENDIENTE (7-oct-2026) |
| 297 | Aviso de usuario: error en «Inicio» | IDEA (7-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/16M5QZivlkiP12JmzxNUZD3jcptxvJkmM/view?usp=drivesdk |
| 298 | Aviso de usuario: error en «Inicio» | IDEA (7-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1YXIlqvLhhPvxpBqCV4XEo5c3tg5QWFit/view?usp=drivesdk |
| 299 | Aviso de usuario: mejora en «Ficha de un asunto» | IDEA (7-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1XW4NDCPJZ0DmAZ66hzSD568VW8jrRelI/view?usp=drivesdk |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (6-oct-2026, fila 268) Francisco: volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (Google pedirá un permiso nuevo, una vez), leer el correo de resumen e «Implementar» → «Nueva versión»; el mismo pegado vale para las filas 240, 261 y 262. Opcional: propiedad `CORREO_AVISOS`. Pasos en `docs/COMPROBAR-A-MANO.md`.
- (6-oct-2026, fila 268) En la pasada completa fallan también en `main` sin tocar nada `cabecera-compacta.mjs` (con la máquina cargada), `control-registro.mjs`, `tutores-legales.mjs`, `mesa-comunicar-del-paso-y-guion.mjs` y `por-liquidar.mjs` (estas dos pasan solas); `cabecera-fija.mjs` y `notas-no-se-borran.mjs` solo fallaron cargadas.
- (5-oct-2026, fila 265) El guion del revisor habla de `?demo=1&auto=1`, pero ese modo no existe en el código: el revisor necesita el disco de mentira de `pruebas/navegador.mjs` (la primera revisión falló por eso). `pruebas` no se ha nivelado con `main` (no es ascendiente). En la pasada completa fallan `control-registro`, `tutores-legales` y `titulos-de-la-tabla-fijos`, ya conocidas.
- (5-oct-2026, fila 263) En la pasada completa fallan `control-registro.mjs` y `tutores-legales.mjs` también sin los cambios de la fila (la segunda por `control-registro-pantalla.js` con una lista de categorías a mano).
- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran. En `main` sin tocar falla `titulos-de-la-tabla-fijos.mjs` (punto 8, a 1280 px): no es de esta fila.
- (4-oct-2026, fila 262) Francisco: añadir `Focus_Lingo` al permiso «Soporte del Gestor» de GitHub y volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` e «Implementar» → «Nueva versión» (mismo pegado que 240 y 261; pasos en `docs/COMPROBAR-A-MANO.md`). Además, `tutores-legales.mjs` falla también en `main` (punto 5, «ninguna lista de categorías escrita a mano»), y `registro-del-asunto.mjs` falla en la pasada completa pero pasa sola (añadir a `EN_SOLITARIO`). `pruebas` no es ascendiente de `main`: no se nivela.
- (2-oct-2026, fila 261) Volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (leer el registro; autorizar el correo) e «Implementar» → «Nueva versión»; el mismo pegado vale para la fila 240.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: `docs/PENDIENTES-DE-DISENAR.md`, punto 2, sin diseñar.
- (2-oct-2026) Revisadas las pruebas que fallaban en las pasadas completas: `recurrentes.mjs` ya está arreglada (el caso «hace 5 días» dependía de la fecha y fallaba del 1 al 5 de cada mes); `por-liquidar.mjs` y `mesa-comunicar-del-paso-y-guion.mjs` solo fallan con la máquina cargada y pasan en solitario (la primera pasa a `EN_SOLITARIO`). `tras-cada-accion.mjs` punto 3 arreglada en la fila 256 (era el «scroll anchoring» del navegador en Inicio; detalle en `docs/LISTA-A-LA-MISMA-ALTURA-AL-VOLVER.md`). `ha-llegado-sustituye-la-vista.mjs` ya pasa.
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
