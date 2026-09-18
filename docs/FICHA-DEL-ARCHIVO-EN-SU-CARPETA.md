# Fila 64 — La ficha de un asunto archivado, en su propia carpeta

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, partes 1.1 y 1.3 (opción B).

**Es la fila más importante de la cola.** Es la única que cambia algo de fondo, y es lo que decide
si la aplicación aguanta cinco cursos o se pone lenta en dos.

---

## 1. Qué pasa hoy

`_GESTOR/asuntos.json` lleva dentro la ficha de **todos** los asuntos que se han hecho en la vida
del centro, abiertos y archivados. Archivar no borra la ficha: la carpeta se mueve al ARCHIVO y la
ficha se queda donde estaba.

Y ese fichero se reescribe **entero** cada vez que alguien escribe una nota, cambia un estado, pone
un plazo o registra un documento. Entre las dos personas, entre 50 y 150 veces al día.

Medido con fichas de la misma forma que las de verdad:

| Cuántos asuntos | Cuándo | Cuánto ocupa |
|---|---|---|
| 300 | hoy | 0,6 MB |
| 1.200 | final de curso 26-27 | 3,0 MB |
| 3.600 | tres cursos | 9,0 MB |
| 6.000 | cinco cursos | 17,6 MB |

Con 9 MB, cada guardado tarda unas dos décimas en el Chromebook, y Dropbox tiene que subir 9 MB
entre 50 y 150 veces al día. Cuanto más grande el fichero, más tarda en sincronizar, más larga es
la ventana en la que el otro ordenador tiene la versión vieja, y más copias en conflicto aparecen.

## 2. La idea

**La aplicación ya hace exactamente esto con los hitos.** Al archivar un asunto,
`js/hitos-archivo.js` escribe el historial de sus hitos como un fichero dentro de la propia carpeta
del asunto y borra su entrada de `hitos.json`; al reabrirlo, lo lee de vuelta. Funciona, tiene sus
pruebas y lleva en uso desde el 16-sep-2026.

Se trata de hacer lo mismo con la ficha. **Copiar ese patrón, no inventar otro.**

Resultado: `asuntos.json` pasa a tener solo los asuntos abiertos —entre 50 y 200— y se queda para
siempre por debajo de medio megabyte. El número de asuntos que aguanta el sistema deja de tener
techo.

## 3. Qué hay que hacer

### 3.1 Al archivar

Dentro de la carpeta del asunto, un fichero `_ficha.json` con la ficha entera tal cual estaba.
Después, borrar su clave de `asuntos.json`.

Que el nombre empiece por `_` no es casualidad: la lista de asuntos abiertos ya se salta las
carpetas que empiezan por `_`, y conviene que `App.esDocumentoDeTrabajo` y el índice del ARCHIVO no
lo cuenten como documento del asunto. Comprobar los dos sitios.

### 3.2 Al reabrir

Leer `_ficha.json`, volver a poner la ficha en `asuntos.json`, y borrar el fichero de la carpeta.

Si no existe (un asunto archivado a mano, o archivado antes de esta fila), no pasa nada: se reabre
con ficha vacía, como hoy con un asunto que nunca pasó por la aplicación.

### 3.3 Los sitios que leen la ficha de un asunto archivado

Esto es el trabajo de verdad de la fila. Hay que recorrerlos uno a uno y darles el camino nuevo:

- **`js/otros-del-tercero.js`** — "Otros asuntos de este tercero" abre la ficha de uno del ARCHIVO
  sin recorrerlo entero (fila 40). Necesita leer `_ficha.json` de esa carpeta.
- **`js/archivo-personas.js`** — la pantalla del ARCHIVO.
- **`js/ficha-asunto.js`** — la ficha en modo archivado.
- **`js/papelera.js`** — al borrar un asunto archivado y al devolverlo.
- **`js/fichas-huerfanas.js`** — hoy compara las claves de `asuntos.json` con las carpetas de los
  dos sitios. Con el cambio, una ficha de un archivado ya no está en `asuntos.json`, así que hay que
  repasar el cálculo entero o las marcaría todas como huérfanas.
- **`js/archivo-indice.js`** — el índice dice expresamente que no guarda nada de la ficha y que lee
  del registro en memoria al buscar (`textoDeBusqueda`). Con el cambio, el registro ya no tiene las
  fichas de los archivados. Hay que decidir: o el índice guarda también los pocos campos de ficha
  por los que se busca (estado, vía, quién lo pidió), o esa parte de la búsqueda deja de aplicarse a
  los archivados. **Recomiendo lo primero**, y que se rellenen al archivar.
- **`js/unir-asuntos.js`** y **`js/asuntos-archivar.js`** — los dos leen y escriben fichas alrededor
  del archivado.

Buscar `App.E.registro.asuntos` por todo `js/` y revisar los usos uno a uno. Son bastantes; **no
dar ninguno por bueno sin mirarlo.**

### 3.4 La conversión de lo que ya hay

La primera vez que se entre después del cambio, hay que bajar a su carpeta las fichas de los
asuntos ya archivados. No hacerlo en silencio al arrancar: un botón en **Ajustes → Mantenimiento**,
"Poner en orden las fichas del ARCHIVO", que diga cuántas va a mover, las mueva con una barra de
avance, y avise al terminar. Si una carpeta no aparece, esa ficha se queda donde está y se cuenta
aparte.

Mientras no se pulse, la aplicación tiene que funcionar igual: leer primero `_ficha.json` y, si no
está, caer al registro de siempre.

### 3.5 De regalo, y ya que estamos

Con el fichero pequeño se puede hacer barato algo que hoy no se hace: que la pantalla **vuelva a
leer el registro cada poco** (por ejemplo, en el repaso de cada 20 segundos que ya existe en
`App.mirarLaCarpeta`), para que lo que cambie el compañero se vea sin recargar. Con 0,5 MB eso es
gratis; con 9 MB era impensable.

Hacerlo **solo si el resto ha salido limpio y las pruebas están en verde**. Si aprieta el tiempo, se
deja para otra fila: no es el objetivo de esta.

## 4. Cómo se comprueba

Prueba nueva, `pruebas/ficha-del-archivo.mjs`, sin navegador:

1. Asunto abierto con ficha completa. Se archiva.
2. La clave ya no está en `asuntos.json` y sí hay `_ficha.json` en su carpeta, con todo dentro.
3. Se reabre. La ficha vuelve entera a `asuntos.json` y el fichero desaparece de la carpeta.
4. Un asunto archivado sin `_ficha.json` se reabre sin romper nada.
5. "Otros asuntos de este tercero" enseña bien un asunto archivado.
6. Las fichas huérfanas no cuentan los archivados.
7. El botón de conversión mueve las fichas viejas y deja el registro solo con los abiertos.

Y repasar a mano, en el navegador, las pantallas de ARCHIVO, papelera y la ficha de un archivado.
`npm test` entero en verde antes de subir.

## 5. Qué NO hay que hacer

- **No** partir `asuntos.json` en un fichero por asunto abierto. Se estudió y se descartó: la
  pantalla de abiertos tendría que abrir cien ficheros pequeños en una carpeta de Dropbox, que puede
  ser más lento, no menos.
- **No** cambiar el formato de la ficha. Lo que baja a la carpeta es lo mismo que había, tal cual.
- **No** tocar el historial de hitos que ya se guarda al archivar. Son dos ficheros distintos en la
  misma carpeta y así se quedan.
- **No** meter esta fila en la misma subida que ninguna otra.

## 6. Cuánto es

De dos a cuatro días. Es la fila más cara de la cola y la que más rinde.

**Conviene hacerla antes de que `asuntos.json` pase de 3 MB**, porque cuanto más grande, más tarda
la conversión y más hay que perder si algo sale mal.
