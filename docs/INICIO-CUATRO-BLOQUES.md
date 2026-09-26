# La pantalla de Inicio: lo que ha llegado, lo que me toca y lo que esperamos (fila 177)

Acordado con Francisco el 26-sep-2026. Diseño cerrado, con boceto aprobado:
**`docs/boceto-inicio.html`** (ábrelo en el navegador antes de empezar: es la referencia de cómo
tiene que quedar; los datos son inventados). Segunda parte de la «tanda 2». **Va después de la
fila 176** (usa ya las palabras de `docs/VOCABULARIO.md`).

## Qué quiere

Hoy, al entrar, se ve un solo montón («Pendiente de Administración»). Lo nuevo está en «Por
clasificar» (otro montón) y los correos plegados dentro; lo que toca, en otra pantalla («Qué me
toca»); lo que se espera, en otro montón. Por la mañana hay que ir a cuatro sitios.

La pantalla de «Asuntos abiertos» pasa a llamarse **«Inicio»** y enseña **todo a la vez**, sin
elegir montón, en el orden en que se mira por la mañana.

## Ficheros que se tocan

- `index.html` (`#pantalla-abiertos`: fuera los tres paneles de montón; los huecos nuevos)
- `js/asuntos-lista.js`, `js/asuntos-lista-montones.js`, `js/asuntos-lista-pintar.js`
- `js/que-me-toca.js` (sus cálculos se reutilizan; su pantalla desaparece)
- `js/documentos-sueltos.js` y `js/bandeja-pantalla.js` (el bloque «Ha llegado»)
- `js/barra.js` (nombre de la pestaña; fuera «Qué me toca»)
- `js/vista.js` y `js/tablon.js` (el tablón en su columna)
- `js/usabilidad.js` (la vista compacta sobra)
- CSS nuevo `css/inicio.css`, enlazado en `index.html` antes de `css/filas.css`
- Las pruebas de `pruebas/` que usen los montones o «Qué me toca»
- Un módulo nuevo `js/inicio.js` si hace falta para que ningún fichero pase de 600 líneas
  (engánchalo por `window.Gestor.alRefrescar` o por un punto previsto; nada de envolturas nuevas
  salvo que no haya remedio, y entonces apuntada en `js/envolturas-esperadas.js`)

No leas el repositorio entero. `data-pantalla="abiertos"` y los identificadores internos se
quedan como están: solo cambia lo que se ve.

## Cómo tiene que quedar

Cabecera: título **«Inicio»**, el buscador («Buscar en todos los asuntos abiertos: nombre, tipo
o tercero») y el botón «+ Nuevo asunto». Debajo, la línea de avisos (la hace la fila 178; aquí
deja su hueco). Después, a todo el ancho de la ventana (sin tope de ancho):

**Fila de arriba, cuatro columnas**: «Ha llegado», «Me toca», «Esperamos a otros» y el tablón
(columna estrecha, unos 250 px, como en el boceto). Por debajo de 1100 px de ancho de la zona de
trabajo, dos columnas; por debajo de 620, una.

### 1. «Ha llegado» (número al lado)

- Los documentos sueltos de la carpeta y los correos de la bandeja, **juntos, en una sola
  lista**, los más nuevos arriba. Cada uno con su etiqueta «PDF» o «Correo».
- Cada fila, compacta: nombre del fichero o asunto del correo, la línea gris de lo leído (la que
  ya pintan el lector de sueltos y el de la bandeja) y los botones principales de hoy: «Crear
  asunto con él», «Guardar en un asunto» / «Guardar aquí» / «Guardar en ese asunto», y «Leer» en
  los correos. El resto de acciones, en el menú ⋮ de cada fila, como hoy.
- **La bandeja ya no va plegada**: sus correos salen aquí directamente, y su lectura de adjuntos
  arranca al pintar el bloque.
- Como mucho 6 filas; si hay más, «Ver todo (N)» abre el bloque entero **a pantalla completa**
  (lo que hoy es la vista «Por clasificar», con su visor lateral), con «← Volver».
- Vacío: «No ha llegado nada nuevo.»

### 2. «Me toca» (número al lado)

- **Un hito por asunto**: el hito actual de cada asunto abierto cuyo responsable es
  Administración (o la persona que ha entrado), sin terminar y **con fecha**. Ordenados por fecha:
  vencidos arriba.
- Cada fila: etiqueta de plazo en color («Vencido hace 2 días», «Vence hoy», «Vence el lunes»,
  «Sin prisa · 15-oct»), etiqueta del tipo, **«Hito N de M · título del hito»** en negrita, y en
  gris el tercero y quién lo encarga (con el candado si es reservado, sin el tercero).
- Pulsar la fila abre **la mesa de ese hito**, como hoy desde «Qué me toca».
- Arriba del bloque, a la derecha, el filtro de responsable que tenía «Qué me toca» (recordado).
- Como mucho 8 filas y «Ver los N».
- Reutiliza los cálculos de `js/que-me-toca.js` (`reunir`, `clasificar`, `esMio`…), exponiéndolos
  si hace falta.

### 3. «Esperamos a otros» (número al lado)

- Los asuntos cuyo hito actual es de otro responsable o están «Esperando a…». Uno por asunto.
- Ordenados por días de espera: **los más antiguos arriba**.
- Cada fila: etiqueta de días en color (rojo desde 15 días, ámbar desde 7), el tipo,
  «Esperando a <quién> · <motivo o título del hito>» en negrita y, en gris, el tercero y «desde
  el <fecha>».
- Pulsar abre la ficha del asunto. Como mucho 8 filas y «Ver los N».

### 4. El tablón

El de siempre, en la cuarta columna. No se esconde (está descartado esconderlo). Si hay algo
abierto en el panel de la derecha (visor o lector), la fila de arriba pasa a tres columnas y el
tablón baja debajo de ellas.

### 5. «Todos los asuntos abiertos (N)», a todo el ancho

- Una **tabla** con columnas: Asunto (nombre de la carpeta, en negrita, pulsable a la ficha),
  Tipo, Hito actual, Le toca a, Plazo (etiqueta de color), Abierto (fecha). Y al final de cada
  fila, el ⋮ con «Copiar el nombre» y «Archivar» (lo que hoy tiene la tarjeta).
- A la derecha del título: «Filtros» (el panel de filtros de siempre: Situación —el antiguo
  «Montón», con las mismas opciones—, Plazo, Lo encarga, Tipo de asunto y el botón de
  reservados) y «Ordenar: …» (las mismas opciones de orden de hoy).
- **El buscador de la cabecera filtra esta tabla y también los bloques 1, 2 y 3** a la vez.
- Fuera: los tres paneles de montón, las tarjetas «Por tipo de asunto» (pasan a ser el filtro
  «Tipo de asunto») y el botón «Vista compacta / Vista cómoda» (la tabla ya es compacta).

### 6. Al final, plegados

«Dormidos (N) · sin novedades desde hace más de N días» y «Sin fecha (N) · hitos pendientes sin
plazo», con lo mismo que tienen hoy en «Qué me toca». Plegados al entrar; se recuerda si se
dejaron abiertos.

### 7. Fuera «Qué me toca» como pantalla

- Quitar su pestaña del menú (`js/barra.js`). El número rojo de hitos vencidos que llevaba pasa a
  la pestaña «Inicio».
- La pestaña «Asuntos abiertos» se llama **«Inicio»**.
- El aviso de «N aspirantes sin Nº de identificación escolar» que salía en «Qué me toca» pasa a la
  línea de avisos (fila 178); hasta entonces, déjalo encima de «Todos los asuntos abiertos».
- Cualquier enlace o botón que llevara a «Qué me toca» lleva ahora a Inicio.

## Reglas que no hay que romper

- El tablón no se borra mientras se escribe (`U.conservandoLoEscrito`, `docs/contexto/PANTALLA.md`).
- Se repinta solo lo que cambia y está a la vista; todo repintado asíncrono con contador de turno.
- La lista vuelve a la misma altura al volver de una ficha (fila 119).
- Los reservados siguen tapados en listas y buscador.

## Prueba

Una prueba nueva en `pruebas/` (navegador) con asuntos de ejemplo: al entrar se ven a la vez los
cuatro bloques y la tabla; un hito vencido de Administración sale el primero en «Me toca» y
pulsarlo abre su mesa; un asunto esperando a la familia sale en «Esperamos a otros»; un suelto y
un correo salen juntos en «Ha llegado»; escribir en el buscador filtra los bloques y la tabla; no
hay pestaña «Qué me toca». Y `npm test` entero en verde, con las pruebas viejas de montones y de
«Qué me toca» puestas al día o sustituidas.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir las líneas de «Qué me
toca», los montones y «Por clasificar». Poner al día `docs/contexto/PANTALLA.md` y
`docs/contexto/ASUNTOS.md`. Entrada en `docs/HISTORIA.md`.
