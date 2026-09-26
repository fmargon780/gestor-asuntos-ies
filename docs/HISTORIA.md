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
  arriba se llamaba «CENTROS», y la fecha de hoy para «Lugar», «Día», «Fdo». Como esta fila hace que la
  propuesta se guarde sola, se cambió a mirar solo el nombre propio de la casilla, y a no proponer las
  numeradas del 2 en adelante (los otros centros que pide la familia). En el Anexo III quedan cinco.
- De persona: por palabras en el nombre o en el bloque que la contiene; «centro actual» es de la
  persona (el suyo), no el nuestro.
- La parte XFA: pdf-lib ya la quita él solo al leer un formulario (lo avisa por consola); se añadió
  el borrado explícito y una prueba. Los impresos siguen con todas sus casillas.
- «Sin casillas del centro» se recuerda solo en la sesión: `formularios-campos.json` no cambia de
  forma.
- La pantalla pasó a `js/formularios-ajustes.js` y lo que no toca el disco a
  `js/formularios-casillas.js`.

## 25-sep-2026 — Fila 145: la mesa del hito, enfocada

`docs/MESA-DEL-HITO-ENFOCADA.md`, a partir de una captura de «Recoger la solicitud» y de un ejemplo en
HTML que Francisco aprobó. La mesa lo enseñaba todo con el mismo peso (tres columnas, unos quince
botones). Ahora **el guion manda**: el siguiente paso resaltado con su acción como botón principal, y lo
demás en dos desplegables de la cabecera («Generar documento ▾», «Comunicar ▾») y en el menú «···».
Decisiones:

- Solo cambia cómo se ve. Los botones de siempre del hito siguen en el DOM, escondidos, y las acciones
  del guion los pulsan; las funciones que rellenan plantillas y destinatarios no cambian: solo se
  movió su caja (`.mesa-plantillas`, `.mesa-destinatarios`) a los desplegables.
- Los desplegables van dentro de la página (no chocan con el cuadro único) y recuerdan cuál estaba
  abierto, para que un repintado (guardar, llegar un documento) no lo cierre.
- «Pedir lo que falta» vive dentro de «Comunicar ▾»: queda resuelto el punto «los tres botones de
  comunicar» de «Lo que queda por hablar».
- Una línea 📎 sin acción se trata como «Añadir documento» (así el siguiente paso siempre tiene botón).
- «Estamos en este paso» (fila 129) pasa al menú «···», para que la cabecera tenga cuatro botones.

## 25-sep-2026 — Fila 144: el alumnado de la base de datos, desde la carpeta de Drive

`docs/ALUMNADO-BD-DESDE-DRIVE.md` y el acuerdo, versión 2. La dirección web con clave de la fila 142
la paró el control de seguridad al hacer la otra mitad en `bd-alumnado-ies` (datos de menores abiertos
a quien tuviera la línea), y Francisco la descartó. Ahora la base de datos deja `ALUMNADO-BD.json` en
su carpeta de Drive, con **todo** lo que sabe de cada alumno. Decisiones:

- Fuera todo lo de la dirección (caja, «Probar», `fetch`); lo guardado en `asuntos.json`
  (`ajustesAlumnadoBD`) se borra solo al entrar.
- La carpeta, de cada ordenador (Almacen), como las del Dropbox; la copia en `_GESTOR/datos/`, para el
  otro. Se copia solo si su `generado` es más nuevo.
- Genérico de verdad: el código no nombra ningún dato salvo `idEscolar` y `matriculado`. Por eso el
  archivo no añade personas (no sabría su nombre): el RegAlum sigue siendo la base. Queda apuntado
  en «Lo que queda por hablar».
- «Manda el archivo salvo que sea más viejo que el RegAlum»: en `matriculado` y en las columnas del
  RegAlum que se llaman igual que una `etiqueta`.
- Dos módulos: `js/alumnado-bd.js` (carpeta, copia, mezcla) y `js/alumnado-bd-ver.js` (ficha, huecos,
  grupos). La tarjeta «Datos académicos» de la 142 desaparece: la sustituyen las de cada apartado.

## 25-sep-2026 — Arreglo: Vercel no publicaba desde la fila 139

Desde la fila 76 (`buildCommand` que escribe la hora de la versión), Vercel buscaba la web en una
carpeta `public` que no existe y cada publicación acababa en error («No Output Directory named
"public"»): la última buena fue la de la fila 138. Arreglo: `"outputDirectory": "."` en
`vercel.json` (la web está en la raíz del repositorio, como antes del `buildCommand`).

Ese día se pasó además el límite de Vercel gratuito (100 publicaciones al día, `api-deployments-free-per-day`):
cada subida contaba dos (`main` y la rama `claude/…` de la sesión, aunque esta se saltara). Ahora
`vercel.json` lleva `git.deploymentEnabled: { "claude/**": false }`: las ramas `claude/…` ya no crean
publicación.

## 25-sep-2026 — Fila 142: el alumnado, desde la base de datos de alumnado

`docs/ALUMNADO-DESDE-LA-BD.md` y el acuerdo `docs/ACUERDO-ALUMNADO.md`. El gestor consulta el
resultado de la base de datos de alumnado (que limpia y cruza las listas de Séneca) en vez de
preparar cada lista por su cuenta. Decisiones:

- Todo en un módulo nuevo, `js/alumnado-bd.js`, enganchado con una llamada en cada sitio
  (`js/datos-alumnado.js`, `js/ficha-tercero-alumno.js`, `js/tablas-datos.js`, `js/frescura.js`,
  `App.pintarAjustes`), sin envolver nada.
- La dirección va en `asuntos.json`, no en el navegador: es del centro. Nunca en el repositorio.
- Lo que trae la base manda sobre el RegAlum alumno a alumno; lo que no trae, sigue del RegAlum.
  Con un fichero que no cumple el acuerdo (`acuerdo` distinto de 1, o alumnos sin Nº escolar), se
  ignora entero: mejor el RegAlum que medio fichero.
- La NEAE, solo «Sí» o nada: es dato de salud.
- La tabla «ALUMNADO BD» reutiliza el camino de las tablas de datos: los informes futuros salen de ahí.
- Prueba `pruebas/alumnado-desde-la-bd.mjs`, con tres alumnos inventados.

## 25-sep-2026 — Fila 141: repartir un PDF entre terceros

`docs/REPARTIR-ENTRE-TERCEROS.md`. El caso: los cuestionarios de altas capacidades que manda cada
colegio en un solo PDF. Ahora se reparten: un trozo por persona, cada uno en su asunto ya archivado,
y el oficio se queda en el asunto del colegio. Decisiones:

- El archivado es el de siempre (`App.cerrarAsunto`, con su índice y su índice del expediente), sin
  su pregunta: `App.E.archivarSinPreguntar`, puesto solo mientras dura cada uno.
- Lo leído en el texto del PDF manda sobre el orden; el resto de relacionados se asigna por orden a
  los trozos que quedan.
- El buscador de «otra persona» es una lista del alumnado dentro del propio desplegable (datalist):
  así no se abre un segundo cuadro encima del de repartir.
- `Carpetas.nombreLibreConSufijo` siempre pone «(2)»: para el oficio se mira antes si el nombre ya
  existe.

## 25-sep-2026 — Fila 140: tiempo de tramitación por tipo

`docs/TIEMPO-DE-TRAMITACION.md`. «Cuentas» ya daba la media y el máximo de días del total; ahora
también por tipo, y enseña lo que lleva abierto demasiado (más de 30 días) y los diez abiertos más
antiguos. Va en `js/cuentas-tiempos.js` para no pasar `js/cuentas.js` de 400 líneas. Los días de un
abierto se cuentan desde su `abiertoEl` o, si no lo tiene, desde la fecha de su carpeta.

## 25-sep-2026 — Fila 139: una sola libreta de notas por asunto

`docs/UNA-SOLA-LIBRETA-DE-NOTAS.md`. Las notas del asunto y las de cada hito se juntan en una: las del
asunto, con el hito como etiqueta. De paso se acaba el viejo riesgo de la fila 34 (una nota de hito
a medio escribir que se perdía con un repintado). Decisiones:

- La historia automática (marcado, generado, comunicado, dado por hecho) se queda en el hito, bajo
  «Historia». En el código no se distinguía de las escritas a mano: la migración las separa por su
  forma fija, y desde ahora lo escrito a mano ya no va al hito.
- Un hito cuyas notas están en el asunto sigue contando como «con algo apuntado» al cambiar de
  rama o de tipo (no se quita), como antes.
- Al guardar desde la mesa, la caja se vacía: el repintado, que conserva lo escrito, la habría
  vuelto a llenar con la nota ya guardada.

## 25-sep-2026 — Fila 76: la versión, escrita sola al publicar

`docs/VERSION-AL-PUBLICAR.md`. Bloqueada desde el 19-sep-2026 por miedo a un bucle de commits; se
desbloqueó con otro diseño: **nunca un commit**. Cómo quedó:

- `vercel.json` lleva `"buildCommand": "node scripts/version-al-publicar.mjs"`. El script cambia la
  línea `App.VERSION = '…';` de `js/version.js` por la hora de España (con `Intl`, zona
  `Europe/Madrid`, nunca UTC a pelo) solo en lo que Vercel va a servir. Si algo falla, sale con 0 y
  se queda la escrita: la publicación no se rompe nunca por esto.
- No hace falta `installCommand`: `package.json` no se sube a Vercel (`.vercelignore`), así que no
  instala nada; `scripts/` sí se sube (ya lo necesitaba el `ignoreCommand`).
- La escrita a mano no se jubila: la copia sin internet se genera del repositorio en GitHub
  Actions y solo se actualiza sola si cambia esa línea. Por eso se sigue poniendo en cada subida.
- Solo se puede comprobar publicando: esta sesión no llega a la web, así que se pide a Francisco
  que mire la hora de abajo a la izquierda.

## 25-sep-2026 — Fila 138: una sola lista dentro del hito

`docs/UNA-SOLA-LISTA-EN-EL-HITO.md`. El guion y «lo que hay que reunir» hacían lo mismo: queda el guion.
Las palabras son tres: guía (el modelo), hito (cada paso) y guion (la lista de tareas). Decisiones:

- Los requisitos viejos no se borran de `guias.json`, `hitos-biblioteca.json` ni `hitos.json`: se
  dejan de leer. El paso se hace una vez (marca `reunir-migrado.json`) y es idempotente por el id
  `reunir-<id>`.
- Un requisito de un hito que su paso de la guía no tiene (lo había añadido solo ese asunto) pasa
  a línea propia del asunto; uno que sí, deja su estado (hecho, valor, documento, quién y cuándo)
  en la línea del paso.
- Los documentos se marcan solos por el mismo camino de siempre (`marcarPorDocumento`), que ahora
  manda al guion; también al asociar un documento a un hito desde la ficha.
- En el contenido del instituto (`biblioteca-centro.json`) los 87 requisitos de 44 pasos y modelos
  pasaron a líneas del guion, y ahí sí se vaciaron (es un fichero nuestro, no del centro).
- «+ Añadir algo que falte» desaparece con el bloque: una línea propia del guion hace lo mismo.

## 25-sep-2026 — Fila 137: el índice del expediente

`docs/INDICE-DEL-EXPEDIENTE.md`. Para mandar un expediente a Inspección o a un recurso, la ley pide un
índice numerado de sus documentos: ahora lo hace la aplicación, en PDF, al archivar y con un botón
en el menú de la ficha. Decisiones:

- La línea del botón «Poner en orden las fichas del ARCHIVO» salió de `CONTEXTO-CORTO.md` para hacer sitio;
  sigue en Mantenimiento y en `docs/contexto/ASUNTOS-ARCHIVO.md`.
- Al rehacer el índice, el viejo va a la papelera sin nota en el asunto (una nota por cada índice
  rehecho sería ruido).
- El índice sí se ve en la lista de documentos de la ficha (es un fichero de la carpeta), pero no
  cuenta, no se registra ni se asocia a hitos.
- La letra del PDF es Helvetica, que solo escribe el juego WinAnsi: tildes, eñes, «», · y — salen
  bien; algo raro (un emoji en un nombre) sale como «?» en vez de romper el índice.

## 25-sep-2026 — Fila 136: cuánto tiempo se guarda cada asunto

`docs/PLAZO-DE-CONSERVACION.md`. La ley de protección de datos pide no guardar datos personales más de
lo necesario: cada tipo de asunto puede llevar sus años de conservación, y la aplicación avisa de
los archivados que los han cumplido. Nunca borra sola. Decisiones:

- «Mandar a la papelera» un archivado es una clase nueva de la papelera (`archivado`): la carpeta
  entera va dentro, y «Devolver» la lleva a su sitio del ARCHIVO (categoría y tercero, o donde
  estuviera suelta) y a su índice.
- «Conservar más tiempo…» cuenta los años desde hoy, no desde el plazo viejo.
- Un tipo sin plazo no avisa nunca, aunque algún asunto suyo tenga `conservarHasta`.
- El índice del ARCHIVO guarda `archivadoEl` y `conservarHasta` solo si la ficha los trae: sin
  subir su versión ni reconstruirlo. Un archivado de antes sin fecha de cierre usa la de su nombre,
  marcada como aproximada.

## 25-sep-2026 — Fila 135: asuntos reservados

`docs/ASUNTOS-RESERVADOS.md`. Un expediente disciplinario o de salud ya no se ve sin querer: sale con
candado y sin el nombre del tercero en las listas, «Qué me toca» y el buscador (que solo lo
encuentra por el nombre de la carpeta). La ficha, si se abre, se ve entera. Decisiones:

- La tarjeta se tapa al colgarla, ya pasada por todos sus envoltorios (el del NIE, el de presencia…),
  no dentro de `App.tarjetaAsunto`: si no, un envoltorio de después volvía a poner el NIE.
- «Mostrar reservados» también devuelve el buscador normal (notas incluidas) mientras está puesto.
- El índice del ARCHIVO guarda `reservado` solo si la ficha lo trae; sin él manda el tipo, así que
  no hizo falta reconstruir el índice.
- El botón solo sale si hay algún tipo o asunto reservado, para no llenar la barra.

## 25-sep-2026 — Fila 134: quién encarga cada tipo

`docs/QUIEN-ENCARGA-CADA-TIPO.md`. Cada tipo de asunto dice qué órgano lo encarga (Secretaría,
Dirección, Jefatura de Estudios o Varios; sin nada, «Sin asignar»), para que con dos personas
creando tipos no se repitan. Se pone en la pantalla del tipo, al crearlo desde Nuevo asunto o, de
una vez, en Ajustes › Tipos de asunto › «Quién encarga cada tipo»; se usa para agrupar la parrilla
de Nuevo asunto, filtrar Asuntos abiertos y contar en Cuentas. Decisiones:

- Si todos los tipos de una categoría son del mismo órgano (al principio, todos «Sin asignar»), la
  parrilla no pone rótulos: no dirían nada.
- En el bloque de Ajustes, al cambiar un desplegable con «Solo los sin asignar» puesto, la fila se
  queda donde está hasta el siguiente repintado: que no salte debajo del ratón.
- En la prueba, `waitForFunction` con una función `async` no espera (una promesa ya cuenta como
  verdadera): se espera al disco con un bucle en la propia prueba.

## 24-sep-2026 — Fila 133: partir los ficheros grandes

`docs/PARTIR-FICHEROS-GRANDES.md`. Catorce ficheros de más de 600 líneas partidos por temas en 35
trozos nuevos de menos de 400, moviendo funciones enteras, sin cambiar nada de lo que se ve
(`ajustes-centro.js` ya había bajado con la fila 132). Cómo se hizo, para la próxima vez:

- El estado que comparten los trozos (variables del cierre) pasa a un objeto interno
  (`Datos._interno`, `BandejaNucleo`, `FichaNucleo`, `CorreoNucleo._interno`…), y solo se cambian
  las llamadas y los usos del valor, nunca los comentarios ni los textos.
- Cada trozo va en `index.html` justo después de su origen; las envolturas que se mudaron de
  fichero se cambiaron en `js/envolturas-esperadas.js`.
- Las pruebas sin navegador que cargaban el origen suelto (`vm`) cargan también sus trozos. En
  `vm`, `window.X` no es global: un trozo que busca a su origen lo hace por `window.X`.
- Batería completa tras cada fichero partido (la excepción a «una sola tanda»).

## 24-sep-2026 — Fila 132: arreglos por dentro

`docs/ARREGLOS-POR-DENTRO.md`. Cinco arreglos sin pantalla propia:

- **Los terceros se releen solos**: la caché de `Datos` se olvida cuando cambia la fecha de un CSV
  (revisión de cada cinco minutos de `js/conflictos.js`).
- **Fuera el código de los estados escritos a mano** (tras la fila 129 ya no pintaba nada). La
  migración lee `estados.json` por su cuenta. Un archivado de antes enseña su estado viejo.
- **Cabeceras de seguridad** en `vercel.json` (nosniff, sin referer, CSP de marcos/objetos/base),
  sin política de scripts a propósito.
- **pdf.js 4.10.38** (antes 4.2.67). Ya no trae el `await` de nivel superior que
  `scripts/copia-local.mjs` parcheaba: el parche ahora solo se aplica si está.
- **Una sola regla para los destinatarios** (`js/destinatarios.js`). Diferencia encontrada al
  unificar: «Comunicar» a un relacionado sacaba los correos con una expresión propia, igual en la
  práctica a la del cuadro de Correo; manda la del cuadro de Correo.
- Pruebas ajustadas: la de avisos usa ahora la fecha límite (verde por lo guardado, ámbar por el
  repintado) en vez del estado; `pruebas/grupos.mjs` prueba la regla de verdad, no una copia.

## 24-sep-2026 — Fila 131: plazos bien contados

`docs/PLAZOS-BIEN-CONTADOS.md`. **El porqué**: `Plazos.sumarDiasHabiles` saltaba los días no
lectivos, y eso mezclaba dos cosas: los días hábiles del procedimiento administrativo (sin
festivos, pero las vacaciones escolares SÍ cuentan) y los lectivos de convivencia (sin festivos ni
no lectivos). Un plazo de diez días hábiles que cruzaba la Navidad se alargaba de más.

- Cada plazo dice cómo se cuenta (`plazo.cuenta`: hábiles por defecto, lectivos o naturales;
  en naturales, si el último día no es hábil, pasa al siguiente). Desplegable en el editor del
  paso (`js/guias-plazo.js`); el hito lo copia; los plazos de antes se leen como hábiles.
- Ajustes › Hitos gana la caja de **festivos** (`ajustes.festivos`), aparte de los no lectivos,
  con aviso ámbar en el título mientras esté vacía. Se fusionan en conflicto como los no lectivos.
- La mesa del hito dice «quedan N días hábiles / lectivos / naturales» según el plazo del hito.
- Consecuencia para Francisco: los plazos que tuviera pasan a contarse en hábiles; uno de
  convivencia hay que cambiarlo a lectivos en su guía. Y hay que pegar los festivos.

## 24-sep-2026 — Fila 130: guardar y enviar sin sorpresas

`docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md`, del análisis crítico del 24-sep-2026. Tres arreglos de
«que no se pierda ni se duplique nada», casi sin nada que se vea.

- **Todo guardado de `_GESTOR` por la cola.** Quedaban fuera el tablón (`cambiar`, su fusión y
  devolver una nota), los CSV de terceros dados de alta a mano, `borrados-listas.json` e
  `indice-archivo.json`. Los CSV salen de `js/datos.js` a `js/datos-listas.js`, releyendo el CSV
  dentro de la cola. Entre dos ordenadores, `js/conflictos.js` une ya las copias en conflicto de
  esos cuatro CSV (unión de filas; si chocan por el nombre, se queda la del fichero real y la otra
  se ofrece en Ajustes).
- Un tropiezo del camino: `Datos.olvidar()` sustituía el objeto de la caché por uno nuevo, y
  `js/datos-listas.js`, que lo tenía cogido, se quedaba con el viejo. Ahora se vacía el mismo.
- **Un correo no sale dos veces**: identificador de envío por cuadro, recordado 6 horas por el
  script (`enviarUnaVez`), y 90 s de tiempo límite con «No sé si ha salido». Hay que pegar el
  script otra vez (junto con lo de la fila 117).
- **Nombres con tope**: carpeta de asunto ≤150, documento ≤120 más extensión, recortando solo el
  texto libre y los campos; aviso ámbar en la vista previa. Adjuntos: extensión limpia.
- Decisión propia: `tablon.js`, `papelera.js`, `nombres.js` y `archivo-indice.js` no se parten
  (cambio de pocas líneas), como pedía la fila; `datos.js` sí adelgaza.

## 24-sep-2026 — Fila 129: el hito es el estado del asunto

`docs/EL-HITO-ES-EL-ESTADO.md`. **El porqué**: tras la fila 104 convivían dos sistemas, el
estado escrito a mano (`ficha.situacion`) y el hito, y la aplicación obedecía a uno en silencio.
Francisco no veía el hito en ningún sitio (la tarjeta seguía enseñando el estado manual) y los
asuntos que él ponía «en espera» se quedaban en Pendiente de Administración, porque con hitos el
estado se ignoraba sin avisar y el primer hito sin marcar solía ser nuestro. Se quita uno: manda
el hito, y solo el hito.

- La tarjeta y la cabecera de la ficha enseñan «Paso N de M · título» (pulsable: abre la mesa),
  «Listo para archivar» o «Sin hitos». `Hitos.estadoDelAsunto` sigue siendo la única que decide.
- Cada paso de la guía dice «Nos toca» o «Esperamos a…» (`js/guias-toca.js`); manda sobre el
  responsable y llega a los hitos que ya existen.
- «Esperando a…» a mano, en el hito actual; se quita al llegar un fichero nuevo a la carpeta, al
  marcar hecho ese hito o con «Ya ha llegado». «Estamos en este paso» pone al día de un golpe los
  asuntos que iban más avanzados de lo que decían sus hitos.
- Guía mínima (Tramitar · Esperar respuesta · Archivar) para los tipos sin guía, y un paso único
  (`js/estado-migracion.js`) que da hitos a los abiertos que no tenían y convierte los estados de
  espera en «Esperando a» tercero. `situacion` y `estados.json` no se borran, por si hay que
  deshacer.
- Fuera: el desplegable de estado (tarjeta, ficha, Nuevo asunto), la rejilla de estados de Ajustes
  y el «Poner el asunto en …» del correo (ahora «Dejar el asunto esperando a la familia»).
- Decisión propia: los ficheros de más de 400 líneas que había que tocar (`js/guias.js`,
  `js/ficha-asunto.js`, `js/asuntos-lista.js`, `js/asuntos-nuevo.js`, `js/hitos.js`) no se han
  partido: lo nuevo va en ficheros nuevos y en ellos solo hay cambios de pocas líneas (varios
  adelgazan al quitar el estado). Partirlos habría sido un cambio grande sin nada que ver.
- De paso: `docs/HISTORIA.md` vuelve a estar entero (se había cortado en la fila 82 al cerrar la
  fila 128); se recompuso con el historial de git (commit `86d22d4`), sin retipear nada.

## 24-sep-2026 — Fila 128: crear un tipo de asunto sin salir de Nuevo asunto

`docs/TIPO-DESDE-EL-ASUNTO.md`. Idea de Francisco: hasta hoy los tipos de asunto solo se creaban
en Ajustes, nunca sobre la marcha; eso obligaba a interrumpir "Nuevo asunto", ir a Ajustes, crear
el tipo y volver a empezar. Cambia esa decisión de siempre.

- `js/tipo-al-vuelo.js` (nuevo): el botón **«+ Crear tipo nuevo»**, destacado bajo el buscador de
  tipos con texto escrito (aunque haya parecidos que no valgan, no solo sin resultados) y discreto
  al final de la parrilla sin texto. Un panel de tres datos —nombre, nombre corto opcional y
  categoría—, dentro de la misma pantalla, nunca un segundo `#capa`.
- Se enganchó a `js/tipos-buscador.js` (`TipoAlVuelo.repintar()`, llamado al final de `aplicar()`,
  que es lo único que dispara escribir en el buscador, no `App.pintarTipos` entero): un punto, no
  una envoltura.
- La creación se sacó de `js/ajustes.js` a `App.crearTipo`, ya pasada la guardia `U.dejaCrear`, y
  la usan los dos sitios. Un nombre repetido no se duplica: avisa y ofrece «Usar este».
- `js/asuntos-nuevo.js` ganó `App.marcarTipoElegido`, quirúrgica: deja el tipo elegido sin tocar
  el tercero ni lo ya escrito (descripción, campos), a diferencia de `App.elegirTipo`, por si se
  crea el tipo con el formulario ya avanzado (el buscador de tipos sigue a la vista aunque ya haya
  tercero). Si todavía no había tercero, revela ese bloque igual que siempre.
- Escape cierra el panel, no Nuevo asunto: un `keydown` propio, en captura, con `stopPropagation`,
  mismo cuidado que `js/huecos-buscador.js` por el mismo motivo (el manejador de Escape de
  `js/usabilidad.js` está en burbuja, sin captura).
- Trampa real durante las pruebas: `document.getElementById` no encuentra nada dentro de un nodo
  todavía sin colgar del documento. `construir()` montaba el panel entero y le enganchaba los
  `onclick`/`oninput` con `$()` (que es `document.getElementById`) antes de que `repintar()`
  colgara el contenedor del documento la primera vez: hubo que buscar dentro de `panel` con
  `querySelector`, no con `$()`, mientras se está montando.
- Prueba nueva `pruebas/tipo-desde-el-asunto.mjs`: el botón destacado/discreto según el texto, crear
  el tipo y que quede elegido, que un nombre repetido no se duplique y ofrezca el que ya hay, que no
  se pierda el tercero ni lo escrito al crear un tipo distinto a medio formulario, que Escape solo
  cierre el panel, y que el tipo aparezca en Ajustes. Batería completa en verde, una sola pasada.
- Versión `App.VERSION`: `24-sep-2026 · 15:32`.

---

## 24-sep-2026 — Fila 127: el membrete se guardaba pero nunca se encontraba

`docs/MEMBRETE-NO-SE-ENCUENTRA.md`. `js/membrete.js` preguntaba por `membrete.png` con
`Carpetas.existe`, que busca una CARPETA: siempre «no hay imagen», y los documentos salían con
`{{MEMBRETE}}` escrito. Tres llamadas pasan a `Carpetas.existeFichero`; la imagen que Francisco ya
subió está bien guardada y vale sin volver a subirla.

- Buscando más casos iguales salieron tres en `js/papelera.js` (devolver un documento a su asunto,
  un documento a «Por clasificar» y un suelto): comprobaban si ya había «algo con ese nombre» como
  carpeta, así que un documento devuelto podía pisar a otro que se llamara igual. También pasan a
  `existeFichero`. Las demás llamadas son de carpetas de asunto y están bien.
- `pruebas/membrete.mjs` solo probaba `Membrete.medir`: por eso no lo cazó. Prueba nueva
  `pruebas/membrete-se-encuentra.mjs`, con `js/carpetas.js` de verdad; falla sin el arreglo.
- Versión `App.VERSION`: `24-sep-2026 · 14:04`.

---

## 24-sep-2026 — Fila 126: un tipo que cambia de nombre se lleva todo lo suyo

`docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md`. Caso real: «Cargar la biblioteca del centro» renombró DESEMPEÑO
FUNCIÓN TUTORIAL al nombre largo (fila 123) y su guía se quedó bajo el nombre corto, así que la mesa
del hito dejó de enseñar la plantilla. `App.renombrarTipo` tenía el mismo hueco.

- `js/tipos-nombre.js`: `TiposNombre.mover` para los dos caminos, y un arreglo al entrar que junta con
  su tipo lo que siga bajo el nombre corto o un alias. Plantillas casan por cualquiera de los nombres.
- Decisión: el arreglo al entrar solo se dispara por la guía, los campos o los recurrentes. Las
  plantillas del centro llevan el nombre corto en `indice.json`; si también dispararan el arreglo, la
  carga las devolvería al nombre corto y el arreglo al largo, en cada entrada. Como ya casan por
  cualquier nombre, no hace falta.
- La carga de plantillas no duplica (mismo nombre y fichero con otro tipo: se le cambia el tipo, salvo
  que sea el mismo tipo con otro nombre) y quita las repetidas; la del centro de Francisco, repetida
  desde la fila 110 con CERTIFICADO PERSONAL, se va a la papelera al entrar.
- «Buscar otra plantilla…» en la mesa del hito y en el cuadro de «Generar documento»
  (`js/plantilla-buscar.js`).
- Ficheros partidos: `App.renombrarTipo` sale de `js/ajustes.js` (583 → 510 líneas) y «Cargar las
  plantillas del centro», de `js/plantillas-documento.js` (730 → 624) a `js/plantillas-centro.js`.
  No se han partido `js/plantillas.js` (solo dos funciones de una línea tocadas; varias pruebas lo
  cargan solo, sin navegador) ni `js/recurrentes.js` (no se toca: el recurrente se cambia en el disco
  y se relee con `Recurrentes._cargar`). Siguen pasando de 400 líneas: queda para otra fila.
- La guía y los campos que sobran al juntar van a la papelera con clases nuevas (`guia`,
  `campos-de-tipo`) que la papelera no sabe devolver sola: si hiciera falta, se copian a mano.
- Versión `App.VERSION`: `24-sep-2026 · 13:37`.

---

## 24-sep-2026 — Fila 125: Personas, matriculados primero, buscar por la familia y hermanos

`docs/BUSCAR-PERSONAS-Y-FAMILIAS.md`. En secretaría llama la madre y hay que saber de quién es;
y en Personas el alumno buscado quedaba entre antiguos, con la ficha arriba, fuera de la vista.

- Módulo nuevo `js/personas-familias.js`, llamado desde `js/archivo-personas.js` (sin envolver).
  La parte nueva de la ficha también vive ahí: con ella dentro, `archivo-personas.js` pasaba de 420
  líneas; se queda en 403.
- Decisión: un tutor se reconoce por su DNI sin espacios, puntos ni guiones, y sin DNI por su
  nombre entero. Dos tutores sin DNI que se llamen igual se unirían: con el RegAlum no hay nada
  mejor, y en la práctica suelen ser la misma persona.
- El índice de tutores se guarda en la propia lista que devuelve `Datos.cargar` (`_familias`): así
  se calcula una vez y se rehace solo cuando la lista se vuelve a leer.
- Además de todas las palabras, lo escrito junto («600112233», «12.345.678») se busca en el DNI y
  los teléfonos compactados, para que un número escrito con espacios o puntos también case.
- Comprobado en un navegador a 1905 px con un RegAlum de 83 alumnos: tarjeta de la madre con sus dos
  hijos, «Antiguos (41)» plegado, la ficha fija bajo la cabecera al bajar y el hermano pulsable.
- En la pasada completa de `npm test`, `notas-asunto-no-se-borran.mjs` (caso 10, salir con una nota
  sin guardar) se pasó una vez del tiempo; sola, dos veces en verde. No toca nada de esta fila.
- Versión `App.VERSION`: `24-sep-2026 · 13:14`.

---

## 24-sep-2026 — Fila 124: la renuncia a formar parte de la Junta Electoral

`docs/RENUNCIA-JUNTA-ELECTORAL.md`. En el sorteo de la Junta Electoral, la madre titular del sector
de familias renunció por motivos laborales y el escrito se hizo a mano; ahora sale desde la app.

- Plantilla nueva del centro, `plantillas/renuncia-junta-electoral.md` (OTROS · ELECCIONES CONSEJO
  ESCOLAR, RENUNCIA). Los datos de quien renuncia van en blanco con casillas (sector, designación,
  motivo) y un recuadro final «A cumplimentar por el centro». Una hoja A4: comprobado con el `.docx`
  pasado a PDF con LibreOffice (hubo que instalar su parte de Writer en la sesión).
- Decisión: la persona se nombra en neutro («la persona abajo firmante», «designada»), porque
  `js/genero.js` habría cambiado «designado/a» según el sexo del tercero del asunto, que no es quien
  renuncia. El destinatario sí va con forma doble marcada `:firmante`, y por eso la plantilla lleva
  `firmante: direccion` (solo para el género; la firma del cargo no se pinta).
- Los `id` de las plantillas del centro eran al azar al cargarlas, así que ningún paso de la
  biblioteca podía citar una. Ahora el `.md` puede llevar un `id` fijo, que viaja a `indice.json` y
  se respeta al cargar si nadie lo usa. El modelo `b260` lo cita en `plantillasDocumento`.
- El guion de `b260` gana «Recoger las renuncias y avisar al suplente que corresponda»
  (`g-renuncias`, «generar») detrás de g1, marcada `nueva: true`. «Traer los guiones del instituto»
  no tocaba un guion ya escrito, así que en el centro nunca habría llegado: ahora añade a un guion
  escrito solo las líneas `nueva` que le falten, en su sitio, y las plantillas del modelo. Como el
  hito lee el guion de la guía, llega también a los asuntos ya abiertos.
- `scripts/hacer-plantillas.mjs` aprende `~` (párrafo vacío, para dejar aire). Las demás plantillas
  salen idénticas byte a byte.
- `biblioteca-centro.json` editado con un script que lee y escribe el JSON (solo el modelo `b260`).
- Versión `App.VERSION`: `24-sep-2026 · 12:58`.

---

## 24-sep-2026 — Fila 123: el certificado de función tutorial, como el del centro

`docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md`. Francisco pasó el certificado que usa hoy el centro; la
plantilla de la fila 110 se reescribió sobre ese modelo. Detalle en `docs/contexto/TABLAS-DE-DATOS.md`.

- La plantilla pasa al tipo DESEMPEÑO FUNCIÓN TUTORIAL, firma Secretaría y V.º B.º Dirección. Para
  «C E R T I F I C A:» en negrita y las firmas en dos columnas, `scripts/hacer-plantillas.mjs`
  aprendió `**negrita**`, `^^mayúsculas^^` (versalitas de Word, que alcanzan al valor del hueco) y
  un bloque `| a | b |` (tabla sin bordes). Las demás plantillas salen idénticas byte a byte.
- Decisión: «Secretario/a:firmante» y «del/de la:vistobueno Director/a:vistobueno» escritos en la
  plantilla, en vez de `{{CARGO FIRMANTE}}`/`{{CARGO VISTO BUENO}}`: el cargo se llama «Secretaría»
  o «Dirección» y el texto habría dicho «y Secretaría del IES» o «del Dirección». La fecha va como
  «en {{LOCALIDAD}}, a {{HOY LARGO}}» (`{{LUGAR Y FECHA}}` empieza por «En …» y quedaba «en En …»).
- `{{DNI}}` trae ya el documento entero del personal (antes, solo del alumnado); `{{PROVINCIA}}`
  entra en el catálogo de huecos (el dato ya estaba en «El centro»).
- La plantilla casa con el tipo del asunto sin tildes ni mayúsculas, y el botón de la biblioteca
  empareja igual el tipo que ya existe, sin cambiarle el nombre corto (las carpetas lo llevan).
- Ojo: `datos-biblioteca/biblioteca-centro.json` se editó a mano (y el tipo se apuntó también en
  `docs/contenido/BIBLIOTECA-PERSONAL.md`): volver a generarlo con `herramientas/cargar-biblioteca.mjs`
  perdería los guiones de los modelos, que se añadieron después por otro camino.
- `js/plantillas.js` pasa de 400 líneas y no se ha partido: solo se tocaron líneas sueltas, y varias
  pruebas lo cargan solo, sin navegador; partirlo pide tocar esas pruebas a la vez.

Versión `App.VERSION`: `24-sep-2026 · 12:22`.

## 24-sep-2026 — Fila 122: el editor de la guía, en acordeón

`docs/GUIA-EN-ACORDEON.md`. Con varios pasos, el cuadro de escribir la guía salía con todos los
campos a la vista y no se veía el trámite de un vistazo. Ahora cada paso cerrado es una línea
(número, título, marcas) y solo hay uno abierto a la vez. Detalle en
`docs/contexto/HITOS-Y-GUIAS.md` («El editor, en acordeón»).

- Decisión: plegar con una clase y CSS, sin quitar nada del DOM, para que `recoger()` siga leyendo
  todos los campos y lo guardado no cambie en nada.
- `js/guias.js` (1.204 líneas) se partió antes de tocarlo: la barra de formato a
  `js/guias-barra.js` y la caja de opciones a `js/guias-opciones-editor.js`; el acordeón, en
  `js/guias-plegado.js`.
- El editor de un modelo de la biblioteca (un solo paso) entra con `{ irA: m.id }`, para que ese
  paso no salga cerrado.
- El punto 9 de la fila (abrir el paso con error al guardar) no tiene hoy a qué aplicarse: guardar
  no da ningún error por paso (un paso vacío se descarta sin avisar).
- Tres pruebas viejas (`preguntas-anidadas`, `documentos-desde-el-hito`) daban por hecho que los
  pasos nacían abiertos: ahora abren la línea antes de escribir.

Versión `App.VERSION`: `24-sep-2026 · 12:04`.

## 24-sep-2026 — Fila 121: el aviso de versión nueva de la copia, que no se pierda

`docs/AVISO-DE-VERSION-SEGURO.md`. La copia sin internet de Francisco se quedó en la versión de las
07:35 con la de las 10:44 ya publicada, sin ningún aviso a la vista: cuando la copia no puede leer
`version.json` de GitHub, solo salía un aviso de una línea que se borraba a los 4,5 segundos. Se
puso al día a mano con `ABRIR EL GESTOR.html`.

- Ahora, si no puede comprobarlo, la franja fija de arriba, con «Cómo actualizar a mano» (los
  pasos de `docs/INSTALAR-COPIA.md`). Cerrada, no vuelve a salir en esa ventana.
- Con la aplicación abierta, vuelve a mirar cada 30 minutos. Decisión: esa vuelta nunca se
  actualiza ni recarga sola (se perdería lo que se está escribiendo): solo la franja con
  «Actualizar ahora».

Versión `App.VERSION`: `24-sep-2026 · 11:23`.

## 24-sep-2026 — Fila 120: el guion de la guía, desde el hito

`docs/GUION-DESDE-EL-HITO.md`. Francisco quería completar las guías tramitando, sin irse a Ajustes.
En la mesa del hito, «+ Añadir un paso a la guía del tipo» (además del de «solo para este asunto»):
la línea va al final del guion del paso de la guía y sale en todos los asuntos de ese tipo, porque
`Hitos.guionDe` ya lee el paso en vivo. Detalle en `docs/contexto/HITO-MESA.md` («El guion»).

- `GuiasDelCentro.cambiarPasos(tipo, fn)` (nuevo, `js/guias-enganche.js`): relee `guias.json`,
  cambia una copia y guarda por `guardarPasos`, para no pisar lo que el otro ordenador haya
  escrito entretanto en la guía.
- No sale en un hito añadido a mano, en uno cuyo paso ya no está en la guía, ni en un paso-pregunta.
  La biblioteca de hitos no se toca.

Versión publicada `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 119: adónde lleva la aplicación después de cada acción

`docs/TRAS-CADA-ACCION.md`. Casi nunca dejaba en lo que se acababa de tocar. Ahora crear, reabrir y
editar dejan en la ficha; «Volver» regresa a la pantalla de la que se vino (y a la misma altura de
la lista); cuando lo lógico es quedarse, el aviso trae «Ir al asunto». Detalle en
`docs/contexto/PANTALLA.md`.

- Fichero nuevo `js/navegacion.js` (un solo nivel de memoria, sin pila de historial).
  `U.aviso` admite un tercer parámetro con el botón.
- Cambio de una regla anterior (filas 30 y 93, «de la ficha solo se sale al Volver, Editar,
  Archivar/Reabrir o Borrar»): Editar y Reabrir ya no sacan de la ficha. Se actualizaron
  `pruebas/quedarse-en-el-asunto.mjs` y once pruebas más que, tras crear un asunto, esperaban la
  lista; ahora abren la ficha y vuelven.
- Decisión: «Crear los que tocan» solo abre la ficha si tocaba uno; con varios, nada. El aviso de
  «Meter aquí» sale al cerrar el cuadro de ponerle nombre, no antes, para que el botón no quede
  debajo del cuadro.
- «Abrir el que ya existe» de un duplicado archivado abre su ficha (se expuso
  `OtrosDelTercero.montarArchivado`).

Versión publicada `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 118: los pasos nuevos de una guía llegan a los asuntos abiertos

`docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md`. Francisco añadió pasos a la guía de un tipo desde la
ficha de un asunto y, al volver, no estaban: los hitos se copiaban de la guía una sola vez, al
abrir la ficha por primera vez. Detalle en `docs/contexto/HITOS-Y-GUIAS.md`.

- Fichero nuevo `js/hitos-sincronizar.js` (`js/hitos.js` ya pasaba de 400 líneas). Al guardar la
  guía, una sola escritura de `hitos.json` para todos los asuntos abiertos de ese tipo con hitos;
  al pintar la ficha, la misma cuenta como red de seguridad (es el caso del asunto de Francisco,
  que cambió la guía antes de esta fila).
- Decisión: nada existente se toca, se reordena ni se borra; un paso quitado de la guía sigue en
  los asuntos; el ARCHIVO no cambia.
- `pasosConocidos` en cada asunto: lo completa `Hitos.leer` en cada lectura con los `origenGuia`
  que haya, en vez de rellenarlo solo al crear. Así cualquier escritura lo guarda (también
  «quitar a mano», el cambio de tipo o una fusión), y un hito quitado a mano no vuelve ni en los
  asuntos de antes de esta fila. Un paso podado al cambiar de rama antes de esta fila sí puede
  volver, pero dentro de la rama no elegida, donde no se ve.
- El segundo `catch` de `escribirGuia` decía «No he podido guardarla» aunque la guía ya estaba
  guardada (fallaba el repintado): ahora es ámbar.

Versión `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 117: el envío de correo con la aplicación web publicada

`docs/ENVIO-CUENTA-DEL-SCRIPT.md`. Francisco conectó el envío de la fila 115 con la cuenta del
centro y salieron tres fallos, uno detrás de otro:

- `prepararEnvio()`, ejecutado desde el editor, da con `getUrl()` la dirección `/dev` (la de
  pruebas de «head»), que solo funciona con la sesión del dueño: «Probar» daba `Failed to fetch`.
  Cambiarla a `/exec` a mano tampoco vale (el id corto es el de «head»: Google pide iniciar
  sesión). Ahora `prepararEnvio()` da solo la clave y dice que la URL se copia de «Gestionar
  implementaciones», y la aplicación rechaza una `/dev` o una sin `?k=` sin llamar a Google.
- Con la `/exec` buena llegaba, pero «No hay ningún destinatario»: con acceso «Cualquier
  usuario», `Session.getActiveUser()` viene vacía. Todo el script usa ya `miCorreo()`
  (`getEffectiveUser()`, la cuenta que ejecuta).
- Fuera la nota de «Cualquier usuario de la organización»: con esa opción Google pide iniciar
  sesión y la llamada desde el navegador falla siempre.
- Nuevo paso fijo al actualizar el script: «Gestionar implementaciones → lápiz → Nueva versión →
  Implementar», para conservar la misma dirección.
- Sigue sin poderse enviar un correo real desde aquí (no hay cuenta de Google): lo comprueba
  Francisco con «Probar».

Versión `App.VERSION`: `24-sep-2026 · 10:44`.

## 24-sep-2026 — Fila 63: publicar solo la aplicación

`docs/PUBLICAR-SOLO-LA-APP.md`. Estaba BLOQUEADA porque ninguna sesión podía comprobar desde fuera si
Vercel publicaba la documentación. Francisco abrió `https://asuntos.fmargon.com/docs/COLA.md` y se
veía el texto entero, con las filas bloqueadas: confirmado.

- `.vercelignore` en la raíz: `docs/`, `pruebas/`, `plantilla/`, `apps-script/`, `herramientas/`,
  `.github/`, `README.md`, `package.json` y `package-lock.json`. La aplicación no lee nada de ahí
  (la copia sin internet se actualiza desde GitHub, no desde la web).
- Decisión: `scripts/` se queda publicado. De ahí sale el `ignoreCommand` que evita gastar
  publicaciones con cambios solo de documentación (fila 48), y desde aquí no se puede probar si le
  afectaría; no tiene nada que tapar.
- El autónomo real que salía de ejemplo (una papelería, con su nombre y NIF) se cambió por uno
  inventado en `docs/PAPELERA.md`, `docs/HISTORIA-ANTERIOR.md`, `js/datos.js` y `pruebas/empresas.mjs`.
- Queda por comprobar ya publicado: que `docs/COLA.md` da error, que la aplicación entra, y que el
  siguiente cambio solo de `docs/` no publica. Lo del panel de Vercel (Analytics, registros) sigue
  pendiente de que Francisco lo mire.

Versión publicada `App.VERSION`: `24-sep-2026 · 07:35`.

## 24-sep-2026 — Fila 116: preguntas dentro del guion de un hito

`docs/PREGUNTAS-EN-EL-GUION.md`. Dentro de un mismo hito, lo que hay que hacer a menudo depende de
una respuesta («¿Viene con toda la documentación?» → «Pedir que la complete»). Ahora una línea del