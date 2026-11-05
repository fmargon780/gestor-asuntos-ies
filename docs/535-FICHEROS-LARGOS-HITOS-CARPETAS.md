# 535 — Ficheros largos, primera parte: hitos y carpetas

## Lo que escribió Francisco
Idea 526: «Tropiezo (de la fila 522): `js/hitos-guion.js` ya pasaba de 400 líneas (444, ahora 469) y hubo que tocarlo; lo evitaría una fila que lo parta por temas (marcar, reunir, editar tareas).»

Tema 534: «Ficheros largos. Junta la idea 526: partir por temas todos los ficheros de código que pasan del límite de la app, empezando por `js/hitos-guion.js`, para que cada cambio cueste menos y vuelva a pasar la prueba que falla. No cambia nada de lo que se ve.»

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)
- No se parten todos los ficheros largos: solo 11, repartidos en dos tareas (535 y 536). Los otros 61 de más de 400 líneas se parten cuando haya que tocarlos, como ya manda `docs/METODO-COMUN.md`.
- Nada cambia para quien usa la app: mismas pantallas, mismos textos, mismos datos, mismo comportamiento.
- Esta primera tarea parte `js/hitos-guion.js` (469 líneas), `js/hitos.js` (661), `js/hitos-desde-el-asunto.js` (697) y `js/carpetas.js` (624).
- Va antes que las tareas 530 y 531, que tocan los hitos, y arregla la prueba que falla.

## Pantalla de prueba
- Sin pantalla: no cambia nada de lo que se ve.

## Qué NO se hace en esta tarea
- Los otros 7 ficheros de más de 600 líneas: tarea 536.
- Los otros 61 ficheros de más de 400 líneas: se parten cuando se toquen.
- Unificar los dos límites (600 de la app y 400 del método).

## Notas técnicas de Claude
- Se sigue la forma de la fila 133 (`docs/PARTIR-FICHEROS-GRANDES.md` y `docs/CONTEXTO.md`, «Ningún fichero de `js/` pasa de 600 líneas»): se parte por temas moviendo funciones enteras, sin reescribirlas; el estado común va en `X._interno` o `window.XNucleo`; cada trozo se carga en `index.html` justo después de su origen.
- Cada fichero que resulte queda por debajo de 400 líneas.
- Las pruebas que cargan el origen suelto (con `vm`) cargan también sus trozos. Antes de empezar, localizarlas con `grep` por el nombre del fichero.
- `js/carpetas.js` lo cargan suelto 34 pruebas, `js/hitos.js` 17, `js/hitos-desde-el-asunto.js` y `js/hitos-guion.js` 1 cada uno. El paso 14 de `pruebas/archivar-no-cabe.mjs` es la prueba que falla hoy, por `js/carpetas.js`.
- Mover no es mejorar: ni renombrar, ni simplificar, ni arreglar nada de paso. Si aparece un fallo, se apunta como IDEA.
- Al terminar: `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/CONTEXTO.md` o el hijo que toque, `docs/HISTORIA.md`. Sin línea en `js/novedades.js`, porque no cambia nada visible.

## Cómo lo comprueba el segundo revisor
- Los cuatro ficheros y sus trozos están por debajo de 400 líneas (`wc -l`).
- El paso 14 de `pruebas/archivar-no-cabe.mjs` pasa.
- Pasan las pruebas de lo tocado: `npm test -- hitos carpetas`, además de las que carguen esos ficheros.
- Con `?demo=1&auto=1`: abrir un asunto, marcar una tarea del hito, reunir un dato, editar una tarea propia y archivar un asunto se comportan igual que antes, sin errores en la consola.
- Comparando con `main`: ninguna función cambia por dentro; solo cambia de fichero.

## Revisión y respuestas durante el trabajo
- Segundo revisor, punto 1 (wc -l): coincide. Los 4 ficheros y sus 11 trozos pasan de 400 líneas ninguno (el mayor, hitos-normalizar.js, 224).
- Segundo revisor, punto 2 (nada cambia por dentro): coincide. Comparadas con `git show origin/main:js/<fichero>` todas las líneas de código de los 4 originales aparecen en los trozos (0 perdidas); lo añadido son solo cabeceras de comentario, IIFE, `var I = ...`, envoltorios `function f(){ return I.f.apply(this, arguments); }`, `var x = I.x` e `I.x = x`. Estado mutable (vistosConDatos, ultimos, ultimoCambio, alCambiar, alLeer) vive solo en hitos-fichero.js; `leerTexto = window.Medidas ? ...` sigue en carpetas.js y `U.envolver(App,'App.anotar',...)` en hitos.js; envolturas-esperadas.js sin tocar y coherente. Orden en index.html correcto (trozos de carpetas, hitos y hitos-desde-el-asunto antes del origen; los de hitos-guion después). Ojo, matiz: la comparación fue por líneas (multiconjunto, sin orden); no he revisado una por una las posiciones dentro de cada función.
- Segundo revisor, punto 3 (pruebas): coincide con una salvedad. Pasan archivar-no-cabe, hitos, hitos-no-huerfanos-al-archivar, preguntas-en-el-guion, scripts-cargados, guias, el-hito-mesa-de-trabajo, archivar-fusion, copias, la-guia-manda-en-los-hitos y tareas-del-hito-sencillas. `opciones` falla con TimeoutError (click en elemento no visible, tras «eligiendo "en mano"»), pero falla igual con el código de origin/main servido aparte en otro puerto, así que no es de esta tarea (ya fallaba antes; conviene apuntarlo como IDEA).
- Segundo revisor, punto 4 (navegador): coincide solo en parte. Con `?demo=1&auto=1` la app carga sin errores ni avisos de consola, ni en esta rama ni en main, y las claves públicas de Hitos, Carpetas y HitosDesdeElAsunto son idénticas (solo se añade `Hitos._guionInterno`). No he podido ver a mano abrir asunto, marcar tarea, editar tarea propia ni archivar: mi script suelto no consiguió abrir un asunto (elemento que se desprende del DOM). Eso lo cubren las pruebas con Playwright del punto 3 (mesa de trabajo, tareas del hito, archivar), que pasan, pero no es una comprobación mía en la interfaz.
- Segundo revisor, punto 5 (cambios fuera de lo previsto): coincide. Además de los js/ nuevos solo cambian js/hitos*.js y js/carpetas.js (los 4 de origen), index.html (solo `<script>` y comentarios), pruebas/*.mjs que cargan estos ficheros (solo líneas que cargan los trozos) y docs/contexto/FICHEROS-DEL-REPOSITORIO.md. No veo cambios de texto, dato ni comportamiento.
- Segundo revisor, veredicto: APRUEBA, con la salvedad del punto 4 (interacción manual en el navegador no vista por mí) y `opciones`, que ya falla en main.
