# Control del registro: de dónde viene cada listado y su fecha real (fila 351)

Idea 351 de Francisco, diseñada con él el 16-oct-2026.

## Lo que ya está hecho (no tocar)

La idea pedía que «Control del registro» cogiera los listados de entrada y salida del Centro de
datos. **Eso ya funciona desde las filas 312 y 317**: `js/centro-de-datos.js` trae
`registro-entrada` y `registro-salida` al entrar y `CentroDeDatosReparto.entregar`
(`js/centro-de-datos-reparto.js`) los pasa por `ControlRegistro.subir`, siempre que esté puesta la
fecha «Revisar desde». La subida a mano («Subir listados de Séneca») sigue como reserva. Los
apuntes de los dos caminos se funden por número de registro (`fundirAno`) y gana el más nuevo.
Nada de esto cambia.

## Lo que falta (esta fila)

1. **La línea de arriba de «Control del registro» dice de dónde viene cada listado.**
   Hoy `textoSubida` (`js/control-registro-pantalla.js`) dice «Entrada: hasta el … · subido el …
   por …». Pasa a decir, para cada libro (Entrada y Salida), el origen y la fecha real del listado:
   - Del Centro de datos: «Entrada: del Centro de datos, 15/10/2026 · hasta el 14/10/2026».
   - Subido a mano: «Salida: subido a mano, 15/10/2026 · hasta el 14/10/2026».
   - Subido antes de esta fila (sin `via` ni `fechaOriginal` guardados): como hoy, «Entrada:
     hasta el … · subido el …», sin decir el origen.
   - Sin listado: «Entrada: sin subir todavía» (como hoy).
   «hasta el …» es la fecha del apunte más reciente, como hoy. Fechas en formato dd/mm/aaaa, en
   hora de España (nunca la fecha de `toISOString`, que va en hora universal y puede dar el día
   anterior).
   Al final de cada línea, quién lo subió (decidido con Francisco):
   - Del Centro de datos: «· lo soltó <subidoPor>» (el `subidoPor` de la entrada del índice, que se
     guarda en `subidas[l].subidoPor`). Si viene vacío, no se pone nada.
   - Subido a mano: «· por <usuario>», como hoy (`subidas[l].por`).
   Ejemplos completos: «Entrada: del Centro de datos, 15/10/2026 · hasta el 14/10/2026 · lo soltó
   Diego» y «Salida: subido a mano, 15/10/2026 · hasta el 14/10/2026 · por Francisco».
2. **Fecha real del listado.** Se guarda en `_GESTOR/control-registro.json`, en
   `subidas[E|S]`, añadiendo dos campos a los que ya hay (`el`, `por`, `hasta`):
   - `via`: `'centro-de-datos'` o `'a-mano'`.
   - `fechaOriginal`: la fecha y hora real del listado, en ISO completa (con hora):
     - Centro de datos: el campo `subido` de su entrada de `indice.json` (cuándo se soltó allí).
     - A mano: la fecha de modificación del fichero (`File.lastModified`), que es cuando se
       descargó de Séneca.
   Se usan los mismos nombres que ya devuelve `origenDe(e)` en `js/centro-de-datos-reparto.js`
   (`{ via, fechaOriginal, subidoPor, nombreOriginal }`). `ControlRegistro.subir(ficheros)` acepta
   en cada fichero un `origen` opcional con esa forma; sin él, se apunta `via: 'a-mano'` y
   `fechaOriginal` = ahora. `CentroDeDatosReparto.entregar` pasa `origenDe(e)`; `subirFicheros`
   de la pantalla pasa `{ via: 'a-mano', fechaOriginal: <lastModified en ISO>, nombreOriginal }`.
3. **El aviso de Inicio «registro atrasado»** (`resumenParaAvisos` en `js/control-registro.js`)
   cuenta los días desde `subidas[l].fechaOriginal` y, si no la hay (listados subidos antes de esta fila),
   desde `subidas[l].el`, como hoy.
4. **Lo más reciente manda**, comparando `fechaOriginal` completa (con hora):
   - Listado igual o más reciente que el que hay en `subidas[l]`: como hoy, sus apuntes pisan a
     los que ya había con el mismo número (`fundirAno`), y `subidas[l]` pasa a ser el suyo.
   - Listado más antiguo: solo se añaden los apuntes que no estaban; los que ya había no se tocan,
     y `subidas[l]` se queda como estaba. (Hoy `fundirAno` pisa siempre; hay que darle esa opción.)
   - Si `subidas[l]` no tiene `fechaOriginal` (subido antes de esta fila), el que llega se trata
     como más reciente.
5. **Demo** (`js/demo/datos-centro-de-datos.js`): añadir `registro-salida` (`RegLibSalCen.csv`,
   dos apuntes inventados) con las mismas columnas que `pruebas/control-registro-salida.csv`
   (lleva «Destinatario» y «Modo de envío», que es lo que busca `leerCsv` en el libro de salida),
   para que la demo enseñe las dos líneas.
6. **Pruebas**, dos partes:
   - Sin navegador, en `pruebas/control-registro.mjs`: `subir` con `origen` guarda `via` y
     `fechaOriginal`; un listado más antiguo no pisa apuntes ni `subidas`; `resumenParaAvisos`
     cuenta desde `fechaOriginal`.
   - Con navegador, una prueba nueva `pruebas/registro-origen.mjs`, montada como el apartado 5 de
     `pruebas/centro-de-datos.mjs` (que ya señala la carpeta del Centro de datos de la demo y pone
     la fecha «Revisar desde»): recorre las cuatro comprobaciones de abajo. Para la 3, el fichero
     subido a mano se crea con `lastModified` posterior al `subido` del Centro de datos de la demo
     (que va a mañana).

## Ficheros que se tocan

- `js/control-registro.js` (474 líneas): `subir` (acepta `origen`), `resumenParaAvisos`.
- `js/control-registro-pantalla.js` (399 líneas): `textoSubida`, `subirFicheros` (pasa
  `origen` con `lastModified`).
- `js/centro-de-datos-reparto.js` (116 líneas): el caso `registro-entrada`/`registro-salida` pasa
  `origen: { via: 'centro-de-datos', fecha: <subido de la entrada> }`.
- `js/demo/datos-centro-de-datos.js` (101 líneas).
- `pruebas/control-registro.mjs` y `pruebas/registro-origen.mjs` (nueva).
- `js/novedades.js` (una línea: «Control del registro dice de dónde viene cada listado y su
  fecha»).
- Al terminar: `docs/CONTEXTO-CORTO.md` (línea de «Control del registro», sustituida),
  `docs/CONTROL-DEL-REGISTRO.md` y `docs/HISTORIA.md`.

Ningún fichero pasa de 600 líneas con estos cambios; si alguno se acercara, se parte por temas.

## Cómo trabajar

- No leas el repositorio entero: solo `docs/CONTEXTO.md`, `docs/CONTROL-DEL-REGISTRO.md` y los
  ficheros de la lista.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Rama `fila-351`, revisor en local y publicación a propósito, como dice `docs/COLA.md` (regla 0 y
  `CLAUDE.md`). Nada de peticiones de cambios abiertas a la espera de nadie.
- Pruebas: mientras trabajas, solo `node pruebas/ejecutar.mjs registro`; la pasada completa, una
  vez al final.
- Cabe en una sola sesión.

## Cómo sabemos que está bien (Cómo sabré que está bien)

Acordadas con Francisco. Se miran en la copia de pruebas (`?demo=1&auto=1`), y el revisor las
repite:

1. Entras en el Gestor y abres Herramientas → «Control del registro» sin subir nada. Salen los
   apuntes de entrada y de salida.
2. Arriba ves la línea: de dónde viene cada listado («del Centro de datos» o «subido a mano») y
   su fecha.
3. Subes a mano un listado más nuevo que el del Centro de datos. La línea de ese libro cambia a
   «subido a mano» con esa fecha, y se ven sus apuntes.
4. En Inicio salen los avisos de apuntes sin asunto, sin haber subido tú nada.

En la demo no viene puesta la fecha «Revisar desde» ni señalada la carpeta del Centro de datos: la
prueba de navegador hace las dos cosas antes de mirar, como el apartado 5 de
`pruebas/centro-de-datos.mjs`. En el uso real, Francisco pone la fecha una sola vez.

## Ejemplo con datos reales

Todavía no hay listados reales del registro: Francisco no ha soltado ninguno en el Centro de
datos. El ejemplo real queda como primera comprobación suya; ya está apuntado en `docs/TE-TOCA.md`
(no lo añadas otra vez):

- [ ] (fila 351) Cuando sueltes en el Centro de datos los listados de entrada y salida de Séneca:
  pon una vez la fecha «Revisar desde» en Herramientas → «Control del registro» (si no está), mira
  en Séneca el número del último apunte de entrada y comprueba que ese mismo número sale en
  «Control del registro», y que la línea de arriba dice «del Centro de datos» con la fecha del día
  en que lo soltaste.
