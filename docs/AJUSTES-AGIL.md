# Ajustes ágiles: encontrar y crear tipos sin scroll

Instrucción para Claude Code. Apuntada el 11 de septiembre de 2026.
Diseño cerrado y confirmado por Francisco ese mismo día.

Lee antes `docs/CONTEXTO.md`.

---

## El problema, con sus palabras

> "Estoy teniendo muchos problemas para manejarme en Ajustes a la hora de crear tipos.
> Aunque me pide que elija a qué tipo de tercero asociar el tipo de asunto, debajo me
> aparecen todos los tipos de asuntos empezando por el alumnado, de modo que tengo que
> hacer un scroll-down casi infinito para ver qué tipos existen y no duplicar."

Y, sobre el acceso a la pantalla:

> "El botón de Ajustes en el panel lateral no esté debajo del todo, porque si hay mucho
> desplegado, me tengo que desplazar mucho hacia abajo."

Son dos cosas distintas y las dos entran en esta instrucción.

---

## Parte A · El bloque "Tipos de asunto" de Ajustes

Toca `index.html`, `js/ajustes.js` y `css/ajustes.css`.

### A1. La lista obedece a la categoría elegida

Hoy `#tabla-tipos` pinta los tipos de las cuatro categorías, uno detrás de otro.
A partir de ahora **se ve una sola categoría cada vez**.

- La categoría que se ve es la del desplegable `#nueva-categoria`.
- Al cambiar el desplegable, la lista de abajo cambia con él, sin recargar nada.
- Se recuerda la última categoría mirada en `localStorage`, clave `gestor-ajustes-categoria`.
  De partida, ALUMNADO.

### A2. Cuatro pestañas encima de la lista

Fila de pestañas: **ALUMNADO · PERSONAL · EMPRESAS · OTROS**.
Cada una lleva al lado el número de tipos que tiene, en un círculo suave.

- Pulsar una pestaña cambia la lista **y también el desplegable** `#nueva-categoria`.
- Cambiar el desplegable marca la pestaña que toca.
  Los dos mandos están siempre de acuerdo; da igual cuál se use.
- Una categoría sin ningún tipo sale igualmente, con un 0, y su lista dice
  "Todavía no hay ningún tipo en esta categoría".

### A3. Un buscador que mira en las cuatro categorías

Campo nuevo a la derecha de las pestañas, con el texto de ayuda
"Buscar un tipo en todas las categorías".

- Con dos letras o más, la lista pasa a enseñar **las coincidencias de las cuatro
  categorías**, no solo la de la pestaña.
- Se compara sin mayúsculas y sin tildes, y vale que coincida un trozo por dentro
  ("MATR" encuentra "CERT. MATRICULA").
- Cada resultado lleva su categoría escrita en una etiqueta pequeña al lado del nombre.
- Mientras se busca, las pestañas se quedan apagadas y arriba sale
  "Buscando en todas las categorías · 3 resultados".
- Al vaciar el campo se vuelve a la categoría que estuviera marcada.

Este buscador es el que evita duplicar: enseña el tipo aunque esté colgado de otra categoría.

### A4. Aviso en vivo al escribir el nombre nuevo

Debajo de `#nuevo-tipo`, mientras se escribe:

- **Si el nombre ya existe** (mismo hueso, según `U.dejaCrear` y `U.parecidos` de
  `js/util.js`): línea roja "Ya existe: CERTIFICADO, en ALUMNADO", y el botón **Añadir
  se queda apagado**. Junto al aviso, un enlace "Verlo" que lleva a ese tipo: cambia la
  categoría y le da un destello de fondo a su casilla durante un segundo.
- **Si solo se parece** (errata de una o dos letras, o un nombre que contiene a otro):
  línea ámbar "Se parece a: CERTIFICADO (ALUMNADO), CERT. MATRICULA (ALUMNADO)", y el
  botón Añadir **sigue encendido**. Es un aviso, no una prohibición.
- Con el campo vacío o sin parecidos, no sale ninguna línea y el botón está encendido.

No se inventa una comparación nueva: se llama a la que ya vive en `js/util.js`.

### A5. Los tipos en rejilla, no en renglones

Hoy cada tipo es una fila de lado a lado, con mucho hueco en medio. Pasa a ser una rejilla.

- `display: grid` con `repeat(auto-fill, minmax(300px, 1fr))` y hueco de 10 píxeles.
  En el monitor del trabajo salen tres columnas; en el Chromebook, dos; estrecho, una.
- Cada casilla lleva: **el nombre** en negrita, debajo el campo de los días de plazo con
  su rótulo pequeño, y a la derecha un botón de tres puntos.
- El botón de tres puntos abre un menú con **Campos**, **Cambiar el nombre** y **Quitar**.
  Se cierra al elegir, al pulsar fuera o con Escape. Quitar sigue pidiendo confirmación.
- La casilla es alta y compacta: unos 64 píxeles, sin párrafos dentro.

Con esto una categoría de cuarenta tipos se ve entera, o casi, sin bajar.

### A6. Ajustes aprovecha el ancho

En `css/vista.css`, la pantalla de Ajustes tiene hoy un tope de 1040 píxeles.

- Se sube el tope a **1600 píxeles**.
- El título de la cabecera y el cuerpo de los bloques **terminan en el mismo borde
  derecho**: mismo ancho y mismo relleno lateral. Hoy no cuadran y se nota.
- Los párrafos de explicación de cada bloque se quedan a 90 caracteres de ancho como
  mucho, para que se sigan leyendo bien aunque el bloque sea ancho.

Nuevo asunto conserva su tope de 940. Solo cambia Ajustes.

### A7. Lo mismo, en pequeño, para los otros dos bloques

Los bloques **Tipos de documento** y **Estados del asunto** no llevan categorías, pero sí
sufren lo mismo cuando la lista crece:

- Los dos pasan a la misma rejilla de A5, con su menú de tres puntos.
- Los dos llevan el aviso en vivo de A4 debajo de su campo de alta.
- **Los estados no se tocan en el orden**: siguen con sus flechas de subir y bajar, y su
  orden sigue siendo el del trámite. En rejilla, las flechas mueven el sitio en la
  secuencia, no la columna.

**Campos propios** y **Asuntos que se repiten** se quedan como están.

---

## Parte B · Llegar a Ajustes sin bajar la página

Toca `index.html`, `css/estilos.css`, `css/barra.css` y, si hace falta, `js/salir.js`.

### B1. La barra de la izquierda se queda quieta

La barra se desplaza hoy con la página. Cuando la pantalla es larga —Ajustes con los
bloques abiertos— hay que bajar del todo para ver su pie.

- `.lateral` pasa a quedarse fija en pantalla: pegada arriba, con la altura de la ventana,
  y con su propio desplazamiento por dentro si algún día no cupiera.
- El contenido de la derecha se desplaza solo.

### B2. Ajustes sube con las demás pantallas

- La pestaña **Ajustes** sale de `.lateral-pie` y pasa a ir en la lista de pestañas,
  justo después de **Personas y empresas**, separada de ella por una línea fina.
- En `.lateral-pie` se quedan solo el nombre de quien ha entrado y el botón **Salir**.
- Comprobar que `js/salir.js` sigue colocando su botón donde debe: mete el botón en
  `.lateral-pie` y ese elemento no desaparece.

### B3. Con la barra plegada, Ajustes también está a mano

Plegada, la barra esconde todas las pestañas y solo deja el botón de las tres rayas.
Para ir a Ajustes hay que abrirla primero.

- Debajo del botón de las tres rayas sale ahora un **icono de rueda dentada** que lleva
  directamente a Ajustes. Solo se ve con la barra plegada.
- Su título al pasar por encima es "Ajustes".
- Lo pone `js/barra.js`, junto al botón de las tres rayas.

---

## Pruebas

Fichero nuevo `pruebas/ajustes-agil.mjs`, con Playwright y el disco de mentira de las
demás pruebas. **Ancho de ventana 1905 píxeles**, el del monitor del trabajo. Comprueba:

1. Con ALUMNADO en el desplegable, en la lista **no hay ningún tipo de PERSONAL**.
2. Al cambiar el desplegable a PERSONAL, la lista cambia y la pestaña PERSONAL queda marcada.
3. Al pulsar la pestaña EMPRESAS, el desplegable pasa a EMPRESAS.
4. Escribiendo en el buscador dos letras que solo estén en otra categoría, el tipo sale,
   con su categoría al lado.
5. Escribiendo en `#nuevo-tipo` el nombre exacto de un tipo que ya existe, el botón Añadir
   se queda apagado y sale la línea roja con la categoría.
6. Escribiendo un nombre parecido pero no igual, sale la línea ámbar y el botón sigue encendido.
7. Con veinte tipos en una categoría, las casillas se pintan en **tres columnas**
   (comparar la coordenada de arriba de la primera, la segunda y la tercera: la misma).
8. La pestaña **Ajustes** de la barra **se ve sin desplazar la página** con los once bloques
   de Ajustes abiertos: su posición en pantalla está dentro de la ventana.
9. Con la barra plegada, el icono de la rueda dentada existe y al pulsarlo se llega a Ajustes.

Y como siempre: comprobar que la prueba **falla** antes del arreglo.

---

## Al terminar

- Subir `App.VERSION` con la fecha y la hora de España.
- Actualizar `docs/CONTEXTO.md`: la sección 5 con lo de Ajustes y la barra, y la tabla de
  ficheros con la prueba nueva.
- Marcar esta instrucción **HECHA** en `docs/COLA.md`.
