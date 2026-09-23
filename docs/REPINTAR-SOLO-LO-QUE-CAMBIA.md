# Fila 101 — Repintar solo lo que ha cambiado

Acordado con Francisco el 23-sep-2026. Tercera de tres (99, 100 y 101). Va **después** de la 100.

## El problema

Tras guardar, la aplicación repinta casi todo. Cambiar el estado desde la ficha provoca entre 30 y
40 lecturas de disco: la lista entera aunque esté oculta, unos 15 enganches de `alRefrescar`, y la
ficha entera (huella, sellos con un `getFile` por PDF, documentos, «otros del tercero», panel de
hitos). Mientras, la pantalla parece congelada. Y hay repintados viejos que llegan tarde y pintan
encima del bueno.

## Reglas de trabajo

- Sube directamente a `main`, sin abrir ninguna pull request.
- Cambios quirúrgicos. No leas el repositorio entero: solo la lista de abajo.
- Si un fichero que toques a fondo pasa de unas 400 líneas, pártelo en dos.
- Una sola prueba al final.
- No toques la arquitectura de módulos y envolturas (descartado, `CONTEXTO-CORTO.md` sección 7).

## Qué hay que hacer

1. **La lista no se repinta si no se ve.** `App.ponerEstado` (`js/asuntos-lista.js:197`) y
   otros llaman a `App.pintarAbiertos` con la ficha delante. Si la pantalla de la lista está
   oculta, se marca «pendiente» y se pinta al volver a ella.
2. **Los enganches de `alRefrescar` no leen del disco en cada repintado.** `avisarALosModulos`
   (`js/puente.js:68`) los lanza todos. Que-me-toca y hitos-ajustes leen `hitos.json` cada vez;
   avisos-que-faltan recorre la papelera midiendo ficheros (`js/avisos-que-faltan.js:170`).
   Los que no están a la vista, se saltan o usan lo que ya hay en memoria.
3. **Tras cambiar estado, plazo, vía o encargado, se repinta solo la cabecera de acciones** de
   la ficha, no la ficha entera. Una función `App.repintarAccionesFicha()` que también vuelve a
   apuntar la huella (`huellaPintada`).
4. **Marcar un hito que cambia el estado del asunto actualiza la cabecera.** Hoy
   `aplicarEstadoDelHito` (`js/hitos.js:291-298`) escribe el estado y la ficha solo repinta el
   panel de hitos (`js/hitos-panel-lista.js:154-159`): el desplegable sigue con el estado viejo, y
   más tarde la ficha entera se rehace de golpe. Llamar a `App.repintarAccionesFicha()`. Igual
   al añadir o quitar relacionados (`js/relacionados.js:440, 459-460`).
5. **El último repintado gana.** Un contador de turno que se incrementa en cada llamada y aborta
   la pasada tras cada `await` si ya no es la última, en:
   `repintar()` de `js/hitos-panel.js:157-231`, `App.verAbiertos` (`js/asuntos-lista.js:13`) y
   `pintarSueltos` (`js/documentos-sueltos.js:29-73`, hoy salen tarjetas repetidas; montar la
   lista aparte y cambiarla de una vez).
6. **El observador de plantillas.** `js/plantillas-documento.js:256-258` observa toda la pantalla
   y lee `plantillas.json` sin caché (`js/plantillas.js:157`) en cada tanda de cambios. Caché en
   memoria (se invalida al guardar plantillas) y un pequeño retraso en `ponerBoton`.
7. **Aviso de consulta duplicado.** `Presencia.actualizar` llama a `onCambio` cada 10 s
   (`js/presencia.js:140-143`) y `pintarPresencia` añade texto y botón sin vaciar la caja
   (`js/ficha-asunto.js:417-438`). Vaciar antes de pintar, y avisar solo cuando cambia el modo.

## De paso (fallos pequeños encontrados en la revisión)

- `filasHtml` (`js/ficha-asunto.js:281`) ignora su segundo parámetro: la fila «Formularios» no se
  pinta nunca.
- `js/formularios.js:238`: `Hitos.hitosDe(datos, nombre)` devuelve una promesa y se usa como si
  no; los formularios apuntados en los hitos no aparecen. Falta el `await`.

## Ficheros que hay que tocar

`js/asuntos-lista.js`, `js/puente.js`, `js/que-me-toca.js`, `js/hitos-ajustes.js`,
`js/avisos-que-faltan.js`, `js/ficha-asunto.js`, `js/hitos.js`, `js/hitos-panel.js`,
`js/hitos-panel-lista.js`, `js/relacionados.js`, `js/documentos-sueltos.js`,
`js/plantillas-documento.js`, `js/plantillas.js`, `js/presencia.js`, `js/formularios.js`.
Prueba nueva en `pruebas/`.

## Cómo se comprueba

Una sola prueba que cuente lecturas del disco simulado: cambiar el estado con la ficha abierta
hace, como mucho, la relectura de `asuntos.json` y su escritura, sin listar carpetas ni leer
`hitos.json` ni `plantillas.json`. Y marcar un hito con estado asociado deja el desplegable de
estado de la cabecera con el valor nuevo.

## Al terminar

Regla nueva en `docs/CONTEXTO-CORTO.md`, sección 6: tras guardar se repinta solo lo que ha
cambiado y está a la vista; todo repintado asíncrono lleva contador de turno. Causa en
`docs/HISTORIA.md`.
