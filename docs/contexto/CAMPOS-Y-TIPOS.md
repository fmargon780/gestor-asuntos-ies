# Los campos propios y calculados de cada tipo de asunto, y la pantalla de Ajustes de un tipo

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar los campos de un tipo, o la pantalla propia de un tipo en Ajustes. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Los campos de cada tipo de asunto

Cada tipo de asunto puede llevar sus propios campos: datos ya presentes en los ficheros (unidad,
modalidad, puesto, NIF...) o creados a mano, que salen solos y ya rellenos al crear el asunto.

- **Catálogo por categoría** (`js/campos.js`, `Campos.catalogoDeCategoria`):
  - **De fichero**: la cabecera del CSV de la categoría (no `p.campos`, que solo trae columnas
    con datos). `Datos.cargarLista` (`js/datos.js`) devuelve `.cabecera` para las cuatro
    categorías.
  - **Calculados**: por ahora uno, Curso (`Campos.calcularCurso`), la unidad sin su última letra
    ni el espacio que deja al quitarla (`1ºA`→`1º`, `1ºBachA`→`1ºBach`, `2ºFPB B`→`2ºFPB`),
    aplicado sobre la forma compacta del grupo (`Nombres.grupoCompacto`).
  - **Propios**: creados en Ajustes (texto libre o lista cerrada), válidos para cualquier
    categoría; pasan por la guardia de duplicados (quinta puerta).
- **Se guarda** en `_GESTOR/campos.json`: `propios` (con su clase y valores) y `porTipo`
  (indexado como `tipos.json`), que solo guarda `origen`, `columna` o `id`, `obligatorio` y
  `enNombre` — **no** copia clase ni valores de un campo propio: quien lo pinta
  (`js/asuntos-nuevo.js`, `js/asuntos-editar.js`) lo busca en `propios` con `Campos.propioDe`,
  así un cambio en los valores se ve en todos los tipos que lo usan. Desde la fila 96 lleva
  también `porTipoDocumento` (solo si hay alguno): los campos de un tipo de DOCUMENTO para el
  nombre del fichero, otra cosa distinta (ver `docs/contexto/DOCUMENTOS.md`).
- **Configurar los campos de un tipo**: pulsando su tarjeta en Ajustes se abre su pantalla
  propia, con la sección "Campos" ya desplegada (17-sep-2026, fila 39; antes era un botón
  "Campos" que abría un cuadro aparte, `App.abrirCamposDeTipo`, retirado). Los ya puestos
  arriba (flechas para ordenar, casillas Obligatorio y Añadir al nombre, con un aviso ámbar si
  un campo propio también lo usan otros tipos), el catálogo abajo con buscador, y un botón
  propio "Guardar campos" (`App.construirSeccionCampos` en `js/ajustes-tipo.js`, misma lógica
  de siempre). Un campo nuevo del catálogo nace con las dos casillas sin marcar. Bloque "Campos
  propios" (pestaña "El centro") para verlos y borrarlos todos
  juntos; al borrar uno en uso, avisa y dice en qué tipos está (`Campos.tiposQueUsanPropio`).
- **Al crear un asunto**: bloque "Datos del asunto" con los campos del tipo ya rellenos
  (`Campos.valorInicial`); un dato vacío no es un error, sale en blanco y se puede escribir a
  mano. Obligatorio bloquea hasta rellenar. La vista previa del nombre se actualiza al escribir.
- **Al editar** (`App.pintarCamposEditar`): mismos campos con lo guardado; si cambia algo que va
  al nombre, la carpeta se renombra. El cuadro lleva la clase `cuadro-alto` (scroll interno).
- **En la ficha del asunto**: los campos con valor salen entre la descripción y el estado.
- Un tipo sin campos configurados se comporta igual que antes de esto; los asuntos creados antes
  se quedan sin campos.
- La clave de un campo es `fichero:<columna>` o `<origen>:<id>` (`Campos.claveDeCampo`).

Se comprueba con `pruebas/campos.mjs` (ocho escenarios más la edición).

### Ajustes: tres pestañas, y la pantalla propia de un tipo (17-sep-2026, fila 39,
### docs/AJUSTES-POR-TIPO.md)

Ajustes creció hasta ser inmanejable: seis cosas colgaban de un tipo de asunto (campos, pasos,
plantillas de correo, plantillas de Word, plazo, recurrencia) y cada una vivía en un bloque
distinto de una pantalla larguísima. Ahora Ajustes tiene **tres pestañas** arriba y el tipo de
asunto tiene **pantalla propia**.

**`js/ajustes.js` (marco, ~500 líneas)** se quedó solo con: las tres pestañas, la lista de tipos
de la primera y el buscador cruzado. Lo demás se repartió a tres ficheros nuevos, sin reescribir
ninguna lógica, solo moviéndola:

- **`js/ajustes-tipo.js`** — la pantalla de un tipo de asunto.
- **`js/ajustes-centro.js`** — la pestaña "El centro".
- **`js/ajustes-mantenimiento.js`** — la pestaña "Mantenimiento".

**Pestaña 1, "Tipos de asunto"** (`#ajustes-tab-tipos`): es justo lo que había antes (docs/
AJUSTES-AGIL.md, más abajo), con una sola diferencia: **pulsar la tarjeta de un tipo abre su
pantalla entera** (`App.abrirTipoDeAsunto(tipo)`), no un cuadro. La tarjeta lleva la clase
`.tarjeta-tipo-pulsable`; el clic se ignora si viene de un `input`, un `button`, la casilla de
plazo (`.plazo-tipo`) o el menú de los tres puntos, que se queda solo con Cambiar el nombre y
Quitar (la entrada "Campos" desapareció, porque los campos ya viven dentro de la pantalla del
tipo).

**La pantalla de un tipo** (`#pantalla-tipo-asunto`, registrada en `App.PANTALLAS` igual que
"asunto" o "que-me-toca": botón "← Volver" y Escape los pone solos `js/usabilidad.js`, porque su
`<header class="cabecera"><h2>` tiene la misma forma que las demás pantallas). Dos columnas
(`#tipo-asunto-col-1`/`-2`, CSS `grid-template-columns: 1fr 1fr`, una sola por debajo de 1000px),
con ocho secciones **plegadas** (fila 105: cada una es un `<details class="bloque-ajustes">` con
un resumen en el título, ver "Ajustes plegado" más abajo), construidas enteras por
`App.pintarTipoDeAsunto()`:

1. **Datos del tipo** — nombre, categoría, alias si los tiene, botón "Cambiar el nombre" que
   llama a `App.renombrarTipo` (la misma función de siempre) y repinta la pantalla si el tipo
   abierto es el que cambió. Debajo, el **nombre corto** (20-sep-2026, fila 79, apartado 4.9,
   `Nombres.tipoParaCarpeta`): lo que entra en el nombre de la carpeta de los asuntos nuevos en
   vez del nombre de arriba; vacío, se comporta como hoy. Aviso ámbar si pasa de 16 caracteres,
   rojo si otro tipo ya lo usa (`U.parecidos`). Cambiarlo no toca ninguna carpeta ya creada.
2. **Campos** — es la lógica que antes vivía en `App.pintarCuadroDeCampos`, dentro de un
   `U.preguntar`; ahora se pinta en `App.construirSeccionCampos` con el `$` global sombreado por
   uno que busca dentro de su propio `cuerpo` (la sección se pinta ANTES de colgarse del
   documento, y `document.getElementById` no ve nada suelto). El "Aceptar" del cuadro se
   sustituye por un botón propio, "Guardar campos" (`#campos-guardar`), que llama a
   `Campos.guardarConfigDeTipo`. Lo que se comparte, avisa: cada fila de un campo `propio` mira
   `Campos.tiposQueUsanPropio` y, si lo usan otros tipos, saca una línea ámbar
   (`.aviso-compartido`) con cuántos y cuáles, sin bloquear nada.
3. **Pasos del trámite** — vista de solo lectura con `Guias.vista(GuiasDelCentro.pasosDe(tipo),
   [], false)` y un botón "Escribir la guía"/"Cambiar la guía" que llama a
   `GuiasDelCentro.escribir(tipo.tipo)` (ya existía, sin tocar `js/guias-enganche.js`); al
   resolver, se repinta solo esta sección. Debajo, un aviso ámbar por cada paso que venga de la
   biblioteca de hitos y se haya quedado atrás (20-sep-2026, fila 79, apartado 4.4,
   `GuiasBiblioteca.pasosDesactualizados`), con "Ver el cambio" (ver
   `docs/contexto/HITOS-Y-GUIAS.md`).
4. **Plantillas de correo y de Séneca** — `PlantillasAjustes.pintarDeTipo(contenedor, tipo)`
   (nueva en `js/plantillas-ajustes.js`): tarjetas filtradas por `p.tipo === tipo.tipo` y un
   botón "+ Nueva plantilla" (`#tipo-plantillas-nueva`) que abre el mismo cuadro de siempre
   (`abrirCuadroDePlantilla`), con el tipo ya preseleccionado.
5. **Plantilla de documento de Word** — igual, `PlantillasDocumento.pintarDeTipo` (nueva en
   `js/plantillas-documento.js`), con el catálogo de huecos (`Plantillas.HUECOS`, botón Copiar)
   debajo de las tarjetas.
6. **Plazo** — `App.construirCasillaPlazo(tipo)`, la misma casilla que ya llevaba la tarjeta de
   la rejilla, sacada a función compartida para no duplicarla.
7. **Palabras clave** (17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md) —
   `PalabrasClaveTipo.pintarDeTipo(contenedor, tipo)`, nueva en `js/ajustes-tipo-palabras-clave.js`,
   sacada aparte del mismo modo que Plantillas o Se repite, para no engordar `js/ajustes-tipo.js`
   (429 líneas, ya por encima de las 400 antes de esta fila, mismo criterio que `js/ajustes.js` en
   la fila 39). Una sola casilla de texto (`palabrasClave` en `tipos.json`, lista de textos, vacía
   en los tipos que ya existían), palabras separadas por comas, con su propio botón "Guardar
   palabras clave" (`App.guardarTipos`, la misma función de siempre). La usa
   `js/lector-documentos.js` al proponer el tipo de un documento suelto.
8. **Se repite** — `Recurrentes.pintarEnContenedor(contenedor, tipo.tipo)` (nueva en
   `js/recurrentes.js`): solo las filas de ESE tipo, más "+ Añadir uno" que abre `alta(tipoPreset,
   alGuardar)`, con el tipo ya puesto. `filaDeRecurrente` se sacó a función propia, compartida con
   la tabla vieja (que ya no tiene sitio en el HTML, pero sigue funcionando si algo la llama).

El fichero `campos.json`/`App.E.campos` se relee justo al abrir la pantalla del tipo
(`App.abrirTipoDeAsunto`), igual que hacía el cuadro viejo.

**Pestaña 2, "El centro"** (`#ajustes-tab-centro`, `js/ajustes-centro.js`): Estados del asunto,
Tipos de documento, Campos propios, Grupos de personas, Ficheros de datos, Cómo se abrevia cada
grupo (los seis, `<details class="bloque-ajustes">` movidos tal cual desde la vieja pantalla
plana) y Datos del centro y firma (campos estáticos en `index.html`, rellenados y guardados por
`PlantillasAjustes.pintarFirmaYCentro`, que ya no construye su propio HTML). El bloque "Hitos"
(responsables y días no lectivos, `js/hitos-ajustes.js`) se cuelga aquí solo, sin tocarlo por
dentro: cambia únicamente el contenedor al que apunta (`#ajustes-tab-centro` en vez de
`#pantalla-ajustes`).

**Pestaña 3, "Mantenimiento"** (`#ajustes-tab-mantenimiento`, `js/ajustes-mantenimiento.js`):
Avisos de vencimiento, Carpetas de este ordenador, Copias de seguridad, Papelera (estáticos,
movidos tal cual) y los que se enganchan solos sin tocarlos por dentro (cambia solo el
contenedor): carpeta de la bandeja de correo (`js/bandeja-correos.js`), aviso de RegAlum.csv
viejo (`js/frescura.js`), conflictos de Dropbox (`js/conflictos.js`), duplicados descartados
(`js/unir-asuntos.js`) y fichas sin carpeta (`js/fichas-huerfanas.js`).

**Lo que ya no está**: el bloque "Guías de los tipos de asunto" (tabla `#tabla-guias`) y el
bloque "Asuntos que se repiten" (tabla `#tabla-recurrentes`) desaparecieron de Ajustes: viven
enteros dentro de la pantalla de cada tipo. `js/guias-enganche.js` y `js/recurrentes.js` siguen
teniendo esas funciones (`pintarTabla`), que ahora no encuentran su contenedor y no hacen nada
— no hacía falta tocarlas para esto.

**Las tres pestañas se recuerdan** en `localStorage` (`gestor-ajustes-pestana`,
`App.E.pestanaAjustes`, `App.cambiarPestanaAjustes(cual)`), igual que la categoría de tipos
(`gestor-ajustes-categoria`). Entrar y salir de la pantalla de un tipo no toca ninguna de las
dos: se vuelve a la lista con la misma categoría y el mismo texto de búsqueda que había.

#### Ajustes ágiles (11-sep-2026, docs/AJUSTES-AGIL.md): tipos, estados y tipos de documento

**Bloque "Tipos de asunto"** (ahora en la pestaña 1, `js/ajustes.js`, `css/ajustes.css`):

- **Una sola categoría a la vez.** `#tabla-tipos` obedece al desplegable `#nueva-categoria`, se
  recuerda en `localStorage` (`gestor-ajustes-categoria`). Estado en `App.E.categoriaAjustes`,
  se cambia con `App.cambiarCategoriaAjustes(cat)` (sincroniza desplegable y pestañas).
- **Cuatro pestañas** (`App.pintarPestanasTipos`): ALUMNADO · PERSONAL · EMPRESAS · OTROS, con
  su cuenta; pestaña y desplegable van siempre de acuerdo.
- **Buscador cruzado** (`#buscar-tipos`): con dos letras o más, `App.pintarTiposAjustes` mira
  las cuatro categorías a la vez, cada resultado con su etiqueta (`.marca-categoria`). Mientras
  se busca, las pestañas se apagan (`.apagadas`) y sale "Buscando en todas las categorías · N
  resultados" (`#tipos-buscando-info`).
- **Aviso en vivo** al escribir un nombre nuevo (`App.pintarAvisoNuevoTipo`, `oninput` de
  `#nuevo-tipo`, sobre `U.parecidos`/`U.dejaCrear`): si ya existe, línea roja "Ya existe: X, en
  CATEGORIA", botón Añadir apagado y enlace "Verlo" (`App.verTipoEnAjustes`) que cambia de
  categoría y destella la tarjeta; si solo se parece, línea ámbar con los parecidos, sin apagar
  el botón. Igual, más simple, para estados (`#aviso-nuevo-estado`) y tipos de documento
  (`#aviso-nuevo-tipo-doc`), con `App.pintarAvisoSimple`.
- **Rejilla de tarjetas**, no filas: `#tabla-tipos`, `#tabla-estados` y `#tabla-tipos-documento`
  son `.rejilla-tipos` de tarjetas `.tarjeta-tipo` (`grid-template-columns:
  repeat(auto-fill,minmax(300px,1fr))`), cada una con un menú de tres puntos
  (`App.botonMenuTarjeta`): Cambiar el nombre / Quitar (tipos y estados, que conservan sus
  flechas de orden fuera del menú), Quitar (tipos de documento). Quitar siempre pide
  confirmación.
- Ajustes sube su tope a 1600px (`#pantalla-ajustes`, `#pantalla-tipo-asunto`, `css/vista.css`);
  Nuevo asunto conserva 940px. Los párrafos de explicación no pasan de 90 caracteres
  (`max-width: 90ch`).

**Llegar a Ajustes sin bajar la página**: la barra lateral queda fija (`position:fixed`, con su
propio `overflow-y:auto`); Ajustes va en la lista de pestañas, tras "Personas y empresas",
separado por `.separador-lateral`; con la barra plegada, el icono de rueda dentada
(`#btn-barra-ajustes`, `js/barra.js`) lleva directo a Ajustes.

Se comprueba con `pruebas/ajustes-agil.mjs` (las tres pestañas, a 1905 píxeles) y
`pruebas/ajustes-por-tipo.mjs` (la pantalla de un tipo: las ocho secciones, cambiar Plazo y
Campos, volver sin perder categoría ni buscador, Escape).

### Quién encarga cada tipo (25-sep-2026, fila 134, `docs/QUIEN-ENCARGA-CADA-TIPO.md`)

Cada tipo de `tipos.json` lleva `organo`: `SECRETARIA`, `DIRECCION`, `JEFATURA`, `VARIOS` o nada
(«Sin asignar»; un valor raro se lee igual). Viaja con el tipo, así que se fusiona como el resto
de `tipos.json`. Todo vive en `js/tipos-organo.js` (`TiposOrgano`), y cada sitio llama a una
función, sin envolver nada:

- **Pantalla de un tipo**: desplegable «Quién lo encarga» en «Datos del tipo», junto a la
  categoría (`filaDeTipo`). Se guarda al cambiarlo.
- **«+ Crear tipo nuevo»** (`js/tipo-al-vuelo.js`): cuarto dato, opcional; `App.crearTipo` lo
  guarda si viene.
- **Ajustes › Tipos de asunto › «Quién encarga cada tipo»**: bloque plegado debajo de la rejilla
  (`pintarAjustes`, llamado desde `App.pintarAjustes`), una fila por tipo con su desplegable, que
  se guarda al cambiar; casilla «Solo los sin asignar»; resumen «N sin asignar».
- Cada guardado va por `App.enFila(App.FICHERO_TIPOS, App.guardarTipos)` y sobre el tipo que haya
  en memoria con ese nombre en ese momento.
- **Nuevo asunto**: la parrilla de una categoría se agrupa por órgano, con un rótulo por grupo
  (`agruparParrilla`, al final de `aplicar()` de `js/tipos-buscador.js`), sin cambiar el orden por
  uso dentro de cada uno. Si todos los de la categoría son del mismo órgano, sin rótulos.
- **Asuntos abiertos**: filtro «Lo encarga» (`#filtro-organo`, «Sin asignar» = `SIN`), con su
  etiqueta en la barra de filtros (`js/usabilidad.js`) y su marca en el botón «Filtros»
  (`js/vista.js`). **Cuentas**: ver `docs/contexto/HITOS-Y-GUIAS.md`.

### Tipos reservados (25-sep-2026, fila 135)

Un tipo puede llevar `reservado: true` en `tipos.json`: sus asuntos salen tapados en las listas, el
buscador y «Qué me toca». La casilla vive en «Datos del tipo», debajo de «Quién lo encarga»
(`Reservados.filaDeTipo`, `js/reservados.js`). Todo lo demás, en «Asuntos reservados» de
`docs/contexto/ASUNTOS.md`.

### Plazo de conservación del tipo (25-sep-2026, fila 136)

«Conservar ___ años después de archivar» (`conservarAnios` en `tipos.json`), en «Datos del tipo»,
debajo de «Reservado» (`Conservacion.filaDeTipo`, `js/conservacion.js`), con el enlace a las
tablas de valoración de la Junta. El aviso, en «El plazo de conservación» de
`docs/contexto/ASUNTOS-ARCHIVO.md`.

### Ajustes plegado (24-sep-2026, fila 105, docs/AJUSTES-PLEGADO.md)

Todo lo nuevo vive en `js/ajustes-plegado.js` (`AjustesPlegado`); `js/ajustes-tipo.js` solo llama
a `AjustesPlegado.seccion(id, titulo, pie)` desde `seccionDeTipo` y a `resumirTipo()` al terminar de
pintar y al guardar los campos; `js/ajustes-centro.js` y `js/ajustes-mantenimiento.js`, una línea
al final de su orquestador (`ordenarCentro`, `ordenarMantenimiento`).

- **Todo nace plegado**, con `<details class="bloque-ajustes">` en las tres zonas. El resumen va
  en `<span class="bloque-resumen">` detrás del título; en ámbar (`.bloque-resumen-ambar`) si hay
  un aviso dentro, para que un problema no quede escondido.
- **Se recuerda lo abierto** en `localStorage`, clave `gestor-ajustes-plegado`, `{ id: true }`. En
  un tipo, por sección (`tipo:datos`, `tipo:campos`, `tipo:pasos`, `tipo:correo`, `tipo:word`,
  `tipo:plazo`, `tipo:palabras`, `tipo:repite`), no por tipo; en las pestañas, `centro:<id>` y
  `mantenimiento:<id>`. La primera vez, todo plegado.
- **Los resúmenes** salen de lo guardado (`App.E`, `GuiasDelCentro.pasosDe`) o, si el dato vive en
  otro módulo, de lo que ese módulo pinta en el cuerpo (plantillas, recurrentes, papelera, grupos).
  Se ponen al día con un `MutationObserver` sobre los cuerpos (nunca sobre el título) y tras
  cualquier `change`/clic en la pantalla (a los 250 ms y a los 1,5 s). Los pasos desactualizados
  de la biblioteca ponen "⚠ N pasos desactualizados" en ámbar. Un bloque sin forma sencilla de
  contarse se queda solo con el título.
- **"El centro"**, en este orden: Estados, Tipos de documento, Grupos de personas, Campos propios,
  Hitos, Datos del centro y firma ("faltan N datos" en ámbar), Cómo se abrevia cada grupo, Ficheros
  de datos; el resto detrás, como estaban. Cada bloque se reconoce por lo que lleva dentro
  (`#tabla-estados`…), sin ids nuevos en `index.html`.
- **"Mantenimiento"**: conflictos de Dropbox, fichas sin carpeta, hitos huérfanos y envolturas sin
  aplicar **solo se ven con fallo** (mirando si su módulo ha pintado algo), y entonces arriba del
  todo, desplegados y en ámbar (`.bloque-con-fallo`). **Decisión**: el bloque del RegAlum.csv viejo
  (`js/frescura.js`) es también donde se configuran las épocas, así que no se esconde nunca; con
  aviso sube arriba y se abre. Para saberlo, `js/frescura.js` deja una línea: `data-aviso` en su
  bloque. Los botones sueltos (biblioteca, plantillas del centro, fichas del ARCHIVO, contacto de
  los abiertos, catálogo de formularios) van dentro de **"Herramientas"**, al final.
  `App.E.ultimaCopia` (lo apunta `App.pintarCopias`) da la fecha del resumen de Copias.

Se comprueba con `pruebas/ajustes-plegado.mjs`. Las pruebas que trabajan dentro de la pantalla de
un tipo abren antes sus secciones con esa misma clave de `localStorage`.

### Un tipo que cambia de nombre se lleva todo lo suyo (24-sep-2026, fila 126, `docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md`)

`js/tipos-nombre.js` (`window.TiposNombre`). Lo que en `_GESTOR` se guarda por el NOMBRE del tipo:
la guía (`guias.json`, clave), sus campos (`campos.json` → `porTipo`), las plantillas de correo y de
documento (`plantillas.json`, `p.tipo`) y los recurrentes (`recurrentes.json`, `r.tipo`). Formularios,
palabras, plazo y estado de partida van dentro del propio tipo y viajan solos; los hitos casan con la
guía por el `id` del paso (`origenGuia`), que se conserva.

- `TiposNombre.mover(viejo, nuevo)`: lo pasa todo, cada fichero por su cola (`App.enFila`), releyendo
  antes. Si el nombre nuevo ya tiene guía o campos: vacío, se sustituye; con contenido, se queda el
  que más tenga y el otro va a la papelera (clases `guia` y `campos-de-tipo`, que la papelera no sabe
  devolver sola). Lo usan `App.renombrarTipo` (que vive ahora en este fichero, sacado de
  `js/ajustes.js`) y `fusionarTipos` de `js/cargar-biblioteca.js` (el tipo renombrado al nombre largo).
- `TiposNombre.arreglar()`: una vez al entrar (`Gestor.alRefrescar`), junta con su tipo lo que siga
  guardado bajo su `nombreCorto` o un `alias` (salvo que otro tipo se llame así de verdad), con aviso
  verde «He juntado con su tipo la guía de "…"»; y quita las plantillas de documento repetidas (mismo
  nombre y fichero; se queda la unida a un paso de guía, la otra a la papelera, clase
  `plantilla-documento`).
- `TiposNombre.nombresDe(tipo)`: el nombre, el corto y los alias, normalizados.
  `Plantillas.deTipo` y `Plantillas.documentosDeTipo` casan por cualquiera de ellos.
- «Cargar las plantillas del centro» (ahora en `js/plantillas-centro.js`, sacado de
  `js/plantillas-documento.js`): una del índice que ya esté (mismo nombre y fichero) colgada de otro
  tipo no se duplica: se le pone el tipo del índice, salvo que sea el mismo tipo con otro nombre.
  Después quita las repetidas.

Se comprueba con `pruebas/tipos-nombre.mjs`.
