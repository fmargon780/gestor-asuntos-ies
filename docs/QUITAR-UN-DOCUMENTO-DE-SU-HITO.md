# Quitar un documento de su hito, desde cualquier sitio (fila 282)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1X48zXN9CfVkipXB9MfTLsiEpZ0hduPwK/view?usp=drivesdk;
la captura está en la misma carpeta de Drive).

## Qué pasó

Francisco, desde la ficha de un asunto: «Ahora mismo podemos asociar un documento a un hito, pero
no podemos desasociarlo. Sería conveniente poder hacerlo».

**Ya se puede, pero está escondido.** Hoy hay dos sitios:

- En la mesa del hito al que pertenece el documento: «⋯» → «Quitar del hito»
  (`js/hitos-documento-menu.js`, `quitarDelHito`).
- En la tarjeta de documentos de la ficha: botón «Asociar a un hito» → «Ninguno»
  (`js/ficha-documentos.js`, `accionAsociar(null)`).

En la captura Francisco está en la mesa del hito 1 y el documento es del hito 2. Ahí el documento
sale en el apartado «De otros hitos», en una fila de solo ver (`filaAjenaHTML` de
`js/hito-mesa-documentos.js`): «Abrir» y «Enviar ▾», sin «⋯». Desde esa pantalla no hay forma de
quitarlo ni de traerlo. Y «Ninguno» no se entiende como «quitar».

Al mirarlo han salido dos cosas más:

- **Cada sitio trata la tarea de una manera.** Asociar un documento a un hito puede marcar sola una
  tarea de ese hito (la de «reunir un documento», `Hitos.marcarReunirPorDocumento`). Al quitarlo
  desde la ficha o desde «Añadir documento → uno que ya está en la carpeta»
  (`js/hitos-documentos.js`), la tarea se desmarca sola y sin avisar. Al quitarlo desde el «⋯» de
  la mesa, se queda marcada y tampoco se dice.
- **Un documento puede acabar en dos hitos.** En la mesa, las filas «De otros hitos» y «En la
  carpeta, sin hito» llevan casilla. Si se marca una y se pulsa «Mover a otro hito» en la barra de
  seleccionados, `moverAOtroHito` lo quita del hito de la mesa (donde no está) y lo añade al
  destino: queda en su hito de antes y en el nuevo. Confírmalo con la prueba nueva antes de
  arreglarlo.

## Qué quiere Francisco

1. En la mesa de un hito, los documentos «De otros hitos» tienen su «⋯», con «Traer a este hito» y
   «Quitar de su hito».
2. Ahí mismo, los documentos «En la carpeta, sin hito» tienen «⋯» con «Traer a este hito».
3. En la ficha, la opción «Ninguno» pasa a llamarse «Quitar del hito».
4. **La tarea, igual en todos los sitios:** al quitar un documento de un hito, la tarea que se
   marcó sola con él **se queda marcada**, y el aviso verde lo dice y lleva un botón «Desmarcar».
   La app no deshace nada sin que se vea.

## Palabras de este documento

- **Tarea marcada por el documento**: la línea del guion del hito con `reunir === 'documento'`,
  `hecho` y `documento === <nombre del fichero>` (la que busca hoy
  `Hitos.desmarcarReunirPorDocumento`, `js/hitos-guion.js`). Las tareas que se marcan por acción
  (`marcarGuionPorAccion`: generar, registrar, comunicar, añadir) no guardan el documento: no
  entran aquí y no se tocan.
- **Gemelos**: el borrador en Word y el «SIN SELLAR» del mismo documento
  (`HitoMesaDocumentos.agrupar` / `claveGemelo`). En la mesa se ven dentro de la fila del
  principal.

## Qué hay que hacer

### 1. Una sola función para sacar un documento de un hito

Módulo nuevo y pequeño, `js/hitos-sacar-documento.js` (`window.HitosSacarDocumento`). No envuelve
nada: lo llaman los sitios del punto 2. Con esto:

- **`quitar(a, nombres)`** — deja cada documento sin hito.
  - Lee los hitos del asunto (`Hitos.hitosDe(a.nombre)`) y mira en **todos** en cuáles está
    apuntado el documento, no solo en el que diga quien llama. Así se limpia también el que ya
    esté en dos hitos.
  - Con el documento salen sus gemelos apuntados en ese mismo hito.
  - Antes de quitar, apunta qué tarea tenía marcada ese documento en cada hito (función nueva de
    solo leer en `js/hitos-guion.js`, por ejemplo `Hitos.tareaMarcadaPorDocumento(a, hito,
    nombre)`, que devuelve la línea o `null`).
  - Quita con `Hitos.quitarDocumento`. **No llama** a `HitosRequisitos.desmarcarPorDocumento`.
  - Avisa (punto 3).
- **`mover(a, nombres, hitoDestino)`** — deja cada documento solo en `hitoDestino`.
  - Lo mismo que `quitar` en todos los hitos que no sean el destino, con sus gemelos.
  - Después `Hitos.anadirDocumento` en el destino (el documento y los gemelos que estaban
    apuntados) y, como hace hoy la ficha, `HitosRequisitos.marcarPorDocumento` en el destino (no
    crítico: si falla, el documento ya está movido).
  - Si el documento ya estaba solo en el destino, no hace nada.
  - Avisa (punto 3).
- Reglas de siempre: rojo con `U.fallo` si falla quitar o añadir (lo principal); ámbar con
  `U.accesorio` si falla lo de después. Al terminar, `HitosPanel.programarRepintado()` y, si la
  tarjeta de documentos de la ficha está a la vista, `FichaDocumentos.pintar(a)`.
- No hace falta mirar `SoloConsulta` aquí: todo lo pide un botón, y las carpetas ya van protegidas.

### 2. Los sitios que la usan

Todos pasan por el módulo nuevo. Ninguno llama ya por su cuenta a `Hitos.quitarDocumento` para
desasociar.

1. **Ficha, botón «Asociar a un hito»** (`js/ficha-documentos.js`, `accionAsociar`).
   - El botón conserva su texto.
   - Si el documento tiene hito: la primera opción del menú es «Quitar del hito», después una raya
     (`{ raya: true }`) y después los hitos, con «✓» en el suyo.
   - Si no tiene hito: solo los hitos. Ya no sale «✓ Ninguno».
   - Elegir otro hito → `mover`. «Quitar del hito» → `quitar`.
2. **Mesa, «⋯» de un documento del hito → «Quitar del hito»** (`js/hitos-documento-menu.js`,
   `quitarDelHito`) → `quitar`. El texto de la opción no cambia. `desplegarAlAbrir` se conserva.
3. **Mesa, «Mover a otro hito»** (del «⋯» y de la barra de seleccionados;
   `HitoMesaDocumentos.moverAOtroHito`) → `mover`.
   - Arregla el caso de los dos hitos: cada documento sale del hito en el que esté de verdad.
   - Si entre los seleccionados hay alguno que no es del hito de la mesa, el desplegable de
     destinos lleva también, el primero, «Este hito (N · título)».
4. **Mesa, filas «De otros hitos» y «En la carpeta, sin hito»** (`filaAjenaHTML` y `otrosHTML`,
   `js/hito-mesa-documentos.js`): un «⋯» al final de las acciones, con el mismo aspecto que el de
   las filas propias, pero con una clase suya para que `HitosDocumentoMenu.engancharTodos` no lo
   coja.
   - Solo sale cuando sale el «⋯» de las filas propias (la mesa abierta para trabajar: el
     `abierto` que ya recibe `filasHTML`; nunca en modo consulta ni en un asunto del ARCHIVO).
   - «De otros hitos»: «Traer a este hito», raya, «Quitar de su hito» (con la clase
     `ficha-menu-peligro`, como «Quitar del hito»).
   - «En la carpeta, sin hito»: solo «Traer a este hito».
   - Si el hito de la mesa es de clase `decision` (los que `moverAOtroHito` ya descarta como
     destino), no sale «Traer a este hito».
   - `otrosDelAsunto` tiene que devolver también de qué hito viene cada fila (`idHito`), para el
     aviso. Añadir un dato a lo que devuelve; no cambiar lo que ya devuelve.
   - «Traer a este hito» → `mover(a, [nombre], h)`. «Quitar de su hito» → `quitar(a, [nombre])`.
   - El menú se monta en el módulo nuevo (por ejemplo `HitosSacarDocumento.engancharAjenos(fila,
     a, h, hitos)`, llamado desde `enganchar`), para no engordar `js/hito-mesa-documentos.js`.
5. **«Añadir documento → uno que ya está en la carpeta»** (`js/hitos-documentos.js`, `abrir`): los
   que se desmarcan en la lista → `quitar`. Los que se marcan siguen como hoy.

### 3. Los avisos

Verdes (`U.aviso(texto, 'bueno', { boton, alPulsar })`, que ya dura 8 segundos con botón). El
título de la tarea, recortado a 60 caracteres con «…». El hito se nombra «N · título», como en la
etiqueta de «De otros hitos».

| Caso | Texto | Botón |
|---|---|---|
| Quitado, sin tarea marcada por él | «Quitado del hito.» | — |
| Quitado, con tarea | «Quitado del hito. La tarea «…» sigue marcada.» | «Desmarcar» |
| Movido desde otro hito, sin tarea | «Movido a «N · título».» | — |
| Movido desde otro hito, con tarea | «Movido a «N · título». En el hito de antes, la tarea «…» sigue marcada.» | «Desmarcar» |
| No tenía hito y se asocia | «Asociado a «N · título».» | — |
| Varios a la vez | «Movidos N documentos a «N · título».» y, si alguno dejó tarea, «Siguen marcadas M tareas de los hitos de antes.» | «Desmarcar» (todas) |

«Desmarcar» llama a `HitosRequisitos.desmarcarPorDocumento(clave, idHito, nombre)` por cada tarea
apuntada y repinta. Esa función ya encuentra la línea por el nombre del documento aunque el
documento ya no esté en el hito.

El aviso «Marcado: …» que da hoy `marcarReunirPorDocumento` en el hito de destino sigue saliendo
igual, aparte.

## Qué NO se toca

- Asociar un documento a un hito sigue marcando sola la tarea de reunir, como hoy.
- Las tareas marcadas por acción (generar, registrar, comunicar, añadir).
- El documento: ni se borra, ni cambia de nombre, ni se mueve de carpeta. Solo cambia a qué hito
  está apuntado en `hitos.json`.
- Cambiar el nombre de un documento apuntado (`js/documentos-guardar.js`): su quitar-y-añadir es
  un cambio de nombre, no un desasociar, y se queda como está.
- Los nombres de las funciones `Hitos.quitarDocumento` y `Hitos.anadirDocumento`, y lo que hacen.
- «Pasar a versiones previas» y las versiones previas plegadas de la mesa.
- La lista de hitos de la izquierda y la tarjeta pequeña de documentos.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/HITO-MESA.md`,
  `docs/contexto/DOCUMENTOS.md`, `js/hito-mesa-documentos.js`, `js/hitos-documento-menu.js`,
  `js/ficha-documentos.js` (de la línea 55 a la 190), `js/hitos-documentos.js`,
  `js/hitos-guion.js` (de la 335 al final) y `js/ficha-menus.js` basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas.
- Antes de colgar `HitosSacarDocumento` o una función nueva de `Hitos`, mira que el nombre esté
  libre.
- Un solo cuadro a la vez (`U.preguntar`): el de «Mover a otro hito» sigue siendo el único.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (hito, tarea, documento). Si ese
  documento tiene tabla para estas acciones, añade «Traer a este hito» y «Quitar de su hito».
- Rama `fila-282`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs quitar-documento
  asociar-documento hito-mesa documentos-desde-el-hito una-sola-lista requisitos-de-hito`); la
  pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- Nuevo: `js/hitos-sacar-documento.js`.
- Nuevo: `pruebas/quitar-documento-del-hito.mjs`, con disco de mentira:
  1. Documento en el hito 2 con su tarea de reunir marcada por él. `quitar`: el documento no está
     en ningún hito, la tarea **sigue marcada**, y lo que devuelve trae esa tarea para el aviso.
  2. Lo mismo y después «Desmarcar»: la tarea queda sin marcar.
  3. `mover` del hito 2 al 1: está solo en el 1; la tarea del 2 sigue marcada; la tarea de reunir
     del 1, si la hay, se marca.
  4. Documento sin hito, `mover` al hito 1: queda asociado; no hay tarea «de antes».
  5. Documento que ya está en dos hitos (se monta a mano en `hitos.json`): `quitar` lo saca de los
     dos; `mover` lo deja solo en el destino.
  6. Con gemelos apuntados (el PDF y su Word): salen o se mueven juntos.
  7. El caso de la barra de seleccionados: marcar una fila «De otros hitos» y «Mover a otro hito»
     deja el documento en un solo hito. (Primero comprueba que hoy falla.)
  8. Con navegador: en la mesa de un hito, la fila «De otros hitos» lleva «⋯» con «Traer a este
     hito» y «Quitar de su hito»; la de «sin hito», solo «Traer a este hito»; en modo consulta no
     sale ninguno. En la ficha, el menú de «Asociar a un hito» lleva «Quitar del hito» si el
     documento tiene hito y no lleva «Ninguno» en ningún caso.
- Cambiar: `js/ficha-documentos.js`, `js/hitos-documento-menu.js`, `js/hito-mesa-documentos.js`,
  `js/hitos-documentos.js`, `js/hitos-guion.js` (solo la función de leer), `index.html`,
  `js/novedades.js` y el CSS del «⋯» de las filas ajenas si hace falta.
- Pruebas que cambian: `pruebas/asociar-documento-a-hito.mjs` (el texto «Ninguno» y la tarea, que
  ya no se desmarca sola) y cualquiera de las de hitos que compruebe que la tarea se desmarca
  sola al quitar el documento.
- Copia de demostración: si ningún asunto de `js/demo/` trae un hito con una tarea de reunir un
  documento y otro hito con un documento apuntado, añádelo, para que el revisor pueda seguir la
  lista de abajo.
- Al terminar: `docs/CONTEXTO-CORTO.md` (sección 5: cambiar «cada documento, asociable a un hito»
  por una línea que diga que se asocia, se trae y se quita desde la ficha y desde la mesa de
  cualquier hito, y que la tarea se queda marcada con «Desmarcar»; sin alargar),
  `docs/contexto/HITO-MESA.md`, `docs/contexto/DOCUMENTOS.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que quitar un documento de su hito ya se podía, pero solo desde la pantalla de
ese hito («⋯» → «Quitar del hito») o desde la ficha («Asociar a un hito» → «Ninguno»); que ahora
también se puede desde la pantalla de cualquier otro hito, con el «⋯» de los documentos «De otros
hitos» («Traer a este hito» o «Quitar de su hito»); que en la ficha «Ninguno» se llama ahora
«Quitar del hito»; y que la tarea que se marcó sola con ese documento se queda marcada, con un
aviso verde que lleva «Desmarcar».

Y la respuesta para quien mandó el aviso, en una línea: «Ya puedes quitar un documento de su hito
desde la pantalla de cualquier hito: en su fila, «⋯» → «Quitar de su hito», o «Traer a este hito»
si lo que quieres es cambiarlo.»

## Cómo sabemos que está bien

En la copia de demostración, en un asunto con al menos dos hitos. Aquí se llaman hito A (el que
tiene una tarea de reunir un documento) y hito B (otro cualquiera). El documento se llama D.

1. Abrir la mesa del hito A → «Añadir documento» → uno que ya está en la carpeta → marcar D →
   «Apuntar». D sale en «Documentos del hito» y la tarea de reunir queda marcada (aviso «Marcado:
   …»).
2. Abrir la mesa del hito B. D sale en «De otros hitos», con la etiqueta del hito A, y su fila
   lleva «Abrir», «Enviar ▾» y «⋯».
3. «⋯» → se leen «Traer a este hito» y «Quitar de su hito».
4. Pulsar «Quitar de su hito»: aviso verde «Quitado del hito. La tarea «…» sigue marcada.» con el
   botón «Desmarcar». D pasa al apartado «En la carpeta, sin hito».
5. Sin pulsar «Desmarcar», abrir la mesa del hito A: D ya no está en sus documentos y la tarea de
   reunir sigue marcada.
6. Volver a apuntar D al hito A, ir a la mesa del hito B, «⋯» → «Quitar de su hito» y esta vez
   pulsar «Desmarcar» en el aviso. En la mesa del hito A la tarea está sin marcar.
7. En la mesa del hito B, D está en «En la carpeta, sin hito»: su «⋯» solo trae «Traer a este
   hito». Pulsarlo: aviso «Asociado a «N · título del hito B».» y D sube a los documentos del
   hito.
8. Abrir la mesa del hito A: D sale en «De otros hitos». «⋯» → «Traer a este hito»: aviso «Movido
   a «N · título del hito A».». D está en el hito A y ya no en el B.
9. En la mesa del hito B, marcar la casilla de D (que está en «De otros hitos») → «Mover a otro
   hito»: el desplegable lleva, el primero, «Este hito (…)». Elegir un tercer hito si lo hay (o
   este) → «Mover». D sale en un solo hito: mirando las mesas de los demás, en todas está en «De
   otros hitos» con la misma etiqueta.
10. Volver a la ficha del asunto, tarjeta «Documentos»: en la fila de D, «Asociar a un hito» abre
    un menú con «Quitar del hito» arriba, una raya y los hitos, con «✓» en el suyo. No hay
    ninguna opción «Ninguno».
11. Pulsar «Quitar del hito»: aviso verde «Quitado del hito.» (con la frase de la tarea y
    «Desmarcar» si la había marcado). La fila de D ya no enseña ningún hito debajo del nombre.
12. Volver a abrir «Asociar a un hito» en D: ahora solo salen los hitos, sin «Quitar del hito».
13. En la mesa del hito al que pertenezca un documento, su «⋯» → «Quitar del hito» da el mismo
    aviso verde que el punto 4.
14. Marcar «En este ordenador, solo consultar» (o abrir el asunto en modo consulta): las filas
    «De otros hitos» y «sin hito» no llevan «⋯».
15. (Lo cubre la prueba `quitar-documento-del-hito`, no el revisor.) Un documento que estaba en
    dos hitos queda en uno solo tras «Traer a este hito», y en ninguno tras «Quitar».
