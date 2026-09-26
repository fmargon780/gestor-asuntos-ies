# Nuevo asunto empieza por la persona (fila 183)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Primera parte de la «tanda 3» del análisis
de usabilidad (`claude/Analisis-usabilidad-2026-09-26.md`, propuesta P4). **Va después de la fila
182.**

Idea de fondo: en el trabajo real casi nunca se empieza pensando «voy a abrir un CERTIFICADO de
ALUMNADO». Se empieza con «Ana García ha pedido esto». El formulario tiene que seguir ese orden,
sin impedir el contrario.

## Ficheros que se tocan

- `index.html` (`#pantalla-nuevo`: el orden de los bloques)
- `js/asuntos-nuevo.js` (`prepararNuevo`, `pintarCategorias`, `elegirCategoria`, `pintarTipos`)
- `js/asuntos-nuevo-alta.js` (`pintarBuscadorDeTercero`: el buscador único)
- `js/asuntos-nuevo-campos.js` y `js/asuntos-nuevo-crear.js` (el bloque de detalles; «Crear» abre
  la mesa)
- `js/tipos-buscador.js` (la parrilla limitada a la categoría de la persona)
- `js/guias-vista.js` (el resumen de la guía al pulsar el tipo)
- `js/hito-mesa.js` (abrir la mesa del primer hito al crear)
- `js/otros-del-tercero.js` (el recuadro de la fila 163 sigue saliendo al elegir la persona)
- `css/` el que toque (`nuevo.css` o el que exista)
- Las pruebas de `pruebas/` que rellenen Nuevo asunto (varias: `nuevo-asunto-sin-repetir.mjs`,
  `asunto-sin-eleccion.mjs`, `aviso-de-parecidos.mjs`…): ponerlas al día
- `docs/contexto/ASUNTOS.md`

No leas el repositorio entero. Cambios quirúrgicos. Los identificadores internos (`data-*`, nombres
de función) se quedan: cambia el orden y lo que se ve.

## Cómo tiene que quedar

Dos bloques **a la vista a la vez**, uno al lado del otro en pantalla ancha (el de la izquierda, la
persona; el de la derecha, el tipo), y debajo, a todo el ancho, el bloque de detalles. Se pueden
rellenar en el orden que se quiera.

### 1. Bloque «Con quién es el asunto» (izquierda)

- **Un solo buscador que busca en todas las categorías a la vez** (alumnado, personal, empresas,
  tutores legales, administraciones, otros). Cada resultado lleva su etiqueta de categoría a la
  derecha (`ALUMNADO`, `EMPRESA`…). Matriculados antes que antiguos, como hoy en Personas.
- Debajo del buscador, las pastillas de categoría de siempre, **para filtrar** (no para elegir
  antes): pulsarlas limita los resultados; ninguna pulsada = todas.
- «+ Dar de alta» sigue igual (pide la categoría si no hay pastilla pulsada). El tercero recién
  dado de alta queda elegido (fila 173).
- Elegida la persona: su recuadro de «lo que ya tiene» (fila 163) debajo, como hoy.

### 2. Bloque «Qué tipo de asunto» (derecha)

- **Si hay persona elegida**, la parrilla enseña solo los tipos de su categoría, los más usados
  arriba (lo que ya hace `js/tipos-buscador.js`), agrupados por órgano como hoy.
- **Si no hay persona**, la parrilla enseña todos los tipos con su categoría en pequeño; al elegir
  uno, el buscador de la izquierda queda filtrado a esa categoría. Es el camino «tipo primero», que
  sigue existiendo.
- **Al pulsar un tipo, arriba de la parrilla sale el resumen de su guía en una línea**: «7 hitos ·
  3 documentos · plazo de 20 días hábiles · lo encarga Jefatura». Pulsable: despliega la guía
  entera (lo que hoy se enseña al fondo del formulario) y se vuelve a plegar. Sin guía: «Sin guía:
  el asunto se crea sin hitos».
- «+ Crear tipo nuevo» sigue donde está.

### 3. Bloque «Detalles» (debajo, a todo el ancho)

Un solo bloque con: fecha de inicio (fecha límite calculada al lado, como hoy), curso y grupo si la
categoría los usa, los campos del tipo (rellenos solos los calculados), descripción, y **«Quién lo
pide y por qué vía»** (el bloque único de la fila 173). Desaparece cualquier resto de «Vía de
comunicación» o «Fecha» duplicadas. La vista previa del nombre de la carpeta, debajo, siempre a la
vista.

### 4. «Crear el asunto»

- Se activa cuando hay persona y tipo. Crea como hoy (`crearAsuntoDelFormulario`), con la parada de
  duplicados de siempre.
- **Después de crear, abre directamente la mesa del primer hito** del asunto (si el tipo tiene
  guía); si no tiene, la ficha. «← Volver» desde la mesa lleva a la ficha; desde la ficha, a donde
  se estaba antes de Nuevo asunto.
- `App.nuevoAsuntoCon({ tercero })` y `App.nuevoAsuntoCon({ tipo, tercero })` (filas 173-175 y
  «Crear asunto con él») rellenan los bloques que traigan y dejan el otro pendiente.

### 5. Lo que ya se sabía y hay que respetar

Un tipo pertenece a una categoría, y la categoría del asunto es la del tercero. Con persona primero
esa regla se ve (solo salen los tipos que valen para ella). No se cambia ahora: si un tipo hace
falta en dos categorías, se duplica, como hoy.

## Lo que no se hace

- No se cambia cómo se guarda nada ni el nombre de la carpeta.
- No se quita el camino «tipo primero».

## Prueba

Prueba de navegador: escribir «García» en el buscador único trae resultados de más de una
categoría con su etiqueta; elegir a la alumna limita la parrilla a los tipos de ALUMNADO; pulsar un
tipo enseña el resumen de la guía; «Crear el asunto» abre la mesa del hito 1; el camino inverso
(tipo primero) también crea. `npm test` entero al final, con las pruebas viejas puestas al día.

## Al terminar

`docs/contexto/ASUNTOS.md` (el formulario nuevo), `docs/CONTEXTO.md` («Decisiones de diseño»: ya no
es «primero la categoría»), `docs/CONTEXTO-CORTO.md` sección 5 (la primera línea). Entrada en
`docs/HISTORIA.md`. Sube directamente a `main`, sin pull request, en como mucho dos subidas.
