# Actividades extraescolares: el certificado del profesorado (fila 311)

Cerrado con Francisco el 8-oct-2026. Cuarta de cuatro filas; va después de la 306
(`docs/ACTIVIDADES-EXTRAESCOLARES.md`, que se lee antes: de ahí sale el registro de actividades,
`_GESTOR/actividades.json`) y de la 310 (las actividades antiguas).

## Qué pasa hoy

El profesorado pide certificados de las actividades extraescolares en las que ha participado,
para concursos de méritos. Puede pedir las de los últimos cinco años. Hoy se hace un certificado
por actividad, con una plantilla que pregunta a mano la actividad, el lugar, las fechas y las
horas.

## Qué decidió Francisco

1. **Un solo certificado por profesor, con todas sus actividades entre dos fechas.** Una tabla
   con una línea por actividad. Vale igual para una sola actividad que para cinco años.
2. **Cada línea dice si organizó o si acompañó**: «Organización» o «Acompañante».
3. Se pide **como cualquier otro certificado**: un asunto a nombre del profesor, y la aplicación
   rellena sola la tabla.
4. Lo firma Secretaría con el V.º B.º de Dirección, como los demás certificados del centro.

Lo decidió la conversación de diseño, y se le dijo: **solo salen las actividades realizadas**
(`Actividades.cuenta`: fecha de fin ya pasada, no anulada y no en la papelera).

## Qué hay que hacer

### 1. La tabla ACTIVIDADES EXTRAESCOLARES

Una tabla de datos más de `js/tablas-datos.js`, que no sale de ningún fichero de `datos/`, sino
del registro de actividades. Modelo: `AlumnadoBDVer.comoTabla(salida)`, que ya mete así sus tablas.
Módulo nuevo `js/actividades-tabla.js` (`window.ActividadesTabla`).

- `ActividadesTabla.comoTabla(salida)`: una fila **por profesor y actividad**, solo de las
  actividades que cuentan: `{ clave, claveNombre, nombre, inicio, fin, actividad, lugar,
  departamento, papel, horas, orden }` (`orden`: la fecha de inicio).
- **A quién pertenece cada fila**: por la `clave` (los dígitos del documento), con la misma regla
  de siempre (`esDeLaPersona`: si solo se tienen los 4 últimos caracteres, esos 4 y el nombre). Si
  la fila no trae `clave` (una actividad antigua de alguien de quien no se sabía el DNI), **por el
  nombre**, como la tabla del Consejo Escolar (`claveNombre`: sin tildes, comas ni orden).
- La caché de las tablas se olvida (`TablasDatos.olvidar()`) cada vez que el registro de
  actividades se guarda: el certificado nunca sale con datos viejos.
- En Herramientas → «Tablas de datos», la tabla sale en la lista como las demás, con su número de
  filas, diciendo que sale de las actividades extraescolares y no de un fichero.

### 2. El hueco `{{TABLA ACTIVIDADES EXTRAESCOLARES}}`

En el catálogo `HUECOS` de `js/plantillas.js` y en `celdasDe` de `js/tablas-datos.js`. Tabla de
Word con el mismo aspecto que `{{TABLA TUTORIAS}}`.

- Columnas: **Fecha · Actividad · Lugar · Participación**, y **Horas** solo si alguna de las filas
  que salen tiene horas apuntadas.
  - *Fecha*: «15/10/2026», o «15/10/2026 a 17/10/2026» si dura varios días.
  - *Participación*: «Organización» o «Acompañante».
  - *Horas*: el número, a la española. Vacío en la fila que no las tenga.
- Orden: por fecha, de la más antigua a la más reciente.
- `{{TABLA ACTIVIDADES EXTRAESCOLARES: Fecha | Actividad | Horas}}` deja elegir las columnas, como
  las demás tablas. Valen también «Departamento» y «Fecha de fin».
- **Entre dos fechas**: si el asunto trae los campos «Actividades desde» y «Actividades hasta»
  (punto 3), solo salen las actividades cuya fecha de inicio cae entre las dos, las dos incluidas.
  Con uno solo, desde o hasta esa fecha. Vacíos, todas. Es la misma idea que «Cursos que pide»
  (`js/tablas-datos.js`, fila 123). El filtro es una función sin efectos:
  `ActividadesTabla.entre(filas, desdeIso, hastaIso)`.
- Persona sin ninguna fila: `[falta: Actividades extraescolares]`, resaltado en amarillo y sumado
  al aviso ámbar, con el mecanismo de `TablasDatos.resaltarResultado`.
- Hueco de texto `{{ACTIVIDADES PERIODO}}`: «, entre el 1 de septiembre de 2021 y el 30 de junio
  de 2026», «, desde el …», «, hasta el …» o nada, según los dos campos.

### 3. El tipo de asunto y sus dos campos

- Tipo **CERTIFICADO ACTIVIDADES EXTRAESCOLARES**, nombre corto `CertActExtra`, categoría
  PERSONAL, lo encarga Secretaría. Sin guía propia.
- Dos campos propios de clase **Fecha**: **«Actividades desde»** y **«Actividades hasta»**. No
  obligatorios. No entran en el nombre de la carpeta.
- **Que llegue solo al centro**, una vez, al entrar, con una pasada como la de la fila 306 (marca
  propia en `actividades.json`): si el tipo no existe, lo crea con `App.crearTipo` y le pone los
  dos campos. Si ya existe, no toca nada. En solo consulta, o con un guardado en marcha, no corre.
- Además, en `datos-biblioteca/biblioteca-centro.json` y `docs/contenido/BIBLIOTECA-PERSONAL.md`,
  como se hizo con CERTIFICADO MIEMBRO CONSEJO ESCOLAR (sin regenerar el JSON con
  `herramientas/cargar-biblioteca.mjs`, que pierde los guiones).

### 4. La plantilla

`plantillas/certificado-actividades-extraescolares.md` (+ su `.docx` con
`node scripts/hacer-plantillas.mjs`, que pone al día `plantillas/indice.json`), calcada de
`plantillas/certificado-miembro-consejo-escolar.md`: tipo de documento CERTIFICADO, texto
`actividades extraescolares`, firma **Secretaría**, V.º B.º **Dirección**, con el membrete.

> {{MEMBRETE}}
>
> D./D.ª {{FIRMANTE}}, Secretario/a del {{CENTRO}}, de {{LOCALIDAD}},
>
> **C E R T I F I C A:**
>
> Que, según los datos que constan en esta Secretaría, **D./D.ª {{NOMBRE NATURAL}}**, con DNI
> {{DNI}}, profesor/a de {{ESPECIALIDAD}}, ha participado en las siguientes actividades
> complementarias y extraescolares organizadas por este centro{{ACTIVIDADES PERIODO}}:
>
> {{TABLA ACTIVIDADES EXTRAESCOLARES}}
>
> Y para que conste, a petición de la persona interesada, se expide el presente certificado, con
> el V.º B.º del/de la Director/a, en {{LOCALIDAD}}, a {{HOY LARGO}}.
>
> (firmas en dos columnas y pie de protección de datos, como el del Consejo Escolar)

Usa los nombres de hueco y las marcas de género que ya usa esa plantilla.

**Que llegue sola al centro**: la misma pasada del punto 3 la cuelga del tipo nuevo si el centro
no la tiene, por el camino de «Cargar las plantillas del centro» (`PlantillasCentro.cargar`, que
no duplica una que ya esté) pero solo con esta plantilla. Si no se puede hacer sin riesgo para las
demás, se deja para ese botón de Mantenimiento y se dice en el mensaje final, en una línea.

### 5. En la ficha del profesor

En «Personas y empresas», en la ficha de una persona de PERSONAL, donde ya salen los «Datos de las
tablas» (`js/tablas-datos-pantalla.js`): una tablita **«Actividades extraescolares»** con las
mismas columnas, todas sus actividades realizadas, sin filtro de fechas. Sin ninguna, no sale.

### 6. Las plantillas viejas

«Participación en actividad extraescolar (a petición)» (tipo CERTIFICADO PERSONAL) y
«Participación del profesorado en actividad extraescolar» se quedan como están. No se borran.

## Qué NO se toca

- Las otras tablas de datos ni sus huecos.
- Cómo se genera, se registra y se firma un certificado: es un documento de Word más.
- El registro de actividades: esta fila solo lo lee.

## Trampas

- `prepararDocumento` busca a la persona del tercero del asunto. Este tipo es de PERSONAL: no hay
  que tocar eso.
- Una persona que figura dos veces en la misma actividad (por error) sale una sola vez; manda
  «Organización».
- La fecha de hoy para saber si una actividad cuenta es la del día en que se genera el documento.
- Dos profesores con el mismo nombre y sin DNI en una actividad antigua no se pueden distinguir:
  salen a los dos, y el aviso ámbar lo dice («Hay actividades antiguas apuntadas solo por el
  nombre»).

## Antes de empezar

- Basta con `docs/CONTEXTO.md`, `docs/ACTIVIDADES-EXTRAESCOLARES.md`,
  `docs/contexto/TABLAS-DE-DATOS.md`, `docs/CERTIFICADO-CONSEJO-ESCOLAR.md`,
  `docs/contexto/CAMPOS-Y-TIPOS.md` (campos propios de clase Fecha), `js/actividades.js`,
  `js/tablas-datos.js`, `js/tablas-datos-consejo.js`, `js/tablas-datos-pantalla.js`,
  `js/alumnado-bd-ver.js` (solo `comoTabla`), `js/plantillas.js` y `js/plantillas-centro.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas.
- Textos con las palabras de `docs/VOCABULARIO.md`. Añade: **Organización** / **Acompañante**
  (en el certificado y en la hoja de cálculo; en pantalla, «Organiza» / «Acompaña»).
- La demostración tiene que traer además un asunto de este tipo para un profesor que tenga, entre
  las actividades de la demostración, al menos una realizada como «Organiza», una antigua como
  «Acompaña», una prevista y una anulada.
- Rama `fila-311`, revisor en local y, con su APROBADA, a `main`. Cláusulas comunes en
  `docs/REPARTO-DE-LA-COLA-2026-09-27.md`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs actividades tablas
  plantillas consejo`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/actividades-tabla.js`: nuevo. `comoTabla`, `entre`, las celdas y la pasada del tipo y de la
  plantilla.
- `js/tablas-datos.js`: la llamada a `comoTabla`, `celdasDe` y el filtro de fechas. Tiene 319
  líneas: lo que se pueda, en el módulo nuevo.
- `js/tablas-datos-pantalla.js`: la línea de la lista y la tablita de la ficha.
- `js/plantillas.js`: el catálogo `HUECOS` (`{{TABLA ACTIVIDADES EXTRAESCOLARES}}`,
  `{{ACTIVIDADES PERIODO}}`).
- `js/actividades.js`: olvidar la caché de las tablas al guardar.
- `plantillas/certificado-actividades-extraescolares.md`, su `.docx`, `plantillas/indice.json`.
- `datos-biblioteca/biblioteca-centro.json`, `docs/contenido/BIBLIOTECA-PERSONAL.md`.
- `index.html`, `js/novedades.js`, `js/demo/datos-actividades.js`, `docs/VOCABULARIO.md`.
- `pruebas/actividades-certificado.mjs`: nueva. Casos: `comoTabla` deja fuera la prevista, la
  anulada y la de la papelera; unión por DNI y, sin DNI, por nombre; `entre` con las dos fechas,
  con una y con ninguna; la columna Horas solo si alguna fila las tiene; el Word generado lleva la
  tabla con «Organización» y «Acompañante» y la frase del periodo; persona sin actividades da
  `[falta: Actividades extraescolares]`; la pasada crea el tipo y sus dos campos una sola vez.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (en la línea de actividades, sustituyendo),
  `docs/contexto/TABLAS-DE-DATOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que hay un tipo de asunto «Certificado actividades extraescolares»; que se crea a
nombre del profesor, se le ponen si se quiere las dos fechas, y «Generar documento» saca el
certificado con una tabla de sus actividades, diciendo en cada una si organizó o acompañó; que
solo salen las realizadas; y que la ficha de cada profesor enseña también sus actividades. Si la
plantilla no ha podido llegar sola, la línea de qué botón pulsar.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir «Nuevo asunto», buscar a un profesor y elegir el tipo «CERTIFICADO ACTIVIDADES
   EXTRAESCOLARES»: el formulario enseña los campos «Actividades desde» y «Actividades hasta», los
   dos con selector de fecha.
2. Abrir el asunto de ese tipo que trae la demostración, sin fechas puestas, y generar el
   documento con la plantilla «Certificado de actividades extraescolares»: el Word lleva el
   membrete, el nombre y el DNI del profesor y una tabla con las columnas Fecha, Actividad, Lugar
   y Participación.
3. En esa tabla están la actividad realizada, con «Organización», y la antigua, con
   «Acompañante». No están ni la prevista ni la anulada.
4. Las filas van de la más antigua a la más reciente.
5. Poner en «Actividades desde» una fecha posterior a la actividad antigua y volver a generar: la
   antigua ya no sale, y el texto dice «desde el …» con esa fecha.
6. Poner además «Actividades hasta»: el texto dice «entre el … y el …».
7. Generar el mismo certificado para un profesor sin ninguna actividad: donde iría la tabla dice
   «[falta: Actividades extraescolares]» en amarillo, y el aviso ámbar lo nombra.
8. Apuntar horas en la actividad realizada y volver a generar: la tabla gana la columna «Horas».
9. «Personas y empresas» → abrir al profesor de la demostración: su ficha enseña una tablita
   «Actividades extraescolares» con sus actividades realizadas.
10. Herramientas → «Tablas de datos»: en la lista sale «ACTIVIDADES EXTRAESCOLARES» con su número
    de filas.
11. El certificado lleva al pie las firmas de Secretaría y el V.º B.º de Dirección, como el del
    Consejo Escolar. Sin errores en la consola en ningún punto.
