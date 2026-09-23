# Crear, editar, la ficha, "Lo pide" y duplicados de un asunto

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026).
Actualízalo al tocar la creación o edición de un asunto, su ficha (abierto), "Lo pide" o los
duplicados. **La papelera, archivar/reabrir, el índice del ARCHIVO y las fichas huérfanas se
partieron a `docs/contexto/ASUNTOS-ARCHIVO.md` en la fila 78** (este documento pasaba de los
40 KB): actualiza ese hijo al tocar cualquiera de esos temas. El índice general, las reglas de
código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

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
