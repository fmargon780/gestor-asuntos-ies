# Las notas de dentro del asunto no se borran mientras se escriben (fallo urgente)

Acordado con Francisco el 17-sep-2026, el mismo día y por el mismo fallo que la fila 33. Él
hablaba de **las notas de dentro del asunto**, no del tablón. Las dos filas son el mismo fallo en
sitios distintos, y las dos hay que hacerlas.

**Es un fallo, no una mejora. Va justo detrás de la fila 33.**

## Qué pasa

Francisco abre un asunto, empieza a escribir una nota y tarda unos segundos en terminarla. La
ficha da un salto y lo escrito desaparece antes de haber pulsado "Añadir nota".

## De dónde viene

La ficha del asunto se repinta sola, cada 20 segundos, sin que nadie la toque:

- `App.mirarLaCarpeta` (`js/documentos-sueltos.js`) corre cada `App.SEGUNDOS_ENTRE_MIRADAS`
  (20 s, `js/nucleo.js`) y llama a `App.verAbiertos`.
- `js/ficha-asunto.js` envuelve `App.verAbiertos` y llama a `App.reengancharFicha()`, que vuelve a
  pintar la ficha abierta (fila 30).
- Encima, desde la fila 24, `js/presencia.js` repinta la pantalla de abiertos cada 10 segundos.

Y los dos campos de nota de la ficha se rehacen enteros en cada repintado, con `innerHTML`, sin
guardar lo que hubiera escrito:

1. **La nota del asunto**: `pintarNotas` en `js/ficha-asunto.js` rehace `#ficha-notas`, y con él el
   `<textarea id="ficha-nota-texto">`.
2. **La nota de un hito**: el cuerpo desplegado de cada hito en `js/hitos-panel-lista.js` rehace el
   `<textarea class="hito-nota-texto">`.

Lo mismo le pasa a cualquier otro campo de la ficha que se esté rellenando en ese momento (la
fecha límite de un hito, por ejemplo).

## Qué hay que hacer

La regla, para los dos sitios: **un repintado nunca puede tirar lo que el usuario está
escribiendo, ni quitarle el foco, ni mover el cursor.**

### 1. Una ayuda común, en `js/util.js`

Haz una función pequeña, por ejemplo `U.conservandoLoEscrito(raiz, fn)`:

- Antes de llamar a `fn` (el repintado), recorre `raiz` y apunta, de cada `textarea` y de cada
  `input` de escribir (texto, fecha, número), **su identidad** (el `id` si lo tiene; si no, una
  clave estable que le pase quien la llama, del estilo `hito-nota-<id del hito>`), su valor, y si
  era `document.activeElement`, también `selectionStart` y `selectionEnd`.
- Después del repintado, devuelve el valor a los campos que hayan vuelto a salir **y estén
  vacíos** (nunca pises un valor que el repintado haya traído con contenido), y devuelve el foco y
  la posición del cursor a aquel que lo tenía.
- Que no se caiga si un campo ya no existe después del repintado.

### 2. `js/ficha-asunto.js` — la nota del asunto

- Envuelve con esa ayuda el repintado de la ficha (el sitio por donde pasa `App.reengancharFicha`,
  y `pintarNotas` si se llama por su cuenta).
- Además, **no repintes la ficha si no ha cambiado nada**: `App.reengancharFicha` solo tiene que
  repintar cuando el asunto reenganchado sea distinto del que ya se está enseñando (nombre,
  estado, vía, plazo, lista de documentos, hitos, notas: una huella de texto basta). Si es igual,
  se cambia el objeto de dentro y se deja la pantalla quieta. Esto es lo que quita el temblor de
  cada 20 segundos.

### 3. `js/hitos-panel-lista.js` — la nota de un hito

- Que el repintado del cuerpo de un hito pase por la misma ayuda, con una clave por hito, para
  que la nota a medias, el foco y el cursor sobrevivan.
- Cuidado con el `MutationObserver` de `js/hitos-panel.js`: devolver el valor a un campo no puede
  disparar otro repintado (fila 31). Si hace falta, apaga el observador mientras se restaura.

## Cómo se prueba

Una sola pasada de la batería al final, no una comprobación después de cada cambio.

Prueba nueva, en navegador de verdad, con el disco de mentira de `pruebas/navegador.mjs`:

1. Abrir la ficha de un asunto abierto, escribir en `#ficha-nota-texto` y dejarle el foco.
2. Llamar a `App.mirarLaCarpeta()` (y a `App.pintarAbiertos()`) un par de veces.
3. Comprobar que el texto sigue, que el campo sigue siendo `document.activeElement` y que el
   cursor está donde estaba.
4. Lo mismo con el `<textarea>` de nota de un hito desplegado.
5. Comprobar que, sin cambios en la carpeta, `App.reengancharFicha()` no vuelve a pintar la ficha.

Comprueba antes que la prueba falla sin el arreglo.

## Reglas de esta instrucción

- Ficheros que hay que tocar: **`js/util.js`**, **`js/ficha-asunto.js`**,
  **`js/hitos-panel-lista.js`** (y `js/hitos-panel.js` solo si hace falta por el observador), la
  prueba nueva y la fila de `docs/COLA.md`. Nada más.
- Cambios quirúrgicos. No reescribas ningún fichero entero.
- `js/ficha-asunto.js` pasa de 400 líneas, pero **no hay que partirlo** en esta fila: el arreglo es
  pequeño y urgente, y partirlo ahora añade riesgo sin ganar nada.
- No leas el repositorio entero. Con `docs/CONTEXTO.md` y los ficheros de arriba basta.
- La fila 33 (`docs/TABLON-NO-SE-BORRA.md`) es el mismo fallo en el tablón. Si la haces antes,
  reutiliza aquí la misma ayuda de `js/util.js` en vez de escribir dos mecanismos distintos.
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si esta sesión no tiene permiso
  para tocar `main`, abre la pull request y **fusiónala tú mismo** en cuanto la batería esté en
  verde y no haya conflictos (permiso permanente de Francisco, al final de `docs/COLA.md`).
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
- Al terminar: fila a HECHA en `docs/COLA.md`, línea vieja sustituida en `docs/CONTEXTO-CORTO.md`
  y `docs/CONTEXTO.md`, y lo que merezca recordarse en `docs/HISTORIA.md`.
