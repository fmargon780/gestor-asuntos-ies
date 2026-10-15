# Etiquetas: tamaño de hoja, cambiar lo guardado y alinear a la derecha

Fila 346 de `docs/COLA.md`. Idea de Francisco por el botón de soporte (15-oct-2026, aviso completo:
https://drive.google.com/file/d/1MJSAfX8t29_kE3ceQLFC5Rc8wd2dMFWW/view?usp=drivesdk), diseñada con él
ese mismo día. Amplía la pantalla Etiquetas de la fila 344 (`docs/ETIQUETAS.md`,
`docs/contexto/ETIQUETAS.md`).

## De dónde sale esto

El texto del aviso, tal cual:

> En la herramienta Etiquetas propongo las siguientes mejoras:
> 1º) Poder elegir el tamaño de la hoja (tanto mediante los formatos estándar (A3, A4, ...) como
> introduciendo las medidas.
> 2º) Poder modificar un diseño previo.
> 3º) Poder alinear el texto a la derecha, además de a la izquierda o centrado como tenemos ahora.

## Lo que se pide

### 1. Tamaño de la hoja, dentro de cada modelo

- Cada modelo de hoja lleva su tamaño (`hoja: { nombre, ancho, alto }` en mm). Los modelos que trae la
  app (Avery/Apli y «1 × 1») son A4 y no cambian.
- En el formulario de un modelo propio, un desplegable «Tamaño de la hoja» con A3, A4, A5, Carta
  (216 × 279) y Oficio (216 × 356), y la opción «Otro (medidas en mm)», que muestra dos campos: ancho y
  alto. A4 por defecto.
- Hoy el A4 está fijo en `js/etiquetas-modelos.js` (`A4`, `nuevo`, `geometria`), en
  `js/etiquetas-pdf.js` (`W`, `H`) y en el dibujo de `js/etiquetas-hoja.js` (210 × 297). Todo eso pasa a
  leer el tamaño del modelo. Un modelo guardado antes, sin `hoja`, se lee como A4.
- El PDF sale con la página de ese tamaño, a tamaño real. La vista previa se escala para caber a lo ancho
  del panel, como hoy.
- El texto de la medida del modelo (`EtiquetasModelos.texto`) dice también el tamaño de hoja.
- Medidas absurdas (menos de 50 mm, más de 1.000 mm, o etiquetas que no caben) se avisan en el propio
  formulario, como ya hace `problema`, y no se guardan.

### 2. Cambiar un diseño o un modelo ya guardado

Hoy ya existe «Cambiar» para los diseños propios y «Ajustar márgenes» para los modelos. Francisco no lo
encontró, así que hay que hacerlo evidente:

- En «Hoja de etiquetas» y en «Qué lleva cada etiqueta», un botón **«Cambiar»** siempre a la vista,
  junto a «Nuevo…», para cualquier modelo o diseño elegido.
- Si es propio, «Cambiar» abre su formulario con todo lo suyo (nombre, tamaño de hoja, filas, columnas,
  márgenes y separaciones; o renglones, «para» y «una por familia») y al guardar lo sustituye, con el mismo
  `id`.
- Si es de los que trae la app, «Cambiar» abre el mismo formulario con un aviso arriba: «Es un modelo (o
  diseño) de la app: se guardará como copia con otro nombre». Al guardar se crea uno propio («Copia de …»
  por defecto) y queda elegido. El de la app no se toca.
- «Ajustar márgenes» desaparece: lo hace «Cambiar». «Duplicar» de diseños se queda.
- Lo guardado sigue en `_GESTOR/etiquetas.json` por `js/etiquetas-guardado.js` (cola por fichero; un
  directivo, por `Perfil.escribir`). En «solo consultar», «Cambiar» apagado, como los demás botones.

### 3. Alinear a la derecha, renglón a renglón

- Cada renglón del diseño elige **A la izquierda, Centrado o A la derecha** (`alinea: 'izq' | 'centro'
  | 'der'`). Hoy solo hay `izq` y `centro`: `js/etiquetas-disenos.js` convierte cualquier otra cosa en
  `izq`; hay que dejar pasar `der`.
- Encima de los renglones, en el formulario del diseño, una fila **«Alinear todo:»** con tres botones
  (izquierda, centro, derecha). Pulsar uno pone esa alineación a todos los renglones de golpe. Después
  cada renglón se puede cambiar suelto.
- La derecha respeta el mismo relleno interior que la izquierda (`RELLENO_MM`), en la vista previa
  (`text-align:right` en `js/etiquetas-hoja.js`) y en el PDF (`x = x0 + ancho - relleno - w` en
  `js/etiquetas-pdf.js`).
- En la lista de renglones de «Qué lleva cada etiqueta», detrás de cada renglón, « · centrado» o « · a la
  derecha» cuando no sea izquierda.

## Qué ficheros tocar

`js/etiquetas-modelos.js`, `js/etiquetas-editor.js`, `js/etiquetas-disenos.js`, `js/etiquetas-hoja.js`,
`js/etiquetas-pdf.js`, `js/etiquetas-pantalla.js` (y `css/estilos.css` si hace falta). Ningún fichero de
`js/` pasa de 600 líneas. Poner al día `docs/contexto/ETIQUETAS.md` y la línea de Etiquetas de
`docs/CONTEXTO-CORTO.md`.

## La prueba

Ampliar `pruebas/etiquetas.mjs` (o una nueva `pruebas/etiquetas-346.mjs`) con:

1. Modelo propio en A3 de 2 × 4: la hoja de la vista previa es apaisada en proporción 297 × 420 y el PDF
   tiene una página de 297 × 420 mm (841,9 × 1190,6 puntos).
2. Modelo propio con «Otro» de 100 × 150 mm: lo mismo con esas medidas.
3. Un modelo guardado sin `hoja` sale en A4.
4. «Cambiar» un modelo propio: cambia sus filas y conserva su `id`; «Cambiar» un modelo Avery: crea uno
   propio nuevo y el Avery sigue igual.
5. «Cambiar» el diseño «Sobre»: se guarda como copia; el «Sobre» de la app no cambia.
6. «Alinear todo» a la derecha pone `der` en todos los renglones; cambiar uno a centrado deja los demás
   a la derecha; en el PDF el texto alineado a la derecha termina a `RELLENO_MM` del borde derecho de la
   casilla.

## Novedades

Una línea en `js/novedades.js`: «Etiquetas: cada hoja propia elige su tamaño (A3, A4, A5… o a medida),
cualquier hoja o diseño se puede cambiar con «Cambiar», y el texto se puede alinear a la derecha.»

## Para Francisco al terminar

Nada que hacer. Si quiere, que pruebe una hoja de otro tamaño la próxima vez que imprima etiquetas.

## Cómo sabemos que está bien

- En un modelo propio se elige A3, A4, A5, Carta, Oficio u «Otro» con ancho y alto, y la vista previa y
  el PDF salen con ese tamaño de página, a tamaño real.
- Los modelos de la app siguen en A4 y lo guardado antes (sin tamaño) sigue saliendo igual que ayer.
- «Cambiar» está a la vista en hoja y en diseño; en uno propio lo sustituye; en uno de la app crea una
  copia propia y deja el original intacto.
- Cada renglón admite izquierda, centro o derecha; «Alinear todo» los pone iguales de una vez; la vista
  previa y el PDF coinciden.
- Las pruebas de etiquetas de la fila 344 siguen en verde.
