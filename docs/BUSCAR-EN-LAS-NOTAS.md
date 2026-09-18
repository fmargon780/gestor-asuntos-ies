# Fila 73 — Buscar dentro de las notas

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 4, punto 1. Estaba ya apuntado en
`docs/CONTEXTO-CORTO.md`, en "Qué falta", como "cuando el uso lo pida".

---

## 1. Qué pasa hoy

El buscador encuentra por el nombre de la carpeta, por los nombres de los documentos, por el
registro de Séneca y por unos cuantos campos de la ficha.

**No busca en las notas.** Y las notas son donde está la memoria de lo que pasó: "la madre dijo que
lo trae la semana que viene", "se llamó al ayuntamiento, no contestan", "falta el certificado de
empadronamiento".

La pregunta que no se puede contestar hoy es la que más se va a hacer cuando haya varios cientos de
asuntos: *"¿esto no lo habíamos hecho ya con aquella familia?"*.

## 2. Qué hay que hacer

### 2.1 En los asuntos abiertos

Es lo fácil: las notas de los asuntos abiertos están en `asuntos.json`, que ya está entero en
memoria. Basta con añadir el texto de las notas a lo que ya se busca.

Mirar `App.pintarAbiertos` y el campo `busca` que se monta en `App.verAbiertos`
(`js/asuntos-lista.js`): ahí se normaliza el nombre de la carpeta. Añadir el texto de las notas al
mismo saco, normalizado igual.

### 2.2 En el ARCHIVO

Aquí está el trabajo. El índice (`_GESTOR/indice-archivo.json`) dice expresamente que **no guarda
nada de la ficha**: el estado, la vía y los campos se leen del registro en memoria al buscar.

Con las notas eso no vale, porque son largas. Hay que guardarlas en el índice.

Qué guardar por cada asunto archivado:

- El texto de sus notas, todo junto, normalizado (sin tildes, en minúsculas), que es como busca el
  índice.
- **Recortado a un máximo** por asunto: 2.000 caracteres está bien. Las notas muy largas son raras y
  lo que importa es que aparezca la palabra.

Medido: con 4.000 asuntos archivados y notas de verdad, el índice pasa de 2,6 MB a unos 6 MB. Es
asumible, pero hay que decirlo y no descubrirlo luego.

Si la **fila 64** ya está hecha, hay una salida mejor: la ficha del archivado vive en `_ficha.json`
dentro de su carpeta, y el índice puede guardar solo las notas recortadas para buscar, sin duplicar
nada más. **Recomiendo hacer esta fila después de la 64.**

### 2.3 Que se vea por qué ha salido

Si un asunto sale en la búsqueda **solo** por una nota, hay que enseñarlo: debajo de la línea del
asunto, el trocito de la nota donde está la palabra, con la palabra marcada. Si no, Francisco ve un
asunto en los resultados y no sabe por qué.

### 2.4 Reconstruir el índice

Los índices que ya existen no tienen las notas. Subir el número de versión del índice, para que la
aplicación sepa que el suyo se ha quedado viejo y avise de que hay que reconstruirlo, como ya hace
hoy. El aviso ya existe; solo hay que subir la versión.

## 3. Cómo se comprueba

Prueba nueva, `pruebas/buscar-en-notas.mjs`, sin navegador:

1. Asunto abierto con una nota que dice "empadronamiento". Se busca esa palabra y sale.
2. Buscar dos palabras sueltas, en cualquier orden, una del nombre y otra de una nota: sale.
3. Con tildes y sin tildes, da igual.
4. Asunto archivado con esa palabra en una nota: sale, y con el trocito de la nota debajo.
5. Un índice de la versión vieja avisa de que hay que reconstruirlo.
6. Una nota de 50.000 caracteres no revienta el índice: se recorta.

## 4. Qué NO hay que hacer

- **No** guardar en el índice la nota entera con su autor y su fecha. Solo el texto, normalizado y
  recortado, que es lo único que hace falta para buscar.
- **No** buscar abriendo las carpetas del ARCHIVO. Para eso está el índice.
- **No** meter las notas del tablón aquí. Son otra cosa y no van atadas a un asunto.

## 5. Cuánto es

Un día. Mejor después de la fila 64.
