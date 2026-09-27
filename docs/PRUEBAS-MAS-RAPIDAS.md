# Pruebas más rápidas (fila 208)

27-sep-2026. Cerrado con Francisco en Cowork.

## Antes de empezar

Esta fila ya está en la tabla de `docs/COLA.md`, la primera PENDIENTE (apuntada el 27-sep-2026).
Se trabaja como cualquier otra fila, siguiendo las reglas de la cola.

## El problema

La cola avanza muy despacio. Una fila de solo textos (la 189) tardó unos 40 minutos.

- Hay 166 ficheros de prueba en `pruebas/` (107 abren Chromium).
- `pruebas/ejecutar.mjs` los lanza **de uno en uno**, y cada uno arranca su propio navegador.
- Una pasada completa de `npm test` tarda 15-20 minutos.
- Cada fila la repite varias veces: tras cada cambio, y otra vez antes de subir.

## Qué hay que hacer

### 1. `npm test` lanza varias pruebas a la vez

- `pruebas/ejecutar.mjs` ejecuta los ficheros en paralelo, con un tope de procesos a la vez.
  Tope por defecto: número de núcleos del ordenador (`os.availableParallelism()`), como mínimo 2
  y como máximo 6. Se puede cambiar con la variable `PRUEBAS_A_LA_VEZ`.
- Un solo servidor local para todas (el de hoy, puerto 8123), como ahora.
- La salida de cada prueba se guarda y se imprime entera al terminar esa prueba, sin mezclarse
  con la de las otras. Al final, un resumen: cuántas pasan, cuáles fallan y cuánto ha tardado.
- **Antes de dar por bueno el paralelo, comprobar que ninguna prueba pisa a otra**: las que
  escriben ficheros en disco (`copia-sin-internet`, `copiar-ruta`, `membrete`,
  `plantillas-documento`, y cualquier otra que se encuentre) no pueden escribir en la misma ruta.
  Si alguna lo hace, se le da una carpeta temporal propia (`fs.mkdtempSync`). Si alguna no puede
  ir en paralelo de ninguna forma, se apunta en una lista `EN_SOLITARIO` y se ejecuta sola al final.
- Pasar `npm test` completo **tres veces seguidas** en paralelo, en verde las tres, para descartar
  fallos que salen solo a veces. Anotar en `docs/HISTORIA.md` el tiempo de antes y el de después.

### 2. Mientras se trabaja, solo las pruebas de lo tocado

- `node pruebas/ejecutar.mjs <palabra> [<palabra>…]` ejecuta solo los ficheros de `pruebas/`
  cuyo nombre contiene alguna de esas palabras (por ejemplo `hito mesa`). Sin palabras, todas.
- Nueva regla en `docs/COLA.md` (y en `CLAUDE.md` si allí se habla de las pruebas): **mientras se
  trabaja una fila, se pasan solo las pruebas relacionadas con lo que se toca. `npm test` completo
  se pasa una sola vez, al final, justo antes de subir.** Si esa pasada final falla, se arregla y
  se vuelve a pasar solo lo que falló; la completa, otra vez solo si el arreglo toca algo común
  (`js/nucleo.js`, `js/utilidades*.js`, `index.html`, `pruebas/navegador.mjs`).

### 3. GitHub hace lo mismo

- `.github/workflows/pruebas.yml` sigue llamando a `npm test`; como ya va en paralelo, no hace
  falta tocar nada más. Comprobar que en GitHub también pasa en verde y apuntar cuánto tarda.

## Qué no cambia

- Ninguna prueba se borra ni se debilita para ganar tiempo.
- La aplicación no cambia: Francisco no verá nada distinto en pantalla.

## Al terminar

- Actualizar `docs/CONTEXTO-CORTO.md` (sección 5, la línea «Pruebas automáticas en cada subida de
  código»: añadir «en paralelo; mientras se trabaja, solo las de lo tocado»).
- Actualizar el hijo de `docs/contexto/` que hable de las pruebas, si lo hay.
- Mensaje final a Francisco: cuánto tardaba antes una pasada completa y cuánto tarda ahora.
