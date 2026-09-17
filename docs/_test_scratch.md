### "Por clasificar": el documento a la vista, marcado en la lista

(17-sep-2026, fila 25). Al abrir un documento suelto en el panel de la derecha, su tarjeta en la
lista de la izquierda queda marcada (`.tarjeta-abierta`, fondo y borde), la lista se desplaza sola
hasta ella si hace falta, y la cabecera del panel enseña su nombre completo (cortado por el medio,
no por el final, si no cabe: así se ve la extensión). Debajo de la cabecera van los mismos botones
de la tarjeta —Crear asunto con él, Meter en un asunto, Borrar—, y al terminar una acción el panel
se cierra solo si el documento ya no está en "Por clasificar".

- **`js/visor.js` no sabe nada de "Por clasificar"**: solo lleva un `marcador` (un texto
  cualquiera que pone quien abre, aquí `'suelto:<nombre>'`) y avisa (`Visor.alCambiar(fn)`) cada
  vez que cambia, al abrir o al cerrar. `Visor.marcadorAbierto()` lo devuelve en cualquier
  momento. `Visor.abrir(handle, nombre, {marcador, acciones})` acepta los dos como opcionales: sin
  ellos se comporta exactamente como antes (así lo siguen usando `js/ficha-asunto.js` y
  `js/unir-asuntos.js`, sin marcador ni acciones). `acciones` es un elemento que se cuelga en un
  hueco nuevo bajo la cabecera (`#visor-acciones`, `css/visor.css`).
- **`js/documentos-sueltos.js` traduce el marcador a la tarjeta de verdad**: se engancha a
  `Visor.alCambiar` (esperando a `DOMContentLoaded`, porque `js/visor.js` se carga después) y, con
  cada aviso, quita `.tarjeta-abierta` de todas y la pone en la que tenga
  `dataset.suelto === nombre`, con `scrollIntoView({behavior:'smooth', block:'nearest'})`. Al
  repintar la lista entera (`App.pintarSueltos`), cada tarjeta nace ya con la clase puesta si le
  toca, sin esperar al aviso.
- **Las acciones del panel no duplican nada**: `App.accionesDeSuelto(s)` construye la tarjeta
  entera con `App.tarjetaSuelto` (que a esa altura ya lleva el botón "Borrar" que le cuelga
  `js/papelera.js` por envoltura), le quita el botón "Abrir" —huelga, ya se está viendo— y
  devuelve su `.acciones`. Un solo sitio con la lógica de los tres botones.
- **El cierre solo si ya no está**: `App.pintarSueltos` empieza siempre comprobando si el
  marcador abierto es un `'suelto:...'` que ya no aparece en `App.E.sueltos`, y si es así llama a
  `Visor.cerrar()`. Como `App.verAbiertos` (que releva `App.E.sueltos` y llama a
  `App.pintarSueltos`) ya se llama tras crear un asunto, meter el documento en uno o borrarlo, no
  hace falta tocar esas tres acciones para nada.

FIN_DE_LA_PRUEBA_TECNICA_MARCADOR_UNICO_7f3a9c
