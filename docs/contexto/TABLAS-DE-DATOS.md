# Tablas de datos y los huecos que traen datos de ellas

Documento hijo de `docs/CONTEXTO.md` (fila 110, 24-sep-2026, `docs/TABLAS-DE-DATOS.md`). Aparte de
`docs/contexto/DOCUMENTOS-PDF.md`, que ya llegaba a 40 KB. Actualízalo al tocar las tablas de
datos, sus huecos o la plantilla «Certificado de función tutorial».

## Las tablas

Las lee `js/tablas-datos.js` (`TablasDatos`, con caché: `cargar(forzar)`, `olvidar()`) de la carpeta
de datos (`App.E.datos`, `_GESTOR/datos`), y se unen a la persona por los dígitos de su documento
(`clave`, lo mismo que `Datos.clavePersona`, ahora exportada); si solo se tienen los 4 últimos
caracteres, por esos 4 y el nombre.

- **TUTORIAS**: los PDF cuyo nombre normalizado empieza por `funcion tutorial` o `relfuntut`. Los lee
  `js/tablas-datos-leer.js` (`TablasDatosLeer.tutoriasDePdf`) con pdf.js **por posiciones**: los
  trozos se agrupan en líneas (misma página, ±3 de altura) y cada trozo va a la columna cuya
  cabecera (`Unidad`, `Empleado/a`, `D.N.I.`, `Periodo`) empieza a su izquierda. Bloque 1,
  «procedentes de tutorías de unidades»; bloque 2, «Pedagogía Terapéutica… Diversificación», con
  grupo «Pedagogía Terapéutica, Audición y Lenguaje o Diversificación». Una línea sin DNI ni periodo
  se pega al nombre de la fila de arriba (nombres partidos, «(Sustituto/a)», que se quita); un punto
  suelto tras el apellido se quita; cabeceras y pies («Pág.», «Ref.Doc.»…) se ignoran. Curso: «curso
  escolar 2025/2026» del texto, o del nombre del fichero. Fila: `{ curso, grupo, nombre, dni, desde,
  hasta, clave }`, sin duplicados exactos (el mismo PDF bajado dos veces). **Ojo**: pdf.js vacía el
  buffer que se le da; se le pasa siempre una copia.
- **Profesorado**: no se lee otra vez, sale de `Datos` (los `RelPerCen`, `cargarPersonal`).
- **Cualquier CSV o Excel de `datos/Tablas/`**: una tabla por fichero (su nombre, en mayúsculas y sin
  extensión: `Departamentos.csv` → `DEPARTAMENTOS`), con su cabecera tal cual. La columna del DNI se
  reconoce por su nombre (`DNI`, `D.N.I.`, `DNI/Pasaporte`, `Documento`, `NIF`). El CSV, con
  `Carpetas.leerTexto` (Latin-1 si no es UTF-8) y `Datos.aTabla`; el `.xlsx`, con el lector de ZIP de
  `js/docx.js` (`Docx.interno`): la primera hoja y sus `sharedStrings`, sin librería nueva.
- **ALUMNADO BD** (filas 142 y 144, `js/alumnado-bd-ver.js`, `AlumnadoBDVer.comoTabla`): la copia de
  la base de datos de alumnado (`datos/ALUMNADO-BD.json`), una fila por alumno y una columna por dato
  (su `etiqueta`); y una tabla «ALUMNADO BD <etiqueta>» por cada dato de tipo `tabla`. Sus filas llevan
  `idEscolar` y se unen a la persona por su Nº escolar, no por DNI
  (`{{DATO ALUMNADO BD: Centro de procedencia}}`, `{{TABLA ALUMNADO BD Materias matriculadas}}`).

`TablasDatos.lista()` → tablas encontradas (fichero, cursos, filas) y ficheros que no se han podido
leer, con el motivo. `TablasDatos.filasDe(tabla, persona)`, ordenadas por curso y fecha.

## Los huecos (`js/plantillas.js`, catálogo `HUECOS`)

- `{{ESPECIALIDAD}}`: el `puesto` de la persona en los RelPerCen (del curso más reciente), tal cual.
- `{{ESPECIALIDAD FIRMANTE}}` y `{{ESPECIALIDAD VISTO BUENO}}` (fila 123): el `puesto` de quien
  ocupa ese cargo en la fecha del documento (`valores.firmante` / `valores['visto bueno']`),
  buscado en el personal por su documento si se sabe y, si no, por el nombre sin tildes, comas ni
  orden (`TablasDatos.especialidadPorNombre`). Sin dato, `[falta: …]` como `{{ESPECIALIDAD}}`.
- `{{TABLA TUTORIAS}}`: tabla de Word con **Cargo · Curso · Toma de posesión · Cese** (fila 123,
  como el certificado del centro), una fila por periodo, cabecera en negrita y bordes finos, a
  9.000 dxa. Cargo = «Tutoría » + grupo, o «Tutoría de Pedagogía Terapéutica, …» en el bloque de
  atención a la diversidad (`TablasDatos.cargoDe`); curso con guion («2025-2026»). En
  `{{TABLA TUTORIAS: …}}` valen los nombres nuevos y los viejos (Curso escolar, Grupo, Desde,
  Hasta). La tablita de la ficha del tercero usa las mismas cuatro columnas.
- **«Cursos que pide»** (fila 123): campo propio de texto del tipo DESEMPEÑO FUNCIÓN TUTORIAL. Si
  el asunto lo trae, `{{TABLA TUTORIAS}}` saca solo los periodos de esos cursos (la tablita de la
  ficha, todos). Lo entiende `js/tablas-datos-cursos.js` (`TablasDatosCursos.entender`, pura):
  «2017-2018», «2017/18», «17-18», «2017», listas con coma, punto y coma o «y», y rangos «… a …»
  (o «hasta»). Sin entenderlo, todos y una línea en el aviso ámbar; vacío, todos.
- Generales: `{{DATO <tabla>: <columna>}}` (el de la fila más reciente) y
  `{{TABLA <tabla>: <col1> | <col2> | …}}` (sin columnas, todas).

`js/plantillas-documento.js` (al generar) llama a `TablasDatos.prepararDocumento(buffer, asunto,
valores)` antes de `Docx.rellenar`: lee qué huecos trae el documento (`Docx.textoDelDocumento`, que
junta los trozos en que Word parte un hueco), busca la persona del tercero
(`FichaTercero.datosBasicos`), mete las tablas en su sitio (`Docx.ponerTabla`, en `js/docx-tabla.js`,
gemela de `Docx.ponerImagen`: sustituye el párrafo del hueco por un `<w:tbl>`) y deja lo de texto en
`valores.especialidad` y `valores.datosTablas` (que `resolverUnHueco` lee para `dato …`/`tabla …`).
**Sin dato**, el valor es `⟦falta: Especialidad⟧` y, después de rellenar,
`TablasDatos.resaltarResultado` → `Docx.resaltarFaltas` lo escribe «[falta: Especialidad]» resaltado
en amarillo (partiendo el trozo de Word donde esté), y lo suma a «faltan» (el aviso ámbar de siempre).

`js/docx.js` se partió (pasaba de 400 líneas): el membrete vive en `js/docx-imagen.js`
(`Docx.ponerImagen`) y las tablas en `js/docx-tabla.js`; los dos usan `Docx.interno` (las piezas del
ZIP). Las pruebas con jsdom que cargan `docx.js` cargan también los dos.

## Lo que se ve (`js/tablas-datos-pantalla.js`)

- Ajustes → Mantenimiento, bloque «Tablas de datos» (solo lectura): cada tabla, sus ficheros, cursos y
  filas; el profesorado (los RelPerCen); los ficheros que no se han podido leer, en ámbar; «Volver a
  leer».
- Ficha del tercero, dentro de «Datos y contacto»: plegable «Datos de las tablas» con una tablita por
  cada tabla en la que salga la persona. Sin ninguna, no se pinta.

## La plantilla «Certificado de función tutorial»

`plantillas/certificado-funcion-tutorial.md` (+ `.docx` con `node scripts/hacer-plantillas.mjs`, que
también actualiza `plantillas/indice.json`). Desde la fila 123
(`docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md`), con el modelo del centro: PERSONAL, tipo **DESEMPEÑO
FUNCIÓN TUTORIAL**, tipo de documento CERTIFICADO, texto `tutorias`, firma **Secretaría** y V.º B.º
de **Dirección**. Encabezado de quien firma con su especialidad, «C E R T I F I C A:» en negrita,
«Que D./Dña. … con DNI …» (`{{DNI}}` trae ya el documento entero del personal, `dniDe` en
`js/plantillas.js`), la tabla, la fórmula con el V.º B.º («del/de la:vistobueno Director/a:vistobueno»)
y las firmas en dos columnas (tabla sin bordes; los tratamientos en mayúsculas con `<w:caps/>`).
Para eso `scripts/hacer-plantillas.mjs` entiende ahora `**negrita**`, `^^mayúsculas^^` y un bloque
`| izquierda | derecha |`. La plantilla casa con el tipo del asunto sin tildes ni mayúsculas
(`Plantillas.documentosDeTipo`). El tipo y su campo están en `datos-biblioteca/biblioteca-centro.json`
(y en `docs/contenido/BIBLIOTECA-PERSONAL.md`; ojo, volver a generar el JSON con
`herramientas/cargar-biblioteca.mjs` pierde los guiones, que se añadieron aparte): el botón de
Mantenimiento lo empareja con el tipo que ya existe, también escrito sin tilde, y le añade el campo
sin tocar su nombre corto. `{{PROVINCIA}}` es ya un hueco de cualquier plantilla. Se carga con el botón de siempre
(Mantenimiento → Plantillas del centro). `pruebas/plantillas-del-centro.mjs` acepta ya los huecos
`TABLA …`/`DATO …`.

Se comprueba con `pruebas/tablas-datos.mjs` (un PDF dibujado con pdf-lib con la disposición de
Séneca, la tabla en Word, la especialidad que falta en amarillo, un CSV en Latin-1 y un `.xlsx`).
