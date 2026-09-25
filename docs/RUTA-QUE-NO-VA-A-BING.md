# Fila 152 — El botón «Ruta» que no acaba en Bing, y también en los cuadros de Comunicar

Diseño cerrado con Francisco el 25-sep-2026. Continúa la fila 98
(`docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md`, `js/copiar-ruta.js`).

## Qué pasa hoy

Francisco copia la ruta con el botón «Ruta» de la ficha del asunto y la pega en la barra del
**navegador**. A veces sale una búsqueda de Bing en lugar de la carpeta.

Causa (revisada en `js/copiar-ruta.js`, función `de`): cuando en ese navegador no hay ruta
apuntada, el botón copia **solo el nombre de la carpeta**. El navegador no lo reconoce como
carpeta y lo busca en internet. Pasa:

- en el ordenador del compañero, que no ha apuntado sus rutas;
- en la copia sin internet (`file://`): es otro origen para el navegador, con su propio
  `localStorage`, así que ahí tampoco hay ruta apuntada;
- el aviso ámbar que sale hoy se va enseguida y no se ve.

## Cómo tiene que quedar

### 1. Sin ruta apuntada, no se copia nada a medias

- Si falta la ruta que toca (abiertos o ARCHIVO, según el asunto), el botón **no copia el
  nombre suelto**. Pide la ruta en ese momento: un campo, la misma nota que en Ajustes («Cópiala
  de la barra del explorador de archivos») y «Guardar y copiar».
- Al guardar: se guarda con `RutaCarpetas.guardar` (el mismo `localStorage` que Ajustes → El
  centro), y se copia ya la ruta completa.
- **Solo hay una capa de diálogo** (`U.preguntar`, regla del repositorio). Desde la ficha del
  asunto, donde no hay ningún cuadro abierto, se puede usar `U.preguntar`. Desde dentro del cuadro
  de Correo o de Séneca (punto 3), **no**: allí el campo sale en línea, dentro del propio cuadro,
  debajo del botón, y desaparece al guardar. No se pierde nada de lo escrito en el cuadro.
- Una sola función para las dos formas; no duplicar.

### 2. Se copia en formato `file:///`, que el navegador siempre abre como carpeta

- `C:\Users\x\Dropbox\ASUNTOS ABIERTOS\...` → `file:///C:/Users/x/Dropbox/ASUNTOS%20ABIERTOS/...`
- `\\servidor\recurso\...` → `file://servidor/recurso/...`
- `/home/...` (Chromebook, Mac, Linux) → `file:///home/...`
- Cada trozo de la ruta, codificado (espacios, `#`, `%`, `?`, acentos, comas): con
  `encodeURIComponent` por trozo o equivalente. Un `#` sin codificar corta la ruta.
- El explorador de Windows también acepta esta forma en su barra, así que sirve para los dos.
- En Ajustes → El centro, la ruta se sigue apuntando como siempre (`C:\...`). La conversión se
  hace solo al copiar. Si alguien ya apuntó una ruta que empieza por `file:`, se respeta tal cual
  y solo se le añade lo de detrás, codificado.
- Actualizar el `title` del botón y la nota del bloque de Ajustes: «para pegarla en el navegador
  o en el explorador de archivos».

### 3. El botón «Ruta» también en los cuadros de Comunicar

- En el cuadro de **Correo electrónico** y en el de **Mensaje de Séneca** (iPasen es el mensaje de
  Séneca; no es una vía nueva). Arriba, junto al título del cuadro, pequeño, con la clase
  `boton-copiar-fila`.
- Tiene que salir abra el cuadro desde donde lo abra: la ficha del asunto y «Comunicar ▾» de la
  mesa del hito. Los dos acaban en `js/correo.js`, `abrirCuadro(a, deSeneca, extra)`: ponerlo ahí
  o en lo que pinta la cabecera de cada cuadro, una sola vez.
- El modo (abierto / archivado) sale del asunto, igual que en `js/ficha-nombre-acciones.js`. Si
  en el cuadro no se sabe, se calcula igual que allí; no inventar otra regla.
- Cuidado con la fila 151 (`docs/PLANTILLA-DESDE-EL-CUADRO.md`), que va antes y toca los mismos
  cuadros: el botón no puede chocar con «Crear plantilla» / «Editar plantilla» ni con el editor
  que se abre dentro del cuadro.

## Ficheros que hay que tocar

- `js/copiar-ruta.js` (formato `file:///`, pedir la ruta si falta, `boton(a, modo, opciones)` con
  una opción para el modo en línea)
- `js/correo.js` y/o `js/correo-cuadro.js` y `js/seneca-cuadro.js` (el botón en la cabecera del
  cuadro)
- `js/ficha-nombre-acciones.js` solo si cambia la llamada a `RutaCarpetas.boton`
- `css/correo.css` y `css/seneca.css` si hace falta
- `pruebas/copiar-ruta.mjs` (ampliarla; no hacer una nueva)
- Al cerrar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md` (línea del botón «Ruta» en la sección 5,
  sustituyéndola), `docs/contexto/CORREO-Y-SENECA.md`, el hijo de `docs/contexto/` donde esté
  descrito el botón «Ruta», `docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md` (una línea que remita a este
  documento) y `docs/HISTORIA.md`

Si alguno de estos ficheros pasa de 600 líneas al tocarlo, se parte por temas.

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión lo tiene forzado, la
  nota de `docs/COLA.md` sobre fusionar sola se aplica).
- Cambios quirúrgicos: no reescribas ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, `docs/contexto/CORREO-Y-SENECA.md` y
  `js/copiar-ruta.js` bastan.
- Una sola prueba al final, ampliando `pruebas/copiar-ruta.mjs`, en navegador de verdad:
  - la conversión a `file:///` con rutas de Windows, de red (`\\`) y de Linux, con espacios, `#`,
    coma y acentos; y que Chromium **abre de verdad** una carpeta de prueba con esos caracteres
    al navegar a la ruta copiada (no una búsqueda);
  - sin ruta apuntada: desde la ficha pide la ruta, al guardar copia la completa y queda
    guardada; desde el cuadro de Séneca, el campo sale en línea y no se pierde el cuerpo ni el
    «Para»;
  - el botón sale en el cuadro de Correo y en el de Séneca, abiertos desde la ficha y desde la
    mesa del hito;
  - que siga en verde `pruebas/seneca-cuadro-ancho.mjs`.

## Qué verá Francisco

- El botón «Ruta» también arriba en el cuadro de Correo y en el de Mensaje de Séneca.
- Lo copiado empieza por `file:///`. Pegado en el navegador, abre la carpeta; nunca Bing.
- Si en ese ordenador o en la copia sin internet falta la ruta, se la pide una vez allí mismo.
