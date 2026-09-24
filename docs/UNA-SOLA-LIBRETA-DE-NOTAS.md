# Fila 139 — Una sola libreta de notas por asunto

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «redundancias»). Diseño cerrado con Francisco el 24-sep-2026.

Hoy un asunto tiene sus notas y cada hito las suyas. Se quedan en una: las notas del asunto, cada
una con el hito como etiqueta si se escribió desde él. De paso desaparece el fallo apuntado en la
cola (fila 34): si la ficha se repintaba mientras se escribía una nota de hito, se perdía.

El tablón no cambia: es otra cosa.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que se
  cita y los ficheros de la lista. Si con `grep` aparece otro fichero que haga falta tocar, tócalo y
  apúntalo en la documentación.
- **Cambios quirúrgicos.** No reescribas ficheros enteros. Lo nuevo va en ficheros nuevos y
  pequeños (menos de 400 líneas), enganchados por un punto previsto, no envolviendo.
- Sube directamente a `main`, sin pull request (o según la nota de la cola si la sesión no puede).
  Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.
- Todo guardado de `_GESTOR` por `ColaGuardado`. Todo fallo accesorio, en ámbar, sin parar lo
  principal.
- Al terminar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`, sustituyendo lo viejo.

Contexto: `docs/contexto/ASUNTOS.md`, `docs/contexto/HITO-MESA.md`,
`docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`.

## Ficheros que se tocan

- `js/notas.js` (la etiqueta y el filtro)
- `js/hitos-panel-lista.js` (el bloque «Notas e historia» de la mesa), `js/hitos.js` (dónde se
  guarda una nota escrita desde el hito)
- `js/hitos-archivo.js` (leer las de los archivados)
- Nuevo `js/notas-migracion.js`, `index.html`
- Prueba nueva: `pruebas/una-sola-libreta-de-notas.mjs`

## 1. El dato

Una nota de `asuntos.json` puede llevar `hito` (el id) y `hitoTitulo` (el título en ese momento).

## 2. Qué se ve

- **Ficha del asunto**: todas las notas, las de hito con una etiqueta pequeña con su título.
  Pulsar la etiqueta abre la mesa de ese hito.
- **Mesa del hito**: el bloque de notas enseña solo las de ese hito, y lo que se escribe ahí se
  guarda como nota del asunto con la etiqueta. Se usa `U.conservandoLoEscrito` como en las notas
  del asunto.
- **La historia automática** del hito (cambios de estado, quién lo marcó, cuándo) **se queda en el
  hito**, bajo el título «Historia». Solo pasan las notas escritas por una persona. Si en el código
  no se distinguen, se añade la marca al escribir y en la migración se decide por el texto (las
  automáticas tienen forma fija).

## 3. El paso de lo que ya hay

`js/notas-migracion.js`, una sola vez, con marca en `_GESTOR/notas-migrado.json`:

- Las notas escritas a mano de cada hito vivo pasan a las notas de su asunto, con etiqueta, en su
  orden por fecha.
- Primero se escribe `asuntos.json` y después se quitan de `hitos.json`, cada uno por
  `ColaGuardado`. Repetirla no duplica (se comparan texto, quién y cuándo).
- Los archivados no se tocan: al enseñarlos, se leen las dos cosas.

## 4. La prueba

Un hito con dos notas escritas y una automática → el asunto gana dos notas con etiqueta y el hito
conserva la automática; migrar dos veces no duplica; una nota escrita en la mesa sobrevive a un
repintado de la ficha.
