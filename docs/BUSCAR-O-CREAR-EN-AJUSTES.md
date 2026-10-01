# Buscar antes de crear en Ajustes: una sola caja «Buscar o crear» (fila 250)

Aviso de usuario del 1-oct-2026 (pantalla Ajustes), diseñado con Francisco ese mismo día.
Aviso completo: https://drive.google.com/file/d/1Di_jsGF4nk_QMn_pVUezL5jP-9KEWXsw/view?usp=drivesdk

## El problema

En Ajustes → Tipos de asunto hay dos cajas separadas: «TIPO NUEVO» con su categoría y «Añadir»
(`#nuevo-tipo`, `#nueva-categoria`, `#btn-anadir-tipo`, `index.html` ~548) y, debajo, «Buscar un
tipo en todas las categorías» (`#buscar-tipos`). Se puede crear un tipo sin haber buscado antes.
La guardia de hoy (`App.pintarAvisoNuevoTipo` y `U.dejaCrear`) solo bloquea el nombre idéntico y
avisa de los parecidos en un cuadro, después de pulsar «Añadir». Así se cuelan tipos duplicados
con expresiones parecidas.

Lo mismo pasa en Ajustes → El centro → Tipos de documento (`#nuevo-tipo-doc`,
`#btn-anadir-tipo-doc`, `App.pintarAvisoSimple`, `js/ajustes-centro.js` ~145), que además no
tiene buscador.

(Durante el diseño se habló también de «Estados»; esa lista ya no existe desde la fila 129. Son
solo estos dos sitios.)

## Lo que decidió Francisco

1. **Una sola caja «Buscar o crear»** en los dos sitios. Desaparecen la caja «TIPO NUEVO», su
   desplegable de categoría y su botón «Añadir», y en tipos de asunto la caja de búsqueda actual
   pasa a ser esta caja única (mismo sitio, al lado de las pestañas de categoría). Texto de
   ayuda dentro de la caja: «Busca un tipo; si no está, lo creas desde aquí».
2. **Al escribir, la rejilla se filtra** con los que se parecen, de todas las categorías (en tipos
   de asunto, como ya hace `#buscar-tipos` hoy, con su línea «tipos-buscando-info»). Da igual
   tildes, mayúsculas y el orden de las palabras: usar `U.normalizar` / `U.parecidos`, sin
   inventar otra comparación. En tipos de documento, la rejilla `#tabla-tipos-documento` se
   filtra igual.
3. **El botón de crear sale siempre al final de la lista**, solo cuando la caja tiene texto:
   «Ninguno es el que busco: crear «<lo escrito, en mayúsculas y limpio>»». Nunca sale con la
   caja vacía.
4. **Si hay parecidos**, el botón pregunta una vez más antes de crear, con un solo cuadro
   (`U.preguntar`): «¿Seguro que no es ninguno de estos?», con la lista de parecidos (hasta 4,
   cada uno pulsable para ir a él) y el botón «Crearlo igualmente». Es lo que ya hace
   `U.dejaCrear`; aprovecharlo, ajustando el texto.
5. **Si el nombre es idéntico** a uno que ya existe (`p.igual`), el botón de crear no sale; en su
   lugar: «Ya existe: <nombre>, en <categoría>» con «Verlo» (`App.verTipoEnAjustes`), como el
   aviso actual.
6. **Categoría al crear un tipo de asunto** (decisión de Claude, aceptada): al pulsar crear sale
   un cuadro pequeño con la categoría ya marcada —la de la pestaña que se está viendo— y se puede
   cambiar antes de «Crear». Tipos de documento no tienen categoría: se crean directamente (tras
   el paso 4 si hay parecidos).
7. Tras crear: la caja se vacía, el tipo nuevo queda a la vista en la rejilla (en tipos de asunto,
   en su pestaña) y aviso verde «Tipo añadido.». Mismas funciones de hoy para crear
   (`App.crearTipo` y la de `js/ajustes-centro.js` para tipos de documento): solo cambia la
   pantalla de entrada, no cómo se guarda.

**No se tocan** (ya buscan antes de crear): el tipo nuevo al vuelo de «Nuevo asunto»
(`js/tipo-al-vuelo.js`), el tipo de documento nuevo al poner nombre a un documento
(`js/documentos-tipo-nuevo.js`), el alta de personas, empresas y Administraciones, los campos
propios y calculados, la biblioteca de hitos, cargos y plantillas.

## Dónde mirar

- `index.html` ~540-560 (pestaña Tipos de asunto) y ~655-668 (Tipos de documento).
- `js/ajustes.js`: `App.pintarAvisoNuevoTipo`, `App.pintarAvisoSimple`, `#btn-anadir-tipo`
  (~232-290 y ~505-520). Si `ajustes.js` se acerca a 600 líneas, la caja única va a un fichero
  nuevo (`js/buscar-o-crear.js`), común a los dos sitios, enganchado sin envolver.
- `js/tipos-buscador.js` y el filtro de `#buscar-tipos` en Ajustes.
- `js/ajustes-centro.js` ~145-160.
- `js/util-parecidos.js`: `U.parecidos`, `U.dejaCrear`.
- Textos con las palabras de `docs/VOCABULARIO.md`.

## Cómo sabemos que está bien

1. En la copia de pruebas (`?demo=1&auto=1`), Ajustes → Tipos de asunto: no hay caja «TIPO NUEVO»
   ni botón «Añadir»; hay una sola caja «Buscar o crear».
2. Con la caja vacía no hay botón de crear. Al escribir unas letras, la rejilla enseña los
   parecidos de todas las categorías y, al final, «Ninguno es el que busco: crear «…»».
3. Escribir un nombre parecido a uno existente con otras tildes, mayúsculas u orden de palabras:
   sale el existente en la lista; al pulsar crear, sale «¿Seguro que no es ninguno de estos?» con
   él; pulsarlo lleva a ese tipo; «Crearlo igualmente» lo crea.
4. Escribir el nombre exacto de un tipo existente: no hay botón de crear; sale «Ya existe: …,
   en …» con «Verlo», que lleva a él.
5. Crear un tipo sin parecidos estando en la pestaña PERSONAL: el cuadro trae PERSONAL marcada;
   cambiarla a OTROS y crear: el tipo aparece en OTROS, la caja queda vacía, aviso verde.
6. Ajustes → El centro → Tipos de documento: los puntos 1 a 4 igual (sin categoría); el tipo
   creado aparece en la rejilla.
7. «Nuevo asunto» → tipo nuevo al vuelo y el tipo de documento nuevo al nombrar un documento
   siguen como antes.
8. Prueba nueva `pruebas/buscar-o-crear-en-ajustes.mjs` con los puntos 1-6, en verde, y las de
   Ajustes y tipos que ya existen siguen en verde.

## Al terminar

- Línea en `js/novedades.js` (regla 21): «Ajustes: para crear un tipo de asunto o de documento,
  primero se busca; si no está, se crea desde la misma caja».
- Poner al día la línea de Ajustes de la sección 5 de `docs/CONTEXTO-CORTO.md` y el hijo de
  `docs/contexto/` de Ajustes, sustituyendo lo que ya no sea verdad.
