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

20. **Tamaño de esta cola y del resumen:** lo manda `docs/METODO-COMUN.md` 5.5 (se miden al marcar
    cada fila HECHA). Es una subida solo de `docs/`, va directa a `main` (no publica nada).

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
| 356 | Centro de datos: los libros de texto (4 listados ya hechos) no los coge el Gestor; el contrato dice «más adelante»; sale del informe de la fila 335 [toca a: centro-de-datos-ies] | SUSTITUIDA (4-nov-2026): diseñada en el tema 363 |
| 360 | Archivar un asunto tarda de 3 a 11 s de media y hasta un minuto (`asunto.archivar`, 13-16 oct); ver por qué y acortarlo; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 361 | Tres guardados «sin remedio» de `asuntos.json` (13 y 15-oct, ordenador `8fq896`) y más de 100 reintentos al día: saber si se perdió algo y por qué fallan; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 363 | Tema: libros de texto, documento de entrega y control de los libros. Junta las ideas 356 y 366: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver; y ayudar a la secretaria a controlar la entrega, la devolución y el estado de los libros. Nota (21-oct-2026): diseñarlo encima del tema 393 (documentos para varias personas y envío de una vez); la entrega de libros sería su primer uso. Nota (23-oct-2026): la idea 366 se suma al tema en la reflexión de hoy; el control puede acabar siendo app propia, se decidirá al diseñarlo. [toca a: centro-de-datos-ies] | SUSTITUIDA (4-nov-2026): diseñado en la fila 501; el control de los libros sigue en la idea 366 |
| 366 | Control de entrega, devolución y estado de los libros de texto, para ayudar a la secretaria; quizá app propia; sale de la reflexión del 18-oct-2026 (tema 363) | IDEA (4-nov-2026): sigue aparte; Francisco centró el tema 363 en el documento. Dato para diseñarla: el sello de los libros no lleva número de ejemplar, solo una línea por alumno con apellidos y nombre, estado de conservación, curso y grupo y curso académico. Falta saber cómo lleva hoy el control la secretaria |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 463 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte A** (tema 448, idea 442, diseñado con Francisco el 25-oct-2026, con ficha): la ventana de la guía a todo lo ancho en dos columnas (hitos a la izquierda, el hito elegido a la derecha); «Datos del hito» con un rótulo en cada desplegable y el «desde» del plazo legible; tareas siempre a la vista; «Más ajustes» repartido en apartados con título. Ejemplo: guía de EXPULSIÓN DEL CENTRO (en la demostración, BAJA MEDICA). | DEVUELTA (25-oct-2026) Nota: parte A hecha y publicada (commit de fusión 3510f06 en `main`, versión servida 26-oct-2026 · 05:29, despliegue READY). Revisor: 1ª RECHAZADA («Normativa e impresos» salía vacío, arreglado), 2ª RECHAZADA solo porque «Explicación del hito» no lleva resumen gris; Francisco lo dio por bueno el 26-oct (sin resumen en la explicación). Resto de la lista BIEN; consola y pantallas BIEN. Pruebas: nueva `editor-de-la-guia-columnas.mjs` y adaptadas (guia-en-acordeon, preguntas-anidadas, traer-hito-de-otro-tipo, texto-del-documento-propuesto, responsable-organismo, opciones); `guias-editor.js` partido (`guias-convertir.js`, `guias-columnas.js`). Pasada completa 26 min: fallan también en `main` limpio (no son de la fila): archivar-no-cabe, convertir-en-plantilla-pdf-pantalla, donde-se-guarda, crear-asunto-desde-por-clasificar, crear-asunto-desde-todos-los-sitios, nuevo-asunto-categoria-guia, nuevo-asunto-persona-primero, persona-en-otra-lista, tercero-con-buscador-al-cambiar, tipo-en-linea-al-cambiar, y `_revisor1/2.mjs` (ficheros sueltos de un revisor antiguo, tracked en `pruebas/`). [SOLO FRANCISCO] guía real de EXPULSIÓN DEL CENTRO, copiado a COMPROBAR-A-MANO. |
| 465 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte C** (tema 448). Empezar con la 464 HECHA. Botón «Ver y cambiar el texto» junto a la plantilla de correo de una tarea y del aviso «Al terminar este hito» (editor de plantillas en la columna derecha, con «← Volver a la guía»); en «Normativa e impresos», solo los impresos marcados y el buscador. | DEVUELTA (26-oct-2026) Nota: el código está hecho en la rama `claude/gestor-asuntos-fila-465-4vdwup` (commit 7199383), NO en `main`. Revisor RECHAZADA dos veces. 1.ª: la plantilla general «Aviso de avance» (sin tipo) perdía su sitio al guardarse desde la guía. 2.ª: la tarjeta de plantillas de la ficha del tipo en Ajustes seguía enseñando el texto viejo. Las dos ya están arregladas en la rama, con prueba nueva (`pruebas/editor-de-la-guia-plantilla.mjs`, todo bien), pero las reglas piden parar tras la segunda: el siguiente lanzamiento retoma esta fila desde la rama, pasa un revisor nuevo y, si aprueba, fusiona y publica. Fuera de ficha, visto por el revisor (no tocado): el hito 2 de la demo pone «Espera: Interesado» y tras volver «Espera: Tercero»; avisos verdes tapan un rato Cancelar/Guardar. Pruebas de lo tocado: 45 de 50 bien; las 5 que fallan (convertir-en-plantilla-pdf-pantalla, nuevo-asunto-categoria-guia, donde-se-guarda, opciones, responsable-organismo) fallan igual en `main` limpio. Decisión sin ficha: mientras el editor de plantilla está abierto, la lista de hitos y los botones de arriba se apagan para no cambiar de hito a medias. Repaso de la ficha: C1 cumplido, C2 cumplido, C3 cumplido, C4 cumplido (revisor 2: BIEN en los puntos 1, 3, aviso general, consola, pantallas y crear/archivar; el 2 es el fallo ya arreglado). |
| 501 | `docs/501-FICHA-ENTREGA-LIBROS.md` (tema 363, diseñado con Francisco el 3 y 4-nov-2026): tipo de asunto FICHA ENTREGA LIBROS, el Gestor lee los libros del Centro de datos y genera la ficha de cada alumno según su matrícula, para uno o para un grupo, con duplicado por extravío; unidad en el buscador de «Nuevo asunto». Pantalla: `docs/pantallas/501.html` [toca a: centro-de-datos-ies] | PENDIENTE (4-nov-2026) |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: documentos del centro tal como son. Junta las ideas 388 y 474: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto; y poder dar de alta en la app los impresos propios del centro. Nota (27-oct-2026): la idea 474 se suma al tema en la reflexión de hoy. | DECIDIDA (21-oct-2026) · tema |
| 460 | Paso de Francisco (de la fila 458, `docs/PASAR-A-DRIVE.md`): en los dos ordenadores del instituto, instalar Google Drive para ordenadores (https://www.google.com/drive/download/) con la cuenta común, modo «Duplicar archivos», carpeta `C:\Google Drive` en los dos; esperar a que sincronice. Después, cuando las filas 455 a 459 estén HECHAS, un viernes por la tarde en el instituto, pulsar «Pasar a Drive» en Ajustes con Diego fuera de la app. | IDEA (24-oct-2026) |
| 467 | Centro de mando: campo «copia de prueba» por app. Decidido el 26-oct-2026 en el método (`fmargon780/metodo-apps`, `METODO.md`, apartado 7): se decide app por app; marcarlo crea una tarea en la cola de esa app para montar la copia, que existe cuando esa tarea está hecha; por defecto, sin copia. Falta diseñarlo con Francisco. | EN TEMA 470 (27-oct-2026) |
| 470 | Tema: copia de prueba en el Centro de mando. Junta la idea 467: una casilla «copia de prueba» por app en el Centro de mando que, al marcarla, crea en la cola de esa app la tarea de montar su copia; por defecto, sin copia. Va en esta cola como las demás partes del Centro de mando. [toca a: metodo-apps] | DECIDIDA (27-oct-2026) · tema |
| 498 | `docs/498-LIMPIAR-COLA-Y-RESUMEN.md` — tarea pequeña del método: la cola por debajo de 40 KB y el resumen por debajo de 160 líneas, sin perder texto | HECHA (2-nov-2026 08:19) · Solo documentos, sin publicar la app: cola 41.170 → ~26,7 KB, resumen 327 → 158 líneas; filas cerradas y 2 notas largas en `docs/HISTORIA.md`; sección 5 del resumen en `docs/contexto/QUE-ESTA-HECHO.md`. Segundo revisor: todo coincide. |

## Lo que queda por hablar con Francisco (resumen; detalle completo en `docs/HISTORIA.md`)

- (2-oct-2026, fila 259) Pendiente de Francisco: subir los listados reales de Séneca y comprobar que los códigos coinciden (`docs/COMPROBAR-A-MANO.md`). Los documentos de asuntos abiertos con el registro solo en el nombre del fichero (antes de la fila 239) no se miran.
- (2-oct-2026, fila 260) Ese día se mezclaron en el Dropbox del centro los cambios hechos en casa sobre la copia de Drive con los del centro: revisar con Francisco, en el centro, las fichas sin carpeta, los ficheros en conflicto y los números de asunto `A26-…` repetidos (en casa se creó al menos un asunto ese día). Trabajar desde casa directamente contra el Dropbox del centro: ahora es la fila 476.
- (varias fechas) Notas viejas sobre pruebas que fallan en `main` y el botón de soporte: movidas sin tocar a `docs/HISTORIA.md` (sección «Notas movidas de `docs/COLA.md` el 7-oct-2026»).

- Sin diseñar: comprobar la entrada de `docs/HISTORIA.md` de las filas 53-56. (El buscador de normativa, los impresos propios y trabajar desde casa pasaron a la cola como filas 474 a 476 el 27-oct-2026.)

## Ideas descartadas, no proponer otra vez

Ver `docs/HISTORIA.md` (informe del 18-sep-2026: editor de Word dentro de la app o plantillas en
Google Docs, un servidor propio, una base de datos del navegador en vez de ficheros, guardar los
cambios uno detrás de otro, un fichero por asunto abierto) y la sección 7 de
`docs/CONTEXTO-CORTO.md`.


| 474 | Alta de impresos propios del centro (fila 190); sale de las notas «sin diseñar» de la cola | EN TEMA 395 (27-oct-2026) |
| 479 | Aviso de usuario: mejora en «Inicio» | EN TEMA 488 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1nfT3TOoqbUBUICsNWPxXsCHXAxM0lpPu/view?usp=drivesdk |
| 481 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 487 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1Vd82D5B3hV4-VZ4PuqD6EdSkL_MpuOuW/view?usp=drivesdk |
| 485 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 490 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1y-XnMaxv6A1U9G9nGhZpDpkXnAx2DRlS/view?usp=drivesdk |
| 487 | Tema: A quién va cada correo. Junta la idea 481 (aviso de Diego): que en «Para» no salga el tutor del grupo de forma automática cuando no toca. Decidir a quién va el correo de cada plantilla, revisando las que hoy van al tutor a propósito (filas 299 y 348). | DECIDIDA (29-oct-2026) · tema |
| 488 | Tema: Tablón más cómodo. Junta la idea 479: revisar lo cómodas que son de usar las notas del tablón (crearlas, leerlas, sus avisos con hora). Al diseñarlo, partir de qué molesta hoy en concreto. | DECIDIDA (29-oct-2026) · tema |
| 490 | Tema: Nombre corto al cambiar el nombre. Junta la idea 485 (aviso de Diego): que al cambiar el nombre de un asunto, la app proponga cambiar también el nombre corto, para que los dos no queden distintos. | DECIDIDA (29-oct-2026) · tema · dejado a medias el 30-oct-2026 para diseñar el 492 · conversación: https://claude.ai/chat/4405be15-66bf-4a03-a242-46b9464a9a55 |
| 494 | «Cambiar el asunto»: que el aviso ámbar de tercero de otra clase no salga cuando la clase del tercero es una de las permitidas del tipo; apartada al diseñar el tema 492 (fila 493) | IDEA (30-oct-2026) |
| 495 | Aviso de usuario: mejora en «Ficha de un asunto» | IDEA (30-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1PuUvh6QVvaHm0POw2szOOffWONoQ3EMU/view?usp=drivesdk |
| 496 | Copia de pruebas (rama `pruebas`): que trabaje con una copia de los datos reales, sacada al probar, con los nombres y datos personales cambiados por inventados y cifras y fechas como están, en vez de datos 100 % inventados. Regla del método del 30-oct-2026 (`docs/METODO-COMUN.md` 6.4) | IDEA (30-oct-2026): decidido por Francisco en el proyecto «Método de desarrollo de apps»; pasa por el recorrido normal |
| 497 | Centro de mando: que las filas DEVUELTA salgan en «En cola» (en la tabla de entrada y en la pestaña Trabajo) y que «Abrir Claude Code» las ofrezca primero. Hoy solo salen en una pastilla «Devueltas» dentro de la app, y la fila 59 de Dieta familiar no se veía (31-oct-2026). | IDEA (31-oct-2026): pedida por Francisco |
| 499 | `docs/499-TIEMPO-POR-APP.md` Centro de mando: tiempo de reflexión y diseño por app, por mes, año y tramo. Pantalla aprobada: `docs/pantallas/499.html`. | HECHA (2-nov-2026 06:35): Centro de mando versión 75, publicada desde la conversación del método con su confirmación; falta que Francisco la compare |
| 500 | La forma de corregir o añadir datos del Centro de datos en esta app y sus avisos: pulsando sobre el propio dato (sin botones a la vista) se corrige o se añade, como estable o temporal con fecha de fin, o se quita la corrección; se avisa del dato temporal, del dato que no coincide con el original (con los dos a la vista y elección solo para esta app) y de que en Séneca lo cambia Administración. Diseñada en el tema 124 del Centro de datos: pantalla aprobada en `docs/pantallas/124.html` de centro-de-datos-ies y qué hace el Centro de datos en su `docs/127-CORRECCIONES-DESDE-LAS-APPS.md`. Necesita su fila 127 HECHA. [toca a: centro-de-datos-ies] | IDEA (2-nov-2026) |


