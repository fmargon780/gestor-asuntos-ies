# Salir de «Guardar en un asunto» cuando el asunto no está

Fila 230 de la cola. Diseñada con Francisco el 29-sep-2026 (conversación de Cowork).

## El problema (palabras de Francisco)

«Al intentar guardar un documento en un asunto previo desde la bandeja Por Clasificar, si no
encuentro el asunto en el que quiero guardarlo, no tengo opción de salir y la tecla Escape no hace
nada.»

## Lo que hay hoy

- La ventana es `ElegirAsunto.elegir()` de `js/elegir-asunto.js`, montada sobre `#capa`. La usan
  dos sitios: `App.meterSueltoEnAsunto` (`js/documentos-sueltos.js`, documento suelto de «Ver
  todo») y `App.elegirAsuntoDelCorreo` (`js/bandeja-enlace.js`, correos).
- Esconde «Aceptar» y deja «Cancelar» (`#cuadro-cancelar`), pero el botón está al final del
  cuadro, debajo de «Podrían encajar» y de «Todos los asuntos». Con `.cuadro-medio`
  (`css/guias.css`: `max-height` y `overflow: auto`) el cuadro entero se desplaza y «Cancelar»
  queda fuera de la vista: para Francisco, no hay salida.
- La tecla Escape debería cerrarlo (`js/usabilidad.js`, apartado 6, pulsa `#cuadro-cancelar`),
  pero en la práctica no hace nada. **Hay que encontrar la causa de verdad** (candidatos: otro
  `keydown` que se adelanta y corta la propagación —la vista «Ver todo», el buscador
  `#enlace-buscar` con el cursor dentro, el visor del documento—, o el foco en un sitio que no
  llega al `document`) y arreglarla ahí, sin tapar el síntoma. Probar las dos entradas: el
  documento suelto y el correo, y con el cursor dentro y fuera del buscador.

## Qué hay que hacer

1. **Una ✕ arriba a la derecha del cuadro**, siempre a la vista (no se desplaza con la lista).
   Hace lo mismo que «Cancelar»: cierra sin hacer nada y deja la pantalla de debajo como estaba.
2. **«Cancelar» siempre visible sin bajar.** Solo se desplazan las listas; la cabecera (título,
   ✕, texto del documento o correo) y el pie de botones se quedan fijos. Vale la solución que
   menos toque el cuadro compartido: por ejemplo, una clase propia de este cuadro que limite la
   altura de `.enlace-lista` en vez de hacer desplazable el cuadro entero. Que no cambie el
   aspecto de los demás cuadros que usan `#capa`.
3. **Escape cierra la ventana**, siempre, con el cursor en el buscador o fuera de él. Un solo
   Escape basta (no primero vacía el buscador y después cierra). No debe cerrar además la vista
   de debajo («Ver todo», la bandeja): solo el cuadro.
4. **Botón nuevo en el pie: «No está: crear un asunto nuevo con él»** (texto para el correo: «No
   está: crear un asunto nuevo con este correo»). Cierra la ventana y hace exactamente lo mismo
   que el botón de crear de la pantalla de origen, sin código nuevo de creación:
   - documento suelto: `App.empezarAsuntoCon(s)` (lo mismo que «Crear asunto con él», que ya usa
     lo leído del documento);
   - correo: `window.Bandeja.llevarANuevo(item)` (lo mismo que «Crear el asunto» / «Crear uno
     nuevo» de la bandeja).
   Para eso, `ElegirAsunto.elegir()` acepta una opción nueva (por ejemplo `crearNuevo: { texto,
   alPulsar }`); si no se pasa, el botón no sale. Queda a la izquierda del pie; «Cancelar» a la
   derecha, como siempre.
5. Lo mismo en las dos entradas (documento suelto y correo), porque es la misma ventana. El otro
   cuadro de `js/elegir-asunto.js` («Reabrir y guardar aquí» / «Guardar sin reabrir») recibe
   también la ✕ y el Escape, pero no el botón de crear.

## Qué no se toca

- La puntuación de «Podrían encajar», el buscador y lo que pasa al elegir un asunto.
- El flujo de creación de asuntos (filas 173, 174, 215 y 220): solo se llama desde un sitio más.

## Pruebas

Prueba nueva `pruebas/salir-de-elegir-asunto.mjs` (Playwright, con `?demo=1`), para las dos
entradas: la ✕ y «Cancelar» visibles sin desplazar con muchos asuntos; Escape cierra con el cursor
en el buscador y fuera; tras cerrar, la vista de debajo sigue igual; el botón nuevo abre «Nuevo
asunto» con el documento (o el correo) preparado, igual que el botón de crear de origen.

## Cómo sabemos que está bien

1. En «Ver todo», en un documento suelto, pulsar «Guardar en un asunto»: se ven la ✕ arriba a la
   derecha y el botón «Cancelar» sin tener que bajar, aunque haya muchos asuntos en la lista.
2. Pulsar la ✕: el cuadro se cierra y «Ver todo» sigue igual, en el mismo sitio y con el mismo
   documento.
3. Volver a abrirlo, escribir algo en «Buscar por nombre o tercero» y pulsar Escape una vez: el
   cuadro se cierra. Abrirlo otra vez y pulsar Escape sin tocar el buscador: se cierra.
4. Tras cerrar con Escape, «Ver todo» sigue a la vista (no vuelve a Inicio).
5. Pulsar «No está: crear un asunto nuevo con él»: se abre «Nuevo asunto» con el documento
   preparado, igual que al pulsar «Crear asunto con él» en ese mismo documento.
6. En la bandeja de correos, «Guardar en un asunto» de un correo: los puntos 1 a 4 igual, y «No
   está: crear un asunto nuevo con este correo» hace lo mismo que «Crear el asunto» de ese correo.
7. Elegir un asunto de la lista sigue guardando el documento en ese asunto, como antes.
