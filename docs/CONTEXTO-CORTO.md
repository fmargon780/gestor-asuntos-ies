# Contexto corto — léelo siempre

Se lee en toda conversación y en cada sesión de Claude Code. Es para **decidir**, no para
programar: para eso está `docs/CONTEXTO.md`. El porqué de las cosas y el diario están en
`docs/HISTORIA.md`. **Máximo 160 líneas.**

## 0. La regla que no se puede olvidar

Al terminar cualquier instrucción de la cola (`docs/COLA.md`):

- Actualizar este documento y `docs/CONTEXTO.md` **sustituyendo la línea vieja, no añadiendo
  una debajo**. Si algo deja de ser verdad, se borra.
- Añadir a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- No dejar que este documento pase de 160 líneas.

## 1. Lo básico

- Dirección publicada: **https://gestor-de-asuntos.vercel.app**
- Repositorio: `fmargon780/gestor-asuntos-ies`, rama `main`, privado.
- **Un solo proyecto de Vercel** (`gestor-de-asuntos`). No crear otro.

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

- Categoría → tipo → tercero → nombre de carpeta, con vista previa.
- Estado del asunto, vía de comunicación preferente y fecha límite.
- Asuntos recurrentes, con aviso y creación manual.
- Buscador de tipos y de terceros (alumnado, con DNI y Nº escolar).
- Editar un asunto abierto (renombra su carpeta); no en el ARCHIVO.
- Nombre comercial de empresas, aparte de la razón social.
- Cambiar los datos de un tercero dado de alta a mano.
- Guías del procedimiento por tipo, con pasos, preguntas y opciones.
- Panel lateral de lectura, y tablón de notas rápidas siempre visible.
- Correo y mensaje de Séneca preparados; la app no envía nada.
- Bandeja de correos de Gmail (etiqueta `GESTOR`): a un asunto nuevo, al que adivina, o al que
  eliges a mano. El hilo queda enganchado (`hilos`, con la matrícula del mensaje para reconocerlo
  también desde el otro buzón) y sus respuestas vuelven solas; lo del compañero sale en gris.
- "Por clasificar": cada documento suelto se abre, se borra, crea un asunto nuevo, o entra en uno
  que ya existe con "Meter en un asunto" (mismo cuadro que la bandeja de correos). El que se está
  viendo queda marcado en la lista, con sus mismas acciones también dentro del visor.
- DNI del alumnado a la vista, con aviso si falta y ya tocaría tenerlo.
- Registrar un documento: si el PDF sellado ya está en la carpeta (bajado de Séneca), la ficha lo
  detecta sola y lo renombra al decir de qué documento es, sin tercer fichero y con el viejo a la
  papelera; el botón de siempre sigue, ya con el explorador abierto en la carpeta del asunto.
- Terceros relacionados con un asunto, con nota (no copia) al archivar; "+ Añadir varios" señala
  de golpe (atajos de alumnado por unidad/nivel/enseñanza, grupos propios en `_GESTOR/grupos.json`
  desde Ajustes), y esos mismos grupos ponen los destinatarios de un correo, en copia oculta.
- Parada al crear un asunto duplicado, y pantalla propia "Duplicados" para los ya existentes.
- Ajustes ágiles: pestañas por categoría, buscador cruzado, aviso en vivo de nombres repetidos.
- Campos propios por tipo de asunto, rellenos solos al crear.
- Papelera: nada se borra del todo a la primera.
- Mandar documentos de un asunto por correo: se marcan en el cuadro "Correo" y el script de Apps
  Script deja un borrador en Gmail (nunca envía), con tarjeta "Borrador en camino".
- Plantillas de correo y de mensaje de Séneca, por tipo de asunto, con huecos que se rellenan
  solos; la firma y el centro (y localidad, dirección, código, cargo) se editan en Ajustes.
- Plantillas de documento de Word por tipo de asunto: botón "Generar documento" en la ficha que
  saca una copia ya rellena y guardada en la carpeta del asunto, sin preguntar nada.
- Copias de seguridad diarias, detección de fichero roto, fusión de conflictos de Dropbox.
- Pruebas automáticas en GitHub Actions en cada subida.
- Escape y botón de salida en toda pantalla; copiar el nombre de un relacionado en orden normal;
  carpetas temporales de Drive/Dropbox fuera de Asuntos abiertos.
- Hitos: la guía de un asunto abierto se trabaja como hitos vivos (estado, fecha límite,
  responsable, notas y documentos), con bifurcaciones y un historial al archivar.
- "Qué me toca": pantalla que cruza los hitos pendientes de todos los asuntos abiertos, en tres
  bloques (en tu tejado, esperando a otros, sin fecha), con filtro por responsable.
- No pisarse en un asunto: si el compañero ya está dentro, se entra en modo consulta (aviso y
  "Tomar el mando"), con marca en la lista. Señal en `_GESTOR/presencia.json`, caduca a los 3 min.
- Separar, Unir y Sacar páginas de un PDF, en la carpeta del asunto y en Por clasificar (con
  pdf-lib, `js/lib/pdf-lib.min.js`); miniaturas con pdf.js, tijeras entre páginas para Separar.

## 6. Reglas de código que no se pueden olvidar

- El repositorio es la versión buena; Vercel publica solo. Un solo proyecto de Vercel.
- **Permiso permanente de Francisco**: cuando el trabajo vaya por pull request (sesiones desde la
  nube), Claude Code lo fusiona solo en cuanto esté en verde y sin conflictos. No hace falta
  esperar a que Francisco lo haga a mano (ver la nota al final de `docs/COLA.md`).
- **Comprobar siempre lo publicado con `curl`**, nunca dar la publicación por hecha.
- Antes de colgar una función nueva de `App`, comprobar que el nombre no está ya cogido.
- Solo hay un cuadro de diálogo (`U.preguntar`): no abrir un segundo mientras el primero espera.
- Ojo con `p.campos`: solo trae columnas con datos; para saber si una columna existe, mirar la
  cabecera del CSV.
- Ojo con el orden de los `<script>` de `index.html`: importa para las envolturas.
- Una acción que guarda y repinta: `await` hasta el final y usar `U.mientrasGuarda(control, fn)`
  para apagar el botón o desplegable ("Guardando…") mientras tanto (fila 23, 17-sep-2026).
- Al terminar una instrucción de la cola: actualizar este documento y `CONTEXTO.md`
  sustituyendo la línea vieja, y anotar en `HISTORIA.md` lo que merezca recordarse.

## 7. Descartado, no proponer otra vez

- Publicar con el conector de Vercel sobre un proyecto ya existente (da 403).
- Crear otro proyecto de Vercel "por si acaso".
- Abrir la carpeta del asunto en el explorador de archivos del ordenador.
- Opciones dentro de opciones en la guía del procedimiento.
- Una hoja de Google Sheets como interfaz.
- Enlazar un correo de Gmail con `#all/<id de hilo>` (es con `#search/rfc822msgid:<id>`).
- Meter Gmail dentro de la aplicación, en un marco (Google no lo permite).
- Esconder el tablón de notas para dejar sitio.
- Sacar el DNI de la columna del tutor.
- Poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.
- Reescribir la arquitectura de módulos y envolturas.
- Meter los campos de cada tipo en el nombre de los documentos (son del asunto, no del papel).

## 8. Qué falta

- Avisar al compañero de la dirección nueva y de que debe volver a señalar sus carpetas.
- Coordinar con él la lista de tipos de asunto y la de estados.
- Poner en marcha el script de Gmail en `g.educaand.es` y señalar `GESTOR-BANDEJA` en Ajustes.
- Ver si la bandeja de correo acierta con el tipo; si falla mucho, palabras clave por tipo.
- Pegar en `script.google.com` la versión nueva de `apps-script/gestor-correos.gs` (17-sep-2026):
  sin eso no se siguen los hilos por matrícula, ni la copia oculta de un grupo.
- Comprobar con Séneca si Comunicaciones acepta el largo del asunto que le damos.
- Cuando tengan una cuenta de correo común, replantear la bandeja como una sola compartida.
- Ver con el uso: ancho del panel lateral y del tablón, y si las tarjetas por tipo se quedan cortas.
- Si el DNI no sale de nadie, marcar la columna del documento al generar el RegAlum.
- Cuando el uso lo pida: búsqueda en notas, cuentas por tipo para la memoria de fin de curso,
  qué hacer con los asuntos vivos al cambiar de curso, pasar repositorio y Vercel a una cuenta
  del centro para el relevo.
- Los borrados en `tipos.json`, `estados.json`, `tipos-documento.json` y `recurrentes.json` no
  se fusionan entre ordenadores (solo las altas); revisar si con el uso hace falta algo más fino.

## 9. Cuándo leer `CONTEXTO.md` entero

Antes de tocar código: para ver cómo funciona un módulo por dentro, las tablas de ficheros,
`_GESTOR` y columnas de CSV, las trampas técnicas, o para escribir su regla al terminar una
instrucción de la cola.
