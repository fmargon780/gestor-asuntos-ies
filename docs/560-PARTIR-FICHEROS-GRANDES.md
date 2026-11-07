# 560 — Partir los ficheros grandes más tocados

## Lo que escribió Francisco
Elegida el 7-nov-2026 en el proyecto «Método de desarrollo de apps», ante la propuesta de Claude:
«1» (cambiar la regla de las 400 líneas: nunca se parte un fichero en mitad de una tarea; en cada
app, una tarea aparte parte de una vez los ficheros grandes que más se tocan; la usuaria no nota
nada). Después: «Sí».

## Lo que entendió Claude (acordado con Francisco el 7-nov-2026)
- Se parten estos ficheros, los que más se han tocado en el último mes:
  `index.html` (1.923 líneas, 42 veces), `js/demo/datos.js` (756), `js/plantillas-ajustes.js` (597),
  `js/ficha-documentos.js` (496) y `js/hito-mesa-guion.js` (401).
- Quien use la app no ve ni hace nada distinto: mismas pantallas, mismos botones, mismos textos.
- Motivo: cada tarea que lee uno de estos ficheros entero gasta mucho más uso de Claude.

## Pantalla de prueba
- Sin pantalla: no cambia nada de lo que se ve.

## Qué NO se hace en esta tarea
- Ningún otro fichero grande.
- Ningún arreglo ni mejora de lo que hacen estos ficheros: lo que se vea mejorable se apunta en la
  nota de la fila.

## Notas técnicas de Claude
- Cada fichero queda en piezas de menos de 400 líneas, agrupadas por lo que hacen. El fichero
  original queda como punto de entrada con el mismo nombre, para que nada de fuera cambie.
- Mover código, no reescribirlo: mismas funciones, mismos nombres y mismos textos.
- Un fichero cada vez: partir y comprobar; después el siguiente.
- Si un fichero no se deja partir sin cambiar lo que hace (en `index.html`, si la página no puede cargar piezas sin cambiar cómo se publica), se deja entero y se dice en la nota.
- Pasa por el revisor de siempre de esta app (`docs/REVISOR-ANTES-DE-PUBLICAR.md`).

## Cómo sabemos que está bien
- La demo (`?demo=1&auto=1`) abre igual que antes: portada, un asunto, su ficha y sus documentos,
  la mesa de un hito y los ajustes de plantillas.
- `npm test` en verde.

## Cómo lo comprueba el segundo revisor
- Ninguna pieza pasa de 400 líneas, salvo lo que diga la nota.
- Las comprobaciones de siempre de esta app salen en verde.
- Las pantallas que salen de estos ficheros se ven igual antes y después (fotos con el navegador
  sin cabeza, en ordenador y móvil).
- Ningún texto que se ve ha cambiado.

## Qué mirar al terminar
- Abre un asunto y su pestaña de documentos: igual que antes.
- Abre Ajustes → Plantillas: igual que antes.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
