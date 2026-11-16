# 686 — Añadir un documento más sencillo (tema 683, idea 681)

## Lo que escribió Francisco
Idea 681, apuntada el 16-nov-2026 tras ver una captura en Edge:

> Creo que lo correcto sería que al dar a añadir documento al asunto nos preguntara si queremos añadirlo de la carpeta del asunto, desde el explorador de Windows. También estaría bien hacer un drag and drop.

Decidido con él en el tema 683 (16-nov-2026): «Añadir documento» abre directamente la ventana de Windows, sin preguntar de dónde viene, sin intentar abrirla en la carpeta del asunto y sin el aviso naranja; y se puede arrastrar y soltar un fichero, en cualquier sitio del cuadro de Documentos y de las tareas, para que entre en el asunto sin tarea y sin preguntar la tarea, con el cuadro del nombre de siempre. No habrá lista propia de la carpeta del asunto: lo que se guarda ahí ya sale en Documentos (fila 677).

## Lo que entendió Claude (acordado con Francisco el 16-nov-2026)
- **«Añadir documento»** (en Documentos, en la ficha, en el hito y en una tarea) abre la ventana de Windows directamente, donde Windows quiera abrirla. No sale ningún aviso naranja.
- Si la ventana no se abre de ninguna forma, sigue saliendo el aviso rojo con el motivo («No he podido abrir ese fichero: …»). Cancelar la ventana no avisa de nada.
- **Arrastrar y soltar un fichero** funciona en cualquier sitio del cuadro de Documentos y encima de **cualquier tarea** (hoy solo en la zona de trabajo del hito abierto y en la siguiente tarea).
- Un fichero soltado **entra siempre sin hito ni tarea**, también si se suelta encima de una tarea. No sale «¿De qué tarea es?». Sale el cuadro del nombre de siempre. Después se puede colgar de una tarea con «Colgar de una tarea», como cualquier documento «sin tarea» (fila 680).
- Por eso, soltar un fichero **ya no marca solo** la tarea «Añadir documento» del hito, como hacía la zona de trabajo (fila 109). Solo cuelga y marca quien pulsa el botón «Añadir documento» de esa tarea, que no cambia.
- Si en el cuadro de Documentos ya hay un documento a medias (el cuadro del nombre abierto), soltar otro no hace nada y sale el aviso ámbar «Termina antes con este documento.» (único texto nuevo permitido).
- Un directivo sigue sin poder guardar documentos: soltar no hace nada, como hoy (fila 287).
- Sustituye en esto a la regla de la fila 678 (aviso naranja si la ventana no se abre en la carpeta del asunto).

## Pantalla de prueba
- Sin pantalla: no hay ninguna pantalla nueva; es la ventana de siempre y el cuadro del nombre de siempre.

## Qué NO se hace en esta tarea
- Una lista propia de la carpeta del asunto o la pregunta «¿De dónde viene?»: no habrá (lo guardado en la carpeta ya sale en Documentos, fila 677).
- Cambiar «colgar» por «vincular» en los textos: idea 684.
- La lentitud de los documentos guardados en la carpeta del asunto o en «Por clasificar»: fila 677.
- Soltar varios ficheros a la vez: entra el primero, como hoy.
- El selector de archivo de «Registro» (`js/registro.js`) sigue como está, con su aviso: no es «Añadir documento».

## Notas técnicas de Claude
- Leído en `main` el 16-nov-2026 (d423cb6).
- 1. Ventana directa: en `js/documentos.js`, las dos llamadas `Carpetas.elegirFichero(asunto.handle)` (en `abrir()` y en `anadirDesdeOrdenador()`) pasan a `Carpetas.elegirFichero()` sin carpeta de inicio. No se toca `elegirFichero` (`js/carpetas-ficheros.js`): `js/registro.js` y el membrete lo siguen usando como ahora. El camino `irDirectoAAnadir` sigue pidiendo la ventana en la misma pulsación (fila 678).
- 2. Soltar: pieza nueva `js/soltar-documento.js` (apuntada en su lista `js/cargar-piezas-N.js`, no en `index.html`), por debajo de 400 líneas. Una sola función que engancha `dragover`/`dragleave`/`drop` y llama a `Documentos.abrir(a, { ficheroSoltado: f })` **sin `hito` ni `tarea`**. Se engancha a: `#trabajo-columnas` (sustituye `soltarAlHito`, `js/hito-mesa-documentos.js` ~l. 322-347), cada `.guion-paso` (sustituye `.guion-soltar`, `js/hito-mesa-guion.js` ~l. 286-298; la etiqueta «Suelta aquí el PDF» puede salir en cada tarea o quedarse donde está: no se cambia su texto) y el cuerpo del cuadro de Documentos (`#doc-cuerpo` y su formulario). Respetar `Perfil.esDirectivo()`. Los repintados de la mesa vuelven a enganchar, como hoy.
- 3. Cuadro ya abierto: `Documentos.abrir` abre un `U.preguntar`, y solo puede haber uno a la vez. Si el cuadro de Documentos ya está abierto (`N.asuntoActual` y `#doc-cuerpo` en pantalla), soltar llama a `N.pintarFormulario({ modo: 'anadir', … })` en vez de abrir otro; si ya hay formulario con un fichero, `U.aviso('Termina antes con este documento.', 'ambar')` y no se hace nada.
- 4. Sin hito ni tarea el cuadro del nombre ya funciona (fila 680): `N.hitoActual` y `N.tareaActual` nulos, `preguntarTarea` falso. Mirar `documentos-formulario.js` (~l. 175, `pideHito`) para que el desplegable «Hito» siga como hoy y no pida nada más.
- 5. Pruebas: quitar lo que esperaba el aviso naranja al añadir documento (`pruebas/abrir-ventana-de-subir.mjs`, caso «a» y «a2»: ahora se llama a `showOpenFilePicker` una sola vez, sin `startIn`, y sin aviso; el caso «b» y «c» siguen). Adaptar las pruebas que sueltan ficheros con `dataTransfer` si dependen del hito o de la tarea (`pruebas/esperas.mjs`, `espera-sin-marcar.mjs`, `registro-origen.mjs`, `documentos-persona-de-las-listas.mjs`: mirarlas con `npm test -- <palabra>`; no borrarlas).
- 6. Prueba nueva `pruebas/soltar-documento.mjs`: (a) «Añadir documento» llama a `showOpenFilePicker` sin `startIn` y sin aviso; (b) soltar sobre una tarea que no es la siguiente abre el cuadro del nombre y el documento queda «sin tarea»; (c) soltar en el cuadro de Documentos vacío abre el formulario; (d) con el formulario abierto, soltar avisa y no cambia nada; (e) un directivo no guarda; (f) soltar sobre la zona del hito no marca la tarea «Añadir documento».
- 7. Cambia algo visible: línea en `js/novedades.js` (fila 248): «Ya puedes arrastrar un fichero a cualquier tarea o al cuadro de Documentos, y «Añadir documento» abre la ventana sin avisos.»
- 8. Palabras según `docs/VOCABULARIO.md`. Tarea grande: segundo revisor. Publicar una sola vez.

## Cómo lo comprueba el segundo revisor
- En el cuadro de Documentos, «Añadir documento» abre la ventana de elegir archivo sin ningún aviso naranja (con el selector simulado de la copia de pruebas).
- Si la ventana falla, sale el aviso rojo con el motivo; si se cancela, no sale nada.
- Soltar un fichero en el cuadro de Documentos vacío abre el cuadro del nombre de siempre, sin «¿De qué tarea es?».
- Soltar un fichero sobre cualquier tarea de un hito abierto (no solo la siguiente) abre el cuadro del nombre; al guardar, el documento queda «sin tarea» y ninguna tarea se marca sola.
- Soltar sobre la zona de trabajo del hito hace lo mismo y no marca «Añadir documento».
- Con un documento a medias en el cuadro, soltar otro avisa «Termina antes con este documento.» y no cambia nada.
- El botón «Añadir documento» de una tarea sigue colgando el documento de esa tarea.
- Entrando como directivo, soltar no guarda nada.
- No sale ningún texto nuevo salvo el aviso ámbar de arriba y la línea de «Qué hay de nuevo».

## Qué mirar al terminar
- En Edge, en el instituto: abre un asunto, ve a Documentos y pulsa «Añadir documento». Debe abrirse la ventana de Windows, sin aviso naranja.
- Arrastra un PDF desde el Explorador de Windows al cuadro de Documentos. Debe salir el cuadro del nombre.
- En el hito abierto, arrastra un PDF encima de una tarea que no sea la siguiente. Debe salir el cuadro del nombre y, al guardar, el documento queda «sin tarea».
- Pulsa «Añadir documento» dentro de una tarea. Debe colgarse de esa tarea, como siempre.
- Si algo falla o sale un aviso rojo, cópialo aquí tal cual: la fila pasa a DEVUELTA con ese texto.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
