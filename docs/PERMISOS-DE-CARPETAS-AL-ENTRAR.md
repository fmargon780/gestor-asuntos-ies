# Los permisos de las carpetas, al entrar (fila 318)

Cerrado con Francisco el 9-oct-2026. Sale de la idea 318, apuntada por él desde el Centro de
mando. Sigue a `docs/COMPROBACION-AL-ENTRAR.md` (fila 204).

## Qué pidió

> Estos dos errores me aparecen todas las mañanas al abrir la aplicación en el ordenador del
> centro (versión sin internet). ¿Existe forma de que se queden arreglados una vez que lo
> configuro? Ahora lo tengo que hacer todas las mañanas

Adjuntó un recorte del panel «Comprobación al entrar»: «Carpetas de Dropbox» en verde («Señaladas
y con permiso.»), «Base de datos de alumnado» en ámbar y «Bandeja de Gmail» en rojo, las dos con
«El navegador ha dejado de dar permiso a la carpeta… Hay que volver a señalarla.».

## Qué pasa hoy

- Al pulsar «Entrar» (`$('btn-entrar').onclick`, en `js/nucleo.js`), la aplicación pide el permiso
  de las dos carpetas de Dropbox con `Carpetas.permiso(carpeta, true)`. Lo pide sobre la carpeta
  **que ya tenía recordada**. Francisco dice que no le sale ningún cuadro del navegador: Chrome
  guarda ese permiso de un día para otro.
- Para las demás carpetas recordadas (la de la base de datos de alumnado, la de la bandeja y la
  del Centro de datos) **nadie pide el permiso al entrar**. El panel dice «Hay que volver a
  señalarla» y «Arreglarlo» lleva a Ajustes, donde Francisco la señala otra vez con el selector de
  carpetas. Un permiso dado así vale solo para ese día, y además sustituye la carpeta recordada
  por una nueva.
- Chrome solo ofrece guardar el permiso («Permitir en cada visita») cuando se le pide con
  `requestPermission()` sobre una carpeta recordada. Por eso las de Dropbox se quedan y las otras
  no.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. Al pulsar «Entrar», la aplicación pide también el permiso de la carpeta del alumnado, de la
   bandeja y del Centro de datos, **sin tener que señalar nada**.
2. La primera mañana el navegador enseña un cuadro por carpeta. Él elige «Permitir en cada visita»
   y no vuelve a salir.
3. En «Comprobación al entrar», el botón de esas filas da el permiso con una sola pulsación. Solo
   manda a señalar la carpeta cuando de verdad se ha movido o borrado.
4. Si dice que no a un cuadro, entra igual y esa fila sale en el panel.
5. Las carpetas marcadas «No lo uso en este ordenador» no se piden.

Decidido por Claude en el diseño:

- La carpeta de la copia sin internet (`copiaCarpeta`, `js/actualizar-copia.js`) **no se toca**:
  ya pide el permiso sobre la carpeta recordada con su botón «Actualizar ahora», y actualizar la
  copia a mitad de la entrada recargaría la página.
- Las carpetas de Dropbox no cambian: ya funcionan.
- No se añaden botones nuevos en Ajustes. El de «Volver a dar permiso» del Centro de datos y el de
  «Dar permiso a la bandeja» de la pantalla se quedan como están.
- No se sabe desde aquí si Chrome ofrece «Permitir en cada visita» para una página abierta como
  fichero (`file://`) y para carpetas de Drive. El diseño vale en los dos casos: si no lo ofrece,
  queda una pulsación en «Permitir» por carpeta cada mañana, sin volver a señalar nada. Lo
  comprueba Francisco (punto 12 de «Cómo sabemos que está bien»).

## Qué hay que hacer

### 1. Un módulo para los permisos de las carpetas recordadas

Fichero nuevo `js/permisos-carpetas.js` (`window.PermisosCarpetas`). No envuelve nada.

- Una lista de las carpetas recordadas, con el mismo `id` que usa su fila en
  `js/comprobacion-entrada.js`:
  - `alumnado`: `AlumnadoBD.carpeta()`, permiso con `AlumnadoBD.permiso` (solo lectura).
  - `centro-de-datos`: `CentroDeDatos.carpeta()`, permiso con `CentroDeDatos.permiso` (solo
    lectura).
  - `bandeja`: `Almacen.leer('bandeja')`, permiso con `Carpetas.permiso` (el modo de siempre).
  Si `AlumnadoBD.permiso` no está en lo que exporta el módulo, se exporta. **Cada carpeta pide el
  mismo modo que pide hoy**: no se cambia ninguno.
- `PermisosCarpetas.estado(id)`: `'sin-carpeta'`, `'con-permiso'` o `'sin-permiso'`. Solo mira
  (`queryPermission`), nunca pide.
- `PermisosCarpetas.pedir(id)`: pide el permiso de esa carpeta (`requestPermission`). Devuelve
  `true` si queda con permiso. Nunca lanza: un rechazo o un error del navegador es `false`.
  **No vuelve a guardar la carpeta en `Almacen`**: la recordada es la que vale.
- `PermisosCarpetas.pedirAlEntrar()`: para cada carpeta de la lista que esté recordada, que no
  tenga permiso y que no esté en `ComprobacionEntrada.leerOmitidas()`, pide el permiso. Devuelve
  qué ha quedado con permiso y qué no.
  - El navegador solo deja pedir un permiso justo después de una pulsación, y esa pulsación caduca
    a los pocos segundos. Por eso **se lanzan todas las peticiones seguidas, sin esperar la
    respuesta de una para lanzar la siguiente**, y después se esperan todas juntas. Si aun así el
    navegador rechaza alguna, no es un error: esa carpeta queda sin permiso y sale en el panel.
  - No avisa de nada en pantalla ni escribe nada. Lo que quede sin permiso lo cuenta el panel.
  - Con tiempo máximo: si a los 60 segundos alguna petición sigue sin contestar (el cuadro del
    navegador abierto), se deja de esperar y la entrada sigue.
- En la copia de demostración (`Demo.activo()`) usa las carpetas de mentira (punto 4).
- En «solo consultar» y con perfil de directivo: mira qué lee hoy cada módulo en ese modo y **no
  pidas permiso para una carpeta que ese modo no va a leer**. Déjalo escrito en la nota de la
  fila, en una línea.

### 2. «Entrar» pide también esos permisos

En `js/nucleo.js` (659 líneas: **no puede crecer**; si hace falta, la llamada es una sola línea),
en `$('btn-entrar').onclick`:

- Después de comprobar `ok1` y `ok2` (las dos carpetas de Dropbox con permiso), y antes de seguir,
  `if (window.PermisosCarpetas) await PermisosCarpetas.pedirAlEntrar();`.
- El resultado no para la entrada nunca. Sin permiso sobre alguna de esas carpetas se entra igual,
  como hoy.
- Las lecturas de después (`alEntrar` de `js/alumnado-bd.js` y de `js/centro-de-datos.js`, y la
  mirada de `js/bandeja-correos.js`, las tres por `Gestor.alRefrescar`) ya se encuentran el
  permiso dado y traen lo suyo solas. Compruébalo; si alguna se queda sin traer, haz que traiga.

Si hay otra puerta de entrada con pulsación (la de «Entrar con datos de demostración»), la misma
llamada, para que el revisor pueda verlo.

### 3. El panel «Comprobación al entrar»

En `js/comprobacion-entrada.js` (409 líneas), en las filas `alumnado`, `centroDeDatos` y
`bandeja`, **solo en el caso de «hay carpeta recordada pero el navegador no da permiso»**:

- La frase pasa a ser (con el nombre de cada carpeta):
  - Alumnado, con copia: «El navegador pide otra vez el permiso de la carpeta de la base de datos
    de alumnado; mientras tanto se usa la última copia. Pulsa «Dar permiso»: no hay que volver a
    señalarla.»
  - Alumnado, sin copia: «El navegador pide otra vez el permiso de la carpeta de la base de datos
    de alumnado. Pulsa «Dar permiso»: no hay que volver a señalarla.»
  - Centro de datos: «El navegador pide otra vez el permiso de la carpeta del Centro de datos.
    Pulsa «Dar permiso»: no hay que volver a señalarla.»
  - Bandeja: «El navegador pide otra vez el permiso de la carpeta de la bandeja. Pulsa «Dar
    permiso»: no hay que volver a señalarla.»
  - Las tres acaban con una segunda frase: «Si el navegador ofrece «Permitir en cada visita»,
    elígelo y no volverá a pedirlo.»
- El resultado lleva dos datos nuevos, opcionales: `boton: 'Dar permiso'` y `darPermiso` (una
  función que llama a `PermisosCarpetas.pedir(id)`). `arreglar` se queda como está, por si acaso.
- El color no cambia: ámbar donde hoy es ámbar, rojo donde hoy es rojo.
- Los demás casos de esas filas (sin carpeta señalada, la carpeta ya no tiene el fichero, no se
  puede leer, índice que no vale) **siguen igual**, con «Arreglarlo» y su salto a Ajustes.

En `js/comprobacion-entrada-ver.js` (214 líneas):

- El botón de una fila dice `f.boton` si lo trae, y si no «Arreglarlo».
- Una fila con `darPermiso`: al pulsar su botón **no se cierra el panel ni se va a Ajustes**. La
  petición sale dentro de la propia pulsación, sin ninguna espera antes (si se espera, el
  navegador la rechaza). Mientras contesta, el botón se apaga.
  - Si da el permiso: aviso verde «Permiso dado a la carpeta de …» (con el nombre de la fila), se
    trae lo de esa carpeta sin más pulsaciones (`AlumnadoBD.traer`, `CentroDeDatos.traer`,
    `Bandeja.pedirPermiso` o lo que toque, sin que pida otro permiso), y se vuelve a comprobar
    todo: la fila sale en verde en el mismo panel y la marca de la barra lateral se pone al día.
  - Si no lo da: aviso ámbar «Sin permiso no puedo leer la carpeta de …». La fila se queda como
    estaba, con su botón encendido otra vez.
- «No lo uso en este ordenador», «Volver a comprobar» y «Ahora no» no cambian.

### 4. La copia de demostración

Para que el revisor pueda verlo sin el navegador de verdad (en la demostración el disco es de
mentira y no hay cuadros del navegador):

- Parámetro `sinpermiso=` en la dirección, con los `id` separados por comas:
  `?demo=1&auto=1&sinpermiso=alumnado,bandeja,centro-de-datos`. Las carpetas de mentira de esos
  `id` existen, están recordadas y **empiezan sin permiso**: `queryPermission` da `'prompt'` hasta
  que se llame a `requestPermission`, que da `'granted'` y a partir de ahí lo recuerda (hasta
  recargar).
- Parámetro `niega=`, igual: para esos `id`, `requestPermission` da `'denied'`.
- Con `sinpermiso=`, las filas del panel **no** se dan por buenas por estar en la demostración
  (hoy `bandeja()` devuelve «Señalada.» sin mirar el permiso si `enDemo()`).
- Si en la demostración no hay carpeta de la base de datos de alumnado, se crea una de mentira con
  su `ALUMNADO-BD.json` solo cuando `sinpermiso=` la nombra. Sin el parámetro, la demostración
  queda exactamente como hoy.
- Con `auto=1` no hay pulsación en «Entrar»: no se pide nada al entrar y el panel sale con esas
  filas. Sin `auto=1`, al pulsar «Entrar con datos de demostración» sí se piden.
- Todo esto vive en `js/demo/` (un fichero nuevo si hace falta, `js/demo/permisos.js`, cargado
  desde `js/demo/arrancar.js`). En producción no se carga.

## Lo que no cambia

- Las carpetas de Dropbox, la de la copia sin internet y sus avisos.
- Dónde se señala cada carpeta en Ajustes, y sus botones de hoy.
- El modo (leer, o leer y escribir) que pide cada carpeta.
- Las demás filas del panel, «No lo uso en este ordenador» y la marca de la barra lateral.
- La comprobación sigue sin escribir nada en `_GESTOR` ni en Drive. Traer el alumnado o lo del
  Centro de datos después de dar el permiso es lo mismo que ya hacen esos módulos al entrar, con
  sus propias reglas (`SoloConsulta`, cola de guardado).

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-318`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/COMPROBACION-AL-ENTRAR.md` y los ficheros de abajo.
- Antes de colgar `PermisosCarpetas` de `window`, mira que el nombre esté libre.
- Ningún fichero pasa de 600 líneas. `js/nucleo.js` ya tiene 659: no se le añade más que la
  llamada.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- permisos comprobacion bandeja alumnado centro-de-datos`). La pasada completa, una
  sola vez, al final.

## Ficheros

- `js/permisos-carpetas.js`: nuevo (punto 1). Se carga en `index.html` después de
  `js/alumnado-bd.js`, `js/centro-de-datos.js` y `js/carpetas.js`, y antes de
  `js/comprobacion-entrada.js`. Si la copia sin internet lleva su propia lista de ficheros, también
  ahí.
- `js/nucleo.js`: la llamada a `PermisosCarpetas.pedirAlEntrar()` en «Entrar».
- `js/comprobacion-entrada.js`: las frases nuevas, `boton` y `darPermiso` en las tres filas.
- `js/comprobacion-entrada-ver.js`: el texto del botón y la pulsación que da el permiso sin cerrar
  el panel.
- `js/alumnado-bd.js`: solo si hay que exportar `permiso`.
- `js/demo/`: los parámetros `sinpermiso=` y `niega=` (punto 4).
- `pruebas/permisos-carpetas.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. Con `?demo=1&auto=1&sinpermiso=alumnado,bandeja,centro-de-datos`: el panel sale con las tres
     filas, cada una con el botón «Dar permiso» y la frase nueva; ninguna dice «volver a
     señalarla».
  2. Pulsar «Dar permiso» en la de la bandeja: el panel sigue abierto, la fila pasa a verde, sale
     el aviso verde, la carpeta guardada en `Almacen` es **la misma** que antes, y los correos de
     la demostración aparecen en «Ha llegado».
  3. Lo mismo con la del alumnado y la del Centro de datos: quedan en verde y se trae lo suyo.
  4. Con las tres dadas, la marca de la barra lateral no cuenta ninguna de las tres.
  5. Con `&niega=bandeja`: «Dar permiso» en la bandeja deja la fila como estaba, con el aviso
     ámbar y el botón encendido.
  6. Sin `auto=1`, con `sinpermiso=` las tres: tras pulsar «Entrar con datos de demostración», las
     tres carpetas tienen permiso sin tocar el panel, y sus filas salen en verde.
  7. Igual que la 6, con `&niega=alumnado`: se entra igual, y el panel sale solo con la fila del
     alumnado.
  8. Igual que la 6, con `alumnado` en `gestor-comprobacion-omitidas`: a esa carpeta no se le
     pide el permiso (sigue en `'prompt'`) y su fila sale «No se usa en este ordenador».
  9. `PermisosCarpetas.pedirAlEntrar()` lanza las tres peticiones antes de que conteste la
     primera (con carpetas de mentira que tardan en contestar).
  10. Sin `sinpermiso=`, el panel de la demostración sale exactamente como antes de esta fila.
- `pruebas/comprobacion-entrada.mjs`, las de la bandeja, las del alumnado y las del Centro de
  datos: siguen en verde.
- `js/novedades.js`: «Al pulsar «Entrar», la aplicación pide también el permiso de las carpetas
  del alumnado, de la bandeja y del Centro de datos: ya no hay que volver a señalarlas cada
  mañana. En «Comprobación al entrar», el botón «Dar permiso» lo arregla con una pulsación.»
- Al terminar: `docs/COMPROBACION-AL-ENTRAR.md` (el botón «Dar permiso» y cuándo sale),
  `docs/COPIA-DE-PRUEBAS.md` (los dos parámetros), `docs/CONTEXTO.md` o el hijo de
  `docs/contexto/` que toque (`PermisosCarpetas`), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (el
  módulo y la prueba nuevos) y `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 5, se
  sustituye la línea «Comprobación al entrar (fila 204)…» por la misma con esto añadido: «al pulsar
  «Entrar» se pide también el permiso de las carpetas recordadas (alumnado, bandeja, Centro de
  datos; `js/permisos-carpetas.js`, fila 318) y sus filas llevan «Dar permiso»». En la sección 6,
  una línea: «Una carpeta recordada sin permiso se arregla pidiendo el permiso sobre ella
  (`PermisosCarpetas.pedir`), nunca mandando a señalarla otra vez (fila 318).»
- `docs/COMPROBAR-A-MANO.md` y `docs/TE-TOCA.md`: el punto 12 de abajo.

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que al pulsar «Entrar» la aplicación pide ya el permiso de las tres carpetas; que
la primera mañana elija «Permitir en cada visita» en cada cuadro del navegador; y que, si un día
falta alguno, el botón «Dar permiso» del panel lo arregla sin señalar nada.

## Cómo sabemos que está bien

En la copia de demostración, con los parámetros del punto 4.

1. Abrir `?demo=1&auto=1&sinpermiso=alumnado,bandeja,centro-de-datos`. Sale el panel
   «Comprobación al entrar» con tres filas que fallan: «Base de datos de alumnado», «Carpeta del
   Centro de datos» y «Bandeja de Gmail».
2. Cada una de las tres lleva un botón que dice «Dar permiso» (no «Arreglarlo») y una frase que
   dice que no hay que volver a señalarla. Ninguna dice «Hay que volver a señalarla».
3. Pulsar «Dar permiso» en «Bandeja de Gmail»: el panel **no se cierra** y no se cambia de
   pantalla; sale un aviso verde y la fila pasa a verde.
4. Pulsar «Dar permiso» en las otras dos: las tres quedan en verde.
5. Cerrar el panel con «Ahora no». La marca de la barra lateral ya no cuenta esas tres cosas.
6. En Inicio, «Ha llegado» enseña los correos de la demostración.
7. Abrir `?demo=1&auto=1&sinpermiso=bandeja&niega=bandeja` y pulsar «Dar permiso» en la bandeja:
   sale un aviso ámbar que dice que sin permiso no se puede leer la carpeta, la fila sigue igual y
   el botón se puede volver a pulsar.
8. Abrir `?demo=1&sinpermiso=alumnado,bandeja,centro-de-datos` (sin `auto=1`) y pulsar «Entrar con
   datos de demostración»: se entra, y el panel no sale por ninguna de esas tres (si se abre
   pulsando la marca de la barra lateral, las tres están en verde).
9. Abrir `?demo=1&sinpermiso=alumnado,bandeja&niega=alumnado` y pulsar «Entrar con datos de
   demostración»: se entra igual; el panel sale con «Base de datos de alumnado» y su botón «Dar
   permiso», y la bandeja está en verde.
10. Abrir `?demo=1&auto=1` (sin más): el panel y la marca salen como siempre, sin ninguna fila
    nueva ni botón «Dar permiso».
11. En el punto 1, pulsar «No lo uso en este ordenador» en «Carpeta del Centro de datos»: sale
    como «No se usa en este ordenador», igual que antes de este cambio.
12. [SOLO FRANCISCO] En el ordenador del centro, con la copia sin internet ya actualizada: al
    pulsar «Entrar», el navegador enseña un cuadro por carpeta (alumnado, bandeja y, si está
    señalada, Centro de datos). Elegir «Permitir en cada visita» en cada uno. A la mañana
    siguiente, al entrar, no sale ningún cuadro y el panel no enseña esas filas. Si el cuadro no
    ofrece «Permitir en cada visita», decírselo a Claude: queda una pulsación en «Permitir» por
    carpeta cada mañana.
