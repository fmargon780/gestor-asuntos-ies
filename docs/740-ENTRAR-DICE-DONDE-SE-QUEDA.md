# 740 — «Entrar» dice dónde se queda

**Título llano:** Que «Entrar» diga en qué se ha quedado
**Para qué:** que, cuando «Entrar» no avanza (sobre todo en la copia sin internet), se vea en la pantalla qué está esperando o qué ha fallado, para poder arreglar la causa.

## Lo que escribió Francisco

25-nov-2026, en el instituto, tras reiniciar el ordenador:

> «Lo que ocurre es que ayer con Microsoft Edge y hoy también con Google Chrome al intentar abrir la app desde la dirección file:///C:/Google%20Drive/Gestor%20de%20Asuntos%20-%20aplicaci%C3%B3n/index.html lo que sale es lo que ves en la imagen, le doy a Entrar y no hace nada. Vuelvo a señalar las carpetas, por si eso lo arreglara y tampoco.»

Acordó («1», 25-nov-2026) que se apunte en la cola «un arreglo pequeño para que Claude Code haga que "Entrar" diga siempre en qué se ha quedado, con un mensaje que no desaparezca».

## Lo que entendió Claude (acordado con Francisco el 25-nov-2026)

- Al pulsar «Entrar», debajo del botón sale una línea fija que dice, en palabras llanas, qué está haciendo la app en ese momento (por ejemplo: «Pidiendo permiso para la carpeta de asuntos abiertos…», «Mirando si hay versión nueva…», «Leyendo los datos del centro…»). La línea va cambiando al pasar de un paso al siguiente y desaparece al entrar.
- Si un mismo paso lleva más de 15 segundos sin terminar, la línea añade «Sigue esperando: <paso>. Si Chrome o Edge te pide permiso, pulsa «Permitir».».
- Si algo falla, el aviso sale en un cuadro rojo **fijo** junto al botón (no desaparece solo) con lo que haya fallado y lo que dice el navegador tal cual. Sirve también para el «Sin permiso sobre alguna de las dos carpetas…» de hoy, que sale como aviso pasajero.
- El botón «Entrar» sigue como hasta ahora (no cambia de texto ni se desactiva). Los textos, con las palabras de `docs/VOCABULARIO.md`.
- Funciona igual en la copia sin internet y en la web.

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- No se cambia el orden de los pasos de «Entrar» ni se arregla la causa de que se quede esperando: eso es otra fila, cuando se sepa cuál es (sale de lo que diga esta línea).
- No se tocan los permisos de las carpetas ni la actualización de la copia.

## Notas técnicas de Claude

- Lo visto el 25-nov-2026 en un ordenador del instituto, con la copia sin internet (`file:///C:/Google Drive/Gestor de Asuntos - aplicación/index.html`, versión 20-nov-2026 · 08:48), en Chrome y en Edge, tras reiniciar: «Entrar» no hace nada visible; consola vacía (sin errores) tras recargar; Google Drive para ordenadores en «Actualizado»; el botón no cambia de texto; sin cuadro de permiso del navegador; esperando 30 y 60 segundos sigue igual; volver a señalar las carpetas no lo arregla. Desde `https://asuntos.fmargon.com` (web) sí se entra.
- Dónde: `$('btn-entrar').onclick` en `js/nucleo.js`. Pasos que hoy pueden esperar sin decir nada: `Perfil.leerAntes`; `Carpetas.permiso(..., true)` de abiertos y ARCHIVO; `CarpetasEnDrive.alEntrar`; `PermisosCarpetas.pedirAlEntrar` (hasta 60 s por carpeta, `ESPERA_MAX_MS`); `ActualizarCopia.alEntrar` (hasta 2 s de comprobación y hasta 60 s de descarga, `TOPE_ACTUALIZAR_MS`); `PasarADrive.alEntrar`; `Carpetas.crear` de `_GESTOR` y `datos`; `Copias.comprobarTodos`; las cargas de tipos, campos y registro.
- Una sola función pequeña (por ejemplo `App.pasoDeEntrar(texto)`) que pinta la línea y apunta el paso en `console.info('Entrar:', texto)`; se llama justo antes de cada paso de arriba. Un temporizador de 15 s por paso. Fichero nuevo `js/entrar-pasos.js`, apuntado en su lista `js/cargar-piezas-N.js`; en `nucleo.js` solo las llamadas (una línea cada una).
- El cuadro rojo fijo reutiliza el aviso rojo de `U.fallo` si encaja, o un `<p>` con clase propia bajo `#btn-entrar`; el `catch` final («No he podido entrar: …») y el aviso de «Sin permiso sobre alguna de las dos carpetas» lo usan. Que no tape ni cambie nada de lo que ya sale (`CarpetasEnDrive` pone su franja encima del botón).
- Prueba nueva en `pruebas/` con las carpetas simuladas: un paso que no termina (permiso que no responde) deja la línea fija con su texto a los 15 s; un paso que falla deja el cuadro rojo; al entrar, la línea desaparece.
- Línea nueva al principio de `js/novedades.js` (se ve en pantalla).

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar

- En la copia de pruebas, con un paso simulado que no responde: debajo de «Entrar» sale la línea de lo que espera y, pasados 15 segundos, el «Sigue esperando».
- Con un fallo simulado: sale el cuadro rojo y no desaparece solo.
- Al entrar bien, la línea no se queda en pantalla.
- Francisco, en el instituto: si «Entrar» vuelve a quedarse esperando en la copia sin internet, apuntar qué línea sale y decírselo a Claude (`[solo en: instituto]`).

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- (25-nov-2026, Claude Code, tarea pequeña: comparado con la instrucción) Coincide: debajo de «Entrar» sale una línea fija con el paso (leer quién eres, permiso de las carpetas, Drive, versión nueva, datos del centro, comprobar ficheros, leer datos) que cambia y desaparece al entrar; a los 15 s del mismo paso añade «Sigue esperando: <paso>. Si Chrome o Edge te pide permiso, pulsa «Permitir».»; un fallo (también el «Sin permiso sobre alguna de las dos carpetas») deja un cuadro rojo fijo con lo que dijo el navegador, que solo se quita al volver a pulsar «Entrar»; el botón no cambia ni se apaga; cada paso se apunta además en la consola («Entrar: …»). Prueba nueva `pruebas/entrar-dice-donde-se-queda.mjs`.
- No visto: el caso real de la copia sin internet en el instituto (Francisco: si vuelve a quedarse esperando, apuntar qué línea sale). El aviso pasajero de siempre se mantiene además del cuadro rojo.
