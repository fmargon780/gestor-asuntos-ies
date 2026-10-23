# Etiquetas que recuerda tu trabajo (fila 450)

Diseñado con Francisco el 23-oct-2026 (tema 389, ideas 377 y 387). Pantalla: Herramientas →
«Etiquetas» (`#etiquetas-vista`). Contexto técnico de la pantalla: `docs/contexto/ETIQUETAS.md`.
Ojo: las filas 373 (lista con casillas sin tope) y 374 (huecos en cualquier hoja) ya tocaron esta
pantalla; no deshagas nada de lo suyo.

## Qué pidió Francisco

Aviso de soporte del 20-oct-2026 (idea 377), copiado aquí para no depender del enlace:

> En la Herramienta Etiquetas propongo:
> 1º) Poder tener control sobre el orden en la que aparece cada una de las etiquetas.
> 2º) Poder guardar una tarea. Ahora tenemos Modelos de la hoja, Diseño de las etiquetas, pero si
> selecciono los elementos a incluir en las etiquetas y no termino, tengo que volver a empezar.

Idea 387: que el sistema recuerde la última elección de modelo y diseño, y que esa elección se vea
en unas tarjetas en la parte superior de la vista, justo encima de la simulación de la hoja.

## Lo decidido

### 1. El trabajo a medias se recuerda solo

- No hay botón de guardar ni tareas con nombre. La app guarda sola, cada vez que cambia algo, todo
  lo de la pantalla: Alumnado o Personal, las personas (filtro, añadidas con el buscador, quitadas,
  lista pegada, clase y departamento del personal), la hoja, el diseño, el orden, las copias y los
  huecos marcados.
- Al volver a Etiquetas (aunque se haya cerrado el navegador), la pantalla aparece como se dejó.
- El filtro (grupo, clase, departamento) se guarda como criterio: al volver, el grupo sale con
  quien tenga hoy. Lo añadido con el buscador y lo quitado se guardan persona a persona.
- Cada pestaña (Alumnado y Personal) guarda lo suyo: mirar un momento la otra pestaña no borra
  lo preparado. Esto cambia lo de hoy, que al cambiar de pestaña borra las añadidas y los huecos.
- Se guarda **en cada ordenador** (en el navegador, junto a lo que ya guarda
  `EtiquetasGuardado.ultimo()` / `recordar()`, clave `gestor.etiquetas.ultimo`). No se comparte con
  el otro ordenador ni se escribe en `_GESTOR/etiquetas.json`.
- Sacar el PDF **no** borra el trabajo.
- Botón nuevo **«Empezar de cero»** (encima de la lista de personas): quita las personas, el
  filtro, la lista pegada, las copias (vuelven a 1) y los huecos. **Conserva** la hoja, el diseño y
  el orden.
- **Tras «Empezar de cero», y la primera vez en un ordenador sin nada guardado, no hay nadie
  elegido y la hoja sale vacía.** Esto cambia lo de hoy: sin grupo ni nadie elegido, la lista ya no
  enseña todo el alumnado marcado. Las etiquetas aparecen cuando se elige un grupo (o clase o
  departamento), se busca a alguien o se pega una lista. Bajo la hoja vacía, una línea gris:
  «Elige un grupo, busca personas o pega una lista.»
- Si al volver una persona guardada ya no está en los listados (por ejemplo, un alumno dado de
  baja), simplemente no sale. Sin avisos de error.
- Entrar desde «Imprimir etiquetas» de la tarjeta «Personas del grupo» (`abrirDesdeGrupo`) empieza
  con las personas de ese grupo, como hoy, y sustituye el trabajo guardado. Hoja, diseño y orden
  se mantienen los últimos usados. Lo que se recuerda son las personas; el botón «Volver» al
  asunto, no: si luego se abre Etiquetas desde Herramientas, sale ese grupo, sin «Volver».
- En un ordenador marcado «solo consultar» también se recuerda (es solo de ese navegador).

### 2. Orden de las etiquetas

Desplegable **«Orden»** con cuatro opciones. Hoy el orden es fijo en `EtiquetasHoja.construir`
(`claveOrden`): alumnado por unidad y apellidos, personal por apellidos.

1. **Por grupo y apellidos** (por defecto, el de hoy). En el personal, como no tiene grupo, ordena
   por apellidos.
2. **Por apellidos.**
3. **Por nombre** (nombre de pila y después apellidos).
4. **En el orden en que los marco**: el orden en que cada persona entró en la selección.
   - Las que entran de golpe (un filtro de grupo, una clase o un departamento) quedan juntas y,
     entre ellas, por grupo y apellidos.
   - Las que se añaden una a una con el buscador o se vuelven a marcar en la lista van detrás, en
     el orden en que se marcaron.
   - Una lista pegada («Pegar una lista») sale en el orden de la lista pegada.
   - Ejemplo: si con el filtro se marca primero 2º B y luego 2º A, salen en un solo bloque por
     grupo y apellidos (2º A delante). Es lo esperado.

El orden se aplica igual en la vista previa y en el PDF. Con el diseño «Una por familia», las
familias se agrupan como hoy, y cada familia ocupa el sitio de su primer miembro según el orden
elegido.

### 3. Tres tarjetas encima de la hoja

Encima de la vista previa de la hoja, en una fila a todo el ancho:

- **Hoja**: nombre del modelo y columnas × filas (por ejemplo «Avery L7163 · 2 × 7»).
- **Diseño**: nombre del diseño.
- **Orden**: la opción elegida.

Al pulsar una tarjeta se despliega, en ese mismo sitio y debajo de la fila de tarjetas, lo que hoy
hay en el panel de la izquierda para elegirla: para Hoja, el buscador de modelos, el desplegable y
los botones (Nuevo, Cambiar…); para Diseño, el desplegable, sus renglones y los botones (Nuevo
diseño, Duplicar, Cambiar); para Orden, sus cuatro opciones. Pulsar otra vez la tarjeta, o pulsar
otra, lo pliega; solo una abierta a la vez. Orden se pliega también al elegir; Hoja y Diseño se
quedan abiertas al elegir (para poder pulsar Cambiar o ver los renglones). Los formularios de
«Nuevo modelo», «Cambiar», «Nuevo diseño» y «Duplicar» salen en ese mismo despliegue, a todo el
ancho bajo las tarjetas, y el panel de la izquierda sigue a la vista.

Estas tres cosas **se quitan del panel de la izquierda**. El panel queda para elegir a quién
(pestañas Alumnado/Personal, buscador, filtros, pegar lista, lista con casillas, «Empezar de
cero»), las copias y los huecos de la hoja empezada. Aprovecha el ancho: las tarjetas y su
despliegue van a todo el ancho de la zona de la hoja, sin huecos vacíos.

## Ejemplo con datos reales

Francisco prepara etiquetas de sobre para las familias de **2º ESO B**: pestaña Alumnado, filtro
2º ESO B, hoja **Avery L7163**, diseño **Sobre**, orden **Por apellidos**. Quita a dos alumnos y le
llaman. Sale de Etiquetas. Al volver, la tarjeta Hoja dice «Avery L7163 · 2 × 7», Diseño «Sobre» y
Orden «Por apellidos», y la lista de 2º ESO B está igual, sin los dos alumnos que quitó. Saca el
PDF: las etiquetas van por apellidos. (Si en la copia de pruebas no hay 2º ESO B, usa el grupo que
haya con más alumnos; el caso real con 2º ESO B queda [SOLO FRANCISCO].)

## Cómo sabré que está bien (lista del revisor: «Cómo sabemos que está bien»)

1. Marco unas personas, salgo de Etiquetas, vuelvo, y siguen marcadas.
2. Encima de la hoja veo tres tarjetas: Hoja, Diseño y Orden, con lo último que elegí.
3. Elijo «En el orden en que los marco» y las etiquetas salen en ese orden en la hoja y en el PDF.
4. «Empezar de cero» deja la pantalla limpia (nadie elegido, hoja vacía), pero conserva la hoja y
   el diseño.
5. En el ordenador de Diego no aparece lo que dejé a medias en el mío.

## Ficheros que se tocan

- `js/etiquetas-pantalla.js` (622 líneas): **pártelo antes de tocarlo**. Saca a un fichero nuevo
  `js/etiquetas-tarjetas.js` la parte de hoja y diseño (`htmlHoja`, `filtrarModelos`, `htmlDiseno`
  y sus enganches de botones) junto con las tarjetas y el orden. Añade el `<script>` nuevo en
  `index.html` antes de `etiquetas-pantalla.js`.
- `js/etiquetas-guardado.js`: guardar y leer el trabajo a medias en el navegador (con `try`, como
  `recordar`).
- `js/etiquetas-hoja.js`: `construir` recibe el orden elegido (y, para «en el orden en que los
  marco», el orden de entrada).
- `css/etiquetas.css`: las tarjetas y su despliegue.
- `index.html` (solo el `<script>` nuevo), `js/version.js` (versión nueva), `js/novedades.js`.
- `pruebas/etiquetas.mjs` o una prueba nueva `pruebas/etiquetas-recuerda.mjs`.
- `docs/contexto/ETIQUETAS.md` (un párrafo «Fila 450»), `docs/COLA.md`, `docs/HISTORIA.md`.

## Cómo trabajar

- Cambios quirúrgicos. No reescribas ficheros enteros (salvo mover a `etiquetas-tarjetas.js` lo
  que sale de `etiquetas-pantalla.js`).
- No leas el repositorio entero: basta con los ficheros de arriba y `docs/contexto/ETIQUETAS.md`.
- Sigue `CLAUDE.md`: rama `fila-450`, revisor, y a `main` sin dejar ninguna petición de cambios
  abierta.
- Una sola prueba al final, que recorra el ejemplo y las cinco comprobaciones. La 5 se comprueba
  simulando otro navegador (almacenamiento vacío): la pantalla debe salir limpia, con nadie
  elegido y la hoja y el diseño por defecto.
- Pasa el revisor de siempre (`docs/REVISOR-ANTES-DE-PUBLICAR.md`).
