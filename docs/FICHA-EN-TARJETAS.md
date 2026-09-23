# Fila 107 — La ficha del asunto en tarjetas

Diseño cerrado con Francisco el 24-sep-2026. **Va después de la fila 106** (esa toca la
cabecera de la misma ficha): bajar `main` antes de empezar.

## El problema

Hoy la ficha del asunto está a tres columnas: Hitos a la izquierda, Documentos en el centro y, a
la derecha, apiladas, "Datos y contacto", Notas, "Otros asuntos de este tercero", "Personas y
entidades relacionadas" (y "Datos del trámite" cuando lo hay). Las de abajo quedan fuera de la
pantalla y se olvidan. La columna del centro está casi vacía.

## Lo que se quiere

### 1. Vista inicial: cuadrícula de tarjetas, todas a la vista

- Debajo de la cabecera (que no cambia), todas las tarjetas de la ficha en una cuadrícula, **del
  mismo tamaño fijo**, repartidas para llenar el alto visible **sin desplazarse hacia abajo**.
- Orden: arriba Hitos, Documentos de la carpeta, Datos y contacto; abajo Notas, Otros asuntos de
  este tercero, Personas y entidades relacionadas. Si el tipo tiene "Datos del trámite", es una
  tarjeta más (cuatro arriba y tres abajo, o lo que llene mejor el ancho).
- Tiene que caber a 1905 px de ancho (monitor del trabajo) y en el Chromebook. En pantallas
  estrechas (por debajo de unos 1100 px) pasa a dos columnas.
- Los plegables `<details>` de "Otros asuntos" y "Personas" dejan de ser plegables: son tarjetas.

### 2. Cada tarjeta cerrada enseña un resumen

- **Hitos**: "1 de 5 hechos" y el siguiente hito pendiente, con su plazo si lo tiene.
- **Documentos**: cuántos hay y la lista de nombres que quepa. Pulsar un nombre lo abre en el
  panel de la derecha, como hoy, sin abrir la tarjeta.
- **Datos y contacto**: la línea resumen de hoy (`Datos.resumenDeTercero`), con sus botones de
  copiar.
- **Notas**: la última nota (quién, cuándo, el principio del texto) y cuántas hay.
- **Otros asuntos / Personas**: cuántos y los primeros nombres.
- Una tarjeta sin contenido ocupa su mismo sitio, con el texto en gris ("ninguno todavía").
- El texto que no cabe se corta con puntos suspensivos; la tarjeta no crece.

### 3. Pulsar una tarjeta la abre en grande

- Pulsar en cualquier parte de la tarjeta (menos en un botón o enlace suyo) la abre en grande:
  ocupa todo el espacio de la ficha debajo de la cabecera.
- Dentro, **el contenido completo de hoy**, con todo lo que ya hace (hitos desplegables, caja de
  escribir la nota con Guardar, "Ver todo", añadir relacionados…). No se quita ninguna función.
- **Las demás tarjetas se quedan arriba como una fila de pestañas pequeñas** (nombre y, si
  aplica, su cuenta). La abierta, marcada. Pulsar otra pestaña cambia de tarjeta sin pasar por la
  cuadrícula.
- Botón **"Volver a las tarjetas"** en esa fila. **Escape** con una tarjeta abierta vuelve a la
  cuadrícula; solo un segundo Escape hace lo de siempre en la ficha.
- **Si hay un documento abierto en el panel de la derecha** (`js/visor.js` / `js/lector.js`), se
  queda a la derecha como hoy, y la tarjeta abierta ocupa el resto. Abrir o cerrar el documento
  no cierra la tarjeta.

### 4. Los documentos siempre a mano

- Toda tarjeta abierta en grande (menos la de Documentos, que ya es la lista) lleva **arriba una
  franja con sus documentos**, como chips pulsables:
  - En **Hitos**: los documentos asociados al hito desplegado. Si no hay ninguno desplegado, o el
    hito no tiene documentos, todos los de la carpeta.
  - En las demás: todos los documentos de la carpeta.
- Pulsar un chip abre el documento en el panel de la derecha **sin cerrar ni repintar la
  tarjeta**. El chip del documento que se está viendo, marcado.
- Sin documentos en la carpeta, la franja no sale.

### 5. Qué se recuerda

- Al entrar en una ficha, siempre la cuadrícula.
- Excepción: desde "Qué me toca" (abre la ficha con un hito desplegado), entra con Hitos abierta
  en grande y ese hito desplegado.
- Un repintado de la ficha (guardar, llega un documento, presencia) **no cierra la tarjeta
  abierta** ni pierde lo escrito: `U.conservandoLoEscrito` sigue envolviendo el repintado.

## Ficheros

- **Nuevo** `js/ficha-tarjetas.js`: la cuadrícula, los resúmenes, abrir en grande, las pestañas,
  la franja de documentos, Escape y qué tarjeta está abierta. Cargado después de
  `js/ficha-asunto.js`, `js/ficha-documentos.js`, `js/ficha-plegables.js`, `js/notas.js`,
  `js/relacionados.js`, `js/otros-del-tercero.js` y `js/hitos-panel-lista.js`. Si pasa de 400
  líneas, partirlo (por ejemplo `js/ficha-tarjetas-resumen.js`).
- **Nuevo** `css/ficha-tarjetas.css`.
- `js/ficha-asunto.js`: dejar de montar las tres columnas; montar el contenedor de tarjetas y
  un punto de enganche para `js/ficha-tarjetas.js` (regla: un módulo nuevo no envuelve; si no hay
  más remedio, `U.envolver` y apuntarlo en `js/envolturas-esperadas.js`).
- `js/ficha-plegables.js`: los dos plegables pasan a tarjetas (o se retira, si ya no hace falta).
- `js/ficha-documentos.js`: exponer la lista de documentos de la carpeta para la franja y el
  resumen.
- `js/hitos-panel.js`, `js/hitos-panel-lista.js`: saber cuál es el hito desplegado y sus
  documentos; avisar cuando cambia, para la franja.
- `js/visor.js`: saber qué documento está abierto, para marcar su chip.
- `js/que-me-toca.js`: abrir la ficha con Hitos en grande.
- `js/usabilidad.js`: el primer Escape cierra la tarjeta abierta.
- `css/ficha-asunto.css`: quitar lo de las tres columnas que ya no se use.
- `index.html`: los `<script>` y `<link>` nuevos.
- `js/version.js`.
- Nueva prueba `pruebas/ficha-en-tarjetas.mjs`; ajustar las pruebas existentes que dependan de
  las tres columnas o de los plegables.
- Al terminar: `docs/CONTEXTO-CORTO.md` (sustituir la línea "ficha del asunto a tres columnas"),
  `docs/contexto/ASUNTOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`,
  `docs/COLA.md`.

## Cómo trabajar

- **No leas el repositorio entero**: solo los ficheros de arriba y `docs/CONTEXTO.md` con sus
  hijos `ASUNTOS.md`, `HITOS-Y-GUIAS.md` y `PANTALLA.md`.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- Sube directamente a `main`, sin pull request (si la sesión lo impide, la nota final de
  `docs/COLA.md`).
- **Una sola prueba al final**: `pruebas/ficha-en-tarjetas.mjs`, en navegador de verdad, a
  1905×1000 y a 1280×800:
  1. Todas las tarjetas se ven enteras sin desplazarse.
  2. Pulsar Hitos la abre en grande; las demás salen como pestañas; pasar a Notas por su pestaña.
  3. Con un documento abierto a la derecha, la tarjeta sigue abierta y ocupa el resto.
  4. La franja de Hitos enseña los documentos del hito desplegado; pulsar un chip abre el
     documento sin cerrar la tarjeta.
  5. Escape vuelve a la cuadrícula.
  6. Escribir una nota, provocar un repintado: ni se cierra la tarjeta ni se pierde lo escrito.
  7. Desde "Qué me toca", entra con Hitos en grande y el hito desplegado.
  Más `npm test` completo en verde. Una foto a 1905 px de la cuadrícula y otra de una tarjeta
  abierta con documento a la derecha, para comprobarlo tú antes de publicar.
