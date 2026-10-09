# El hito a pantalla completa: la mesa de trabajo

Documento hijo de `docs/CONTEXTO.md` (fila 109, 24-sep-2026, `docs/EL-HITO-A-PANTALLA-COMPLETA.md`).
Aparte de `docs/contexto/HITOS-Y-GUIAS.md`, que ya pasaba de 40 KB. Actualízalo al tocar la mesa
del hito, su guion o "Traer los guiones del instituto".

## Dónde vive

Dentro de la tarjeta "Hitos" abierta en grande (fila 107, `docs/contexto/ASUNTOS.md`, "La ficha en
tarjetas"). La lista de hitos es compacta: una línea por hito (casilla, título, plazo, responsable)
y nada se despliega. Pulsar el título o ▾ abre su **mesa** (`HitoMesa.abrir(a, idHito)`,
`js/hito-mesa.js`).

**No hay pantalla nueva**: la mesa es el mismo `.hito` con su `.hito-cuerpo` visible. `#ficha-guia`
lleva `con-mesa` y el hito abierto `hito-en-mesa`; el CSS (`css/hito-mesa.css`) esconde los demás
hitos, la cuenta, los huérfanos y "+ Añadir un hito", y la línea del propio hito (la casilla sigue
en el DOM: "Marcar hito como hecho" la pulsa por debajo, con su aviso de lo obligatorio). El hito
abierto se recuerda en `HitoMesa` por asunto; `js/hitos-panel.js` llama a `HitoMesa.aplicar(caja,
a, hitos, ajustes, abierto)` al final de cada repintado, así que guardar, llegar un documento o la
presencia no cierran la mesa. `HitosPanel.desplegarAlAbrir` (que ya usaban "Qué me toca", el menú
de un documento, generar o meter un papel en un hito) abre la mesa de ese hito
(`HitoMesa.abrirAlPintar`).

- **Escape** (`js/usabilidad.js`): primero cierra el documento de la derecha si está; luego un
  desplegable de la cabecera (fila 145); luego, si la tarjeta en grande no es el guion, vuelve al
  guion (fila 147); luego la mesa
  (`HitoMesa.cerrarSiAbierta`); luego la tarjeta (fila 107); luego sale de la ficha.
- **«← Volver a los hitos»** (fila 194, botón propio al principio de la tira de hitos,
  `#mesa-volver-hitos`, con texto compacto «← Hitos» y el texto entero en el `title`; no estira
  como las celdas de hito, `.mesa-tira-volver`): hace lo mismo que ese Escape en ese punto (cierra
  la mesa, deja la tarjeta Hitos en grande), llamando directamente a la misma función `cerrar()`.
  Va dentro de la tira, no en una fila propia, para no bajar «QUÉ HAY QUE HACER» de los 250 px de
  la cabecera compacta (fila 145, `pruebas/cabecera-compacta.mjs`).
- Con la mesa abierta, la franja de documentos de la tarjeta no sale (`FichaTarjetas.alCambiarLaMesa`).
- Con el visor o el lector abierto, o por debajo de 1100 px, la zona derecha baja debajo del guion
  (fila 145).
- Volver a abrir la misma ficha (lo hace la aplicación tras cerrar el cuadro de Correo o al generar)
  ya no cierra la tarjeta abierta: `FichaTarjetas.alEntrar(a)` solo vuelve a la cuadrícula si es
  otro asunto.

## La mesa enfocada (25-sep-2026, fila 145, `docs/MESA-DEL-HITO-ENFOCADA.md`)

Cambió cómo se ve, no lo que hace: cada botón llama a lo mismo que antes. **El guion manda.**

### La cabecera (`js/hito-mesa.js`, `pintarCabecera`)

- **La tira de hitos**, arriba y a todo el ancho, en celdas iguales (texto cortado con «…», entero en
  `title`); el abierto en azul claro con raya azul, los hechos en verde con ✓. Pulsar uno salta a su mesa.
  Sin `noaplica` ni los del tipo anterior.
- **Una línea**: el título (con «Hito N de M» en su `title`) y, en texto pequeño y gris, el estado (si
  no está hecho), el plazo («Sin plazo» o «Vence el 15-oct · quedan N días hábiles», en rojo o ámbar si
  vence) y el responsable. Siguen siendo pulsables con `FichaMenus` (`.mesa-etq-estado`,
  `.mesa-etq-plazo`, `.mesa-etq-resp`, clase `mesa-meta`). «Hecho» sí es etiqueta verde.
- **A la derecha, cinco botones**: «Generar documento ▾», «Comunicar ▾» (no en un hito-pregunta),
  **«Registrar»** (fila 154, no en un hito-pregunta: con un documento del hito sin registro, lo
  registra; con varios, menú para elegir; sin ninguno, aviso ámbar; es `HitosDocumentoMenu.registrar`,
  lo mismo que el ⋯ del documento, y abre antes la tarjeta de documentos), «Marcar como hecho» (principal; pulsa la casilla de siempre, que avisa de lo obligatorio; con el hito
  hecho, «Hecho ✓ (desmarcar)») y **«Hito ▾»** (fila 224, `docs/TAREAS-DEL-HITO-SENCILLAS.md`, antes
  «···»): arriba, sin repetir la palabra, **Crear · Cambiar · Borrar** (fila 206, no en un
  hito-pregunta: ver más abajo; mismas funciones, solo el texto cambia), y debajo de una raya
  «Saltar a este hito…» (fila 129, si se puede), «Dejarlo solo informativo»/«Pedírmelo a mí», «Cambiar
  la guía…» (con la advertencia «Vale para todos los asuntos…», luego `GuiasDelCentro.escribir`) y
  «Enviar estado» (fila 195). «+ Añadir una tarea a la guía del tipo» (fila 120) ya no vive aquí:
  es «Pasar a la guía» de cada tarea «solo aquí» (ver «El guion» más abajo). El pie «Cambiar la
  guía» de `#ficha-guia-nota` no sale con la mesa abierta.

### Crear, cambiar y borrar hitos desde el asunto (28-sep-2026, fila 206, `docs/HITOS-DESDE-EL-ASUNTO.md`)

`js/hitos-desde-el-asunto.js` (`window.HitosDesdeElAsunto`), sin engancharse a nada: escribir y
corregir la guía de un tipo desde un asunto concreto, sin salir a Ajustes. Los tres cuadros («+ Crear
un hito», «Cambiar este hito», «Borrar este hito») llevan Título, «Colocar después de», Responsable
(el mismo desplegable de la guía, con «Una Administración…» de la fila 205) y Plazo (días + cómo se
cuentan + desde qué hito, `js/guias-plazo.js`, con id propio, `GuiasPlazo.htmlConId`/`leerSelect`):
sin guía, el plazo se guarda igual en el propio hito (`Hitos.guardarCampos` gana el campo `plazo`,
que `Hitos.aplicarPlazosDependientes` ya sabe recalcular tenga o no origen en la guía).

El bloque **«¿Dónde se guarda?»** (fila 235, ver más abajo; antes, una casilla «También en la guía de <tipo corto>» marcada por defecto) decide si el cambio entra
en `_GESTOR/guias.json` y llega, en el sitio exacto elegido, a los asuntos abiertos del mismo tipo —
pero solo a los hitos **vacíos** (`HitosDesdeElAsunto.estaVacio(h, aOClave)`: sin nada que perder —
distinto de hecho, sin ninguna tarea marcada ni con valor, sin tareas propias, sin notas (las del
hito y las del asunto, con su etiqueta), sin documentos, sin rama elegida y sin una fecha puesta a
mano; «en curso» solo no cuenta como trabajo, igual que `HitosCambioDeTipo.tieneAlgo` en negativo).
Un hito con trabajo nunca se toca; el aviso de después dice cuántos asuntos han recibido el cambio y,
si alguno se ha quedado sin tocar, cuántos por tener trabajo. Al crear, el reparto a los abiertos lo
hace solo el mecanismo ya existente de la fila 118 (`GuiasDelCentro.guardarPasos` →
`Hitos.llevarGuiaAAbiertos`, que ya incluye el propio asunto); al cambiar o borrar, que si tocan
hitos que YA EXISTEN en cada asunto, hace falta el reparto propio de este fichero
(`propagarCambio`/`propagarBorrado`, dentro de un solo `Hitos.cambiar`).

**Simplificación a propósito** (como ya hace `Hitos.mover`, "complicaría las bifurcaciones sin que
Francisco lo haya pedido"): «Colocar después de» solo ofrece los hitos de **nivel superior** del
asunto (`HitosDesdeElAsunto.nivelSuperior`, nunca los de dentro de una rama de un hito-pregunta), y
lo mismo para los pasos de la guía (`pasoEsDeNivelSuperior`); si el hito elegido es propio (sin
`origenGuia`), el paso nuevo va detrás del hito anterior que sí venga de la guía
(`pasoAnclaDeHito`). Borrar un hito de dentro de una rama sigue funcionando siempre «en este asunto»
(`Hitos.quitarHito`, que ya busca a cualquier profundidad), pero la casilla de la guía no sale si el
paso de origen está dentro de una opción de una pregunta: se pierde así el aviso de «la respuesta se
quedará sin hitos» de esos casos (quedan para una fila aparte si hace falta con el uso).

«+ Añadir un hito» de la lista de hitos (`HitosPanel.pedirYAnadirHito`) abre el mismo cuadro de «Crear
un hito», con «Colocar después de» ya puesto en el último. Prueba:
`pruebas/hitos-desde-el-asunto.mjs` (crear con guía y solo en el asunto, que llega al asunto abierto
vacío y no al que tiene trabajo; cambiar título y moverlo, igual; borrar, con el mismo criterio, y
apagado si el hito no está vacío).
- **«Marcar como hecho» lleva al siguiente** (26-sep-2026, fila 173, docs/NUEVO-ASUNTO-SIN-REPETIR.md,
  punto 5): cuando el guardado termina (`HitosPanelLista.marcarDesdeCasilla`, que expone la misma
  lógica que la casilla de la lista) y de verdad se ha marcado (nunca al desmarcar), se abre la mesa
  del hito que haya quedado «en curso» (`EstadoHito.idActual`, incluida una pregunta sin responder).
  Sin ninguno (todos hechos o «No aplica»), se enseña bajo el título «Todos los hitos están hechos.»
  con un botón que pulsa el de verdad de «Archivar el asunto» de la cabecera de la ficha
  (`#ficha-archivar button`). Cuando el guion de un hito se completa por una acción del usuario en
  esta sesión (marcar una línea, generar, registrar, comunicar, añadir), se pregunta una vez con
  `U.preguntar` si se da por hecho (memoria en `HitoMesa` por hito y sesión, nunca en disco; nunca al
  abrir una mesa que ya estaba completa).
- **Los desplegables** (`.mesa-desplegable` > `.mesa-abrir-panel` + `.mesa-panel`): dentro de la página,
  no son un `U.preguntar`. «Generar documento ▾» lleva `.mesa-plantillas` (las del paso, «Otras
  plantillas», «Buscar otra plantilla…», que rellena `js/hito-mesa-documentos.js`) y los formularios
  oficiales; «Comunicar ▾» lleva `.mesa-destinatarios` (chips, «Preparar correo», «Mensaje de Séneca»
  y, solo si falta algo, «Pedir lo que falta»: `js/hito-mesa-comunicar.js`). Uno solo abierto; se
  cierran con Escape (`HitoMesa.cerrarPanelSiAbierto`, en `js/usabilidad.js`, antes que la mesa), al
  pulsar fuera (no cuenta el cuadro `#capa` que se abra desde dentro) o al abrir el otro. El abierto se
  recuerda por asunto e hito, así que un repintado no lo cierra.
- Los botones de siempre del hito (`.hito-generar`, `.hito-comunicar-boton`) siguen en el DOM,
  escondidos en `.mesa-ocultos`.
- **Con hitos, la barra de arriba de la ficha ya no enseña «Comunicar» ni «Generar documento»** (fila
  154): `js/hitos-panel.js` pone `asunto-con-hitos` en `#pantalla-asunto` al pintar y
  `css/hito-mesa.css` los esconde (siguen en el DOM, con su menú). Como un tipo sin guía recibe la guía
  mínima, en la práctica todo asunto abierto tiene hitos: se comunica y se genera desde la mesa.
  **Atajo (fila 267)**: «Generar documento» en la tarjeta «Documentos de la carpeta» de la ficha
  (`js/ficha-generar-documento.js`) no genera: calcula al pulsar el hito actual (o el último si están
  todos hechos) y llama a `HitoMesa.abrirConPanel(a, idHito, 'generar')`, que deja apuntado
  `panelAbierto` y abre la mesa con «Generar documento ▾» desplegado. Solo con `asunto-con-hitos`
  (CSS) y en asunto abierto.

### Tres tarjetas (fila 147, 25-sep-2026, `docs/MESA-TARJETAS-QUE-SE-ABREN.md`)

Rejilla `2fr 1fr` a todo el ancho (con la mesa abierta, `.contenido` pierde su ancho máximo). Con el
visor o el lector abiertos, o por debajo de 1100 px, la derecha baja. La mesa tiene tres tarjetas:
«Qué hay que hacer», «Documentos del hito» y «Registro». **Una está en grande** a la
izquierda (`.mesa-col-grande`, secciones `.mesa-grande[data-tarjeta="guion|docs|notas"]`, las tres
siempre en el DOM: los botones del guion pulsan los de siempre por debajo) y **las otras dos, de
resumen**, a la derecha (`.mesa-resumen`, en `.mesa-col-derecha`, con «Normativa (N)» plegada al pie).
Cuál se ve lo dice `data-tarjeta` de `.mesa-columnas` (solo CSS: cambiar no repinta nada).

- **Cambiar**: pulsar una tarjeta pequeña (o Intro/espacio con el foco) la abre en grande;
  «← Volver al guion», la pequeña del guion o Escape vuelven. `HitoMesa.abrirTarjeta(cual)`,
  `HitoMesa.tarjetaDe(clave, idHito)`, `HitoMesa.volverAlGuionSiOtra()` (`js/usabilidad.js`, entre el
  desplegable de la cabecera y cerrar la mesa). Se recuerda por asunto e hito: guardar, llegar un
  documento o la presencia no devuelven al guion; abrir otro hito (tira, lista, «Qué me toca»,
  cerrar la mesa) sí. La acción «Registrar» del guion abre antes la de documentos.
- **Los resúmenes** (`js/hito-mesa-tarjetas.js`, sin botones): el guion con «N de M», ✓ hechos, ☐
  pendientes y «→» el siguiente en negrita (sin los «No aplica»); los documentos con su número, el tipo
  y el registro en verde o «Sin registrar» en rojo claro (sin gemelos, cinco y «y N más»; vacío,
  «Ninguno todavía.»); las notas con «N notas», la primera línea de la última y «Última: quién · día»
  (sin notas, lo último de la historia, o «Sin notas»).
- **Guion en grande** (`js/hito-mesa-guion.js`): el título, la barra y «N de M» en la misma línea
  (fila 154: sin contar los «No aplica», ni en lo hecho ni en el total: `Hitos.cuentaGuion`).
  **Desde la fila 154 (`docs/HITOS-ACCIONES-EN-EL-HITO.md`) los pasos son una lista para marcar, sin
  botones de acción**: las acciones viven solo en la cabecera del hito. Un paso hecho, en gris (sin
  tachar) con «quién · día» al lado en pequeño (`.guion-paso-quien`); solo «No aplica» se tacha. **El
  siguiente paso** (el primero sin hacer y sin «No aplica»; ninguno con el hito hecho) lleva
  `.guion-siguiente`: fondo ámbar claro, título más grande y su explicación; si su acción es añadir un
  documento (o es una línea 📎), una zona pequeña para soltar el PDF. Los demás pendientes: explicación
  en gris pequeño. «No aplica» solo al pasar el ratón o con el foco (siempre en pantallas
  táctiles). **Sin frases al pie** (fila 224, `docs/TAREAS-DEL-HITO-SENCILLAS.md`): al final de la
  lista, una sola caja «Nueva tarea… (escribe y pulsa Intro)» que añade solo a este asunto
  (`Hitos.anadirGuionPropio`). Cada tarea lleva su «⋮» (💬 además si tiene notas,
  `js/hito-mesa-tarea-menu.js`): ver «El guion» más abajo.

  **El «Comunicar» de un paso** (fila 150) ya no existe desde la fila 154: se comunica desde «Comunicar
  ▾» de la cabecera, que marca el primer paso pendiente con esa acción (`Hitos.marcarGuionPorAccion`).
  `HitosComunicar.comunicar(a, h, canal, { idPasoGuion })` sigue sabiendo marcar un paso concreto
  (`extra.comunicarHito`, `js/correo-rastro.js`, `Hitos.marcarGuion`): lo usan las recetas.

  **Las recetas** (fila 164, `js/hito-mesa-recetas.js`): un paso con `accion` comunicar, generar o
  registrar es un paso con receta; `receta` (opcional, `js/guias-guion.js`) trae los detalles:
  comunicar `{ a, via, plantilla }`, generar `{ plantilla }`, registrar `{ sentido }`. Los pasos de
  antes, con acción y sin receta, ya valen tal cual (receta sin detalles): no se convierte nada. En la
  mesa, arriba de «Comunicar ▾» salen los pasos pendientes de comunicar (`.mesa-recetas`, un botón
  `.mesa-receta` por paso, con su texto): al elegir uno se abre el cuadro de la vía de la receta (si
  no dice, la primera de `HitosComunicar.canalesDe`), con los destinatarios de «a quién» (de los
  candidatos de `HitoMesaComunicar`: tercero, tutores, relacionados; sin «a quién», los premarcados;
  «la tutoría» u «otro», sin correo) y la plantilla ya elegida (`extra.plantilla` →
  `CorreoNucleo._interno.plantillaPedida`, que los dos cuadros usan una vez; gana a un texto propio
  del paso), y al terminar se marca ese paso. Arriba de «Generar documento ▾», los de generar: con
  plantilla fija, `PlantillasDocumento.generar(a, p, 'abierto', { hito, idPasoGuion })` y se marca ese
  paso; sin ella, el cuadro de elegir de siempre. «Registrar» pone los de registrar (con su sentido)
  como título, apagado, de su menú de documentos. El editor del guion enseña la receta debajo de la
  acción (la lista de plantillas sale de `Plantillas.enMemoria`, lo último leído).

  **«✎ Cambiar el guion de este hito»** (misma fila): abre `U.preguntar` con el editor de
  `js/guias-guion.js` (el mismo de Ajustes, sin duplicar: `bloqueHTML`/`enganchar`/`leer`/`normalizar`
  sobre una copia en memoria del `guion` de ese paso) y guarda con `GuiasDelCentro.cambiarPasos`, igual
  que «+ Añadir un paso a la guía del tipo». Sin salir a Ajustes.
- **Documentos en grande** (fila 164: con **todos los documentos del asunto**, `otrosDelAsunto`: debajo
  de los del hito, «De otros hitos», cada uno con la etiqueta `.mesa-doc-de-hito` «N · título» de su
  hito, y al final «En la carpeta, sin hito», sin gemelos ni ficheros internos; se abren, se envían y se
  marcan para adjuntar como los propios; `.mesa-doc-ajeno`. Fila 282: con la mesa abierta para trabajar (nunca en solo consulta), llevan su «⋯» (`.mesa-doc-menu-ajeno`, montado por `HitosSacarDocumento.engancharAjenos`): «De otros hitos» → «Traer a este hito» y «Quitar de su hito»; «sin hito» → «Traer a este hito» (no en un hito de decisión). `otrosDelAsunto` devuelve también `idHito`. El título dice
  «Documentos del hito · 2 (y 5 más del asunto)», `cuentaTitulo`): «Añadir documento» junto al título, la barra de marcados encima, la tabla
  (casilla, tipo en negrita y el nombre del fichero entero debajo, fecha, registro `.mesa-doc-registro`,
  estado «Registrado»/«Sin registrar», Abrir `.mesa-doc-abrir`, Enviar y ⋯), los gemelos debajo de su
  documento (`.mesa-doc-gemelo-fila`, sangrados, con su «Abrir») y, al pie, una zona de soltar de
  ancho completo. Soltar funciona sobre esta tarjeta y sobre toda la columna derecha.
- **Registro en grande**: la caja de cinco líneas que crece (Intro guarda, Mayúsculas+Intro salta) y,
  debajo, una sola lista por fechas, lo más nuevo arriba, con lo automático en gris pequeño (fila 229).
- **Modo consulta**: se puede cambiar de tarjeta y abrir documentos (`js/ficha-consulta.js` deja
  encendidos `.mesa-volver-guion`, `.mesa-doc-abrir` y `.mesa-doc-gemelo`).

La tabla de documentos, los gemelos, la selección y «Comunicar» funcionan como se describe más abajo.

## Lo que hay dentro de cada zona (de la fila 109)

- **Guion**: cada paso con casilla, texto, explicación, su acción (pulsa el botón de siempre del hito:
  `.hito-generar`, `.hito-comunicar-boton`, `.hito-anadir-documento`), su normativa «§ cita» (enlace si
  trae `url`) y «No aplica». Marcado: tachado, quién y cuándo en el `title`. Un **hito-pregunta** enseña
  «¿Qué supuesto es?» con las opciones en tarjetas (la elegida en verde); elegir otra llama a
  `HitosPanelLista.cambiarRama` (la misma pregunta de siempre si la rama de ahora tiene cosas apuntadas).
- **Documentos** (`js/hito-mesa-documentos.js`): tabla de `.hito-documento[data-doc]` (ver «Tres tarjetas»). Los gemelos (`SIN SELLAR`, `.doc/.docx` con la misma clave: sin extensión, sin «SIN
  SELLAR» y sin código de registro) cuelgan debajo, de la carpeta aunque no estén apuntados. «viene del
  hito N» si ya estaba en uno anterior. **«Enviar ▾»** de cada documento (25-sep-2026, fila 153,
  docs/ENVIAR-DOCUMENTO-POR-SENECA.md): un menú (`FichaMenus.montar`), «Por correo» / «Por Séneca», que
  llaman a `HitosComunicar.comunicarConDocumento(a, h, canal, nombre)` — lo mismo que «Comunicar ▾» de
  la cabecera, pero con ese documento ya elegido: en Correo, ya adjunto; en Séneca (que no puede
  enganchar ficheros desde la web), señalado en una línea propia del cuadro
  (`#seneca-formulario .seneca-doc-adjuntar`, «Adjunta este documento en Séneca: … · Copiar el nombre»,
  `CorreoNucleo.documentoSeneca()`). Al terminar se marca el primer paso del guion con `accion:
  'comunicar'` de ese hito, igual que «Comunicar» de la cabecera (`Hitos.marcarGuionPorAccion`). Con
  varios marcados, barra: Enviar por correo, Abrir para imprimir (una pestaña cada uno), Mover a otro
  hito (sin cambios, siempre por correo). Soltar un fichero del ordenador
  (`Documentos.abrir(a, { hito, ficheroSoltado })`). El ⋯ de cada documento suma «Renombrar» y «Mover a
  otro hito» (`js/hitos-documento-menu.js`).
- **Un documento para cada relacionado** (fila 171, `docs/DOCUMENTO-PARA-CADA-RELACIONADO.md`,
  `js/generar-para-relacionados.js`): en «Generar documento ▾», junto a cada plantilla, «… para cada
  relacionado (N)» si el asunto tiene `ficha.relacionados` (lo pinta y engancha
  `GenerarParaRelacionados.botonHTML`/`enganchar`, llamados desde `pintarPlantillas`). Genera uno por
  persona con `Plantillas.valoresDePersona` (el asunto con el relacionado en el sitio del tercero, sin
  su `contacto`); lo del asunto que falte se pregunta una vez (`WordFaltan`), lo de la persona (DNI,
  sexo, especialidad…) se dice en el resumen. Nombre: el de siempre con el nombre de la persona al
  final del texto adicional; uno que ya esté no se rehace. Resumen en `U.preguntar` con «Enviar a cada
  uno…» (solo con el envío conectado): un correo por persona, su documento adjunto, «Hola, <nombre>:»,
  la plantilla de correo del tipo (la que se llama «certificado»/«envío», o la primera) y la firma;
  `idEnvio` fijo por asunto + documento + correo, y `ficha.enviosPorPersona` para no mandarlo dos
  veces. Quien no tiene correo sale «para Séneca». Se comprueba con `pruebas/generar-para-relacionados.mjs`.
- **Comunicar** (`js/hito-mesa-comunicar.js`): chips del tercero, sus tutores (`Datos.tutoresDe`) y los
  relacionados, premarcados según el responsable (tutor → tutor legal 1/2; relacionado → ellos; si no, el
  tercero); «Preparar correo» y «Mensaje de Séneca» llaman a `HitosComunicar.comunicar(a, h, canal, {
  correos, nombres, adjuntos })` (los adjuntos: los marcados en la tabla, o todos los del hito).
  `HitosComunicar.comunicarConDocumento(a, h, canal, nombre)` es la misma función con un documento ya
  elegido («Enviar ▾» de un documento, más arriba).

## El guion

- **En la guía**: `guion: [{ id, texto, explicacion, accion, normativa }]` en cualquier paso que no
  sea pregunta (`Guias.normalizar`, con `GuiasGuion.normalizar`; un paso-pregunta lo vacía).
  `accion`: `'generar' | 'registrar' | 'comunicar' | 'anadir' | ''`. Editor: "Guion de este paso"
  en el cuadro de la guía (`js/guias-guion.js`, patrón de `js/guias-requisitos.js`; la normativa de
  un paso de guion es solo cita y enlace).
- **En la biblioteca**: `guion` en cada modelo (`HitosBiblioteca.normalizarModelo`), copiado al traer
  un modelo (`modeloAPaso`) y al subirlo (`pasoAModelo`), y comparado en `diferencias` ("Guion").
- **En el hito** solo el estado (`js/hitos-guion.js`, sobre `window.Hitos`): `guionHecho: { id: {
  hecho, noaplica, quien, cuando } }`, `guionPropio: [{ id, texto, enLugarDe? }]` y `guionOcultos:
  [id...]` (fila 224: los ids de la guía que no se ven en este asunto; `enLugarDe`, si una propia
  sustituye a una de ellas en su mismo sitio; `normalizarHito` conserva los tres, solo si no están
  vacíos). `Hitos.guionDe(a, h)` junta el guion del paso (por `origenGuia`) con eso; un paso que
  desaparece de la guía deja de verse, igual que uno escondido sin sustituta.
- **Preguntas en el guion** (24-sep-2026, fila 116, `docs/PREGUNTAS-EN-EL-GUION.md`): una línea
  puede ser `{ id, texto, explicacion, pregunta: true, opciones: [{ id, texto, lineas: [...] }] }`.
  Un solo nivel (`GuiasGuion.normalizar(lista, dentro)` quita la marca dentro de una opción) y sin
  `accion` ni `normativa`. Si la respuesta cambia los hitos de después, el responsable o el plazo,
  es un hito-pregunta; si solo cambia las tareas del mismo hito, una pregunta en el guion. Editor:
  casilla «Es una pregunta» en cada línea, con «+ Añadir respuesta» y «+ Añadir línea». En el hito,
  `guionElegido: { idPregunta: idOpcion }` (`Hitos.elegirEnGuion`; `normalizarHito` lo conserva).
  `Hitos.guionDe` devuelve lo que se ve (la pregunta, hecha si está respondida, y detrás las líneas
  de la respuesta elegida, `deOpcion`) y, en `.plegadas`, lo ya marcado de otra respuesta. En la
  mesa (`js/hito-mesa-guion.js`), un botón por respuesta, las líneas de la elegida sangradas y lo
  plegado al final, en gris. La biblioteca copia y compara el guion entero
  (`GuiasGuion.textoLegible`). En el mapa, «¿» en la caja de un paso cuyo guion tiene pregunta.
- **El «⋮» de cada tarea** (29-sep-2026, fila 224, `docs/TAREAS-DEL-HITO-SENCILLAS.md`,
  `js/hito-mesa-tarea-menu.js`): sustituye a «+ Añadir un paso a la guía del tipo» y a «✎ Cambiar el
  guion de este hito» (fila 120), que ya no viven al pie de la tarjeta. Sin el `guion-paso-plegada`
  ni en una pregunta.
  - **Anotar**: una línea para escribir debajo de la tarea; la nota va a la libreta única del
    asunto (`NotasHito.anadirDesdeTarea`, con `hito`/`hitoTitulo` como siempre y además
    `tarea`/`tareaTexto`) con el nombre de la tarea delante («Revisar DNI o NIE: …»). La tarea
    lleva entonces un 💬 (con el número si hay más de una) que despliega o pliega sus notas
    (`NotasHito.delTarea`).
  - **Cambiar** (fila 235; antes «Cambiar aquí» / «Cambiar en la guía»): el texto se edita en la
    propia línea (Intro abre «¿Dónde se guarda?», Escape cancela). «Solo en este asunto», de la guía: `Hitos.cambiarGuionAqui(clave, idHito,
    original, texto)` esconde el id original en `guionOcultos` y pone una propia con `enLugarDe` en
    su mismo sitio, con su marca de hecha; desde ese momento lleva «solo aquí». «Solo aquí»:
    `Hitos.cambiarGuionPropioTexto`, sin más.
  - **Abrir en la guía** (tarea de la guía; antes «Cambiar en la guía»): `HitoMesaGuion.cambiarGuionDelPaso(a, h, idResaltar)`,
    el mismo editor de siempre (`js/guias-guion.js`) con esa tarea a la vista y resaltada
    (`.guion-fila-resaltada`); el título de la ventana dice «Cambiar en la guía de <tipo>».
  - **Pasar a la guía** (tarea «solo aquí»): el emergente «¿Dónde se guarda?» con «A la guía» marcada y, aceptado, la tarea (texto,
    explicación, acción, normativa, reunir/obligatorio) se añade al final del `guion` del paso de
    la guía con `GuiasDelCentro.cambiarPasos` (id nuevo de `GuiasGuion.normalizar`, como antes),
    y `Hitos.pasarGuionPropioAGuia` quita la propia de este asunto y traslada su marca de hecha (si
    la tenía) al id nuevo. Como `Hitos.guionDe` lee el paso en vivo, sale ya en todos los asuntos
    abiertos de ese tipo. La biblioteca no se toca.
  - **Borrar**: `Hitos.borrarGuionPropio` (una «solo aquí», desaparece de este asunto; si sustituía
    a una de la guía, esa se queda escondida) o `Hitos.ocultarGuionDeGuia` (una de la guía, sin
    sustituta: solo se esconde en `guionOcultos`, la guía no cambia). Si la tarea estaba hecha, «No
    aplica» o tenía notas, una confirmación de una línea.
- **Se marca solo** (`Hitos.marcarGuionPorAccion(a | clave, idHito, accion)`, el primer paso sin
  marcar con esa acción, en el orden en que se ven, nunca de una respuesta no elegida; si falla, ámbar con `U.accesorio`): `generar` en
  `js/plantillas-documento.js` (generar con hito); `registrar` al terminar el registro desde el ⋯
  del documento; `comunicar` en `apuntarElRastro` de `js/correo.js` (con `comunicarHito`); `anadir`
  al apuntar un documento nuevo al hito desde el ordenador (`js/documentos.js`), desde "Por
  clasificar" (`js/documentos-sueltos.js`) o desde la carpeta (`js/hitos-documentos.js`).

## «Buscar otra plantilla…» (fila 126)

`js/plantilla-buscar.js` (`PlantillaBuscar.montar(caja, alElegir)`, `filtrar`): un campo y la lista de
TODAS las plantillas de documento del centro, de cualquier tipo, filtrando al escribir (todas las
palabras en nombre, tipo, categoría y tipo de documento; 40 como mucho). En la mesa, debajo de las del
paso y «Otras plantillas», el enlace «Buscar otra plantilla…» (sale siempre con la mesa abierta, aunque
el hito no tenga ninguna) monta el buscador ahí mismo; pulsar una la genera con
`PlantillasDocumento.generar(a, p, 'abierto', { hito: h })`. El botón «Generar documento» del hito sale
si hay cualquier plantilla en el centro y siempre pasa por el cuadro de elegir, que lleva el mismo
enlace (`PlantillasDocumento.elegir({ delPaso, delTipo, buscar: true })`); sin ninguna del paso ni del
tipo, el buscador sale ya abierto.

## "Traer los guiones del instituto"

Botón en Ajustes → Mantenimiento → Herramientas → "Biblioteca del centro"
(`CargarBiblioteca.traerGuiones`, `js/cargar-biblioteca.js`). Pone el `guion` de
`datos-biblioteca/biblioteca-centro.json` en los pasos de `guias.json` (emparejando por
`origenBiblioteca.id` o el id del paso) y en los modelos de `hitos-biblioteca.json` (por id), solo
si no tienen ya uno. A un guion ya escrito solo le añade las líneas del centro marcadas
`nueva: true` que no tenga (por su id), detrás de la línea que las precede en el guion del centro,
y las plantillas de `plantillasDocumento` del modelo que le falten (fila 124: la línea
`g-renuncias` y la plantilla `pd-centro-renuncia-junta-electoral` del modelo `b260`, «Constituir la
Junta Electoral»). Nunca quita ni mueve nada; una línea nueva que se borre a mano vuelve si se pulsa
otra vez el botón. Una sola escritura de `guias.json` con `Copias.guardar` y un
`GuiasDelCentro.guardarPasos` del último tipo tocado para que la aplicación lo relea. Dice cuántos
ha traído. El borrador (296 modelos, 1.064 pasos) está en `biblioteca-centro.json`: si se vuelve a
generar ese fichero con `herramientas/cargar-biblioteca.mjs`, los guiones se perderían.

Se comprueba con `pruebas/hito-mesa.mjs`, `pruebas/mesa-del-hito-enfocada.mjs`, `pruebas/mesa-tarjetas-que-se-abren.mjs`
(a 1905×1000 y 1280×800; con `CAPTURAS=1`, fotos en `pruebas/capturas/`), `pruebas/mesa-comunicar-del-paso-y-guion.mjs`
(el «Comunicar» de un paso, visible con dos vías, marca el paso pulsado; y «Cambiar en la guía») y
`pruebas/enviar-documento-por-seneca.mjs` («Enviar ▾» de un documento, por correo o por Séneca, y el guion al
terminar) y `pruebas/hitos-acciones-en-el-hito.mjs` (fila 154: sin botones en los pasos, «Registrar» en la
cabecera, «Comunicar» de arriba escondido, quién al lado del paso hecho, y los tres números iguales),
`pruebas/hitos-recetas.mjs` (fila 164: la receta de comunicar abre el cuadro con su plantilla y marca ese
paso; los documentos de otros hitos; el editor de la receta; generar y registrar) y
`pruebas/tareas-del-hito-sencillas.mjs` (fila 224: la caja «Nueva tarea…», «Cambiar aquí», «Anotar» con su
💬, «Borrar» de una tarea de la guía y el botón «Hito ▾»). Las pruebas que abrían varios hitos seguidos
cierran antes la mesa (`HitoMesa.cerrar()`).

### Una sola lista: lo que hay que reunir, en el guion (25-sep-2026, fila 138, `docs/UNA-SOLA-LISTA-EN-EL-HITO.md`)

Las palabras son tres: **guía** (el modelo), **hito** (cada paso) y **guion** (la lista de tareas del
hito). «Lo que hay que reunir» deja de ser otra lista: una línea del guion puede llevar `reunir:
'documento' | 'dato'` y `obligatorio` (casilla «Hay que reunirlo», junto a «Es una pregunta», en
`js/guias-guion.js`). En la mesa (`js/hito-mesa-guion.js`): 📎 o ✎ delante y «obligatorio» en
negrita; un dato lleva su caja y se marca al escribirlo (`Hitos.escribirValorGuion`); un documento
se marca solo al añadirlo, generarlo, registrarlo o asociarlo al hito
(`HitosRequisitos.marcarPorDocumento` → `Hitos.marcarReunirPorDocumento`, que pregunta con cuál si
hay varios, y dice cuál es) y se desmarca al quitarlo. «Dar por hecho» avisa de las obligatorias
sin reunir (`Hitos.faltanObligatorios(h, a)` → `Hitos.faltanReunir`) y «Pedir lo que falta» sale
del guion (`Hitos.textoLoQueFaltaGuion`).

`js/reunir-migracion.js` pasó lo que había, una vez (marca `_GESTOR/reunir-migrado.json`): los
requisitos de cada paso de `guias.json` y de cada modelo de `hitos-biblioteca.json`, al final de su
guion (id `reunir-<id>`); los de cada hito de `hitos.json`, a su estado (`guionHecho`, con valor,
documento, quién y cuándo) o, si su paso no los tiene, a `guionPropio`. Los requisitos viejos siguen
en los ficheros, sin leerse; un hito del ARCHIVO que aún los traiga los enseña, para leer. El
contenido del instituto (`datos-biblioteca/biblioteca-centro.json`) ya los trae como líneas del
guion, y un modelo viejo se convierte al meterlo en una guía (`ReunirMigracion.pasoAGuion`).

### El registro de la mesa (30-sep-2026, fila 229; antes «Notas e historia»)

La tarjeta «Registro» de la mesa enseña, en **una sola lista** por fechas (ya no hay dos columnas,
«notas» e «Historia»), solo las líneas de este hito: las notas del asunto escritas desde aquí
(`ficha.notas` con su `hito`) y lo automático del hito (`h.notas`, en gris). Encima, la caja
«Anotar algo que ha pasado…» (Intro guarda). Ver «El registro del asunto» en
`docs/contexto/ASUNTOS.md`.

## «¿Dónde se guarda?» al crear, cambiar o borrar (30-sep-2026, fila 235, `docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md`)

Todo cambio de hitos o de tareas hecho desde un asunto pregunta, antes de guardarse, dónde se guarda. La
pregunta es siempre la misma y sale sola, sin ir a buscarla:

- **`js/donde-se-guarda.js`** (`DondeSeGuarda`): el bloque (`bloqueHTML`, `textoConsecuencia`, puras) con dos
  radios `name="dsg-donde"`: «A la guía de <tipo corto>» (marcada siempre al abrirse) y «Solo en este
  asunto». Debajo de la primera, en letra pequeña: «Llegará a N asuntos abiertos de este tipo.» (N = los
  demás abiertos del tipo, `otrosAbiertos`), «No hay más asuntos abiertos de este tipo. Valdrá para los
  próximos.» si N es 0, «En M no se tocará, porque ya tienen trabajo.» y, si el hito no está en la guía,
  «El hito "X" todavía no está en la guía: irá con sus N tareas.». Sin tipo no hay bloque (se guarda solo
  en el asunto); dentro de una pregunta, «A la guía» sale apagada con el motivo. Teclado: flechas cambian
  la opción, Intro acepta, Escape cancela sin guardar (`js/usabilidad.js`). `preguntar` es el emergente
  pequeño de las tareas.
- **Hitos** (`js/hitos-desde-el-asunto.js`): los tres cuadros ya no llevan la casilla; el bloque va al pie y
  el botón dice «Guardar» («Borrar» en el de borrar). «Cambiar» un hito propio del asunto también ofrece
  «A la guía». `js/hitos-desde-el-asunto-guia.js` (`HitosDesdeElAsuntoGuia`): `llevarHitoEntero` (un hito
  sin paso en la guía entra con título, plazo, responsable y todas sus tareas —con los mismos ids, así que
  lo marcado no se pierde—, detrás del hito anterior que venga de la guía; se enlaza primero aquí para que
  el reparto de la fila 118 no lo repita), `instantanea` + `deshacer` + `avisarConDeshacer`.
  **Explicación del hito** (fila 228, `docs/EXPLICACION-DEL-HITO-AL-CAMBIAR.md`): «Crear» y «Cambiar» llevan la
  caja `#hda-cuerpo` (`contenteditable`, misma barra `GuiasBarra` y mismo limpiado `Guias.limpiar` que
  `.paso-cuerpo` de la guía; vacía si no dice nada). Campo `cuerpo` en `Hitos.guardarCampos` («solo aquí»), en
  el paso de la guía y en `propagarCambio`; con la biblioteca, la caja se rellena con `modelo.explicacion` y el
  paso nuevo lleva el texto cambiado. `llevarHitoEntero` se lleva también el `cuerpo`. «Deshacer» deja guía y
  otros asuntos como estaban; aquí se queda. El cuadro lleva `cuadro-alto cuadro-hda` (botones fijos abajo).
  Prueba: `pruebas/explicacion-del-hito-al-cambiar.mjs`.
- **Tareas** (`js/donde-se-guarda-tareas.js`, `DondeSeGuardaTareas.nueva/cambiar/pasar/borrar`): Intro en
  «Nueva tarea…» abre el emergente; Escape deja lo escrito; la caja se vacía al elegir. A la guía = tocar
  el `guion` del paso (`GuiasDelCentro.cambiarPasos`), que llega solo a los demás asuntos; un hito propio
  se lleva entero. Borrar una tarea de la guía deja «solo aquí», en los abiertos donde estaba hecha, esa
  tarea (`conservarHechas`). Borrar una «solo aquí» no pregunta.
- **El aviso de después**: «Guardado en la guía de <tipo> y en N asuntos abiertos.» (más «En M no se ha
  tocado porque ya tenían trabajo.») con botón **«Deshacer»** (8 s, `U.aviso` con acción) o «Guardado solo
  en este asunto.». «Deshacer» devuelve la guía y los demás asuntos a la instantánea de antes y deja el
  cambio en este asunto como «solo aquí»; si algo ha cambiado por otro lado, no lo pisa y avisa en ámbar.
- **«No me carga el mapa previo»** (punto 6 del documento): con datos de demostración no se reprodujo
  (`pruebas/donde-se-guarda.mjs`, 6b y 7: tras crear un hito «solo en este asunto» o en la guía, «Cambiar la
  guía…», «Ver mapa» y el mapa del asunto enseñan la guía previa entera). Único punto débil encontrado y
  arreglado: `GuiasDelCentro.recargar()` vaciaba la guía en memoria si la lectura fallaba (ahora conserva
  la última buena).
- Pruebas: `pruebas/donde-se-guarda.mjs` (nueva), y puestas al día `pruebas/hitos-desde-el-asunto.mjs`,
  `pruebas/tareas-del-hito-sencillas.mjs` y `pruebas/hito-mesa.mjs`.

**Campos de este hito (fila 255)**: en la columna derecha, debajo de los tres resúmenes, la tarjeta `.mesa-campos-hito` (la pinta `CamposDeHito.tarjetaHtml` desde `cuerpoDeHito`, se engancha en `engancharCuerpo`): los campos del hito con su control según la clase, guardados al cambiar, con «⋮» y «+ Añadir campo» en el título; sin campos, una tarjeta pequeña con solo el botón; en modo consulta y en el ARCHIVO, solo lectura.

## Tareas con la plantilla fuera de uso (9-oct-2026, fila 321)

`Plantillas.fueraDeUsoDeLaTarea(g)` (síncrona) dice si la plantilla de la receta de una tarea está fuera de uso. La mesa pone junto al
texto de la tarea (`js/hito-mesa-guion.js`) y en el menú de recetas (`js/hito-mesa-recetas.js`) la marca «plantilla fuera de uso»; el botón
de la tarea (generar o comunicar) da un aviso ámbar y no hace nada, y «Hacer este hito» (`js/hacer-este-hito.js`) se para en esa tarea sin dar
el hito por hecho. La tarea se puede marcar hecha a mano. El editor de la guía enseña la misma marca (`js/guias-guion.js`) y la lista de
comprobación del tipo la cuenta como «sin plantilla».

## «Hacer este hito» (6-oct-2026, fila 285, `docs/HACER-ESTE-HITO.md`)

- Botón en la cabecera de la mesa, delante de «Generar documento ▾» (`HacerEsteHito.botonHTML/lineaHTML/enganchar`, pintados desde `pintarCabecera` de `js/hito-mesa.js`). Solo sale si el hito tiene una tarea pendiente con acción `generar` o `comunicar`; la línea gris de debajo lista la cadena («Genera «…» → espera el registro en Séneca → correo al tercero»). Apagado en solo consulta. Los tres menús y las recetas (fila 164) no cambian.
- La cadena: `HacerEsteHito.ejecutar(a, hito)`. Una tarea tras otra desde la primera pendiente; una pregunta sin responder la para antes (aviso ámbar); lo que no es generar, registrar ni comunicar se salta. Cada vuelta relee el hito.
  - `generar`: la plantilla de la receta (o el cuadro de elegir), `generar` con el hito y la tarea (la marca) y, con el visor pintado, el PDF se guarda solo (`WordVisor.guardarPdfAhora({ sinCerrar })`; `generar` devuelve `{ nombre }`).
  - `registrar`: apunta `cadena = { estado: 'esperando-sello', tarea, documento, quien, cuando }` en el hito (`Hitos.guardarCampos(..., { cadena })`), pone una franja verde en el visor (`WordVisor.franja`, con el botón «Ruta») y se para. En la mesa: «Esperando el PDF sellado» (apagado) y «Dejar de esperar».
  - `comunicar`: `HitosComunicar.comunicar` con la receta, el documento adjunto y «Todavía no» como botón de cerrar (`extra.cerrarTexto` en `CorreoNucleo.abrirCuadro`; tras enviar vuelve a «Cerrar»). La promesa del cuadro acaba antes que él (el envío pide confirmación en el mismo cuadro): se espera a que se cierre #capa y se mira si la tarea quedó hecha; si no, `listo-para-enviar`.
- Terminar: sin tareas pendientes, hito hecho sin preguntar (aviso con «Deshacer» y se abre el siguiente); con tareas a mano, «Hecho lo que podía hacer la aplicación. Quedan N tareas por marcar.»
- PDF sellado (`js/hacer-este-hito-sello.js`): con un solo hito esperando y un solo sellado en la carpeta, con sello no anterior al día de la cadena y el documento presente, `RegistroSellado.asociar` lo coloca sin preguntar (devuelve el nombre final), marca `registrar` y, si sigue `comunicar`, `listo-para-enviar`. Con dudas no decide y queda el aviso ámbar de la ficha. Pasada de fondo (`Gestor.alRefrescar`, cada 15 s como mucho, solo asuntos con cadena esperando; no en solo consulta, con guardado en marcha ni con compañero dentro) y también al pintar `ficha-sellos.js`.
- Inicio: aviso «N listos para enviar» (`AvisosLinea`, clave `listos-para-enviar`, filtra la tabla) y las coletillas «· listo para enviar» / «· esperando el sello» en «Hito actual».
- Copia de pruebas: tipo CERTIFICADO DE NOTAS con la plantilla «Certificado de notas» (`js/demo/datos-hacer-hito.js`); «Vidal Soto, Irene» sin tocar, «Moreno Sanz, Hugo» esperando el sello con su PDF sellado en la carpeta.

## Esperas que se cierran (6-oct-2026, fila 286, `docs/ESPERAS-QUE-SE-CIERRAN.md`)

- En la cabecera de la mesa de un hito de espera con la fecha límite pasada, «No ha llegado nada» (`Esperas.botonHTML/enganchar`, desde `pintarCabecera`): anota «Venció el … sin respuesta.», da el hito por hecho por el camino de «Marcar como hecho», le pone `sinRespuesta` y abre la mesa del siguiente; «Deshacer» lo reabre (la marca se borra sola). La etiqueta de estado dice «Hecho · sin respuesta» (`Esperas.textoHecho`), igual que la fila de la lista y la exportación.
- La casilla «Es lo que se esperaba…» vive en el cuadro de nombre (ver `docs/contexto/DOCUMENTOS.md`).

- Fila 305: `.mesa-etiquetas` lleva la marca de `ContactoALaVista` («Lo pide: … · Tel. … ⧉»); no hace crecer la cabecera (el nombre se recorta, el dato no).
