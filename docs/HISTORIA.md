
**De paso**: editar un modelo de la biblioteca perdía sus formularios (el editor no se los pasaba);
«Comunicar» desde un hito no encontraba su paso si estaba dentro de una pregunta de dentro (fila
95); y el aviso de «huecos sin dato» al generar pasa de rojo a ámbar (el documento ya está hecho).
`pruebas/ajustes-por-tipo.mjs` buscaba la sección del plazo por el texto «Plazo», que ahora sale
también en la tabla de huecos: busca el campo.

: repintar solo lo que ha cambiado

`docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md`. Tras guardar, la aplicación repintaba casi todo: cambiar el
estado desde la ficha eran 30-40 lecturas (la lista entera aunque estuviera oculta, sus 17
enganches, y la ficha entera). Se midió antes de tocar nada, con una prueba que cuenta llamadas a
`Carpetas`: el mayor gasto era el observador de «Generar documento», que releía `plantillas.json`
siete veces por tanda. Ahora el cambio de estado solo relee y escribe `asuntos.json`.

Dos fallos de paso: la fila «Formularios» de la ficha no salía nunca (`filasHtml` ignoraba su
segundo parámetro; un comentario decía que era a propósito por una prueba, que ahora cuenta solo
las filas visibles), y `js/formularios.js` usaba `Hitos.hitosDe` como si fuera síncrona. Al
arreglar lo segundo, su observador empezó a leer `hitos.json` en cada cambio de pantalla (antes
fallaba en silencio): la prueba de lecturas lo cazó, y ahora solo calcula cuando la fila es nueva.

Sin partir `js/ficha-asunto.js` (pasa de 1.000 líneas): los cambios han sido pocos y localizados,
y partirlo a la vez que se cambia su repintado era arriesgar las dos cosas.

: avisos que dicen la verdad, y botones que se bloquean de verdad

`docs/AVISOS-QUE-DICEN-LA-VERDAD.md`. Muchas acciones guardaban lo importante y luego hacían más
cosas en el mismo `try`: si fallaba una de las de después, salía rojo «No he podido…» con todo ya
guardado, y al repetir, «Ya hay…». Ahora cada una separa lo principal (rojo si falla) de lo
accesorio (ámbar), con `U.fallo` y `U.accesorio`. De paso, los ~150 avisos que pegaban `e.message`
en inglés pasan por `U.mensajeDeError`.

**El botón que se volvía a encender solo**: `aplicarModoConsulta` ponía `disabled=false` a TODOS
los controles de la ficha cada vez que el observador veía algo nuevo, también al que decía
«Guardando…» y a las casillas de hito de un asunto archivado. Ahora solo toca lo que él mismo
apagó y respeta la marca `data-guardando` de `U.mientrasGuarda`.

**Un cuadro sobre otro** dejaba colgada para siempre la espera del primero (un solo `#capa`):
ahora se da por cancelado. Lo que costó: los avisos nuevos tenían que pasar por `U.aviso` (no por
la función interna) para que las pruebas que lo sustituyen los vean; sin eso, una prueba sin
navegador reventaba con `setTimeout is not defined`.

Queda sin hacer, a propósito: partir `js/ficha-asunto.js` (pasa de 1.000 líneas), porque aquí
solo se ha tocado en unos pocos sitios (tampoco se partió en la 101: ver su entrada).

: guardar en fila y sin trabajo de más

`docs/GUARDAR-EN-FILA.md`. Francisco: al grabar sale un error o la pantalla se queda congelada,
aunque al volver a entrar sí se ha guardado. Las causas, de la revisión a fondo:

- **La copia del día se rehacía en cada guardado.** `Copias` preguntaba con `Carpetas.existe`, que
  busca una CARPETA: con un fichero siempre decía «no existe». Cada guardado releía, reescribía la
  copia y listaba `copias/` entera. Las pruebas no lo veían porque el disco de mentira no distingue
  carpeta de fichero; la prueba nueva sí (como el navegador de verdad).
- **Nada ponía los guardados en fila.** Dos a la vez leían antes de que escribiera el otro, y ganaba
  el último. `js/cola-guardado.js`: una cadena de promesas por fichero.
- **Leer no reintentaba**, y un `NotReadableError` de Dropbox tumbaba el segundo paso.
- **Las tareas de fondo** (presencia, vistazo a la carpeta, conflictos) se cruzaban con el guardado;
  el vistazo, a mitad de un archivado, veía desaparecer la carpeta y sacaba de la ficha en rojo.
- **Tres riesgos de perder datos**: un `asuntos.json` leído vacío se escribía encima; las copias en
  conflicto se quedaban fuera al trasladar una carpeta y se borraban con el original; la fusión de
  conflictos perdía todo lo que no fuera `asuntos`.

**Lo que costó**: la guardia de «lectura vacía» comparaba al principio con lo que había en memoria,
y una prueba (`archivo-indice.mjs`) mete fichas solo en memoria: la guardia saltaba y el archivado
no se hacía. Se compara con lo último leído o escrito en el disco. Y otra lección de la fila 92:
las pruebas sin navegador no cargan `js/cola-guardado.js`, así que todo lo usa con `window.` y sin
él guarda igual.

: preguntas dentro de las respuestas, sin límite de niveles

`docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md`. Reabre a propósito lo que estaba descartado
(«opciones dentro de opciones en la guía»): los procedimientos del centro lo necesitan. La línea
sale de la lista de descartado.

- **Modelo** (`js/guias.js`): `normalizarOpciones` ya no vacía `opciones` ni recorta campos en los
  pasos de una opción; `normalizar` es recursivo. Un paso-pregunta, a cualquier nivel, sale sin
  requisitos, comunicación, normativa ni formularios.
- **Editor**: entrar y salir como en carpetas, dentro del mismo `U.preguntar` (solo hay uno). El
  truco fue separar `nivel` (lo que se ve) de `pasos` (lo que se guarda), y cambiar `recoger()`
  para que actualice los objetos por su id en vez de rehacerlos: antes rehacía los pasos de una
  opción con cinco campos, y con preguntas de dentro eso se habría llevado sus opciones.
- **Hitos**: `Hitos.visibles` cortaba solo la sublista de una pregunta de dentro sin responder, y
  seguía enseñando lo de después de la de fuera. Ahora corta la lista entera. Cambiar de rama poda
  todo el subárbol (`podar`), y `huerfanos` recoge lo trabajado de cualquier nivel.

: el botón «Ruta» de la ficha del asunto

`docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md`. Francisco pidió un botón que abriera la carpeta del
asunto; el navegador no lo deja (sigue en la lista de descartado), así que se copia la ruta para
pegarla en el explorador. Los manejadores de carpeta no saben su ruta de verdad, así que la parte
de delante la apunta cada uno en Ajustes → El centro, y se guarda en `localStorage`, no en
`_GESTOR`: la ruta del ordenador de Francisco no existe en el de su compañero. Módulo nuevo
`js/copiar-ruta.js`, que se crea su propio bloque en Ajustes. `pruebas/copiar-fila.mjs` cuenta
ahora un botón más.

: campos propios en el nombre de un documento

`docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md`. Cada tipo de documento puede llevar campos (texto,
lista o fecha, obligatorios si se quiere) que entran en el nombre entre el tipo y el texto
adicional. Módulo nuevo `js/documentos-campos.js`.

**Dónde se guardan, y por qué ahí.** `tipos-documento.json` es una lista de nombres que usan la
fusión de borrados, la papelera y la guardia de duplicados: convertirla en objetos tocaba todo
eso. Los campos van a `campos.json`, clave `porTipoDocumento`, que ya es compartido, con copia y
releído antes de escribir. Ojo con una trampa: `Campos.normalizar` reconstruye el objeto entero,
así que cualquier clave nueva que no se añada ahí se borra en el siguiente guardado de otro trozo
(la prueba lo comprueba). La clave solo se escribe cuando hay algún campo.

Un campo de fecha entra como `AAMMDD`, igual que la fecha del documento.

: cambiar el tipo de un asunto ofrece la guía del nuevo

`docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md`. Hasta ahora, cambiar el tipo en «Editar el asunto»
renombraba la carpeta pero dejaba los hitos del tipo viejo sin decir nada. Ahora pregunta (lo
eligió Francisco: a veces el cambio es solo para corregir el nombre). Módulo nuevo
`js/hitos-cambio-de-tipo.js`, llamado desde `App.editarAsunto` solo cuando carpeta y ficha ya han
salido bien. Los hitos viejos con algo apuntado no se pierden: campo nuevo `delTipoAnterior`, que
`Hitos.visibles` salta y `Hitos.huerfanos` pliega abajo, con la misma pantalla que los de una rama
descartada.

**Una decisión que el documento dejaba abierta**: pedía conservar los hitos «hechos o en curso»,
pero también que con hitos intactos se sustituyeran todos. Un asunto recién creado ya tiene el
primero en curso sin que nadie haya hecho nada, así que "en curso" solo no cuenta como trabajo; sí
cuentan hecho, notas, documentos, requisitos marcados y una rama elegida.

: el nombre corto del tipo, también en los filtros y en la tarjeta

`docs/NOMBRE-CORTO-EN-LOS-FILTROS.md`. Las tarjetas «Por tipo de asunto» y la etiqueta del tipo
en cada tarjeta enseñan ahora el nombre corto (el largo, al pasar el ratón). Dos funciones nuevas
en `js/nombres.js`, `tipoParaVer` y `nombresDeTipo`. Se sigue agrupando por el nombre de verdad:
la prueba monta dos tipos con el mismo nombre corto y comprueba que salen dos tarjetas y que cada
una filtra solo lo suyo. El buscador encuentra por los dos nombres, abierto y archivado; en el
ARCHIVO se resuelve al buscar, así que nadie tiene que reconstruir el índice. Ojo al escribir la
prueba: la lista de tipos de partida ya trae un `TRASLADO`, y un corto igual a un tipo existente
hace que `Nombres.leer` se quede con el otro (Ajustes ya lo avisa en rojo).

## 23-sep-2026 — Fila 93: no salir del asunto salvo cuando el usuario lo pide

`docs/QUEDARSE-EN-EL-ASUNTO-SIEMPRE.md`. Repaso completo, fichero a fichero, de todo `js/` en
busca de una salida indebida de la ficha (`App.ir(` hacia otra pantalla, u ocultar
`#pantalla-asunto` fuera de las cuatro salidas permitidas): `js/nucleo.js` (dónde vive `App.ir` y
`App.PANTALLAS`), `js/ficha-asunto.js`, `js/ficha-nombre-acciones.js`, `js/ficha-documentos.js`,
`js/hitos-documentos.js`, `js/hitos-panel.js`, `js/hitos-panel-lista.js`, `js/hitos-comunicar.js`,
`js/documentos.js`, `js/documentos-sueltos.js`, `js/documentos-sueltos-lector.js`,
`js/documentos-sueltos-sugerencias.js`, `js/registro.js`, `js/registro-sellado.js`, `js/correo.js`,
`js/correo-adjuntos.js`, `js/plantillas-documento.js`, `js/pdf-separar-unir.js`,
`js/preparar-documento.js`, `js/notas.js`, `js/relacionados.js`, `js/otros-del-tercero.js`,
`js/formularios.js`, `js/formularios-rellenar.js`, `js/asuntos-lista.js`, `js/asuntos-archivar.js`,
`js/asuntos-editar.js`, `js/asuntos-nuevo.js`, `js/asunto-renombrar.js`, `js/unir-asuntos.js`,
`js/borrados-fusion.js`, `js/papelera.js`, `js/fichas-huerfanas.js`, `js/ficha-archivo.js`,
`js/ficha-tercero.js`, `js/ficha-plegables.js`, `js/lo-pide.js`, `js/elegir-asunto.js`,
`js/duplicados.js`, `js/lector.js`, `js/visor.js`, `js/vista.js`, `js/usabilidad.js`, `js/barra.js`.

**No se ha encontrado ninguna salida indebida: el código ya cumplía la regla entera.** La fila 30
(17-sep-2026) y las que la siguieron (34, 51, 52, 58...) ya habían dejado cada camino bien hecho:
asociar un documento a un hito (`js/ficha-documentos.js`, botón "Asociar a un hito") y apuntarlo
desde el propio hito (`js/hitos-documentos.js`, "Apuntar un documento") repintan solo su propio
trozo, nunca navegan; marcar un hito, "Comunicar", "Documentos ▾", registrar, generar un
documento de plantilla y separar/unir/sacar páginas de un PDF llaman todos a `App.verAbiertos()`
(que ya reengancha sola la ficha desde la fila 30) o repintan en su sitio con
`App.abrirFicha(a, modo)`, nunca a `App.ir(otra-pantalla)`. "Meter en un asunto"/"Meter aquí" de
Por clasificar (`js/documentos-sueltos.js`, `js/documentos-sueltos-lector.js`) viven en la
pantalla "Por clasificar", nunca dentro de la ficha, así que no pueden sacar de ella; y cuando el
asunto de destino es el que antes tenía la ficha abierta, `App.verAbiertos()` no lo vuelve a
enseñar porque `App.reengancharFicha()` comprueba primero si la ficha sigue **a la vista**
(`#pantalla-asunto` sin `oculto`), no solo si `actual` sigue puesto.

Se ha ampliado `pruebas/quedarse-en-el-asunto.mjs` con once casos más: marcar un hito, asociar un
documento a un hito, apuntar un documento desde el hito, comunicar, "Documentos ▾", y "Meter en
un asunto" hacia el asunto que antes tenía la ficha abierta (los seis, se quedan); y Volver,
Editar (aunque se cancele), Borrar, Escape, y el asunto que deja de estar abierto desde el otro
ordenador (los cinco, sí salen, con el aviso de una línea en el último caso). Quince
comprobaciones en total, sobre las cuatro que ya había.

**Lo que costó de verdad**: nada en el código de la aplicación, porque no hacía falta tocarlo. Lo
que costó fueron las pruebas nuevas. La primera sesión que tocó esta fila no tuvo `git push` ni
pudo montar el repositorio completo en un navegador local, así que escribió los quince casos
nuevos sin poder correrlos, y los dejó publicados así, con una nota pidiendo a la siguiente sesión
que los verificara. Esta segunda sesión sí ha podido clonar el repositorio (con `git clone` de
lectura; sigue sin permiso para `git push`, así que la subida a `main` pasa igual por la
herramienta de GitHub) y correr `npm test` de verdad en local, con `python3 -m http.server` y
Playwright. Tres de los quince casos nuevos fallaban, los tres por errores en la propia prueba,
nunca en la aplicación:

- El caso 6 (apuntar un documento a un hito) y otros tres esperaban a que el cuadro se cerrara con
  `pagina.waitForSelector('#capa.oculto')`. Con `.oculto { display: none !important; }`, ese
  selector nunca puede quedar "visible" — el propio Playwright no lo resuelve nunca así, y la
  prueba se quedaba esperando 30 segundos sin motivo. Cambiado a `pagina.waitForTimeout(400)` tras
  el clic en Aceptar, que es el patrón que ya usan `pruebas/registro.mjs` y el resto del
  repositorio para lo mismo. El caso 10 (que si sale hacia la lista, no hacia la ficha) se cambió
  en su lugar a esperar `#pantalla-abiertos:not(.oculto)`, que es el estado de verdad que ese caso
  comprueba.
- El caso 10 ("Meter en un asunto") buscaba el asunto de pruebas por su nombre en el cuadro de
  «Elegir el asunto», y no lo encontraba: ese asunto se había creado a mano, con una carpeta
  directamente en el disco de mentira, sin pasar nunca por `App.anotar`, así que no tenía ninguna
  entrada en `asuntos.json` y `ElegirAsunto.todos()` no lo veía. Arreglado dando de alta el
  asunto con `App.anotar(nombre, {})` (sin categoría ni tercero, que es lo que necesitaba seguir
  probando el caso 11) nada más crear la carpeta, antes del primer paso.
- El caso 12 (el segundo asunto, para Escape/Editar/Borrar) esperaba su tarjeta con
  `pagina.waitForSelector('.tarjeta', { hasText: 'PERMISO' })`: `waitForSelector` no admite
  `hasText` (eso es de `locator()`), así que la opción se ignoraba y la prueba esperaba a que
  fuera visible la primera `.tarjeta` que hubiera en toda la página — que podía ser la de un
  documento suelto de un paso anterior, nunca la buscada. Cambiado a
  `pagina.locator('#lista-abiertos .tarjeta', { hasText: 'PERMISO' }).first().waitFor()`.

Con los tres arreglos, las quince comprobaciones de `pruebas/quedarse-en-el-asunto.mjs` pasan, y
se ha corrido además la batería completa (`pruebas/*.mjs`, 97 ficheros): todas en verde, sin tocar
ningún otro fichero de la aplicación.

Sustituida en `docs/contexto/ASUNTOS.md` la línea vieja de la fila 30 por la lista completa y
actual de caminos revisados (ya lo había hecho la primera sesión). Versión publicada
`App.VERSION`: `23-sep-2026 · 15:47`.

## 23-sep-2026 — Fila 92: «Reintentar is not defined», la aplicación sin poder guardar

`docs/NADA-SE-GUARDA-REINTENTAR.md`. Desde la fila 90, `Carpetas.escribirTexto`/`escribirBytes`
llamaban a `Reintentar.escritura` a pelo: en un navegador con `js/carpetas.js` nuevo y un
`index.html` que no cargaba `js/reintentar-escritura.js`, fallaba **toda** escritura. Ahora pasan
por `conReintento(intento)`, que sin el módulo escribe sin reintento, y
`js/reintentar-escritura.js` se expone en `window.Reintentar`.

**De dónde salía la versión a medias.** `main` estaba bien (el `<script>` estaba, antes de
`carpetas.js`). La copia sin internet no lleva lista de ficheros escrita a mano
(`scripts/copia-local.mjs` copia `js/` e `index.html` enteros), y `vercel.json` ya manda
`max-age=0, must-revalidate` para todo, `index.html` incluido. Lo más probable: una copia a
medias, en la que un `.js` nuevo llega antes que el `index.html` que lo carga (Dropbox sincroniza
fichero a fichero al otro ordenador, y la actualización de la copia también escribe uno a uno).
Con el arreglo, ese estado a medias ya no deja a nadie sin guardar. **No se pudo mirar lo
publicado con `curl`**: esta sesión no tenía salida a `asuntos.fmargon.com` ni a `vercel.app`.

Prueba nueva `pruebas/scripts-cargados.mjs` (sin navegador): todo `js/*.js` en `index.html` y al
revés, el orden de los dos ficheros, y escribir con y sin `Reintentar`. Sin el arreglo, falla.

De paso, `docs/COLA.md` vuelve a dar por HECHAS la 89 y la 91: el commit que apuntó las filas 92
a 98 las había devuelto, por error, a BLOQUEADA y PENDIENTE.

## 23-sep-2026 — Fila 91: la copia sin internet se actualiza de verdad (y se cierra la 89)

`docs/COPIA-SE-ACTUALIZA.md`. La copia que Francisco abría en el instituto seguía en
`21-sep-2026 · 11:32` con la publicada en `14:49`, y sin decir nada. La copia pública estaba al
día: fallaba el ordenador. Dos agujeros, tapados los dos porque no se sabía cuál le había tocado:

- **`ABRIR EL GESTOR.html` solo guardaba la carpeta la primera vez.** Si la carpeta ya tenía
  `index.html`, iba directo a ella sin guardarla; en otro ordenador, navegador o perfil,
  `js/actualizar-copia.js` no encontraba carpeta y se callaba. Ahora la guarda siempre y, si ya
  está instalada, la pone al día antes de abrirla (mismo algoritmo: solo los sha256 distintos,
  `version.json` el último). Así, volver a guardar ese fichero y abrirlo rescata una copia vieja,
  que es la única salida para la de Francisco (su `js/actualizar-copia.js` es el viejo). Además,
  solo acepta una carpeta vacía, con `index.html` o con el propio `ABRIR EL GESTOR…`.
- **Sin permiso, solo un aviso pequeño abajo a la izquierda**, que no decía que había versión
  nueva. Ahora `js/actualizar-copia.js` mira PRIMERO la versión remota (si coincide con
  `App.VERSION`, no pide permiso ni toca el disco) y, si no puede actualizar sola, pinta una
  franja ámbar arriba, a todo el ancho, con las dos versiones y «Actualizar ahora» (pide permiso
  o carpeta con el clic, la guarda, actualiza y recarga).

**Contra el bucle**: antes de recargar se apunta en `sessionStorage` a qué versión y en qué
carpeta; si al volver la ventana sigue vieja, se escribió en otra copia: no se recarga más, se
olvida la carpeta y la franja dice desde qué carpeta abrir.

**La prueba** (`pruebas/copia-sin-internet.mjs`) pasó a usar copias de verdad de `copia-local/`
en una carpeta temporal, con el disco y la IndexedDB servidos desde Node (`exposeFunction`), para
que tras la recarga la página abra de verdad lo recién escrito y se pueda comprobar que
`App.VERSION` ya es la nueva. Sin el arreglo, falla. La parte 1 lleva ahora su propio servidor
"al día": la copia mira la versión remota lo primero, y sin él saldría a internet.

**La 89 queda HECHA**: Francisco creó `fmargon780/gestor-asuntos-copia` y el secreto, y la acción
publica desde el 21-sep-2026. `App.VERSION`: `23-sep-2026 · 14:28`.

## 21-sep-2026 — Fila 90: archivar sin avisos falsos ni errores en inglés

`docs/ARCHIVAR-SIN-AVISOS-FALSOS.md`. Al archivar un asunto desde su propia ficha (no desde la
tarjeta de la lista) salían dos avisos rojos sobrantes, aunque el archivado en sí salía bien: uno
de "otro ordenador" y otro con un `InvalidStateError` del navegador, en inglés, al intentar guardar
`_ficha.json`.

**Aviso 1, el falso "otro ordenador".** `App.cerrarAsunto` llama a `App.verAbiertos()` al terminar,
que reengancha la ficha abierta (`App.reengancharFicha`, `js/ficha-asunto.js`); como el asunto ya
no está en la lista (lo acaba de archivar este mismo ordenador), el aviso confundía su propio
archivado con uno ajeno. Arreglo: `App.E.recienArchivados` (`js/nucleo.js`), un conjunto en
memoria donde `App.cerrarAsunto` (`js/asuntos-archivar.js`) apunta la clave justo antes de llamar a
`App.verAbiertos()`; `App.reengancharFicha` lo consulta primero, y si está, vuelve a la lista sin
avisar (y borra la marca: es de un solo uso, para no confundir un archivado de verdad posterior del
otro ordenador con el mismo nombre).

**Aviso 2, Dropbox sincronizando al escribir `_ficha.json`.** La envoltura de `App.cerrarAsunto` en
`js/ficha-archivo.js` escribe `_ficha.json` justo después de mover la carpeta, y Dropbox a veces
todavía está sincronizando esa misma carpeta en ese instante. Dos piezas:
- `Reintentar.escritura(intento)` (nuevo `js/reintentar-escritura.js`, cargado justo antes de
  `js/carpetas.js`): un intento normal más hasta tres reintentos, con 0,5 s/1 s/2 s de espera por
  delante de cada uno, si `intento` falla con `InvalidStateError`/`NoModificationAllowedError`.
  Cualquier otro error se lanza a la primera. `Carpetas.escribirTexto`/`escribirBytes` pasan a
  llamarla, envolviendo la escritura entera (pide el manejador del fichero de nuevo en cada
  intento, nunca reutiliza uno viejo): como `Copias.guardar`, `guardarJson` y `_ficha.json` pasan
  todos por ahí, esto arregla de una vez toda escritura de la aplicación, no solo la del archivado.
- Si aun así los reintentos se agotan, la envoltura de `js/ficha-archivo.js` distingue ese caso
  (`Reintentar.esErrorDeSincronizacion(e)`) y avisa en **ámbar**, diciendo que no se ha perdido nada
  (la clave sigue en `asuntos.json`: el borrado va después de escribir `_ficha.json`) y que "Poner
  en orden las fichas del ARCHIVO" la recogerá sola. Cualquier otro error sigue en rojo, con
  `U.mensajeDeError(e)` en vez de `e.message` a pelo (también en la envoltura de
  `App.reabrirAsunto`, que no tenía este arreglo).

**Lo que costó de verdad, en la propia prueba.** El primer intento de simular el fallo cambiaba
`window.__disco.fich` (la función expuesta del disco de mentira de `pruebas/navegador.mjs`) — pero
`dir.getFileHandle` de ese disco llama a la función `fich` de su propio cierre léxico, no a esa
propiedad: cambiarla no tiene ningún efecto, y la prueba archivaba sin fallar nunca, dando un falso
verde. Arreglo: parchear en cascada el propio manejador de la carpeta ARCHIVO
(`pruebas/archivar-sin-avisos-falsos.mjs`, `hazQueFalleEnElArchivo`), envolviendo
`getDirectoryHandle`/`getFileHandle` de cualquier carpeta que cuelgue de ahí, para interceptar la
creación de `_ficha.json` sin tener que adivinar de antemano qué carpetas va a crear el archivado.

Prueba nueva, `pruebas/archivar-sin-avisos-falsos.mjs`, en navegador de verdad: archivar desde la
ficha abierta sin el aviso de "otro ordenador"; Dropbox fallando dos veces y saliendo bien a la
tercera, sin ningún aviso de más; y Dropbox fallando todo el rato, con el aviso ámbar y la ficha
todavía en `asuntos.json`. Se tuvo que añadir `js/reintentar-escritura.js` a la lista de ficheros
que cargan en su contexto `vm` otras 17 pruebas ya existentes que usan `js/carpetas.js` sin
navegador (`Carpetas.escribirTexto`/`escribirBytes` ahora llaman a `Reintentar`, que si no está
cargado revienta con `ReferenceError`).

Fila 90 HECHA. `App.VERSION`: `21-sep-2026 · 14:49`.

---

## 21-sep-2026 — Fila 89: la copia sin internet, bloqueada por el repositorio público

`docs/COPIA-SIN-INTERNET.md`, diseño cerrado por Francisco el mismo día. El filtro de red del
instituto (Junta de Andalucía) empezó a cortar también `asuntos.fmargon.com`, no solo
`vercel.app`, así que la aplicación necesitaba poder abrirse desde el disco (`file://`), con doble
clic, sin depender de esa dirección.

**Apartado 1 (que la app funcione en `file://`).** Nuevo `js/cargar-fichero.js`, con
`App.leerFicheroDeLaApp(ruta, tipo)`: en `http(s)` sigue siendo el `fetch` de siempre; en `file:`
inyecta un `<script src="copia-datos/<ruta con / cambiado por ~>.js">` que deja el dato en
`window.__COPIA__`, con carga perezosa y sin duplicar la inyección si dos módulos piden la misma
ruta a la vez. Contrato elegido: `'json'` devuelve el objeto ya interpretado, `'binario'` un
`Uint8Array`, igual que ya hacían a mano los cinco sitios de la tabla del diseño (`js/cargar-biblioteca.js`,
`js/formularios.js`, `js/formularios-rellenar.js`, `js/plantillas-documento.js` ×2), que pasaron a
llamar a esta función en vez de a `fetch` directo. Los tres módulos que repetían casi el mismo
`cargarPdfJs()` con `import('./lib/pdf.min.mjs')` (`js/registro-lector.js`,
`js/preparar-documento.js`, `js/pdf-separar-unir.js`) pasaron a llamar a la función compartida
`App.cargarPdfJs()`, también en `js/cargar-fichero.js`. `js/nucleo.js` gana `App.textoVersion()`
(`App.VERSION` + " · copia sin internet" cuando `location.protocol === 'file:'`), usada en las dos
líneas que antes pintaban `App.VERSION` a pelo.

**Apartado 2 (el paso que genera la copia).** `scripts/copia-local.mjs` (`npm run copia-local`,
nueva dependencia `esbuild`): copia `index.html`, `css/`, `js/` y `favicon.svg` tal cual, genera
`copia-datos/*.js` por cada JSON/PDF/`.docx` estático, construye `js/lib/pdf.iife.js` y
`pdf.worker.iife.js` con esbuild, copia el instalador (`scripts/plantillas-copia/ABRIR EL GESTOR.html`)
y escribe `version.json` con el sha256 de todo. No copia `docs/`, `pruebas/`, `herramientas/`,
`scripts/` ni `apps-script/`. `copia-local/` en `.gitignore`.

**Apartado 4 (se instala y se actualiza sola).** Nuevo `js/actualizar-copia.js` (solo actúa en
`file:`): compara `version.json` del disco con el de
`raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/` (`cache: 'no-store'`), descarga
solo lo que cambió de sha256 (comprobando cada uno antes de escribir, `version.json` el último) y
recarga; sin internet, un aviso discreto (`U.aviso`) y arranca igual. El identificador de la
carpeta viaja en la misma IndexedDB que `js/almacen.js` (`gestor-asuntos` / `ajustes` /
`copiaCarpeta`), para que lo que guarda `ABRIR EL GESTOR.html` (autónomo, con su propia capa
mínima de IndexedDB, sin depender de ningún otro fichero de la copia) lo pueda releer luego este
módulo. El aviso ámbar de "hace falta el permiso otra vez" reutiliza el patrón de
`js/bandeja-pantalla.js` (caja + botón), colgado del `<body>` porque no hay un hueco fijo para él
en `index.html`.

**Lo que costó de verdad, un bug real de pdf.js:** `js/lib/pdf.min.mjs` trae, en su propio código
(no puesto por nadie del proyecto), un único `await` de nivel superior —
`globalThis.pdfjsLib = await (globalThis.pdfjsLibPromise = ...)` —, y esbuild no genera un
`<script>` clásico (`format: 'iife'`) a partir de un módulo con `await` de nivel superior: solo lo
admite en `format: 'esm'`, que a su vez no se puede cargar en `file://` (es la misma restricción de
`import()` que se quería evitar). Comprobado a mano con Playwright que `__webpack_require__(228)`
(lo que hay a la derecha del `await`) es de verdad una promesa ahí dentro: quitar el `await` sin
más deja `globalThis.pdfjsLib` con la promesa sin resolver, y `pdfjsLib.getDocument` vacío. La
solución final: `scripts/copia-local.mjs` quita ese único `await` del texto antes de pasarlo a
esbuild (comprobando primero que el patrón exacto sigue ahí, para que una subida de pdf.js no lo
rompa en silencio), sin `globalName` (así esbuild no envuelve el resultado en un `var pdfjsLib =
(()=>{...})()` que pisaría, al final, la asignación de verdad); y `App.cargarPdfJs()`, ya en el
navegador, espera esa promesa si hace falta (`if (typeof lib.then === 'function') lib = await lib`)
antes de dar la librería por cargada. El worker (`pdf.worker.min.mjs`) no tenía este problema: se
autoasigna `globalThis.pdfjsWorker` de forma síncrona, y pdf.js lo usa para montar el "fake worker"
en el hilo principal sin crear ningún `Worker` de verdad ni pedir `workerSrc`, en cuanto lo
encuentra ya puesto.

**Lo que costó de verdad, en la propia prueba de la actualización:** el primer intento de
`pruebas/copia-sin-internet.mjs` fabricaba el disco de mentira (y el `indexedDB` de mentira) con
`page.addInitScript`, el mismo truco que usa `pruebas/navegador.mjs` para toda la aplicación — pero
`js/actualizar-copia.js` hace `location.reload()` cuando actualiza, y un `addInitScript` se vuelve a
ejecutar en cada navegación: la página recién recargada "olvidaba" lo que se acababa de escribir,
porque recreaba el disco de mentira desde cero con el contenido viejo. Solución: `page.exposeFunction`
sí sobrevive a una recarga, así que el disco de mentira pasó a vivir en el propio proceso Node (un
mapa `ruta -> contenido`), y la página solo llama a `window.__disco(accion, ruta, datos)`. Aparte,
el servidor HTTP de mentira necesitó la cabecera `Access-Control-Allow-Origin: *` (como
`raw.githubusercontent.com` de verdad): una página `file://` tiene origen `"null"`, y sin CORS
abierto el `fetch` de `js/actualizar-copia.js` falla con el mismo error que si el servidor
estuviera apagado, dando un falso "sin internet, arranca igual" que en realidad escondía un
servidor de pruebas mal configurado. Y el puerto `1` (usado a mano para simular "nadie escucha
ahí") es de los que Chrome bloquea siempre por seguridad (`ERR_UNSAFE_PORT`): la prueba final abre
y cierra un servidor real para quedarse con un puerto libre de verdad, en vez de inventarse uno.

**Bloqueada, no HECHA:** el apartado 3 del diseño (publicar la copia en un repositorio público
nuevo, `fmargon780/gestor-asuntos-copia`, con una GitHub Action) no se pudo completar por dos
motivos: la API de GitHub de esta sesión devolvió `403 Resource not accessible by integration` al
intentar crear el repositorio, y esta misma sesión (en la nube) tiene bloqueado por su propia
configuración de seguridad tocar `.github/workflows/` de cualquier repositorio. El workflow, en
cambio, sí tiene que vivir en `.github/workflows/` de **este** repositorio privado
(`gestor-asuntos-ies`, no en el público): es aquí donde ocurren los `push` que lo disparan; solo
necesita permiso de escritura sobre el repositorio público, para subir ahí el resultado. Siguiendo
la opción 2 del propio diseño ("si la sesión no puede crear el repositorio público... dejarlo todo
preparado"), el contenido completo de la Action queda escrito en `docs/copia-publica.yml.txt`
(texto plano en vez del `.yml` real, con la nota de en qué repositorio va), y
`docs/CLAVE-COPIA-PUBLICA.md` explica a Francisco, paso a paso, cómo crear el repositorio público
vacío, añadir el workflow a este repositorio (con un enlace que abre GitHub ya con el nombre de
fichero puesto) y crear el token de grano fino y el secreto `COPIA_TOKEN`. `docs/INSTALAR-COPIA.md`
queda escrito también, avisando de que su primer paso depende de que se complete
`docs/CLAVE-COPIA-PUBLICA.md` primero (la dirección de
`raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/...` no responde nada todavía). La fila
89 queda BLOQUEADA, no HECHA.

Prueba nueva, `pruebas/copia-sin-internet.mjs`: genera `copia-local/` y abre su `index.html` con
Playwright por `file://` (sin errores de consola, "copia sin internet" a la vista, la biblioteca y
el catálogo de formularios cargan desde `copia-datos/`, un PDF de `formularios/` se abre con pdf.js
como el lector, un `.docx` de `plantillas/` se lee con `Docx.leerEntradaDeTexto`), y
`js/actualizar-copia.js` con un servidor de mentira: descarga solo lo cambiado y recarga, y con el
servidor apagado arranca igual con el aviso. También se ajustó `pruebas/cargar-biblioteca.mjs`
(añadir `cargar-fichero.js` a la lista de ficheros que carga en su `jsdom` de mentira: sin él,
`App.leerFicheroDeLaApp` no existía y la prueba, que ya existía antes de esta fila, se rompía).

Batería completa en verde, una sola pasada al final. Versión publicada `App.VERSION`:
`21-sep-2026 · 11:32`.

---

## 21-sep-2026 — Fila 88: "Podría ir en...", sugerir un asunto ya existente desde "Por clasificar"

`docs/POR-CLASIFICAR-ASUNTO-EXISTENTE.md`. Desde la fila 41, el lector de "Por clasificar"
(`js/documentos-sueltos-lector.js`) ya proponía tipo, fecha, registro y tercero de un PDF suelto,
pero lo leído solo servía para crear un asunto nuevo. Esta fila lo usa también para encontrar un
asunto que ya existe.

**El módulo nuevo, `js/documentos-sueltos-sugerencias.js`** (`window.SugerenciasAsuntoExistente`)
no envuelve nada: `js/documentos-sueltos-lector.js` le pregunta directamente, en el mismo paso de
su cola (uno en uno, nunca en paralelo), justo después de leer el PDF y solo si ha reconocido un
tercero. Compara primero por documento —Nº de identificación escolar, los cuatro últimos
caracteres del documento del personal, o el NIF, el mismo código que va al final del nombre de la
carpeta (`js/nombres.js`)— y, si no hay documento en algún lado, por el nombre
(`ElegirAsunto.terceroDentroDe`, la misma pieza que ya usaba "Meter en un asunto"). Los abiertos se
miran en `App.E.listaAbiertos`, ya en memoria; los archivados, solo cuando no hay ningún abierto,
con el índice guardado del ARCHIVO (`_GESTOR/indice-archivo.json`) — nunca recorriendo el ARCHIVO
carpeta a carpeta.

**En la tarjeta**, debajo de la línea de lo leído, sale una línea por sugerencia («Podría ir en:
*nombre*», con «otro tipo» o «archivado» si toca) y su botón «Meter aquí», destacado. Con
sugerencias a la vista, "Aceptar" pasa a llamarse «Crear asunto nuevo» y a discreto. «Meter aquí»
reutiliza el mismo camino que "Meter en un asunto" (con su cuadro de "¿reabrir?" si el asunto está
archivado): se sacó `App.meterSueltoEnAsuntoElegido` de `App.meterSueltoEnAsunto`
(`js/documentos-sueltos.js`) para no repetir esa lógica en los dos sitios.

**Punto 8 del encargo**: "Meter en un asunto" también nota lo ya leído. `App.parecidoDelSuelto`
suma +50 si el tercero leído es el del asunto y +10 si el tipo leído es el del asunto, sin quitar
la puntuación de siempre (por palabras del nombre del fichero). Para eso, el lector expone
`window.LectorDeSueltos.resultadoDe(nombre)` (el resultado en caché de un fichero, si lo hay), y
`SugerenciasAsuntoExistente.esDelMismoTercero` queda exportado para no repetir la comparación de
documento/nombre en los dos sitios.

Prueba nueva, `pruebas/sugerir-asunto-existente.mjs`, en navegador de verdad, con cuatro empresas
distintas para no mezclar el estado de una con el de otra: un abierto del mismo tipo (sin marca);
cuatro abiertos (dos del tipo propuesto, dos de otro: salen tres, el tercero con «otro tipo»); sin
abiertos con dos archivados del mismo tipo y uno de otro (con «archivado», y "Meter aquí" pregunta
si reabrir); un abierto y un archivado del mismo tercero (solo sale el abierto); un documento sin
tercero reconocible (la tarjeta, igual que antes de esta fila); y que "Meter en un asunto" pone
arriba los asuntos del tercero leído. Comprobado que la prueba falla sin el cambio (se revirtieron
a mano los tres ficheros de código, sin la fila, y las pruebas 1 y 3 fallaron por falta de
sugerencias) antes de darla por buena.

**Lo que costó de verdad**: el cuadro de "ponerle nombre" que abre `App.meterSueltoEnAsunto`
(`App.verDocumentos`, `sinCancelar=true`) deja el botón Cancelar compartido (`#cuadro-cancelar`)
oculto hasta que otro cuadro con Cancelar lo vuelve a enseñar — no es un fallo nuevo de esta fila,
ya lo tenía "Meter en un asunto" desde siempre, pero la prueba lo destapó al encadenar varios
escenarios seguidos: el escenario del archivado (que sí necesita Cancelar) se puso antes que el
del abierto (que deja ese botón oculto al cerrarse), en vez de arreglar el cuadro compartido, que
no pedía el encargo.

**Aviso para quien lea el git log de esta fila**: al marcar la fila 88 como EN CURSO, una llamada
de subida se escribió con un valor de relleno en vez del contenido de verdad de `docs/COLA.md`
(35 caracteres, el mismo fallo de la regla 14 de `docs/COLA.md`, con otra causa: un parámetro sin
rellenar en la propia llamada, no una sustitución de shell). Se detectó al momento (tamaño de
salida muy corto) y se corrigió con una segunda subida, releyendo `docs/COLA.md` de antes de
tocarlo. Ninguna otra subida de esta fila lo repitió: todas se comprobaron con el tamaño en bytes
después de subir.

Batería completa en verde (94 ficheros de prueba), una sola pasada al final. Versión publicada
`App.VERSION`: `21-sep-2026 · 07:17`.

## 21-sep-2026 — Fila 86: pulsar la tarjeta de un documento la abre, y el aviso de huérfanas se calla 7 días

`docs/PULSAR-PARA-ABRIR-Y-AVISO-OCULTABLE.md`. Dos cambios, en una sola fila.

**1. Pulsar para abrir**, en toda la aplicación:

- `js/documentos-sueltos.js` ("Por clasificar"): la tarjeta entera llama a `App.abrirSuelto(s)`
  (que `js/visor.js` ya convierte en `Visor.abrir` con su marcador, como hacía el botón "Abrir").
- `js/documentos.js` (el cuadro "Documentos ▾"): no tiene panel de la derecha —es un cuadro modal
  con su propio visor a la izquierda—, así que pulsar la fila abre el mismo formulario que "Poner
  nombre", que ya enseña el documento mientras se rellenan los campos.
- `js/bandeja-pantalla.js` (bandeja de Gmail): solo si el correo trae su PDF, la tarjeta entera
  hace lo mismo que el botón "Leer el correo".
- `js/papelera.js`: un documento (o un suelto) se puede ver sin sacarlo de la papelera, resolviendo
  el handle igual que ya hace `devolverDocumento` (`carpetaPapelera()` →
  `getDirectoryHandle(ficha.carpeta)` → `getFileHandle(ficha.nombre)`).
- `js/ficha-documentos.js` ya cumplía (el nombre ya era un botón), y con él el ARCHIVO, que
  reutiliza esa misma pieza. `js/duplicados.js` no se toca: enseña carpetas de asuntos, no
  documentos.

Guardia común en los cuatro sitios tocados: `ev.target.closest('button, a, input, select,
textarea, label, .acciones')` antes de abrir nada, para que ningún botón de la fila —ni el menú de
tres puntos— dispare una apertura doble.

**2. El aviso de "fichas sin carpeta"** gana una ✕ (`js/avisos-que-faltan.js`) que lo calla 7 días.
Se guarda en `localStorage` (clave `aviso-huerfanas-callado`, nunca en `_GESTOR`: es una
preferencia de quien está delante del ordenador, no un dato del centro), con hasta cuándo calla y
cuántas fichas había al ocultarlo: si aparecen más antes de que pasen los 7 días, el aviso vuelve
solo. La decisión de pintar o no sale de una función sin pantalla, `sePintaHuerfanas(nAhora,
guardado)`, expuesta en `window.AvisosQueFaltan._sePintaHuerfanas` para poder probarla sola. El
aviso de la papelera vieja se queda sin ✕: la única salida sigue siendo decidir, porque son datos
de menores.

Pruebas ampliadas: `pruebas/documentos-sueltos.mjs` (test 7: pulsar la tarjeta abre el visor, y el
menú de tres puntos no lo hace) y `pruebas/avisos-que-faltan.mjs` (los cinco casos del callado:
sin nada guardado, recién ocultado, a los 3 días, a los 8 días, y con una ficha más). Batería
completa en verde, una sola pasada al final. Versión publicada `App.VERSION`: `21-sep-2026 ·
04:20`.

## 21-sep-2026 — Fila 85: las dos direcciones corregidas, fila cerrada

`datos/formularios.json`: la clave `u` de `O11:VI` y `O11:VII` pasa de
`https://www.juntadeandalucia.es/boja/2011/132/1` (la página web del BOJA, no un PDF) a
`https://www.juntadeandalucia.es/boja/2011/132/d1.pdf` (el PDF de verdad), como pedía el
documento. Las otras nueve direcciones del fichero y las cuatro entradas `via:"protocolo"`
(`O11:I` a `O11:IV`) no se tocan. Cierra la fila 85, bloqueada el 20-sep-2026 por falta de salida
a internet y ya resuelta en cuanto a los PDF: Francisco los subió a mano a `formularios/`
(`docs/FORMULARIOS-DESDE-EL-ZIP.md`), solo quedaban estas dos direcciones por corregir en el
JSON. Con esta fila y la 86, `docs/COLA.md` vuelve a quedar sin ninguna PENDIENTE.

## 21-sep-2026 — Fila 87: que el enlace de la normativa abra el artículo, no el bloque entero

`docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md`. Francisco pulsó la cita de un artículo en el bloque
"Normativa" de un hito y la aplicación le llevó a la página entera del bloque, sin abrir el
artículo. Tres causas, comprobadas contra la web publicada:

1. **La página limpia del artículo no estaba publicada** en `fmargon780/normativa-escolarizacion`
   (fusionada en `main` de aquel repositorio pero sin relanzar la publicación de Vercel). Ya
   resuelto por Francisco el propio 21-sep-2026, fuera de este repositorio: **un `main` fusionado
   no significa publicado**, hay que comprobarlo siempre.
2. **El Gestor enlazaba al bloque, no al artículo.** `HitosBiblioteca.enlaceDeNormativa`
   (`js/hitos-biblioteca.js`) montaba `<base>/<bloque>#r=<clave>`; ahora monta
   `<base>/norma#r=<clave>`, la vista de un solo artículo que pide `docs/ENLACE-POR-ARTICULO.md` de
   aquel repositorio. El bloque deja de intervenir en el enlace (sigue guardado, solo para saber
   dónde vive el artículo): la condición pasa de `bloque && clave && base` a `clave && base`. A
   `direccionBase` se le quita la barra final y, si lo llevara ya, un `/norma` final, para que no
   salga `/norma/norma`. La clave va por `encodeURIComponent`.
3. **La clave de ejemplo inducía a error**: `ROC-40.1` (con apartado) en vez de `ROC-40` (artículo
   entero, la única forma que la vista de un solo artículo sabe abrir). `js/hitos-normativa.js`
   cambia el marcador de posición, añade una línea de ayuda fija bajo la lista de referencias y un
   aviso suave por fila (nunca bloquea, nunca cambia lo escrito) cuando la clave tecleada lleva un
   punto. El desplegable de bloques pierde su frase "o enlace propio": ya no hace falta un bloque
   para que el enlace funcione.

También se retocó el texto de ayuda del campo "Dirección del sistema de normativa"
(`js/plantillas-ajustes.js`, montado por JS para no tocar `index.html`, que sigue siendo el dueño
de ese campo): la dirección exacta a escribir, `https://normativa.fmargon.com`, y el aviso de que
la red del instituto bloquea las direcciones `vercel.app`. Ningún valor guardado cambia, solo el
texto.

`pruebas/biblioteca-de-hitos.mjs`, apartado 8, reescrito con las seis comprobaciones del encargo
(clave sola, clave con bloque —mismo resultado—, base ya terminada en `/norma`, solo `url`, nada,
clave con base vacía). El apartado 9 (el espacio de la clave, guardado como guion) se queda como
estaba.

Esta sesión no tiene salida a internet a dominios fuera de la lista permitida (mismo motivo que las
filas 63 y 85): no ha podido comprobar con `curl`/`WebFetch` que
`https://normativa.fmargon.com/normas/ROC.json` responda 200 con la clave `ROC-40`. El código de
aquí queda igualmente correcto y probado con `npm test`; falta esa comprobación externa, para
quien la pueda hacer.

## 20-sep-2026 — Fila 85: bloqueada, sin salida a internet

`docs/COLA.md` pedía copiar a `formularios/` los once PDF en blanco que la fila 84 no pudo bajar
(`O-I.pdf` a `O-IX.pdf`, `O11-VI.pdf`, `O11-VII.pdf`, con sus direcciones de origen ya en
`datos/formularios.json`). Esta sesión probó dos caminos —`curl` directo y `WebFetch`— contra
`www.juntadeandalucia.es`, y los dos devolvieron el mismo rechazo del proxy de la organización
(`CONNECT tunnel failed, response 403` / `EGRESS_BLOCKED`): sin salida a internet, exactamente el
mismo motivo que ya bloqueó las filas 63 y 84. No queda ninguna fila PENDIENTE en `docs/COLA.md`;
queda esta, apuntada, para la próxima sesión con salida a internet general (o para que Francisco
copie los once PDF a mano en la carpeta `formularios/` del repositorio).

## 20-sep-2026 — Fila 84: el impreso, con los datos del centro ya puestos

`docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md`. Última de las cuatro filas acordadas de golpe el
20-sep-2026 (81 a 84): la 81 y la 82-83 las completó otra sesión en paralelo (PR #63, fusionada a
`main` mientras esta sesión hacía su propia fila 81 sin saberlo — se descartó esa duplicada, PR
#64, cerrada sin fusionar, y se sincronizó la rama con `main` antes de seguir).

**La regla que no se toca sin volver a hablarlo, escrita para que nadie la deshaga sin saberlo:**
un impreso oficial preparado con "Preparar para el tercero" rellena SOLO los datos del centro y el
año académico, nunca los de la persona (nombre, documento, domicilio, teléfono, tutores…), aunque
la aplicación los tenga. Es a propósito, decisión de Francisco: así, al recibir el impreso de
vuelta, se ve si algún dato de la persona ha cambiado desde la última vez. Un impreso que llega ya
relleno del todo no sirve para comprobar nada de eso. Queda anotado en "Descartado" de
`docs/CONTEXTO-CORTO.md`.

**Sin salida a internet para copiar los PDF de verdad**, como ya le pasó a la fila 63 (19-sep-2026):
el catálogo (`datos/formularios.json`, de la fila 82) ya trae la clave `f` con el nombre del PDF en
las once entradas de vía `descarga`/`centro`, pero la carpeta `formularios/` se queda vacía. Todo
lo demás —el mapa de casillas, `proponerMapa`, `rellenarPdf`, la pantalla de Ajustes y el botón—
está hecho y probado con PDF de mentira montados con la propia pdf-lib (que es, además, más fiable
que probar contra un PDF real de la Junta que puede cambiar de un día para otro). El mecanismo
funciona en cuanto se copien los once PDF, uno a uno, sin tocar ni una línea de código: la lista de
cuáles faltan queda en `docs/COLA.md`. Es exactamente el caso que el propio encargo preveía.

**Por qué `proponerMapa` mira "código" antes que "centro".** La regla de la tabla dice "centro,
denominación, instituto (y no código)": una casilla llamada "código del centro" contiene la
palabra "centro", así que si la regla de `{{CENTRO}}` se mirase primero, ganaría por error. El
orden de las comprobaciones es la propia regla, no un detalle de implementación: primero "código"
(-> `{{CODIGO CENTRO}}`), luego "domicilio/dirección junto a centro" (-> `{{DIRECCION CENTRO}}`,
que también contendría "centro"), y solo entonces "centro" a secas.

**Por qué el botón cuelga de un atributo (`data-clave-formulario`) y no envuelve nada nuevo.**
`js/formularios.js` (fila 82) ya pinta la lista de un hito y la línea "Formularios" de la ficha; en
vez de que `js/formularios-rellenar.js` reimplemente esa pintura o envuelva las funciones que la
hacen, `js/formularios.js` gana un atributo `data-clave-formulario` en cada chip (dos líneas de
cambio, ya en `main` gracias a la fila 82). `js/formularios-rellenar.js` solo necesita saber qué
asunto está abierto (lo consigue envolviendo `App.abrirFicha`, como el resto de módulos que
cuelgan un botón de la ficha) y vigilar la ficha con un `MutationObserver` para colgar el botón en
cuanto aparezca un chip nuevo, sin tocar el fichero de la fila 82 más que en ese punto previsto.

**Un fallo de coordinación con la sesión de la PR #63, para que quede escrito.** Esta sesión hizo
su propia fila 81 completa (cargos, membrete, `Docx.ponerImagen`) sin saber que otra sesión, en
paralelo, la estaba haciendo también — las dos partieron del mismo `docs/COLA-NUEVAS-2026-09-20.md`
casi a la vez. Se detectó a tiempo (Francisco avisó de que había "otra conversación corriendo") y
se resolvió sin pisar nada: la PR duplicada se cerró sin fusionar, y la rama se sincronizó con
`main` (`git checkout origin/main -- .` más `git rm` de los dos ficheros de Ajustes que la otra
sesión no había separado igual) antes de seguir con la única fila que quedaba. Motivo para
dejarlo escrito: cuando dos sesiones parten del mismo documento de instrucciones nuevas casi a la
vez, conviene comprobar pronto (antes de escribir mucho código) si alguna ya está en marcha.

Ficheros nuevos: `js/formularios-rellenar.js`, `pruebas/formularios-rellenar.mjs`. Tocados:
`datos/formularios.json` (clave `f`), `js/formularios.js` (`data-clave-formulario`),
`js/plantillas.js` (`provincia`), `js/plantillas-ajustes.js` e `index.html` (el campo Provincia),
`js/copias.js` (`formularios-campos.json`, decimoctavo fichero compartido),
`js/ajustes-centro.js` (engancha "Impresos oficiales"), `js/envolturas-esperadas.js`. Batería
completa en verde (86 ficheros de prueba), una sola pasada al final.

## 20-sep-2026 — Fila 83: las plantillas de documento y de correo del centro

`docs/PLANTILLAS-DEL-CENTRO.md`. Las filas 14 y 17 montaron la máquina de plantillas de correo y
de documento; llevaban vacías desde entonces. Con la biblioteca de hitos ya llena (fila 80), y
los cargos, el membrete (fila 81) y los formularios (fila 82) ya montados, esta fila por fin
escribe los textos y los mete en la aplicación sin que Francisco tenga que subir nada a mano.
