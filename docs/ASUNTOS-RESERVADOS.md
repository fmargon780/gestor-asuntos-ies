# Fila 135 — Asuntos reservados

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «lo que falta», punto 5). Diseño cerrado con Francisco el 24-sep-2026.

Un expediente disciplinario o uno con datos de salud hoy se ve igual que una factura: en las
listas, en el buscador y en Cuentas, con el nombre de la persona. La idea es que no se vea **sin
querer**. No se puede impedir que alguien abra la carpeta en Dropbox, y la aplicación no debe
decir lo contrario.

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

Contexto: `docs/contexto/ASUNTOS.md`, `docs/contexto/ASUNTOS-ARCHIVO.md`,
`docs/contexto/CAMPOS-Y-TIPOS.md`.

## Ficheros que se tocan

- `js/ajustes-tipo.js` (casilla del tipo)
- `js/ficha-menus.js` o `js/ficha-nombre-acciones.js` (marcar el asunto), `js/ficha-asunto.js`
  (el candado en la cabecera)
- `js/asuntos-lista.js`, `js/que-me-toca.js`, `js/cuentas.js`, `js/archivo-indice.js` (búsqueda),
  `js/tablon.js` si enlaza asuntos
- Nuevo `js/reservados.js` (la regla, en un solo sitio), `index.html`
- Prueba nueva: `pruebas/asuntos-reservados.mjs`

## 1. El dato

- En `tipos.json`, cada tipo puede llevar `reservado: true`.
- En la ficha de `asuntos.json`, `reservado: true`, `false` o sin el dato. Sin el dato, hereda del
  tipo. `false` permite sacar un asunto concreto de un tipo reservado.
- `Reservados.es(asunto)` en `js/reservados.js` es la única que decide.

## 2. Dónde se marca

- **Ajustes de un tipo**: casilla «Reservado (expedientes disciplinarios, salud, protección…)».
- **Ficha del asunto**, en su menú: «Marcar como reservado» / «Quitar la reserva».

## 3. Qué cambia en pantalla

- **Tarjeta en Asuntos abiertos, «Qué me toca» y ARCHIVO**: un candado, el tipo y el grupo, pero
  **no** el nombre del tercero. Se sigue pudiendo abrir.
- **Ficha del asunto**: se ve entera (si la has abierto es a propósito), con el candado en la
  cabecera.
- **Buscador**: los reservados no salen por texto de notas, documentos ni ficha. Sí salen por su
  nombre de carpeta, pero con la tarjeta tapada como arriba.
- **Cuentas**: se cuentan, pero en «quién lo pide» salen como «Reservado».
- **Ficha de una persona**: sus asuntos reservados salen con el candado (ahí ya se ha elegido a
  esa persona).
- Un botón pequeño arriba en Asuntos abiertos, «Mostrar reservados», quita el tapado **solo
  durante esa sesión**, en ese ordenador. No se recuerda.

## 4. Lo que no cambia

El nombre de la carpeta en Dropbox sigue igual. En Ajustes, junto a la casilla, una línea: «Solo
evita que se vea sin querer en la aplicación. La carpeta sigue visible en Dropbox.»

## 5. La prueba

Tipo reservado → tarjeta tapada; asunto con `reservado: false` en tipo reservado → visible; el
buscador no lo encuentra por una nota; «Mostrar reservados» lo destapa y al recargar vuelve a
tapar.
