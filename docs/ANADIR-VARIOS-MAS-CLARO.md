# «Añadir varios relacionados», más claro

Fila 338 de `docs/COLA.md`. Diseñada con Francisco el 13-oct-2026 a partir de un aviso del
botón de soporte (pantalla «Ficha de un asunto», copia sin internet, perfil Administración;
aviso completo:
https://drive.google.com/file/d/1xe9hXvhBsu4So47_KkMCCEwWO5Q2ywHo/view?usp=drivesdk).

## De dónde sale esto

El aviso dice: «En esta ventana no tengo la opción de cancelar la acción. Además sería bueno
hacer una revisión sobre la usabilidad intuitiva de la misma.» La captura enseña el cuadro
«Añadir varios relacionados» (`abrirAnadirRelacionados`, `js/relacionados.js`) con el atajo
«Por datos del alumnado» puesto (Centro de procedencia = un CEIP, «Salen 42»), la pestaña
ALUMNADO, «28 señalados», el botón «Añadir los 28 señalados», los nombres con su ×, y abajo el
botón «Añadirlos» del atajo.

Lo que pasa de verdad:

- **«Cancelar» existe** (`#cuadro-cancelar`, en el pie del cuadro común de `index.html`), pero
  con tantos bloques el cuadro crece más que la pantalla y el pie queda fuera de la vista. Para
  quien lo usa, no hay manera de salir.
- **Dos botones que parecen hacer lo mismo.** «Añadirlos» (`#bd-grupo-anadir`,
  `js/alumnado-bd-ver.js`) solo SEÑALA a los que salen; «Añadir los N señalados»
  (`#rel-marcados-anadir`, `App.pintarBuscadorDeTercero` en `js/asuntos-nuevo-alta.js`) es el
  que de verdad los mete en el asunto.
- **La barra de señalados está en medio**, entre las opciones de búsqueda.
- **El orden de arriba confunde**: los atajos de alumnado salen encima de las pestañas de
  categoría, aunque solo aparecen al elegir ALUMNADO, así que la ventana cambia de forma por
  encima de lo que se acaba de pulsar.

## Lo que se pide

### 1. Salir sin añadir

- «Cancelar», la ✕ de arriba del cuadro (si el cuadro común no la tiene, se le pone en este
  modo) y la tecla Esc cierran el cuadro sin añadir nada (`resolverUnaVez(null)`, como hoy).
- **Si hay al menos una persona señalada**, antes de cerrar se pregunta, en el mismo cuadro o
  con `U.preguntar` (uno a la vez, regla de `CONTEXTO-CORTO`): «¿Descartar los N señalados?»,
  con «Descartar» (cierra) y «Seguir eligiendo» (vuelve a la ventana con todo como estaba:
  señalados, pestaña, búsqueda y filtros). Con «1 señalado» en singular.
- Sin nadie señalado, cierra sin preguntar.
- Ojo con `js/usabilidad.js` (la tecla Escape busca `#cuadro-cancelar`): que Esc pase por la
  misma pregunta, no que la salte. Una sola pregunta, nunca dos cuadros.
- Los `marcadosIniciales` (por ejemplo, los miembros de un grupo que se está editando en
  Ajustes) **no cuentan como cambios**: si lo señalado es igual que lo que entró, se cierra sin
  preguntar. Solo se pregunta si hay algo señalado que se perdería.

### 2. El pie, siempre a la vista

- El cuadro en este modo se reparte así: cabecera (título y ✕) fija arriba; cuerpo con todas las
  formas de elegir, que se desplaza; pie fijo abajo. Igual que `.cuadro-correo` en
  `css/correo.css`, que ya hace lo mismo: el cuadro cabe en la pantalla y solo el cuerpo crece.
- El pie lleva, de arriba abajo:
  - «N señalados» y la lista de nombres, cada uno con su × (lo de hoy de
    `#rel-marcados-barra`, movido aquí). La lista de nombres tiene alto máximo (unas tres líneas)
    y se desplaza ella sola si hay muchos; el pie no crece sin límite.
  - En una fila, a la derecha: «Cancelar» y el botón principal.
- Sin nadie señalado, el pie enseña solo «Cancelar» y el botón principal apagado (o «Nadie
  señalado todavía» en gris en el sitio de la cuenta).
- El botón «Aceptar» del cuadro común sigue oculto en este modo, como hoy.
- Ancho: el de hoy o más, nunca más estrecho; el pie ocupa todo el ancho del cuadro.

### 3. Nombres de botones que dicen lo que hacen

- El botón «Añadirlos» del atajo «Por datos del alumnado» pasa a «Señalar los N» (con el número
  de los que salen; «Señalar 1» si es uno; apagado si no sale nadie, como hoy).
- Si los otros atajos de alumnado (unidad, nivel, enseñanza) o «Meter un grupo entero» tienen
  un botón con «Añadir…» que solo señala, se renombra igual: «Señalar los N». Si señalan al
  elegir, sin botón, se quedan como están.
- El botón principal del cuadro abierto desde un asunto («Añadir varios relacionados» de la ficha
  y de la mesa) pasa de «Añadir los N señalados» a **«Añadir al asunto los N»** («Añadir al
  asunto 1» si es uno).
- Donde quien abre el cuadro ya da su propio texto (`opc.textoBoton`: actividades, grupos de
  Ajustes, asunto de grupo «Usar los N señalados»…), se respeta ese texto. Solo cambia el texto por
  defecto y el de los relacionados de un asunto.
- Comprobar en `docs/VOCABULARIO.md` que «señalar» es la palabra para esto; si no está, añadirla.

### 4. El orden de arriba

De arriba abajo, en el cuerpo:

1. Las pestañas de categoría (Alumnado, Tutores legales, Personal, Empresas, Otros,
   Administraciones).
2. El buscador por nombre («Escribe dos letras del nombre») y sus resultados con casillas.
3. Solo con ALUMNADO elegido: los atajos de alumnado (toda una unidad, todo un nivel, toda una
   enseñanza y «Por datos del alumnado»), en un bloque con su rótulo («Señalar alumnado por…»).
4. Al final, «Meter un grupo entero» y «Pegar una lista».

Al cambiar de pestaña, el bloque 3 aparece o desaparece debajo de lo pulsado, nunca encima.

### Dónde llega

El cuadro es uno (`abrirAnadirRelacionados` + `App.pintarBuscadorDeTercero` con
`multiple`): los puntos 1 y 2 llegan a todos los sitios que lo abren (relacionados del asunto,
actividades, grupos de Ajustes, asunto de grupo). Los puntos 3 y 4, también, respetando el
`textoBoton` propio de cada sitio. Nada cambia en el modo de elegir un solo tercero (sin
`multiple`).

## Qué ficheros tocar

- `js/relacionados.js` (`abrirAnadirRelacionados`, `pintarAtajosDeAlumnado`,
  `pintarGrupoFila`): orden de los bloques, pie fijo, pregunta al cancelar.
- `js/asuntos-nuevo-alta.js` (`App.pintarBuscadorDeTercero`): la barra de señalados se pinta en
  el sitio que le diga quien llama (opción nueva, por ejemplo `opciones.sitioBarra`), sin
  cambiar nada para quien no la pase. El texto por defecto del botón no cambia aquí si otros
  sitios dependen de él: el «Añadir al asunto los N» lo pasa `js/relacionados.js` como
  `textoBoton` cuando el cuadro viene de un asunto.
- `js/alumnado-bd-ver.js`: «Añadirlos» → «Señalar los N».
- `js/usabilidad.js`: Esc por la misma pregunta.
- CSS del cuadro en este modo (en `css/relacionados.css`), como `.cuadro-correo`.
- Si algún fichero pasa de 600 líneas, se parte por temas (regla de `CONTEXTO-CORTO`).
- Línea en `js/novedades.js` (cambia algo visible).

## Reglas de trabajo

Las de siempre de `docs/COLA.md` y `CLAUDE.md`: rama `fila-338`, revisor en local, publicación
a propósito una vez, HECHA solo con las dos cosas. Un módulo nuevo no envuelve. Textos de
pantalla con `docs/VOCABULARIO.md`.

## La prueba

Prueba nueva `pruebas/anadir-varios-claro.mjs` en la copia de pruebas (`?demo=1&auto=1`), con
la ventana del navegador baja (por ejemplo 1280×650) para que el cuadro no quepa entero:

- Abrir «Añadir varios relacionados» desde un asunto: «Cancelar» y el botón principal se ven sin
  desplazar nada; tras desplazar el cuerpo hasta abajo, siguen en el mismo sitio.
- Sin nadie señalado, «Cancelar» cierra sin preguntar y el asunto no cambia.
- Señalar 3, pulsar «Cancelar»: sale «¿Descartar los 3 señalados?»; «Seguir eligiendo» vuelve
  con los 3 señalados; «Descartar» cierra y el asunto no cambia. Lo mismo con Esc y con la ✕.
- Con un filtro de «Por datos del alumnado», el botón dice «Señalar los N»; al pulsarlo, el
  asunto aún no tiene a nadie nuevo y el pie dice «N señalados».
- El botón principal dice «Añadir al asunto los N» y, al pulsarlo, los N quedan en el asunto.
- Con la pestaña ALUMNADO, los atajos salen debajo del buscador; con PERSONAL, no salen.
- Abrir el cuadro desde los grupos de Ajustes con miembros ya puestos y cancelar sin cambiar
  nada: cierra sin preguntar.
- Las pruebas existentes de relacionados, grupos, actividades y lista pegada siguen pasando
  (ajustar solo los textos de botón que cambian).

## Para Francisco al terminar

En pocas frases: dónde ver el cambio (ficha de un asunto → «Añadir varios relacionados») y qué
va a ver distinto.

## Cómo sabemos que está bien

1. Con la ventana baja, «Cancelar» y «Añadir al asunto los N» se ven siempre, sin desplazar.
2. «Cancelar», la ✕ y Esc cierran sin añadir; con alguien señalado, preguntan antes, una sola
   vez; «Seguir eligiendo» no pierde nada.
3. «Señalar los N» solo señala; solo «Añadir al asunto los N» mete gente en el asunto.
4. Los nombres señalados y su × están abajo, en el pie, con alto limitado.
5. Arriba: pestañas, buscador, atajos de alumnado (solo con Alumnado), grupo y lista pegada.
6. Los otros sitios que usan el cuadro (actividades, grupos de Ajustes, asunto de grupo) tienen
   también «Cancelar» a la vista y conservan su propio texto de botón.
7. La prueba nueva pasa y las de siempre no se rompen; línea en «Qué hay de nuevo».
