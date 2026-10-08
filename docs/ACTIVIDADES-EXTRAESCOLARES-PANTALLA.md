# Actividades extraescolares: la pantalla con todas, y las actividades antiguas (fila 310)

Cerrado con Francisco el 8-oct-2026. Tercera de cuatro filas; va después de la 306
(`docs/ACTIVIDADES-EXTRAESCOLARES.md`, que se lee antes: de ahí sale el registro de actividades,
`_GESTOR/actividades.json`).

## Qué quiere Francisco

1. **Una pantalla para ver todas las actividades juntas**, en Herramientas: una tabla con fecha,
   nombre, departamento, unidades, cuánto alumnado va y qué profesorado; con buscador, filtros por
   curso, por profesor y por unidad, y «Exportar». Para contestar de un vistazo preguntas como
   «¿qué salidas ha hecho 2.º B este curso?» o «¿en cuáles ha ido tal profesor?».
2. **Las actividades de cursos anteriores se pueden apuntar en corto**: fecha, nombre y
   profesorado que fue. Sin alumnado, sin asunto y sin aviso al claustro. El profesorado puede
   pedir certificado de los últimos cinco años.
3. Las actividades antiguas de verdad están en una base de datos de Access de su compañero. Se
   importarán más adelante, en otra fila, cuando Francisco tenga el fichero
   (`docs/PENDIENTES-DE-DISENAR.md`, punto 4). **Esta fila deja el registro preparado para
   recibirlas**: una actividad antigua es una actividad del registro con `asunto: null` y
   `antigua: true`. No se programa ninguna importación ahora.

## Qué hay que hacer

### 1. El bloque en Herramientas

En la lista de Herramientas, debajo de «Control del registro», un bloque **«Actividades
extraescolares»** con una línea de resumen («N este curso · M previstas») y el botón **«Abrir»**.
Abre una vista a todo el ancho, con **«← Volver a Herramientas»**, igual que el control del
registro (`js/control-registro-pantalla.js` es el modelo: una vista hermana de
`#herramientas-lista`, que `App.pintarHerramientas` cierra al entrar). Módulo nuevo
`js/actividades-pantalla.js` (`window.ActividadesPantalla`).

### 2. La tabla

Una fila por actividad del registro que no esté en la papelera. A todo el ancho, densa, sin
renglones estrechos.

- Columnas: **Fecha** · **Actividad** · **Departamento** · **Lugar** · **Unidades** · **Alumnado**
  · **Profesorado** · **Situación** · «⋯».
  - *Fecha*: `15-oct-2026`, o `15 a 17-oct-2026` si dura varios días.
  - *Unidades*: sus nombres compactos, separados por comas. Vacío en una antigua.
  - *Alumnado*: el número. Vacío en una antigua.
  - *Profesorado*: los nombres; quien organiza, con «(organiza)» detrás.
  - *Situación*: **Prevista**, **Realizada** o **Anulada** (`Actividades.situacion`). Una antigua
    dice «Realizada» y lleva una marca pequeña «antigua».
- Orden: por fecha, la más reciente arriba. Pulsar el título de Fecha lo invierte.
- **Pulsar una fila**: si tiene asunto, abre su ficha, esté abierto o archivado (como
  `abrirAsunto` del control del registro: primero entre los abiertos, por `ficha.actividad.id`; si
  no, en el índice del ARCHIVO por su número). Si es antigua, abre su cuadro (punto 4).
- Debajo de la tabla, una línea: «N actividades · M realizadas · K previstas · J anuladas».
- Lo que no se ve no se pinta de más: con 1.500 filas tiene que seguir siendo ágil.

### 3. El buscador y los filtros

En una sola fila, encima de la tabla.

- **Buscador**: por palabras sueltas, sin tildes, en el nombre, el lugar, el departamento, las
  unidades y el profesorado.
- **Curso**: los cursos académicos que tienen alguna actividad, más «Todos». De partida, el curso
  actual. El curso de una actividad sale de su fecha de inicio, con la misma regla que usa el
  resto de la aplicación para el curso de una fecha.
- **Profesor/a**: quienes figuran en alguna actividad de lo filtrado, por orden alfabético.
- **Unidad**: las unidades que salen en lo filtrado.
- **Situación**: Todas · Previstas · Realizadas · Anuladas.
- Con algún filtro puesto: «Filtrado por: … ✕ Quitar», como en Inicio.
- El filtrado es una función sin efectos: `ActividadesPantalla.filtrar(actividades, filtros,
  hoyIso)`. Se prueba sola.
- Lo elegido se recuerda en ese ordenador (`localStorage`), no en `_GESTOR`.

### 4. Apuntar una actividad antigua

Botón **«+ Apuntar una actividad antigua»**. Abre un cuadro corto, ancho:

- **Nombre de la actividad** (obligatorio), **Fecha de inicio** (obligatoria, tiene que ser
  anterior a hoy), **Fecha de fin**, **Lugar**, **Departamento que la organiza**, **Horas de
  dedicación**.
- **Profesorado**: el mismo control del formulario de la fila 306 (buscador de PERSONAL en modo de
  señalar varios, cada uno con «Organiza» / «Acompaña»). Además, **«+ Añadir a alguien que ya no
  está en el centro»**: se escribe su nombre («Apellidos, Nombre») y, si se sabe, su DNI. Va al
  registro con ese nombre y esa `clave`; no se da de alta como tercero.
- «Guardar» está apagado sin nombre, sin fecha o sin nadie de profesorado.
- Guarda en el registro con `asunto: null`, `antigua: true`. No crea asunto ni carpeta.
- **Si ya hay una actividad con el mismo nombre y la misma fecha de inicio**, pregunta antes:
  «Ya hay una actividad con ese nombre ese día. ¿Es otra distinta?».
- En su «⋯»: **«Cambiar»** (el mismo cuadro) y **«Borrar»**, que va a la papelera
  (`Papelera.mandarDato('actividad', …)`, con su vuelta, como los grupos propios). Las que tienen
  asunto no llevan estas dos: se cambian desde su ficha.

### 5. Nueva actividad, desde aquí

Botón principal **«+ Nueva actividad»**: abre el formulario de la fila 306 y, al pulsar «Seguir»,
lleva a «Nuevo asunto» con el tipo de actividades y todo puesto (`App.nuevoAsuntoCon`). Si hay más
de un tipo con la marca, pregunta cuál.

### 6. Exportar

Botón **«Exportar ▾»** con una sola opción, **«Hoja de cálculo»**: un `.xlsx` con lo que se ve en
la tabla (los filtros puestos mandan), escrito con JSZip como `js/exportar-hoja.js`. Dos pestañas:

- **«Actividades»**: una fila por actividad, con las columnas de la tabla y, además, Fecha de fin,
  Hora de salida, Hora de regreso, Horas de dedicación y Número del asunto. Fechas como fechas y
  números como números.
- **«Profesorado»**: una fila por profesor y actividad (Profesor/a · DNI · Participación · Fecha ·
  Actividad · Lugar · Horas), ordenada por profesor y fecha. «Participación» dice «Organización» o
  «Acompañante».

Nombre del fichero: `Actividades extraescolares <curso o «todas»>.xlsx`.

### 7. Quién la ve

- Administración. Un directivo no tiene Herramientas: nada cambia para él.
- En solo consulta: se ve todo y se exporta; «+ Nueva actividad», «+ Apuntar una actividad
  antigua», «Cambiar» y «Borrar», apagados.

## Qué NO se toca

- El formulario y la tarjeta de la fila 306, salvo sacar el control de profesorado a un sitio
  común si hace falta para reutilizarlo.
- La pantalla de Inicio y su «Exportar ▾».
- Ninguna importación: ni de Access ni de ningún fichero.

## Trampas

- La pantalla lee solo `actividades.json`. Nunca recorre el ARCHIVO ni abre fichas para pintar la
  tabla.
- Una persona de profesorado que ya no está en el centro no se encuentra en `Datos`: su nombre y
  su DNI son los del registro, tal cual.
- Al volver de la ficha de un asunto abierto desde aquí, «Volver» trae otra vez a esta pantalla,
  con los mismos filtros y la misma altura (mira cómo lo hace el control del registro).

## Antes de empezar

- Basta con `docs/CONTEXTO.md`, `docs/ACTIVIDADES-EXTRAESCOLARES.md`, `docs/CONTROL-DEL-REGISTRO.md`
  (solo cómo se monta su vista), `js/actividades.js`, `js/actividades-formulario.js`,
  `js/control-registro-pantalla.js`, `js/herramientas.js`, `js/exportar-hoja.js` y `js/papelera.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas: si la pantalla crece, el cuadro
  de la actividad antigua va en `js/actividades-antigua.js`.
- Textos con las palabras de `docs/VOCABULARIO.md`. Añade: **actividad antigua** («+ Apuntar una
  actividad antigua») y **«+ Nueva actividad»**.
- La demostración tiene que traer además dos actividades antiguas de cursos anteriores, una de
  ellas con un profesor que no está en el personal.
- Rama `fila-310`, revisor en local y, con su APROBADA, a `main`. Cláusulas comunes en
  `docs/REPARTO-DE-LA-COLA-2026-09-27.md`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs actividades
  herramientas exportar`); la pasada completa, una sola vez al final.

## Ficheros

- `js/actividades-pantalla.js`: nuevo. La vista, la tabla, `filtrar`, abrir el asunto.
- `js/actividades-antigua.js`: nuevo. El cuadro de la actividad antigua y su papelera.
- `js/actividades-exportar.js`: nuevo. El `.xlsx`.
- `js/actividades.js`: lo que falte para crear, cambiar y borrar una antigua.
- `js/actividades-formulario.js`: solo si hay que sacar el control de profesorado para usarlo en
  los dos sitios.
- `js/herramientas.js`: cerrar la vista al entrar y pintar el resumen del bloque.
- `js/papelera.js`: devolver una `actividad` (como `devolverGrupo`).
- `index.html` (el bloque y la vista), `css/actividades.css`, `js/novedades.js`,
  `js/demo/datos-actividades.js`, `docs/VOCABULARIO.md`.
- `pruebas/actividades-pantalla.mjs`: nueva. Casos: `filtrar` por curso, profesor, unidad,
  situación y palabras; la tabla con una prevista, una realizada, una anulada y dos antiguas; una
  en la papelera no sale; pulsar una fila abre su asunto y «Volver» trae de vuelta con los
  filtros; apuntar una antigua con un profesor de fuera; la pregunta de la repetida; cambiar y
  borrar una antigua, y recuperarla de la papelera; el `.xlsx` con sus dos pestañas y solo lo
  filtrado; solo consulta, botones apagados.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (en la línea de actividades, sustituyendo),
  `docs/contexto/ASUNTOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Herramientas hay un bloque «Actividades extraescolares» que abre una tabla
con todas; que se filtra por curso, profesor, unidad y situación y se exporta a una hoja de
cálculo; que desde ahí se crea una actividad nueva; y que «+ Apuntar una actividad antigua» guarda
las de otros cursos con su fecha, su nombre y su profesorado.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir Herramientas: hay un bloque «Actividades extraescolares» con un resumen y el botón
   «Abrir».
2. Pulsar «Abrir»: sale una tabla a todo el ancho con las columnas Fecha, Actividad, Departamento,
   Lugar, Unidades, Alumnado, Profesorado y Situación, y «← Volver a Herramientas».
3. Con el curso actual puesto se ven la actividad prevista, la realizada y la anulada, cada una
   con su situación. La línea de abajo las cuenta.
4. En la columna Profesorado, quien organiza lleva «(organiza)».
5. Elegir en «Profesor/a» a una persona: solo quedan sus actividades y sale «Filtrado por: … ✕
   Quitar». Pulsar «Quitar»: vuelven todas.
6. Elegir una unidad en «Unidad»: solo quedan las actividades de esa unidad.
7. Poner «Curso: Todos»: salen además las dos actividades antiguas, con la marca «antigua» y sin
   unidades ni alumnado.
8. Escribir en el buscador una palabra del lugar de una actividad: solo queda esa.
9. Pulsar la fila de la actividad prevista: se abre la ficha de su asunto. Pulsar «Volver»: se
   vuelve a esta tabla, con los filtros como estaban.
10. Pulsar «+ Apuntar una actividad antigua», poner nombre, una fecha del curso pasado y un
    profesor, y guardar: aparece en la tabla (con «Curso: Todos») como «Realizada · antigua».
11. En ese cuadro, «+ Añadir a alguien que ya no está en el centro» deja escribir un nombre y un
    DNI, y esa persona sale en la columna Profesorado.
12. En el «⋯» de una antigua, «Borrar»: desaparece de la tabla y está en la papelera
    (Herramientas → Papelera), de donde se puede recuperar.
13. Pulsar «+ Nueva actividad»: se abre el formulario de la actividad; al pulsar «Seguir» se llega
    a «Nuevo asunto» con el tipo de actividades ya puesto.
14. Con un filtro puesto, «Exportar ▾» → «Hoja de cálculo»: se descarga un `.xlsx` con las
    pestañas «Actividades» y «Profesorado», y solo con lo filtrado.
15. Con «En este ordenador, solo consultar» puesto: la tabla se ve y se exporta; los botones de
    crear, cambiar y borrar están apagados. Sin errores en la consola en ningún punto.
