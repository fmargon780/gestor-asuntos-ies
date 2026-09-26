# La pantalla del tipo: lo que le falta, arriba, y todo se guarda solo (fila 180)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Segunda parte de la «tanda 3». **Va
después de la fila 179.** Palabras de `docs/VOCABULARIO.md`.

## Qué quiere

La pantalla de un tipo de asunto (Ajustes › Tipos de asunto › pulsar uno) tiene ocho secciones
plegadas. Un tipo nuevo no dice por dónde empezar, y hay cosas que dependen de otras sin avisar:
el usuario se entera cuando algo falla en un asunto de verdad («No hay ninguna plantilla de
documento para este hito»).

## Ficheros que se tocan

- `js/ajustes-tipo.js` y un módulo nuevo `js/ajustes-tipo-falta.js` (la lista de lo que falta)
- `js/ajustes-plegado.js` (resúmenes)
- `js/ajustes.js` (la casilla de días de la tarjeta de la parrilla)
- `js/campos-catalogo.js`, `js/ajustes-tipo-palabras-clave.js` (guardar al cambiar)
- `js/ajustes-centro.js` e `index.html` (el bloque «Campos propios» de El centro)
- `css/ajustes.css`
- Las pruebas de `pruebas/` que usen «Guardar campos», «Guardar palabras clave» o la casilla de
  días de la parrilla

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. «Para que este tipo funcione»: la lista de lo que falta

Arriba de la pantalla del tipo, debajo del título y **siempre a la vista** (no plegada), una
línea (o dos, si no cabe) con cada comprobación y su marca ☑ o ☐. Cada una se puede pulsar: abre
y lleva a la sección donde se arregla. Se vuelve a calcular cada vez que se guarda algo en la
pantalla.

Imprescindibles (☐ en ámbar si faltan):

- **nombre corto** del tipo.
- **quién lo encarga** (que no sea «Sin asignar»).
- **guía**: al menos un hito. Texto: «guía (N hitos)».
- **plantillas que piden las tareas**: por cada tarea «Generar un documento» de la guía sin
  plantilla elegida, «el hito N tiene una tarea de generar sin plantilla»; por cada plantilla de
  documento del tipo cuyo `.docx` no esté en `_GESTOR/PLANTILLAS`, «falta el fichero de la
  plantilla X»; por cada plantilla con «Quien firma» cuyo cargo no tenga a nadie en Ajustes › El
  centro › Cargos, «nadie ocupa el cargo X».
- **festivos**: si algún hito de la guía cuenta su plazo en días hábiles o lectivos y Ajustes ›
  El centro › Hitos no tiene festivos (o días no lectivos) del curso: «faltan los festivos del
  curso» (este lleva a esa sección de El centro).

Opcionales (en gris, con «(opcional)», nunca en ámbar): plazo del tipo, palabras clave,
plantillas de correo.

Todo bien: «☑ Este tipo tiene todo lo que necesita.» en verde, en una línea.

En la parrilla de Tipos de asunto, las tarjetas de los tipos con algún imprescindible sin cumplir
llevan un punto ámbar pequeño (con `title` «Le falta algo: ábrelo para verlo»).

### 2. Una sola forma de guardar: al cambiar

Hoy hay cuatro: al cambiar (Datos del tipo, Plazo), botón de sección («Guardar campos»,
«Guardar palabras clave»), cuadro con Crear/Guardar (plantillas, recurrentes, guía) y doble
confirmación (guía con biblioteca).

- **Campos** y **Palabras clave** pasan a guardarse al cambiar, como Datos del tipo: fuera sus
  botones «Guardar campos» y «Guardar palabras clave», y fuera el aviso «Salir sin guardar». Con
  el aviso verde breve de siempre al guardar.
- Los cuadros (plantilla, recurrente, guía) siguen con su botón, porque son cuadros: eso no cambia.

### 3. El plazo del tipo, en un solo sitio

Quitar la casilla de «días de plazo» de cada tarjeta de la parrilla (`js/ajustes.js`). Se queda
solo en la sección «Plazo» de la pantalla del tipo. El texto de arriba de la parrilla que habla
de los días de plazo se ajusta.

### 4. Los campos, en un solo sitio

El bloque «Campos propios» de Ajustes › El centro sobra: hace lo mismo que la pestaña «Míos» del
panel «+ Añadir campo» de cada tipo. Sustituirlo por una línea: «Los campos se crean y se cambian
desde la pantalla de cada tipo, en "Campos" › "+ Añadir campo".» Los «Campos del nombre» de
Tipos de documento no se tocan (son de otra cosa: del nombre del documento).

## Prueba

Una prueba nueva en `pruebas/` (navegador): un tipo recién creado enseña ☐ en quién lo encarga y
guía; al elegir quién lo encarga, se marca ☑ sin recargar; una guía con una tarea de generar sin
plantilla enseña el aviso de ese hito; un campo añadido se guarda sin pulsar ningún botón; la
parrilla ya no tiene casilla de días. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. Poner al día `docs/contexto/CAMPOS-Y-TIPOS.md` y la línea de
Ajustes de `docs/CONTEXTO-CORTO.md`. Entrada en `docs/HISTORIA.md`.
