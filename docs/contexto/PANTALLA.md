# La cabecera fija, el refresco de pantalla, la barra lateral, el tablón, el panel de lectura, la presencia

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar la cabecera, el refresco de la lista, la barra, el tablón o el panel de lectura. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Repintar solo lo que ha cambiado (fila 101, 23-sep-2026, `docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md`)

Cambiar el estado con la ficha abierta hacía 30-40 lecturas de disco. Ahora solo relee y escribe
`asuntos.json` (lo comprueba `pruebas/repintar-solo-lo-que-cambia.mjs`, contándolas):

- **La lista no se pinta si no se ve**: `App.pintarAbiertos` marca `App.E.listaPendiente` y
  `App.ir('abiertos')` la pinta al volver (`App.pintarAbiertosSiPendiente`). Como los enganches de
  `alRefrescar` los lanza la lista, con la ficha delante no corre ninguno.
- **Los enganches no leen del disco en cada pasada**: los que solo pintan algo de Ajustes (biblioteca,
  hitos) se saltan si Ajustes no se ve (`App.pantallaALaVista`) y se les avisa al entrar en Ajustes;
  el badge rojo de vencidos de Inicio (fila 191; antes, la cuenta de «Qué me toca») solo relee `hitos.json` si este ordenador ha cambiado algún hito
  (`Hitos.ultimoCambioLocal`) o han pasado dos minutos; los envíos, una vez por minuto; medir la
  papelera vieja, cada diez minutos.
- **Tras cambiar estado, plazo, vía o encargo** (y tras marcar un hito que cambia el estado, o tocar
  los relacionados) se repinta solo la barra de acciones y las marcas: `App.repintarAccionesFicha
  ([clave])`, que pone también al día la huella sin leer el disco (si no, el siguiente vistazo a la
  carpeta rehacía la ficha entera de golpe).
- **El último repintado gana**: contador de turno en `repintar()` de `js/hitos-panel.js`,
  `App.verAbiertos` (el viejo espera al nuevo) y `App.pintarSueltos` (monta la lista aparte y la
  cambia de una vez).
- `Plantillas.cargarReciente(gestor, ms)` para el botón «Generar documento» (antes releía
  `plantillas.json` en cada tanda de cambios), con un pequeño retraso en el observador. La fila
  «Formularios» de la ficha solo se calcula cuando la fila es nueva.
- La presencia solo avisa cuando cambia el modo o quién está dentro, y la ficha vacía el aviso
  antes de pintarlo (salía repetido cada 10 s).

**Botón de Salir** (`js/salir.js`). Al pie de la barra de la izquierda. Cierra la sesión: recarga
la página y vuelve a la pantalla de entrada, con las carpetas ya señaladas. Pide confirmación.

**La barra de la izquierda** (`js/barra.js`, `css/barra.css`). Se pliega; un botón de tres rayas la
abre y la cierra; se recuerda en `gestor-barra-2` (fila 175, `docs/PERSONAS-ARCHIVO-Y-MENU.md`,
punto 4; antes `gestor-barra` — la clave cambió para que los dos ordenadores, aunque tuvieran
guardado "plegada", volvieran a empezar). `comoEstaba()` solo lee esa clave; si no hay nada guardado
todavía (primera vez con la clave nueva), decide por el ancho de la ventana: **1100px o más, nace
abierta y no se pliega sola** al elegir una pantalla (sobra sitio de sobra); por debajo, como
siempre, nace plegada y se pliega sola al elegir. En cuanto se pliega o se abre a mano queda
grabado, y eso manda a partir de ahí, ancha o estrecha la ventana. **Queda fija en pantalla**
(`position:fixed`); el contenido se desplaza con `margin-left` (232px, o 52px plegada, **sin tope
de ancho**: quitado en la fila 36, 17-sep-2026, porque dejaba franjas vacías en un monitor ancho).
Ajustes está en la lista de pestañas, separado por una línea (`.separador-lateral`); con la barra
plegada, un icono de rueda dentada (`#btn-barra-ajustes`) lleva directo a Ajustes. El botón grande
"+ Nuevo asunto" va en la cabecera de Inicio (antes «Asuntos abiertos», fila 191), y lo pone el mismo fichero. **Se pliega sola
al abrir el visor o el lector** (un `MutationObserver` sobre las clases `con-visor`/`con-lector` de
`<body>`, sin tocar `gestor-barra-2`) y vuelve a como estaba al cerrarlo.

**El menú, de arriba abajo** (fila 200, 28-sep-2026, `docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md`,
apartado 7): Inicio · Nuevo asunto · Archivo · Personas y empresas · Impresos · Cuentas (estos dos
últimos los inserta `js/barra.js` justo detrás de "Personas y empresas") · **Herramientas** ·
línea · Ajustes. `App.PANTALLAS` (`js/nucleo.js`) lleva `'herramientas'` justo antes de
`'ajustes'`; `App.ir('herramientas')` llama a `App.pintarHerramientas` (`js/herramientas.js`, un
fichero nuevo, sin lógica propia: solo reenvía a los módulos de siempre).

**Herramientas** (`#pantalla-herramientas`) es lo que se usa de vez en cuando, no un ajuste de
verdad: **Papelera** (`#bloque-papelera`, tal cual estaba, `js/papelera-ajustes.js`), **Traer el
alumnado** (un solo bloque con dos botones: el de Séneca de `js/traer-datos.js` dentro de
`#herramientas-traer-seneca`, y el de la BD de alumnado de `js/alumnado-bd.js` dentro de
`#herramientas-traer-alumnado-bd`), **Tablas de datos** (`js/tablas-datos-pantalla.js`, que ahora
cuelga su `<details>` de `#herramientas-tablas-datos-hueco` en vez de `#ajustes-tab-mantenimiento`)
y **Restaurar una copia de seguridad** (`#tabla-copias`, `App.pintarCopias` en
`js/ajustes-mantenimiento.js`, sin cambios por dentro). Los dos avisos de la franja de arriba que
antes llevaban a Ajustes → Mantenimiento («papelera: N cosas...», «fichero de alumnado de hace N
días») llevan ahora aquí: `js/avisos-que-faltan.js` (función nueva `irAHerramientas`, calcada a
`irAMantenimiento` pero sin pasar por Ajustes) y `js/frescura.js` (su `irAMantenimiento` ya lleva a
Herramientas y abre `#bloque-traer-alumnado`, no `#bloque-frescura`, que se queda en Mantenimiento).

**Ajustes → El centro** tiene ahora **"Días de aviso"** (asuntos dormidos + antelación de
vencimiento, mismos campos `#dias-dormido` y `#avisos-dias` de siempre) y **"Copias de
seguridad"** (la caducidad, `#dias-caducidad-copias`, con el texto explicativo de cómo y cuándo se
guardan; la lista para restaurar vive en Herramientas) como una sola sección cada una, en vez de
repartidas entre El centro y Mantenimiento.

**Ajustes → Mantenimiento** se queda con lo que es mantenimiento de verdad: carpetas de este
ordenador, el ayudante de Séneca, borrados que se fusionan, conflictos de Dropbox, fichas sin
carpeta, hitos huérfanos, fichas del archivo, contacto guardado, envolturas esperadas, el
RegAlum.csv viejo (`#bloque-frescura`, las épocas de aviso), conservación, cargar la biblioteca y
las plantillas del centro, y "Pasar a Administraciones".

**Que ninguna fila se aplaste** (`css/filas.css`, fila 36, 17-sep-2026,
`docs/FILAS-QUE-NO-SE-ESTRUJAN.md`). Antes, una fila con texto y varios botones en línea
(`display:flex` sin `flex-wrap`) dejaba que el texto fuera el único que cediera: con el panel de
la derecha abierto, o en una ventana estrecha, el nombre de un documento acababa a un carácter
por renglón. `css/filas.css`, enlazado el último de todos en `index.html` para ganar a las reglas
de módulo, pone la regla general: el texto de una fila tiene un ancho mínimo (nunca cede por
debajo), y los botones bajan a una segunda línea antes que estrujarlo. Aplicado a
`.ficha-documento-fila`, `.relacionado-fila`, `.hito-linea` y `.fila-tipo`; `.rejilla-tipos` y
`#lista-personas` ya envolvían bien y no se han tocado. **`U.menuDeAcciones(botones)`**
(`js/util.js`) es el menú de tres puntos compartido: recibe una lista de `<button>` ya montados y
devuelve un envoltorio con un botón "⋮" que los despliega debajo, anclado a él (se cierra al
elegir uno, al pulsar fuera o con Escape); los botones viven siempre en el DOM, ocultos con la
clase `oculto`, así que `aplicarModoConsulta` (que recorre `#ficha-asunto-cuerpo` entero) los
apaga igual que a los demás sin necesitar ningún caso especial. En `js/ficha-documentos.js`
(`filaDeDocumento`) solo quedan a la vista el nombre y "Registrar" (cuando sale); Copiar (que lo
sigue añadiendo `js/copiar.js`, por envoltura, buscando el `.fila-menu` ya montado), Separar,
Unir, Sacar páginas y Borrar van al menú. En `js/documentos-sueltos.js` (`App.tarjetaSuelto`, las
tarjetas de "Ha llegado" y "Ver todo", antes "Por clasificar"; fila 191) quedan a la vista "Crear
asunto con él" y "Guardar en un asunto"; Abrir, Separar, Unir, Sacar páginas y Borrar (que lo sigue añadiendo `js/papelera.js`, por
envoltura) van al menú — `App.accionesDeSuelto` (fila 25, reutilizado dentro del visor) busca
"Abrir" por su texto en cualquier profundidad, ya no solo entre los hijos directos. Se comprueba
con `pruebas/filas-estrechas.mjs`, en navegador de verdad.

**El panel de lectura de la derecha** (`js/lector.js`). Se cierra con la equis o con Escape. El
borde izquierdo se arrastra; el ancho se recuerda (`gestor-lector-ancho`); doble clic vuelve al
46%. En pantalla estrecha (menos de 1100px) se pone a lo ancho. Servicio genérico:
`Lector.abrir({ titulo, pie, blob, botones })`.

**Comodidades de pantalla** (`js/usabilidad.js`): botón Volver, Cancelar, etiquetas de lo que se
está filtrando y la tecla Escape. No toca datos. (La vista compacta/cómoda se retiró en la fila
191: la tabla de asuntos ya era compacta.)

**Un solo «Volver» en todas las pantallas, salvo Inicio** (fila 194, 27-sep-2026,
`docs/AVISOS-MENU-Y-VOLVER.md`). `js/usabilidad.js` ya no lleva su propio historial: añade el
botón «← Volver» a la cabecera de cada pantalla que no sea Inicio (`prepararCabeceras`, sin botón
en `#pantalla-abiertos`) y lo engancha a `Navegacion.volver('abiertos')` — en Nuevo asunto, a
`cancelarNuevo` en su lugar, para no perder la limpieza del formulario. `App.ir` (`js/nucleo.js`)
llama a `Navegacion.apuntar()` antes de cambiar de pantalla para CUALQUIER destino salvo `'asunto'`
(la ficha sigue apuntando su origen a mano, antes de llamar a `App.ir('asunto')`, ver más abajo),
así que Cuentas, Impresos y Duplicados —y cualquier pantalla nueva que use `App.ir`— vuelven solas
adonde estaban, sin tener que apuntarlo cada una a mano. `Navegacion.volver()` pone una bandera
mientras llama a `App.ir` para que ese propio cambio de pantalla no vuelva a apuntarse encima.

**Que de toda pantalla se pueda salir.** Con el cuadro (`#capa`) abierto, Escape lo cierra
(cancela; si no lleva Cancelar, acepta). Con el visor de un documento abierto (`con-visor`),
Escape lo cierra (el lector de correos vigila el suyo aparte, en `js/lector.js`). Si no hay nada
de eso y el cursor no está en un buscador, Escape hace lo mismo que el botón de salida de la
pantalla que se ve (`.boton-volver`, `#ficha-volver` o `#dup-pantalla-volver`); en Nuevo asunto
equivale a Cancelar, y si hay algo escrito (descripción, tercero elegido o categoría marcada)
pregunta antes de tirarlo. Todo esto vive en el Escape general de `js/usabilidad.js`. **Un cuadro
pequeño que ponga su propio Escape** (el tipo de documento nuevo de `js/documentos.js`, el menú
de tres puntos de `js/ajustes.js`) tiene que cortar la propagación (`ev.stopPropagation()`), o
el Escape general de aquí se dispara también y hace algo de más.

### Adónde lleva la aplicación después de cada acción (fila 119, 24-sep-2026, `docs/TRAS-CADA-ACCION.md`)

- **Crear un asunto abre su ficha** (formulario, «Ver todo» —antes «Por clasificar»— con «Aceptar», «Crear el asunto»
  de la bandeja, que pasan todos por `App.crearAsuntoDelFormulario`, y un recurrente cuando solo
  toca uno). Desde un documento suelto, el cuadro de ponerle nombre se abre encima de la ficha.
  «Crear los que tocan» con varios no abre nada.
- **Reabrir desde la ficha** abre su ficha de asunto abierto; **Editar** (menú de tres puntos) deja
  en la ficha del asunto editado, con su nombre nuevo (`App.editarAsunto` devuelve el nombre con
  que queda; cancelado, se queda en la misma ficha). Archivar y Borrar siguen saliendo a la lista.
- **«Volver» (y Escape) vuelve a la pantalla de la que se vino** (`js/navegacion.js`):
  `App.abrirFicha` llama a `Navegacion.apuntar()` antes de cambiar de pantalla (pantalla visible
  y `scrollY`; de ficha a ficha se conserva el origen de la primera; desde «Nuevo», Inicio)
  y `volverALaLista` a `Navegacion.volver(defecto)`. Un solo nivel, sin pila.
  `Navegacion.abrirAbierto(nombre)` abre por nombre con Inicio de origen.
- **La lista vuelve a la misma altura** (la ventana es la que se desplaza): al volver, y al
  repintar `App.pintarAbiertos`/`App.pintarArchivo`, que guardan y devuelven `scrollY`.
- **Aviso con «Ir al asunto»** cuando lo lógico es quedarse: `U.aviso(texto, clase, { boton,
  alPulsar })` (dura 8 s, el botón lo cierra; clase `.mensaje-boton`), vía
  `Navegacion.avisoConIr(texto, clase, nombre)` (sin botón si el asunto no está en abiertos). En
  meter un documento suelto (sale al cerrar el cuadro de ponerle nombre), guardar un correo de la
  bandeja, unir y devolver un asunto de la papelera.
- «Abrir el que ya existe» de un duplicado archivado abre su ficha de archivado
  (`OtrosDelTercero.montarArchivado`); si no se puede, el ARCHIVO con la búsqueda puesta.
- Prueba: `pruebas/tras-cada-accion.mjs`.

### El tablón, en la cabecera, siempre a la vista

Desde la fila 212 (28-sep-2026, `docs/INICIO-A-TODO-EL-ANCHO.md`) el tablón ya no vive en una
columna del grid de Inicio: cuelga de `#inicio-tablon-hueco`, dentro de `.cabecera`, y por eso no
le afecta que se abra el panel de la derecha (`con-visor`/`con-lector`) ni el ancho de la zona de
trabajo. Sigue sin esconderse nunca (decisión de la fila 191); por debajo de unos 900px de zona de
trabajo baja a su propia línea, debajo de la cabecera (`css/inicio.css`, `@container`). No hay
ningún botón "Tablón" que lo esconda a mano (fila 191, decisión 4; comprobado en
`pruebas/tablon.mjs`).

### No pisarse en un mismo asunto

(17-sep-2026, fila 24). La aplicación la usan dos personas sobre la misma carpeta de Dropbox.
Nunca se deja a nadie fuera de un asunto: lo que cambia es que, si el otro ya está dentro, se
entra en **modo consulta** (se ve todo, no se toca nada), con un aviso arriba y un botón "Tomar
el mando" que siempre está ahí.

- **`js/presencia.js`** (`window.Presencia`) es el modelo y la vigilancia. Desde la fila 176
  (26-sep-2026, `docs/DATOS-ENTRE-ORDENADORES.md`, punto 5) vive en **un fichero por usuario**,
  `_GESTOR/presencia/<hueso del usuario>.json` (`{ usuario, asuntos: { <clave>: { ultima } } }`,
  `U.hueso`: sin tildes, mayúsculas ni espacios), en vez de un único `presencia.json` compartido:
  antes los dos ordenadores escribían el mismo fichero cada 30 segundos, y Dropbox dejaba
  constantemente copias en conflicto que nadie limpiaba. Ahora cada ordenador solo escribe el
  suyo (`escribirPropio`); leer "quién está dentro de cada asunto" junta los ficheros de todos
  (`leerTodos`). Se escribe y relee **directo con `Carpetas`, nunca con `Copias.guardar`**: es una
  carpeta fuera de los dieciocho ficheros protegidos, a propósito (ver "Lo que la aplicación
  guarda en `_GESTOR`"), porque se escribe muy a menudo y es un dato que caduca solo (3 minutos
  sin renovarse). El `presencia.json` viejo (y sus copias en conflicto) se borra solo, sin
  preguntar, la primera vez que se entra después de esta fila (`Presencia.borrarFicheroViejo`,
  desde el mismo envoltorio de `App.vigilarLaCarpeta` de abajo).
  - `vigilar(clave, onCambio)`: comprueba si `clave` está libre; si lo está, anuncia la propia
    señal y la renueva cada 30 segundos; si no, se queda en modo consulta y relee cada 10
    segundos, por si el otro sale. Un único `setInterval` hace las dos cosas (relee siempre;
    renueva solo si ya han pasado los 30 segundos, o si acaba de dejar de estar libre): así se
    cumplen los dos plazos del encargo sin dos temporizadores por ficha.
  - `dejarDeVigilar()` quita la propia señal **solo si se tenía el mando** (nunca la de otro).
  - `tomarElMando(clave)` pisa la señal del que estuviera antes.
  - `ocupantePor(clave)` es una lectura sin await, contra una copia en memoria
    (`refrescarCache()`) que se refresca sola cada 10 segundos, enganchada a
    `App.vigilarLaCarpeta` (así no ha hecho falta tocar `js/nucleo.js` para arrancarla): la usa la
    marca de la tarjeta de la lista.
  - **No repinta la lista mientras se escribe** (fila 33, 17-sep-2026,
    `docs/TABLON-NO-SE-BORRA.md`): esa misma envoltura de `App.vigilarLaCarpeta` llamaba a
    `App.pintarAbiertos()` cada 10 segundos pasara lo que pasara, y eso se llevaba por delante el
    tablón de notas a medio escribir (vive dentro de `#pantalla-abiertos`). Ahora
    `Presencia.huella()` da una foto de texto de quién está dentro de qué (claves y usuarios,
    ordenados); el intervalo solo llama a `App.pintarAbiertos()` si esa huella ha cambiado de
    verdad desde la última vez, y nunca si `document.activeElement` es un `input`, `textarea`,
    `select` o algo `contenteditable` (esa vuelta se salta sin actualizar la huella guardada, para
    que la siguiente vuelta sin escribir sí repinte).
- **`js/ficha-asunto.js`** pinta el aviso (`#ficha-presencia`, reutilizando `.aviso.aviso-ambar`
  de siempre) y apaga los controles. **Apagar no es "un botón más que tocar"**: se recorre
  `#ficha-asunto-cuerpo` entero (`button, select, input, textarea`) y se apaga todo menos una
  lista blanca de solo lectura (volver, abrir un documento, copiar un nombre, desplegar un hito,
  el propio "Tomar el mando"). Así ni `js/hitos-panel-lista.js`, ni `js/correo.js`, ni
  `js/plantillas-documento.js`, ni `js/relacionados.js` han tenido que tocarse para esto.
  - **La mitad de la ficha se pinta sola, después de `pintar()`** (la guía, los documentos, los
    hitos por su cuenta con su propio observador, "Generar documento" y "Correo" con un pequeño
    retraso): aplicar el modo consulta una sola vez al final de `pintar()` se comería todo lo que
    sale después. Por eso hay un `MutationObserver` propio sobre `#ficha-asunto-cuerpo` (mismo
    patrón y mismo aviso de la sección de abajo), creado una sola vez (el contenedor no se
    destruye entre una ficha y otra) y con el mismo retraso de 30&nbsp;ms que usa
    `js/hitos-panel.js`.
  - Solo se vigila la presencia en un asunto **abierto**: en el ARCHIVO no hay nada que tramitar.
- **`js/asuntos-lista.js`** no se toca por dentro: `js/presencia.js` envuelve `App.tarjetaAsunto`
  (mismo patrón que `js/puente.js`, `js/copiar.js` y el propio `js/ficha-asunto.js`) y le cuelga
  `.marca-presencia` (una letra, con el nombre completo en el `title`) delante del nombre.
- **`js/copias.js` y `js/papelera.js` no se han tocado**: los dos trabajan solo con los ficheros
  que tienen apuntados en su propia lista, y la carpeta `presencia/` nunca entra en ninguna. Cada
  ordenador escribe solo su propio fichero, así que ya no debería dejar copias en conflicto; si
  alguna queda (o del `presencia.json` viejo, ya migrado), `js/conflictos.js` la borra sin
  preguntar en su misma revisión de cada cinco minutos (fila 176, `revisarPresencia`): es un dato
  que caduca solo, sin copia de seguridad.
- Descartado, por ahora: una base de datos pequeña en internet para que el aviso fuera
  instantáneo (ver `docs/COLA.md`, "Lo que vendrá después").

Se comprueba con `pruebas/presencia.mjs`.

### La pantalla se mide a sí misma

`css/vista.css` pone `container-type: inline-size` en `.contenido`: las reglas miran el ancho
real del contenido, no el de la ventana. Bajo unos 900px de zona de trabajo, el tablón (en la
cabecera de Inicio desde la fila 212) baja a su propia línea, debajo del resto de la cabecera
(nunca se quita: `css/inicio.css`). El tope de 1180px de `css/estilos.css` se anula en
`css/vista.css`; conservan tope propio Nuevo asunto (940px) y Ajustes (1600px). Los filtros
(responsable, estado, plazo, órgano, tipo de asunto; los cinco valen en las cuatro pestañas desde
la fila 216, docs/FILTROS-EN-TODAS-LAS-PESTANAS.md) van plegados en un panel que abre el botón "Filtros"
(«Filtros (N)» con alguno puesto); desde la fila 212 empieza siempre cerrado al entrar en Inicio,
sin memoria en `localStorage` (antes, `gestor-filtros`).

### La cabecera se queda arriba, y se encoge (fila 46, 17/18-sep-2026; sin temblor, fila 50,
### 18-sep-2026, docs/CABECERA-NO-TIEMBLA.md)

`js/cabecera-fija.js` (`window.CabeceraFija`) es un único mecanismo para las seis pantallas
(ficha del asunto, Inicio —incluido "Ver todo", misma pantalla; ya no hay «qué me toca» aparte
desde la fila 191—, archivo, personas y empresas, ajustes, duplicados; papelera vive dentro de
ajustes y usa su cabecera). No sabe nada de ninguna pantalla en concreto:

- Busca, dentro de `section.pantalla` sin la clase `oculto`, su `header.cabecera` o
  `header.ficha-cabecera`, y le pone o quita la clase `encogida` según `window.scrollY`, con
  histéresis (encoge a 120px, se despliega a 24px, antes 80/40 — fila 50) para que no parpadee en
  el límite. Un `requestAnimationFrame` agrupa los eventos de `scroll`/`resize`.
- **El temblor de la fila 50**: en una pantalla cuyo contenido apenas pasa del alto de la ventana,
  encogerse le quita alto de golpe al documento entero; el navegador recorta `window.scrollY` al
  nuevo máximo, ese valor cae por debajo del umbral de despliegue, la cabecera se despliega, la
  página vuelve a crecer, el gesto empuja otra vez por encima del umbral de encoger: bucle. Tres
  arreglos, el primero de fondo:
  1. **Compensar el alto perdido**: por pantalla (`section.pantalla`, `WeakMap`), se guarda el
     alto del documento (`document.documentElement.scrollHeight`) con la cabecera desplegada —
     forzándola desplegada un instante si hace falta, sin que se note: leer `scrollHeight` fuerza
     el cálculo, no el pintado—. Al encogerse, si esa pantalla es corta (ese alto guardado es
     menor que `window.innerHeight + 400`), se calcula cuánto alto se ha perdido de verdad y se le
     devuelve a `main.contenido` con la variable `--cabecera-compensa` (`margin-bottom`,
     `css/cabecera-fija.css`); en una pantalla larga, o con la cabecera desplegada, vale `0px`. Se
     vuelve a medir al cambiar de pantalla y al cambiar el tamaño de la ventana (`alturaPorPantalla`
     se tira entera y se remide sola, pantalla a pantalla).
  2. Los dos umbrales se separan más (120/24): el salto de alto ya no puede ser mayor que la
     distancia entre los dos.
  3. **Un candado de 400 ms**: después de cada cambio de verdad (desplegada↔encogida) no se admite
     el cambio contrario hasta que pasen 400 ms; un cambio en el mismo sentido no cuenta y no se
     bloquea. **El candado no se arma en dos casos**, para no bloquear el primer scroll de verdad
     que venga después: al cambiar de pantalla (`pantallaNueva`, siempre empieza desplegada,
     alineada con el scroll que ya hubiera) y al cambiar el tamaño de la ventana (`aplicar(true)`,
     porque un redimensionado puede mover `window.scrollY` por su cuenta —el "scroll anchoring" de
     Chrome, para que la vista no salte cuando la rejilla de Ajustes cambia de alto al reflotar con
     menos columnas—: ese movimiento no lo ha pedido nadie).
- Un único `MutationObserver` sobre `<main class="contenido">` (`childList`+`subtree`+`class`)
  cubre, sin engancharse a `App.ir` ni tocar `js/ficha-asunto.js`, dos cosas a la vez: que cambie
  qué pantalla está visible (la clase `oculto`), y que una pantalla se repinte por dentro. La
  ficha rehace su `.ficha-cabecera` entera con `innerHTML` en cada `pintar()` (por encima sigue
  `U.conservandoLoEscrito`, sin tocar): el observador nota el `childList` nuevo y vuelve a poner
  el estado encogido sin esperar al siguiente scroll, así que cambiar el estado del asunto (o
  cualquier otro repintado) no lo pierde.
- El ancho lo da la ventana normal: `.lateral` está fija y `.contenido` va en el flujo normal, así
  que basta con `position: sticky; top: 0;` (sin ningún contenedor con `overflow`) para que la
  cabecera pegada mida siempre como su padre de verdad — con `con-visor` o con `con-lector`
  (`css/visor.css`, `css/lector.css`, que cambian el padding/margin de `#aplicacion`), sin nada
  especial que escribir para eso.
- `css/cabecera-fija.css`: `margin-left/right: -32px` y `padding-left/right: 32px` (a mano, no el
  shorthand `margin`, para no pisar el `margin-bottom` que ya ponía cada pantalla) para llegar de
  borde a borde; en pantalla estrecha (900px) pasan a -16px/16px, como `.contenido` en
  `css/estilos.css`. `z-index: 20`, por debajo de `.capa` (50) y `.mensajes` (60). Encogida: el
  título baja de 21px a 17px, se esconde el `.explica` que venga justo después de la cabecera
  (la regla `header.cabecera.encogida .filtros` sigue en `css/cabecera-fija.css`, pero desde la
  fila 191 `.filtros` ya no vive dentro de la cabecera de Inicio: primero en `#inicio-legado`,
  y desde la fila 192 en `#inicio-todos-asuntos`; sigue sin tener efecto ahí, queda pendiente de
  revisar si hace falta quitarla o repensarla), y el margen de abajo baja a 6px (reducir
  el alto de la cabecera sola no basta si el hueco de debajo no se achica también: quien mueve el
  contenido es ese margen, no un padding nuevo, que solo la agrandaría). `.tarjeta` lleva
  `scroll-margin-top: 90px` para que la cabecera pegada no tape lo que se salta con
  `scrollIntoView`.
- `css/ficha-asunto.css`: `.ficha-cabecera.encogida` pasa a una sola fila (`display: flex`, con
  `order` para no tocar el HTML que escribe `js/ficha-asunto.js`): volver, nombre (con
  `text-overflow: ellipsis`, 16px), tipo/estado/plazo al final.
- `css/ajustes.css`: `#pestanas-ajustes` (Tipos de asunto · El centro · Mantenimiento) es sticky
  también, con `top: var(--cabecera-fija-alto, 0px)` — esa variable la mide y la pone
  `js/cabecera-fija.js` en cada repintado (el alto real de la cabecera, encogida o no) sobre
  `document.documentElement`, así las pestañas se quedan pegadas justo debajo sin hueco ni solape,
  sea cual sea el estado de la cabecera.
- Caso especial, "Ver todo" (antes "Por clasificar"): con un documento abierto en el panel de la derecha
  (`.tarjeta-abierta`, la pone `js/documentos-sueltos.js`, sin tocar ese fichero ni
  `js/visor.js`), la cabecera encogida de `#pantalla-abiertos` añade un bloque `.cabecera-viendo`
  ("Viendo: `<nombre>`" + botón "Ir a su fila", `scrollIntoView`) que crea `js/cabecera-fija.js`;
  el CSS decide que solo se vea con `.encogida` (con la cabecera desplegada ya está la tarjeta
  marcada en la lista).
- **"clasificar" sustituye del todo a Inicio** (fila 214, `docs/HA-LLEGADO-SUSTITUYE-LA-VISTA.md`):
  `App.irVista` (`js/asuntos-lista-montones.js`) pone la clase `viendo-clasificar` en
  `#pantalla-abiertos` al entrar en "clasificar" (css/inicio.css esconde con ella
  `#inicio-cuerpo` e `#inicio-fila-superior`), en vez de dejar `#zona-clasificar` a la vista
  a la vez que la tabla, debajo del todo. El desplazamiento de antes de entrar se guarda en
  `App.E.scrollAlEntrarClasificar` **antes** de esconder la tabla (si se lee después, el
  navegador ya ha recortado `scrollY` solo, al quedarse la página sin alto: mismo fenómeno que
  el "temblor" de la cabecera fija, más arriba); al salir se devuelve, en un `requestAnimationFrame`
  (la tabla tarda un pintado en volver a tener su alto). `App.ir` (`js/nucleo.js`) deja Inicio
  normal, sin "clasificar" a la vista, si se vuelve desde otra pantalla del **menú** (no cuenta
  "asunto", la ficha, que también vive en `App.PANTALLAS`).
- **Comprobado que sigue funcionando**: `js/barra.js` (línea ~139) sigue encontrando
  `#pantalla-abiertos .cabecera` para colgar el botón grande de "Nuevo asunto".
- `css/cabecera-fija.css`: la transición de `header.cabecera`/`header.ficha-cabecera` gana
  `margin-bottom .15s ease` (junto a la de `box-shadow` y `padding` de siempre), para que el
  encogido no se note como un salto seco (fila 50).
- Prueba `pruebas/cabecera-fija.mjs`, navegador de verdad: se ve entera al entrar, se encoge a los
  120px, la histéresis no la despliega hasta 24px, el contenido de debajo se mueve justo lo que se
  ha pedido bajar (con **scroll anchoring** de Chrome de por medio: si el navegador ajusta
  `window.scrollY` por su cuenta para que no se note el salto cuando la cabecera cambia de alto a
  mitad del scroll, eso es la prueba de que no hay brinco, no un fallo — la prueba mide el
  contenido movido, no el valor final de `scrollY`), cambiar de pantalla deja la anterior limpia y
  la nueva funciona igual (incluidas las pestañas pegadas de Ajustes), el ancho sigue al de
  `.contenido` con `con-lector`, el repintado de la ficha no pierde el estado encogido, el caso de
  "Ver todo", y que `js/barra.js` sigue encontrando su selector. Fila 50, dos casos más: en
  una pantalla corta (se calcula el alto de sobra que hace falta y se recorta la ventana a esa
  medida, en vez de fiarlo a un tamaño de pantalla concreto) cruzar el umbral no deja el estado
  temblando; y el candado de 400 ms, manejado a mano con `window.CabeceraFija.evaluar()` para
  controlar el tiempo exacto entre los dos cambios, bloquea el cambio contrario justo después de
  otro y lo deja pasar una vez cumplido el plazo.

### El tablón de notas rápidas

Ya NO es una columna (fila 212, 28-sep-2026, `docs/INICIO-A-TODO-EL-ANCHO.md`): `#tablon` cuelga
de `#inicio-tablon-hueco`, dentro de la propia cabecera de Inicio, entre "+ Nuevo asunto" y el
buscador. Sigue sin esconderse nunca. Para lo que aún no es un asunto: color, autor, fecha y
opcionalmente "para el día X". Se guarda en `_GESTOR/tablon.json`. Las notas "Solo para mí" salen
únicamente en el tablón de quien las escribió (no es un secreto: el fichero sigue en la carpeta
compartida). Desde la fila 130, cada cambio (y la fusión de una copia en conflicto, y devolver una
nota de la papelera) va por `ColaGuardado.poner('tablon.json', …)`: dos cambios seguidos ya no se
pisan.

**Partido en dos ficheros** (fila 212, para no pasar de 600 líneas): `js/tablon.js` es solo datos
(leer, `cambiar()`, quién soy, qué notas veo) y expone `window.Tablon`; `js/tablon-compacto.js`
(cargado justo detrás) es toda la pantalla y expone `window.TablonVista` (`pintar()`, `ocupado()`,
esta última la consulta `js/tablon.js` antes de releer en cada vuelta de
`window.Gestor.alRefrescar`, para no repintar mientras se escribe o se edita).

**Compacto**: el campo de la nota nueva nace de una línea ("Escribir una nota…", mismo
`<textarea id="tablon-texto">` de siempre); al pulsarlo (o si ya hay algo escrito o una fecha
puesta) se abre con el resto de opciones (colores, fecha, "Solo para mí", "Pegar la nota").
Las notas pendientes se ven en fila, cortadas con «…», como mucho tres (`TOPE_COMPACTO`); sus
botones (Hecha, Cambiar, A asunto, Borrar) viven detrás del menú de siempre (`U.menuDeAcciones`),
no a la vista. Con más de tres, o con alguna hecha, "y N más"/"Ver las hechas" abren
`.tablon-overlay`: la lista entera (con el "papel" de siempre, editable), por encima de la
página (`position: absolute`, sin empujar nada), que se cierra con su ✕, con Escape o pulsando
fuera.

**No se borra mientras se escribe** (fila 33, 17-sep-2026, `docs/TABLON-NO-SE-BORRA.md`): lo que
se lleva escrito en la nota nueva vive también en variables del módulo (`borrador`,
`borradorFecha`), no solo en el `<textarea id="tablon-texto">`: se actualizan con el evento
`input` (y el `change` de la fecha), así que sobreviven aunque algo de fuera destruya la columna
`#tablon` entera antes de que se pegue la nota. `pintar()` guarda, antes de reconstruir, si el
foco estaba en ese campo o en el de una nota que se está cambiando (`editando`), junto con
`selectionStart`/`selectionEnd`, y al terminar le devuelve el foco y el cursor al campo nuevo. Se
comprueba con `pruebas/tablon-no-se-borra.mjs`.

