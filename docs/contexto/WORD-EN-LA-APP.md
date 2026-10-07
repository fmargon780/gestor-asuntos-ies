# El Word, dentro de la aplicación

Documento hijo de `docs/CONTEXTO.md` (fila 155, 25-sep-2026, `docs/WORD-DENTRO-DE-LA-APP.md`). Aparte
de `docs/contexto/DOCUMENTOS-PDF.md` (generar el Word, que ya pasaba de 40 KB).

## A. Lo que falta, antes de guardar (`js/word-faltan.js`)

`generarDocumento` (`js/plantillas-documento.js`) rellena la plantilla en memoria (`Docx.rellenar`) y,
si quedan huecos sin dato (menos los de las tablas de datos, que siguen en amarillo), abre con
`U.preguntar` «Faltan datos para este documento»: una línea por hueco (su nombre en palabras,
`WordFaltan.legible`) con su recuadro, y «Generar», «Generar igualmente» (dentro del cuadro) y
«Cancelar» (aviso ámbar «No se ha generado nada.», ningún fichero). Con lo escrito se vuelve a
rellenar la misma plantilla con `valores.aMano` (`{ <hueco tal como salió en faltan>: valor }`):
`Plantillas.rellenar` → `resolverUnHueco` lo mira primero (`escritoAMano`, por la clave, sin
«campo:», y por el nombre legible de un hueco del catálogo). Vale solo para ese documento: no se
guarda en ninguna ficha. El aviso ámbar de después («con huecos sin dato») queda para lo que siga
faltando.

## B. Verlo, guardarlo en PDF e imprimirlo (`js/word-visor.js`, `css/word-visor.css`)

- **Se abre en grande** nada más generarse (`WordVisor.abrir({ blob, nombre, carpeta, asunto, hito })`
  al final de `generarDocumento`) y al pulsar cualquier `.docx`: `Visor.abrir` lo desvía aquí, con la
  carpeta y el asunto de `opts` (la mesa los pasa) o de `App.asuntoDeLaFicha()` (la ficha a la vista).
  Capa `#word-visor` a pantalla completa (z-index 45: por debajo de `#capa` y de los avisos), barra con
  el nombre, «Guardar PDF», «Imprimir» y «Cerrar»; Escape también cierra (si no hay un cuadro encima).
- **Se ve, no se edita.** Lo pinta docx-preview (`js/lib/docx-preview.min.js`, Apache-2.0, con
  `js/lib/jszip.min.js`, MIT o GPL-3.0), en páginas (`section.docx`). Un Word sin tamaño ni márgenes
  (las plantillas del centro no los traen) sale en A4 con 2,5 cm arriba y abajo y 3 cm a los lados.
  «Guardar cambios» (corregirlo dentro de la aplicación) está DESCARTADO con Francisco (fila 165 de
  `docs/COLA.md`, y su apartado «Descartado»): para corregir, se cambia la plantilla o el dato y se genera otra vez.
- **«Guardar PDF»**: cada página, como imagen a 200 ppp (`js/lib/html2canvas.min.js`, MIT) en JPEG,
  en un PDF de pdf-lib con el tamaño de la página en puntos. Sin texto seleccionable. Mismo nombre que
  el Word con `.pdf`; si ya está, pregunta antes de sustituirlo. Nota en el asunto («PDF guardado …») y,
  si el Word vino de un hito, el PDF se apunta en ese hito con su nota. Sin carpeta (un Word abierto
  fuera de un asunto), el botón sale apagado.
- **«Imprimir»**: `window.print()`, con `@media print` que solo deja las páginas del Word.
- Las librerías se cargan con `<script>` al abrir el primer Word (como pdf-lib en
  `js/pdf-herramientas.js`): valen igual en la copia sin internet, que copia `js/` entero.
- **Otros ficheros que el navegador no sabe enseñar** (Excel, un `.doc` viejo…) ya no se abren con
  `window.open` de un `blob:`: se bajan con un enlace `download` con su nombre de verdad.

Prueba: `pruebas/word-dentro-de-la-app.mjs`, con `plantillas/acuerdo-iniciacion-cambio-centro.docx`.
Las pruebas que generaban un Word y seguían trabajando detrás cierran antes el visor
(`WordVisor.cerrar()`).

## «Versiones previas» (fila 160, `docs/VERSIONES-PREVIAS.md`, `js/versiones-previas.js`)

Aquí porque `docs/contexto/DOCUMENTOS-PDF.md` pasa de 40 KB. Subcarpeta `_Previas` (fila 239; antes
`Versiones previas`, que se sigue leyendo y, si el asunto ya la tiene, se sigue usando) en la
carpeta de cada asunto, creada solo cuando hace falta:

- **Qué va**: el «SIN SELLAR» al registrar un documento sellado (`RegistroSellado.asociar`), siempre; y
  el Word (`.doc`/`.docx`) en cuanto hay un PDF con su misma clave de gemelo (sin extensión, «SIN SELLAR»
  ni código de registro; `VersionesPrevias.queMover`), comprobado al registrar (también `Registro`) y al
  «Guardar PDF» del visor. Un Word sin su PDF nunca se mueve solo. Si ya hay uno con el nombre, «(2)».
  No es un borrado (no pasa por la papelera). Archivar, reabrir y fusionar la llevan con la carpeta
  (`Carpetas.fusionarDentro` entra en las subcarpetas).
- **Dónde se ve**: en la ficha (`js/ficha-documentos.js`) y en la mesa (`js/hito-mesa-documentos.js`),
  debajo de los documentos, «N versiones previas · ver», plegado, con «Abrir» y «Sacar de versiones
  previas» (clases `.ficha-previas`/`.mesa-previas`: no cuentan en el número ni en el resumen). En la
  mesa, las de ese hito (las suyas y los gemelos de las suyas; `nombresDeLaCarpeta.previas`, de
  `js/hitos-panel.js`); los hitos no pierden su apunte. El ⋯ de un documento (ficha y mesa) lleva
  «Pasar a versiones previas». El índice del expediente no las ve (lee solo la carpeta del asunto; su
  marca «original sin sellar» se queda para los asuntos aún sin ordenar); el índice del ARCHIVO sí las
  indexa (ya entraba en las subcarpetas).
- **Ajustes › Mantenimiento › «Versiones previas»** (`ordenarTodo`): recorre abiertos y ARCHIVO, dice
  cuántos moverá y de cuántos asuntos, pregunta, mueve y avisa (ámbar con los que no pudo). La segunda
  vez no hay nada que mover.

Prueba: `pruebas/versiones-previas.mjs`.

## «Convertir en plantilla» (fila 280, `docs/CONVERTIR-EN-PLANTILLA.md`)

En el menú ⋮ de un documento de un asunto **abierto** (ficha: `js/ficha-documentos.js`; mesa del hito:
`js/hitos-documento-menu.js`), «Convertir en plantilla». Un `.docx` vale; un PDF vale si su Word gemelo
(`VersionesPrevias.claveGemelo`) está en la carpeta del asunto o en `_Previas`; `.doc`/`.odt`/`.rtf` salen
apagados, con su motivo en `title`; en solo consultar, apagada (`js/solo-consulta.js`). Un PDF sin Word (fila 281)
también se convierte: ver más abajo.

- **Qué hace cada fichero**: `js/docx-sustituir.js` (puro: cambiar texto dentro del `.docx`, quitar
  párrafos por su posición, quitar la cabecera, poner `{{MEMBRETE}}`; SIEMPRE desde el original, con
  `veces` por cambio; un hueco recién puesto se protege con una marca privada); `js/convertir-en-plantilla-propuestas.js`
  (puro: las líneas de los grupos «Datos de este asunto» —`PlantillaDeLoEscrito.cambiarDatos` con
  `sinTildes` y `extra: ['lugarYFecha']`—, «Quien firma», «Para que sirva con hombre y con mujer» y
  «Quitar»); `js/convertir-en-plantilla.js` (de qué fichero se parte, estado, copia de trabajo, plantilla
  rellena con este asunto, guardado); `js/convertir-en-plantilla-pantalla.js` + `css/convertir-en-plantilla.css`
  (los dos pasos; usa `WordVisor.pintarEn`).
- **Reglas que importan**: el original no se toca y en la carpeta del asunto no se escribe nada; la fecha
  del documento (la de su nombre) manda en `{hoy}`, `{hoyLargo}`, `{lugarYFecha}` y en quién ocupaba cada cargo
  (`Plantillas.valoresDeAsunto(a, { fecha })` ya la usa para las tres); una forma doble solo se propone si
  `Genero.resolver`, con el sexo del asunto, devuelve el texto de partida; «Esto se pregunta cada vez» es
  `{campo:Nombre}` (sale en «Faltan datos» sin tocar `Plantillas.rellenar`); un «D.» pegado a un nombre se cambia
  junto con ese nombre (`tambien`) y cuelga de su línea.
- **Al guardar**: nombre repetido en el tipo → rojo; mismo tipo de documento → «Sustituirla» (conserva el
  `id`, la anterior va a la papelera por `Papelera.mandarDato`) / «Guardar como otra»; el `.docx` va a
  `_GESTOR/PLANTILLAS`; con hito elegido, `GuiasDelCentro.cambiarPasos` añade la tarea «Generar «X»»
  (`accion: 'generar'`, `receta.plantilla`) sin duplicarla. Primero el fichero, luego `plantillas.json`, luego la guía.
- Copia de pruebas: `js/demo/datos-plantilla.js` (Word de Carla, PDF y Word gemelo de Marta, `notas antiguas.doc`, sexos).
- Pruebas: `pruebas/convertir-en-plantilla.mjs` (sin navegador) y `pruebas/convertir-en-plantilla-pantalla.mjs`.

### PDF sin su Word (fila 281, `docs/CONVERTIR-EN-PLANTILLA-DESDE-PDF.md`)

Con un PDF sin gemelo, la entrada funciona y `leerPdfSinWord` (`js/convertir-en-plantilla.js`) mira, por este
orden: sin texto (menos de 40 caracteres) → aviso ámbar «imagen escaneada» y no abre; con casillas
(pdf-lib) → aviso ámbar «impreso con casillas»; con tabla → pregunta («Seguir»/«Cancelar»); si vale,
`PdfAParrafos.parrafos` (`js/pdf-a-parrafos.js`: renglones por altura, párrafo si el salto no pasa de 1,5 veces
la letra, guion de corte unido, centrado a ±10 puntos, título = primer centrado que no se repite, lo repetido
en todas las páginas una vez y marcado) y `DocxCrear.crear` (`js/docx-crear.js`: Calibri 11, título centrado,
negrita, a 16; resto justificado) dan un Word nuevo que es «el original» de la fila 280 (un párrafo del Word por
párrafo del PDF, así que los índices de «Quitar» valen). `Prop.proponer({ desdePdf, repetidos })` añade a «Quitar»
lo repetido y los sellos (`Firmado digitalmente`, `CSV`, código de registro…). La pantalla enseña una línea fija
(«Este PDF no tiene su Word: he copiado solo el texto…») y, en «El original» del paso 2, el PDF de verdad
pintado con pdf.js (canvas, no el `<iframe>` del visor: se comprueba igual en un navegador sin visor de PDF).
Copia de pruebas: `JUSTIFICANTE` (2 páginas) y `LISTADO` (tabla) en el asunto de Pablo. Pruebas:
`pruebas/convertir-en-plantilla-pdf.mjs` y `pruebas/convertir-en-plantilla-pdf-pantalla.mjs`.

## «Generar para todos»: muestra, PDF de cada persona y «Ref.» (7-oct-2026, fila 294, `docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md`)

- `WordVisor.pdfDe(blob, { referencia })`: el PDF de un Word sin enseñar el visor. Pinta el Word en un contenedor fuera de la
  vista (`.word-visor-hoja.word-visor-fuera`: mismas clases que la hoja del visor, mismo corte de páginas) y llama a
  `hacerPdfDe(lista, opciones)`, que es la máquina de «Guardar PDF» (ahora con lista de páginas): una imagen a 200 ppp por
  página, soltando el lienzo antes de la siguiente y cediendo el paso al navegador. «Guardar PDF» no cambia ni lleva «Ref.».
  Con `referencia`, cada página lleva ese texto de verdad (Helvetica 7 pt, gris, en vertical en el margen izquierdo, x=12,
  por encima de la banda de la firma —2,5 cm— y por debajo de la del sello): decisión de esta fila, porque abajo a la
  izquierda es donde cae la firma. `WordVisor.abrir({ alCerrar })`: el visor avisa al cerrarse (lo usa la muestra).
- `GrupoGenerar` (`js/grupo-generar.js`) lo usa `GenerarParaRelacionados.generar(a, plantilla, hito, { soloA })`: tras
  preguntar lo que falte, con más de uno por hacer, `muestra` (visor + franja «Así queda el de… Se van a hacer N iguales…»,
  «Generar los N»/«Cancelar»); luego, por persona, el Word, su PDF (`hacerPdf`, mismo nombre, «Ref. D26-01234») y, al
  final, `VersionesPrevias.ordenarTrasCambio` (los Word con PDF se van a «Versiones previas»). Barra fija abajo «Generando
  12 de 30…» con «Parar» (termina el que está a medias). `nombreYaGenerado` prefiere el PDF; un Word sin PDF (se paró o
  falló el PDF) recibe solo el PDF al volver a pulsar. En el hito y en «Enviar a cada uno» va el PDF.
  «Volver a generar» (⋯ de la fila): papelera para su Word y su PDF y de nuevo con `soloA`; apagado con registro o envío.
