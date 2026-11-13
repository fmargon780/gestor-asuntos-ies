# 633 — `npm test` instala lo que le falta antes de probar

## Lo que escribió Francisco
No lo escribió Francisco: es un tropiezo apuntado por Claude Code al terminar la fila 627 (idea 628,
tema 632). Tal cual:

> Tropiezo (de la fila 627): en esta sesión faltaba el paquete `jsdom` (no hay `node_modules` en el
> entorno) y la pasada completa dio 28 fallos falsos tras 30 minutos. Habría evitado el tiempo
> perdido que el arranque de la sesión hiciera `npm install` antes de cualquier prueba.

## Lo que entendió Claude (acordado con Francisco el 13-nov-2026)
- Antes de lanzar ninguna prueba, `npm test` comprueba que están instalados los paquetes que
  necesitan las pruebas. Si falta alguno, los instala él solo y lo dice en una línea.
- Si no puede instalarlos (por ejemplo, sin red), para con un solo mensaje claro y no lanza
  ninguna prueba: nunca más fallos falsos por un paquete que falta.
- Va en `npm test` y no en el arranque de la sesión: así vale también cuando una sesión se reanuda
  o cambia de entorno, y en cualquier sitio donde se pasen las pruebas.
- En la app no cambia nada: ni se ve ni hay nada que publicar.

## Pantalla de prueba
- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Llevarlo a las demás apps con pruebas: sería una regla común de Claude Code y se decide en el
  proyecto del método. Apuntado en `PENDIENTE.md` de `fmargon780/metodo-apps`.
- No se toca el contenido de ninguna prueba, ni la lista `EN_SOLITARIO`, ni el segundo intento, ni
  cuántas van a la vez.
- No se cambia ninguna versión de `package.json` ni de `package-lock.json`.
- No se descarga ningún navegador: de eso ya se ocupa el Chromium de reserva (fila 466).
- No se añade nada al arranque de la sesión (`.claude/settings.json`).

## Notas técnicas de Claude
- Fichero nuevo `pruebas/apoyo/paquetes.mjs`, solo con módulos propios de Node (no puede importar
  nada de `node_modules`: es justo lo que comprueba). Exporta una función que recibe la carpeta raíz
  y devuelve qué paquetes faltan, para poder probarla, y al ejecutarse directamente hace el trabajo.
- Qué mira: cada paquete de `devDependencies` de `package.json` tiene su carpeta en `node_modules`
  con un `package.json` cuya versión es la de `package-lock.json`. Paquete que falta o versión que
  no casa: falta.
- Si falta alguno: una línea («Faltan paquetes para las pruebas: jsdom. Los instalo con npm ci…»),
  `npm ci` desde la raíz con `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, y se vuelve a mirar. Si `npm ci`
  falla o sigue faltando alguno, un solo mensaje con qué falta y la orden para instalarlo a mano, y
  salida con error.
- Si no falta nada, no escribe nada y no tarda (solo lee ficheros).
- `package.json`: `"test": "node pruebas/apoyo/paquetes.mjs && node pruebas/ejecutar.mjs"`. Las
  palabras de `npm test -- <palabra>` siguen llegando a `ejecutar.mjs`, que va el último.
  `ejecutar.mjs` no se toca: importa `playwright` arriba del todo y por eso la comprobación no
  puede ir dentro de él.
- Prueba nueva `pruebas/paquetes-antes-de-probar.mjs`: con carpetas temporales (sin `npm ci` de
  verdad ni red) comprueba que la función dice «nada falta» con todo en su sitio, y que nombra el
  paquete cuando falta su carpeta y cuando la versión no casa.
- `CLAUDE.md`, apartado «Pruebas»: una línea. Las pruebas se pasan siempre con `npm test` (también
  una sola: `npm test -- <palabra>`), nunca con `node pruebas/<prueba>.mjs` a pelo, porque `npm
  test` instala antes lo que falte.
- `docs/CONTEXTO.md` (apartado de las pruebas automáticas): la misma idea en una línea,
  sustituyendo si hay una vieja. `docs/CONTEXTO-CORTO.md` no cambia: no es de la app.
- GitHub Actions (`.github/workflows/pruebas.yml`) no se toca: allí los paquetes ya están y la
  comprobación pasa sin hacer nada.
- No toca la app: no hay que publicar en Vercel ni añadir nada a `js/novedades.js`. HECHA con el
  commit en `main` y la nota «sin cambio en la app, nada que publicar».

## Cómo lo comprueba el segundo revisor
- Tarea pequeña: sin segundo revisor. La sesión lo comprueba ella misma y lo apunta abajo:
  - En un clon limpio (sin `node_modules`), `npm test -- paquetes` instala solo, lo dice en una
    línea y la prueba pasa.
  - Con `node_modules` ya puesto, borrando solo `node_modules/jsdom`, lo mismo.
  - Con todo instalado, `npm test -- paquetes` no escribe ninguna línea de instalación.
  - Con la instalación imposible (por ejemplo `npm_config_registry` apuntando a una dirección que
    no existe y `node_modules/jsdom` borrado), sale un solo mensaje, no se lanza ninguna prueba y el
    código de salida es de error.

## Qué mirar al terminar
- Nada en la app.
- En la cola: que las filas siguientes no apunten más tropiezos de «faltaba un paquete» ni de
  fallos falsos por eso.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
