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

(Una línea por cosa; el porqué, en `docs/contexto/` y `HISTORIA.md`.)

- Categoría → tipo → tercero → nombre de carpeta, con vista previa. Nombre corto del tipo; tipo nuevo sin salir de Nuevo asunto.
- Cada tipo dice quién lo encarga (Secretaría, Dirección, Jefatura, Varios): parrilla agrupada, filtro y Cuentas.
- Asuntos reservados (por tipo o uno a uno): candado y sin el nombre del tercero en listas y buscador.
- El estado es el primer hito sin terminar («Paso N de M · título», «Paso actual»): Administración o terceros; «Esperando a…» sale solo con el responsable (a mano, hasta que cambia el paso). Vía y fecha límite.
- Asuntos recurrentes, con aviso. Avisos de fichas huérfanas y papelera vieja.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO y búsqueda por palabras
  sueltas también en documentos, registro de Séneca, ficha y notas.
- Personas (Alumnado): matriculados primero, antiguos plegados; busca por padre, madre o tutor;
  hermanos en la ficha. La BD de alumnado (carpeta de Drive) suma sus datos: ficha, huecos, grupos.
- Editar un asunto abierto (renombra su carpeta, sin perder hitos ni presencia); no en el ARCHIVO.
  Renombrar un tipo se lleva su guía; cambiarle el tipo, la ofrece.
- Nombre comercial de empresas; editar datos de un tercero dado de alta a mano.
- Guías del procedimiento por tipo, con preguntas dentro de las respuestas sin límite, y su mapa
  (dibujo de la guía entera; en un asunto, con el camino elegido resaltado). Se escriben en
  acordeón: un paso abierto a la vez.
- Panel lateral de lectura; tablón a la vista. Aviso de duplicado; pantalla "Duplicados".
- Correo y mensaje de Séneca: se prepara; el correo se envía de verdad (Apps Script, con
  confirmación) y nunca dos veces.
- "Por clasificar": cada documento suelto se abre, se borra, o crea/entra en un asunto; con
  tercero reconocido, también sugiere meterlo en uno que ya existe («Meter aquí»). Encima vive la
  bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y propone tipo, fecha, registro y tercero.
- Aspirante sin Nº escolar: al escribirlo, se renombran sus carpetas. Carpeta ≤150 caracteres, documento ≤120.
- Botón «Ruta» (`file:///`; ficha, Correo/Séneca): deduce Dropbox; lo de dentro, una vez para el centro. Ficha del tercero: "Datos y contacto" en una línea; «Ver todo» del alumno en
  tarjetas (alumno y tutores). Ficha del asunto en tarjetas (una se abre en grande; se vuelve
  pulsando su pestaña; Documentos: 5 nombres como mucho y «y N más»); cabecera en dos líneas.
- Registrar un documento detecta el PDF ya sellado, lo renombra y guarda el original como
  "SIN SELLAR"; cada documento se puede asociar a un hito.
- Terceros relacionados con un asunto, con altas por grupo (unidad, nivel, grupo propio), que
  también sirven de destinatarios de un correo o de un mensaje de Séneca.
- Ajustes: tres pestañas y pantalla por tipo; todo plegado, con resumen; avisos de fallo, solo con fallo.
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa.
  Campos propios por tipo de DOCUMENTO, que entran solos en su nombre.
- Papelera: nada se borra de golpe. Plazo de conservación por tipo: avisa, nunca borra solo.
- Plantillas de correo y de Word por tipo, con huecos que se rellenan solos; se crean o editan también
  desde el propio cuadro de Correo/Séneca («Crear»/«Editar plantilla»); textos del centro en `plantillas/`
  (botón en Mantenimiento). Membrete de la Junta (lo dibuja la app; logo opcional), firma de quien ocupaba
  el cargo en su fecha y «el/la alumno/a» según el sexo de cada persona.
- Tablas de datos (tutorías de Séneca, CSV/Excel) unidas por DNI, con huecos; lo que falta, en amarillo. Certificado de función tutorial
  como el del centro; renuncia a la Junta Electoral, en su hito.
- Copias diarias (90 días), detección de fichero roto, fusión de conflictos de Dropbox. Entrada: desplegable de nombres. Un borrado (tipo,
  tipo de documento, recurrente) no reaparece por memoria del otro ordenador.
- Pruebas automáticas en cada subida de código (no con solo `docs/`).
- Copia sin internet (`file://`): se actualiza sola; si no puede o no lo comprueba, franja fija arriba; cada 30 min.
- Hitos: los pasos de la guía son los hitos de un asunto, con estado, plazo (hábiles, lectivos o naturales), responsable,
  bifurcaciones e historial. Cada hito se abre a pantalla completa (la mesa): las acciones solo ahí, «Generar documento ▾», «Comunicar ▾»
  y «Registrar» (con hitos, no en la barra de arriba); tres tarjetas, una en grande y dos de resumen: el guion (lista para marcar, sin
  botones, quién y cuándo al lado; «receta» opcional que sale arriba del menú y deja el cuadro relleno; preguntas; 📎, ✎; se marca
  solo al generar, registrar, comunicar o añadir), todos los documentos del asunto (los de otros hitos, con su etiqueta), gemelos, selección, «Enviar ▾» por correo o Séneca y notas con historia.
  Los pasos nuevos de una guía llegan a los asuntos abiertos de su tipo; el guion se escribe también desde la mesa
  («✎ Cambiar el guion», sin salir a Ajustes). «Paso N de M», «Hitos N/M» y la mesa, con una sola cuenta.
  Biblioteca de hitos del centro, con guion; en Mantenimiento, cargar tipos, guías y guiones del instituto.
- "Qué me toca": pendientes, filtro por responsable, "Dormidos" (sin novedades en N días). "Cuentas": por tipo (con tiempos de tramitación), mes y quién los pidió, y los abiertos más antiguos. "Formularios": catálogo buscable de
  impresos; "Preparar para el tercero" rellena solo los datos del centro (casillas con nombre legible y miniatura).
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Separar, Unir, Sacar páginas y Ajustar tamaño de un PDF (banda libre para sello y firma); repartir un PDF
  entre terceros, un archivado por persona.
- "Lo pide": quién pidió la gestión, por qué vía y cuándo; su correo sale en el cuadro de Correo.
- Archivar o reabrir sobre un destino que ya existe fusiona carpetas; reintenta si Dropbox tropieza.
- Crear, reabrir o editar deja en la ficha; Volver regresa a la pantalla de origen, a su altura.
- Al archivar, la ficha baja a su carpeta (al reabrir, vuelve) y se hace el índice del expediente
  (PDF numerado; también desde el menú de la ficha).
- Ficha del asunto: foto del tercero; cabecera fija al bajar.

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo la app (`.vercelignore`: sin `docs/` ni `pruebas/`) y pone
  sola la hora de la versión al publicar; la de `js/version.js` (hora real) es la de la copia sin internet.
- **Permiso permanente de Francisco**: un pull request (sesiones desde la nube) lo fusiona Claude
  Code solo, en verde y sin conflictos (nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`.**
- Vercel: 100 publicaciones/día (gratuito); `vercel.json` salta los commits de solo `docs/`, `pruebas/`, `.github/` o `.md`; máximo dos subidas por fila (regla 13).
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

## 7. Descartado, no proponer otra vez

- Conector de Vercel sobre un proyecto existente (da 403), o crear otro "por si acaso".
- Abrir la carpeta del asunto en el explorador de archivos, o una hoja de Google Sheets como interfaz.
- Enlazar un correo con `#all/<id de hilo>` (es `#search/rfc822msgid:<id>`), o meter Gmail en un marco (Google no lo permite).
- Esconder el tablón de notas, sacar el DNI de la columna del tutor, o poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.
- Reescribir la arquitectura de módulos y envolturas, o meter los campos de cada tipo en el nombre de los documentos (son del asunto, no del papel).
- Rellenar los datos de la PERSONA en un impreso (a propósito: para ver si algo cambió).

## 8. Qué falta

- El compañero: entrar en `https://asuntos.fmargon.com`, señalar sus carpetas de nuevo y coordinar tipos de asunto.
- Envío: pegar el script nuevo (filas 117 y 130), «Nueva versión» y «Probar».
- Ver si la bandeja acierta con el tipo, y si Séneca acepta el largo del asunto.
- Ver con el uso: ancho del panel/tablón, tarjetas, aviso de "falta el DNI".
- Comprobar "Ajustar tamaño" real; asuntos vivos al cambiar curso; cuenta del centro; Ajustes: cargos y Provincia.
- Importar usuarios IdEA del alumnado, al reactivar a Francisco el perfil de Gestor de PASEN.
- Mantenimiento: "Poner en orden las fichas del ARCHIVO", «Cargar plantillas», «Traer guiones». Ajustes › Hitos: festivos.
- Antes de junio 2027: "Guardar el contacto de los asuntos abiertos" (Mantenimiento).
- Decisión: ¿la papelera se vacía sola?
- Antes de publicar algo importante, repasar `docs/COMPROBAR-A-MANO.md`.

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice y las reglas comunes; cada zona vive en
su hijo de `docs/contexto/`, que se lee (y se pone al día) al tocarla.
