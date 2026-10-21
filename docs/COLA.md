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
| 335 | `docs/COMPROBAR-CENTRO-DE-DATOS-Y-VELOCIDAD.md` (idea 335 de Francisco, diseñada con él el 12-oct-2026: **no antes del 18-oct-2026**; revisión única, sin cambiar la app ni publicar: informe corto `docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md` que dice si el Gestor coge todo lo que ofrece el Centro de datos y si los cambios de velocidad siguen puestos y funcionan, con una semana de medidas de la fila 332; lo que falle se apunta como IDEA) HECHA (18-oct-2026 03:06). Informe: `docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md`. Centro de datos: sí (lo que no coge está en el informe, apartado 1.3). Velocidad: los 7 cambios siguen puestos en `main` y publicados (web con la versión 16-oct-2026 23:17, ficheros idénticos); sin cifras de la semana porque el buzón las guarda en Drive y la sesión no llega (idea 359). Sin cambios de código ni publicación. Pruebas de lo tocado: todas bien salvo `centro-de-datos.mjs`, que falla también a solas y sin tocar nada, por el entorno (idea 358). «Cómo sabemos que está bien»: 1 y 2 comprobadas (informe con las dos líneas y sus tablas); 3 no comprobable del todo: sin cifras de siete días, y el informe dice por qué; 4 comprobada (cada fallo es una IDEA y no hay cambios en `js/`). |
| 353 | `docs/INICIO-MAS-COMPACTO.md` (aviso del botón de soporte de Francisco, diseñado con él el 16 y el 18-oct-2026: en Inicio se quita el título; «Ha llegado» y los avisos suben a la fila de la cabecera y se esconden al bajar por la lista; el cuadro de avisos y el tablón se pliegan en una línea y se recuerda en cada ordenador; el tablón sale abierto si hay nota para hoy) · aviso completo: https://drive.google.com/file/d/1R_zF67tcKTP54vciIB3ku6UHAxgbWGOu/view?usp=drivesdk  · Nota (18-oct-2026): hecha, revisor APROBADA al segundo intento (el primero vio la cabecera pegada tapada por la franja de la copia de pruebas; arreglado: `top` respeta `--franja-demo-alto`). Publicada (`dpl_7FHpXKnLaZMCCq9Q4gknjxxrLPNB`, commit 077b669 en `main`, la web sirve `js/inicio-plegados.js` y la versión 18-oct-2026 · 12:14). «Cómo sabré que está bien» 1-5 comprobadas por el revisor en la demo a 1920, 1366 y 900 px, y por `pruebas/inicio-compacto.mjs`. No comprobado: la regla de apertura del tablón «al arrancar» (la demo rehace los datos al recargar); sí «al pulsar Inicio». Pruebas de otras filas que parten de avisos/tablón abiertos ahora lo fijan en su arranque (`gestor.inicio.plegados`). En la pasada completa fallaron además, ya retiradas de antes: tras-cada-accion, conflictos-que-cambia, actividades-aviso, centro-de-datos, campos, opciones. | HECHA (18-oct-2026 12:15) |
| 367 | `docs/INICIO-ORDENAR-POR-COLUMNA.md` (segunda mejora del aviso de la fila 353, diseñada con Francisco el 16 y el 18-oct-2026: en Inicio, pulsar el título de una columna ordena por ella y otra vez al revés, con flecha; en todas las pestañas, también «Por liquidar»; en «Dormidos», «Plazo» ordena por días sin novedades; cada pestaña vuelve a su orden de siempre al cambiar de pestaña o pulsar «Inicio» en el menú; desaparece el desplegable «Ordenar») | HECHA (18-oct-2026 15:55) · publicada y comprobada (commit 6a9f30f, Vercel READY; js/inicio-ordenar.js sirve 200). Las 4 de «Cómo sabré que está bien» las pasó el revisor (2.º intento; el 1.º pidió que pulsar la pestaña activa también quite el orden). Pasada completa: 297/298; ha-llegado-sustituye-la-vista falla igual en main y va a RETIRADAS. CONTEXTO-CORTO pasa de 40 KB desde antes de esta fila. |
| 355 | Centro de datos: el teléfono del centro y el correo común del centro (`configuracion.json`) se leen y se apuntan, pero ninguna pantalla ni plantilla los usa; sale del informe de la fila 335 [toca a: centro-de-datos-ies] | SUSTITUIDA (19-oct-2026): diseñada en el tema 362 |
| 356 | Centro de datos: los libros de texto (4 listados ya hechos) no los coge el Gestor; el contrato dice «más adelante»; sale del informe de la fila 335 [toca a: centro-de-datos-ies] | EN TEMA 363 (18-oct-2026) |
| 357 | Centro de datos: la tutoría ya hecha (grupo y tutor/a de hoy) no la coge el Gestor, que lee el PDF por su cuenta; hay dos maneras de saber lo mismo; sale del informe de la fila 335 [toca a: centro-de-datos-ies] | SUSTITUIDA (19-oct-2026): diseñada en el tema 362 |
| 358 | `pruebas/centro-de-datos.mjs`, comprobación «con un guardado en marcha, espera y luego lo toma», falla en un entorno de sesión (otra tarea de fondo consume las dos primeras preguntas de `hayGuardado`); debería esperar a una condición y no contar llamadas; sale del informe de la fila 335 | EN TEMA 365 (18-oct-2026) |
| 359 | Paso de Francisco (de la fila 335): hacen falta las cifras de la semana del Gestor (fila 332). El buzón las guarda en el Drive del centro, en `SOPORTE-AVISOS/_MEDIDAS` (https://drive.google.com/drive/search?q=_MEDIDAS), donde las sesiones de Claude Code no entran: ábrelas en una conversación de Claude con Drive conectado y pídele que diga si hay algo lento; si no están, el Gestor las muestra en Herramientas → Puesta a punto → «Medidas», en el ordenador del centro. Instrucciones del buzón: `docs/06-RECIBIR-MEDIDAS.md` de `fmargon780/soporte-apps` | HECHA (18-oct-2026 03:40): no hizo falta Francisco; una conversación de Claude con Drive leyó las cifras del 13 al 16-oct. Lo de cada día va rápido; lo lento es archivar, y hay 3 guardados «sin remedio» de `asuntos.json`. Informe: `docs/INFORME-359-MEDIDAS-DE-LA-SEMANA.md`. Salen las IDEA 360 y 361. |
| 360 | Archivar un asunto tarda de 3 a 11 s de media y hasta un minuto (`asunto.archivar`, 13-16 oct); ver por qué y acortarlo; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 361 | Tres guardados «sin remedio» de `asuntos.json` (13 y 15-oct, ordenador `8fq896`) y más de 100 reintentos al día: saber si se perdió algo y por qué fallan; sale del informe de la fila 359 | EN TEMA 364 (18-oct-2026) |
| 362 | Tema: usar todo lo que da el Centro de datos. Junta las ideas 355 y 357: que el Gestor aproveche lo que el Centro de datos ya entrega y hoy no usa (teléfono y correo común del centro; grupo y tutor/a de hoy) y deje de leer por su cuenta lo que ya le llega hecho, para que cada dato venga de un solo sitio. Ojo con la fila 348 (botón «+ Tutor/a» del correo), que usa el dato del tutor. [toca a: centro-de-datos-ies] | SUSTITUIDA (19-oct-2026): diseñado en las filas 375 y 376 |
| 363 | Tema: libros de texto, documento de entrega por alumno. Junta la idea 356: que el Gestor coja los listados de libros de texto del Centro de datos y genere, para cada alumno, el documento del centro con los libros que recibe a principio de curso o adquiere con el cheque libro y que debe devolver. El control de entrega y devolución va aparte (idea 366). Nota (21-oct-2026): diseñarlo encima del tema 393 (documentos para varias personas y envío de una vez); la entrega de libros sería su primer uso. [toca a: centro-de-datos-ies] | DECIDIDA (18-oct-2026) · tema |
| 364 | Tema: guardar sin perder nada y archivar más rápido. Junta las ideas 360 y 361: saber si los tres guardados fallidos de `asuntos.json` perdieron algo y por qué hay tantos reintentos, y acortar lo que tarda archivar un asunto. Primero la 361, que es la más seria. | EN DISEÑO (19-oct-2026) · tema |
| 365 | Tema: arreglar una prueba interna. Junta la idea 358: que la prueba `pruebas/centro-de-datos.mjs` no falle sin motivo real. No cambia nada en pantalla. | DECIDIDA (18-oct-2026) · tema |
| 366 | Control de entrega, devolución y estado de los libros de texto, para ayudar a la secretaria; quizá app propia; sale de la reflexión del 18-oct-2026 (tema 363) | IDEA (18-oct-2026) |
| 368 | `docs/INICIO-COLOCACION-Y-COLUMNAS.md` (aviso del botón de soporte de Francisco, diseñado con él el 19-oct-2026: en Inicio, «Actualizar», «Filtros» y «Exportar» suben al renglón de las pestañas y todo lo de un renglón queda a la misma altura; el cuadro de avisos se abre flotando, sin mover la lista; cada persona ordena las columnas arrastrando su título, un solo orden para todas las pestañas, guardado por persona en `_GESTOR`; «Restablecer columnas» en el cuadro de Filtros) · aviso completo: https://drive.google.com/file/d/16HZgbiZcBoVQz21ZdIDDXXEEnEB689G6/view?usp=drivesdk | HECHA (19-oct-2026 11:27): revisor APROBADA a la primera (puntos 1-5 y a-c bien; el [SOLO FRANCISCO] queda NO COMPROBADO y está en `docs/COMPROBAR-A-MANO.md`); en `main` (fusión 91104f6, PR 272), publicada a propósito (`create_deployment`) y la web sirve `App.VERSION` 19-oct-2026 · 11:26 con `js/inicio-columnas.js` (200). Pasada completa 298 de 298 (las 9 retiradas siguen igual). Decisiones: el cuadro de avisos abierto se pliega también al pulsar un aviso que filtra, no al pulsar dentro de un cuadro de diálogo (`.capa`); el orden se guarda en `_GESTOR/preferencias/<nombre>.json`; en «solo consultar», en `localStorage`. Las pruebas parten ahora con el cuadro de avisos plegado y las que miran sus trozos lo abren antes; `titulos-de-la-tabla-fijos` e `inicio-compacto` miden `.inicio-tabla-cabecera` (pestañas y botones, un solo renglón fijo). A 1366 px caben en un renglón porque pestañas y botones son algo más pequeños (34 px). |
| 369 | Propuesta de mejora (botón de soporte) en «Inicio»: poner fecha y hora de vencimiento a una nota del tablón y que la app avise en ese momento (correo, ventana o sonido); ejemplo: reunión de tutores de 1º ESO a las 9:30 para darles los carnés · aviso completo: https://drive.google.com/file/d/1g-Ce_G5QH3sBhGWeglxV8hbc9B-RXd4N/view?usp=drivesdk | SUSTITUIDA (19-oct-2026): diseñada en el tema 370 |
| 370 | Tema: avisos a hora fija en el tablón. Junta la idea 369: poder poner fecha y hora de vencimiento a una nota del tablón de Inicio, y que la app avise en ese momento (correo, ventana o sonido), para que no se pase una cita. Ojo con la fila 353 (el tablón sale abierto si hay nota para hoy). | SUSTITUIDA (19-oct-2026): diseñada como fila 372 |
| 371 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 393 (21-oct-2026) |
| 373 | `docs/LISTA-CON-CASILLAS-SIN-TOPE.md` (aviso del botón de soporte, diseñado con Francisco el 19-oct-2026: la lista de personas con casilla —Etiquetas, repartos, «Añadir varios relacionados», exportar— enseña todos los nombres, sin cortar en 200 ni «…y N más»; el recuadro se hace alto, unos 30 nombres a la vista, y la lista baja dentro de él) · aviso completo: https://drive.google.com/file/d/1UVUGD3oQdxLRITF9kxpJZFzVDEUBk6xD/view?usp=drivesdk **Nota:** revisor APROBADA a la 2.ª (1.ª RECHAZADA por el alto del recuadro, arreglado). Comprobado: 1-3 con la demo (21 personas) y con lista simulada de 300; 4 solo con lista simulada (la demo no llega a 200 en ningún filtro); 5 medido a 1920 y 1366 (fuera de Etiquetas ~30 nombres a 1080; en Etiquetas 24, para que quepa en el panel). Pintar 1.000 personas: ~7 ms (solo la lista; las hojas no se midieron con 1.000). Pruebas: `responsable-organismo.mjs` falló una vez en la pasada completa con la máquina cargada y pasó 2 veces a solas y en `main`. Publicado: web sirve `App.VERSION` 19-oct-2026 · 14:56. | HECHA (19-oct-2026 14:57) |
| 372 | `docs/TABLON-AVISO-A-HORA-FIJA.md` (tema 370, idea 369; diseñado con Francisco el 19-oct-2026: las notas del tablón pueden llevar día, hora y antelación —15 minutos por defecto—; a la hora del aviso sale una ventana con sonido, con «Entendido» y «Recordar en 10 minutos», a quien ve la nota; si la app estaba cerrada, sale al abrirla con «era a las …»; pasada la hora, la nota queda en gris con «pasada» y ya no abre el tablón) | HECHA (19-oct-2026 16:47) Nota: publicada (deployment dpl_95v6QRVrpRSJxd92kp4ed6widkHE READY, main 10b93a6, asuntos.fmargon.com sirve js/tablon-avisos.js). Revisor: 1.ª RECHAZADA (marca «Hoy» ilegible, texto azul sobre fondo azul), arreglado; 2.ª APROBADA. Comprobadas las 5 de «Cómo sabré» (la de «no avisa a otra persona» solo con una sesión: cubierta por pruebas/tablon-avisos.mjs). Sonido: NO COMPROBADO, en docs/COMPROBAR-A-MANO.md. La copia de pruebas solo avisa con `&avisos=1`. En la pasada completa fallaron aspirantes-numero e indice-del-expediente por carga (pasan a solas, ajenas a la fila). |
| 374 | `docs/HUECOS-EN-CUALQUIER-HOJA.md` (aviso del botón de soporte, diseñado con Francisco el 19-oct-2026: en Etiquetas los huecos se marcan en cualquier hoja, pulsando o arrastrando un rectángulo —fila, columna o área—; «Hoja nueva» pasa a «Quitar todos los huecos»; una hoja toda rayada sale en blanco en el PDF) · aviso completo: https://drive.google.com/file/d/1zcPxZ1POh_6KEqx6rC1WzqYRClZZbVsp/view?usp=drivesdk | HECHA (19-oct-2026 23:04) Nota: publicada (deployment dpl_EeLQFgmNQFcEoXuSZwuwbcK7fCQX READY, main f7f8131, asuntos.fmargon.com sirve App.VERSION 19-oct-2026 · 23:03 y el nuevo etiquetas-hoja.js). Revisor: 1.ª APROBADA. Comprobadas las 5 de «Cómo sabré» (pulsar en hoja 2, fila entera, 2×2 en hoja 3, liberar desde rayada, «Quitar todos los huecos»), más resaltado, sin selección de texto, ayuda y Guardar PDF. Arrastre con dedo (toque largo 400 ms): NO COMPROBADO, solo con ratón; cubierto por lógica común. Pasada completa en verde. |
| 375 | `docs/TELEFONO-Y-CORREO-DEL-CENTRO.md` (tema 362, idea 355, diseñado con Francisco el 18 y 19-oct-2026: huecos «teléfono del centro» y «correo del centro» en plantillas de Word y de correo, en blanco y sin preguntar si faltan; pie común con teléfono y correo en los Word que llevan membrete; ejemplo: Certificado de función tutorial de Virginia Ruiz Martín) | HECHA (20-oct-2026 10:26) · Nota: dos huecos nuevos («teléfono del centro» y «correo del centro», en blanco y sin preguntar) y pie común con ambos datos en todo Word con `{{MEMBRETE}}` (`js/docx-pie.js`). Publicada (deployment READY, `docx-pie.js` servido) y commit en `main`. Cómo sabremos que está bien: 1 BIEN (revisor: certificado con membrete, pie «Teléfono 958000000 · Correo secretaria@centro-demo.es»); 2 NO COMPROBADO en pantalla (en la copia de pruebas solo una plantilla lleva membrete; cubierto por `pruebas/pie-del-centro.mjs`); 3 BIEN (las 5 plantillas sin membrete, sin pie); 4 BIEN (huecos insertados y correo preparado relleno); 5 comprobado en `pruebas/pie-del-centro.mjs` (solo correo / solo teléfono). El revisor rechazó la 1.ª vez (la copia de pruebas no traía los datos del centro: arreglado en `js/demo/datos.js`) y aprobó la 2.ª. Pasada completa de `npm test` en verde (`centro-de-datos.mjs` ya estaba en RETIRADAS). |
| 376 | `docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md` (tema 362, idea 357, diseñado con Francisco el 18 y 19-oct-2026: el tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor deja de leer el PDF; fuera la subida a mano en «Tablas de datos»; ejemplo: Virginia Ruiz Martín) [toca a: centro-de-datos-ies] | DEVUELTA (20-oct-2026) · Nota (20-oct-2026, decisión de Francisco): **ya no espera a la idea 53 del Centro de datos; no se aplica el apartado «Cuándo se puede hacer» del documento.** La 53 quedó SUSTITUIDA (no HECHA) y su estudio (fila 57 del Centro de datos) vio que la diferencia era solo «el día de hoy». Las tutorías que usa el Gestor son las de la aplicación de hoy del Centro de datos, y están bien: `tutorias-lectura` y `tutorias-hoy` en `bien` en `comprobaciones/ultima.json` del 20-oct-2026 (CD v52, 20 cursos, 30 grupos con tutor hoy). Lo que sigue en `mal` (`ensayo-tutorias-igual`) es de la página nueva de pruebas, que el Gestor no usa. El resto de la instrucción no cambia, también el punto 5: si PDF y fichas no salen iguales, BLOQUEADA sin publicar. **Informe de la sesión (20-oct-2026):** código hecho y en la rama `claude/gestor-asuntos-fila-376-03s5kh` (no está en `main`, no se ha publicado). `npm test` completo en verde. El revisor rechazó dos veces. 1.ª: el aviso de un grupo sin tutor (1º C) no decía «Las tutorías se suben al Centro de datos» (arreglado en la rama). 2.ª, único MAL: el plegable «Datos de las tablas» no aparece en la ficha de Otero Campos, Marta en Personas y empresas; ese plegable (`TablasDatosPantalla.pintarEnFicha`) existe desde la fila 110 y la sesión dudó de que se pinte en esa pantalla, así que el punto de la lista pudo estar mal escrito. Los demás puntos (tutor en el correo de 4º A, 2º B y 1º C; tabla de dos cursos «vienen del Centro de datos»; sin subida de PDF) salieron BIEN y la consola limpia. Al retomar: comprobar dónde sale ese plegable y reescribir ese punto (ficha del tercero desde un asunto). El certificado de dos cursos y la comparación PDF/fichas están cubiertos por `pruebas/tutor-desde-el-centro-de-datos.mjs`. Punto SOLO FRANCISCO (PDF suelto de un curso que falta): NO COMPROBADO. `centro-de-datos.mjs` falla igual en `main` (ya en RETIRADAS). |
| 377 | Aviso de usuario: mejora en «Herramientas» | EN TEMA 389 (21-oct-2026) |
| 378 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 390 (21-oct-2026) |
| 379 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 391 (21-oct-2026) |
| 380 | Aviso de usuario: mejora en «Ajustes» | EN TEMA 390 (21-oct-2026) |
| 381 | Aviso de usuario: mejora en «Inicio» | EN TEMA 394 (21-oct-2026) |
| 382 | `docs/BOTONES-DE-COPIAR-AL-BAJAR.md` (aviso del botón de soporte, diseñado con Francisco el 20-oct-2026: en la ficha del asunto, al bajar por una lista larga, los botones de copiar —Asunto, Ruta, NIE, Nombre, DNI— siguen a la vista en el renglón de la barra de acciones; solo se esconde la línea gris; si no caben, bajan juntos a una línea debajo; solo la ficha del asunto; ejemplo: A26-0432 Elec. Consejo Escolar) · aviso completo: https://drive.google.com/file/d/1h4ZM6kobzH4i0pfiI_VpHKEp7bW46MEH/view?usp=drivesdk | HECHA (20-oct-2026 23:23) · Nota: cabecera encogida deja la fila de copiar a la vista (solo se esconde la línea gris); `ResizeObserver` en `js/cabecera-fija.js` vuelve a medir. Prueba nueva `pruebas/botones-de-copiar-al-bajar.mjs`. `npm test` completo: 300 de 302 bien; `carpetas-perdidas` y `responsable-organismo` fallaron en la tanda y pasan a solas (esta última también falló una vez bajo carga; pasa con y sin el cambio). Revisor: APROBADA a la primera. Comprobados los 5 puntos de «Cómo sabré» (a 1920 y 1366, visor real y simulado, sin temblor, consola limpia). Publicado en Vercel (dpl_x3D9dm5hFWus5MUPAnKUmvE5pRf2, commit 4068643) y comprobado en asuntos.fmargon.com y gestor-de-asuntos.vercel.app. Detalle del revisor: «Unidad: 4º A» junto al título se recorta al bajar (no es la línea gris; no tocado). |
| 383 | Cuando creamos un asunto desde un documento que está en la bandeja de documentos Por Clasificar, el sistema nos lleva directamente al asunto creado? Si la respuesta es negativa, hay que modificar el comportamiento y hacer que nos dirija, o al menos que nos lo ofrezca de forma predeterminada y visible. | DESCARTADA (21-oct-2026): ya funciona así; al crear el asunto desde Por clasificar, la app lleva a él y abre el cuadro de ponerle nombre al documento. |
| 384 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 392 (21-oct-2026) |
| 385 | `docs/CREAR-DESDE-POR-CLASIFICAR-CON-TIPO.md` (aviso del botón de soporte de Diego Herrera, diseñado con Francisco el 21-oct-2026: «Crear asunto con él» en Por clasificar no crea nunca un asunto sin tipo; si el tipo y la persona adivinados no encajan, abre Nuevo asunto con la persona como sugerencia; ejemplo: candidaturas al Consejo Escolar) · aviso completo: https://drive.google.com/file/d/1jP5_vPA0mibX-IgfbhK9pGbvoZLgO3Fn/view?usp=drivesdk | HECHA (21-oct-2026 05:43) · Nota: código en `main` (PR 276) y publicado (Vercel READY, asuntos.fmargon.com sirve `App.VERSION` 21-oct-2026 · 05:42 con el código nuevo). `npm test` completo: 302 de 303 bien; falló `exportar-asuntos.mjs` (fechas Desde/Hasta) solo en la tanda en paralelo; a solas pasa dos veces y en `main` también, ajena a la fila. Prueba nueva `pruebas/crear-asunto-tipo-no-encaja.mjs` (falla sin el arreglo, pasa con él). Revisor: APROBADA a la primera; puntos 1-5 y a-c BIEN (el caso «misma categoría» lo vio con aviso de duplicado y «Crear otro de todas formas», no hay en la demo una persona sin asunto de ese tipo). Nada [SOLO FRANCISCO]. Nota: al arrancar se dejó la 376 DEVUELTA sin tocar porque el lanzamiento pedía expresamente la 385. |
| 386 | `docs/AVISO-PERSONA-EN-OTRA-LISTA.md` (aviso del botón de soporte de Diego Herrera, diseñado con Francisco el 21-oct-2026: en Nuevo asunto, si la persona buscada no está en la lista del tipo elegido pero sí en la otra —Alumnado o Personal—, sale un aviso con «Es esa persona: elegir otro tipo» y «Es otra persona»; también al darla de alta a mano; el correo no se toca; ejemplo: María Díaz Torres, profesora, con un tipo de alumnado) · aviso completo: https://drive.google.com/file/d/1KqvA6l5fleeh98jtyBrFCzsS3xVBZ1tQ/view?usp=drivesdk | EN CURSO (21-oct-2026) |
| 387 | En la Herramienta Etiquetas sería bueno que el sistema recordara la última elección de modelo y diseño y que esa elección esté visible en unas tarjetas en la parte superior de la vista, justo encima de la simulación de la hoja. | EN TEMA 389 (21-oct-2026) |
| 388 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 395 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1P_ls-gktufMCnwJ-YDoU4S9p97-8voX_/view?usp=drivesdk |
| 389 | Tema: Etiquetas que recuerda tu trabajo. Junta las ideas 377 y 387: que la herramienta Etiquetas recuerde el último modelo y diseño elegidos y los enseñe en tarjetas encima de la hoja; poder guardar una tarea a medias (lo elegido para incluir) y retomarla; y poder decidir el orden en que salen las etiquetas. Ojo con las filas 373 y 374, que ya tocaron esta pantalla. | DECIDIDA (21-oct-2026) · tema |
| 390 | Tema: datos de los documentos, elegirlos de las listas y verlos en la ficha. Junta las ideas 378 y 380: que los campos de un tipo de documento puedan ir unidos a las listas de la app (alumnado, personal, familias…) y se elijan buscando, no escritos a mano; y que la lista de documentos de la ficha del asunto enseñe esos datos anotados de cada documento, no solo el tipo, el nombre y el registro. Ejemplo: Presentación de Candidaturas con el nombre del candidato. | DECIDIDA (21-oct-2026) · tema |
| 391 | Tema: copiar la ruta de un documento. Junta la idea 379: un botón en cada documento de la ficha del asunto que copia su ruta completa, igual que hoy se copia la de la carpeta, para ir directo a él al adjuntarlo en Séneca. Ojo con la fila 382 (botones de copiar de la ficha). | DECIDIDA (21-oct-2026) · tema |
| 392 | Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los documentos que se ponen a la firma. | DECIDIDA (21-oct-2026) · tema |
| 393 | Tema: documentos para varias personas y envío de una vez. Junta la idea 371: que un tipo de asunto pueda generar un mismo documento para varias personas a la vez y después enviárselo a cada una por correo de una sola vez. El tema 363 (documento de entrega de libros por alumno) se diseñará encima de este. | DECIDIDA (21-oct-2026) · tema |
| 394 | Tema: «Es lo que se esperaba» sin marcar por defecto. Junta la idea 381: al guardar un documento, la casilla «Es lo que se esperaba. Termina la espera de…» sale marcada; tiene que salir sin marcar, para no dar por terminada una espera sin querer. | DECIDIDA (21-oct-2026) · tema |
| 395 | Tema: plantillas que copian la forma del original. Junta la idea 388: que «Convertir en plantilla» monte también las tablas y los cuadros del documento original, para que la plantilla salga igual que él y no solo con su texto. | DECIDIDA (21-oct-2026) · tema |
| 396 | Aviso de usuario: mejora en «Ficha de un asunto» | EN TEMA 397 (21-oct-2026) · aviso completo: https://drive.google.com/file/d/1bdzbX2dyJZCAOp3nZaDhP0Cy3z8cfhsH/view?usp=drivesdk |
| 397 | Tema: ficha del asunto con Hitos y Documentos a la vez. Junta la idea 396: al entrar en un asunto, ver a la vez Hitos (a la izquierda) y Documentos de la carpeta (a la derecha), que son las dos secciones de trabajo diario; las demás quedan como consulta aparte. Aprovechar para revisar el orden de la ficha pensando en las tareas habituales. Diseñarlo junto al tema 390, que también cambia la lista de documentos de la ficha; ojo también con el 391 y la fila 382. | DECIDIDA (21-oct-2026) · tema |

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
