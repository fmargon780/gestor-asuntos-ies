# Los hitos son la guía, no un añadido

Acordado con Francisco el 17-sep-2026, después de ver en pantalla el resultado de la fila 15
(`docs/HITOS.md`). Corrige un malentendido de diseño, no es una función nueva.

## El problema

Al abrir un asunto se ven **dos zonas**: la guía del procedimiento como texto con casillas, y
debajo un bloque aparte que invita a crear o añadir hitos a mano.

Francisco nunca quiso dos cosas. Quiso una: **los pasos de la guía son los hitos**. No debe
existir "la guía" por un lado y "los hitos" por otro.

## Cómo tiene que quedar

1. Al abrir la ficha de un asunto **abierto** cuyo tipo tiene guía y que todavía no tiene hitos,
   los hitos se crean **solos** a partir de los pasos de esa guía. Sin botón, sin preguntar.
   Vale igual para los asuntos recién creados y para los que ya estaban abiertos antes.
2. Lo que el asunto ya tuviera marcado (`pasosHechos`, `pasosElegidos` de `asuntos.json`) se
   respeta al crearlos.
3. La guía **deja de pintarse como texto con casillas** en la ficha. En su sitio queda solo la
   lista de hitos.
4. El bloque se titula **"Hitos"**, no "Guía del procedimiento".
5. Se conserva el enlace de escribir o cambiar la guía del tipo (el `<p class="nota">` del final).
   Escribir la guía sigue siendo donde se define el procedimiento; lo que cambia es que en el
   asunto ya no se lee como texto, se trabaja como hitos.
6. El botón **"+ Añadir un hito"** se queda, al final de esa misma lista, para un paso suelto que
   no venía en la guía.
7. Desaparecen: el botón "Crear los hitos de la guía" y el bloque de entrada `#hitos-entrada`.
8. Si el tipo del asunto **no tiene guía**, el bloque "Hitos" sale vacío con el botón
   "+ Añadir el primer hito".

## Qué ficheros hay que tocar

- `js/hitos-panel.js` — el grueso del cambio. En `repintar()`: si el asunto está abierto, no tiene
  hitos y su tipo tiene pasos de guía, llamar a
  `Hitos.crearDesdeGuiaImportando(clave, tipo, a.ficha.pasosHechos, a.ficha.pasosElegidos)` y
  repintar. Quitar `botonCrearDesdeGuia` y `pintarBloqueDeEntrada` (`#hitos-entrada`).
- `js/ficha-asunto.js` — recortar `pintarGuia`: quitar `Guias.vista`, la cuenta
  `#ficha-guia-cuenta`, las casillas `.paso-casilla`, el registro de `Guias.cuandoSeElige` y el
  `guardar({pasosHechos})`. Dejar el contenedor `#ficha-guia`, su rótulo (ahora "Hitos") y el
  `<p class="nota">` de escribir la guía. Este fichero pasa de 1.100 líneas: **pártelo**
  aprovechando que este cambio le quita trabajo.
- `css/hitos.css` y `css/guias.css` — retoques, si hacen falta.
- `js/guias.js`, `js/guias-enganche.js` y `_GESTOR/guias.json` **no se tocan**. La guía se sigue
  escribiendo igual y se sigue enseñando como recordatorio al crear un asunto (`#guia-nuevo`).

## Trampas que hay que evitar

- **Doble creación.** El observador de `hitos-panel.js` repinta cada 30 ms y `repintar()` es
  `async`: dos pasadas pueden colarse antes de que `hitos.json` esté escrito. Hace falta un
  cerrojo por clave de asunto, no basta con mirar `previos.length`.
- **Bucle del observador.** Si se mete una escritura con `await` dentro de `repintar()`, mantenla
  dentro de la ventana de `repintando` o pausa con `observadorPausar`.
- **Modo consulta y archivo.** No crear hitos solos si el asunto está archivado ni si el compañero
  tiene el mando (`aplicarModoConsulta`, `js/presencia.js`): en "solo mirar" no se escribe nada.
- **La guía puede no estar cargada todavía.** `GuiasDelCentro.pasosDe(tipo)` devuelve `[]` si
  `guias-enganche.js` aún no ha leído `guias.json`. En ese caso no crear nada y reintentar en el
  repintado siguiente; nunca marcar el asunto como "ya intentado".
- **Nombres ya cogidos**: `window.Hitos`, `window.HitosPanel`, `HitosPanelLista`,
  `window.GuiasDelCentro`, `App.abrirFicha`, `App.anotar` (ya envuelta dos veces). No cuelgues
  nada nuevo de `App`.
- Usa `U.mientrasGuarda(control, fn)` en cualquier acción que guarde y repinte.

## Pruebas

- `pruebas/guias.mjs` y `pruebas/opciones.mjs` se rompen enteras (esperan `.paso-casilla`,
  `.guia-opcion`, `.guia-rama` y la cuenta de pasos dentro de `#ficha-guia`). Reescríbelas contra
  el cuadro de escribir la guía y contra los hitos.
- `pruebas/hitos.mjs` rompe en el escenario 2 y en `abrirFicha()` (esperan el botón "Crear los
  hitos de la guía" y `#hitos-entrada`). Ajústala a la creación automática.
- Añade una prueba de que abrir dos veces seguidas la misma ficha **no** duplica los hitos.
- Una sola pasada de la batería completa al final, no después de cada cambio.

## Cómo publicar

- Cambios quirúrgicos. No releas el repositorio entero: te basta con este documento,
  `docs/CONTEXTO.md` y los ficheros citados aquí.
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si tu sesión no puede tocar
  `main`, abre la pull request y **fusiónala tú mismo** en cuanto esté en verde y sin conflictos
  (permiso permanente de Francisco, ver el final de `docs/COLA.md`).
- Comprueba lo publicado con `curl` después de fusionar.
- Al terminar: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea
  vieja** (la línea de hitos de la sección 5 y la de la guía deja de ser verdad) y anota en
  `docs/HISTORIA.md` lo que merezca recordarse.
