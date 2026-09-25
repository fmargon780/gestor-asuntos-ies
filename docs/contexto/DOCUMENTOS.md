# El nombre y el registro de un documento, el código de verificación, "Por clasificar"

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar el nombre de un documento, su registro, o la bandeja de "Por clasificar". El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Los nombres, con tope de largo (fila 130)

Para no pasar del límite de rutas de Windows: la carpeta de un asunto, 150 caracteres como mucho
(`Nombres.montarAsunto`: se recorta primero la descripción y después los campos del tipo, por el
final; nunca la fecha, el tipo, el año, el grupo ni el tercero); el nombre de un documento, 120 más
la extensión (`Nombres.montarDocumentoAjustado`: el texto adicional y después los campos). La
vista previa (Nuevo asunto, Editar y el cuadro de documentos) avisa en ámbar con
`Nombres.avisoRecorte`. Los adjuntos de la bandeja: extensión limpia de 10 caracteres como mucho, o
ninguna. Los asuntos que ya existen no se renombran.

### Campos del tipo de documento en el nombre (23-sep-2026, fila 96)

`docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md`, `js/documentos-campos.js` (`window.DocCampos`). Cada
tipo de DOCUMENTO puede llevar campos propios (texto, lista cerrada o fecha; obligatorios si se
quiere), que entran en el nombre **entre el tipo y el texto adicional**:
`AAMMDD [REGISTRO] TIPO [CAMPOS] [TEXTO ADICIONAL].ext` (`Nombres.montarDocumento`, `datos.campos`).
No son los campos del tipo de ASUNTO, que siguen fuera del nombre de los documentos.

- Se configuran en Ajustes → El centro → Tipos de documento, menú ⋮ → «Campos del nombre»
  (`DocCampos.editar`: añadir, quitar, subir y bajar). La tarjeta los enseña en una línea.
- Se guardan en `_GESTOR/campos.json`, clave `porTipoDocumento` (`Campos.guardarCamposDeDocumento`,
  que relee y solo toca su trozo). `tipos-documento.json` sigue siendo una lista de nombres.
- En el cuadro de poner nombre (`js/documentos.js`), al elegir el tipo salen sus campos debajo; la
  vista previa los mete en su sitio. Un obligatorio vacío no deja guardar («Hace falta rellenar
  "X".»). Al renombrar, un valor de **lista** que ya esté tal cual justo detrás del tipo se
  reconoce (`DocCampos.reconocer`) y sale del texto adicional; nada más se adivina.
- Registrar no pregunta nada: `Documentos.leerNombre` devuelve los valores dentro del texto
  adicional, y así viajan tal cual. No se guarda nada en `asuntos.json`: el nombre es el dato.

Se comprueba con `pruebas/campos-del-documento.mjs` (montaje sin navegador, cuadro y editor en
navegador de verdad).

### Registrar un documento en un paso

Botón **Registrar**, en cada documento que aún no lleve las cuatro piezas del registro en su
nombre (en "Gestionar documentos" y en la ficha del asunto). Al pulsarlo se elige la copia
sellada, y solo se pide el número de registro: el resto del nombre (fecha, tipo, texto
adicional) se lee del documento original (`Documentos.leerNombre`). El nombre se monta con
`Nombres.montarDocumento`, la copia se guarda con `Carpetas.copiarFicheroEn`, el original se
queda como está, y se anota una nota en el asunto con `Notas.sustituir` ("Registrado 26EM1234 ·
<documento>"; ver más abajo). Si ya hay un fichero con ese nombre, avisa y no lo sobrescribe.

Casilla "Pendiente de registro" en el cuadro de nombrar un documento (solo si aún no lleva
registro); lo marcado se guarda en `pendientesRegistro`, en la ficha del asunto. Un pendiente
lleva marca ámbar "Sin registrar" y su botón Registrar sale destacado; al registrarlo se quita
solo de la lista, y al renombrarlo desde "Gestionar documentos" se actualiza con él.

**La tarjeta del asunto no lleva nada de esto** (ver `BOTONES_DE_LA_TARJETA`). Vive en
`js/registro.js`: "Gestionar documentos" ya tiene su `U.preguntar` abierto y pinta dentro
(`Registro.pintarEnContenedor`); la ficha del asunto no tiene cuadro abierto y abre uno nuevo
(`Registro.abrirCuadro`). **Solo hay un cuadro de diálogo en toda la aplicación**: abrir un
segundo `U.preguntar` mientras el primero espera le roba los botones al de fuera, que se queda
colgado. `Registro.proponer({ anio, tipo, serie, numero })` rellena las cuatro piezas (`tipo` es
E/S, `serie` es M/A). El explorador de "Abrir archivo" (`Carpetas.elegirFichero`, más abajo) se
abre ya en la carpeta del asunto.

### El explorador de ficheros, ya en la carpeta que toca (17-sep-2026, fila 20)

`window.showOpenFilePicker` admite `startIn` con el manejador de una carpeta. `Carpetas.elegirFichero(carpetaInicio)`
lo admite como argumento opcional; sin él, se abre donde el navegador quiera, como siempre.
Lo pasan sus llamadores cuando conocen la carpeta: `js/documentos.js` y `js/registro.js` (la del
asunto abierto) y `js/traer-datos.js` (la de `_GESTOR/datos`, aunque los CSV vengan de fuera: es
la única carpeta de la aplicación que ese botón tiene a mano).

### El código de verificación del pie de un documento

(17-sep-2026, fila 19, docs/CSV-DEL-DOCUMENTO.md). Los documentos electrónicos de la
administración llevan en el pie un código de verificación (CSV, CVE...) y la dirección donde se
teclea para comprobar el documento. Aquí solo se lee, para no teclearlo a mano: **nunca se
descarga nada de esa página** (cada administración tiene la suya, y su formulario no se abre con
una dirección que lleve el código dentro) y **nada se guarda** en ningún fichero compartido.

- `js/verificacion.js` (`window.Verificacion`), nuevo: `leerDelTexto(texto)` y
  `leerDelFichero(fichero)`. Reutiliza `RegistroLector.textoDePrimeraPagina`, sacada de
  `js/registro-lector.js` para esto (no se carga pdf.js dos veces ni se duplica cómo se saca el
  texto de una página).
- **El código**: se busca una etiqueta ("Código Seguro de Verificación (CSV)", "Código de
  verificación", "CSV", "CVE"...), sin distinguir mayúsculas ni tildes, y se coge lo que venga
  detrás —dos puntos, un guion o nada— hasta el primer carácter que no sea letra, número, o
  `+ / = - _ .`, con ocho de esos caracteres como mínimo. El espacio no entra en ese conjunto, así
  que el propio patrón para solo donde toca: no hace falta adivinar dónde acaba el código.
- **La dirección**: cualquier `http(s)://` del texto cuya dirección contenga `verifica`, `csv`,
  `cve`, `valida`, `cotejo` o `sede`; se coge la primera, recortando los puntos, comas, paréntesis
  y comillas que suelan quedar pegados al final por venir dentro de una frase.
- **En `js/lector.js`** (el panel de leer un correo, `con-lector`): al abrir un PDF
  (`Lector.abrir({ blob, ... })`) se lee el pie en paralelo, sin retrasar el panel; si aparecen
  código y dirección, salen debajo "Copiar el código" (con el código al lado, en gris) y "Abrir la
  verificación" (`target="_blank"`, `rel="noopener"`); solo código, solo el primer botón; nada,
  nada. Un número de generación descarta la lectura si se ha abierto otra cosa mientras tanto
  (mismo problema, mismo remedio, que el `repintando`/`actual !== a` de otros paneles que se
  repintan solos). **No toca `js/visor.js`**: por ahora, este atajo solo está donde se lee un
  correo antes de archivarlo, que es cuando de verdad hace falta no teclear nada a mano.

Se comprueba con `pruebas/verificacion.mjs`, sin PDF ni navegador (`leerDelTexto` no toca ninguno
de los dos): mismo patrón que `pruebas/logica.mjs`, cargando el fichero con `vm` de Node.

### El cuadro de elegir asunto, y "Por clasificar"

El cuadro para escoger un asunto a mano vive en **`js/elegir-asunto.js`** (`window.ElegirAsunto`)
y lo usan dos sitios: la bandeja de correos ("Elegir asunto") y "Por clasificar" ("Meter en un
asunto"). Se carga antes que `js/documentos-sueltos.js`, `js/bandeja-enlace.js` y
`js/papelera.js`.

- `elegir({titulo, cabecera, sugeridos})` monta el cuadro sobre `#capa`, con "Podrían encajar"
  arriba (solo si hay) y "Todos los asuntos" debajo, con buscador (`#enlace-buscar`,
  `#enlace-todos`), abiertos primero y archivados después con su etiqueta. Devuelve
  `{nombre, ficha}` o `null`. **La puntuación no se calcula aquí**: cada sitio mide su propio
  parecido y le pasa `sugeridos` ya hecho, porque de un correo se sabe mucho más que del nombre
  de un fichero.
- `preguntarSiReabrir(elAsunto, {explica, reabrir, sinReabrir})` es el cuadro de "Ese asunto
  está archivado", con los textos de cada sitio. Se abre cuando el otro ya está cerrado.
- Piezas comunes de puntuación: `trozosDelTercero`, `terceroDentroDe`, `puntosPorPalabras`,
  `puntosDeBase` (+15 abierto, +10 movido en 30 días), `mejores` (los que pasan de 40 puntos,
  como mucho cinco). Y `carpetaDelAsunto(nombre, ficha)`, que baja al ARCHIVO si está archivado.

**"Meter en un asunto"** (`App.meterSueltoEnAsunto`, en `js/documentos-sueltos.js`) es el tercer
botón de cada tarjeta de "Por clasificar", entre "Crear asunto con él" y "Borrar" (este último
se lo pone `js/papelera.js` por envoltura). Su puntuación de partida solo tiene el nombre del
fichero: +10 por cada palabra de cuatro letras o más (sin extensión, sin la fecha AAMMDD de
delante y sin el código de registro) que esté en el nombre del asunto, +40 si el nombre del
tercero del asunto sale en el nombre del fichero, +15 abierto y +10 movido hace poco. Desde la
fila 88 (21-sep-2026, ver más abajo "Sugerir un asunto ya existente"), si `js/documentos-sueltos-
lector.js` ya tiene un resultado en caché para ese fichero, se suma sin quitar nada: +50 si el
tercero leído es el del asunto, +10 si el tipo leído es el del asunto.

El traslado (`App.llevarSueltoA`) usa `Carpetas.moverFichero`, que copia, comprueba que la copia
pesa lo mismo y solo entonces borra: en Dropbox el `move()` del navegador no vale. Si ya hay un
fichero con ese nombre en el destino **no se pisa**; si la ruta pasa de
`App.LARGO_MAXIMO_NOMBRE` (180) se avisa y se deja decidir; si el traslado falla, el documento
sigue en "Por clasificar" y se dice con una línea. Si sale bien, se abre el cuadro de ponerle
nombre (`App.verDocumentos`), igual que al crear un asunto con un documento. Si el asunto
elegido está archivado se ofrece "Reabrir y meterlo aquí" (`App.reabrirAsunto`) o "Meterlo sin
reabrir", y entonces el fichero va a la carpeta del asunto dentro del ARCHIVO.

Se comprueba con `pruebas/documentos-sueltos.mjs`.

### "Por clasificar": el documento a la vista, marcado en la lista

(17-sep-2026, fila 25). Al abrir un documento suelto en el panel de la derecha, su tarjeta en la
lista de la izquierda queda marcada (`.tarjeta-abierta`, fondo y borde), la lista se desplaza sola
hasta ella si hace falta, y la cabecera del panel enseña su nombre completo (cortado por el medio,
no por el final, si no cabe: así se ve la extensión). Debajo de la cabecera van los mismos botones
de la tarjeta —Crear asunto con él, Meter en un asunto, Borrar—, y al terminar una acción el panel
se cierra solo si el documento ya no está en "Por clasificar".

- **`js/visor.js` no sabe nada de "Por clasificar"**: solo lleva un `marcador` (un texto
  cualquiera que pone quien abre, aquí `'suelto:<nombre>'`) y avisa (`Visor.alCambiar(fn)`) cada
  vez que cambia, al abrir o al cerrar. `Visor.marcadorAbierto()` lo devuelve en cualquier
  momento. `Visor.abrir(handle, nombre, {marcador, acciones})` acepta los dos como opcionales: sin
  ellos se comporta exactamente como antes (así lo siguen usando `js/ficha-asunto.js` y
  `js/unir-asuntos.js`, sin marcador ni acciones). `acciones` es un elemento que se cuelga en un
  hueco nuevo bajo la cabecera (`#visor-acciones`, `css/visor.css`).
- **`js/documentos-sueltos.js` traduce el marcador a la tarjeta de verdad**: se engancha a
  `Visor.alCambiar` (esperando a `DOMContentLoaded`, porque `js/visor.js` se carga después) y, con
  cada aviso, quita `.tarjeta-abierta` de todas y la pone en la que tenga
  `dataset.suelto === nombre`, con `scrollIntoView({behavior:'smooth', block:'nearest'})`. Al
  repintar la lista entera (`App.pintarSueltos`), cada tarjeta nace ya con la clase puesta si le
  toca, sin esperar al aviso.
- **Las acciones del panel no duplican nada**: `App.accionesDeSuelto(s)` construye la tarjeta
  entera con `App.tarjetaSuelto` (que a esa altura ya lleva el botón "Borrar" que le cuelga
  `js/papelera.js` por envoltura), le quita el botón "Abrir" —huelga, ya se está viendo— y
  devuelve su `.acciones`. Un solo sitio con la lógica de los tres botones.
- **El cierre solo si ya no está**: `App.pintarSueltos` empieza siempre comprobando si el
  marcador abierto es un `'suelto:...'` que ya no aparece en `App.E.sueltos`, y si es así llama a
  `Visor.cerrar()`. Como `App.verAbiertos` (que releva `App.E.sueltos` y llama a
  `App.pintarSueltos`) ya se llama tras crear un asunto, meter el documento en uno o borrarlo, no
  hace falta tocar esas tres acciones para nada.

Se comprueba con `pruebas/documento-a-la-vista.mjs`.

### Pulsar la tarjeta de un documento lo abre (20-sep-2026, fila 86)

En toda lista de la aplicación que enseñe un documento por su nombre, pulsar sobre la fila lo
abre, sin pasar por ningún botón:

- **"Por clasificar"** (`js/documentos-sueltos.js`, `App.tarjetaSuelto`): el `div` de la tarjeta
  lleva `onclick` a `App.abrirSuelto(s)` (que `js/visor.js` convierte en `Visor.abrir` con su
  marcador, como ya hacía el botón "Abrir" del menú). `.tarjeta-suelto` lleva `cursor: pointer` y
  el mismo realce que ya usa `.ficha-documento` al pasar por encima.
- **El cuadro de los documentos de la carpeta** (`js/documentos.js`, `pintarLista`; el «Documentos» de la tarjeta): este cuadro no tiene panel de
  la derecha (es un cuadro modal con su propio visor a la izquierda), así que pulsar la fila
  abre el mismo formulario que "Poner nombre" (`pintarFormulario({modo:'renombrar', ...})`), que
  ya enseña el documento mientras se rellenan los campos.
- **La bandeja de correos** (`js/bandeja-pantalla.js`, `tarjeta(item)`): solo cuando el correo
  trae su PDF (`d.pdf || d.pdfMensaje`) y hay `window.Lector`, la tarjeta entera hace lo mismo que
  el botón "Leer el correo" (clase `tarjeta-correo-pulsable`, `css/bandeja.css`).
- **La papelera** (`js/papelera.js`, `filaDePapelera`): un documento (`clase: 'documento'` o
  `'suelto'`) se puede ver sin sacarlo de la papelera, resolviendo el handle igual que hace
  `devolverDocumento` (`carpetaPapelera()` → `getDirectoryHandle(ficha.carpeta)` →
  `getFileHandle(ficha.nombre)`) y llamando a `Visor.abrir`. Clase `fila-papelera-pulsable`.
- **`js/ficha-documentos.js` ya cumplía** (el nombre es un `<button>` que llama a
  `abrirDocumento`), y por tanto también el ARCHIVO, que reutiliza esa misma pieza.
- **No se toca**: `js/duplicados.js` (enseña carpetas de asuntos, no documentos).

La condición que no se puede romper en todos los casos: el `onclick` de la fila comprueba
`ev.target.closest('button, a, input, select, textarea, label, .acciones')` antes de abrir nada,
así que ningún botón de la propia fila (ni el menú de tres puntos) dispara una apertura doble.

Se comprueba con `pruebas/documentos-sueltos.mjs` (test 7).

### Leer los documentos que entran en "Por clasificar" (17-sep-2026, fila 41,
### docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md)

Hasta ahora un documento suelto solo se podía abrir, borrar, o meter en un asunto (nuevo o ya
existente): el tipo, la fecha, el registro y el tercero los escribía Francisco a mano. Ahora la
aplicación lee el texto del PDF con pdf.js y **propone** lo que ha encontrado; nunca decide sola.
Sin OCR (un escaneado sin texto se queda exactamente como hoy), sin ningún servicio de inteligencia
artificial por internet, sin aprendizaje automático: el tipo se acierta contando coincidencias de
palabras clave.

- **Sacar el texto**: `RegistroLector.textoDe(fichero, topePaginas)` (nueva en
  `js/registro-lector.js`, 5 páginas por defecto), que reutiliza `cargarPdfJs` tal cual —no carga
  pdf.js dos veces ni copia cómo se saca el texto—. `textoHastaElSello` y `leerSello` no se tocan:
  el sello sigue exactamente igual que antes de esta fila. Antes de cargar pdf.js, `textoDe` mira
  los cinco primeros bytes del fichero (`fichero.slice(0,5).text()`) y solo sigue si son `%PDF-`:
  un fichero con extensión `.pdf` que no lo sea de verdad (un adjunto renombrado a mano, o el de
  mentira de las pruebas) ni se intenta abrir con pdf.js, así no hay avisos de su consola por
  ficheros que no son PDF.
- **El análisis, puro**: `js/lector-documentos.js` (`window.LectorDocumentos`), nuevo,
  `analizar(texto, contexto)` — sin tocar el disco, ni la pantalla, ni pdf.js, así se prueba con
  textos de mentira y listas fabricadas (`pruebas/lector-documentos.mjs`, cargado con `vm` igual
  que `pruebas/registro-sin-duplicar.mjs`, junto con `registro-lector.js`).
  - **Registro**: `RegistroLector.buscarEnTexto(texto)`, la misma función de siempre.
  - **Fecha**: la del sello si la hay; si no, la primera `dd/mm/aaaa`, `dd-mm-aaaa` o "17 de
    septiembre de 2026" del texto (con o sin tildes en el mes); si no aparece ninguna, se deja
    vacía — **nunca** la fecha de hoy.
  - **Documentos de identidad**: DNI (ocho cifras + letra) y NIE (X/Y/Z + siete cifras + letra),
    los dos con la letra comprobada contra la tabla `TRWAGMYFPDXBNJZSQVHLCKE` (el NIE cambia antes
    su X/Y/Z por 0/1/2); NIF de empresa (letra + siete cifras + control), sin comprobar el dígito
    de control (no lo pedía el encargo, y cada letra tiene su propia fórmula); Nº de identificación
    escolar, como cualquier tirada de 5 a 10 cifras sueltas (no tiene una forma fija que comprobar:
    solo cuenta si coincide con un alumno de verdad al cotejar).
  - **Tercero**: `contexto` trae tres listas ya montadas por quien llama (`alumnado`, `personal`,
    `empresas`), cada una `{ nombre, documento, persona }` — `persona` es el objeto tal cual que
    espera `App.fijarTercero`. Un documento que cuadra (comparado sin espacios ni guiones, en
    mayúsculas) vale más que un nombre que cuadra: el nombre solo se prueba si ningún documento ha
    coincidido, en las dos formas ("García Pérez, Ana" y "Ana García Pérez", por palabra entera). Si
    cuadran dos terceros distintos (por documento, o si no por nombre), no se propone ninguno.
  - **Tipo**: se cuentan, por palabras enteras (sin tildes ni mayúsculas, para que "baja" no
    dispare con "trabaja"), cuántas de las `palabrasClave` del tipo (más su propio nombre) aparecen
    en el texto; gana el que más tenga, y si empatan dos, no se propone ninguno.
- **Palabras clave por tipo**: clave nueva `palabrasClave` (lista de textos) en `tipos.json`,
  vacía en los tipos que ya existían, editable en la sección "Palabras clave" de la pantalla del
  tipo (ver más arriba, "Ajustes: tres pestañas..."), en `js/ajustes-tipo-palabras-clave.js`.
- **En "Por clasificar"**: `js/documentos-sueltos-lector.js`, nuevo, envuelve `App.tarjetaSuelto`
  igual que `js/papelera.js` con el botón Borrar —no toca `js/documentos-sueltos.js` por dentro—.
  Solo a los PDF (`PdfHerramientas.esPdf`, o la extensión si ese módulo no está), debajo del nombre:
  mientras se lee, una línea gris "Leyendo el documento…"; al terminar, lo encontrado separado por
  puntos (`26EM0368 · 10-sep-2026 · SOLICITUD · García Pérez, Ana`, con `Nombres.codigoRegistro`
  para el código y los mismos meses abreviados que `App.VERSION`); si no hay nada que proponer, o
  el fichero no se ha podido leer, la línea se quita entera y la tarjeta se queda exactamente como
  antes de esta fila. Cuando hay tipo **y** tercero, el botón "Aceptar" sale pegado a esa misma
  línea —no dentro de `.acciones`, que ya tiene su lista fija de botones comprobada en
  `pruebas/documentos-sueltos.mjs`— y llama a `App.crearAsuntoConPropuesta`.
  - **Solo se lee al abrir la pantalla**: `App.tarjetaSuelto` solo se llama con "Por clasificar" a
    la vista (desde `App.pintarSueltos` y desde `App.accionesDeSuelto`, del panel del visor), nunca
    al arrancar. Los ficheros se leen de uno en uno, con una cola en memoria (nunca en paralelo: la
    pantalla no se bloquea), cacheados por nombre de fichero —volver a la lista no vuelve a leer
    nada—; el contexto de `analizar` (tipos y las tres listas de terceros) se monta una sola vez
    por pantalla. Cómo se montan esas tres listas vive en `js/contexto-documentos.js`
    (`ContextoDocumentos.delCentro()`, 18-sep-2026, fila 49, sacada de aquí para que
    `js/bandeja-adjuntos-lector.js` la use también sin escribirla dos veces), apoyándose en la
    caché propia de `Datos.cargar`.
- **Crear el asunto de un clic**: `App.crearAsuntoConPropuesta(tipo, tercero, documentoSuelto)`
  (nueva en `js/asuntos-nuevo.js`, unas quince líneas) reutiliza tal cual el mismo camino manual:
  `App.E.pendiente` + `App.ir('nuevo')` + `App.elegirCategoria`/`elegirTipo`/`fijarTercero` (ya
  existentes) + el mismo `$('btn-crear').onclick()` de siempre —con su aviso de asunto duplicado
  (`js/duplicados.js`) funcionando igual—. `js/campos.js` no se ha tocado: los campos propios del
  tipo ya se rellenan solos al fijar el tercero (`App.pintarCamposDelTipo`), sin nada nuevo que
  hacer aquí.
- `js/ajustes-tipo.js` (429 líneas) y `js/asuntos-nuevo.js` (en torno a 895) ya pasaban de las 400
  líneas antes de esta fila —pantallas de un solo módulo, mismo criterio que se dejó para
  `js/ajustes.js` en la fila 39—: el añadido de esta fila en cada uno es una veintena de líneas de
  enganche a un módulo nuevo, sin repetir ninguna lógica, así que no se han partido.
- Un documento que no sea PDF (Word, imagen, hoja de cálculo) ni se intenta leer.

Se comprueba con `pruebas/lector-documentos.mjs` (los 6 escenarios de la instrucción, sin pdf.js ni
navegador) y con la batería completa en verde (`pruebas/documentos-sueltos.mjs`,
`pruebas/ajustes-por-tipo.mjs` actualizada a las ocho secciones).

### Sugerir un asunto ya existente (21-sep-2026, fila 88, docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md)

Lo leído de un documento suelto (arriba) solo servía para crear un asunto nuevo. Con tercero
reconocido, se mira además si ese tercero ya tiene asuntos, y se ofrecen para meter el documento
dentro sin crear uno nuevo.

- **`js/documentos-sueltos-sugerencias.js`** (`window.SugerenciasAsuntoExistente`) no envuelve
  nada: `js/documentos-sueltos-lector.js` lo llama directamente (`calcular(propuesta)`), en el
  mismo paso de su cola, justo después de leer el PDF y solo si `propuesta.tercero` está puesto.
  Guarda el resultado en `propuesta.sugerencias`.
- **De qué tercero es un asunto**: se compara por documento —Nº de identificación escolar del
  alumnado, los cuatro últimos caracteres del documento del personal, o el NIF de una empresa: el
  mismo código que `js/nombres.js` pega al final del nombre de la carpeta— cuando los dos lados
  lo tienen; si no, por el nombre (`ElegirAsunto.terceroDentroDe`, la misma pieza de "Meter en un
  asunto"). Los terceros relacionados no cuentan, solo `ficha.tercero`.
- **Abiertos**: se miran en `App.E.listaAbiertos`, ya en memoria. Hasta tres: primero los del
  tipo que ha propuesto el lector, después los demás (marcados «otro tipo»); dentro de cada
  grupo, el que se movió más recientemente primero (`ElegirAsunto.cuandoSeMovio`). Sin tipo
  propuesto, todos sin marca, por reciente.
- **Archivados**: solo cuando no hay ningún abierto, y solo con el índice guardado del ARCHIVO
  (`IndiceArchivo.leerDisco()`) — nunca recorriendo el ARCHIVO carpeta a carpeta. Sin tipo
  propuesto, o sin índice (no hecho, roto, o de otra versión), no se sugiere ningún archivado.
  Hasta tres, del tipo propuesto, el más reciente primero (por `cerradoEl`, o si no por la fecha
  AAMMDD del nombre de la carpeta).
- **En la tarjeta**: debajo de la línea de lo leído, una línea por sugerencia («Podría ir en:
  *nombre*», con «otro tipo» o «archivado» si toca) y su botón «Meter aquí» —el destacado de la
  línea—. Con alguna sugerencia, "Aceptar" (que crea el asunto nuevo) pasa a llamarse «Crear
  asunto nuevo» y a discreto; sin ninguna, se queda exactamente como antes de esta fila.
- **«Meter aquí»** llama a `App.meterSueltoEnAsuntoElegido(s, sugerencia)`, sacada de
  `App.meterSueltoEnAsunto` (`js/documentos-sueltos.js`) para no repetir el mismo camino (mover el
  documento, o preguntar "¿reabrir?" primero si el asunto está archivado).
- **"Meter en un asunto" también usa lo leído** (punto 8 del encargo): `App.parecidoDelSuelto`
  suma +50/+10 a su puntuación de siempre si el lector ya tiene resultado en caché para ese
  fichero (ver más arriba). `window.LectorDeSueltos.resultadoDe(nombre)` expone ese resultado
  (`undefined` si no se ha leído aún, `null` si se leyó y no había nada), y
  `SugerenciasAsuntoExistente.esDelMismoTercero(tercero, terceroCandidato)` queda exportado para
  no repetir la comparación de documento/nombre en los dos sitios.

Se comprueba con `pruebas/sugerir-asunto-existente.mjs`, en navegador de verdad: un abierto del
mismo tipo (sin marca); cuatro abiertos, dos del tipo propuesto y dos de otro (salen tres, el
tercero con «otro tipo»); sin abiertos, con archivados del mismo tipo y uno de otro (con
«archivado», y "Meter aquí" pregunta si reabrir); un abierto y un archivado del mismo tercero
(solo sale el abierto); sin tercero reconocido (la tarjeta, igual que antes de esta fila); y que
"Meter en un asunto" pone arriba los asuntos del tercero leído.

