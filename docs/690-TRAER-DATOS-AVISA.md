# 690 — «Traer datos» avisa si la ventana no se abre

## Lo que escribió Francisco
No lo escribió él: lo vio Claude en el código al hacer la fila 647 (17-nov-2026), sin probar en un navegador real. Francisco dijo que sí a hacerla como tarea pequeña el 17-nov-2026 («Sí»).

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- Hoy, en «Traer datos», si el navegador rechaza la carpeta donde iba a abrirse la ventana de elegir ficheros, no pasa nada y no sale ningún aviso.
- Pasa a hacer lo mismo que «Añadir documento» desde la fila 678: si no puede abrirse en su carpeta, la ventana se abre en otro sitio y sale el aviso «No he podido abrir la carpeta; elige el archivo.» Si no puede abrirse de ninguna forma, sale un aviso rojo con el motivo. Nunca se queda en silencio.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Nada más de «Traer datos».

## Notas técnicas de Claude
- `js/traer-datos.js`, `elegirFicheros` (hacia la línea 77). El modelo es `elegirFichero` de `js/carpetas-ficheros.js` (filas 678 y 647): la ventana se pide en la misma pulsación y, si falla con `startIn`, se repite sin ella.
- Prueba: ampliar `pruebas/ventana-en-su-carpeta.mjs` o `abrir-ventana-de-subir` con un `showOpenFilePicker` falso que rechaza la carpeta. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar
- En Edge, en el instituto: «Traer datos» abre la ventana de Windows.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
