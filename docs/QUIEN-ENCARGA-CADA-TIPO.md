# Fila 134 — Quién encarga cada tipo

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «lo que falta», punto 4). Diseño cerrado con Francisco el 24-sep-2026.

El trabajo de los administrativos lo encargan tres órganos: Secretaría, Dirección y Jefatura de
Estudios. Hoy los tipos de asunto no dicen de cuál son, y con dos personas creándolos acabarán
repitiéndose.

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

Contexto: `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/contexto/ASUNTOS.md`,
`docs/contexto/HITOS-Y-GUIAS.md` (sección de «Cuentas»).

## Ficheros que se tocan

- `js/ajustes-tipo.js` (y el fichero donde se normalizan los tipos de `tipos.json`)
- `js/tipo-al-vuelo.js`
- `js/tipos-buscador.js`, `js/asuntos-nuevo.js`
- `js/asuntos-lista.js` (filtros)
- `js/cuentas.js`
- Nuevo `js/tipos-organo.js` (la pantalla de asignar a todos), `index.html`
- Prueba nueva: `pruebas/quien-encarga-cada-tipo.mjs`

## 1. El dato

Cada tipo de `tipos.json` lleva `organo`: `SECRETARIA`, `DIRECCION`, `JEFATURA`, `VARIOS` o vacío.
Un tipo sin él se lee como vacío («Sin asignar»). Se fusiona como el resto de `tipos.json`.

## 2. Dónde se pone

- **Ajustes de un tipo**: desplegable «Quién lo encarga», junto a la categoría.
- **Crear tipo desde Nuevo asunto** (`js/tipo-al-vuelo.js`): el mismo desplegable como cuarto dato,
  opcional.
- **Ajustes › Tipos de asunto › «Quién encarga cada tipo»**: una sola pantalla con todos los tipos
  en filas (nombre, categoría, desplegable). Se guarda al cambiar cada desplegable. Arriba, un
  filtro «Solo los sin asignar». Resumen en el título plegado: «N sin asignar».

## 3. Dónde se usa

- **Nuevo asunto**: la parrilla de tipos se agrupa por órgano (Secretaría, Dirección, Jefatura,
  Varios, Sin asignar), dentro de cada categoría. El buscador sigue buscando en todos.
- **Asuntos abiertos**: un filtro más, «Lo encarga», con los cinco valores.
- **Cuentas**: una tabla más, asuntos por órgano (abiertos, archivados, total), y la columna
  «Lo encarga» en la tabla por tipo.

## 4. La prueba

Un tipo sin `organo` sale como «Sin asignar»; al asignarlo se guarda en `tipos.json`; la parrilla
agrupa; el filtro filtra; Cuentas suma por órgano.
