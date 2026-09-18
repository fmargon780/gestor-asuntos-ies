# La sección Campos, en tres categorías, y un creador de campos calculados

Instrucción de la cola, fila 56. Diseño cerrado con Francisco el 18 de septiembre de 2026.

**Sube directamente a `main`, sin abrir ninguna petición de cambios.** Cambios quirúrgicos: no
reescribas ficheros enteros y no leas el repositorio entero. Una sola prueba al final. Como
máximo dos subidas (regla 13 de la cola).

---

## 1. El problema

En Ajustes → Tipos de asunto → pantalla de un tipo → sección **Campos**, el catálogo entero está
desplegado a la vez: todas las columnas del CSV de la categoría, los calculados y los propios, uno
debajo de otro. Con el RegAlum eso son decenas de filas, y la sección ocupa media pantalla larga.
Francisco tiene que desplazarse mucho para ver el resto de la pantalla del tipo.

Además, los campos calculados están escritos a mano en el código (`Campos.CALCULADOS`, con un solo
elemento: `curso`). Francisco no puede crear ninguno.

## 2. Lo que hay que conseguir

**(a) La sección Campos se queda corta.** Solo enseña los campos que ese tipo ya tiene: una línea
por campo, con sus casillas *Obligatorio* y *Añadir al nombre*, las flechas de orden, *Quitar*, y
el botón *Guardar campos*. Debajo, un único botón **+ Añadir campo**. Nada más. Cuatro o cinco
líneas en total cuando el tipo tiene pocos campos.

**(b) El catálogo se abre aparte, en tres categorías.** Al pulsar *+ Añadir campo*, el cuerpo de
la sección Campos se sustituye por un panel con tres pestañas y un botón *← Volver a los campos
del tipo*:

1. **De la ficha** — las columnas del fichero de la categoría del tipo, con buscador.
2. **Míos** — los campos propios (texto libre o lista cerrada).
3. **Calculados** — los que salen de otro campo.

Cada pestaña lleva su cuenta en el rótulo: `De la ficha (48) · Míos (3) · Calculados (2)`.

**Es un panel dentro de la propia sección, no un cuadro emergente.** Motivo: solo hay un
`U.preguntar` y no se puede abrir un segundo mientras el primero espera (regla de
`docs/CONTEXTO-CORTO.md`), y así además se aprovecha todo el ancho de la columna.

**(c) Francisco puede crear campos calculados** desde la pestaña Calculados, con seis operaciones
y vista previa sobre una persona de verdad.

## 3. La sección Campos, por dentro

Ahora todo vive en `construirSeccionCampos` de `js/ajustes-tipo.js` (unas 250 líneas de las 430
del fichero). Se parte:

- **En `js/ajustes-tipo.js` se queda solo** la lista de campos puestos, el botón *+ Añadir campo*
  y el botón *Guardar campos*. El catálogo, el buscador y el formulario de campo propio se van.
  El fichero tiene que quedar más corto que ahora, no más largo.
- **`js/campos-catalogo.js` (nuevo)** monta el panel de las tres pestañas, incluido el formulario
  de crear campo propio (que se mueve tal cual desde `ajustes-tipo.js`, sin rehacerlo).
- **`js/campos-calculados-editor.js` (nuevo)** monta el formulario de crear y cambiar un campo
  calculado, con su vista previa.
- **`js/campos-calculo.js` (nuevo)** es el motor: evalúa una receta sobre una persona. Sin nada de
  interfaz, para que se pueda probar solo.

Reglas de comportamiento que **no cambian**:

- La lista de campos del tipo se sigue mutando en memoria y solo se escribe en `campos.json` al
  pulsar *Guardar campos*.
- Los campos propios y los calculados **sí se guardan en el momento de crearlos o cambiarlos**,
  como ya hace `crearPropio` hoy. Son compartidos por todos los tipos.
- Al volver del panel al listado, los campos añadidos ya se ven en la lista, todavía sin guardar.
  Si se han añadido campos y se sale de la pantalla sin guardar, avisar con `U.preguntar`
  ("Has añadido N campos y no los has guardado. ¿Salir sin guardarlos?").
- Un campo que ya está puesto en el tipo no sale en el catálogo (eso ya lo hace
  `catalogoDisponible`).
- Se sigue avisando de en qué otros tipos se usa un campo propio
  (`Campos.tiposQueUsanPropio`), y ahora también de un calculado.
- Usar `U.mientrasGuarda` en todo botón que guarde, y `U.conservandoLoEscrito` no hace falta aquí
  porque este panel no se repinta solo.

En la pestaña **De la ficha**: buscador arriba (el que ya existe, `campos-buscar`), lista debajo a
dos columnas cuando el ancho dé para ello (rejilla, no dos listas), hasta 120 filas visibles. Cada
fila: nombre de la columna y botón *Añadir*.

En la pestaña **Míos**: cada campo propio con su clase ("texto libre" o "lista: 1º, 2º, 3º") y los
botones *Añadir*, *Cambiar* y *Borrar*. Borrar avisa primero de los tipos que lo usan y, si se
confirma, lo quita también de esos tipos. Abajo, *+ Crear un campo propio*.

En la pestaña **Calculados**: cada uno con su receta escrita en palabras (ver el punto 5) y los
botones *Añadir*, *Cambiar*, *Duplicar* y *Borrar*, con el mismo aviso de uso. Abajo, *+ Crear un
campo calculado*.

## 4. Los campos calculados: cómo se guardan

En `_GESTOR/campos.json` entra una lista nueva, hermana de `propios`:

```
{
  "propios": [ ... ],
  "calculados": [
    {
      "id": "c1",
      "nombre": "Curso",
      "categorias": ["ALUMNADO"],
      "origen":   { "clase": "grupo" },
      "operacion": "quitarFinal",
      "parametros": { "n": 1, "soloSiEsLetra": true }
    }
  ],
  "porTipo": { ... }
}
```

`porTipo` no cambia de forma: un campo calculado se sigue guardando ahí como
`{ "origen": "calculado", "id": "c1", "obligatorio": …, "enNombre": … }`.

**El origen** (de dónde sale el valor de partida) tiene tres clases:

- `{ "clase": "columna", "columna": "Unidad" }` — una columna del fichero de la categoría. Para
  saber qué columnas existen hay que mirar la **cabecera del CSV**, nunca `persona.campos`, que
  solo trae las columnas con datos (trampa ya conocida).
- `{ "clase": "grupo" }` — la forma compacta del grupo, `Nombres.grupoCompacto(persona.unidad,
  persona.curso)`. Es la que usa hoy el calculado `curso`, y la que da `1ºBach` y no `1º Bach`.
- `{ "clase": "calculado", "id": "c2" }` — otro campo calculado. Se permite encadenar **hasta 3
  saltos**; más allá, el valor sale vacío y no se cuelga (guardia de profundidad). Al guardar, no
  dejar crear un ciclo (un calculado que dependa de sí mismo, directa o indirectamente): avisar y
  no guardar.

## 5. Las seis operaciones

Todas recortan los espacios sobrantes del principio y del final del resultado. Si el valor de
partida está vacío, el resultado es vacío y no es un error.

Cada una tiene que saber describirse en una frase, para pintarla en la lista de calculados y en la
vista previa (`Calculo.describir(receta)`):

| Clave | Qué hace | Parámetros | Cómo se describe |
|---|---|---|---|
| `quitarFinal` | Quita los últimos caracteres | `n` (1-20), `soloSiEsLetra` | "El grupo, sin su última letra" |
| `quitarInicio` | Quita los primeros caracteres | `n` (1-20) | "Unidad, sin sus 2 primeros caracteres" |
| `partir` | Se queda con lo de antes o lo de después de un signo | `signo` (1 carácter), `lado` (`antes`/`despues`), `ocurrencia` (`primera`/`ultima`) | "Unidad, lo que va antes del primer espacio" |
| `equivalencias` | Tabla de conversión | `pares` (lista de `{de, a}`), `siNoEsta` (`dejar`/`vaciar`), `ignorarMayusculas` | "El grupo, convertido con una tabla de 4 equivalencias" |
| `juntar` | Junta dos orígenes con un separador | `origen2` (mismo formato que `origen`), `separador` | "Unidad y Turno, unidos por un guion" |
| `deFecha` | Saca un dato de una fecha | `que`: `edad` / `anio` / `anioAcademico` | "De Fecha de nacimiento, la edad de hoy" |

Detalles que hay que respetar:

- `quitarFinal` con `soloSiEsLetra` marcado solo quita el carácter si es una letra (incluidas las
  acentuadas). Es lo que hace hoy `Campos.calcularCurso`, y hay que clavarlo.
- `equivalencias` compara normalizando espacios; con `ignorarMayusculas` marcado usa
  `U.normalizar`. `siNoEsta: "dejar"` devuelve el valor tal cual; `"vaciar"`, cadena vacía.
- `deFecha` acepta `dd/mm/aaaa` y `aaaa-mm-dd`. `edad` son los años completos a día de hoy.
  `anioAcademico`: de septiembre en adelante es `AA-AA+1` (septiembre de 2026 → `26-27`); antes de
  septiembre es `AA-1-AA`. **Si en `js/nombres.js` ya hay una función que calcule el año
  académico, se usa esa**: no puede haber dos formatos distintos en la aplicación.
- `juntar` con uno de los dos orígenes vacío devuelve el otro solo, sin separador colgando.

**Validar antes de guardar** y no dejar guardar si falla: nombre escrito y no repetido entre los
calculados (avisar del parecido con `U.parecidos`, como hace `avisoPropio`), al menos una
categoría marcada, `n` entre 1 y 20, `signo` de un solo carácter, al menos un par con `de` escrito
en `equivalencias`, y `origen2` distinto de `origen` en `juntar`.

## 6. El formulario de crear un campo calculado

Dentro de la pestaña Calculados, en el mismo panel (no otro cuadro). De arriba abajo:

1. **Nombre del campo** — texto. Con el aviso de nombres parecidos.
2. **Vale para** — casillas de ALUMNADO, PERSONAL, EMPRESAS, OTROS. Al menos una.
3. **De dónde sale** — un desplegable con las tres clases de origen. Si es *una columna*, un
   buscador de columnas de la categoría (las mismas que la pestaña *De la ficha*). Si es *otro
   campo calculado*, un desplegable con los que hay.
4. **Qué le hago** — un desplegable con las seis operaciones. Debajo, solo los parámetros de la
   que esté elegida; los demás no se pintan.
5. **Vista previa** — una caja gris con: el nombre de la persona con la que se está probando, el
   valor de partida, la receta en palabras, y el resultado. Se recalcula sola al cambiar cualquier
   cosa del formulario, sin pulsar nada.
6. **Botones** — *Cancelar* y *Crear y añadir* (o *Guardar los cambios* si se está cambiando uno
   que ya existe).

**Con quién se prueba la vista previa:** con personas de verdad de la primera categoría marcada.
Se coge la primera persona de esa lista que traiga algo en el origen, y un botón *Probar con otro*
pasa a la siguiente. Si no hay ninguna (la lista está vacía o la aplicación no tiene todavía la
carpeta de datos), la vista previa dice "No hay con quién probarlo todavía" y el botón de guardar
sigue funcionando. **No se toca el buscador de terceros**: se lee la lista de la categoría con lo
que ya hay (`Datos.cargar`).

## 7. El calculado `curso` de fábrica

Hoy `curso` está escrito en `Campos.CALCULADOS`, en el código. Pasa a ser un campo calculado más,
que Francisco ve y puede cambiar:

- La primera vez que se lee `campos.json` sin un calculado con `id: "curso"`, se le añade esta
  receta, y se guarda solo si el fichero ya existía (no crear `campos.json` solo para esto):
  `{ id: "curso", nombre: "Curso", categorias: ["ALUMNADO"], origen: { clase: "grupo" },
  operacion: "quitarFinal", parametros: { n: 1, soloSiEsLetra: true } }`.
- `Campos.CALCULADOS` se queda como respaldo: si por lo que sea no hay receta con ese id, el valor
  se sigue calculando con la función de siempre. Así ningún nombre de carpeta cambia de un día
  para otro.
- `Campos.usaUnidadOCurso` y `Campos.esColumnaUnidad` siguen funcionando igual: el interruptor
  viejo "Añadir el grupo al nombre" se tiene que seguir escondiendo cuando el tipo lleva la unidad
  o el curso. **Ahora también hay que esconderlo si el tipo lleva cualquier calculado cuyo origen
  sea el grupo o una columna de unidad**, no solo el que se llame `curso`.

## 8. Cambios en `js/campos.js` (quirúrgicos)

- `normalizar` acepta y normaliza la lista `calculados` (cada receta con su id, nombre,
  categorías, origen, operación y parámetros; descartar las que no tengan id, nombre u operación
  conocida).
- Función nueva `guardarCalculados(gestor, mutar)`, copia de `guardarPropios`: relee el fichero
  antes de escribir y solo toca su propio trozo.
- `catalogoDeCategoria` junta ahora los calculados del usuario que tengan esa categoría marcada,
  además de los de `CALCULADOS`. Sin duplicar el `curso`.
- `valorInicial` para un calculado: si hay receta en `campos.json`, la evalúa con
  `Calculo.evaluar`; si no, con la función de `CALCULADOS`.
- `nombreDeCampo` para un calculado mira primero los del usuario y después `CALCULADOS`.
- Función nueva `tiposQueUsanCalculado(config, id)`, gemela de `tiposQueUsanPropio`.

No se toca `js/nombres.js` ni `js/asuntos-nuevo.js`: los campos siguen entrando en el nombre y en
el formulario exactamente por donde entran hoy.

## 9. Ficheros que hay que tocar

Nuevos:

- `js/campos-calculo.js` — el motor: `Calculo.evaluar(receta, persona, config)`,
  `Calculo.describir(receta, config)`, `Calculo.validar(receta, config)`, `Calculo.OPERACIONES`.
- `js/campos-catalogo.js` — el panel de las tres pestañas, con el formulario de campo propio.
- `js/campos-calculados-editor.js` — el formulario de campo calculado, con la vista previa.
- `pruebas/campos-calculo.test.js` — con el estilo de las pruebas que ya hay en `pruebas/`.

Se cambian:

- `js/campos.js` — lo del punto 8.
- `js/ajustes-tipo.js` — adelgazar `construirSeccionCampos` como dice el punto 3.
- `index.html` — los tres `<script>` nuevos, **después** de `js/campos.js` y **antes** de
  `js/ajustes-tipo.js`. El orden importa.
- El CSS donde ya viven `.tipo-asunto-seccion` y `.fila-tipo`: solo lo poco que haga falta para
  las pestañas del panel y la rejilla a dos columnas. Nada de una hoja nueva.
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md` al terminar,
  sustituyendo la línea vieja, no añadiendo una debajo.

Antes de colgar nada nuevo de `App`, comprobar que el nombre no está ya cogido.

## 10. La prueba

Un solo fichero de pruebas, al final, sobre el motor (no sobre la interfaz):

- `quitarFinal` con `soloSiEsLetra`: `1ºA` → `1º`, `1ºBachA` → `1ºBach`, `2ºFPB B` → `2ºFPB`,
  `1º` → `1º` (no quita el `º`, que no es letra). **Estos tres primeros casos tienen que dar lo
  mismo que `Campos.calcularCurso`**: compararlo en la propia prueba.
- `quitarInicio`, `partir` en sus cuatro combinaciones, `equivalencias` con y sin
  `ignorarMayusculas` y con los dos valores de `siNoEsta`, `juntar` con un origen vacío, y
  `deFecha` en sus tres modos con las dos formas de escribir la fecha.
- Un encadenado de dos saltos, y un ciclo, que tiene que devolver vacío sin colgarse.
- Valor de partida vacío en las seis operaciones: resultado vacío, sin error.

## 11. Qué no se toca

- La pantalla de crear un asunto: los campos siguen saliendo solos y rellenos, igual que hoy.
- El nombre de las carpetas ya creadas, y los asuntos que ya existen.
- Los campos de un tipo no entran en el nombre de los documentos (ya descartado).
- El buscador de terceros.
- `js/nombres.js`, salvo para leer su función de año académico si ya existe.
