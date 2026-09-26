# Personas, Archivo y el menú llevan a algún sitio (fila 175)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Tercera y última parte de la «tanda 1» del
análisis de usabilidad. **Va después de la fila 173**: usa su `App.nuevoAsuntoCon`.

Idea de fondo: hoy la ficha de una persona es un callejón sin salida, el Archivo no enseña nada
hasta pulsar «Actualizar», el menú de la izquierda obliga a dos clics para todo, y el buscador de
Asuntos abiertos no encuentra lo que está en otro montón. Más unos cuantos textos que despistan.

## Ficheros que se tocan

- `js/archivo-personas.js` (puntos 1, 2 y 3)
- `js/nucleo.js` (punto 3: una línea en `App.ir` para 'archivo')
- `index.html` (puntos 3 y 6)
- `js/barra.js` (punto 4)
- `js/asuntos-lista-pintar.js` (punto 5)
- `js/usabilidad.js` (punto 6a)
- `js/elegir-asunto.js` (punto 6b)
- `js/correo-rastro.js` (punto 6c)
- `js/asuntos-nuevo-alta.js` (punto 6d)
- `js/guias-editor.js` (puntos 6e y 7)
- Una prueba nueva en `pruebas/`

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. La ficha de una persona enseña sus asuntos, y se pueden abrir

En «Personas y empresas», al elegir a alguien (`js/archivo-personas.js`):

- **Sus asuntos salen solos**, sin pulsar «Ver sus asuntos» (quitar ese botón; llamar a
  `App.verAsuntosDeTercero(p)` al pintar la ficha). Título del bloque: «Sus asuntos (N)».
- **Cada fila se puede pulsar** y abre la ficha: los abiertos con `Navegacion.abrirAbierto(nombre)`
  (lo mismo que ya usa «Asuntos de sus tutores» en `js/tutores-legales.js`); los archivados con la
  ficha de archivado, igual que «Abrir el que ya existe» de un duplicado archivado
  (`OtrosDelTercero.montarArchivado`, ver `js/duplicados.js`). Al volver, se vuelve a Personas con
  la misma persona elegida (la navegación de la fila 119 ya guarda la pantalla de origen).
- Abiertos primero, luego archivados, cada grupo del más reciente al más antiguo.

### 2. «+ Nuevo asunto» desde la ficha de una persona

Botón **«+ Nuevo asunto para esta persona»** en la ficha, junto a «Cambiar los datos» (si sale).
Llama a `App.nuevoAsuntoCon({ tercero: p })` (fila 173): lleva a Nuevo asunto con su categoría
elegida y ella esperando a que se elija el tipo. No sale para categorías que no pueden ser
tercero de un asunto, si las hay.

### 3. El Archivo carga solo al entrar

- En `App.ir` (`js/nucleo.js`), al entrar en 'archivo' la primera vez de la sesión, llamar a
  `App.verArchivo()`. Las veces siguientes, no (la lista ya está en memoria).
- Quitar la línea `#explica-archivo` «Pulsa Actualizar para leer el archivo…» de `index.html`
  (mientras carga, `App.verArchivo` ya pinta su progreso; si no lo hace, un «Leyendo el
  archivo…» en su lugar).
- Los botones «Actualizar» y «Reconstruir el índice» pasan a un menú de tres puntos
  (`U.menuDeAcciones`) a la derecha del buscador. Mismos textos, mismo comportamiento.
- El aviso «El índice no está hecho. Reconstruir el índice.» / «El índice puede no estar al día…»
  lleva un **botón de verdad** «Reconstruir el índice» dentro del aviso (hoy parece un botón y no
  lo es).

### 4. El menú de la izquierda nace abierto

En `js/barra.js`:

- Con la ventana **de 1100 px de ancho o más**, la barra nace **abierta** y **no se pliega sola**
  al elegir una pantalla. Se puede plegar a mano con las tres rayas, y eso se recuerda.
- Por debajo de 1100 px, como hoy: nace plegada y se pliega sola al elegir.
- Cambiar la clave de memoria (`gestor-barra` → `gestor-barra-2`) para que los dos ordenadores
  empiecen con la barra abierta una vez, aunque hoy tengan guardado «plegada».
- Al abrir el visor o el lector sigue plegándose sola y vuelve como estaba al cerrarlo (eso no
  cambia).

### 5. El buscador de Asuntos abiertos busca en todos los montones

En `js/asuntos-lista-pintar.js` (el `filter` del principio, `App.deLaVista`): **con texto en el
buscador**, no se filtra por el montón elegido: salen los asuntos abiertos de los tres montones que
coincidan. Encima de la lista, una línea «Buscando en todos los asuntos abiertos». Con el buscador
vacío, todo como hoy. Los demás filtros (plazo, «Lo encarga», «Montón») se siguen aplicando.

### 6. Textos que despistan

a. `js/usabilidad.js`, etiqueta del filtro puesto: hoy dice «Estado: administracion» (el valor
   interno). Debe decir **«Montón: »** seguido del **texto de la opción elegida** en
   `#filtro-estado` (por ejemplo, «Montón: Nos toca»).

b. `js/elegir-asunto.js`: quitar el «· N puntos» del pie de cada asunto propuesto (línea ~152).
   La puntuación sigue ordenando la lista; solo deja de verse.

c. `js/correo-rastro.js` (línea ~186): el texto cita el botón «Gestionar documentos», que ya no
   existe. Cambiarlo por: «Acuérdate de guardar el PDF del hilo en el asunto: en la tarjeta
   Documentos, "+ Añadir documento".»

d. Los buscadores de tercero dicen «Escribe tres letras del nombre», pero buscan desde dos.
   Cambiar a «Escribe dos letras del nombre» en `index.html` (`#buscar-tercero`) y en
   `js/asuntos-nuevo-alta.js` (`#rel-buscar`, el buscador reutilizable).

e. `js/guias-editor.js` (línea ~58), texto de arriba del editor de la guía: dice que los pasos
   «salen con una casilla para ir marcando». Desde la fila 26 son hitos. Cambiar la frase por:
   «Los pasos que hay que dar en un asunto de este tipo, en el orden del trámite. En cada asunto,
   cada paso es un hito, con sus tareas, sus documentos y su plazo.»

### 7. El plazo de un paso no se pierde sin avisar

En `js/guias-editor.js` (líneas ~144-148), el plazo de un paso solo se guarda si se elige un
«desde». Quien escribe «10» días y no toca el desplegable lo pierde sin enterarse. Al pulsar
«Guardar» en el editor de la guía: si algún paso tiene días escritos y «desde» vacío, **no
cerrar**; aviso rojo «El paso «título» tiene días de plazo, pero no dice desde cuándo. Elige
"desde" o borra los días.», abrir ese paso en el acordeón y poner el foco en su desplegable
«desde».

## Lo que no se hace

- No se rehace la pantalla de Asuntos abiertos ni sus montones: eso es la tanda 2.
- No se cambia ningún otro texto: los nombres son la tanda 2.

## Prueba

Una prueba nueva en `pruebas/` (navegador): (a) en Personas, elegir a alguien con un asunto
abierto: sale en «Sus asuntos» sin pulsar nada, y pulsarlo abre su ficha; (b) «+ Nuevo asunto
para esta persona» deja la persona esperando en Nuevo asunto; (c) entrar en Archivo pinta la lista
sin pulsar nada; (d) con el buscador escrito, sale un asunto que está en otro montón; (e) la guía
no se guarda con días sin «desde». Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir las líneas de
Personas y del ARCHIVO de la sección 5. Poner al día `docs/contexto/PERSONAS.md`,
`docs/contexto/ASUNTOS-ARCHIVO.md` y `docs/contexto/PANTALLA.md` (la barra de la izquierda).
Entrada en `docs/HISTORIA.md`.
