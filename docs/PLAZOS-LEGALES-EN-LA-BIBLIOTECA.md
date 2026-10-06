# Plazos legales en la biblioteca de hitos (fila 284)

Cerrado con Francisco el 6-oct-2026. Sale de la auditoría de procedimiento de ese día
(`claude/Auditoria-procedimiento-2026-10-06.md` del proyecto de Claude, punto 2): la app sabe
contar plazos, pero la biblioteca del centro no trae ninguno puesto.

## Qué pasa hoy

Comprobado en `main` el 6-oct-2026:

- `datos-biblioteca/biblioteca-centro.json` tiene 298 hitos modelo. **Ninguno lleva plazo.** Los
  plazos están escritos como frase dentro de la explicación («2 días lectivos desde la
  comunicación»). Fue a propósito (cabecera de `herramientas/cargar-biblioteca.mjs`): nadie había
  decidido los números. Ahora están decididos, y son los de este documento.
- Un plazo es «tantos días desde que se termine **otro hito**» (`plazo.desde` es el id de ese otro
  hito, `js/hitos.js`, `aplicarPlazosDependientes`). Un modelo de la biblioteca no vive en ninguna
  guía, así que no tiene «otro hito» al que apuntar. Por eso hoy un modelo no puede traer un plazo
  que funcione.
- Un plazo solo se cuenta en días: hábiles, lectivos o naturales (`Plazos.CUENTAS`, `js/plazos.js`).
  No hay meses. Y «un mes» no son 30 días.

## Qué quiere Francisco

Que los hitos que se repiten en casi todos los procedimientos estén en la biblioteca con su plazo
legal ya puesto, y que los que ya están lleven el suyo en número, no en una frase. Sin tareas
manuales suyas: que llegue solo al centro.

## Palabras de este documento

- **Modelo**: un hito de la biblioteca (`_GESTOR/hitos-biblioteca.json`).
- **Paso**: un hito dentro de la guía de un tipo de asunto (`_GESTOR/guias.json`).
- **El de arriba**: el paso que está justo encima, en el mismo nivel de la misma guía.

## Qué hay que hacer

Cuatro cosas. Van juntas porque ninguna sirve sin las otras.

### 1. Un plazo se puede contar en meses

- En `Plazos.CUENTAS`, una cuarta manera: `{ valor: 'meses', texto: 'Meses', corto: 'meses' }`.
- `Plazos.sumarPlazo` con `meses`: el mismo número de día, tantos meses después. Si ese mes no
  tiene ese día, su último día. Si el día que sale no es hábil (sábado, domingo o festivo), el
  siguiente hábil (Ley 39/2015, art. 30.4 y 30.5). Ejemplos, sin festivos: 6-oct-2026 + 1 mes =
  6-nov-2026; 15-oct-2026 + 1 mes = 16-nov-2026 (el 15 es domingo); 31-ago-2026 + 1 mes =
  30-sep-2026.
- `Plazos.textoPlazo`: «1 mes», «2 meses». `Plazos.diasQueQuedan` con `meses`: días naturales.
- Hay tres sitios que hoy solo dejan pasar `lectivos` y `naturales`, escritos a mano:
  `js/guias.js` (línea 138), `js/hitos-biblioteca.js` (línea 106) y `cuentaDePlazo` de
  `js/hitos.js` (línea 83). Los tres pasan a usar `Plazos.cuentaValida`. Si no, un plazo en meses
  se guarda como hábiles sin avisar.
- En el editor de un paso y en el cuadro de crear o cambiar un hito desde el asunto
  (`js/hitos-desde-el-asunto.js`), con «Meses» elegido la frase se tiene que leer bien («1 mes
  desde…», no «1 días…»).

### 2. Un modelo de la biblioteca puede llevar plazo

Un modelo guarda **cuántos y cómo se cuentan** (`plazo.dias` y `plazo.cuenta`), nunca desde qué
hito (`plazo.desde` vacío). El «desde» se decide al llegar a una guía:

- **Al llegar a una guía** por cualquiera de los tres caminos («+ Traer de la biblioteca»,
  «Usarlo» al escribir el título, y la carga del centro del apartado 4): el paso nuevo cuenta
  desde **el de arriba**. Si no hay ninguno encima, el paso llega **sin plazo**. Sin error y sin
  preguntar.
- **En el editor de un modelo** (`GuiasBiblioteca.editarModeloPorId`): se puede poner y quitar el
  plazo (número y cómo se cuenta). Donde un paso tiene el desplegable «desde», el modelo lleva un
  texto fijo: «desde que se termine el hito de arriba, en cada guía».
- **«Guardar en la biblioteca»** desde un paso con plazo: el modelo se queda con los días y la
  cuenta, y con el «desde» vacío.
- **La comparación** entre un paso y su modelo (`HitosBiblioteca.diferencias`) mira los días y
  cómo se cuentan. Nunca el «desde»: que cada guía cuente desde un hito distinto no es un cambio.
- En la lista de la biblioteca (Ajustes → El centro) y en el panel «+ Traer de la biblioteca», el
  modelo con plazo lo dice: «10 días hábiles».

### 3. El contenido

**No vuelvas a generar `biblioteca-centro.json` desde `docs/contenido/`**: las tareas de los
modelos (fila 109) no salen de esos documentos y se perderían. Cambia el JSON directamente (con un
programa de una sola vez en `herramientas/`, si te resulta más seguro) y sube su `version` a 2.

#### 3.1. Plazo en modelos que ya existen

| Modelo | Título | Plazo | En la guía de | Cuenta desde |
|---|---|---|---|---|
| `b15` | Plazo de reclamación | 2 días lectivos | Corrección por conducta contraria a la convivencia | `b13` Comunicar a la familia y dejar constancia escrita |
| `b15` | Plazo de reclamación | 2 días lectivos | Medida disciplinaria por conducta gravemente perjudicial | `b21` Notificar a la familia con constancia escrita |
| `b32` | Notificar la resolución | 10 días hábiles | Expediente de cambio de centro docente | `b31` Resolución |
| `b120` | Registrar la reclamación a la Delegación | 2 días hábiles | Reclamación de calificaciones | `b118` Comunicar la resolución del centro |
| `b121` | Remitir el expediente a la Delegación Territorial | 3 días hábiles | Reclamación de calificaciones | `b120` Registrar la reclamación a la Delegación |
| `b157` | Responder | 1 mes | Solicitud de acceso a datos personales | `b154` Registrar la solicitud |

Ojo: en cuatro de las seis filas el «desde» **no es el de arriba**. Por eso el JSON tiene que
decirlo por guía (una clave nueva, por ejemplo `plazosPorTipo`: tipo → modelo → modelo desde el
que cuenta). La forma la eliges tú.

`b114` «Registrar la solicitud de revisión» (2 días hábiles desde las notas) **se queda como
está, sin número**: el asunto se abre cuando la solicitud ya ha llegado, y no hay hito anterior
desde el que contar. Su explicación ya lo dice en palabras.

No cambies el título, la explicación, las tareas ni la normativa de estos modelos.

#### 3.2. Siete modelos nuevos, comunes a cualquier procedimiento

No entran en ninguna guía: quedan en la biblioteca para traerlos. Los tres primeros van por
parejas: lo que hace Administración, y la espera, que es la que lleva el plazo. Así el asunto pasa
solo a «En espera» con su fecha.

Todos: `nombre` igual al título, `soloInformativo: false`, `revision: 1`, normativa solo con la
cita (sin bloque ni clave: no inventes claves). Ids fijos, los de la tabla. Las tareas, con el
mismo formato que las demás del JSON (`accion`: `generar`, `registrar`, `comunicar`, `anadir` o
vacía).

| Id | Título | Responsable | Plazo | Norma |
|---|---|---|---|---|
| `b-comun-requerir` | Requerir que completen la solicitud | Administración | — | Ley 39/2015, art. 68.1 |
| `b-comun-esperar-solicitud` | Esperar a que completen la solicitud | `tercero` | 10 días hábiles | Ley 39/2015, art. 68.1 |
| `b-comun-audiencia` | Dar audiencia al interesado | Administración | — | Ley 39/2015, art. 82 |
| `b-comun-esperar-alegaciones` | Esperar las alegaciones | `tercero` | 10 días hábiles | Ley 39/2015, art. 82.2 |
| `b-comun-pedir-informe` | Pedir informe a otro órgano | Administración | — | Ley 39/2015, art. 80.2 |
| `b-comun-esperar-informe` | Esperar el informe | (vacío) | 10 días hábiles | Ley 39/2015, art. 80.2 |
| `b-comun-esperar-alzada` | Esperar el plazo de recurso de alzada | `tercero` | 1 mes | Ley 39/2015, arts. 121 y 122 |

`tercero` es el papel «El tercero del asunto» (`js/hitos.js`, línea 43). «Administración», escrito
igual que en los demás modelos del JSON.

Explicación y tareas de cada uno:

**Requerir que completen la solicitud.** «Cuando a la solicitud le falta un documento o un dato
obligatorio. Se le dan 10 días hábiles para traerlo y se le avisa de que, si no lo hace, se le
tendrá por desistido. Después de este hito va «Esperar a que completen la solicitud».»
1. Generar el requerimiento (`generar`) — «Con lo que falta, el plazo de 10 días hábiles y el aviso
   de desistimiento.»
2. Registrar la salida en Séneca (`registrar`).
3. Enviarlo por un medio que deje constancia de que lo recibe (`comunicar`) — «PASEN con acuse o
   recibí firmado. Un correo normal no prueba que lo recibió.»

**Esperar a que completen la solicitud.** «El plazo legal cuenta desde el día siguiente a aquel en
que recibe el requerimiento. La aplicación lo cuenta desde que das por hecho el hito de arriba: si
lo recibió más tarde, cambia la fecha a mano. Si le cuesta reunirlo, se puede ampliar hasta 5 días más.»
1. Añadir lo que traiga (`anadir`).
2. Si pasa el plazo sin traerlo, anotarlo y seguir por el desistimiento (sin acción).

**Dar audiencia al interesado.** «Antes de proponer la resolución, se le enseña el expediente y se
le dan entre 10 y 15 días hábiles para alegar. Aquí van 10; si el centro quiere dar más, se cambia
el plazo del hito siguiente. Después va «Esperar las alegaciones».»
1. Generar el escrito de audiencia (`generar`) — «Con el plazo para alegar y dónde ver el
   expediente.»
2. Registrar la salida en Séneca (`registrar`).
3. Enviarlo por un medio que deje constancia de que lo recibe (`comunicar`).

**Esperar las alegaciones.** «El plazo legal cuenta desde el día siguiente a aquel en que recibe el
escrito. La aplicación lo cuenta desde que das por hecho el hito de arriba: si lo recibió más
tarde, cambia la fecha a mano. Si antes de que acabe dice que no va a alegar, el hito se da por
hecho.»
1. Añadir las alegaciones, o la renuncia a alegar (`anadir`).

**Pedir informe a otro órgano.** «Cuando para resolver hace falta el informe de otro órgano. Salvo
que una norma diga otra cosa, tiene 10 días hábiles para emitirlo. Después va «Esperar el
informe».»
1. Generar la petición de informe (`generar`) — «Citando la norma que lo exige, o por qué hace
   falta.»
2. Registrar la salida en Séneca (`registrar`).
3. Enviarla al órgano (`comunicar`).

**Esperar el informe.** «Si pasa el plazo sin informe y no es de los que la norma obliga a esperar,
se puede seguir sin él. Pon como responsable al órgano al que se le pide.»
1. Añadir el informe (`anadir`).

**Esperar el plazo de recurso de alzada.** «Un mes desde el día siguiente a la notificación. Si no
recurre, la resolución queda firme. Si recurre, el centro manda el recurso, con su informe y una
copia del expediente, a quien tiene que resolverlo, en 10 días hábiles. La aplicación cuenta el mes
desde que das por hecho el hito de arriba: si la notificación la recibió más tarde, cambia la fecha
a mano.»
1. Si llega un recurso, añadirlo (`anadir`) y registrar la entrada (`registrar`).
2. Si no llega, anotar que la resolución es firme (sin acción).

### 4. Cómo llega al centro: solo, una vez

Módulo nuevo `js/plazos-del-centro.js` (`PlazosDelCentro`). Hace una pasada al entrar, la primera
vez que un ordenador del centro abre esta versión:

1. **Modelos nuevos**: los siete del 3.2 que no estén ya en `_GESTOR/hitos-biblioteca.json` (por
   id) se añaden.
2. **Modelos que ya están** (los del 3.1): si el modelo del centro **no tiene plazo**, se le pone.
   Si ya tiene uno, no se toca.
3. **Pasos de las guías** (`_GESTOR/guias.json`): en cada guía, cada paso del nivel de arriba que
   venga de uno de esos modelos (`origenBiblioteca.id`, o el id del paso, como hace
   `traerGuiones`) y **no tenga plazo** recibe los días y la cuenta. Su «desde» es el paso de esa
   guía que venga del modelo de la columna «Cuenta desde», **solo si hay tabla para ese tipo**; si
   el tipo no está en la tabla, o ese paso ya no está en la guía, **el de arriba**; si no hay
   ninguno encima, ese paso se queda sin plazo.
4. Nada de esto sube la `revision` de un modelo ni enciende el aviso «hay un cambio en la
   biblioteca» en las guías. Mira cómo lo evita `traerGuiones` (`js/cargar-biblioteca.js`) y haz
   lo mismo.
5. Al terminar apunta en `_GESTOR` que la versión 2 ya está puesta (una marca `plazosDelCentro`,
   en un fichero de ajustes que ya pase por `ColaGuardado`; no crees un fichero nuevo si puedes
   evitarlo). Con la marca puesta, la pasada **no se repite**: si alguien quita un plazo a
   propósito, no vuelve solo.
6. Una línea verde, una sola vez: «Plazos legales puestos en N hitos de M guías. La biblioteca
   tiene 7 hitos comunes nuevos.» (con los números de verdad; si N es 0, solo la segunda frase; si
   no se añadió nada, no sale). Si en Ajustes › Hitos no hay festivos, debajo, en ámbar: «Faltan
   los festivos: sin ellos los días hábiles se cuentan mal.», con «Ponerlos», que abre esa
   sección.

Reglas de la pasada (sección 6 del contexto corto): no corre con `SoloConsulta.activo()`, ni con
un guardado en marcha, y nunca dos veces a la vez; relee antes de escribir; escribe por
`HitosBiblioteca.cambiar` y `GuiasDelCentro.guardarPasos` (o lo que usen `traerGuiones` y
`fusionarModelos`). Se engancha por `window.Gestor.alRefrescar` o por el punto que usen las otras
pasadas de entrada (`PorLiquidar`, `TiposParecidos`); no envuelve nada.

El botón **«Cargar la biblioteca del centro»** (Ajustes → Mantenimiento) hace además esta misma
pasada, con la misma función, aunque la marca ya esté puesta: es quien lo pulsa quien pide rellenar
lo que esté vacío. Su resumen dice cuántos plazos ha puesto.

## Qué NO se toca

- Los hitos de los asuntos ya abiertos. Los plazos nuevos valen para los asuntos que se creen
  después. No recalcules ninguna fecha.
- Un plazo que el centro ya tenga puesto, en un modelo o en un paso. Nunca se pisa.
- El título, la explicación, las tareas y la normativa de los modelos que ya existen.
- Cómo se cuentan los días hábiles, lectivos y naturales.
- Los pasos de dentro de una pregunta (opciones): la pasada solo mira el nivel de arriba.
- `docs/contenido/*.md` y `herramientas/cargar-biblioteca.mjs`.
- El apunte de la fecha en que el tercero recibe una notificación: es otra fila, todavía sin
  diseñar (punto 4 de la auditoría). Aquí solo va el aviso en la explicación.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md` (de «La
  biblioteca de hitos del centro» al final de ese apartado, y el punto «Plazo»), `js/plazos.js`,
  `js/guias-plazo.js`, `js/hitos-biblioteca.js`, `js/cargar-biblioteca.js`, `js/guias-editor.js`
  (de la línea 250 a la 330), `js/hitos.js` (de la 75 a la 110 y de la 450 a la 490) y
  `js/hitos-desde-el-asunto.js` (de la 110 a la 210) basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas. `js/hitos.js` ya tiene 647: ahí
  el cambio es de una línea; no lo hagas crecer.
- Antes de colgar `PlazosDelCentro`, mira que el nombre esté libre.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La copia sin internet (`file://`) lee el JSON por `App.leerFicheroDeLaApp`: comprueba que la
  pasada también funciona ahí.
- La copia de demostración tiene que dejar ver todo esto al revisor: que su biblioteca traiga los
  siete modelos nuevos y que la pasada corra también en ella. Si los datos de demostración no
  traen ninguna guía de la tabla 3.1, añade una, con las mismas funciones de las pantallas.
- Rama `fila-284`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs plazos biblioteca
  cargar-biblioteca guia-origen`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/plazos.js`: la cuenta `meses`.
- `js/guias.js`, `js/hitos-biblioteca.js`, `js/hitos.js`: `Plazos.cuentaValida` en vez de la lista
  escrita a mano; en `hitos-biblioteca.js`, además, el plazo del modelo (apartado 2).
- `js/guias-biblioteca.js` (o el hijo suyo que pinte el editor del modelo y el panel de traer): el
  plazo en el editor del modelo y en las listas; el «desde» al traer.
- `js/guias-editor.js`, `js/hitos-desde-el-asunto.js`: solo la frase con «Meses».
- `js/cargar-biblioteca.js`: el botón llama a la pasada nueva y la cuenta en su resumen.
- `js/plazos-del-centro.js`: nuevo. Y su `<script>` en `index.html`, después de
  `js/cargar-biblioteca.js`.
- `datos-biblioteca/biblioteca-centro.json`: versión 2, los seis plazos, la tabla por tipo y los
  siete modelos.
- `js/novedades.js`: una línea («La biblioteca de hitos trae plazos legales ya puestos, y los
  plazos se pueden contar en meses»).
- `js/demo/…`: lo justo para el revisor.
- `pruebas/plazos-bien-contados.mjs`: los tres ejemplos de meses, y uno con un festivo.
- `pruebas/plazos-del-centro.mjs`: nueva. Casos: modelo sin plazo lo recibe; modelo con plazo no
  se toca; paso de «Reclamación de calificaciones» cuenta desde el de la tabla y no desde el de
  arriba; `b15` cuenta desde un paso distinto en cada una de sus dos guías; paso cuyo «desde» de
  la tabla ya no está en la guía, desde el de arriba; primer paso, sin plazo; segunda pasada, nada
  cambia; con la marca puesta no corre sola; con solo consulta no escribe; ninguna `revision`
  sube; traer un modelo con plazo a una guía lo deja contando desde el de arriba.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/HITOS-Y-GUIAS.md`
  y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que la biblioteca de hitos trae siete hitos comunes nuevos, tres de ellos por
parejas (lo que haces tú y la espera, que es la que lleva el plazo); que seis hitos que ya estaban
llevan ahora su plazo en número; que los plazos se pueden contar en meses; que al centro llega
solo, la primera vez que se abra la app, con una línea verde que lo dice; y que solo vale para los
asuntos nuevos. Y, si faltan los festivos, que sin ellos los días hábiles salen mal.

## Cómo sabemos que está bien

En la copia de demostración.

1. Al entrar sale la línea verde de plazos, con sus números. No hay errores en la consola.
2. Ajustes → El centro → biblioteca de hitos: están los siete hitos nuevos. «Esperar a que
   completen la solicitud» dice «10 días hábiles». «Esperar el plazo de recurso de alzada» dice
   «1 mes».
3. Abrir el editor de «Esperar las alegaciones» en la biblioteca: se ve el plazo (10, días
   hábiles) y el texto «desde que se termine el hito de arriba, en cada guía». Cambiarlo a 15 y
   guardar: la lista dice «15 días hábiles». Volver a dejarlo en 10.
4. Ajustes → guía de un tipo cualquiera con al menos un hito → «+ Traer de la biblioteca» →
   «Requerir que completen la solicitud», al final. Otra vez → «Esperar a que completen la
   solicitud», debajo. Sin tocar nada más, el segundo dice que su plazo es de 10 días hábiles
   desde «Requerir que completen la solicitud».
5. En una guía vacía, traer «Esperar el informe» como primer hito: llega sin plazo y sin error.
6. Guardar la guía del punto 4. Crear un asunto de ese tipo. Dar por hecho los hitos hasta
   «Requerir que completen la solicitud» incluido: el asunto pasa a «En espera», le toca al
   tercero, y la fecha límite es la de hoy más 10 días hábiles.
7. En el editor de un hito de una guía, el desplegable de cómo se cuenta lleva «Meses». Poner 1 y
   «Meses», desde otro hito: la frase se lee «1 mes», no «1 días». Guardar, volver a abrir: sigue
   en «Meses».
8. En un asunto con ese hito, dar por hecho el hito del que depende: la fecha límite es el mismo
   día del mes siguiente (o el siguiente hábil si cae en sábado, domingo o festivo).
9. En la guía de la tabla 3.1 que traiga la demostración, el hito con plazo cuenta desde el hito
   que dice la tabla.
10. Ajustes → Mantenimiento → «Cargar la biblioteca del centro»: el resumen dice cuántos plazos ha
    puesto (0 si ya estaban) y no duplica ningún hito de la biblioteca.
11. **[SOLO FRANCISCO]** En el centro, al abrir la app tras actualizarse, sale una vez la línea
    verde. En Ajustes, la guía de «Reclamación de calificaciones»: «Remitir el expediente a la
    Delegación Territorial» dice «3 días hábiles desde «Registrar la reclamación a la
    Delegación»».
