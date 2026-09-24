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

- **Escape** (`js/usabilidad.js`): primero cierra el documento de la derecha si está; luego la mesa
  (`HitoMesa.cerrarSiAbierta`); luego la tarjeta (fila 107); luego sale de la ficha.
- Con la mesa abierta, la franja de documentos de la tarjeta no sale (`FichaTarjetas.alCambiarLaMesa`).
- Con el visor o el lector abierto, la tercera columna baja debajo de las otras dos; por debajo de
  1100 px, una columna.
- Volver a abrir la misma ficha (lo hace la aplicación tras cerrar el cuadro de Correo o al generar)
  ya no cierra la tarjeta abierta: `FichaTarjetas.alEntrar(a)` solo vuelve a la cuadrícula si es
  otro asunto.

## La cabecera (`js/hito-mesa.js`, `pintarCabecera`)

Una sola línea (fila 112, `docs/CABECERA-COMPACTA.md`): título (con "Hito N de M" en su `title`),
las etiquetas y, a la derecha, "Marcar hito como hecho" (resaltado
con el guion completo; nunca se marca solo), menú ⋯ ("Dejarlo solo informativo"/"Pedírmelo a mí",
"Quitar este hito": pulsan los botones de siempre, que quedan ocultos en `.hito-botones`), tres
etiquetas pulsables con `FichaMenus` (estado → `Hitos.marcar`; plazo → "Cambiar la fecha…"/"Quitar
la fecha" con `Hitos.guardarCampos`, texto "Vence el 15-oct · quedan N días hábiles" (o lectivos, o
naturales: el modo del plazo del hito, fila 131) con `Plazos.diasQueQuedan`, los festivos y los no
lectivos; responsable → los de Ajustes › Hitos y los papeles) y
la tira de hitos visibles (sin `noaplica` ni los del tipo anterior): ✓ los hechos, el actual
marcado; pulsar uno salta a su mesa. Los campos grandes de responsable y fecha desaparecen. Sin
"← Volver a la lista de hitos" ni camino: se vuelve pulsando otra vez la pestaña "Hitos" o con
Escape; con la mesa abierta, el título "Hitos" del recuadro no sale (`:has(#ficha-guia.con-mesa)`,
`css/ficha-tarjetas.css`). Con 1600×920, "GUION DEL HITO" queda a unos 234 px del borde
(`pruebas/cabecera-compacta.mjs`, límite 250).

## Las tres columnas (el cuerpo, `cuerpoDeHito` en `js/hitos-panel-lista.js`)

1. **Guion** (`js/hito-mesa-guion.js`): "Guion del hito", "N de M", barra; cada paso con casilla,
   texto, explicación, su acción (pulsa el botón de siempre del hito: `.hito-generar`,
   `.hito-comunicar-boton`, `.hito-anadir-documento`), su normativa "§ cita" (enlace si trae `url`) y
   "No aplica". Marcado: tachado, quién y cuándo en el `title`. "+ Añadir un paso solo para este
   asunto". Un **hito-pregunta** enseña "¿Qué supuesto es?" con las opciones en tarjetas (la elegida
   en verde); elegir otra llama a `HitosPanelLista.cambiarRama` (la misma pregunta de siempre si la
   rama de ahora tiene cosas apuntadas). Una pregunta sin responder sigue contestándose en la lista.
2. **Documentos y formularios** (`js/hito-mesa-documentos.js`): tabla de `.hito-documento[data-doc]`
   (casilla, tipo en negrita, fichero en gris con su `.hito-doc-abrir`, estado "Registrado
   26EM0617"/"Sin registrar"/"(ya no está)", Enviar y ⋯). Los gemelos (`SIN SELLAR`, `.doc/.docx`
   con la misma clave: sin extensión, sin "SIN SELLAR" y sin código de registro) cuelgan debajo, de
   la carpeta aunque no estén apuntados. "viene del hito N" si ya estaba en uno anterior. Con varios
   marcados, barra: Enviar por correo, Abrir para imprimir (una pestaña cada uno), Mover a otro hito.
   Zona de soltar un fichero del ordenador (`Documentos.abrir(a, { hito, ficheroSoltado })`). Desde
   la fila 138, «lo que hay que reunir» ya no va aquí: son líneas del guion (ver más abajo). Las plantillas del paso con "Generar documento" (y las del tipo en
   "Otras plantillas", plegado) y los formularios oficiales (`Formularios.listaHTML`, como antes).
   El ⋯ de cada documento suma "Renombrar" y "Mover a otro hito" (`js/hitos-documento-menu.js`).
3. **Consulta**: normativa del hito y la de su guion, sin repetir; "Comunicar"
   (`js/hito-mesa-comunicar.js`): chips del tercero, sus tutores (`Datos.tutoresDe`) y los
   relacionados, premarcados según el responsable (tutor → tutor legal 1/2; relacionado → ellos; si
   no, el tercero); "Preparar correo" y "Mensaje de Séneca" llaman a
   `HitosComunicar.comunicar(a, h, canal, { correos, nombres, adjuntos })` (los adjuntos: los marcados
   en la tabla, o todos los del hito); "Pedir lo que falta", solo si falta algo. "Notas e historial",
   lo más nuevo arriba, lo automático sin fondo; Intro guarda, Mayúsculas+Intro salta de línea.

## El guion

- **En la guía**: `guion: [{ id, texto, explicacion, accion, normativa }]` en cualquier paso que no
  sea pregunta (`Guias.normalizar`, con `GuiasGuion.normalizar`; un paso-pregunta lo vacía).
  `accion`: `'generar' | 'registrar' | 'comunicar' | 'anadir' | ''`. Editor: "Guion de este paso"
  en el cuadro de la guía (`js/guias-guion.js`, patrón de `js/guias-requisitos.js`; la normativa de
  un paso de guion es solo cita y enlace).
- **En la biblioteca**: `guion` en cada modelo (`HitosBiblioteca.normalizarModelo`), copiado al traer
  un modelo (`modeloAPaso`) y al subirlo (`pasoAModelo`), y comparado en `diferencias` ("Guion").
- **En el hito** solo el estado (`js/hitos-guion.js`, sobre `window.Hitos`): `guionHecho: { id: {
  hecho, noaplica, quien, cuando } }` y `guionPropio: [{ id, texto }]` (`normalizarHito` los
  conserva). `Hitos.guionDe(a, h)` junta el guion del paso (por `origenGuia`) con eso; un paso que
  desaparece de la guía deja de verse.
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
- **Escribir el guion desde la mesa** (24-sep-2026, fila 120, `docs/GUION-DESDE-EL-HITO.md`): bajo
  el guion, «+ Añadir un paso a la guía del tipo» (solo si el hito tiene `origenGuia`, su paso sigue
  en la guía y no es una pregunta; nunca en modo consulta) y «+ Añadir un paso solo para este
  asunto» (`guionPropio`, como antes). El primero añade la línea al final del `guion` del paso de la
  guía (fuera de las respuestas, `accion: ''`, sin normativa ni explicación, id de
  `GuiasGuion.normalizar`) con `GuiasDelCentro.cambiarPasos(tipo, fn)` (relee `guias.json`, cambia
  una copia y guarda por `guardarPasos`); como `Hitos.guionDe` lee el paso en vivo, sale en todos
  los asuntos de ese tipo. La biblioteca no se toca. Aviso verde «Añadido a la guía de <tipo
  corto>»; si falla, rojo, y lo escrito vuelve a salir al abrir el cuadro. El aviso de hito sin
  guion dice ya «Añade el primer paso aquí abajo».
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

Se comprueba con `pruebas/hito-mesa.mjs` (a 1905×1000 y 1280×800). Las pruebas que abrían varios
hitos seguidos cierran antes la mesa (`HitoMesa.cerrar()`).

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
