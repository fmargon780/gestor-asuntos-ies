# En la guía, documentos y comunicaciones solo con tareas (fila 181)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Tercera parte de la «tanda 3». **Va
después de la fila 180.** Palabras de `docs/VOCABULARIO.md`.

## Qué quiere

Dentro de cada hito de la guía hay hoy dos sitios para decir lo mismo:

- «Documentos de este hito» (casillas; en los datos, `plantillasDocumento: [id…]` del paso) **y**
  una tarea con acción «Generar un documento» y su plantilla (`guion[i].accion = 'generar'`,
  `receta.plantilla`).
- «Comunicación de este hito» (texto propio de correo y de Séneca; en los datos,
  `comunicacion: { correo: {asunto, cuerpo}, seneca: {asunto, cuerpo} }`) **y** una tarea con
  acción «Comunicar» y su plantilla (`receta: { a, via, plantilla }`).

No se sabe cuál manda. **Se quedan solo las tareas.** Lo ya escrito en los otros dos sitios se
convierte solo en tareas, sin perder nada.

## Ficheros que se tocan

- Un módulo nuevo `js/tareas-migracion.js`, con el mismo patrón que `js/reunir-migracion.js` y
  `js/notas-migracion.js` (una sola vez, con marca de hecho, enganchado por
  `window.Gestor.alRefrescar`; cargado en `index.html` junto a ellos)
- `js/guias-paso-bloques.js`, `js/guias-opciones-editor.js`, `js/guias-editor.js` (fuera los dos
  bloques del editor)
- `js/guias-plegado.js`, `js/guias-vista.js` (las marcas «Documentos (N)» y la línea de
  documentos del paso salen de las tareas)
- `js/hitos-generar.js`, `js/hitos-comunicar.js`, `js/hito-mesa-recetas.js`,
  `js/hito-mesa-comunicar.js` (dejan de leer `plantillasDocumento` y `comunicacion` del paso)
- `js/guias-biblioteca.js`, `js/hitos-biblioteca.js`, `js/cargar-biblioteca.js` (los hitos de la
  biblioteca, igual)
- `js/estado-hito.js` (línea ~396, que mira `plantillasDocumento`)
- `js/guias.js` (normalizar: dejar de crear esos dos campos vacíos)
- `js/guias-documentos.js` y `js/guias-comunicacion.js`: quitar lo que ya no use nadie; si quedan
  vacíos, borrarlos y quitarlos de `index.html`
- Las pruebas de `pruebas/` que usen esos dos bloques

No leas el repositorio entero. Localiza con `grep plantillasDocumento` y `grep comunicacion`.

## Qué hay que hacer

### 1. La conversión, una sola vez

Para cada paso de cada guía (`guias.json`), incluidos los pasos dentro de las opciones de una
pregunta (todos los niveles), y para cada hito de la biblioteca (`hitos-biblioteca.json`):

- **Por cada `id` de `plantillasDocumento`** que no esté ya en una tarea `generar` de ese paso con
  `receta.plantilla` igual: añadir al final de sus tareas una tarea
  `{ texto: 'Generar «<nombre de la plantilla>»', accion: 'generar', receta: { plantilla: id } }`.
  Luego vaciar `plantillasDocumento`.
- **Si `comunicacion` tiene texto** en correo o en Séneca: crear en `plantillas.json` › `lista`
  una plantilla del tipo de esa guía, llamada «<título del hito> (del hito)», con el cuerpo de
  correo como texto y el de Séneca como texto de Séneca (el formato de siempre de una plantilla con
  texto propio para Séneca), y el asunto si lo había. Después añadir al paso una tarea
  `{ texto: 'Comunicar', accion: 'comunicar', receta: { via: <correo si tenía texto de correo,
  si no seneca>, plantilla: <id nueva> } }`, salvo que ya hubiera una tarea `comunicar`: en ese
  caso, si no tenía plantilla, se le pone la nueva. Luego vaciar `comunicacion`.
- En los hitos de la biblioteca, la plantilla nueva no tiene tipo: se crea sin tipo (común), si el
  formato lo permite; si no, se deja el texto en la propia tarea como explicación y se apunta en
  `docs/COLA.md` («Lo que queda por hablar con Francisco») qué hitos eran.
- Todo pasa por la cola de guardado (`ColaGuardado`) y con copia del día antes (las reglas de
  siempre de `_GESTOR`). Marca de hecho para no repetirla. Aviso verde una vez: «Las guías se han
  puesto al día: los documentos y las comunicaciones de cada hito ahora son tareas.»
- Los asuntos abiertos no guardan copia de estos campos (el hito los lee de su paso), así que no
  hay que tocar `hitos.json`. Compruébalo antes de empezar; si alguno los guarda, conviértelos
  igual.

### 2. El editor de la guía, sin esos dos bloques

Quitar «Documentos de este hito» y «Comunicación de este hito» del editor de cada paso (y de los
pasos de las opciones, y del editor de hitos de la biblioteca). Todo se hace desde «Tareas de este
hito», con la acción y sus detalles.

### 3. La mesa lee solo de las tareas

- «Generar documento ▾» enseña primero las plantillas de las tareas `generar` del hito, y después
  «Otras plantillas (N)» y «Buscar otra plantilla…», como hoy.
- «Comunicar ▾» usa la plantilla de la tarea `comunicar` del hito, como hoy hace con su receta.
- Nada más cambia en la mesa.

## Prueba

Una prueba nueva en `pruebas/` con una guía de ejemplo que tenga un paso con dos
`plantillasDocumento` (una ya en una tarea) y `comunicacion` con texto de correo y de Séneca:
tras la conversión, el paso tiene una sola tarea `generar` nueva, una tarea `comunicar` con la
plantilla nueva, y la plantilla nueva existe en `plantillas.json` con los dos textos; volver a
arrancar no repite nada; «Generar documento ▾» en un asunto de ese tipo sigue enseñando las dos
plantillas. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. Poner al día `docs/contexto/HITOS-Y-GUIAS.md` y
`docs/contexto/HITO-MESA.md`. Entrada en `docs/HISTORIA.md`.
