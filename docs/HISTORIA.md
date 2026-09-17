# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 17-sep-2026 — Apuntar un documento a un hito

Fila 31 de la cola (`docs/COLA.md`, `docs/APUNTAR-DOCUMENTO-A-HITO.md`), la mitad que le faltaba
a la fila 15: el modelo ya guardaba los documentos apuntados y la lista ya se pintaba con su ✕,
pero no había ninguna forma de apuntar uno. Botón nuevo "Apuntar un documento" en el cuerpo
desplegado de cada hito abierto, que abre `js/hitos-documentos.js` (nuevo, `window.HitosDocumentos`):
un cuadro con casillas sobre los documentos de la carpeta del asunto; al aceptar, llama a
`Hitos.anadirDocumento`/`quitarDocumento` (ya existían) y pide el repintado. El bloque de
documentos pasa a pintarse siempre que el asunto está abierto, aunque no haya ninguno apuntado
(antes solo salía si ya había uno, y por eso Francisco no encontraba por dónde empezar). Cada
nombre es pulsable y abre el documento en el panel de la derecha.

Dos trampas de verdad, encontradas probándolo en un navegador de verdad (no solo leyendo el
código):

- **Saber si un apuntado ya no está en la carpeta no se puede corregir después de pintar, a
  mano.** La primera versión leía `Carpetas.ficheros` en un `.then()` tras el repintado y tocaba
  el botón directamente; el `MutationObserver` de `js/hitos-panel.js` (vigila `#ficha-guia`)
  detectaba esa propia corrección como un cambio más y volvía a repintar, sin parar. Arreglado
  leyendo la carpeta **una vez por repintado**, en `js/hitos-panel.js`, antes de tocar el DOM, y
  pintando ya bien "(ya no está)" en el HTML de la primera pasada.
- **Nunca marcar ese botón con el atributo `disabled`.** `js/ficha-asunto.js`
  (`aplicarModoConsulta`) reactiva solo, sin preguntar por qué estaba apagado, todo lo que
  encuentre dentro de `#ficha-asunto-cuerpo` en cuanto no hay nadie en modo consulta: un botón
  "ya no está" con `disabled` se quedaba reactivado unos 30 ms después de cada repintado, siempre.
  Se resuelve sin ese atributo: solo la clase `hito-doc-falta` (en gris por CSS, sin engancharle
  ningún `onclick`).

Prueba nueva en `pruebas/hitos.mjs` (escenario 6, en navegador de verdad): apuntar, reabrir el
cuadro (sale marcado), desmarcar (desaparece), y un apuntado que ya no está en la carpeta sale en
gris con "(ya no está)", también dentro del propio cuadro de apuntar. Batería completa en verde.

## 17-sep-2026 — Quedarse en el asunto tras guardar un documento

Fila 30 de la cola (`docs/COLA.md`, `docs/QUEDARSE-EN-EL-ASUNTO.md`): "Tras guardar un documento
en un asunto, la aplicación nos expulsa fuera del asunto, a la lista de asuntos abiertos", con
palabras de Francisco. La causa no estaba en ninguna de las siete acciones que guardan un
documento (todas ya se quedaban en su sitio y refrescaban su propio trozo de la ficha), sino en
que `App.verAbiertos` relee la carpeta entera y crea asuntos nuevos cada vez que se llama —y se
llama sola, desde `App.mirarLaCarpeta`, cada `App.SEGUNDOS_ENTRE_MIRADAS`—: el asunto que tenía la
ficha en la mano se quedaba con un objeto viejo, y su lista de documentos no se enteraba de lo que
había llegado por el barrido automático (comprobado en vivo con un navegador de verdad: sin el
arreglo, un documento guardado mientras la ficha estaba abierta no aparecía en `#ficha-documentos`
hasta salir y volver a entrar).

`js/ficha-asunto.js` envuelve `App.verAbiertos` (mismo patrón que sus demás envolturas) para que
cualquier llamada —el barrido automático, el botón "Recargar", añadir un tipo que faltaba, meter
un suelto o un correo en un asunto— reenganche sola el asunto de la ficha abierta, por su nombre,
y la repinte en su sitio, con dos funciones públicas nuevas: `App.fichaAbierta()` (el nombre del
asunto que se ve de verdad, comprobando el DOM, no solo una variable que se queda puesta al
cambiar de pestaña sin pulsar "Volver") y `App.reengancharFicha()` (la reenganche, o vuelve a la
lista con un aviso si el asunto ya no está en absoluto). `anadirTipo` (que ya hacía este apaño a
mano) pasa a apoyarse en el mismo mecanismo, sin repetirlo. **Editar**, **Archivar/Reabrir** y
**Borrar** siguen siendo los únicos que de verdad vuelven a la lista.

Prueba nueva `pruebas/quedarse-en-el-asunto.mjs`, en navegador de verdad, con los cuatro
escenarios del encargo (comprobado que falla sin el arreglo: sin `App.fichaAbierta`, y sin que el
documento nuevo apareciera en la ficha). Batería completa en verde.

## 17-sep-2026 — Archivar cuando la carpeta ya existe en el destino

Fila 32 de la cola (`docs/COLA.md`, `docs/ARCHIVAR-CARPETA-YA-EXISTE.md`), la primera de la lista
porque le estaba bloqueando un asunto real ahora mismo: al archivar, Francisco recibía "Ya hay
una carpeta llamada ... en el destino" y ya no podía volver a intentarlo nunca.

La causa: `Carpetas.trasladar` crea la carpeta de destino y copia dentro; si la copia falla a
mitad (Dropbox sincronizando, un fichero bloqueado), esa carpeta se quedaba a medias, sin nadie
que la limpiara, y el siguiente intento se la encontraba y se paraba ahí, siempre. Ahora
`trasladar` limpia el destino a medias si algo falla, y se añade `Carpetas.fusionarEn` para
cuando el destino ya existe de verdad (de un archivado de antes de este arreglo): junta las dos
carpetas sin perder nada (mismo nombre y tamaño, no se duplica; mismo nombre y distinto tamaño,
se guarda al lado con "(2)"), y solo borra el origen si la comprobación final sale en verde.
`App.cerrarAsunto`/`App.reabrirAsunto` avisan en el propio cuadro de confirmación cuando toca
fusionar, con el mismo botón de siempre, sin preguntar nada más.

De paso, `js/documentos-sueltos.js` (pasaba de 400 líneas) suelta esas dos funciones a
`js/asuntos-archivar.js` nuevo, sin que `js/relacionados.js` ni `js/hitos-archivo.js` (que las
envuelven) hayan tenido que tocarse. Prueba nueva `pruebas/archivar-fusion.mjs`, sin navegador,
con los siete escenarios del encargo (comprobado que falla sin el arreglo). Batería completa en
verde.

## 17-sep-2026 — El DNI del personal, a la vista

Fila 29 de la cola (`docs/COLA.md`, `docs/DNI-DEL-PERSONAL.md`), acordada con Francisco el mismo
día. El dato ya estaba (`persona.documento`, de la columna `DNI/Pasaporte` de Séneca o de
`Documento` en `personal.csv`), pero `Datos.destacadosPersona` no lo subía a los destacados: caía
en `resto`, escondido detrás de "Ver los demás datos del fichero". Ahora sale la primera fila de
todas, por encima de `Puesto`, y ya no se repite abajo (misma comparación por valor que hace
`js/dni.js` con el alumnado). En la línea de debajo del nombre (`App.piePersona`,
`js/asuntos-nuevo.js`) ya se enseñaba el documento a secas, en medio de la línea; ahora sale
etiquetado ("DNI ...") y al final, después de "alta a mano" si toca. Sin aviso por edad: eso es
solo del alumnado, y `js/dni.js` no se ha tocado. Prueba nueva `pruebas/dni-personal.mjs`, sin
navegador, más los casos que se han tenido que corregir en `pruebas/logica.mjs` (los índices de
`destacados[]` se desplazan una posición al meter el DNI delante). Batería completa en verde.

## 17-sep-2026 — "Lo pide": quién ha pedido la gestión

Fila 28 de la cola (`docs/COLA.md`, `docs/LO-PIDE.md`), acordada con Francisco el mismo día. Nace
del problema real: se pide un certificado, pasan los días, y cuando está listo ya no se recuerda a
quién hay que contestar (el padre, la madre, el propio alumno...).

**Qué cambia.** Cada asunto puede guardar, si se quiere, quién lo pidió, por qué vía y en qué
fecha: clave nueva y opcional `loPide` en `_GESTOR/asuntos.json`, con `nombre`, `categoria`,
`relacion`, `correo`, `telefono`, `via`, `fecha` y `apuntadoPor`. Se apunta al crear el asunto
(grupo "Lo pide (opcional)" en `js/asuntos-nuevo.js`) o después, con el botón "Lo pide" de la
ficha (`js/ficha-asunto.js`), que también enseña una fila ("Lo pide", debajo de "Vía de
comunicación") y una marca en la cabecera cuando hay dato. En el cuadro de Correo
(`js/correo.js`), si se conoce el correo de quien lo pide, se marca su casilla sola (y se
desmarcan las demás); si no está en la lista, va a "Otro correo"; y sale una línea gris "Lo pidió
Fulano (relación), el día tal" encima de "Para". En Séneca, `aQuien` dice el nombre de quien lo
pide en vez del de siempre. Cuatro huecos nuevos de plantilla (`js/plantillas.js`):
`{quienlopide}`, `{quienlopiderelacion}`, `{quienlopidevia}`, `{quienlopidefecha}`.

**Toda la lógica, en un módulo nuevo.** `js/lo-pide.js` (`window.LoPide`) para no engordar
`js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`: `LoPide.opciones(persona)` ofrece
"El propio interesado", "Tutor legal 1/2" (solo alumnado, y solo si Séneca trae su nombre) y "Otra
persona…"; `LoPide.controles(caja, persona, valorInicial)` pinta esos controles (con clases, nunca
con id: el mismo módulo se monta a la vez en la pantalla de "Nuevo asunto", que queda en el
documento aunque escondida, y en el cuadro de la ficha, y dos elementos con el mismo id habrían
roto el segundo sitio); `LoPide.texto`/`LoPide.correoDe` leen el dato guardado. `datosDeTutor`
(antes privada de `js/plantillas.js`) se sacó aquí, pública, porque `LoPide.opciones` también la
necesita: `js/plantillas.js` ahora la llama en vez de tener su propia copia. La decisión de qué
casilla marcar en el cuadro de Correo también se sacó como función pura, `LoPide.elegirDestinatarios`,
para poder probarla sin cargar ese cuadro (no expone nada hacia fuera).

**El parentesco real (padre, madre, abuela) queda fuera**, a propósito: el RegAlum no trae esa
columna, así que la relación se enseña como "Tutor legal 1"/"Tutor legal 2", y solo con "Otra
persona…" se escribe a mano. Ya estaba anotado en "Lo que vendrá después" de `docs/COLA.md`.

Prueba nueva `pruebas/lo-pide.mjs`, sin navegador (jsdom), con los siete escenarios del encargo.
Batería completa en verde. No se ha tocado `js/conflictos.js`, `js/asuntos-editar.js`,
`js/papelera.js`, `js/asuntos-lista.js` ni `apps-script/gestor-correos.gs`.

## 17-sep-2026 — Las horas de `App.VERSION` iban por delante de la real

Francisco avisó: siendo las 09:13 de verdad, la aplicación decía `17-sep-2026 · 18:20`. La causa
no era código: `App.VERSION` es una línea que Claude Code escribe a mano cada vez que publica algo,
y en esta sesión se había ido subiendo el número a ojo (12:10 → 16:40 → 18:20) sin mirar ningún
reloj de verdad. El contenedor de esta sesión sí tiene la hora real de España
(`TZ='Europe/Madrid' date` da la hora correcta); el fallo era no usarla. Corregido a la hora real
(`09:15`) y dejada la receta exacta en un comentario de `js/version.js`, más el aviso en
`docs/CONTEXTO.md` y en la regla 4 de `docs/COLA.md`, para que no se repita.

## 17-sep-2026 — La bandeja de correos, dentro de "Por clasificar" y plegada

Fila 27 de la cola (`docs/COLA.md`, `docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md`), detrás de la 26.
No era una función nueva: la bandeja ya funcionaba, lo que molestaba a Francisco era que ocupara
la parte de arriba de la pantalla todo el rato, siempre desplegada, se trabajara con ella o no.

**Qué cambia.** La bandeja se ve solo dentro de "Por clasificar" (`#zona-clasificar`), encima de
la lista de documentos sueltos, detrás de una barra "Correos sin clasificar (N)" que se pliega y
despliega al pulsarla y que **siempre arranca plegada** al entrar en la vista, se dejara como se
dejara la última vez (sin memoria en `localStorage`, a propósito, y sin `<details>`: el mismo
patrón que el plegado de "Filtros"). El botón "Mirar ahora" se va dentro del bloque desplegado, y
desaparece la cabecera "Correos por convertir en asunto" con su cuenta: la sustituye la barra. La
lectura de correos sigue corriendo igual con el bloque plegado, y el número de la barra se
actualiza aunque no se esté mirando esa vista.

**Una trampa real, no solo teórica.** La caja de envíos (`#bandeja-envios`, "Borrador en camino")
se anclaba con `$('bandeja-correos') || paneles.nextSibling`: al dejar `#bandeja-correos` de ser
hermana de `.paneles` (ahora vive dentro de `#zona-clasificar`), esa línea habría intentado
`insertBefore` sobre un nodo que ya no es hijo directo del mismo padre. Se fijó explícitamente a
`paneles.nextSibling`, tal como pedía el encargo, y `pruebas/envios.mjs` lo confirma en verde.

**El reparto de ficheros.** `js/bandeja-correos.js` bajaba de 1.478 líneas: la parte de pantalla
(la barra, la caja, cada tarjeta, la línea de "ya guardado") pasa a `js/bandeja-pantalla.js`
nuevo, hablándose con el de siempre por `window.Bandeja`, al que se le han añadido las piezas que
le faltaban (leer el estado actual de `correos`, adivinar, guardar, mirar de nuevo, pedir permiso,
las utilidades de fecha e icono) sin renombrar ni quitar nada de lo que ya usaban
`js/bandeja-enlace.js` y `js/correo-adjuntos.js`.

**Pruebas**: `pruebas/correos.mjs` y `pruebas/correo-dos-buzones.mjs` ajustan su ayudante
`mirarLaBandeja()` para entrar en "Por clasificar" y desplegar la barra; se suma en
`pruebas/correos.mjs` una prueba de que la barra arranca plegada con el número ya al día, y de que
vuelve a plegarse sola al reentrar en la vista aunque se dejara abierta. `pruebas/envios.mjs` y
`pruebas/refresco.mjs` no necesitaban cambios. Batería completa en verde.

## 17-sep-2026 — Los hitos son la guía, no un añadido

Fila 26 de la cola (`docs/COLA.md`, `docs/HITOS-SON-LA-GUIA.md`). Corrige un malentendido de
diseño de la fila 15 (`docs/HITOS.md`): al ver el resultado en pantalla, Francisco dejó claro que
nunca quiso dos cosas — la guía como texto con casillas por un lado, y los hitos por otro. Quiso
una: los pasos de la guía SON los hitos.

**Qué cambia.** Al abrir la ficha de un asunto abierto cuyo tipo tiene guía y que todavía no
tiene hitos, estos se crean solos, importando lo que ya estuviera marcado en
`pasosHechos`/`pasosElegidos` si el asunto ya existía desde antes. Sin botón, sin preguntar. La
guía deja de pintarse como texto con casillas en la ficha: en su sitio queda la lista de hitos,
bajo el título "Hitos" (antes "Guía del procedimiento"). Se conserva el enlace de escribir o
cambiar la guía del tipo, al final del bloque. Desaparecen el botón "Crear los hitos de la guía"
y el bloque `#hitos-entrada`: si el tipo no tiene guía, el bloque "Hitos" sale vacío con
"+ Añadir el primer hito".

**La trampa de la doble creación.** El observador de `js/hitos-panel.js` repinta cada 30 ms y
crear los hitos es asíncrono (una lectura y una escritura); mirar solo si ya hay hitos no basta,
porque dos repintados pueden colarse antes de que la escritura anterior termine. Se ha añadido un
cerrojo por clave de asunto (`creandoDesdeGuia`). Al probarlo, salió una segunda carrera más sutil:
`modoActual` (si la ficha se abrió como abierta o archivada) se queda **fijo** desde que se abrió
la ficha, y archivar un asunto no vuelve a llamar a `App.abrirFicha`. Si algo repintaba la ficha
(la vigilancia de presencia, por ejemplo) justo mientras se archivaba, después de que
`hitos.json` ya se hubiera vaciado pero antes de salir de la pantalla, los hitos se recreaban
solos sobre un asunto que se estaba cerrando. Se comprueba también contra `App.E.registro`, que sí
se actualiza al momento, tratando "sin ficha en el registro todavía" (un asunto recién encontrado,
nunca anotado) como abierto: solo un `estado: 'cerrado'` explícito bloquea la creación.

**El reparto de ficheros.** `js/ficha-asunto.js` bajaba de 1.100 líneas al quitarle este cambio la
guía-con-casillas, pero se ha aprovechado para partirlo: los documentos de la carpeta pasan a
`js/ficha-documentos.js` (hablándose por `window.FichaDocumentos.pintar`), dejando en
`js/ficha-asunto.js` solo la cabecera, las acciones, las notas, el contacto y el enlace de la
guía.

**Pruebas reescritas del todo**: `pruebas/guias.mjs` y `pruebas/opciones.mjs` ya no esperan
`.paso-casilla`/`.guia-opcion`/`.guia-rama` dentro de la ficha, sino hitos; `pruebas/hitos.mjs`
cambia su escenario 2 (ya no hay botón que pulsar) y suma una prueba de que abrir la misma ficha
dos veces seguidas no duplica los hitos.

## 17-sep-2026 — Separar, unir y sacar páginas de un PDF

Fila 22 de la cola (`docs/COLA.md`, `docs/SEPARAR-Y-UNIR-PDF.md`), punto 4 de
`docs/PROXIMOS-ASUNTOS.md`. Con esta fila se termina la lista que Francisco dictó el
14-sep-2026: no queda ningún punto suelto de aquella conversación.

Contado por Francisco, tres casos de su trabajo normal: escanea varios papeles de una vez y le
sale un solo PDF que hay que partir; un mismo documento le llega en varios ficheros que hay que
juntar; y de un PDF largo solo le interesan una o dos páginas.

**Por qué pdf-lib, y no a mano.** La fila 17 escribió los `.docx` a mano (ZIP y XML, sin
librerías), porque un `.docx` es un ZIP con XML dentro y eso se puede hacer sin depender de
nadie. Un PDF no: la tabla de objetos y las referencias cruzadas de su estructura interna no se
pueden montar a mano sin escribir, en la práctica, un lector y un escritor de PDF enteros. Se ha
copiado **pdf-lib** en `js/lib/`, igual que ya está copiada pdf.js, y cargada solo la primera vez
que hace falta: no se trae de internet en caliente, tiene que funcionar con la red del centro.
Las páginas se copian tal cual (`copyPages`), así que no se pierde calidad ni el sello de
registro que llevaran dentro.

**Dónde se hace.** Francisco pidió hacerlo con el papel ya vinculado al asunto, para que lo que
salga siga vinculado. Pero un escaneo de golpe puede traer papeles de varios asuntos distintos, y
si hubiera que vincular antes de partir no se podría repartir; por eso las tres acciones están
también en Por clasificar, con la misma máquina (`js/pdf-herramientas.js` para los bytes,
`js/pdf-separar-unir.js` para la pantalla) y solo cambia qué se hace con el resultado: en un
asunto, el cuadro de ponerle nombre de siempre; en Por clasificar, un nombre automático
(`(i de N)`, `(unido)`, `(paginas sacadas)`) sin preguntar nada.

**Alcance decidido aquí**: los botones nuevos van en la ficha del asunto y en las tarjetas de Por
clasificar, no dentro del cuadro "Gestionar documentos" (que ya tiene cuatro botones por fila).
Y en vez de leer el número de páginas de cada PDF solo para decidir si el botón Separar se
enseña o no (que obligaría a abrir todos los PDF de la carpeta de antemano, sea cual sea el
tamaño), el botón siempre sale, y si el PDF tiene una sola página, el propio cuadro lo dice al
abrirse.

Al escribir la prueba en navegador se ha encontrado y arreglado un fallo del disco de mentira
compartido por todas las pruebas (`pruebas/navegador.mjs`): `createWritable().write(...)` leía
cualquier `Blob` o `File` con `.text()`, que decodifica el contenido como UTF-8; con un PDF de
verdad (bytes binarios, no texto) eso cambia el tamaño al volver a codificarlo, y la
comprobación de "la copia ha salido completa" (la misma que usan `Carpetas.renombrarFichero` y la
papelera) fallaba en seco. Se ha cambiado a `.arrayBuffer()`, que es como lo hace de verdad el
navegador; los PDF de prueba de filas anteriores, escritos como texto ASCII a propósito, no han
notado el cambio.

---

## 17-sep-2026 — Grupos de personas

Fila 21 de la cola (`docs/COLA.md`, `docs/GRUPOS-DE-PERSONAS.md`), punto 3 de
`docs/PROXIMOS-ASUNTOS.md`. Lo pidió Francisco para los terceros relacionados —hoy, para
relacionar a media clase con un asunto, hacían falta veinte vueltas al mismo cuadro, una persona
cada vez—, pero en la conversación añadió: "no solo relacionar asuntos, pienso que estos grupos
también serían útiles para enviar comunicaciones". De ahí que la misma pieza (señalar varios de
golpe) sirva para dos cosas: relacionar en bloque y poner los destinatarios de un correo.

Tres capas, de abajo arriba:

1. **Señalar varios**, en el buscador de terceros de siempre (`App.pintarBuscadorDeTercero`,
   `js/asuntos-nuevo.js`): un modo `multiple` opcional, sin tocar el modo de siempre que ya usan
   "Nuevo asunto" y el "Añadir un relacionado" de toda la vida. Lo señalado vive fuera de la
   búsqueda, así que cambiar de categoría o de texto no lo pierde; una barra fija con la cuenta y
   el botón de añadir, con un × por cada señalado para poder quitarlo sin volver a buscarlo —
   necesario porque un miembro de un grupo puede no salir en ningún resultado (ya no está en las
   listas), y aun así hay que poder verlo y quitarlo.
2. **Atajos de alumnado** (toda una unidad, todo un nivel, toda una enseñanza), construidos sobre
   `Datos.unidadesDistintas` (ya existía, en Ajustes) y una pieza nueva, `Nombres.nivelYEnsenanza`,
   que reutiliza el mismo análisis de texto que `Nombres.grupoCompacto` en vez de duplicarlo:
   Séneca escribe "1º de E.S.O. A", y de ahí hay que sacar el nivel y la enseñanza sueltos. Solo
   entra el alumnado matriculado este curso.
3. **Grupos propios**, guardados con nombre en el decimotercer fichero compartido,
   `_GESTOR/grupos.json` (`js/grupos.js`), con su bloque en Ajustes: crear, cambiar el nombre, ver
   y cambiar los miembros (reutilizando el mismo buscador en modo `multiple`) y borrar por
   papelera. Un miembro que ya no está en las listas —se ha ido, o se ha borrado a mano— se
   conserva igual, marcado aparte en gris, hasta que se quita a mano: nunca se toca un grupo sin
   que se lo manden.

**La decisión de la copia oculta.** Los destinatarios de un grupo, en el cuadro de Correo, van
**siempre en copia oculta**, nunca en "Para". Decisión de Francisco, 17-sep-2026: si un grupo
mete a varias familias en el mismo correo y todas van en "Para" (o en copia visible), cada una ve
la dirección de las demás — un problema de protección de datos evidente en un centro educativo.
La copia oculta lo evita del todo, al precio de que el remitente (Francisco) tiene que ir en
"Para" si no hay nadie más: así lo exige Gmail, y es lo que hace todo el mundo con un envío en
copia oculta. Se ha resuelto en el propio `apps-script/gestor-correos.gs`, poniendo
`Session.getActiveUser().getEmail()` cuando hace falta: la aplicación no necesita saber la
dirección de correo de Francisco para nada.

**Lo que se ha dejado fuera**, a falta de datos que la aplicación no tiene: departamentos,
tutorías y equipos educativos. `personal.csv` (Séneca) solo trae nombre, documento, puesto,
teléfono y correo — nada de a qué departamento pertenece nadie, ni quién tutoriza qué grupo. Eso
se habla aparte el día que haga falta, y hasta entonces esos grupos se montan a mano como
cualquier otro grupo propio.

Detalle técnico completo en `docs/CONTEXTO.md`, sección "Grupos de personas".

---

## 17-sep-2026 — Registrar un papel sellado sin quedarse con dos

Fila 20 de la cola (`docs/COLA.md`, `docs/REGISTRO-SIN-DUPLICAR.md`), punto 9 de
`docs/PROXIMOS-ASUNTOS.md`. Contado por Francisco, el camino de siempre para un papel que ya
había pasado por el registro de Séneca eran seis pasos: subir el documento sin registrar y
dejar que la aplicación lo nombre; subirlo a Séneca y que le ponga el sello, devolviendo un PDF
nuevo; bajar ese PDF sellado a la carpeta del asunto, donde queda como un documento más con el
nombre que le pone Séneca; volver al documento **viejo** y pulsar Registrar; buscar en el
explorador el PDF sellado que se acababa de bajar, señalarlo y confirmar; y por último borrar a
mano ese PDF, porque la aplicación **generaba un tercer fichero** (el sellado con el nombre
bueno) y el mismo papel quedaba dos veces con dos nombres distintos.

El error de fondo era el orden: había que avisar primero (pulsar Registrar) y buscar el papel
después, aunque ya estuviera en la propia carpeta. Se ha dado la vuelta: la ficha del asunto mira
sola los PDF de su carpeta cuyo nombre no ha puesto la aplicación, les lee el sello y, si lo
tienen, pregunta de qué documento es en vez de esperar a que Francisco avise. Al contestar, el
PDF sellado se renombra en el sitio (no se genera nada nuevo) y el documento viejo se manda a la
papelera. Detalle técnico completo en `docs/CONTEXTO.md`, sección "Un papel que ya trae el
sello, sin duplicarlo".

Dos quejas más de Francisco, resueltas de paso:

- El sello se detectaba unas veces sí y otras no, con el mismo documento: era que
  `js/registro-lector.js` solo leía la página 1 del PDF, y si el sello caía en otra página no
  aparecía. Ahora se leen hasta 10, y además el texto se busca normalizado y, si hace falta, sin
  ningún espacio (el sello de Séneca a veces viene pegado del todo a lo que sigue).
- El explorador de "Abrir archivo" nunca se abría en la carpeta del asunto: `Carpetas.elegirFichero`
  admite ahora una carpeta de inicio (`startIn`, del propio navegador), que le pasan sus llamadores
  cuando la conocen.

De paso, `js/notas.js` gana `Notas.sustituir`: como `Notas.anadir`, pero sustituye una nota
anterior con la misma clave en vez de apilar otra debajo. Hacía falta para que registrar dos
veces el mismo documento (por este camino nuevo o por el botón de siempre, que también lo usa ya)
deje una sola nota de registro, no dos.

Francisco probará esto con papeles de verdad y avisará si hay que ajustar algo: es la única fila
de esta cola donde su prueba con casos reales hace falta de verdad, porque el PDF de muestra con
el sello no se puede subir al repositorio (lleva datos personales).

---

## 17-sep-2026 — El código de verificación del pie de un documento

Fila 19 de la cola (`docs/COLA.md`, `docs/CSV-DEL-DOCUMENTO.md`), punto 1 de
`docs/PROXIMOS-ASUNTOS.md`, reducido a lo que de verdad se podía hacer: Francisco comprobó el
16-sep-2026 que la página de verificación de un documento de Séneca no pide ni certificado ni
captcha, solo el código. Lo único que pedía era no tener que teclearlo a mano.

- **Descartado a propósito**: traer la copia auténtica sola (la página no se abre con una
  dirección que lleve el código dentro, hay que rellenar su formulario, y cada administración
  tiene el suyo) y poner nosotros la dirección de verificación (la pone el propio documento: así
  vale para cualquier organismo, sin ninguna lista que mantener).
- `js/verificacion.js` nuevo, reutilizando `RegistroLector.textoDePrimeraPagina`
  (`js/registro-lector.js`, sacada de ahí para esto: la misma máquina que ya lee el sello de
  Séneca, sin cargar pdf.js dos veces). Busca la etiqueta del código (CSV, CVE, "Código de
  verificación"...) sin mayúsculas ni tildes, y una dirección `http(s)://` que contenga
  `verifica`/`csv`/`cve`/`valida`/`cotejo`/`sede`, recortando la puntuación de la frase que suele
  quedar pegada al final.
- **En `js/lector.js`** (el panel de leer un correo): al abrir un PDF se lee el pie sin retrasar
  el panel, y si aparece código y dirección salen "Copiar el código" (con el código en gris al
  lado) y "Abrir la verificación". Solo se toca este panel, no `js/visor.js`: es donde se lee un
  correo antes de archivarlo, que es cuando hace falta el atajo.
- Nada se guarda: ni en `asuntos.json` ni en ningún fichero compartido. Es un botón para no
  teclear, no un dato del asunto.
- Prueba nueva `pruebas/verificacion.mjs`, sin PDF ni navegador (mismo patrón que
  `pruebas/logica.mjs`, con `vm` de Node).

## 17-sep-2026 — Un mismo correo en dos buzones

Fila 18 de la cola (`docs/COLA.md`, `docs/CORREO-EN-DOS-BUZONES.md`). Francisco y su compañero
tienen cada uno su buzón de Gmail, su recolector y su `GESTOR-BANDEJA`, pero los asuntos son
comunes. Como la aplicación reconocía un correo por el identificador de hilo de Gmail —que es de
cada buzón—, un correo dirigido a los dos aparecía como dos correos sin relación: si uno lo
guardaba, al otro le seguía saliendo como nuevo.

- **La matrícula**: el `Message-ID` de la cabecera de un mensaje, el mismo en todos los buzones
  por los que pasa. El recolector ya lo leía para el enlace (`enlaceAlHilo`), pero no lo guardaba.
  Ahora sí: `matricula(mensaje)` nueva en `apps-script/gestor-correos.gs`, y `guardarHilo` apunta
  `matriculas` (todas las del hilo) y `matricula` (la del último mensaje) en la ficha.
- `js/bandeja-correos.js`: `asuntoDeLaMatricula(matriculas)`, hermana de `asuntoDelHilo`.
  `asuntoDeEsteCorreo` mira ahora, en orden: identificador de hilo propio, el de la respuesta,
  matrícula, y solo entonces el texto. La huella (`hilos` en `asuntos.json`) gana `matriculas`,
  `metidoPor` y `metidoEl`, los tres opcionales (los asuntos de antes no los tienen).
- **La línea gris**: cuando un correo encaja por matrícula pero su propio identificador de hilo
  no está en las huellas de ese asunto (o sea: es del compañero, no suyo), en vez de tarjeta sale
  una línea aparte, debajo de las normales — "Ya está en el asunto «...» · lo metió Juan el
  17-sep-2026 · 09:14" — con "Abrir el asunto" y "Quitar de mi bandeja" (esto último borra los
  ficheros de esta bandeja sin pasar por la papelera: son copias de trabajo, el correo de verdad
  sigue en Gmail).
- **La trampa del `visto` compartido** (`apps-script/gestor-correos.gs`,
  `seguirHilosConocidos`/`hiloDeSeguido`): un hilo puede tener un número de mensajes distinto en
  cada buzón (correos internos, borradores, reenvíos que no están en los dos sitios), así que la
  cuenta de mensajes vistos no puede compararse contra el `visto` que escribe el buzón que
  enganchó el correo: se recogería cada minuto para siempre, o nunca. Se guarda aparte, por buzón,
  en `PropertiesService.getScriptProperties()` del propio proyecto de Apps Script; el `visto`
  compartido solo sirve de arranque la primera vez que se sigue un hilo.
- De paso: se descubrió que el recolector llevaba **seis días** dejando los correos en una
  `GESTOR-BANDEJA` distinta de la que leía la aplicación (alguien había movido la de verdad
  dentro de otra carpeta; el script solo mira la raíz del Drive, no la encontró, y se creó una
  nueva sin decir nada — la bandeja se veía simplemente vacía, sin ningún error). Arreglado por el
  lado de la aplicación, que es donde se mira: en Ajustes, "Último correo recogido", con la fecha
  del propio fichero más nuevo de la carpeta; con más de 3 días sin moverse, avisa.
- Prueba nueva `pruebas/correo-dos-buzones.mjs`. `pruebas/correos.mjs` se ha tenido que tocar: sus
  comprobaciones de `hilos` esperaban el objeto exacto, y ahora lleva los campos nuevos (se
  proyectan solo los campos estables en la comparación, para no depender de la hora exacta de
  `metidoEl`).

## 17-sep-2026 — No pisarse en un mismo asunto

Fila 24 de la cola (`docs/COLA.md`, `docs/NO-PISARSE-EN-UN-ASUNTO.md`): la aplicación la usan
Francisco y su compañero sobre la misma carpeta de Dropbox, y hasta hoy nada avisaba de que los
dos estuvieran tocando el mismo asunto a la vez.

- Módulo nuevo `js/presencia.js` (`window.Presencia`), fichero nuevo `_GESTOR/presencia.json`
  (`{ <clave>: { usuario, ultima } }`). **A propósito fuera de los doce ficheros protegidos**: se
  escribe cada 30 segundos y caduca sola a los 3 minutos, así que no necesita copia de seguridad,
  papelera ni fusión de conflictos; se lee y escribe directo con `Carpetas`, nunca con
  `Copias.guardar`. `js/copias.js`, `js/papelera.js` y `js/conflictos.js` no se han tocado: los
  tres trabajan con listas propias de ficheros, y esta nunca entra en ninguna.
- Al abrir la ficha de un asunto libre, se anuncia la propia señal y se renueva sola; al cerrarla,
  se quita. Si ya está ocupado por otro, se entra en modo consulta: aviso arriba
  ("Fulano está en este asunto ahora mismo. Estás mirando, no puedes modificar.") y botón "Tomar
  el mando", con confirmación.
- **Apagar los controles que modifican no ha tocado ningún otro módulo**: `js/ficha-asunto.js`
  recorre `#ficha-asunto-cuerpo` entero y apaga todo (`button, select, input, textarea`) salvo una
  lista blanca de solo lectura (volver, abrir un documento, copiar un nombre, desplegar un hito,
  tomar el mando). Como media ficha se pinta sola después de `pintar()` (guía, documentos, hitos,
  "Generar documento", "Correo"...), hace falta un `MutationObserver` propio sobre
  `#ficha-asunto-cuerpo` que lo vuelva a aplicar cada vez que aparece algo nuevo, con el mismo
  patrón (y el mismo aviso sobre estos observadores) que ya usa `js/hitos-panel.js`.
- La marca en la tarjeta de "Asuntos abiertos" (una letra, el nombre completo en el `title`) la
  cuelga `js/presencia.js` envolviendo `App.tarjetaAsunto`, sin tocar `js/asuntos-lista.js`. Una
  copia en memoria de `presencia.json` se refresca sola cada 10 segundos, enganchada a
  `App.vigilarLaCarpeta` (ya arranca sola al entrar, así que tampoco ha hecho falta tocar
  `js/nucleo.js`).
- Descartado, por ahora (lo pidió Francisco expresamente): una base de datos pequeña en internet
  para que el aviso fuera instantáneo. Si se hace algún día, solo viajarían el identificador del
  asunto y el nombre de quien lo abre, nunca datos de alumnado o personal, con servidor en la UE.
- Prueba nueva `pruebas/presencia.mjs`: la "otra persona" se simula escribiendo directamente en
  el disco de mentira (mismo truco que `pruebas/conflictos.mjs`), sin dos pestañas ni dos
  navegadores. Cubre: señal propia al abrir y quitada al cerrar, modo consulta con otro dentro,
  tomar el mando, señal caducada que no cuenta, la marca en la lista, y que el fichero queda
  fuera de copias y papelera.

## 17-sep-2026 — "Por clasificar": el documento a la vista, marcado en la lista

Fila 25 de la cola (`docs/COLA.md`, `docs/POR-CLASIFICAR-DOCUMENTO-A-LA-VISTA.md`): Francisco
pedía saber, de un vistazo, cuál de la lista de la izquierda es el documento que se está viendo a
la derecha, sin tener que adivinarlo por el nombre.

- `js/visor.js` gana un `marcador` opcional (un texto libre que pone quien abre el documento) y
  un aviso (`Visor.alCambiar`) cada vez que cambia, además de un hueco de acciones bajo la
  cabecera (`opts.acciones`). Sin esos dos parámetros se comporta exactamente igual que antes, así
  que `js/ficha-asunto.js` y `js/unir-asuntos.js` no han tenido que tocarse.
- `js/documentos-sueltos.js` usa el marcador `'suelto:<nombre>'`: al cambiar, marca la tarjeta que
  toca (`.tarjeta-abierta`) y le hace `scrollIntoView`; al repintar la lista entera, cada tarjeta
  nace ya marcada si le toca. `App.accionesDeSuelto(s)` reutiliza `App.tarjetaSuelto` entero (con
  el "Borrar" que le cuelga `js/papelera.js`) para no tener una segunda copia de los tres botones.
  `App.pintarSueltos` cierra el visor solo si el marcador abierto ya no está en `App.E.sueltos`
  (se apoya en que `App.verAbiertos` ya se llama tras crear, meter o borrar: no hizo falta tocar
  esas tres acciones).
- El nombre en la cabecera del panel se corta por el medio, no por el final, cuando no cabe: se
  mide el ancho de verdad (`scrollWidth` contra `clientWidth`) y se van quitando caracteres del
  lado más largo hasta que entra, con el `title` siempre con el nombre completo.
- Prueba nueva `pruebas/documento-a-la-vista.mjs`, con la aplicación entera en un navegador de
  verdad: abrir marca, abrir otro mueve la marca (nunca se acumula), cerrar la quita, y borrar
  desde el propio panel hace desaparecer la tarjeta y cierra el visor solo.

## 17-sep-2026 — La pantalla no se repintaba sola tras guardar

Fila 23 de la cola (`docs/COLA.md`, `docs/REFRESCO-DE-PANTALLA.md`), la primera de las que
Francisco pidió el 17-sep-2026: cambiar el estado de un asunto, marcar un hito como hecho o
archivar parecía no hacer nada hasta salir y volver a entrar, aunque el dato ya se había guardado
bien.

- **Buscada la causa de verdad**: cada acción ya hacía `await` hasta el final y ya llamaba a quien
  pinta después (`App.anotar` relee el registro, guarda con `Copias.guardar` y llama a
  `App.refrescarFichas()`; `App.ponerEstado`, `App.cerrarAsunto` y `Hitos.marcar` seguían la misma
  regla). Se comprobó con `pruebas/navegador.mjs` (disco de mentira, escritura instantánea) que
  las tres acciones YA refrescaban bien sin recargar: el fallo no está en la lógica de repintado,
  sino en que **nada avisa de que se está guardando**. Con la carpeta de verdad en Dropbox, el
  guardado tarda de forma perceptible; el botón o el desplegable se quedan pulsables, no cambian
  de aspecto, y a Francisco le parece que la aplicación no ha hecho nada —cuando en realidad el
  guardado sigue en marcha, y al volver a entrar (con el guardado ya terminado) lo ve bien—.
- **El arreglo**: `U.mientrasGuarda(control, fn)` (`js/util.js`), nuevo. Apaga el control mientras
  `fn` hace su trabajo asíncrono y lo devuelve a como estaba al terminar, guarde o falle; en un
  botón, además, el texto pasa a "Guardando…". Puesto en el estado del asunto (ficha y tarjeta de
  la lista), la vía, el plazo, archivar/reabrir (`js/ficha-asunto.js`, `js/asuntos-lista.js`), y en
  marcar un hito, cambiar de rama, y tocar su responsable, fecha, notas o documentos
  (`js/hitos-panel-lista.js`). Así se ve que la aplicación está trabajando y no se puede pulsar dos
  veces mientras tanto (evita además una carrera si dos guardados del mismo asunto se solapan).
- Prueba nueva `pruebas/refresco.mjs`, con la aplicación entera en un navegador de verdad: crea un
  asunto de verdad (con categoría y tercero, no una carpeta suelta), y comprueba las tres acciones
  —cambiar el estado, marcar un hito y archivar— sin recargar nada, más que el control usado se
  apaga mientras guarda.
- Las notas (`js/ficha-asunto.js`, `pintarNotas`) ya tenían su propio apagado del botón durante el
  guardado, de antes: no se ha tocado, porque ya cumplía la regla.

## 16-sep-2026 — Plantillas de documento de Word

Fila 17 de la cola (`docs/COLA.md`, `docs/PLANTILLAS-DE-DOCUMENTO.md`), el gemelo en papel de las
plantillas de correo (fila 14, más abajo en este mismo diario): Francisco cuelga un `.docx` de un
tipo de asunto en Ajustes, y el botón **Generar documento** de la ficha saca una copia con los
huecos rellenos, ya guardada en la carpeta del asunto, sin preguntar nada.

- **`Plantillas.valoresDeAsunto(asunto)`** (`js/plantillas.js`), pública: hasta hoy era
  `valoresDePlantilla()`, privada de `js/correo.js`. Ahora es async —el DNI, los tutores y el
  registro salen de ficheros— y amplía el catálogo de huecos (`Plantillas.HUECOS`) con
  `nombreNatural`, `referencia` (según la categoría), `dni`, `telefono`, `correo`, los dos tutores
  con su teléfono y correo (leídos por el título de la columna, como `js/dni.js`), `descripcion`,
  `estado`, `registro`, `hoyLargo`, `lugarYFecha`, y los datos del centro (`localidad`,
  `direccionCentro`, `codigoCentro`, `cargo`, y `firma` ya relleno). `js/correo.js` la llama una
  vez por apertura del cuadro y ya no tiene su propia función.
- `js/plantillas.js` pasó de 423 a más de 750 líneas con este motor, así que **el bloque de
  Ajustes "Plantillas de correo" se sacó a `js/plantillas-ajustes.js`**, sin cambiar lo que hace
  (usa la API pública de `Plantillas`, nada privado). El fichero se queda en unas 450 líneas, solo
  con el motor.
- **`js/docx.js` nuevo** (`window.Docx`, sin librerías ni CDN): lee y escribe un `.docx` (que es
  un ZIP) a mano —directorio central buscado desde el final, cabeceras locales, CRC-32 con tabla
  propia (polinomio `0xEDB88320`)—. Las entradas que no hacen falta tocar se copian tal cual; las
  que sí (`word/document.xml`, `header*.xml`, `footer*.xml`) se descomprimen con
  `DecompressionStream('deflate-raw')` si hace falta y se reescriben **sin comprimir** (método 0):
  así no hace falta `CompressionStream` para nada. La parte delicada, y la primera que se probó:
  Word reparte el texto de un párrafo en varias `<w:t>` (por ejemplo, una palabra suelta en
  negrita), así que `{nombre}` puede llegar partido en dos o tres. Antes de sustituir, cada
  `<w:p>` se repara moviendo solo los caracteres del hueco hasta dejarlo entero en una única
  `<w:t>` — nunca fundiendo todas las de un párrafo en una, que perdería el formato de las
  palabras que no son parte de ningún hueco.
- **`js/plantillas-documento.js` nuevo**: el botón "Generar documento" en la ficha (mismo patrón
  que `js/correo.js` con "Correo" y "Mensaje Séneca": se envuelve `App.abrirFicha`), que no sale
  si el tipo no tiene plantillas, elige sola con una y pregunta con varias (como
  `Relacionados.elegirTercero`, dentro de `#capa`, sin `U.preguntar`). Guarda sin pisar, deja nota
  con `Notas.anadir`, avisa de los huecos sin datos y refresca la ficha. En Ajustes, bloque
  hermano "Plantillas de documento": buscador, tarjetas, alta (con un desplegable de los `.docx`
  que ya haya en `_GESTOR/PLANTILLAS`, que Francisco sube a mano), edición, borrado con
  `Papelera.botonBorrar`, y la lista de huecos con un botón de copiar en cada uno.
- **`plantillas.json` gana la clave `documentos`** y cuatro claves de raíz del centro
  (`localidad`, `direccion`, `codigo`, `cargo`); `limpio()` las normaliza, así que un fichero
  viejo sigue cargando igual. No es ningún fichero compartido nuevo: sigue siendo el mismo de
  siempre, y los `.docx` de `_GESTOR/PLANTILLAS` tampoco cuentan como fichero compartido (no
  llevan copia de seguridad).
- Ocho escenarios en `pruebas/plantillas-documento.mjs`, con **jsdom** en vez de Playwright (no
  hace falta un navegador de verdad para probar ZIP y XML a mano): construye un `.docx` de mentira
  con su propio escritor de ZIP, independiente del de `js/docx.js` para no acabar probándose a sí
  mismo, comprimiendo de verdad con `CompressionStream` como haría Word. El ZIP de salida se
  comprobó además con `unzip -t` y `zipinfo`, herramientas de línea de comandos, no solo con el
  lector propio.

## 16-sep-2026 — El enganche que faltaba en el correo, de las plantillas

Fila 14 de la cola (`docs/COLA.md`, `docs/PLANTILLAS-DE-CORREO.md`), que se había dado por
`HECHA` estando solo a medias: `js/plantillas.js` ya existía entero y funcionaba —el fichero
`_GESTOR/plantillas.json`, `Plantillas.rellenar` y el bloque "Plantillas de correo" de
Ajustes—, pero **`js/correo.js` no lo usaba para nada**. Seguía con la constante `CENTRO`
escrita a mano y sin ningún desplegable de plantilla, ni en el cuadro de Correo ni en el de
Séneca. Por eso `pruebas/plantillas.mjs` llevaba días en rojo: no era, como se apuntó el
16-sep-2026 en la entrada de "Qué me toca", "algo del entorno de pruebas" — era que faltaba el
trabajo.

Lo que se ha completado en `js/correo.js` (secciones 2.3 y 3 de
`docs/PLANTILLAS-DE-CORREO.md`; no se ha tocado nada de `js/plantillas.js`):

- `cuerpoDelCorreo(a, idPlantilla)` ya no la escribe a mano: si el tipo del asunto tiene alguna
  plantilla, el medio sale de `Plantillas.rellenar(plantilla.texto, valores)`; la firma sale
  siempre de `Plantillas.rellenar(datos.firma, valores)` —con o sin plantilla de por medio—, y
  `Plantillas.cargar` ya resuelve sola el caso de que `plantillas.json` no exista todavía. Los
  valores de los huecos los monta `valoresDePlantilla(a)`, nueva y privada del fichero: nombre
  (`soloElNombre`), grupo y curso (`piezasDelNombre`), tipo, hoy, límite, usuario y centro, más
  `campos` con los campos propios del asunto (`camposDelAsunto`, mirando `App.E.campos.porTipo`
  como hace `filasDeCampos` en `js/ficha-asunto.js`).
- **El desplegable "Plantilla"** (`#correo-plantilla`), encima del cuerpo, en los dos cuadros: lo
  pinta `camposComunes`, que es la única función que ya compartían Correo y Séneca, así que no ha
  hecho falta ningún contenedor `#correo-comunes` aparte. Con una sola plantilla del tipo, sale
  puesta; con varias, sale la primera; sin ninguna, no se pinta nada. Al cambiar de plantilla
  (`cambiarPlantilla`), si lo escrito coincide con lo último que puso el propio código se cambia
  sin más; si no, se pregunta **en línea, dentro del propio cuadro** (`#correo-plantilla-confirmar`,
  con "Seguir con lo escrito" / "Cambiar de todas formas"), nunca con un segundo `U.preguntar`:
  solo puede haber un cuadro de diálogo abierto en toda la aplicación, y ese ya lo tiene el
  cuadro de Correo.
- El aviso ámbar de huecos sin datos (`#correo-faltan-datos`, "Faltan datos: …") sale con las
  etiquetas en castellano de `Plantillas.HUECOS`, que ya venían así de `Plantillas.rellenar`.
- En Séneca, al copiar el texto (paso 2 de `engancharSeneca`) se recorta a 4.000 letras si hace
  falta, avisando en `#seneca-explica`.

`index.html` ya cargaba `js/plantillas.js`... no lo cargaba en absoluto: se ha añadido, justo
antes de `js/correo.js`.

Los 7 escenarios de `pruebas/plantillas.mjs` pasan, y la batería completa (`npm test`, 24
ficheros, `CHROMIUM_PATH` apuntando al Chromium ya instalado en el entorno) sale entera en
verde, incluidos `pruebas/correos.mjs` y `pruebas/envios.mjs` (que también usan `js/correo.js`,
para la bandeja de correos y los adjuntos): un asunto sin plantillas de su tipo sigue
comportándose exactamente igual que antes de este cambio.

**Corrección, al fusionar**: mientras esta sesión hacía este mismo arreglo en su rama, otra
sesión en paralelo hizo también el suyo directamente sobre `main` (en el mismo pull request que
las filas 12 y 13), sin verse la una a la otra, y con el diseño que de verdad pedía el encargo:
`camposComunes`/`interiorDeComunes` con su propio contenedor `#correo-comunes`, tal y como sigue
descrito en `docs/CONTEXTO.md`. Al fusionar esta rama se ha mantenido la de `main` —llegó antes—
y se ha descartado todo lo de `js/correo.js` descrito arriba; lo único que ha sobrevivido de
esta entrada es el diagnóstico (fila 14 se había dado por hecha sin estarlo) y la corrección de
la entrada de "Qué me toca" sobre por qué fallaba `pruebas/plantillas.mjs`. Encima de la versión
de `main` se ha aplicado, ya sí, el cambio de la fila 17: `valoresDePlantilla(a)` pasa a ser
`Plantillas.valoresDeAsunto(asunto)`, pública y en `js/plantillas.js`.

## 16-sep-2026 — Qué me toca

Fila 16 de la cola (`docs/QUE-ME-TOCA.md`), depende de la fila 15 (hitos, ya `HECHA`).

Los hitos de la fila 15 se veían dentro de cada asunto, uno a uno. Esta pantalla nueva los cruza
todos: lee `Hitos.leer()` una vez y `window.Gestor.asuntos()`, y saca los hitos `pendiente` y
`encurso` de todos los asuntos abiertos en tres bloques — "En tu tejado" (responsable `yo` o
`companero`, con fecha límite, los vencidos arriba y en rojo, reutilizando tal cual
`Plazos.de`/`.marca-plazo` de `css/plazos.css`, sin inventar otra escala de colores), "Esperando
a otros" (cualquier otro responsable, con los días parado desde `desde`, los más parados arriba)
y "Sin fecha" (plegado con `<details>`, para que no se pierda lo que no tiene fecha límite) — con
filtro por responsable arriba (recordado en `localStorage`) y entrada propia en la barra de la
izquierda, con la cuenta de vencidos al lado (sin número si no hay ninguno).

Vive entera en `js/que-me-toca.js` (`css/que-me-toca.css`), con el mismo patrón que la pantalla
"Duplicados" (`js/unir-asuntos.js`): `App.PANTALLAS.push`, la sección se crea a mano y no está en
`index.html`. A diferencia de "Duplicados" sí tiene entrada en la barra (`js/barra.js`): como se
añade después de cargada la página, el bucle de `js/nucleo.js` que pone el `onclick` de las
pestañas ya existentes no la alcanza, así que se le pone a mano; el resaltado como "activa" sí
sale solo, porque `App.ir` vuelve a mirar los `.pestana` que haya cada vez que se llama. Al
pulsar una línea se abre la ficha del asunto con ese hito ya desplegado: enganche nuevo y pequeño
en `js/hitos-panel.js` (`window.HitosPanel.desplegarAlAbrir(clave, idHito)`, guarda el par y lo
aplica en el siguiente repintado de esa ficha, sin depender de en qué orden se hayan cargado los
dos ficheros).

Esta sesión sí tenía un Chromium a mano (con `CHROMIUM_PATH` apuntando a él, porque el que trae
`playwright` de fábrica no coincidía de versión): los 7 escenarios de `pruebas/que-me-toca.mjs`
pasan, y la batería completa (`npm test`, 24 ficheros) sale en verde salvo `pruebas/plantillas.mjs`,
que ya fallaba antes de esta fila por algo del entorno de pruebas (un `locator.inputValue` que
no llega a tiempo), sin relación con "Qué me toca" ni con los hitos.

Ficheros nuevos: `js/que-me-toca.js`, `css/que-me-toca.css`, `pruebas/que-me-toca.mjs`.

## 16-sep-2026 — Los hitos de un asunto

Fila 15 de la cola (`docs/HITOS.md`).

Hasta hoy la guía de un tipo era texto que se leía y se marcaba con una casilla, igual para
todos los asuntos de ese tipo. Desde hoy, dentro de un asunto abierto, esos mismos pasos se
convierten en **hitos**: además de marcados o no, llevan estado (pendiente · en curso · hecho ·
no aplica), fecha límite, responsable, notas y documentos apuntados.

**Fichero nuevo, `_GESTOR/hitos.json`**, el duodécimo compartido: pasan de once a doce
(`js/copias.js`, `js/conflictos.js`). No va en `asuntos.json` porque ese fichero se lee en toda
pantalla y se escribe entero cada vez; `hitos.json` solo se lee al abrir un asunto, al archivarlo
y (en la fila 16) en "Qué me toca".

**De dónde salen.** Un asunto nuevo copia los pasos de la guía de su tipo al crearse (se envolvió
`App.anotar`, mirando el `abiertoEl` que solo pone la creación, en vez de tocar
`js/asuntos-nuevo.js` y `js/recurrentes.js`). Uno viejo no los recibe solo: sale el botón "Crear
los hitos de la guía", que además importa `pasosHechos`/`pasosElegidos` (se quedan en
`asuntos.json`, por si hay que volver atrás). El id del hito es el mismo que el del paso de la
guía: así un plazo "desde tal paso" o un `pasosElegidos` viejo se traducen solos.

**Bifurcaciones.** Un paso-pregunta se convierte en un hito de clase `decision`: mientras no se
elige una opción, la lista se corta ahí (`Hitos.visibles`); al elegir, los hitos de la rama
cuentan como si vinieran debajo. Cambiar de rama quita los hitos vacíos de la vieja y marca
`noaplica` (plegados al final, `Hitos.huerfanos`) los que ya tenían notas o documentos.

**Responsable, plazo y estado.** El cuadro de escribir la guía (`Guias.editar`) gana tres campos
opcionales y plegados por paso: responsable por defecto (personas de Ajustes + los papeles fijos
`tercero`/`tutor`/`relacionado`, que se resuelven solos con datos del asunto), estado del asunto
(de `estados.json`) y plazo (días y desde qué paso). Los días se cuentan hábiles, descontando los
no lectivos de Ajustes › Hitos (`Plazos.sumarDiasHabiles`, nombre propio para que lo reutilice la
fila 16). El estado del asunto lo decide una sola función, `Hitos.estadoDelAsunto`, para poder
cambiar el criterio sin tocar diez sitios si algún día el estado del asunto lo sustituye el
propio hito en curso.

**Al archivar**, los hitos salen de `hitos.json` y se escriben, ya dentro del ARCHIVO, como
`HISTORIAL DE TRAMITACION.txt`: legible sin la aplicación, sin copiar ningún documento (mismo
criterio que `DONDE ESTA ESTE ASUNTO.txt` de los relacionados). Al reabrir, si el fichero sigue
ahí, los hitos vuelven a `hitos.json` y el fichero se borra.

**En la ficha del asunto**, los hitos sustituyen a la lista de pasos, en el mismo sitio de
siempre, envolviendo lo que pinta la guía sin tocar `js/ficha-asunto.js`: `pintarGuia` es una
función privada de ese fichero, así que en vez de envolver una función de `App` se usó un
`MutationObserver` sobre `#ficha-guia`, como ya sugería `docs/CONTEXTO.md` para un panel que se
repinta entero.

**Ficheros nuevos**: `js/hitos.js` y `js/hitos-archivo.js` (el modelo, partido en dos por las
400 líneas), `js/hitos-panel.js` y `js/hitos-panel-lista.js` (la ficha, también partido en dos:
el repintado en uno, la fila de cada hito en el otro, hablándose por `window.HitosPanel`),
`js/hitos-ajustes.js` (el bloque "Hitos" de Ajustes: responsables y días no lectivos),
`css/hitos.css` y `pruebas/hitos.mjs`.

Al probar de verdad en un navegador (esta sesión sí tenía Chromium a mano, cosa que el trabajo
inicial no pudo comprobar) salieron tres fallos reales, ya arreglados: `pasosDe(tipo)` de
`js/guias-enganche.js` solo lee `guias.json` una vez, al entrar, así que la guía de prueba había
que escribirla en el disco de mentira ANTES del primer "Entrar", no después; `App.verAbiertos`
(el botón Actualizar) no relee `asuntos.json`, así que escribir a mano la ficha de un asunto
viejo necesitaba también `App.cargarRegistro()`; y el `MutationObserver` de `js/hitos-panel.js`
se disparaba con su propio repintado (mutaba el mismo `#ficha-guia` que vigilaba), lo que lo
metía en un bucle sin fin en cuanto había que interactuar con un hito desplegado — se arregló
desconectándolo mientras se repinta y reconectándolo al terminar.

## 16-sep-2026 — Un documento suelto puede entrar en un asunto que ya existe

Fila 12 de la cola (`docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md`). Versión publicada
`16-sep-2026 · 21:40`.

"Por clasificar" tenía el mismo agujero que tenía la bandeja de correos antes de la fila 11: el
único destino posible de un documento suelto era **un asunto nuevo**. Si el papel era de una
gestión que ya existía, no había por dónde meterlo desde la aplicación; había que ir al
explorador de archivos y arrastrarlo a mano.

**"Meter en un asunto".** Botón nuevo en cada tarjeta de "Por clasificar", entre "Crear asunto
con él" y "Borrar". Abre el cuadro de elegir asunto, y al elegir uno el fichero se lleva a su
carpeta y se abre el cuadro de ponerle nombre: exactamente el camino de "Crear asunto con él",
pero sin crear nada.

**Un solo elegidor para los dos.** La fila 11 había dejado el cuadro de escoger asunto dentro de
`js/bandeja-enlace.js`. Copiarlo habría sido tener dos buscadores y dos listas que mantener, así
que se sacó a **`js/elegir-asunto.js`** y ahora lo usan los dos. Lo que sí es distinto en cada
uno es la puntuación de "Podrían encajar", y por eso no se compartió: de un correo se sabe el
remitente, el asunto y el texto; de un documento suelto solo se sabe el nombre del fichero. El
cuadro recibe la lista de sugeridos ya puntuada, y el resto —lista completa, buscador, orden,
filas, "está archivado"— es común. También son comunes las piezas que sí valían para los dos:
los trozos del nombre del tercero, si el asunto se movió este mes, y el corte de 40 puntos.

**Lo que no se pierde.** El traslado va por `Carpetas.moverFichero`, que copia, comprueba que la
copia pesa lo mismo y solo entonces borra: en las carpetas de Dropbox el `move()` del navegador
existe pero lo rechaza. Si ya hay un fichero con ese nombre en el destino no se pisa; si la ruta
se pasa de 180 caracteres se avisa y se deja decidir; y si el traslado falla, el documento se
queda en "Por clasificar" y se dice con una línea. Si el asunto elegido está archivado, se puede
reabrir o meter el papel dentro del ARCHIVO sin tocar su estado.

Se comprueba con `pruebas/documentos-sueltos.mjs` (15 comprobaciones). Se descartó, como ya
estaba descartado, abrir la carpeta del asunto en el explorador del ordenador.

---

## 16-sep-2026 — Los correos se enganchan al asunto, y el hilo se sigue

Fila 11 de la cola (`docs/CORREOS-AL-ASUNTO.md`). Versión publicada `16-sep-2026 · 20:41`.

La bandeja de correos tenía tres agujeros. Si no acertaba con el asunto de destino, la única
salida era crear otro asunto nuevo, y acababan naciendo carpetas repetidas para la misma
gestión. Al guardar un correo no quedaba ningún rastro del hilo, así que el siguiente correo
empezaba de cero. Y el recolector de Apps Script le quitaba la etiqueta `GESTOR` al hilo, de
modo que las respuestas posteriores no las recogía nadie.

**La huella del hilo.** Al guardar un correo en un asunto se apunta ahora
`hilos: [{ id, asunto, visto }]` en su ficha de `asuntos.json`. Esa huella manda sobre la
adivinación por texto: da igual cómo venga escrito el asunto del correo, si el hilo ya es
conocido la tarjeta dice "Respuesta de <asunto>". `hilos` es opcional, así que los asuntos de
antes siguen funcionando igual. Un asunto puede tener varios hilos; un hilo, un solo asunto.

**"Elegir asunto".** Botón nuevo en cada tarjeta morada, en `js/bandeja-enlace.js`. Abre un
cuadro con "Podrían encajar" (cinco como mucho, por puntuación de parecido: la dirección del
tercero vale 50 puntos, su nombre escrito en el correo 40, cada palabra compartida 10, estar
abierto 15 y haberse movido este mes 10) y "Todos los asuntos" con buscador. Nunca se guarda
nada solo: siempre hay que pulsar.

Se partió `js/bandeja-correos.js`, que pasaba de 400 líneas: lo de elegir a mano y la
puntuación se fueron al fichero nuevo.

**`seguidos.json`.** La aplicación escribe en `GESTOR-BANDEJA` la lista de hilos enganchados con
su `visto`. En cada pasada, el script de Apps Script hace lo de siempre con la etiqueta y
después mira esos hilos con `GmailApp.getThreadById`: si han crecido, los recoge otra vez, con
`respuestaDe` y con `enviado: true` cuando el último mensaje lo mandó el propio usuario (la
tarjeta lo dice: "Lo enviaste tú"). Así vuelven a la bandeja tanto las respuestas del tercero
como los correos que manda Francisco desde Gmail.

**Los documentos.** El PDF del hilo entero pasa a llamarse `AAMMDD HILO <asunto>.pdf` y **se
sustituye**: el anterior va a la papelera, para que no se acumule una copia del hilo completo
por cada respuesta. El mensaje nuevo entra aparte, como `AAMMDD CORREO <asunto>.pdf`. Los
adjuntos siguen igual. El script también borra ahora lo que quedara de una recogida anterior del
mismo hilo: Drive admite dos ficheros con el mismo nombre y la aplicación no sabría cuál coger.

**Apps Script sigue sin desplegarse desde el repositorio.** El fichero lleva en sus tres
primeras líneas qué hay que hacer para actualizarlo. Va pegado también el arreglo del enlace a
Gmail (`#search/rfc822msgid:<Message-ID>`), que seguía sin llevarse a la cuenta desde el
9-sep-2026.

De paso, `pruebas/logica.mjs` estaba en rojo por su cuenta: llevaba dos fechas de cese escritas
a mano (15-sep-2026 y 6-sep-2026) que el calendario ya había alcanzado. Ahora se cuentan desde
hoy. **Regla nueva: nada de fechas escritas a mano en una prueba.**

## 12-sep-2026 — Reparto del contexto en tres documentos

`docs/CONTEXTO.md` había crecido hasta 1291 líneas: leerlo entero, en cada conversación y en
cada sesión de Claude Code, se había convertido en el mayor gasto de cuota del proyecto.
`docs/COLA.md` tenía el mismo problema con las notas de las filas HECHAS.

Se repartió en tres documentos:

- `docs/CONTEXTO-CORTO.md` (nuevo, máximo 160 líneas): para **decidir**, se lee siempre.
- `docs/CONTEXTO.md` (reescrito): para **programar**, solo lo que es verdad hoy, sin fechas ni
  relatos.
- `docs/HISTORIA.md` (este documento, nuevo): el diario completo, con fechas, para consultar el
  porqué.

También se podó `docs/COLA.md`: las notas de las filas HECHAS quedan en una sola línea cada
una, con el detalle largo trasladado aquí (ver más abajo, "Notas largas de `COLA.md` antes de
la poda").

Instrucción: `docs/REPARTO-CONTEXTO.md`. No se tocó código ni se ejecutaron pruebas.

A partir de ahora, cada instrucción de la cola debe anotar aquí lo que merezca recordarse, con
su fecha, en vez de dejarlo crecer dentro de `CONTEXTO.md`.
