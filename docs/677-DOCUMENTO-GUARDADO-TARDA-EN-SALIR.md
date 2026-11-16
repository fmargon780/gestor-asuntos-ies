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
- No se cambia nada de lo que se ve.
- No se cambia dónde viven las carpetas (siguen en Drive) ni cómo se pasaron.

## Notas técnicas de Claude
- Lo que se sabe (16-nov-2026, leído en `main`): `js/documentos-vigilancia.js` mira la carpeta de asuntos vivos (`App.E.abiertos`) cada `App.SEGUNDOS_ENTRE_MIRADAS` (20 s, `js/nucleo.js`) y al volver a la ventana. La misma pasada (`App.mirarLaCarpeta`) lee también lo que llega a «Por clasificar» (`Entrada.leer`), así que es probable que la causa sea la misma, pero no está comprobado. Solo se ha leído esa parte; no se ha visto qué hace la app con la carpeta de un asunto concreto cuando se abre su ficha, ni el vistazo de los sellos (`RegistroSellado`, 15 s).
- Lo que no se sabe: dónde se pierde el tiempo. Puede ser Drive (leer los nombres de una carpeta replicada puede tardar más que en Dropbox, también cuando hay muchos asuntos), o algo de la propia app. No darlo por hecho: mirar el código del camino «fichero nuevo en la carpeta del asunto → sale como documento del asunto» y decir cuál es la causa.
- Si leyendo el código no se ve la causa, añadir una medida de lo que tarda cada lectura de carpeta (`js/medidas.js`) para que llegue por el buzón de soporte, y dejar la fila con lo que se necesita ver. No se inventa un arreglo sin causa.
- Las pruebas no tocan datos reales (`docs/METODO-COMUN.md`, 6.4).

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- Dejar un documento en «Por clasificar» y mirar cuánto tarda en salir en la bandeja; debe parecerse a antes del traslado.
- Guardar un documento en la carpeta de un asunto vivo y mirar cuánto tarda en salir como documento del asunto; debe parecerse a antes del traslado.
- Comprobar que Claude (con la extensión de Chrome) puede ver el cambio de tiempo en la medida; si no puede, decir qué le falta a Francisco.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
