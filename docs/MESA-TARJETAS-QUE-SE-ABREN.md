# La mesa del hito: tarjetas que se abren en grande

Fila 147 de `docs/COLA.md`. Diseño cerrado con Francisco el 25-sep-2026, sobre la mesa que dejó la
fila 145 (`docs/MESA-DEL-HITO-ENFOCADA.md`) y un ejemplo en HTML que probó y aprobó («me gusta mucho
más»). **Cambia cómo se ve la mesa, no lo que hace**: cada botón sigue llamando a lo mismo que hoy.

Antes de empezar, lee `docs/contexto/HITO-MESA.md` (sección «La mesa enfocada» y «Dos zonas») y nada
más del repositorio que no necesites.

## El problema

En la columna derecha de la mesa, «Documentos del hito» y «Notas» salen enteros pero apretados: los
nombres de los documentos se cortan con «…», la caja de notas es de una línea y todo compite con el
guion. Cuando Francisco quiere trabajar con los documentos o con las notas, no tiene sitio.

## La idea

La mesa tiene **tres tarjetas**: «Qué hay que hacer» (el guion), «Documentos del hito» y «Notas e
historia». **Una está abierta en grande** en la zona izquierda (dos tercios del ancho); **las otras dos
salen a la derecha como tarjetas pequeñas de resumen**, que solo informan. Pulsar una tarjeta pequeña
la abre en grande, y la que estaba en grande pasa a la derecha como tarjeta pequeña. Es el mismo gesto
de la ficha del asunto (fila 107): pulsar una tarjeta la abre en grande.

Al abrir un hito, en grande está siempre el guion.

## Lo que hay que hacer

### 1. Las tarjetas pequeñas (columna derecha)

Fondo blanco sobre la columna gris, borde fino, cursor de mano; al pasar el ratón, borde azul. Toda la
tarjeta es pulsable (y con Intro o espacio si tiene el foco). Sin botones dentro. Contenido:

- **«Qué hay que hacer» · «N de M»**: una línea por paso, cortada con «…» si no cabe: ✓ verde los
  hechos, ☐ gris los pendientes y el siguiente paso en negrita con «→» delante. Los «No aplica», fuera.
- **«Documentos del hito» · número**: una línea por documento con el tipo (no el nombre del fichero) y
  a la derecha una etiqueta pequeña: el registro en verde («26SM0617») o «Sin registrar» en rojo
  claro. Sin gemelos. Como mucho cinco líneas y «y N más». Sin ninguno: «Ninguno todavía.».
  Debajo, en gris pequeño: «Pulsa para trabajar con ellos».
- **«Notas e historia» · «N notas»**: la primera línea de la última nota, cortada con «…», y debajo,
  en gris pequeño, «Última: <quién> · <día>». Sin notas: la última línea de la historia, o «Sin notas».
- «Normativa (N)» plegada, como hoy, se queda al pie de la columna derecha (no es tarjeta).

**La zona de soltar un documento** sigue funcionando sobre toda la columna derecha, esté abierta la
tarjeta que esté: lo que se suelta va al hito, como hoy.

### 2. Las tarjetas en grande (zona izquierda)

Cada una con su título a la izquierda y, a la derecha del título, «← Volver al guion» (salvo el propio
guion).

- **Guion**: exactamente como lo dejó la fila 145.
- **Documentos del hito**: la tabla de hoy (`js/hito-mesa-documentos.js`) con sitio de sobra. Columnas:
  casilla, documento (el tipo en negrita y, debajo, **el nombre del fichero entero, sin cortar**),
  fecha, registro, estado, y las acciones (Abrir, Enviar, ⋯). Los gemelos (sin sellar, Word) debajo de
  su documento, sangrados y en gris, cada uno con su «Abrir». La barra de varios marcados (Enviar por
  correo, Abrir para imprimir, Mover a otro hito) encima de la tabla. «Añadir documento» junto al
  título. Al pie, una zona de soltar de ancho completo.
- **Notas e historia**: dos columnas (3 a 2). A la izquierda, la caja de escribir amplia (unas cinco
  líneas, crece al escribir; Intro guarda, Mayúsculas+Intro salta de línea, como hoy) y debajo las
  notas del hito, lo más nuevo arriba, con quién y cuándo. A la derecha, «Historia»: lo automático, en
  texto pequeño y gris. Por debajo de 1100 px, una sola columna.

### 3. Cómo se cambia y cómo se vuelve

- Pulsar una tarjeta pequeña la abre en grande.
- «← Volver al guion», pulsar la tarjeta pequeña del guion, o **Escape**, vuelven al guion. Escape
  sigue este orden: primero un desplegable de la cabecera abierto; luego, si la tarjeta grande no es el
  guion, vuelve al guion; luego cierra la mesa; y así como hoy.
- La tarjeta abierta se recuerda por asunto y hito mientras dure la sesión (como `HitoMesa` recuerda el
  hito abierto): guardar, llegar un documento o la presencia **no** devuelven al guion. Cambiar de hito
  con la tira, sí.
- Al pulsar «Añadir documento» o soltar un fichero, no se cambia de tarjeta.
- Los repintados automáticos pasan por `U.conservandoLoEscrito`: lo que se esté escribiendo en la
  caja de notas grande no se pierde.

### 4. Lo que no cambia

- La cabecera, la tira de hitos y los desplegables de la fila 145.
- Ninguna función de guardado, marcado automático del guion, comunicar, generar, registrar ni notas.
- Los datos (`guias.json`, `hitos.json`, `asuntos.json`): no se tocan.
- El modo consulta (compañero dentro): se puede cambiar de tarjeta para mirar; lo que escribe o guarda
  se apaga igual que hoy.
- La rejilla `2fr 1fr` a todo el ancho; con el visor o el lector abiertos, o por debajo de 1100 px, la
  derecha baja debajo, como hoy.

## Ficheros que hay que tocar

- `js/hitos-panel-lista.js` (`cuerpoDeHito`: la zona grande y la columna de tarjetas pequeñas).
- `js/hito-mesa.js` (recordar la tarjeta abierta; cambiar de tarjeta; `cerrarSiAbierta` y Escape).
- `js/hito-mesa-guion.js` (el resumen del guion para la tarjeta pequeña).
- `js/hito-mesa-documentos.js` (la tabla en grande con el nombre entero; el resumen pequeño).
- El fichero que pinta hoy las notas y la historia de la mesa (búscalo desde `cuerpoDeHito`; la fila
  139 las dejó ahí): la vista grande en dos columnas y el resumen pequeño.
- `js/usabilidad.js` (el paso nuevo de Escape).
- `css/hito-mesa.css`.
- Si un fichero pasa de 600 líneas, se parte; si hace falta, un `js/hito-mesa-tarjetas.js` nuevo para
  los tres resúmenes y el cambio de tarjeta, cargado en `index.html` justo después de `js/hito-mesa.js`
  y apuntado en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- Pruebas: ajustar `pruebas/mesa-del-hito-enfocada.mjs` y `pruebas/hito-mesa.mjs` a las tarjetas, y
  una nueva `pruebas/mesa-tarjetas-que-se-abren.mjs`.
- Documentos: `docs/contexto/HITO-MESA.md` (sustituir «Dos zonas» por las tarjetas), la línea de
  «Hitos» de `docs/CONTEXTO-CORTO.md` (sección 5), y `docs/HISTORIA.md`.

## La prueba (una sola, al final)

`pruebas/mesa-tarjetas-que-se-abren.mjs`, con el navegador y el disco de mentira, a 1905×1000 y a
1280×800, sobre un asunto con un hito de cinco pasos (dos hechos), dos documentos (uno registrado,
con un gemelo sin sellar) y dos notas:

1. Al abrir el hito, en grande está el guion; a la derecha, las tarjetas pequeñas de Documentos y de
   Notas, sin botones dentro. La de Documentos dice «26SM0617» y «Sin registrar».
2. Pulsar la tarjeta de Documentos: la tabla sale en la zona grande, con el nombre del fichero entero
   (sin «…»: el ancho del texto cabe en su celda) y el gemelo debajo; a la derecha aparece la tarjeta
   pequeña del guion con «2 de 5» y el siguiente paso en negrita.
3. Escape vuelve al guion y la mesa sigue abierta. Otro Escape cierra la mesa.
4. Abrir Notas, escribir sin guardar, forzar un repintado de la mesa: la tarjeta sigue abierta y el
   texto sigue en la caja. Intro guarda; la nota sale arriba y en el resumen de la tarjeta pequeña.
5. Cambiar de hito con la tira: se abre con el guion en grande.
6. Una captura de cada tarjeta abierta a 1905×1000 para `pruebas/capturas/` (sin datos reales).

Después, `npm test` completo en verde.

## Cómo trabajar

- **No leas el repositorio entero**: con `docs/contexto/HITO-MESA.md` y los ficheros de la lista basta.
- **Cambios quirúrgicos**, sin reescribir ficheros enteros que no lo necesiten.
- **Sube directamente a `main`, sin abrir pull request** (si la sesión lo tiene forzado, pull request
  y fusión automática, según la nota de `docs/COLA.md`).
- Como mucho dos subidas (regla 13). `App.VERSION` con la hora real.
- Al terminar, en el mensaje a Francisco: qué va a ver distinto al abrir un hito, en tres frases.
