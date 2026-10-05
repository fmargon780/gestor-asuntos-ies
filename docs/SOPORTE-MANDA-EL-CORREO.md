# El botón de soporte manda el correo de quien avisa (fila 269 de la cola)

Diseño cerrado con Francisco el 5-oct-2026, en Cowork. Es parte de la mejora 4 de
`docs/CENTRO-DE-MANDO-CINCO-MEJORAS.md`.

## Qué se quiere

Cuando un aviso enviado desde el botón «Soporte» queda resuelto y publicado, quien lo envió
recibe un correo que se lo dice. Ese correo lo manda el buzón (fila 268). Para poder mandarlo, el
botón tiene que enviar al buzón **el correo de quien avisa**. Hoy solo manda su nombre.

Esta fila solo toca el botón del Gestor (`js/soporte.js` y sus estilos) y su prueba. No toca el
buzón. No depende de la fila 268: el buzón de hoy ignora el dato nuevo sin dar error, así que las
dos filas se pueden hacer en cualquier orden.

## 1. Lo que ve el usuario

- En la ventana de «Soporte», debajo del texto, un campo **«Tu correo»**, con esta línea debajo:
  «Te escribiremos a esta dirección cuando tu aviso esté resuelto.»
- **Se pide una sola vez en cada ordenador.** Se recuerda igual que hoy se recuerda el nombre. Las
  veces siguientes, en lugar del campo sale «Te avisaremos en <correo>» y un enlace «Cambiar».
- **Es obligatorio la primera vez.** Vacío: «Escribe tu correo para avisarte cuando esté
  resuelto.» Con mala forma: «Ese correo no parece correcto. Revísalo.» El aviso no se envía
  hasta que esté bien, y lo escrito no se pierde.
- Si la aplicación ya supiera el correo de la persona, lo usa sin preguntar.
- El resto de la ventana, igual que ahora.

## 2. Lo que se envía

El aviso lleva un dato nuevo, `correo`, junto a los de siempre (`quien` sigue igual). Nada más
cambia en el envío. Funciona igual en la web y en la copia sin internet.

## 3. Pruebas

En `pruebas/soporte.mjs`:

- La primera vez sale el campo; vacío o con mala forma no se envía y sale su mensaje.
- Con un correo bueno, el aviso enviado lleva `correo` con esa dirección.
- La segunda vez no se pregunta: sale «Te avisaremos en …» y el aviso lleva el mismo `correo`.
- «Cambiar» deja escribir otro, y el siguiente aviso lleva el nuevo.

## Cómo sabemos que está bien

1. Abrir la aplicación con datos de demostración y pulsar «Soporte»: bajo el texto está el campo
   «Tu correo» con su línea de explicación.
2. Escribir un texto, dejar el correo vacío y enviar: sale «Escribe tu correo para avisarte cuando
   esté resuelto.» y el texto sigue en la ventana.
3. Escribir «hola» en el correo y enviar: sale «Ese correo no parece correcto. Revísalo.»
4. Escribir un correo bueno y enviar; cerrar y volver a abrir «Soporte»: ya no está el campo, sale
   «Te avisaremos en» con ese correo y el enlace «Cambiar».
5. Pulsar «Cambiar»: vuelve el campo, con el correo anterior escrito.
6. El botón «Soporte» sigue abajo a la derecha y no tapa ningún botón de la aplicación.
7. `node pruebas/soporte.mjs` termina en verde y su salida nombra los casos del punto 3.
