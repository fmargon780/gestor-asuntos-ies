# «Generar documento» en la ficha del asunto, que lleva al hito (fila 267)

Cerrado con Francisco el 5-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1iNeawuDm6ysWEpwAtGGKYTpLi-GMfbfQ/view?usp=drivesdk).

## Qué pasó

Un compañero abrió un asunto de tipo «Certificado de desempeño de la función tutorial», con tres
hitos y la carpeta vacía, y escribió: «No puedo generar el certificado de funciones tutoriales
desde el asunto». En su captura está en la ficha del asunto y no hay ningún mensaje de error.

No es un fallo. Desde la fila 154, en un asunto con hitos, «Generar documento» solo sale dentro
del hito (la mesa), en su cabecera: «Generar documento ▾». En la ficha no hay ningún botón para
generar, y él lo buscó ahí. Francisco lo ha confirmado: no encontró el botón.

## Qué quiere Francisco

Que desde la ficha se llegue a generar sin tener que saber que hay que abrir el hito. Pero **sin
deshacer la fila 154**: él mismo pidió que se generase en un solo sitio, porque el mismo botón en
tres sitios le confundía. Por eso el botón nuevo **no genera nada en la ficha: solo lleva al hito**.

## Qué hay que hacer

### 1. El botón

- En la ficha del asunto, en la tarjeta «Documentos de la carpeta», en su título, justo a la
  derecha de «+ Añadir documento», un botón **«Generar documento»**.
- Es un botón secundario (no `boton-principal`: el principal de esa tarjeta sigue siendo
  «+ Añadir documento»), del mismo tamaño que su vecino.
- Texto de ayuda al pasar el ratón: «Abre el hito actual, con sus plantillas para generar».
- Se pinta una sola vez por tarjeta, igual que «+ Añadir documento» (`ponerBotonAnadir` en
  `js/ficha-documentos.js`), y sale también con la carpeta vacía.
- Solo en la tarjeta de la ficha. **No** en la tarjeta de documentos de dentro de la mesa del hito:
  ahí ya está «Generar documento ▾» en la cabecera.

### 2. Qué hace al pulsarlo

1. Averigua el hito actual **en el momento de pulsar** (no al pintar: puede haber cambiado). Es el
   mismo que enseña la cabecera de la ficha («Hito N de M · título»): el primer hito sin terminar.
2. Si no hay ninguno sin terminar (todos hechos), usa el **último hito visible** del asunto.
3. Abre la mesa de ese hito, como si se pulsara su título (`HitoMesa.abrir(a, idHito)`), **con el
   desplegable «Generar documento ▾» ya abierto**, como si se hubiera pulsado.

Para el punto 3, la mesa ya recuerda qué desplegable estaba abierto (`panelAbierto` en
`js/hito-mesa.js`, que `engancharPaneles` vuelve a mostrar al pintar). Lo natural es una función
pública nueva y pequeña en `HitoMesa` (por ejemplo `abrirConPanel(a, idHito, 'generar')`) que deje
apuntado el desplegable y llame a `abrir`. Si ves un camino más limpio, úsalo: lo que cuenta es lo
que se ve.

Nada más: el botón no abre ningún cuadro propio, no elige plantilla y no genera. A partir de ahí
todo es lo que la mesa ya hace hoy.

### 3. Cuándo sale

- Solo en un asunto **abierto y con hitos** (la misma condición que hoy esconde los botones de la
  barra de arriba: clase `asunto-con-hitos`, `js/hitos-panel.js`).
- En un asunto **sin hitos** no sale: ahí «Generar documento» sigue en la barra de arriba de la
  ficha, como hoy. No se toca.
- En un asunto del ARCHIVO no sale.
- En modo consulta (el compañero está dentro) y en «solo consultar»: apagado, igual que
  «+ Añadir documento» en esos casos (`js/ficha-consulta.js`).

## Qué NO se toca

- La regla de la fila 154: con hitos, «Comunicar» y «Generar documento» siguen escondidos en la
  barra de arriba de la ficha (`css/hito-mesa.css`).
- No se añade «Comunicar» a la ficha. Solo se ha pedido generar.
- La mesa del hito, sus desplegables y cómo genera: igual que hoy.
- El texto «La carpeta todavía está vacía.» se queda.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md` (la cabecera
  de la mesa y sus desplegables), `docs/contexto/ASUNTOS.md` (apartado «+ Añadir documento») y los
  ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. `js/hito-mesa.js` tiene 509 y
  `js/ficha-documentos.js` 413: en ellos solo entran las líneas de enganche. Si el botón necesita
  más de unas quince líneas, van en un fichero nuevo y pequeño
  (`js/ficha-generar-documento.js`), al que `js/ficha-documentos.js` solo llama.
- Lo nuevo no envuelve nada: se le llama.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Rama `fila-267`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs generar-desde
  documentos-en-un-solo hito-mesa cabecera-del-asunto`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/ficha-documentos.js` (el botón, al lado de «+ Añadir documento»).
- `js/hito-mesa.js` (abrir la mesa con el desplegable «Generar documento ▾» ya abierto).
- `js/ficha-generar-documento.js` (nuevo, solo si hace falta según la regla de arriba; entonces
  también `index.html` y la lista de ficheros de la copia sin internet).
- `js/ficha-consulta.js` (solo si el botón no queda apagado solo en modo consulta).
- `css/ficha-asunto.css` (la separación del botón nuevo, junto a `.ficha-documentos-anadir`).
- `pruebas/generar-desde-la-ficha.mjs` (nueva, con los puntos de abajo);
  `pruebas/documentos-en-un-solo-sitio.mjs` y `pruebas/cabecera-del-asunto.mjs` solo si alguno de
  sus pasos cuenta los botones del título de la tarjeta.
- `js/novedades.js`: «En la ficha de un asunto, junto a «+ Añadir documento», hay un botón
  «Generar documento» que te lleva al hito actual con sus plantillas ya a la vista.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de «Hitos», donde dice que las acciones están
  solo en la mesa, añadir el atajo de la ficha sin alargarla), `docs/contexto/HITO-MESA.md` (donde
  cuenta que con hitos la barra de arriba no enseña «Generar documento»), `docs/contexto/ASUNTOS.md`
  (apartado «+ Añadir documento») y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en la ficha del asunto, junto a «+ Añadir documento», ya sale «Generar
documento», y que lleva al hito actual con el menú abierto. Y la respuesta para quien mandó el
aviso, en una línea: «En la ficha del asunto, en «Documentos de la carpeta», pulsa «Generar
documento»: te lleva al hito, con las plantillas a la vista. Elige ahí el certificado.»

## Cómo sabemos que está bien

Para todos los puntos: un asunto abierto inventado, de un tipo con guía de tres hitos («Tramitar»,
«Firmar», «Entregar») y una plantilla de documento en el tipo, a nombre de una persona inventada
(«Prueba Inventada, Persona»), con la carpeta vacía y el primer hito en curso.

1. En la ficha del asunto, en el título de la tarjeta «Documentos de la carpeta», salen dos
   botones, en este orden: «+ Añadir documento» y «Generar documento». La carpeta está vacía y
   salen igual.
2. Al pulsar «Generar documento» se abre la mesa del hito «Tramitar» (el actual) y el desplegable
   «Generar documento ▾» de su cabecera está abierto, con la plantilla del tipo a la vista, sin
   haber pulsado nada más.
3. Desde ahí, elegir la plantilla genera el documento como siempre, y queda en la carpeta del
   asunto y apuntado al hito «Tramitar».
4. Marcar «Tramitar» como hecho, volver a la ficha y pulsar «Generar documento»: ahora se abre la
   mesa de «Firmar», con su desplegable abierto. (El hito se calcula al pulsar.)
5. Con los tres hitos hechos: «Generar documento» abre la mesa del último hito, «Entregar».
6. Pulsar Escape, o fuera, cierra el desplegable como siempre. Volver a la ficha y entrar en el
   hito pulsando su título abre la mesa **sin** el desplegable abierto.
7. En un asunto abierto **sin** hitos: en la tarjeta de documentos solo sale «+ Añadir documento»,
   y «Generar documento» sigue en la barra de arriba de la ficha, como antes.
8. En un asunto **con** hitos, la barra de arriba de la ficha sigue sin «Generar documento» ni
   «Comunicar» (fila 154).
9. Dentro de la mesa de un hito, la tarjeta de documentos no lleva el botón nuevo.
10. En la ficha de un asunto del ARCHIVO, el botón no sale. En modo consulta y en «solo consultar»,
    no sale o está apagado, y pulsarlo no abre nada.
11. Repintar la ficha (por ejemplo, añadir un documento) no duplica el botón: sigue habiendo uno.
