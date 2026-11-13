# Gestor de asuntos del IES

**Lo primero, antes de leer nada más:** pon al día las reglas comunes con esta orden, desde la raíz
del repositorio:

    curl -fsSL https://raw.githubusercontent.com/fmargon780/metodo-reglas/main/METODO-COMUN.md -o /tmp/METODO-COMUN.md && grep -q '^# Reglas comunes para Claude Code' /tmp/METODO-COMUN.md && cp /tmp/METODO-COMUN.md docs/METODO-COMUN.md

Después lee y sigue `docs/METODO-COMUN.md`: son las reglas comunes a todas las apps y mandan en todo
lo que no sea propio de esta app. Si la orden falla, sigue con la copia que ya hay y dilo en la nota
de la fila.

Lo de abajo son **solo** las reglas propias de esta app.

**Qué fila se coge** (27-sep-2026, cambiado el 1-oct-2026): la primera **DEVUELTA o PENDIENTE**,
en el orden de la cola. Si la frase de lanzamiento pide varias («las N primeras filas PENDIENTE» o
«todas»), la misma conversación las hace de una en una, cada una completa (EN CURSO, revisor,
publicación comprobada, HECHA) antes de empezar la siguiente; antes de empezar cada fila nueva mira
`docs/PARAR.md` en `main`: si dice PARAR, lo cambia a SEGUIR, lo sube y para. Detalle en `docs/REVISOR-ANTES-DE-PUBLICAR.md`.

**Trabajar en la rama de la fila; a `main` solo con el revisor** (30-sep-2026, fila 242,
`docs/REVISOR-EN-LOCAL.md`: sustituye la norma «Trabajar en `pruebas`» del 28-sep-2026; las
sesiones no entran en `pruebas.fmargon.com`, el tope de Vercel es de toda la cuenta y nivelar
`pruebas` a la fuerza perdió trabajo):

1. Cada fila trabaja en su propia rama `fila-<nº>`, creada desde `main` al empezar (o en la rama
   `claude/...` que el entorno permita). **Nunca se nivela ninguna rama a la fuerza** si tiene
   commits que no están en `main`. La rama de una fila no se borra hasta que su trabajo está en
   `main`. Las subidas que solo tocan `docs/` (EN CURSO, HECHA) van directas a
   `main`: no publican nada (Vercel ya no publica solo, ver «Vercel no publica nada solo» abajo).
2. Nada se sube a `pruebas` para revisarlo y nada espera a Vercel antes del revisor. Si git rechaza
   la subida a tu rama, vale lo de `docs/METODO-COMUN.md` 5.7 (rama `claude/...` y petición de
   cambios fusionada al momento; nunca código con las herramientas de ficheros de GitHub).
3. No esperes a GitHub Actions ni arregles sus fallos como condición para publicar. Lo que vale es
   `npm test` en tu sesión y la publicación comprobada (apartado «Cómo se publica y se comprueba aquí»). Si Actions falla
   en una prueba que en tu sesión pasa, apúntala en una línea en `docs/COLA.md` («Lo que queda por
   hablar con Francisco») y sigue.
4. Con la aprobación del revisor, la rama de la fila se fusiona en `main` (avance limpio o fusión
   normal; sin `git push`, petición de cambios fusionada al momento) y se publica a propósito, una
   sola vez (`create_deployment`, regla de abajo): es la única publicación de la fila. La rama `pruebas` ya no existe ni se nivela.

**Pruebas** (cuándo se pasa cada tanda: `docs/METODO-COMUN.md` 5.1):

1. Solo lo tocado: `npm test -- <palabra> [<palabra>…]` (el ejecutor lanza las que llevan esas
   palabras en el nombre), más las pruebas nuevas de la fila. Pasada completa: `npm test`.
   (13-nov-2026, fila 633) Las pruebas se pasan **siempre con `npm test`** (también una sola:
   `npm test -- <palabra>`), nunca con `node pruebas/<prueba>.mjs` a pelo: `npm test` comprueba
   antes los paquetes y, si falta alguno, los instala con `npm ci`.
2. Si en la pasada falla una prueba:
   - (11-oct-2026, fila 333, `docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md`) El ejecutor repite solo, una
     vez y a solas, cada prueba que falla en la tanda en paralelo. Si pasa en ese segundo intento,
     la pasada sale en verde y no hay nada que apuntar ni que apartar: **a `EN_SOLITARIO` ya no se
     añade ninguna prueba**.
   - Excepción: si la que ha necesitado segundo intento es una prueba **de tu fila** (nueva, o que
     has tocado), no vale. Arréglala para que espere a una condición y no a una pausa fija.
   - Una prueba que falla **también en el segundo intento**: si es de tu cambio, se arregla. Si
     falla igual en `main` sin tu cambio (fila 584, 10-nov-2026): **no se cierra la fila con una prueba en rojo
     «porque ya fallaba»**. Se abre la fila «Arreglar la prueba <nombre>…» delante de las demás (`docs/METODO-COMUN.md`
     5.1). Solo va a `RETIRADAS` (mismo fichero, con fecha y motivo) una prueba que destapa un **fallo real de la
     app**, y su motivo tiene que nombrar su IDEA en `docs/COLA.md` («idea N»); el ejecutor no arranca sin ella.

**Terminal de la sesión** (fila 466, 27-oct-2026): **nunca `pkill -f` ni `pgrep -f`**: buscan en la línea de órdenes de todos los
procesos, también en la de la terminal de la sesión, y la cierran. Para parar un proceso, guarda su
número (PID) al lanzarlo y usa `kill <PID>`. `npm test` elige solo un puerto libre desde el 8123, así
que pueden correr dos tandas a la vez.

**Tamaño de `docs/COLA.md` y `docs/CONTEXTO-CORTO.md`:** lo manda `docs/METODO-COMUN.md` 5.5
(se miden al marcar cada fila HECHA). Es una subida solo de `docs/`, va directa a `main` y no
publica nada.

**El revisor** (28-sep-2026, `docs/REVISOR-ANTES-DE-PUBLICAR.md`, fila 223): antes de tocar
`main`, cada tarea PENDIENTE lleva su sección «Cómo sabemos que está bien» (si una fila anterior a
la 223 no la tiene, la sesión la escribe al cogerla, a partir del propio documento). Con el cambio
hecho en la rama de la fila, la propia sesión arranca un servidor local con ese código y lanza un
agente aparte, con contexto limpio (sin ver el código ni el diff), que entra por Playwright en
`http://localhost:<puerto>/?demo=1&auto=1` y pasa esa lista, con el guion fijo de
`docs/REVISOR-GUION.md` (fila 242). Un punto
**[SOLO FRANCISCO]** no lo pasa el revisor: queda NO COMPROBADO, se copia a
`docs/COMPROBAR-A-MANO.md` y se avisa a Francisco en una línea al terminar. **APROBADA**: se
publica en `main` (apartado «Cómo se publica y se comprueba aquí») y la fila se marca HECHA. Con la APROBADA del revisor se publica en `main` sin esperar a Francisco (1-oct-2026:
`docs/VISTO-BUENO-DE-FRANCISCO.md` está ANULADO; nada pasa a esperar su revisión ni existe el estado
EN EL PAQUETE). **RECHAZADA** la primera vez:
se arregla solo lo que dice el informe, se rearranca el servidor local y se llama a un revisor nuevo
desde cero, sin contarle qué se arregló. **RECHAZADA** la segunda vez: la fila pasa a **DEVUELTA**
con el informe, `main` no se toca, y la sesión para (mensaje que empieza por «DEVUELTA:»). El
siguiente lanzamiento coge la primera DEVUELTA o PENDIENTE en el orden de la cola (Francisco decide el orden completo); DEVUELTA dos
lanzamientos seguidos pasa a BLOQUEADA. Detalle completo, y los permisos que hacen falta, en `docs/REVISOR-ANTES-DE-PUBLICAR.md`.

**Vercel no publica nada solo** (11-oct-2026, `docs/PUBLICAR-SOLO-AL-TERMINAR.md`). Ninguna subida a GitHub crea una
publicación. Una tarea que cambia la app publica **una sola vez, a propósito**, cuando su código ya está en `main`: herramienta `create_deployment` de Vercel con `teamId` `team_gnCjBLTS8m8PNTFVUf7ST0uN`, `name` y `project` `gestor-de-asuntos`, `target` `production` y `gitSource` `{ type: github, org: fmargon780, repo: gestor-asuntos-ies, ref: main }`; después `get_deployment` hasta `READY` y comprobar la dirección publicada. Las subidas de solo documentos no publican y no hay nada que comprobar. Si responde 402 no se reintenta. Nunca se vuelve a encender la publicación automática ni se añade un `ignoreCommand`: las publicaciones canceladas también cuentan en el tope de 100 al día de toda la cuenta.

## Cómo se publica y se comprueba aquí

La regla general está en `docs/METODO-COMUN.md`, apartado 6. Lo propio de esta app:

1. **HECHA** necesita las dos cosas (fila 242,
   `docs/REVISOR-EN-LOCAL.md`): (a) **el commit de la fila está en `main`**
   (`git merge-base --is-ancestor <sha> origin/main`; «la web sirve una versión posterior» no lo
   demuestra); y (b) Vercel lo ha publicado (la dirección sirve la versión nueva, o la
   plataforma dice que ese commit terminó bien).
2. **Al empezar cualquier sesión, lo primero:** comprobar la última publicación. Hay dos casos
   (28-sep-2026, `docs/PUBLICAR-SIN-PARAR.md`):
   - **Rota por nuestro código** (la construcción falla, la web da error, falta un fichero que
     debería estar): arreglarla es lo único que se hace. Nada nuevo encima de una publicación rota.
   - **Vercel no publica por una causa ajena** (tope diario, 402 «Resource is limited»,
     publicación que no arranca, cola de más de 20 minutos): no es una publicación rota. **Se
     sigue trabajando.**
   Además, las filas SIN PUBLICACIÓN COMPROBADA se comprueban ahora: si la web ya sirve una
   `App.VERSION` igual o posterior a la suya **y además el commit de la fila está en `main`**, pasan
   a HECHA en la misma subida que marca la nueva fila EN CURSO.
3. **Si no puedes comprobarlo por una causa ajena:** la fila no se marca HECHA. Se deja como
   **SIN PUBLICACIÓN COMPROBADA**, con el motivo y el SHA de `main` en una línea, y la sesión
   termina con normalidad (para, y el siguiente lanzamiento coge la siguiente PENDIENTE). El tope de Vercel
   **no para la cola**. Tu mensaje final empieza exactamente con: «AVISO: no he podido comprobar
   que los cambios estén publicados.» **Un `create_deployment` por fila con código** (es el camino normal, ya no el de emergencia); si
   responde 402, no se reintenta (el tope es de toda la cuenta de Vercel,
   `docs/PUBLICAR-SIN-PARAR.md`).

Cómo se comprueba en este proyecto: se publica en Vercel. Por el primer camino que funcione:
a) `curl` a `https://asuntos.fmargon.com/js/version.js?v=<algo distinto>` o a
`https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo distinto>`: `App.VERSION` igual o
posterior a la de la fila; b) el estado «Vercel» del commit en GitHub (`success`); c)
`list_deployments` con el `sha`. Un solo `curl` por fichero tocado, no en bucle. Sin el commit de
la fila en `main`, nunca HECHA, lo diga la web o no.

## Reglas propias que estaban en la cabecera de `docs/COLA.md` (7-nov-2026)

1. **La tabla de la cola está en orden de trabajo, no de número** (desde el 18-sep-2026): la
   primera PENDIENTE no tiene por qué ser la del número más bajo.
2. **La hora de `App.VERSION` la pone el programa** (`node scripts/poner-version.mjs`, fila 549),
   nunca a mano ni a ojo: el 17-sep-2026 y el 6-nov-2026 salieron versiones con horas por delante
   de la real.
3. **Antes de subir nada, vuelve a bajar `main`** (`git fetch`): marcar la fila EN CURSO no basta,
   y subir sin releer pisa lo de otro. Hazlo justo antes de cada subida.
4. **Nunca subas un fichero con un texto de relleno en vez de su contenido.** Si no tienes el
   contenido entero delante, no lo subas: bájalo antes. El 17-sep-2026 `docs/CONTEXTO.md` se quedó
   en `main` con la palabra `PLACEHOLDER_WILL_REPLACE` y nada más. Después de subir, vuelve a bajar
   lo subido y compruébalo.
5. **Si delegas una fila de documentación en una sesión auxiliar**, pídele que lea el fichero
   entero de origen y lo copie tal cual, o que lo suba en trozos verificados. El 19-sep-2026 una
   sesión auxiliar retipeó tres ficheros e introdujo erratas en los tres.
6. **Novedades visibles** (fila 248, `docs/NOVEDADES-AL-RECARGAR.md`). Al terminar una fila que
   cambia algo que se ve en pantalla, añade su línea al principio de `js/novedades.js` en el mismo
   commit del código. Si la fila no cambia nada visible, no se añade.
