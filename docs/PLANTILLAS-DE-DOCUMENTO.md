# Plantillas de documento por tipo de asunto

Acordado con Francisco el 16-sep-2026. Fila 17 de `docs/COLA.md`.

## Cómo trabajar esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.**
- Cambios quirúrgicos. No reescribas ficheros enteros que no sean nuevos.
- **No leas el repositorio entero**: con `docs/CONTEXTO.md` y los ficheros de la lista basta.
- **Una sola tanda de pruebas al final**, no una comprobación después de cada cambio.
- Si tocas un fichero que pase de unas 400 líneas, pártelo en dos.
- Comprueba lo publicado con `curl`, fichero a fichero, antes de darlo por hecho.

## 1. Qué hay que conseguir

Francisco prepara documentos de Word con huecos escritos entre dobles llaves. La aplicación
los cuelga de un tipo de asunto. Dentro de un asunto, un botón **Generar documento** produce
una copia del Word con los huecos rellenos, ya guardada en la carpeta del asunto y con el
nombre que mandan las reglas.

Sin preguntas al generar: todo hueco sale de datos que la aplicación ya tiene. Si una plantilla
necesita un dato que no existe, se añade como campo propio de ese tipo, que es cosa de Ajustes.

Esto es el gemelo en papel de la fila 14 (`docs/PLANTILLAS-DE-CORREO.md`). El motor de huecos
que se escribe aquí es el que usará aquella: no lo dupliques allí.

## 2. Dónde viven las plantillas

- Carpeta nueva `_GESTOR/PLANTILLAS`, dentro de la carpeta de asuntos abiertos. La crea la
  aplicación si no existe. Dentro van ficheros `.docx` sueltos, sin subcarpetas.
- Fichero compartido nuevo `_GESTOR/plantillas.json`:

      { "porTipo": { "<nombre del tipo de asunto>": [
          { "fichero": "notificacion-plaza.docx",
            "nombre": "Notificación de plaza concedida",
            "tipoDocumento": "NOTIFICACIÓN",
            "texto": "" } ] } }

  `tipoDocumento` y `texto` son las piezas con las que se monta el nombre del documento
  generado. Una misma plantilla puede estar colgada de varios tipos.
- Fichero compartido nuevo `_GESTOR/centro.json`, con los datos del centro:
  `nombre`, `codigo`, `direccion`, `localidad`, `telefono`, `correo`, `firmante`, `cargo`.

Los dos son ficheros compartidos de pleno derecho, como los once que ya hay:

- Releerlos justo antes de escribirlos.
- Guardarlos con `Copias.guardar`, nunca con `Carpetas.guardarJson` directamente.
- Entran en `Copias.comprobarTodos` al pulsar Entrar.
- Ninguno de los dos se fusiona solo: van al bloque "Conflictos de Dropbox" de Ajustes, con
  `tipos.json` y compañía.
- **La cuenta de ficheros compartidos deja de ser once.** Sustituye el número allí donde esté
  escrito, en código, en pruebas y en los tres documentos de `docs/`. La fila 15 (hitos) añadirá
  otro más: no dejes el número escrito a mano en sitios donde se pueda contar la lista.

## 3. El motor de huecos: `js/huecos.js`

Módulo nuevo, sin interfaz. Dos funciones públicas:

- `Huecos.catalogo(asunto)` — devuelve la lista de huecos disponibles, cada uno con su texto
  literal (`{{...}}`), su etiqueta en castellano y su valor actual para ese asunto.
- `Huecos.rellenar(texto, asunto)` — devuelve `{ texto, vacios: [...] }`: el texto con los
  huecos sustituidos y la lista de los que se quedaron sin valor.

Reglas: el hueco desconocido se deja tal cual y se apunta como vacío; el conocido pero sin dato
se sustituye por cadena vacía y se apunta también. Nunca lanza: un asunto al que le falte algo
tiene que poder generar su documento igual.

### Catálogo de huecos

**Del asunto** — `{{asunto.fecha}}` (dd/mm/aaaa), `{{asunto.tipo}}`, `{{asunto.curso}}` (año
académico), `{{asunto.grupo}}`, `{{asunto.texto}}` (el texto libre), `{{asunto.estado}}`,
`{{asunto.limite}}`, `{{asunto.registro}}`, `{{asunto.carpeta}}`.

**Del tercero** — `{{tercero.nombre}}` (tal como va en la carpeta: `Apellido1 Apellido2,
Nombre`), `{{tercero.nombreNatural}}` (`Nombre Apellido1 Apellido2`), `{{tercero.referencia}}`
(Nº de identificación escolar, documento, NIF o referencia, según la categoría),
`{{tercero.dni}}`, `{{tercero.telefono}}`, `{{tercero.correo}}`. Para empresas, además
`{{tercero.razonSocial}}`, `{{tercero.comercial}}`, `{{tercero.nif}}`, `{{tercero.contacto}}`.

**De los tutores**, solo alumnado — `{{tutor1.nombre}}`, `{{tutor1.telefono}}`,
`{{tutor1.correo}}`, y lo mismo con `tutor2`. Las columnas se leen **por su título**, como hace
`js/dni.js`, con la cabecera del CSV (`Datos.cargarLista().cabecera`), nunca por su posición y
nunca desde `p.campos`.

**De los campos del tipo** — `{{campo.<nombre del campo en minúsculas, sin acentos, con guiones
en vez de espacios>}}`. Por ejemplo, un campo llamado "Plazo de matrícula" es
`{{campo.plazo-de-matricula}}`. El valor sale de la ficha del asunto en `asuntos.json`; el
catálogo, de `Campos` para el tipo de ese asunto.

**Del centro** — `{{centro.nombre}}`, `{{centro.codigo}}`, `{{centro.direccion}}`,
`{{centro.localidad}}`, `{{centro.telefono}}`, `{{centro.correo}}`, `{{centro.firmante}}`,
`{{centro.cargo}}`. Salen de `centro.json`.

**Fechas y firma** — `{{hoy}}` (dd/mm/aaaa), `{{hoy.largo}}` ("16 de septiembre de 2026"),
`{{hoy.lugarYFecha}}` ("En Alhaurín el Grande, a 16 de septiembre de 2026", con la localidad del
centro), `{{usuario}}` (quien está usando la aplicación).

Nada de fechas escritas a mano en las pruebas.

## 4. Rellenar el Word: `js/docx.js`

Módulo nuevo. **Sin librerías externas y sin CDN**: en este repositorio la única librería es
pdf.js, y va copiada dentro. Un `.docx` es un ZIP, y el navegador trae lo necesario.

- Leer el ZIP a mano: directorio central, cabeceras locales, nombres y bytes de cada entrada.
- Descomprimir con `DecompressionStream('deflate-raw')` solo las entradas que hay que tocar:
  `word/document.xml`, y `word/header*.xml` y `word/footer*.xml` si existen (el membrete y el
  pie también pueden llevar huecos).
- Sustituir los huecos sobre el XML, escapando el resultado como XML (`&`, `<`, `>`). Un salto
  de línea dentro de un valor se escribe `</w:t><w:br/><w:t xml:space="preserve">`.
- Volver a montar el ZIP: las entradas no tocadas se copian tal cual, con su CRC y sus tamaños
  originales; las tocadas se escriben **sin comprimir** (método 0), calculando su CRC-32. Un ZIP
  con entradas almacenadas es válido y Word lo abre sin problema. Así no hace falta
  `CompressionStream`.

**La trampa de los huecos partidos.** Word reparte el texto de un párrafo en varias etiquetas
`<w:t>`, y parte `{{alumno}}` en trozos. Antes de sustituir, hay que reparar: por cada `<w:p>`,
concatenar el texto de sus `<w:t>`, localizar los `{{...}}` que crucen de una a otra, y mover
caracteres entre `<w:t>` vecinas hasta que cada hueco quede entero dentro de una sola. **No
fundas todas las `<w:t>` del párrafo en una**: se perdería la negrita o el subrayado de las
palabras sueltas. Esta reparación es lo primero que hay que probar.

## 5. La generación: `js/plantillas.js` y `css/plantillas.css`

Módulo nuevo, con el botón, el cuadro y el bloque de Ajustes.

**Botón "Generar documento"** en la pantalla de un asunto, junto a "Correo", "Mensaje Séneca" y
"Registrar", puesto con el mismo patrón que usa `js/registro.js`. No va en la tarjeta de la
lista: la lista blanca `BOTONES_DE_LA_TARJETA` de `js/ficha-asunto.js` no se toca.

- Si el tipo del asunto no tiene plantillas, el botón no se pinta.
- Si tiene una, un clic y a generar.
- Si tiene varias, un cuadro con la lista para elegir. Un solo `U.preguntar` abierto a la vez.

**Al generar:**

1. Leer el `.docx` de `_GESTOR/PLANTILLAS`. Si el fichero no está, decirlo con su nombre y parar.
2. Rellenar con `Huecos.rellenar`.
3. Montar el nombre con `Nombres.montarDocumento`: fecha de hoy, el `tipoDocumento` de la
   plantilla y su `texto`, extensión `.docx`. Vigilar `App.LARGO_MAXIMO_NOMBRE`.
4. Guardar en la carpeta del asunto. **Si ya existe un fichero con ese nombre, no se pisa**:
   se avisa y se deja decidir, como en el resto de la aplicación.
5. Anotar en el asunto con `App.anotar`: "Generado <nombre del documento>".
6. Avisar al terminar. Si hubo huecos vacíos, decir cuáles, en una línea, sin impedir nada.
7. Refrescar la lista de documentos del asunto.

**En Ajustes** (`js/ajustes.js`, cambios mínimos):

- Menú de tres puntos de cada tarjeta de tipo: entrada nueva **Plantillas**, al lado de Campos.
  Abre un cuadro con las plantillas colgadas de ese tipo y la lista de los `.docx` que hay en
  `_GESTOR/PLANTILLAS` para añadir, con su nombre visible, su tipo de documento y su texto.
- Bloque nuevo **Datos del centro**, que escribe `centro.json`.
- Bloque nuevo **Huecos de las plantillas**: la lista completa de huecos con su explicación y un
  botón de copiar en cada uno, para que Francisco los pegue en el Word. Es la única manera que
  tiene de saber cómo se escriben.

## 6. Ficheros que hay que tocar

Nuevos: `js/huecos.js`, `js/docx.js`, `js/plantillas.js`, `css/plantillas.css`,
`pruebas/plantillas.mjs`.

Tocados: `index.html` (los tres `<script>` nuevos y la hoja de estilo; `huecos.js` y `docx.js`
antes que `plantillas.js`, y `plantillas.js` después de `ficha-asunto.js` y antes de
`inicio.js`), `js/ajustes.js`, `js/copias.js`, `js/conflictos.js`, `pruebas/ejecutar.mjs`,
`docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

Antes de colgar nada de `App`, comprueba con un `grep` por todos los `js/` que el nombre no
está cogido.

## 7. Las pruebas

`pruebas/plantillas.mjs`, con jsdom y un `.docx` de mentira montado a mano:

1. Hueco partido en tres `<w:t>` dentro del mismo párrafo: se rellena bien y la negrita de una
   palabra vecina sigue en su sitio.
2. Huecos de las cuatro clases (asunto, tercero, campo del tipo, centro) con sus valores.
3. Hueco sin dato: se queda vacío y sale en la lista de vacíos.
4. Hueco desconocido: se queda escrito y sale en la lista de vacíos.
5. Valor con `&` y con `<`: el XML sigue siendo válido.
6. El ZIP de salida se vuelve a abrir y `word/document.xml` trae el texto relleno.
7. El nombre del documento generado sale de `Nombres.montarDocumento`.

Al final, `npm test` entero en verde, y la comprobación con `curl` de cada fichero publicado.

## 8. Al terminar

- Marca la fila 17 de `docs/COLA.md` como HECHA, con la fecha y la versión publicada.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, no
  añadiendo una debajo. En "Qué falta" de `CONTEXTO-CORTO.md` sobra ya la mitad de la línea de
  plantillas de correo: deja solo lo que siga sin hacer.
- Apunta en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- En el mensaje final a Francisco, dile en una línea que para estrenarlo tiene que dejar su
  primer Word en `_GESTOR/PLANTILLAS` y colgarlo de un tipo en Ajustes.
