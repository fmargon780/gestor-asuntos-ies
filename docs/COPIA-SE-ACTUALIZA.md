# La copia sin internet tiene que actualizarse de verdad (fila 91)

Decidido con Francisco el 23-sep-2026. Diseño cerrado por él. Continúa la fila 89
(`docs/COPIA-SIN-INTERNET.md`).

## Qué pasa hoy

La copia que Francisco abre en el instituto dice **«21-sep-2026 · 11:32»**. La publicada es
**«21-sep-2026 · 14:49»**. La copia pública (`fmargon780/gestor-asuntos-copia`) está al día: la
acción `copia-publica.yml` funciona. Lo que falla es la actualización en el ordenador, y falla
**en silencio**.

Dos agujeros, vistos leyendo el código (no se sabe cuál de los dos le ha tocado; hay que tapar
los dos):

1. **`ABRIR EL GESTOR.html` solo guarda la carpeta la primera vez.** En `continuarConCarpeta`,
   si la carpeta elegida ya tiene `index.html`, va directo a `index.html` sin llamar a
   `guardarEnAlmacen(CLAVE_CARPETA, dir)`. En cualquier ordenador (o navegador, o perfil) que no
   sea el de la instalación, `copiaCarpeta` no existe en IndexedDB, y `js/actualizar-copia.js`
   sale en el paso 1 (`if (!dir) return;`) sin decir nada. Nunca se actualiza.
2. **Sin permiso, solo un aviso ámbar abajo a la izquierda.** Chrome pierde el permiso de la
   carpeta al cerrar el navegador. El aviso de `avisoPermiso` es fácil de pasar por alto, y no
   dice que hay una versión nueva esperando.

## Lo que ve Francisco al final

- Al abrir la copia, **si hay una versión nueva y la copia no ha podido ponerla sola**, sale
  arriba del todo, a todo el ancho, una franja ámbar fija:
  «Hay una versión nueva del Gestor (**X**). Esta copia tiene la **Y**.» con el botón
  **«Actualizar ahora»**. No se cierra sola; tiene una ✕ que la calla hasta la próxima vez que
  se abra la aplicación.
- Al pulsar **«Actualizar ahora»**:
  - si falta el permiso, lo pide (es un clic del usuario, así que Chrome deja);
  - si la copia no sabe cuál es su carpeta, abre el selector con una línea de explicación:
    «Elige la carpeta donde está esta copia (la que tiene `ABRIR EL GESTOR.html`)». Comprueba
    que la carpeta elegida tiene `index.html` y `version.json`; si no, lo dice en una frase y
    deja volver a elegir. La guarda para la próxima vez;
  - descarga lo cambiado, como ya hace hoy, y recarga.
- Si todo va bien, no ve nada: la copia se actualiza sola al abrirla, como hasta ahora.
- Sin internet o con GitHub caído: arranca igual, con el aviso discreto de siempre.

## Qué hay que hacer

### 1. `ABRIR EL GESTOR.html` (lo genera `scripts/copia-local.mjs`)

- Guardar **siempre** la carpeta (`guardarEnAlmacen`) en cuanto se tiene con permiso, también
  cuando ya tiene `index.html`.
- Cuando la carpeta ya tiene `index.html`: **antes de ir a `index.html`, comprobar la versión**
  (mismo algoritmo que `js/actualizar-copia.js`: `version.json` remoto con `cache: 'no-store'`,
  descargar solo los sha256 distintos, comprobarlos, borrar los que sobran, `version.json` el
  último) con la barra de progreso que ya tiene. Si falla, ir igual a `index.html`.
  Así, volver a guardar este fichero y abrirlo una vez basta para arreglar una copia vieja: es
  el camino de rescate para la copia que Francisco tiene hoy (su `js/actualizar-copia.js` es el
  viejo y no sabe hacer nada de lo nuevo).
- Al elegir carpeta, comprobar que es la buena: tiene que estar vacía, o contener `index.html`,
  o contener un fichero cuyo nombre empiece por `ABRIR EL GESTOR`. Si no, una frase de error
  («Esa no parece la carpeta donde guardaste este fichero») y volver a elegir.

### 2. `js/actualizar-copia.js`

- **Primero** se lee el `version.json` remoto, haya o no carpeta y permiso. Si su `version` es
  igual a `App.VERSION`, no se hace nada más (ni se pide permiso ni se toca el disco).
- Si es distinta:
  - con carpeta guardada y permiso: actualizar solo, como hoy;
  - sin carpeta, sin permiso, o si la actualización falla: la franja de arriba descrita en «Lo
    que ve Francisco». Sustituye al aviso ámbar de abajo (`avisoPermiso`), que desaparece.
- **Evitar el bucle**: si tras la recarga `App.VERSION` sigue sin coincidir con la remota (por
  ejemplo, se escribió en otra carpeta que no es la que abre el navegador), no recargar otra vez.
  Marcarlo con `sessionStorage` antes del `location.reload()` y, si al volver la versión no
  cambió, enseñar en la franja: «He actualizado la carpeta **nombre**, pero esta ventana abre
  otra copia. Abre la aplicación desde la carpeta **nombre**.» y borrar la carpeta guardada.
- Un ordenador que ya recibió la versión nueva por Dropbox tiene `App.VERSION` igual a la
  remota: no hace nada. El otro ordenador sigue sin tener que hacer nada.

### 3. La fila 89

La 89 ya no está bloqueada: Francisco creó el repositorio público y el secreto, y la acción
publica (commits del 21-sep-2026 en `gestor-asuntos-copia`). Marcarla **HECHA** en
`docs/COLA.md` y quitar su línea de «Qué falta» en `docs/CONTEXTO-CORTO.md`.

### 4. `docs/INSTALAR-COPIA.md`

Añadir, al final, «Si la copia se ha quedado en una versión vieja»: los mismos pasos de la
primera vez (guardar `ABRIR EL GESTOR.html` encima del que ya hay, con clic derecho → Guardar
como, y abrirlo con doble clic). Tres líneas como mucho.

## Ficheros a tocar

`js/actualizar-copia.js`, `scripts/copia-local.mjs` (la parte que escribe
`ABRIR EL GESTOR.html`), la prueba de `pruebas/` de la copia sin internet,
`docs/INSTALAR-COPIA.md`, `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` (o su
hijo) y `docs/HISTORIA.md`. Nada más. Cambios quirúrgicos.

## Pruebas (una sola tanda al final)

Con el servidor local que ya imita a `raw.githubusercontent.com` y Playwright por `file://`
(`showDirectoryPicker` se puede sustituir en la prueba por una función que devuelva la carpeta):

- Copia con `App.VERSION` vieja y **sin carpeta guardada**: sale la franja; «Actualizar ahora»
  pide la carpeta, actualiza y recarga; después, la versión es la nueva y no hay franja.
- Copia vieja **con carpeta y sin permiso**: sale la franja; el botón pide permiso y actualiza.
- Copia al día: ni franja ni petición de permiso.
- Servidor apagado: arranca con el aviso discreto de siempre.
- Carpeta equivocada: no recarga en bucle; sale el mensaje de «esta ventana abre otra copia».
- `ABRIR EL GESTOR.html` sobre una copia vieja ya instalada: la actualiza y abre `index.html`.
- `npm test` en verde, y la versión web (`http://`) sin cambios.

## Mensaje final a Francisco

Dos o tres frases. Y, como su copia de hoy es la vieja, **los pasos exactos para rescatarla una
vez**, uno por línea, diciendo dónde está cada botón: abrir la dirección de
`ABRIR EL GESTOR.html` en `raw.githubusercontent.com`, clic derecho → Guardar como, guardarlo en
su carpeta de la copia encima del que hay, abrirlo con doble clic, elegir esa misma carpeta si lo
pide. Y qué versión tiene que leer después en la cabecera.
