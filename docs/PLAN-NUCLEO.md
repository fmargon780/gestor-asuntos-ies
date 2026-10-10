# Plan «el Centro de datos como núcleo» (idea 88 de BD Alumnado)

Diseñado con Francisco el 10-oct-2026. Es el documento común de todas las instrucciones de este
plan. **Vive idéntico en tres repositorios**: `fmargon780/bd-alumnado-ies`,
`fmargon780/centro-de-datos-ies` y `fmargon780/gestor-asuntos-ies`, siempre en
`docs/PLAN-NUCLEO.md`. Si una sesión necesita cambiarlo, lo cambia en el suyo y lo dice en la nota
de su fila, para que la siguiente conversación de diseño lo iguale en los otros dos.

**Léelo antes de trabajar cualquier fila del plan. No contiene ningún dato personal.**

## 1. La idea de Francisco, con sus palabras

> BD Alumnado hace hoy dos cosas: tratar los datos (recibe Séneca y otros ficheros del centro,
> sobre todo de Jefatura, y en el futuro de otros departamentos) y gestionar la Admisión, la
> matrícula y los grupos. Lo primero debería hacerlo el Centro de datos: recibir los ficheros,
> absorber los datos, clasificarlos, depurarlos y servir a cada aplicación lo que necesite, tal
> cual lo necesite. BD Alumnado pasaría a ser solo la aplicación de admisión y matrícula, y leería
> los datos ya hechos del Centro de datos. Lo mismo valdría para el Gestor de Asuntos y las demás.

> El Centro de datos tiene que estar abierto a recibir cualquier conjunto de datos que se genere
> en un centro educativo. En el Gestor de Asuntos manejamos ya otro tipo de datos: el profesorado,
> las empresas con las que se relaciona el centro, las otras administraciones, los tutores legales…

## 2. Lo que decidió Francisco (no se cambia)

1. **Las demás aplicaciones ven también lo que solo sabe BD Alumnado** (el PIL, las correcciones
   escritas en la ficha, el reparto de la mesa). BD Alumnado se lo entrega al Centro de datos y el
   Centro de datos lo reparte. Ninguna aplicación le pide nada a otra.
2. **El reparto.** El Centro de datos recibe todos los ficheros (también los de admisión y
   matrícula, el censo NEAE y los expedientes) y monta la ficha de cada alumno con lo de Séneca ya
   cruzado: datos personales y familia, unidad, materias, pendientes, cursos anteriores,
   repeticiones y NEAE. BD Alumnado calcula el PIL, guarda las correcciones de la ficha y lleva la
   admisión, la lista de espera, el tránsito, la matrícula de julio, la mesa, la comprobación de
   la matrícula, los documentos y las estadísticas. «El grupo y los pendientes salen de Séneca. El
   PIL lo calcula BD Alumnado.»
3. **Los ficheros se sueltan solo en el Centro de datos.** En BD Alumnado desaparecen el botón
   «Actualizar los datos» y la zona de arrastrar. El paso «Datos de Séneca» de cada tarea se
   queda: dice qué fichero falta o está viejo y lleva al Centro de datos.
4. **El Centro de datos está abierto a cualquier conjunto de datos de un centro educativo.** El
   mecanismo se construye general desde el primer día.
5. **Este plan llega solo al alumnado, con sus tutores legales.** Los demás tipos de datos quedan
   apuntados como idea 11 de la cola del Centro de datos.

Siguen valiendo, de antes: **los datos del alumnado no salen de la cuenta de Google del centro**
(nada de bases de datos externas); **nada se sirve por una dirección web**; **ningún nombre de
alumno sale del centro** ni queda en documentos, pruebas o comprobaciones.

## 3. Lo decidido al diseñar (Francisco lo ha leído en una línea)

1. **Cada dato tiene una sola aplicación dueña.** Lo que sale solo de ficheros es del Centro de
   datos. Lo que escribe una persona es de la aplicación donde lo escribe, que se lo entrega al
   Centro de datos. El Centro de datos no tiene pantallas para escribir datos.
2. **Los avisos se siguen revisando en BD Alumnado**, como hoy.
3. **Lo que vive en un cuaderno de Google y no en un fichero se queda en BD Alumnado**: las notas
   del curso pasado (hojas `EV`), la pestaña `TUTORES`, la `OFERTA` y el Excel de Jefatura. BD
   Alumnado entrega lo que saque de ahí. Cuando las notas lleguen como fichero, se verá.
4. **El contrato del Centro de datos sigue siendo el 2.** Todo lo de este plan se añade (carpeta
   nueva, campos nuevos, claves nuevas): no rompe a quien ya lee, así que el número no sube y
   nadie se para.
5. **`ALUMNADO-BD.json` no desaparece: cambia de autor.** Hoy lo genera BD Alumnado. Al final del
   plan lo genera el Centro de datos, con lo suyo más lo que le entregan. Su clave
   (`alumnado-bd`) y su forma (acuerdo 2) no cambian, así que el Gestor sigue leyéndolo igual.
6. **La rapidez de «Actualizar los datos» se arregla en BD Alumnado**, no con este plan (sección
   4). Por eso la primera fila es de BD Alumnado y no depende de nada, y las filas 84 y 85 del
   plan «app rápida» se quedan.
7. **Lo reservado no va en la ficha.** La custodia y la familia numerosa llegarían al Gestor si
   fueran en ella. BD Alumnado sigue tomando el listado `alumnado` (`RegAlum`) tal cual, como hoy,
   y las lee de ahí.
8. **Hay una ficha por curso escolar.** El «curso en marcha» de BD Alumnado lo cambia una persona
   y el `cursoActual` del Centro de datos cambia solo el 1 de septiembre: pueden no coincidir unos
   días. Por eso las partes dicen de qué curso son (6.1) y cada aplicación coge las del suyo.

## 4. Lo que se midió (10-oct-2026, informe real de BD v146)

«Actualizar los datos» dio 15 vueltas (90 minutos de trabajo) y no terminó.

- La tabla de alumnado se hizo **una sola vez** (es el único paso con marca de «ya hecho»).
- Todo lo demás se repitió entero en cada vuelta. Por vuelta: limpiezas de la mesa 99 s, archivo
  para el Gestor 80 s, informes 56 s, cambios para Séneca 46 s, huellas de Documentos 24 s, panel
  21 s, estado de los ficheros 16 s.
- Del tiempo medido: **4 %** es leer y cruzar ficheros (se va al Centro de datos), **30 %**
  desaparece con este plan (el archivo para el Gestor, pintar el cuaderno) y **64 %** es trabajo
  propio de BD Alumnado.

## 5. Quién es dueño de cada dato del alumno

La regla, para cualquier dato de hoy o de mañana:

- **Es del Centro de datos** si su valor sale solo de ficheros: `RegAlum`, matrícula por nivel,
  expedientes de Primaria y de Secundaria, censo NEAE.
- **Es de BD Alumnado** si en su valor entra algo escrito por una persona en BD Alumnado (una
  corrección, una observación), una regla de Jefatura (PIL, permanencias, «no podrá repetir»), el
  reparto de la mesa, la comprobación de la matrícula o un cuaderno de Google (punto 3.3).
- **Un dato tiene un solo dueño.** Si BD Alumnado corrige un dato que nace en un fichero (por
  ejemplo el NEAE de quien no está en el censo), el dato final es de BD Alumnado y el Centro de
  datos publica el valor en bruto con otra clave, nueva.
- **Una `clave` que ya salió en `ALUMNADO-BD.json` no se quita ni se renombra** (lista en
  `ParaElGestor.gs`, `CAMPOS_GESTOR`, de BD Alumnado). Se pueden añadir claves.

Reparto de las claves de hoy (las que no se nombran se deciden con la regla):

| Dueño | Claves |
|---|---|
| Centro de datos, de `RegAlum` | identidad (`apellido1` … `nacionalidad`), `estadoMatricula`, `edad`, contacto (`telefono` … `provincia`), `tutores`, `trayectoria`; y `curso`, `unidad` y `ensenanza` de quien no está en la matrícula por nivel |
| Centro de datos, de la matrícula por nivel | `curso`, `unidad`, `ensenanza`, `materias`, `modalidad`, `pendientes`, `numPendientes` (en 1º de ESO, las pendientes salen del expediente de Primaria) |
| Centro de datos, del historial y los expedientes | `cursoAnterior`, `repiteCurso`, `repeticionesEso`, `cursosRepetidosEso`, `fuenteEso`, `repeticionesPrimaria`, `cursosRepetidosPrimaria`, `fuentePrimaria`, `primaria…`, `secundaria…`, `centrosSecundaria`, `centroProcedencia` |
| Centro de datos, claves nuevas en bruto | las de `docs/NUCLEO-CLAVES-EN-BRUTO.md`: lo que sale solo de ficheros y BD Alumnado necesita para calcular encima (lo del expediente, lo del censo NEAE, las casillas de la matrícula, «repetía» y «sin localizar» antes de corregir) |
| BD Alumnado, por la `OFERTA` | `opt`, `frAlct`, `mat`, `opc1`…`opc4`, `religion`, `materiasModalidad`, `optativas`, `numAsignaturas` (salen de Séneca, pero repartidas o contadas según la pestaña `OFERTA`, que es de BD Alumnado) |
| BD Alumnado, por llevar una corrección dentro | `repetiaAnterior`, `repSinLocalizar`, `repeticiones`, `repeticionesPrimariaCorregido`, `repetiaAnteriorCorregido`, `motivoCorreccion`, `trayectoriaTexto`, `neae`, `medidasRecursos` |
| BD Alumnado, lo demás suyo | `pil`, `pilAMano`, `noPodraRepetir`, `agotaPermanencias`, `diversificacion`, `materiasNoSuperadas`, `suspensosAnterior`, `comprobacionMatricula`, `deberiaTener`, `tutorUnidad`, las `jef…` del reparto definitivo, `observaciones` |

**La lista que manda es la que lleva cada fichero**: cada campo dice su `dueno` (6.3). BD Alumnado
no entrega lo que la ficha ya trae como del Centro de datos, y entrega lo que nadie publica.

**Las claves nuevas en bruto** están en `docs/NUCLEO-CLAVES-EN-BRUTO.md` (idéntico en BD Alumnado y
en el Centro de datos): nombre, tipo, de qué fichero sale y para qué la necesita BD Alumnado. Para
calcular el PIL y montar su tabla, BD Alumnado necesita los datos **sin corregir** y de dónde
salen. Ninguna fila inventa una clave en bruto por su cuenta: la añade a esa lista.

**El cruce no siempre es por número.** La matrícula por nivel no trae el Nº de identificación
escolar (se cruza por nombre y unidad), los expedientes llevan el nombre en el del fichero y el
censo NEAE solo iniciales. Lo que no casa nunca se pierde: va a `avisos` (6.3).

## 6. El acuerdo de los «datos ya hechos»

Es lo único que une a las aplicaciones. Se añade a `docs/CONTRATO.md` del Centro de datos, que
sigue siendo la versión buena; aquí va lo esencial.

### 6.1 La carpeta

    CENTRO DE DATOS/
    ├── hecho/                    datos ya hechos; solo los escribe el Centro de datos
    │   ├── estado.json           cómo va el propio Centro de datos; solo cifras y palabras fijas
    │   └── <conjunto>/           hoy solo `alumnado`
    │       └── …                 una o varias partes; las rutas las dice el índice
    └── (todo lo demás, como en el contrato 2)

Un **conjunto** es un tipo de cosa (`alumnado`; mañana `personal`, `empresas`…). Sus **partes** las
decide el Centro de datos para no rehacerlo todo cada vez. En el alumnado:

- una parte `actuales` **por curso escolar** (`cursoEscolar: "26-27"`): todo el que tiene línea
  de `RegAlum` de ese curso (también con la matrícula anulada o trasladada; `matriculado` dice si
  lo está), con su ficha de ese curso, hecha **como si `RegAlum` acabara en ese curso**: así no
  cambia cuando llegan las matrículas del siguiente. Se publican tres como mucho: la de
  `cursoActual`; la del curso siguiente, cuando `RegAlum` ya trae matrículas suyas; y la del curso
  anterior durante septiembre y octubre (o mientras `RegAlum` no traiga ninguna línea del actual),
  para quien todavía no ha abierto el curso nuevo;
- una parte `antiguos` (`cursoEscolar: ""`): quien no está en ninguna de las anteriores.

**Cómo lee una aplicación un curso:** coge la parte `actuales` de ese curso; todos los demás
registros de las otras partes son antiguos para ella. Un `id` que ya está en la parte `actuales`
de su curso no se vuelve a coger de otra; si sale en varias de las otras, vale la del curso más
reciente. Si no hay parte `actuales` de su curso, no hay
ficha para ella: lo dice y sigue como estaba. Quien lee comprueba la `huella` de lo que abre
contra la del índice; si no coincide, no lo usa y lo vuelve a intentar más tarde.

De lo que hay en `hecho/` **no se guardan versiones anteriores**: se puede volver a hacer.

### 6.2 En `indice.json`: `capacidades` y `hechos`

Dos campos nuevos (quien no los conoce los ignora; `contrato` sigue en `2`):

    "capacidades": ["hechos", "entregas"],
    "hechos": [
      { "conjunto": "alumnado", "parte": "actuales", "cursoEscolar": "26-27", "acuerdoHecho": 1,
        "ruta": "hecho/alumnado/26-27/actuales.json", "idDrive": "…",
        "hecho": "2026-10-12T08:10:00+02:00", "huella": "sha-256 en hexadecimal",
        "registros": 831, "bytes": 912345, "alDia": true,
        "fuentes": [ { "clave": "alumnado", "variante": "", "huella": "…" } ] }
    ]

- `capacidades` dice qué sabe hacer ya este Centro de datos: `hechos` cuando publica datos ya
  hechos, `entregas` cuando recibe lo de las aplicaciones (6.4).
- `alDia` es `false` mientras alguna fuente ha cambiado y la parte todavía no se ha rehecho. Quien
  lee puede seguir usando la parte que hay; solo lo dice («se está poniendo al día»).
- `fuentes`: de qué listados salió y con qué huella. Una parte **solo se rehace si cambia la
  huella de alguna de sus fuentes** o la versión del programa que la hace.
- Con `ocupado: true` no se toma nada, como siempre.

### 6.3 La forma de una parte

La misma idea que `ALUMNADO-BD.json` (acuerdo 2): **el fichero se describe a sí mismo**.

    { "acuerdoHecho": 1, "conjunto": "alumnado", "parte": "actuales", "cursoEscolar": "26-27",
      "generado": "2026-10-12T08:10:00+02:00", "origen": "centro-de-datos-ies",
      "columnasMatricula": { "eso1": [ "títulos del listado de ese nivel" ] },
      "campos": [ { "clave": "apellido1", "etiqueta": "Primer apellido", "apartado": "Identidad",
                    "tipo": "texto", "dueno": "centro-de-datos-ies", "fuente": "alumnado" } ],
      "registros": [ { "id": "1234567", "matriculado": true, "datos": { "apellido1": "…" } } ],
      "avisos": [ { "tipo": "matricula-sin-ficha", "id": null, "datos": { "…": "…" } } ] }

- `id` del alumnado: el Nº de identificación escolar. Sin `id` no hay registro: va a `avisos`.
- **`avisos`**: lo que el cruce no ha podido casar o resolver (quien está en la matrícula por
  nivel y no en `RegAlum`, una ficha del censo sin alumno, un expediente que no casa, dos filas
  iguales). Cada uno lleva un `tipo` de una lista cerrada, el `id` si se sabe y los `datos` que
  hagan falta para enseñarlo. Es el camino por el que los avisos del cruce llegan a BD Alumnado,
  que es donde se revisan (3.2). Llevan datos personales: no salen de la carpeta.
- `columnasMatricula`: los títulos de cada listado de matrícula, por nivel. BD Alumnado los
  necesita para saber qué materias existen aunque nadie las curse.
- Tipos: `texto`, `numero`, `fecha` (`AAAA-MM-DD`), `si-no`, `lista` y `tabla` (con `columnas`),
  los mismos del acuerdo 2. Lo que no se sabe, `null` o ausente. **Nunca se inventa nada.**
- `dueno` es el nombre del repositorio de la aplicación dueña. `fuente` es la `clave` del listado
  del que sale (dos, separadas por coma, si sale de dos).
- Las claves, etiquetas, apartados y tipos de los datos que ya existen son **los mismos** que hoy
  lleva `ALUMNADO-BD.json`.

### 6.4 Las entregas de las aplicaciones

Una aplicación entrega sus datos dejando en `entrada/` un fichero llamado
`ENTREGA <conjunto> <aplicación>.json` (por ejemplo `ENTREGA alumnado bd-alumnado-ies.json`). Si
ya hay uno sin recoger, lo sustituye.

    { "entrega": 1, "conjunto": "alumnado", "origen": "bd-alumnado-ies",
      "generado": "…", "hechoCon": [ "huella de cada parte que usó" ],
      "campos": [ { "clave": "pil", "etiqueta": "PIL", "apartado": "Historia", "tipo": "texto",
                    "dueno": "bd-alumnado-ies" } ],
      "registros": [ { "id": "1234567", "datos": { "pil": "…" } } ] }

- Una aplicación solo entrega campos **suyos**. Un campo cuyo dueño es otro se ignora y se cuenta
  en `estado.json`.
- El Centro de datos la guarda con la clave nueva `entrega` (variante `<conjunto>/<aplicación>`)
  y rehace la ficha completa.
- Una entrega igual que la anterior (misma huella) no cambia nada.
- De cada entrega se guarda la vigente y **solo la anterior**: pesan megas.

### 6.5 La ficha completa

Es la unión, por `id`, de todas las partes del conjunto y de todas sus entregas. Para el alumnado
es **`ALUMNADO-BD.json`**, clave `alumnado-bd`, con la forma del acuerdo 2 de
`docs/ACUERDO-ALUMNADO.md` (`acuerdo: 2`, `alumnos`, `idEscolar`, `cursoAcademico`: no la de las
partes), `origen: "centro-de-datos-ies"` y, en cada campo, su `dueno`. Es la del `cursoActual`.
En el índice hay **una sola entrada** `alumnado-bd` (con dos, el Gestor no coge ninguna), con
`subidoPor: "centro-de-datos-ies"` y `via: "hecho"`. Tampoco de ella se guardan anteriores.
Si `RegAlum` todavía no trae ninguna línea del `cursoActual`, es la del curso anterior. Quien no
tiene matrícula ese curso lleva solo lo que sale de `RegAlum`, como hoy.

**El relevo.** Mientras BD Alumnado siga dejando `ALUMNADO-BD.json` en `entrada/`, el Centro de
datos lo guarda como hoy y **no** genera el suyo. En cuanto llega la primera
`ENTREGA alumnado bd-alumnado-ies.json`, el Centro de datos pasa a generarlo él; un
`ALUMNADO-BD.json` que llegue después por `entrada/` va a «Sin clasificar» con el motivo «ya lo
genera el Centro de datos».

### 6.6 `hecho/estado.json`

Lo escribe el Centro de datos al final de cada tanda. Solo cifras y palabras fijas: versión,
cuándo, por cada conjunto y parte los registros, los que se quedaron sin `id`, los segundos que
tardó, si está al día, cuántos avisos de cada tipo (`sinId`, `sinFicha` y los demás, con nombre
fijo), y las entregas recibidas (de quién, cuándo, cuántos campos ignorados).
**Ningún nombre, ningún número de identificación, ningún texto escrito por una persona.** Es lo
que las demás aplicaciones (y sus comprobaciones) leen para saber cómo va el núcleo.

## 7. Las filas del plan

Cada cola se trabaja en el orden de sus filas. La aplicación funciona en todo momento.

**BD Alumnado** (`docs/COLA.md`), en este orden junto con las del plan «app rápida»:

| Fila | Documento | Qué hace | Condición |
|---|---|---|---|
| 83 | (plan «app rápida») | Como estaba | La suya |
| 88 | `NUCLEO-BD-0-ACTUALIZAR-TERMINA.md` | Cada paso de la actualización apunta que ya está hecho y no se repite en la vuelta siguiente | Ninguna |
| 89 | `NUCLEO-BD-1-COMPARAR-LA-FICHA.md` | BD Alumnado lee la ficha del Centro de datos solo para compararla con lo suyo, y cuenta en qué se diferencian | Ninguna (si no hay ficha, lo dice) |
| 84, 85 | (plan «app rápida») | Como estaban, con el aviso que llevan arriba | Las suyas |
| 90 | `NUCLEO-BD-2-LA-TABLA-EN-SOMBRA.md` | BD Alumnado monta su tabla de las dos maneras, a la antigua y desde la ficha, y cuenta las diferencias. Sigue valiendo la antigua | La comparación de la 89 sale sin diferencias |
| 91 | `NUCLEO-BD-3-LA-TABLA-DESDE-LA-FICHA.md` | La tabla pasa a salir de la ficha; la manera antigua queda de reserva | La sombra de la 90 sale sin diferencias con los datos reales |
| 92 | `NUCLEO-BD-4-ENTREGAR-LO-SUYO.md` | BD Alumnado entrega lo suyo y deja de escribir `ALUMNADO-BD.json` | La 91 confirmada y el Centro de datos con la capacidad `entregas` |
| 93 | `NUCLEO-BD-5-TOMAR-LOS-FICHEROS.md` | Los ficheros de admisión y matrícula se toman del Centro de datos y BD Alumnado se pone al día sola; no se quita nada todavía | La 92 confirmada |
| 94 | `NUCLEO-BD-6-SIN-BOTON-NI-ZONA.md` | Desaparecen la zona de arrastrar y «Actualizar los datos» | La 93 confirmada |
| 86 | (plan «app rápida») | Como estaba | La suya |

**Centro de datos** (`docs/COLA.md`), seguidas:

| Fila | Documento | Qué hace |
|---|---|---|
| 12 | `12-DATOS-YA-HECHOS.md` | El mecanismo general (`hecho/`, `hechos`, partes, solo lo que cambia, por tandas) y la primera ficha del alumno, con lo de `RegAlum`: identidad, contacto, tutores legales y matrículas en el centro |
| 13 | `13-DATOS-YA-HECHOS-A-LA-VISTA.md` | La página dice qué datos ya hechos hay y de cuándo, `hecho/estado.json` y la parte nueva del contrato |
| 14 | `14-COMPROBARSE-SOLO.md` | El Centro de datos se mide y se comprueba solo con los datos reales, y lo cuenta sin sacar ningún nombre |
| 15 | `15-FICHA-MATRICULA-Y-MATERIAS.md` | La ficha añade la matrícula por nivel: curso, unidad, materias, pendientes y las casillas en bruto |
| 16 | `16-FICHA-HISTORIA-Y-EXPEDIENTES.md` | La ficha añade cursos anteriores, repeticiones y expedientes de Primaria y de Secundaria |
| 17 | `17-FICHA-CENSO-NEAE.md` | La ficha añade el censo NEAE en bruto |
| 18 | `18-ENTREGAS-Y-FICHA-COMPLETA.md` | Recibe las entregas de las aplicaciones y genera la ficha completa (`ALUMNADO-BD.json`) |
| 19 | `19-ADMISION-Y-PLANIFICACION-POR-NIVEL.md` | Los ficheros de admisión y de planificación se guardan uno por nivel, y se reconocen también por sus títulos de columna, para que BD Alumnado pueda tomarlos todos de aquí |

**Gestor de Asuntos** (`docs/COLA.md`): fila 323, `NUCLEO-GESTOR-FICHA-DEL-CENTRO-DE-DATOS.md`. El
Gestor acepta `ALUMNADO-BD.json` venga de quien venga y pone al día su copia de los acuerdos. Sin
condición: conviene que esté hecha antes de la fila 92 de BD Alumnado.

## 8. Las reglas del plan

1. **Nada se apaga hasta que lo nuevo da lo mismo.** BD Alumnado sigue montando su tabla a la
   antigua hasta la fila 91, y la 91 no empieza hasta que la comparación de la 89 y la sombra de
   la 90 salen sin diferencias con los datos reales. El paso lo decide una sesión leyendo
   `comprobaciones/ultima.json`, nunca la aplicación sola.
2. **Una fila con condición que no se cumple se salta.** No se marca, no se toca ningún fichero y
   se coge la siguiente PENDIENTE. No es una BLOQUEADA. (Las filas 83 a 86 del plan «app rápida»
   siguen con su propia regla, que es parar.)
3. **Cómo sabe una sesión de BD Alumnado cómo va el Centro de datos:** por
   `comprobaciones/ultima.json` de su propio repositorio. La fila 89 añade las comprobaciones que
   leen `indice.json` y `hecho/estado.json` y las cuentan como `dato` (cifras y palabras fijas, por
   la única puerta). Una sesión nunca supone el estado de otro repositorio.
4. **Las diferencias entre la ficha y la tabla son un `dato`, no un `mal`.** Un `mal` para toda la
   cola de BD Alumnado y esa diferencia puede no ser suya.
5. **El Centro de datos trabaja por tandas y solo lo que cambia.** Tiene el mismo límite de seis
   minutos. Una parte se rehace solo si cambia la huella de una fuente; lo leído de cada fichero
   se guarda ya interpretado en `_interno/`, con su huella, para no volver a leerlo.
6. **Las reglas se copian, no se reinventan.** Lo que hoy calcula BD Alumnado está probado. El
   Centro de datos lleva en `referencia/bd-alumnado/` una copia de los ficheros de BD Alumnado que
   lo hacen, con alumnado inventado y el resultado que tiene que dar (`referencia/bd-alumnado/LEEME.md`).
7. **Las filas de este plan no cambian ninguna pantalla de BD Alumnado** hasta la 93, salvo una
   línea de aviso en la Portada cuando haga falta decir algo. En el Gestor, tres frases dicen de
   dónde viene el fichero.
8. **La manera antigua de montar la tabla no se borra en este plan.** Se queda de reserva y vale
   también para un centro que no tenga Centro de datos. Retirarla será otra idea.
9. **Mejor antes de junio.** La comparación de la fila 89 se hace contra el archivo propio de BD
   Alumnado, que toma como «este curso» el último año que trae `RegAlum`. Cuando `RegAlum` traiga
   matrículas del curso siguiente dará diferencias que no son fallo. Conviene que la fila 91 esté
   hecha antes; si no, espera a que se abra el curso nuevo.
10. **En las pruebas, el reloj se fija** (por ejemplo en enero) para que el curso actual y las
    partes que se publican no dependan del día en que se pasan.

## 9. Datos de menores

- Las partes de `hecho/` y las entregas llevan datos personales: viven solo en la carpeta «CENTRO
  DE DATOS» del Drive del centro, que es privada. Nunca en un repositorio, ni en pruebas.
- A GitHub solo viajan cifras y palabras fijas. En BD Alumnado, por `comprobacionesPuerta_`.
- Las pruebas usan alumnado inventado.
- El Gestor guarda su copia en el Dropbox del centro, como ya hacía con `ALUMNADO-BD.json`.

## 10. Lo que queda fuera

- Los demás tipos de datos (personal, empresas, Administraciones, cargos, Consejo Escolar,
  tutorías): idea 11 de la cola del Centro de datos.
- Las notas del curso pasado, mientras vivan en un cuaderno de Google.
- Que el Gestor deje de leer `RegAlum.csv` por su cuenta y saque los tutores legales de la ficha:
  no hace falta para este plan.
- La mudanza del Centro de datos a una cuenta general del centro.
