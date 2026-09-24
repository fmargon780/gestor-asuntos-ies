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
  señalar las carpetas (y la bandeja) y entrar. Los ajustes del centro viven en `_GESTOR`.

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

- Categoría → tipo → tercero → nombre de carpeta, con vista previa. El nombre corto del tipo, en carpeta, filtros y tarjeta; se crea un tipo nuevo sin salir de Nuevo asunto.
- El estado del asunto es su hito actual («Paso N de M · título»): lo pone solo en Administración o terceros; cada paso de la guía dice a quién le toca; «Esperando a…», a mano. Sin estados manuales. Vía y fecha límite.
- Asuntos recurrentes, con aviso.
- Buscador de tipos y de terceros, con índice guardado del ARCHIVO y búsqueda por palabras
  sueltas también en documentos, registro de Séneca, ficha y notas.
- Personas (Alumnado): matriculados primero, antiguos plegados; busca por padre, madre o tutor;
  hermanos en la ficha, que sigue al bajar.
- Editar un asunto abierto (renombra su carpeta, sin perder hitos ni presencia); no en el ARCHIVO.
  Renombrar un tipo: se lleva su guía.
  Al cambiarle el tipo, ofrece su guía.
- Nombre comercial de empresas; cambiar los datos de un tercero dado de alta a mano.
- Guías del procedimiento por tipo, con preguntas dentro de las respuestas sin límite, y su mapa
  (dibujo de la guía entera; en un asunto, con el camino elegido resaltado). Se escriben en
  acordeón: un paso abierto a la vez.
- Panel lateral de lectura, y tablón de notas siempre visible.
- Correo y mensaje de Séneca: el mensaje se prepara; el correo de un asunto se envía de
  verdad, con Apps Script y confirmación, y nunca dos veces.
- "Por clasificar": cada documento suelto se abre, se borra, o crea/entra en un asunto; con
  tercero reconocido, también sugiere meterlo en uno que ya existe («Meter aquí»). Encima vive la
  bandeja de Gmail (etiqueta `GESTOR`), que lee el PDF y propone tipo, fecha, registro y tercero.
- Aspirante sin Nº escolar: al escribirlo, se renombran sus carpetas. Carpeta ≤150 caracteres, documento ≤120.
- Botón «Ruta» (copia la ruta de la carpeta). Ficha del tercero con "Datos y contacto" en una línea, con copiar; «Ver todo» del alumno en
  tarjetas (alumno y tutores). Ficha del asunto en tarjetas (una se abre en grande; se vuelve
  pulsando su pestaña; Documentos: 5 nombres como mucho y «y N más»); cabecera en dos líneas.
- Registrar un documento detecta el PDF ya sellado, lo renombra y guarda el original como
  "SIN SELLAR"; cada documento se puede asociar a un hito.
- Terceros relacionados con un asunto, con altas por grupo (unidad, nivel, grupo propio), que
  también sirven de destinatarios de un correo o de un mensaje de Séneca.
- Parada al crear un duplicado, y pantalla "Duplicados".
- Ajustes: tres pestañas y pantalla por tipo; todo plegado, con resumen; avisos de fallo, solo con fallo.
- Campos propios y calculados por tipo de asunto, rellenos solos al crear, con vista previa.
  Campos propios por tipo de DOCUMENTO, que entran solos en su nombre.
- Papelera: nada se borra de golpe.
- Plantillas de correo y de Word por tipo de asunto, con huecos que se rellenan solos; textos del
  centro en `plantillas/` (botón en Mantenimiento). Salen con membrete, la firma de quien ocupaba
  el cargo en su fecha y «el/la alumno/a» en masculino o femenino según el sexo de cada persona.
- Tablas de datos (tutorías de Séneca, CSV/Excel en `datos/Tablas`) unidas por DNI, con huecos
  {{ESPECIALIDAD}} y {{TABLA TUTORIAS}}; lo que falta, en amarillo. Certificado de función tutorial
  como el del centro (tipo DESEMPEÑO FUNCIÓN TUTORIAL, campo «Cursos que pide»). Renuncia a la
  Junta Electoral, en su hito.
- Copias diarias (caducan a los 90 días), detección de fichero roto, fusión de conflictos de Dropbox. Entrada: desplegable con los nombres ya usados. Un borrado (tipo,
  tipo de documento, recurrente) no reaparece por memoria del otro ordenador.
- Pruebas automáticas en cada subida. Escape y salida en toda pantalla.
- Copia sin internet (`file://`): se actualiza sola; si no puede, o no puede comprobarlo, franja fija arriba; mira cada 30 min.
- Hitos: los pasos de la guía son los hitos de un asunto, con estado, plazo (hábiles, lectivos o naturales), responsable,
  bifurcaciones, historial y "lo que hay que reunir". Cada hito se abre a pantalla completa (la mesa):
  guion (con preguntas: un botón por respuesta) que se marca solo al generar, registrar, comunicar o añadir; documentos en tabla con sus
  gemelos y selección de varios; plantillas y formularios («Buscar otra plantilla…»: cualquiera); comunicar con destinatarios; notas.
  Los pasos nuevos de una guía llegan a los asuntos abiertos de su tipo; el guion se escribe también desde la mesa.
  Biblioteca de hitos del centro, con guion. Botones en Mantenimiento para cargar los tipos y guías
  del instituto y traer los guiones (y las líneas nuevas del instituto a un guion ya escrito).
- "Qué me toca": hitos pendientes, filtro por responsable, "Dormidos" (sin novedades en N días). "Cuentas": asuntos por tipo, mes y quién los pidió. "Formularios": catálogo buscable de
  impresos; "Preparar para el tercero" rellena en el PDF solo los datos del centro.
- Avisos de "fichas sin carpeta" y de papelera vieja.
- No pisarse en un asunto: modo consulta si el compañero ya está dentro, con "Tomar el mando".
- Separar, Unir, Sacar páginas y Ajustar tamaño de un PDF (carpeta del asunto y Por clasificar); deja libre la banda del sello y la firma.
- "Lo pide": quién pidió la gestión, por qué vía y cuándo; su correo sale en el cuadro de Correo.
- Archivar o reabrir sobre un destino que ya existe fusiona carpetas; errores en castellano; reintenta si Dropbox tropieza.
- Crear, reabrir o editar deja en la ficha del asunto; Volver regresa a la pantalla de origen, a su altura; lo demás, aviso con «Ir al asunto».
- Al archivar, la ficha del asunto baja a su propia carpeta (no se queda en `asuntos.json` para
  siempre); al reabrir, vuelve. Botón "Poner en orden las fichas del ARCHIVO" en Ajustes →
  Mantenimiento para los archivados de antes.
- Ficha del asunto: foto del contacto del tercero, aunque salga del CSV. Cabecera fija al bajar.

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo la app (`.vercelignore`: sin `docs/` ni `pruebas/`).
- **Permiso permanente de Francisco**: un pull request (sesiones desde la nube) lo fusiona Claude
  Code solo, en verde y sin conflictos (nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`.**
- Vercel: 100 publicaciones/día (gratuito); `vercel.json` salta los commits de solo `docs/`, `pruebas/`, `.github/` o `.md`; máximo dos subidas por fila (regla 13).
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
- Todo guardado de `_GESTOR` pasa por la cola por fichero (`ColaGuardado`: asuntos, hitos, tablón,
  CSV de terceros, índice, borrados); nunca `Copias.guardar` directo de `asuntos.json`.
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

- El compañero: entrar en `https://asuntos.fmargon.com`, señalar sus carpetas de nuevo (no se heredan) y coordinar tipos de asunto.
- Envío: pegar el script nuevo (filas 117 y 130), «Gestionar implementaciones → lápiz → Nueva versión», y «Probar».
- Ver si la bandeja acierta con el tipo, y si Séneca acepta el largo del asunto. Con correo común, replantear la bandeja como una sola compartida.
- Ver con el uso: ancho del panel y del tablón, tarjetas, aviso de "falta el DNI".
- Comprobar "Ajustar tamaño" real; asuntos vivos al cambiar de curso; cuenta del centro; Ajustes: membrete, Consejería, cargos y Provincia.
- Importar los usuarios IdEA del alumnado, cuando reactiven a Francisco el perfil de Gestor de PASEN.
- Mantenimiento: "Poner en orden las fichas del ARCHIVO", «Cargar las plantillas del centro» y «Traer los guiones del instituto». Ajustes › Hitos: pegar los festivos.
- Antes de junio de 2027: "Guardar el contacto de los asuntos abiertos" (Mantenimiento).
- Decisión: ¿la papelera se vacía sola a los N días? Sin decidir.
- Antes de publicar algo importante, repasar `docs/COMPROBAR-A-MANO.md`.

## 9. Cuándo leer `CONTEXTO.md` (y sus hijos) entero

Antes de tocar código: `docs/CONTEXTO.md` tiene el índice y las reglas comunes; cada zona vive en
su hijo de `docs/contexto/`, que se lee (y se pone al día) al tocarla.
