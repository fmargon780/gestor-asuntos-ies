# Contexto corto — léelo siempre

Se lee en toda conversación y en cada sesión de Claude Code. Es para **decidir**, no para
programar: para eso está `docs/CONTEXTO.md` y sus hijos en `docs/contexto/`. El porqué de las
cosas y el diario están en `docs/HISTORIA.md`. **Máximo 40.000 caracteres** (regla 9 de `docs/COLA.md`; antes 14.000, que ya no se cumplía).

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
- Repositorio: `fmargon780/gestor-asuntos-ies`, rama `main`, público.
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
- Si hay que elegir, opciones numeradas con sus pros y contras, sin recomendación.
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

La lista completa (una línea por cosa, con su fila) está en `docs/contexto/QUE-ESTA-HECHO.md`
(pasada tal cual el 2-nov-2026, fila 498). **Léela antes de proponer o programar algo que pueda
existir ya.** Lo principal, en una línea cada cosa:

- Asuntos con guía de hitos, estado automático, «Qué me toca», «Cuentas», reservados y recurrentes.
- Nuevo asunto por persona o por tipo, con tipos de una o varias clases de tercero (fila 493).
- Documentos: plantillas, Word dentro de la app, PDF, registro y verificación, copia desde la ruta (fila 478) y reconocimiento de PDF firmados con su marca «Firmado» (fila 515); cada tarea de generar o registrar del hito lleva su documento colgado (fila 522) y la tarea «Firmar un documento» se marca sola al llegar el firmado (fila 523).
- Correo (Gmail por script, se queda en recibidos, fila 480), Séneca, Centro de datos y control del registro.
- Archivo con índice por curso, papelera, solo consulta, comprobación al entrar y copia de pruebas con demo.
- Ficha de entrega de libros de un alumno o un grupo, con su duplicado por extravío (fila 501).
- Plan de las guías (fila 551): Herramientas → «Aplicar el plan de las guías» pasa las guías a las listas comunes de tareas y de hitos y, una vez aplicado, quita lo viejo (tareas e hitos libres en la guía, «Traer un hito de otro tipo», «Nueva tarea…», «Tipos y su uso»).
- Medidas, «Qué hay de nuevo» y el botón «Soporte» común.
- El tutor y las tutorías vienen solo de las fichas `hecho/tutorias` del Centro de datos, todos los cursos; el Gestor ya no lee el PDF de la función tutorial (fila 376).

## 6. Reglas de código que no se pueden olvidar

- Todo cuadro nuevo usa la regla común de `css/estilos.css` (`.capa > .cuadro`: título y pie de botones fijos, el cuerpo `#cuadro-cuerpo` se desplaza); nunca `overflow` en el cuadro entero (fila 341).
- Para **ofrecer** plantillas, siempre `Plantillas.deTipo` o `Plantillas.documentosDeTipo` (dejan fuera las que no están en uso); `datos.lista` y `datos.documentos` a pelo, solo para encontrar una por su `id`. Un cuadro que cambia una plantilla conserva las claves que no conoce (fila 321).
- Quien copie un fichero de datos a `_GESTOR/datos` lo apunta con `DatosQueTengo.apuntar` (fila 319); de cuándo es, `DatosQueTengo.fechaReal`, nunca la fecha de su copia (fila 324).
- Para una estadística o un cruce de asuntos archivados se usa `Base.leer` (fila 334), no se abre carpeta por carpeta; lo que se apunta en `base/` se hace siempre por `BasePonerAlDia`.
- Lo único que el Gestor escribe en la carpeta del Centro de datos es `CentroDeDatosEntregar` (un fichero `ENTREGA … gestor-asuntos-ies.json` en `entrada/`); traer sigue pidiendo solo leer (fila 328).
- El personal se pide siempre a `Datos` (`cargarPersonal`), nunca abriendo un `RelPerCen` ni una parte (`PERSONAL-HECHO …json`) por otro lado (fila 327).
- El botón «Soporte» y el buzón no son de este repositorio: se cambian en `fmargon780/soporte-apps`. Aquí solo `js/soporte-cargar.js`.
- Nada recarga la página sin una pulsación de quien la usa, salvo la actualización de la copia antes de entrar. Un aviso de versión nueva es la marca (`MarcaVersion.poner`), nunca una franja (fila 325).
- Una carpeta recordada sin permiso se arregla pidiendo el permiso sobre ella (`PermisosCarpetas.pedir`), nunca mandando a señalarla otra vez (fila 318).
- Un campo de fecha que guarda sin botón se engancha con `U.alTerminarFecha`, nunca con `change` (fila 314).
- Todo código nuevo que escriba en las carpetas **de fondo** (sin que lo pida un botón) mira antes `SoloConsulta.activo()` y se salta (fila 260).
- El repositorio es la versión buena; Vercel no publica nada solo: se publica a propósito, una vez por fila con código (`create_deployment`, `CLAUDE.md`), solo la app (`.vercelignore`: sin `docs/` ni `pruebas/`), y pone
  sola la hora de la versión al publicar; la de `js/version.js` (hora real) es la de la copia sin internet.
- **Permiso permanente de Francisco**: una petición de cambios hacia `main` tras la aprobación del
  revisor la fusiona Claude Code solo, sin esperar a nadie (`CLAUDE.md`, rama de la fila).
- **Una fila es HECHA solo con las dos cosas** (fila 242): su commit está en `main` (`git merge-base --is-ancestor`) y Vercel lo ha publicado (`curl` a `js/version.js`, estado «Vercel» del commit o `list_deployments`).
- Vercel: 100 publicaciones/día para toda la cuenta; `vercel.json` lleva `git.deploymentEnabled: false` y nunca `ignoreCommand` (las canceladas también cuentan); una sola publicación por fila con código, a propósito, tras fusionar en `main`. Los proyectos `gestor-soporte`, `parroquia-conteo-colectas-ais-dev` y `diplomator` no tienen trabajo desde julio: si vuelven a tener cola, lo primero es ponerles esta misma regla.
- Antes de colgar una función de `App`, mirar que el nombre esté libre. Un solo cuadro (`U.preguntar`) a la vez.
- Ojo con `p.campos`: solo trae columnas con datos; para saber si existe, mirar la cabecera del CSV. Todos los campos de las plantillas se reúnen en `CamposLista.reunir` (fila 528: Ajustes → El centro → «Campos» y la ventana de «Campo variable», `js/campos-elegir.js`); las marcas no cambian.
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
- Un cambio de un fichero de datos que no se puede escribir (Dropbox) no se tira: queda pendiente
  (`GuardadoPendiente`, también en el navegador), se reintenta solo y sale un aviso rojo fijo arriba;
  quien guardó espera a que salga de verdad. Se tira solo si otro ordenador cerró el asunto.
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
- (Fila 372) Las notas del tablón pueden llevar hora y antelación: a su hora sale la ventana «Aviso del tablón» con sonido (`js/tablon-avisos.js`); «Entendido» es de cada persona y va en la propia nota.
- Esconder el tablón del todo (desde la fila 353 solo se **pliega** a una línea con su número y la nota más reciente; nunca desaparece), sacar el DNI de la columna del tutor, o el nombre comercial en la carpeta de una empresa.
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
