# Lo que tengo ahora: de cuándo son el alumnado y el personal (fila 319)

Cerrado con Francisco el 9-oct-2026. Sale de la idea 319, apuntada por él desde el Centro de
mando. Sigue a `docs/BEBER-DEL-CENTRO-DE-DATOS.md` (fila 312), `docs/CENTRO-DE-DATOS-CONTRATO-2.md`
(fila 317) y `docs/ALUMNADO-BD-DESDE-DRIVE.md` (filas 142 y 144).

## Qué pidió

> Mientras terminamos el desarrollo del Centro de Datos, tengo que asegurarme que tengo la base
> de datos actual. Pero realmente ya no sé donde tengo que guardar el csv, ni con la información
> que ofrece (solo la fecha) tengo la certeza de que es el más actual

Adjuntó un recorte del bloque «Carpeta de la base de datos de alumnado» de Ajustes: el texto pide
señalar la carpeta «Datos de matrícula», pero dice «Carpeta señalada: 1. Descargas de Séneca», y
debajo «Última copia: 4827 alumnos y 81 datos, del 08-10-2026.».

## Qué pasa hoy

- El gestor usa dos ficheros de alumnado y varios de personal, todos en `_GESTOR/datos`:
  `RegAlum.csv` (de Séneca, la base), `ALUMNADO-BD.json` (lo hace la base de datos de alumnado) y
  los `RelPerCen…csv` (personal, uno o más por curso).
- Cada uno puede llegar por varias puertas: a mano (Herramientas → «Traer el alumnado» → «Traer
  ficheros de Séneca»), solo desde la carpeta del Centro de datos, solo desde la carpeta de la base
  de datos de alumnado, o recogido de un piso más arriba (`js/rescate-datos.js`).
- Ninguna pantalla dice por cuál llegó. La fecha que se ve es solo el día, sin hora. Y al copiar
  un fichero a `_GESTOR/datos` su fecha pasa a ser la de la copia: **la fecha en que se descargó
  de Séneca se pierde**.
- El texto del bloque de Ajustes nombra una carpeta («Datos de matrícula») que puede no ser la
  señalada.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. Saber dónde se deja el CSV. La respuesta es «en ningún sitio concreto»: se descarga de Séneca y
   se trae con el botón. La pantalla tiene que decirlo.
2. En Herramientas → «Traer el alumnado», un recuadro **«Lo que tengo ahora»**, con una línea por
   fichero. Cada línea dice: **fecha y hora del fichero, cuántas personas trae, por dónde llegó, y
   un aviso si en alguna carpeta hay otro más nuevo sin coger**.
3. El recuadro enseña el alumnado **y el personal**.
4. El bloque de Ajustes del recorte enseña la misma línea que el recuadro, con un enlace que lleva
   a él, y su texto deja de nombrar una carpeta concreta.

Decidido por Claude en el diseño:

- El recuadro es una **tabla a todo el ancho**, una fila por fichero, sin texto cortado con «…».
- Lo que no se sabe se dice: un fichero que ya estaba antes de este cambio sale con «No se sabe
  por dónde llegó», y si el gestor no puede mirar una carpeta lo dice en vez de callar.
- El gestor **no puede saber si en Séneca hay datos más nuevos**. Solo compara con las carpetas
  señaladas en este ordenador. El recuadro lo dice con una frase fija.
- No se añade ninguna puerta nueva ni se quita ninguna. No cambia qué fichero gana cuando hay dos.
- Las líneas grises «Datos del Centro de datos, del…» de esta pantalla desaparecen: lo dice ya la
  tabla. En «Tablas de datos» y en «Control del registro» se quedan.

## Qué hay que hacer

### 1. Apuntar por dónde llega cada fichero

Fichero nuevo `_GESTOR/datos-origen.json`, guardado por `ColaGuardado.poner` y `Copias.guardar`
(como `centro-de-datos.json`):

    { "_esquema": 1, "ficheros": { "RegAlum.csv": {
        "via": "a-mano", "fechaOriginal": "2026-10-09T08:52:10+02:00", "nombreOriginal": "RegAlum (3).csv",
        "traidoEl": "2026-10-09T09:01:44+02:00", "traidoPor": "Francisco",
        "marca": 1760000000000, "subidoPor": "" } } }

- `via`: `'a-mano'`, `'centro-de-datos'`, `'carpeta-bd'` o `'recogido'`.
- `fechaOriginal`: la fecha del fichero **antes** de copiarlo.
  - A mano y recogido: el `lastModified` del fichero elegido (es cuándo se descargó de Séneca).
  - Centro de datos: el `subido` de su entrada del índice. Se guarda también `subidoPor`.
  - `ALUMNADO-BD.json`, venga de donde venga: su `generado`.
- `marca`: lo que permite saber después si el apunte sigue valiendo. Para los CSV, el
  `lastModified` de la copia recién escrita en `_GESTOR/datos`. Para `ALUMNADO-BD.json`, su
  `generado`. Si al mirar el fichero su marca no coincide con la apuntada (para los CSV, con dos
  segundos de margen), **el apunte no vale**: alguien lo cambió por otro camino.
- Si llegan dos apuntes del mismo fichero (los dos ordenadores, conflicto de Dropbox), gana el de
  `traidoEl` más reciente.
- Con `SoloConsulta.activo()` no se apunta nada.
- Un fallo al apuntar nunca impide traer el fichero: es accesorio (`U.accesorio`).

Dónde se apunta (cambios quirúrgicos, una o dos líneas en cada sitio):

- `js/traer-datos.js`, `copiarUno(h, clase, nombreDestino, origen)`: parámetro nuevo y opcional.
  Sin él, `via: 'a-mano'` y `fechaOriginal` del `lastModified` del fichero elegido. Es el punto
  único por el que pasan el alumnado y el personal.
- `js/centro-de-datos-reparto.js`, en `entregar`: las dos llamadas a `copiarUno` pasan
  `{ via: 'centro-de-datos', fechaOriginal: e.subido, subidoPor: e.subidoPor }`.
- `js/alumnado-bd.js`: tras `guardar(nuevo)` en `traer` (`via: 'carpeta-bd'`) y en `aceptar`
  (`via: 'centro-de-datos'`; `aceptar` recibe el origen como segundo parámetro opcional, y
  `entregar` se lo pasa).
- `js/rescate-datos.js`, tras cada `Carpetas.moverFichero` que sale bien: `via: 'recogido'`, con
  la fecha de fuera que ya tiene calculada (`deFuera`). Solo para los de Séneca (`regalum`,
  `relpercen`).

### 2. Un módulo que sabe qué hay y si hay algo más nuevo

Fichero nuevo `js/datos-que-tengo.js` (`window.DatosQueTengo`). No envuelve nada. Mira antes que el
nombre esté libre.

- `DatosQueTengo.apuntar(nombre, origen)`: lo del punto 1.
- `DatosQueTengo.estado()`: devuelve una lista, una entrada por fichero, en este orden:
  1. **Alumnado de Séneca** (`RegAlum.csv`).
  2. **Alumnado de la base de datos** (`ALUMNADO-BD.json`).
  3. **Personal**: una entrada por cada `RelPerCen…csv` de `_GESTOR/datos`, con su curso
     (`Datos.cursoDelFichero`). Primero los del curso actual; los de cursos anteriores van marcados
     `anterior: true`.
  Cada entrada trae: `titulo`, `nombre` del fichero, `hay` (si existe), `fecha` (la
  `fechaOriginal` del apunte si vale; si no, el `lastModified` del fichero, o el `generado`),
  `fechaEsDeLaCopia` (verdadero cuando no hay apunte que valga), `cuantos`, `via`, `traidoEl`,
  `traidoPor`, `subidoPor`.
  - `cuantos`: las personas que el gestor lee de ese fichero. Usa lo que `Datos` ya tiene en
    memoria; no leas el CSV otra vez solo para contar. Para el alumnado de Séneca, si la lista
    distingue matriculados, las dos cifras («4.827 alumnos, 812 matriculados»). Para
    `ALUMNADO-BD.json`, alumnos y datos, como hoy.
- `DatosQueTengo.mirarSiHayMasNuevo()`: para cada entrada, uno de estos resultados. **Nunca pide
  permiso**: solo mira (`queryPermission`).
  - `'al-dia'`: se ha podido mirar y no hay otro más nuevo. Lleva `mirado`: la lista de carpetas
    miradas («Centro de datos», «carpeta de la base de datos de alumnado»).
  - `'mas-nuevo'`: hay uno más nuevo sin coger. Lleva `donde`, `fecha` y, si no se puede traer,
    `motivo`.
  - `'sin-permiso'`: hay carpeta recordada pero el navegador pide otra vez el permiso. Lleva `id`
    (el mismo de `js/permisos-carpetas.js`, fila 318: `alumnado` o `centro-de-datos`).
  - `'sin-carpeta'`: en este ordenador no hay ninguna carpeta señalada de la que pueda llegar solo.
  - `'no-se-puede'`: con su frase (el Centro de datos está recolocando; su índice no se puede
    leer; es más nuevo que esta aplicación; hay más de un listado de alumnado).
  De dónde sale:
  - Centro de datos: `CentroDeDatos.carpeta`, `permiso(dir, false)`, `leerIndice`, `elegir` (sus
    `avisos`) y `pendientes(indice, apuntes, true)`. **`pendientes` hoy no se exporta: expórtala.**
    Solo cuentan las claves `alumnado`, `personal` y `alumnado-bd`.
  - Carpeta de la base de datos: función nueva `AlumnadoBD.mirarCarpeta()` en `js/alumnado-bd.js`,
    que lee el `ALUMNADO-BD.json` de la carpeta señalada (sin pedir permiso) y devuelve
    `{ hay, valido, motivo, generado, cuantos }`. Si es más nuevo que la copia y vale,
    `'mas-nuevo'`; si es más nuevo y no vale, `'mas-nuevo'` con `motivo`.
  - El resultado se guarda en memoria 60 segundos (las pantallas se repintan a menudo). Se tira al
    traer algo y al pulsar «Volver a mirar».

### 3. El recuadro «Lo que tengo ahora»

Fichero nuevo `js/datos-que-tengo-ver.js`. Se pinta en un hueco nuevo de `index.html`,
`<div id="herramientas-lo-que-tengo"></div>`, **el primero** dentro del cuerpo de
`#bloque-traer-alumnado`, por encima de `#herramientas-traer-seneca`.

Solo se calcula cuando el bloque está abierto y a la vista (`offsetParent`), y con contador de
turno (el último repintado gana). Se repinta al abrir el bloque, después de traer algo por
cualquier puerta y al pulsar «Volver a mirar».

Título «Lo que tengo ahora» y, a su derecha, un botón pequeño «Volver a mirar». Debajo, una tabla a
todo el ancho con estas columnas:

| Qué | Fecha del fichero | Cuántos | Por dónde llegó | ¿Hay otro más nuevo? |
|---|---|---|---|---|

- **Qué**: el título y, debajo y en gris, el nombre del fichero. El personal: «Personal 26-27».
- **Fecha del fichero**: día y hora, «9-oct-2026 · 08:52». Si `fechaEsDeLaCopia`: «En el gestor
  desde el 8-oct-2026 · 21:45», porque no se sabe la del fichero original.
- **Cuántos**: «4.827 alumnos, 812 matriculados», «4.827 alumnos y 81 datos», «84 personas».
- **Por dónde llegó**:
  - a mano: «A mano. Lo trajo Francisco el 9-oct-2026 · 09:01.»
  - Centro de datos: «Del Centro de datos. Lo subió fmargon780.» (sin lo de después de la `@`).
  - carpeta de la base de datos: «De la carpeta de la base de datos de alumnado.»
  - recogido: «Recogido de la carpeta de asuntos, donde estaba suelto.»
  - sin apunte que valga: «No se sabe por dónde llegó.»
- **¿Hay otro más nuevo?**:
  - `'al-dia'`, en verde: «No. Mirado en: Centro de datos.» (con las carpetas miradas).
  - `'mas-nuevo'`, en ámbar: «Sí: en el Centro de datos hay uno del 9-oct-2026 · 10:15.» y un
    botón **«Traerlo»**. Con `motivo`, sin botón: «Sí, pero no vale: …».
  - `'sin-permiso'`, en ámbar: «No lo puedo mirar: el navegador pide otra vez el permiso de la
    carpeta.» y un botón **«Dar permiso»**.
  - `'sin-carpeta'`, en gris: «No hay ninguna carpeta señalada en este ordenador. Se actualiza a
    mano, o lo trae el otro ordenador.»
  - `'no-se-puede'`, en gris o ámbar según el caso, con su frase.
- Un fichero que no existe: una fila con «Todavía no hay ninguno.» en la columna de la fecha y las
  demás vacías. El alumnado de Séneca que falta va en rojo, como el aviso de hoy.
- Los ficheros de personal de cursos anteriores van plegados en una sola fila «y N ficheros de
  cursos anteriores», que se despliega al pulsarla.

Botones:

- «Traerlo» del Centro de datos: `CentroDeDatos.traer({ avisar: true, pedir: true })`. Trae todo
  lo pendiente de esa carpeta, no solo esa fila: es lo que ya hace.
- «Traerlo» de la carpeta de la base de datos: `AlumnadoBD.traer(true, true)`.
- «Dar permiso»: `PermisosCarpetas.pedir(id)` si existe (fila 318); si no, el `permiso(dir, true)`
  del módulo. La petición sale dentro de la propia pulsación, sin esperas antes. Con el permiso
  dado, trae lo de esa carpeta y repinta.
- Los tres, por `U.mientrasGuarda`. Con `SoloConsulta.activo()` salen apagados.

Debajo de la tabla, dos frases fijas, en gris:

- «Para actualizar el alumnado o el personal: descarga el fichero de Séneca y pulsa «Traer
  ficheros de Séneca». No hay que guardarlo en ninguna carpeta concreta. El alumnado de la base de
  datos lo hace la base de datos de alumnado, al pulsar allí «Actualizar los datos».»
- «Solo puedo comparar con las carpetas señaladas en este ordenador. Si has cambiado algo en
  Séneca después de la fecha de la tabla, hay que volver a descargarlo.»

El pie del título del bloque (`.bloque-pie` de `#bloque-traer-alumnado`), que hoy es un texto fijo,
pasa a decir lo esencial sin abrirlo: «Alumnado del 9-oct-2026 · personal del 15-sep-2026», y
«· hay algo más nuevo» en ámbar si alguna fila es `'mas-nuevo'`. Para esto no se mira ninguna
carpeta de fuera si el bloque está cerrado: solo las fechas, y lo de «más nuevo» solo si ya está
en memoria.

### 4. Lo que se quita o cambia en esa misma pantalla

- `js/centro-de-datos-ver.js`: se quita la llamada que pinta las líneas grises de la marca
  `'seneca'` (`['alumnado', 'personal', 'alumnado-bd']`). Las de `'tablas'` y `'registro'` se
  quedan. El botón «Traer ahora del Centro de datos» se queda.
- `js/alumnado-bd.js`: en Herramientas se quita el párrafo `#alumnado-bd-copia` («Última copia:
  …»); el botón «Traer el alumnado ahora» se queda.
- `js/traer-datos.js`: la nota junto al botón pasa a «Elige el fichero donde lo tengas descargado.
  La aplicación lo coloca sola.»

### 5. El bloque de Ajustes del recorte

En `js/alumnado-bd.js`, bloque `#bloque-alumnado-bd`:

- El primer párrafo pasa a: «Señala la carpeta de Google Drive para ordenador que tiene
  `ALUMNADO-BD.json`: la deja ahí la base de datos de alumnado. Es de este ordenador, como las del
  Dropbox: el otro usa la copia.» Ya no nombra «Datos de matrícula».
- Si hay carpeta señalada, con permiso, el bloque está a la vista y en ella **no está**
  `ALUMNADO-BD.json`: aviso en ámbar «En esta carpeta no está ALUMNADO-BD.json. Señala la que lo
  tiene.» Sin permiso no se mira ni se pide.
- «Última copia: …» pasa a ser la misma información de la fila de la tabla, en una línea:
  «Lo que tengo ahora: 4.827 alumnos y 81 datos, del 8-oct-2026 · 21:39. Llegó del Centro de
  datos.» Sin copia, la frase de hoy.
- Debajo, un enlace «Ver todo lo que tengo», que salta a Herramientas con `#bloque-traer-alumnado`
  abierto (el salto común que ya usa `alumnado-enlace-traer` en `js/ajustes-reparto.js`).

En `js/centro-de-datos-ver.js`, bloque `#bloque-centro-de-datos`: solo el mismo enlace «Ver todo lo
que tengo», al final.

### 6. La copia de demostración

- Si el Centro de datos de mentira (`js/demo/datos-centro-de-datos.js`) no lleva un
  `ALUMNADO-BD.json`, añádele uno inventado y válido (acuerdo 2), para que la fila se vea.
- Parámetro `masnuevo=` en la dirección, con claves separadas por comas:
  `?demo=1&auto=1&masnuevo=alumnado,personal`. La carpeta del Centro de datos de mentira queda
  señalada sola, con permiso, y con listados más nuevos de esas claves **sin coger**: al abrir
  Herramientas → «Traer el alumnado», esas filas salen en ámbar con «Traerlo». Cómo se consigue
  (por ejemplo, señalándola unos segundos después de la comprobación de entrada) lo decide la
  sesión, pero todo vive en `js/demo/`: el código de producción no lleva ninguna excepción.
- Sin el parámetro, la demostración queda como hoy, salvo el recuadro nuevo.

## Lo que no cambia

- Las puertas por las que llega cada fichero, y cuál gana cuando hay dos.
- Dónde se señala cada carpeta y sus botones.
- El aviso de fichero viejo (`js/frescura.js`) y sus épocas.
- La comprobación al entrar y sus filas.
- Las líneas grises del Centro de datos en «Tablas de datos» y en «Control del registro».
- Lo que hace el otro ordenador, el que no tiene carpetas: ve la misma tabla, porque el apunte
  vive en `_GESTOR`; en la última columna le saldrá «No hay ninguna carpeta señalada…».

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-319`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/PERSONAS.md` (apartados «Los ficheros de datos, sin trabajo manual» y «El alumnado
  de la base de datos»), `docs/BEBER-DEL-CENTRO-DE-DATOS.md` y los ficheros de abajo.
- Ningún fichero pasa de 600 líneas.
- Ninguna lectura de fondo con un guardado en marcha (`ColaGuardado.hayGuardado()`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- datos-que-tengo alumnado centro-de-datos traer`). La pasada completa, una sola
  vez, al final.

## Ficheros

- `js/datos-que-tengo.js`: nuevo (puntos 1 y 2).
- `js/datos-que-tengo-ver.js`: nuevo (punto 3).
- `index.html`: el hueco `#herramientas-lo-que-tengo` y la carga de los dos módulos, después de
  `js/alumnado-bd.js`, `js/centro-de-datos.js` y `js/traer-datos.js`. Si la copia sin internet
  lleva su propia lista de ficheros, también ahí.
- `js/traer-datos.js`: `copiarUno` con el origen, y la nota del botón.
- `js/centro-de-datos-reparto.js`: el origen en las entregas de alumnado, personal y alumnado-bd.
- `js/centro-de-datos.js`: exportar `pendientes`.
- `js/centro-de-datos-ver.js`: quitar las líneas grises de `'seneca'`; el enlace del bloque.
- `js/alumnado-bd.js`: apuntar en `traer` y `aceptar`, `mirarCarpeta`, el texto del bloque, la
  línea nueva, el aviso ámbar, el enlace, y quitar `#alumnado-bd-copia` de Herramientas.
- `js/rescate-datos.js`: apuntar lo recogido.
- `css/`: los estilos de la tabla, en el fichero de Herramientas o de Ajustes que toque.
- `js/demo/`: el `ALUMNADO-BD.json` inventado y el parámetro `masnuevo=`.
- `pruebas/datos-que-tengo.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. Al entrar en la demostración, la tabla tiene la fila del alumnado de Séneca y al menos una de
     personal, con día y hora, y «No se sabe por dónde llegó.»
  2. Traer un `RegAlum.csv` a mano (con el selector de ficheros sustituido en la prueba, y un
     fichero con `lastModified` de hace tres días): la fila dice esa fecha y hora, «A mano. Lo
     trajo …», y `_GESTOR/datos-origen.json` lleva el apunte.
  3. Señalar la carpeta del Centro de datos: las filas de alumnado y personal pasan a «Del Centro
     de datos. Lo subió …», con la fecha `subido` de su entrada, y la última columna en verde.
  4. Con `masnuevo=alumnado,personal`: esas dos filas en ámbar con «Traerlo»; al pulsarlo quedan
     en verde y la fecha cambia.
  5. Cambiar el `RegAlum.csv` de `_GESTOR/datos` por fuera (escribirlo directamente): la fila
     vuelve a «No se sabe por dónde llegó.» y «En el gestor desde …».
  6. El `ALUMNADO-BD.json`: traído de su carpeta dice «De la carpeta de la base de datos de
     alumnado.»; aceptado del Centro de datos, «Del Centro de datos.».
  7. Una carpeta de la base de datos con un archivo más nuevo que no vale (`acuerdo: 99`): «Sí,
     pero no vale: …», sin botón.
  8. Con «solo consultar»: la tabla se ve y no se apunta nada ni hay botón encendido.
  9. En Ajustes, el bloque de la carpeta de la base de datos no nombra «Datos de matrícula»,
     enseña la línea nueva y su enlace abre el bloque de Herramientas.
  10. Señalar una carpeta sin `ALUMNADO-BD.json`: sale el aviso ámbar del punto 5.
  11. Con dos ordenadores (dos apuntes del mismo fichero): gana el de `traidoEl` más reciente.
- `pruebas/alumnado-desde-la-bd.mjs` y las del Centro de datos: hoy miran `#alumnado-bd-copia` y
  las líneas grises de Herramientas. Se ponen al día con lo nuevo y siguen en verde.
- `js/novedades.js`: «En Herramientas → «Traer el alumnado» hay un recuadro nuevo, «Lo que tengo
  ahora»: dice de cuándo es cada fichero de alumnado y de personal, con su hora, cuántas personas
  trae, por dónde llegó y si hay otro más nuevo sin coger.»
- Al terminar: `docs/contexto/PERSONAS.md` (el apunte de origen y la tabla),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (los dos módulos y la prueba), `docs/CONTEXTO.md`
  (`datos-origen.json` en la tabla de ficheros de `_GESTOR`), `docs/COPIA-DE-PRUEBAS.md` (el
  parámetro `masnuevo=`) y `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 5, dentro de la
  línea «**Centro de datos (fila 312…)**», se añade al final: «Herramientas → «Traer el alumnado»
  enseña «Lo que tengo ahora» (fila 319, `js/datos-que-tengo*.js`): fecha y hora de cada fichero
  de alumnado y personal, cuántos, por dónde llegó (`_GESTOR/datos-origen.json`) y si hay otro más
  nuevo.» En la sección 6, una línea: «Quien copie un fichero de datos a `_GESTOR/datos` lo apunta
  con `DatosQueTengo.apuntar` (fila 319).»
- `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`: el punto 12 de abajo.

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que en Herramientas → «Traer el alumnado» está el recuadro «Lo que tengo ahora»;
que los ficheros que ya estaban dicen «No se sabe por dónde llegó» hasta la próxima vez que se
traigan; y que el CSV no hay que guardarlo en ninguna carpeta, solo traerlo con el botón.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir `?demo=1&auto=1`. Ir a Herramientas y abrir «Traer el alumnado». Lo primero que se ve es
   un recuadro titulado «Lo que tengo ahora», con una tabla de cinco columnas: «Qué», «Fecha del
   fichero», «Cuántos», «Por dónde llegó» y «¿Hay otro más nuevo?».
2. La tabla tiene una fila «Alumnado de Séneca» y al menos una fila de personal. Cada una enseña
   un día **y una hora**, y un número de personas.
3. En esas filas, «Por dónde llegó» dice «No se sabe por dónde llegó.» y la última columna dice
   que no hay ninguna carpeta señalada en este ordenador.
4. Debajo de la tabla se lee que para actualizar hay que descargar el fichero de Séneca y pulsar
   «Traer ficheros de Séneca», y que no hay que guardarlo en ninguna carpeta concreta.
5. Debajo se lee también que solo se compara con las carpetas señaladas en este ordenador.
6. Ningún texto de la tabla está cortado con «…», con la ventana a 1280 de ancho y a 1000.
7. Ir a Ajustes → Este ordenador → «Carpeta del Centro de datos» y pulsar «Señalar la carpeta».
   Volver a Herramientas → «Traer el alumnado»: las filas de alumnado y de personal dicen ahora
   «Del Centro de datos. Lo subió …», y la última columna, en verde, dice que no hay otro más
   nuevo y que se ha mirado en el Centro de datos.
8. En esa misma pantalla ya no hay ninguna línea gris suelta que empiece por «Alumnado: Datos del
   Centro de datos, del…» ni ningún párrafo «Última copia: …».
9. Abrir `?demo=1&auto=1&masnuevo=alumnado,personal`, ir a Herramientas → «Traer el alumnado»: las
   filas de alumnado y de personal están en ámbar, dicen que en el Centro de datos hay uno más
   nuevo, con su día y su hora, y llevan un botón «Traerlo».
10. Pulsar «Traerlo» en la del alumnado: sale un aviso verde, la fila pasa a verde y su fecha es
    la que anunciaba el aviso ámbar.
11. Con el bloque «Traer el alumnado» cerrado, a la derecha de su título se lee de cuándo es el
    alumnado y de cuándo el personal.
12. [SOLO FRANCISCO] En el ordenador del centro, con la copia sin internet ya actualizada:
    descargar el alumnado de Séneca, traerlo con «Traer ficheros de Séneca» y mirar que la fila
    «Alumnado de Séneca» dice el día y la hora de esa descarga y «A mano. Lo trajo Francisco…».
13. Ir a Ajustes → Este ordenador → «Carpeta de la base de datos de alumnado»: el texto no nombra
    ninguna carpeta «Datos de matrícula»; hay un enlace «Ver todo lo que tengo» y, al pulsarlo, se
    llega a Herramientas con «Traer el alumnado» abierto.
14. Abrir `?demo=1&auto=1` con «En este ordenador, solo consultar» marcado: la tabla se ve y
    ningún botón «Traerlo» ni «Dar permiso» se puede pulsar.
