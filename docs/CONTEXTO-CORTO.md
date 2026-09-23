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
- **Cada dirección es un sitio distinto para el navegador**: permisos e identidad se guardan por
  dirección, así que al cambiar de dirección hay que volver a señalar las carpetas (y la bandeja
  de correos) y entrar de nuevo. Los ajustes del centro no se pierden: viven en `_GESTOR`.

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

## 3. Qué es esto, y qué no

Es **el gestor de asuntos del centro**: crea, nombra y archiva las carpetas de cada gestión
administrativa, en el Dropbox del centro.

**No es** la base de datos de alumnado (proyecto aparte, `fmargon780/bd-alumnado-ies`). Solo
comparten `RegAlum.csv`, que aquí sirve para consultar contacto de alumnado y de sus tutores.

## 4. Las reglas de nombres

- Carpeta de asunto: `AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO] [campos del tipo] [texto libre]
  Tercero`. El tercero va siempre al final.
- Tercero: alumnado `Apellido1 Apellido2, Nombre` + Nº de identificación escolar; personal
  igual + 4 últimos caracteres del documento; empresas **razón social** (nunca el nombre
  comercial) + NIF.
- Documento: `AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext`, con la fecha del propio documento.
- Registro de Séneca: `26EM1234` = año + E/S (entrada/salida) + M/A (serie manual/automática) +
  cuatro dígitos del asiento.
- **No va en el nombre**: el estado del asunto ni la vía de comunicación (cambian mientras se
  tramita; van en `_GESTOR/asuntos.json`).

## 5. Qué está hecho

(Una línea por cosa. El cómo y el porqué de cada una están en `docs/contexto/` y en `HISTORIA.md`.)

- Categoría → tipo → tercero → nombre de carpeta, con vista previa. El nombre corto del tipo, en carpeta, filtros y tarjeta.
- Estado del asunto, vía de comunicación preferente y fecha límite.
- Asuntos recurrentes, con aviso y creación manual.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO y búsqueda por palabras
  sueltas también en documentos, registro de Séneca, ficha y notas.
- Editar un asunto abierto (renombra su carpeta, sin perder hitos ni presencia); no en el ARCHIVO.
  Al cambiar el tipo, ofrece la guía del nuevo.
- Nombre comercial de empresas, aparte de la razón social; cambiar los datos de un tercero dado
  de alta a mano.
- Guías del procedimiento por tipo, con pasos y preguntas dentro de las respuestas, sin límite.
- Panel lateral de lectura, y tablón de notas rápidas siempre visible.
- Correo y mensaje de Séneca preparados (la app nunca envía nada); el ayudante de Séneca dice
  por su nombre quién falta.
- "Por clasificar": cada documento suelto se abre, se borra, o crea/entra en un asunto; con
  tercero reconocido, también sugiere meterlo en uno que ya existe («Meter aquí»). Encima vive la
  bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y propone tipo, fecha, registro y tercero.
- Aspirantes a plaza dados de alta sin Nº de identificación escolar: al escribirlo, se renombran
  solas las carpetas de sus asuntos abiertos.
- Botón «Ruta» en la ficha: copia la ruta de su carpeta.
- Ficha del tercero con "Datos y contacto" en una línea, cada dato con su copiar; ficha del
  asunto a tres columnas, con cabecera agrupada por el momento del trámite y menú de tres puntos.
- Registrar un documento detecta el PDF ya sellado, lo renombra y guarda el original como
  "SIN SELLAR"; cada documento se puede asociar a un hito.
- Terceros relacionados con un asunto, con altas por grupo (unidad, nivel, grupo propio), que
  también sirven de destinatarios de un correo o de un mensaje de Séneca.
- Parada al crear un asunto duplicado, y pantalla propia "Duplicados".
- Ajustes con tres pestañas; pantalla propia de cada tipo, con sus ocho secciones a la vista.
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa.
  Campos propios por tipo de DOCUMENTO, que entran solos en su nombre.
- Papelera: nada se borra del todo a la primera.
- Mandar documentos de un asunto por correo, con un borrador que deja Apps Script en Gmail.
- Plantillas de correo y de documento de Word por tipo de asunto, con huecos que se rellenan
  solos; el centro ya tiene sus textos (`plantillas/`), cargados con un botón en Mantenimiento.
  El documento sale con membrete y con la firma de quien ocupaba el cargo, en su fecha.
- Copias diarias (caducan a los 90 días, configurable), detección de fichero roto, fusión de
  conflictos de Dropbox. Entrada: desplegable con los nombres ya usados. Un borrado (tipo, estado,
  tipo de documento, recurrente) no reaparece por memoria del otro ordenador.
- Pruebas automáticas en GitHub Actions en cada subida.
- Escape y salida en toda pantalla.
- Copia sin internet (`file://`): "copia sin internet" a la vista, se actualiza sola; si no puede, franja arriba con «Actualizar ahora».
- Hitos: los pasos de la guía son los hitos de un asunto, con estado, plazo, responsable,
  bifurcaciones, documentos, historial, "lo que hay que reunir" y "Comunicar". Biblioteca de
  hitos del centro: modelos reutilizables entre tipos, con normativa y marca "solo informativo".
  Botón en Mantenimiento para cargar los tipos y guías del instituto.
- "Qué me toca": hitos pendientes, filtro por responsable, bloque "Dormidos" (sin novedades en N
  días). "Cuentas": asuntos por tipo, mes y quién los pidió. "Formularios": catálogo buscable de
  impresos; "Preparar para el tercero" rellena en el PDF solo los datos del centro.
- Avisos de "fichas sin carpeta" (✕ que calla 7 días) y de la papelera vieja, en Asuntos abiertos.
  Pulsar la tarjeta de un documento (Por clasificar, un asunto, correos, papelera) lo abre, sin botón.
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Separar, Unir, Sacar páginas y Ajustar tamaño de un PDF, en la carpeta del asunto y en Por
  clasificar; Ajustar tamaño deja libre la banda del sello de Séneca y de la firma del director.
- "Lo pide": quién ha pedido la gestión, por qué vía y en qué fecha, con el correo ya puesto al
  preparar el cuadro de Correo.
- Archivar o reabrir cuando el destino ya existe fusiona las dos carpetas sin perder nada; los
  errores del navegador salen siempre traducidos al castellano. Archivar desde la ficha no se
  confunde con "otro ordenador"; si Dropbox tropieza, se reintenta sola.
- De la ficha de un asunto solo se sale al Volver, Editar, Archivar/Reabrir o Borrar; lo demás (guardar, hitos, comunicar...) se queda en su sitio.
- Cabecera de cada pantalla fija al bajar y encogida sin temblar.
- Renombrar, unir o borrar un asunto mueve también sus hitos y su señal de presencia; el registro
  de asuntos siempre relee del disco antes de escribir.
- Al archivar, la ficha del asunto baja a su propia carpeta (no se queda en `asuntos.json` para
  siempre); al reabrir, vuelve. Botón "Poner en orden las fichas del ARCHIVO" en Ajustes →
  Mantenimiento para los archivados de antes.
- Ficha del asunto: foto del contacto del tercero, que se sigue viendo si sale del CSV.

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo. Un solo proyecto de Vercel.
- **Permiso permanente de Francisco**: cuando el trabajo vaya por pull request (sesiones desde la
  nube), Claude Code lo fusiona solo en cuanto esté en verde y sin conflictos. No hace falta
  esperar a que Francisco lo haga a mano (ver la nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`**, nunca darla por hecha.
- Vercel publica máximo 100 veces/día (gratuito): `vercel.json` salta los commits que solo tocan `docs/`, `pruebas/`, `.github/` o `.md`; máximo dos subidas por fila (regla 13).
- Antes de colgar una función nueva de `App`, comprobar que el nombre no está cogido. Un solo cuadro de diálogo (`U.preguntar`): no abrir un segundo mientras el primero espera.
- Ojo con `p.campos`: solo trae columnas con datos; para saber si existe, mirar la cabecera del CSV.
- Un módulo nuevo **no envuelve**: se engancha por un punto previsto (`window.Gestor.alRefrescar`) o uno nuevo. Sin remedio, con `U.envolver`, apuntado en `js/envolturas-esperadas.js`.
- Principal y accesorio por separado: rojo si falla lo principal (`U.fallo`), verde si sale, ámbar
  si falla algo de después (`U.accesorio`); siempre `U.mensajeDeError`. `U.mientrasGuarda` solo
  alrededor de la escritura.
- Tras guardar se repinta solo lo que ha cambiado y está a la vista; todo repintado asíncrono
  lleva contador de turno (el último gana).
- Un bloque que se repinta solo nunca puede tirar lo que se está escribiendo, ni el foco, ni el
  cursor: envolver el repintado en `U.conservandoLoEscrito(raiz, fn)`.
- Al terminar una instrucción de la cola: actualizar este documento y `CONTEXTO.md`
  sustituyendo la línea vieja, y anotar en `HISTORIA.md` lo que merezca recordarse.
- Todo guardado de `_GESTOR` pasa por la cola por fichero (`ColaGuardado`: `App.anotar`/
  `App.guardarRegistroFresco`, `Hitos.cambiar`); nunca `Copias.guardar` directo de `asuntos.json`.
  Ninguna tarea de fondo escribe ni mira la carpeta con un guardado en marcha.
- Renombrar, unir o borrar un asunto (su clave cambia o desaparece) solo por `AsuntoRenombrar`
  (`js/asunto-renombrar.js`): mueve a la vez la ficha, sus hitos y su señal de presencia.

## 7. Descartado, no proponer otra vez

- Conector de Vercel sobre un proyecto existente (da 403), o crear otro "por si acaso". `vercel.app` bloqueado en el centro: resuelto con el dominio propio.
- Abrir la carpeta del asunto en el explorador de archivos, o una hoja de Google Sheets como interfaz.
- Enlazar un correo con `#all/<id de hilo>` (es `#search/rfc822msgid:<id>`), o meter Gmail en un marco (Google no lo permite).
- Esconder el tablón de notas, sacar el DNI de la columna del tutor, o poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.
- Reescribir la arquitectura de módulos y envolturas, o meter los campos de cada tipo en el nombre de los documentos (son del asunto, no del papel).
- Rellenar los datos de la PERSONA en un impreso: no, a propósito, para ver si algo cambió (fila 84).

## 8. Qué falta

- El compañero: entrar en `https://asuntos.fmargon.com`, señalar sus carpetas de nuevo (no se heredan) y coordinar tipos de asunto y estados.
- Poner en marcha el script de Gmail (`g.educaand.es`): señalar `GESTOR-BANDEJA` en Ajustes y pegar `apps-script/gestor-correos.gs` en `script.google.com`.
- Ver si la bandeja acierta con el tipo, y si Séneca acepta el largo del asunto. Con correo común, replantear la bandeja como una sola compartida.
- Ver con el uso: ancho del panel y del tablón, tarjetas cortas, aviso de "falta el DNI".
- Comprobar "Ajustar tamaño" real; asuntos vivos al cambiar de curso; cuenta del centro; Ajustes: membrete, Consejería, cargos y Provincia.
- Importar el fichero de usuarios IdEA del alumnado, pendiente de que a Francisco le reactiven el perfil de Gestor de PASEN.
- Pulsar "Poner en orden las fichas del ARCHIVO" (Mantenimiento), para los archivados de antes.
- Pulsar, antes de junio de 2027, "Guardar el contacto de los asuntos abiertos" (Ajustes → Mantenimiento).
- Decisión: ¿la papelera se vacía sola a los N días? Sin decidir, solo el aviso más insistente.
- Antes de publicar algo importante, repasar `docs/COMPROBAR-A-MANO.md`.

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice, las reglas comunes y la tabla de
ficheros; cada zona (asuntos, personas, documentos, correo y Séneca, hitos y guías, campos y
tipos, pantalla) vive en su propio hijo dentro de `docs/contexto/`, por debajo de 40.000
caracteres cada uno. Se lee el hijo que toque para ver cómo funciona un módulo por dentro, o para
escribir su regla al terminar una instrucción de la cola.
