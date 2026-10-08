# Crear, editar, la ficha, "Lo pide" y duplicados de un asunto

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026).
Actualízalo al tocar la creación o edición de un asunto, su ficha (abierto), "Lo pide" o los
duplicados. **La papelera, archivar/reabrir, el índice del ARCHIVO y las fichas huérfanas se
partieron a `docs/contexto/ASUNTOS-ARCHIVO.md` en la fila 78** (este documento pasaba de los
40 KB): actualiza ese hijo al tocar cualquiera de esos temas. El índice general, las reglas de
código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### El tipo de «Cambiar el asunto», en una línea con buscador (2-oct-2026, fila 257, `docs/TIPO-EN-UNA-LINEA-AL-CAMBIAR.md`)

`#ed-tipo` es ahora un `<input type="hidden">` con el nombre del tipo; la línea con «Cambiar» (`#ed-tipo-caja`,
ids `ed-tipo-cambiar/-buscar/-resultados/-dejar/-crear`) la monta `TipoEnLinea.montar`
(`js/tipo-en-linea.js`, estado propio como el del tercero). «Cambiar» abre una caja vacía; al escribir salen
hasta 8 tipos (`BuscarOCrear.coincidencias` sobre nombre, nombre corto y alias; los más usados primero con
`App.usosDeTipos`, de `js/tipos-buscador.js`) de todas las categorías, y «y N más: sigue escribiendo». Elegir
(ratón o flechas e Intro) vuelve a la línea y llama a `refrescar`; ✕ y Esc (oyente en captura, antes que el de
`js/usabilidad.js`) dejan el que había. «Ninguno es el que busco: crear «…»» cierra este cuadro como el alta de
tercero (`pedirTipo` en `App.editarAsunto`), crea con `TipoEnLinea.crearDesdeEdicion` (parecidos, categoría del
tipo que tenía, `App.crearTipo`) y reabre con el snapshot y el tipo nuevo. En «Nuevo asunto», `App.nuevoAsuntoCon`
con `tipo` pone `App.E.nuevo.tipoEnLinea` y `App.pintarLineaDeTipo` (llamada desde `App.pintarTipos`) enseña
`#tipo-linea-nuevo` en vez del buscador y la parrilla; en blanco no cambia. El cuadro (`cuadro-editar`,
`css/tipo-en-linea.css`) es ancho, con Fecha · Grupo · Año en una fila y los campos en dos columnas.

### El tercero de «Cambiar el asunto», con buscador (29-sep-2026, fila 219, `docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md`)

`js/asuntos-editar.js` ya no deja escribir el tercero a mano (`#ed-tercero`, texto libre): el campo
es ahora `#ed-tercero-caja`, montado por `App.montarTerceroEditar` (`js/asuntos-editar-tercero.js`),
el mismo buscador de «Nuevo asunto» (`App.buscarEnCategorias`, `App.claseDeResultado`, `App.pieDe`,
`App.LISTAS_DE_CATEGORIA`, `App.textoTercero`), en todas las categorías a la vez y sin pastillas.
Al abrir, el tercero de hoy sale como «elegido» (texto tal cual, sin buscarle encaje: puede ser un
asunto antiguo que ya no aparece en ninguna lista); sin tocarlo, `piezasDelCuadro().tercero` sigue
siendo ese texto. Al elegir a alguien, el nombre de la carpeta pasa a `App.textoTercero(elegido)`
(el mismo formato que usa «Nuevo asunto»); si su categoría no es la del tipo elegido
(`Nombres.categoriaDeTipo`), un aviso ámbar junto al tipo (`#ed-aviso-categoria`) que no bloquea
guardar. Con Administraciones, el desplegable de departamento (`AdministracionesFicha.htmlDepartamento`/
`organismoDePersona`, ya no solo `htmlEditar`/`leerEditar` del asunto) se rehace para el organismo
recién elegido, o desaparece si ya no toca; al guardar, `ficha.contacto` (`Datos.fotoDeContacto`) y
`ficha.departamento` se ponen al día igual que al crear, solo si el tercero ha cambiado de verdad.

**«Dar de alta» desde este buscador no abre un segundo `U.preguntar`**: el cuadro «Cambiar el
asunto» ya es uno (`U.preguntar` solo deja uno pendiente a la vez, `cuadroEsperando` en
`js/util.js`; abrir otro dentro le roba la respuesta al de fuera, viendo cómo ya evita esto
`Relacionados.elegirTercero` en `js/relacionados.js`, cerrando su propio buscador antes de llamar a
`App.cuadroDeTercero`). Aquí, en vez de eso, `App.editarAsunto` es un bucle sobre
`abrirCuadroDeEdicion(a, p, base)`: un botón de alta llama a `alPedirAlta(categoria, texto)`, que
guarda un snapshot de todo lo tocado (fecha, tipo, curso, grupo, descripción, campos, tercero
elegido) y pulsa el propio «Cancelar» del cuadro (ordenado, sin robar nada); con el camino ya libre,
`App.editarAsunto` llama a `App.altaTercero(categoria, texto, alDarDeAlta)` (ahora con un tercer
parámetro opcional, sin tocar su comportamiento de siempre en «Nuevo asunto» ni en Personas) y
vuelve a abrir el mismo cuadro con el snapshot, más la persona recién creada ya elegida. Nunca toca
`App.E.nuevo` ni `#buscar-tercero`/`#resultados-tercero` (los de «Nuevo asunto» siguen en blanco).

Se comprueba con `pruebas/tercero-con-buscador-al-cambiar.mjs`.

### Las listas de la ficha se funden por elemento, y un asunto cerrado lleva lápida (26-sep-2026, fila 176, `docs/DATOS-ENTRE-ORDENADORES.md`)

`App.anotar` (todo el objeto, campo a campo) sigue para los datos sueltos, pero las LISTAS de la
ficha (`hilos`, `relacionados`, `pendientesRegistro`, `notas`) se guardan con **`App.anotarLista(clave,
campo, { anadir, quitar, identidad })`** (`js/nucleo.js`): relee `asuntos.json` dentro de la propia
cola de guardado y funde `anadir`/`quitar` sobre la lista del disco, nunca sobre una lista calculada
en memoria de antes. `identidad` (por defecto, `App.IDENTIDAD_LISTA[campo]`: `notas` por
`cuando+texto`, `hilos` por `id`, `relacionados` por `categoria+nombre`, `pendientesRegistro` por el
propio nombre de fichero) decide cuándo dos elementos son el mismo: un `anadir` con la misma
identidad que uno ya existente lo SUSTITUYE (así sirve también para "sustituir esta nota concreta",
`js/notas.js`, `sustituirNota`), no lo duplica. `App.unirPorIdentidad(a, b, identidad)` es la unión
pura que usan tanto `anotarLista` como `js/conflictos.js` (`fusionarFicha`) para no duplicar la
lógica. Lo usan `js/correo-cuadro.js`, `js/bandeja-huella.js`, `js/relacionados.js`, `js/registro.js`,
`js/documentos-guardar.js` y `js/notas.js`; `opciones.extra` mete además algún campo suelto (`notaEl`,
`notaPor`) en la misma pasada.

**Lápidas**: archivar, mandar a la papelera, unir dos asuntos o renombrar uno borran la clave vieja
de `asuntos.json` y, en la MISMA operación de la cola, apuntan una lápida en
`_GESTOR/borrados-listas.json` (`Borrados.marcar(gestor, 'asuntos', clave, motivo)`, `motivo`:
`'archivado'`, `'papelera'`, `'unido'` o `'renombrado'`) — en `js/ficha-archivo.js`, `js/papelera.js`,
`js/unir-asuntos-unir.js` y `js/asunto-renombrar.js`. Con una lápida puesta, `App.anotar` y
`App.anotarLista` no crean nada: lanzan un error `AsuntoCerrado` («Este asunto ya está archivado en
el otro ordenador. Recarga la lista.»), en vez de resucitar una ficha vacía si el otro ordenador
escribe algo justo antes de enterarse. Un alta explícita gana siempre: reabrir, devolver de la
papelera o enlazar una ficha huérfana llaman a `Borrados.revivir(gestor, 'asuntos', clave)` ANTES de
volver a escribir esa clave. La fusión de una copia en conflicto de `asuntos.json`/`hitos.json`
(`js/conflictos.js`) también respeta las lápidas: una clave con lápida no entra, esté en el lado que
esté. Las lápidas caducan a los 90 días con la misma limpieza de Mantenimiento que las demás listas
de `borrados-listas.json` (`js/borrados-fusion.js`).

**El vistazo de 20 s también relee `asuntos.json`/`hitos.json`** si han cambiado por fuera (nueva
fecha de modificación, `Carpetas.fechaFichero`) y no hay un guardado en marcha: `js/vistazo-registro.js`
(nuevo), envolviendo `App.mirarLaCarpeta`. Antes solo se releían al entrar y en cada guardado propio;
en una sesión larga se acababa viendo (y decidiendo con) un estado viejo aunque no llegara ningún
documento ni carpeta nueva.

Se comprueba con `pruebas/datos-entre-ordenadores.mjs` (sin navegador).

### Crear un tipo sin salir de Nuevo asunto (24-sep-2026, fila 128)

`js/tipo-al-vuelo.js` (`docs/TIPO-DESDE-EL-ASUNTO.md`). Cambia una decisión de siempre: los
tipos de asunto ya no se crean solo en Ajustes. En Nuevo asunto, junto al buscador de tipos
(`js/tipos-buscador.js`), un botón **«+ Crear tipo nuevo»**:

- **Destacado, justo debajo del buscador**, mientras el buscador tenga texto escrito (no solo
  sin resultados: puede haber parecidos que no valgan). **Discreto, al final de la parrilla**,
  con el buscador vacío. `TipoAlVuelo.repintar()` decide y mueve siempre el mismo nodo; se llama
  desde `js/tipos-buscador.js`, al final de su `aplicar()` (escribir en el buscador solo llama a
  `aplicar()`, no a `App.pintarTipos` entero), no envuelve nada.
- Abre un panel con tres datos —Nombre (relleno con lo escrito, en mayúsculas), Nombre corto
  (opcional) y Categoría (la elegida)—, **dentro de la misma pantalla**, nunca un segundo `#capa`.
  Escape lo cierra a él, no Nuevo asunto (mismo cuidado que `js/huecos-buscador.js`: un
  `keydown` propio en captura, con `stopPropagation`).
- Guarda con `App.crearTipo` (`js/ajustes.js`), la misma función que usa «Añadir» en Ajustes, tras
  la misma guardia `U.dejaCrear`. Un nombre ya existente no se duplica: se avisa y se ofrece
  «Usar este», que deja elegido el que ya había.
- Deja el tipo elegido con `App.marcarTipoElegido` (`js/asuntos-nuevo.js`), no con
  `App.elegirTipo`: a diferencia de éste, no toca el tercero ni lo ya escrito (descripción,
  campos), por si se está reconsiderando el tipo con el formulario ya avanzado. Sin tercero
  elegido, deja como filtro del buscador la categoría del tipo nuevo (fila 197); con tercero, no
  toca el filtro (ya es el de su categoría).

Se comprueba con `pruebas/tipo-desde-el-asunto.mjs`.

### Nuevo asunto, sin repetir nada (26-sep-2026, fila 173, docs/NUEVO-ASUNTO-SIN-REPETIR.md)

`App.nuevoAsuntoCon({ tercero, tipo, fecha, descripcion, viaInicial })` (`js/asuntos-nuevo.js`),
todo opcional: lleva a Nuevo asunto (`App.ir('nuevo')`) con lo que ya se sabe, sin volver a
pedirlo. Elige la categoría del tercero (o, sin tercero, la del tipo). Con tipo, lo elige
(`App.elegirTipo`) y fija el tercero, sin pulsar Crear. Sin tipo, guarda el tercero en
`App.E.nuevo.terceroPropuesto` y `App.pintarTipos` enseña, encima de la parrilla
(`#tercero-propuesto-nuevo`), «Para: **Nombre** · Elige el tipo de asunto» con un botón «Otra
persona» que lo olvida; al elegir tipo, si la categoría coincide, `App.elegirTipo` lo fija solo.
`App.crearAsuntoConPropuesta` (el de "Ha llegado"/"Ver todo", antes "Por clasificar") pasa a usar esta función por dentro y
luego pulsa Crear, igual que antes. `viaInicial` (`{via, viaDato}`) llega hasta "Lo pide" (ver
más abajo); lo usa `js/bandeja-propuesta.js` para que un asunto que viene de un correo siga
entrando con "Correo electrónico" y la dirección del remitente.

- **Cambiar de tipo no borra el tercero** (`App.elegirTipo`): con persona elegida, la parrilla
  solo enseña los tipos de su categoría (ver más abajo, fila 197), así que un tipo nuevo SIEMPRE
  es de la misma categoría, y `App.fijarTercero` se vuelve a llamar para que los campos del tipo
  nuevo se rellenen con sus datos; nunca se borra por su cuenta (si `App.fijarTercero` se llama con
  una persona de otra categoría, esa función es la que suelta el tipo si ya no vale, no
  `elegirTipo`).
- **Dar de alta a un tercero lo deja elegido** (`App.altaTercero`, `js/asuntos-nuevo-alta.js`): en
  vez de relanzar la búsqueda, se llama a `App.fijarTercero` con el recién creado (el que devuelve
  `Datos.anadirALista`, o el que ya trae el alta propia de una categoría como Administraciones);
  si no se encuentra, se cae al camino de siempre (buscar y esperar el clic).

Se comprueba con `pruebas/nuevo-asunto-sin-repetir.mjs`.

### Nuevo asunto empieza por la persona (27-sep-2026, fila 197, `docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md`)

Rediseño de la pantalla, sustituyendo el camino «categoría → tipo → tercero» de las filas
anteriores: **dos bloques a la vista a la vez**, `#bloque-tercero` (izquierda, «Con quién es el
asunto») y `#bloque-tipos` (derecha, «Qué tipo de asunto»), uno al lado del otro en pantalla
ancha (`.nuevo-dos-bloques`, 3fr/2fr: el de la persona necesita más ancho para que el botón de
copiar el Nº de identificación escolar no quede en el centro de la tarjeta) y apilados por debajo
de 900 px; debajo de los dos, a todo el ancho, `#bloque-detalles`. Se rellenan en el orden que se
quiera; ninguno de los tres bloques se esconde nunca (fila 215, `docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md`:
`#bloque-detalles` tampoco, para que «Crear el asunto» esté siempre a la vista; detalle más abajo).
Dentro de `#bloque-tercero`, de arriba abajo: las pastillas de categoría (`#categorias-lista`), el
buscador único justo debajo (`#buscar-tercero`) y sus resultados.

- **El buscador único** (`App.buscarTercero`, `js/asuntos-nuevo.js`): busca en TODAS las
  categorías a la vez (o solo en la que esté marcada como filtro, `App.E.nuevo.categoria`), con
  `App.buscarEnCategorias(texto, categorias, tope)` (`js/asuntos-nuevo-alta.js`), que carga cada
  categoría con `Datos.cargar` y filtra con `Datos.buscar`, una por una — sin tocar
  `App.pintarBuscadorDeTercero`, el buscador reutilizable de siempre (`js/relacionados.js`, los
  grupos), que sigue siendo categoría-primero para esos usos. En ALUMNADO, matriculados y
  solicitantes antes que los antiguos (mismo criterio que `js/personas-familias.js` en Personas).
  Cada resultado lleva su categoría detrás del nombre (`.resultado-categoria`, nunca `float`: eso
  cambiaría el alto de la tarjeta y con él el punto donde cae un clic sin más precisión); el botón
  de copiar el Nº de identificación escolar se flota a la derecha solo dentro de este buscador
  (`#resultados-tercero .boton-nie-chico`), lejos de ese mismo centro.
- **Las pastillas de categoría ya no eligen antes de nada**: son un filtro (`App.elegirCategoria(cat)`
  fija o suelta `App.E.nuevo.categoria`; nunca toca tipo ni tercero por su cuenta). Pulsar una
  filtra a la vez el buscador y la parrilla de tipos (fila 215: el `onclick` de la pastilla llama
  también a `App.pintarTipos()`, no solo a `App.buscarTercero()`) y deja el cursor en el buscador
  de personas, justo debajo. «+ Dar de alta»: con un filtro puesto, el botón de siempre
  (`App.botonAlta`); sin filtro, un botón por cada categoría que admita alta (`App.botonesAlta`,
  `js/asuntos-nuevo-alta.js`) — es la manera de «pedir la categoría» que pide el documento, sin un
  segundo cuadro. **La pastilla que se pulsa manda siempre** (fila 220,
  `docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md`): el `onclick` de verdad es
  `App.pulsarCategoriaNuevo(cat)`, que antes de fijar la categoría olvida cualquier tercero, tercero
  propuesto o tipo de OTRA categoría (igual que `App.fijarTercero` olvida un tipo que ya no encaja).
  Antes, con un tercero ya elegido de otra categoría, pulsar la pastilla no cambiaba nada visible
  (`categoriaDeLaParrilla()` daba prioridad al tercero) y parecía que el botón no hacía nada.
- **La parrilla de tipos** (`App.pintarTipos`, con `categoriaDeLaParrilla()` interna): la
  categoría que la limita sale, por este orden (fila 215), de la persona elegida
  (`App.E.nuevo.tercero`), si no de la propuesta y esperando tipo (`App.E.nuevo.terceroPropuesto`,
  fila 173), si no de la pastilla pulsada (`App.E.nuevo.categoria`), y si no hay nada de eso, null
  (todos los tipos); ese orden sigue igual, pero desde la fila 220 `App.pulsarCategoriaNuevo` limpia
  antes lo que no encaje con la pastilla pulsada, así que en la práctica la pastilla gana siempre.
  Con categoría, solo los suyos; sin ella, todos, cada botón con la suya en un
  `<small aria-hidden="true">` (el nombre accesible del botón, el que usan `getByRole`/`exact` en
  las pruebas y "+ Crear tipo nuevo", sigue siendo solo el tipo; `data-tipo` en el propio botón es
  el nombre de verdad para quien lo lee del DOM: `js/tipos-buscador.js` y `js/tipos-organo.js`).
  **La lista es siempre corta** (fila 215, `js/tipos-buscador.js`): los 8 más usados —con o sin
  categoría— y un enlace «Ver todos (N)» que despliega el resto, agrupado por órgano igual que
  hoy, y se vuelve a plegar; antes (fila 197), sin categoría se enseñaban todos sin tope. Elegir un
  tipo sin persona deja el buscador filtrado a esa categoría (`App.elegirTipo` llama a
  `App.elegirCategoria`): el camino «tipo primero» sigue existiendo entero.
- **El resumen de la guía, en una línea** (`Guias.resumenDeTipo`, `js/guias-vista.js`; lo pinta y
  lo pliega/despliega `js/guias-enganche.js`, `pintarGuiaNuevo`): «N hitos · N documentos · plazo
  de N días · lo encarga X», o «Sin guía: el asunto se crea sin hitos» sin guía. Pulsable: abre y
  cierra `#guia-nuevo` (el mismo bloque que antes vivía siempre desplegado al fondo del
  formulario, ahora movido arriba de la parrilla y plegado de partida).
- **Al fijar el tercero** (`App.fijarTercero`, `js/asuntos-nuevo-campos.js`) se deja su categoría
  como filtro del buscador y se repinta la parrilla; un tipo ya elegido de otra categoría se
  suelta (nunca un asunto a medio montar con tipo y categoría distintas).
- **«Crear el asunto» está siempre a la vista** (fila 215; `App.refrescarVista`,
  `js/asuntos-nuevo-crear.js`): `#bloque-detalles` ya no se esconde mientras falte algo (antes,
  fila 197, solo aparecía al fijar el tercero). Sin tipo o sin tercero el botón está en gris y dice
  qué falta («Falta elegir la persona», «Falta elegir el tipo de asunto» o los dos); con las dos
  cosas, se activa y dice «Crear el asunto».
- **Tras crear, si el tipo tiene guía, se entra directo en la mesa del primer hito**
  (`App.crearAsuntoDelFormulario`): mismo camino que "Qué me toca"
  (`HitosPanel.desplegarAlAbrir` + `FichaTarjetas.abrirAlEntrar('hitos')` antes de
  `Navegacion.abrirAbierto`), con el primer hito que `App.anotar` ya ha creado (envoltura de
  `js/hitos.js`) en el momento de guardar la ficha. Sin guía, la ficha, como hasta ahora (fila
  119). La mesa de un hito se recuerda por asunto (`js/hito-mesa.js`) y no se cierra sola con un
  repintado: quien reabra ese mismo asunto más tarde para trabajar con la lista de hitos, no la
  mesa, tiene que cerrarla con «← Volver a los hitos» (`.mesa-volver`).

Se comprueba con `pruebas/nuevo-asunto-persona-primero.mjs`, y con las pruebas viejas de este
formulario puestas al día para el camino nuevo (`nuevo-asunto-sin-repetir.mjs`,
`tipo-desde-el-asunto.mjs`, `quien-encarga-cada-tipo.mjs`, `navegador.mjs`, `hitos.mjs`…). Lo de la
fila 215 (pastilla que también filtra los tipos, lista corta con «Ver todos» con o sin categoría, y
el botón siempre a la vista), en `pruebas/nuevo-asunto-categoria-guia.mjs`.

### El mismo formulario, preparado desde cero, desde todos los sitios (28-sep-2026, fila 220, `docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md`)

Tras la fila 215, Francisco veía el formulario «unas veces sí y otras no» con lo nuevo, según por
dónde entrara, y a veces «Crear el asunto» se quedaba sin poderse pulsar sin decir por qué. La causa
real: `App.prepararNuevo` (lo único que corre en cada `App.ir('nuevo')`, el único camino a esta
pantalla, directo o dentro de `App.nuevoAsuntoCon`/`App.crearAsuntoConPropuesta`) solo repintaba,
sin limpiar `App.E.nuevo` ni los campos del formulario: lo que quedara de la visita anterior (otro
tipo, otro tercero, otros campos propios, una descripción larga escrita a mano…) seguía ahí,
mezclándose con lo que trajera la entrada nueva. Con una descripción larga heredada, el nombre de
la carpeta podía dejar de caber en la ruta de Dropbox (aviso rojo de la fila 130/177) y el botón se
quedaba en gris sin que se notara por qué: eso es lo que se veía como «se bloquea».

- **Las entradas a «Nuevo asunto»** (comprobado con `grep` de `App.ir('nuevo')`, `App.nuevoAsuntoCon`
  y `App.prepararNuevo`; todas pasan por `App.ir('nuevo')`, así que ninguna necesita cambiar su
  propio camino): el botón de la barra (`js/barra.js`, `#btn-nuevo-asunto`); la pestaña de siempre
  (`.pestana[data-pantalla="nuevo"]`); una nota del tablón, «A asunto» (`js/tablon-compacto.js`,
  `pasarAAsunto`); «+ Nuevo asunto para esta persona» (`js/archivo-personas.js`); un documento
  suelto, «Crear asunto con él» (`js/documentos-sueltos.js`, `App.empezarAsuntoCon`, y
  `App.crearAsuntoConPropuesta` cuando ya trae tipo y tercero reconocidos); y la propuesta de la
  bandeja de correos (`js/bandeja-propuesta.js`, `llevarANuevo`).
- **`App.prepararNuevo` prepara el formulario de verdad, desde cero, cada vez**: `App.E.nuevo` se
  sustituye entero por `App.nuevoEnBlanco()` (la misma forma en blanco que usa
  `App.crearAsuntoDelFormulario` al terminar, un solo sitio para esa forma) y se vacían a mano
  `#buscar-tercero`, `#resultados-tercero`, `#tercero-elegido`, `#campo-curso`,
  `#campo-descripcion`, `#campo-limite`, `#campo-grupo`, `#bloque-campos`/`#campos-lista-nuevo`,
  `#lopide-caja-nuevo` y el resumen de la guía (`#guia-resumen-nuevo`/`#guia-nuevo`, que solo se
  repinta solo con un clic de verdad sobre un tipo, `js/guias-enganche.js`); `#campo-fecha` vuelve a
  hoy. Lo único que **no** se toca es `App.E.pendiente` (el documento suelto que viaja con el
  asunto): quien lo trae lo deja puesto ANTES de llamar a `App.ir('nuevo')`, y así sigue.
- **La pastilla de categoría manda siempre** sobre lo que hubiera antes (detalle más arriba,
  `App.pulsarCategoriaNuevo`).
- **Un aviso pendiente de otra visita no puede colarse tarde**: `App.E.nuevoVisita` (en `App.E`,
  `js/nucleo.js`) sube uno cada vez que `App.prepararNuevo` corre. La lectura del PDF de un adjunto
  de correo (`js/bandeja-adjuntos-lector.js`) puede terminar después de que el usuario ya se haya
  ido a otra cosa (o vuelto a entrar para OTRO asunto): antes de tocar el formulario, comprueba que
  `App.E.nuevoVisita` sigue siendo el mismo de cuando empezó a leer; si no, no hace nada.

Se comprueba con `pruebas/crear-asunto-desde-todos-los-sitios.mjs` (recorre las entradas de la
lista de arriba, alternando entre ellas, dejando cada vez el formulario "sucio" antes de la
siguiente) y con `pruebas/duplicados.mjs` puesta al día (fila 163: volver a «Nuevo asunto» desde la
ficha de un posible duplicado ya no conserva lo escrito, a propósito — es la misma preparación
desde cero que pide esta fila, sin excepción para esa pantalla).

### La ficha de un asunto

Al pulsar el nombre de un asunto se entra en su ficha: sus datos, el contacto del tercero, la
guía de su tipo con las casillas, sus notas, sus documentos y los demás asuntos del mismo
tercero.

**La tarjeta de la lista se queda con lo justo**: la marca del hito actual (fila 129, pulsable a
su mesa, `docs/contexto/ESTADO-DEL-ASUNTO.md`), "Copiar nombre" y "Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una lista blanca
(`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la tarjeta con
`window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.

**Guardar un documento nunca echa de la ficha a la lista** (fila 30, 17-sep-2026,
`docs/QUEDARSE-EN-EL-ASUNTO.md`). `App.verAbiertos` (`js/asuntos-lista.js`) relee la carpeta
entera y crea asuntos nuevos cada vez que se llama, y se llama sola —`App.mirarLaCarpeta`, cada
`App.SEGUNDOS_ENTRE_MIRADAS`— sin que la ficha lo sepa: sin este arreglo, el asunto que tenía la
ficha en la mano se quedaba con un objeto viejo, y la lista de documentos no se refrescaba sola.
`js/ficha-asunto.js` envuelve `App.verAbiertos` (mismo patrón que las demás envolturas de este
fichero) para, cada vez que se llama, reenganchar sola el asunto que tenga la ficha abierta —por
su nombre, en la lista fresca— y repintarla en su sitio, con dos funciones públicas:

- `App.fichaAbierta()` — el nombre del asunto que se ve de verdad en pantalla (comprueba que
  `#pantalla-asunto` no esté oculta, no solo que `actual` siga puesto: si se ha cambiado de
  pestaña sin pulsar "Volver", `actual` se queda con el asunto pero ya no hay ficha que reenganchar).
- `App.reengancharFicha()` — la reenganche de verdad: si el asunto sigue en `App.E.listaAbiertos`,
  lo vuelve a coger de ahí y repinta; si ya no está (se ha archivado o borrado desde el otro
  ordenador), entonces sí vuelve a la lista, con un aviso de una línea. Solo actúa con la ficha de
  verdad visible y con un asunto **abierto**: el ARCHIVO no lo vigila `App.mirarLaCarpeta`.

**Repintar solo si algo ha cambiado de verdad** (fila 34, 17-sep-2026,
`docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`). Bastaba con que el compañero dejara un papel suelto en
la carpeta (fila 191: se ve en "Ha llegado", de Inicio) para que `App.reengancharFicha()` rehiciera la ficha entera con `innerHTML`,
tirando por el camino cualquier nota a medio escribir. Ahora compara una huella de texto del
asunto, partida en dos mitades —ficha e hitos—: si las dos son iguales, la pantalla se deja
quieta; si solo cambian los hitos, le pide el repintado al panel de hitos en vez de rehacer la
ficha entera. Y un asunto pasa a ser **un solo objeto** en toda la aplicación: los datos frescos
se meten dentro del objeto que la ficha ya tiene en la mano (antes, con la pantalla quieta, los
botones ya pintados se quedaban con el objeto viejo, y "Archivar el asunto" volvía a preguntar
"¿Dónde va esta carpeta?" con la categoría ya puesta). Tanto `pintar()`/`pintarNotas()` de
`js/ficha-asunto.js` como el repintado entero de `js/hitos-panel.js` pasan por
`U.conservandoLoEscrito` (ver "Avisos técnicos"), para que una nota a medio escribir, el foco y
el cursor sobrevivan a un repintado que sí haga falta. Límite conocido: si la ficha entera se
repinta de verdad mientras se escribe la nota de un hito, esa nota puede perderse (el panel de
hitos se repinta un instante después, de forma asíncrona); la nota del asunto no tiene ese
problema. Se comprueba con `pruebas/notas-asunto-no-se-borran.mjs`.

**De la ficha de un asunto solo se sale en cuatro casos** (fila 93, 23-sep-2026,
`docs/QUEDARSE-EN-EL-ASUNTO-SIEMPRE.md`): Volver o Escape, Editar (aunque se cancele el cuadro:
`js/ficha-nombre-acciones.js` llama a `App.volverALaLista()` después de `App.editarAsunto(a)`
pase lo que pase), Archivar/Reabrir y Borrar; y un quinto que no es una acción de Francisco: el
asunto ha dejado de estar abierto desde el otro ordenador (el aviso de `App.reengancharFicha()`,
más arriba). Cualquier otra cosa se queda en su sitio, porque `App.verAbiertos` (que ya reengancha
sola la ficha, más arriba) o `App.abrirFicha(a, modo)` bastan para repintar sin navegar a ninguna
otra pantalla: guardar o registrar un documento, generar uno desde plantilla, separar/unir/sacar
páginas de un PDF, marcar un hito, asociar un documento a un hito desde el propio documento
(`js/ficha-documentos.js`, "Asociar a un hito") o apuntarlo desde el propio hito
(`js/hitos-documentos.js`, "Apuntar un documento"), "Comunicar", «+ Añadir documento» y «Cambiar el nombre» de la lista de documentos, y "Guardar en un
asunto"/"Guardar aquí" de "Ha llegado" y "Ver todo" (antes "Por clasificar"; fila 191, `js/documentos-sueltos.js`,
`js/documentos-sueltos-lector.js`) — estos dos últimos, además, viven siempre en Inicio, nunca
dentro de la ficha, así que no pueden sacar de ella; y cuando el asunto de
destino es el que antes tenía la ficha abierta, `App.reengancharFicha()` no la vuelve a enseñar,
porque comprueba primero si la ficha sigue **a la vista** (`#pantalla-asunto` sin `oculto`), no
solo si `actual` sigue puesto. Repaso completo de todo `js/` en busca de una salida indebida
(fila 93): no se encontró ninguna, la regla ya se cumplía entera desde las filas 30, 34, 51, 52 y
58. Se comprueba con `pruebas/quedarse-en-el-asunto.mjs` (quince casos: los once que se quedan y
los cuatro que salen, más el quinto del otro ordenador).

**La disposición de la ficha** (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md): cambio de
disposición, ningún funcionamiento distinto. La regla: arriba a la izquierda lo que hay que
hacer, arriba a la derecha lo que hay que saber, lo que casi nunca se mira plegado con su número
al lado.

- **La línea gris de la cabecera** (`.ficha-subtitulo`, dentro de `<header class="ficha-cabecera">`;
  desde la fila 112, en `.ficha-apertura`, a la derecha de la segunda línea): `subtituloDeFicha(a)` en `js/ficha-asunto.js` junta,
  separados por ` · `, lo que no se repite en ningún otro sitio de la pantalla — Abierto el
  (`U.fechaLegible(a.leido.fecha)`), Categoría, Año académico, Descripción y Lo abrió—; lo vacío no
  deja ni el separador ni un hueco. Se esconde entera con la cabecera encogida
  (`.ficha-cabecera.encogida .ficha-apertura { display: none; }`, `css/ficha-asunto.css`).
- **Tarjetas** (24-sep-2026, fila 107, `docs/FICHA-EN-TARJETAS.md`; antes, tres columnas y dos
  plegables, `js/ficha-plegables.js`, retirado): ver "La ficha en tarjetas", más abajo.
- **"Datos del asunto" se desmonta y pasa a llamarse "Datos del trámite"**: `datosDelAsunto(a)`
  (ya no lleva `p`, la fecha límite se quitó) solo deja los campos propios del tipo
  (`filasDeCampos`), Vía de comunicación, Lo pide y En el archivo — el resto ya se ve en la
  cabecera, en sus marcas o en "Datos y contacto". **Sin ninguna fila, devuelve `null` y el bloque
  entero no se pinta**, ni el título ni la tarjeta (antes `filas()` pintaba "Nada que enseñar
  aquí."; `filasHtml()`, nueva, es la parte de `filas()` que solo dibuja, reutilizada aquí y por
  `filas()` para los sitios que sí quieren ese aviso).
- `js/ficha-documentos.js` sigue poniendo `.vacio` a su bloque con la carpeta vacía; en una
  tarjeta (`.ficha-tarjeta.vacio`) ya no encoge nada: la tarjeta tiene el tamaño de las demás.
- Se comprueba con `pruebas/ficha-disposicion.mjs` (el orden de las tarjetas, la línea gris,
  "Datos del trámite" con y sin campos propios, los resúmenes de "Otros asuntos" y "Personas", que
  un repintado no cierra la tarjeta abierta y las columnas según el ancho).

### La ficha en tarjetas (24-sep-2026, fila 107, docs/FICHA-EN-TARJETAS.md)

`js/ficha-tarjetas.js` (`window.FichaTarjetas`) y `css/ficha-tarjetas.css`. `js/ficha-asunto.js`
solo monta el HTML con `FichaTarjetas.html(tramite)` y avisa con `FichaTarjetas.alEntrar()` (en
`App.abrirFicha`, antes de pintar) y `FichaTarjetas.alPintar(caja, a)` (al final de
`pintarLaFicha`): puntos previstos, nada se envuelve. Los huecos de dentro (`#ficha-guia`,
`#ficha-documentos`, `#ficha-contacto-caja`, `#ficha-notas`, `#ficha-otros`, `#ficha-relacionados`,
Datos del trámite) son los de siempre, y los sigue pintando el mismo módulo.

- **Cuadrícula**: `.ficha-tarjetas-rejilla`, 3 columnas × 2 filas (4 con "Datos del trámite"), dos
  por debajo de 1100px o con el visor/lector abierto. Todas del mismo tamaño; `ajustarAlto()` les
  da el alto que queda hasta abajo de la ventana (sin desplazarse), al pintar, al cambiar de tamaño
  y al abrir o cerrar el documento de la derecha. Lo que no cabe se corta.
- **Resúmenes** de la tarjeta cerrada (`.ficha-tarjeta-resumen`), sacados de lo que cada módulo
  ya pinta dentro (su cuerpo sigue en el DOM, oculto), con un `MutationObserver` que ignora lo que
  pinta este fichero: Hitos ("N de M hechos" y el siguiente, con su plazo), Documentos (cuántos y
  sus nombres, que se abren en el panel de la derecha sin abrir la tarjeta), Notas (la última:
  quién, cuándo, el texto; de `App.E.registro`), Otros asuntos (la cuenta de verdad en
  `#ficha-otros[data-cuenta]`, que pone `js/otros-del-tercero.js`) y Personas. "Datos y contacto"
  y "Datos del trámite" (`.ficha-tarjeta-siempre`) enseñan su propio cuerpo, que ya es un resumen.
  Sin contenido: "ninguno todavía", en gris.
- **Documentos, legibles** (24-sep-2026, fila 114, `docs/DOCUMENTOS-EN-LA-TARJETA.md`): los
  resúmenes viven en `js/ficha-tarjetas-resumen.js` (`FichaTarjetasResumen.crear`, sacado de
  `js/ficha-tarjetas.js`). Cada renglón lleva `title` con su texto y `flex: none` (antes se
  aplastaban unos encima de otros). Documentos ya no dice «N documentos» (va en el círculo): como
  mucho 5 nombres, o los que quepan enteros (`medir()`, que llama `ajustarAlto()`: alto de la caja
  entre el de un renglón), y «y N más» (`.ficha-resumen-mas`), que abre la tarjeta en grande.
- **Abrir en grande**: pulsar la tarjeta (menos en un botón, enlace o campo). `data-abierta` en
  `#ficha-tarjetas`; las demás pasan a pestañas (`#ficha-tarjetas-pestanas`, con su cuenta). Desde
  la fila 112 no hay "← Volver a las tarjetas": se vuelve pulsando otra vez la pestaña abierta
  (`title` "Volver a las tarjetas"); en Hitos con un hito abierto, primero a la lista
  (`HitoMesa.cerrarSiAbierta()`). **Escape** (`js/usabilidad.js`, `FichaTarjetas.cerrarSiAbierta()`,
  después de cerrar el visor si estaba) vuelve a la cuadrícula; el siguiente, lo de siempre.
- **Franja de documentos** (`.ficha-tarjeta-franja`) en la tarjeta abierta, menos Documentos: chips
  que pulsan por debajo el mismo `button.ficha-documento` de la lista (sin repintar). En Hitos, los
  del hito desplegado (`.hito-cuerpo` visible → sus `.hito-documento[data-doc]`); si no hay, todos.
  El chip del documento a la vista (`Visor.nombreAbierto()`, nuevo), marcado.
- **Qué se recuerda**: al entrar, siempre la cuadrícula; desde la pestaña "En Administración" de
  Inicio (fila 209; antes "Me toca"/"Qué me toca"), `FichaTarjetas.abrirAlEntrar('hitos')` antes
  de `App.abrirFicha`. Un repintado de la misma ficha
  mantiene la tarjeta abierta (el estado vive en el módulo) y `U.conservandoLoEscrito` lo escrito.
- En modo consulta, las pestañas, los chips y los nombres del resumen siguen activos
  (`esControlDeSoloLectura`).
- Se comprueba con `pruebas/ficha-en-tarjetas.mjs` (a 1905×1000 y 1280×800). Las pruebas que
  trabajan dentro de la ficha entran con su tarjeta ya abierta (`window.__tarjeta`) o la abren con
  `FichaTarjetas.abrir(id)`.

**La cabecera de la ficha, agrupada por el trámite** (18-sep-2026, fila 52,
docs/CABECERA-DEL-ASUNTO.md): cambio de disposición y de agrupación, ninguna acción desaparece ni
cambia lo que hace. Va después de la fila 51 (da por hecha `.ficha-subtitulo`).

- **Datos del tercero junto al nombre** (6-oct-2026, fila 272, `docs/DATOS-FAVORITOS-EN-LA-FICHA.md`):
  en `.ficha-linea1`, detrás del nombre (que ya no crece), `#ficha-favoritos` con hasta 3 datos de la
  persona o empresa («Unidad: 2º B», separados por « · ») y el botón «Elegir datos» (`#fav-elegir`,
  `js/ficha-datos-favoritos.js`; la parte sin pantalla, `js/datos-favoritos.js`). La elección es de la
  clase de tercero y de todo el centro: `registro.ajustesAvisos.datosFavoritos = { ALUMNADO: ['unidad'] … }`
  (sin clave, de fábrica solo la unidad del alumnado; lista vacía, ninguno). Cada dato se guarda por
  `U.normalizar(título)` (`grupo` es `unidad`); la lista del cuadro sale también de las columnas del
  CSV (`fuente.cabecera`), no solo de las rellenas. Encogida la cabecera, el botón se esconde. Lo apaga
  el modo consulta como cualquier botón de la ficha.
- **La cabecera en dos líneas** (24-sep-2026, fila 112, `docs/CABECERA-COMPACTA.md`): dentro de
  `<header class="ficha-cabecera">`, `.ficha-linea1` (`#ficha-volver` «← Volver», las marcas, el
  `<h2>` con «⋯» y `#ficha-archivar`, a la derecha) y `.ficha-linea2` (`#ficha-acciones` y, a la
  derecha, `.ficha-apertura`: la fila de copiar, que `js/ficha-nombre-acciones.js` mete ahí, y la
  línea gris en una sola línea, recortada, con el texto entero en su `title`). Sin raya ni margen
  debajo. Encogida: las dos líneas, sin `.ficha-apertura`.
- **`#ficha-acciones` queda en cuatro elementos**, siempre en este orden: el hito actual
  (fila 129, `#ficha-estado-hito`: la marca y «Esperando a…» / «Ya ha llegado»), la etiqueta de vencimiento, "El encargo" y "Comunicar" (lo añade `js/correo.js`, ver
  abajo); "Archivar"/"Reabrir" (`.boton-principal`) va en `#ficha-archivar` desde la fila 112. `pintarAcciones(a, abierto)` perdió el
  parámetro `p` (la fecha límite ya no hace falta ahí: la etiqueta se calcula sola).
- **La etiqueta de vencimiento** (`Plazos.etiquetaVencimiento(limite)`, nueva, `js/plazos.js`):
  sustituye al botón "Plazo" y a `.marca-plazo` (quitada de la cabecera). Devuelve
  `{texto, clase}`; `clase` es `''` (normal), `vencimiento-cerca` (ámbar: hoy o quedan ≤2 días —
  **umbral propio, no `DIAS_CERCA` (7) de `Plazos.de`**, que sigue igual para
  `js/avisos.js`/`js/que-me-toca.js`/la tarjeta de la lista, incluida su regla de que "vence hoy"
  cuenta como vencido allí, no aquí), `vencimiento-vencido` (rojo) o `vencimiento-sin` (sin
  fecha). Texto: "Vence el D-mmm · quedan N días" / "Vence hoy" / "Venció hace N días" / "Sin
  plazo" (`fechaCortaSinAno`, propia de este fichero, sin año). Se pinta con
  `<button class="boton-vencimiento ...">` (`css/ficha-asunto.css`); al pulsarla abre el mismo
  `App.editarPlazo(a)` de siempre.
- **"El encargo"**: un solo botón que abre el cuadro de "Lo pide" de siempre
  (`abrirLoPide(a)`, sigue en `js/ficha-asunto.js`) con la vía de comunicación
  (`a.ficha.via`/`viaDato`, antes su propio botón vía `App.editarVia`) metida dentro como un
  campo más. `LoPide.controles(caja, persona, valorInicial, viaInicial)` gana un 4º parámetro
  `viaInicial = {via, viaDato}` y devuelve además `leerVia()` (`{via, dato}`, nunca `null`, a
  diferencia de `leer()` que sigue devolviendo `null` sin "quién"): las dos preguntas
  —quién lo pide y por dónde— se guardan juntas en un solo `App.anotar`, pero no dependen la una
  de la otra (se puede guardar la vía sin haber elegido "quién lo pide"). Ninguna de las dos
  cambia de sitio en `asuntos.json` (`loPide` y `via`/`viaDato`/`viaEl`/`viaPor`, igual que
  siempre); `App.editarVia` sigue tal cual, sigue usándolo la tarjeta de la lista
  (`js/asuntos-lista.js`). `js/via-contacto.js` envuelve `LoPide.controles` (además de
  `App.editarVia`, que no se toca) para poner las sugerencias de teléfono/correo también en el
  campo `.lopide-via-dato` del cuadro nuevo, solo si `controles()` recibe `persona`. Desde la
  fila 106 (24-sep-2026, `docs/LO-PIDE-EN-LA-CABECERA.md`) el botón va siempre solo, sin línea
  debajo: quién lo pide sale una sola vez, en la marca `.marca-lopide` de arriba, con la relación
  entre paréntesis y en minúscula (`LoPide.etiqueta`, que no la repite si el nombre ya es "Tutor
  legal N"); la vía solo se ve al abrir "El encargo".
- **"Comunicar"**: `js/correo.js` deja de montar dos botones ("Correo", "Mensaje Séneca") y monta
  uno (`.boton-comunicar`) con `FichaMenus.montar(b, [...])` (dos opciones, mismas llamadas a
  `abrirCuadro(a, false/true)` de siempre). Como este fichero pinta por su cuenta (mismo patrón de
  `MutationObserver` que ya usaba), inserta el botón con `caja.insertBefore(b, principal)` antes
  de `.boton-principal`, no con `appendChild`: si no, "Comunicar" podría acabar después de
  "Archivar" según el orden de llegada de los observadores.
- **El menú de tres puntos del `<h2 class="ficha-nombre">`** (`js/ficha-nombre-acciones.js`):
  envuelve `App.abrirFicha` igual que `js/copiar.js`, con su propio
  `MutationObserver` sobre `#pantalla-asunto` para sobrevivir a cada repintado con `innerHTML`.
  Opciones: "Editar el asunto" y, con `window.Papelera`, una raya y "Borrar el asunto" en rojo
  (`.ficha-menu-peligro`) — las dos solo si `abierto` (no existen en el ARCHIVO, igual que antes
  no existían los botones). Sin ninguna opción (ARCHIVO), el botón "⋯" ni se pone. "Copiar el
  nombre del asunto" ya no vive aquí desde la fila 58 (18-sep-2026,
  docs/AJUSTES-DE-USO-2026-09-18.md, 1): es el botón "Asunto" de la fila de copiar de un gesto,
  ver más abajo. Las dos opciones llaman a `App.volverALaLista()`, expuesta desde
  `js/ficha-asunto.js` para que este fichero pueda volver a la lista igual que hacían los
  botones de siempre.
- **La fila de copiar de un gesto** (18-sep-2026, fila 58, `js/ficha-nombre-acciones.js`,
  `ponerFilaDeCopiar`): debajo del `<h2>`, siempre a la vista, sin menú — Asunto, Ruta, NIE, Nombre
  y DNI/CIF, en ese orden; un botón sin dato no se pone. **«Ruta»** (fila 98,
  `docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md`, `js/copiar-ruta.js`, `RutaCarpetas.boton`; ruta normal
  desde la fila 227, `docs/RUTA-NORMAL-DE-WINDOWS.md`, que sustituye el `file:///` de la fila 152,
  `docs/RUTA-QUE-NO-VA-A-BING.md`) copia la ruta de la carpeta, en formato normal, con el separador
  de la base (`\` en Windows y en red, `/` en Linux), sin `file:///` ni codificar (el explorador de
  Windows y la ventana «Abrir archivo» no descodificaban bien las tildes): la de abiertos (o la del
  ARCHIVO + `a.ruta` del índice, o categoría y tercero), más el nombre (`RutaCarpetas.unir`). El
  aviso verde, tras copiar, enseña la ruta. **Desde la fila 161**
  (`docs/RUTA-SIN-PREGUNTAR.md`) la ruta de la carpeta sale de dos mitades: lo de dentro de Dropbox,
  una vez para todo el centro en `_GESTOR/rutas.json` (`{ abiertos, archivo }`, con `/`; se relee
  en cada clic y se rellena solo con una ruta completa antigua de `localStorage` si su último trozo
  se llama como la carpeta señalada), y dónde está Dropbox en este ordenador: en la copia sin
  internet, deducido de `location.pathname` (el primer trozo `Dropbox` o `Dropbox (…)`); en la web,
  `localStorage` `gestor-ruta-dropbox` o lo de delante de una ruta completa antigua
  (`gestor-ruta-abiertos`/`gestor-ruta-archivo`, que se siguen leyendo y, sin trozo `Dropbox`, se
  usan tal cual). Si falta algo, pide la ruta con `U.preguntar` («Ruta de la carpeta ASUNTOS
  ABIERTOS», con ejemplo y cómo sacarla); la pegada se parte por `Dropbox` (`RutaCarpetas.partir`):
  delante a `localStorage`, detrás a `rutas.json` si no estaba; si no acaba en la carpeta pedida,
  no se guarda. Primero copia y después guarda. Ajustes → El centro → «Rutas de las carpetas»:
  «dentro de Dropbox» (abiertos y ARCHIVO, para todo el centro) y «Dropbox en este ordenador»
  (deducido y sin campo en la copia sin internet). El mismo botón, en línea (sin
  `U.preguntar`, `RutaCarpetas.montarEnCuadro`), va también en la cabecera de los cuadros de Correo
  y de Séneca (`docs/contexto/CORREO-Y-SENECA.md`). Abrir la carpeta sigue descartado. Prueba:
  `pruebas/copiar-ruta.mjs`. Sustituye al icono `.boton-nie` que antes
  vivía pegado al `<h2>` (quitado de `js/copiar.js`) y a "Copiar el nombre del asunto" del menú
  de tres puntos. Reutiliza `Copiar.boton` (el mismo copiado con aviso "Copiado" de siempre,
  ahora expuesto en `window.Copiar` junto con `nieDeAsunto`, `categoriaDe` y `copiar`); "Asunto"
  y "NIE" salen al momento (el número sale del propio nombre de la carpeta, sin fichero de
  datos); "Nombre" y DNI/CIF (el botón se llama CIF en empresas, `Copiar.categoriaDe(a)`) piden
  `FichaTercero.datosBasicos(a)`, que tarda. Esos dos se reservan **ocultos** (`hidden`) desde el
  primer pintado y "revelar" solo les cambia `hidden` y a qué copia el clic, nunca añade un nodo
  nuevo: añadirlo tarde es una mutación dentro de `#ficha-asunto-cuerpo`, y antes de esta fila
  `js/hitos-panel.js` vigilaba esa caja entera (ver más abajo), así que ese repintado de sobra le
  podía cerrar a Francisco un hito que acababa de desplegar para mirarlo. Se esconde entera con
  la cabecera encogida (`.ficha-cabecera.encogida .ficha-copiar-fila`), igual que la línea gris.
  Se comprueba con `pruebas/copiar-fila.mjs` (los cuatro botones, con RegAlum/RelPerCen/empresas
  de mentira) y con los puntos 3 y 4 de `pruebas/cabecera-del-asunto.mjs`.
- **`js/ficha-menus.js`** (nuevo): el menú pequeño reutilizable —abrir, cerrar con Escape (en
  captura, con `stopPropagation`) y al pulsar fuera, uno solo a la vez— que usan los tres puntos
  y "Comunicar". Muy parecido a `U.menuDeAcciones` (`js/util.js`), pero fichero aparte porque la
  fila lo pedía así (14). **Trampa real**: sin `stopPropagation` en el manejador de Escape,
  cerrar el menú con esa tecla se llevaba por delante la ficha entera, porque
  `js/usabilidad.js` también escucha Escape en el documento (fuera de captura) y, sin ningún
  `#capa` abierto, pulsa `#ficha-volver` — el mismo cuidado que ya toma `js/huecos-buscador.js`
  por el mismo motivo.
- **`esControlDeSoloLectura`** (`js/ficha-asunto.js`) deja activos en modo consulta el disparador
  de los tres puntos (`.ficha-nombre-menu-boton`: dentro, "Editar"/"Borrar" salen apagados solos,
  por ser botones normales sin marcar) y la clase `.boton-copiar-fila` (fila 58: copiar no
  cambia nada del asunto). "Comunicar" no se marca como de solo lectura: ya se apagaba entero en
  consulta antes de esta fila (ninguna de sus dos acciones estaba en la lista blanca), así que
  sigue igual, apagado el botón entero.
- **«Generar documento»** (fila 267): junto a «+ Añadir documento», lleva al hito actual con su
  menú abierto (`js/ficha-generar-documento.js`; ver `HITO-MESA.md`); solo con hitos y asunto abierto.
- **«+ Añadir documento»** (fila 168, `js/ficha-documentos.js`, `ponerBotonAnadir(bloqueEl, a)`;
  antes «Documentos ▾»): en la cabecera del propio bloque, al lado del título, llama a
  `App.verDocumentos(a, { irDirectoAAnadir: true })`; se pinta también con la carpeta vacía
  (antes del primer `return` de `pintar(a)`), comprobando que no exista ya (el título no se
  rehace en cada repintado de la lista de documentos, solo `#ficha-documentos` por dentro). Las
  demás opciones de cada documento, en su fila: ver `docs/contexto/DOCUMENTOS.md`.
- **El `<h2>` con la cabecera encogida**: el nombre pasa a `<span class="ficha-nombre-texto">`
  dentro del `<h2>`; solo ese `<span>` lleva `overflow: hidden; text-overflow: ellipsis;` con la
  cabecera encogida, nunca el `<h2>` entero, para que los tres puntos —hermano del `<span>`, no
  dentro de él— no se recorten con un nombre largo (`.ficha-cabecera.encogida .ficha-nombre`
  pasa a `display: flex`).
- Se comprueba con `pruebas/cabecera-del-asunto.mjs` (11 escenarios): la barra con sus cinco
  elementos y sin ninguno de los viejos, el menú de tres puntos (ahora de dos opciones) y que
  Escape no echa de la ficha, el "NIE" de la fila de copiar según lleve o no número, la etiqueta
  de vencimiento pulsable y sus textos/colores
  (probados llamando a `Plazos.etiquetaVencimiento` directamente, con fechas relativas a `hoy`,
  sin depender de qué día se ejecute la prueba), "Comunicar" con sus dos cuadros, "El encargo"
  guardando los dos datos de una vez, «+ Añadir documento» también con la carpeta vacía, modo consulta,
  y la cabecera encogida. Los cuadros de Correo/Séneca/Documentos se cierran con Escape en la
  prueba, no pulsando `#cuadro-cancelar`/`#cuadro-aceptar`: los tres abren con `sinCancelar`
  (el botón queda oculto) y, en pantallas cortas, el de aceptar puede quedar fuera de la parte
  visible del cuadro.

### Una sola libreta de notas (25-sep-2026, fila 139, `docs/UNA-SOLA-LIBRETA-DE-NOTAS.md`)

Un asunto tiene una libreta: sus notas de `asuntos.json`. La que se escribe desde la mesa de un hito
va ahí, con `hito` (id) y `hitoTitulo` (su título entonces), y en la lista de la ficha lleva una
etiqueta pequeña (`⚑ título`, `.nota-hito`) que, pulsada dentro de la ficha, abre la mesa de ese
hito. La mesa enseña solo las notas de su hito y, aparte, «Historia»: lo que apunta la aplicación
(`h.notas`: marcado, generado, comunicado…), que se queda en el hito. Todo en `js/notas-migracion.js`
(`NotasHito`): etiqueta, `delHito`, `anadirDesdeHito` (vacía la caja al guardar; el repintado sigue
conservando lo escrito) y `idsConNotas` (al cambiar de rama o de tipo, un hito con notas en el
asunto no se quita). El historial que se escribe al archivar junta las dos cosas.

El paso de lo que había, una vez (marca `_GESTOR/notas-migrado.json`): las notas escritas a mano de
cada hito de `hitos.json` (las automáticas se reconocen por su forma fija: «Comunicado a», «Correo
enviado a», «Dado por hecho», «Generado «»…) pasan al asunto, por fecha, y después se quitan del
hito. Primero `asuntos.json`, luego `hitos.json`; repetirlo no duplica (texto, quién y cuándo).

### El registro del asunto (30-sep-2026, fila 229, `docs/REGISTRO-DEL-ASUNTO.md`)

La tarjeta «Notas» de la ficha pasa a llamarse **«Registro»**: una sola lista por fechas (lo más
reciente arriba) con lo que ha pasado en el asunto. Es una **vista** (`js/registro-asunto.js`,
`RegistroAsunto.lineas(a, { hito, hitos, notas })`): no cambia dónde se guarda nada ni migra nada.
Junta dos fuentes: las notas de la libreta (`ficha.notas` de `asuntos.json`, escritas a mano o con
`auto: true`) y `h.notas` de cada hito de `hitos.json` (siempre automáticas). Una línea es
automática si lleva `auto`, `correo`, `registroDeDocumento`, o su texto tiene una de las formas
fijas antiguas (`AUTO_ANTIGUA`, más `NotasHito.esAutomatica`); las automáticas se pintan en gris y
más pequeñas y **no llevan «⋮»**. Las escritas a mano de la libreta llevan «⋮» con «Cambiar»
(edición en la propia línea) y «Borrar» (confirma), por `App.anotarLista` con `quitar` + `anadir`
(identidad `cuando|texto`); en modo consulta no hay «⋮» ni caja.

- **Caja «Anotar algo que ha pasado…»** (ficha y mesa): Intro guarda y deja la caja vacía,
  Mayúsculas+Intro salta de línea. Desde la mesa la línea lleva el hito; desde la ficha, no. El
  botón «Guardar» y el guardado al salir del recuadro de la ficha siguen como antes.
- **Escribir una línea automática**: `RegistroAsunto.auto(a, texto, hito)` (accesorio: ámbar si
  falla). Con hito, va a la historia de ese hito (`Hitos.anadirNota`); sin él, a la libreta con
  `Notas.anadirAuto` (`auto: true`). Nunca las dos: donde antes se escribía en las dos sitios
  (generar, comunicar/correo, PDF guardado) ahora va solo al hito si lo hay. Líneas nuevas: tarea
  marcada/sin hacer/«no aplica» (`js/hito-mesa-guion.js`), hito dado por hecho o reabierto
  (`Hitos.marcar`), documento guardado (`js/documentos-guardar.js`, `js/documentos-sueltos.js`),
  asunto creado, archivado y reabierto (`js/asuntos-nuevo-crear.js`, `js/asuntos-archivar.js`,
  `js/ficha-archivo.js`; la de reabrir va **después** de recuperar la ficha del archivo).
- **La ficha se repinta** cuando cambian los hitos (`Hitos.alCambiar`/`alLeer`) solo si las líneas
  son otras (`data-f` de cada línea), para no tirar lo que se esté escribiendo.
- **El historial del archivo** (`HISTORIAL DE TRAMITACION.txt`) lleva, además de los hitos, un
  bloque «REGISTRO DEL ASUNTO» con las mismas líneas y en el mismo orden que en pantalla.
- **Resumen**: la tarjeta de la ficha y la pequeña de la mesa dicen «N líneas»; vacío, «Sin nada
  todavía».

### Asuntos reservados (25-sep-2026, fila 135, `docs/ASUNTOS-RESERVADOS.md`)

Para que un expediente disciplinario o de salud no se vea **sin querer**; la carpeta sigue viéndose
en Dropbox y la aplicación lo dice así. `js/reservados.js` (`Reservados`) es la única que decide
(`es(a)`): la ficha de `asuntos.json` puede llevar `reservado: true` o `false` (este saca un asunto
de un tipo reservado); sin el dato, hereda del tipo (`reservado: true` en `tipos.json`). Cada sitio
llama a una función, sin envolver nada:

- **Dónde se marca**: casilla en «Datos del tipo» (`filaDeTipo`, con la línea «Solo evita que se vea
  sin querer…») y, en la ficha, el menú de tres puntos: «Marcar como reservado» / «Quitar la
  reserva» (`opcionDelMenu`, por `App.guardarRegistroFresco`; en un tipo reservado, quitarla deja
  `false`). En modo consulta se apaga como las demás.
- **Fila de la tabla única de Inicio** (fila 209, sobre las cuatro pestañas —«En Administración»,
  «En espera», «Todos los abiertos», «Dormidos»—; antes tarjeta en `#inicio-legado`, fila 191):
  candado en la celda «Tercero» (`Reservados.candadoHtml`; tapada, «🔒 Reservado», sin fecha/tipo
  ni curso —esas ya son columnas propias—, `App.filaTablaAsunto`, `js/asuntos-lista-pintar.js`).
  **Tarjeta** en ARCHIVO (`App.tarjetaAsunto`, `enTarjeta`, al colgarla, ya pasada por sus
  envoltorios): candado; tapada, el rótulo es «fecha TIPO curso grupo · reservado», el pie no dice
  quién es y se quitan el trocito de nota y el botón del NIE. Se sigue abriendo.
- **Buscadores** (abiertos y ARCHIVO): un tapado solo sale por su nombre de carpeta
  (`textoDeBusqueda`), no por notas, documentos ni ficha. En Inicio el buscador de la cabecera usa
  el mismo mecanismo, nombre+tipo+tercero, ya sin tercero si está tapado.
- **La columna «Le toca a»** de la tabla (y su equivalente en «En espera»/«En Administración»):
  el mismo rótulo tapado y sin tercero (`nombreParaVer`). Si el responsable del hito es un papel
  fijo (tercero, tutor, relacionado), `App.textoLeTocaA` (fila 209, arreglado un hueco de
  privacidad de la fila 192) pone el nombre genérico del papel («Familia», «Tercero»,
  «Relacionado») en vez del nombre real, cuando el asunto está tapado. **Ficha del asunto**:
  entera, con candado en la cabecera (`ponerCandado`). **Ficha de una persona**: con candado.
- **«Mostrar reservados»** (`#btn-mostrar-reservados`, junto a «Filtros», solo si hay algún tipo o
  asunto reservado): destapa todo, solo en esta sesión; a propósito, sin `localStorage`.

### Las tarjetas por tipo de asunto

Dentro de "En el departamento" y de "A la espera de terceros", encima de la lista, sale una fila
de tarjetas pequeñas: una por cada tipo de asunto presente, con cuántos son y, en rojo, cuántos
están fuera de plazo. La primera es "Todos". Con un solo tipo, las tarjetas no salen. Las cuentas
se hacen sobre lo que ya han dejado pasar el buscador y los filtros. Orden por cantidad, de más a
menos, y a igualdad alfabético. Vive en `js/asuntos-lista.js`, estilos en `css/vista.css`.

### "Lo pide": quién ha pedido la gestión (17-sep-2026, fila 28, docs/LO-PIDE.md)

Cada asunto puede guardar, si se quiere, quién lo pidió, por qué vía y en qué fecha: el problema
real es un certificado pedido hace días, ya listo, sin recordar a quién hay que contestar. Clave
opcional `loPide` en la ficha del asunto (`_GESTOR/asuntos.json`), escrita con `App.anotar` (nunca
con `Carpetas.guardarJson`), y `null` (no `undefined`) para vaciarla:

    loPide: { nombre, categoria, relacion, correo, telefono, via, fecha, apuntadoPor }

`categoria` es la del tercero elegido (`ALUMNADO`/`PERSONAL`/`EMPRESAS`/`OTROS`), vacía si se
escribió a mano; `via` es la misma clave que usa el asunto (`Nombres.VIAS`); `fecha` es ISO
(`AAAA-MM-DD`). **El parentesco real (padre, madre, abuela) no existe en los datos del centro**
(el RegAlum no trae esa columna): las opciones de alumnado son "Tutor legal 1"/"Tutor legal 2", y
solo con "Otra persona…" se escribe algo a mano.

Toda la lógica vive en el módulo nuevo `js/lo-pide.js` (`window.LoPide`), para no engordar
`js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`:

- `LoPide.opciones(persona)`: los candidatos, siempre "El propio interesado" y "Otra persona…",
  más "Tutor legal 1/2" (solo alumnado, y solo si Séneca trae su nombre), con los datos de cada
  uno (`nombre`, `correo`, `telefono`) ya resueltos.
- `LoPide.datosDeTutor(campos, numero)`: sacada de `js/plantillas.js` (que ahora la llama en vez
  de tener su propia copia), porque `LoPide.opciones` también la necesita. El nombre no es "la
  primera columna que no sea teléfono ni correo" (17-sep-2026, fila 38, docs/LO-PIDE-NOMBRE-DEL-
  TUTOR.md: en el RegAlum del centro esa primera columna solía ser el documento del tutor, y salía
  un número donde debía ir su nombre): descarta además las columnas de documento/identificación,
  número/código, parentesco/relación/sexo, fecha/nacimiento y domicilio/dirección, y de las que
  quedan arma el nombre por prioridad (Apellidos + Nombre si hay las dos columnas, si no la que
  haya de las dos, si no la primera que sobreviva), con una red de seguridad: sin ninguna letra en
  el resultado, nombre vacío. Sin nombre pero con teléfono o correo, la opción no desaparece: se
  ofrece como "Tutor legal 1/2" a secas, con `relacion: ''` para no repetirlo en la línea de
  `LoPide.texto`.
- `LoPide.controles(caja, persona, valorInicial, viaInicial)`: pinta el desplegable, los campos
  de "Otra persona…" (solo visibles con esa opción), la vía (desplegable `.lopide-via` +
  `.lopide-via-dato`, el mismo par que `a.ficha.via`/`viaDato`) y la fecha, **con clases, nunca
  con id**: este mismo módulo se monta a la vez dentro de `#bloque-detalles` de "Nuevo asunto"
  (que queda en el documento, aunque escondido, mientras dura la sesión) y dentro del cuadro de
  la ficha; dos elementos con el mismo id habrían roto el segundo sitio que se pintara. `viaInicial`
  (`{via, viaDato}`, 18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md) es opcional, para cuando
  quien llama también quiere preguntar la vía de comunicación del asunto en el mismo cuadro.
  Devuelve `{ leer(), leerVia() }`: `leer()` sigue devolviendo `null` sin "quién" puesto;
  `leerVia()` da `{via, dato}` siempre, aunque no se haya elegido "quién lo pide".
- `LoPide.texto(ficha)`/`LoPide.correoDe(ficha)`: la línea legible ("María López (Tutor legal 1)
  · por teléfono · 17-sep-2026") y la dirección de quien lo pide, o cadena vacía sin dato.
- `LoPide.elegirDestinatarios(correos, correoLoPide, elegidosDeAntes)`: pura, sin DOM, para poder
  probarse sin cargar el cuadro de Correo entero (que no expone nada hacia fuera): decide qué
  casilla queda marcada.

Dónde se engancha: grupo **"Quién lo pide y por qué vía (opcional)"** (`#grupo-lopide`) en
`#bloque-detalles` de `js/asuntos-nuevo.js` (se repinta al cambiar de tercero con
`App.fijarTercero`; `App.datosDelFormulario()` añade `loPide` solo si hay nombre). Desde la fila
173 (26-sep-2026, docs/NUEVO-ASUNTO-SIN-REPETIR.md) **es la única pregunta de vía de Nuevo
asunto**: no hay ya un `#campo-via`/`#campo-via-dato` sueltos; `js/asuntos-nuevo-crear.js` guarda
`ficha.via`/`viaDato` con `App.loPideNuevoControles.leerVia()`, en el mismo sitio y formato de
siempre. La fecha de "Lo pide" nace con la de "Fecha de inicio" y la sigue mientras no se toque a
mano (`App.fechaLoPideAuto`/`App.actualizarFechaLoPideNuevo`, `js/asuntos-nuevo-campos.js`). Y
marca `.marca-lopide` en la cabecera de `js/ficha-asunto.js` (esta marca **no** se ha quitado en la
fila 52: solo se quitaron `.marca-estado` y `.marca-plazo`). El botón, en asuntos abiertos, es
desde la fila 52 (18-sep-2026) **"El encargo"**, que abre el mismo cuadro de siempre
(`abrirLoPide(a)`) con la vía de comunicación metida dentro (ver la sección de la cabecera, más
arriba); "Quitar el dato" sigue dentro del cuadro cuando ya hay uno, y solo quita `loPide`, nunca
la vía. Apagado en modo consulta, como el resto de controles que modifican, pero **no** en la
lista `esControlDeSoloLectura`. En `js/correo.js`: si se conoce el correo de quien lo pide y está entre
los de la lista, se marca esa casilla sola; si no está, va a "Otro correo" y ninguna casilla queda
marcada; encima de "Para" sale una línea gris "Lo pidió Fulano (relación), el día tal."; `aQuien`
(Séneca) devuelve su nombre en vez del de siempre. Cuatro huecos nuevos en `js/plantillas.js`
(`{quienlopide}`, `{quienlopiderelacion}`, `{quienlopidevia}`, `{quienlopidefecha}`), vacíos como
cualquier otro hueco cuando el asunto no tiene el dato.

No toca `js/conflictos.js` (fusiona `loPide` como un campo más que gana el lado elegido, igual que
hoy), `js/asuntos-editar.js`, `js/papelera.js`, `js/asuntos-lista.js` ni el script de Apps Script.
Se comprueba con `pruebas/lo-pide.mjs`, sin navegador (jsdom).

### Que no se dupliquen los asuntos

- **Mientras se rellena «Nuevo asunto»** (fila 163, `docs/AVISO-DE-PARECIDOS-AL-CREAR.md`,
  `js/duplicados-aviso.js`, llamado desde `mirarSiYaExiste` de `js/duplicados.js`, con la envoltura
  de siempre sobre `App.refrescarVista`): en `#aviso-duplicado`, en cuanto hay tercero (aunque no
  haya tipo), un recuadro con sus abiertos del mismo tipo en rojo arriba («Ya tiene abierto un
  asunto de este tipo»), sus archivados del mismo tipo abiertos a 15 días o menos de `#campo-fecha`
  (por el AAMMDD del nombre; «Archivado hace poco, del mismo tipo», con la etiqueta «archivado») y el
  resto de sus abiertos en gris («Otros asuntos abiertos de este tercero»; sin tipo, todos). Seis
  como mucho por bloque y «Y N más»; un reservado, tapado y con candado (`Reservados.nombreParaVer`);
  cada uno se pulsa (un abierto, su ficha; un archivado, su ficha del ARCHIVO), y al volver a «Nuevo
  asunto» lo escrito sigue ahí. Se recalcula al cambiar tercero, tipo o fecha (la fecha entra en
  `ultimaConsulta`; lo que llega tarde de una consulta vieja se tira). Sin nada, no sale. Sustituye
  al aviso ámbar de antes (solo mismo tipo, sin fechas). Nunca impide crear.
- **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto): si ya hay
  uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico (el grupo y el
  texto libre **no cuentan**), se para del todo: cuadro "Este asunto ya existe", con "Abrir el
  que ya existe" (a la ficha si está abierto, o a su carpeta del ARCHIVO si está archivado) o
  "Crear otro de todas formas". Si a alguno de los dos le falta el año académico, cuenta como
  coincidencia (`Duplicados.coincideCurso`).
  - Con varios candidatos abiertos, el de partida es el más reciente
    (`Duplicados.candidatoMasReciente`).
  - Todo envuelto en `try/catch`: **la comprobación nunca debe impedir crear un asunto**; si
    falla al mirar, se sigue como si no hubiera nada.
- **Unir dos que ya existen** (`js/unir-asuntos.js`), desde la pantalla propia "Duplicados" (ver
  más abajo): se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro
  se mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final),
  los pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra.
  Si algún fichero choca de nombre entre las dos carpetas (fila 75,
  docs/HUECOS-ENCONTRADOS-FILA-69.md, 1: hasta esa fila esto paraba la unión entera y pedía
  renombrar a mano), el que viene de la carpeta que se va entra con " (2)", " (3)"... —el mismo
  patrón que ya usa `Carpetas.fusionarEn` al archivar sobre un destino que ya existe—, y al
  terminar se avisa de cuántos documentos se han tenido que renombrar así. Nada se pierde ni se
  para.
- Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir), cargado justo
  después de `js/asuntos-lista.js` (define `App.pintarAbiertos`).

Se comprueba con `pruebas/duplicados.mjs`.

### La pantalla propia "Duplicados"

- Aviso de una línea junto al botón Actualizar de Inicio (antes «Asuntos abiertos»): `⚠ N posible(s)
  duplicado(s) — Revisar` (`#btn-duplicados`, oculto sin ninguno).
- Pantalla propia "Duplicados" (no está en la barra lateral), con botón Volver. Cada grupo en
  columnas: nombre de la carpeta (enlaza a su ficha), fecha de apertura / estado / vía / fecha
  límite, documentos (se abren con `Visor.abrir`) y las tres últimas notas ("y N más" si hay
  más).
- Botón Unir, igual que siempre.
- Botón "No son el mismo": descarta el grupo por la firma exacta de sus nombres (ordenados y
  unidos) en `_GESTOR/no-duplicados.json`. Si el grupo cambia de miembros, la firma deja de
  coincidir y el aviso vuelve a salir solo.
- Reversible en Ajustes (pestaña Mantenimiento): bloque "Duplicados descartados", con "Volver a
  avisar" por entrada.
- Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`), sin tocar
  `js/ajustes.js` ni la barra: la pantalla la crea el propio módulo (`App.PANTALLAS.push`), y su
  bloque de Ajustes se cuelga de `#ajustes-tab-mantenimiento` (antes, de `#pantalla-ajustes`
  entera), enganchado con `window.Gestor.alRefrescar`.
- `no-duplicados.json` entra en las copias de seguridad de `js/copias.js`.


---

## Los encargos de los directivos (7-oct-2026, fila 289, `docs/ENCARGOS-DE-DIRECTIVOS.md`)

`Encargos` (`js/encargos.js`) lee y escribe `_GESTOR/encargos.json` (`{ encargos: [{ id, de, organo, cuando, texto, afecta, paraCuando, documentos, estado, asunto, motivo, atendidoPor, atendidoEl }] }`; `id` = fecha, hora y `hueso` del nombre, sin contador; `asunto` = `{ numero, nombre }`). Todo se escribe por `Encargos.cambiar` (en fila, `Copias.guardar`), que para un directivo pasa por `Perfil.escribir`. Pantallas: `js/encargos-nuevo.js` («Nuevo encargo», pestaña `.pestana-encargo`, solo visible con `body.perfil-directivo`), `js/encargos-mios.js` («Mis encargos»: «En marcha · Hito N de M · título» con `Encargos.hitoDe`) y `js/encargos-llegada.js` (las tarjetas de «Ver todo»).

- «Crear asunto con él»: `App.nuevoAsuntoCon({ limite, loPide })` (dos opciones nuevas: «Fecha límite» y `App.E.nuevo.loPideInicial`, que `App.pintarLoPideNuevo` pasa a `LoPide.controles`); `App.fijarTercero` con el tercero que `terceroDe` encuentra por nombre; `App.E.nuevo.encargo` guarda el encargo hasta crear (aviso en `#aviso-pendiente`, vía `App.pintarPendiente`). Al crear, un `Gestor.alCrearAsunto` llama a `atender`: nota «Encargo de <nombre> (<órgano>): <texto>» (con `encargo: id`), `ficha.encargos` (lista `[{ id, de, cuando }]`, `App.IDENTIDAD_LISTA.encargos`), documentos movidos y estado `asunto`; el cuadro de nombres lo abre `EncargosLlegada.alTerminarDeCrear` (una línea al final de `App.crearAsuntoDelFormulario`).
- Lo que le pasa después al asunto (`Encargos.alCambiarElAsunto`, llamado por quien lo hace): archivar → `terminado`; reabrir → `asunto` (con la ficha que se llevaba en la carpeta); papelera → `no-procede` («El asunto se ha borrado»); recuperar → `asunto` (o `terminado` si era del ARCHIVO). `AsuntoRenombrar.mover/fusionar` llaman a `Encargos.alMoverAsunto` (el nombre guardado); unir asuntos funde `ficha.encargos`. El enlace encargo → asunto se busca por el número (`Encargos.asuntoDe`).
- Un conflicto de `encargos.json` se funde por `id` (`Encargos.fusionarConflicto`: gana el atendido, y entre dos atendidos el de `atendidoEl` más reciente). Se relee con el vistazo periódico (`Gestor.alRefrescar`, cada 15 s como mucho).
- Los botones del directivo llevan `data-puerta-perfil` para que `SoloConsulta` no los apague (su texto, «Enviar el encargo», casa con su lista de acciones que cambian algo). `SoloConsulta.apagarControles` no hace nada si ya no está activo.
- Demo: `js/demo/datos-encargos.js` (cuatro encargos de «Jefa de estudios de prueba» y uno de «Directora de prueba») y `Demo.entrarComo(nombre)` (cambia de nombre sin recargar). Prueba: `pruebas/encargos.mjs`.

## Las notas de los directivos (7-oct-2026, fila 290, `docs/NOTAS-DE-DIRECTIVOS.md`)

`NotasDirectivos` (`js/notas-directivos.js`). Una nota de directivo es una nota normal de `ficha.notas` con `deDirectivo: true`, `organo`, `documentos` (nombres), `carpeta` (el `id`, fecha y hora más hueso del nombre, sin contador) y, vista, `vistaPor` y `vistaEl`; su identidad sigue siendo `cuando|texto`, así que «Vista» la vuelve a guardar con `App.anotarLista` y se sustituye en su sitio. Los documentos esperan en `_GESTOR/notas-directivos/<carpeta>/`; «sin guardar» = el fichero sigue ahí (`NotasDirectivos.pendientes`).

- El directivo: `Notas.pintarEnFicha` (`pintarCajaDeNota`, `js/notas.js`) pinta `NotasDirectivos.cajaHtml()` en vez de la caja de siempre y enlaza «Adjuntar documento» y «Enviar». `enviar` escribe por `Encargos.escribir` (= `Perfil.escribir` para un directivo): documentos en su carpeta y la nota por `App.anotarLista`, que escribe por `App.E.gestor` (envuelto), así que dentro de la puerta se le pone la carpeta sin envolver mientras dura. Sin texto no envía; si falla, el texto se queda. Sus controles llevan `data-puerta-perfil` y `aplicarModoConsulta` (`js/ficha-consulta.js`) deja pasar lo que lo lleva. Sin «⋮» (ni en las suyas): `pintarLista(…, editable)` va con `false` y `RegistroAsunto` no pone «⋮» a una nota `deDirectivo`.
- La lista: `pintarRegistro` (`js/notas.js`) pone arriba `htmlSinVer` (resaltadas, con «Sin ver»; para Administración, «Vista» y por documento «Guardar en el asunto»; el directivo solo las ve) y deja el resto al registro; `RegistroAsunto` enseña su nombre con el órgano y los documentos de las ya vistas. Los botones se enlazan por delegación en `document` (`data-nd-vista`, `data-nd-guardar`, `data-nd-abrir`).
- «Guardar en el asunto»: mueve el fichero a la carpeta del asunto y pasa por `EncargosLlegada.nombrarDocumentos` (el cuadro de ponerle nombre); borrado el último, se borra su carpeta de espera. «Vista» con documentos sin guardar avisa («Tiene N documentos sin guardar en el asunto.»; «Marcar como vista de todos modos» / «Guardarlos ahora»).
- Inicio: `AvisosLinea.registrar('notas-directivos', …, asuntos)` (con `Gestor.alRefrescar`; «N notas de directivos», «1 nota de directivo»), `NotasDirectivos.marca(a)` en la fila (`js/asuntos-lista-pintar.js`). Archivar: `App.cerrarAsunto` llama a `NotasDirectivos.antesDeArchivar` (no con `App.E.archivarSinPreguntar`): «Tiene N notas de directivos sin ver.», «Archivar de todos modos» / «Verlas» (abre la ficha).
- Demo: `js/demo/datos-notas.js` (una nota sin ver con un documento en la matrícula de Marina Aguilar Ponce y una vista en la de Pablo). Prueba: `pruebas/notas-de-directivos.mjs`.
- «Buscar su carpeta» (tarjeta «N asuntos han perdido su carpeta», fila 292, `js/fichas-huerfanas.js`): lista de carpetas sin asunto ordenada por `ParecidoDeCarpetas.ordenar` (`js/parecido-de-carpetas.js`: mismo número del asunto > mismo tercero > mismo tipo > misma fecha > palabras), con cuántos documentos tiene cada una; «Parece esta:» solo con parecido claro (mismo número, o tercero y tipo, sin empate).
- «Qué cambia» (tarjeta de lo guardado a la vez en dos ordenadores, fila 292): `js/conflictos-diferencias.js` (`ConflictosDiferencias.describir`) lee las dos versiones y cuenta la diferencia (listas, tablón, asuntos, hitos; máximo diez líneas y «y N más»; iguales: «Las dos dicen lo mismo.» y solo «Resolver»). `Conflictos.pintarBloque` es ahora asíncrono. Nota: `asuntos.json`, `tablon.json` y `hitos.json` se unen solos y nunca llegan a la tarjeta; en la demo la diferencia es la de la lista de tipos de documento.
- Inicio (fila 292): «N asuntos que se repiten toca crearlos» abre un cuadro con la lista antes de crear (`js/recurrentes.js`); «N aspirantes sin Nº de identificación escolar» enseña `#personas-aviso-aspirantes` sobre la lista de Personas (`js/inicio.js`). «Borrados que se fusionan» se pinta al entrar en Herramientas (`js/herramientas.js`).

## El asunto de grupo (7-oct-2026, fila 293, `docs/TRABAJO-EN-BLOQUE.md`)

El detalle está en `docs/contexto/PERSONAS.md` («Asunto de grupo»). Lo que toca a los asuntos: «Nuevo asunto» lleva, debajo
del buscador, «Es para un grupo de personas» (`js/asunto-de-grupo.js`; `App.E.nuevo.tercero` es entonces una pseudo-persona
`{ esGrupo }` y `App.crearAsuntoDelFormulario` guarda `ficha.grupo` y `ficha.relacionados` en la misma escritura, sin
`ficha.contacto`); la ficha enseña «Grupo de N personas» en «Datos y contacto» y la tarjeta «Personas del grupo (N)» en lugar de
«Personas y entidades relacionadas» (`FichaTarjetas` toma el título de `data-titulo`); Inicio dice «Grupo <nombre> · N» en
«Tercero» y encuentra el asunto por el nombre de una de sus personas (`App.textoBusquedaSimple`); «Hacer este hito» no sale.
`ficha.grupo` de un asunto de grupo es un objeto: quien lo lea como texto (`App.piezasDelAsunto`, el índice del ARCHIVO,
`Plantillas.valoresDeAsunto`) debe comprobar `typeof === 'string'`.

- **Contacto de «El encargo»** (fila 305, `docs/CONTACTO-DEL-ENCARGO-DONDE-HACE-FALTA.md`): `LoPide.contactoDe(ficha)` es la única regla (correo, teléfono y `aLaVista`; gana lo escrito en `viaDato` a lo de `loPide`); `LoPide.correoDe` se apoya en ella. `ContactoALaVista.html(a)` pinta la marca en `marcasDeFicha` y en `.mesa-etiquetas`; el botón ⧉ sigue activo en solo consulta (`js/ficha-consulta.js`). Pruebas: `pruebas/contacto-del-encargo.mjs`, `pruebas/lo-pide.mjs` (caso 9).
