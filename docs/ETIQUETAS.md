# Imprimir etiquetas

Fila 344 de `docs/COLA.md`. Idea de Francisco (14-oct-2026, apuntada desde el Centro de mando:
«una herramienta muy potente y versátil para imprimir etiquetas»), diseñada con él ese mismo día.

## De dónde sale esto

En Secretaría se imprimen etiquetas a menudo: sobres para las familias, carpetas de matrícula,
exámenes, carnés. Hoy no hay forma de hacerlo desde el Gestor, aunque ya tiene todos los datos del
alumnado, sus familias y el personal. Francisco quiere una herramienta para hacerlo desde la app,
sin pasar por Word ni por una hoja de cálculo.

## Lo que se pide

### 1. Dónde vive

- Nueva entrada en **Herramientas → «Etiquetas»** (pantalla propia, a todo el ancho).
- En la ficha de un **asunto de grupo** (`ficha.grupo`, tarjeta «Personas del grupo»), un botón
  «Imprimir etiquetas» que abre la misma pantalla con las personas del grupo ya elegidas.
- Un perfil directivo (`Perfil`) también puede imprimir etiquetas: no escribe nada salvo, como
  mucho, sus diseños y modelos (si va en «solo consultar», no puede guardarlos; imprimir, sí).

### 2. A quién (el filtro)

- Arriba, el **mismo filtro del reparto entre terceros** (`js/repartir-filtro.js`,
  `RepartirFiltro`, fila 342): varios criterios a la vez (todos deben cumplirse), atajos de
  unidad, nivel y enseñanza, «Pegar una lista» y la casilla de incluir antiguos. Se reutiliza; no se
  copia. Si hace falta, se expone lo necesario sin cambiar cómo funciona en el reparto.
- Pestañas para la clase de persona: **Alumnado** (por defecto) y **Personal** (docente y no
  docente, desde `Datos.cargarPersonal`; filtro por clase de personal y departamento).
- Junto al filtro, «N personas · N etiquetas» (las etiquetas cuentan copias y la unión de hermanos).
- Desde un asunto de grupo, la lista llega con sus personas; el filtro se puede seguir usando
  encima.
- Se puede quitar a una persona suelta de la lista con su ✕.

### 3. Las hojas de etiquetas (modelos)

- La app trae **ya preparados los modelos más comunes de Apli y Avery en A4** (por ejemplo, 2×7,
  3×7, 3×8, 2×8, 3×11, 4×10, 1×1), cada uno con su código de la caja (Apli y su equivalente Avery),
  filas, columnas, medidas de la etiqueta, márgenes y separación. Busca y comprueba las medidas
  reales de cada código antes de meterlo; no las inventes. Si de un código no encuentras medidas
  fiables, no lo metas.
- Un desplegable con buscador por código o por «filas × columnas».
- **«Nuevo modelo»**: se pide solo nombre, filas y columnas. La app calcula sola el tamaño de cada
  etiqueta repartiendo el A4 entero, sin márgenes. Un apartado plegado «Ajustar márgenes» deja
  poner margen superior, inferior, izquierdo y derecho y separación entre etiquetas, en mm, por si
  al imprimir no cuadra. También se pueden ajustar así los modelos que trae la app (se guarda como
  modelo propio, sin tocar el original).
- Los modelos propios se guardan en `_GESTOR/etiquetas.json` (compartidos por los dos ordenadores)
  y se pueden cambiar de nombre y borrar.
- El último modelo usado en este ordenador queda elegido la próxima vez (`localStorage`).

### 4. Qué lleva cada etiqueta (diseños)

- La app trae tres diseños hechos:
  - **«Sobre»**: «Familia de <nombres de pila> <apellidos>» y la dirección de la casa (calle,
    número, código postal, localidad, provincia), de los datos del RegAlum. Si a la familia le falta
    la dirección, la etiqueta sale con un aviso en ámbar en la vista previa («Sin dirección») y se
    cuenta arriba.
  - **«Alumno»**: apellidos y nombre, unidad y Nº de identificación escolar.
  - **«Profesor»**: apellidos y nombre y departamento (o puesto, en no docentes).
- **Crear un diseño nuevo**: nombre, y renglón a renglón, qué datos lleva cada uno, eligiéndolos de
  una lista (los mismos datos de la ficha de la persona: nombre, apellidos, unidad, nivel,
  enseñanza, Nº escolar, DNI, fecha de nacimiento, tutores, dirección, teléfono, correo, curso
  académico, nombre del centro…) y texto fijo escrito a mano. Por renglón: negrita, tamaño de letra
  (pequeño, normal, grande) y alineación (izquierda o centro). Si un texto no cabe, la letra se
  reduce sola hasta caber; si aun así no cabe, se corta con «…» y se avisa en ámbar.
- Cada diseño dice para qué clase de persona vale (alumnado, personal o los dos).
- Los diseños propios se guardan en `_GESTOR/etiquetas.json`, se pueden cambiar, duplicar y borrar.
  Los tres que trae la app se pueden duplicar para retocarlos, no borrar.

### 5. Familias con hermanos (solo en «Sobre» y diseños marcados «Una por familia»)

- Con el diseño «Sobre», los hermanos que estén en la lista salen en **una sola etiqueta por
  familia**: «Familia de Ana y Luis Pérez García», con la dirección de la casa. Dos alumnos son de
  la misma familia si comparten tutores legales y dirección (reutiliza cómo la ficha de la persona
  ya encuentra a los hermanos).
- Si los hermanos tienen apellidos distintos, se ponen nombre y apellidos de cada uno.
- Un diseño propio puede marcar la casilla «Una por familia» para comportarse igual. Por defecto
  está desmarcada: sale una etiqueta por persona.

### 6. Copias por persona

- Casilla numérica «Copias por persona», 1 por defecto. Con 3, cada persona (o familia) sale tres
  veces seguidas.

### 7. Orden

- Alumnado: por unidad y, dentro de cada unidad, por apellidos. Personal: por apellidos.
- Una familia unida va en el sitio de su hermano que va primero.

### 8. Hoja empezada

- La vista previa dibuja todas las hojas con sus casillas. Al pulsar una casilla de **cualquier hoja** se marca como
  **gastada** (rayada en gris) y no se imprime en ella; al pulsarla otra vez, se desmarca. Arrastrando de una casilla
  a otra de la misma hoja se marca (o se libera, si la de partida estaba rayada) el rectángulo entero (fila 374).
- La impresión salta las gastadas de todas las hojas; una hoja toda gastada sale como página en blanco.
- Un botón «Quitar todos los huecos» quita todas las marcas de todas las hojas.

### 9. Vista previa e impresión

- A la derecha (o debajo, si la ventana es estrecha), la **vista previa de las hojas tal cual
  saldrán**, a escala, con número de hoja. Se pone al día con cada cambio.
- Pie fijo con «N hojas · N etiquetas», «Guardar PDF» e «Imprimir». El PDF se hace con `pdf-lib`
  (ya está en la app) a tamaño real, sin escalar, para que cuadre con las hojas. Al imprimir se
  avisa en una línea: «En el cuadro de impresión, elige tamaño real (100 %), no "Ajustar"».
- «Guardar PDF» descarga `AAMMDD ETIQUETAS <diseño>.pdf`; no se guarda en ningún asunto.
- La pantalla aprovecha el ancho, sin huecos y sin obligar a desplazarse para ver lo importante.

## Qué ficheros tocar

- Módulos nuevos `js/etiquetas*.js` (por temas: pantalla, modelos, diseños, PDF), ninguno de más de
  600 líneas. Los modelos de Apli y Avery, en su propio fichero de datos.
- `js/repartir-filtro.js`: solo exponer lo necesario para reutilizarlo; el reparto no cambia.
- El menú de Herramientas y la tarjeta «Personas del grupo» (`js/personas-del-grupo*.js`) para los
  dos puntos de entrada.
- `_GESTOR/etiquetas.json`: se guarda por la cola por fichero (`ColaGuardado`), como el resto de
  `_GESTOR`, y mira `SoloConsulta`/`Perfil.escribir`.
- La demo: el alumnado de demostración debe tener al menos una pareja de hermanos, una familia sin
  dirección y varias unidades, y algo de personal con departamento.
- `js/novedades.js`: una línea (cambia lo que se ve).
- Los textos de pantalla, con las palabras de `docs/VOCABULARIO.md`. Todo cuadro sigue la regla
  común de `.capa > .cuadro` (fila 341).

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-344`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- No leas el repositorio entero: `docs/CONTEXTO.md`, los hijos de `docs/contexto/` del alumnado, del
  personal, de Herramientas y del asunto de grupo, `docs/REPARTIR-CON-FILTRO.md` y los ficheros de
  esta lista.
- Pruebas: mientras trabajas, `node pruebas/ejecutar.mjs etiquetas`; la pasada completa, una vez
  al final.

## La prueba

`pruebas/etiquetas.mjs`, con navegador y el disco de mentira:

- Herramientas → «Etiquetas» abre la pantalla. Filtro por una unidad: la cuenta coincide.
- Modelo 3×8 y diseño «Alumno»: la vista previa tiene 24 casillas por hoja y el nombre, la unidad y
  el número escolar de cada alumno, por orden de apellidos.
- Marcar 5 casillas como gastadas: la primera etiqueta va en la sexta; «Quitar todos los huecos» las desmarca.
- Diseño «Sobre» con dos hermanos en la lista: sale una sola etiqueta «Familia de …» para los dos;
  la familia sin dirección sale con el aviso «Sin dirección».
- «Copias por persona» = 3: cada persona sale tres veces seguidas y la cuenta de etiquetas lo dice.
- «Nuevo modelo» de 2 filas × 2 columnas: cada etiqueta mide un cuarto del A4 en el PDF.
- Crear un diseño propio con dos renglones (apellidos y nombre, en negrita; texto fijo «Examen»);
  se guarda en `_GESTOR/etiquetas.json` y sale en la vista previa.
- «Guardar PDF» da un PDF A4 con el número de hojas que dice el pie.
- Desde un asunto de grupo, «Imprimir etiquetas» abre la pantalla con sus personas.
- Pestaña Personal con diseño «Profesor»: sale el departamento.

## Para Francisco al terminar

Lo que va a ver: en Herramientas hay una pantalla «Etiquetas». Eliges a quién con el mismo filtro
del reparto, el modelo de hoja por el código de la caja y el diseño (Sobre, Alumno, Profesor o uno
propio). Marcas en el dibujo las etiquetas ya gastadas y pulsas «Imprimir». En los asuntos de grupo
hay un botón que lo abre con sus personas.

[SOLO FRANCISCO] La primera vez, imprimir una hoja en papel normal y ponerla a contraluz sobre una
hoja de etiquetas: si no cuadra, «Ajustar márgenes» en ese modelo.

## Cómo sabemos que está bien

1. En la demo, Herramientas tiene «Etiquetas» y se abre a todo el ancho.
2. Con el filtro del reparto se elige a quién; la cuenta de personas y de etiquetas es correcta.
3. Los modelos de Apli y Avery salen con su código, y «Nuevo modelo» pide solo filas y columnas.
4. Los diseños «Sobre», «Alumno» y «Profesor» están hechos; se puede crear uno propio eligiendo
   datos por renglón, y queda guardado.
5. Con «Sobre», dos hermanos salen en una sola etiqueta con la dirección de la casa.
6. «Copias por persona» repite cada etiqueta seguida.
7. Las casillas marcadas como gastadas no se imprimen; la primera etiqueta va en la primera libre.
8. La vista previa coincide con el PDF, que sale en A4 a tamaño real.
9. Un asunto de grupo tiene «Imprimir etiquetas» y abre la pantalla con sus personas.
10. El reparto entre terceros sigue igual (`repartir-con-filtro.mjs` pasa sin cambios).
