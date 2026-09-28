# Contexto corto — léelo siempre

Se lee en toda conversación y en cada sesión de Claude Code. Es para **decidir**, no para
programar: para eso está `docs/CONTEXTO.md` y sus hijos en `docs/contexto/`. El porqué de las
cosas y el diario están en `docs/HISTORIA.md`. **Máximo 14.000 caracteres** (fila 65, 19-sep-2026:
antes el tope era de líneas, y se esquivaba escribiendo párrafos enteros en una sola línea).

## 0. La regla que no se puede olvidar

Al terminar cualquier instrucción de la cola (`docs/COLA.md`):

- Actualizar este documento y `docs/CONTEXTO.md` (o el hijo de `docs/contexto/` que toque)
  **sustituyendo la línea vieja, no añadiendo una debajo**. Si algo deja de ser verdad, se borra.
- Añadir a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- No dejar que este documento pase de 14.000 caracteres. La sección 5 es una línea por cosa, sin
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
comparten `RegAlum.csv`, que aquí sirve para consultar contacto de alumnado y de sus tutores.

## 4. Las reglas de nombres

- Carpeta de asunto: `AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO] [campos del tipo] [texto libre]
  Tercero`. El tercero va siempre al final.
- Tercero: alumnado `Apellido1 Apellido2, Nombre` + Nº de identificación escolar; personal y
  tutores legales igual + 4 últimos caracteres del documento; empresas **razón social** (nunca el
  nombre comercial) + NIF; Administraciones, nombre corto estable (centros, + su código).
- Documento: `AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext`, con la fecha del propio documento.
- Registro de Séneca: `26EM1234` = año + E/S (entrada/salida) + M/A (serie manual/automática) +
  cuatro dígitos del asiento.
- **No va en el nombre**: el estado del asunto ni la vía de comunicación (cambian mientras se
  tramita; van en `_GESTOR/asuntos.json`).

## 5. Qué está hecho

(Una línea por cosa; el porqué, en `docs/contexto/` y `HISTORIA.md`.)

- Nuevo asunto empieza por la persona (fila 197): buscador único en todas las categorías, con la
  parrilla de tipos limitada a la suya en cuanto se elige (el camino tipo-primero sigue
  existiendo), resumen de la guía en una línea, y nombre de carpeta con vista previa
  (`App.nuevoAsuntoCon` lleva lo ya sabido, sin repreguntarlo). Nombre corto; tipo nuevo al vuelo.
  Dar de alta un tercero lo deja elegido, sin pulsar nada más; crear con guía abre la mesa del
  primer hito.
- Cada tipo dice quién lo encarga (Secretaría, Dirección…): parrilla agrupada, filtro y Cuentas.
- Asuntos reservados (por tipo o uno a uno): candado, sin el tercero en listas y buscador.
- El estado es el primer hito sin terminar («Hito N de M · título», «Hito actual»): Administración o terceros; «Esperando a…» sale solo con el responsable (a mano, hasta que cambia el hito). Guías: «Administración», no personas. Vía y fecha límite.
- Asuntos recurrentes, con aviso. Avisos de fichas huérfanas y papelera vieja: todos juntos, en una sola franja de una línea debajo de la cabecera de Inicio (vencidos, recurrentes, duplicados, papelera, fichero de alumnado, fichas huérfanas, aspirantes; fila 193), cada trozo pulsable, «Ocultar por hoy» los calla todos a la vez.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO por curso académico (selector
  «Curso», carga solo al entrar, la primera vez) y búsqueda por palabras sueltas también en
  documentos, registro de Séneca, ficha y notas.
- Personas (Alumnado): matriculados primero, antiguos plegados; busca por padre, madre o tutor;
  hermanos y sus asuntos en la ficha (se abren pulsando la fila); «+ Nuevo asunto para esta
  persona». La BD de alumnado (carpeta de Drive) suma sus datos:
  ficha, huecos, grupos.
- Cambiar un asunto abierto (le cambia el nombre a la carpeta, sin perder hitos ni presencia); no
  en el ARCHIVO. Cambiar el nombre de un tipo se lleva su guía; cambiarle el tipo a un asunto
  ofrece traer la guía del tipo nuevo. «Unir con otro tipo» (fila 207): el tipo se funde en otro
  (guía, campos, plantillas, recurrentes, alias); sus asuntos abiertos pasan al que se queda, sin
  recibir su guía nueva; el ARCHIVO no se toca.
- Nombre comercial de empresas; cambiar un tercero dado de alta a mano.
- Tutores legales (del RegAlum, sin alta) y Administraciones (organismos y centros, con departamentos) como tercero.
- Guías del procedimiento por tipo, con preguntas dentro de las respuestas sin límite, y su mapa
  (dibujo de la guía entera; en un asunto, con el camino elegido resaltado). Se escriben en
  acordeón: un hito abierto a la vez.
- Panel lateral de lectura; tablón a la vista. Al crear, recuadro con lo que ya tiene el tercero; parada si es idéntico; pantalla "Duplicados".
- Correo y mensaje de Séneca: se prepara; el correo se envía de verdad (Apps Script, con
  confirmación) y nunca dos veces. Avisar a quien lo pide (fila 195): casilla por hito («al
  terminar») y por tipo («al cerrar»), con su plantilla; al marcar el hito hecho o al archivar,
  el cuadro sale relleno, con «Enviar» o «Esta vez no» (no vuelve a preguntar por ese hito).
  «Enviar estado»: en «El encargo» de la ficha y en «···» de la mesa, el mismo cuadro con «Aviso
  de avance» y el hito actual, sin escribir nada. Plantillas «Aviso de avance»/«Aviso de cierre»
  se crean solas, válidas para cualquier tipo. «Preparar informe para dirección» (Cuentas, fila
  196): cuadro sin destinatario, con por-órgano, vencidos, esperando a otros, cerrados desde el
  último informe (`_GESTOR/informes.json`) y tiempo medio.
- "Ver todo" (antes "Por clasificar"; fila 191, se abre desde "Ha llegado" de Inicio): cada documento suelto se abre, se borra, o crea/entra en un asunto (un solo
  botón «Crear asunto con él», que usa lo leído del documento); con tercero reconocido, también
  sugiere guardarlo en uno que ya existe («Guardar aquí»). Tras guardar o crear, se abre directo el
  cuadro de ponerle nombre (no la lista), ya con la fecha, el registro y el tipo de documento (por
  memoria) que se pueda aprovechar de lo leído; «Guardar» cierra el cuadro entero. Encima vive la
  bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y propone tipo, fecha, registro y tercero;
  sus adjuntos pasan también por el cuadro de nombre, uno detrás de otro.
- Aspirante sin Nº escolar: al escribirlo, se renombran sus carpetas. El tope de carpeta y de
  documento cuenta la ruta completa dentro de Dropbox (`Nombres.topes()`), no solo el nombre.
- Botón «Ruta» (`file:///`; ficha, Correo/Séneca): deduce Dropbox; lo de dentro, una vez para el centro. Ficha del tercero: "Datos y contacto" en una línea; «Ver todo» del alumno en
  tarjetas (alumno y tutores). Ficha del asunto (foto, cabecera fija) en tarjetas (una se abre en grande; se vuelve
  pulsando su pestaña; Documentos: 5 nombres como mucho y «y N más»); cabecera en dos líneas.
- Registrar detecta el PDF sellado, y también deja el original en «Versiones previas» como "SIN
  SELLAR" al registrar a mano un fichero distinto (igual que el Word con su PDF); las versiones
  previas quedan plegadas; cada documento, asociable a un hito.
- Terceros relacionados con un asunto (altas por grupo: unidad, nivel, grupo propio), destinatarios de
  correo o Séneca; generar para cada relacionado: un documento por persona y un correo a cada una.
- Menú de la izquierda: Inicio · Nuevo asunto · Archivo · Personas y empresas · Impresos · Cuentas ·
  **Herramientas**, línea, Ajustes. Herramientas (fila 200) es lo que se usa de vez en cuando, no
  un ajuste: Papelera, Traer el alumnado (Séneca y BD de alumnado), Tablas de datos, Restaurar una
  copia de seguridad — los cuatro vivían antes en Ajustes → Mantenimiento.
- Ajustes: tres pestañas y pantalla por tipo; todo plegado, con resumen; avisos de fallo, solo con
  fallo. En El centro, "Días de aviso" (dormidos + vencimiento) y "Copias de seguridad" (con la
  caducidad; la lista para restaurar está en Herramientas) son una sola sección cada una (fila
  200). La pantalla de un tipo lleva arriba una lista de comprobación (Nombre corto, Quién lo
  encarga, Guía, Plantilla de documento/de correo si algún hito las necesita, Plazo, Palabras
  clave, Plazo de conservación), cada línea abre su sección; completa, se pliega en una línea
  verde. Todo se guarda al cambiar, sin botones "Guardar" sueltos (fila 198); el plazo, de solo
  lectura en la tarjeta de la rejilla; los campos propios y calculados, un único sitio para
  crearlos: dentro de cada tipo, "+ Añadir campo".
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa.
  Campos propios por tipo de DOCUMENTO, que entran solos en su nombre.
- Papelera: nada se borra de golpe, con buscador por palabras. Plazo de conservación por tipo: avisa, nunca borra solo.
- Word: lo que falta se pregunta antes; se ve en la app, con «Guardar PDF» (cierra el visor al terminar) e
  «Imprimir» (sin editar aún).
- Plantillas de correo (con texto propio para Séneca) y de Word por tipo, con huecos que se rellenan solos;
  también desde el cuadro de Correo/Séneca; las del centro, sacadas de los documentos del compañero (Mantenimiento). Membrete de la Junta (lo dibuja la app; logo opcional), firma de quien ocupaba
  el cargo en su fecha y «el/la alumno/a» según el sexo de cada persona.
- Tablas de datos (tutorías de Séneca, CSV/Excel) unidas por DNI, con huecos; lo que falta, en amarillo. Certificado de función tutorial
  como el del centro; renuncia a la Junta Electoral, en su hito.
- Copias diarias (90 días) con `_esquema` y verificación tras escribir, detección de fichero roto, fusión de conflictos de Dropbox. Entrada: desplegable de nombres. Un borrado (tipo,
  tipo de documento, recurrente) no reaparece por memoria del otro ordenador.
- Pruebas automáticas en cada subida de código (no con solo `docs/`); en paralelo (`pruebas/ejecutar.mjs`, fila 208). Mientras se trabaja una fila, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs <palabra>`); la pasada completa, una vez al final.
- Copia sin internet (`file://`): se actualiza sola (reintenta si se estaba publicando); si no, franja fija arriba; cada 30 min. La web normal también avisa de versión nueva (fila 178), solo con «Recargar».
- Hitos: cada hito de la guía es un hito de un asunto, con estado, plazo (hábiles, lectivos o naturales), responsable,
  bifurcaciones e historial (si falla su guardado al archivar, se reintenta una vez; el hito no queda huérfano de todas formas). Cada hito se abre a pantalla completa (la mesa), con las acciones solo ahí («Generar documento ▾»,
  «Comunicar ▾», «Registrar») y tres tarjetas: las tareas del hito (lista para marcar; «Detalles:» opcional que deja el cuadro relleno; se marca
  solo al generar, registrar, comunicar o añadir), todos los documentos del asunto («Enviar ▾» por correo o Séneca) y notas.
  Los hitos nuevos de una guía llegan a los asuntos abiertos de su tipo; las tareas se escriben también desde la mesa
  («✎ Cambiar las tareas», sin salir a Ajustes). «Hito N de M», «Hitos N/M» y la mesa, con una sola cuenta.
  Biblioteca de hitos del centro, con sus tareas; en Mantenimiento, cargar tipos, guías y tareas del instituto.
  En el editor de un hito, "Comunicación"/"Documentos" ya no son secciones propias (fila 199): al abrir el
  editor, cada plantilla de documento marcada y el texto de comunicación (correo/Séneca, con plantilla nueva
  si hace falta, sin perder un asunto escrito a mano) se convierten solos en tareas del guion, sin duplicar.
  «Marcar como hecho» abre solo la mesa del hito siguiente en curso (o, sin ninguno, «Archivar el asunto» ahí
  mismo); al completarse las tareas por una acción del usuario, se pregunta una vez por sesión si darlo por hecho.
- "Inicio" (antes "Asuntos abiertos"; fila 209, segunda versión, sobre la fila 191): dos columnas. Izquierda, estrecha: "Ha llegado" (sueltos y correos juntos, compacto) y el tablón, sin esconderse nunca. Derecha: cuatro pestañas —"En Administración" (el hito que le toca a Administración, con o sin fecha; el rojo de vencidos), "En espera" (espera a otro responsable), "Todos los abiertos", "Dormidos"— sobre una sola tabla: Plazo, Tercero (candado si reservado), Tipo, Hito actual, Le toca a, Inicio, y el ⋮ con Copiar el nombre/Archivar. Filtros (Situación/Plazo/Lo encarga/Tipo de asunto/Responsable) y "Ordenar" (gobierna "Todos los abiertos"; las demás llevan su orden natural). El buscador de la cabecera filtra "Ha llegado" y la tabla. Los avisos de la franja de arriba que llevan asuntos detrás (vencidos, aspirantes...) filtran la tabla al pulsarlos, con «Filtrado por: … ✕ Quitar». "Cuentas": por tipo (con tiempos de tramitación), mes y quién los pidió, y los abiertos más antiguos. "Impresos": catálogo buscable;
  "Preparar para el tercero" rellena solo los datos del centro (casillas con nombre legible y miniatura).
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Cada documento, todo en su fila (⧉, «Cambiar el nombre», ⋮); Separar, Unir, Sacar páginas, Ajustar tamaño
  (sello y firma) y Repartir entre terceros, en la barra del visor.
- "Quién lo pide y por qué vía": un único cuadro, tanto en Nuevo asunto como en "El encargo" de la ficha; su
  correo sale en el cuadro de Correo.
- Archivar/reabrir sobre un destino que ya existe fusiona. Crear, reabrir o cambiar deja en la ficha; Volver, a donde estaba.
- Al archivar, la ficha baja a su carpeta (al reabrir, vuelve) y se hace el índice del expediente
  (PDF numerado; también desde el menú de la ficha).

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo la app (`.vercelignore`: sin `docs/` ni `pruebas/`) y pone
  sola la hora de la versión al publicar; la de `js/version.js` (hora real) es la de la copia sin internet.
- **Permiso permanente de Francisco**: un pull request (sesiones desde la nube) lo fusiona Claude
  Code solo, en verde y sin conflictos (nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`.**
- Vercel: 100 publicaciones/día; `vercel.json` salta los commits de solo `docs/`, `pruebas/`, `.github/` o `.md`; máx. dos subidas por fila.
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

## 7. Descartado, no proponer otra vez

- Conector de Vercel sobre un proyecto existente (da 403), o crear otro "por si acaso".
- Abrir la carpeta del asunto en el explorador de archivos, o una hoja de Google Sheets como interfaz.
- Enlazar un correo con `#all/<id de hilo>` (es `#search/rfc822msgid:<id>`), o meter Gmail en un marco (Google no lo permite).
- Esconder el tablón, sacar el DNI de la columna del tutor, o el nombre comercial en la carpeta de una empresa.
- Reescribir módulos y envolturas, o meter los campos del tipo en el nombre de los documentos (son del asunto).
- Rellenar los datos de la PERSONA en un impreso (a propósito: para ver si algo cambió).

## 8. Qué falta

- El compañero: entrar en `https://asuntos.fmargon.com`, señalar sus carpetas de nuevo y coordinar tipos de asunto.
- Envío: pegar el script nuevo (filas 117, 130 y 178), «Nueva versión» y «Probar».
- Ver si la bandeja acierta con el tipo, y si Séneca acepta el largo del asunto.
- Ver con el uso: ancho del panel/tablón, tarjetas, aviso de "falta el DNI".
- Comprobar "Ajustar tamaño" real; asuntos vivos al cambiar curso; cuenta del centro; Ajustes: cargos y Provincia.
- Importar usuarios IdEA del alumnado, al reactivar a Francisco el perfil de Gestor de PASEN.
- Mantenimiento: "Poner en orden las fichas del ARCHIVO", «Cargar plantillas» (50 nuevas), «Traer tareas». Ajustes › Hitos: festivos.
- Antes de junio 2027: "Guardar el contacto de los asuntos abiertos" (Mantenimiento).
- Decisión: ¿la papelera se vacía sola?
- Antes de publicar algo importante, repasar `docs/COMPROBAR-A-MANO.md`.

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice y las reglas comunes; cada zona vive en
su hijo de `docs/contexto/`, que se lee (y se pone al día) al tocarla.
