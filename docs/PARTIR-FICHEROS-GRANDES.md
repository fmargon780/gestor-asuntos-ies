# Fila 133 — Partir los ficheros grandes

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 1, punto E). Diseño cerrado con Francisco el 24-sep-2026.

No cambia nada de lo que se ve. El objetivo es que cada arreglo futuro sea más barato (menos que
leer) y rompa menos.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que se
  cita y los ficheros de la lista. Si con `grep` aparece otro fichero que haga falta tocar, tócalo y
  apúntalo en la documentación.
- **Cambios quirúrgicos.** No reescribas ficheros enteros. Lo nuevo va en ficheros nuevos y
  pequeños (menos de 400 líneas), enganchados por un punto previsto, no envolviendo.
- Sube directamente a `main`, sin pull request (o según la nota de la cola si la sesión no puede).
  Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.
- Todo guardado de `_GESTOR` por `ColaGuardado`. Todo fallo accesorio, en ámbar, sin parar lo
  principal.
- Al terminar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`, sustituyendo lo viejo.

## Qué se parte

Los que pasan de 600 líneas hoy, **de mayor a menor**, uno cada vez:

`bandeja-correos.js` (1.151), `datos.js`, `ficha-asunto.js`, `guias.js`, `asuntos-nuevo.js`,
`papelera.js`, `asuntos-lista.js`, `ajustes-centro.js`, `plantillas.js`, `documentos.js`,
`relacionados.js`, `util.js`, `correo.js`, `unir-asuntos.js`, `plantillas-documento.js`.

(Si la fila 130 o la 132 ya han partido o adelgazado alguno, se salta.)

## Cómo

- Cada fichero se parte por temas, en trozos de menos de 400 líneas, con nombre que diga qué hace
  (como se hizo con `js/guias.js` en la fila 122).
- **Sin cambiar el comportamiento.** Se mueven funciones enteras, no se reescriben.
- Los nombres públicos (`App.x`, `Guias.x`…) no cambian. Nada que lo llame tiene que enterarse.
- Cada trozo nuevo, en `index.html` en el orden correcto, en `js/envolturas-esperadas.js` si
  envuelve algo, y en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- La copia sin internet copia todo `js/`: no hay que tocar `scripts/copia-local.mjs`, pero
  comprobar que `npm run copia-local` sigue funcionando.
- Pruebas: la batería completa después de **cada** fichero partido, no solo al final. Es la
  excepción a «una sola tanda», porque un fallo aquí es silencioso.

## Si no da tiempo

Si la sesión no llega a los quince, se sube lo hecho, esta fila pasa a HECHA con la lista de lo
partido, y se apunta en la cola una fila nueva PENDIENTE justo debajo, con los que falten.
