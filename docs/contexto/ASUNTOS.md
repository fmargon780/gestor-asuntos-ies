# Crear, editar, la ficha, "Lo pide" y duplicados de un asunto

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026).
Actualízalo al tocar la creación o edición de un asunto, su ficha (abierto), "Lo pide" o los
duplicados. **La papelera, archivar/reabrir, el índice del ARCHIVO y las fichas huérfanas se
partieron a `docs/contexto/ASUNTOS-ARCHIVO.md` en la fila 78** (este documento pasaba de los
40 KB): actualiza ese hijo al tocar cualquiera de esos temas. El índice general, las reglas de
código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Crear un tipo sin salir de Nuevo asunto (24-sep-2026, fila 128)

`js/tipo-al-vuelo.js` (`docs/TIPO-DESDE-EL-ASUNTO.md`). Cambia una decisión de siempre: los
tipos de asunto ya no se crean solo en Ajustes. En Nuevo asunto, junto al buscador de tipos
(`js/tipos-buscador.js`), un botón **«+ Crear tipo nuevo»**:

- **Destacado, justo debajo del buscador**, mientras el buscador tenga texto escrito (no solo
  sin resultados: puede haber parecidos que no valgan). **Discreto, al final de la parrilla**,
  con el buscador vacío. `TipoAlVuelo.repintar()` decide y mueve siempre el mismo nodo; se llama
  desde `js/tipos-buscador.js`, al final de su `aplicar()` (escribir en el buscador solo llama a
  `aplicar()`, no a `App.pintarTipos` entero), no envuelve nada.
- Abre un panel con tres datos —Nombre (relleno con lo escrito, en mayúsculas), Nombre corto
  (opcional) y Categoría (la elegida)—, **dentro de la misma pantalla**, nunca un segundo `#capa`.
  Escape lo cierra a él, no Nuevo asunto (mismo cuidado que `js/huecos-buscador.js`: un
  `keydown` propio en captura, con `stopPropagation`).
- Guarda con `App.crearTipo` (`js/ajustes.js`), la misma función que usa «Añadir» en Ajustes, tras
  la misma guardia `U.dejaCrear`. Un nombre ya existente no se duplica: se avisa y se ofrece
  «Usar este», que deja elegido el que ya había.
- Deja el tipo elegido con `App.marcarTipoElegido` (`js/asuntos-nuevo.js`), no con
  `App.elegirTipo`: a diferencia de éste, no toca el tercero ni lo ya escrito (descripción,
  campos), por si se está reconsiderando el tipo con el formulario ya avanzado. Si el tercero
  todavía no se había elegido, revela ese bloque igual que `App.elegirTipo`.

Se comprueba con `pruebas/tipo-desde-el-asunto.mjs`.

### La ficha de un asunto

Al pulsar el nombre de un asunto se entra en su ficha: sus datos, el contacto del tercero, la
guía de su tipo con las casillas, sus notas, sus documentos y los demás asuntos del mismo
tercero.

**La tarjeta de la lista se queda con lo justo**: la marca del hito actual (fila 129, pulsable a
su mesa, `docs/contexto/ESTADO-DEL-ASUNTO.md`), "Copiar nombre" y "Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una lista blanca
(`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la tarjeta con
`window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.

**Guardar un documento nunca echa de la ficha a la lista** (fila 30, 17-sep-2026,
`docs/QUEDARSE-EN-EL-ASUNTO.md`). `App.verAbiertos` (`js/asuntos-lista.js`) relee la carpeta
entera y crea asuntos nuevos cada vez que se llama, y se llama sola —`App.mirarLaCarpeta`, cada
`App.SEGUNDOS_ENTRE_MIRADAS`— sin que la ficha lo sepa: sin este arreglo, el asunto que tenía la
ficha en la mano se quedaba con un objeto viejo, y la lista de documentos no se refrescaba sola.
`js/ficha-asunto.js` envuelve `App.verAbiertos` (mismo patrón que las demás envolturas de este
fichero) para, cada vez que se llama, reenganchar sola el asunto que tenga la ficha abierta —por
su nombre, en la lista fresca— y repintarla en su sitio, con dos funciones públicas:

- `App.fichaAbierta()` — el nombre del asunto que se ve de verdad en pantalla (comprueba que
  `#pantalla-asunto` no esté oculta, no solo que `actual` siga puesto: si se ha cambiado de
  pestaña sin pulsar "Volver", `actual` se queda con el asunto pero ya no hay ficha que reenganchar).
- `App.reengancharFicha()` — la reenganche de verdad: si el asunto sigue en `App.E.listaAbiertos`,
  lo vuelve a coger de ahí y repinta; si ya no está (se ha archivado o borrado desde el otro
  ordenador), entonces sí vuelve a la lista, con un aviso de una línea. Solo actúa con la ficha de
  verdad visible y con un asunto **abierto**: el ARCHIVO no lo vigila `App.mirarLaCarpeta`.

**Repintar solo si algo ha cambiado de verdad** (fila 34, 17-sep-2026,
`docs/NOTAS-DEL-ASUNTO-NO-SE-BORRAN.md`). Bastaba con que el compañero dejara un papel suelto en
"Por clasificar" para que `App.reengancharFicha()` rehiciera la ficha entera con `innerHTML`,
tirando por el camino cualquier nota a medio escribir. Ahora compara una huella de texto del
asunto, partida en dos mitades —ficha e hitos—: si las dos son iguales, la pantalla se deja
quieta; si solo cambian los hitos, le pide el repintado al panel de hitos en vez de rehacer la
ficha entera. Y un asunto pasa a ser **un solo objeto** en toda la aplicación: los datos frescos
se meten dentro del objeto que la ficha ya tiene en la mano (antes, con la pantalla quieta, los
botones ya pintados se quedaban con el objeto viejo, y "Archivar el asunto" volvía a preguntar
"¿Dónde va esta carpeta?" con la categoría ya puesta). Tanto `pintar()`/`pintarNotas()` de
`js/ficha-asunto.js` como el repintado entero de `js/hitos-panel.js` pasan por
`U.conservandoLoEscrito` (ver "Avisos técnicos"), para que una nota a medio escribir, el foco y
el cursor sobrevivan a un repintado que sí haga falta. Límite conocido: si la ficha entera se
repinta de verdad mientras se escribe la nota de un hito, esa nota puede perderse (el panel de
hitos se repinta un instante después, de forma asíncrona); la nota del asunto no tiene ese
problema. Se comprueba con `pruebas/notas-asunto-no-se-borran.mjs`.

**De la ficha de un asunto solo se sale en cuatro casos** (fila 93, 23-sep-2026,
`docs/QUEDARSE-EN-EL-ASUNTO-SIEMPRE.md`): Volver o Escape, Editar (aunque se cancele el cuadro:
`js/ficha-nombre-acciones.js` llama a `App.volverALaLista()` después de `App.editarAsunto(a)`
pase lo que pase), Archivar/Reabrir y Borrar; y un quinto que no es una acción de Francisco: el
asunto ha dejado de estar abierto desde el otro ordenador (el aviso de `App.reengancharFicha()`,
más arriba). Cualquier otra cosa se queda en su sitio, porque `App.verAbiertos` (que ya reengancha
sola la ficha, más arriba) o `App.abrirFicha(a, modo)` bastan para repintar sin navegar a ninguna
otra pantalla: guardar o registrar un documento, generar uno desde plantilla, separar/unir/sacar
páginas de un PDF, marcar un hito, asociar un documento a un hito desde el propio documento
(`js/ficha-documentos.js`, "Asociar a un hito") o apuntarlo desde el propio hito
(`js/hitos-documentos.js`, "Apuntar un documento"), "Comunicar", "Documentos ▾", y "Meter en un
asunto"/"Meter aquí" de Por clasificar (`js/documentos-sueltos.js`,
`js/documentos-sueltos-lector.js`) — estos dos últimos, además, viven siempre en la pantalla "Por
clasificar", nunca dentro de la ficha, así que no pueden sacar de ella; y cuando el asunto de
destino es el que antes tenía la ficha abierta, `App.reengancharFicha()` no la vuelve a enseñar,
porque comprueba primero si la ficha sigue **a la vista** (`#pantalla-asunto` sin `oculto`), no
solo si `actual` sigue puesto. Repaso completo de todo `js/` en busca de una salida indebida
(fila 93): no se encontró ninguna, la regla ya se cumplía entera desde las filas 30, 34, 51, 52 y
58. Se comprueba con `pruebas/quedarse-en-el-asunto.mjs` (quince casos: los once que se quedan y
los cuatro que salen, más el quinto del otro ordenador).

**La disposición de la ficha** (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md): cambio de
disposición, ningún funcionamiento distinto. La regla: arriba a la izquierda lo que hay que
hacer, arriba a la derecha lo que hay que saber, lo que casi nunca se mira plegado con su número
al lado.

- **La línea gris de la cabecera** (`.ficha-subtitulo`, dentro de `<header class="ficha-cabecera">`;
  desde la fila 112, en `.ficha-apertura`, a la derecha de la segunda línea): `subtituloDeFicha(a)` en `js/ficha-asunto.js` junta,
  separados por ` · `, lo que no se repite en ningún otro sitio de la pantalla — Abierto el
  (`U.fechaLegible(a.leido.fecha)`), Categoría, Año académico, Descripción y Lo abrió—; lo vacío no
  deja ni el separador ni un hueco. Se esconde entera con la cabecera encogida
  (`.ficha-cabecera.encogida .ficha-apertura { display: none; }`, `css/ficha-asunto.css`).
- **Tarjetas** (24-sep-2026, fila 107, `docs/FICHA-EN-TARJETAS.md`; antes, tres columnas y dos
  plegables, `js/ficha-plegables.js`, retirado): ver "La ficha en tarjetas", más abajo.
- **"Datos del asunto" se desmonta y pasa a llamarse "Datos del trámite"**: `datosDelAsunto(a)`
  (ya no lleva `p`, la fecha límite se quitó) solo deja los campos propios del tipo
  (`filasDeCampos`), Vía de comunicación, Lo pide y En el archivo — el resto ya se ve en la
  cabecera, en sus marcas o en "Datos y contacto". **Sin ninguna fila, devuelve `null` y el bloque
  entero no se pinta**, ni el título ni la tarjeta (antes `filas()` pintaba "Nada que enseñar
  aquí."; `filasHtml()`, nueva, es la parte de `filas()` que solo dibuja, reutilizada aquí y por
  `filas()` para los sitios que sí quieren ese aviso).
- `js/ficha-documentos.js` sigue poniendo `.vacio` a su bloque con la carpeta vacía; en una
  tarjeta (`.ficha-tarjeta.vacio`) ya no encoge nada: la tarjeta tiene el tamaño de las demás.
- Se comprueba con `pruebas/ficha-disposicion.mjs` (el orden de las tarjetas, la línea gris,
  "Datos del trámite" con y sin campos propios, los resúmenes de "Otros asuntos" y "Personas", que
  un repintado no cierra la tarjeta abierta y las columnas según el ancho).

### La ficha en tarjetas (24-sep-2026, fila 107, docs/FICHA-EN-TARJETAS.md)

`js/ficha-tarjetas.js` (`window.FichaTarjetas`) y `css/ficha-tarjetas.css`. `js/ficha-asunto.js`
solo monta el HTML con `FichaTarjetas.html(tramite)` y avisa con `FichaTarjetas.alEntrar()` (en
`App.abrirFicha`, antes de pintar) y `FichaTarjetas.alPintar(caja, a)` (al final de
`pintarLaFicha`): puntos previstos, nada se envuelve. Los huecos de dentro (`#ficha-guia`,
`#ficha-documentos`, `#ficha-contacto-caja`, `#ficha-notas`, `#ficha-otros`, `#ficha-relacionados`,
Datos del trámite) son los de siempre, y los sigue pintando el mismo módulo.

- **Cuadrícula**: `.ficha-tarjetas-rejilla`, 3 columnas × 2 filas (4 con "Datos del trámite"), dos
  por debajo de 1100px o con el visor/lector abierto. Todas del mismo tamaño; `ajustarAlto()` les
  da el alto que queda hasta abajo de la ventana (sin desplazarse), al pintar, al cambiar de tamaño
  y al abrir o cerrar el documento de la derecha. Lo que no cabe se corta.
- **Resúmenes** de la tarjeta cerrada (`.ficha-tarjeta-resumen`), sacados de lo que cada módulo
  ya pinta dentro (su cuerpo sigue en el DOM, oculto), con un `MutationObserver` que ignora lo que
  pinta este fichero: Hitos ("N de M hechos" y el siguiente, con su plazo), Documentos (cuántos y
  sus nombres, que se abren en el panel de la derecha sin abrir la tarjeta), Notas (la última:
  quién, cuándo, el texto; de `App.E.registro`), Otros asuntos (la cuenta de verdad en
  `#ficha-otros[data-cuenta]`, que pone `js/otros-del-tercero.js`) y Personas. "Datos y contacto"
  y "Datos del trámite" (`.ficha-tarjeta-siempre`) enseñan su propio cuerpo, que ya es un resumen.
  Sin contenido: "ninguno todavía", en gris.
- **Documentos, legibles** (24-sep-2026, fila 114, `docs/DOCUMENTOS-EN-LA-TARJETA.md`): los
  resúmenes viven en `js/ficha-tarjetas-resumen.js` (`FichaTarjetasResumen.crear`, sacado de
  `js/ficha-tarjetas.js`). Cada renglón lleva `title` con su texto y `flex: none` (antes se
  aplastaban unos encima de otros). Documentos ya no dice «N documentos» (va en el círculo): como
  mucho 5 nombres, o los que quepan enteros (`medir()`, que llama `ajustarAlto()`: alto de la caja
  entre el de un renglón), y «y N más» (`.ficha-resumen-mas`), que abre la tarjeta en grande.
- **Abrir en grande**: pulsar la tarjeta (menos en un botón, enlace o campo). `data-abierta` en
  `#ficha-tarjetas`; las demás pasan a pestañas (`#ficha-tarjetas-pestanas`, con su cuenta). Desde
  la fila 112 no hay "← Volver a las tarjetas": se vuelve pulsando otra vez la pestaña abierta
  (`title` "Volver a las tarjetas"); en Hitos con un hito abierto, primero a la lista
  (`HitoMesa.cerrarSiAbierta()`). **Escape** (`js/usabilidad.js`, `FichaTarjetas.cerrarSiAbierta()`,
  después de cerrar el visor si estaba) vuelve a la cuadrícula; el siguiente, lo de siempre.
- **Franja de documentos** (`.ficha-tarjeta-franja`) en la tarjeta abierta, menos Documentos: chips
  que pulsan por debajo el mismo `button.ficha-documento` de la lista (sin repintar). En Hitos, los
  del hito desplegado (`.hito-cuerpo` visible → sus `.hito-documento[data-doc]`); si no hay, todos.
  El chip del documento a la vista (`Visor.nombreAbierto()`, nuevo), marcado.
- **Qué se recuerda**: al entrar, siempre la cuadrícula; desde "Qué me toca",
  `FichaTarjetas.abrirAlEntrar('hitos')` antes de `App.abrirFicha`. Un repintado de la misma ficha
  mantiene la tarjeta abierta (el estado vive en el módulo) y `U.conservandoLoEscrito` lo escrito.
- En modo consulta, las pestañas, los chips y los nombres del resumen siguen activos
  (`esControlDeSoloLectura`).
- Se comprueba con `pruebas/ficha-en-tarjetas.mjs` (a 1905×1000 y 1280×800). Las pruebas que
  trabajan dentro de la ficha entran con su tarjeta ya abierta (`window.__tarjeta`) o la abren con
  `FichaTarjetas.abrir(id)`.

**La cabecera de la ficha, agrupada por el trámite** (18-sep-2026, fila 52,
docs/CABECERA-DEL-ASUNTO.md): cambio de disposición y de agrupación, ninguna acción desaparece ni
cambia lo que hace. Va después de la fila 51 (da por hecha `.ficha-subtitulo`).

- **La cabecera en dos líneas** (24-sep-2026, fila 112, `docs/CABECERA-COMPACTA.md`): dentro de
  `<header class="ficha-cabecera">`, `.ficha-linea1` (`#ficha-volver` «← Volver», las marcas, el
  `<h2>` con «⋯» y `#ficha-archivar`, a la derecha) y `.ficha-linea2` (`#ficha-acciones` y, a la
  derecha, `.ficha-apertura`: la fila de copiar, que `js/ficha-nombre-acciones.js` mete ahí, y la
  línea gris en una sola línea, recortada, con el texto entero en su `title`). Sin raya ni margen
  debajo. Encogida: las dos líneas, sin `.ficha-apertura`.
- **`#ficha-acciones` queda en cuatro elementos**, siempre en este orden: el hito actual
  (fila 129, `#ficha-estado-hito`: la marca y «Esperando a…» / «Ya ha llegado»), la etiqueta de vencimiento, "El encargo" y "Comunicar" (lo añade `js/correo.js`, ver
  abajo); "Archivar"/"Reabrir" (`.boton-principal`) va en `#ficha-archivar` desde la fila 112. `pintarAcciones(a, abierto)` perdió el
  parámetro `p` (la fecha límite ya no hace falta ahí: la etiqueta se calcula sola).
- **La etiqueta de vencimiento** (`Plazos.etiquetaVencimiento(limite)`, nueva, `js/plazos.js`):
  sustituye al botón "Plazo" y a `.marca-plazo` (quitada de la cabecera). Devuelve
  `{texto, clase}`; `clase` es `''` (normal), `vencimiento-cerca` (ámbar: hoy o quedan ≤2 días —
  **umbral propio, no `DIAS_CERCA` (7) de `Plazos.de`**, que sigue igual para
  `js/avisos.js`/`js/que-me-toca.js`/la tarjeta de la lista, incluida su regla de que "vence hoy"
  cuenta como vencido allí, no aquí), `vencimiento-vencido` (rojo) o `vencimiento-sin` (sin
  fecha). Texto: "Vence el D-mmm · quedan N días" / "Vence hoy" / "Venció hace N días" / "Sin
  plazo" (`fechaCortaSinAno`, propia de este fichero, sin año). Se pinta con
  `<button class="boton-vencimiento ...">` (`css/ficha-asunto.css`); al pulsarla abre el mismo
  `App.editarPlazo(a)` de siempre.
- **"El encargo"**: un solo botón que abre el cuadro de "Lo pide" de siempre
  (`abrirLoPide(a)`, sigue en `js/ficha-asunto.js`) con la vía de comunicación
  (`a.ficha.via`/`viaDato`, antes su propio botón vía `App.editarVia`) metida dentro como un
  campo más. `LoPide.controles(caja, persona, valorInicial, viaInicial)` gana un 4º parámetro
  `viaInicial = {via, viaDato}` y devuelve además `leerVia()` (`{via, dato}`, nunca `null`, a
  diferencia de `leer()` que sigue devolviendo `null` sin "quién"): las dos preguntas
  —quién lo pide y por dónde— se guardan juntas en un solo `App.anotar`, pero no dependen la una
  de la otra (se puede guardar la vía sin haber elegido "quién lo pide"). Ninguna de las dos
  cambia de sitio en `asuntos.json` (`loPide` y `via`/`viaDato`/`viaEl`/`viaPor`, igual que
  siempre); `App.editarVia` sigue tal cual, sigue usándolo la tarjeta de la lista
  (`js/asuntos-lista.js`). `js/via-contacto.js` envuelve `LoPide.controles` (además de
  `App.editarVia`, que no se toca) para poner las sugerencias de teléfono/correo también en el
  campo `.lopide-via-dato` del cuadro nuevo, solo si `controles()` recibe `persona`. Desde la
  fila 106 (24-sep-2026, `docs/LO-PIDE-EN-LA-CABECERA.md`) el botón va siempre solo, sin línea
  debajo: quién lo pide sale una sola vez, en la marca `.marca-lopide` de arriba, con la relación
  entre paréntesis y en minúscula (`LoPide.etiqueta`, que no la repite si el nombre ya es "Tutor
  legal N"); la vía solo se ve al abrir "El encargo".
- **"Comunicar"**: `js/correo.js` deja de montar dos botones ("Correo", "Mensaje Séneca") y monta
  uno (`.boton-comunicar`) con `FichaMenus.montar(b, [...])` (dos opciones, mismas llamadas a
  `abrirCuadro(a, false/true)` de siempre). Como este fichero pinta por su cuenta (mismo patrón de
  `MutationObserver` que ya usaba), inserta el botón con `caja.insertBefore(b, principal)` antes
  de `.boton-principal`, no con `appendChild`: si no, "Comunicar" podría acabar después de
  "Archivar" según el orden de llegada de los observadores.
- **El menú de tres puntos del `<h2 class="ficha-nombre">`** (`js/ficha-nombre-acciones.js`):
  envuelve `App.abrirFicha` igual que `js/copiar.js`, con su propio
  `MutationObserver` sobre `#pantalla-asunto` para sobrevivir a cada repintado con `innerHTML`.
  Opciones: "Editar el asunto" y, con `window.Papelera`, una raya y "Borrar el asunto" en rojo
  (`.ficha-menu-peligro`) — las dos solo si `abierto` (no existen en el ARCHIVO, igual que antes
  no existían los botones). Sin ninguna opción (ARCHIVO), el botón "⋯" ni se pone. "Copiar el
  nombre del asunto" ya no vive aquí desde la fila 58 (18-sep-2026,
  docs/AJUSTES-DE-USO-2026-09-18.md, 1): es el botón "Asunto" de la fila de copiar de un gesto,
  ver más abajo. Las dos opciones llaman a `App.volverALaLista()`, expuesta desde
  `js/ficha-asunto.js` para que este fichero pueda volver a la lista igual que hacían los
  botones de siempre.
- **La fila de copiar de un gesto** (18-sep-2026, fila 58, `js/ficha-nombre-acciones.js`,
  `ponerFilaDeCopiar`): debajo del `<h2>`, siempre a la vista, sin menú — Asunto, Ruta, NIE, Nombre
  y DNI/CIF, en ese orden; un botón sin dato no se pone. **«Ruta»** (fila 98,
  `docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md`, `js/copiar-ruta.js`, `RutaCarpetas.boton`) copia la ruta
  de la carpeta para pegarla en el explorador: la de abiertos (o la del ARCHIVO + `a.ruta` del
  índice, o categoría y tercero) que cada uno apunta en Ajustes → El centro → «Rutas de las carpetas
  en este ordenador» (`localStorage`, `gestor-ruta-abiertos`/`gestor-ruta-archivo`, nunca en
  `_GESTOR`), más el nombre; con `\` si empieza por letra de unidad o `\\`, con `/` si no. Sin ruta
  apuntada copia solo el nombre y avisa en ámbar. Abrir la carpeta sigue descartado. Prueba:
  `pruebas/copiar-ruta.mjs`. Sustituye al icono `.boton-nie` que antes
  vivía pegado al `<h2>` (quitado de `js/copiar.js`) y a "Copiar el nombre del asunto" del menú
  de tres puntos. Reutiliza `Copiar.boton` (el mismo copiado con aviso "Copiado" de siempre,
  ahora expuesto en `window.Copiar` junto con `nieDeAsunto`, `categoriaDe` y `copiar`); "Asunto"
  y "NIE" salen al momento (el número sale del propio nombre de la carpeta, sin fichero de
  datos); "Nombre" y DNI/CIF (el botón se llama CIF en empresas, `Copiar.categoriaDe(a)`) piden
  `FichaTercero.datosBasicos(a)`, que tarda. Esos dos se reservan **ocultos** (`hidden`) desde el
  primer pintado y "revelar" solo les cambia `hidden` y a qué copia el clic, nunca añade un nodo
  nuevo: añadirlo tarde es una mutación dentro de `#ficha-asunto-cuerpo`, y antes de esta fila
  `js/hitos-panel.js` vigilaba esa caja entera (ver más abajo), así que ese repintado de sobra le
  podía cerrar a Francisco un hito que acababa de desplegar para mirarlo. Se esconde entera con
  la cabecera encogida (`.ficha-cabecera.encogida .ficha-copiar-fila`), igual que la línea gris.
  Se comprueba con `pruebas/copiar-fila.mjs` (los cuatro botones, con RegAlum/RelPerCen/empresas
  de mentira) y con los puntos 3 y 4 de `pruebas/cabecera-del-asunto.mjs`.
- **`js/ficha-menus.js`** (nuevo): el menú pequeño reutilizable —abrir, cerrar con Escape (en
  captura, con `stopPropagation`) y al pulsar fuera, uno solo a la vez— que usan los tres puntos
  y "Comunicar". Muy parecido a `U.menuDeAcciones` (`js/util.js`), pero fichero aparte porque la
  fila lo pedía así (14). **Trampa real**: sin `stopPropagation` en el manejador de Escape,
  cerrar el menú con esa tecla se llevaba por delante la ficha entera, porque
  `js/usabilidad.js` también escucha Escape en el documento (fuera de captura) y, sin ningún
  `#capa` abierto, pulsa `#ficha-volver` — el mismo cuidado que ya toma `js/huecos-buscador.js`
  por el mismo motivo.
- **`esControlDeSoloLectura`** (`js/ficha-asunto.js`) deja activos en modo consulta el disparador
  de los tres puntos (`.ficha-nombre-menu-boton`: dentro, "Editar"/"Borrar" salen apagados solos,
  por ser botones normales sin marcar) y la clase `.boton-copiar-fila` (fila 58: copiar no
  cambia nada del asunto). "Comunicar" no se marca como de solo lectura: ya se apagaba entero en
  consulta antes de esta fila (ninguna de sus dos acciones estaba en la lista blanca), así que
  sigue igual, apagado el botón entero.
- **"Documentos ▾"** (`js/ficha-documentos.js`, `ponerBotonGestionar(bloqueEl, a)`): mismo
  `App.verDocumentos(a)` de siempre, ahora en la cabecera del propio bloque, al lado del título;
  se pinta también con la carpeta vacía (antes del primer `return` de `pintar(a)`), comprobando
  que no exista ya (el título no se rehace en cada repintado de la lista de documentos, solo
  `#ficha-documentos` por dentro).
- **El `<h2>` con la cabecera encogida**: el nombre pasa a `<span class="ficha-nombre-texto">`
  dentro del `<h2>`; solo ese `<span>` lleva `overflow: hidden; text-overflow: ellipsis;` con la
  cabecera encogida, nunca el `<h2>` entero, para que los tres puntos —hermano del `<span>`, no
  dentro de él— no se recorten con un nombre largo (`.ficha-cabecera.encogida .ficha-nombre`
  pasa a `display: flex`).
- Se comprueba con `pruebas/cabecera-del-asunto.mjs` (11 escenarios): la barra con sus cinco
  elementos y sin ninguno de los viejos, el menú de tres puntos (ahora de dos opciones) y que
  Escape no echa de la ficha, el "NIE" de la fila de copiar según lleve o no número, la etiqueta
  de vencimiento pulsable y sus textos/colores
  (probados llamando a `Plazos.etiquetaVencimiento` directamente, con fechas relativas a `hoy`,
  sin depender de qué día se ejecute la prueba), "Comunicar" con sus dos cuadros, "El encargo"
  guardando los dos datos de una vez, "Documentos ▾" también con la carpeta vacía, modo consulta,
  y la cabecera encogida. Los cuadros de Correo/Séneca/Documentos se cierran con Escape en la
  prueba, no pulsando `#cuadro-cancelar`/`#cuadro-aceptar`: los tres abren con `sinCancelar`
  (el botón queda oculto) y, en pantallas cortas, el de aceptar puede quedar fuera de la parte
  visible del cuadro.

### Las tarjetas por tipo de asunto

Dentro de "En el departamento" y de "A la espera de terceros", encima de la lista, sale una fila
de tarjetas pequeñas: una por cada tipo de asunto presente, con cuántos son y, en rojo, cuántos
están fuera de plazo. La primera es "Todos". Con un solo tipo, las tarjetas no salen. Las cuentas
se hacen sobre lo que ya han dejado pasar el buscador y los filtros. Orden por cantidad, de más a
menos, y a igualdad alfabético. Vive en `js/asuntos-lista.js`, estilos en `css/vista.css`.

### "Lo pide": quién ha pedido la gestión (17-sep-2026, fila 28, docs/LO-PIDE.md)

Cada asunto puede guardar, si se quiere, quién lo pidió, por qué vía y en qué fecha: el problema
real es un certificado pedido hace días, ya listo, sin recordar a quién hay que contestar. Clave
opcional `loPide` en la ficha del asunto (`_GESTOR/asuntos.json`), escrita con `App.anotar` (nunca
con `Carpetas.guardarJson`), y `null` (no `undefined`) para vaciarla:

    loPide: { nombre, categoria, relacion, correo, telefono, via, fecha, apuntadoPor }

`categoria` es la del tercero elegido (`ALUMNADO`/`PERSONAL`/`EMPRESAS`/`OTROS`), vacía si se
escribió a mano; `via` es la misma clave que usa el asunto (`Nombres.VIAS`); `fecha` es ISO
(`AAAA-MM-DD`). **El parentesco real (padre, madre, abuela) no existe en los datos del centro**
(el RegAlum no trae esa columna): las opciones de alumnado son "Tutor legal 1"/"Tutor legal 2", y
solo con "Otra persona…" se escribe algo a mano.

Toda la lógica vive en el módulo nuevo `js/lo-pide.js` (`window.LoPide`), para no engordar
`js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`:

- `LoPide.opciones(persona)`: los candidatos, siempre "El propio interesado" y "Otra persona…",
  más "Tutor legal 1/2" (solo alumnado, y solo si Séneca trae su nombre), con los datos de cada
  uno (`nombre`, `correo`, `telefono`) ya resueltos.
- `LoPide.datosDeTutor(campos, numero)`: sacada de `js/plantillas.js` (que ahora la llama en vez
  de tener su propia copia), porque `LoPide.opciones` también la necesita. El nombre no es "la
  primera columna que no sea teléfono ni correo" (17-sep-2026, fila 38, docs/LO-PIDE-NOMBRE-DEL-
  TUTOR.md: en el RegAlum del centro esa primera columna solía ser el documento del tutor, y salía
  un número donde debía ir su nombre): descarta además las columnas de documento/identificación,
  número/código, parentesco/relación/sexo, fecha/nacimiento y domicilio/dirección, y de las que
  quedan arma el nombre por prioridad (Apellidos + Nombre si hay las dos columnas, si no la que
  haya de las dos, si no la primera que sobreviva), con una red de seguridad: sin ninguna letra en
  el resultado, nombre vacío. Sin nombre pero con teléfono o correo, la opción no desaparece: se
  ofrece como "Tutor legal 1/2" a secas, con `relacion: ''` para no repetirlo en la línea de
  `LoPide.texto`.
- `LoPide.controles(caja, persona, valorInicial, viaInicial)`: pinta el desplegable, los campos
  de "Otra persona…" (solo visibles con esa opción), la vía (desplegable `.lopide-via` +
  `.lopide-via-dato`, el mismo par que `a.ficha.via`/`viaDato`) y la fecha, **con clases, nunca
  con id**: este mismo módulo se monta a la vez dentro de `#bloque-detalles` de "Nuevo asunto"
  (que queda en el documento, aunque escondido, mientras dura la sesión) y dentro del cuadro de
  la ficha; dos elementos con el mismo id habrían roto el segundo sitio que se pintara. `viaInicial`
  (`{via, viaDato}`, 18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md) es opcional, para cuando
  quien llama también quiere preguntar la vía de comunicación del asunto en el mismo cuadro.
  Devuelve `{ leer(), leerVia() }`: `leer()` sigue devolviendo `null` sin "quién" puesto;
  `leerVia()` da `{via, dato}` siempre, aunque no se haya elegido "quién lo pide".
- `LoPide.texto(ficha)`/`LoPide.correoDe(ficha)`: la línea legible ("María López (Tutor legal 1)
  · por teléfono · 17-sep-2026") y la dirección de quien lo pide, o cadena vacía sin dato.
- `LoPide.elegirDestinatarios(correos, correoLoPide, elegidosDeAntes)`: pura, sin DOM, para poder
  probarse sin cargar el cuadro de Correo entero (que no expone nada hacia fuera): decide qué
  casilla queda marcada.

Dónde se engancha: grupo **"Lo pide (opcional)"** en `#bloque-detalles` de `js/asuntos-nuevo.js`
(se repinta al cambiar de tercero con `App.fijarTercero`; `App.datosDelFormulario()` añade
`loPide` solo si hay nombre). Fila **"Lo pide"** (debajo de "Vía de comunicación") y marca
`.marca-lopide` en la cabecera de `js/ficha-asunto.js` (esta marca **no** se ha quitado en la
fila 52: solo se quitaron `.marca-estado` y `.marca-plazo`). El botón, en asuntos abiertos, es
desde la fila 52 (18-sep-2026) **"El encargo"**, que abre el mismo cuadro de siempre
(`abrirLoPide(a)`) con la vía de comunicación metida dentro (ver la sección de la cabecera, más
arriba); "Quitar el dato" sigue dentro del cuadro cuando ya hay uno, y solo quita `loPide`, nunca
la vía. Apagado en modo consulta, como el resto de controles que modifican, pero **no** en la
lista `esControlDeSoloLectura`. En `js/correo.js`: si se conoce el correo de quien lo pide y está entre
los de la lista, se marca esa casilla sola; si no está, va a "Otro correo" y ninguna casilla queda
marcada; encima de "Para" sale una línea gris "Lo pidió Fulano (relación), el día tal."; `aQuien`
(Séneca) devuelve su nombre en vez del de siempre. Cuatro huecos nuevos en `js/plantillas.js`
(`{quienlopide}`, `{quienlopiderelacion}`, `{quienlopidevia}`, `{quienlopidefecha}`), vacíos como
cualquier otro hueco cuando el asunto no tiene el dato.

No toca `js/conflictos.js` (fusiona `loPide` como un campo más que gana el lado elegido, igual que
hoy), `js/asuntos-editar.js`, `js/papelera.js`, `js/asuntos-lista.js` ni el script de Apps Script.
Se comprueba con `pruebas/lo-pide.mjs`, sin navegador (jsdom).

### Que no se dupliquen los asuntos

- **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto): si ya hay
  uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico (el grupo y el
  texto libre **no cuentan**), se para del todo: cuadro "Este asunto ya existe", con "Abrir el
  que ya existe" (a la ficha si está abierto, o a su carpeta del ARCHIVO si está archivado) o
  "Crear otro de todas formas". Si a alguno de los dos le falta el año académico, cuenta como
  coincidencia (`Duplicados.coincideCurso`).
  - Con varios candidatos abiertos, el de partida es el más reciente
    (`Duplicados.candidatoMasReciente`).
  - Todo envuelto en `try/catch`: **la comprobación nunca debe impedir crear un asunto**; si
    falla al mirar, se sigue como si no hubiera nada.
- **Unir dos que ya existen** (`js/unir-asuntos.js`), desde la pantalla propia "Duplicados" (ver
  más abajo): se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro
  se mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final),
  los pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra.
  Si algún fichero choca de nombre entre las dos carpetas (fila 75,
  docs/HUECOS-ENCONTRADOS-FILA-69.md, 1: hasta esa fila esto paraba la unión entera y pedía
  renombrar a mano), el que viene de la carpeta que se va entra con " (2)", " (3)"... —el mismo
  patrón que ya usa `Carpetas.fusionarEn` al archivar sobre un destino que ya existe—, y al
  terminar se avisa de cuántos documentos se han tenido que renombrar así. Nada se pierde ni se
  para.
- Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir), cargado justo
  después de `js/asuntos-lista.js` (define `App.pintarAbiertos`).

Se comprueba con `pruebas/duplicados.mjs`.

### La pantalla propia "Duplicados"

- Aviso de una línea junto al botón Actualizar de Asuntos abiertos: `⚠ N posible(s)
  duplicado(s) — Revisar` (`#btn-duplicados`, oculto sin ninguno).
- Pantalla propia "Duplicados" (no está en la barra lateral), con botón Volver. Cada grupo en
  columnas: nombre de la carpeta (enlaza a su ficha), fecha de apertura / estado / vía / fecha
  límite, documentos (se abren con `Visor.abrir`) y las tres últimas notas ("y N más" si hay
  más).
- Botón Unir, igual que siempre.
- Botón "No son el mismo": descarta el grupo por la firma exacta de sus nombres (ordenados y
  unidos) en `_GESTOR/no-duplicados.json`. Si el grupo cambia de miembros, la firma deja de
  coincidir y el aviso vuelve a salir solo.
- Reversible en Ajustes (pestaña Mantenimiento): bloque "Duplicados descartados", con "Volver a
  avisar" por entrada.
- Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`), sin tocar
  `js/ajustes.js` ni la barra: la pantalla la crea el propio módulo (`App.PANTALLAS.push`), y su
  bloque de Ajustes se cuelga de `#ajustes-tab-mantenimiento` (antes, de `#pantalla-ajustes`
  entera), enganchado con `window.Gestor.alRefrescar`.
- `no-duplicados.json` entra en las copias de seguridad de `js/copias.js`.


---
