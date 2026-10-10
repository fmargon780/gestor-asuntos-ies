# Contexto corto — léelo siempre

Se lee en toda conversación y en cada sesión de Claude Code. Es para **decidir**, no para
programar: para eso está `docs/CONTEXTO.md` y sus hijos en `docs/contexto/`. El porqué de las
cosas y el diario están en `docs/HISTORIA.md`. **Máximo 40.000 caracteres** (regla 9 de `docs/COLA.md`; fila 301, 7-oct-2026:
antes 14.000, que ya no se cumplía).

## 0. La regla que no se puede olvidar

Al terminar cualquier instrucción de la cola (`docs/COLA.md`):

- Actualizar este documento y `docs/CONTEXTO.md` (o el hijo de `docs/contexto/` que toque)
  **sustituyendo la línea vieja, no añadiendo una debajo**. Si algo deja de ser verdad, se borra.
- Añadir a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- No dejar que este documento pase de 40.000 caracteres. La sección 5 es una línea por cosa, sin
  números de fila ni fechas: el detalle vive en `HISTORIA.md` y en el documento de cada fila.

## 1. Lo básico

- Dirección publicada: **https://asuntos.fmargon.com** (dominio propio). La red del IES bloquea
  también `vercel.app` y, desde la fila 89, `asuntos.fmargon.com` (de ahí la copia sin internet,
  `docs/COPIA-SIN-INTERNET.md`). `gestor-de-asuntos.vercel.app` sigue viva, para `curl` desde fuera.
- El dominio `fmargon.com` está comprado en la cuenta de Vercel; otras apps irán en subdominios.
- Repositorio: `fmargon780/gestor-asuntos-ies`, rama `main`, privado.
- **Un solo proyecto de Vercel** (`gestor-de-asuntos`). No crear otro.
- **Cada dirección es un sitio distinto para el navegador**: al cambiarla hay que volver a
  señalar las carpetas y entrar. Los ajustes del centro viven en `_GESTOR`.
- Copia de pruebas con datos inventados (fila 222; no es un paso de la cola desde la 242): rama `pruebas`, dirección
  **https://pruebas.fmargon.com** (dominio ya asignado a esa rama en Vercel). «Entrar con datos
  de demostración», o `?demo=1&auto=1` directo: sin señalar ninguna carpeta, nada se guarda, y
  producción nunca la carga.

## 2. Quién es Francisco, y cómo escribirle

Auxiliar administrativo del IES Fuente Lucena (Alhaurín el Grande, Málaga). No es programador:
propone, prueba y dice si el resultado sirve. El diseño y la comprobación del código son de
Claude Code.

- Pocas frases, una idea por frase, sin jerga.
- Una sola pregunta o decisión por mensaje. Esperar su respuesta.
- Si hay que elegir, opciones numeradas con la recomendada marcada.
- No pedirle permiso para cambiar código: aplicarlo. Verificar el propio trabajo.
- Guiarlo por la interfaz paso a paso, diciendo dónde está cada botón.
- Nada de tareas manuales suyas: si se puede hacer desde la app, se hace desde la app.
- Trabaja en un Chromebook Plus, en el navegador. En el trabajo tiene un monitor ancho.
- No trabaja solo: su compañero administrativo también usa la aplicación.
- Textos de pantalla: siempre con las palabras de `docs/VOCABULARIO.md`.

## 3. Qué es esto, y qué no

Es **el gestor de asuntos del centro**: crea, nombra y archiva las carpetas de cada gestión
administrativa, en el Dropbox del centro.

**No es** la base de datos de alumnado (proyecto aparte, `fmargon780/bd-alumnado-ies`). Solo
comparten `RegAlum.csv` y `ALUMNADO-BD.json` (hoy lo hace esa base de datos; después, el Centro de datos: el gestor acepta el de `generado` más reciente).

## 4. Las reglas de nombres

- Carpeta de asunto nueva (fila 239): `AAMMDD A26-0137 TIPO Tercero`, con número único anual de
  asunto, sin año académico, grupo, campos ni texto libre (van a la ficha) y sin recorte. Los asuntos
  de antes conservan `AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO] [campos] [texto libre] Tercero`.
- Tercero: alumnado `Apellido1 Apellido2, Nombre` + Nº de identificación escolar; personal y
  tutores legales igual + 4 últimos caracteres del documento; empresas **razón social** (nunca el
  nombre comercial) + NIF; Administraciones, nombre corto estable (centros, + su código).
- Documento nuevo (fila 239): `AAMMDD TIPO D26-01234.ext`, con la fecha del propio documento y número
  único anual; el registro, los campos y el texto adicional van a la ficha. Los de antes:
  `AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext`. Nombre corto de tipo: 25 caracteres como mucho.
  Nombres de pila de más de 40 caracteres: primero entero y el resto en inicial (solo en carpetas).
  Detalle en `docs/contexto/NOMBRES-FIJOS.md`.
- Registro de Séneca: `26EM1234` = año + E/S (entrada/salida) + M/A (serie manual/automática) +
  cuatro dígitos del asiento.
- **No va en el nombre**: el estado del asunto ni la vía de comunicación (cambian mientras se
  tramita; van en `_GESTOR/asuntos.json`).

## 5. Qué está hecho

(Una línea por cosa; el porqué, en `docs/contexto/` y `HISTORIA.md`.)

- Solo consulta (fila 260): casilla «En este ordenador, solo consultar» en la entrada y en Ajustes → Mantenimiento (`localStorage`, nunca `_GESTOR`); las carpetas van protegidas (`js/solo-consulta.js`, `SoloConsulta.proteger`: rechazan escribir, crear, borrar y mover con error `SoloConsulta`), aviso fijo arriba con «Quitar», controles que cambian algo apagados, ficha siempre en modo consulta.

- Comprobación al entrar (fila 204): marca en la barra lateral («✓ Todo configurado» / «⚠ N por
  configurar») y panel con «Arreglarlo» para las cosas que se configuran una vez por ordenador; al pulsar
  «Entrar» se pide también el permiso de las carpetas recordadas (alumnado, bandeja, Centro de datos;
  `js/permisos-carpetas.js`, fila 318) y sus filas llevan «Dar permiso».
- Nuevo asunto empieza por la persona (fila 197): buscador único en todas las categorías, con la
  parrilla de tipos limitada a la suya en cuanto se elige (el camino tipo-primero sigue
  existiendo), resumen de la guía en una línea, y nombre de carpeta con vista previa
  (`App.nuevoAsuntoCon` lleva lo ya sabido, sin repreguntarlo). Nombre corto; tipo nuevo al vuelo.
  Dar de alta un tercero lo deja elegido, sin pulsar nada más; crear con guía abre la mesa del
  primer hito. El formulario se prepara desde cero cada vez que se entra, sin excepción, desde
  cualquiera de sus seis entradas (fila 220, `App.prepararNuevo`): nunca queda nada de la vez
  anterior, y la pastilla de categoría manda siempre sobre un tercero o tipo que ya no encaje.
- Cada tipo dice quién lo encarga (Secretaría, Dirección…): parrilla agrupada, filtro y Cuentas.
- Asuntos reservados (por tipo o uno a uno): candado, sin el tercero en listas y buscador.
- El estado es el primer hito sin terminar («Hito N de M · título», «Hito actual»): Administración o terceros; «Esperando a…» sale solo con el responsable (a mano, hasta que cambia el hito). Guías: «Administración» y «Secretaría con V.º B.º de Dirección» (fija, id `secretaria-vb-direccion`, fila 234; cuenta también al filtrar por Secretaría o Dirección), no personas. El responsable también puede ser «Una Administración…» dada de alta (`adm:<id>[:<dep>]` + `responsableNombre`; `js/responsable-organismo.js`, fila 205): nunca de Administración, el asunto espera a ese organismo. Vía y fecha límite.
- Asuntos recurrentes, con aviso. Avisos de fichas huérfanas y papelera vieja: todos juntos, en un cuadro pequeño (mide lo que mide su texto, a la derecha de «Ha llegado»; fila 193, fila 212) con vencidos, recurrentes, duplicados, papelera, fichero de alumnado, fichas huérfanas y aspirantes, cada trozo pulsable, y una ✕ que los calla todos a la vez por hoy.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO por curso académico (selector
  «Curso», carga solo al entrar, la primera vez) y búsqueda por palabras sueltas también en
  documentos, registro de Séneca, ficha y notas.
- Personas (Alumnado): matriculados primero, antiguos plegados; busca por padre, madre o tutor;
  hermanos y sus asuntos en la ficha (se abren pulsando la fila); «+ Nuevo asunto para esta
  persona». La BD de alumnado (carpeta de Drive) suma sus datos:
  ficha, huecos, grupos.
- Cambiar un asunto abierto (le cambia el nombre a la carpeta, sin perder hitos ni presencia); no
  en el ARCHIVO. El tercero de «Cambiar el asunto» se elige con el mismo buscador de «Nuevo
  asunto» (fila 219, todas las categorías, con alta desde ahí): sin tocarlo, el tercero no cambia
  aunque no encaje con nadie de las listas de hoy; elegir uno de otra categoría que el tipo solo
  avisa, no bloquea. El tipo de ese cuadro es una línea con «Cambiar» (fila 257, `js/tipo-en-linea.js`):
  caja vacía, hasta 8 tipos parecidos de todas las categorías al escribir, ✕/Esc para dejar el que había y
  «crear» si ninguno encaja; igual en «Nuevo asunto» cuando llega con el tipo reconocido. Cambiar el nombre de un tipo se lleva su guía; cambiarle el tipo a un asunto
  ofrece traer la guía del tipo nuevo. «Unir con otro tipo» (fila 207): el tipo se funde en otro
  (guía, campos, plantillas, recurrentes, alias); sus asuntos abiertos pasan al que se queda, sin
  recibir su guía nueva; el ARCHIVO no se toca. Fila 277: si un tipo es el nombre antiguo de otro (`alias`) y no tiene nada propio, la app los une sola al entrar (`js/tipos-parecidos.js`); si dos tipos solo se parecen, trozo «tipos de asunto parecidos» en el aviso de Inicio, con «Unir» y «No son el mismo» (`_GESTOR/tipos-distintos.json`). Fila 279: crear un tipo o cambiarle el nombre pregunta antes (`TiposParecidos.paraNombreNuevo`/`confirmarNombre`, cuadro «¿Es otro tipo de verdad?»), «Unir con él» si ya existe.
- Nombre comercial de empresas; cambiar un tercero dado de alta a mano, también desde la ficha del asunto: si cambia su NIF o nombre, las carpetas de sus asuntos abiertos y la suya del archivo cambian solas (fila 266).
- Tutores legales (del RegAlum, sin alta) y Administraciones (organismos y centros, con departamentos) como tercero.
- Guías del procedimiento por tipo, con preguntas dentro de las respuestas sin límite, y su mapa
  (dibujo de la guía entera; en un asunto, con el camino elegido resaltado). Se escriben en
  acordeón: un hito abierto a la vez.
- Panel lateral de lectura; tablón a la vista. Al crear, recuadro con lo que ya tiene el tercero; parada si es idéntico; pantalla "Duplicados".
- Correo y mensaje de Séneca: se prepara; el correo se envía de verdad (Apps Script, con
  confirmación) y nunca dos veces; al enviar queda un PDF `CORREO` en el asunto (fila 236). Avisar a quien lo pide (fila 195): casilla por hito («al
  terminar») y por tipo («al cerrar»), con su plantilla; al marcar el hito hecho o al archivar,
  el cuadro sale relleno, con «Enviar» o «Esta vez no» (no vuelve a preguntar por ese hito).
  «Enviar estado»: en «El encargo» de la ficha y en «···» de la mesa, el mismo cuadro con «Aviso
  de avance» y el hito actual, sin escribir nada. Plantillas «Aviso de avance»/«Aviso de cierre»
  se crean solas, válidas para cualquier tipo. «Preparar informe para dirección» (Cuentas, fila
  196): cuadro sin destinatario, con por-órgano, vencidos, esperando a otros, cerrados desde el
  último informe (`_GESTOR/informes.json`) y tiempo medio.
- "Ver todo" (antes "Por clasificar"; fila 191, se abre desde "Ha llegado" de Inicio, entero o solo con correos/solo con documentos —fila 212—, con «Ver también…» para pasar a las dos juntas; fila 214, sustituye del todo a la tabla de asuntos —arriba, sin tener que bajar—, con «← Volver a Inicio» que deja Inicio tal como estaba, misma pestaña y mismo punto de la página): cada documento suelto se abre, se borra, o crea/entra en un asunto (un solo
  botón «Crear asunto con él», que usa lo leído del documento); con tercero reconocido, también
  sugiere guardarlo en uno que ya existe («Guardar aquí»). Tras guardar o crear, se abre directo el
  cuadro de ponerle nombre (no la lista), ya con la fecha, el registro y el tipo de documento (por
  memoria) que se pueda aprovechar de lo leído; «Guardar» cierra el cuadro entero. Encima vive la
  bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y propone tipo, fecha, registro y tercero;
  sus adjuntos pasan también por el cuadro de nombre, uno detrás de otro. Desde un hito (fila 201):
  el cuadro sale con el tipo de documento y el texto adicional (huecos ya rellenos) que tenga ESE
  hito si los tiene, si no los del tipo de documento elegido («Texto por defecto», Ajustes); sin
  hito o sin ninguno de los dos, como antes.
- Aspirante sin Nº escolar: al escribirlo, se renombran sus carpetas. El largo de la ruta
  completa dentro de Dropbox se cuenta con `Nombres.cabeEnRuta` (tope 259, Dropbox real) y se enseña en Ajustes → El centro; en asuntos solo avisa en ámbar, nunca impide crear ni guardar (filas 239 y 263). Al archivar se mide antes la ruta de cada documento en el ARCHIVO: si alguno no cabe, «No cabe en el archivo» deja acortar su nombre ahí mismo; si archivar falla, el aviso dice el paso y el fichero (fila 265).
- Botón «Ruta» (copia la ruta normal, con `\` o `/` según la base, nunca `file:///`; ficha, Correo/Séneca): deduce Dropbox; lo de dentro, una vez para el centro. Ficha del tercero: "Datos y contacto" en una línea; «Ver todo» del alumno en
  tarjetas (alumno y tutores). Ficha del asunto (foto, cabecera fija) en tarjetas (una se abre en grande; se vuelve
  pulsando su pestaña; Documentos: 5 nombres como mucho y «y N más»); cabecera en dos líneas, con hasta 3 datos del tercero junto al nombre («Elegir datos», por clase, fila 272).
- Registrar detecta el PDF sellado, y también deja el original en «Versiones previas» como "SIN
  SELLAR" al registrar a mano un fichero distinto (igual que el Word con su PDF); las versiones
  previas quedan plegadas; cada documento se asocia, se trae y se quita de su hito desde la ficha y desde la mesa de cualquier hito, y la tarea que se marcó con él se queda marcada, con «Desmarcar» (fila 282).
- Terceros relacionados (por unidad, nivel, grupo propio o «Pegar una lista», `js/lista-pegada*.js`) y asunto de grupo (`ficha.grupo`):
  tarjeta «Personas del grupo»: lo generado, registrado y enviado por persona; «Generar para todos» da muestra, barra y el PDF de cada uno con su «Ref.»; los PDF sellados de Séneca se reconocen por esa referencia (`js/grupo-generar.js`, `js/grupo-registro.js`); «Enviar…» manda a todas su PDF registrado y «Enviar un aviso…» un correo sin documento (`js/grupo-enviar*.js`, `js/grupo-avisos.js`).
- Menú de la izquierda: Inicio · Nuevo asunto · Archivo · Personas y empresas · Impresos · Cuentas ·
  **Herramientas**, línea, Ajustes. Herramientas (fila 200) es lo que se usa de vez en cuando, no
  un ajuste: Papelera, Traer el alumnado (Séneca y BD de alumnado), Tablas de datos, Restaurar una
  copia de seguridad — los cuatro vivían antes en Ajustes → Mantenimiento.
- Altura de la lista de Inicio (fila 256): el «scroll anchoring» del navegador la empujaba ~41 px con cada cambio de alto de la franja de avisos o la cabecera. `Navegacion.ponerAltura` y `guardarAltura` (`repintarTodo`, `js/inicio.js`) lo apagan solo mientras dura el regreso/repintado y devuelven la altura; apagarlo siempre rompería la cabecera fija (`pruebas/cabecera-fija.mjs`).
- Actividades extraescolares (fila 306, `js/actividades.js`): `_GESTOR/actividades.json`, tipo con `actividades: true`, asunto de grupo con `ficha.actividad`, tarjeta «La actividad». Fila 309 (`js/actividades-informe.js`): «Avisar al claustro» / «Volver a avisar» genera un informe PDF (tipo INFORME ACTIVIDAD) y abre el cuadro de Correo con él marcado, la plantilla «Aviso de actividad extraescolar» y el grupo del profesorado (Ajustes → El centro, `ajustesAvisos.grupoActividades`) en copia oculta; `ficha.avisosActividad`; huecos `{{ACTIVIDAD…}}`. Fila 310: pantalla «Actividades extraescolares» en Herramientas (`js/actividades-pantalla.js`: tabla, filtros, exportar `js/actividades-exportar.js`) y actividades antiguas (`asunto: null`, `antigua: true`; cuadro `js/actividades-antigua.js`; papelera clase `actividad`). Fila 311: tipo CERTIFICADO ACTIVIDADES EXTRAESCOLARES (`js/actividades-tabla.js`): tabla de datos ACTIVIDADES EXTRAESCOLARES (del registro, una fila por profesor y actividad realizada), huecos `{{TABLA ACTIVIDADES EXTRAESCOLARES}}` y `{{ACTIVIDADES PERIODO}}`, campos «Actividades desde/hasta», plantilla `certificado-actividades-extraescolares`.
- Ficha de una persona (fila 252): cabecera + tarjetas plegables con resumen (`js/ficha-persona.js`, reparto de datos en `js/ficha-persona-reparto.js`; alumnado: Familia y contacto, Sus asuntos, Matrícula, Materias, Trayectoria, Procedencia y NEAE, Datos personales, Otros datos); la usan Personas y empresas y «Ver todo» del alumno; lo abierto se recuerda en `localStorage` (`gestor.fichaPersona.abiertas`).
- Ajustes (fila 288): cuatro pestañas —Lo de cada día, El centro, Este ordenador, Problemas— con buscador («Buscar en Ajustes…»); el reparto es una sola tabla (`js/ajustes-reparto.js`, `js/ajustes-buscador.js`; salto común `App.irASeccionDeAjustes`) y las reparaciones de vez en cuando están en Herramientas → «Puesta a punto y reparaciones». Pantalla por tipo; tipos de asunto y de documento se crean desde una sola caja «Buscar o crear» (fila 250); todo plegado, con resumen; «Problemas» = una tarjeta por problema
  (qué pasa, por qué, qué hacer; fila 291, `js/problemas.js`; fila 292: hitos de un nombre viejo vuelven a su asunto; fila 303: la app enlaza sola los asuntos sin carpeta, también del ARCHIVO — `js/carpetas-perdidas-*.js`). En El centro, "Días de aviso" (dormidos + vencimiento) y "Copias de seguridad" (con la
  caducidad; la lista para restaurar está en Herramientas) son una sola sección cada una (fila
  200). La pantalla de un tipo lleva arriba una lista de comprobación (Nombre corto, Quién lo
  encarga, Guía, Plantilla de documento/de correo si algún hito las necesita, Plazo, Palabras
  clave, Plazo de conservación), cada línea abre su sección; completa, se pliega en una línea
  verde. Todo se guarda al cambiar, sin botones "Guardar" sueltos (fila 198); el plazo, de solo
  lectura en la tarjeta de la rejilla; los campos propios y calculados, un único sitio para
  crearlos: dentro de cada tipo, "+ Añadir campo".
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa; también
  desde la ficha y desde un hito (filas 245, 254 y 255: un campo de un hito es un campo del asunto con la marca `hito`, tarjeta «Campos de este hito» en la mesa, rótulo del hito en la ficha, desplegable «Hito» en Ajustes; `js/campos-de-hito.js`); desde la ficha (filas 245 y 254; tarjeta «Campos del asunto», botón en su título, ventana ancha en columnas): «+ Añadir campo» con «En el tipo» o «Solo en este asunto» (`ficha.camposPropiosDelAsunto`); un campo del asunto que está vacío lleva «Rellenar» (fila 276).
  Un campo propio tiene clase: Texto libre, Lista cerrada, Importe en euros, Número o Fecha (fila 244, `js/campos-clases.js`): se guarda como número/ISO y se ve `1.234,50 €`, `1.234,5`, `01/10/2026`; al cambiar de clase los valores se convierten y lo que no se entiende queda en ámbar.
  Campos propios por tipo de DOCUMENTO, que entran solos en su nombre.
- Papelera: se vacía sola a los 90 días (avisa 7 antes, deja constancia en `papelera-borrados.json`; fila 203), con buscador por palabras. Plazo de conservación por tipo: avisa, nunca borra solo.
- Word: lo que falta se pregunta antes; se ve en la app, con «Guardar PDF» (cierra el visor al terminar) e
  «Imprimir» (sin editar aún).
- Plantillas de correo (con texto propio para Séneca) y de Word por tipo, con huecos que se rellenan solos;
  también desde el cuadro de Correo/Séneca (se abre con la propia del tipo o «Sin plantilla»; «Sin plantilla» se queda; «Guardar como plantilla nueva» convierte lo escrito en plantilla, fila 270; «Convertir en plantilla» en el ⋮ de un Word (o PDF) del asunto, filas 280 y 281); las del centro, sacadas de los documentos del compañero (Mantenimiento). Membrete de la Junta (lo dibuja la app; logo opcional), firma de quien ocupaba
  el cargo en su fecha y «el/la alumno/a» según el sexo de cada persona. Todas juntas en Herramientas → «Plantillas» (fila 320, `js/plantillas-pantalla.js`, `js/plantillas-uso.js`): qué hitos usan cada una, ver, cambiar, sustituir el fichero y borrar. Una plantilla puede estar fuera de uso (fila 321, `fueraDeUso`, `Plantillas.enUso`): no se ofrece, y la tarea de un hito que la lleva no genera. «Retocar» (fila 322, `js/plantilla-retocar*.js`) cambia trozos del texto de una plantilla de Word —por otro texto, por un dato, o quita el párrafo— y guarda un fichero nuevo sin borrar el anterior.
- Tablas de datos (tutorías de Séneca, Consejo Escolar —por nombre, fila 238—, CSV/Excel) unidas por DNI, con huecos; lo que falta, en amarillo. Certificado de función tutorial
  como el del centro; renuncia a la Junta Electoral, en su hito.
- Copias diarias (90 días) con `_esquema` y verificación tras escribir, detección de fichero roto, fusión de conflictos de Dropbox. Entrada: desplegable de nombres. Un borrado (tipo,
  tipo de documento, recurrente) no reaparece por memoria del otro ordenador.
- Pruebas automáticas en cada subida de código (no con solo `docs/`); en paralelo (`pruebas/ejecutar.mjs`, fila 208). Mientras se trabaja una fila, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs <palabra>`); la pasada completa, una vez al final, antes de fusionar en `main` (el código pasa antes por el revisor, en local, fila 242).
- Versión nueva (fila 325): la copia sin internet (`file://`) se actualiza sola al abrir si tiene permiso sobre su carpeta y, si no, al pulsar «Entrar» (pide el permiso, baja la versión, recarga y entra sola; `ActualizarCopia.alEntrar`). Con la aplicación abierta, en la copia y en la web, sin franja: marca «hay versión nueva» junto al número de versión (`js/marca-version.js`), que pregunta antes de recargar. La franja ámbar solo sale si algo falla.
- Hitos: cada hito de la guía es un hito de un asunto, con estado, plazo (hábiles, lectivos, naturales o meses; fila 284), responsable,
  bifurcaciones e historial (si falla su guardado al archivar, se reintenta una vez; el hito no queda huérfano de todas formas). Cada hito se abre a pantalla completa (la mesa), con las acciones solo ahí («Generar documento ▾»,
  «Comunicar ▾», «Registrar») y tres tarjetas: las tareas del hito (lista para marcar; «Detalles:» opcional que deja el cuadro relleno; se marca
  solo al generar, registrar, comunicar o añadir), todos los documentos del asunto («Enviar ▾» por correo o Séneca) y notas.
  Los hitos nuevos de una guía, y su orden nuevo (solo los sin hacer; fila 300), llegan a los asuntos abiertos de su tipo. Sin frases al pie (fila 224): una
  caja «Nueva tarea…», y cada tarea lleva su «⋮» (Anotar, con 💬; Cambiar; Borrar; Abrir en la guía, o Pasar a la guía si es «solo aquí»).
  Todo cambio de hitos o tareas desde un asunto pregunta antes «¿Dónde se guarda?» (fila 235): «A la guía de <tipo>» (marcada, dice a cuántos
  abiertos llega) o «Solo en este asunto»; el aviso verde de después lleva «Deshacer». Un hito solo de este asunto se lleva entero a la guía
  con sus tareas. «Hito N de M», «Hitos N/M» y la mesa, una sola cuenta. Atajo (fila 267): «Generar documento» en la tarjeta de documentos de la ficha abre el hito actual con su menú abierto. El correo de un hito va al tutor/a del grupo (fila 299, tabla TUTORIAS; «Buenas:»), y una plantilla puede adjuntar sola un documento.
  Biblioteca de hitos del centro, con sus tareas; en Mantenimiento, cargar tipos, guías y tareas del instituto.
  Cada hito de una guía dice de dónde viene, siempre a la vista: etiqueta «De la biblioteca», «De la biblioteca ·
  cambiado aquí» o «Propio de este tipo» (fila 202); pulsarla enseña el modelo y «Ver en la biblioteca». Al
  escribir el título de un hito nuevo, si se parece a uno de la biblioteca lo dice con «Usarlo»; al guardar uno
  cambiado esta vez (fila 297), una pregunta por hito cambiado, con su título y lo cambiado («Antes · Ahora», y «En la
  biblioteca» si difiere), con «Cancelar» · «Solo aquí» · «También en la biblioteca» (cancelar vuelve a la guía); «Guardar en la biblioteca» avisa si ya hay uno parecido. El texto para los documentos de un hito o de un
  tipo de documento avisa si otro sitio ya tiene el mismo texto, y ofrece copiarlo.
  En el editor de un hito, "Comunicación"/"Documentos" ya no son secciones propias (fila 199): al abrir el
  editor, cada plantilla de documento marcada y el texto de comunicación (correo/Séneca, con plantilla nueva
  si hace falta, sin perder un asunto escrito a mano) se convierten solos en tareas del guion, sin duplicar.
  «Marcar como hecho» abre solo la mesa del hito siguiente en curso (o, sin ninguno, «Archivar el asunto» ahí
  mismo); al completarse las tareas por una acción del usuario, se pregunta una vez por sesión si darlo por hecho.
  Desde la mesa, en «Hito ▾» (fila 206, texto puesto al día en la 224): Crear, Cambiar y Borrar (apagado con
  trabajo apuntado, `HitosDesdeElAsunto.estaVacio`), cada uno con «Colocar después de» (nivel superior del
  asunto), «Explicación» del hito con viñetas (fila 228; Crear y Cambiar) y «¿Dónde se guarda?» («A la guía de
  <tipo>», marcada, o «Solo en este asunto»): a la guía, llega a los asuntos abiertos del tipo, pero solo a los
  hitos vacíos; uno con trabajo no se toca.
- Plazos legales en la biblioteca (fila 284, `docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md`): un modelo de la biblioteca guarda `plazo.dias` y `plazo.cuenta` con el «desde» vacío; al llegar a una guía (`HitosBiblioteca.modeloAPaso(modelo, idDelDeArriba)`) cuenta desde el hito de arriba, y sin ninguno encima llega sin plazo. «Meses» (`Plazos.sumarPlazo`: mismo día del mes, último día si no existe, y si no es hábil el siguiente). `js/plazos-del-centro.js` (`PlazosDelCentro.pasada`) corre sola una vez al entrar (marca `plazosDelCentro` en `hitos-biblioteca.json`; el botón de Mantenimiento la fuerza): añade los 7 modelos `b-comun-…`, pone el plazo a los modelos y pasos de guía que no lo tengan (tabla `plazosPorTipo` del JSON para el «desde»), sin subir ninguna `revision` ni tocar asuntos abiertos. Prueba: `pruebas/plazos-del-centro.mjs`.
- «Hacer este hito» (fila 285, `docs/HACER-ESTE-HITO.md`): botón de la cabecera de la mesa (`js/hacer-este-hito.js`, `HacerEsteHito`) que recorre las tareas pendientes con acción: `generar` (`PlantillasDocumento.generar` con `opciones.alAbrirVisor`, el PDF se guarda solo con `WordVisor.guardarPdfAhora`), `registrar` (se para: `cadena` = `esperando-sello` en el hito, franja verde en el visor) y `comunicar` (`HitosComunicar.comunicar` con `adjuntos` y `cerrarTexto: 'Todavía no'`; espera a que se cierre #capa; sin enviar, `listo-para-enviar`). Al acabar da el hito por hecho por la casilla de siempre (sin la pregunta de «ya está completo»: `HacerEsteHito.enCurso`). El PDF sellado se reconoce sin preguntar (`js/hacer-este-hito-sello.js`, `RegistroSellado.asociar` devuelve ahora el nombre; pasada de fondo por `Gestor.alRefrescar`, también al pintar `ficha-sellos.js`) solo sin dudas; aviso «N listos para enviar» (`AvisosLinea`) y coletillas en «Hito actual». `Hitos.normalizarHito` conserva `cadena` (y la suelta al estar hecho). Pruebas: `pruebas/hacer-este-hito.mjs` y `pruebas/hacer-este-hito-sello.mjs`.
- Esperas que se cierran (fila 286, `docs/ESPERAS-QUE-SE-CIERRAN.md`, `js/esperas.js`, `Esperas`): hito de espera = hito actual con `App.ladoDe(a).lado === 'terceros'`. El cuadro de nombre de un documento que ENTRA (`modo 'anadir'` o `ponerNombre`, no el PDF sellado de un registro) lleva la casilla marcada «Es lo que se esperaba. Termina la espera de «…»» (`Esperas.casillaHTML`, desde `js/documentos-formulario.js`); al guardar (`Esperas.alGuardar`, desde `js/documentos-guardar.js`) apunta el documento al hito, marca su tarea de añadir y da el hito por hecho por `HitosPanelLista.marcarDesdeCasilla` con una casilla suelta, con aviso «Espera terminada…» y «Deshacer»; con algo obligatorio pendiente, ámbar. En una tanda solo el primero (se reinicia al cerrarse #capa). «No ha llegado nada» en la mesa de un hito de espera con la fecha pasada: nota «Venció el … sin respuesta.», hecho + `sinRespuesta` (la conserva `normalizarHito` solo si el hito está hecho; se escribe tras darlo por hecho) y «Hecho · sin respuesta» en la mesa, la lista y la exportación. Prueba: `pruebas/esperas.mjs`.
- Perfil directivo (fila 287, `js/perfil.js`): `_GESTOR/perfiles.json` (nombre → perfil y correo; sin entrada = Administración). Un directivo va protegido como «solo consultar» (`SoloConsulta.activo()` lo cuenta; `Perfil.escribir(fn)`, única puerta para escribir) y ve solo Inicio, Archivo y lo de su órgano (`Perfil.veAsunto`). Se pone en Ajustes → El centro → «Quién usa la aplicación». Demo: `&usuario=<nombre>`, o `Demo.entrarComo(nombre)` sin recargar. Prueba: `pruebas/perfil.mjs`.
- Encargos y notas de directivos (filas 289 y 290, `docs/ENCARGOS-DE-DIRECTIVOS.md`, `docs/NOTAS-DE-DIRECTIVOS.md`, `js/encargos*.js`, `js/notas-directivos.js`): el directivo (menú «Nuevo encargo» y «Mis encargos») deja el encargo en `_GESTOR/encargos.json` (estados `sin-atender`, `asunto`, `terminado`, `no-procede`, `retirado`; documentos en `_GESTOR/encargos/<id>/`) por `Perfil.escribir`. Llega a «Ha llegado» → «Ver todo»: Administración lo convierte en asunto (`ficha.encargos`, nota «Encargo de …»), lo guarda en uno que existe o dice «No procede»; archivar, reabrir, papelera y recuperar mueven su estado. Además, en la tarjeta «Notas» de un asunto suyo, el directivo escribe una nota con documentos (nota de `ficha.notas` con `deDirectivo: true`, `organo`, `documentos`, `carpeta`; documentos en `_GESTOR/notas-directivos/<carpeta>/`); a Administración le sale «N notas de directivos» en el cuadro de avisos, una marca en la fila de Inicio y, en la ficha, la nota resaltada y arriba con «Vista» (`vistaPor`, `vistaEl`) y «Guardar en el asunto» por documento; archivar con notas sin ver pregunta antes. Pruebas: `pruebas/encargos.mjs`, `pruebas/notas-de-directivos.mjs`.
- **Por liquidar** (fila 249, `docs/POR-LIQUIDAR.md`, `js/por-liquidar.js` y `js/por-liquidar-liquidar.js`): casilla por tipo
  «Al terminar, pasa a «Por liquidar» en vez de archivarse» (`tipo.liquidar`, Ajustes → tipo → «Al terminar el asunto», fila 274). Un asunto de esos tipos, en vez de archivarse, pasa a
  `ficha.porLiquidar = { desde, auto }` (botón «Pasar a Por liquidar» en la ficha y el ⋮ de la tabla, o solo, al dar por hecho
  su último hito, con «Deshacer»; `auto` vuelve solo a su pestaña si un hito se desmarca o se añade). Quinta pestaña de Inicio
  «Por liquidar» (solo si hay tipos con la casilla), con casillas, «Marcados: N asuntos · Total: X €» (primer campo propio de
  clase Importe del tipo) y «Liquidar»: cuadro (fecha, Entrega, Recibe = quien ocupa Secretaría, nota) que guarda en cada
  asunto el PDF `AAMMDD LIQUIDACION D26-…pdf` (tipo de documento LIQUIDACION, pdf-lib, con membrete), apunta la línea en el
  registro y archiva por `App.cerrarAsunto` sin preguntar. Sale de «En Administración», «En espera» y «Dormidos»; filtro de
  Situación «Por liquidar» y columna de exportar «Por liquidar desde». Fila 253: una sola regla (`PorLiquidar.revisar`): un asunto
  abierto de un tipo con la casilla y sin ningún hito por hacer (o sin hitos) pasa solo (`auto`) al cambiarle el tipo
  (`alCambiarTipo`, «Cambiar el asunto»), al marcar la casilla en Ajustes o unir tipos (`alMarcarCasilla`, un aviso «N asuntos pasan
  a Por liquidar.» con «Deshacer») y en una pasada al entrar (`alEntrar`, sin aviso, nunca con un guardado en marcha). Quitar la
  casilla no saca a nadie.
- "Inicio" (antes "Asuntos abiertos"; fila 212, tercera versión, sobre la fila 209): sin columna izquierda, a todo el ancho. Justo debajo de la cabecera, una fila: a la izquierda «Ha llegado: N correos · N documentos por clasificar» (cada trozo abre «Ver todo» solo con esa mitad, con «Ver también…» para volver a las dos; el número de documentos se resalta si hay alguno nuevo); a la derecha, el cuadro de avisos. El tablón (compacto: una línea para escribir, hasta tres notas, «y N más»/«Ver las hechas» las despliega por encima de la página) vive en la propia cabecera, entre «+ Nuevo asunto» y el buscador. Debajo, cuatro pestañas —"En Administración" (el hito que le toca a Administración, con o sin fecha; el rojo de vencidos), "En espera" (espera a otro responsable), "Todos los abiertos", "Dormidos"— sobre una sola tabla: Plazo, Tercero (candado si reservado), Tipo, Hito actual, Le toca a, Inicio, y el ⋮ con Copiar el nombre/Archivar. Filtros (Responsable/Situación/Plazo/Lo encarga/Tipo de asunto), valen en las cuatro pestañas, plegado al entrar («Filtros (N)» si hay alguno puesto), y "Ordenar" (gobierna "Todos los abiertos"; las demás llevan su orden natural). El buscador de la cabecera filtra "Ha llegado" y la tabla. Los avisos del cuadro que llevan asuntos detrás (vencidos, aspirantes...) filtran la tabla al pulsarlos, con «Filtrado por: … ✕ Quitar». "Cuentas": por tipo (con tiempos de tramitación), mes y quién los pidió, y los abiertos más antiguos. "Impresos": catálogo buscable;
  "Preparar para el tercero" rellena solo los datos del centro (casillas con nombre legible y miniatura).
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Cada documento, todo en su fila (⧉, «Cambiar el nombre», ⋮); Separar, Unir, Sacar páginas, Ajustar tamaño
  (sello y firma) y Repartir entre terceros, en la barra del visor.
- "Quién lo pide y por qué vía": un único cuadro, tanto en Nuevo asunto como en "El encargo" de la ficha; su
  correo sale en el cuadro de Correo. El contacto apuntado (`LoPide.contactoDe`: gana lo escrito a mano a lo del fichero)
  se ve junto a «Lo pide: …» en la cabecera del asunto y del hito, con botón de copiar (`js/contacto-a-la-vista.js`, fila 305).
- Archivar/reabrir sobre un destino que ya existe fusiona. Crear, reabrir o cambiar deja en la ficha; Volver, a donde estaba.
- Al archivar, la ficha baja a su carpeta (al reabrir, vuelve) y se hace el índice del expediente
  (PDF numerado; también desde el menú de la ficha).
- Copia de pruebas (fila 222, `docs/COPIA-DE-PRUEBAS.md`): rama `pruebas`, con «Entrar con datos
  de demostración» (disco de mentira en memoria, datos inventados creados con las mismas
  funciones de las pantallas); «Volver a empezar» deja todo como al principio. En producción no
  se carga nada de `js/demo/` salvo el guion que decide si toca.
- Botón «Soporte» (fila 213, `docs/BOTON-DE-SOPORTE.md`): abajo a la derecha, en todas las pantallas;
  manda «Algo no funciona» / «Propongo una mejora» (texto, captura opcional, pantalla, quién, versión,
  últimos errores) a un script de Google (`apps-script/soporte.gs`) cuya dirección se pone en Ajustes →
  El centro (`ajustesAvisos.urlSoporte`). Guarda el aviso en Drive y apunta una IDEA sin datos del
  usuario en la cola. Texto sin límite (fila 240). Desde la fila 269 pide una vez (`localStorage` `gestor-soporte-correo`) el correo de quien avisa. Pendiente de Francisco: `docs/PONER-EN-MARCHA-SOPORTE.md`. El mismo script lleva el **vigilante** (`docs/VIGILANTE-Y-CORREOS.md`).
- «Qué hay de nuevo» (fila 248): `js/novedades.js` (lista `window.NOVEDADES`, lo más nuevo primero) y `js/novedades-ventana.js`; al entrar sale lo que este ordenador no ha visto (`localStorage` `gestor.novedadesVistas`), y el número de versión de la barra lateral la vuelve a abrir.
- **Centro de datos (fila 312, `docs/BEBER-DEL-CENTRO-DE-DATOS.md`)**: Ajustes → Este ordenador señala la carpeta «CENTRO DE DATOS» de Drive (solo lectura); al entrar se coge lo nuevo de su `indice.json` por la importación de siempre y se apunta en `_GESTOR/centro-de-datos.json`; su `configuracion.json` (filas 313 y 316) copia datos del centro, firma y buzón de soporte, sin poder cambiarlos en Ajustes. Contrato 2 (fila 317): `elegir` decide qué entradas coge (curso actual, personal todo, `ocupado` no coge). Herramientas → «Traer el alumnado» enseña «Lo que tengo ahora» (fila 319, `js/datos-que-tengo*.js`): fecha y hora de cada fichero de alumnado y personal, cuántos, por dónde llegó (`_GESTOR/datos-origen.json`) y si hay otro más nuevo.
- **Control del registro (fila 259, `docs/CONTROL-DEL-REGISTRO.md`)**: Herramientas → «Control del registro»: se suben los listados CSV de Séneca (entrada y salida, Latin-1) y se ven los **apuntes** sin asunto desde la fecha «Revisar desde»; decisiones «No necesita asunto» / «Esta clase nunca lleva asunto» / «Es de este asunto…»; avisos en Inicio (`AvisosLinea` «registro-sin-asunto» y «registro-atrasado», días en Ajustes → Días de aviso, `ajustesAvisos.diasRegistro`, 7). Código en `js/control-registro*.js`.

## 6. Reglas de código que no se pueden olvidar

- Para **ofrecer** plantillas, siempre `Plantillas.deTipo` o `Plantillas.documentosDeTipo` (dejan fuera las que no están en uso); `datos.lista` y `datos.documentos` a pelo, solo para encontrar una por su `id`. Un cuadro que cambia una plantilla conserva las claves que no conoce (fila 321).
- Quien copie un fichero de datos a `_GESTOR/datos` lo apunta con `DatosQueTengo.apuntar` (fila 319).
- Nada recarga la página sin una pulsación de quien la usa, salvo la actualización de la copia antes de entrar. Un aviso de versión nueva es la marca (`MarcaVersion.poner`), nunca una franja (fila 325).
- Una carpeta recordada sin permiso se arregla pidiendo el permiso sobre ella (`PermisosCarpetas.pedir`), nunca mandando a señalarla otra vez (fila 318).
- Un campo de fecha que guarda sin botón se engancha con `U.alTerminarFecha`, nunca con `change` (fila 314).
- Todo código nuevo que escriba en las carpetas **de fondo** (sin que lo pida un botón) mira antes `SoloConsulta.activo()` y se salta (fila 260).
- El repositorio es la versión buena; Vercel publica solo la app (`.vercelignore`: sin `docs/` ni `pruebas/`) y pone
  sola la hora de la versión al publicar; la de `js/version.js` (hora real) es la de la copia sin internet.
- **Permiso permanente de Francisco**: una petición de cambios hacia `main` tras la aprobación del
  revisor la fusiona Claude Code solo, sin esperar a nadie (`CLAUDE.md`, rama de la fila).
- **Una fila es HECHA solo con las dos cosas** (fila 242): su commit está en `main` (`git merge-base --is-ancestor`) y Vercel lo ha publicado (`curl` a `js/version.js`, estado «Vercel» del commit o `list_deployments`).
- Vercel: 100 publicaciones/día; `vercel.json` salta los commits de solo `docs/`, `pruebas/`, `.github/` o `.md`; una sola publicación de código por fila (la de `main`, tras el revisor en local).
- Antes de colgar una función de `App`, mirar que el nombre esté libre. Un solo cuadro (`U.preguntar`) a la vez.
- Ojo con `p.campos`: solo trae columnas con datos; para saber si existe, mirar la cabecera del CSV.
- Un módulo nuevo **no envuelve**: se engancha por un punto previsto (`window.Gestor.alRefrescar`) o uno nuevo. Sin remedio, con `U.envolver`, apuntado en `js/envolturas-esperadas.js`.
- Principal y accesorio por separado: rojo si falla lo principal (`U.fallo`), verde si sale, ámbar
  si falla algo de después (`U.accesorio`); siempre `U.mensajeDeError`. `U.mientrasGuarda` solo
  alrededor de la escritura.
- Tras guardar se repinta solo lo que ha cambiado y está a la vista; todo repintado asíncrono
  lleva contador de turno (el último gana).
- Un bloque que se repinta solo nunca puede tirar lo que se está escribiendo, ni el foco, ni el
  cursor: envolver el repintado en `U.conservandoLoEscrito(raiz, fn)`.
- Ningún fichero de `js/` pasa de 600 líneas: se parte por temas, con el estado común en `X._interno`.
- Todo guardado de `_GESTOR` pasa por la cola por fichero (`ColaGuardado`: asuntos, hitos, tablón,
  CSV de terceros, índice, borrados); nunca `Copias.guardar` directo de `asuntos.json`.
  Ninguna tarea de fondo escribe ni mira la carpeta con un guardado en marcha.
- Renombrar, unir o borrar un asunto (su clave cambia o desaparece) solo por `AsuntoRenombrar`
  (`js/asunto-renombrar.js`): mueve a la vez la ficha, sus hitos y su señal de presencia.
- Las listas de la ficha (`hilos`, `relacionados`, `pendientesRegistro`, `notas`) se funden por
  elemento con `App.anotarLista`, nunca se sustituyen enteras; un asunto cerrado (archivado, a la
  papelera, unido o renombrado) lleva una lápida en `borrados-listas.json` y no se puede resucitar
  sin revivirla antes (fila 176).
- Novedades visibles (fila 248): al terminar una fila que cambia algo que se ve en pantalla, añade su línea al principio de `js/novedades.js` en el mismo commit del código; si no cambia nada visible, no se añade.

## 7. Descartado, no proponer otra vez

- Conector de Vercel sobre un proyecto existente (da 403), o crear otro "por si acaso".
- Abrir la carpeta del asunto en el explorador de archivos, o una hoja de Google Sheets como interfaz.
- Enlazar un correo con `#all/<id de hilo>` (es `#search/rfc822msgid:<id>`), o meter Gmail en un marco (Google no lo permite).
- Esconder el tablón, sacar el DNI de la columna del tutor, o el nombre comercial en la carpeta de una empresa.
- Reescribir módulos y envolturas, o meter los campos del tipo en el nombre de los documentos (son del asunto).
- Rellenar los datos de la PERSONA en un impreso (a propósito: para ver si algo cambió).
- Mudar el Gestor a Google Apps Script para esquivar el filtro de la red del centro: una página servida por Google no puede abrir carpetas del disco (idea 325).

## 8. Qué falta

- El compañero: entrar en `https://asuntos.fmargon.com`, señalar sus carpetas de nuevo y coordinar tipos de asunto.
- Envío: pegar el script nuevo (filas 117, 130, 178 y 210), «Nueva versión» y «Probar».
- Ver si la bandeja acierta con el tipo, y si Séneca acepta el largo del asunto.
- Ver con el uso: ancho del panel/tablón, tarjetas, aviso de "falta el DNI".
- Comprobar "Ajustar tamaño" real; asuntos vivos al cambiar curso; cuenta del centro; Ajustes: cargos y Provincia.
- Importar usuarios IdEA del alumnado, al reactivar a Francisco el perfil de Gestor de PASEN.
- Mantenimiento: "Poner en orden las fichas del ARCHIVO", «Cargar plantillas» (50 nuevas), «Traer tareas». Ajustes › Hitos: festivos.
- Antes de junio 2027: "Guardar el contacto de los asuntos abiertos" (Mantenimiento).
- Antes de publicar algo importante, repasar `docs/COMPROBAR-A-MANO.md`.

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice y las reglas comunes; cada zona vive en
su hijo de `docs/contexto/`, que se lee (y se pone al día) al tocarla.
