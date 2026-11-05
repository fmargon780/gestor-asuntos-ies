# 536 — Ficheros largos, segunda parte: los otros siete

## Lo que escribió Francisco
Idea 526: «Tropiezo (de la fila 522): `js/hitos-guion.js` ya pasaba de 400 líneas (444, ahora 469) y hubo que tocarlo; lo evitaría una fila que lo parta por temas (marcar, reunir, editar tareas).»

Tema 534: «Ficheros largos. Junta la idea 526: partir por temas todos los ficheros de código que pasan del límite de la app, empezando por `js/hitos-guion.js`, para que cada cambio cueste menos y vuelva a pasar la prueba que falla. No cambia nada de lo que se ve.»

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)
- No se parten todos los ficheros largos: solo 11, repartidos en dos tareas (535 y 536). Los otros 61 de más de 400 líneas se parten cuando haya que tocarlos, como ya manda `docs/METODO-COMUN.md`.
- Nada cambia para quien usa la app: mismas pantallas, mismos textos, mismos datos, mismo comportamiento.
- Esta segunda tarea parte `js/nucleo.js` (745 líneas), `js/tablon-compacto.js` (739), `js/etiquetas-pantalla.js` (716), `js/correo-cuadro.js` (693), `js/ayudas.js` (643), `js/nombres.js` (633) y `js/campos.js` (609).
- Se hace después de la 535.
- Si al empezar hay otro fichero de `js/` de más de 600 líneas, se parte también en esta tarea.

## Pantalla de prueba
- Sin pantalla: no cambia nada de lo que se ve.

## Qué NO se hace en esta tarea
- Los 61 ficheros de más de 400 líneas que no pasan de 600: se parten cuando se toquen.
- Unificar los dos límites (600 de la app y 400 del método).

## Notas técnicas de Claude
- Se sigue la forma de la fila 133 (`docs/PARTIR-FICHEROS-GRANDES.md` y `docs/CONTEXTO.md`, «Ningún fichero de `js/` pasa de 600 líneas»): se parte por temas moviendo funciones enteras, sin reescribirlas; el estado común va en `X._interno` o `window.XNucleo`; cada trozo se carga en `index.html` justo después de su origen.
- Cada fichero que resulte queda por debajo de 400 líneas.
- Las pruebas que cargan el origen suelto (con `vm`) cargan también sus trozos. Antes de empezar, localizarlas con `grep` por el nombre del fichero.
- `js/nombres.js` lo cargan suelto 25 pruebas, `js/nucleo.js` 17, `js/campos.js` 6 y `js/correo-cuadro.js` 1. Las líneas de cada fichero se miden de nuevo al empezar: las tareas anteriores pueden haberlas cambiado.
- Mover no es mejorar: ni renombrar, ni simplificar, ni arreglar nada de paso. Si aparece un fallo, se apunta como IDEA.
- Al terminar: `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/CONTEXTO.md` o el hijo que toque, `docs/HISTORIA.md`. Sin línea en `js/novedades.js`, porque no cambia nada visible.

## Cómo lo comprueba el segundo revisor
- Los siete ficheros y sus trozos están por debajo de 400 líneas (`wc -l`).
- Ningún fichero de `js/` pasa de 600 líneas.
- Pasan las pruebas de lo tocado, además de las que carguen esos ficheros.
- Con `?demo=1&auto=1`: tablón, etiquetas, cuadro de correo, ayudas y campos de un asunto se comportan igual que antes, y el nombre de una carpeta nueva sale igual, sin errores en la consola.
- Comparando con `main`: ninguna función cambia por dentro; solo cambia de fichero.

## Revisión y respuestas durante el trabajo
- Segundo revisor (5-nov-2026), punto 1 (tamaños): coincide. Los 7 originales miden 313, 204, 206, 180, 234, 176 y 245 líneas; los 19 trozos nuevos, entre 126 y 327. Ninguno llega a 400 y el mayor fichero de `js/` es `correo-enviar.js` con 598.
- Segundo revisor, punto 2 (nada cambia por dentro): coincide. Comparadas todas las líneas de los 7 originales de `origin/main` con la suma de sus trozos: no falta ninguna salvo, en correo-cuadro y tablon-compacto, las 7 y 12 declaraciones `var <estado> = …` convertidas en `I.S.<estado> = …`. Lo añadido es solo cabeceras de comentario, `var I = …`, envoltorios `function f(){ return I.f.apply(this, arguments); }`, copias `var X = I.X` y líneas `I.x = x`. Ninguna cadena de texto lleva `I.S.`; `var elegidos` local de `destinoDe` y las claves `elegidos:`/`cco:` quedan intactas; no queda ningún uso suelto de un nombre de estado. Las exportaciones del origen van antes del `return`. Orden de carga en `index.html` correcto (trozos antes del origen; nucleo-tipos y nucleo-registro justo después de nucleo.js). eslint `no-undef` sobre cada grupo: ningún nombre local sin definir (solo globales de otros ficheros, igual que en main).
- Segundo revisor, punto 3 (pruebas): coincide. Pasan etiquetas, etiquetas-346/350/374/recuerda, tablon, tablon-avisos, inicio-compacto, todas las correo-*, hitos*, arreglos-por-dentro, nombre-corto-de-tipo y las nombres-*, campos-calculo, campos-del-documento, campos-catalogo, campos-de-hito, ayuda-al-pasar-el-raton, scripts-cargados y tipos-unir (33 de 37 a la primera, más etiquetas-recuerda a parte). Fallan tablon-no-se-borra, tutores-legales (paso 5), campos (violación de modo estricto en `.tipo-asunto-seccion`) y contadores-de-inicio (5 fallos): comparadas con una copia de `origin/main` servida en otro puerto, fallan igual y con los mismos mensajes. No he usado `npm test`.
- Segundo revisor, punto 4 (navegador): no lo he podido ver del todo a mano. Con `?demo=1&auto=1` carga sin errores de consola ni excepciones y existen `Ayudas`, `Nombres`, `Campos`, `EtiquetasPantalla`, `CorreoCuadro` y `TablonVista`. Crear/marcar/plegar notas, Etiquetas, el cuadro de correo y el recuadro de ayuda los cubren las pruebas anteriores en Chromium real (todas en verde); no he hecho un recorrido manual aparte.
- Segundo revisor, punto 5 (cambios fuera de lo pedido): coincide. Solo cambian los 7 originales, los 19 trozos nuevos, `index.html` (25 líneas de `<script>` y comentarios) y 34 `pruebas/*.mjs` que cargan estos ficheros (solo la lista de ficheros). Ningún texto, dato ni comportamiento cambia. Pendiente (no es del código): al terminar, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/CONTEXTO.md` y `docs/HISTORIA.md` no estaban tocados en este commit.
