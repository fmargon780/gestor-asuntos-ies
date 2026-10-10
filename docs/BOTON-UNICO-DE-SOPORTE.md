# El botón «Soporte» único, y el buzón fuera de aquí

Fila 326 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Diseñada con
Francisco el 11-oct-2026. Lee antes `docs/CONTEXTO.md` y, de `docs/contexto/`, solo
`PANTALLA.md` (la línea de `Soporte.abrir`) y `FICHEROS-DEL-REPOSITORIO.md` (las líneas que
nombran `soporte`).

## Qué quiere Francisco

El 10-oct-2026 decidió que el Soporte tenga proyecto propio: `fmargon780/soporte-apps`. Allí viven
ya el programa del buzón (con el vigilante) y **un botón «Soporte» único**, el mismo para todas sus
aplicaciones. El buzón se lo entrega a cada app con sus ajustes. Las filas 1, 2, 3 y 5 de aquella
cola están HECHAS y el buzón ya entrega el botón al Gestor (comprobado el 11-oct-2026).

Falta el lado del Gestor: dejar de llevar su botón copiado, usar el único, y borrar de este
repositorio el programa del buzón.

**Decidido por Francisco (11-oct-2026):**

1. El Gestor usa el botón único. Sigue abajo a la derecha, en todas las pantallas.
2. **Si no hay conexión con Google, no sale ningún botón.** Ni botón gris ni aviso: sin conexión
   tampoco se podría enviar.
3. **El bloque «Buzón de soporte» de Ajustes → El centro se quita entero**, y con él la nota «Se
   cambia en el Centro de datos».
4. El programa del buzón se borra de este repositorio.

**Decidido en la conversación, sin pregunta:** nadie vuelve a escribir su correo. El botón único ya
lee las claves que el Gestor tiene recordadas en cada ordenador (`gestor-soporte-correo`,
`gestor-soporte-nombre`); no hay que copiarlas ni tocarlas.

## Cómo es el botón único (lo que necesitas saber; no hace falta abrir `soporte-apps`)

- Se pide con un `<script>` a esta dirección, que es pública y va escrita en todas las apps:
  `https://script.google.com/macros/s/AKfycbz2LFRhlvnlUjr_QZFW5cuY3ayE-wmXCCg1TdtUCNDJ6SEosNMetkZP6muz1NVwFDMXhQ/exec?boton=1&repo=fmargon780/gestor-asuntos-ies`
  Google la redirige a `https://script.googleusercontent.com/…`. Devuelve JavaScript: una línea
  con `window.SOPORTE_AJUSTES` (la app, la dirección del buzón, correo «obligatorio», sitio
  «esquina») y detrás el botón.
- El botón lee `window.SOPORTE_APP`, que pone la app **antes** de pedirlo:
  `{ repo, version, pantalla(), contexto(), persona(), errores() }`. Las funciones se llaman al
  abrir y al enviar, cada una dentro de un `try`.
  - `repo`: `'fmargon780/gestor-asuntos-ies'`, con esas mayúsculas exactas.
  - `version`: texto. El botón le añade la suya.
  - `pantalla()`: solo el nombre de la pantalla. Nunca un asunto ni una persona.
  - `contexto()`: hasta 300 caracteres. Va al fichero de Drive, no a la cola.
  - `persona()`: `{ nombre, correo }`. Si el correo es bueno, el botón no lo pregunta.
  - `errores()`: lista de textos con los errores que la app apuntó antes de que cargara el botón.
    Usa como mucho 20, de 300 caracteres. Desde que carga, el botón recoge los suyos.
- Deja `window.Soporte = { abrir, cerrar, version, correoBueno, errores }` y la marca
  `window.__soporteBoton`. `Soporte.abrir({ tipo: 'error' | 'mejora', texto })` abre la ventana ya
  escrita y devuelve `true` o `false`.
- Se pinta dentro de dos elementos propios con Shadow DOM abierto: `#soporte-boton` y
  `#soporte-ventana`. Los estilos del Gestor no le llegan. En la esquina lo apartan dos variables
  CSS que sí hereda: `--soporte-derecha` y `--soporte-abajo` (20 px por defecto). Su `z-index` es
  2147483000: **queda por encima de todo**, también de los cuadros del Gestor.
- Diferencias que va a notar quien lo use, ya decididas en `soporte-apps` y que aquí no se tocan:
  un botón «Elegir una imagen» a la vista y, tras enviar, la ventana se queda abierta y vacía con
  «Recibido. Gracias.».

## Qué hay que hacer

### 1. Un módulo pequeño que presenta la app y pide el botón

Módulo nuevo `js/soporte-cargar.js` (el nombre lo decides tú), cargado donde hoy va `js/soporte.js`,
justo después de `js/version.js`. Hace tres cosas y nada más:

1. **Recoge los errores tempranos** (`error`, `unhandledrejection` y `console.error`, como hace hoy
   `js/soporte.js`), con hora, 300 caracteres por línea y 20 como mucho. **Deja de apuntar en cuanto
   existe `window.__soporteBoton`**: desde ahí los recoge el botón y saldrían repetidos.
2. **Pone `window.SOPORTE_APP`:**
   - `repo` y `version` (`App.VERSION`, leída al enviar si hace falta: usa un `get`).
   - `pantalla()`: la tabla `PANTALLAS` y la regla de `nombrePantalla` de hoy, sin cambios.
   - `persona()`: `nombre` = `App.E.usuario`; `correo` = `Perfil.correo()` si existe. Vacíos si no
     se saben.
   - `contexto()`: una línea sin datos de nadie: «web» o «copia sin internet», «solo consultar» si
     lo está, y el perfil (Administración o directivo).
   - `errores()`: los del punto 1.
3. **Pide el botón**, metiendo el `<script>` por código **después del `load` de la página**, nunca
   escrito en `index.html` (un `<script>` que no contesta retrasaría el arranque y todas las
   pruebas). Si falla, no pasa nada a la vista y no se escribe ningún error en la consola. Lo vuelve
   a pedir cuando el navegador dice que ha vuelto la conexión (`online`) y, mientras siga sin
   botón, cada diez minutos. Con el botón ya cargado no pide nada más.

**Cuándo NO se pide:** en la demostración (`?demo=1`) y en un navegador manejado por un programa
(`navigator.webdriver`, como ya hace `js/comprobacion-entrada-ver.js`), **salvo que la dirección
lleve `soporte=1`**. Así ni las pruebas ni el revisor mandan avisos de verdad a la cola, y las pruebas
no esperan a Google.

No copies aquí ningún trozo del botón ni de su ventana. Si algo del botón no te vale, no lo arregles
aquí: apúntalo en la nota de la fila.

### 2. Que el botón no tape nada que hoy no tapa

Hoy el botón tiene `z-index: 44` y queda **debajo** de los cuadros, del visor y de los mensajes. El
único está encima de todo. Con las dos variables CSS:

- Con el lector abierto (`body.con-lector`) se aparta a la izquierda de su panel, como hoy.
- Mientras esté abierta cualquier capa que hoy lo tapa (`#capa`, el visor de Word o de PDF, la
  ventana de novedades…), el botón se saca de la vista. Es lo mismo que pasa hoy.
- Los mensajes (`.mensajes`) siguen saliendo por encima del botón (`bottom: 64px`, regla de hoy).

Estas reglas van a una hoja que ya exista (por ejemplo `css/estilos.css`); `css/soporte.css` se
borra.

### 3. Lo que usa `Soporte` dentro del Gestor

- `js/problemas.js`, «Avisar por Soporte»: pasa a `Soporte.abrir({ tipo: 'error', texto: … })`. Si
  `window.Soporte` no existe, un aviso de los de siempre (no verde): «Ahora no hay conexión con
  Soporte. Inténtalo más tarde.»
- `js/solo-consulta.js`: quita `#btn-soporte` de `DEJAR` y comprueba que el botón único sigue
  encendido en «solo consultar» y con un directivo.
- `js/ajustes-centro.js`: quita la llamada a `Soporte.pintarAjustes`.

### 4. Quitar el bloque de Ajustes y lo que copiaba la dirección

- `index.html`: fuera el `<details id="bloque-soporte">`, el `<link>` de `css/soporte.css` y el
  `<script>` de `js/soporte.js`.
- `js/ajustes-reparto.js`: fuera la línea de `bloque-soporte`.
- `js/centro-de-datos-configuracion.js`: fuera todo lo de la fila 316 (leer `soporte.buzon`,
  copiarlo a `ajustesAvisos.urlSoporte`, `buzonSoporte`, `marcarBuzon` y la nota). Sigue copiando
  los datos del centro y la firma igual que hoy.
- `js/centro-de-datos.js` (`avisarTraido`): fuera «la dirección del buzón de soporte».
- `js/demo/datos-centro-de-datos.js`: `soporte.buzon` vacío, como lo deja el Centro de datos real.
- El valor `ajustesAvisos.urlSoporte` que ya esté guardado en `_GESTOR` **se deja donde está**:
  nadie lo lee y no se escribe nada para borrarlo.

### 5. Abrir la puerta en la web

`vercel.json`: a `script-src` de la `Content-Security-Policy` se le añaden
`https://script.google.com` y `https://script.googleusercontent.com` (hacen falta los dos, por la
redirección). Sin esto la web no enseñaría el botón, **y sin ningún aviso**: por eso lleva prueba.

### 6. Borrar de aquí el programa del buzón

Se borran: `apps-script/soporte.gs`, `pruebas/soporte-script.mjs`, `pruebas/vigilante-script.mjs`,
`js/soporte.js` y `css/soporte.css`. Si alguna está en `EN_SOLITARIO` o `RETIRADAS` de
`pruebas/ejecutar.mjs`, sale de la lista. `apps-script/gestor-correos.gs` **no se toca**.

Los documentos de las filas viejas del buzón se quedan. Solo llevan, en su primera línea, «Mudado a
`fmargon780/soporte-apps` el 11-oct-2026; lo vivo está allí»: `docs/PONER-EN-MARCHA-SOPORTE.md`,
`docs/VIGILANTE-Y-CORREOS.md` y `docs/BOTON-DE-SOPORTE.md`.

### 7. Las pruebas

- `pruebas/soporte.mjs` se reescribe. Abre con `soporte=1` y contesta la dirección de Google con
  **un botón de mentira** (intercepta `https://script.google.com/**`; unas líneas que apuntan lo
  recibido y dejan `window.Soporte` y `window.__soporteBoton`). Comprueba:
  1. Sin `soporte=1` no sale ninguna petición a Google.
  2. Con `soporte=1`, una sola petición, a la dirección exacta, después del `load`.
  3. `SOPORTE_APP`: repositorio, versión, nombre de pantalla al cambiar de pantalla, persona,
     contexto, y un error provocado antes de cargar el botón aparece en `errores()`.
  4. Con el botón cargado, un error nuevo ya no se suma a `errores()`.
  5. Si Google no contesta: ni botón, ni error en la consola, ni aviso; al volver la conexión
     (`online`) se pide otra vez.
  6. Con `body.con-lector` y con un cuadro abierto, las variables CSS valen lo que toca.
  7. `vercel.json` trae los dos sitios de Google en `script-src`.
- `pruebas/problemas.mjs`: «Avisar por Soporte» llama a `Soporte.abrir` con `tipo: 'error'` y el
  texto de la tarjeta (con el botón de mentira), y sin botón sale el aviso.
- `pruebas/centro-de-datos-configuracion.mjs` y `pruebas/ajustes-cuatro-pestanas.mjs`: al día (un
  bloque menos, sin campo de buzón).
- La prueba tiene que fallar sin el cambio. Espera a condiciones, no a pausas: `EN_SOLITARIO` está
  en su tope.

### 8. Una comprobación con el botón de verdad (la haces tú, una vez, sin enviar nada)

Antes del revisor, con tu servidor local **enviando la misma `Content-Security-Policy` de
`vercel.json`**, abre `?demo=1&auto=1&soporte=1` con Playwright y comprueba que el botón de verdad
llega de Google, se ve abajo a la derecha, se abre y enseña «Gestor de Asuntos» y el nombre de la
pantalla. **No pulses «Enviar»**: apuntaría una idea en esta cola. Si desde tu entorno Google no
contesta, dilo en la nota de la fila y sigue.

### 9. Documentos

- `js/novedades.js`: una línea corta. «El botón «Soporte» es ahora el mismo en todas las
  aplicaciones. En Ajustes ya no hay bloque «Buzón de soporte».»
- `docs/CONTEXTO-CORTO.md`: sustituye la línea del botón «Soporte» de la sección 5 y quita «y buzón
  de soporte» de la del Centro de datos. En la sección 6, regla nueva: «El botón «Soporte» y el
  buzón no son de este repositorio: se cambian en `fmargon780/soporte-apps`. Aquí solo
  `js/soporte-cargar.js`».
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/contexto/PANTALLA.md`: sus líneas, al día.
- `docs/COLA.md`, «Lo que queda por hablar con Francisco»: las líneas de las filas 315, 268, 262 y
  261 (volver a pegar `apps-script/soporte.gs`) se quitan y pasan a `docs/HISTORIA.md` con esta
  nota: resueltas el 10-oct-2026 en `soporte-apps` (el buzón sirve «10-oct-2026 · fila 3
  (soporte-apps)» y su `prepararTodo` dio 14 repositorios bien y ninguno con OJO).
- `docs/TE-TOCA.md`: la línea sin marcar de la fila 315 se marca hecha, con «ya no hace falta:
  resuelto en `soporte-apps` el 10-oct-2026». Es una orden de este diseño, no una excepción tuya.
  Línea nueva al final, la del punto [SOLO FRANCISCO] de abajo.
- `docs/COMPROBAR-A-MANO.md`: las entradas de las filas 213, 240, 261, 262, 269, 315 y 316 se
  sustituyen por una sola, la de esta fila.

## Ficheros

Nuevos: `js/soporte-cargar.js`. Reescrito: `pruebas/soporte.mjs`. Tocados: `index.html`,
`vercel.json`, `js/problemas.js`, `js/solo-consulta.js`, `js/ajustes-centro.js`,
`js/ajustes-reparto.js`, `js/centro-de-datos-configuracion.js`, `js/centro-de-datos.js`,
`js/demo/datos-centro-de-datos.js`, `js/novedades.js`, `js/version.js`, una hoja de `css/`,
`pruebas/problemas.mjs`, `pruebas/centro-de-datos-configuracion.mjs`,
`pruebas/ajustes-cuatro-pestanas.mjs`, `pruebas/ejecutar.mjs` (solo si nombra las borradas) y los
documentos del punto 9. Borrados: los cinco del punto 6. **Cambios quirúrgicos: no toques nada
más.**

## No se hace en esta fila

- Cambiar el botón, su ventana o el buzón: son de `soporte-apps`.
- Un botón de reserva, gris o guardado dentro del Gestor, para cuando no hay conexión.
- Tocar `apps-script/gestor-correos.gs` o el envío de correo.
- Borrar `ajustesAvisos.urlSoporte` de los datos ya guardados.

## Cuidado

- **El repositorio es público.** Ni un nombre real, ni un correo real, en el código, las pruebas,
  los documentos, los commits ni la nota de la cola.
- Sigue `CLAUDE.md`: rama `fila-326`, revisor en local y, con su APROBADA, a `main`. Mientras
  programas, `npm test -- soporte problemas centro-de-datos ajustes solo-consulta novedades`; la
  pasada completa, **una sola vez**, antes de fusionar. `App.VERSION` con la hora del reloj.
  `docs/ESTIMACIONES.md` en la subida de EN CURSO. `docs/COLA.md` por debajo de 40 KB.
- Módulo nuevo: no envuelve nada. Ningún fichero de `js/` pasa de 600 líneas.
- Nada recarga la página, y nada escribe en las carpetas: este cambio no guarda nada.
- Al comprobar la publicación, mira además que la cabecera `Content-Security-Policy` de la web
  publicada trae los dos sitios de Google.
- No preguntes nada: decide y apúntalo en la nota.

## Qué decirle a Francisco al terminar

En cuatro frases. Que el Gestor ya usa el botón «Soporte» único, en el mismo sitio. Que la ventana
trae «Elegir una imagen» y que, al enviar, se queda abierta con «Recibido. Gracias.». Que en
Ajustes → El centro ya no está el bloque «Buzón de soporte». Y que le toca una comprobación en el
centro, con la copia sin internet, que tiene en «Te toca a ti».

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1`. En ninguna pantalla hay botón «Soporte», y la aplicación funciona con
   normalidad: se abre Inicio, la ficha de un asunto y Ajustes sin ningún mensaje de error.
2. Ir a Ajustes → El centro. No existe ningún bloque «Buzón de soporte».
3. En «Buscar en Ajustes…», escribir «buzón». No sale ningún resultado que lleve a un bloque de
   soporte.
4. En toda la pestaña El centro no hay ningún campo «Dirección del buzón de soporte».
5. Ir a Ajustes → Problemas. Si alguna tarjeta trae «Avisar por Soporte», pulsarlo: sale un aviso
   que dice que ahora no hay conexión con Soporte, y la pantalla no se queda bloqueada. Si ninguna
   tarjeta lo trae, el punto se da por bueno.
6. Pulsar el número de versión de la barra lateral. En «Qué hay de nuevo», la primera línea habla
   del botón «Soporte».
7. Abrir un asunto y, en su ficha, un documento en el lector. El lector se abre y se cierra como
   siempre, sin nada que tape sus botones.
8. **[SOLO FRANCISCO]** En el centro, con la copia sin internet ya actualizada: abajo a la derecha
   sale el botón «Soporte». Pulsarlo, elegir «Propongo una mejora», escribir «Prueba del botón
   único» y enviar. Sale «Recibido. Gracias.» sin pedir el correo, y en el Centro de mando aparece
   una idea nueva del Gestor. Repetirlo una vez en la web, desde casa.
