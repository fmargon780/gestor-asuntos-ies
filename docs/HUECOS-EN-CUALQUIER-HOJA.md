# Etiquetas: huecos en cualquier hoja, y marcarlos arrastrando (idea 374)

Aviso del botón de soporte (19-oct-2026, Herramientas, copia sin internet, perfil Administración):
«El método de crear huecos en la hoja etiquetas solo permite hacerlos en la primera hoja, si tenemos
más de una hoja con "retales" no podemos configurarla de una vez. Deberíamos poder hacerlo. Como
propuesta de mejora estaría bien poder marcar huecos a filas enteras, a columnas enteras de una hoja y
a áreas rectangulares o cuadradas.» Aviso completo:
https://drive.google.com/file/d/1zcPxZ1POh_6KEqx6rC1WzqYRClZZbVsp/view?usp=drivesdk (captura en la
misma carpeta de Drive: `2026-10-19 140205 error.jpg`). Diseñado con Francisco el 19-oct-2026.

Un «hueco» (en el código, casilla `gastada`) es una etiqueta de la hoja de papel que ya se usó: no se
imprime nada en ella y la persona que le tocaba pasa a la siguiente etiqueta libre.

## Qué pasa hoy

- `EtiquetasHoja.paginar(items, modelo, gastadas)` (`js/etiquetas-hoja.js`) solo mira `gastadas` en
  la hoja 0: `gastadas` es `{ númeroDeCasilla: true }`, sin número de hoja.
- En `js/etiquetas-pantalla.js`, `enganchar()` pone en `#et-vista-hojas` un `onclick` que sale si la
  hoja pulsada no es `data-hoja="0"`. En las demás hojas, pulsar no hace nada.
- El texto de ayuda (`htmlPanel`, sección «Copias y hoja empezada») dice «Pulsa en el dibujo las
  etiquetas de la primera hoja que ya están gastadas.», y el botón `#et-hoja-nueva` se llama «Hoja
  nueva» (vacía `E.gastadas`).
- El PDF (`js/etiquetas-pdf.js`) no lee `gastadas`: imprime lo que sale de `E.pag`. Por tanto, basta
  con que `paginar` salte bien las casillas gastadas de cualquier hoja.

## Qué hay que hacer

**Numeración.** En esta instrucción, «hoja 1, hoja 2, hoja 3» son los números que se ven en pantalla
(«Hoja 2 de 32»). En el código las hojas cuentan desde 0: la «Hoja 2» de pantalla es el índice 1.
«Rayada» = casilla gastada; «no rayada» = cualquier otra (tenga nombre o esté vacía, `et-libre`).

1. **Huecos por hoja.** `E.gastadas` pasa a guardar hoja y casilla con la clave `"hoja:casilla"`,
   las dos contando desde 0 (por ejemplo `{ "1:5": true }` = casilla 5 de la «Hoja 2» de pantalla). `paginar` salta las casillas gastadas de
   **todas** las hojas, no solo de la primera. Cuidados:
   - Si una hoja tiene todas sus casillas gastadas, se dibuja igual (toda rayada) y los nombres siguen
     en la hoja siguiente. Nunca un bucle sin fin. En el PDF esa hoja sale como **página en blanco**
     (decisión de Francisco): cada página del PDF coincide con su hoja de papel, en el mismo orden.
     El pie la cuenta en «N hojas».
   - Una hoja que solo existe porque tiene huecos marcados, pero ya no le quedan nombres (por ejemplo,
     después de quitar personas de la lista), no se dibuja: el dibujo termina en la última hoja con
     algún nombre. Los huecos marcados de esa hoja se conservan en `E.gastadas` por si vuelve a hacer
     falta.
   - Los sitios que hoy vacían `E.gastadas` (cambiar de clase, cambiar de modelo de hoja, «Quitar
     todos los huecos», `abrir()` al entrar en la pantalla) siguen vaciándolo entero, todas las hojas.
     De paso, `borrarModelo` (que cambia de modelo) también lo vacía, que hoy no lo hace.
   - Actualizar el comentario de cabecera de `js/etiquetas-hoja.js` («solo de la primera hoja» deja de
     ser cierto) y la fila de `js/etiquetas-hoja.js` en `docs/contexto/ETIQUETAS.md`.
2. **Pulsar en cualquier hoja.** Se quita el `onclick` actual de `#et-vista-hojas`: pulsar y
   arrastrar se llevan con Pointer Events (punto 3), para que una pulsación no cambie la casilla dos
   veces. Una pulsación es un `pointerup` sobre la misma casilla del `pointerdown`. Pulsar (clic sin arrastrar) en una etiqueta de cualquier hoja la
   raya o la libera, como hoy en la hoja 1. Al rayarla, el nombre que había ahí pasa a la siguiente
   etiqueta libre y los demás se corren detrás.
3. **Arrastrar un rectángulo.** Pulsar en una etiqueta, arrastrar hasta otra **de la misma hoja** y
   soltar marca todas las etiquetas del rectángulo que forman esas dos (de la fila menor a la mayor y
   de la columna menor a la mayor). Así se marca una fila entera, una columna entera o un área.
   - Si la etiqueta donde se empieza no estaba rayada, el rectángulo entero queda **rayado**. Si
     estaba rayada, el rectángulo entero queda **no rayado**. Da igual cómo estuviera cada una de las demás.
   - Mientras se arrastra, las etiquetas del rectángulo se ven resaltadas (un borde o un color
     suave), para saber qué se va a marcar antes de soltar. Al soltar se aplica y se repinta una sola
     vez (no repintar en cada movimiento del ratón).
   - La casilla bajo el puntero se calcula por coordenadas (con `setPointerCapture`, `ev.target` ya
     no sirve): la posición del puntero se recorta a los bordes de la hoja donde se empezó y se
     convierte en fila y columna con la geometría del modelo. Si cae en el espacio entre etiquetas o
     en el margen, se usa la casilla más cercana. Nunca marca casillas de otra hoja.
   - Arrastrar no debe seleccionar texto de la página ni arrastrar la imagen (`user-select: none` en
     las hojas mientras se arrastra, y evitar el arrastre nativo).
   - Ratón: pulsar y arrastrar directamente. Dedo (pantalla táctil): un toque raya o libera una
     casilla; arrastrar sin más desplaza la página como siempre; para marcar un rectángulo se deja el
     dedo quieto un momento (unos 400 ms) y luego se arrastra. Así en el móvil se puede seguir
     bajando por las hojas.
   - El perfil de solo consulta puede marcar huecos, como hoy (no se guarda nada). El botón «Quitar
     todos los huecos» conserva `data-solo-lectura`: su nombre empieza por «Quitar», que
     `js/solo-consulta.js` apaga si no lleva esa marca.
4. **Textos.** En la sección «Copias y hoja empezada»:
   - Ayuda: «Pulsa o arrastra sobre las etiquetas ya gastadas de cualquier hoja.»
   - El botón «Hoja nueva» pasa a llamarse «Quitar todos los huecos» (mismo `id`, misma función,
     ahora vaciando los huecos de todas las hojas).
   - El `title` de una casilla rayada: «Gastada: pulsa para volver a usarla» se queda.
   - Poner al día los otros sitios que nombran «Hoja nueva» o «primera hoja»: `docs/VOCABULARIO.md`,
     `docs/ETIQUETAS.md` y `docs/contexto/ETIQUETAS.md`, y la cabecera de `pruebas/etiquetas.mjs`.
5. **Pruebas.** Hoy no hay pruebas de `paginar` con huecos; la única de huecos es de pantalla
   (`pruebas/etiquetas.mjs`, pulsa en `data-hoja="0"` y comprueba «Hoja nueva»): adaptarla al nuevo
   nombre del botón y al arrastre. Añadir, donde encaje (`pruebas/etiquetas.mjs` o
   `pruebas/etiquetas-350.mjs`):
   - Un hueco en la hoja 2 (índice 1) deja esa casilla vacía y rayada, y el nombre que le tocaba
     aparece en la casilla siguiente.
   - Una hoja con todas sus casillas gastadas no pierde nombres ni se queda en bucle.
   - La función que convierte «casilla de inicio + casilla de fin» en las casillas del rectángulo da,
     en un modelo de 3 columnas, una fila entera, una columna entera y un 2×2 correctos (sacar esa
     cuenta a una función pequeña en `js/etiquetas-hoja.js` para poder probarla sin pantalla).
6. **Novedades** (`js/novedades.js`): «Etiquetas: ya se pueden marcar huecos en cualquier hoja, y
   arrastrando se marca de una vez una fila, una columna o un rectángulo.»

## Ejemplo con datos reales

Francisco lo vio en Herramientas → Etiquetas, con alumnado, en una hoja de **3 columnas** (la de su
captura). El grupo real que dará Francisco es **1º ESO A**. En la copia de pruebas ese grupo se llama «1º A» y
solo tiene 2 alumnos, así que no llena tres hojas. Para probar: **todo el alumnado de la demo, con 3
copias por persona**, en el modelo L7160 (3 columnas × 7 filas), de modo que haya al menos hoja 2 y
hoja 3. Francisco lo comprobará después con 1º ESO A en su copia real.

## Cómo sabré que está bien

1. Pulso una etiqueta de la hoja 2 y queda rayada; el nombre que había ahí pasa a la siguiente
   etiqueta libre.
2. Arrastro desde la primera etiqueta de una fila hasta la última, y toda la fila queda rayada.
3. Arrastro un rectángulo de 2×2 en la hoja 3 y se rayan esas cuatro etiquetas, ni una más.
4. Arrastro empezando en una etiqueta rayada y ese rectángulo vuelve a quedar libre.
5. «Quitar todos los huecos» deja limpias todas las hojas, no solo la primera.

Cabe en una sola sesión de Claude Code.
