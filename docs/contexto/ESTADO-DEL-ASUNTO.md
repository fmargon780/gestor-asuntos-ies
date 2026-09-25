# El estado del asunto es su hito actual

Documento hijo de `docs/CONTEXTO.md` (fila 129, 24-sep-2026). Lo común de los hitos y las guías
está en `docs/contexto/HITOS-Y-GUIAS.md`.

Encargo: `docs/EL-HITO-ES-EL-ESTADO.md`.

Sustituye a la fila 104 (`docs/ESTADO-POR-EL-HITO.md`). **No hay estados escritos a mano**: el
estado del asunto es su hito actual, y de él sale solo en qué montón va (**Pendiente de
Administración** / **Pendiente de terceros**, los paneles `data-vista` `departamento`/`espera`).
Conviven cero sistemas: `ficha.situacion` se queda quieta en `asuntos.json` (no se lee) y
`estados.json` no se borra (sigue cargándose en `App.E.estados`), por si hay que deshacer.

- **El único que decide**: `Hitos.estadoDelAsunto(hitos, ajustes, contexto)` (`js/hitos.js`), que
  llama a `Hitos.ladoDelAsunto` (`js/hitos-a-quien.js`, pura). Devuelve `{ lado, quien, hito,
  desde, titulo, n, m, esperando, listo, sinHitos, texto }`. `texto`: «Paso N de M · título»
  (M = visibles sin «solo informativo», «no aplica» ni del tipo anterior; fila 154: es la única
  cuenta, `Hitos.numerados`, que usan también la pestaña «Hitos N/M» de la ficha y la tira y el
  «Hito N de M» de la mesa, donde un informativo sale sin número, «i ·»), «Listo para archivar»
  o «Sin hitos» (sin hitos → Administración). `App.ladoDe(a)` la llama con lo último leído.
- **El hito actual** (`Hitos.aQuienLeToca`): el primer hito visible ni `hecho` ni `noaplica`,
  saltando los `soloInformativo` y las preguntas respondidas. **Siempre ese** (fila 162,
  `docs/ESTADO-SIGUE-A-LOS-HITOS.md`: ya no «gana Administración» si hay otro en curso). Pregunta
  sin responder: Administración. Lleva la etiqueta fija «Paso actual» (`.etiqueta-paso-actual`)
  en la lista de hitos y en la mesa.
- **A quién le toca**, por este orden: `esperandoA` del hito (puesto a mano) → la marca del paso
  (`toca: 'nos' | 'espera'`, `tocaA`) → el responsable con `Hitos.esDeAdministracion(id,
  ajustes)`, que sigue siendo el ÚNICO sitio que dice quién es Administración (sin responsable,
  sí; papel fijo, no; persona del centro, su casilla "Administración" de Ajustes › Hitos, de
  partida `yo` y `companero`; nombre suelto, no). Papeles en la tarjeta: "Tercero", "Familia",
  "Relacionado".
- **La marca del paso** (`js/guias-toca.js`): en el editor de la guía, dentro de «Responsable, a
  quién le toca y plazo», «Según el responsable» / «Nos toca» / «Esperamos a…» (papeles fijos y
  responsables no de Administración). Se ve en la fila cerrada del acordeón («Nos toca»,
  «Espera: Familia»). La heredan los hitos: `pasoAHito` la copia, y `Hitos.pasosQueFaltan`
  (`js/hitos-sincronizar.js`) la pone al día en los hitos que ya existen (`retocados`). El viejo
  selector «Estado del asunto» del paso ya no sale (`estadoAsunto` se conserva, sin uso).
- **«Esperando a…»** (`js/estado-hito.js`), en la cabecera de la ficha: a quién (misma lista) y
  un motivo. Se guarda en el hito actual (`esperandoA`, `esperandoDesde`, `esperandoMotivo`,
  `esperandoFicheros`: los ficheros que había en la carpeta), por `Hitos.cambiar`, nunca en la
  ficha; solo uno a la vez. **Vale solo mientras su hito sea el actual** (fila 162):
  `Hitos.limpiarEsperasViejas`, dentro de cada `Hitos.cambiar`, la quita de cualquier otro hito.
  **Sin espera a mano, sale sola la del responsable** del hito actual si no es de Administración
  (ni «Nos toca», ni pregunta): `esperando.auto`, «Esperando a Secretaría», sin «Ya ha llegado»
  ni se guarda (es el paso). Además, se quita: al llegar un fichero nuevo a la carpeta
  (`EstadoHito.revisarLlegadas`, al abrir la ficha y por `Gestor.alRefrescar` cada minuto como
  mucho, solo en los asuntos en espera; aviso verde con «Ir al asunto»), al marcar ese hito
  `hecho` o `noaplica` (`Hitos.marcar`), al situar el asunto, o a mano con «Ya ha llegado».
  Tras mandar un correo, el aviso ofrece «Dejar el asunto esperando a la familia / el tercero».
- **La marca en pantalla** (`EstadoHito.marcaHTML`, `css/estado-hito.css`): `.marca-hito`
  (azul; violeta si es de terceros; verde si está listo; gris sin hitos) en la tarjeta de Asuntos
  abiertos (en lugar del desplegable de estado) y en la cabecera de la ficha (en lugar del
  desplegable, con «Esperando a…» / «Ya ha llegado» al lado). Pulsarla abre la mesa de ese hito
  (`EstadoHito.abrirHito`). Con espera, `.marca-esperando`: «Esperando a Familia desde el 24-sep».
  La cabecera se pone al día sola por `Hitos.alCambiar` y `Hitos.alLeer` (nuevo: cada lectura de
  `hitos.json` avisa), solo si cambia (la firma incluye, desde la fila 162, quién espera y si es
  automático: cambiar el responsable también la repinta).
- **El filtro** de Asuntos abiertos filtra por montón (`App.FILTROS_MONTON`: nos toca, esperan a
  terceros, con «Esperando a…», listos para archivar, sin hitos); ordenar por «Paso del asunto»
  va por `n/m`.
- **«Saltar a este paso»** (antes «Estamos en este paso», fila 162; en la fila de cada hito y en
  el ··· de la mesa, solo si hay algo antes sin terminar y no es el actual): `Hitos.situarEn(clave, id)` → `Hitos.situarLista` (pura) da por
  hechos, en una escritura, los visibles anteriores sin terminar (las preguntas se quedan como
  están; tras una sin responder no hay nada visible), con la nota «Dado por hecho al situar el
  asunto (<fecha>, <quién>)», y deja ese hito en curso. Aviso «Asunto en el paso N: <título>».
- **La guía mínima**: un tipo sin guía recibe, la primera vez que hace falta (crear sus hitos),
  Tramitar (nos toca) · Esperar respuesta (esperamos al tercero) · Archivar (nos toca), guardada
  como guía normal (`GuiasDelCentro.asegurarGuia`, que relee antes y respeta la que haya).
- **El paso único** (`js/estado-migracion.js`): al entrar, una vez (marca
  `_GESTOR/estado-migrado.json`, fuera de los dieciocho), en una escritura de `hitos.json`: los
  asuntos abiertos sin hitos reciben los de su guía (o la mínima) con sus `pasosHechos`; los que
  tenían un estado con la marca `espera` quedan «Esperando a» tercero con el nombre del estado
  viejo como motivo. Sin tipo reconocible, se quedan sin hitos.
- **Al archivar** no se toca ningún hito; `js/hitos-archivo.js` apunta antes en la ficha
  `seQuedoEn` (título del hito actual) y `terminado`, que pasan al índice del ARCHIVO. La tarjeta
  del ARCHIVO dice «Archivado · se quedó en: …», «Archivado · terminado» o, en los de antes,
  «Archivado». Al reabrir, los hitos vuelven del historial tal cual.
- Fuera también: el desplegable de estado de Nuevo asunto, la rejilla "Estados del asunto" de
  Ajustes (con su casilla Administración) y el paso a un estado de `js/correo.js`. Desde la fila
  132, también su código (`App.cargarEstados`, `App.E.estados`, `App.ponerEstado`, la tabla de
  Ajustes y devolver un estado de la papelera); un archivado de antes enseña su estado viejo como
  dato histórico («Archivado · RESUELTO»). El hueco de
  plantilla del estado, "Duplicados" y el archivo de un tercero enseñan el texto del hito.
- La lista no lee `hitos.json` en cada repintado: `Hitos.ultimosLeidos()`, relectura por
  `window.Gestor.alRefrescar` cada dos minutos como mucho, y `Hitos.alCambiar`. Solo repinta si
  algún asunto cambia de montón, de "quién lo tiene" o de paso.

Se comprueba con `pruebas/el-hito-es-el-estado.mjs` y `pruebas/estado-por-el-hito.mjs`.
