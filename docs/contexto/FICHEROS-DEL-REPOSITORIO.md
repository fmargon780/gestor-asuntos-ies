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
| `js/util.js` | Utilidades comunes, y la comparación de nombres parecidos. `U.mensajeDeError(e)` traduce al castellano los errores del navegador (`NotFoundError` y compañía). `U.envolver`/`U.envolturasAplicadas`/`U.envolturasFallidas` (fila 70) apuntan las envolturas de la aplicación |
| `js/almacen.js` | Guarda los ajustes en el navegador |
| `js/carpetas.js` | Habla con el selector de carpetas del navegador. Lee y escribe los JSON. `Carpetas.esCarpetaTemporalDeSincronizacion` descarta, en un solo sitio, las carpetas y ficheros que dejan Dropbox y Drive al sincronizar; `contarFicheros`/`copiarDentro`/la fusión los saltan, y un fichero que desaparece a mitad de copia se reintenta una vez |
| `js/copias.js` | Copia de seguridad diaria de los ficheros de `_GESTOR`, y detección de fichero roto |
| `js/conflictos.js` | Las copias en conflicto que deja Dropbox: fusión sola o aviso para elegir |
| `js/fichas-huerfanas.js` | Fichas de `asuntos.json` cuya carpeta ya no está: enlazar o borrar |
| `js/nombres.js` | Monta los nombres de carpetas y documentos |
| `js/plazos.js` | La fecha límite de los asuntos |
| `js/guias.js` | Pintar y escribir una guía, con sus preguntas y opciones; en el editor de cada paso llama a `js/guias-requisitos.js` para "lo que hay que reunir" (fila 59) y a `js/guias-comunicacion.js` para su comunicación propia (fila 60) |
| `js/guias-requisitos.js` | La sección "Lo que hay que reunir" del editor de un paso (`GuiasRequisitos.bloqueHTML`/`leer`/`enganchar`, fila 59, aparte de `js/guias.js` para no engordarlo) |
| `js/guias-comunicacion.js` | La sección "Comunicación de este paso" del editor de un paso (`GuiasComunicacion.bloqueHTML`/`leer`/`enganchar`, fila 60, aparte de `js/guias.js`); reutiliza el campo de texto con "Insertar hueco" de `js/plantillas-ajustes.js` |
| `js/datos.js` | Lee los CSV; el nombre comercial y las columnas leídas por su título; `Datos.tutoresDe` agrupa los tutores legales por persona y `Datos.resumenDeTercero` monta la línea "Datos y contacto" |
| `js/campos.js` | Los campos de cada tipo de asunto: catálogo, cálculo y guardado |
| `css/campos.css` | Los estilos del bloque "Datos del asunto" y del cuadro de Campos |
| `js/documentos.js` | Nombra los documentos, con el texto adicional y los tipos sin duplicados |
| `js/usabilidad.js` | Volver, Cancelar, etiquetas de filtros, vista compacta y Escape |
| `js/nucleo.js` | El estado, el arranque y el cambio de pantalla |
| `js/version.js` | `App.VERSION`, la fecha y hora de la última publicación |
| `js/asuntos-lista.js` | Asuntos abiertos: las tres tarjetas, las tarjetas por tipo y la lista. Al leer la carpeta, descarta las que parecen temporales de sincronización, salvo que ya tengan ficha en `asuntos.json` |
| `js/unir-asuntos.js` | Une asuntos duplicados que ya existen: aviso junto a Actualizar y pantalla propia "Duplicados" (`css/unir-asuntos.css`) |
| `js/asuntos-editar.js` | Editar un asunto abierto: renombra la carpeta y mueve su ficha. También `App.renombrarAsuntosAbiertosDelTercero`, al llegar el Nº de identificación escolar de un aspirante (fila 42) |
| `js/elegir-asunto.js` | El cuadro de escoger un asunto a mano, compartido por "Por clasificar" y por la bandeja de correos |
| `js/documentos-sueltos.js` | Los papeles sin asunto, "Meter en un asunto", cerrar y reabrir, y la vigilancia de la carpeta |
| `js/documentos-sueltos-lector.js` | Envuelve `App.tarjetaSuelto` para proponer tipo/fecha/registro/tercero de cada PDF suelto, con el botón "Aceptar" (17-sep-2026, fila 41); si el documento de identidad no cuadra con nadie, el botón "Dar de alta" (fila 42) |
| `js/contexto-documentos.js` | `ContextoDocumentos.delCentro()`: las tres listas de terceros y los tipos con los que `LectorDocumentos.analizar` coteja, sacada de `documentos-sueltos-lector.js` para que la use también la fila siguiente (18-sep-2026, fila 49) |
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
| `js/puente.js` | El enganche de los módulos que se añaden por fuera (`window.Gestor`) |
| `js/avisos.js` | El aviso de lo que vence |
| `js/frescura.js` | El aviso de que el RegAlum.csv está viejo, y sus épocas |
| `js/recurrentes.js` | Los asuntos que se repiten cada mes, trimestre o curso; la sección "Se repite" de la pantalla de un tipo (`Recurrentes.pintarEnContenedor`, 17-sep-2026) |
| `js/guias-enganche.js` | Las guías dentro de la app, y `window.GuiasDelCentro` |
| `js/hitos.js`, `js/hitos-archivo.js` | El modelo de los hitos de un asunto: leer/escribir `hitos.json`, crearlos desde la guía, marcarlos, bifurcaciones, responsables y el historial al archivar; `js/hitos.js` trae también `requisitos` y `faltanObligatorios` (fila 59) |
| `js/que-me-toca.js` | Pantalla propia "Qué me toca": cruza los hitos pendientes y en curso de todos los asuntos abiertos, en tres bloques (`css/que-me-toca.css`); arriba, el aviso de aspirantes sin Nº de identificación escolar (fila 42) |
| `js/presencia.js` | No pisarse en un mismo asunto: la señal de `_GESTOR/presencia.json`, la vigilancia y la marca de la tarjeta de la lista |
| `js/notas.js` | Las notas de cada asunto, con su enlace y su botón; `Notas.pintarEnFicha` es la caja de escribir directa de la ficha, con botón Guardar (se guarda al pulsarlo o al perder el foco, nunca al teclear, fila 58); `confirmarSalirDeFicha` avisa si se sale con algo sin guardar |
| `js/registro.js` | Registrar un documento en un paso, sin nombrarlo dos veces |
| `js/registro-lector.js` | Leer el número de registro del sello de Séneca, dentro del PDF (hasta 10 páginas); `textoDe` saca el texto de hasta 5 páginas sin buscar nada (17-sep-2026, fila 41) |
| `js/lector-documentos.js` | `LectorDocumentos.analizar(texto, contexto)`, puro: propone tipo, fecha, documentos de identidad y tercero de un documento suelto (17-sep-2026, fila 41); si un documento de identidad no cuadra con nadie, también `terceroDesconocido` (fila 42) |
| `js/registro-sellado.js` | Ver solo un PDF ya sellado en la carpeta del asunto, y colocarlo sin duplicarlo |
| `js/pdf-herramientas.js` | Partir, unir y sacar páginas de un PDF con pdf-lib: solo bytes, sin disco ni DOM |
| `js/pdf-margenes.js` | La cuenta y el PDF nuevo de "Ajustar tamaño" (llamado "Preparar el documento" hasta la fila 58): solo bytes, sin disco ni DOM (18-sep-2026, fila 57) |
| `js/preparar-documento.js` | El cuadro de "Ajustar tamaño": vista previa con pdf.js, bandas ocupadas o libres, y el guardado con papelera (18-sep-2026, fila 57; el nombre del botón cambió en la fila 58) |
| `js/pdf-separar-unir.js` | El cuadro de Separar, Unir y Sacar páginas: miniaturas con pdf.js, tijeras, casillas |
| `js/verificacion.js` | El código de verificación del pie de un documento, y su dirección |
| `js/lib/pdf.min.js`, `js/lib/pdf.worker.min.js` | pdf.js (Mozilla) 3.11.174, copiado tal cual |
| `js/ficha-asunto.js` | La pantalla de un asunto: cabecera (con la línea gris del subtítulo, fila 51; barra de 5 acciones y el `<h2>` con sus dos añadidos, fila 52), Hitos a la izquierda, Documentos en el centro, "Datos y contacto"/Notas/los dos plegables/Datos del trámite a la derecha |
| `js/ficha-menus.js` | El menú pequeño reutilizable de la cabecera (abrir, cerrar con Escape/al pulsar fuera, uno solo a la vez): lo usan los tres puntos del nombre y "Comunicar" (18-sep-2026, fila 52) |
| `js/ficha-nombre-acciones.js` | El menú de tres puntos del `<h2>` del nombre del asunto (Editar, Borrar, fila 52) y, debajo, la fila de copiar de un gesto (Asunto, NIE, Nombre, DNI/CIF, fila 58) |
| `js/ficha-plegables.js` | Los dos bloques plegables de la ficha ("Otros asuntos de este tercero", "Personas y entidades relacionadas"): montar el `<details>`, el resumen con la cuenta, guardar y reponer el abierto/cerrado entre un repintado y otro (18-sep-2026, fila 51) |
| `js/ficha-documentos.js` | Los documentos de la carpeta, en la ficha del asunto (separado de `js/ficha-asunto.js` en la fila 26); pone la clase `vacio` al bloque cuando no hay ninguno (fila 51); botón "Documentos ▾" en la cabecera del bloque (fila 52); el original "SIN SELLAR" en gris y "Asociar a un hito" en cada fila (fila 58) |
| `js/ficha-tercero.js`, `css/ficha-tercero.css` | "Datos y contacto" del tercero: la línea resumen y la ventana "Ver todo" con los tutores agrupados por persona (separado de `js/ficha-asunto.js` en la fila 37) |
| `js/hitos-panel.js` | Pinta los hitos en la ficha del asunto (los pasos de la guía SON los hitos): el observador (solo `childList` sobre `#ficha-asunto-cuerpo`, sin `subtree`, desde la fila 58), el repintado y la creación automática |
| `js/hitos-panel-lista.js` | La otra mitad del panel de hitos: la fila de cada hito, su cuerpo desplegado, el cambio de rama, "lo que hay que reunir" (llama a `js/hitos-requisitos.js`, fila 59) y la guarda antes de pasar un hito a hecho |
| `js/duplicados.js` | ¿Esto no lo hicimos ya? Asuntos iguales del mismo tercero; exporta también `carpetaDelTercero` (fila 40) |
| `js/relacionados.js` | Terceros relacionados con un asunto, la nota al archivar, "+ Añadir varios" y los atajos de alumnado |
| `js/otros-del-tercero.js`, `css/ficha-asunto.css` | Bloque "Otros asuntos de este tercero" (separado de `js/ficha-asunto.js` en la fila 40): cada línea se pulsa y abre su ficha, y el botón "← Volver a …" que apunta siempre al asunto de partida |
| `js/grupos.js` | Grupos propios de personas, guardados con nombre en `_GESTOR/grupos.json` |
| `js/hitos-archivo.js` | La otra mitad del modelo de hitos: bifurcaciones, responsables de Ajustes y el `HISTORIAL DE TRAMITACION.txt` al archivar/reabrir |
| `js/ficha-archivo.js` | La ficha de un asunto archivado, en su propia carpeta (`_ficha.json`, `window.FichaArchivo`, fila 64): envuelve `App.cerrarAsunto`/`App.reabrirAsunto` por fuera de `js/hitos-archivo.js`, y el botón "Poner en orden las fichas del ARCHIVO" de Ajustes → Mantenimiento |
| `js/contacto-migracion.js` | Botón "Guardar el contacto de los asuntos abiertos" de Ajustes → Mantenimiento (`window.ContactoMigracion`, fila 66): rellena `ficha.contacto` en los abiertos que todavía no lo tienen |
| `js/avisos-que-faltan.js` | Fila 68: los avisos de "fichas sin carpeta" y de la papelera vieja en la pantalla de Asuntos abiertos (`window.AvisosQueFaltan`), envolviendo `App.verAbiertos` |
| `js/hitos-requisitos.js` | "Lo que hay que reunir" de un hito, enganchado a `window.Hitos` como `js/hitos-archivo.js`: marcar/escribir/añadir/quitar/editar/traer una casilla, y también la pintura del bloque dentro de la ficha y "Pedir lo que falta" (fila 59) |
| `js/hitos-comunicar.js` | El botón "Comunicar" propio de un hito (fila 60): lee la comunicación de su paso de origen, resuelve el destinatario y los huecos, abre el cuadro de Correo/Séneca ya relleno (vía `CorreoNucleo`) y pinta el botón en la ficha. No añade nada a `window.Hitos`: nada de esto se guarda en el hito |
| `js/visor.js` | El panel de la derecha para ver un documento (`con-visor`); marcador y acciones opcionales para que quien lo abre sepa qué se está viendo |
| `js/tipos-buscador.js` | Buscar el tipo de asunto por letras, y los más usados arriba |
| `js/via-contacto.js` | Los teléfonos y correos del tercero, como botones |
| `js/tablon.js` | El tablón de notas rápidas, con las notas "Solo para mí" |
| `js/copiar.js` | Los botones de copiar: el nombre del documento en la ficha, y `Copiar.boton`/`nieDeAsunto`/`categoriaDe`/`copiar` expuestos en `window.Copiar` para la fila de copiar de un gesto (`js/ficha-nombre-acciones.js`, fila 58) |
| `js/plantillas.js` | Leer y guardar `plantillas.json`, montar `Plantillas.valoresDeAsunto` y rellenar los huecos: el motor, sin pantalla. El hueco `{{LO QUE FALTA}}`, con doble llave, se sustituye aparte y siempre (`tieneLoQueFalta`, fila 59) |
| `js/plantillas-ajustes.js` | Las plantillas de correo (sacado de `js/plantillas.js`); desde el 17-sep-2026 (fila 39) pinta solo las de un tipo dentro de su pantalla (`PlantillasAjustes.pintarDeTipo`) y los campos de Datos del centro y firma, en "El centro"; `campoDeTextoHTML`/`engancharCampoDeTexto` (fila 60), el campo de texto con "Insertar hueco" del cuadro de una plantilla, reutilizado por `js/guias-comunicacion.js` |
| `js/correo.js` | El correo y el mensaje de Séneca: la lógica compartida (rastro, plantillas, grupos en copia oculta) y quién abre y pinta el cuadro (`abrirCuadro`/`pintarCuadro`, que desde la fila 58 delegan el cuerpo propio de cada cuadro en `js/seneca-cuadro.js`/`js/correo-cuadro.js`); expone `window.CorreoGrupos` (fila 47) para que `js/seneca-destinatarios.js` reutilice el mismo desplegable, `CorreoNucleo.montarBotonComunicar` (fila 59) para que "Pedir lo que falta" de un hito reutilice el mismo menú "Comunicar", y `asuntoListoActual`/`medioListoActual`/`correoPreferenteActual`/`comunicarHitoActual` (fila 60) para que "Comunicar" de un hito abra el cuadro ya con su propio mensaje resuelto y deje la constancia una vez |
| `js/correo-cuadro.js`, `css/correo.css` (`.cuadro-correo`, `.correo-grid`) | El cuerpo propio del cuadro de Correo (separado de `js/correo.js` en la fila 58): destinatario, asunto, mensaje, documentos adjuntos y CCO, en dos columnas; la dirección preferente de un hito (fila 60) tiene prioridad sobre la de "Lo pide" |
| `js/idea.js` | El usuario IdEA de una persona (y el de sus tutores legales), leído por el título de columna del CSV, como `js/dni.js` (fila 47) |
| `js/seneca-destinatarios.js` | La lista de usuarios IdEA del cuadro de Séneca, en chips, con "Copiar la lista"/"Copiar el siguiente" (fila 47) |
| `js/seneca-ayudante.js`, `css/relacionados.css` (`.marcado-chip-copiado`) | El enlace-marcador que pega los usuarios IdEA uno a uno en Séneca (fila 47) |
| `js/docx.js` | Rellenar los huecos de una plantilla de Word: ZIP y XML a mano, sin librerías (`window.Docx`) |
| `js/plantillas-documento.js` | Botón "Generar documento" en la ficha; desde el 17-sep-2026 (fila 39) pinta solo las plantillas de documento de un tipo dentro de su pantalla (`PlantillasDocumento.pintarDeTipo`, `css/plantillas-documento.css`) |
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
| `js/hitos-ajustes.js` | El bloque "Hitos" de Ajustes: responsables y días no lectivos |
| `css/hitos.css` | El aspecto de la lista de hitos en la ficha del asunto, y del bloque de Ajustes |
| `js/inicio.js` | La última línea: `App.arrancar()` |
| `js/envolturas-esperadas.js` | El **último** `<script>` de todos (fila 70): compara `U.envolturasAplicadas()` con la lista de las 42 que tienen que estar, y avisa en rojo en la pantalla de entrada si falta alguna (`window.EnvolturasEsperadas`) |
| `package.json` | Las dependencias de las pruebas (`playwright`, `jsdom`) y `npm test` |
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
| `pruebas/campos.mjs` | Prueba de los campos de cada tipo de asunto (ocho escenarios más editar) |
| `pruebas/relacionados.mjs` | Prueba de los terceros relacionados con un asunto, y la nota al archivar |
| `pruebas/duplicados.mjs` | Prueba de que no se dupliquen los asuntos, y de unir los que ya existían |
| `pruebas/ajustes-agil.mjs` | Prueba de las pestañas, el buscador cruzado, el aviso en vivo y la barra fija |
| `pruebas/papelera.mjs` | Prueba de borrar con papelera, devolver y borrar del todo |
| `pruebas/documentos-sueltos.mjs` | Prueba de "Meter en un asunto": un documento suelto a un asunto que ya existe |
| `pruebas/lector-documentos.mjs` | `LectorDocumentos.analizar`, puro, sin pdf.js ni navegador: sello, DNI de un tercero, dos terceros o dos tipos empatados, DNI con la letra mal, texto vacío (17-sep-2026, fila 41) |
| `pruebas/envios.mjs` | Prueba de mandar documentos por correo: el encargo, el hilo, el límite de 20 MB, "listo" y "error" |
| `pruebas/plantillas.mjs` | Prueba de las plantillas: huecos, "Faltan datos", cambiar de plantilla, sin plantillas, y el recorte de Séneca |
| `pruebas/hitos.mjs` | Prueba de los hitos de un asunto: crearlos, marcarlos, bifurcaciones, plazo, responsable y el historial al archivar |
| `pruebas/que-me-toca.mjs` | Prueba de "Qué me toca": los tres bloques, el filtro por responsable, abrir la ficha con el hito desplegado y la cuenta de la barra |
| `pruebas/plantillas-documento.mjs` | Prueba (jsdom, sin navegador) de las plantillas de documento: la reparación de huecos partidos, las cuatro clases de hueco, "faltan", el escapado XML, releer el ZIP de salida, el nombre del documento y un `plantillas.json` viejo |
| `pruebas/lo-pide.mjs` | Prueba (jsdom, sin navegador) de "Lo pide": opciones y controles, la línea legible, qué casilla se marca en el correo, los cuatro huecos y "Quitar el dato" |
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
| `README.md` | — |

