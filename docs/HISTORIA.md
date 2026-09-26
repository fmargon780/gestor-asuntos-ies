# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 26-sep-2026 — Fila 176: los datos no se pisan entre ordenadores

`docs/DATOS-ENTRE-ORDENADORES.md`, primera parte de la «tanda de estabilidad» (análisis de Claude
del 26-sep-2026). Cinco huecos por los que un dato se perdía cuando los dos ordenadores tocaban
casi lo mismo casi a la vez, y uno por el que un asunto archivado podía resucitar. Nada cambia en
pantalla.

1. **Las listas de la ficha se funden por elemento**: `App.anotarLista(clave, campo, {anadir,
   quitar, identidad})` (`js/nucleo.js`) relee `asuntos.json` dentro de la propia cola y funde,
   en vez de sustituir la lista entera calculada en memoria de antes (el bug de siempre:
   `correo-cuadro.js`, `bandeja-huella.js`, `relacionados.js`, `registro.js`,
   `documentos-guardar.js` y `notas.js` mandaban `{hilos: listaEntera}` sobre una lectura ya
   vieja). `App.unirPorIdentidad` es la unión pura que también usa `js/conflictos.js`
   (`fusionarFicha`, ampliada para `hilos`/`relacionados`/`pendientesRegistro`, antes solo
   `notas`/`pasosHechos`/`pasosElegidos`).
2. **Lápidas**: archivar, mandar a la papelera, unir o renombrar un asunto borran su clave de
   `asuntos.json` y, en la misma operación de la cola, marcan una lápida en
   `_GESTOR/borrados-listas.json` (lista `asuntos`, `js/borrados-fusion.js`, motivo
   `archivado`/`papelera`/`unido`/`renombrado`). Con lápida puesta, `App.anotar`/`App.anotarLista`
   lanzan `AsuntoCerrado` en vez de crear la clave vacía; reabrir/devolver de la papelera/enlazar
   una huérfana la revive ANTES de volver a escribir. La fusión de una copia en conflicto de
   `asuntos.json`/`hitos.json` (`js/conflictos.js`) también la respeta.
3. **El vistazo de 20 s también relee `asuntos.json`/`hitos.json`** si su fecha de modificación
   ha cambiado y no hay guardado en marcha (`js/vistazo-registro.js`, nuevo, envolviendo
   `App.mirarLaCarpeta`; `Carpetas.fechaFichero`, nueva). Antes solo se releían al entrar y en
   cada guardado propio.
4. **La guía relee antes de escribir**: `js/guias-enganche.js` guardaba el objeto `guias` entero
   tal y como se había cargado al ABRIR el editor de un tipo; si el otro ordenador guardaba la
   guía de OTRO tipo mientras tanto, el segundo en guardar lo borraba. Ahora cada guardado
   (`guardarTipo`/`conFichero`) relee `guias.json`, toca solo su tipo y escribe, en la cola.
5. **Presencia por usuario**: `_GESTOR/presencia.json` (uno solo, escrito por los dos ordenadores
   cada 30 s) dejaba constantemente copias en conflicto que nadie limpiaba. Pasa a un fichero por
   usuario, `_GESTOR/presencia/<hueso>.json` (`U.hueso`, nuevo en `js/util-parecidos.js`): cada
   ordenador solo escribe el suyo. El viejo (y sus copias en conflicto) se borra solo al entrar;
   `js/conflictos.js` borra sin preguntar cualquier copia en conflicto que quede dentro de
   `presencia/`. `js/conflictos.js` de paso amplía su revisión a ficheros que antes ignoraba del
   todo (`plantillas.json`, `envios.json`, `rutas.json`, `margenes-pdf.json`...): entran en el
   mismo cajón de "no se fusionan solos" que ya tenían tipos y estados.

`js/conflictos.js` pasaba de 600 líneas con estos cambios: se partió (`docs/PARTIR-FICHEROS-
GRANDES.md`) en el mismo fichero (asuntos/hitos/tablón, lápidas, el cajón de Ajustes) y
`js/conflictos-datos.js`, nuevo (los CSV de terceros, `administraciones.json`, "los terceros se
releen solos"), compartiendo `Conflictos._interno`.

`pruebas/datos-entre-ordenadores.mjs`, nueva, sin navegador (los cinco puntos del encargo).
`pruebas/presencia.mjs` reescrita para el fichero por usuario. `npm test` completo en verde.

## 26-sep-2026 — Fila 175: Personas, Archivo y el menú llevan a algún sitio

`docs/PERSONAS-ARCHIVO-Y-MENU.md`, tercera y última parte de la «tanda 1» del análisis de
usabilidad. Va después de la 173: usa `App.nuevoAsuntoCon`. Idea de fondo: la ficha de una persona
era un callejón sin salida, el Archivo no enseñaba nada hasta pulsar «Actualizar», el menú de la
izquierda obligaba a dos clics para todo, y el buscador de Asuntos abiertos no encontraba lo que
estaba en otro montón. Más unos cuantos textos que despistaban.

**La ficha de una persona enseña sus asuntos, pulsables.** Se quita el botón «Ver sus asuntos»:
`App.verFicha` (`js/archivo-personas.js`) llama a `App.verAsuntosDeTercero(p)` al pintar, y el
bloque «Sus asuntos (N)» sale solo. Cada fila se puede pulsar: los abiertos, con
`App.abrirFicha(abierto, 'abierto')` directamente (no `Navegacion.abrirAbierto`, que fuerza el
origen a Asuntos abiertos — aquí tiene que quedar en Personas); los archivados, con
`OtrosDelTercero.montarArchivado` + `App.abrirFicha(objeto, 'archivado')`, igual que «Abrir el que
ya existe» de un duplicado archivado. Junto a «Cambiar los datos» (si sale), «+ Nuevo asunto para
esta persona» llama a `App.nuevoAsuntoCon({ tercero: p })`. Quitar `#ver-sus-asuntos` dejó dos
enganches colgando de un id que ya no existía: el «Borrar» de un tercero dado de alta a mano
(`js/papelera-ajustes.js`) y «Asuntos de sus tutores» (`js/tutores-legales.js`), los dos
retargeted al nuevo `#ficha-persona-acciones`.

**El Archivo carga solo, la primera vez.** `App.ir` (`js/nucleo.js`) llama a `App.verArchivo()` al
entrar en 'archivo' si `App.E.archivoVisitado` no está puesto (una bandera aparte:
`App.E.listaArchivo` nace `[]`, así que no sirve para saber si ya se ha visitado). Los botones
«Actualizar» y «Reconstruir el índice» pasan al menú de tres puntos (`U.menuDeAcciones`), y el
aviso de índice sin hacer o desfasado lleva ahora un botón de verdad en vez de solo texto con pinta
de botón.

**El menú de la izquierda nace abierto en pantalla ancha.** `js/barra.js`: con la ventana de
1100px o más, si no hay nada guardado todavía nace abierta y no se pliega sola al elegir una
pantalla; por debajo, como siempre. Clave nueva, `gestor-barra-2` (antes `gestor-barra`), para que
los dos ordenadores de Francisco, aunque tuvieran guardado «plegada», volvieran a empezar.

**El buscador de Asuntos abiertos busca en todos los montones.** `js/asuntos-lista-pintar.js`
(`App.pintarAbiertos`): con texto en el buscador, se salta el filtro de `App.deLaVista` (el montón
elegido) — los demás filtros (plazo, «Lo encarga», el desplegable de montón) se siguen aplicando.
Con el buscador vacío, todo como antes. Una línea «Buscando en todos los asuntos abiertos»
(`#buscando-en-todos`, en `index.html`) avisa cuando está buscando así.

**El plazo de un paso no se pierde sin avisar.** `js/guias-editor.js`: `recoger()` solo guardaba el
plazo de un paso si tenía días Y «desde»; sin «desde», los días desaparecían en silencio. Ahora,
antes de cerrar («Guardar», que aquí es el botón de aceptar de `U.preguntar`, envuelto con el mismo
patrón que ya usa `js/registro.js`), `pasoConDiasSinDesde()` mira el nivel visible: si algún paso
tiene días escritos y «desde» vacío, no cierra, avisa en rojo nombrando el paso, lo abre en el
acordeón (`GuiasPlegado.abrir`+`aplicar`), abre su `<details>` de plazo y pone el foco en el
desplegable.

**Cinco textos que despistaban**, corregidos sin tocar el comportamiento: la etiqueta del filtro
de montón decía el valor interno («Estado: administracion») en vez del texto elegido
(`js/usabilidad.js`); el «· N puntos» del pie de un asunto sugerido en `js/elegir-asunto.js`, que
solo confundía (la puntuación sigue ordenando, ya no se ve); `js/correo-rastro.js` seguía citando
el botón «Gestionar documentos», que ya no existe; los buscadores de tercero decían «tres letras»
pero buscan desde dos (`index.html`, `js/asuntos-nuevo-alta.js`); y el editor de guías
(`js/guias-editor.js`) seguía hablando de pasos «con una casilla para ir marcando», de antes de que
fueran hitos.

**Lo que costó de verdad**: los ~40 ficheros de prueba que pulsaban «#btn-barra» para ver las
pestañas, porque su viewport (casi todos ≥1280px) ahora nace ya abierto — el clic sobraba, y encima
plegaba la barra que ya estaba abierta, escondiendo justo lo que la prueba iba a pulsar después.
Se ha quitado ese clic (y el comentario que lo explicaba) en cada uno; solo dos quedaron aparte:
`ajustes-agil.mjs` (pliega a propósito, más abajo, para probar el icono de Ajustes con la barra
plegada) y `filas-estrechas.mjs` (viewport de 480px, sin cambios).

Se comprueba con `pruebas/personas-archivo-y-menu.mjs` (los cinco puntos, en navegador de verdad,
más los ya verdes `pruebas/navegador.mjs`, `pruebas/tutores-legales.mjs`,
`pruebas/papelera.mjs`/`pruebas/papelera-buscador.mjs`, `pruebas/duplicados.mjs`,
`pruebas/archivo-indice.mjs` y `pruebas/relacionados.mjs`) y el resto de `npm test`, en verde.

---

## 26-sep-2026 — Fila 174: Por clasificar usa lo que ya se ha leído

`docs/POR-CLASIFICAR-USA-LO-LEIDO.md`, segunda parte de la «tanda 1» del análisis de usabilidad.
Va después de la 173: usa `App.nuevoAsuntoCon`. Idea de fondo: el lector de documentos ya lee el
sello de registro, la fecha y el tercero de cada PDF, y lo enseña en la tarjeta de «Por
clasificar»; pero dos clics después la aplicación lo volvía a preguntar en blanco.

**El cuadro de «Poner nombre» nace relleno** (`js/documentos-formulario.js`,
`pintarFormulario(opciones.propuesta)`, con la misma forma que `LectorDocumentos.analizar`). Lo
que ya trae el nombre del fichero manda; la propuesta solo rellena lo que falte: la fecha
(convertida de `dd/mm/aaaa` a ISO con una función mínima propia del fichero, no una sola en
`js/util.js`), y el registro, marcando «Está registrado en Séneca» con sus cuatro campos y la
línea verde «Leído del sello de Séneca.» (mismo texto que `js/registro.js`). El tipo de documento
—que el lector no lee nunca— arranca, si el nombre tampoco lo trae, en el último que se guardó en
un asunto de ese mismo tipo de asunto, en este ordenador (`localStorage`,
`gestor-ultimo-tipo-doc`).

**Un solo botón para crear desde un suelto.** `App.empezarAsuntoCon` (`js/documentos-sueltos.js`)
mira `LectorDeSueltos.resultadoDe(s.nombre)` al pulsar «Crear asunto con él»: con tipo y tercero,
crea de un tirón (`App.crearAsuntoConPropuesta`); con tercero y sin tipo,
`App.nuevoAsuntoCon({ tercero, fecha })` deja el tercero esperando; sin nada, como siempre, y en
los tres casos la fecha leída va a «Fecha de inicio». Se ha quitado el botón «Aceptar»/«Crear
asunto nuevo» que vivía aparte en `js/documentos-sueltos-lector.js`: ahora ese fichero solo ajusta
el título y la clase (discreto con sugerencias a la vista) del mismo botón de siempre
(`[data-accion-suelto="crear"]`).

**Tras meter o crear, directo al nombre, no a la lista**, con lo leído: `App.llevarSueltoA` y
`App.crearAsuntoDelFormulario` pasan siempre `{ ponerNombre, propuesta }` a `App.verDocumentos`
(antes solo con un hito de por medio). «Guardar» (`js/documentos-guardar.js`) cierra el cuadro
entero cuando se abrió así, en vez de volver a la lista — con un punto previsto,
`N.alTerminarPonerNombre`, para que otro módulo tome el relevo en vez de cerrar — y sigue
volviendo a la lista si se abrió desde ella (el «Poner nombre» de una fila).

**Los adjuntos de un correo pasan por el cuadro, uno detrás de otro**: `js/bandeja-guardar.js`
abre el cuadro para el primer adjunto de verdad (nunca el PDF del correo ni el del hilo) al
terminar de guardarlo, con lo leído de **ese** fichero (`js/bandeja-adjuntos-lector.js` guarda
ahora también el análisis por nombre, no solo el mezclado de todos); al guardar ese nombre, si
queda otro sin nombrar, se abre para él, colgando la cola de `opciones.serieAdjuntos` y usando el
punto previsto de arriba; al cerrar sin guardar, la serie se acaba sola. Su guardia de «el correo
ya dejó algo puesto» tuvo que aprender a mirar también `App.E.nuevo.terceroPropuesto` (fila 173):
sin eso, un adjunto podía pisar con otra persona un tercero que el correo ya había dejado
esperando al tipo.

**«Registrar» iguala su camino al del sello detectado solo**: si el PDF que se elige a mano es
distinto del original, `js/registro.js` renombra el original con «SIN SELLAR» y lo manda a
«Versiones previas» (reutilizando `RegistroSellado.nombreSinSellar`/`nombreLibreEntre`, ya
expuestas, y `VersionesPrevias.mover`), exactamente igual que ya hacía el camino automático de
`js/registro-sellado.js`. Si se elige el mismo fichero que ya estaba en la carpeta, no se toca
nada más; el movimiento es accesorio.

**Lo que costó de verdad**: dos sesiones distintas hicieron la fila 172 en paralelo (ver su propia
entrada), y aquí el propio arreglo de esta fila rompió, de rebote, ocho pruebas ya existentes que
daban por hecho el comportamiento viejo (relanzar la búsqueda tras un alta, la lista antes que el
formulario, un botón «Aceptar» aparte, el original quedándose junto al sellado…): `aspirantes-
numero.mjs`, `bandeja-adjuntos.mjs`, `duplicados.mjs`, `envolturas.mjs` (por quitar una envoltura
que ya sobraba en `js/via-contacto.js`), `navegador.mjs`, `sugerir-asunto-existente.mjs`,
`tras-cada-accion.mjs`, `word-dentro-de-la-app.mjs`, `documentos-sueltos.mjs`,
`hito-desde-por-clasificar.mjs` y `registro.mjs` se han puesto al día con el comportamiento nuevo,
no relajado ninguna comprobación.

Prueba nueva `pruebas/por-clasificar-usa-lo-leido.mjs`: un PDF suelto con sello `26EM0368` y fecha
10-09-2026 de un alumno conocido, con tipo reconocido por palabras clave — «Crear asunto con él»
crea de un tirón y el cuadro de nombre sale directo, con la fecha, el registro marcado y relleno,
y la línea verde; «Guardar» cierra el cuadro. Batería completa en verde.

## 26-sep-2026 — Fila 173: Nuevo asunto, sin repetir nada

`docs/NUEVO-ASUNTO-SIN-REPETIR.md`, primera parte de la «tanda 1» del análisis de usabilidad.
Idea de fondo: la aplicación no vuelve a pedir lo que ya sabe, y después de cada acción deja al
usuario donde lo lógico es seguir.

**`App.nuevoAsuntoCon({ tercero, tipo, fecha, descripcion, viaInicial })`** (`js/asuntos-nuevo.js`),
todo opcional: lleva a Nuevo asunto con lo ya sabido. Con tipo, lo elige y fija el tercero, sin
pulsar Crear (igual que hacía `App.crearAsuntoConPropuesta`, que ahora usa esta función por
dentro). Sin tipo, el tercero espera en `App.E.nuevo.terceroPropuesto` y una línea «Para: Nombre ·
Elige el tipo de asunto» sale encima de la parrilla, con «Otra persona» para olvidarlo; al elegir
tipo, si la categoría coincide, se fija solo.

**Cambiar de tipo ya no borra el tercero** (`App.elegirTipo`): si el tipo nuevo es de la misma
categoría, se conserva y se vuelve a fijar, para que los campos del tipo nuevo se rellenen con sus
datos. **Dar de alta un tercero lo deja elegido** (`App.altaTercero`), en vez de relanzar la
búsqueda y esperar el clic: se usa el objeto recién creado (el que ya devuelve `Datos.anadirALista`
o el alta propia de una categoría como Administraciones) directamente con `App.fijarTercero`.

**Una sola pregunta de vía.** Nuevo asunto preguntaba la vía dos veces: el viejo `#campo-via` +
`#campo-via-dato`, y «Por qué vía» dentro de «Lo pide». Se han quitado los dos campos sueltos (y su
nota) de `index.html`; el grupo pasa a llamarse «Quién lo pide y por qué vía», y
`js/asuntos-nuevo-crear.js` guarda `ficha.via`/`viaDato` con `App.loPideNuevoControles.leerVia()` —
que ya daba `{via, dato}` pase lo que pase, aunque no se elija «quién»—, en el mismo sitio y formato
de siempre. La fecha de «Lo pide» nace con la de «Fecha de inicio» y la sigue mientras no se toque
a mano. `js/via-contacto.js` pierde el bloque que enganchaba a `#campo-via` (ya muerto): los
botones «De su ficha:» los pone la envoltura de `LoPide.controles` que ya existía para «El
encargo», y que ahora alcanza también a Nuevo asunto sin ningún cambio en ese fichero.
`js/bandeja-propuesta.js` (`llevarANuevo`) pasa a usar `App.nuevoAsuntoCon`, con la vía como
`viaInicial: { via: 'CORREO', viaDato: <remitente> }` en vez de rellenar el campo suelto.

**En la mesa del hito** (`js/hito-mesa.js`, `js/hitos-panel-lista.js`): «Marcar como hecho» (no
«Desmarcar») abre, al terminar de guardarse, la mesa del hito que haya quedado en curso
(`EstadoHito.idActual`, con los datos recién escritos, no los del último repintado); si es una
pregunta sin responder, se abre igual. Sin ninguno en curso, bajo el título sale «Todos los hitos
están hechos.» con un botón que pulsa el de verdad de «Archivar el asunto» de la cabecera de la
ficha. La lógica de marcar (con el aviso de lo obligatorio) salió de la casilla de la lista a
`HitosPanelLista.marcarDesdeCasilla`, que ahora comparten la casilla y el botón de la mesa. Cuando
el guion de un hito llega a estar completo por una acción del usuario en esta sesión (marcar,
generar, registrar, comunicar, añadir), se pregunta una vez «¿Lo damos por hecho?» — memoria en una
variable de `HitoMesa`, no en disco, así que nunca se pregunta dos veces por el mismo hito ni al
abrir una mesa que ya estaba completa.

**«Guardar PDF» cierra el visor de Word** (`js/word-visor.js`): con el PDF guardado y apuntado al
hito, se llama a `cerrar()`, para volver a la mesa sin pulsar «Cerrar» a mano. Si falla algo
principal, el visor se queda abierto (ya se ha salido antes con `return`); con «Imprimir», tampoco
se cierra.

Prueba nueva `pruebas/nuevo-asunto-sin-repetir.mjs`: cambiar de tipo (misma categoría) conserva el
tercero; dar de alta lo deja elegido sin pulsar nada; una sola pregunta de vía, con `ficha.via`
guardado; y «Marcar como hecho» deja abierta la mesa del hito siguiente. Batería completa en verde.

## 26-sep-2026 — Fila 172: el buscador de la papelera

**Nota de sesiones en paralelo:** esta sesión ya la había empezado (y hecho, entera) cuando
descubrió, justo antes de subir nada, que otra sesión la había hecho y fusionado en `main` en
paralelo (misma fila, mismo documento, diseño ya cerrado). Se descartó el duplicado propio con
`git merge` (sin perder nada: los dos diseños coincidían) y se completó solo lo que había quedado
suelto de la versión ya fusionada: la propia entrada de este documento, que esa sesión no pudo
subir por no tener `git push` de verdad (dejó el texto listo en `docs/COLA.md` para pegar).

`docs/PAPELERA-BUSCADOR.md`. Caja de búsqueda encima de la lista del bloque Papelera de Ajustes
(`js/papelera-ajustes.js`), con el texto de ayuda «Buscar en la papelera». Filtra mientras se
escribe, sin botón, con el mismo criterio que ya usan los buscadores de asuntos abiertos y del
ARCHIVO: palabras sueltas, en cualquier orden, sin distinguir mayúsculas ni tildes
(`U.normalizar`), y una ficha se queda si las contiene todas. Busca en el nombre de lo borrado,
qué era, de dónde salía, quién lo borró y la fecha — escrita como `AAMMDD` (`U.aAaMmDd`) y como
`dd/mm/aaaa` (`U.fechaLegible`), para que «2609» o «26/09» encuentren lo borrado ese día.

Contador «N de M» junto a la caja (solo el total, sin nada escrito); sin coincidencias, «Nada en
la papelera con esas palabras.». El aviso ámbar de «más de 30 días» y su botón de borrado de golpe
siguen mirando la papelera entera, no lo filtrado — el texto del botón lo dice si hay un filtro
puesto («… (de toda la papelera)»). Lo escrito se conserva al repintarse la lista (devolver o
borrar una fila, o un cambio del compañero) con `U.conservandoLoEscrito`, aunque en la práctica la
caja vive fuera del trozo que se repinta y nunca se destruye.

No se toca `_GESTOR/papelera.json`: el filtro es solo de pantalla, ni busca dentro del contenido
de los documentos borrados.

Prueba nueva `pruebas/papelera-buscador.mjs`: tres cosas en la papelera, dos palabras en desorden
y sin tildes dejan solo la que toca, el contador dice «1 de 3», sin coincidencias avisa, y tras
«Devolver a su sitio» la caja conserva lo escrito. Batería completa en verde.

## 25-sep-2026 — Fila 171: un documento para cada relacionado

`docs/DOCUMENTO-PARA-CADA-RELACIONADO.md`. En la mesa del hito, junto a cada plantilla, «… para cada
relacionado (N)»: un documento por persona y, en el resumen, «Enviar a cada uno». Decisiones:

- Los valores de cada persona salen de `Plantillas.valoresDePersona`, que llama a la de siempre con
  una copia del asunto donde el relacionado ocupa el sitio del tercero (sin el `contacto` del
  principal): así el DNI, el sexo, la especialidad y el correo salen de la persona, y los campos,
  los firmantes y el curso, del asunto, sin duplicar código.
- Lo que falta se reparte: lo de la persona (DNI, nombre, correo, sexo, especialidad) va al resumen,
  por persona; el resto se pregunta una vez con el cuadro de la fila 155.
- «Nunca dos veces»: `idEnvio` fijo por asunto + documento + correo (el script lo recuerda 6 horas)
  y, para siempre, `ficha.enviosPorPersona` en el asunto. Un documento que ya estaba no se rehace,
  pero sí se puede mandar a quien aún no lo tenga.
- `PlantillasDocumento._interno.leerConMembrete` sale de `generarDocumento` sin cambiar lo que hace:
  el lote lee la plantilla una sola vez.

## 25-sep-2026 — Fila 170: las plantillas del compañero

`docs/PLANTILLAS-DEL-COMPANERO.md`. 50 plantillas nuevas en `plantillas/` (34 de documento, 16 de
correo), escritas por `generar.py` a partir de los documentos del compañero; el script se borró
después, como pedía la fila. Decisiones:

- Ningún tipo ni campo nuevo: las 64 plantillas cuelgan de un tipo que ya está en
  `datos-biblioteca/biblioteca-centro.json` (comprobado antes de subir; ninguna quedó sin tipo, así
  que nada nuevo en `docs/DATOS-QUE-FALTAN-EN-PLANTILLAS.md`).
- Texto propio para Séneca con una línea `=== SÉNECA ===` en el `.md` (`cuerpoSeneca` en el índice,
  `textoSeneca` en `plantillas.json`). Sin él, Séneca sigue con el `texto`, como antes.
- `peticion-historial.md` saca el centro de procedencia con `{{DATO ALUMNADO BD: …}}`: el hueco de
  tablas ya lo entendían la app y la prueba.
- Los cuatro correos antiguos pierden su saludo y su firma escritos a mano (salían dos veces).
  Las plantillas ya cargadas en `_GESTOR` no se tocan: Francisco tiene que pulsar otra vez «Cargar
  las plantillas del centro» para traer las nuevas (no pisa las que ya tiene).

## 25-sep-2026 — Fila 168: las opciones de cada documento, en su fila

`docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md`. En la ficha, cada documento lleva en su propia fila ⧉
(copiar el nombre sin extensión), «Poner nombre» siempre visible y ⋮ con solo «Pasar a versiones
previas» y «Borrar»; «+ Añadir documento» en el título sustituye a «Documentos ▾». Decisiones:

- Las herramientas de PDF van en la barra de acciones que el visor ya tenía para «Por
  clasificar» (`opts.acciones`): ningún punto nuevo en `js/visor.js`.
- El ⧉ lo pinta la propia fila; `js/copiar.js` pierde su envoltura de `App.abrirFicha` y su
  `MutationObserver` sobre la ficha (una envoltura menos en `js/envolturas-esperadas.js`).
- «Poner nombre» y «+ Añadir documento» reutilizan las opciones que ya tenía `Documentos.abrir`
  (`ponerNombre`, `irDirectoAAnadir`): mismo cuadro, sin copiar código.

## 25-sep-2026 — Fila 167: las Administraciones, un tipo de tercero propio

`docs/ADMINISTRACIONES-COMO-TERCERO.md`. Categoría `ADMINISTRACIONES`: organismos (agrupados por
«Depende de») y centros educativos, con su árbol de departamentos. Decisiones:

- Tres módulos (`js/administraciones.js`, `-ficha.js`, `-traer.js`) enganchados por los puntos
  previstos de la fila 166 y dos más: `App.ALTAS_DE_CATEGORIA` (alta con cuadro propio) y
  `App.LISTAS_DE_CATEGORIA` (la lista agrupada, también en el buscador de Nuevo asunto). Ninguna
  envoltura.
- El departamento del asunto se propone en Correo detrás del del hito y del de «Lo pide»: los dos
  son elecciones más concretas. Como no está en la ficha del organismo, va en «Otro correo».
- La bandeja reconoce por el correo exacto de un departamento; por dominio, solo si un único
  organismo lo tiene (el dominio de la Junta es de todos).
- «Pasar a Administraciones» renombra también las carpetas archivadas (su nombre acaba en el
  tercero, que cambia) y rehace el índice del ARCHIVO si ha movido alguna.
- `js/correo-cuadro.js` ya tenía 601 líneas: el cambio se hizo sin añadir ninguna.

## 25-sep-2026 — Fila 166: los tutores legales, un tipo de tercero propio

`docs/TUTORES-LEGALES-COMO-TERCERO.md`. Categoría `TUTORES LEGALES`, sacada sola del RegAlum.
Decisiones:

- Primero, una sola lista de categorías (`Nombres.CATEGORIAS`, con sus textos). Las nuevas van al
  final: muchas pruebas (y la costumbre) reconocen los botones de categoría por su sitio; ponerla
  junto a ALUMNADO rompía seis.
- Puntos previstos nuevos en vez de envolturas: `Datos.registrarFuente`, `App.FICHAS_DE_CATEGORIA`,
  `App.trasPintarFicha`, `App.alFijarTercero`, `Gestor.alCrearAsunto`.
- `nombreApellidos` del tutor va como propiedad no enumerable: añadirla a secas rompía las pruebas
  que comparan el tutor entero.
- En «Por clasificar», los tutores solo se prueban si nadie de las listas de siempre cuadra: una
  solicitud trae el documento del alumno y el de su madre, y el interesado es el alumno.
- `tutores.csv` no entra en `Copias.guardar` (es de JSON): lleva su propia copia del día.

## 25-sep-2026 — Fila 165, decidida: el Word se queda como está

Hablado con Francisco. Editar el Word dentro de la aplicación pedía SuperDoc (AGPL-3.0: enseñar el
código o pagar). Se miró también usar plantillas de Google Docs en vez de Word: cada documento con
datos del alumnado pasaría por el Drive del centro, haría falta internet siempre, y habría que rehacer
la generación (membrete, tablas, género, firma) y pasar todas las plantillas. Decisión: seguir con
Word. Queda en «Descartado» de `docs/COLA.md`.

## 25-sep-2026 — Fila 163: el recuadro de lo que ya tiene el tercero, al crear

`docs/AVISO-DE-PARECIDOS-AL-CREAR.md`. El aviso ámbar solo salía con tipo y solo con asuntos del
mismo tipo, sin fechas. Ahora, en cuanto hay tercero, un recuadro con tres bloques (mismo tipo en
rojo; archivados del mismo tipo a 15 días; el resto en gris). Decisiones:

- Lo puro (fechas, bloques) y el pintado van en `js/duplicados-aviso.js`; `js/duplicados.js` solo
  cambia `mirarSiYaExiste`, con la misma envoltura de siempre (ninguna nueva).
- Se comprobó en la prueba que ir a la ficha desde el recuadro y volver a «Nuevo asunto» conserva lo
  escrito: no hizo falta abrir nada en un panel aparte.

## 25-sep-2026 — Fila 160: «Versiones previas»

`docs/VERSIONES-PREVIAS.md`. El «SIN SELLAR» y el Word que ya tiene su PDF pasan a una subcarpeta
del asunto, plegada en la ficha y en la mesa. Decisiones:

- Nada nuevo en los hitos: siguen apuntando el nombre; la mesa lee también la subcarpeta y enseña allí,
  plegadas, las de ese hito. Así «no se pierde el enlace» sin guardar rutas en `hitos.json`.
- El índice del expediente no se ha tocado: solo lee la carpeta del asunto, así que ya no las ve; su
  marca «(original sin sellar)» se deja para los asuntos que aún no se han ordenado.
- La fusión de carpetas al archivar ya entraba en las subcarpetas: no hizo falta cambiarla.
- Tres pruebas daban por hecho que el «SIN SELLAR» y el Word se quedaban arriba: ahora comprueban que
  van a «Versiones previas».

## 25-sep-2026 — Fila 159: «Administración» en las guías, en vez de las personas

`docs/RESPONSABLE-ADMINISTRACION.md`. Decisiones:

- No había marca de «persona»: se deduce (con la marca de Administración, y que no sea un cargo por id o
  por nombre), como proponía el encargo.
- `js/hitos.js` estaba justo en 600 líneas: una sola línea para `HitosAdministracion.asegurar` y un
  comentario acortado. Lo demás, en `js/hitos-administracion.js`.
- La pasada única mete también los dos hitos de firma en la biblioteca del centro, sin esperar a que
  Francisco pulse «Cargar…» en Mantenimiento; los dos van además en `biblioteca-centro.json`.
- El editor de un modelo de la biblioteca recibía una lista vacía de responsables (el suyo se perdía al
  guardar): ahora recibe la misma que la guía.
- `pruebas/repintar-solo-lo-que-cambia.mjs` pone también la marca nueva, para que la pasada no se cuele
  en lo que mide.

## 25-sep-2026 — Fila 158: «Insertar hueco» en la comunicación de un paso

`docs/INSERTAR-HUECO-EN-EL-PASO.md`. `GuiasComunicacion.enganchar` buscaba el botón y el texto con
`document.getElementById` antes de que el recuadro del paso estuviera en la página: daba `null` y el
botón no hacía nada. Ahora los busca dentro de `raiz` y llama a `HuecosBuscador.montar` directo. Los
otros dos usos de `engancharCampoDeTexto` (el cuadro de una plantilla y el editor en línea de la fila
151) ya enganchan con el cuadro en la página. La prueba nueva falla sin el arreglo.

## 25-sep-2026 — Fila 157: «Actualizar ahora», sin carrera con la publicación

`docs/COPIA-ACTUALIZAR-SIN-CARRERA.md`. La franja guardaba la lista de ficheros de cuando se pintó;
si entre medias se publicaba otra versión, un fichero nuevo no casaba con la lista vieja y salía «el
sha256 de js/version.js no coincide». Ahora «Actualizar ahora» relee la lista al pulsar, y si algo no
casa se reintenta una vez, a los 5 s, con la lista releída y `?t=` contra la caché de GitHub (también
al abrir). La espera se acorta en la prueba con `window.__COPIA_ESPERA_MS__`. Solo si falla dos
veces, un mensaje llano; lo técnico va a la consola.

## 25-sep-2026 — Fila 155: el Word, dentro de la aplicación

`docs/WORD-DENTRO-DE-LA-APP.md`. El aviso de datos que faltan llegaba con el Word ya guardado, y el
Word se abría con `window.open` de un `blob:`: el Chromebook lo bajaba a Descargas con un nombre de
letras. Ahora lo que falta se pregunta antes de guardar nada, y el Word se ve dentro, con «Guardar
PDF» en la carpeta del asunto e «Imprimir». Decisiones:

- **Librerías** (en `js/lib/`, sin CDN, cargadas al abrir el primer Word): docx-preview 0.4.1
  (Apache-2.0), JSZip 3.10.1 (MIT o GPL-3.0, se usa con la MIT) y html2canvas 1.4.1 (MIT); el PDF, con
  la pdf-lib que ya estaba.
- **Editar no**: SuperDoc, el candidato que el encargo pedía mirar, es AGPL-3.0 (o licencia de pago).
  Con la aplicación publicada en internet, la AGPL obliga a ofrecer el código a quien la use: no es
  una decisión para tomar sola. docx-preview solo enseña. «Guardar cambios» queda en la fila 165,
  BLOQUEADA, para hablarlo con Francisco. Ver, PDF e imprimir, que es lo de casi siempre, sí.
- **PDF como imagen** (200 ppp, JPEG): lo que el encargo aceptaba si no había texto seleccionable.
- Las plantillas del centro no traen tamaño de página ni márgenes: sin ellos, docx-preview pegaba el
  texto al borde. El visor pone A4 con los márgenes de Word en España (2,5 y 3 cm).
- Lo escrito en «Faltan datos» entra por `valores.aMano`, mirado primero en `resolverUnHueco`: los
  huecos del catálogo salen en `faltan` con su nombre legible («Grupo»), no con la clave, y así se
  casa por los dos (lo cazó la prueba con la plantilla real).
- `js/plantillas-documento.js` no se partió: con la parte A en `js/word-faltan.js` se queda en 382
  líneas.

## 25-sep-2026 — Fila 162: el estado sigue a los hitos

`docs/ESTADO-SIGUE-A-LOS-HITOS.md`. Con el 3 de Secretaría sin marcar y el 4 en curso y nuestro, la
cabecera decía «Paso 4 de 5»: `aQuienLeToca` dejaba ganar a un hito en curso de Administración.
Ahora el actual es siempre el primero sin terminar. Decisiones:

- La espera automática (responsable del paso que no es de Administración) no se guarda: se calcula
  cada vez, con `auto: true`, y por eso no lleva «Ya ha llegado» ni la vigila `revisarLlegadas`.
- La espera a mano de un hito que ya no es el actual se borra dentro de la propia escritura de
  `hitos.json` (`Hitos.cambiar` → `limpiarEsperasViejas`), sin una segunda escritura ni depender de
  quién haya cambiado el hito.
- La prueba de la fila 104 que comprobaba «gana Administración» se ha dado la vuelta.

## 25-sep-2026 — Fila 164: las recetas de los pasos y todos los documentos en cada hito

Segunda mitad de `docs/HITOS-ACCIONES-EN-EL-HITO.md` (puntos 3 y 4). Decisiones:

- **No hubo que convertir nada**: la `accion` que ya tenían los pasos (la guía del instituto) es la
  clase de receta; `receta` solo añade detalles opcionales. Un paso con acción y sin receta sale igual
  arriba del menú, sin destinatarios ni plantilla fijos.
- La plantilla de la receta llega a los cuadros por `CorreoNucleo._interno.plantillaPedida`, que se usa
  una sola vez (cambiar de plantilla a mano después sigue funcionando), y gana al texto propio del paso.
- «La tutoría» y «otro» no se pueden resolver a un correo: el cuadro sale sin él, para escribirlo.
- `Hitos.guionDe` ya copiaba la línea de la guía, pero armaba cada paso campo a campo: la receta se
  perdía ahí hasta añadirla (lo cazó la prueba).
- Los documentos de otros hitos se ven sin el ⋯: renombrar, registrar o quitar es cosa de su hito.

## 25-sep-2026 — Fila 154 (puntos 1, 2 y 5): las acciones, solo en el hito

`docs/HITOS-ACCIONES-EN-EL-HITO.md`. El mismo botón salía en tres sitios y los números no cuadraban.
Partida en dos como pide el propio documento: aquí las acciones, la lista y los números; las recetas
y los documentos de otros hitos, en la fila 164. Decisiones:

- **Los números**: la causa del «Paso 4 de 4» con el hito 5 en curso era que cada sitio contaba a su
  manera: la marca quitaba los «solo informativo», la tira de la mesa no, y la pestaña «Hitos N/M»
  contaba los hechos (no la posición). Ahora hay una sola cuenta (`Hitos.numerados`, la de la marca):
  la pestaña dice la posición del hito actual y la tira pone «i ·» a los informativos, sin número.
- La barra del guion ya no cuenta un «No aplica» como hecho: 4 pasos, uno no aplica y uno hecho, «1 de 3».
- «Comunicar» y «Generar documento» de la barra de arriba se esconden con CSS si hay hitos (siguen en
  el DOM con su menú). Un tipo sin guía recibe la guía mínima, así que en la práctica todos los
  abiertos tienen hitos. Las pruebas del cuadro de Correo/Séneca que entraban por ahí pulsan ahora su
  menú por debajo; el camino de la mesa ya lo prueban otras.
- «Registrar» de la cabecera usa `HitosDocumentoMenu.registrar` (lo del ⋯), sin tocar `Registro`.
- «No aplica» se queda como enlace que sale al pasar el ratón por el paso.

## 25-sep-2026 — Fila 161: «Ruta» deduce dónde está Dropbox y no pregunta

`docs/RUTA-SIN-PREGUNTAR.md`. En la copia sin internet, «Ruta» abría un cuadro vacío sin decir qué
carpeta pedía, y la ruta completa vivía en `localStorage`, distinto en cada navegador y en la web
frente a la copia. Ahora la ruta sale de dos mitades: lo de dentro de Dropbox, igual en los dos
ordenadores, en `_GESTOR/rutas.json` (una vez para el centro); y dónde está Dropbox aquí, deducido de
la propia dirección en la copia sin internet (`file://`), o de `localStorage` en la web. Decisiones:

- Las rutas completas antiguas se siguen leyendo: rellenan `rutas.json` solas (solo si su último
  trozo se llama como la carpeta señalada) y dan la parte de este ordenador en la web.
- Una ruta pegada que no acaba en la carpeta pedida no se guarda: aviso rojo. Evita pegar la del
  ARCHIVO donde se pedía la de abiertos, que dejaría mal el `rutas.json` de todo el centro.
- Se copia antes de guardar `rutas.json`: el navegador solo deja copiar justo tras el clic.
- La prueba sirve la aplicación como `file://` desde un enlace en `…/Dropbox (Personal)/
  ADMINISTRACIÓN/REGISTROS/Gestor de Asuntos - aplicación/` (con acentos), sin generar la copia.
- Las pruebas de GitHub estaban en rojo desde la fila 152: el Chromium de Actions (headless shell) abre
  la carpeta `file://` pero no pinta su lista («addRow is not defined»). La prueba 7 de
  `pruebas/copiar-ruta.mjs` comprueba ahora que se queda en la carpeta entera (sin cortar en el `#`) y,
  solo si la lista se pinta, que sale el fichero.

## 25-sep-2026 — Fila 149: el membrete lo dibuja la aplicación, con el manual de la Junta

`docs/MEMBRETE-LETRA-DEL-MANUAL.md`. Desde la fila 81 se subía una imagen de membrete y la app
escribía encima la Consejería, en Arial, dentro de una caja de cuatro números. Ahora `js/membrete.js`
dibuja el membrete entero (2480 × 400): el símbolo de la Junta (SVG), «Junta de Andalucía» en Noto
Sans HK negrita, la Consejería (vacía, «Consejería de Educación») y el nombre del centro en
mayúsculas y verde, con las medidas del manual en proporción a la altura del símbolo; a la derecha,
si la plantilla lo lleva (`conLogoCentro`, marcada por defecto), el logo del centro. Decisiones:

- El nombre del centro es el mismo dato `centro` de «Datos del centro y firma»: el bloque Membrete lo
  enseña y lo guarda, y pone al día el otro campo.
- La letra: esta sesión no llega a GitHub (donde está la Noto Sans HK entera para recortarla con
  `pyftsubset`), así que se pidió a la API de Google Fonts con `text=` los caracteres latinos y los
  signos del español: dos `.woff2` de 14 KB, con kerning. La licencia OFL, del paquete
  `@fontsource/noto-sans-hk` de npm.
- La letra y el símbolo se leen con `App.leerFicheroDeLaApp`, así que valen también en la copia sin
  internet (`scripts/copia-local.mjs` los mete en `copia-datos/`). Si la letra falla, Arial; si el
  símbolo falla, sin membrete, como antes sin imagen.
- `vercel.json` no necesita cambios: su política de seguridad no pone `font-src` ni `img-src`.
- Quitar el logo lo manda a la papelera (`Papelera.mandarFichero`, ahora exportada). `membrete.png` ya
  no se usa y no se borra.

## 25-sep-2026 — Fila 148: las pruebas de GitHub, en verde, y menos ejecuciones

`docs/PRUEBAS-EN-VERDE.md`. Francisco recibía un «Run failed» por cada subida. Leídas las ejecuciones
de «Pruebas» en `main` (herramienta de Actions): solo fallaba `pruebas/indice-del-expediente.mjs`,
en «un fallo al crearlo no impide archivar», desde la fila 138 (la ficha baja a su carpeta al
archivar, y archivar tarda un poco más). No era la aplicación: la prueba esperaba el aviso verde
«Asunto archivado.», que seguía a la vista desde el asunto anterior, y miraba el ARCHIVO antes de que
el segundo archivado terminase (salía 1 fichero en vez de 3, y aún sin el aviso ámbar). Ahora espera
a que el asunto salga de los abiertos. «Publicar la copia sin internet» estaba en verde.

`pruebas.yml`: `paths-ignore: ['docs/**']` (marcar una fila EN CURSO ya no lanza la batería) y
`concurrency` con `cancel-in-progress` (dos subidas seguidas: solo se prueba la última). Los avisos por
correo de GitHub son de la cuenta de Francisco: no se tocan.

Lo que costó: la primera pasada local se contaminó (un servidor de pruebas viejo seguía en el puerto
8123 sirviendo la copia de trabajo, con la mesa ya cambiada); el registro de GitHub fue lo fiable.

## 25-sep-2026 — Fila 147: la mesa del hito, en tarjetas que se abren en grande

`docs/MESA-TARJETAS-QUE-SE-ABREN.md`. Los documentos y las notas iban apretados en la columna
derecha (nombres cortados con «…», caja de notas de una línea). Ahora hay tres tarjetas: una en grande
a la izquierda y dos de resumen a la derecha; pulsar una la abre en grande. Decisiones:

- Las tres tarjetas grandes están siempre en el DOM y el CSS enseña una (`data-tarjeta` en
  `.mesa-columnas`): cambiar no repinta nada, así que no se pierde lo que se escribe, y los botones del
  guion siguen pulsando los de siempre aunque estén en otra tarjeta.
- La tarjeta abierta se recuerda por asunto e hito (`HitoMesa`); «Quitar del hito» (que vuelve a pedir
  la mesa con `abrirAlPintar`) no devuelve al guion si es el mismo hito.
- El código de registro va en su propia columna; el estado dice solo «Registrado»/«Sin registrar».
- «Registrar» desde el guion abre antes la tarjeta de documentos (el menú ⋯ está allí).
- Nuevo `js/hito-mesa-tarjetas.js` (los tres resúmenes y los gestos). Pruebas que escribían en la
  nota del hito o tocaban la tabla abren antes su tarjeta; nueva `pruebas/mesa-tarjetas-que-se-abren.mjs`.

## 25-sep-2026 — Fila 146: las casillas de un impreso, con nombres que se entienden

`docs/IMPRESOS-CASILLAS-LEGIBLES.md`. En Ajustes › «Impresos oficiales» salían decenas de filas con el
nombre interno de cada casilla (`form1[0].#pageSet[0].Página_2[0]…apellido1encab[0]`). Ahora cada una
tiene un nombre legible, las repetidas van juntas, hay una miniatura de dónde está y solo las del
centro están a la vista. Decisiones:

- Al mirar los impresos de verdad (`formularios/`), la propuesta automática de la fila 84 (que miraba
  el nombre entero) proponía el centro para «Rellenable», «Botones», «Field»… porque un bloque de más