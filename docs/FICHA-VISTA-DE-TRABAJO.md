# La ficha del asunto con vista de trabajo

Filas 425 (parte A) y 426 (parte B) de `docs/COLA.md`. Tema 397, ideas 396 y 419. Diseñado con
Francisco el 22-oct-2026.

## De dónde sale

Aviso de Francisco (idea 396, 21-oct-2026, pantalla «Ficha de un asunto»):

> Ahora mismo cuando entramos en un asunto la "sección seleccionada" ocupa todo el ancho de la
> vista. […] Propongo que por defecto cuando entremos en un asunto la vista sea mixta: a la
> izquierda, Hitos a la derecha, Documentos de la carpeta. Esa son las dos vistas de trabajo
> frecuentes y en muchas ocasiones necesitamos verlas a la vez. […] Las otras secciones son de
> consultas más esporádicas.

Idea 419 (22-oct-2026): un orden lógico, fijo e igual para todos, dentro del asunto y de los hitos.
Regla: lo que se usa en un paso, en el paso; lo que vale para todo el asunto, en la ficha; nada
obliga a salir del asunto.

Una simulación con la demostración (asunto de matrícula de Pablo Aguilar Ponce) encontró estas
salidas del hito, de más a menos frecuentes: tareas y documentos no se ven a la vez; los datos del
alumno (curso, unidad, NIE, teléfono, correo) obligan a ir a «Datos y contacto» → «Ver todo»; los
campos del asunto están en otra pestaña; las notas sin hito (por ejemplo «La familia ya ha entregado
la documentación en Jefatura») solo se ven en la pestaña Registro.

## Lo que decidió Francisco

1. Al entrar en un asunto se abre siempre una pestaña nueva, **«Trabajo»**, la primera de la fila
   de pestañas. Tiene **dos columnas de igual ancho** (mitad y mitad).
2. **Columna izquierda: el hito entero, de arriba abajo**, sin tarjetas que se cambian. En este
   orden: Tareas → Campos de este hito → Documentos del hito → Registro.
3. **Columna derecha: los documentos de la carpeta.** Los que son del hito abierto llevan una marca
   pequeña con su número («Hito 2»).
4. Al pulsar un documento de la carpeta, se abre **en la columna derecha, en lugar de la lista**,
   con un botón «← Carpeta» arriba para volver. El hito sigue a la izquierda.
5. Las demás pestañas (Datos y contacto, Campos del asunto, Registro, Otros asuntos de este tercero,
   Personas y entidades relacionadas) se abren **a todo el ancho, como hoy**. Pulsar «Trabajo»
   vuelve a las dos columnas.
6. (Parte B) Arriba de la columna derecha, encima de la carpeta, una franja **«Datos del asunto»**:
   cerrada, una sola línea con los datos de uso diario; al pulsarla se despliega ahí mismo con todo.
   Cada dato se copia con un clic.
7. (Parte B) El bloque **Registro del hito** enseña también las notas del asunto que no van unidas a
   ningún hito, con la etiqueta «del asunto».

Decidido en la conversación sin preguntarle (lo tomas como parte del diseño):

- La cabecera de arriba (título, «Hito X de N», «Esperando a…», plazo, «El encargo», botones de
  copiar Asunto/Ruta/NIE/Nombre/DNI, «Elegir datos», «⋯», «Archivar el asunto») **no cambia**.
- «Trabajo» sustituye a las pestañas «Hitos» y «Documentos de la carpeta», que desaparecen como
  pestañas propias (su contenido está en «Trabajo»). La cuadrícula de tarjetas de la ficha
  (`FichaTarjetas`, la que se ve sin ninguna tarjeta abierta) deja de ser la entrada: al entrar
  siempre se ve «Trabajo». Si con eso la cuadrícula ya no se usa en ningún sitio, se retira.
- El bloque «Documentos del hito» de la izquierda enseña **solo los documentos del propio hito**
  (los «gemelos» y las «Versiones previas» del hito siguen como hoy). Lo que hoy sale en la mesa
  como «En la carpeta, sin hito» y los de otros hitos ya se ven en la carpeta de la derecha; el
  «Traer a este hito» del «⋯» de cada documento de la carpeta sigue funcionando y lleva al hito
  abierto.
- **Adjuntar desde la carpeta** (decidido con Francisco al revisar la instrucción): cada documento
  de la lista de la carpeta lleva la misma casilla que hoy llevan en la mesa los documentos de otros
  hitos y los «sin hito». Lo marcado allí se adjunta al «Comunicar» y al «Enviar» del hito abierto,
  igual que hoy. La casilla solo sale con un hito abierto a la izquierda.
- **Pestañas**: «Trabajo» es la primera de todas; «La actividad» y «Candidaturas», donde existen,
  van justo detrás, a todo el ancho como las demás.
- **Todo documento que hoy se abre en el panel de la derecha** (pulsar un documento, el visor de
  Word al generar, la franja verde de «Registrar», el lector de «Por clasificar» abierto desde el
  asunto) se abre en la columna derecha de «Trabajo», en lugar de la lista, con «← Carpeta». Si se
  está en otra pestaña, primero se pasa a «Trabajo».
- **Registro del hito**: lleva la caja para escribir una nota encima de la lista, como hoy la
  tarjeta Registro en grande; la nota escrita ahí va unida al hito, como hoy.
- **Soltar un PDF** arrastrándolo: sobre cualquier parte de «Trabajo» (las dos columnas) entra en
  el hito abierto, como hoy sobre la mesa; se quita la zona de soltar a todo el ancho si queda
  repetida, pero la pequeña del siguiente paso sigue.
- **La franja de documentos en chips** de las otras pestañas y el botón «Volver a las tarjetas»
  desaparecen, con la cuadrícula.
- **Qué hito se abre**: el que pida quien abre el asunto («Qué me toca», el menú de un documento,
  generar…), como hoy; si nadie pide ninguno, el primero sin hacer; con todos hechos, la lista.
  Con la lista de hitos a la izquierda, la carpeta no lleva marcas «Hito N» ni casillas.
- Por debajo de 1100 px de ancho, las dos columnas se ponen una debajo de otra: el hito arriba y la
  carpeta debajo.
- Los perfiles de solo consulta y directivo ven la misma disposición, con los botones que ya hoy
  tienen o no tienen.

## Cómo está hoy (para situarte)

- `js/ficha-tarjetas.js` (`FichaTarjetas`, 351 líneas) y `css/ficha-tarjetas.css`: la ficha en
  tarjetas, la tarjeta abierta en grande (`data-abierta`) y las pestañas
  (`#ficha-tarjetas-pestanas`). Detalle en `docs/contexto/ASUNTOS.md`, «La ficha en tarjetas».
- `js/hito-mesa.js` (529 líneas), `js/hito-mesa-tarjetas.js`, `js/hito-mesa-guion.js`,
  `js/hito-mesa-documentos.js`, `css/hito-mesa.css`: la mesa del hito, hoy con tres tarjetas
  (`.mesa-columnas[data-tarjeta="guion|docs|notas"]`, una en grande a la izquierda y dos de resumen a
  la derecha, `.mesa-resumen`). Detalle en `docs/contexto/HITO-MESA.md`, «Tres tarjetas».
- `js/campos-de-hito.js`: «Campos de este hito».
- `js/ficha-documentos.js`: la lista «Documentos de la carpeta» y `abrirDocumento` (visor).
  `js/visor.js` y `js/word-visor.js`: el visor, que hoy abre en un panel a la derecha y hace bajar
  la zona derecha de la mesa.
- `js/registro-asunto.js`: `lineas(a, { hito, … })`; con `hito`, solo las de ese hito. Las notas a
  mano sin hito tienen `n.hito` vacío.
- `js/ficha-tercero.js`, `js/ficha-tercero-alumno.js`, `js/contacto-a-la-vista.js`: «Datos y
  contacto» y su «Ver todo». «Datos del trámite» / «Campos del asunto»: `datosDelAsunto(a)`, en
  `docs/contexto/ASUNTOS.md`.

No leas el repositorio entero: basta con estos ficheros y los que ellos llamen.

## Parte A (fila 425): la vista de trabajo

Cambia cómo se coloca, no lo que hace cada botón: cada botón sigue llamando a lo mismo de hoy.

1. **Pestaña «Trabajo».** Primera de la fila de pestañas. Se abre siempre al entrar en un asunto
   (también al volver a la ficha tras cerrar el correo o generar, si se estaba en «Trabajo»; si se
   estaba en otra pestaña de este mismo asunto, se respeta, como hoy). Quita las pestañas «Hitos» y
   «Documentos de la carpeta». Las demás pestañas, a todo el ancho, como hoy.
2. **Dos columnas** de igual ancho, que llenan el ancho disponible y el alto hasta abajo de la
   ventana; cada columna se desplaza por su cuenta si su contenido no cabe.
3. **Columna izquierda.** La tira de hitos y la cabecera del hito (título, estado, plazo,
   responsable y los cinco botones) como hoy. Debajo, en una sola columna y en este orden:
   - Tareas (el guion de hoy, con la caja «Nueva tarea…» y los botones de la fila 410);
   - Campos de este hito;
   - Documentos del hito (solo los del hito; ver arriba);
   - Registro (las líneas del hito, como hoy en la tarjeta «Registro»);
   - «Normativa (N)», plegada, al pie.
   Desaparecen las tarjetas de resumen y el cambio de tarjeta (`.mesa-resumen`,
   `HitoMesa.abrirTarjeta`, «← Volver al guion»). Lo que hoy hace «Registrar» antes de registrar
   («abre antes la tarjeta de documentos») pasa a llevar el bloque de documentos a la vista.
   «← Hitos» sigue enseñando la lista de hitos en esta misma columna; al entrar en el asunto se
   abre el hito actual (el primero sin hacer), como hace hoy la mesa; con todos hechos, la lista.
4. **Columna derecha.** La lista «Documentos de la carpeta» de siempre (el mismo pintado de
   `js/ficha-documentos.js`, con sus ⧉, el botón «Ruta» de la fila 423 si ya está hecha, el «⋯» y
   «Versiones previas»). Cada documento que es del hito abierto lleva una marca pequeña «Hito N»
   (N = número del hito en la tira). Al cambiar de hito, las marcas cambian.
5. **El visor.** Pulsar un documento de la carpeta (o de «Documentos del hito», a la izquierda) lo
   abre en la columna derecha, en lugar de la lista, con un botón «← Carpeta» arriba que vuelve a la
   lista. La columna izquierda no se mueve ni baja. Escape cierra primero el visor, como hoy.
   El lector de «Por clasificar» no cambia.
6. **Pantallas estrechas** (por debajo de 1100 px): una columna debajo de otra.
7. **Escape** (`js/usabilidad.js`): quita los pasos que ya no existen (volver al guion, cerrar la
   tarjeta en grande); el orden de los demás se queda.
8. `js/novedades.js`: una línea al principio: «Al entrar en un asunto ves a la vez el hito, a la
   izquierda, y los documentos de la carpeta, a la derecha (pestaña «Trabajo»).» (regla 21 de la
   cola).
9. Pruebas: `pruebas/ficha-disposicion.mjs` y las de la mesa que dependan de las tres tarjetas se
   adaptan a la disposición nueva (no se retiran). Prueba nueva `pruebas/ficha-vista-de-trabajo.mjs`:
   al abrir un asunto de la demostración con varios hitos y documentos, está activa «Trabajo», la
   columna izquierda tiene los cuatro bloques en el orden de arriba, la derecha tiene la carpeta,
   cada columna mide la mitad (±2 %), los documentos del hito abierto llevan su marca y los demás no,
   abrir un documento deja el visor en la derecha con «← Carpeta», marcar la casilla de un
   documento de la carpeta lo pone entre los adjuntos del «Comunicar» del hito, y a 1000 px las
   columnas van una debajo de otra.
10. Al terminar: `docs/contexto/HITO-MESA.md` («Tres tarjetas» pasa a describir la columna única),
    `docs/contexto/ASUNTOS.md` («La ficha en tarjetas») y `docs/CONTEXTO-CORTO.md`: sustituir lo que
    ya no vale, no añadir al lado.

### Cómo sabré que está bien (parte A)

En la demostración, con un asunto equivalente a los del ejemplo real.

1. Al abrir el asunto, la primera pestaña es «Trabajo» y ya está abierta.
2. A la izquierda está el hito, entero y de arriba abajo: tareas, campos, documentos del hito y
   registro. A la derecha está la carpeta. Cada columna ocupa la mitad.
3. Los documentos de la carpeta que son del hito abierto llevan una marca con el número del hito.
4. Al pulsar otra pestaña, como «Datos y contacto», se abre a todo el ancho. Al pulsar «Trabajo»
   se vuelve a la vista de dos columnas.
5. Al pulsar un documento de la carpeta, se abre en la columna derecha con «← Carpeta» arriba, y el
   hito sigue a la izquierda.

## Parte B (fila 426): los datos a mano

Empezar con la 425 HECHA.

1. **Franja «Datos del asunto»**, arriba de la columna derecha de «Trabajo», encima de la carpeta y
   también encima del visor cuando está abierto.
   - **Cerrada** (así sale al entrar): una sola línea con los datos de uso diario del tercero, cada
     uno con su ⧉ para copiarlo, en este orden: alumnado, NIE, curso, unidad, teléfono y correo del
     primer contacto (el mismo que sale primero hoy en «Datos y contacto»). Otro tercero (empresa,
     organismo, personal): NIF o DNI, teléfono y correo. Lo que no exista no sale; si la línea no
     cabe, se corta con «…» por el final, así que el NIE (o NIF/DNI) se ve siempre.
   - **Abierta** (al pulsar la franja, fuera de un ⧉): se despliega en el sitio, empujando la
     carpeta hacia abajo, con todo lo que hoy da «Datos y contacto» → «Ver todo» y debajo los
     campos del asunto («Campos del asunto»). Se reutiliza el mismo pintado de esas pestañas (nada
     de copias), así que sus botones hacen lo mismo que allí. Pulsar el título otra vez la cierra.
     Abierta o cerrada se recuerda mientras se está en el asunto; al entrar en otro, cerrada.
   - Las pestañas «Datos y contacto» y «Campos del asunto» siguen existiendo.
2. **Notas del asunto en el Registro del hito.** El bloque Registro de la columna izquierda enseña,
   mezcladas por fecha con las del hito (la más reciente arriba), las **notas escritas a mano** que
   no van unidas a ningún hito (`n.hito` vacío), con una etiqueta pequeña «del asunto». Las líneas
   automáticas sin hito no salen aquí (siguen en la pestaña Registro). En `js/registro-asunto.js`,
   una opción nueva de `lineas` para pedirlo; la pestaña Registro no cambia.
3. `js/novedades.js`: una línea al principio: «En «Trabajo», la franja «Datos del asunto» tiene a
   mano los datos del interesado para copiarlos, y el registro del hito enseña también las notas
   del asunto.»
4. Prueba nueva `pruebas/ficha-datos-a-mano.mjs`: con un asunto de alumnado de la demostración, la
   franja cerrada enseña NIE, curso, unidad, teléfono y correo en una línea, y a
   900 px de ancho de ventana el NIE sigue visible; su ⧉ copia el NIE; al pulsarla se
   despliega con los datos completos y los campos del asunto; una nota a mano sin hito sale en el
   Registro del hito con «del asunto» y una línea automática sin hito no sale.
5. Al terminar: `docs/contexto/HITO-MESA.md`, `docs/contexto/ASUNTOS.md` y `docs/CONTEXTO-CORTO.md`.

### Cómo sabré que está bien (parte B)

1. Encima de la carpeta hay una línea con curso, unidad, NIE, teléfono y correo del alumno. Al
   pulsarla se despliega con todos los datos y los campos del asunto.
2. Cada dato de esa franja se copia con un clic.
3. En el Registro del hito salen también las notas sueltas del asunto, con la etiqueta «del
   asunto».

## Ejemplo real

Dos asuntos que eligió Francisco:

- «261021 A26-0464 TRANSPORTE Amortegui Marín, Nicolás 20740731» (4º ESO E), con 6 hitos; es el
  de la captura del aviso, abierto en el hito 2 «Ajuste Planificacion».
- El asunto de **Elecciones al Consejo Escolar** de este curso: muchos hitos y muchos documentos
  (candidaturas), el caso más cargado.

Las sesiones no entran en los datos reales: el revisor lo comprueba con asuntos equivalentes de la
demostración.

- **[SOLO FRANCISCO]** (parte A) Abrir el asunto de Nicolás y el de Elecciones al Consejo Escolar:
  se ven a la vez el hito y la carpeta, y en Elecciones los documentos del hito abierto llevan su
  marca.
- **[SOLO FRANCISCO]** (parte B) En el asunto de Nicolás, la franja «Datos del asunto» enseña 4º ESO
  E y su NIE, y se copian con un clic.

## Lo que no cambia

- Lo que hace cada botón del hito, de la carpeta y de la cabecera.
- Las pestañas de consulta y su contenido.
- Tema 390 (DECIDIDA, sin diseñar): cambiará qué datos enseña cada documento de la lista de la
  carpeta; como la columna derecha usa el mismo pintado de `js/ficha-documentos.js`, ese cambio
  saldrá aquí solo.
