# El revisor: nada llega a producción sin pasar su lista

> Secciones 2 y 3 sustituidas por `docs/REVISOR-EN-LOCAL.md` (fila 242, 30-sep-2026).

Fila 223 de la cola. Diseñada con Francisco el 28-sep-2026 (conversación de Cowork). Segunda fila
del método «purgar los fallos antes de producción»; necesita hecha la 222
(`docs/COPIA-DE-PRUEBAS.md`). Esta fila **no toca la aplicación**: cambia cómo se trabaja la cola.
Vale para este proyecto; cuando lleve una semana funcionando, Francisco lo extenderá a los demás.

## Qué quiere Francisco

1. **Cada tarea lleva su lista «Cómo sabemos que está bien».** Se escribe al diseñar, en
   Cowork, con palabras de usuario: tres a seis comprobaciones que cualquiera podría hacer
   mirando la pantalla. Sin lista, la tarea no se trabaja.
2. **Claude Code publica primero en la copia de pruebas**, nunca directo en producción.
3. **Un revisor que no ha visto el código** entra en la copia de pruebas y pasa la lista. Si
   aprueba, el cambio pasa a producción. Si no, la tarea vuelve a la cola con lo que falla y
   producción no se toca.
4. Francisco puede entrar en la copia de pruebas cuando quiera, pero **no es un paso**: nadie
   espera a que él mire.
5. **Nada de esto se para a pedir permiso.** Francisco lo dijo con estas palabras: «en el diseño
   es donde tiene que ser incisivo; después la operativa debe ser muy fluida». Ni Claude Code ni
   el revisor le preguntan nada en ningún punto. Las decisiones que haya que tomar a mitad, las
   toma la sesión y las deja escritas en la nota de la fila.

## 1. La lista «Cómo sabemos que está bien»

- Es una sección con ese título exacto, al final de cada documento de instrucción de `docs/`.
  Cada punto empieza por una acción («Abrir…», «Crear…», «Pulsar…») y termina con lo que se tiene
  que ver. Sin nombres de funciones ni de ficheros: es lo que ve la usuaria, no lo que hace el
  código. Modelo: la sección 5 de `docs/COPIA-DE-PRUEBAS.md`.
- Las filas PENDIENTE anteriores a esta (210, 203, 213, 204, 217, 214 y las que se cuelen) no la
  llevan. **Al coger una de esas, lo primero que hace la sesión es escribirla**, a partir del
  propio documento, y la deja en él (en la misma subida que marca EN CURSO). No se pregunta a
  Francisco: si el documento no da para tres puntos, se escriben los que dé y se anota.
- Un punto que no se puede comprobar con datos inventados (Dropbox de verdad, Séneca, un correo
  real, la red del instituto) se escribe igual, marcado al principio con **[SOLO FRANCISCO]**. El
  revisor no lo pasa; al marcar la fila HECHA se copia a `docs/COMPROBAR-A-MANO.md`, y en el
  mensaje final a Francisco se le dice en una línea. Son los únicos puntos que le llegan a él.

## 2. La rama `pruebas` y el paso a `main`

- **`main` es producción y solo recibe lo que el revisor ha aprobado.** Ninguna sesión sube
  código a `main` directamente. Esto sustituye a la norma «Subir directamente a `main`» de
  `CLAUDE.md` (28-sep-2026, por la mañana): Francisco la cambió esa misma tarde al ver que los
  fallos le salían en producción.
- Al empezar una fila: nivelar `pruebas` con `main` (`git fetch`, `git push --force origin
  main:pruebas`, o en una sesión sin `git push`: una petición de cambios de `main` a `pruebas`
  fusionada al momento con `merge_pull_request`). Después, todo el trabajo de la fila se sube a
  `pruebas`. Vercel publica la *preview* sola; comprobar con `curl` que `pruebas.fmargon.com` (o
  la dirección automática) sirve la `App.VERSION` nueva antes de llamar al revisor.
- Con la aprobación: `pruebas` pasa a `main` (`git push origin pruebas:main` si es avance
  limpio; si no, fusión y subida; sin `git push`, petición de cambios `pruebas` → `main`
  fusionada al momento). Comprobar producción por `curl` como siempre (regla general de
  publicación de `CLAUDE.md`) y marcar HECHA.
- Las subidas que solo tocan `docs/` (marcar EN CURSO, estimaciones, HECHA) siguen yendo a
  `main` directamente: no publican nada (`scripts/vercel-ignore-build.sh`) y la página de estado
  de Francisco lee `main`. Publicaciones de Vercel por fila: como mucho tres (una o dos a
  `pruebas`, una a `main`).
- La rama `pruebas` no se borra nunca; se nivela al empezar cada fila. Si una fila queda DEVUELTA
  (sección 4), `pruebas` se queda con su trabajo hasta el siguiente lanzamiento.

## 3. El revisor

- Es **un agente aparte, con contexto limpio**, lanzado por la propia sesión de Claude Code
  (herramienta `Agent`/subagente) dentro del mismo lanzamiento: Francisco no lanza nada más.
- Recibe **solo** esto: la dirección de la copia de pruebas con `?demo=1`, la lista «Cómo sabemos
  que está bien» de la fila, `docs/VOCABULARIO.md`, y el párrafo de la instrucción que dice qué
  quiere Francisco (sección «Qué quiere Francisco» o equivalente). **No recibe el código, ni el
  diff, ni el resto de la instrucción, ni lo que la sesión opina de su propio trabajo.** Si lo
  ha visto, no es un revisor.
- Trabaja con Playwright y Chromium real contra la dirección publicada (no contra ficheros
  locales): entra con `?demo=1`, y pasa cada punto de la lista tal como está escrito. Además,
  siempre, tres comprobaciones fijas: (a) la consola del navegador sin errores al entrar y en
  cada pantalla que abra; (b) Inicio, Nuevo asunto, Archivo, Personas y empresas, Ajustes y
  Herramientas abren; (c) crear un asunto, abrir su ficha y archivarlo funciona.
- Devuelve un informe corto, en texto: **APROBADA** o **RECHAZADA**, y por cada punto BIEN o MAL
  con una línea de lo que ha visto (en MAL, qué esperaba y qué salió). Los puntos [SOLO
  FRANCISCO] los deja como NO COMPROBADO. Con un solo MAL, RECHAZADA.
- Ponle a esa llamada un guion fijo, guardado en `docs/REVISOR-GUION.md` (créalo en esta fila),
  para que todas las revisiones sean iguales y ninguna sesión lo improvise. El guion dice lo de
  arriba, en segunda persona, y termina con el formato exacto del informe.

## 4. Qué pasa con el resultado

- **APROBADA**: paso a `main` (sección 2), producción comprobada, fila HECHA. En la nota de la fila:
  «Revisor: APROBADA (N puntos, M solo Francisco)». En `docs/HISTORIA.md`, el informe entero.
- **RECHAZADA, primera vez**: la sesión arregla lo que dice el informe (solo eso), sube a
  `pruebas` una vez más, comprueba la *preview* por `curl` y vuelve a lanzar el revisor **desde
  cero** (agente nuevo, mismo guion, sin contarle qué se arregló).
- **RECHAZADA, segunda vez**: la fila pasa a **DEVUELTA (fecha hora): <puntos que fallan, en
  una línea cada uno>**. `main` no se toca. La sesión para, con un mensaje final que empieza por
  «DEVUELTA:» y dice qué falla en palabras de usuario. Nada de un tercer intento en la misma
  sesión: es la forma de que un fallo que la sesión no sabe arreglar no se coma la cuota.
- **El siguiente lanzamiento coge primero las filas DEVUELTA** (antes que cualquier PENDIENTE):
  parte de la rama `pruebas` tal como quedó, arregla lo apuntado, y sigue el mismo camino
  (revisor, dos intentos). Una fila DEVUELTA dos lanzamientos seguidos pasa a **BLOQUEADA** con
  el informe, y se queda para que Francisco la lleve a una conversación de diseño.
- DEVUELTA entra en la lista de estados de la cabecera de `docs/COLA.md`. La página «Centro de
  mando» de Francisco la enseñará como un estado más (eso lo hace una conversación de Cowork,
  no esta fila).

## 5. Que nada se pare a pedir permiso

- Crea `.claude/settings.json` en el repositorio (si ya existe, complétalo) con la lista de
  permisos concedidos de una vez para siempre, en `permissions.allow`: `Bash(git *)`,
  `Bash(npm *)`, `Bash(node *)`, `Bash(npx *)`, `Bash(curl *)`, `Bash(TZ=*)`, `Bash(ls *)`,
  `Bash(cat *)`, `Bash(grep *)`, `Bash(mkdir *)`, `Read`, `Edit`, `Write`, `Glob`, `Grep`,
  `Agent`, `WebFetch(domain:pruebas.fmargon.com)`, `WebFetch(domain:asuntos.fmargon.com)`,
  `WebFetch(domain:*.vercel.app)`, y las herramientas MCP de GitHub y Vercel que se usen
  (`mcp__github__*`, `mcp__vercel__*` o como se llamen en la sesión). Nada en `deny` que
  estorbe. Así cualquier sesión de Claude Code abierta en este repositorio hereda los permisos
  sin que Francisco tenga que aprobar nada, sesión a sesión.
- El guion del revisor y la instrucción de la cola dicen explícitamente: **no preguntes nada**.
  Si algo no está claro, se decide y se apunta en la nota de la fila. La única salida sin
  terminar es DEVUELTA o BLOQUEADA, nunca una pregunta.
- Si aun así una sesión se encuentra con una petición de permiso que no puede conceder (un
  aviso del entorno, no de Claude Code), lo apunta en «Lo que queda por hablar con Francisco» de
  `docs/COLA.md` con el texto exacto del aviso, y sigue por otro camino si lo hay.

## 5 bis. Una conversación por fila, y la fila dice cuál

Pedido por Francisco el 28-sep-2026, al cerrar esta fila: el Centro de mando se confunde a menudo
sobre qué tarea se está ejecutando. Dos reglas, las dos obligatorias:

- **Cada fila se trabaja en una conversación de Claude Code nueva.** Una conversación = una fila.
  Al terminar (HECHA, DEVUELTA, BLOQUEADA o SIN PUBLICACIÓN COMPROBADA), la conversación se acaba;
  la siguiente fila es otra conversación, no la misma con `/clear`. Si una sesión ve que la fila
  que le toca es DEVUELTA, también la coge en conversación nueva: parte de la rama `pruebas` y del
  informe apuntado en la fila, no de la memoria de la sesión anterior.
- **La marca EN CURSO lleva el enlace a la conversación**, igual que ya lo lleva EN DISEÑO. Formato
  exacto, en la columna de estado: `EN CURSO (28-sep-2026 16:10) · conversación:
  https://claude.ai/code/session_…`. El enlace es la dirección de la línea `Claude-Session` que el
  sistema da para los commits; si la sesión no la tiene, pone `· conversación: sin enlace` y no
  inventa uno. Al pasar a HECHA o DEVUELTA, el enlace se queda en la nota de la fila, para que
  el Centro de mando pueda abrir la conversación que hizo el trabajo. Una fila EN CURSO **sin**
  enlace se considera abandonada por otra sesión a los 90 minutos de su hora, y el siguiente
  lanzamiento la retoma (mirando qué quedó en `pruebas`, no en `main`).

Esto entra también en la regla 2 de `docs/COLA.md` y en el bloque «Una sola sesión y una sola
fila» de `CLAUDE.md` (sección 6).

## 6. Lo que cambia en los documentos de reglas

Todo con cambios quirúrgicos (sustituir la línea vieja, no añadir debajo), y sin leer más que
lo que se toca:

- `CLAUDE.md`: el bloque «Subir directamente a `main`» pasa a decir lo de la sección 2 de aquí
  (trabajo en `pruebas`, `main` solo con el revisor); el punto 5 de ese bloque (tres subidas) se
  reescribe con el reparto nuevo. Bloque nuevo «El revisor» con las secciones 3, 4 y 5 resumidas
  en diez líneas y el enlace a este documento. La regla general de publicación se queda igual.
- `docs/COLA.md`: cabecera de estados (añadir DEVUELTA); regla 0 (la fila se hace en `pruebas`,
  se revisa, y solo entonces se publica; DEVUELTA antes que PENDIENTE; una conversación nueva por
  fila); regla 2 (escribir la lista si falta, en la subida de EN CURSO; EN CURSO con el enlace a
  la conversación, formato de la sección 5 bis); regla 13 (reparto de las subidas); regla 19 (el `curl`
  se hace dos veces: copia de pruebas antes del revisor, producción después). La «línea para
  lanzar» se queda igual: el método está en las reglas, no en la línea.
- `docs/REPARTO-DE-LA-COLA-2026-09-27.md`: las cláusulas comunes «a `main` sin pull request»
  pasan a «a `pruebas`, y a `main` solo con el revisor».
- `docs/CONTEXTO-CORTO.md`: sección 6, la línea «Pruebas automáticas…» y la del permiso
  permanente; sección 1, la dirección de la copia de pruebas si la 222 no la puso ya.
- `docs/AHORRO-CUOTA.md`: la frase «subir directamente a `main`» de la lista de lo que lleva
  cada instrucción pasa a «subir a `pruebas`; a `main` solo con el revisor», y se añade «la
  sección "Cómo sabemos que está bien"».
- `docs/HISTORIA.md`: la entrada del día, con el porqué (los fallos salían en producción).
- Nuevo: `docs/REVISOR-GUION.md`, `.claude/settings.json`.

## 7. Cómo sabemos que está bien

Esta fila no cambia la aplicación, así que su comprobación es el método mismo:

1. Al terminar esta fila, `main` tiene `docs/REVISOR-GUION.md`, `.claude/settings.json` y los
   documentos de reglas con el texto nuevo, y `docs/COLA.md` lista DEVUELTA entre los estados.
2. **La primera fila que se trabaje después de esta** (la 210, si sigue la primera) sigue el
   camino entero: lista escrita, rama `pruebas`, `curl` de la copia, revisor con informe, paso a
   `main`, `curl` de producción. Su nota HECHA lleva «Revisor: APROBADA…» o la fila queda
   DEVUELTA con el informe. Cualquiera de las dos es el método funcionando; lo que no puede
   pasar es que llegue a `main` sin informe.
3. En ningún punto de ese lanzamiento Claude Code le hace una pregunta a Francisco ni le pide
   un permiso.

## 8. Ficheros

Nuevos: `docs/REVISOR-GUION.md`, `.claude/settings.json`. Modificados: `CLAUDE.md`,
`docs/COLA.md`, `docs/REPARTO-DE-LA-COLA-2026-09-27.md`, `docs/CONTEXTO-CORTO.md`,
`docs/AHORRO-CUOTA.md`, `docs/HISTORIA.md`, `docs/ESTIMACIONES.md`. Ningún fichero de `js/`, `css/`
ni `pruebas/`. Esta fila no publica nada en Vercel (solo `docs/`, `CLAUDE.md` y `.claude/`;
comprueba que `scripts/vercel-ignore-build.sh` salta también `.claude/` y `CLAUDE.md`, y si no,
añádelos en la misma subida).
