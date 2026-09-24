# El certificado de función tutorial, como lo hace el centro (fila 123)

Cerrado con Francisco el 24-sep-2026. Parte de lo que dejó la fila 110 (`docs/TABLAS-DE-DATOS.md`):
`plantillas/certificado-funcion-tutorial.md`, `{{ESPECIALIDAD}}`, `{{TABLA TUTORIAS}}`,
`js/tablas-datos.js`. Francisco ha pasado el certificado que usa hoy el centro; esta fila adapta la
plantilla a ese modelo, la asocia a su tipo de asunto y le añade un campo.

## El modelo del centro (resumido, sin los datos reales)

- Encabezado: «[Nombre de quien firma], Profesora de [su especialidad] y Secretaria del I.E.S. …, de
  [localidad] ([provincia])».
- «C E R T I F I C A:» (con las letras separadas, en negrita).
- «Que **Dña. [nombre]**, con DNI [DNI], profesora de [especialidad], ha prestado funciones
  tutoriales en este Centro los siguientes cursos:»
- Tabla de cuatro columnas: **Cargo · Curso · Toma de Posesión · Cese**, cuerpo en negrita. Hoy el
  cargo pone solo «Tutoría» y el curso «2017-2018».
- «Y para que conste y surta los efectos oportunos, a petición del interesado/a, expido la presente
  con el Vº Bº del Señor Director, en [localidad] a [fecha].»
- Firmas en dos columnas: a la izquierda «Vº Bº / EL DIRECTOR / Firma Digital / [nombre]», a la
  derecha «LA SECRETARIA / Firma Digital / [nombre]».

## Qué hay que hacer

### 1. La plantilla (`plantillas/certificado-funcion-tutorial.md` y su `.docx`)

Reescribirla sobre el modelo, con las formas dobles que ya resuelve `js/genero.js` (fila 111):

- Cabecera: `{{MEMBRETE}}`.
- Encabezado: `{{FIRMANTE}}, Profesor/a:firmante de {{ESPECIALIDAD FIRMANTE}} y {{CARGO FIRMANTE}}
  del {{CENTRO}}, de {{LOCALIDAD}} ({{PROVINCIA}})` (ajustar la marca `:firmante` y el nombre real
  de los huecos a lo que ya existe; el cargo con barra se resuelve solo).
- `**C E R T I F I C A:**`
- `Que **D./Dña. {{NOMBRE NATURAL}}**, con DNI {{DNI}}, profesor/a de {{ESPECIALIDAD}}, ha ejercido
  la función tutorial en este centro en los periodos siguientes:` (DNI completo si el hueco existe;
  si no, `{{REFERENCIA}}`).
- `{{TABLA TUTORIAS}}`, ahora con las columnas **Cargo · Curso · Toma de posesión · Cese**:
  - Cargo = «Tutoría » + grupo («Tutoría 4º ESO C»). En las filas sin grupo (Pedagogía Terapéutica,
    Audición y Lenguaje o Diversificación), «Tutoría de Pedagogía Terapéutica, Audición y Lenguaje
    o Diversificación».
  - Curso con guion, como el centro: «2025-2026».
  - Toma de posesión / Cese = desde / hasta de cada periodo.
  - Cambiar `COLUMNAS_TUTORIAS` en `js/tablas-datos.js` (y lo que dependa: el bloque de la ficha del
    tercero puede quedarse con las mismas cuatro columnas nuevas). Que `{{TABLA TUTORIAS: …}}` con
    columnas elegidas siga funcionando con los nombres viejos y los nuevos.
- `Y para que conste y surta los efectos oportunos, a petición de la persona interesada, expido la
  presente con el V.º B.º del {{CARGO VISTO BUENO}}, en {{LUGAR Y FECHA}}.`
- Firmas en dos columnas, igual que el modelo (tabla sin bordes de dos celdas): izquierda «V.º B.º»
  / `{{TRATAMIENTO VISTO BUENO}}` en mayúsculas / «Firma digital» / `{{VISTO BUENO}}`; derecha
  `{{TRATAMIENTO FIRMANTE}}` en mayúsculas / «Firma digital» / `{{FIRMANTE}}`.
- Cabecera YAML: `tipo: DESEMPEÑO FUNCIÓN TUTORIAL`, `firmante: secretaria`,
  `vistoBueno: direccion`, `texto: tutorias`, `tipoDocumento: CERTIFICADO`, `categoria: PERSONAL`.
  Lo mismo en `plantillas/indice.json`. Regenerar el `.docx` con `scripts/hacer-plantillas.mjs`.

### 2. Hueco nuevo `{{ESPECIALIDAD FIRMANTE}}` (y `{{ESPECIALIDAD VISTO BUENO}}`)

El `puesto` (de `Datos`, curso más reciente) de quien ocupa el cargo firmante en la fecha del
documento. Se busca al ocupante en el personal por su documento si el cargo lo guarda, y si no, por
el nombre normalizado. Sin dato: `[falta: …]` en amarillo y en «faltan», como `{{ESPECIALIDAD}}`.
Añadirlos a `Plantillas.HUECOS` con su explicación.

### 3. La plantilla va con el tipo DESEMPEÑO FUNCIÓN TUTORIAL

El tipo ya existe en el centro con ese nombre. Al comparar el tipo de la plantilla con el del asunto,
comparar normalizado (sin tildes ni mayúsculas), para que «DESEMPEÑO FUNCION TUTORIAL» también
case. Si en `datos-biblioteca/biblioteca-centro.json` no está el tipo, añadirlo (categoría
`PERSONAL`, nombre largo «Certificado de desempeño de la función tutorial»).

### 4. Campo propio opcional del tipo: «Cursos que pide»

- Campo de texto libre del tipo DESEMPEÑO FUNCIÓN TUTORIAL, en `camposPorTipo` de la biblioteca, y
  que el botón de Mantenimiento que carga la biblioteca lo añada al tipo que ya existe **sin tocar
  nada más** de ese tipo. Si ese botón no sabe añadir un campo a un tipo existente, enseñarle.
- Al generar, si el campo tiene algo, `{{TABLA TUTORIAS}}` (y la tablita de la ficha no, esa enseña
  todo) saca solo los periodos de esos cursos. Formatos que hay que entender: «2017-2018»,
  «2017/18», «17-18», varios separados por coma o «y», y rangos «2017-2018 a 2019-2020». Si no se
  entiende lo escrito, sacar todos y decirlo en el aviso ámbar. Vacío = todos.

## Ficheros que se tocan

`plantillas/certificado-funcion-tutorial.md` y `.docx`, `plantillas/indice.json`,
`js/tablas-datos.js`, `js/plantillas.js` (huecos nuevos), `datos-biblioteca/biblioteca-centro.json`,
`js/cargar-biblioteca.js` (solo si hace falta para el punto 4), `pruebas/tablas-datos.mjs`
(ampliarla) y la documentación de siempre (`docs/contexto/TABLAS-DE-DATOS.md`).

## Cómo trabajar

- **No leas el repositorio entero**: solo estos ficheros y `docs/contexto/TABLAS-DE-DATOS.md`,
  `docs/contexto/DOCUMENTOS-PDF.md` (la parte del género y de los firmantes).
- Cambios quirúrgicos. Partir en dos cualquier fichero que haya que tocar y pase de unas 400 líneas.
- **Una sola prueba al final**: ampliar `pruebas/tablas-datos.mjs` con: tabla con las cuatro
  columnas nuevas y el cargo con grupo; «Cursos que pide» con un curso, una lista y un rango;
  `{{ESPECIALIDAD FIRMANTE}}` con y sin dato; el tipo sin tilde casa con la plantilla. Datos
  inventados, nunca los del certificado real. `npm test` entero en verde.
- **Sube directamente a `main`, sin abrir ninguna pull request** (si la sesión lo obliga, la fusiona
  sola en cuanto esté en verde). Regla 13 de la cola. Comprobar lo publicado con `curl`.

## Qué verá Francisco

- En un asunto DESEMPEÑO FUNCIÓN TUTORIAL de un profesor, «Generar documento» → el certificado con
  el aspecto del de siempre: firma la Secretaría, V.º B.º del Director, tabla Cargo · Curso · Toma
  de posesión · Cese, todo relleno.
- En Mantenimiento, al volver a cargar la biblioteca, el tipo gana el campo «Cursos que pide».
