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
| 363 | Tema: libros de texto, documento de entrega y control de los libros. Junta las ideas 356 y 366: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver; y ayudar a la secretaria a controlar la entrega, la devolución y el estado de los libros. Nota (21-oct-2026): diseñarlo encima del tema 393 (documentos para varias personas y envío de una vez); la entrega de libros sería su primer uso. Nota (23-oct-2026): la idea 366 se suma al tema en la reflexión de hoy; el control puede acabar siendo app propia, se decidirá al diseñarlo. [toca a: centro-de-datos-ies] | EN DISEÑO (24-oct-2026) · tema · conversación: https://claude.ai/code/session_01TzsoimhWtZkc659SNpZKs6 · en pausa hasta estar en el centro: traer el modelo del documento de entrega, una foto del sello de los libros y cómo lleva hoy la secretaria el control. Decidido: el control va dentro del Gestor, como apartado propio |
| 366 | Control de entrega, devolución y estado de los libros de texto, para ayudar a la secretaria; quizá app propia; sale de la reflexión del 18-oct-2026 (tema 363) | EN TEMA 363 (23-oct-2026) |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 463 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte A** (tema 448, idea 442, diseñado con Francisco el 25-oct-2026, con ficha): la ventana de la guía a todo lo ancho en dos columnas (hitos a la izquierda, el hito elegido a la derecha); «Datos del hito» con un rótulo en cada desplegable y el «desde» del plazo legible; tareas siempre a la vista; «Más ajustes» repartido en apartados con título. Ejemplo: guía de EXPULSIÓN DEL CENTRO (en la demostración, BAJA MEDICA). | DEVUELTA (25-oct-2026) Nota: parte A hecha y publicada (commit de fusión 3510f06 en `main`, versión servida 26-oct-2026 · 05:29, despliegue READY). Revisor: 1ª RECHAZADA («Normativa e impresos» salía vacío, arreglado), 2ª RECHAZADA solo porque «Explicación del hito» no lleva resumen gris; Francisco lo dio por bueno el 26-oct (sin resumen en la explicación). Resto de la lista BIEN; consola y pantallas BIEN. Pruebas: nueva `editor-de-la-guia-columnas.mjs` y adaptadas (guia-en-acordeon, preguntas-anidadas, traer-hito-de-otro-tipo, texto-del-documento-propuesto, responsable-organismo, opciones); `guias-editor.js` partido (`guias-convertir.js`, `guias-columnas.js`). Pasada completa 26 min: fallan también en `main` limpio (no son de la fila): archivar-no-cabe, convertir-en-plantilla-pdf-pantalla, donde-se-guarda, crear-asunto-desde-por-clasificar, crear-asunto-desde-todos-los-sitios, nuevo-asunto-categoria-guia, nuevo-asunto-persona-primero, persona-en-otra-lista, tercero-con-buscador-al-cambiar, tipo-en-linea-al-cambiar, y `_revisor1/2.mjs` (ficheros sueltos de un revisor antiguo, tracked en `pruebas/`). [SOLO FRANCISCO] guía real de EXPULSIÓN DEL CENTRO, copiado a COMPROBAR-A-MANO. |
| 464 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte B** (tema 448). Empezar con la 463 HECHA. Cada tarea en una línea que se abre con «Qué se hace», «A quién», «Por dónde» y «Plantilla de correo»; «Obligatorio» solo con «Hay que reunirlo»; «⋮ → Abrir en la guía» abre el editor nuevo con esa tarea abierta. | HECHA (26-oct-2026 06:16): revisor APROBADA al segundo intento (el primero rechazó solo que la tarea de «Abrir en la guía» no se veía resaltada; arreglado); en `main` (9d825e1), publicada y comprobada (versión 26-oct-2026 · 06:15 servida, despliegue READY). Prueba nueva `pruebas/editor-de-la-guia-tareas.mjs`; `guias-guion.js` partido en `guias-guion-editor.js`. Comprobado: puntos 1-3 de la parte B y «Más de esta tarea», «+ Añadir», pregunta (revisor y prueba). Fallan igual en `main` sin este cambio (entorno): donde-se-guarda, nuevo-asunto-categoria-guia, opciones. [SOLO FRANCISCO] guía real de EXPULSIÓN en COMPROBAR-A-MANO. Anotación del revisor, anterior a esta fila: en el hito 2 de BAJA MEDICA «Espera: Interesado» pasa a «Tercero» al elegirlo en el editor. |
| 465 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte C** (tema 448). Empezar con la 464 HECHA. Botón «Ver y cambiar el texto» junto a la plantilla de correo de una tarea y del aviso «Al terminar este hito» (editor de plantillas en la columna derecha, con «← Volver a la guía»); en «Normativa e impresos», solo los impresos marcados y el buscador. | DEVUELTA (26-oct-2026) Nota: el código está hecho en la rama `claude/gestor-asuntos-fila-465-4vdwup` (commit 7199383), NO en `main`. Revisor RECHAZADA dos veces. 1.ª: la plantilla general «Aviso de avance» (sin tipo) perdía su sitio al guardarse desde la guía. 2.ª: la tarjeta de plantillas de la ficha del tipo en Ajustes seguía enseñando el texto viejo. Las dos ya están arregladas en la rama, con prueba nueva (`pruebas/editor-de-la-guia-plantilla.mjs`, todo bien), pero las reglas piden parar tras la segunda: el siguiente lanzamiento retoma esta fila desde la rama, pasa un revisor nuevo y, si aprueba, fusiona y publica. Fuera de ficha, visto por el revisor (no tocado): el hito 2 de la demo pone «Espera: Interesado» y tras volver «Espera: Tercero»; avisos verdes tapan un rato Cancelar/Guardar. Pruebas de lo tocado: 45 de 50 bien; las 5 que fallan (convertir-en-plantilla-pdf-pantalla, nuevo-asunto-categoria-guia, donde-se-guarda, opciones, responsable-organismo) fallan igual en `main` limpio. Decisión sin ficha: mientras el editor de plantilla está abierto, la lista de hitos y los botones de arriba se apagan para no cambiar de hito a medias. Repaso de la ficha: C1 cumplido, C2 cumplido, C3 cumplido, C4 cumplido (revisor 2: BIEN en los puntos 1, 3, aviso general, consola, pantallas y crear/archivar; el 2 es el fallo ya arreglado). |
| 466 | `docs/PRUEBAS-QUE-ARRANCAN-SIEMPRE.md` (tema 433, ideas 424 y 454, diseñado con Francisco el 26-oct-2026, con ficha): fijar Playwright a la versión que casa con el Chromium del entorno, Chromium de reserva de `/opt/pw-browsers` y puerto libre en `pruebas/ejecutar.mjs`, borrar `pruebas/_revisor1/2.mjs`, regla de no usar `pkill -f` en `CLAUDE.md`. Interno: no cambia nada en pantalla. | EN CURSO (27-oct-2026) · Va delante de las demás PENDIENTE: abarata y hace fiables las pruebas de todas las filas |
| 462 | `docs/AYUDA-AL-PASAR-EL-RATON.md` (tema 453, idea 452, diseñado con Francisco el 24-oct-2026): al dejar el ratón sobre las pestañas y los botones que no se explican solos sale un recuadro con una explicación breve; los apagados dicen por qué; sustituye todas las ayudas grises del navegador; solo con ratón. | HECHA (24-oct-2026 21:00) · Publicada y comprobada: commit d697462 y fusión 74c4d90 en `main`, `js/ayudas.js` servido en gestor-de-asuntos.vercel.app. Revisor: 1.º RECHAZADA (la ayuda de «Impresos» decía «oficiales»), arreglado; 2.º APROBADA. «Cómo sabré que está bien» 1-5 comprobados por el revisor (recuadro en «Lo de cada día», «Liquidar» apagado con motivo, «Guardar» sin recuadro, no tapa ni se corta, ningún `title`); táctil y tabulador, por mi prueba `pruebas/ayuda-al-pasar-el-raton.mjs`. Pruebas: 107 relacionadas; fallan igual en `main` en este entorno: crear-asunto-desde-por-clasificar, crear-asunto-desde-todos-los-sitios, nuevo-asunto-categoria-guia, nuevo-asunto-persona-primero, persona-en-otra-lista, tercero-con-buscador-al-cambiar, tipo-en-linea-al-cambiar, convertir-en-plantilla-pdf-pantalla; `campos.mjs` es frágil también en `main`. Notas: el `<option title>` ya no se ve (se enseña el nombre entero en el desplegable); no llevan recuadro algunos botones de tarjetas de Herramientas. |
| 455 | Pasar a Drive, parte 1: carpeta de entrada de documentos sueltos aparte (handle `entrada`). Instrucción: `docs/PASAR-A-DRIVE.md`, apartado «Fila 455». | HECHA (24-oct-2026 08:01) Nota: hecha y publicada (commit d1463165 en main, despliegue dpl_8NnYGGsJfRLcDTPNSxzct9fyPPCU READY; js/entrada.js sirve 200 en asuntos.fmargon.com). Comprobaciones: 1-4 pasadas por el revisor (APROBADA) en local; 1 en Ajustes → Este ordenador → Carpetas de este ordenador; 3 clasificar desde la entrada (otra carpeta) deja el fichero en el asunto; 4 con `entrada=falta` sale la frase. Prueba nueva pruebas/entrada-documentos-sueltos.mjs (4 escenarios, también `nube: drive`). Pasada completa del día ya hecha a las 07:03 (28 min). Detalle menor: el texto de cabecera de Por clasificar aún dice «carpeta de asuntos abiertos». |
| 456 | Pasar a Drive, parte 2: rutas, tope de largo y textos que valgan para Dropbox y Google Drive; los ficheros propios de Google no cuentan como documentos. Instrucción: `docs/PASAR-A-DRIVE.md`, apartado «Fila 456». HECHA (24-oct-2026 09:45) | Nota: hecha y publicada (commit 21d95a6, despliegue READY en asuntos.fmargon.com). Comprobado: 1) Dropbox copia la ruta de siempre (prueba nube-drive y revisor); 2) con Drive copia ruta con «Mi unidad» y sin «Dropbox» (prueba y revisor); 3) Ajustes y comprobación al entrar dicen «Carpetas de la app» y «Ruta de la nube en este ordenador» (prueba y revisor); 4) un .gdoc (y los otros siete tipos de Google) no sale en el asunto ni en «Por clasificar» (solo en la prueba pruebas/nube-drive.mjs: el revisor no pudo meter un .gdoc en la demo). Pruebas: parciales de lo tocado, 47 de 48 en verde; archivar-no-cabe falla igual en main (carpetas.js pasa de 600 líneas, ya en la pasada diaria). Pasada completa del día ya hecha por otra sesión.
| 457 | Pasar a Drive, parte 3: copias en conflicto de Google Drive en `_GESTOR`. Instrucción: `docs/PASAR-A-DRIVE.md`, apartado «Fila 457». | HECHA (24-oct-2026 09:38). Nota: regla de copias «(N)» de Drive en `_GESTOR` (y `datos`, `presencia`) solo si existe también el fichero sin número; «Acta (2).pdf» no se toca; «Qué cambia» dice «el otro ordenador» o quién estaba dentro (`Presencia.quienEstabaCerca`). Auditados los guardados de `_GESTOR`: todos releen antes de escribir. Forma de Drive NO comprobada en ordenadores reales (anotado en CONTEXTO). Comprobado: los 3 puntos de «Cómo sabré» por el revisor (APROBADA) y por `pruebas/conflictos-drive.mjs`. Publicada (commit db50963, versión 24-oct-2026 · 09:38 servida). |
| 458 | Pasar a Drive, parte 4: botón «Pasar a Drive» (copiar, comprobar, cambiar y carpeta «NO USAR»). Necesita la 455, la 456 y la 457. Instrucción: `docs/PASAR-A-DRIVE.md`, apartado «Fila 458». | HECHA (24-oct-2026 11:10). Nota: botón «Pasar a Drive» en Ajustes → Mantenimiento (`js/pasar-a-drive.js`, `js/pasar-a-drive-ajustes.js`, `js/fechas-de-origen.js`); detalle en `docs/CONTEXTO.md`. Revisor APROBADA a la primera: comprobados los 4 puntos en la demostración (botón y cuenta previa; «Copiados 40 documentos. No falta ninguno» y Elecciones con 10 documentos y 2 versiones previas; «NO USAR – pasado a Drive el 24-10-2026», aviso de lo que queda fuera y sueltos en «Por clasificar»; corte a la mitad con `&traslado=corta` y «Seguir»), más `pruebas/pasar-a-drive.mjs`. Publicada (dpl_5w1oXKwWqkz5TTf9VzKreRQxn3QV READY, commit 3c09c34, la web sirve `pasar-a-drive.js`). NO comprobado en ordenadores reales: escribir en «Mi unidad» de Drive para ordenadores y qué fecha pone a lo copiado. «Dentro de la app» se mide con las señales de `presencia` (solo ven a quien tiene un asunto abierto). La pasada completa no se repite (modo diario, ya hecha hoy). |
| 459 | Pasar a Drive, parte 5: el otro ordenador, casa y la copia sin internet en Drive. Necesita la 458. Instrucción: `docs/PASAR-A-DRIVE.md`, apartado «Fila 459». | HECHA (24-oct-2026 16:56): revisor APROBADA, en `main` (ead2f56), publicada y comprobada (16:54). Detalle en `docs/HISTORIA.md` |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: plantillas que copian la forma del original. Junta la idea 388: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto. | DECIDIDA (21-oct-2026) · tema |
| 451 | `docs/CONTADORES-DE-INICIO-QUE-CUADRAN.md` (tema 403, idea 400, diseñado con Francisco el 24-oct-2026): en Inicio, En Administración + En espera + Por liquidar suman siempre «Todos los abiertos»; «Dormidos» deja de ser pestaña y pasa a ser una marca «Dormido · N días» en la fila, con filtro «Solo dormidos»; los asuntos sin hito pendiente van al final de «En Administración» con «Añade un hito o archívalo»; un hito marcado «Esperando a…» va a «En espera». Ejemplo: captura de Francisco del 21-oct (11 + 3 + 11 de 26). | HECHA (24-oct-2026 07:10) · Publicada (PR 294, deployment READY, commit db26d32 en main; la web sirve `inicio-tabla.js` nuevo y la versión 24-oct-2026 · 07:04). Nota: revisor APROBADA a la segunda (la primera lo rechazó solo porque en la demostración el «dormido» tenía 59,8 días; ajustada su fecha a 75). Comprobado: 1 (suma 27+5+3=35, también con búsqueda y filtros), 2 (sin pestaña Dormidos; marca «Dormido · N días»), 3 («Solo dormidos» en Situación), 4 (al final de En Administración con «Añade un hito o archívalo») y 5 (la marca se quita al escribir una nota) por el revisor y por `pruebas/contadores-de-inicio.mjs`. Matiz: tras escribir la nota, la marca tarda hasta unos 9 s en irse en pantalla (el refresco de siempre) y antes si se pulsa «Actualizar». Un asunto sacado de «Por liquidar» con «Deshacer» no vuelve a pasar solo en esa sesión. [SOLO FRANCISCO] el ejemplo real (26 asuntos) queda en `docs/COMPROBAR-A-MANO.md`. Pasada completa del día: 28 min; fallan en este entorno, y también en `main`, archivar-no-cabe, convertir-en-plantilla-pdf-pantalla y donde-se-guarda. |
| 460 | Paso de Francisco (de la fila 458, `docs/PASAR-A-DRIVE.md`): en los dos ordenadores del instituto, instalar Google Drive para ordenadores (https://www.google.com/drive/download/) con la cuenta común, modo «Duplicar archivos», carpeta `C:\Google Drive` en los dos; esperar a que sincronice. Después, cuando las filas 455 a 459 estén HECHAS, un viernes por la tarde en el instituto, pulsar «Pasar a Drive» en Ajustes con Diego fuera de la app. | IDEA (24-oct-2026) |
| 461 | Paso de Francisco (de la fila 459): en casa, usuario de la cuenta común en el Chromebook. | HECHA (24-oct-2026): usuario creado; lo demás, en COMPROBAR-A-MANO (fila 459) |
| 467 | Centro de mando: campo «copia de prueba» por app. Decidido el 26-oct-2026 en el método (`fmargon780/metodo-apps`, `METODO.md`, apartado 7): se decide app por app; marcarlo crea una tarea en la cola de esa app para montar la copia, que existe cuando esa tarea está hecha; por defecto, sin copia. Falta diseñarlo con Francisco. | IDEA (26-oct-2026) |

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

