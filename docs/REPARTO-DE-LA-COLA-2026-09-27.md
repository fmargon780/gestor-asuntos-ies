# Reparto de la cola en filas pequeñas (27-sep-2026)

Acordado con Francisco el 27-sep-2026. Diseño cerrado. **Este documento manda sobre los documentos
de las filas 179 a 187**: dice qué trozo de cada uno se hace en cada fila nueva y qué les faltaba.

## Por qué

- La fila 177 juntaba dos trabajos grandes y tocaba unos veinte ficheros. Tardó horas, se subió en
  treinta subidas sueltas y nunca se marcó HECHA.
- La fila 179 se subió en unas cuarenta subidas, una o dos por fichero, y se quedó a medias. Dejó
  **las pruebas en rojo**: cambió textos de pantalla y no puso al día las pruebas que los buscan.
- Varias filas pendientes juntaban dos o tres cambios grandes, y a algunas les faltaba parte de la
  lista de ficheros.
- Había varias sesiones de Claude Code trabajando la cola a la vez, y una tarea programada que
  lanzaba una más cada hora. Se pisaban.

## La norma nueva: una sola sesión, una sola fila

1. **La tarea programada de la cola está apagada** desde el 27-sep-2026. La cola avanza solo
   cuando Francisco la lanza.
2. **Una sola sesión de Claude Code a la vez** en este repositorio. Nunca dos conversaciones
   trabajando la cola al mismo tiempo.
3. **Cada vez que se lanza, se hace una sola fila**: la primera PENDIENTE. Al terminarla (publicada
   y comprobada, como dice `CLAUDE.md`), la sesión **para** y se lo cuenta a Francisco. La
   siguiente fila empieza solo cuando él vuelve a lanzar.
4. Si al empezar hay una fila EN CURSO, la sesión **no coge otra**: comprueba en qué estado quedó
   esa (qué hay ya en `main`) y la termina ella. Nunca hay dos filas EN CURSO.

## Cláusulas que valen para todas las filas de la 188 en adelante

Aunque el documento de la fila no las diga:

- **Sube directamente a `main`, sin pull request.**
- **Como mucho tres subidas por fila**: una para marcar EN CURSO; una con todo el código y todas
  las pruebas juntas; y, si hace falta, una con la documentación. Nada de una subida por fichero.
  Si la sesión no tiene `git push` y solo puede subir con la herramienta de GitHub, usa
  `push_files` con todos los ficheros de código y pruebas en una sola llamada (o en dos si son
  muchos), nunca uno a uno.
- **Nada se sube hasta que `npm test` entero está en verde en local.** Subir la mitad y seguir
  trabajando está prohibido: la web publica cada subida.
- **No leas el repositorio entero.** Solo los ficheros de la lista, y `grep` para lo demás.
- **Cambios quirúrgicos.** Nada de reescribir ficheros enteros.
- **Ficheros grandes:** ninguno puede pasar de 600 líneas después del cambio. Si la fila cambia de
  verdad un fichero de más de 400 líneas (no solo un texto) y ese fichero va a crecer, se parte
  primero, en la misma subida. Para cambiar solo textos no se parte nada.
- **Una sola tanda de pruebas al final**, no una después de cada cambio.

## Las filas nuevas, en orden

### Fila 188 — Poner en orden lo que quedó a medias (177 y 179)

Ficheros: `docs/COLA.md`, las pruebas de `pruebas/` que fallan, y los `js/` que haga falta
retocar para que pasen. Nada más.

1. **Fila 177.** Todo su trabajo está ya en `main` (subidas del 26-sep-2026 entre las 19:15 y las
   20:28, del `173599d` al `92273a5`): los ficheros nuevos `js/nombres-topes.js` y
   `js/archivo-indice-construir.js`, el selector de curso, los topes con la ruta, la prueba
   `pruebas/archivo-por-curso.mjs` y la documentación. Se comprobó el 27-sep-2026: sus pruebas
   (`archivo-por-curso`, `archivo-indice`, `plazo-de-conservacion`) pasan. Repasa los puntos de
   `docs/ARCHIVO-POR-CURSO-Y-RUTAS.md` contra lo que hay en `main`. Si falta algo pequeño, hazlo.
   Si falta algo grande, no lo hagas aquí: apúntalo como fila nueva al final de la cola. Marca la
   177 HECHA.
2. **Fila 179, lo que ya se subió.** Entre el `9bc26bc` y el `6032d39` se cambiaron los textos
   de unos 43 ficheros, por orden alfabético, hasta `js/hitos-cambio-de-tipo.js`. Esos cambios se
   quedan. Pero **no se pusieron al día las pruebas**, y `npm test` está en rojo desde entonces
   (por ejemplo `hitos.mjs` y `estado-sigue-a-los-hitos.mjs`, que pasaban antes del `21980a1`).
   Pon al día cada prueba que falle para que busque las palabras nuevas de `docs/VOCABULARIO.md`.
   Si una prueba falla por otra cosa que no sea un texto cambiado, arregla el fallo en el código.
3. `npm test` entero en verde, una subida, y comprobar la publicación (`CLAUDE.md`).
4. Marca la 179 como **SUSTITUIDA por las filas 189 y 190**.

### Fila 189 — Vocabulario, segunda parte: los textos que faltan

Documento: `docs/VOCABULARIO-EN-PANTALLA.md`, **punto 1 y punto 4**, solo en los ficheros que la
fila 179 no llegó a tocar. Para saber cuáles son: `git diff --stat 21980a1 6032d39 -- js
index.html` da los ya hechos. De la lista del documento faltan, como mínimo:
`js/hitos-panel-lista.js`, `js/hitos-biblioteca.js`, `js/hitos-anadir.js`, `js/cuentas.js`,
`js/que-me-toca.js`, `js/guias-paso-bloques.js`, `js/guias-toca.js`, `js/hito-mesa-comunicar.js`,
`js/hito-mesa-documentos.js`, `js/formularios-ajustes.js`, `js/formularios-casillas.js`,
`js/ficha-asunto.js`, `js/elegir-asunto.js`, `js/visor.js`, `js/bandeja-correos.js`,
`js/bandeja-enlace.js` y `js/nombres.js`. Después, un `grep` de las palabras de la columna «No
usar» por todo `js/` para los que se escaparan. Las pruebas que busquen textos viejos se ponen al
día en la misma subida.

### Fila 190 — Vocabulario, tercera parte: borrar o quitar, impresos, y la regla

Documento: `docs/VOCABULARIO-EN-PANTALLA.md`, **puntos 2, 3 y 5**, y la **prueba nueva** de
cadenas prohibidas que pide su apartado «Prueba». Ficheros: los que salgan con `grep` de
«Borrar» y «Quitar»; `js/formularios.js` y `formularios/` (punto 3); `docs/CONTEXTO-CORTO.md`
(punto 5); la prueba nueva en `pruebas/`.

### Fila 191 — Inicio, primera parte: los bloques

Documento: `docs/INICIO-CUATRO-BLOQUES.md`, **apartados 1, 2, 3, 4 y 7** (Ha llegado, Me toca,
Esperamos a otros, el tablón y quitar la pantalla «Qué me toca»). Su lista de ficheros, con dos
correcciones:

- `js/inicio.js` **ya existe** (es pequeño): se amplía, no se crea otro.
- `js/documentos-sueltos.js` (580 líneas) y `js/que-me-toca.js` (484) pasan de 400: si crecen,
  se parten primero.

### Fila 192 — Inicio, segunda parte: la tabla de todos los abiertos

Documento: `docs/INICIO-CUATRO-BLOQUES.md`, **apartados 5 y 6** (la tabla «Todos los asuntos
abiertos» con su buscador y sus filtros, y lo que va plegado al final). Mismos ficheros que la 191
en lo que toque a la tabla: `js/asuntos-lista.js`, `js/asuntos-lista-montones.js`,
`js/asuntos-lista-pintar.js`, `js/inicio.js`, `css/inicio.css`, `index.html`.

### Fila 193 — Los avisos en una línea y el menú

Documento: `docs/AVISOS-MENU-Y-VOLVER.md`, **apartados 1 y 2**. Ficheros: los de su lista para
avisos y menú (`index.html`, `js/avisos.js`, `js/avisos-que-faltan.js`, `js/recurrentes.js`,
`js/frescura.js`, `js/unir-asuntos.js`, `js/inicio.js`, `js/avisos-linea.js` nuevo,
`js/barra.js`). `js/recurrentes.js` (538 líneas) se parte si crece.

### Fila 194 — Un solo «Volver»

Documento: `docs/AVISOS-MENU-Y-VOLVER.md`, **apartados 3 y 4**. Ficheros: `js/navegacion.js`,
`js/usabilidad.js`, `js/cuentas.js`, `js/formularios.js`, `js/unir-asuntos-pantalla.js`,
`js/hito-mesa.js`, y `js/recurrentes.js` si tiene su propio «Volver». `js/hito-mesa.js` (477
líneas) se parte si crece.

### Fila 195 — Avisar a quien lo pide y «Enviar estado»

Documento: `docs/AVISOS-A-QUIEN-LO-PIDE.md`, **apartados 1, 2 y 3**. Su lista de ficheros, más
estos que faltaban: `js/hitos.js` (600 líneas: se parte antes de tocarlo) y `js/hito-mesa.js`
(477: se parte si crece). `js/correo-cuadro.js` (594) se parte antes, como ya dice el documento.

### Fila 196 — El informe para dirección

Documento: `docs/AVISOS-A-QUIEN-LO-PIDE.md`, **apartado 4**. Ficheros: `js/cuentas.js` (con
`js/cuentas-informe.js` nuevo si crece), `js/correo-cuadro.js` y `js/correo.js` (solo para abrir
el cuadro relleno), `js/plantillas.js` si hace falta plantilla.

### Fila 197 — Nuevo asunto empieza por la persona

Documento: `docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md`, **entero**. Su lista de ficheros, más
`js/hito-mesa.js` (477 líneas: se parte si crece), que es donde se abre la mesa del primer hito.

### Fila 198 — La pantalla del tipo, de arriba abajo

Documento: `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, **apartados 1, 2, 3, 5 y 8**. Ficheros:
`js/ajustes-tipo.js` (466 líneas: se parte antes), `js/ajustes-plegado.js` (555: se parte si
crece), `js/campos.js`, `js/campos-catalogo.js`, `js/campos-calculados-editor.js`, `js/guias-plazo.js`
y los que diga su lista para estos apartados.

### Fila 199 — Documentos y comunicaciones del hito, como tareas

Documento: `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, **apartado 4**. Es el único que cambia datos
de `guias.json`: la conversión tiene que poder repetirse sin estropear nada (si ya está
convertido, no hace nada). Ficheros: `js/guias-paso-bloques.js`, `js/guias-documentos.js`,
`js/guias-comunicacion.js`, `js/guias-guion.js`, `js/guias-editor.js`, y los que diga su lista.

### Fila 200 — El centro y la pestaña «Herramientas»

Documento: `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`, **apartados 6 y 7**. Ficheros:
`js/ajustes.js` (530 líneas: se parte si crece), `js/ajustes-centro.js` (532: se parte si crece),
`js/papelera-ajustes.js`, `js/barra.js`, `index.html`, y los de Traer el alumnado, Tablas de datos
y Restaurar copia que diga su lista.

### Fila 201 — El nombre del documento sale propuesto

Documento: `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, **apartados 1 y 4**. Su lista de ficheros,
más `js/guias-editor.js` y `js/hito-mesa-documentos.js` (415 líneas: se parte si crece), que
faltaban.

### Fila 202 — Cada hito dice de dónde viene, y la biblioteca se ofrece sola

Documento: `docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md`, **apartados 2 y 3**. Ficheros:
`js/guias-editor.js`, `js/guias-biblioteca.js` (416 líneas: se parte si crece),
`js/hitos-biblioteca.js`, y los que diga su lista para estos apartados.

### Fila 203 — La papelera se vacía sola

Documento: `docs/PAPELERA-SE-VACIA-SOLA.md`, **entero**. Su lista de ficheros, más el que
faltaba: `js/copias.js` (el fichero nuevo `papelera-borrados.json` entra en la copia de
seguridad). `js/ajustes-centro.js` (532 líneas) se parte si crece.

### Fila 204 — Comprobación al entrar

Documento: `docs/COMPROBACION-AL-ENTRAR.md`, **entero**. Su lista de ficheros, más
`js/cabecera-fija.js`, que es donde va la marca verde. Donde el documento dice «los módulos que
guardan cada cosa», son: `js/almacen.js` (carpetas y bandeja), `js/alumnado-bd.js`,
`js/correo-enviar.js` (script de envío), `js/copiar-ruta.js` (ruta de Dropbox),
`js/plantillas-centro.js` (datos del centro) y `js/actualizar-copia.js` (copia sin internet).
Compruébalo con `grep` antes de tocar nada.
