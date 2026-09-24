# Preguntas dentro del guion de un hito

Apuntada el 24-sep-2026. Fila 116 de `docs/COLA.md` (se apuntó como fila 115, pero esa fila la
llevaba ya, en curso, `docs/ENVIAR-DESDE-EL-ASUNTO.md`; para no pisar ese trabajo, pasó a la 116).

## Para qué

Dentro de un mismo hito, a menudo lo que hay que hacer depende de una respuesta. Ejemplo: en el
hito «Recibir solicitud», «¿Viene con toda la documentación?». Si es que no, aparece la línea «Pedir
que la complete». El hito sigue siendo el mismo. Francisco dice que es un caso muy común.

Regla para distinguirlo del hito-pregunta, que ya existe: si la respuesta cambia los hitos que
vienen después, el responsable o el plazo, es un hito-pregunta. Si solo cambia las tareas dentro
del mismo hito, es una pregunta en el guion.

## Qué tiene que hacer

### 1. El dato

- Hoy: `guion: [{ id, texto, explicacion, accion, normativa }]` (ver `docs/contexto/HITO-MESA.md`,
  «El guion»).
- Una línea del guion puede ser pregunta: `{ id, texto, pregunta: true, opciones: [{ id, texto,
  lineas: [ ...líneas normales... ] }] }`. Dos o más opciones.
- **Un solo nivel**: las líneas de una opción nunca son pregunta. `GuiasGuion.normalizar` quita la
  marca `pregunta` a cualquier línea que esté dentro de una opción. Una línea-pregunta no lleva
  `accion` ni `normativa`.
- En el hito, la respuesta elegida se guarda con el resto del estado del guion:
  `guionElegido: { idPregunta: idOpcion }` (en `js/hitos-guion.js`; `normalizarHito` lo conserva).

### 2. Al escribir el guion (editor de la guía y de la biblioteca)

- En «Guion de este paso» (`js/guias-guion.js`), cada línea gana una casilla «Es una pregunta».
  Al marcarla, debajo salen sus opciones («+ Añadir respuesta»), y cada opción con sus líneas
  («+ Añadir línea»), sangradas. Mismo patrón imperativo de siempre: `recoger(); mutar; pintar();`.
- Vale igual en el editor de un modelo de la biblioteca (reutiliza `Guias.editar`).
- La biblioteca copia, compara y sube el guion entero, preguntas incluidas
  (`HitosBiblioteca.normalizarModelo`, `modeloAPaso`, `pasoAModelo`, `diferencias`).
- «Traer los guiones del instituto» (`js/cargar-biblioteca.js`) no cambia: los guiones que trae no
  tienen preguntas.

### 3. En la mesa del hito (`js/hito-mesa-guion.js`)

- La línea-pregunta sale con su texto y **un botón por respuesta**. Sin responder, las líneas de
  sus opciones no se ven. Las líneas que van después de la pregunta se ven siempre.
- Al pulsar una respuesta: se guarda en `guionElegido`, el botón queda marcado y aparecen debajo
  las líneas de esa opción, sangradas, con su casilla como cualquier otra línea.
- **Cambiar la respuesta**: las líneas de la opción anterior desaparecen. Las que ya estaban
  marcadas (hecho o no aplica) no se pierden: quedan plegadas al final del guion, en gris, con la
  respuesta a la que pertenecían (mismo criterio que `Hitos.huerfanos` con los hitos).
- La cuenta «N de M» y la barra cuentan solo las líneas visibles. Una pregunta sin responder
  cuenta como una línea pendiente; respondida, como hecha.
- **El marcado automático** (`Hitos.marcarGuionPorAccion`) busca también dentro de la opción
  elegida, en el orden en que se ven las líneas. Nunca marca una línea de una opción no elegida.
- `Hitos.guionDe(a, h)` devuelve ya la lista tal como se ve (líneas normales, la pregunta y las
  líneas de la opción elegida) y, aparte, las plegadas.

### 4. En el mapa (`js/guias-mapa.js`)

- La caja de un paso cuyo guion tiene alguna pregunta lleva una marca pequeña (por ejemplo «¿»
  con el `title` «El guion tiene una pregunta»). Nada más: el mapa no dibuja el guion.

## Ficheros

- `js/guias-guion.js`: el dato (`normalizar`) y el editor.
- `js/hitos-guion.js`: `guionElegido`, `Hitos.guionDe`, `Hitos.marcarGuionPorAccion`, elegir
  respuesta (`Hitos.elegirEnGuion(clave, idHito, idPregunta, idOpcion)`).
- `js/hito-mesa-guion.js`: la pregunta con sus botones, las líneas de la opción, las plegadas.
- `js/hitos-biblioteca.js`: que normalizar, copiar, subir y comparar respeten las preguntas.
  **Tiene 364 líneas**: si pasa de 400, sacar a un fichero aparte lo del guion.
- `js/guias-mapa.js`: la marca en la caja.
- CSS de la mesa y del editor que ya existan (`css/hito-mesa.css`, `css/guias.css`).
- **Nueva prueba** `pruebas/preguntas-en-el-guion.mjs`, sin navegador: normalizar (un solo nivel),
  `guionDe` con y sin respuesta, cambiar de respuesta con líneas marcadas (plegadas), la cuenta
  «N de M» y el marcado automático dentro de la opción elegida.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituir la línea de hitos de la sección 5),
  `docs/contexto/HITO-MESA.md` («El guion») y `docs/HISTORIA.md`.

## Cómo trabajar

- **Sube directamente a `main`, sin abrir ninguna pull request** (salvo lo que dice la nota de
  `docs/COLA.md` sobre las sesiones en la nube).
- **Cambios quirúrgicos**: no reescribas ficheros enteros.
- **No leas el repositorio entero**: solo `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md`,
  `docs/contexto/HITOS-Y-GUIAS.md` y los ficheros de la lista.
- **Una sola prueba al final** (`npm test`), no una después de cada cambio.
- Comprueba lo publicado con `curl`.
