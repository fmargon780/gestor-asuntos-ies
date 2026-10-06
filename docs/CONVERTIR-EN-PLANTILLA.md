# Convertir un documento de un asunto en plantilla (fila 280)

Cerrado con Francisco el 6-oct-2026. Idea suya, apuntada desde el Centro de mando: «¿Cómo puedo
agilizar la tarea de diseñar una plantilla para la aplicación si subo un documento que estemos
usando actualmente para ese fin?».

Esta fila hace el camino entero con documentos **Word (.docx)**, y con un **PDF que tenga su Word**
en el asunto. El PDF sin Word es la fila 281 (`docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md`), que va
después y se apoya en esta.

## Por qué

Francisco y su compañero no están habituados a hacer plantillas. Les cuestan las tres cosas: poner
los huecos, dejar el documento con el membrete de la app, y decir a qué tipo de asunto, tipo de
documento e hito pertenece. Hoy se hace a mano: se sube un `.docx` a `_GESTOR/PLANTILLAS`, se elige
en un desplegable de Ajustes → Plantillas de documento, y los huecos se copian de una lista y se
pegan en Word.

## La idea, en una frase

En un documento que ya está guardado en un asunto real, «Convertir en plantilla». La app ya conoce
los datos de ese asunto: los busca en el texto y propone cambiarlos por su hueco. También sabe el
tipo de asunto y el hito. La usuaria solo confirma o corrige, y antes de guardar ve el resultado
junto al original.

Decidido con Francisco:

- Se parte siempre de un documento de un asunto. No hay subida de un documento suelto.
- Un trozo que cambia en cada caso y que la app no tiene como dato se marca con «Esto se pregunta
  cada vez». **No** se crean campos nuevos del tipo desde aquí (eso sigue en «+ Añadir campo»).
- El documento original nunca se toca.

## Qué hay que hacer

### 1. Dónde sale

En el menú «⋮» de cada documento, en la ficha del asunto (`js/ficha-documentos.js`) y en la mesa
del hito (`js/hito-mesa-documentos.js`), una entrada nueva: **«Convertir en plantilla»**. Va antes
de «Pasar a versiones previas». Solo en asuntos abiertos.

- Documento `.docx`: la entrada funciona.
- Documento `.pdf`: funciona si la app encuentra su Word (apartado 2). Si no lo encuentra, la
  entrada sale apagada, con este texto al pasar el ratón: **«No encuentro el Word de este PDF.»**
  (La fila 281 cambia esto.)
- Documento `.doc`, `.odt` o `.rtf`: sale apagada, con el texto **«Solo con Word moderno (.docx) o
  PDF. Ábrelo en Word y guárdalo como .docx.»**
- Cualquier otro fichero (imagen, hoja de cálculo, el índice del expediente): la entrada no sale.
- En modo «solo consultar»: apagada, como los demás controles que cambian algo.

Además, en Ajustes → Plantillas de documento, encima del alta de siempre, una línea gris:
**«También puedes crear una plantilla desde un documento de un asunto: en su menú ⋮, «Convertir en
plantilla».»**

### 2. De qué fichero se parte

- Un `.docx`: de él mismo.
- Un `.pdf`: se busca su Word con la misma regla de gemelos de la app
  (`VersionesPrevias.claveGemelo`): un `.docx` con la misma clave, en la carpeta del asunto o en
  su subcarpeta de versiones previas (`_Previas` o la antigua «Versiones previas»). Un `.doc` no
  vale. Si hay varios, el más reciente. Cuando se usa el Word de un PDF, la pantalla lo dice
  arriba, en una línea: **«He encontrado el Word de este PDF y uso ese.»**

El fichero se lee una vez y se guarda en memoria como «el original». Todo lo que sigue trabaja
sobre copias en memoria. En la carpeta del asunto no se escribe nada, nunca.

### 3. La pantalla

Una capa a pantalla completa, como la del visor de Word (`#word-visor`). Título: **«Convertir en
plantilla»**, y debajo el nombre del documento. Dos pasos.

**Paso 1, «Revisar».** Dos columnas que ocupan todo el ancho, cada una con su propio
desplazamiento (la página no se desplaza):

- **Izquierda, ancha: el documento**, pintado con docx-preview (como en el visor). Es la copia de
  trabajo: lleva ya puestos los cambios marcados. Cada hueco se ve resaltado en amarillo. Cada vez
  que se marca o desmarca un cambio, se vuelve a pintar conservando la altura a la que se estaba.
- **Derecha, de unos 440 px: los cambios y los datos de la plantilla** (apartados 4 a 7).

Abajo a la derecha, «Cancelar» y el botón principal **«Ver cómo queda»**.

**Paso 2, «Comparar y guardar»** (apartado 8).

### 4. Los cambios que propone la app

Una lista con casillas, todas marcadas al abrir. Cada línea: lo que había, una flecha, lo que se
pone, y las veces que aparece. Ejemplo: `Carla Espejo Montes → Nombre del tercero · 2 veces`.
Desmarcar una línea devuelve ese texto al documento. Pulsar la línea (no la casilla) lleva el
documento hasta el primer sitio donde está ese cambio.

Lo que se pone se escribe en la lista con la etiqueta del hueco en palabras (la de
`Plantillas.HUECOS`), no con las llaves. En el documento sí va el hueco con sus llaves.

La lista va en cuatro grupos, cada uno con su rótulo. Un grupo sin líneas no sale.

**a) «Datos de este asunto».** La misma regla y la misma lista de datos de la fila 270
(`PlantillaDeLoEscrito.cambiarDatos` y `PlantillaDeLoEscrito.DATOS`, `js/plantilla-de-lo-escrito.js`;
léela, no la copies): valores de menos de 4 caracteres no se buscan, palabra entera, sin distinguir
mayúsculas, primero los más largos, y se cambian todas las veces. Con estas diferencias:

- Los valores salen de `Plantillas.valoresDeAsunto(asunto, { fecha, plantilla })`, con **la fecha
  del propio documento** (la de su nombre), no la de hoy. Así «a 25 de septiembre de 2026» se
  reconoce como la fecha del documento y se cambia por «Fecha de hoy, en letra». Si el nombre no
  trae fecha, la de modificación del fichero.
- Se busca también sin distinguir tildes.
- «Lugar y fecha, en letra» (`lugarYFecha`) entra en la lista de datos que se buscan, antes que la
  fecha sola.
- Si el documento se generó desde un hito o está asociado a uno, valen también el título de ese
  hito y su plazo, como en la fila 270.

Si un dato estaba escrito todo en mayúsculas y el hueco lo va a poner como en la ficha, la línea
lo avisa en gris: «(estaba en mayúsculas)». No se inventa un hueco nuevo para eso.

**b) «Quien firma».** Se busca en el texto el nombre de quien ocupaba cada cargo del centro en la
fecha del documento (`js/cargos.js`), escrito «Nombre Apellidos» o «Apellidos, Nombre». El primero
que aparezca se propone como «Quien firma el documento» (hueco `firmante`), y ese cargo queda
elegido en «Quien firma» de la plantilla (apartado 6). Si aparece el de otro cargo distinto, se
propone como «Quien da el visto bueno» (hueco `visto bueno`). Los cargos y tratamientos escritos
al lado («Secretario», «El Director») no se tocan.

**c) «Para que sirva con hombre y con mujer».** Solo si el tercero del asunto es una persona.
Junto a un hueco del nombre del tercero (en la misma frase), las palabras con género que
`js/genero.js` sabe resolver se proponen en su forma doble: «la alumna» → «el/la alumno/a»,
«matriculada» → «matriculado/a», «D.» → «D./Dña.». Lo mismo para el tratamiento pegado al hueco de
quien firma, con su marca (`:firmante`). Regla dura: solo se propone una forma doble que
`Genero.resolver`, con el sexo de las personas de este asunto, devuelva exactamente al texto que
había. Si no lo devuelve igual, no se propone. Lee `docs/GENERO-EN-PLANTILLAS.md` antes.

**d) «Quitar».** Lo que se propone quitar por el membrete (apartado 5).

### 5. El membrete

En la columna derecha, una casilla marcada: **«Poner el membrete de la app»**. Si el documento ya
lleva `{{MEMBRETE}}`, la casilla no sale.

Con la casilla marcada:

- Se quita la cabecera de página del Word (las referencias a `word/header*.xml` de las secciones),
  para que no salga la cabecera antigua. Los pies de página se dejan.
- Se pone un párrafo `{{MEMBRETE}}` el primero del cuerpo, igual que lo llevan las plantillas del
  centro (mira una de `plantillas/*.docx`).
- Los primeros párrafos del cuerpo, hasta el primer párrafo de texto normal, que sean solo una
  imagen o un rótulo corto de la cabecera antigua (menos de 12 palabras y con «Junta de Andalucía»,
  «Consejería», o el nombre o el código del centro) se proponen en el grupo «Quitar», marcados,
  uno por línea. Desmarcarlo lo devuelve.

Con la casilla sin marcar, nada de esto se hace y el grupo «Quitar» solo lleva lo que la usuaria
quite a mano.

Debajo, la casilla **«Con el logo del centro»** de las plantillas de documento, marcada
(`conLogoCentro`), solo si la de membrete está marcada.

### 6. Lo que la usuaria marca a mano

Al seleccionar con el ratón un trozo de texto del documento (dentro de un solo párrafo, 3
caracteres o más), sale junto a la selección un menú pequeño con tres opciones:

- **«Cambiar por un dato…»**: abre el buscador de huecos de siempre (`js/huecos-buscador.js`). El
  trozo se cambia por el hueco elegido.
- **«Esto se pregunta cada vez»**: pide un nombre corto en un cuadro: **«¿Cómo se llama este
  dato?»**, con el ejemplo en gris «Motivo de la salida». Con ese nombre se pone un hueco que la
  app no sabe rellenar, y que por eso se pregunta al generar, en el cuadro «Faltan datos para este
  documento» que ya existe (fila 155, `js/word-faltan.js`), con ese mismo nombre legible. Comprueba
  con una prueba que ese hueco acaba de verdad en ese cuadro; usa la forma de hueco que ya lo
  consiga sin tocar `Plantillas.rellenar`. Si el nombre coincide con un hueco del catálogo o con un
  campo del tipo, no se crea: aviso ámbar **«Ya hay un dato con ese nombre. Elígelo en «Cambiar por
  un dato…».»**
- **«Quitar del documento»**.

Las tres valen para **todos los sitios donde aparezca ese mismo texto** en el documento (misma
regla que los cambios automáticos), y cada una añade su línea a la lista, marcada, en un grupo más:
**«Lo que has marcado tú»**. Así no hay que saber en qué punto exacto del Word estaba la
selección: se trabaja siempre con el texto.

Pulsar un hueco resaltado en el documento lleva a su línea de la lista.

### 7. Los datos de la plantilla

En la columna derecha, debajo de los cambios, ya rellenos:

- **Nombre de la plantilla**: propuesto con el tipo de documento del fichero, en minúsculas con
  la inicial en mayúscula («Certificado»). Obligatorio.
- **Tipo de asunto**: el del asunto, en una línea con «Cambiar» (el mismo selector de la fila 257,
  `js/tipo-en-linea.js`).
- **Tipo de documento**: el que diga el nombre del fichero, si se reconoce; desplegable con los
  tipos de documento. El **texto adicional** de la plantilla, vacío.
- **Quien firma**: el cargo encontrado en 4.b, o el que tenga por defecto una plantilla nueva.
- **Hito de la guía**: desplegable con «Ninguno (sale en todos los hitos de este tipo)» y los hitos
  de la guía del tipo elegido. Sale elegido el hito al que está asociado el documento, si ese hito
  es de la guía; si no, «Ninguno». Con un hito elegido, al guardar se añade a ese hito **de la
  guía** la tarea de generar este documento con esta plantilla, por la misma función que usa el
  editor de la guía (acción `generar`, `js/hitos-guion.js`), y llega a los asuntos abiertos como
  cualquier cambio de la guía. Aquí **no** se pregunta «¿Dónde se guarda?»: la plantilla es del
  tipo y el rótulo ya dice que es la guía. Si ese hito ya tiene una tarea de generar con esta misma
  plantilla, no se duplica.

### 8. Paso 2: comparar y guardar

«Ver cómo queda» comprueba el nombre (vacío: aviso rojo de siempre) y pasa al paso 2.

Dos columnas iguales, a todo el ancho: a la izquierda **«El original»**, a la derecha **«Con la
plantilla nueva»**. La de la derecha es la plantilla rellena en memoria con **este mismo asunto y
la fecha del documento**, con su membrete, por el mismo camino que «Generar documento»
(`js/plantillas-documento.js`; saca a una función lo de rellenar en memoria si hoy está dentro de
`generarDocumento`, sin cambiar lo que hace). Los huecos de «Esto se pregunta cada vez» se rellenan
con el texto que había en el original (por `valores.aMano`), sin abrir «Faltan datos». Si el
resultado sale igual que el original, es que la plantilla está bien.

Si queda algún hueco sin dato, encima de las columnas una línea ámbar: «Hay N datos que este
asunto no tiene: …».

Por debajo de 1.100 px de ancho, una sola columna con dos pestañas («El original» / «Con la
plantilla nueva»).

Botones: **«← Volver a corregir»** (vuelve al paso 1 con todo como estaba), «Cancelar» y el
principal **«Guardar plantilla»**.

### 9. Al guardar

- Si en ese tipo de asunto ya hay una plantilla de documento con ese nombre (sin distinguir
  mayúsculas ni tildes): no guarda, aviso rojo **«Ya hay una plantilla con ese nombre en este tipo
  de asunto.»**
- Si en ese tipo de asunto ya hay una plantilla con ese mismo tipo de documento, pregunta (un solo
  cuadro, `U.preguntar`): **«Este tipo de asunto ya tiene la plantilla «X» para ese tipo de
  documento.»**, con «Sustituirla», «Guardar como otra» y «Cancelar». «Sustituirla» conserva el
  `id` de la plantilla que había (para que las tareas de los hitos que la usan sigan valiendo) y le
  cambia el fichero y los demás datos; con el `.docx` viejo se hace lo mismo que hace hoy Ajustes
  al borrar una plantilla de documento (si allí va a la papelera, aquí también; si se queda, aquí
  se queda).
- El `.docx` se escribe en `_GESTOR/PLANTILLAS` con el nombre de la plantilla (sin caracteres que
  Dropbox no admita); si ya hay uno con ese nombre y no se está sustituyendo, «(2)».
- La plantilla se apunta en `_GESTOR/plantillas.json` (`documentos[]`) por `Plantillas.guardar`,
  con las mismas claves que crea Ajustes.
- Si se eligió hito, se añade la tarea a la guía (apartado 7).
- Primero el fichero, después `plantillas.json`, después la guía. Si falla lo principal (fichero o
  `plantillas.json`), rojo y no se cierra la pantalla. Si solo falla la guía, ámbar: la plantilla
  queda guardada y sale en todos los hitos.
- Se cierra la capa. Aviso verde: **«Plantilla guardada. Ya sale en «Generar documento» de este
  tipo de asunto.»** La ficha o la mesa se repintan para que «Generar documento» la enseñe sin
  recargar.

«Cancelar» o Escape, en cualquier paso: si hay algo cambiado respecto a lo propuesto, pregunta
antes («¿Salir sin guardar la plantilla?»); si no, cierra sin más. No queda nada escrito.

## Cómo cambiar el texto dentro del Word

Es la parte delicada. Va en un fichero nuevo y es una función pura, con su prueba sin navegador:
recibe el `.docx` original y la lista de cambios activos, y devuelve el `.docx` de trabajo y las
veces que se aplicó cada uno. **Siempre se parte del original y se aplican todos los cambios
activos**; no se guarda un estado intermedio ni hay un «deshacer» aparte: desmarcar es volver a
calcular sin ese cambio.

- Word parte una frase en varios trozos (`w:t`) dentro del párrafo. Se busca en el texto unido del
  párrafo (`Docx.interno.extraerTextos`) y lo que se pone se escribe en el primer trozo tocado,
  vaciando el resto del tramo. El formato de ese primer trozo se conserva. Mira cómo lo resuelve
  `repararHuecosPartidos` de `js/docx.js` para los huecos partidos.
- Se recorre el cuerpo (`word/document.xml`, con sus tablas y cuadros de texto) y los pies de
  página.
- Quitar un párrafo entero es quitar el párrafo, no dejarlo vacío.
- Orden fijo al aplicar: primero quitar, después datos del asunto y quien firma (los más largos
  primero), después lo marcado a mano, y al final las formas dobles.

## Qué NO se toca

- El alta de plantillas de Ajustes → Plantillas de documento (solo gana la línea gris).
- `Plantillas.rellenar`, `Docx.rellenar` y el membrete: se usan, no se cambian.
- Las plantillas de correo y de Séneca, y la fila 270.
- El documento original y la carpeta del asunto.
- No se crean campos, tipos de asunto ni tipos de documento desde esta pantalla.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, los apartados «Plantillas de
  documento de Word» y del membrete de `docs/contexto/DOCUMENTOS-PDF.md`,
  `docs/contexto/WORD-EN-LA-APP.md` y los ficheros de la lista.
- Lo nuevo va en ficheros propios, ninguno por encima de 600 líneas. No envuelve nada: se le llama.
- Cambios quirúrgicos en los ficheros que ya existen. No reescribas ficheros enteros.
- Textos de pantalla: los de este documento, tal cual. Palabras de `docs/VOCABULARIO.md`
  («plantilla», «hueco»).
- Pantalla a todo el ancho, sin huecos vacíos a los lados; título y cuerpo terminan en el mismo
  borde; nada obliga a desplazar la página entera.
- Rama `fila-280`, revisor en local y, con su APROBADA, a `main`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs plantilla word
  convertir`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas, en la copia de demostración ni en los documentos.

## Ficheros

- `js/docx-sustituir.js` (nuevo): cambiar texto dentro de un `.docx`, quitar párrafos, quitar la
  cabecera de página y poner el párrafo `{{MEMBRETE}}`. Puro.
- `js/convertir-en-plantilla-propuestas.js` (nuevo): del texto del documento y los datos del
  asunto, la lista de cambios propuestos (grupos a, b, c y d). Puro.
- `js/convertir-en-plantilla.js` (nuevo): de qué fichero se parte, el estado de la pantalla y el
  guardado.
- `js/convertir-en-plantilla-pantalla.js` (nuevo): los dos pasos.
- `css/convertir-en-plantilla.css` (nuevo). Los cuatro `js` y el `css`, en `index.html`, detrás de
  `js/plantillas-documento-ajustes.js`.
- `js/ficha-documentos.js` y `js/hito-mesa-documentos.js`: la entrada del menú, unas pocas líneas
  cada uno.
- `js/plantilla-de-lo-escrito.js`: solo si `cambiarDatos` necesita un parámetro opcional (sin
  tildes, lista de datos ampliada); sin él, se comporta como hoy.
- `js/plantillas-documento.js`: sacar a una función lo de rellenar en memoria, si hace falta.
- `js/plantillas-documento-ajustes.js`: la línea gris.
- `js/demo/datos.js` (539 líneas; si no cabe, `js/demo/datos-plantilla.js`): lo de «Copia de
  demostración», abajo.
- `pruebas/convertir-en-plantilla.mjs` (nueva, sin navegador): cambiar un texto partido en varios
  trozos; aplicar y quitar cambios partiendo siempre del original; las propuestas de los cuatro
  grupos con un asunto inventado; el hueco de «se pregunta cada vez» acaba en «Faltan datos».
- `pruebas/convertir-en-plantilla-pantalla.mjs` (nueva, con navegador): los puntos de abajo.
- `js/novedades.js`: «En el menú ⋮ de un documento Word hay una opción nueva, «Convertir en
  plantilla»: la app cambia sola los datos del asunto por su hueco, pone el membrete y te enseña el
  resultado junto al original antes de guardar.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de «Plantillas de correo… y de Word»,
  sustituyendo, sin alargarla), `docs/contexto/DOCUMENTOS-PDF.md` o, si pasa de 40 KB,
  `docs/contexto/WORD-EN-LA-APP.md`, y `docs/HISTORIA.md`.

## Copia de demostración

Para que el revisor pueda pasar la lista, la copia de demostración gana:

1. En el asunto de **Espejo Montes, Carla** (tipo CERTIFICADO), un Word con nombre de documento
   nuevo (`AAMMDD CERTIFICADO D26-….docx`, fecha de hace 3 días), asociado al hito «Preparar el
   certificado», con estos párrafos, en este orden:
   - «JUNTA DE ANDALUCÍA - Consejería de Educación» (el rótulo de la cabecera antigua);
   - «CERTIFICADO DE MATRÍCULA», centrado y en negrita;
   - «D. Fernando Reyes Palma, Secretario del centro,»;
   - «CERTIFICA: Que la alumna Carla Espejo Montes, con número de identificación escolar 2100006,
     está matriculada en este centro en el curso actual.»;
   - «Y para que conste, y para presentarlo en la solicitud de beca, firmo el presente
     certificado.»;
   - «En Localidad de pruebas, a » y la fecha del documento en letra;
   - «Fdo.: Fernando Reyes Palma».
   En el cuarto párrafo, el nombre «Carla Espejo Montes» va partido en dos trozos de formato
   distinto («Carla» en negrita), para que la prueba pase por el caso difícil.
2. En el asunto de **Otero Campos, Marta** (tipo BAJA MEDICA), un PDF `AAMMDD COMUNICACION
   D26-….pdf` y, en su subcarpeta `_Previas`, el Word gemelo, con un par de párrafos que nombren a
   «Marta Otero Campos».
3. En ese mismo asunto, un fichero `notas antiguas.doc` (vale con unos bytes cualesquiera).
4. La copia de demostración tiene que saber el sexo de Carla Espejo Montes (mujer) y de Diego
   Herrera Lozano (hombre). Si su fichero de alumnado inventado no trae la columna «Sexo», se
   añade. Sin eso no se puede comprobar el grupo «Para que sirva con hombre y con mujer».

Si alguno de esos asuntos ya no existe en la copia de demostración cuando se coja la fila, se usa
otro del mismo estilo y se cambian los nombres en la lista de abajo antes de llamar al revisor.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en el menú ⋮ de un documento Word hay «Convertir en plantilla», que la app
propone sola los huecos y el membrete, que antes de guardar se ve junto al original, y que con un
PDF funciona si su Word está en el asunto (el PDF sin Word llega con la fila 281). Y que pruebe con
un documento de verdad del centro.

## Cómo sabemos que está bien

1. Abrir el asunto de «Espejo Montes, Carla» (CERTIFICADO). En el menú ⋮ del documento Word
   «CERTIFICADO» hay una entrada «Convertir en plantilla».
2. Pulsarla. Se abre una pantalla completa titulada «Convertir en plantilla», con el documento a la
   izquierda y una columna de cambios a la derecha. La página entera no tiene barra de
   desplazamiento.
3. En el grupo «Datos de este asunto» hay, marcadas, al menos estas líneas: el nombre «Carla Espejo
   Montes», el número «2100006» y la fecha (o el lugar y la fecha) del final.
4. En el grupo «Quien firma» hay una línea con «Fernando Reyes Palma», que dice 2 veces.
5. En el grupo «Para que sirva con hombre y con mujer» hay una línea que cambia «la alumna» por
   «el/la alumno/a».
6. La casilla «Poner el membrete de la app» está marcada, y en el grupo «Quitar» hay una línea con
   «JUNTA DE ANDALUCÍA - Consejería de Educación».
7. En el documento de la izquierda no se lee «Carla Espejo Montes» ni «2100006»: en su lugar hay
   huecos resaltados en amarillo. El título «CERTIFICADO DE MATRÍCULA» sigue centrado y en negrita.
8. Desmarcar la línea de «2100006»: el número vuelve a leerse en el documento. Marcarla otra vez:
   vuelve el hueco.
9. Seleccionar con el ratón «la solicitud de beca» en el documento. Sale un menú con «Cambiar por
   un dato…», «Esto se pregunta cada vez» y «Quitar del documento». Elegir «Esto se pregunta cada
   vez», escribir «Para qué se presenta» y aceptar. Aparece el grupo «Lo que has marcado tú» con
   esa línea, y en el documento ese trozo es un hueco.
10. Abajo en la columna derecha: «Nombre de la plantilla» trae «Certificado»; el tipo de asunto es
    CERTIFICADO; el tipo de documento es CERTIFICADO; «Hito de la guía» tiene elegido «Preparar el
    certificado».
11. Borrar el nombre y pulsar «Ver cómo queda»: aviso rojo, no avanza. Escribir «Certificado de
    matrícula» y pulsar «Ver cómo queda».
12. Se ven dos columnas: «El original» y «Con la plantilla nueva». En la de la derecha se lee
    «Carla Espejo Montes», «2100006», «Fernando Reyes Palma», «la alumna» y «la solicitud de beca»,
    igual que en el original. Arriba lleva el membrete de la app y no se lee «JUNTA DE ANDALUCÍA -
    Consejería de Educación» como párrafo suelto.
13. Pulsar «← Volver a corregir»: se vuelve al paso 1 con los mismos cambios marcados y el nombre
    puesto. Pulsar otra vez «Ver cómo queda» y después «Guardar plantilla». Se cierra la pantalla y
    sale el aviso verde «Plantilla guardada. Ya sale en «Generar documento» de este tipo de
    asunto.»
14. En ese mismo asunto, los documentos siguen siendo los mismos que antes: el Word original está,
    con su nombre.
15. Abrir el hito «Preparar el certificado» de ese asunto. En sus tareas hay una de generar el
    documento con «Certificado de matrícula».
16. Abrir el otro asunto de tipo CERTIFICADO (el reservado, de «Herrera Lozano, Diego»), ir a su
    hito «Preparar el certificado» y generar el documento con «Certificado de matrícula». Antes de
    generarlo, el cuadro «Faltan datos para este documento» pregunta «Para qué se presenta».
    Escribir «la matrícula en otro centro» y generar. El documento lleva «Diego Herrera Lozano»,
    «el alumno» (no «la alumna»), «la matrícula en otro centro» y la fecha de hoy, no la del
    documento de Carla.
17. Ir a Ajustes → Plantillas de documento: «Certificado de matrícula» está en la lista, en el tipo
    CERTIFICADO, y encima del alta se lee la línea «También puedes crear una plantilla desde un
    documento de un asunto…».
18. Volver al asunto de Carla y pulsar otra vez «Convertir en plantilla» en el mismo Word. Poner de
    nombre «Certificado de matrícula» y llegar a «Guardar plantilla»: aviso rojo «Ya hay una
    plantilla con ese nombre en este tipo de asunto.» Cambiar el nombre a «Certificado nuevo» y
    guardar: pregunta «Este tipo de asunto ya tiene la plantilla «Certificado de matrícula» para
    ese tipo de documento.», con «Sustituirla», «Guardar como otra» y «Cancelar». Pulsar
    «Cancelar»: no se guarda nada y se sigue en la pantalla.
19. Cerrar con «Cancelar». Abrir el asunto de «Otero Campos, Marta». En el menú ⋮ del PDF
    «COMUNICACION», «Convertir en plantilla» funciona, y la pantalla dice «He encontrado el Word de
    este PDF y uso ese.» Cerrar con «Cancelar»: en Ajustes no hay ninguna plantilla más.
20. En ese asunto, el menú ⋮ de «notas antiguas.doc» tiene «Convertir en plantilla» apagada.
21. En el asunto de «Aguilar Ponce, Pablo», el menú ⋮ de un PDF tiene «Convertir en plantilla»
    apagada, con el texto «No encuentro el Word de este PDF.» al pasar el ratón.
22. Entrar con «En este ordenador, solo consultar» marcado: «Convertir en plantilla» sale apagada
    en el Word de Carla.
23. **[SOLO FRANCISCO]** Con un documento Word de verdad del centro, guardado en un asunto real:
    «Convertir en plantilla», mirar que los huecos propuestos tienen sentido y que en «Con la
    plantilla nueva» el documento conserva su aspecto (tablas, negritas, sangrías).
