# Plantillas de documento por tipo de asunto

Acordado con Francisco el 16-sep-2026. Fila 17 de `docs/COLA.md`.

Se escribió cuando la fila 14 (plantillas de correo) aún estaba pendiente, y se rehízo el mismo
día, ya terminada aquélla, para montarse encima y no en paralelo.

## Cómo trabajar esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.**
- Cambios quirúrgicos. No reescribas ficheros enteros que no sean nuevos.
- **No leas el repositorio entero**: con `docs/CONTEXTO.md`, `js/plantillas.js`, `js/correo.js`
  y los ficheros de la lista del punto 7 basta.
- **Una sola tanda de pruebas al final**, no una comprobación después de cada cambio.
- Comprueba lo publicado con `curl`, fichero a fichero, antes de darlo por hecho.

## 1. Qué hay que conseguir

Francisco prepara documentos de Word con huecos escritos entre llaves. La aplicación los cuelga
de un tipo de asunto. Dentro de un asunto, un botón **Generar documento** produce una copia del
Word con los huecos rellenos, ya guardada en la carpeta del asunto y con el nombre que mandan
las reglas.

Sin preguntas al generar: todo hueco sale de datos que la aplicación ya tiene. Si una plantilla
necesita un dato que no existe, se añade como campo propio de ese tipo, que es cosa de Ajustes.

**Es el gemelo en papel de las plantillas de correo.** Mismo fichero, mismos huecos, misma
sintaxis. Nada de motores paralelos.

## 2. Lo que ya existe y hay que reutilizar

`js/plantillas.js` (423 líneas) trae, de la fila 14:

- `_GESTOR/plantillas.json`, con las claves de raíz `firma`, `centro` y `lista`.
- `Plantillas.cargar(gestor)`, `Plantillas.guardar(gestor, mutar)`, `Plantillas.olvidar()`,
  `Plantillas.deTipo(datos, categoria, tipo)`, `Plantillas.idNuevo()`.
- `Plantillas.rellenar(texto, valores)`, que devuelve `{ texto, faltan }`.
- `Plantillas.HUECOS`, el catálogo, y el hueco especial `{campo:Nombre del campo}`.
- Los valores de cada asunto los monta hoy `valoresDePlantilla()`, privada de `js/correo.js`.

**La sintaxis de los huecos es de una sola llave**: `{nombre}`, `{grupo}`,
`{campo:Plazo de matrícula}`. En el Word se escriben igual. No inventes dobles llaves.

## 3. Lo que hay que ampliar de lo que ya existe

### 3.1 Sacar los valores de `js/correo.js` a `js/plantillas.js`

`valoresDePlantilla()` pasa a ser pública: **`Plantillas.valoresDeAsunto(asunto)`**, en
`js/plantillas.js`. `js/correo.js` la llama en vez de tener la suya. Un solo sitio que sepa de
dónde sale cada valor.

### 3.2 Huecos nuevos en el catálogo

Se añaden a `Plantillas.HUECOS`, con su etiqueta en castellano, y a `valoresDeAsunto`:

| Hueco | Qué pone |
|---|---|
| `{nombreNatural}` | El tercero en orden normal: `Nombre Apellido1 Apellido2` |
| `{referencia}` | Nº de identificación escolar, documento, NIF o referencia, según la categoría |
| `{dni}` | El DNI del alumnado |
| `{telefono}` | Teléfono del tercero |
| `{correo}` | Correo del tercero |
| `{tutor1}` `{tutor1telefono}` `{tutor1correo}` | El primer tutor, solo alumnado |
| `{tutor2}` `{tutor2telefono}` `{tutor2correo}` | El segundo tutor, solo alumnado |
| `{descripcion}` | El texto libre del asunto |
| `{estado}` | El estado de tramitación |
| `{registro}` | El número de registro de Séneca del asunto |
| `{hoyLargo}` | `16 de septiembre de 2026` |
| `{lugarYFecha}` | `En Alhaurín el Grande, a 16 de septiembre de 2026` |
| `{localidad}` `{direccionCentro}` `{codigoCentro}` `{cargo}` | Del centro |
| `{firma}` | El texto de la firma, ya relleno |

Las columnas de los tutores se leen **por su título**, como hace `js/dni.js`, con la cabecera
del CSV (`Datos.cargarLista().cabecera`); nunca por su posición y nunca desde `p.campos`. Lo que
no exista se queda vacío y sale en `faltan`, sin romper nada.

### 3.3 Datos del centro

En `plantillas.json` se añaden, junto a `firma` y `centro`, las claves de raíz `localidad`,
`direccion`, `codigo` y `cargo`. Las viejas no se tocan, y un fichero antiguo sin ellas tiene
que seguir cargando. El bloque "Plantillas de correo" de Ajustes gana esos cuatro campos, al
lado de la firma y el centro que ya están.

### 3.4 Dónde se guardan las plantillas de Word

En el mismo `plantillas.json`, clave de raíz nueva **`documentos`**:

    "documentos": [
      { "id": "pd-1", "categoria": "ALUMNADO", "tipo": "ADMISION",
        "nombre": "Notificación de plaza concedida",
        "fichero": "notificacion-plaza.docx",
        "tipoDocumento": "NOTIFICACIÓN", "texto": "" } ]

`limpio()` la normaliza como hace con `lista`. `tipoDocumento` y `texto` son las piezas con las
que se monta el nombre del documento generado. Una misma plantilla puede estar colgada de varios
tipos, cada uno con su fila.

Los `.docx` viven en una carpeta nueva **`_GESTOR/PLANTILLAS`**, dentro de la carpeta de asuntos
abiertos, sin subcarpetas. La crea la aplicación si no existe.

**No se crea ningún fichero compartido nuevo**: la cuenta de once no cambia.

## 4. Rellenar el Word: `js/docx.js`

Módulo nuevo. **Sin librerías externas y sin CDN**: en este repositorio la única librería es
pdf.js, y va copiada dentro. Un `.docx` es un ZIP, y el navegador trae lo necesario.

- Leer el ZIP a mano: directorio central, cabeceras locales, nombres y bytes de cada entrada.
- Descomprimir con `DecompressionStream('deflate-raw')` solo las entradas que hay que tocar:
  `word/document.xml`, y `word/header*.xml` y `word/footer*.xml` si existen (el membrete y el
  pie también pueden llevar huecos).
- Sustituir con `Plantillas.rellenar` sobre el texto, y escapar el resultado como XML (`&`, `<`,
  `>`). Un salto de línea dentro de un valor se escribe
  `</w:t><w:br/><w:t xml:space="preserve">`.
- Volver a montar el ZIP: las entradas no tocadas se copian tal cual, con su CRC y sus tamaños
  originales; las tocadas se escriben **sin comprimir** (método 0), calculando su CRC-32. Un ZIP
  con entradas almacenadas es válido y Word lo abre sin problema. Así no hace falta
  `CompressionStream`.
- Función pública: `Docx.rellenar(ficheroDocx, valores)` → `{ blob, faltan }`.

**La trampa de los huecos partidos.** Word reparte el texto de un párrafo en varias etiquetas
`<w:t>`, y parte `{nombre}` en trozos. Antes de sustituir, hay que reparar: por cada `<w:p>`,
concatenar el texto de sus `<w:t>`, localizar las llaves que crucen de una a otra, y mover
caracteres entre `<w:t>` vecinas hasta que cada hueco quede entero dentro de una sola. **No
fundas todas las `<w:t>` del párrafo en una**: se perdería la negrita o el subrayado de las
palabras sueltas. Esta reparación es lo primero que hay que probar.

## 5. La generación: `js/plantillas-documento.js` y `css/plantillas-documento.css`

Módulo nuevo, con el botón, el cuadro y su bloque de Ajustes. `js/plantillas.js` no crece: ya
está en 423 líneas. Si aun así acabara pasando de 450, saca su bloque de Ajustes a
`js/plantillas-ajustes.js`, sin cambiar lo que hace.

**Botón "Generar documento"** en la pantalla de un asunto, junto a "Correo", "Mensaje Séneca" y
"Registrar", puesto con el mismo patrón que usa `js/registro.js`. No va en la tarjeta de la
lista: la lista blanca `BOTONES_DE_LA_TARJETA` de `js/ficha-asunto.js` no se toca.

- Si el tipo del asunto no tiene plantillas de documento, el botón no se pinta.
- Si tiene una, un clic y a generar.
- Si tiene varias, un cuadro con la lista para elegir. Un solo `U.preguntar` abierto a la vez.

**Al generar:**

1. Leer el `.docx` de `_GESTOR/PLANTILLAS`. Si el fichero no está, decirlo con su nombre y parar.
2. `Plantillas.valoresDeAsunto(asunto)` y `Docx.rellenar`.
3. Montar el nombre con `Nombres.montarDocumento`: fecha de hoy, el `tipoDocumento` de la
   plantilla y su `texto`, extensión `.docx`. Vigilar `App.LARGO_MAXIMO_NOMBRE`.
4. Guardar en la carpeta del asunto. **Si ya existe un fichero con ese nombre, no se pisa**:
   se avisa y se deja decidir, como en el resto de la aplicación.
5. Anotar en el asunto con `App.anotar`: "Generado <nombre del documento>".
6. Avisar al terminar. Si hubo huecos sin datos, decir cuáles, en una línea, sin impedir nada.
7. Refrescar la lista de documentos del asunto.

**En Ajustes**, bloque propio **"Plantillas de documento"**, hermano del de correo y con la misma
forma: buscador, lista de tarjetas por categoría y tipo, alta, edición y borrado con
`Papelera.botonBorrar`. En el alta se elige el `.docx` de entre los que haya en
`_GESTOR/PLANTILLAS`, y se escriben el nombre visible, el tipo de documento y el texto adicional.

El bloque lleva además la **lista de huecos** con un botón de copiar en cada uno: es la única
manera que tiene Francisco de saber cómo se escriben para pegarlos en el Word.

## 6. Guardar sin pisar al otro ordenador

`plantillas.json` es un fichero compartido: se relee justo antes de escribirlo y se guarda con
`Copias.guardar`, nunca con `Carpetas.guardarJson`. `Plantillas.guardar(gestor, mutar)` ya lo
hace; úsala y no escribas por tu cuenta.

## 7. Ficheros que hay que tocar

Nuevos: `js/docx.js`, `js/plantillas-documento.js`, `css/plantillas-documento.css`,
`pruebas/plantillas-documento.mjs`.

Tocados: `js/plantillas.js` (huecos nuevos, `valoresDeAsunto`, `documentos` en `limpio()`,
campos nuevos del centro), `js/correo.js` (usar `Plantillas.valoresDeAsunto`), `index.html` (los
dos `<script>` nuevos y la hoja de estilo: `docx.js` y `plantillas-documento.js` después de
`js/correo.js`, y en todo caso después de `js/ficha-asunto.js` y antes de `js/inicio.js`),
`pruebas/ejecutar.mjs`, `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`,
`docs/COLA.md`.

Antes de colgar nada de `App`, comprueba con un `grep` por todos los `js/` que el nombre no está
cogido.

## 8. Las pruebas

`pruebas/plantillas-documento.mjs`, con jsdom y un `.docx` de mentira montado a mano:

1. Hueco partido en tres `<w:t>` dentro del mismo párrafo: se rellena bien y la negrita de una
   palabra vecina sigue en su sitio.
2. Huecos de las cuatro clases (asunto, tercero, `{campo:...}` y centro) con sus valores.
3. Hueco sin dato: se queda vacío y sale en `faltan`.
4. Hueco desconocido: se queda escrito y sale en `faltan`.
5. Valor con `&` y con `<`: el XML sigue siendo válido.
6. El ZIP de salida se vuelve a abrir y `word/document.xml` trae el texto relleno.
7. El nombre del documento generado sale de `Nombres.montarDocumento`.
8. Un `plantillas.json` viejo, sin `documentos` ni los campos nuevos del centro, sigue cargando.

Nada de fechas escritas a mano en una prueba. Al final, `npm test` entero en verde, y la
comprobación con `curl` de cada fichero publicado.

## 9. Al terminar

- Marca la fila 17 de `docs/COLA.md` como HECHA, con la fecha y la versión publicada.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, no
  añadiendo una debajo.
- Apunta en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- En el mensaje final a Francisco, dile en una línea que para estrenarlo tiene que dejar su
  primer Word en `_GESTOR/PLANTILLAS` y colgarlo de un tipo en Ajustes.
