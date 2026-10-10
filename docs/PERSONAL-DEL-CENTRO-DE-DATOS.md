# El personal, ya preparado por el Centro de datos

Fila 327 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026. Lee antes `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md` (lo del personal
y «Lo que tengo ahora») y `docs/ACUERDO-PERSONAL.md`, que es la copia de lo que el Centro de datos
promete (`hechos` en el índice, la forma de una parte y el conjunto `personal`). **No tienes acceso
al repositorio del Centro de datos ni te hace falta:** todo lo que necesitas de él está en esa copia.

## Qué quiere Francisco

Hoy el Gestor abre él mismo cada listado de personal de Séneca (`RelPerCen…csv`) y saca de ahí a las
personas. El Centro de datos ya hace ese trabajo desde su versión CD v20: deja el personal
**preparado**, una ficha por persona y curso, en `hecho/personal/<curso>/curso.json`, para todos los
cursos que tiene guardados. Y apunta lo que no cuadra como avisos, que su página solo cuenta.

Francisco quiere que el Gestor lea ese personal ya preparado, y que sea el Gestor quien enseñe esos
avisos uno a uno.

**Decidido por Francisco:**

1. Los avisos del personal salen **solo en Ajustes → Problemas**. No en el cuadro de avisos de
   Inicio con un trozo propio (el trozo general «N problemas por resolver» los cuenta, como a
   cualquier tarjeta).
2. **La subida a mano de los listados de personal se queda**, como salida de emergencia. Si hay
   personal del Centro de datos, manda él.
3. **Quien viene sin DNI sigue saliendo en el Gestor**, con el nombre y el puesto que trae el aviso.
   Se puede buscar y se le puede abrir un asunto, como hoy. Francisco sabe que de esa persona se
   verán menos datos que ahora (ni teléfono ni correo) hasta que el listado traiga su DNI.

**Decidido al escribir la instrucción** (Francisco lo sabe en una línea):

4. La emergencia tiene que servir: **curso por curso, si hay un listado subido a mano más nuevo que
   lo preparado por el Centro de datos, vale el subido a mano**. Cuando el Centro de datos prepare
   algo más nuevo, vuelve a mandar él.
5. En Problemas salen solo los avisos **del curso más reciente**. Los de cursos antiguos no se
   pueden corregir en Séneca y serían tarjetas para siempre.
6. Una tarjeta **por clase de aviso** (tres como mucho), con una línea por persona. Es como están
   hechas las demás tarjetas de Problemas.
7. Quien sale en el listado de docentes y en el de no docentes aparece con normalidad.
8. Un ordenador sin la carpeta del Centro de datos señalada usa la copia que haya en
   `_GESTOR/datos`, traída por el otro ordenador. Es lo que ya pasa con los demás datos.
9. Las personas dadas de alta a mano (`personal.csv`) no cambian.

## Qué hay que hacer

Cambios quirúrgicos. Ficheros de código que se tocan:

- `js/centro-de-datos.js` (elegir, y la llamada a tomar las partes dentro de `traer`).
- `js/centro-de-datos-personal.js`, **nuevo**: tomar las partes.
- `js/datos-personal.js` (`cargarPersonal`) y `js/datos-personal-hecho.js`, **nuevo**: convertir una
  parte en las mismas filas que hoy salen de un `RelPerCen`.
- `js/problemas-personal.js`, **nuevo**; `js/problemas-textos.js` (tres textos) y `js/problemas.js`
  (solo la lista `ORDEN`).
- `js/datos-que-tengo.js` y `js/datos-que-tengo-ver.js` (las filas del personal).
- `js/centro-de-datos-ver.js`, solo si hace falta para la línea gris del personal (apartado 6).
- `index.html` (los tres módulos nuevos, cada uno detrás del que usa) y la lista de ficheros de la
  copia sin internet, si los módulos se apuntan en ella.
- `js/novedades.js`, `js/version.js` y lo que haga falta dentro de `js/demo/`.

Nada más. `js/centro-de-datos-reparto.js` y `js/traer-datos.js` **no se tocan**: la subida a mano
sigue igual.

### 1. Tomar las partes del personal

Módulo nuevo `js/centro-de-datos-personal.js` (mira antes que el nombre esté libre; por ejemplo
`CentroDeDatosPersonal`). `CentroDeDatos.traer` lo llama **después** del bucle de los listados y
antes de `R.terminar`, con las mismas condiciones de siempre (carpeta, permiso, contrato, no
`ocupado`, no solo consulta). No hay otro camino para tomarlas.

- **Qué partes.** Las entradas de `indice.hechos` con `conjunto: "personal"` y `parte: "curso"`.
  Un índice sin `hechos` no hace nada y no da error.
- **Cuándo se toma una.** Si su `huella` es distinta de la apuntada para ese curso y su `hecho` no
  es anterior al apuntado. El apunte va en `_GESTOR/centro-de-datos.json`, en `tomado`, con la llave
  `hecho-personal|<curso>` y la forma de siempre (`subido` lleva el `hecho` de la entrada, para que
  valga la regla «nunca un apunte más viejo» de `apuntar`).
- **`acuerdoHecho` mayor que 1:** no se toma ninguna parte del personal y sale, una vez por sesión,
  un aviso ámbar: «El personal del Centro de datos es más nuevo que esta aplicación.». Lo que ya
  estaba copiado se sigue usando.
- **La huella se comprueba.** Se leen los bytes del fichero de `ruta`, se calcula su SHA-256 en
  hexadecimal y se compara con la `huella` de la entrada. Si no coinciden, esa parte no se copia ni
  se apunta, y se intenta en la siguiente entrada (es lo que manda el acuerdo). Solo se avisa, en
  ámbar y por `U.accesorio`, si `op.avisar`.
- **`alDia: false`:** se toma igual. El acuerdo deja seguir usando la parte que hay.
- **Dónde se guarda.** Byte a byte en `_GESTOR/datos`, con el nombre `PERSONAL-HECHO <curso>.json`
  (`PERSONAL-HECHO 26-27.json`). Y se apunta con `DatosQueTengo.apuntar` (regla de la sección 6 de
  `docs/CONTEXTO-CORTO.md`): `via: 'centro-de-datos'`, `subidoPor: 'centro-de-datos-ies'` y
  `fechaOriginal` el `hecho` de la entrada.
- Tras tomar alguna, `ctx.repasar = true` (o lo equivalente) para que el personal se vuelva a
  cargar una sola vez al final. En `salida.tomados` entra `personal` y el aviso verde de siempre
  dice «Personal (<fecha>)», una sola vez aunque sean varios cursos.
- Una parte que falla (no está, no se puede leer) va a `salida.fallos` y no impide las demás.

### 2. Dejar de traer los listados en bruto que ya vienen preparados

En `elegir` de `js/centro-de-datos.js`: una entrada `personal` de `listados` **no se elige** si el
índice trae una parte del personal de su mismo `cursoEscolar` (con `acuerdoHecho` 1 o menos). Las
de un curso sin parte, o sin `cursoEscolar`, se eligen como hoy. Con un índice sin `hechos`, `elegir`
devuelve exactamente lo de hoy.

Los `RelPerCen…csv` que ya están en `_GESTOR/datos` **no se borran**.

### 3. Leer el personal de las partes

Módulo nuevo `js/datos-personal-hecho.js`, con dos cosas y sin leer nada del disco por su cuenta:

- `filasDe(parte)`: convierte una parte en la lista de filas que hoy salen de un `RelPerCen`, una
  por registro: `{ nombre, documento, puesto, cese, campos, tipoPersonal, puestos }`.
  - `nombre`: `datos.empleado`. `documento`: `datos.documento`.
  - `campos`: se rehace de `datos.celdas` (`columna` → `valor`). Así queda **igual que hoy**: los
    títulos de columna de Séneca con sus valores tal cual.
  - `puesto` y `cese`: los de `campos` («Puesto», «Fecha de cese»), con el valor **en bruto**, no
    la fecha ya convertida, para que `U.yaPaso` siga funcionando como hoy. Si no hay `celdas`,
    `datos.puesto` y `datos.fechaCese`.
  - `tipoPersonal` y `puestos`: se guardan en la persona tal como vienen. No se enseñan en ningún
    sitio nuevo.
  - Más las filas de quien viene sin DNI (apartado 4).
- `vale(parte)`: `true` si es un objeto con `conjunto: "personal"`, `acuerdoHecho` 1 o menos y
  `registros` en lista. Una parte que no vale se ignora, como si no estuviera.

En `cargarPersonal` de `js/datos-personal.js`:

1. Además de los `RelPerCen…csv`, mira los `PERSONAL-HECHO <curso>.json` de la carpeta de datos.
2. **Curso por curso** decide de dónde lee:
   - Sin parte válida de ese curso: de sus `RelPerCen`, como hoy.
   - Con parte válida: de la parte, y los `RelPerCen` de ese curso **no se leen**.
   - Excepción (decisión 4): si algún `RelPerCen` de ese curso tiene un apunte que sigue valiendo
     con `via: 'a-mano'` y su fecha real (`DatosQueTengo.fechaReal`, fila 324) es **posterior** al
     `generado` de la parte, ese curso se lee de sus `RelPerCen`, como hoy, y la parte se ignora.
     Un `RelPerCen` sin apunte nunca gana. Si `fechaReal` todavía no existe (fila 324 sin
     terminar), escríbela aquí como dice el apartado 1 de `docs/FECHA-REAL-DEL-LISTADO.md`.
3. Las filas de una parte entran **por el mismo bucle** que las de un CSV: misma `clavePersona`,
   misma lista `cursos`, mismo «los datos buenos son los del curso más reciente», mismo
   `esteCurso` y `enElCentro`. No se escribe una segunda manera de unir.
4. `ficheros` (el resumen) lleva una entrada por cada fuente leída. La de una parte:
   `{ fichero: 'PERSONAL-HECHO 26-27.json', curso, filas, hecho: true, generado }`.
5. Nuevo en lo que devuelve: `avisos`, la lista de los avisos de la parte **del curso más alto**
   (vacía si ese curso no se leyó de una parte), cada uno con su `curso`.
6. `cargarPersonal` **no puede llamar a `DatosQueTengo.estado()`**, que a su vez carga el personal:
   solo `fechaReal`. Si `DatosQueTengo` no existe, ningún `RelPerCen` gana.

Busca dónde se mira hoy la **cabecera** del CSV del personal (regla «ojo con `p.campos`: solo trae
columnas con datos»). Si algún sitio la necesita, se le da `columnasPersonal` de la parte.

### 4. Quien viene sin DNI

Por cada aviso `personal-sin-id` de una parte que se lee, `filasDe` añade una fila con
`nombre: datos.empleado`, `documento: ''`, `puesto: datos.puesto`, `campos` con «Empleado/a» y
«Puesto» (los que vengan) y `sinDocumento: true`. Sin `empleado`, no hay fila.

Entra por el mismo bucle, así que su clave es el nombre, **como hoy** con una fila sin documento.
No se intenta casarla con otra persona del mismo nombre.

### 5. Los avisos, en Ajustes → Problemas

Módulo nuevo `js/problemas-personal.js`: un `Problemas.calculador` que carga el personal, coge
`avisos` (apartado 3, punto 5) y registra hasta tres tarjetas. Sin avisos de una clase, su tarjeta
se quita. Los textos, en `js/problemas-textos.js`; los tres ids nuevos, en `ORDEN` de
`js/problemas.js`, detrás de `alumnado`.

| Id | Aviso | Título | Qué pasa | Por qué | Cada línea |
|---|---|---|---|---|---|
| `personal-sin-dni` | `personal-sin-id` | «1 persona del personal viene sin DNI» / «N personas del personal vienen sin DNI» | «Sale en la aplicación solo con su nombre y su puesto.» | «En el listado de personal de Séneca no trae DNI ni pasaporte.» | El nombre; debajo, puesto · listado |
| `personal-dos-listados` | `personal-en-dos-listados` | «1 persona sale como docente y como no docente» / «N personas salen…» | «La aplicación no sabe si es docente o no docente.» | «En Séneca está en el listado de docentes y en el de no docentes del mismo curso.» | El nombre |
| `personal-listado` | `personal-fichero` | «Un listado de personal trae algo que revisar» / «N avisos de los listados de personal» | «El Centro de datos dejó dicho algo al leer el listado.» | La frase fija: «Lo dice el propio listado; puede faltarle una columna o traer una fila rara.» | El listado; debajo, `detalle` |

- El listado se escribe «docentes», «no docentes» o «todo el personal» (`docentes`, `no-docentes`,
  `todo`).
- Las tres llevan los mismos **pasos**: «Corregirlo en Séneca.», «Bajar otra vez el listado de
  personal.», «Soltarlo en el Centro de datos.». Y una sola acción, con `cambia: false`:
  «Vuelve a mirar» («Trae lo nuevo del Centro de datos y comprueba otra vez.»), que llama a
  `CentroDeDatos.traer({ avisar: true, pedir: true })` y recalcula.
- Ninguna es `urgente`. Ninguna lleva `soporte`.
- Ajusta las palabras a `docs/VOCABULARIO.md` si alguna choca. Lo que no puede faltar: quién es,
  qué le pasa y qué hacer.

### 6. «Lo que tengo ahora» y la línea gris

- En `estado()` de `js/datos-que-tengo.js`, cada curso leído de una parte da **una** fila
  «Personal <curso>», con la fecha y hora del `generado` de la parte, cuántas personas y, en «por
  dónde llegó», la frase que ya existe para lo que hace el propio Centro de datos («Del Centro de
  datos. Lo hace el propio Centro de datos.»; sale sola con el apunte del apartado 1). Los `RelPerCen` de ese curso que no se leen **no
  dan fila**. Un curso que se lee de un `RelPerCen` a mano da su fila de hoy.
- «Hay otro más nuevo sin coger» también tiene que valer para las partes: en `mirarCentro`, cuentan
  las partes del personal que se tomarían ahora, y «Traerlo» las trae.
- La línea gris «Datos del Centro de datos, de <fecha>» del personal (`js/centro-de-datos-ver.js`,
  donde se sube a mano) sigue saliendo: cuenta también los apuntes `hecho-personal|…`, con la fecha
  del más reciente.
- El bloque de Ajustes → Este ordenador que dice cuántos listados hay no cambia.

### 7. La copia de demostración

Parámetro nuevo en `js/demo/` (por ejemplo `personalhecho=`). Con él, la carpeta del Centro de datos
de mentira queda **señalada** (como hace `masnuevo=`) y su índice trae `capacidades: ["hechos"]` y
una parte del personal del curso de hoy, con su fichero, su `huella` de verdad (SHA-256 de sus
bytes) y `hecho` de mañana. La parte se monta a partir del personal inventado de la copia:

- `personalhecho=avisos`: todas las personas de los dos listados de hoy como registros (con sus
  `celdas`), más un aviso `personal-sin-id` de una persona inventada **nueva** («Lozano Rey,
  Marina», puesto «Ordenanza», listado `no-docentes`), un `personal-en-dos-listados` de una de las
  que ya están y un `personal-fichero` («En el listado falta la columna Teléfono.»).
- `personalhecho=limpio`: lo mismo, sin ningún aviso.
- `personalhecho=amano`: como `limpio`, y además en `_GESTOR/datos` hay un `RelPerCen <curso>.csv`
  con apunte `a-mano` y fecha real de **pasado mañana**, con una persona que no está en la parte
  («Vega Soto, Lucas»).

Sin el parámetro, la demostración queda **exactamente** como hoy. Apúntalo en
`docs/COPIA-DE-PRUEBAS.md`. Todos los nombres, inventados.

### 8. Pruebas

Prueba nueva `pruebas/personal-del-centro-de-datos.mjs`, con datos inventados:

1. Un índice sin `hechos`: `elegir` y lo que se toma son los de hoy; no hay ningún
   `PERSONAL-HECHO…json`.
2. Un índice con parte del personal de 26-27 y listados `personal` de 26-27 y de 25-26 (este sin
   parte): se copia la parte, **no** se copian los de 26-27 y **sí** el de 25-26.
3. La `huella` no coincide con los bytes: la parte no se copia ni se apunta. Con la buena, sí.
4. La misma huella dos veces: la segunda no copia nada ni saca aviso verde.
5. `acuerdoHecho: 2`: no se toma, sale el aviso ámbar una vez.
6. `cargarPersonal` con una parte y los `RelPerCen` del mismo curso (con una persona de más en el
   CSV): la persona de más **no** sale. Las de la parte salen con los mismos `nombre`, `documento`,
   `puesto`, `fechaCese`, `campos`, `cursos`, `enElCentro` y `busca` que saldrían del CSV con las
   mismas filas.
7. Lo mismo con el `RelPerCen` apuntado `a-mano` y fecha real posterior al `generado`: ese curso se
   lee del CSV y la persona de más sale. Con fecha real anterior, o sin apunte: manda la parte.
8. Un aviso `personal-sin-id`: la persona sale en la lista, sin documento, con su puesto, y se
   encuentra por su nombre.
9. Dos cursos (25-26 de un CSV, 26-27 de una parte): una persona que está en los dos sale una vez,
   con `cursos` de los dos y los datos del 26-27.
10. Problemas: con los tres avisos en el curso más alto salen las tres tarjetas, con sus líneas; con
    los mismos avisos en un curso que no es el más alto, ninguna; al quitarlos, se quitan.
11. «Lo que tengo ahora»: una fila «Personal <curso>» por parte leída, con «Lo hace el propio Centro
    de datos.», y ninguna de los `RelPerCen` que no se leen.
12. En solo consulta no se copia nada y el personal se lee de lo que haya.

Las pruebas de antes del personal y del Centro de datos (`centro-de-datos`, `dni-personal`,
`datos-que-tengo`, `personas-familias`, `problemas`) no deben cambiar: sin partes, todo es como hoy.
Si alguna cambia, dilo en la nota de la fila.

### 9. Novedades y documentos

- `js/novedades.js`: una línea **corta** al principio, en el mismo commit del código. Por ejemplo:
  «El personal llega ya preparado del Centro de datos, y sus avisos salen en Ajustes → Problemas.»
- `docs/CONTEXTO-CORTO.md`: en la línea del Centro de datos de la sección 5, sustituyendo, que el
  personal se lee de las partes; y en la sección 6 una regla: el personal se pide siempre a
  `Datos` (`cargarPersonal`), nunca abriendo un `RelPerCen` ni una parte por otro lado. Sin pasar de
  40.000 caracteres.
- `docs/contexto/PERSONAS.md` (el personal y «Lo que tengo ahora»),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (los tres módulos y la prueba), `docs/HISTORIA.md`.
- `docs/ACUERDO-PERSONAL.md` ya está en `main` y **no se cambia**: es copia del Centro de datos.

## No se hace en esta fila

- Enseñar si una persona es docente o no docente, ni la tabla `puestos`.
- Tocar la subida a mano, las altas a mano (`personal.csv`) ni `js/traer-datos.js`.
- Borrar los `RelPerCen…csv` de `_GESTOR/datos`.
- Leer las partes del **alumnado** (el Gestor sigue con `ALUMNADO-BD.json`, fila 323).
- Las tutorías, el Consejo Escolar y los cargos ya preparados: son otras filas del Centro de datos
  (21, 22 y 25 de su cola) y tendrán aquí su idea.
- Un trozo propio en el cuadro de avisos de Inicio.
- La fila 328 (entregar las empresas) toca también `js/centro-de-datos.js`, y va detrás: no hay que
  prepararle nada.

## Cuidado

- **Ni un nombre real, ni un DNI real,** en el código, las pruebas, los documentos, los commits ni
  la nota de la cola. Los avisos llevan datos personales: nunca van a un registro de errores ni a
  «Avisar por Soporte».
- Sigue `CLAUDE.md`: rama `fila-327`, revisor en local y, con su APROBADA, a `main`. Mientras
  programas, `npm test -- personal centro-de-datos datos-que-tengo problemas novedades`; la pasada
  completa, **una sola vez**, antes de fusionar. `App.VERSION` con la hora del reloj.
  `docs/ESTIMACIONES.md` en la subida de EN CURSO. `docs/COLA.md` por debajo de 40 KB.
- `EN_SOLITARIO` está en su tope de 20: la prueba nueva tiene que esperar a condiciones, no a pausas.
- Ningún fichero de `js/` pasa de 600 líneas. Un módulo nuevo no envuelve. Nada de fondo escribe
  con un guardado en marcha ni en solo consulta. No preguntes nada: decide y apúntalo en la nota.

## Qué decirle a Francisco al terminar

En tres frases. Que el Gestor ya lee el personal preparado por el Centro de datos, y que lo coge
solo al entrar. Que los avisos del personal salen en Ajustes → Problemas, solo los del curso de
ahora. Y que no tiene que hacer nada, salvo mirar una vez lo del punto **[SOLO FRANCISCO]**.

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1&personalhecho=avisos` y esperar al aviso verde que nombra el Centro de
   datos. Ir a Herramientas y abrir «Traer el alumnado». En «Lo que tengo ahora» hay una sola fila
   del personal de este curso, y dice que es del Centro de datos y que lo hace el propio Centro de
   datos.
2. Con esa misma dirección, ir a Personas y empresas y buscar «Lozano». Sale «Lozano Rey, Marina»,
   con su puesto «Ordenanza» y sin DNI. Abrir su ficha: se abre sin error.
3. Con esa misma dirección, pulsar «+ Nuevo asunto», buscar «Lozano» y elegirla: queda elegida como
   tercero y se puede seguir hasta ver el nombre de la carpeta.
4. Con esa misma dirección, abrir Ajustes y la pestaña «Problemas». Hay una tarjeta que dice que
   una persona del personal viene sin DNI, y en ella se lee «Lozano Rey, Marina», «Ordenanza» y
   «no docentes». Trae tres pasos numerados que nombran Séneca y el Centro de datos.
5. En esa misma pestaña hay otra tarjeta de una persona que sale como docente y como no docente,
   con su nombre, y otra de un listado de personal, con la frase «falta la columna Teléfono».
6. Pulsar «Vuelve a mirar» en una de las tres: no da error y las tres tarjetas siguen ahí.
7. Ir a Inicio. En el cuadro de avisos no hay ningún trozo que nombre al personal; sí el que cuenta
   los problemas por resolver.
8. Abrir `?demo=1&auto=1&personalhecho=limpio` y esperar al aviso verde. En Ajustes → Problemas no
   hay ninguna tarjeta que nombre al personal. En Personas y empresas, al buscar «Lozano» no sale
   nadie, y el resto del personal sale con su DNI y su puesto.
9. Abrir `?demo=1&auto=1&personalhecho=amano`. En Personas y empresas, buscar «Vega Soto»: sale
   «Vega Soto, Lucas». En «Lo que tengo ahora», la fila del personal de este curso dice «A mano.».
10. Abrir `?demo=1&auto=1`, sin el parámetro nuevo. Personas y empresas, «Lo que tengo ahora» y
    Ajustes → Problemas dicen lo mismo que antes de este cambio.
11. **[SOLO FRANCISCO]** En el ordenador que tiene señalada la carpeta del Centro de datos, entrar
    en el Gestor y abrir Herramientas → «Traer el alumnado». La fila «Personal 26-27» dice que lo
    hace el propio Centro de datos y trae el mismo número de personas que la línea «Personal del
    curso 26-27» de la página del Centro de datos.
