# 677 — Los documentos guardados en la carpeta del asunto y en «Por clasificar» tardan mucho en salir

## Lo que escribió Francisco
Idea apuntada desde el Centro de mando el 16-nov-2026:

> Desde que hemos trasladado las carpetas, detectamos que cuando guardamos un documento en la carpeta del asunto vivo, tarda mucho la app en detectarlo y mostrarlo como documento del asunto. Antes era casi inmediato.

Después, el mismo día (16-nov-2026, a las 10:06), Francisco añadió en la conversación: «El mismo problema lo hemos detectado en los documentos que llegan a la bandeja de documentos Por Clasificar.»

## Lo que entendió Claude (acordado con Francisco el 16-nov-2026)
- No es una idea nueva: es un fallo de rapidez desde el paso a Drive (`C:\Google Drive`, 12-nov-2026).
- Es el mismo problema en dos sitios: la carpeta del asunto vivo y la bandeja «Por clasificar». Se arregla en esta misma fila, los dos a la vez.
- Quien use la app guarda un documento en la carpeta de un asunto vivo y la app debe enseñarlo como documento del asunto tan deprisa como antes del traslado, y lo mismo un documento que llega a «Por clasificar».
- Qué verá y hará la usuaria: nada distinto. Guarda el documento y sale en el asunto al poco, como antes. Ninguna pantalla, botón ni texto cambia.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- No se cambia ninguna pantalla, botón ni texto. Lo único que cambia es que el documento sale solo.
- «Por clasificar»: ya resuelto (16-nov-2026 y fila 687).
- No se añade ningún aviso de «ha llegado un documento» en el asunto.
- No se cambia dónde viven las carpetas (siguen en Drive) ni cómo se pasaron.

## Notas técnicas de Claude
- **Causa (18-nov-2026, con las medidas reales; detalle abajo, en «Revisión y respuestas»).** Drive no es lento: leer la carpeta tarda centésimas de segundo. Lo que pasa es que la app **no vuelve a mirar la carpeta del asunto que está abierto**: solo la lee al abrir la ficha y tras una acción de la propia app. Un documento guardado desde fuera (Word, el explorador, el escáner) no sale hasta que se sale del asunto y se vuelve a entrar. «Por clasificar» ya quedó resuelto (carpeta de entrada señalada el 16-nov y aviso de la fila 687): aquí no se toca.
- **El arreglo.** Con una ficha de asunto abierta, la app mira la carpeta de ese asunto cada `App.SEGUNDOS_ENTRE_MIRADAS` (20 s) y al volver a la ventana, y repinta los documentos solo si la lista de nombres ha cambiado.
- **Ficheros a tocar (cambios quirúrgicos, nada más):**
  - Nuevo `js/ficha-carpeta-vigilar.js`, por debajo de 400 líneas, apuntado en su lista `js/cargar-piezas-N.js` (no en `index.html`).
  - `js/documentos-vigilancia.js`: en `App.vigilarLaCarpeta`, engancharlo al temporizador y al foco igual que `mirarCopiasDeRuta` (fila 478). `App.mirarLaCarpeta` no se toca.
  - `js/medidas-pantalla.js`: el nombre en llano de la medida nueva.
  - `js/novedades.js`: una línea (fila 248).
  - Nueva `pruebas/ficha-carpeta-vigilar.mjs`.
- **Cómo mira.** Asunto: `App.asuntoDeLaFicha()`; si no hay ficha a la vista, no hace nada. Lee `Carpetas.ficheros(a.handle)` y se queda con los nombres que la lista de documentos enseña (mismos filtros que `FichaDocumentos.pintar`: fuera `Carpetas.esFicheroDeGoogle` y los temporales, como `~$…` de Word, mirando `App.esDocumentoDeTrabajo`). Compara con los nombres de la mirada anterior **de ese mismo asunto**; la primera mirada tras abrir o cambiar de asunto solo apunta, no repinta.
- **Cuándo se salta la mirada** (y lo intenta en la siguiente): con un guardado en marcha (`ColaGuardado.hayGuardado()`), con un cuadro abierto (`U.preguntar`), con la aplicación oculta, o con otra mirada suya a medias.
- **Cómo repinta.** Con el mismo repintado que la app ya usa cuando ella misma añade un documento al asunto (buscarlo en `js/documentos.js` al terminar de guardar; debe cubrir la lista de la ficha, el recuadro «Documentos» del hito abierto y los avisos de sello y de firma, y también la pantalla del asunto sin hitos de la fila 699 si ya está en `main`). Envuelto en `U.conservandoLoEscrito`, con contador de turno, y sin repintar si mientras tanto se cambió de asunto. No escribe nada en ninguna carpeta. Sin aviso en pantalla: el documento sale en la lista y ya está.
- **Medida:** `asunto.mirar-carpeta` (`Medidas.tiempo`), para ver después cuánto cuesta.
- **Prueba nueva** (`pruebas/ficha-carpeta-vigilar.mjs`, con carpetas simuladas): (a) con la ficha abierta aparece un fichero en la carpeta y, tras una mirada, sale en Documentos sin pulsar nada; (b) si se está escribiendo en un campo de la ficha, lo escrito, el foco y el cursor siguen igual; (c) con un cuadro abierto no repinta, y al cerrarlo sí; (d) si los nombres no cambian, no repinta (contar llamadas); (e) al cambiar de asunto no repinta el anterior; (f) un `~$documento.docx` no provoca repintado.
- Novedad (`js/novedades.js`): «Un documento que guardas en la carpeta del asunto que tienes abierto sale solo en Documentos, sin salir y volver a entrar.»
- Una sola tanda de pruebas al final (`npm test -- ficha-carpeta-vigilar documentos medidas`); la pasada completa, según la regla del día. Las pruebas no tocan datos reales (`docs/METODO-COMUN.md`, 6.4).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Con un asunto abierto, guardar un documento en su carpeta desde fuera de la app (Word o el explorador) y ver que sale en Documentos en menos de medio minuto, o al volver a la ventana de la app, sin pulsar nada. Esto solo lo puede ver Francisco en el instituto: la copia de pruebas no tiene carpetas de verdad.
- Lo que mira Claude: la prueba nueva en verde y, a los dos días, la medida `asunto.mirar-carpeta` en `SOPORTE-AVISOS/_MEDIDAS` (debe ir en centésimas de segundo).

## Revisión y respuestas durante el trabajo
- (16-nov-2026, Claude Code) Causa **no** encontrada leyendo el código; no se inventa un arreglo. Lo que se ha visto:
  - «Por clasificar»: `App.mirarLaCarpeta` lee con `Carpetas.contenido(App.E.abiertos)` la raíz entera cada 20 s y al volver a la ventana; si los nombres no cambian sale sin hacer más. La lectura es `dir.entries()` sin más, así que su tiempo depende de la carpeta (en Drive, de cuántas carpetas hay en la raíz).
  - Carpeta del asunto vivo: la mirada periódica solo compara nombres de carpetas y sueltos de la raíz; **no relee la carpeta de un asunto abierto**. Los documentos de un asunto se leen en `FichaDocumentos.pintar` (al abrir la ficha y tras acciones de la propia app). Si un fichero guardado desde fuera se veía «casi inmediato» antes, no está claro por qué camino; hace falta ver cuánto tardan las lecturas.
  - Medidas nuevas (`js/medidas.js`, llegan por el buzón de soporte): `carpeta.mirar` (toda la mirada), `carpeta.leer-abiertos` (solo la lectura de nombres de la raíz) y `asunto.leer-documentos` (leer los ficheros de la carpeta de un asunto). Salen con su nombre en llano en la pantalla de Medidas.
  - Falta ver: los tiempos de `carpeta.leer-abiertos` y `asunto.leer-documentos` en el ordenador del instituto. Con ellos se decide si es Drive (lectura lenta) o la app (falta mirar la carpeta del asunto abierto).
  - Comparación con la instrucción (tarea pequeña, sin segundo revisor): no cambia nada de lo que ve la usuaria; coincide.
- (18-nov-2026, Claude, con las medidas de `SOPORTE-AVISOS/_MEDIDAS/MEDIDAS gestor-asuntos-ies 2026-11.json`, recibidas hasta el 17-nov 14:58) **Atasco resuelto: no es Drive, es la app.**
  - Leer los nombres de la carpeta de asuntos (`carpeta.leer-abiertos`), en los dos ordenadores del instituto, 16 y 17-nov: 1.972 lecturas, media de 23 a 49 ms; 1.965 por debajo de 100 ms.
  - Leer la carpeta de un asunto (`asunto.leer-documentos`): 193 lecturas, media de 40 a 60 ms en tres de las cuatro tandas.
  - Una sola excepción: el 16-nov, en el ordenador `0vlyw2`, una lectura de 4 s de la carpeta de asuntos y una de 5,5 s de la carpeta de un asunto (2 de 393). Es un tirón puntual, no la causa de que «tarde mucho».
  - Con lecturas tan rápidas, lo único que explica la espera es lo ya visto el 16-nov: la mirada de cada 20 s no relee la carpeta del asunto abierto. El historial del repositorio no enseña que antes lo hiciera; lo que cambió con el traslado no se ha podido ver.
  - No cambia lo acordado con Francisco («Guarda el documento y sale en el asunto al poco»): la fila vuelve a PENDIENTE con el arreglo escrito en «Notas técnicas».
