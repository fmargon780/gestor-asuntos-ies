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
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota; después
   sigue la regla 0 (para, o pasa a la siguiente solo si el lanzamiento pidió varias).
4. Al terminar una, márcala **HECHA** con la fecha y **para**, salvo que el lanzamiento pida varias filas (regla 0). **La hora de `App.VERSION` sale del reloj de verdad**
   (`TZ='Europe/Madrid' date`, receta exacta en `js/version.js`), nunca a ojo: el 17-sep-2026
   salieron versiones con horas por delante de la real.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   para (regla 0). Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   aplica la regla 0 (menos de 90 minutos con conversación enlazada: no se coge otra; si no, se retoma).
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` (o
   el hijo de `docs/contexto/` que toque) **sustituyendo la línea vieja, no añadiendo una debajo**.
   Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 40.000 caracteres.
10. **Antes de subir nada, vuelve a bajar `main`** (`git fetch`): marcar la fila EN CURSO no basta,
    y subir sin releer pisa lo de otro. Hazlo justo antes de cada subida, no una sola vez al empezar.
11. **Nunca subas un fichero con un texto de relleno en vez de su contenido.** Si no tienes el
    contenido entero delante, no lo subas: bájalo antes. El 17-sep-2026 `docs/CONTEXTO.md` se
    quedó en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada más, y hubo que recuperarlo
    del historial de git. Después de subir, vuelve a bajar lo subido y compruébalo.
12. **Subida de ficheros** (7-oct-2026, fila 301): ver `CLAUDE.md`, punto 3 de «Trabajar en la rama
    de la fila». Nunca se suben ficheros de código con las herramientas de ficheros de GitHub
    (`create_or_update_file`, `push_files`); si git no puede subir, la fila queda EN CURSO y se dice.
    Las reglas 14, 15, 17 y 18, que explicaban cómo subir con ellas, se han retirado.

13. **El reparto de las subidas** (fila 242, cambiada el 11-oct-2026 por la fila 331,
    `docs/PUBLICAR-SOLO-AL-TERMINAR.md`). Vercel no publica nada solo: ninguna subida a GitHub crea
    una publicación. **La única publicación de una fila con código es la hecha a propósito** con
    `create_deployment` (regla de `CLAUDE.md`), tras fusionar su rama `fila-<nº>` en `main` con la
    APROBADA del revisor. Las subidas de solo `docs/` (marca EN CURSO, estimaciones, HECHA) van
    directas a `main` y no cuentan en ningún tope. Nada de un commit por fichero.

16. **Si delegas una fila de documentación en una sesión auxiliar**, pídele explícitamente que lea
    el fichero entero de origen y lo copie tal cual, o que lo suba en trozos verificados. El
    19-sep-2026 una sesión auxiliar retipeó tres ficheros de memoria e introdujo erratas en los
    tres (`docs/COLA.md`, `docs/contexto/ASUNTOS.md`, `docs/HISTORIA.md`).
19. **Una fila solo es HECHA con las dos cosas** (fila 242, `docs/REVISOR-EN-LOCAL.md`, sección 2):
    (1) su commit está en `main` (`git merge-base --is-ancestor <sha-de-la-fila> origin/main`, o
    que aparezca en el historial de `main`); sin esto, nunca HECHA, lo diga la web o no; y (2)
    Vercel lo ha publicado, por el primer camino que funcione: a) `curl` a
    `https://asuntos.fmargon.com/js/version.js?v=<algo>` o a
    `https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo>`: `App.VERSION` igual o posterior
    a la de la fila; b) el estado «Vercel» del commit en GitHub (`success`); c) `list_deployments`
    con el `sha`. Si ninguno funciona, la fila queda **SIN PUBLICACIÓN COMPROBADA** con el SHA de
    `main` en la nota, y la sesión para con normalidad. **Un `create_deployment` por fila con código**
    (es el camino normal, `CLAUDE.md`); si responde 402, no se reintenta (el tope es de toda la cuenta de Vercel,
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
| 356 | Centro de datos: los libros de texto (4 listados ya hechos) no los coge el Gestor; el contrato dice «más adelante»; sale del informe de la fila 335 [toca a: centro-de-datos-ies] | EN TEMA 363 (18-oct-2026) |
| 360 | Archivar un asunto tarda de 3 a 11 s de media y hasta un minuto (`asunto.archivar`, 13-16 oct); ver por qué y acortarlo; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 361 | Tres guardados «sin remedio» de `asuntos.json` (13 y 15-oct, ordenador `8fq896`) y más de 100 reintentos al día: saber si se perdió algo y por qué fallan; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 363 | Tema: libros de texto, documento de entrega por alumno. Junta la idea 356: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver. El control de entrega y devolución va aparte (idea 366). Nota (21-oct-2026): diseñarlo encima del tema 393 (documentos para varias personas y envío de una vez); la entrega de libros sería su primer uso. [toca a: centro-de-datos-ies] | DECIDIDA (18-oct-2026) · tema |
| 366 | Control de entrega, devolución y estado de los libros de texto, para ayudar a la secretaria; quizá app propia; sale de la reflexión del 18-oct-2026 (tema 363) | IDEA (18-oct-2026) |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 377 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 389 (21-oct-2026) |
| 378 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 390 (21-oct-2026) |
| 380 | Aviso de usuario: mejora en «Ajustes» | EN TEMA 390 (21-oct-2026) |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 387 | En la Herramienta Etiquetas sería bueno que el sistema recordara la última elección de modelo y diseño y que esa elección esté visible en unas tarjetas en la parte superior de la vista, justo encima de la simulación de la hoja. | EN TEMA 389 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 389 | Tema: Etiquetas que recuerda tu trabajo. Junta las ideas 377 y 387: que la herramienta Etiquetas recuerde el último modelo y diseño elegidos y los enseñe en tarjetas encima de la hoja; poder guardar una tarea a medias (lo elegido para incluir) y retomarla; y poder decidir el orden en que salen las etiquetas. Ojo con las filas 373 y 374, que ya tocaron esta pantalla. | DECIDIDA (21-oct-2026) · tema |
| 390 | Tema: datos de los documentos, elegirlos de las listas y verlos en la ficha. Junta las ideas 378 y 380: que los campos de un tipo de documento puedan ir unidos a las listas de la app (alumnado, personal, familias…) y se elijan buscando, no escritos a mano; y que la lista de documentos de la ficha del asunto enseñe esos datos anotados de cada documento, no solo el tipo, el nombre y el registro. Ejemplo: Presentación de Candidaturas con el nombre del candidato. | DECIDIDA (21-oct-2026) · tema |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: plantillas que copian la forma del original. Junta la idea 388: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto. | DECIDIDA (21-oct-2026) · tema |
| 399 | Aviso de usuario: mejora en «Inicio» | EN TEMA 402 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1Fikj22o3wUexB4AnhmjD_0tReHwRfEjG/view?usp=drivesdk |
| 400 | Aviso de usuario: mejora en «Inicio» | EN TEMA 403 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1I9pb_dFZ971YWp8NnwzhlcBw0qJvUtDw/view?usp=drivesdk |
| 402 | Tema: ir al asunto tras añadirle un documento. Junta la idea 399: al añadir un documento de Por clasificar a un asunto que ya existe, que la app ofrezca ir a ese asunto para seguir trabajando con él. Al crear un asunto desde Por clasificar ya lleva a él (idea 383); aquí falta el caso de añadir a uno existente. | DECIDIDA (21-oct-2026) · tema |
| 403 | Tema: contadores de Inicio que cuadran. Junta la idea 400: la suma de los contadores de Inicio no coincide con el total de asuntos abiertos; que cuadren, o que se vea qué asuntos no entran en ningún contador. | DECIDIDA (21-oct-2026) · tema |
| 410 | Botón de la acción dentro de la tarea del hito (aviso de usuario del 21-oct-2026): `docs/BOTON-DE-LA-ACCION-EN-LA-TAREA.md`. Cada tarea pendiente con acción de correo lleva «Enviar correo» (o «Enviar por Séneca») y cada una de generar, «Generar documento», en su propia línea; al usarlo la tarea se marca y el botón desaparece; registrar no lleva botón; la cabecera no cambia. Ejemplo: A26-0468, hito «Envío de la Comunicación». Aviso completo: https://drive.google.com/file/d/1z88QShh6rXLKG_hqOILk5g7KBlAGceGE/view?usp=drivesdk | HECHA (22-oct-2026 06:14) · Nota: revisor APROBADA (5 puntos de «Cómo sabré que está bien»; el 1 con el caso equivalente de la demostración: A26-0468 real queda **[SOLO FRANCISCO]**, NO COMPROBADO). `npm test` 310/310. Publicado (PR 283, `App.VERSION` 22-oct-2026 · 06:14 en la web). Tropiezo: `hacer-este-hito.mjs` falla a veces en el aviso «listos para enviar» también sin mi cambio (ya en RETIRADAS). |
| 412 | Paso de Francisco (de la fila 411): para que el Gestor trabaje con la cuenta común de Administración, Francisco tiene que (1) dejar vacío «Ha llegado», (2) quitar el reenvío de la cuenta común (https://mail.google.com/mail/u/0/#settings/fwdandpop), (3) crear en https://script.google.com/home, con la cuenta común, el proyecto «Gestor - Correos» con `apps-script/gestor-correos.gs`, ejecutar `prepararTodo`, implementarlo como aplicación web y pegar su dirección en Ajustes de los dos ordenadores, (4) poner Google Drive para ordenadores con la cuenta común y señalar su `GESTOR-BANDEJA` en Ajustes, y (5) borrar el activador del script viejo de su cuenta. Detalle en `docs/CORREO-DESDE-LA-CUENTA-COMUN.md` y `docs/TE-TOCA.md`. | HECHA (22-oct-2026 10:23) · Nota: «Ha llegado» vacío; el reenvío no hacía falta; script de la cuenta común y borrado del activador viejo ya hechos; en los dos ordenadores, dirección y clave del script pegadas y Google Drive con la cuenta común («Duplicar archivos») con su `GESTOR-BANDEJA` señalada. El correo de prueba llegó como «Administración · IES Fuente Lucena» desde la cuenta común. |
| 414 | `docs/ESPERA-SIN-MARCAR-Y-VARIOS-DOCUMENTOS.md` (tema 394, idea 381, diseñado con Francisco el 22-oct-2026): la casilla «Es lo que se esperaba. Termina la espera de…» sale siempre sin marcar; opción nueva por hito de la guía «Recibe varios documentos»: con ella la casilla no sale y cada documento que entra se une al hito sin cerrarlo; no toca la biblioteca. Ejemplo: tipo «Elecc. Consejo Escolar», hito de recepción de candidaturas | HECHA (22-oct-2026 07:59) Nota (22-oct-2026): hecha y publicada (App.VERSION 22-oct-2026 · 07:59, despliegue dpl_8XdGSfxrgnGkmbumeTLhk1oC3o9K READY, commit 5d04bfc en main). Revisor: 1.ª RECHAZADA (punto 5: «Solo en este asunto» lo pisaba la guía; arreglado con la marca `variosPropio`), 2.ª APROBADA. Comprobado 1-3 y 5-6 y 4 con la copia de pruebas; el 4 con la guía real queda en docs/COMPROBAR-A-MANO.md [SOLO FRANCISCO]. Pasada completa: fallos ajenos (hacer-este-hito falla igual en main sin el cambio, por el entorno); los de renombrar-asunto y exportar-asuntos eran de este cambio y se arreglaron. |
| 415 | Paso de Francisco (de la fila 414): en Ajustes → tipo «Elecc. Consejo Escolar» → guía, abrir el hito de recepción de candidaturas, marcar «Recibe varios documentos» y guardar. | HECHA (22-oct-2026 09:25) · Nota: Francisco marcó «Recibe varios documentos» en el hito de recepción de candidaturas de la guía «Elecc. Consejo Escolar» y guardó. |
| 416 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte A** (tema 413, diseñado con Francisco el 22-oct-2026): la guía manda. Todo cambio de la guía (hito nuevo, cambiado o quitado, y orden) llega a los asuntos abiertos en los hitos sin empezar; los empezados no se tocan. Desde un asunto, crear/cambiar/borrar un hito o una tarea de la guía va a la guía sin la pregunta «¿Dónde se guarda?»; «Nueva tarea…» y la casilla «Solo para este asunto» de «+ Crear un hito» quedan «solo aquí». Ejemplo: «Elecc. Consejo Escolar», hito «Registrar de salida en Séneca». | HECHA (22-oct-2026 11:30) · conversación: https://claude.ai/code/session_01EwcWpe3c2P1ZEwLGhuRVhu · Revisor: APROBADA (5 puntos, 0 solo Francisco; el ejemplo con datos reales «Elecc. Consejo Escolar» / «Registrar de salida en Séneca» es [SOLO FRANCISCO]: en la demostración se probó con MATRICULA). Comprobado: pruebas completas en verde salvo 5 que fallaron por carga y pasan a solas; commit 99b060e en main (fusión 562e4d9, PR 284); publicación READY y gestor-de-asuntos.vercel.app sirve el código nuevo (asuntos.fmargon.com no responde desde la sesión). Los CAMPOS de hito/asunto conservan «¿Dónde se guarda?» (no entraban en la parte A). |
| 417 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte B** (tema 413). Empezar con la 416 HECHA. «+ Traer de la biblioteca» pasa a «+ Traer un hito de otro tipo»: buscador con los hitos de todas las guías agrupados por tipo, más «Sin tipo» (lo que solo estaba en la biblioteca); la copia queda suelta. Fuera la etiqueta de origen, la pregunta «¿solo aquí o también en la biblioteca?», «Guardar en la biblioteca», los avisos «Ver el cambio» y el bloque de la biblioteca en Ajustes. Ejemplo: copiar «Registrar de salida en Séneca» de «Elecc. Consejo Escolar» a «Certificado». | HECHA (22-oct-2026 13:05). Nota: revisor APROBADA al primer intento (los 7 puntos y las 3 fijas); prueba completa 311/311 (4 ajenas pasaron al segundo intento a solas); publicada y comprobada (dpl_7KMTS2bD…, READY, asuntos.fmargon.com). Desviación: el plazo de un hito traído cuenta desde el hito de arriba de la guía (no queda vacío) para que no se pierda al repintar; sale la línea ámbar «revísalo». «Crear un hito» desde un asunto sigue usando modelos de la biblioteca (fuera de esta parte). No comprobado: ejemplo con datos reales [SOLO FRANCISCO] (copiar «Registrar de salida en Séneca» de «Elecc. Consejo Escolar» a «Certificado») → en `docs/COMPROBAR-A-MANO.md`. |
| 418 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte C** (tema 413): en el editor de la guía, un paso enseña solo título, responsable, plazo y tareas; lo demás va plegado en «Más ajustes», con una línea gris bajo el título que dice lo activado. Ejemplo: hito de recepción de candidaturas de «Elecc. Consejo Escolar» (lleva «Recibe varios documentos»). | HECHA (22-oct-2026 14:34) · Revisor APROBADA (C.1 puntos 1 y 2 BIEN; el del ejemplo real de «Elecc. Consejo Escolar» es [SOLO FRANCISCO], no comprobado, probado con equivalente en demostración). Publicada y comprobada (web sirve 22-oct-2026 · 14:33). Prueba de la suite completa: 3 pruebas viejas que tocaban el desplegable de responsable y los campos ahora plegados se actualizaron. |
| 420 | Aviso de usuario: mejora en «Inicio» | EN TEMA 431 (23-oct-2026) · aviso completo: https://drive.google.com/file/d/1QXOVgL_ZfvVrnd2qNZtrT1SOGkl0phk2/view?usp=drivesdk |
| 421 | `docs/PRUEBA-CENTRO-DE-DATOS-SIN-FALLOS.md` (tema 365, idea 358, diseñado con Francisco el 22-oct-2026): que `pruebas/centro-de-datos.mjs` no falle sin motivo (el guardado en marcha con un interruptor y no contando llamadas, sin pausas fijas), pase tres veces seguidas a la primera y salga de `RETIRADAS`; solo cambia la prueba, no la app ni lo que se ve. Ejemplo: el listado de alumnado (`RegAlum.csv`) | HECHA (22-oct-2026 18:15) · Nota: solo `pruebas/` (`git diff js/` vacío), en `main` (PR 286, bbfb574), sin publicar (no toca `js/`). Guardado en marcha = interruptor con `finally`; única pausa fija, la de 3 s; el resto, esperas a una condición. `RegAlum` (paso 4): `REGALUM_LATIN1` ya trae las 7 columnas que lee `js/datos-alumnado.js`, no se toca. Comprobado: (1) tres pasadas a solas seguidas «Todo bien» a la primera, y sin segundo intento en las pasadas completas finales. (2) Fuera de `RETIRADAS`. (3) Con la espera de `js/centro-de-datos.js` rota a propósito falló («sale h-per-9, debía h-per-1»); deshecho. (4) Revisor APROBADA: Ajustes > «Carpeta del Centro de datos» sin avisos nuevos, consola limpia. Otras pruebas fallaron por el entorno en las pasadas completas (distintas cada vez), ajenas a esta fila. |
| 422 | `docs/DESACTIVAR-UN-TIPO.md` (tema 404, idea 401, diseñado con Francisco el 22-oct-2026): botón «Desactivar» / «Activar» en cada tipo de asunto de Ajustes; el tipo desactivado sale en gris al final de su categoría, no se ofrece para asuntos nuevos ni cambiados (tampoco en bandeja, reparto, encargos ni lector) y su recurrencia se para; los asuntos que ya lo tienen siguen igual. | HECHA (22-oct-2026 18:57). Nota: botón Desactivar/Activar, tarjeta en gris al final, filtro común `App.tiposParaElegir`, recurrencia parada y recalculada al activar. Pruebas nuevas `tipos-desactivar.mjs` y `tipos-desactivar-ajustes.mjs`; 42 pruebas de lo tocado en verde. Revisor: APROBADA a la primera (4 comprobaciones + 3 fijas, con el tipo «SANCION» de la demo). Publicado y comprobado (version.js 22-oct-2026 · 18:53, commit e5a23bc). |
| 423 | `docs/RUTA-DE-UN-DOCUMENTO.md` (tema 391, idea 379, diseñado con Francisco el 22-oct-2026): botón «Ruta» pequeño detrás del ⧉ de cada documento (ficha del asunto, mesa del hito, versiones previas y barra de arriba del visor) que copia la ruta entera del documento, con su extensión, para pegarla al adjuntarlo en Séneca. Ejemplo: «261019 FACTURA D26-00259.pdf» del asunto de Amazon.  Nota: hecho y publicado (commit f972579 en main; web sirve la novedad 423 y `botonDocumento`). Revisor: APROBADA a la primera. Comprobado: 1-4 con la prueba nueva `pruebas/ruta-de-un-documento.mjs` (ficha, mesa, previas `_Previas` y `Versiones previas`, visor, abierto y archivado, y pidiendo la ruta si falta) y 1-3 por el revisor en la demostración (la demostración no trae versiones previas). 5 [SOLO FRANCISCO] NO COMPROBADO (adjuntar en Séneca): copiado a `docs/COMPROBAR-A-MANO.md`. En el visor el botón sale a la derecha, junto a los botones, no pegado al nombre. Pruebas parciales en verde salvo `hacer-este-hito.mjs`, que falla igual en `main` sin este cambio (entorno): sin tocar. Se ajustó `quitar-documento-del-hito.mjs` (la fila ajena lleva ahora «Ruta» primero). Pasada completa del día ya hecha antes (22-oct 14:34). | HECHA (22-oct-2026 19:59) |
| 424 | Tropiezo (de la fila 421): `npm install` bajó una versión de Playwright que pide un Chromium distinto del que trae el entorno (/opt/pw-browsers) y ninguna prueba arrancaba hasta instalar a mano `playwright@1.56.1` con `--no-save`; además `pgrep -f`/`pkill -f` mató mi propia terminal. Fijar en `package.json` la versión de Playwright que coincide con el Chromium del entorno de sesiones, y apuntar en `CLAUDE.md` no usar `pkill -f`. | EN TEMA 433 (23-oct-2026) · tropiezo |
| 425 | `docs/FICHA-VISTA-DE-TRABAJO.md`, **parte A** (tema 397, ideas 396 y 419, 22-oct-2026): pestaña «Trabajo», primera y abierta al entrar: a la izquierda el hito entero de arriba abajo, a la derecha la carpeta con marca «Hito N» y casillas; los documentos se abren en la columna derecha. Ejemplo: Nicolás Amortegui (A26-0464) y Elecciones al Consejo Escolar. | HECHA (22-oct-2026 23:25) · Nota: `main` 1f0d1e8 (PR 288), publicado y comprobado (versión 23:18; `ficha-trabajo-visor.js` sirve, `hito-mesa-tarjetas.js` 404). Revisor APROBADA (5 puntos + 4 extra, 0 solo Francisco). Comprobado: 1-5 con `pruebas/ficha-vista-de-trabajo.mjs` y el revisor; [SOLO FRANCISCO] a `docs/COMPROBAR-A-MANO.md`. ~140 pruebas tocadas adaptadas y en verde (`ficha-en-tarjetas` pasa a `ficha-en-pestanas`); `grupo-generar` falla a veces bajo carga (aviso tapa un botón), a solas pasa. Decidido: `abrir('hitos')` vale como «trabajo»; Escape con hito abierto vuelve a la lista; el documento abierto desde otra pestaña lleva a «Trabajo» y al cerrarlo vuelve. |
| 426 | `docs/FICHA-VISTA-DE-TRABAJO.md`, **parte B** (tema 397). Empezar con la 425 HECHA. Franja «Datos del asunto» encima de la carpeta (NIE, curso, unidad, teléfono, correo, con ⧉; desplegable con todo) y notas sin hito en el Registro del hito. | HECHA (23-oct-2026 03:34). Franja «Datos del asunto» (`js/ficha-datos-a-mano.js`) y notas sueltas en el Registro del hito (`conSueltas`); también repinta el hito al guardar una nota desde la pestaña Registro. Comprobado: «Cómo sabré» 1-3 con prueba nueva `pruebas/ficha-datos-a-mano.mjs` y con revisor (2.ª vez APROBADA; la 1.ª lo rechazó por la nota recién escrita, arreglado); los dos puntos [SOLO FRANCISCO] (asunto de Nicolás) quedan sin comprobar. Publicado `6fe30dc`, web con 23-oct-2026 · 03:34. |
| 427 | Fallo de la simulación del tema 397: «Registrar» del hito dice que no hay documentos sin registrar aunque los haya en la carpeta o recién generados en el hito (demo: matrícula de Pablo Aguilar Ponce). | EN TEMA 432 (23-oct-2026) |
| 428 | Fallo de la simulación del tema 397: en «Comunicar», «Falta el correo del tutor/a… Completarlo en Tablas de datos» saca del asunto; y en el hito 2 de matrícula propone la plantilla final («Confirmación de matrícula»). | EN TEMA 432 (23-oct-2026) |
| 429 | Fallo de la simulación del tema 397: «Generar documento» en un hito sin plantilla propia no ofrece las del tipo del asunto (matrícula). | EN TEMA 432 (23-oct-2026) |
| 430 | Fallo de la simulación del tema 397: al marcar la última tarea sale «Este hito ya está completo…» aunque solo se quería marcar la tarea (y también al traer un documento). | EN TEMA 432 (23-oct-2026) |
| 431 | Tema: todo el correo de la cuenta común entra en la app. Junta la idea 420: ahora que el Gestor trabaja con la cuenta común de Administración (fila 411), que todos los correos que llegan a esa cuenta entren en la app sin tener que etiquetarlos GESTOR; la persona decide después si crea asunto con cada correo o no. | DECIDIDA (23-oct-2026) · tema |
| 432 | Tema: arreglos del hito en la pestaña «Trabajo». Junta las ideas 427, 428, 429 y 430: los fallos vistos al simular el tema 397 al trabajar un hito (Registrar no ve documentos sin registrar, el aviso de correo del tutor saca del asunto y se propone una plantilla equivocada, Generar no ofrece las plantillas del tipo, y salta «Este hito ya está completo» al marcar la última tarea). Comprobar primero cuáles siguen pasando tras las filas 425 y 426. | EN DISEÑO (23-oct-2026) · conversación: https://claude.ai/code/session_01SJD5QRvVmjFRjRsomt8kad |
| 433 | Tema: herramienta de pruebas que arranque siempre. Junta la idea 424: fijar la versión de Playwright que coincide con el Chromium del entorno de sesiones, para que las pruebas arranquen sin instalar nada a mano, y apuntar en `CLAUDE.md` que no se use `pkill -f`. Interno: no cambia nada en pantalla. | DECIDIDA (23-oct-2026) · tema |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: `docs/PENDIENTES-DE-DISENAR.md`, punto 2, sin diseñar.
- (varias fechas) Notas viejas sobre pruebas que fallan en `main` y el botón de soporte: movidas sin tocar a `docs/HISTORIA.md` (sección «Notas movidas de `docs/COLA.md` el 7-oct-2026»).

- Sin diseñar: buscador de normativa por texto (21-sep); alta de impresos propios del centro (fila 190); comprobar la entrada de `docs/HISTORIA.md` de las filas 53-56.

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.
