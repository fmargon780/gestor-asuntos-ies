# Archivar sin atascos: la carpeta que no aparece

Acordado con Francisco el 17-sep-2026, poco después de publicar la fila 32. **Va la primera de
la cola**: sigue con un asunto real sin poder archivar.

Apúntala tú en `docs/COLA.md` como **fila 33**, con estado EN CURSO, en tu primer commit, y
márcala HECHA al terminar. Va en la tabla justo debajo de la fila 32.

No leas el repositorio entero. Cambios quirúrgicos.

---

## 1. Lo que pasa ahora

Con la fila 32 ya publicada (versión `17-sep-2026 · 13:55`), al pulsar Archivar sale:

> No se ha podido archivar: A requested file or directory could not be found at the time an
> operation was processed.

Es un `NotFoundError` del navegador, en inglés y sin decir qué falta. Sale tal cual porque
`App.cerrarAsunto` (js/asuntos-archivar.js) enseña `e.message` sin traducirlo.

Dónde puede nacer ese error, en orden de probabilidad:

1. **La carpeta del asunto ya no está en Asuntos abiertos.** `Carpetas.fusionarEn` y
   `Carpetas.trasladar` empiezan con `padreOrigen.getDirectoryHandle(nombre)`. Si un intento
   anterior llegó a completarse (o el otro ordenador la movió), la tarjeta de la lista sigue
   vieja y ahí revienta.
2. **Un fichero desaparece a mitad de la copia.** Dropbox mueve y borra ficheros temporales
   mientras sincroniza; `copiarDentro` y la fusión los pillan a medio camino.
3. **Los ficheros temporales descuadran la cuenta.** `contarFicheros` cuenta `.tmp`,
   `.driveupload`, `desktop.ini` y compañía, que luego no llegan o cambian: la comprobación
   "llegados !== esperados" falla y el traslado se deshace sin motivo real.

## 2. Ficheros que hay que tocar

| Fichero | Qué se hace |
|---|---|
| `js/util.js` | `U.mensajeDeError(e)` nuevo: traduce los errores del navegador a castellano. |
| `js/carpetas.js` | No contar ni copiar los temporales de sincronización; aguantar un fichero que desaparece a mitad. |
| `js/asuntos-archivar.js` | Reconocer "la carpeta ya no está en el origen" y resolverlo, en archivar y en reabrir. |
| `pruebas/archivar-atascos.mjs` | Prueba nueva. |

## 3. `U.mensajeDeError(e)` (js/util.js)

Un solo sitio para traducir. Por el nombre del error (`e.name`):

- `NotFoundError` → `No encuentro la carpeta o el fichero. Puede que se haya movido o que lo esté
  sincronizando Dropbox en este momento.`
- `NotAllowedError` → `El navegador ha retirado el permiso sobre la carpeta. Vuelve a señalarla
  en Ajustes.`
- `NoModificationAllowedError` / `InvalidStateError` → `Hay un fichero en uso, seguramente
  abierto en otro programa o sincronizándose. Espera un momento y vuelve a intentarlo.`
- `QuotaExceededError` → `No queda sitio en el disco.`
- `AbortError` → `La operación se ha interrumpido.`
- Cualquier otro: el mensaje tal cual (los nuestros ya están en castellano).

`App.cerrarAsunto` y `App.reabrirAsunto` pasan a usarlo en su `catch`. **Nunca más un mensaje en
inglés en pantalla.**

## 4. `js/carpetas.js`

1. **Los temporales, fuera.** `contarFicheros`, `copiarDentro` y la fusión se saltan todo lo que
   diga `esCarpetaTemporalDeSincronizacion(nombre)` (ya existe, y vale igual para ficheros).
   Así la cuenta de origen y la de destino hablan de lo mismo.
2. **Un fichero que se esfuma.** Al copiar, si `getFile()` o `getFileHandle()` lanza
   `NotFoundError`, se reintenta **una vez** tras esperar un segundo. Si sigue sin estar, se para
   con un error en castellano que **diga el nombre del fichero**: `No he podido copiar
   "<nombre>": ha desaparecido a mitad de la copia (seguramente Dropbox estaba sincronizando).
   No se ha borrado nada.` Vale para `copiarDentro` y para la fusión.

## 5. `js/asuntos-archivar.js`

### Archivar

Nada más empezar el `try`, mirar si la carpeta sigue en Asuntos abiertos
(`Carpetas.existe(App.E.abiertos, a.nombre)`):

- **Está**: todo sigue como hasta ahora.
- **No está, pero sí está en `ARCHIVO / categoria / tercero`**: el archivado ya se hizo. No se
  copia nada. Se deja la ficha al día con `App.anotar` (estado `cerrado`, categoría, tercero,
  `cerradoEl` solo si no lo tenía, y el número de ficheros contado en el destino), se refresca la
  lista y se avisa en verde: `Este asunto ya estaba archivado. He puesto la lista al día.`
- **No está en ninguno de los dos sitios**: aviso en ámbar, sin error en inglés: `No encuentro la
  carpeta de este asunto ni en Asuntos abiertos ni en el archivo. Puede que la haya movido o
  renombrado el otro ordenador. Pulsa Recargar y míralo.` Y `App.verAbiertos()` igualmente, para
  que la lista deje de enseñar algo que no existe.

### Reabrir

Mismo problema con `a.padre`, que es un manejador guardado de cuando se pintó la pantalla
ARCHIVO y puede estar viejo:

- Si `a.padre` no sirve o la carpeta no está dentro, recalcular con
  `Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false)` y usar ese.
- Si tampoco está ahí pero sí en Asuntos abiertos: ya estaba reabierto, se pone la ficha al día
  y se avisa en verde, sin copiar nada.
- Si no aparece por ningún lado: el mismo aviso en ámbar de arriba, con "Pulsa Recargar".

## 6. La prueba: `pruebas/archivar-atascos.mjs`

Con el disco de mentira. Escenarios:

1. La carpeta ya no está en Asuntos abiertos pero sí en el archivo: no sale ningún error, la
   ficha queda cerrada y la lista se refresca.
2. La carpeta no está en ninguno de los dos sitios: aviso en castellano, sin `e.message` en
   inglés y sin tocar nada.
3. Ficheros temporales (`.tmp`, `.driveupload`, `desktop.ini`) en el origen: no se copian, no se
   cuentan, y el traslado termina bien.
4. Un fichero desaparece entre el recuento y la copia: el mensaje dice su nombre, en castellano,
   y el origen sigue entero.
5. `U.mensajeDeError` traduce `NotFoundError` y deja pasar tal cual un error nuestro que ya está
   en castellano.
6. Reabrir con un `a.padre` viejo que ya no vale: se recalcula y funciona.

Una sola pasada de la batería completa al final.

## 7. Al terminar

- Sube directo a `main` **sin pull request** si puedes; si esta sesión no puede tocar `main`,
  pull request y fusión automática en cuanto la batería esté en verde (permiso permanente).
- `App.VERSION` con la hora de verdad. Comprobar lo publicado con `curl`.
- `docs/COLA.md` (fila 33 HECHA), `CONTEXTO-CORTO.md`, `CONTEXTO.md` y `HISTORIA.md`.
- En el mensaje final a Francisco, una línea: qué verá al pulsar Archivar en el asunto que tiene
  atascado (el de JUSTIFICACION FALTAS PAS).
