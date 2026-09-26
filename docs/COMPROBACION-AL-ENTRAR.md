# Comprobación al entrar (fila 187)

Cerrado con Francisco el 26-sep-2026. Hacer **después de la fila 186**.

## Qué se quiere

Hoy la aplicación depende de varias cosas que se configuran una vez en cada ordenador o en la
cuenta. Si una falla, Francisco se entera a mitad de trabajo. Se quiere una comprobación al
entrar que diga, en un solo sitio, qué falta y lleve a arreglarlo.

## Cómo se ve

1. Al entrar (después de «Entrar» y de cargar los datos, sin retrasar la primera pantalla), la
   aplicación revisa las siete cosas de la lista de abajo, en segundo plano.
2. **Si todo está bien:** una marca verde pequeña en la cabecera fija («✓ Todo configurado»). No
   sale ningún panel. Al pulsar la marca se abre el panel con las siete en verde.
3. **Si falta algo:** sale un panel (un solo cuadro) con una fila por cosa revisada: verde si está
   bien, ámbar o rojo si falta. Cada fila que falla lleva una frase en lenguaje llano de qué pasa y
   para qué sirve, y un botón **«Arreglarlo»** que cierra el panel y deja en la pantalla exacta
   donde se configura (Ajustes › pestaña › bloque abierto y a la vista, o Mantenimiento). Abajo:
   «Volver a comprobar» y «Ahora no». La marca de la cabecera pasa a ámbar con el número de cosas
   que faltan («⚠ 2 por configurar») y al pulsarla se vuelve a abrir el panel.
4. **Si la comprobación no ha podido hacerse** (entera o una cosa concreta: sin internet, sin
   permiso de la carpeta, un error al leer): la fila lo dice en gris, con el motivo en una frase
   («No he podido comprobarlo: no hay conexión a internet»). Si ninguna se ha podido comprobar, el
   panel lo dice arriba. Cuenta como «falta algo» a efectos de sacar el panel.
5. Cada fila que falla lleva también un enlace pequeño **«No lo uso en este ordenador»**: esa cosa
   deja de revisarse en ese ordenador (en `localStorage`, clave `gestor-comprobacion-omitidas`) y
   sale en el panel como «No se usa aquí», con «Volver a revisarla». Es para el compañero, que no
   usa todo lo que usa Francisco (por ejemplo, la bandeja de Gmail o la carpeta de Drive).
6. La revisión es **de cada ordenador**: nada de esto se guarda en `_GESTOR`, salvo lo que ya se
   guardaba. Cada uno ve sus avisos.
7. Después de «Arreglarlo» y volver, la marca se recalcula sola (sin que tenga que pulsar nada) la
   próxima vez que se repinte la cabecera, y el panel no vuelve a saltar en esa sesión salvo que se
   pulse la marca.

## Las siete cosas que se revisan

Para cada una, qué es «bien», y a dónde lleva «Arreglarlo». Si al programar alguna regla resulta
imposible o absurda con el código de hoy, se ajusta con el mismo espíritu y se apunta en
`docs/HISTORIA.md`.

1. **Carpetas de Dropbox** (`abiertos`, `archivo` en `Almacen`): señaladas, con permiso concedido,
   y que dentro esté `_GESTOR`. Arreglarlo: donde se vuelven a señalar las carpetas.
2. **Carpeta de la base de datos de alumnado** (`alumnado-bd-carpeta`, `js/alumnado-bd.js`): bien
   si está señalada y se lee, **o** si no está señalada pero existe la copia
   `_GESTOR/datos/ALUMNADO-BD.json` (el caso del compañero). Ámbar si la copia es más vieja que el
   RegAlum. Arreglarlo: Ajustes › El centro › «Carpeta de la base de datos de alumnado».
3. **Bandeja de Gmail** (clave `bandeja` en `Almacen`): señalada y se lee. Arreglarlo: el bloque
   de la bandeja en Ajustes.
4. **Envío de correo** (el script de Apps Script): hay dirección del script guardada y responde.
   Si la fila 178 ya dejó la comprobación de versión del script, usarla: ámbar si la versión es
   vieja («Hay que pegar el script nuevo y pulsar "Nueva versión"»). Arreglarlo: donde se pega la
   dirección del script y está «Probar». **No enviar ningún correo para comprobarlo.**
5. **Ruta de Dropbox en este ordenador** (botón «Ruta», fila 161: `gestor-ruta-dropbox` y
   `_GESTOR/rutas.json`): las dos partes apuntadas. En la copia sin internet se deduce sola: allí
   siempre en verde. Arreglarlo: el mismo cuadro que abre hoy «Ruta» cuando le falta la ruta.
6. **Datos del centro**: en `plantillas.json`, centro, código, localidad, dirección y provincia
   con algo; en `cargos.json`, al menos Dirección y Secretaría con alguien que ocupe el cargo hoy;
   en `hitos.json › ajustes.festivos`, al menos un festivo del curso en marcha. Una fila por
   bloque que falte, no una por dato. Arreglarlo: Ajustes › El centro (cargos y datos) y Ajustes ›
   Hitos (festivos).
7. **Copia sin internet al día**: solo cuando la aplicación se abre desde la copia (`file://`).
   Bien si su `App.VERSION` coincide con la publicada; si no ha podido mirarlo (sin internet),
   gris. Arreglarlo: su «Actualizar ahora». En la web, esta fila no sale.

## Reglas de construcción

- Fichero nuevo `js/comprobacion-entrada.js` (y, si hace falta, `js/comprobacion-entrada-ver.js`
  para el panel, para no pasar de 400 líneas cada uno). Cada comprobación es una función pequeña
  que devuelve `{ id, estado: 'bien'|'falta'|'sin-comprobar'|'omitida', frase, arreglar }`, para
  poder añadir otra más adelante sin tocar el panel.
- **No envuelve nada.** Se engancha por un punto previsto (`window.Gestor.alRefrescar`, o el que
  use `js/alumnado-bd.js` para su `alEntrar`), cuidando de que la revisión corra **una sola vez
  por entrada**, no en cada repintado. Si no hay punto adecuado, se añade uno.
- El panel usa `U.preguntar` (un solo cuadro a la vez): si en ese momento hay otro cuadro abierto,
  espera a que se cierre; no lo pisa.
- La marca de la cabecera convive con la línea de avisos de la fila 181; no se mete dentro de ella.
- Cada comprobación con tiempo máximo (unos 8 segundos); si se pasa, «sin comprobar».
- Solo leer. La comprobación no escribe nada en `_GESTOR` ni en Drive.
- Textos en lenguaje llano, sin nombres de fichero ni de clave a la vista.

## Ficheros que se tocan

- Nuevo: `js/comprobacion-entrada.js` (y `js/comprobacion-entrada-ver.js` si hace falta).
- Nuevo: `css/comprobacion-entrada.css`, o las reglas en la hoja que ya lleve la cabecera.
- `index.html`: las líneas `<script>` y `<link>`, antes de `dni.js`/`inicio.js`.
- Si hace falta un punto de enganche nuevo, el fichero que lo dispare (probablemente
  `js/inicio.js`).
- Nueva prueba: `pruebas/comprobacion-entrada.mjs` (tres casos: todo bien → marca verde y sin
  panel; falta una → panel con su «Arreglarlo» llevando al bloque; una que no se puede comprobar →
  gris con motivo; y «No lo uso en este ordenador» que la aparta).
- Documentación al cerrar: `docs/CONTEXTO-CORTO.md` (una línea en la sección 5),
  `docs/contexto/PANTALLA.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md` y
  `docs/COLA.md`.

## Cómo trabajar

- No leer el repositorio entero: `docs/CONTEXTO.md`, `docs/contexto/PANTALLA.md` y los módulos que
  guardan cada una de las siete cosas.
- Cambios quirúrgicos; no reescribir ficheros existentes.
- Subir a `main` sin abrir pull request (o, si la sesión lo obliga, según la nota de
  `docs/COLA.md`). Como mucho dos subidas.
- Una sola pasada de `npm test` al final, en verde.
