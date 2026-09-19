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

- Una bifurcación por paso (las opciones no llevan opciones dentro).
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
- **Un solo hito en curso a la vez**: al marcar uno hecho, el siguiente pendiente de la lista
  visible pasa a "en curso" solo (`Hitos.recomputeEnCurso`).
- **Documentos apuntados** (fila 31, 17-sep-2026, `docs/APUNTAR-DOCUMENTO-A-HITO.md`): el botón
  "Apuntar un documento" abre `HitosDocumentos.abrir(a, h)` (`js/hitos-documentos.js`, nuevo), un
  cuadro con casillas sobre `Carpetas.ficheros(a.handle)`; al aceptar llama a
  `Hitos.anadirDocumento`/`quitarDocumento` y pide el repintado. Apuntar es solo señalar: nunca se
  copia ni se mueve nada, y un documento puede estar apuntado en varios hitos. Cada nombre pasa a
  ser pulsable (abre en el panel de la derecha, `window.Visor.abrir`), pidiendo su handle en el
  momento de pulsar, no antes. Saber qué apuntado ya no está en la carpeta se lee **una sola vez
  por repintado**, en `js/hitos-panel.js` antes de tocar el DOM (nunca corrigiéndolo después, a
  mano: el `MutationObserver` de aquí abajo lo detectaría como un cambio más). Y nunca con el
  atributo `disabled`: `js/ficha-asunto.js` reactiva solo, sin distinguir por qué, todo lo que
  encuentre apagado dentro de `#ficha-asunto-cuerpo` en cuanto no hay nadie en modo consulta
  (`aplicarModoConsulta`) — basta la clase `hito-doc-falta` (sin enganchar ningún `onclick`, y ya
  en gris por CSS).
- **Asociar desde el documento** (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 6):
  además de "Apuntar un documento" desde el hito, cada fila de `js/ficha-documentos.js` lleva un
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
- **"Comunicar" desde un hito** (18-sep-2026, fila 60, `docs/COMUNICAR-DESDE-EL-HITO.md`): botón
  propio del hito, aparte del "Comunicar" de la cabecera de la ficha, que solo sale si su paso de
  origen tiene "Comunicación de este paso" (ver la sección de guías, más arriba). Vive entero en
  `js/hitos-comunicar.js` (nuevo, enganchado a `window.Hitos` como `js/hitos-archivo.js`, aunque no
  añade ningún método al modelo: nada de esto se guarda en el hito).
  - `HitosComunicar.canalesDe(a, hito)` (síncrona: lee la guía en memoria, `GuiasDelCentro.pasosDe`,
    por `origenGuia`) dice qué canales tienen texto. Con uno, el botón abre ese cuadro directo; con
    los dos, abre el mismo menú pequeño "Comunicar" (`js/ficha-menus.js`) que la cabecera.
  - **El destinatario** (`resolverDestinatario`): si el responsable del hito es el papel `tutor`,
    el tutor legal 1 (o el 2, si el 1 no tiene nombre ni correo — `LoPide.datosDeTutor`); si es
    `relacionado`, todos los relacionados con correo (comas, para que
    `LoPide.elegirDestinatarios` —ya usada por "Lo pide"— los vuelque enteros en "Otro correo": no
    va a estar entre las direcciones de la ficha del tercero, que es de OTRA persona); en cualquier
    otro caso (responsable de la casa, o sin responsable), el tercero del asunto. En Séneca no hay
    forma de marcar un usuario IdEA concreto desde aquí: el cuadro se abre con la lista de siempre,
    sin marcar nada por su cuenta (nunca se bloquea el botón por eso).
  - **El mensaje ya resuelto**: `Plantillas.rellenar(mensaje.asunto/cuerpo, Plantillas.valoresDeAsunto(a))`,
    los mismos huecos de siempre. `js/correo.js` gana `asuntoListoActual`/`medioListoActual`
    (`extra.asuntoListo`/`medioListo` de `abrirCuadro`, ver fila 59): con ellos puestos,
    `asuntoDelCorreo`/`cuerpoDelMedio` los usan tal cual, sin pasar por el desplegable de
    plantillas del tipo ni por el hueco `{{LO QUE FALTA}}` (eso es de la plantilla general).
    `correoPreferenteActual` (`extra.correoPreferente`) hace lo mismo que ya hacía "Lo pide" con
    `correoLoPide`: `js/correo-cuadro.js` la prueba primero (`CorreoNucleo.destinatarioPreferente()`).
  - **La constancia** (sección 5.3): una nota en el asunto y una línea en el historial del hito, una
    sola vez. En vez de un camino nuevo, se reutiliza el existente: `comunicarHitoActual`
    (`extra.comunicarHito`, con `claveAsunto`/`idHito`/`nombreDestinatario`) hace que
    `textoDeLaNota()` devuelva `CorreoNucleo.textoDeComunicarHito(nombre, esSeneca)` ("Comunicado a
    &lt;nombre&gt; por correo/Séneca · fecha"), y `apuntarElRastro()` —el mismo cerrojo `yaApuntado`
    de siempre, "una vez por cuadro"— además de la nota, llama a `Hitos.anadirNota` con el mismo
    texto. `aQuien(a)` (usada por el aviso de arriba del cuadro de Séneca) también mira primero
    `comunicarHitoActual.nombreDestinatario`.
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
  "El índice del ARCHIVO", en `docs/contexto/ASUNTOS.md`). Si el índice no está hecho o es de
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

