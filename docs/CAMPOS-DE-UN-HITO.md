# Campos de un hito (fila 255)

Diseñado con Francisco el 2-oct-2026 en Cowork, a partir del mismo aviso de soporte de la fila 254:
https://drive.google.com/file/d/1pRIMWf5JQn_6tTS0JI2DgCE2MFKkek45/view?usp=drivesdk

**Va después de la fila 254** (`docs/CAMPOS-ARREGLO-Y-VENTANA-ANCHA.md`): usa su arreglo, la
tarjeta «Campos del asunto» y la ventana ancha. Si la 254 no está HECHA, no empieces esta.

## Qué quiere Francisco

Poder añadir campos también **en los hitos**. Lo acordado, con sus palabras:

- Hay **campos del asunto**, que no dependen de ningún hito. Se ven en la ficha. Es lo de hoy.
- Hay **campos de un hito**: se añaden desde la pantalla de ese hito, y se ven y se rellenan ahí.
  Como el hito es del asunto, el campo **también es del asunto**: sale en la ficha (debajo del
  nombre de su hito), en exportar y en los documentos, como cualquier otro campo.
- Limitación aceptada por Francisco: **un campo tiene un único valor por asunto**. El mismo campo
  no puede estar en dos hitos con valores distintos; si hace falta, son dos campos con nombres
  distintos.

Es decir: no hay una segunda lista de datos. Un campo de un hito es un campo del asunto que lleva,
además, la marca de a qué hito pertenece.

## Antes de empezar

- Lee `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md` (los campos de un tipo y el párrafo de
  la fila 245) y, de `docs/contexto/HITO-MESA.md`, solo lo que explica cómo se pintan las tarjetas
  de la pantalla de un hito (la mesa) y su menú. Como referencia del patrón,
  `docs/CAMPO-DESDE-EL-ASUNTO.md` y `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`. **No leas el
  repositorio entero.**
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (`docs/CONTEXTO-CORTO.md`, §6).
- Método de la fila 242 (`docs/REVISOR-EN-LOCAL.md`): rama `fila-255`, revisor en local, y con su
  APROBADA a `main`, sin esperar a Francisco y sin dejar nada en una petición de cambios en
  borrador. Una sola publicación de código.
- Una sola pasada completa de pruebas al final; mientras tanto, solo las de lo tocado.

## 1. Cómo se guarda

El valor sigue donde está hoy, en `ficha.campos`. Lo único nuevo es la marca del hito:

- **Campo del tipo** (`porTipo` de `_GESTOR/campos.json`): cada entrada puede llevar, opcional,
  `hito`, con el `id` del paso de la guía del tipo (el mismo `id` con el que los hitos de un asunto
  casan con su guía, `origenGuia`). Sin `hito`, es un campo del asunto, como hoy.
- **Campo «solo aquí»** (`ficha.camposPropiosDelAsunto`): cada entrada puede llevar, opcional,
  `hito`: el `id` del paso de la guía si el hito viene de ella, o el del propio hito del asunto si
  es un hito «solo de este asunto».
- `Campos.camposDeAsunto(listaDelTipo, ficha)` devuelve cada campo con su `hito` (o sin él). Una
  función pura nueva, por ejemplo `Campos.repartirPorHito(campos, hitosDelAsunto)`, da los campos
  sin hito y, por cada hito del asunto que tenga alguno, los suyos, en el orden de los hitos.
- **Nunca se pierde un valor.** Si la marca apunta a un hito que el asunto no tiene (otro camino de
  una bifurcación, un paso borrado de la guía, un hito borrado del asunto): con valor, el campo se
  ve con los campos del asunto, sin hito; sin valor, no se ve ni se pide.
- Nada de esto cambia el nombre de ninguna carpeta ni de ningún documento.
- Los guardados, por la cola de cada fichero (`ColaGuardado`, `App.enFila`), como hoy.

## 2. En la pantalla del hito (la mesa)

- Una tarjeta nueva, **«Campos de este hito»**, con el mismo aspecto que las demás tarjetas de la
  mesa. Lleva los campos de ese hito, cada uno con su control (el de `CamposClases.htmlControl`,
  según su clase), **para rellenarlo ahí mismo**: se guarda al cambiar, sin botón «Guardar», con el
  aviso verde de siempre. Un valor que no se entiende queda en ámbar y no se guarda, como en
  «Cambiar el asunto».
- En su título, **«+ Añadir campo»**, siempre a la vista. Sin campos, la tarjeta sale igualmente,
  pequeña, solo con el botón, sin dejar un hueco grande.
- El repintado de la tarjeta no puede tirar lo que se está escribiendo (`U.conservandoLoEscrito`).
- En modo consulta y en el ARCHIVO: sin botón, y los valores solo se leen.

## 3. «+ Añadir campo» desde el hito

Abre la misma ventana ancha de la fila 254 (`js/campos-catalogo.js`), con el título «Añadir un
campo al hito «<título del hito>»». Dos grupos:

- **Arriba, «Ya están en este asunto»**: los campos del asunto que no son de ningún hito. Elegir
  uno **lo lleva a este hito**, con su valor intacto. No se pide el valor otra vez.
- **Debajo, el catálogo de siempre** (de fichero, calculados, «Míos», con crear uno nuevo), sin
  los campos que el asunto ya tiene. Elegido uno, se pide su valor en el mismo paso, como en la
  fila 245.

No se ofrecen los campos que ya son de otro hito de este asunto (regla del valor único). Si
Francisco crea uno nuevo con un nombre igual o parecido a uno que ya está en otro hito, la guardia
de duplicados de siempre lo avisa.

Después, **«¿Dónde se guarda?»** (`js/donde-se-guarda.js`), igual que hoy:

- **«En el tipo <tipo corto>»** — marcada. Debajo, en pequeño: «El hito «<título>» lo tendrá en N
  asuntos abiertos de este tipo, vacío.» (o, con N = 0, «No hay más asuntos abiertos de este tipo.
  Valdrá para los próximos.»). Al aceptar, la entrada va a `porTipo` con `hito` = el `id` del paso
  de la guía. Si el campo ya estaba en el tipo sin hito, no se duplica: se le pone el hito.
- **«Solo en este asunto»**: va a `ficha.camposPropiosDelAsunto` con su `hito`. El tipo no cambia.
  Si el campo era del tipo y sin hito, queda del tipo, y la marca de hito se guarda solo en la
  ficha de este asunto (decide dónde; lo importante es que el tipo no cambie).
- **Sin pregunta**: si el hito es «solo de este asunto» (no está en la guía) o el asunto no tiene
  tipo, se guarda «solo aquí» directamente, y el aviso verde lo dice.
- Aviso verde de después, con **«Deshacer»** cuando ha ido al tipo, como en la fila 245: el tipo
  vuelve a como estaba y en este asunto el campo se queda en el hito, «solo aquí», con su valor.

## 4. El «⋮» de un campo de un hito

En la tarjeta de la mesa, cada campo lleva «⋮» con:

- **«Quitar de este hito»**: el campo pasa a ser del asunto, sin hito, con su valor. Si la marca
  estaba en el tipo, pregunta «¿Dónde se guarda?» como al añadir (en el tipo, para todos, o solo
  en este asunto).
- Si es «solo aquí»: además **«Pasar al tipo»** y **«Quitar»**, los de la fila 245 («Pasar al
  tipo» lo lleva al tipo con su hito).

## 5. En la ficha del asunto

La tarjeta «Campos del asunto» (fila 254):

- Primero, los campos sin hito, como hoy.
- Después, por cada hito que tenga campos con valor, **un rótulo pequeño con el título del hito**
  y sus campos debajo, en el orden de los hitos del asunto. Un campo de un hito sin valor no ocupa
  sitio en la ficha: se rellena en su hito.
- El «+ Añadir campo» de la ficha sigue añadiendo campos del asunto, sin hito.

## 6. En los demás sitios

- **«Cambiar el asunto»** (`App.pintarCamposEditar`): salen todos, como hoy; los de un hito, con el
  título de su hito en pequeño junto al nombre.
- **Nuevo asunto**: el bloque «Datos del asunto» **no pide los campos de un hito** (se rellenan
  cuando llega su hito). Su valor inicial, si lo tiene (`Campos.valorInicial`, de fichero o
  calculado), se guarda igual al crear.
- **Ajustes → un tipo → Campos**: cada campo lleva un desplegable pequeño **«Hito»**: «Ninguno
  (del asunto)» y los hitos de la guía del tipo. Se guarda al cambiar, como todo en esa pantalla.
  En un campo con hito no se ofrece la casilla «Obligatorio» (no se pide al crear).
- **Si se borra un paso de la guía** que tenía campos: esos campos pasan a ser del asunto, sin
  hito. No se borran.
- **Exportar, huecos de las plantillas de documento y de correo, sumas de «Por liquidar»**: no
  cambian. Comprueba que un campo de un hito sale en los tres igual que uno del asunto.
- **Unir dos tipos y cambiar el nombre de un tipo**: la marca `hito` viaja con la entrada del
  campo; si el paso no existe en la guía que se queda, el campo queda sin hito.

## Ficheros

- `js/campos.js`: `hito` en las entradas, `Campos.camposDeAsunto` y la función pura de reparto por
  hito. Si pasa de 600 líneas, pártelo.
- Nuevo `js/campos-de-hito.js` (o el nombre que encaje): la tarjeta «Campos de este hito», el
  rellenado en el sitio, su «⋮» y el «+ Añadir campo» del hito. Se engancha a la mesa por un punto
  previsto, sin envolver.
- `js/campo-desde-el-asunto.js`: aceptar un hito de destino (el paso del valor, «¿Dónde se
  guarda?» y «Deshacer» son los mismos; no se copian).
- `js/campos-catalogo.js`: el grupo «Ya están en este asunto» y el título, solo cuando se abre
  desde un hito.
- El fichero de la mesa del hito que coloca las tarjetas (ver `docs/contexto/HITO-MESA.md`): solo
  el hueco para la tarjeta nueva.
- El fichero de la ficha que pinta «Campos del asunto»: los rótulos por hito.
- `js/asuntos-editar.js` y `js/asuntos-nuevo.js`: lo del punto 6.
- `js/ajustes-tipo.js` (`App.construirSeccionCampos`): el desplegable «Hito».
- El sitio donde se borra un paso de la guía: quitar la marca `hito` de los campos del tipo.
- La hoja de estilos de la mesa o de los campos: la tarjeta y los rótulos. Nada de estilos en el
  JavaScript.
- `index.html` y la lista de ficheros de la copia sin internet: el `<script>` nuevo.
- `js/novedades.js` (regla 21), en el mismo commit del código: una línea, por ejemplo «Campos de un
  hito: en la pantalla de cada hito hay «+ Añadir campo»; se rellenan ahí y salen también en la
  ficha, debajo del nombre de su hito.»
- Datos de demostración: un tipo con guía y al menos un campo en uno de sus hitos, y dos asuntos
  abiertos de ese tipo.
- Pruebas: nueva `pruebas/campos-de-hito.mjs` con los puntos de abajo; pasar `pruebas/campos.mjs`,
  `pruebas/campo-desde-el-asunto.mjs` y las de la mesa que toque.
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, la línea de campos, **sustituyendo**),
  `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/contexto/HITO-MESA.md`, `docs/VOCABULARIO.md` («Campos
  de este hito»), `docs/HISTORIA.md` y `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

En la pantalla de cada hito hay una tarjeta «Campos de este hito» con «+ Añadir campo». Los campos
se rellenan ahí mismo, y salen también en la ficha, debajo del nombre de su hito, en exportar y en
los documentos. Un campo que ya estaba en el asunto se puede llevar a un hito desde esa misma
ventana.

## Cómo sabemos que está bien

1. Abrir un asunto abierto de un tipo con guía y entrar en un hito: hay una tarjeta «Campos de
   este hito» con «+ Añadir campo» a la vista.
2. Pulsarlo: se abre la ventana ancha con el título del hito; arriba «Ya están en este asunto» con
   los campos del asunto sin hito, y debajo el catálogo sin los que el asunto ya tiene.
3. Elegir un campo del catálogo, escribir un valor y aceptar: «¿Dónde se guarda?» con «En el tipo»
   marcada y «El hito «…» lo tendrá en N asuntos abiertos de este tipo, vacío». Aceptar: aviso
   verde con «Deshacer»; el campo sale en la tarjeta del hito con su valor.
4. Volver a la ficha: en «Campos del asunto», debajo de los campos sin hito, sale el título del
   hito y, debajo, ese campo con su valor.
5. Abrir otro asunto abierto del mismo tipo, en ese mismo hito: el campo está, vacío. Escribir un
   valor en la propia tarjeta: se guarda solo, con aviso verde, y al recargar sigue.
6. En el primer asunto, añadir otro campo al hito con «Solo en este asunto»: sale con «solo aquí»;
   en el otro asunto no está; en Ajustes del tipo no está.
7. Añadir un campo al hito en el tipo y pulsar «Deshacer»: en este asunto sigue en el hito, «solo
   aquí», con su valor; en Ajustes del tipo ya no está.
8. Desde la ventana, elegir uno de «Ya están en este asunto»: pasa a la tarjeta del hito con el
   valor que tenía, sin pedirlo otra vez.
9. «⋮» → «Quitar de este hito»: el campo vuelve con los del asunto en la ficha, con su valor.
10. Ajustes → el tipo → Campos: el campo del punto 3 lleva en «Hito» el título de su hito.
    Cambiarlo a «Ninguno (del asunto)»: en los asuntos pasa a verse con los campos del asunto.
11. Nuevo asunto de ese tipo: «Datos del asunto» no pide el campo del hito.
12. Exportar con la columna de ese campo: sale su valor. Una plantilla de documento con su hueco:
    sale relleno.
13. Un campo de clase Importe en un hito: escribir `abc` lo deja en ámbar y no se guarda; `125,50`
    se guarda y se ve `125,50 €`.
14. Borrar de la guía el paso que tenía el campo: el campo sigue en el tipo, sin hito, y en los
    asuntos conserva su valor.
15. En un hito «solo de este asunto», «+ Añadir campo» guarda sin preguntar, «solo aquí».
16. En el ARCHIVO y en modo consulta: la tarjeta se lee, sin «+ Añadir campo» ni «⋮».
