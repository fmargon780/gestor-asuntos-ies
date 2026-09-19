# Crear, editar, archivar/reabrir, unir, duplicados y papelera de un asunto

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar el ciclo de vida de un asunto, su ficha, la papelera, unir o archivar. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### La ficha de un asunto

Al pulsar el nombre de un asunto se entra en su ficha: sus datos, el contacto del tercero, la
guía de su tipo con las casillas, sus notas, sus documentos y los demás asuntos del mismo
tercero.

**La tarjeta de la lista se queda con lo justo**: el desplegable del estado, "Copiar nombre" y
"Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una lista blanca
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

Con esto, `App.verAbiertos` sirve para todas las formas de guardar un documento dentro de un
asunto (registrar, nombrar, sello de Séneca, generar desde plantilla, separar/unir/sacar páginas,
meter un suelto o un correo) sin que ninguna tenga que saber de la ficha: **Editar**,
**Archivar/Reabrir** y **Borrar** siguen siendo los únicos que de verdad vuelven a la lista,
llamando a `volverALaLista()` como hasta ahora. Se comprueba con
`pruebas/quedarse-en-el-asunto.mjs`.

**La disposición de la ficha** (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md): cambio de
disposición, ningún funcionamiento distinto. La regla: arriba a la izquierda lo que hay que
hacer, arriba a la derecha lo que hay que saber, lo que casi nunca se mira plegado con su número
al lado.

- **La línea gris de la cabecera** (`.ficha-subtitulo`, dentro de `<header class="ficha-cabecera">`,
  justo debajo de `<h2 class="ficha-nombre">`): `subtituloDeFicha(a)` en `js/ficha-asunto.js` junta,
  separados por ` · `, lo que no se repite en ningún otro sitio de la pantalla — Abierto el
  (`U.fechaLegible(a.leido.fecha)`), Categoría, Año académico, Descripción y Lo abrió—; lo vacío no
  deja ni el separador ni un hueco. Se esconde entera con la cabecera encogida
  (`.ficha-cabecera.encogida .ficha-subtitulo { display: none; }`, `css/ficha-asunto.css`): no
  entra en el reparto por `order` de la fila 46, solo desaparece.
- **Tres columnas** (`.ficha-columnas`, `css/ficha-asunto.css`, mobile-first con `@media
  (min-width: …)`, al contrario que el resto del fichero que usa `max-width`): izquierda, Hitos;
  centro (`.ficha-centro`, nueva), Documentos de la carpeta; derecha, Datos y contacto → Notas →
  los dos plegables → Datos del trámite (si tiene algo que decir). Por debajo de 1000px, una sola
  columna en el orden del HTML; de 1000 a 1499px, dos (el centro debajo de la izquierda,
  `grid-row`); de 1500px en adelante, las tres a la vez. Con `body.con-visor`/`body.con-lector` se
  fuerza una columna con `grid-column/row: auto` en los tres tramos —si no, un tramo pediría una
  columna o una fila que ya no existe con una sola columna, y el sitio le saldría mal.
- **"Datos del asunto" se desmonta y pasa a llamarse "Datos del trámite"**: `datosDelAsunto(a)`
  (ya no lleva `p`, la fecha límite se quitó) solo deja los campos propios del tipo
  (`filasDeCampos`), Vía de comunicación, Lo pide y En el archivo — el resto ya se ve en la
  cabecera, en sus marcas o en "Datos y contacto". **Sin ninguna fila, devuelve `null` y el bloque
  entero no se pinta**, ni el título ni la tarjeta (antes `filas()` pintaba "Nada que enseñar
  aquí."; `filasHtml()`, nueva, es la parte de `filas()` que solo dibuja, reutilizada aquí y por
  `filas()` para los sitios que sí quieren ese aviso).
- **Los dos bloques plegables** (`js/ficha-plegables.js`, `window.FichaPlegables`, nuevo, pequeño
  a propósito para no engordar `js/ficha-asunto.js`, que ya pasaba de las 400 líneas desde antes):
  "Otros asuntos de este tercero" y "Personas y entidades relacionadas" usan el
  `<details class="ficha-bloque ficha-plegable">` que ya estaba en `css/ficha-asunto.css` (líneas
  158-168 de antes de esta fila) sin que nadie lo usara. `FichaPlegables.bloque(id, titulo,
  idDentro, textoDeEntrada)` monta el molde; `estadoActual(raiz)`/`reponer(raiz, estado)` guardan
  qué `<details>` estaba abierto antes de que `pintarLaFicha()` rehaga el `innerHTML` entero y lo
  reabren después (mismo patrón que `volverADesplegar` de `js/hitos-panel.js`); cerrados de
  partida, sin nada guardado. `FichaPlegables.ponResumen(caja, texto, vacio)` la llama quien pinta
  el contenido (`js/otros-del-tercero.js`, `js/relacionados.js`) en cuanto sabe la cuenta, aunque
  el bloque siga cerrado: "1 asunto"/"3 asuntos"/"ninguno todavía", "2 personas"/"nadie todavía";
  con la cuenta a cero, `.ficha-plegable-vacio` deja el título en gris suave y sin negrita.
- **Un bloque vacío ocupa una línea, no una tarjeta**: `.ficha-bloque.vacio` (`css/ficha-asunto.css`)
  pone el título y el aviso en una sola línea, con menos padding. Hoy solo lo pone
  `js/ficha-documentos.js` cuando la carpeta no tiene ningún documento
  (`caja.closest('.ficha-bloque').classList.toggle('vacio', !lista.length)`).
- Se comprueba con `pruebas/ficha-disposicion.mjs`, en navegador de verdad: el orden de
  `.ficha-derecha`, que `#ficha-notas` vaya antes que `#ficha-otros`, el contenido de la línea
  gris, que "Datos del asunto" no exista, "Datos del trámite" con y sin campos propios, los dos
  plegables (cerrados de partida, el resumen con la cuenta aunque estén cerrados, y que sobreviven
  a un repintado forzado cambiando el estado), el bloque de Documentos vacío, y la rejilla a
  1600px (tres columnas), 1200px (dos, el centro debajo) y con `body.con-lector` (una).

**La cabecera de la ficha, agrupada por el trámite** (18-sep-2026, fila 52,
docs/CABECERA-DEL-ASUNTO.md): cambio de disposición y de agrupación, ninguna acción desaparece ni
cambia lo que hace. Va después de la fila 51 (da por hecha `.ficha-subtitulo`).

- **`#ficha-acciones` queda en cinco elementos**, siempre en este orden: el desplegable de
  estado, la etiqueta de vencimiento, "El encargo", "Comunicar" (lo añade `js/correo.js`, ver
  abajo) y "Archivar"/"Reabrir" (`.boton-principal`, con `margin-left: auto` en
  `css/ficha-asunto.css` para pegarlo al borde derecho). `pintarAcciones(a, abierto)` perdió el
  parámetro `p` (la fecha límite ya no hace falta ahí: la etiqueta se calcula sola).
- **El estado, con su color**: el `<select class="campo campo-estado">` lleva además la clase
  `App.colorEstado(situacion)` (`estado-0`…`estado-5`, `estado-x`) cuando hay situación puesta.
  Funciona sin CSS nuevo: `.estado-N` (css/estilos.css) y `.campo` tienen la misma especificidad
  de una sola clase, y `.estado-N` va declarada después en el propio fichero, así que gana en el
  fondo y el color sin tocar nada de `.campo`.
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
  campo `.lopide-via-dato` del cuadro nuevo, solo si `controles()` recibe `persona`. El botón
  muestra debajo, en gris (`.ficha-encargo-resumen`), `relación · por vía` cuando hay algo que
  enseñar (`resumenDelEncargo(a)`, en `js/ficha-asunto.js`); "va solo" si no hay nada.
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
  `ponerFilaDeCopiar`): debajo del `<h2>`, siempre a la vista, sin menú — Asunto, NIE, Nombre y
  DNI/CIF, en ese orden; un botón sin dato no se pone. Sustituye al icono `.boton-nie` que antes
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
  Si algún fichero choca de nombre entre las dos carpetas, no se mueve ni se borra nada, y avisa
  de cuáles.
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

Se comprueba con `pruebas/duplicados.mjs`.

### La papelera

Nada se borra de verdad a la primera: se manda a una papelera compartida, de la que se puede
devolver a su sitio.

- **Dónde hay botón Borrar, y dónde no**: documento dentro de un asunto (ficha y "Gestionar
  documentos"), documento suelto, un asunto **abierto** desde su ficha (nunca desde la tarjeta,
  ni en el ARCHIVO), tipo de asunto, estado, tipo de documento, campo propio, y persona o
  empresa dada de alta a mano (nunca la que viene de Séneca). Botón siempre "Borrar"
  (`.boton-peligro`), el último de su fila.
- **La papelera**: carpeta `_GESTOR/PAPELERA` + índice `_GESTOR/papelera.json` (la más nueva
  arriba). Un fichero o carpeta se mueve a su propia subcarpeta `AAMMDD-HHMM <nombre>`, con
  `Carpetas.trasladar` / `Carpetas.moverFichero` (si la copia no sale completa, no se borra
  nada). Lo que no es fichero (tipo, estado, persona, nota…) no tiene carpeta: su dato se guarda
  entero en la ficha del índice. `papelera.json` se relee antes de escribir y entra en las
  copias de seguridad.
- **Comprobaciones antes de borrar**: un tipo de asunto no se borra si hay asuntos con ese tipo
  (se dice cuántos), y si tiene guía se avisa de que se va con él (se guarda en la papelera para
  poder devolverla junto con el tipo). Un estado no se borra si algún asunto lo tiene puesto. Un
  campo propio no se borra si está asociado a algún tipo (se dice a cuáles). Un tipo de
  documento se borra siempre. Una persona o empresa no se borra si tiene asuntos (se mira con
  `Duplicados.delTercero`), y solo si se dio de alta a mano.
- **Confirmación**: un solo cuadro, "¿Mandar a la papelera?", con el nombre en negrita. Un
  asunto abierto con documentos lleva un segundo cuadro "¿Seguro?" después del primero (nunca
  los dos a la vez).
- **Bloque Papelera de Ajustes** (el último): qué era, nombre, de dónde salía, quién y cuándo
  ("hace N días"), y botones **Devolver a su sitio** / **Borrar del todo** (con su propia
  confirmación). Aviso ámbar si algo lleva más de 30 días, con botón para borrarlo todo de
  golpe. **La papelera no se vacía sola, nunca**: es una decisión de Francisco (fila 68,
  docs/AVISOS-QUE-FALTAN.md, 3), preguntada y todavía sin decidir; mientras tanto solo se ha
  hecho el aviso más insistente, nunca el borrado solo.
- **El mismo aviso, también en "Asuntos abiertos"** (19-sep-2026, fila 68, 3): antes solo se veía
  entrando a propósito en Ajustes. `js/avisos-que-faltan.js` pinta una línea junto a
  `#panel-avisos`/`#panel-frescura` con cuántas cosas son y cuánto ocupan de verdad en disco
  (`Papelera.tamanoDeViejas`, que solo se llama aquí, nunca al pintar la lista entera de la
  papelera). Sin botón para quitarlo sin decidir: lleva a Ajustes → Mantenimiento, al mismo
  bloque de siempre. Se repinta al envolver `App.verAbiertos` (no en cada tecla del buscador,
  que llama a `window.Gestor.alRefrescar` mucho más a menudo y esto cuesta disco).
- **Devolver a su sitio**: si el asunto de un documento ya no existe, se ofrece "Por
  clasificar". Si ya hay algo con ese nombre en el destino, no se pisa nada.
- **El rastro**: al mandar/devolver un documento desde un asunto, se anota una nota
  (`Notas.anadir`). Un asunto entero no tiene dónde apuntarlo: el rastro es la ficha de
  `papelera.json`.
- Vive en `js/papelera.js` (`window.Papelera`), cargado tras `js/dni.js` y antes de
  `js/inicio.js`. Documento suelto y persona dada de alta a mano lo llevan por envoltura
  (`App.tarjetaSuelto`, `App.verFicha`); donde el botón va dentro de una función privada, se ha
  tocado el fichero directamente.

Se comprueba con `pruebas/papelera.mjs`.

### Archivar cuando el destino ya existe

Fila 32 de `docs/COLA.md`, 17-sep-2026: le bloqueó un asunto real. `Carpetas.trasladar` crea la
carpeta de destino y copia dentro; si algo falla a mitad (Dropbox sincronizando, un fichero
bloqueado), **ahora limpia esa carpeta a medias** antes de lanzar el error (`try/catch` alrededor
de la creación, la copia y la comprobación de la cuenta) — antes se quedaba tal cual, y el
siguiente intento de archivar ese asunto encontraba "ya hay una carpeta con ese nombre" y no
podía salir de ahí nunca.

Si el destino ya existe **de verdad** (un archivado de antes de este arreglo, que se quedó a
medias), `Carpetas.fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino)` junta las dos
carpetas en vez de fallar: recorre el origen con sus subcarpetas, un fichero que no está en el
destino se copia, uno que está con el mismo tamaño se da por copiado, y uno con distinto tamaño
se copia al lado con `" (2)"`, `" (3)"`… antes de la extensión, sin pisar nunca nada. Solo si al
final cada fichero del origen aparece de verdad en el destino (con su nombre o con el sufijo, y
el mismo tamaño) se borra el origen, con `removeEntry` directo: no se envuelve en `js/papelera.js`
porque viviría en el sentido contrario (`Papelera` ya depende de `Carpetas`) y no hay ahí ninguna
función pública que valga (`mandarAsunto` es del registro de un asunto que se está borrando, no
de un origen ya fusionado). `Carpetas.trasladar`/`mover`/`renombrar` **no cambian**: si el destino
existe, siguen fallando; solo `App.cerrarAsunto` y `App.reabrirAsunto` (`js/asuntos-archivar.js`,
sacado el mismo día de `js/documentos-sueltos.js` por pasar de 400 líneas) miran primero si el
destino ya existe y, si es así, avisan en el propio cuadro de confirmación (mismo botón, sin
preguntar nada más) y usan `fusionarEn`. `js/asuntos-archivar.js` va cargado justo después de
`js/documentos-sueltos.js` y antes de `js/relacionados.js`/`js/hitos-archivo.js`, que envuelven
esas dos funciones.

Se comprueba con `pruebas/archivar-fusion.mjs`, sin navegador.

### Los atascos al archivar: mensajes en castellano y carpetas movidas

Fila 45 de `docs/COLA.md`, 17-sep-2026: un asunto real seguía sin poder archivar después de la
fila 32, con "No se ha podido archivar: A requested file or directory could not be found..." — un
`NotFoundError` del navegador, en inglés, porque `App.cerrarAsunto` enseñaba `e.message` sin
traducirlo.

- **`U.mensajeDeError(e)`** (`js/util.js`), un solo sitio para traducir por `e.name`:
  `NotFoundError`, `NotAllowedError`, `NoModificationAllowedError`/`InvalidStateError`,
  `QuotaExceededError` y `AbortError` salen en castellano; cualquier otro (los nuestros) se
  devuelve tal cual. Lo usan `App.cerrarAsunto` y `App.reabrirAsunto` en su `catch`.
- **Los temporales de sincronización no cuentan ni se copian**: `Carpetas.contarFicheros`,
  `copiarDentro` y `fusionarDentro` (`js/carpetas.js`) se saltan todo lo que
  `esCarpetaTemporalDeSincronizacion` reconozca, para que la cuenta de origen y la de destino
  hablen de lo mismo (antes, un `.tmp` o un `desktop.ini` de Dropbox podía descuadrar la
  comprobación "llegados !== esperados" y deshacer un traslado sin motivo real).
- **Un fichero que se esfuma a mitad de copia** (`leerFicheroParaCopiar`, usada por `copiarDentro`
  y por la fusión): si `getFile()` lanza `NotFoundError`, se reintenta una vez tras esperar un
  segundo; si sigue sin estar, el error dice su nombre, en castellano, y no se borra nada.
- **La carpeta ya no está donde se esperaba**: `App.cerrarAsunto` mira primero, dentro del `try`,
  si la carpeta sigue en Asuntos abiertos (`Carpetas.existe`). Si no está, pero sí está en
  `ARCHIVO/categoría/tercero`, es que el archivado ya se hizo: no copia nada, pone la ficha al día
  (estado, categoría, tercero, `cerradoEl` solo si no lo tenía, y los ficheros contados en el
  destino) y avisa en verde. Si no está en ningún sitio, avisa en ámbar pidiendo pulsar Recargar
  (clase CSS nueva `.mensaje.ambar` en `css/estilos.css`, con `--ambar-linea`; antes `U.aviso` solo
  tenía `malo`/`bueno`). `App.reabrirAsunto` hace lo mismo con `a.padre` (el manejador de carpeta
  guardado al pintar ARCHIVO, o al montarlo a mano desde el correo o Por clasificar, que puede
  estar viejo): si `a.padre` no sirve, recalcula con
  `Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false)`; si tampoco aparece ahí
  pero ya está en Asuntos abiertos, se da por reabierto sin copiar nada; si no aparece por ningún
  lado, el mismo aviso ámbar.

Se comprueba con `pruebas/archivar-atascos.mjs`, en navegador de verdad (reutiliza el disco de
mentira de `pruebas/navegador.mjs`), con los seis escenarios del documento.

### El índice del ARCHIVO

Fila 44 de `docs/COLA.md`, 17-sep-2026, `docs/BUSCADOR-ARCHIVO-INDICE.md`. Antes, `App.verArchivo`
recorría el archivo entero (categoría → tercero → asunto) cada vez que se entraba, y buscaba con
`indexOf` sobre un solo texto. Ahora hay un índice guardado, `_GESTOR/indice-archivo.json` (ver la
tabla de ficheros), y la búsqueda es por palabras sueltas.

- **`js/archivo-indice.js`** (`window.IndiceArchivo`) es el módulo del índice: se lee y se escribe
  **directo con `Carpetas`, nunca con `Copias.guardar`**, igual que `js/presencia.js` — fuera de
  las copias de seguridad, la papelera y la fusión de conflictos, porque se puede rehacer entero en
  cualquier momento.
  - `construir(onProgreso)` recorre el archivo entero una vez y devuelve el índice sin guardarlo
    (`onProgreso(categoria, total)` por categoría, para la línea de estado). De paso detecta los
    asuntos **descolocados**: una carpeta justo debajo de la categoría cuyo nombre parece un asunto
    (`Nombres.leer` le saca fecha y tipo) entra con `tercero: ''` y `sueltoEn: 'bajo la categoría'`;
    una que no parece asunto se mira un nivel más adentro por si esconde uno (cuatro niveles o
    más), con `sueltoEn` a la ruta donde se encontró. No se mueve nada, solo se señala.
  - `guardar(indice)` relee el disco y fusiona por nombre de carpeta antes de escribir, como
    `Grupos.guardar`: lo que hubiera en disco y no esté en lo recién construido (el compañero
    archivó algo desde el otro ordenador mientras tanto) se suma.
  - `anadirEntrada(entrada)`/`quitarEntrada(nombre)` tocan una sola entrada sin reconstruir nada;
    silenciosas si el índice todavía no existe.
  - `recuentoActual()` es el recuento barato del punto 6.2: solo categorías y carpetas de tercero
    (un nivel), para comparar con el `recuento` guardado sin recorrer los asuntos.
  - `textoDeBusqueda(entrada)` junta lo del índice (nombre, categoría, tercero, ruta, tipo, curso,
    grupo, documentos, registros de Séneca) con los pocos campos de la ficha que la propia entrada
    ya guarda desde la fila 64 (ver más abajo): situación, vía y su dato, quién lo pidió,
    relacionados y campos propios. Normalizado una vez.
  - `resolverHandle(entrada)` calcula el manejador real de una carpeta a partir de lo que el índice
    sabe (categoría, tercero, ruta, `sueltoEn`): el índice no puede guardar manejadores en un JSON.
- **`App.verArchivo`** (`js/archivo-personas.js`) lee el índice; si no existe, está roto o es de
  otra versión, cae al mismo recorrido de disco de siempre (`IndiceArchivo.construir()`, sin
  guardarlo) y avisa "El índice no está hecho. Reconstruir el índice."; si el recuento barato no
  cuadra con el guardado, enseña el índice igual y avisa "El índice puede no estar al día." — nunca
  se reconstruye sola. El botón **"Reconstruir el índice"**, junto a "Actualizar", llama a
  `IndiceArchivo.construir()` + `guardar()`; si algo falla a mitad, no se escribe nada a medias.
- **`App.pintarArchivo`** ya no usa `indexOf`: normaliza lo escrito, lo parte en palabras, y un
  asunto sale si tiene TODAS en su `busca` (calculado una vez al cargar el índice, no en cada
  tecleo). Sin resultados: "Ningún asunto archivado tiene todas esas palabras."
- **`js/asuntos-archivar.js`** da de alta y de baja el índice sin reconstruirlo entero:
  `App.cerrarAsunto` añade la entrada (con `actualizarIndiceAlArchivar`) justo después de que el
  traslado haya salido bien, en los dos sitios donde puede acabar archivado (el normal y el "ya
  estaba archivado"); `App.reabrirAsunto` la quita (`actualizarIndiceAlReabrir`) y **ya no llama a
  `App.verArchivo`**: con el índice al día, basta repintar `App.E.listaArchivo` en memoria.
- Las tarjetas del ARCHIVO no traen manejador de carpeta: `js/archivo-personas.js` envuelve
  `App.verDocumentos` para resolverlo con `IndiceArchivo.resolverHandle` justo antes de abrirlo.
  "Reabrir" no hace falta tocarlo: `App.reabrirAsunto` ya sabía recalcular la carpeta cuando
  `a.padre` faltaba o estaba viejo (fila 45, más arriba).

Se comprueba con `pruebas/archivo-indice.mjs`, en navegador de verdad con el disco de mentira de
`pruebas/navegador.mjs`, con los nueve escenarios del documento.

### La ficha de un asunto archivado, en su propia carpeta

Fila 64, 19-sep-2026, `docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md`. Antes, `asuntos.json` guardaba
también la ficha de los archivados y se reescribía entero 50-150 veces al día: a los cinco cursos,
más de 17 MB. Se copia el patrón de `js/hitos-archivo.js` con el historial de hitos.

- **`js/ficha-archivo.js`** (`window.FichaArchivo`) envuelve `App.cerrarAsunto`/`App.reabrirAsunto`
  por fuera de todo (después de `js/hitos-archivo.js`): al archivar, baja la ficha a `_ficha.json`
  dentro de la propia carpeta (el guion bajo, para que no cuente como documento) y borra la clave de
  `asuntos.json`; al reabrir, la lee de vuelta, la funde con lo que ponga `App.anotar` y borra el
  fichero. Un archivado de antes de esta fila, sin `_ficha.json`, se reabre con ficha vacía.
  `FichaArchivo.completar(a)` resuelve el manejador y sustituye `a.ficha` por la de verdad: lo usan
  `js/otros-del-tercero.js` y el clic de una tarjeta del ARCHIVO en `js/ficha-asunto.js`.
- El índice (`entradaDe`, arriba) guarda ya los pocos campos de ficha que hacen falta para pintar y
  buscar, sin `asuntos.json`. `js/fichas-huerfanas.js` ya no cuenta un archivado como "sin ficha".
  Renombrar un estado y contar asuntos de un tipo miran los abiertos en memoria más el índice.
- **"Poner en orden las fichas del ARCHIVO"** (Ajustes → Mantenimiento) mueve a su carpeta la ficha
  de cada archivado que siga en `asuntos.json`, de antes de esta fila. No se hace sola al arrancar.

Prueba: `pruebas/ficha-del-archivo.mjs`, sin navegador, con `js/asuntos-archivar.js` y
`js/ficha-archivo.js` de verdad en un `vm`.

### Fichas sin carpeta (huérfanas), y su aviso en la pantalla principal

19-sep-2026, fila 68, `docs/AVISOS-QUE-FALTAN.md`, 1. `window.FichasHuerfanas.calcular()`
ya no fuerza un recorrido entero del ARCHIVO cuando no se ha leído esta sesión
(`App.verArchivo()`, como hacía hasta esta fila): usa el índice guardado
(`IndiceArchivo.leerDisco()`) si existe, o el ARCHIVO si ya se ha leído por otro motivo; sin
ninguna de las dos cosas, un **cerrado** no se comprueba y no se acusa de huérfano por error (un
**abierto** sin carpeta sí, siempre). `js/avisos-que-faltan.js` pinta con este mismo cálculo una
línea junto a `#panel-avisos`/`#panel-frescura` en "Asuntos abiertos" que lleva al bloque de
siempre en Ajustes → Mantenimiento; antes solo se veía entrando a propósito ahí. Se repinta al
envolver `App.verAbiertos`, no en cada tecla del buscador.

---

