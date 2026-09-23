# Las guías del procedimiento, los hitos de un asunto, "Qué me toca" y "Cuentas"

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar las guías, los hitos de un asunto o las pantallas "Qué me toca"/"Cuentas". El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Las guías del procedimiento

Cada tipo de asunto puede llevar una lista de pasos, con título y explicación (negrita, viñetas,
enlaces), en el orden del trámite, guardados en `_GESTOR/guias.json`.

**Desde el 17-sep-2026 (fila 26, `docs/HITOS-SON-LA-GUIA.md`) los pasos de la guía SON los hitos
del asunto** (ver la sección siguiente): la guía ya no se lee como texto con casillas dentro de
la ficha, solo se escribe y se edita. `pasosHechos`/`pasosElegidos` (en `asuntos.json`) solo se
usan ya como entrada, una vez, al importar lo marcado de un asunto viejo a sus hitos; no se vuelven
a tocar después.

Se escriben desde Ajustes y desde la ficha de un asunto abierto. El botón lo pone
`js/ficha-asunto.js` (`pintarGuia`, que ahora solo pinta el `<p class="nota" id="ficha-guia-nota">`
del final de `#ficha-guia`), pero quien guarda es `js/guias-enganche.js`, vía
`window.GuiasDelCentro.escribir(tipo)`. El fichero se relee justo antes de abrir el cuadro.

Un paso puede ser una PREGUNTA con opciones, cada una con sus propios pasos: eso se escribe en el
cuadro de la guía; dentro de un asunto, ya como hitos, solo se ve la rama elegida.

- **Preguntas dentro de las respuestas, sin límite de niveles** (fila 95, 23-sep-2026,
  `docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md`; antes, una sola bifurcación por paso). Un paso de
  una opción es un paso entero (mismos campos que uno de arriba: responsable, plazo, normativa…;
  `normalizarOpciones` ya no los recorta) y puede ser pregunta. Un paso-pregunta, a cualquier
  nivel, no lleva requisitos, comunicación, normativa ni formularios (`Guias.normalizar` los
  vacía). En el editor, un paso de opción que es pregunta sale como una línea con la marca
  «pregunta» y **«Entrar»**, que en el mismo cuadro pasa a enseñar los pasos de esa opción, con
  una línea de camino pulsable (`Guía de X › pregunta › opción`) y «← Volver»; `editar()` trabaja
  sobre `nivel` (lo que se ve) y guarda `pasos` (la guía entera) esté donde esté, y siempre
  `recoger()` antes de moverse. `recoger()` actualiza los objetos por su id en vez de rehacerlos,
  para no perder lo que no se ve. El plazo solo apunta a un paso del mismo nivel. La biblioteca
  sigue sin admitir preguntas. Dentro de un asunto: `Hitos.visibles` corta la lista ENTERA en
  cualquier pregunta sin responder, a cualquier profundidad; cambiar una respuesta de arriba poda
  todo el subárbol (`podar`, `js/hitos-archivo.js`) y `Hitos.huerfanos` pliega lo trabajado de
  cualquier nivel. Prueba: `pruebas/preguntas-anidadas.mjs`.
- Las dos ramas se pintan desde el principio en el cuadro de editar, y solo se enseña la elegida.
- Los identificadores viajan en el `data-id` del recuadro, no por su posición.
- Al leer el cuadro de escribir la guía, pedir solo los hijos directos (`:scope >`).
- `Guias.vista(pasos, [], false)` sigue sirviendo de recordatorio sin casillas al crear un asunto
  (`#guia-nuevo`, `js/guias-enganche.js`): es el único sitio, aparte del propio cuadro de editar,
  que todavía la pinta. `Guias.cuandoSeElige` ya no tiene quien la llame.
- **"Lo que hay que reunir"** (18-sep-2026, fila 59, `docs/REQUISITOS-DE-HITO.md`): un paso (o un
  subpaso, dentro de una opción de una pregunta) puede llevar una lista opcional de casillas —
  `requisitos: [{ id, texto, clase: 'documento'|'dato', obligatorio }]` —, normalizada por
  `Guias.normalizarRequisitos` (cualquier `clase` que no sea `'documento'` se convierte en `'dato'`;
  una fila sin texto no sobrevive). Nunca en un paso-pregunta: se resuelve eligiendo una opción, no
  con una casilla, y son sus subpasos quienes pueden llevar requisitos propios.
  `js/guias-requisitos.js` (nuevo, aparte para no engordar más `js/guias.js`) pinta la sección
  plegable **"Lo que hay que reunir"** dentro del editor de cada paso/subpaso
  (`GuiasRequisitos.bloqueHTML`) y la lee de vuelta (`GuiasRequisitos.leer`), con el mismo patrón
  imperativo del resto del editor: cada `+ Añadir`/quitar/mover fila hace `recoger(); mutar el
  array; pintar();`. `js/guias.js` solo llama a las dos funciones, y en `recoger()` copia lo leído a
  `pasos[i].requisitos` (o al del subpaso que toque).
- **"Comunicación de este paso"** (18-sep-2026, fila 60, `docs/COMUNICAR-DESDE-EL-HITO.md`): un
  paso (o un subpaso; nunca un paso-pregunta, mismo criterio que arriba) puede llevar su propio
  texto de correo y/o de Séneca, aparte de la plantilla general del tipo —
  `comunicacion: { correo: {asunto, cuerpo}, seneca: {asunto, cuerpo} }` —, normalizado por
  `Guias.normalizarComunicacion` (un canal "vacío" es el que tiene el cuerpo en blanco, aunque
  tenga asunto). **En `hitos.json` no se guarda copia**: el hito lo lee de la guía de su tipo por
  `origenGuia` en el momento de pulsar "Comunicar" (así, si Francisco cambia el texto del paso, los
  asuntos vivos usan el nuevo). `js/guias-comunicacion.js` (nuevo) pinta la sección plegable, con
  dos pestañas (Correo/Séneca) y, en cada una, asunto + el mismo campo de texto con "Insertar
  hueco" que ya montaba el cuadro de una plantilla (`PlantillasAjustes.campoDeTextoHTML`/
  `engancharCampoDeTexto`, sacados de `js/plantillas-ajustes.js` para reutilizarlos aquí sin
  escribir un segundo editor). A diferencia de `js/guias-requisitos.js`, son solo campos de texto:
  no hace falta `recoger();mutar;pintar()` en cada tecla, `GuiasComunicacion.leer(caja, idPaso)` los
  lee en el propio `recoger()` del paso, como el título o el cuerpo.
- **Un `<details>` recién repintado nace cerrado** (18-sep-2026, fila 60, encontrado en el navegador
  de verdad): "+ Añadir"/quitar/mover una fila de `.paso-requisitos`, o cualquier tecla que dispare
  un `recoger();mutar;pintar()` del paso, reconstruye `#guia-pasos` entero y con él el `<details>`
  de `.paso-extra`/`.paso-requisitos`/`.paso-comunicacion`, que se cerraba solo justo después de
  tocarlo. `pintar()` apunta, antes de vaciar la caja, qué `<details>` estaban abiertos
  (`detallesAbiertos`, clave: posición del paso + id del subpaso + su clase) y los vuelve a abrir
  al repintar (`restaurarAbierto`, llamado tanto desde `pintar()` como desde `cajaDeOpciones()`).

Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.

### Documentos desde el hito (23-sep-2026, fila 102, `docs/DOCUMENTOS-DESDE-EL-HITO.md`)

Primera tanda de que el hito sea la mesa de trabajo del asunto.

- **La unión plantilla ↔ paso**: campo `plantillasDocumento: [id]` (los `id` de `plantillas.json →
  documentos`) en un paso, un subpaso o un modelo de la biblioteca; nunca en un paso-pregunta
  (`Guias.normalizar` lo vacía). Se escribe en «Documentos de este paso» (`js/guias-documentos.js`,
  buscador con casillas agrupadas por tipo; el catálogo se lee una vez antes de abrir el cuadro,
  `GuiasDocumentos.precargar`). Un id borrado sale tachado y se quita al guardar. Entra en la
  comparación de la biblioteca («Documentos»), se copia al traer un modelo y al guardarlo. El hito
  no guarda copia: lo lee de su paso por `origenGuia` al pulsar. Una plantilla unida al paso vale
  aunque sea de otro tipo de asunto.
- **«Generar documento» en el hito** (`js/hitos-generar.js`, en `.hito-botones`): sale si el hito no
  es pregunta ni «no aplica» y hay alguna plantilla (del paso o del tipo). Con una sola, genera; con
  varias, el cuadro de elegir con «De este paso» y «Otras de este tipo de asunto». El motor es el de
  siempre, `PlantillasDocumento.generar(asunto, plantilla, modo, { hito })`: deja el documento
  apuntado al hito, marca su casilla de «Lo que hay que reunir», apunta «Generado «…»» en el hito y
  lo deja desplegado.
- **Huecos nuevos** (`js/plantillas.js`): `{{HITO}}`, `{{PLAZO DEL HITO}}`, `{hecho:TÍTULO}` (la fecha
  en que se marcó hecho otro hito, `hechoEl`, que se apunta desde esta fila al marcarlo; los de
  antes no la tienen) y `{{LO QUE FALTA}}` también al generar desde el hito. Fuera del camino de un
  hito se quedan vacíos sin contar como dato que falta. `{{HITO}}` y `{{PLAZO DEL HITO}}` también al
  «Comunicar» desde un hito. Prueba: `pruebas/documentos-desde-el-hito.mjs`.

### El hito, mesa de trabajo (23-sep-2026, fila 103, `docs/EL-HITO-MESA-DE-TRABAJO.md`)

Lo que se hace desde un hito queda apuntado a ese hito solo (`HitosAnadir.apuntar`:
`Hitos.anadirDocumento` + `HitosRequisitos.marcarPorDocumento`, no crítico, y el hito desplegado).

- **«Añadir documento»** (`js/hitos-anadir.js`, en `.hito-botones`, no en pregunta ni «no aplica»):
  menú de `FichaMenus` con «Desde el ordenador» (`Documentos.abrir(a, { anadir: fichero })`),
  «Desde «Por clasificar»» (apagado sin sueltos; elige uno, `App.llevarSueltoA(s, …, { sinCuadro:
  true })` y `Documentos.abrir(a, { nombre })`) y «Uno que ya está en la carpeta»
  (`HitosDocumentos.abrir`). `Documentos.abrir` con opciones devuelve los nombres guardados en esa
  apertura (`Documentos.seguirGuardado`); sin opciones, igual que siempre.
- **Tres puntos en cada documento del hito** (`js/hitos-documento-menu.js`, sustituye a la ✕):
  Registrar (si no lo tiene), Separar/Unir/Sacar páginas/Ajustar tamaño (PDF, `modo: 'asunto'`) y
  «Quitar del hito» (`.hito-doc-menu-quitar`, solo desapunta). Lo nuevo se saca restando la
  carpeta leída antes y en `alTerminar` (`HitosDocumentoMenu.nuevos`). En uno «(ya no está)»,
  solo «Quitar del hito».
- **«Comunicar» siempre** (salvo pregunta o «no aplica»); ver «"Comunicar" desde un hito» más
  abajo. Prueba: `pruebas/el-hito-mesa-de-trabajo.mjs`.

### La biblioteca de hitos del centro (20-sep-2026, fila 79, docs/BIBLIOTECA-DE-HITOS.md)

Muchos pasos se repiten entre tipos de asunto casi idénticos ("Registrar de salida en Séneca",
"Comunicar a la familia"...). La biblioteca guarda cada uno **una sola vez**, en
`_GESTOR/hitos-biblioteca.json` (el decimosexto fichero compartido), y se trae a la guía de un tipo
como **copia**.

- **Traer uno** (`js/guias-biblioteca.js`, `GuiasBiblioteca.engancharPanelTraer`): en el cuadro de
  la guía, junto a "Añadir un paso", el botón "+ Traer de la biblioteca" abre un panel **dentro del
  propio cuadro** (nunca un segundo `U.preguntar`). El paso insertado (`HitosBiblioteca.modeloAPaso`)
  lleva `origenBiblioteca: { id, revision, divergido }`, que lo distingue de uno escrito a mano.
- **Guardar en la biblioteca** (`GuiasBiblioteca.botonHTML`/`engancharBoton`): junto a los mandos de
  cada paso. Si el paso no viene de la biblioteca, pide un nombre y crea un modelo con `revision: 1`.
  Si viene de la biblioteca y ha cambiado, ofrece "Solo en este tipo" (el paso queda `divergido:
  true` y no vuelve a avisar de ese cambio) o "Subir también" (sube la `revision` del modelo). Los
  dos casos usan un panel en línea, con el mismo patrón que `guia-enlace-fila`: el cuadro de la guía
  sigue abierto, así que no cabe un segundo `U.preguntar`.
- **Al pulsar Guardar de la guía** (`GuiasBiblioteca.revisarAlGuardar`, llamado desde
  `Guias.editar`): esto SÍ ocurre después de que `U.preguntar` haya cerrado `#capa`, así que aquí sí
  se abre un `U.preguntar` por cada paso cambiado (uno detrás de otro, nunca dos a la vez), con la
  misma pregunta de arriba.
- **El aviso en los demás tipos** (`GuiasBiblioteca.pasosDesactualizados`/`abrirComparacion`, llamado
  desde `js/ajustes-tipo.js`, sección "Pasos del trámite"): una línea `.aviso-compartido` por paso
  con `origenBiblioteca.revision` por detrás de la del modelo, con "Ver el cambio" (comparación campo
  a campo, `GuiasBiblioteca.comparacionHTML`) y las opciones "Traer el cambio" (conserva la marca
  `soloInformativo` del tipo, nunca la pisa el modelo) / "Dejarlo como está" (calla el aviso sin
  tocar el paso). Se escribe con `GuiasDelCentro.guardarPasos(tipo, pasos)`, sin reabrir el editor.
- **La comparación** siempre por los mismos campos (`HitosBiblioteca.diferencias`): título,
  explicación, responsable, estado del asunto, plazo, requisitos, comunicación y normativa.
  **`soloInformativo` no cuenta como cambio**: es una decisión de cada tipo, no del modelo.
- **Solo informativo** (apartado 4.6): campo `soloInformativo` en un paso de guía, un modelo y un
  hito. Se ve en gris con la etiqueta "Informativo", no sale en "Qué me toca" ni en "Dormidos", no
  cuenta como pendiente. Se enciende/apaga con un clic: la casilla del editor del paso, o "Pedírmelo
  a mí"/"Dejarlo solo informativo" en los botones del propio hito (`Hitos.guardarCampos`, afecta solo
  a ese hito de ese asunto). Al traer un modelo, nace marcado si su responsable no es el que
  Francisco tenga configurado como Administración (`HitosBiblioteca.naceSoloInformativo`); sin poder
  determinarlo, nace sin marcar.
- **Normativa** (apartado 4.7, `js/hitos-normativa.js`; enlace retocado la fila 87,
  `docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md`): campo `normativa`, lista de
  `{ cita, bloque, clave, url }`. Con `clave`, el enlace abre la vista de un solo artículo del
  sistema de normativa del centro, `<base>/norma#r=<clave>` (`HitosBiblioteca.enlaceDeNormativa`,
  dirección base en Ajustes → El centro, `_GESTOR/plantillas.json`, campo `direccionNormativa`); el
  bloque ya no interviene en el enlace, solo sigue guardado para saber dónde vive el artículo. La
  clave es del artículo entero, sin apartado (`ROC-40`, no `ROC-40.1`); con solo `url`, usa esa; sin
  nada, la cita se ve como texto. Se ve igual en un hito y en la vista de solo lectura de los pasos
  de un tipo (`Guias.vista`). `HitosNormativa.refrescar()` mantiene la dirección base en caché,
  actualizada por `window.Gestor.alRefrescar`.
- **El bloque de Ajustes → El centro** (`GuiasBiblioteca.pintarAjustes`, colgado solo de
  `#ajustes-tab-centro`): lista de modelos, crear uno desde cero, editarlo (reutiliza `Guias.editar`
  con una lista de un solo paso) y borrarlo (avisa, sin bloquear, de en qué tipos está en uso;
  `HitosBiblioteca.tiposQueUsan`).
- **Nombre corto del tipo** (apartado 4.9, `Nombres.tipoParaCarpeta(tipo)`): campo `nombreCorto` en
  `tipos.json`. Entra en el nombre de la carpeta y del asunto en vez del nombre de siempre; vacío, se
  usa el nombre de siempre. Se escribe en la sección "Datos del tipo" de `js/ajustes-tipo.js`, con
  aviso (ámbar si pasa de 16 caracteres; rojo si otro tipo ya lo usa, por `U.parecidos`).
  `Nombres.leer` reconoce también el nombre corto en una carpeta ya creada (no es un alias: es el
  nombre que se usa desde ahora). Cambiarlo no toca ninguna carpeta ya creada. Desde la fila 97
  (`docs/NOMBRE-CORTO-EN-LOS-FILTROS.md`) es también lo que se **enseña** en las tarjetas de filtro
  «Por tipo de asunto» y en la etiqueta del tipo de cada tarjeta de asunto (abierto y archivado),
  con el largo en el `title`: `Nombres.tipoParaVer(nombreTipo, tipos)`. Se sigue agrupando y
  filtrando por el nombre de verdad (dos tipos con el mismo corto, dos tarjetas). El buscador
  encuentra por los dos (`Nombres.nombresDeTipo`): en abiertos, dentro de `busca`; en el ARCHIVO,
  `IndiceArchivo.textoDeBusqueda` los resuelve al buscar desde `App.E.tipos`, sin subir la
  `VERSION` del índice. Prueba: `pruebas/nombre-corto-en-los-filtros.mjs`.
- **Formularios oficiales** (20-sep-2026, fila 82, `docs/FORMULARIOS-OFICIALES.md`): campo
  `formularios`, lista de claves del catálogo (ver la sección de más abajo). Mismo criterio que
  normativa: solo en el paso de arriba, nunca en una opción; se copia igual, sin cambios, a los
  hitos modelo de la biblioteca y a los hitos vivos.
- **No entra en esta fila**: los pasos-pregunta no se guardan en la biblioteca
  (`HitosBiblioteca.esPasoValido`); las plantillas de correo y de Séneca de un paso no se cargan
  (se escriben con el uso).

Se comprueba con `pruebas/biblioteca-de-hitos.mjs` y `pruebas/nombre-corto-de-tipo.mjs`, sin
navegador.

### El catálogo de formularios oficiales (20-sep-2026, fila 82, `docs/FORMULARIOS-OFICIALES.md`)

Cuando un trámite pide un impreso oficial, la aplicación ya sabe si se descarga, lo emite el
centro, es un protocolo sin impreso, o se genera en Séneca, sin salir a buscarlo.

- **`datos/formularios.json`**: copia tal cual, sin leer nada en vivo, del catálogo de
  `fmargon780/normativa-escolarizacion` (`datos/formularios.json`, 29 entradas). Cada clave:
  `{ n, norma, via, u, nota }`, con `via` en `descarga`/`centro`/`protocolo`/`seneca`.
- **`js/formularios.js`** (`window.Formularios`): `cargar()` lo lee con `fetch` relativo, una sola
  vez por sesión (`actualizar()` fuerza a releerlo: botón **Ajustes → Mantenimiento → Formularios
  oficiales → Actualizar el catálogo**, porque el fichero viaja con la propia aplicación y solo
  cambia al publicarse una versión nueva). `buscar(catalogo, texto)` y `etiquetaDeVia(via)` son sin
  efectos (`etiquetaDeVia` de una vía desconocida se trata como `protocolo`: nunca como un botón de
  descarga que no lleva a ningún impreso).
- **Dónde se elige**: `formularios: [clave, ...]` en un paso de guía (junto a `normativa`, mismo
  criterio de "solo en el paso de arriba"), y en `tipos.json` (clave `formularios` del propio tipo,
  para lo que no depende de ningún paso). El buscador con casillas (`Formularios.bloqueEmbebidoHTML`/
  `leerEditor`/`engancharEmbebido`) se pinta DENTRO del mismo `<details>` de normativa
  (`HitosNormativa.bloqueHTML` gana un segundo argumento, `formulariosHTML`, para no alargar más la
  pantalla del paso); en "Datos del tipo" (`js/ajustes-tipo.js`), aparte, con guardado automático en
  cada casilla (`Formularios.pintarEditorAsync`).
- **Dónde se ven**: en el cuerpo de un hito vivo (`js/hitos-panel-lista.js`, `Formularios.listaHTML`,
  igual que la normativa: un enlace con aspecto de botón para `descarga`/`centro`; un aviso, con su
  `nota` si la tiene, para `protocolo`/`seneca`, que no tienen impreso que descargar) y en la vista
  de solo lectura de los pasos de un tipo (`Guias.vista`). En la ficha del asunto, dentro de "Datos
  del trámite", una línea **"Formularios"** con los de todos los hitos VISIBLES del asunto (la rama
  en curso, sin repetir) más los del tipo (`Formularios.clavesDelAsunto`, `Formularios.pintarEnFicha`,
  que envuelve `App.abrirFicha` porque necesita leer los hitos, que es async); sin ninguno, la línea
  no se pinta. Y una pantalla propia **"Formularios"** (entrada en la barra lateral, junto a "Qué me
  toca" y "Cuentas"): el catálogo entero, buscable, agrupado por norma.

Se comprueba con `pruebas/formularios.mjs` (sin navegador: solo `buscar` y `etiquetaDeVia`, las dos
funciones puras).

### Los hitos de un asunto

Dentro de un asunto abierto, la guía **es** la lista de **hitos** que se trabaja: cada paso, vivo
dentro de ese asunto, con estado (pendiente · en curso · hecho · no aplica), fecha límite,
responsable, notas y documentos apuntados. Ya no hay guía con casillas aparte (fila 26, 17-sep-2026,
`docs/HITOS-SON-LA-GUIA.md`): el bloque "Hitos" de la ficha es la única forma de trabajarla.

- Viven en `_GESTOR/hitos.json` (el duodécimo fichero compartido), no en `asuntos.json`: se leen
  solo al abrir un asunto, al archivarlo y en la pantalla "Qué me toca". Estructura:
  `{ ajustes: { responsables, noLectivos }, porAsunto: { <clave del asunto>: { creados, hitos } } }`.
- **Se crean solos**, sin botón ni preguntar nada, la primera vez que se abre la ficha de un asunto
  **abierto** cuyo tipo tiene guía (vale igual para uno recién creado que para uno que ya existía
  desde antes): sus pasos se convierten en hitos (el id del hito es el mismo que el del paso,
  `origenGuia`) y el primero queda en curso. Si el asunto ya traía marcado algo en
  `pasosHechos`/`pasosElegidos` (`asuntos.json`, de cuando la guía se leía con casillas), se
  importa al crearlos (`Hitos.crearDesdeGuiaImportando`); esos dos campos no se vuelven a tocar
  después. No se crean solos si el asunto está archivado, si el compañero tiene el mando
  (`aplicarModoConsulta`) o si la guía de ese tipo todavía no ha terminado de cargar (en ese caso
  no se marca nada como "ya intentado": el siguiente repintado lo reintenta). Tocar los hitos de
  un asunto nunca cambia la guía del tipo.
- **Cerrojo contra la doble creación**: `js/hitos-panel.js` repinta con un `MutationObserver`
  debounced a 30 ms, y crear los hitos es `async` (una lectura y una escritura); dos repintados
  podrían colarse antes de que `hitos.json` quedara escrito y los dos verían "sin hitos todavía".
  `creandoDesdeGuia[clave]`, puesto justo antes de la escritura (nunca antes de la lectura previa),
  evita crearlos dos veces. `Hitos.crearDesdeGuiaImportando` es además idempotente por su cuenta
  (no hace nada si el asunto ya tiene hitos), pero eso solo no basta para la carrera del repintado.
- **Bifurcaciones**: un paso-pregunta se convierte en un hito de clase `decision`. Mientras no se
  elige una opción, la lista se corta ahí. Cambiar de rama quita los hitos vacíos de la vieja y
  marca `noaplica` (plegados, al final) los que tenían notas o documentos.
  `Hitos.visibles`/`Hitos.huerfanos` (`js/hitos.js`) son quienes saben qué se ve y qué se pliega.
- **Cambiar el tipo del asunto** (fila 94, `docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md`,
  `js/hitos-cambio-de-tipo.js`): al guardar «Editar el asunto» con otro tipo, si el asunto tiene
  hitos y el tipo nuevo tiene guía, `HitosCambioDeTipo.ofrecer` pregunta («Traer la guía nueva» /
  «Dejar los pasos como están»); sin guía, solo un aviso ámbar. Si dice que sí, entran los hitos de
  la guía nueva; de los viejos se quitan los intactos y se quedan al final, como `noaplica` y con
  `delTipoAnterior` (el tipo viejo), los hechos o con notas, documentos, requisitos o rama elegida.
  "En curso" solo no cuenta como trabajo (lo pone la aplicación sola al crear los hitos).
  `visibles` los salta y `huerfanos` los pliega abajo. Nota en el asunto. Solo se pregunta si la
  carpeta y la ficha ya han salido bien. Prueba: `pruebas/cambiar-tipo-y-guia.mjs`.
- **Un solo hito en curso a la vez**: al marcar uno hecho, el siguiente pendiente de la lista
  visible pasa a "en curso" solo (`Hitos.recomputeEnCurso`).
- **Documentos apuntados** (fila 31, `docs/APUNTAR-DOCUMENTO-A-HITO.md`): «Añadir documento › Uno
  que ya está en la carpeta» abre `HitosDocumentos.abrir(a, h)`, casillas sobre la carpeta. Apuntar
  es solo señalar (nunca copia ni mueve; un documento puede estar en varios hitos). Cada nombre
  abre en el panel (`Visor.abrir`, handle pedido al pulsar). Qué apuntado ya no está se lee una vez
  por repintado, en `js/hitos-panel.js` antes de tocar el DOM, y se marca con la clase
  `hito-doc-falta` (gris, sin `onclick`), no con `disabled`.
- **Asociar desde el documento** (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 6):
  además de apuntarlo desde el hito, cada fila de `js/ficha-documentos.js` lleva un
  botón **Asociar a un hito**, con el menú pequeño de `js/ficha-menus.js` (los hitos visibles del
  asunto y "Ninguno" para soltarlo, con un "✓" delante del que ya esté elegido). Solo sale si el
  asunto tiene hitos. Elegir uno quita el documento del hito anterior (si tenía) y lo pone en el
  nuevo — mismo dato de siempre (`Hitos.anadirDocumento`/`quitarDocumento`), ningún sitio nuevo
  donde guardarlo. El documento ya asociado enseña el nombre del hito en pequeño, debajo del suyo
  (un `<div>`, nunca un tercer `<span>`: `js/copiar.js` coge el ÚLTIMO `<span>` del botón para
  saber qué nombre copiar). `FichaDocumentos.pintar` calcula el mapa documento → hito una vez por
  repintado (`Hitos.hitosDe` + `Hitos.visibles`), igual que ya hacía `js/hitos-panel.js` con lo
  suyo.
- **El `MutationObserver` de `js/hitos-panel.js` no baja al árbol entero** (18-sep-2026, fila 58):
  antes vigilaba `#ficha-asunto-cuerpo` con `subtree: true`, así que CUALQUIER mutación en
  cualquier otro bloque de la ficha —la fila de copiar de un gesto rellenando "Nombre" en cuanto
  responde el fichero de datos, la lista de documentos repintándose, "Datos y contacto"…— disparaba
  este mismo repintado de sobra, y podía cerrarle a Francisco un hito que acababa de desplegar para
  mirarlo, sin haber tocado nada todavía (`hitosAMedias`, más abajo en el mismo fichero, solo
  guarda un hito a medias si tiene el foco o una nota sin guardar: uno abierto sin más se cierra en
  cualquier repintado). Ahora solo `{ childList: true }`, sin `subtree`: basta para detectar un
  repintado ENTERO de la ficha (`pintarLaFicha` rehace de un golpe los hijos directos de
  `#ficha-asunto-cuerpo`), que es lo único que de verdad hace falta captar aquí — cualquier cambio
  que sí toque a los hitos por su cuenta ya llama a `HitosPanel.programarRepintado()` él mismo.
- **"Lo que hay que reunir"** (18-sep-2026, fila 59, `docs/REQUISITOS-DE-HITO.md`): cada hito trae
  `requisitos`, copiados de los del paso de la guía al crearse (`Hitos.pasoAHito`), con el estado
  propio del hito encima: `{ id, texto, clase, obligatorio, hecho, valor, documento, quien,
  cuando }` (`normalizarRequisitoHito`, `js/hitos.js`). `js/hitos-requisitos.js` (nuevo, enganchado
  a `window.Hitos` como `js/hitos-archivo.js`) trae el resto:
  - El modelo: `Hitos.marcarRequisito`/`escribirValorRequisito`/`editarTextoRequisito` (edita una
    casilla ya existente), `Hitos.anadirRequisito`/`quitarRequisito` ("+ Añadir algo que falte":
    solo a este asunto, la guía del tipo no se toca) y `Hitos.traerRequisitos` (sección 4.3: si un
    hito no tiene ninguna y su paso de origen, `origenGuia`, sí las tiene ahora, una línea discreta
    ofrece traerlas sin marcar; nunca se hace solo).
  - `Hitos.faltanObligatorios(hito)` (`js/hitos.js`): las casillas obligatorias sin marcar. No
    cambia `Hitos.marcar`: es `js/hitos-panel-lista.js` quien la llama justo antes de pasar un hito
    a `hecho`, y si devuelve algo, `U.preguntar` avisa (nunca bloquea) y, si Francisco sigue, se le
    apunta una nota automática ("Dado por hecho con N cosas sin reunir.").
  - La pintura del bloque dentro del cuerpo de un hito (`HitosRequisitos.bloqueDeRequisitos`/
    `engancharBloque`, llamadas desde `js/hitos-panel-lista.js`, debajo de la explicación y encima
    de los documentos apuntados): una casilla por fila, el texto en negrita con un punto ámbar si es
    obligatoria y sigue sin marcar, y el valor o el documento en gris cuando ya está marcada (con
    `Copiar.boton` para el valor). Marcar una de clase `dato` abre un campo pequeño para el valor
    (puede quedar vacío), que se guarda al perder el foco o con Intro; al desmarcar, el valor se
    conserva y solo deja de contar. El menú de tres puntos de cada fila (`js/ficha-menus.js`) trae
    Editar el texto/Quitar de este asunto. Sin ninguna casilla, el bloque no se pinta: "+ Añadir
    algo que falte" va entonces suelto, con el resto de botones del hito.
  - **Marcar el documento sin marcarlo a mano** (sección 5): `js/hitos-documentos.js`, al apuntar o
    quitar un documento de un hito, llama a `HitosRequisitos.marcarPorDocumento`/
    `desmarcarPorDocumento`. Con una sola casilla de clase `documento` sin marcar, se marca sola con
    el nombre del fichero; con varias, un `U.preguntar` pequeño pregunta con cuál se corresponde
    (o "Ninguna"); sin ninguna, no pasa nada. No crítico: si falla, el documento ya ha quedado
    apuntado igual.
  - **"Pedir lo que falta"** (sección 7): botón en la cabecera del bloque, visible solo si queda
    algo sin marcar, que abre EL MISMO menú "Comunicar" de la cabecera de la ficha
    (`CorreoNucleo.montarBotonComunicar`, nuevo en `js/correo.js`, monta `FichaMenus` con las dos
    opciones de siempre —`abrirCuadro(a, false/true, extra)`, con `extra.loQueFalta`—: no duplica
    ese camino). El texto (`HitosRequisitos.textoLoQueFalta`, cabecera "Falta por aportar:" y una
    línea por casilla sin marcar, de las dos clases, en su orden) entra por el hueco de plantilla
    `{{LO QUE FALTA}}` (con dos llaves a propósito: `Plantillas.tieneLoQueFalta`/`rellenar`,
    `js/plantillas.js`, lo sustituye en una pasada aparte, ANTES que el resto de huecos, y siempre
    —incluso por nada, fuera de este camino— para que nunca cuente como un dato que falta; en el
    catálogo `Plantillas.HUECOS` su `clave` lleva ya las llaves, `'{LO QUE FALTA}'`, así que el
    botón "Insertar hueco" y el catálogo de `js/plantillas-documento.js` meten el texto exacto sin
    tocar ninguno de los dos). Si la plantilla no lleva ese hueco, o el tipo no tiene plantilla,
    `CorreoNucleo.cuerpoDelMedio` (`js/correo.js`) lo añade al final, separado por una línea en
    blanco; vale igual para el cuadro de Correo (`js/correo-cuadro.js`) y el de Séneca
    (`js/seneca-cuadro.js`), sin tocar ninguno de los dos: los dos ya llaman a
    `CorreoNucleo.cuerpoDelMedio`.
- **"Comunicar" desde un hito** (fila 60, `docs/COMUNICAR-DESDE-EL-HITO.md`; `js/hitos-comunicar.js`,
  no guarda nada en el hito). Sale siempre desde la fila 103 (salvo pregunta o «no aplica»).
  - `HitosComunicar.canalesDe(a, hito)` (síncrona, la guía en memoria por `origenGuia`): qué
    canales tienen texto. Con uno, abre ese cuadro directo; con dos, el menú "Comunicar"
    (`js/ficha-menus.js`); sin texto propio, los dos canales con las plantillas del tipo
    (`comunicarSinTexto`), con el destinatario y la constancia del hito.
  - **El destinatario** (`resolverDestinatario`): papel `tutor` → tutor legal 1 (o el 2 si el 1 no
    tiene nombre ni correo, `LoPide.datosDeTutor`); `relacionado` → todos los relacionados con
    correo, separados por comas (`LoPide.elegirDestinatarios` los vuelca en "Otro correo"); si no,
    el tercero del asunto. En Séneca no se marca a nadie por su cuenta.
  - **El mensaje ya resuelto** (con texto propio): `Plantillas.rellenar` con
    `Plantillas.valoresDeAsunto(a, { hito })`; `extra.asuntoListo`/`medioListo` hacen que
    `asuntoDelCorreo`/`cuerpoDelMedio` los usen tal cual, sin plantillas del tipo ni `{{LO QUE
    FALTA}}`. `extra.correoPreferente` se prueba primero (`CorreoNucleo.destinatarioPreferente()`).
  - **Documentos del hito ya marcados** (fila 103): `extra.adjuntosMarcados` marca en "Documentos de
    este asunto" los del hito que siguen en la carpeta (`CorreoAdjuntos.marcadosQueExisten`).
  - **La constancia**: una nota en el asunto y una línea en el historial del hito, una sola vez
    (`apuntarElRastro`, cerrojo `yaApuntado`). Con `extra.comunicarHito` (`claveAsunto`/`idHito`/
    `nombreDestinatario`), `textoDeLaNota()` es `CorreoNucleo.textoDeComunicarHito(nombre, esSeneca,
    documentos)`: "Comunicado a &lt;nombre&gt; por correo/Séneca · fecha", más "· con N
    documentos: a, b" si el borrador los llevó; y se apunta también con `Hitos.anadirNota`.
    `aQuien(a)` mira primero `nombreDestinatario`.
- **Responsable**: persona del centro (configurable en Ajustes › Hitos) o un papel fijo
  (`tercero`, `tutor`, `relacionado`) que la aplicación resuelve sola con datos del asunto
  (`Hitos.resolverResponsable`); sin resolver, se enseña en gris.
- **Plazo**: un paso puede llevar "tantos días hábiles desde que se complete otro paso". Al
  marcarlo hecho, `Plazos.sumarDiasHabiles` (días no lectivos de Ajustes › Hitos incluidos) pone
  sola la fecha límite del siguiente, salvo que Francisco la haya tocado a mano.
- **Estado del asunto**: un paso puede llevar apuntado un estado de `estados.json`; al pasar su
  hito a "en curso", el asunto pasa solo a ese estado. La única función que lo decide es
  `Hitos.estadoDelAsunto` (`js/hitos.js`), para poder cambiar el criterio sin tocar diez sitios.
- **Al archivar**, los hitos salen de `hitos.json` y se escriben, dentro de la carpeta ya
  archivada, como `HISTORIAL DE TRAMITACION.txt` (legible sin la aplicación, sin copiar ningún
  documento; gemelo de `DONDE ESTA ESTE ASUNTO.txt` de `js/relacionados.js`). Si el asunto se
  reabre y el fichero sigue ahí, los hitos se cargan de vuelta a `hitos.json` y el fichero se
  borra.
- Se escriben desde el mismo cuadro de la guía (`Guias.editar`, con tres campos nuevos y
  opcionales por paso: responsable por defecto, estado del asunto y plazo) y se pintan
  directamente dentro de `#ficha-guia` (el bloque "Hitos" de la ficha), con un
  `MutationObserver` sobre `#ficha-asunto-cuerpo` para saber cuándo repintar (no hay ninguna
  función de `App` que envolver). `js/ficha-asunto.js` solo pone ahí el
  `<p class="nota" id="ficha-guia-nota">` de escribir o cambiar la guía del tipo; `js/hitos-panel.js`
  lo localiza por su id y lo conserva cada vez que repinta el resto de `#ficha-guia`.
- Vive en `js/hitos.js` y `js/hitos-archivo.js` (el modelo; se parte en dos para no pasar de las
  400 líneas), `js/hitos-panel.js` y `js/hitos-panel-lista.js` (la ficha del asunto: el
  observador, el repintado y la creación automática en uno, cómo se pinta cada hito en el otro,
  hablándose por `window.HitosPanel`), `js/hitos-documentos.js` (el cuadro de apuntar un
  documento), `js/hitos-requisitos.js` (fila 59: "lo que hay que reunir", modelo y pintura en uno)
  y `js/hitos-ajustes.js` (el bloque "Hitos" de Ajustes: responsables y días no lectivos).

Se comprueba con `pruebas/hitos.mjs` y, sin navegador, `pruebas/requisitos-de-hito.mjs` y
`pruebas/comunicar-desde-hito.mjs`.

### La pantalla "Qué me toca"

Cruza los hitos `pendiente`/`encurso` de **todos los asuntos abiertos** (nunca archivados), para
no tener que entrar en ellos uno a uno: lee `Hitos.leer()` una vez y `window.Gestor.asuntos()`, y
cruza por la clave del asunto.

- Bloques, en este orden: **"En tu tejado"** (responsable `yo`/`companero`, **con** fecha
  límite, ordenados por `Plazos.diasHasta` — los vencidos arriba; el color es el de siempre,
  reutilizando tal cual `Plazos.de`/`.marca-plazo` de `css/plazos.css`, sin inventar otra escala);
  **"Esperando a otros"** (cualquier otro responsable, tenga fecha o no: se ordena por los días
  parado desde `desde`, los más parados arriba); **"Dormidos"** (19-sep-2026, fila 68, ver
  abajo); **"Sin fecha"**, plegado con `<details>` — el resto: sin fecha límite, o sin un
  responsable que encaje en los dos bloques de arriba. Cada hito visible sale en un solo bloque.
- Cada línea lleva el título del hito, el nombre del asunto y su tercero. Al pulsarla, llama a
  `window.HitosPanel.desplegarAlAbrir(clave, idHito)` —enganche nuevo y pequeño en
  `js/hitos-panel.js`: guarda ese par y, en el siguiente repintado de esa ficha, quita `.oculto`
  al `.hito-cuerpo` de ese hito y hace scroll hasta él— y luego `App.abrirFicha(a, 'abierto')`.
- Filtro por responsable arriba (los de Ajustes › Hitos, no los papeles fijos), recordado en
  `localStorage` (`gestor-que-me-toca-responsable`).
- Entrada en la barra de la izquierda (`js/barra.js`, junto a las de siempre), con la cuenta de
  hitos vencidos al lado; sin número si no hay ninguno.
- Vive entera en `js/que-me-toca.js` (estilos en `css/que-me-toca.css`), con el mismo patrón que
  la pantalla "Duplicados": `App.PANTALLAS.push`, la sección se crea a mano y no está en
  `index.html`, enganchada a `window.Gestor.alRefrescar` para que la cuenta de la barra esté al
  día aunque no se haya visitado la pantalla todavía.

Se comprueba con `pruebas/que-me-toca.mjs`.

**El bloque "Dormidos"** (19-sep-2026, fila 68, `docs/AVISOS-QUE-FALTAN.md`, 2): a diferencia de
los otros tres, no cruza hitos, sino **asuntos abiertos** enteros sin novedades desde hace
`App.diasDormido()` días (60 por defecto; campo "Asuntos dormidos" en Ajustes → El centro,
`registro.ajustesAvisos.diasDormido`, compartido entre los dos ordenadores). "Sin novedades" es,
a propósito, barato: la fecha más reciente de `ficha.notaEl`, `ficha.situacionEl` y
`ficha.editadoEl` (o `ficha.abiertoEl` si no hay ninguna de las tres). **No** mira el documento
más nuevo de la carpeta: costaría un recorrido del disco por asunto solo para pintar esta
pantalla. Cada línea lleva un botón **Abrir** y uno **Ocultar por 30 días**, que guarda
`ficha.dormidoOcultoHasta` (vía `App.anotar`) y lo saca de la lista hasta esa fecha. Vive en
`js/que-me-toca.js` junto a los demás bloques (`reunirDormidos`, `bloqueDormidos`,
`App.diasDormido`/`App.guardarDiasDormido`/`App.pintarDiasDormido`), no en un fichero aparte.

### La pantalla "Cuentas"

19-sep-2026, fila 74, `docs/CUENTAS-DE-FIN-DE-CURSO.md`: las cuentas para la memoria de fin de
curso. Mismo patrón que "Qué me toca" (`App.PANTALLAS.push`, sección creada a mano, no está en
`index.html`, entrada propia en `js/barra.js` justo detrás de la de "Qué me toca"), pero vive en
su propio fichero, `js/cuentas.js`: no cruza hitos, cruza **categoría/tipo, mes, quién lo pidió y
cuánto se tarda** de todos los asuntos, abiertos y archivados.

- **De dónde salen los números**: nunca se recorre el ARCHIVO. Los abiertos, de
  `window.Gestor.asuntos()`; los archivados, de `IndiceArchivo.leerDisco()` (el mismo índice de
  "El índice del ARCHIVO", en `docs/contexto/ASUNTOS-ARCHIVO.md`). Si el índice no está hecho o es de
  otra versión, la pantalla lo dice y remite a ARCHIVO → "Reconstruir el índice": **no** lo
  reconstruye ella sola ni enseña números a medias.
- **El curso académico** de un asunto sale de su **fecha de apertura** (septiembre a diciembre,
  el curso que empieza; enero a agosto, el que empezó el año anterior — `U.cursoDeFecha`), no del
  año académico opcional que algunos tipos llevan en el nombre: muchos tipos (EMPRESAS, por
  ejemplo) nunca lo llevan, y así ningún asunto se queda fuera de todos los cursos. Un
  desplegable arriba elige el curso (por defecto, el actual si aparece en la lista; "Todos" lo
  quita); solo enseña los cursos que de verdad hay.
- **Categoría → tipo → cuántos, abiertos, archivados**: un asunto cuyo nombre no encaja con
  ningún tipo de Ajustes (`leido.reconocido` falso) se cuenta aparte, en "Sin clasificar", nunca
  se pierde. Ordenada por categoría y, dentro, de más a menos; fila de Total al final. Botón
  **"Copiar la tabla"** (`U.copiar`) la deja en el portapapeles separada por tabuladores, lista
  para pegar en un documento o una hoja de cálculo.
- **Por mes**: cuántos asuntos se abrieron cada mes del curso elegido, de la fecha del nombre de
  la carpeta.
- **Por quién lo pidió**: agrupa `ficha.loPide` (`js/lo-pide.js`) en Familia (su `relacion`
  empieza por "Tutor legal"), Alumnado, Centro o Empresa (según `loPide.categoria`); sin
  "Quién lo pide" apuntado, va aparte en "Sin apuntar", no se cuenta como si fuera de nadie.
- **Cuánto se tarda**: solo de los archivados con `abiertoEl` y `cerradoEl` (los de antes de
  llevar esos dos datos no entran: no se inventa una duración). Media y el que más tardó, en días.
- El índice del ARCHIVO guarda, desde esta fila (`VERSION` 2 → 3), `reconocido`, `loPideCategoria`,
  `loPideRelacion`, `abiertoEl` y `cerradoEl` de cada entrada (antes solo `loPideNombre`, para
  buscar). `Nombres.cursoYGrupoDeResto` (antes privada de `js/archivo-indice.js`, ahora en
  `js/nombres.js`) hacía falta también para los abiertos, que no pasan por el índice.

Toda la cuenta (`_entradaAbierta`, `_entradaArchivada`, `_porTipo`, `_porMes`, `_porQuienLoPide`,
`_tiempoDeTramite`, `_textoParaCopiar`) es pura, sin DOM ni disco: se comprueba sin navegador en
`pruebas/cuentas.mjs`.

