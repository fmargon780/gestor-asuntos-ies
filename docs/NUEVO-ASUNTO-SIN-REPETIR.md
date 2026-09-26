# Nuevo asunto y la mesa del hito, sin repetir nada (fila 173)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Es la primera parte de la «tanda 1» del
análisis de usabilidad (`claude/Analisis-usabilidad-2026-09-26.md` del proyecto; aquí va todo lo
necesario, no hace falta leerlo). Idea de fondo: **la aplicación no vuelve a pedir lo que ya sabe,
y después de cada acción deja al usuario donde lo lógico es seguir.**

Las filas 174 y 175 se apoyan en el punto 1 de esta. Hazla antes que ellas.

## Ficheros que se tocan

- `js/asuntos-nuevo.js` (puntos 1 y 2)
- `js/asuntos-nuevo-alta.js` (punto 3)
- `js/asuntos-nuevo-crear.js` (puntos 1 y 4)
- `js/lo-pide.js` (punto 4, solo si hace falta un modo nuevo; ver abajo)
- `index.html` (punto 4: quitar el bloque de vía suelto de `#pantalla-nuevo`)
- `js/via-contacto.js` (punto 4: deja de engancharse a `#campo-via`)
- `js/hito-mesa.js` y `js/hitos-panel-lista.js` (puntos 5 y 6)
- `js/word-visor.js` (punto 7)
- Una prueba nueva en `pruebas/` (ver «Prueba»)

No leas el repositorio entero. Cambios quirúrgicos. Si alguno de estos ficheros pasa de 600 líneas
al terminar, pártelo según la regla de `docs/CONTEXTO-CORTO.md`.

## Qué hay que hacer

### 1. Un «tercero propuesto» que espera a que haya tipo

Hoy el formulario de Nuevo asunto va categoría → tipo → tercero, y el buscador del tercero no
existe hasta que hay tipo. Otras pantallas (filas 174 y 175) necesitan llegar a Nuevo asunto
**con el tercero ya sabido y sin tipo todavía**.

- Nueva función `App.nuevoAsuntoCon({ tercero, tipo, fecha, descripcion })`, todo opcional. Va a
  Nuevo asunto (`App.ir('nuevo')`), elige la categoría del tercero (o la del tipo), y:
  - con tipo: lo elige y fija el tercero, como hoy `App.crearAsuntoConPropuesta` pero **sin
    pulsar Crear**;
  - sin tipo: guarda el tercero en `App.E.nuevo.terceroPropuesto` y enseña, encima de la parrilla
    de tipos, una línea «Para: **Nombre del tercero** · Elige el tipo de asunto» con un botón
    «Otra persona» que lo olvida. Al elegir tipo, si la categoría coincide, se fija solo con
    `App.fijarTercero`.
  - `fecha`, si viene, va a «Fecha de inicio»; `descripcion`, a «Descripción corta».
- `App.crearAsuntoConPropuesta` pasa a usar `App.nuevoAsuntoCon` por dentro y luego pulsa Crear,
  como hoy. No cambia lo que hace.

### 2. Cambiar de tipo no borra el tercero

En `App.elegirTipo` (`js/asuntos-nuevo.js`, hoy `App.E.nuevo.tercero = null`): si ya había
tercero **y el tipo nuevo es de la misma categoría**, se conserva y se vuelve a fijar (para que
los campos del tipo nuevo se rellenen con sus datos). Solo se borra si cambia la categoría.

### 3. Tras dar de alta un tercero, queda elegido

En `App.altaTercero` (`js/asuntos-nuevo-alta.js`, la que termina en `U.aviso('Dado de alta.')` y
relanza la búsqueda): en vez de relanzar la búsqueda y obligar a
pulsar el resultado, buscar el recién creado en la lista cargada y llamar a `App.fijarTercero`
con él. Si por lo que sea no se encuentra, dejar el comportamiento de hoy.

### 4. «Quién lo pide y por qué vía», una sola vez

Hoy Nuevo asunto pregunta la vía dos veces: «Vía de comunicación» + su dato (`#campo-via`,
`#campo-via-dato`) y, dentro de «Lo pide», «Por qué vía» + su dato. La ficha del asunto ya lo
resolvió con el cuadro «El encargo» (`js/ficha-bloques.js`), que usa `LoPide` en el modo que
devuelve la vía aunque no se elija quién lo pide (ver el comentario de `js/lo-pide.js`, líneas
155-170: `viaInicial` y el `{via, dato}` que se devuelve siempre).

- En `index.html`, quitar de `#pantalla-nuevo` el bloque de «Vía de comunicación» (`#campo-via`,
  `#campo-via-dato`) y su nota «El estado, la vía de comunicación y la fecha límite no salen…».
  Cambiar el rótulo del grupo `#grupo-lopide` a **«Quién lo pide y por qué vía»** (con
  «(opcional)»).
- Montar «Lo pide» en Nuevo asunto en el mismo modo que «El encargo», y al crear guardar la vía
  y su dato en `ficha.via` / `ficha.viaDato` **igual que hoy** (mismo sitio, mismo formato), y
  `loPide` solo si hay quién, como hoy.
- La fecha de «Lo pide» se queda como está (es la fecha de la petición, que puede ser distinta),
  pero nace con el valor de «Fecha de inicio» y lo sigue mientras el usuario no la toque.
- `js/via-contacto.js`: los botones «De su ficha:» (teléfonos y correos del tercero) pasan a
  salir solo junto al dato de la vía de «Lo pide». Quitar lo que enganchaba a `#campo-via`.
- `js/asuntos-nuevo-crear.js`: quitar las lecturas y el vaciado de `#campo-via` y
  `#campo-via-dato`; la vía sale de «Lo pide». Los asuntos que vienen de la bandeja de correo
  (`js/bandeja-propuesta.js` rellena hoy `#campo-via`) tienen que seguir llegando con
  «Correo electrónico» y la dirección del remitente: pásalo a «Lo pide» (por ejemplo, un
  `viaInicial` en `App.nuevoAsuntoCon`). Toca `js/bandeja-propuesta.js` solo para eso.

### 5. «Marcar como hecho» lleva al hito siguiente

En la mesa del hito (`js/hito-mesa.js`, botón `.mesa-marcar-hecho`): cuando el marcado ha
terminado de guardarse (no antes; si hoy el botón solo pulsa la casilla, expón desde
`js/hitos-panel-lista.js` una función que devuelva la promesa del marcado, o espera a que
`Hitos.marcar` resuelva), abrir la mesa del hito que haya quedado «En curso»
(`HitoMesa.abrir(a, idSiguiente)`).

- Si no queda ninguno (todos hechos o «No aplica»): quedarse en el hito y enseñar, debajo del
  título, «Todos los hitos están hechos.» con un botón **«Archivar el asunto»** que hace lo mismo
  que el botón de la cabecera de la ficha.
- Si el siguiente es una pregunta sin responder, abrir esa pregunta.
- Desmarcar («Hecho ✓ (desmarcar)») no mueve a ningún sitio.

### 6. Guion completo: preguntar si se da el hito por hecho

Hoy, cuando se marcan todas las tareas del guion, el botón «Marcar como hecho» solo se resalta
(`completo`, clase `mesa-hecho-resaltado`). Además del resaltado: la primera vez que un hito pasa
a tener el guion completo **por una acción del usuario en esta sesión** (marcar una línea,
generar, registrar, comunicar, añadir), preguntar con `U.preguntar`:
«Ya están hechas todas las tareas de este hito. ¿Lo damos por hecho?» — botones «Darlo por
hecho» (hace lo mismo que el punto 5, incluido pasar al siguiente) y «Todavía no». Una sola vez
por hito y sesión (memoria en una variable del módulo, no en disco). No preguntar al abrir una
mesa que ya estaba completa.

### 7. «Guardar PDF» cierra el visor de Word

En `js/word-visor.js`, `guardarPdf`: cuando el PDF se ha guardado bien y se ha apuntado al hito,
cerrar el visor (`cerrar()`), para que el usuario vuelva a la mesa del hito sin pulsar «Cerrar».
Si falla algo principal, el visor sigue abierto como hoy. Si el usuario elige «Imprimir», el visor
no se cierra.

## Lo que no se hace

- No se cambia el orden del formulario (categoría → tipo → tercero): eso es la tanda 3.
- No se cambia ningún texto de botón salvo los que dice esta instrucción: los nombres son la
  tanda 2.
- No se toca cómo se guardan los datos en `_GESTOR`: `ficha.via`, `ficha.viaDato` y `loPide`
  siguen igual.

## Prueba

Una sola prueba nueva en `pruebas/` (navegador), al final: (a) en Nuevo asunto, elegir tipo,
tercero, y cambiar a otro tipo de la misma categoría: el tercero sigue; (b) dar de alta un
tercero: queda elegido sin pulsar nada; (c) el formulario tiene una sola pregunta de vía y el
asunto creado guarda `ficha.via`; (d) en la mesa, «Marcar como hecho» deja abierta la mesa del
hito siguiente. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir las líneas de
sección 5 que cambian (Lo pide, hitos). Poner al día `docs/contexto/ASUNTOS.md` (Nuevo asunto) y
`docs/contexto/HITO-MESA.md`. Entrada en `docs/HISTORIA.md`.
