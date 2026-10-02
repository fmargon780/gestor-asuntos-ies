# Campos: el arreglo, la tarjeta «Campos del asunto» y la ventana ancha (fila 254)

Diseñado con Francisco el 2-oct-2026 en Cowork, a partir de su aviso de soporte (versión de la
app `01-oct-2026 · 19:03`):
https://drive.google.com/file/d/1pRIMWf5JQn_6tTS0JI2DgCE2MFKkek45/view?usp=drivesdk

El aviso traía cuatro cosas. Esta fila hace tres. La cuarta (campos de un hito) es la fila 255,
`docs/CAMPOS-DE-UN-HITO.md`, que va después de esta.

## Qué quiere Francisco

1. Que añadir un campo desde la ficha de un asunto **funcione**: hoy la ventana se abre, pero al
   elegir o crear el campo y aceptar, no se añade nada y no sale ningún aviso.
2. Que se encuentre: la tarjeta de la ficha donde viven los campos se llama hoy «Datos del
   trámite» y el botón no está a la vista. Le costó dar con él.
3. Que la ventana de ver, buscar y elegir campos sea **ancha**, en columnas, y no estrecha y larga.

## Antes de empezar

- Lee `docs/CONTEXTO.md` y `docs/contexto/CAMPOS-Y-TIPOS.md` (el párrafo «Desde un asunto abierto
  (fila 245)» y «Los campos de cada tipo de asunto»). Como referencia, `docs/CAMPO-DESDE-EL-ASUNTO.md`.
  **No leas el repositorio entero**, ni `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` entero: busca
  con `grep` el texto «Datos del trámite» y las clases del panel.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (`docs/CONTEXTO-CORTO.md`, §6).
- Método de la fila 242 (`docs/REVISOR-EN-LOCAL.md`): rama `fila-254`, revisor en local, y con su
  APROBADA a `main`, sin esperar a Francisco y sin dejar nada en una petición de cambios en
  borrador. Una sola publicación de código.
- Una sola pasada completa de pruebas al final; mientras tanto, solo las de lo tocado.

## 1. El arreglo: al aceptar, el campo se añade

Lo que cuenta Francisco, confirmado en la conversación de diseño: en la ficha de un asunto abierto
pulsa «+ Añadir campo», **la ventana se abre**, elige o crea el campo, acepta, y **no pasa nada**:
ni campo en la ficha, ni aviso verde, ni aviso rojo.

- **Reprodúcelo antes de tocar nada**, en local con los datos de demostración, mirando la consola.
  `pruebas/campo-desde-el-asunto.mjs` pasó en la fila 245; si sigue en verde, es que no recorre el
  camino que falla. Después de la 245 han tocado este camino las filas 244 (clases de campo: el
  paso del valor usa `CamposClases`), 250 y 251 (se quitó «Añadir al nombre»): mira primero ahí.
- Recorre todas las combinaciones, no solo la primera que funcione:
  - campo de fichero, calculado, propio ya existente y propio **creado ahí mismo** (pestaña «Míos»);
  - cada clase de campo propio: texto, lista, importe, número y fecha, con valor y con el valor vacío;
  - «En el tipo» y «Solo en este asunto»;
  - un tipo que todavía no tiene ningún campo configurado (sin entrada en `porTipo`), un
    `campos.json` sin la clave `porTipo`, y una ficha sin `campos`;
  - un asunto sin tipo;
  - el paso del valor seguido de «¿Dónde se guarda?»: la regla es un solo cuadro (`U.preguntar`) a
    la vez; comprueba que el segundo no se pierde por abrirse con el primero todavía vivo.
- Arregla la causa, no el síntoma.
- **Un fallo aquí nunca más puede quedar en silencio.** Todo el camino desde «Aceptar» hasta el
  guardado va protegido: si algo falla, aviso rojo (`U.fallo`) con `U.mensajeDeError`, y el campo
  no se da por añadido. Principal y accesorio por separado, como siempre.
- **Si no consigues reproducirlo**: no des el arreglo por hecho. Deja puesta la protección del
  punto anterior (así la próxima vez el aviso dirá qué ha fallado), añade a
  `docs/COMPROBAR-A-MANO.md` un punto para Francisco («añadir un campo desde la ficha de un asunto
  real y decir qué aviso sale»), y cuéntalo en el mensaje final.

## 2. La tarjeta se llama «Campos del asunto», con el botón a la vista

- En la ficha del asunto, la tarjeta «Datos del trámite» pasa a llamarse **«Campos del asunto»**:
  la misma palabra que el botón («+ Añadir campo») y que Ajustes («Campos»). Cámbialo en todos los
  sitios donde la pantalla nombre esa tarjeta (título, pestaña, textos de ayuda, novedades), y en
  `docs/VOCABULARIO.md`.
- No se toca el bloque «Datos del asunto» de Nuevo asunto ni el cuadro «Cambiar el asunto».
- **«+ Añadir campo» queda siempre a la vista en el título de la tarjeta**, en la ficha normal, sin
  tener que abrir la tarjeta en grande ni desplegar nada. Al pulsarlo no se abre ni se cierra la
  tarjeta: solo se abre la ventana de elegir campo.
- Sigue sin salir en modo consulta ni en el ARCHIVO. En un asunto sin ningún campo, la tarjeta
  sale igualmente, con el botón.

## 3. La ventana de elegir campo, ancha

Es el panel de `js/campos-catalogo.js`, el mismo que se abre desde Ajustes → un tipo → «+ Añadir
campo» y desde la ficha. Al ser el mismo, cambia en los dos sitios.

- **Ancho**: casi todo el ancho de la pantalla (del orden de `min(1400px, 94vw)`).
- **Arriba**, en una sola franja: el buscador y las pestañas de siempre (de fichero, calculados,
  «Míos»). No se quita ni se añade ninguna.
- **Debajo, los campos en columnas**: una rejilla (del orden de `repeat(auto-fill, minmax(260px,
  1fr))`), **una línea por campo**: el nombre y, en pequeño y en la misma línea, lo que hoy lo
  acompaña (de dónde viene, su clase). Un nombre largo se corta con puntos suspensivos y se ve
  entero al pasar el ratón.
- A 1280 px de ancho salen **tres columnas o más**; a 1905 px, cuatro o más. Por debajo de 700 px,
  una sola columna.
- La ventana no pasa del alto de la pantalla: si los campos no caben, se desplaza **solo la
  rejilla**, con el buscador y las pestañas quietos arriba.
- Sin huecos vacíos a los lados: título, buscador, pestañas y rejilla terminan en el mismo borde.
- El buscador sigue filtrando al escribir, en todas las columnas.
- Lo que hay dentro de «Míos» para crear, cambiar o borrar un campo propio sigue funcionando igual;
  si su formulario queda perdido en una ventana tan ancha, que no pase de unos 700 px de ancho.
- El paso del valor y «¿Dónde se guarda?» no cambian de tamaño.

## Ficheros

- `js/campo-desde-el-asunto.js`: el arreglo, la protección contra fallos en silencio y el botón en
  el título de la tarjeta.
- `js/campos-catalogo.js`: la ventana ancha (clases nuevas en el panel) y el arreglo, si la causa
  está ahí.
- `js/donde-se-guarda.js` y `js/campos-clases.js`: **solo** si la causa del fallo está en ellos.
- El fichero de la ficha que pinta la tarjeta «Datos del trámite» (búscalo con `grep` por ese
  texto): el nombre nuevo y el sitio del botón.
- La hoja de estilos donde viven hoy los del panel de campos (búscala por su clase): la rejilla y
  el ancho. Nada de estilos escritos en el JavaScript.
- `docs/VOCABULARIO.md`: «Campos del asunto».
- `js/novedades.js` (regla 21 de la cola), en el mismo commit del código: una línea, por ejemplo
  «Los campos de un asunto: la tarjeta se llama ahora «Campos del asunto», con «+ Añadir campo»
  siempre a la vista, y la ventana para elegirlos es ancha.»
- Pruebas: ampliar `pruebas/campo-desde-el-asunto.mjs` con el caso que fallaba y con los puntos de
  abajo; poner al día las que busquen el texto «Datos del trámite»; pasar `pruebas/campos.mjs` y
  `pruebas/ajustes-por-tipo.mjs`.
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, la línea de campos, **sustituyendo**),
  `docs/contexto/CAMPOS-Y-TIPOS.md` (el párrafo de la fila 245, sustituyendo), `docs/HISTORIA.md`
  (qué causaba el fallo) y `docs/COLA.md`.
- Si algún fichero de `js/` que toques pasa de 600 líneas, pártelo por temas (§6 del contexto corto).

## Qué dirá Claude Code a Francisco al terminar

Qué causaba el fallo, en una frase y sin jerga. Y qué va a ver: la tarjeta «Campos del asunto» con
«+ Añadir campo» a la vista, y la ventana de elegir campo, ancha y en columnas, también en Ajustes.

## Cómo sabemos que está bien

1. Abrir un asunto abierto. En la ficha hay una tarjeta «Campos del asunto» y en ningún sitio de
   la pantalla pone «Datos del trámite». «+ Añadir campo» se ve en el título de la tarjeta sin
   abrirla.
2. Pulsar «+ Añadir campo», elegir un campo de fichero, escribir un valor, aceptar y elegir «En el
   tipo»: sale el aviso verde con «Deshacer» y el campo está en la ficha con su valor.
3. Lo mismo con un campo propio **creado en ese momento** desde «Míos», de clase Importe, con
   `125,50`: queda en la ficha como `125,50 €`.
4. Lo mismo con «Solo en este asunto»: sale en la ficha con «solo aquí».
5. Lo mismo en un asunto de un tipo que no tenía ningún campo configurado: se añade.
6. Aceptar con el valor vacío: el campo se añade, vacío, sin error.
7. Con el guardado forzado a fallar (en la prueba): sale un aviso rojo que dice qué ha fallado, y
   el campo no aparece en la ficha. Nunca «no pasa nada».
8. La ventana de elegir campo, a 1280 px de ancho: ocupa casi todo el ancho, con el buscador y las
   pestañas arriba y los campos en tres columnas o más, una línea por campo. Con muchos campos, se
   desplaza solo la rejilla.
9. Escribir en el buscador: quedan solo los campos que casan, en las columnas.
10. Ajustes → un tipo → Campos → «+ Añadir campo»: la misma ventana ancha; añadir un campo desde
    ahí sigue funcionando y se guarda solo, como antes.
11. En un asunto del ARCHIVO y en modo consulta, no sale «+ Añadir campo».
12. [SOLO FRANCISCO] En un asunto real del centro, añadir un campo desde la ficha: se añade.
