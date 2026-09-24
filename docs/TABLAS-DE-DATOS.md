# Tablas de datos y huecos que traen datos de ellas (fila 110)

Cerrado con Francisco el 24-sep-2026. Primer caso real: el **certificado de función tutorial**.

## Para qué

Hoy, para certificar en qué periodos fue tutor un profesor, Francisco descarga de Séneca un PDF
por curso («Relación de funciones tutoriales»), los pasa a Excel a mano, los une en una tabla,
busca en ella a cada profesor y copia sus filas en la plantilla. Además, su compañero pone
arriba la **Especialidad**, que no está en ese PDF sino en la tabla del profesorado (`RelPerCen`).

Lo que se quiere, en general: **tablas de datos** que la app lee de la carpeta de datos, unidas a
la persona por su DNI, y **huecos de plantilla** que traen de esas tablas un dato suelto o una
tabla entera, para el tercero del asunto desde el que se genera el documento.

## Lo que ya existe y no hay que rehacer

- `js/datos.js`, `cargarPersonal`: ya lee **todos** los `RelPerCen*.csv` de la carpeta de datos,
  saca el curso del nombre del fichero (`cursoDelFichero`) y, de cada persona, se queda con los
  datos del curso más reciente en que sale (`r.puesto`, `r.campos`). **La Especialidad es
  `r.puesto` tal cual** (p. ej. «Biología y Geología (Inglés) P.E.S.»): decidido así, sin recortar
  nada. Clave de persona: `clavePersona` (dígitos del documento). Reutilizarla para unir tablas.
- Plantillas de documento: `js/plantillas.js` (`Plantillas.HUECOS`, `valoresDeAsunto`),
  `js/plantillas-documento.js` (generar, lista de «faltan»), `js/docx.js` (`rellenar`,
  `ponerImagen`, reparación de huecos partidos entre varios `<w:t>`), `plantillas/*.md` +
  `scripts/hacer-plantillas.mjs` para generar los `.docx`, `plantillas/indice.json`.
- Lectura de PDF: `App.cargarPdfJs()` (`js/cargar-fichero.js`), ya usada por `js/registro-lector.js`.
- Contexto de cada zona: `docs/contexto/PERSONAS.md` y `docs/contexto/DOCUMENTOS-PDF.md`.

## Qué hay que hacer

### 1. Módulo nuevo `js/tablas-datos.js` (`window.TablasDatos`)

Lee y guarda en caché (como `Datos`) las tablas de la carpeta de datos:

- **Tutorías**: todos los PDF cuyo nombre normalizado empiece por `Funcion Tutorial` (Séneca los
  llama `Función Tutorial 2025-2026.pdf`; aceptar también que empiecen por `RelFunTut`).
  - Leer con pdf.js por posiciones (x/y de cada trozo de texto), no por texto corrido.
  - El curso sale del propio texto: «durante el curso escolar 2025/2026» → `2025/2026`. Si no se
    encuentra, del nombre del fichero (misma lógica que `cursoDelFichero`).
  - Bloque 1, «Funciones tutoriales procedentes de tutorías de unidades»: columnas `Unidad`,
    `Empleado/a`, `D.N.I.`, `Periodo`.
  - Bloque 2, «Funciones tutoriales correspondientes a Pedagogía Terapéutica, Audición y Lenguaje
    y Diversificación Curricular»: sin unidad. En esas filas, **Grupo** = «Pedagogía Terapéutica,
    Audición y Lenguaje o Diversificación».
  - Trampas vistas en el ejemplo real: nombres partidos en dos líneas («Martínez Barrientos, María
    del» + «Carmen»; «Cueto Carretero, María Antonia» + «(Sustituto/a)»); la segunda línea no
    trae DNI ni periodo y se pega a la fila de arriba. Quitar « (Sustituto/a)» del nombre. Un
    punto suelto tras el apellido («Manhaes Panini ., Andre»). La misma persona puede tener varias
    filas en el mismo grupo (periodos cortados). Cabeceras, pies («Pág.», «Ref.Doc.», «Cód.Centro»,
    «Fecha Generación») y el texto del certificado se ignoran.
  - `Periodo` «01/09/2025 - 31/08/2026» → `desde` y `hasta`.
  - Fila resultante: `{ curso, grupo, nombre, dni, desde, hasta, clave }`. Quitar duplicados
    exactos (mismo PDF bajado dos veces).
- **Profesorado**: no leer otra vez; tomarlo de `Datos` (`cargarPersonal`).
- **Cualquier Excel o CSV** que se deje en una subcarpeta `Tablas` de la carpeta de datos: una
  tabla por fichero, con su cabecera tal cual; la columna de DNI se detecta por nombre (`DNI`,
  `D.N.I.`, `DNI/Pasaporte`, `Documento`, `NIF`). Los CSV de Séneca vienen en Latin-1: reutilizar
  el lector de CSV de `js/datos.js` (`aTabla`), que ya lo resuelve. El `.xlsx` es un ZIP: leerlo
  con el mismo lector de ZIP de `js/docx.js` (primera hoja, `sharedStrings`), **sin librería
  nueva** (la copia sin internet no puede depender de nada de fuera).
- `TablasDatos.filasDe(nombreTabla, persona)` → filas de esa persona (por `clavePersona`),
  ordenadas por curso y fecha. `TablasDatos.lista()` → tablas encontradas, con fichero, curso y
  número de filas.

### 2. Ajustes → Mantenimiento: bloque «Tablas de datos»

Solo lectura: cada tabla encontrada, de qué ficheros sale, cursos que cubre y cuántas filas, y los
ficheros que no se han podido leer, con el motivo en castellano. Un botón «Volver a leer».

### 3. Huecos nuevos (en `Plantillas.HUECOS`, con doble llave, con su explicación y botón Copiar)

- `{{ESPECIALIDAD}}`: `puesto` de la persona en `Datos` (curso más reciente en que sale).
- `{{TABLA TUTORIAS}}`: tabla de Word con las columnas **Curso escolar · Grupo · Desde · Hasta**,
  una fila por periodo, con cabecera en negrita y bordes finos, al ancho útil. Se monta en
  `js/docx.js` con una función nueva `Docx.ponerTabla(buffer, nombreHueco, cabecera, filas)`,
  gemela de `ponerImagen`: sustituye el párrafo del hueco por un `<w:tbl>`.
- General, para otras tablas: `{{DATO <tabla>: <columna>}}` y
  `{{TABLA <tabla>: <col1> | <col2> | …}}`. Los dos anteriores son atajos de estos.
- **Si no hay dato** (la persona no sale en ninguna tabla, o no tiene especialidad): el hueco se
  deja en el Word como `[falta: Especialidad]` **resaltado en amarillo** (`<w:highlight
  w:val="yellow"/>`), y entra en la lista de «faltan» del aviso ámbar que ya existe.
- El tercero del asunto se une a las tablas por `clavePersona` (dígitos del documento); si el
  tercero solo tiene los 4 últimos caracteres, por esos 4 y el nombre normalizado.

### 4. Ficha del tercero (`js/ficha-tercero.js`, si pasa de 400 líneas, en fichero aparte)

Bloque plegado «Datos de las tablas»: por cada tabla con filas de esa persona, una tablita
compacta (en tutorías: Curso · Grupo · Desde · Hasta). Si no sale en ninguna, el bloque no se pinta.

### 5. Plantilla nueva «Certificado de función tutorial»

`plantillas/certificado-funcion-tutorial.md` (+ su `.docx` con `scripts/hacer-plantillas.mjs`) y
su entrada en `plantillas/indice.json`: categoría `PERSONAL`, tipo `CERTIFICADO PERSONAL`,
`tipoDocumento: CERTIFICADO`, texto `tutorias`, firmante `direccion`, sin visto bueno. Texto
acordado (Francisco lo afinará más adelante con su compañero):

> {{MEMBRETE}}
>
> {{TRATAMIENTO FIRMANTE}} {{FIRMANTE}}, del {{CENTRO}}, código {{CODIGO CENTRO}} (usar el hueco
> del código que ya exista; si no existe, crearlo desde los ajustes del centro)
>
> CERTIFICA: Que {{NOMBRE NATURAL}}, con DNI {{REFERENCIA}}, especialidad {{ESPECIALIDAD}}, ha
> ejercido la función tutorial en este centro en los periodos siguientes:
>
> {{TABLA TUTORIAS}}
>
> Y para que conste a petición de la persona interesada, firmo el presente en {{LUGAR Y FECHA}}.
>
> {{TRATAMIENTO FIRMANTE}} — Fdo.: {{FIRMANTE}}

Ajustar a los huecos reales que ya existen (mirar `certificado-personal.md`). Se carga con el botón
de Mantenimiento que ya carga las plantillas del centro.

## Ficheros que se tocan

`js/tablas-datos.js` (nuevo), `js/docx.js` (`ponerTabla`, resaltado de lo que falta),
`js/plantillas.js` (huecos), `js/plantillas-documento.js` (resolver los huecos de tabla antes de
`rellenar`), `js/ajustes-mantenimiento.js` (bloque), `js/ficha-tercero.js` (bloque),
`index.html` (el `<script>`), `plantillas/certificado-funcion-tutorial.md` y `.docx`,
`plantillas/indice.json`, `scripts/copia-local.mjs` si hace falta para la copia sin internet,
`pruebas/tablas-datos.mjs` (nueva) y la documentación de siempre.

## Cómo trabajar

- **No leas el repositorio entero**: solo los ficheros de la lista y los hijos de `docs/contexto/`
  citados.
- Cambios quirúrgicos; no reescribir ficheros enteros. Partir en dos cualquier fichero que haya
  que tocar y pase de unas 400 líneas.
- El módulo nuevo **no envuelve** nada: se engancha por los puntos previstos.
- **Una sola prueba al final**, `pruebas/tablas-datos.mjs`, sin navegador donde se pueda:
  - un PDF de ejemplo generado en la prueba con la misma disposición que el de Séneca (dos
    bloques, nombre partido en dos líneas, «(Sustituto/a)», tres periodos de la misma persona en
    el mismo grupo) → filas correctas;
  - `{{TABLA TUTORIAS}}` dentro de un `.docx` → `<w:tbl>` con cuatro columnas y las filas;
  - `{{ESPECIALIDAD}}` sin dato → `[falta: Especialidad]` en amarillo y en «faltan»;
  - un CSV en Latin-1 y un `.xlsx` mínimo en `Tablas/` → se leen con su cabecera.
  Además, `npm test` entero en verde.
- **Sube directamente a `main`, sin abrir ninguna pull request** (si la sesión lo obliga, la
  fusiona sola en cuanto esté en verde, según la nota del final de `docs/COLA.md`). Como máximo
  las subidas que marca la regla 13 de la cola. Comprobar lo publicado con `curl`.
- No uses los datos reales de ningún profesor en las pruebas ni en el repositorio: nombres y DNI
  inventados.

## Qué verá Francisco

- En Ajustes → Mantenimiento, «Tablas de datos», con las tutorías y el profesorado de cada curso.
- En la ficha de un profesor, sus periodos de tutoría.
- En un asunto «Certificado personal» de un profesor, «Generar documento» → «Certificado de
  función tutorial» sale con su especialidad y la tabla de periodos ya rellenas.
