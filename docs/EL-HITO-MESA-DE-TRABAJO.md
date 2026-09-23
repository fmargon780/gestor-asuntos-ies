# El hito, mesa de trabajo: añadir documentos, su menú y Comunicar (fila 103)

Diseñado y cerrado con Francisco el 23-sep-2026. Es la **segunda tanda** de que el hito sea la mesa
de trabajo del asunto. La primera tanda es la fila 102 (`docs/DOCUMENTOS-DESDE-EL-HITO.md`: plantillas
de documento unidas a un paso y "Generar documento" en el hito), ya HECHA. Esta fila usa lo que dejó.

Regla de fondo de toda la fila: **lo que se haga desde un hito queda unido a ese hito solo**
(`Hitos.anadirDocumento`), y marca solo la casilla de "Lo que hay que reunir" que le toque
(`HitosRequisitos.marcarPorDocumento`, no crítico). Nunca se duplica un cuadro: se reutiliza el
que ya usa la ficha del asunto, con un parámetro opcional para saber el hito.

---

## 0. Antes de empezar (reglas de siempre)

- Lee `docs/CONTEXTO.md` y **solo** estos hijos: `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/DOCUMENTOS.md`, `docs/contexto/DOCUMENTOS-PDF.md` (apartado de Separar/Unir y
  Ajustar tamaño) y `docs/contexto/CORREO-Y-SENECA.md` (Comunicar y documentos por correo). **No
  leas el repositorio entero.**
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no puede tocar
  `main`, sigue la "Nota sobre sube directamente a main" de `docs/COLA.md`.
- **Cambios quirúrgicos**: nada de reescribir ficheros enteros.
- **Una sola prueba al final** (`npm test` entero).
- Máximo dos subidas (regla 13 de la cola), más la de documentación si hace falta.
- Todo lo nuevo, en ficheros nuevos. En los ficheros de más de 400 líneas que haya que tocar
  (`js/documentos.js`, `js/documentos-sueltos.js`, `js/correo.js`...) solo entran las pocas líneas
  del parámetro opcional; **no se parten en esta fila**.

## 1. "Añadir documento" en el hito

Sustituye al botón "Apuntar un documento" de hoy (`.hito-doc-apuntar`, `js/hitos-panel-lista.js`):
un solo botón **"Añadir documento"** que abre el menú pequeño de `js/ficha-menus.js` con tres
opciones:

1. **Desde el ordenador** → el mismo cuadro "Añadir documento" de `js/documentos.js`
   (`Documentos.abrir` o la función interna que monta ese cuadro), con un parámetro opcional
   `{ hito }`. Al guardar la copia en la carpeta del asunto, se apunta al hito.
2. **Desde "Por clasificar"** → una lista de los documentos sueltos (los mismos que pinta la vista
   "Por clasificar", leídos igual). Al elegir uno, se sigue el mismo camino que "Meter aquí"
   (`js/documentos-sueltos.js` / `js/documentos-sueltos-lector.js`): cuadro de poner nombre, el
   fichero pasa a la carpeta del asunto y sale de "Por clasificar". Al terminar, se apunta al hito.
   Sin sueltos, la opción sale apagada con "(no hay ninguno)".
3. **Uno que ya está en la carpeta** → el cuadro de hoy, `HitosDocumentos.abrir(a, h)`, sin cambios.

Si en el hito hay casillas de "Lo que hay que reunir" de clase `documento` sin marcar, y el cuadro
de nombrar tiene campo de tipo o texto adicional, **no se rellena nada solo**: solo se marca la
casilla al terminar, como hoy.

Fichero nuevo `js/hitos-anadir.js` (`window.HitosAnadir`): `botonHTML(a, h)`, `engancharBoton(div,
a, h)`. Mismo patrón que `js/hitos-generar.js`. Se pinta en `.hito-botones` (no suelto encima), y
no sale en un hito `decision` ni `noaplica` (mismo criterio que "Generar documento").

## 2. El menú de tres puntos de cada documento del hito

Hoy cada documento apuntado a un hito es un botón con el nombre (abre en el panel) y una ✕. Se
cambia la ✕ por un **menú de tres puntos** (`js/ficha-menus.js`) con:

- **Registrar** (solo si le falta el registro, mismo criterio que la ficha): `Registro.abrirCuadro`.
- **Separar**, **Unir**, **Sacar páginas**, **Ajustar tamaño** (solo PDF, mismo criterio que
  `js/ficha-documentos.js`): las mismas llamadas, con `modo: 'asunto'`.
- **Quitar del hito** (lo que hacía la ✕): solo lo desapunta, nunca lo borra.

**Lo que salga de ahí queda unido al mismo hito**:

- Registrar: la copia sellada nueva se apunta al hito. El original sigue apuntado si lo estaba.
- Separar y Sacar páginas: cada fichero nuevo se apunta al hito.
- Unir: el fichero unido se apunta al hito.
- Ajustar tamaño: el fichero nuevo (si crea uno) se apunta al hito.

Para saber qué ficheros son nuevos sin tocar por dentro cada herramienta: leer la lista de la
carpeta (`Carpetas.ficheros(a.handle)`) **antes** de abrir la herramienta y otra vez en su
`alTerminar`; los nombres que no estaban antes son los nuevos. Una función pequeña y pura para esa
resta, probada sin navegador. Si alguna herramienta ya devuelve los nombres creados, úsalos.

Fichero nuevo `js/hitos-documento-menu.js` (`window.HitosDocumentoMenu`), llamado desde
`js/hitos-panel-lista.js`. En un documento "(ya no está)" el menú solo trae "Quitar del hito".
Después de cualquier acción: `HitosPanel.desplegarAlAbrir(clave, idHito)` antes de repintar, para
que el hito siga abierto.

## 3. "Comunicar" siempre visible en el hito

Hoy (fila 60) el botón solo sale si el paso tiene "Comunicación de este paso". Ahora sale **siempre**
en un hito que no sea `decision` ni `noaplica` (`js/hitos-comunicar.js`):

- **Con texto propio del paso**: igual que hoy (`extra.asuntoListo`/`medioListo`).
- **Sin texto propio**: abre el mismo cuadro, con el desplegable de plantillas del tipo como en el
  "Comunicar" de la cabecera; se mantiene el destinatario del hito (`resolverDestinatario`) y la
  constancia en el hito (`extra.comunicarHito`).
- Con uno o dos canales, el menú Correo/Séneca como hoy; sin texto propio, los dos canales.
- **Documentos del hito ya marcados** en "Documentos de este asunto" del cuadro de Correo
  (`js/correo-adjuntos.js`): nuevo `extra.adjuntosMarcados: [nombres]`, que marca esas casillas
  al pintar la lista (hoy salen todas desmarcadas; sin ese dato, siguen desmarcadas). Solo los
  que siguen en la carpeta.
- **La constancia en el historial del hito** incluye los documentos: si se preparó un borrador con
  documentos, la línea del hito termina en "· con N documentos: a, b". Reutiliza lo que ya monta
  `textoDeLaNota`/`apuntarElRastro` (`js/correo.js`), que ya añade eso a la nota del asunto.
- **"Pedir lo que falta" no se toca**: sigue siendo su botón aparte (decisión pendiente en
  `docs/COLA.md`, "los tres botones de comunicar").

## 4. Ficheros que se tocan

- Nuevos: `js/hitos-anadir.js`, `js/hitos-documento-menu.js`, `pruebas/el-hito-mesa-de-trabajo.mjs`.
- Pequeños cambios: `js/hitos-panel-lista.js`, `js/hitos-comunicar.js`, `js/documentos.js`,
  `js/documentos-sueltos.js` (o el lector, donde viva "Meter aquí"), `js/registro.js` (solo si
  hace falta para saber el nombre nuevo), `js/correo.js`, `js/correo-adjuntos.js`, `index.html`
  (cargar los dos ficheros nuevos detrás de `js/hitos-generar.js`), CSS si hace falta.
- Documentación al cerrar: `docs/CONTEXTO-CORTO.md` (sustituir la línea de "Hitos", no añadir
  otra), `docs/contexto/HITOS-Y-GUIAS.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

## 5. La prueba

`pruebas/el-hito-mesa-de-trabajo.mjs`, sin navegador donde se pueda:

- La resta "ficheros nuevos" (antes/después, con repetidos y con un fichero que desaparece).
- Cuándo sale cada botón del hito (`decision`, `noaplica`, normal; con y sin texto propio).
- `extra.adjuntosMarcados`: marca solo los que existen; sin él, nada marcado.
- La línea del historial con y sin documentos.

Y `npm test` entero en verde al final. Revisa también las pruebas que busquen `.hito-doc-apuntar`
o `.hito-doc-quitar` (cambian de sitio).

## 6. No entra

- Agrupar los documentos de la ficha del asunto bajo su hito (más adelante, con el uso).
- Juntar "Pedir lo que falta" dentro de "Comunicar".
