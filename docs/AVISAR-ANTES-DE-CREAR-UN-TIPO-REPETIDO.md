# Avisar antes de crear un tipo de asunto repetido (fila 279)

Cerrado con Francisco el 6-oct-2026, en la misma conversación que la fila 277
(`docs/TIPOS-QUE-SON-EL-MISMO.md`). **Esta fila va después de la 277**: usa su módulo
`js/tipos-parecidos.js`. Si la 277 no está HECHA, esta no se empieza: se marca BLOQUEADA con ese
motivo.

## Para qué

La fila 277 arregla los tipos repetidos que ya existen. Esta evita que se creen. Francisco: «Debemos
estudiar estos casos en los que un Tipo de Asunto se cambia, para evitar duplicidades, por otro».

Hoy la app ya avisa de nombres parecidos al crear un tipo, pero con tres huecos:

- Ninguna puerta mira los **nombres antiguos** (`tipo.alias`) ni los **nombres cortos** de los
  tipos que ya existen. Se puede crear «ANULACIÓN» aunque sea como se llamaba antes «ANULACIÓN DE
  MATRÍCULA», y además `App.crearTipo` le quita la lápida a ese nombre (`Borrados.revivir`).
- Hay puertas sin ninguna guardia: «Añadir X a la lista» de la ficha de un asunto, «Cargar la
  biblioteca del centro» y devolver un tipo desde la papelera.
- «Cambiar el nombre» de un tipo, si el nombre nuevo ya existe, solo dice «Ya hay otro tipo con
  ese nombre.» y no ofrece lo que casi siempre se quiere en ese momento: unirlos.

## Qué quiere Francisco

Al crear un tipo nuevo, en cualquier sitio donde se pueda crear: si el nombre se parece a uno que
existe o a un nombre antiguo, la app lo dice **antes** de crearlo y ofrece usar el que hay.
**Avisa, no impide.**

## Qué hay que hacer

### 1. Una sola pregunta, en `js/tipos-parecidos.js`

Una función (por ejemplo `TiposParecidos.paraNombreNuevo(nombre, salvoEsteTipo)`) que, para un
nombre que se quiere poner, devuelve qué tipos de los que existen tienen que ver con él y por qué:

- **igual**: mismo nombre escrito de otra manera (`U.parecidos` con `igual`), o el nombre es el
  **nombre corto** de otro tipo.
- **antiguo**: el nombre está en el `alias` de otro tipo (comparando con `TiposNombre.n`).
- **parecido**: la regla «se parecen» de la fila 277, más lo que ya da hoy `U.parecidos` y
  `BuscarOCrear.cercanos`.

Y un solo cuadro de confirmación para todas las puertas (ampliando
`BuscarOCrear.confirmarParecidos`, que ya enseña los parecidos y deja ir a cada uno; no se escribe
otro cuadro distinto). Ojo: ese cuadro lo usan también los tipos de **documento**, que se quedan
con su título y sus textos de hoy. Para tipos de asunto, título **«¿Es otro tipo de verdad?»**.
Dentro:

- «Vas a crear «X».»
- Si X es nombre antiguo de Y, una línea: **«X» es como se llamaba antes «Y».** Y la nota: «Si lo
  creas, «X» deja de ser el nombre antiguo de «Y»: las carpetas del archivo que se llaman «X»
  contarán como del tipo nuevo.»
- La lista de tipos parecidos (cuatro como mucho), cada uno con su categoría y **su botón**: el
  que diga cada puerta (tabla de abajo).
- Botón de seguir: **«Crear de todas formas»**. Y «Cancelar».

**Si se crea de todas formas:**

- Si X era nombre antiguo de Y: en el mismo guardado de tipos, X sale de `Y.alias`. Si no, la
  pasada de la fila 277 los uniría al momento.
- Cada pareja (X, parecido que se enseñó) queda apuntada como «No son el mismo» en el fichero de
  la fila 277: quien lo crea acaba de decir que es otro. Así Inicio no vuelve a preguntar por ella.

**«Igual» no se puede crear**, como hoy: aviso rojo «Ya existe: Y» con el botón de la puerta. Lo
nuevo es que el nombre corto de otro tipo también cuenta como igual (dos tipos darían carpetas
con el mismo nombre de tipo).

### 2. Las puertas

| Puerta | Fichero | Hoy | Con esta fila |
|---|---|---|---|
| Nuevo asunto → «+ Crear tipo nuevo» | `js/tipo-al-vuelo.js` | Aviso en vivo «Se parece a: …» (solo texto) y `U.dejaCrear` | El aviso en vivo mira también nombres antiguos y cortos, y cada parecido lleva **«Usar este»** (lo deja elegido, como hoy con «Ya existe»). Al crear, el cuadro común, con «Usar este» |
| Ajustes → caja «Buscar o crear» | `js/ajustes.js` (`App.crearTipoDesdeCaja`), `js/buscar-o-crear.js` | `confirmarParecidos` con «Verlo», solo contra nombres | El cuadro común, con **«Verlo»**. En la zona de debajo de la caja, si lo escrito es nombre antiguo o corto de un tipo: «Ya existe: Y (antes se llamó X)», con «Verlo» |
| «Cambiar el asunto» y Nuevo asunto, línea del tipo → «crear» | `js/tipo-en-linea.js` (`crearDesdeEdicion`) | `confirmarParecidos` sin botón por fila | El cuadro común, con **«Usar este»** (deja ese tipo elegido en la línea) |
| Ficha de un asunto → «Añadir X a la lista» | `js/ficha-bloques.js` (`anadirTipo`) | Solo mira si hay otro con el nombre idéntico | El cuadro común, con **«Verlo»** |
| Ajustes → un tipo → «Cambiar el nombre» | `js/tipos-nombre.js` (`App.renombrarTipo`) | Si existe: «Ya hay otro tipo con ese nombre.» | Ver punto 3 |
| Herramientas/Mantenimiento → cargar la biblioteca del centro | `js/cargar-biblioteca.js` (`fusionarTipos`) | Casa por nombre largo o corto | Ver punto 4 |
| Papelera → devolver un tipo | `js/papelera-devolver.js` | Lo devuelve sin mirar | Ver punto 4 |

Las tres primeras puertas no pueden acabar con dos preguntas seguidas: donde hoy se llama a
`U.dejaCrear` o a `confirmarParecidos` para un tipo de asunto, se llama al cuadro común en su
lugar, no además.

### 3. «Cambiar el nombre» a uno que ya existe o se parece

En `App.renombrarTipo`, con el nombre nuevo ya escrito y antes de cambiar nada:

- **Ya hay un tipo que se llama así** (igual, o es su nombre corto): en vez del aviso rojo, un
  cuadro **«Ya hay un tipo «Y»»**: «¿Quieres unir «T» con «Y»? «T» desaparece y todo pasa a «Y».»,
  con el mismo resumen de «Unir con otro tipo» (asuntos abiertos que pasan, la guía que vale, el
  ARCHIVO no se toca). Botones **«Unir con él»** y «Cancelar». «Unir con él» hace
  `TiposUnir.unir(T, Y)` y la función común de después de unir (fila 277).
- **Es el nombre antiguo de otro tipo Y, o se parece a otros**: el cuadro común, con título
  «¿Es otro tipo de verdad?», el botón **«Unir con él»** en cada fila y, para seguir, **«Cambiar
  el nombre de todas formas»** (con la misma regla: sale del `alias` de Y y las parejas quedan
  como «No son el mismo»).
- Volver a ponerle al tipo uno de **sus propios** nombres antiguos no pregunta nada.

### 4. Las dos puertas calladas

- **Cargar la biblioteca del centro** (`fusionarTipos`): una entrada cuyo nombre largo o corto es
  el nombre antiguo (`alias`) de un tipo que existe **es ese tipo**: se usa para el mapa y no se
  crea ninguno nuevo. Sin preguntas (es una carga en bloque).
- **Devolver un tipo desde la papelera**: si su nombre es hoy el nombre de otro tipo, su nombre
  corto o su nombre antiguo, un cuadro: «Ya hay un tipo «Y» (antes se llamó «X»). Si devuelves
  «X», habrá dos.», con «Devolverlo de todas formas» (misma regla del `alias`) y «Cancelar».

### 5. Que un nombre antiguo no vuelva solo

En septiembre un nombre viejo volvió a la lista al guardar desde el otro ordenador
(`App.fusionarConDisco`; se tapó con una lápida en `App.renombrarTipo`, fila 79). Comprobarlo con
una prueba, sin cambiar nada si pasa:

- Dos ventanas con la misma lista de tipos en memoria. En la primera se cambia el nombre de T a
  T2. La segunda, sin recargar y con T todavía en su memoria, guarda cualquier otra cosa de tipos
  (por ejemplo, el plazo de otro tipo). Al releer del disco, **T no está**: solo T2, con «antes:
  T».
- Lo mismo con «Unir con otro tipo» en vez de cambiar el nombre.

Si T vuelve, se arregla en esta fila donde toque (`js/borrados-fusion.js` o el guardado de tipos)
y se dice en el mensaje final.

## Qué NO se toca

- Lo de la fila 277: la pasada que une sola, la regla «se parecen» y el aviso de Inicio. Aquí solo
  se usan.
- Los tipos de documento, los campos y los responsables: sus guardias (`U.dejaCrear`) siguen como
  están. Esta fila es solo de tipos de asunto.
- El nombre corto de un tipo (`js/ajustes-tipo.js`, `pintarAvisoCorto`): sigue como está.
- La forma de `tipos.json`. **No hay nada que migrar.**

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md`,
  `docs/TIPOS-QUE-SON-EL-MISMO.md` (fila 277), `docs/AVISO-DE-PARECIDOS-AL-CREAR.md`,
  `docs/BUSCAR-O-CREAR-EN-AJUSTES.md` (fila 250) y los ficheros de la tabla basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas.
- Un solo cuadro (`U.preguntar`) a la vez. Nada envuelve nada.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` («Cambiar el nombre», no
  «renombrar»; «borrar»/«quitar»).
- Rama `fila-279`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs avisar-antes
  tipos-que-son buscar-o-crear tipo-desde tipo-en-linea tipos-unir cargar`); la pasada completa,
  una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/tipos-parecidos.js` (o su segundo fichero): `paraNombreNuevo` y lo que haga falta para
  apuntar parejas «No son el mismo» desde fuera.
- `js/buscar-o-crear.js`: el cuadro común (botón por fila, la línea del nombre antiguo, la nota).
- `js/tipo-al-vuelo.js`, `js/ajustes.js`, `js/tipo-en-linea.js`, `js/ficha-bloques.js`,
  `js/tipos-nombre.js`, `js/cargar-biblioteca.js`, `js/papelera-devolver.js`: cada puerta.
- `js/solo-consulta.js`: los textos nuevos de acción («Crear de todas formas», «Cambiar el nombre
  de todas formas», «Unir con él», «Devolverlo de todas formas»), si no los coge ya la lista.
- Nueva: `pruebas/avisar-antes-de-crear-tipo.mjs` (con navegador): cada puerta con un nombre
  antiguo, con un nombre corto y con un parecido; «Crear de todas formas» saca el nombre del
  `alias` y apunta la pareja; «Cambiar el nombre» a uno que existe une. Y la prueba del punto 5
  (dos ventanas).
- Las pruebas que den por hecho los textos de antes al crear un tipo de asunto («¿Es otro de
  verdad?», «¿Seguro que no es ninguno de estos?», «Añadirlo igualmente», «Crearlo igualmente»):
  se ponen al día.
- `js/novedades.js`: «Al crear un tipo de asunto o cambiarle el nombre, la app avisa si ya hay uno
  parecido o si ese era el nombre antiguo de otro, y deja usar el que hay o unirlos ahí mismo.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la misma línea de la fila 277, sin alargar),
  `docs/CONTEXTO.md` (el párrafo «La guardia contra duplicados de nombres»),
  `docs/contexto/CAMPOS-Y-TIPOS.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al crear un tipo de asunto, en cualquier sitio, la app avisa si se parece a
uno que hay o si ese era el nombre antiguo de otro, con un botón para usar el que hay; que
«Cambiar el nombre» a uno que ya existe ofrece unirlos; y, si el punto 5 encontró un fallo, cuál.

## Cómo sabemos que está bien

En la copia de demostración. Elegir un tipo de asunto con algún asunto abierto; aquí se llama T.

1. Ajustes → T → «Cambiar el nombre» → «ZZ TIPO DOS» → «Cambiar». Su tarjeta dice «antes: T».
2. Ajustes → caja «Buscar o crear»: escribir T. Debajo de la caja se lee que ya existe «ZZ TIPO
   DOS» y que antes se llamó T, con «Verlo». «Verlo» abre la pantalla de «ZZ TIPO DOS».
3. Nuevo asunto → «+ Crear tipo nuevo» → escribir T en el nombre: bajo la caja sale, en ámbar, que
   T es como se llamaba antes «ZZ TIPO DOS», con «Usar este». Al pulsarlo, se cierra y «ZZ TIPO
   DOS» queda elegido como tipo del asunto nuevo.
4. Otra vez «+ Crear tipo nuevo», escribir T y pulsar crear: se abre el cuadro «¿Es otro tipo de
   verdad?», con la línea de que T es como se llamaba antes «ZZ TIPO DOS», la nota sobre las
   carpetas del archivo y los botones «Crear de todas formas» y «Cancelar». Solo un cuadro, no dos
   seguidos.
5. «Crear de todas formas»: el tipo T se crea. Pasados diez segundos sigue existiendo (la app no
   lo ha unido sola), y la tarjeta de «ZZ TIPO DOS» ya no dice «antes: T».
6. En Inicio, el aviso de tipos parecidos no incluye la pareja T / «ZZ TIPO DOS» (si se parecen
   por nombre) ni la ha añadido por lo del punto 5.
7. Ajustes → caja «Buscar o crear»: escribir «ZZ TIPO DOS BIS» y crear: se abre el mismo cuadro,
   con «ZZ TIPO DOS» en la lista y «Verlo» en su fila. «Crear de todas formas» lo crea.
8. Abrir un asunto abierto → «Cambiar el asunto» → en el tipo, «Cambiar» → escribir «ZZ TIPO DOS
   TER» → «crear»: el cuadro, con «Usar este» en la fila de «ZZ TIPO DOS». Al pulsarlo, «ZZ TIPO
   DOS» queda elegido en la línea del tipo y no se crea ninguno.
9. Ajustes → «ZZ TIPO DOS BIS» → «Cambiar el nombre» → escribir «ZZ TIPO DOS» → «Cambiar»: sale el
   cuadro «Ya hay un tipo «ZZ TIPO DOS»», con el resumen (cuál desaparece, asuntos abiertos que
   pasan, el ARCHIVO no se toca) y «Unir con él».
10. «Unir con él»: aviso verde «Unidos. …». «ZZ TIPO DOS BIS» ya no existe en Ajustes.
11. Ajustes → T → «Cambiar el nombre» → «ZZ TIPO DOS NUEVO» → «Cambiar»: el cuadro «¿Es otro tipo
    de verdad?», con «Unir con él» en la fila de «ZZ TIPO DOS» y «Cambiar el nombre de todas
    formas». Con «Cancelar», T se sigue llamando T.
12. Crear en «Buscar o crear» un tipo con un nombre que no se parece a ninguno («ZZ QQ XYZ»): se
    crea sin ningún cuadro de parecidos (solo pregunta la categoría), como antes.
13. Un tipo de **documento** con nombre parecido a otro: su aviso es el de antes (no el cuadro
    nuevo).
14. (Lo cubre la prueba `avisar-antes-de-crear-tipo`, no el revisor.) «Añadir X a la lista» de la
    ficha, cargar la biblioteca del centro, devolver un tipo desde la papelera, y las dos ventanas
    del punto 5.
