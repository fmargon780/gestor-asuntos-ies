# 619 — «Pasar a Drive» no se para si un fichero no se deja abrir

## Lo que escribió Francisco

12-nov-2026, en el instituto, al pulsar «Pasar a Drive» y señalar `C:\Google Drive` (captura enviada a
Claude): debajo de «Pasar las carpetas a Google Drive» sale en rojo

> No he podido preparar el traslado: No encuentro la carpeta o el fichero. Puede que se haya movido o
> que lo esté sincronizando la nube en este momento.

y solo el botón «Cancelar». Al proponerle Claude el arreglo: «Adelante, sin demora».

## Lo que entendió Claude (acordado con Francisco el 12-nov-2026)

- Antes de copiar, la app cuenta todos los documentos y para eso abre cada uno. Hoy, si uno solo no se
  deja abrir (o una carpeta no se deja recorrer), para todo y no dice cuál es.
- Causa probable, sin comprobar: un fichero del ARCHIVO que el 11-nov-2026 tampoco se pudo leer al medir
  (`docs/612-LO-VISTO-EN-EL-INSTITUTO.md`). No se sabe cuál es ni por qué.
- Lo acordado en la fila 458 era que un fichero que no se puede copiar no para el traslado y sale al
  final en la lista de fallos. Al contar tiene que pasar lo mismo.
- Qué verá quien use la app, una cosa por línea:
  - Al contar, si un fichero no se deja abrir o una carpeta no se deja recorrer, la app sigue con lo
    demás.
  - En la pantalla de «Vas a copiar N documentos (X GB)…», debajo y en rojo, sale «No se pueden leer M
    (no se copiarán):» y la lista, una línea por cosa, con su carpeta y su nombre completos y el motivo.
    Esos M no entran en N.
  - Los botones siguen siendo «Empezar» y «Cancelar». Con «Empezar» se copia todo lo demás.
  - Al terminar la copia, esos mismos salen en la lista de lo que falta, con «Reintentar lo que
    falta», como cualquier otro fallo de copia (fila 458): no se pasa al cambio mientras falte algo.
  - Si no hay ninguno que falle, la pantalla es la de hoy, sin nada nuevo.

## Pantalla de prueba

- Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea

- No se añade un botón para seguir adelante dejando ficheros sin copiar: la regla de la fila 458 («no
  se sigue mientras falte algo») no cambia. Si hace falta, se hablará con Francisco con el fichero
  delante.
- No se intenta arreglar ni renombrar el fichero que falla.

## Notas técnicas de Claude

- Cambios quirúrgicos en `js/pasar-a-drive.js` (`recorrer`, `unidad` de `planear`, `montar`, `resumen`,
  y donde `copiar`/`comprobar` reúnen fallos) y `js/pasar-a-drive-ajustes.js` (`pasoEmpezar`). Nada más.
- En `recorrer`: `try/catch` alrededor de `h.getFile()` y de la iteración de `dir.entries()` de cada
  subcarpeta; lo que falle va a una lista `T.noLeidos` (`{ ruta: 'ARCHIVO / … / nombre', motivo:
  U.mensajeDeError(e) }`) y se sigue. Lo mismo en el `getFile()` de `unidad` con `esFichero`. La ruta
  empieza por el nombre de la carpeta madre (la de asuntos abiertos, la del ARCHIVO, la de la copia o
  `_GESTOR`) para que se encuentre en el explorador de Windows.
- `resumen()` devuelve además `noLeidos`. Una unidad con algo no leído no se marca nunca como hecha en
  el avance, y sus no leídos se suman a los `fallos` que devuelve la copia y a lo que «falta» en la
  comprobación, para que salgan con «Reintentar lo que falta». Al reintentar se vuelve a intentar leer.
- Un traslado a medias («Seguir») pasa por el mismo `montar`: vale igual.
- Demostración: en `js/demo/disco.js`, un interruptor de prueba que haga fallar `getFile()` de un
  fichero con `NotFoundError`, como el que ya corta el traslado a la mitad.
- Prueba nueva en `pruebas/pasar-a-drive.mjs` (o fichero aparte con «pasar-a-drive» en el nombre): con
  un fichero que falla, la cuenta sale, la lista lo nombra, «Empezar» copia lo demás y al final sale en
  lo que falta. Una sola tanda al final: `npm test -- pasar-a-drive nube-drive`.
- De paso, solo documentos: el botón está en Ajustes → «Este ordenador» → «Carpetas de este ordenador»,
  no en «Mantenimiento» (esa pestaña ya no existe, fila 288). Corregirlo en `docs/PASAR-A-DRIVE.md`.
- `js/novedades.js`: una línea («Pasar a Drive» ya no se para si un fichero no se deja abrir: lo enseña).

## Cómo lo comprueba el segundo revisor

- Tarea pequeña: sin segundo revisor.

## Qué mirar al terminar

- En el instituto, con la copia sin internet ya en la versión nueva: Ajustes → «Este ordenador» →
  «Carpetas de este ordenador» → «Pasar a Drive» → señalar `C:\Google Drive`. Debe salir «Vas a copiar N
  documentos…» y, si algo no se puede leer, la lista en rojo con su carpeta y su nombre.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
