# Adónde lleva la aplicación después de cada acción

Cerrado con Francisco el 24-sep-2026. Fila 119 de `docs/COLA.md`.

## El problema

Casi nunca te deja en lo que acabas de tocar. Al crear un asunto vuelves a la lista, y hay que
buscarlo para seguir. «Volver» siempre lleva a la lista general, aunque vinieras de «Qué me toca»,
de «Duplicados» o de una búsqueda. Y la lista sube arriba del todo.

## La regla (lo que verá Francisco)

1. **Crear un asunto abre su ficha.** Por cualquier vía: el formulario «Nuevo asunto», un
   documento de «Por clasificar» (botón «Aceptar» de la propuesta incluido), un correo de la
   bandeja («Crear el asunto») y un recurrente creado de uno en uno.
   - Si se creó desde un documento suelto, hoy se abre después el cuadro de ponerle nombre
     (`App.verDocumentos(recien)`): se sigue abriendo, pero encima de la ficha nueva, no de la lista.
2. **Reabrir un asunto desde su ficha abre su ficha de asunto abierto**, no la lista del ARCHIVO
   (donde ya no está).
3. **Editar un asunto desde el menú de tres puntos deja en la ficha del asunto editado** (con su
   nombre nuevo), en vez de volver a la lista. Es la misma idea que el punto 1. Archivar y Borrar
   sí siguen saliendo a la lista.
4. **«Volver» (y Escape) devuelve a la pantalla de la que se vino**: «Qué me toca», «Duplicados»,
   Asuntos abiertos, ARCHIVO (con la búsqueda que tuviera), Por clasificar o Ajustes. Si no se
   sabe, a Asuntos abiertos como hoy.
5. **La lista vuelve a la misma altura** a la que estaba al salir de ella (Asuntos abiertos y
   ARCHIVO), en vez de subir arriba del todo.
6. **Cuando lo lógico es quedarse donde se está, aviso con botón «Ir al asunto»**: meter un
   documento en un asunto que ya existe («Meter aquí», «Meter en un asunto»), guardar un correo en un
   asunto («Guardar en ese asunto», «Reabrir y guardar aquí»), unir asuntos, y «Devolver a su sitio»
   un asunto desde la papelera. El aviso dura algo más que el normal (unos 8 segundos) y el botón
   abre la ficha de ese asunto.
7. **Crear varios recurrentes de golpe** («Crear los que tocan») no abre nada: se queda como hoy.
8. «Abrir el que ya existe» de un duplicado archivado abre directamente su ficha de archivado, no
   la lista del ARCHIVO con la búsqueda puesta.

## Cómo hacerlo

- Todo pasa por lo que ya existe: `App.ir(cual)` (`js/nucleo.js`) para cambiar de pantalla y
  `App.abrirFicha(a, modo)` (`js/ficha-asunto.js`) para abrir un asunto. No se crea otro camino.
- **Pantalla de origen**: `App.abrirFicha` apunta, antes de cambiar de pantalla, cuál era la
  pantalla visible (y, si es una lista, su `scrollTop`). `volverALaLista()` vuelve a esa. Tras
  crear, reabrir o editar, el origen es la lista que toca (abiertos), no el formulario «Nuevo».
  Un solo nivel de memoria: nada de pila de historial.
- **Altura de la lista**: `App.pintarAbiertos()` (`js/asuntos-lista.js`) vacía la caja con
  `innerHTML = ''` y eso la sube arriba. Guardar el `scrollTop` antes de repintar y devolverlo
  después (también en el pintado del ARCHIVO). Respetar el contador de turno de los repintados.
- **Tras crear** (`App.crearAsuntoDelFormulario`, `js/asuntos-nuevo.js`, hacia la línea 638):
  en vez de `App.ir('abiertos')`, buscar el asunto recién creado en `App.E.listaAbiertos` por su
  nombre (como ya hace el bloque del documento traído) y llamar a `App.abrirFicha(recien, 'abierto')`.
  Si no aparece, quedarse en la lista como hoy, con el aviso «Asunto creado.».
- **Aviso con botón**: `U.aviso(texto, clase)` (`js/util.js`) solo admite texto. Añadir un tercer
  parámetro opcional `{ boton: 'Ir al asunto', alPulsar: fn }` sin romper las llamadas de hoy. Que
  pulsar el botón cierre el aviso.
- Respetar las reglas de `docs/CONTEXTO-CORTO.md` sección 6: un solo cuadro a la vez
  (`U.preguntar`), `AsuntoRenombrar` para lo que cambia la clave, y `U.envolver` solo si no hay otro
  remedio (apuntándolo en `js/envolturas-esperadas.js`).

## Ficheros que hay que tocar

- `js/nucleo.js` (`App.ir`, si hace falta apuntar la pantalla visible)
- `js/ficha-asunto.js` (`App.abrirFicha`, `volverALaLista`, botón Reabrir de `pintarAcciones`)
- `js/ficha-nombre-acciones.js` (Editar: quedarse en la ficha)
- `js/asuntos-nuevo.js` (`App.crearAsuntoDelFormulario`)
- `js/asuntos-lista.js` (altura de la lista al repintar)
- `js/recurrentes.js` (`crearUno`: abrir la ficha; `crearLosQueTocan`: no)
- `js/documentos-sueltos.js` (Meter aquí / Meter en un asunto: aviso con botón)
- `js/bandeja-correos.js` (`guardarEnAsunto`, `reabrirYGuardar`: aviso con botón)
- `js/unir-asuntos.js` (`unirYa`: aviso con botón)
- `js/papelera.js` (`pulsarDevolver` de un asunto: aviso con botón)
- `js/duplicados.js` (`irAlCandidatoArchivado`: abrir la ficha)
- `js/util.js` (`aviso` con botón opcional)
- `css/` el que tenga `.mensaje`, solo para el botón del aviso
- Una prueba nueva `pruebas/tras-cada-accion.mjs`

Casi todos pasan de 400 líneas. **No partirlos enteros**: los cambios son de pocas líneas cada uno.
Si algo nuevo necesita más de unas 40 líneas (por ejemplo, la memoria de la pantalla de origen y
de la altura), va a un fichero nuevo, `js/navegacion.js`, enganchado desde `App.abrirFicha` y
`volverALaLista`.

## Forma de trabajar

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md` y solo los ficheros de la lista.
- **Cambios quirúrgicos**, nunca reescribir un fichero entero.
- **Sube directamente a `main`, sin abrir pull request** (si la sesión no puede, sigue la nota de
  `docs/COLA.md` sobre el pull request y fusiónalo tú).
- **Una sola prueba al final**: `pruebas/tras-cada-accion.mjs` con estos casos, y `npm test` entero:
  crear un asunto abre su ficha; Volver desde una ficha abierta en «Qué me toca» vuelve a «Qué me
  toca»; la lista de abiertos conserva la altura tras abrir y volver; reabrir abre la ficha abierta;
  «Meter aquí» deja el aviso con «Ir al asunto» y el botón abre la ficha.
- Revisa que `pruebas/quedarse-en-el-asunto.mjs` sigue en verde: la regla «de la ficha solo se sale
  al Volver, Archivar/Reabrir o Borrar» cambia (Editar y Reabrir ya no sacan a la lista).
- Al terminar, en `docs/CONTEXTO-CORTO.md` sección 5, sustituir la línea «De la ficha de un asunto
  solo se sale…» por una que diga la regla nueva en una línea.
