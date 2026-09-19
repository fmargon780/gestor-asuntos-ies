# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 19-sep-2026 — Fila 65: documentos que quepan en una subida

Arregla el método, no el código (`docs/DOCUMENTOS-QUE-QUEPAN.md`, partes 3.3 y 3.4 del informe
crítico): `docs/CONTEXTO.md` (244 KB) y `docs/HISTORIA.md` (233 KB) habían roto ya tres subidas
(un `PLACEHOLDER_WILL_REPLACE`, un fichero cortado a la mitad, y las filas 53-56 sin documentar
por no caber). Las reglas 10-14 de `docs/COLA.md` pedían "ten más cuidado"; eso no arregla nada
si depende de que una sesión se acuerde.

**`docs/CONTEXTO.md` partido por módulos**: se queda como índice, reglas comunes de código y la
sección de qué falta/qué está descartado (29,6 KB). El resto —sección 1, "Cómo funciona la
aplicación"— se reparte por zona en `docs/contexto/`: `ASUNTOS.md`, `PERSONAS.md`,
`DOCUMENTOS.md`, `DOCUMENTOS-PDF.md` (separado de `DOCUMENTOS.md` porque juntos pasaban de 40 KB),
`CORREO-Y-SENECA.md`, `HITOS-Y-GUIAS.md`, `CAMPOS-Y-TIPOS.md`, `PANTALLA.md` y
`FICHEROS-DEL-REPOSITORIO.md` (la tabla de ficheros, que sola pesaba 22,7 KB). Ninguno pasa de
39 KB. La partición se hizo con un script (`/tmp/split_contexto.py`, no forma parte del
repositorio) que corta por rango de líneas exacto y verifica que la suma de bytes de todos los
trozos coincide con la del original: **no se ha resumido ni reescrito ni una frase**, solo
movido. Dos paréntesis explicativos se corrigieron de paso (la dirección publicada, que ya era
`https://asuntos.fmargon.com` y no `vercel.app`, en dos sitios de la sección 1).

**`docs/HISTORIA.md` cortado por fecha**: se queda con las entradas del 18 y 19 de septiembre
(28 KB); todo lo anterior (17-sep hacia atrás, más el "Diario heredado" de antes del reparto del
12-sep) se movió tal cual a `docs/HISTORIA-ANTERIOR.md` (201 KB, no se vuelve a tocar). De paso se
corrigió un descuido de esta misma sesión: las entradas de las filas 61 y 62 se habían añadido al
final del fichero con `cat >>` en vez de arriba, rompiendo el orden "lo nuevo primero"; quedan ya
en su sitio.

**Las reglas de la cola, cambiadas** (`docs/COLA.md`): la regla 8 ahora solo obliga a subir
`docs/CONTEXTO-CORTO.md` en la misma subida que el código; `docs/CONTEXTO.md`, sus hijos y
`docs/HISTORIA.md` pueden ir en una subida aparte (la regla 13 pasa de dos a **tres** subidas por
fila, la tercera sin gastar publicación de Vercel porque solo toca `docs/`). Las reglas 9, 11 y 12
añaden que un documento de más de 40.000 caracteres se parte, no se reescribe con cuidado.

**`docs/CONTEXTO-CORTO.md` podado**: el tope pasa de 160 líneas a **14.000 caracteres** (un tope
de líneas no protegía de nada si las líneas podían medir lo que quisieran: la sección "Qué está
hecho" tenía líneas de más de 1.300 caracteres). Esa sección se reescribió a una línea por cosa,
sin números de fila ni fechas (quedan en `HISTORIA.md` y en el documento de cada fila); de
18.861 caracteres el documento entero baja a 13.093.

**Cómo se comprobó** (esta fila no tiene prueba automática, per el propio encargo): a mano,
tamaño de cada documento nuevo (todos por debajo de 40 KB salvo `HISTORIA-ANTERIOR.md`, que no se
vuelve a tocar), suma de bytes de los trozos de `CONTEXTO.md` contra el original (243.638 bytes
en ambos lados), y `npm test` en verde sin que le tocara nada.

## 19-sep-2026 — Fila 61: guardar sin pisar al compañero

Arreglo del fallo grave 1 del informe crítico (`docs/INFORME-CRITICO-2026-09-18.md`, 2.2):
`js/papelera.js` tenía los dos únicos sitios que escribían `asuntos.json` entero sin releerlo
antes: `mandarAsunto` (borrar un asunto abierto) y `devolverAsunto` (sacarlo de la papelera). Con
la copia en memoria de este ordenador desactualizada durante horas (la pantalla de abiertos nunca
la refresca sola), borrar o devolver un asunto podía escribir encima de notas, estados o plazos
que el compañero hubiera guardado desde el otro ordenador, sin aviso ni error.

**El arreglo**: `App.guardarRegistroFresco(cambiar)`, nueva en `js/nucleo.js`, junto a `App.anotar`
(que ahora se apoya en ella). Relee `asuntos.json` del disco, deja que `cambiar(registro)` mute lo
que haga falta sobre esa copia recién leída, guarda con `Copias.guardar` y repinta con
`App.refrescarFichas()`. Es el mismo patrón que ya usaba `Hitos.cambiar` en `js/hitos.js`.

`mandarAsunto` y `devolverAsunto` pasan ahora por ahí, con la relectura pegada al momento de
escribir (después de mover la carpeta, no al principio de la función, porque el traslado puede
tardar segundos). `mandarAsunto` tenía además una segunda trampa: guardaba en la papelera la ficha
vieja que traía el objeto `a` en vez de releer la fresca de `App.E.registro` — con eso, al devolver
el asunto se habría perdido lo mismo por el otro lado. Se corrigió cogiendo la ficha de la copia
recién releída antes de archivarla.

Los otros ocho sitios que escriben el registro entero (`js/unir-asuntos.js`,
`js/fichas-huerfanas.js` ×2, `js/ajustes-centro.js`, `js/asuntos-editar.js` ×2, y el propio
`App.anotar`) ya releían antes de escribir, así que pasarlos por `guardarRegistroFresco` no les
cambia el comportamiento; solo cierra la puerta a que alguien añada un tercer sitio que escriba
directo. `js/conflictos.js` se queda como estaba a propósito: fusiona una copia en conflicto de
Dropbox que ya se acaba de leer dos líneas antes.

**La prueba** (`pruebas/guardar-sin-pisar.mjs`) es la primera de la cola que carga `nucleo.js` y
`papelera.js` de verdad en un contexto `vm` sin navegador, ampliando el patrón de
`pruebas/archivar-fusion.mjs`: hace falta un `document` de mentira mínimo (solo
`getElementById`/`querySelectorAll`, porque `nucleo.js` engancha `onclick` a unos pocos botones al
cargarse) y un `window` que sea el propio contexto (`window === global`, como en un navegador de
verdad), con un `Gestor` de mentira encima de `App.E` en vez de cargar `js/puente.js` entero. Monta
dos asuntos, A y B; simula al compañero escribiendo notas nuevas directamente en el fichero del
disco (sin pasar por `App.E.registro`) mientras este ordenador tiene la copia vieja en memoria; y
comprueba que mandar A a la papelera y devolverlo no se llevan por delante lo que el compañero
había guardado en B, ni archivan una versión vieja de la ficha de A. Comprobado a mano que la
prueba falla sin el arreglo (revirtiendo `js/nucleo.js` y `js/papelera.js`) y pasa con él.

## 19-sep-2026 — Fila 62: renombrar un asunto sin perder sus hitos

Arreglo del fallo grave 2 del informe crítico (`docs/INFORME-CRITICO-2026-09-18.md`, 2.3): el
nombre de la carpeta de un asunto es la clave con la que se guardan tres cosas, en tres ficheros
distintos (`asuntos.json`, `hitos.json` y `presencia.json`). Renombrar un asunto solo movía la
ficha; los hitos (fecha límite, responsable, historial, documentos apuntados, lo reunido) se
quedaban bajo el nombre viejo, y como `crearSiToca` (`js/hitos-panel.js`) ve que el asunto "no
tiene hitos" y los vuelve a crear desde la guía, la pérdida no daba ningún error: solo salían
hitos en blanco donde antes había un historial.

**El arreglo**: `js/asunto-renombrar.js` (nuevo), con `AsuntoRenombrar.mover(claveVieja,
claveNueva, datosExtra)` como único sitio que mueve la ficha, los hitos y la señal de presencia a
la vez. Si el destino ya tenía hitos (unir dos asuntos, o enlazar una huérfana con una carpeta que
ya los tenía), se fusionan por identificador en vez de pisarse, reutilizando
`Conflictos.unirPorId` (ahora exportado en `window.Conflictos`, antes solo interno de
`js/conflictos.js`) — el mismo problema que fusionar una copia en conflicto de Dropbox.
`AsuntoRenombrar.fusionar(claveQueda, claveVa)` cubre el caso de unir asuntos (la ficha la sigue
fundiendo `js/unir-asuntos.js` con sus propias reglas de notas/pasosHechos/pasosElegidos; aquí
solo se mueven hitos y presencia). `AsuntoRenombrar.quitar(clave)` y `.restaurar(clave, hitos)`
cubren el borrado y la devolución desde la papelera: los hitos viajan ahora dentro de la propia
ficha de `papelera.json` (campo `hitos`, junto a `datos`).

Los cuatro caminos que renombran un asunto y el quinto que lo borra pasan todos por ahí:
`App.editarAsunto` y `App.renombrarAsuntosAbiertosDelTercero` (`js/asuntos-editar.js`),
`fusionarFicha` (`js/unir-asuntos.js`), `enlazar` (`js/fichas-huerfanas.js`) y `mandarAsunto`/
`devolverAsunto` (`js/papelera.js`). Ninguno vuelve a tocar `App.E.registro.asuntos`, `Hitos` o
`Presencia` por su cuenta para esto. De paso, `App.renombrarAsuntosAbiertosDelTercero` se
simplificó: ya no hace falta envolver el bucle en `App.guardarRegistroFresco` a mano, porque cada
llamada a `AsuntoRenombrar.mover` relee y guarda fresco por su cuenta.

`js/presencia.js` gana `mover(claveVieja, claveNueva)` y `borrarClave(clave)`, hermanas de la
`quitar(clave)` que ya existía (esa solo quita la señal propia; las nuevas mueven o quitan
cualquiera, para el renombrado y el borrado). Nuevo también un bloque de Ajustes → Mantenimiento,
"Hitos huérfanos" (`App.pintarHitosHuerfanos`, dentro del propio `js/asunto-renombrar.js`), que
cuenta las entradas de `hitos.json` que ya no corresponden a ningún asunto abierto ni archivado
—rastro de renombrados de antes de este arreglo— y deja borrarlas con confirmación, sin adivinar
a qué asunto pertenecían.

**La prueba** (`pruebas/renombrar-asunto.mjs`), sin navegador, amplía el patrón de
`pruebas/guardar-sin-pisar.mjs` cargando también `js/conflictos.js`, `js/presencia.js` y
`js/hitos.js` en el contexto `vm`. Prueba `AsuntoRenombrar` directamente (mover, fusionar en un
destino que ya tenía hitos, unir dos asuntos, enlazar una huérfana, borrar y devolver desde la
papelera, mover la señal de presencia, y detectar hitos huérfanos) con un hito "rico" que lleva
las seis cosas que el informe decía que se perdían. Los cuatro caminos de la aplicación en sí
(`App.editarAsunto` y compañía) no se prueban de extremo a extremo sin navegador porque todos
abren antes un `U.preguntar`, que necesita un DOM de verdad para contestar; la batería completa de
Playwright (`huerfanas.mjs`, `papelera.mjs`) sigue en verde tras el cambio, confirmando que los
envoltorios finos sobre `AsuntoRenombrar` no rompieron nada del camino ya cubierto. Comprobado a
mano que la prueba falla (7 comprobaciones) si se desactiva la migración de hitos y presencia
dentro de `AsuntoRenombrar.mover`, y pasa entera con el arreglo puesto.
## 18-sep-2026 — Comunicar desde el hito

Fila 60 de la cola (`docs/COLA.md`, `docs/COMUNICAR-DESDE-EL-HITO.md`): la plantilla de correo y de
Séneca era del tipo de asunto entero, una sola para todo el trámite, aunque pedir un papel al
principio y avisar de una resolución al final no se parecen en nada — y para comunicar algo de un
hito había que subir a la cabecera de la ficha aunque el texto que tocaba estuviera ahí delante.

- **En la guía**: cada paso (o subpaso, dentro de una opción) puede llevar su propio texto de
  correo y/o de Séneca — asunto y cuerpo, cada uno con "Insertar hueco" —, en una sección plegable
  "Comunicación de este paso" del editor, con dos pestañas (Correo/Mensaje de Séneca). Vive en
  `js/guias-comunicacion.js` (nuevo), reutilizando el mismo campo de texto con hueco que ya tenía
  el cuadro de una plantilla (`js/plantillas-ajustes.js`, sacado a una función aparte para eso: "no
  escribas un editor nuevo"). La plantilla general del tipo no se toca: sigue siendo la que usa el
  "Comunicar" de la cabecera.
- **En el hito**: no se guarda ninguna copia del texto en `hitos.json` — se lee de la guía de su
  tipo por `origenGuia` en el momento de pulsar el botón, así que si Francisco cambia el texto del
  paso, los asuntos vivos usan el nuevo directamente. El botón "Comunicar" solo sale si su paso
  tiene texto; con los dos canales, abre el mismo menú pequeño de la cabecera; con uno solo, va
  directo. El destinatario se propone según el responsable del hito: el tutor legal (1, o el 2 si
  el 1 no tiene datos) si es `tutor`; todos los relacionados con correo si es `relacionado`; el
  tercero del asunto en cualquier otro caso. En Séneca no hay forma de marcar un usuario IdEA
  concreto desde aquí: el cuadro se abre con la lista de siempre, sin bloquear el botón por eso.
- **Reutilizado, no reinventado**: el cuadro de Correo/Séneca que abre "Comunicar" es el de
  siempre (`js/correo.js`, `js/seneca-cuadro.js`, `js/correo-cuadro.js`), con el mensaje ya resuelto
  puesto encima (mismo mecanismo que "Pedir lo que falta" de la fila 59: `abrirCuadro(a, deSeneca,
  extra)`); y la constancia —una nota en el asunto y una línea en el historial del hito, una sola
  vez— reutiliza el cerrojo `yaApuntado` que ya tenía `apuntarElRastro` desde antes de esta fila,
  no uno nuevo. Todo lo propio del hito (leer la guía por `origenGuia`, resolver el destinatario)
  vive en `js/hitos-comunicar.js` (nuevo), enganchado a `window.Hitos` como `js/hitos-archivo.js`
  aunque no guarda nada en el hito.

Simplificación anotada: con varios relacionados, se proponen todos los que tengan correo (unidos
por comas, en "Otro correo"); no hay forma de elegir solo alguno desde aquí. Si hace falta más
adelante, se retoca.

Prueba nueva, sin navegador: `pruebas/comunicar-desde-hito.mjs` (sustituye `CorreoNucleo.abrirCuadro`
por uno que solo apunta con qué se le ha llamado: abrir el cuadro de verdad monta un `U.preguntar`
con el DOM entero, que no tiene sentido simular sin navegador).

**Trampa encontrada probando en el navegador de verdad** (no la coge ninguna prueba sin navegador):
"+ Añadir"/quitar/mover una fila de "Lo que hay que reunir" o escribir en "Comunicación de este
paso" hace `recoger(); mutar; pintar()` del paso ENTERO (`js/guias.js`), que reconstruye el
`<details>` desde cero — y un `<details>` recién creado nace cerrado, así que la sección se le
cerraba sola a Francisco justo después de tocarla. `pintar()` ahora apunta, antes de vaciar
`#guia-pasos`, qué `<details>` (de `.paso-extra`, `.paso-requisitos` o `.paso-comunicacion`, de un
paso o de un subpaso) estaban abiertos, con la posición del paso más el id del subpaso como clave
(`detallesAbiertos`/`restaurarAbierto`), y los vuelve a abrir al repintar. De paso arregla lo mismo
que ya le pasaba a `.paso-extra` (responsable/estado/plazo), que tenía la misma trampa desde antes
de esta fila.

## 18-sep-2026 — Lo que hay que reunir en cada hito

Fila 59 de la cola (`docs/COLA.md`, `docs/REQUISITOS-DE-HITO.md`): un hito dice qué hay que hacer,
quién y para cuándo, pero no qué papeles hay que reunir o qué datos pedir; eso vivía en la cabeza
de Francisco. Ahora cada paso del trámite de un tipo puede llevar una lista opcional de casillas
("lo que hay que reunir"), cada una un **documento** o un **dato**, obligatoria o no.

- **En la guía** (Ajustes › Tipos de asunto › un tipo › Pasos del trámite): dentro del editor de
  cada paso, una sección plegable "Lo que hay que reunir" — texto libre, Documento/Dato,
  Obligatorio, quitar y mover. Vive aparte, en `js/guias-requisitos.js` (nuevo), para no engordar
  `js/guias.js`. Los pasos de dentro de una opción de una pregunta también pueden llevar su propia
  lista; el paso-pregunta en sí, no (se resuelve eligiendo una opción, no con una casilla).
- **En el hito**: al crearse desde la guía, cada paso copia sus requisitos, sin marcar. En la
  ficha, debajo del cuerpo del hito y encima de sus documentos, un bloque con la cuenta de lo que
  falta; marcar una de clase dato pide un valor pequeño (puede quedar en blanco), que se guarda al
  salir del campo o con Intro; el de clase documento se marca **solo** al apuntar el documento que
  corresponde (con una única casilla pendiente; con varias, se pregunta con cuál). Cada fila tiene
  su menú de tres puntos (Editar el texto / Quitar de este asunto), y "+ Añadir algo que falte"
  añade una casilla solo a este asunto, sin tocar la guía del tipo. Si el tipo gana requisitos
  después de que el hito ya existiera, una línea discreta ofrece traerlos.
- **No bloquea, avisa**: dar un hito por hecho con algo obligatorio sin reunir pregunta primero
  (`Hitos.faltanObligatorios`); si Francisco sigue igual, se marca y se le apunta una nota
  automática. Nunca se le impide avanzar.
- **"Pedir lo que falta"**: un botón en el bloque, visible solo si queda algo sin marcar, abre el
  mismo menú "Comunicar" de la cabecera de la ficha (Correo/Séneca) — no un camino nuevo — con la
  lista de lo pendiente ya lista para pegar. Entra por un hueco de plantilla nuevo,
  `{{LO QUE FALTA}}` (con dos llaves a propósito, para que se note que no es un dato del asunto
  como los demás: se sustituye siempre, incluso por nada fuera de este camino, y nunca deja el
  hueco escrito); sin ese hueco en la plantilla, o sin plantilla, el texto se añade al final. Todo
  esto vive en `js/hitos-requisitos.js` (nuevo, modelo y pintura en un solo fichero, como pide el
  encargo), enganchado a `window.Hitos` igual que `js/hitos-archivo.js`.

Trampa evitada: nada de esto toca `Hitos.marcar` ni la firma de las funciones que ya existían —
todo entra por fichero nuevo o por una llamada añadida donde tocaba (`js/hitos-documentos.js` al
apuntar/quitar un documento, `js/hitos-panel-lista.js` antes de pasar a hecho, `js/correo.js` para
reutilizar el menú "Comunicar" en vez de duplicarlo).

Prueba nueva, sin navegador (con un disco de mentira en memoria, como `pruebas/logica.mjs`):
`pruebas/requisitos-de-hito.mjs`.

## 18-sep-2026 — Seis arreglos de uso diario

Fila 58 de la cola (`docs/COLA.md`, `docs/AJUSTES-DE-USO-2026-09-18.md`), seis puntos sueltos
pedidos por Francisco tras un día de uso real:

1. **La fila de copiar de un gesto** (`js/ficha-nombre-acciones.js`, `ponerFilaDeCopiar`): debajo
   del nombre del asunto, siempre a la vista y sin menú, cuatro botones — Asunto, NIE, Nombre y
   DNI/CIF (CIF en empresas) — cada uno con el mismo copiado de siempre. "Copiar el nombre del
   asunto" sale del menú de tres puntos (ya no hace falta). Nombre y DNI/CIF tardan (piden el
   tercero) y se reservan `hidden` desde el primer pintado; "revelar" solo les quita `hidden`,
   nunca añade un nodo nuevo — ver el punto 6.
2. **"Preparar el documento" pasa a llamarse "Ajustar tamaño"**, en el botón y en el título del
   cuadro; el mecanismo (fila 57) no cambia.
3. **La caja de escribir una nota no guarda al teclear**, solo al pulsar Guardar o al perder el
   foco; y si se sale de la ficha con algo sin guardar, avisa y ofrece "Guardar y salir"
   (`Notas.confirmarSalirDeFicha`).
4. **El documento sellado que sustituye a uno de Por clasificar ya no manda el original a la
   papelera**: lo renombra a "… SIN SELLAR" y lo conserva en la carpeta (`js/registro-sellado.js`).
5. **Cada documento de la ficha se puede asociar a un hito a mano** ("Asociar a un hito", con la
   etiqueta del hito ya asociado a la vista), aparte de la asociación automática al "Apuntar un
   documento" de un hito que ya existía.
6. **El cuadro de Correo se reparte en dos columnas**, como el de Séneca (fila 53): se saca su
   cuerpo propio a `js/correo-cuadro.js` (nuevo, mismo patrón que `js/seneca-cuadro.js`),
   `js/correo.js` se queda con la lógica compartida y con abrir/pintar el cuadro correcto.

**Dos carreras de datos de verdad, encontradas al pasar la batería completa** (no eran fallos de
las pruebas, sino del código):

- El botón "Nombre"/"DNI-CIF" del punto 1, al revelarse tarde, mutaba `#ficha-asunto-cuerpo`; el
  `MutationObserver` de `js/hitos-panel.js` escuchaba con `{childList:true, subtree:true}` y
  repintaba el panel de hitos por esa mutación ajena, colapsando un hito que el usuario tenía
  desplegado a medio escribir. Arreglado por dos lados: el patrón `hidden` del punto 1 (evita la
  mutación) y estrechar el observador a `{childList:true}` sin `subtree` (cada acción que de
  verdad cambia un hito ya llama a `HitosPanel.programarRepintado()` por su cuenta, comprobado a
  mano en `js/hitos-panel-lista.js`, `js/hitos-documentos.js` y `js/ficha-asunto.js`).
- Al salir de la ficha con una nota sin guardar (punto 3), el cuadro de aviso enfoca su primer
  campo y eso dispara un guardado por `blur` de la nota A LA VEZ que el "Guardar y salir" explícito
  del propio aviso. Con el cerrojo antiguo (un booleano) el segundo guardado veía el cerrojo
  puesto y se rendía sin esperar al primero, así que se podía salir antes de que el guardado
  llegase a disco. Arreglado cambiando `guardarBorrador` a una cola de promesas encadenadas:
  esperar cualquier guardado espera ahora a toda la cola, incluido uno disparado a la vez.

Pruebas: `pruebas/copiar-fila.mjs` y `pruebas/asociar-documento-a-hito.mjs` (nuevas),
`pruebas/notas-asunto-no-se-borran.mjs` y `pruebas/cabecera-del-asunto.mjs` (revisadas a fondo);
de paso se corrigió `pruebas/plantillas.mjs`, que apuntaba a ids del cuadro de Séneca de antes de
la fila 53 (ya señalado como pendiente en una revisión anterior, y bloqueaba tener la batería en
verde para esta fila).

## 18-sep-2026 — Hueco para el sello de Séneca y la firma del director

Fila 57 de la cola (`docs/COLA.md`, `docs/HUECO-PARA-SELLO-Y-FIRMA.md`), acordada con Francisco el
18-sep-2026 mirando la cabecera de un asunto de CERT. MATRICULA. El sello que Séneca pinta al
registrar a mano (banda estrecha arriba, a la derecha si es entrada y a la izquierda si es salida)
a veces pisa texto del documento; lo mismo pasa abajo con la banda de firma digital del director.
Botón nuevo **Preparar el documento**, junto a Separar, Unir y Sacar páginas: encoge el contenido
de todas las páginas y lo recoloca para dejar libres las dos bandas, de lado a lado de la hoja.

**La cuenta, en `js/pdf-margenes.js`** (sin DOM, como `js/pdf-herramientas.js`): `calcularEncaje`
hace la regla de tres del encargo (escala nunca mayor que 1, ni negativa; `cabe` falso si los dos
huecos juntos pasan de la mitad del alto); `conHueco` valida TODAS las páginas antes de escribir
nada (si una no cabe, no se toca ni una).

**Lo que costó de verdad: las páginas giradas.** `getSize()` de pdf-lib no tiene en cuenta el
`/Rotate` de la página (se comprobó leyendo el propio bundle minificado,
`js/lib/pdf-lib.min.js`: `getSize` lee el `MediaBox` a secas), y `embedPage` tampoco — su
`width`/`height` también salen del `MediaBox` crudo. Así que la escala y el hueco se calculan
sobre el tamaño VISIBLE (con ancho y alto intercambiados si el giro es de 90° o 270°), pero el
contenido se sigue dibujando en el sistema de coordenadas CRUDO de la página, sin deshacerle el
giro: la hoja nueva se crea con el mismo tamaño crudo y el mismo `/Rotate` que la original, y solo
cambia dónde y a qué escala se dibuja el contenido dentro de ese sistema. Así no hace falta saber
cómo compone `drawPage` su propio parámetro `rotate` (con su propio pivote y su propio sentido de
giro, que no coincide con el de `/Rotate`): el visor ya sabe rotar una página entera, y basta con
que el contenido encogido caiga en el sitio correcto de esa página sin rotar mentalmente nada. La
fórmula que traduce la esquina visible ya calculada a la esquina cruda donde dibujar
(`posicionCruda`, un caso por cada uno de los cuatro giros) se dedujo a mano, dos veces por
caminos distintos para el caso de 90° (una vez pensando en la hoja de papel física que se gira, y
otra resolviendo las cuatro esquinas del rectángulo de contenido con álgebra), y las dos
coincidieron. Se comprueba en la prueba con una tercera página girada 90° dentro del mismo PDF:
`conHueco` tiene que conservar su tamaño crudo y su giro tal cual (no hay forma barata de
comprobar en Node, sin `canvas`, que el contenido cae exactamente en el píxel correcto; eso
tendrá que verlo Francisco con un documento girado de verdad).

**Saber si ya hay sitio, sin abrir el cuadro para nada**: con pdf.js (que sí aplica el giro solo al
pintar en un `<canvas>`), se renderiza cada página a 700px de ancho y se mira si más del 0,3% de
los píxeles de cada banda están por debajo de 200 de luminosidad. Si las dos bandas están libres en
todas las páginas, ni se abre el cuadro: un aviso verde y ya. Esto hace que el botón sea seguro de
pulsar "por si acaso": en un documento ya con sitio, no pasa nada.

**Lo configurable**: las dos medidas (1,5 cm arriba, 2,5 cm abajo por defecto) en Ajustes → El
centro, guardadas en `_GESTOR/margenes-pdf.json` (son solo dos números, sin fusión con el disco,
igual que "Datos del centro y firma"); y `tipo.llevaSello`/`tipo.llevaFirma`, dos interruptores en
`tipos.json` con un ayudante compartido nuevo (`App.construirInterruptorDeTipo`, en `js/ajustes.js`,
junto a `App.construirCasillaPlazo`), por defecto sí y no respectivamente, así que ningún tipo
existente necesita migración.

**Ficheros nuevos**: `js/pdf-margenes.js`, `js/preparar-documento.js`, `pruebas/margenes-pdf.mjs`.
El botón se cuelga desde `js/ficha-documentos.js` y `js/documentos-sueltos.js` (no desde
`js/pdf-separar-unir.js`, como decía el encargo: ahí es donde de verdad viven los otros tres
—Separar, Unir, Sacar páginas—, cada uno con su propio `enMenu.push(...)`, así que el nuevo se
cuelga igual, al lado). Se cambiaron también `js/ajustes-centro.js`, `js/ajustes-tipo.js`,
`js/ajustes.js`, `index.html` y `css/pdf-separar-unir.css`, para lo configurable, la vista previa y
el sitio del botón.

**Sesión en la nube**: sin `git push` de verdad ni permiso para tocar `main` directamente (ver la
nota de `docs/COLA.md` sobre "sube directamente a main"), así que esta fila se subió con pull
request en vez de directa, aunque el encargo pedía lo segundo.

Comprobado con `pruebas/margenes-pdf.mjs` (`calcularEncaje` en varios casos, `conHueco`
conservando páginas/tamaños/giro, una página sin sitio que no escribe nada, `pareceFirmado`).

---

## 18-sep-2026 — La cabecera se queda arriba, y se encoge

Fila 46 de la cola (`docs/COLA.md`, `docs/CABECERA-QUE-SE-QUEDA.md`), acordada con Francisco el
17-sep-2026: la última fila pendiente, y con ella la cola queda entera. El aviso, con sus
palabras: "Cuando navegamos hacia abajo en una vista, se suele perder la referencia superior. Esto
es muy evidente cuando estamos trabajando en un asunto vivo." Al bajar por la ficha de un asunto
largo, el nombre, el estado y el botón de volver se iban por arriba, y a partir de ahí se
trabajaba a ciegas.

**La solución: fijar la cabecera, pero encogida.** Fijarla entera se comía demasiado alto, así que
se queda pegada arriba (`position: sticky`) y se reduce a una sola línea al pasar de 80px de
scroll, con histéresis (no se despliega hasta bajar de 40px, para que no parpadee justo en el
límite). Un único mecanismo (`js/cabecera-fija.js` + `css/cabecera-fija.css`) para las siete
pantallas — ficha del asunto, asuntos abiertos (con "Por clasificar" dentro), archivo, personas y
empresas, ajustes, qué me toca y duplicados; la papelera vive dentro de ajustes y usa su cabecera
— en vez de siete parches sueltos.

**El primer diseño de la CSS estaba mal, y la propia prueba lo dijo.** La primera idea, muy
razonable sobre el papel, era: al encoger, quitar alto por un lado (título más pequeño) y añadir
un poco de relleno vertical (`padding`) para que la cabecera pegada no tocara el borde de la
ventana. Al medirlo con la prueba de navegador (mirando el alto real de la cabecera antes y
después de encogerse) resultó que la cabecera **crecía en vez de encoger**: el `padding` nuevo
pesaba más que lo que se ahorraba con el título más pequeño, sobre todo cuando el buscador y los
botones de la cabecera ya iban en dos líneas por falta de sitio (con el tablón de notas puesto al
lado, en una ventana no muy ancha — nada que ver con esta fila, pasa igual sin ella). El arreglo
fue quitar ese `padding` y, en su lugar, reducir el margen de abajo de la cabecera (18px/16px de
siempre → 6px encogida): lo que de verdad mueve el contenido de debajo no es el alto de la caja de
la cabecera, es el hueco que reserva alrededor.

**Medir "que no dé un salto" tampoco era tan directo como parecía.** La prueba original comparaba
la posición de un elemento de referencia antes y después de bajar, esperando que se moviera
exactamente "lo que se ha bajado, más lo que ha encogido la cabecera". El número nunca cuadraba
así — resultó que Chrome tiene **scroll anchoring**: si algo por encima de lo visible cambia de
alto a mitad de un scroll, el navegador ajusta `window.scrollY` por su cuenta para que el
contenido visible no dé un salto. Es exactamente lo que se quería conseguir, hecho ya por el propio
navegador. La prueba se corrigió para medir lo que de verdad importa: que el contenido se mueva
justo lo que se ha pedido bajar y ni un píxel más, sin mirar el valor final de `scrollY` (que
Chrome puede tocar por su cuenta, y eso no es ningún fallo).

**El caso especial: "Por clasificar".** Con un documento abierto en el panel de la derecha, la
cabecera encogida de Asuntos abiertos añade "Viendo: `<nombre>`" y un botón "Ir a su fila"
(`scrollIntoView` a la tarjeta ya marcada `.tarjeta-abierta`, que pone `js/documentos-sueltos.js`).
Lo hace `js/cabecera-fija.js` solo mirando esa tarjeta, sin tocar `js/documentos-sueltos.js` ni
`js/visor.js`, tal y como pedía el documento.

**Ajustes se queda con las pestañas visibles también.** Como su cabecera es solo el título
"Ajustes" (`index.html`), las pestañas "Tipos de asunto · El centro · Mantenimiento"
(`#pestanas-ajustes`) se dejaron pegadas por su cuenta, justo debajo, con una variable CSS
(`--cabecera-fija-alto`) que `js/cabecera-fija.js` mide y actualiza en cada repintado con el alto
real de la cabecera (encogida o no), para que no quede ni hueco ni solape entre las dos.

**El repintado de la ficha no pierde el estado.** `js/ficha-asunto.js` rehace su
`.ficha-cabecera` entera con `innerHTML` cada vez que pinta (por ejemplo, al cambiar el estado del
asunto), por encima sigue `U.conservandoLoEscrito` como siempre. En vez de tocar ese fichero (que
ya pasa de 400 líneas, como pedía el documento), `js/cabecera-fija.js` vigila con un único
`MutationObserver` sobre `<main class="contenido">`: si el nodo de la cabecera cambia, vuelve a
poner el estado encogido sin esperar al siguiente scroll. El mismo observador, mirando la clase
`oculto` de las pantallas, se entera también de los cambios de pantalla, sin engancharse a
`App.ir`.

Comprobado que `js/barra.js` (línea ~139, `#pantalla-abiertos .cabecera`) sigue colgando el botón
grande de "Nuevo asunto" sin problema. Prueba nueva `pruebas/cabecera-fija.mjs`, navegador de
verdad, con los siete puntos del encargo. Batería completa en verde (59 ficheros de prueba), una
sola pasada al final. Versión publicada `App.VERSION`: `18-sep-2026 · 00:31`. Con esta fila,
`docs/COLA.md` queda entera: no queda ninguna fila pendiente.

---

## Lo anterior al 18-sep-2026

Se ha movido a `docs/HISTORIA-ANTERIOR.md` (fila 65, 19-sep-2026), que no se vuelve a tocar.
