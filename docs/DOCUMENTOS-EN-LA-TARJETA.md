# Los documentos en la tarjeta cerrada, legibles

Fila 114 de `docs/COLA.md`. Cerrada con Francisco el 24-sep-2026.

## El problema

En la ficha del asunto, la tarjeta cerrada «Documentos de la carpeta» (fila 107) enseña los
nombres de los documentos montados unos encima de otros: los renglones se aplastan, se cortan
las letras por abajo y el último documento queda a medias. Además, la primera línea dice
«5 documentos», que repite el número que ya sale en el círculo junto al título.

Causa: en `css/ficha-tarjetas.css`, `.ficha-tarjeta-resumen` es una columna flex con
`min-height: 0` y `overflow: hidden`, y sus hijos `.ficha-resumen-linea` tienen el encogimiento
por defecto (`flex-shrink: 1`). Cuando no caben, el navegador los encoge por debajo de su alto
de línea en vez de cortar la lista. Pasa en cualquier tarjeta con muchas líneas de resumen
(Otros asuntos, Personas relacionadas), no solo en Documentos.

## Lo que hay que hacer

1. **Que los renglones no se aplasten nunca.** `.ficha-resumen-linea` con `flex: none` (o
   `flex-shrink: 0`). Vale para todas las tarjetas.
2. **En la tarjeta Documentos, quitar la línea «N documentos».** El número ya está en el
   círculo del título (`#ficha-cuenta-docs`). En `resumirDocumentos()` de
   `js/ficha-tarjetas.js`, la primera parte `{ texto: plural(...), clase: 'fuerte' }` desaparece.
3. **Como mucho 5 documentos en la tarjeta cerrada.** Si hay más, una última línea
   «y N más» (botón, mismo estilo azul que los nombres) que abre la tarjeta en grande:
   `abrir('documentos')`. Si en el alto disponible caben menos de 5 renglones enteros, se
   enseñan los que quepan enteros y el «y N más» cuenta el resto: nunca un renglón cortado a
   la mitad. Medirlo después de pintar (alto de la caja del resumen entre alto de un renglón),
   y volver a medir cuando cambie el alto de la rejilla (`ajustarAlto()` ya se llama al
   redimensionar y al abrir o cerrar el visor).
4. **Nombres largos:** siguen cortados con «…» en una sola línea (ya lo hace el CSS), y cada
   línea lleva `title` con el texto entero, para verlo al pasar el ratón. Ponerlo en
   `ponerResumen()` para todas las líneas, no solo las de documentos.
5. Pulsar un nombre sigue abriéndolo en el visor de la derecha, como ahora.

## Ficheros que se tocan

- `css/ficha-tarjetas.css` — el `flex: none` de `.ficha-resumen-linea`.
- `js/ficha-tarjetas.js` — `resumirDocumentos()`, `ponerResumen()` (el `title`) y la medida
  de cuántos caben. El fichero tiene 443 líneas: si al añadir esto pasa de unas 450, saca los
  resúmenes (`ponerResumen`, `resumir*`) a un fichero nuevo `js/ficha-tarjetas-resumen.js`,
  cargado en `index.html` justo antes de `js/ficha-tarjetas.js`.
- `js/version.js` — la versión, con la hora del reloj de verdad.
- Una prueba en `pruebas/` (la que ya cubra la ficha en tarjetas, o una nueva): con 8
  documentos, la tarjeta cerrada enseña como mucho 5 nombres más «y 3 más», ninguna línea
  tiene un alto menor que su alto de línea, y no aparece la línea «8 documentos».

## Cómo trabajar

- No leas el repositorio entero: solo los ficheros de arriba y `docs/CONTEXTO-CORTO.md`.
- Cambios quirúrgicos, sin reescribir ficheros enteros.
- Una sola prueba al final (`npm test`).
- Sube directamente a `main`, sin abrir ninguna pull request (o, si la sesión lo impone,
  según la nota «sube directamente a main» de `docs/COLA.md`).
- Al terminar, lo de siempre: fila HECHA en `docs/COLA.md`, `docs/CONTEXTO-CORTO.md` y
  `docs/HISTORIA.md`.

## Qué verá Francisco

En la tarjeta «Documentos de la carpeta», cada documento en su renglón, legible, sin pisarse.
Como mucho cinco; si hay más, «y N más», que abre la lista entera. Sin la línea «5 documentos».
