# Cola de instrucciones para Claude Code

Estados: PENDIENTE / EN CURSO / HECHA / BLOQUEADA / DEVUELTA / IDEA / EN DISEÑO. IDEA: apuntada por
Francisco, sin diseñar. EN DISEÑO: se está diseñando en una conversación de Cowork; lleva el
enlace. DEVUELTA: el revisor la rechazó dos veces (`docs/REVISOR-ANTES-DE-PUBLICAR.md`); el
siguiente lanzamiento la retoma si es la primera DEVUELTA o PENDIENTE en el orden de la cola. Claude Code no toca IDEA ni EN
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
   primera fila DEVUELTA o PENDIENTE, en el orden de la cola**. Si la
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
2. Coge la primera instrucción con estado **DEVUELTA o PENDIENTE**, leyendo la tabla **de arriba abajo** (saltando IDEA y EN DISEÑO). Ojo: desde el
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
4. Al terminar una, márcala **HECHA** con la fecha y **para**, salvo que el lanzamiento pida varias filas (regla 0). **La hora de `App.VERSION` la pone el programa**
   (`node scripts/poner-version.mjs`, fila 549), nunca a mano ni a ojo: el 17-sep-2026 y el 6-nov-2026
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
| 360 | Archivar un asunto tarda de 3 a 11 s de media y hasta un minuto (`asunto.archivar`, 13-16 oct); ver por qué y acortarlo; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 361 | Tres guardados «sin remedio» de `asuntos.json` (13 y 15-oct, ordenador `8fq896`) y más de 100 reintentos al día: saber si se perdió algo y por qué fallan; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. [orden: 9 · toca documentos; primero se mira qué falta de lo que ya hacen los asuntos de grupo] | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: documentos del centro tal como son. Junta las ideas 388 y 474: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto; y poder dar de alta en la app los impresos propios del centro. Nota (27-oct-2026): la idea 474 se suma al tema en la reflexión de hoy. [orden: 7 · también documentos, seguido del anterior] | DECIDIDA (21-oct-2026) · tema |
| 460 | Paso de Francisco (de la fila 458, `docs/PASAR-A-DRIVE.md`): en los dos ordenadores del instituto, instalar Google Drive para ordenadores (https://www.google.com/drive/download/) con la cuenta común, modo «Duplicar archivos», carpeta `C:\Google Drive` en los dos; esperar a que sincronice. Después, cuando las filas 455 a 459 estén HECHAS, un viernes por la tarde en el instituto, pulsar «Pasar a Drive» en Ajustes con Diego fuera de la app. | APLAZADA (5-nov-2026): la deja Francisco por ahora, sin cambiar nada. Visto en el ordenador del usuario «Propietario»: Drive está en «Replicar archivos» con la cuenta común, pero la carpeta es `C:\Users\Propietario\Mi unidad (29700692.administracion@g.educaand.es)` (ruta deducida de la barra del Explorador), no `C:\Google Drive`. Preferencias no enseña botón para moverla, y la ayuda de Google consultada no explica cómo. Sin ver: el otro ordenador. Ojo: «Pasar a Drive» (`NOMBRES_DRIVE`, `js/pasar-a-drive.js`) y `esTrozoDrive` (`js/copiar-ruta.js`) solo aceptan el nombre exacto «Mi unidad» o «My Drive», y rechazarían esa carpeta. |
| 467 | Centro de mando: campo «copia de prueba» por app. Decidido el 26-oct-2026 en el método (`fmargon780/metodo-apps`, `METODO.md`, apartado 7): se decide app por app; marcarlo crea una tarea en la cola de esa app para montar la copia, que existe cuando esa tarea está hecha; por defecto, sin copia. Falta diseñarlo con Francisco. | EN TEMA 470 (27-oct-2026) |
| 470 | Tema: copia de prueba. Junta las ideas 467 y 496: una casilla «copia de prueba» por app en el Centro de mando que, al marcarla, crea en la cola de esa app la tarea de montar su copia, por defecto sin copia; y que la copia de pruebas del Gestor trabaje con una copia de los datos reales, con los datos personales cambiados por inventados. Va en esta cola como las demás partes del Centro de mando. Nota (4-nov-2026): la idea 496 se suma al tema en la reflexión de hoy; la casilla vale para todas las apps y la 496 solo para el Gestor, quizá haya que partirlo al diseñarlo. [toca a: metodo-apps] [orden: 13 · no la necesita ningún otro tema] | DECIDIDA (27-oct-2026) · tema |

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
| 481 | Aviso de usuario: mejora en «Ficha de un asunto» | SUSTITUIDA (6-nov-2026): diseñada en el tema 487 · enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1Vd82D5B3hV4-VZ4PuqD6EdSkL_MpuOuW/view?usp=drivesdk |
| 485 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 490 (29-oct-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1y-XnMaxv6A1U9G9nGhZpDpkXnAx2DRlS/view?usp=drivesdk |
| 487 | Tema: A quién va cada correo. Junta las ideas 481 (aviso de Diego) y 495: que en «Para» no salga el tutor del grupo de forma automática cuando no toca, y que una plantilla pueda ir a otra persona que no sea la familia, el tutor o quien lo pide. Decidir a quién va el correo de cada plantilla, revisando las que hoy van al tutor a propósito (filas 299 y 348). Nota (4-nov-2026): la idea 495 se suma al tema en la reflexión de hoy. [orden: 2 · lo necesita el tema 520 y ordena los correos] | SUSTITUIDA (6-nov-2026): diseñado en la fila 555 |
| 488 | Tema: Tablón más cómodo. Junta la idea 479: revisar lo cómodas que son de usar las notas del tablón (crearlas, leerlas, sus avisos con hora). Al diseñarlo, partir de qué molesta hoy en concreto. [orden: 12 · pantalla aparte, no la necesita ningún otro tema] | DECIDIDA (29-oct-2026) · tema |
| 490 | Tema: Nombre corto al cambiar el nombre. Junta la idea 485 (aviso de Diego): que al cambiar el nombre de un asunto, la app proponga cambiar también el nombre corto, para que los dos no queden distintos. [orden: 10 · ficha del asunto] | DECIDIDA (29-oct-2026) · tema · dejado a medias el 30-oct-2026 para diseñar el 492 · conversación: https://claude.ai/chat/4405be15-66bf-4a03-a242-46b9464a9a55 |
| 494 | «Cambiar el asunto»: que el aviso ámbar de tercero de otra clase no salga cuando la clase del tercero es una de las permitidas del tipo; apartada al diseñar el tema 492 (fila 493) | EN TEMA 502 (4-nov-2026) |
| 495 | Aviso de usuario: mejora en «Ficha de un asunto» | SUSTITUIDA (6-nov-2026): diseñada en el tema 487 · enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1PuUvh6QVvaHm0POw2szOOffWONoQ3EMU/view?usp=drivesdk |
| 496 | Copia de pruebas (rama `pruebas`): que trabaje con una copia de los datos reales, sacada al probar, con los nombres y datos personales cambiados por inventados y cifras y fechas como están, en vez de datos 100 % inventados. Regla del método del 30-oct-2026 (`docs/METODO-COMUN.md` 6.4) | EN TEMA 470 (4-nov-2026): decidido por Francisco en el proyecto «Método de desarrollo de apps»; pasa por el recorrido normal |
| 500 | La forma de corregir o añadir datos del Centro de datos en esta app y sus avisos: pulsando sobre el propio dato (sin botones a la vista) se corrige o se añade, como estable o temporal con fecha de fin, o se quita la corrección; se avisa del dato temporal, del dato que no coincide con el original (con los dos a la vista y elección solo para esta app) y de que en Séneca lo cambia Administración. Diseñada en el tema 124 del Centro de datos: pantalla aprobada en `docs/pantallas/124.html` de centro-de-datos-ies y qué hace el Centro de datos en su `docs/127-CORRECCIONES-DESDE-LAS-APPS.md`. Necesita su fila 127 HECHA. [toca a: centro-de-datos-ies] | EN TEMA 503 (4-nov-2026) |
| 502 | Tema: Aviso de clase en «Cambiar el asunto». Junta la idea 494: que el aviso ámbar de tercero de otra clase no salga cuando la clase del tercero es una de las permitidas del tipo. Parece tarea pequeña: hoy el aviso solo mira la primera clase del tipo. [orden: 11 · «Cambiar el asunto», cerca del 490] | DECIDIDA (4-nov-2026) · tema |
| 503 | Tema: Corregir datos del Centro de datos en el Gestor. Junta la idea 500: que en esta app se corrija o añada un dato del Centro de datos pulsando sobre el propio dato, como estable o temporal, y se avise del dato temporal, del que no coincide con el original y de que en Séneca lo cambia Administración. Se parte de la pantalla aprobada en `docs/pantallas/124.html` de centro-de-datos-ies; su fila 127 ya está HECHA. [toca a: centro-de-datos-ies] [orden: 5 · un dato se escribe una vez y se usa en todas partes] | DECIDIDA (4-nov-2026) · tema |
| 506 | Método: quitar la regla «la DEVUELTA va siempre delante» (skill `disenar-idea`, «Ordenar la cola», y lo que la repita): desde la fila 507 Francisco decide el orden completo; una devuelta llega arriba, pero se puede mover. Se trata en el proyecto «Método de desarrollo de apps». [toca a: metodo-apps] | EN TEMA 521 (5-nov-2026) |
| 509 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 517 (5-nov-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/16Yr1XkPcc3k0TQoPG9-ZnUy1dNT7db_M/view?usp=drivesdk |


| 511 | Tipo de asunto para la baja en ESO por traslado al extranjero (parte de Administración: recibir el encargo de Dirección, elaborar la resolución, firma, registro de salida, baja en Séneca y comunicar si procede), con resolución, anexo I, anexo II y correo. Necesita la 510 HECHA. | EN TEMA 519 (5-nov-2026) |
| 515 | `docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md` (tema 392, diseñado con Francisco el 5-nov-2026): la app reconoce los PDF firmados y cuenta las firmas; marca «Firmado» en la línea del documento, nota y versiones previas; aviso si llega con otro nombre; pregunta si llega algo sin firma sobre un firmado. Pantalla: `docs/pantallas/515.html` | HECHA (5-nov-2026 10:33) · publicada y comprobada (commit 3398eda; asuntos.fmargon.com sirve los ficheros nuevos). Pendiente solo lo [SOLO FRANCISCO] de `docs/COMPROBAR-A-MANO.md` (PDF reales de AutoFirma y Séneca). Notas en `docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md`. |
| 514 | Aviso de usuario: mejora en «Ficha de un asunto» [toca a: centro-de-datos-ies, bd-alumnado-ies] | EN TEMA 520 (5-nov-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1JmZsweqv8keMODRG4fLZzb7YbQ3eUF8q/view?usp=drivesdk |
| 517 | Tema: Fecha de registro. Junta la idea 509: decidir si la app guarda la fecha de registro de cada documento, aparte de la del documento. Hoy guarda una sola fecha y el código de registro; la fecha de registro viene en los listados de Séneca. El ejemplo del aviso (emitida el 30.11, registrada el 03.11) parece llevar una errata: aclararlo al diseñarlo. [orden: 6 · toca los documentos y su registro] | DECIDIDA (5-nov-2026) · tema |
| 519 | Tema: Baja en ESO por traslado al extranjero. Junta la idea 511: un tipo de asunto con la parte de Administración de ese trámite, con resolución, anexos I y II y correo. La fila 510 ya está HECHA. [orden: 3 · trámite nuevo que encaja con que todo quepa en la app; nace ya con las listas comunes] | DECIDIDA (5-nov-2026) · tema · Nota (5-nov-2026): diseñarlo con las filas 530 y 531 HECHAS |
| 520 | Tema: Aula de convivencia. Junta la idea 514: montar la guía de la expulsión al aula de convivencia y automatizar lo que hacen los administrativos, con atención a quién tiene la custodia del alumno. Hoy ese asunto va sin hitos; hay un modelo en `docs/contenido/BIBLIOTECA-ALUMNADO.md`. La custodia es un dato reservado del alumnado; roza el tema 487 (a quién va cada correo). [toca a: centro-de-datos-ies, bd-alumnado-ies] [orden: 4 · igual que el 519; a quién va cada correo ya está diseñado (fila 555)] | DECIDIDA (5-nov-2026) · tema · Nota (5-nov-2026): diseñarlo con las filas 530 y 531 HECHAS |
| 521 | Tema: Orden de la cola en el método. Junta la idea 506: quitar la regla «la DEVUELTA va siempre delante» de la skill `disenar-idea` y de donde se repita, porque desde la fila 507 Francisco decide el orden. Se trata en el proyecto «Método de desarrollo de apps». [toca a: metodo-apps] [orden: 14 · se trata en el proyecto del método] | DECIDIDA (5-nov-2026) · tema |
| 522 | `docs/522-TAREAS-CON-DOCUMENTO.md` (tema 516, diseñado con Francisco el 5-nov-2026): cada tarea lleva colgado su documento, con «Elegir documento» y la versión con la que quedó; «Qué se hace» al crear o cambiar una tarea en el hito. Pantalla: `docs/pantallas/516.html` | HECHA (5-nov-2026 13:00) |
| 523 | `docs/523-TAREA-FIRMAR.md` (tema 516): acción «Firmar un documento» con firmas necesarias, se marca sola con su documento y «Hacer este hito» espera la firma. Necesita la 522 HECHA. Pantalla: `docs/pantallas/516.html` | HECHA (5-nov-2026 13:25) |
| 524 | `docs/524-AVISOS-DE-LO-QUE-FALTA.md` (tema 516): cuadro de lo que falta por firmar o registrar al marcar el hito, archivar y enviar, sin impedir; «Sin registrar» solo donde hay que registrar. Necesita la 522 y la 523 HECHAS. Pantalla: `docs/pantallas/516.html` | HECHA (5-nov-2026 14:02) Nota: publicada (commit 6588bb0 en `main`; `avisos-de-lo-que-falta.js` sirve 200 en asuntos.fmargon.com). Segundo revisor: coincide todo; quitó dos textos de más en los cuadros (arreglado); informe en la instrucción. El aviso de enviar va dentro del resumen del correo («Enviar igualmente»). Prueba nueva `avisos-de-lo-que-falta.mjs`. Fallan también en main: hacer-este-hito y archivar-no-cabe (prueba 14, `js/carpetas.js` de 624 líneas). |
| 527 | Aviso de usuario: mejora en «Inicio» | EN TEMA 533 (5-nov-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1-wGc199Sv_0Xo-wV6EgRXdsid69XWiWo/view?usp=drivesdk |
| 528 | `docs/528-LISTA-DE-CAMPOS.md` (tema 518, diseñado con Francisco el 5-nov-2026): pantalla «Campos» con todos los datos, grupo, origen, tabla y columna; ventana de elegir campo en las plantillas. Pantalla: `docs/pantallas/518.html` | HECHA (5-nov-2026 19:53) · Código en `main` (PR 308, merge 07aa8ca), publicación `dpl_8qCXoLmkj79W86hzNeHSA9VPyfna` READY y `asuntos.fmargon.com` sirve `js/campos-lista-pantalla.js` (versión 19:28). Revisor: aprobado tras una vuelta; detalle en la instrucción |
| 535 | `docs/535-FICHEROS-LARGOS-HITOS-CARPETAS.md` (tema 534, diseñado con Francisco el 5-nov-2026): partir `js/hitos-guion.js`, `js/hitos.js`, `js/hitos-desde-el-asunto.js` y `js/carpetas.js`, sin cambiar nada de lo que se ve. Va antes de las 530 y 531. | HECHA (5-nov-2026 19:53) · Código en `main` (PR 309, merge 72b698e), publicado con `create_deployment` (`asuntos.fmargon.com` sirve los trozos nuevos, sin errores de consola). Cuatro ficheros partidos en 15 de menos de 270 líneas; paso 14 de `archivar-no-cabe` en verde; revisor aprobado. `pruebas/opciones.mjs` falla igual en `main` (entorno) |
| 536 | `docs/536-FICHEROS-LARGOS-LOS-OTROS-SIETE.md` (tema 534): partir los otros siete ficheros de más de 600 líneas, y cualquier otro que pase de 600 al empezar. Necesita la 535 HECHA. | HECHA (5-nov-2026 20:20) · Código en `main` (PR 310, merge 186e7f0), publicado con `create_deployment`; `asuntos.fmargon.com` sirve los trozos nuevos y carga sin errores. Siete ficheros partidos en 19 trozos de menos de 330 líneas; ningún `js/` pasa de 600. Revisor: aprobado. Fallan igual en `main`: `campos.mjs`, `contadores-de-inicio`, `tutores-legales`, `tablon-no-se-borra` |
| 529 | `docs/529-CREAR-CAMPOS-POR-PASOS.md` (tema 518): crear campos a partir de otros, por pasos, con texto, decisiones, fechas y números. Necesita la 528 HECHA. Pantalla: `docs/pantallas/518.html` | HECHA (5-nov-2026 20:53) · Código en `main` (PR 311, merge f99db05), publicado con `create_deployment`; `asuntos.fmargon.com` sirve los ficheros nuevos y carga sin errores. Revisor: aprobado en segunda vuelta (la primera pidió poder partir de cualquier campo de la lista; hecho). Solo falta mirar a mano con Personal (el disco de prueba no trae sus columnas). Fallan igual en `main`: `campos.mjs`, `nuevo-asunto-categoria-guia`, `nuevo-asunto-persona-primero` |
| 530 | `docs/530-DATOS-EN-EL-ASUNTO.md` (tema 518): cada tarea pide lo que falta y se guarda en el asunto, también en correo y Séneca; «Pedirlo antes»; tarea «Pedir datos». Necesita la 528 HECHA. Pantalla: `docs/pantallas/518.html` | HECHA (5-nov-2026 22:10) · Código en `main` (PR 312, merge d4df6a9), publicado con `create_deployment`; `asuntos.fmargon.com` sirve los ficheros nuevos y carga sin errores. Revisor: aprobado en segunda vuelta (pidió repintar las demás listas tras guardar y desplegables en «Faltan datos»; hecho). Sin ver: un Word real [SOLO FRANCISCO], Séneca en pantalla y la tarea «Pedir datos» creada entera desde el editor de guías. Decisión: un dato que no es de ningún campo crea un campo propio de texto. Fallan igual en `main`: `hacer-este-hito`, `campos`, `contadores-de-inicio`, `tutores-legales`, `tablon-no-se-borra`, `nuevo-asunto-categoria-guia`, `nuevo-asunto-persona-primero` |
| 531 | `docs/531-TAREAS-E-HITOS-COMUNES.md` (tema 518): listas comunes de tareas e hitos, compartidas por las guías, y propuesta para pasar las guías actuales. Necesita la 530 HECHA. Pantalla: `docs/pantallas/518.html` | HECHA (5-nov-2026 23:10) · Código en `main` (PR 313, merge bcd1064), publicado con `create_deployment`; `asuntos.fmargon.com` sirve los ficheros nuevos y carga sin errores. Revisor: aprobado (un fallo menor, corregido). Las guías de hoy siguen funcionando igual hasta la fila 532. Quedan cinco decisiones para Francisco (idea de paso de Francisco, abajo) |
| 539 | `docs/539-CREAR-SOLO-ESTE-ASUNTO.md` (de la idea 538, punto e): una tarea o un hito creado con «Solo este asunto» no entra en la lista común. Tarea pequeña, sin pantalla. | HECHA (6-nov-2026 02:53) · Código en `main` (PR 314, merge 6772948), publicado con `create_deployment` (`dpl_HLP57usZMvH81LnHYNm47saFCjbc`, READY) y comprobado en asuntos.fmargon.com. Segundo revisor: coincide en todo. Pruebas: las de comunes en verde; `npm test` completo no arranca en este entorno (undici) y 4 pruebas de guías (cambiar-tipo-y-guia, editor-de-la-guia-tareas, nuevo-asunto-categoria-guia, hacer-este-hito) fallan igual en `main` sin el cambio. |
| 525 | `docs/525-GRUPO-DESDE-LA-UNIDAD.md` (aviso de Diego, diseñado con Francisco el 5-nov-2026): el campo Grupo de plantillas de correo y documentos toma la unidad del alumno cuando el asunto no trae grupo. Tarea pequeña, sin pantalla. La última de la cola, por decisión de Francisco. | HECHA (6-nov-2026 03:04) · Código en `main` (PR 315, merge 9afef4b), publicado y comprobado (asuntos.fmargon.com sirve el cambio) |
| 533 | Tema: Listados de alumnado para firmar. Junta la idea 527: sacar una relación de alumnado por unidad, por ejemplo desde 3º de ESO, con columnas para marcar y firmar, como la de «Voy a la huelga sí/no». Hoy el filtro del alumnado exporta la lista a Excel o PDF, pero sin esas columnas. [orden: 8 · documento con tabla, va seguido del 395] | DECIDIDA (5-nov-2026) · tema |
| 537 | Tropiezo (de la fila 528): `npm test` se caía al arrancar con el fallo de `undici` aunque no quedaban servidores viejos, y las herramientas de Vercel daban timeout a los 60 s, así que no se pudo ni pasar la tanda completa ni publicar. Habría ayudado que el ejecutor use `curl` o `http` en vez de `fetch` para esperar al servidor, y poder publicar por otro camino cuando la herramienta de Vercel no responde. | EN TEMA 541 (6-nov-2026) · tropiezo |
| 538 | Paso de Francisco (de la fila 531, `docs/531-TAREAS-E-HITOS-COMUNES.md`, sección «Revisión y respuestas»): decidir con Claude cinco cosas que salieron al programar las listas comunes de tareas e hitos: (a) las tareas libres de las guías y «+ Traer un hito de otro tipo» siguen hasta la fila 532, y en el asunto sigue la caja «Nueva tarea…» junto a «+ Añadir tarea» (el diseño solo tiene la segunda); (b) «Cambiar la tarea» está dentro del ⋮ y no como botón visible; (c) las listas comunes están vacías hasta pasar las guías (fila 532); (d) añadir un hito a la guía con «Este asunto y los siguientes» llega también a los otros asuntos abiertos del mismo tipo; (e) crear una tarea «solo este asunto» también la deja en la lista común. Además, mirar a mano con el Dropbox del centro: crear una plantilla nueva desde la ventana y «Cambiar la tarea» con asuntos abiertos de varios tipos (ver `docs/COMPROBAR-A-MANO.md`). | HECHA (6-nov-2026 02:21) · decidido con Francisco: (a) la caja «Nueva tarea…» del asunto se quita en la fila 532, con las tareas libres y «Traer un hito»; (b) «Cambiar la tarea» se queda en el ⋮; (c) nada que decidir, lo resuelve la 532; (d) un hito añadido a la guía llega a los asuntos abiertos, como siempre; (e) lo creado «solo este asunto» no entrará en la lista común (fila 539). Lo de mirar a mano sigue en `docs/COMPROBAR-A-MANO.md`, línea 531. |
| 543 | `docs/543-TIPOS-Y-SU-USO.md` (tema 540, diseñado con Francisco el 6-nov-2026): herramienta temporal en Herramientas para ver cada tipo con su uso y su guía, desactivar varios a la vez y enviar a Claude las guías activas. Pantalla: `docs/pantallas/540.html` | HECHA (6-nov-2026 04:45) · publicada y comprobada (commit cd75444). 3 vueltas del segundo revisor en `docs/543-TIPOS-Y-SU-USO.md`; pendiente solo el envío real al buzón (`docs/COMPROBAR-A-MANO.md`). 19 pruebas fallan igual en `main` (entorno) |
| 546 | `docs/546-USO-CON-EL-ARCHIVO.md` (de la idea 544): «Tipos y su uso» cuenta también los asuntos del ARCHIVO; hoy marca como sin usar tipos que sí se han usado. Tarea pequeña, sin pantalla. Necesaria antes de seguir con la 544. | HECHA (6-nov-2026 05:32) |
| 544 | Paso de Francisco y Claude (tema 540): con la fila 543 HECHA, Francisco decide qué tipos se desactivan y pulsa enviar. Claude lee las guías activas, y con él limpia lo que no es de Administración y une las tareas iguales o parecidas, por grupos. Sale un plan escrito para la fila 545. No es trabajo de Claude Code. Claude cierra la fila «Aviso de usuario» que crea el envío. | HECHA (6-nov-2026 09:41) · plan escrito en `docs/544-PLAN-GUIAS.md`, decidido con Francisco guía a guía. Desactivados los tipos sin usar y tres más (Medida disciplinaria…, Apertura de expediente de Bachillerato y de ESO): 88 en total. Guías enviadas: fila 547. |
| 541 | Tema: Que las pruebas arranquen. Junta las ideas 537 (solo la parte de las pruebas) y 542: que `npm test` no se caiga al arrancar con el fallo de `undici`, sin depender del remedio a mano de `docs/LECCIONES.md`, y aclarar si las pruebas de guías que fallan también en `main` (cambiar-tipo-y-guia, editor-de-la-guia-tareas, nuevo-asunto-categoria-guia, hacer-este-hito) son del entorno o de la app, para dejar la pasada completa funcionando. La parte de Vercel se queda fuera porque no ha vuelto a pasar. Nota (6-nov-2026): la idea 542 se suma al tema en la reflexión de hoy. [orden: 15 · no cambia nada de lo que se ve en la app] | DECIDIDA (6-nov-2026) · tema |
| 542 | Tropiezo (de la fila 539): cuatro pruebas de guías (cambiar-tipo-y-guia, editor-de-la-guia-tareas, nuevo-asunto-categoria-guia, hacer-este-hito) fallan también en `main` sin cambios, y `npm test` completo se cae al arrancar con el fallo de undici incluso con servidores limpios. Haría falta revisar si son del entorno o de la app y dejar la pasada completa funcionando (parte de la fila 541). | EN TEMA 541 (6-nov-2026) · tropiezo |
| 547 | Aviso de usuario: mejora en «Herramientas» | HECHA (6-nov-2026): no es un aviso de usuario; son las 62 guías activas que Francisco envió desde «Tipos y su uso» para la fila 544. Leídas y usadas en `docs/544-PLAN-GUIAS.md` · aviso completo: https://drive.google.com/file/d/15E843L6NXJLzIgUYPfQKi-o8QQnXiBAT/view?usp=drivesdk |
| 549 | `docs/549-HORA-DE-LA-VERSION.md` (de la idea 544, 6-nov-2026): la hora de la versión la pone un programa con el reloj de España, nunca a mano; una prueba frena una hora por delante de la real. La fila 546 dejó «12:30» cuando eran las 05:24. Tarea pequeña, sin pantalla. | HECHA (6-nov-2026 10:06) · publicada en asuntos.fmargon.com (versión 06-nov-2026 · 10:04, no por delante de la real). `npm test` se cae en el entorno con un error del ejecutor (también en main); pruebas sueltas en verde. |
| 551 | `docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md` (tema 550, diseñado con Francisco el 6-nov-2026): botón «Aplicar el plan de las guías» en Herramientas, que aplica `docs/544-PLAN-GUIAS.md` con copia antes; une explicaciones, deja separadas las de plantilla distinta, pasa también las tareas de las preguntas y la guía de un tipo que se active; al aplicarlo desaparecen las tareas libres, «+ Traer un hito de otro tipo», la caja «Nueva tarea…», «Tipos y su uso», la propuesta y «Cargar la biblioteca del centro». Sin pantalla. [orden: 1 · lo esperan los temas 519 y 520] | HECHA (6-nov-2026 11:03) · publicada y comprobada (commit f4683a3 en `main`, despliegue READY en asuntos.fmargon.com). Segundo revisor: APRUEBO. Falta que Francisco pulse el botón en el instituto (idea 554). Fallan igual en `main` limpio: `cambiar-tipo-y-guia`, `editor-de-la-guia-tareas`, `hacer-este-hito`, `nuevo-asunto-categoria-guia`. |
| 552 | `docs/552-COPIAR-A-OTRA-CARPETA.md` (tema 550): tarea «Copiar a otra carpeta» que copia sola el documento registrado a una carpeta de fuera del asunto, con nombre hecho de campos; aviso y «Dar permiso» si el ordenador no tiene permiso; nunca pisa un fichero. Necesita la 551 HECHA. Pantalla: `docs/pantallas/550.html` [orden: 2 · sustituye a la tarea a mano que deja la 551] | PENDIENTE (6-nov-2026) |
| 553 | Aviso de usuario: error en «Ficha de un asunto» | IDEA (6-nov-2026): enviada por un usuario desde el botón de soporte · aviso completo: https://drive.google.com/file/d/1p71tyny-flAiSHedsN0-0HSjqHVP-FTd/view?usp=drivesdk |
| 554 | Paso de Francisco (de la fila 551): en el instituto, con el Dropbox del centro, entra en https://asuntos.fmargon.com → Herramientas → «Aplicar el plan de las guías», lee lo que dice «No encontrado» y pulsa «Aplicar el plan de las guías». Se hace con Claude en una conversación aparte. El plan está en `docs/544-PLAN-GUIAS.md` y la instrucción en `docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md`. Lo esperan los temas 519 y 520. | IDEA (6-nov-2026) · paso de Francisco |
| 555 | `docs/555-A-QUIEN-VA-CADA-CORREO.md` (tema 487, diseñado con Francisco el 6-nov-2026): en el correo de un asunto, Para, Copia y Copia oculta se rellenan escribiendo, solo con la gente ligada al asunto (interesado, tutores legales con la custodia marcada, tutor del grupo, profesores, quien lo pide, relacionados y listas del personal); la plantilla propone destinatarios por papel en los tres campos y lleva su saludo y su firma; la tarea de la guía solo elige plantilla; se quitan «Va a», la casilla libre, «Añadir un grupo», «+ Tutor/a de…» y las casillas de «Comunicar ▾». Pantalla: `docs/pantallas/487.html` [orden: 3 · ordena los correos; lo espera el tema 520] | PENDIENTE (6-nov-2026) |
