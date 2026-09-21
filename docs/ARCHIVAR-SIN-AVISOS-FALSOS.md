# Archivar sin avisos falsos ni errores en inglés (fila 90)

Encargo cerrado con Francisco el 21-sep-2026. Diseño confirmado por él («Sí»).

## Qué vio Francisco

Al archivar un asunto desde su ficha le salieron dos avisos rojos a la vez:

1. «Este asunto ya no está en Asuntos abiertos: puede que se haya archivado o borrado desde el
   otro ordenador.»
2. «El asunto se ha archivado, pero no he podido guardar su ficha en la carpeta: An operation
   that depends on state cached in an interface object was made but the state had changed since
   it was read from disk.»

El archivado en sí salió bien. Los dos avisos sobran.

## Por qué pasa (comprobado en el código, `main` 9828bd7)

- **Aviso 1**: `App.cerrarAsunto` (`js/asuntos-archivar.js`) termina con `App.verAbiertos()`. Eso
  llama a `App.reengancharFicha` (`js/ficha-asunto.js`, hacia la línea 150), que no encuentra el
  asunto en la lista y da el aviso de «otro ordenador». Pero lo ha archivado este mismo ordenador.
- **Aviso 2**: la envoltura de `App.cerrarAsunto` en `js/ficha-archivo.js` escribe `_ficha.json`
  en la carpeta recién movida y luego reescribe `asuntos.json`. Dropbox estaba sincronizando esa
  carpeta justo después del traslado, y el navegador rechaza la escritura con un
  `InvalidStateError`. Además, esa envoltura usa `e.message` en vez de `U.mensajeDeError(e)`, y por
  eso sale en inglés.

## Qué hay que hacer

### 1. Reintentar solo las escrituras que tropiezan con Dropbox

En `Carpetas.escribirTexto` y `Carpetas.escribirBytes` (`js/carpetas.js`): si la escritura falla con
`InvalidStateError` o `NoModificationAllowedError`, esperar y volver a intentarlo, pidiendo otra vez
el manejador del fichero (`dir.getFileHandle(nombre, { create: true })`) en cada intento. Tres
intentos en total, con esperas de 0,5 s, 1 s y 2 s. Si el tercero falla, se lanza el error como
hasta ahora. Cualquier otro error se lanza a la primera, sin esperar.

Como `Copias.guardar`, `guardarJson` y `_ficha.json` pasan todos por `escribirTexto`, esto arregla
de una vez todas las escrituras de la aplicación.

`js/carpetas.js` tiene 483 líneas. El cambio tiene que ser de pocas líneas: la función de
reintento va en un fichero nuevo y pequeño (`js/reintentar-escritura.js`, cargado antes de
`js/carpetas.js` en `index.html` y en la copia sin internet si tiene su propia lista de ficheros), y
`carpetas.js` solo la llama. Si aun así el cambio en `carpetas.js` pasa de unas diez líneas, partir
el fichero en dos.

### 2. La ficha de un asunto que acaba de archivar este ordenador se cierra sin aviso rojo

En `App.reengancharFicha` (`js/ficha-asunto.js`): antes de dar el aviso de «otro ordenador», mirar
si el asunto figura como archivado por este ordenador hace poco. Lo más sencillo: `App.cerrarAsunto`
(o su envoltura de `ficha-archivo.js`) apunta en memoria la clave del asunto que acaba de archivar
(por ejemplo `App.E.recienArchivados`, un conjunto) y `reengancharFicha` lo consulta. Si está ahí:
volver a la lista sin ningún aviso (el verde «Asunto archivado.» ya lo ha dado `cerrarAsunto`). Si
no está: el aviso de siempre, que sigue siendo verdad cuando lo hace el otro ordenador.

Lo mismo al reabrir, si `reengancharFicha` o su equivalente del ARCHIVO dan un aviso parecido.

### 3. Los avisos de `js/ficha-archivo.js`, en castellano

En las dos envolturas (`App.cerrarAsunto` y `App.reabrirAsunto`), cambiar `e.message` por
`U.mensajeDeError(e)`. Y, si el guardado de `_ficha.json` falla incluso después de los tres
intentos, el aviso tiene que decir qué pasa y que no se ha perdido nada: la ficha sigue en
`asuntos.json`, y el botón «Poner en orden las fichas del ARCHIVO» (Ajustes → Mantenimiento) la
bajará a su carpeta después. Texto propuesto, en ámbar, no en rojo:

> El asunto se ha archivado. Su ficha no se ha podido guardar todavía dentro de la carpeta porque
> Dropbox la estaba sincronizando. No se ha perdido nada: se hará sola la próxima vez que pulses
> «Poner en orden las fichas del ARCHIVO» en Ajustes → Mantenimiento.

Comprobar que, en ese caso, la ficha realmente sigue en `asuntos.json` (el borrado de la clave va
después de escribir `_ficha.json`, así que si la escritura falla no se borra: verificarlo).

## Ficheros que se tocan

- `js/reintentar-escritura.js` (nuevo)
- `js/carpetas.js` (pocas líneas)
- `js/ficha-asunto.js` (solo `App.reengancharFicha`)
- `js/ficha-archivo.js` (solo las dos envolturas)
- `js/asuntos-archivar.js` (solo si hace falta para apuntar el recién archivado)
- `index.html` (cargar el fichero nuevo)
- `js/envolturas-esperadas.js` solo si cambia alguna envoltura
- Una prueba nueva en `pruebas/` (ver abajo)
- `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque, `docs/HISTORIA.md`

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión es de la nube y lo
  impide, sigue la nota de `docs/COLA.md`: pull request y fusionarla tú en verde).
- Cambios quirúrgicos. No reescribir ficheros enteros.
- No leas el repositorio entero: solo los ficheros de la lista y `docs/CONTEXTO.md`.
- Una sola prueba al final: `npm test` en verde, con una prueba nueva que simule una escritura que
  falla dos veces con `InvalidStateError` y a la tercera sale bien, y otra que falla las tres veces
  (debe lanzar el error, y la ficha debe seguir en `asuntos.json`).
- Actualiza `App.VERSION` con la hora del reloj de verdad (`js/version.js`).
- Comprueba lo publicado con `curl`.

## Qué verá Francisco

Al archivar un asunto desde su ficha: el aviso verde «Asunto archivado.» y vuelta a la lista. Sin
avisos rojos. Si Dropbox tarda mucho, como mucho un aviso ámbar en castellano que le dice que no
se ha perdido nada.
