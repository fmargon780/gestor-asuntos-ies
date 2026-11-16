# 678 — Al subir un documento no se abre la ventana para elegirlo

## Lo que escribió Francisco
Idea apuntada desde el Centro de mando el 16-nov-2026:

> Desde una tarea y desde los documentos del asunto al querer subir un documento no me deja elegir la carpeta donde tengo guardado el documento en cuestión. Es una situación bloqueante.

## Lo que entendió Claude (acordado con Francisco el 16-nov-2026)
- Francisco usa Edge. Al pulsar «Añadir documento» dentro de Documentos, la ventana de Windows para elegir el archivo **no se abre y no sale ningún aviso**. Desde una tarea pasa lo mismo.
- Es un fallo, no una idea nueva. Impide subir documentos.
- La causa **no está confirmada**. Sospecha de Claude: la ventana se pide empezando en la carpeta del asunto (en Drive desde el 12-nov-2026) y el navegador no la abre. Desde una tarea, además, la ventana se pide después de leer la carpeta y los hitos, y con Drive esa espera puede pasar del tiempo que el navegador da desde la pulsación.
- Qué verá y hará quien use la app:
  - Pulsa «Añadir documento», o la tarea que sube un documento, y se abre la ventana de Windows para elegir el archivo.
  - Si no se puede abrir en la carpeta del asunto, se abre donde Windows quiera y sale el aviso: «No he podido abrir la carpeta del asunto; elige el archivo.»
  - Si no se puede abrir de ninguna forma, sale un aviso rojo con el motivo, nunca silencio.
  - Cuando se abre, todo lo demás de añadir un documento sigue igual.
- Lo del aviso lo propuso Claude y Francisco lo aceptó («1», tal cual).

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- La lentitud de los documentos guardados en la carpeta del asunto y en «Por clasificar»: es la fila 677.
- No se cambia dónde viven las carpetas ni cómo se pasaron.
- No se toca ningún otro sitio donde se elige un archivo (membrete, traer datos), salvo que usen la misma función y se arreglen solos.

## Notas técnicas de Claude
- Leído en `main` el 16-nov-2026. Los dos caminos (tarea y Documentos) acaban en `anadirDesdeOrdenador` (`js/documentos.js`) → `Carpetas.elegirFichero(N.asuntoActual.handle)` (`js/carpetas-ficheros.js`) → `showOpenFilePicker({ startIn })`. También lo usa `js/registro.js` (`prepararEstado`).
- 1. `elegirFichero`: probar con `startIn`; si lanza un error que no sea cancelar, o un `AbortError` que llega en menos de unos 300 ms (nadie cancela tan deprisa: es que no se abrió), avisar con el texto de arriba y repetir **sin** `startIn`. Si la segunda vez falla igual, lanzar el error. Un `AbortError` normal (la persona cierra la ventana) sigue sin avisar.
- 2. `abrir()` en `js/documentos.js`, camino `irDirectoAAnadir`: hoy espera a `pintarLista()` (lee la carpeta y los hitos) y solo después pide la ventana. Pedirla antes de esa espera (en la misma pulsación), pintar la lista y entonces seguir con el fichero elegido, para no pisar el formulario con la lista. Mirar también los sitios que llaman a `Documentos.abrir` con `irDirectoAAnadir` (`js/hitos-anadir.js`, `js/hito-mesa-recetas.js`, `js/ficha-documentos.js`): que no haya un `await` largo antes.
- 3. El `catch` de `abrir()` hoy se traga todos los errores («AbortError: se queda en la lista»). Que ignore solo `AbortError` y para lo demás muestre `U.aviso('No he podido abrir ese fichero: ' + U.mensajeDeError(e), 'malo')`, como ya hace el botón de la lista.
- 4. Pruebas: `js/demo/disco.js` y `pruebas/navegador.mjs` falsean `showOpenFilePicker`. Prueba nueva: (a) con un `startIn` que falla, se llama de nuevo sin `startIn` y sale el aviso; (b) el camino `irDirectoAAnadir` pide la ventana antes de que termine una lectura lenta de la carpeta; (c) un error que no sea cancelar sale en rojo.
- 5. Cambia algo visible (el aviso): añadir su línea a `js/novedades.js` (fila 248).
- 6. Si al leer el código se ve otra causa más clara, decirlo en la nota de la fila. Si no hay manera de confirmar la causa sin el ordenador de Francisco, que el aviso rojo lleve el nombre del error, para que él lo vea y lo diga.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En Edge, en el instituto: abre un asunto, pulsa «Añadir documento» en Documentos. Debe abrirse la ventana de Windows para elegir el archivo.
- Haz lo mismo desde una tarea que pida un documento.
- Si la ventana se abre en otra carpeta y sale el aviso «No he podido abrir la carpeta del asunto», sirve igual: elige el archivo y mira que se añade.
- Si sigue sin abrirse, o sale un aviso rojo, cópialo aquí tal cual: la fila pasa a DEVUELTA con ese texto.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
