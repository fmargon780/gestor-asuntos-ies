# La tabla de todos los ficheros del repositorio, uno por uno

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al añadir, quitar o cambiar de sitio un fichero del repositorio. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Ficheros del repositorio

En el orden en que los carga `index.html`. **Ese orden importa**: un módulo que envuelve algo
de `App` va después del fichero que lo define.

| Fichero | Qué hace |
|---|---|
| `index.html` | La página |
| `vercel.json` | Que el navegador no se quede con copias viejas |
| `css/estilos.css` | El aspecto general. Los demás `css/` van con su módulo del mismo nombre |
| `css/vista.css` | El ancho de la pantalla, los filtros plegados y las tarjetas por tipo |
| `css/guias.css` | La guía: pasos, plegado, preguntas y opciones |
| `css/tipos-buscador.css` | Las listas de resultados, y la marca naranja del que ya no está |
| `css/copiar-nie.css` | Los estilos de `js/copiar.js` (nombre viejo del módulo) |
| `js/util.js` | Utilidades comunes, y la comparación de nombres parecidos. `U.mensajeDeError(e)` traduce al castellano los errores del navegador (`NotFoundError` y compañía). `U.envolver`/`U.envolturasAplicadas`/`U.envolturasFallidas` (fila 70) apuntan las envolturas de la aplicación. `U.copiar`/`U.nuevoId`/`U.fechaCorta` (fila 71) son la caja común de copiar al portapapeles, crear identificadores e imprimir fechas cortas |
| `js/almacen.js` | Guarda los ajustes en el navegador |
| `js/cola-guardado.js` | `ColaGuardado` (fila 99): una fila de espera por fichero para los guardados de `_GESTOR` (`poner`), el contador de guardado en marcha (`ocupado`, `hayGuardado`). Cargado justo antes de `js/reintentar-escritura.js` |
| `js/reintentar-escritura.js` | `Reintentar.escritura(intento)` (fila 90): reintenta hasta tres veces, con esperas de 0,5/1/2 s, si `intento` falla con `InvalidStateError`/`NoModificationAllowedError` (Dropbox sincronizando); cualquier otro error se lanza a la primera. Cargado justo antes de `js/carpetas.js`, y expuesto en `window.Reintentar`: `js/carpetas.js` escribe sin reintento si falta (fila 92) |
| `js/carpetas.js` | Habla con el selector de carpetas del navegador. Lee y escribe los JSON: `escribirTexto`/`escribirBytes` reintentan solas con `Reintentar.escritura` (fila 90). `Carpetas.esCarpetaTemporalDeSincronizacion` descarta, en un solo sitio, las carpetas y ficheros que dejan Dropbox y Drive al sincronizar; `contarFicheros`/`copiarDentro`/la fusión los saltan, y un fichero que desaparece a mitad de copia se reintenta una vez |
| `js/copias.js` | Copia de seguridad diaria de los ficheros de `_GESTOR`, y detección de fichero roto. Se borran solas las de más de 90 días (configurable), aunque no lleguen a 30 (fila 72) |
| `js/usuarios.js` | La lista de nombres de quien entra (`_GESTOR/usuarios.json`), para el desplegable de la pantalla de entrada (fila 72) |
| `js/borrados-fusion.js` | `_GESTOR/borrados-listas.json`: los borrados de tipos, estados, tipos de documento y recurrentes, marcados en vez de quitados del todo, para que no reaparezcan solos al fusionar con el otro ordenador (fila 77). El bloque de Ajustes → Mantenimiento que dice cuántos hay y deja quitarlos pasados 90 días vive en el mismo fichero |
| `js/conflictos.js` | Las copias en conflicto que deja Dropbox: fusión sola o aviso para elegir |
| `js/fichas-huerfanas.js` | Fichas de `asuntos.json` cuya carpeta ya no está: enlazar o borrar |
| `js/nombres.js` | Monta los nombres de carpetas y documentos |
| `js/plazos.js` | La fecha límite de los asuntos |
| `js/guias.js` | Pintar y escribir una guía, con sus preguntas y opciones; en el editor de cada paso llama a `js/guias-requisitos.js` para "lo que hay que reunir" (fila 59), a `js/guias-comunicacion.js` para su comunicación propia (fila 60), a `js/hitos-normativa.js` para "Normativa" y a `js/guias-biblioteca.js` para traer/guardar en la biblioteca (fila 79) |
| `js/hitos-biblioteca.js` | El modelo de la biblioteca de hitos del centro (fila 79, 20-sep-2026): leer/escribir `_GESTOR/hitos-biblioteca.json`, crear/editar/borrar un modelo, comparar un paso con el suyo, y las funciones puras de si un hito nace "solo informativo" y del enlace de una referencia de normativa |
| `js/hitos-normativa.js` | El bloque "Normativa" de un paso o de un hito (fila 79): el editor de referencias y la lista de solo lectura, con la dirección base del sistema de normativa en caché |
| `js/guias-biblioteca.js` | La pintura de la biblioteca de hitos (fila 79): el panel "+ Traer de la biblioteca", "Guardar en la biblioteca" de cada paso, la comparación campo a campo, el aviso de los demás tipos y el bloque de Ajustes → El centro |
| `js/guias-requisitos.js` | La sección "Lo que hay que reunir" del editor de un paso (`GuiasRequisitos.bloqueHTML`/`leer`/`enganchar`, fila 59, aparte de `js/guias.js` para no engordarlo) |
| `js/guias-comunicacion.js` | La sección "Comunicación de este paso" del editor de un paso (`GuiasComunicacion.bloqueHTML`/`leer`/`enganchar`, fila 60, aparte de `js/guias.js`); reutiliza el campo de texto con "Insertar hueco" de `js/plantillas-ajustes.js` |
| `js/guias-documentos.js` | «Documentos de este paso» (fila 102): qué plantillas de documento van con un paso de la guía o un modelo de la biblioteca (`plantillasDocumento`); cargado justo antes de `js/guias.js` |
| `js/datos.js` | Lee los CSV; el nombre comercial y las columnas leídas por su título; `Datos.resumenDeTercero` monta la línea "Datos y contacto" |
| `js/datos-tutores.js` | `Datos.tutoresDe`: los tutores legales de un alumno agrupados por persona, con su nombre entero, sexo e iniciales (sacado de `js/datos.js` en la fila 108) |
| `js/campos.js` | Los campos de cada tipo de asunto: catálogo, cálculo y guardado |
| `css/campos.css` | Los estilos del bloque "Datos del asunto" y del cuadro de Campos |
| `js/documentos.js` | Nombra los documentos, con el texto adicional y los tipos sin duplicados; enseña los campos del tipo de documento y no deja guardar con un obligatorio vacío (fila 96) |
| `js/documentos-campos.js` | `DocCampos` (fila 96): los campos propios de un tipo de documento (`campos.json`, `porTipoDocumento`), reconocerlos al renombrar, ponerlos en orden para el nombre y su editor en Ajustes → Tipos de documento |
| `js/usabilidad.js` | Volver, Cancelar, etiquetas de filtros, vista compacta y Escape |
| `js/nucleo.js` | El estado, el arranque y el cambio de pantalla |
| `js/version.js` | `App.VERSION`, la fecha y hora de la última publicación |
| `js/asuntos-lista.js` | Asuntos abiertos: las tres tarjetas, las tarjetas por tipo y la lista. Al leer la carpeta, descarta las que parecen temporales de sincronización, salvo que ya tengan ficha en `asuntos.json` |
| `js/unir-asuntos.js` | Une asuntos duplicados que ya existen: aviso junto a Actualizar y pantalla propia "Duplicados" (`css/unir-asuntos.css`) |
| `js/asuntos-editar.js` | Editar un asunto abierto: renombra la carpeta y mueve su ficha. También `App.renombrarAsuntosAbiertosDelTercero`, al llegar el Nº de identificación escolar de un aspirante (fila 42) |
| `js/elegir-asunto.js` | El cuadro de escoger un asunto a mano, compartido por "Por clasificar" y por la bandeja de correos |
| `js/documentos-sueltos.js` | Los papeles sin asunto, "Meter en un asunto" (`App.meterSueltoEnAsunto` elige, `App.meterSueltoEnAsuntoElegido` mueve, sacada aparte en la fila 88 para que "Meter aquí" la reutilice), cerrar y reabrir, y la vigilancia de la carpeta. `App.parecidoDelSuelto` suma +50/+10 si el lector ya reconoció tercero/tipo (fila 88) |
| `js/contexto-documentos.js` | `ContextoDocumentos.delCentro()`: las tres listas de terceros y los tipos con los que `LectorDocumentos.analizar` coteja, sacada de `documentos-sueltos-lector.js` para que la use también la fila siguiente (18-sep-2026, fila 49) |
| `js/documentos-sueltos-sugerencias.js` | `SugerenciasAsuntoExistente.calcular(propuesta)`: con tercero reconocido, sugiere hasta tres asuntos ya existentes de ese tercero (abiertos, o archivados por el índice) para "Meter aquí" (21-sep-2026, fila 88, docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md) |
| `js/documentos-sueltos-lector.js` | Envuelve `App.tarjetaSuelto` para proponer tipo/fecha/registro/tercero de cada PDF suelto, con el botón "Aceptar" (17-sep-2026, fila 41); si el documento de identidad no cuadra con nadie, el botón "Dar de alta" (fila 42); con tercero reconocido, pregunta a `js/documentos-sueltos-sugerencias.js` y pinta sus líneas «Podría ir en…» (fila 88); expone `window.LectorDeSueltos.resultadoDe(nombre)` |
| `js/bandeja-adjuntos-lector.js` | Lee los adjuntos PDF de un correo de la bandeja y completa el hueco de tercero o tipo que deja `Bandeja.proponer`, con el registro y la fecha del documento en una línea aparte; envuelve `window.Bandeja.llevarANuevo` (18-sep-2026, fila 49) |
| `js/lo-pide.js` | Quién ha pedido la gestión: candidatos, controles, línea legible y qué casilla marcar en el correo |
| `js/asuntos-nuevo.js` | Crear un asunto, el cuadro de datos de un tercero y los pies |
| `js/archivo-personas.js` | Personas y empresas, cambiar los datos de un tercero, y la pantalla ARCHIVO: orquesta `js/archivo-indice.js` (lee el índice o cae al recorrido de disco), busca por palabras y resuelve el manejador de una carpeta al vuelo para "Documentos" (fila 44) |
| `js/archivo-indice.js` | El índice guardado del ARCHIVO, `_GESTOR/indice-archivo.json` (`window.IndiceArchivo`, ver "El índice del ARCHIVO", fila 44) |
| `js/ajustes.js` | El marco de Ajustes (17-sep-2026, fila 39): las tres pestañas, la lista de tipos (pestañas de categoría, buscador cruzado, aviso en vivo) y los ayudantes compartidos (`botonMenuTarjeta`, `filaEstado`, `construirCasillaPlazo`) |
| `js/ajustes-tipo.js` | La pantalla propia de un tipo de asunto, con sus ocho secciones (17-sep-2026, fila 39) |
| `js/ajustes-tipo-palabras-clave.js` | La sección "Palabras clave" de la pantalla de un tipo: `palabrasClave` en `tipos.json` (17-sep-2026, fila 41) |
| `js/ajustes-centro.js` | La pestaña "El centro" de Ajustes: estados, tipos de documento, campos propios, grupos, ficheros de datos, abreviatura de grupos (17-sep-2026, fila 39) |
| `js/ajustes-mantenimiento.js` | La pestaña "Mantenimiento" de Ajustes: avisos de vencimiento, carpetas de este ordenador, copias y papelera (17-sep-2026, fila 39) |
| `js/ajustes-plegado.js` | Ajustes plegado (fila 105): las secciones de un tipo, "El centro" y "Mantenimiento" nacen plegadas, con un resumen en el título, la memoria de lo abierto (`gestor-ajustes-plegado`), los avisos de fallo solo con fallo y el bloque "Herramientas" |
| `js/cargar-biblioteca.js` | El botón "Cargar la biblioteca del centro" (fila 80, 20-sep-2026), en Ajustes → Mantenimiento: lee `datos-biblioteca/biblioteca-centro.json` con `App.leerFicheroDeLaApp` (fila 89: antes `fetch` directo) y lo fusiona con `tipos.json`, `campos.json`, `hitos-biblioteca.json` y `guias.json`, sin pisar nada ya escrito |
| `herramientas/cargar-biblioteca.mjs` | Programa de una sola vez (fila 80): lee `docs/contenido/BIBLIOTECA-*.md` y genera `datos-biblioteca/biblioteca-centro.json`. Se ejecuta a mano con Node cuando el contenido cambie; no lo carga `index.html` |
| `datos-biblioteca/biblioteca-centro.json` | El contenido generado de la biblioteca del centro (fila 80): tipos, campos y hitos modelo, listo para que `js/cargar-biblioteca.js` lo fusione |
| `js/puente.js` | El enganche de los módulos que se añaden por fuera (`window.Gestor`) |
| `js/avisos.js` | El aviso de lo que vence |
| `js/frescura.js` | El aviso de que el RegAlum.csv está viejo, y sus épocas |
| `js/recurrentes.js` | Los asuntos que se repiten cada mes, trimestre o curso; la sección "Se repite" de la pantalla de un tipo (`Recurrentes.pintarEnContenedor`, 17-sep-2026) |
| `js/guias-enganche.js` | Las guías dentro de la app, y `window.GuiasDelCentro` |
| `js/hitos.js`, `js/hitos-archivo.js` | El modelo de los hitos de un asunto: leer/escribir `hitos.json`, crearlos desde la guía, marcarlos, bifurcaciones, responsables y el historial al archivar; `js/hitos.js` trae también `requisitos` y `faltanObligatorios` (fila 59) |
| `js/que-me-toca.js` | Pantalla propia "Qué me toca": cruza los hitos pendientes y en curso de todos los asuntos abiertos, en tres bloques (`css/que-me-toca.css`); arriba, el aviso de aspirantes sin Nº de identificación escolar (fila 42) |
| `js/cuentas.js` | Pantalla propia "Cuentas" (fila 74): las cuentas de fin de curso por categoría/tipo, mes, quién lo pidió y cuánto se tarda, de los asuntos abiertos y del índice del ARCHIVO |
| `js/presencia.js` | No pisarse en un mismo asunto: la señal de `_GESTOR/presencia.json`, la vigilancia y la marca de la tarjeta de la lista |
| `js/notas.js` | Las notas de cada asunto, con su enlace y su botón; `Notas.pintarEnFicha` es la caja de escribir directa de la ficha, con botón Guardar (se guarda al pulsarlo o al perder el foco, nunca al teclear, fila 58); `confirmarSalirDeFicha` avisa si se sale con algo sin guardar |
| `js/registro.js` | Registrar un documento en un paso, sin nombrarlo dos veces |
| `js/cargar-fichero.js` | `App.leerFicheroDeLaApp(ruta, tipo)` (fila 89, 21-sep-2026, docs/COPIA-SIN-INTERNET.md): lee un dato estático (JSON o binario) con `fetch` en `http(s)` y desde `copia-datos/*.js` en `file://` (la copia sin internet); `App.cargarPdfJs()`, compartida por `js/registro-lector.js`, `js/preparar-documento.js` y `js/pdf-separar-unir.js`, que en `file://` carga `js/lib/pdf.iife.js`/`pdf.worker.iife.js` con `<script>` en vez de `import()` |
| `js/actualizar-copia.js` | Solo actúa si `location.protocol === 'file:'` (filas 89 y 91): al abrir la copia sin internet lee primero el `version.json` de `raw.githubusercontent.com/fmargon780/gestor-asuntos-copia`; si su versión es `App.VERSION`, no hace nada más (ni permiso ni disco). Si no, con carpeta guardada y permiso descarga solo lo que cambia (sha256 comprobado), `version.json` el último, y recarga; sin carpeta, sin permiso o si falla, franja ámbar arriba del todo («Hay una versión nueva… Esta copia tiene la…») con «Actualizar ahora» (pide permiso o carpeta, la guarda, actualiza y recarga) y una ✕. Contra el bucle, `sessionStorage` (`gestor-copia-recargada`): si tras recargar la versión no cambió, no recarga más, olvida la carpeta y avisa de que la ventana abre otra copia. Sin internet, un aviso discreto y arranca igual |
| `js/registro-lector.js` | Leer el número de registro del sello de Séneca, dentro del PDF (hasta 10 páginas); `textoDe` saca el texto de hasta 5 páginas sin buscar nada (17-sep-2026, fila 41) |
| `js/lector-documentos.js` | `LectorDocumentos.analizar(texto, contexto)`, puro: propone tipo, fecha, documentos de identidad y tercero de un documento suelto (17-sep-2026, fila 41); si un documento de identidad no cuadra con nadie, también `terceroDesconocido` (fila 42) |
| `js/registro-sellado.js` | Ver solo un PDF ya sellado en la carpeta del asunto, y colocarlo sin duplicarlo |
| `js/pdf-herramientas.js` | Partir, unir y sacar páginas de un PDF con pdf-lib: solo bytes, sin disco ni DOM |
| `js/pdf-margenes.js` | La cuenta y el PDF nuevo de "Ajustar tamaño" (llamado "Preparar el documento" hasta la fila 58): solo bytes, sin disco ni DOM (18-sep-2026, fila 57) |
| `js/preparar-documento.js` | El cuadro de "Ajustar tamaño": vista previa con pdf.js, bandas ocupadas o libres, y el guardado con papelera (18-sep-2026, fila 57; el nombre del botón cambió en la fila 58) |
| `js/pdf-separar-unir.js` | El cuadro de Separar, Unir y Sacar páginas: miniaturas con pdf.js, tijeras, casillas |
| `js/verificacion.js` | El código de verificación del pie de un documento, y su dirección |
| `js/lib/pdf.min.mjs`, `js/lib/pdf.worker.min.mjs` | pdf.js (Mozilla) 4.2.67, copiado tal cual (fila 72: sube desde la 3.11.174, con el CVE-2024-4367 arreglado). Se carga con `import()`, no con `<script>`: la 4.x ya no trae el script suelto de antes |
| `js/ficha-asunto.js` | La pantalla de un asunto: cabecera (con la línea gris del subtítulo, fila 51; barra de 5 acciones y el `<h2>` con sus dos añadidos, fila 52), debajo, las tarjetas de `js/ficha-tarjetas.js` (fila 107). `App.reengancharFicha` no avisa de "otro ordenador" si `App.E.recienArchivados` dice que este mismo ordenador lo acaba de archivar (fila 90) |
| `js/ficha-menus.js` | El menú pequeño reutilizable de la cabecera (abrir, cerrar con Escape/al pulsar fuera, uno solo a la vez): lo usan los tres puntos del nombre y "Comunicar" (18-sep-2026, fila 52) |
| `js/ficha-nombre-acciones.js` | El menú de tres puntos del `<h2>` del nombre del asunto (Editar, Borrar, fila 52) y, debajo, la fila de copiar de un gesto (Asunto, Ruta, NIE, Nombre, DNI/CIF, filas 58 y 98) |
| `js/copiar-ruta.js` | `RutaCarpetas` (fila 98): el botón «Ruta» de la fila de copiar y el bloque «Rutas de las carpetas en este ordenador» de Ajustes → El centro (`localStorage`) |
| `js/ficha-tarjetas.js` | La ficha del asunto en tarjetas (fila 107): la cuadrícula, los resúmenes, abrir una en grande con las demás como pestañas, la franja de documentos y Escape |
| `js/hito-mesa.js`, `css/hito-mesa.css` | El hito a pantalla completa (fila 109): abrir y cerrar la mesa, su cabecera (etiquetas, menú ⋯, tira de hitos) y Escape |
| `js/hito-mesa-guion.js` | La columna del guion de la mesa, y la pregunta de un hito-pregunta (fila 109) |
| `js/hito-mesa-documentos.js` | La tabla de documentos de la mesa, sus gemelos, la selección de varios, las plantillas y soltar un fichero (fila 109) |
| `js/hito-mesa-comunicar.js` | Los destinatarios de «Comunicar» en la mesa, como chips (fila 109) |
| `js/hitos-guion.js` | El guion de un hito: `Hitos.guionDe`, `marcarGuion`, `marcarGuionPorAccion`, `anadirGuionPropio` (fila 109) |
| `js/guias-guion.js` | «Guion de este paso» en el editor de la guía, y `GuiasGuion.normalizar` (fila 109) |
| `css/ficha-tarjetas.css` | El aspecto de la ficha en tarjetas (fila 107) |
| `js/ficha-documentos.js` | Los documentos de la carpeta, en la ficha del asunto (separado de `js/ficha-asunto.js` en la fila 26); pone la clase `vacio` al bloque cuando no hay ninguno (fila 51); botón "Documentos ▾" en la cabecera del bloque (fila 52); el original "SIN SELLAR" en gris y "Asociar a un hito" en cada fila (fila 58) |
| `js/ficha-tercero.js`, `css/ficha-tercero.css` | "Datos y contacto" del tercero: la línea resumen y la ventana "Ver todo" de personal y del resto (separado de `js/ficha-asunto.js` en la fila 37) |
| `js/ficha-tercero-alumno.js` | La ventana "Ver todo" de un alumno, en tarjetas: cabecera, el alumno y cada tutor, "Correo a la familia" y "Copiar todo el contacto" (fila 108) |
| `js/hitos-panel.js` | Pinta los hitos en la ficha del asunto (los pasos de la guía SON los hitos): el observador (solo `childList` sobre `#ficha-asunto-cuerpo`, sin `subtree`, desde la fila 58), el repintado y la creación automática |
| `js/hitos-panel-lista.js` | La otra mitad del panel de hitos: la fila de cada hito, su cuerpo desplegado, el cambio de rama, "lo que hay que reunir" (llama a `js/hitos-requisitos.js`, fila 59) y la guarda antes de pasar un hito a hecho |
| `js/duplicados.js` | ¿Esto no lo hicimos ya? Asuntos iguales del mismo tercero; exporta también `carpetaDelTercero` (fila 40) |
| `js/relacionados.js` | Terceros relacionados con un asunto, la nota al archivar, "+ Añadir varios" y los atajos de alumnado |
| `js/otros-del-tercero.js`, `css/ficha-asunto.css` | Bloque "Otros asuntos de este tercero" (separado de `js/ficha-asunto.js` en la fila 40): cada línea se pulsa y abre su ficha, y el botón "← Volver a …" que apunta siempre al asunto de partida |
| `js/grupos.js` | Grupos propios de personas, guardados con nombre en `_GESTOR/grupos.json` |
| `js/hitos-archivo.js` | La otra mitad del modelo de hitos: bifurcaciones, responsables de Ajustes y el `HISTORIAL DE TRAMITACION.txt` al archivar/reabrir |
| `js/ficha-archivo.js` | La ficha de un asunto archivado, en su propia carpeta (`_ficha.json`, `window.FichaArchivo`, fila 64): envuelve `App.cerrarAsunto`/`App.reabrirAsunto` por fuera de `js/hitos-archivo.js`, y el botón "Poner en orden las fichas del ARCHIVO" de Ajustes → Mantenimiento. Si escribir `_ficha.json` falla tras los reintentos de `Reintentar.escritura`, avisa en ámbar (no se ha perdido nada) en vez de en rojo; los avisos de las dos envolturas usan `U.mensajeDeError(e)`, nunca `e.message` a pelo (fila 90) |
| `js/contacto-migracion.js` | Botón "Guardar el contacto de los asuntos abiertos" de Ajustes → Mantenimiento (`window.ContactoMigracion`, fila 66): rellena `ficha.contacto` en los abiertos que todavía no lo tienen |
| `js/avisos-que-faltan.js` | Fila 68: los avisos de "fichas sin carpeta" y de la papelera vieja en la pantalla de Asuntos abiertos (`window.AvisosQueFaltan`), envolviendo `App.verAbiertos` |
| `js/hitos-cambio-de-tipo.js` | `HitosCambioDeTipo.ofrecer(clave, tipoViejo, tipoNuevo)` (fila 94): al cambiar el tipo en «Editar el asunto», pregunta si traer la guía del tipo nuevo; los hitos viejos con algo apuntado se quedan abajo como `noaplica` con `delTipoAnterior`. Lo llama `App.editarAsunto`; cargado justo después de `js/hitos-archivo.js` |
| `js/hitos-requisitos.js` | "Lo que hay que reunir" de un hito, enganchado a `window.Hitos` como `js/hitos-archivo.js`: marcar/escribir/añadir/quitar/editar/traer una casilla, y también la pintura del bloque dentro de la ficha y "Pedir lo que falta" (fila 59) |
| `js/hitos-comunicar.js` | El botón "Comunicar" propio de un hito (fila 60): lee la comunicación de su paso de origen, resuelve el destinatario y los huecos, abre el cuadro de Correo/Séneca ya relleno (vía `CorreoNucleo`) y pinta el botón en la ficha. No añade nada a `window.Hitos`: nada de esto se guarda en el hito |
| `js/hitos-generar.js` | «Generar documento» dentro de un hito (fila 102): elige entre las plantillas del paso y las del tipo y llama a `PlantillasDocumento.generar(..., { hito })`; cargado justo después de `js/plantillas-documento.js` |
| `js/visor.js` | El panel de la derecha para ver un documento (`con-visor`); marcador y acciones opcionales para que quien lo abre sepa qué se está viendo |
| `js/tipos-buscador.js` | Buscar el tipo de asunto por letras, y los más usados arriba |
| `js/via-contacto.js` | Los teléfonos y correos del tercero, como botones |
| `js/tablon.js` | El tablón de notas rápidas, con las notas "Solo para mí" |
| `js/copiar.js` | Los botones de copiar: el nombre del documento en la ficha, y `Copiar.boton`/`nieDeAsunto`/`categoriaDe`/`copiar` expuestos en `window.Copiar` para la fila de copiar de un gesto (`js/ficha-nombre-acciones.js`, fila 58) |
| `js/cargos.js` | Los cargos del centro y quién los ha ocupado, con fechas (`window.Cargos`, fila 81): leer/escribir `cargos.json`, `enFecha`/`vigente`/`solapes`, alta/edición/borrado de cargos y ocupantes, y el bloque de Ajustes "Cargos del centro" (`Cargos.pintarEnAjustes`, en el mismo fichero) |
| `js/membrete.js` | El membrete del centro (`window.Membrete`, fila 81): `medir` (sin efectos), `montar`/`dibujar` (con canvas, para meter en el documento o para la vista previa en vivo), `guardarImagen`, y el bloque de Ajustes "Membrete" (`Membrete.pintarEnAjustes`, en el mismo fichero) |
| `js/plantillas.js` | Leer y guardar `plantillas.json`, montar `Plantillas.valoresDeAsunto` y rellenar los huecos: el motor, sin pantalla. El hueco `{{LO QUE FALTA}}`, con doble llave, se sustituye aparte y siempre (`tieneLoQueFalta`, fila 59); desde la fila 81 también `{{FIRMANTE}}` y compañía (con el cargo vigente en la fecha del documento) y `{{CONSEJERIA}}`; desde la fila 111, `valores.sexos` y las formas dobles resueltas con `js/genero.js` |
| `js/plantillas-ajustes.js` | Las plantillas de correo (sacado de `js/plantillas.js`); desde el 17-sep-2026 (fila 39) pinta solo las de un tipo dentro de su pantalla (`PlantillasAjustes.pintarDeTipo`) y los campos de Datos del centro y firma, en "El centro"; `campoDeTextoHTML`/`engancharCampoDeTexto` (fila 60), el campo de texto con "Insertar hueco" del cuadro de una plantilla, reutilizado por `js/guias-comunicacion.js` |
| `js/correo.js` | El correo y el mensaje de Séneca: la lógica compartida (rastro, plantillas, grupos en copia oculta) y quién abre y pinta el cuadro (`abrirCuadro`/`pintarCuadro`, que desde la fila 58 delegan el cuerpo propio de cada cuadro en `js/seneca-cuadro.js`/`js/correo-cuadro.js`); expone `window.CorreoGrupos` (fila 47) para que `js/seneca-destinatarios.js` reutilice el mismo desplegable, `CorreoNucleo.montarBotonComunicar` (fila 59) para que "Pedir lo que falta" de un hito reutilice el mismo menú "Comunicar", y `asuntoListoActual`/`medioListoActual`/`correoPreferenteActual`/`comunicarHitoActual` (fila 60) para que "Comunicar" de un hito abra el cuadro ya con su propio mensaje resuelto y deje la constancia una vez |
| `js/correo-cuadro.js`, `css/correo.css` (`.cuadro-correo`, `.correo-grid`) | El cuerpo propio del cuadro de Correo (separado de `js/correo.js` en la fila 58): destinatario, asunto, mensaje, documentos adjuntos y CCO, en dos columnas; la dirección preferente de un hito (fila 60) tiene prioridad sobre la de "Lo pide" |
| `js/idea.js` | El usuario IdEA de una persona (y el de sus tutores legales), leído por el título de columna del CSV, como `js/dni.js` (fila 47) |
| `js/seneca-destinatarios.js` | La lista de usuarios IdEA del cuadro de Séneca, en chips, con "Copiar la lista"/"Copiar el siguiente" (fila 47) |
| `js/seneca-ayudante.js`, `css/relacionados.css` (`.marcado-chip-copiado`) | El enlace-marcador que pega los usuarios IdEA uno a uno en Séneca (fila 47) |
| `js/docx.js` | Rellenar los huecos de una plantilla de Word: ZIP y XML a mano, sin librerías (`window.Docx`). Desde la fila 83, un párrafo que se queda vacío al rellenar desaparece del todo, en vez de dejar una línea suelta. Publica `Docx.interno` (las piezas del ZIP) para los dos de abajo |
| `js/docx-imagen.js` | `Docx.ponerImagen`: meter el membrete en `{{MEMBRETE}}` (fila 81; sacado de `js/docx.js` en la fila 110) |
| `js/docx-tabla.js` | `Docx.ponerTabla`, `Docx.resaltarFaltas` y `Docx.textoDelDocumento`: las tablas de datos en un Word y lo que falta en amarillo (fila 110) |
| `js/genero.js` | El masculino o el femenino en las plantillas: `Genero.resolver` (formas dobles como «alumno/a», marcas `:tutor1`/`:firmante`…), los sexos de cada persona (`sexosDeAsunto`, `_GESTOR/sexos.json`) y la casilla Sexo de «Datos y contacto» (fila 111) |
| `js/tablas-datos-leer.js` | Leer las tablas de datos: el PDF de funciones tutoriales de Séneca por posiciones, y CSV/Excel de `datos/Tablas` (fila 110) |
| `js/tablas-datos.js` | Las tablas de datos con caché, unidas a la persona por su DNI, y los huecos `{{ESPECIALIDAD}}`, `{{TABLA …}}`, `{{DATO …}}` (fila 110) |
| `js/tablas-datos-pantalla.js` | El bloque «Tablas de datos» de Mantenimiento y «Datos de las tablas» en la ficha del tercero (fila 110) |
| `js/plantillas-documento.js` | Botón "Generar documento" en la ficha; desde el 17-sep-2026 (fila 39) pinta solo las plantillas de documento de un tipo dentro de su pantalla (`PlantillasDocumento.pintarDeTipo`, `css/plantillas-documento.css`); desde la fila 81, el alta/edición gana "Quien firma"/"Visto bueno", y al generar mete el membrete antes de rellenar; desde la fila 83, el botón "Cargar las plantillas del centro" de Ajustes → Mantenimiento |
| `js/formularios.js`, `css/formularios.css` | El catálogo de formularios oficiales (`window.Formularios`, fila 82): cargar/buscar/etiquetaDeVia, el editor embebido en el paso de guía y en "Datos del tipo", la lista de solo lectura de un hito, la línea "Formularios" de la ficha (envuelve `App.abrirFicha`), la pantalla propia y el botón "Actualizar el catálogo" de Ajustes → Mantenimiento |
| `datos/formularios.json` | El catálogo de formularios oficiales, copiado de `fmargon780/normativa-escolarizacion` (fila 82). Las entradas de vía `descarga`/`centro` llevan además `f`, el nombre de su PDF en blanco en `formularios/` (fila 84) |
| `js/formularios-rellenar.js` | El impreso, con los datos del centro ya puestos (fila 84): `_GESTOR/formularios-campos.json`, `proponerMapa` (sin efectos) y `rellenarPdf` (pdf-lib: solo lectura en lo rellenado, nunca aplana), la pantalla "Impresos oficiales" de Ajustes → El centro, y el botón "Preparar para el tercero" |
| `formularios/` | Los PDF en blanco de los impresos oficiales de vía `descarga`/`centro` (fila 84). Once entradas siguen sin copiar: sin salida a internet en la sesión que hizo la fila, ver `docs/COLA.md` |
| `plantillas/*.md` | Las plantillas de documento y de correo del centro, como texto, con su frontmatter (fila 83) |
| `plantillas/*.docx` | Los `.docx` generados de las plantillas de documento, por `scripts/hacer-plantillas.mjs` (fila 83). No se editan a mano: se cambia el `.md` y se vuelve a ejecutar el script |
| `plantillas/indice.json` | La lista de todas las plantillas del centro, generada por el script, que lee `js/plantillas-documento.js` al pulsar "Cargar las plantillas del centro" (fila 83) |
| `scripts/hacer-plantillas.mjs` | Convierte cada `plantillas/*.md` en su `.docx` y en su fila de `plantillas/indice.json`. Se ejecuta a mano; no en Vercel ni en las pruebas (fila 83) |
| `scripts/copia-local.mjs` | Genera `copia-local/` (fila 89, 21-sep-2026, `npm run copia-local`): copia `index.html`/`css/`/`js/`/`favicon.svg`, construye `js/lib/pdf.iife.js` y `pdf.worker.iife.js` con esbuild, genera `copia-datos/*.js` (uno por cada JSON/PDF/`.docx` estático) y `version.json` (versión + sha256 de cada fichero); no copia `docs/`, `pruebas/`, `herramientas/`, `scripts/` ni `apps-script/` |
| `scripts/plantillas-copia/ABRIR EL GESTOR.html` | Plantilla del instalador/actualizador autónomo (fila 89) que `scripts/copia-local.mjs` copia tal cual a `copia-local/ABRIR EL GESTOR.html`: elige la carpeta con `showDirectoryPicker`, descarga la copia de `raw.githubusercontent.com/fmargon780/gestor-asuntos-copia` y guarda el identificador de la carpeta en la misma IndexedDB que `js/almacen.js`. Desde la fila 91 la guarda siempre, y si la carpeta ya tiene `index.html` la pone al día (mismo algoritmo) antes de abrirla: es el camino para rescatar una copia vieja. Solo acepta una carpeta vacía, con `index.html` o con un fichero que empiece por `ABRIR EL GESTOR` |
| `js/salir.js` | El botón de Salir del pie de la barra |
| `js/rescate-datos.js` | Recoge los CSV que se hayan quedado un piso más arriba |
| `js/traer-datos.js` | El botón de traer los CSV de Séneca desde donde estén |
| `js/lector.js` | El panel de la derecha para leer, con su borde para estirarlo |
| `js/bandeja-correos.js` | La lógica de la bandeja de correos: leer, adivinar, guardar, la huella del hilo, lo que deja un correo dentro del asunto, y la tarjeta "Borrador en camino" (`window.Bandeja`) |
| `js/bandeja-pantalla.js` | La bandeja de correos en pantalla: la barra plegable, la caja, cada tarjeta (separado de `js/bandeja-correos.js` en la fila 27) |
| `js/bandeja-enlace.js` | "Elegir asunto": llama al cuadro compartido, con la puntuación de parecido de un correo |
| `js/correo-adjuntos.js` | El bloque "Documentos de este asunto" del cuadro de Correo, y el encargo `<id>.envio.json` |
| `js/barra.js` | La barra plegable, el botón grande de Nuevo asunto y el icono de Ajustes plegado |
| `js/vista.js` | Los filtros plegados y cuándo se ve el tablón |
| `js/cabecera-fija.js` | La cabecera de la pantalla visible (`header.cabecera` o `header.ficha-cabecera`) se queda pegada arriba (`position: sticky`) y se encoge con el scroll, con histéresis; en "Por clasificar", con un documento abierto, añade "Viendo: …" e "Ir a su fila" (`window.CabeceraFija`) |
| `css/cabecera-fija.css` | El aspecto de la cabecera pegada: fondo opaco de borde a borde, título más pequeño encogida, qué se esconde |
| `js/dni.js` | El DNI del alumnado, el aviso de que falta y la búsqueda por DNI |
| `js/papelera.js` | Borrar con papelera: mandar, devolver, borrar del todo y el bloque de Ajustes |
| `css/papelera.css` | El bloque de la papelera en Ajustes, y su icono por clase |
| `js/hitos-ajustes.js` | El bloque "Hitos" de Ajustes: responsables (con su marca "Administración", fila 104) y días no lectivos |
| `js/hitos-a-quien.js` | A quién le toca un asunto (fila 104): `Hitos.esDeAdministracion`, `Hitos.aQuienLeToca`, `Hitos.ladoDelAsunto` y el repintado de la lista cuando un asunto cambia de montón |
| `css/hitos.css` | El aspecto de la lista de hitos en la ficha del asunto, y del bloque de Ajustes |
| `js/inicio.js` | La última línea: `App.arrancar()` |
| `js/envolturas-esperadas.js` | El **último** `<script>` de todos (fila 70): compara `U.envolturasAplicadas()` con la lista de las 42 que tienen que estar, y avisa en rojo en la pantalla de entrada si falta alguna (`window.EnvolturasEsperadas`) |
| `package.json` | Las dependencias de las pruebas (`playwright`, `jsdom`) y `npm test`; `esbuild` (fila 89) para `npm run copia-local` |
| `pruebas/ejecutar.mjs` | Levanta el servidor local y ejecuta todas las pruebas de esta carpeta |
| `.github/workflows/pruebas.yml` | Ejecuta `npm test` en cada subida y cada pull request a `main` |
| `pruebas/logica.mjs` | Pruebas de la lógica, sin navegador |
| `pruebas/copias.mjs` | Prueba de las copias de seguridad y del fichero roto |
| `pruebas/conflictos.mjs` | Prueba de las copias en conflicto de Dropbox |
| `pruebas/huerfanas.mjs` | Prueba de las fichas sin carpeta |
| `pruebas/nombres-app.mjs` | Falla si dos ficheros definen la misma función de `App` |
| `pruebas/navegador.mjs` | Prueba de la aplicación entera |
| `pruebas/tipos.mjs` | Prueba de las tarjetas por tipo |
| `pruebas/correos.mjs` | Prueba de lo que deja un correo dentro de un asunto, de la huella del hilo y del elegidor |
| `pruebas/tablon.mjs` | Prueba de cuándo se ve el tablón (a 1905 píxeles) |
| `pruebas/dni.mjs` | Prueba del DNI, del aviso y de las tres mejoras del buscador |
| `pruebas/empresas.mjs` | Prueba del nombre comercial y de cambiar los datos de un tercero |
| `pruebas/guias.mjs` | Prueba de escribir la guía desde la ficha, y del plegado |
| `pruebas/opciones.mjs` | Prueba de las preguntas con opciones, con el caso de la factura |
| `pruebas/registro.mjs` | Prueba de registrar un documento en un paso, sin nombrarlo dos veces |
| `pruebas/copiar-ruta.mjs` | Prueba (navegador de verdad, fila 98, 23-sep-2026): el botón «Ruta» sin ruta apuntada (nombre y aviso), con ruta de Windows (abierto) y estilo Linux (archivado), guardada en `localStorage` y no en `_GESTOR` |
| `pruebas/campos-del-documento.mjs` | Prueba (fila 96, 23-sep-2026): el nombre con los campos del tipo de documento, el obligatorio vacío, un tipo sin campos, con registro, reconocer al renombrar, guardar en `campos.json`; y en navegador el cuadro de poner nombre y el editor de Ajustes |
| `pruebas/campos.mjs` | Prueba de los campos de cada tipo de asunto (ocho escenarios más editar) |
| `pruebas/relacionados.mjs` | Prueba de los terceros relacionados con un asunto, y la nota al archivar |
| `pruebas/duplicados.mjs` | Prueba de que no se dupliquen los asuntos, y de unir los que ya existían |
| `pruebas/ajustes-agil.mjs` | Prueba de las pestañas, el buscador cruzado, el aviso en vivo y la barra fija |
| `pruebas/papelera.mjs` | Prueba de borrar con papelera, devolver y borrar del todo |
| `pruebas/documentos-sueltos.mjs` | Prueba de "Meter en un asunto": un documento suelto a un asunto que ya existe |
| `pruebas/lector-documentos.mjs` | `LectorDocumentos.analizar`, puro, sin pdf.js ni navegador: sello, DNI de un tercero, dos terceros o dos tipos empatados, DNI con la letra mal, texto vacío (17-sep-2026, fila 41) |
| `pruebas/sugerir-asunto-existente.mjs` | Prueba de "Podría ir en...": un abierto del mismo tipo, cuatro abiertos (dos del tipo, dos de otro), archivados sin abiertos, un abierto con un archivado, sin tercero reconocido, y que "Meter en un asunto" pone arriba los del tercero leído (21-sep-2026, fila 88) |
| `pruebas/envios.mjs` | Prueba de mandar documentos por correo: el encargo, el hilo, el límite de 20 MB, "listo" y "error" |
| `pruebas/plantillas.mjs` | Prueba de las plantillas: huecos, "Faltan datos", cambiar de plantilla, sin plantillas, y el recorte de Séneca |
| `pruebas/cambiar-tipo-y-guia.mjs` | Prueba (navegador de verdad, fila 94, 23-sep-2026): cambiar el tipo con hitos intactos (se sustituyen), con uno hecho y otro con nota (se quedan abajo como «no aplica»), diciendo que no, tipo nuevo sin guía y sin cambiar el tipo |
| `pruebas/preguntas-anidadas.mjs` | Prueba (navegador de verdad, fila 95, 23-sep-2026): una guía de tres niveles (modelo, vista y sin requisitos en una pregunta), los hitos en cascada y la poda de todo el subárbol al cambiar una respuesta de arriba, y el editor: entrar dos niveles, escribir, volver y guardar |
| `pruebas/hitos.mjs` | Prueba de los hitos de un asunto: crearlos, marcarlos, bifurcaciones, plazo, responsable y el historial al archivar |
| `pruebas/que-me-toca.mjs` | Prueba de "Qué me toca": los tres bloques, el filtro por responsable, abrir la ficha con el hito desplegado y la cuenta de la barra |
| `pruebas/cuentas.mjs` | Prueba de "Cuentas" (fila 74), sin navegador: cuentas por tipo (con "Sin clasificar"), cursos disponibles, por mes, por quién lo pidió, cuánto se tarda y el texto para "Copiar la tabla" |
| `pruebas/plantillas-documento.mjs` | Prueba (jsdom, sin navegador) de las plantillas de documento: la reparación de huecos partidos, las cuatro clases de hueco, "faltan", el escapado XML, releer el ZIP de salida, el nombre del documento y un `plantillas.json` viejo |
| `pruebas/lo-pide.mjs` | Prueba (jsdom, sin navegador) de "Lo pide": opciones y controles, la línea legible, qué casilla se marca en el correo, los cuatro huecos y "Quitar el dato" |
| `pruebas/biblioteca-de-hitos.mjs` | Prueba (jsdom, sin navegador) de la biblioteca de hitos (fila 79): crear un modelo y traerlo a dos tipos, "solo aquí"/"subir también", el aviso en el otro tipo y "Dejarlo como está", borrar un modelo, un paso-pregunta, si un hito nace informativo, y el enlace de una referencia de normativa |
| `pruebas/nombre-corto-de-tipo.mjs` | Prueba (sin navegador) del nombre corto de un tipo (fila 79, apartado 4.9): el nombre de la carpeta, que `Nombres.leer` lo reconozca, y que cambiarlo no toque los asuntos ya creados |
| `pruebas/nombre-corto-en-los-filtros.mjs` | Prueba (navegador de verdad, fila 97, 23-sep-2026): el nombre corto en los filtros «Por tipo de asunto» y en la etiqueta de la tarjeta, con el largo en el `title`; dos tipos con el mismo corto siguen siendo dos filtros; buscar por el largo y por el corto, abierto y en el ARCHIVO |
| `pruebas/cargar-biblioteca.mjs` | Prueba (jsdom, sin navegador) del botón "Cargar la biblioteca del centro" (fila 80): altas, renombrados con nombre corto, modelos compartidos entre dos tipos, campos propios, una guía ya escrita a mano que no se toca, y que cargarla dos veces no duplica nada |
| `pruebas/cargos.mjs` | Prueba (jsdom, sin navegador, fechas contadas desde hoy) de los cargos del centro (fila 81): ocupante único, dos en cadena, fecha anterior a todos, hueco entre dos, un solape, un cargo sin ocupantes |
| `pruebas/membrete.mjs` | Prueba (sin navegador) de `Membrete.medir` (fila 81): nombre corto (una línea, tamaño máximo), intermedio (una línea, tamaño reducido), largo (dos líneas parejas) y largo sin espacios (no hay dónde partir) |
| `pruebas/formularios.mjs` | Prueba (sin navegador) de `Formularios.buscar`/`etiquetaDeVia` (fila 82): por nombre y por norma, con tildes y sin ellas, texto vacío, las cuatro vías y una desconocida, un formulario sin `u` |
| `pruebas/formularios-rellenar.mjs` | Prueba (sin navegador, con `vm` y pdf-lib, fila 84): las siete reglas de `proponerMapa`, que `rellenarPdf` solo cambia las casillas del mapa y las deja en solo lectura, y que un PDF sin formulario no rompe nada |
| `pruebas/plantillas-del-centro.mjs` | Prueba (sin navegador) de las plantillas del centro (fila 83): `indice.json` cita ficheros que existen, el frontmatter de cada `.md` está completo, todo hueco usado está en el catálogo, cada `.docx` se puede releer, y `{{FORMULARIOS}}` vacío no deja una línea suelta |
| `pruebas/copia-sin-internet.mjs` | Prueba (navegador de verdad, fila 89, 21-sep-2026): genera `copia-local/` y abre su `index.html` por `file://` (sin errores de consola, "copia sin internet" a la vista, la biblioteca y el catálogo de formularios cargan desde `copia-datos/`, un PDF de `formularios/` se abre con pdf.js, un `.docx` de `plantillas/` se lee); y (fila 91) copias de verdad en una carpeta temporal con un servidor que hace de GitHub: al día (ni franja ni permiso), con carpeta y permiso (sola), sin carpeta y sin permiso (franja y «Actualizar ahora»), la ✕, carpeta equivocada (sin bucle), servidor apagado, y `ABRIR EL GESTOR.html` rescatando una copia vieja |
| `pruebas/avisos-que-dicen-la-verdad.mjs` | Prueba (navegador de verdad, fila 100, 23-sep-2026): con solo lo accesorio fallando, marcar un hito, cambiar el estado y archivar dejan el dato guardado y el aviso en ámbar; el asunto ocupado mientras se archiva; el desplegable apagado mientras guarda; un cuadro sobre otro cancela el primero |
| `pruebas/repintar-solo-lo-que-cambia.mjs` | Prueba (navegador de verdad, fila 101, 23-sep-2026): cuenta las lecturas del disco al cambiar el estado con la ficha abierta (solo `asuntos.json`), la lista pendiente hasta volver a ella, el desplegable de estado al marcar un hito con estado, y el aviso de consulta sin repetir |
| `pruebas/documentos-desde-el-hito.mjs` | Prueba (fila 102, 23-sep-2026): normalizar `plantillasDocumento`, la comparación de la biblioteca, agrupar las del paso y las del tipo, los huecos nuevos con y sin hito, el botón en el hito, generar desde él y el editor del paso |
| `pruebas/guardar-en-fila.mjs` | Prueba (navegador de verdad, fila 99, 23-sep-2026): una sola copia al día con lo de antes, dos guardados a la vez sin pisarse, reintentar al leer, una lectura vacía que no escribe, la copia en conflicto que viaja al archivar y el contador de guardado en marcha |
| `pruebas/scripts-cargados.mjs` | Prueba (sin navegador, fila 92, 23-sep-2026): todo `js/*.js` tiene su `<script>` en `index.html` (y al revés), `reintentar-escritura.js` va antes que `carpetas.js`, y `Carpetas.escribirTexto`/`escribirBytes` escriben aunque falte `Reintentar` |
| `pruebas/archivar-sin-avisos-falsos.mjs` | Prueba (navegador de verdad, fila 90, 21-sep-2026): archivar desde la ficha abierta no da el aviso de "otro ordenador"; con Dropbox fallando dos veces al escribir `_ficha.json` y saliendo bien a la tercera, ningún aviso de más; fallando siempre, aviso ámbar en castellano y la ficha sigue en `asuntos.json` |
| `pruebas/estado-por-el-hito.mjs` | Prueba (sin navegador, fila 104, 23-sep-2026): `Hitos.aQuienLeToca` y `Hitos.ladoDelAsunto` (Administración, terceros, pregunta sin responder, solo informativo saltado, todos hechos, sin hitos, estado manual de terceros), la marca de partida de los responsables y `naceSoloInformativo` con los ajustes |
| `pruebas/genero.mjs` | Prueba (navegador de verdad, fila 111, 24-sep-2026): alumna/alumno/sin dato, «El/La Director/a» con firmante mujer, marcas `:tutor1`, lo que no se toca (fechas, y/o, registros, webs), `faltan` al rellenar, forma partida en el Word, sexos del RegAlum/ficha/cargo y una plantilla del centro limpia |
| `apps-script/gestor-correos.gs` | El script de Gmail. No se ejecuta desde la web |
| `docs/CONTEXTO-CORTO.md` | Para decidir: se lee siempre |
| `docs/CONTEXTO.md` | Este documento, para programar |
| `docs/HISTORIA.md` | El diario, con fechas y el porqué de cada cosa |
| `docs/COLA.md` | La cola de instrucciones pendientes |
| `docs/PLAN-ROBUSTEZ-2026-09.md` | El plan de robustez de septiembre de 2026 |
| `docs/CAMBIOS-2026-09.md` | El resumen en llano del plan de robustez, para Francisco |
| `docs/CAMPOS-POR-TIPO.md` | El encargo de los campos de cada tipo de asunto |
| `docs/PAPELERA.md` | El encargo de borrar con papelera |
| `docs/UNIR-VER-DENTRO.md` | El encargo de la pantalla propia de duplicados |
| `docs/REPARTO-CONTEXTO.md` | El encargo de repartir el contexto en tres documentos |
| `docs/CORREOS-AL-ASUNTO.md` | El encargo de enlazar correos a un asunto y seguir el hilo |
| `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md` | El encargo de meter un documento suelto en un asunto que ya existe |
| `docs/AHORRO-CUOTA.md` | Reglas para gastar menos cuota al trabajar la cola |
| `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` | El encargo de adjuntar documentos del asunto a un borrador de Gmail |
| `docs/PLANTILLAS-DE-CORREO.md` | El encargo de las plantillas de correo y de mensaje por tipo |
| `docs/HITOS.md` | El encargo de los hitos de un asunto |
| `docs/QUE-ME-TOCA.md` | El encargo de la pantalla "Qué me toca" |
| `docs/PLANTILLAS-DE-DOCUMENTO.md` | El encargo de las plantillas de documento de Word por tipo |
| `docs/COPIA-SIN-INTERNET.md` | El encargo de la copia sin internet (fila 89) |
| `docs/COPIA-SE-ACTUALIZA.md` | El encargo de la fila 91: que la copia sin internet se actualice de verdad (franja «Actualizar ahora», el instalador rescata copias viejas) |
| `docs/copia-publica.yml.txt` | El contenido, listo para copiar, de la GitHub Action que publica la copia en `fmargon780/gestor-asuntos-copia` (fila 89). En texto plano porque esta sesión no puede crear el repositorio público ni tocar `.github/workflows/`; el destino real es `.github/workflows/copia-publica.yml` de **este** repositorio (dispara con cada `push` a `main`) |
| `docs/CLAVE-COPIA-PUBLICA.md` | Pasos para Francisco (fila 89): crear el repositorio público, el token de grano fino y el secreto `COPIA_TOKEN` |
| `docs/INSTALAR-COPIA.md` | Pasos para Francisco (filas 89 y 91): guardar `ABRIR EL GESTOR.html` en el Dropbox del centro y abrirlo; y lo mismo si la copia se ha quedado vieja |
| `README.md` | — |
