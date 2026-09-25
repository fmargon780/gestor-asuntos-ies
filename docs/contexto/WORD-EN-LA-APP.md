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
  «Guardar cambios» (corregirlo dentro de la aplicación) está BLOQUEADO: fila 165 de `docs/COLA.md`.
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

Aquí porque `docs/contexto/DOCUMENTOS-PDF.md` pasa de 40 KB. Subcarpeta `Versiones previas` en la
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
