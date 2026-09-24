# Los pasos nuevos de una guía llegan a los asuntos abiertos

Fila 118 de `docs/COLA.md`. Cerrado con Francisco el 24-sep-2026.

## El problema

Francisco abrió un asunto, editó la guía de su tipo desde la propia ficha y le añadió pasos.
Al volver al asunto, los hitos nuevos no aparecían.

La causa: los hitos se copian de la guía **una sola vez**, la primera vez que se abre la ficha
(`Hitos.crearDesdeGuia` / `crearDesdeGuiaImportando`, `js/hitos.js`). Después, nada vuelve a mirar
la guía. Ver `docs/contexto/HITOS-Y-GUIAS.md`, sección «Los hitos de un asunto».

## Lo que Francisco ha decidido

1. Al guardar la guía de un tipo, sus **pasos nuevos** se añaden, en su sitio, a **todos los
   asuntos abiertos de ese tipo**.
2. Los hitos que ya tiene cada asunto **no se tocan**: ni estado, ni notas, ni documentos, ni
   requisitos, ni rama elegida, ni plazo, ni responsable.
3. Si se **quita** un paso de la guía, **no se borra** de los asuntos que ya lo tienen.
4. Los asuntos del **ARCHIVO no cambian**.
5. Al guardar, un aviso dice a cuántos asuntos ha llegado el cambio. Por ejemplo: «Guía de X
   guardada: 9 pasos. Los pasos nuevos han llegado a 3 asuntos abiertos.» Si no llega a
   ninguno, el aviso de siempre.

## Cómo hacerlo

### 1. La función pura (fichero nuevo `js/hitos-sincronizar.js`)

`js/hitos.js` ya pasa de 400 líneas: no se engorda. Fichero nuevo, enganchado a `window.Hitos`
como `js/hitos-archivo.js` (sin envolver nada).

`Hitos.pasosQueFaltan(hitos, pasos, conocidos)` → devuelve `{ hitos: <lista nueva>, anadidos: N }`.
Pura, sin disco ni DOM.

- Recorre la guía (`pasos`) en orden. Para cada paso cuyo id **no** está entre los `origenGuia`
  de los hitos del asunto **ni** en `conocidos`, crea su hito con `Hitos.pasoAHito` (el mismo
  camino que al crear; estado `pendiente`) y lo inserta **detrás del hito del paso anterior de la
  guía** que sí exista en el asunto (si no hay ninguno anterior, al principio).
- **Dentro de las preguntas, a cualquier profundidad**: los hitos `decision` guardan sus opciones
  con su propia lista de hitos. Se aplica la misma regla dentro de cada opción que exista, y una
  **opción nueva** de una pregunta ya existente se añade entera. No se cambia `elegida`.
- Los hitos `delTipoAnterior`, los añadidos a mano y los `noaplica` se quedan donde están.
- Nunca se reordena lo que ya existe, aunque el paso se haya movido en la guía.
- Un paso que ya existía en el asunto y se quitó a mano (`Hitos.quitarHito`), o que se podó al
  cambiar de rama, **no vuelve**. Para eso, cada entrada de `porAsunto` gana el campo
  `pasosConocidos: [id]`: los ids de paso de la guía que ya han pasado por ese asunto. Se rellena
  al crear los hitos y al añadir pasos nuevos. En los asuntos que no lo tienen todavía, se toma
  como punto de partida los `origenGuia` de los hitos que tengan ahora, a cualquier profundidad
  (así los pasos nuevos de hoy sí llegan).
- Si el asunto no tiene ningún hito en curso tras añadir, `Hitos.recomputeEnCurso` como siempre.
  Si ya tiene uno en curso, no cambia.

### 2. Al guardar la guía (`js/guias-enganche.js`)

En `escribirGuia` y en `guardarPasos` (que también usa «Traer el cambio» de la biblioteca), tras
guardar `guias.json` con éxito:

- Para cada asunto **abierto** (`window.Gestor.asuntos()`) de ese tipo que **ya tenga hitos** en
  `hitos.json`, aplicar `Hitos.pasosQueFaltan` y guardar.
- **Una sola escritura** de `hitos.json` para todos los asuntos, por la cola de guardado
  (`Hitos.cambiar`), releyendo dentro. Nunca `Copias.guardar` directo.
- Los asuntos sin hitos todavía no se tocan: se crearán enteros al abrirlos.
- Si esta parte falla, la guía ya está guardada: aviso ámbar (`U.accesorio`), no rojo.
- El aviso final con el número de asuntos (punto 5 de arriba).
- Si la ficha de un asunto está abierta, que se repinte su lista de hitos
  (`HitosPanel.programarRepintado()`).

### 3. Red de seguridad al abrir un asunto (`js/hitos-panel.js`)

Al abrir la ficha de un asunto abierto que ya tiene hitos, aplicar lo mismo con la guía en
memoria (la guía pudo cambiar desde el otro ordenador, o antes de esta fila: es el caso del
asunto de Francisco). Solo escribe si `anadidos > 0`. Mismas condiciones que la creación
automática: no si está archivado, no en modo consulta, no si la guía aún no ha cargado; y con el
mismo cerrojo por clave contra dos repintados a la vez.

## Ficheros que se tocan

- `js/hitos-sincronizar.js` (nuevo)
- `js/hitos.js` o `js/hitos-archivo.js`: solo para rellenar `pasosConocidos` al crear
- `js/guias-enganche.js`
- `js/hitos-panel.js`
- `index.html` (la etiqueta del fichero nuevo, detrás de `js/hitos-archivo.js`)
- `pruebas/guia-nueva-llega-a-los-asuntos.mjs` (nueva, sin navegador)
- `docs/contexto/HITOS-Y-GUIAS.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`

## Cómo trabajar

- **No leas el repositorio entero.** Solo los ficheros de arriba y `docs/contexto/HITOS-Y-GUIAS.md`.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Si un fichero que tocas pasa de 400 líneas, pártelo.
- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión solo puede con pull
  request, aplica el permiso permanente de fusionar de `docs/COLA.md`).
- **Una sola prueba al final**: la prueba nueva, con estos casos como mínimo:
  1. Paso nuevo al final de la guía → aparece al final, pendiente.
  2. Paso nuevo en medio → aparece detrás del anterior; los demás hitos, intactos (estado, notas,
     documentos).
  3. Paso nuevo dentro de una opción de una pregunta, y opción nueva entera.
  4. Paso quitado de la guía → el hito sigue en el asunto.
  5. Hito quitado a mano del asunto → no vuelve.
  6. Asunto sin `pasosConocidos` (de antes) → recibe solo los pasos que de verdad faltan.
  7. Llamarla dos veces seguidas → la segunda no añade nada.
- Luego `npm test` completo antes de subir.

## Qué verá Francisco

Al guardar la guía de un tipo, los pasos nuevos aparecen en todos sus asuntos abiertos, y un
aviso le dice en cuántos. El asunto desde el que editó la guía ya muestra los pasos nuevos al
volver a él.
