# Fila 130 — Guardar y enviar sin sorpresas

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 1, puntos A, B y C). Diseño cerrado con Francisco el 24-sep-2026.

Son tres arreglos de robustez que no cambian lo que se ve, salvo dos avisos nuevos. Van juntos
porque los tres son «que no se pierda ni se duplique nada».

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, `docs/contexto/PANTALLA.md`,
  `docs/contexto/PERSONAS.md`, `docs/contexto/CORREO-Y-SENECA.md` y los ficheros de la lista.
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- Los ficheros de la lista que pasan de 400 líneas (`tablon.js`, `papelera.js`, `datos.js`,
  `nombres.js`, `archivo-indice.js`) **no se parten en esta fila**, salvo `datos.js` (punto 1.2):
  el cambio en los demás es de pocas líneas. Partirlos será una fila aparte.
- Sube directamente a `main`, sin pull request. Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.

## Ficheros que se tocan

- `js/tablon.js`, `js/conflictos.js`, `js/papelera.js` (punto 1.1)
- `js/datos.js` y nuevo `js/datos-listas.js`, `index.html` (una línea de `<script>`) (punto 1.2)
- `js/borrados-fusion.js`, `js/archivo-indice.js` (punto 1.3)
- `js/correo-enviar.js`, `apps-script/gestor-correos.gs` (punto 2)
- `js/util.js` o `js/nombres.js` (donde encaje mejor), y la vista previa de Nuevo asunto y del
  nombre de documento (punto 3)
- Prueba nueva: `pruebas/guardar-y-enviar-sin-sorpresas.mjs`
- Documentación: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`

---

## 1. Todo guardado de `_GESTOR` pasa por la cola por fichero

La regla ya está en `CONTEXTO-CORTO.md` (sección 6), pero hay guardados que no la cumplen.

### 1.1 El tablón

`cambiar()` de `js/tablon.js`, `fusionarTablon` de `js/conflictos.js` y `devolverNotaTablon` de
`js/papelera.js` leen, cambian y escriben `tablon.json` sin `ColaGuardado.poner`. Pásalos por
`ColaGuardado.poner('tablon.json', …)`, igual que ya hacen `asuntos.json` y `hitos.json`. Ojo con
la advertencia de `js/cola-guardado.js`: nunca se llama a `poner` del mismo fichero desde dentro
de otro `poner`.

### 1.2 Las listas de terceros dados de alta a mano

`anadirALista`, `guardarEnLista`, `quitarDeLista` y `apartarSolicitantesAnteriores` de
`js/datos.js` reescriben `solicitantes.csv`, `personal.csv`, `empresas.csv` y `otros.csv` sin cola.

- Sácalas a un fichero nuevo, `js/datos-listas.js`, que se cuelga de `Datos` con los mismos
  nombres (los que las llaman no cambian). Así `datos.js` baja de tamaño.
- Cada una pasa por `ColaGuardado.poner(<fichero del CSV>, …)` y **relee el CSV dentro** de la
  cola, justo antes de escribir, no fuera.

**Entre dos ordenadores.** La cola solo ordena los guardados de un mismo navegador. Si los dos
ordenadores escriben el mismo CSV casi a la vez, Dropbox deja una copia en conflicto. Hoy
`js/conflictos.js` solo mira `.json`. Amplíalo a esos cuatro CSV de `_GESTOR/datos`:

- Se fusionan solos: unión de filas. Dos filas iguales se quedan en una.
- Si dos filas tienen el mismo `Nombre` y datos distintos, se queda la del fichero real y la otra
  se apunta en el aviso de conflictos de Ajustes, para que Francisco elija. No se pierde ninguna.
- Antes de fusionar, los dos ficheros se guardan en `_GESTOR/copias`, como los demás.

### 1.3 El índice del ARCHIVO y los borrados

`conFichero` de `js/borrados-fusion.js` y `guardar`, `anadirEntrada` y `quitarEntrada` de
`js/archivo-indice.js`: mismo arreglo, por `ColaGuardado.poner` con su fichero.

## 2. Un correo no sale dos veces

Hoy, si la red se corta después de que Google envíe el correo pero antes de que llegue la
respuesta, la app dice que no ha podido y el usuario vuelve a pulsar. El correo sale dos veces.

- **En la app** (`js/correo-enviar.js`): al abrir el cuadro de confirmación se genera un
  identificador de envío (aleatorio, largo). Viaja en el cuerpo de la petición. Si el usuario
  vuelve a pulsar «Confirmar y enviar» en el **mismo** cuadro, se reutiliza el mismo
  identificador. Un cuadro nuevo lleva uno nuevo.
- La petición tiene un tiempo límite de 90 segundos. Si vence, el aviso dice: «No sé si ha salido.
  Mira en Enviados de Gmail antes de volver a pulsar.» Ámbar, no rojo.
- **En el script** (`apps-script/gestor-correos.gs`): antes de enviar, mira si ese identificador
  ya está apuntado (`CacheService` del script, 6 horas). Si está, no envía y contesta como si
  hubiera salido bien, con una marca de «ya enviado». Si no está, envía y lo apunta.
- Una petición sin identificador (un navegador con la versión vieja) se envía como hasta ahora.
- Sube el número de versión del script, como en las filas anteriores que lo cambiaron.

**Esto obliga a pegar el script otra vez.** Ya hay un pegado pendiente desde la fila 117 (sección 8
de `CONTEXTO-CORTO.md`). Deja **una sola línea** en esa sección que diga que hay que pegar el
script nuevo, que sirve para las dos cosas.

## 3. Los nombres no pasan de un largo seguro

`U.limpiarNombre` no recorta. Una carpeta con varios campos, texto libre y un tercero de apellidos
largos puede pasar del límite de rutas de Windows (260 caracteres) y dejar de sincronizarse en un
ordenador con Windows sin ningún aviso.

- **Carpeta de asunto: 150 caracteres como mucho.** Si se pasa, se recorta **primero el texto
  libre**, después los campos del tipo, por el final. **Nunca** se recortan la fecha, el tipo, el
  año académico, el grupo ni el tercero con su número.
- **Nombre de documento: 120 caracteres como mucho**, más la extensión. Se recorta el texto
  adicional. La fecha, el registro y el tipo no se tocan.
- **Adjuntos de correo** (`nombreDeAdjunto` de `js/bandeja-correos.js`): la extensión también se
  limpia y no pasa de 10 caracteres. Si no parece una extensión real, se quita.
- En la vista previa (Nuevo asunto, Editar, registrar documento), si ha habido recorte, una línea
  ámbar debajo: «Nombre demasiado largo: se ha acortado el texto libre.»
- Los asuntos que ya existen no se renombran.

## 4. La prueba

`pruebas/guardar-y-enviar-sin-sorpresas.mjs`, sin navegador si se puede:

- Dos cambios seguidos en el tablón y dos altas seguidas en `empresas.csv`: se conservan los dos.
- Fusión de una copia en conflicto de `personal.csv` con una fila nueva en cada lado: salen las dos.
- Dos llamadas al envío con el mismo identificador: el script simulado envía una vez.
- Un nombre de asunto de 300 caracteres sale de 150 como mucho, y conserva fecha, tipo y tercero.

## 5. Qué va a ver Francisco

Casi nada, y eso es lo bueno. Solo dos avisos nuevos: el de «nombre acortado» en la vista previa, y
el de «No sé si ha salido» si la red falla al enviar. Y un pegado del script, que ya estaba
pendiente.
