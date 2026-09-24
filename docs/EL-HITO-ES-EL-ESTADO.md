# El hito es el estado del asunto

Fila 129 de `docs/COLA.md`. Diseño cerrado con Francisco el 24-sep-2026. Sustituye y corrige
la fila 104 (`docs/ESTADO-POR-EL-HITO.md`).

Lee antes `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` y `docs/contexto/HITOS-Y-GUIAS.md`, y el
hijo de `docs/contexto/` que describa la lista de asuntos abiertos. **No leas el repositorio
entero**: solo los ficheros de la lista de abajo y lo que ellos llamen.

## Reglas de esta instrucción

- Sube directamente a `main`, **sin abrir ninguna pull request** (si la sesión lo tiene forzado,
  vale la nota "Sube directamente a main" de `docs/COLA.md`: fusiónala tú en cuanto esté en verde).
- Cambios quirúrgicos. No reescribas ficheros enteros.
- Si un fichero que tienes que tocar pasa de unas 400 líneas, pártelo en dos.
- Una sola prueba al final, no una comprobación después de cada cambio.
- No le preguntes nada a Francisco. Decide, apunta la decisión en la documentación y sigue.
- Como máximo dos subidas (regla 13 de la cola), más una de documentación.

## Lo que ha fallado con la fila 104

Francisco trabajó con la app la mañana del 24-sep-2026 y vio dos cosas:

1. **No ve el hito por ningún sitio.** La fila 104 solo usa el hito para decidir el montón
   (Pendiente de Administración / Pendiente de terceros). La tarjeta sigue enseñando el estado
   escrito a mano (`ficha.situacion`).
2. **Asuntos que él ponía «en espera» se quedan en Pendiente de Administración.** Con hitos, el
   estado manual se ignora sin avisar. Y el primer hito sin terminar suele ser de Administración
   o no tener responsable (que cuenta como Administración), porque los pasos no se han ido
   marcando.

Conviven dos sistemas (estado manual y hito) y la app obedece a uno en silencio. **Se quita uno:
manda el hito, y solo el hito.**

## Lo que hay que hacer

### 1. El estado del asunto es su hito actual

- El «hito actual» es el que ya elige `Hitos.aQuienLeToca` (`js/hitos-a-quien.js`). No dupliques
  el criterio: si hace falta el nombre del hito o su posición, amplía lo que devuelve esa función.
- La tarjeta de Asuntos abiertos y la cabecera de la ficha enseñan, en lugar del estado manual:
  **«Paso N de M · <título del hito>»** (M = hitos visibles que cuentan, sin los «solo
  informativo»). En Pendiente de terceros, además, quién lo tiene, como ya hace la fila 104.
- Todos los hitos terminados: «Listo para archivar».
- Pulsar ese texto abre la mesa de ese hito.

### 2. Cada paso de la guía dice a quién le toca

- En el editor de la guía (`js/guias.js` y sus hijos), cada paso lleva una marca de dos opciones:
  **«Nos toca»** o **«Esperamos a…»**. La segunda deja elegir a quién (los responsables y papeles
  fijos de siempre: familia/tutor legal, tercero, Dirección, Jefatura…).
- Se guarda en el paso de la guía y lo heredan los hitos de todos los asuntos de ese tipo (igual
  que heredan hoy el resto de datos del paso; mira `js/hitos-sincronizar.js`).
- De partida, sin marca: se deduce del responsable del paso con `Hitos.esDeAdministracion`, que
  sigue siendo **el único sitio** que decide quién es Administración. La marca del paso, cuando
  existe, manda sobre el responsable.
- En la fila cerrada del acordeón de la guía, la marca se ve junto a las demás (p. ej. «Espera:
  Familia»).

### 3. El asunto avanza solo

- Al marcar un hito hecho (o «no aplica»), el asunto pasa al siguiente y cambia de montón si
  toca, sin que Francisco haga nada más. Ya lo hace la fila 104 con `Hitos.alCambiar`; comprueba
  que funciona también desde la mesa del hito y desde el guion que se marca solo.

### 4. Botón «Esperando a…» para lo imprevisto

- En la cabecera de la ficha, un botón **«Esperando a…»**. Elige a quién (la misma lista del
  punto 2) y, si quiere, una línea de motivo.
- Pone el asunto en **Pendiente de terceros** aunque su hito actual sea de Administración. Se
  guarda en el hito actual (`esperandoA`, `esperandoDesde`, `esperandoMotivo`), por
  `Hitos.cambiar`, nunca en la ficha.
- Se quita solo cuando llega un documento nuevo al asunto (asociado a cualquier hito o suelto en
  su carpeta), cuando se marca hecho ese hito, o a mano con **«Ya ha llegado»** (mismo sitio del
  botón). Al quitarse, el asunto vuelve a su montón normal.
- La tarjeta lo dice: «Esperando a Familia desde el 24-sep».

### 5. Asuntos sin guía: guía mínima

- Un tipo sin guía recibe una guía mínima de tres pasos: **Tramitar** (nos toca), **Esperar
  respuesta** (esperamos a: tercero) y **Archivar** (nos toca).
- Se crea la primera vez que hace falta, como guía normal del tipo, editable después como
  cualquier otra. Los asuntos abiertos de ese tipo reciben sus hitos por la vía de siempre
  (`js/hitos-sincronizar.js`).
- Así ningún asunto se queda sin hitos, y `ladoDelAsunto` ya no necesita mirar el estado manual.

### 6. Fuera los estados escritos a mano

- Desaparecen: el desplegable de estado al crear y editar un asunto, la rejilla de estados de
  Ajustes y la marca Administración de cada estado (la de la fila 104, punto 4). El filtro por
  estado de la lista pasa a filtrar por montón (Administración / terceros / esperando).
- **Paso de los asuntos abiertos, una sola vez y sin preguntar:**
  - Si el estado manual tenía la marca de terceros (`espera`) → «Esperando a» tercero en su hito
    actual, con el nombre del estado viejo como motivo.
  - Si no → nada; se queda en su hito actual.
  - El estado viejo **no se borra de la ficha** (se deja `situacion` quieta, solo se deja de
    leer), por si hay que deshacer. `estados.json` tampoco se borra.
- `Hitos.estadoDelAsunto` sigue siendo la única que decide el estado; que devuelva lo del punto 1.
- Revisa quién más lee `ficha.situacion` o `App.E.estados` (buscador, Cuentas, "Qué me toca",
  Duplicados, recurrentes, plantillas con hueco de estado) y pásalo al hito actual.

### 7. Botón «Estamos en este paso»

- Los asuntos abiertos de antes están más avanzados de lo que dicen sus hitos.
- En la lista de hitos de la ficha y en la mesa de cada hito, un botón **«Estamos en este
  paso»**. Marca como hechos, de una sola escritura, todos los hitos anteriores que sigan sin
  terminar (en el camino elegido; las preguntas sin responder se quedan como están y no se
  saltan), con nota en su historial «Dado por hecho al situar el asunto (<fecha>, <quién>)».
- Aviso verde: «Asunto en el paso N: <título>». Nada se borra; se puede deshacer hito a hito.

### 8. Archivar y reabrir

- Al archivar no se toca ningún hito. El estado es **«Archivado»**.
- En el ARCHIVO, la tarjeta dice «Archivado · se quedó en: <título del hito actual>», o
  «Archivado · terminado» si no quedaba ninguno.
- Al reabrir, el asunto vuelve al hito en el que estaba.

## Ficheros

A tocar, con pocas líneas cada uno:

- `js/hitos-a-quien.js` — hito actual con título y posición; marca del paso; «Esperando a»;
  quitar la rama del estado manual.
- `js/hitos.js` — `Hitos.estadoDelAsunto`; «Estamos en este paso».
- `js/hitos-sincronizar.js` — que la marca del paso llegue a los hitos.
- `js/guias.js`, `js/guias-plegado.js` — la marca «Nos toca / Esperamos a…» del paso.
- `js/asuntos-lista.js` — texto del hito en la tarjeta, «Esperando a…», filtro por montón.
- `js/ficha-asunto.js` (y `js/ficha-tarjetas.js` si la cabecera vive ahí) — texto del hito,
  botones «Esperando a…» / «Ya ha llegado».
- `js/hitos-panel-lista.js`, `js/hito-mesa.js` — «Estamos en este paso».
- `js/asuntos-nuevo.js`, `js/asuntos-editar.js` — quitar el estado.
- `js/ajustes.js` (o donde viva la rejilla de estados) — quitarla.
- `js/ficha-archivo.js`, `js/asuntos-archivar.js` — el texto del ARCHIVO.
- `js/documentos.js` o donde entre un documento nuevo en un asunto — quitar «Esperando a».
- Los que lean `situacion` o `App.E.estados` (punto 6).
- El CSS de la lista y de la ficha.

Nuevos:

- `js/estado-migracion.js` — el paso único del punto 6, con marca en `_GESTOR` para no repetirse.
- `pruebas/el-hito-es-el-estado.mjs` — sin navegador: texto «Paso N de M»; marca del paso por
  encima del responsable; «Esperando a» que manda y se quita al llegar un documento; guía mínima;
  paso de un estado de terceros; «Estamos en este paso» sin saltarse una pregunta; archivado con
  «se quedó en».

Antes de colgar algo de `App` o de `Hitos`, comprueba que el nombre no está cogido.

## Al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: sustituir la línea «El asunto se coloca solo en
  «Pendiente de Administración»…» por una que diga que el estado del asunto es su hito actual,
  que cada paso de la guía dice a quién le toca, y que ya no hay estados escritos a mano.
- `docs/CONTEXTO-CORTO.md`, sección 8: quitar «coordinar tipos de asunto y estados» → «coordinar
  tipos de asunto».
- `docs/contexto/HITOS-Y-GUIAS.md`: sustituir el apartado de la fila 104 por este.
- `docs/ESTADO-POR-EL-HITO.md`: una línea arriba: «Sustituido por `docs/EL-HITO-ES-EL-ESTADO.md`».
- `docs/COLA.md`: fila 129 HECHA.
- `docs/HISTORIA.md`: una entrada corta con el porqué (los dos sistemas que se pisaban).
- Mensaje a Francisco: tres frases. Qué verá en la tarjeta, dónde se marca en la guía a quién le
  toca cada paso, y que use «Estamos en este paso» para poner al día los asuntos abiertos.
