# Etiquetas: buscador de personas, alineación vertical y filtro que se escribe

Fila 350 de `docs/COLA.md`. Idea 350 de Francisco (15-oct-2026), diseñada con él ese mismo día en el
chat. Amplía la pantalla Etiquetas de las filas 344 y 346 (`docs/ETIQUETAS.md`,
`docs/ETIQUETAS-TAMANO-CAMBIAR-ALINEAR.md`, `docs/contexto/ETIQUETAS.md`) y el filtro común del alumnado
(`js/repartir-filtro.js`, filas 342 y 345).

## De dónde sale esto

El texto de la idea, tal cual:

> En relación a la Herramienta Etiquetas propongo las siguientes mejoras:
> 1º) Que tengamos un buscador que metiendo los tres primeros caracteres o letras nos busque el alumno
> o el personal según la opción elegida.
> 2º) Poder alinear los textos en la vertical, superior, centrada o inferior.
> 3º) En los filtros de selección de los elementos a etiquetar, que no tengamos que hacer scroll si no
> escribir y que nos vaya dando las opciones que coincidan.
> 4º) En relación a lo anterior deberíamos poder tener un selector que nos permita selecciónar o
> deseleccionar el resultado del filtro. Por defecto, todos seleccionados.

Decisiones de Francisco al diseñarla:

- El buscador **suma** personas a lo que da el filtro. Si no hay ningún filtro puesto, las etiquetas son
  solo de las personas elegidas con el buscador.
- La alineación vertical es **para todo el texto de la etiqueta junto** (el bloque de renglones), no
  renglón a renglón.
- Las mejoras del filtro (puntos 3 y 4) van **en todos los sitios donde sale el filtro común**, no solo
  en Etiquetas.

## Lo que se pide

### 1. Buscador de personas en Etiquetas

- En la zona «A quién» de Etiquetas, una caja **«Buscar a una persona…»**, con el alumnado o el personal
  según la opción elegida arriba (la misma que decide qué filtro sale).
- Busca a partir de **3 caracteres**, sin distinguir mayúsculas ni tildes, por apellidos y nombre (en
  cualquier orden de palabras sueltas) y, en alumnado, también por Nº escolar; en personal, también por
  los 4 últimos del documento. Hasta 10 resultados debajo, con nombre y unidad (alumnado) o
  departamento (personal).
- Al elegir uno (clic o Intro), se **añade** a la lista de personas de las etiquetas y la caja se vacía
  para buscar el siguiente. Si ya estaba, no se repite (se dice en gris «Ya está en la lista»).
- Con filtro puesto: las personas del filtro **más** las elegidas con el buscador. Sin filtro: solo las
  elegidas con el buscador. Hoy, sin filtro, ¿salen todas? Comprobarlo en `js/etiquetas-pantalla.js`:
  si hoy «sin filtro» significa «todo el alumnado», a partir de ahora, cuando hay al menos una persona
  elegida con el buscador y ningún criterio de filtro, solo salen esas.
- Las elegidas con el buscador salen en la lista con casillas del punto 4, marcadas, con una marca
  pequeña «añadida» para distinguirlas de las del filtro, y una ✕ para quitarlas.
- «Pegar una lista» sigue como hoy y suma igual que el buscador.

### 2. Alineación vertical del texto de la etiqueta

- En el formulario de un diseño (`js/etiquetas-editor.js`), junto a «Alinear todo», una fila
  **«Colocar el texto:»** con tres botones: **Arriba**, **Centro** y **Abajo**. Guarda
  `vertical: 'arriba' | 'centro' | 'abajo'` en el diseño.
- Mueve el bloque de renglones entero dentro de la etiqueta, respetando el mismo relleno interior
  (`RELLENO_MM`) arriba y abajo. No cambia la alineación de cada renglón (izquierda, centro, derecha).
- Los diseños de la app y los guardados antes, sin `vertical`, se leen como hoy (comprobar cómo coloca
  hoy el texto `js/etiquetas-hoja.js`: el valor por defecto es el de hoy, para que nada guardado cambie).
  Cambiar un diseño de la app sigue el camino de la fila 346 (se guarda como copia).
- Vista previa (`js/etiquetas-hoja.js`) y PDF (`js/etiquetas-pdf.js`) colocan igual; la letra que
  `ajustar` reduce se mide antes de colocar el bloque.
- En la lista de «Qué lleva cada etiqueta», junto al diseño, « · texto centrado» o « · texto abajo»
  cuando no sea el valor por defecto.

### 3. El filtro se escribe, no se desplaza

En **todos los sitios donde sale el filtro común** (`js/repartir-filtro.js`: Etiquetas, «Repartir entre
terceros» de un PDF, «Repartir ficheros entre terceros» y «Añadir varios relacionados») y en los
selectores propios de Etiquetas para el personal (clase y departamento):

- Cada criterio con lista de valores (unidad, nivel, enseñanza, materia, departamento…) pasa de
  desplegable a **caja en la que se escribe**: al escribir salen debajo solo los valores que contienen
  lo escrito (sin distinguir mayúsculas ni tildes); con la caja vacía y el foco dentro, salen todos.
  Flechas e Intro para elegir, Esc para cerrar la lista.
- Si el criterio admite varios valores, los elegidos quedan como pastillas con su ✕ junto a la caja.
- Lo que se guarda o se hace con el filtro no cambia: solo cambia cómo se elige el valor.
- Una sola pieza común (por ejemplo `js/caja-con-sugerencias.js`) para todos esos sitios, no una copia
  por pantalla.

### 4. Lista con casillas del resultado del filtro

También en todos los sitios donde sale el filtro común:

- Debajo del filtro, la **lista de las personas que cumple el filtro**, cada una con su casilla,
  **todas marcadas al principio**. Encima, «Marcar todas» · «Desmarcar todas» y la cuenta
  «N de M marcadas».
- Solo cuentan las marcadas: en Etiquetas, solo ellas tienen etiqueta; en los repartos, solo ellas
  entran en el filtro (y en la línea de cuentas de la fila 342); en «Añadir varios», «Señalar los N»
  señala solo las marcadas, con N = marcadas.
- Al cambiar el filtro, la lista se rehace: las personas nuevas entran marcadas; las que siguen y se
  habían desmarcado, siguen desmarcadas mientras el cuadro esté abierto.
- «Exportar la lista ▾» (fila 345) exporta solo las marcadas.
- La lista va dentro del cuerpo del cuadro que se desplaza, con el pie de botones fijo (regla de la
  fila 341). Con muchas personas (más de 200), la lista no frena la pantalla.

## Qué ficheros tocar

`js/repartir-filtro.js` y quien lo usa (`js/etiquetas-pantalla.js`, los cuadros de reparto y de «Añadir
varios», `js/filtro-exportar.js`), `js/etiquetas-editor.js`, `js/etiquetas-disenos.js`,
`js/etiquetas-hoja.js`, `js/etiquetas-pdf.js`, un fichero nuevo para la caja con sugerencias y
`css/estilos.css` si hace falta. Ningún fichero de `js/` pasa de 600 líneas. Poner al día
`docs/contexto/ETIQUETAS.md`, el hijo de `docs/contexto/` del filtro común y las líneas de Etiquetas y de
«Terceros relacionados» de `docs/CONTEXTO-CORTO.md`.

## La prueba

Una prueba nueva `pruebas/etiquetas-350.mjs` (y lo que haga falta en las del filtro):

1. Buscador: con «ver» salen las personas de la demo que lo contienen; con 2 letras no sale nada.
   Elegir una sin filtro deja una sola etiqueta; con filtro de una unidad, la elegida se suma a las de
   la unidad; elegirla dos veces no la repite.
2. Alineación vertical «Abajo»: en el PDF, el último renglón termina a `RELLENO_MM` del borde inferior
   de la casilla; «Arriba», el primero empieza a `RELLENO_MM` del superior; un diseño sin `vertical`
   sale igual que antes de esta fila.
3. Filtro que se escribe: en la caja de unidad, al escribir «2º» solo salen las unidades que lo
   contienen; elegir con Intro pone el criterio y el resultado es el mismo que con el desplegable de
   antes. Lo mismo en un cuadro de reparto y en «Añadir varios».
4. Casillas: todas marcadas al principio; desmarcar dos baja la cuenta y las etiquetas en dos;
   «Desmarcar todas» deja 0; en «Añadir varios», «Señalar los N» señala solo las marcadas;
   exportar a Excel solo trae las marcadas.
5. Las pruebas de etiquetas de las filas 344 y 346 y las del filtro de las filas 342 y 345 siguen en
   verde.

## Novedades

Una línea en `js/novedades.js`: «Etiquetas: buscador de personas a partir de tres letras y texto
colocado arriba, en el centro o abajo. En todos los filtros del alumnado se escribe para elegir y las
personas salen con su casilla, todas marcadas.»

## Para Francisco al terminar

Nada que hacer.

## Cómo sabemos que está bien

- En Etiquetas, con tres letras el buscador encuentra alumnado o personal según lo elegido; lo elegido
  se suma al filtro y, sin filtro, solo salen las personas elegidas.
- Un diseño coloca su texto arriba, en el centro o abajo, igual en la vista previa y en el PDF; lo
  guardado antes sale igual que ayer.
- En todos los sitios con el filtro común, cada criterio se elige escribiendo, sin desplazarse por una
  lista larga.
- El resultado del filtro sale como lista con casillas, todas marcadas al principio, con «Marcar
  todas» y «Desmarcar todas»; solo las marcadas cuentan (etiquetas, repartos, «Añadir varios» y
  exportar).
- Las pruebas de las filas 342, 344, 345 y 346 siguen en verde.
