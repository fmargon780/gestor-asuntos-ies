# Pruebas que arrancan siempre (tema 433, fila 466)

Junta las ideas 424 y 454. Diseñado con Francisco el 26-oct-2026, con ficha.
Es un cambio **interno**: la app no cambia en nada. Solo cambia el taller con el que Claude Code
comprueba su trabajo (`npm test` y las pruebas de `pruebas/`).

## Qué se pide

Que `npm test` arranque a la primera en cualquier sesión de Claude Code, sin instalar nada a mano,
y que dos tandas de pruebas a la vez no se estorben. Hoy pasan tres cosas:

1. **Navegador que no casa** (idea 424, fila 421). `package.json` pide `"playwright": "^1.47.2"`.
   `npm install` baja la versión más nueva que permite ese `^` (hoy el `package-lock.json` tiene la
   1.63.0), y esa versión busca un Chromium que el entorno de sesiones no trae. El entorno trae el
   suyo en `/opt/pw-browsers` (el 26-oct-2026: `chromium-1243` y `chromium_headless_shell-1243`).
   Resultado (23-oct-2026): ninguna prueba de navegador arrancaba hasta instalar a mano otra versión
   de Playwright. Hoy (26-oct-2026) la 1.63.0 del lock pide justo el Chromium 1243 que trae el
   entorno, así que casan; pero el `^` deja que `npm install` cambie de versión, y el entorno puede
   cambiar de Chromium cualquier día. Lo que de verdad protege es la red de seguridad del punto 2.
2. **Terminal que se cierra sola** (idea 424). `pgrep -f` / `pkill -f` buscan el texto en la línea
   de órdenes de **todos** los procesos, también en la de la propia terminal de la sesión, y la
   mataron.
3. **Puerto fijo** (idea 454, fila 451). `pruebas/ejecutar.mjs` levanta siempre el servidor local
   en el puerto 8123 (`const PUERTO = 8123`). Si ya hay otra tanda de pruebas corriendo (por ejemplo
   una en una copia de `main` y otra en la rama), las dos usan el mismo servidor y salen fallos que
   no son reales.

## Ficha del cambio

### Qué verá y hará la usuaria cuando esté terminado
- Nada. La app se ve y funciona exactamente igual.

### Qué NO cambia
- Ningún fichero de la app (`index.html`, `js/`, `css/`, datos de demostración).
- Lo que comprueba cada prueba de `pruebas/`: no se toca el contenido de ninguna prueba.
- La lista `EN_SOLITARIO`, el segundo intento de la fila 333 y el número de pruebas a la vez.

### Qué NO se hace en esta tarea
- No se cambia la forma de publicar ni el revisor (`docs/REVISOR-ANTES-DE-PUBLICAR.md`).
- No se cambian las ~258 pruebas que llevan escrito `http://localhost:8123` como dirección de
  reserva: todas leen antes `process.env.DIRECCION`, que el ejecutor ya les pasa (comprobado el
  26-oct-2026). Basta con que el ejecutor pase la dirección con el puerto bueno.
- No se actualiza Playwright «a lo último»: se fija la versión que casa con el entorno.

### Qué más se ve afectado (y qué pasa con cada cosa)
- **GitHub Actions** (`.github/workflows/pruebas.yml`): instala Chromium con
  `npx playwright install --with-deps chromium`. Con la versión fijada instalará el Chromium de esa
  versión: sigue funcionando igual. No hace falta tocarlo.
- **`pruebas/_revisor1.mjs` y `pruebas/_revisor2.mjs`**: restos sueltos que no usa el revisor actual
  (`docs/REVISOR-ANTES-DE-PUBLICAR.md` no los nombra), apuntan a `localhost:8124` y no leen
  `DIRECCION` ni `CHROMIUM_PATH`; como el ejecutor lanza todos los `.mjs`, fallan en cada pasada
  completa (lo apunta la fila 463). Se borran en esta fila.
- **Las pruebas que se lanzan a mano** con `node pruebas/<prueba>.mjs` sin el ejecutor: siguen
  usando el puerto 8123 de reserva, como hoy. No cambia.
- **Documentación**: `CLAUDE.md`, `docs/CONTEXTO.md` (apartado «Pruebas automáticas en cada
  subida») y `docs/CONTEXTO-CORTO.md` (la línea de las pruebas) se ponen al día.

### Lo que Claude había supuesto (cada punto, aceptado o corregido por Francisco)
- Que la idea 454 (puerto fijo) entra en este tema → aceptada (26-oct-2026).
- Que, al no cambiar nada en pantalla, las comprobaciones son lo que Francisco ve en la cola → aceptada (26-oct-2026).
- Lo técnico (qué versión fijar, cómo elegir el puerto) lo decide Claude: no cambia nada para la usuaria.

### Ejemplo real que ha dado Francisco
- Fila 421 (23-oct-2026): ninguna prueba arrancaba hasta instalar a mano `playwright@1.56.1`, y
  `pkill -f` cerró la terminal de la sesión.
- Fila 451: dos tandas de `npm test` a la vez (una en una copia de `main` y otra en la rama) se
  pisaron en el puerto 8123 y dieron fallos falsos.

### Cómo se comprueba
Lo que verá Francisco (en `docs/COLA.md` / Centro de mando):
1. Esta fila termina HECHA sin apuntar ningún «tropiezo» nuevo.
2. Las dos filas siguientes que haga Claude Code tampoco apuntan tropiezos de «las pruebas no
   arrancan» ni de «fallos falsos por dos pruebas a la vez».
3. La app se ve y funciona igual que antes: Inicio y un asunto cualquiera, como siempre.

Lo que comprueba Claude Code en esta fila, antes de darla por hecha:
- En un clon limpio (sin `node_modules`): `npm ci` y después `npm test` arrancan y pasan **sin
  instalar nada más a mano**.
- Con una tanda de `npm test` en marcha, una segunda tanda lanzada a la vez desde otra carpeta
  (por ejemplo una copia de `main` en `/tmp`) usa otro puerto, lo dice en su primera línea, y las
  dos acaban sin fallos falsos.
- Si el puerto 8123 está ocupado por otro programa cualquiera, `npm test` sigue funcionando en otro
  puerto.

### Respuestas de Francisco durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)

## Para Claude Code

**Ficheros que se tocan** (y ninguno más):
- `package.json` y `package-lock.json`
- `pruebas/ejecutar.mjs`
- `pruebas/_revisor1.mjs` y `pruebas/_revisor2.mjs` (se borran)
- `CLAUDE.md`
- `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md` (sustituir la línea vieja, no añadir otra debajo)
- `docs/COLA.md`, `docs/HISTORIA.md`, `docs/ESTIMACIONES.md` (cierre de la fila, como siempre)

**Qué hacer:**

1. **Fijar Playwright.** Mira qué Chromium trae el entorno (`ls /opt/pw-browsers`) y busca la
   versión de Playwright cuyo Chromium es ese mismo número (por ejemplo, en el `browsers.json` del
   paquete `playwright-core` de cada versión). Escríbela **exacta, sin `^` ni `~`**, en
   `package.json`, y regenera `package-lock.json` con esa versión. El 26-oct-2026 es la `1.63.0`
   (pide el Chromium 1243, el del entorno). Si no casa ninguna versión publicada, fija la que ya
   tenga el `package-lock.json` y confía en la red de seguridad del punto 2; apúntalo en la nota.
2. **Red de seguridad para el navegador.** Las pruebas de navegador ya leen
   `process.env.CHROMIUM_PATH` (`docs/CONTEXTO.md`). En `pruebas/ejecutar.mjs`, si `CHROMIUM_PATH`
   no está puesto y el Chromium que espera Playwright no está instalado (se sabe con
   `chromium.executablePath()` y comprobando que ese fichero existe), pero sí hay uno en
   `/opt/pw-browsers`, el ejecutor pone `CHROMIUM_PATH` a ese y lo dice en una línea al empezar.
   Cuál: el ejecutable al que lleva el enlace `/opt/pw-browsers/chromium` si existe; si no, el
   `chrome` de la carpeta `chromium-<número>` con el número más alto (no la `headless_shell`).
   Así, si algún día el entorno cambia de Chromium, las pruebas siguen arrancando. Si no hay ningún
   Chromium, el ejecutor para con **un solo mensaje claro** que diga qué falta y la orden exacta
   para instalarlo, en lugar de dejar que fallen todas las pruebas una a una. Antes de dar esto por
   bueno, comprueba que todas las pruebas que abren navegador leen de verdad `CHROMIUM_PATH`; la que
   no lo lea se apunta en la nota de la fila, no se arregla aquí (salvo que sea una línea). El
   26-oct-2026 lo leían todas salvo las dos `_revisor*.mjs`, que se borran.
3. **Puerto libre.** En `pruebas/ejecutar.mjs`, en lugar de `const PUERTO = 8123`: arrancar
   `python3 -m http.server <puerto> --bind 127.0.0.1` empezando por el 8123. Si el proceso sale con
   error en más o menos un segundo (puerto ocupado), probar el siguiente, hasta unos 20 intentos; si
   sigue vivo y contesta, ese es el nuestro. Si no queda ninguno, parar con un mensaje claro.
   `DIRECCION` se arma con `127.0.0.1` (no `localhost`, para no acabar en otro servidor por IPv6) y
   ese puerto, y se pasa a cada prueba como ya se hace. La primera línea que escribe el ejecutor
   (después de las de npm) dice qué puerto usa; la del Chromium de reserva, si hace falta, va
   después.
   **Toda salida con error para antes el servidor.** Hoy el `process.exit(1)` de «El servidor local
   no ha arrancado» está dentro del `try` y se salta el `finally` con `servidor.kill()`, así que el
   servidor de Python se queda vivo ocupando el puerto. Arreglarlo, y que lo mismo valga para los
   mensajes nuevos de «no hay puerto» y «no hay Chromium».
4. **`CLAUDE.md`**: es una regla sobre cómo trabaja Claude Code en su terminal; ningún código del
   repositorio usa `pkill` ni `pgrep`, así que no hay código que cambiar. Una regla corta en el apartado de pruebas: no usar `pkill -f` ni `pgrep -f`
   (encuentran también la terminal de la sesión y la cierran); para parar un proceso, guardar su
   número (PID) al lanzarlo y usar `kill <PID>`. Y una línea: `npm test` elige solo un puerto libre,
   así que pueden correr dos tandas a la vez.
5. Poner al día `docs/CONTEXTO.md` y `docs/CONTEXTO-CORTO.md` con lo anterior, en pocas líneas.
   En `docs/CONTEXTO.md` también la línea que manda probar a mano con `python3 -m http.server 8123`
   (hacia la línea 602): que diga que cualquier puerto libre vale. El comentario con 8123 de
   `js/demo/arrancar.js` se deja (es un fichero de la app).

**Cómo trabajar:**
- Cambios quirúrgicos; no reescribir ficheros enteros.
- No leer el repositorio entero: basta con los ficheros de arriba y `pruebas/apoyo/` si hace falta.
- Una sola pasada completa de pruebas al final (más las comprobaciones de «Cómo se comprueba»).
- Subir directamente a `main`, **sin abrir ninguna pull request**.
- Como no toca la app, no hay que publicar en Vercel. Ojo: como toca `package.json`, sí correrán
  las pruebas de GitHub Actions al subir; tienen que salir en verde.
- Si aparece algo que la ficha no cubre, o el cambio sale más del doble de lo estimado (45 min),
  parar y preguntar, como dice `docs/METODO-FICHA.md`.
