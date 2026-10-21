# Guardar sin perder nada y archivar más rápido

Filas 364 (parte 1) y 398 (parte 2) de `docs/COLA.md`. Tema 364, que junta las ideas 360 y 361,
salidas del informe de medidas de la fila 359. Diseñado con Francisco el 21-oct-2026.

Se hace en **dos sesiones**, por este orden. La parte 2 no empieza hasta que la 1 esté HECHA.

## Lo que dicen las medidas (semana del 13 al 16-oct-2026)

- **Idea 361.** Tres escrituras de `_GESTOR/asuntos.json` acabaron como «sin remedio» (13 y 15-oct,
  ordenador `8fq896`): el intento normal y los tres reintentos de `Reintentar.escritura`
  (`js/reintentar-escritura.js`) fallaron. Además, más de 100 reintentos al día. En la pantalla de
  medidas salen como «Escrituras que no han salido» (`js/medidas-pantalla.js`).
- **Idea 360.** Archivar un asunto (`asunto.archivar`) tarda de 3 a 11 segundos de media, y alguna
  vez hasta un minuto. Mientras tanto la persona espera sin poder hacer nada.
- Francisco y su compañero no recuerdan que desapareciera ningún cambio esos días.

Las sesiones de Claude Code no entran en el Dropbox del centro ni en el Drive de las medidas. Todo
lo que se averigüe sale del código y de la copia de pruebas (`pruebas.fmargon.com`, datos
inventados).

---

## Parte 1 — fila 364: que ningún cambio se pierda

### 1. Averiguar y dejarlo escrito

1. Leer el camino de guardado de `asuntos.json` (`Carpetas.escribirTexto`, `Reintentar`, la fila
   de guardado de `docs/GUARDAR-EN-FILA.md` y `docs/GUARDAR-SIN-PISAR.md`). Responder, con el
   código delante:
   - Cuando una escritura acaba «sin remedio», ¿el cambio sigue en la memoria de la pestaña y el
     **siguiente** guardado lo escribe? ¿O se pierde?
   - ¿En qué caso se perdería de verdad? (Por ejemplo, cerrar la pestaña antes del siguiente
     guardado.)
2. Averiguar por qué hay tantos reintentos: qué error sale (por su nombre), en qué momento y si
   la app escribe `asuntos.json` más veces de las necesarias (por ejemplo, varias escrituras
   seguidas del fichero entero por un solo cambio). Si sobran escrituras, quitarlas: eso por sí
   solo baja los choques con Dropbox.
3. Escribir la conclusión **en la fila 364 de la cola**, al marcarla HECHA, en una o dos frases
   llanas para Francisco: «Lo del 13 y 15-oct pudo/no pudo perder un cambio, porque…» y «Había
   tantos reintentos porque…».

### 2. Que no vuelva a perderse nada

- Se aplica **solo a los ficheros de datos de la app** (los `.json` de `_GESTOR` y `_ficha.json`
  de cada asunto). Los PDF, los Word y las copias diarias siguen como hoy.
- Si una escritura de uno de esos ficheros acaba sin remedio, **el cambio no se tira**: queda pendiente y la app lo vuelve a intentar sola, cada poco
  tiempo, hasta que salga (sin bloquear la pantalla).
- Hoy `App.guardarRegistroFresco` (`js/nucleo.js`) relee `asuntos.json` y le aplica una función,
  que no se puede guardar en el navegador. Lo que se guarda pendiente es **el registro entero del
  asunto tal como queda** (o el contenido completo del fichero, si no es `asuntos.json`); al
  reintentar se relee el fichero y se pone ese registro encima del suyo.
- El cambio pendiente se guarda también en este ordenador (en el navegador), para que **no se
  pierda aunque se cierre la pestaña**. Al volver a abrir la app, si hay algo pendiente, se
  escribe primero, sin pisar lo que otro ordenador haya guardado entretanto (mismo criterio que
  `docs/GUARDAR-SIN-PISAR.md`).

### 3. Lo que se ve en pantalla (decidido con Francisco)

- El contador de medidas cambia: «sin-remedio» pasa a contar **solo los cambios que nunca
  llegaron a guardarse** (los que se tiran, ver más abajo), no los que se guardan en un reintento
  posterior. Los que acaban saliendo tarde se cuentan aparte, con su nombre.

- Mientras haya un cambio sin guardar después de los reintentos normales, sale un **aviso rojo
  fijo arriba**: «Un cambio no se ha guardado todavía. La aplicación lo sigue intentando.»
- No tiene botón de cerrar. Se quita solo en cuanto el cambio se guarda.
- Mientras el cambio está pendiente, **no sale** el mensaje verde de siempre («Guardado»,
  «Asunto archivado»…) ni el rojo de un solo uso de hoy («No se ha podido…»): solo el aviso fijo.
  El verde sale cuando el cambio se guarda de verdad.
- Si el cambio pendiente ya no se puede guardar porque otro ordenador archivó o cambió de nombre
  ese asunto entretanto (lo rechaza `App.comprobarNoCerrado`), el aviso fijo se quita, el cambio
  se tira (y se cuenta en medidas como «sin remedio») y sale otro aviso rojo, **con botón de
  cerrar**: «Un cambio en el asunto A26-0123 no se ha guardado porque otro ordenador lo archivó
  antes. Ábrelo desde el Archivo y repítelo si hace falta.» (con el número real del asunto; si lo
  que pasó es un cambio de nombre, el texto lo dice).
- Los reintentos normales (los que salen bien en uno o dos segundos) no enseñan nada, como ahora.
- Textos con las palabras de `docs/VOCABULARIO.md`.

### 4. Pruebas

En la copia de pruebas, simular que la escritura falla siempre (por ejemplo, forzando un
`InvalidStateError`) y comprobar: sale el aviso rojo, el cambio sigue ahí al recargar la pestaña,
y al dejar de forzar el fallo se guarda y el aviso se quita. Dejar la prueba en `pruebas/`.

### Cómo sabemos que está bien (fila 364, para el revisor)

(Sección escrita al coger la fila, regla 2 de la cola. Qué quiere Francisco: que un cambio que no se
puede guardar no desaparezca, y que la pantalla no mienta mientras tanto.)

1. En Inicio, abrir un asunto de la demostración, cambiarle la fecha límite y guardar: sale el aviso
   verde «Fecha límite guardada.» y **no** sale ningún aviso rojo fijo arriba.
2. Nuevo asunto: crear uno, abrirlo y archivarlo: sale «Asunto archivado.» y ningún aviso rojo fijo.
3. **[SOLO FRANCISCO]** Forzar un fallo de Dropbox no se puede con la demostración: la semana siguiente a
   publicar, en Herramientas → Puesta a punto → Medidas, no aparece «Cambios que nunca llegaron a guardarse».
   (La prueba `pruebas/guardado-pendiente.mjs` ya lo fuerza con un disco de mentira: aviso rojo fijo, cambio que
   no se pierde al recargar, y se guarda solo.)

### Cómo sabré que está bien (parte 1)

1. En Herramientas → Puesta a punto → Medidas, la semana siguiente a publicar esto no aparece
   ningún cambio que no llegara a guardarse.
2. En la fila 364 de la cola queda escrito, en llano, si el 13 y el 15 de octubre se pudo perder
   algo, qué, y por qué había tantos reintentos.

---

## Parte 2 — fila 398: archivar sin esperar

Empieza solo con la fila 364 HECHA: usa el aviso rojo y el guardado pendiente de la parte 1.

### 1. Averiguar

La fila 398 se crea en `docs/COLA.md` junto con la 364 (al cerrar el diseño) y puede empezar en
cuanto la 364 esté HECHA, sin esperar a la semana de medidas.

Medir en la copia de pruebas los pasos de `asunto.archivar` (`App.cerrarAsunto` y lo que llama:
mover la carpeta al ARCHIVO, bajar la ficha, índice del expediente, tablas de `_GESTOR/base/`,
guardados de `asuntos.json` y `hitos.json`). Apuntar en la fila cuál se lleva el tiempo. Si un paso
se puede acortar sin cambiar lo que hace, acortarlo.

### 2. Lo que se ve en pantalla (decidido con Francisco)

- Al pulsar «Archivar» (y en el archivar automático de `App.cerrarAsunto`), el asunto **sale de la
  lista en el momento**. La persona puede abrir otro asunto y seguir trabajando enseguida.
- Para que el asunto no vuelva a aparecer al refrescar la lista (`App.verAbiertos`, vistazo a la
  carpeta) mientras su carpeta sigue en Asuntos abiertos, se marca en `asuntos.json` como
  «archivándose» (con el ordenador y la hora). En el otro ordenador ese asunto sale con
  «Archivándose en otro ordenador…» y no se puede tocar; si la marca tiene más de una hora, se da
  por abandonada y el asunto vuelve a la normalidad.
- El traslado de la carpeta y lo demás sigue **por detrás**. Mientras dura, arriba sale un aviso
  pequeño, que no estorba: «Archivando…» (con el nombre o número del asunto si hay más de uno a la
  vez).
- Ese aviso se quita solo cuando la carpeta ya está en el ARCHIVO de Dropbox y todo lo demás está
  guardado.
- Si falla un **guardado de datos** durante el archivo, se comporta como la parte 1 (pendiente,
  aviso fijo, reintento solo).
- Si falla **el traslado de la carpeta** y no sale en los reintentos normales (por ejemplo,
  Dropbox tiene un fichero abierto), no se reintenta más: se deshace lo que se hubiera hecho, se
  quita la marca «archivándose», **el asunto vuelve a la lista como estaba** y sale un aviso rojo
  **con botón de cerrar**: «No se ha podido archivar el asunto A26-0123. No se ha movido nada.
  Vuelve a pulsar Archivar.» (con el número real; debajo, en letra pequeña, el paso y el fichero,
  como el aviso de la fila 265). Si no se puede deshacer del todo, el texto no dice «No se ha
  movido nada» sino qué se ha quedado en cada sitio.
- Si la persona cierra la pestaña mientras se archiva, la app avisa antes de cerrar (el aviso
  normal del navegador). Al volver a abrir, termina lo que quedó a medias.
- Lo que ya se pregunta antes de archivar («No cabe en el archivo», confirmaciones) se sigue
  preguntando antes, igual que ahora. Solo lo que viene después de la última pregunta va por
  detrás.

### 3. Pruebas

En la copia de pruebas: archivar dos asuntos seguidos sin esperar; los dos salen de la lista al
momento y los dos acaban en el ARCHIVO. Dejar la prueba en `pruebas/`.

### Ejemplo con datos reales

Francisco no tiene ahora ningún asunto listo para archivar. El ejemplo real será **el primer
asunto que archive después de publicar esta parte**. Antes, Claude Code lo comprueba en la copia
de pruebas con un asunto inventado.

### Cómo sabemos que está bien (fila 398, para el revisor)

(Sección escrita al coger la fila, regla 2 de la cola. Qué quiere Francisco: pulsar «Archivar» y seguir
trabajando sin esperar, sin que el asunto desaparezca por el camino si algo falla.)

1. En Inicio, en la lista de asuntos abiertos, abrir el menú de uno y pulsar «Archivar», aceptar el cuadro:
   el asunto sale de la lista enseguida y se puede abrir otro asunto sin esperar.
2. Mientras tanto arriba sale un aviso pequeño «Archivando…», y se quita solo al acabar; sale «Asunto archivado.»
   y ningún aviso rojo.
3. En ARCHIVO aparece ese asunto archivado.
4. Archivar dos asuntos seguidos sin esperar entre uno y otro: los dos salen de la lista al momento y los dos
   acaban en ARCHIVO.
5. **[SOLO FRANCISCO]** El ejemplo real: el primer asunto que archive después de publicar. Un traslado que falle
   de verdad (Dropbox con un fichero abierto) no se puede forzar con la demostración; la prueba
   `pruebas/archivar-sin-esperar.mjs` lo fuerza con un disco de mentira: el asunto vuelve a la lista y sale el aviso
   rojo con botón de cerrar.

### Cómo sabré que está bien (parte 2)

1. Al pulsar «Archivar», el asunto sale de la lista al instante y puedo abrir otro sin esperar.
2. Arriba sale «Archivando…» y se quita solo cuando la carpeta ya está en el archivo de Dropbox.

---

Al terminar cada parte: regla 0 de `docs/CONTEXTO-CORTO.md` (poner al día el contexto,
sustituyendo líneas) y `docs/HISTORIA.md`.
