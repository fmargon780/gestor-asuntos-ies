# El tablón no se borra mientras se escribe (fallo urgente)

Acordado con Francisco el 17-sep-2026, después de probar la aplicación publicada.

**Es un fallo, no una mejora. Va la primera de la cola.**

## Qué pasa

Francisco empieza a escribir una nota en el tablón. Si tarda más de unos segundos, la pantalla
da un salto ("vibra") y lo escrito desaparece antes de haberlo pegado. Con el compañero también
usando la aplicación, esto le pasa cada pocos segundos.

## De dónde viene

De la fila 24 (`js/presencia.js`). Al final de ese fichero, la envoltura de
`App.vigilarLaCarpeta` monta un `setInterval` de 10 segundos que hace:

    Presencia.refrescarCache().then(function () { ... App.pintarAbiertos(); });

Ese repintado se dispara **siempre**, haya cambiado algo o no, y sin mirar si el usuario está
escribiendo. El tablón (`<aside id="tablon">`) vive dentro de `#pantalla-abiertos`, así que el
repintado se lleva por delante el `<textarea id="tablon-texto">` a medio escribir.

`js/tablon.js` ya se defendía de esto a medias: `pintar()` guarda el valor del campo antes de
volver a montarlo, y la envoltura de `Gestor.alRefrescar` no relee el fichero si el campo tiene
el foco. No basta: el repintado viene por otro camino (`App.pintarAbiertos`), y ni el foco ni la
posición del cursor se recuperan.

## Qué hay que hacer

### 1. `js/presencia.js` — repintar solo cuando de verdad cambie algo

En el `setInterval` de la envoltura de `App.vigilarLaCarpeta`:

- Guarda una **huella** de lo que hay en la caché de presencia después de cada lectura: las
  claves vigentes y el usuario de cada una, ordenadas y pegadas en un texto.
- Llama a `App.pintarAbiertos()` **solo si esa huella ha cambiado** respecto a la última vez que
  se pintó por este camino. Si nadie ha entrado ni salido de ningún asunto, no se toca la
  pantalla.
- Guarda también la huella en el primer repintado (el que va justo después de
  `refrescarCache()`, fuera del intervalo), para que el primer ciclo no repinte por nada.
- Añade una segunda barrera: **si el foco está dentro de un `input`, un `textarea`, un `select` o
  algo con `contenteditable`, no se repinta esta vuelta**, aunque la huella haya cambiado. Se
  deja la huella sin actualizar, para que se repinte en la siguiente vuelta en que ya no se esté
  escribiendo.

La caché vive dentro del módulo; expón lo que necesites (por ejemplo una función `huella()` en el
objeto que devuelve `Presencia`) en vez de leer la variable desde fuera.

### 2. `js/tablon.js` — que lo escrito no se pierda nunca

- Guarda lo que se está escribiendo en **variables del módulo** (por ejemplo `borrador` y
  `borradorFecha`), actualizadas con el evento `input` del `<textarea>` y con el `change` del
  campo de fecha. Hoy solo se lee del DOM justo antes de repintar: si la columna entera la
  destruye otro (`App.pintarAbiertos`), no hay nada que leer y el texto se pierde.
- Al pintar el formulario, rellénalo desde esas variables cuando el DOM no tenga ya un valor.
- Al vaciar el campo después de "Pegar la nota", vacía también las dos variables.
- **Conserva el foco y el cursor**: si al empezar a pintar el `<textarea>` era
  `document.activeElement`, apunta `selectionStart` y `selectionEnd`, y al terminar devuélvele el
  foco y la misma posición. Lo mismo sirve para el `<textarea>` de una nota que se está
  cambiando (`editando`).
- Mejor aún si el formulario no se vuelve a montar cuando ya existe: reutilízalo y cambia solo lo
  que haga falta (el botón de color elegido). Hazlo si sale limpio; si complica el fichero, con lo
  de arriba basta.

## Cómo se prueba

Una sola pasada de la batería al final, no una comprobación después de cada cambio.

Prueba nueva, en navegador de verdad, con el disco de mentira de `pruebas/navegador.mjs`:

1. Entrar en Asuntos abiertos, escribir un texto en `#tablon-texto` y dejarle el foco.
2. Llamar a `App.pintarAbiertos()` dos veces seguidas (es lo que hace el intervalo de presencia).
3. Comprobar que `#tablon-texto` sigue teniendo el mismo texto, que sigue siendo
   `document.activeElement` y que el cursor está donde estaba.
4. Comprobar que, con la caché de presencia igual que antes, el intervalo **no** llama a
   `App.pintarAbiertos()`.

Comprueba antes que la prueba falla sin el arreglo.

## Reglas de esta instrucción

- Ficheros que hay que tocar: **`js/presencia.js`**, **`js/tablon.js`**, la prueba nueva y la fila
  de `docs/COLA.md`. Nada más.
- Cambios quirúrgicos. No reescribas ninguno de los dos ficheros entero.
- `js/tablon.js` ronda las 440 líneas, pero **no hay que partirlo** en esta fila: el arreglo es
  pequeño y urgente, y partirlo ahora añade riesgo sin ganar nada.
- No leas el repositorio entero. Con `docs/CONTEXTO.md`, los dos ficheros de arriba y
  `js/asuntos-lista.js` (solo para ver qué hace `App.pintarAbiertos` con el `<aside>`) es
  suficiente.
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si esta sesión no tiene permiso
  para tocar `main`, abre la pull request y **fusiónala tú mismo** en cuanto la batería esté en
  verde y no haya conflictos (permiso permanente de Francisco, al final de `docs/COLA.md`).
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
- Al terminar: fila a HECHA en `docs/COLA.md`, línea vieja sustituida en `docs/CONTEXTO-CORTO.md`
  y `docs/CONTEXTO.md`, y lo que merezca recordarse en `docs/HISTORIA.md`.
