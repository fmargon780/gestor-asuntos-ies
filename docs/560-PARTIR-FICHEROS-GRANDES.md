# 560 — Partir los ficheros grandes más tocados

## Lo que escribió Francisco
7-nov-2026, en el proyecto «Método de desarrollo de apps», ante la propuesta de Claude: «1»
(cambiar la regla de las 400 líneas: nunca se parte un fichero en mitad de una tarea; en cada app,
una tarea aparte parte de una vez los ficheros grandes que más se tocan; la usuaria no nota nada).
Después: «Sí».

9-nov-2026: «Partir en piezas index.html y los cuatro ficheros de código grandes más tocados, sin
cambiar nada de lo que se ve». Tras el análisis: «Pues vamos a ponerla en marcha para que podamos
programarlo después de lo que hay ahora en la cola».

## Lo que entendió Claude (acordado con Francisco el 9-nov-2026)
- Se parten en piezas de menos de 400 líneas estos cinco ficheros, los más tocados del último mes:
  `index.html` (1.923 líneas), `js/demo/datos.js` (756), `js/plantillas-ajustes.js` (597),
  `js/ficha-documentos.js` (496) y `js/hito-mesa-guion.js` (401).
- `index.html` se parte entero, sus dos partes: la lista de piezas de código que carga la app y las
  ventanas de la app.
- Quien use la app no ve ni hace nada distinto: mismas pantallas, mismos botones, mismos textos, en
  la versión de internet y en la copia sin internet.
- Va después de lo que hay hoy en la cola: la 563 (arreglar las pruebas automáticas) y la 562.

## Pantalla de prueba
- Sin pantalla: no cambia nada de lo que se ve.

## Qué NO se hace en esta tarea
- Ningún otro fichero grande.
- Ningún arreglo ni mejora de lo que hacen estos ficheros: lo que se vea mejorable se apunta en la
  nota de la fila.

## Notas técnicas de Claude
- Mover código, no reescribirlo: mismas funciones, mismos nombres, mismos textos. Un fichero cada
  vez: partir, pasar las pruebas y seguir con el siguiente.
- En los cuatro de `js/`: piezas agrupadas por lo que hacen, con el estado común en `X._interno`
  (regla de `docs/CONTEXTO-CORTO.md` 6). Si conviene, el fichero original queda como punto de
  entrada con su nombre. En `js/hito-mesa-guion.js` (401) basta con lo mínimo que lo deje por
  debajo de 400.
- `index.html`, lista de piezas de código: sale a varios ficheros de `js/` (por zonas, cada uno
  por debajo de 400) que escriben las mismas etiquetas `<script src>` con `document.write`, en el
  mismo orden y en el mismo sitio de la página. Así cargan igual de seguidas, también abiertas desde
  el disco (`file://`, copia sin internet). La política de seguridad (`script-src 'self'`) lo
  permite.
- `index.html`, ventanas: cada bloque sale a un fichero de `js/` que lo escribe con `document.write`
  en el mismo sitio donde estaba, durante la carga, antes de las piezas de código. Nada de `fetch`
  de fragmentos (no funciona desde el disco). Lo que quede en `index.html` (cabecera, huecos fijos
  como el de la franja de la copia) se queda.
- Si algo de `index.html` no se deja sacar sin cambiar lo que se ve o cómo arranca, se deja ahí y
  se dice en la nota de la fila.
- Poner al día lo que hoy lee `index.html` buscando las etiquetas `<script>` (por ejemplo
  `pruebas/scripts-cargados.mjs`, `pruebas/arreglos-por-dentro.mjs`, `pruebas/palabras-prohibidas.mjs`,
  `pruebas/copia-sin-internet.mjs`, `pruebas/tutores-legales.mjs`) para que lean también los
  ficheros nuevos. `scripts/copia-local.mjs` copia `js/` entero: comprobar que la copia sin internet
  sale completa.
- Desde ahora, un fichero de código nuevo se apunta en su lista de `js/`, no en `index.html`:
  dejarlo escrito en `docs/CONTEXTO-CORTO.md` 6 y en `docs/CONTEXTO.md`.
- `docs/CONTEXTO-CORTO.md` 6 dice «Ningún fichero de `js/` pasa de 600 líneas»: cambiar a la regla
  de `docs/METODO-COMUN.md` (tope 400; los que lo pasan solo se parten en una tarea aparte).
- No añade línea a `js/novedades.js`: no cambia nada que se vea.
- Necesita la 563 HECHA (pruebas automáticas que arrancan).

## Cómo lo comprueba el segundo revisor
- Ninguna pieza nueva ni ninguno de los cinco ficheros pasa de 400 líneas, salvo lo que diga la nota.
- `npm test` en verde, igual que antes de empezar.
- Las pantallas que salen de estos ficheros se ven igual antes y después, con fotos del navegador
  sin cabeza en ordenador y móvil, con la demo (`?demo=1&auto=1`): portada, un asunto, su ficha y
  su pestaña de documentos, la mesa de un hito y Ajustes → Plantillas.
- Ningún texto que se ve ha cambiado (comparar el texto de esas pantallas antes y después).
- La copia sin internet generada (`npm run copia-local`) abre desde el disco y llega a la portada
  de la demo.

## Qué mirar al terminar
- Abre la app y comprueba que la portada sale como siempre.
- Abre un asunto y su pestaña de documentos: igual que antes.
- Abre un hito de ese asunto: su mesa, igual que antes.
- Abre Ajustes → Plantillas: igual que antes.
- Si usas la copia sin internet en el instituto, ábrela: tiene que arrancar igual.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
- Segundo revisor (10-nov-2026), APROBADA:
  - Tamaños: coincide. Ninguna pieza ni los cinco ficheros pasan de 400 líneas (el mayor, `hito-mesa-guion.js`, 399; `index.html` 163).
  - Pantallas: coincide. 60 pares de fotos antes/después (ordenador 1400x900 y móvil 390x844, demo): portada, cada pantalla, asunto y sus pestañas, mesa del hito, Herramientas → Plantillas, Ajustes y tipo de asunto, sin diferencia de un píxel.
  - Textos: coincide, idénticos (el HTML estático también, salvo comentarios y espacios).
  - Copia sin internet (`npm run copia-local`, por `file://`): coincide; llega a la portada de la demo, abre un asunto, sin errores de consola.
  - Lo que la app hace sin pedirlo: nada. Mismas peticiones de red salvo los 13 ficheros nuevos; sin errores de consola ni antes ni después.
  - Aviso suelto «Documento registrado…» a veces en móvil: sale al azar también antes (tiempos de la demo).
