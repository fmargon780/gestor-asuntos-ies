# «Qué hay de nuevo» al cargar una versión nueva (fila 248)

Diseñado con Francisco el 1-oct-2026, a partir de un aviso del botón de soporte (idea 248: «Al
cargar una nueva versión de la app sería bueno tener una breve explicación de los cambios que
introduce»). Diseño cerrado.

Valen las cláusulas comunes de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` y las reglas de la cola
(rama `fila-248`, revisor en local, una sola publicación de código). **No leas el repositorio
entero**: basta con los ficheros de la lista. Cambios quirúrgicos, no reescribir ficheros.

## Qué quiere Francisco

Cuando la app se recarga con una versión nueva, quiere ver en pocas líneas qué ha cambiado, con
palabras de usuario, sin tener que preguntar. Lo mismo para su compañero, en su ordenador.

## Lo que tiene que pasar

1. **La lista de novedades**, en un fichero que se publica con la app y que también funciona en la
   copia sin internet (`file://`, donde `fetch` de un JSON no vale): `js/novedades.js`, que define
   `window.NOVEDADES = [ { id: "248", fecha: "2026-10-01", texto: "…" }, … ]`, lo más nuevo
   primero. `id` es el número de fila (o `"248b"` si una fila deja dos líneas). `texto`: una frase
   corta, con las palabras de `docs/VOCABULARIO.md`, que diga lo que la usuaria ve distinto
   («En Inicio, los títulos de la tabla se quedan fijos al bajar»). Nada de nombres de ficheros,
   funciones ni números de fila en el texto.
2. **Relleno inicial**: en esta misma fila, una línea por cada fila HECHA desde el 29-sep-2026
   que cambie algo visible (mira la tabla de `docs/COLA.md` y `docs/HISTORIA.md`), para que la
   primera ventana no salga vacía. Las de solo documentos o arreglos internos no entran.
3. **La ventana «Qué hay de nuevo»**, al entrar en la app (cuando ya está dentro, después de
   señalar carpetas y entrar), con `U.preguntar` o el cuadro común de la app (un solo cuadro a la
   vez: si hay otro abierto, espera a que se cierre):
   - Sale si hay alguna novedad que este ordenador no ha visto. Lo visto se guarda por ordenador
     en `localStorage` (clave propia, p. ej. `gestor.novedadesVistas` con el `id` más nuevo visto;
     lectura y escritura con `try/catch`).
   - **Primera vez en un ordenador** (sin nada guardado): enseña las novedades de los últimos 7
     días; si no hay ninguna, no sale.
   - Trae una línea por novedad no vista, lo más nuevo arriba, con su fecha delante en corto
     («1 oct»). Más de 10: salen las 10 más nuevas y debajo «y N más», que despliega el resto.
   - Un solo botón, «Entendido», que la cierra y marca todo como visto. Cerrar con ✕ o Escape
     también cuenta como visto.
   - Si la versión nueva no trae ninguna novedad, no sale nada.
4. **Volver a verla**: el número de versión que se ve en la barra lateral (el que pinta
   `App.textoVersion` o equivalente) se vuelve pulsable (cursor de mano y título «Ver qué hay de
   nuevo»). Abre la misma ventana con las 10 últimas novedades, vistas o no, y «y N más».
5. En la copia de pruebas (`?demo=1&auto=1`) se comporta igual, para que el revisor la vea.
6. **Regla nueva para Claude Code**, en esta misma fila: añadir a `docs/COLA.md` la regla 21 —
   «Al terminar una fila que cambia algo que se ve en pantalla, añade su línea al principio de
   `js/novedades.js` en el mismo commit del código (no aparte: cada subida de código es una
   publicación). Si la fila no cambia nada visible, no se añade.»— y una línea en la sección 6 de
   `docs/CONTEXTO-CORTO.md` que diga lo mismo.

## Ficheros que tocar

- `js/novedades.js` (nuevo, solo datos) y `js/novedades-ventana.js` (nuevo, la ventana y la
  versión pulsable); `index.html` los carga después de `js/version.js`. Enganche por un punto ya
  previsto (el de después de entrar), sin envolturas.
- La copia sin internet tiene que llevar los dos ficheros nuevos (mirar su lista de ficheros en
  `js/actualizar-copia.js` o donde esté).
- Prueba nueva `pruebas/novedades.mjs`: sin nada guardado sale con las de 7 días; «Entendido» y
  recargar → no sale; añadir una novedad de mentira → sale solo esa; más de 10 → «y N más»; pulsar
  la versión → sale con las 10 últimas; sin novedades nuevas → no sale.
- `docs/contexto/` (el hijo que trate la cabecera y la barra lateral) y `docs/CONTEXTO-CORTO.md`,
  sección 5: una línea nueva.

## Cómo sabemos que está bien

1. Entrar en la app por primera vez en un navegador limpio: sale la ventana «Qué hay de nuevo» con
   varias líneas fechadas, lo más nuevo arriba, escritas como las diría una usuaria.
2. Pulsar «Entendido» y recargar la página: la ventana ya no sale.
3. Pulsar el número de versión de la barra lateral: vuelve a salir la ventana con las últimas
   novedades, y se cierra con «Entendido».
4. Si la lista tiene más de 10 líneas, se ven 10 y debajo «y N más»; al pulsarlo aparecen las
   demás.
5. Ninguna línea de la ventana lleva nombres de ficheros, de funciones ni números de fila.
6. [SOLO FRANCISCO] Cuando se publique la siguiente tarea con un cambio visible, al recargar sale
   la ventana solo con esa novedad.
