# Refresco de pantalla tras una acción que guarda

Acordado con Francisco el 17-sep-2026. Fila 23 de `docs/COLA.md`.

## El fallo, con sus palabras

> Cuando cambiamos de estado de un asunto, cuando marcamos un paso de la guía como realizado o
> cuando damos al botón de archivar el asunto, la pantalla tiene un comportamiento extraño,
> dándonos la apariencia de que no se ha realizado la acción. Pero si salimos y volvemos a
> entrar vemos que sí se ha realizado.

O sea: el dato se guarda bien. Lo que falla es que la pantalla no se vuelve a pintar con lo
recién guardado, y quien lo usa cree que la acción no ha ido.

## Qué hay que conseguir

Tres acciones, y en las tres lo mismo: **al terminar de guardar, la pantalla enseña ya el
resultado, sin que haya que salir y volver a entrar.**

1. **Cambiar el estado de un asunto.** La ficha y la tarjeta de la lista muestran el estado
   nuevo en cuanto se guarda. Si el estado nuevo hace que el asunto salga del filtro puesto,
   la lista se recoloca sola.
2. **Marcar un paso de la guía / un hito como realizado.** El hito queda marcado a la vista,
   con su fecha y su responsable, y la cuenta de pendientes de la ficha baja. Si la pantalla
   "Qué me toca" está detrás, tiene que quedar al día cuando se vuelva a ella.
3. **Archivar un asunto.** El asunto desaparece de "Asuntos abiertos" en cuanto se archiva, sin
   necesidad de recargar, y las cuentas de la cabecera cuadran.

Además, en las tres: **mientras se guarda, el botón se queda un momento en "Guardando…" y no se
deja pulsar otra vez.** Así se ve que la aplicación está haciendo algo. Si el guardado falla,
aviso claro y la pantalla se queda como estaba, sin cambios a medias.

## Cómo hacerlo

- Busca primero **la causa de verdad**, no la tapes con un `location.reload()`: puede ser que la
  función que pinta se llame antes de que termine el guardado, que se pinte a partir de una copia
  en memoria que no se ha actualizado, o que el fichero compartido se vuelva a leer de una caché
  vieja. Deja escrito en `docs/HISTORIA.md` qué era.
- La regla que debe quedar para siempre: **cada acción que escribe en `_GESTOR` termina
  actualizando el dato en memoria y llamando a quien pinta esa pantalla**, en ese orden y
  esperando al guardado (`await`).
- Mira si el mismo fallo está en otras acciones de la ficha (fecha límite, vía de comunicación,
  responsable de un hito, notas). Si es el mismo problema y se arregla en el mismo sitio,
  arréglalo también. Si pide un cambio aparte, no lo hagas: apúntalo en `docs/COLA.md`.

## Ficheros donde mirar

Empieza por estos, no por todo el repositorio:

- `js/ficha-asunto.js` — estado, fecha límite y botón de archivar.
- `js/asuntos-lista.js` y `js/vista.js` — las tarjetas de "Asuntos abiertos".
- `js/hitos-panel.js`, `js/hitos-panel-lista.js`, `js/hitos.js` — marcar un hito como hecho.
- `js/hitos-archivo.js` — lo que pasa al archivar con los hitos.
- `js/que-me-toca.js` — la pantalla que cruza los hitos pendientes.
- `js/datos.js` y `js/almacen.js` — dónde se guarda y qué se queda en memoria.

Si alguno de esos ficheros pasa de unas 400 líneas y hay que tocarlo a fondo, pártelo en dos.

## Cómo lo compruebas tú

- Una prueba automática nueva en `pruebas/` que deje claro que, después de guardar, la función
  que pinta se ha llamado y con el dato nuevo. Una por cada una de las tres acciones.
- La batería completa (`npm test`) en verde antes de subir.
- Comprueba lo publicado con `curl`, como siempre.

## Reglas de esta instrucción

- Cambios quirúrgicos: toca lo justo, no reescribas ficheros enteros.
- No leas el repositorio entero. Lee `docs/CONTEXTO.md` y los ficheros de la lista de arriba.
- **Sube directamente a `main`, sin abrir ninguna pull request** (si la sesión es de las de la
  nube y no puede, vale el pull request con el permiso de fusión de la nota final de la cola).
- Una sola tanda de pruebas al final, no una después de cada cambio.
- Al terminar: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` sustituyendo la línea
  vieja, y anota en `docs/HISTORIA.md` qué era el fallo.
