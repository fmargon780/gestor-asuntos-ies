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
| 358 | `pruebas/centro-de-datos.mjs`, comprobación «con un guardado en marcha, espera y luego lo toma», falla en un entorno de sesión (otra tarea de fondo consume las dos primeras preguntas de `hayGuardado`); debería esperar a una condición y no contar llamadas; sale del informe de la fila 335 | EN TEMA 365 (18-oct-2026) |
| 360 | Archivar un asunto tarda de 3 a 11 s de media y hasta un minuto (`asunto.archivar`, 13-16 oct); ver por qué y acortarlo; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 361 | Tres guardados «sin remedio» de `asuntos.json` (13 y 15-oct, ordenador `8fq896`) y más de 100 reintentos al día: saber si se perdió algo y por qué fallan; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 363 | Tema: libros de texto, documento de entrega por alumno. Junta la idea 356: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver. El control de entrega y devolución va aparte (idea 366). Nota (21-oct-2026): diseñarlo encima del tema 393 (documentos para varias personas y envío de una vez); la entrega de libros sería su primer uso. [toca a: centro-de-datos-ies] | DECIDIDA (18-oct-2026) · tema |
| 364 | Guardar sin perder nada (parte 1 del tema 364, ideas 360 y 361): `docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md`, parte 1. Un cambio de datos que no se puede guardar queda pendiente (también en el navegador) y se reintenta solo, con aviso rojo fijo arriba; averiguar si el 13 y 15-oct se perdió algo y por qué hay tantos reintentos. Diseñado con Francisco el 21-oct-2026  Nota (21-oct-2026): lo del 13 y 15-oct SÍ pudo perder un cambio: tras los reintentos la escritura se rendía, el cambio vivía solo en una variable local y el siguiente guardado releía el disco sin él (solo se salvaba si la persona veía el aviso rojo y lo repetía); Francisco no recuerda ninguno, pero no se puede descartar. Reintentos: el error es Dropbox sincronizando el mismo fichero (InvalidStateError); `asuntos.json` se reescribe entero en cada cambio y archivar lo escribe 3 veces (estado, línea del registro, encargos) en demostración; reducir esas escrituras queda para la fila 398. Hecho: guardado pendiente (`js/guardado-pendiente.js`), aviso rojo fijo, reintento solo, copia en el navegador, medidas `tarde`/`sin-remedio`; prueba `pruebas/guardado-pendiente.mjs`. `_ficha.json` NO está cubierto (se escribe al archivar: fila 398). Revisor APROBADA (puntos 1, 2 y fijos BIEN; punto 3 SOLO FRANCISCO sin comprobar: Medidas la semana siguiente). `npm test`: 304/305 en la tanda (relacionados pasó en el segundo intento; hito-desde-por-clasificar falló por carga y pasa a solas). Publicado: despliegue READY del commit 13f91e9. | HECHA (21-oct-2026 11:28) |
| 365 | Tema: arreglar una prueba interna. Junta la idea 358: que la prueba `pruebas/centro-de-datos.mjs` no falle sin motivo real. No cambia nada en pantalla. | DECIDIDA (18-oct-2026) · tema |
| 366 | Control de entrega, devolución y estado de los libros de texto, para ayudar a la secretaria; quizá app propia; sale de la reflexión del 18-oct-2026 (tema 363) | IDEA (18-oct-2026) |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 377 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 389 (21-oct-2026) |
| 378 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 390 (21-oct-2026) |
| 379 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 391 (21-oct-2026) |
| 380 | Aviso de usuario: mejora en «Ajustes» | EN TEMA 390 (21-oct-2026) |
| 381 | Aviso de usuario: mejora en «Inicio» | SUSTITUIDA (22-oct-2026): diseñada en el tema 394 |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 385 | `docs/CREAR-DESDE-POR-CLASIFICAR-CON-TIPO.md` (aviso del botón de soporte de Diego Herrera, diseñado con Francisco el 21-oct-2026: «Crear asunto con él» en Por clasificar no crea nunca un asunto sin tipo; si el tipo y la persona adivinados no encajan, abre Nuevo asunto con la persona como sugerencia; ejemplo: candidaturas al Consejo Escolar) · aviso completo: https://drive.google.com/file/d/1jP5_vPA0mibX-IgfbhK9pGbvoZLgO3Fn/view?usp=drivesdk | HECHA (21-oct-2026 05:43) · Nota: código en `main` (PR 276) y publicado (Vercel READY, asuntos.fmargon.com sirve `App.VERSION` 21-oct-2026 · 05:42 con el código nuevo). `npm test` completo: 302 de 303 bien; falló `exportar-asuntos.mjs` (fechas Desde/Hasta) solo en la tanda en paralelo; a solas pasa dos veces y en `main` también, ajena a la fila. Prueba nueva `pruebas/crear-asunto-tipo-no-encaja.mjs` (falla sin el arreglo, pasa con él). Revisor: APROBADA a la primera; puntos 1-5 y a-c BIEN (el caso «misma categoría» lo vio con aviso de duplicado y «Crear otro de todas formas», no hay en la demo una persona sin asunto de ese tipo). Nada [SOLO FRANCISCO]. Nota: al arrancar se dejó la 376 DEVUELTA sin tocar porque el lanzamiento pedía expresamente la 385. |
| 386 | `docs/AVISO-PERSONA-EN-OTRA-LISTA.md` (aviso del botón de soporte de Diego Herrera, diseñado con Francisco el 21-oct-2026: en Nuevo asunto, si la persona buscada no está en la lista del tipo elegido pero sí en la otra —Alumnado o Personal—, sale un aviso con «Es esa persona: elegir otro tipo» y «Es otra persona»; también al darla de alta a mano; el correo no se toca; ejemplo: María Díaz Torres, profesora, con un tipo de alumnado) · aviso completo: https://drive.google.com/file/d/1KqvA6l5fleeh98jtyBrFCzsS3xVBZ1tQ/view?usp=drivesdk | HECHA (21-oct-2026 10:20) · Nota: código en `main` (PR 277) y publicado (Vercel READY; `gestor-de-asuntos.vercel.app` sirve el código nuevo; `asuntos.fmargon.com` no alcanzable desde la sesión). Revisor: APROBADA a la primera. «Cómo sabré que está bien» 1-5 comprobadas por el revisor en local con la demo (con Otero Campos, Marta como profesora) y por `pruebas/persona-en-otra-lista.mjs`. Pasada completa: solo fallaron `exportar-asuntos` y `grupo-generar` por carga de la tanda de 32 min; pasan a solas y en `main`. Observación menor: tras «Cambiar», la parrilla sigue en tipos de personal hasta pulsar otra categoría. |
| 387 | En la Herramienta Etiquetas sería bueno que el sistema recordara la última elección de modelo y diseño y que esa elección esté visible en unas tarjetas en la parte superior de la vista, justo encima de la simulación de la hoja. | EN TEMA 389 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 389 | Tema: Etiquetas que recuerda tu trabajo. Junta las ideas 377 y 387: que la herramienta Etiquetas recuerde el último modelo y diseño elegidos y los enseñe en tarjetas encima de la hoja; poder guardar una tarea a medias (lo elegido para incluir) y retomarla; y poder decidir el orden en que salen las etiquetas. Ojo con las filas 373 y 374, que ya tocaron esta pantalla. | DECIDIDA (21-oct-2026) · tema |
| 390 | Tema: datos de los documentos, elegirlos de las listas y verlos en la ficha. Junta las ideas 378 y 380: que los campos de un tipo de documento puedan ir unidos a las listas de la app (alumnado, personal, familias…) y se elijan buscando, no escritos a mano; y que la lista de documentos de la ficha del asunto enseñe esos datos anotados de cada documento, no solo el tipo, el nombre y el registro. Ejemplo: Presentación de Candidaturas con el nombre del candidato. | DECIDIDA (21-oct-2026) · tema |
| 391 | Tema: copiar la ruta de un documento. Junta la idea 379: un botón en cada documento de la ficha del asunto que copia su ruta completa, igual que hoy se copia la de la carpeta, para ir directo a él al adjuntarlo en Séneca. Ojo con la fila 382 (botones de copiar de la ficha). | DECIDIDA (21-oct-2026) · tema |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 394 | Tema: «Es lo que se esperaba» sin marcar por defecto. Junta la idea 381: al guardar un documento, la casilla «Es lo que se esperaba. Termina la espera de…» sale marcada; tiene que salir sin marcar, para no dar por terminada una espera sin querer. | SUSTITUIDA (22-oct-2026): diseñado; sigue en la fila 414 |
| 395 | Tema: plantillas que copian la forma del original. Junta la idea 388: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto. | DECIDIDA (21-oct-2026) · tema |
| 396 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 397 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1bdzbX2dyJZCAOp3nZaDhP0Cy3z8cfhsH/view?usp=drivesdk |
| 397 | Tema: ficha del asunto con Hitos y Documentos a la vez. Junta la idea 396: al entrar en un asunto, ver a la vez Hitos (a la izquierda) y Documentos de la carpeta (a la derecha), que son las dos secciones de trabajo diario; las demás quedan como consulta aparte. Aprovechar para revisar el orden de la ficha pensando en las tareas habituales. Diseñarlo junto al tema 390, que también cambia la lista de documentos de la ficha; ojo también con el 391 y la fila 382. | DECIDIDA (21-oct-2026) · tema |
| 405 | Los tres puntitos «⋮» también en las tareas que son pregunta (aviso de usuario del 21-oct-2026): `docs/MENU-EN-LAS-PREGUNTAS-DEL-HITO.md`. Una pregunta de las tareas del hito lleva Anotar · Cambiar · Borrar · Abrir en la guía, como cualquier tarea; al borrarla en la guía se avisa en cuántos asuntos ya estaba respondida. Aviso completo: https://drive.google.com/file/d/1BXrQ_UT99PQZZ_gw-9qcyV-gMROjue1Z/view?usp=drivesdk  Nota: hecha y publicada (commit a50edc6 en main, despliegue READY). Comprobado: los 4 puntos de «Cómo sabré que está bien» por revisor independiente en local (APROBADA) y por prueba nueva pruebas/menu-en-las-preguntas-del-hito.mjs; npm test 306/306; novedad visible en la web publicada. | HECHA (21-oct-2026 14:11) |
| 399 | Aviso de usuario: mejora en «Inicio» | EN TEMA 402 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1Fikj22o3wUexB4AnhmjD_0tReHwRfEjG/view?usp=drivesdk |
| 400 | Aviso de usuario: mejora en «Inicio» | EN TEMA 403 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1I9pb_dFZ971YWp8NnwzhlcBw0qJvUtDw/view?usp=drivesdk |
| 401 | Aviso de usuario: mejora en «Ajustes» | EN TEMA 404 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1s-UVORC3FYo0qiK7mILE7DnuN6mLfqrJ/view?usp=drivesdk |
| 402 | Tema: ir al asunto tras añadirle un documento. Junta la idea 399: al añadir un documento de Por clasificar a un asunto que ya existe, que la app ofrezca ir a ese asunto para seguir trabajando con él. Al crear un asunto desde Por clasificar ya lleva a él (idea 383); aquí falta el caso de añadir a uno existente. | DECIDIDA (21-oct-2026) · tema |
| 403 | Tema: contadores de Inicio que cuadran. Junta la idea 400: la suma de los contadores de Inicio no coincide con el total de asuntos abiertos; que cuadren, o que se vea qué asuntos no entran en ningún contador. | DECIDIDA (21-oct-2026) · tema |
| 404 | Tema: desactivar un tipo de asunto. Junta la idea 401: hoy un tipo de asunto se crea, se cambia o se borra; poder también desactivarlo, para que no se use mientras esté desactivado, sin perderlo ni tocar los asuntos que ya lo tienen. | DECIDIDA (21-oct-2026) · tema |
| 408 | Cambiar el tipo de un asunto renombra la carpeta y ofrece la guía nueva (aviso de usuario del 21-oct-2026): `docs/CAMBIAR-TIPO-RENOMBRA-Y-TRAE-GUIA.md`. Solo cambia el tipo dentro del nombre; los asuntos que ya quedaron mal se ponen al día solos al entrar. Aviso completo: https://drive.google.com/file/d/1zWRjZwZxzblfOOiuXk6DMP-IB6AMyOs0/view?usp=drivesdk | HECHA (21-oct-2026 15:10) · Causa: no reproducida; cambiar el tipo desde Editar con un asunto con número (A26-…) ya renombraba y preguntaba (prueba nueva), así que el desajuste viene de otro camino, o de dos tipos que se escriben igual en la carpeta. Hecho: puesta al día al entrar (`js/tipo-del-nombre-al-dia.js`: renombra solo el tipo, la ficha guarda `guiaPorOfrecer`, pregunta una vez a la primera persona con permiso, ámbar si choca, nada en solo consulta) y aviso ámbar en Editar si el nombre queda igual. Prueba: `pruebas/cambiar-tipo-con-numero.mjs`. Revisor APROBADA (punto 4 BIEN, a–c BIEN); puntos 1–3 [SOLO FRANCISCO] NO COMPROBADOS, en `docs/COMPROBAR-A-MANO.md`. Publicada (PR 280, Vercel, 15:10). |
| 406 | Aviso de usuario: mejora en «Ajustes de un tipo de asunto» | SUSTITUIDA (22-oct-2026): diseñada en el tema 413 · aviso completo: https://drive.google.com/file/d/1_8ih2-Cch09576FTjmG7T27y-JP9bD9A/view?usp=drivesdk |
| 407 | Tema: copiar un hito a otra guía. Junta la idea 406: poder copiar un hito con sus tareas desde la guía de un tipo de asunto y ponerlo en la guía de otro tipo, para no rehacer a mano pasos que se repiten entre tipos de asunto. | SUSTITUIDA (22-oct-2026): queda dentro del tema 413 |
| 398 | Archivar sin esperar (parte 2 del tema 364, idea 360): `docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md`, parte 2. El asunto sale de la lista al pulsar «Archivar» y el traslado sigue por detrás con «Archivando…»; si falla, vuelve a la lista con aviso. Empieza solo con la fila 364 HECHA. Ejemplo real: el primer asunto que archive Francisco después de publicarla | HECHA (21-oct-2026 17:40) · Nota: código en `main` (PR 281) y publicado (Vercel READY, commit b72b800; `asuntos.fmargon.com` sirve `js/archivar-fondo.js`). Medido (copia de pruebas, disco en memoria; en Dropbox real pesa el disco): archivar cuesta 1 traslado de carpeta, 5 escrituras de `asuntos.json`, 1 índice del expediente (lo más lento aquí) y 18 lecturas de `hitos.json` (de repintar la lista); ningún paso se ha acortado, porque quitar escrituras cambiaría lo que hace; con «archivar sin esperar» la persona espera 60 ms en vez de todo. Decisiones: los archivados por lotes y quien llama a `App.cerrarAsunto` directamente siguen esperando; el equipo se identifica con un número al azar en el navegador. Comprobado con revisor APROBADA: puntos 1 a 4 de «Cómo sabemos que está bien»; el 5 (ejemplo real y traslado que falle de verdad) es SOLO FRANCISCO: NO COMPROBADO, copiado a `docs/COMPROBAR-A-MANO.md` (el fallo forzado sí lo cubre `pruebas/archivar-sin-esperar.mjs`). `npm test`: 308/308 (2 pasaron al segundo intento, no son de la fila). |
| 409 | Aviso de usuario: mejora en «Ficha de un asunto» | SUSTITUIDA (22-oct-2026): diseñada en el tema 413 · aviso completo: https://drive.google.com/file/d/1j_VfP7GZePWWpWtoF10LBjZf7r-B5v4i/view?usp=drivesdk |
| 410 | Botón de la acción dentro de la tarea del hito (aviso de usuario del 21-oct-2026): `docs/BOTON-DE-LA-ACCION-EN-LA-TAREA.md`. Cada tarea pendiente con acción de correo lleva «Enviar correo» (o «Enviar por Séneca») y cada una de generar, «Generar documento», en su propia línea; al usarlo la tarea se marca y el botón desaparece; registrar no lleva botón; la cabecera no cambia. Ejemplo: A26-0468, hito «Envío de la Comunicación». Aviso completo: https://drive.google.com/file/d/1z88QShh6rXLKG_hqOILk5g7KBlAGceGE/view?usp=drivesdk | HECHA (22-oct-2026 06:14) · Nota: revisor APROBADA (5 puntos de «Cómo sabré que está bien»; el 1 con el caso equivalente de la demostración: A26-0468 real queda **[SOLO FRANCISCO]**, NO COMPROBADO). `npm test` 310/310. Publicado (PR 283, `App.VERSION` 22-oct-2026 · 06:14 en la web). Tropiezo: `hacer-este-hito.mjs` falla a veces en el aviso «listos para enviar» también sin mi cambio (ya en RETIRADAS). |
| 411 | `docs/CORREO-DESDE-LA-CUENTA-COMUN.md` (diseñado con Francisco el 21-oct-2026; primer paso del cambio de Dropbox a Google): el Gestor recoge y envía solo desde la cuenta común 29700692.administracion@g.educaand.es; remitente «Administración · IES Fuente Lucena» (en Ajustes → El centro); Ajustes dice con qué cuenta trabaja cada ordenador y avisa en ámbar si no es la común; las respuestas a hilos antiguos se buscan en la cuenta común por `rfc822msgid:`. Pasos de Francisco a `docs/TE-TOCA.md` al terminar. Ejemplo real: el primer correo que envíe desde un asunto | HECHA (21-oct-2026 22:25) · Nota: código en `main` (PR 282, a2ffd9c), publicado y comprobado (asuntos.fmargon.com sirve `App.VERSION` 21-oct-2026 · 22:18 con la fila 411). Pasada completa 309/309 en verde. Revisor APROBADA a la primera. Comprobado: punto 5 (línea de cuenta de Ajustes, ámbar y tarjeta en Problemas, campos del remitente y de la cuenta, buscador) por el revisor y por `pruebas/correo-cuenta-comun.mjs`; el nombre del remitente (`name`) y la búsqueda por `rfc822msgid:` con `GmailApp` simulado. Puntos 1 a 4: NO COMPROBADOS, [SOLO FRANCISCO] (copiados a `docs/COMPROBAR-A-MANO.md`); sus pasos previos, en `docs/TE-TOCA.md`. Un correo enviado ahora deja su matrícula en el hilo del asunto (para poder responder desde otro buzón). |
| 412 | Paso de Francisco (de la fila 411): para que el Gestor trabaje con la cuenta común de Administración, Francisco tiene que (1) dejar vacío «Ha llegado», (2) quitar el reenvío de la cuenta común (https://mail.google.com/mail/u/0/#settings/fwdandpop), (3) crear en https://script.google.com/home, con la cuenta común, el proyecto «Gestor - Correos» con `apps-script/gestor-correos.gs`, ejecutar `prepararTodo`, implementarlo como aplicación web y pegar su dirección en Ajustes de los dos ordenadores, (4) poner Google Drive para ordenadores con la cuenta común y señalar su `GESTOR-BANDEJA` en Ajustes, y (5) borrar el activador del script viejo de su cuenta. Detalle en `docs/CORREO-DESDE-LA-CUENTA-COMUN.md` y `docs/TE-TOCA.md`. | IDEA (21-oct-2026) · paso de Francisco |
| 413 | Tema: revisión de hitos, tareas, guías y biblioteca. Junta las ideas 409 y 406 (y el tema 407, que queda dentro de este): revisar a fondo cómo funcionan los hitos y las tareas y cómo se relacionan con las guías de cada tipo de asunto y con la biblioteca; dentro de esa revisión, poder copiar un hito con sus tareas de la guía de un tipo a la de otro. Diseñarlo después de que se publique la fila 410 (botón de la acción dentro de la tarea), para revisar el sistema ya con ese botón; tener en cuenta también las filas 405 y 408, ya hechas. | SUSTITUIDA (22-oct-2026): diseñado en las filas 416, 417 y 418 (`docs/HITOS-UN-SOLO-SITIO.md`) |
| 414 | `docs/ESPERA-SIN-MARCAR-Y-VARIOS-DOCUMENTOS.md` (tema 394, idea 381, diseñado con Francisco el 22-oct-2026): la casilla «Es lo que se esperaba. Termina la espera de…» sale siempre sin marcar; opción nueva por hito de la guía «Recibe varios documentos»: con ella la casilla no sale y cada documento que entra se une al hito sin cerrarlo; no toca la biblioteca. Ejemplo: tipo «Elecc. Consejo Escolar», hito de recepción de candidaturas | HECHA (22-oct-2026 07:59) Nota (22-oct-2026): hecha y publicada (App.VERSION 22-oct-2026 · 07:59, despliegue dpl_8XdGSfxrgnGkmbumeTLhk1oC3o9K READY, commit 5d04bfc en main). Revisor: 1.ª RECHAZADA (punto 5: «Solo en este asunto» lo pisaba la guía; arreglado con la marca `variosPropio`), 2.ª APROBADA. Comprobado 1-3 y 5-6 y 4 con la copia de pruebas; el 4 con la guía real queda en docs/COMPROBAR-A-MANO.md [SOLO FRANCISCO]. Pasada completa: fallos ajenos (hacer-este-hito falla igual en main sin el cambio, por el entorno); los de renombrar-asunto y exportar-asuntos eran de este cambio y se arreglaron. |
| 415 | Paso de Francisco (de la fila 414): en Ajustes → tipo «Elecc. Consejo Escolar» → guía, abrir el hito de recepción de candidaturas, marcar «Recibe varios documentos» y guardar. | HECHA (22-oct-2026 09:25) · Nota: Francisco marcó «Recibe varios documentos» en el hito de recepción de candidaturas de la guía «Elecc. Consejo Escolar» y guardó. |
| 416 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte A** (tema 413, diseñado con Francisco el 22-oct-2026): la guía manda. Todo cambio de la guía (hito nuevo, cambiado o quitado, y orden) llega a los asuntos abiertos en los hitos sin empezar; los empezados no se tocan. Desde un asunto, crear/cambiar/borrar un hito o una tarea de la guía va a la guía sin la pregunta «¿Dónde se guarda?»; «Nueva tarea…» y la casilla «Solo para este asunto» de «+ Crear un hito» quedan «solo aquí». Ejemplo: «Elecc. Consejo Escolar», hito «Registrar de salida en Séneca». | EN CURSO (22-oct-2026 09:59) · conversación: https://claude.ai/code/session_01EwcWpe3c2P1ZEwLGhuRVhu |
| 417 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte B** (tema 413). Empezar con la 416 HECHA. «+ Traer de la biblioteca» pasa a «+ Traer un hito de otro tipo»: buscador con los hitos de todas las guías agrupados por tipo, más «Sin tipo» (lo que solo estaba en la biblioteca); la copia queda suelta. Fuera la etiqueta de origen, la pregunta «¿solo aquí o también en la biblioteca?», «Guardar en la biblioteca», los avisos «Ver el cambio» y el bloque de la biblioteca en Ajustes. Ejemplo: copiar «Registrar de salida en Séneca» de «Elecc. Consejo Escolar» a «Certificado». | PENDIENTE (22-oct-2026) |
| 418 | `docs/HITOS-UN-SOLO-SITIO.md`, **parte C** (tema 413): en el editor de la guía, un paso enseña solo título, responsable, plazo y tareas; lo demás va plegado en «Más ajustes», con una línea gris bajo el título que dice lo activado. Ejemplo: hito de recepción de candidaturas de «Elecc. Consejo Escolar» (lleva «Recibe varios documentos»). | PENDIENTE (22-oct-2026) |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: `docs/PENDIENTES-DE-DISENAR.md`, punto 2, sin diseñar.
- (varias fechas) Notas viejas sobre pruebas que fallan en `main` y el botón de soporte: movidas sin tocar a `docs/HISTORIA.md` (sección «Notas movidas de `docs/COLA.md` el 7-oct-2026»).

- Del 21-sep-2026: buscador de normativa por texto para rellenar solo la clave de un paso — sigue
  sin diseñarse con Francisco.
- Del 27-sep-2026 (fila 190): falta que Francisco pueda dar de alta un impreso propio del centro
  (sin anexo del BOJA), con un campo nuevo en el catálogo que diga de quién es cada impreso.
- `docs/HISTORIA.md` podría seguir sin la entrada de las filas 53-56 (18-sep-2026: cuadro de
  Séneca en dos columnas, el ayudante fiable, el asunto sin elección, los campos calculados);
  comprobar y pegarla si falta.

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.
