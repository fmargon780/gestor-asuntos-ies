# Fila 161 — El botón «Ruta» deduce la ruta y no pregunta (PRIORITARIA)

Diseño cerrado con Francisco el 25-sep-2026. **Va delante de todo lo pendiente.** Corrige la
fila 152 (`docs/RUTA-QUE-NO-VA-A-BING.md`, `js/copiar-ruta.js`).

## Qué pasa hoy

En la copia sin internet (`file:///C:/Users/Propietario/Dropbox/ADMINISTRACIÓN/REGISTROS/Gestor
de Asuntos - aplicación/index.html`), al pulsar «Ruta» sale el cuadro «Ruta de la carpeta» con un
campo vacío. Francisco no sabe qué poner, y el cuadro no dice si pide la carpeta de abiertos o la
del ARCHIVO. La ruta se guarda en `localStorage`, que es distinto en cada navegador, en cada
ordenador y en la web frente a la copia sin internet: se pregunta demasiadas veces.

## La idea

La ruta de una carpeta tiene dos partes:

1. **Dónde está Dropbox en este ordenador**, por ejemplo `C:\Users\Propietario\Dropbox`. Cambia en
   cada ordenador.
2. **Dónde está la carpeta dentro de Dropbox**, por ejemplo `ADMINISTRACIÓN\...\ASUNTOS ABIERTOS`.
   Es **igual en los dos ordenadores**, porque el Dropbox es compartido.

## Cómo tiene que quedar

### 1. La parte de dentro de Dropbox, una vez para todo el centro

- Se guarda en `_GESTOR/rutas.json`: `{ "abiertos": "ADMINISTRACIÓN/.../ASUNTOS ABIERTOS",
  "archivo": "ADMINISTRACIÓN/.../ARCHIVO" }`, siempre con `/`. Es un fichero pequeño de ajustes:
  mismo patrón que `_GESTOR/margenes-pdf.json` en `js/ajustes-centro.js` (releer antes de guardar,
  compartido con el compañero).
- **Se rellena sola** si en algún `localStorage` de este navegador ya hay una ruta completa
  (`gestor-ruta-abiertos` / `gestor-ruta-archivo`) que contiene un trozo llamado `Dropbox` (o que
  empieza por `Dropbox (`, como `Dropbox (Personal)`): lo de detrás de ese trozo es la parte común.
  Se guarda en `rutas.json` si todavía no tiene esa clave.
- Comprobación: el último trozo de la parte común tiene que llamarse igual que la carpeta
  señalada (el nombre del manejador de abiertos o del ARCHIVO). Si no coincide, no se usa.

### 2. Dónde está Dropbox en este ordenador, deducido

- **En la copia sin internet** (`location.protocol === 'file:'`): de su propia dirección. Se
  descodifica `location.pathname` (`decodeURIComponent`), se corta en el primer trozo llamado
  `Dropbox` o que empieza por `Dropbox (`, y eso es la parte de este ordenador. Nunca se pregunta.
- **En la web**: `localStorage` (`gestor-ruta-dropbox`). Si no está pero hay una ruta completa
  antigua en `localStorage`, se saca de ella (lo de delante del trozo `Dropbox`).
- Ruta final = parte de este ordenador + parte común + lo de detrás (como hoy), en `file:///`
  (lo de la fila 152 no cambia).

### 3. Preguntar solo si no hay más remedio, y claro

- Solo si falta la parte de este ordenador (solo puede pasar en la web) o la parte común (una sola
  vez para todo el centro, también en la copia sin internet).
- El cuadro dice **qué carpeta pide, por su nombre**: «Pega la ruta de la carpeta **ASUNTOS
  ABIERTOS** (o **ARCHIVO**) de este ordenador», con un ejemplo real si ya se conoce la parte
  común: `C:\Users\tu usuario\Dropbox\ADMINISTRACIÓN\...\ASUNTOS ABIERTOS`. Y una línea de cómo
  sacarla: «En el explorador de archivos, abre esa carpeta, pulsa en la barra de arriba y copia».
- Al guardar, se parte por el trozo `Dropbox`: la parte de delante va a `localStorage`, la de
  detrás a `rutas.json` (si no estaba). Así el compañero ya no tiene que dar la parte común.
- Si la ruta pegada no tiene ningún trozo `Dropbox`, se guarda entera en `localStorage` como hoy
  (caso raro; no se rompe nada).
- Se mantiene lo de la fila 152: desde la ficha con `U.preguntar`, desde el cuadro de Correo o de
  Séneca en línea.

### 4. Ajustes → El centro → «Rutas de las carpetas»

- «Dentro de Dropbox (para todo el centro)»: abiertos y ARCHIVO, editables.
- «Dropbox en este ordenador»: en la copia sin internet, se muestra lo deducido, sin campo; en la
  web, editable.
- Se quitan los dos campos antiguos de ruta completa; su valor se aprovecha como en el punto 1.

## Ficheros que hay que tocar

- `js/copiar-ruta.js` (si pasa de 600 líneas, partir: por ejemplo `js/copiar-ruta-ajustes.js`
  para el bloque de Ajustes)
- `js/ajustes-centro.js` solo si hace falta para leer o guardar `rutas.json`
- `pruebas/copiar-ruta.mjs` (ampliarla; no hacer una nueva)
- Al cerrar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md` (sustituir la línea del botón «Ruta»), el
  hijo de `docs/contexto/` donde esté el botón «Ruta», `docs/RUTA-QUE-NO-VA-A-BING.md` (una línea
  que remita a este) y `docs/HISTORIA.md`

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión lo tiene forzado, la
  nota de `docs/COLA.md` sobre fusionar sola se aplica).
- Cambios quirúrgicos: no reescribas ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, `js/copiar-ruta.js` y el trozo de
  `margenes-pdf.json` de `js/ajustes-centro.js` bastan.
- Una sola prueba al final, ampliando `pruebas/copiar-ruta.mjs`:
  - servida como `file://` desde una carpeta `.../Dropbox/ADMINISTRACIÓN/REGISTROS/Gestor de
    Asuntos - aplicación/`, con `rutas.json` relleno: «Ruta» copia la ruta completa **sin abrir
    ningún cuadro**;
  - `Dropbox (Personal)` y acentos en la dirección;
  - en la web con una ruta completa antigua en `localStorage`: no pregunta, y `rutas.json` queda
    relleno;
  - en la web sin nada: el cuadro nombra la carpeta; al pegar una ruta con `Dropbox`, se parte
    bien en las dos mitades;
  - que siga en verde todo lo de la fila 152 que ya prueba ese fichero.

## Qué verá Francisco

- En la copia sin internet, «Ruta» copia y no pregunta nada (una vez rellena la parte común, que
  sale sola si alguna vez apuntó la ruta en la web; si no, se pregunta una sola vez para siempre).
- En la web, como mucho una pregunta por ordenador, diciendo qué carpeta pide.
