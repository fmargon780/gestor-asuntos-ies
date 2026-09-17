# "Por clasificar": saber siempre qué documento estás viendo

Acordado con Francisco el 17-sep-2026. Fila 25 de `docs/COLA.md`.

## El problema, con sus palabras

> Cuando tenemos documentos en la bandeja Por clasificar y los visualizamos nos aparecen en la
> parte derecha de la pantalla. No siempre el nombre del archivo es lo suficientemente claro para
> poder saber en qué parte de la lista izquierda estamos. ¿Sería posible que el documento que
> estemos visualizando se resalte de alguna forma en la parte izquierda, para irnos a las
> acciones del mismo sin confundirnos?

## Qué hay que hacer

Dos cosas, las dos acordadas.

### 1. Marcar en la lista el documento que se está viendo

- Al abrir un documento en el panel de la derecha, su tarjeta en la lista de la izquierda queda
  **marcada**: fondo distinto y una barra de color en el borde izquierdo. Que se vea de un
  vistazo, sin buscar.
- Si esa tarjeta se ha quedado fuera de la pantalla, **la lista se desplaza sola hasta ella**, con
  el desplazamiento suave y sin mover el resto de la página.
- Solo hay una marcada a la vez. Al cerrar el panel de la derecha, la marca se quita.
- En la **cabecera del panel de la derecha** sale el nombre completo del documento que se está
  viendo. Si no cabe entero, se corta por el medio (no por el final), para que se vea la
  extensión, y el nombre completo queda en el `title`.
- Lo mismo vale para el panel de leer un correo si comparte el visor: la marca es del elemento
  abierto, sea el que sea.

### 2. Las acciones, también dentro del panel de la derecha

- Debajo de la cabecera del panel de la derecha van los mismos botones que ya tiene la tarjeta:
  **Crear asunto con él**, **Meter en un asunto** y **Borrar**.
- Son los mismos de `js/documentos-sueltos.js` (`App.empezarAsuntoCon`, `App.meterSueltoEnAsunto`
  y el borrado por papelera): **no dupliques la lógica**, saca los botones a una función que usen
  los dos sitios.
- Al terminar una acción, el panel se cierra si el documento ya no está en Por clasificar, y la
  lista se repinta con el documento fuera. Nada de tener que recargar (misma regla que la fila 23).
- Con el panel abierto, el documento que se ve y el de los botones es siempre el mismo. No puede
  darse el caso de pulsar "Borrar" y que borre otro.

## Dónde tocar

- `js/documentos-sueltos.js` — la lista, la tarjeta y las tres acciones.
- `js/visor.js` — el panel de la derecha, su cabecera y el hueco de los botones.
- `js/lector.js` — solo si comparte la cabecera del panel.
- `css/` — la marca de la tarjeta (fondo y barra lateral) y la cabecera del panel. Que se
  distinga igual de bien en pantalla ancha y en el Chromebook.

Si algún fichero de esos pasa de unas 400 líneas y hay que tocarlo a fondo, pártelo en dos.

## Cómo lo compruebas tú

- Prueba nueva en `pruebas/`: al abrir un documento, su tarjeta queda marcada y solo la suya; al
  cerrarlo, no queda ninguna; al borrarlo, desaparece de la lista sin recargar.
- Batería completa (`npm test`) en verde antes de subir.
- Comprueba lo publicado con `curl`.

## Reglas de esta instrucción

- Cambios quirúrgicos; no reescribas ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md` y los ficheros de la lista.
- **Sube directamente a `main`, sin pull request** (si la sesión es de la nube y no puede, vale el
  pull request con el permiso de fusión de la nota final de la cola).
- Una sola tanda de pruebas al final.
- No toca `apps-script/gestor-correos.gs`.
- Al terminar: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` sustituyendo la línea vieja, y la
  anotación en `docs/HISTORIA.md`.
