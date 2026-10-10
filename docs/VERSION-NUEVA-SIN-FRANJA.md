# La versión nueva, sin franja (fila 325)

Cerrado con Francisco el 10-oct-2026. Sale de la idea 325, apuntada por él desde el Centro de
mando. Sigue a `docs/COPIA-SIN-INTERNET.md` (fila 89), `docs/COPIA-SE-ACTUALIZA.md` (fila 91),
`docs/AVISO-DE-VERSION-SEGURO.md` (fila 121), `docs/CORREO-VERSIONES-Y-LIMPIEZA.md` (fila 178,
punto 4) y `docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md` (fila 318).

## Qué pidió

> ¿Por que esta app tiene el problema del bloqueo del proxy en la red del centro para poder
> actualizarse y BD Alumnado y Centro de datos ies, no? ¿Qué les diferencia?

Sin imágenes. En la conversación contó lo que ve en el ordenador del centro: «Sale una franja
arriba amarilla avisando de la nueva actualización y le damos a un botón».

## La respuesta a su pregunta (para que conste)

- BD Alumnado y el Centro de datos viven dentro de Google (`script.google.com`). La red del centro
  no corta Google, y Google sirve siempre la última versión.
- El Gestor vive en Vercel (`asuntos.fmargon.com`). La red del centro corta esa dirección por su
  nombre. Por eso allí se usa la copia sin internet, que se baja cada versión nueva de GitHub y
  la guarda en su carpeta de Dropbox.
- El Gestor no puede mudarse a Google: trabaja sobre carpetas del disco, y una página servida por
  Google Apps Script va dentro de un marco de otro sitio, donde Chrome no deja abrir el selector de
  carpetas.
- La copia del centro sí se actualiza. Lo que sobra es la franja y el botón. Salen porque Chrome
  retira cada día el permiso sobre la carpeta de la copia, y solo lo devuelve tras una pulsación.

## Qué pasa hoy

- Copia sin internet (`file://`, primer bloque de `js/actualizar-copia.js`): al abrir lee la
  versión de GitHub. Si es distinta y la carpeta recordada (`copiaCarpeta` en `Almacen`) tiene
  permiso, se actualiza sola y recarga. Sin permiso, pinta la franja ámbar «Hay una versión nueva
  del Gestor…» con «Actualizar ahora». Es lo que le pasa a Francisco cada mañana.
- Con la aplicación abierta, cada 30 minutos vuelve a mirar. Si hay versión nueva, la misma
  franja. Estos días se publican muchas versiones y la franja sale varias veces en una mañana.
- Web (segundo bloque del mismo fichero, fila 178): cada 30 minutos y al recuperar el foco, la
  misma franja con «Recargar».
- «Entrar» (`$('btn-entrar').onclick`, `js/nucleo.js`) pide ya el permiso de las carpetas
  recordadas del alumnado, la bandeja y el Centro de datos (fila 318). La de la copia se dejó
  fuera a propósito en aquella fila. Ahora entra.

## Qué quiere Francisco (decidido por él el 10-oct-2026)

1. **Al pulsar «Entrar»** en la copia del centro, la aplicación pide también el permiso de la
   carpeta de la copia. Si hay versión nueva, la baja, se recarga sola y entra. Sin franja ni
   botón.
2. **Con la aplicación abierta**, sin franja. Junto al número de versión del menú de la izquierda
   sale una marca pequeña, «hay versión nueva». Pulsarla actualiza en ese momento. Si no se pulsa,
   se pone al día en el siguiente «Entrar».
3. **Nunca se recarga sola** mientras se trabaja.
4. **La franja amarilla queda solo para cuando algo falla**: la actualización no sale, o no se
   puede comprobar si hay versión nueva.
5. **En la web** (`asuntos.fmargon.com`), la franja con «Recargar» se cambia por la misma marca,
   para que se vea igual en los dos sitios.

Decidido por Claude en el diseño:

- El permiso de la carpeta de la copia se pide en «Entrar» **solo si hay una versión nueva
  esperando**. Si la copia está al día, ni se mira ni se pide (como hoy).
- Antes de recargar por la marca, una pregunta: recargar pierde lo que esté a medio escribir.
- Si Francisco dice que no al cuadro del navegador, entra con la versión que tiene y queda la
  marca. No es un fallo: no sale la franja.
- Sin carpeta recordada (primera vez en un ordenador, o carpeta equivocada) sigue saliendo la
  franja de hoy con «Actualizar ahora»: hay que señalar una carpeta, y eso se hace una vez.
- También se actualiza en «solo consultar» y con perfil de directivo: es la carpeta de la
  aplicación, no la de los datos.
- No se sabe desde aquí si Chrome ofrece «Permitir en cada visita» en una página abierta como
  fichero. El diseño vale en los dos casos: si no lo ofrece, queda una pulsación en «Permitir» las
  mañanas en que haya versión nueva. Lo comprueba Francisco (punto 11 de «Cómo sabemos que está
  bien»).

## Qué hay que hacer

### 1. Partir `js/actualizar-copia.js`

Tiene 543 líneas y va a crecer. Antes de añadir nada:

- El segundo bloque (la web, desde «fila 178» hasta el final) pasa tal cual a un fichero nuevo,
  `js/aviso-version-web.js`. `window.AvisoVersionWeb` sigue llamándose igual.
- Si el primer bloque sigue pasando de 600 líneas con lo de abajo, se parte por temas (por
  ejemplo, los avisos a `js/actualizar-copia-avisos.js`), con el estado común en
  `ActualizarCopia._interno`.

### 2. La marca «hay versión nueva»

Fichero nuevo `js/marca-version.js` (`window.MarcaVersion`; mira antes que el nombre esté libre).
No envuelve nada. Lo usan la copia y la web.

- `MarcaVersion.poner(versionNueva, alActualizar)`: pinta la marca dentro de `#usuario-pie`,
  justo detrás del número de versión. `MarcaVersion.quitar()` la quita. `MarcaVersion.hay()`.
- Texto: «hay versión nueva». Pequeña, en ámbar, en la misma línea que la versión si cabe. Con
  `title` «Hay una versión nueva del Gestor (<versión>). Pulsa para actualizar ahora.», `role`
  de botón y pulsable con Intro.
- **No rompe el número de versión**, que sigue abriendo «Qué hay de nuevo»
  (`Novedades.hacerPulsable`, `js/novedades-ventana.js`). La marca es un elemento aparte. Ojo:
  `js/nucleo.js` reescribe `#usuario-pie` al entrar y `hacerPulsable` lo rehace buscando el texto
  de la versión; la marca tiene que sobrevivir a los dos, o volver a pintarse después.
- Si todavía no se ha entrado (`#usuario-pie` vacío), se recuerda y se pinta al entrar.
- Al pulsarla, una pregunta con `U.preguntar` (un solo cuadro a la vez; si hay otro abierto, no
  hace nada):
  - Título: «Actualizar el Gestor».
  - Texto: «Hay una versión nueva (<versión nueva>). Esta pantalla tiene la <versión actual>. Al
    actualizar, la aplicación se recarga: lo que esté a medio escribir se pierde.»
  - Botones: «Actualizar ahora» y «Cancelar».
  - «Cancelar»: se cierra, la marca sigue.
  - «Actualizar ahora»: si hay un guardado en marcha (`ColaGuardado.hayGuardado()`), espera a que
    termine. Después llama a `alActualizar` **dentro de esa misma pulsación** (en la copia hace
    falta para pedir el permiso de la carpeta).

### 3. La copia sin internet (`file://`)

En el primer bloque de `js/actualizar-copia.js`:

**Al abrir, antes de entrar.**

- Al día: nada, como hoy.
- Versión nueva, carpeta recordada y con permiso: se actualiza sola y recarga, como hoy.
- Versión nueva, carpeta recordada y **sin permiso**: **ya no pinta la franja**. Se queda
  apuntado que hay una versión esperando (`ActualizarCopia.pendiente()`).
- Versión nueva y sin carpeta recordada, carpeta equivocada (la marca de `sessionStorage` contra
  el bucle) o no se ha podido comprobar: la franja de hoy, sin cambios.

**Al pulsar «Entrar».** Función nueva `ActualizarCopia.alEntrar()`, que devuelve `true` si va a
recargar la página.

- Si no hay versión esperando, devuelve `false` al momento. No mira ni pide ningún permiso.
- Si la comprobación de la versión todavía no ha contestado, la espera **como mucho 2 segundos**.
  Si no llega, devuelve `false` y se entra; cuando llegue, sale la marca.
- Con versión esperando: pide el permiso de la carpeta de la copia (`requestPermission`, modo
  `readwrite`) **sobre la carpeta recordada**, sin volver a guardarla. La petición tiene que salir
  en la misma tanda que las de la fila 318 (`PermisosCarpetas.pedirAlEntrar`), todas seguidas y
  sin esperar la respuesta de una para lanzar la otra: la pulsación caduca a los pocos segundos.
  Decide la sesión si es un elemento más de la lista de `js/permisos-carpetas.js` (que no salga
  entonces en el panel como carpeta nueva) o una llamada al lado.
- Con el permiso dado: el botón «Entrar» se apaga y dice «Actualizando el Gestor…». Se actualiza
  con `actualizarConReintento`, se apunta en `sessionStorage` que hay que entrar sola (ver abajo)
  y se recarga con `recargar` (que ya deja la marca contra el bucle). Devuelve `true`.
- Sin permiso (dijo que no, o el navegador lo rechaza): devuelve `false`, se entra con la versión
  que hay y sale la marca. Sin franja.
- Si la actualización falla: devuelve `false`, se entra, y sale la franja de hoy con su detalle
  («No se ha podido actualizar sola: …») y «Actualizar ahora». El botón «Entrar» vuelve a su
  texto.
- Tiempo máximo: si a los 60 segundos no ha terminado, se deja de esperar, se entra y sale la
  franja con «No se ha podido actualizar: la descarga tarda demasiado.». Una actualización
  abandonada así **no recarga la página** si termina después.

En `js/nucleo.js` (661 líneas: **no puede crecer** más que una línea), detrás de la llamada a
`PermisosCarpetas.pedirAlEntrar()`:
`if (window.ActualizarCopia && ActualizarCopia.alEntrar && await ActualizarCopia.alEntrar()) return;`

**Entrar sola después de recargar.** Vale para la copia y para la web.

- Quien recarga para actualizar apunta en `sessionStorage` (`gestor-entrar-sola`, con la hora).
- Al cargar la página, si esa marca tiene menos de 60 segundos: se borra, y si las dos carpetas de
  Dropbox recordadas tienen permiso **sin pedirlo** (`queryPermission`) y hay nombre de usuario,
  se entra sin pulsación, por el mismo camino que el botón. Sin pulsación no se pide ningún
  permiso (como `Demo.sinPulsacion` en `PermisosCarpetas`).
- Si falta algún permiso, no se entra: la pantalla de entrada dice, encima del botón, «Gestor
  actualizado a la versión <versión>. Pulsa «Entrar».».
- Va en un fichero nuevo pequeño (`js/entrar-sola.js`) o dentro de `js/marca-version.js`. No en
  `js/nucleo.js`.

**Con la aplicación abierta** (`comprobar(true)`, cada 30 minutos).

- Versión nueva: **no pinta la franja**. `MarcaVersion.poner(remoto.version, …)`.
- Al confirmar en la pregunta: lo mismo que hace hoy `actualizarAhora` (permiso sobre la carpeta
  recordada dentro de la pulsación, o selector de carpeta si no hay ninguna, versión leída otra
  vez sin caché, `actualizarConReintento`), apunta «entrar sola» y recarga.
- Si falla: la franja de hoy con su detalle. La marca sigue.
- Si en una vuelta la versión remota vuelve a ser la de la pantalla, la marca se quita.
- No se ha podido comprobar: la franja «No he podido comprobar si hay una versión nueva…», como
  hoy.

**«Comprobación al entrar»** (`js/comprobacion-entrada.js`, fila «Copia sin internet al día»):
cuando hay versión nueva, el botón dice «Actualizar ahora» (dato `boton`, fila 318) y hace lo
mismo que pulsar la marca (abre la pregunta). Hoy busca el botón de la franja, que ya no estará.
La frase: «Hay una versión nueva del Gestor (<nueva>) y esta copia tiene la <actual>. Se pone al
día sola al pulsar «Entrar»; si la quieres ya, pulsa «Actualizar ahora».»

### 4. La web

En `js/aviso-version-web.js`:

- Versión nueva: `MarcaVersion.poner(remota, function () { /* apunta «entrar sola» */ location.reload(); })`
  en vez de `pintarFranjaWeb`. Versión igual: `MarcaVersion.quitar()`.
- `pintarFranjaWeb` y `quitarFranjaWeb` desaparecen. En la web ya no hay franja de versión.
- Lo demás no cambia: cada 30 minutos, al recuperar el foco, y nunca con un guardado en marcha.

### 5. La copia de demostración

Para que el revisor lo vea por `http://localhost` (ahí es la web, no la copia):

- Parámetro `versionnueva=1`: `?demo=1&auto=1&versionnueva=1`. La comprobación de la web da por
  buena una versión remota inventada («31-dic-2099 · 23:59») y se lanza sola nada más entrar, sin
  esperar 30 minutos.
- Tras recargar desde la marca, en esa pestaña ya no vuelve a salir (se apunta en
  `sessionStorage`), para que se vea que se ha «actualizado».
- Vive en `js/demo/` (fichero nuevo `js/demo/version-nueva.js`, cargado desde
  `js/demo/arrancar.js`). En producción no se carga. Sin el parámetro, la demostración queda
  exactamente como hoy.

## Lo que no cambia

- Cómo se baja y se escribe la versión nueva (`actualizarEn`, los sha256, `version.json` el
  último, el reintento de la fila 157) y la marca contra el bucle de recargas.
- `ABRIR EL GESTOR.html`, `scripts/copia-local.mjs` (copia `js/` entero: los ficheros nuevos
  entran solos; compruébalo) y el repositorio `gestor-asuntos-copia`.
- La franja para: sin carpeta recordada, carpeta equivocada, actualización fallida y «No he
  podido comprobar…».
- La actualización sola al abrir cuando el permiso ya está dado.
- El texto «· copia sin internet» junto a la versión y la ventana «Qué hay de nuevo».
- Los permisos de las demás carpetas (fila 318).

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-325`, revisor en local y, con su aprobación, a `main`, sin
  dejar ninguna petición de cambios abierta.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`, este documento y los
  ficheros de abajo.
- Ningún fichero de `js/` pasa de 600 líneas. `js/nucleo.js` solo recibe la línea del punto 3.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La copia que hay hoy en el centro lleva el código viejo: la primera actualización a esta
  versión todavía saldrá con la franja y el botón. Es lo esperado; díselo a Francisco al terminar.
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- copia version novedades permisos comprobacion`). La pasada completa, una sola vez,
  al final.

## Ficheros

- `js/actualizar-copia.js`: sin el bloque de la web; `pendiente()`, `alEntrar()`, la marca en vez
  de la franja con la aplicación abierta (punto 3).
- `js/aviso-version-web.js`: nuevo, con el bloque de la web y la marca (puntos 1 y 4).
- `js/marca-version.js`: nuevo (punto 2). `js/entrar-sola.js`: nuevo, si no va dentro del anterior.
- `js/nucleo.js`: una línea en «Entrar».
- `js/permisos-carpetas.js`: solo si la carpeta de la copia entra en su tanda.
- `js/comprobacion-entrada.js`: la fila «Copia sin internet al día».
- `js/novedades-ventana.js`: solo si hace falta para que la marca sobreviva a `hacerPulsable`.
- `index.html`: los `<script>` nuevos, en su sitio (la marca antes de quien la usa).
- `js/demo/version-nueva.js` y `js/demo/arrancar.js`: el parámetro `versionnueva=1`.
- `pruebas/copia-sin-internet.mjs`: se cambian los casos «sin permiso» y se añaden estos, con el
  disco de mentira que ya tiene:
  1. Al día: ni franja ni marca; al pulsar «Entrar» no se mira ni se pide el permiso de la copia.
  2. Versión nueva, carpeta recordada sin permiso: al abrir, ni franja ni petición de permiso. Al
     pulsar «Entrar»: una sola petición sobre la carpeta recordada, se escriben los ficheros que
     cambian, una sola recarga, y tras recargar la aplicación está dentro sin otra pulsación, con
     la versión nueva, sin franja y sin marca. La carpeta guardada en `Almacen` es la misma.
  3. Igual, pero se niega el permiso: se entra con la versión vieja, sin franja, con la marca en
     `#usuario-pie`. No se escribe nada.
  4. Igual, pero la descarga falla las dos veces: se entra con la versión vieja y sale la franja
     con su detalle.
  5. Con la aplicación abierta y versión nueva (`ActualizarCopia.comprobar(true)`): sin franja,
     con marca. El número de versión sigue abriendo «Qué hay de nuevo». Pulsar la marca abre la
     pregunta; «Cancelar» no recarga ni escribe; «Actualizar ahora» actualiza, recarga una vez y
     vuelve dentro.
  6. La comprobación de la versión tarda 10 segundos en contestar: «Entrar» entra en menos de 4
     sin actualizar, y la marca sale cuando contesta.
  7. Tras recargar para actualizar, si las carpetas de Dropbox no tienen permiso: no se entra y
     la pantalla de entrada dice «Gestor actualizado a la versión …. Pulsa «Entrar».».
  8. Sin carpeta recordada, carpeta equivocada y servidor apagado: como hoy (los casos que ya hay).
- `pruebas/marca-version.mjs`: nueva, con la demostración por `http://`. Los puntos 1 a 7 de
  «Cómo sabemos que está bien», y además: varias llamadas seguidas a `AvisoVersionWeb.comprobar()`
  no recargan nunca la página ni pintan dos marcas.
- Las pruebas que miran `#franja-copia` en la web (búscalas con `grep`), `pruebas/novedades.mjs`,
  `pruebas/comprobacion-entrada.mjs` y `pruebas/permisos-carpetas.mjs`: siguen en verde, puestas
  al día si contaban con la franja.
- `js/novedades.js`, al principio (frase corta, sin nombres de ficheros; mira el largo que admite
  `pruebas/novedades.mjs`): «El Gestor se pone al día solo al pulsar «Entrar». Con la aplicación
  abierta ya no sale la franja amarilla: junto al número de versión sale «hay versión nueva», y
  se puede pulsar.»
- Al terminar: `docs/COPIA-SE-ACTUALIZA.md` (una nota arriba que remita aquí),
  `docs/COPIA-DE-PRUEBAS.md` (el parámetro), `docs/CONTEXTO.md` (el párrafo «La web también avisa
  de versión nueva», sustituido), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (los módulos y la
  prueba nuevos, y la línea de `js/actualizar-copia.js`), `docs/contexto/PANTALLA.md` si nombra la
  franja, y `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`:
  - Sección 5, se **sustituye** la línea «Copia sin internet (`file://`): se actualiza sola…» por:
    «Versión nueva (fila 325): la copia sin internet (`file://`) se actualiza sola al abrir si
    tiene permiso sobre su carpeta y, si no, al pulsar «Entrar» (pide el permiso, baja la versión,
    recarga y entra sola; `ActualizarCopia.alEntrar`). Con la aplicación abierta, en la copia y en
    la web, sin franja: marca «hay versión nueva» junto al número de versión (`js/marca-version.js`),
    que pregunta antes de recargar. La franja ámbar solo sale si algo falla.»
  - Sección 6, una línea: «Nada recarga la página sin una pulsación de quien la usa, salvo la
    actualización de la copia antes de entrar. Un aviso de versión nueva es la marca
    (`MarcaVersion.poner`), nunca una franja (fila 325).»
  - Sección 7, una línea: «Mudar el Gestor a Google Apps Script para esquivar el filtro de la red
    del centro: una página servida por Google no puede abrir carpetas del disco (idea 325).»
- `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`: el punto 11 de abajo.

## Qué dirá Claude Code a Francisco al terminar

En cuatro frases: que el Gestor se pone al día solo al pulsar «Entrar»; que con la aplicación
abierta ya no sale la franja, sino «hay versión nueva» junto al número de versión del menú de la
izquierda; que **esta primera vez** la copia del centro todavía pedirá «Actualizar ahora» con la
franja de siempre, porque el cambio llega con esta misma versión; y que la mañana siguiente elija
«Permitir en cada visita» si el navegador lo ofrece.

## Cómo sabemos que está bien

En la copia de demostración, con el parámetro del punto 5.

1. Abrir `?demo=1&auto=1&versionnueva=1`. Arriba **no** sale ninguna franja amarilla.
2. En el menú de la izquierda, abajo, junto al número de versión, se lee «hay versión nueva».
3. Pulsar el número de versión (no la marca): se abre «Qué hay de nuevo», como siempre. Cerrarlo.
4. Pulsar «hay versión nueva»: sale un cuadro titulado «Actualizar el Gestor», que dice que la
   aplicación se recarga y que lo que esté a medio escribir se pierde, con los botones «Actualizar
   ahora» y «Cancelar».
5. Pulsar «Cancelar»: el cuadro se cierra, la página no se recarga y la marca sigue.
6. Escribir algo en la caja del tablón sin guardarlo y esperar un minuto: la página no se recarga
   sola y lo escrito sigue ahí.
7. Pulsar otra vez la marca y «Actualizar ahora»: la página se recarga, vuelve a estar dentro de
   la aplicación (en Inicio) y la marca ya no sale.
8. Abrir `?demo=1&auto=1` (sin más): ni franja ni marca. El número de versión abre «Qué hay de
   nuevo».
9. Con `?demo=1&auto=1&versionnueva=1`, abrir «Comprobación al entrar» pulsando su marca de la
   barra lateral: no hay ninguna fila que mande pulsar un botón de una franja que no existe.
10. En una ventana estrecha (1.000 píxeles de ancho), la marca no se monta encima del número de
    versión ni del nombre de la sesión.
11. [SOLO FRANCISCO] En el ordenador del centro, **a partir de la segunda mañana** con esta
    versión: al pulsar «Entrar» con una versión nueva publicada, el navegador enseña un cuadro para
    la carpeta de la copia. Elegir «Permitir en cada visita» si lo ofrece. La aplicación dice
    «Actualizando el Gestor…», se recarga y entra sola, sin franja. Durante la mañana, si llega
    otra versión, no sale la franja: sale «hay versión nueva» junto al número de versión. Si el
    cuadro no ofrece «Permitir en cada visita», decírselo a Claude: queda una pulsación en
    «Permitir» las mañanas en que haya versión nueva.
