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

- Dirección publicada: **https://asuntos.fmargon.com** (dominio propio, 18-sep-2026). Es la que
  usan Francisco y su compañero: **la red del IES bloquea todo lo que esté en `vercel.app`**
  (`ERR_CONNECTION_TIMED_OUT`). La dirección de Vercel `https://gestor-de-asuntos.vercel.app`
  sigue viva y sirve para comprobar lo publicado con `curl` desde fuera del centro.
- El dominio `fmargon.com` está comprado en la misma cuenta de Vercel; otras apps irán en otros
  subdominios (`informes.fmargon.com`, etc.).
- Repositorio: `fmargon780/gestor-asuntos-ies`, rama `main`, privado.
- **Un solo proyecto de Vercel** (`gestor-de-asuntos`). No crear otro.
- **Cada dirección es un sitio distinto para el navegador**: los permisos de carpetas y la
  identidad se guardan por dirección, así que al pasar a la nueva hay que volver a señalar las
  dos carpetas (y la bandeja de correos) e identificarse otra vez. Los ajustes del centro no se
  pierden: viven en `_GESTOR`, dentro del Dropbox.

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

- Categoría → tipo → tercero → nombre de carpeta, con vista previa.
- Estado del asunto, vía de comunicación preferente y fecha límite.
- Asuntos recurrentes, con aviso y creación manual.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO y búsqueda por palabras
  sueltas también en documentos, registro de Séneca y ficha.
- Editar un asunto abierto (renombra su carpeta, sin perder hitos ni presencia); no en el ARCHIVO.
- Nombre comercial de empresas, aparte de la razón social; cambiar los datos de un tercero dado
  de alta a mano.
- Guías del procedimiento por tipo, con pasos, preguntas y opciones.
- Panel lateral de lectura, y tablón de notas rápidas siempre visible.
- Correo y mensaje de Séneca preparados (la app nunca envía nada), en un cuadro ancho de dos
  columnas con el asunto completo y su cuenta de caracteres; el ayudante de Séneca comprueba de
  verdad quién ha entrado y dice por su nombre quién falta.
- "Por clasificar": cada documento suelto se abre, se borra, o crea/entra en un asunto; encima
  vive la bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y sus adjuntos y propone tipo,
  fecha, registro y tercero sin decidir por su cuenta.
- Aspirantes a plaza dados de alta sin Nº de identificación escolar: al escribirlo, se renombran
  solas las carpetas de sus asuntos abiertos.
- Ficha del tercero con "Datos y contacto" en una línea, cada dato con su copiar; ficha del
  asunto a tres columnas, con cabecera agrupada por el momento del trámite y menú de tres puntos.
- Registrar un documento detecta el PDF ya sellado, lo renombra y guarda el original como
  "SIN SELLAR"; cada documento se puede asociar a un hito.
- Terceros relacionados con un asunto, con altas por grupo (unidad, nivel, grupo propio), que
  también sirven de destinatarios de un correo o de un mensaje de Séneca.
- Parada al crear un asunto duplicado, y pantalla propia "Duplicados".
- Ajustes con tres pestañas; pantalla propia de cada tipo, con sus ocho secciones a la vista.
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa.
- Papelera: nada se borra del todo a la primera.
- Mandar documentos de un asunto por correo, con un borrador que deja Apps Script en Gmail.
- Plantillas de correo, de mensaje de Séneca y de documento de Word por tipo de asunto, con
  huecos que se rellenan solos.
- Copias de seguridad diarias, detección de fichero roto, fusión de conflictos de Dropbox.
- Pruebas automáticas en GitHub Actions en cada subida.
- Escape y botón de salida en toda pantalla.
- Hitos: los pasos de la guía son los hitos de un asunto abierto, con estado, fecha límite,
  responsable, bifurcaciones, documentos apuntados e historial; cada paso puede llevar "lo que
  hay que reunir" y su propio texto de correo/Séneca ("Comunicar").
- "Qué me toca": hitos pendientes de todos los asuntos abiertos, en tres bloques, con filtro por
  responsable.
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Separar, Unir, Sacar páginas y Ajustar tamaño de un PDF, en la carpeta del asunto y en Por
  clasificar; Ajustar tamaño deja libre la banda del sello de Séneca y de la firma del director.
- "Lo pide": quién ha pedido la gestión, por qué vía y en qué fecha, con el correo ya puesto al
  preparar el cuadro de Correo.
- Archivar o reabrir cuando el destino ya existe fusiona las dos carpetas sin perder nada; los
  errores del navegador salen siempre traducidos al castellano.
- Guardar un documento en un asunto se queda en su ficha; la ficha solo se repinta si algo suyo
  ha cambiado de verdad.
- Cabecera de cada pantalla fija al bajar, y encogida a una sola línea sin temblar.
- Renombrar, unir o borrar un asunto mueve también sus hitos y su señal de presencia; el registro
  de asuntos siempre relee del disco antes de escribir, para no pisar al compañero.
- Al archivar, la ficha del asunto baja a su propia carpeta (no se queda en `asuntos.json` para
  siempre); al reabrir, vuelve. Botón "Poner en orden las fichas del ARCHIVO" en Ajustes →
  Mantenimiento para los archivados de antes de este cambio.
- Ficha del asunto: foto del contacto del tercero al crearla (teléfonos, correos, tutores); si esa
  persona sale del CSV, la sigue enseñando con el aviso de la fecha. Botón para rellenar los
  asuntos de antes, en Ajustes → Mantenimiento.

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo. Un solo proyecto de Vercel.
- **Permiso permanente de Francisco**: cuando el trabajo vaya por pull request (sesiones desde la
  nube), Claude Code lo fusiona solo en cuanto esté en verde y sin conflictos. No hace falta
  esperar a que Francisco lo haga a mano (ver la nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`**, nunca dar la publicación por hecha.
- Vercel publica como máximo 100 veces al día (plan gratuito): `vercel.json` tiene un `ignoreCommand` que se salta los commits que solo tocan `docs/`, `pruebas/`, `.github/` o `.md`, y la cola tiene la regla 13 (como máximo dos subidas por fila, fila 48, 17-sep-2026).
- Antes de colgar una función nueva de `App`, comprobar que el nombre no está ya cogido. Solo hay un cuadro de diálogo (`U.preguntar`): no abrir un segundo mientras el primero espera.
- Ojo con `p.campos`: solo trae columnas con datos; para saber si una columna existe, mirar la cabecera del CSV. Ojo también con el orden de los `<script>` de `index.html`: importa para las envolturas.
- Una acción que guarda y repinta: `await` hasta el final y usar `U.mientrasGuarda(control, fn)`
  para apagar el botón o desplegable ("Guardando…") mientras tanto (fila 23, 17-sep-2026).
- Un bloque que se repinta solo nunca puede tirar lo que se está escribiendo, ni el foco, ni el
  cursor: envolver el repintado en `U.conservandoLoEscrito(raiz, fn)` (filas 33 y 34, 17-sep-2026).
- Al terminar una instrucción de la cola: actualizar este documento y `CONTEXTO.md`
  sustituyendo la línea vieja, y anotar en `HISTORIA.md` lo que merezca recordarse.
- El registro de asuntos (`asuntos.json`) solo se escribe entero por `App.anotar` o por
  `App.guardarRegistroFresco`, nunca directo con `Copias.guardar` (fila 61, 19-sep-2026).
- Renombrar, unir o borrar un asunto (su clave cambia o desaparece) solo por `AsuntoRenombrar`
  (`js/asunto-renombrar.js`): mueve a la vez la ficha, sus hitos y su señal de presencia (fila 62).

## 7. Descartado, no proponer otra vez

- Publicar con el conector de Vercel sobre un proyecto ya existente (da 403), crear otro "por si acaso", o pedir al coordinador TIC que desbloquee `vercel.app` (se resolvió con el dominio propio, 18-sep-2026).
- Abrir la carpeta del asunto en el explorador de archivos, opciones dentro de opciones en la guía, o una hoja de Google Sheets como interfaz.
- Enlazar un correo de Gmail con `#all/<id de hilo>` (es con `#search/rfc822msgid:<id>`), o meter Gmail dentro de la aplicación en un marco (Google no lo permite).
- Esconder el tablón de notas, sacar el DNI de la columna del tutor, o poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.
- Reescribir la arquitectura de módulos y envolturas, o meter los campos de cada tipo en el nombre de los documentos (son del asunto, no del papel).

## 8. Qué falta

- El compañero tiene que entrar en `https://asuntos.fmargon.com`, volver a señalar sus carpetas (el navegador no las hereda de la dirección vieja), y coordinar la lista de tipos de asunto y estados.
- Poner en marcha el script de Gmail en `g.educaand.es`, señalar `GESTOR-BANDEJA` en Ajustes, y pegar en `script.google.com` la versión nueva de `apps-script/gestor-correos.gs` (sin eso no se siguen los hilos por matrícula, ni la copia oculta de un grupo).
- Ver si la bandeja de correo acierta con el tipo (si falla mucho, palabras clave por tipo), y comprobar con Séneca si Comunicaciones acepta el largo del asunto que le damos. Cuando tengan una cuenta de correo común, replantear la bandeja como una sola compartida.
- Ver con el uso: ancho del panel lateral y del tablón, si las tarjetas por tipo se quedan cortas, y si el aviso de "falta el DNI" conviene también en la tarjeta del asunto; si el DNI no sale de nadie, marcar la columna del documento al generar el RegAlum.
- Comprobar con un documento de verdad "Ajustar tamaño" (fila 57): si Séneca avisa de que invalida la firma al sellar uno ya preparado, y ajustar en Ajustes las dos medidas por defecto (1,5 y 2,5 cm) con la banda real del sello y de AutoFirma. Cuando el uso lo pida: qué hacer con los asuntos vivos al cambiar de curso, pasar repositorio y Vercel a una cuenta del centro (los borrados en `tipos.json`, `estados.json`, `tipos-documento.json` y `recurrentes.json` no se fusionan entre ordenadores, solo las altas).
- Importar el fichero de usuarios IdEA del alumnado, pendiente de que a Francisco le reactiven el perfil de Gestor de PASEN.
- Pulsar, cuando pueda, "Poner en orden las fichas del ARCHIVO" (Ajustes → Mantenimiento, fila 64): mueve a su carpeta la ficha de los asuntos archivados antes de esa fila, para que `asuntos.json` deje de crecer con ellos.
- Pulsar, antes de junio de 2027, "Guardar el contacto de los asuntos abiertos" (Ajustes → Mantenimiento, fila 66).

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice, las reglas comunes y la tabla de
ficheros; cada zona (asuntos, personas, documentos, correo y Séneca, hitos y guías, campos y
tipos, pantalla) vive en su propio hijo dentro de `docs/contexto/`, por debajo de 40.000
caracteres cada uno. Se lee el hijo que toque para ver cómo funciona un módulo por dentro, o para
escribir su regla al terminar una instrucción de la cola.
