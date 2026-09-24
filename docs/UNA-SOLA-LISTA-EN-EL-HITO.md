# Fila 138 — Una sola lista dentro del hito

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «redundancias»). Diseño cerrado con Francisco el 24-sep-2026.

Dentro de un hito hay dos listas de comprobación: el **guion** y **«lo que hay que reunir»**.
Hacen lo mismo. Se quedan en una: el guion. Algo que hay que reunir es una línea más del guion, con
su marca.

A partir de aquí las palabras son tres, y así se escriben en pantalla, en el código nuevo y en la
documentación: **guía** (el modelo), **hito** (cada paso) y **guion** (la lista de tareas del
hito).

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

Contexto: `docs/contexto/HITOS-Y-GUIAS.md`, `docs/contexto/HITO-MESA.md`,
`docs/REQUISITOS-DE-HITO.md`.

## Ficheros que se tocan

- `js/hitos-guion.js`, `js/hito-mesa-guion.js`, `js/guias-guion.js` (la línea gana la marca)
- `js/hitos-requisitos.js`, `js/guias-requisitos.js` (dejan de pintar; lo que sirva, al guion)
- `js/hitos-panel-lista.js`, `js/que-me-toca.js` (lo que contaba requisitos)
- `js/guias-biblioteca.js`, `js/cargar-biblioteca.js`, `datos-biblioteca/biblioteca-centro.json`
  (si lleva requisitos)
- Nuevo `js/reunir-migracion.js`, `index.html`
- Prueba nueva: `pruebas/una-sola-lista-en-el-hito.mjs`

## 1. El dato

Una línea del guion puede llevar `reunir: 'documento' | 'dato'` y `obligatorio: true|false`.

- **Documento**: se marca sola al añadir o asociar un documento a ese hito, como ya hacen otras
  líneas del guion.
- **Dato**: la línea lleva una caja de texto para el valor; se marca al escribirlo.
- En pantalla, una marca pequeña delante: 📎 para documento, ✎ para dato; y «obligatorio» en
  negrita si lo es.

## 2. El paso de lo que ya hay

`js/reunir-migracion.js`, una sola vez, con marca en `_GESTOR/reunir-migrado.json` (fuera de los
dieciocho, como `estado-migrado.json`):

- Cada requisito de cada paso de `guias.json` pasa al final del guion de ese paso.
- Cada requisito de cada hito vivo de `hitos.json` pasa al final del guion de ese hito,
  **conservando** si estaba hecho, el valor, el documento, quién y cuándo.
- Los requisitos viejos no se borran del fichero (se dejan de leer), por si hay que deshacer.
- Cada fichero, por `ColaGuardado`, y copia antes de escribir.
- Los hitos archivados no se tocan: al enseñarlos, se leen las dos cosas.

## 3. Qué desaparece

La sección «Lo que hay que reunir» del editor de la guía y del hito. En su lugar, en el editor del
guion, junto a «Es una pregunta», una casilla «Hay que reunirlo» con documento/dato y
obligatorio.

## 4. La prueba

Un paso con dos requisitos (uno hecho) da un guion con dos líneas más, la hecha marcada; hacer la
migración dos veces no duplica; añadir un documento al hito marca la línea de documento.
