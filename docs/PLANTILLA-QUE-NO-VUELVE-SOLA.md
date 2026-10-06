# La plantilla del cuadro de Correo y de Séneca no vuelve sola (fila 271)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/19lzuDx0FrWZr2xh9Q7rjuN-SrFQ7Tfru/view?usp=drivesdk).

## Qué pasó

Francisco abrió «Mensaje por Séneca» desde un hito de un asunto de tipo «CERTIFICADO C.E» y
escribió: «No me deja cambiar de plantilla en este hito. No sé si es algo general. Sale una por
defecto, lo cambio, pero vuelve a la que tiene por defecto».

En su captura el desplegable «Plantilla» tiene tres opciones («Sin plantilla», «Aviso de avance»,
«Aviso de cierre»), está puesta «Aviso de avance» y el texto dice «Va por el hito de :.», sin el
nombre del hito.

Hay tres fallos distintos, y es general (todos los hitos, y los dos cuadros):

1. **«Sin plantilla» no se queda.** En `bloqueCuerpo` de `js/seneca-cuadro.js` (línea 103) y de
   `js/correo-cuadro.js` (línea 240) está
   `if (!plantillaElegida && opciones.length) plantillaElegida = opciones[0].id;`.
   Esa línea servía para elegir la plantilla de entrada, pero se ejecuta en cada repintado: al
   elegir «Sin plantilla» (valor vacío) vuelve a poner la primera de la lista. Comprobado leyendo
   el código.
2. **La plantilla de entrada es la que no toca.** Desde la fila 195, las plantillas sin tipo
   («Aviso de avance», «Aviso de cierre») valen para cualquier asunto (`Plantillas.deTipo`,
   `js/plantillas.js`). En un tipo sin plantilla propia son las únicas de la lista, así que el
   cuadro se abre con «Aviso de avance», que está pensada para «Enviar estado». Y en un tipo con
   plantilla propia puede pasar lo mismo si las dos de aviso están antes en `plantillas.json`.
3. **El nombre del hito sale vacío.** `HitosComunicar.comunicar` (`js/hitos-comunicar.js`) abre el
   cuadro con `comunicarHito`, pero no pasa `hito`. Sin `extra.hito`, `I.hitoActual` es `null`
   (`js/correo.js`, línea 239) y `{{HITO}}`, `{{HITON}}` y `{{HITOSM}}` se quedan en blanco.

**Sin confirmar:** Francisco dice «lo cambio», sin decir a cuál. Por el código, elegir «Aviso de
cierre» debería quedarse. Hay que probarlo (apartado 4).

## Qué hay que hacer

### 1. «Sin plantilla» se queda elegida

En los dos cuadros hay que distinguir «todavía no se ha decidido» de «se ha elegido Sin plantilla».
Lo natural: al abrir el cuadro (`cuerpoHtml`), `plantillaElegida = null`; la plantilla de entrada
se calcula solo cuando vale `null`; a partir de ahí, `''` es «Sin plantilla» y se respeta en todos
los repintados. Si ves un camino más limpio, úsalo: lo que cuenta es lo que se ve.

Se conserva lo que ya hay: si la plantilla elegida deja de estar en la lista, pasa a «Sin
plantilla»; y la confirmación en línea «Lo que hay escrito en el texto se perderá» sigue igual.

### 2. Con qué plantilla se abre el cuadro

Una sola regla, la misma para Correo y para Séneca, en este orden:

1. La plantilla que trae quien abre el cuadro (`I.plantillaPedida`: «Enviar estado», el aviso al
   terminar un hito, el aviso al archivar, la receta de una tarea), si está en la lista. Como hoy.
2. Si no, la primera plantilla **propia del tipo** (las que tienen `tipo`), en el orden de la lista.
3. Si no hay ninguna propia del tipo: **«Sin plantilla»**.

Las plantillas sin tipo («Aviso de avance», «Aviso de cierre») nunca salen puestas solas. Siguen
en el desplegable, para elegirlas a mano.

La regla va en **una función compartida en `js/correo.js`** (`window.CorreoNucleo`, por ejemplo
`plantillaDeEntrada(a, opciones)`), a la que llaman los dos cuadros. No se duplica en cada uno.

### 3. El hito sale relleno

- `HitosComunicar.comunicar` pasa también `extra.hito = hito`.
- Si el cuadro se abre sin hito (desde la ficha, o al archivar), `abrirCuadro` usa el hito actual
  del asunto (el mismo de «Hito N de M» de la ficha; mira `Hitos.hitoActualDeAsunto`,
  `js/hitos-a-quien.js`, y `hitoActualDe` en `js/avisos-lo-pide.js`). Comprueba antes que lo que
  devuelve lleva `id` y `titulo`, que es lo que necesita `Plantillas.valoresDeAsunto`.
- `I.hitoActual` hoy solo se usa para calcular los valores de los huecos. Compruébalo antes de
  tocarlo. `{{LO QUE FALTA}}` no cambia: `cuerpoDelMedio` ya lo pisa con `loQueFaltaActual`.
- En un asunto sin ningún hito, el hueco sigue quedando vacío, como hoy. No se toca.

### 4. Probar «Aviso de cierre»

Con el arreglo hecho, en la copia de pruebas: abre el cuadro de Séneca y el de Correo desde un
hito de un tipo sin plantilla propia, y elige una tras otra las tres opciones. Cada una tiene que
quedarse en el desplegable y cambiar el texto. Si alguna no se queda, búscale la causa y arréglala
en esta misma fila, y déjalo dicho en la nota de la fila.

## Qué NO se toca

- «Enviar estado», el aviso al terminar un hito y el aviso al archivar: se siguen abriendo con su
  plantilla.
- Un hito con texto propio de comunicación (`medioListo`): sigue saliendo ese texto.
- La lista del desplegable y su orden. «Editar plantilla» y «Crear plantilla».
- Los textos de las plantillas «Aviso de avance» y «Aviso de cierre».
- No hay textos de pantalla nuevos.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/CORREO-Y-SENECA.md` y los
  ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- **`js/correo-cuadro.js` tiene 600 líneas justas**, el tope. No puede ganar ni una: lo que entre
  tiene que sustituir a lo que sale (por eso la regla va en `js/correo.js`, que tiene 418).
  `js/seneca-cuadro.js` tiene 311 y `js/hitos-comunicar.js` 247.
- Lo nuevo no envuelve nada: se le llama.
- Rama `fila-271`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs plantilla
  avisos-a-quien seneca-cuadro correos comunicar`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/correo.js` (la regla compartida de la plantilla de entrada; el hito actual cuando el cuadro
  se abre sin hito).
- `js/seneca-cuadro.js` y `js/correo-cuadro.js` (`cuerpoHtml` y `bloqueCuerpo`: «Sin plantilla»
  se respeta, y la plantilla de entrada sale de la regla compartida).
- `js/hitos-comunicar.js` (`comunicar` pasa `hito`).
- `pruebas/plantilla-que-no-vuelve.mjs` (nueva, con los puntos de abajo).
- `pruebas/plantillas.mjs` (su paso «sale puesta la primera»: sigue valiendo si sus plantillas son
  propias del tipo; ajústalo solo si no lo son) y `pruebas/avisos-a-quien-lo-pide.mjs` (solo si
  alguno de sus pasos da por hecho que «Aviso de avance» sale puesta sin pedirla).
- `js/novedades.js`: «En el cuadro de Correo y en el de Séneca ya puedes elegir «Sin plantilla» y
  se queda. Si el tipo de asunto no tiene plantilla propia, el cuadro se abre sin plantilla.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de «Plantillas de correo», sustituyendo, sin
  alargarla), `docs/contexto/CORREO-Y-SENECA.md` (con qué plantilla se abre el cuadro) y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que «Sin plantilla» ya se queda elegida, que un tipo sin plantilla propia abre el
cuadro sin plantilla, y que el nombre del hito ya sale en «Aviso de avance». Y si «Aviso de
cierre» fallaba o no, en una frase.

## Cómo sabemos que está bien

Para todos los puntos: un asunto abierto inventado, a nombre de una persona inventada («Prueba
Inventada, Persona»), con «Lo pide» con correo, de un tipo **sin ninguna plantilla de correo
propia** y con una guía de dos hitos («Tramitar», «Entregar»), el primero en curso. Y un segundo
asunto de un tipo que **sí** tiene una plantilla de correo propia («Plantilla del tipo»).

1. En el primer asunto, abrir el hito «Tramitar» y pulsar «Comunicar ▾» → Séneca. El desplegable
   «Plantilla» está en «Sin plantilla», y el texto lleva solo el saludo y la firma.
2. En ese desplegable siguen «Aviso de avance» y «Aviso de cierre».
3. Elegir «Aviso de avance»: se queda puesta y el texto dice «Va por el hito de Tramitar», con el
   nombre del hito. No queda ningún «de :.» vacío.
4. Elegir «Aviso de cierre»: se queda puesta y el texto cambia al de esa plantilla.
5. Elegir «Sin plantilla»: se queda puesta y el texto vuelve al saludo y la firma. No vuelve sola
   a «Aviso de avance».
6. Los puntos 1 a 5, iguales con «Comunicar ▾» → Correo.
7. Escribir algo a mano en el texto y cambiar de plantilla: sale «Lo que hay escrito en el texto
   se perderá», con «Cambiar de todas formas» y «Seguir con lo escrito», como antes. «Seguir con lo
   escrito» deja el desplegable en la que estaba.
8. En el segundo asunto, abrir el cuadro de Correo y el de Séneca: sale puesta «Plantilla del
   tipo», no «Aviso de avance».
9. «Enviar estado» (en «El encargo» de la ficha del primer asunto): el cuadro se abre con «Aviso de
   avance» puesta y el nombre del hito actual relleno, como antes.
10. Marcar como hecho un hito que tiene la casilla de avisar «al terminar»: el cuadro sale con su
    plantilla puesta, como antes.
11. Cerrar el cuadro y volver a abrirlo: empieza otra vez por la regla del apartado 2, sin
    recordar lo elegido la vez anterior.
