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
| 478 | `docs/REGISTRADO-DESDE-LA-RUTA-DEL-DOCUMENTO.md` (tema 477, idea 473, diseñado con Francisco el 27-oct-2026, con ficha): al pulsar el «Ruta» pequeño de un PDF la app guarda por dentro una copia; si luego se guarda encima el registrado de Séneca, lo reconoce sola, pasa el original a versiones previas como «SIN SELLAR», anota el registro y la nota y marca la tarea «Registrar»; si llega sin sello, lo deja y guarda el anterior como «ANTERIOR». Urgente para Francisco. | HECHA (28-oct-2026 17:05) |
| 480 | `docs/CORREO-SE-QUEDA-EN-RECIBIDOS.md` (idea 480, aviso de soporte de Francisco, diseñado con Francisco el 28-oct-2026, con ficha): el script deja de archivar lo que recoge; el correo se queda en recibidos sin leer, se marca leído al meterlo en un asunto, se archiva al descartarlo o al archivar su asunto y vuelve a recibidos al reabrirlo; la etiqueta `GESTOR/Hecho` pasa a `En la app`; puesta al día de lo archivado desde el 23-oct. Va justo detrás de la 478 por ser un fallo que ven cada día. | HECHA (29-oct-2026 09:15) · Nota (sesión de cierre): el código ya estaba en `main` (commit da8abc6, 28-oct) y publicado: asuntos.fmargon.com sirve App.VERSION 28-oct-2026 · 17:46 (posterior al commit) y `js/correo-gmail.js`. Comprobado hoy: `npm test -- recibidos todo-el-correo aviso-script correo-cuenta guardar-y-enviar bandeja-latido` → 6 pruebas, 6 bien. Puntos 1 a 10 de «Cómo se comprueba»: cubiertos por `pruebas/correo-se-queda-en-recibidos.mjs` y `pruebas/todo-el-correo-entra.mjs` (script con Gmail simulado, órdenes leído/archivar/recibidos, puesta al día única, pendientes, cuota y 90 días). Punto 11 (SOLO FRANCISCO, con el script real en su Gmail): NO COMPROBADO por mí; Francisco pegó el script el 29-oct y el aviso «anticuado» ya no sale (idea 484). Falta que mire en Gmail que lo nuevo se queda en recibidos sin leer con la etiqueta «En la app». |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 471 | `docs/AVISO-SCRIPT-CORREO-FIABLE.md` (tema 469, idea 468, diseñado con Francisco el 27-oct-2026, con ficha): la app pregunta al script de Gmail su versión al abrirse, sin enviar nada (`doGet` nuevo), para que «El envío de correo está anticuado» salga solo cuando sea verdad; la tarjeta trae «Copiar el enlace del código» (GitHub, para pegarlo en su Chrome personal) y «Abrir mis proyectos de Google», y pasos nuevos. Va delante por ser un aviso falso que ve la usuaria. | HECHA (27-oct-2026 10:20) · Nota (27-oct-2026): hecha en PR #299, publicada y comprobada (`asuntos.fmargon.com` sirve `SCRIPT_ESPERADO` `27-oct-2026 · fila 471`; Vercel READY). Revisor: APROBADA a la primera (7 puntos de pantalla + consola, pantallas y crear/archivar asunto, todos BIEN). Pruebas: `aviso-script-fiable.mjs` nueva, y `problemas`, `bandeja-latido`, `correo-enviar`, `correo-cuenta-comun`, `guardar-y-enviar-sin-sorpresas` actualizadas (versión 471, cuatro pasos, la dirección `.gs` escrita a propósito). Pasada completa del día: cortada a los 30 min por el tope de la herramienta; 10 pruebas fallan igual en `main` limpio (nombres en `docs/PASADA-DIARIA.md`), `grupo-generar` falló en la pasada y pasa a solas. «Cómo sabré»: 1-4 y 5 son SOLO FRANCISCO con el script real: NO COMPROBADOS. El script puesto en Google aún no tiene `doGet`: la tarjeta saldrá una vez, y es verdad. `js/correo-enviar.js` ya pasaba de 400 líneas; el código nuevo va en `js/correo-version.js`. |
| 463 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte A** (tema 448, idea 442, diseñado con Francisco el 25-oct-2026, con ficha): la ventana de la guía a todo lo ancho en dos columnas (hitos a la izquierda, el hito elegido a la derecha); «Datos del hito» con un rótulo en cada desplegable y el «desde» del plazo legible; tareas siempre a la vista; «Más ajustes» repartido en apartados con título. Ejemplo: guía de EXPULSIÓN DEL CENTRO (en la demostración, BAJA MEDICA). | DEVUELTA (25-oct-2026) Nota: parte A hecha y publicada (commit de fusión 3510f06 en `main`, versión servida 26-oct-2026 · 05:29, despliegue READY). Revisor: 1ª RECHAZADA («Normativa e impresos» salía vacío, arreglado), 2ª RECHAZADA solo porque «Explicación del hito» no lleva resumen gris; Francisco lo dio por bueno el 26-oct (sin resumen en la explicación). Resto de la lista BIEN; consola y pantallas BIEN. Pruebas: nueva `editor-de-la-guia-columnas.mjs` y adaptadas (guia-en-acordeon, preguntas-anidadas, traer-hito-de-otro-tipo, texto-del-documento-propuesto, responsable-organismo, opciones); `guias-editor.js` partido (`guias-convertir.js`, `guias-columnas.js`). Pasada completa 26 min: fallan también en `main` limpio (no son de la fila): archivar-no-cabe, convertir-en-plantilla-pdf-pantalla, donde-se-guarda, crear-asunto-desde-por-clasificar, crear-asunto-desde-todos-los-sitios, nuevo-asunto-categoria-guia, nuevo-asunto-persona-primero, persona-en-otra-lista, tercero-con-buscador-al-cambiar, tipo-en-linea-al-cambiar, y `_revisor1/2.mjs` (ficheros sueltos de un revisor antiguo, tracked en `pruebas/`). [SOLO FRANCISCO] guía real de EXPULSIÓN DEL CENTRO, copiado a COMPROBAR-A-MANO. |
| 465 | `docs/EDITOR-DE-LA-GUIA-CLARO.md`, **parte C** (tema 448). Empezar con la 464 HECHA. Botón «Ver y cambiar el texto» junto a la plantilla de correo de una tarea y del aviso «Al terminar este hito» (editor de plantillas en la columna derecha, con «← Volver a la guía»); en «Normativa e impresos», solo los impresos marcados y el buscador. | DEVUELTA (26-oct-2026) Nota: el código está hecho en la rama `claude/gestor-asuntos-fila-465-4vdwup` (commit 7199383), NO en `main`. Revisor RECHAZADA dos veces. 1.ª: la plantilla general «Aviso de avance» (sin tipo) perdía su sitio al guardarse desde la guía. 2.ª: la tarjeta de plantillas de la ficha del tipo en Ajustes seguía enseñando el texto viejo. Las dos ya están arregladas en la rama, con prueba nueva (`pruebas/editor-de-la-guia-plantilla.mjs`, todo bien), pero las reglas piden parar tras la segunda: el siguiente lanzamiento retoma esta fila desde la rama, pasa un revisor nuevo y, si aprueba, fusiona y publica. Fuera de ficha, visto por el revisor (no tocado): el hito 2 de la demo pone «Espera: Interesado» y tras volver «Espera: Tercero»; avisos verdes tapan un rato Cancelar/Guardar. Pruebas de lo tocado: 45 de 50 bien; las 5 que fallan (convertir-en-plantilla-pdf-pantalla, nuevo-asunto-categoria-guia, donde-se-guarda, opciones, responsable-organismo) fallan igual en `main` limpio. Decisión sin ficha: mientras el editor de plantilla está abierto, la lista de hitos y los botones de arriba se apagan para no cambiar de hito a medias. Repaso de la ficha: C1 cumplido, C2 cumplido, C3 cumplido, C4 cumplido (revisor 2: BIEN en los puntos 1, 3, aviso general, consola, pantallas y crear/archivar; el 2 es el fallo ya arreglado). |
| 466 | `docs/PRUEBAS-QUE-ARRANCAN-SIEMPRE.md` (tema 433, ideas 424 y 454, diseñado con Francisco el 26-oct-2026, con ficha): fijar Playwright a la versión que casa con el Chromium del entorno, Chromium de reserva de `/opt/pw-browsers` y puerto libre en `pruebas/ejecutar.mjs`, borrar `pruebas/_revisor1/2.mjs`, regla de no usar `pkill -f` en `CLAUDE.md`. Interno: no cambia nada en pantalla. | HECHA (27-oct-2026 08:35) Nota: Playwright fijado a 1.63.0 exacta (su Chromium 1243 es el del entorno); ejecutor con Chromium de reserva de `/opt/pw-browsers` (o un solo mensaje claro si no hay), puerto libre desde el 8123 con `127.0.0.1` y servidor parado en toda salida (también con SIGINT/SIGTERM); borradas `_revisor1/2.mjs`; regla de no usar `pkill -f` en `CLAUDE.md`; CONTEXTO y CONTEXTO-CORTO al día. Comprobado: `npm ci` en clon limpio y `npm test` arranca sin instalar nada más (puerto 8125); dos tandas completas a la vez usaron 8123 y 8125 (la ocupada se salta) sin fallos falsos nuevos. Ambas fallan las mismas 10 pruebas que ya fallan en `main` limpio (fila 463; comprobadas 4 en un `main` limpio); la pasada tardó ~33 min con dos tandas a la vez. No toca la app: sin publicación en Vercel. Las 258 pruebas leen `CHROMIUM_PATH`, salvo las dos borradas. |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: documentos del centro tal como son. Junta las ideas 388 y 474: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto; y poder dar de alta en la app los impresos propios del centro. Nota (27-oct-2026): la idea 474 se suma al tema en la reflexión de hoy. | DECIDIDA (21-oct-2026) · tema |
| 460 | Paso de Francisco (de la fila 458, `docs/PASAR-A-DRIVE.md`): en los dos ordenadores del instituto, instalar Google Drive para ordenadores (https://www.google.com/drive/download/) con la cuenta común, modo «Duplicar archivos», carpeta `C:\Google Drive` en los dos; esperar a que sincronice. Después, cuando las filas 455 a 459 estén HECHAS, un viernes por la tarde en el instituto, pulsar «Pasar a Drive» en Ajustes con Diego fuera de la app. | IDEA (24-oct-2026) |
| 467 | Centro de mando: campo «copia de prueba» por app. Decidido el 26-oct-2026 en el método (`fmargon780/metodo-apps`, `METODO.md`, apartado 7): se decide app por app; marcarlo crea una tarea en la cola de esa app para montar la copia, que existe cuando esa tarea está hecha; por defecto, sin copia. Falta diseñarlo con Francisco. | EN TEMA 470 (27-oct-2026) |
| 468 | Aviso de usuario: mejora en «Ajustes» | SUSTITUIDA (27-oct-2026): diseñada en el tema 469 · enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1aMo0W_-KGoeYkdNKSyKwr_y4EKGtHWd0/view?usp=drivesdk |
| 469 | Tema: aviso del script de correo fiable y con enlaces. Junta la idea 468: que el aviso «El envío de correo está anticuado» de Problemas salga solo cuando sea verdad (el 27-oct-2026 salió con el script ya al día, porque la app recordaba una versión vieja y no volvía a preguntar; se fue al pulsar «Probar»), y que, cuando sea verdad, traiga el enlace al código que hay que copiar, el enlace al proyecto de Google donde se pega y el paso de «Nueva versión». | SUSTITUIDA (27-oct-2026): diseñada; instrucción en la fila 471 (`docs/AVISO-SCRIPT-CORREO-FIABLE.md`) |
| 470 | Tema: copia de prueba en el Centro de mando. Junta la idea 467: una casilla «copia de prueba» por app en el Centro de mando que, al marcarla, crea en la cola de esa app la tarea de montar su copia; por defecto, sin copia. Va en esta cola como las demás partes del Centro de mando. [toca a: metodo-apps] | DECIDIDA (27-oct-2026) · tema |

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


| 472 | Paso de Francisco (de la fila 471): poner al día el script de Gmail «Gestor - Correos» en script.google.com (https://script.google.com/home, con la cuenta de Administración): la propia tarjeta «El envío de correo está anticuado» de Ajustes → Problemas trae los pasos y el enlace del código (`apps-script/gestor-correos.gs`, versión `27-oct-2026 · fila 471`). Hasta que lo haga, la tarjeta sale (ahora es verdad). | HECHA (27-oct-2026 11:05) · Nota: Francisco pegó el código nuevo de `gestor-correos.gs` en «Gestor - Correos» (cuenta de Administración), guardó e implementó «Nueva versión» en la implementación de siempre; al recargar la app, la tarjeta «El envío de correo está anticuado» ya no sale (puntos 1-4 de «Cómo sabré» de la fila 471 vistos por él; el 5, mañana). |
| 473 | Aviso de usuario: mejora en «Ficha de un asunto» | SUSTITUIDA (27-oct-2026): diseñada en el tema 477: enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1payvZB97ADcJ2gadvMfkcWmeCrA3ndJX/view?usp=drivesdk |
| 474 | Alta de impresos propios del centro (fila 190); sale de las notas «sin diseñar» de la cola | EN TEMA 395 (27-oct-2026) |
| 475 | Buscador de normativa por texto (21-sep-2026); la web de normativa ya tiene un buscador en su portada; sale de las notas «sin diseñar» de la cola [toca a: normativa-escolarizacion] | DESCARTADA (29-oct-2026): la web de normativa ya tiene su buscador en la portada |
| 476 | Trabajar desde casa directamente contra el Dropbox del centro (`docs/PENDIENTES-DE-DISENAR.md`, punto 2); quizá ya no hace falta con Drive (fila 459); se mira cuando se haya pasado a Drive (fila 460); sale de las notas «sin diseñar» de la cola | DESCARTADA (29-oct-2026): Francisco decide no seguir con ella |
| 477 | Tema: guardar un documento registrado en Séneca desde la ruta del documento. Junta la idea 473: que al descargar de Séneca un documento registrado usando la «ruta del documento», la app no pise el anterior, lo pase a versiones anteriores y reconozca el sello de registro, como hacía antes con la ruta de la carpeta, y todo con menos clics. Urgente para Francisco. Tema aparte del 392 (documentos firmados), que tendrá que encajar en lo que se haga aquí. | SUSTITUIDA (27-oct-2026): diseñado, sigue en la fila 478 |
| 479 | Aviso de usuario: mejora en «Inicio» | EN TEMA 488 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1nfT3TOoqbUBUICsNWPxXsCHXAxM0lpPu/view?usp=drivesdk |
| 481 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 487 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1Vd82D5B3hV4-VZ4PuqD6EdSkL_MpuOuW/view?usp=drivesdk |
| 482 | Aviso de usuario: mejora en «Nuevo asunto» | EN TEMA 486 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1flu1-m_8EmHJ7hMCNDIMiHOR0pOOZIjd/view?usp=drivesdk |
| 483 | Aviso de usuario: mejora en «Nuevo asunto» | EN TEMA 486 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1wo7q_9A1D6_DiKGOnHF02mLbtv9vTz2C/view?usp=drivesdk |
| 484 | Paso de Francisco (de la fila 480): pegar el script de Gmail nuevo. Abre https://script.google.com/home con la cuenta común de Administración, entra en «Gestor - Correos», borra el código, pega el de https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs y guarda; después «Implementar» › «Gestionar implementaciones» › el lápiz › «Nueva versión» › «Implementar». Los pasos están también en `docs/TE-TOCA.md` (línea de la fila 480). Hasta entonces el script viejo sigue archivando lo que recoge. | HECHA (29-oct-2026 09:00) · Nota: Francisco pegó esta mañana el código de la fila 480 en «Gestor - Correos» (cuenta común) e implementó la nueva versión; el envío de prueba desde la app salió y en Ajustes → Problemas ya no sale «El envío de correo está anticuado», así que la versión publicada del script es la de la fila 480. Cubre también el pegado pendiente de la fila 441. |
| 485 | Aviso de usuario: mejora en «Ficha de un asunto» | IDEA (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1y-XnMaxv6A1U9G9nGhZpDpkXnAx2DRlS/view?usp=drivesdk |
| 486 | Tema: Nuevo asunto más cómodo. Junta las ideas 482 y 483 (avisos de Diego): que al elegir el tipo de asunto el cursor salte solo al buscador, y que al dar de alta un alumno nuevo la casilla diga «Apellidos y nombre» en vez de «Nombre». Retoques pequeños de la pantalla «Nuevo asunto» para crear asuntos con menos clics y sin dudas. | DECIDIDA (29-oct-2026) · tema |
| 487 | Tema: A quién va cada correo. Junta la idea 481 (aviso de Diego): que en «Para» no salga el tutor del grupo de forma automática cuando no toca. Decidir a quién va el correo de cada plantilla, revisando las que hoy van al tutor a propósito (filas 299 y 348). | DECIDIDA (29-oct-2026) · tema |
| 488 | Tema: Tablón más cómodo. Junta la idea 479: revisar lo cómodas que son de usar las notas del tablón (crearlas, leerlas, sus avisos con hora). Al diseñarlo, partir de qué molesta hoy en concreto. | DECIDIDA (29-oct-2026) · tema |

**Nota (28-oct-2026):** Hecha. Commit 4980d67 en `main` (PR 300), publicada con `create_deployment` (READY, `asuntos.fmargon.com` sirve `js/ruta-copia.js`, versión 28-oct-2026 · 16:54). Revisor APROBADA al primer intento. Comprobaciones: 1 a 5 y «Además» comprobadas con `pruebas/registrado-desde-la-ruta.mjs` (nueva, en verde) y por el revisor en la demo (tarea «Registrar» marcada: comprobada en mi prueba, el revisor no pudo montar el hito). Decisiones: si el registrado llega pero el nombre no tiene fecha/tipo (o chocaría), se trata como «ANTERIOR» con aviso ámbar propio (no previsto en la ficha). `_copia-ruta` se ignora vía `Carpetas.esCarpetaTemporalDeSincronizacion`; renombrar un asunto pierde su copia. Pasada completa: 31 min, 10 fallos que son los mismos 10 de main limpio del 27-oct (archivar-no-cabe, convertir-en-plantilla-pdf-pantalla, crear-asunto-*, donde-se-guarda, nuevo-asunto-*, persona-en-otra-lista, tercero-con-buscador, tipo-en-linea); ninguno es de esta fila.

**Nota fila 480 (28-oct-2026 ~19:00):** Código en `main` (PR 301, merge 6315a1e), publicado con `create_deployment` (`gestor-de-asuntos.vercel.app` y `asuntos.fmargon.com` sirven `js/correo-gmail.js` y la versión «28-oct-2026 · fila 480»). Revisor: APROBADA a la primera (puntos 3, 4, 8 y las tres fijas). «Cómo se comprueba»: 1, 7, 9 y 10 con `pruebas/todo-el-correo-entra.mjs` (script simulado); 2, 3, 4, 5 con `pruebas/correo-se-queda-en-recibidos.mjs` (módulo y pantalla en demostración); 6 y 8 con la misma prueba (puesta al día única, dos ordenadores, pendientes por ordenador, tandas). NO COMPROBADO (solo Francisco, con el script real): 1 a 5 y 7 en su Gmail. Falta pegar el script (idea 484). `archivar-no-cabe.mjs` falla igual en `main` limpio (ya conocida). No se probó "1 día sin salir" en pantalla, solo la función (`_atascadas`) y que existe la tarjeta.
