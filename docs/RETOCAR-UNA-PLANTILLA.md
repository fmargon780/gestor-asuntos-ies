# Retocar una plantilla de Word (fila 322)

Cerrado con Francisco el 9-oct-2026. Tercera de las tres filas que salen de la idea 320. Va
después de `docs/PANTALLA-DE-PLANTILLAS.md` (fila 320): necesita su pantalla y su módulo
`js/plantillas-fichero.js`. No depende de la fila 321.

## Qué pidió

En su aviso, Francisco pedía poder «editar» las plantillas. Hoy, para corregir una frase de una
plantilla de Word hay que abrir el `.docx` en Word, guardarlo y volver a ponerlo en su sitio.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. **No hay editor de Word dentro de la aplicación.** Sigue en pie lo decidido el 25-sep-2026
   (fila 165): el único que respeta bien un Word obliga a pagar licencia o a enseñar el código.
2. A cambio, un botón **«Retocar»** en cada plantilla de Word. Abre el asistente de plantillas
   sobre la plantilla que ya existe. Se selecciona un trozo y se elige: **cambiarlo por un dato**,
   **cambiarlo por otro texto que se escribe**, o **quitar el párrafo**.
   (El asistente ya tenía «Quitar del documento», que quita solo el trozo; se quedan las dos.)
3. Sirve para corregir una frase, una errata o un dato fijo sin salir de la aplicación.
4. Lo grande sigue yendo por Word y «Sustituir el fichero»: añadir párrafos nuevos, tablas o
   cambiar el formato.
5. «Cambiar por otro texto» se añade también al asistente «Convertir en plantilla».

## Qué pasa hoy

- «Convertir en plantilla» (fila 280, `docs/CONVERTIR-EN-PLANTILLA.md`) parte de un documento de
  un asunto abierto. En su primer paso, al seleccionar texto con el ratón sale un menú con
  «Cambiar por un dato…», «Esto se pregunta cada vez» y «Quitar del documento» (quita ese trozo,
  no el párrafo). Los cambios se aplican siempre desde el original, con `js/docx-sustituir.js`,
  que también sabe quitar párrafos enteros por su posición (`quitarParrafos`).
- Ese asistente no se puede abrir sobre una plantilla ya guardada.
- No hay forma de cambiar un trozo por otro texto: solo por un dato.

## Qué hay que hacer

### 1. «Cambiar por otro texto…», en el asistente de siempre

En el menú que sale al seleccionar texto en «Convertir en plantilla», una opción más, la segunda:
**«Cambiar por otro texto…»**.

- Abre un cuadro pequeño, «Cambiar este texto», con el trozo seleccionado ya escrito en una caja
  para corregirlo, y debajo «Antes: <el trozo>». Botones «Cambiar» y «Cancelar».
- Con la caja vacía o igual que antes, «Cambiar» no hace nada.
- El cambio entra en el grupo «Lo que has marcado tú», como los demás, con «<antes> → <ahora>» y
  cuántas veces aparece, y se puede quitar igual que los demás.
- Si el texto nuevo lleva un hueco escrito a mano (`{nombre}`), se respeta tal cual.
- Es el mismo mecanismo que cambiar por un dato: un texto por otro, dentro de un párrafo.

### 2. «Retocar», sobre una plantilla que ya existe

Dónde sale:

- En Herramientas → «Plantillas», pestaña «Word»: un botón **«Retocar»** en cada línea, entre
  «Ver» y «Cambiar».
- En la pantalla de un tipo de asunto, en la tarjeta de cada plantilla de Word: **«Retocar»**,
  junto a «Cambiar».
- Apagado con «solo consultar». Apagado, con su motivo al pasar el ratón, si el fichero de la
  plantilla no está en la carpeta de plantillas.

Qué abre: una pantalla completa con el mismo aspecto que el primer paso de «Convertir en
plantilla». A la izquierda, el Word de la plantilla **tal cual, con sus huecos resaltados**. A la
derecha, una columna con:

- el título «Retocar «<nombre de la plantilla>»»;
- una línea de ayuda: «Selecciona con el ratón el trozo que quieras cambiar.»;
- la lista **«Lo que has cambiado»**, vacía al entrar («Todavía no has cambiado nada.»);
- al pie, en gris: «Para añadir párrafos, tablas o cambiar el formato: corrígelo en Word y usa
  «Sustituir el fichero».»

Aquí **no** salen las propuestas del asistente («Datos de este asunto», «Quien firma», «Para que
sirva con hombre y con mujer»), ni el membrete, ni los datos de la plantilla (nombre, tipo, hito,
quién firma): no hay asunto del que sacarlas, y los datos se cambian con «Cambiar».

Al seleccionar un trozo (mismas reglas: dentro de un solo párrafo, tres caracteres o más), el
mismo menú, con cinco opciones:

- **«Cambiar por un dato…»**: el buscador de huecos de siempre.
- **«Cambiar por otro texto…»**: el cuadro del punto 1.
- **«Esto se pregunta cada vez»**: como en el asistente.
- **«Quitar del documento»**: como en el asistente. Quita ese trozo, en todos los sitios donde
  aparezca.
- **«Quitar el párrafo entero»**: nueva, solo aquí. Quita el párrafo donde está la selección
  (`quitarParrafos` de `js/docx-sustituir.js`, por su posición). Su línea en la lista enseña el
  principio del párrafo («Quitar el párrafo: «En caso de no presentar…»»). Si no se puede saber
  con seguridad qué párrafo del Word es el seleccionado (dos párrafos con el mismo texto y sin
  forma de distinguirlos), aviso ámbar «No sé cuál de los párrafos iguales quieres quitar.
  Quítalo en Word y usa «Sustituir el fichero».» y no se quita nada.

Se puede seleccionar un hueco entero (`{nombre}`) y cambiarlo por otro dato o por un texto. Si el
mecanismo de hoy lo impide, arréglalo aquí; si no se puede sin tocar cómo se rellenan las
plantillas, deja escrito el motivo en la nota de la fila y que el menú, sobre un hueco, ofrezca
solo lo que funcione.

Cada cambio aparece en «Lo que has cambiado» con «<antes> → <ahora>», las veces que aparece, y
una ✕ para deshacerlo. El documento de la izquierda se vuelve a pintar con el cambio hecho, y el
trozo cambiado queda resaltado. Pulsar una línea de la lista lleva al sitio del documento.

Si el trozo aparece más de una vez, se pregunta como hace hoy el asistente (o, si hoy no
pregunta, se cambia igual que hace él y la línea dice las veces).

### 3. Guardar

Abajo, **«Cancelar»** y **«Guardar los cambios»** (apagado mientras no haya ningún cambio).

- «Guardar los cambios» aplica todos los cambios **desde el fichero original**, de una vez, y
  comprueba que el resultado se puede abrir como Word. Si no, aviso rojo y no se guarda nada.
- El resultado se guarda como **un fichero nuevo** en `_GESTOR/PLANTILLAS`, con un nombre que no
  pise a ninguno, y la plantilla pasa a apuntar a él. **El fichero anterior no se borra.** Es el
  mismo código que «Sustituir el fichero» de la fila 320 (`js/plantillas-fichero.js`).
- Si otras plantillas usan ese mismo fichero, la misma pregunta que allí: «Este Word lo usan
  también: A, B.», con «Solo en esta» · «En todas» · «Cancelar».
- Al terminar se cierra la pantalla, se vuelve a donde se estaba, y sale un aviso verde
  «Plantilla retocada.» con **«Deshacer»**, que vuelve a apuntar al fichero de antes.
- La plantilla conserva su `id`, su tipo, sus hitos y, si la fila 321 ya está hecha, su marca de
  fuera de uso.
- «Cancelar» o Esc con cambios sin guardar pregunta antes: «Has cambiado N cosas. ¿Salir sin
  guardar?», con «Salir sin guardar» y «Seguir retocando».

### 4. La copia de demostración

Tiene que haber una plantilla de Word con, al menos: un párrafo con una errata evidente («el
alunmo»), un hueco (`{nombre}`), un dato fijo que se repita dos veces (un año, «2025») y un
párrafo que sobre. Puede ser una de las de la fila 320.

## Lo que no cambia

- El asistente «Convertir en plantilla», salvo la opción nueva de su menú.
- Cómo se rellena y se genera un documento.
- Los documentos ya generados con la plantilla: no se tocan.
- No se añaden párrafos, ni tablas, ni se cambia el formato, el membrete o la cabecera.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-322`, revisor en local y, con su aprobación, a `main`.
- Antes de empezar, comprueba que la fila 320 está en `main` (`js/plantillas-pantalla.js` y
  `js/plantillas-fichero.js` existen). Si no, deja esta fila BLOQUEADA con ese motivo.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/WORD-EN-LA-APP.md` (apartado «Convertir en plantilla»),
  `docs/CONVERTIR-EN-PLANTILLA.md` (apartados 6 y los de la pantalla),
  `docs/PANTALLA-DE-PLANTILLAS.md` y los ficheros de abajo.
- **Ningún fichero pasa de 600 líneas, y dos están al borde**:
  `js/convertir-en-plantilla-pantalla.js` tiene 529 y `js/convertir-en-plantilla.js`, 454. Lo
  nuevo va en ficheros nuevos. Si «Retocar» necesita piezas de la pantalla del asistente (pintar
  el documento, resaltar los huecos, el menú de la selección, ir a un sitio del documento),
  **sácalas a un fichero común** que usen los dos, en vez de copiarlas o de envolverlas. Mover
  código sin cambiarlo es parte de esta fila.
- Los cambios se aplican siempre desde los bytes originales, nunca sobre un resultado anterior
  (así lo hace `DocxSustituir.aplicar`). Deshacer un cambio es volver a aplicar los que quedan.
- Primero el fichero `.docx`, después `plantillas.json`, por `Plantillas.guardar` con función.
- Un solo cuadro a la vez (`U.preguntar`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. «Retocar» es palabra nueva:
  apúntala ahí (cambiar trozos del texto de una plantilla de Word), frente a «Cambiar» (sus
  datos) y «Sustituir el fichero» (poner otro Word).
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- convertir-en-plantilla plantillas retocar docx`). La pasada completa, una sola
  vez, al final.

## Ficheros

- `js/plantilla-retocar.js`: nuevo. De qué fichero se parte, la lista de cambios, aplicar desde
  el original, guardar y deshacer.
- `js/plantilla-retocar-pantalla.js`: nuevo. La pantalla.
- `js/plantilla-seleccion.js` (o el nombre que mejor diga lo que es): nuevo. Las piezas comunes
  sacadas de `js/convertir-en-plantilla-pantalla.js`, y el cuadro «Cambiar este texto».
- `js/convertir-en-plantilla-pantalla.js`: usa las piezas comunes y gana la opción del menú. Tiene
  que quedar por debajo de las 529 líneas de hoy.
- `js/convertir-en-plantilla.js`: solo si hace falta para que un cambio «por otro texto» entre en
  «Lo que has marcado tú».
- `js/docx-sustituir.js`: solo si hace falta para cambiar un hueco entero (punto 2).
- `js/plantillas-pantalla.js` (o su fichero de acciones): el botón «Retocar».
- `js/plantillas-documento-ajustes.js`: el botón «Retocar» de la tarjeta.
- `js/plantillas-fichero.js`: lo que haya que abrir para guardar bytes ya hechos, además de un
  fichero elegido.
- `index.html`: la carga de los módulos nuevos, antes de
  `js/convertir-en-plantilla-pantalla.js` el común. Si la copia sin internet lleva su propia
  lista de ficheros, también ahí.
- `css/`: lo nuevo, en `css/convertir-en-plantilla.css` si comparte aspecto.
- `js/demo/`: la plantilla del punto 4.
- `pruebas/plantilla-retocar.mjs`: nueva, sin navegador. Con un `.docx` hecho en la prueba:
  1. Cambiar un texto por otro: el resultado lleva el nuevo y no el viejo, y se puede releer.
  2. Un texto que aparece dos veces: cambian las dos.
  3. Cambiar por un dato: queda el hueco, y `Plantillas.rellenar` lo rellena.
  4. Quitar un trozo, y quitar un párrafo entero por su posición; con otro cambio a la vez en un
     párrafo posterior, los dos salen bien.
  5. Deshacer el primero de tres cambios: los otros dos siguen, y el texto del primero vuelve.
  6. Dos cambios, uno contenido en el otro: no se pisan (el más largo primero).
  7. Un cambio cuyo texto nuevo lleva un hueco escrito a mano.
- `pruebas/plantilla-retocar-pantalla.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. «Retocar» abre la pantalla con el documento, sus huecos resaltados y la lista vacía;
     «Guardar los cambios», apagado.
  2. Seleccionar la errata, «Cambiar por otro texto…», corregirla: la línea «antes → ahora» sale
     en la lista y el documento enseña el texto nuevo.
  3. La ✕ de la línea lo deshace.
  4. «Cambiar por un dato…», «Quitar del documento» y «Quitar el párrafo entero» funcionan aquí.
  5. «Guardar los cambios»: hay un `.docx` nuevo en `_GESTOR/PLANTILLAS`, el de antes sigue, y la
     plantilla apunta al nuevo con el mismo `id`. «Deshacer» la devuelve al de antes.
  6. Generar un documento con la plantilla retocada en un asunto: lleva el texto corregido.
  7. Con una plantilla que comparte fichero: sale la pregunta; «Solo en esta» deja la otra igual.
  8. «Cancelar» con cambios pregunta; sin cambios, no.
  9. «Cambiar por otro texto…» en «Convertir en plantilla»: entra en «Lo que has marcado tú» y
     llega a la plantilla guardada.
  10. Con «solo consultar»: «Retocar» apagado.
- `pruebas/convertir-en-plantilla*.mjs`: siguen en verde tras mover las piezas comunes.
- `js/novedades.js`: «Cada plantilla de Word tiene un botón nuevo, «Retocar»: seleccionas un
  trozo del documento y lo cambias por otro texto, por un dato, o quitas el párrafo, sin salir de
  la aplicación. Vale para corregir una frase o una errata. «Cambiar por otro texto…» está
  también al convertir un documento en plantilla.»
- Al terminar: `docs/contexto/WORD-EN-LA-APP.md` (apartado nuevo «Retocar una plantilla» y la
  opción nueva del asistente), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/VOCABULARIO.md`, `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 5, tras lo
  añadido por la fila 320: ««Retocar» (fila 322, `js/plantilla-retocar*.js`) cambia trozos del
  texto de una plantilla de Word —por otro texto, por un dato, o quita el párrafo— y guarda un
  fichero nuevo sin borrar el anterior.» En la sección 7 no se toca nada: el editor de Word
  sigue descartado.

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que cada plantilla de Word tiene «Retocar», en Herramientas → «Plantillas» y en
la pantalla de su tipo; que se selecciona un trozo y se cambia por otro texto, por un dato, o se
quita el párrafo; y que el fichero de antes no se borra, así que «Deshacer» lo devuelve.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir `?demo=1&auto=1`, ir a Herramientas → «Plantillas», pestaña «Word». Cada línea tiene un
   botón «Retocar» entre «Ver» y «Cambiar».
2. Pulsar «Retocar» en la plantilla que lleva la errata «el alunmo». Se abre una pantalla
   completa: a la izquierda el documento, con los huecos entre llaves resaltados; a la derecha el
   título «Retocar» con el nombre de la plantilla, la lista «Lo que has cambiado» con «Todavía no
   has cambiado nada.» y, al pie, un texto que dice que para añadir párrafos, tablas o cambiar el
   formato hay que usar Word y «Sustituir el fichero». El botón «Guardar los cambios» está
   apagado.
3. En esa pantalla no hay ningún grupo «Datos de este asunto» ni «Quien firma», ni campos para el
   nombre o el tipo de la plantilla.
4. Seleccionar con el ratón «el alunmo»: sale un menú con «Cambiar por un dato…», «Cambiar por
   otro texto…», «Esto se pregunta cada vez», «Quitar del documento» y «Quitar el párrafo
   entero».
5. Pulsar «Cambiar por otro texto…»: sale un cuadro con «el alunmo» ya escrito. Corregirlo a «el
   alumno» y pulsar «Cambiar». En la lista aparece una línea «el alunmo → el alumno», el
   documento enseña «el alumno», y «Guardar los cambios» se enciende.
6. Seleccionar «2025» y cambiarlo por «2026» con «Cambiar por otro texto…»: la línea dice que
   aparece dos veces, y en el documento han cambiado las dos.
7. Pulsar la ✕ de esa línea: en el documento vuelve a poner «2025» las dos veces, y «el alumno»
   sigue corregido.
8. Seleccionar unas palabras del párrafo que sobra y pulsar «Quitar el párrafo entero»: el
   párrafo entero desaparece del documento y hay una línea nueva en la lista, que empieza por
   «Quitar el párrafo». Seleccionar otra palabra suelta y pulsar «Quitar del documento»: solo
   desaparece esa palabra.
9. Seleccionar un nombre propio o un dato fijo y pulsar «Cambiar por un dato…»: se abre el
   buscador de datos; al elegir uno, en el documento queda su hueco entre llaves, resaltado.
10. Pulsar «Cancelar»: pregunta si salir sin guardar, con «Salir sin guardar» y «Seguir
    retocando». Pulsar «Seguir retocando»: no se pierde nada.
11. Pulsar «Guardar los cambios»: la pantalla se cierra, se vuelve a la lista de plantillas y
    sale un aviso verde «Plantilla retocada.» con «Deshacer». La columna «Fichero» de esa línea
    enseña un nombre de fichero distinto al de antes.
12. Pulsar «Ver» en esa plantilla: el documento dice «el alumno» y no tiene el párrafo quitado.
13. Abrir un asunto del tipo de esa plantilla y generar un documento con ella: el documento
    generado dice «el alumno».
14. Volver a Herramientas → «Plantillas», retocar otra vez la misma plantilla cambiando cualquier
    palabra, guardar y pulsar «Deshacer» en el aviso verde: la columna «Fichero» vuelve al nombre
    que tenía antes de este segundo retoque.
15. Pulsar «Retocar» en una de las dos plantillas que comparten el mismo fichero, cambiar una
    palabra y guardar: sale la pregunta que nombra a la otra plantilla. Pulsar «Solo en esta»: la
    columna «Fichero» de la otra no cambia.
16. Pulsar «Retocar» en cualquier plantilla y, sin cambiar nada, pulsar «Cancelar»: se cierra sin
    preguntar.
17. Ir a Ajustes, abrir un tipo de asunto con plantilla de Word: su tarjeta tiene «Retocar», y
    abre la misma pantalla.
18. Abrir un asunto abierto que tenga un documento de Word, abrir el «⋮» del documento y pulsar
    «Convertir en plantilla». Seleccionar un trozo de texto: el menú tiene ahora «Cambiar por
    otro texto…». Usarlo: el cambio aparece en el grupo «Lo que has marcado tú».
19. Abrir `?demo=1&auto=1` con «En este ordenador, solo consultar» marcado, e ir a Herramientas →
    «Plantillas»: «Retocar» no se puede pulsar.
20. [SOLO FRANCISCO] En el ordenador del centro: retocar una plantilla de verdad del centro
    (corregir una palabra), guardarla, generar un documento con ella y mirar que el Word
    generado conserva el formato, el membrete y las tablas tal como estaban.
