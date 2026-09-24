# La bandeja de Gmail, sus adjuntos, las plantillas de correo y el cuadro de Séneca

Documento hijo de `docs/CONTEXTO.md` (fila 65, `docs/DOCUMENTOS-QUE-QUEPAN.md`, 19-sep-2026). Actualízalo al tocar la bandeja de correos, sus plantillas, o el mensaje/ayudante de Séneca. El índice general, las reglas de código comunes y la tabla de ficheros del repositorio están en el propio `docs/CONTEXTO.md`.

---

### Lo que deja un correo dentro del asunto

- La nota de un correo son dos líneas: quién y cuándo, y debajo el asunto del correo. El enlace
  no se escribe en el texto: se guarda aparte (`enlace`, `enlaceTexto`, `correo`) y se enseña
  como botón "Abrir en Gmail" (`Notas.anadir`).
- Un correo no entra dos veces (`Notas.yaTieneCorreo`).
- Los adjuntos entran con nombre de la casa: `AAMMDD ADJUNTO …`.
- Los documentos de la ficha van en dos grupos, "Del expediente" y "Llegados por correo" (los
  rótulos solo salen cuando hay de las dos clases); lo de correo se reconoce por el nombre
  (CORREO, HILO o ADJUNTO).
- Las fechas que trae el correo se recortan a `AAAA-MM-DD` al leer la bandeja.

Se comprueba con `pruebas/correos.mjs`.

### De un correo a un asunto

En Gmail, la etiqueta `GESTOR` en un correo lo pone a disposición: un script de Apps Script lo
recoge cada 5 minutos y deja su ficha, el hilo en PDF y los adjuntos en la carpeta
`GESTOR-BANDEJA` de Drive. La aplicación lee esa carpeta y propone tercero, tipo y fecha.
"Leer el correo" abre el PDF del hilo en el panel de la derecha. **Gmail no se deja meter dentro
de otra página.** Cada usuario tiene su propia bandeja. Desde el 20-sep-2026 (fila 86), si el
correo trae su PDF, pulsar la tarjeta entera hace lo mismo que ese botón (clase
`tarjeta-correo-pulsable`, `css/bandeja.css`, guardia de botones igual que en "Por clasificar":
ver `docs/contexto/DOCUMENTOS.md`). Los adjuntos sueltos del correo no se enseñan por su nombre en
ningún sitio (solo entran, ya leídos, en la línea "Del documento" de la propuesta), así que no
hay nada más que pulsar ahí.

**En pantalla** (desde el 17-sep-2026, fila 27, `docs/CORREOS-DENTRO-DE-POR-CLASIFICAR.md`) vive
dentro de "Por clasificar" (`#zona-clasificar`, encima de `#lista-sueltos`), detrás de una barra
plegable "Correos sin clasificar (N)" (`#btn-correos-sin-clasificar`/`#bandeja-correos`, ambos
nacidos en `index.html`, ya no creados por JavaScript). Se despliega y se pliega al pulsarla, y
**siempre arranca plegada** al entrar en la vista (`App.irVista`, en `js/asuntos-lista.js`; sin
memoria en `localStorage`, a propósito, y sin `<details>`: mismo patrón que el plegado de
"Filtros", `engancharFiltros()` en `js/vista.js`). La lectura de correos (`mirar()`, cada
`SEGUNDOS_ENTRE_MIRADAS`) no sabe nada del plegado y sigue corriendo igual; el número de la barra
se actualiza aunque no se esté mirando esa vista (a propósito, al contrario que `App.pintarSueltos`,
que si sale antes de pintar la lista si la vista no es "clasificar"). La caja de envíos
(`#bandeja-envios`, "Borrador en camino") se queda donde estaba, debajo de las tres tarjetas,
anclada explícitamente a `paneles.nextSibling` (antes se anclaba a `$('bandeja-correos')` si
existía; dejó de tener sentido al dejar `#bandeja-correos` de ser hermana de `.paneles`).

Pintar la bandeja (la barra, la caja, cada tarjeta, la línea de "ya guardado") vive en
`js/bandeja-pantalla.js`, separado de `js/bandeja-correos.js` (1.478 líneas) para no seguir
engordándolo: se habla con `window.Bandeja` (leer los correos, adivinar, guardar, descartar...),
al que se le han añadido las piezas que le faltaban (`correos`, `asuntoDeLaMatricula`,
`asuntoDeEsteCorreo`, `proponer`, `llevarANuevo`, `leerElCorreo`, `enlaceAGmail`, `descartar`,
`borrarDeLaBandeja`, `mirarDeNuevo`, `pedirPermiso`, `soloElDia`, `fechaLegible`,
`fechaHoraLegible`, `sobre`), sin renombrar ni quitar las que ya usaban `js/bandeja-enlace.js` y
`js/correo-adjuntos.js`.

De cada correo, la tarjeta morada mira en este orden (17-sep-2026, fila 18, "Un mismo correo en
dos buzones"):

1. **La huella por identificador de hilo**, el propio o el del hilo al que responde
   (`respuestaDe`). Si el `id` ya está en el `hilos` de algún asunto, la tarjeta dice "Respuesta
   de <asunto>" y su botón principal es "Guardar en ese asunto". El identificador de hilo es de
   cada buzón: solo puede coincidir en el buzón que enganchó el correo.
2. **La huella por matrícula.** El `Message-ID` de un mensaje es el mismo en todos los buzones
   por los que pasa (al contrario que el identificador de hilo), así que es lo único que permite
   al buzón del compañero reconocer un correo que **el otro** ya guardó. Si alguna matrícula del
   correo coincide con alguna matrícula de algún `hilos` y el identificador de hilo **no** ha
   encajado en el paso 1, no es un correo que atender: en vez de tarjeta, sale una **línea
   gris**, aparte, debajo de las tarjetas normales: "Ya está en el asunto «...» · lo metió Juan
   el 17-sep-2026 · 09:14", con "Abrir el asunto" (si sigue abierto) y "Quitar de mi bandeja"
   (borra los ficheros de esta bandeja, nunca por la papelera: el correo de verdad sigue en
   Gmail). Si el correo les ha llegado a los dos y ninguno lo ha guardado todavía, los dos ven su
   tarjeta normal: no hay ninguna coordinación inventada entre buzones.
3. **El texto del asunto.** Si el asunto del correo (sin `Re:`/`RV:`/`Fwd:`) lleva dentro el
   nombre de un asunto de `asuntos.json`, con al menos 12 letras por los dos lados, también se
   ofrece guardarlo ahí.
4. **Nada.** Entonces el botón principal es "Crear el asunto".

En los casos 1, 3 y 4 hay además un botón **"Elegir asunto"** (`js/bandeja-enlace.js`), que abre
el cuadro compartido de `js/elegir-asunto.js` (ver "El cuadro de elegir asunto", más abajo). Si el
elegido está archivado se ofrece "Reabrir y guardar aquí" o "Guardar sin reabrir". **Nunca se
guarda nada solo: siempre hay que pulsar.**

La puntuación de parecido de un correo suma: +50 si una dirección del correo es la del tercero
del asunto o de uno de sus relacionados, +40 si el nombre del tercero aparece escrito en el
correo, +10 por cada palabra de cuatro letras o más del asunto del correo que esté en el nombre
del asunto, +15 si el asunto está abierto y +10 si se movió en los últimos 30 días. Se enseñan
los que pasen de 40 puntos.

#### `hilos`, en la ficha del asunto

Al guardar un correo en un asunto —por el camino que sea— se apunta la huella en su ficha de
`_GESTOR/asuntos.json`:

    hilos: [ { id: "<id del hilo de Gmail>", asunto: "<asunto limpio, en minúsculas>", visto: 2,
               matriculas: [ "<message-id>", ... ], metidoPor: "<usuario>", metidoEl: "<ISO>" } ]

`visto` es cuántos mensajes tenía el hilo al guardar. `matriculas` son los `Message-ID` del
correo que se guardó (las del correo, no acumuladas de guardados anteriores); `metidoPor` y
`metidoEl` son quién lo guardó y cuándo, para la línea gris. Si el `id` ya estaba, se actualiza la
huella entera en vez de añadir otra entrada. Un asunto puede tener varios hilos; un hilo pertenece
a un solo asunto (al cambiarlo de asunto, el `id` se quita del viejo). `hilos` **es opcional**:
los asuntos de antes del 16-sep-2026 no lo tienen; `matriculas`, `metidoPor` y `metidoEl` también
lo son, para los hilos de antes del 17-sep-2026. Todo sigue funcionando igual sin ellos: no se
saca línea gris, y en la propia línea no sale "lo metió undefined" ni nada por el estilo. Se
escribe con `App.anotar`, que relee el fichero antes y guarda con `Copias.guardar`.

#### `seguidos.json`, para el recolector

Cada vez que cambia una huella, la aplicación reescribe entero `seguidos.json` en la carpeta de
la bandeja: `{ "hilos": [ { "id": ..., "visto": ..., "asunto": ..., "matriculas": [...] } ] }`.
Las matrículas de todas las huellas que compartan identificador de hilo se juntan sin repetir
(`js/bandeja-correos.js`, `escribirSeguidos`). En cada pasada, el script de Apps Script hace lo de
siempre con la etiqueta `GESTOR` y **después** lee ese fichero y, para cada entrada, busca el
hilo: primero por `GmailApp.getThreadById(id)` (el buzón que lo enganchó); si no sale, por
matrícula, de la última a la primera, con `GmailApp.search('rfc822msgid:' + m)` (el buzón del
compañero, que no tiene ese `id`). Si tiene más mensajes que lo visto **en este buzón**, lo
recoge otra vez. Así vuelven a la bandeja las respuestas del tercero y también los correos que
manda Francisco desde Gmail, en cualquiera de los dos buzones. Si el hilo no aparece en ninguno de
los dos sitios, se salta sin ruido; si `seguidos.json` no está o está roto, el script sigue con su
trabajo normal.

**La cuenta de mensajes vistos es de cada buzón**, guardada en el propio proyecto de Apps Script
(`PropertiesService.getScriptProperties()`, clave `'visto:' + <id local>`), nunca comparada
directamente con el `visto` de `seguidos.json`: el mismo hilo puede tener un número de mensajes
distinto en cada buzón (correos internos, borradores, reenvíos que no están en los dos sitios), y
compararlo a ciegas haría que el hilo se recogiera cada minuto para siempre, o que no se recogiera
nunca. Solo la primera vez que se sigue un hilo, sin cuenta propia todavía, se parte del `visto`
compartido (o 1).

Esas fichas traen dos campos más: `respuestaDe` (el `id` del hilo) y `enviado: true` cuando el
último mensaje lo mandó el propio usuario, que es lo que hace que la tarjeta diga "Lo enviaste
tú". Y las matrículas de todos los mensajes del hilo: `matriculas` (sin repetir) y `matricula`
(la del último mensaje, el que acaba de llegar).

#### Qué entra en la carpeta del asunto

- `AAMMDD CORREO <asunto recortado>.pdf` — el mensaje nuevo, él solo (campo `pdfMensaje`).
- `AAMMDD HILO <asunto recortado>.pdf` — el hilo entero (campo `pdf`). **Se sustituye**: el
  anterior del mismo hilo va a la papelera, no se acumulan copias del hilo completo.
- `AAMMDD ADJUNTO <nombre>` — cada documento adjunto.

En un hilo de un solo mensaje no hay `pdf`: ese PDF entra ya como `CORREO`. La ficha del asunto
reconoce los tres por su nombre (`DE_CORREO`, en `js/ficha-asunto.js`) y los enseña en el grupo
"Llegados por correo".

El script vive en `apps-script/gestor-correos.gs`, pero **Apps Script no se despliega desde
aquí**: Francisco lo pega a mano en `script.google.com` (las tres primeras líneas del fichero
dicen cómo).

**"Último correo recogido"**, en el bloque de la bandeja de correos de Ajustes: la fecha del
propio fichero más nuevo que haya en la carpeta (da igual que sea un `.json`, un PDF o un
adjunto), no algo leído de dentro de ningún fichero. Nació el 17-sep-2026 al descubrirse que el
recolector llevaba seis días dejando los correos en una `GESTOR-BANDEJA` distinta de la que leía
la aplicación (el script solo busca en la raíz del Drive; alguien había movido la de verdad
dentro de otra carpeta, y se creó una nueva sin avisar de nada). Con más de 3 días sin moverse,
la línea pasa a avisar. Vive en `js/bandeja-correos.js`, `pintarUltimoCorreoRecogido`.

### El correo y la mensajería de Séneca

Un solo botón "Comunicar" en la cabecera de la ficha (fila 52) abre "Correo electrónico" o
"Mensaje de Séneca" (`js/correo.js`, `abrirCuadro(a, deSeneca)`). El mensaje de Séneca sigue sin
enviarse desde la aplicación: se prepara y se copia. El correo de un asunto sí se envía de
verdad desde el propio cuadro (ver "Mandar los documentos de un asunto por correo", más abajo).
Al copiar el texto o abrir la ventana de redactar se apunta sola una nota (una sola vez por
cuadro).

Los dos cuadros viven cada uno en su propio fichero, sacados de `js/correo.js` (que llegó a pasar
de las 800 líneas) para que se vean enteros: mismo ancho hasta 1100px y dos columnas a partir de
900px. `js/correo.js` se queda solo con lo que comparten los dos —el asunto y el cuerpo con su
plantilla, a quién se escribe en palabras, el rastro que se apunta en las notas— expuesto en
`window.CorreoNucleo`; `abrirCuadro`/`pintarCuadro` deciden cuál tocaba y preparan lo común
(persona, plantillas, valores) antes de llamar al que sea.

- **`js/seneca-cuadro.js`** (fila 53, 18-sep-2026, docs/SENECA-CUADRO-ANCHO.md): izquierda,
  destinatarios (`js/seneca-destinatarios.js`) y el asunto (un `<textarea>` que crece entre 2 y 5
  renglones, con su cuenta de caracteres); derecha, la plantilla y el texto del mensaje. Sin
  campo "Para": en Séneca los destinatarios se marcan en la propia lista de Séneca, y lo que
  ayuda es acordarse de a quién (`CorreoNucleo.aQuien`). Dos botones numerados, cada uno copia
  siempre lo suyo, se pulsen en el orden que se pulsen: "1. Copiar el asunto" y "2. Copiar el
  texto" (recorta a `MAXIMO_LETRAS_SENECA`, 4000, con aviso). El ayudante de instalación
  (`js/seneca-ayudante.js`) sale siempre a la vista; su explicación, plegada en un `<details>`.
- **`js/correo-cuadro.js`** (fila 58, 18-sep-2026, docs/AJUSTES-DE-USO-2026-09-18.md, 5): el
  problema que resolvía era que el cuadro salía muy alto y estrecho, y la lista de "Documentos de
  este asunto" (`js/correo-adjuntos.js`, que ya la pintaba desplegada, con casilla y tamaño) se
  quedaba fuera de la pantalla. Izquierda: "Para" (con casillas, "Otro correo", "Añadir un
  grupo", la copia oculta) y el asunto, y debajo los documentos que se adjuntan; derecha, la
  plantilla y el cuerpo. `.cuadro-correo` (`css/correo.css`) fija la cabecera y la botonera: solo
  `#cuadro-cuerpo` se desplaza (`flex: 1 1 auto; overflow-y: auto`), igual de acotado en alto que
  `.cuadro-ancho`, para que el título y "Abrir en Gmail"/"Abrir en el correo del ordenador" nunca
  se salgan de la pantalla. Este fichero pasa a ser dueño de "Para" (`elegidos`), la copia oculta
  de los grupos (`cco`/`ccoSinCorreo`) y los últimos documentos adjuntados, reiniciados en cada
  `cuerpoHtml()` (mismo patrón que `SenecaCuadro`); `window.CorreoCuadro` expone `paraDelCuadro`,
  `ccoDirecciones` y `documentosAdjuntados` para que `textoDeLaNota` (en `js/correo.js`) arme el
  rastro. Desde la fila 115, además pinta y gobierna el resumen de envío (ver abajo).

Se comprueba con `pruebas/seneca-cuadro-ancho.mjs` (Séneca) y con `pruebas/asunto-sin-eleccion.mjs`,
`pruebas/plantillas.mjs`, `pruebas/envios.mjs` y `pruebas/grupos-navegador.mjs` (Correo: los dos
cuadros comparten los mismos ids de siempre —`#correo-asunto`, `#correo-cuerpo-texto`,
`#correo-plantilla`, `#correo-otro`, `#correo-grupo`, `#correo-cco-caja`, `#adjuntos-lista`—, así
que ninguna de esas pruebas tuvo que cambiar de selectores, solo de disposición).

### Mandar los documentos de un asunto por correo (24-sep-2026, fila 115,
### `docs/ENVIAR-DESDE-EL-ASUNTO.md`)

Gmail no deja que una página web le enganche ficheros, así que el envío pasa por una segunda
aplicación: una aplicación web de Apps Script (`apps-script/gestor-correos.gs`, `doPost`) que el
navegador llama **directamente**, sin carpeta intermedia ni revisión periódica. Sustituye al
"borrador con documentos" de la fila del 16-sep-2026: aquel mecanismo dejaba el encargo en
`GESTOR-BANDEJA` y Apps Script no siempre lo recogía. **Esto cambia una regla de siempre**: desde
esta fila la aplicación sí envía correo de verdad, pero solo tras una confirmación explícita.

- **`js/correo-adjuntos.js`** (`window.CorreoAdjuntos`, reducido a unas 100 líneas): pinta el
  bloque "Documentos de este asunto" con una casilla por fichero (desmarcadas de partida), suma
  el tamaño de lo marcado (`totalBytesDe`, `tamanoLegible`) y pasa un fichero a base64
  (`aBase64`, con `FileReader.readAsDataURL`) cuando toca enviar. Ya no copia nada a ninguna
  carpeta ni escribe ningún `.json` de encargo.
- **`js/correo-cuadro.js`**: el cuadro de Correo tiene dos bloques HERMANOS,
  `#correo-formulario` y `#correo-resumen`, que se alternan con la clase `oculto` (nunca un
  segundo `U.preguntar`: solo hay una capa de diálogo en toda la aplicación). El botón
  **"Enviar"** (`alPulsarEnviar`) comprueba que hay destinatario y que lo marcado no pasa de
  **20 MB** (si pasa, aviso y no se hace nada), y pinta el resumen (`pintarResumen`): Para, Copia
  oculta, Asunto, primeras líneas del cuerpo (`primerasLineas`) y los documentos con su tamaño.
  "Volver" no pierde nada de lo escrito a mano. **"Confirmar y enviar"** (`confirmarEnvio`) pasa
  los documentos marcados a base64 y llama a `CorreoEnviar.enviar(...)` con `para`, `cco`,
  `asunto`, `cuerpo`, `hilo` y `adjuntos`.
- **`js/correo-enviar.js`** (nuevo, `window.CorreoEnviar`): guarda la dirección de la aplicación
  web **en este navegador** (`localStorage`, nunca en `_GESTOR`: cada persona conecta su propia
  cuenta de Google, igual que `js/copiar-ruta.js` con la ruta de las carpetas) y hace la llamada
  (`fetch`, `POST`, `Content-Type: text/plain` a propósito, para que el navegador la trate como
  petición "simple" y no dispare la consulta previa CORS, que Apps Script no contesta). También
  monta el bloque **Ajustes → Mantenimiento → "Enviar correo"**, con los cinco pasos para
  conectar la cuenta (copiar el script, publicarlo como aplicación web con acceso «Cualquier
  usuario», copiar la URL `/exec` de «Gestionar implementaciones», sacar la clave con
  `prepararEnvio()`, pegar `URL?k=clave` y "Probar"), y el de siempre al pegar código nuevo
  («Gestionar implementaciones» → lápiz → «Nueva versión»: la dirección no cambia). Desde la fila
  117, `CorreoEnviar.problemaDeDireccion(url)` rechaza sin llamar a Google una dirección `/dev`
  (la de pruebas del editor, que solo funciona con la sesión del dueño abierta) o sin `?k=`, con
  aviso rojo, al guardar, al probar y al enviar.
- **La cuenta propia en el script es `miCorreo()`** (fila 117): `Session.getEffectiveUser()` (la
  que ejecuta, «Ejecutar como: Yo»), y solo si viniera vacía, `getActiveUser()`. Con acceso
  «Cualquier usuario», `getActiveUser()` llega vacía y «Probar» decía «No hay ningún
  destinatario». La usan la prueba, el «Para» de un envío solo con copia oculta, `guardarHilo`,
  `direccionesDelHilo`, `enlaceAlHilo`, `enlaceABorradores` y `carpetaBandeja`.
  `prepararEnvio()` ya no da la dirección de `getUrl()` si es `/dev` (lo es siempre ejecutada
  desde el editor): deja la clave sola y dice de dónde copiar la `/exec`.
- **`apps-script/gestor-correos.gs`, `doPost(e)`**: exige la clave (`e.parameter.k` o el cuerpo)
  contra la que guardó `prepararEnvio()` en `PropertiesService`; si no coincide, error. Llama a
  `enviarCorreo(cuerpo)`, que decide el hilo con `hiloParaResponder(hiloId, para, cco)`: **solo
  responde DENTRO de un hilo existente si TODOS los destinatarios pedidos (Para + Copia oculta)
  ya han recibido algún mensaje de ese hilo** (`direccionesDelHilo`); si se añade a alguien
  nuevo, correo nuevo, para no mezclar destinatarios sin que nadie lo haya decidido. Manda con
  `GmailApp.createDraft(...).send()` o `createDraftReply(...).send()`: el correo sale en el
  momento, no queda como borrador.
- El rastro reutiliza `apuntarElRastro` de `js/correo.js`: tras un envío de verdad, la nota dice
  "Correo enviado a…" (no "preparado") y no repite el aviso de guardar el PDF si ya se ha
  enviado (`window.CorreoNucleo.marcarEnvioRealizado`).
- **`js/bandeja-correos.js` ya no vigila nada de esto**: la sección entera de "Borrador en
  camino" (revisión cada 15 segundos, tarjeta, `.listo.json`/`.error.json`) se quitó. Solo queda
  `limpiarEnviosViejos()`, que se ejecuta una vez al arrancar y borra cualquier resto de
  `envios.json`/`.envio.json`/`.listo.json`/`.error.json` de antes de esta fila.
- **"Abrir en Gmail" y "Abrir en el correo del ordenador"** siguen tal cual, como opciones
  secundarias sin adjuntos (para cuando no interesa conectar la aplicación web, o hay que
  adjuntar algo que no está en la carpeta del asunto).

Se comprueba con `pruebas/envios.mjs` (navegador de verdad, `fetch` simulado con
`page.route` de Playwright, nunca una URL real), `pruebas/envio-apps-script.mjs` (la lógica de
`doPost`/`enviarCorreo`/`hiloParaResponder`, con `vm` y `GmailApp`/`PropertiesService` de
mentira) y `pruebas/correo-enviar.mjs` (`leerUrl`/`guardarUrl`/`enviar`/`probar`, con `vm` y
`fetch`/`localStorage` de mentira). Ningún correo real se ha podido mandar en las sesiones que
prepararon esta fila: no hay cuenta de Google en ese entorno; los pasos que Francisco tiene que
comprobar a mano están en `docs/COMPROBAR-A-MANO.md`.

### Plantillas de correo y de mensaje de Séneca

Una plantilla es **solo el cuerpo del medio**: el saludo y la despedida los sigue poniendo
`js/correo.js`, solos. La misma plantilla sirve para el correo y para el mensaje de Séneca; se
crean en Ajustes, pegadas a un tipo de asunto, y se guardan en `_GESTOR/plantillas.json`
(`js/plantillas.js`, `window.Plantillas`), compartido con el compañero.

- **El fichero**: `{ firma, centro, lista: [{ id, tipo, categoria, nombre, texto }] }`. `firma` y
  `centro` sustituyen a lo que hasta el 16-sep-2026 estaba escrito a mano en `js/correo.js` (la
  constante `CENTRO` y el `'Un saludo.'` de `cuerpoDelCorreo`); si el fichero no existe, sale eso
  mismo de partida y se crea de verdad al primer guardado. **Se relee cada vez que se abre el
  cuadro de Correo, sin caché entre aperturas**: es un fichero compartido, y releerlo una vez por
  cuadro no cuesta nada.
- **Los huecos**, entre llaves: `{nombre}` (el tercero sin su número ni su NIF), `{grupo}`,
  `{curso}`, `{tipo}`, `{hoy}`, `{limite}`, `{usuario}` (`App.E.usuario`), `{centro}`, y
  `{campo:LO QUE SEA}` para un campo propio del tipo (por su nombre, buscado con `Campos.
  nombreDeCampo` sobre `App.E.campos.porTipo`). `Plantillas.rellenar(texto, valores)` los
  sustituye: uno sin valor se deja **vacío** (nunca se escribe `{grupo}` en lo que le llega al
  tercero) y se apunta en la lista de "faltan"; uno que no se reconozca se deja tal cual, también
  apuntado, para que un hueco mal escrito no rompa nada. Las llaves se comparan con
  `U.normalizar` (sin mayúsculas ni acentos), nunca al sustituir.
- **En el cuadro de Correo y en el de Séneca** (los dos, `js/correo.js`): un desplegable
  "Plantilla" encima del cuerpo, dentro de `camposComunes`/`interiorDeComunes`, en su propio
  `#correo-comunes` para poder repintarse solo sin tocar el "Para" ni los documentos. Con una
  plantilla, sale puesta; con varias, sale la primera; sin ninguna, el desplegable no se pinta y
  el cuerpo sale como siempre. Encima del cuerpo, si falta algún dato, un aviso ámbar "Faltan
  datos: …". **Cambiar de plantilla con algo escrito a mano pregunta antes de pisarlo — en línea,
  dentro del propio cuadro (`#correo-plantilla-confirmar`), nunca con un segundo `U.preguntar`**:
  solo hay un cuadro de diálogo en toda la aplicación, y este ya está ocupado por el de Correo.
  En Séneca, al copiar el texto (paso 2 de `engancharSeneca`) se recorta a **4.000 letras** si
  hace falta, avisando en una línea.
- **En Ajustes**, bloque propio "Plantillas de correo" (vive entero en `js/plantillas.js`, no
  toca `js/ajustes.js`, que ya pasa de 47 KB: se engancha solo con `window.Gestor.alRefrescar`,
  igual que `js/bandeja-correos.js` y `js/unir-asuntos.js`). Lista con buscador cruzado, alta y
  edición en un `U.preguntar` con un botón "Insertar hueco" (ver más abajo) y una vista previa
  en vivo (con el primer asunto abierto de ese tipo, o datos de muestra si no hay ninguno).
  Bloque aparte para la firma y el centro. **El borrado pasa por `Papelera.mandarDato` para dejar
  rastro, pero `js/papelera.js` no sabe devolver la clase `'plantilla'`** (no estaba en la lista
  de ficheros del encargo): cae en su "No sé devolver esto." Si hace falta devolver una borrada,
  hay que copiarla a mano desde el bloque Papelera de Ajustes.

Se comprueba con `pruebas/plantillas.mjs`. El bloque de pantalla vive en `js/plantillas-ajustes.js`
(se sacó de `js/plantillas.js` el 16-sep-2026, al crecer con el motor de las plantillas de
documento, para no pasar de 450 líneas): usa la API pública de `Plantillas` (`cargar`, `guardar`,
`deTipo`, `idNuevo`, `rellenar`, `HUECOS`...), no toca nada privado.

### Las plantillas de correo y de documento del centro, ya escritas (20-sep-2026, fila 83,
docs/PLANTILLAS-DEL-CENTRO.md)

Los textos ya no salen en blanco: el centro tiene sus propias plantillas escritas, en el
repositorio, y se cargan con un botón, sin que Francisco tenga que escribir ni subir nada a
mano.

- **`plantillas/*.md`**: cada plantilla, como texto, con un frontmatter (`nombre`, `tipo`,
  `categoria`; y, solo si es de documento, `tipoDocumento`, `texto`, `firmante`, `vistoBueno` y,
  opcional, `id`). Un `id` fijo (fila 124) pasa a `indice.json` y es el que recibe la plantilla al
  cargarla, si nadie lo usa ya: así un paso de `datos-biblioteca/biblioteca-centro.json` la puede
  citar en `plantillasDocumento` antes de que exista (hoy solo `pd-centro-renuncia-junta-electoral`).
  Un bloque que solo lleva `~` es un párrafo vacío, para dejar aire.
  `scripts/hacer-plantillas.mjs` (se ejecuta a mano, nunca en Vercel ni en las pruebas) convierte
  cada una en su `.docx` (montado a mano, como un ZIP, con lo mínimo que Word necesita) y escribe
  `plantillas/indice.json`, la lista de todas con sus datos.
- **Huecos, con doble llave**: `Plantillas.rellenar` gana un paso previo genérico
  (`resolverHuecosDobles`, fila 81) que resuelve cualquier hueco reconocido escrito `{{ASÍ}}`,
  no solo los de una sola llave: así `{{NOMBRE NATURAL}}` encuentra la clave `nombreNatural` del
  catálogo (la comparación ignora espacios además de mayúsculas y tildes), sin tener que escribir
  el mismo hueco de dos formas. `{{FORMULARIOS}}` (fila 83) es el último: los formularios del tipo
  y de los hitos del asunto (fila 82), uno por línea, con su nombre y su dirección si la tiene.
  **Un párrafo que solo tenía un hueco y se queda vacío al rellenar desaparece del todo**
  (`js/docx.js`, `rellenarXml`), en vez de dejar una línea en blanco suelta en el papel.
- **"Cargar las plantillas del centro"** (Ajustes → Mantenimiento, dentro de
  `js/plantillas-documento.js`, mismo patrón que "Cargar la biblioteca del centro" de la fila 80):
  lee `plantillas/indice.json`, descarga cada `.docx` y lo escribe en `_GESTOR/PLANTILLAS`, y da
  de alta su fila en `plantillas.json` (`documentos` o `lista`, según su `clase`). Fusiona y no
  pisa: una plantilla con el mismo nombre y tipo que una ya existente se deja como está.

Se comprueba con `pruebas/plantillas-del-centro.mjs`: que `indice.json` cite ficheros que
existen, que cada `.md` traiga su frontmatter completo, que todo hueco usado en los cuerpos esté
en el catálogo (la prueba que de verdad importa: un hueco mal escrito sale tal cual en el papel),
que cada `.docx` se pueda releer, que `{{FORMULARIOS}}` vacío no deje una línea suelta, y que todo
`plantillasDocumento` de la biblioteca del centro cite un `id` de `indice.json` (fila 124).

**Renuncia a formar parte de la Junta Electoral** (fila 124, `plantillas/renuncia-junta-electoral.md`):
OTROS · ELECCIONES CONSEJO ESCOLAR, tipo de documento RENUNCIA. La app rellena membrete, centro,
curso y lugar y fecha; los datos de quien renuncia van en blanco (el asunto es del centro). La
persona se nombra en neutro («la persona abajo firmante», «designada») para que `js/genero.js` no
la cambie según el tercero; `firmante: direccion` solo sirve para poner en su género el
destinatario («Sr./Sra.:firmante Director/a:firmante…»): la firma del cargo no se pinta. Cabe en una
hoja A4 (comprobado convirtiéndolo a PDF).

#### Insertar un hueco al escribir una plantilla (17-sep-2026, fila 35, docs/HUECOS-INSERTAR.md)

El editor de una plantilla pintaba un botón por cada hueco de `Plantillas.HUECOS` (más de
treinta), un muro que tapaba el resto del formulario. Ahora es un solo botón, "Insertar hueco",
con un cuadro pequeño y flotante: buscador (sin mayúsculas ni tildes), lista navegable con flechas
y Enter, y Escape que cierra sin insertar (con su propio `stopPropagation`, como piden las reglas
de Escape de la sección "La ficha de un asunto").

`js/huecos-buscador.js` (`window.HuecosBuscador`), fichero nuevo cargado antes de
`js/plantillas-ajustes.js`, es la pieza reutilizable: `HuecosBuscador.montar({ boton, campos,
huecos })` no pasa por `U.preguntar` (el editor de la plantilla ya está usando el único cuadro de
diálogo que hay), sino que cuelga el buscador del `<body>` con `position:fixed`, por encima de
`#capa` y por debajo de los mensajes, calculado a partir de dónde esté el botón (mismo patrón de
cierre que `App.botonMenuTarjeta`: mousedown fuera o Escape, los dos en fase de captura). `campos`
es la lista de textarea/input donde puede entrar un hueco, en el orden del formulario; se recuerda
cuál tuvo el foco por última vez (guardando su cursor al perderlo, porque abrir el buscador se lo
quita a todos) y ahí entra el hueco elegido, o al final del último campo de la lista si no se ha
tocado ninguno todavía. Hoy solo se usa con un campo (`#pl-texto`): el editor no tiene ningún campo
de "asunto del correo" con huecos (ese asunto lo monta solo `js/correo.js`), así que la parte de
"recordar cuál de varios campos" queda lista pero sin un segundo campo real que la ejerza.

`js/plantillas-documento.js` tiene su propia lista de huecos (`#pd-huecos`), pero es una tabla de
referencia con botón "Copiar" (el documento se edita en Word, fuera de la aplicación: no hay
ningún cursor de un `<textarea>` donde insertar), en su propio bloque plegado, sin tapar ningún
formulario: no es el mismo muro, y no se ha tocado.

Se comprueba con `pruebas/plantillas-huecos.mjs`, en navegador de verdad.

### Leer los adjuntos de un correo de la bandeja (18-sep-2026, fila 49,
### docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md)

Hermana de la sección de arriba: en vez de un documento suelto, los adjuntos PDF de un correo de la
bandeja. **Manda siempre lo que ya haya adivinado el correo** (`Bandeja.proponer`, sin tocar): el
PDF solo rellena el tercero o el tipo cuando el correo no los encuentra, y aporta el registro de
Séneca y la fecha del propio documento, que el correo nunca trae. Si el PDF encuentra un tercero
distinto del que encontró el correo, gana el del correo sin avisar de nada.

- `js/bandeja-adjuntos-lector.js`, nuevo, hermano de `js/documentos-sueltos-lector.js`: misma cola
  de uno en uno (nunca en paralelo), misma caché en memoria por identificador de correo mientras
  dure la pantalla, mismo `LectorDocumentos.analizar` y el mismo `ContextoDocumentos.delCentro()`
  (ver arriba). Lee como mucho los 3 primeros adjuntos que sean PDF de cada correo (nunca `pdf` ni
  `pdfMensaje`, el PDF del hilo entero: ahí no hay nada que el correo no tenga ya), 5 páginas cada
  uno, con `carpeta.getFileHandle(nombre)` + `.getFile()` + `RegistroLector.textoDe`; si hay
  varios, se juntan los análisis (gana el primero que traiga cada dato). Un adjunto que falle no
  para a los demás: mejor esfuerzo, sin avisar de nada.
- **El gancho, mínimo, dentro de `tarjeta(item)`** (`js/bandeja-pantalla.js`, no está exportada):
  una línea `.tarjeta-adjuntos-correo` más, con `data-adjuntos-de="<id>"`, y una llamada a
  `BandejaAdjuntosLector.pintarEn(item, laLinea, plegado)`. Con la barra plegada no hace nada; al
  desplegarla, si el correo no tiene PDF adjuntos la línea se quita sin más, si no dice "Leyendo
  los documentos…" y encola la lectura. Al terminar: si hay algo nuevo, "Del documento: 26EM0368 ·
  10-sep-2026 · SOLICITUD · García Pérez, Ana" (mismo estilo que la propuesta de arriba); si no hay
  nada que el correo no tuviera ya, la línea se quita entera.
  - **Ojo con la carrera del repintado**: `js/bandeja-pantalla.js` rehace la bandeja entera
    (`c.innerHTML = ''`) en cada `pintar()`, así que la línea recién creada de una tarjeta puede
    todavía no estar enganchada al documento cuando le toca aplicarle un resultado ya en caché
    (`resultados.hasOwnProperty(id)`): buscarla con `document.querySelectorAll` en ese momento no
    la encontraría, y se quedaría con el hueco vacío puesto (aunque oculto por CSS, seguiría
    contando como una fila más). Por eso `pintarEn` aplica el resultado en caché directamente sobre
    el elemento que le pasan (`aplicar(el, r)`), y solo busca por `data-adjuntos-de` en el documento
    (`actualizarLinea`, vía `lineasDe`) cuando termina de leerse de verdad: para entonces la tarjeta
    ya lleva un buen rato montada del todo.
- **Completar la pantalla de "Nuevo asunto"**: se envuelve `window.Bandeja.llevarANuevo` (una
  propiedad del objeto, así que no hace falta tocar `js/bandeja-correos.js`), no la función de
  dentro. Solo se completa si, después de que el correo haya hecho lo suyo, `App.E.nuevo.tercero`
  **y** `App.E.nuevo.tipo` siguen los dos vacíos: `App.elegirTipo`/`App.elegirCategoria` reinician
  lo que venga detrás en su propio orden (categoría → tipo → tercero, el mismo que ya usa
  `llevarANuevo`), así que tocar cualquiera de los dos cuando el correo ya dejó algo puesto lo
  borraría. Con eso a medias, el dato del PDF se queda solo en la línea de la tarjeta, para que
  Francisco lo escriba él si hace falta.
- No se toca `apps-script/gestor-correos.gs`, ni `Bandeja.proponer`, ni `llevarANuevo` por dentro,
  ni `js/documentos-sueltos.js`.

Se comprueba con `pruebas/bandeja-adjuntos.mjs` (en navegador de verdad, PDF real montado a mano
como en `pruebas/dar-de-alta-desde-documento.mjs`): sin tercero en el correo, el PDF lo completa;
con tercero ya reconocido, el PDF no lo pisa aunque traiga uno distinto; sin tipo, el PDF lo trae
por sus palabras clave; con tipo ya puesto, el PDF no lo pisa; sin adjuntos, sin PDF entre los
adjuntos, y con uno que no se puede leer, la tarjeta se queda exactamente como antes de esta fila.
