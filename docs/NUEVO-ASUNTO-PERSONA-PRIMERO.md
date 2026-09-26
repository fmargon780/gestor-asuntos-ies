# Nuevo asunto: primero la persona, y al crear se abre la mesa (fila 179)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Primera parte de la «tanda 3» del análisis
de usabilidad. **Va después de las filas 173 a 178** (usa `App.nuevoAsuntoCon` de la 173 y las
palabras de `docs/VOCABULARIO.md`).

## Qué quiere

En la oficina casi nunca se empieza pensando «voy a abrir un tipo X de la categoría Y». Se empieza
con «esta persona ha pedido esto». Hoy el formulario obliga a categoría → tipo → tercero. Se le da
la vuelta: **primero el tercero, después el tipo**. Y al crear, se va directo a trabajar: **la
mesa del primer hito**, no la ficha.

## Ficheros que se tocan

- `index.html` (`#pantalla-nuevo`: fuera el bloque «¿De qué es el asunto?»; el buscador arriba)
- `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`, `js/asuntos-nuevo-crear.js`,
  `js/asuntos-nuevo-alta.js`
- `js/tipos-buscador.js`, `js/tipos-organo.js`, `js/tipo-al-vuelo.js` (la parrilla de tipos)
- `js/guias-enganche.js` (el resumen de la guía al elegir tipo)
- `js/datos.js` solo si hace falta una búsqueda en todas las categorías a la vez (una función
  nueva que reutilice la búsqueda por categoría que ya existe)
- `js/navegacion.js` o `js/hito-mesa.js` (abrir la mesa tras crear)
- Las pruebas de `pruebas/` que recorren Nuevo asunto
- Si algún fichero pasa de 600 líneas, pártelo

No leas el repositorio entero. Cambios quirúrgicos.

## Cómo tiene que quedar

### 1. Arriba, el buscador del tercero, en todas las categorías

- Un solo campo: «¿Para quién es? Escribe dos letras del nombre, DNI, NIF o Nº escolar».
- Busca **a la vez en todas las categorías** (alumnado, personal, empresas, familia —tutores
  legales—, Administraciones, otros), con la misma búsqueda por categoría de hoy, y junta los
  resultados. Cada resultado lleva una etiqueta pequeña con su categoría y el pie de hoy
  («1ºESO-A · 26-27», «Solicitante, todavía sin matricular», «DNI … · Tutor/a de …»…). Primero
  los matriculados y en activo; los antiguos y cesados, después y en su color de hoy.
- Si no aparece, debajo: «¿No está? Darlo de alta como:» y un botón por cada categoría que admite
  alta («Alumno solicitante», «Personal», «Empresa», «Administración», «Otro»), que abren el alta
  de hoy (`App.altaTercero`) con lo escrito ya puesto. Dado de alta, queda elegido (fila 173).
- Elegido: la tarjeta «Nombre · categoría · [Cambiar]», como hoy.

### 2. Debajo, los tipos: solo los que valen para esa persona

- En cuanto hay tercero, la parrilla de tipos enseña **solo los tipos de su categoría**, con el
  buscador de tipos y el agrupado por quién lo encarga de hoy, y «+ Crear tipo nuevo» (ya con la
  categoría del tercero, sin preguntarla).
- **También se puede empezar por el tipo**: sin tercero, la parrilla enseña los tipos de todas las
  categorías (los más usados primero, como hoy); al elegir uno, el buscador de arriba se limita a
  su categoría. Sea cual sea el orden, el resultado es el mismo.
- Si el tercero y el tipo no son de la misma categoría (por ejemplo, se cambia la persona después),
  se quita el tipo y se avisa en una línea: «Ese tipo no vale para esta persona. Elige otro.»

### 3. Al pulsar un tipo, su resumen

Justo debajo del tipo elegido, una línea gris con lo que trae su guía:
«**7 hitos** · 3 plantillas de documento · plazo de 20 días hábiles · lo encarga Jefatura de
Estudios». Lo que no tenga, no sale. Sin guía: «Este tipo todavía no tiene guía.». La guía entera
ya no se pinta al fondo del formulario (quitar `#guia-nuevo`); en la ficha sigue igual.

### 4. El resto del formulario, igual

Fecha de inicio, año académico, grupo, datos del asunto, descripción, «Quién lo pide y por qué
vía» (fila 173), fecha límite, el recuadro de parecidos, la vista previa y «Crear el asunto».
Salen en cuanto hay tercero y tipo, como hoy.

### 5. Al crear, la mesa del primer hito

- Tras crear, abrir la ficha (para que «← Volver» lleve a ella) y **encima, la mesa del hito que
  haya quedado «En curso»** (`HitoMesa.abrir`). «← Volver a los hitos» y «← Volver» funcionan
  como siempre.
- Si el asunto no tiene hitos, se queda en la ficha, como hoy.
- Si el asunto se creó con un documento (Por clasificar o bandeja), el cuadro de ponerle nombre
  (fila 174) se abre encima de la mesa.
- «Crear los que tocan» (recurrentes) con varios asuntos no abre nada, como hoy.

## Prueba

Una prueba nueva en `pruebas/` (navegador): escribir parte del nombre de un tutor legal y de un
alumno y ver los dos en la misma lista con su etiqueta; elegir al alumno y ver solo tipos de
alumnado; elegir un tipo y ver su resumen; crear y comprobar que se abre la mesa del hito 1.
Empezar por el tipo también funciona. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir la línea de «Categoría
→ tipo → tercero» de la sección 5. Poner al día `docs/contexto/ASUNTOS.md`. Entrada en
`docs/HISTORIA.md`.
