# El revisor prueba en local; la copia de pruebas en internet deja de ser un paso

Fila 242 de la cola. Diseñada con Francisco el 30-sep-2026 (conversación de Cowork). Cambia cómo se
trabaja la cola; **no toca la aplicación** (ningún fichero de `js/`, `css/` ni `pruebas/`). Corrige
el método de la fila 223 (`docs/REVISOR-ANTES-DE-PUBLICAR.md`) sin quitar lo esencial: nada llega a
producción sin que un revisor con contexto limpio pase la lista «Cómo sabemos que está bien».

## Qué quiere Francisco

«No para de haber problemas en la fase de revisión. Falla Vercel, falla el dominio.» Desde la fila
223 casi ninguna fila ha salido limpia, y no por el código de la app:

1. Las sesiones de Claude Code **no pueden entrar en `pruebas.fmargon.com`**: su entorno de red da
   403, y además esa dirección pide «Vercel Authentication» (comprobado el 30-sep-2026 desde
   Cowork: responde 302 a la pantalla de acceso de Vercel).
2. El **tope de 100 publicaciones diarias de Vercel es de toda la cuenta** y otros proyectos lo
   agotan. Cada subida a `pruebas` gasta una más.
3. Las sesiones han acabado haciendo el revisor contra un servidor local con el código exacto (filas
   219, 204, 213): **eso sí funciona** y es lo que se queda como norma.
4. **Se ha perdido trabajo y se han marcado HECHAS filas que no están en producción:**
   - Fila 231: su commit `8d9deba` se quedó fuera de toda rama al nivelar `pruebas` con `main` a la
     fuerza. No está en `main`.
   - Fila 229: su trabajo (`84def1e`, fusionado en `ca6c95d`) tampoco está en `main`, y aun así la
     fila figura HECHA «porque la web sirve una versión posterior». Esa comprobación es falsa: una
     versión posterior de *otra* fila no demuestra que el código de *esta* esté publicado.
   - Fila 235: su código está en `pruebas` (`341a22b`), sin revisar ni publicar.
   Los tres commits siguen existiendo en GitHub (se pueden pedir por su SHA). Esta fila no los
   publica: los devuelve a la cola para que cada uno pase su revisión.

Francisco no quiere intervenir en nada de esto: ni preguntas ni permisos.

## 1. El método nuevo (sustituye las secciones 2 y 3 de `docs/REVISOR-ANTES-DE-PUBLICAR.md`)

- **Cada fila trabaja en su propia rama `fila-<nº>`**, creada desde `main` al empezar (o en la rama
  `claude/...` que el entorno permita, si no deja crear otra). **Nunca se nivela ninguna rama a la
  fuerza** (`push --force`) si tiene commits que no están en `main`: eso es lo que perdió la 231.
  La rama de una fila no se borra hasta que su trabajo está en `main`.
- **El revisor trabaja siempre en local**: la sesión arranca un servidor con el código de la rama de
  la fila (el mismo con el que ya se ha hecho en las filas 219, 204 y 213) y el revisor entra con
  Playwright en `http://localhost:<puerto>/?demo=1&auto=1`. Sigue siendo **un agente aparte, con
  contexto limpio, que no ve el código ni el diff**; recibe la dirección local, la lista de la fila,
  `docs/VOCABULARIO.md` y el apartado «Qué quiere Francisco». Todo lo demás de la sección 3 y la
  sección 4 de `docs/REVISOR-ANTES-DE-PUBLICAR.md` sigue igual (APROBADA, RECHAZADA, DEVUELTA,
  [SOLO FRANCISCO], tres comprobaciones fijas). Poner al día `docs/REVISOR-GUION.md` con esto.
- **Nada espera a Vercel antes del revisor.** No se sube nada a `pruebas` para revisarlo.
- **Con APROBADA**, la rama de la fila se fusiona en `main` (avance limpio o fusión normal; sin
  `git push`, petición de cambios fusionada al momento). Es la única publicación de código de la
  fila.
- **Después de publicar**, `pruebas` se pone igual que `main` (`git push --force origin
  main:pruebas`; aquí sí es seguro, porque todo lo de `pruebas` ya está en `main`, **compruébalo
  antes** con `git merge-base --is-ancestor origin/pruebas origin/main`; si no lo es, no se toca
  `pruebas` y se apunta en una línea). Así `pruebas.fmargon.com` sigue sirviendo para que Francisco
  mire los datos de demostración cuando quiera. No es un paso: nadie la comprueba ni la espera.
- Publicaciones de Vercel por fila: **una** (la de `main`), más la de `pruebas` al nivelar. Las
  subidas de solo `docs/` a `main` siguen sin publicar nada.

## 2. Cómo se comprueba que una fila está publicada (sustituye la regla 19 de `docs/COLA.md`)

Una fila solo pasa a HECHA si se cumplen **las dos cosas**:

1. **El commit de la fila está en `main`**: `git merge-base --is-ancestor <sha-de-la-fila>
   origin/main` (o, sin git, que el commit aparezca en el historial de `main`). Sin esto, nunca
   HECHA, lo diga la web o no.
2. **Vercel lo ha publicado**, por el primer camino que funcione en la sesión:
   a) `curl` a `https://asuntos.fmargon.com/js/version.js?v=<algo>` o a
      `https://gestor-de-asuntos.vercel.app/js/version.js?v=<algo>`: `App.VERSION` igual o posterior
      a la de la fila;
   b) el estado que Vercel deja en el commit de GitHub (`gh api repos/fmargon780/gestor-asuntos-ies/commits/<sha>/status`
      o `.../deployments?sha=<sha>`, contexto «Vercel»: `success`);
   c) `list_deployments` con el `sha`, si la sesión tiene la herramienta de Vercel.
   Si ninguno funciona, la fila queda **SIN PUBLICACIÓN COMPROBADA** con el SHA de `main` en la
   nota, y la sesión para con normalidad (como ya dice la regla 0).
- Al empezar cada sesión, las filas SIN PUBLICACIÓN COMPROBADA se revisan con estas mismas dos
  condiciones. **«La web sirve una versión posterior» solo vale si además el commit de la fila está
  en `main`.**

## 3. Devolver a la cola lo que se quedó a medias

Esta fila se lanza por su nombre, no desde la tabla: **lo primero, en la subida que la marca EN
CURSO**, apúntala en `docs/COLA.md` como fila **242** (documento `docs/REVISOR-EN-LOCAL.md`),
colocada justo encima de la primera PENDIENTE, y haz a la vez los cambios de abajo. La fila 235
figura EN CURSO con conversación enlazada: esa conversación ya terminó; esta fila la retoma. En
`docs/COLA.md`:

- Fila **229**: de HECHA a **PENDIENTE**, nota: «Rescate: el código está en `84def1e` (fusión
  `ca6c95d`), no en `main`. Traerlo a una rama `fila-229` desde `main` actual (cherry-pick o
  fusión), resolver choques, pasar pruebas y revisor, publicar.»
- Fila **231**: de HECHA a **PENDIENTE**, nota: «Rescate: el código está en `8d9deba`, no en
  `main`. Igual que la 229.»
- Fila **235**: de EN CURSO a **PENDIENTE**, nota: «Rescate: el código está en `pruebas`
  (`341a22b`). Crear `fila-235` desde ese commit (o traerlo sobre `main` actual), revisor en local,
  publicar.»
- Colocar las tres **justo debajo de esta fila 242** y en este orden: 235, 229, 231 (la 235 choca
  menos porque es la más reciente). Las tres llevan ya documento con sección «Cómo sabemos que está
  bien» o se escribe al cogerlas, como dice la regla 2.
- **No toques la rama `pruebas` en esta fila**: tiene el trabajo de la 235 y no está en `main`.
- Antes de cerrar, comprueba que los tres SHA siguen respondiendo (`git fetch origin <sha>` o
  `list_commits` con ese `sha`). Si alguno ya no existe, la nota de su fila dice «rehacer desde el
  documento» en vez de «rescate».

## 4. Lo que cambia en los documentos de reglas

Cambios quirúrgicos: sustituir la línea vieja, no añadir debajo. No leas más que lo que tocas.

- `CLAUDE.md`: el bloque «Trabajar en `pruebas`; a `main` solo con el revisor» pasa a «Trabajar en
  la rama de la fila; a `main` solo con el revisor», con la sección 1 de aquí en cinco puntos
  (quitar el nivelado a la fuerza del punto 1). En el bloque «El revisor»: «entra por Playwright en
  el servidor local con el código de la fila», en vez de «en la copia de pruebas publicada». En la
  «Regla general de publicación», el punto 1 añade la condición del commit en `main` (sección 2 de
  aquí) y la línea final «Cómo se comprueba…» enumera los caminos a), b) y c).
- `docs/COLA.md`: regla 0 (rama de la fila, revisor en local; quitar «la trabaja en la rama
  `pruebas`» y «mirando qué quedó en `pruebas`» por «mirando qué quedó en su rama `fila-<nº>`»);
  regla 13 (una publicación de código por fila); regla 19 sustituida por la sección 2 de aquí;
  quitar de «Lo que queda por hablar con Francisco» las líneas de la fila 214 sobre el 403 de
  `pruebas.fmargon.com` y sobre el *hook* que sube a `pruebas` (ya no se sube nada allí mientras se
  trabaja; si un *hook* lo sigue haciendo, basta con que no se espere a esa publicación).
- `docs/REVISOR-ANTES-DE-PUBLICAR.md`: al principio, una línea: «Secciones 2 y 3 sustituidas por
  `docs/REVISOR-EN-LOCAL.md` (fila 242, 30-sep-2026)». Nada más.
- `docs/REVISOR-GUION.md`: la dirección es la local que le pasa la sesión.
- `docs/COPIA-DE-PRUEBAS.md`: una línea: la copia en internet ya no es un paso de la cola; se
  nivela con `main` después de cada publicación, para que Francisco la mire si quiere.
- `docs/CONTEXTO-CORTO.md`, sección 6: la línea «Pruebas automáticas…» (quitar «antes de subir a
  `pruebas`») y la de «Comprobar siempre lo publicado con `curl`…» (las dos condiciones de la
  sección 2). Sección 1: la copia de pruebas «no es un paso de la cola».
- `docs/HISTORIA.md`: entrada del 30-sep-2026 con el porqué (los tres puntos de «Qué quiere
  Francisco»). Si la sesión no puede con `HISTORIA.md` (regla 17), deja la entrada al final de
  `docs/COLA.md`.

## 5. Cómo sabemos que está bien

1. `main` tiene este documento, las reglas nuevas en `CLAUDE.md` y `docs/COLA.md`, y la regla 19
   dice que una fila solo es HECHA con su commit en `main`.
2. En `docs/COLA.md`, las filas 235, 229 y 231 están PENDIENTE, justo debajo de esta, cada una con
   su SHA de rescate, y la rama `pruebas` sigue teniendo `341a22b`.
3. El siguiente lanzamiento (fila 235) trabaja en `fila-235`, pasa el revisor contra un servidor
   local, publica en `main` con una sola publicación de código y marca HECHA solo tras comprobar el
   commit en `main` y la publicación. En ningún momento espera a `pruebas.fmargon.com`.
4. Nadie le pregunta nada a Francisco ni le pide un permiso.

## 6. Ficheros

Modificados: `CLAUDE.md`, `docs/COLA.md`, `docs/REVISOR-ANTES-DE-PUBLICAR.md`,
`docs/REVISOR-GUION.md`, `docs/COPIA-DE-PRUEBAS.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`,
`docs/ESTIMACIONES.md`. Ningún fichero de la aplicación. Esta fila no publica nada en Vercel: todo
va directo a `main` (solo documentación). No leas el repositorio entero; una sola comprobación al
final (volver a bajar lo subido y mirar que está entero, reglas 11 y 12).
