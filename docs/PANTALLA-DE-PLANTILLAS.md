# Pantalla de plantillas: todas juntas, en Herramientas (fila 320)

Cerrado con Francisco el 9-oct-2026. Sale de la idea 320, un aviso suyo del botón de soporte
(pantalla «Ajustes», propuesta de mejora). Es la primera de tres filas:

- **320 (esta)**: la pantalla, con la lista, ver, cambiar, crear, sustituir el fichero y borrar.
- **321**, `docs/PLANTILLAS-FUERA-DE-USO.md`: dejar una plantilla fuera de uso y volver a activarla.
- **322**, `docs/RETOCAR-UNA-PLANTILLA.md`: retocar el texto de una plantilla de Word.

Las tres van en este orden. La 321 y la 322 necesitan la pantalla de esta fila.

## Qué pidió

> Hemos creado un asistente para crear plantillas de word, pero desde el sistema no veo que
> plantillas existen ya.
> Debemos pensar sobre la conveniencia de tener un lugar para la gestión de las plantillas:
> verlas, ver con qué tipos e hitos están asociadas, editarlas, crearlas, inhabilitarlas ....

## Qué pasa hoy

- Las plantillas viven en `_GESTOR/plantillas.json`: las de correo en `lista` y las de Word en
  `documentos`. Los `.docx` están en `_GESTOR/PLANTILLAS`.
- Solo se ven dentro de la pantalla de cada tipo de asunto (Ajustes → un tipo → «Plantilla de
  correo» y «Plantilla de documento de Word»). No hay ningún sitio que las enseñe todas.
- Una plantilla de Word es una fila con un solo tipo de asunto. El mismo `.docx` puede estar en
  varias filas, una por tipo.
- Una plantilla de correo sin categoría ni tipo vale para cualquier asunto («Aviso de avance» y
  «Aviso de cierre», que crea la propia aplicación).
- Qué hito usa cada plantilla no se ve en ningún sitio. Está repartido: las tareas de un hito
  (`guion`) con `accion: 'generar'` o `'comunicar'` y `receta.plantilla`; el aviso «al terminar»
  de un hito (`avisarLoPidePlantilla`); el aviso «al cerrar» de un tipo
  (`avisarLoPideCierrePlantilla`); y los modelos de la biblioteca de hitos.
- En el alta de una plantilla de Word, el `.docx` se elige de un desplegable con los que ya hay
  en `_GESTOR/PLANTILLAS`. Para poner uno nuevo hay que copiarlo a mano a esa carpeta de Dropbox.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. Una pantalla única con **las plantillas de Word y las de correo**, cada una en su pestaña.
2. Va en **Herramientas → «Plantillas»**.
3. De cada plantilla se ve: nombre, tipo de documento, tipo de asunto, **los hitos que la usan** y
   su fichero.
4. Desde ahí se puede: **Ver**, **Cambiar** sus datos (en las de correo, también el texto),
   **Sustituir el fichero** (Word), crear una **Nueva plantilla** y **Borrar** (a la Papelera,
   como hoy).
5. Las plantillas se siguen viendo también dentro de cada tipo de asunto, como hoy.
6. El texto de dentro de un Word no se edita aquí: sigue en pie lo decidido el 25-sep-2026
   (fila 165). Lo pequeño se hará con «Retocar» (fila 322); lo grande, en Word y «Sustituir el
   fichero».

## Qué hay que hacer

### 1. El bloque de Herramientas y la vista a todo el ancho

- En Herramientas, un bloque nuevo **«Plantillas»**, justo debajo de «Control del registro». Pie
  del bloque: «Todas las plantillas de Word y de correo del centro, y qué hitos las usan». Dentro,
  una línea con cuántas hay («12 de Word · 30 de correo») y el botón **«Abrir las plantillas»**.
- El botón abre una vista a todo el ancho que sustituye a la lista de Herramientas mientras está
  abierta, igual que hace «Control del registro» (`js/control-registro-pantalla.js`: su
  `#control-registro-vista` y `#herramientas-lista`). Arriba, **«← Volver a Herramientas»**. Al
  volver a entrar en Herramientas se ve la lista de bloques, no la vista.
- El buscador de Ajustes («Buscar en Ajustes…») tiene que encontrar el bloque con «plantillas»,
  «Word» y «correo» (`js/ajustes-reparto.js`).

### 2. Saber qué hitos usan cada plantilla

Un módulo nuevo, **puro**, que recibe lo ya leído (`plantillas.json`, `guias.json`, la biblioteca
de hitos y los tipos) y devuelve, para cada `id` de plantilla, la lista de sitios donde se usa.
Cada sitio dice: el tipo de asunto, el título del hito y su número («Hito 2 de 5»), y de qué
forma se usa. Tiene que mirar, como mínimo:

- las tareas de cada hito de cada guía, entrando también en los hitos de dentro de las respuestas
  de una pregunta (`opciones[].pasos`): `accion: 'generar'` con `receta.plantilla` (Word) y
  `accion: 'comunicar'` con `receta.plantilla` (correo);
- el aviso «al terminar» de un hito y el aviso «al cerrar» de un tipo, con su plantilla de correo;
- los modelos de la biblioteca de hitos, con las mismas tareas (se enseñan como «Biblioteca ·
  título del modelo»).

Antes de darlo por bueno, busca en `js/` cualquier otro sitio que guarde el `id` de una
plantilla (`plantilla`, `Plantilla`) y añádelo. Lo que no guarda un `id` no cuenta: «Adjuntar
solo» de una plantilla de correo guarda un tipo de documento, no una plantilla.

Esta misma función la usará la fila 321 para su aviso. Déjala lista para eso.

### 3. La lista

- Dos pestañas: **«Word (N)»** y **«Correo (N)»**. Se recuerda la última abierta
  (`localStorage`, con `try/catch`).
- Una tabla **a todo el ancho de la pantalla**, densa, una línea por plantilla tal como está
  guardada. El título de la pantalla y la tabla terminan en el mismo borde derecho. Sin huecos
  vacíos a los lados.
- Columnas de **Word**: «Nombre» · «Tipo de documento» · «Tipo de asunto» (con su categoría en
  gris) · «Hitos que la usan» · «Fichero» · acciones.
- Columnas de **Correo**: «Nombre» · «Tipo de asunto» («Cualquier tipo» si no tiene) · «Hitos
  que la usan» · «Séneca» («Sí» si lleva texto propio para Séneca) · acciones.
- «Hitos que la usan»: hasta dos, cada uno como «Hito 2 · Notificar a la familia», y «y N más»,
  que despliega el resto ahí mismo. Si no la usa ninguno, **«Ninguno»** en gris. Si hay una forma
  ya hecha de abrir la guía de un tipo desde otra pantalla, cada hito es un enlace que la abre;
  si no la hay, es solo texto.
- Si el tipo de asunto de una plantilla ya no existe (ni con ese nombre ni como nombre antiguo de
  otro), su celda va en ámbar con **«Este tipo ya no existe»**.
- Las plantillas que crea la aplicación («Aviso de avance» y «Aviso de cierre») llevan la
  etiqueta **«De la aplicación»** junto al nombre.
- Orden: por nombre. Pulsar la cabecera «Tipo de asunto» ordena por tipo, y pulsar «Nombre»
  vuelve al orden por nombre.
- Arriba de la tabla, en una sola línea: **buscador** («Buscar entre las plantillas…», por
  palabras sueltas, sin tildes: nombre, tipo de asunto, tipo de documento, fichero e hitos), un
  desplegable **«Tipo de asunto»** («Todos», y solo los tipos que tienen alguna plantilla), una
  casilla **«Sin ningún hito»**, y a la derecha **«+ Nueva plantilla»**.
- Sin ninguna plantilla: «Todavía no hay ninguna plantilla de Word.» (o «de correo»), con el
  botón de crear. Sin resultados: «Ninguna plantilla tiene esas palabras.»

### 4. Lo que se hace con cada plantilla

En cada línea: **«Ver»**, **«Cambiar»** y un **⋮** con lo demás.

- **Ver (Word)**: abre el `.docx` tal cual, con sus huecos a la vista, en el visor de Word de la
  aplicación, solo para mirar: con «Imprimir» y cerrar, sin «Guardar PDF» (no hay asunto donde
  guardarlo). Si el fichero no está en `_GESTOR/PLANTILLAS`, aviso rojo «No encuentro «X» en la
  carpeta de plantillas.» y la línea lleva una marca ámbar **«Falta el fichero»** (se mira una
  vez al abrir la pantalla, con una sola lectura de la carpeta).
- **Ver (correo)**: un cuadro de solo lectura con el texto y, si lo tiene, el texto para Séneca.
- **Cambiar**: el mismo cuadro de hoy (`PlantillasDocumento.abrirCuadroDePlantillaDoc` y
  `PlantillasAjustes.abrirCuadroDePlantilla`), sin hacer otro. Al guardar, la lista se repinta.
- **+ Nueva plantilla**: el mismo cuadro, vacío, de la clase de la pestaña abierta.
- **⋮ → Sustituir el fichero…** (solo Word): se elige un `.docx` del ordenador. Se comprueba que
  se puede abrir como Word; si no, aviso rojo y no se cambia nada. Se guarda en
  `_GESTOR/PLANTILLAS` con un nombre que no pise a ninguno, y la plantilla pasa a apuntar a él.
  **El fichero anterior no se borra.** Si otras plantillas usan ese mismo fichero anterior, se
  pregunta antes: «Este Word lo usan también: A, B.» con **«Solo en esta»** · **«En todas»** ·
  **«Cancelar»**. Al terminar, aviso verde «Fichero sustituido.» con **«Deshacer»**, que vuelve a
  apuntar al fichero de antes. La plantilla sigue en los mismos tipos e hitos: su `id` no cambia.
- **⋮ → Borrar**: como hoy, a la Papelera, con la misma pregunta. Es el mismo código que el de la
  tarjeta del tipo: sácalo a una función común, no lo copies. En «Aviso de avance» y «Aviso de
  cierre», «Borrar» sale apagado, con el motivo al pasar el ratón: «La aplicación la vuelve a
  crear sola.»

### 5. El cuadro de una plantilla de Word: traer el fichero sin ir a Dropbox

En el cuadro de alta y de cambio de una plantilla de Word:

- La etiqueta «Fichero (.docx en _GESTOR/PLANTILLAS)» pasa a **«Fichero de Word»**.
- Junto al desplegable, un botón **«Traer un Word del ordenador…»**: elige un `.docx`, lo copia
  a `_GESTOR/PLANTILLAS` (mismo código que «Sustituir el fichero») y lo deja elegido en el
  desplegable. Si no se llega a crear la plantilla, el fichero se queda en la carpeta: no pasa
  nada.
- La nota «Con esas dos piezas y la fecha de hoy se monta el nombre del documento generado
  (js/nombres.js).» pierde el paréntesis: en pantalla no se nombran ficheros de código.
- Para elegir el fichero del ordenador usa un `<input type="file" accept=".docx">`, para que las
  pruebas y el revisor puedan darle un fichero.

### 6. Dentro de cada tipo de asunto

Las secciones de plantillas de la pantalla de un tipo se quedan como están. Solo ganan, cada
una, un enlace **«Ver todas las plantillas»** que abre la pantalla nueva en su pestaña, con el
desplegable «Tipo de asunto» ya puesto en ese tipo.

### 7. Solo consultar

Con «En este ordenador, solo consultar», la pantalla se abre y se puede mirar, buscar y «Ver».
«Cambiar», «+ Nueva plantilla», «Sustituir el fichero…», «Traer un Word del ordenador…» y
«Borrar» salen apagados.

### 8. La copia de demostración

Tiene que haber, al entrar con datos de demostración y sin pulsar nada más:

- al menos cuatro plantillas de Word: una que usa un hito (ya existe «Certificado de notas»,
  `js/demo/datos-hacer-hito.js`), una que no usa ninguno, y dos de tipos de asunto distintos que
  comparten el mismo `.docx`;
- al menos tres de correo: «Aviso de avance», «Aviso de cierre» y una de un tipo concreto que
  esté puesta en una tarea de comunicar de un hito.

## Lo que no cambia

- `plantillas.json`: ni su forma ni sus claves. Esta fila no añade ningún dato nuevo a una
  plantilla.
- Cómo se genera un documento o se prepara un correo.
- El asistente «Convertir en plantilla».
- «Cargar las plantillas del centro», que sigue en Herramientas → «Puesta a punto y
  reparaciones».
- La Papelera y lo que hoy sabe devolver.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-320`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/DOCUMENTOS-PDF.md` (apartado «Plantillas de documento de Word»),
  `docs/contexto/WORD-EN-LA-APP.md` y los ficheros de abajo.
- Ningún fichero pasa de 600 líneas. `js/plantillas-ajustes.js` tiene 526: lo nuevo no va ahí.
- Un módulo nuevo no envuelve a otro: se engancha por un punto previsto o uno nuevo.
- Guardar `plantillas.json`, siempre por `Plantillas.guardar` con función (relee antes de
  escribir). Primero el fichero `.docx`, después `plantillas.json`.
- Tras guardar, se repinta solo la lista, con contador de turno, y sin tirar lo que haya escrito
  en el buscador (`U.conservandoLoEscrito`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- plantillas herramientas ajustes`). La pasada completa, una sola vez, al final.

## Ficheros

- `js/plantillas-uso.js`: nuevo, puro (punto 2).
- `js/plantillas-pantalla.js`: nuevo (puntos 1, 3 y 7). Si pasa de 450 líneas, las acciones del
  punto 4 van a `js/plantillas-pantalla-acciones.js`.
- `js/plantillas-fichero.js`: nuevo (traer un `.docx` del ordenador, comprobarlo, guardarlo con
  nombre libre, sustituir y deshacer; puntos 4 y 5). `ficheroLibre` ya existe dentro de
  `js/convertir-en-plantilla.js`: si hace falta en los dos sitios, se saca aquí y el asistente lo
  llama.
- `js/plantillas-documento-ajustes.js`: el botón «Traer un Word del ordenador…», la etiqueta, la
  nota, el borrado sacado a función común y el enlace «Ver todas las plantillas».
- `js/plantillas-ajustes.js`: solo el enlace «Ver todas las plantillas» y, si hace falta, el
  borrado común.
- `js/herramientas.js`: cerrar la vista al entrar y pintar la línea del bloque.
- `js/ajustes-reparto.js`: el bloque nuevo en la tabla.
- `index.html`: el bloque `#bloque-plantillas`, la vista `#plantillas-vista` y la carga de los
  módulos nuevos, después de `js/plantillas-documento-ajustes.js`. Si la copia sin internet lleva
  su propia lista de ficheros, también ahí.
- `css/plantillas-pantalla.css`: nuevo.
- `js/demo/`: las plantillas del punto 8.
- `pruebas/plantillas-uso.mjs`: nueva, sin navegador. Comprueba el punto 2 con una guía que
  tenga: una tarea de generar, una de comunicar, un hito dentro de una respuesta, un aviso «al
  terminar», un aviso «al cerrar» y un modelo de la biblioteca; y una plantilla que no usa nadie.
- `pruebas/plantillas-pantalla.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. El bloque de Herramientas, su línea de cuántas hay y que el botón abre la vista.
  2. Las dos pestañas, con su número, y las columnas de cada una.
  3. «Certificado de notas» enseña su hito; la que no usa nadie dice «Ninguno».
  4. El buscador, el desplegable «Tipo de asunto» y la casilla «Sin ningún hito» filtran.
  5. «Ver» de una de Word abre el visor sin «Guardar PDF»; «Ver» de una de correo enseña su texto.
  6. «Cambiar» abre el cuadro de siempre y, al guardar otro nombre, la línea cambia.
  7. «+ Nueva plantilla» con «Traer un Word del ordenador…» (un `.docx` hecho en la prueba): el
     fichero queda en `_GESTOR/PLANTILLAS` y la plantilla nueva sale en la lista.
  8. «Sustituir el fichero…» en una de las dos que comparten `.docx`: sale la pregunta; con «Solo
     en esta», la otra sigue con el fichero de antes; «Deshacer» lo devuelve.
  9. Un fichero que no es un Word: aviso rojo y nada cambia.
  10. «Borrar» manda a la Papelera; en «Aviso de avance» está apagado.
  11. Con «solo consultar»: se ve y todo lo que cambia está apagado.
  12. El enlace «Ver todas las plantillas» de un tipo abre la vista con ese tipo en el
      desplegable.
- `js/novedades.js`: «En Herramientas hay una pantalla nueva, «Plantillas», con todas las
  plantillas de Word y de correo juntas: se ve qué hitos usan cada una, y desde ahí se crean, se
  cambian, se les sustituye el fichero y se borran. Al crear una de Word ya se puede traer el
  fichero del ordenador, sin copiarlo antes a Dropbox.»
- Al terminar: `docs/contexto/DOCUMENTOS-PDF.md` (la pantalla, «Sustituir el fichero» y el
  botón de traer), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (los módulos y las pruebas),
  `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 5, en la línea «Plantillas de correo
  (con texto propio para Séneca) y de Word por tipo…», se añade al final: «Todas juntas en
  Herramientas → «Plantillas» (fila 320, `js/plantillas-pantalla.js`, `js/plantillas-uso.js`):
  qué hitos usan cada una, ver, cambiar, sustituir el fichero y borrar.»

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que en Herramientas hay un bloque «Plantillas» con todas, de Word y de correo;
que cada una dice qué hitos la usan; y que al crear o cambiar una de Word ya puede traer el
fichero del ordenador, sin copiarlo a Dropbox.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir `?demo=1&auto=1` e ir a Herramientas. Debajo de «Control del registro» hay un bloque
   «Plantillas»; al abrirlo dice cuántas plantillas hay de Word y cuántas de correo, y tiene un
   botón «Abrir las plantillas».
2. Pulsar «Abrir las plantillas». La lista de Herramientas desaparece y se ve una pantalla a todo
   el ancho con «← Volver a Herramientas», dos pestañas, «Word» y «Correo», cada una con su
   número, y una tabla.
3. En la pestaña «Word», la tabla tiene las columnas «Nombre», «Tipo de documento», «Tipo de
   asunto», «Hitos que la usan» y «Fichero». Hay al menos cuatro plantillas.
4. La línea «Certificado de notas» enseña, en «Hitos que la usan», el nombre de un hito. Otra
   línea dice «Ninguno» en esa columna.
5. Marcar la casilla «Sin ningún hito»: «Certificado de notas» deja de verse. Desmarcarla: vuelve.
6. Escribir en el buscador una palabra del nombre de una plantilla: solo quedan las que la
   llevan. Borrar el buscador: vuelven todas.
7. Elegir un tipo en el desplegable «Tipo de asunto»: solo quedan las plantillas de ese tipo.
   Volver a «Todos».
8. Pulsar «Ver» en una plantilla de Word: se abre el documento, con sus huecos entre llaves a la
   vista, y no hay ningún botón «Guardar PDF». Cerrarlo.
9. Pulsar «Cambiar» en una plantilla de Word, cambiarle el nombre y guardar: la línea enseña el
   nombre nuevo, sin recargar la página.
10. En ese mismo cuadro, la etiqueta del fichero dice «Fichero de Word» y hay un botón «Traer un
    Word del ordenador…». Ningún texto del cuadro nombra un fichero de código.
11. Pulsar «+ Nueva plantilla», pulsar «Traer un Word del ordenador…» y darle un `.docx` (el
    revisor puede usar cualquiera de la carpeta `plantillas/` del repositorio). El fichero queda
    elegido en el desplegable. Rellenar nombre, tipo y tipo de documento y crear: la plantilla
    nueva sale en la lista.
12. En una de las dos plantillas que comparten el mismo fichero, abrir «⋮» y pulsar «Sustituir el
    fichero…», y darle otro `.docx`. Sale una pregunta que nombra a la otra plantilla, con «Solo
    en esta», «En todas» y «Cancelar». Pulsar «Solo en esta»: sale un aviso verde con «Deshacer»,
    la columna «Fichero» de esa línea cambia y la de la otra no.
13. Pulsar «Deshacer»: la columna «Fichero» vuelve a decir el nombre de antes.
14. Repetir «Sustituir el fichero…» dándole un fichero que no sea un Word (por ejemplo, un PDF
    cambiado de nombre a `.docx`): sale un aviso rojo y la línea no cambia.
15. Ir a la pestaña «Correo». Están «Aviso de avance» y «Aviso de cierre», con la etiqueta «De la
    aplicación» y «Cualquier tipo» en «Tipo de asunto». Hay otra plantilla que enseña un hito en
    «Hitos que la usan».
16. Pulsar «Ver» en una de correo: se lee su texto, sin poder cambiarlo.
17. Abrir «⋮» en «Aviso de avance»: «Borrar» está apagado. Abrir «⋮» en otra plantilla de correo
    y pulsar «Borrar»: pregunta, y al aceptar la línea desaparece y la plantilla está en
    Herramientas → Papelera.
18. Ningún texto de la tabla está cortado con «…», con la ventana a 1280 de ancho y a 1000. A
    1280, la tabla llega de un borde al otro de la pantalla y termina en el mismo borde derecho
    que el título.
19. Pulsar «← Volver a Herramientas»: se ve otra vez la lista de bloques. Ir a Inicio y volver a
    Herramientas: se ve la lista de bloques, no la tabla.
20. Ir a Ajustes, abrir un tipo de asunto que tenga plantilla de Word y pulsar «Ver todas las
    plantillas» en su sección: se abre la pantalla de plantillas en la pestaña «Word», con ese
    tipo puesto en el desplegable.
21. Ir a Ajustes y escribir «plantillas» en «Buscar en Ajustes…»: entre los resultados sale el
    bloque «Plantillas» de Herramientas, y al pulsarlo se llega a él.
22. Abrir `?demo=1&auto=1` con «En este ordenador, solo consultar» marcado y abrir las
    plantillas: la tabla se ve y «Ver» funciona; «Cambiar», «+ Nueva plantilla» y lo de dentro de
    «⋮» no se pueden pulsar.
23. [SOLO FRANCISCO] En el ordenador del centro: abrir Herramientas → «Plantillas» y mirar que
    están todas las plantillas del centro, que las que cuelgan de un hito lo dicen, y que «Ver»
    abre bien un Word de verdad del centro.
